param(
  [Parameter(Mandatory = $true)][string]$BackupFile,
  [switch]$Yes
)

$ErrorActionPreference = "Stop"

if (-not $Yes) {
  Write-Error "Pass -Yes to confirm restoring $BackupFile into PostgreSQL."
}
if (-not (Test-Path $BackupFile)) {
  Write-Error "Backup file not found: $BackupFile"
}

$dbUser = if ($env:POSTGRES_USER) { $env:POSTGRES_USER } else { "aihub" }
$dbName = if ($env:POSTGRES_DB) { $env:POSTGRES_DB } else { "aihub" }

Get-Content -Raw -Path $BackupFile | docker compose exec -T db psql -U $dbUser -d $dbName -v ON_ERROR_STOP=1
Write-Host "Restored database from $BackupFile"
