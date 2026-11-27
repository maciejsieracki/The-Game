'use strict';
/**
 * MAPFIX2 (R-WEB-MAP-ISLANDS-ORPHAN-FIX-Q1): regresja sieci rzecznej na wyspach.
 * Purge suchego lądu bez sąsiada-lądu przerywał łańcuchy rzek -> osierocone heksy rzeczne
 * (seed 777, typ wyspy, rivers=high: 10 heksów w bazie MAPFIX). Test generuje tę mapę
 * (poziom maksymalny rzek) i wymaga: 0 osieroconych heksów sieci rzecznej ORAZ 0 samotnych lądów.
 * Czerwony wariant: generator.ts z zwykłym purgeOpenOceanLandSpecks (bez
 * purgeOpenOceanLandSpecksAndReconcileRivers) daje orphanCount > 0 na tym samym ziarnie.
 * Czas: ~7-9 min (pełna generacja mapy standardowej) — ciężki test, uruchamiany ręcznie.
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const BUNDLE = path.resolve(__dirname, '.map-islands-orphan-bundle.cjs');
const ENTRY = path.resolve(__dirname, '.map-islands-orphan-entry.ts');

fs.writeFileSync(
  ENTRY,
  `export { generujSwiat } from '../src/map/generator';
export { verifyRiverNetworkConnectivity } from '../src/map/gen-helpers';
export { isWaterTerrain } from '../src/units/setup';`,
  'utf8',
);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  outfile: BUNDLE,
  logLevel: 'silent',
});

const M = require(BUNDLE);
const DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
const SEED = 777;
const TYP = 'wyspy';
const DENSITY = { rivers: 'high', forest: 'medium', desert: 'medium', relief: 'medium' };

const origLog = console.log;
const origInfo = console.info;
console.info = () => {};
console.log = () => {};
let map;
try {
  map = M.generujSwiat(SEED, 'standardowy', TYP, { worldDensity: DENSITY });
} finally {
  console.log = origLog;
  console.info = origInfo;
}

const W = map.szerokoscQ;
const H = map.wysokoscR;
const net = M.verifyRiverNetworkConnectivity(
  map.hexes,
  map.riverPaths ?? [],
  map.riverPathKinds ?? [],
  W,
  H,
);

let solitary = 0;
for (const [k, h] of Object.entries(map.hexes)) {
  if (M.isWaterTerrain(h.terenBazowy)) continue;
  const [q, r] = k.split(',').map(Number);
  let dry = 0;
  for (const [dq, dr] of DIRS) {
    const nh = map.hexes[`${q + dq},${r + dr}`];
    if (nh && !M.isWaterTerrain(nh.terenBazowy)) dry++;
  }
  if (dry === 0) solitary++;
}

try {
  fs.unlinkSync(ENTRY);
  fs.unlinkSync(BUNDLE);
} catch (_e) {
  /* sprzątanie best-effort */
}

const fails = [];
if (net.orphanCount !== 0) fails.push(`orphanCount=${net.orphanCount} (oczekiwano 0)`);
if (solitary !== 0) fails.push(`solitaryLand=${solitary} (oczekiwano 0)`);

if (fails.length > 0) {
  console.error(`FAIL map-islands-orphan-test seed=${SEED} typ=${TYP} rivers=high: ${fails.join('; ')}`);
  process.exit(1);
}
console.log(`PASS map-islands-orphan-test seed=${SEED} typ=${TYP} rivers=high: orphan=0 solitary=0 (riverHexCount=${net.riverHexCount})`);
