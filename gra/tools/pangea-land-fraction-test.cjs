'use strict';
/** FALA 191/192: Pangea — landFraction 0.20 vs 0.80 musi dawać wyraźnie różne mapy. */

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.pangea-land-fraction-entry.ts');
const BUNDLE = path.join(__dirname, '.pangea-land-fraction-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `import { setRiverGenEnabledOverride } from '../src/map/riverGenSwitch';
setRiverGenEnabledOverride(false);
export { generujSwiat } from '../src/map/generator';
export { countLandSeaHexes, groupLandMassKeys, measurePangeaAnnularCorridorHexes } from '../src/map/gen-helpers';
export { resolveLandFraction } from '../src/map/newGameMapDefaults';
export { TerenBazowy } from '../src/types/hex';`,
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
const TB = M.TerenBazowy;
const DENSITY = { rivers: 'medium', forest: 'medium', desert: 'medium', relief: 'medium' };
const SEEDS = [42, 123, 777];
const FRACTIONS = [0.20, 0.50, 0.80];

function metrics(map) {
  const hexes = map.hexes;
  const { land, total } = M.countLandSeaHexes(hexes);
  const landKeys = Object.keys(hexes).filter((k) => hexes[k].terenBazowy !== TB.Morze);
  let qMin = Infinity, qMax = -Infinity, rMin = Infinity, rMax = -Infinity;
  for (const k of landKeys) {
    const [q, r] = k.split(',').map(Number);
    qMin = Math.min(qMin, q);
    qMax = Math.max(qMax, q);
    rMin = Math.min(rMin, r);
    rMax = Math.max(rMax, r);
  }
  const spanQ = qMax - qMin + 1;
  const spanR = rMax - rMin + 1;
  const bboxArea = spanQ * spanR;
  return {
    land,
    frac: land / total,
    spanQ,
    spanR,
    bboxArea,
    bboxFill: land / Math.max(1, bboxArea),
    aspect: Math.max(spanQ, spanR) / Math.max(1, Math.min(spanQ, spanR)),
  };
}

let fail = 0;
console.log('=== Pangea landFraction (standardowy) ===');
for (const seed of SEEDS) {
  const rows = [];
  for (const lf of FRACTIONS) {
    const map = M.generujSwiat(seed, 'standardowy', 'pangea', {
      worldDensity: DENSITY,
      landFraction: lf,
    });
    const resolved = M.resolveLandFraction({ landFraction: lf }, 'pangea');
    const m = metrics(map);
    const annular = M.measurePangeaAnnularCorridorHexes(map.hexes, map.szerokoscQ, map.wysokoscR);
    rows.push({ lf, resolved, annular, ...m });
    console.log(
      `  seed ${seed} target ${(lf * 100).toFixed(0)}% (resolved ${(resolved * 100).toFixed(0)}%): `
      + `actual ${(m.frac * 100).toFixed(1)}% land=${m.land} bbox ${m.spanQ}x${m.spanR} fill=${m.bboxFill.toFixed(3)} `
      + `annular=${annular}`,
    );
  }
  const low = rows[0];
  const mid = rows[1];
  const high = rows[2];
  const ratio = high.land / Math.max(1, low.land);
  const fracDiffPp = (high.frac - low.frac) * 100;
  const bboxRatio = high.bboxArea / Math.max(1, low.bboxArea);
  const distinct50vs80 = mid.land !== high.land || mid.bboxArea !== high.bboxArea;
  const ratioOk = ratio >= 1.6;
  const fracOk = fracDiffPp >= 12;
  const high80Ok = high.frac >= 0.45;
  const annularOk = high.annular <= 120;
  const ok = ratioOk && fracOk && distinct50vs80 && high80Ok && annularOk;
  if (!ok) fail++;
  console.log(
    `  → seed ${seed} AC: ratio80/20=${ratio.toFixed(2)} (≥1.6 ${ratioOk ? 'OK' : 'FAIL'}) `
    + `fracΔ=${fracDiffPp.toFixed(1)}pp (≥12 ${fracOk ? 'OK' : 'FAIL'}) `
    + `actual80=${(high.frac * 100).toFixed(1)}% (≥45 ${high80Ok ? 'OK' : 'FAIL'}) `
    + `annular=${high.annular} (≤120 ${annularOk ? 'OK' : 'FAIL'}) `
    + `50≠80 ${distinct50vs80 ? 'OK' : 'FAIL'} bboxArea×${bboxRatio.toFixed(2)} → ${ok ? 'PASS' : 'FAIL'}`,
  );
}

console.log(`\n=== AC ===`);
console.log(`  3 seedów PASS: ${fail === 0 ? 'PASS' : 'FAIL'} (${fail} fail)`);
process.exit(fail > 0 ? 1 : 0);
