from datetime import datetime
from sqlalchemy import BigInteger, Boolean, DateTime, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.db import Base


class Repository(Base):
    """Catalog entry for a public open-source AI repository."""

    __tablename__ = "repositories"

    id: Mapped[int] = mapped_column(primary_key=True)
    full_name: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    github_id: Mapped[int | None] = mapped_column(BigInteger, unique=True)
    category: Mapped[str] = mapped_column(String(100), index=True)
    description_vi: Mapped[str] = mapped_column(Text)
    description_upstream: Mapped[str | None] = mapped_column(Text)
    guide_vi: Mapped[str | None] = mapped_column(Text)
    homepage: Mapped[str | None] = mapped_column(String(500))
    topics: Mapped[list[str] | None] = mapped_column(JSON)
    language: Mapped[str | None] = mapped_column(String(100), index=True)
    default_branch: Mapped[str | None] = mapped_column(String(100))
    archived: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    image_url: Mapped[str | None] = mapped_column(String(500))
    owner_avatar_url: Mapped[str | None] = mapped_column(String(500))
    has_custom_image: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    stars: Mapped[int | None] = mapped_column(Integer)
    forks: Mapped[int | None] = mapped_column(Integer)
    watchers: Mapped[int | None] = mapped_column(Integer)
    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    synced_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    discovered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    license: Mapped[str | None] = mapped_column(String(100))
    source_urls: Mapped[list[str] | None] = mapped_column(JSON)


class SyncRun(Base):
    """Audit log entry for metadata synchronization runs."""

    __tablename__ = "sync_runs"

    id: Mapped[int] = mapped_column(primary_key=True)
    trigger: Mapped[str] = mapped_column(String(32), index=True)
    status: Mapped[str] = mapped_column(String(32), index=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    total_repos: Mapped[int] = mapped_column(Integer, default=0)
    synced_count: Mapped[int] = mapped_column(Integer, default=0)
    failed_count: Mapped[int] = mapped_column(Integer, default=0)
    rate_limited: Mapped[bool] = mapped_column(Boolean, default=False)
    error_summary: Mapped[str | None] = mapped_column(Text)
    details: Mapped[dict | None] = mapped_column(JSON)
