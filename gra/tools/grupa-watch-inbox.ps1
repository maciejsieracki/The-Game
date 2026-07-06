# Grupa A-E — auto watch dyspozycji od Mastera (co 15 min)
# Domyslnie: -Auto (litera z dyspozycji czatu, bez wpisywania przez Macieja)
param(
  [ValidateSet('A', 'B', 'C', 'D', 'E', 'F')]
  [string]$Grupa,
  [switch]$Auto,
  [string]$Dyspozycja,
  [int]$IntervalSeconds = 900,
  [switch]$Once,
  [switch]$InitOnly
)

$ErrorActionPreference = 'Stop'
$projRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent

$GroupConfig = @{
  A = @{
    obieg = 'docs\obieg\A-mapa.md'
    patterns = @('MAPA', 'GRUPA-A', 'MASTER-do-MAPA', 'MASTER-do-GRUPA-A')
  }
  B = @{
    obieg = 'docs\obieg\B-ekonomia.md'
    patterns = @('EKONOMIA', 'MIASTO', 'GRUPA-B', 'MASTER-do-GRUPA-B')
  }
  C = @{
    obieg = 'docs\obieg\C-walka.md'
    patterns = @('UNITS', 'GRUPA-C', 'MASTER-do-GRUPA-C', 'MASTER-do-UNITS')
  }
  D = @{
    obieg = 'docs\obieg\D-cywilizacje.md'
    patterns = @('CYWILIZACJE', 'DYPLOMACJI', 'GRUPA-D', 'MASTER-do-GRUPA-D', 'MASTER-do-CYW')
  }
  E = @{
    obieg = 'docs\obieg\E-start.md'
    patterns = @('UI', 'GRUPA-E', 'MASTER-do-GRUPA-E', 'MASTER-do-UI')
  }
  F = @{
    obieg = 'docs\obieg\INTEGRATOR-kolejka.md'
    extra = @('dyspozycje\INTEGRATOR-STAN.md', 'docs\obieg\MASTER-WATCH.md')
    patterns = @('INTEGRATOR', 'GRUPA-F', 'SILNIK', 'MASTER-do-GRUPA-F', 'MASTER-do-INTEGRATOR', 'F-do-MASTER')
  }
}

function Resolve-LaneLetter {
  param([string]$Letter, [bool]$UseAuto, [string]$DyspozycjaPath)

  if ($Letter) { return $Letter.ToUpperInvariant() }

  $dysp = $DyspozycjaPath
  if (-not $dysp -and $env:CIV_WATCH_DYSPOZYCJA) { $dysp = $env:CIV_WATCH_DYSPOZYCJA }
  if ($dysp -and -not [System.IO.Path]::IsPathRooted($dysp)) {
    $candidates = @(
      (Join-Path $projRoot $dysp),
      (Join-Path (Split-Path $PSScriptRoot -Parent) $dysp)
    )
    $resolved = $null
    foreach ($c in $candidates) {
      if (Test-Path -LiteralPath $c) {
        $resolved = (Resolve-Path -LiteralPath $c).Path
        break
      }
    }
    if ($resolved) { $dysp = $resolved }
    else { $dysp = Join-Path $projRoot $dysp }
  }

  if ($dysp -and (Test-Path -LiteralPath $dysp)) {
    $name = Split-Path $dysp -Leaf
    if ($name -match 'DYSPOZYCJA-GRUPA-([A-F])') { return $Matches[1] }
    $head = (Get-Content -LiteralPath $dysp -TotalCount 20 -Encoding UTF8) -join "`n"
    if ($head -match 'docs/obieg/([A-F])-') { return $Matches[1] }
    if ($head -match 'GRUPA F|Grupa F') { return 'F' }
    throw "Nie mozna odczytac litery grupy z: $dysp"
  }

  if ($UseAuto) {
    $czaty = Join-Path $projRoot 'docs\czaty'
    $pick = Get-ChildItem -LiteralPath $czaty -Filter 'DYSPOZYCJA-GRUPA-?.md' -File -ErrorAction SilentlyContinue |
      Where-Object { $_.Name -match 'DYSPOZYCJA-GRUPA-([A-F])\.md$' } |
      Sort-Object LastWriteTimeUtc -Descending |
      Select-Object -First 1
    if ($pick -and ($pick.Name -match 'DYSPOZYCJA-GRUPA-([A-F])')) {
      Write-Host "Auto (fallback mtime): grupa $($Matches[1]) <- $($pick.Name)"
      return $Matches[1]
    }
  }

  throw @'
Brak litery grupy. Agent (nie Maciej): uruchom z dyspozycji TEGO czatu, np.:
  .\tools\grupa-watch-inbox.ps1 -Auto -Dyspozycja docs/czaty/DYSPOZYCJA-GRUPA-C.md
'@
}

if (-not $Grupa) { $Auto = $true }
$Grupa = Resolve-LaneLetter -Letter $Grupa -UseAuto:$Auto -DyspozycjaPath $Dyspozycja

$statePath = Join-Path $projRoot "docs\master\GRUPA-INBOX-WATCH-$Grupa.json"

