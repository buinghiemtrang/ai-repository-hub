"""Store catalog source links."""
from alembic import op
import sqlalchemy as sa

revision="0002"
down_revision="0001"
branch_labels=None
depends_on=None

def upgrade():
    op.add_column("repositories",sa.Column("source_urls",sa.JSON(),nullable=True))

def downgrade():
    op.drop_column("repositories","source_urls")
