'use strict';
/**
 * fort-vision-test.cjs — R-WEB-FORT-VISION-FOG-Q1
 * Fort (r=5) / posterunek (r=3) = zrodlo wzroku wlasciciela o promieniu terytorium.
 * Run from gra/:  node tools/fort-vision-test.cjs
 */
const fs = require('fs');
const path = require('path');
let passed = 0, failed = 0;
function assert(c, m) { if (c) passed++; else { failed++; console.error('  FAIL:', m); } }
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const SRC = path.resolve(__dirname, '..', 'src');
const ENTRY = path.resolve(__dirname, '.fort-vision-entry.ts');
const BUNDLE = path.resolve(__dirname, '.fort-vision-bundle.cjs');
fs.writeFileSync(ENTRY, `
export { fortSightSources, fortTerritoryNodes } from ${JSON.stringify(SRC + '/game/fort-territory')};
export { computePlayerVisibility, addExplored } from ${JSON.stringify(SRC + '/game/visibility')};
export { territoryOwnerAt } from ${JSON.stringify(SRC + '/map/territory')};
`);
try {
  esbuild.buildSync({ entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    loader: { '.ts': 'ts', '.json': 'json' }, outfile: BUNDLE, absWorkingDir: path.resolve(__dirname, '..'), logLevel: 'silent' });
} catch (e) { console.error('bundle failed', e.message || e); process.exit(1); }
const { fortSightSources, computePlayerVisibility, addExplored, territoryOwnerAt, fortTerritoryNodes } = require(BUNDLE);
fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE);

const hexes = {};
for (let q = -20; q <= 20; q++) for (let r = -20; r <= 20; r++) hexes[`${q},${r}`] = { coords: { q, r } };
const map = { hexes, riverPaths: [], startPositions: [] };
const unit = { id: 'u', ownerId: 0, q: 0, r: 0 };
const vis = (forts, owner = 0) => computePlayerVisibility({
  map, playerUnits: [unit], playerCities: [], unitSight: () => 2,
  extraSightSources: fortSightSources(forts, owner),
});
function territoryKeys(forts, owner) {
  const nodes = fortTerritoryNodes(forts); const out = [];
  for (const k of Object.keys(hexes)) { const [q, r] = k.split(',').map(Number); if (territoryOwnerAt(q, r, nodes) === owner) out.push(k); }
  return out;
}

// A: fort r=5 poza odkrytym kolem jednostki -> cale kolo (91) widoczne i odkryte
const fort = { q: 10, r: 0, ownerId: 0, type: 'fort' };
const without = vis([]);
const tk = territoryKeys([fort], 0);
assert(tk.length === 91, 'fort: terytorium 91 heksow, got ' + tk.length);
assert(tk.filter(k => !without.has(k)).length === 91, 'PRZED: 91 pol terytorium fortu poza widokiem');
const withF = vis([fort]);
assert(tk.every(k => withF.has(k)), 'PO: calosc kola fortu widoczna');
const explored = new Set(); addExplored(explored, withF);
assert(tk.every(k => explored.has(k)), 'PO: calosc kola fortu odkryta');

// B: posterunek r=3 -> 37
const post = { q: -10, r: 0, ownerId: 0, type: 'posterunek' };
const tp = territoryKeys([post], 0);
assert(tp.length === 37, 'posterunek: 37, got ' + tp.length);
assert(tp.every(k => vis([post]).has(k)), 'posterunek: kolo r=3 widoczne');
assert(!vis([post]).has('-14,0'), 'posterunek: nic poza r=3');

// C: fort wroga NIE odslania mapy graczowi
const enemy = { q: 10, r: 0, ownerId: 1, type: 'fort' };
const ve = vis([enemy], 0);
assert(!ve.has('10,0') && ve.size === without.size, 'fort wroga nie odslania');
assert(fortSightSources([enemy], 1).length === 1, 'fort wroga jest zrodlem wzroku wroga');

// D: contestedUseless nie daje wzroku
assert(fortSightSources([{ ...fort, contestedUseless: true }], 0).length === 0, 'contestedUseless bez wzroku');

// E: utrata fortu -> widocznosc znika, odkryte zostaje
assert(!vis([]).has('10,0'), 'po utracie: brak widocznosci');
assert(tk.every(k => explored.has(k)), 'po utracie: pola odkryte zostaja');
assert(fortSightSources([{ ...fort, ownerId: 1 }], 0).length === 0, 'zdobyty fort nie daje wzroku dawnemu wlascicielowi');

// F: straznik tekstowy main.ts
const main = fs.readFileSync(path.join(SRC, 'main.ts'), 'utf8');
assert(/fortSightSources\(fortNodes, ME\(\)\)/.test(main), 'main.ts: ownPlayerVisibleHexes uzywa fortSightSources');
assert(/extraSightSources: fortSightSources\(fortNodes, ownerId\)/.test(main), 'main.ts: currentVisibleForOwner (AI) uzywa fortSightSources');

console.log(`\nfort-vision-test: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
