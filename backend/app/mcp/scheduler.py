"""Background scheduler for periodic MCP profile extraction (started from FastAPI lifespan)."""
import asyncio
import logging
import os

from app.mcp.sync import run_mcp_sync

logger = logging.getLogger(__name__)


def _float_env(name: str, default: float, minimum: float) -> float:
    try:
        return max(minimum, float(os.getenv(name, str(default))))
    except ValueError:
        return default


def mcp_scheduler_config() -> dict:
    enabled = os.getenv("MCP_SYNC_ENABLED", "true").strip().lower() in ("1", "true", "yes", "on")
    has_token = bool(os.getenv("GITHUB_TOKEN", "").strip())
    default_limit = 200 if has_token else 15
    try:
        batch_limit = max(1, int(os.getenv("MCP_SYNC_BATCH_LIMIT", str(default_limit))))
    except ValueError:
        batch_limit = default_limit
    return {
        "enabled": enabled,
        "interval_hours": _float_env("MCP_SYNC_INTERVAL_HOURS", 24.0, 1.0),
        "min_age_hours": _float_env("MCP_SYNC_MIN_AGE_HOURS", 12.0, 1.0),
        "batch_limit": batch_limit,
        "has_github_token": has_token,
    }


async def run_periodic_mcp_sync(stop_event: asyncio.Event, initial_delay: float = 300.0):
    """Run MCP extraction periodically; starts after the repository sync so metadata is fresh."""
    cfg = mcp_scheduler_config()
    if not cfg["enabled"]:
        return
    try:
        await asyncio.wait_for(stop_event.wait(), timeout=initial_delay)
        return
    except asyncio.TimeoutError:
        pass

    while not stop_event.is_set():
        try:
            summary = await asyncio.to_thread(
                run_mcp_sync,
                trigger="scheduled",
                limit=cfg["batch_limit"],
                min_age_hours=cfg["min_age_hours"],
            )
            logger.info("Scheduled MCP sync finished: %s", summary)
        except Exception as exc:
            logger.warning("Scheduled MCP sync failed: %s", type(exc).__name__)
        try:
            await asyncio.wait_for(stop_event.wait(), timeout=cfg["interval_hours"] * 3600.0)
            return
        except asyncio.TimeoutError:
            pass
