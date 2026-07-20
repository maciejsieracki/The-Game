# Master: bezpieczna promocja gra-robocza/ → gra-kanon/ (tylko Master)
# Ten skrypt promuje WYŁĄCZNIE ROBOCZA → KANON — nic ponadto. Trzeci poziom (patrz
# CLAUDE.md / STAN-PRACY-HANDOFF.md) ma osobny, ręcznie uruchamiany skrypt, wyłącznie
# na wyraźne polecenie właściciela, NIGDY automatycznie "przy okazji" tej promocji.
# Wymaga: gra-robocza/ po PASS F + test Master
# Uruchom z gra/:  .\tools\publish-kanon-snapshot.ps1

$ErrorActionPreference = 'Stop'
$graRoot = Split-Path $PSScriptRoot -Parent
$projRoot = Split-Path $graRoot -Parent
$roboczaRoot = Join-Path $projRoot 'gra-robocza'
$kanonRoot = Join-Path $projRoot 'gra-kanon'
$archiveRoot = Join-Path $projRoot 'gra-kanon-archiwum'

$roboczaBundle = 'Gra-ROBOCZA.html'
$kanonBundle = 'Gra-KANON.html'

if (-not (Test-Path (Join-Path $roboczaRoot $roboczaBundle))) {
  throw "Brak gra-robocza/$roboczaBundle - najpierw F: publish-robocza-snapshot.ps1"
}

$md5 = (Get-FileHash (Join-Path $roboczaRoot $roboczaBundle) -Algorithm MD5).Hash.ToLower()
$stamp = Get-Date -Format 'yyyy-MM-ddTHH:mm:ss'

if (Test-Path $kanonRoot) {
  Write-Host "Zastepuje poprzedni kanon (bez archiwum w repo)" -ForegroundColor DarkYellow
  Remove-Item -Path $kanonRoot -Recurse -Force
}

Copy-Item -Path $roboczaRoot -Destination $kanonRoot -Recurse -Force

$kanonRenames = @(
  @('Gra-ROBOCZA.html', 'Gra-KANON.html'),
  @('Gra-ROBOCZA-PLAYTEST-WALKA.html', 'Gra-KANON-PLAYTEST-WALKA.html'),
  @('Gra-ROBOCZA-PLAYTEST-ODSKOK.html', 'Gra-KANON-PLAYTEST-ODSKOK.html'),
  @('Gra-ROBOCZA-PLAYTEST-ODSKOK-OBLEZENIE.html', 'Gra-KANON-PLAYTEST-ODSKOK-OBLEZENIE.html'),
  @('Gra-ROBOCZA-PLAYTEST-OBLEZENIE-3v3.html', 'Gra-KANON-PLAYTEST-OBLEZENIE-3v3.html'),
  @('Gra-ROBOCZA-PLAYTEST-MAPA.html', 'Gra-KANON-PLAYTEST-MAPA.html'),
  @('Gra-ROBOCZA-PLAYTEST-MIASTO.html', 'Gra-KANON-PLAYTEST-MIASTO.html'),
  @('Gra-ROBOCZA-POLE-BITWY.html', 'Gra-KANON-POLE-BITWY.html')
)
foreach ($pair in $kanonRenames) {
  $from = Join-Path $kanonRoot $pair[0]
  if (Test-Path $from) { Rename-Item -LiteralPath $from -NewName $pair[1] -Force }
}
$roboczaManifestInKanon = Join-Path $kanonRoot 'ROBOCZA-MANIFEST.json'
if (Test-Path $roboczaManifestInKanon) { Remove-Item $roboczaManifestInKanon -Force }

$manifest = @{
  publishedAt = $stamp
  sourceRobocza = 'gra-robocza/'
  sourceRoboczaMd5 = $md5
  publisher = 'Master Orkiestrator'
  note = 'KANON w gra-kanon/ — tylko Master po OK Macieja. Trzeci poziom promowany OSOBNYM skryptem, wyłącznie na wyraźne polecenie właściciela.'
} | ConvertTo-Json -Depth 3
Set-Content -Path (Join-Path $kanonRoot 'KANON-MANIFEST.json') -Value $manifest -Encoding UTF8

@'
<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8">
<title>The Game - START (KANON)</title>
<script>
location.replace('Gra-KANON.html?skipMenuRedirect=1');
</script>
</head>
<body>
<p><a href="Gra-KANON.html?skipMenuRedirect=1">KANON — kliknij tutaj</a></p>
</body>
</html>
'@ | Set-Content -Path (Join-Path $kanonRoot 'START.html') -Encoding UTF8

$kanonHtml = Join-Path $kanonRoot $kanonBundle
& (Join-Path $PSScriptRoot 'inject-build-stamp.ps1') -HtmlPath $kanonHtml -Tier KANON -Md5 $md5

& (Join-Path $PSScriptRoot 'cleanup-retention.ps1') -Execute -KanonArchiwumKeep 5 -BackupHtmlKeep 3 -RoboczaKopiaDaysKeep 7 | Out-Null

@'
<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8">
<title>The Game - START</title>
<script>
location.replace('gra-robocza/START.html');
</script>
</head>
<body>
<p><strong>Domyślnie: ROBOCZA</strong> (D1A)</p>
<p><a href="gra-robocza/START.html">Robocza</a> | <a href="gra-kanon/START.html">Kanon</a></p>
</body>
</html>
'@ | Set-Content -Path (Join-Path $projRoot 'START-GRA.html') -Encoding UTF8

Write-Host ''
Write-Host "OK KANON: $kanonRoot" -ForegroundColor Green
Write-Host "MD5: $md5"
Write-Host "Kanon: gra-kanon/$kanonBundle"
