"""Import a manually reviewed JSON manifest, validating public repos and READMEs via GitHub API."""
import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import re
import time

import httpx
from sqlalchemy import func, select

from app.db import Session
from app.repositories.github_client import (
    RateLimitError,
    apply_github_metadata,
    build_github_headers,
    fetch_repo_and_readme,
)
from app.repositories.models import Repository

NAME = re.compile(r"^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$")


def validate_manifest(rows: object) -> list[dict]:
    if not isinstance(rows, list):
        raise ValueError("Expected a reviewed JSON array, not the raw discovery report.")
    for r in rows:
        if (
            not isinstance(r, dict)
            or not NAME.fullmatch(r.get("full_name", ""))
            or any(x in (".", "..") for x in r["full_name"].split("/"))
            or not isinstance(r.get("category"), str)
            or not r["category"].strip()
            or len(r["category"]) > 100
            or not isinstance(r.get("description_vi"), str)
            or not r["description_vi"].strip()
            or not isinstance(r.get("source_urls"), list)
            or not r["source_urls"]
            or any(not isinstance(x, str) or not x.startswith("https://") for x in r["source_urls"])
        ):
            raise ValueError("Invalid manifest entry: " + str(r)[:150])
    return rows


def import_manifest(rows: list[dict], delay: float = 0.25, include_readme: bool = True) -> dict:
    headers = build_github_headers()
    count = 0
    failed: list[str] = []
    now = datetime.now(timezone.utc)
    with Session() as db, httpx.Client(headers=headers, timeout=20) as client:
        for i, row in enumerate(rows):
            try:
                result = fetch_repo_and_readme(client, row["full_name"], include_readme=include_readme)
                d = result.metadata
                if d.get("private"):
                    failed.append(row["full_name"])
                    continue
                name = d["full_name"]
                repo = db.scalar(select(Repository).where(Repository.github_id == d["id"]))
                if repo is None:
                    repo = db.scalar(select(Repository).where(func.lower(Repository.full_name) == name.lower()))
                if repo is None:
                    repo = Repository(full_name=name, discovered_at=now)
                    db.add(repo)
                elif repo.discovered_at is None:
                    repo.discovered_at = now

                repo.category = row["category"].strip()
                repo.description_vi = row["description_vi"].strip()
                if isinstance(row.get("guide_vi"), str) and row["guide_vi"].strip():
                    repo.guide_vi = row["guide_vi"].strip()
                    refresh_guide = False
                else:
                    refresh_guide = True
                merged_sources = list(dict.fromkeys([f"https://github.com/{name}", *row["source_urls"]]))
                repo.source_urls = merged_sources
                apply_github_metadata(repo, d, result.readme_text, refresh_guide=refresh_guide)
                db.commit()
                count += 1
            except RateLimitError:
                db.rollback()
                failed.extend(x["full_name"] for x in rows[i:])
                break
            except (httpx.HTTPError, ValueError, KeyError) as exc:
                db.rollback()
                failed.append(row["full_name"])
                print("Skipped", row["full_name"], type(exc).__name__)
            finally:
                if delay > 0:
                    time.sleep(delay)
    return {"imported_or_updated": count, "failed_or_unattempted": failed}


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("manifest", help="JSON array: full_name, category, description_vi, source_urls")
    p.add_argument("--delay", type=float, default=0.25, help="Delay between GitHub API requests")
    p.add_argument("--skip-readme", action="store_true", help="Skip fetching README markdown")
    args = p.parse_args()
    try:
        raw = json.loads(Path(args.manifest).read_text(encoding="utf-8"))
        rows = validate_manifest(raw)
    except (OSError, ValueError) as exc:
        p.error(str(exc))
    summary = import_manifest(rows, delay=args.delay, include_readme=not args.skip_readme)
    print(json.dumps(summary, ensure_ascii=False))
    if summary["failed_or_unattempted"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
