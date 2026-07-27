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
  $bundleSrc = $distBundle
} elseif (Test-Path (Join-Path $roboczaRoot $roboczaBundle)) {
  $bundleSrc = Join-Path $roboczaRoot $roboczaBundle
  Write-Host "Uzyto fallback bundle: $bundleSrc" -ForegroundColor DarkYellow
} else {
  throw "Brak bundle (najpierw bramka / vite build): $distBundle"
}

$roboczaHtml = Join-Path $roboczaRoot $roboczaBundle
New-Item -ItemType Directory -Force -Path $roboczaRoot | Out-Null
Copy-Item $bundleSrc $roboczaHtml -Force
# inject przeniesiony na koniec (po playtest copies) — md5 manifest = certutil
$playtestNames = @(
  'Gra-ROBOCZA-PLAYTEST-WALKA.html',
  'Gra-ROBOCZA-PLAYTEST-ODSKOK.html',
  'Gra-ROBOCZA-PLAYTEST-ODSKOK-OBLEZENIE.html',
  'Gra-ROBOCZA-PLAYTEST-OBLEZENIE-3v3.html',
  'Gra-ROBOCZA-PLAYTEST-MAPA.html',
  'Gra-ROBOCZA-PLAYTEST-MIASTO.html'
)

# Pole bitwy (osobny bundle — nie blokuje głównego Gra-ROBOCZA)
Write-Host "Build POLE-BITWY (units.json + battleScene)..." -ForegroundColor Cyan
try {
  Push-Location $graRoot
  $prevEap = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  node ./node_modules/vite/bin/vite.js build --config vite.oblezenie-bitwa.config.ts --outDir (Join-Path $env:TEMP 'civ-dist-oblezenie') 2>&1 | Out-Host
  $viteExit = $LASTEXITCODE
  $ErrorActionPreference = $prevEap
  if ($viteExit -ne 0) { Write-Host "UWAGA: vite oblezenie-bitwa exit $viteExit (pomijam POLE-BITWY)" -ForegroundColor Yellow }
  else {
    $poleSrc = Join-Path $projRoot 'Gra-ROBOCZA-POLE-BITWY.html'
    if (-not (Test-Path $poleSrc)) { $poleSrc = Join-Path $projRoot 'Gra-podglad-POLE-BITWY.html' }
    if (Test-Path $poleSrc) {
      Copy-Item $poleSrc (Join-Path $roboczaRoot 'Gra-ROBOCZA-POLE-BITWY.html') -Force
      $poleMd5 = (Get-FileHash $poleSrc -Algorithm MD5).Hash.ToLower()
      Write-Host "Skopiowano POLE-BITWY -> gra-robocza/ (md5 $poleMd5)" -ForegroundColor DarkYellow
    } else {
      Write-Host "UWAGA: brak $poleSrc po buildzie oblezenie-bitwa" -ForegroundColor Yellow
    }
  }
} catch {
  Write-Host "UWAGA: POLE-BITWY build failed: $_" -ForegroundColor Yellow
} finally {
  Pop-Location
}

# START.html w gra-robocza/ — utrzymywany ręcznie (hub playtestów); publish nie nadpisuje.

# Pieczęć → potem kopie playtestów ze STAMPED bundla.
& (Join-Path $PSScriptRoot 'inject-build-stamp.ps1') -HtmlPath $roboczaHtml -Tier ROBOCZA
foreach ($name in $playtestNames) {
  Copy-Item $roboczaHtml (Join-Path $roboczaRoot $name) -Force
}

$md5 = (Get-FileHash $roboczaHtml -Algorithm MD5).Hash.ToLower()
$manifest = @{
  publishedAt = (Get-Date -Format 'yyyy-MM-ddTHH:mm:ss')
  publisher = 'Integrator F'
  md5 = $md5
  sourceBuild = $DistDir
  bundle = $roboczaBundle
  note = 'Grywalna ROBOCZA. Plik: gra-robocza/Gra-ROBOCZA.html'
} | ConvertTo-Json -Depth 3
[System.IO.File]::WriteAllText((Join-Path $roboczaRoot 'ROBOCZA-MANIFEST.json'), $manifest, [Text.UTF8Encoding]::new($false))
Write-Host "Manifest md5 (final): $md5" -ForegroundColor Cyan

Write-Host ''
Write-Host "OK ROBOCZA: $roboczaRoot" -ForegroundColor Green
Write-Host "MD5: $md5"
Write-Host "Gra: gra-robocza/$roboczaBundle"
