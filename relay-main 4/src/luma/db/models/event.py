import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Index, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column

from luma.db.base import Base


class Event(Base):
    __tablename__ = "events"
    __table_args__ = (Index("ix_events_latitude_longitude", "latitude", "longitude"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    image: Mapped[str] = mapped_column(String(2048), nullable=False, default="")
    category: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    date: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    time: Mapped[str] = mapped_column(String(5), nullable=False)
    address: Mapped[str] = mapped_column(String(500), nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    longitude: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    participant_limit: Mapped[int] = mapped_column(Integer, nullable=False)
    current_participants: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    tags: Mapped[list[str]] = mapped_column(ARRAY(String(100)), nullable=False, default=list)
    organizer_name: Mapped[str] = mapped_column(String(200), nullable=False)
    organizer_email: Mapped[str] = mapped_column(String(320), nullable=False)
    organizer_phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False, index=True
    )
