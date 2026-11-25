# Verification Report — P2.2.1 Stabilization & Release Candidate

**Date:** 2026-11-25  
**Branch:** `redesign/taste-skill`  
**Target URL:** `http://localhost:3000/prototypes/2-2-1` (Baseline: `/prototypes/2-2`)  
**Environment:** Docker Compose (`next build` production bundle + FastAPI + PostgreSQL 16), Google Chrome Headless CDP (`1920×1080`, `1440×900`, `1024×768`, `768×1024`, `430×932`, `390×844`, `320×568`), unthrottled localhost.

## 1. P0 — React Error #310 Root Cause & Fix Verification
- **Reproduced On Pre-Fix `/prototypes/2-2`**: Clicking `Chi tiết đầy đủ` inside Folio opened `/repositories/1` via client navigation and threw `Minified React error #310` in component chunk corresponding to `AppShell` (`frontend/components/AppShell.tsx`), displaying `"This page couldn’t load"`.
- **Root Cause**: `frontend/components/AppShell.tsx` had an early return (`if (pathname.startsWith("/prototypes")) return <>{children}</>;`) placed **before** `useState(false)`, `useState(false)`, and two `useEffect` hooks. Soft Next.js `<Link>` navigation from `/prototypes/*` to `/repositories/[id]` caused `AppShell` to execute 4 extra hooks on re-render.
- **Fix**: Moved all hooks unconditionally above the `/prototypes` early return.
- **Verified Flows Post-Rebuild (`runtimeErrors: []`, `consoleErrors: []`)**:
  - Folio (`/prototypes/2-2-1`) → `Chi tiết đầy đủ` → `/repositories/1` (`openclaw/openclaw`) → PASS
  - Browser `history.back()` → `/prototypes/2-2-1` → PASS
  - Spotlight Folio → `Chi tiết đầy đủ` → `/repositories/188` (`deepseek-ai/deepseek-harness`) → PASS
  - Direct reload `/repositories/188` → PASS
  - List View → Folio → Detail `/repositories/188` → PASS

## 2. P0 — News Category Counts vs PostgreSQL
Verified directly against `news_days` and `news_items` in PostgreSQL:
- `news_days = 13`, `news_items = 98` (`distinct external_id = 98`, 0 duplicates).
- Full archive: `Repo: 28`, `ChatGPT / OpenAI: 23`, `Gemini: 17`, `Bảo mật & An ninh mạng: 13`, `Claude: 9`, `Ứng dụng thực tế: 5`, `Cộng đồng AI Việt Nam: 1`, `Bài hay trong nhóm: 1`, `Grok: 1` (sum = `98`).
- `2026-11-25`: sum = `16` (`Repo: 8, Bảo mật: 3, Claude: 1, Grok: 1, ChatGPT: 1, Gemini: 1, Ứng dụng: 1`).
- `2026-11-24`: sum = `23` (`Repo: 4, Claude: 2, ChatGPT: 7, Bảo mật: 5, Gemini: 2, Cộng đồng: 1, Bài hay: 1, Ứng dụng: 1`).
- Network requests on News load + category/date/search filters: **1** request (`/api/news/feed?days_limit=90`), `0` additional category requests.

## 3. P1 — UX, Touch Targets, Markdown & Dark Contrast
- **News Result Count Label**: Confirmed `1 kết quả (Claude) · 16 tin trong ngày 25/11/2026` and `2 kết quả (Claude) · 2 khớp từ khóa · 23 tin trong ngày 24/11/2026`.
- **Mobile Touch Targets (`390px` & `320px`)**: `favBtn` (`44×44`), `darkBtn` (`44×44`), `menuBtn` (`44×44`), `spotlightTab01` (`44×44`), `searchInput` (`h=44`), `catAll` (`h=44`), `cardHeart` (`h=44`), `cardFolio` (`h=44`). Zero horizontal overflow across `320`–`1920px`.
- **Safe Markdown Folio (`GuideRenderer`)**: Repo #1 verified `3` fenced code blocks with Copy button, `8` list items, `5` safe links (`rel="noopener noreferrer"`), `0` raw ```` ``` ```` leaks, zero `dangerouslySetInnerHTML`.
- **Dark Mode Contrast (`VELLUM_DARK_RC`)**: `muted = #B8B0A4` on `#1B1917` (`8.05:1`), on `#25221F` (`7.27:1`), `accentInk = #131110` on `#EC7650` (`6.46:1+`), empty `0`-count chips keep `opacity: 1` dashed borders.

## 4. Motion, FPS & Localhost Performance (Lab Only)
- **Folio open animation (`requestAnimationFrame` sample)**: `33 frames` in `550ms`, **`60 fps`**, max frame delta `17ms`; `prefers-reduced-motion: reduce` respected (`MotionConfig reducedMotion="user"`).
- **Localhost Production Build (`1440×900`, unthrottled)**:
  - Cold cache: `LCP = 688ms`, `CLS = 0`, `FCP = 204ms`, `domContentLoaded = 92ms`, `resources = 92`.
  - Warm cache: `LCP = 116ms`, `CLS = 0`, `FCP = 60ms`.
  - *Note*: `INP` requires real user event telemetry (RUM p75); lab runs on localhost cannot claim real-world p75 CWV attainment.

## 5. Regression & Build Checks
- `cd frontend && npm run typecheck`: exit `0`.
- `cd frontend && npm run build`: exit `0` (`14/14` routes).
- `backend unittest discover -s tests -v`: `15/15` tests passed.
- HTTP status check across `/`, `/news`, `/studio`, `/sync`, `/modules`, `/prototypes`, `/prototypes/1`, `/prototypes/2`, `/prototypes/2-1`, `/prototypes/2-2`, `/prototypes/2-2-1`, `/prototypes/3`: all `200 OK`.
