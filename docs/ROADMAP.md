# Roadmap

- M0: bootstrap Next.js + FastAPI + PostgreSQL + Docker. Verify Linux and Windows, lock dependencies, add Alembic and CI.
- M1: inspect public Mochi Studio listing and detail pages, pagination, categories, requests, robots/terms. Use REA only if helpful; review its installation and scope first. No bypasses.
- M2: build polite import pipeline (canonical owner/name, stable GitHub ID, source URL, category, provenance, timestamp, dedupe, retry/rate limit). Validate coverage against current listing; do not hardcode 487 as permanent total. Write original summaries from upstream docs.
- M3: polish UI based on reference, add shadcn/ui components, responsive cards, accent-insensitive Vietnamese search, favorites filter.
- M4: verified detail and installation guides, README links, errors and empty state.
- M5: metadata refresh scheduling, logs, retry, token safety.
- M6: tests, CI, cross-platform setup and backup/restore.
- M7: module contracts for AI Skills, MCP, Models, Tools, Workflows, Knowledge; implement only after user approval.

The bootstrap is not a finished clone. Seed entries are independently chosen examples, not a complete or verified crawl.
