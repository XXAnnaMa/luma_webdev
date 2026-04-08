# LUMA Shake-to-Match Backend Handoff

Last updated: 2026-03-15
Owner: Backend (Match scope)

## 1. What has been delivered

The shake-to-match backend MVP is implemented and validated.

### Delivered API

- `POST /api/v1/match/activate` — enter the matchmaking pool
- `GET /api/v1/match/status` — poll for match result
- `DELETE /api/v1/match/activate` — cancel and leave the pool

### Delivered capabilities

- Proximity-based matching using Redis GeoSet (`GEOSEARCH`, radius = 1 km)
- 20-second matchmaking window (meta key TTL)
- Synchronous match on activate: if a nearby user is already waiting, a match is returned immediately without any polling needed
- Nearest event suggestion to the midpoint of the matched pair
- Atomic dedup lock (`SET NX`) to prevent the same pair from being matched twice
- Ghost cleanup: stale pool entries are lazily evicted on each search — no background job needed
- Auth: reuses existing cookie-based session system — no changes needed on auth flow

### Validation status

- Automated tests: `12 passed` (27 total across all suites, zero regression)
- All three endpoints protected by session auth

---

## 2. API contract for frontend

### Auth

All three endpoints require a valid session cookie (`session_id`). Include cookies in every request (`credentials: "include"` in fetch / `withCredentials: true` in axios).

If the session is missing or expired, all endpoints return `401`.

---

### `POST /api/v1/match/activate`

User enters the matchmaking pool.

**Request body:**

```json
{ "lat": 37.7749, "lng": -122.4194 }
```

**Response — waiting (no nearby user found yet):**

```json
{ "status": "waiting", "expires_in": 20 }
```

**Response — matched immediately (nearby user was already waiting):**

```json
{
  "status": "matched",
  "matched_user": {
    "id": 42,
    "email": "jane@example.com",
    "full_name": "Jane Doe",
    "is_active": true
  },
  "suggested_event": {
    "id": "50cb7705-28e5-4f2e-8fa8-902b6500911b",
    "title": "Open Mic Night",
    "category": "Music",
    "date": "2026-03-15",
    "time": "20:00",
    "address": "123 Main St, San Francisco, CA",
    "location": { "lat": 37.7749, "lng": -122.4194 }
  }
}
```

> `suggested_event` may be `null` if no events exist near the match midpoint.

**Error responses:**

| Status | Condition |
|--------|-----------|
| `401` | Not authenticated |
| `409` | User is already in the matching pool |
| `422` | Missing or invalid request body |

---

### `GET /api/v1/match/status`

Poll for match result. Call every 2 seconds while status is `waiting`.

**Response — still waiting:**

```json
{ "status": "waiting", "expires_in": 12 }
```

**Response — matched:**

```json
{
  "status": "matched",
  "matched_user": {
    "id": 42,
    "email": "jane@example.com",
    "full_name": "Jane Doe",
    "is_active": true
  },
  "suggested_event": {
    "id": "50cb7705-28e5-4f2e-8fa8-902b6500911b",
    "title": "Open Mic Night",
    "category": "Music",
    "date": "2026-03-15",
    "time": "20:00",
    "address": "123 Main St, San Francisco, CA",
    "location": { "lat": 37.7749, "lng": -122.4194 }
  }
}
```

**Response — timed out (20s window expired, no match found):**

```json
{ "status": "timeout" }
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `401` | Not authenticated |

---

### `DELETE /api/v1/match/activate`

Cancel matchmaking and leave the pool early.

**Response (`200`):**

```json
{ "detail": "Cancelled" }
```

**Error responses:**

| Status | Condition |
|--------|-----------|
| `401` | Not authenticated |

---

## 3. Frontend integration guide

### Recommended flow

```
User shakes / taps button
        │
        ▼
POST /match/activate
        │
        ├─ status: "matched"  ──► show match result, stop
        │
        └─ status: "waiting"
                │
                ▼
        Poll GET /match/status every 2s
                │
                ├─ status: "matched"  ──► show match result, stop polling
                ├─ status: "timeout"  ──► show timeout UI, stop polling
                └─ status: "waiting"  ──► continue (up to 20s)
```

### Step 1: Activate

```js
const res = await fetch("/api/v1/match/activate", {
  method: "POST",
  credentials: "include",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ lat, lng }),
});
const data = await res.json();

if (data.status === "matched") {
  // show match immediately, skip polling
}
```

### Step 2: Poll for result

Only start polling if `POST /activate` returns `status: "waiting"`.

```js
const poll = setInterval(async () => {
  const res = await fetch("/api/v1/match/status", { credentials: "include" });
  const data = await res.json();

  if (data.status === "matched" || data.status === "timeout") {
    clearInterval(poll);
    // handle result
  }
}, 2000);

// Safety stop after 22s (buffer beyond server-side 20s window)
setTimeout(() => clearInterval(poll), 22000);
```

### Step 3: Cancel (optional)

If the user navigates away or dismisses the UI while still waiting:

```js
await fetch("/api/v1/match/activate", {
  method: "DELETE",
  credentials: "include",
});
```

### Step 4: Display match result

Fields available on a `matched` response:

| Field | Notes |
|-------|-------|
| `matched_user.full_name` | Display name |
| `matched_user.email` | Contact info |
| `suggested_event.title` | Event name |
| `suggested_event.category` | e.g. `Music`, `Tech`, `Food` |
| `suggested_event.date` | `YYYY-MM-DD` |
| `suggested_event.time` | `HH:MM` (24h) |
| `suggested_event.address` | Full address string |
| `suggested_event.location` | `{ lat, lng }` for map pin |
| `suggested_event.id` | UUID — use to link to event detail page |

> `suggested_event` can be `null`. Handle this case gracefully (e.g. "No nearby events found, but you matched!").

---

## 4. What product and team should know

### Done

- Matchmaking backend MVP ready for frontend integration
- Immediate match on activate — no polling needed if users shake at the same time
- Nearest event suggestion included in match result
- Session auth reused — no new auth work required

### Not in this backend scope yet

- Match history / persistence (currently Redis-only, no DB record)
- Push notifications (no WebSocket — pure polling)
- Match radius configuration (currently hardcoded to 1 km)
- Re-matching after timeout (user must activate again)

---

## 5. Example QA checklist

1. Call `POST /activate` without cookie → `401`.
2. Call `POST /activate` twice with same session → second call returns `409`.
3. Two users within 1 km activate within 20s of each other → both receive `matched` result with each other's info.
4. One user activates, no other user joins within 20s → `GET /status` eventually returns `timeout`.
5. User cancels via `DELETE /activate` → removed from pool; subsequent `GET /status` returns `timeout`.
6. Match result includes `suggested_event` when events exist near the midpoint; `null` when none exist.
7. `POST /activate` returns `matched` immediately when the other user is already waiting (no polling needed).
