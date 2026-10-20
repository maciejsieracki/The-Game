#!/usr/bin/env node
'use strict';

// Bounded AST/source-execution check for the actual owner resolver, AI
// diplomacy input expressions, and getRelationBreakdown. This does not boot
// the application, generate a map, render a browser, run a turn, or save/load.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const mainPath = path.join(__dirname, '../src/main.ts');
const sourceText = fs.readFileSync(mainPath, 'utf8');
const sourceFile = ts.createSourceFile(mainPath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
const printer = ts.createPrinter();
const checks = [];
function check(label, fn) {
  try { fn(); checks.push(`PASS ${label}`); }
  catch (error) { checks.push(`FAIL ${label}: ${error.message}`); }
}
function findFunction(name) {
  let found;
  function visit(node) {
    if (ts.isFunctionDeclaration(node) && node.name?.text === name) found = node;
    if (!found) ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  assert(found, `actual function ${name} exists`);
  return found;
}
function propertyInitializers(name, predicate = () => true) {
  const found = [];
  function visit(node) {
    if (ts.isPropertyAssignment(node) && ts.isIdentifier(node.name) && node.name.text === name
      && predicate(node.initializer.getText(sourceFile))) found.push(node.initializer);
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return found;
}
function transpile(text) {
  return ts.transpileModule(text, {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.None },
  }).outputText;
}
function executeFunction(name, context) {
  const declaration = printer.printNode(ts.EmitHint.Unspecified, findFunction(name), sourceFile);
  vm.runInNewContext(transpile(`${declaration}\nthis.${name} = ${name};`), context, { timeout: 1000 });
}
function executeExpression(node, context, name) {
  const expression = printer.printNode(ts.EmitHint.Expression, node, sourceFile);
  vm.runInNewContext(transpile(`this.${name} = () => (${expression});`), context, { timeout: 1000 });
  return context[name]();
}

const civilizationRows = ['rzymianie', 'zulusi', 'egipt', 'chinczycy'].map(ikonaId => ({
  ikonaId, typCywilizacji: ikonaId, Cywilizacja: ikonaId,
}));
const matrixRows = civilizationRows.map(row => ({
  ikonaId: row.ikonaId, typCywilizacji: row.typCywilizacji, Cywilizacja: row.Cywilizacja,
}));
const cultureByKey = new Map([
  ['rzymianie', 'zachodni'], ['zulusi', 'poludniowy'], ['egipt', 'poludniowy'], ['chinczycy', 'wschodni'],
]);
const context = {
  HUMAN_OWNER_PRIMARY: 0,
  _menuCivIdByOwner: new Map([[0, 'rzymianie'], [7, 'zulusi'], [42, 'chinczycy']]),
  playerCivTypeByHuman: new Map([[0, 'rzymianie'], [7, 'zulusi'], [42, 'chinczycy']]),
  player: { civType: 'rzymianie' },
  aiOwnerCivMap: new Map([[99, 'egipt']]),
  data: { civs: { cywilizacje: civilizationRows } },
  loadCivMatrix: () => ({ cywilizacje: matrixRows }),
  sameCultureCircle: (a, b) => !!a && !!b && cultureByKey.get(a) === cultureByKey.get(b),
  ownerReligionForOwnerId: ownerId => new Map([[7, 'solar'], [42, 'lunar'], [99, 'solar']]).get(ownerId) ?? null,
  isHuman: ownerId => ownerId === 0 || ownerId === 7 || ownerId === 42,
  getDiploRelation: () => ({ status: 'pokoj' }),
  _diplomacyParams: () => ({}),
  diplomacyFactorLog: new Map(),
  diploPairKey: (a, b) => `${a}:${b}`,
  hasSzlakowTreaty: () => false,
  resolvePokojTrustTier: () => 0,
  diplomaticContactEstablishedSet: () => new Set(),
  cities: [],
  ownersShareLandBorderLive: () => false,
  typCityCopyOwners: new Set(),
  buildDiplomacyTickCtxForPair: () => ({ wiarygodnoscSelf: undefined }),
  getWiarygodnosc: () => 0.5,
  turn: 10,
  buildRelationBreakdown: (_log, flags) => flags,
  activeDeals: [],
};
executeFunction('civKeyForOwnerId', context);
executeFunction('civKeyForOwner', context);
executeFunction('buildDiplomacyTickCtxForPair', context);
executeFunction('getRelationBreakdown', context);

check('canonical resolver maps primary, both human seats, and AI owner', () => {
  assert.equal(context.civKeyForOwnerId(0), 'rzymianie');
  assert.equal(context.civKeyForOwnerId(7), 'zulusi');
  assert.equal(context.civKeyForOwnerId(42), 'chinczycy');
  assert.equal(context.civKeyForOwnerId(99), 'egipt');
});
check('unknown owner stays neutral and never borrows the primary key', () => {
  assert.equal(context.civKeyForOwnerId(123), '');
});

check('shared presentation helper routes all known owners canonically and retains only unknown display placeholders', () => {
  assert.equal(context.civKeyForOwner(0), 'rzymianie');
  assert.equal(context.civKeyForOwner(7), 'zulusi');
  assert.equal(context.civKeyForOwner(42), 'chinczycy');
  assert.equal(context.civKeyForOwner(99), 'egipt');
  assert.equal(context.civKeyForOwner(123), 'oid-123');
});

check('actual shared diplomacy tick context resolves the nonzero human seat culture and religion', () => {
  const contextForSecondary = context.buildDiplomacyTickCtxForPair(7, 99);
  assert.equal(contextForSecondary.wspolnaReligia, true);
  const unknownContext = context.buildDiplomacyTickCtxForPair(123, 99);
  assert.equal(unknownContext.wspolnaReligia, false);
});

const sameCultureNodes = propertyInitializers('wspolnaReligia', text =>
  text.includes('sameCultureCircle(civKeyForOwnerId(ME()), civKeyForOwnerId(ownerId))'));
const partnerTypeNodes = propertyInitializers('partnerTypCywilizacji', text =>
  text === 'civKeyForOwnerId(ME())');
const aiPairPartnerTypeNodes = propertyInitializers('partnerTypCywilizacji', text =>
  text === 'civKeyForOwnerId(otherId)');
check('actual AI diplomacy gates use validated active-owner identities', () => {
  assert.equal(sameCultureNodes.length, 1, 'one active AI diplomacy shared-religion initializer');
  assert.equal(partnerTypeNodes.length, 1, 'one active AI diplomacy partner-type initializer');
  context.ME = () => 7;
  context.ownerId = 99;
  const sharedReligion = executeExpression(sameCultureNodes[0], context, 'sharedReligion');
  const partnerType = executeExpression(partnerTypeNodes[0], context, 'partnerType');
  assert.equal(partnerType, 'zulusi');
  assert.equal(sharedReligion, true);
  context.ME = () => 123;
  assert.equal(executeExpression(partnerTypeNodes[0], context, 'unknownPartnerType'), '');
  assert.equal(executeExpression(sameCultureNodes[0], context, 'unknownSharedReligion'), false);
});

check('actual AI-to-AI partner type uses its own validated owner key', () => {
  assert.equal(aiPairPartnerTypeNodes.length, 1, 'one AI-to-AI partner type initializer');
  context.otherId = 7;
  assert.equal(executeExpression(aiPairPartnerTypeNodes[0], context, 'aiPairPartnerType'), 'zulusi');
  context.otherId = 123;
  assert.equal(executeExpression(aiPairPartnerTypeNodes[0], context, 'aiPairUnknownPartnerType'), '');
});

check('actual relation breakdown resolves owner-specific type and culture in both argument orders', () => {
  const forward = context.getRelationBreakdown(7, 99);
  const reverse = context.getRelationBreakdown(99, 7);
  assert.equal(forward.wspolnaReligia, true);
  assert.equal(reverse.wspolnaReligia, true);
  assert.equal(forward.rywalizacjaTenSamTyp, false);
  assert.equal(reverse.rywalizacjaTenSamTyp, false);
  assert.equal(forward.roznicaKulturowa, false);
  assert.equal(reverse.roznicaKulturowa, false);
});

check('actual relation breakdown compares the secondary human type, not primary Rome', () => {
  context.aiOwnerCivMap.set(99, 'zulusi');
  const forward = context.getRelationBreakdown(7, 99);
  const reverse = context.getRelationBreakdown(99, 7);
  assert.equal(forward.rywalizacjaTenSamTyp, true);
  assert.equal(reverse.rywalizacjaTenSamTyp, true);
  context.aiOwnerCivMap.set(99, 'egipt');
});

check('actual relation breakdown keeps the different-culture penalty for known owners in both directions', () => {
  const forward = context.getRelationBreakdown(7, 42);
  const reverse = context.getRelationBreakdown(42, 7);
  assert.equal(forward.roznicaKulturowa, true);
  assert.equal(reverse.roznicaKulturowa, true);
  assert.equal(forward.rywalizacjaTenSamTyp, false);
  assert.equal(reverse.rywalizacjaTenSamTyp, false);
});

check('actual relation breakdown treats unknown civ as neutral, not same-type primary fallback', () => {
  const flags = context.getRelationBreakdown(7, 123);
  assert.equal(flags.rywalizacjaTenSamTyp, false);
  assert.equal(flags.wspolnaReligia, false);
  assert.equal(flags.roznicaKulturowa, false);
  const bothUnknown = context.getRelationBreakdown(123, 124);
  assert.equal(bothUnknown.rywalizacjaTenSamTyp, false);
  assert.equal(bothUnknown.roznicaKulturowa, false);
});

const failures = checks.filter(line => line.startsWith('FAIL'));
for (const line of checks) console.log(line);
console.log(`TOTAL ${checks.length - failures.length}/${checks.length}`);
if (failures.length) process.exitCode = 1;
