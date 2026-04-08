"""Tests for event registration/unregistration endpoints.

Uses a FakeRegistrationService injected via dependency override so tests
run without external services.
"""

from datetime import UTC
from uuid import UUID, uuid4

import pytest
from fastapi.testclient import TestClient

from luma.api.deps import get_current_user_id
from luma.api.routes import events as events_routes
from luma.main import app
from luma.services.registration_service import RegistrationError

# ── helpers ──────────────────────────────────────────────────────────

EVENT_ID = uuid4()
ORGANIZER_USER_ID = 1
ATTENDEE_USER_ID = 2


class FakeRegistrationService:
    """Stub that returns pre-configured results for register/unregister."""

    def __init__(
        self,
        *,
        register_result: int | None = None,
        register_error: RegistrationError | None = None,
        unregister_result: int | None = None,
        unregister_error: RegistrationError | None = None,
        is_registered_result: bool = False,
        registered_event_ids_result: set[UUID] | None = None,
    ) -> None:
        self._register_result = register_result
        self._register_error = register_error
        self._unregister_result = unregister_result
        self._unregister_error = unregister_error
        self._is_registered_result = is_registered_result
        self._registered_event_ids_result = registered_event_ids_result or set()

    async def get_registered_event_ids(self, user_id, event_ids):
        return self._registered_event_ids_result

    async def is_registered(self, event_id, user_id):
        return self._is_registered_result

    async def register(self, event_id, user_id):
        if self._register_error:
            raise self._register_error
        return self._register_result

    async def unregister(self, event_id, user_id):
        if self._unregister_error:
            raise self._unregister_error
        return self._unregister_result


# ── fixtures ─────────────────────────────────────────────────────────


@pytest.fixture(autouse=True)
def _clear_overrides():
    app.dependency_overrides = {}
    yield
    app.dependency_overrides = {}


def _override_auth(user_id: int):
    app.dependency_overrides[get_current_user_id] = lambda: user_id


def _override_optional_auth(user_id: int | None):
    app.dependency_overrides[events_routes.get_optional_current_user_id] = lambda: user_id


def _override_service(service: FakeRegistrationService):
    app.dependency_overrides[events_routes._get_registration_service] = lambda: service


class FakeEventService:
    def __init__(self, events=None, event=None):
        self.events = events or []
        self.event = event

    async def list_events(self, **kwargs):
        return self.events, len(self.events)

    async def get_event(self, event_id):
        return self.event


def _override_event_service(service: FakeEventService):
    app.dependency_overrides[events_routes._get_service] = lambda: service


# ── register ─────────────────────────────────────────────────────────


def test_register_success() -> None:
    """User registers for an event → 200, currentParticipants increments."""
    _override_auth(ATTENDEE_USER_ID)
    _override_service(FakeRegistrationService(register_result=1))

    client = TestClient(app)
    response = client.post(f"/api/v1/events/{EVENT_ID}/register")

    assert response.status_code == 200
    assert response.json()["currentParticipants"] == 1


def test_register_event_not_found() -> None:
    """Registering for a nonexistent event → 404."""
    _override_auth(ATTENDEE_USER_ID)
    _override_service(
        FakeRegistrationService(
            register_error=RegistrationError("Event not found", status_code=404)
        )
    )

    client = TestClient(app)
    response = client.post(f"/api/v1/events/{uuid4()}/register")

    assert response.status_code == 404
    assert response.json()["detail"] == "Event not found"


def test_register_organizer_blocked() -> None:
    """Organizer cannot register for their own event → 400."""
    _override_auth(ORGANIZER_USER_ID)
    _override_service(
        FakeRegistrationService(
            register_error=RegistrationError("Organizers cannot register for their own events")
        )
    )

    client = TestClient(app)
    response = client.post(f"/api/v1/events/{EVENT_ID}/register")

    assert response.status_code == 400
    assert response.json()["detail"] == "Organizers cannot register for their own events"


def test_register_duplicate() -> None:
    """Duplicate registration → 409."""
    _override_auth(ATTENDEE_USER_ID)
    _override_service(
        FakeRegistrationService(
            register_error=RegistrationError(
                "Already registered for this event", status_code=409
            )
        )
    )

    client = TestClient(app)
    response = client.post(f"/api/v1/events/{EVENT_ID}/register")

    assert response.status_code == 409
    assert response.json()["detail"] == "Already registered for this event"


def test_register_at_capacity() -> None:
    """Event at capacity → 409."""
    _override_auth(ATTENDEE_USER_ID)
    _override_service(
        FakeRegistrationService(
            register_error=RegistrationError("Event is at capacity", status_code=409)
        )
    )

    client = TestClient(app)
    response = client.post(f"/api/v1/events/{EVENT_ID}/register")

    assert response.status_code == 409
    assert response.json()["detail"] == "Event is at capacity"


def test_register_unauthenticated() -> None:
    """No session cookie → 401."""
    client = TestClient(app)
    response = client.post(f"/api/v1/events/{EVENT_ID}/register")

    assert response.status_code == 401


# ── unregister ───────────────────────────────────────────────────────


