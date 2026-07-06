'use strict';
/** map-siege-test.cjs — detekcja oblężenia (mapSiegeDetect.ts) */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.join(__dirname, '.map-siege-entry.ts');
const OUT = path.join(__dirname, '.map-siege-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  canInitiateSiege, classifyCityAttack, detectAutoSiegeOnCity, isAdjacentToHex,
} from '../src/game/mapSiegeDetect';
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

const cityWall = { id: 'c1', ownerId: 1, q: 5, r: 0, name: 'Ateny', maMur: true, population: 3 };
const cityPlayer = { id: 'c0', ownerId: 0, q: 0, r: 0, name: 'Rzym', maMur: true, population: 3 };
const atk = { id: 'u0', ownerId: 0, typeId: 'Hastati', q: 4, r: 0, ruchLeft: 2 };
const def = { id: 'u1', ownerId: 1, typeId: 'Falanga', q: -1, r: 0, ruchLeft: 2 };
const units = [atk, def];

console.log('map-siege-test');
assert(M.isAdjacentToHex(4, 0, 5, 0), 'adjacent hex');
assert(!M.isAdjacentToHex(3, 0, 5, 0), 'not adjacent');
assert(M.canInitiateSiege(atk, cityWall), 'player can siege walled enemy');
assert(!M.canInitiateSiege(atk, cityPlayer), 'cannot siege own city');
const ctx = M.classifyCityAttack(atk, cityWall, units);
assert(ctx.tryb === 'oblezenie', 'walled city -> oblezenie');
const auto = M.detectAutoSiegeOnCity(cityPlayer, units);
assert(auto !== null && auto.tryb === 'oblezenie', 'enemy adjacent -> auto siege on player city');

console.log('---', ok, 'ok,', fail, 'fail');
process.exit(fail > 0 ? 1 : 0);
