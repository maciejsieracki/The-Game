# Integrator F: publish TYLKO bundli HTML → gra-robocza/ (bez kopii src — kod wyłącznie w gra/)

# Wywołanie: po PASS bramki, z katalogu gra/
#   .\tools\publish-robocza-snapshot.ps1
# Master NIE używa tego skryptu do finalnej — publish-kanon-snapshot.ps1

param(
  [string]$DistDir = (Join-Path $env:TEMP 'civ-dist'),
  [string]$BundlePath = ''
)

$ErrorActionPreference = 'Stop'
$graRoot = Split-Path $PSScriptRoot -Parent
$projRoot = Split-Path $graRoot -Parent
$roboczaRoot = Join-Path $projRoot 'gra-robocza'
$roboczaBundle = 'Gra-ROBOCZA.html'
$distBundle = Join-Path $DistDir 'index.html'

if ($BundlePath -and (Test-Path $BundlePath)) {
  $bundleSrc = $BundlePath
} elseif (Test-Path $distBundle) {
  $existingRob = Join-Path $roboczaRoot $roboczaBundle
  if ((Test-Path $existingRob) -and (Get-Item $existingRob).LastWriteTime -gt (Get-Item $distBundle).LastWriteTime) {
    $bundleSrc = $existingRob
    Write-Host "Uzyto istniejacy $roboczaBundle (niz temp dist)" -ForegroundColor DarkYellow
  } else {
    $bundleSrc = $distBundle
  }
} elseif (Test-Path (Join-Path $roboczaRoot $roboczaBundle)) {
  $bundleSrc = Join-Path $roboczaRoot $roboczaBundle
  Write-Host "Uzyto fallback bundle: $bundleSrc" -ForegroundColor DarkYellow
} else {
  throw "Brak bundle (najpierw bramka / vite build): $distBundle"
}

$md5 = (Get-FileHash $bundleSrc -Algorithm MD5).Hash.ToLower()
$stamp = Get-Date -Format 'yyyy-MM-ddTHH:mm:ss'

New-Item -ItemType Directory -Force -Path $roboczaRoot | Out-Null

$roboczaHtml = Join-Path $roboczaRoot $roboczaBundle
Copy-Item $bundleSrc $roboczaHtml -Force
& (Join-Path $PSScriptRoot 'inject-build-stamp.ps1') -HtmlPath $roboczaHtml -Tier ROBOCZA -Md5 $md5

$playtestNames = @(
  'Gra-ROBOCZA-PLAYTEST-WALKA.html',
  'Gra-ROBOCZA-PLAYTEST-ODSKOK.html',
  'Gra-ROBOCZA-PLAYTEST-ODSKOK-OBLEZENIE.html',
  'Gra-ROBOCZA-PLAYTEST-OBLEZENIE-3v3.html',
  'Gra-ROBOCZA-PLAYTEST-MAPA.html',
  'Gra-ROBOCZA-PLAYTEST-MIASTO.html'
)
foreach ($name in $playtestNames) {
  Copy-Item $bundleSrc (Join-Path $roboczaRoot $name) -Force
}

# Pole bitwy — OSOBNY build (oblezenie/main.ts), NIE z vite build main.ts
Write-Host "Build POLE-BITWY (units.json + battleScene)..." -ForegroundColor Cyan
Push-Location $graRoot
try {
  npx vite build --config vite.oblezenie-bitwa.config.ts --outDir (Join-Path $env:TEMP 'civ-dist-oblezenie') 2>&1 | Out-Host
  if ($LASTEXITCODE -ne 0) { throw "vite oblezenie-bitwa failed (exit $LASTEXITCODE)" }
} finally {
  Pop-Location
}
$poleSrc = Join-Path $projRoot 'Gra-ROBOCZA-POLE-BITWY.html'
if (-not (Test-Path $poleSrc)) { $poleSrc = Join-Path $projRoot 'Gra-podglad-POLE-BITWY.html' }
if (Test-Path $poleSrc) {
  Copy-Item $poleSrc (Join-Path $roboczaRoot 'Gra-ROBOCZA-POLE-BITWY.html') -Force
  $poleMd5 = (Get-FileHash $poleSrc -Algorithm MD5).Hash.ToLower()
  Write-Host "Skopiowano POLE-BITWY -> gra-robocza/ (md5 $poleMd5)" -ForegroundColor DarkYellow
} else {
  Write-Host "UWAGA: brak $poleSrc po buildzie oblezenie-bitwa" -ForegroundColor Yellow
}

# START.html w gra-robocza/ — utrzymywany ręcznie (hub playtestów); publish nie nadpisuje.

$manifest = @{
  publishedAt = $stamp
  publisher = 'Integrator F'
  md5 = $md5
  sourceBuild = $DistDir
  bundle = $roboczaBundle
  note = 'Grywalna ROBOCZA. Plik: gra-robocza/Gra-ROBOCZA.html'
} | ConvertTo-Json -Depth 3
Set-Content -Path (Join-Path $roboczaRoot 'ROBOCZA-MANIFEST.json') -Value $manifest -Encoding UTF8

foreach ($name in $playtestNames) {
  Copy-Item $roboczaHtml (Join-Path $roboczaRoot $name) -Force
}

Write-Host ''
Write-Host "OK ROBOCZA: $roboczaRoot" -ForegroundColor Green
Write-Host "MD5: $md5"
Write-Host "Gra: gra-robocza/$roboczaBundle"
