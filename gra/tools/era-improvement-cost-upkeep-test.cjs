'use strict';
/**
 * R-KOSZTY-EPOKOWE-ULEPSZENIA-Q1 — construction cost + Work upkeep.
 *
 * This gate bundles the real pure modules. It proves that the current Stone
 * values remain the base, Bronze/Iron use x2/x4 exactly once, roads are in the
 * same rule, clearing still has only its one-time start cost, and upkeep is
 * counted once per placed layer and assigned to the territory owner.
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.era-improvement-cost-upkeep-entry.ts');
const BUNDLE = path.resolve(__dirname, '.era-improvement-cost-upkeep-bundle.cjs');
const SRC = path.resolve(__dirname, '..', 'src');
const DATA = require(path.resolve(__dirname, '..', 'data', 'terrain-improvements.json'));

fs.writeFileSync(ENTRY, `
export {
  IMPROVEMENT_KEYS,
  RESOURCE_UPKEEP_IMPROVEMENT_KEYS,
  terrainImprovementEraMultiplier,
  scaleTerrainImprovementWorkCost,
} from ${JSON.stringify(path.join(SRC, 'game/terrain-improvements.ts'))};
export { getImprovementMeta } from ${JSON.stringify(path.join(SRC, 'game/improvement-tech.ts'))};
export {
  countResourceUpkeepImprovementsByOwner,
  computePracaUpkeepByOwner,
} from ${JSON.stringify(path.join(SRC, 'game/turn-economy.ts'))};
`, 'utf8');

let M;
try {
  esbuild.buildSync({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE,
    logLevel: 'silent',
    resolveExtensions: ['.ts', '.js', '.json'],
  });
  M = require(BUNDLE);
} finally {
  try { fs.unlinkSync(ENTRY); } catch (_) {}
}

let pass = 0;
let fail = 0;
function ok(condition, message) {
  if (condition) pass++;
  else {
    fail++;
    console.error('FAIL:', message);
  }
}
function same(actual, expected, message) {
  ok(Object.is(actual, expected), `${message}: expected ${expected}, got ${actual}`);
}

const persistentKeys = M.IMPROVEMENT_KEYS.filter(key => key !== 'wyrab');
same(M.terrainImprovementEraMultiplier(1), 1, 'Stone multiplier');
same(M.terrainImprovementEraMultiplier(2), 2, 'Bronze multiplier');
same(M.terrainImprovementEraMultiplier(3), 4, 'Iron multiplier');
same(M.terrainImprovementEraMultiplier(4), 8, 'era 4 continues explicit doubling rule');
same(M.terrainImprovementEraMultiplier(0), 1, 'era 0 safe fallback');
same(M.terrainImprovementEraMultiplier(Number.NaN), 1, 'missing/NaN era safe fallback');
same(M.scaleTerrainImprovementWorkCost(0, 3), 0, 'zero construction cost stays zero');
same(M.scaleTerrainImprovementWorkCost(Number.NaN, 3), 0, 'invalid construction cost stays zero');

same(
  M.RESOURCE_UPKEEP_IMPROVEMENT_KEYS.size,
  persistentKeys.length,
  'every persistent terrain improvement has Work upkeep',
);
ok(M.RESOURCE_UPKEEP_IMPROVEMENT_KEYS.has('droga'), 'ordinary road is in upkeep set');
ok(M.RESOURCE_UPKEEP_IMPROVEMENT_KEYS.has('droga_brukowana'), 'paved road is in upkeep set');
ok(!M.RESOURCE_UPKEEP_IMPROVEMENT_KEYS.has('wyrab'), 'clearing action is not a persistent upkeep layer');

for (const key of M.IMPROVEMENT_KEYS) {
  const row = DATA[key];
  const meta = M.getImprovementMeta(key);
  const baseStone = row && typeof row.koszt_praca === 'number'
    ? Math.max(1, Math.round(row.koszt_praca * 2))
    : 0;
  const multiplier = M.terrainImprovementEraMultiplier(row && row.epoka);
  const expected = baseStone > 0 ? baseStone * multiplier : 0;
  same(meta?.kosztPraca, expected, `${key} construction cost uses its data era exactly once`);
  ok(Number.isInteger(meta?.kosztPraca ?? 0), `${key} construction cost is an integer`);
}
same(M.getImprovementMeta('droga')?.kosztPraca, 30, 'Droga keeps current Stone base');
same(M.getImprovementMeta('droga_brukowana')?.kosztPraca, 200, 'Droga brukowana uses Iron x4');
same(M.getImprovementMeta('wyrab')?.kosztPraca, 5, 'Wycinka scales only its start cost');

function mkHex(q, r, layers) {
  return { coords: { q, r }, ulepszenia: layers };
}
const allLayersWithDuplicate = [...persistentKeys, 'farma'];
const map = {
  hexes: {
    '0,0': mkHex(0, 0, allLayersWithDuplicate),
    '10,0': mkHex(10, 0, ['droga', 'droga_brukowana']),
    '30,0': mkHex(30, 0, persistentKeys),
    '60,0': mkHex(60, 0, persistentKeys),
  },
};
const nodes = [
  { q: 0, r: 0, pop: 1, level: 1, ownerId: 0 },
  { q: 10, r: 0, pop: 1, level: 1, ownerId: 2 },
];
const counts = M.countResourceUpkeepImprovementsByOwner(map, nodes);
same(counts.get(0), persistentKeys.length, 'player counts each placed layer once');
same(counts.get(2), 2, 'rival road layers count under rival territory');
ok(!counts.has(30), 'outside-territory improvements do not incur an owner upkeep');

const data = {
  econParams: {
    budynki: {
      ulepszenie_surowcowe_upkeep_praca: { easy: 3, normal: 3, hard: 3 },
    },
  },
};
const upkeep = M.computePracaUpkeepByOwner(map, nodes, data, 'normal');
let expectedPlayerUpkeep = 0;
for (const key of persistentKeys) {
  expectedPlayerUpkeep += 3 * M.terrainImprovementEraMultiplier(DATA[key].epoka);
}
same(upkeep.get(0), expectedPlayerUpkeep, 'player upkeep weights every layer by its era');
same(upkeep.get(2), 3 * (1 + 4), 'rival upkeep includes ordinary + paved road exactly once');
same(M.computePracaUpkeepByOwner({ hexes: {} }, [], {}, 'normal').size, 0, 'missing map/data is a zero-upkeep result');

try { fs.unlinkSync(BUNDLE); } catch (_) {}
console.log(`era-improvement-cost-upkeep-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
