"""Add MCP module tables: mcp_servers profiles and mcp_sync_runs audit log."""
from alembic import op
import sqlalchemy as sa

revision = "0007"
down_revision = "0006"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "mcp_servers",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "repository_id",
            sa.Integer(),
            sa.ForeignKey("repositories.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("server_name", sa.String(100), nullable=False),
        sa.Column("status", sa.String(32), nullable=False),
        sa.Column("transports", sa.JSON(), nullable=True),
        sa.Column("install_methods", sa.JSON(), nullable=True),
        sa.Column("remotes", sa.JSON(), nullable=True),
        sa.Column("env_vars", sa.JSON(), nullable=True),
        sa.Column("requires_secret", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("sources", sa.JSON(), nullable=True),
        sa.Column("evidence_urls", sa.JSON(), nullable=True),
        sa.Column("extracted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_mcp_servers_repository_id", "mcp_servers", ["repository_id"], unique=True)
    op.create_index("ix_mcp_servers_status", "mcp_servers", ["status"])

    op.create_table(
        "mcp_sync_runs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("trigger", sa.String(32), nullable=False),
        sa.Column("status", sa.String(32), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("total_repos", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("detected_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("failed_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("rate_limited", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("error_summary", sa.Text(), nullable=True),
        sa.Column("details", sa.JSON(), nullable=True),
    )
    op.create_index("ix_mcp_sync_runs_trigger", "mcp_sync_runs", ["trigger"])
    op.create_index("ix_mcp_sync_runs_status", "mcp_sync_runs", ["status"])


def downgrade():
    op.drop_index("ix_mcp_sync_runs_status", table_name="mcp_sync_runs")
    op.drop_index("ix_mcp_sync_runs_trigger", table_name="mcp_sync_runs")
    op.drop_table("mcp_sync_runs")
    op.drop_index("ix_mcp_servers_status", table_name="mcp_servers")
    op.drop_index("ix_mcp_servers_repository_id", table_name="mcp_servers")
    op.drop_table("mcp_servers")
