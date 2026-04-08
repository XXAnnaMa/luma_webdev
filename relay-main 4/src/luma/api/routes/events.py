from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from luma.api.deps import get_current_user_id, get_optional_current_user_id
from luma.db.session import get_db_session
from luma.repositories.event_repository import EventRepository
from luma.repositories.registration_repository import RegistrationRepository
from luma.schemas.event import (
    DeleteResponse,
    EventCreate,
    EventListResponse,
    EventRead,
    EventResponse,
    EventUpdate,
    Location,
    MapEventListResponse,
    MapEventRead,
    RegistrationResponse,
)
from luma.services.event_service import EventService
from luma.services.registration_service import RegistrationError, RegistrationService

router = APIRouter()


def _get_service(session: Annotated[AsyncSession, Depends(get_db_session)]) -> EventService:
    repository = EventRepository(session)
    return EventService(repository)


def _get_registration_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> RegistrationService:
    return RegistrationService(RegistrationRepository(session), EventRepository(session))


def _to_read(event, is_registered: bool = False) -> EventRead:
    """Convert an ORM Event to the API response schema."""
    return EventRead.model_validate(
        {
            "id": event.id,
            "title": event.title,
            "description": event.description,
            "image": event.image,
            "category": event.category,
            "date": event.date,
            "time": event.time,
            "address": event.address,
            "location": Location(lat=event.latitude, lng=event.longitude),
            "participantLimit": event.participant_limit,
            "currentParticipants": event.current_participants,
            "tags": event.tags,
            "organizerName": event.organizer_name,
            "organizerEmail": event.organizer_email,
            "organizerPhone": event.organizer_phone,
            "createdAt": event.created_at,
            "updatedAt": event.updated_at,
            "userId": event.user_id,
            "isRegistered": is_registered,
        }
    )


def _to_map_read(event) -> MapEventRead:
    """Convert an ORM Event to a map-optimized response schema."""
    return MapEventRead.model_validate(
        {
            "id": event.id,
            "title": event.title,
            "category": event.category,
            "date": event.date,
            "time": event.time,
            "address": event.address,
            "location": Location(lat=event.latitude, lng=event.longitude),
        }
    )


@router.get("", response_model=EventListResponse)
async def list_events(
    service: Annotated[EventService, Depends(_get_service)],
    reg_service: Annotated[RegistrationService, Depends(_get_registration_service)],
    user_id: Annotated[int | None, Depends(get_optional_current_user_id)],
    category: str | None = Query(default=None, description="Filter by category"),
    date: str | None = Query(default=None, description="Filter by date (YYYY-MM-DD)"),
    search: str | None = Query(default=None, description="Search title, description, or address"),
    limit: int | None = Query(default=None, ge=1, description="Max number of events to return"),
    offset: int | None = Query(default=None, ge=0, description="Number of events to skip"),
) -> EventListResponse:
    events, total = await service.list_events(
        category=category, date=date, search=search, limit=limit, offset=offset
    )
    
    registered_ids = set()
    if user_id is not None and events:
        event_ids = [e.id for e in events]
        registered_ids = await reg_service.get_registered_event_ids(user_id, event_ids)

    return EventListResponse(
        events=[_to_read(e, is_registered=(e.id in registered_ids)) for e in events], 
        total=total
    )


@router.get("/map", response_model=MapEventListResponse)
async def list_events_for_map(
    service: Annotated[EventService, Depends(_get_service)],
    min_lat: float = Query(..., ge=-90, le=90, description="Minimum latitude of the viewport"),
    max_lat: float = Query(..., ge=-90, le=90, description="Maximum latitude of the viewport"),
    min_lng: float = Query(..., ge=-180, le=180, description="Minimum longitude of the viewport"),
    max_lng: float = Query(..., ge=-180, le=180, description="Maximum longitude of the viewport"),
    category: str | None = Query(default=None, description="Filter by category"),
    date: str | None = Query(default=None, description="Filter by date (YYYY-MM-DD)"),
    search: str | None = Query(default=None, description="Search title, description, or address"),
    limit: int = Query(default=500, ge=1, le=2000, description="Max number of events to return"),
    offset: int = Query(default=0, ge=0, description="Number of events to skip"),
) -> MapEventListResponse:
    if min_lat > max_lat:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="min_lat cannot be greater than max_lat",
        )
    events, total = await service.list_events(
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
    return MapEventListResponse(events=[_to_map_read(e) for e in events], total=total)


@router.get("/{event_id}", response_model=EventResponse)
async def get_event(
    event_id: UUID,
    service: Annotated[EventService, Depends(_get_service)],
    reg_service: Annotated[RegistrationService, Depends(_get_registration_service)],
    user_id: Annotated[int | None, Depends(get_optional_current_user_id)],
) -> EventResponse:
    event = await service.get_event(event_id)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'Event with id "{event_id}" not found',
        )
    
    is_registered = False
    if user_id is not None:
        is_registered = await reg_service.is_registered(event_id, user_id)

    return EventResponse(event=_to_read(event, is_registered=is_registered))


@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    payload: EventCreate,
    service: Annotated[EventService, Depends(_get_service)],
    user_id: Annotated[int, Depends(get_current_user_id)],
) -> EventResponse:
    event = await service.create_event(payload, user_id=user_id)
    return EventResponse(event=_to_read(event))


@router.put("/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: UUID,
    payload: EventUpdate,
    service: Annotated[EventService, Depends(_get_service)],
    user_id: Annotated[int, Depends(get_current_user_id)],
) -> EventResponse:
    event = await service.get_event(event_id)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'Event with id "{event_id}" not found',
        )
    if event.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own events",
        )
    updated = await service.update_event(event, payload)
    return EventResponse(event=_to_read(updated))


@router.delete("/{event_id}", response_model=DeleteResponse)
async def delete_event(
    event_id: UUID,
    service: Annotated[EventService, Depends(_get_service)],
    user_id: Annotated[int, Depends(get_current_user_id)],
) -> DeleteResponse:
    event = await service.get_event(event_id)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'Event with id "{event_id}" not found',
        )
    if event.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own events",
        )
    deleted = await service.delete_event(event_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'Event with id "{event_id}" not found',
        )
    return DeleteResponse(success=True)



@router.post("/{event_id}/register", response_model=RegistrationResponse)
async def register_for_event(
    event_id: UUID,
    service: Annotated[RegistrationService, Depends(_get_registration_service)],
    user_id: Annotated[int, Depends(get_current_user_id)],
) -> RegistrationResponse:
    try:
        count = await service.register(event_id, user_id)
    except RegistrationError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from None
    return RegistrationResponse.model_validate({"currentParticipants": count})


@router.delete("/{event_id}/register", response_model=RegistrationResponse)
async def unregister_from_event(
    event_id: UUID,
    service: Annotated[RegistrationService, Depends(_get_registration_service)],
    user_id: Annotated[int, Depends(get_current_user_id)],
) -> RegistrationResponse:
    try:
        count = await service.unregister(event_id, user_id)
    except RegistrationError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.detail) from None
    return RegistrationResponse.model_validate({"currentParticipants": count})
