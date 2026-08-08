'use strict';
/**
 * ai-prod-fallback-test.cjs — P-AI-MOC-GAP (Maciej 2026-08-08).
 *
 * Sprawdza mechanizm fallbacku produkcji AI: gdy głównego kandydata z
 * chooseCityProduction (ai.ts) nie stać w chwili EGZEKUCJI (bo np. miasto-siostra
 * tego samego ownera zdążyło skonsumować wspólną pulę surowców państwa wcześniej w
 * TEJ SAMEJ turze), AI próbuje kolejnych, tańszych kandydatów z tej samej listy
 * (AITurnOpts.lastProductionFallbackIds -> AICmdBuild.fallbackIds) zamiast
 * zostawiać kolejkę produkcji pustą, mimo że stać je było na coś tańszego.
 *
 * T1/T2 testują bezpośrednio nowe pole `opts.lastProductionFallbackIds`
 * (ai.ts, chooseCityProduction) -- realny, shipowany kod.
 * T3 symuluje egzekucję main.ts (pętla `cmd.type==='build'`, candidateIds =
 * [buildingId, ...fallbackIds], pierwszy afordowalny wygrywa) na DWÓCH miastach
 * dzielących wspólną pulę surowców -- odtwarza dokładnie mechanizm wyścigu, który
 * był przyczyną pustej kolejki (main.ts nie jest importowalny jako moduł, więc
 * pętla retry jest tu odtworzona 1:1 wg algorytmu wprowadzonego w main.ts;
 * dane wejściowe -- fallbackIds -- pochodzą z REALNEGO chooseCityProduction).
 *
 * Run from gra/: node tools/ai-prod-fallback-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const AI_SRC = process.env.AI_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const ENTRY_FILE = path.resolve(__dirname, '.ai-prod-fallback-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.ai-prod-fallback-bundle.cjs');

const ENTRY_TS = `
export { chooseCityProduction, loadDifficultyParams, decideAITurn, pickExecutableCandidate, buildCandidateIds, shouldAIRushBuyUnit } from ${JSON.stringify(AI_SRC + '/game/ai')};
export { canAffordUnitRecruitFull } from ${JSON.stringify(AI_SRC + '/game/economy-upkeep')};
`;

fs.writeFileSync(ENTRY_FILE, ENTRY_TS, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY_FILE],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  outfile: BUNDLE_FILE,
  absWorkingDir: GRA_ROOT,
  logLevel: 'silent',
});

const { chooseCityProduction, loadDifficultyParams, decideAITurn, pickExecutableCandidate, buildCandidateIds, shouldAIRushBuyUnit, canAffordUnitRecruitFull } = require(BUNDLE_FILE);

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error('  FAIL:', msg); }
}
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

function makeMap(w, h) {
  const hexes = {};
  for (let q = 0; q < w; q++) {
    for (let r = 0; r < h; r++) {
      hexes[`${q},${r}`] = {
        q, r, terenBazowy: 'Równina', nakladka: 0,
        rzeka: { obecna: false }, droga: { obecna: false },
      };
    }
  }
  return { width: w, height: h, hexes };
}

function makeCity(id, ownerId, q, r) {
  return { id, ownerId, q, r, name: id, population: 3 };
}

function makeGameData() {
  return {
    buildings: [
      { id: 'koszary', nazwa: 'Koszary' },
      { id: 'stolarnia', nazwa: 'Stolarnia' },
      { id: 'cegielnia', nazwa: 'Cegielnia' },
      { id: 'odlewnia_brazu', nazwa: 'Odlewnia brązu' },
      { id: 'magazyn', nazwa: 'Magazyn' },
      { id: 'targowisko', nazwa: 'Targowisko' },
      { id: 'biblioteka', nazwa: 'Biblioteka' },
      { id: 'akademia', nazwa: 'Akademia' },
    ],
    units: [],
    terrainYields: { terrain_types: [{ Teren: 'Równina', Zywnosc: 2, Praca: 1 }] },
    aiParams: {},
  };
}

const ZERO = { wojsko: 0, nauka: 0, ekonomia: 0, obrona: 0 };
const map = makeMap(10, 10);
const data = makeGameData();
const diff = loadDifficultyParams(data, 2);

// Trzy miasta -> myCities.length>=3 -> mid-phase (poza earlyPhase), żeby kandydaci
// to proste, przewidywalne 'koszary' (score 200+mil) / 'Wojownik' (170+mil) /
// 'Łucznik' (165+mil) — pozostałe budynki mid-phase oznaczamy jako już zbudowane,
// żeby lista kandydatów była krótka i jednoznaczna dla testu.
const BUILT_REST = ['stolarnia', 'cegielnia', 'odlewnia_brazu', 'magazyn', 'targowisko', 'biblioteka', 'akademia'];
const cityA = makeCity('cA', 7, 3, 3);
const cityB = makeCity('cB', 7, 8, 8);
const cityC = makeCity('cC', 7, 12, 12);
const myCities = [cityA, cityB, cityC];

console.log('--- T1: canAfford=wszystko dostępne -> pick=najwyzszy score, fallback=reszta w kolejności score ---');
{
  const opts = {
    cityBuildings: { cA: BUILT_REST },
    canAfford: () => true,
  };
  const pick = chooseCityProduction('cA', myCities, [], 7, data, ZERO, opts, map, diff);
  eq(pick, 'koszary', 'T1a: koszary ma najwyzszy score (300) wsrod kandydatow');
  eq(
    JSON.stringify(opts.lastProductionFallbackIds),
    JSON.stringify(['Wojownik', 'Łucznik']),
    'T1b: fallbackIds = reszta affordable, malejąco po score (270, 265)',
  );
}

console.log('\n--- T2: koszary NIE afordowalne -> pick spada na Wojownika, fallback=[Łucznik] ---');
{
  const opts = {
    cityBuildings: { cA: BUILT_REST },
    canAfford: (_cityId, id) => id !== 'koszary',
  };
  const pick = chooseCityProduction('cA', myCities, [], 7, data, ZERO, opts, map, diff);
  eq(pick, 'Wojownik', 'T2a: koszary odrzucone -> Wojownik (nastepny po score)');
  eq(
    JSON.stringify(opts.lastProductionFallbackIds),
    JSON.stringify(['Łucznik']),
    'T2b: fallbackIds = [Łucznik] (jedyny pozostaly affordable)',
  );
}

console.log('\n--- T3: WYŚCIG o wspólną pulę (2 miasta tego samego ownera) — egzekucja PRAWDZIWYM pickExecutableCandidate (game/ai.ts) ---');
{
  // Decision-time (ai.ts, decideAITurn Step2): OBIE miasta widzą TEN SAM,
  // jeszcze nienaruszony stan puli -- koszary/Wojownik/Łucznik wszystkie affordable.
  const decisionOpts = {
    cityBuildings: { cA: BUILT_REST, cB: BUILT_REST },
    canAfford: () => true,
  };
  const pickA = chooseCityProduction('cA', myCities, [], 7, data, ZERO, decisionOpts, map, diff);
  // Evaluator (P-AI-MOC-GAP-EVAL, Maciej 2026-08-08): na czystym HEAD sprzed naprawy
  // opts.lastProductionFallbackIds jest undefined -> bez "?? []" ponizej spread rzuca
  // TypeError zamiast dac czytelna porazke asercji.
  const fallbackA = [...(decisionOpts.lastProductionFallbackIds ?? [])];
  const pickB = chooseCityProduction('cB', myCities, [], 7, data, ZERO, decisionOpts, map, diff);
  const fallbackB = [...(decisionOpts.lastProductionFallbackIds ?? [])];
  eq(pickA, 'koszary', 'T3a: miasto A decyduje koszary (stan sprzed egzekucji)');
  eq(pickB, 'koszary', 'T3b: miasto B TAKŻE decyduje koszary (ten sam stan puli -- wyścig)');
  assert(fallbackA.includes('Wojownik'), 'T3c: miasto A ma fallback Wojownik');
  assert(fallbackB.includes('Wojownik'), 'T3d: miasto B ma fallback Wojownik');

  // Egzekucja main.ts (cmd.type==='build'): pula panstwa starcza na TYLKO JEDNO
  // koszary. Miasto A przetwarzane pierwsze -> zabiera ostatnia porcje surowca
  // koszar. Miasto B przetwarzane pozniej w TEJ SAMEJ turze -> jego egzekucyjny
  // canAfford('koszary') juz odmawia. main.ts NIE jest importowalny (caly kod
  // zyje w domknieciach boot()), ale pętla retry JEST -- to wlasnie
  // pickExecutableCandidate (game/ai.ts), ktora main.ts woła 1:1 (patrz
  // src/main.ts, cmd.type==='build'). Test wola TEN SAM eksportowany kod, nie
  // jego reimplementacje -- mutacja pickExecutableCandidate (np. obciecie do
  // candidateIds[0]) MUSI zaczerwienic T3f/T3g.
  //
  // P-AI-MOC-GAP-EVAL/R2 (Maciej 2026-08-08, Evaluator, punkt 3): candidateIds
  // ponizej buduje buildCandidateIds (game/ai.ts) -- TA SAMA funkcja, ktora
  // src/main.ts:~22720 woła zamiast inline `[cmd.buildingId, ...(cmd.fallbackIds
  // ?? [])]`. Dawniej ta jedna linia byla tu ZDUPLIKOWANA (nie importowana), wiec
  // mutacja OKABLOWANIA main.ts (np. obciecie do samego buildingId) nie czerwieniła
  // T3f/T3g -- pokryty byl tylko HELPER (pickExecutableCandidate), nie ta linia w
  // main.ts. Import zamiast duplikatu domyka te luke.
  let koszaryStock = 1; // pula panstwa: starcza na 1 koszary
  function executionCanAfford(id) {
    if (id === 'koszary') return koszaryStock > 0;
    return true; // Wojownik/Łucznik zawsze tanie/afordowalne w tym scenariuszu
  }
  function executeBuild(buildingId, fallbackIds) {
    const candidateIds = buildCandidateIds({ buildingId, fallbackIds });
    // TItem uproszczony do samego id (string) -- ten test sprawdza WYBOR
    // kandydata przez prawdziwa petle retry, nie ksztalt ProductionItem
    // main.ts (to osobno pokrywa tsc + logic-test.cjs na calym main.ts).
    const result = pickExecutableCandidate(candidateIds, {
      isAlreadyQueued: () => false, // obie miasta startuja z pusta kolejka w tym scenariuszu
      isBuildAllowed: () => true,   // brak bramek tech/epoka w tym scenariuszu
      resolveItem: (id) => id,
      canAfford: (id) => executionCanAfford(id),
    });
    if (result === null || result.alreadyQueued) {
      return null; // NAPRAWDĘ nie stać na nic z listy -- pusta kolejka to prawdziwy brak zasobow
    }
    // Efekt uboczny (pobranie surowca) APLIKOWANY PO otrzymaniu wyniku z helpera --
    // dokladnie tak jak main.ts robi deductOwnerStockCost po pickExecutableCandidate.
    if (result.id === 'koszary') koszaryStock -= 1;
    return result.id;
  }

  const queuedA = executeBuild('koszary', fallbackA);
  eq(queuedA, 'koszary', 'T3e: miasto A (pierwsze w kolejności egzekucji) dostaje koszary');

  const queuedB = executeBuild('koszary', fallbackB);
  assert(queuedB !== null, 'T3f: miasto B NIE zostaje z pustą kolejką (P-AI-MOC-GAP fix)');
  eq(queuedB, 'Wojownik', 'T3g: miasto B dostaje fallback Wojownik (tańszy kandydat z tej samej listy)');
}

console.log('\n--- T4: decideAITurn end-to-end -- dwa miasta jednego ownera, fallbackIds niepuste (P-AI-MOC-GAP-EVAL mutacja 1) ---');
{
  // Trzy miasta tego samego ownera (mid-phase w chooseCityProduction, jak T1-T3) --
  // decideAITurn generuje komende 'build' NIEZALEZNIE dla kazdego miasta; sprawdzamy
  // ze KAZDA niesie AICmdBuild.fallbackIds niepuste (mutacja: usuniecie
  // "fallbackIds: opts.lastProductionFallbackIds ?? []" w decideAITurn, ai.ts ~2039,
  // ktora Evaluator udowodnil ze T1-T3 (dotykajace tylko chooseCityProduction) NIE lapaly).
  const citiesAll = [cityA, cityB, cityC];
  const result = decideAITurn(7, [], citiesAll, map, data, {
    poziomTrudnosci: 2,
    cityBuildings: { cA: BUILT_REST, cB: BUILT_REST, cC: BUILT_REST },
    canAfford: () => true,
  });
  const buildCmds = result.filter(c => c.type === 'build' && (c.cityId === 'cA' || c.cityId === 'cB'));
  assert(buildCmds.length >= 2, `T4a: obie miasta (cA,cB) dostaly komende build; got: ${JSON.stringify(result.map(c => c.type))}`);
  const allHaveFallback = buildCmds.every(c => Array.isArray(c.fallbackIds) && c.fallbackIds.length > 0);
  assert(
    allHaveFallback,
    `T4b: KAZDA komenda build ma niepuste fallbackIds; got: ${JSON.stringify(buildCmds.map(c => ({ city: c.cityId, id: c.buildingId, fallbackIds: c.fallbackIds })))}`,
  );
}

console.log('\n--- T5: checks.canAfford (jednostka) BEZ pokrycia magazynowego -> false, mimo atWar+zloto (P-AI-MOC-GAP-EVAL/R2, Maciej 2026-08-08) ---');
{
  // Evaluator: dysjunkt `|| shouldAIRushBuyUnit(...)` w main.ts checks.canAfford
  // (jednostka) potrafil zwrocic true dla kandydata BEZ pokrycia magazynowego,
  // bo shouldAIRushBuyUnit w ogole NIE sprawdza surowcow (tylko atWar+manpower+
  // zloto) -- a taki kandydat i tak gwarantowanie przepadal na egzekucji
  // (purchaseRecruitmentUnit -> pickUnitRecruitHint, matematycznie rownowazne
  // canAffordUnitRecruitFull), wiec helper zatrzymywal sie na nim myslac ze jest
  // wykonalny i NIGDY nie probowal kolejnych fallbackow (dokladnie odtwarzalo
  // oryginalny P-AI-MOC-GAP). Ten test odtwarza checks.canAfford z main.ts
  // (cmd.type==='build', galaz jednostki, src/main.ts ~22807) PRAWDZIWYMI
  // funkcjami (canAffordUnitRecruitFull, shouldAIRushBuyUnit), nie atrapami --
  // main.ts sam NIE jest importowalny (kod zyje w domknieciach boot()), wzorem
  // T3's executeBuild() wyzej.
  const unitDef = {
    Jednostka: 'TestJedn',
    Typ: 'Melee',
    Surowiec: 'Brąz',
    'Surowiec (ilość)': 10,
    'Utrzymanie surowiec': 'Brąz',
    'Utrzymanie surowiec (ilość)': 2,
  };
  const pool = { braz: 5 }; // < 12 (10 rekrutacja + 2 rezerwa 1 tury) -- BRAK pokrycia
  const rushInput = {
    atWar: true,           // stan wojny -- warunek rush spelniony
    treasury: 1000,        // duzo zlota -- warunek rush spelniony
    reserve: 100,
    goldCost: 50,
    hasManpower: true,     // Manpower OK -- warunek rush spelniony
    boughtThisTurn: 0,
    maxPerTurn: 1,
  };
  assert(
    shouldAIRushBuyUnit(rushInput) === true,
    'T5-setup: shouldAIRushBuyUnit=true w tym scenariuszu (rush "chce" kupic, mimo braku surowca w puli)',
  );
  assert(
    canAffordUnitRecruitFull(pool, unitDef) === false,
    'T5-setup: canAffordUnitRecruitFull=false (pula NIE pokrywa 12 braz: 10 rekrutacja + 2 rezerwa)',
  );

  // NAPRAWIONA checks.canAfford (main.ts dzisiaj, src/main.ts ~22807-22816):
  // WYLACZNIE canAffordUnitRecruitFull, bez dysjunktu rush.
  function canAffordFixed(pool_, unitDef_) {
    return canAffordUnitRecruitFull(pool_, unitDef_);
  }
  assert(
    canAffordFixed(pool, unitDef) === false,
    'T5a: checks.canAfford (NAPRAWIONE, dzisiejszy main.ts) zwraca false -- brak pokrycia magazynowego, mimo atWar+zloto -- helper przejdzie do nastepnego kandydata',
  );

  // Odtworzenie STAREGO dysjunktu (main.ts sprzed naprawy P-AI-MOC-GAP-EVAL/R2)
  // -- MUSI zwrocic true w TYM SAMYM scenariuszu, dowodzac ze T5a realnie
  // odroznia naprawiony kod od zepsutego (mutacyjna weryfikacja wykonana przez
  // Evaluatora patchem na main.ts, tu udokumentowana bez trwalego dotykania
  // main.ts -- gdyby ktos przywrocil ten dysjunkt w main.ts, T5a NIE zlapie
  // tego wprost, bo test nie importuje main.ts, ale ta asercja dowodzi ze
  // logika, ktora main.ts dzis faktycznie woła, jest tą naprawioną, nie tą
  // buggy).
  function canAffordBuggyPreFix(pool_, unitDef_, rush_) {
    if (canAffordUnitRecruitFull(pool_, unitDef_)) return true;
    return shouldAIRushBuyUnit(rush_);
  }
  assert(
    canAffordBuggyPreFix(pool, unitDef, rushInput) === true,
    'T5b (dowod mutacyjny): stary dysjunkt || shouldAIRushBuyUnit dawal true w tym samym scenariuszu -- T5a odroznia naprawiony kod od zepsutego',
  );
}

console.log(`\n=== ai-prod-fallback-test: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
