# Master hub — auto START co N sekund (domyślnie 15 min)
# Priorytet: pliki (_handoff, *-DO-MASTERA, INTEGRATOR-kolejka) > Slack MCP
param(
  [int]$IntervalSeconds = 900,
  [switch]$Once,
  [switch]$InitOnly
)

$ErrorActionPreference = 'Stop'
$projRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$statePath = Join-Path $projRoot 'docs\master\MASTER-INBOX-WATCH.json'

function Get-WatchList {
  $list = @(
    'docs\obieg\MASTER-WATCH.md',
    'docs\obieg\INTEGRATOR-kolejka.md',
    'dyspozycje\INTEGRATOR-STAN.md',
    'dyspozycje\SILNIK-DO-MASTERA.md',
    'dyspozycje\DZIENNIK-MASTERA.md',
    'dyspozycje\MAPA-DO-MASTERA.md',
    'dyspozycje\UNITS-DO-MASTERA.md',
    'dyspozycje\EKONOMIA-DO-MASTERA.md',
    'dyspozycje\CYWILIZACJE-DO-MASTERA.md',
    'dyspozycje\UI-DO-MASTERA.md'
  )
  $handoffDir = Join-Path $projRoot 'dyspozycje\_handoff'
  if (Test-Path $handoffDir) {
    Get-ChildItem -LiteralPath $handoffDir -Filter '*.md' -File | ForEach-Object {
      if ($_.Name -match 'MASTER|do-MASTER') {
        $rel = 'dyspozycje\_handoff\' + $_.Name
        if ($list -notcontains $rel) { $list += $rel }
      }
    }
  }
  $outboxDir = Join-Path $projRoot 'docs\obieg'
  Get-ChildItem -LiteralPath $outboxDir -Filter 'SLACK-OUTBOX*.md' -File -ErrorAction SilentlyContinue | ForEach-Object {
    $rel = 'docs\obieg\' + $_.Name
    if ($list -notcontains $rel) { $list += $rel }
  }
  return $list
}

function Get-FileFingerprint {
  param([string]$FullPath)
  if (-not (Test-Path $FullPath)) { return $null }
  $item = Get-Item $FullPath
  $head = ''
  try {
    $head = (Get-Content -LiteralPath $FullPath -TotalCount 120 -Encoding UTF8) -join "`n"
  } catch { $head = '' }
  $flags = @()
  if ($head -match 'MASTER:\s*GOTOWE-KANON') { $flags += 'MASTER:GOTOWE-KANON' }
  elseif ($head -match 'MASTER:\s*GOTOWE') { $flags += 'MASTER:GOTOWE' }
  if ($head -match 'GOTOWE-ROBOCZA') { $flags += 'GOTOWE-ROBOCZA' }
  if ($head -match 'GOTOWE-KANON') { $flags += 'GOTOWE-KANON' }
  if ($head -match 'md5:.*?([a-f0-9]{32})') { $flags += "md5:$($Matches[1])" }
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
  return @{ files = @{}; lastMd5 = ''; lastTick = ''; intervalSeconds = 900 }
}

function Save-State($state) {
  $dir = Split-Path $statePath -Parent
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  $state | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $statePath -Encoding UTF8
}

function Scan-Inbox {
  param([object]$prevState)

  $watchFiles = Get-WatchList
  $changed = @()
  $newState = @{
    files = @{}
    lastMd5 = $prevState.lastMd5
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
      $changed += [PSCustomObject]@{
        file = $key
        flags = $fp.flags
        mtime = $fp.mtime
      }
    }
  }

  $kanonPath = Join-Path $projRoot 'Gra-podglad.html'
  if (Test-Path $kanonPath) {
    $md5 = (Get-FileHash -LiteralPath $kanonPath -Algorithm MD5).Hash
    $newState.lastMd5 = $md5
  }

  return @{
    changed = $changed
    state = $newState
    md5Changed = ($newState.lastMd5 -and $newState.lastMd5 -ne $prevState.lastMd5)
    pendingFlags = @($changed | Where-Object { $_.flags -match 'MASTER:GOTOWE|GOTOWE-KANON' })
  }
}

function Emit-Tick {
  param($scan, [bool]$force)

  $hasWork = $force -or $scan.changed.Count -gt 0 -or $scan.md5Changed -or $scan.pendingFlags.Count -gt 0
  if (-not $hasWork) {
    Write-Output "AGENT_LOOP_TICK_MASTER_INBOX $(@{ prompt = 'start (auto-watch): brak zmian w plikach — jedna linia OK dla Macieja.'; changed = @(); silnikMd5 = $scan.state.lastMd5; md5Changed = $false } | ConvertTo-Json -Compress)"
    return
  }

  $prompt = @'
start (auto-watch Master hub) — ZASADA: dyspozycja (krok 1) → WYKONANIE (krok 2) w tej samej turze:
1) docs/obieg/MASTER-WATCH.md + INTEGRATOR-kolejka.md + MASTER-ZADANIA.md
2) dyspozycje/_handoff/*MASTER* + SILNIK-DO-MASTERA (GOTOWE-ROBOCZA)
3) md5 ROBOCZA vs finalna
KROK 2 obowiązkowy:
- lane GOTOWE → dyspozycja F + uruchom F (Task subagent)
- F GOTOWE-ROBOCZA → weryfikacja + review + promocja finalna + następny batch
Zakaz: "czeka u F/Master" bez wykonania. Maciejowi: co ZROBIONO, nie co czeka.
'@

  $payload = @{
    prompt = $prompt.Trim()
    changed = @($scan.changed | ForEach-Object { $_.file })
    flags = @($scan.pendingFlags | ForEach-Object { "$($_.file):$($_.flags)" })
    kanonMd5 = $scan.state.lastMd5
    md5Changed = $scan.md5Changed
  } | ConvertTo-Json -Compress

  Write-Output "AGENT_LOOP_TICK_MASTER_INBOX $payload"
}

# --- main ---
$prev = Load-State
$scan = Scan-Inbox $prev
Save-State $scan.state

if ($InitOnly) {
  Write-Host "MASTER-INBOX-WATCH init OK · interval=${IntervalSeconds}s · files=$($scan.state.watchCount) · kanon md5=$($scan.state.lastMd5)"
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
