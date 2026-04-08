"""merge heads

Revision ID: 96147cfc3654
Revises: 202603050001, 202603150001
Create Date: 2026-03-15 05:51:21.776536

"""

from collections.abc import Sequence

# revision identifiers, used by Alembic.
revision: str = "96147cfc3654"
down_revision: str | None = ("202603050001", "202603150001")
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
