# Wstrzykuje pieczęć wersji (D2A) do bundla HTML — widoczna w lewym dolnym rogu.
# Użycie: .\inject-build-stamp.ps1 -HtmlPath '..\gra-robocza\Gra-podglad.html' -Tier ROBOCZA
param(
  [Parameter(Mandatory)]
  [string]$HtmlPath,
  [ValidateSet('ROBOCZA', 'KANON', 'FINALNA')]
  [string]$Tier = 'ROBOCZA',
  [string]$Md5 = ''
)

$ErrorActionPreference = 'Stop'
if (-not (Test-Path $HtmlPath)) { throw "Brak pliku: $HtmlPath" }

if (-not $Md5) {
  $Md5 = (Get-FileHash -LiteralPath $HtmlPath -Algorithm MD5).Hash.ToLower()
}
$short = $Md5.Substring(0, 8)
$stamp = Get-Date -Format 'yyyy-MM-dd HH:mm'

$color = switch ($Tier) {
  'KANON' { '#8ec5ff' }
  'FINALNA' { '#9ee6b8' }
  default { '#d4af37' }
}
$label = "$Tier · $short · $stamp"

$html = [IO.File]::ReadAllText($HtmlPath)
$html = $html -replace '(?s)<!-- CIV-BUILD-STAMP -->.*?<!-- /CIV-BUILD-STAMP -->\s*', ''
$html = $html -replace '(?s)<div id="civ-build-stamp"[^>]*>.*?</div>\s*', ''

$block = @"
<!-- CIV-BUILD-STAMP -->
<div id="civ-build-stamp" title="md5=$Md5" style="position:fixed;bottom:6px;left:6px;z-index:2147483647;font:11px/1.3 ui-monospace,Consolas,monospace;background:rgba(0,0,0,.78);color:$color;padding:3px 8px;border-radius:4px;border:1px solid rgba(212,175,55,.35);pointer-events:none;letter-spacing:.02em">$label</div>
<!-- /CIV-BUILD-STAMP -->

"@

if ($html -match '</body>') {
  $html = $html -replace '</body>', ($block + '</body>')
} else {
  $html += "`n$block"
}

[IO.File]::WriteAllText($HtmlPath, $html)
Write-Host "OK stamp $Tier $short -> $HtmlPath" -ForegroundColor Green
