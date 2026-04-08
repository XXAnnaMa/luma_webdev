"""baseline

Revision ID: 202602280001
Revises: None
Create Date: 2026-02-28 00:01:00

"""

from collections.abc import Sequence

# No schema operations yet. Keep baseline so migration flow is initialized.
revision: str = "202602280001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
