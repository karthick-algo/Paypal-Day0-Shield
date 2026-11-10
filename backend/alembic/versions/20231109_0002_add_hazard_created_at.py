"""Add created_at to hazard_events if missing.

Revision ID: 20231109_0002
Revises: 20231108_0001
Create Date: 2026-11-09
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector

revision = "20231109_0002"
down_revision = "20231108_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    columns = [c["name"] for c in inspector.get_columns("hazard_events")]
    if "created_at" not in columns:
        op.add_column(
            "hazard_events",
            sa.Column(
                "created_at",
                sa.DateTime(),
                nullable=True,
                server_default=sa.text("CURRENT_TIMESTAMP"),
            ),
        )


def downgrade() -> None:
    pass
