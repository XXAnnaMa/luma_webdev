# LUMA Map Discovery Backend Handoff

Last updated: 2026-03-05
Owner: Backend (Map scope)

## 1. What has been delivered

The map-related backend MVP is implemented and validated.

### Delivered API

- New endpoint: `GET /api/v1/events/map`
- Purpose: return map-friendly event data within the current viewport (bbox).

### Delivered capabilities

- Viewport filtering by bounding box:
  - `min_lat`, `max_lat`, `min_lng`, `max_lng`
- Existing filters are supported on top of bbox:
  - `category`, `date`, `search`
- Pagination:
  - `limit` default `500`
  - `offset` default `0`
  - `limit` max `2000`
- Validation:
  - rejects invalid bbox ranges (`min_lat > max_lat`, `min_lng > max_lng`)
- Performance foundation:
  - DB composite index on coordinates: `ix_events_latitude_longitude`
  - Alembic migration added: `202603050001_events_lat_lng_index.py`

### Validation status

- Automated tests: `5 passed`
- Manual API checks completed:
  - valid bbox -> `200`
  - invalid bbox -> `422`
  - over limit (`limit > 2000`) -> `422`

## 2. API contract for frontend

### Endpoint

`GET /api/v1/events/map`

### Query params

| Param | Type | Required | Notes |
|---|---|---|---|
| `min_lat` | float | Yes | `-90` to `90` |
| `max_lat` | float | Yes | `-90` to `90` |
| `min_lng` | float | Yes | `-180` to `180` |
| `max_lng` | float | Yes | `-180` to `180` |
| `category` | string | No | Exact category string (case-insensitive in backend) |
| `date` | string | No | `YYYY-MM-DD` |
| `search` | string | No | Searches title/description/address |
| `limit` | int | No | Default `500`, max `2000` |
| `offset` | int | No | Default `0` |

### Success response (`200`)

```json
{
  "events": [
    {
      "id": "50cb7705-28e5-4f2e-8fa8-902b6500911b",
      "title": "Community Meetup",
      "category": "Tech",
      "date": "2026-03-20",
      "time": "19:30",
      "address": "123 Main St, Los Angeles, CA",
      "location": {
        "lat": 34.0522,
        "lng": -118.2437
      }
    }
  ],
  "total": 1
}
```

### Error responses (`422`)

1. Custom range validation:

```json
{
  "detail": "min_lat cannot be greater than max_lat"
}
```

or

```json
{
  "detail": "min_lng cannot be greater than max_lng"
}
```

2. FastAPI schema validation (example: `limit=3000`):

```json
{
  "detail": [
    {
      "loc": ["query", "limit"],
      "msg": "Input should be less than or equal to 2000"
    }
  ]
}
```

## 3. Frontend integration guide (Leaflet/Mapbox agnostic)

### Step 1: Convert viewport to bbox params

From map bounds:

- `min_lat = south`
- `max_lat = north`
- `min_lng = west`
- `max_lng = east`

### Step 2: Trigger fetch on viewport settle

- Trigger on `moveend` / `zoomend` (not on every frame).
- Recommended: 250-400ms debounce.
- Cancel stale requests (AbortController).

### Step 3: Call API

Example:

```http
GET /api/v1/events/map?min_lat=33.9&max_lat=34.2&min_lng=-118.5&max_lng=-118.0&limit=500&offset=0
```

### Step 4: Render markers

Use:

- `id` as stable marker key
- `location.lat/lng` for coordinates
- `title/category/date/time/address` for popup/card summary

### Step 5: Pagination strategy (if needed)

- Start with `limit=500, offset=0`.
- If `total > events.length`, request next pages by increasing `offset`.

## 4. What Product and Team should know

### Done

- Map discovery backend MVP is ready for frontend integration.
- Supports viewport-based querying and basic filters.
- Includes basic performance hardening (coordinate index + bounded limit).

### Not in this backend scope yet

- Marker clustering logic (frontend or separate API strategy decision pending)
- Frontend-side debounce/cancel implementation
- Caching strategy (ETag/server cache)
- Geo-distance sort/rank
- Personalization, auth-dependent map behavior

## 5. Example QA checklist

1. Move map to a new city -> events update by viewport.
2. Reverse bbox params manually -> API returns `422`.
3. Set `limit=3000` -> API returns `422`.
4. Apply `category/date/search` with bbox -> filtered list returns correctly.
5. Request with `offset` pagination -> no duplicate marker ids across pages.
