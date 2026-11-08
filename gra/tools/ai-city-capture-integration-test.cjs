'use strict';
/** Realny egzekutor komendy AI: node tools/ai-city-capture-integration-test.cjs */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.ai-city-capture-integration-entry.ts');
const BUNDLE = path.resolve(__dirname, '.ai-city-capture-integration-bundle.cjs');
const MUTANT = path.resolve(__dirname, '..', 'src', 'game', '.ai-city-capture-mutant.ts');
const MUTANT_ENTRY = path.resolve(__dirname, '.ai-city-capture-mutant-entry.ts');
const MUTANT_BUNDLE = path.resolve(__dirname, '.ai-city-capture-mutant-bundle.cjs');
const EXECUTOR_SOURCE = path.resolve(__dirname, '..', 'src', 'game', 'ai-city-capture-executor.ts');

function bundle(entry, outfile) {
  esbuild.buildSync({
    entryPoints: [entry],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile,
    logLevel: 'silent',
  });
  return require(outfile).executeAiCityMove;
}

fs.writeFileSync(
  ENTRY,
  `export { executeAiCityMove } from '../src/game/ai-city-capture-executor';`,
  'utf8',
);
const executeAiCityMove = bundle(ENTRY, BUNDLE);

let ok = 0;
let fail = 0;
function eq(actual, expected, message) {
  if (actual === expected) {
    ok++;
    console.log('  [OK] ' + message);
  } else {
    fail++;
    console.error('  [FAIL] ' + message + ' got ' + JSON.stringify(actual));
  }
}
function expectFailure(fn, message) {
  try {
    fn();
    fail++;
    console.error('  [FAIL] ' + message + ' mutant unexpectedly passed');
  } catch (_) {
    ok++;
    console.log('  [OK] ' + message);
  }
}

function happyPath(execute, ownerId = 1, cityOwnerId = 2) {
  const unit = { id: 'ai-unit', ownerId, q: 0, r: 0, ruchLeft: 2 };
  const city = { id: 'empty-city', ownerId: cityOwnerId, q: 1, r: 0 };
  const commands = [];
  let pathSeen = null;
  const result = execute({
    command: {
      unitId: unit.id,
      toQ: city.q,
      toR: city.r,
      targetCityId: city.id,
    },
    unit,
    cities: [city],
    cityBuiltIds: [],
    hasCityDefenders: false,
    targetVisible: true,
    canOccupyCityHex: false,
    blockedKeys: new Set([`${city.q},${city.r}`]),
    destinationKey: `${city.q},${city.r}`,
    computePath: (movingUnit, toQ, toR, blockedKeys) => {
      pathSeen = { movingUnit, toQ, toR, blockedKeys };
      if (blockedKeys.has('1,0')) return [];
      return [{ q: toQ, r: toR }];
    },
    onMoved: () => commands.push('move'),
    onCapture: (capturedCity, anchor) => {
      capturedCity.ownerId = anchor.ownerId;
      commands.push('capture');
      return true;
    },
  });
  if (!result.moved || !result.captured || city.ownerId !== ownerId) {
    throw new Error('AI adjacent empty city was not captured');
  }
  if (unit.q !== city.q || unit.r !== city.r || unit.ruchLeft !== 0) {
    throw new Error('unit did not execute the adjacent move');
  }
  if (!pathSeen || pathSeen.blockedKeys.has('1,0')) {
    throw new Error('destination remained blocked in the real executor');
  }
  if (commands.join(',') !== 'move,capture') {
    throw new Error('move/capture callback order changed');
  }
  return result;
}

console.log('\n[ai-city-capture-integration-test]\n');
happyPath(executeAiCityMove);
eq(true, true, 'realna komenda AI: ruch + przejęcie pustego miasta');

function rejectedCase(label, overrides = {}) {
  const unit = { id: 'ai-unit', ownerId: 1, q: 0, r: 0, ruchLeft: 2 };
  const city = {
    id: 'target-city',
    ownerId: 2,
    q: 1,
    r: 0,
    ...(overrides.city ?? {}),
  };
  let captured = false;
  const result = executeAiCityMove({
    command: {
      unitId: unit.id,
      toQ: overrides.toQ ?? city.q,
      toR: overrides.toR ?? city.r,
      targetCityId: overrides.targetCityId ?? city.id,
    },
    unit,
    cities: [city],
    cityBuiltIds: overrides.cityBuiltIds ?? [],
    hasCityDefenders: overrides.hasCityDefenders ?? false,
    targetVisible: overrides.targetVisible ?? true,
    canOccupyCityHex: false,
    blockedKeys: new Set(['1,0']),
    destinationKey: '1,0',
    computePath: () => [{ q: city.q, r: city.r }],
    onCapture: () => {
      captured = true;
      return true;
    },
  });
  eq(result.moved, false, label + ' — komenda odrzucona');
  eq(captured, false, label + ' — brak przejęcia');
}

rejectedCase('mur', { cityBuiltIds: ['mury'] });
rejectedCase('obrońcy', { hasCityDefenders: true });
rejectedCase('brak adiacencji', { city: { q: 2, r: 0 } });
rejectedCase('teleport do miasta', { city: { q: 3, r: 0 } });
rejectedCase('błędny targetCityId', { targetCityId: 'other-city' });

const parity = happyPath(executeAiCityMove, 3, 2);
eq(parity.captured, true, 'parytet: owner major i owner miasta-państwa');

const secondTurnUnit = { id: 'ai-unit-2', ownerId: 1, q: 1, r: 0, ruchLeft: 2 };
const secondTurnCity = { id: 'captured-city', ownerId: 1, q: 1, r: 0 };
const secondTurn = executeAiCityMove({
  command: { unitId: secondTurnUnit.id, toQ: 1, toR: 0, targetCityId: secondTurnCity.id },
  unit: secondTurnUnit,
  cities: [secondTurnCity],
  cityBuiltIds: [],
  hasCityDefenders: false,
  targetVisible: true,
  canOccupyCityHex: true,
  blockedKeys: new Set(),
  destinationKey: '1,0',
  computePath: () => [],
});
eq(secondTurn.moved, false, 'druga tura: własne miasto nie wywołuje oscylacji');

// Mutacja produkcyjnego przepływu: usunięcie callbacku przejęcia musi zostać
// wykryte przez ten sam happy-path, a nie przez kopię predykatu.
const source = fs.readFileSync(EXECUTOR_SOURCE, 'utf8');
const mutated = source.replace(
  '&& opts.onCapture?.(destinationCity, unit) === true;',
  '&& false;',
);
if (mutated === source) throw new Error('mutation anchor missing');
fs.writeFileSync(MUTANT, mutated, 'utf8');
fs.writeFileSync(
  MUTANT_ENTRY,
  `export { executeAiCityMove } from '../src/game/.ai-city-capture-mutant';`,
  'utf8',
);
const executeMutant = bundle(MUTANT_ENTRY, MUTANT_BUNDLE);
expectFailure(
  () => happyPath(executeMutant),
  'mutacja produkcyjnego callbacku capture zostaje złapana',
);

for (const file of [ENTRY, BUNDLE, MUTANT, MUTANT_ENTRY, MUTANT_BUNDLE]) {
  try { fs.unlinkSync(file); } catch (_) {}
}

console.log(fail ? `\nFAIL ${ok}/${ok + fail}` : `\nAI-CITY-CAPTURE INTEGRATION OK (${ok})`);
process.exit(fail ? 1 : 0);
