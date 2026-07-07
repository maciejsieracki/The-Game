'use strict';
/** city-hex-movement-test.cjs — Run from gra/: node tools/city-hex-movement-test.cjs */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.city-hex-entry.ts');
const BUNDLE = path.resolve(__dirname, '.city-hex-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `export { canUnitOccupyCityHex, foreignCityHexKeys, addForeignCityBlocks } from '../src/game/city-hex-movement';`,
  'utf8',
);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  outfile: BUNDLE,
  logLevel: 'silent',
});

const { canUnitOccupyCityHex, foreignCityHexKeys, addForeignCityBlocks } = require(BUNDLE);

let ok = 0;
let fail = 0;
function eq(a, b, msg) {
  if (a === b) { ok++; console.log('  [OK] ' + msg); }
  else { fail++; console.error('  [FAIL] ' + msg + ' got ' + JSON.stringify(a)); }
}

const cities = [
  { id: 'c0', ownerId: 0, q: 0, r: 0, name: 'Teby', population: 3 },
  { id: 'c1', ownerId: 2, q: 5, r: 0, name: 'Kapua', population: 2 },
];

console.log('\n[city-hex-movement-test]\n');
eq(canUnitOccupyCityHex(0, 0, 0, cities), true, 'gracz może stać na własnym mieście');
eq(canUnitOccupyCityHex(2, 0, 0, cities), false, 'obcy nie może wejść na miasto gracza');
eq(canUnitOccupyCityHex(0, 3, 3, cities), true, 'pusty heks OK');
eq(canUnitOccupyCityHex(-1, 0, 0, cities), false, 'barbarzyńca nie wchodzi na miasto gracza');
eq(foreignCityHexKeys(0, cities).has('0,0'), false, 'własne miasto nie jest foreign dla gracza');
eq(foreignCityHexKeys(0, cities).has('5,0'), true, 'obce miasto jest foreign dla gracza');
eq(addForeignCityBlocks(new Set(['1,1']), 0, cities).has('5,0'), true, 'addForeignCityBlocks dodaje obce');

try { fs.unlinkSync(ENTRY); } catch (_) {}
try { fs.unlinkSync(BUNDLE); } catch (_) {}

console.log(fail ? '\nFAIL ' + ok + '/' + (ok + fail) : '\nCITY-HEX-MOVEMENT OK (' + ok + ')');
process.exit(fail ? 1 : 0);
