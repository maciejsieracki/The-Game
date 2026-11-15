'use strict';
/**
 * resource-card-numbers-only-test.cjs — R-WEB-UI-RESOURCE-CARD-NUMBERS-ONLY-DETAILS-COLLAPSED-Q1 (Maciej 2026-11-15).
 *
 * Sprawdza na PRAWDZIWYM kodzie panelu (zbundlowanym esbuildem):
 *  N1  karta surowca: widoczny tekst wiersza brutto/netto to SAME liczby „+457 · +422”.
 *  N1b  ...bez słów „Brutto”, „netto”, „/ turę”, „szt.” w widocznym tekście.
 *  N2  wyjaśnienie brutto/netto jest w `title` (tooltip) wiersza.
 *  N3  nagłówek Surowce (`grossNetNumbersSub`): widoczny tekst „+1222 → +1075”, bez słów.
 *  N4  netto ujemne: klasa „bad” na karcie, klasa „neg” w nagłówku; zero jako „0”.
 *  N5  nagłówek: opis w `title` tooltipu.
 *  N6  „Skąd zapasy” buduje się z open=false (także sól/ceramika); brak capture/restore po przerysowaniu.
 *  N7  „Zobacz szczegóły zużycia” (`resUsageDetailsHtml`) zwinięte — brak `open` w markupie.
 *  M1  mutant: „/ turę” wraca na karcie MUSI czerwienić N1.
 *  M2  mutant: „Skąd zapasy” otwarte domyślnie MUSI czerwienić N6.
 *
 * Przerysowanie w Chromium (oba bloki wracają zwinięte) jest w resource-ledger-skad-dom-test.cjs (D6).
 * Run from gra/:  node tools/resource-card-numbers-only-test.cjs   (opcjonalnie --no-mutants)
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const SRC = path.join(GRA, 'src');
const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
const NO_MUTANTS = process.argv.includes('--no-mutants');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'res-numbers-only-test-'));

let fails = 0;
let passes = 0;
function ok(c, m, extra) {
  if (c) { passes++; console.log('  ok   ' + m); }
  else { fails++; console.log('  FAIL ' + m + (extra !== undefined ? ' -- ' + JSON.stringify(extra) : '')); }
}
const clean = (s) => String(s).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const WORDS = /Brutto|netto|turę|szt\./i;

/** Bundluje panel (wzorzec z resource-cards-gross-net-test.cjs) i zwraca jego eksporty. */
async function bundleProbe(panelPath, outName) {
  const entry = path.join(TMP, 'probe-' + outName + '.ts');
  fs.writeFileSync(entry, `import * as P from ${JSON.stringify(panelPath)};\n(globalThis as any).__probe = { P };\n`);
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

const cardBase = {
  id: 'drewno', icon: '🪵', label: 'Drewno', stock: 4384, cap: 50000, typ: 'surowy', dostep: true,
  ratePerTurn: 457, rateProductionPerTurn: 457,
  usage: { buildings: 20, citizens: 10, units: 5 },
};
const RESOURCE_SKAD_CALL = 'return resourceSourceLedgerDetailsHtml(lines, turns.length, false, resourceKey);';

(async () => {
  console.log('=== resource-card-numbers-only-test ===');
  const panelPath = path.join(SRC, 'ui', 'empireDetailPanel.ts');
  const { P } = await bundleProbe(panelPath, 'real');

  console.log('-- N. karta surowca i nagłówek Surowce');
  const line = P.resGrossNetLineHtml(cardBase);
  ok(clean(line) === '+457 · +422', 'N1 karta: widoczny tekst to same liczby „+457 · +422”', clean(line));
  ok(!WORDS.test(clean(line)), 'N1b karta: brak słów „Brutto”, „netto”, „/ turę”, „szt.” w widocznym tekście', clean(line));
  const tipM = /title="([^"]*)"/.exec(line);
  ok(!!tipM && /Brutto/.test(tipM[1]) && /Netto/.test(tipM[1]) && /zużyc/.test(tipM[1]), 'N2 wyjaśnienie brutto/netto w title (tooltip) wiersza', tipM && tipM[1]);

  const neg = P.resGrossNetLineHtml({ ...cardBase, id: 'glina', ratePerTurn: 0, rateProductionPerTurn: 0, usage: { buildings: 0, citizens: 12, units: 0 } });
  ok(clean(neg) === '0 · −12' && neg.includes('civ-emp-res-gn bad'), 'N4 karta netto ujemne: „0 · −12”, klasa bad', clean(neg));

  const hdr = P.grossNetNumbersSub(1222, 1075, 'Brutto = produkcja przed zużyciem. Netto = po zużyciu.');
  ok(clean(hdr) === '+1222 → +1075', 'N3 nagłówek Surowce: widoczny tekst „+1222 → +1075”', clean(hdr));
  ok(!WORDS.test(clean(hdr)), 'N3b nagłówek: brak „szt.”, „/ turę”, „Brutto”, „netto” w widocznym tekście', clean(hdr));
  ok(/title="Brutto = produkcja przed zużyciem\. Netto = po zużyciu\."/.test(hdr), 'N5 nagłówek: opis w title (tooltip)', hdr);
  const hdrNeg = P.grossNetNumbersSub(0, -12, 'x');
  ok(hdrNeg.includes('class="neg"') && clean(hdrNeg) === '0 → −12', 'N4b nagłówek netto ujemne: klasa neg, „0 → −12”', clean(hdrNeg));
  ok(P.grossNetNumbersSub(undefined, 5, 'x') === '', 'N3c nagłówek bez danych → pusty');

  console.log('-- S. zwijanie szczegółów');
  const usage = P.resUsageDetailsHtml(cardBase);
  ok(usage.includes('<details class="civ-emp-res-usage">') && !/<details[^>]* open/.test(usage), 'N7 „Zobacz szczegóły zużycia” zwinięte (bez open)', usage.slice(0, 80));
  const src = fs.readFileSync(panelPath, 'utf8');
  ok(src.includes(RESOURCE_SKAD_CALL), 'N6 „Skąd zapasy” zawsze buduje się z open=false (sól i ceramika też)');
  ok(!/captureSkadDetailsOpen|restoreSkadDetailsOpen/.test(src), 'N6b brak przywracania rozwinięcia „Skąd zapasy” po przerysowaniu');

  if (!NO_MUTANTS) {
    console.log('-- M. mutanty (muszą czerwienić test)');
    const fixImports = (s) => s.replace(/from '(\.\.?\/[^']+)'/g, (_m, p) => `from ${JSON.stringify(path.resolve(path.join(SRC, 'ui'), p))}`);
    const base = fixImports(src);
    // M1: przywrócony tekst „/ turę” na karcie
    const cardNew = "    + `<b>${esc(fmt(gn.brutto))}</b> · <b class=\"net\">${esc(fmt(gn.netto))}</b>`\n";
    const cardOld = "    + `Brutto <b>${esc(fmt(gn.brutto))}</b> · netto <b class=\"net\">${esc(fmt(gn.netto))}</b> / turę`\n";
    if (!base.includes(cardNew)) { fails++; console.log('  FAIL M1 wzorzec mutacji nie trafił'); }
    else {
      const m1Path = path.join(TMP, 'mut1-panel.ts');
      fs.writeFileSync(m1Path, base.replace(cardNew, cardOld));
      const mp = await bundleProbe(m1Path, 'mut1');
      ok(clean(mp.P.resGrossNetLineHtml(cardBase)) !== '+457 · +422', 'M1 mutant „/ turę na karcie” jest wykrywany przez N1');
    }
    // M2: „Skąd zapasy” otwarte domyślnie — mutant nie może przejść kontroli N6
    if (!base.includes(RESOURCE_SKAD_CALL)) { fails++; console.log('  FAIL M2 wzorzec mutacji nie trafił'); }
    else {
      const m2Src = base.replace(RESOURCE_SKAD_CALL, RESOURCE_SKAD_CALL.replace('turns.length, false,', 'turns.length, true,'));
      ok(!m2Src.includes(RESOURCE_SKAD_CALL), 'M2 mutant „Skąd zapasy otwarte” jest wykrywany przez N6 (kontrola nie przechodzi)');
    }
  }

  console.log(`\n=== resource-card-numbers-only-test: ${passes} pass, ${fails} fail ===`);
  process.exit(fails === 0 ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
