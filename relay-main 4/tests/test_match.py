"""Tests for shake-to-match endpoints.

All DB and Redis interactions are mocked so tests run without external services.
"""

import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from luma.api.deps import get_current_user_id
from luma.db.models.event import Event
from luma.db.models.user import User
from luma.db.session import get_db_session
from luma.main import app
from luma.repositories.event_repository import EventRepository
from luma.repositories.user_repository import UserRepository
from luma.services.match_service import MatchService

# ── constants ────────────────────────────────────────────────────────

_ACTIVATE_URL = "/api/v1/match/activate"
_STATUS_URL = "/api/v1/match/status"
_NEARBY_EVENT_URL = "/api/v1/match/nearby-event"

USER_ID = 1
OTHER_USER_ID = 2

_PAYLOAD = {"lat": 37.7749, "lng": -122.4194}

# ── helpers ──────────────────────────────────────────────────────────


def _make_user(user_id: int = 1, full_name: str = "Alice Test") -> MagicMock:
    u = MagicMock(spec=User)
    u.id = user_id
    u.email = f"user{user_id}@example.com"
    u.full_name = full_name
    u.is_active = True
    u.__dict__.update({"id": user_id, "email": u.email, "full_name": full_name, "is_active": True})
    return u


def _make_event() -> MagicMock:
    e = MagicMock(spec=Event)
    e.id = uuid.UUID("12345678-1234-5678-1234-567812345678")
    e.title = "Open Mic Night"
    e.category = "Music"
    e.date = "2026-03-15"
    e.time = "20:00"
    e.address = "123 Main St"
    e.latitude = 37.7749
    e.longitude = -122.4194
    return e


def _mock_db_session() -> AsyncMock:
    session = AsyncMock()
    session.add = MagicMock()
    session.commit = AsyncMock()
    session.refresh = AsyncMock()
    return session


# ── fixtures ─────────────────────────────────────────────────────────


@pytest.fixture()
def client():
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def _auth_as(user_id: int) -> None:
    async def _dep() -> int:
        return user_id

    app.dependency_overrides[get_current_user_id] = _dep


def _override_db(session) -> None:
    async def _dep():
        yield session

    app.dependency_overrides[get_db_session] = _dep


# ── POST /match/activate — unauthenticated ────────────────────────────


def test_activate_unauthenticated(client: TestClient) -> None:
    response = client.post(_ACTIVATE_URL, json=_PAYLOAD)
    assert response.status_code == 401


# ── POST /match/activate — already in pool ────────────────────────────


def test_activate_already_in_pool(client: TestClient) -> None:
    _auth_as(USER_ID)
    _override_db(_mock_db_session())

    with patch("luma.api.routes.match.match_pool.is_in_pool", new=AsyncMock(return_value=True)):
        response = client.post(_ACTIVATE_URL, json=_PAYLOAD)

    assert response.status_code == 409


# ── POST /match/activate — waiting (no nearby users) ─────────────────


def test_activate_waiting(client: TestClient) -> None:
    _auth_as(USER_ID)
    _override_db(_mock_db_session())

    with (
        patch("luma.api.routes.match.match_pool.is_in_pool", new=AsyncMock(return_value=False)),
        patch("luma.cache.match_pool.add_to_pool", new=AsyncMock()),
        patch("luma.cache.match_pool.find_nearby", new=AsyncMock(return_value=[])),
    ):
        response = client.post(_ACTIVATE_URL, json=_PAYLOAD)

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "waiting"
    assert data["expires_in"] == 15


# ── POST /match/activate — match found immediately ────────────────────


def test_activate_matched_immediately(client: TestClient) -> None:
    _auth_as(USER_ID)
    _override_db(_mock_db_session())

    current_user = _make_user(USER_ID, "Alice Test")
    other_user = _make_user(OTHER_USER_ID, "Bob Test")
    event = _make_event()

    with (
        patch("luma.api.routes.match.match_pool.is_in_pool", new=AsyncMock(return_value=False)),
        patch("luma.cache.match_pool.add_to_pool", new=AsyncMock()),
        patch("luma.cache.match_pool.find_nearby", new=AsyncMock(return_value=[OTHER_USER_ID])),
        patch("luma.cache.match_pool.acquire_lock", new=AsyncMock(return_value=True)),
        patch("luma.cache.match_pool.get_position", new=AsyncMock(return_value=(37.78, -122.41))),
        patch("luma.cache.match_pool.save_result", new=AsyncMock()),
        patch("luma.cache.match_pool.remove_from_pool", new=AsyncMock()),
        patch.object(
            UserRepository, "get_by_id",
            side_effect=AsyncMock(side_effect=[current_user, other_user]),
        ),
        patch.object(EventRepository, "find_nearest", new=AsyncMock(return_value=[event])),
    ):
        response = client.post(_ACTIVATE_URL, json=_PAYLOAD)

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "matched"
    assert data["matched_user"]["full_name"] == "Bob Test"
    assert data["suggested_event"]["title"] == "Open Mic Night"


# ── POST /match/activate — lock contention (other side wins) ──────────


def test_activate_lock_lost_returns_waiting(client: TestClient) -> None:
    _auth_as(USER_ID)
    _override_db(_mock_db_session())

    with (
        patch("luma.api.routes.match.match_pool.is_in_pool", new=AsyncMock(return_value=False)),
        patch("luma.cache.match_pool.add_to_pool", new=AsyncMock()),
        patch("luma.cache.match_pool.find_nearby", new=AsyncMock(return_value=[OTHER_USER_ID])),
        patch("luma.cache.match_pool.acquire_lock", new=AsyncMock(return_value=False)),
    ):
        response = client.post(_ACTIVATE_URL, json=_PAYLOAD)

    assert response.status_code == 200
    assert response.json()["status"] == "waiting"


