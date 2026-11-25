"""Independent news & catalog Repo feed synchronization service and CLI."""
from __future__ import annotations

import argparse
from datetime import datetime, timedelta, timezone
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert

from app.db import Session
from app.news.feeds import fetch_public_feeds
from app.news.models import NewsDay, NewsItem, NewsSyncRun
from app.news.seed import build_repo_highlights
from app.repositories.models import Repository

UTC_PLUS_7 = timezone(timedelta(hours=7))


def _refresh_day_heads(db, target_date) -> None:
    items = db.scalars(
        select(NewsItem)
        .where(NewsItem.day_date == target_date, NewsItem.is_tip.is_(False))
        .order_by(NewsItem.is_picked.desc(), NewsItem.published_at.desc().nulls_last(), NewsItem.id.asc())
    ).all()
    heads = [it.title for it in items[:2]]
    day = db.scalar(select(NewsDay).where(NewsDay.date == target_date))
    now = datetime.now(UTC_PLUS_7)
    if day:
        if heads:
            day.heads = heads
        day.updated_at = now
    else:
        db.add(
            NewsDay(
                date=target_date,
                intro=f"Bản tin AI và Repo ngày {target_date.strftime('%d/%m/%Y')} tổng hợp từ các nguồn công khai và thư viện AI Repository Hub.",
                heads=heads,
                created_at=now,
                updated_at=now,
            )
        )


def run_news_sync(
    trigger: str = "cli",
    include_rss: bool = True,
    repo_limit: int = 8,
    client_factory=None,
    feeds=None,
    session_factory=Session,
) -> dict:
    """Sync independent public RSS feeds and catalog Repo highlights into PostgreSQL."""
    started_at = datetime.now(timezone.utc)
    now_local = datetime.now(UTC_PLUS_7)

    with session_factory() as db:
        run = NewsSyncRun(
            trigger=trigger,
            status="running",
            started_at=started_at,
            fetched_count=0,
            inserted_count=0,
            repo_items_count=0,
        )
        db.add(run)
        db.commit()
        db.refresh(run)
        run_id = run.id

    fetched_items = []
    feed_errors: list[dict[str, str]] = []
    if include_rss:
        fetched_items, feed_errors = fetch_public_feeds(client_factory=client_factory, feeds=feeds)

    inserted_count = 0
    repo_items_count = 0
    touched_dates = {now_local.date()}
    status = "completed"
    error_summary = None

    try:
        with session_factory() as db:
            # Ensure today exists before inserting Repo highlights
            _refresh_day_heads(db, now_local.date())
            db.flush()

            repo_items_count = build_repo_highlights(db, now_local.date(), now_local, limit=repo_limit)

            # Build quick lookup map for GitHub URLs -> repository_id
            repo_rows = db.execute(select(Repository.id, Repository.full_name)).all()
            repo_map = {f"https://github.com/{full_name.lower()}": rid for rid, full_name in repo_rows}

            for item in fetched_items:
                d_date = item.day_date.astimezone(UTC_PLUS_7).date()
                touched_dates.add(d_date)
                db.execute(
                    insert(NewsDay)
                    .values(
                        date=d_date,
                        intro=f"Bản tin AI và Repo ngày {d_date.strftime('%d/%m/%Y')} tổng hợp từ các nguồn công khai và thư viện AI Repository Hub.",
                        heads=[],
                        created_at=now_local,
                        updated_at=now_local,
                    )
                    .on_conflict_do_nothing(index_elements=["date"])
                )
                repo_id = None
                lower_url = item.url.lower().rstrip("/")
                for prefix, rid in repo_map.items():
                    if lower_url == prefix or lower_url.startswith(prefix + "/"):
                        repo_id = rid
                        break

                res = db.execute(
                    insert(NewsItem)
                    .values(
                        external_id=item.external_id,
                        day_date=d_date,
                        section=item.section,
                        batch=item.batch,
                        is_tip=False,
                        is_picked=item.is_picked,
                        title=item.title,
                        summary=item.summary,
                        excerpt=item.excerpt,
                        full_text=item.full_text,
                        speech_text=item.speech_text,
                        source=item.source,
                        source_label=item.source_label,
                        author=item.author,
                        url=item.url,
                        published_at=item.published_at,
                        time_label=item.time_label,
                        time_estimated=item.time_estimated,
                        tags=item.tags,
                        images=item.images,
                        video=None,
                        sources=item.sources,
                        confidence=item.confidence,
                        repository_id=repo_id,
                        created_at=now_local,
                    )
                    .on_conflict_do_nothing(index_elements=["external_id"])
                )
                if res.rowcount:
                    inserted_count += 1

            for d_date in touched_dates:
                _refresh_day_heads(db, d_date)

            db.commit()
    except Exception as exc:
        status = "failed"
        error_summary = type(exc).__name__

    if status == "completed" and feed_errors:
        status = "partial"
        error_summary = f"{len(feed_errors)} nguồn RSS không phản hồi."

    finished_at = datetime.now(timezone.utc)
    with session_factory() as db:
        run = db.get(NewsSyncRun, run_id)
        if run:
            run.status = status
            run.finished_at = finished_at
            run.fetched_count = len(fetched_items)
            run.inserted_count = inserted_count
            run.repo_items_count = repo_items_count
            run.error_summary = error_summary
            run.details = {"feed_errors": feed_errors[:20]} if feed_errors else None
            db.commit()

    return {
        "run_id": run_id,
        "status": status,
        "fetched_count": len(fetched_items),
        "inserted_count": inserted_count,
        "repo_items_count": repo_items_count,
        "feed_errors": len(feed_errors),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Synchronize independent AI news and Repo highlights.")
    parser.add_argument("--no-rss", action="store_true", help="Only refresh Repo highlights from PostgreSQL.")
    parser.add_argument("--repo-limit", type=int, default=8)
    args = parser.parse_args()
    summary = run_news_sync(trigger="cli", include_rss=not args.no_rss, repo_limit=args.repo_limit)
    print(summary)


if __name__ == "__main__":
    main()
