import math
from uuid import UUID

from sqlalchemy import delete, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from luma.db.models.event import Event


class EventRepository:
    """Data access layer for events."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

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
        # Build shared filters for both count and data queries
        filters = []

        if category:
            filters.append(func.lower(Event.category) == category.lower())

        if date:
            filters.append(Event.date == date)

        if search:
            pattern = f"%{search.lower()}%"
            filters.append(
                func.lower(Event.title).like(pattern)
                | func.lower(Event.description).like(pattern)
                | func.lower(Event.address).like(pattern)
            )

        # Bounding box filter for map viewport queries
        if (
            min_lat is not None
            and max_lat is not None
            and min_lng is not None
            and max_lng is not None
        ):
            filters.extend(
                [
                    Event.latitude >= min_lat,
                    Event.latitude <= max_lat,
                ]
            )
            # Handle antimeridian crossing (e.g. min_lng=170, max_lng=-170)
            if min_lng <= max_lng:
                filters.append(Event.longitude >= min_lng)
                filters.append(Event.longitude <= max_lng)
            else:
                filters.append(or_(Event.longitude >= min_lng, Event.longitude <= max_lng))

        # Total count of matching events (without pagination)
        count_stmt = select(func.count()).select_from(Event)
        if filters:
            count_stmt = count_stmt.where(*filters)
        count_result = await self.session.execute(count_stmt)
        total_count = count_result.scalar_one()

        # Query for the actual events, with ordering and optional pagination
        events_stmt = select(Event)
        if filters:
            events_stmt = events_stmt.where(*filters)

        events_stmt = events_stmt.order_by(Event.date.asc(), Event.time.asc())

        if limit is not None:
            events_stmt = events_stmt.limit(limit)
        if offset is not None:
            events_stmt = events_stmt.offset(offset)

        result = await self.session.execute(events_stmt)
        events = list(result.scalars().all())
        return events, total_count

    async def find_nearest(
        self, lat: float, lng: float, radius_km: float = 5.0, limit: int = 1
    ) -> list[Event]:
        """Return events within radius_km of (lat, lng), closest first by bounding box."""
        lat_delta = radius_km / 111.0
        lng_delta = radius_km / (111.0 * math.cos(math.radians(lat)))
        events, _ = await self.list_events(
            min_lat=lat - lat_delta,
            max_lat=lat + lat_delta,
            min_lng=lng - lng_delta,
            max_lng=lng + lng_delta,
            limit=limit,
        )
        return events

    async def get_by_id(self, event_id: UUID) -> Event | None:
        stmt = select(Event).where(Event.id == event_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_id_for_update(self, event_id: UUID) -> Event | None:
        """Lock the event row for the duration of the transaction (SELECT FOR UPDATE)."""
        stmt = select(Event).where(Event.id == event_id).with_for_update()
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
    async def list_latest_events(self, limit: int = 50) -> list[Event]:
        stmt = select(Event).order_by(Event.created_at.desc()).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create(self, **kwargs) -> Event:
        event = Event(**kwargs)
        self.session.add(event)
        await self.session.commit()
        await self.session.refresh(event)
        return event

    async def update(self, event: Event, **kwargs) -> Event:
        for key, value in kwargs.items():
            setattr(event, key, value)
        await self.session.commit()
        await self.session.refresh(event)
        return event

    async def delete(self, event_id: UUID) -> bool:
        stmt = delete(Event).where(Event.id == event_id).returning(Event.id)
        result = await self.session.execute(stmt)
        await self.session.commit()
        return result.scalar_one_or_none() is not None
