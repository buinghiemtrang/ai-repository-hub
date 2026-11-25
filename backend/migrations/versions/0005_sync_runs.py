"""Add sync_runs table for scheduled and manual metadata sync logging."""
from alembic import op
import sqlalchemy as sa

revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "sync_runs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("trigger", sa.String(32), nullable=False),
        sa.Column("status", sa.String(32), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("total_repos", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("synced_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("failed_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("rate_limited", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("error_summary", sa.Text(), nullable=True),
        sa.Column("details", sa.JSON(), nullable=True),
    )
    op.create_index("ix_sync_runs_trigger", "sync_runs", ["trigger"])
    op.create_index("ix_sync_runs_status", "sync_runs", ["status"])


def downgrade():
    op.drop_index("ix_sync_runs_status", table_name="sync_runs")
    op.drop_index("ix_sync_runs_trigger", table_name="sync_runs")
    op.drop_table("sync_runs")
