from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.db import Base, engine, Session
from app.repositories.router import router
from app.repositories.seed import seed

@asynccontextmanager
async def lifespan(app):
    # Bootstrap only; replace with versioned migrations before schema evolution.
    Base.metadata.create_all(engine)
    with Session() as db:
        seed(db)
    yield

app = FastAPI(title="AI Repository Hub",lifespan=lifespan)
app.include_router(router)
@app.get("/health")
def health():
    return {"status":"ok"}
