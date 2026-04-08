"""Tests for auth endpoints (signup / login / logout / me).

All DB and Redis interactions are mocked via FastAPI dependency overrides
so tests run without external services.
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from luma.db.models.user import User
from luma.db.session import get_db_session
from luma.main import app

# ── fixtures ────────────────────────────────────────────────────────


def _make_user(**overrides) -> User:
    defaults = {
        "id": 1,
        "email": "alice@example.com",
        "full_name": "Alice Test",
        "hashed_password": "hashed",
        "is_active": True,
    }
    defaults.update(overrides)
    user = MagicMock(spec=User)
    for k, v in defaults.items():
        setattr(user, k, v)

    # Support model_validate(user) via __dict__
    user.__dict__.update(defaults)
    return user


def _mock_session(execute_returns=None):
    """Return an AsyncMock that behaves like an AsyncSession."""
    session = AsyncMock()
    session.add = MagicMock()
    session.commit = AsyncMock()
    session.refresh = AsyncMock()

    if execute_returns is not None:
        results = []
        for ret in execute_returns:
            mock_result = MagicMock()
            mock_result.scalar_one_or_none.return_value = ret
            results.append(mock_result)
        session.execute = AsyncMock(side_effect=results)

    return session


@pytest.fixture()
def client():
    """TestClient with DB session overridden."""
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def _override_db(session):
    async def _override():
        yield session

    app.dependency_overrides[get_db_session] = _override


# ── helpers ──────────────────────────────────────────────────────────

_SIGNUP_URL = "/api/v1/auth/signup"
_LOGIN_URL = "/api/v1/auth/login"
_LOGOUT_URL = "/api/v1/auth/logout"
_ME_URL = "/api/v1/auth/me"

_VALID_SIGNUP = {
    "email": "alice@example.com",
    "full_name": "Alice Test",
    "password": "securepass",
}


def _mock_redis():
    redis = AsyncMock()
    redis.set = AsyncMock()
    redis.get = AsyncMock(return_value=None)
    redis.delete = AsyncMock()
    return redis


# ── signup ───────────────────────────────────────────────────────────


def test_signup_success(client: TestClient) -> None:
    fake_user = _make_user()
    session = _mock_session(execute_returns=[None])  # get_by_email => None
    session.refresh = AsyncMock(return_value=None)

    # After add+commit+refresh, make the user available
    async def _refresh(obj):
        for k, v in fake_user.__dict__.items():
            if not k.startswith("_"):
                setattr(obj, k, v)

    session.refresh = _refresh
    _override_db(session)

    redis = _mock_redis()
    with patch("luma.cache.session.get_redis", return_value=redis):
        response = client.post(_SIGNUP_URL, json=_VALID_SIGNUP)

    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "alice@example.com"
    assert data["full_name"] == "Alice Test"
    assert "session_id" in response.cookies


def test_signup_duplicate_email(client: TestClient) -> None:
    existing = _make_user()
    session = _mock_session(execute_returns=[existing])
    _override_db(session)

    response = client.post(_SIGNUP_URL, json=_VALID_SIGNUP)
    assert response.status_code == 409


def test_signup_short_password(client: TestClient) -> None:
    payload = {**_VALID_SIGNUP, "password": "short"}
    response = client.post(_SIGNUP_URL, json=payload)
    assert response.status_code == 422


def test_signup_invalid_email(client: TestClient) -> None:
    payload = {**_VALID_SIGNUP, "email": "not-an-email"}
    response = client.post(_SIGNUP_URL, json=payload)
    assert response.status_code == 422


# ── login ────────────────────────────────────────────────────────────


def test_login_success(client: TestClient) -> None:
    from luma.core.security import hash_password

    hashed = hash_password("securepass")
    fake_user = _make_user(hashed_password=hashed)
    session = _mock_session(execute_returns=[fake_user])
    _override_db(session)

    redis = _mock_redis()
    with patch("luma.cache.session.get_redis", return_value=redis):
        response = client.post(
            _LOGIN_URL,
            json={"email": "alice@example.com", "password": "securepass"},
        )

    assert response.status_code == 200
    assert "session_id" in response.cookies
    assert response.json()["email"] == "alice@example.com"


def test_login_wrong_password(client: TestClient) -> None:
    from luma.core.security import hash_password

    fake_user = _make_user(hashed_password=hash_password("correct"))
    session = _mock_session(execute_returns=[fake_user])
    _override_db(session)

    response = client.post(
        _LOGIN_URL,
        json={"email": "alice@example.com", "password": "wrongpass"},
    )
    assert response.status_code == 401


def test_login_unknown_email(client: TestClient) -> None:
    session = _mock_session(execute_returns=[None])
    _override_db(session)

    response = client.post(
        _LOGIN_URL,
        json={"email": "nobody@example.com", "password": "whatever1"},
    )
    assert response.status_code == 401


# ── me ───────────────────────────────────────────────────────────────


def test_me_authenticated(client: TestClient) -> None:
    fake_user = _make_user()
    session = _mock_session(execute_returns=[fake_user])
    _override_db(session)

    with patch("luma.api.deps.get_session", new_callable=AsyncMock, return_value=1):
        client.cookies.set("session_id", "valid-session")
        response = client.get(_ME_URL)

    assert response.status_code == 200
    assert response.json()["email"] == "alice@example.com"


def test_me_unauthenticated(client: TestClient) -> None:
    response = client.get(_ME_URL)
    assert response.status_code == 401


# ── logout ───────────────────────────────────────────────────────────


def test_logout(client: TestClient) -> None:
    redis = _mock_redis()
    with patch("luma.cache.session.get_redis", return_value=redis):
        client.cookies.set("session_id", "some-session")
        response = client.post(_LOGOUT_URL)

    assert response.status_code == 200
    assert response.json()["detail"] == "Logged out"
