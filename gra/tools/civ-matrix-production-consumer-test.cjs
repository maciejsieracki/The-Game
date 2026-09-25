'use strict';
/** Consumer-level runtime regression test for production civ-matrix parameters. */
const fs = require('fs');
const path = require('path');
const esbuild = require(process.env.ESBUILD_MODULE || path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const entry = path.resolve(__dirname, '.civ-matrix-production-entry.ts');
const bundle = path.resolve(__dirname, '.civ-matrix-production-bundle.cjs');
fs.writeFileSync(entry, `
export {
  buildingWorkCost,
  unitMoneyCost,
  advanceProduction,
  advanceRecruitmentGated,
  rushCost,
} from '../src/game/production';
`);
esbuild.buildSync({
  entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: bundle, loader: { '.json': 'json', '.ts': 'ts' }, logLevel: 'silent',
});
const { buildingWorkCost, unitMoneyCost, advanceProduction, advanceRecruitmentGated, rushCost } = require(bundle);

let passed = 0;
let failed = 0;
function check(condition, label, detail = '') {
  if (condition) { passed++; console.log(`PASS ${label}`); }
  else { failed++; console.error(`FAIL ${label}${detail ? ` — ${detail}` : ''}`); }
}
function closeTo(actual, expected, label) {
  check(Math.abs(actual - expected) < 1e-9, label, `got ${actual}, want ${expected}`);
}

const civs = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'data/civ-matrix.json'), 'utf8')).cywilizacje;
check(civs.length === 15, 'all 15 civ rows loaded');
const values = {
  grecy: { prod_koszt_budynku_proc: 0.1, prod_koszt_jednostki_proc: 0.1, prod_szybkosc_budynku_proc: 0.1, prod_szybkosc_jednostki_proc: 0.1, prod_rush_koszt_proc: 0.1 },
  rzymianie: { prod_koszt_budynku_proc: -0.1, prod_koszt_jednostki_proc: -0.1, prod_szybkosc_budynku_proc: -0.1, prod_szybkosc_jednostki_proc: -0.1, prod_rush_koszt_proc: -0.1 },
};
const calls = new Set();
function resolve(civKey, paramId) {
  calls.add(`${civKey}:${paramId}`);
  return values[civKey]?.[paramId] ?? 0;
}
const options = civKey => ({ civKey, resolveParam: resolve });
const legacyBuildingBonus = [{ realizuje: 'miasto', typ: 'koszt_redukcja', cel: 'budynki', wartosc: 0.2 }];
const legacyUnitBonus = [{ realizuje: 'ekonomia', typ: 'koszt_redukcja', cel: 'rekrutacja', wartosc: 0.2, opis: 'Tania rekrutacja' }];

closeTo(buildingWorkCost(100, legacyBuildingBonus, undefined, 0, 'normal', options('grecy')), 90, 'building +10% matrix discount, no double legacy discount');
closeTo(buildingWorkCost(100, legacyBuildingBonus, undefined, 0, 'normal', options('rzymianie')), 110, 'building -10% matrix value increases cost');
check(buildingWorkCost(100, legacyBuildingBonus) === 80, 'building legacy path unchanged without civKey');
closeTo(unitMoneyCost(100, legacyUnitBonus, undefined, 0, 'normal', options('grecy')), 90, 'unit +10% matrix discount, no double legacy discount');
closeTo(unitMoneyCost(100, legacyUnitBonus, undefined, 0, 'normal', options('rzymianie')), 110, 'unit -10% matrix value increases cost');

const building = { kolejka: [{ kind: 'budynek', id: 'b', nazwa: 'B', koszt: 100 }], postep: 0 };
closeTo(advanceProduction(building, 10, options('grecy')).prod.postep, 11, 'building speed +10%');
closeTo(advanceProduction(building, 10, options('rzymianie')).prod.postep, 9, 'building speed -10%');
const unit = { kolejka: [{ kind: 'jednostka', id: 'u', nazwa: 'U', koszt: 100 }], postep: 0 };
closeTo(advanceProduction(unit, 10, options('grecy')).prod.postep, 11, 'unit speed +10%');

const recruitItem = { kind: 'jednostka', id: 'u', nazwa: 'U', koszt: 1 };
const recruitStart = { kolejka: [], postep: 0, rekrutacja: [recruitItem, recruitItem], rekrutacjaPostep: 0 };
const recruitSlow = advanceRecruitmentGated(recruitStart, { population: 10, manpower: 10 }, 2, 1, true, 1, 1, options('grecy'));
closeTo(recruitSlow.prod.rekrutacjaPostep, 0.1, 'recruitment fractional progress stores +10%');
check(recruitSlow.completed.length === 1, 'recruitment completes one unit at 1.1 throughput');
const recruitBurst = advanceRecruitmentGated(recruitSlow.prod, { population: 10, manpower: 10 }, 2, 1, true, 1, 1, options('grecy'));
check(recruitBurst.completed.length === 1 && !recruitBurst.prod.rekrutacja, 'fractional remainder completes queued unit');

const rushQueue = { kolejka: [{ kind: 'budynek', id: 'b', nazwa: 'B', koszt: 100 }], postep: 0 };
check(rushCost(rushQueue, options('grecy')) === 90, 'rush +10% matrix discount');
check(rushCost(rushQueue, options('rzymianie')) === 110, 'rush -10% matrix value increases cost');

for (const civ of civs) {
  const neutral = options(civ.ikonaId);
  advanceProduction(building, 1, neutral);
  advanceProduction(unit, 1, neutral);
  advanceRecruitmentGated(recruitStart, { population: 10, manpower: 10 }, 2, 1, true, 1, 1, neutral);
  buildingWorkCost(100, undefined, undefined, 0, 'normal', neutral);
  unitMoneyCost(100, undefined, undefined, 0, 'normal', neutral);
  rushCost(rushQueue, neutral);
}
for (const id of ['prod_koszt_budynku_proc', 'prod_koszt_jednostki_proc', 'prod_szybkosc_budynku_proc', 'prod_szybkosc_jednostki_proc', 'prod_rush_koszt_proc']) {
  check([...calls].some(call => call.endsWith(`:${id}`)), `runtime resolver consumed ${id}`);
}
console.log(`\n[civ-matrix-production-consumer-test] ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(entry); fs.unlinkSync(bundle); } catch {}
process.exit(failed ? 1 : 0);
