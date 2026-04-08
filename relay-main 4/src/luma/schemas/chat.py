from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ChatRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=4000)


class ChatSuggestion(BaseModel):
    id: str
    title: str
    subtitle: str


class ChatResponse(BaseModel):
    reply: str
    timestamp: datetime
    suggestions: list[ChatSuggestion] = Field(default_factory=list)


class ChatMessageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    role: str
    content: str
    created_at: datetime
