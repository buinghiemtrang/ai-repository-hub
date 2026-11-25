# Changelog

All notable changes to AI Repository Hub are documented in this file.

## [Unreleased] — Branch `redesign/taste-skill` (2026-11-25)

### Added
- **Independent `news` backend module** (`backend/app/news/`): SQLAlchemy models (`NewsDay`, `NewsItem`, `NewsSyncRun`), Alembic migration `0007_news.py`, public RSS/Atom/HN Algolia ingestion (`feeds.py`), catalog `Repo` highlight builder (`seed.py`, `sync.py`), background scheduler (`scheduler.py`), API routes (`/news/feed`, `/news/days`, `/news/day/{date}`, `/news/items`, `/news/weekly`, `/news/sync/status`, `/news/sync/trigger`), and unit/integration tests (`backend/tests/test_news.py`).
- **News frontend** (`frontend/app/news/`, `frontend/app/api/news/`, `frontend/components/news/`, `frontend/lib/news/`): section filters (`Repo` + 8 AI/security/community categories), accent-insensitive search with `<mark>` highlights, weekly digest, 7-day topic timeline, hero spotlight, lightbox, lazy video player, and browser `speechSynthesis` Podcast/TTS player.
- **Extensible Workspace Shell & Studio** (`frontend/components/AppShell.tsx`, `frontend/app/studio/page.tsx`): collapsible sidebar with compact single `Tin tức` entry, `/studio` AI tool launcher slots, and dual sync status tracking on `/sync`.
- **Taste Skill Phase 1, Phase 2 & P2.1 Prototypes** (`frontend/app/prototypes/`, `frontend/components/prototypes/`, `frontend/components/prototypes/vellum/`, `frontend/public/icons/`):
  - Built live comparison hub and 3 baseline prototypes (`P1 Obsidian Ledger`, `P2 Vellum Editorial`, `P3 Atelier Canvas`).
  - Upgraded `P2` into **`P2.1 — Vellum Digital Editorial`** (`/prototypes/2-1`) with `motion@14.14.0`, 46 CC0/MIT brand & language SVGs (`icons-credits.json`), 6-tier repository thumbnail & specimen plate renderer, Specimen Folio Quick-Peek drawer, Editorial Collections & GitHub Stars leaderboard, Grid/List toggle, and synchronized Vellum `Tạp chí Tin` + `Xưởng AI` views.
  - Verified P2.1 in headless Chrome CDP across 6 viewports (`1920`–`390`), Light/Dark modes, and reduced motion; archived screenshots in `docs/design/screenshots/p2-1-*.png`.
- **Project Memory & Cross-Platform Handover**: Added `ARCHITECTURE.md`, `DESIGN.md`, `PROJECT_STATUS.md`, `NEXT_TASK.md`, `DECISIONS.md`, `CHANGELOG.md`, `docs/design/`, and `docs/prompts/`; updated `AGENTS.md`, `README.md`, `.gitignore`.

### Changed
- `.env.example`, `compose.yaml`: added `NEWS_SYNC_ENABLED` and `NEWS_SYNC_INTERVAL_HOURS`.
- `backend/app/main.py`, `backend/migrations/env.py`: registered `news` models, seed, router, and scheduler.
- `docs/MODULE_CONTRACTS.md`, `modules/README.md`, `frontend/app/modules/page.tsx`: reflected active `news` module and planned `ai_studio` slots.

## [M0–M7] — Branch `main` (prior commits)
- `a760293`: GitHub repository banners, owner avatars, and visual card polish.
- `0026330`: Dark mode theme toggle with FOUC-free SSR initialization.
- `877a787`: UI typography, command toolbar, cards, and 2-column detail layout.
- `edb3e53`: Canonical GitHub API redirects and catalog verification report (487 repos).
- `422e2f4`: Modular monolith contracts (`docs/MODULE_CONTRACTS.md`) and roadmap overview.
- `fa16b9d`: API/sync tests, CI checks, and Linux/Windows PostgreSQL backup/restore scripts.
- `bff8a20`: Scheduled metadata sync, `sync_runs` audit log, and `ADMIN_API_KEY` guard.
- `edde628`: shadcn/ui repository library, accent-insensitive search, favorites, and README detail guides.
