/**
 * build-piatka-braz-opus5-preview.cjs — buduje
 * dyspozycje/PODGLAD-PIATKA-BRAZ-OPUS5.html: 7 modeli w rzedzie (5 niewpietych
 * Opus 5 z Brazu + Hastati z Zelaza jako osobna pozycja, 2 juz wpiete jako
 * odniesienie), kazdy na wlasnym heksie, heksy stykajace sie bokami.
 *
 * Buduje esbuildem BEZPOSREDNIO z gra/node_modules — NIE odpala `npm run build`
 * ani `npm run dev`, wiec prebuild/predev (export-data.py) sie nie uruchamia
 * i JSON-y w gra/data pozostaja nietkniete.
 *
 * Uruchamiac z katalogu gra/:   node tools/build-piatka-braz-opus5-preview.cjs
 */
const path = require('path');
const fs = require('fs');
const esbuild = require(path.join(__dirname, '..', 'node_modules', 'esbuild'));

const ROOT = path.join(__dirname, '..');
const ENTRY = path.join(ROOT, 'tools', '.piatka-braz-opus5-preview-entry.ts');
const HTML_OUT = path.join(ROOT, '..', 'dyspozycje', 'PODGLAD-PIATKA-BRAZ-OPUS5.html');

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
// UWAGA 1: bundle moze zawierac literalne '</script' — trzeba rozbic, zeby
// parser HTML nie zamknal tagu w polowie kodu.
// UWAGA 2: replacement MUSI byc funkcja — kod three.js zawiera sekwencje '$&'
// ktore w stringu zastepczym String.replace maja specjalne znaczenie.
const js = out.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');

const html = `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Piątka Brąz Opus 5 + Hastati — podgląd porównawczy (7 modeli obok siebie)</title>
<style>
  :root{
    --bg:#0e1216; --panel:#161c23; --line:#2a333d; --txt:#e6edf3;
    --dim:#93a1b0; --acc:#d8b040; --acc2:#7fc8a9;
  }
  *{box-sizing:border-box}
  html,body{margin:0;height:100%;background:var(--bg);color:var(--txt);
    font-family:"Segoe UI",system-ui,-apple-system,sans-serif}
  body{display:flex;flex-direction:column;overflow:hidden}
  header{padding:9px 16px 7px;border-bottom:1px solid var(--line);flex:0 0 auto}
  h1{margin:0;font-size:14.5px;letter-spacing:.4px;font-weight:600}
  h1 span{color:var(--acc)}
  .sub{margin:3px 0 0;font-size:11px;color:var(--dim);line-height:1.45}
  .sub b{color:var(--acc2);font-weight:600}
  #stage{flex:1 1 auto;position:relative;min-height:0;background:#78a7ff}
  canvas{width:100%;height:100%;display:block}
  #labels{position:absolute;inset:0;pointer-events:none;z-index:5}
  .lbl{position:absolute;transform:translate(-50%,4px);text-align:center;
    font-size:11px;white-space:nowrap;text-shadow:0 1px 3px rgba(0,0,0,.9),0 0 6px rgba(0,0,0,.6)}
  .lbl b{display:block;color:#fff;font-size:12px}
  .lbl span{display:block;color:#ffe9a8;font-size:9.5px;font-weight:700;letter-spacing:.5px}
  .lbl.ref span{color:#8ff0c0}
  footer{flex:0 0 auto;border-top:1px solid var(--line);padding:7px 16px;
    font-size:10.5px;color:var(--dim);line-height:1.5}
  footer b{color:var(--acc2)}
</style>
</head>
<body>
<header>
  <h1>7 MODELI OBOK SIEBIE — <span>5× Brąz Opus 5 (niewpięte)</span> + Hastati (Żelazo, poza zakresem) + <span>2× odniesienie (wpięte)</span></h1>
  <p class="sub">Kąt kamery: <b>52°</b> (jak w grze) · te same światła co <code>scene.ts</code> (styl „roblox”, ACESFilmic 1.05) · heks R=1, modele nieskalowane, w rzędzie stykają się bokami (dx = HEX_R·√3, jak <code>axialToWorld</code>). Kolejność: Włócznik, Miecznik, Procarz, Rydwan (woły), Hastati — potem dla porównania Łucznik nubijski i Taran okuty (już wpięte w <code>units.ts</code>).</p>
</header>
<div id="stage">
  <canvas id="cv"></canvas>
  <div id="labels"></div>
</div>
<footer>Podgląd statyczny — bez przycisków. Kamera i pomiary sterowane programowo przez <code>window.__demo</code> (capture-piatka-braz-opus5.cjs).</footer>
<script>${js}</script>
</body>
</html>
`;

fs.writeFileSync(HTML_OUT, html);
console.log('OK — ' + (js.length / 1024).toFixed(0) + ' kB bundle zapisany do ' + HTML_OUT);
