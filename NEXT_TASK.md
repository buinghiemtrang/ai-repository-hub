# Next Task — Resume Plan

**Active Branch:** `redesign/taste-skill` (pushed & synchronized with GitHub; rollback tag/branch at `checkpoint/p2-2-1-baseline`)  
**Current Phase:** **UI/UX Redesign Milestone Complete — Vellum Design System 1.0** live across all official routes (`/`, `/repositories/[id]`, `/news`, `/studio`, `/sync`, `/modules`).

## Priority Queue

1. **User Review of Official Production UI & Branch Merge Approval**
   - Review the live Vellum Design System 1.0 production site (`http://localhost:3000`) and [docs/design/VELLUM_1_0_MIGRATION_REPORT.md](docs/design/VELLUM_1_0_MIGRATION_REPORT.md).
   - Confirm whether to merge `redesign/taste-skill` -> `main` (and whether `/prototypes/*` historical archive routes should remain accessible by direct URL or be pruned later).

2. **Phase 2 Functional Roadmap (Requires Explicit User Scope Approval First)**
   - **Priority A — AI Studio Core** (`video_studio`, `image_studio`, `voice_studio`): Agree on supported external/local provider APIs, async job queue semantics, artifact storage limits, and `.env` credential contracts before implementing backend slices.
   - **Priority B — MCP Registry, AI Skills & Models / Workflows** (`mcp`, `ai_skills`, `models`, `workflows`): Approve DB migrations and read/write admin guards under `docs/MODULE_CONTRACTS.md`.

## Definition of Done for Next Milestone
- User explicitly approves merging `redesign/taste-skill` -> `main` and/or specifies exact scope for the next feature slice in `/studio` or `/modules`.
- All new features preserve Modular Monolith isolation, Linux/Windows Docker Compose portability, backend `unittest discover` coverage, and Vellum Design System 1.0 UI consistency.
