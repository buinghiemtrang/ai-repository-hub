"""Repository catalog API routes."""
import hmac
import os
import unicodedata

from fastapi import APIRouter, BackgroundTasks, Depends, Header, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.db import get_db
from app.repositories.models import Repository, SyncRun
from app.repositories.scheduler import scheduler_config
from app.repositories.sync import run_sync

router = APIRouter(prefix="/repositories", tags=["repositories"])


def normalize(value: str) -> str:
    return (
        "".join(c for c in unicodedata.normalize("NFD", value.lower()) if not unicodedata.combining(c))
        .replace("đ", "d")
    )


def serialize(r: Repository, include_guide: bool = False) -> dict:
    payload = {
        "id": r.id,
        "full_name": r.full_name,
        "github_id": r.github_id,
        "category": r.category,
        "description_vi": r.description_vi,
        "description_upstream": r.description_upstream,
        "homepage": r.homepage,
        "topics": r.topics or [],
        "language": r.language,
        "default_branch": r.default_branch,
        "archived": bool(r.archived),
        "image_url": r.image_url or f"https://opengraph.githubassets.com/1/{r.full_name}",
        "owner_avatar_url": r.owner_avatar_url,
        "has_custom_image": bool(r.has_custom_image),
        "stars": r.stars,
        "forks": r.forks,
        "watchers": r.watchers,
        "updated_at": r.updated_at,
        "synced_at": r.synced_at,
        "discovered_at": r.discovered_at,
        "license": r.license,
        "source_urls": r.source_urls,
        "url": f"https://github.com/{r.full_name}",
        "readme_url": f"https://github.com/{r.full_name}#readme",
    }
    if include_guide:
        payload["guide_vi"] = r.guide_vi
    return payload


def _serialize_sync_run(run: SyncRun) -> dict:
    return {
        "id": run.id,
        "trigger": run.trigger,
        "status": run.status,
        "started_at": run.started_at,
        "finished_at": run.finished_at,
        "total_repos": run.total_repos,
        "synced_count": run.synced_count,
        "failed_count": run.failed_count,
        "rate_limited": run.rate_limited,
        "error_summary": run.error_summary,
    }


@router.get("")
def listing(
    q: str = Query("", max_length=200),
    category: str = Query("", max_length=100),
    language: str = Query("", max_length=100),
    sort: str = "stars",
    page: int = Query(1, ge=1, le=100000),
    favorite_ids: str | None = Query(None, max_length=6000),
    db: Session = Depends(get_db),
):
    stmt = select(Repository)
    if q.strip():
        term = normalize(q.strip())
        stmt = stmt.where(
            or_(
                *(
                    func.unaccent(func.coalesce(col, "")).icontains(term, autoescape=True)
                    for col in (
                        Repository.full_name,
                        Repository.description_vi,
                        Repository.description_upstream,
                        Repository.category,
                        Repository.language,
                    )
                )
            )
        )
    if category:
        stmt = stmt.where(Repository.category == category)
    if language:
        stmt = stmt.where(Repository.language == language)
    if favorite_ids is not None:
        try:
            ids = [int(x) for x in favorite_ids.split(",") if x]
            if len(ids) > 500 or any(x < 1 or x > 2147483647 for x in ids):
                raise ValueError()
        except ValueError:
            raise HTTPException(422, "Invalid favorite IDs")
        stmt = stmt.where(Repository.id.in_(ids))

    total = db.scalar(select(func.count()).select_from(stmt.subquery()))
    order = {
        "stars": Repository.stars.desc().nulls_last(),
        "stars_asc": Repository.stars.asc().nulls_last(),
        "forks": Repository.forks.desc().nulls_last(),
        "updated": Repository.updated_at.desc().nulls_last(),
        "newest": Repository.updated_at.desc().nulls_last(),
        "oldest": Repository.updated_at.asc().nulls_last(),
        "name": Repository.full_name.asc(),
    }
    rows = db.scalars(
        stmt.order_by(order.get(sort, order["stars"]), Repository.full_name)
        .offset((page - 1) * 12)
        .limit(12)
    )
    return {"items": [serialize(r) for r in rows], "total": total, "page": page, "page_size": 12}


@router.get("/categories")
def categories(db: Session = Depends(get_db)):
    return list(db.scalars(select(Repository.category).distinct().order_by(Repository.category)))


@router.get("/stats")
def stats(db: Session = Depends(get_db)):
    total = db.scalar(select(func.count()).select_from(Repository)) or 0
    cat_rows = db.execute(
        select(Repository.category, func.count(Repository.id))
        .group_by(Repository.category)
        .order_by(Repository.category)
    ).all()
    lang_rows = db.execute(
        select(Repository.language, func.count(Repository.id))
        .where(Repository.language.is_not(None))
        .group_by(Repository.language)
        .order_by(func.count(Repository.id).desc(), Repository.language)
        .limit(30)
    ).all()
    last_synced_at = db.scalar(select(func.max(Repository.synced_at)))
    return {
        "total": total,
        "categories": [{"name": name, "count": count} for name, count in cat_rows],
        "languages": [{"name": name, "count": count} for name, count in lang_rows],
        "last_synced_at": last_synced_at,
    }


@router.get("/sync/status")
def sync_status(db: Session = Depends(get_db)):
    runs = db.scalars(select(SyncRun).order_by(SyncRun.id.desc()).limit(10)).all()
    return {
        "scheduler": scheduler_config(),
        "recent_runs": [_serialize_sync_run(r) for r in runs],
    }


@router.post("/sync/trigger", status_code=202)
def sync_trigger(
    background_tasks: BackgroundTasks,
    limit: int | None = Query(None, ge=1, le=1000),
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

    running = db.scalar(select(SyncRun.id).where(SyncRun.status == "running").limit(1))
    if running is not None:
        raise HTTPException(409, "A metadata sync run is already in progress.")

    background_tasks.add_task(run_sync, trigger="manual", limit=limit, min_age_hours=0.0, include_readme=True)
    return {"accepted": True, "message": "Metadata sync queued."}


@router.get("/{repo_id}")
def detail(repo_id: int, db: Session = Depends(get_db)):
    r = db.get(Repository, repo_id)
    if not r:
        raise HTTPException(404, "Repository not found")
    return serialize(r, include_guide=True)
