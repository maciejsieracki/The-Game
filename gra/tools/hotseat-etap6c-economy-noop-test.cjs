'use strict';
/**
 * hotseat-etap6c-economy-noop-test.cjs — bramka R-HOTSEAT-ETAP6C-ECONOMY-Q1.
 *
 * Dwie części:
 *
 * CZĘŚĆ A (importy REALNE, esbuild): dla `game/difficulty-cost.ts`, `game/empire-food.ts`,
 * `game/society-inputs.ts`, `game/turn-economy.ts` — funkcje migrowane w tej rundzie mają
 * teraz opcjonalny parametr `humanOwnerIds`/`ownerId` z domyślną wartością `[0]`/`0`.
 * Dowodzi: (1) wołanie BEZ nowego parametru daje WYNIK IDENTYCZNY jak literał `ownerId===0`
 * sprzed tej rundy (no-op dla dzisiejszego jedynego stanu gry); (2) wołanie Z drugim
 * fotelem człowieka (`humanOwnerIds=[0,1]`, `ownerId=1`) traktuje go TAK SAMO jak dawny
 * kod traktował `ownerId=0` — realna migracja, nie kosmetyka.
 *
 * CZĘŚĆ B (PRZED/PO, wzorem hotseat-etap3-akcesory-test.cjs): bramki logiczne main.ts
 * wewnątrz `runWorldEndTurn()` nieeksportowane z main.ts (Klastry A/C/D/E/F + rebelia) —
 * odtwarza dosłownie kod SPRZED tej rundy (`ownerId === 0`) i PO (`isHuman(ownerId)`),
 * porównuje na pełnej domenie [0, AI dodatnie, barbarzyńca, rebeliant] i (dla Klastra A)
 * dowodzi, że pętla po `humanOwnerIds` bankuje KAŻDEGO człowieka, nie tylko fotel 0.
 *
 * Run: node tools/hotseat-etap6c-economy-noop-test.cjs (z katalogu gra/)
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[hotseat-etap6c-economy-noop-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const ENTRY_FILE = path.resolve(__dirname, '.hotseat-etap6c-economy-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.hotseat-etap6c-economy-bundle.cjs');

const ENTRY_TS = `
export {
  isPlayerOwner, getCostMultiplierForOwner, applyDifficultyCostMultiplier,
  scaledResearchCost, getPopulationGrowthDifficultyMultiplier,
} from '../src/game/difficulty-cost';
export {
  isCityAutoWyzywienieEnabled, maxSafePoziomRacjiForCity, computeEmpireCityFoodNadwyzka,
} from '../src/game/empire-food';
export { isPlayerCapitalCity } from '../src/game/society-inputs';
export { sumEconomyForPlayerCities, recomputeCityFoodBalancesInEcon } from '../src/game/turn-economy';
export { HUMAN_OWNER_PRIMARY, isHumanOwner } from '../src/game/human-owners';
export { BARBARIAN_OWNER_ID } from '../src/game/barbarians';
export { REBEL_FACTION_OWNER_ID } from '../src/game/society-breakdown';
`;

fs.writeFileSync(ENTRY_FILE, ENTRY_TS);

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: BUNDLE_FILE,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[hotseat-etap6c-economy-noop-test] esbuild bundle failed:', e.message || e);
  process.exit(1);
} finally {
  try { fs.unlinkSync(ENTRY_FILE); } catch { /* best-effort */ }
}

let mod;
try {
  delete require.cache[require.resolve(BUNDLE_FILE)];
  mod = require(BUNDLE_FILE);
} catch (e) {
  console.error('[hotseat-etap6c-economy-noop-test] require bundle failed:', e.message || e);
  process.exit(1);
} finally {
  try { fs.unlinkSync(BUNDLE_FILE); } catch { /* best-effort */ }
}

const {
  isPlayerOwner, getCostMultiplierForOwner, applyDifficultyCostMultiplier,
  scaledResearchCost, getPopulationGrowthDifficultyMultiplier,
  isCityAutoWyzywienieEnabled, maxSafePoziomRacjiForCity, computeEmpireCityFoodNadwyzka,
  isPlayerCapitalCity, sumEconomyForPlayerCities, recomputeCityFoodBalancesInEcon,
  HUMAN_OWNER_PRIMARY, isHumanOwner, BARBARIAN_OWNER_ID, REBEL_FACTION_OWNER_ID,
} = mod;

