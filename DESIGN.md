# Design System & Art Direction — AI Repository Hub

## 1. Taste Skill Integration

- **Source**: `https://github.com/Leonxlnx/taste-skill` (`design-taste-frontend`, `tasteskill 2.5.1`).
- **Local Skill Integration**: Installed into `~/.agents/skills/design-taste-frontend/` (`SKILL.md`, `references/`, `library/palettes.json`, `library/type.json`, `scripts/start.mjs`, `scripts/shoot.mjs`, `scripts/consistency.mjs`).
- **Core References Studied**: `SKILL.md`, `system.md`, `layout-v4.md`, `cards.md`, `motion.md`, `backgrounds.md`, `icons.md`, `palettes.json`, `type.json`.

### Anti AI-Slop Rules Adopted
- **90–95% Neutral Surfaces + 1 Intentional Accent**: Eliminate default dark-navy (`#090d16`), radial teal/cyan/purple glow blurs, and decorative gradients. Violet/lavender (`270°–330°`) is prohibited in the interface palette.
- **Maximum 2 Nesting Levels**: Never stack `card > inner box > nested quote/panel`. Separate content via `1px` hairlines (`10–14%` ink) and clear surface contrast steps.
- **No Redundant Synthetic Visuals**: Do not render synthetic gradient placeholder banners repeating `@owner/repo` above the card title. Show real GitHub OG/custom images, avatars, and tool icons where available; use clean typographic/data hierarchy otherwise.
- **Reduced Pill/Badge Clutter**: Reserve chips/pills strictly for active filters or high-signal status; avoid 4–6 colored pills per card.
- **Purposeful Micro-interactions (`motion.md`)**: Crisp transitions (`120–180ms`, `cubic-bezier(0.2, 0.8, 0.2, 1)`), subtle `2px` lift only on linked interactive surfaces, instant focus rings, full `prefers-reduced-motion` support.

### Application Workspace Adaptation (Taste Skill vs. Workspace UX)
Taste Skill defaults to company marketing sites (`100svh` per section, max 1 section per viewport). Because AI Repo Hub is a **daily productivity workspace**:
- **Adapted**: Continuous scannable lists, persistent filter/search toolbars, split/multi-column workspace density, and fixed bottom audio/podcast controls are preserved for daily usability.
- **Enforced Strictly**: Neutral color discipline, typographic hierarchy, 2-level nesting cap, real icons/imagery over decorative placeholders, contrast ratios, and browser QA across `1440`, `1024`, `768`, and `390`.

### Vietnamese Typography Verification
Verified against Next.js `google/font-data.json` (`vietnamese` subset required):
- **Approved**: `Geist`, `Geist Mono`, `Newsreader`, `Hanken Grotesk`, `Bricolage Grotesque`, `IBM Plex Sans`, `IBM Plex Mono`, `JetBrains Mono`, `Manrope`, `Be Vietnam Pro`.
- **Rejected**: `Instrument Sans`, `Instrument Serif`, `Onest` (lack `vietnamese` subset in Google Fonts metadata).

---

## 2. Phase 1 Audit Summary (Current Production UI)

Screenshots captured via `shoot.mjs` in headless Chrome (`docs/design/screenshots/`):
- `home-1440.png`, `home-1440-dark.png`, `home-390.png` — `/`
- `news-1440.png` — `/news`
- `studio-1440.png` — `/studio`
- `detail-1440.png` — `/repositories/1`

Key defects identified:
1. **AppShell**: Top bar duplicates sidebar links; sidebar bottom promo box is decorative; `#090d16` + radial teal glow reads as generic AI template.
2. **Repository Library**: 12 uniform `rounded-2xl` cards; synthetic 2:1 banner duplicates `@owner/repo` and consumes ~40% of card height; category strip truncates (`Lập...`).
3. **AI News**: `8,377px` tall feed with 4–6 pills per card (including violet `#7c3aed`), 3-level nested boxes, and synthetic 2:1 repo banners.
4. **AI Studio**: Generic dark-gradient hero with glow orb and 8 uniform SaaS-template cards.

---

## 3. Phase 2 Art Directions & Prototypes (`/prototypes`)

Three interactive prototypes using live `/api/repositories` and `/api/news/feed` data (`docs/design/screenshots/proto1-1440.png`, `proto2-1440.png`, `proto3-1440.png`):

