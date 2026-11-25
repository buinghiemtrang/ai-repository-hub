"""Import a manually reviewed JSON manifest, validating public repos via GitHub API."""
import argparse
import json
import os
import re
import time
from datetime import datetime, timezone
from pathlib import Path

import httpx
from sqlalchemy import select, func
from app.db import Session
from app.repositories.models import Repository

NAME = re.compile(r"^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$")

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("manifest",help="JSON array: full_name, category, description_vi, source_urls")
    args=p.parse_args()
    rows=json.loads(Path(args.manifest).read_text(encoding="utf-8"))
    if not isinstance(rows,list):
        p.error("Expected a reviewed JSON array, not the raw discovery report.")
    for r in rows:
        if (not isinstance(r,dict) or not NAME.fullmatch(r.get("full_name",""))
            or any(x in (".","..") for x in r["full_name"].split("/"))
            or not isinstance(r.get("category"),str) or not r["category"].strip()
            or len(r["category"])>100 or not isinstance(r.get("description_vi"),str)
            or not r["description_vi"].strip()
            or not isinstance(r.get("source_urls"),list) or not r["source_urls"]
            or any(not isinstance(x,str) or not x.startswith("https://") for x in r["source_urls"])):
            p.error("Invalid manifest entry: "+str(r)[:150])
    headers={"Accept":"application/vnd.github+json","User-Agent":"AIRepositoryHub"}
    if token:=os.getenv("GITHUB_TOKEN"):
        headers["Authorization"]="Bearer "+token
    count=0
    failed=[]
    with Session() as db,httpx.Client(headers=headers,timeout=20) as client:
        for i,row in enumerate(rows):
            try:
                res=client.get("https://api.github.com/repos/"+row["full_name"])
                if res.status_code in (403,429):
                    failed.extend(x["full_name"] for x in rows[i:])
                    break
                res.raise_for_status()
                d=res.json()
                if d.get("private"):
                    failed.append(row["full_name"])
                    continue
                name=d["full_name"]
                repo=db.scalar(select(Repository).where(Repository.github_id==d["id"]))
                if repo is None:
                    repo=db.scalar(select(Repository).where(func.lower(Repository.full_name)==name.lower()))
                if repo is None:
                    repo=Repository(full_name=name)
                    db.add(repo)
                repo.full_name=name
                repo.github_id=d["id"]
                repo.category=row["category"]
                repo.description_vi=row["description_vi"]
                repo.description_upstream=d.get("description")
                repo.stars=d["stargazers_count"]
                repo.forks=d["forks_count"]
                repo.watchers=d.get("subscribers_count")
                repo.updated_at=datetime.fromisoformat(d["updated_at"].replace("Z","+00:00"))
                repo.synced_at=datetime.now(timezone.utc)
                repo.license=(d.get("license") or {}).get("spdx_id")
                repo.source_urls=list(dict.fromkeys(row["source_urls"]))
                db.commit()
                count+=1
            except (httpx.HTTPError,ValueError,KeyError) as exc:
                db.rollback()
                failed.append(row["full_name"])
                print("Skipped",row["full_name"],type(exc).__name__)
            finally:
                time.sleep(1)
    print(json.dumps({"imported_or_updated":count,"failed_or_unattempted":failed},ensure_ascii=False))
    if failed:
        raise SystemExit(1)

if __name__=="__main__":
    main()
