"""Add upstream guide, topics, language, homepage, branch, archived, and discovery timestamp."""
from alembic import op
import sqlalchemy as sa

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("repositories", sa.Column("guide_vi", sa.Text(), nullable=True))
    op.add_column("repositories", sa.Column("homepage", sa.String(500), nullable=True))
    op.add_column("repositories", sa.Column("topics", sa.JSON(), nullable=True))
    op.add_column("repositories", sa.Column("language", sa.String(100), nullable=True))
    op.add_column("repositories", sa.Column("default_branch", sa.String(100), nullable=True))
    op.add_column(
        "repositories",
        sa.Column("archived", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column("repositories", sa.Column("discovered_at", sa.DateTime(timezone=True), nullable=True))
    op.create_index("ix_repositories_language", "repositories", ["language"])


def downgrade():
    op.drop_index("ix_repositories_language", table_name="repositories")
    op.drop_column("repositories", "discovered_at")
    op.drop_column("repositories", "archived")
    op.drop_column("repositories", "default_branch")
    op.drop_column("repositories", "language")
    op.drop_column("repositories", "topics")
    op.drop_column("repositories", "homepage")
    op.drop_column("repositories", "guide_vi")
