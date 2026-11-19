'use strict';
/**
 * resource-cards-gross-net-test.cjs — R-WEB-UI-RESOURCE-CARDS-GROSS-AND-NET-Q1 (Maciej 2026-11-14).
 *
 * Run from gra/:  node tools/resource-cards-gross-net-test.cjs [--no-mutants]
 *
 * Pokrywa:
 *   A. gra/src/game/resource-gross-net.ts (czysty moduł, jedno źródło brutto/netto):
 *      brutto = max(0, produkcja + przychód umów); zużycie = obywatele+budynki+wojsko;
 *      netto = ratePerTurn − zużycie (ta sama formuła co nagłówek „Brutto … → netto …”).
 *   B. Karta surowca (prawdziwy resCardHtml z empireDetailPanel.ts) ma wiersz brutto+netto,
 *      netto ujemne = klasa „bad”; surowiec bez produkcji i bez zużycia — bez wiersza („—" jak dziś).
 *   C. Test sumowania: suma brutto/netto po kartach = wartości nagłówka (ten sam moduł, ta sama
 *      pętla po tych samych wierszach co storedResourceRows/shortageRows w main.ts).
 *   D. Statyczne: main.ts nagłówek liczy surowceBilans przez resourceGrossNetPerTurn (brak
 *      drugiej kalkulacji `Math.max(0, (r.rateProductionPerTurn`).
 *   M. Mutanty: (1) karta BEZ wiersza brutto MUSI czerwienić test; (2) nagłówek/moduł bez
 *      odjęcia zużycia MUSI czerwienić test sumowania.
 * Nie dotyka produkcji/zużycia/balansu — tylko odczyt i prezentacja.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const SRC = path.join(GRA, 'src');
const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
const NO_MUTANTS = process.argv.includes('--no-mutants');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'res-gn-test-'));

let fails = 0;
let passes = 0;
function ok(c, m, extra) {
  if (c) { passes++; console.log('  ok   ' + m); }
  else { fails++; console.log('  FAIL ' + m + (extra !== undefined ? ' -- ' + JSON.stringify(extra) : '')); }
}

/** Buduje moduł-wejście: eksportuje helper i kartę; `panelPath` może być mutantem w TMP. */
async function bundleProbe(panelPath, outName) {
  const entry = path.join(TMP, 'probe-' + outName + '.ts');
  fs.writeFileSync(entry, [
    `import * as G from ${JSON.stringify(path.join(SRC, 'game', 'resource-gross-net.ts'))};`,
    `import * as P from ${JSON.stringify(panelPath)};`,
    `(globalThis as any).__probe = { G, P };`,
  ].join('\n'));
  const outFile = path.join(TMP, outName + '.cjs');
  await esbuild.build({
    entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile: outFile, logLevel: 'silent',
    loader: { '.ts': 'ts', '.json': 'json', '.svg': 'text', '.png': 'dataurl', '.mp3': 'empty', '.css': 'text' },
    plugins: [{
      name: 'stub-browser',
      setup(b) {
        // Import-time bez DOM: pliki z `import.meta.glob`/`?raw` stubujemy pustym modułem.
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
  // Stub przeglądarki: resCardHtml/resGrossNetLineHtml nie dotykają DOM, ale import panelu może.
  // Import panelu wykonuje kod DOM na poziomie modułu; podstawiamy przezroczysty stub (każde
  // wywołanie/odczyt zwraca stub). Nie wpływa na funkcje czystego renderu HTML testowane niżej.
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

(async () => {
  console.log('=== resource-cards-gross-net-test ===');
  const probe = await bundleProbe(path.join(SRC, 'ui', 'empireDetailPanel.ts'), 'real');
  const { G, P } = probe;

  // ---- A. moduł czysty ----
  console.log('-- A. resource-gross-net (jedno źródło)');
  const drewno = { ratePerTurn: 457, rateProductionPerTurn: 457, usage: { buildings: 20, citizens: 10, units: 5 } };
  const gA = G.resourceGrossNetPerTurn(drewno);
  ok(gA.brutto === 457, 'A1 brutto = produkcja (457)', gA);
  ok(gA.zuzycie === 35, 'A2 zużycie = obywatele+budynki+wojsko (35)', gA);
  ok(gA.netto === 422, 'A3 netto = ratePerTurn − zużycie (422)', gA);
  // Spójny fixture: ratePerTurn = produkcja(10) − umowy wychodzące(4) + przychodzące(3) = 9.
  const diplo = { ratePerTurn: 9, rateProductionPerTurn: 10, rateDiploOutPerTurn: 4, rateDiploInPerTurn: 3, usage: { buildings: 1, citizens: 0, units: 0 } };
  const gD = G.resourceGrossNetPerTurn(diplo);
  ok(gD.brutto === 13, 'A4 brutto = produkcja + przychód umów (13), wydatki umów nie w brutto', gD);
  ok(gD.netto === 8, 'A5 netto = ratePerTurn(9) − zużycie(1) = 8 (wydatki umów już w ratePerTurn)', gD);
  const brak = { ratePerTurn: 0, rateProductionPerTurn: 0, usage: { buildings: 0, citizens: 12, units: 0 } };
  const gB = G.resourceGrossNetPerTurn(brak);
  ok(gB.brutto === 0 && gB.netto === -12, 'A6 produkcja 0 i zużycie 12 (netto = 0 − 12 = −12) → brutto 0, netto ujemne', gB);
  ok(G.resourceGrossNetPerTurn({ ratePerTurn: 0, rateProductionPerTurn: 0 }).brutto === 0, 'A7 brak produkcji → brutto 0 (nie ujemne)');
  ok(G.resourceGrossNetPerTurn({ ratePerTurn: -3, rateProductionPerTurn: -3 }).brutto === 0, 'A8 brutto nigdy ujemne (clamp 0)');

  // ---- B. karta ----
  console.log('-- B. karta surowca (resCardHtml, prawdziwy kod panelu)');
  const cardBase = {
    id: 'drewno', icon: '🪵', label: 'Drewno', stock: 4384, cap: 50000, typ: 'surowy', dostep: true,
    ratePerTurn: 457, rateProductionPerTurn: 457,
    usage: { buildings: 20, citizens: 10, units: 5 },
  };
  const cardHtml = P.resCardHtml(cardBase);
  const gnLine = P.resGrossNetLineHtml(cardBase);
  ok(gnLine.includes('civ-emp-res-gn'), 'B1 karta z produkcją i zużyciem ma wiersz brutto/netto');
  // R-WEB-UI-RESOURCE-CARD-NUMBERS-ONLY-DETAILS-COLLAPSED-Q1: wiersz = same liczby „+X · +Y”, bez słów
  ok(clean(gnLine) === '+457 · +422', 'B2 wiersz pokazuje same liczby „+457 · +422” (bez „Brutto”, „netto”, „/ turę”)', clean(gnLine));
  ok(!/Brutto|netto|turę/i.test(clean(gnLine)), 'B2b widoczny tekst wiersza bez słów brutto/netto/turę', clean(gnLine));
  ok(/title="[^"]*Brutto[^"]*Netto[^"]*"/.test(gnLine), 'B2c wyjaśnienie brutto/netto niesie tooltip (title) wiersza', gnLine);
  ok(cardHtml.includes(gnLine), 'B3 wiersz jest w kartcie (resCardHtml zawiera resGrossNetLineHtml)');
  const cardNeg = { ...cardBase, id: 'glina', label: 'Glina', stock: 10, cap: 1000, ratePerTurn: 0, rateProductionPerTurn: 0, usage: { buildings: 0, citizens: 12, units: 0 } };
  const negLine = P.resGrossNetLineHtml(cardNeg);
  ok(negLine.includes('civ-emp-res-gn bad'), 'B4 netto ujemne → klasa „bad” (czerwone)', negLine);
  ok(clean(negLine) === '0 · −12', 'B5 brutto 0 i netto −12 widoczne jako „0 · −12”', clean(negLine));
  const cardEmpty = { ...cardBase, id: 'cegla', label: 'Cegła', stock: 0, cap: 1000, ratePerTurn: 0, rateProductionPerTurn: 0, usage: undefined };
  ok(P.resGrossNetLineHtml(cardEmpty) === '', 'B6 bez produkcji i bez zużycia — brak wiersza (jak dziś „—”)');
  const placeholder = { ...cardBase, placeholder: true, cap: 0 };
  ok(P.resGrossNetLineHtml(placeholder) === '', 'B7 placeholder bez wiersza');

  // ---- C. sumowanie kart = nagłówek ----
  console.log('-- C. test sumowania (karty vs nagłówek)');
  const fixture = [
    { ratePerTurn: 100, rateProductionPerTurn: 100, usage: { buildings: 10, citizens: 0, units: 0 } }, // brutto 100 netto 90
    { ratePerTurn: -5, rateProductionPerTurn: 50, rateDiploOutPerTurn: 55, usage: { buildings: 0, citizens: 30, units: 0 } }, // brutto 50 netto -35
    { ratePerTurn: 0, rateProductionPerTurn: 0 }, // brutto 0 netto 0
    { ratePerTurn: 7, rateProductionPerTurn: 2, rateDiploInPerTurn: 5, usage: { buildings: 0, citizens: 0, units: 3 } }, // brutto 7 netto 4
  ];
  const sums = fixture.map((r) => G.resourceGrossNetPerTurn(r)).reduce(
    (a, g) => ({ brutto: a.brutto + g.brutto, netto: a.netto + g.netto }), { brutto: 0, netto: 0 });
  ok(sums.brutto === 157, 'C1 suma brutto po kartach = 157 (ręcznie: 100+50+0+7)', sums);
  ok(sums.netto === 59, 'C2 suma netto po kartach = 59 (ręcznie: 90−35+0+4)', sums);
  const cardSumLines = fixture.map((r, i) => P.resGrossNetLineHtml({ id: 'x' + i, icon: '', label: 'x' + i, stock: 0, cap: 1, typ: 'surowy', dostep: true, ...r }));
  const shown = cardSumLines.join('').match(/civ-emp-res-gn/g) || [];
  ok(shown.length === 3, 'C3 karty bez produkcji i zużycia pominięte; 3 karty pokazują wiersz liczb', shown);

  // ---- D. statyczne: nagłówek używa tego samego modułu ----
  console.log('-- D. main.ts nagłówek = ten sam moduł');
  const mainTs = fs.readFileSync(path.join(SRC, 'main.ts'), 'utf8');
  ok(/resourceGrossNetPerTurn\(r\)/.test(mainTs) && /from '\.\/game\/resource-gross-net'/.test(mainTs), 'D1 main.ts liczy surowceBilans przez resourceGrossNetPerTurn');
  ok(!/Math\.max\(0, \(r\.rateProductionPerTurn \?\? r\.ratePerTurn\) \+ \(r\.rateDiploInPerTurn/.test(mainTs), 'D2 brak drugiej kalkulacji brutto w main.ts');

  // ---- M. mutanty ----
  if (!NO_MUTANTS) {
    console.log('-- M. mutanty (muszą czerwienić test)');
    const panelSrc = fs.readFileSync(path.join(SRC, 'ui', 'empireDetailPanel.ts'), 'utf8');
    const fixImports = (s) => s.replace(/from '(\.\.?\/[^']+)'/g, (_m, p) => `from ${JSON.stringify(path.resolve(path.join(SRC, 'ui'), p))}`);
    // M1: karta bez wiersza brutto/netto
    const m1Src = fixImports(panelSrc).replace('    + resGrossNetLineHtml(r)\n', '');
    if (m1Src === fixImports(panelSrc)) { fails++; console.log('  FAIL M1 wzorzec mutacji nie trafił'); }
    else {
      const m1Path = path.join(TMP, 'mut1-panel.ts');
      fs.writeFileSync(m1Path, m1Src);
      const mp = await bundleProbe(m1Path, 'mut1');
      const h = mp.P.resCardHtml(cardBase);
      const red = !h.includes('civ-emp-res-gn');
      ok(red, 'M1 mutant „brak brutto na karcie” jest wykrywany (wiersz nieobecny)');
    }
    // M2: moduł bez odjęcia zużycia (netto = ratePerTurn)
    const gnSrc = fs.readFileSync(path.join(SRC, 'game', 'resource-gross-net.ts'), 'utf8');
    // R-WEB-UI-HUD-NET-CONVERTER-INPUTS-Q1: netto odejmuje też wejścia konwerterów — wzorzec mutanta zaktualizowany.
    const m2Src = gnSrc.replace(
      'netto: Math.round(r.ratePerTurn - resourceUsageSum(r) - resourceConverterInputSum(r)),',
      'netto: Math.round(r.ratePerTurn),',
    );
    if (m2Src === gnSrc) { fails++; console.log('  FAIL M2 wzorzec mutacji nie trafił'); }
    else {
      const m2Path = path.join(TMP, 'mut2-gross-net.ts');
      fs.writeFileSync(m2Path, m2Src);
      const entry = path.join(TMP, 'probe-mut2.ts');
      fs.writeFileSync(entry, `import * as G from ${JSON.stringify(m2Path)}; (globalThis as any).__m2 = G;`);
      const out = path.join(TMP, 'mut2.cjs');
      await esbuild.build({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile: out, logLevel: 'silent' });
      require(out);
      const g = globalThis.__m2.resourceGrossNetPerTurn(drewno);
      const detected = g.netto !== 422;
      ok(detected, 'M2 mutant „netto bez zużycia” jest wykrywany przez test sumowania/netto', g);
    }
  }

  console.log(`\n=== resource-cards-gross-net-test: ${passes} pass, ${fails} fail ===`);
  process.exit(fails === 0 ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(2); });
