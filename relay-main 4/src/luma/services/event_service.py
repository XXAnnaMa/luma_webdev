from uuid import UUID

from luma.db.models.event import Event
from luma.repositories.event_repository import EventRepository
from luma.schemas.event import EventCreate, EventUpdate


class EventService:
    """Application business rules for events."""

    def __init__(self, repository: EventRepository) -> None:
        self.repository = repository

    async def list_events(
        self,
        *,
        category: str | None = None,
        date: str | None = None,
        search: str | None = None,
        min_lat: float | None = None,
        max_lat: float | None = None,
        min_lng: float | None = None,
        max_lng: float | None = None,
        limit: int | None = None,
        offset: int | None = None,
    ) -> tuple[list[Event], int]:
        return await self.repository.list_events(
            category=category,
            date=date,
            search=search,
            min_lat=min_lat,
            max_lat=max_lat,
            min_lng=min_lng,
            max_lng=max_lng,
            limit=limit,
            offset=offset,
        )

    async def get_event(self, event_id: UUID) -> Event | None:
        return await self.repository.get_by_id(event_id)

    async def create_event(self, payload: EventCreate, user_id: int) -> Event:
        return await self.repository.create(
            title=payload.title.strip(),
            description=payload.description.strip(),
            image=payload.image,
            category=payload.category.value,
            date=payload.date,
            time=payload.time,
            address=payload.address.strip(),
            latitude=payload.location.lat,
            longitude=payload.location.lng,
            participant_limit=payload.participant_limit,
            current_participants=0,
            tags=payload.tags,
            organizer_name=payload.organizer_name.strip(),
            organizer_email=payload.organizer_email.strip().lower(),
            organizer_phone=payload.organizer_phone,
            user_id=user_id,
        )

    async def update_event(self, event: Event, payload: EventUpdate) -> Event:
        updates: dict = {}

        if payload.title is not None:
            updates["title"] = payload.title.strip()
        if payload.description is not None:
            updates["description"] = payload.description.strip()
        if payload.image is not None:
            updates["image"] = payload.image
        if payload.category is not None:
            updates["category"] = payload.category.value
        if payload.date is not None:
            updates["date"] = payload.date
        if payload.time is not None:
            updates["time"] = payload.time
        if payload.address is not None:
            updates["address"] = payload.address.strip()
        if payload.location is not None:
            updates["latitude"] = payload.location.lat
            updates["longitude"] = payload.location.lng
        if payload.participant_limit is not None:
            updates["participant_limit"] = payload.participant_limit
        if payload.tags is not None:
            updates["tags"] = payload.tags
        if payload.organizer_name is not None:
            updates["organizer_name"] = payload.organizer_name.strip()
        if payload.organizer_email is not None:
            updates["organizer_email"] = payload.organizer_email.strip().lower()
        if "organizer_phone" in payload.model_fields_set:
            updates["organizer_phone"] = payload.organizer_phone

        if not updates:
            return event

        return await self.repository.update(event, **updates)

    async def delete_event(self, event_id: UUID) -> bool:
        return await self.repository.delete(event_id)
