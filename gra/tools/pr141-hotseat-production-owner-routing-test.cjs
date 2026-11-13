#!/usr/bin/env node
'use strict';

// Bounded source-execution contract test for the actual main.ts panel callbacks,
// their actual owner-aware helpers, and production.ts dequeueRecruitment.
// The pre-fix EXPECTED_RED reproduction is recorded in the run report. Against
// the corrected callbacks this bounded source-execution test must pass. It does
// not boot the game or mutate files/save data.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ts = require('typescript');

const mainPath = path.join(__dirname, '../src/main.ts');
const productionPath = path.join(__dirname, '../src/game/production.ts');
const mainSource = ts.createSourceFile(mainPath, fs.readFileSync(mainPath, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
const productionSource = ts.createSourceFile(productionPath, fs.readFileSync(productionPath, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
const printer = ts.createPrinter();
const failures = [];
const evidence = [];

function check(condition, label) {
  if (!condition) failures.push(label);
}

function findFunction(sourceFile, name) {
  let found;
  function visit(node) {
    if (ts.isFunctionDeclaration(node) && node.name?.text === name) found = node;
    if (!found) ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  if (!found) throw new Error(`Missing source function: ${name}`);
  return found;
}

function findProperties(sourceFile, name) {
  const found = [];
  function visit(node) {
    if (ts.isPropertyAssignment(node) && ts.isIdentifier(node.name) && node.name.text === name) {
      found.push(node.initializer);
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return found;
}

function findAiPurchaseCall(sourceFile) {
  let found;
  function visit(node) {
    if (ts.isCallExpression(node)
      && ts.isIdentifier(node.expression)
      && node.expression.text === 'purchaseRecruitmentUnit'
      && node.arguments.length === 4
      && node.arguments[3].getText(sourceFile) === 'ownerId') {
      found = node;
    }
    if (!found) ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  if (!found) throw new Error('Missing AI purchase call that forwards ownerId');
  return found;
}

function transpile(source) {
  const withoutExport = source.replace(/\bexport\s+(?=function\s)/, '').replace(/^export\s+/, '');
  return ts.transpileModule(withoutExport, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.None,
      moduleDetection: ts.ModuleDetectionKind.Legacy,
    },
  }).outputText;
}

function executeDeclaration(sourceFile, node, name, context) {
  const declaration = printer.printNode(ts.EmitHint.Unspecified, node, sourceFile);
  vm.runInNewContext(transpile(`${declaration}\nthis.${name} = ${name};`), context, { timeout: 1000 });
}

function executeArrow(sourceFile, node, context, globalName) {
  const arrow = printer.printNode(ts.EmitHint.Unspecified, node, sourceFile);
  vm.runInNewContext(transpile(`this.${globalName} = ${arrow};`), context, { timeout: 1000 });
}

const purchaseCallbacks = findProperties(mainSource, 'onPurchaseUnit');
const cancelCallbacks = findProperties(mainSource, 'onCancelRecruitment');
check(purchaseCallbacks.length === 2, `Expected exactly two actual purchase callbacks; found ${purchaseCallbacks.length}`);
check(cancelCallbacks.length === 1, `Expected exactly one actual cancellation callback; found ${cancelCallbacks.length}`);

const effects = [];
const cityProd = new Map();
const cityByOwner = new Map();
const treasury = new Map();
const bonusLookups = [];
const helperCalls = [];
const context = {
  cities: [],
  cityProd,
  data: { units: [] },
  player: { kosztJednostekPace: 'niski' },
  _menuDifficulty: 'normalny',
  UNIT_POPULATION_COST: 1,
  ownerTreasury: ownerId => treasury.get(ownerId) ?? 10000,
  setOwnerTreasury: (ownerId, value) => {
    effects.push({ kind: 'treasury-write', ownerId, value });
    treasury.set(ownerId, value);
  },
  civBonusyForOwnerId: ownerId => {
    bonusLookups.push(ownerId);
    return [{ marker: `owner-${ownerId}` }];
  },
  unitProductionItem: (itemId, _data, bonuses, _pace, ownerId) => ({
    kind: 'jednostka', id: itemId, nazwa: itemId, koszt: 10, ownerId, bonuses,
  }),
  empireEpochForOwner: () => 1,
  civManpowerMultsForOwner: () => ({ maxMult: 1, costMult: 1 }),
  unitManpowerCostForType: () => 2,
  canAffordUnitManpowerEmpire: () => true,
  tryDeductUnitSpawnCostsEmpire: () => ({ ok: true, manpower: 98, kosztManpower: 2 }),
  empireManpowerCurrent: () => 100,
  deductManpowerFromEmpire: () => true,
  refundManpowerToEmpire: (_cities, ownerId, _epoch, amount) => effects.push({ kind: 'manpower-refund', ownerId, amount }),
  unitStockCost: () => ({ iron: 1 }),
  ownerResourceStockAll: () => ({ iron: 99 }),
  pickUnitRecruitHint: () => null,
  missingStockFor: () => ({}),
  deductBuildingStockCostAcrossCities: (_cities, ownerId, cost) => effects.push({ kind: 'stock-deduct', ownerId, cost }),
  creditOwnerResourceStock: (_cities, ownerId, resource, amount) => effects.push({ kind: 'stock-refund', ownerId, resource, amount }),
  markCityStateDirty: () => {},
  updateHud: () => {},
  refreshCityPanelIfOpen: () => {},
  cityHasCoastOrRiverAccess: () => true,
  showHintMessage: () => {},
  console: { log: () => {}, warn: () => {} },
  Number,
};

executeDeclaration(mainSource, findFunction(mainSource, 'purchaseRecruitmentUnit'), 'purchaseRecruitmentUnit', context);
executeDeclaration(mainSource, findFunction(mainSource, 'cancelRecruitmentPurchase'), 'cancelRecruitmentPurchase', context);
executeDeclaration(productionSource, findFunction(productionSource, 'enqueueRecruitment'), 'enqueueRecruitment', context);
executeDeclaration(productionSource, findFunction(productionSource, 'dequeueRecruitment'), 'dequeueRecruitment', context);
context.dequeueRecruitmentOriginal = context.dequeueRecruitment;
let dequeueCalls = 0;
context.dequeueRecruitment = (...args) => {
  dequeueCalls++;
  return context.dequeueRecruitmentOriginal(...args);
};

context.purchaseRecruitmentUnitOriginal = context.purchaseRecruitmentUnit;
context.purchaseRecruitmentUnit = (...args) => {
  helperCalls.push({ kind: 'purchase', ownerId: args[3] });
  return context.purchaseRecruitmentUnitOriginal(...args);
};
context.cancelRecruitmentPurchaseOriginal = context.cancelRecruitmentPurchase;
context.cancelRecruitmentPurchase = (...args) => {
  helperCalls.push({ kind: 'cancel', ownerId: args[3] ?? 0 });
  return context.cancelRecruitmentPurchaseOriginal(...args);
};

// Test multiple actual callbacks and distinct owner IDs. Owner 0 is the
// pre-existing primary-human control; 7/42 represent other human seats.
for (const ownerId of [0, 7, 42]) {
  const cityId = `human-city-${ownerId}`;
  const city = { id: cityId, ownerId, population: 10, manpower: 100 };
  context.cities.push(city);
  cityByOwner.set(ownerId, city);
  treasury.set(ownerId, 10000);
  cityProd.set(cityId, { kolejka: [], postep: 0 });
}

for (let configIndex = 0; configIndex < purchaseCallbacks.length; configIndex++) {
  for (const ownerId of [0, 7, 42]) {
    const cityId = `human-city-${ownerId}`;
    treasury.set(ownerId, 10000);
    cityProd.set(cityId, { kolejka: [], postep: 0 });
    const beforeWrites = effects.filter(effect => effect.kind === 'treasury-write').length;
    const beforeHelperCount = helperCalls.length;
    const beforeBonus = bonusLookups.length;
    executeArrow(mainSource, purchaseCallbacks[configIndex], context, `purchaseCallback${configIndex}`);
    const result = context[`purchaseCallback${configIndex}`](cityId, `unit-${ownerId}`, 37 + ownerId, 1);
    check(result === true, `purchase callback ${configIndex} should accept existing human city owner ${ownerId}; got ${result}`);
    check(helperCalls.length === beforeHelperCount + 1, `purchase callback ${configIndex} should invoke exactly one purchase helper for owner ${ownerId}`);
    check(helperCalls.at(-1)?.ownerId === ownerId, `purchase callback ${configIndex} routed owner ${ownerId} to helper as ${helperCalls.at(-1)?.ownerId}`);
    check(effects.filter(effect => effect.kind === 'treasury-write').length === beforeWrites + (result ? 1 : 0), `purchase callback ${configIndex} should perform one treasury write for owner ${ownerId}`);
    check(result !== true || treasury.get(ownerId) === 10000 - (37 + ownerId), `purchase callback ${configIndex} debited wrong owner/amount for ${ownerId}`);
    check(result !== true || bonusLookups[beforeBonus] === ownerId, `purchase callback ${configIndex} used wrong owner bonus context for ${ownerId}`);
  }
}

// The AI path must keep passing its explicit ownerId into the same actual helper.
const aiCall = findAiPurchaseCall(mainSource);
const aiCallText = printer.printNode(ts.EmitHint.Unspecified, aiCall, mainSource);
executeArrow(mainSource, ts.factory.createArrowFunction(
  undefined, undefined,
  [
    ts.factory.createParameterDeclaration(undefined, undefined, 'cmd'),
    ts.factory.createParameterDeclaration(undefined, undefined, 'candId'),
    ts.factory.createParameterDeclaration(undefined, undefined, 'item'),
    ts.factory.createParameterDeclaration(undefined, undefined, 'ownerId'),
  ],
  undefined, ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken), aiCall,
), context, 'aiPurchaseCall');
const aiOwner = 99;
context.cities.push({ id: 'ai-city-99', ownerId: aiOwner, population: 10, manpower: 100 });
cityProd.set('ai-city-99', { kolejka: [], postep: 0 });
treasury.set(aiOwner, 10000);
const aiBeforeBonus = bonusLookups.length;
const aiResult = context.aiPurchaseCall({ cityId: 'ai-city-99' }, 'ai-unit', { koszt: 99 }, aiOwner);
check(aiResult === true, `AI owner ${aiOwner} should still complete its existing purchase path`);
check(helperCalls.at(-1)?.ownerId === aiOwner, `AI purchase call ${aiCallText} did not forward owner ${aiOwner}`);
check(bonusLookups[aiBeforeBonus] === aiOwner, `AI purchase cost context did not resolve owner ${aiOwner}`);

// Missing IDs must not fall back to owner 0 or invoke resource helpers.
context.cities = context.cities.filter(city => city.id !== 'missing-city');
for (let i = 0; i < purchaseCallbacks.length; i++) {
  executeArrow(mainSource, purchaseCallbacks[i], context, `missingPurchase${i}`);
  const helperCount = helperCalls.length;
  const writes = effects.length;
  const result = context[`missingPurchase${i}`]('missing-city', 'unit-missing', 25, 1);
  check(result === false, `missing-city purchase ${i} must reject`);
  check(helperCalls.length === helperCount, `missing-city purchase ${i} must not invoke purchase helper`);
  check(effects.length === writes, `missing-city purchase ${i} must not produce resource side effects`);
}

if (cancelCallbacks[0]) {
  executeArrow(mainSource, cancelCallbacks[0], context, 'cancelCallback');
  for (const ownerId of [0, 7, 42]) {
    const cityId = `cancel-city-${ownerId}`;
    context.cities.push({ id: cityId, ownerId, population: 10, manpower: 100 });
    treasury.set(ownerId, 10000);
    const paidItem = { kind: 'jednostka', id: `paid-${ownerId}`, nazwa: `paid-${ownerId}`, koszt: 43 + ownerId };
    const beforeProd = { kolejka: [], postep: 0, rekrutacja: [paidItem] };
    cityProd.set(cityId, beforeProd);
    const beforeEffectIndex = effects.length;
    const beforeDequeues = dequeueCalls;
    const beforeQueueLength = beforeProd.rekrutacja.length;
    context.cancelCallback(cityId, paidItem.id, paidItem.koszt);
    const afterProd = context.dequeueRecruitment(beforeProd, 0);
    const refundEffects = effects.slice(beforeEffectIndex).filter(effect => ['treasury-write', 'manpower-refund', 'stock-refund'].includes(effect.kind));
    check(helperCalls.at(-1)?.ownerId === ownerId, `cancel callback must route owner ${ownerId}; got ${helperCalls.at(-1)?.ownerId}`);
    check(refundEffects.length === 3, `cancel owner ${ownerId} must produce exactly one treasury, manpower, and stock refund`);
    check(refundEffects.every(effect => effect.ownerId === ownerId), `cancel owner ${ownerId} refunds must all target that owner`);
    check(afterProd.rekrutacja === undefined, `cancel owner ${ownerId} must dequeue the last item exactly once`);
    check(beforeQueueLength === 1 && afterProd.rekrutacja === undefined, `cancel owner ${ownerId} queue transition malformed`);
    check(dequeueCalls === beforeDequeues + 1, `cancel owner ${ownerId} must call dequeue exactly once`);
    check(treasury.get(ownerId) === 10000 + paidItem.koszt, `cancel owner ${ownerId} refunded wrong treasury`);
  }

  const helperCount = helperCalls.length;
  const effectsCount = effects.length;
  context.cancelCallback('missing-city', 'unit-missing', 71);
  check(helperCalls.length === helperCount, 'missing-city cancellation must not invoke refund helper');
  check(effects.length === effectsCount, 'missing-city cancellation must not produce resource side effects');
}

if (failures.length > 0) {
  process.stderr.write(`EXPECTED_RED before main.ts owner-routing fix (${failures.length} findings)\n`);
  for (const failure of failures) process.stderr.write(`- ${failure}\n`);
  process.stderr.write('This nonzero result is a recorded pre-fix reproduction, not a passing validation.\n');
  process.exitCode = 1;
} else {
  process.stdout.write('PASS: actual owner-routed source callbacks/helpers cover human owners 0/7/42, AI owner 99, safe missing-city behavior, and one refund + one dequeue.\n');
}
