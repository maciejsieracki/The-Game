'use strict';

// Exercise the real matrix resolver and MP consumers. Fixtures exist only in
// esbuild's virtual JSON loader; the checked-in civilization data is untouched.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const esbuild = require('../node_modules/esbuild');
const root = process.env.MANPOWER_TEST_ROOT || path.resolve(__dirname, '..');
const matrix = JSON.parse(fs.readFileSync(path.join(root, 'data/civ-matrix.json'), 'utf8'));
const fields = ['mp_regen_proc', 'mp_max_proc', 'mp_koszt_jednostki_proc'];

async function compile(field) {
  const fixture = structuredClone(matrix);
  if (field) {
    for (const row of fixture.cywilizacje) row.params[field] = 0.731;
  }
  const result = await esbuild.build({
    stdin: {
      contents: `
        export * from './src/game/manpower';
        export { advanceRecruitmentGated } from './src/game/production';
      `,
      resolveDir: root,
      loader: 'ts',
    },
    bundle: true, platform: 'node', format: 'cjs', write: false, logLevel: 'silent',
    plugins: [{ name: 'matrix-fixture', setup(build) {
      build.onLoad({ filter: /\/data\/civ-matrix\.json$/ }, () => ({
        contents: JSON.stringify(fixture), loader: 'json',
      }));
    } }],
  });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', result.outputFiles[0].text)(require, module, module.exports);
  return module.exports;
}

