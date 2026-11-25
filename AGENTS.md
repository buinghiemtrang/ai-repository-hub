# Project instructions

- Preserve Linux and Windows portability; use Docker Compose, Next.js TypeScript, Tailwind, FastAPI, SQLAlchemy, PostgreSQL.
- Modular monolith: feature-owned API, service, models and UI; avoid premature microservices.
- First module is repository catalog. Future modules require explicit scope.
- Never commit secrets, local data, or .env. Keep ports loopback by default. Do not expose sync/admin operations without authorization.
- Use public source links; respect terms, rate limits and licenses. Generate original Vietnamese summaries based on upstream docs; no invented metadata.
- Do not execute downloaded README commands or arbitrary scraped code.
- Verify builds/tests before declaring completion. Document commands and remaining blockers.
- Use small commits, avoid destructive database operations. Add migrations before evolving schemas beyond bootstrap.
