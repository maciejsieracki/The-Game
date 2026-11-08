'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('../node_modules/typescript');
const esbuild = require('../node_modules/esbuild');
const root = path.resolve(__dirname, '..');
const matrixPath = path.join(root, 'data/civ-matrix.json');
const matrixBytes = fs.readFileSync(matrixPath);
const matrix = JSON.parse(matrixBytes.toString('utf8'));

async function loadActualModules() {
  const result = await esbuild.build({
    stdin: { contents: `
      export { civMatrixBonusyForCivKey, civMovementMultiplier, civEmbarkationMovementMultiplier } from './src/game/civ-bonuses';
      export { moveCostFnFor } from './src/game/embarkation';
      export { TerenBazowy } from './src/types/hex';
      export { buildingWorkCost, unitMoneyCost, civProductionCostBonusyForCivKey } from './src/game/production';
      export { buildCivMatrixSemanticProfile, buildCivMatrixSemanticSnapshot, classifyCivMatrixCell, civMatrixSemanticPolarity, civMatrixConsumerStatus, civMatrixConsumerEvidence } from './src/game/civ-matrix-semantic';
    `, resolveDir: root, loader: 'ts' },
    bundle: true, platform: 'node', format: 'cjs', write: false, logLevel: 'silent',
  });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', result.outputFiles[0].text)(require, module, module.exports);
  return module.exports;
}

