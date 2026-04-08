# Shake to Match — Implementation Plan

## Feature Description

Users activate a short matchmaking window (20 seconds) by shaking their device or pressing a button. The backend matches users who activate at the same time within a nearby area, then suggests a relevant nearby event for the matched pair.

---

## Architecture Overview

**Stack additions:** Redis GeoSet for spatial matching pool. No WebSocket — pure REST + client-side polling.

```
Client                          Server                        Redis
  |                               |                             |
  |-- POST /match/activate -----> |                             |
  |   { lat, lng }                |-- GEOADD match:pool ------> |
  |                               |-- GEOSEARCH nearby -------> |
  |                               |   (match found?)            |
  | <-- { status: "waiting" } ----|                             |
  |                               |                             |
  |-- GET /match/status --------> |-- check Redis pool -------> |
  |   (poll every 2s)             |                             |
  | <-- { status: "waiting" } ----|                             |
  |                               |                             |
  |-- GET /match/status --------> |   (another user activated)  |
  | <-- { status: "matched",      |-- remove both from pool --> |
  |       matched_user: {...},    |-- query nearest event ----> DB
  |       suggested_event: {...} }|                             |
```

---

## API Endpoints

### `POST /api/v1/match/activate`

User enters the matching pool.

**Auth:** required (session cookie)

**Request body:**
```json
{ "lat": 37.7749, "lng": -122.4194 }
```

**Response:**
```json
{ "status": "waiting", "expires_in": 20 }
```

**Logic:**
1. Check if user is already in pool → return 409 if so
2. `GEOADD match:pool <lng> <lat> <user_id>`
3. Set `match:pool:meta:<user_id>` = `{ activated_at }` with 30s TTL
4. Immediately run `GEOSEARCH` to check for nearby users
5. If match found → create match, return `{ status: "matched", ... }` right away
6. If no match yet → return `{ status: "waiting", expires_in: 20 }`

---

### `GET /api/v1/match/status`

Poll for match result. Client calls this every 2 seconds.

**Auth:** required (session cookie)

**Response (waiting):**
```json
{ "status": "waiting", "expires_in": 12 }
```

**Response (matched):**
```json
{
  "status": "matched",
  "matched_user": { "id": 42, "full_name": "Jane Doe" },
  "suggested_event": {
    "id": "uuid",
    "title": "Open Mic Night",
    "category": "Music",
    "date": "2026-03-15",
    "time": "20:00",
    "address": "123 Main St"
  }
}
```

**Response (timed out):**
```json
{ "status": "timeout" }
```

**Logic:**
1. Check `match:result:<user_id>` in Redis → if exists, return matched result
2. Check `match:pool:meta:<user_id>` → if exists, return waiting + remaining TTL
3. Neither exists → return timeout

> **Note:** Result must always be written before meta is deleted (see match creation order below) to prevent a race condition where A polls between the two operations and incorrectly receives timeout.

---

### `DELETE /api/v1/match/activate`

User cancels matching (leaves pool early).

**Auth:** required

**Logic:** Remove user from `match:pool` GeoSet + delete meta key.

---

## New Files

### `src/luma/cache/match_pool.py`

Redis operations for the matching pool.

- `add_to_pool(user_id, lat, lng)` — GEOADD + set meta key with 30s TTL
- `find_nearby(user_id, radius_km=1.0)` — GEOSEARCH, then verify each candidate's meta key still exists; remove from GeoSet if not (ghost cleanup)
- `remove_from_pool(user_id)` — ZREM from GeoSet + delete meta key
- `save_result(user_id, result: dict)` — store match result for polling (60s TTL)
- `get_result(user_id)` — fetch stored match result
- `get_meta(user_id)` — fetch activation metadata (to compute remaining TTL)

### `src/luma/schemas/match.py`

```python
class ActivateRequest(BaseModel):
    lat: float
    lng: float

class MatchStatusResponse(BaseModel):
    status: Literal["waiting", "matched", "timeout"]
    expires_in: int | None = None        # seconds remaining (waiting only)
    matched_user: UserRead | None = None
    suggested_event: EventRead | None = None
```

### `src/luma/services/match_service.py`

