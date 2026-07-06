# Audyt wdrożenia ABC + handoff do Mastera
# Master hub: cd gra ; .\tools\audyt-abc-handoff.ps1
# Grupa (agent): ten sam skrypt z -Grupa A|B|C|D|E

param(
  [ValidateSet('A', 'B', 'C', 'D', 'E', 'F', 'ALL')]
  [string]$Grupa = 'ALL'
)

$ErrorActionPreference = 'Stop'
$graRoot = Split-Path $PSScriptRoot -Parent
$projRoot = Split-Path $graRoot -Parent
$rejestr = Join-Path $projRoot 'docs\obieg\REJESTR-DECYZJI.md'
$dyspozycje = Join-Path $projRoot 'dyspozycje'
$handoffDir = Join-Path $dyspozycje '_handoff'

function Test-GrupaMatch {
  param([string]$Text, [string]$G)
  if ($G -eq 'ALL') { return $true }
  if ($Text -match '\bALL\b|wszystkie|A–E|A-E') { return $true }
  return ($Text -match "\b$G\b|Grupa $G|\($G\)")
}

Write-Host ''
Write-Host '=== AUDYT WDROZENIA ABC + HANDOFF MASTER ===' -ForegroundColor Cyan
Write-Host "Zakres: $Grupa · $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
Write-Host ''

# 1) Otwarte decyzje z rejestru (nie WDROZONA / ZWERYFIKOWANA / ODRZUCONA)
Write-Host '--- 1. REJESTR DECYZJI (otwarte) ---' -ForegroundColor Yellow
$openCount = 0
if (Test-Path $rejestr) {
  $inOpen = $false
  Get-Content $rejestr -Encoding UTF8 | ForEach-Object {
    if ($_ -match 'DECYZJE OTWARTE') { $inOpen = $true; return }
    if ($inOpen -and $_ -match '^## ') { $inOpen = $false; return }
    if (-not $inOpen) { return }
    if ($_ -notmatch '^\|') { return }
    if ($_ -match '^\|---') { return }
    if ($_ -match '^\| ID ') { return }
    if ($_ -match 'WDROZONA|WDROŻONA|ZWERYFIKOWANA|ODRZUCONA|HUB OK') { return }
    if ($_ -match 'ZAPISANA|W TRAKCIE|U INTEGRATORA|W TOKU|OTWARTE') {
      $cols = ($_ -split '\|') | ForEach-Object { $_.Trim() } | Where-Object { $_ }
      if ($cols.Count -ge 4) {
        $id = $cols[0]
        $grp = $cols[3]
        $status = $cols[4]
        if (Test-GrupaMatch $grp $Grupa) {
          Write-Host "  $id | $grp | $status"
          $openCount++
        }
      }
    }
  }
}
if ($openCount -eq 0) { Write-Host '  (brak otwartych w rejestrze dla zakresu)' -ForegroundColor DarkGray }

# 2) Meldunki GOTOWE w *-DO-MASTERA.md
Write-Host ''
Write-Host '--- 2. MELDUNKI -> MASTER: GOTOWE* ---' -ForegroundColor Yellow
$meldCount = 0
Get-ChildItem $dyspozycje -Filter '*-DO-MASTERA.md' -File | ForEach-Object {
  $lane = $_.BaseName -replace '-DO-MASTERA$',''
  if ($Grupa -ne 'ALL') {
    $laneLetter = switch -Regex ($lane) {
      '^(UI|MAPA|EKONOMIA|UNITS|CYWILIZACJE|SILNIK|AI|DYPLOMACJA|MIASTO)' {
        switch ($matches[1]) {
          'MAPA' { 'A' }; 'EKONOMIA' { 'B' }; 'MIASTO' { 'B' }
          'UNITS' { 'C' }; 'UI' { 'E' }
          'CYWILIZACJE' { 'D' }; 'AI' { 'D' }; 'DYPLOMACJA' { 'D' }
          'SILNIK' { 'F' }; default { '?' }
        }
      }
      default { '?' }
    }
    if ($laneLetter -ne $Grupa) { return }
  }
  $hits = Select-String -Path $_.FullName -Pattern 'MASTER:\s*GOTOWE' -AllMatches
  foreach ($h in $hits) {
    $line = ($h.Line -replace '\s+', ' ').Trim()
    if ($line.Length -gt 100) { $line = $line.Substring(0, 97) + '...' }
    Write-Host "  [$lane] L$($h.LineNumber): $line"
    $meldCount++
  }
}
if ($meldCount -eq 0) { Write-Host '  (brak flag GOTOWE w meldunkach)' -ForegroundColor DarkGray }

# 3) Handoffy do Mastera (ostatnie 14 dni)
Write-Host ''
Write-Host '--- 3. HANDOFFY *_handoff/*-do-MASTER* (14 dni) ---' -ForegroundColor Yellow
$cutoff = (Get-Date).AddDays(-14)
$hfCount = 0
Get-ChildItem $handoffDir -Filter '*-do-MASTER*.md' -File |
  Where-Object { $_.LastWriteTime -ge $cutoff } |
  Sort-Object LastWriteTime -Descending |
  ForEach-Object {
    $name = $_.Name
    if ($Grupa -ne 'ALL' -and $name -notmatch "^$Grupa-do-MASTER|^UI-do-MASTER|^EKONOMIA-do-MASTER|^UNITS-do-MASTER|^CYWILIZACJE-do-MASTER|^MAPA-do-MASTER") {
      if ($Grupa -eq 'A' -and $name -notmatch 'MAPA-do-MASTER|A-do-MASTER') { return }
      if ($Grupa -eq 'B' -and $name -notmatch 'EKONOMIA-do-MASTER|B-do-MASTER|MIASTO-do-MASTER') { return }
      if ($Grupa -eq 'C' -and $name -notmatch 'UNITS-do-MASTER|C-do-MASTER') { return }
      if ($Grupa -eq 'D' -and $name -notmatch 'CYWILIZACJE-do-MASTER|D-do-MASTER|AI-do-MASTER|DYPLOMACJA-do-MASTER') { return }
      if ($Grupa -eq 'E' -and $name -notmatch 'UI-do-MASTER|E-do-MASTER') { return }
      if ($Grupa -eq 'F' -and $name -notmatch 'F-do-MASTER|SILNIK-do-MASTER') { return }
    }
    Write-Host ("  {0:yyyy-MM-dd} {1}" -f $_.LastWriteTime, $name)
    $hfCount++
  }
if ($hfCount -eq 0) { Write-Host '  (brak recent handoffow)' -ForegroundColor DarkGray }

# 4) Kanon md5
Write-Host ''
Write-Host '--- 4. GRY (md5) ---' -ForegroundColor Yellow
foreach ($rel in @('gra-kanon\Gra-podglad.html', 'gra-robocza\Gra-podglad.html')) {
  $p = Join-Path $projRoot $rel
  if (Test-Path $p) {
    $h = (Get-FileHash $p -Algorithm MD5).Hash.Substring(0, 16)
    Write-Host "  $rel : $h..."
  } else {
    Write-Host "  $rel : BRAK" -ForegroundColor DarkYellow
  }
}

Write-Host ''
Write-Host '=== KONIEC AUDYTU ===' -ForegroundColor Cyan
Write-Host 'Grupa: odpowiedz Maciejowi w 3 sekcjach (komendy-raport: audyt wdrozenia).'
Write-Host 'Master: porownaj z INTEGRATOR-kolejka + MASTER-WATCH.'
