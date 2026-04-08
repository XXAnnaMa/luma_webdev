import json
import re
from datetime import UTC, datetime, timedelta

from sqlalchemy.exc import SQLAlchemyError

from luma.core.config import settings
from luma.db.models.chat import ChatRole
from luma.repositories.chat_repository import ChatRepository
from luma.repositories.event_repository import EventRepository
from luma.schemas.chat import ChatResponse, ChatSuggestion

try:
    from openai import APITimeoutError, AsyncOpenAI, OpenAIError
except ModuleNotFoundError:  # pragma: no cover - runtime safety fallback
    APITimeoutError = TimeoutError  # type: ignore[assignment]
    AsyncOpenAI = None

    class OpenAIError(Exception):
        pass


class ChatPersistenceError(Exception):
    """Raised when chat history cannot be read or saved."""


class ChatAIError(Exception):
    """Raised when AI provider call fails."""


CATEGORY_KEYWORDS: dict[str, list[str]] = {
    "Music": ["music", "concert", "jazz", "live music"],
    "Art": ["art", "gallery", "exhibition"],
    "Sports": ["sports", "sport", "soccer", "basketball", "hike", "hiking", "fitness"],
    "Food": ["food", "dinner", "brunch", "coffee", "market"],
    "Tech": ["tech", "developer", "coding", "code", "startup", "ai"],
    "Wellness": ["wellness", "yoga", "meditation", "health"],
    "Social": ["social", "party", "networking", "meetup"],
}

STOP_WORDS = {
    "find",
    "events",
    "event",
    "nearby",
    "near",
    "please",
    "show",
    "me",
    "any",
    "for",
    "the",
    "a",
    "an",
    "in",
    "on",
    "at",
    "to",
    "this",
    "that",
}


