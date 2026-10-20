'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const esbuild = require('../node_modules/esbuild');
const root = path.resolve(__dirname, '..');

(async () => {
  const result = await esbuild.build({
    stdin: { contents: "export * from './src/game/production';", resolveDir: root, loader: 'ts' },
    bundle: true, platform: 'node', format: 'cjs', write: false, logLevel: 'silent',
  });
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', result.outputFiles[0].text)(require, mod, mod.exports);
  const M = mod.exports;
  let checks = 0;
  const eq = (actual, expected, label) => { assert.equal(actual, expected, label); checks++; };
  const romeMatrix = M.civProductionCostBonusyForCivKey('rzymianie');
  const zuluMatrix = M.civProductionCostBonusyForCivKey('zulusi');
  const greekMatrix = M.civProductionCostBonusyForCivKey('grecy');
  eq(romeMatrix.find(b => b.matrixParamId === 'prod_koszt_budynku_proc')?.wartosc, .2, 'approved matrix source resolves Rome building 20%');
  eq(zuluMatrix.find(b => b.matrixParamId === 'prod_koszt_jednostki_proc')?.wartosc, .1, 'approved matrix source resolves Zulu unit 10%');
  eq(greekMatrix.find(b => b.matrixParamId === 'prod_koszt_budynku_proc')?.wartosc, 0, 'zero source cell remains an explicit precedence marker');
  eq(M.unitMoneyCost(17, zuluMatrix, undefined, 0, 'normal', 'Wojownik'), 15, 'source-resolved ordinary Zulu cost reaches unit consumer');
  const adapterSource = fs.readFileSync(path.join(root, 'src/ui/entityCards/buildingAdapter.ts'), 'utf8');
  if (!/buildingWorkCost\(baseWork, cityState\.civBonusy, cityState\.buildCostPace, cityState\.ownerId, cityState\.difficulty\)/.test(adapterSource)) throw new Error('entity-card building quote does not forward owner civ effects');
  checks++;
  const cityPanelSource = fs.readFileSync(path.join(root, 'src/ui/cityPanel.ts'), 'utf8');
  if (!/buildingWorkCost\(baseWork, cfg\.getCivBonusy\?\.\(ownerId\), pace, ownerId, difficulty\)/.test(cityPanelSource)) throw new Error('legacy city-panel building quote does not forward owner civ effects');
  if (!/ownerId = city\?\.ownerId \?\? 0;[\s\S]{0,400}civBonusy: cfg\.getCivBonusy\?\.\(ownerId\)/.test(cityPanelSource)) throw new Error('entity-card city-panel quote does not resolve the city owner');
  checks++;
  const legacyRome = [{ typ: 'koszt_redukcja', cel: 'budynki', wartosc: .2, realizuje: 'miasto' }];
  const matrixRome = [...legacyRome, { typ: 'koszt_redukcja', cel: 'budynki', wartosc: .2, realizuje: 'miasto', matrixParamId: 'prod_koszt_budynku_proc' }];
  const zeroRome = [...legacyRome, { typ: 'koszt_redukcja', cel: 'budynki', wartosc: 0, realizuje: 'miasto', matrixParamId: 'prod_koszt_budynku_proc' }];
  // 400 stays 400 through the existing production multipliers, isolating the civ layer.
  eq(M.buildingWorkCost(400, legacyRome), 400, 'legacy-only Rome reduction is inert without matrix marker');
  eq(M.buildingWorkCost(400, matrixRome), 320, 'F04 replaces same Roman effect exactly once');
  eq(M.buildingWorkCost(400, zeroRome), 400, 'zero F04 marker replaces same legacy effect');

  const f04Zulu = { typ: 'koszt_redukcja', cel: 'jednostki', wartosc: .1, realizuje: 'ekonomia', matrixParamId: 'prod_koszt_jednostki_proc' };
  const g11Zulu = { typ: 'koszt_redukcja', cel: 'Impi', wartosc: .1, realizuje: 'ekonomia', matrixParamId: 'walka_koszt_rekrutacji_proc' };
  const sameEffectLegacy = { typ: 'koszt_redukcja', cel: 'jednostki', wartosc: .2, opis: 'Koszt rekrutacji -20%', realizuje: 'ekonomia' };
  const legacyImpiOnly = { typ: 'koszt_redukcja', cel: 'Impi', wartosc: .1, opis: 'Koszt rekrutacji Impi -10%', realizuje: 'ekonomia' };
  eq(M.unitMoneyCost(17, [f04Zulu], undefined, 0, 'normal', 'Wojownik'), 15, 'ordinary Zulu unit gets only F04 10%');
  eq(M.unitMoneyCost(17, [f04Zulu, g11Zulu], undefined, 0, 'normal', 'Impi'), 13, 'Impi receives additive F04 and G11 with one floor');
  eq(M.unitMoneyCost(17, [f04Zulu, g11Zulu], undefined, 0, 'normal', 'Wojownik'), 15, 'G11 remains Impi-only');
  eq(M.unitMoneyCost(17, [], undefined, 0, 'normal', 'Wojownik'), 17, 'other civ has no cost reduction');
  eq(M.unitMoneyCost(17, [f04Zulu, sameEffectLegacy], undefined, 0, 'normal', 'Wojownik'), 15, 'F04 replaces overlapping legacy unit reduction');
  eq(M.unitMoneyCost(17, [{ ...f04Zulu, wartosc: 0 }, sameEffectLegacy], undefined, 0, 'normal', 'Wojownik'), 17, 'zero F04 replaces overlapping legacy unit reduction');
  eq(M.unitMoneyCost(17, [f04Zulu, legacyImpiOnly], undefined, 0, 'normal', 'Impi'), 15, 'legacy Impi numeric agreement is inert alongside F04');
  eq(M.unitMoneyCost(17, [legacyImpiOnly], undefined, 0, 'normal', 'Impi'), 17, 'legacy-only Impi numeric agreement is inert');
  eq(M.unitMoneyCost(17, [f04Zulu, legacyImpiOnly], undefined, 0, 'normal', 'Wojownik'), 15, 'legacy Impi scope does not leak to ordinary units');
  eq(M.unitMoneyCost(17, [f04Zulu, { ...legacyImpiOnly, realizuje: 'walka_wygaszone' }], undefined, 0, 'normal', 'Impi'), 15, 'historical inactive Impi note is ignored');
  eq(M.unitMoneyCost(17, [f04Zulu, g11Zulu], 'normalny', 0, 'hard', 'Impi'), 52, 'single discount floor precedes pace and difficulty');
  console.log(`pr141-f04-cost-activation-test: ${checks} passed, 0 failed`);
})().catch(error => { console.error(error); process.exitCode = 1; });
