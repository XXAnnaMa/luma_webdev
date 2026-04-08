from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from luma.api.deps import get_current_user_id, get_optional_current_user_id
from luma.db.session import get_db_session
from luma.repositories.chat_repository import ChatRepository
from luma.repositories.event_repository import EventRepository
from luma.schemas.chat import ChatMessageRead, ChatRequest, ChatResponse
from luma.services.ai_service import AIService, ChatAIError, ChatPersistenceError

router = APIRouter()


def _get_service(session: Annotated[AsyncSession, Depends(get_db_session)]) -> AIService:
    chat_repository = ChatRepository(session)
    event_repository = EventRepository(session)
    return AIService(chat_repository=chat_repository, event_repository=event_repository)


@router.post("", response_model=ChatResponse, status_code=status.HTTP_200_OK)
async def chat(
    payload: ChatRequest,
    service: Annotated[AIService, Depends(_get_service)],
    user_id: Annotated[int | None, Depends(get_optional_current_user_id)],
) -> ChatResponse:
    try:
        return await service.chat(user_id=user_id, query=payload.query.strip())
    except ChatPersistenceError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except ChatAIError as exc:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail=str(exc),
        ) from exc


@router.get("/history", response_model=list[ChatMessageRead], status_code=status.HTTP_200_OK)
async def history(
    service: Annotated[AIService, Depends(_get_service)],
    user_id: Annotated[int, Depends(get_current_user_id)],
) -> list[ChatMessageRead]:
    try:
        history_messages = await service.get_history(user_id=user_id, limit=10)
    except ChatPersistenceError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    return [ChatMessageRead.model_validate(message) for message in reversed(history_messages)]


@router.delete("/history", status_code=status.HTTP_200_OK)
async def clear_history(
    service: Annotated[AIService, Depends(_get_service)],
    user_id: Annotated[int, Depends(get_current_user_id)],
) -> dict[str, bool]:
    try:
        await service.clear_history(user_id=user_id)
    except ChatPersistenceError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    return {"success": True}
