import asyncio
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI
from sqlalchemy import text

from app.db import Session
from app.news.router import router as news_router
from app.news.scheduler import run_periodic_news_sync
from app.news.seed import seed_news
from app.repositories.router import router as repositories_router
from app.repositories.scheduler import run_periodic_sync
from app.repositories.seed import seed

# Ensure SQLAlchemy metadata registers all module models
import app.news.models  # noqa: F401
import app.repositories.models  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    with Session() as db:
        seed(db)
        seed_news(db)
    stop_event = asyncio.Event()
    scheduler_task = asyncio.create_task(run_periodic_sync(stop_event))
    news_scheduler_task = asyncio.create_task(run_periodic_news_sync(stop_event))
    try:
        yield
    finally:
        stop_event.set()
        scheduler_task.cancel()
        news_scheduler_task.cancel()
        with suppress(asyncio.CancelledError):
            await scheduler_task
        with suppress(asyncio.CancelledError):
            await news_scheduler_task


app = FastAPI(title="AI Repository Hub", lifespan=lifespan)
app.include_router(repositories_router)
app.include_router(news_router)


@app.get("/health")
def health():
    with Session() as db:
        db.execute(text("SELECT 1"))
    return {"status": "ok"}
