# Luma

FastAPI REST API scaffold focused on clear boundaries and fast onboarding.
Start here for local setup and day-to-day workflow: [ONBOARDING.md](ONBOARDING.md).

## Stack

- Python `3.12.8`
- `uv` for dependency and task execution
- FastAPI + Uvicorn
- PostgreSQL + SQLAlchemy (async)
- Alembic migrations
- Redis
- Typer CLI (`uv run luma ...`)
- GitHub Actions CI (`ruff` + `pytest`)

## Architecture At A Glance

- `api`: HTTP transport layer (routes, request/response mapping)
- `services`: business/use-case logic
- `repositories`: database query/access logic
- `db/models`: SQLAlchemy persistence models
- `schemas`: API DTOs (Pydantic)
- `core`: app settings/shared app config
- `cache`: Redis client/wrappers

Keep routes thin. Put rules in services. Put SQL in repositories.

## Project Layout

```text
.
├── src/luma/
│   ├── api/
│   │   ├── router.py                # Top-level API router registration
│   │   └── routes/
│   │       ├── health.py            # Liveness/readiness endpoints
│   │       └── users.py             # Users HTTP endpoints
│   ├── services/
│   │   └── user_service.py          # Users business rules
│   ├── repositories/
│   │   └── user_repository.py       # Users DB access
│   ├── db/
│   │   ├── session.py               # Engine/session factory
│   │   └── models/
│   │       └── user.py              # SQLAlchemy models
│   ├── schemas/
│   │   └── user.py                  # Pydantic request/response schemas
│   ├── core/config.py               # Environment-driven settings
│   ├── cache/redis.py               # Redis client wiring
│   ├── cli.py                       # Typer commands
│   └── main.py                      # FastAPI app factory
├── alembic/
│   ├── env.py
│   └── versions/
├── tests/
├── .github/workflows/ci.yml         # Lint + test on push/PR
├── docker-compose.yml               # Postgres + Redis
├── makefile
└── pyproject.toml
```

## Request Flow

1. Route receives HTTP request (`api/routes/*`).
2. Route calls a service (`services/*`).
3. Service applies business rules and delegates persistence.
4. Repository executes SQLAlchemy queries (`repositories/*`).
5. Route maps model output to response schema (`schemas/*`).

## Quick Start

1. Install dependencies:

```bash
uv sync --all-groups
```

2. Create env file:

```bash
cp .env.example .env
# set POSTGRES_PASSWORD in .env
```

3. Start external dependencies:

```bash
docker compose up -d
```

4. Apply DB migrations:

```bash
uv run luma db-upgrade
```

5. Run API:

```bash
uv run luma run --reload
```

Open:
- Swagger: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Dev Commands

Using Make:
- `make install`
- `make run`
- `make lint`
- `make format`
- `make test`
- `make services-up`
- `make services-down`
- `make db-upgrade`
- `make db-downgrade REV=-1`
- `make db-revision MSG="create users table"`

Using Typer directly:
- `uv run luma run --reload`
- `uv run luma db-upgrade`
- `uv run luma db-downgrade -1`
- `uv run luma db-revision "add users index"`

## Current Endpoints

- Health
  - `GET /api/v1/health/live`
  - `GET /api/v1/health/ready`
- Users starter slice
  - `GET /api/v1/users`
  - `POST /api/v1/users`
- Events map discovery
  - `GET /api/v1/events/map?min_lat={...}&max_lat={...}&min_lng={...}&max_lng={...}`
  - Defaults: `limit=500`, `offset=0` (max `limit=2000`)

## Configuration

Key env vars (see `.env.example`):
- `APP_NAME`
- `ENVIRONMENT`
- `DEBUG`
- `DOCS_ENABLED`
- `REDOC_ENABLED`
- `OPENAPI_ENABLED`
- `API_V1_PREFIX`
- `CORS_ALLOW_ORIGINS`
- `TRUSTED_HOSTS`
- `DATABASE_URL`
- `REDIS_URL`

## Course-Friendly Security Defaults

- Local/dev/test default to debug + OpenAPI docs enabled unless explicitly overridden.
- For non-local environments, you can set:
  - `ENVIRONMENT=prod`
  - `DEBUG=false`
  - `DOCS_ENABLED=false`
  - `REDOC_ENABLED=false`
  - `OPENAPI_ENABLED=false`

## Dev Guide

When adding a new resource (for example, `projects`):

1. Add SQLAlchemy model in `src/luma/db/models/project.py`.
2. Export model in `src/luma/db/models/__init__.py`.
3. Add repository in `src/luma/repositories/project_repository.py`.
4. Add service in `src/luma/services/project_service.py`.
5. Add schemas in `src/luma/schemas/project.py`.
6. Add route in `src/luma/api/routes/projects.py`.
7. Register route in `src/luma/api/router.py`.
8. Create migration:

```bash
uv run luma db-revision "add projects table"
uv run luma db-upgrade
```

9. Add tests in `tests/`.

## Migrations

- Create migration: `uv run luma db-revision "message"`
- Upgrade: `uv run luma db-upgrade`
- Downgrade one step: `uv run luma db-downgrade -1`

## Notes

- `src` layout is used to keep import behavior explicit and packaging-friendly.