async function main() {
  let checks = 0;
  const equal = (actual, expected, label) => {
    assert.deepEqual(actual, expected, label);
    checks++;
  };
  const base = await compile();
  // Execute the actual main.ts MP resolver, including the second hotseat human.
  const mainSource = fs.readFileSync(path.join(root, 'src/main.ts'), 'utf8');
  const ownerHelper = mainSource.match(/function civManpowerMultsForOwner\(ownerId: number\) \{([\s\S]*?)\n    \}/);
  assert(ownerHelper, 'MP owner helper must be extractable');
  const ownerKeyHelper = mainSource.match(/function civKeyForOwnerId\(ownerId: number\): string \{([\s\S]*?)\n    \}/);
  assert(ownerKeyHelper, 'canonical civKey owner resolver must be extractable');
  const helperJs = esbuild.transformSync(`function resolve(ownerId: number) {${ownerHelper[1]}\n}`, { loader: 'ts' }).code;
  const ownerKeyJs = esbuild.transformSync(`function civKeyForOwnerId(ownerId: number) {${ownerKeyHelper[1]}\n}`, { loader: 'ts' }).code;
  const humanCivs = new Map([[0, 'grecy'], [7, 'rzymianie'], [42, 'zulusi']]);
  const aiCivs = new Map([[99, 'zulusi']]);
  const civData = require('../data/civs.json');
  const ownerParams = {
    grecy: { mp_regen_proc: -0.15, mp_max_proc: 0.1, mp_koszt_jednostki_proc: 0.2 },
    rzymianie: { mp_regen_proc: 0.35, mp_max_proc: 0.4, mp_koszt_jednostki_proc: -0.3 },
    zulusi: { mp_regen_proc: 0.2, mp_max_proc: 0.6, mp_koszt_jednostki_proc: -0.1 },
  };
  const actualCivKeyForOwnerId = new Function('_menuCivIdByOwner', 'playerCivTypeByHuman', 'player', 'aiOwnerCivMap',
    'data', 'loadCivMatrix', 'HUMAN_OWNER_PRIMARY', `${ownerKeyJs}; return civKeyForOwnerId;`)(
    humanCivs, new Map(), { civType: 'grecy' }, aiCivs, { civs: civData }, () => matrix, 0);
  const resolve = new Function('_menuCivIdByOwner', 'civKeyForOwnerId', 'player', 'civBonusyForCivKey',
    'data', 'civManpowerMults', 'civManpowerMatrixMults', `${helperJs}; return resolve;`)(
    humanCivs, actualCivKeyForOwnerId,
    { civBonusy: [] }, () => [], { civs: civData }, () => ({ regenMult: 1, maxMult: 1, costMult: 1 }),
    (key, _, legacy) => base.civManpowerMatrixMults(key, ownerParams[key], legacy));
  for (const [ownerId, key] of [...humanCivs, ...aiCivs]) {
    assert.equal(actualCivKeyForOwnerId(ownerId), key, `actual owner resolver maps ${ownerId} to ${key}`);
    const params = ownerParams[key];
    equal(resolve(ownerId), { regenMult: 1 + params.mp_regen_proc, maxMult: 1 + params.mp_max_proc,
      costMult: 1 + params.mp_koszt_jednostki_proc }, `actual main MP resolver preserves owner ${ownerId} civilization`);
  }
  assert.equal(actualCivKeyForOwnerId(1234), '', 'unknown owner does not inherit Greece or another display fallback');
  equal(resolve(1234), { regenMult: 1, maxMult: 1, costMult: 1 }, 'unknown owner reaches neutral matrix multiplier fallback');

  for (const row of matrix.cywilizacje) {
    const fallback = { regenMult: 9, maxMult: 8, costMult: 7 };
    const actual = base.civManpowerMatrixMults(row.ikonaId, undefined, fallback);
    equal(actual, {
      regenMult: 1 + row.params.mp_regen_proc,
      maxMult: 1 + row.params.mp_max_proc,
      costMult: 1 + row.params.mp_koszt_jednostki_proc,
    }, `${row.ikonaId}: matrix wins over legacy without stacking`);
  }
  equal(base.civManpowerMatrixMults(undefined, undefined, { regenMult: 2, maxMult: 3, costMult: 4 }),
    { regenMult: 1, maxMult: 1, costMult: 1 }, 'missing owner is neutral and does not borrow legacy fallback');
  equal(base.civManpowerMatrixMults(undefined, { mp_regen_proc: NaN, mp_max_proc: Infinity },
    { regenMult: 2, maxMult: 3, costMult: 4 }),
  { regenMult: 1, maxMult: 1, costMult: 1 }, 'nonfinite overrides and poisoned fallback remain neutral');

  for (const field of fields) {
    const changed = await compile(field);
    for (const row of matrix.cywilizacje) {
      const before = base.civManpowerMatrixMults(row.ikonaId);
      const after = changed.civManpowerMatrixMults(row.ikonaId);
      const key = field === fields[0] ? 'regenMult' : field === fields[1] ? 'maxMult' : 'costMult';
      assert.notEqual(after[key], before[key], `${row.ikonaId}/${field}: changed input reaches resolver`);
      checks++;
      for (const other of ['regenMult', 'maxMult', 'costMult'].filter(k => k !== key)) {
        equal(after[other], before[other], `${field} leaves ${other} unchanged`);
      }
      const consume = (api, m) => field === fields[0]
        ? api.manpowerRegenGain(10, 1, { regenProcMaxPerTurn: 2, blockWhenBesieged: true }, m.regenMult, m.maxMult)
        : field === fields[1] ? api.cityManpowerMax(10, 1, m.maxMult)
          : api.unitManpowerCostForType('Wojownik', 1, m.maxMult, m.costMult);
      assert.notEqual(consume(changed, after), consume(base, before), `${row.ikonaId}/${field}: real consumer responds`);
      checks++;
    }
  }

  // Distinct max/cost values expose accidentally passing the max as the price.
  for (const ownerId of [0, 1]) {
    const m = base.civManpowerMatrixMults(undefined, {
      mp_regen_proc: 0.25, mp_max_proc: 0.5, mp_koszt_jednostki_proc: -0.25,
    });
    const cities = [{ id: 'city', ownerId, population: 10, manpower: 1000 }];
    const saved = JSON.parse(JSON.stringify(cities));
    equal(base.canAffordUnitManpowerEmpire(saved, ownerId, saved[0], 1, 0, m.maxMult, 'Wojownik', m.costMult),
      true, 'player/AI can afford independent cost after state round-trip');
    const purchase = base.tryDeductUnitSpawnCostsEmpire(saved, 'city', ownerId, 1, 0, m.maxMult, 'Wojownik', m.costMult);
    equal(purchase.ok, true, 'purchase succeeds');
    equal(saved[0].manpower, 250, 'purchase deducts cost, not cap multiplier');
    base.refundManpowerToEmpire(saved, ownerId, 1,
      base.unitManpowerCostForType('Wojownik', 1, m.maxMult, m.costMult), m.maxMult);
    equal(saved[0].manpower, 1000, 'refund restores exactly the purchase cost');
    equal(base.cityManpowerSnapshot(saved[0], 1, m.regenMult, m.maxMult, m.costMult).kosztJednostki,
      750, 'preview agrees with charged cost');
    equal(base.unitManpowerCostForType('Zwiadowca', 1, m.maxMult, m.costMult), 0, 'scout remains free');
    const unit = { id: 'unit', ownerId, typeId: 'Wojownik', category: 'piechota', hp: 10, hpMax: 100, q: 0, r: 0 };
    const healing = base.tickManpowerUnitReplenishment(saved, [unit], 'normal', () => 1,
      () => [], () => 100, undefined, undefined,
      id => id === ownerId ? { mp_max_proc: 0.5, mp_koszt_jednostki_proc: -0.25 } : undefined);
    equal(healing.healedCount, 1, 'owner matrix reaches replenishment');
    equal(unit.hp, 40, 'normal replenishment preserves the 30% healing cap');
    equal(healing.totalMpSpent, 225, 'healing pays independent cost, not cap multiplier');
    equal(saved[0].manpower, 775, 'healing updates the same owner pool');
  }
  const emptyPool = [{ id: 'empty', ownerId: 1, population: 10, manpower: 0 }];
  const freeUnit = { id: 'free', ownerId: 1, typeId: 'Wojownik', category: 'piechota', hp: 10, hpMax: 100, q: 0, r: 0 };
  const freeHeal = base.tickManpowerUnitReplenishment(emptyPool, [freeUnit], 'normal', () => 1,
    () => [], () => 100, undefined, undefined, () => ({ mp_koszt_jednostki_proc: -1 }));
  equal(freeHeal, { healedCount: 1, totalMpSpent: 0 }, 'zero-cost healing does not require a nonempty MP pool');
  equal(freeUnit.hp, 40, 'zero-cost healing keeps the normal healing cap');
  equal(emptyPool[0].manpower, 0, 'free healing never creates or spends MP');
  console.log(`manpower-matrix-sensitivity-test: ${checks} passed, 0 failed`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
