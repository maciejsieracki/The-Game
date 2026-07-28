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
# HTML entity — unika Â· przy zapisie UTF-8 bez BOM
$dot = '&#183;'
$labelPh = "$Tier $dot $shortPh $dot $stamp"

$html = [IO.File]::ReadAllText($HtmlPath)
$html = $html -replace '(?s)<!-- CIV-BUILD-STAMP -->.*?<!-- /CIV-BUILD-STAMP -->\s*', ''
$html = $html -replace '(?s)<div id="civ-build-stamp"[^>]*>.*?</div>\s*', ''

$block = @"
<!-- CIV-BUILD-STAMP -->
<div id="civ-build-stamp" title="md5=$md5Ph" hidden style="position:fixed;bottom:32px;left:6px;z-index:2147483647;display:none;font:11px/1.3 ui-monospace,Consolas,monospace;background:rgba(0,0,0,.78);color:$color;padding:3px 8px;border-radius:4px;border:1px solid rgba(212,175,55,.35);pointer-events:none;letter-spacing:.02em">$labelPh</div>
<!-- /CIV-BUILD-STAMP -->

"@

if ($html -match '</body>') {
  $html = $html -replace '</body>', ($block + '</body>')
} else {
  $html += "`n$block"
}

function Write-StampHtml {
  param([string]$Path, [string]$Content)
  $utf8 = [Text.UTF8Encoding]::new($false)
  $tmp = [IO.Path]::GetTempFileName()
  try {
    [IO.File]::WriteAllText($tmp, $Content, $utf8)
    if (Test-Path -LiteralPath $Path) { Remove-Item -LiteralPath $Path -Force }
    Move-Item -LiteralPath $tmp -Destination $Path -Force
  } finally {
    if (Test-Path -LiteralPath $tmp) { Remove-Item -LiteralPath $tmp -Force -ErrorAction SilentlyContinue }
  }
}

Write-StampHtml -Path $HtmlPath -Content $html

for ($iter = 0; $iter -lt 4; $iter++) {
  $Md5 = (Get-FileHash -LiteralPath $HtmlPath -Algorithm MD5).Hash.ToLower()
  $short = $Md5.Substring(0, 8)
  $label = "$Tier $dot $short $dot $stamp"
  $content = [IO.File]::ReadAllText($HtmlPath)
  $next = $content -replace 'title="md5=[0-9a-f]{32}"', "title=`"md5=$Md5`""
  $next = $next -replace '(?<=id="civ-build-stamp"[^>]*>)[^<]+(?=</div>)', $label
  if ($next -eq $content) { break }
  Write-StampHtml -Path $HtmlPath -Content $next
}

$Md5 = (Get-FileHash -LiteralPath $HtmlPath -Algorithm MD5).Hash.ToLower()
$short = $Md5.Substring(0, 8)
Write-Host "OK stamp $Tier $short -> $HtmlPath (md5=$Md5)" -ForegroundColor Green
