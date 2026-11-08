'use strict';
/**
 * citystate-army-food-difficulty-test.cjs -- R-WEB-CITYSTATE-ARMY-FOOD-DIFFICULTY-Q1.
 *
 * Zużycie żywności ARMII (militaryFoodConsumptionWithSpichlerz -> advanceEmpireFood)
 * ma używać poziomu trudności WŁAŚCICIELA jednostek: miasto-państwo -> cityStateDifficulty,
 * gracz i AI -> trudność menu. Test sprawdza:
 *   A. bez resolvera (dawne zachowanie) koszt armii miasta-państwa = koszt wg parametru upkeep;
 *   B. z resolverem: miasto-państwo na CS=hard płaci 2x zużycie ruchu (zywnosc_jednostka_ruch
 *      hard=2, normal=1); gracz i AI bez zmian;
 *   C. z resolverem: wariant obozujący (zywnosc_jednostka_oboz) też wg poziomu właściciela;
 *   D. advanceEmpireFood: kosztArmii per owner w EmpireFoodTick wg resolvera; gracz bez zmian;
 *   E. CS na tym samym poziomie co menu = wynik identyczny jak dawniej (brak efektu);
 *   F. glod_wojska_hp_frac per poziom (easy/normal/hard) -- ułamek atrycji wg właściciela;
 *   G. liczby econ-params.json nietknięte (zywnosc_jednostka_ruch 1/1/2, oboz 0.38/0.5/0.62).
 *
 * Run from gra/:  node tools/citystate-army-food-difficulty-test.cjs
 */
