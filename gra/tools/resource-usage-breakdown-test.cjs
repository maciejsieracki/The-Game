'use strict';
/**
 * resource-usage-breakdown-test.cjs — P-SUROWCE-BRAK-SZCZEGOLOW-ZUZYCIA (Maciej 2026-08-12,
 * `dyspozycje/PYTANIA-OTWARTE.md` punkt 9): panel Surowców, przycisk „Zobacz szczegóły" z
 * rozbiciem zużycia per surowiec na budynki/obywateli/wojsko.
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
 *      z citizenUpkeep.deductions + ownerBuildingResUpkeep/ownerUnitResUpkeep — czyta werdykt
 *      silnika, nie przelicza drugi raz.
 *   F. Wszystkie 5 miejsc czyszczenia citizenUpkeepByOwner (nowa gra / wczytanie) czyszczą
 *      RÓWNIEŻ obie nowe mapy — inaczej panel po nowej grze pokazywałby zużycie z poprzedniej.
 *   G. empireDetailTypes.ts: EmpireResourceRow.usage ma typ ResourceUsageBreakdown.
 *   H. empireDetailPanel.ts: resUsageDetailsHtml wpięte w resCardHtml, gated przez r.usage.
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
  addResourceCosts,
} from '../src/game/economy-upkeep';
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    loader: { '.ts': 'ts', '.json': 'json' },
    outfile: BUNDLE_FILE,
    absWorkingDir: GRA,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[resource-usage-breakdown-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

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

let passed = 0, failed = 0;
function assert(cond, msg) { if (cond) { passed++; } else { failed++; console.error('FAIL:', msg); } }
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

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
// E. main.ts: buildEmpireResourceRows konstruuje `usage` z werdyktu silnika
// ===========================================================================
console.log('\n-- E. buildEmpireResourceRows: usage = resourceUsageBreakdownFor(citizenUpkeep.deductions, ownerBuildingResUpkeep, ownerUnitResUpkeep) --');
{
  const FN_ANCHOR = 'function buildEmpireResourceRows(ownerId: number): EmpireResourceRow[] {';
  const fnIdx = mainSrcStripped.indexOf(FN_ANCHOR);
  assert(fnIdx > -1, 'E1: kotwica "function buildEmpireResourceRows(...)" znaleziona');
  const endIdx = fnIdx > -1 ? mainSrcStripped.indexOf('return rows;', fnIdx) : -1;
  assert(endIdx > fnIdx, 'E2: kotwica "return rows;" znaleziona PO początku funkcji');
  const fnWindow = (fnIdx > -1 && endIdx > fnIdx) ? mainSrcStripped.slice(fnIdx, endIdx) : '';

  assert(
    fnWindow.includes('const ownerBuildingResUpkeep = buildingResourceUpkeepByOwner.get(ownerId);'),
    'E3: funkcja czyta buildingResourceUpkeepByOwner.get(ownerId) -- mapa publikowana przez silnik (sekcja D), nie przeliczana tutaj',
  );
  assert(
    fnWindow.includes('const ownerUnitResUpkeep = unitResourceUpkeepByOwner.get(ownerId);'),
    'E4: funkcja czyta unitResourceUpkeepByOwner.get(ownerId) analogicznie',
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
// H. empireDetailPanel.ts: resUsageDetailsHtml wpięte w resCardHtml, gated przez r.usage
// ===========================================================================
console.log('\n-- H. empireDetailPanel.ts: przycisk „Zobacz szczegóły" wpięty w kartę surowca --');
{
  assert(
    empirePanelSrcRaw.includes('function resUsageDetailsHtml(r: EmpireResourceRow): string {'),
    'H1: funkcja resUsageDetailsHtml zdefiniowana',
  );
  const fnIdx = empirePanelSrcRaw.indexOf('function resUsageDetailsHtml(r: EmpireResourceRow): string {');
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

console.log(`\nresource-usage-breakdown-test: ${passed} passed, ${failed} failed`);
process.exitCode = failed > 0 ? 1 : 0;
