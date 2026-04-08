from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from luma.db.models.user import User


class UserRepository:
    """Data access layer for users."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def list_users(self) -> list[User]:
        stmt = select(User).order_by(User.id.asc())
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_by_id(self, user_id: int) -> User | None:
        stmt = select(User).where(User.id == user_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> User | None:
        stmt = select(User).where(User.email == email)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def create_user(
        self,
        email: str,
        full_name: str,
        hashed_password: str,
    ) -> User:
        user = User(email=email, full_name=full_name, hashed_password=hashed_password)
        self.session.add(user)
        try:
            await self.session.commit()
        except IntegrityError:
            await self.session.rollback()
            raise
        await self.session.refresh(user)
        return user