class AIService:
    """Application service for AI chat with DB-backed memory."""

    def __init__(self, chat_repository: ChatRepository, event_repository: EventRepository) -> None:
        self.chat_repository = chat_repository
        self.event_repository = event_repository
        self.client = (
            AsyncOpenAI(
                api_key=settings.openai_api_key,
                timeout=settings.openai_timeout_seconds,
                project=settings.openai_project_id or None,
                organization=settings.openai_organization_id or None,
            )
            if AsyncOpenAI
            else None
        )

    async def get_history(self, user_id: int, limit: int = 10):
        try:
            return await self.chat_repository.get_history(user_id=user_id, limit=limit)
        except SQLAlchemyError as exc:
            raise ChatPersistenceError("Failed to load chat history.") from exc

    async def clear_history(self, user_id: int) -> int:
        try:
            return await self.chat_repository.clear_history(user_id=user_id)
        except SQLAlchemyError as exc:
            raise ChatPersistenceError("Failed to clear chat history.") from exc

    async def chat(self, *, user_id: int | None, query: str) -> ChatResponse:
        try:
            history = (
                await self.chat_repository.get_history(user_id=user_id, limit=10)
                if user_id is not None
                else []
            )
            events = await self.event_repository.list_latest_events(limit=50)
        except SQLAlchemyError as exc:
            raise ChatPersistenceError("Failed to read context data from database.") from exc

        matched_events, match_mode = self._match_events(query=query, events=events)
        suggestions = self._build_suggestions(matched_events or self._sort_events(events)[:3])

        if not self.client or not settings.openai_api_key:
            reply = self._build_fallback_reply(
                query=query,
                events=matched_events,
                all_events=events,
                mode=match_mode,
            )
        else:
            event_context = self._events_to_context(events)
            messages = self._build_messages(
                query=query,
                history=history,
                event_context=event_context,
            )

            try:
                completion = await self.client.chat.completions.create(
                    model=settings.openai_model,
                    messages=messages,
                )
                reply = (completion.choices[0].message.content or "").strip()
            except APITimeoutError:
                reply = self._build_fallback_reply(
                    query=query,
                    events=matched_events,
                    all_events=events,
                    mode=match_mode,
                    reason="The live AI timed out, so I matched events locally instead.",
                )
            except OpenAIError:
                reply = self._build_fallback_reply(
                    query=query,
                    events=matched_events,
                    all_events=events,
                    mode=match_mode,
                    reason=(
                        "The live AI is temporarily unavailable, so I matched events locally "
                        "instead."
                    ),
                )

            if not reply:
                reply = self._build_fallback_reply(
                    query=query,
                    events=matched_events,
                    all_events=events,
                    mode=match_mode,
                )

        timestamp = datetime.now(UTC)

        if user_id is not None:
            try:
                await self.chat_repository.save_message(
                    user_id=user_id, role=ChatRole.USER.value, content=query
                )
                await self.chat_repository.save_message(
                    user_id=user_id, role=ChatRole.ASSISTANT.value, content=reply
                )
            except SQLAlchemyError as exc:
                raise ChatPersistenceError("Failed to save chat messages.") from exc

        return ChatResponse(reply=reply, timestamp=timestamp, suggestions=suggestions)

    def _events_to_context(self, events) -> str:
        payload = [
            {
                "id": str(event.id),
                "title": event.title,
                "description": event.description,
                "category": event.category,
                "date": event.date,
                "time": event.time,
                "address": event.address,
                "tags": event.tags,
                "organizerName": event.organizer_name,
                "organizerEmail": event.organizer_email,
                "participantLimit": event.participant_limit,
                "currentParticipants": event.current_participants,
                "createdAt": event.created_at.isoformat() if event.created_at else None,
            }
            for event in events
        ]
        return json.dumps(payload, ensure_ascii=False)

    def _build_messages(self, *, query: str, history, event_context: str) -> list[dict[str, str]]:
        system_prompt = (
            "You are the event assistant for the Luma platform. Your answers must be based on "
            "the system-provided event data and the user's question. If data is insufficient, "
            "state that clearly. Here is the activity JSON from the database:\n"
            f"{event_context}"
        )
        ordered_history = list(reversed(history))
        history_messages = [
            {"role": message.role, "content": message.content}
            for message in ordered_history
            if message.role in {ChatRole.USER.value, ChatRole.ASSISTANT.value}
        ]
        return [
            {"role": "system", "content": system_prompt},
            *history_messages,
            {"role": "user", "content": query},
        ]

    def _match_events(self, *, query: str, events) -> tuple[list, str]:
        sorted_events = self._sort_events(events)
        detected_category = self._get_detected_category(query)
        date_key, weekend = self._get_detected_date(query)
        keywords = self._get_keywords(query)

        matched = [
            event
            for event in sorted_events
            if self._matches_event(
                event=event,
                detected_category=detected_category,
                date_key=date_key,
                weekend=weekend,
                keywords=keywords,
            )
        ]

        if not matched and keywords:
            matched = [
                event
                for event in sorted_events
                if self._matches_event(
                    event=event,
                    detected_category=detected_category,
                    date_key=date_key,
                    weekend=weekend,
                    keywords=[],
                )
            ]
            if matched:
                return matched, "relaxed"

        if not matched:
            relaxed = [
                event
                for event in sorted_events
                if self._matches_event(
                    event=event,
                    detected_category=detected_category,
                    date_key=date_key,
                    weekend=False,
                    keywords=[],
                )
            ]
            if relaxed:
                return relaxed, "relaxed"

        if not matched and detected_category:
            fallback = [event for event in sorted_events if event.category == detected_category]
            if fallback:
                return fallback, "fallback"

        return matched, "strict"

    def _matches_event(
        self,
        *,
        event,
        detected_category: str | None,
        date_key: str | None,
        weekend: bool,
        keywords: list[str],
    ) -> bool:
        if detected_category and event.category != detected_category:
            return False

        if date_key and self._normalize_date_key(event.date) != date_key:
            return False

        if weekend and not self._is_weekend_date(event.date):
            return False

        if keywords:
            haystack = " ".join(
                [
                    event.title,
                    event.description,
                    event.address,
                    event.category,
                    *event.tags,
                ]
            ).lower()
            if not any(keyword in haystack for keyword in keywords):
                return False

        return True

    def _build_suggestions(self, events) -> list[ChatSuggestion]:
        return [
            ChatSuggestion(
                id=str(event.id),
                title=event.title,
                subtitle=(
                    f"{self._format_date_label(event.date)} • "
                    f"{self._format_time_label(event.time)} • "
                    f"{event.category}"
                ),
            )
            for event in events[:3]
        ]

    def _build_fallback_reply(
        self,
        *,
        query: str,
        events,
        all_events,
        mode: str,
        reason: str | None = None,
    ) -> str:
        prefix = f"{reason}\n\n" if reason else ""

        if not events:
            upcoming = self._sort_events(all_events)[:3]
            if not upcoming:
                return (
                    prefix
                    + "There are no events in the database yet, so I cannot suggest anything."
                )

            lines = [
                prefix
                + f'I could not find an exact match for "{query}". '
                + "Here are upcoming events instead:"
            ]
            for event in upcoming:
                lines.append(
                    f"- {event.title} on {self._format_date_label(event.date)} at "
                    f"{self._format_time_label(event.time)} in {event.address}"
                )
            return "\n".join(lines)

        top = events[:3]
        if mode == "relaxed":
            intro = "I could not find an exact match, but these are the closest event matches:"
        elif mode == "fallback":
            intro = (
                "I found events in the same category even though the full request did not "
                "match exactly:"
            )
        else:
            intro = f'I found {len(events)} matching event{"s" if len(events) != 1 else ""}:'

        lines = [prefix + intro]
        for event in top:
            lines.append(
                f"- {event.title} ({event.category}) on {self._format_date_label(event.date)} "
                f"at {self._format_time_label(event.time)} in {event.address}"
            )
        return "\n".join(lines)

    def _sort_events(self, events) -> list:
        return sorted(
            events,
            key=lambda event: (
                self._normalize_date_key(event.date),
                event.time,
                event.title.lower(),
            ),
        )

    def _normalize_date_key(self, value: str) -> str:
        text = value.strip()
        if "T" in text:
            text = text.split("T", maxsplit=1)[0]
        return text

    def _get_detected_category(self, query: str) -> str | None:
        lower = query.lower()
        for category, keywords in CATEGORY_KEYWORDS.items():
            if any(keyword in lower for keyword in keywords):
                return category
        return None

    def _get_detected_date(self, query: str) -> tuple[str | None, bool]:
        lower = query.lower()
        explicit = re.search(r"\b\d{4}-\d{2}-\d{2}\b", lower)
        if explicit:
            return explicit.group(0), False

        month_map = {
            "jan": 1,
            "january": 1,
            "feb": 2,
            "february": 2,
            "mar": 3,
            "march": 3,
            "apr": 4,
            "april": 4,
            "may": 5,
            "jun": 6,
            "june": 6,
            "jul": 7,
            "july": 7,
            "aug": 8,
            "august": 8,
            "sep": 9,
            "sept": 9,
            "september": 9,
            "oct": 10,
            "october": 10,
            "nov": 11,
            "november": 11,
            "dec": 12,
            "december": 12,
        }
        month_day = re.search(
            (
                r"\b(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|"
                r"august|sep|sept|september|oct|october|nov|november|dec|december)\s+(\d{1,2})\b"
            ),
            lower,
        )
        if month_day:
            month = month_map.get(month_day.group(1))
            day = int(month_day.group(2))
            if month:
                year = datetime.now().year
                return f"{year}-{month:02d}-{day:02d}", False

        if "today" in lower:
            return self._get_relative_date_key(0), False
        if "tomorrow" in lower:
            return self._get_relative_date_key(1), False
        if "weekend" in lower:
            return None, True

        return None, False

    def _get_relative_date_key(self, offset_days: int) -> str:
        target = datetime.now().date() + timedelta(days=offset_days)
        return target.isoformat()

    def _get_keywords(self, query: str) -> list[str]:
        words = re.split(r"[^a-z0-9-]+", query.lower())
        return [word for word in words if len(word) >= 2 and word not in STOP_WORDS]

    def _is_weekend_date(self, date_text: str) -> bool:
        key = self._normalize_date_key(date_text)
        try:
            parsed = datetime.strptime(key, "%Y-%m-%d")
        except ValueError:
            return False
        return parsed.weekday() >= 5

    def _format_date_label(self, date_text: str) -> str:
        key = self._normalize_date_key(date_text)
        try:
            parsed = datetime.strptime(key, "%Y-%m-%d")
        except ValueError:
            return key
        return parsed.strftime("%b %d, %Y")

    def _format_time_label(self, time_text: str) -> str:
        try:
            parsed = datetime.strptime(time_text, "%H:%M")
        except ValueError:
            return time_text
        return parsed.strftime("%I:%M %p").lstrip("0")
