"""SQLAlchemy models owned by the MCP module."""
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class McpServer(Base):
    """MCP server profile derived from a catalog repository's upstream files.

    Only metadata parsed from public upstream files (server.json, README config blocks) is
    stored. Environment variables are kept as names/descriptions only — never values.
    """

    __tablename__ = "mcp_servers"

    id: Mapped[int] = mapped_column(primary_key=True)
    repository_id: Mapped[int] = mapped_column(
        ForeignKey("repositories.id", ondelete="CASCADE"), unique=True, index=True
    )
    server_name: Mapped[str] = mapped_column(String(100))
    # "detected" when at least one transport/install method was parsed, else "no_config_found".
    status: Mapped[str] = mapped_column(String(32), index=True)
    transports: Mapped[list[str] | None] = mapped_column(JSON)
    install_methods: Mapped[list[dict] | None] = mapped_column(JSON)
    remotes: Mapped[list[dict] | None] = mapped_column(JSON)
    env_vars: Mapped[list[dict] | None] = mapped_column(JSON)
    requires_secret: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    sources: Mapped[list[str] | None] = mapped_column(JSON)
    evidence_urls: Mapped[list[str] | None] = mapped_column(JSON)
    extracted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class McpSyncRun(Base):
    """Audit log entry for MCP profile extraction runs."""

    __tablename__ = "mcp_sync_runs"

    id: Mapped[int] = mapped_column(primary_key=True)
    trigger: Mapped[str] = mapped_column(String(32), index=True)
    status: Mapped[str] = mapped_column(String(32), index=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    total_repos: Mapped[int] = mapped_column(Integer, default=0)
    detected_count: Mapped[int] = mapped_column(Integer, default=0)
    failed_count: Mapped[int] = mapped_column(Integer, default=0)
    rate_limited: Mapped[bool] = mapped_column(Boolean, default=False)
    error_summary: Mapped[str | None] = mapped_column(Text)
    details: Mapped[dict | None] = mapped_column(JSON)
