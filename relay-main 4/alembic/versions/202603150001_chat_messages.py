"""add chat_messages table

Revision ID: 202603150001
Revises: 202603010001
Create Date: 2026-03-15 00:01:00

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

from alembic import op

revision: str = "202603150001"
down_revision: str | None = "202603010001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "chat_messages",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("role", sa.String(length=20), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index(op.f("ix_chat_messages_user_id"), "chat_messages", ["user_id"])
    op.create_index(op.f("ix_chat_messages_created_at"), "chat_messages", ["created_at"])


def downgrade() -> None:
    op.drop_index(op.f("ix_chat_messages_created_at"), table_name="chat_messages")
    op.drop_index(op.f("ix_chat_messages_user_id"), table_name="chat_messages")
    op.drop_table("chat_messages")