| Prototype | Concept | Layout & Nav | Typography | Palette (Light / Dark) |
|---|---|---|---|---|
| **P1 · Obsidian Ledger** (`/prototypes/1`) | Precision engineering workspace (Linear/Vercel) | `48px` command bar + `52px` icon rail + split-pane ledger & live inspector | `Geist` + `Geist Mono` | Dark `#0C0C0D` / Light `#FAFAFA` · Cobalt `#3B82F6` |
| **P2 · Vellum Editorial** (`/prototypes/2`) | Curated tech magazine (The Verge/Are.na) | Editorial top masthead (no left sidebar) + asymmetric `7/5` spotlight/ranked index + `1px` archive grid | `Newsreader` + `Hanken Grotesk` + `JetBrains Mono` | Light `#F4F1EA` / Dark `#141210` · Vermilion `#B93815` |
| **P3 · Atelier Canvas** (`/prototypes/3`) | Modular tactile studio (Raycast/Teenage Eng.) | `44px` ribbon + `228px` filter rail + architectural `1px` bento grid | `Bricolage Grotesque` + `IBM Plex Sans` + `IBM Plex Mono` | Light `#EEEFF1` / Dark `#18191B` · Safety Orange `#E8481C` |

---

## 4. Current Design Decision & Next Target (`P2.1`)

- **Approved Baseline**: User selected **P2 — Vellum Editorial** as the design foundation.
- **Known Gaps in P2 (to fix before production rollout)**:
  1. Too text-heavy across lead/ranked/archive blocks.
  2. Lacks real visual richness: images, logos, brand/tool icons, and repository thumbnails.
  3. Animation and micro-interaction quality has not yet been refined or verified in browser QA.
  4. Duplicate `@owner/repo` block when a repo lacks a custom OG image (`proto2-1440.png`).
- **Status**: **Vellum Design System 1.0** is officially approved and rolled out across all canonical production routes (`/`, `/repositories/[id]`, `/news`, `/studio`, `/sync`, `/modules`). Historical prototypes (`/prototypes`, `/prototypes/1`, `/2`, `/2-1`, `/2-2`, `/2-2-1`, `/3`) are preserved as internal archive without prototype switcher chrome in official UI.

---

## 8. Vellum Design System 1.0 — Official Production Rollout

1. **Authoritative CSS Custom Properties (`frontend/app/globals.css`, `frontend/components/prototypes/vellum/tokens.ts`)**:
   - Production UI consumes CSS custom properties under `:root` (`--v-bg: #f5f2eb`, `--v-surface: #fbf9f4`, `--v-surface-alt: #eae5d9`, `--v-ink: #171614`, `--v-muted: #57534b`, `--v-accent: #c03a17`, `--v-accent-soft: rgba(192, 58, 23, 0.09)`, `--v-accent-ink: #ffffff`) and `.dark` (`--v-bg: #131110`, `--v-surface: #1b1917`, `--v-surface-alt: #25221f`, `--v-ink: #f4f0e8`, `--v-muted: #b8b0a4`, `--v-accent: #ec7650`, `--v-accent-soft: rgba(236, 118, 80, 0.18)`, `--v-accent-ink: #131110`).
   - `.vellum-plate-0`..`4` provide CSS-adaptive Light & Dark specimen plate palettes without SSR hydration mismatch.
2. **Global Typography & Assets (`frontend/app/layout.tsx`, `next.config.ts`, `app/icon.svg`)**:
   - Official routes load only `Hanken Grotesk`, `Newsreader`, and `JetBrains Mono` (`subsets: ["latin", "vietnamese"]`); `P1`/`P3` prototype fonts (`Geist`, `Bricolage Grotesque`, `IBM Plex`) are isolated in `app/prototypes/1/layout.tsx` & `app/prototypes/3/layout.tsx`.
   - Allowlisted GitHub image hosts use Next.js `<Image>` + `sharp` (`AVIF`/`WebP`, `86400s` cache TTL).
3. **Production Route & Shell Migration**:
   - `AppShell.tsx`: Official Vellum top navigation (`Thư viện Repo`, `Tạp chí Tin`, `Xưởng AI`, `Công cụ AI`, `Hệ thống`), `/` keyboard shortcut, live Favorites counter (`repo-favorites`), `ThemeToggle`, mobile drawer, and clean footer. Zero `/prototypes` links or comparison banners.
   - Official pages migrated & verified: `/`, `/repositories/[id]`, `/news` (`NewsFeedWorkspace` + `NewsAudioPlayer` + `NewsDetailDrawer22` + `RepoQuickPeek22`), `/studio` (`VellumStudioWorkspace`), `/sync`, `/modules`. Detailed metrics & QA evidence live in [docs/design/VELLUM_1_0_MIGRATION_REPORT.md](docs/design/VELLUM_1_0_MIGRATION_REPORT.md).

