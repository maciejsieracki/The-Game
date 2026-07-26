#Requires -Version 5.1
<#
.SYNOPSIS
  Self-test Grupy A-E przed handoffem do Integratora (ISO-5).
  Buduje własną wersję do %TEMP%\civ-<Grupa> — NIE dotyka kanonu/ROBOCZA.
#>
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('A', 'B', 'C', 'D', 'E')]
    [string]$Grupa,
    [switch]$NoOpen
)

$ErrorActionPreference = 'Stop'
$gra = Split-Path -Parent $PSScriptRoot
Set-Location $gra

Write-Host "=== Grupa $Grupa self-test ===" -ForegroundColor Cyan

Write-Host "[1/4] typecheck..."
npx tsc --noEmit
if ($LASTEXITCODE -ne 0) {
    Write-Warning "typecheck FAIL (poza grupa) - kontynuuje testy obszaru"
}

$tests = @('logic-test.cjs', 'smoke.cjs')
switch ($Grupa) {
    'A' { $tests += @() }
    'B' { $tests += @('currency-test.cjs', 'grupa-b-lane-test.cjs', 'empire-food-b5-test.cjs') }
    'C' { $tests += @('combat-test.cjs', 'siege-ai-test.cjs') }
    'D' { $tests += @('ai-test.cjs', 'diplomacy-test.cjs') }
    'E' { $tests += @('victory-test.cjs', 'barbarians-test.cjs') }
}

Write-Host "[2/4] testy obszaru + wspólne..."
foreach ($t in $tests) {
    $p = Join-Path $gra "tools\$t"
    if (-not (Test-Path $p)) {
        Write-Warning "Pomijam brak: $t"
        continue
    }
    Write-Host "  -> $t"
    node $p
    if ($LASTEXITCODE -ne 0) { throw "$t FAIL" }
}

$outDir = Join-Path $env:TEMP "civ-$Grupa"
Write-Host "[3/4] build -> $outDir"
npx vite build --outDir $outDir
if ($LASTEXITCODE -ne 0) { throw "vite build FAIL" }

$srcHtml = Join-Path $outDir 'index.html'
$destHtml = Join-Path (Split-Path -Parent $gra) "Gra-podglad-$Grupa.html"
Copy-Item $srcHtml $destHtml -Force

$md5 = (Get-FileHash $destHtml -Algorithm MD5).Hash.ToLower()
Write-Host "[4/4] OK Gra-podglad-$Grupa.html md5: $md5" -ForegroundColor Green

if (-not $NoOpen) {
    Start-Process $destHtml
}

Write-Host "SELF-TEST ZIELONY (Grupa $Grupa)"
