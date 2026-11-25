from datetime import date, datetime
from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class NewsDay(Base):
    """Daily digest metadata for AI & Repo news."""

    __tablename__ = "news_days"

    id: Mapped[int] = mapped_column(primary_key=True)
    date: Mapped[date] = mapped_column(Date, unique=True, index=True)
    intro: Mapped[str | None] = mapped_column(Text)
    heads: Mapped[list[str] | None] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class NewsItem(Base):
    """Single AI news item, security alert, tip, or repository highlight."""

    __tablename__ = "news_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    external_id: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    day_date: Mapped[date] = mapped_column(
        Date, ForeignKey("news_days.date", ondelete="CASCADE"), index=True
    )
    section: Mapped[str] = mapped_column(String(100), index=True)
    batch: Mapped[str] = mapped_column(String(20), default="morning", server_default="morning", index=True)
    is_tip: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    is_picked: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    title: Mapped[str] = mapped_column(String(500))
    summary: Mapped[str] = mapped_column(Text)
    excerpt: Mapped[str | None] = mapped_column(Text)
    full_text: Mapped[str | None] = mapped_column(Text)
    speech_text: Mapped[str | None] = mapped_column(Text)
    source: Mapped[str] = mapped_column(String(255))
    source_label: Mapped[str | None] = mapped_column(String(255))
    author: Mapped[str | None] = mapped_column(String(255))
    url: Mapped[str | None] = mapped_column(String(1000))
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    time_label: Mapped[str | None] = mapped_column(String(80))
    time_estimated: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    tags: Mapped[list[str] | None] = mapped_column(JSON)
    images: Mapped[list[str] | None] = mapped_column(JSON)
    video: Mapped[dict | None] = mapped_column(JSON)
    sources: Mapped[list[dict] | None] = mapped_column(JSON)
    confidence: Mapped[str | None] = mapped_column(String(40))
    repository_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("repositories.id", ondelete="SET NULL"), index=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class NewsSyncRun(Base):
    """Audit log entry for independent news & repo feed sync runs."""

    __tablename__ = "news_sync_runs"

    id: Mapped[int] = mapped_column(primary_key=True)
    trigger: Mapped[str] = mapped_column(String(32), index=True)
    status: Mapped[str] = mapped_column(String(32), index=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    fetched_count: Mapped[int] = mapped_column(Integer, default=0)
    inserted_count: Mapped[int] = mapped_column(Integer, default=0)
    repo_items_count: Mapped[int] = mapped_column(Integer, default=0)
    error_summary: Mapped[str | None] = mapped_column(Text)
    details: Mapped[dict | None] = mapped_column(JSON)
