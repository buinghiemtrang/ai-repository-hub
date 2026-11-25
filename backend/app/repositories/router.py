from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import select, func, or_
from sqlalchemy.orm import Session
import unicodedata
from app.db import get_db
from app.repositories.models import Repository

router=APIRouter(prefix="/repositories",tags=["repositories"])
def normalize(value):
    return "".join(c for c in unicodedata.normalize("NFD",value.lower()) if not unicodedata.combining(c)).replace("đ","d")

def serialize(r):
    return {k:getattr(r,k) for k in ("id","full_name","category","description_vi","description_upstream","stars","forks","watchers","updated_at","synced_at","license","source_urls")} | {"url":"https://github.com/"+r.full_name}

@router.get("")
def listing(q: str=Query("",max_length=200),category: str=Query("",max_length=100),
            sort: str="stars",page: int=Query(1,ge=1,le=100000),
            favorite_ids: str|None=Query(None,max_length=6000),db: Session=Depends(get_db)):
    stmt=select(Repository)
    if q.strip():
        term=normalize(q.strip())
        stmt=stmt.where(or_(*(func.unaccent(col).icontains(term,autoescape=True) for col in
             (Repository.full_name,Repository.description_vi,Repository.category))))
    if category:
        stmt=stmt.where(Repository.category==category)
    if favorite_ids is not None:
        try:
            ids=[int(x) for x in favorite_ids.split(",") if x]
            if len(ids)>500 or any(x<1 or x>2147483647 for x in ids):
                raise ValueError()
        except ValueError:
            raise HTTPException(422,"Invalid favorite IDs")
        stmt=stmt.where(Repository.id.in_(ids))
    total=db.scalar(select(func.count()).select_from(stmt.subquery()))
    order={"stars":Repository.stars.desc().nulls_last(),"forks":Repository.forks.desc().nulls_last(),
           "updated":Repository.updated_at.desc().nulls_last(),"name":Repository.full_name.asc()}
    rows=db.scalars(stmt.order_by(order.get(sort,order["stars"]),Repository.full_name).offset((page-1)*12).limit(12))
    return {"items":[serialize(r) for r in rows],"total":total,"page":page,"page_size":12}

@router.get("/categories")
def categories(db: Session=Depends(get_db)):
    return list(db.scalars(select(Repository.category).distinct().order_by(Repository.category)))

@router.get("/{repo_id}")
def detail(repo_id:int,db:Session=Depends(get_db)):
    r=db.get(Repository,repo_id)
    if not r:
        raise HTTPException(404,"Repository not found")
    return serialize(r)
