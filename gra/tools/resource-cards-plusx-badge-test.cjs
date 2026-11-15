'use strict';
/**
 * resource-cards-plusx-badge-test.cjs — R-WEB-UI-RESOURCE-CARD-REMOVE-PLUS-X-BADGE-Q1 (ABC 2026-11-15, A).
 *
 * Run from gra/:  node tools/resource-cards-plusx-badge-test.cjs [--no-mutants]
 *
 * Pokrywa (prawdziwy resCardHtml z empireDetailPanel.ts, bundlowany esbuildem):
 *   A. karta surowca NIE zawiera plakietki „+X” (klasa civ-emp-res-rate / resRateHtml usunięte);
 *   B. wiersz „Brutto · netto” zostaje bez zmian: tekst liczb i klasa koloru netto;
 *   C. karta bez produkcji i zużycia: bez plakietki i bez wiersza (jak przed zmianą);
 *   D. statyczne: w empireDetailPanel.ts nie ma resRateHtml ani reguł CSS civ-emp-res-rate*;
 *   M. mutant (przywrócenie plakietki „+X” przed wierszem brutto/netto) MUSI czerwienić test A.
 * Zrzut Chromium (kryterium c) nie jest częścią tego skryptu — wynik zapisuje raport.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const SRC = path.join(GRA, 'src');
const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
const NO_MUTANTS = process.argv.includes('--no-mutants');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'res-plusx-test-'));

let fails = 0;
let passes = 0;
function ok(c, m, extra) {
  if (c) { passes++; console.log('  ok   ' + m); }
  else { fails++; console.log('  FAIL ' + m + (extra !== undefined ? ' -- ' + JSON.stringify(extra) : '')); }
}

async function bundleProbe(panelPath, outName) {
  const entry = path.join(TMP, 'probe-' + outName + '.ts');
  fs.writeFileSync(entry, [
    `import * as P from ${JSON.stringify(panelPath)};`,
    `(globalThis as any).__probe = { P };`,
  ].join('\n'));
  const outFile = path.join(TMP, outName + '.cjs');
  await esbuild.build({
    entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile: outFile, logLevel: 'silent',
    loader: { '.ts': 'ts', '.json': 'json', '.svg': 'text', '.png': 'dataurl', '.mp3': 'empty', '.css': 'text' },
    plugins: [{
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
    }],
  });
  const stub = () => {
    const f = function () { return proxy; };
    const proxy = new Proxy(f, {
      get: (_t, k) => (k === Symbol.toPrimitive ? () => '' : (k === 'then' ? undefined : proxy)),
      apply: () => proxy,
      construct: () => proxy,
      set: () => true,
    });
    return proxy;
  };
  for (const k of ['window', 'document', 'localStorage', 'sessionStorage', 'navigator', 'location', 'HTMLElement']) {
    if (globalThis[k] === undefined) globalThis[k] = stub();
  }
  require(outFile);
  return globalThis.__probe;
}

function clean(s) { return String(s).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }

const cardDrewno = {
  id: 'drewno', icon: '🪵', label: 'Drewno', stock: 4384, cap: 50000, typ: 'surowy', dostep: true,
  ratePerTurn: 457, rateProductionPerTurn: 457,
  usage: { buildings: 20, citizens: 10, units: 5 },
};
const cardDiplo = {
  id: 'zloto', icon: '🪙', label: 'Złoto', stock: 100, cap: 1000, typ: 'surowy', dostep: true,
  ratePerTurn: 9, rateProductionPerTurn: 10, rateDiploOutPerTurn: 4, rateDiploInPerTurn: 3,
  usage: { buildings: 1, citizens: 0, units: 0 },
};
const cardGlina = {
  id: 'glina', icon: '🧱', label: 'Glina', stock: 10, cap: 1000, typ: 'surowy', dostep: true,
  ratePerTurn: 0, rateProductionPerTurn: 0, usage: { buildings: 0, citizens: 12, units: 0 },
};

/** Jedna karta: brak plakietki „+X” i wiersz brutto/netto z oczekiwanym tekstem i klasą. */
function checkCard(P, card, expectText, expectClass, label) {
  const html = P.resCardHtml(card);
  ok(!html.includes('civ-emp-res-rate'), label + ' A: karta bez plakietki „+X” (brak civ-emp-res-rate)', html.slice(0, 300));
  const line = P.resGrossNetLineHtml(card);
  ok(clean(line) === expectText, label + ' B: tekst „Brutto · netto” bez zmian', clean(line));
  ok(line.includes(expectClass), label + ' B: klasa koloru netto „' + expectClass + '”', line);
  ok(html.includes(line), label + ' B: wiersz brutto/netto nadal w karcie');
}

