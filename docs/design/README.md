# Design References & Visual Artifacts

This directory stores visual audit captures, prototype references, and design iteration notes for AI Repository Hub.

## Screenshots (`docs/design/screenshots/`)

### Phase 1 — Current Production UI Audit (2026-11-25)
- `home-1440.png` — Repository Library (`/`), Desktop `1440×900`, Light mode
- `home-1440-dark.png` — Repository Library (`/`), Desktop `1440×900`, Dark mode
- `home-390.png` — Repository Library (`/`), Mobile `390×844`
- `detail-1440.png` — Repository Detail (`/repositories/1`), Desktop `1440×900`
- `news-1440.png` — AI News Feed (`/news`), Desktop `1440×900`
- `studio-1440.png` — AI Studio (`/studio`), Desktop `1440×900`

### Phase 2 — Art Direction Prototypes (2026-11-25)
- `proto1-1440.png` — **P1 · Obsidian Ledger** (`/prototypes/1`)
- `proto2-1440.png` — **P2 · Vellum Editorial** (`/prototypes/2`) — *Selected baseline*
- `proto3-1440.png` — **P3 · Atelier Canvas** (`/prototypes/3`)

### Phase 2.1 — Vellum Digital Editorial Verification (2026-11-25)
- `p2-1-1440.png` — **P2.1 · Vellum Digital Editorial** (`/prototypes/2-1`), Desktop `1440×900`, Light mode
- `p2-1-1024.png` — **P2.1**, Small desktop / landscape tablet `1024×768`
- `p2-1-768.png` — **P2.1**, Tablet `768×1024`
- `p2-1-390.png` — **P2.1**, Mobile `390×844`
- `p2-1-dark.png` — **P2.1**, Desktop `1440×900`, Dark mode
- `p2-1-folio.png` — **P2.1**, Specimen Folio Quick-Peek slide-over drawer
- `p2-1-news.png` — **P2.1**, Integrated AI News magazine view (`Tạp chí Tin`)
- `p2-1-studio.png` — **P2.1**, Integrated AI Studio workbench preview (`Xưởng AI`)

### Phase 2.2 — Vellum Digital Polish Verification (2026-11-25)
- `p2-2-1440.png` — **P2.2 · Vellum Digital Polish** (`/prototypes/2-2`), Desktop `1440×900`, Light mode (Repo cards visible above the fold at `y = 562px`)
- `p2-2-1024.png` — **P2.2**, Small desktop / landscape tablet `1024×768`
- `p2-2-390.png` — **P2.2**, Mobile `390×844`
- `p2-2-dark.png` — **P2.2**, Desktop `1440×900`, Dark mode (`#131110`)
- `p2-2-folio.png` — **P2.2**, Upgraded Specimen Folio Quick Preview (position badge, structured README, focus trap)
- `p2-2-news.png` — **P2.2**, AI News Magazine with live category counts, brand/semantic icons, and non-Repo Cover Story priority
- `p2-2-news-detail.png` — **P2.2**, AI News Detail Reader drawer (`NewsDetailDrawer22`)
- `p2-2-studio.png` — **P2.2**, AI Studio Workbench with SVG architecture workflow diagram & interactive stages

## Active Prototype Code
- Comparison index: [frontend/app/prototypes/page.tsx](../../frontend/app/prototypes/page.tsx)
- P1: [frontend/app/prototypes/1/page.tsx](../../frontend/app/prototypes/1/page.tsx)
- P2: [frontend/app/prototypes/2/page.tsx](../../frontend/app/prototypes/2/page.tsx) (keep intact for comparison)
- P2.1: [frontend/app/prototypes/2-1/page.tsx](../../frontend/app/prototypes/2-1/page.tsx) & [frontend/components/prototypes/vellum/](../../frontend/components/prototypes/vellum/) (baseline direction approved by user)
- P2.2: [frontend/app/prototypes/2-2/page.tsx](../../frontend/app/prototypes/2-2/page.tsx) & [frontend/components/prototypes/vellum22/](../../frontend/components/prototypes/vellum22/) (latest polish candidate awaiting user acceptance)
- P3: [frontend/app/prototypes/3/page.tsx](../../frontend/app/prototypes/3/page.tsx)
