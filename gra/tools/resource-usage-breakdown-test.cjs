'use strict';
/**
 * resource-usage-breakdown-test.cjs — P-SUROWCE-BRAK-SZCZEGOLOW-ZUZYCIA (Maciej 2026-08-12,
 * `dyspozycje/PYTANIA-OTWARTE.md` punkt 9) + P-ZUZYCIE-ROZBICIE-NIEDOBOR (Evaluator FAIL na
 * przyciski a79bae29, runda 2 — suma kłamie przy niedoborze, stan po save-load
 * niedoszacowany, test za słaby).
 *
 * Run from gra/:  node tools/resource-usage-breakdown-test.cjs
 *
 * Pokrywa:
 *   A. resource-usage-breakdown.ts (pure) — resourceUsageBreakdownFor/resourceUsageTotal/
 *      resourceUsageHasAny, edge cases (brak rekordu, zero, dane śmieciowe).
 *   B. INWARIANT (rdzeń zgłoszenia): totalBuildingResourceUpkeep(buildings) +
 *      totalUnitResourceUpkeep(units) (te same prymitywy co turn-economy.ts) sumują się
 *      DOKŁADNIE do tego, co dziś ląduje w resourceUpkeepByOwner (czyli do tego, co
 *      main.ts faktycznie odejmuje z magazynu przez deductBuildingStockCostAcrossCities) —
 *      dowód, że rozbicie NIE jest osobnym, mogącym się rozjechać przeliczeniem.
 *   C. turn-economy.ts: resourceUpkeepBuildingsByOwner/UnitsByOwner budowane PRZED scaleniem
 *      (addResourceCosts) w resourceUpkeepByOwner — struktura źródła, nie tylko obecność pól.
 *   D. main.ts: buildingResourceUpkeepByOwner/unitResourceUpkeepByOwner publikowane WPROST z
 *      econ.resourceUpkeepBuildingsByOwner/UnitsByOwner — dla GRACZA i dla AI (parytet).
 *   E. main.ts: buildEmpireResourceRows() konstruuje `usage` przez resourceUsageBreakdownFor
 *      z citizenUpkeep.deductions + ownerBuildingResUpkeep/ownerUnitResUpkeep (z fallbackiem
 *      live — sekcja E2026-08-12b) — czyta werdykt silnika, nie przelicza drugi raz.
 *   E2026-08-12b. main.ts: ownerBuildingResUpkeep/ownerUnitResUpkeep MAJĄ fallback na
 *      previewOwnerBuildingResourceUpkeep/totalUnitResourceUpkeep (żywy przelicz z aktualnego
 *      stanu gry), TEN SAM wzorzec co citizenUpkeep ?? computeCitizenResourceDrain — naprawa
 *      "stan po save-load niedoszacowany" (zadanie 2).
 *   F. Wszystkie 5 miejsc czyszczenia citizenUpkeepByOwner (nowa gra / wczytanie) czyszczą
 *      RÓWNIEŻ obie nowe mapy — inaczej panel po nowej grze pokazywałby zużycie z poprzedniej.
 *   G. empireDetailTypes.ts: EmpireResourceRow.usage ma typ ResourceUsageBreakdown.
 *   H. empireDetailPanel.ts: resUsageDetailsHtml wpięte w resCardHtml, gated przez r.usage,
 *      teraz EKSPORTOWANE dla bezpośredniego wywołania (sekcje I-K niżej).
 *   I. previewOwnerBuildingResourceUpkeep / totalUnitResourceUpkeep (economy-upkeep.ts) —
 *      REALNE wywołanie z kontrolowanymi cities/buildingCatalog/builtByCity/units, symulujące
 *      dokładnie to, co main.ts liczy jako fallback po wczytaniu save'a (zadanie 2) — asercje
 *      na WYNIKU LICZBOWYM, nie na obecności podciągu.
 *   J. Łańcuch end-to-end "stan po save-load": preview funkcje (I) -> resourceUsageBreakdownFor
 *      -> resUsageDetailsHtml (WOŁANE NAPRAWDĘ, nie dopasowanie tekstu źródła) — dowód, że
 *      cały potok daje NIEZEROWE, poprawne liczby zamiast pustego/mylącego panelu.
 *   K. Zadanie 1 (suma kłamie przy niedoborze): resUsageDetailsHtml WOŁANE NAPRAWDĘ z
 *      niedoborowym scenariuszem (computeCitizenResourceDrain z realnym klamrowaniem
 *      kontrastowanym z NIEklamrowanym budynki/wojsko) — asercje liczbowe na wyrenderowanych
 *      wartościach + regresja etykiet („zapotrzebowanie"/„drenaż realny", NIE „zużycie"/
 *      „utrzymanie" dla budynków/wojska).
 *
 * Sekcje C, D, E, F, G, H2026-08-12 (parytet+istnienie eksportu) pozostają dopasowaniem tekstu
 * źródła TYLKO tam, gdzie egzekwowana własność jest strukturą pliku main.ts/turn-economy.ts,
 * których NIE da się zbundlować/wykonać pod Node (main.ts zależy od Vite `import.meta.glob` /
 * `?raw` — udokumentowana, pre-istniejąca awaria harnessu, patrz CLAUDE.md
 * P-BRAMKA-MAP-FIELD-BATTLE-PRE-BATTLE-SAVE-CZERWONE). Sekcje I-K obchodzą to ograniczenie
 * tam, gdzie realna logika liczbowa mieszkająca w PLIKACH BEZ zależności DOM/Vite
 * (economy-upkeep.ts, resource-usage-breakdown.ts, citizen-resource-upkeep.ts,
 * empireDetailPanel.ts — ten ostatni z jednym stubem dla ./icons/brandAssets, jedynej
 * przyczyny `import.meta.glob` w jego drzewie zależności, patrz STUB_BRAND_ASSETS niżej).
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[resource-usage-breakdown-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY_FILE = path.resolve(__dirname, '.resource-usage-breakdown-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.resource-usage-breakdown-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export {
  resourceUsageBreakdownFor,
  resourceUsageTotal,
  resourceUsageHasAny,
  emptyResourceUsageBreakdown,
} from '../src/game/resource-usage-breakdown';
export {
  totalBuildingResourceUpkeep,
  totalUnitResourceUpkeep,
  previewOwnerBuildingResourceUpkeep,
  addResourceCosts,
} from '../src/game/economy-upkeep';
export {
  computeCitizenResourceDrain,
} from '../src/game/citizen-resource-upkeep';
export {
  resUsageDetailsHtml,
} from '../src/ui/empireDetailPanel';
`, 'utf8');

/**
 * empireDetailPanel.ts (sekcje H-K) potrzebuje zbundlowania dla realnego wywołania —
 * JEDYNA przeszkoda w jego drzewie zależności to `./icons/brandAssets`, który na poziomie
 * MODUŁU (nie funkcji) woła `import.meta.glob(...)` (Vite-only API, nieobsługiwane pod
 * Node/esbuild-cjs — udokumentowana klasa awarii, patrz nagłówek pliku). `resUsageDetailsHtml`
 * (funkcja pod testem) w ogóle NIE UŻYWA `brandIconSvg`/`mapResourceIconSvg` (używane przez
 * INNE funkcje w tym samym pliku, np. miniHeaderCell/resIconHtml) — ale moduły ES wykonują
 * CAŁY kod na poziomie top-level przy imporcie, więc bez tego stuba `require(BUNDLE_FILE)`
 * rzuciłby wyjątkiem zanim dotarlibyśmy do `resUsageDetailsHtml`. Stub podmienia WYŁĄCZNIE
 * ten jeden moduł (dopasowanie po ścieżce importu), zero zmian w kodzie produkcyjnym.
 * / EN: only obstacle to bundling empireDetailPanel.ts for real execution is
 * `./icons/brandAssets`, which calls Vite-only `import.meta.glob` at MODULE top level. The
 * function under test never calls its exports, but ES modules execute all top-level code on
 * import, so it would throw before we ever reach `resUsageDetailsHtml`. This plugin replaces
 * ONLY that one module (by import path) with an inert stub -- zero production code changes.
 */
