'use strict';
// R3: odstęp ujść głównych rzek wzdłuż wybrzeża vs limit (MAIN_RIVER_COAST_MOUTH_MAX_GAP = 7).
// Argumenty: typ seed (domyślnie kontynenty 42). Ziemia w teście ma tolerancję maxGap+35.
const typ = process.argv[2] || 'kontynenty';
const seed = Number(process.argv[3] || 42);
const landFraction = typ === 'pangea' ? 0.35 : 0.3;
const M = require('./bundle.cjs')('r3', `
export { generateMap } from '../src/map/generator';
export {
  buildSeaDistanceField, worstMainRiverCoastMouthGapOnMass, mainRiverCoastMouthMaxGapForDims,
  groupLandMassKeys, oceanConnectedWaterKeys, MAIN_RIVER_COAST_MOUTH_MAX_GAP,
} from '../src/map/gen-helpers';
`);
const w = 168, h = 120;
const map = M.generateMap(w, h, seed, typ, {
  mapSizeMenuLabel: 'Standardowy',
  landFraction,
  worldDensity: { rivers: 'medium', forest: 'medium', desert: 'medium', relief: 'medium' },
});
const maxGap = M.mainRiverCoastMouthMaxGapForDims(w, h);
const ocean = M.oceanConnectedWaterKeys(map.hexes, w, h);
const masses = M.groupLandMassKeys(map.hexes).filter((m) => m.length >= 8);
const rows = [];
for (const mass of masses) {
  const { ok: gapOk, worstGap } = M.worstMainRiverCoastMouthGapOnMass(
    new Set(mass), map.hexes, map.riverPaths, map.riverPathKinds ?? [], w, h, ocean, maxGap,
  );
  rows.push({ size: mass.length, gapOk, worstGap });
}
const mainCount = (map.riverPathKinds ?? []).filter((k) => k === 'main').length;
console.log(JSON.stringify({
  typ, seed, limitMaxGap: maxGap, zyskTolerancjiZiemia: typ === 'ziemia' ? maxGap + 35 : null,
  landMassesChecked: rows.length, mainRiverPaths: mainCount,
  badMasses: rows.filter((r) => !r.gapOk).map((r) => ({ size: r.size, worstGap: r.worstGap })),
  worstGapAll: Math.max(0, ...rows.map((r) => r.worstGap)),
}));
