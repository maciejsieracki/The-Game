'use strict';
/**
 * surow-civ-storage-test.cjs -- standalone Node test for SUROW-CIV-01
 * (decyzja Macieja 2026-07-24): magazyn surowcow = PULA PANSTWA (civ-wide, per
 * owner), nie per-miasto.
 *
 * Run from gra/:  node tools/surow-civ-storage-test.cjs
 *
 * Pokrywa:
 *   A. ownerResourceCapacityPerType / loadOwnerStorageParams (economy-upkeep.ts)
 *      -- cap = 100 + 100 x liczba Magazynow (addytywnie, NIE mnoznik).
 *   B. reconcileOwnerResourceCaps -- klamrowanie SUMY po miastach ownera,
 *      nadwyzka ginie z miast o NAJWIEKSZYM zapasie najpierw (deterministycznie).
 *   C. ownerResourceStock(All) / deductBuildingStockCostAcrossCities /
 *      creditOwnerResourceStock (building-stock-cost.ts).
 *   D. OWNERID-AGNOSTIC (twarda zasada Macieja 2026-07-24): dokladnie ten sam
 *      scenariusz (2 miasta, 1 Magazyn, nadprodukcja ponad cap) uruchomiony
 *      RAZEM dla gracza (ownerId=0) i cywilizacji AI (ownerId=2) w JEDNYM
 *      wywolaniu reconcileOwnerResourceCaps -- obaj dostaja cap 200 i obaj
 *      tracą nadwyzke identycznie (zero galezi "tylko gracz").
 *   E. Integracja pelna: advanceCityEconomy z prawdziwym Magazynem zbudowanym
 *      w jednym miescie AI (ownerId != 0) -- cap panstwa liczony poprawnie i
 *      suma City.surowce ownera nigdy nie przekracza go po turze.
 */

