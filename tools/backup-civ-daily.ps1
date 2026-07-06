# Civ daily backup — full copy outside OneDrive sync tree
# Usage: powershell -ExecutionPolicy Bypass -File tools\backup-civ-daily.ps1

$ErrorActionPreference = 'Continue'

$Source     = 'C:\Users\macie\OneDrive - NASTER S.A\_NOWA_STRUKTURA\06_Prywatne\Gry\Civ'
$BackupRoot = 'C:\Users\macie\Backups\Civ'
$RetentionSnapshots = 14

if (-not (Test-Path -LiteralPath $Source)) {
    Write-Error "Source not found: $Source"
    exit 1
}

foreach ($sub in @('snapshots', 'latest', 'logs')) {
    $p = Join-Path $BackupRoot $sub
    if (-not (Test-Path -LiteralPath $p)) {
        New-Item -ItemType Directory -Path $p -Force | Out-Null
    }
}

$timestamp    = Get-Date -Format 'yyyy-MM-dd_HH-mm'
$logDate      = Get-Date -Format 'yyyy-MM-dd'
$logPath      = Join-Path $BackupRoot "logs\backup-$logDate.log"
$snapshotPath = Join-Path $BackupRoot "snapshots\$timestamp"
$latestPath   = Join-Path $BackupRoot 'latest'

function Write-LogLine {
    param([string]$Message)
    $line = "[{0}] {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Message
    Add-Content -LiteralPath $logPath -Value $line -Encoding UTF8
    Write-Host $line
}

function Invoke-CivRobocopy {
    param(
        [string]$Destination,
        [switch]$Mirror
    )
    $args = @(
        $Source,
        $Destination,
        '/E',
        '/COPY:DAT',
        '/DCOPY:DAT',
        '/R:2',
        '/W:5',
        '/XJ',
        '/XD', 'node_modules', 'gra\dist', '.____dirprobe',
        '/XF', '*.tmp', '*.temp',
        "/LOG+:$logPath",
        '/TEE'
    )
    if ($Mirror) { $args += '/MIR' }
    & robocopy @args
    return $LASTEXITCODE
}

Write-LogLine "=== Civ backup start ==="
Write-LogLine "Source: $Source"
Write-LogLine "Snapshot: $snapshotPath"

if (-not (Test-Path -LiteralPath $snapshotPath)) {
    New-Item -ItemType Directory -Path $snapshotPath -Force | Out-Null
}

$rcSnap = Invoke-CivRobocopy -Destination $snapshotPath
Write-LogLine "Robocopy snapshot exit code: $rcSnap (0-7 = success with copies; 8+ = failure)"

$rcLatest = Invoke-CivRobocopy -Destination $latestPath -Mirror
Write-LogLine "Robocopy latest (/MIR) exit code: $rcLatest"

$snapshotsDir = Join-Path $BackupRoot 'snapshots'
$all = Get-ChildItem -LiteralPath $snapshotsDir -Directory -ErrorAction SilentlyContinue |
    Sort-Object Name -Descending
if ($all.Count -gt $RetentionSnapshots) {
    $toRemove = $all | Select-Object -Skip $RetentionSnapshots
    foreach ($old in $toRemove) {
        Write-LogLine "Retention: removing old snapshot $($old.Name)"
        Remove-Item -LiteralPath $old.FullName -Recurse -Force -ErrorAction SilentlyContinue
    }
}

Write-LogLine "=== Civ backup finished ==="

$fail = ($rcSnap -ge 8) -or ($rcLatest -ge 8)
if ($fail) { exit 1 }
exit 0