const RATION_PARAMS_A6 = {
  racjeZywnosc1: 2, racjeZywnosc2: 4, racjeZywnosc3: 6,
  racjeWzrostProc1: 3, racjeWzrostProc2: 5, racjeWzrostProc3: 7,
};
/** Wzorem `auto-wyzywienie-flow-balance-test.cjs` (C3): econ.perCity dla jednego miasta,
 *  kosztRacji przeliczony z bieżącego `poziomRacji` przez `recomputeCityFoodBalancesInEcon`. */
function buildEconForCityA6(city, zywnoscBrutto) {
  const econ = {
    perCity: [{
      cityId: city.id, ownerId: city.ownerId, oblegany: false,
      zywnoscBrutto, kosztRacji: 0, bilansLokalny: 0,
    }],
  };
  recomputeCityFoodBalancesInEcon(econ.perCity, [city], RATION_PARAMS_A6);
  return econ;
}

let pass = 0;
let fail = 0;
function assertEq(actual, expected, label) {
  const a = actual instanceof Set ? [...actual].sort().join(',') : JSON.stringify(actual);
  const e = expected instanceof Set ? [...expected].sort().join(',') : JSON.stringify(expected);
  if (a === e) {
    pass++;
  } else {
    fail++;
    console.error(`FAIL: ${label} -- oczekiwano ${e}, otrzymano ${a}`);
  }
}
function assertTrue(cond, label) {
  if (cond) pass++;
  else { fail++; console.error(`FAIL: ${label}`); }
}

const AI_IDS = [1, 2, 42];
const ALL_IDS = [0, ...AI_IDS];
const FULL_DOMAIN = [0, ...AI_IDS, BARBARIAN_OWNER_ID, REBEL_FACTION_OWNER_ID];

// =====================================================================
// CZĘŚĆ A -- importy realne z game/*.ts
// =====================================================================

// A1) isPlayerOwner: domyślnie [0] == stary literał ownerId===0
for (const id of ALL_IDS) {
  assertEq(isPlayerOwner(id), id === 0, `isPlayerOwner(${id}) domyślny [0] === (id===0)`);
}
// A1b) isPlayerOwner z drugim fotelem człowieka: ownerId=1 traktowany jak dawny "gracz"
assertEq(isPlayerOwner(1, [0, 1]), true, 'isPlayerOwner(1,[0,1]) drugi fotel człowieka -> true');
assertEq(isPlayerOwner(0, [0, 1]), true, 'isPlayerOwner(0,[0,1]) pierwszy fotel -> true');
assertEq(isPlayerOwner(2, [0, 1]), false, 'isPlayerOwner(2,[0,1]) AI -> false');

// A2) getCostMultiplierForOwner / applyDifficultyCostMultiplier -- no-op domyślny
for (const diff of ['easy', 'normal', 'hard']) {
  for (const id of ALL_IDS) {
    const before = diff === 'normal' ? 1 : (diff === 'easy' ? (id === 0 ? 1 : 2) : (id === 0 ? 2 : 1));
    assertEq(getCostMultiplierForOwner(id, diff), before, `getCostMultiplierForOwner(${id},${diff}) no-op`);
  }
}
assertEq(applyDifficultyCostMultiplier(100, 0, 'hard'), 200, 'applyDifficultyCostMultiplier(100,0,hard) no-op');
assertEq(applyDifficultyCostMultiplier(100, 1, 'hard'), 100, 'applyDifficultyCostMultiplier(100,1,hard) no-op');
// A2b) drugi fotel człowieka pod 'hard': traktowany jak gracz (x2), nie jak AI (x1)
assertEq(applyDifficultyCostMultiplier(100, 1, 'hard', [0, 1]), 200, 'applyDifficultyCostMultiplier(100,1,hard,[0,1]) drugi fotel jak gracz');

