# Project Status — AI Repository Hub

**Last Verified:** 2026-11-25
**Active Branch:** `redesign/taste-skill` (branched from `main` at `a760293`)

## 1. Completed & Verified

### Repository Catalog (`M0`–`M7`, on `main`)
- Docker Compose (`db`, `backend`, `frontend`), Alembic migrations `0001`–`0006`, PostgreSQL 16 `unaccent`.
- Verified catalog of **487/487** AI repositories (`docs/M2_CATALOG_REPORT.md`), Vietnamese search, favorites, detail guides, scheduled GitHub API sync, backup/restore scripts.

### Independent News & Repo Feed Module (on `redesign/taste-skill`)
- **Backend** (`backend/app/news/` + migration `0007_news.py`):
  - Models: `NewsDay`, `NewsItem` (links to `repositories.id`), `NewsSyncRun`.
  - Endpoints: `/news/feed`, `/news/days`, `/news/day/{YYYY-MM-DD}`, `/news/items`, `/news/weekly`, `/news/sync/status`, `/news/sync/trigger` (`X-Admin-Key` guarded).
  - Independent ingestion (`feeds.py`, `sync.py`, `scheduler.py`, `seed.py`): fetches public RSS/Atom/HN Algolia feeds + builds `Repo` section items directly from `repositories` catalog. Strictly zero calls to external LAN feeds; no reaction/comment/submit endpoints.
- **Frontend** (`frontend/app/news/`, `frontend/components/news/`, `frontend/app/api/news/`):
  - Compact single `Tin tức` menu item in `AppShell.tsx`.
  - Full feed UI: `Repo` + 8 AI/security/community sections, accented/unaccented search with `<mark>` highlight, model/source/tag filters, daily sidebar, weekly digest, 7-day topic timeline, hero cards, expandable details, lightbox, lazy video player, and browser `speechSynthesis` Podcast/TTS player.
- **Verification**: `15/15` backend tests passed (`test_api.py`, `test_discovery.py`, `test_news.py`, `test_sync_and_guide.py`), `python -m app.news.sync` fetched 81 live RSS items + 8 repo items (`96` items across `13` days), `tsc --noEmit` & `next build` passed, HTTP 200 verified on all routes.

### Extensible AI Studio Shell (on `redesign/taste-skill`)
- `frontend/app/studio/page.tsx` and updated `AppShell.tsx` / `modules/page.tsx` / `sync/page.tsx` defining slots for future AI tools (Video AI, Image & POD, Voiceover, Flows, MCP & Skills, Local Models).

### Frontend Redesign — Phase 1, Phase 2 & P2.1 Prototype (on `redesign/taste-skill`)
- Integrated `Leonxlnx/taste-skill` (`design-taste-frontend` `tasteskill 2.5.1`) into `~/.agents/skills/design-taste-frontend/`.
- Audited live UI in headless Chrome (`docs/design/screenshots/`).
- Built 3 live interactive baseline prototypes (`/prototypes/1`, `/prototypes/2`, `/prototypes/3` + `/prototypes` index) using real API data; user selected **P2 — Vellum Editorial**.
- **User Direction Agreement**: Approved continuing with **`P2.1 — Vellum Digital Editorial`** identity/palette/typography as the foundation.
- **Built & Verified `P2.2 — Vellum Digital Polish`** (`/prototypes/2-2` + `frontend/components/prototypes/vellum22/`):
  - **News Category Counts & Semantic Icons**: Extended `/news/feed` and `/news/items` backward-compatibly with `section_counts` + `all_count` (`backend/app/news/router.py`); updated `VellumNewsView22` to render live deduplicated counts across date & search scope (regardless of active category or pagination, including `0`-count states), fixed non-GitHub section icons (`Bảo mật`, `Cộng đồng AI VN`, `Bài hay trong nhóm`, `Ứng dụng thực tế`) and exact brand logos (`Claude`, `Grok`, `ChatGPT/OpenAI`, `Gemini`).
  - **Library & News & Studio Polish**: Compacted Library hero/spotlight + Top 5 Stars + inline Collections so first Repo cards sit visible above the fold (`y = 562px` vs `1030px` in P2.1); prioritized non-Repo AI headlines for News Cover Story + added News pagination + `NewsDetailDrawer22`; upgraded `RepoQuickPeek22` focus management (`Tab` trap, focus restore, `Copy URL`, structured README cards); added inline Workflow Diagram + interactive Stage inspector in `VellumStudioView22` without exposing internal backend paths.
  - Verified in headless Chrome across 6 viewports (`0` overflow, `64/64` images loaded, Light + Dark `#131110`, FCP `188ms`, `prefers-reduced-motion`) and `15/15` backend tests. Preserved `P1`, `P2`, `P2.1`, and `P3` intact.

## 2. In Progress / Not Yet Started

- **User Review & Acceptance of `P2.2`**: Awaiting user verification at `http://localhost:3000/prototypes/2-2` (comparing side-by-side with `/prototypes/2-1`) before promoting to production.
- **Phase 3 — Final Design System Tokens & Shared Components**: Pending P2.2 acceptance.
- **Phase 4 — Production Frontend Redesign**: Official UI (`/`, `/repositories/[id]`, `/news`, `/studio`, `/sync`, `/modules`) has **not** been replaced yet.
- **Phase 5 — Production Visual & Full E2E QA**: Pending Phase 4 implementation.
