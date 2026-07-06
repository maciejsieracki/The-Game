# Poll kolejki Integrator F - co 30 min lub recznie
# Uruchom z gra/:  .\tools\poll-integrator-queue.ps1
# Raport: docs/obieg/_poll-integrator-last.md

$ErrorActionPreference = 'SilentlyContinue'
$graRoot = Split-Path $PSScriptRoot -Parent
$projRoot = Split-Path $graRoot -Parent
$dysp = Join-Path $projRoot 'dyspozycje'
$outFile = Join-Path $projRoot 'docs\obieg\_poll-integrator-last.md'
$now = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("# Poll Integrator F - $now")
$lines.Add('')
$lines.Add('Automatyczny odczyt kolejki. Skrypt: gra/tools/poll-integrator-queue.ps1')
$lines.Add('')

Write-Host "=== INTEGRATOR POLL $now ===" -ForegroundColor Cyan
$lines.Add('## Kanon')

$kanon = Join-Path $projRoot 'Gra-podglad.html'
if (Test-Path $kanon) {
  $h = (Get-FileHash $kanon -Algorithm MD5).Hash.ToLower()
  $mt = (Get-Item $kanon).LastWriteTime.ToString('yyyy-MM-dd HH:mm')
  Write-Host "KANON: $h ($mt)"
  $lines.Add("- **Gra-podglad.html:** ``$h`` mtime $mt")
} else {
  Write-Host 'KANON: BRAK PLIKU' -ForegroundColor Red
  $lines.Add('- **Gra-podglad.html:** BRAK PLIKU')
}

Write-Host ''
Write-Host '--- MASTER-do-INTEGRATOR ---' -ForegroundColor Yellow
Get-ChildItem (Join-Path $dysp 'MASTER-do-INTEGRATOR*.md') -ErrorAction SilentlyContinue |
  Sort-Object LastWriteTime -Descending |
  ForEach-Object { Write-Host ("  {0}  {1}" -f $_.LastWriteTime.ToString('yyyy-MM-dd HH:mm'), $_.Name) }

Write-Host ''
Write-Host '--- _handoff *INTEGRATOR* ---' -ForegroundColor Yellow
$handoffDir = Join-Path $dysp '_handoff'
Get-ChildItem (Join-Path $handoffDir '*INTEGRATOR*.md') -ErrorAction SilentlyContinue |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 8 |
  ForEach-Object { Write-Host ("  {0}  {1}" -f $_.LastWriteTime.ToString('yyyy-MM-dd HH:mm'), $_.Name) }

Write-Host ''
Write-Host '--- DZIENNIK ---' -ForegroundColor Yellow
$dziennik = Join-Path $dysp 'DZIENNIK-MASTERA.md'
if (Test-Path $dziennik) {
  Select-String -Path $dziennik -Pattern '^## \[' | Select-Object -First 5 | ForEach-Object { Write-Host "  $($_.Line)" }
}

Write-Host ''
Write-Host '--- OPUS ---' -ForegroundColor Yellow
$opus = Join-Path $projRoot 'docs\decyzje\OPUS-REVIEW-QUEUE.md'
if (Test-Path $opus) {
  Select-String -Path $opus -Pattern '2026-07-01|APPROVE|BLOCK|CZEKA Opus' | Select-Object -First 8 |
    ForEach-Object { Write-Host "  $($_.Line.Trim())" }
}

$stan = Join-Path $dysp 'INTEGRATOR-STAN.md'
$silnik = Join-Path $dysp 'SILNIK-DO-MASTERA.md'
$lastMeld = $null
if (Test-Path $silnik) {
  $lastMeld = Select-String -Path $silnik -Pattern '^## \[' | Select-Object -First 1
}

$verdict = 'CZEKA - brak nowej dyspozycji wdrozenia'
$action = 'Nic nie wdrazaj. Czeka: Opus gate, playtest Maciej.'
if ($lastMeld -and $lastMeld.Line -match 'GOTOWE-KANON' -and $lastMeld.Line -match '2026-07-01') {
  $verdict = 'KOLEJKA P0+P1 DOMKNIETA - kanon scalony'
}

$lines.Add('')
$lines.Add('## Werdykt poll')
$lines.Add('')
$lines.Add('| Pole | Wartosc |')
$lines.Add('|------|---------|')
$lines.Add("| **Status** | **$verdict** |")
$lines.Add("| **Do Integratora** | $action |")
if ($lastMeld) { $lines.Add("| Ostatni meldunek | $($lastMeld.Line.Trim()) |") }

$lines | Set-Content $outFile -Encoding UTF8
Write-Host ''
Write-Host "Raport: $outFile" -ForegroundColor Green
Write-Host "=== KONIEC POLL ===" -ForegroundColor Cyan
Write-Host "Werdykt: $verdict" -ForegroundColor Yellow
