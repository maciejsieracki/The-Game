# Wstrzykuje pieczęć wersji (D2A) do bundla HTML — widoczna w lewym dolnym rogu.
# MD5 w title = faktyczny hash pliku na dysku (zgodny z ROBOCZA-MANIFEST.json).
param(
  [Parameter(Mandatory)]
  [string]$HtmlPath,
  [ValidateSet('ROBOCZA', 'KANON', 'FINALNA')]
  [string]$Tier = 'ROBOCZA',
  [string]$Md5 = ''
)

$ErrorActionPreference = 'Stop'
if (-not (Test-Path $HtmlPath)) { throw "Brak pliku: $HtmlPath" }

$stamp = Get-Date -Format 'yyyy-MM-dd HH:mm'
$md5Ph = '0' * 32
$shortPh = '0' * 8

$color = switch ($Tier) {
  'KANON' { '#8ec5ff' }
  'FINALNA' { '#9ee6b8' }
  default { '#d4af37' }
}
$labelPh = "$Tier · $shortPh · $stamp"

$html = [IO.File]::ReadAllText($HtmlPath)
$html = $html -replace '(?s)<!-- CIV-BUILD-STAMP -->.*?<!-- /CIV-BUILD-STAMP -->\s*', ''
$html = $html -replace '(?s)<div id="civ-build-stamp"[^>]*>.*?</div>\s*', ''

$block = @"
<!-- CIV-BUILD-STAMP -->
<div id="civ-build-stamp" title="md5=$md5Ph" style="position:fixed;bottom:6px;left:6px;z-index:2147483647;font:11px/1.3 ui-monospace,Consolas,monospace;background:rgba(0,0,0,.78);color:$color;padding:3px 8px;border-radius:4px;border:1px solid rgba(212,175,55,.35);pointer-events:none;letter-spacing:.02em">$labelPh</div>
<!-- /CIV-BUILD-STAMP -->

"@

if ($html -match '</body>') {
  $html = $html -replace '</body>', ($block + '</body>')
} else {
  $html += "`n$block"
}

[IO.File]::WriteAllText($HtmlPath, $html, [Text.UTF8Encoding]::new($false))

for ($iter = 0; $iter -lt 4; $iter++) {
  $Md5 = (Get-FileHash -LiteralPath $HtmlPath -Algorithm MD5).Hash.ToLower()
  $short = $Md5.Substring(0, 8)
  $label = "$Tier · $short · $stamp"
  $content = [IO.File]::ReadAllText($HtmlPath)
  $next = $content -replace 'title="md5=[0-9a-f]{32}"', "title=`"md5=$Md5`""
  $next = $next -replace '(?<=id="civ-build-stamp"[^>]*>)[^<]+(?=</div>)', $label
  if ($next -eq $content) { break }
  [IO.File]::WriteAllText($HtmlPath, $next, [Text.UTF8Encoding]::new($false))
}

$Md5 = (Get-FileHash -LiteralPath $HtmlPath -Algorithm MD5).Hash.ToLower()
$short = $Md5.Substring(0, 8)
Write-Host "OK stamp $Tier $short -> $HtmlPath (md5=$Md5)" -ForegroundColor Green
