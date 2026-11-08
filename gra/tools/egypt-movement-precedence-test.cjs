'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const esbuild = require('../node_modules/esbuild');
const root = path.resolve(__dirname, '..');
const raw = JSON.parse(fs.readFileSync(path.join(root, 'data/civ-matrix.json'), 'utf8'));

async function compile(chariotValue) {
  const fixture = structuredClone(raw);
  const egypt = fixture.cywilizacje.find(row => row.ikonaId === 'egipt');
  const greeks = fixture.cywilizacje.find(row => row.ikonaId === 'grecy');
  egypt.params.walka_ruch_bitwa_proc = 0.31;
  egypt.params.walka_ruch_rydwany = chariotValue;
  greeks.params.walka_ruch_bitwa_proc = 0.23;
  const result = await esbuild.build({
    stdin: { contents: `
      export { civMatrixBonusyForCivKey, civMovementMultiplier } from './src/game/civ-bonuses';
      export { moveCostFnFor } from './src/game/embarkation';
      export { TerenBazowy } from './src/types/hex';
    `, resolveDir: root, loader: 'ts' },
    bundle: true, platform: 'node', format: 'cjs', write: false, logLevel: 'silent',
    plugins: [{ name: 'movement-fixture', setup(build) {
      build.onLoad({ filter: /\/data\/civ-matrix\.json$/ }, () => ({
        contents: JSON.stringify(fixture), loader: 'json',
      }));
    } }],
  });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', result.outputFiles[0].text)(require, module, module.exports);
  return module.exports;
}

(async () => {
  let checks = 0;
  function near(actual, expected, label) {
    assert(Math.abs(actual - expected) < 1e-9, `${label}: ${actual} != ${expected}`);
    checks++;
  }
  const chariot = { typNazwa: 'Rydwan', rola: 'flanka' };
  const infantry = { typNazwa: 'Wojownik', rola: 'piechota' };
  for (const value of [0.17, 0, -0.1]) {
    const api = await compile(value);
    const egypt = api.civMatrixBonusyForCivKey('egipt');
    const greek = api.civMatrixBonusyForCivKey('grecy');
    near(api.civMovementMultiplier(egypt, chariot), 1 + value, 'specific Egyptian field replaces general');
    near(api.civMovementMultiplier(egypt, infantry), 1, 'Egyptian chariot bonus excludes infantry');
    near(api.civMovementMultiplier(greek, infantry), 1.23, 'other civilization keeps general battle bonus');
    near(api.civMovementMultiplier([], chariot), 1, 'no bonuses stays neutral');
    const water = { terenBazowy: api.TerenBazowy.PlytkieMorze, nakladka: null, q: 0, r: 0 };
    const egyptMove = api.moveCostFnFor({ typeId: 'Rydwan', category: 'piechota' }, true, egypt);
    near(egyptMove(water), 1, 'Egyptian battle bonus never reduces shallow-sea entry cost');
    const dedicated = [{ typ: 'bonus_walka', cel: 'piechota', wartosc: 0.25,
      matrixParamId: 'walka_ruch_piechota_teren_plytkie_morze' }];
    const infantryMove = api.moveCostFnFor({ typeId: 'Wojownik', category: 'piechota' }, true,
      [...greek.filter(b => b.matrixParamId === 'walka_ruch_bitwa_proc'), ...dedicated]);
    near(infantryMove(water), 1 / 1.48, 'other civilizations retain general and dedicated shallow-sea bonuses');
    const zulu = api.civMatrixBonusyForCivKey('zulusi');
    near(api.moveCostFnFor({ typeId: 'Wojownik', category: 'piechota' }, true, zulu)(water),
      1 / 1.2, 'Zulu general movement still reduces shallow-sea entry cost');
    assert.equal(api.moveCostFnFor({ typeId: 'Rydwan', category: 'piechota' }, false, egypt), undefined,
      'movement bonus does not bypass seafaring requirement');
    checks++;
  }
  console.log(`egypt-movement-precedence-test: ${checks} passed, 0 failed`);
})().catch(error => { console.error(error); process.exitCode = 1; });
