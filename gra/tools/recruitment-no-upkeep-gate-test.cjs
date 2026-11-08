'use strict';
/**
 * recruitment-no-upkeep-gate-test.cjs — R-REKRUTACJA-SUROWIEC-BEZ-UPKEEP-Q1 (2026-08-26)
 *
 * KONTRAKT PINOWANY: bramka rekrutacji sprawdza WYŁĄCZNIE jednorazowy koszt zakupu
 * (`unitStockCost`). Utrzymanie NIE blokuje zakupu — jest pobierane dopiero w NASTĘPNEJ
 * turze, przez prawdziwy tick ekonomii, wraz z istniejącą konsekwencją niedoboru.
 * WYCOFUJE R-AI-RECRUIT-UPKEEP-GATE (2026-08-06).
 *
 * Dane: kanoniczne `data/units.json` (Wojownik = 50 Drewna, utrzymanie 10 Drewna/turę)
 * — dokładnie scenariusz ze zrzutu właściciela.
 *
 * Run from gra/:  node tools/recruitment-no-upkeep-gate-test.cjs
 */

const fs   = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch (e) {
    console.error('[recruitment-no-upkeep-gate-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA    = path.resolve(__dirname, '..');
const ENTRY  = path.join(__dirname, '.recruitment-no-upkeep-entry.ts');
const BUNDLE = path.join(__dirname, '.recruitment-no-upkeep-bundle.cjs');

fs.writeFileSync(ENTRY, `
export * as EU from '../src/game/economy-upkeep';
export {
  unitStockCost,
  canAffordBuildingStock,
  missingStockFor,
  ownerResourceStockAll,
  deductBuildingStockCostAcrossCities,
} from '../src/game/building-stock-cost';
export { advanceCityEconomy } from '../src/game/turn-economy';
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
    target: 'node18', loader: { '.ts': 'ts', '.json': 'json' },
    outfile: BUNDLE, absWorkingDir: GRA, logLevel: 'silent',
  });
} catch (e) {
  console.error('[recruitment-no-upkeep-gate-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const M  = require(BUNDLE);
const EU = M.EU;

const econParams    = require('../data/econ-params.json');
const civs          = require('../data/civs.json');
const societyParams = require('../data/society-params.json');
const buildings     = require('../data/buildings.json');
const units         = require('../data/units.json');
const tech          = require('../data/tech.json');
const DATA = { civs, econParams, societyParams, buildings, units, tech };

let passed = 0, failed = 0;
function assert(cond, msg) { if (cond) { passed++; } else { failed++; console.error('FAIL:', msg); } }
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }
function deepEq(a, b, msg) {
  const norm = o => JSON.stringify(Object.fromEntries(Object.entries(o || {}).sort()));
  assert(norm(a) === norm(b), `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`);
}
function findUnit(name) {
  const u = units.find(x => x.Jednostka === name);
  if (!u) throw new Error(`units.json: brak jednostki "${name}"`);
  return u;
}
function makeCities(spec) {
  return spec.map(s => ({ id: s.id, ownerId: s.ownerId, surowce: { ...(s.surowce ?? {}) } }));
}

const WOJOWNIK = findUnit('Wojownik');

// ---------------------------------------------------------------------------
console.log('\n-- A0: dane kanoniczne zgodne ze zrzutem właściciela --');
deepEq(M.unitStockCost(WOJOWNIK), { drewno: 50 }, 'A0a: Wojownik koszt zakupu = 50 Drewna');
deepEq(EU.unitResourceUpkeep(WOJOWNIK), { drewno: 10 }, 'A0b: Wojownik utrzymanie = 10 Drewna/turę');

// ---------------------------------------------------------------------------
console.log('\n-- A1: SCENARIUSZ WŁAŚCICIELA — pula 57 Drewna, koszt 50, utrzymanie 10/t --');
{
  const cities = makeCities([{ id: 'm1', ownerId: 0, surowce: { drewno: 57 } }]);
  const pool = M.ownerResourceStockAll(cities, 0);
  eq(pool.drewno, 57, 'A1-setup: pula państwa = 57 Drewna');
  assert(
    EU.canAffordUnitRecruitStock(pool, WOJOWNIK) === true,
    'A1 (SCENARIUSZ ZE ZRZUTU): 57 Drewna, Wojownik 50 + utrzymanie 10/t -> REKRUTACJA PRZECHODZI',
  );
  assert(
    EU.pickUnitRecruitHint(pool, WOJOWNIK) === null,
    'A1b: brak komunikatu odmowy przy 57 Drewna (utrzymanie nie jest powodem odmowy)',
  );
  assert(
    EU.isUnitRecruitStockChipMissing(pool, WOJOWNIK, 'drewno') === false,
    'A1c: chip Drewna NIE czerwony przy 57 Drewna (kryterium 2 dispatchu)',
  );
  // Wartość graniczna: dokładnie koszt zakupu, zero zapasu na utrzymanie.
  assert(
    EU.canAffordUnitRecruitStock({ drewno: 50 }, WOJOWNIK) === true,
    'A1d: pula = dokładnie 50 Drewna (0 zapasu na utrzymanie) -> rekrutacja przechodzi',
  );
}

// ---------------------------------------------------------------------------
console.log('\n-- A2: ODWROTNIE — bramka kosztu NIE rozbraja się (pula 49 < koszt 50) --');
{
  const cities = makeCities([{ id: 'm1', ownerId: 0, surowce: { drewno: 49 } }]);
  const pool = M.ownerResourceStockAll(cities, 0);
  assert(
    EU.canAffordUnitRecruitStock(pool, WOJOWNIK) === false,
    'A2: 49 Drewna, koszt 50 -> rekrutacja NADAL ZABLOKOWANA',
  );
  assert(
    EU.pickUnitRecruitHint(pool, WOJOWNIK) === EU.UNIT_RECRUIT_STOCK_ONLY_HINT,
    'A2b: komunikat odmowy = brak jednorazowego kosztu w magazynie',
  );
  assert(
    EU.isUnitRecruitStockChipMissing(pool, WOJOWNIK, 'drewno') === true,
    'A2c: chip Drewna czerwony przy 49 Drewna (brak kosztu zakupu)',
  );
  assert(
    EU.pickUnitRecruitHint(pool, WOJOWNIK) !== null
    && !/utrzyman/i.test(EU.pickUnitRecruitHint(pool, WOJOWNIK)),
    'A2d: komunikat odmowy nie wspomina utrzymania',
  );
}

// ---------------------------------------------------------------------------
console.log('\n-- A3: UTRZYMANIE DALEJ POBIERANE W NASTĘPNEJ TURZE (prawdziwy tick) --');
{
  // Krok 1: rekrutacja przy 57 Drewna — pobór jednorazowego kosztu z puli państwa
  // dokładnie tą samą funkcją, której używa silnik.
  const cities = makeCities([{ id: 'm1', ownerId: 0, surowce: { drewno: 57 } }]);
  assert(EU.canAffordUnitRecruitStock(M.ownerResourceStockAll(cities, 0), WOJOWNIK), 'A3-setup: rekrutacja dozwolona przy 57');
  M.deductBuildingStockCostAcrossCities(cities, 0, M.unitStockCost(WOJOWNIK));
  eq(M.ownerResourceStockAll(cities, 0).drewno, 7, 'A3a: po rekrutacji 57 - 50 = 7 Drewna w puli');

  // Krok 2: NASTĘPNA TURA — prawdziwy tick ekonomii liczy utrzymanie zrekrutowanej jednostki.
  const map = { hexes: {} };
  const econUnits = [{ ownerId: 0, typeId: 'Wojownik', camping: false }];
  const tickCities = [{
    id: 'm1', ownerId: 0, q: 0, r: 0, name: 'Testowo',
    population: 1, magazynZywnosci: 10, surowce: { drewno: 7 },
  }];
  const econ = M.advanceCityEconomy(tickCities, map, DATA, 'normal', econUnits, new Map(), new Map());
  deepEq(
    econ.resourceUpkeepUnitsByOwner.get(0),
    { drewno: 10 },
    'A3b: tick ekonomii NASTĘPNEJ tury nalicza utrzymanie 10 Drewna za zrekrutowaną jednostkę',
  );

  // Kontrola przeciwna: bez jednostki tick nie nalicza nic (dowód, że A3b mierzy jednostkę).
  const econNoUnits = M.advanceCityEconomy(
    [{ id: 'm1', ownerId: 0, q: 0, r: 0, name: 'Testowo', population: 1, magazynZywnosci: 10, surowce: { drewno: 7 } }],
    map, DATA, 'normal', [], new Map(), new Map(),
  );
  deepEq(econNoUnits.resourceUpkeepUnitsByOwner.get(0), {}, 'A3c: bez jednostek tick nalicza {} (kontrola przeciwna)');

  // Krok 3: pobór + KONSEKWENCJA NIEDOBORU — dokładnie kompozycja z main.ts (~:26107-26120):
  // missingStockFor(poolBefore, resUpkeep) -> ostrzeżenie; deduct nie schodzi poniżej 0.
  const resUpkeep = econ.resourceUpkeepByOwner.get(0);
  const shortCities = makeCities([{ id: 'm1', ownerId: 0, surowce: { drewno: 7 } }]);
  const poolBefore = M.ownerResourceStockAll(shortCities, 0);
  const missing = M.missingStockFor(poolBefore, resUpkeep);
  deepEq(missing, { drewno: 3 }, 'A3d: NIEDOBÓR wykryty — brakuje 3 Drewna na utrzymanie (7 < 10)');
  M.deductBuildingStockCostAcrossCities(shortCities, 0, resUpkeep);
  eq(M.ownerResourceStockAll(shortCities, 0).drewno, 0, 'A3e: pobór przy niedoborze zabiera wszystko i podłogowuje na 0 (bez ujemnej puli)');

  // Krok 4: pobór przy wystarczającej puli — utrzymanie FAKTYCZNIE ZOSTAŁO POBRANE.
  const okCities = makeCities([{ id: 'm1', ownerId: 0, surowce: { drewno: 27 } }]);
  const okMissing = M.missingStockFor(M.ownerResourceStockAll(okCities, 0), resUpkeep);
  deepEq(okMissing, {}, 'A3f: pula 27 pokrywa utrzymanie 10 — brak konsekwencji niedoboru');
  M.deductBuildingStockCostAcrossCities(okCities, 0, resUpkeep);
  eq(M.ownerResourceStockAll(okCities, 0).drewno, 17, 'A3g: UTRZYMANIE POBRANE w następnej turze: 27 - 10 = 17');
}

// ---------------------------------------------------------------------------
console.log('\n-- A4: PARYTET gracz / AI / MP — jedna bramka owner-agnostyczna --');
{
  // Dowód strukturalny: bramka nie przyjmuje ownerId, więc nie ma ścieżki per-owner.
  eq(EU.canAffordUnitRecruitStock.length, 2, 'A4a: bramka ma 2 parametry (pool, unitDef) — brak parametru ownerId');

  const OWNERS = [{ id: 0, label: 'gracz' }, { id: 7, label: 'AI' }, { id: 31, label: 'MP (miasto-państwo)' }];
  const results = [];
  for (const o of OWNERS) {
    const cities = makeCities([
      { id: `c${o.id}a`, ownerId: o.id, surowce: { drewno: 30 } },
      { id: `c${o.id}b`, ownerId: o.id, surowce: { drewno: 27 } },
      { id: 'obcy', ownerId: 99, surowce: { drewno: 1000 } },
    ]);
    const pool = M.ownerResourceStockAll(cities, o.id);
    eq(pool.drewno, 57, `A4-setup ${o.label}: pula państwa 30+27 = 57 (cudze miasto nie wlicza się)`);
    assert(EU.canAffordUnitRecruitStock(pool, WOJOWNIK) === true, `A4b ${o.label}: 57 Drewna -> rekrutacja przechodzi`);
    assert(EU.canAffordUnitRecruitStock({ drewno: 49 }, WOJOWNIK) === false, `A4c ${o.label}: 49 Drewna -> zablokowana`);
    results.push(`${EU.canAffordUnitRecruitStock(pool, WOJOWNIK)}|${EU.pickUnitRecruitHint(pool, WOJOWNIK)}|${EU.isUnitRecruitStockChipMissing(pool, WOJOWNIK, 'drewno')}`);
  }
  assert(new Set(results).size === 1, 'A4d: gracz, AI i MP dostają IDENTYCZNY werdykt bramki, hint i chip');
}

// ---------------------------------------------------------------------------
console.log('\n-- A5: kontrakt symboli po wycofaniu R-AI-RECRUIT-UPKEEP-GATE --');
{
  assert(EU.canAffordUnitRecruitFull === EU.canAffordUnitRecruitStock,
    'A5a: canAffordUnitRecruitFull to alias na canAffordUnitRecruitStock (main.ts woła starą nazwę)');
  assert(EU.unitRecruitFullStockCost === undefined,
    'A5b: unitRecruitFullStockCost USUNIĘTY (koszt "zakup + rezerwa" nie istnieje)');
  assert(EU.canAffordUnitRecruitUpkeepReserve === undefined,
    'A5c: canAffordUnitRecruitUpkeepReserve USUNIĘTY (nie ma bramki rezerwy)');
  assert(EU.UNIT_RECRUIT_FULL_HINT === undefined,
    'A5d: UNIT_RECRUIT_FULL_HINT USUNIĘTY (komunikat "rekrutacja + utrzymanie" nie istnieje)');
  assert(typeof EU.unitRecruitUpkeepReserve === 'function',
    'A5e: unitRecruitUpkeepReserve ZOSTAJE — heurystyka deficytów AI (ai.ts), nie bramka');
  // Bramka jest niezależna od utrzymania: ta sama jednostka z upkeepem 0 i 10^6 daje ten sam werdykt.
  const bezUpkeep = { ...WOJOWNIK, 'Utrzymanie surowiec': '-', 'Utrzymanie surowiec (ilość)': 0 };
  const monstrualnyUpkeep = { ...WOJOWNIK, 'Utrzymanie surowiec (ilość)': 1000000 };
  assert(
    EU.canAffordUnitRecruitStock({ drewno: 57 }, bezUpkeep)
    === EU.canAffordUnitRecruitStock({ drewno: 57 }, monstrualnyUpkeep)
    && EU.canAffordUnitRecruitStock({ drewno: 57 }, monstrualnyUpkeep) === true,
    'A5f: werdykt bramki NIEZALEŻNY od wysokości utrzymania (0 vs 1 000 000 -> ten sam true)',
  );
}

console.log(`\nrecruitment-no-upkeep-gate-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY);  } catch (e) { /* ignore */ }
try { fs.unlinkSync(BUNDLE); } catch (e) { /* ignore */ }
process.exit(failed > 0 ? 1 : 0);
