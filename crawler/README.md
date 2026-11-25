# Catalog discovery and import

Before crawling, review site `robots.txt` and terms. Only proceed if permitted. Run from the project root:

```sh
docker compose exec backend python -m app.repositories.discover --delay 2 --terms-reviewed --output /tmp/discovery.json
docker compose cp backend:/tmp/discovery.json ./discovery.json
```

Notes:
- `discover.py` respects `robots.txt`, enforces `delay >= 2` seconds, does not follow redirects, parses expected totals dynamically from the public listing, extracts canonical GitHub URLs from both anchor tags and serialized Next.js RSC payloads, and deduplicates candidates.
- Do not copy editorial text or guide HTML from third-party catalogs.

Prepare a reviewed JSON array with original Vietnamese descriptions based on upstream docs:
```json
[
  {
    "full_name": "ollama/ollama",
    "category": "Chạy AI cục bộ",
    "description_vi": "Chạy mô hình ngôn ngữ trên máy cá nhân.",
    "source_urls": ["https://github.com/ollama/ollama"]
  }
]
```

Save as `reviewed.json` (do not commit raw crawl dumps or local manifests unless reviewed). Then import via GitHub API validation:
```sh
docker compose cp ./reviewed.json backend:/tmp/reviewed.json
docker compose exec backend python -m app.repositories.import_catalog /tmp/reviewed.json
```

`import_catalog.py` validates each repository against GitHub API, deduplicates by stable `github_id` and `full_name`, fetches upstream metadata & README markdown, and builds original Vietnamese reference guides without executing upstream code.