const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch (e) { console.error('[citystate-army-food-difficulty-test] esbuild not found. Run: npm install (from gra/)'); process.exit(1); }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY_FILE = path.resolve(__dirname, '.citystate-army-food-difficulty-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.citystate-army-food-difficulty-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export { militaryFoodConsumptionWithSpichlerz, setArmyFoodUpkeepResolver } from '../src/game/turn-economy';
export { advanceEmpireFood, buildEmpireFoodParams, freshEmpireFoodState, bindEmpireFoodRuntime } from '../src/game/empire-food';
export { loadUpkeepParams } from '../src/game/economy-upkeep';
export { effectiveGameDifficultyForOwnerPure } from '../src/game/effective-difficulty-for-owner';
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    loader: { '.ts': 'ts', '.json': 'json' }, outfile: BUNDLE_FILE, absWorkingDir: GRA, logLevel: 'silent',
  });
} catch (e) {
  console.error('[citystate-army-food-difficulty-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const {
  militaryFoodConsumptionWithSpichlerz, setArmyFoodUpkeepResolver,
  advanceEmpireFood, buildEmpireFoodParams, freshEmpireFoodState, bindEmpireFoodRuntime,
  loadUpkeepParams, effectiveGameDifficultyForOwnerPure,
} = require(BUNDLE_FILE);

const readJson = (rel) => JSON.parse(fs.readFileSync(path.resolve(GRA, 'data', rel), 'utf8'));
const econParams = readJson('econ-params.json');
const units = readJson('units.json');

let passed = 0, failed = 0;
function eq(a, b, msg) {
  if (a === b) passed++;
  else { failed++; console.error(`FAIL: ${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }
}
function near(a, b, msg) {
  if (Math.abs(a - b) < 1e-9) passed++;
  else { failed++; console.error(`FAIL: ${msg} (got ${a}, want ${b})`); }
}
function ok(c, msg) { eq(!!c, true, msg); }

const PLAYER = 0, AI_CIV = 2, CS = 7;
const csOwners = new Set([CS]);
const MENU = 'normal', CS_LEVEL = 'hard';
// Jednostki bez wpisu w tabeli żywności -> stawka bazowa zywnosc_jednostka_ruch/oboz.
const FALLBACK = 'TEST-JEDNOSTKA-SPOZA-TABELI';
const mkUnits = (oid, camping = false) => [1, 2, 3].map(() => ({
  ownerId: oid, typeId: FALLBACK, camping, onOwnTerritory: true,
}));
const foodTable = {};

const upkeepNormal = loadUpkeepParams(econParams, 'normal');
const upkeepHard = loadUpkeepParams(econParams, 'hard');
const upkeepEasy = loadUpkeepParams(econParams, 'easy');
const resolverFor = (csLevel, menu = MENU) => (oid) =>
  loadUpkeepParams(econParams, effectiveGameDifficultyForOwnerPure(oid, menu, csLevel, csOwners));

// ---------------- A. bez resolvera = dawne zachowanie ----------------
console.log('--- A: bez resolvera (dawne zachowanie) ---');
setArmyFoodUpkeepResolver(null);
const costNormalRuch = militaryFoodConsumptionWithSpichlerz(mkUnits(CS), CS, upkeepNormal, foodTable);
const costCsNoRes = militaryFoodConsumptionWithSpichlerz(mkUnits(CS), CS, upkeepHard, foodTable);
ok(costNormalRuch > 0, `A1 koszt armii > 0 (normal ruch, 3 jednostki = ${costNormalRuch})`);
near(costCsNoRes, 2 * costNormalRuch, 'A2 bez resolvera parametr upkeep decyduje (hard = 2x normal)');

// ---------------- B. z resolverem: miasto-państwo wg swojego poziomu ----------------
console.log('--- B: z resolverem per owner (CS=hard, menu=normal) ---');
setArmyFoodUpkeepResolver(resolverFor(CS_LEVEL));
const costCs = militaryFoodConsumptionWithSpichlerz(mkUnits(CS), CS, upkeepNormal, foodTable);
const costPlayer = militaryFoodConsumptionWithSpichlerz(mkUnits(PLAYER), PLAYER, upkeepNormal, foodTable);
const costAi = militaryFoodConsumptionWithSpichlerz(mkUnits(AI_CIV), AI_CIV, upkeepNormal, foodTable);
near(costCs, 2 * costNormalRuch, 'B1 miasto-państwo CS=hard płaci 2x zużycie (ruch hard=2 vs normal=1)');
near(costPlayer, costNormalRuch, 'B2 gracz (menu normal) bez zmian');
near(costAi, costNormalRuch, 'B3 AI cywilizacji (menu normal) bez zmian');
// Parametr upkeep przekazany przez wołającego jest ignorowany dla właściciela z resolverem:
const costCsIgnoredArg = militaryFoodConsumptionWithSpichlerz(mkUnits(CS), CS, upkeepEasy, foodTable);
near(costCsIgnoredArg, costCs, 'B4 z resolverem wynik zależy od poziomu właściciela, nie od argumentu upkeep');

// ---------------- C. wariant obozujący ----------------
console.log('--- C: jednostki obozujące wg poziomu właściciela ---');
const campCs = militaryFoodConsumptionWithSpichlerz(mkUnits(CS, true), CS, upkeepNormal, foodTable);
const campPlayer = militaryFoodConsumptionWithSpichlerz(mkUnits(PLAYER, true), PLAYER, upkeepNormal, foodTable);
// camping: base*(oboz/ruch); hard: 2*(0.62/2)=0.62, normal: 1*(0.5/1)=0.5
ok(campCs > campPlayer, `C1 obozujące CS (hard) > obozujące gracza (normal) (${campCs} > ${campPlayer})`);
near(campCs / campPlayer, 0.62 / 0.5, 'C2 stosunek obozu hard/normal = 0,62/0,5');

// ---------------- D. advanceEmpireFood: kosztArmii per owner ----------------
console.log('--- D: advanceEmpireFood -> kosztArmii per owner ---');
const econD = { perCity: [] };
const unitsD = [...mkUnits(PLAYER), ...mkUnits(CS), ...mkUnits(AI_CIV)];
const runFood = (resolver) => {
  setArmyFoodUpkeepResolver(resolver);
  const states = new Map([[PLAYER, freshEmpireFoodState()], [CS, freshEmpireFoodState()], [AI_CIV, freshEmpireFoodState()]]);
  bindEmpireFoodRuntime(states);
  const params = buildEmpireFoodParams(econParams, MENU);
  return advanceEmpireFood(econD, unitsD, states, upkeepNormal, params, foodTable, undefined, undefined);
};
const efNoRes = runFood(null);
const efRes = runFood(resolverFor(CS_LEVEL));
near(efNoRes.byOwner.get(CS).kosztArmii, costNormalRuch, 'D1 bez resolvera: kosztArmii CS = wg menu (dawne)');
near(efRes.byOwner.get(CS).kosztArmii, 2 * costNormalRuch, 'D2 z resolverem: kosztArmii CS = wg CS=hard');
near(efRes.byOwner.get(PLAYER).kosztArmii, costNormalRuch, 'D3 gracz: kosztArmii bez zmian');
near(efRes.byOwner.get(AI_CIV).kosztArmii, costNormalRuch, 'D4 AI cywilizacji: kosztArmii bez zmian');
eq(efRes.byOwner.get(PLAYER).zapasyPo, efNoRes.byOwner.get(PLAYER).zapasyPo, 'D5 zapasy gracza identyczne z/bez resolvera');

// ---------------- E. CS na poziomie menu = brak efektu ----------------
console.log('--- E: CS na tym samym poziomie co menu = brak efektu ---');
setArmyFoodUpkeepResolver(null);
const costCsSameLevel = militaryFoodConsumptionWithSpichlerz(mkUnits(CS), CS, upkeepNormal, foodTable);
setArmyFoodUpkeepResolver(resolverFor(MENU));
const costCsSame = militaryFoodConsumptionWithSpichlerz(mkUnits(CS), CS, upkeepNormal, foodTable);
near(costCsSame, costCsSameLevel, 'E1 CS=menu (normal): wynik identyczny jak bez resolvera');
setArmyFoodUpkeepResolver(null);

// ---------------- F. glod_wojska_hp_frac per poziom ----------------
console.log('--- F: ułamek atrycji głodu wg poziomu ---');
const hpE = buildEmpireFoodParams(econParams, 'easy').glodWojskaHpFrac;
const hpN = buildEmpireFoodParams(econParams, 'normal').glodWojskaHpFrac;
const hpH = buildEmpireFoodParams(econParams, 'hard').glodWojskaHpFrac;
ok(hpE < hpN && hpN < hpH, `F1 hp_frac easy<normal<hard (${hpE}/${hpN}/${hpH})`);
eq(buildEmpireFoodParams(econParams, effectiveGameDifficultyForOwnerPure(CS, MENU, CS_LEVEL, csOwners)).glodWojskaHpFrac,
  hpH, 'F2 miasto-państwo CS=hard -> ułamek hard');
eq(buildEmpireFoodParams(econParams, effectiveGameDifficultyForOwnerPure(PLAYER, MENU, CS_LEVEL, csOwners)).glodWojskaHpFrac,
  hpN, 'F3 gracz (menu normal) -> ułamek normal');

// ---------------- G. liczby nietknięte ----------------
console.log('--- G: liczby econ-params.json bez zmian ---');
eq(upkeepEasy.zywnoscJednostkaRuch, 1, 'G1 ruch easy = 1');
eq(upkeepNormal.zywnoscJednostkaRuch, 1, 'G2 ruch normal = 1');
eq(upkeepHard.zywnoscJednostkaRuch, 2, 'G3 ruch hard = 2');
near(upkeepHard.zywnoscJednostkaOboz, 0.62, 'G4 oboz hard = 0,62');
near(upkeepNormal.zywnoscJednostkaOboz, 0.5, 'G5 oboz normal = 0,5');

console.log(`\nWynik: ${passed} PASS / ${failed} FAIL`);
if (failed > 0) process.exit(1);
console.log('citystate-army-food-difficulty-test: OK');
