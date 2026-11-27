import asyncio
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI
from sqlalchemy import text

from app.db import Session
from app.mcp.router import router as mcp_router
from app.mcp.scheduler import run_periodic_mcp_sync
from app.repositories.router import router
from app.repositories.scheduler import run_periodic_sync
from app.repositories.seed import seed


@asynccontextmanager
async def lifespan(app: FastAPI):
    with Session() as db:
        seed(db)
    stop_event = asyncio.Event()
    scheduler_task = asyncio.create_task(run_periodic_sync(stop_event))
    mcp_scheduler_task = asyncio.create_task(run_periodic_mcp_sync(stop_event))
    try:
        yield
    finally:
        stop_event.set()
        for task in (scheduler_task, mcp_scheduler_task):
            task.cancel()
            with suppress(asyncio.CancelledError):
                await task


app = FastAPI(title="AI Repository Hub", lifespan=lifespan)
app.include_router(router)
app.include_router(mcp_router)


@app.get("/health")
def health():
    with Session() as db:
        db.execute(text("SELECT 1"))
    return {"status": "ok"}
