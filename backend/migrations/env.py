from alembic import context
from app.db import Base, engine
from app.repositories.models import Repository, SyncRun

with engine.connect() as connection:
    context.configure(connection=connection, target_metadata=Base.metadata)
    with context.begin_transaction():
        context.run_migrations()
