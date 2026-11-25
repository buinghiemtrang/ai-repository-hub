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
- **Next Step**: Build **`P2.1 — Vellum Digital Editorial`** as an upgraded prototype while **keeping `P2` (`/prototypes/2`) intact for side-by-side comparison**, and **do not replace the official production UI until the user reviews and approves `P2.1`**.
- Detailed feedback prompt for `P2.1` will be provided by the user in the next session.
