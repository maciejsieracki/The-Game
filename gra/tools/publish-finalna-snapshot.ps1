# Master: bezpieczna promocja gra-kanon/ → Gra-FINALNA.html (tylko Master)
# Ten skrypt promuje WYŁĄCZNIE KANON → FINALNA (Gra-KANON.html jest źródłem — NIE robocza).
# Uruchamiać RZADKO i OSOBNO od publish-kanon-snapshot.ps1, wyłącznie na wyraźne
# polecenie właściciela, dopiero po dłuższym ograniu bieżącego kanonu — NIGDY
# automatycznie "przy okazji" promocji kanonu.
# Wymaga: gra-kanon/Gra-KANON.html (kanon już promowany i przetestowany)
# Uruchom z gra/:  .\tools\publish-finalna-snapshot.ps1

$ErrorActionPreference = 'Stop'
$graRoot = Split-Path $PSScriptRoot -Parent
$projRoot = Split-Path $graRoot -Parent
$kanonRoot = Join-Path $projRoot 'gra-kanon'

$kanonBundle = 'Gra-KANON.html'
$finalnaBundle = 'Gra-FINALNA.html'

$kanonHtml = Join-Path $kanonRoot $kanonBundle
if (-not (Test-Path $kanonHtml)) {
  throw "Brak gra-kanon/$kanonBundle - najpierw promuj kanon: publish-kanon-snapshot.ps1"
}

$sourceMd5 = (Get-FileHash -LiteralPath $kanonHtml -Algorithm MD5).Hash.ToLower()
Write-Host "Zrodlo: gra-kanon/$kanonBundle (md5=$sourceMd5)" -ForegroundColor Cyan

$finalnaPath = Join-Path $projRoot $finalnaBundle
Copy-Item -LiteralPath $kanonHtml -Destination $finalnaPath -Force

& (Join-Path $PSScriptRoot 'inject-build-stamp.ps1') -HtmlPath $finalnaPath -Tier FINALNA -Md5 $sourceMd5

$finalnaMd5 = (Get-FileHash -LiteralPath $finalnaPath -Algorithm MD5).Hash.ToLower()

Write-Host ''
Write-Host "OK FINALNA: $finalnaPath" -ForegroundColor Green
Write-Host "Zrodlowy KANON md5: $sourceMd5"
Write-Host "Powstala FINALNA md5: $finalnaMd5"
Write-Host "Zaloguj natychmiast w dyspozycje/WERSJE.md (sekcja FINALNA) i dyspozycje/_handoff/KANAL-PRACA.md." -ForegroundColor Yellow