const STUB_BRAND_ASSETS_PLUGIN = {
  name: 'stub-brand-assets',
  setup(build) {
    build.onResolve({ filter: /icons\/brandAssets$/ }, (args) => (
      { path: args.path, namespace: 'stub-brand-assets' }
    ));
    build.onLoad({ filter: /.*/, namespace: 'stub-brand-assets' }, () => ({
      contents:
        'export function brandIconSvg(id, size) { return String(id); }\n'
        + 'export function mapResourceIconSvg(label, size) { return String(label); }\n',
      loader: 'js',
    }));
  },
};

let passed = 0, failed = 0;
function assert(cond, msg) { if (cond) { passed++; } else { failed++; console.error('FAIL:', msg); } }
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

async function main() {
  try {
    await esbuild.build({
      entryPoints: [ENTRY_FILE],
      bundle: true,
      platform: 'node',
      format: 'cjs',
      target: 'node18',
      loader: { '.ts': 'ts', '.json': 'json' },
      plugins: [STUB_BRAND_ASSETS_PLUGIN],
      outfile: BUNDLE_FILE,
      absWorkingDir: GRA,
      logLevel: 'silent',
    });
  } catch (e) {
    console.error('[resource-usage-breakdown-test] esbuild bundling failed:\n', e.message || e);
    process.exit(1);
  }

  delete require.cache[require.resolve(BUNDLE_FILE)];
  const M = require(BUNDLE_FILE);

  const MAIN_TS = path.join(GRA, 'src', 'main.ts');
  const mainSrcRaw = fs.readFileSync(MAIN_TS, 'utf8');
  const TURN_ECON_TS = path.join(GRA, 'src', 'game', 'turn-economy.ts');
  const turnEconSrcRaw = fs.readFileSync(TURN_ECON_TS, 'utf8');
  const EMPIRE_TYPES_TS = path.join(GRA, 'src', 'ui', 'empireDetailTypes.ts');
  const empireTypesSrcRaw = fs.readFileSync(EMPIRE_TYPES_TS, 'utf8');
  const EMPIRE_PANEL_TS = path.join(GRA, 'src', 'ui', 'empireDetailPanel.ts');
  const empirePanelSrcRaw = fs.readFileSync(EMPIRE_PANEL_TS, 'utf8');

  /** Same naive line-comment strip as citizen-resource-upkeep-test.cjs (safe for the same reason). */
  function stripLineComments(src) {
    return src
      .split('\n')
      .map((line) => {
        const idx = line.indexOf('//');
        return idx >= 0 ? line.slice(0, idx) : line;
      })
      .join('\n');
  }
  const mainSrcStripped = stripLineComments(mainSrcRaw);
  const turnEconSrcStripped = stripLineComments(turnEconSrcRaw);

  /** Parsuje wszystkie „<span class="k">LABEL</span><span class="v">−N</span>" z HTML rozbicia. */
  function parseUsageRows(html) {
    const rows = {};
    const re = /<span class="k">([^<]+)<\/span><span class="v">−(-?\d+(?:\.\d+)?)<\/span>/g;
    let m;
    while ((m = re.exec(html))) rows[m[1]] = Number(m[2]);
    return rows;
  }

  // ===========================================================================
  // A. resource-usage-breakdown.ts (pure) — kształt/edge cases
  // ===========================================================================
  console.log('\n-- A. resourceUsageBreakdownFor / resourceUsageTotal / resourceUsageHasAny --');
  {
    const citizens = { drewno: 8, glina: 10 };
    const buildings = { drewno: 3, kamien: 1 };
    const units = { drewno: 2 };

    const drewno = M.resourceUsageBreakdownFor('drewno', citizens, buildings, units);
    eq(drewno.citizens, 8, 'drewno.citizens = deductions.drewno');
    eq(drewno.buildings, 3, 'drewno.buildings = buildingUpkeep.drewno');
    eq(drewno.units, 2, 'drewno.units = unitUpkeep.drewno');
    eq(M.resourceUsageTotal(drewno), 13, 'resourceUsageTotal = suma trzech pól (8+3+2)');
    assert(M.resourceUsageHasAny(drewno), 'drewno ma jakiekolwiek zużycie -> hasAny=true');

    const kamien = M.resourceUsageBreakdownFor('kamien', citizens, buildings, units);
    eq(kamien.citizens, 0, 'kamien: brak wpisu w citizens -> 0 (nie undefined/NaN)');
    eq(kamien.buildings, 1, 'kamien.buildings = 1');
    eq(kamien.units, 0, 'kamien: brak wpisu w units -> 0');

    const zloto = M.resourceUsageBreakdownFor('zloto', citizens, buildings, units);
    eq(M.resourceUsageTotal(zloto), 0, 'zloto: brak w żadnym z trzech rekordów -> total 0');
    assert(!M.resourceUsageHasAny(zloto), 'zloto: total 0 -> hasAny=false (przycisk „Zobacz szczegóły" niepotrzebny)');

    // Rekordy null/undefined (np. przed pierwszą turą, silnik jeszcze nic nie policzył) -> 0 wszędzie, bez crasha.
    const przedTura = M.resourceUsageBreakdownFor('drewno', undefined, null, undefined);
    eq(M.resourceUsageTotal(przedTura), 0, 'wszystkie rekordy null/undefined -> total 0, brak crasha');

    // emptyResourceUsageBreakdown -- kształt zerowy, niezależne kopie (mutacja jednej nie rusza drugiej).
    const e1 = M.emptyResourceUsageBreakdown();
    const e2 = M.emptyResourceUsageBreakdown();
    e1.buildings = 99;
    eq(e2.buildings, 0, 'emptyResourceUsageBreakdown zwraca NOWY obiekt za każdym razem (mutacja e1 nie rusza e2)');
  }

  // ===========================================================================
  // B. INWARIANT: totalBuildingResourceUpkeep + totalUnitResourceUpkeep (addResourceCosts)
  //    sumują się DOKŁADNIE do tego co dziś liczy turn-economy.ts jako resourceUpkeepByOwner
  //    (dowód, że rozbicie budynki/wojsko nie jest osobnym przeliczeniem)
  // ===========================================================================
  console.log('\n-- B. Inwariant: buildings + units (addResourceCosts) === merged total, per klucz --');
  {
    const buildings = [
      { record: { koszt_surowce: { drewno: 5, kamien: 2 }, utrzymanie: 1 }, level: 1 },
      { record: { koszt_surowce: { drewno: 1 }, utrzymanie: 1 }, level: 1 },
      { record: { koszt_surowce: {}, utrzymanie: 1 }, level: 1 }, // brak kosztu -> brak wpisu w upkeep
    ];
    const units = [
      { typeId: 'Hastati' },
      { typeId: 'Triarii' },
    ];
    const resolveUnitDef = (typeId) => ({
      Hastati: { 'Utrzymanie surowiec': 'Żelazo', 'Utrzymanie surowiec (ilość)': 2 },
      Triarii: { 'Utrzymanie surowiec': 'Drewno', 'Utrzymanie surowiec (ilość)': 4 },
    })[typeId];

    const buildingsUpkeep = M.totalBuildingResourceUpkeep(buildings);
    const unitsUpkeep = M.totalUnitResourceUpkeep(units, resolveUnitDef);

    // Sanity na wejściu: buildingResourceUpkeep to 1 SZT./TYP obecny w koszt_surowce (nie kwota kosztu).
    eq(buildingsUpkeep.drewno, 2, 'buildings: 2 budynki mają "drewno" w koszt_surowce -> 1+1=2 (nie suma kwot 5+1)');
    eq(buildingsUpkeep.kamien, 1, 'buildings: 1 budynek ma "kamien" w koszt_surowce -> 1');
    assert(!('zelazo' in buildingsUpkeep), 'buildings: żaden budynek nie kosztuje żelaza -> brak klucza');
    eq(unitsUpkeep.zelazo, 2, 'units: Hastati utrzymanie 2 żelaza/turę');
    eq(unitsUpkeep.drewno, 4, 'units: Triarii utrzymanie 4 drewna/turę');

    // Scalenie identyczne z turn-economy.ts (linia: const resUpkeep = {...buildingsResUpkeep}; addResourceCosts(resUpkeep, unitsResUpkeep);).
    const merged = { ...buildingsUpkeep };
    M.addResourceCosts(merged, unitsUpkeep);

    for (const key of new Set([...Object.keys(buildingsUpkeep), ...Object.keys(unitsUpkeep)])) {
      const b = buildingsUpkeep[key] ?? 0;
      const u = unitsUpkeep[key] ?? 0;
      eq(merged[key], b + u, `inwariant per klucz "${key}": merged = buildings + units (${b}+${u})`);
    }
    eq(merged.drewno, 2 + 4, 'drewno: 2 (budynki) + 4 (wojsko, Triarii) = 6 -- dokładnie to co odejmuje deductBuildingStockCostAcrossCities');
    eq(merged.zelazo, 0 + 2, 'zelazo: 0 (budynki) + 2 (wojsko, Hastati) = 2');
    eq(merged.kamien, 1 + 0, 'kamien: 1 (budynki) + 0 (wojsko) = 1');
  }

  // ===========================================================================
  // C. turn-economy.ts: resourceUpkeepBuildingsByOwner/UnitsByOwner budowane PRZED scaleniem
  // ===========================================================================
  console.log('\n-- C. turn-economy.ts: split budowany przed addResourceCosts, ten sam wynik co resourceUpkeepByOwner --');
  {
    assert(
      turnEconSrcStripped.includes('resourceUpkeepBuildingsByOwner: Map<number, Record<string, number>>;'),
      'C1: EconomyTickResult deklaruje resourceUpkeepBuildingsByOwner',
    );
    assert(
      turnEconSrcStripped.includes('resourceUpkeepUnitsByOwner: Map<number, Record<string, number>>;'),
      'C2: EconomyTickResult deklaruje resourceUpkeepUnitsByOwner',
    );
    assert(
      turnEconSrcStripped.includes('resourceUpkeepBuildingsByOwner: new Map(),')
        && turnEconSrcStripped.includes('resourceUpkeepUnitsByOwner: new Map(),'),
      'C3: obie mapy zainicjowane jako new Map() w konstruktorze result',
    );

    const ANCHOR = 'const buildingsResUpkeep: Record<string, number> = totalBuildingResourceUpkeep(';
    const anchorIdx = turnEconSrcStripped.indexOf(ANCHOR);
    assert(anchorIdx > -1, 'C4: kotwica "const buildingsResUpkeep = totalBuildingResourceUpkeep(" znaleziona');
    const END_ANCHOR = 'result.resourceUpkeepUnitsByOwner.set(oid, unitsResUpkeep);';
    const endIdx = anchorIdx > -1 ? turnEconSrcStripped.indexOf(END_ANCHOR, anchorIdx) : -1;
    assert(endIdx > anchorIdx, 'C5: kotwica końcowa "result.resourceUpkeepUnitsByOwner.set(oid, unitsResUpkeep);" leży PO buildingsResUpkeep -- okno dobrze uformowane');
    const win = (anchorIdx > -1 && endIdx > anchorIdx) ? turnEconSrcStripped.slice(anchorIdx, endIdx + END_ANCHOR.length) : '';

    assert(win.includes('const unitsResUpkeep: Record<string, number> = totalUnitResourceUpkeep(ounits,'),
      'C6: unitsResUpkeep liczone przez totalUnitResourceUpkeep (ten sam prymityw co sekcja B), wewnątrz tego samego okna');
    assert(win.includes('const resUpkeep: Record<string, number> = { ...buildingsResUpkeep };'),
      'C7: resUpkeep startuje jako KOPIA buildingsResUpkeep (nie osobne przeliczenie)');
    assert(win.includes('addResourceCosts(resUpkeep, unitsResUpkeep);'),
      'C8: resUpkeep scalone z unitsResUpkeep przez addResourceCosts -- ten sam prymityw co sekcja B');

    // Kolejność: publikacja resourceUpkeepByOwner MUSI nastąpić PO scaleniu (żeby nieść pełną sumę),
    // a publikacja Buildings/UnitsByOwner niesie SUROWE (nie scalone) wartości sprzed addResourceCosts.
    const idxSetTotal = win.indexOf('result.resourceUpkeepByOwner.set(oid, resUpkeep);');
    const idxSetBuildings = win.indexOf('result.resourceUpkeepBuildingsByOwner.set(oid, buildingsResUpkeep);');
    const idxSetUnits = win.indexOf('result.resourceUpkeepUnitsByOwner.set(oid, unitsResUpkeep);');
    assert(idxSetTotal > -1 && idxSetBuildings > -1 && idxSetUnits > -1,
      'C9: wszystkie trzy .set(...) obecne wewnątrz tej samej pętli `for (const oid of ownerIds)`');
    assert(idxSetBuildings > win.indexOf('addResourceCosts(resUpkeep, unitsResUpkeep);'),
      'C10: publikacja resourceUpkeepBuildingsByOwner leży PO addResourceCosts w tekście, ale niesie buildingsResUpkeep SPRZED mutacji (addResourceCosts mutuje resUpkeep, osobną zmienną, nie buildingsResUpkeep) -- patrz sekcja B dla dowodu wartościowego');
  }

  // ===========================================================================
  // D. main.ts: buildingResourceUpkeepByOwner/unitResourceUpkeepByOwner publikowane WPROST
  //    z econ.resourceUpkeepBuildingsByOwner/UnitsByOwner -- gracz I AI (parytet)
  // ===========================================================================
  console.log('\n-- D. main.ts: publikacja WPROST z econ.resourceUpkeep{Buildings,Units}ByOwner (gracz + AI) --');
  {
    assert(
      mainSrcStripped.includes("import { resourceUsageBreakdownFor, resourceUsageHasAny } from './game/resource-usage-breakdown';"),
      'D1: main.ts importuje resourceUsageBreakdownFor/resourceUsageHasAny z resource-usage-breakdown.ts',
    );
    assert(
      mainSrcStripped.includes('const buildingResourceUpkeepByOwner = new Map<number, Record<string, number>>();')
        && mainSrcStripped.includes('const unitResourceUpkeepByOwner = new Map<number, Record<string, number>>();'),
      'D2: main.ts deklaruje obie mapy trwałe (ten sam wzorzec co citizenUpkeepByOwner)',
    );

    // Gracz (ownerId=0): publikacja leży w tym samym bloku co _lastBogactwoUtrzymanieSurowcow.
    assert(
      mainSrcStripped.includes("buildingResourceUpkeepByOwner.set(0, { ...(econ.resourceUpkeepBuildingsByOwner.get(0) ?? {}) });"),
      'D3: gracz -- buildingResourceUpkeepByOwner.set(0, ...) czyta WPROST econ.resourceUpkeepBuildingsByOwner.get(0), zero przeliczenia',
    );
    assert(
      mainSrcStripped.includes("unitResourceUpkeepByOwner.set(0, { ...(econ.resourceUpkeepUnitsByOwner.get(0) ?? {}) });"),
      'D4: gracz -- unitResourceUpkeepByOwner.set(0, ...) czyta WPROST econ.resourceUpkeepUnitsByOwner.get(0)',
    );

    // AI: publikacja wewnątrz `for (const oid of aiOwnerIds)`, TUŻ PO deductBuildingStockCostAcrossCities(cities, oid, aiResUpkeep).
    const AI_LOOP_ANCHOR = 'for (const oid of aiOwnerIds) {';
    const aiLoopIdx = mainSrcStripped.indexOf(AI_LOOP_ANCHOR);
    assert(aiLoopIdx > -1, 'D5: kotwica pętli AI "for (const oid of aiOwnerIds) {" znaleziona');
    const aiDeductIdx = aiLoopIdx > -1 ? mainSrcStripped.indexOf('deductBuildingStockCostAcrossCities(cities, oid, aiResUpkeep);', aiLoopIdx) : -1;
    assert(aiDeductIdx > aiLoopIdx, 'D6: deductBuildingStockCostAcrossCities(cities, oid, aiResUpkeep) leży wewnątrz pętli AI');
    const aiWindow = aiDeductIdx > -1 ? mainSrcStripped.slice(aiDeductIdx, aiDeductIdx + 500) : '';
    assert(
      aiWindow.includes('buildingResourceUpkeepByOwner.set(oid, { ...(econ.resourceUpkeepBuildingsByOwner.get(oid) ?? {}) });'),
      'D7 (parytet gracz/AI): AI -- buildingResourceUpkeepByOwner.set(oid, ...) czyta WPROST econ.resourceUpkeepBuildingsByOwner.get(oid), tuż po deduct',
    );
    assert(
      aiWindow.includes('unitResourceUpkeepByOwner.set(oid, { ...(econ.resourceUpkeepUnitsByOwner.get(oid) ?? {}) });'),
      'D8 (parytet gracz/AI): AI -- unitResourceUpkeepByOwner.set(oid, ...) czyta WPROST econ.resourceUpkeepUnitsByOwner.get(oid)',
    );
    assert(
      !/ownerId\s*===\s*0/.test(aiWindow),
      'D9: brak filtra "ownerId === 0" wewnątrz okna publikacji AI -- KAŻDY właściciel AI dostaje rozbicie, nie tylko wybrani',
    );
  }

  // ===========================================================================
  // E. main.ts: buildEmpireResourceRows konstruuje `usage` z werdyktu silnika + fallbackiem
  //    live dla budynków/wojska (zadanie 2 -- naprawa "stan po save-load niedoszacowany")
  // ===========================================================================
  console.log('\n-- E. buildEmpireResourceRows: usage = resourceUsageBreakdownFor(..., z fallbackiem live gdy mapy puste) --');
  {
    const FN_ANCHOR = 'function buildEmpireResourceRows(ownerId: number): EmpireResourceRow[] {';
    const fnIdx = mainSrcStripped.indexOf(FN_ANCHOR);
    assert(fnIdx > -1, 'E1: kotwica "function buildEmpireResourceRows(...)" znaleziona');
    const endIdx = fnIdx > -1 ? mainSrcStripped.indexOf('return rows;', fnIdx) : -1;
    assert(endIdx > fnIdx, 'E2: kotwica "return rows;" znaleziona PO początku funkcji');
    const fnWindow = (fnIdx > -1 && endIdx > fnIdx) ? mainSrcStripped.slice(fnIdx, endIdx) : '';

    // E3/E4 (P-SUROWCE-SAVE-LOAD-PUSTE, zadanie 2): linia bazowa TERAZ ma fallback `?? previewOwnerBuildingResourceUpkeep(...)` /
    // `?? totalUnitResourceUpkeep(...)` -- goły `buildingResourceUpkeepByOwner.get(ownerId);`
    // BEZ fallbacku (stary tekst) był DOKŁADNIE błędem zadania 2 (mapa pusta po save-load ->
    // budynki/wojsko pokazane jako 0 mimo że przycisk już widoczny dzięki fallbackowi citizens).
    assert(
      fnWindow.includes('const ownerBuildingResUpkeep = buildingResourceUpkeepByOwner.get(ownerId)')
        && fnWindow.includes('?? previewOwnerBuildingResourceUpkeep(ownerId, cities, data.buildings, cityBuilt);'),
      'E3: ownerBuildingResUpkeep czyta buildingResourceUpkeepByOwner.get(ownerId) Z FALLBACKIEM na previewOwnerBuildingResourceUpkeep (żywy przelicz gdy mapa jeszcze pusta po save-load)',
    );
    assert(
      fnWindow.includes('const ownerUnitResUpkeep = unitResourceUpkeepByOwner.get(ownerId)')
        && fnWindow.includes('?? totalUnitResourceUpkeep('),
      'E4: ownerUnitResUpkeep czyta unitResourceUpkeepByOwner.get(ownerId) Z FALLBACKIEM na totalUnitResourceUpkeep analogicznie',
    );
    // E3b/E4b: fallback musi czytać STAN ŻYWY (cityBuilt/units), nie jakąś zamrożoną kopię --
    // inaczej "fallback" pokazywałby dalej stare/puste dane.
    assert(
      /previewOwnerBuildingResourceUpkeep\(ownerId,\s*cities,\s*data\.buildings,\s*cityBuilt\)/.test(fnWindow),
      'E3b: fallback budynków woła z argumentami (ownerId, cities, data.buildings, cityBuilt) -- cityBuilt to ta sama mapa przywracana wprost z save w restoreGameFromSave, nie kopia sprzed load',
    );
    assert(
      /units\.filter\(u => u\.ownerId === ownerId\)\.map\(u => \(\{ typeId: u\.typeId \}\)\)/.test(fnWindow),
      'E4b: fallback wojska filtruje ŻYWĄ tablicę `units` (main.ts) po ownerId -- ta sama tablica, którą restoreGameFromSave nadpisuje z save.units',
    );

    assert(
      /const usage = resourceUsageBreakdownFor\(\s*\n?\s*c\.id, citizenUpkeep\.deductions, ownerBuildingResUpkeep, ownerUnitResUpkeep,?\s*\n?\s*\);/.test(fnWindow),
      'E5: usage skonstruowane DOKŁADNIE z citizenUpkeep.deductions (ta sama zmienna co bramka POKRYTE/NIEDOBÓR wyżej w funkcji) + ownerBuildingResUpkeep + ownerUnitResUpkeep -- zero osobnego przeliczenia',
    );
    assert(
      fnWindow.includes('...(resourceUsageHasAny(usage) ? { usage } : {}),'),
      'E6: pole usage dołączone do wiersza TYLKO gdy resourceUsageHasAny (spójne z kontraktem typu -- undefined gdy brak zużycia)',
    );

    // E7: citizenUpkeep.deductions musi pochodzić z TEJ SAMEJ zmiennej citizenUpkeep, którą czyta
    // bramka POKRYTE/NIEDOBÓR (citizenAvailableSet) -- nie z osobnego, drugiego wywołania silnika.
    const citizenVarIdx = fnWindow.indexOf('const citizenUpkeep = citizenUpkeepByOwner.get(ownerId)');
    const usageCallIdx = fnWindow.indexOf('const usage = resourceUsageBreakdownFor(');
    assert(
      citizenVarIdx > -1 && usageCallIdx > citizenVarIdx,
      'E7: `const citizenUpkeep = citizenUpkeepByOwner.get(ownerId) ?? ...` (sekcja I test cytowanego pliku citizen-resource-upkeep-test.cjs) leży PRZED konstrukcją usage -- ta sama instancja, jedno wywołanie werdyktu silnika na cały wiersz',
    );

    // E8: import main.ts musi ciągnąć oba nowe prymitywy z economy-upkeep.ts (bez tego fallback
    // wyżej nie skompilowałby się -- ale sprawdzamy jawnie, żeby mutacja usuwająca import
    // zostawiła CZYTELNY FAIL tutaj, nie tylko awarię tsc gdzieś indziej).
    assert(
      mainSrcStripped.includes('previewOwnerBuildingResourceUpkeep') && mainSrcStripped.includes('totalUnitResourceUpkeep'),
      'E8: main.ts importuje previewOwnerBuildingResourceUpkeep i totalUnitResourceUpkeep z economy-upkeep.ts',
    );
  }

  // ===========================================================================
  // F. Wszystkie 5 miejsc czyszczenia citizenUpkeepByOwner czyszczą też obie nowe mapy
  // ===========================================================================
  console.log('\n-- F. citizenUpkeepByOwner.clear() zawsze w parze z buildingResourceUpkeepByOwner.clear() + unitResourceUpkeepByOwner.clear() --');
  {
    const CLEAR_TRIO = 'citizenUpkeepByOwner.clear();\n      buildingResourceUpkeepByOwner.clear();\n      unitResourceUpkeepByOwner.clear();';
    let count = 0, idx = 0;
    while (true) {
      const found = mainSrcRaw.indexOf(CLEAR_TRIO, idx);
      if (found === -1) break;
      count++;
      idx = found + CLEAR_TRIO.length;
    }
    eq(count, 5, 'main.ts: dokładnie 5 miejsc czyszczą wszystkie trzy mapy w tej samej trójce linii (nowa gra / wczytanie / porażka) -- panel po restarcie nie pokazuje zużycia z poprzedniej partii');

    // Kontrola: liczba samodzielnych citizenUpkeepByOwner.clear() jest RÓWNA 5 (żadna nie "uciekła" bez pary).
    const lonelyClears = (mainSrcRaw.match(/citizenUpkeepByOwner\.clear\(\);/g) || []).length;
    eq(lonelyClears, 5, 'main.ts: dokładnie 5 wystąpień citizenUpkeepByOwner.clear() w całym pliku -- zgadza się z liczbą trójek powyżej (brak osieroconego czyszczenia)');
  }

  // ===========================================================================
  // G. empireDetailTypes.ts: EmpireResourceRow.usage : ResourceUsageBreakdown
  // ===========================================================================
  console.log('\n-- G. EmpireResourceRow.usage typowane jako ResourceUsageBreakdown --');
  {
    assert(
      empireTypesSrcRaw.includes("import type { ResourceUsageBreakdown } from '../game/resource-usage-breakdown';"),
      'G1: empireDetailTypes.ts importuje typ ResourceUsageBreakdown',
    );
    assert(
      empireTypesSrcRaw.includes('usage?: ResourceUsageBreakdown;'),
      'G2: EmpireResourceRow.usage jest opcjonalne (undefined = brak zużycia -> UI nie rysuje przycisku)',
    );
  }

  // ===========================================================================
  // H. empireDetailPanel.ts: resUsageDetailsHtml wpięte w resCardHtml, gated przez r.usage,
  //    i EKSPORTOWANE (dla realnego wywołania w sekcjach I-K)
  // ===========================================================================
  console.log('\n-- H. empireDetailPanel.ts: przycisk „Zobacz szczegóły" wpięty w kartę surowca --');
  {
    assert(
      empirePanelSrcRaw.includes('export function resUsageDetailsHtml(r: EmpireResourceRow): string {'),
      'H1: funkcja resUsageDetailsHtml zdefiniowana i EKSPORTOWANA (żeby test mógł ją NAPRAWDĘ wywołać, nie tylko dopasować tekst)',
    );
    assert(
      typeof M.resUsageDetailsHtml === 'function',
      'H1b: M.resUsageDetailsHtml jest realnie wywoływalną funkcją po zbundlowaniu (dowód wykonywalny, nie tekstowy)',
    );
    const fnIdx = empirePanelSrcRaw.indexOf('export function resUsageDetailsHtml(r: EmpireResourceRow): string {');
    const fnEnd = fnIdx > -1 ? empirePanelSrcRaw.indexOf('\n}\n', fnIdx) : -1;
    const fnBody = (fnIdx > -1 && fnEnd > fnIdx) ? empirePanelSrcRaw.slice(fnIdx, fnEnd) : '';
    assert(fnBody.includes('if (!r.usage) return \'\';'), 'H2: brak r.usage -> zwraca pusty string (karta bez przycisku)');
    assert(fnBody.includes('resourceUsageTotal(u)'), 'H3: liczy total przez resourceUsageTotal (pure helper), nie ręczną sumą u.buildings+u.citizens+u.units w kilku miejscach');
    assert(fnBody.includes('<details class="civ-emp-res-usage">'), 'H4: renderuje natywny <details> (ten sam wzorzec co GRUPY-BUDYNKOW w cityPanel.ts, zero nowego JS)');
    assert(fnBody.includes('Zobacz szczegóły'), 'H5: tekst przycisku zawiera "Zobacz szczegóły" (wymóg zgłoszenia)');

    assert(
      empirePanelSrcRaw.includes('resCitizenBadgeHtml(r)\n    + resUsageDetailsHtml(r)\n    + `</div>`;'),
      'H6: resUsageDetailsHtml(r) wywołane wewnątrz resCardHtml, PO badge Obywateli, PRZED zamknięciem karty',
    );

    assert(
      empirePanelSrcRaw.includes("import { resourceUsageTotal } from '../game/resource-usage-breakdown';"),
      'H7: empireDetailPanel.ts importuje resourceUsageTotal (pure) zamiast liczyć sumę inline w kilku miejscach',
    );
  }

  // ===========================================================================
  // I. previewOwnerBuildingResourceUpkeep / totalUnitResourceUpkeep -- REALNE wywołanie z
  //    kontrolowanymi cities/buildingCatalog/builtByCity/units (zadanie 2, fallback live)
  // ===========================================================================
  console.log('\n-- I. previewOwnerBuildingResourceUpkeep / totalUnitResourceUpkeep (fallback live) -- wartości liczbowe --');
  {
    // Symulacja "stan po save-load": 2 miasta gracza (owner 0), 1 miasto AI (owner 1).
    const cities = [
      { id: 'c1', ownerId: 0 },
      { id: 'c2', ownerId: 0 },
      { id: 'c3', ownerId: 1 },
    ];
    const buildingCatalog = [
      { id: 'kuznia', koszt_surowce: { zelazo: 5, drewno: 2 } },
      { id: 'tartak', koszt_surowce: { drewno: 3 } },
      { id: 'brama',  koszt_surowce: {} }, // brak kosztu -> brak wpisu w upkeep
    ];
    const builtByCity = new Map([
      ['c1', ['kuznia', 'tartak']],
      ['c2', ['kuznia']],
      ['c3', ['tartak']],
    ]);

    const owner0Buildings = M.previewOwnerBuildingResourceUpkeep(0, cities, buildingCatalog, builtByCity);
    // c1: kuznia{zelazo:1,drewno:1} + tartak{drewno:1} = {zelazo:1,drewno:2}; c2: kuznia{zelazo:1,drewno:1}.
    // owner 0 total = {zelazo:2, drewno:3}.
    eq(owner0Buildings.zelazo, 2, 'I1: owner 0 (c1+c2, każde ma kuznia) -> zelazo = 1+1 = 2');
    eq(owner0Buildings.drewno, 3, 'I2: owner 0 -> drewno = (kuznia 1 + tartak 1 w c1) + (kuznia 1 w c2) = 3');

    const owner1Buildings = M.previewOwnerBuildingResourceUpkeep(1, cities, buildingCatalog, builtByCity);
    eq(owner1Buildings.drewno, 1, 'I3: owner 1 (c3, tylko tartak) -> drewno = 1');
    assert(!('zelazo' in owner1Buildings), 'I4: owner 1 nie ma kuzni -> brak klucza zelazo');

    const units = [
      { ownerId: 0, typeId: 'Hastati' },
      { ownerId: 0, typeId: 'Triarii' },
      { ownerId: 1, typeId: 'Hastati' },
    ];
    const resolveUnitDef = (typeId) => ({
      Hastati: { 'Utrzymanie surowiec': 'Żelazo', 'Utrzymanie surowiec (ilość)': 2 },
      Triarii: { 'Utrzymanie surowiec': 'Drewno', 'Utrzymanie surowiec (ilość)': 4 },
    })[typeId];

    const owner0Units = M.totalUnitResourceUpkeep(
      units.filter((u) => u.ownerId === 0).map((u) => ({ typeId: u.typeId })),
      resolveUnitDef,
    );
    eq(owner0Units.zelazo, 2, 'I5: owner 0 wojsko -> zelazo (Hastati) = 2');
    eq(owner0Units.drewno, 4, 'I6: owner 0 wojsko -> drewno (Triarii) = 4');

    const owner1Units = M.totalUnitResourceUpkeep(
      units.filter((u) => u.ownerId === 1).map((u) => ({ typeId: u.typeId })),
      resolveUnitDef,
    );
    eq(owner1Units.zelazo, 2, 'I7: owner 1 wojsko -> zelazo (Hastati) = 2');
    assert(!('drewno' in owner1Units), 'I8: owner 1 nie ma Triarii -> brak klucza drewno');
  }

  // ===========================================================================
  // J. Łańcuch end-to-end "stan po save-load": preview (I) -> resourceUsageBreakdownFor ->
  //    resUsageDetailsHtml WOŁANE NAPRAWDĘ -- dowód, że panel po wczytaniu nie jest pusty
  //    (zadanie 2, kontrast z bugiem: przed naprawą ownerBuildingResUpkeep/ownerUnitResUpkeep
  //    byłyby `undefined` tutaj -> 0 wszędzie -> przycisk myląco pusty mimo obywateli > 0)
  // ===========================================================================
  console.log('\n-- J. End-to-end post-save-load: preview -> resourceUsageBreakdownFor -> resUsageDetailsHtml (real HTML numeric) --');
  {
    const cities = [{ id: 'c1', ownerId: 0 }];
    const buildingCatalog = [{ id: 'kuznia', koszt_surowce: { zelazo: 5 } }];
    const builtByCity = new Map([['c1', ['kuznia']]]);
    const units = [{ ownerId: 0, typeId: 'Triarii' }];
    const resolveUnitDef = () => ({ 'Utrzymanie surowiec': 'Żelazo', 'Utrzymanie surowiec (ilość)': 3 });

    // Dokładnie to co robi teraz main.ts gdy buildingResourceUpkeepByOwner/unitResourceUpkeepByOwner
    // NIE MAJĄ jeszcze wpisu dla tego ownera (świeżo po restoreGameFromSave, przed 1. tickiem).
    const ownerBuildingResUpkeep = M.previewOwnerBuildingResourceUpkeep(0, cities, buildingCatalog, builtByCity);
    const ownerUnitResUpkeep = M.totalUnitResourceUpkeep(
      units.map((u) => ({ typeId: u.typeId })),
      resolveUnitDef,
    );
    const citizenDeductions = { zelazo: 4 }; // np. z fallbackowego computeCitizenResourceDrain (już testowane osobno, sekcja K).

    const usage = M.resourceUsageBreakdownFor('zelazo', citizenDeductions, ownerBuildingResUpkeep, ownerUnitResUpkeep);
    eq(usage.buildings, 1, 'J1: zelazo.buildings = 1 (kuznia w c1, ZAWSZE 1/typ obecny, niezależnie od kwoty 5 w koszt_surowce)');
    eq(usage.citizens, 4, 'J2: zelazo.citizens = 4 (drenaż obywateli)');
    eq(usage.units, 3, 'J3: zelazo.units = 3 (Triarii utrzymanie żelaza)');
    eq(M.resourceUsageTotal(usage), 8, 'J4: total = 1+4+3 = 8');

    const row = {
      id: 'zelazo', label: 'Żelazo', icon: '⚙️', stock: 20, ratePerTurn: 2, typ: 'przetworzony',
      dostep: true, rateProductionPerTurn: 2, usage,
    };
    const html = M.resUsageDetailsHtml(row);
    assert(html.length > 0, 'J5: HTML NIEPUSTY -- panel po save-load NIE jest myląco pusty (rdzeń naprawy zadania 2)');
    const parsed = parseUsageRows(html);
    eq(parsed['Budynki (zapotrzebowanie)'], 1, 'J6: wiersz Budynki w wyrenderowanym HTML = 1 (parsowane z realnego wywołania, nie z tekstu źródła)');
    eq(parsed['Obywatele (drenaż realny)'], 4, 'J7: wiersz Obywatele w wyrenderowanym HTML = 4');
    eq(parsed['Wojsko (zapotrzebowanie)'], 3, 'J8: wiersz Wojsko w wyrenderowanym HTML = 3');
    eq(parsed['Suma rozbicia tej tury'], 8, 'J9: wiersz sumy w wyrenderowanym HTML = 8 (1+4+3), zgodny z resourceUsageTotal(usage) w J4');
  }

  // ===========================================================================
  // K. Zadanie 1 (suma kłamie przy niedoborze): computeCitizenResourceDrain REALNIE klamruje
  //    (jak dokumentuje kontrakt), budynki/wojsko celowo NIE -- resUsageDetailsHtml WOŁANE
  //    NAPRAWDĘ z tym kontrastem, asercje liczbowe + regresja etykiet.
  // ===========================================================================
  console.log('\n-- K. Niedobór magazynu: citizens klamrowane (realne), buildings/units NIE (zapotrzebowanie) -- real HTML --');
  {
    // Populacja 100, stawka 0.2/obywatela -> required = floor(100*0.2) = 20. Magazyn ma tylko 6.
    const era = 1;
    const population = 100;
    // citizenRequiredResourcesForEra nie jest eksportowane tutaj -- używamy realnego surowca z
    // tabeli epoki 1 przez próbę kilku popularnych kluczy i sprawdzenie która daje required>0.
    const candidateKeys = ['drewno', 'kamien', 'glina'];
    let drain = null, usedKey = null;
    for (const k of candidateKeys) {
      const d = M.computeCitizenResourceDrain(era, population, { [k]: 6 });
      if (d.required.includes(k)) { drain = d; usedKey = k; break; }
    }
    assert(drain !== null, 'K0: przynajmniej jeden z kandydackich surowców (drewno/kamien/glina) jest wymagany w epoce 1 -- kontrakt tabeli citizen-resource-upkeep.json');
    if (drain) {
      const required = Math.floor(population * 0.2); // CITIZEN_UPKEEP_RATE_PER_CITIZEN, przypięte też w citizen-resource-upkeep-test.cjs
      eq(required, 20, 'K1: required = floor(100*0.2) = 20 (kontrakt stawki, patrz citizen-resource-upkeep.ts)');
      const drained = drain.deductions[usedKey] ?? 0;
      eq(drained, 6, `K2: deductions.${usedKey} KLAMROWANE do zapasu (6), NIE do required (20) -- kontrakt min(required, stock)`);
      assert(drained < required, 'K3: drained < required -- to jest właśnie realny niedobór, scenariusz zadania 1');

      // Budynki/wojsko: ZASTOSOWANE zapotrzebowanie WIĘKSZE niż to, co magazyn realnie ma (6) --
      // symuluje dokładnie sytuację "suma kłamie": gdyby buildings/units były też przycięte do
      // zapasu jak obywatele, suma byłaby <= 6+6=12; TU celowo NIE są (kontrakt tego modułu, patrz
      // JSDoc resource-usage-breakdown.ts) -- test dowodzi, że to jest udokumentowane zachowanie,
      // nie przypadkowa luka.
      const buildingsDemand = { [usedKey]: 15 }; // > co realnie mogłoby zejść z 6-jednostkowego zapasu
      const unitsDemand = { [usedKey]: 9 };
      const usage = M.resourceUsageBreakdownFor(usedKey, drain.deductions, buildingsDemand, unitsDemand);
      eq(usage.citizens, 6, 'K4: usage.citizens = 6 (realny drenaż, klamrowany)');
      eq(usage.buildings, 15, 'K5: usage.buildings = 15 (PEŁNE zapotrzebowanie, NIE klamrowane -- kontrakt udokumentowany, nie bug)');
      eq(usage.units, 9, 'K6: usage.units = 9 (PEŁNE zapotrzebowanie, NIE klamrowane)');
      eq(M.resourceUsageTotal(usage), 30, 'K7: total = 6+15+9 = 30 -- suma NIE twierdzi "to zeszło z magazynu", tylko "drenaż realny + zapotrzebowanie" (patrz etykiety K9-K12)');

      const row = {
        id: usedKey, label: usedKey, icon: '', stock: 6, ratePerTurn: 0, typ: 'surowy',
        dostep: true, rateProductionPerTurn: 0, usage,
      };
      const html = M.resUsageDetailsHtml(row);
      const parsed = parseUsageRows(html);
      eq(parsed['Budynki (zapotrzebowanie)'], 15, 'K8: HTML realnie wyrenderowany -- wiersz Budynki = 15 (dopasowanie liczby, nie samej etykiety)');
      eq(parsed['Obywatele (drenaż realny)'], 6, 'K9: HTML -- wiersz Obywatele = 6');
      eq(parsed['Wojsko (zapotrzebowanie)'], 9, 'K10: HTML -- wiersz Wojsko = 9');
      eq(parsed['Suma rozbicia tej tury'], 30, 'K11: HTML -- suma = 30 (mutacja liczenia sumy jako suma citizens+min(buildings,stock)+... zostałaby złapana tutaj)');

      // Regresja etykiet (zadanie 1, wariant B: NIE twierdzić o realnym zużyciu tam gdzie liczymy popyt).
      assert(html.includes('Budynki (zapotrzebowanie)'), 'K12: etykieta Budynki mówi "zapotrzebowanie" (NIE "utrzymanie" bez kwalifikatora, NIE "zużycie")');
      assert(html.includes('Wojsko (zapotrzebowanie)'), 'K13: etykieta Wojsko mówi "zapotrzebowanie"');
      assert(html.includes('Obywatele (drenaż realny)'), 'K14: etykieta Obywatele mówi "drenaż realny" (jedyna kategoria uprawniona do twierdzenia o realnym zużyciu)');
      assert(!/Budynki \(utrzymanie\)/.test(html), 'K15: STARA etykieta "Budynki (utrzymanie)" (sugerująca zużycie) NIE występuje -- regresja na cofnięcie naprawy zadania 1');
      assert(!/Wojsko \(utrzymanie\)/.test(html), 'K16: STARA etykieta "Wojsko (utrzymanie)" NIE występuje');
      assert(!/Zużycie razem tej tury/.test(html), 'K17: STARA etykieta sumy "Zużycie razem tej tury" (twierdząca o realnym zużyciu) NIE występuje -- zastąpiona neutralną "Suma rozbicia tej tury"');
      assert(html.includes('zapotrzebowanie'), 'K18: notatka w panelu wprost tłumaczy różnicę zapotrzebowanie vs drenaż realny (nie tylko etykiety wierszy)');
    }
  }

  console.log(`\nresource-usage-breakdown-test: ${passed} passed, ${failed} failed`);
  process.exitCode = failed > 0 ? 1 : 0;
}

main().catch((e) => {
  console.error('[resource-usage-breakdown-test] unexpected error:', e && e.stack || e);
  process.exitCode = 1;
});