## 5. P2.1 → P2.2 → P2.2.1 — Vellum Digital Editorial Design System

> **Status Distinction**: `P2.2` (`/prototypes/2-2`) is preserved as the baseline reference; `P2.2.1` (`/prototypes/2-2-1`) is the stabilized Release Candidate with React #310 fix, WCAG 2.2 AA dark contrast tokens (`VELLUM_DARK_RC`), 44px mobile touch targets, safe shared Markdown Folio rendering, and verified News count labels.

### 5.1 Brand & Visual Language
- **Identity**: Bespoke geometric architectural press mark SVG (`VellumHeader.tsx`) paired with editorial wordmark **AI Repo Hub** (`Vellum Digital · P2.1`).
- **Aesthetic**: Warm paper & carbon ink (*Vellum Digital Editorial*), crisp `1px` rules (`4px`–`6px` radii), tabular numbers, high visual clarity without gradients, glassmorphism glow, or generic card clutter.

### 5.2 Color Tokens (`frontend/components/prototypes/vellum/tokens.ts`)
- **Light (`VELLUM_LIGHT`)**: Paper canvas `#F7F4ED`, Elevated surface `#FDFBF6`, Sunken surface `#F0ECE1`, Carbon ink `#1B1917`, Muted ink `#6B655D`, Hairline rule `rgba(27, 25, 23, 0.11)`, Strong rule `rgba(27, 25, 23, 0.20)`, Editorial vermilion accent `#C84B24` (`#FFFFFF` on accent), Soft accent `rgba(200, 75, 36, 0.10)`.
- **Dark (`VELLUM_DARK`)**: Obsidian canvas `#131110`, Elevated surface `#1A1816`, Sunken surface `#221F1D`, Warm ivory ink `#F3EFE7`, Muted ink `#A8A095`, Hairline rule `rgba(243, 239, 231, 0.11)`, Strong rule `rgba(243, 239, 231, 0.22)`, Warm terracotta accent `#EA6B3F` (`#131110` on accent), Soft accent `rgba(234, 107, 63, 0.14)`.
- **Theme Scoping**: In P2.1 prototype, theme tokens are driven by React state; CSS media queries (`dark:*`) that do not inspect state must use explicit `theme` / `dark` inline styles (verified on `RepoThumbnail` corner stamp).

### 5.3 Typography (Verified `vietnamese` Subset)
- **Editorial Headings**: `Newsreader` (`--font-newsreader`) for page titles, Spotlight/Cover headlines, and specimen headers.
- **Interface & Vietnamese Body**: `Hanken Grotesk` (`--font-hanken`) across filters, metadata, cards, and navigation.
- **Mono & Metrics**: `JetBrains Mono` (`--font-jetbrains`) + `tabular-nums` for `PLATE · #index`, stars, forks, shortcut keys (`/`), and view switchers.

### 5.4 Layout, Grids & Spacing
- **Shell**: `max-w-7xl` centered container (`px-4 sm:px-6`), sticky `64px` top header with `← So sánh` (`xl+`), wordmark, primary nav (`Thư viện Repo`, `Tạp chí Tin`, `Xưởng AI`, `Công cụ AI` dropdown), Search trigger, Favorites counter, `P1 | P2 | P2.1 | P3` switcher, Dark toggle, and mobile drawer (`lg:hidden`).
- **Library View**:
  1. **Featured Spotlight** (`01`–`04` selector, real OG / specimen preview, description, CTA `Xem nhanh hướng dẫn` + `GitHub`).
  2. **2-column Editorial Split**: `Bộ sưu tập biên tập` (4 curated quick-filters with real DB category counts) + `Nổi bật theo GitHub Stars` (top 5 catalog repos labeled honestly by real GitHub Stars — no invented weekly delta metrics).
  3. **Command Bar**: `/`-shortcut search, language selector, sort selector, `Lưới` ↔ `Danh sách` view toggle, and category filter bar.
  4. **Catalog Views**: 3-column specimen card grid (`md:grid-cols-2 lg:grid-cols-3`) + Compact List mode, with pagination (`12` items/page).