const fs   = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) { console.error('[surow-civ-storage-test] esbuild not found. Run: npm install (from gra/)'); process.exit(1); }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY_FILE  = path.resolve(__dirname, '.surow-civ-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.surow-civ-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export {
  DEFAULT_OWNER_STORAGE_PARAMS, loadOwnerStorageParams,
  ownerResourceCapacityPerType, reconcileOwnerResourceCaps,
} from '../src/game/economy-upkeep';
export {
  ownerResourceStock, ownerResourceStockAll,
  deductBuildingStockCostAcrossCities, creditOwnerResourceStock,
  canAffordBuildingStock,
} from '../src/game/building-stock-cost';
export { advanceCityEconomy, ownerResourceCap } from '../src/game/turn-economy';
export { foundCityAt, canFoundCity } from '../src/game/cities';
export { generateMap } from '../src/map/generator';
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
  console.error('[surow-civ-storage-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE_FILE);
const econParamsRaw = require('../data/econ-params.json');
const civs = require('../data/civs.json');
const societyParams = require('../data/society-params.json');
const buildings = require('../data/buildings.json');
const units = require('../data/units.json');
const tech = require('../data/tech.json');

let passed = 0, failed = 0;
function assert(cond, msg) { if (cond) { passed++; } else { failed++; console.error('FAIL:', msg); } }
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

// ===========================================================================
// A. Cap panstwa: baza + bonus x liczba Magazynow (addytywnie)
// ===========================================================================
console.log('\n-- A. ownerResourceCapacityPerType: 100 + 100/Magazyn (addytywnie) --');
const SP = M.DEFAULT_OWNER_STORAGE_PARAMS;
eq(SP.bazaSurowcePanstwo, 100, 'default: baza panstwa = 100');
eq(SP.bonusSurowceNaBudynek, 100, 'default: bonus/Magazyn = 100');
eq(M.ownerResourceCapacityPerType(0, SP), 100, '0 Magazynow -> cap 100');
eq(M.ownerResourceCapacityPerType(1, SP), 200, '1 Magazyn -> cap 200');
eq(M.ownerResourceCapacityPerType(2, SP), 300, '2 Magazyny -> cap 300 (addytywnie, NIE x2)');
eq(M.ownerResourceCapacityPerType(5, SP), 600, '5 Magazynow -> cap 600');
// nie mnoznik: 2 Magazyny musi byc 300, NIE 100*100*2=20000 ani 100*(1+2)=300 przypadkiem
// rownych -- kontrola jawna roznicujaca addytywny od hipotetycznego mnoznikowego x3:
assert(M.ownerResourceCapacityPerType(2, SP) !== SP.bazaSurowcePanstwo * 3 - 1, 'sanity addytywny (nie zbieg okolicznosci)');

// loadOwnerStorageParams: real econ-params.json (SUROW-CIV-01 wartosci wlasciciela)
const paramsNormal = M.loadOwnerStorageParams(econParamsRaw, 'normal');
eq(paramsNormal.bazaSurowcePanstwo, 100, 'econ-params.json normal: magazyn_baza_surowce = 100 (nowa semantyka PANSTWO)');
eq(paramsNormal.bonusSurowceNaBudynek, 100, 'econ-params.json normal: magazyn_bonus_surowce_na_budynek = 100');
const paramsEasy = M.loadOwnerStorageParams(econParamsRaw, 'easy');
eq(paramsEasy.bazaSurowcePanstwo, 100, 'econ-params.json easy: 100 (płaskie, decyzja Macieja 2026-07-24)');
const paramsHard = M.loadOwnerStorageParams(econParamsRaw, 'hard');
eq(paramsHard.bazaSurowcePanstwo, 100, 'econ-params.json hard: 100 (płaskie, decyzja Macieja 2026-07-24)');

// fallback gdy brak w JSON
eq(M.loadOwnerStorageParams({}, 'normal').bazaSurowcePanstwo, 100, 'load: brak JSON -> fallback 100');

// ===========================================================================
// B. reconcileOwnerResourceCaps: nadwyzka ginie z NAJWIEKSZEGO zapasu najpierw
// ===========================================================================
console.log('\n-- B. reconcileOwnerResourceCaps: klamrowanie sumy, deterministyczna kolejnosc --');
function makeCities(spec) {
  // spec: [{id, ownerId, surowce}]
  return spec.map(s => ({ id: s.id, ownerId: s.ownerId, surowce: { ...s.surowce } }));
}

{
  const cities = makeCities([
    { id: 'a', ownerId: 0, surowce: { drewno: 80 } },
    { id: 'b', ownerId: 0, surowce: { drewno: 50 } },
    { id: 'c', ownerId: 0, surowce: { drewno: 10 } },
  ]);
  // suma=140, cap=100 -> excess=40 -- bierze NAJPIERW z 'a' (80, najwiekszy)
  M.reconcileOwnerResourceCaps(cities, () => 100);
  const total = cities.reduce((s, c) => s + (c.surowce.drewno ?? 0), 0);
  eq(total, 100, 'suma po reconcile = cap (100)');
  eq(cities[0].surowce.drewno, 40, 'a (najwiekszy, 80) traci cala nadwyzke 40 -> 40');
  eq(cities[1].surowce.drewno, 50, 'b (50) niezmieniony (nadwyzka pokryta przez a)');
  eq(cities[2].surowce.drewno, 10, 'c (10) niezmieniony');
}

{
  // Remis: dwa miasta o tym samym zapasie -- tie-break po id rosnaco (bierze od 'a' przed 'z')
  const cities = makeCities([
    { id: 'z', ownerId: 0, surowce: { kamien: 60 } },
    { id: 'a', ownerId: 0, surowce: { kamien: 60 } },
  ]);
  // suma=120, cap=100 -> excess=20 -- remis 60/60, bierze od 'a' (id rosnaco) najpierw
  M.reconcileOwnerResourceCaps(cities, () => 100);
  const a = cities.find(c => c.id === 'a');
  const z = cities.find(c => c.id === 'z');
  eq(a.surowce.kamien, 40, 'remis: id "a" (rosnaco pierwszy) traci nadwyzke -> 40');
  eq(z.surowce.kamien, 60, 'remis: id "z" niezmieniony');
}

{
  // Suma <= cap -> zero zmian (no-op)
  const cities = makeCities([
    { id: 'a', ownerId: 0, surowce: { ruda: 30 } },
    { id: 'b', ownerId: 0, surowce: { ruda: 30 } },
  ]);
  M.reconcileOwnerResourceCaps(cities, () => 100);
  eq(cities[0].surowce.ruda, 30, 'suma (60) <= cap (100) -> a niezmieniony');
  eq(cities[1].surowce.ruda, 30, 'suma (60) <= cap (100) -> b niezmieniony');
}

// ===========================================================================
// D. OWNERID-AGNOSTIC (twarda zasada Macieja 2026-07-24): gracz i AI IDENTYCZNIE
// ===========================================================================
console.log('\n-- D. OWNERID-AGNOSTIC: gracz (ownerId=0) i AI (ownerId=2) traktowani identycznie --');
{
  // Dwa identyczne scenariusze (2 miasta, suma 140, cap 100) -- jeden dla gracza
  // (ownerId=0), jeden dla AI (ownerId=2) -- w JEDNYM wywolaniu reconcile.
  const cities = makeCities([
    { id: 'p1', ownerId: 0, surowce: { drewno: 80 } },
    { id: 'p2', ownerId: 0, surowce: { drewno: 60 } },
    { id: 'ai1', ownerId: 2, surowce: { drewno: 80 } },
    { id: 'ai2', ownerId: 2, surowce: { drewno: 60 } },
  ]);
  // capForOwner zwraca TA SAMA formule dla obu ownerow (0 Magazynow -> 100) --
  // brak jakiejkolwiek galezi "if (ownerId === 0)".
  M.reconcileOwnerResourceCaps(cities, (ownerId) => M.ownerResourceCapacityPerType(0, M.DEFAULT_OWNER_STORAGE_PARAMS));

  const playerTotal = cities.filter(c => c.ownerId === 0).reduce((s, c) => s + (c.surowce.drewno ?? 0), 0);
  const aiTotal = cities.filter(c => c.ownerId === 2).reduce((s, c) => s + (c.surowce.drewno ?? 0), 0);
  eq(playerTotal, 100, 'OWNERID-AGNOSTIC: gracz (ownerId=0) klamrowany do cap 100');
  eq(aiTotal, 100, 'OWNERID-AGNOSTIC: AI (ownerId=2, ownerId!=0) klamrowany do cap 100 TAK SAMO jak gracz');

  const ai1 = cities.find(c => c.id === 'ai1');
  const ai2 = cities.find(c => c.id === 'ai2');
  const p1 = cities.find(c => c.id === 'p1');
  const p2 = cities.find(c => c.id === 'p2');
  eq(ai1.surowce.drewno, p1.surowce.drewno, 'AI miasto o najwiekszym zapasie traci nadwyzke IDENTYCZNIE jak gracz (40 == 40)');
  eq(ai2.surowce.drewno, p2.surowce.drewno, 'AI drugie miasto niezmienione IDENTYCZNIE jak u gracza (60 == 60)');
  eq(ai1.surowce.drewno, 40, 'AI (ownerId!=0): miasto z 80 -> 40 po odjeciu nadwyzki');
}

// ===========================================================================
// C. ownerResourceStock(All) / deductBuildingStockCostAcrossCities / creditOwnerResourceStock
// ===========================================================================
console.log('\n-- C. Pula ownera: getter + pobor rozproszony + kredyt (dyplomacja/handel) --');
{
  const cities = makeCities([
    { id: 'x1', ownerId: 7, surowce: { glina: 5, drewno: 3 } },
    { id: 'x2', ownerId: 7, surowce: { glina: 9 } },
    { id: 'y1', ownerId: 8, surowce: { glina: 100 } }, // inny owner -- nie powinien wplywac
  ]);
  eq(M.ownerResourceStock(cities, 7, 'glina'), 14, 'ownerResourceStock: suma gliny ownera 7 = 5+9=14 (owner 8 pominiety)');
  const all = M.ownerResourceStockAll(cities, 7);
  eq(all.glina, 14, 'ownerResourceStockAll: glina=14');
  eq(all.drewno, 3, 'ownerResourceStockAll: drewno=3');

  // canAffordBuildingStock dziala na wyniku ownerResourceStockAll bez zmian (zero-modyfikacji API)
  assert(M.canAffordBuildingStock(all, { glina: 14 }), 'canAffordBuildingStock: pula ownera pokrywa dokladny koszt');
  assert(!M.canAffordBuildingStock(all, { glina: 15 }), 'canAffordBuildingStock: pula ownera NIE pokrywa kosztu > suma');

  // deduct: koszt glina:12 -- bierze NAJPIERW z x2 (9, mniejszy niz 12) -> bierze wszystko z x2 (9),
  // potem 3 z x1 (5) -> x1 zostaje 2, x2 zostaje 0
  M.deductBuildingStockCostAcrossCities(cities, 7, { glina: 12 });
  const x1 = cities.find(c => c.id === 'x1');
  const x2 = cities.find(c => c.id === 'x2');
  const y1 = cities.find(c => c.id === 'y1');
  eq(x2.surowce.glina, 0, 'deduct: x2 (najwiekszy zapas 9) oplacony jako pierwszy -> 0');
  eq(x1.surowce.glina, 2, 'deduct: reszta kosztu (12-9=3) z x1 (5) -> 2');
  eq(y1.surowce.glina, 100, 'deduct: inny owner (8) NIETKNIETY');

  // credit: dodaje do miasta o NAJMNIEJSZYM zapasie (x1=2 < x2=0 -- wiec x2 jako mniejszy)
  const added = M.creditOwnerResourceStock(cities, 7, 'glina', 5);
  eq(added, 5, 'credit: caly amount dodany (brak capu)');
  eq(x2.surowce.glina, 5, 'credit: trafia do miasta o najmniejszym zapasie (x2=0 -> 5)');
  eq(x1.surowce.glina, 2, 'credit: x1 (2, wiekszy niz x2 przed dodaniem) niezmieniony');

  // credit z capem: pula ownera 7 teraz = 2+5=7; cap=10 -> mozna dodac max 3
  const addedCapped = M.creditOwnerResourceStock(cities, 7, 'glina', 10, 10);
  eq(addedCapped, 3, 'credit z capem: przycina dodatek do wolnego miejsca (10-7=3, nie 10)');
  eq(M.ownerResourceStock(cities, 7, 'glina'), 10, 'credit z capem: suma po dodaniu = dokladnie cap');
}

// ===========================================================================
// E. Integracja pelna: advanceCityEconomy, Magazyn w miescie AI (ownerId != 0)
// ===========================================================================
console.log('\n-- E. advanceCityEconomy: cap panstwa + reconcile per owner (gracz I AI) --');
{
  const map = M.generateMap(40, 40, 9191, 'kontynenty');
  const data = { civs, econParams: econParamsRaw, societyParams, buildings, units, tech };

  function landHexes(n, minDist) {
    const all = [];
    for (const h of Object.values(map.hexes)) {
      const c = { q: h.coords.q, r: h.coords.r };
      if (M.canFoundCity(c.q, c.r, [], map).ok) all.push(c);
    }
    const picked = [];
    for (const c of all) {
      if (picked.every(p => (Math.abs(c.q - p.q) + Math.abs(c.q + c.r - p.q - p.r) + Math.abs(c.r - p.r)) / 2 >= minDist)) {
        picked.push(c);
        if (picked.length >= n) break;
      }
    }
    return picked;
  }

  const spots = landHexes(4, 6);
  if (spots.length < 4) {
    console.error('FAIL: brak wystarczajaco lądu do zalozenia 4 miast testowych');
    process.exit(1);
  }

  const cities = [];
  // Gracz (ownerId=0): 2 miasta, jedno z Magazynem.
  const p1 = M.foundCityAt(spots[0].q, spots[0].r, 0, cities, map, 'Player1'); cities.push(p1);
  const p2 = M.foundCityAt(spots[1].q, spots[1].r, 0, cities, map, 'Player2'); cities.push(p2);
  // AI (ownerId=2): 2 miasta, jedno z Magazynem -- IDENTYCZNY setup jak gracza.
  const ai1 = M.foundCityAt(spots[2].q, spots[2].r, 2, cities, map, 'AI1'); cities.push(ai1);
  const ai2 = M.foundCityAt(spots[3].q, spots[3].r, 2, cities, map, 'AI2'); cities.push(ai2);

  // Zasilamy magazyny recznie PRZED tura, ponad cap (100 + 100x1 magazyn = 200),
  // zeby sprawdzic reconcile bez zaleznosci od tempa produkcji terenu.
  p1.surowce = { drewno: 260 };
  p2.surowce = { drewno: 0 };
  ai1.surowce = { drewno: 260 };
  ai2.surowce = { drewno: 0 };

  const builtByCity = new Map([
    [p1.id, ['magazyn']],
    [p2.id, []],
    [ai1.id, ['magazyn']],
    [ai2.id, []],
  ]);

  const econ = M.advanceCityEconomy(
    cities, map, data, 'normal', [], new Map(), builtByCity, 1, new Set(), new Map(), new Map(),
  );
  assert(!!econ, 'advanceCityEconomy nie rzuca wyjatku z Magazynem w miescie AI');

  const playerTotal = cities.filter(c => c.ownerId === 0).reduce((s, c) => s + (c.surowce.drewno ?? 0), 0);
  const aiTotal = cities.filter(c => c.ownerId === 2).reduce((s, c) => s + (c.surowce.drewno ?? 0), 0);
  const expectedCap = M.ownerResourceCap(cities, builtByCity, 0, data, 'normal');
  eq(expectedCap, 200, 'cap panstwa (1 Magazyn, normal): 100 + 100x1 = 200');
  const expectedCapAi = M.ownerResourceCap(cities, builtByCity, 2, data, 'normal');
  eq(expectedCapAi, 200, 'OWNERID-AGNOSTIC: cap panstwa AI (ownerId=2, 1 Magazyn) TAKI SAM jak gracza = 200');
  assert(playerTotal <= expectedCap, `gracz: suma drewna (${playerTotal}) <= cap panstwa (${expectedCap}) po turze`);
  assert(aiTotal <= expectedCapAi, `AI (ownerId=2): suma drewna (${aiTotal}) <= cap panstwa (${expectedCapAi}) po turze -- MAGAZYNY DZIALAJA DLA AI`);
  assert(aiTotal > 0, 'AI zachowuje surowiec do capu (nie zeruje wszystkiego -- reconcile tylko tnie nadwyzke)');
}

// --- summary ---------------------------------------------------------------
console.log(`\nsurow-civ-storage-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY_FILE);  } catch (e) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}
process.exit(failed ? 1 : 0);
