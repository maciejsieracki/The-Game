# build-improvepreview.ps1 — galeria ulepszeń → Civ-MAPA (Maciej: dwuklik HTML)
$ErrorActionPreference = 'Stop'
$gra = Split-Path -Parent $PSScriptRoot
$root = Split-Path -Parent $gra
Set-Location $gra
npx vite build --config src/improvepreview/vite.improvepreview.config.ts
$src = Join-Path $gra 'dist-improvepreview\src\improvepreview\index.html'
$dst1 = Join-Path $root 'Civ-MAPA\Gra-podglad-ULEPSZENIA.html'
$dst2 = Join-Path $root 'Civ-MAPA\Gra-podglad-ULEPSZENIA-ROBLOX.html'
$dst3 = Join-Path $root 'Gra-podglad-HODOWLA.html'
$dst4 = Join-Path $root 'Gra-podglad-ULEPSZENIA.html'
Copy-Item -Force $src $dst1
Copy-Item -Force $src $dst2
Copy-Item -Force $src $dst3
Copy-Item -Force $src $dst4
Write-Host "OK: $dst1"
Write-Host "OK: $dst2"
Write-Host "OK: $dst3 (otwórz ?view=hodowla)"
Write-Host "OK: $dst4 (?view=matrix = full matrix)"
