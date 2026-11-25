$ErrorActionPreference = "Stop"

New-Item -ItemType Directory -Force -Path "backups" | Out-Null
$stamp = Get-Date -Format "yyyyMMdd_HHmmss"
$out = "backups/aihub_$stamp.sql"
$dbUser = if ($env:POSTGRES_USER) { $env:POSTGRES_USER } else { "aihub" }
$dbName = if ($env:POSTGRES_DB) { $env:POSTGRES_DB } else { "aihub" }

docker compose exec -T db pg_dump -U $dbUser -d $dbName --clean --if-exists | Out-File -FilePath $out -Encoding utf8
Write-Host "Backup saved to $out"
