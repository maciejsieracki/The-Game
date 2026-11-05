'use strict';
/**
 * recruitment-no-upkeep-gate-test.cjs — R-REKRUTACJA-SUROWIEC-BEZ-UPKEEP-Q1 (2026-08-26)
 *
 * KONTRAKT PINOWANY: bramka rekrutacji sprawdza WYŁĄCZNIE jednorazowy koszt zakupu
 * (`unitStockCost`). Utrzymanie NIE blokuje zakupu — jest pobierane dopiero w NASTĘPNEJ
 * turze, przez prawdziwy tick ekonomii, wraz z istniejącą konsekwencją niedoboru.
 * WYCOFUJE R-AI-RECRUIT-UPKEEP-GATE (2026-08-06).
 *
 * Dane: kanoniczne `data/units.json`. Wartości kosztu i utrzymania Wojownika są
 * CZYTANE Z DANYCH (nie zaszyte w teście) — poprzednie zaszyte 50 Drewna / 10 Drewna/t
 * były przestarzałe względem aktualnego units.json (Surowiec (ilość)=13,
 * Utrzymanie surowiec (ilość)=3). Kontrakt testu (bramka = tylko koszt zakupu,
 * utrzymanie płatne w następnej turze) nie zależy od konkretnych liczb.
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

// Wartości z kanonicznych danych (units.json) — jedyne źródło liczb w tym teście.
const COST = M.unitStockCost(WOJOWNIK).drewno;             // jednorazowy koszt zakupu (Drewno)
const UPK  = EU.unitResourceUpkeep(WOJOWNIK).drewno;       // utrzymanie Drewna za turę
// Pochodne scenariusze (odpowiedniki dawnych 57 / 49 / 7 / 27):
const POOL_OK    = COST + UPK + 7;   // pula pokrywa koszt ORAZ utrzymanie na 1 turę
const POOL_SHORT = COST - 1;         // pula o 1 za mała na sam koszt zakupu
const STOCK_AFTER_REC = UPK - 1;     // zapas po rekrutacji, za mały na utrzymanie (niedobór 1)
const STOCK_OK   = UPK + 17;         // zapas wystarczający na utrzymanie z nadwyżką

assert(COST > 0 && UPK > 1, `setup: units.json musi dawać koszt>0 i utrzymanie>1 (cost=${COST}, upk=${UPK})`);

// ---------------------------------------------------------------------------
console.log('\n-- A0: dane kanoniczne (units.json) --');
deepEq(M.unitStockCost(WOJOWNIK), { drewno: 13 }, 'A0a: Wojownik koszt zakupu = 13 Drewna (units.json)');
deepEq(EU.unitResourceUpkeep(WOJOWNIK), { drewno: 3 }, 'A0b: Wojownik utrzymanie = 3 Drewna/turę (units.json)');

// ---------------------------------------------------------------------------
console.log('\n-- A1: SCENARIUSZ — pula pokrywa koszt + utrzymanie -> rekrutacja przechodzi --');
{
  const cities = makeCities([{ id: 'm1', ownerId: 0, surowce: { drewno: POOL_OK } }]);
  const pool = M.ownerResourceStockAll(cities, 0);
  eq(pool.drewno, POOL_OK, 'A1-setup: pula państwa = POOL_OK Drewna');
  assert(
    EU.canAffordUnitRecruitStock(pool, WOJOWNIK) === true,
    'A1: pula koszt+utrzymanie -> REKRUTACJA PRZECHODZI (utrzymanie nie blokuje)',
  );
  assert(
    EU.pickUnitRecruitHint(pool, WOJOWNIK) === null,
    'A1b: brak komunikatu odmowy przy puli pokrywającej koszt (utrzymanie nie jest powodem odmowy)',
  );
  assert(
    EU.isUnitRecruitStockChipMissing(pool, WOJOWNIK, 'drewno') === false,
    'A1c: chip Drewna NIE czerwony przy puli pokrywającej koszt (kryterium 2 dispatchu)',
  );
  // Wartość graniczna: dokładnie koszt zakupu, zero zapasu na utrzymanie.
  assert(
    EU.canAffordUnitRecruitStock({ drewno: COST }, WOJOWNIK) === true,
    'A1d: pula = dokładnie koszt zakupu (0 zapasu na utrzymanie) -> rekrutacja przechodzi',
  );
}

// ---------------------------------------------------------------------------
console.log('\n-- A2: ODWROTNIE — bramka kosztu NIE rozbraja się (pula < koszt o 1) --');
{
  const cities = makeCities([{ id: 'm1', ownerId: 0, surowce: { drewno: POOL_SHORT } }]);
  const pool = M.ownerResourceStockAll(cities, 0);
  assert(
    EU.canAffordUnitRecruitStock(pool, WOJOWNIK) === false,
    'A2: pula o 1 mniejsza od kosztu zakupu -> rekrutacja NADAL ZABLOKOWANA',
  );
  assert(
    EU.pickUnitRecruitHint(pool, WOJOWNIK) === EU.UNIT_RECRUIT_STOCK_ONLY_HINT,
    'A2b: komunikat odmowy = brak jednorazowego kosztu w magazynie',
  );
  assert(
    EU.isUnitRecruitStockChipMissing(pool, WOJOWNIK, 'drewno') === true,
    'A2c: chip Drewna czerwony przy puli poniżej kosztu zakupu',
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
  // Krok 1: rekrutacja — pula = koszt + zapas, który po rekrutacji zostaje za mały na utrzymanie.
  const cities = makeCities([{ id: 'm1', ownerId: 0, surowce: { drewno: COST + STOCK_AFTER_REC } }]);
  assert(EU.canAffordUnitRecruitStock(M.ownerResourceStockAll(cities, 0), WOJOWNIK), 'A3-setup: rekrutacja dozwolona');
  M.deductBuildingStockCostAcrossCities(cities, 0, M.unitStockCost(WOJOWNIK));
  eq(M.ownerResourceStockAll(cities, 0).drewno, STOCK_AFTER_REC,
    `A3a: po rekrutacji (koszt-zakup) pula = ${STOCK_AFTER_REC} Drewna`);

  // Krok 2: NASTĘPNA TURA — prawdziwy tick ekonomii liczy utrzymanie zrekrutowanej jednostki.
  const map = { hexes: {} };
  const econUnits = [{ ownerId: 0, typeId: 'Wojownik', camping: false }];
  const tickCities = [{
    id: 'm1', ownerId: 0, q: 0, r: 0, name: 'Testowo',
    population: 1, magazynZywnosci: 10, surowce: { drewno: STOCK_AFTER_REC },
  }];
  const econ = M.advanceCityEconomy(tickCities, map, DATA, 'normal', econUnits, new Map(), new Map());
  deepEq(
    econ.resourceUpkeepUnitsByOwner.get(0),
    { drewno: UPK },
    `A3b: tick ekonomii NASTĘPNEJ tury nalicza utrzymanie ${UPK} Drewna za zrekrutowaną jednostkę`,
  );

  // Kontrola przeciwna: bez jednostki tick nie nalicza nic (dowód, że A3b mierzy jednostkę).
  const econNoUnits = M.advanceCityEconomy(
    [{ id: 'm1', ownerId: 0, q: 0, r: 0, name: 'Testowo', population: 1, magazynZywnosci: 10, surowce: { drewno: STOCK_AFTER_REC } }],
    map, DATA, 'normal', [], new Map(), new Map(),
  );
  deepEq(econNoUnits.resourceUpkeepUnitsByOwner.get(0), {}, 'A3c: bez jednostek tick nalicza {} (kontrola przeciwna)');

  // Krok 3: pobór + KONSEKWENCJA NIEDOBORU — dokładnie kompozycja z main.ts:
  // missingStockFor(poolBefore, resUpkeep) -> ostrzeżenie; deduct nie schodzi poniżej 0.
  const resUpkeep = econ.resourceUpkeepByOwner.get(0);
  const shortCities = makeCities([{ id: 'm1', ownerId: 0, surowce: { drewno: STOCK_AFTER_REC } }]);
  const poolBefore = M.ownerResourceStockAll(shortCities, 0);
  const missing = M.missingStockFor(poolBefore, resUpkeep);
  deepEq(missing, { drewno: UPK - STOCK_AFTER_REC },
    `A3d: NIEDOBÓR wykryty — brakuje ${UPK - STOCK_AFTER_REC} Drewna na utrzymanie (${STOCK_AFTER_REC} < ${UPK})`);
  M.deductBuildingStockCostAcrossCities(shortCities, 0, resUpkeep);
  eq(M.ownerResourceStockAll(shortCities, 0).drewno, 0, 'A3e: pobór przy niedoborze zabiera wszystko i podłogowuje na 0 (bez ujemnej puli)');

  // Krok 4: pobór przy wystarczającej puli — utrzymanie FAKTYCZNIE ZOSTAŁO POBRANE.
  const okCities = makeCities([{ id: 'm1', ownerId: 0, surowce: { drewno: STOCK_OK } }]);
  const okMissing = M.missingStockFor(M.ownerResourceStockAll(okCities, 0), resUpkeep);
  deepEq(okMissing, {}, `A3f: pula ${STOCK_OK} pokrywa utrzymanie ${UPK} — brak konsekwencji niedoboru`);
  M.deductBuildingStockCostAcrossCities(okCities, 0, resUpkeep);
  eq(M.ownerResourceStockAll(okCities, 0).drewno, STOCK_OK - UPK,
    `A3g: UTRZYMANIE POBRANE w następnej turze: ${STOCK_OK} - ${UPK} = ${STOCK_OK - UPK}`);
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
      { id: `c${o.id}a`, ownerId: o.id, surowce: { drewno: COST } },
      { id: `c${o.id}b`, ownerId: o.id, surowce: { drewno: UPK + 7 } },
      { id: 'obcy', ownerId: 99, surowce: { drewno: 1000 } },
    ]);
    const pool = M.ownerResourceStockAll(cities, o.id);
    eq(pool.drewno, POOL_OK, `A4-setup ${o.label}: pula państwa = POOL_OK (cudze miasto nie wlicza się)`);
    assert(EU.canAffordUnitRecruitStock(pool, WOJOWNIK) === true, `A4b ${o.label}: pula POOL_OK -> rekrutacja przechodzi`);
    assert(EU.canAffordUnitRecruitStock({ drewno: POOL_SHORT }, WOJOWNIK) === false, `A4c ${o.label}: pula POOL_SHORT -> zablokowana`);
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
    EU.canAffordUnitRecruitStock({ drewno: POOL_OK }, bezUpkeep)
    === EU.canAffordUnitRecruitStock({ drewno: POOL_OK }, monstrualnyUpkeep)
    && EU.canAffordUnitRecruitStock({ drewno: POOL_OK }, monstrualnyUpkeep) === true,
    'A5f: werdykt bramki NIEZALEŻNY od wysokości utrzymania (0 vs 1 000 000 -> ten sam true)',
  );
}

console.log(`\nrecruitment-no-upkeep-gate-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY);  } catch (e) { /* ignore */ }
try { fs.unlinkSync(BUNDLE); } catch (e) { /* ignore */ }
process.exit(failed > 0 ? 1 : 0);
