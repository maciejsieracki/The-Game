'use strict';
// R3 runda 3: odstep ujsc per masa + diagnostyka lukowa (jesli gen-helpers ma __gapDiag).
// Uzycie: node r3-permass.cjs <typ> <seed> [w] [h]
const typ = process.argv[2] || 'kontynenty';
const seed = Number(process.argv[3] || 42);
const w = Number(process.argv[4] || 168), h = Number(process.argv[5] || 120);
const landFraction = typ === 'pangea' ? 0.35 : 0.3;
const M = require('./bundle.cjs')('r3pm', `
export { generateMap } from '../src/map/generator';
export {
  worstMainRiverCoastMouthGapOnMass, mainRiverCoastMouthMaxGapForDims,
  groupLandMassKeys, oceanConnectedWaterKeys,
} from '../src/map/gen-helpers';
`);
const t0 = Date.now();
const label = (w === 168 && h === 120) ? 'Standardowy' : (w <= 100 ? 'Mały' : 'Standardowy');
const map = M.generateMap(w, h, seed, typ, {
  mapSizeMenuLabel: label, landFraction,
  worldDensity: { rivers: 'medium', forest: 'medium', desert: 'medium', relief: 'medium' },
});
const ms = Date.now() - t0;
const maxGap = M.mainRiverCoastMouthMaxGapForDims(w, h);
const ocean = M.oceanConnectedWaterKeys(map.hexes, w, h);
const masses = M.groupLandMassKeys(map.hexes).filter((m) => m.length >= 8);
const rows = [];
for (const mass of masses) {
  const { ok, worstGap } = M.worstMainRiverCoastMouthGapOnMass(
    new Set(mass), map.hexes, map.riverPaths, map.riverPathKinds ?? [], w, h, ocean, maxGap);
  rows.push({ size: mass.length, ok, worstGap });
}
const out = {
  typ, seed, w, h, maxGap, ms, masses: rows.length,
  bad: rows.filter((r) => !r.ok).map((r) => `${r.size}:${r.worstGap}`),
  worstGapAll: Math.max(0, ...rows.map((r) => r.worstGap)),
  mainRivers: (map.riverPathKinds ?? []).filter((k) => k === 'main').length,
  rivers: (map.riverPaths ?? []).length,
};
console.log(JSON.stringify(out));
if (globalThis.__forkDiag) console.log('FORK', JSON.stringify(globalThis.__forkDiag));
if (process.env.DIAG) {
  const G = globalThis.__gapDiagOut || [];
  const last = new Map();
  for (const g of G) last.set(g.stage + ':' + g.massSize, g);
  for (const g of last.values()) console.log('DIAG', JSON.stringify(g));
}
