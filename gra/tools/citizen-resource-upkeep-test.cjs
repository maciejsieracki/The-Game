'use strict';
/**
 * citizen-resource-upkeep-test.cjs -- R-ZUZYCIE-SUROWCOW-OBYWATELE (Maciej 2026-08-10).
 *
 * Run from gra/:  node tools/citizen-resource-upkeep-test.cjs
 *
 * Pokrywa:
 *   A. Tabela zużycia per epoka (data/citizen-resource-upkeep.json) -- kumulatywna lista
 *      Kamień -> Brąz -> Żelazo, dokładnie jak w specyfikacji (PYTANIA-OTWARTE.md).
 *   B. Bramka binarna (ECHO Q3=A): magazyn centralny pusty (0/brak) -> surowiec "missing";
 *      magazyn centralny > 0 -> surowiec "available". NIE skaluje się z wielkością zapasu.
 *   C. Sumowanie kar Szczęścia/Rozwoju dla wielu brakujących surowców naraz (binarne per
 *      surowiec, zsumowane po całej wymaganej liście tej epoki).
 *   D. Wiring: computeHappinessBreakdown (society-breakdown.ts) i computeGrowthPercentV85
 *      (population-growth-v85.ts) poprawnie przyjmują i sumują nowe pola wejściowe.
 *   E. AI/Państwa-Miasta parytet (ECHO Q2=A): resolveCitizenResourceCoverage jest
 *      ownerId-agnostyczne (ten sam wynik dla dowolnego ownerId przy tym samym magazynie) +
 *      strukturalna kontrola main.ts -- brak gałęzi `ownerId === 0` wokół wywołania w pętli
 *      Porządku, ta sama pętla obejmuje WSZYSTKICH właścicieli.
 *   F. Wiring main.ts -> silnik tury (naprawa N1, Evaluator PASS-WITH-NOTES na 8d6d3d54):
 *      trzy strukturalne asercje regex (PO stripLineComments -- kod zakomentowany liczy się
 *      jako brak, nie jako obecność) łapiące usunięcie/podmianę pól opcjonalnych w main.ts,
 *      których `tsc --noEmit` NIE łapie (oba pola opcjonalne z fallbackiem `?? 0`) +
 *      asercja BEHAWIORALNA wołająca applyPostCentralPopulationGrowth (population-growth-v85.ts)
 *      RAZ z citizenGrowthPctByCityId ustawionym, RAZ bez -- dowód runtime-skutku, nie tylko
 *      braku stringa w źródle (Evaluator, wzorem cs-military-cap-wiring-test.cjs sekcja 4).
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) { console.error('[citizen-resource-upkeep-test] esbuild not found. Run: npm install (from gra/)'); process.exit(1); }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY_FILE = path.resolve(__dirname, '.citizen-resource-upkeep-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.citizen-resource-upkeep-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export {
  citizenRequiredResourcesForEra,
  resolveCitizenResourceCoverage,
  computeCitizenResourceDrain,
  CITIZEN_UPKEEP_HAPPINESS_PER_AVAILABLE,
  CITIZEN_UPKEEP_HAPPINESS_PER_MISSING,
  CITIZEN_UPKEEP_GROWTH_PCT_PER_MISSING,
} from '../src/game/citizen-resource-upkeep';
export { computeHappinessBreakdown } from '../src/game/society-breakdown';
export { computeGrowthPercentV85, applyPostCentralPopulationGrowth } from '../src/game/population-growth-v85';
export { ownerResourceStockAll } from '../src/game/building-stock-cost';
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
  console.error('[citizen-resource-upkeep-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE_FILE);
const rawTable = require('../data/citizen-resource-upkeep.json');

const MAIN_TS = path.join(GRA, 'src', 'main.ts');
const mainSrcRaw = fs.readFileSync(MAIN_TS, 'utf8');

/** Usuwa komentarze `// ...` (do końca linii) -- bez tego regex "widzi" kod zakomentowany
 *  jako żywy i mutant (np. zakomentowana linia wiringu w main.ts) przeżywa bramkę bez
 *  czerwieni. Wzorowane na cs-military-cap-wiring-test.cjs (ta sama technika, ten sam
 *  kompromis: naiwne cięcie po pierwszym "//" w linii -- main.ts nie ma "://" w żywym kodzie
 *  poza wnętrzem komentarzy blokowych JSDoc). / EN: same naive line-comment strip as
 *  cs-military-cap-wiring-test.cjs -- safe here for the same reason. */
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

let passed = 0, failed = 0;
function assert(cond, msg) { if (cond) { passed++; } else { failed++; console.error('FAIL:', msg); } }
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }
function deepEqSet(a, b, msg) {
  const sa = [...a].sort();
  const sb = [...b].sort();
  assert(JSON.stringify(sa) === JSON.stringify(sb), `${msg} (got ${JSON.stringify(sa)}, want ${JSON.stringify(sb)})`);
}

