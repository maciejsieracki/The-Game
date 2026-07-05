# Poll meldunkow Grupa E + lane UI — uruchom recznie lub z opoznieniem
$out = Join-Path $PSScriptRoot "_poll-meldunki-wynik.md"
$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$root = Split-Path $root -Parent
$raport = Join-Path $root "docs\ux\figma\grupa-E\RAPORT-FIGMA.md"
$status = Join-Path $root "docs\ux\figma\STATUS-FIGMA.md"
$ui = Join-Path $root "dyspozycje\UI-DO-MASTERA.md"
$export = Join-Path $root "docs\ux\figma\grupa-E\export"

$lines = @(
    "# Poll meldunkow Figma E",
    "",
    "**Czas:** $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')",
    ""
)

if (Test-Path $raport) {
    $t = Get-Content $raport -Raw
    $lines += "## RAPORT-FIGMA.md (naglowek status)"
    ($t -split "`n" | Select-Object -First 8) | ForEach-Object { $lines += $_ }
    $lines += ""
    $lines += "### Ostatnie meldunki (grep)"
    Select-String -Path $raport -Pattern "FAZA|POSTEP|POSTĘP|GOTOWE 00" | Select-Object -Last 6 | ForEach-Object { $lines += $_.Line.Trim() }
}

$lines += ""
if (Test-Path $status) {
    $dg = Select-String -Path $status -Pattern "Data gotowości 00" | Select-Object -First 1
    if ($dg) { $lines += "## STATUS: $($dg.Line.Trim())" }
}

$lines += ""
if (Test-Path $export) {
    $png = Get-ChildItem $export -Filter "*.png" -ErrorAction SilentlyContinue
    $lines += "## Export PNG: $($png.Count) plikow"
    $png | ForEach-Object { $lines += "- $($_.Name)" }
}

$lines | Set-Content $out -Encoding UTF8
Write-Output "Zapisano: $out"
