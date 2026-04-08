from fastapi import APIRouter
from sqlalchemy import text

from luma.cache.redis import get_redis
from luma.db.session import get_db_sessionmaker

router = APIRouter()


@router.get("/live")
async def liveness() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/ready")
async def readiness() -> dict[str, str]:
    sessionmaker = get_db_sessionmaker()
    async with sessionmaker() as session:
        await session.execute(text("SELECT 1"))

    redis = get_redis()
    redis.ping()

    return {"status": "ok"}
