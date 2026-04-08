from datetime import datetime
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class CategoryType(StrEnum):
    MUSIC = "Music"
    ART = "Art"
    SPORTS = "Sports"
    FOOD = "Food"
    TECH = "Tech"
    WELLNESS = "Wellness"
    SOCIAL = "Social"


class Location(BaseModel):
    lat: float
    lng: float


class EventCreate(BaseModel):
    title: str = Field(..., max_length=100)
    description: str = Field(..., max_length=2000)
    image: str = Field(default="", max_length=2048)
    category: CategoryType
    date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    time: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    address: str = Field(..., max_length=500)
    location: Location = Field(default_factory=lambda: Location(lat=0.0, lng=0.0))
    participant_limit: int = Field(..., alias="participantLimit", gt=0)
    tags: list[str] = Field(default_factory=list, max_length=10)
    organizer_name: str = Field(..., alias="organizerName")
    organizer_email: str = Field(..., alias="organizerEmail")
    organizer_phone: str | None = Field(default=None, alias="organizerPhone")

    model_config = ConfigDict(populate_by_name=True)


class EventUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=100)
    description: str | None = Field(default=None, max_length=2000)
    image: str | None = Field(default=None, max_length=2048)
    category: CategoryType | None = None
    date: str | None = Field(default=None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    time: str | None = Field(default=None, pattern=r"^\d{2}:\d{2}$")
    address: str | None = Field(default=None, max_length=500)
    location: Location | None = None
    participant_limit: int | None = Field(default=None, alias="participantLimit", gt=0)
    tags: list[str] | None = Field(default=None, max_length=10)
    organizer_name: str | None = Field(default=None, alias="organizerName")
    organizer_email: str | None = Field(default=None, alias="organizerEmail")
    organizer_phone: str | None = Field(default=None, alias="organizerPhone")

    model_config = ConfigDict(populate_by_name=True)


class EventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    is_registered: bool = Field(
        default=False, alias="isRegistered", serialization_alias="isRegistered"
    )

    id: UUID
    title: str
    description: str
    image: str
    category: str
    date: str
    time: str
    address: str
    location: Location
    participant_limit: int = Field(alias="participantLimit", serialization_alias="participantLimit")
    current_participants: int = Field(
        alias="currentParticipants", serialization_alias="currentParticipants"
    )
    tags: list[str]
    organizer_name: str = Field(alias="organizerName", serialization_alias="organizerName")
    organizer_email: str = Field(alias="organizerEmail", serialization_alias="organizerEmail")
    organizer_phone: str | None = Field(
        default=None, alias="organizerPhone", serialization_alias="organizerPhone"
    )
    created_at: datetime = Field(alias="createdAt", serialization_alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt", serialization_alias="updatedAt")
    user_id: int = Field(alias="userId", serialization_alias="userId")


class EventListResponse(BaseModel):
    events: list[EventRead]
    total: int


class MapEventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: UUID
    title: str
    category: str
    date: str
    time: str
    address: str
    location: Location


class MapEventListResponse(BaseModel):
    events: list[MapEventRead]
    total: int


class EventResponse(BaseModel):
    event: EventRead


class DeleteResponse(BaseModel):
    success: bool


class RegistrationResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    current_participants: int = Field(
        alias="currentParticipants", serialization_alias="currentParticipants"
    )
