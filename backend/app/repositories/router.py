from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import select, func, or_
from sqlalchemy.orm import Session
from app.db import get_db
from app.repositories.models import Repository

router = APIRouter(prefix="/repositories", tags=["repositories"])
def serialize(r):
    return {k:getattr(r,k) for k in ("id","full_name","category","description_vi","description_upstream","stars","forks","watchers","updated_at","synced_at","license")} | {"url":"https://github.com/"+r.full_name}

@router.get("")
def listing(q: str = Query("",max_length=200), category: str = "", sort: str = "stars",
            page: int = Query(1,ge=1,le=100000), db: Session = Depends(get_db)):
    stmt = select(Repository)
    if q.strip():
        term = q.strip()
        stmt = stmt.where(or_(Repository.full_name.icontains(term,autoescape=True),
                              Repository.description_vi.icontains(term,autoescape=True),
                              Repository.category.icontains(term,autoescape=True)))
    if category:
        stmt = stmt.where(Repository.category == category)
    total = db.scalar(select(func.count()).select_from(stmt.subquery()))
    order = {"stars":Repository.stars.desc().nulls_last(),"forks":Repository.forks.desc().nulls_last(),
             "updated":Repository.updated_at.desc().nulls_last(),"name":Repository.full_name.asc()}
    rows = db.scalars(stmt.order_by(order.get(sort,order["stars"]),Repository.full_name).offset((page-1)*12).limit(12))
    return {"items":[serialize(r) for r in rows],"total":total,"page":page,"page_size":12}

@router.get("/categories")
def categories(db: Session = Depends(get_db)):
    return list(db.scalars(select(Repository.category).distinct().order_by(Repository.category)))

@router.get("/{repo_id}")
def detail(repo_id: int,db: Session = Depends(get_db)):
    r = db.get(Repository,repo_id)
    if not r:
        raise HTTPException(404,"Repository not found")
    return serialize(r)