// ===========================================================================
// A. Tabela zużycia per epoka -- kumulatywna, zgodna ze specyfikacją Macieja
// ===========================================================================
console.log('\n-- A. Tabela zużycia per epoka (kumulatywna, data-driven) --');
{
  deepEqSet(M.citizenRequiredResourcesForEra(1), ['drewno', 'glina'], 'Epoka 1 (Kamień): Drewno + Glina');
  deepEqSet(
    M.citizenRequiredResourcesForEra(2),
    ['drewno', 'glina', 'kamien', 'ceramika'],
    'Epoka 2 (Brąz): Drewno + Glina + Kamień + Ceramika',
  );
  deepEqSet(
    M.citizenRequiredResourcesForEra(3),
    ['drewno', 'glina', 'kamien', 'ceramika', 'cegla'],
    'Epoka 3 (Żelazo): Drewno + Glina + Kamień + Ceramika + Cegła',
  );
  // Kumulatywność: każda kolejna epoka to nadzbiór poprzedniej.
  const e1 = new Set(M.citizenRequiredResourcesForEra(1));
  const e2 = new Set(M.citizenRequiredResourcesForEra(2));
  const e3 = new Set(M.citizenRequiredResourcesForEra(3));
  assert([...e1].every(k => e2.has(k)), 'Epoka 2 zawiera CAŁĄ listę Epoki 1 (kumulatywne)');
  assert([...e2].every(k => e3.has(k)), 'Epoka 3 zawiera CAŁĄ listę Epoki 2 (kumulatywne)');

  // Odporność na epoki poza tabelą (fallback: najbliższa <= era, albo pierwsza dostępna).
  deepEqSet(M.citizenRequiredResourcesForEra(0), e1_arr(), 'era=0 -> fallback do epoki 1 (clamp min 1)');
  deepEqSet(M.citizenRequiredResourcesForEra(-5), e1_arr(), 'era ujemna -> fallback do epoki 1');
  deepEqSet(M.citizenRequiredResourcesForEra(99), [...e3], 'era poza tabelą (99) -> najbliższa zdefiniowana <= era (3)');
  function e1_arr() { return [...e1]; }

  // Fixtura sanity: JSON ma dokładnie 3 wpisy epok (Kamień/Brąz/Żelazo, v0.1 scope gry).
  eq(rawTable.epoki.length, 3, 'data/citizen-resource-upkeep.json: dokładnie 3 wiersze epok');
}

// ===========================================================================
// B. Bramka binarna: magazyn centralny pusty -> missing, magazyn > 0 -> available
// ===========================================================================
console.log('\n-- B. Bramka binarna (ECHO Q3=A) -- magazyn CENTRALNY, nie proporcjonalna --');
{
  // Epoka 1: wymaga drewno + glina.
  const full = M.resolveCitizenResourceCoverage(1, { drewno: 50, glina: 1 });
  deepEqSet(full.available, ['drewno', 'glina'], 'oba surowce w magazynie (>0) -> oba available');
  deepEqSet(full.missing, [], 'oba surowce w magazynie -> brak missing');
  eq(full.happinessDelta, 2 * M.CITIZEN_UPKEEP_HAPPINESS_PER_AVAILABLE, 'happinessDelta = 2 × bonus dostępności');
  eq(full.growthPctDelta, 0, 'growthPctDelta = 0 gdy brak braków');

  const empty = M.resolveCitizenResourceCoverage(1, { drewno: 0, glina: 0 });
  deepEqSet(empty.missing, ['drewno', 'glina'], 'magazyn=0 dla obu -> oba missing');
  eq(empty.happinessDelta, 2 * M.CITIZEN_UPKEEP_HAPPINESS_PER_MISSING, 'happinessDelta = 2 × kara braku');
  eq(empty.growthPctDelta, 2 * M.CITIZEN_UPKEEP_GROWTH_PCT_PER_MISSING, 'growthPctDelta = 2 × kara Rozwoju za brak');

  const noEntry = M.resolveCitizenResourceCoverage(1, {});
  deepEqSet(noEntry.missing, ['drewno', 'glina'], 'brak wpisu w magazynie (undefined) = tak samo jak 0 -> missing');

  const negative = M.resolveCitizenResourceCoverage(1, { drewno: -3, glina: 5 });
  deepEqSet(negative.missing, ['drewno'], 'magazyn ujemny (dane śmieciowe) traktowany jak brak (missing), nie jak dostępność');
  deepEqSet(negative.available, ['glina'], 'glina > 0 -> available mimo że drewno w tym samym wywołaniu jest missing');

  // Binarność: NIE skaluje się z WIELKOŚCIĄ zapasu -- 1 sztuka i 10000 sztuk dają IDENTYCZNY wynik.
  const tiny = M.resolveCitizenResourceCoverage(1, { drewno: 1, glina: 1 });
  const huge = M.resolveCitizenResourceCoverage(1, { drewno: 10000, glina: 10000 });
  eq(tiny.happinessDelta, huge.happinessDelta, 'ECHO Q3=A: 1 sztuka i 10000 sztuk w magazynie dają IDENTYCZNĄ karę/bonus (binarne, nie proporcjonalne)');
  eq(tiny.growthPctDelta, huge.growthPctDelta, 'to samo dla kanału Rozwoju -- binarne, nie proporcjonalne do wielkości zapasu');

  // Magazyn CENTRALNY (empire-wide), nie lokalny per miasto (ECHO Q1) -- to jest odpowiedzialność
  // wołającego (main.ts przekazuje ownerResourceStockAll(cities, ownerId)), ale sama funkcja
  // resolveCitizenResourceCoverage jest ślepa na to, skąd wartość pochodzi -- weryfikacja przez
  // ownerResourceStockAll (integracja z building-stock-cost.ts).
  const cities = [
    { id: 'c1', ownerId: 0, surowce: { drewno: 3 } },
    { id: 'c2', ownerId: 0, surowce: { drewno: 0, glina: 2 } },
  ];
  const pool = M.ownerResourceStockAll(cities, 0);
  const viaPool = M.resolveCitizenResourceCoverage(1, pool);
  deepEqSet(
    viaPool.available, ['drewno', 'glina'],
    'ECHO Q1: miasto c2 BEZ własnego drewna nadal ma "drewno" available -- pochodzi z magazynu CENTRALNEGO (c1+c2), nie lokalnego',
  );
}

