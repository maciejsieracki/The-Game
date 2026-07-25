/**
 * build-braz-rydwan-woly-preview.cjs — regeneracja podgladu porownawczego
 * dyspozycje/PODGLAD-BRAZ-RYDWAN-WOLY.html (fallback 'rydwan' vs
 * buildRydwanWolyBrazOpus5).
 *
 * Buduje esbuildem BEZPOSREDNIO z gra/node_modules — NIE odpala `npm run build`
 * ani `npm run dev`, wiec prebuild/export-data.py sie nie uruchamia i JSON-y
 * w gra/data pozostaja nietkniete.
 *
 * Uruchamiac z katalogu gra/:   node tools/build-braz-rydwan-woly-preview.cjs
 */
const path = require('path');
const fs = require('fs');
const esbuild = require(path.join(__dirname, '..', 'node_modules', 'esbuild'));

const ROOT = path.join(__dirname, '..');
const ENTRY = path.join(ROOT, 'tools', '.braz-rydwan-woly-preview-entry.ts');
const HTML = path.join(ROOT, '..', 'dyspozycje', 'PODGLAD-BRAZ-RYDWAN-WOLY.html');

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
// UWAGA 1: bundle moze zawierac literalne '</script' (parser HTML zamknalby
// tag w polowie kodu) — trzeba je rozbic.
// UWAGA 2: replacement MUSI byc funkcja — w kodzie three.js wystepuje sekwencja
// '$&' (oraz '$\'' / '$`'), ktora w stringu zastepczym String.replace znaczy
// "cale dopasowanie" i podmienia fragmenty bundla na sam tag <script>.
const js = out.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');

const html = fs.readFileSync(HTML, 'utf8');
const next = html.replace(/<script>[\s\S]*<\/script>/, () => '<script>' + js + '</script>');
if (next === html) {
  console.error('BLAD: nie znaleziono bloku <script> w ' + HTML);
  process.exit(1);
}
fs.writeFileSync(HTML, next);
console.log('OK — bundle wklejony (' + (js.length / 1024).toFixed(0) + ' kB) do ' + HTML);