// A3) scaledResearchCost -- no-op domyślny (porównanie względne: gracz==gracz, AI==AI)
assertEq(scaledResearchCost(50, 1, 0, 'hard'), scaledResearchCost(50, 1, HUMAN_OWNER_PRIMARY, 'hard'), 'scaledResearchCost(0)===scaledResearchCost(HUMAN_OWNER_PRIMARY)');

// A4) getPopulationGrowthDifficultyMultiplier -- no-op domyślny
for (const id of ALL_IDS) {
  const before = id === 0 ? 2 : 0.5;
  assertEq(getPopulationGrowthDifficultyMultiplier(id, 'hard'), before, `getPopulationGrowthDifficultyMultiplier(${id},hard) no-op`);
}

// A5) isCityAutoWyzywienieEnabled -- no-op domyślny + drugi fotel człowieka
{
  const cityPlayer = { ownerId: 0, autoWyzywienie: false };
  const cityAi = { ownerId: 5, autoWyzywienie: false };
  const citySecondHuman = { ownerId: 1, autoWyzywienie: false };
  assertEq(isCityAutoWyzywienieEnabled(cityPlayer), false, 'isCityAutoWyzywienieEnabled(gracz,flaga=false) no-op -> false');
  assertEq(isCityAutoWyzywienieEnabled(cityAi), true, 'isCityAutoWyzywienieEnabled(AI) no-op -> true (zawsze)');
  assertEq(isCityAutoWyzywienieEnabled(citySecondHuman), true, 'isCityAutoWyzywienieEnabled(ownerId=1) BEZ humanOwnerIds -> true (traktowany jak AI, domyślne [0])');
  assertEq(isCityAutoWyzywienieEnabled(citySecondHuman, undefined, [0, 1]), false, 'isCityAutoWyzywienieEnabled(ownerId=1,[0,1]) drugi fotel -> jak gracz (flaga=false)');
}

// A6) maxSafePoziomRacjiForCity -- ZARZUT #3 Evaluatora (runda 1): asercja A6 była
// tautologiczna (`typeof fn==='function'`), bez wywołania z różnymi humanOwnerIds. Naprawa:
// odtwarza wprost scenariusz C3 z `auto-wyzywienie-flow-balance-test.cjs` (backstop gracza:
// zapasyPrzed=5 pokryłby stock-based krok do 2,5, ale flow-based zatrzymuje na 2), ale dla
// OWNERID=1 (drugi fotel człowieka) -- dowodzi, że `requireFlowBalance` faktycznie zależy od
// `humanOwnerIds` przekazanego do TEJ SAMEJ funkcji, nie od zaszytego `ownerId===0`:
//  * BEZ `humanOwnerIds` (domyślne [0]) -- ownerId=1 traktowany jak AI -> stock-based ->
//    maxSafe=3 (rezerwa=5 pokrywa deficyt -4 na poziomie 3; przy 3,5 deficyt -6 już nie).
//  * Z `humanOwnerIds=[0,1]` -- ownerId=1 traktowany jak człowiek -> flow-based -> maxSafe=2
//    (dokładnie ta sama wartość co backstop gracza w C3 dla identycznej ekonomii miasta --
//    poziom 2 to ostatni z nadwyzka>=0 SAMEJ tury, rezerwa się nie liczy).
{
  const cityAiTreated = { id: 'c6', ownerId: 1, name: 'A6-stock', population: 2, poziomRacji: 2, rationMigratedV114: true };
  const econAiTreated = buildEconForCityA6(cityAiTreated, 8);
  const maxSafeStock = maxSafePoziomRacjiForCity({
    cityId: 'c6', ownerId: 1, cities: [cityAiTreated], econ: econAiTreated, zapasyPrzed: 5,
    rationParams: RATION_PARAMS_A6,
    // humanOwnerIds pominięte -> domyślne [0] -> ownerId=1 NIE jest w humanOwnerIds.
  });
  assertEq(maxSafeStock, 3, 'A6 maxSafePoziomRacjiForCity(ownerId=1) BEZ humanOwnerIds -> stock-based (jak AI), maxSafe=3');

  const cityHumanTreated = { id: 'c7', ownerId: 1, name: 'A6-flow', population: 2, poziomRacji: 2, rationMigratedV114: true };
  const econHumanTreated = buildEconForCityA6(cityHumanTreated, 8);
  const maxSafeFlow = maxSafePoziomRacjiForCity({
    cityId: 'c7', ownerId: 1, cities: [cityHumanTreated], econ: econHumanTreated, zapasyPrzed: 5,
    rationParams: RATION_PARAMS_A6, humanOwnerIds: [0, 1],
  });
  assertEq(maxSafeFlow, 2, 'A6 maxSafePoziomRacjiForCity(ownerId=1,humanOwnerIds=[0,1]) -> flow-based (jak gracz), maxSafe=2 (NIE 3)');
  assertTrue(maxSafeStock !== maxSafeFlow, 'A6: requireFlowBalance faktycznie różnicuje wynik dla TEGO SAMEGO ownerId=1 wg humanOwnerIds -- realna migracja, nie kosmetyka');
}

