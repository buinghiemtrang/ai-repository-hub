# Architectural & Design Decisions Log

Only verified and user-approved decisions are recorded here.

## D1 — Modular Monolith Architecture (M0/M7)
- **Decision**: Keep a single FastAPI backend, single PostgreSQL 16 database, and single Next.js 16 frontend organized as feature slices (`repositories`, `news`, future `ai_studio`, `ai_skills`, `mcp`, `models`, `workflows`, `knowledge`).
- **Rationale**: Simplifies cross-machine Docker Compose setup (Linux & Windows) and allows foreign-key reuse (`news_items.repository_id -> repositories.id`) without distributed-system overhead.

## D2 — Independent News & Repo Module (2026-11-25)
- **Decision**: Build `news` as an independent module (`backend/app/news/`, migration `0007_news.py`, `/news` frontend) that fetches public RSS/Atom/HN Algolia feeds and generates `Repo` highlights from the local `repositories` table.
- **Constraints Agreed**:
  - Never call or depend on external LAN services (such as `192.168.1.117:8788`).
  - Omit community reaction, comment, and submission features.
  - Use browser `window.speechSynthesis` for Vietnamese podcast/article audio playback without relying on external `.mp3` servers.
  - Keep sidebar navigation compact: a single `Tin tức` entry (`AppShell.tsx`), with `Repo`, weekly digests, and category filters inside `/news`.

## D3 — Extensible AI Studio Shell (2026-11-25)
- **Decision**: Add `/studio` and workspace navigation slots for future AI tools (Video AI, Image & POD, Voiceover, Flows, MCP & Skills) without implementing fake generation backends.
- **Rationale**: Prepares navigation and layout structure for upcoming tools while respecting the rule that new backend modules require explicit scope approval.

## D4 — Design System & Taste Skill Integration (2026-11-25)
- **Decision**: Adopt `Leonxlnx/taste-skill` (`design-taste-frontend`) anti AI-slop rules, adapted pragmatically for a daily productivity workspace (keeping fast search, high-scan lists, persistent filters, and audio bar rather than landing-page `100svh` section pacing).
- **Typography Rule**: All chosen Google Fonts must include the `vietnamese` subset (`font-data.json` verified).

## D5 — Art Direction Selection: P2 Vellum Editorial -> P2.1 (2026-11-25)
- **Decision**: User selected **P2 — Vellum Editorial** over P1 (`Obsidian Ledger`) and P3 (`Atelier Canvas`).
- **Refinement Path**: Upgrade P2 into **`P2.1 — Vellum Digital Editorial`** to solve text density, add real images/logos/icons/thumbnails, and verify animation quality.
- **Safety Gate**: Preserve `/prototypes/2` untouched for comparison and do not modify official production routes until the user approves `P2.1`.

## D6 — P2.1 Motion & Asset Architecture (2026-11-25, Prototype Implementation)
- **Motion Library**: Added `motion@14.14.0` (`MotionConfig reducedMotion="user"`, `AnimatePresence`, `layoutId` transitions) inside `frontend/package.json` for editorial choreography and Specimen Folio drawer transitions.
- **Real Icon Inventory**: Bundled `46` CC0/MIT SVGs locally in `frontend/public/icons/` (`icons.mjs` + `icons-credits.json`) for fast offline-safe rendering across both Docker Linux and local dev without third-party CDN runtime failures.
- **Honest Catalog Metrics**: Replaced any synthetic/placeholder trending percentages with real database counts (`Bộ sưu tập biên tập`) and Top 5 catalog `stargazers_count` (`Nổi bật theo GitHub Stars`).

## D7 — P2.2 Polish & Backward-Compatible News Section Counts (2026-11-25)
- **Direction Confirmation**: User approved continuing with `P2.1 — Vellum Digital Editorial` typography, palette, logo, and editorial system into `P2.2 — Vellum Digital Polish` (`/prototypes/2-2`) while preserving `/prototypes/2-1`.
- **Backward-Compatible Backend Extension**: Added `section_counts` and `all_count` to `/news/feed` and `/news/items` (`backend/app/news/router.py`) using a single `GROUP BY` aggregate query computed before `section`/`offset`/`limit` filtering, avoiding per-category client requests and keeping all prior response fields intact.

## D8 — P2.2.1 Stabilization & Release Candidate Architecture (2026-11-25)
- **React #310 Root Cause Fix (`AppShell.tsx`)**: Resolved unconditional Rules-of-Hooks invariant by moving `if (pathname.startsWith("/prototypes"))` below all `useState` / `useEffect` calls rather than adding fragile reload workarounds.
- **Zero-Duplication RC Gating (`rc` prop)**: Implemented `P2.2.1` (`/prototypes/2-2-1`) reusing shared `vellum22` components via `rc={true}` and dedicated `VELLUM_DARK_RC`/`VELLUM_LIGHT_RC` tokens so `P2.2` stays intact for direct visual diffing.
- **Shared Safe Markdown (`GuideRenderer.tsx`)**: Consolidated README rendering in `GuideRenderer` (supporting headings, lists, tables, safe allowlisted links, and fenced code blocks with Copy button; zero `dangerouslySetInnerHTML`) reused across both `/repositories/[id]` and Folio Quick Preview.
