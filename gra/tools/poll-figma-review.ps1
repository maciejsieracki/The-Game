# Poll: czy pojawily sie PNG do review Figmy (Maciej / MASTER)
# Uruchom: cd gra; .\tools\poll-figma-review.ps1
# Raport: docs/obieg/_poll-figma-review-last.md

$ErrorActionPreference = 'Stop'
$graRoot = Split-Path $PSScriptRoot -Parent
$projRoot = Split-Path $graRoot -Parent
$outFile = Join-Path $projRoot 'docs\obieg\_poll-figma-review-last.md'

$checks = @(
  @{ Label = 'E-01 PO Grupa E (Figma)'; Path = 'docs\ux\figma\grupa-E\export\E-01_po.png'; Review = $true },
  @{ Label = 'E-01 PO referencja MASTER'; Path = 'docs\ux\figma\grupa-E\export\E-01_po_REFERENCJA-MASTER.png'; Review = $true },
  @{ Label = '02 Icons preview'; Path = 'docs\ux\figma\02-icons\preview-tier1-5.png'; Review = $true }
)

$ts = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
$lines = New-Object System.Collections.Generic.List[string]
$lines.Add("# Poll Figma review - $ts")
$lines.Add('')
$lines.Add('Skrypt: gra/tools/poll-figma-review.ps1')
$lines.Add('')

$anyNew = $false
foreach ($c in $checks) {
  $full = Join-Path $projRoot $c.Path
  if (Test-Path $full) {
    $fi = Get-Item $full
    $lines.Add("- $($c.Label): OK $($c.Path) ($($fi.Length) B, $($fi.LastWriteTime.ToString('yyyy-MM-dd HH:mm')))")
    if ($c.Review) { $anyNew = $true }
  } else {
    $lines.Add("- $($c.Label): BRAK")
  }
}

$lines.Add('')
$lines.Add('## Werdykt')
if ($anyNew) {
  $lines.Add('Jest nowy plik do review - MASTER: wklej PNG w czacie Macieja.')
} else {
  $lines.Add('Brak nowych deliverable - czekamy Grupa E / lane UI.')
}

$dir = Split-Path $outFile -Parent
if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
$lines -join "`n" | Set-Content -Path $outFile -Encoding UTF8
Write-Output "Zapisano: $outFile"
