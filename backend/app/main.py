from contextlib import asynccontextmanager
from fastapi import FastAPI
from sqlalchemy import text
from app.db import Session
from app.repositories.router import router
from app.repositories.seed import seed

@asynccontextmanager
async def lifespan(app):
    with Session() as db:
        seed(db)
    yield

app=FastAPI(title="AI Repository Hub",lifespan=lifespan)
app.include_router(router)

@app.get("/health")
def health():
    with Session() as db:
        db.execute(text("SELECT 1"))
    return {"status":"ok"}
