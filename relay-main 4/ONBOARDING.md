# Luma Developer Onboarding

## Start Here

1. Read architecture and boundaries in `README.md`.
2. Follow the setup steps below.
3. Run the health checks and tests before your PR.

## Prerequisites

- Python `3.12.8` (matches `.python-version`)
- `uv`
- Docker Desktop (or Docker Engine with Compose)
- Git

Check versions:

```bash
python --version
uv --version
docker --version
docker compose version
```

If `uv` is missing:

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

## Initial Setup

From repo root:

```bash
uv sync --all-groups
cp .env.example .env
# set POSTGRES_PASSWORD in .env
docker compose up -d
uv run luma db-upgrade
```

One-command startup on Windows (fallbacks to local services when Docker is unavailable):

```powershell
powershell -ExecutionPolicy Bypass -File scripts/start-all.ps1
```

Run the API:

```bash
uv run luma run --reload
```

Open:
- `http://localhost:8000/docs`
- `http://localhost:8000/redoc`

## Daily Workflow

1. Pull latest changes.
2. Sync dependencies:

```bash
uv sync --all-groups
```

3. Start infra if needed:

```bash
docker compose up -d
```

4. Run app:

```bash
make run
```

5. Before commit:

```bash
make lint
make test
```

## Common Commands

- Install/sync deps: `make install`
- Run app: `make run`
- Start services: `make services-up`
- Stop services: `make services-down`
- Lint: `make lint`
- Auto-fix lint: `make format`
- Test: `make test`
- CI parity check (same as GitHub Actions): `make lint && make test`

Typer CLI equivalents:
- `uv run luma run --reload`
- `uv run luma db-upgrade`
- `uv run luma db-downgrade -1`
- `uv run luma db-revision "add users table"`

## Migrations

After changing SQLAlchemy models:

```bash
uv run luma db-revision "describe change"
uv run luma db-upgrade
```

If needed, rollback one revision:

```bash
uv run luma db-downgrade -1
```

## Where Code Goes

- HTTP handlers: `src/luma/api/routes/`
- Business logic: `src/luma/services/`
- DB queries/access: `src/luma/repositories/`
- Persistence models: `src/luma/db/models/`
- Request/response schemas: `src/luma/schemas/`
- App config: `src/luma/core/config.py`
- Redis wiring: `src/luma/cache/redis.py`

Use this flow for new features:
1. Add model.
2. Add repository.
3. Add service.
4. Add route.
5. Register route in `src/luma/api/router.py`.
6. Add migration.
7. Add tests.

## Local Health Checks

With app running:

```bash
curl -s http://localhost:8000/api/v1/health/live
curl -s http://localhost:8000/api/v1/health/ready
```

## Troubleshooting

`uv` cannot run or missing cache permissions:
- Re-run command in your normal terminal (outside restricted environments).

DB connection failures:
- Confirm Postgres container is healthy: `docker compose ps`
- Confirm `.env` `DATABASE_URL` matches compose config.

Redis connection failures:
- Confirm Redis container is healthy: `docker compose ps`
- Confirm `.env` `REDIS_URL` is reachable.

Port already in use:
- Stop conflicting process or run app on another port:

```bash
uv run luma run --port 8001 --reload
```

## Notes

- Repository directory is `relay`; Python package/app is `luma`.
- Keep routes thin; put domain rules in services and SQL in repositories.
- CI runs lint + tests on push/PR in `.github/workflows/ci.yml`.
