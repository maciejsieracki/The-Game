# build-wonderpreview.ps1 — galeria cudów 3D → Civ-MAPA (Maciej: dwuklik HTML)
$ErrorActionPreference = 'Stop'
$gra = Split-Path -Parent $PSScriptRoot
Set-Location $gra
npx vite build --config vite.wonderpreview.config.ts
Write-Host "OK: Civ-MAPA\Gra-podglad-CUDA-ROBLOX.html"
Write-Host "Widoki: ?view=active | ?view=ruiny | ?view=compare"
