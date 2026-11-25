# Vellum Design System 1.0 — Full Website Migration & Release Acceptance Report

**Branch:** `redesign/taste-skill` (rollback baseline: `checkpoint/p2-2-1-baseline` at `b8dc455`)  
**Date:** 2026-11-25  
**Design System:** **Vellum Design System 1.0** (promoted from approved `P2.2.1`)

---

## 1. Executive Release Verdict

- **Overall Status:** **PASS** across all canonical production routes (`/`, `/repositories/[id]`, `/news`, `/studio`, `/sync`, `/modules`), Light & Dark modes, desktop (`1920px`/`1440px`/`1024px`), tablet (`768px`), and mobile (`430px`/`390px`/`360px`/`320px`).
- **Prototype Archive:** Historical routes `/prototypes`, `/prototypes/1`, `/prototypes/2`, `/prototypes/2-1`, `/prototypes/2-2`, `/prototypes/2-2-1`, `/prototypes/3` remain intact internally and are completely hidden from official production header, footer, and page controls.
- **Note on Lab Conditions:** Performance telemetry was collected against Docker Compose running on `127.0.0.1:3000` in headless Google Chrome (3 runs per viewport). Real-user field `INP` requires RUM telemetry in production traffic and is noted as **not verified by lab load**.

---

## 2. Migrated Routes & Modules

| Route | Component(s) | Applied Vellum 1.0 Pattern | Status |
|---|---|---|---|
| `/` | `frontend/app/page.tsx`, `frontend/components/repositories/RepositoryLibrary.tsx`, `RepoQuickPeek22.tsx`, `RepoThumbnail22.tsx`, `FavoriteButton.tsx` | SSR-prefetched editorial spotlight + Top 5 GitHub Stars + 4 collections + command bar + 3-col Specimen Plates (`CSS-driven .vellum-plate-0..4` Light/Dark) + Compact List + Quick Peek | **PASS** |
| `/repositories/[id]` | `frontend/app/repositories/[id]/page.tsx`, `error.tsx`, `not-found.tsx`, `RepoImage.tsx`, `GuideRenderer.tsx` | Full Vellum editorial folio, `<RepoBannerImage>` AVIF/WebP or Specimen fallback, `<GuideRenderer variant="vellum" />` with mobile copy hitbox, sticky GitHub ledger | **PASS** |
| `/news` | `frontend/app/news/page.tsx`, `frontend/components/news/NewsFeedWorkspace.tsx`, `NewsAudioPlayer.tsx`, `NewsDetailDrawer22.tsx` | SSR-prefetched digital magazine, unique deduplicated News Category Counts + accurate brand/semantic icons, 3-part result label, non-Repo Cover Story priority, Weekly Digest, 7-day Topic Timeline, Video & Lightbox, TTS Podcast bar | **PASS** |
| `/studio` | `frontend/app/studio/page.tsx`, `frontend/components/studio/VellumStudioWorkspace.tsx` | Interactive Vellum Creative Workbench (Video, Image, Voice, Flows, MCP, Models) + 8-tool directory + SVG workflow diagram + brand links (`?tool=` supported, zero internal filesystem paths leaked) | **PASS** |
| `/sync` | `frontend/app/sync/page.tsx` | Vellum Technical Ledger cards & scrollable Repo + News RSS scheduler run tables (`640px` min-width inside `overflow-x-auto`) | **PASS** |
| `/modules` | `frontend/app/modules/page.tsx` | Vellum Modular Monolith contract matrix linking active modules and Demo UI routes | **PASS** |
| Global Shell & Assets | `frontend/app/layout.tsx`, `frontend/app/globals.css`, `frontend/app/icon.svg`, `frontend/components/AppShell.tsx`, `ThemeToggle.tsx` | Official Vellum masthead & footer (`/` command search trigger, `Công cụ AI` dropdown, `Hệ thống` dropdown, live Favorites counter), authoritative `--v-*` Light/Dark CSS tokens, `Hanken Grotesk` + `Newsreader` + `JetBrains Mono` variable fonts, inline Vellum SVG favicon (`0` 404s) | **PASS** |

---

## 3. Stabilization & Optimization Before / After Metrics

