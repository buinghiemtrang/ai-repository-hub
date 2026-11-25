import asyncio
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI
from sqlalchemy import text

from app.db import Session
from app.repositories.router import router
from app.repositories.scheduler import run_periodic_sync
from app.repositories.seed import seed


@asynccontextmanager
async def lifespan(app: FastAPI):
    with Session() as db:
        seed(db)
    stop_event = asyncio.Event()
    scheduler_task = asyncio.create_task(run_periodic_sync(stop_event))
    try:
        yield
    finally:
        stop_event.set()
        scheduler_task.cancel()
        with suppress(asyncio.CancelledError):
            await scheduler_task


app = FastAPI(title="AI Repository Hub", lifespan=lifespan)
app.include_router(router)


@app.get("/health")
def health():
    with Session() as db:
        db.execute(text("SELECT 1"))
    return {"status": "ok"}