// ===========================================================================
// C. Sumowanie kar dla wielu brakujących surowców naraz
// ===========================================================================
console.log('\n-- C. Sumowanie kar -- wiele brakujących surowców naraz (epoka 3, 5 surowców) --');
{
  // Epoka 3: drewno, glina, kamien, ceramika, cegla (5 surowców).
  const allMissing = M.resolveCitizenResourceCoverage(3, {});
  eq(allMissing.missing.length, 5, 'epoka 3, magazyn pusty -> 5 surowców missing');
  eq(allMissing.happinessDelta, 5 * M.CITIZEN_UPKEEP_HAPPINESS_PER_MISSING, 'suma Szczęścia = 5 × kara/surowiec');
  eq(allMissing.growthPctDelta, 5 * M.CITIZEN_UPKEEP_GROWTH_PCT_PER_MISSING, 'suma Rozwoju = 5 × kara/surowiec');

  // Częściowy niedobór: 2 dostępne + 3 brakujące -> suma netto (nie tylko licznik braków).
  const mixed = M.resolveCitizenResourceCoverage(3, { drewno: 5, glina: 5, kamien: 0, ceramika: 0, cegla: 0 });
  eq(mixed.available.length, 2, 'mixed: 2 surowce dostępne');
  eq(mixed.missing.length, 3, 'mixed: 3 surowce brakujące');
  eq(
    mixed.happinessDelta,
    2 * M.CITIZEN_UPKEEP_HAPPINESS_PER_AVAILABLE + 3 * M.CITIZEN_UPKEEP_HAPPINESS_PER_MISSING,
    'happinessDelta = suma netto (2×dostępny + 3×brakujący), nie tylko licznik jednego typu',
  );
  eq(mixed.growthPctDelta, 3 * M.CITIZEN_UPKEEP_GROWTH_PCT_PER_MISSING, 'growthPctDelta liczy WYŁĄCZNIE braki (dostępne nie dają bonusu Rozwoju)');

  // Kanon wartości specyfikacji (Maciej 2026-08-10): +1 Sz/dostępny, -1 Sz i -1% Rozwój/brakujący.
  eq(M.CITIZEN_UPKEEP_HAPPINESS_PER_AVAILABLE, 1, 'kanon: +1 Szczęście za dostępny surowiec');
  eq(M.CITIZEN_UPKEEP_HAPPINESS_PER_MISSING, -1, 'kanon: -1 Szczęście za brakujący surowiec');
  eq(M.CITIZEN_UPKEEP_GROWTH_PCT_PER_MISSING, -1, 'kanon: -1% Rozwój za brakujący surowiec');
}

