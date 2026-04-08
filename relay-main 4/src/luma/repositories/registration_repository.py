from uuid import UUID

from sqlalchemy import delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from luma.db.models.event import Event
from luma.db.models.event_registration import EventRegistration


class RegistrationRepository:
    """Data access for event registrations.
    
    Transaction boundary note:
    `create(...)` adds a new EventRegistration to the session (within a nested transaction)
    and flushes it; `delete(...)` issues a SQL DELETE via `session.execute(delete(...))`.
    Neither method commits. The caller (e.g. `RegistrationService` or `update_participant_count`)
    is responsible for calling `session.commit()` so changes can be committed atomically.
    """

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
    
    async def commit(self) -> None:
        await self.session.commit()

    async def find(self, event_id: UUID, user_id: int) -> EventRegistration | None:
        stmt = select(EventRegistration).where(
            EventRegistration.event_id == event_id,
            EventRegistration.user_id == user_id,
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def count_by_event(self, event_id: UUID) -> int:
        stmt = (
            select(func.count())
            .select_from(EventRegistration)
            .where(EventRegistration.event_id == event_id)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one()

    async def get_registered_event_ids(self, user_id: int, event_ids: list[UUID]) -> set[UUID]:
        if not event_ids:
            return set()
        stmt = select(EventRegistration.event_id).where(
            EventRegistration.user_id == user_id,
            EventRegistration.event_id.in_(event_ids),
        )
        result = await self.session.execute(stmt)
        return set(result.scalars().all())

    async def is_registered(self, event_id: UUID, user_id: int) -> bool:
        stmt = select(EventRegistration.id).where(
            EventRegistration.event_id == event_id,
            EventRegistration.user_id == user_id,
        ).limit(1)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none() is not None

    async def create(self, event_id: UUID, user_id: int) -> EventRegistration:
        registration = EventRegistration(event_id=event_id, user_id=user_id)
        async with self.session.begin_nested():
            self.session.add(registration)
            await self.session.flush()
        return registration

    async def delete(self, event_id: UUID, user_id: int) -> bool:
        stmt = delete(EventRegistration).where(
            EventRegistration.event_id == event_id,
            EventRegistration.user_id == user_id,
        ).returning(EventRegistration.event_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none() is not None

    async def update_participant_count(self, event_id: UUID) -> int:
        """Recount registrations and update Event.current_participants. Returns new count."""
        count_subq = (
            select(func.count())
            .select_from(EventRegistration)
            .where(EventRegistration.event_id == event_id)
            .scalar_subquery()
        )
        stmt = (
            update(Event)
            .where(Event.id == event_id)
            .values(current_participants=count_subq)
            .returning(Event.current_participants)
        )
        result = await self.session.execute(stmt)
        count = result.scalar_one_or_none()
        if count is None:
            raise ValueError(f"Event {event_id} not found")
        return count
