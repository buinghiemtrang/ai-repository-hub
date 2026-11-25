# Changelog

All notable changes to AI Repository Hub are documented in this file.

## [Unreleased] — Branch `redesign/taste-skill` (2026-11-25)

### Added
- **Independent `news` backend module** (`backend/app/news/`): SQLAlchemy models (`NewsDay`, `NewsItem`, `NewsSyncRun`), Alembic migration `0007_news.py`, public RSS/Atom/HN Algolia ingestion (`feeds.py`), catalog `Repo` highlight builder (`seed.py`, `sync.py`), background scheduler (`scheduler.py`), API routes (`/news/feed`, `/news/days`, `/news/day/{date}`, `/news/items`, `/news/weekly`, `/news/sync/status`, `/news/sync/trigger`), and unit/integration tests (`backend/tests/test_news.py`).
- **News frontend** (`frontend/app/news/`, `frontend/app/api/news/`, `frontend/components/news/`, `frontend/lib/news/`): section filters (`Repo` + 8 AI/security/community categories), accent-insensitive search with `<mark>` highlights, weekly digest, 7-day topic timeline, hero spotlight, lightbox, lazy video player, and browser `speechSynthesis` Podcast/TTS player.
- **Extensible Workspace Shell & Studio** (`frontend/components/AppShell.tsx`, `frontend/app/studio/page.tsx`): collapsible sidebar with compact single `Tin tức` entry, `/studio` AI tool launcher slots, and dual sync status tracking on `/sync`.
- **Taste Skill Phase 1, Phase 2, P2.1 & P2.2 Prototypes** (`frontend/app/prototypes/`, `frontend/components/prototypes/`, `frontend/components/prototypes/vellum/`, `frontend/components/prototypes/vellum22/`, `frontend/public/icons/`):
  - Built live comparison hub and baseline prototypes (`P1`, `P2`, `P2.1`, `P3`).
  - Extended `/news/feed` & `/news/items` (`backend/app/news/router.py`, `backend/tests/test_news.py`) backward-compatibly with single-query `section_counts` & `all_count`.
  - Built **`P2.2 — Vellum Digital Polish`** (`/prototypes/2-2`) with live News category counts & fixed category/brand icons (`NewsCategoryIcon`), above-the-fold Repo Library compaction (`y = 562px`), smart News Cover Story selection + pagination + `NewsDetailDrawer22`, upgraded `RepoQuickPeek22` focus trap & structured README view, and inline Studio Workflow Diagram without backend path exposure.
  - Built **`P2.2.1 — Stabilization & Release Candidate`** (`/prototypes/2-2-1`, keeping `/prototypes/2-2` intact): fixed React Error #310 root cause in `frontend/components/AppShell.tsx`, added 3-part News result count labels, `44×44px` mobile touch targets (`320`–`430px`), reused enhanced safe Markdown `GuideRenderer` in Folio, and upgraded `VELLUM_DARK_RC` WCAG 2.2 AA contrast tokens.
  - **Vellum Design System 1.0 Full Website Migration**:
    - Added `frontend/next.config.ts` (`image/avif`, `image/webp`), `sharp`, `eslint`, `eslint-config-next` (`eslint.config.mjs`), and `frontend/app/icon.svg`.
    - Optimized Google Fonts (`Hanken Grotesk`, `Newsreader`, `JetBrains Mono`) globally and isolated P1/P3 fonts into `/prototypes/1/layout.tsx` & `/prototypes/3/layout.tsx`.
    - Migrated all official production UI routes & components (`AppShell.tsx`, `ThemeToggle.tsx`, `FavoriteButton.tsx`, `RepoImage.tsx`, `RepositoryLibrary.tsx`, `app/page.tsx`, `app/repositories/[id]/page.tsx`, `error.tsx`, `not-found.tsx`, `NewsFeedWorkspace.tsx`, `NewsAudioPlayer.tsx`, `app/news/page.tsx`, `VellumStudioWorkspace.tsx`, `app/studio/page.tsx`, `app/sync/page.tsx`, `app/modules/page.tsx`) to `--v-*` CSS tokens and `.vellum-plate-0..4`, removing prototype controls from official UI and adding SSR initial prefetching (`CLS = 0`).
  - Verified full production routes in headless Chrome (`1920`–`320px`, Dark/Light, React #310 regression flow, Favorites & Theme `localStorage`, `AVIF` image optimization, `60 FPS` scroll delta) and `15/15` backend tests; saved report at `docs/design/VELLUM_1_0_MIGRATION_REPORT.md` and screenshots in `docs/design/screenshots/*-v1-*.png`.
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
