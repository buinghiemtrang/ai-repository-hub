"""Background metadata refresh scheduler for FastAPI lifespan."""
import asyncio
import logging
import os

from app.repositories.sync import run_sync

logger = logging.getLogger(__name__)


def scheduler_config() -> dict:
    enabled_raw = os.getenv("SYNC_SCHEDULER_ENABLED", "true").strip().lower()
    enabled = enabled_raw in ("1", "true", "yes", "on")
    try:
        interval_hours = max(1.0, float(os.getenv("SYNC_INTERVAL_HOURS", "24")))
    except ValueError:
        interval_hours = 24.0
    try:
        min_age_hours = max(1.0, float(os.getenv("SYNC_MIN_AGE_HOURS", "12")))
    except ValueError:
        min_age_hours = 12.0
    default_limit = "500" if os.getenv("GITHUB_TOKEN", "").strip() else "40"
    try:
        batch_limit = max(1, int(os.getenv("SYNC_BATCH_LIMIT", default_limit)))
    except ValueError:
        batch_limit = int(default_limit)
    return {
        "enabled": enabled,
        "interval_hours": interval_hours,
        "min_age_hours": min_age_hours,
        "batch_limit": batch_limit,
        "has_github_token": bool(os.getenv("GITHUB_TOKEN", "").strip()),
    }


async def run_periodic_sync(stop_event: asyncio.Event):
    """Periodically sync stale repository metadata without blocking the event loop."""
    cfg = scheduler_config()
    if not cfg["enabled"]:
        return
    # Delay initial automatic sync slightly after startup so healthchecks return immediately.
    try:
        await asyncio.wait_for(stop_event.wait(), timeout=60.0)
        return
    except asyncio.TimeoutError:
        pass

    interval_seconds = cfg["interval_hours"] * 3600.0
    while not stop_event.is_set():
        try:
            summary = await asyncio.to_thread(
                run_sync,
                trigger="scheduled",
                limit=cfg["batch_limit"],
                min_age_hours=cfg["min_age_hours"],
                include_readme=True,
            )
            logger.info("Scheduled sync finished: %s", summary)
        except Exception as exc:
            logger.warning("Scheduled sync failed: %s", type(exc).__name__)
        try:
            await asyncio.wait_for(stop_event.wait(), timeout=interval_seconds)
            return
        except asyncio.TimeoutError:
            pass
