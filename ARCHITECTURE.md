# System Architecture — AI Repository Hub

## 1. Architectural Pattern

AI Repository Hub is built as a **Modular Monolith**:
- Single deployable backend (`FastAPI`) + single PostgreSQL 16 database + single frontend (`Next.js 16` App Router).
- Each domain module owns its SQLAlchemy models, API router, sync/service logic, tests, Next.js routes, API proxy, and UI components.
- Detailed module boundary contracts are documented in [docs/MODULE_CONTRACTS.md](docs/MODULE_CONTRACTS.md).

## 2. Tech Stack

- **Frontend**: Next.js `16.x` (App Router, Turbopack), React `19.x`, TypeScript `5.9`, Tailwind CSS `v4`, `lucide-react`, `class-variance-authority`, `clsx`, `tailwind-merge`.
- **Backend**: Python `3.12`, FastAPI, SQLAlchemy `2.0`, Alembic `1.14+`, `psycopg[binary]`, `httpx`.
- **Database**: PostgreSQL `16-alpine` with `unaccent` extension enabled (`0003_search.py`).
- **Infrastructure**: Docker Compose v2 (`db`, `backend`, `frontend` services, loopback-bound ports `127.0.0.1:8000` and `127.0.0.1:3000`).

## 3. Backend Modules (`backend/app/`)

### Active Module 1: `repositories` (`backend/app/repositories/`)
- **Models** (`models.py`): `Repository`, `SyncRun`.
- **API Router** (`router.py`, prefix `/repositories`):
  - `GET /repositories` — accented/unaccented Vietnamese search, category/language/favorite_ids filters, 6 sort modes, 12/page pagination.
  - `GET /repositories/categories`, `GET /repositories/stats`, `GET /repositories/{repo_id}`.
  - `GET /repositories/sync/status`, `POST /repositories/sync/trigger` (`X-Admin-Key` protected).
- **Services**: `github_client.py` (retries, redirect validation, rate-limit safety), `guides.py` (README-derived Vietnamese guide builder without command execution), `sync.py`, `scheduler.py`, `discover.py`, `import_catalog.py`, `sync_images.py`, `seed.py`.

### Active Module 2: `news` (`backend/app/news/`)
- **Models** (`models.py`): `NewsDay`, `NewsItem` (optional FK `repository_id -> repositories.id`), `NewsSyncRun`.
- **API Router** (`router.py`, prefix `/news`):
  - `GET /news/feed` — aggregated days, items, sections (`Repo`, `Claude`, `Grok`, `ChatGPT / OpenAI`, `Gemini`, `Bảo mật & An ninh mạng`, `Cộng đồng AI Việt Nam`, `Bài hay trong nhóm`, `Ứng dụng thực tế`), dynamic weekly digests, stats.
  - `GET /news/days`, `GET /news/day/{YYYY-MM-DD}`, `GET /news/items` (`unaccent` search + section/batch/date filters), `GET /news/weekly`.
  - `GET /news/sync/status`, `POST /news/sync/trigger` (`X-Admin-Key` protected).
- **Ingestion**: `feeds.py` (public RSS/Atom/HN Algolia fetcher with HTML stripping and safe URL validation), `sections.py`, `sync.py` (merges public feeds + local catalog `Repo` highlights), `scheduler.py`, `seed.py`.
- **Explicit Exclusions**: No reaction, comment, or submission endpoints; strictly independent from external LAN feeds.

### Database Migrations (`backend/migrations/versions/`)
- `0001_catalog.py` — `repositories` table
- `0002_provenance.py` — `source_urls`, `discovered_at`
- `0003_search.py` — PostgreSQL `unaccent` extension
- `0004_catalog_guides.py` — `guide_vi`, `description_upstream`, `homepage`, `topics`, `default_branch`, `archived`, `watchers`, `synced_at`
- `0005_sync_runs.py` — `sync_runs` table
- `0006_repo_images.py` — `image_url`, `owner_avatar_url`, `has_custom_image`
- `0007_news.py` — `news_days`, `news_items`, `news_sync_runs`

## 4. Frontend Structure (`frontend/`)

- **App Shell** (`components/AppShell.tsx`, `app/layout.tsx`): Collapsible workspace sidebar + sticky top bar + `ThemeToggle`. Bypasses chrome on `/prototypes/*` so design prototypes run standalone.
- **API Proxies** (Next.js Route Handlers with explicit GET allowlists):
  - `app/api/repositories/[[...parts]]/route.ts` -> FastAPI `/repositories/*`
  - `app/api/news/[[...parts]]/route.ts` -> FastAPI `/news/*`
- **Active Pages**:
  - `/` (`components/repositories/RepositoryLibrary.tsx`)
  - `/repositories/[id]` (`app/repositories/[id]/page.tsx`, `GuideRenderer.tsx`, `FavoriteButton.tsx`)
  - `/news` (`components/news/NewsFeedWorkspace.tsx`, `NewsCard.tsx`, `NewsAudioPlayer.tsx` using browser `speechSynthesis`)
  - `/studio` (`app/studio/page.tsx` — modular extension launcher for future AI tools)
  - `/sync` (`app/sync/page.tsx` — Repository & News scheduler logs)
  - `/modules` (`app/modules/page.tsx` — Modular Monolith contract status)
  - `/prototypes`, `/prototypes/1`, `/prototypes/2`, `/prototypes/3` — Isolated Phase 2 design direction prototypes consuming live API data.

## 5. Planned Future Modules (Awaiting Explicit Scope)
- `ai_studio` (Video AI, Image & POD Design, Voiceover)
- `ai_skills`, `mcp`, `models`, `tools`, `workflows`, `knowledge`
