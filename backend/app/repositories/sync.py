"""Manual upstream metadata refresh. Stops on rate limiting; never runs upstream code."""
import os
from datetime import datetime, timezone
import httpx
from sqlalchemy import select
from app.db import Session
from app.repositories.models import Repository

def main():
    headers={"Accept":"application/vnd.github+json","User-Agent":"AI-Repository-Hub"}
    if token := os.getenv("GITHUB_TOKEN"):
        headers["Authorization"]="Bearer "+token
    with Session() as db, httpx.Client(headers=headers, timeout=20) as client:
        for repo in db.scalars(select(Repository)).all():
            try:
                res=client.get("https://api.github.com/repos/"+repo.full_name)
                if res.status_code in (403,429):
                    print("Stopped: GitHub denied request or rate limited.")
                    return
                res.raise_for_status()
                data=res.json()
                if data.get("private"):
                    print("Skipped private repository")
                    continue
                repo.github_id=data["id"]
                repo.stars=data["stargazers_count"]
                repo.forks=data["forks_count"]
                repo.watchers=data.get("subscribers_count")
                repo.description_upstream=data.get("description")
                repo.updated_at=datetime.fromisoformat(data["updated_at"].replace("Z","+00:00"))
                repo.synced_at=datetime.now(timezone.utc)
                repo.license=(data.get("license") or {}).get("spdx_id")
                db.commit()
                print("Synced",repo.full_name)
            except (httpx.HTTPError, ValueError, KeyError) as exc:
                db.rollback()
                print("Skipped",repo.full_name,type(exc).__name__)

if __name__=="__main__":
    main()
