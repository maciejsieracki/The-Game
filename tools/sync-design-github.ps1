# sync-design-github.ps1 — pull z GitHub po turze Design (Lane UI przy Maciej START)
param(
  [string]$Branch = 'main',
  [switch]$PullOnly,
  [switch]$WhatIf
)

$ErrorActionPreference = 'Stop'
$projRoot = Split-Path $PSScriptRoot -Parent
$logFile = Join-Path $projRoot 'docs\obieg\_sync-design-github-last.md'

Set-Location $projRoot

function Write-Log($lines) {
  $dir = Split-Path $logFile -Parent
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  $ts = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
  $header = @("# Sync Design GitHub - $ts", '')
  ($header + $lines) -join [Environment]::NewLine | Set-Content -LiteralPath $logFile -Encoding UTF8
}

$remote = git remote get-url origin 2>$null
if (-not $remote) {
  Write-Log @(
    '## Werdykt', 'BLOCKED - brak git remote origin.',
    '', 'Maciej: utworz repo GitHub + git remote add origin <url>',
    'Patrz: docs/ux/claude-design/WORKFLOW-GITHUB-SYNC.md'
  )
  Write-Host 'BLOCKED: no git remote origin'
  exit 2
}

if ($WhatIf) {
  Write-Host "Would: git pull origin $Branch"
  exit 0
}

$pullOut = git pull origin $Branch 2>&1 | Out-String
$pullCode = $LASTEXITCODE

$brandBook = Join-Path $projRoot 'docs\ux\claude-design\01-propozycje-z-design\brand-book'
$fileCount = 0
if (Test-Path $brandBook) {
  $fileCount = (Get-ChildItem -LiteralPath $brandBook -Recurse -File -ErrorAction SilentlyContinue).Count
}

if ($pullCode -ne 0) {
  Write-Log @(
    '## Werdykt', 'BLOCKED - git pull failed.', '',
    "Branch: $Branch", "Remote: $remote", '', '```', $pullOut.Trim(), '```'
  )
  Write-Host "git pull FAILED: $pullOut"
  exit 1
}

Write-Log @(
  '## Werdykt', 'OK - git pull completed.', '',
  "Branch: $Branch", "Remote: $remote", '',
  '```', $pullOut.Trim(), '```', '',
  "Plikow w brand-book/: $fileCount"
)
Write-Host "OK pull. brand-book files: $fileCount"
Write-Host $pullOut
