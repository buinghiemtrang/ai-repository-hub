#!/usr/bin/env sh
set -eu

if [ "$#" -lt 2 ] || [ "$2" != "--yes" ]; then
  echo "Usage: $0 <backup.sql> --yes"
  exit 1
fi

BACKUP_FILE="$1"
if [ ! -f "$BACKUP_FILE" ]; then
  echo "Backup file not found: $BACKUP_FILE"
  exit 1
fi

DB_USER="${POSTGRES_USER:-aihub}"
DB_NAME="${POSTGRES_DB:-aihub}"

docker compose exec -T db psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 < "$BACKUP_FILE"
echo "Restored database from $BACKUP_FILE"
