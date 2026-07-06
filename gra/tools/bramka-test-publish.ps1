# Bramka → Gra-podglad-ROBOCZA.html (środowisko testowe / robocze)
# Finalna Gra-podglad.html + gra-kanon/ — TYLKO Master: publish-kanon-snapshot.ps1
# Uruchom z katalogu gra/:  .\tools\bramka-test-publish.ps1

$ErrorActionPreference = 'Stop'
$graRoot = Split-Path $PSScriptRoot -Parent
$projRoot = Split-Path $graRoot -Parent
$dist = Join-Path $env:TEMP 'civ-dist'
$robocza = Join-Path $projRoot 'Gra-podglad-ROBOCZA.html'
# Finalna — Master only (publish-kanon-snapshot.ps1). F nie dotyka:
$kanon = Join-Path $projRoot 'Gra-podglad.html'

Set-Location $graRoot

Write-Host '=== typecheck ===' -ForegroundColor Cyan
npm run typecheck

Write-Host '=== wire-ekonomia ===' -ForegroundColor Cyan
node tools/wire-ekonomia-test.cjs

Write-Host '=== logic-test ===' -ForegroundColor Cyan
node tools/logic-test.cjs

Write-Host '=== combat-test ===' -ForegroundColor Cyan
node tools/combat-test.cjs

if (Test-Path 'tools/post-battle-map-test.cjs') {
  Write-Host '=== post-battle-map (fan-out) ===' -ForegroundColor Cyan
  node tools/post-battle-map-test.cjs
}

if (Test-Path 'tools/army-merge-bounce-test.cjs') {
  Write-Host '=== army-merge-bounce ===' -ForegroundColor Cyan
  node tools/army-merge-bounce-test.cjs
}

Write-Host '=== civ-bonusy (Gr D) ===' -ForegroundColor Cyan
node tools/civ-bonusy-test.cjs

Write-Host '=== diplomacy (Gr D) ===' -ForegroundColor Cyan
node tools/diplomacy-test.cjs

Write-Host '=== ai (Gr D) ===' -ForegroundColor Cyan
node tools/ai-test.cjs

if (Test-Path 'tools/smoke.cjs') {
  Write-Host '=== smoke ===' -ForegroundColor Cyan
  node tools/smoke.cjs
}

if (Test-Path 'tools/battle-smoke.cjs') {
  Write-Host '=== battle-smoke ===' -ForegroundColor Cyan
  node tools/battle-smoke.cjs
}

Write-Host "=== vite build -> $dist ===" -ForegroundColor Cyan
npx vite build --outDir $dist --emptyOutDir

$index = Join-Path $dist 'index.html'
if (-not (Test-Path $index)) { throw "Brak $index po buildzie" }

Copy-Item $index $robocza -Force
$hashRobocza = (Get-FileHash $robocza -Algorithm MD5).Hash.ToLower()

# Kanon finalny — NIE publikujemy z bramki F (Master: publish-kanon-snapshot.ps1)
if (Test-Path $kanon) {
  $hashKanon = (Get-FileHash $kanon -Algorithm MD5).Hash.ToLower()
} else {
  $hashKanon = '(brak — czeka promocja Master)'
}

$playtestWalka = Join-Path $projRoot 'Gra-podglad-PLAYTEST-WALKA.html'
Copy-Item $index $playtestWalka -Force
$hashPlaytest = (Get-FileHash $playtestWalka -Algorithm MD5).Hash.ToLower()

$playtestOdskok = Join-Path $projRoot 'Gra-podglad-PLAYTEST-ODSKOK.html'
Copy-Item $index $playtestOdskok -Force
$hashPlaytestOdskok = (Get-FileHash $playtestOdskok -Algorithm MD5).Hash.ToLower()

$playtestOdskokObl = Join-Path $projRoot 'Gra-podglad-PLAYTEST-ODSKOK-OBLEZENIE.html'
Copy-Item $index $playtestOdskokObl -Force
$hashPlaytestOdskokObl = (Get-FileHash $playtestOdskokObl -Algorithm MD5).Hash.ToLower()

$playtestObl3v3 = Join-Path $projRoot 'Gra-podglad-PLAYTEST-OBLEZENIE-3v3.html'
Copy-Item $index $playtestObl3v3 -Force
$hashPlaytestObl3v3 = (Get-FileHash $playtestObl3v3 -Algorithm MD5).Hash.ToLower()

$playtestMapa = Join-Path $projRoot 'Gra-podglad-PLAYTEST-MAPA.html'
Copy-Item $index $playtestMapa -Force
$hashPlaytestMapa = (Get-FileHash $playtestMapa -Algorithm MD5).Hash.ToLower()

$playtestMiasto = Join-Path $projRoot 'Gra-podglad-PLAYTEST-MIASTO.html'
Copy-Item $index $playtestMiasto -Force
$hashPlaytestMiasto = (Get-FileHash $playtestMiasto -Algorithm MD5).Hash.ToLower()

Write-Host ''
Write-Host "OK (ROBOCZA - F): $robocza" -ForegroundColor Green
Write-Host "MD5 robocza: $hashRobocza"
Write-Host "KANON (bez zmian): $kanon" -ForegroundColor DarkYellow
Write-Host "MD5 kanon (finalna): $hashKanon"
Write-Host "OK (PLAYTEST-WALKA): $playtestWalka" -ForegroundColor Green
Write-Host "MD5 playtest: $hashPlaytest"
Write-Host "OK (PLAYTEST-ODSKOK): $playtestOdskok" -ForegroundColor Green
Write-Host "MD5 playtest odskok: $hashPlaytestOdskok"
Write-Host "OK (PLAYTEST-ODSKOK-OBLEZENIE): $playtestOdskokObl" -ForegroundColor Green
Write-Host "MD5 playtest odskok obl: $hashPlaytestOdskokObl"
Write-Host "OK (PLAYTEST-OBLEZENIE-3v3): $playtestObl3v3" -ForegroundColor Green
Write-Host "MD5 playtest obl 3v3: $hashPlaytestObl3v3"
Write-Host "OK (PLAYTEST-MAPA): $playtestMapa" -ForegroundColor Green
Write-Host "MD5 playtest mapa: $hashPlaytestMapa"
Write-Host "OK (PLAYTEST-MIASTO): $playtestMiasto" -ForegroundColor Green
Write-Host "MD5 playtest miasto: $hashPlaytestMiasto"

Write-Host '=== publish gra-robocza/ (pelna izolacja) ===' -ForegroundColor Cyan
& (Join-Path $PSScriptRoot 'publish-robocza-snapshot.ps1') -DistDir $dist
