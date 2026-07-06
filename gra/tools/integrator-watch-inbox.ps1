# Integrator F — auto watch dyspozycji od Mastera (co 15 min)
param(
  [int]$IntervalSeconds = 900,
  [switch]$Once,
  [switch]$InitOnly
)

$ErrorActionPreference = 'Stop'
$projRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$statePath = Join-Path $projRoot 'docs\master\INTEGRATOR-INBOX-WATCH.json'

$watchFiles = @(
  'docs\obieg\INTEGRATOR-kolejka.md',
  'docs\obieg\INTEGRATOR-STAN.md',
  'dyspozycje\SILNIK-DO-MASTERA.md',
  'docs\czaty\DYSPOZYCJA-GRUPA-F.md'
)

$handoffDir = Join-Path $projRoot 'dyspozycje\_handoff'
if (Test-Path $handoffDir) {
  Get-ChildItem -LiteralPath $handoffDir -Filter '*.md' -File | ForEach-Object {
    $n = $_.Name.ToUpperInvariant()
    if ($n -match 'MASTER-do-INTEGRATOR|MASTER-do-GRUPA-F|MASTER-do-SILNIK') {
      $rel = 'dyspozycje\_handoff\' + $_.Name
      if ($watchFiles -notcontains $rel) { $watchFiles += $rel }
    }
  }
}

function Get-FileFingerprint {
  param([string]$FullPath)
  if (-not (Test-Path $FullPath)) { return $null }
  $item = Get-Item $FullPath
  $head = ''
  try {
    $head = (Get-Content -LiteralPath $FullPath -TotalCount 100 -Encoding UTF8) -join "`n"
  } catch { $head = '' }
  $flags = @()
  if ($head -match 'DO WPIECIA|DO WPI.CIA') { $flags += 'KOLEJKA' }
  if ($head -match 'MASTER-do|DYPOZYCJA') { $flags += 'DYPOZYCJA' }
  if ($head -match 'GOTOWE-KANON|GOTOWE-ROBOCZA') { $flags += 'GOTOWE' }
  return @{
    path = $FullPath
    mtime = $item.LastWriteTimeUtc.ToString('o')
    length = $item.Length
    flags = ($flags -join ',')
  }
}

function Load-State {
  if (Test-Path $statePath) {
    return Get-Content -LiteralPath $statePath -Raw -Encoding UTF8 | ConvertFrom-Json
  }
  return @{ files = @{}; lastTick = ''; intervalSeconds = 900 }
}

function Save-State($state) {
  $dir = Split-Path $statePath -Parent
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  $state | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $statePath -Encoding UTF8
}

function Scan-Inbox {
  param([object]$prevState)
  $changed = @()
  $newState = @{
    files = @{}
    lastTick = (Get-Date).ToUniversalTime().ToString('o')
    intervalSeconds = $IntervalSeconds
    watchCount = $watchFiles.Count
  }
  foreach ($rel in $watchFiles) {
    $full = Join-Path $projRoot $rel
    $fp = Get-FileFingerprint $full
    if ($null -eq $fp) { continue }
    $key = $rel -replace '\\', '/'
    $newState.files[$key] = $fp
    $prev = $null
    if ($prevState.files -and ($prevState.files.PSObject.Properties.Name -contains $key)) {
      $prev = $prevState.files.$key
    }
    if ($null -eq $prev -or $prev.mtime -ne $fp.mtime -or $prev.length -ne $fp.length) {
      $changed += [PSCustomObject]@{ file = $key; flags = $fp.flags; mtime = $fp.mtime }
    }
  }
  $kanonPath = Join-Path $projRoot 'Gra-podglad.html'
  $md5 = ''
  if (Test-Path $kanonPath) { $md5 = (Get-FileHash -LiteralPath $kanonPath -Algorithm MD5).Hash }
  return @{ changed = $changed; state = $newState; kanonMd5 = $md5 }
}

function Emit-Tick {
  param($scan, [bool]$force)
  $sentinel = 'AGENT_LOOP_TICK_INTEGRATOR_F'
  $hasWork = $force -or $scan.changed.Count -gt 0
  if (-not $hasWork) {
    $p = @{ prompt = 'start F (auto-watch): brak zmian w kolejce - jedna linia OK.'; changed = @() } | ConvertTo-Json -Compress
    Write-Output "$sentinel $p"
    return
  }
  $prompt = @'
start Integrator F (auto-watch co 15 min):
1) docs/obieg/INTEGRATOR-kolejka.md sekcja DO WPIECIA
2) dyspozycje/_handoff/MASTER-do-INTEGRATOR* / MASTER-do-GRUPA-F*
3) Bez wpisu w DO WPIECIA = NIE koduj (nawet jesli handoff w repo)
4) Nowa dyspozycja: krotko Maciejowi + wykonaj batch + bramka + meldunek MASTER
'@
  $payload = @{
    prompt = $prompt.Trim()
    changed = @($scan.changed | ForEach-Object { $_.file })
    kanonMd5 = $scan.kanonMd5
  } | ConvertTo-Json -Compress
  Write-Output "$sentinel $payload"
}

$prev = Load-State
$scan = Scan-Inbox $prev
Save-State $scan.state

if ($InitOnly) {
  Write-Host "INTEGRATOR-INBOX-WATCH init OK interval=${IntervalSeconds}s files=$($scan.state.watchCount)"
  exit 0
}

Emit-Tick $scan $true | Out-Host
if ($Once) { exit 0 }

while ($true) {
  Start-Sleep -Seconds $IntervalSeconds
  $prev = Load-State
  $scan = Scan-Inbox $prev
  Save-State $scan.state
  Emit-Tick $scan $false | Out-Host
}
