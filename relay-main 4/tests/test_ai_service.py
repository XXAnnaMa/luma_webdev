from datetime import UTC, datetime
from types import SimpleNamespace
from uuid import uuid4

import pytest

from luma.services.ai_service import AIService


class FakeChatRepository:
    def __init__(self) -> None:
        self.saved: list[dict[str, object]] = []

    async def get_history(self, user_id: int, limit: int = 10):
        return []

    async def save_message(self, user_id: int, role: str, content: str):
        self.saved.append({"user_id": user_id, "role": role, "content": content})
        return SimpleNamespace(user_id=user_id, role=role, content=content)


class FakeEventRepository:
    def __init__(self, events) -> None:
        self.events = events

    async def list_latest_events(self, limit: int = 50):
        return self.events[:limit]


def _make_event(title: str, category: str, date: str, time: str, address: str):
    return SimpleNamespace(
        id=uuid4(),
        title=title,
        description=f"{title} description",
        category=category,
        date=date,
        time=time,
        address=address,
        tags=[category.lower()],
        organizer_name="Local Tester",
        organizer_email="tester@example.com",
        participant_limit=50,
        current_participants=5,
        created_at=datetime.now(UTC),
    )


@pytest.mark.asyncio
async def test_chat_falls_back_without_openai_key(monkeypatch) -> None:
    monkeypatch.setattr("luma.services.ai_service.settings.openai_api_key", "")

    chat_repo = FakeChatRepository()
    events = [
        _make_event("AI Product Meetup", "Tech", "2026-04-15", "18:30", "300 S Grand Ave"),
        _make_event("Weekend Food Pop-Up", "Food", "2026-04-12", "11:00", "777 Alameda St"),
    ]
    service = AIService(chat_repository=chat_repo, event_repository=FakeEventRepository(events))

    response = await service.chat(user_id=None, query="tech event next week")

    assert response.reply
    assert response.suggestions
    assert response.suggestions[0].title == "AI Product Meetup"
    assert chat_repo.saved == []


@pytest.mark.asyncio
async def test_chat_persists_messages_for_authenticated_user(monkeypatch) -> None:
    monkeypatch.setattr("luma.services.ai_service.settings.openai_api_key", "")

    chat_repo = FakeChatRepository()
    events = [
        _make_event("Sunset Rooftop Jazz", "Music", "2026-04-10", "19:30", "1200 S Figueroa St"),
    ]
    service = AIService(chat_repository=chat_repo, event_repository=FakeEventRepository(events))

    response = await service.chat(user_id=7, query="music event")

    assert response.reply
    assert len(chat_repo.saved) == 2
    assert chat_repo.saved[0]["role"] == "user"
    assert chat_repo.saved[0]["content"] == "music event"
    assert chat_repo.saved[1]["role"] == "assistant"
    assert chat_repo.saved[1]["content"] == response.reply
