# Uruchom lokalnie (PPM -> Uruchom w PowerShell) w folderze Civ. Przenosi MARTWE pliki do _archiwum.
$ErrorActionPreference='Continue'; $b=Split-Path -Parent $MyInvocation.MyCommand.Path; Set-Location $b
New-Item -ItemType Directory -Force -Path '_archiwum' | Out-Null
$dead=@('Katalog-assetow-lowpoly.html','Podglad-jednostka-roblox.html','Podglad-armii.html','Porownanie-jednostek-A-B.html',
'SPIS-ZADAN.md','PLAN-PRODUKCJI.md','PLAN-UKONCZENIA-PROJEKTU.md','SESJA-AUTONOMICZNA.md')
foreach($f in $dead){ if(Test-Path $f){ Move-Item -Force $f '_archiwum\'; Write-Host "-> $f" } }
Get-ChildItem -Path 'gra' -Directory -Filter 'dist*' -EA SilentlyContinue | ForEach-Object { Move-Item -Force $_.FullName '_archiwum\'; Write-Host "-> $($_.Name)" }
if(Test-Path 'gra\src\render\_sizetest.tmp'){ Move-Item -Force 'gra\src\render\_sizetest.tmp' '_archiwum\' }
Write-Host 'Gotowe. Zostawiono: kanon, aktywne podglady, makiety, Excele, dyspozycje, kod.'
