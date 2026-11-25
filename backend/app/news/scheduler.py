"""Background periodic news synchronization scheduler for FastAPI lifespan."""
from __future__ import annotations

import asyncio
import logging
import os

from app.news.sync import run_news_sync

logger = logging.getLogger(__name__)


def news_scheduler_config() -> dict:
    global_enabled = os.getenv("SYNC_SCHEDULER_ENABLED", "true").strip().lower() in ("1", "true", "yes", "on")
    news_enabled = os.getenv("NEWS_SYNC_ENABLED", "true").strip().lower() in ("1", "true", "yes", "on")
    try:
        interval_hours = max(1.0, float(os.getenv("NEWS_SYNC_INTERVAL_HOURS", "6")))
    except ValueError:
        interval_hours = 6.0
    try:
        repo_limit = max(1, min(30, int(os.getenv("NEWS_REPO_LIMIT", "8"))))
    except ValueError:
        repo_limit = 8
    return {
        "enabled": global_enabled and news_enabled,
        "interval_hours": interval_hours,
        "repo_limit": repo_limit,
    }


async def run_periodic_news_sync(stop_event: asyncio.Event) -> None:
    """Periodically sync public AI feeds and catalog Repo highlights."""
    cfg = news_scheduler_config()
    if not cfg["enabled"]:
        return
    try:
        await asyncio.wait_for(stop_event.wait(), timeout=30.0)
        return
    except asyncio.TimeoutError:
        pass

    interval_seconds = cfg["interval_hours"] * 3600.0
    while not stop_event.is_set():
        try:
            summary = await asyncio.to_thread(
                run_news_sync,
                trigger="scheduled",
                include_rss=True,
                repo_limit=cfg["repo_limit"],
            )
            logger.info("Scheduled news sync finished: %s", summary)
        except Exception as exc:
            logger.warning("Scheduled news sync failed: %s", type(exc).__name__)
        try:
            await asyncio.wait_for(stop_event.wait(), timeout=interval_seconds)
            return
        except asyncio.TimeoutError:
            pass
