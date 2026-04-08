"""add events lat/lng composite index

Revision ID: 202603050001
Revises: 202603010001
Create Date: 2026-03-05 01:00:00

"""

from collections.abc import Sequence

from alembic import op

revision: str = "202603050001"
down_revision: str | None = "202603010001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_index(
        "ix_events_latitude_longitude",
        "events",
        ["latitude", "longitude"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_events_latitude_longitude", table_name="events")
