from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from luma.api.routes import events as events_routes
from luma.main import app


class FakeEventService:
    def __init__(self, events: list[SimpleNamespace]) -> None:
        self._events = events
        self.last_list_events_kwargs: dict | None = None

    async def list_events(self, **kwargs):
        self.last_list_events_kwargs = kwargs
        return self._events, len(self._events)


@pytest.fixture(autouse=True)
def _clear_dependency_overrides():
    app.dependency_overrides = {}
    yield
    app.dependency_overrides = {}


def test_list_events_for_map_returns_map_payload_and_passes_bbox_filters() -> None:
    fake_service = FakeEventService(
        events=[
            SimpleNamespace(
                id=uuid4(),
                title="City Tech Meetup",
                category="Tech",
                date="2026-03-20",
                time="19:30",
                address="123 Main St",
                latitude=34.05,
                longitude=-118.24,
            )
        ]
    )

    app.dependency_overrides[events_routes._get_service] = lambda: fake_service
    client = TestClient(app)

    response = client.get(
        "/api/v1/events/map",
        params={
            "min_lat": 33.9,
            "max_lat": 34.2,
            "min_lng": -118.5,
            "max_lng": -118.0,
            "category": "Tech",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == 1
    assert payload["events"][0]["title"] == "City Tech Meetup"
    assert payload["events"][0]["location"] == {"lat": 34.05, "lng": -118.24}
    assert fake_service.last_list_events_kwargs is not None
    assert fake_service.last_list_events_kwargs["min_lat"] == 33.9
    assert fake_service.last_list_events_kwargs["max_lat"] == 34.2
    assert fake_service.last_list_events_kwargs["min_lng"] == -118.5
    assert fake_service.last_list_events_kwargs["max_lng"] == -118.0
    assert fake_service.last_list_events_kwargs["category"] == "Tech"


def test_list_events_for_map_applies_default_limit_and_offset() -> None:
    fake_service = FakeEventService(events=[])

    app.dependency_overrides[events_routes._get_service] = lambda: fake_service
    client = TestClient(app)

    response = client.get(
        "/api/v1/events/map",
        params={
            "min_lat": 33.9,
            "max_lat": 34.2,
            "min_lng": -118.5,
            "max_lng": -118.0,
        },
    )

    assert response.status_code == 200
    assert fake_service.last_list_events_kwargs is not None
    assert fake_service.last_list_events_kwargs["limit"] == 500
    assert fake_service.last_list_events_kwargs["offset"] == 0


def test_list_events_for_map_rejects_invalid_latitude_range() -> None:
    client = TestClient(app)

    response = client.get(
        "/api/v1/events/map",
        params={
            "min_lat": 35.0,
            "max_lat": 34.0,
            "min_lng": -118.5,
            "max_lng": -118.0,
        },
    )

    assert response.status_code == 422
    assert response.json()["detail"] == "min_lat cannot be greater than max_lat"


def test_list_events_for_map_accepts_antimeridian_crossing() -> None:
    fake_service = FakeEventService(events=[])

    app.dependency_overrides[events_routes._get_service] = lambda: fake_service
    client = TestClient(app)

    # min_lng > max_lng is valid when the viewport crosses the antimeridian
    response = client.get(
        "/api/v1/events/map",
        params={
            "min_lat": 34.0,
            "max_lat": 35.0,
            "min_lng": 170.0,
            "max_lng": -170.0,
        },
    )

    assert response.status_code == 200
    assert fake_service.last_list_events_kwargs is not None
    assert fake_service.last_list_events_kwargs["min_lng"] == 170.0
    assert fake_service.last_list_events_kwargs["max_lng"] == -170.0
