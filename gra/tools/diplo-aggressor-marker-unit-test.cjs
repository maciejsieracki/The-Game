'use strict';
/**
 * diplo-aggressor-marker-unit-test.cjs — R-WEB-AGGRESSOR-MARKER-Q1 (czysta funkcja agresorBadgeHtml).
 * Run: node tools/diplo-aggressor-marker-unit-test.cjs
 * Bundle do katalogu tymczasowego poza repo (os.tmpdir()).
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const SRC = path.resolve(__dirname, '..', 'src', 'ui', 'diplomacyPanel.ts');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'civ-aggr-marker-unit-'));
const BUNDLE = path.join(TMP, 'panel.cjs');
// Zależności DOM/zasobów (skin, ikony, overlay) nie dotyczą testowanej czystej funkcji — stub (plugin),
// bo ładują `import.meta.glob`/`?raw` (Vite). Sam `agresorBadgeHtml` i `esc` są REALNE (z diplomacyPanel.ts).
const stubPlugin = {
  name: 'stub-ui-deps',
  setup(b) {
    b.onResolve({ filter: /(^|\/)(diploUiSkin|display-names|escapeOverlayStack)$/ }, (a) => ({ path: a.path, namespace: 'stub' }));
    b.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({
      contents: ['formatEntityDisplayName','civPennantHtml','civPennantHtmlById','DIPLO_1E_SHARED_CSS','dipBrandIconHtml','ensureDiploBrandScope','tierBadgeHtml','treatyChipsHtml','pushOverlay','popOverlay'].map((n) => 'export const ' + n + ' = () => "";').join('\n'),
      loader: 'js',
    }));
  },
};
async function main() {
await esbuild.build({ entryPoints: [SRC], bundle: true, format: 'cjs', platform: 'node', outfile: BUNDLE, logLevel: 'silent', plugins: [stubPlugin] });
const { agresorBadgeHtml } = require(BUNDLE);

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS ' + name); }
  else { fail++; console.log('FAIL ' + name + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}

// Aktywna flaga: tekst „Agresor (N)", tooltip, aria.
for (const n of [1, 2, 15, 20]) {
  const h = agresorBadgeHtml(n);
  check(`N=${n}: tekst „Agresor (${n})"`, h.includes(`>Agresor (${n})</span>`) && h.includes('class="cd-agresor"'), h);
  check(`N=${n}: tooltip „Wypowiedział wojnę — konsekwencje dyplomatyczne przez ${n} tur"`,
    h.includes(`title="Wypowiedział wojnę — konsekwencje dyplomatyczne przez ${n} tur"`), h);
  check(`N=${n}: aria-label z licznikiem`, h.includes(`aria-label="Agresor, pozostało tur: ${n}"`), h);
}
// Flaga brak/wygasła/śmieci: pusty string.
for (const bad of [undefined, 0, -1, -20, NaN, Infinity, 0.4]) {
  check(`wartość ${String(bad)}: brak znacznika`, agresorBadgeHtml(bad) === '', agresorBadgeHtml(bad));
}
// Obwódka cywilizacji (wimpel) nie jest ruszana: znacznik nie ustawia border/outline/position.
const h = agresorBadgeHtml(5);
check('styl: brak border/outline/position (nie przesłania obwódki)', !/border:|outline|position:/.test(h), h);
// Ułamek obcinany w dół (>= 1).
check('N=2.9 -> „Agresor (2)"', agresorBadgeHtml(2.9).includes('Agresor (2)'));

console.log(`diplo-aggressor-marker-unit-test: ${pass} PASS, ${fail} FAIL`);
try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (_) { /* ignore */ }
process.exit(fail === 0 ? 0 : 1);
}
main().catch((e) => { console.error(e); process.exit(1); });
