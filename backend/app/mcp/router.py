"""MCP module API routes: server catalog, detail with client config snippets, stats and sync."""
from fastapi import APIRouter, BackgroundTasks, Depends, Header, HTTPException, Query
from sqlalchemy import cast, func, or_, select
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Session

from app.admin_auth import require_admin_key
from app.db import get_db
from app.mcp.client_configs import build_client_configs
from app.mcp.models import McpServer, McpSyncRun
from app.mcp.scheduler import mcp_scheduler_config
from app.mcp.sync import mcp_categories, run_mcp_sync
from app.repositories.models import Repository
from app.repositories.router import normalize

router = APIRouter(prefix="/mcp", tags=["mcp"])
PAGE_SIZE = 12


def _serialize(repo: Repository, server: McpServer | None, include_detail: bool = False) -> dict:
    payload = {
        "repository_id": repo.id,
        "full_name": repo.full_name,
        "description_vi": repo.description_vi,
        "description_upstream": repo.description_upstream,
        "language": repo.language,
        "license": repo.license,
        "stars": repo.stars,
        "archived": bool(repo.archived),
        "owner_avatar_url": repo.owner_avatar_url,
        "updated_at": repo.updated_at,
        "url": f"https://github.com/{repo.full_name}",
        "status": server.status if server else "pending",
        "server_name": server.server_name if server else None,
        "transports": (server.transports or []) if server else [],
        "requires_secret": bool(server.requires_secret) if server else False,
        "env_count": len(server.env_vars or []) if server else 0,
        "sources": (server.sources or []) if server else [],
        "extracted_at": server.extracted_at if server else None,
    }
    if include_detail:
        payload.update(
            {
                "homepage": repo.homepage,
                "topics": repo.topics or [],
                "default_branch": repo.default_branch,
                "install_methods": (server.install_methods or []) if server else [],
                "remotes": (server.remotes or []) if server else [],
                "env_vars": (server.env_vars or []) if server else [],
                "evidence_urls": [u for u in ((server.evidence_urls or []) if server else []) if u.startswith("https://")],
                "client_configs": build_client_configs(server.server_name, server.install_methods, server.remotes)
                if server and server.status == "detected"
                else [],
            }
        )
    return payload


def _base_query():
    return (
        select(Repository, McpServer)
        .outerjoin(McpServer, McpServer.repository_id == Repository.id)
        .where(Repository.category.in_(mcp_categories()))
    )


@router.get("/servers")
def list_servers(
    q: str = Query("", max_length=200),
    transport: str = Query("", pattern="^(|stdio|http|sse)$"),
    secret: str = Query("", pattern="^(|required|none)$"),
    status: str = Query("", pattern="^(|detected|no_config_found|pending)$"),
    language: str = Query("", max_length=100),
    sort: str = "stars",
    page: int = Query(1, ge=1, le=100000),
    db: Session = Depends(get_db),
):
    stmt = _base_query()
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
                        McpServer.server_name,
                    )
                )
            )
        )
    if transport:
        stmt = stmt.where(cast(McpServer.transports, JSONB).contains([transport]))
    if secret == "required":
        stmt = stmt.where(McpServer.requires_secret.is_(True))
    elif secret == "none":
        stmt = stmt.where(McpServer.status == "detected", McpServer.requires_secret.is_(False))
    if status == "pending":
        stmt = stmt.where(McpServer.id.is_(None))
    elif status:
        stmt = stmt.where(McpServer.status == status)
    if language:
        stmt = stmt.where(Repository.language == language)

    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    order = {
        "stars": Repository.stars.desc().nulls_last(),
        "updated": Repository.updated_at.desc().nulls_last(),
        "name": Repository.full_name.asc(),
    }
    rows = db.execute(
        stmt.order_by(order.get(sort, order["stars"]), Repository.full_name)
        .offset((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
    ).all()
    return {
        "items": [_serialize(repo, server) for repo, server in rows],
        "total": total,
        "page": page,
        "page_size": PAGE_SIZE,
    }


@router.get("/stats")
def stats(db: Session = Depends(get_db)):
    rows = db.execute(_base_query()).all()
    transports = {t: 0 for t in ("stdio", "http", "sse")}
    languages: dict[str, int] = {}
    detected = no_config = requires_secret = 0
    last_extracted = None
    for repo, server in rows:
        if repo.language:
            languages[repo.language] = languages.get(repo.language, 0) + 1
        if not server:
            continue
        if server.status == "detected":
            detected += 1
        else:
            no_config += 1
        if server.requires_secret:
            requires_secret += 1
        for t in server.transports or []:
            if t in transports:
                transports[t] += 1
        if server.extracted_at and (last_extracted is None or server.extracted_at > last_extracted):
            last_extracted = server.extracted_at
    return {
        "total": len(rows),
        "detected": detected,
        "no_config_found": no_config,
        "pending": len(rows) - detected - no_config,
        "requires_secret": requires_secret,
        "transports": [{"name": k, "count": v} for k, v in transports.items()],
        "languages": [
            {"name": k, "count": v} for k, v in sorted(languages.items(), key=lambda kv: (-kv[1], kv[0]))
        ],
        "categories": mcp_categories(),
        "last_extracted_at": last_extracted,
    }


@router.get("/sync/status")
def sync_status(db: Session = Depends(get_db)):
    runs = db.scalars(select(McpSyncRun).order_by(McpSyncRun.id.desc()).limit(10)).all()
    return {
        "scheduler": mcp_scheduler_config(),
        "recent_runs": [
            {
                "id": r.id,
                "trigger": r.trigger,
                "status": r.status,
                "started_at": r.started_at,
                "finished_at": r.finished_at,
                "total_repos": r.total_repos,
                "detected_count": r.detected_count,
                "failed_count": r.failed_count,
                "rate_limited": r.rate_limited,
                "error_summary": r.error_summary,
            }
            for r in runs
        ],
    }


@router.post("/sync/trigger", status_code=202)
def sync_trigger(
    background_tasks: BackgroundTasks,
    limit: int | None = Query(None, ge=1, le=1000),
    x_admin_key: str | None = Header(default=None, alias="X-Admin-Key"),
    authorization: str | None = Header(default=None, alias="Authorization"),
    db: Session = Depends(get_db),
):
    require_admin_key(x_admin_key, authorization)
    running = db.scalar(select(McpSyncRun.id).where(McpSyncRun.status == "running").limit(1))
    if running is not None:
        raise HTTPException(409, "An MCP sync run is already in progress.")
    background_tasks.add_task(run_mcp_sync, trigger="manual", limit=limit, min_age_hours=0.0)
    return {"accepted": True, "message": "MCP sync queued."}


@router.get("/servers/{repository_id}")
def server_detail(repository_id: int, db: Session = Depends(get_db)):
    row = db.execute(_base_query().where(Repository.id == repository_id)).first()
    if not row:
        raise HTTPException(404, "MCP server not found")
    repo, server = row
    return _serialize(repo, server, include_detail=True)
