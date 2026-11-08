'use strict';
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('../node_modules/typescript');
const esbuild = require('../node_modules/esbuild');

const root = path.resolve(__dirname, '..');
const matrix = JSON.parse(fs.readFileSync(path.join(root, 'data/civ-matrix.json'), 'utf8'));
const civs = JSON.parse(fs.readFileSync(path.join(root, 'data/civs.json'), 'utf8'));
const buildings = JSON.parse(fs.readFileSync(path.join(root, 'data/buildings.json'), 'utf8'));
const units = JSON.parse(fs.readFileSync(path.join(root, 'data/units.json'), 'utf8'));
const workbook = fs.readFileSync(path.join(root, '../panele-sterowania/Cyw-macierz-REVIEW.xlsx'));
assert.equal(crypto.createHash('sha256').update(workbook).digest('hex'), 'c285c410012d0fca67acf40200f03ace4cf98bd538fde40c3ea3799c79a62f32', 'approved workbook source hash');

function sourceFunction(source, name) {
  const file = ts.createSourceFile('source.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  let found;
  const walk = node => {
    if (ts.isFunctionDeclaration(node) && node.name?.text === name) found = ts.transpile(node.getText(file), { target: ts.ScriptTarget.ES2022 });
    ts.forEachChild(node, walk);
  };
  walk(file);
  assert.ok(found, `function ${name} exists in production source`);
  return found;
}

function sourceCall(source, predicate) {
  const file = ts.createSourceFile('source.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  let found;
  const walk = node => {
    if (ts.isCallExpression(node) && predicate(node)) found = node.getText(file);
    ts.forEachChild(node, walk);
  };
  walk(file);
  assert.ok(found, 'expected source call expression exists');
  return found;
}

(async () => {
  const result = await esbuild.build({
    stdin: { contents: "export * from './src/game/production'; export { civBonusyForCivKey } from './src/game/economy'; export { civMatrixBonusyForCivKey } from './src/game/civ-bonuses'; export { loadCivMatrix } from './src/game/civ-matrix';", resolveDir: root, loader: 'ts' },
    bundle: true, platform: 'node', format: 'cjs', write: false, logLevel: 'silent',
  });
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', result.outputFiles[0].text)(require, mod, mod.exports);
  const M = mod.exports;
  let checks = 0;
  const eq = (actual, expected, label) => { assert.equal(actual, expected, label); checks++; };

  // Validate the source-backed factory for every row, including all explicit zeros.
  const expectedBuilding = { rzymianie: .2 };
  const expectedUnit = { zulusi: .1 };
  for (const row of matrix.cywilizacje) {
    const costBonuses = M.civProductionCostBonusyForCivKey(row.ikonaId);
    eq(costBonuses.length, 2, `${row.ikonaId}: factory supplies both approved cost IDs`);
    eq(costBonuses.find(b => b.matrixParamId === 'prod_koszt_budynku_proc')?.wartosc,
      expectedBuilding[row.ikonaId] ?? 0, `${row.ikonaId}: exact building cell`);
    eq(costBonuses.find(b => b.matrixParamId === 'prod_koszt_jednostki_proc')?.wartosc,
      expectedUnit[row.ikonaId] ?? 0, `${row.ikonaId}: exact unit cell`);
  }
  eq(M.civProductionCostBonusyForCivKey('unknown-civ').length, 0, 'unknown civ has no replacement markers');

  // Execute the actual owner resolver declarations from main.ts with bounded game-state fixtures.
  const mainSource = fs.readFileSync(path.join(root, 'src/main.ts'), 'utf8');
  const resolver = [sourceFunction(mainSource, 'civTypeForOwner'),
    sourceFunction(mainSource, 'civKeyForOwnerId'), sourceFunction(mainSource, 'civBonusyForOwnerId')].join('\n');
  const state = {
    _menuCivIdByOwner: new Map([[0, 'rzymianie'], [42, 'zulusi']]),
    playerCivTypeByHuman: new Map(),
    HUMAN_OWNER_PRIMARY: 0,
    _menuCivId: 'egipt',
    isMeSafe: ownerId => ownerId === 0 || ownerId === 42,
    player: { civType: 'grecy', civBonusy: [] },
    aiOwnerCivMap: new Map([[99, 'zulusi']]),
    civBonusyForCivKey: M.civBonusyForCivKey,
    civMatrixBonusyForCivKey: M.civMatrixBonusyForCivKey,
    civProductionCostBonusyForCivKey: M.civProductionCostBonusyForCivKey,
    loadCivMatrix: M.loadCivMatrix,
    data: { civs },
  };
  const makeResolver = new Function(...Object.keys(state), `${resolver}\nreturn { civTypeForOwner, civKeyForOwnerId, civBonusyForOwnerId };`);
  const owner = makeResolver(...Object.values(state));
  const ownerCases = [[0, 'rzymianie'], [42, 'zulusi'], [99, 'zulusi']];
  for (const [ownerId, civKey] of ownerCases) {
    eq(owner.civTypeForOwner(ownerId), civKey, `main resolver owner ${ownerId} -> ${civKey}`);
    const bonuses = owner.civBonusyForOwnerId(ownerId);
    eq(bonuses.filter(b => b.matrixParamId === 'prod_koszt_budynku_proc').length, 1, `owner ${ownerId}: one building marker`);
    eq(bonuses.filter(b => b.matrixParamId === 'prod_koszt_jednostki_proc').length, 1, `owner ${ownerId}: one unit marker`);
    const unitValue = bonuses.find(b => b.matrixParamId === 'prod_koszt_jednostki_proc').wartosc;
    eq(unitValue, civKey === 'zulusi' ? .1 : 0, `owner ${ownerId}: correct unit matrix value`);
  }
  eq(owner.civBonusyForOwnerId(77).length, 0, 'unknown effect owner stays neutral despite display fallback');
  eq(owner.civTypeForOwner(77), 'grecy', 'unknown owner may keep separate Greek display fallback');
  eq(owner.civTypeForOwner(777), 'grecy', 'unmapped owner falls back to Greek source row');

  // Execute the exact cost call expressions used by both cityPanel and buildingAdapter,
  // with the real main.ts callback above and production price function.
  const cityPanelSource = fs.readFileSync(path.join(root, 'src/ui/cityPanel.ts'), 'utf8');
  const adapterSource = fs.readFileSync(path.join(root, 'src/ui/entityCards/buildingAdapter.ts'), 'utf8');
  const cityExpr = sourceCall(cityPanelSource, node => ts.isIdentifier(node.expression)
    && node.expression.text === 'buildingWorkCost' && node.arguments[1]?.getText().includes('cfg.getCivBonusy'));
  const adapterExpr = sourceCall(adapterSource, node => ts.isIdentifier(node.expression)
    && node.expression.text === 'buildingWorkCost' && node.arguments[1]?.getText() === 'cityState.civBonusy');
  const romanBonusy = owner.civBonusyForOwnerId(0);
  const actualBaseWork = M.itemCost('budynek', 'stolarnia', { buildings, units }, 1);
  const expectedRomanWork = Math.max(1, Math.floor(actualBaseWork * .8));
  const cityQuote = new Function('buildingWorkCost', 'baseWork', 'cfg', 'ownerId', 'pace', 'difficulty', `return ${cityExpr};`)(
    M.buildingWorkCost, actualBaseWork, { getCivBonusy: owner.civBonusyForOwnerId }, 0, 'niski', 'normal');
  const adapterQuote = new Function('buildingWorkCost', 'baseWork', 'cityState', `return ${adapterExpr};`)(
    M.buildingWorkCost, actualBaseWork, { civBonusy: romanBonusy, buildCostPace: 'niski', ownerId: 0, difficulty: 'normal' });
  eq(cityQuote, expectedRomanWork, 'cityPanel actual quote expression displays real Stolarnia Rome discount once');
  eq(adapterQuote, expectedRomanWork, 'buildingAdapter actual quote expression displays real Stolarnia Rome discount once');
  const noDiscountQuote = new Function('buildingWorkCost', 'baseWork', 'cfg', 'ownerId', 'pace', 'difficulty', `return ${cityExpr};`)(
    M.buildingWorkCost, actualBaseWork, { getCivBonusy: owner.civBonusyForOwnerId }, 77, 'niski', 'normal');
  eq(noDiscountQuote, actualBaseWork, 'unmapped/zero-cell owner receives no leaked Roman reduction');
  console.log(`pr141-f04-cost-activation-defense-test: ${checks} passed, 0 failed`);
})().catch(error => { console.error(error); process.exitCode = 1; });
