# Master: sync gra-kanon/ → gra-robocza/ (kanon = źródło prawdy UX)
# Użycie z gra/:  .\tools\sync-kanon-to-robocza.ps1
# Nie dotyka gra/ (dev) ani publish-kanon — tylko wyrównanie roboczej do kanonu.

$ErrorActionPreference = 'Stop'
$graRoot = Split-Path $PSScriptRoot -Parent
$projRoot = Split-Path $graRoot -Parent
$kanonRoot = Join-Path $projRoot 'gra-kanon'
$roboczaRoot = Join-Path $projRoot 'gra-robocza'

if (-not (Test-Path (Join-Path $kanonRoot 'Gra-podglad.html'))) {
  throw "Brak gra-kanon/Gra-podglad.html"
}

$md5 = (Get-FileHash (Join-Path $kanonRoot 'Gra-podglad.html') -Algorithm MD5).Hash.ToLower()
$stamp = Get-Date -Format 'yyyy-MM-ddTHH:mm:ss'

New-Item -ItemType Directory -Force -Path $roboczaRoot | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $roboczaRoot 'data') | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $roboczaRoot 'src') | Out-Null

Get-ChildItem (Join-Path $kanonRoot 'data') -Filter '*.json' -File |
  Where-Object { $_.Name -notmatch '\.bak' } |
  Copy-Item -Destination (Join-Path $roboczaRoot 'data') -Force

$srcLaneDirs = @('battle', 'data', 'game', 'input', 'map', 'render', 'types', 'ui', 'units')
foreach ($d in $srcLaneDirs) {
  $from = Join-Path $kanonRoot "src\$d"
  if (-not (Test-Path $from)) { continue }
  $to = Join-Path $roboczaRoot "src\$d"
  New-Item -ItemType Directory -Force -Path $to | Out-Null
  Get-ChildItem $from -Recurse -File |
    Where-Object {
      $_.FullName -notmatch '\\_backup\\' -and
      $_.Name -notmatch '\.bak' -and
      $_.Name -notmatch '\.dehydrated' -and
      $_.Name -notmatch '\.tmp$' -and
      $_.Name -notmatch '_tmp\.ts$' -and
      $_.Extension -ne '.md'
    } |
    ForEach-Object {
      $rel = $_.FullName.Substring($from.Length + 1)
      $destDir = Join-Path $to (Split-Path $rel -Parent)
      if ($destDir -and -not (Test-Path $destDir)) {
        New-Item -ItemType Directory -Force -Path $destDir | Out-Null
      }
      Copy-Item $_.FullName -Destination (Join-Path $to $rel) -Force
    }
}

Copy-Item (Join-Path $kanonRoot 'src\main.ts') (Join-Path $roboczaRoot 'src\main.ts') -Force

foreach ($f in @('index.html', 'package.json', 'package-lock.json', 'vite.config.ts', 'tsconfig.json')) {
  $p = Join-Path $kanonRoot $f
  if (Test-Path $p) { Copy-Item $p $roboczaRoot -Force }
}

Copy-Item (Join-Path $kanonRoot 'Gra-podglad.html') (Join-Path $roboczaRoot 'Gra-podglad.html') -Force

$playtestNames = @(
  'Gra-podglad-PLAYTEST-WALKA.html',
  'Gra-podglad-PLAYTEST-ODSKOK.html',
  'Gra-podglad-PLAYTEST-ODSKOK-OBLEZENIE.html',
  'Gra-podglad-PLAYTEST-OBLEZENIE-3v3.html',
  'Gra-podglad-PLAYTEST-MAPA.html',
  'Gra-podglad-PLAYTEST-MIASTO.html'
)
foreach ($name in $playtestNames) {
  $src = Join-Path $kanonRoot $name
  if (Test-Path $src) {
    Copy-Item $src (Join-Path $roboczaRoot $name) -Force
  }
}

@'
<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8">
<title>The Game - START (ROBOCZA)</title>
<script>
location.replace('Gra-podglad.html?skipMenuRedirect=1');
</script>
</head>
<body>
<p><a href="Gra-podglad.html?skipMenuRedirect=1">ROBOCZA — kliknij tutaj</a></p>
</body>
</html>
'@ | Set-Content -Path (Join-Path $roboczaRoot 'START.html') -Encoding UTF8

$manifest = @{
  publishedAt = $stamp
  publisher = 'Master Orkiestrator'
  md5 = $md5
  sourceKanon = 'gra-kanon/'
  sourceKanonMd5 = $md5
  syncFromKanon = $true
  note = 'Grywalna ROBOCZA zsynchronizowana z kanonem. Start: gra-robocza/START.html.'
} | ConvertTo-Json -Depth 3
Set-Content -Path (Join-Path $roboczaRoot 'ROBOCZA-MANIFEST.json') -Value $manifest -Encoding UTF8

Copy-Item (Join-Path $kanonRoot 'Gra-podglad.html') (Join-Path $projRoot 'Gra-podglad-ROBOCZA.html') -Force

Write-Host ''
Write-Host "OK sync kanon -> robocza: $roboczaRoot" -ForegroundColor Green
Write-Host "MD5: $md5"
Write-Host "Start: gra-robocza/START.html"