- `activate(user_id, lat, lng) -> MatchStatusResponse` — add to pool, immediately check for match
- `get_status(user_id) -> MatchStatusResponse` — check result/meta keys, return current state
- `find_and_create_match(user_id, lat, lng) -> MatchStatusResponse | None` — GEOSEARCH + pick candidate + atomically claim match with Redis lock. **The caller (user B) is solely responsible for the full match creation sequence, strictly in this order:**
  1. Acquire `match:lock:<min_uid>:<max_uid>` via `SET NX`
  2. Generate event suggestion
  3. Write `match:result:<A>` and `match:result:<B>` (60s TTL)
  4. Remove A and B from pool (`ZREM` + delete meta keys)

  This ordering ensures A's meta key is never deleted before the result is written, preventing a false timeout on A's next poll.
- `suggest_event(lat, lng) -> EventRead | None` — find nearest event to midpoint

### `src/luma/api/routes/match.py`

```python
router = APIRouter()

@router.post("/activate")
async def activate(body: ActivateRequest, user_id = Depends(get_current_user_id), ...)

@router.get("/status")
async def get_status(user_id = Depends(get_current_user_id), ...)

@router.delete("/activate")
async def cancel(user_id = Depends(get_current_user_id), ...)
```

---

## Modified Files

### `src/luma/api/router.py`

```python
from .routes.match import router as match_router
api_router.include_router(match_router, prefix="/match", tags=["match"])
```

### `src/luma/repositories/event_repository.py`

Add `find_nearest(lat, lng, radius_km, limit)` — computes bounding box from midpoint, reuses existing spatial query patterns.

---

## Redis Key Design

| Key | Type | Content | TTL |
|-----|------|---------|-----|
| `match:pool` | GeoSet | `user_id → (lng, lat)` | none (manual cleanup) |
| `match:pool:meta:<user_id>` | String (JSON) | `{ activated_at }` | 30s |
| `match:result:<user_id>` | String (JSON) | matched user + event | 60s |
| `match:lock:<uid_min>:<uid_max>` | String | `"1"` | 5s (prevents double-match) |

The meta key TTL acts as the matchmaking window timer — when it expires, the user has timed out.

---

## Ghost User Problem & Solution

`match:pool` is a shared GeoSet and cannot have a TTL (that would wipe all members). Individual members must be removed manually via `ZREM`. If a user force-quits the app or the server crashes mid-request, their entry stays in the GeoSet indefinitely.

**Solution: lazy cleanup inside `find_nearby()`**

When searching for candidates, verify each result's meta key still exists. If not, the user has timed out — remove them from the GeoSet on the spot:

```python
async def find_nearby(self, user_id, radius_km=1.0) -> list[int]:
    candidates = await redis.geosearch("match:pool", ...)
    active = []
    for uid in candidates:
        if uid == user_id:
            continue
        if await redis.exists(f"match:pool:meta:{uid}"):
            active.append(uid)
        else:
            await redis.zrem("match:pool", uid)  # clean up ghost
    return active
```

This piggybacks on normal traffic — no background job needed. Every `POST /match/activate` and `GET /match/status` call naturally evicts stale entries as a side effect.

---

## Implementation Priority

| Priority | Task |
|----------|------|
| P0 | `match_pool.py` — Redis geo operations |
| P0 | `schemas/match.py` — request/response models |
| P0 | `match_service.py` — activate + find_match logic |
| P0 | `routes/match.py` — 3 endpoints |
| P0 | Register router in `api/router.py` |
| P1 | `find_nearest()` in `EventRepository` for event suggestion |
| P2 | Database migration for match history (optional) |
| P3 | Tests |

---

## Notes

- Redis native `GEOSEARCH` handles spatial queries without PostGIS.
- Lock key is always normalized as `match:lock:<min_uid>:<max_uid>` so A→B and B→A resolve to the same key. Combined with Redis `SET NX`, only the first requester acquires the lock — the other gets `None` and skips, preventing duplicate matches.
- Auth reuses the existing cookie-based session system — no changes needed.
- Client polls `GET /match/status` every 2 seconds for up to 20 seconds, then stops.
- If `POST /match/activate` already finds a match synchronously, the client skips polling entirely.
