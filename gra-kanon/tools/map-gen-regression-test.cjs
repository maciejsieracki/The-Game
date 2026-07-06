'use strict';
/** B0.1+B0.2 AC: czas generacji + 0 głównych rzek bez ujścia (5 seedów × 4 typy). */

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.map-gen-regression-entry.ts');
const BUNDLE = path.join(__dirname, '.map-gen-regression-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `export { generujSwiat } from '../src/map/generator';
export { pathEndsAtSea } from '../src/map/gen-helpers';`,
  'utf8',
);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  outfile: BUNDLE,
  absWorkingDir: GRA,
  loader: { '.ts': 'ts', '.json': 'json' },
  logLevel: 'silent',
});

const M = require(BUNDLE);

const SEEDS = [42, 123, 777, 7, 2026];
const TYPES = ['kontynenty', 'pangea', 'wyspy', 'ziemia'];
const DENSITY = {
  rivers: 'medium',
  forest: 'medium',
  desert: 'medium',
  relief: 'medium',
};

function hexHash(hexes) {
  const keys = Object.keys(hexes).sort();
  let h = 0;
  for (const k of keys) {
    const hex = hexes[k];
    const s = `${k}:${hex.terenBazowy}:${hex.nakladka ?? ''}`;
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(16);
}

function countBadMainRivers(map) {
  const W = map.szerokoscQ;
  const H = map.wysokoscR;
  let bad = 0;
  let totalMain = 0;
  for (let i = 0; i < map.riverPaths.length; i++) {
    if (map.riverPathKinds?.[i] !== 'main') continue;
    totalMain++;
    const path = map.riverPaths[i];
    if (!path?.length) {
      bad++;
      continue;
    }
    if (!M.pathEndsAtSea(map.hexes, path, W, H)) bad++;
  }
  return { bad, totalMain };
}

function bench(rozmiar, label) {
  const t0 = Date.now();
  M.generujSwiat(42, rozmiar, 'kontynenty', { worldDensity: DENSITY });
  const ms = Date.now() - t0;
  console.log(`  ${label}: ${(ms / 1000).toFixed(2)}s`);
  return ms;
}

console.log('=== Czasy generacji (seed 42, kontynenty) ===');
const tMaly = bench('maly', 'mała (108×74)');
const tStd = bench('standardowy', 'standardowa (168×120)');
const tDuzy = bench('duzy', 'duża (240×168)');

console.log('\n=== Rzeki bez ujścia (5 seedów × 4 typy, mała mapa) ===');
let totalBad = 0;
let totalMain = 0;
let fail = 0;

for (const seed of SEEDS) {
  for (const typ of TYPES) {
    const map = M.generujSwiat(seed, 'maly', typ, { worldDensity: DENSITY });
    const { bad, totalMain: tm } = countBadMainRivers(map);
    totalBad += bad;
    totalMain += tm;
    if (bad > 0) {
      fail++;
      console.error(`FAIL seed=${seed} typ=${typ}: ${bad}/${tm} głównych bez ujścia`);
    }
  }
}

console.log(`Główne rzeki OK: ${totalMain - totalBad}/${totalMain} (${fail} przypadków fail)`);

console.log('\n=== Determinizm (seed 42, standardowy, kontynenty ×2) ===');
const a = M.generujSwiat(42, 'standardowy', 'kontynenty', { worldDensity: DENSITY });
const b = M.generujSwiat(42, 'standardowy', 'kontynenty', { worldDensity: DENSITY });
const ha = hexHash(a.hexes);
const hb = hexHash(b.hexes);
const detOk = ha === hb;
console.log(`  hash A=${ha} B=${hb} → ${detOk ? 'IDENTYCZNY' : 'RÓŻNY'}`);
if (!detOk) fail++;

const stdOk = tStd < 5000;
const duzyOk = tDuzy < 15000;
console.log(`\n=== AC ===`);
console.log(`  standard <5s: ${stdOk ? 'PASS' : 'FAIL'} (${(tStd / 1000).toFixed(2)}s)`);
console.log(`  duża <15s: ${duzyOk ? 'PASS' : 'FAIL'} (${(tDuzy / 1000).toFixed(2)}s)`);
console.log(`  0 rzek bez ujścia: ${totalBad === 0 ? 'PASS' : 'FAIL'} (${totalBad} złych)`);
console.log(`  determinizm: ${detOk ? 'PASS' : 'FAIL'}`);

const allOk = stdOk && duzyOk && totalBad === 0 && detOk && fail === 0;
process.exit(allOk ? 0 : 1);
