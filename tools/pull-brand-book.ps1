# pull-brand-book.ps1 — rozpakuj export Design z inbox do kanonu OneDrive
# Uruchamia Lane UI przy Maciej START (Cursor)
param(
  [string]$InboxDir = '',
  [string]$TargetDir = '',
  [switch]$WhatIf
)

$ErrorActionPreference = 'Stop'
$projRoot = Split-Path $PSScriptRoot -Parent
if (-not $InboxDir) {
  $InboxDir = Join-Path $projRoot 'docs\ux\claude-design\_staging\inbox'
}
if (-not $TargetDir) {
  $TargetDir = Join-Path $projRoot 'docs\ux\claude-design\01-propozycje-z-design\brand-book'
}
$archiveDir = Join-Path $InboxDir '_archiwum'
$logFile = Join-Path $projRoot 'docs\obieg\_pull-brand-book-last.md'
$wymianaFile = Join-Path $projRoot 'docs\ux\claude-design\WYMIANA-UI-DESIGN.md'

function Write-Log($lines) {
  $dir = Split-Path $logFile -Parent
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  $ts = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
  $header = @("# Pull brand-book - $ts", '')
  ($header + $lines) -join [Environment]::NewLine | Set-Content -LiteralPath $logFile -Encoding UTF8
}

if (-not (Test-Path $InboxDir)) {
  New-Item -ItemType Directory -Path $InboxDir -Force | Out-Null
  Write-Log @(
    '## Werdykt', 'BRAK inbox - utworzono folder.', '',
    "Inbox: $InboxDir", '',
    'Design: na koniec tury export brand-book.zip tutaj.'
  )
  Write-Host "INBOX EMPTY (folder created): $InboxDir"
  exit 0
}

$zips = Get-ChildItem -LiteralPath $InboxDir -Filter 'brand-book*.zip' -File -ErrorAction SilentlyContinue |
  Sort-Object LastWriteTime -Descending

if (-not $zips -or $zips.Count -eq 0) {
  Write-Log @(
    '## Werdykt', 'BRAK zip w inbox - czekam na export Design.', '',
    "Inbox: $InboxDir", '',
    'Po turze Design: zapisz brand-book.zip w inbox, potem Maciej START (Cursor).'
  )
  Write-Host "NO ZIP in inbox: $InboxDir"
  exit 0
}

$zip = $zips[0]
Write-Host "Using zip: $($zip.FullName)"

if (-not (Test-Path $TargetDir)) {
  New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
}

$tempDir = Join-Path ([System.IO.Path]::GetTempPath()) ("civ-brand-book-" + [guid]::NewGuid().ToString('n'))
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

try {
  if ($WhatIf) {
    Write-Host "WhatIf: Expand $($zip.Name) -> $TargetDir"
    exit 0
  }
  Expand-Archive -LiteralPath $zip.FullName -DestinationPath $tempDir -Force

  # Zip moze miec korzen brand-book/ lub pliki od razu w korzeniu
  $sourceRoot = $tempDir
  $nested = Join-Path $tempDir 'brand-book'
  if (Test-Path $nested) { $sourceRoot = $nested }

  Get-ChildItem -LiteralPath $sourceRoot -Force | ForEach-Object {
    $dest = Join-Path $TargetDir $_.Name
    if ($_.PSIsContainer) {
      if (Test-Path $dest) { Remove-Item -LiteralPath $dest -Recurse -Force }
      Copy-Item -LiteralPath $_.FullName -Destination $dest -Recurse -Force
    } else {
      Copy-Item -LiteralPath $_.FullName -Destination $dest -Force
    }
  }

  if (-not (Test-Path $archiveDir)) { New-Item -ItemType Directory -Path $archiveDir -Force | Out-Null }
  $archName = $zip.BaseName + '_' + (Get-Date -Format 'yyyyMMdd-HHmmss') + $zip.Extension
  Move-Item -LiteralPath $zip.FullName -Destination (Join-Path $archiveDir $archName) -Force

  $fileCount = (Get-ChildItem -LiteralPath $TargetDir -Recurse -File).Count
  Write-Log @(
    '## Werdykt', 'OK - rozpakowano do kanonu.', '',
    "Zip: $($zip.Name)", "Plikow w brand-book/: $fileCount", "Cel: $TargetDir", '',
    'Archiwum zip: _staging/inbox/_archiwum/'
  )
  Write-Host "OK: $fileCount files in $TargetDir"
} finally {
  if (Test-Path $tempDir) { Remove-Item -LiteralPath $tempDir -Recurse -Force -ErrorAction SilentlyContinue }
}
