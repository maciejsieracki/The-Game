'use strict';

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.army-split-movement-entry.ts');
const BUNDLE = path.join(__dirname, '.army-split-movement-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { splitMoveCost } from '../src/game/barbarians';
export { deductStackRuchLeft, stackRuchLeft } from '../src/game/armyMerge';
`, 'utf8');
esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  absWorkingDir: ROOT,
  logLevel: 'silent',
});

const { splitMoveCost, deductStackRuchLeft, stackRuchLeft } = require(BUNDLE);
let pass = 0;
let fail = 0;
function assert(condition, message) {
  if (condition) {
    pass++;
    console.log('  PASS:', message);
  } else {
    fail++;
    console.error('  FAIL:', message);
  }
}

function hex(q, r) {
  return {
    coords: { q, r },
    terenBazowy: 'laka',
    nakladka: 'brak',
    ulepszenie: 'brak',
    rzeka: { obecna: false, krawedzie: [] },
  };
}

const map = {
  szerokoscQ: 3,
  wysokoscR: 3,
  seed: 1,
  riverPaths: [],
  hexes: {
    '0,0': hex(0, 0),
    '1,0': hex(1, 0),
  },
};
const costFn = () => 2;
const mover = { id: 'a', ownerId: 0, q: 0, r: 0, ruch: 4, ruchLeft: 4, typeId: 'Wojownik' };
const sameHexCost = splitMoveCost(mover, map, 0, 0, new Set(), costFn);
const adjacentCost = splitMoveCost(mover, map, 1, 0, new Set(), costFn);
assert(sameHexCost === 0, 'rozdzielenie na tym samym heksie ma koszt 0');
assert(adjacentCost === 2, 'rozdzielenie na sąsiedni heks pobiera rzeczywisty koszt pola (2)');

const split = [
  { ...mover, id: 'a', ruchLeft: 4 },
  { ...mover, id: 'b', ruchLeft: 4 },
];
deductStackRuchLeft(split, adjacentCost);
assert(stackRuchLeft(split) === 2, 'po rozdziale wspólna pula wynosi 4 - 2 = 2');
assert(split.every(u => u.ruchLeft === 2), 'obie odłączone jednostki zachowują tę samą pozostałą pulę ruchu');

console.log(`\\narmy-split-movement-test: ${pass} pass, ${fail} fail`);
try { fs.unlinkSync(ENTRY); } catch (_) { /* noop */ }
try { fs.unlinkSync(BUNDLE); } catch (_) { /* noop */ }
process.exit(fail > 0 ? 1 : 0);
