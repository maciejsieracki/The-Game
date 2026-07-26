/**
 * build-veteran-badges-preview.cjs — buduje samodzielny podgląd odznak poziomu
 * weterana (render/unitVeteranBadges.ts) do JEDNEGO pliku HTML z inline bundlem.
 *
 * Buduje esbuildem BEZPOŚREDNIO z gra/node_modules — NIE odpala `npm run build`
 * ani `npm run dev`, więc prebuild/export-data.py się nie uruchamia i JSON-y
 * w gra/data pozostają nietknięte.
 *
 * Uruchamiać z katalogu gra/:
 *   node tools/build-veteran-badges-preview.cjs <sciezka-wyjsciowa.html>
 */
const path = require('path');
const fs = require('fs');
const esbuild = require(path.join(__dirname, '..', 'node_modules', 'esbuild'));

const ROOT = path.join(__dirname, '..');
const ENTRY = path.join(ROOT, 'tools', '.veteran-badges-preview-entry.ts');
const OUT = process.argv[2];
if (!OUT) {
  console.error('Uzycie: node tools/build-veteran-badges-preview.cjs <out.html>');
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
<title>Odznaki weterana — zlote gwiazdki nad glowa (kamera 52 st.)</title>
<style>
 body{margin:0;background:#141a20;color:#e8eef4;font:14px/1.45 "Segoe UI",Arial,sans-serif;padding:14px}
 h1{font-size:17px;margin:0 0 4px} h2{font-size:14px;margin:16px 0 6px;color:#9fb4c8}
 canvas{display:block;background:#000;border-radius:6px}
 .row{display:flex;margin-top:4px} .row div{text-align:center;font-size:12px;color:#cfe0ee}
 .k{color:#ffd24a}
</style></head><body>
<h1>Odznaki poziomu WETERANA (zlote gwiazdki NAD GLOWA) vs odznaki ulepszen budynkowych (kule PRZY PODSTAWIE)</h1>
<div>Kamera pod katem gry <b>52&deg;</b>. Heksy stykaja sie bokami — widac, ze nic nie wychodzi poza obrys.</div>

<h2>1) Przeglad na trawie</h2>
<canvas id="cv-wide" width="1760" height="640"></canvas>
<div class="row">
 <div style="width:352px">Poziom 1 Rekrut (0%)<br><b>BEZ ODZNAKI</b></div>
 <div style="width:352px" class="k">Poziom 2 Doswiadczony <b>+10%</b><br>2 gwiazdki</div>
 <div style="width:352px" class="k">Poziom 3 Weteran <b>+20%</b> (AI)<br>3 gwiazdki</div>
 <div style="width:352px">Ulepszenie budynkowe III (95 pp)<br>3 KULE przy podstawie + kolnierz</div>
 <div style="width:352px">Weteran +20% <b>ORAZ</b> ulepszenie III<br>oba systemy naraz</div>
</div>

<h2>2) Ten sam rzad na jasnym piasku — test kontrastu (zloto nie moze zginac)</h2>
<canvas id="cv-sand" width="1760" height="640"></canvas>

<h2>3) Zblizenie: Rekrut / +10% / +20% — policzalnosc gwiazdek</h2>
<canvas id="cv-vet" width="1400" height="580"></canvas>

<h2>4) Zblizenie: weteran vs ulepszenie budynkowe vs oba naraz</h2>
<canvas id="cv-mix" width="1400" height="580"></canvas>
<script>${js}</script></body></html>`;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, html);
console.log('OK — podglad zapisany: ' + OUT + ' (' + (js.length / 1024).toFixed(0) + ' kB bundla)');
