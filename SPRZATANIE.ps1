# SPRZATANIE.ps1 -- uruchom lokalnie (PPM -> Uruchom w PowerShell) w folderze Civ
$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$gra = Join-Path $root 'gra'
if (-not (Test-Path $gra)) { $gra = $root }
Set-Location $gra
Write-Host "Sprzatanie w: $gra"
# 1) Warianty buildow dist-* (glowny 'dist' zostaje):
Get-ChildItem -Directory -Filter 'dist-*' -ErrorAction SilentlyContinue | ForEach-Object {
  Write-Host "  usuwam katalog: $($_.Name)"
  Remove-Item -Recurse -Force $_.FullName
}
# 2) Plik tymczasowy:
$tmp = Join-Path $gra 'src\render\_sizetest.tmp'
if (Test-Path $tmp) { Remove-Item -Force $tmp; Write-Host '  usunieto: src\render\_sizetest.tmp' }
# 3) Smieci builda Vite (tymczasowe loadery configu):
Get-ChildItem -File -Filter 'vite.config.ts.timestamp-*.mjs' -ErrorAction SilentlyContinue | ForEach-Object {
  Write-Host "  usuwam: $($_.Name)"
  Remove-Item -Force $_.FullName
}
# 4) Pomocniczy ogon scene (nie kompiluje sie, to .txt):
$sceneTail = Join-Path $gra 'src\render\_scene_tail.txt'
if (Test-Path $sceneTail) { Remove-Item -Force $sceneTail; Write-Host '  usunieto: src\render\_scene_tail.txt' }
# 5) Markery testowe sandboxa:
foreach ($m in @('_bashmarker.txt','_synctest.txt')) {
  $mp = Join-Path $gra $m
  if (Test-Path $mp) { Remove-Item -Force $mp; Write-Host "  usunieto: $m" }
}

Write-Host ''
Write-Host 'Gotowe. Zostawiono: glowny dist, kod zrodlowy, podglady HTML.'
