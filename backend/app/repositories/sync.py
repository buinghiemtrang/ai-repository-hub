"""Upstream metadata synchronization service and CLI with run logging and rate-limit safety."""
import argparse
from datetime import datetime, timedelta, timezone
import os

import httpx
from sqlalchemy import select

from app.db import Session
from app.repositories.github_client import (
    RateLimitError,
    apply_github_metadata,
    build_github_headers,
    fetch_repo_and_readme,
)
from app.repositories.models import Repository, SyncRun
from app.repositories.sync_images import enrich_images


def run_sync(
    trigger: str = "cli",
    limit: int | None = None,
    min_age_hours: float = 0.0,
    include_readme: bool = True,
    client_factory=None,
    session_factory=Session,
) -> dict:
    """Synchronize public GitHub metadata for catalog repositories and record a SyncRun log."""
    started_at = datetime.now(timezone.utc)
    with session_factory() as db:
        run = SyncRun(
            trigger=trigger,
            status="running",
            started_at=started_at,
            total_repos=0,
            synced_count=0,
            failed_count=0,
            rate_limited=False,
        )
        db.add(run)
        db.commit()
        db.refresh(run)
        run_id = run.id

    stmt = select(Repository).order_by(Repository.synced_at.asc().nulls_first(), Repository.id.asc())
    if min_age_hours > 0:
        cutoff = started_at - timedelta(hours=min_age_hours)
        stmt = stmt.where((Repository.synced_at.is_(None)) | (Repository.synced_at < cutoff))
    if limit is not None and limit > 0:
        stmt = stmt.limit(limit)

    headers = build_github_headers()
    factory = client_factory or (lambda: httpx.Client(headers=headers, timeout=20))

    synced_count = 0
    failed_count = 0
    rate_limited = False
    failures: list[dict] = []
    total_repos = 0

    try:
        with session_factory() as db, factory() as client:
            repos = db.scalars(stmt).all()
            total_repos = len(repos)
            for repo in repos:
                try:
                    result = fetch_repo_and_readme(client, repo.full_name, include_readme=include_readme)
                    if result.metadata.get("private"):
                        failed_count += 1
                        failures.append({"full_name": repo.full_name, "reason": "private_repository"})
                        continue
                    apply_github_metadata(repo, result.metadata, result.readme_text, refresh_guide=include_readme)
                    db.commit()
                    synced_count += 1
                except RateLimitError as exc:
                    db.rollback()
                    rate_limited = True
                    failures.append({"full_name": repo.full_name, "reason": str(exc)[:200]})
                    break
                except (httpx.HTTPError, ValueError, KeyError) as exc:
                    db.rollback()
                    failed_count += 1
                    failures.append({"full_name": repo.full_name, "reason": type(exc).__name__})
    except Exception as exc:
        failures.append({"full_name": "*", "reason": type(exc).__name__})
        status = "failed"
    else:
        if rate_limited:
            status = "rate_limited"
        elif failed_count > 0 and synced_count == 0 and total_repos > 0:
            status = "failed"
        elif failed_count > 0:
            status = "partial"
        else:
            status = "completed"

    finished_at = datetime.now(timezone.utc)
    error_summary = None
    if rate_limited:
        error_summary = "GitHub API rate limit reached; remaining repositories deferred."
    elif failures:
        error_summary = f"{len(failures)} repository sync error(s)."

    with session_factory() as db:
        run = db.get(SyncRun, run_id)
        if run:
            run.status = status
            run.finished_at = finished_at
            run.total_repos = total_repos
            run.synced_count = synced_count
            run.failed_count = failed_count
            run.rate_limited = rate_limited
            run.error_summary = error_summary
            run.details = {"failures": failures[:25]} if failures else None
            db.commit()

    if not rate_limited and os.getenv("GITHUB_TOKEN", "").strip():
        try:
            enrich_images(only_missing=True)
        except Exception:
            pass

    return {
        "run_id": run_id,
        "trigger": trigger,
        "status": status,
        "total_repos": total_repos,
        "synced_count": synced_count,
        "failed_count": failed_count,
        "rate_limited": rate_limited,
        "error_summary": error_summary,
    }


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--limit", type=int, default=None, help="Maximum repositories to sync")
    p.add_argument("--min-age-hours", type=float, default=0.0, help="Skip repos synced more recently than N hours")
    p.add_argument("--skip-readme", action="store_true", help="Skip fetching README markdown")
    args = p.parse_args()
    summary = run_sync(
        trigger="cli",
        limit=args.limit,
        min_age_hours=args.min_age_hours,
        include_readme=not args.skip_readme,
    )
    print(summary)


if __name__ == "__main__":
    main()
