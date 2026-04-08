from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from luma.db.models.chat import ChatMessage


class ChatRepository:
    """Data access layer for user chat history."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def save_message(self, user_id: int, role: str, content: str) -> ChatMessage:
        message = ChatMessage(user_id=user_id, role=role, content=content)
        self.session.add(message)
        await self.session.commit()
        await self.session.refresh(message)
        return message

    async def get_history(self, user_id: int, limit: int = 10) -> list[ChatMessage]:
        stmt = (
            select(ChatMessage)
            .where(ChatMessage.user_id == user_id)
            .order_by(ChatMessage.created_at.desc())
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def clear_history(self, user_id: int) -> int:
        stmt = delete(ChatMessage).where(ChatMessage.user_id == user_id)
        result = await self.session.execute(stmt)
        await self.session.commit()
        return result.rowcount or 0