(async () => {
  console.log('=== resource-cards-plusx-badge-test ===');
  const panel = path.join(SRC, 'ui', 'empireDetailPanel.ts');
  const { P } = await bundleProbe(panel, 'real');

  console.log('-- A/B. karta surowca (resCardHtml, prawdziwy kod panelu)');
  checkCard(P, cardDrewno, 'Brutto +457 · netto +422 / turę', 'civ-emp-res-gn good', 'drewno');
  checkCard(P, cardDiplo, 'Brutto +13 · netto +8 / turę', 'civ-emp-res-gn good', 'złoto (dyplomacja)');
  checkCard(P, cardGlina, 'Brutto 0 · netto −12 / turę', 'civ-emp-res-gn bad', 'glina (netto ujemne)');

  console.log('-- C. karta bez produkcji i zużycia');
  const bare = { ...cardDrewno, id: 'cegla', label: 'Cegła', stock: 0, ratePerTurn: 0, rateProductionPerTurn: 0, usage: undefined };
  ok(!P.resCardHtml(bare).includes('civ-emp-res-rate'), 'C1 bez plakietki „+X” także bez produkcji i zużycia');
  ok(P.resGrossNetLineHtml(bare) === '', 'C2 brak wiersza brutto/netto (jak przed zmianą)');

  console.log('-- D. statyczne: źródło panelu');
  const panelSrc = fs.readFileSync(panel, 'utf8');
  ok(!/resRateHtml/.test(panelSrc), 'D1 brak funkcji resRateHtml w empireDetailPanel.ts');
  ok(!/\.civ-emp-res-rate[{.\-]/.test(panelSrc), 'D2 brak reguł CSS civ-emp-res-rate* w empireDetailPanel.ts');

  if (!NO_MUTANTS) {
    console.log('-- M. mutant: przywrócona plakietka „+X” (musi czerwienić test A)');
    const anchor = '    + resGrossNetLineHtml(r)\n';
    if (panelSrc.split(anchor).length !== 2) { fails++; console.log('  FAIL M1 wzorzec mutacji nie trafił'); }
    else {
      const fixImports = (s) => s.replace(/from '(\.\.?\/[^']+)'/g, (_m, p) => `from ${JSON.stringify(path.resolve(path.join(SRC, 'ui'), p))}`);
      const mutSrc = fixImports(panelSrc).replace(anchor,
        '    + `<span class="civ-emp-res-rate good">+457</span>`\n' + anchor);
      const mutPath = path.join(TMP, 'mut-plusx-panel.ts');
      fs.writeFileSync(mutPath, mutSrc);
      const mp = await bundleProbe(mutPath, 'mut-plusx');
      // Mutant ma plakietkę; warunek testu A (brak civ-emp-res-rate) jest wtedy FAŁSZ = czerwono.
      const detected = mp.P.resCardHtml(cardDrewno).includes('civ-emp-res-rate');
      ok(detected, 'M1 mutant „plakietka +X wróciła” jest wykrywany przez test A (warunek A czerwony)');
    }
  }

  console.log(`\n=== resource-cards-plusx-badge-test: ${passes} pass, ${fails} fail ===`);
  process.exit(fails === 0 ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(2); });
