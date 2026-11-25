#!/usr/bin/env sh
set -eu

mkdir -p backups
STAMP=$(date +%Y%m%d_%H%M%S)
OUT="backups/aihub_${STAMP}.sql"
DB_USER="${POSTGRES_USER:-aihub}"
DB_NAME="${POSTGRES_DB:-aihub}"

docker compose exec -T db pg_dump -U "$DB_USER" -d "$DB_NAME" --clean --if-exists > "$OUT"
echo "Backup saved to $OUT"
