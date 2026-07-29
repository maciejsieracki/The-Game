'use strict';
/**
 * build-palisada-biskupin-preview.cjs — statyczna strona podglądu palisady Biskupin.
 * Uruchamiać z katalogu gra/:
 *   node tools/build-palisada-biskupin-preview.cjs
 */
const path = require('path');
const fs = require('fs');
const esbuild = require(path.join(__dirname, '..', 'node_modules', 'esbuild'));

const ROOT = path.join(__dirname, '..');
const ENTRY = path.join(ROOT, 'tools', '.palisada-biskupin-preview-entry.ts');
const HTML_OUT = process.argv[2] || path.join(ROOT, '..', 'docs', 'ux', 'preview-palisada', '_tmp', 'preview-biskupin.html');

const out = esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'browser',
  format: 'iife',
  target: 'es2020',
  minify: true,
  write: false,
  absWorkingDir: ROOT,
});
const js = out.outputFiles[0].text.replace(/<\/script/gi, () => '<\\/script');

const html = `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="utf-8">
<title>Palisada Biskupin — propozycja UX</title>
<style>
  *{box-sizing:border-box}
  html,body{margin:0;height:100%;background:#0e1216;color:#e6edf3;
    font-family:"Segoe UI",system-ui,sans-serif}
  body{display:flex;flex-direction:column;overflow:hidden}
  header{padding:8px 14px;border-bottom:1px solid #2a333d;flex:0 0 auto}
  h1{margin:0;font-size:13.5px;font-weight:600}
  h1 span{color:#a8b8c8}
  .sub{margin:3px 0 0;font-size:10.5px;color:#93a1b0}
  .sub b{color:#9ab8d0}
  #stage{flex:1 1 auto;position:relative;min-height:0}
  canvas{width:100%;height:100%;display:block}
  #labels{position:absolute;inset:0;pointer-events:none;z-index:5}
  .lbl{position:absolute;transform:translate(-50%,4px);text-align:center;
    font-size:11px;white-space:nowrap;text-shadow:0 1px 3px #000,0 0 6px #000}
  .lbl b{display:block;color:#fff;font-size:12px}
  .lbl span{display:block;color:#c8d8e8;font-size:9.5px;font-weight:700}
  .lbl.prop span{color:#ffb86c}
</style>
</head>
<body>
<header>
  <h1>Palisada <span>Biskupin</span> — propozycja UX · kąt kamery <span>52°</span></h1>
  <p class="sub">Skarpa + żerdzie na skos + belki poziome + korona nierówna + brama. <b>NIE</b> wdrożone do <b>miasto-kamien.ts</b>.</p>
</header>
<div id="stage"><canvas id="cv"></canvas><div id="labels"></div></div>
<script>${js}</script>
</body>
</html>
`;

fs.mkdirSync(path.dirname(HTML_OUT), { recursive: true });
fs.writeFileSync(HTML_OUT, html);
console.log('OK — ' + (js.length / 1024).toFixed(0) + ' kB bundle -> ' + HTML_OUT);
