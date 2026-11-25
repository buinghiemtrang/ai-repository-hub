"""Enable Vietnamese accent-insensitive search on PostgreSQL."""
from alembic import op
revision="0003"
down_revision="0002"
branch_labels=None
depends_on=None

def upgrade():
    op.execute("CREATE EXTENSION IF NOT EXISTS unaccent")

def downgrade():
    # The shared extension may be used by other modules; do not drop it.
    pass
