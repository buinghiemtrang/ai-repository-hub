# Next Task — Resume Plan

**Active Branch:** `redesign/taste-skill`
**Current Phase:** **`P2.2.1 — Stabilization & Release Candidate`** implemented and verified at `/prototypes/2-2-1`; awaiting user acceptance of **Vellum Design System 1.0** before Phase 3/4 production rollout.

## Priority Queue

1. **Review & Accept `P2.2.1` Release Candidate (`/prototypes/2-2-1`) (User Decision Gate)**
   - Compare `/prototypes/2-2-1` against `/prototypes/2-2` and `/prototypes`.
   - Do **not** modify official production pages (`/`, `/news`, `/studio`, `/sync`, `/modules`, `/repositories/[id]`) until the user explicitly approves Vellum Design System 1.0 rollout.

2. **Phase 3 — Finalize Design System (`DESIGN.md` + Production Tokens + Shared UI)**
   - After user acceptance, promote `VELLUM_LIGHT_RC` / `VELLUM_DARK_RC`, `Newsreader` + `Hanken Grotesk` + `JetBrains Mono`, `GuideRenderer`, `RepoThumbnail`, `RepoQuickPeek`, and `NewsDetailDrawer` into production routes cleanly.

3. **Phase 4 — Implement Approved Design Across All Production Pages**
   - Redesign `/`, `/repositories/[id]`, `/news`, `/studio`, `/sync`, `/modules` consistently across desktop, tablet (`768`/`1024`), and mobile (`390`) without removing any existing feature or changing backend/DB/API behavior.
   - Confirm with user before keeping or removing `/prototypes/*` routes after rollout.

4. **Phase 5 — Production Visual & Functional QA**
   - Validate in headless Chrome (`shoot.mjs`, `consistency.mjs`, before/after screenshots, dark/light, loading/empty/error/hover/focus/active states).
   - Run full `npm run typecheck`, `npm run build`, and backend `unittest discover`.

## Definition of Done for Next Milestone (Phase 3/4 Promotion)
- User explicitly approves `P2.1 — Vellum Digital Editorial` (and any feedback tweaks are resolved on `/prototypes/2-1`).
- Production pages match the approved P2.1 design system cleanly across Light/Dark and all 6 viewports with zero regressions.