- **News View (`Tạp chí Tin`)**: Masthead + Podcast/TTS voice controls (`speechSynthesis`), Cover Story + Right Dispatch Rail, 2-column magazine cards (`news_items` with real `image_url` or crisp source/topic plate), and weekly/daily digest archive.
- **Studio View (`Xưởng AI`)**: Interactive 4-tool workbench preview (`Image & POD`, `Video AI`, `Voiceover & Podcast`, `Flows & Automation`) + 8-tool directory (`ComfyUI`, `Midjourney`, `Dify`, `ElevenLabs`, `MCP`, `Claude Code`, `Langfuse`, `Ollama`) backed by real SVGs, marking `Demo UI` / `Sắp tới` transparently.

### 5.5 6-Tier Visual Hierarchy & Real Assets (`RepoThumbnail.tsx`, `VellumIcons.tsx`)
- **46 Real Brand & Language SVGs**: Installed via `icons.mjs` (CC0/MIT) into `frontend/public/icons/` with license inventory at `frontend/public/icons/icons-credits.json`.
- **Thumbnail Resolution**:
  1. When `repo.has_custom_image && repo.image_url` loads cleanly: render real image inside `aspect-[16/10]` frame with `object-contain` (prevents wide wordmark cropping such as `n8n-io/n8n`) + bottom corner stamp showing GitHub `owner_avatar_url` and matched brand SVG.
  2. Fallback when no custom image (or broken): render **5-variant Vellum Specimen Plate** pairing real GitHub owner avatar (`owner_avatar_url`) + resolved brand SVG (`resolveBrandIcon`) + language SVG badge (`resolveLanguageIcon`) + plate index + clean architectural geometry. Zero duplicate text banner boxes.

### 5.6 Motion System & Signature Interaction (`motion@14.14.0`)
- **Timing Curve**: `VELLUM_EASE = [0.22, 1, 0.36, 1]` with `MotionConfig reducedMotion="user"`.
- **Shared-Element Transitions**: `layoutId="vellum-nav-underline"` on top nav tabs and `layoutId="vellum-view-pill"` on Grid ↔ List segmented toggle.
- **Signature Interaction — Specimen Folio Quick-Peek (`RepoQuickPeek.tsx`)**: Slide-over right folio drawer (`AnimatePresence`) fetching full `/api/repositories/{id}` README guide & metadata in place, with `Esc` to close and `←` / `→` keyboard stepping across catalog items.

### 5.7 Verified Responsive & Visual QA Checklist
- Headless Chrome CDP verified on `/prototypes/2-1` across `1920`, `1440`, `1280`, `1024`, `768`, `390` viewports: `0` horizontal overflow, `70/70` loaded images (`broken: 0`), `0` console errors, verified Vietnamese webfont stack (`Newsreader`, `Hanken Grotesk`, `JetBrains Mono`), Light + Dark modes, List toggle, Search, Quick-Peek Folio, News, Studio, and `prefers-reduced-motion: reduce`.
- Screenshots stored under `docs/design/screenshots/p2-1-*.png`.

## 6. P2.2 — Vellum Digital Polish Enhancements (Merged into Vellum 1.0)

1. **News Category Counts & Accurate Icons (`VellumNewsView22.tsx`, `VellumIcons22.tsx`)**:
   - Single-request feed aggregation (`days_limit=90`) plus backward-compatible `section_counts` / `all_count` on backend `/news/feed` and `/news/items` (`GROUP BY NewsItem.section` ignoring active `section` filter and pagination).
   - Live count displayed in compact `tabular-nums` mono beside every category (`Tất cả chuyên mục` + 9 sections, including `0`-count sections gracefully), updating immediately on date or search query change and deduplicated via `Set<string>`.
   - Replaced erroneous `github.svg` fallback on non-GitHub categories with exact brand SVGs (`Claude`, `Grok`, `ChatGPT/OpenAI`, `Gemini`) + crisp backing badge when selected on terracotta `#C84B24`, and semantic Lucide icons (`FolderGit2`, `ShieldAlert`, `Users`, `BookMarked`, `Sparkles`).
2. **Library Above-the-Fold & Visual De-duplication (`VellumLibraryView22.tsx`, `RepoThumbnail22.tsx`)**:
   - Paired compact Featured Spotlight (`8 cols`, `231px` height) beside Top 5 GitHub Stars (`4 cols`) + slim 4-col Collections row (`~54px`), lifting first Repo Grid card row from `1030px` (P2.1) to **`562px` (P2.2)** — visible above the fold at `1440×900`.
   - Removed redundant language pills and brand text duplicates from `RepoThumbnail22` and List rows.