def test_unregister_success() -> None:
    """User unregisters from event → 200, currentParticipants decrements."""
    _override_auth(ATTENDEE_USER_ID)
    _override_service(FakeRegistrationService(unregister_result=0))

    client = TestClient(app)
    response = client.delete(f"/api/v1/events/{EVENT_ID}/register")

    assert response.status_code == 200
    assert response.json()["currentParticipants"] == 0


def test_unregister_not_registered() -> None:
    """Unregistering when not registered → 409."""
    _override_auth(ATTENDEE_USER_ID)
    _override_service(
        FakeRegistrationService(
            unregister_error=RegistrationError(
                "Not registered for this event", status_code=409
            )
        )
    )

    client = TestClient(app)
    response = client.delete(f"/api/v1/events/{EVENT_ID}/register")

    assert response.status_code == 409
    assert response.json()["detail"] == "Not registered for this event"


def test_unregister_event_not_found() -> None:
    """Unregistering from nonexistent event → 404."""
    _override_auth(ATTENDEE_USER_ID)
    _override_service(
        FakeRegistrationService(
            unregister_error=RegistrationError("Event not found", status_code=404)
        )
    )

    client = TestClient(app)
    response = client.delete(f"/api/v1/events/{uuid4()}/register")

    assert response.status_code == 404
    assert response.json()["detail"] == "Event not found"


def test_unregister_unauthenticated() -> None:
    """No session cookie on unregister → 401."""
    client = TestClient(app)
    response = client.delete(f"/api/v1/events/{EVENT_ID}/register")

    assert response.status_code == 401


# ── list / get events with registration status ────────────────────────


def test_list_events_unauthenticated_registration_status() -> None:
    """Unauthenticated users always see isRegistered as False."""
    from datetime import datetime

    from luma.db.models.event import Event
    event = Event(
        id=EVENT_ID,
        title="Mock",
        description="Mock",
        image="",
        category="Tech",
        date="2026-03-08",
        time="18:00",
        address="",
        latitude=0,
        longitude=0,
        participant_limit=10,
        current_participants=0,
        tags=[],
        organizer_name="",
        organizer_email="a@b.c",
        user_id=ORGANIZER_USER_ID,
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC)
    )
    _override_event_service(FakeEventService(events=[event]))
    _override_optional_auth(None)
    
    client = TestClient(app)
    response = client.get("/api/v1/events")
    assert response.status_code == 200
    assert response.json()["events"][0]["isRegistered"] is False


def test_list_events_authenticated_registered() -> None:
    from datetime import datetime

    from luma.db.models.event import Event
    event = Event(
        id=EVENT_ID,
        title="Mock",
        description="Mock",
        image="",
        category="Tech",
        date="2026-03-08",
        time="18:00",
        address="",
        latitude=0,
        longitude=0,
        participant_limit=10,
        current_participants=0,
        tags=[],
        organizer_name="",
        organizer_email="a@b.c",
        user_id=ORGANIZER_USER_ID,
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC)
    )
    _override_event_service(FakeEventService(events=[event]))
    
    _override_optional_auth(ATTENDEE_USER_ID)
    _override_service(FakeRegistrationService(registered_event_ids_result={EVENT_ID}))
    
    client = TestClient(app)
    response = client.get("/api/v1/events")
    assert response.status_code == 200
    assert response.json()["events"][0]["isRegistered"] is True


def test_get_event_unauthenticated_registration_status() -> None:
    from datetime import datetime

    from luma.db.models.event import Event
    event = Event(
        id=EVENT_ID,
        title="Mock",
        description="Mock",
        image="",
        category="Tech",
        date="2026-03-08",
        time="18:00",
        address="",
        latitude=0,
        longitude=0,
        participant_limit=10,
        current_participants=0,
        tags=[],
        organizer_name="",
        organizer_email="a@b.c",
        user_id=ORGANIZER_USER_ID,
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC)
    )
    _override_event_service(FakeEventService(event=event))
    _override_optional_auth(None)
    
    client = TestClient(app)
    response = client.get(f"/api/v1/events/{EVENT_ID}")
    assert response.status_code == 200
    assert response.json()["event"]["isRegistered"] is False


def test_get_event_authenticated_registered() -> None:
    from datetime import datetime

    from luma.db.models.event import Event
    event = Event(
        id=EVENT_ID,
        title="Mock",
        description="Mock",
        image="",
        category="Tech",
        date="2026-03-08",
        time="18:00",
        address="",
        latitude=0,
        longitude=0,
        participant_limit=10,
        current_participants=0,
        tags=[],
        organizer_name="",
        organizer_email="a@b.c",
        user_id=ORGANIZER_USER_ID,
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC)
    )
    _override_event_service(FakeEventService(event=event))
    
    _override_optional_auth(ATTENDEE_USER_ID)
    _override_service(FakeRegistrationService(is_registered_result=True))
    
    client = TestClient(app)
    response = client.get(f"/api/v1/events/{EVENT_ID}")
    assert response.status_code == 200
    assert response.json()["event"]["isRegistered"] is True
