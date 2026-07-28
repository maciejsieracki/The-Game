'use strict';
/** Bramka własności terytorium — ulepszenia / obsada tylko na swoim heksie. */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.improvement-territory-gate-entry.ts');
const BUNDLE = path.resolve(__dirname, '.improvement-territory-gate-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { buildImprovementQualifier } from '../src/map/improvement-build';
export { isTerritoryHexOwnedBy } from '../src/map/territory-work';
export { TerenBazowy, Nakladka } from '../src/types/hex';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, logLevel: 'silent',
  resolveExtensions: ['.ts', '.js', '.json'],
});

const M = require(BUNDLE);
let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; } else { fail++; console.error('FAIL:', msg); } }

const TB = M.TerenBazowy;
const NK = M.Nakladka;

function mkHex(q, r, teren, nakladka = NK.Brak) {
  return {
    coords: { q, r },
    terenBazowy: teren,
    nakladka,
    rzeka: { obecna: false, krawedzie: [] },
    ulepszenie: 'brak',
    wioska: { istnieje: false, ludnosc: 0 },
    wlasciciel: null,
  };
}

const overlapNodes = [
  { q: 0, r: 0, pop: 10, level: 1, ownerId: 0 },
  { q: 5, r: 0, pop: 10, level: 1, ownerId: 99 },
];
const map = {
  hexes: {
    '0,0': mkHex(0, 0, TB.Rownina),
    '4,0': mkHex(4, 0, TB.Laka, NK.Las),
    '2,1': mkHex(2, 1, TB.Laka, NK.Las),
  },
  riverPaths: [],
  startPositions: [{ q: 0, r: 0 }],
};

ok(!M.isTerritoryHexOwnedBy(4, 0, 0, overlapNodes), 'overlap: hex (4,0) NOT player');
ok(M.isTerritoryHexOwnedBy(2, 1, 0, overlapNodes), 'overlap: hex (2,1) IS player');
ok(!M.isTerritoryHexOwnedBy(2, 1, 0, []), 'empty territoryNodes -> fail-closed');

const qual = M.buildImprovementQualifier({
  map,
  cityNodes: [{ q: 0, r: 0, pop: 10, level: 1 }],
  territoryNodes: overlapNodes,
  playerOwnerIdNum: 0,
  playerCivArchetype: 'rzymianie',
  playerEra: 1,
  researchedTechs: new Set(['Obróbka drewna']),
});

ok(!qual('tartak', 4, 0), 'tartak blocked on enemy-owned las');
ok(qual('tartak', 2, 1), 'tartak allowed on player-owned las');
ok(!qual('farma', 4, 0), 'farma blocked on enemy territory');

try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE); } catch (_) {}

console.log(`improvement-territory-gate-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
