#!/usr/bin/env node
'use strict';

// Bounded source-execution proof for the approved building-speed field. It
// executes the actual turn-loop call expression, current owner resolvers,
// production consumer, matrix resolver, city-panel ETA wrapper/expression, and
// production ETA function. No game boot, world, browser, or source-data edits.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ts = require('typescript');

const gameRoot = path.resolve(__dirname, '..');
const mainPath = path.join(gameRoot, 'src/main.ts');
const productionPath = path.join(gameRoot, 'src/game/production.ts');
const matrixModulePath = path.join(gameRoot, 'src/game/civ-matrix.ts');
const cityPanelPath = path.join(gameRoot, 'src/ui/cityPanel.ts');
const matrixDataPath = path.join(gameRoot, 'data/civ-matrix.json');
const mainFile = ts.createSourceFile(mainPath, fs.readFileSync(mainPath, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
const productionFile = ts.createSourceFile(productionPath, fs.readFileSync(productionPath, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
const matrixModuleFile = ts.createSourceFile(matrixModulePath, fs.readFileSync(matrixModulePath, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
const cityPanelFile = ts.createSourceFile(cityPanelPath, fs.readFileSync(cityPanelPath, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
const matrixData = JSON.parse(fs.readFileSync(matrixDataPath, 'utf8'));
const printer = ts.createPrinter();
const failures = [];

function check(ok, label) {
  if (!ok) failures.push(label);
}

function findFunction(sourceFile, name) {
  let found;
  function visit(node) {
    if (ts.isFunctionDeclaration(node) && node.name?.text === name) found = node;
    if (!found) ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  if (!found) throw new Error(`Missing function ${name}`);
  return found;
}

function findCall(sourceFile, predicate, label) {
  let found;
  function visit(node) {
    if (!found && ts.isCallExpression(node) && predicate(node)) found = node;
    if (!found) ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  if (!found) throw new Error(`Missing actual source call: ${label}`);
  return found;
}

function findVariable(sourceFile, name, predicate = () => true) {
  let found;
  function visit(node) {
    if (ts.isVariableDeclaration(node)
      && ts.isIdentifier(node.name)
      && node.name.text === name
      && predicate(node)) found = node;
    if (!found) ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  if (!found?.initializer) throw new Error(`Missing source variable initializer: ${name}`);
  return found;
}

function transpile(source) {
  return ts.transpileModule(source.replace(/\bexport\s+(?=function\s)/g, ''), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.None,
      moduleDetection: ts.ModuleDetectionKind.Legacy,
    },
  }).outputText;
}

function executeFunction(sourceFile, name, context) {
  const declaration = printer.printNode(ts.EmitHint.Unspecified, findFunction(sourceFile, name), sourceFile);
  vm.runInNewContext(`${transpile(declaration)}\nthis[${JSON.stringify(name)}] = ${name};`, context, { timeout: 1000 });
}

function near(actual, expected, label) {
  check(Math.abs(actual - expected) < 1e-9, `${label}: expected ${expected}, got ${actual}`);
}

const parameterId = 'prod_szybkosc_budynku_proc';
const sourceCivs = matrixData.cywilizacje;
check(sourceCivs.length === 15, `Expected 15 approved source rows, found ${sourceCivs.length}`);
for (const row of sourceCivs) {
  check(row.params?.[parameterId] === 0, `Approved source value for ${row.ikonaId} must remain zero`);
}

const syntheticValues = new Map([
  ['grecy', 0],
  ['zulusi', 0.2],
  ['egipt', -0.2],
  ['rzymianie', 0.1],
]);
const dataRows = [...syntheticValues].map(([key, value]) => ({
  Cywilizacja: key,
  typCywilizacji: key,
  ikonaId: key,
  params: { [parameterId]: value },
}));
const civData = require('../data/civs.json');
const context = {
  DATA: { cywilizacje: dataRows, defaults: { [parameterId]: 0 } },
  data: { civs: civData },
  loadCivMatrix: () => ({ cywilizacje: dataRows }),
  _menuCivIdByOwner: new Map([[0, 'grecy'], [7, 'zulusi'], [42, 'egipt']]),
  playerCivTypeByHuman: new Map(),
  HUMAN_OWNER_PRIMARY: 0,
  aiOwnerCivMap: new Map([[99, 'rzymianie']]),
  isMeSafe: ownerId => ownerId === 0 || ownerId === 7 || ownerId === 42,
  player: { civType: 'grecy' },
  _menuCivId: 'grecy',
  Number,
};

// Execute actual source functions: main owner resolution and civ-matrix lookup.
executeFunction(mainFile, 'civTypeForOwner', context);
executeFunction(mainFile, 'civKeyForOwnerId', context);
executeFunction(mainFile, 'civMatrixParamForOwner', context);
executeFunction(matrixModuleFile, 'resolveRow', context);
executeFunction(matrixModuleFile, 'civMatrixParam', context);
executeFunction(productionFile, 'frontItem', context);
executeFunction(productionFile, 'dropFrontItem', context);
executeFunction(productionFile, 'buildingWorkPerTurn', context);
executeFunction(productionFile, 'advanceProduction', context);
executeFunction(productionFile, 'pracaImperialPoolGain', context);
executeFunction(productionFile, 'etaTurns', context);
executeFunction(cityPanelFile, 'buildingWorkPerTurnForCity', context);
executeFunction(cityPanelFile, 'queueItemCumulativeEta', context);

const mainTurnCall = findCall(mainFile, node =>
  ts.isIdentifier(node.expression)
  && node.expression.text === 'advanceProduction'
  && node.arguments.length === 3
  && node.arguments[2].getText(mainFile).includes(parameterId),
'main.ts owner-aware advanceProduction call');
const mainTurnExpression = printer.printNode(ts.EmitHint.Unspecified, mainTurnCall, mainFile);
vm.runInNewContext(
  `this.runTurnWork = (city, prod0, pracaBudynki) => ${transpile(mainTurnExpression)};`,
  context,
  { timeout: 1000 },
);

const actualBudgetInitializer = printer.printNode(
  ts.EmitHint.Expression,
  findVariable(mainFile, 'pracaBudynki', node => node.initializer.getText(mainFile).includes('econTick.doBudynkow')).initializer,
  mainFile,
);
vm.runInNewContext(
  `this.runTurnBudget = (econTick, queueEmpty, prodPaused, prodMult) => ${transpile(actualBudgetInitializer)};`,
  context,
  { timeout: 1000 },
);

const poolGainCall = findCall(mainFile, node =>
  ts.isIdentifier(node.expression)
  && node.expression.text === 'pracaImperialPoolGain'
  && node.arguments.length === 2,
'main.ts empty-queue pool call');
const poolGainExpression = printer.printNode(ts.EmitHint.Unspecified, poolGainCall, mainFile);
vm.runInNewContext(
  `this.runPoolGain = (scaledDoBudynkow, scaledDoPuli, queueEmpty) => ${transpile(poolGainExpression)};`,
  context,
  { timeout: 1000 },
);

const currentBuildingEtaCall = findCall(cityPanelFile, node =>
  ts.isIdentifier(node.expression)
  && node.expression.text === 'etaTurns'
  && node.arguments.length === 3
  && node.arguments[2].getText(cityPanelFile).includes('buildingWorkPerTurnForCity')
  && node.arguments[2].getText(cityPanelFile).includes('praca.doBudynkow'),
'city-panel current building ETA expression');
const etaExpression = printer.printNode(ts.EmitHint.Unspecified, currentBuildingEtaCall, cityPanelFile);
vm.runInNewContext(
  `this.runBuildingEta = (city, front, prod, praca) => ${transpile(etaExpression)};`,
  context,
  { timeout: 1000 },
);

const cumulativeEtaInitializer = printer.printNode(
  ts.EmitHint.Expression,
  findVariable(cityPanelFile, 'cumEta').initializer,
  cityPanelFile,
);
vm.runInNewContext(
  `this.runCumulativeEta = (city, prod, i, pracaBudynki) => { const buildingPracaBudynki = buildingWorkPerTurnForCity(city, pracaBudynki); return ${transpile(cumulativeEtaInitializer)}; };`,
  context,
  { timeout: 1000 },
);

context.cfg = { getCivKey: ownerId => context.civKeyForOwnerId(ownerId) };

const ownerCases = [
  { ownerId: 0, civKey: 'grecy', bonus: 0 },
  { ownerId: 7, civKey: 'zulusi', bonus: 0.2 },
  { ownerId: 42, civKey: 'egipt', bonus: -0.2 },
  { ownerId: 99, civKey: 'rzymianie', bonus: 0.1 },
];
for (const { ownerId, civKey, bonus } of ownerCases) {
  check(context.civKeyForOwnerId(ownerId) === civKey, `Actual main owner resolver mapped ${ownerId} to the wrong civ`);
  near(context.civMatrixParam(civKey, parameterId), bonus, `actual matrix resolver synthetic ${civKey}`);

  const city = { id: `city-${ownerId}`, ownerId };
  const economicWorkAfterOrder = 2.25;
  const baseWork = context.runTurnBudget({ doBudynkow: economicWorkAfterOrder }, false, false, 1);
  const prod = { kolejka: [{ kind: 'budynek', id: 'test-building', nazwa: 'Test', koszt: 100 }], postep: 0.5 };
  const result = context.runTurnWork(city, prod, baseWork);
  near(result.prod.postep, 0.5 + baseWork * (1 + bonus), `actual turn progress owner ${ownerId}`);

  const eta = context.runBuildingEta(city, { kind: 'budynek', koszt: 11 }, { postep: 0 }, { doBudynkow: 2.5 });
  const expectedEta = Math.ceil(11 / (2.5 * (1 + bonus)));
  check(eta === expectedEta, `actual city-panel ETA owner ${ownerId}: expected ${expectedEta}, got ${eta}`);
}

// UI preview with no available civ key stays neutral and never borrows seat 0.
context.cfg = { getCivKey: () => undefined };
check(context.runBuildingEta({ id: 'unresolved', ownerId: 1234 }, { kind: 'budynek', koszt: 11 }, { postep: 0 }, { doBudynkow: 2.5 }) === 5,
  'unresolved city-panel owner key should use neutral building Work rate');
context.cfg = { getCivKey: ownerId => context.civKeyForOwnerId(ownerId) };

// Zero is neutral: old two-argument call and explicit matrix zero have identical output.
const zeroProd = { kolejka: [{ kind: 'budynek', id: 'zero', nazwa: 'Zero', koszt: 20 }], postep: 1.25 };
const implicitZero = context.advanceProduction(zeroProd, 2.25);
const explicitZero = context.advanceProduction(zeroProd, 2.25, 0);
check(JSON.stringify(implicitZero) === JSON.stringify(explicitZero), 'zero source must preserve old advanceProduction result');

// Initially empty queues still send the raw pre-speed budget to the existing pool overflow.
const emptyQueue = context.runTurnWork({ id: 'empty', ownerId: 7 }, { kolejka: [], postep: 0 }, 2.25);
near(emptyQueue.overflowToPool, 2.25, 'initially empty queue keeps raw pool overflow');
near(context.runTurnBudget({ doBudynkow: 2.25 }, true, false, 1.5), 0, 'main caller sends no building Work to an initially empty queue');
near(context.runPoolGain(2.25 * 1.5, 0.75 * 1.5, true), 4.5, 'empty-queue imperial pool keeps existing difficulty-scaled Work');
near(context.runPoolGain(2.25 * 1.5, 0.75 * 1.5, false), 1.125, 'occupied-queue pool receives its existing nonbuilding split only');

// Completion uses the scaled budget and the existing next-front remainder rule.
const twoBuildings = {
  kolejka: [
    { kind: 'budynek', id: 'first', nazwa: 'First', koszt: 3 },
    { kind: 'budynek', id: 'next', nazwa: 'Next', koszt: 10, postep: 0.4 },
  ],
  postep: 0.5,
};
const carry = context.runTurnWork({ id: 'carry', ownerId: 7 }, twoBuildings, 2.25);
check(carry.completed?.id === 'first', 'positive building speed should complete the first item on the actual path');
near(carry.prod.postep, (2.25 * 1.2 - (3 - 0.5)) + 0.4, 'existing remainder plus next-front banked progress');
check(carry.overflowToPool === undefined, 'next queued building consumes existing completion remainder');

// Last-item completion keeps the production module's existing remainder-to-pool behavior.
const lastItem = context.runTurnWork(
  { id: 'last', ownerId: 7 },
  { kolejka: [{ kind: 'budynek', id: 'last', nazwa: 'Last', koszt: 3 }], postep: 0.5 },
  2.25,
);
check(lastItem.prod.kolejka.length === 0 && lastItem.prod.postep === 0, 'last building completion should retain existing empty-queue reset');
near(lastItem.overflowToPool, 2.25 * 1.2 - (3 - 0.5), 'last building completion exposes existing scaled remainder');

// Negative control: stale/legacy unit entries in the public queue remain unspeeded.
const legacyUnit = context.runTurnWork(
  { id: 'legacy-unit', ownerId: 7 },
  { kolejka: [{ kind: 'jednostka', id: 'unit', nazwa: 'Unit', koszt: 100 }], postep: 0.5 },
  2.25,
);
near(legacyUnit.prod.postep, 0.5 + 2.25, 'unit queue negative control remains unmodified');
check(context.runBuildingEta(
  { id: 'legacy-unit', ownerId: 7 },
  { kind: 'jednostka', koszt: 11 },
  { postep: 0 },
  { doBudynkow: 2.5 },
) === 5, 'unit front ETA negative control must not receive building speed');

// Cumulative queue previews apply the building factor item-by-item in mixed queues.
// Building 11 Work at 2.5 base becomes ETA 4 at +20%; the 1-cost unit remains ETA 1.
const mixedBuildingThenUnit = {
  kolejka: [
    { kind: 'budynek', id: 'front-building', koszt: 11 },
    { kind: 'jednostka', id: 'queued-unit', koszt: 1 },
  ],
  postep: 0,
};
check(context.runCumulativeEta({ ownerId: 7 }, mixedBuildingThenUnit, 1, 2.5) === 5,
  'mixed queue cumulative ETA must speed the building and preserve the unit rate (4 + 1)');
const mixedUnitThenBuilding = {
  kolejka: [
    { kind: 'jednostka', id: 'front-unit', koszt: 1 },
    { kind: 'budynek', id: 'queued-building', koszt: 11 },
  ],
  postep: 0,
};
check(context.runCumulativeEta({ ownerId: 7 }, mixedUnitThenBuilding, 1, 2.5) === 5,
  'mixed queue cumulative ETA must preserve unit front and speed queued building (1 + 4)');
const allBuildings = {
  kolejka: [
    { kind: 'budynek', id: 'front-building', koszt: 11 },
    { kind: 'budynek', id: 'queued-building', koszt: 11 },
  ],
  postep: 0,
};
check(context.runCumulativeEta({ ownerId: 7 }, allBuildings, 1, 2.5) === 8,
  'all-building queue keeps the existing per-item ceil with building speed (4 + 4)');
const allUnits = {
  kolejka: [
    { kind: 'jednostka', id: 'front-unit', koszt: 11 },
    { kind: 'jednostka', id: 'queued-unit', koszt: 1 },
  ],
  postep: 0,
};
check(context.runCumulativeEta({ ownerId: 7 }, allUnits, 1, 2.5) === 6,
  'all-unit queue remains on the unmodified base rate (5 + 1)');
check(context.runCumulativeEta({ ownerId: 0 }, mixedBuildingThenUnit, 1, 2.5) === 6,
  'zero building-speed source preserves mixed-queue cumulative ETA');
check(context.runCumulativeEta({ ownerId: 7 }, mixedBuildingThenUnit, 1, 0) === null,
  'zero available Work preserves null cumulative ETA for a building item');

// Pause behavior and the UI ETA's actual fractional rate share the same helper.
const paused = context.runTurnWork(
  { id: 'paused', ownerId: 7 },
  { kolejka: [{ kind: 'budynek', id: 'pause', nazwa: 'Pause', koszt: 100 }], postep: 0.5, wstrzymana: true },
  2.25,
);
check(paused.prod.postep === 0.5 && paused.completed === null, 'paused production must ignore building speed');
near(context.buildingWorkPerTurn(2.25, 0.2), 2.7, 'positive fractional scaling remains unrounded');
near(context.buildingWorkPerTurn(2.25, -0.2), 1.8, 'negative fractional scaling remains unrounded');

if (failures.length) {
  process.stderr.write(`FAIL: ${failures.length} building-speed activation finding(s)\n`);
  for (const failure of failures) process.stderr.write(`- ${failure}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('PASS: 15 source zeros; actual owner-routed turn and city-panel preview paths for owners 0/7/42/AI99; fractional positive/negative progress and ETA; empty/completion overflow, carry, pause, and unit negative controls.\n');
}
