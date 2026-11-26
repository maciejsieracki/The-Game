'use strict';
// Pomiar: node measure.cjs <gra_dir> <label> <seed> <rivers> <typ>
const fs = require('fs'); const path = require('path');
const [GRA, LABEL, SEED, RIVERS, TYP] = process.argv.slice(2);
const DIR = __dirname;
const ENTRY = path.join(DIR, `.entry-${LABEL}.ts`), BUNDLE = path.join(DIR, `.bundle-${LABEL}.cjs`);
const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
fs.writeFileSync(ENTRY, `export { generujSwiat } from '${GRA}/src/map/generator';
export { verifyRiverNetworkConnectivity } from '${GRA}/src/map/gen-helpers';
export { isWaterTerrain } from '${GRA}/src/units/setup';`, 'utf8');
esbuild.buildSync({ entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: BUNDLE, absWorkingDir: GRA, loader: { '.ts': 'ts', '.json': 'json' }, logLevel: 'silent' });
const M = require(BUNDLE);
const DEN = { rivers: RIVERS, forest: 'medium', desert: 'medium', relief: 'medium' };
const t0 = Date.now();
const map = M.generujSwiat(Number(SEED), 'standardowy', TYP, { worldDensity: DEN });
const W = map.szerokoscQ, H = map.wysokoscR;
const net = M.verifyRiverNetworkConnectivity(map.hexes, map.riverPaths ?? [], map.riverPathKinds ?? [], W, H);
const DIRS = [[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]];
let land = 0, solitary = 0;
for (const [k, h] of Object.entries(map.hexes)) {
  if (M.isWaterTerrain(h.terenBazowy)) continue;
  land++;
  const [q, r] = k.split(',').map(Number);
  let n = 0;
  for (const [dq, dr] of DIRS) { const nh = map.hexes[`${q+dq},${r+dr}`]; if (nh && !M.isWaterTerrain(nh.terenBazowy)) { n++; break; } }
  if (n === 0) solitary++;
}
const rh = globalThis.__rh ?? [];
console.log(JSON.stringify({ label: LABEL, seed: +SEED, rivers: RIVERS, typ: TYP, orphanCount: net.orphanCount,
  riverHexCount: net.riverHexCount, land, solitaryLand: solitary, purgedRiverHexes: rh.length,
  purgedRiverKeys: [...new Set(rh)].slice(0, 20), sec: Math.round((Date.now() - t0) / 1000) }));
