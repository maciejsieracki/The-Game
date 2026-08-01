import { performance } from 'node:perf_hooks';
import { generateMap, rozmiarToDims } from '../src/map/generator';
import { resetRiverProfileStats, getRiverProfileStats, pathHasValidRiverOutlet, verifyRiverNetworkConnectivity } from '../src/map/gen-helpers';

const SEED = 42;
const typ = (process.env.CIV_WORLD_TYP ?? 'pangea') as 'pangea' | 'ziemia' | 'kontynenty';
const { w, h } = rozmiarToDims('duzy');

resetRiverProfileStats();
const t0 = performance.now();
const map = generateMap(w, h, SEED, typ, {
  worldDensity: { rivers: 'medium', forest: 'medium', desert: 'medium', relief: 'medium' },
  mapSizeMenuLabel: 'Duży',
});
const ms = performance.now() - t0;
const s = getRiverProfileStats();
const kinds = map.riverPathKinds ?? [];
const paths = map.riverPaths ?? [];
let badOutlet = 0;
for (let i = 0; i < paths.length; i++) {
  const path = paths[i];
  if (!path?.length || !pathHasValidRiverOutlet(map.hexes, path, paths, kinds, w, h)) badOutlet++;
}
const net = verifyRiverNetworkConnectivity(map.hexes, paths, kinds, w, h);
console.log(JSON.stringify({
  typ,
  totalS: +(ms / 1000).toFixed(2),
  rivers: paths.length,
  main: kinds.filter((k) => k === 'main').length,
  medium: kinds.filter((k) => k === 'medium').length,
  badOutlet,
  orphanHexes: net.orphanCount,
  genRiversMs: s?.generateRiversMs,
  stage1: s?.genStage1Ms,
  stage2: s?.genStage2Ms,
  stage2Rounds: s?.genStage2Rounds,
  topUp: s?.topUpMs,
  traceCalls: s?.traceRiverCalls,
  traceMs: s?.traceMs,
}, null, 2));
