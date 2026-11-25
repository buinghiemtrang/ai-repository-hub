# Next Task — Resume Plan

**Active Branch:** `redesign/taste-skill`
**Current Phase:** **`P2.1 — Vellum Digital Editorial`** prototype complete at `/prototypes/2-1`; awaiting user review and approval before Phase 3/4 production rollout.

## Priority Queue

1. **Review & Approve `P2.1` (`/prototypes/2-1`) (User Decision Gate)**
   - Compare `/prototypes/2-1` against `/prototypes/2` (`P2`), `/prototypes/1`, and `/prototypes/3`.
   - Do **not** modify official production pages (`/`, `/news`, `/studio`, `/sync`, `/modules`, `/repositories/[id]`) until the user explicitly approves `P2.1` (or requests targeted adjustments to `P2.1`).

2. **Phase 3 — Finalize Design System (`DESIGN.md` + Production Tokens + Shared UI)**
   - After user approval, promote P2.1 tokens (`VELLUM_LIGHT` / `VELLUM_DARK`, `Newsreader` + `Hanken Grotesk` + `JetBrains Mono`, motion curves) into `frontend/app/globals.css` / `layout.tsx` and standardize shared production components (`Button`, `Card`, `Badge`, `AppShell`, `ThemeToggle`, `RepoThumbnail`, `RepoQuickPeek`).

3. **Phase 4 — Implement Approved Design Across All Production Pages**
   - Redesign `/`, `/repositories/[id]`, `/news`, `/studio`, `/sync`, `/modules` consistently across desktop, tablet (`768`/`1024`), and mobile (`390`) without removing any existing feature or changing backend/DB/API behavior.
   - Confirm with user before keeping or removing `/prototypes/*` routes after rollout.

4. **Phase 5 — Production Visual & Functional QA**
   - Validate in headless Chrome (`shoot.mjs`, `consistency.mjs`, before/after screenshots, dark/light, loading/empty/error/hover/focus/active states).
   - Run full `npm run typecheck`, `npm run build`, and backend `unittest discover`.

## Definition of Done for Next Milestone (Phase 3/4 Promotion)
- User explicitly approves `P2.1 — Vellum Digital Editorial` (and any feedback tweaks are resolved on `/prototypes/2-1`).
- Production pages match the approved P2.1 design system cleanly across Light/Dark and all 6 viewports with zero regressions.
