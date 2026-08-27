# Retencja kopii (D3A) — domyślnie DRY-RUN. Wykonanie: -Execute
param(
  [switch]$Execute,
  [int]$KanonArchiwumKeep = 5,
  [int]$BackupHtmlKeep = 3,
  [int]$RoboczaKopiaDaysKeep = 7
)

$ErrorActionPreference = 'Stop'
$projRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$mode = if ($Execute) { 'EXECUTE' } else { 'DRY-RUN' }
Write-Host "=== cleanup-retention ($mode) ===" -ForegroundColor Cyan
Write-Host "Projekt: $projRoot"

$toDelete = @()

# 1) gra-kanon-archiwum — zostaw N najnowszych
$archRoot = Join-Path $projRoot 'gra-kanon-archiwum'
if (Test-Path $archRoot) {
  $snaps = Get-ChildItem $archRoot -Directory | Sort-Object Name -Descending
  $drop = @($snaps | Select-Object -Skip $KanonArchiwumKeep)
  foreach ($d in $drop) { $toDelete += $d.FullName }
  Write-Host "Archiwum kanonu: $($snaps.Count) snapshotów, zostaw $KanonArchiwumKeep, usun $($drop.Count)" -ForegroundColor Yellow
}

# 2) _backup — zostaw N najnowszych Gra-podglad.html.bak-*
$backupRoot = Join-Path $projRoot '_backup'
if (Test-Path $backupRoot) {
  $bakHtml = Get-ChildItem $backupRoot -File -Filter 'Gra-podglad.html.bak-*' | Sort-Object Name -Descending
  $dropBak = @($bakHtml | Select-Object -Skip $BackupHtmlKeep)
  foreach ($f in $dropBak) { $toDelete += $f.FullName }
  Write-Host "_backup Gra-podglad: $($bakHtml.Count) plików, zostaw $BackupHtmlKeep, usun $($dropBak.Count)" -ForegroundColor Yellow
}

# 3) gra/_backup — to samo
$graBackup = Join-Path $projRoot 'gra\_backup'
if (Test-Path $graBackup) {
  $bakGra = Get-ChildItem $graBackup -File -Filter '*.bak*' -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending
  $byBase = @{}
  foreach ($f in $bakGra) {
    $base = ($f.Name -replace '\.bak.*$', '')
    if (-not $byBase.ContainsKey($base)) { $byBase[$base] = @() }
    $byBase[$base] += $f
  }
  foreach ($base in $byBase.Keys) {
    $group = $byBase[$base] | Sort-Object LastWriteTime -Descending
    foreach ($f in ($group | Select-Object -Skip 1)) { $toDelete += $f.FullName }
  }
}

# 4) gra/src i reszta — 1 najnowszy .bak* per plik źródłowy
Get-ChildItem $projRoot -Recurse -File -Filter '*.bak*' -ErrorAction SilentlyContinue |
  Where-Object { $_.FullName -notmatch '\\node_modules\\' -and $_.FullName -notmatch '\\gra-kanon-archiwum\\' } |
  ForEach-Object {
    $dir = $_.DirectoryName
    $prefix = ($_.Name -split '\.bak')[0]
    if (-not $script:seenBakGroups) { $script:seenBakGroups = @{} }
    $key = "$dir|$prefix"
    if (-not $script:seenBakGroups.ContainsKey($key)) {
      $script:seenBakGroups[$key] = Get-ChildItem $dir -File -Filter "$prefix.bak*" | Sort-Object LastWriteTime -Descending
    }
  }
foreach ($key in $script:seenBakGroups.Keys) {
  $group = $script:seenBakGroups[$key]
  foreach ($f in ($group | Select-Object -Skip 1)) {
    if ($toDelete -notcontains $f.FullName) { $toDelete += $f.FullName }
  }
}

# 5) gra-robocza-kopia — zostaw N ostatnich dni
$kopiaRoot = Join-Path $projRoot 'gra-robocza-kopia'
if (Test-Path $kopiaRoot) {
  $days = Get-ChildItem $kopiaRoot -Directory -Filter 'dzien_*' | Sort-Object Name -Descending
  $dropDays = @($days | Select-Object -Skip $RoboczaKopiaDaysKeep)
  foreach ($d in $dropDays) { $toDelete += $d.FullName }
  Write-Host "gra-robocza-kopia: $($days.Count) dni, zostaw $RoboczaKopiaDaysKeep" -ForegroundColor Yellow
}

$unique = $toDelete | Select-Object -Unique
$totalMb = 0
foreach ($p in $unique) {
  if (Test-Path $p) {
    if ((Get-Item $p) -is [IO.DirectoryInfo]) {
      $sz = (Get-ChildItem $p -Recurse -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
    } else { $sz = (Get-Item $p).Length }
    $totalMb += $sz
  }
}
Write-Host "Do usuniecia: $($unique.Count) elementow, ~$([math]::Round($totalMb/1MB,0)) MB" -ForegroundColor $(if ($Execute) { 'Red' } else { 'DarkYellow' })

if (-not $Execute) {
  Write-Host 'Podglad (max 15):' -ForegroundColor DarkGray
  $unique | Select-Object -First 15 | ForEach-Object { Write-Host "  $_" }
  Write-Host 'Uruchom ponownie z -Execute aby usunac.' -ForegroundColor Cyan
  exit 0
}

foreach ($p in $unique) {
  if (-not (Test-Path $p)) { continue }
  if ((Get-Item $p) -is [IO.DirectoryInfo]) {
    Remove-Item -LiteralPath $p -Recurse -Force
  } else {
    Remove-Item -LiteralPath $p -Force
  }
}
Write-Host "OK usunieto $($unique.Count) elementow." -ForegroundColor Green