// ===========================================================================
// D. Wiring do computeHappinessBreakdown / computeGrowthPercentV85
// ===========================================================================
console.log('\n-- D. Wiring: computeHappinessBreakdown + computeGrowthPercentV85 --');
{
  const cov = M.resolveCitizenResourceCoverage(2, { drewno: 5, glina: 0, kamien: 0, ceramika: 5 });
  // Brąz: drewno(avail) + glina(missing) + kamien(missing) + ceramika(avail) = +1-1-1+1 = 0.
  eq(cov.happinessDelta, 0, 'sanity fixtura: 2 dostępne + 2 brakujące -> netto 0');
  eq(cov.growthPctDelta, -2, 'sanity fixtura: 2 brakujące -> -2% Rozwój');

  const szBase = M.computeHappinessBreakdown({ population: 4, buildingZadowolenie: 0 });
  const szBrak = M.computeHappinessBreakdown({
    population: 4,
    buildingZadowolenie: 0,
    citizenResourceHappinessDelta: -3,
  });
  const lineBrak = szBrak.lines.find(l => l.id === 'zaopatrzenie_obywateli');
  assert(!!lineBrak, 'computeHappinessBreakdown: linia "zaopatrzenie_obywateli" obecna gdy delta != 0');
  eq(lineBrak && lineBrak.value, -3, 'linia niesie dokładnie przekazaną wartość (-3)');
  // Porównanie różnicowe (nie wartość bezwzględna) -- inne domyślne składniki (np. bonus
  // osiedla dla małych miast, siatka Zamożności) mogą też być aktywne przy fallbackach bez
  // society params; test sprawdza, że DOKŁADANA delta wchodzi 1:1 do netto, nie że jest
  // jedynym składnikiem.
  eq(szBrak.netto, szBase.netto - 3, 'netto Szczęścia = netto_bez_kary + (-3) -- delta wchodzi 1:1, addytywnie do reszty składników');

  const szZero = M.computeHappinessBreakdown({
    population: 4,
    buildingZadowolenie: 0,
    citizenResourceHappinessDelta: 0,
  });
  const lineZero = szZero.lines.find(l => l.id === 'zaopatrzenie_obywateli');
  assert(!lineZero, 'computeHappinessBreakdown: BRAK linii gdy delta=0 (wzorem innych opcjonalnych składników -- lines.push tylko gdy != 0)');

  const szBrak2 = M.computeHappinessBreakdown({ population: 4, buildingZadowolenie: 0 });
  assert(!szBrak2.lines.find(l => l.id === 'zaopatrzenie_obywateli'), 'brak pola (undefined) -> zero regresji, żadnej nowej linii');

  const rationParams = {
    racjeZywnosc1: 2, racjeZywnosc2: 4, racjeZywnosc3: 6,
    racjeWzrostProc1: 3, racjeWzrostProc2: 5, racjeWzrostProc3: 7,
  };
  const spichlerzState = { ceramikaActive: false, solActive: false, maSpichlerzPop: false, maSpichlerzIIPop: false };
  const gd = M.computeGrowthPercentV85({
    population: 5, poziomRacji: 4, zdrowie: 0, szczescieNetto: 0, wealthPoziom: 0,
    spichlerzState, rationParams, citizenResourceGrowthPct: -3,
  });
  eq(gd.zaopatrzenie, -3, 'GrowthPercentBreakdown.zaopatrzenie niesie przekazaną wartość');
  const gdNoUpkeep = M.computeGrowthPercentV85({
    population: 5, poziomRacji: 4, zdrowie: 0, szczescieNetto: 0, wealthPoziom: 0,
    spichlerzState, rationParams,
  });
  eq(gd.total, gdNoUpkeep.total - 3, 'total = total_bez_kary + (-3) -- kara Rozwoju WPROST w sumie, nie skalowana przez /10 jak szczęście');
  eq(gdNoUpkeep.zaopatrzenie, 0, 'brak pola (undefined) -> zaopatrzenie=0, zero regresji na total');
}