// A7) isPlayerCapitalCity -- no-op domyślny + poprawka main.ts (filtr po WŁAŚCICIELU miasta)
{
  const capital = { id: 'cap', ownerId: 0 };
  const other = { id: 'other', ownerId: 0 };
  const aiCity = { id: 'ai1', ownerId: 3 };
  const allCities = [capital, other, aiCity];
  assertEq(isPlayerCapitalCity(aiCity, allCities, undefined), false, 'isPlayerCapitalCity(AI) no-op -> false');
  assertEq(isPlayerCapitalCity(capital, allCities, 'cap'), true, 'isPlayerCapitalCity(gracz,designated) no-op -> true');
  // drugi fotel człowieka: designated capital rozpoznana tylko z humanOwnerIds
  const secondHumanCapital = { id: 'h2cap', ownerId: 1 };
  assertEq(isPlayerCapitalCity(secondHumanCapital, [...allCities, secondHumanCapital], 'h2cap'), false, 'isPlayerCapitalCity(ownerId=1) BEZ humanOwnerIds -> false (domyślne [0])');
  assertEq(isPlayerCapitalCity(secondHumanCapital, [...allCities, secondHumanCapital], 'h2cap', [0, 1]), true, 'isPlayerCapitalCity(ownerId=1,[0,1]) drugi fotel -> true');
}

// A8) sumEconomyForPlayerCities -- no-op domyślny (ownerId=0) + drugi fotel realnie sumowany osobno
{
  const cities = [{ id: 'c1', ownerId: 0 }, { id: 'c2', ownerId: 1 }, { id: 'c3', ownerId: 5 }];
  const perCityMk = (id, ownerId, pieniadz) => ({ cityId: id, ownerId, pieniadz, nauka: 0, doPuli: 0, praca: 0, kultura: 0, pieniadzZTras: 0 });
  const result = { perCity: [perCityMk('c1', 0, 10), perCityMk('c2', 1, 20), perCityMk('c3', 5, 30)] };
  assertEq(sumEconomyForPlayerCities(result, cities).pieniadz, 10, 'sumEconomyForPlayerCities(no param) no-op -> tylko ownerId 0');
  assertEq(sumEconomyForPlayerCities(result, cities, 0).pieniadz, 10, 'sumEconomyForPlayerCities(...,0) === no-op');
  assertEq(sumEconomyForPlayerCities(result, cities, 1).pieniadz, 20, 'sumEconomyForPlayerCities(...,1) drugi fotel liczony OSOBNO, nie miesza się z 0');
}

// =====================================================================
// CZĘŚĆ B -- PRZED/PO dla bramek main.ts nieeksportowanych (Klastry D/E/F + rebelia)
// =====================================================================
const isHuman = (ownerId) => isHumanOwner({ humanOwnerIds: [HUMAN_OWNER_PRIMARY], activeHumanOwnerId: HUMAN_OWNER_PRIMARY }, ownerId);

// B1) Klaster D -- 4 gate'y auto-racji (main.ts:29258/29264/29282/29283): ownerId===0 -> isHuman(ownerId)
for (const id of FULL_DOMAIN) {
  assertEq(isHuman(id), id === 0, `Klaster D gate ownerId=${id}: isHuman===(ownerId===0)`);
}

