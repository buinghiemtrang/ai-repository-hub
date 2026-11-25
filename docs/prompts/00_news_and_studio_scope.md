# Scope Summary: Independent News Module & Extensible AI Studio

Agreed scope from session `2026-11-25`:
- Add a single compact `Tin tức` menu item in the workspace navigation (`AppShell.tsx`), avoiding nested sub-menu clutter.
- Inside `/news`, include a dedicated `Repo` category (linking to catalog `repositories`) alongside AI/security/community categories (`Claude`, `Grok`, `ChatGPT / OpenAI`, `Gemini`, `Bảo mật & An ninh mạng`, `Cộng đồng AI Việt Nam`, `Bài hay trong nhóm`, `Ứng dụng thực tế`).
- Build data ingestion completely independently using public RSS/Atom/JSON feeds + local `repositories` catalog (never call external LAN servers).
- Include search (Vietnamese accent-insensitive + keyword highlight), daily sidebar, weekly digest, 7-day timeline, hero spotlight, expandable detail text, lightbox, lazy video player, and browser TTS Podcast player (`speechSynthesis`).
- Omit community reaction, comment, and submission features.
- Reorganize global layout into a collapsible workspace shell with `/studio` launcher slots ready for future AI tools (Video AI, Image & POD, Flows, MCP & Skills) inspired by modular AI tool platforms.
