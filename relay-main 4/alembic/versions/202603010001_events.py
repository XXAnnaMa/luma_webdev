"""add events table

Revision ID: 202603010001
Revises: 202602280002
Create Date: 2026-03-01 00:01:00

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import ARRAY, UUID

from alembic import op

revision: str = "202603010001"
down_revision: str | None = "202602280002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "events",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("title", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column(
            "image",
            sa.String(length=2048),
            nullable=False,
            server_default=sa.text("''"),
        ),
        sa.Column("category", sa.String(length=50), nullable=False),
        sa.Column("date", sa.String(length=10), nullable=False),
        sa.Column("time", sa.String(length=5), nullable=False),
        sa.Column("address", sa.String(length=500), nullable=False),
        sa.Column("latitude", sa.Float(), nullable=False, server_default="0"),
        sa.Column("longitude", sa.Float(), nullable=False, server_default="0"),
        sa.Column("participant_limit", sa.Integer(), nullable=False),
        sa.Column("current_participants", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "tags",
            ARRAY(sa.String(length=100)),
            nullable=False,
            server_default=sa.text("'{}'::varchar[]"),
        ),
        sa.Column("organizer_name", sa.String(length=200), nullable=False),
        sa.Column("organizer_email", sa.String(length=320), nullable=False),
        sa.Column("organizer_phone", sa.String(length=50), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
    )
    op.create_index(op.f("ix_events_category"), "events", ["category"])
    op.create_index(op.f("ix_events_date"), "events", ["date"])
    op.create_index(op.f("ix_events_user_id"), "events", ["user_id"])


def downgrade() -> None:
    op.drop_index(op.f("ix_events_user_id"), table_name="events")
    op.drop_index(op.f("ix_events_date"), table_name="events")
    op.drop_index(op.f("ix_events_category"), table_name="events")
    op.drop_table("events")
