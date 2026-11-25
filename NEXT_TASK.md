# Next Task — Resume Plan

**Active Branch:** `redesign/taste-skill`
**Current Phase:** Waiting for user's detailed feedback prompt for **P2.1 — Vellum Digital Editorial**.

## Priority Queue

1. **Await & Review P2.1 Feedback Prompt (User Input)**
   - Do not modify official production pages (`/`, `/news`, `/studio`, `/sync`, `/modules`, `/repositories/[id]`) until P2.1 is reviewed and approved by the user.

2. **Build Prototype `P2.1 — Vellum Digital Editorial`**
   - Keep existing `P2` (`/prototypes/2`) untouched for side-by-side comparison.
   - Add `P2.1` as a separate prototype route (e.g., `/prototypes/2-1` and link from `/prototypes`).
   - Address all recorded P2 gaps:
     - Reduce text density across lead, ranked, and archive sections.
     - Add real images, repository thumbnails, brand/tool logos, and crisp icons (reusing `icons.mjs` / GitHub owner avatars / real OG images; never synthetic duplicate title banners).
     - Implement and visually verify refined animations & micro-interactions (`motion.md`, `shoot.mjs`, `consistency.mjs`).
     - Ensure full Vietnamese typography rendering (`Newsreader`, `Hanken Grotesk`, `JetBrains Mono`) and light/dark contrast.

3. **Phase 3 — Finalize Design System (`DESIGN.md` + Tokens + Shared UI)**
   - Lock tokens (colors, spacing, radii, typography, motion) and standardize shared components (`Button`, `Card`, `Input`, `Badge`, `AppShell`, `ThemeToggle`).

4. **Phase 4 — Implement Approved Design Across All Production Pages**
   - Redesign `/`, `/repositories/[id]`, `/news`, `/studio`, `/sync`, `/modules` consistently on desktop, tablet (`768`/`820`), and mobile (`390`) without removing any existing feature or changing backend/DB/API behavior.
   - Remove temporary `/prototypes` routes once production rollout is approved (or confirm with user whether to keep/remove).

5. **Phase 5 — Visual & Functional QA**
   - Validate in headless Chrome (`shoot.mjs`, `consistency.mjs`, before/after screenshots, dark/light, loading/empty/error/hover/focus/active states).
   - Run full `npm run typecheck`, `npm run build`, and backend `unittest discover`.

## Definition of Done for Next Milestone (`P2.1`)
- `P2` (`/prototypes/2`) remains intact and comparable.
- `P2.1` renders live `/api/repositories` and `/api/news/feed` data with balanced visual/text ratio, real imagery/logos/icons/thumbnails, verified smooth micro-interactions, and clean Vietnamese typography in both light and dark modes.
- User explicitly approves `P2.1` before Phase 4 production changes begin.
