from collections.abc import AsyncGenerator
from functools import lru_cache

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from luma.core.config import settings


@lru_cache
def get_db_engine() -> AsyncEngine:
    return create_async_engine(settings.database_url, pool_pre_ping=True)


@lru_cache
def get_db_sessionmaker() -> async_sessionmaker[AsyncSession]:
    return async_sessionmaker(bind=get_db_engine(), expire_on_commit=False, autoflush=False)


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    sessionmaker = get_db_sessionmaker()
    async with sessionmaker() as session:
        yield session
