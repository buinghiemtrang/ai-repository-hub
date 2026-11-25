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