3. **AI News Cover Selection & Detail Reader (`NewsDetailDrawer22.tsx`)**:
   - Prioritizes high-signal non-Repo AI news (`Tin quan trọng` / `picked`) for front-page Cover Story when viewing `Tất cả chuyên mục`.
   - Added full pagination across News cards and interactive slide-over **AI News Detail** drawer with image preview, sources, tags, TTS speech, and direct `Mở Repo Folio` jump.
4. **AI Studio Workbench Clarity (`VellumStudioView22.tsx`)**:
   - Removed internal source file path (`backend/app/...`) from user UI; added inline SVG Workflow Architecture diagram, interactive clickable Stages `01`–`03`, explicit `Prototype UI · Sắp mở` labels, and in-prototype Library deep-linking.
5. **Motion & Signature Folio Upgrade (`RepoQuickPeek22.tsx`)**:
   - Restores focus to clicked trigger on close, moves focus inside `[role="dialog"]` on open, traps `Tab`/`Shift+Tab`, supports `←` / `→` / `Esc`, adds image scale settle reveal, `Copy URL` feedback, structured README section cards, and eliminates filter/search card stagger jitter.

## 7. P2.2.1 — Stabilization & Release Candidate Upgrades (`/prototypes/2-2-1`)

1. **P0 — React Error #310 Root Cause & Fix (`frontend/components/AppShell.tsx`)**:
   - **Root Cause**: `AppShell` returned early (`if (pathname.startsWith("/prototypes")) return <>{children}</>;`) before `useState`/`useEffect` hooks. Soft client navigation (`<Link href="/repositories/1">`) from a prototype caused `AppShell` to invoke more hooks on re-render, triggering minified React Error #310.
   - **Fix**: Moved all `useState` and `useEffect` calls unconditionally above the `/prototypes` early return. Verified across `/repositories/1`, `/repositories/188`, Browser Back/Forward, Reload, Grid/List/Spotlight, Desktop & Mobile.
2. **P0 — News Category Counts Database Verification**:
   - Confirmed PostgreSQL live counts (`98` total items across `13` days, `25/11: 16`, `24/11: 23`, zero duplicate `external_id`) match UI category pills `1:1` across date & search filters with `1` initial `/api/news/feed?days_limit=90` request (`0` extra requests per filter).
3. **P1 — Three-Part News Result Label (`VellumNewsView22.tsx` `rc`)**:
   - Distinguishes displayed category results (`filteredItems.length`), date+search matches (`categoryStats.allCount`), and full selected-day/archive count (`scopedTotalCount`), e.g. `1 kết quả (Claude) · 16 tin trong ngày 25/11/2026`.
4. **P1 — Mobile Touch Targets (`44 × 44 CSS px` at `<640px`)**:
   - Applied responsive `min-h-11` / `size-11 sm:size-8` hitboxes on mobile controls (`VellumHeader22`, `VellumLibraryView22`, `VellumNewsView22`, `RepoQuickPeek22`, `NewsDetailDrawer22`, `VellumStudioView22`) and verified at `320px`, `390px`, `430px`, `768px`, `1024px`, `1920px` with zero horizontal overflow.
5. **P1 — Shared Safe Markdown Renderer (`GuideRenderer.tsx`)**:
   - Extended shared `GuideRenderer` (no `dangerouslySetInnerHTML`, strict `http:`/`https:`/`mailto:` allowlist) to support `#/##/###`, unordered & ordered lists, Markdown tables, blockquotes, inline code/bold/italic/links/autolinks, monospace fenced code blocks with Copy button, and `vellum-light`/`vellum-dark` variants reused inside `RepoQuickPeek22`.
6. **P1 — WCAG 2.2 AA Contrast Tokens (`tokens.ts` `VELLUM_DARK_RC` / `VELLUM_LIGHT_RC`)**:
   - Upgraded `VELLUM_DARK_RC.muted` to `#B8B0A4` (`7.27:1+` on `#25221F`, `8.05:1` on `#1B1917`), `#EC7650` accent with `#131110` ink (`5.85:1+`), high-contrast placeholder text, and replaced dimmed opacity on `0`-count chips with dashed full-opacity borders.
