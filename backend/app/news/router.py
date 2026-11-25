"""Independent AI & Repo News API routes (read-only public endpoints + admin-protected sync)."""
from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
import hmac
import os

from fastapi import APIRouter, BackgroundTasks, Depends, Header, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.db import get_db
from app.news.models import NewsDay, NewsItem, NewsSyncRun
from app.news.scheduler import news_scheduler_config
from app.news.sections import IMPORTANT_TAG, SECTIONS, normalize_vi
from app.news.sync import run_news_sync

router = APIRouter(prefix="/news", tags=["news"])
UTC_PLUS_7 = timezone(timedelta(hours=7))


def _serialize_item(it: NewsItem) -> dict:
    return {
        "id": it.external_id,
        "db_id": it.id,
        "date": it.day_date.isoformat(),
        "section": it.section,
        "batch": it.batch,
        "tip": bool(it.is_tip),
        "picked": bool(it.is_picked),
        "title": it.title,
        "summary": it.summary,
        "excerpt": it.excerpt,
        "full_text": it.full_text,
        "speech_text": it.speech_text or f"{it.title}. {it.summary}",
        "source": it.source,
        "source_label": it.source_label or it.source,
        "author": it.author,
        "url": it.url,
        "time": it.time_label,
        "time_estimated": bool(it.time_estimated),
        "tags": it.tags or [],
        "images": it.images or [],
        "video": it.video,
        "sources": it.sources or [],
        "confidence": it.confidence,
        "repository_id": it.repository_id,
    }


def _build_weekly(days_payload: list[dict]) -> list[dict]:
    """Compute weekly digests dynamically from stored days and items."""
    buckets: dict[date, list[dict]] = {}
    for d in days_payload:
        day_dt = date.fromisoformat(d["date"])
        week_start = day_dt - timedelta(days=day_dt.weekday())
        buckets.setdefault(week_start, []).extend(
            [it for it in d["items"] if not it["tip"]]
        )

    weekly: list[dict] = []
    for ws in sorted(buckets.keys(), reverse=True)[:4]:
        we = ws + timedelta(days=6)
        items = buckets[ws]

        def score(it: dict) -> tuple[int, int, str]:
            imp = 1 if IMPORTANT_TAG in (it.get("tags") or []) else 0
            picked = 1 if it.get("picked") else 0
            repo = 1 if it.get("section") == "Repo" else 0
            return (imp * 3 + picked * 2 + repo, len(it.get("sources") or []), it.get("date") or "")

        ranked = sorted(items, key=score, reverse=True)[:10]
        top_items = []
        for it in ranked:
            why = []
            if IMPORTANT_TAG in (it.get("tags") or []):
                why.append("tin quan trọng")
            if it.get("picked"):
                why.append("tiêu điểm nổi bật")
            if it.get("section") == "Repo":
                why.append("repo AI tiêu biểu")
            if not why:
                why.append(it.get("section") or "AI")
            top_items.append({"id": it["id"], "why": why})

        weekly.append(
            {
                "week_start": ws.isoformat(),
                "week_end": we.isoformat(),
                "title": f"Bản tin tuần {ws.strftime('%d/%m')}–{we.strftime('%d/%m')}",
                "intro": f"Tổng hợp {len(items)} tin AI, bảo mật và Repo nổi bật trong tuần {ws.strftime('%d/%m')}–{we.strftime('%d/%m/%Y')}.",
                "items": top_items,
            }
        )
    return weekly


def _build_days_payload(db: Session, days_limit: int = 35) -> list[dict]:
    day_rows = db.scalars(
        select(NewsDay).order_by(NewsDay.date.desc()).limit(days_limit)
    ).all()
    if not day_rows:
        return []
    day_dates = [d.date for d in day_rows]
    item_rows = db.scalars(
        select(NewsItem)
        .where(NewsItem.day_date.in_(day_dates))
        .order_by(NewsItem.is_picked.desc(), NewsItem.published_at.desc().nulls_last(), NewsItem.id.asc())
    ).all()
    by_date: dict[date, list[dict]] = {d: [] for d in day_dates}
    for row in item_rows:
        by_date.setdefault(row.day_date, []).append(_serialize_item(row))

    payload: list[dict] = []
    for d in day_rows:
        items = by_date.get(d.date, [])
        non_tips = [x for x in items if not x["tip"]]
        noon_count = sum(1 for x in non_tips if x["batch"] == "noon")
        tips_count = sum(1 for x in items if x["tip"])
        imp_count = sum(1 for x in non_tips if IMPORTANT_TAG in (x.get("tags") or []))
        heads = d.heads or [x["title"] for x in non_tips[:2]]
        payload.append(
            {
                "date": d.date.isoformat(),
                "intro": d.intro,
                "count": len(non_tips),
                "noon_count": noon_count,
                "tips": tips_count,
                "important": imp_count,
                "heads": heads,
                "items": items,
            }
        )
    return payload


