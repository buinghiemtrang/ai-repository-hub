"""Baseline catalog: supports pre-existing M0 bootstrap table."""
from alembic import op
import sqlalchemy as sa

revision="0001"
down_revision=None
branch_labels=None
depends_on=None

def upgrade():
    if not sa.inspect(op.get_bind()).has_table("repositories"):
        op.create_table("repositories",
            sa.Column("id",sa.Integer(),primary_key=True),
            sa.Column("full_name",sa.String(255),nullable=False),
            sa.Column("github_id",sa.BigInteger(),unique=True),
            sa.Column("category",sa.String(100),nullable=False),
            sa.Column("description_vi",sa.Text(),nullable=False),
            sa.Column("description_upstream",sa.Text()),
            sa.Column("stars",sa.Integer()),
            sa.Column("forks",sa.Integer()),
            sa.Column("watchers",sa.Integer()),
            sa.Column("updated_at",sa.DateTime(timezone=True)),
            sa.Column("synced_at",sa.DateTime(timezone=True)),
            sa.Column("license",sa.String(100)))
        op.create_index("ix_repositories_full_name","repositories",["full_name"],unique=True)
        op.create_index("ix_repositories_category","repositories",["category"])

def downgrade():
    raise RuntimeError("Baseline downgrade would destroy catalog data; restore a verified backup instead.")
