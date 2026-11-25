# AI Repo Hub — Vellum Design System 1.0 & Full Website Migration

(Saved full request verbatim for project handover; see conversation user message dated 2026-11-25T17:25:32+07:00.)

## Approved Decision Summary
- Official Design System: **Vellum Design System 1.0** (based on `P2.2.1` at `/prototypes/2-2-1`).
- Design Freeze applied: no new art directions or P2.3/P2.2.2 prototypes.
- Pre-migration P0/P1 blockers required before canonical rollout:
  1. `320px` horizontal overflow across Library, News, Studio, Header.
  2. Mobile touch targets (clickable article headlines, Folio Copy Code button >= 44px on mobile).
  3. Image performance optimization (~847 KiB featured image & initial payload ~2.1 MiB).
  4. Font performance optimization (~524 KiB font payload -> target ~100–200 KiB with full Vietnamese glyphs preserved).
  5. ESLint CLI (`npm run lint`) & verification of remaining DB/API checks.
- Full migration scope: `/`, `/repositories/[id]`, `/news`, `/studio`, `/sync`, `/modules` + all existing functionality, favorites, theme preferences, and deep links preserved; prototype controls removed from official UI.
