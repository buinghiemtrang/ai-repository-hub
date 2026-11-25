# Catalog discovery and import

Before crawling, review site terms and robots.txt. Only proceed if permitted. Run from the project root:

```sh
docker compose exec backend python -m app.repositories.discover --pages 41 --terms-reviewed --output /tmp/discovery.json
docker compose cp backend:/tmp/discovery.json ./discovery.json
```

Inspect all candidates manually. The crawler uses HTML links only; it may miss JavaScript-rendered content or include links to related projects. It records errors and does not certify complete coverage. Use REA/browser inspection where necessary. Never bypass a denial. Do not copy editorial text.

Prepare reviewed JSON array with entries:
```json
[
  {"full_name":"ollama/ollama","category":"Chạy AI cục bộ","description_vi":"Chạy mô hình ngôn ngữ trên máy cá nhân.","source_urls":["https://github.com/ollama/ollama"]}
]
```

Save as reviewed.json. Then:
```sh
docker compose cp ./reviewed.json backend:/tmp/reviewed.json
docker compose exec backend python -m app.repositories.import_catalog /tmp/reviewed.json
```

GitHub API verifies metadata and deduplicates stable IDs. A token may be needed for large imports. Review errors; rerun only after rate limits reset. Source links are stored in PostgreSQL. Generated descriptions should be original and checked against upstream documentation. Do not execute upstream code.
