'use strict';
/** Grupa B lane — power + empire-food + terrain-improvements. */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.grupa-b-entry.ts');
const BUNDLE = path.resolve(__dirname, '.grupa-b-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { computePowerContributionsCityEconomy, buildPowerSnapshots } from '../src/game/power';
export { advanceEmpireFood, freshEmpireFoodState, buildEmpireFoodParams } from '../src/game/empire-food';
export { tileYield } from '../src/game/economy';
export { normalizeImprovementKey, improvementBonusForKey, IMPROVEMENT_KEYS } from '../src/game/terrain-improvements';
export { cityRangeForPopulation, citySightRadius, CITY_RANGE_MIN } from '../src/game/okolica';
export { getResourceAccessForCity, getCityResourceAccessForCity, labelsForImprovementUnlock } from '../src/game/resource-access';
export { isForeignReligionDominant, resolveOwnCultureShare } from '../src/game/society-inputs';
export { applyArmyStarvationHpLoss } from '../src/game/army-starvation';
export { isImprovementTechUnlocked, getImprovementMeta, freshClearingState, tickHexClearing, getImprovementLockHint } from '../src/game/improvement-tech';
export { foundCityWorkCost, foundCityPopulationCost, canAffordFoundCity, pickSourceCityForFounding, evaluateFoundCityAffordance, isSubsequentFoundCity } from '../src/game/city-founding';
export { dominantReligion } from '../src/game/culture-religion';
export { TerenBazowy, Nakladka } from '../src/types/hex';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, logLevel: 'silent',
  resolveExtensions: ['.ts', '.js', '.json'],
});

const M = require(BUNDLE);
let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; } else { fail++; console.error('FAIL:', msg); } }

const owners = [
  { ownerId: 0, population: 20, cityCount: 2, territoryHexCount: 30, pieniadzPerTurn: 50 },
  { ownerId: 1, population: 10, cityCount: 1, territoryHexCount: 15, pieniadzPerTurn: 25 },
];
const p0 = M.computePowerContributionsCityEconomy(owners[0], owners);
ok(p0.ludnosc === 1, 'power ludnosc max');
ok(p0.gospodarka === 1, 'power gospodarka max');
ok(p0.miasta > 0.5, 'power miasta mix');

const states = new Map([[0, M.freshEmpireFoodState(70)]]);
const econ = { perCity: [{ ownerId: 0, zywnoscNetto: 100, oblegany: false }] };
const units = [{ ownerId: 0, typeId: 'woj', camping: false }];
const upkeep = { jednostkaUtrzymanieStd: 1, zywnoscJednostkaRuch: 1, zywnoscJednostkaOboz: 0.5 };
const params = M.buildEmpireFoodParams({ suwak_zywnosc_rozwoj_domyslnie: { normal: 70 }, glod_wojska_hp_frac: { normal: 0.08 } });
const ef = M.advanceEmpireFood(econ, units, states, upkeep, params);
const t0 = ef.byOwner.get(0);
ok(t0.doPanstwa === 30, 'empire food 30% to state');
ok(states.get(0).zapasyPanstwa === 15, 'empire reserve after army cost 1 (50% netto bez Spichlerza w imperium: round(29*0.5)=15)');

const y = M.tileYield({
  terenBazowy: M.TerenBazowy.Laka,
  nakladka: M.Nakladka.Brak,
  maRzeke: false,
  ulepszenieKey: 'farma',
});
ok(y.zywnosc >= 5, 'farma +1 on laka (4+1)');

ok(M.IMPROVEMENT_KEYS.includes('farma'), '15 keys includes farma');
ok(M.normalizeImprovementKey('tartak') === 'tartak', 'tartak own key');

ok(M.cityRangeForPopulation(1) === 5, 'range pop1 min 5');
ok(M.cityRangeForPopulation(9) === 9, 'range pop9 = 9');
ok(M.citySightRadius(9, 250) === 11, 'sight pop9 + kultura +2');
ok(M.CITY_RANGE_MIN === 5, 'CITY_RANGE_MIN 5');

const mockMap = {
  hexes: {
    '0,0': { coords: { q: 0, r: 0 }, terenBazowy: M.TerenBazowy.Laka, nakladka: M.Nakladka.Brak },
    '1,0': { coords: { q: 1, r: 0 }, terenBazowy: M.TerenBazowy.Laka, nakladka: M.Nakladka.ZlozeRudy },
    '0,1': { coords: { q: 0, r: 1 }, terenBazowy: M.TerenBazowy.Laka, nakladka: M.Nakladka.ZlozeGliny },
  },
};
const resSplit = M.getCityResourceAccessForCity({ id: 'c1', q: 0, r: 0, population: 5 }, mockMap);
ok(
  resSplit.potential.includes('Ruda') && resSplit.potential.includes('Glina'),
  'ABC-19: złoża w potencjale bez ulepszenia',
);
const res = M.getResourceAccessForCity({ id: 'c1', q: 0, r: 0, population: 5 }, mockMap);
ok(!res.includes('Ruda') && !res.includes('Glina'), 'ABC-19: bez ulepszenia brak active z złoża');

const placed = new Map([['0,0', 'tartak']]);
const resWood = M.getResourceAccessForCity({ id: 'c1', q: 0, r: 0, population: 5 }, mockMap, placed);
ok(resWood.includes('Drewno'), 'tartak unlocks Drewno access');
ok(M.labelsForImprovementUnlock('tartak').includes('Drewno'), 'tartak unlock label');