@router.get("/feed")
def get_feed(days_limit: int = Query(35, ge=1, le=90), db: Session = Depends(get_db)):
    days = _build_days_payload(db, days_limit=days_limit)
    weekly = _build_weekly(days)
    total_items = sum(d["count"] for d in days)
    repo_items = sum(
        1 for d in days for it in d["items"] if it["section"] == "Repo" and not it["tip"]
    )
    return {
        "generated": datetime.now(UTC_PLUS_7).isoformat(),
        "sections": SECTIONS,
        "days": days,
        "weekly": weekly,
        "stats": {
            "total_days": len(days),
            "total_items": total_items,
            "repo_items": repo_items,
        },
    }


@router.get("/days")
def list_days(limit: int = Query(35, ge=1, le=90), db: Session = Depends(get_db)):
    days = _build_days_payload(db, days_limit=limit)
    return {
        "sections": SECTIONS,
        "days": [{k: v for k, v in d.items() if k != "items"} for d in days],
    }


@router.get("/day/{day_str}")
def get_day(day_str: str, db: Session = Depends(get_db)):
    try:
        target = date.fromisoformat(day_str)
    except ValueError:
        raise HTTPException(422, "Invalid date format; expected YYYY-MM-DD")
    day = db.scalar(select(NewsDay).where(NewsDay.date == target))
    if not day:
        raise HTTPException(404, "News day not found")
    items = db.scalars(
        select(NewsItem)
        .where(NewsItem.day_date == target)
        .order_by(NewsItem.is_picked.desc(), NewsItem.published_at.desc().nulls_last(), NewsItem.id.asc())
    ).all()
    serialized = [_serialize_item(x) for x in items]
    non_tips = [x for x in serialized if not x["tip"]]
    return {
        "date": day.date.isoformat(),
        "intro": day.intro,
        "heads": day.heads or [x["title"] for x in non_tips[:2]],
        "count": len(non_tips),
        "items": serialized,
    }


@router.get("/items")
def search_items(
    q: str = Query("", max_length=200),
    section: str = Query("", max_length=100),
    batch: str = Query("", max_length=20),
    from_date: date | None = Query(None, alias="from"),
    to_date: date | None = Query(None, alias="to"),
    limit: int = Query(30, ge=1, le=100),
    offset: int = Query(0, ge=0, le=5000),
    db: Session = Depends(get_db),
):
    stmt = select(NewsItem)
    if q.strip():
        term = normalize_vi(q.strip())
        stmt = stmt.where(
            or_(
                *(
                    func.unaccent(func.coalesce(col, "")).icontains(term, autoescape=True)
                    for col in (
                        NewsItem.title,
                        NewsItem.summary,
                        NewsItem.excerpt,
                        NewsItem.source,
                        NewsItem.author,
                        NewsItem.section,
                    )
                )
            )
        )
    if section:
        stmt = stmt.where(NewsItem.section == section)
    if batch in ("morning", "noon"):
        stmt = stmt.where(NewsItem.batch == batch)
    if from_date:
        stmt = stmt.where(NewsItem.day_date >= from_date)
    if to_date:
        stmt = stmt.where(NewsItem.day_date <= to_date)

    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    rows = db.scalars(
        stmt.order_by(NewsItem.day_date.desc(), NewsItem.is_picked.desc(), NewsItem.id.asc())
        .offset(offset)
        .limit(limit)
    ).all()
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "items": [_serialize_item(r) for r in rows],
    }


@router.get("/weekly")
def get_weekly(db: Session = Depends(get_db)):
    days = _build_days_payload(db, days_limit=35)
    return {"weekly": _build_weekly(days)}


@router.get("/sync/status")
def news_sync_status(db: Session = Depends(get_db)):
    runs = db.scalars(select(NewsSyncRun).order_by(NewsSyncRun.id.desc()).limit(10)).all()
    return {
        "scheduler": news_scheduler_config(),
        "recent_runs": [
            {
                "id": r.id,
                "trigger": r.trigger,
                "status": r.status,
                "started_at": r.started_at,
                "finished_at": r.finished_at,
                "fetched_count": r.fetched_count,
                "inserted_count": r.inserted_count,
                "repo_items_count": r.repo_items_count,
                "error_summary": r.error_summary,
            }
            for r in runs
        ],
    }


@router.post("/sync/trigger", status_code=202)
def news_sync_trigger(
    background_tasks: BackgroundTasks,
    include_rss: bool = Query(True),
    repo_limit: int = Query(8, ge=1, le=30),
    x_admin_key: str | None = Header(default=None, alias="X-Admin-Key"),
    authorization: str | None = Header(default=None, alias="Authorization"),
    db: Session = Depends(get_db),
):
    configured_key = os.getenv("ADMIN_API_KEY", "").strip()
    if not configured_key:
        raise HTTPException(503, "Admin sync endpoint is disabled until ADMIN_API_KEY is configured.")

    provided = (x_admin_key or "").strip()
    if not provided and authorization and authorization.lower().startswith("bearer "):
        provided = authorization[7:].strip()
    if not provided or not hmac.compare_digest(provided, configured_key):
        raise HTTPException(401, "Invalid or missing admin credentials.")

    running = db.scalar(select(NewsSyncRun.id).where(NewsSyncRun.status == "running").limit(1))
    if running is not None:
        raise HTTPException(409, "A news sync run is already in progress.")

    background_tasks.add_task(
        run_news_sync,
        trigger="manual",
        include_rss=include_rss,
        repo_limit=repo_limit,
    )
    return {"accepted": True, "message": "News sync queued."}
