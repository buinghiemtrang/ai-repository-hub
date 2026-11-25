from sqlalchemy import String, Text, Integer, BigInteger, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from app.db import Base

class Repository(Base):
    __tablename__ = "repositories"
    id: Mapped[int] = mapped_column(primary_key=True)
    full_name: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    github_id: Mapped[int | None] = mapped_column(BigInteger, unique=True)
    category: Mapped[str] = mapped_column(String(100), index=True)
    description_vi: Mapped[str] = mapped_column(Text)
    description_upstream: Mapped[str | None] = mapped_column(Text)
    stars: Mapped[int | None] = mapped_column(Integer)
    forks: Mapped[int | None] = mapped_column(Integer)
    watchers: Mapped[int | None] = mapped_column(Integer)
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    synced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    license: Mapped[str | None] = mapped_column(String(100))
    source_urls: Mapped[list[str] | None] = mapped_column(JSON)