function extractBattleMovementMethod(civMovementMultiplier) {
  const file = path.join(root, 'src/battle/battleScene.ts');
  const sourceText = fs.readFileSync(file, 'utf8');
  const source = ts.createSourceFile(file, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  let method;
  function visit(node) {
    if (ts.isClassDeclaration(node) && node.name?.text === 'BattleScene') {
      method = node.members.find(member => ts.isMethodDeclaration(member) && member.name?.getText(source) === '_movementPointsFor');
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  assert(method?.body, 'actual BattleScene._movementPointsFor method body is present for bounded execution');
  const body = method.body.getText(source);
  return new Function('movementPoints', 'civMovementMultiplier', 'civUnitShapeForBattleUnit', `return function(bu) ${body}`)(
    bu => bu.baseMovement,
    civMovementMultiplier,
    bu => ({ typNazwa: bu.type, rola: bu.role }),
  );
}

(async () => {
  const M = await loadActualModules();
  let checks = 0;
  const eq = (actual, expected, label) => { assert.equal(actual, expected, label); checks++; };
  const near = (actual, expected, label) => { assert(Math.abs(actual - expected) < 1e-9, `${label}: ${actual} != ${expected}`); checks++; };
  const row = key => matrix.cywilizacje.find(civ => civ.ikonaId === key);
  assert(row('egipt') && row('grecy') && row('fenicjanie') && row('zulusi') && row('rzymianie'));

  console.log('--- actual movement adapter and battle movement method ---');
  const egypt = M.civMatrixBonusyForCivKey('egipt');
  const greek = M.civMatrixBonusyForCivKey('grecy');
  const phoenician = M.civMatrixBonusyForCivKey('fenicjanie');
  const zulu = M.civMatrixBonusyForCivKey('zulusi');
  const chariot = { typNazwa: 'Rydwan', rola: 'flanka' };
  const infantry = { typNazwa: 'Wojownik', rola: 'piechota' };
  near(M.civMovementMultiplier(egypt, chariot), 1 + row('egipt').params.walka_ruch_rydwany, 'Egypt uses its specific chariot field once');
  near(M.civMovementMultiplier(egypt, infantry), 1, 'Egypt movement does not leak to infantry');
  near(M.civMovementMultiplier(greek, infantry, '', true), 1 + row('grecy').params.walka_ruch_piechota_teren_plytkie_morze, 'Greek shallow-sea infantry field applies in context');
  near(M.civMovementMultiplier(greek, infantry), 1, 'Greek shallow-sea field does not apply off-context');
  near(M.civMovementMultiplier(phoenician, infantry, '', true), 1 + row('fenicjanie').params.walka_ruch_piechota_teren_plytkie_morze, 'Phoenician shallow-sea infantry field applies in context');
  near(M.civMovementMultiplier(zulu, infantry), 1 + row('zulusi').params.walka_ruch_bitwa_proc, 'Zulu general battle movement applies');
  near(M.civMovementMultiplier([], chariot), 1, 'missing bonus stays neutral');

  const battleMovement = extractBattleMovementMethod(M.civMovementMultiplier);
  const context = { attackerCivBonusy: egypt, defenderCivBonusy: zulu, terrain: 'laka', shallowSea: false };
  eq(battleMovement.call(context, { ownerColor: 1, type: 'Rydwan', role: 'flanka', baseMovement: 5 }), 6,
    'actual BattleScene method applies the Egyptian chariot multiplier');
  eq(battleMovement.call(context, { ownerColor: 0xc84040, type: 'Wojownik', role: 'piechota', baseMovement: 5 }), 6,
    'BattleScene method selects the defender owner bonus');
  const shallowContext = { attackerCivBonusy: greek, defenderCivBonusy: phoenician, terrain: 'plytkie_morze', shallowSea: true };
  eq(battleMovement.call(shallowContext, { ownerColor: 1, type: 'Wojownik', role: 'piechota', baseMovement: 3 }), 5,
    'BattleScene method rounds actual shallow-sea bonus for selected owner');

  console.log('--- actual strategic embarkation gates ---');
  const water = { terenBazowy: M.TerenBazowy.PlytkieMorze, nakladka: null, q: 0, r: 0 };
  const egyptEntry = M.moveCostFnFor({ typeId: 'Rydwan', category: 'piechota' }, true, egypt);
  near(egyptEntry(water), 1, 'Egyptian battle movement does not reduce shallow-sea entry cost');
  const zuluEntry = M.moveCostFnFor({ typeId: 'Wojownik', category: 'piechota' }, true, zulu);
  near(zuluEntry(water), 1 / 1.2, 'Zulu general movement remains effective for shallow-sea entry');
  const greekEntry = M.moveCostFnFor({ typeId: 'Wojownik', category: 'piechota' }, true, greek);
  near(greekEntry(water), 1 / 1.5, 'dedicated Greek shallow-infantry field applies on entry');

  console.log('--- actual discounts, floor, polarity, and pending rush field ---');
  const romeCosts = M.civProductionCostBonusyForCivKey('rzymianie');
  const zuluCosts = M.civProductionCostBonusyForCivKey('zulusi');
  const zuluBattle = M.civMatrixBonusyForCivKey('zulusi');
  eq(M.buildingWorkCost(1000, romeCosts), 800, 'actual Rome building consumer applies approved 20% discount once');
  eq(M.unitMoneyCost(17, zuluCosts, undefined, 1, 'normal', 'Wojownik'), 15, 'actual Zulu unit consumer applies F04 10% discount');
  eq(M.unitMoneyCost(17, [...zuluCosts, ...zuluBattle], undefined, 1, 'normal', 'Impi'), 13,
    'actual Impi consumer stacks approved F04 and G11 discounts then floors once');
  eq(M.unitMoneyCost(17, [...zuluCosts, ...zuluBattle], undefined, 1, 'normal', 'Wojownik'), 15,
    'G11 remains Impi-only for ordinary Zulu unit');
  const greekBattle = M.civMatrixBonusyForCivKey('grecy');
  const unknownOwnerBattle = M.civMatrixBonusyForCivKey('unknown-owner');
  assert(!greekBattle.some(bonus => bonus.matrixParamId === 'walka_koszt_rekrutacji_proc'),
    'known non-Zulu owner receives no G11 marker');
  checks++;
  eq(M.unitMoneyCost(17, greekBattle, undefined, 1, 'normal', 'Impi'), 17,
    'known non-Zulu Impi receives no Zulu G11 discount');
  assert(!unknownOwnerBattle.some(bonus => bonus.matrixParamId === 'walka_koszt_rekrutacji_proc'),
    'unknown owner receives no G11 marker');
  checks++;
  eq(M.unitMoneyCost(17, unknownOwnerBattle, undefined, 1, 'normal', 'Impi'), 17,
    'unknown-owner Impi fails closed without G11 discount');
  eq(M.unitMoneyCost(1, [...zuluCosts, ...zuluBattle], undefined, 1, 'normal', 'Impi'), 1,
    'combined discount preserves minimum cost floor');
  eq(M.civMatrixSemanticPolarity('prod_koszt_budynku_proc'), 'beneficial', 'positive building discount polarity is beneficial');
  eq(M.civMatrixSemanticPolarity('prod_koszt_jednostki_proc'), 'beneficial', 'positive unit discount polarity is beneficial');
  eq(M.civMatrixSemanticPolarity('walka_koszt_rekrutacji_proc'), 'beneficial', 'positive G11 discount polarity is beneficial');
  eq(M.civMatrixSemanticPolarity('prod_rush_koszt_proc'), 'harmful', 'rush-cost field polarity remains harmful');
  eq(M.civMatrixConsumerStatus('prod_rush_koszt_proc'), 'REAL_GAMEPLAY', 'owner-approved rush quote and payment consumer is bounded REAL_GAMEPLAY');
  eq(M.civMatrixConsumerEvidence('prod_rush_koszt_proc').length, 1, 'rush-cost field has its bounded consumer evidence reference');
  for (const [civ, id] of [['rzymianie', 'prod_koszt_budynku_proc'], ['zulusi', 'prod_koszt_jednostki_proc']]) {
    const cell = M.buildCivMatrixSemanticProfile(civ).cells.find(entry => entry.parameterId === id);
    assert(cell.rawValue > 0 && cell.label === 'POZYTYWNY', `${civ}/${id} positive source value is labeled positively`);
    checks++;
  }
  const zuluG11 = M.buildCivMatrixSemanticProfile('zulusi').cells.find(entry => entry.parameterId === 'walka_koszt_rekrutacji_proc');
  assert(zuluG11.rawValue > 0 && zuluG11.polarity === 'beneficial' && zuluG11.label === 'POZYTYWNY',
    'positive Zulu G11 recruitment discount is shown as beneficial');
  checks++;

  console.log('--- exact bounded evidence inventory and no data mutation ---');
  for (const id of ['walka_ruch_bitwa_proc', 'walka_ruch_rydwany', 'walka_ruch_piechota_teren_plytkie_morze', 'walka_koszt_rekrutacji_proc']) {
    eq(M.civMatrixConsumerStatus(id), 'REAL_GAMEPLAY', `${id} has bounded consumer status`);
    eq(M.civMatrixConsumerEvidence(id).length, 1, `${id} has one evidence reference`);
  }
  const egyptGeneralCell = M.buildCivMatrixSemanticProfile('egipt').cells.find(cell => cell.parameterId === 'walka_ruch_bitwa_proc');
  const zuluGeneralCell = M.buildCivMatrixSemanticProfile('zulusi').cells.find(cell => cell.parameterId === 'walka_ruch_bitwa_proc');
  const directInput = cell => ({
    parameterId: cell.parameterId, civilizationId: cell.civilizationId, civilizationName: cell.civilizationName,
    rawValue: cell.rawValue, baselineValue: cell.baselineValue, minValue: cell.minValue, maxValue: cell.maxValue,
  });
  const directEgypt = M.classifyCivMatrixCell(directInput(egyptGeneralCell));
  const forcedEgyptActive = M.classifyCivMatrixCell({ ...directInput(egyptGeneralCell), consumerStatus: 'REAL_GAMEPLAY' });
  const directZulu = M.classifyCivMatrixCell(directInput(zuluGeneralCell));
  eq(egyptGeneralCell.consumerStatus, 'BLOCKED', 'Egypt general movement cell is excluded by owner decision 1B');
  assert(egyptGeneralCell.statusReasonPl.includes('decyzją właściciela 1B') && egyptGeneralCell.statusReasonPl.includes('rydwanów'),
    'Egypt cell records the resolved chariot-specific precedence');
  checks++;
  eq(zuluGeneralCell.consumerStatus, 'REAL_GAMEPLAY', 'Zulu general movement cell remains active under the same per-ID classifier');
  eq(directEgypt.consumerStatus, 'BLOCKED', 'direct canonical classifier defaults Egypt general movement to excluded');
  eq(directEgypt.statusLabelPl, 'ZABLOKOWANE', 'direct Egypt API shows the excluded status label');
  assert(directEgypt.statusReasonPl.includes('decyzją właściciela 1B') && directEgypt.explanationPl.includes('zastąpione'),
    'direct Egypt API carries the resolved 1B reason and explanation');
  checks++;
  eq(directEgypt.label, egyptGeneralCell.label, 'direct and profile Egypt cells preserve the same descriptive direction label');
  eq(forcedEgyptActive.consumerStatus, 'BLOCKED', 'explicit REAL_GAMEPLAY cannot override Egypt 1B exclusion');
  eq(directZulu.consumerStatus, 'REAL_GAMEPLAY', 'direct canonical classifier keeps Zulu general movement active');
  const invalidEgypt = M.classifyCivMatrixCell({ ...directInput(egyptGeneralCell), rawValue: null, consumerStatus: 'REAL_GAMEPLAY' });
  eq(invalidEgypt.consumerStatus, 'BLOCKED', 'invalid Egypt cell remains blocked before owner exception logic');
  assert(invalidEgypt.statusReasonPl.includes('Brak wartości') && !invalidEgypt.statusReasonPl.includes('decyzją właściciela 1B'),
    'invalid-data reason retains precedence over the resolved owner exception');
  checks++;
  eq(fs.readFileSync(matrixPath).compare(matrixBytes), 0, 'source matrix file remains byte-identical after in-memory test execution');
  const source = fs.readFileSync(path.join(root, 'src/battle/battleScene.ts'), 'utf8');
  assert(source.includes('base * civMovementMultiplier(bonuses, civUnitShapeForBattleUnit(bu), this.terrain, this.shallowSea)'));
  checks++;
  console.log(`pr141-semantic-consumer-consistency-test: ${checks} passed, 0 failed`);
})().catch(error => { console.error(error); process.exitCode = 1; });
