"""Extract MCP server profiles for catalog repositories in the MCP category, with run logging."""
from __future__ import annotations

import argparse
from datetime import datetime, timedelta, timezone
import os

import httpx
from sqlalchemy import select

from app.db import Session
from app.mcp.extractor import extract_profile
from app.mcp.models import McpServer, McpSyncRun
from app.repositories.github_client import RateLimitError, build_github_headers, get_with_retry
from app.repositories.models import Repository

RAW_ACCEPT = {"Accept": "application/vnd.github.raw+json"}
MAX_FILE_CHARS = 200_000


def mcp_categories() -> list[str]:
    raw = os.getenv("MCP_CATEGORIES", "MCP")
    values = [c.strip() for c in raw.split(",") if c.strip()]
    return values or ["MCP"]


def _fetch_raw(client: httpx.Client, url: str) -> str | None:
    res = get_with_retry(client, url, headers=RAW_ACCEPT, max_retries=1)
    if res.status_code == 200:
        return res.text[:MAX_FILE_CHARS]
    if res.status_code == 404:
        return None
    res.raise_for_status()
    return None


def _evidence_urls(repo: Repository, sources: list[str]) -> list[str]:
    branch = repo.default_branch or "HEAD"
    urls = []
    if "server.json" in sources:
        urls.append(f"https://github.com/{repo.full_name}/blob/{branch}/server.json")
    if "readme" in sources:
        urls.append(f"https://github.com/{repo.full_name}#readme")
    return urls


def apply_profile(db, repo: Repository, server_json_text: str | None, readme_text: str | None) -> McpServer:
    """Upsert the McpServer row for a repository from upstream file text."""
    repo_name = repo.full_name.split("/", 1)[-1]
    profile = extract_profile(repo_name, server_json_text, readme_text)
    row = db.scalar(select(McpServer).where(McpServer.repository_id == repo.id))
    if row is None:
        row = McpServer(repository_id=repo.id)
        db.add(row)
    row.server_name = profile.server_name
    row.status = "detected" if profile.detected else "no_config_found"
    row.transports = profile.transports
    row.install_methods = profile.install_methods
    row.remotes = profile.remotes
    row.env_vars = profile.env_vars
    row.requires_secret = profile.requires_secret
    row.sources = profile.sources
    row.evidence_urls = _evidence_urls(repo, profile.sources)
    row.extracted_at = datetime.now(timezone.utc)
    return row


def run_mcp_sync(
    trigger: str = "cli",
    limit: int | None = None,
    min_age_hours: float = 0.0,
    client_factory=None,
    session_factory=Session,
) -> dict:
    """Fetch server.json + README for MCP-category repositories and store parsed profiles."""
    started_at = datetime.now(timezone.utc)
    with session_factory() as db:
        run = McpSyncRun(
            trigger=trigger, status="running", started_at=started_at,
            total_repos=0, detected_count=0, failed_count=0, rate_limited=False,
        )
        db.add(run)
        db.commit()
        run_id = run.id

    stmt = (
        select(Repository)
        .outerjoin(McpServer, McpServer.repository_id == Repository.id)
        .where(Repository.category.in_(mcp_categories()))
        .order_by(McpServer.extracted_at.asc().nulls_first(), Repository.id.asc())
    )
    if min_age_hours > 0:
        cutoff = started_at - timedelta(hours=min_age_hours)
        stmt = stmt.where(McpServer.extracted_at.is_(None) | (McpServer.extracted_at < cutoff))
    if limit is not None and limit > 0:
        stmt = stmt.limit(limit)

    headers = build_github_headers()
    factory = client_factory or (lambda: httpx.Client(headers=headers, timeout=20))
    total = detected = failed = 0
    rate_limited = False
    failures: list[dict] = []

    try:
        with session_factory() as db, factory() as client:
            repos = db.scalars(stmt).all()
            total = len(repos)
            for repo in repos:
                base = f"https://api.github.com/repos/{repo.full_name}"
                try:
                    server_json = _fetch_raw(client, f"{base}/contents/server.json")
                    readme = _fetch_raw(client, f"{base}/readme")
                    row = apply_profile(db, repo, server_json, readme)
                    db.commit()
                    if row.status == "detected":
                        detected += 1
                except RateLimitError as exc:
                    db.rollback()
                    rate_limited = True
                    failures.append({"full_name": repo.full_name, "reason": str(exc)[:200]})
                    break
                except (httpx.HTTPError, ValueError, KeyError) as exc:
                    db.rollback()
                    failed += 1
                    failures.append({"full_name": repo.full_name, "reason": type(exc).__name__})
    except Exception as exc:
        failures.append({"full_name": "*", "reason": type(exc).__name__})
        status = "failed"
    else:
        if rate_limited:
            status = "rate_limited"
        elif failed and failed == total:
            status = "failed"
        elif failed:
            status = "partial"
        else:
            status = "completed"

    error_summary = None
    if rate_limited:
        error_summary = "GitHub API rate limit reached; remaining MCP repositories deferred."
    elif failures:
        error_summary = f"{len(failures)} MCP extraction error(s)."

    with session_factory() as db:
        run = db.get(McpSyncRun, run_id)
        if run:
            run.status = status
            run.finished_at = datetime.now(timezone.utc)
            run.total_repos = total
            run.detected_count = detected
            run.failed_count = failed
            run.rate_limited = rate_limited
            run.error_summary = error_summary
            run.details = {"failures": failures[:25]} if failures else None
            db.commit()

    return {
        "run_id": run_id,
        "trigger": trigger,
        "status": status,
        "total_repos": total,
        "detected_count": detected,
        "failed_count": failed,
        "rate_limited": rate_limited,
        "error_summary": error_summary,
    }


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--limit", type=int, default=None, help="Maximum repositories to process")
    p.add_argument("--min-age-hours", type=float, default=0.0, help="Skip profiles extracted more recently")
    args = p.parse_args()
    print(run_mcp_sync(trigger="cli", limit=args.limit, min_age_hours=args.min_age_hours))


if __name__ == "__main__":
    main()
