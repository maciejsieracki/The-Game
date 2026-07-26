/**
 * build-upgrade-badges-preview.cjs — buduje samodzielny podgląd odznak ulepszeń
 * jednostek (render/unitUpgradeBadges.ts) do JEDNEGO pliku HTML z inline bundlem.
 *
 * Buduje esbuildem BEZPOŚREDNIO z gra/node_modules — NIE odpala `npm run build`
 * ani `npm run dev`, więc prebuild/export-data.py się nie uruchamia i JSON-y
 * w gra/data pozostają nietknięte.
 *
 * Uruchamiać z katalogu gra/:
 *   node tools/build-upgrade-badges-preview.cjs <sciezka-wyjsciowa.html>
 */
const path = require('path');
const fs = require('fs');
const esbuild = require(path.join(__dirname, '..', 'node_modules', 'esbuild'));

const ROOT = path.join(__dirname, '..');
const ENTRY = path.join(ROOT, 'tools', '.upgrade-badges-preview-entry.ts');
const OUT = process.argv[2];
if (!OUT) {
  console.error('Uzycie: node tools/build-upgrade-badges-preview.cjs <out.html>');
  process.exit(1);
}

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
// '</script' w bundlu zamknelby tag w polowie kodu; replacement jako funkcja,
// bo three.js zawiera sekwencje '$&'.
const js = out.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');

const html = `<!doctype html><html lang="pl"><head><meta charset="utf-8">
<title>Odznaki ulepszen jednostek — kropki + obwodka (kamera 52 st.)</title>
<style>
 body{margin:0;background:#141a20;color:#e8eef4;font:14px/1.45 "Segoe UI",Arial,sans-serif;padding:14px}
 h1{font-size:17px;margin:0 0 4px} h2{font-size:14px;margin:16px 0 6px;color:#9fb4c8}
 canvas{display:block;background:#000;border-radius:6px}
 .row{display:flex;margin-top:4px} .row div{text-align:center;font-size:12px;color:#cfe0ee}
 .k{color:#ffd24a}
</style></head><body>
<h1>Odznaki ulepszen budynkowych na zetonie — kropki PRZY PODSTAWIE + kolorowa obwodka (kolnierz)</h1>
<div>Kamera pod katem gry <b>52&deg;</b>. Heksy stykaja sie bokami — widac, ze nic nie wychodzi poza obrys.</div>

<h2>1) Przeglad: brak / niskie / srednie / maksymalne / weteran</h2>
<canvas id="cv-wide" width="1760" height="620"></canvas>
<div class="row">
 <div style="width:352px">brak ulepszen (0 pp)<br>0 kropek, bez obwodki</div>
 <div style="width:352px">niskie — koszary (20 pp)<br>1 kropka, obwodka BRAZ</div>
 <div style="width:352px">srednie — kuznia+koszary (35 pp)<br>2 kropki, obwodka STAL</div>
 <div style="width:352px">maks. — 6 budynkow (95 pp)<br>3 kropki, obwodka PLATYNA</div>
 <div style="width:352px" class="k">WETERAN &#9733;&#9733;&#9733; (0 pp ulepszen)<br>zlote gwiazdki NAD GLOWA</div>
</div>

<h2>2) Zblizenie: maksymalne ulepszenie vs weteran (dowod rozroznialnosci)</h2>
<canvas id="cv-near" width="1200" height="620"></canvas>

<h2>3) Zblizenie: poziomy I / II / III — liczba kropek i kolor obwodki</h2>
<canvas id="cv-dots" width="1400" height="560"></canvas>
<script>${js}</script></body></html>`;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, html);
console.log('OK — podglad zapisany: ' + OUT + ' (' + (js.length / 1024).toFixed(0) + ' kB bundla)');
