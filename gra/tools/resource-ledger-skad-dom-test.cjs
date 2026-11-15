'use strict';
/**
 * resource-ledger-skad-dom-test.cjs — R-WEB-UI-RESOURCE-SOURCE-LEDGER-UI-AND-REST-Q1 (partia 4, zarzuty 5 i 8 Evaluatora).
 *
 * Realny DOM: karta surowca z PRAWDZIWEGO resCardHtml (empireDetailPanel.ts) z dziennikiem „Skąd zapasy”
 * (resource-ledger.ts), serializowana przez Chromium headless (--dump-dom, czyli parser przeglądarki, nie regex).
 *
 * Sprawdza:
 *  D1 sól (właściciel 0): blok <details open>, linie „+12 Warzelnia (Rzym)”, „+30 Umowa wymiany z Asyria”, „−20 Obywatele”
 *     w kolejności wartość → etykieta (<span class="v"> przed <span class="k">).
 *  D2 ceramika: blok domyślnie otwarty, linia „+8 Garncarnia (Rzym)”.
 *  D3 bez surowych ID w DOM.
 *  D4 właściciel z r.ownerId: karta owner 1 pokazuje dziennik owner 1 („Kopalnia soli (Egipt)”), nie owner 0.
 *  D5 surowiec bez wpisów w dzienniku: brak bloku „Skąd zapasy” (karta jak dziś).
 *  Zrzuty (tylko gdy SKAD_SHOT_DIR jest ustawione): sól i ceramika, dwa rozmiary (360 i 720 px).
 *
 * Mutacja (ręczna, opisana w raporcie): przywrócenie `resSkadZapasyHtml(r.id)` w resCardHtml MUSI czerwienić D4.
 * Run from gra/:  node tools/resource-ledger-skad-dom-test.cjs
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const GRA = path.resolve(__dirname, '..');
const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
const CHROMIUM = process.env.CHROMIUM || '/usr/bin/chromium';
const SHOT_DIR = process.env.SKAD_SHOT_DIR || '';
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'skad-dom-'));
const ENTRY = path.join(TMP, 'entry.ts');
const BUNDLE = path.join(TMP, 'bundle.cjs');

if (!fs.existsSync(CHROMIUM)) {
  console.log(`resource-ledger-skad-dom-test: SKIP - brak Chromium (${CHROMIUM}); DOM NIE ZMIERZONO`);
  process.exit(0);
}

fs.writeFileSync(ENTRY, `
export { resCardHtml } from ${JSON.stringify(path.join(GRA, 'src/ui/empireDetailPanel'))};
export { createLedgerTurn, recordLedgerFlow, commitLedgerHistoryTick, resetLedgerHistory } from ${JSON.stringify(path.join(GRA, 'src/game/resource-ledger'))};
`, 'utf8');
// Import panelu dotyka import.meta.glob (Vite) i ?raw — stub jak w resource-cards-gross-net-test.cjs.
const stubPlugin = {
  name: 'stub-browser',
  setup(b) {
    b.onResolve({ filter: /\?raw$/ }, (a) => ({ path: path.resolve(a.resolveDir, a.path.replace(/\?raw$/, '')), namespace: 'raw' }));
    b.onLoad({ filter: /.*/, namespace: 'raw' }, (a) => ({ contents: fs.readFileSync(a.path, 'utf8'), loader: 'text' }));
    b.onLoad({ filter: /\.ts$/ }, (a) => {
      const src = fs.readFileSync(a.path, 'utf8');
      if (!src.includes('import.meta.glob')) return null;
      return { contents: 'const __g=()=>({});\n' + src.replace(/import\.meta\.glob/g, '__g'), loader: 'ts', resolveDir: path.dirname(a.path) };
    });
  },
};
const stubDom = () => {
  const f = function () { return proxy; };
  const proxy = new Proxy(f, {
    get: (_t, k) => (k === Symbol.toPrimitive ? () => '' : (k === 'then' ? undefined : proxy)),
    apply: () => proxy, construct: () => proxy, set: () => true,
  });
  return proxy;
};
for (const k of ['window', 'document', 'localStorage', 'sessionStorage', 'navigator', 'location', 'HTMLElement']) {
  if (globalThis[k] === undefined) globalThis[k] = stubDom();
}

(async () => {
await esbuild.build({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  loader: { '.ts': 'ts', '.json': 'json', '.svg': 'text', '.png': 'dataurl', '.mp3': 'empty', '.css': 'text' },
  outfile: BUNDLE, logLevel: 'silent', plugins: [stubPlugin],
});
const P = require(BUNDLE);
main(P);
})().catch((e) => { console.error(e); process.exit(1); });

function main(P) {

// CSS panelu: literal z ensureStyles() (interpolacje ${...} pomijane; reguly "skad" sa literalami).
const panelSrc = fs.readFileSync(path.join(GRA, 'src/ui/empireDetailPanel.ts'), 'utf8');
const cssOpen = 'const css = `';
const cssStart = panelSrc.indexOf(cssOpen);
const cssEnd = panelSrc.indexOf('\n`;', cssStart);
const panelCss = panelSrc.slice(cssStart + cssOpen.length, cssEnd).replace(/\$\{[^}]*\}/g, '');

let passed = 0;
let failed = 0;
function check(name, cond, detail) {
  if (cond) { passed++; console.log(`  ok   ${name}`); }
  else { failed++; console.log(`  FAIL ${name}${detail ? ' - ' + detail : ''}`); }
}

