# ⛔ 2026-07-06: ZAKAZ KOPIOWANIA DO ROOT — root = finalna (tylko Grupa G Cursor).
# Skrypt ma publikowac WYLACZNIE do gra-robocza\. Cele $projRoot do usuniecia przez INTEGRATORA.
# Obieg: dyspozycje/START-TU.md. Publisher = INTEGRATOR (Cowork).
# Build gra-robocza/src → single-file bundle + publish do root i gra-robocza/
# Wywołanie (z gra-robocza/): .\tools\publish-robocza-bundle.ps1
# Pomija npm prebuild (export-data) — tylko vite singlefile.

$ErrorActionPreference = 'Stop'
$roboczaRoot = Split-Path $PSScriptRoot -Parent
$projRoot = Split-Path $roboczaRoot -Parent
$distDir = Join-Path $env:TEMP 'civ-dist'
$distBundle = Join-Path $distDir 'index.html'

Push-Location $roboczaRoot
try {
  if (Test-Path $distDir) { Remove-Item $distDir -Recurse -Force }
  Write-Host 'vite build ->' $distDir -ForegroundColor Cyan
  npx vite build --outDir $distDir
  if (-not (Test-Path $distBundle)) {
    throw "Brak $distBundle po buildzie"
  }

  $html = Get-Content -Raw -Encoding UTF8 $distBundle
  if ($html -notmatch 'CIV-BUILD-STAMP-PENDING') {
    Write-Host 'UWAGA: brak placeholdera CIV-BUILD-STAMP-PENDING w bundlu' -ForegroundColor Yellow
  }
  $md5Pre = (Get-FileHash $distBundle -Algorithm MD5).Hash.ToLower()
  $stamp = (Get-Date -Format 'yyyy-MM-dd HH:mm') + ' · ' + $md5Pre.Substring(0, 12)
  if ($html -match 'CIV-BUILD-STAMP-PENDING') {
    $html = $html.Replace('CIV-BUILD-STAMP-PENDING', $stamp)
  } elseif ($html -notmatch 'id="civ-build-stamp"') {
    $stampLine = 'ROBOCZA · ' + $md5Pre.Substring(0, 8) + ' · ' + (Get-Date -Format 'yyyy-MM-dd HH:mm')
    $stampDiv = '<div id="civ-build-stamp" title="md5=' + $md5Pre + '" style="position:fixed;bottom:6px;left:6px;z-index:2147483647;font:11px/1.3 ui-monospace,Consolas,monospace;background:rgba(0,0,0,.78);color:#d4af37;padding:3px 8px;border-radius:4px;border:1px solid rgba(212,175,55,.35);pointer-events:none;letter-spacing:.02em">' + $stampLine + '</div>'
    if ($html -match '</body>') {
      $html = $html -replace '</body>', ($stampDiv + '</body>')
    } else {
      $html += $stampDiv
    }
  }
  Set-Content -Path $distBundle -Value $html -Encoding UTF8 -NoNewline
  if ($html -notmatch 'id="civ-build-stamp"') {
    $html = Get-Content -Raw -Encoding UTF8 $distBundle
    $stampLine = 'ROBOCZA · ' + $md5Pre.Substring(0, 8) + ' · ' + (Get-Date -Format 'yyyy-MM-dd HH:mm')
    $stampDiv = '<div id="civ-build-stamp" title="md5=' + $md5Pre + '" style="position:fixed;bottom:6px;left:6px;z-index:2147483647;font:11px/1.3 ui-monospace,Consolas,monospace;background:rgba(0,0,0,.78);color:#d4af37;padding:3px 8px;border-radius:4px;border:1px solid rgba(212,175,55,.35);pointer-events:none;letter-spacing:.02em">' + $stampLine + '</div>'
    $html = $html -replace '</body>', ($stampDiv + '</body>')
    Set-Content -Path $distBundle -Value $html -Encoding UTF8 -NoNewline
  }
  $md5 = (Get-FileHash $distBundle -Algorithm MD5).Hash.ToLower()

  $playtestNames = @(
    'Gra-podglad-PLAYTEST-WALKA.html',
    'Gra-podglad-PLAYTEST-ODSKOK.html',
    'Gra-podglad-PLAYTEST-ODSKOK-OBLEZENIE.html',
    'Gra-podglad-PLAYTEST-OBLEZENIE-3v3.html',
    'Gra-podglad-PLAYTEST-MAPA.html',
    'Gra-podglad-PLAYTEST-MIASTO.html'
  )

  $targets = @(
    (Join-Path $roboczaRoot 'Gra-podglad.html')
  ) + ($playtestNames | ForEach-Object { Join-Path $roboczaRoot $_ }) + @(
    (Join-Path $projRoot 'Gra-podglad-ROBOCZA.html')
  ) + ($playtestNames | ForEach-Object { Join-Path $projRoot $_ })

  foreach ($dest in $targets) {
    $dir = Split-Path $dest -Parent
    if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    Copy-Item $distBundle $dest -Force
    Write-Host " -> $dest"
  }

  & (Join-Path $PSScriptRoot 'verify-publish-markers.ps1') -BundlePath (Join-Path $roboczaRoot 'Gra-podglad.html')

  # Pole bitwy — osobny entry (gra/vite.oblezenie-bitwa.config.ts), nie main.ts bundle
  $graRoot = Join-Path $projRoot 'gra'
  Write-Host 'Build POLE-BITWY (oblezenie/)...' -ForegroundColor Cyan
  Push-Location $graRoot
  try {
    npx vite build --config vite.oblezenie-bitwa.config.ts 2>&1 | Out-Host
    if ($LASTEXITCODE -ne 0) { throw "vite oblezenie-bitwa failed (exit $LASTEXITCODE)" }
  } finally {
    Pop-Location
  }
  $poleSrc = Join-Path $projRoot 'Gra-podglad-POLE-BITWY.html'
  if (Test-Path $poleSrc) {
    Copy-Item $poleSrc (Join-Path $roboczaRoot 'Gra-podglad-POLE-BITWY.html') -Force
    Write-Host " -> gra-robocza/Gra-podglad-POLE-BITWY.html"
  } else {
    Write-Host 'UWAGA: brak Gra-podglad-POLE-BITWY.html po buildzie oblezenie' -ForegroundColor Yellow
  }

  $manifestCore = @{
    publishedAt = (Get-Date -Format 'yyyy-MM-ddTHH:mm:ss')
    publisher = 'MASTER publish-robocza-bundle'
    md5 = $md5
    buildStamp = $stamp
    source = 'gra-robocza/src'
    markers = @('civ-map-load-overlay', 'frustumCulled', 'CIV-BUNDLE-MARKER-map-perf-20260705-c3')
  }
  ($manifestCore | ConvertTo-Json -Depth 4) | Set-Content -Path (Join-Path $roboczaRoot 'ROBOCZA-MANIFEST.json') -Encoding UTF8

  & node (Join-Path $PSScriptRoot 'generate-start-hub.cjs')

  Write-Host ''
  Write-Host 'OK publish ROBOCZA' -ForegroundColor Green
  Write-Host "MD5: $md5"
  Write-Host "Stamp menu: $stamp"
  Write-Host 'Start: gra-robocza/START.html (hub — gra + playtesty + pole bitwy) Ctrl+F5'
}
finally {
  Pop-Location
}
