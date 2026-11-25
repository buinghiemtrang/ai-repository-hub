"""Add repository preview image, owner avatar URL, and custom image flag."""
from alembic import op
import sqlalchemy as sa

revision = "0006"
down_revision = "0005"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("repositories", sa.Column("image_url", sa.String(500), nullable=True))
    op.add_column("repositories", sa.Column("owner_avatar_url", sa.String(500), nullable=True))
    op.add_column(
        "repositories",
        sa.Column("has_custom_image", sa.Boolean(), nullable=False, server_default=sa.false()),
    )


def downgrade():
    op.drop_column("repositories", "has_custom_image")
    op.drop_column("repositories", "owner_avatar_url")
    op.drop_column("repositories", "image_url")