// B2) Klaster E -- wyrąb lasu (main.ts:~29448): st.ownerId!==0 (continue) -> !isHuman(st.ownerId)
for (const id of FULL_DOMAIN) {
  const before = id !== 0; // stary warunek "continue" (pomiń)
  const after = !isHuman(id);
  assertEq(after, before, `Klaster E continue-guard ownerId=${id}: !isHuman===(ownerId!==0)`);
}

// B3) Klaster F -- auto-ulepszenia (main.ts:~30652): c.ownerId!==0 (return false) -> !isHuman(c.ownerId)
for (const id of FULL_DOMAIN) {
  const before = id !== 0;
  const after = !isHuman(id);
  assertEq(after, before, `Klaster F filter-guard ownerId=${id}: !isHuman===(ownerId!==0)`);
}

// B4) Rebelia (main.ts:~30244): city.ownerId===0 -> isHuman(city.ownerId)
for (const id of FULL_DOMAIN) {
  assertEq(isHuman(id), id === 0, `Rebelia gate ownerId=${id}: isHuman===(ownerId===0)`);
}

// B5) Klaster A -- bank treasury: dowód, że pętla po humanOwnerIds bankuje KAŻDEGO człowieka
// (PRZED: hardcoded na jeden globalny `player`, drugi fotel człowieka NIGDY nie bankowany;
//  PO: playerStateByHuman.get(hOid), każdy fotel dostaje WŁASNY przyrost).
{
  function freshStateB5() {
    return {
      player: { skarbiec: 100, nauka: 50 },
      playerStateByHuman: new Map([[0, { skarbiec: 100, nauka: 50 }], [1, { skarbiec: 200, nauka: 20 }]]),
      econByOwner: new Map([[0, { pieniadz: 10, nauka: 5 }], [1, { pieniadz: 30, nauka: 7 }]]),
    };
  }
  // PRZED (main.ts sprzed tej rundy): tylko `player` (== fotel 0) bankowany, fotel 1 pomijany.
  function bankBefore(s) {
    const e0 = s.econByOwner.get(0);
    s.player.skarbiec += e0.pieniadz;
    s.player.nauka += e0.nauka;
  }
  // PO (main.ts po tej rundzie): pętla po humanOwnerIds=[0,1].
  function bankAfter(s, humanOwnerIds) {
    for (const hOid of humanOwnerIds) {
      const e = s.econByOwner.get(hOid);
      const st = s.playerStateByHuman.get(hOid);
      st.skarbiec += e.pieniadz;
      st.nauka += e.nauka;
    }
  }
  // Single-human no-op: humanOwnerIds=[0] -> PO daje TEN SAM wynik dla fotela 0 co PRZED dla `player`.
  const sB = freshStateB5(); bankBefore(sB);
  const sA = freshStateB5(); bankAfter(sA, [0]);
  assertEq(sA.playerStateByHuman.get(0).skarbiec, sB.player.skarbiec, 'Klaster A no-op: skarbiec fotela 0 PRZED===PO przy humanOwnerIds=[0]');
  assertEq(sA.playerStateByHuman.get(0).nauka, sB.player.nauka, 'Klaster A no-op: nauka fotela 0 PRZED===PO przy humanOwnerIds=[0]');
  // Drugi fotel: PRZED nigdy nie bankowany (luka), PO -- bankowany poprawnie.
  const sA2 = freshStateB5(); bankAfter(sA2, [0, 1]);
  assertEq(sA2.playerStateByHuman.get(1).skarbiec, 230, 'Klaster A naprawa: fotel 1 zbankowany (200+30) przy humanOwnerIds=[0,1]');
  assertEq(sA2.playerStateByHuman.get(1).nauka, 27, 'Klaster A naprawa: nauka fotela 1 zbankowana (20+7)');
  assertEq(sA2.playerStateByHuman.get(0).skarbiec, 110, 'Klaster A: fotel 0 nadal bankowany poprawnie obok fotela 1');
}

console.log(`hotseat-etap6c-economy-noop-test: ${pass} PASS, ${fail} FAIL`);
process.exit(fail === 0 ? 0 : 1);
