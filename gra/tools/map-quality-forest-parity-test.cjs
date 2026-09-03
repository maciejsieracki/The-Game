'use strict';
/** MAPA E1 — las logiczny (Nakladka.Las) ≠ liczba meshów; robloxLite nie redukuje drzew. */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.map-quality-forest-entry.ts');
const BUNDLE = path.resolve(__dirname, '.map-quality-forest-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { generujSwiat } from '../src/map/generator';
export { TerenBazowy, Nakladka } from '../src/types/hex';
export {
  forestTreeCountForHex,
  buildStyleForestCluster,
} from '../src/render/mapRenderStyle';
export { findInlandWaterHexes } from '../src/map/gen-helpers';
export { HEX_R } from '../src/render/hexutil';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, logLevel: 'silent',
  resolveExtensions: ['.ts', '.js', '.json'],
});

const M = require(BUNDLE);
let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; } else { fail++; console.error('FAIL:', msg); } }

function countMeshes(group) {
  let n = 0;
  group.traverse(obj => { if (obj.isMesh) n++; });
  return n;
}

function forestLandHexes(map) {
  const keys = [];
  for (const hex of Object.values(map.hexes)) {
    const t = hex.terenBazowy;
    if (hex.nakladka !== M.Nakladka.Las) continue;
    if (t === M.TerenBazowy.Morze || t === M.TerenBazowy.PlytkieMorze) continue;
    keys.push(`${hex.coords.q},${hex.coords.r}`);
  }
  return keys.sort();
}

const map1 = M.generujSwiat(424242, 'maly', 'kontynenty');
const map2 = M.generujSwiat(424242, 'maly', 'kontynenty');
ok(JSON.stringify(forestLandHexes(map1)) === JSON.stringify(forestLandHexes(map2)),
  'deterministic forest hex keys for seed+rozmiar');

const forests = forestLandHexes(map1);
ok(forests.length > 5, 'sample map has forest hexes');

const map139 = M.generujSwiat(139, 'standardowy', 'kontynenty', {
  landFraction: 0.2,
  worldDensity: { resources: 'medium', rivers: 'medium', desert: 'medium', forest: 'medium', relief: 'medium' },
});
ok(forestLandHexes(map139).length > 0, 'seed 139 @20% land has forest hexes (regression sparse land)');

for (const [label, map] of [
  ['424242', map1],
  ['139@20%', map139],
]) {
  const inland = M.findInlandWaterHexes(map.hexes, map.szerokoscQ, map.wysokoscR);
  ok(inland.length === 0, `no inland water kontynenty ${label} (got ${inland.length})`);
}

for (const key of forests.slice(0, 24)) {
  const hex = map1.hexes[key];
  const { q, r } = hex.coords;
  const n = M.forestTreeCountForHex(q, r, map1.seed);
  ok(n >= 3 && n <= 5, `tree count 3–5 at ${key}`);

  const params = { q, r, x: 0, z: 0, baseY: 0.5, seed: map1.seed, R: M.HEX_R };
  const full = M.buildStyleForestCluster('roblox', params, false);
  const lite = M.buildStyleForestCluster('roblox', params, true);
  const mf = countMeshes(full);
  const ml = countMeshes(lite);
  ok(mf > 0 && ml > 0, `decor meshes present at ${key}`);
  ok(ml < mf, `lite fewer meshes than full at ${key}`);
  ok(ml >= n, `lite at least one mesh per tree (trunk) at ${key}`);
}

try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE); } catch (_) {}

console.log(`map-quality-forest-parity-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
