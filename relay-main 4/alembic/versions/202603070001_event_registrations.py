"""add event_registrations table

Revision ID: 202603070001
Revises: 202603050001
Create Date: 2026-03-07 23:55:00

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

from alembic import op

revision: str = "202603070001"
down_revision: str | None = "202603050001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "event_registrations",
        sa.Column(
            "id",
            UUID(as_uuid=True),
            nullable=False,
            ),
        sa.Column("event_id", UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column(
            "registered_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["event_id"], ["events.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("event_id", "user_id", name="uq_event_registrations_event_user"),
    )
    op.create_index(
        "ix_event_registrations_user_id", "event_registrations", ["user_id"], unique=False
    )
    op.create_index(
        "ix_event_registrations_event_id", "event_registrations", ["event_id"], unique=False
    )


def downgrade() -> None:
    op.drop_index("ix_event_registrations_user_id", table_name="event_registrations")
    op.drop_index("ix_event_registrations_event_id", table_name="event_registrations")
    op.drop_table("event_registrations")
