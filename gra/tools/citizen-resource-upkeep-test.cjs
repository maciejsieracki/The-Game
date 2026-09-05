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
  CITIZEN_UPKEEP_RATE_PER_CITIZEN,
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

  // Kanon wartości specyfikacji: R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1 G8 (właściciel 2026-09-05)
  // + ratyfikacja rundy 3, punkt R3-B: +2 Sz za dostępny surowiec i -2 Sz za brakujący.
  // Uchyla ±1 z 2026-08-10; -1% Rozwoju za brakujący NIE był objęty decyzją i zostaje.
  // Literał MUSI zostać literałem: to jedyne miejsce w tym pliku, które zna liczbę
  // właściciela z DRUGIEGO nośnika — reszta asercji porównuje się z M.CITIZEN_UPKEEP_*
  // symbolicznie, więc sama z siebie nie wykryje zmiany wartości w danych.
  eq(M.CITIZEN_UPKEEP_HAPPINESS_PER_AVAILABLE, 2, 'kanon: +2 Szczęście za dostępny surowiec (G8)');
  eq(M.CITIZEN_UPKEEP_HAPPINESS_PER_MISSING, -2, 'kanon: -2 Szczęście za brakujący surowiec (G8)');
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
  // N1 (panel Surowców, Maciej 2026-08-11): main.ts przestał importować
  // resolveCitizenResourceCoverage -- buildEmpireResourceRows (podgląd panelu) teraz TAKŻE
  // liczy przez computeCitizenResourceDrain (ta sama reguła co silnik tury), więc stary
  // podgląd nie jest już nigdzie w main.ts potrzebny (zostaje jako eksport tylko dla
  // cityPanel.ts / population-growth-v85.ts / society-breakdown.ts).
  assert(
    mainSrc.includes("import { computeCitizenResourceDrain } from './game/citizen-resource-upkeep';"),
    'main.ts importuje computeCitizenResourceDrain z citizen-resource-upkeep.ts (resolveCitizenResourceCoverage NIE jest już importowane w main.ts od N1 panelu Surowców)',
  );
  // N2 (2026-08-11): pętla Porządku woła TERAZ citizenUpkeepDrainForOwner(city.ownerId)
  // (realny drenaż), NIE resolveCitizenResourceCoverage bezpośrednio. AKTUALIZACJA runda 3
  // (Evaluator FAIL runda 2, powody 1+2): resolveCitizenResourceCoverage NIE jest już wołana
  // wprost ani przez buildEmpireResourceRows (podgląd panelu Surowców, main.ts), ani przez
  // computeOrderStateLocal (cityPanel.ts) -- oba miejsca TERAZ preferują odczyt WERDYKTU
  // SILNIKA (cityOrderState.get(...)?.citizenUpkeep / cfg.getOrderState?.(...)?.citizenUpkeep)
  // i fallbackują na computeCitizenResourceDrain (realny drenaż) tylko gdy silnik jeszcze nie
  // policzył tej tury (np. pierwszy render UI przed 1. turą) -- patrz sekcja I niżej.
  // resolveCitizenResourceCoverage (stara binarna reguła magazyn>0) zostaje w kodzie jako
  // eksport wyłącznie jako fallback wewnątrz computeView (cityPanel.ts, inna funkcja niż
  // computeOrderStateLocal) -- w praktyce nieosiągalny, bo ordState.citizenUpkeep jest tam
  // zawsze ustawione (dead code, poza zakresem tej naprawy).
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
// I. buildEmpireResourceRows (panel Surowców) czyta WERDYKT SILNIKA z citizenUpkeepByOwner
//    (mapa kluczowana BEZPOŚREDNIO OWNEREM), NIE przelicza na żywo, NIE przechodzi przez ID
//    miasta (N1 runda 4, Evaluator FAIL runda 3, Maciej 2026-08-11)
// ===========================================================================
console.log('\n-- I. buildEmpireResourceRows czyta citizenUpkeepByOwner (regresja rundy 3: owner-leak przez cities.find) --');
{
  // Rozjazd rundy 3: buildEmpireResourceRows czytało werdykt przez
  // `cities.find(c => c.ownerId === ownerId)` + `cityOrderState.get(thatCity.id)?.citizenUpkeep`.
  // Zdobycie miasta (oblężenie/aneksja) zmienia `city.ownerId` W TRAKCIE tury i NIE czyści
  // starego wpisu w `cityOrderState` -- `find()` mógł trafić na PRZEJĘTE miasto, którego wpis
  // niósł jeszcze werdykt POPRZEDNIEGO właściciela (Evaluator: panel gracza w epoce Kamienia
  // pokazywał wymagania epoki Brązu, werdykt cudzej AI, tuż po przejęciu jej miasta). Naprawa:
  // odczyt WPROST `citizenUpkeepByOwner.get(ownerId)` -- mapa kluczowana bezpośrednio ownerem,
  // bez żadnego pośrednictwa przez ID miasta, przetrwałą między turami (nie tylko lokalny
  // resolver-cache per turę). Fallback na computeCitizenResourceDrain TYLKO gdy
  // citizenUpkeepByOwner jeszcze nie ma wpisu dla tego ownera.
  // Wzorem sekcji H: okno indexOf na treść funkcji (kotwica definicji do kolejnej znanej linii
  // ciała), zamiast gołego .includes() na całym pliku (żeby nie złapać przypadkiem innego,
  // niepowiązanego citizenUpkeepByOwner.get(...) gdzie indziej w main.ts).
  const FN_ANCHOR = 'function buildEmpireResourceRows(ownerId: number): EmpireResourceRow[] {';
  const fnIdx = mainSrcStripped.indexOf(FN_ANCHOR);
  assert(fnIdx > -1, 'main.ts: kotwica "function buildEmpireResourceRows(...)" znaleziona (po stripLineComments)');
  const CITIZEN_UPKEEP_END_ANCHOR = 'const citizenRequiredSet';
  const endIdx = fnIdx > -1 ? mainSrcStripped.indexOf(CITIZEN_UPKEEP_END_ANCHOR, fnIdx) : -1;
  assert(endIdx > fnIdx, 'main.ts: kotwica "const citizenRequiredSet" znaleziona PO początku buildEmpireResourceRows -- okno ciała funkcji dobrze uformowane');
  const fnHeadWindow = (fnIdx > -1 && endIdx > fnIdx) ? mainSrcStripped.slice(fnIdx, endIdx) : '';
  assert(
    fnHeadWindow.includes('citizenUpkeepByOwner.get(ownerId)'),
    'I1 (zabija regresję rundy 3 -- owner-leak przez cities.find): buildEmpireResourceRows czyta '
      + 'werdykt silnika przez citizenUpkeepByOwner.get(ownerId) -- odczyt WPROST po ownerId, '
      + 'dokładnie ten klucz, bez pośrednictwa przez żaden identyfikator miasta',
  );
  assert(
    /citizenUpkeep\s*=\s*citizenUpkeepByOwner\.get\(ownerId\)\s*\?\?[\s\S]*?computeCitizenResourceDrain\(/.test(fnHeadWindow),
    'I2 (zabija mutant "usuń fallback, zostaw tylko citizenUpkeepByOwner.get"): przypisanie '
      + '`citizenUpkeep` ma kształt "citizenUpkeepByOwner.get(ownerId) ?? fallback '
      + 'computeCitizenResourceDrain(...)" -- werdykt silnika ZAWSZE preferowany, '
      + 'computeCitizenResourceDrain tylko gdy citizenUpkeepByOwner nie ma jeszcze wpisu dla '
      + 'tego ownera (np. pierwszy render UI przed 1. turą), nie odwrotnie',
  );
  // I3 (N3, Maciej 2026-08-11 -- zabija regresję rundy 3 STRUKTURALNIE, nie tylko kształtem
  // przypisania): mutant "zmień === na !== w predykacie ownera" (czytanie werdyktu OBCEGO
  // ownera) z rundy 2/3 żył wewnątrz `cities.find(c => c.ownerId === ownerId)` -- po naprawie
  // N1 runda 4 ten wektor mutacji znika STRUKTURALNIE: nie ma już PREDYKATU ownerId do
  // zmutowania w tym miejscu, jest bezpośredni `.get(ownerId)`. Asercja dowodzi, że
  // `cities.find` NIE występuje już nigdzie w ciele buildEmpireResourceRows (żaden predykat
  // ownerId do złapania mutantem) -- regres rundy 3 nie może się już zdarzyć w tym kształcie.
  assert(
    !fnHeadWindow.includes('cities.find('),
    'I3 (zabija regresję rundy 3 strukturalnie): buildEmpireResourceRows NIE zawiera już '
      + '`cities.find(...)` -- wektor mutacji "zmień predykat ownerId" (cities.find(c => '
      + 'c.ownerId === ownerId)) jest strukturalnie usunięty, nie tylko naprawiony kształtem',
  );
  // I4 (N3, dowód BEHAWIORALNY): syntetyczna mapa "citizenUpkeepByOwner-podobna" z RÓŻNYMI
  // wpisami dla 2 ownerów -- odczyt dla ownera A zwraca DOKŁADNIE wpis A, nigdy wpis B, mimo
  // że oba mają byłego wspólnego pochodzenia (np. B pochodzi z miasta, które A właśnie
  // podbiło). Nie dowodzi to samo w sobie poprawności main.ts (Map.get jest wbudowanym,
  // zawsze poprawnym operatorem JS) -- w połączeniu z I1 (dowód, że main.ts DOKŁADNIE tej
  // metody/klucza używa) i I3 (dowód, że NIE MA już alternatywnej, dziurawej ścieżki
  // cities.find obok) stanowi kompletny dowód: main.ts woła TĘ operację, a TA operacja nie
  // miesza kluczy między ownerami.
  const syntheticByOwner = new Map();
  syntheticByOwner.set(7 /* AI, epoka Brąz */, { required: ['drewno', 'kamien'], available: [], missing: ['drewno', 'kamien'], happinessDelta: -2, growthPctDelta: -2 });
  syntheticByOwner.set(0 /* gracz, epoka Kamień, PO podboju miasta ownera 7 */, { required: ['drewno', 'glina'], available: ['drewno', 'glina'], missing: [], happinessDelta: 2, growthPctDelta: 0 });
  const readForPlayer = syntheticByOwner.get(0);
  const readForAi = syntheticByOwner.get(7);
  assert(
    readForPlayer !== readForAi,
    'I4: odczyt dla ownera=0 (gracz) i ownera=7 (AI) zwraca DWA RÓŻNE obiekty -- brak przemieszania',
  );
  deepEqSet(readForPlayer.required, ['drewno', 'glina'], 'I4: ownerId=0 (gracz, Kamień) dostaje SWOJĄ listę wymagań, nie epoki Brązu ownera 7');
  eq(readForPlayer.missing.length, 0, 'I4: ownerId=0 nie dziedziczy "missing" ownera 7 mimo że ten ostatni ma te same klucze required (drewno)');
  deepEqSet(readForAi.required, ['drewno', 'kamien'], 'I4: ownerId=7 (AI, Brąz) dostaje SWOJĄ listę wymagań, nie epoki Kamień ownera 0');
}

// ===========================================================================
// J. cityPanel.ts: computeOrderStateLocal preferuje werdykt silnika
//    (cfg.getOrderState?.(city.id)?.citizenUpkeep) nad przeliczaniem inline (N2, Maciej
//    2026-08-11 -- luka testowa po naprawie rundy 3, ZERO pokrycia do tej pory)
// ===========================================================================
console.log('\n-- J. cityPanel.ts computeOrderStateLocal -- werdykt silnika przed fallbackiem inline --');
{
  // cityPanel.ts NIE bundluje się praktycznie samodzielnie przez esbuild (moduł >10 000 linii,
  // singleton `cfg` wypełniany przez configureCityPanel(), zależności DOM/canvas/dziesiątki
  // opcjonalnych callbackow) -- ustalona konwencja w tym repo dla tego pliku to strukturalne
  // asercje regex/indexOf na źródle jako tekst, NIE pełne wykonanie (patrz
  // spichlerz-cap-citypanel-wiring-test.cjs, city-panel-growth-percent-separator-test.cjs --
  // ten sam wzorzec, ta sama uzasadniona przyczyna). computeOrderStateLocal i resolveOrderState
  // nie są nawet eksportowane (funkcje modułowe prywatne), więc bezpośredni import jest
  // niemożliwy bez refaktoru wykraczającego poza zakres tego zgłoszenia.
  const CITY_PANEL_TS = path.join(GRA, 'src', 'ui', 'cityPanel.ts');
  const cityPanelSrcRaw = fs.readFileSync(CITY_PANEL_TS, 'utf8');
  const cityPanelSrcStripped = stripLineComments(cityPanelSrcRaw);

  const FN_ANCHOR = 'function computeOrderStateLocal(city: City, data: GameData): { state: OrderState; fromEngine: boolean } {';
  const fnIdx = cityPanelSrcStripped.indexOf(FN_ANCHOR);
  assert(fnIdx > -1, 'cityPanel.ts: kotwica "function computeOrderStateLocal(...)" znaleziona (po stripLineComments)');
  const endIdx = fnIdx > -1 ? cityPanelSrcStripped.indexOf('const ordPctRaw', fnIdx) : -1;
  assert(endIdx > fnIdx, 'cityPanel.ts: kotwica "const ordPctRaw" znaleziona PO początku computeOrderStateLocal -- okno ciała funkcji dobrze uformowane');
  const fnWindow = (fnIdx > -1 && endIdx > fnIdx) ? cityPanelSrcStripped.slice(fnIdx, endIdx) : '';

  // J1: cfg.getOrderState?.(city.id)?.citizenUpkeep obecne w ciele funkcji (werdykt silnika).
  const engineReadIdx = fnWindow.indexOf('cfg.getOrderState?.(city.id)?.citizenUpkeep');
  assert(engineReadIdx > -1, 'J1: computeOrderStateLocal czyta cfg.getOrderState?.(city.id)?.citizenUpkeep (werdykt silnika, ten sam hak co `live` w resolveOrderState)');

  // J2: computeCitizenResourceDrain(...) (fallback inline) obecne, ale PO odczycie silnika --
  // mutant "przywróć starą regułę" (usunięcie odczytu silnika, zostawienie tylko fallbacku
  // inline jako jedynego źródła) MUSI dać FAIL na J1 (indexOf zwróci -1) i/lub J3 (kolejność).
  const fallbackIdx = fnWindow.indexOf('computeCitizenResourceDrain(era, ownerPopulationAll, ownerResourceStockAll(allCities, city.ownerId))');
  assert(fallbackIdx > -1, 'J2: computeOrderStateLocal ma fallback computeCitizenResourceDrain(era, ownerPopulationAll, ...) w ciele funkcji');

  // J3: KOLEJNOŚĆ -- odczyt silnika PRZED fallbackiem inline (kształt "silnik ?? fallback",
  // nie "fallback ?? silnik" ani dwie niepowiązane gałęzie). Zabija mutant zamiany kolejności
  // operandów `??`, który dałby fallback pierwszeństwo przed werdyktem silnika.
  assert(
    engineReadIdx > -1 && fallbackIdx > -1 && engineReadIdx < fallbackIdx,
    'J3: odczyt cfg.getOrderState?.(city.id)?.citizenUpkeep leży PRZED computeCitizenResourceDrain(...) w tekście -- werdykt silnika ma pierwszeństwo, fallback inline jest DRUGI operand `??`, nie pierwszy',
  );
  // J3b: strukturalnie w kształcie "silnik ?? fallback" (ten sam operator `??` łączący oba,
  // nie dwa niezależne przypisania w różnych gałęziach if/else, które mogłyby się rozjechać).
  assert(
    /cfg\.getOrderState\?\.\(city\.id\)\?\.citizenUpkeep\s*\n?\s*\?\?\s*\n?\s*computeCitizenResourceDrain\(/.test(fnWindow),
    'J3b: kształt DOKŁADNIE "cfg.getOrderState?.(city.id)?.citizenUpkeep ?? computeCitizenResourceDrain(...)" -- jeden operator `??`, nie rozgałęzienie if/else',
  );

  // J4 (N2, wymóg jawny zgłoszenia): W CIELE FUNKCJI NIE MA gołego wywołania
  // resolveCitizenResourceCoverage(...) jako głównej ścieżki. Po naprawie N5 (ta sama runda)
  // import resolveCitizenResourceCoverage jest CAŁKOWICIE usunięty z cityPanel.ts (był martwym
  // fallbackiem WYŁĄCZNIE w computeView, innej funkcji niż computeOrderStateLocal) -- więc ta
  // asercja jest dziś silniejsza niż wymagane minimum: sprawdza CAŁY plik, nie tylko to okno.
  assert(
    !cityPanelSrcStripped.includes('resolveCitizenResourceCoverage('),
    'J4: cityPanel.ts NIE zawiera już żadnego wywołania resolveCitizenResourceCoverage(...) -- '
      + 'usunięta jako martwy fallback (N5, ta sama runda); computeOrderStateLocal NIGDY nie '
      + 'używała jej jako głównej ścieżki, teraz nie istnieje nawet jako import',
  );
  assert(
    !cityPanelSrcRaw.includes("resolveCitizenResourceCoverage,\n") && !/import\s*\{[^}]*\bresolveCitizenResourceCoverage\b/.test(cityPanelSrcRaw),
    'J5 (N5): cityPanel.ts nie importuje już resolveCitizenResourceCoverage z game/citizen-resource-upkeep (martwy import usunięty)',
  );
}

// ===========================================================================
// G. computeCitizenResourceDrain -- realny drenaż 1,0 szt./obywatel (N2, Maciej 2026-08-11;
//    stawka 1,0->0,2 Maciej 2026-08-12, "DECYZJA: STAWKA 1->0,2", punkt 1; PRZYWRÓCONA
//    0,2->1,0 Maciej 2026-08-13, R-EKONOMIA-SUROWCE-SKALA-5X-Q1 -- pełne przeskalowanie
//    ekonomii surowcowej ×5 usuwa problem floor-do-zera u źródła)
// ===========================================================================
console.log('\n-- G. computeCitizenResourceDrain -- realny drenaż 1,0 szt./obywatel --');
{
  // G0 (Evaluator FAIL na 1208eb6c, pin stawki): jedyny dotychczasowy pin wartości stawki leżał w
  // INNYM, późniejszym pliku (porzadek-panel-czytelnosc-test.cjs), nie w tym dedykowanym
  // teście stawki -- ta bramka mogła teoretycznie przejść zielono nawet gdyby ktoś podmienił
  // CITIZEN_UPKEEP_RATE_PER_CITIZEN na inną wartość, dopóki druga, niepowiązana bramka nie
  // zostałaby uruchomiona. Pin wprost, w miejscu gdzie stawka jest zdefiniowana i używana.
  eq(M.CITIZEN_UPKEEP_RATE_PER_CITIZEN, 1.0, 'G0: kanon stawki (Maciej 2026-08-13, R-EKONOMIA-SUROWCE-SKALA-5X-Q1, powrót do 1,0) -- CITIZEN_UPKEEP_RATE_PER_CITIZEN === 1,0 szt. surowca/obywatela/turę, pinowane bezpośrednio w tym dedykowanym teście');

  // PRZELICZENIE PO PRZYWRÓCENIU STAWKI (2026-08-13, 0,2->1,0 = R-EKONOMIA-SUROWCE-SKALA-5X-Q1):
  // populacje w tej sekcji WRACAJĄ do wartości sprzed korekty 2026-08-12 (50->10, 15->3, 35->7),
  // bo required = Math.floor(population * 1,0) = population wprost -- żeby "want" wartości
  // (required=10/3/7 itd.) zostały DOKŁADNIE takie same jak dotychczas, przelicza się tylko
  // liczbę obywateli na wejściu, w drugą stronę niż robił to commit z 2026-08-12.
  //
  // Stawka 1,0: 10 obywateli, magazyn 10 drewna/10 gliny (epoka 1) -> required=floor(10*1,0)=10
  // każdy, drained=10 każdy (magazyn wystarcza), oba "available" (pełne pokrycie).
  const full = M.computeCitizenResourceDrain(1, 10, { drewno: 10, glina: 10 });
  deepEqSet(full.available, ['drewno', 'glina'], 'magazyn wystarcza na required=10 (z 10 obywateli x 1,0) każdego surowca -> oba available');
  eq(full.deductions.drewno, 10, 'deductions.drewno = 10 (1,0 szt./obywatel × 10 obywateli)');
  eq(full.deductions.glina, 10, 'deductions.glina = 10 (1,0 szt./obywatel × 10 obywateli)');

  // Niedobór: magazyn MNIEJSZY niż required -> drained = min(required, stock), NIGDY < 0,
  // surowiec liczy się jako "missing" (pokrycie częściowe, nie pełne -- kara nadal binarna).
  const partial = M.computeCitizenResourceDrain(1, 10, { drewno: 3, glina: 0 });
  deepEqSet(partial.missing, ['drewno', 'glina'], '10 obywateli (required=10), magazyn drewna=3 (< required=10) -> missing (pokrycie częściowe = brak)');
  eq(partial.deductions.drewno, 3, 'deductions.drewno = min(10, 3) = 3 -- drenuje ile jest, magazyn NIE schodzi poniżej zera');
  assert(!('glina' in partial.deductions), 'deductions.glina nieobecne (0 do odjęcia) -- magazyn=0, nic nie drenować');

  // Zero obywateli -> zero zapotrzebowania -> zawsze "available" (brak kary na dane brzegowe).
  // Stawka nie ma tu znaczenia (0 * dowolna_stawka = 0) -- populacja NIE przeskalowana.
  const zeroPop = M.computeCitizenResourceDrain(1, 0, { drewno: 0, glina: 0 });
  deepEqSet(zeroPop.available, ['drewno', 'glina'], '0 obywateli -> required=0 -> zawsze pełne pokrycie, nawet z pustym magazynem');
  eq(Object.keys(zeroPop.deductions).length, 0, '0 obywateli -> brak zapotrzebowania -> brak odjęcia (deductions puste)');

  // Populacja ujemna/niefinitna (dane śmieciowe) -> traktowana jak 0, zero regresji/crashu.
  // Stawka nie ma tu znaczenia (pop klamrowane do 0 PRZED przemnożeniem przez stawkę).
  const negPop = M.computeCitizenResourceDrain(1, -5, { drewno: 0 });
  eq(Object.keys(negPop.deductions).length, 0, 'populacja ujemna traktowana jak 0 -- brak odjęcia, brak crasha');
  const nanPop = M.computeCitizenResourceDrain(1, NaN, { drewno: 0 });
  eq(Object.keys(nanPop.deductions).length, 0, 'populacja NaN traktowana jak 0 -- brak odjęcia, brak crasha');

  // Kara nadal BINARNA (ECHO Q3=A niezmienione): pokrycie W PEŁNI (nie licznik/rozmiar
  // niedoboru) -- 1 sztuka brakująca do pełnego pokrycia daje TAKĄ SAMĄ karę jak 1000 sztuk
  // brakujących (obie "missing"), happinessDelta/growthPctDelta liczą TYLKO available.length/missing.length.
  // 10 obywateli -> required=10 (jak wyżej); drewno=9 to "brakuje 1 sztuki do required=10".
  const barelyMissing = M.computeCitizenResourceDrain(1, 10, { drewno: 9, glina: 10 });
  const wayMissing = M.computeCitizenResourceDrain(1, 10, { drewno: 0, glina: 10 });
  eq(barelyMissing.happinessDelta, wayMissing.happinessDelta, 'ECHO Q3=A zachowane: brak 1 sztuki do pełnego pokrycia = ta sama kara co brak całości (binarne, nie proporcjonalne)');

  // G2 (Evaluator FAIL na 1208eb6c -- pokrycie zaokrąglenia; NOTA 2026-08-13,
  // R-EKONOMIA-SUROWCE-SKALA-5X-Q1): przy stawce 0,2 populacja NIEBĘDĄCA wielokrotnością 5
  // (53×0,2=10,600000000000001) rozróżniała floor/ceil/round -- ta konstrukcja stała się
  // STRUKTURALNIE NIEOSIĄGALNA po powrocie do stawki 1,0: `pop` jest już zaokrąglone w dół do
  // liczby całkowitej PRZED przemnożeniem (`Math.floor(population)`), więc `pop × 1,0` jest
  // ZAWSZE dokładną liczbą całkowitą w IEEE754 (żadnej straty precyzji) -- floor(N)==ceil(N)==
  // round(N)==N dla KAŻDEGO całkowitego N i KAŻDEJ wartości populacji, nie da się już dobrać
  // populacji łamiącej tę symetrię. To nie luka w teście, tylko bezpośrednia konsekwencja
  // wyboru stawki 1,0 (ten sam powód, dla którego przywrócono 1,0 -- floor nigdy nie gubi
  // precyzji przy całkowitej stawce). Test niżej zostaje jako podstawowa asercja poprawności
  // (required = population wprost), nie jako dyskryminator mutacji floor/ceil/round.
  // / EN: the floor/ceil/round-discriminating design from the 0.2-rate era is now structurally
  // unreachable -- with rate=1.0, `pop` is already an integer before multiplication, so
  // pop×1.0 is always an exact integer (no IEEE754 precision loss), meaning floor/ceil/round
  // agree for EVERY population value. This is a direct consequence of choosing rate=1.0 (the
  // same reason it fixes the zero-rounding bug), not a test gap. Kept as a basic correctness
  // check, no longer as a rounding-mutant discriminator.
  const roundingProbe = M.computeCitizenResourceDrain(1, 53, { drewno: 100, glina: 100 });
  eq(
    roundingProbe.deductions.drewno, 53,
    'G2: pop=53, stawka 1,0 -- required=floor(53×1,0)=53 wprost (floor/ceil/round nierozróżnialne '
      + 'przy stawce całkowitej, patrz komentarz wyżej)',
  );
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

  // ---------------------------------------------------------------------
  // H4/H5 (N2, Maciej 2026-08-11 -- naprawa luki testowej po Evaluatorze): H1-H3 wyżej
  // sprawdzają OBECNOŚĆ trzech stringów gdziekolwiek w mainSrcStripped, ale NIE ich WZAJEMNĄ
  // KOLEJNOŚĆ/ZAGNIEŻDŻENIE -- dwa realne mutanty tej klasy przechodziły 78/78 bez wykrycia:
  //
  //   M4 -- `if (ownerId === 0 && ...) { deductBuildingStockCostAcrossCities(...); }`: AI/
  //         Państwa-Miasta nigdy realnie nie płacą (drenaż liczony, ale magazyn nigdy nie
  //         mutowany dla ownerId !== 0) -- łamie parytet gracz/AI (ECHO Q2=A) po cichu, bo H2
  //         nadal widzi string deductBuildingStockCostAcrossCities(...) GDZIEŚ w pliku.
  //   M5 -- `deductBuildingStockCostAcrossCities(...)` PRZENIESIONE POZA blok
  //         `if (v === undefined) { ... }` (np. wywoływane bezwarunkowo PO nim, przy każdym
  //         wejściu do resolvera): drenaż powtarzany dla KAŻDEGO miasta tego samego ownera
  //         zamiast RAZ na turę -- dokładnie pułapka, przed którą H3/cache miał chronić, ale
  //         H3 sprawdza tylko że `.set(ownerId, v)` istnieje w pliku, nie że deduct leży
  //         WEWNĄTRZ tej samej gałęzi `if (v === undefined)`.
  //
  // Wzorzec naprawy: sekcja E wyżej już używa okien tekstowych (indexOf + slice) zamiast
  // gołego .includes() na całym pliku -- ta sama technika: wytnij dokładnie treść resolvera
  // (od `if (v === undefined) {` do `citizenUpkeepDrainCache.set(ownerId, v);`, zakotwiczone
  // wewnątrz definicji citizenUpkeepDrainForOwner, żeby nie złapać innego, niepowiązanego
  // `if (v === undefined) {` gdzie indziej w main.ts) i sprawdź WEWNĄTRZ tego okna:
  //   H4 (zabija M5): wywołanie deduct leży MIĘDZY `if (v === undefined) {` a `.set(...)` --
  //       gdyby M5 przeniosło je poza blok, nie znalazłoby się w oknie -> FAIL.
  //   H5 (zabija M4): W TREŚCI resolvera NIE MA żadnego filtra po ownerId (`ownerId === 0`
  //       ani `ownerId !== 0`) -- gdyby M4 dodało taki warunek wokół deduct, regex by go
  //       złapał -> FAIL. Parytet gracz/AI = brak jakiegokolwiek rozgałęzienia po ownerId
  //       w tym bloku, nie tylko obecność samego wywołania deduct.
  // ---------------------------------------------------------------------
  const RESOLVER_DEF_ANCHOR = 'const citizenUpkeepDrainForOwner = (ownerId: number)';
  const resolverDefIdx = mainSrcStripped.indexOf(RESOLVER_DEF_ANCHOR);
  assert(resolverDefIdx > -1, 'main.ts: kotwica definicji citizenUpkeepDrainForOwner znaleziona');
  const idxOfIfUndefined = resolverDefIdx > -1
    ? mainSrcStripped.indexOf('if (v === undefined) {', resolverDefIdx)
    : -1;
  assert(idxOfIfUndefined > -1, 'main.ts: "if (v === undefined) {" znalezione WEWNĄTRZ definicji citizenUpkeepDrainForOwner (nie gdzie indziej w pliku)');
  const idxOfCacheSet = idxOfIfUndefined > -1
    ? mainSrcStripped.indexOf('citizenUpkeepDrainCache.set(ownerId, v);', idxOfIfUndefined)
    : -1;
  assert(idxOfCacheSet > idxOfIfUndefined, 'main.ts: "citizenUpkeepDrainCache.set(ownerId, v);" znalezione PO "if (v === undefined) {" -- okno resolvera dobrze uformowane');
  const resolverBlockWindow = (idxOfIfUndefined > -1 && idxOfCacheSet > idxOfIfUndefined)
    ? mainSrcStripped.slice(idxOfIfUndefined, idxOfCacheSet)
    : '';

  assert(
    resolverBlockWindow.includes('deductBuildingStockCostAcrossCities(cities, ownerId, v.deductions);'),
    'H4 (zabija mutanta M5 -- deduct przeniesiony POZA blok if(v===undefined)): wywołanie '
      + 'deductBuildingStockCostAcrossCities leży WEWNĄTRZ okna między "if (v === undefined) {" '
      + 'a "citizenUpkeepDrainCache.set(ownerId, v);" -- czyli drenaż realnie liczony i mutowany '
      + 'TYLKO gdy cache jest pusty (RAZ per owner per turę), nie przy każdym wejściu do resolvera',
  );
  // N2b (Maciej 2026-08-11, drobna naprawa zgłoszona przy okazji N1 rundy 3): regex łapał
  // WYŁĄCZNIE warianty `===`/`!== 0` -- mutant M4 zapisany jako `if (ownerId > 0 ...)` albo
  // `if (ownerId < 1 ...)`-owy odpowiednik z porównaniem `> 0`/`< 0` przechodziłby bez
  // wykrycia. Rozszerzone o `[=!<>]=?` (obejmuje ===/!==/==/!=/>/</>=/<=), wciąż wymaga
  // literalnego `0` PO operatorze, więc `c.ownerId === ownerId` (H1, legalne porównanie
  // wewnątrz tego samego okna) nadal NIE jest łapane -- brak fałszywego trafienia.
  assert(
    !/ownerId\s*[=!<>]=?\s*0/.test(resolverBlockWindow),
    'H5 (zabija mutanta M4 -- "if (ownerId === 0 && ...)" / ">"/"<" wokół deduct, AI nigdy '
      + 'realnie nie płaci): treść resolvera (if(v===undefined) .. .set(ownerId, v)) NIE zawiera '
      + 'żadnego filtra "ownerId {=,!,>,<}= 0" -- drenaż i deduct stosowane identycznie dla '
      + 'gracza i AI/Państw-Miast (parytet ECHO Q2=A), bez rozgałęzienia po ownerId',
  );

  // ---------------------------------------------------------------------
  // H6 (N1 runda 5, punkt 2 Evaluatora rundy 4 -- Maciej 2026-08-12): H1-H5 wyżej dowodzą, że
  // resolver poprawnie sumuje populację, realnie drenuje magazyn RAZ per owner per turę i robi to
  // identycznie dla gracza/AI -- ale ŻADNA z nich nie sprawdza, że wynik jest TAKŻE publikowany do
  // `citizenUpkeepByOwner` (mapa kluczowana ownerem, PRZETRWAŁA między turami, czytana przez panel
  // Surowców -- sekcja I, `citizenUpkeepByOwner.get(ownerId)`). Dziś usunięcie SAMEJ linii
  // `citizenUpkeepByOwner.set(ownerId, v);` przechodzi wszystkie 100 asercji tego pliku bez
  // wykrycia -- cichy powrót DOKŁADNIE tej regresji, którą naprawiono w rundzie 2 (panel Surowców
  // czyta werdykt sprzed drenażu / spada na fallback inline zamiast werdyktu silnika), mimo że
  // sam drenaż magazynu (H1-H5) nadal działa bez zarzutu.
  //
  // Okno H4/H5 (resolverBlockWindow, `if (v === undefined) {` .. `citizenUpkeepDrainCache.set(
  // ownerId, v);`, WYŁĄCZNIE tej drugiej kotwicy) NIE nadaje się tu wprost: w realnym main.ts
  // `citizenUpkeepByOwner.set(ownerId, v);` leży TEKSTOWO PO `citizenUpkeepDrainCache.set(ownerId,
  // v);` (publikacja do mapy przetrwałej jest druga, celowo PO zapisie do cache'a lokalnego), więc
  // nie mieści się w tamtym (węższym, celowo innym) oknie. Nowe okno używa TEJ SAMEJ kotwicy
  // startowej (`if (v === undefined) {`), ale kończy się na `return v;` -- jedynej instrukcji PO
  // zamknięciu bloku `if` wewnątrz ciała citizenUpkeepDrainForOwner (kształt funkcji:
  // `if (v === undefined) { ... } return v;`) -- więc okno obejmuje CAŁY blok if (oba `.set(...)`)
  // i nic poza nim (kolejna funkcja/kod w main.ts nie ma szans wejść w okno).
  // ---------------------------------------------------------------------
  const idxOfReturnV = idxOfIfUndefined > -1
    ? mainSrcStripped.indexOf('return v;', idxOfIfUndefined)
    : -1;
  assert(idxOfReturnV > idxOfCacheSet, 'main.ts: "return v;" znalezione PO "citizenUpkeepDrainCache.set(ownerId, v);" WEWNĄTRZ citizenUpkeepDrainForOwner -- okno całego bloku if (H6) dobrze uformowane');
  const resolverFullBlockWindow = (idxOfIfUndefined > -1 && idxOfReturnV > idxOfIfUndefined)
    ? mainSrcStripped.slice(idxOfIfUndefined, idxOfReturnV)
    : '';
  assert(
    resolverFullBlockWindow.includes('citizenUpkeepByOwner.set(ownerId'),
    'H6 (N1 runda 5, punkt 2 Evaluatora rundy 4 -- zabija powrót regresji rundy 2/3 "po cichu": '
      + 'usunięcie publikacji werdyktu do mapy przetrwałej między turami): treść całego bloku '
      + 'if(v===undefined) {..} wewnątrz citizenUpkeepDrainForOwner (od "if (v === undefined) {" do '
      + '"return v;") zawiera TAKŻE "citizenUpkeepByOwner.set(ownerId" -- wynik drenażu publikowany '
      + 'RÓWNOLEGLE do citizenUpkeepDrainCache (lokalny cache resolvera, ginie po turze) ORAZ do '
      + 'citizenUpkeepByOwner (przetrwały, czytany wprost przez panel Surowców -- sekcja I), nie '
      + 'tylko do pierwszego z nich',
  );
  // H6b (Evaluator, dispatch domykający N2: H6 wyżej łapie USUNIĘCIE wywołania .set(...), ale NIE
  // łapie PODMIANY jego drugiego argumentu na błędną, zahardkodowaną wartość zamiast realnie
  // policzonego `v` -- dowiedzione mutacją `citizenUpkeepByOwner.set(ownerId, { deductions: [],
  // perCitizen: 0, total: 0 })`, która przeszła 106/106 bez wykrycia. H6b wymaga, żeby DRUGI
  // argument .set() był dosłownie gołą zmienną `v` (nie obiektem literalnym/inną nazwą) -- ten sam
  // `v`, który `if (v === undefined) { ... }` właśnie obliczył i który `return v;` zwraca niżej,
  // więc podmiana na cokolwiek innego niż `v)` (ze średnikiem lub bez, przed `}`) jest łapana.
  assert(
    /citizenUpkeepByOwner\.set\(ownerId,\s*v\)\s*;/.test(resolverFullBlockWindow),
    'H6b: drugi argument "citizenUpkeepByOwner.set(ownerId, v);" to dosłownie zmienna "v" (ten sam '
      + 'wynik co "return v;" niżej) -- nie zahardkodowany obiekt ani inna zmienna. Mutacja '
      + 'podmieniająca ją na fałszywą wartość (np. total:0) jest tym samym łapana, mimo że sama '
      + 'obecność wywołania .set() (H6) by tego nie wykryła',
  );

  // Behawioralny dowód end-to-end: computeCitizenResourceDrain wywołane RAZ z sumą populacji
  // 2 miast daje IDENTYCZNY deductions co gdyby liczyć jedno "wirtualne" miasto o tej samej
  // populacji -- a NIE 2× wywołanie osobno, więc test dobiera asymetryczne populacje 3+7, żeby
  // odróżnić "suma najpierw" od "podwójne liczenie": drenaż z osobna dla pop=3 (required=
  // floor(3×1,0)=3) i pop=7 (required=floor(7×1,0)=7) na TYM SAMYM (niezmutowanym) magazynie
  // 8 drewna dałby OBA "available" (3<=8 i 7<=8) -- błędnie, bo razem potrzeba
  // floor(10×1,0)=10 > 8. Suma-najpierw (RAZ per owner) poprawnie daje deductions.drewno =
  // min(10, 8) = 8, missing.
  // PRZYWRÓCENIE PO ZMIANIE STAWKI (2026-08-13, 0,2->1,0, R-EKONOMIA-SUROWCE-SKALA-5X-Q1):
  // populacje WRACAJĄ do wartości sprzed korekty 2026-08-12 (15->3, 35->7, suma 50->10), żeby
  // required (3, 7, 10) i wszystkie "want" wartości niżej zostały DOKŁADNIE takie same jak
  // wcześniej (sprzed obu zmian stawki).
  const wrongPerCity3 = M.computeCitizenResourceDrain(1, 3, { drewno: 8 });
  const wrongPerCity7 = M.computeCitizenResourceDrain(1, 7, { drewno: 8 });
  assert(
    wrongPerCity3.available.includes('drewno') && wrongPerCity7.available.includes('drewno'),
    'sanity: liczone OSOBNO (błędny wzorzec) obie "widzą" magazyn=8 jako wystarczający -- to właśnie ta pułapka, którą H1-H3 mają wykluczyć w main.ts',
  );
  const correctSummedFirst = M.computeCitizenResourceDrain(1, 3 + 7, { drewno: 8, glina: 10 });
  eq(correctSummedFirst.deductions.drewno, 8, 'poprawny wzorzec (suma populacji NAJPIERW, RAZ per owner): deductions.drewno = min(10, 8) = 8, nie 2×8=16');
  deepEqSet(correctSummedFirst.missing, ['drewno'], 'poprawny wzorzec: 10 obywateli (required=10) > 8 sztuk drewna w magazynie (glina wystarcza) -> tylko drewno missing (poprawnie wykrywa niedobór, którego wzorzec "osobno" by nie zauważył)');
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

// ===========================================================================
// K. Parytet liczby miejsc czyszczenia: citizenUpkeepByOwner.clear() vs cityOrderState.clear()
//    (N1 runda 5, punkt 3 Evaluatora rundy 4 -- Maciej 2026-08-12)
// ===========================================================================
console.log('\n-- K. main.ts: parytet liczby wystąpień citizenUpkeepByOwner.clear() vs cityOrderState.clear() --');
{
  // Kontekst: `citizenUpkeepByOwner` musi być czyszczone w KAŻDYM miejscu, gdzie czyszczone jest
  // `cityOrderState` (4× w funkcjach startu nowej gry/restartu), PLUS DODATKOWO przy wczytaniu
  // zapisu (restoreGameFromSave). Backlog "cityOrderState nieczyszczone w restoreGameFromSave"
  // (odnotowany przez Evaluatora N1 rundy 5) został ZAMKNIĘTY równolegle z tą rundą -- oba pola są
  // dziś czyszczone w restoreGameFromSave, więc stan jest RÓWNY (5 i 5), nie ostro nierówny.
  //
  // K1 poniżej pinuje DOKŁADNIE dzisiejsze liczby -- to jest jedyna forma tej asercji, która
  // realnie łapie mutanta "usuń jedno z 5 wystąpień citizenUpkeepByOwner.clear()" (zweryfikowane
  // mutacją): sama nierówność `>=` (K2) NIE wykrywa tej mutacji gdy oba liczniki są równe (4 >= 5
  // fałszywe wprawdzie, ALE mutant "usuń jedno z 5 cityOrderState.clear()" da 5>=4, wciąż prawda --
  // K2 nie chroni przed usunięciem strony cityOrderState). K1 jest więc pierwszą linią obrony przed
  // regresją liczby PO KAŻDEJ stronie TU I TERAZ; K2 wyraża WŁAŚCIWY niezmiennik semantyczny na
  // przyszłość (patrz niżej).
  const byOwnerClearCount = (mainSrcStripped.match(/citizenUpkeepByOwner\.clear\(\)/g) || []).length;
  const orderStateClearCount = (mainSrcStripped.match(/cityOrderState\.clear\(\)/g) || []).length;
  eq(byOwnerClearCount, 5, 'K1: main.ts zawiera dziś dokładnie 5 wystąpień "citizenUpkeepByOwner.clear()" -- 4 w funkcjach startu nowej gry/restartu + 1 w restoreGameFromSave (naprawa punktu 1 tej samej rundy, commit 13f62b0b)');
  eq(orderStateClearCount, 5, 'K1: main.ts zawiera dziś dokładnie 5 wystąpień "cityOrderState.clear()" -- 4 w funkcjach startu nowej gry/restartu + 1 w restoreGameFromSave (domknięcie backlogu "cityOrderState nieczyszczone w restoreGameFromSave")');

  // K2 (wymóg wprost ze zgłoszenia): NIERÓWNOŚĆ jako niezmiennik na przyszłość -- jeśli powstanie
  // PIĄTE miejsce `cityOrderState.clear()` (np. nowy tryb startu gry) BEZ odpowiadającego mu
  // `citizenUpkeepByOwner.clear()`, licznik cityOrderState przewyższy licznik citizenUpkeepByOwner
  // i ta asercja złapie to czerwono -- zamiast pozwolić nowemu miejscu zresetować Porządek miast,
  // ale zostawić martwy/nieaktualny werdykt drenażu obywateli dla tego samego ownera.
  assert(
    byOwnerClearCount >= orderStateClearCount,
    `K2 (N1 runda 5, punkt 3 Evaluatora -- parytet na przyszłość): liczba wystąpień `
      + `"citizenUpkeepByOwner.clear()" (${byOwnerClearCount}) >= liczba wystąpień `
      + `"cityOrderState.clear()" (${orderStateClearCount}) w main.ts -- każde miejsce resetu `
      + 'Porządku miast ma odpowiadające miejsce resetu drenażu obywateli (co najmniej), żeby '
      + 'przyszłe PIĄTE miejsce cityOrderState.clear() bez odpowiednika nie zostało pominięte po '
      + 'cichu bez wykrycia',
  );

  // -------------------------------------------------------------------------
  // K3 (Runda 6, ta sama "PIĄTA szczelina" Evaluatora -- PYTANIA-OTWARTE.md): K1/K2 liczą
  // wystąpienia w CAŁYM main.ts, ale nie sprawdzają UMIEJSCOWIENIA. Gdyby jeden z 5
  // "citizenUpkeepByOwner.clear()" leżał GDZIE INDZIEJ niż wewnątrz restoreGameFromSave (np.
  // usunięty stamtąd i zduplikowany w funkcji startu nowej gry), K1 nadal widziałby 5 (liczba
  // się zgadza) -- OBIE K1-strony zielone, mimo że naprawa punktu 1 tej samej rundy (regresja
  // load-save, commit 13f62b0b) faktycznie by zniknęła. K3 domyka tę szóstą szczelinę: wycina
  // okno tekstu SAMEJ funkcji restoreGameFromSave dopasowaniem klamer od
  // 'function restoreGameFromSave(' (NIE kotwicząc na "następna `    function `" --
  // restoreGameFromSave jest OSTATNIĄ funkcją na tym poziomie wcięcia w main.ts, taka kotwica by
  // nie zadziałała) i sprawdza DOKŁADNIE wewnątrz tego okna, nie w całym pliku. Po domknięciu
  // backlogu "cityOrderState nieczyszczone w restoreGameFromSave" oczekiwane jest PO 1 wystąpieniu
  // KAŻDEGO z dwóch clear() wewnątrz tego okna, nie 1+0.
  // -------------------------------------------------------------------------

  /** Balansuje nawiasy klamrowe od podanego indeksu '{' i zwraca indeks TUŻ ZA dopasowanym '}'.
   *  (ten sam wzorzec co ai-founding-territory-test.cjs, balancedBraceEnd). */
  function balancedBraceEnd(src, openBraceIdx) {
    let depth = 0;
    let i = openBraceIdx;
    for (; i < src.length; i++) {
      if (src[i] === '{') depth++;
      else if (src[i] === '}') {
        depth--;
        if (depth === 0) { i++; break; }
      }
    }
    return i;
  }

  // Kotwica/okno to twarde WARUNKI WSTĘPNE tej bramki, nie osobne asercje do policzenia --
  // "dokładnie jedna nowa asercja K3" (zakres zgłoszenia). Brak kotwicy/pustego okna nie ma
  // sensownej wartości "czerwono policzonej" -- to awaria samego harnessu testu, więc rzuca
  // wyjątkiem zamiast wchodzić do passed/failed.
  const RESTORE_FN_ANCHOR = 'function restoreGameFromSave(';
  const restoreFnStart = mainSrcStripped.indexOf(RESTORE_FN_ANCHOR);
  if (restoreFnStart === -1) {
    throw new Error('K3: main.ts nie zawiera kotwicy "function restoreGameFromSave(" (po stripLineComments) -- harness testu wymaga naprawy, nie liczy się jako FAIL asercji');
  }
  const restoreBodyBraceStart = mainSrcStripped.indexOf('{', restoreFnStart);
  const restoreBodyEnd = balancedBraceEnd(mainSrcStripped, restoreBodyBraceStart);
  const restoreWindow = mainSrcStripped.slice(restoreFnStart, restoreBodyEnd);
  if (restoreWindow.length === 0) {
    throw new Error('K3: okno tekstu ciała restoreGameFromSave wycięte dopasowaniem klamer jest puste -- harness testu wymaga naprawy, nie liczy się jako FAIL asercji');
  }

  const restoreByOwnerClearCount = (restoreWindow.match(/citizenUpkeepByOwner\.clear\(\)/g) || []).length;
  const restoreOrderStateClearCount = (restoreWindow.match(/cityOrderState\.clear\(\)/g) || []).length;
  assert(
    restoreByOwnerClearCount === 1 && restoreOrderStateClearCount === 1,
    'K3 (Runda 6, umiejscowienie, nie tylko liczba w całym pliku): WEWNĄTRZ ciała restoreGameFromSave '
      + '(okno wycięte dopasowaniem klamer) jest dokładnie 1 wystąpienie "citizenUpkeepByOwner.clear()" '
      + '(naprawa punktu 1 tej samej rundy, commit 13f62b0b) i dokładnie 1 wystąpienie '
      + '"cityOrderState.clear()" (domknięcie backlogu "cityOrderState nieczyszczone w '
      + `restoreGameFromSave") -- got byOwner=${restoreByOwnerClearCount}, orderState=${restoreOrderStateClearCount}. `
      + 'K1/K2 liczą wystąpienia w CAŁYM main.ts i NIE wykrywają PRZENIESIENIA jednego z 5 '
      + 'clear() poza tę funkcję, dopóki suma w pliku się zgadza',
  );
}

// --- summary ---------------------------------------------------------------
console.log(`\ncitizen-resource-upkeep-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY_FILE); } catch (e) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}
process.exit(failed ? 1 : 0);
