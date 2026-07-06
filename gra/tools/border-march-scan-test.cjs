'use strict';
/** P5 — border-march-scan.ts + territoryOwnerAt */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.border-march-entry.ts');
const BUNDLE = path.resolve(__dirname, '.border-march-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  collectUnauthorizedBorderPairs,
  defaultIsMilitaryUnit,
} from '../src/game/border-march-scan';
export { territoryOwnerAt } from '../src/map/territory';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, logLevel: 'silent',
  resolveExtensions: ['.ts', '.js', '.json'],
});

const M = require(BUNDLE);
let pass = 0, fail = 0;
function ok(c, m) { if (c) pass++; else { fail++; console.error('FAIL:', m); } }
function eq(a, b, m) { ok(a === b, `${m} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

const cityA = { q: 0, r: 0, pop: 10, level: 1, ownerId: 0 };
const cityB = { q: 8, r: 0, pop: 10, level: 1, ownerId: 1 };
const nodes = [cityA, cityB];

// territoryOwnerAt
eq(M.territoryOwnerAt(1, 0, nodes), 0, 'hex (1,0) owned by civ 0');
eq(M.territoryOwnerAt(7, 0, nodes), 1, 'hex (7,0) owned by civ 1');
ok(M.territoryOwnerAt(20, 20, nodes) === null, 'neutral hex null');

// overlap: closer node wins
const near = { q: 0, r: 0, pop: 15, level: 1, ownerId: 0 };
const far = { q: 5, r: 0, pop: 15, level: 1, ownerId: 1 };
eq(M.territoryOwnerAt(2, 0, [near, far]), 0, 'overlap nearest wins');

const isMil = M.defaultIsMilitaryUnit;

// own territory — no pairs
const ownOnly = [{ id: 'u1', ownerId: 0, typeId: 'Wojownik', category: 'miecznik', q: 1, r: 0, ruch: 2, ruchLeft: 2 }];
ok(M.collectUnauthorizedBorderPairs(ownOnly, nodes, isMil).length === 0, 'own territory empty');

// foreign — one pair
const intruder = [{ id: 'u2', ownerId: 0, typeId: 'Wojownik', category: 'miecznik', q: 7, r: 0, ruch: 2, ruchLeft: 2 }];
const pairs1 = M.collectUnauthorizedBorderPairs(intruder, nodes, isMil);
eq(pairs1.length, 1, 'one pair');
eq(pairs1[0].intruderOwnerId, 0, 'intruder 0');
eq(pairs1[0].territoryOwnerId, 1, 'owner 1');

// dedupe — 3 units same pair
const triple = [
  { id: 'a', ownerId: 0, typeId: 'Wojownik', category: 'miecznik', q: 7, r: 0, ruch: 2, ruchLeft: 2 },
  { id: 'b', ownerId: 0, typeId: 'Wojownik', category: 'miecznik', q: 7, r: 1, ruch: 2, ruchLeft: 2 },
  { id: 'c', ownerId: 0, typeId: 'Wojownik', category: 'miecznik', q: 8, r: 0, ruch: 2, ruchLeft: 2 },
];
eq(M.collectUnauthorizedBorderPairs(triple, nodes, isMil).length, 1, 'dedupe 3 units');

// neutral — no pair
const neutral = [{ id: 'n', ownerId: 0, typeId: 'Wojownik', category: 'miecznik', q: 20, r: 20, ruch: 2, ruchLeft: 2 }];
ok(M.collectUnauthorizedBorderPairs(neutral, nodes, isMil).length === 0, 'neutral no pair');

// garnizon skip
const garr = [{ id: 'g', ownerId: 0, typeId: 'Wojownik', category: 'miecznik', q: 7, r: 0, ruch: 2, ruchLeft: 2, inGarnizon: true }];
ok(M.collectUnauthorizedBorderPairs(garr, nodes, isMil).length === 0, 'garnizon skipped');

console.log(`border-march-scan-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