// dziennik: jeden tick; wlasciciel 0 (sol, ceramika) i wlasciciel 1 (sol, inne zrodlo)
P.resetLedgerHistory();
const t0 = P.createLedgerTurn();
P.recordLedgerFlow(t0, 'sol', 'warzelnia|h1', { kind: 'warzelnia', label: 'Warzelnia (Rzym)' }, 12);
P.recordLedgerFlow(t0, 'sol', 'umowa|asyria', { kind: 'umowa', label: 'Umowa wymiany z Asyria' }, 30);
P.recordLedgerFlow(t0, 'sol', 'obywatele|0', { kind: 'obywatele', label: 'Obywatele' }, -20);
P.recordLedgerFlow(t0, 'ceramika', 'garncarnia|h2', { kind: 'garncarnia', label: 'Garncarnia (Rzym)' }, 8);
const t1 = P.createLedgerTurn();
P.recordLedgerFlow(t1, 'sol', 'kopalnia|h9', { kind: 'kopalnia', label: 'Kopalnia soli (Egipt)' }, 7);
P.commitLedgerHistoryTick(new Map([[0, t0], [1, t1]]), 10);

const base = (id, icon, label, ownerId) => ({
  id, icon, label, stock: 120, cap: 500, typ: 'surowy', dostep: true,
  ratePerTurn: 5, rateProductionPerTurn: 5, usage: { buildings: 1, citizens: 1, units: 0 },
  ...(ownerId === undefined ? {} : { ownerId }),
});
const cards = {
  solOwner0: P.resCardHtml(base('sol', '🧂', 'Sól', 0)),
  solOwner1: P.resCardHtml(base('sol', '🧂', 'Sól', 1)),
  ceramika0: P.resCardHtml(base('ceramika', '🏺', 'Ceramika', 0)),
  drewno0: P.resCardHtml(base('drewno', '🪵', 'Drewno', 0)),
};

function page(cardHtml, width) {
  return '<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">'
    + `<style>${panelCss}</style></head><body style="background:#14181f;color:#e8edf5;margin:0;padding:12px;font-family:sans-serif">`
    + `<div style="width:${width}px">${cardHtml}</div></body></html>`;
}

function dumpDom(name, html) {
  const file = path.join(TMP, name + '.html');
  fs.writeFileSync(file, html, 'utf8');
  return execFileSync(CHROMIUM, [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files',
    '--no-first-run', '--dump-dom', 'file://' + file,
  ], { encoding: 'utf8', timeout: 90000, stdio: ['ignore', 'pipe', 'ignore'] });
}

console.log('resource-ledger-skad-dom-test (Chromium DOM)');
const dom = {};
for (const k of Object.keys(cards)) dom[k] = dumpDom(k, page(cards[k], 360));
const bodyOf = (h) => h.slice(h.indexOf("<body"));
// R-WEB-UI-RESOURCE-SOURCE-LEDGER-SHOTS-DOCS-PERF-Q1 (GOAL 5): markup niesie `data-skad-key` (klucz stanu open) przed `open`.
const OPEN_DETAILS = /<details class="civ-emp-res-skad"(?: data-skad-key="[^"]*")? open(=""|>)/;

check('D1 sol: blok "Skad zapasy" otwarty domyslnie', OPEN_DETAILS.test(bodyOf(dom.solOwner0)));
check('D1 sol: "+12 Warzelnia (Rzym)" jako wartosc przed etykieta',
  dom.solOwner0.includes('<span class="v">+12</span><span class="k">Warzelnia (Rzym)</span>'));
check('D1 sol: "+30 Umowa wymiany z Asyria"',
  dom.solOwner0.includes('<span class="v">+30</span><span class="k">Umowa wymiany z Asyria</span>'));
check('D1 sol: "-20 Obywatele" z minusem i klasa loss',
  dom.solOwner0.includes('civ-emp-res-skad-row loss') && dom.solOwner0.includes('<span class="v">−20</span><span class="k">Obywatele</span>'));
check('D2 ceramika: blok domyslnie otwarty, linia "+8 Garncarnia (Rzym)"',
  OPEN_DETAILS.test(bodyOf(dom.ceramika0)) && dom.ceramika0.includes('<span class="v">+8</span><span class="k">Garncarnia (Rzym)</span>'));
check('D3 bez surowych ID w DOM', !dom.solOwner0.includes('warzelnia|h1') && !dom.ceramika0.includes('garncarnia|h2'));
check('D4 owner 1 widzi wlasny dziennik ("Kopalnia soli (Egipt)")',
  dom.solOwner1.includes('Kopalnia soli (Egipt)') && !dom.solOwner1.includes('Umowa wymiany z Asyria'));
check('D4 owner 0 nie dostaje danych owner 1', !dom.solOwner0.includes('Kopalnia soli (Egipt)'));
check('D5 drewno bez wpisow: brak bloku "Skad zapasy"', !bodyOf(dom.drewno0).includes("civ-emp-res-skad"));

if (SHOT_DIR) {
  fs.mkdirSync(SHOT_DIR, { recursive: true });
  for (const [k, w] of [['solOwner0', 360], ['solOwner0', 720], ['ceramika0', 360], ['ceramika0', 720]]) {
    const file = path.join(TMP, `shot-${k}-${w}.html`);
    fs.writeFileSync(file, page(cards[k], w), 'utf8');
    const out = path.join(SHOT_DIR, `skad-${k}-${w}px.png`);
    execFileSync(CHROMIUM, [
      '--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files',
      `--window-size=${w + 24},900`, `--screenshot=${out}`, 'file://' + file,
    ], { timeout: 90000, stdio: 'ignore' });
    console.log(`  shot ${out}`);
  }
}

try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* ignore */ }
console.log(`\nresource-ledger-skad-dom-test: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
}
