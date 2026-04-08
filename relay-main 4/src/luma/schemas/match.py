from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from luma.schemas.event import MapEventRead
from luma.schemas.user import UserRead


class ActivateRequest(BaseModel):
    lat: float
    lng: float


class NearbyEventMatchRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    lat: float
    lng: float
    radius_km: float = Field(default=25.0, alias="radiusKm", gt=0, le=100)
    candidate_event_ids: list[UUID] = Field(default_factory=list, alias="candidateEventIds")


class NearbyEventMatchResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    matched: bool
    message: str
    recommended_event_id: UUID | None = Field(
        default=None,
        alias="recommendedEventId",
        serialization_alias="recommendedEventId",
    )


class MatchStatusResponse(BaseModel):
    status: Literal["waiting", "matched", "timeout"]
    expires_in: int | None = None          # seconds remaining (waiting only)
    matched_user: UserRead | None = None
    suggested_event: MapEventRead | None = None