function Get-WatchList {
  param([string]$Letter)
  $cfg = $GroupConfig[$Letter]
  $list = @($cfg.obieg, 'docs\obieg\REJESTR-DECYZJI.md')
  if ($cfg.extra) { $list += $cfg.extra }
  $handoffDir = Join-Path $projRoot 'dyspozycje\_handoff'
  if (Test-Path $handoffDir) {
    Get-ChildItem -LiteralPath $handoffDir -Filter '*.md' -File | ForEach-Object {
      $name = $_.Name.ToUpperInvariant()
      foreach ($pat in $cfg.patterns) {
        if ($name -like "*$($pat.ToUpperInvariant())*") {
          $rel = 'dyspozycje\_handoff\' + $_.Name
          if ($list -notcontains $rel) { $list += $rel }
          break
        }
      }
    }
  }
  $outboxDir = Join-Path $projRoot 'docs\obieg'
  Get-ChildItem -LiteralPath $outboxDir -Filter "SLACK-OUTBOX-GRUPA-$Letter*.md" -File -ErrorAction SilentlyContinue | ForEach-Object {
    $rel = 'docs\obieg\' + $_.Name
    if ($list -notcontains $rel) { $list += $rel }
  }
  if ($Letter -eq 'F') {
    Get-ChildItem -LiteralPath $outboxDir -Filter 'SLACK-OUTBOX*.md' -File -ErrorAction SilentlyContinue | ForEach-Object {
      $rel = 'docs\obieg\' + $_.Name
      if ($list -notcontains $rel) { $list += $rel }
    }
  }
  return $list
}

function Get-FileFingerprint {
  param([string]$FullPath)
  if (-not (Test-Path $FullPath)) { return $null }
  $item = Get-Item $FullPath
  $head = ''
  try {
    $head = (Get-Content -LiteralPath $FullPath -TotalCount 80 -Encoding UTF8) -join "`n"
  } catch { $head = '' }
  $flags = @()
  if ($head -match 'DYPOZYCJA|Do:\s*Grupa|MASTER-do') { $flags += 'DYPOZYCJA' }
  if ($head -match 'GOTOWE|DoD|AC ') { $flags += 'HANDOFF' }
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
  return @{ files = @{}; lastTick = ''; intervalSeconds = 900; grupa = $Grupa }
}

function Save-State($state) {
  $dir = Split-Path $statePath -Parent
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  $state | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $statePath -Encoding UTF8
}

function Scan-Inbox {
  param([object]$prevState, [string]$Letter)
  $watchFiles = Get-WatchList $Letter
  $changed = @()
  $newState = @{
    files = @{}
    lastTick = (Get-Date).ToUniversalTime().ToString('o')
    intervalSeconds = $IntervalSeconds
    grupa = $Letter
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
  return @{ changed = $changed; state = $newState }
}

function Emit-Tick {
  param($scan, [string]$Letter, [bool]$force)
  $sentinel = "AGENT_LOOP_TICK_GRUPA_$Letter"
  $hasWork = $force -or $scan.changed.Count -gt 0
  if (-not $hasWork) {
    $payload = @{ prompt = "start grupy $Letter (auto-watch): brak zmian - jedna linia OK."; changed = @() } | ConvertTo-Json -Compress
    Write-Output "$sentinel $payload"
    return
  }
  $obiegName = $GroupConfig[$Letter].obieg -replace '.*\\', ''
  $extraHint = if ($Letter -eq 'F') { "`n4) dyspozycje/_handoff/MASTER-do-GRUPA-F* · F-do-MASTER* · md5 Gra-podglad.html" } else { '' }
  $prompt = @"
start grupa $Letter (auto-watch, obieg 2026-06-30):
1) docs/obieg/$obiegName - tracker i dyspozycje
2) zmienione handoffy MASTER-do-* / *-do-lane* (lista w JSON changed)
3) REJESTR-DECYZJI - nowe ABC dla grupy $Letter$extraHint
Pliki > Slack. Jesli nowa dyspozycja od Mastera: krotko Maciejowi co robic (A/B/C lub dzialaj). Jesli szum: jedna linia OK.
"@
  $payload = @{
    prompt = $prompt.Trim()
    changed = @($scan.changed | ForEach-Object { $_.file })
    grupa = $Letter
  } | ConvertTo-Json -Compress
  Write-Output "$sentinel $payload"
}

$prev = Load-State
$scan = Scan-Inbox $prev $Grupa
Save-State $scan.state

if ($InitOnly) {
  Write-Host "GRUPA-INBOX-WATCH-$Grupa init OK interval=${IntervalSeconds}s files=$($scan.state.watchCount)"
  exit 0
}

Emit-Tick $scan $Grupa $true | Out-Host
if ($Once) { exit 0 }

while ($true) {
  Start-Sleep -Seconds $IntervalSeconds
  $prev = Load-State
  $scan = Scan-Inbox $prev $Grupa
  Save-State $scan.state
  Emit-Tick $scan $Grupa $false | Out-Host
}