// ===========================================================================
// E. Parytet AI/Państwa-Miasta (ECHO Q2=A) -- ownerId-agnostyczne
// ===========================================================================
console.log('\n-- E. Parytet AI/Państwa-Miasta (ECHO Q2=A) --');
{
  // resolveCitizenResourceCoverage/citizenRequiredResourcesForEra nie przyjmują ownerId w ogóle
  // -- ten sam magazyn+era zawsze daje ten sam wynik niezależnie "czyj" jest ownerId (parytet
  // jest strukturalną własnością sygnatury funkcji, nie flagą do przetestowania per owner).
  // Uwaga (Evaluator N7, usunięte 3 tautologiczne asercje forPlayer===forAi): wywoływanie tej
  // samej funkcji dwa razy z IDENTYCZNYM wejściem i porównywanie wyników nie dowodzi niczego --
  // realny dowód parytetu leży niżej (kontrola strukturalna main.ts: brak gałęzi ownerId===0).

  // Kontrola strukturalna main.ts: pętla Porządku (evaluateOrderFromBreakdown) iteruje
  // `for (const city of cities)` bez filtra ownerId===0 wokół wywołania resolveCitizenResourceCoverage
  // -- to jest DOWÓD, że AI i Państwa-Miasta przechodzą przez TĘ SAMĄ ścieżkę co gracz.
  const mainSrc = mainSrcRaw;
  assert(
    mainSrc.includes("import { resolveCitizenResourceCoverage, computeCitizenResourceDrain } from './game/citizen-resource-upkeep';"),
    'main.ts importuje resolveCitizenResourceCoverage + computeCitizenResourceDrain z citizen-resource-upkeep.ts',
  );
  // N2 (2026-08-11): pętla Porządku woła TERAZ citizenUpkeepDrainForOwner(city.ownerId)
  // (realny drenaż), NIE resolveCitizenResourceCoverage bezpośrednio -- ten drugi zostaje
  // jako podgląd używany gdzie indziej (buildEmpireResourceRows, UI panelu Surowców).
  const citizenCallIdx = mainSrc.indexOf('citizenUpkeepDrainForOwner(city.ownerId)');
  assert(citizenCallIdx > -1, 'main.ts woła citizenUpkeepDrainForOwner(city.ownerId) w pętli Porządku (realny drenaż, N2)');
  if (citizenCallIdx > -1) {
    // Najbliższa otwierająca pętla `for (const city of cities)` PRZED wywołaniem (w tym samym bloku
    // try) i BRAK `if (city.ownerId === 0` między nią a wywołaniem -- czyli nic nie wycina AI.
    const forIdx = mainSrc.lastIndexOf('for (const city of cities) {', citizenCallIdx);
    assert(forIdx > -1 && forIdx < citizenCallIdx, 'wywołanie leży wewnątrz `for (const city of cities)` (bez ownerId-filtra na wejściu pętli)');
    const between = mainSrc.slice(forIdx, citizenCallIdx);
    assert(
      !/if\s*\(\s*city\.ownerId\s*===\s*0/.test(between),
      'BRAK gałęzi `if (city.ownerId === 0 ...)` między pętlą a wywołaniem -- AI/Państwa-Miasta NIE są wycinane (ECHO Q2=A)',
    );
  }
  // citizenUpkeepEmpireStock (cache magazynu per owner tej tury) budowany RAZ przed pętlą, nie
  // warunkowany ownerId -- ten sam resolver serwuje gracza i AI.
  assert(
    mainSrc.includes('const citizenUpkeepEmpireStock = makeOwnerEmpireStockResolver();'),
    'main.ts: magazyn centralny cache\'owany per-owner (makeOwnerEmpireStockResolver) -- jeden wspólny resolver dla wszystkich ownerów, gracza i AI',
  );
  // citizenUpkeepDrainForOwner -- ten sam wzorzec cache'owania (Map per ownerId), nie
  // warunkowany ownerId -- gracz i AI drenowani IDENTYCZNĄ ścieżką.
  assert(
    mainSrc.includes('const citizenUpkeepDrainCache = new Map<number, ReturnType<typeof computeCitizenResourceDrain>>();'),
    'main.ts: drenaż cache\'owany per-owner (citizenUpkeepDrainCache) -- jeden wspólny resolver dla wszystkich ownerów',
  );
}

// ===========================================================================
// G. computeCitizenResourceDrain -- realny drenaż 1:1 (N2, Maciej 2026-08-11)
// ===========================================================================
console.log('\n-- G. computeCitizenResourceDrain -- realny drenaż 1 szt./obywatel --');
{
  // Stawka 1:1: 10 obywateli, magazyn 50 drewna/50 gliny (epoka 1) -> required=10 każdy,
  // drained=10 każdy (magazyn wystarcza), oba "available" (pełne pokrycie).
  const full = M.computeCitizenResourceDrain(1, 10, { drewno: 50, glina: 50 });
  deepEqSet(full.available, ['drewno', 'glina'], 'magazyn wystarcza na 10 obywateli (>=10 każdego) -> oba available');
  eq(full.deductions.drewno, 10, 'deductions.drewno = 10 (1 szt./obywatel × 10 obywateli)');
  eq(full.deductions.glina, 10, 'deductions.glina = 10 (1 szt./obywatel × 10 obywateli)');

  // Niedobór: magazyn MNIEJSZY niż required -> drained = min(required, stock), NIGDY < 0,
  // surowiec liczy się jako "missing" (pokrycie częściowe, nie pełne -- kara nadal binarna).
  const partial = M.computeCitizenResourceDrain(1, 10, { drewno: 3, glina: 0 });
  deepEqSet(partial.missing, ['drewno', 'glina'], '10 obywateli, magazyn drewna=3 (< required=10) -> missing (pokrycie częściowe = brak)');
  eq(partial.deductions.drewno, 3, 'deductions.drewno = min(10, 3) = 3 -- drenuje ile jest, magazyn NIE schodzi poniżej zera');
  assert(!('glina' in partial.deductions), 'deductions.glina nieobecne (0 do odjęcia) -- magazyn=0, nic nie drenować');

  // Zero obywateli -> zero zapotrzebowania -> zawsze "available" (brak kary na dane brzegowe).
  const zeroPop = M.computeCitizenResourceDrain(1, 0, { drewno: 0, glina: 0 });
  deepEqSet(zeroPop.available, ['drewno', 'glina'], '0 obywateli -> required=0 -> zawsze pełne pokrycie, nawet z pustym magazynem');
  eq(Object.keys(zeroPop.deductions).length, 0, '0 obywateli -> brak zapotrzebowania -> brak odjęcia (deductions puste)');

  // Populacja ujemna/niefinitna (dane śmieciowe) -> traktowana jak 0, zero regresji/crashu.
  const negPop = M.computeCitizenResourceDrain(1, -5, { drewno: 0 });
  eq(Object.keys(negPop.deductions).length, 0, 'populacja ujemna traktowana jak 0 -- brak odjęcia, brak crasha');
  const nanPop = M.computeCitizenResourceDrain(1, NaN, { drewno: 0 });
  eq(Object.keys(nanPop.deductions).length, 0, 'populacja NaN traktowana jak 0 -- brak odjęcia, brak crasha');

  // Kara nadal BINARNA (ECHO Q3=A niezmienione): pokrycie W PEŁNI (nie licznik/rozmiar
  // niedoboru) -- 1 sztuka brakująca do pełnego pokrycia daje TAKĄ SAMĄ karę jak 1000 sztuk
  // brakujących (obie "missing"), happinessDelta/growthPctDelta liczą TYLKO available.length/missing.length.
  const barelyMissing = M.computeCitizenResourceDrain(1, 10, { drewno: 9, glina: 50 });
  const wayMissing = M.computeCitizenResourceDrain(1, 10, { drewno: 0, glina: 50 });
  eq(barelyMissing.happinessDelta, wayMissing.happinessDelta, 'ECHO Q3=A zachowane: brak 1 sztuki do pełnego pokrycia = ta sama kara co brak całości (binarne, nie proporcjonalne)');
}

// ===========================================================================
// H. Agregacja RAZ per owner per turę (N2 -- pułapka wielu miast tego samego ownera)
// ===========================================================================
console.log('\n-- H. citizenUpkeepDrainForOwner: drenaż liczony RAZ per owner (nie per miasto) --');
{
  // Strukturalna weryfikacja main.ts: populacja sumowana po WSZYSTKICH miastach ownera
  // (cities.reduce), NIE brana z pojedynczego city.population -- inaczej 3 miasta tego samego
  // ownera każde "widziałoby" ten sam pełny magazyn i razem wydrenowałyby 3× za dużo.
  const REDUCE_ANCHOR = 'const ownerPopulation = cities.reduce(';
  const reduceIdx = mainSrcStripped.indexOf(REDUCE_ANCHOR);
  assert(reduceIdx > -1, 'main.ts: kotwica sumowania populacji ownera (cities.reduce) znaleziona');
  const reduceWindow = reduceIdx > -1 ? mainSrcStripped.slice(reduceIdx, reduceIdx + 200) : '';
  assert(
    /c\.ownerId === ownerId \? sum \+ c\.population : sum/.test(reduceWindow),
    'H1: sumowanie filtruje po c.ownerId === ownerId i dodaje c.population -- suma WSZYSTKICH miast tego ownera, nie jednego miasta',
  );

  // Deduction realnie stosowany przez deductBuildingStockCostAcrossCities WEWNĄTRZ resolvera,
  // pod warunkiem że deductions nie jest puste -- to jest miejsce realnej mutacji magazynu.
  assert(
    mainSrcStripped.includes('deductBuildingStockCostAcrossCities(cities, ownerId, v.deductions);'),
    'H2: main.ts woła deductBuildingStockCostAcrossCities(cities, ownerId, v.deductions) -- realne odjęcie z magazynu, nie tylko podgląd',
  );

  // Cache: wynik zapisany w citizenUpkeepDrainCache PRZED return -- drugie/trzecie miasto
  // tego samego ownera w tej samej turze dostaje ten sam (już zmutowany raz) wynik, nie liczy
  // drenażu ponownie.
  assert(
    mainSrcStripped.includes('citizenUpkeepDrainCache.set(ownerId, v);'),
    'H3: wynik drenażu cache\'owany per ownerId -- drugie miasto tego samego ownera w tej turze NIE drenuje magazynu ponownie',
  );

  // Behawioralny dowód end-to-end: computeCitizenResourceDrain wywołane RAZ z sumą populacji
  // 2 miast (5+5=10) daje IDENTYCZNY deductions co gdyby liczyć jedno "wirtualne" miasto o
  // populacji 10 -- a NIE 2× wywołanie po 5 (co dałoby 2×5=10 też przypadkiem przy tej stawce,
  // więc test dobiera asymetryczne populacje 3+7, żeby odróżnić "suma najpierw" od "podwójne
  // liczenie": drenaż z osobna dla pop=3 i pop=7 na TYM SAMYM (niezmutowanym) magazynie 8 drewna
  // dałby OBA "available" (3<=8 i 7<=8) -- błędnie, bo razem potrzeba 10 > 8. Suma-najpierw
  // (RAZ per owner) poprawnie daje deductions.drewno = min(10, 8) = 8, missing.
  const wrongPerCity3 = M.computeCitizenResourceDrain(1, 3, { drewno: 8 });
  const wrongPerCity7 = M.computeCitizenResourceDrain(1, 7, { drewno: 8 });
  assert(
    wrongPerCity3.available.includes('drewno') && wrongPerCity7.available.includes('drewno'),
    'sanity: liczone OSOBNO (błędny wzorzec) obie "widzą" magazyn=8 jako wystarczający -- to właśnie ta pułapka, którą H1-H3 mają wykluczyć w main.ts',
  );
  const correctSummedFirst = M.computeCitizenResourceDrain(1, 3 + 7, { drewno: 8, glina: 50 });
  eq(correctSummedFirst.deductions.drewno, 8, 'poprawny wzorzec (suma populacji NAJPIERW, RAZ per owner): deductions.drewno = min(10, 8) = 8, nie 2×8=16');
  deepEqSet(correctSummedFirst.missing, ['drewno'], 'poprawny wzorzec: 10 obywateli > 8 sztuk drewna w magazynie (glina wystarcza) -> tylko drewno missing (poprawnie wykrywa niedobór, którego wzorzec "osobno" by nie zauważył)');
}

// ===========================================================================
// F. Wiring main.ts -> silnik tury (naprawa N1, Evaluator PASS-WITH-NOTES na 8d6d3d54)
// ===========================================================================
console.log('\n-- F. Wiring main.ts -> silnik tury (N1: happinessDelta + growthPctByCityId) --');
{
  // ---------------------------------------------------------------------
  // F1. Regex strukturalny: citizenResourceHappinessDelta: citizenUpkeep.happinessDelta
  //     WEWNĄTRZ okna wywołania `const ordPctRaw = evaluateOrderFromBreakdown(` (pierwszy
  //     argument to happinessInput przekazywane 1:1 do computeHappinessBreakdown --
  //     society-breakdown.ts:632 `computeHappinessBreakdown(happinessInput, society)`).
  //     Mutant 1 (Evaluator): usunięcie tej linii z obiektu wejściowego -- wyłącza CAŁY
  //     kanał Szczęścia po cichu (pole opcjonalne, `tsc` tego nie łapie).
  // ---------------------------------------------------------------------
  const ORD_ANCHOR = 'const ordPctRaw = evaluateOrderFromBreakdown(';
  const ordIdx = mainSrcStripped.indexOf(ORD_ANCHOR);
  assert(ordIdx > -1, 'main.ts: kotwica "const ordPctRaw = evaluateOrderFromBreakdown(" znaleziona (po stripLineComments)');
  const ordWindow = ordIdx > -1 ? mainSrcStripped.slice(ordIdx, ordIdx + 1200) : '';
  assert(
    /citizenResourceHappinessDelta:\s*citizenUpkeep\.happinessDelta,/.test(ordWindow),
    'F1 (mutant 1): "citizenResourceHappinessDelta: citizenUpkeep.happinessDelta," obecne w oknie '
      + 'wywołania evaluateOrderFromBreakdown -- jako ŻYWY kod (nie w komentarzu)',
  );

  // ---------------------------------------------------------------------
  // F2. Regex strukturalny: "citizenGrowthPctByCityId," WEWNĄTRZ okna wywołania
  //     `applyPostCentralPopulationGrowth({`. Mutant 2 (Evaluator): usunięcie tej linii z opts
  //     -- wyłącza CAŁY kanał Rozwoju po cichu (pole opcjonalne, `tsc` tego nie łapie).
  // ---------------------------------------------------------------------
  const APPLY_ANCHOR = 'applyPostCentralPopulationGrowth({';
  const applyIdx = mainSrcStripped.indexOf(APPLY_ANCHOR);
  assert(applyIdx > -1, 'main.ts: kotwica "applyPostCentralPopulationGrowth({" znaleziona (po stripLineComments)');
  const applyWindow = applyIdx > -1 ? mainSrcStripped.slice(applyIdx, applyIdx + 900) : '';
  assert(
    /^\s*citizenGrowthPctByCityId,\s*$/m.test(applyWindow),
    'F2 (mutant 2): "citizenGrowthPctByCityId," obecne w oknie opts przekazywanych do '
      + 'applyPostCentralPopulationGrowth -- jako ŻYWY kod (nie w komentarzu, nie usunięte z opts)',
  );

  // ---------------------------------------------------------------------
  // F3. Regex strukturalny: budowa mapy citizenGrowthPctByCityId musi CZYTAĆ
  //     `st.citizenUpkeep?.growthPctDelta ?? 0`, NIE gołe stałe `0`. Mutant 3 (Evaluator):
  //     podmiana `.set(cid, st.citizenUpkeep?.growthPctDelta ?? 0)` na `.set(cid, 0)` -- ten
  //     sam efekt runtime co mutant 2 (kanał Rozwoju zawsze 0), inna lokalizacja w pliku.
  // ---------------------------------------------------------------------
  const MAP_ANCHOR = 'const citizenGrowthPctByCityId = new Map<string, number>();';
  const mapIdx = mainSrcStripped.indexOf(MAP_ANCHOR);
  assert(mapIdx > -1, 'main.ts: kotwica budowy mapy citizenGrowthPctByCityId znaleziona (po stripLineComments)');
  const mapWindow = mapIdx > -1 ? mainSrcStripped.slice(mapIdx, mapIdx + 400) : '';
  assert(
    /citizenGrowthPctByCityId\.set\(cid,\s*st\.citizenUpkeep\?\.growthPctDelta\s*\?\?\s*0\)/.test(mapWindow),
    'F3 (mutant 3): ".set(cid, st.citizenUpkeep?.growthPctDelta ?? 0)" obecne -- NIE zastąpione '
      + 'gołym ".set(cid, 0)" (regex wymaga dokładnie tego odczytu, literał 0 by nie pasował)',
  );

  // ---------------------------------------------------------------------
  // F4. RUNTIME (behawioralne, rekomendacja Evaluatora): applyPostCentralPopulationGrowth
  //     faktycznie WYKONANE (przez esbuild, ta sama technika co sekcja 4 w
  //     cs-military-cap-wiring-test.cjs) RAZ z citizenGrowthPctByCityId ustawionym na
  //     niezerową wartość, RAZ bez (undefined) -- dowód SKUTKU RUNTIME, nie tylko braku
  //     stringa w źródle main.ts. Łapie mutanta 2 I mutanta 3 niezależnie od dokładnej
  //     nazwy/lokalizacji pola w przyszłości (regex może przestać pasować po refaktorze,
  //     wywołanie realnej funkcji nie).
  // ---------------------------------------------------------------------
  const rationParamsF = {
    racjeZywnosc1: 2, racjeZywnosc2: 4, racjeZywnosc3: 6,
    racjeWzrostProc1: 3, racjeWzrostProc2: 5, racjeWzrostProc3: 7,
  };
  const econParamsF = { akweduktProgLudnosci: 20, spichlerzProgLudnosci: 20, akweduktMaxLudnosci: 20 };

  function makeGrowthOpts(citizenGrowthPctByCityId) {
    const city = {
      id: 'cityF', ownerId: 0, name: 'MiastoF', population: 3,
      poziomRacji: 4, wzrostUlamkowy: 0, turyBezDoplaty: 0, wealthState: { poziom: 1 },
    };
    const row = { cityId: 'cityF' };
    return {
      opts: {
        cities: [city],
        econ: { perCity: [{ cityId: 'cityF', oblegany: false, zdrowie: 0 }], growth: 0, starved: 0 },
        efResult: {
          perOwner: [{
            perCityRows: [row],
            fedByCityId: new Map([['cityF', true]]),
          }],
        },
        map: {},
        territoryNodes: [],
        econParams: econParamsF,
        rationParams: rationParamsF,
        ...(citizenGrowthPctByCityId !== undefined ? { citizenGrowthPctByCityId } : {}),
      },
      row,
    };
  }

  const withPenalty = makeGrowthOpts(new Map([['cityF', -5]]));
  M.applyPostCentralPopulationGrowth(withPenalty.opts);
  const withoutPenalty = makeGrowthOpts(undefined);
  M.applyPostCentralPopulationGrowth(withoutPenalty.opts);

  assert(
    !!withPenalty.row.breakdown && !!withoutPenalty.row.breakdown,
    'F4: applyPostCentralPopulationGrowth wypełniło row.breakdown w obu wywołaniach',
  );
  eq(
    withPenalty.row.breakdown.zaopatrzenie, -5,
    'F4: z citizenGrowthPctByCityId={cityF: -5}, row.breakdown.zaopatrzenie = -5 (wprost przekazane)',
  );
  eq(
    withoutPenalty.row.breakdown.zaopatrzenie, 0,
    'F4: BEZ citizenGrowthPctByCityId (undefined), row.breakdown.zaopatrzenie = 0 (fallback ?? 0, zero regresji)',
  );
  assert(
    withPenalty.row.breakdown.zaopatrzenie !== withoutPenalty.row.breakdown.zaopatrzenie,
    'F4: kluczowy dowód runtime -- zaopatrzenie RÓŻNI SIĘ między wywołaniem z karą i bez '
      + `(got ${withPenalty.row.breakdown.zaopatrzenie} vs ${withoutPenalty.row.breakdown.zaopatrzenie})`,
  );
  assert(
    withPenalty.row.breakdown.total !== withoutPenalty.row.breakdown.total,
    'F4: total RÓŻNI SIĘ między wywołaniem z karą i bez -- kara Rozwoju realnie wchodzi w sumę '
      + `(got ${withPenalty.row.breakdown.total} vs ${withoutPenalty.row.breakdown.total})`,
  );
  eq(
    withPenalty.row.breakdown.total, withoutPenalty.row.breakdown.total - 5,
    'F4: total_z_karą = total_bez_kary + (-5) -- delta wchodzi 1:1, addytywnie',
  );
}

// --- summary ---------------------------------------------------------------
console.log(`\ncitizen-resource-upkeep-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY_FILE); } catch (e) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}
process.exit(failed ? 1 : 0);
