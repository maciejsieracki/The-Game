#!/usr/bin/env node
'use strict';

// Bounded actual-source proof for owner-routed paid recruitment unit speed.
// Executes the live main call, owner resolver, matrix resolver, gated consumer,
// and city-panel cadence expression without booting a game or editing data.
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

function findVariable(sourceFile, name, predicate = () => true) {
  let found;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === name && predicate(node)) found = node;
    if (!found) ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  if (!found?.initializer) throw new Error(`Missing source variable initializer: ${name}`);
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

function transpile(source) {
  return ts.transpileModule(source.replace(/\bexport\s+(?=function\s)/g, ''), {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.None, moduleDetection: ts.ModuleDetectionKind.Legacy },
  }).outputText;
}

function executeFunction(sourceFile, name, context) {
  const declaration = printer.printNode(ts.EmitHint.Unspecified, findFunction(sourceFile, name), sourceFile);
  vm.runInNewContext(`${transpile(declaration)}\nthis[${JSON.stringify(name)}] = ${name};`, context, { timeout: 1000 });
}

const parameterId = 'prod_szybkosc_jednostki_proc';
const sourceCivs = matrixData.cywilizacje;
check(sourceCivs.length === 15, `Expected 15 approved source rows, got ${sourceCivs.length}`);
for (const row of sourceCivs) check(row.params?.[parameterId] === 0, `Approved source value for ${row.ikonaId} must remain zero`);

