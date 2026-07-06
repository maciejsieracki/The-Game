# Kopia dzienna grywalnej ROBOCZEJ (raz na start dnia)
# Master hub: uruchamiaj przy start
#   cd gra
#   .\tools\backup-grywalna-dzien.ps1

$ErrorActionPreference = 'Stop'
$graRoot = Split-Path $PSScriptRoot -Parent
$projRoot = Split-Path $graRoot -Parent
$roboczaRoot = Join-Path $projRoot 'gra-robocza'
$kopiaRoot = Join-Path $projRoot 'gra-robocza-kopia'
$today = Get-Date -Format 'yyyy-MM-dd'
$dest = Join-Path $kopiaRoot "dzien_$today"
$marker = Join-Path $kopiaRoot '.last-backup-date'

if (-not (Test-Path $roboczaRoot)) {
  Write-Host 'SKIP: brak gra-robocza/ - najpierw F publish-robocza-snapshot' -ForegroundColor DarkYellow
  exit 0
}

if ((Test-Path $marker) -and ((Get-Content $marker -Raw).Trim() -eq $today)) {
  Write-Host "OK: kopia dzienna juz istnieje ($today) -> $dest" -ForegroundColor DarkYellow
  exit 0
}

New-Item -ItemType Directory -Force -Path $dest | Out-Null
Copy-Item -Path (Join-Path $roboczaRoot '*') -Destination $dest -Recurse -Force
Set-Content -Path $marker -Value $today -Encoding UTF8

Write-Host "OK KOPIA DZIENNA: $dest" -ForegroundColor Green
$manifestPath = Join-Path $roboczaRoot 'ROBOCZA-MANIFEST.json'
if (Test-Path $manifestPath) {
  $m = Get-Content $manifestPath -Raw | ConvertFrom-Json
  Write-Host ('MD5 robocza: ' + $m.md5)
}