### Key Engineering Fixes Applied
1. **ESLint Toolchain (`eslint@9` + `eslint-config-next`)**: Configured `frontend/eslint.config.mjs` (`"lint": "eslint ."`). Zero ESLint errors or warnings across all official production files (`AppShell.tsx`, `ThemeToggle.tsx`, `FavoriteButton.tsx`, `RepositoryLibrary.tsx`, `NewsFeedWorkspace.tsx`, `NewsAudioPlayer.tsx`, `RepoQuickPeek22.tsx`, `app/sync/page.tsx`, `app/**/page.tsx`).
2. **Image Pipeline (`next/image` + `sharp`)**: Added `frontend/next.config.ts` (`formats: ["image/avif", "image/webp"]`, `minimumCacheTTL: 86400`, allowlisted GitHub domains) and `sharp`. `deepseek-ai/deepseek-harness` Spotlight image dropped from raw **`847 KiB`** PNG to **`3.0–4.0 KiB`** `image/avif`; total home image payload dropped from `~1,348 KiB` pre-optimization (`P2.2.1` unoptimized baseline) to **`63.8–107.6 KiB`**.
3. **Font Diet**: Replaced `Be_Vietnam_Pro` global duplication and isolated `P1`/`P3` prototype fonts into `app/prototypes/1/layout.tsx` & `app/prototypes/3/layout.tsx`. Official routes load only **8–9 `.woff2` files** (`192.1 KiB` on `/`, `227.6 KiB` on `/news` — down from `524 KiB` / 30 files before optimization).
4. **SSR Data Prefetching (`CLS = 0`)**: `app/page.tsx` and `app/news/page.tsx` prefetch live backend data server-side (`cache: "no-store"`), eliminating layout shift from empty-to-populated state transitions.
5. **LocalStorage Consistency & Hydration Safety**: Unified Favorites snapshot reading on `FAVORITES_STORAGE_KEY = "repo-favorites"` across `FavoriteButton.tsx`, `AppShell.tsx`, `RepositoryLibrary.tsx`, and `NewsFeedWorkspace.tsx` (`useSyncExternalStore`). Theme toggle continues using `"theme"` cleanly across all routes.

### Measured Telemetry (3-Run Medians, Healthy Local Stack)

| Scenario | Median LCP | Median CLS | Median DCL | Total Transfer | JS | Images | Fonts | Requests |
|---|---|---|---|---|---|---|---|---|
| `/` Desktop `1440×900` Cold | **88 ms** | **0** | 86 ms | 1257.9 KiB | 728.3 KiB | 107.6 KiB | 192.1 KiB | 60 |
| `/` Desktop `1440×900` Warm | **104 ms** | **0** | 71 ms | 1214.1 KiB | 728.3 KiB | 63.8 KiB | 192.1 KiB | 60 |
| `/` Mobile `390×844` Cold | **88 ms** | **0** | 75 ms | 1225.1 KiB | 728.3 KiB | 78.1 KiB | 192.1 KiB | 44 |
| `/` Mobile `320×568` Cold | **96 ms** | **0** | 49 ms | 1224.3 KiB | 728.3 KiB | 77.3 KiB | 192.1 KiB | 44 |
| `/news` Desktop `1440×900` Cold | **368 ms** | **0** | 51 ms | 2646.2 KiB | 760.4 KiB | 1320.1 KiB (RSS external) | 227.6 KiB | 38 |

---

## 4. Verification Summary

- **Official File ESLint & TypeScript & Production Build**:
  - `npx eslint <official routes/components>` — **0 errors, 0 warnings** (pre-existing prototype files `/prototypes/1`, `/prototypes/2-1`, `/prototypes/2-2`, `/prototypes/2-2-1` still contain legacy hook/ref lint debt outside production scope).
  - `npm run typecheck` (`tsc --noEmit`) — **PASS**.
  - `npm run build` (`next build`) — **PASS**.
- **Backend Unit & API Integration Suite**:
  - `python -m unittest discover -s tests -v` — **15/15 PASS** (`1.762s`).
- **Browser Functional, Security & Responsive QA (Chrome CDP)**:
  - **React #310 Regression Flow**: Grid card -> Quick Peek -> `/repositories/1` -> Back `/` -> Spotlight Quick Peek -> `/repositories/188` -> Reload: **0 console errors, 0 page errors**.
  - **Prototype Leak Check**: **0** `/prototypes` links, prototype switcher strings, or `backend/app/` paths across all 6 canonical routes.
  - **Responsive Overflow (`scrollWidth <= innerWidth`)**: **PASS** (`overflow: false`) on `/` across `[320, 360, 390, 430, 768, 1024, 1440, 1920]` and across `/news`, `/studio`, `/sync`, `/modules`, `/repositories/1` at `320px`.
  - **Mobile Touch Targets (`320px` Home)**: `109` visible interactive targets checked; `0` undersized icon controls (`smallControlsCount: 0`).
  - **LocalStorage Persistence**: Favorites (`repo-favorites`: `[1]`) persisted after reload (**PASS**); Theme (`theme`: `"dark"`) persisted across `/` -> `/news` navigation (**PASS**).
  - **Animation Smoothness**: `requestAnimationFrame` scroll check averaged **16.66 ms/frame (`60 FPS`)**, max delta `16.8 ms`.

---

## 5. Captured Official Route Screenshots (`docs/design/screenshots/`)

- `home-v1-1440.png` — `/` Desktop `1440×900` Light
- `home-v1-dark.png` — `/` Desktop `1440×900` Dark (obsidian `.vellum-plate-0..4` specimens)
- `home-v1-320.png` — `/` Small Mobile `320×568` Light
- `detail-v1-1440.png` — `/repositories/1` Desktop `1440×900`
- `news-v1-1440.png` — `/news` Desktop `1440×900`
- `studio-v1-1440.png` — `/studio` Desktop `1440×900`
- `sync-v1-1440.png` — `/sync` Desktop `1440×900`
- `modules-v1-1440.png` — `/modules` Desktop `1440×900`
