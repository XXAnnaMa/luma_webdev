from luma.cache.redis import get_redis
from luma.core.config import settings
from luma.core.security import generate_session_id

_PREFIX = "session"


def _key(session_id: str) -> str:
    return f"{_PREFIX}:{session_id}"


async def create_session(user_id: int) -> str:
    """Create a new session in Redis and return the session ID."""
    redis = get_redis()
    session_id = generate_session_id()
    await redis.set(_key(session_id), str(user_id), ex=settings.session_ttl_seconds)
    return session_id


async def get_session(session_id: str) -> int | None:
    """Return the user ID for *session_id*, or ``None`` if expired/missing."""
    redis = get_redis()
    value = await redis.get(_key(session_id))
    return int(value) if value is not None else None


async def delete_session(session_id: str) -> None:
    """Remove a session from Redis (logout)."""
    redis = get_redis()
    await redis.delete(_key(session_id))
