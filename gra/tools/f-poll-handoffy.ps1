# Grupa F — szybki skan handoffów (bez buildu)
# Uruchom: cd gra; .\tools\f-poll-handoffy.ps1

$ErrorActionPreference = 'Continue'
$graRoot = Split-Path $PSScriptRoot -Parent
$projRoot = Split-Path $graRoot -Parent
$handoff = Join-Path $projRoot 'dyspozycje\_handoff'
$pollDoc = Join-Path $projRoot 'docs\czaty\grupa-f\F-POLL-HANDOFFY.md'

Write-Host "=== F-POLL $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') ===" -ForegroundColor Cyan

$patterns = @('CZEKA SILNIK', 'GOTOWE-do-wpiecia', 'czeka wpi', 'GOTOWE - czeka', 'GOTOWE — czeka', 'Status:** GOTOWE')
$hits = @()
foreach ($p in $patterns) {
  Get-ChildItem $handoff -Filter '*.md' -ErrorAction SilentlyContinue | ForEach-Object {
    $c = Select-String -Path $_.FullName -Pattern $p -SimpleMatch -ErrorAction SilentlyContinue
    if ($c) { $hits += [PSCustomObject]@{ File = $_.Name; Match = $p } }
  }
}
$hits = $hits | Sort-Object File -Unique

if ($hits.Count -eq 0) {
  Write-Host 'Handoffy CZEKA/GOTOWE: (brak dopasowan grep)' -ForegroundColor Yellow
} else {
  Write-Host "Handoffy CZEKA/GOTOWE ($($hits.Count)):" -ForegroundColor Green
  $hits | ForEach-Object { Write-Host "  - $($_.File) [$($_.Match)]" }
}

$mainTs = Join-Path $graRoot 'src\main.ts'
$checks = @(
  @{ Name = 'civ-roster'; Pattern = 'assignAiCivTypes|civ-roster' },
  @{ Name = 'society-pct'; Pattern = 'evaluateOrderFromBreakdown' },
  @{ Name = 'grantTech'; Pattern = 'grantTechEpokWczesniejszych' },
  @{ Name = 'prod-spawn'; Pattern = "id: 'prod_'" },
  @{ Name = 'empire-food'; Pattern = 'advanceEmpireFood' },
  @{ Name = 'power'; Pattern = 'buildPowerSnapshotsForTurn' },
  @{ Name = 'city-sight'; Pattern = 'citySightRadius' },
  @{ Name = 'culture-panel'; Pattern = 'getCultureState' }
)
Write-Host 'main.ts wpiecia:' -ForegroundColor Cyan
foreach ($ch in $checks) {
  $ok = Select-String -Path $mainTs -Pattern $ch.Pattern -Quiet -ErrorAction SilentlyContinue
  $st = if ($ok) { 'TAK' } else { 'NIE' }
  Write-Host "  $($ch.Name): $st"
}

$robocza = Join-Path $projRoot 'Gra-podglad-ROBOCZA.html'
if (Test-Path $robocza) {
  $md5 = (Get-FileHash $robocza -Algorithm MD5).Hash.ToLower()
  Write-Host "ROBOCZA md5: $md5"
}

Write-Host "Szczegoly: docs/czaty/grupa-f/F-POLL-HANDOFFY.md" -ForegroundColor DarkGray
