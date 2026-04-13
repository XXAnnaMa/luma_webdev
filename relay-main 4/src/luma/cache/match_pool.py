import json
import time

from luma.cache.redis import get_redis

_POOL_KEY = "match:pool"
_META_PREFIX = "match:pool:meta"
_RESULT_PREFIX = "match:result"
_LOCK_PREFIX = "match:lock"

MATCH_WINDOW_SECONDS = 15

_META_TTL = MATCH_WINDOW_SECONDS   # matchmaking window in seconds
_RESULT_TTL = 60  # how long to keep the match result for polling
_LOCK_TTL = 5    # dedup lock TTL


def _meta_key(user_id: int) -> str:
    return f"{_META_PREFIX}:{user_id}"


def _result_key(user_id: int) -> str:
    return f"{_RESULT_PREFIX}:{user_id}"


def _lock_key(uid_a: int, uid_b: int) -> str:
    lo, hi = min(uid_a, uid_b), max(uid_a, uid_b)
    return f"{_LOCK_PREFIX}:{lo}:{hi}"


async def add_to_pool(
    user_id: int, lat: float, lng: float, candidate_event_ids: list[str] | None = None
) -> None:
    """GEOADD user to pool and set meta key with TTL."""
    redis = get_redis()
    await redis.geoadd(_POOL_KEY, [lng, lat, str(user_id)])
    meta = json.dumps(
        {
            "activated_at": time.time(),
            "candidate_event_ids": candidate_event_ids or [],
        }
    )
    await redis.set(_meta_key(user_id), meta, ex=_META_TTL)


async def find_nearby(user_id: int, radius_km: float = 1.0) -> list[int]:
    """Return active nearby user IDs; lazily evicts ghost entries."""
    redis = get_redis()
    candidates = await redis.geosearch(
        _POOL_KEY,
        member=str(user_id),
        radius=radius_km,
        unit="km",
        sort="ASC",
    )
    active = []
    for candidate in candidates:
        uid = int(candidate)
        if uid == user_id:
            continue
        if await redis.exists(_meta_key(uid)):
            active.append(uid)
        else:
            await redis.zrem(_POOL_KEY, str(uid))  # ghost cleanup
    return active


async def get_position(user_id: int) -> tuple[float, float] | None:
    """Return (lat, lng) for a pool member, or None if not found."""
    redis = get_redis()
    positions = await redis.geopos(_POOL_KEY, str(user_id))
    if positions and positions[0]:
        lng, lat = positions[0]
        return float(lat), float(lng)
    return None


async def remove_from_pool(user_id: int) -> None:
    """Remove user from GeoSet and delete meta key."""
    redis = get_redis()
    await redis.zrem(_POOL_KEY, str(user_id))
    await redis.delete(_meta_key(user_id))


async def save_result(user_id: int, result: dict) -> None:
    """Store match result for polling (60s TTL)."""
    redis = get_redis()
    await redis.set(_result_key(user_id), json.dumps(result), ex=_RESULT_TTL)


async def get_result(user_id: int) -> dict | None:
    """Fetch stored match result, or None if not found."""
    redis = get_redis()
    value = await redis.get(_result_key(user_id))
    return json.loads(value) if value is not None else None


async def get_meta_ttl(user_id: int) -> int:
    """Return remaining TTL in seconds for the meta key (0 if expired/missing)."""
    redis = get_redis()
    ttl = await redis.ttl(_meta_key(user_id))
    return max(0, ttl)


async def get_meta(user_id: int) -> dict | None:
    """Fetch stored pool metadata, or None if not found."""
    redis = get_redis()
    value = await redis.get(_meta_key(user_id))
    return json.loads(value) if value is not None else None


async def is_in_pool(user_id: int) -> bool:
    """Return True if user's meta key still exists (active in pool)."""
    redis = get_redis()
    return bool(await redis.exists(_meta_key(user_id)))


async def acquire_lock(uid_a: int, uid_b: int) -> bool:
    """Try to acquire a dedup lock for a pair. Returns True if acquired."""
    redis = get_redis()
    result = await redis.set(_lock_key(uid_a, uid_b), "1", nx=True, ex=_LOCK_TTL)
    return result is not None
