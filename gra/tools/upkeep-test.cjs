'use strict';
/**
 * upkeep-test.cjs -- standalone Node test for src/game/economy-upkeep.ts.
 * Run from gra/:  node tools/upkeep-test.cjs
 *
 * Self-contained: bundles upkeep.ts with esbuild to a temp CJS file, then
 * requires it and runs assertions. upkeep.ts uses only `import type` (BuildingRecord
 * from economy.ts), which esbuild erases -- so the bundle needs ONLY upkeep.ts.
 * Pure logic; no DOM, no THREE. Assertions anchored to Spec-ekonomia.md s.6/s.7.
 */

const fs   = require('fs');
const path = require('path');

// --- esbuild ---------------------------------------------------------------
const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[upkeep-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const ENTRY_FILE  = path.resolve(__dirname, '.upkeep-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.upkeep-bundle.cjs');

const ENTRY_TS = `
export {
  DEFAULT_STORAGE_PARAMS, loadStorageParams,
  foodStorageCapacity, resourceStorageCapacityPerType,
  clampStore, emptyCityStores, applyFood, applyResourceIntake,
  globalResourceCapacityPerType, onCityLost, onCityConquered,
  DEFAULT_UPKEEP_PARAMS, loadUpkeepParams,
  buildingUpkeep, totalBuildingUpkeep,
  buildingResourceUpkeep, totalBuildingResourceUpkeep, buildingResourceUpkeepForBuiltIds,
  DEFAULT_UNIT_UPKEEP_BY_CATEGORY, unitUpkeep, totalUnitUpkeep,
  buildUnitUpkeepTable, buildUnitFoodTable, unitFoodPerTurn,
  militaryFoodConsumption, upkeepBalance,
} from '../src/game/economy-upkeep';
`;

fs.writeFileSync(ENTRY_FILE, ENTRY_TS, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE_FILE,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[upkeep-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const U = require(BUNDLE_FILE);

// --- tiny assertion framework ----------------------------------------------
let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error('  FAIL:', msg); }
}
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

// ===========================================================================
// A. STORAGE  (Spec s.7)
// ===========================================================================
const SP = U.DEFAULT_STORAGE_PARAMS;           // {20, 10, 5}
eq(SP.bazaZywnosc, 20, 's7: default food base 20');
eq(SP.bazaSurowce, 10, 's7: default resource base 10');
eq(SP.mnoznikMagazynu, 5, 's7: default multiplier 5');

// s.7.1 food capacity
eq(U.foodStorageCapacity(false, SP), 20,  's7.1: food cap without Spichlerz = 20');
eq(U.foodStorageCapacity(true,  SP), 100, 's7.1: food cap with Spichlerz = 100');
// s.7.2 resource capacity per type
eq(U.resourceStorageCapacityPerType(false, SP), 10, 's7.2: resource cap without Magazyn = 10');
eq(U.resourceStorageCapacityPerType(true,  SP), 50, 's7.2: resource cap with Magazyn = 50');

// clampStore: overflow lost, negatives floored
let c = U.clampStore(120, 100);
eq(c.stored, 100, 's7: clamp 120@100 -> stored 100'); eq(c.overflow, 20, 's7: clamp 120@100 -> overflow 20');
c = U.clampStore(30, 100);  eq(c.stored, 30, 's7: clamp 30@100 stored'); eq(c.overflow, 0, 's7: clamp 30@100 no overflow');
c = U.clampStore(-5, 100);  eq(c.stored, 0, 's7: negative floored to 0'); eq(c.overflow, 0, 's7: negative no overflow');

// applyFood: net change then ceiling (s.7.1)
let f = U.applyFood(90, 35, 100); eq(f.stored, 100, 's7.1: applyFood 90+35@100 -> 100'); eq(f.overflow, 25, 's7.1: applyFood overflow 25');
f = U.applyFood(40, 8, 100);      eq(f.stored, 48, 's7.1: applyFood 40+8 -> 48'); eq(f.overflow, 0, 's7.1: applyFood no overflow');

// applyResourceIntake: per-type cap, pure
const r = U.applyResourceIntake({ zywnosc: 0, surowce: { Drewno: 48 } }, { Drewno: 5, Kamien: 3 }, 50);
eq(r.stores.surowce.Drewno, 50, 's7.2: Drewno capped at 50'); eq(r.overflow.Drewno, 3, 's7.2: Drewno overflow 3');
eq(r.stores.surowce.Kamien, 3, 's7.2: Kamien intake stored 3'); assert(r.overflow.Kamien === undefined, 's7.2: Kamien no overflow');

// s.7.3 global capacity: 3 Magazyn (50 each) + 1 base (10) = 160 (spec example)
eq(U.globalResourceCapacityPerType([true, true, true, false], SP), 160, 's7.3: global per-type = 160');

// s.7.3 events
const lost = U.onCityLost(); eq(lost.zywnosc, 0, 's7.3: lost city food 0'); eq(Object.keys(lost.surowce).length, 0, 's7.3: lost city resources empty');
const conq = U.onCityConquered(
  { zywnosc: 80, surowce: { Drewno: 40 } },
  { zywnosc: 50, surowce: { Drewno: 30, Kamien: 10 } },
  100, 50);
eq(conq.stores.zywnosc, 100, 's7.3: conquered food 80+50 clamp 100'); eq(conq.overflow.zywnosc, 30, 's7.3: conquered food overflow 30');
eq(conq.stores.surowce.Drewno, 50, 's7.3: conquered Drewno 40+30 clamp 50'); eq(conq.stores.surowce.Kamien, 10, 's7.3: conquered Kamien 10');

// loadStorageParams: reads globalne group, falls back on missing
const rawOk = { globalne: { magazyn_baza_zywnosc: { easy: 25, normal: 20, hard: 15 }, magazyn_baza_surowce: { normal: 10 }, magazyn_mnoznik_spichlerz: { normal: 5 } } };
eq(U.loadStorageParams(rawOk, 'easy').bazaZywnosc, 25, 'load: storage easy food base 25');
eq(U.loadStorageParams({}, 'normal').bazaZywnosc, 20, 'load: storage missing -> fallback 20');

// ===========================================================================
// B. MAINTENANCE  (Spec s.6)
// ===========================================================================
const UP = U.DEFAULT_UPKEEP_PARAMS;
eq(UP.zywnoscJednostkaRuch, 1, 's6.3: default unit food marching 1');
eq(UP.zywnoscJednostkaOboz, 0.5, 's6.3: default unit food camping 0.5');

// s.6.1 building upkeep -- R-UTRZYMANIE-ZROZNICOWANE (2026-07-25, decyzja
// wlasciciela 19=A): kazdy budynek placi WLASNE utrzymanie z danych; flatOverride
// (budynki.utrzymanie_budynek z econ-params.json) jest wylacznie DOMYSLNA wartoscia
// dla budynku BEZ wlasnego wpisu -- nigdy nie nadpisuje realnej wartosci.
// R-NADMIAR-POOLS FALA2: wynik ×2 (R_STAWKI_FALA2_MULT) vs JSON/base.
// building.utrzymanie=1 + flatOverride=1 -- oba dają 2 po skali, ten przypadek nie odroznia
// starego (nadpisanie) od nowego (per-budynek) zachowania -- patrz test ponizej.
eq(U.buildingUpkeep({ utrzymanie: 1, przyrostUtrzymania: 0 }, 1, 1), 2, 's6.1: utrzymanie=1 (flatOverride rowny, nie odrozniajacy) ×2 FALA2');
// without override: liniowy floor(utrzymanie + przyrostUtrzymania * (level-1)) [decyzja Naster 2026-07-25, mirrors buildingValue]
// level 1: floor(1 + 0) = 1 → ×2 = 2; level 3: floor(1 + 0.5*2) = 2 → ×2 = 4
eq(U.buildingUpkeep({ utrzymanie: 1, przyrostUtrzymania: 0.5 }, 1), 2, 's6.1: linear lvl1 = 2 (×2 FALA2)');
eq(U.buildingUpkeep({ utrzymanie: 1, przyrostUtrzymania: 0.5 }, 3), 4, 's6.1: linear lvl3 = floor(2.0)×2 = 4');
// higher base: utrzymanie=10, przyrostUtrzymania=2, level 3 -> floor(10 + 2*2) = 14 → ×2 = 28
eq(U.buildingUpkeep({ utrzymanie: 10, przyrostUtrzymania: 2 }, 3), 28, 's6.1: linear base10 lvl3 = floor(14)×2 = 28');
// 12 buildings flat 1 = 24 (spec s.8.4 example, ×2 FALA2)
const blds = Array.from({ length: 12 }, () => ({ record: { utrzymanie: 1, przyrostUtrzymania: 0 }, level: 1 }));
eq(U.totalBuildingUpkeep(blds, 1), 24, 's8.4: 12 buildings * 2 = 24 (×2 FALA2)');

// --- ZADANIE 1 (2026-07-25): flat override PRZESTAJE nadpisywac dane budynku ---
// budynek z utrzymanie:5 kosztuje 10 (5×2 FALA2), NIE stawke domyslna 1/2 (easy/normal/hard).
eq(U.buildingUpkeep({ utrzymanie: 5, przyrostUtrzymania: 0 }, 1, 1), 10, 'ZAD1: utrzymanie=5 kosztuje 10, nie flat=1 (easy/normal) ×2 FALA2');
eq(U.buildingUpkeep({ utrzymanie: 5, przyrostUtrzymania: 0 }, 1, 2), 10, 'ZAD1 (hard): utrzymanie=5 kosztuje 10, nie flat=2 -- plaska stawka trudna nie nadpisuje danych');
// Stela/Pomnik: utrzymanie=0 to WARTOSC z danych (decyzja 45=B, "pomnik nie wymaga
// obslugi"), NIE "brak wpisu" -- 0 jest falsy w JS ale Number.isFinite(0)===true,
// wiec NIE wolno go zastapic stawka domyslna.
eq(U.buildingUpkeep({ utrzymanie: 0, przyrostUtrzymania: 0 }, 1, 1), 0, 'ZAD1: Stela utrzymanie=0 kosztuje 0, nie flat default (easy/normal)');
eq(U.buildingUpkeep({ utrzymanie: 0, przyrostUtrzymania: 0 }, 1, 2), 0, 'ZAD1 (hard): Stela utrzymanie=0 kosztuje 0, nie flat default=2');
eq(U.buildingUpkeep({ utrzymanie: 0, przyrostUtrzymania: 0 }, 3, 2), 0, 'ZAD1: Stela poziom 3, wciaz 0 (przyrost=0)');
// budynek BEZ pola utrzymanie w danych (undefined -> not finite) -> flatOverride
// jest DOMYSLNA wartoscia (nigdy sytuacja dzis w buildings.json -- wszystkie 39
// budynkow maja wlasny wpis -- ale kod musi to obsluzyc bezpiecznie).
eq(U.buildingUpkeep({ przyrostUtrzymania: 0 }, 1, 1), 2, 'ZAD1: budynek bez wpisu utrzymanie -> flat default 1×2=2 (easy/normal)');
eq(U.buildingUpkeep({ przyrostUtrzymania: 0 }, 1, 2), 4, 'ZAD1 (hard): budynek bez wpisu utrzymanie -> flat default 2×2=4');
eq(U.buildingUpkeep({ przyrostUtrzymania: 0 }, 1), 0, 'ZAD1: budynek bez wpisu utrzymanie i bez flat default -> 0 (bezpieczny fallback)');
// utrzymanie=NaN traktowane jak "brak wpisu" (nie moze wygenerowac NaN w wyniku)
eq(U.buildingUpkeep({ utrzymanie: NaN, przyrostUtrzymania: 0 }, 1, 1), 2, 'ZAD1: utrzymanie=NaN traktowane jak brak wpisu -> flat default×2');

// --- building resource upkeep (koszt_surowce -> BUILDING_RESOURCE_UPKEEP_UNITS_PER_TYPE/turę
//     per type -- R-EKONOMIA-SUROWCE-SKALA-5X-Q1, Maciej 2026-08-13: 5/turę, było 1/turę) ---
eq(JSON.stringify(U.buildingResourceUpkeep({ koszt_surowce: { drewno: 5 } })), '{"drewno":5}', 'res upkeep: drewno build cost -> 5 drewno/t (R-EKONOMIA-SUROWCE-SKALA-5X-Q1, bylo 1)');
eq(JSON.stringify(U.buildingResourceUpkeep({ koszt_surowce: { drewno: 40, kamien: 12 } })), '{"drewno":5,"kamien":5}', 'res upkeep: always 5 per type (R-EKONOMIA-SUROWCE-SKALA-5X-Q1, bylo 1), not build amount');
eq(JSON.stringify(U.buildingResourceUpkeep({})), '{}', 'res upkeep: no koszt_surowce -> empty');
eq(JSON.stringify(U.buildingResourceUpkeep({ koszt_surowce: { drewno: 0 } })), '{}', 'res upkeep: zero build cost -> no upkeep');
const resBlds = [
  { record: { koszt_surowce: { drewno: 5 } }, level: 1 },
  { record: { koszt_surowce: { drewno: 8, kamien: 3 } }, level: 1 },
  { record: {}, level: 1 },
];
eq(JSON.stringify(U.totalBuildingResourceUpkeep(resBlds)), '{"drewno":10,"kamien":5}', 'res upkeep total: sum per type across buildings (2 budynki x drewno 5 = 10, R-EKONOMIA-SUROWCE-SKALA-5X-Q1, bylo 2)');
eq(JSON.stringify(U.buildingResourceUpkeepForBuiltIds(
  ['stolarnia', 'kamieniarski'],
  [{ id: 'stolarnia', koszt_surowce: { drewno: 5 } }, { id: 'kamieniarski', koszt_surowce: { kamien: 4 } }],
)), '{"drewno":5,"kamien":5}', 'res upkeep for built ids (R-EKONOMIA-SUROWCE-SKALA-5X-Q1, bylo 1,1)');

// s.6.2 unit upkeep: typeId table > category default > standard
// R-STAWKI FALA1×FALA2: ×4 (R_STAWKI_FALA1_FALA2_MULT) vs JSON/category/base.
const tbl = U.buildUnitUpkeepTable([{ Jednostka: 'Hetairoi', 'Utrzymanie (Pieniadz/ture)': 3 }]);
eq(U.unitUpkeep({ typeId: 'Hetairoi', category: 'konnica' }, tbl, 1), 12, 's6.2: exact typeId from table = 12 (3×4 FALA1×FALA2)');
eq(U.unitUpkeep({ typeId: 'X', category: 'zwiadowca' }, {}, 1), 0, 's6.2: zwiadowca cywilny upkeep 0');
eq(U.unitUpkeep({ typeId: 'X', category: 'falanga' }, {}, 1), 8, 's6.2: category falanga default = 8 (2×4 FALA1×FALA2)');
eq(U.unitUpkeep({ typeId: 'X', category: 'super' }, {}, 1), 0, 's6.2: super-unit upkeep 0');
eq(U.unitUpkeep({ typeId: 'X', category: 'nieznana' }, {}, 1), 4, 's6.2: unknown -> standard 4 (1×4 FALA1×FALA2)');

// s.6.3 military food: ×4 FALA1×FALA2 na stawce bazowej (ruch/oboz z econ-params)
eq(U.militaryFoodConsumption([{camping:true},{camping:true},{camping:true},{camping:true}], UP), 8, 's6.3: 4 camping -> 8 food (4×0.5×4)');
eq(U.militaryFoodConsumption([{camping:false},{camping:false},{camping:false},{camping:false}], UP), 16, 's6.3: 4 marching -> 16 food (4×1×4)');
eq(U.militaryFoodConsumption([{camping:true},{camping:false}], UP), 6, 's6.3: 1 camp + 1 march -> 6 (2+4)');

// s.6.3 per-type food (units.json): Zwiadowca = 0
const foodTbl = U.buildUnitFoodTable([{ Jednostka: 'Zwiadowca', 'żywność/turę': 0 }, { Jednostka: 'Wojownik', 'żywność/turę': 1 }]);
eq(U.militaryFoodConsumption([{ typeId: 'Zwiadowca', camping: false }], UP, foodTbl), 0, 'Zwiadowca: 0 food marching');
eq(U.militaryFoodConsumption([{ typeId: 'Zwiadowca', camping: true }], UP, foodTbl), 0, 'Zwiadowca: 0 food camping');
eq(U.militaryFoodConsumption([{ typeId: 'Wojownik', camping: false }], UP, foodTbl), 4, 'Wojownik: 4 food (1×4 FALA1×FALA2)');
eq(U.militaryFoodConsumption(
  [{ typeId: 'Zwiadowca', camping: false }, { typeId: 'Wojownik', camping: false }],
  UP,
  foodTbl,
), 4, 'scout + warrior = 4 food total');

// s.6.4 / s.8.4 balance: income 8, 12 buildings (×2=24) + 5 units lucznik (1×4=4 each=20) = 44 -> saldo -36
const units5 = Array.from({ length: 5 }, () => ({ typeId: 'L', category: 'lucznik' }));
const bal = U.upkeepBalance(8, blds, units5, {}, UP);
eq(bal.utrzymanieBudynki, 24, 's8.4: building upkeep 24 (12×2 FALA2)');
eq(bal.utrzymanieJednostki, 20, 's8.4: unit upkeep 20 (5×4 FALA1×FALA2)');
eq(bal.utrzymanieRazem, 44, 's8.4: total upkeep 44');
eq(bal.saldo, -36, 's8.4: saldo 8-44 = -36');
eq(bal.deficyt, true, 's8.4: deficit flagged');
// surplus case: no deficit (income must clear scaled upkeep 44)
const balPlus = U.upkeepBalance(50, blds, units5, {}, UP);
eq(balPlus.saldo, 6, 's6.4: surplus saldo 50-44 = 6'); eq(balPlus.deficyt, false, 's6.4: no deficit');

// loadUpkeepParams: reads correct groups + fallback
const rawUp = { ekonomia_miasta: { zywnosc_jednostka_oboz: { normal: 0.5 } }, budynki: { utrzymanie_budynek: { normal: 1, hard: 2 } }, globalne: { utrzymanie_jednostka_standard: { normal: 1 } } };
eq(U.loadUpkeepParams(rawUp, 'hard').budynekUtrzymanieFlat, 2, 'load: building upkeep hard = 2');
eq(U.loadUpkeepParams({}, 'normal').jednostkaUtrzymanieStd, 1, 'load: unit std missing -> fallback 1');

// --- summary ---------------------------------------------------------------
console.log(`\nupkeep-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY_FILE); } catch (e) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}
process.exit(failed ? 1 : 0);
