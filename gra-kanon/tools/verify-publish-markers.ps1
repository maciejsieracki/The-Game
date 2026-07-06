# Strażnik publishu — grep markerow w bundlu (DESIGN-RZEKI PILNE, civ-workflow).
# Uzycie: .\tools\verify-publish-markers.ps1 [-BundlePath path\to\Gra-podglad.html]

param(
  [Parameter(Mandatory = $false)]
  [string]$BundlePath = ''
)

$ErrorActionPreference = 'Stop'
$roboczaRoot = Split-Path $PSScriptRoot -Parent
if (-not $BundlePath) {
  $BundlePath = Join-Path $roboczaRoot 'Gra-podglad.html'
}
if (-not (Test-Path $BundlePath)) {
  throw "Brak bundla: $BundlePath"
}

$text = Get-Content -Raw -Encoding UTF8 $BundlePath
$md5 = (Get-FileHash $BundlePath -Algorithm MD5).Hash.ToLower()

$checks = @(
  @{ name = 'civ-map-load-overlay'; pattern = 'civ-map-load-overlay'; min = 1 }
  @{ name = 'frustumCulled'; pattern = 'frustumCulled'; min = 1 }
  @{ name = 'CIV_BUNDLE_MARKER'; pattern = 'CIV-BUNDLE-MARKER-map-perf-20260705-c3'; min = 1 }
  @{ name = 'build stamp (not pending)'; pattern = 'CIV-BUILD-STAMP-PENDING'; min = 0; max = 0 }
  @{ name = 'async buildScene hint'; pattern = 'Budowanie'; min = 1 }
  @{ name = 'C2b elapsed timer'; pattern = 'civ-map-load-elapsed'; min = 1 }
  @{ name = 'perf debug F9'; pattern = 'civ-perf-debug-overlay'; min = 1 }
)

$failed = @()
foreach ($c in $checks) {
  $count = ([regex]::Matches($text, [regex]::Escape($c.pattern))).Count
  $ok = $count -ge $c.min
  if ($null -ne $c.max) { $ok = $ok -and ($count -le $c.max) }
  $status = if ($ok) { 'OK' } else { 'FAIL' }
  Write-Host ("[{0}] {1}: {2} (need>={3})" -f $status, $c.name, $count, $c.min)
  if (-not $ok) { $failed += $c.name }
}

Write-Host "MD5: $md5"
Write-Host "Bundle: $BundlePath"

if ($failed.Count -gt 0) {
  throw "Straznik publishu FAIL: $($failed -join ', ')"
}

Write-Host 'Straznik publishu: PASS' -ForegroundColor Green
