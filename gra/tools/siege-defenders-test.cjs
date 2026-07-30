'use strict';
/** siege-defenders-test.cjs — C3-ST-1…2 hasCityDefenders (siegeDefenders.ts) */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.join(__dirname, '.siege-defenders-entry.ts');
const OUT = path.join(__dirname, '.siege-defenders-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  hasCityDefenders, canCaptureCityWithoutBattle, defenderUnitsNearCity,
  survivorsLiveSet,
} from '../src/game/siegeDefenders';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: OUT,
  absWorkingDir: path.resolve(__dirname, '..'),
  logLevel: 'silent',
});

const M = require(OUT);
let ok = 0, fail = 0;
function assert(c, msg) {
  if (c) { console.log('  [OK]', msg); ok++; }
  else { console.error('  [FAIL]', msg); fail++; }
}

const city = { id: 'at', ownerId: 1, q: 10, r: 5, name: 'Ateny', maMur: true, population: 8, garnizon: 0 };
const archer = { id: 'e0', ownerId: 1, typeId: 'Lucznik', q: 10, r: 5, ruchLeft: 0 };
const far = { id: 'e1', ownerId: 1, typeId: 'Falanga', q: 12, r: 5, ruchLeft: 0 };
const atk = { id: 'p0', ownerId: 0, typeId: 'Hastati', q: 9, r: 5, ruchLeft: 1 };

console.log('siege-defenders-test (C3-ST-1)');

assert(!M.hasCityDefenders(city, [atk]), 'pop only, no garnizon, no units → no defenders');
assert(M.canCaptureCityWithoutBattle(city, [atk]), 'can capture without battle when empty');

const atkOnHex = { ...atk, q: 10, r: 5 };
assert(M.canCaptureCityWithoutBattle(city, [atkOnHex]), 'combat unit ON empty enemy city hex → can capture (split/march auto)');

assert(M.hasCityDefenders(city, [atk, archer]), 'enemy unit on city hex → defenders');
assert(M.defenderUnitsNearCity(city, [archer]).length === 1, 'defenderUnitsNearCity on hex');

assert(!M.hasCityDefenders(city, [atk, far]), 'unit dist 2 → not defender');

const cityG = { ...city, garnizon: 3 };
assert(M.hasCityDefenders(cityG, [atk]), 'garnizon>0 alone → defenders');
assert(!M.canCaptureCityWithoutBattle(cityG, [atk]), 'garnizon blocks instant capture');

const adj = { id: 'e2', ownerId: 1, typeId: 'Milicja', q: 11, r: 5, ruchLeft: 0 };
assert(M.hasCityDefenders(city, [atk, adj]), 'adjacent defender dist=1 → defenders');

assert(M.survivorsLiveSet([]) === null, 'empty survivors → null (winner branch)');
assert(M.survivorsLiveSet(undefined) === null, 'undefined survivors → null');
const liveSet = M.survivorsLiveSet([{ id: 'u1' }]);
assert(liveSet !== null && liveSet.has('u1'), 'non-empty survivors → Set');

console.log('---', ok, 'ok,', fail, 'fail');
process.exit(fail > 0 ? 1 : 0);