# ── GET /match/status — unauthenticated ──────────────────────────────


def test_status_unauthenticated(client: TestClient) -> None:
    response = client.get(_STATUS_URL)
    assert response.status_code == 401


# ── GET /match/status — already matched ──────────────────────────────


def test_status_matched(client: TestClient) -> None:
    _auth_as(USER_ID)
    _override_db(_mock_db_session())

    stored_result = {
        "matched_user": {
            "id": OTHER_USER_ID,
            "email": "user2@example.com",
            "full_name": "Bob Test",
            "is_active": True,
        },
        "suggested_event": {
            "id": "12345678-1234-5678-1234-567812345678",
            "title": "Open Mic Night",
            "category": "Music",
            "date": "2026-03-15",
            "time": "20:00",
            "address": "123 Main St",
            "location": {"lat": 37.7749, "lng": -122.4194},
        },
    }

    with patch("luma.cache.match_pool.get_result", new=AsyncMock(return_value=stored_result)):
        response = client.get(_STATUS_URL)

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "matched"
    assert data["matched_user"]["full_name"] == "Bob Test"
    assert data["suggested_event"]["title"] == "Open Mic Night"


# ── GET /match/status — waiting ──────────────────────────────────────


def test_status_waiting(client: TestClient) -> None:
    _auth_as(USER_ID)
    _override_db(_mock_db_session())

    with (
        patch("luma.cache.match_pool.get_result", new=AsyncMock(return_value=None)),
        patch("luma.cache.match_pool.get_meta_ttl", new=AsyncMock(return_value=12)),
    ):
        response = client.get(_STATUS_URL)

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "waiting"
    assert data["expires_in"] == 12


# ── GET /match/status — timeout ──────────────────────────────────────


def test_status_timeout(client: TestClient) -> None:
    _auth_as(USER_ID)
    _override_db(_mock_db_session())

    with (
        patch("luma.cache.match_pool.get_result", new=AsyncMock(return_value=None)),
        patch("luma.cache.match_pool.get_meta_ttl", new=AsyncMock(return_value=0)),
    ):
        response = client.get(_STATUS_URL)

    assert response.status_code == 200
    assert response.json()["status"] == "timeout"


# ── DELETE /match/activate ────────────────────────────────────────────


def test_cancel_unauthenticated(client: TestClient) -> None:
    response = client.delete(_ACTIVATE_URL)
    assert response.status_code == 401


def test_cancel_success(client: TestClient) -> None:
    _auth_as(USER_ID)
    _override_db(_mock_db_session())

    with patch("luma.cache.match_pool.remove_from_pool", new=AsyncMock()) as mock_remove:
        response = client.delete(_ACTIVATE_URL)

    assert response.status_code == 200
    assert response.json()["detail"] == "Cancelled"
    mock_remove.assert_awaited_once_with(USER_ID)


def test_nearby_event_match_unauthenticated(client: TestClient) -> None:
    response = client.post(_NEARBY_EVENT_URL, json=_PAYLOAD)
    assert response.status_code == 401


def test_nearby_event_match_success(client: TestClient) -> None:
    _auth_as(USER_ID)
    _override_db(_mock_db_session())

    event = _make_event()

    with (
        patch.object(
            MatchService,
            "random_event_match",
            new=AsyncMock(
                return_value={
                    "matched": True,
                    "message": "We found a nearby event for you.",
                    "recommendedEventId": str(event.id),
                }
            ),
        ),
    ):
        response = client.post(
            _NEARBY_EVENT_URL,
            json={**_PAYLOAD, "radiusKm": 25, "candidateEventIds": [str(event.id)]},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["matched"] is True
    assert data["recommendedEventId"] == str(event.id)


# ── match result write-before-delete ordering ─────────────────────────


def test_result_written_before_pool_removal(client: TestClient) -> None:
    """Ensures save_result is called before remove_from_pool to prevent false timeouts."""
    _auth_as(USER_ID)
    _override_db(_mock_db_session())

    call_order = []
    current_user = _make_user(USER_ID, "Alice Test")
    other_user = _make_user(OTHER_USER_ID, "Bob Test")

    async def _save_result(uid, data):
        call_order.append("save_result")

    async def _remove(uid):
        call_order.append("remove_from_pool")

    with (
        patch("luma.api.routes.match.match_pool.is_in_pool", new=AsyncMock(return_value=False)),
        patch("luma.cache.match_pool.add_to_pool", new=AsyncMock()),
        patch("luma.cache.match_pool.find_nearby", new=AsyncMock(return_value=[OTHER_USER_ID])),
        patch("luma.cache.match_pool.acquire_lock", new=AsyncMock(return_value=True)),
        patch("luma.cache.match_pool.get_position", new=AsyncMock(return_value=(37.78, -122.41))),
        patch("luma.cache.match_pool.save_result", new=_save_result),
        patch("luma.cache.match_pool.remove_from_pool", new=_remove),
        patch.object(
            UserRepository, "get_by_id",
            side_effect=AsyncMock(side_effect=[current_user, other_user]),
        ),
        patch.object(EventRepository, "find_nearest", new=AsyncMock(return_value=[])),
    ):
        response = client.post(_ACTIVATE_URL, json=_PAYLOAD)

    assert response.status_code == 200
    # All save_result calls must come before any remove_from_pool call
    last_save = max(
        (i for i, v in enumerate(call_order) if v == "save_result"), default=-1
    )
    first_remove = min(
        (i for i, v in enumerate(call_order) if v == "remove_from_pool"), default=999
    )
    assert last_save < first_remove, f"Ordering violated: {call_order}"
