from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from luma.api.deps import get_current_user_id
from luma.cache import match_pool
from luma.db.session import get_db_session
from luma.repositories.event_repository import EventRepository
from luma.repositories.registration_repository import RegistrationRepository
from luma.repositories.user_repository import UserRepository
from luma.schemas.match import (
    ActivateRequest,
    MatchStatusResponse,
    NearbyEventMatchRequest,
    NearbyEventMatchResponse,
)
from luma.services.match_service import MatchService

router = APIRouter()


def _get_service(session: Annotated[AsyncSession, Depends(get_db_session)]) -> MatchService:
    return MatchService(
        UserRepository(session),
        EventRepository(session),
        RegistrationRepository(session),
    )


@router.post("/activate", response_model=MatchStatusResponse, status_code=status.HTTP_200_OK)
async def activate(
    body: ActivateRequest,
    user_id: Annotated[int, Depends(get_current_user_id)],
    service: Annotated[MatchService, Depends(_get_service)],
) -> MatchStatusResponse:
    if await match_pool.is_in_pool(user_id):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Already in matching pool",
        )
    return await service.activate(
        user_id,
        body.lat,
        body.lng,
        candidate_event_ids=body.candidate_event_ids,
    )


@router.get("/status", response_model=MatchStatusResponse)
async def get_status(
    user_id: Annotated[int, Depends(get_current_user_id)],
    service: Annotated[MatchService, Depends(_get_service)],
) -> MatchStatusResponse:
    return await service.get_status(user_id)


@router.delete("/activate", status_code=status.HTTP_200_OK)
async def cancel(
    user_id: Annotated[int, Depends(get_current_user_id)],
    service: Annotated[MatchService, Depends(_get_service)],
) -> dict[str, str]:
    await service.cancel(user_id)
    return {"detail": "Cancelled"}


@router.post(
    "/nearby-event",
    response_model=NearbyEventMatchResponse,
    status_code=status.HTTP_200_OK,
)
async def nearby_event_match(
    body: NearbyEventMatchRequest,
    user_id: Annotated[int, Depends(get_current_user_id)],
    service: Annotated[MatchService, Depends(_get_service)],
) -> NearbyEventMatchResponse:
    return await service.random_event_match(
        user_id=user_id,
        lat=body.lat,
        lng=body.lng,
        radius_km=body.radius_km,
        candidate_event_ids=body.candidate_event_ids,
    )
