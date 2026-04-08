REV ?= -1
MSG ?= init

.PHONY: install run lint format test services-up services-down db-upgrade db-downgrade db-revision

install:
	uv sync --all-groups

run:
	uv run luma run --reload

lint:
	uv run ruff check .

format:
	uv run ruff check . --fix

test:
	uv run pytest

services-up:
	docker compose up -d

services-down:
	docker compose down

db-upgrade:
	uv run luma db-upgrade

db-downgrade:
	uv run luma db-downgrade $(REV)

db-revision:
	uv run luma db-revision "$(MSG)"