const yt = M.tileYield({
  terenBazowy: M.TerenBazowy.Laka,
  nakladka: M.Nakladka.Las,
  maRzeke: false,
  ulepszenieKey: 'tartak',
});
const tarBonus = M.improvementBonusForKey('tartak');
ok(tarBonus.praca === 3 && tarBonus.drewno === undefined, 'tartak +3 praca only');
ok(yt.praca >= 6, 'tartak + las: laka 1 + las 3 + tartak 3 praca');

const yForestPlain = M.tileYield({
  terenBazowy: M.TerenBazowy.Rownina,
  nakladka: M.Nakladka.Las,
  maRzeke: false,
});
ok(yForestPlain.zywnosc === 1, 'las rownina: zywnosc 2-1');
ok(yForestPlain.handel === 0, 'las rownina: handel 1-1 floored');
ok(yForestPlain.praca === 5, 'las rownina: praca 2+3 (Praca Rownina=2, data/terrain-yields.json)');
ok(yForestPlain.drewno === 5, 'las rownina: drewno 2+3');

ok(M.resolveOwnCultureShare({ ownCultureShare: 0.4 }) === 0.4, 'culture share resolve');
const rel = M.isForeignReligionDominant(
  { counts: { 'Chrzescijanstwo': 8, 'Poganstwo': 2 } },
  'Poganstwo',
  { progDominacjiPct: 50 },
);
ok(rel === true, 'foreign religion dominant');

const starvUnits = [{ id: 'u1', ownerId: 0, typeId: 'woj', hp: 100, hpMax: 100 }];
const starv = M.applyArmyStarvationHpLoss(starvUnits, 0, 0.08, () => 100);
ok(starvUnits[0].hp === 92, 'starvation -8% hp');
ok(starv.damagedCount === 1, 'starvation damaged');

// B5 empire food extended
const statesB5 = new Map([[0, M.freshEmpireFoodState(70)]]);
const efB5 = M.advanceEmpireFood(
  { perCity: [{ ownerId: 0, zywnoscNetto: 10, oblegany: false }] },
  Array.from({ length: 15 }, () => ({ ownerId: 0, typeId: 'woj', camping: false })),
  statesB5, upkeep, params,
);
ok(efB5.byOwner.get(0).glodWojska === true, 'B5 glodWojska large army');

const wyrMeta = M.getImprovementMeta('wyrab');
ok(wyrMeta?.kosztPraca === 5 && wyrMeta?.typ === 'wycinka', 'wyrab clearing start cost 5P');
const tarMeta = M.getImprovementMeta('tartak');
ok(tarMeta?.techId === 'Obróbka drewna', 'tartak tech');
ok(!M.isImprovementTechUnlocked('tartak', new Set()), 'tartak locked without tech');
ok(M.isImprovementTechUnlocked('tartak', new Set(['Obróbka drewna'])), 'tartak unlocked');
ok(!M.isImprovementTechUnlocked('farma', new Set(['Garncarstwo'])), 'farma needs Rolnictwo not Garncarstwo');
ok(M.isImprovementTechUnlocked('farma', new Set(['Rolnictwo'])), 'farma unlocked with Rolnictwo');
const farmaHint = M.getImprovementLockHint('farma', new Set());
ok(farmaHint && farmaHint.includes('Rolnictwo'), 'farma lock hint');
ok(M.getImprovementMeta('fort')?.techId === 'Wojskowość', 'fort tech Wojskowość B1-Q4');
ok(!M.isImprovementTechUnlocked('posterunek', new Set(['Obróbka drewna'])), 'posterunek T-TECH-3 needs Murarstwo too');
ok(!M.isImprovementTechUnlocked('posterunek', new Set(['Murarstwo'])), 'posterunek T-TECH-3 needs Obróbka drewna too');
ok(M.isImprovementTechUnlocked('posterunek', new Set(['Obróbka drewna', 'Murarstwo'])), 'posterunek unlocked with both tech');
const postHint = M.getImprovementLockHint('posterunek', new Set());
ok(postHint && postHint.includes('Obróbka drewna') && postHint.includes('Murarstwo'), 'posterunek lock hint both tech');
ok(M.foundCityWorkCost() === 20, 'found city cost 20P osadnik');
ok(M.canAffordFoundCity(19, 5).ok === false, 'cannot afford 19P');
ok(M.canAffordFoundCity(20, 2).ok === true, 'can afford 20P pop2');
const cities = [
  { id: 'c1', ownerId: 0, population: 3 },
  { id: 'c2', ownerId: 0, population: 5 },
];
const src = M.pickSourceCityForFounding(cities, 0);
ok(src?.id === 'c2', 'FOUND Q1 A+B picks largest pop>=2');
const tied = [
  { id: 'c1', ownerId: 0, population: 4 },
  { id: 'c2', ownerId: 0, population: 4 },
];
ok(M.pickSourceCityForFounding(tied, 0, () => 0)?.id === 'c1', 'FOUND tie rand low picks first tied');
ok(M.pickSourceCityForFounding(tied, 0, () => 0.99)?.id === 'c2', 'FOUND tie rand high picks second tied');
const aff = M.evaluateFoundCityAffordance(25, cities, 0);
ok(aff.ok && aff.sourceCityId === 'c2', 'evaluate afford subsequent city');
const affFirst = M.evaluateFoundCityAffordance(0, [], 0);
ok(affFirst.ok && affFirst.kosztPraca === 0, 'FOUND Q2A first city free');
const clr = M.freshClearingState('wyrab', 0);
ok(clr && clr.turnsLeft === 1, 'clearing 1 turn (decyzja Maciej 2026-07-24: 1 tura, 5 Drewna)');
const t1 = M.tickHexClearing(clr);
ok(t1.pracaGrant === 5 && t1.expired === true, 'clearing tick 5, expired po 1 turze');

try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE); } catch (_) {}

console.log(`grupa-b-lane-test: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
