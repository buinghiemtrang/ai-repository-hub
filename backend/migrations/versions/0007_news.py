"""Add news_days, news_items, and news_sync_runs tables."""
from alembic import op
import sqlalchemy as sa

revision = "0007"
down_revision = "0006"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "news_days",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("date", sa.Date(), nullable=False, unique=True),
        sa.Column("intro", sa.Text(), nullable=True),
        sa.Column("heads", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_news_days_date", "news_days", ["date"])

    op.create_table(
        "news_items",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("external_id", sa.String(64), nullable=False, unique=True),
        sa.Column(
            "day_date",
            sa.Date(),
            sa.ForeignKey("news_days.date", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("section", sa.String(100), nullable=False),
        sa.Column("batch", sa.String(20), nullable=False, server_default="morning"),
        sa.Column("is_tip", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("is_picked", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("excerpt", sa.Text(), nullable=True),
        sa.Column("full_text", sa.Text(), nullable=True),
        sa.Column("speech_text", sa.Text(), nullable=True),
        sa.Column("source", sa.String(255), nullable=False),
        sa.Column("source_label", sa.String(255), nullable=True),
        sa.Column("author", sa.String(255), nullable=True),
        sa.Column("url", sa.String(1000), nullable=True),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("time_label", sa.String(80), nullable=True),
        sa.Column("time_estimated", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("tags", sa.JSON(), nullable=True),
        sa.Column("images", sa.JSON(), nullable=True),
        sa.Column("video", sa.JSON(), nullable=True),
        sa.Column("sources", sa.JSON(), nullable=True),
        sa.Column("confidence", sa.String(40), nullable=True),
        sa.Column(
            "repository_id",
            sa.Integer(),
            sa.ForeignKey("repositories.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_news_items_external_id", "news_items", ["external_id"])
    op.create_index("ix_news_items_day_date", "news_items", ["day_date"])
    op.create_index("ix_news_items_section", "news_items", ["section"])
    op.create_index("ix_news_items_batch", "news_items", ["batch"])
    op.create_index("ix_news_items_repository_id", "news_items", ["repository_id"])

    op.create_table(
        "news_sync_runs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("trigger", sa.String(32), nullable=False),
        sa.Column("status", sa.String(32), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("fetched_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("inserted_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("repo_items_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("error_summary", sa.Text(), nullable=True),
        sa.Column("details", sa.JSON(), nullable=True),
    )
    op.create_index("ix_news_sync_runs_trigger", "news_sync_runs", ["trigger"])
    op.create_index("ix_news_sync_runs_status", "news_sync_runs", ["status"])


def downgrade():
    op.drop_index("ix_news_sync_runs_status", table_name="news_sync_runs")
    op.drop_index("ix_news_sync_runs_trigger", table_name="news_sync_runs")
    op.drop_table("news_sync_runs")

    op.drop_index("ix_news_items_repository_id", table_name="news_items")
    op.drop_index("ix_news_items_batch", table_name="news_items")
    op.drop_index("ix_news_items_section", table_name="news_items")
    op.drop_index("ix_news_items_day_date", table_name="news_items")
    op.drop_index("ix_news_items_external_id", table_name="news_items")
    op.drop_table("news_items")

    op.drop_index("ix_news_days_date", table_name="news_days")
    op.drop_table("news_days")