// Every synthetic value is isolated from the approved source matrix.
const syntheticValues = new Map([
  ['grecy', 0],
  ['zulusi', 0.2],
  ['egipt', 1],
  ['rzymianie', 2],
  ['asyria', -0.2],
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
  aiOwnerCivMap: new Map([[99, 'rzymianie'], [101, 'asyria']]),
  isMeSafe: ownerId => ownerId === 0 || ownerId === 7 || ownerId === 42,
  player: { civType: 'grecy' },
  _menuCivId: 'grecy',
  cityManpowerCurrent: city => city.manpower,
  empireEpochForOwner: () => 1,
  Number,
  Math,
};

executeFunction(mainFile, 'civTypeForOwner', context);
executeFunction(mainFile, 'civKeyForOwnerId', context);
executeFunction(matrixModuleFile, 'resolveRow', context);
executeFunction(matrixModuleFile, 'civMatrixParam', context);
executeFunction(mainFile, 'civMatrixParamForOwner', context);
executeFunction(productionFile, 'unitRecruitmentCapacityPerTurn', context);
executeFunction(productionFile, 'advanceRecruitmentGated', context);
executeFunction(cityPanelFile, 'unitRecruitmentCapacityForCity', context);

const capacityInitializer = printer.printNode(
  ts.EmitHint.Expression,
  findVariable(mainFile, 'recMaxPerTurn').initializer,
  mainFile,
);
const actualGatedCall = findCall(mainFile, node =>
  ts.isIdentifier(node.expression)
  && node.expression.text === 'advanceRecruitmentGated'
  && node.arguments.length === 7
  && node.arguments[3].getText(mainFile) === 'recMaxPerTurn',
'actual city-turn advanceRecruitmentGated call with recMaxPerTurn');
const actualGatedCallText = printer.printNode(ts.EmitHint.Unspecified, actualGatedCall, mainFile);
vm.runInNewContext(
  `this.runTurnRecruitment = (city, prodFinal) => { const recMaxPerTurn = ${transpile(capacityInitializer)}; const recMpMults = { maxMult: 1, costMult: 1 }; return ${transpile(actualGatedCallText)}; };`,
  context,
  { timeout: 1000 },
);

context.cfg = { getCivKey: ownerId => context.civKeyForOwnerId(ownerId) };
const capacityVariable = printer.printNode(
  ts.EmitHint.Expression,
  findVariable(cityPanelFile, 'unitsPerTurn').initializer,
  cityPanelFile,
);
const etaVariable = printer.printNode(
  ts.EmitHint.Expression,
  findVariable(cityPanelFile, 'recruitmentEtaTurns').initializer,
  cityPanelFile,
);
vm.runInNewContext(
  `this.runRecruitmentEta = (city, i) => { const unitsPerTurn = ${transpile(capacityVariable)}; return ${transpile(etaVariable)}; };`,
  context,
  { timeout: 1000 },
);

const ownerCases = [
  { ownerId: 0, civKey: 'grecy', raw: 0, capacity: 1 },
  { ownerId: 7, civKey: 'zulusi', raw: 0.2, capacity: 1 },
  { ownerId: 42, civKey: 'egipt', raw: 1, capacity: 2 },
  { ownerId: 99, civKey: 'rzymianie', raw: 2, capacity: 3 },
  { ownerId: 101, civKey: 'asyria', raw: -0.2, capacity: 1 },
];
for (const { ownerId, civKey, raw, capacity } of ownerCases) {
  check(context.civKeyForOwnerId(ownerId) === civKey, `Actual owner resolver mapped ${ownerId} to wrong civ`);
  check(context.civMatrixParam(civKey, parameterId) === raw, `Actual matrix resolver returned wrong synthetic value for ${civKey}`);
  const prod = {
    kolejka: [],
    postep: 0,
    rekrutacja: Array.from({ length: 5 }, (_, i) => ({ id: `unit-${ownerId}-${i}`, nazwa: 'Unit', koszt: 10 })),
  };
  const result = context.runTurnRecruitment({ ownerId, population: 100, manpower: 100 }, prod);
  check(result.completed.length === capacity, `actual gated consumer owner ${ownerId}: expected ${capacity} completions, got ${result.completed.length}`);
  check((result.prod.rekrutacja?.length ?? 0) === 5 - capacity, `actual gated consumer owner ${ownerId}: wrong remaining queue length`);
  check(context.runRecruitmentEta({ ownerId }, capacity - 1) === 1, `actual city-panel ETA owner ${ownerId} should reach its capacity within one turn`);
}

// Beyond owner-routed values, prove exact capacity/ETA transitions and guards.
check(context.unitRecruitmentCapacityPerTurn(1, 0.2) === 1, 'positive +20% intentionally remains at one per turn under floor/no-carry A');
check(context.unitRecruitmentCapacityPerTurn(1, 1) === 2, '+100% must raise per-turn capacity to two');
check(context.unitRecruitmentCapacityPerTurn(1, 2) === 3, '+200% must raise per-turn capacity to three');
check(context.unitRecruitmentCapacityPerTurn(1, -0.2) === 1, 'minimum-one from the established A contract must preserve one per turn for negative fractional speed');
check(context.unitRecruitmentCapacityPerTurn(0, 2) === 0, 'disabled zero base capacity must remain zero');
check(context.unitRecruitmentCapacityPerTurn(0.5, 0) === 1, 'any positive base capacity retains the established minimum-one behavior');
check(context.runRecruitmentEta({ ownerId: 42 }, 0) === 1, '+100% first queued item ETA');
check(context.runRecruitmentEta({ ownerId: 42 }, 1) === 1, '+100% second queued item ETA');
check(context.runRecruitmentEta({ ownerId: 42 }, 2) === 2, '+100% third queued item ETA');
check(context.runRecruitmentEta({ ownerId: 99 }, 2) === 1, '+200% third queued item ETA');
check(context.runRecruitmentEta({ ownerId: 99 }, 3) === 2, '+200% fourth queued item ETA');

// Missing UI owner keys must resolve neutrally rather than borrowing owner 0.
context.cfg = { getCivKey: () => undefined };
check(context.runRecruitmentEta({ ownerId: 404 }, 2) === 3, 'missing UI owner key uses neutral base capacity');

if (failures.length) {
  process.stderr.write(`FAIL: ${failures.length} unit-speed activation finding(s)\n`);
  for (const failure of failures) process.stderr.write(`- ${failure}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('PASS: 15 approved source zeros; actual human/AI owner-routed gated completion and UI cadence; +20% floor neutral, +100% capacity 2, +200% capacity 3, negative minimum-one, zero-base, and missing-owner controls.\n');
}
