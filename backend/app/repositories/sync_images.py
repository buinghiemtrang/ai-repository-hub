"""Batch-fetch GitHub openGraphImageUrl and owner avatarUrl via GitHub GraphQL API."""
import os
import re

import httpx
from sqlalchemy import select

from app.db import Session
from app.repositories.github_client import build_github_headers
from app.repositories.models import Repository

SAFE_NAME_PART = re.compile(r"^[A-Za-z0-9_.-]+$")


def _safe_https_url(value: str | None) -> str | None:
    if isinstance(value, str) and value.startswith("https://"):
        return value[:500]
    return None


def enrich_images(batch_size: int = 40, only_missing: bool = False) -> dict:
    """Populate image_url, owner_avatar_url, and has_custom_image using GitHub GraphQL."""
    token = os.getenv("GITHUB_TOKEN", "").strip()
    if not token:
        return {"skipped": True, "reason": "missing_github_token", "updated": 0}

    headers = build_github_headers()
    updated = 0
    errors = 0

    with Session() as db, httpx.Client(headers=headers, timeout=30) as client:
        stmt = select(Repository).order_by(Repository.id.asc())
        if only_missing:
            stmt = stmt.where((Repository.owner_avatar_url.is_(None)) | (Repository.image_url.is_(None)))
        repos = db.scalars(stmt).all()

        for i in range(0, len(repos), batch_size):
            chunk = repos[i : i + batch_size]
            parts = []
            alias_map: dict[str, Repository] = {}
            for idx, repo in enumerate(chunk):
                if "/" not in repo.full_name:
                    continue
                owner, name = repo.full_name.split("/", 1)
                if not (SAFE_NAME_PART.fullmatch(owner) and SAFE_NAME_PART.fullmatch(name)):
                    continue
                alias = f"r{idx}"
                alias_map[alias] = repo
                o_esc = owner.replace('"', "")
                n_esc = name.replace('"', "")
                parts.append(
                    f'{alias}: repository(owner: "{o_esc}", name: "{n_esc}") '
                    "{ openGraphImageUrl usesCustomOpenGraphImage owner { avatarUrl } }"
                )
            if not parts:
                continue

            query = "query { " + " ".join(parts) + " }"
            try:
                res = client.post("https://api.github.com/graphql", json={"query": query})
                if res.status_code in (401, 403, 429):
                    errors += len(alias_map)
                    break
                res.raise_for_status()
                payload = res.json().get("data") or {}
                for alias, repo in alias_map.items():
                    node = payload.get(alias)
                    if not isinstance(node, dict):
                        continue
                    og_url = _safe_https_url(node.get("openGraphImageUrl"))
                    avatar_url = _safe_https_url((node.get("owner") or {}).get("avatarUrl"))
                    if og_url:
                        repo.image_url = og_url
                    if avatar_url:
                        repo.owner_avatar_url = avatar_url
                    repo.has_custom_image = bool(node.get("usesCustomOpenGraphImage", False))
                    updated += 1
                db.commit()
            except (httpx.HTTPError, ValueError):
                db.rollback()
                errors += len(alias_map)

    return {"skipped": False, "updated": updated, "errors": errors}


if __name__ == "__main__":
    print(enrich_images())
