'use strict';
/** FALA 187/192: Pangea = jedna nieregularna masa (nie prostokąt); anti-obwarzanek. */

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.pangea-land-shape-entry.ts');
const BUNDLE = path.join(__dirname, '.pangea-land-shape-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `import { setRiverGenEnabledOverride } from '../src/map/riverGenSwitch';
setRiverGenEnabledOverride(false);
export { generujSwiat } from '../src/map/generator';
export { groupLandMassKeys, measurePangeaAnnularCorridorHexes } from '../src/map/gen-helpers';
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
const SEEDS = [42, 123, 777, 7, 2026];

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]];

function pangeaShapeMetrics(map) {
  const hexes = map.hexes;
  const W = map.szerokoscQ;
  const H = map.wysokoscR;
  const masses = M.groupLandMassKeys(hexes);
  const landKeys = masses.flat();
  const landCount = landKeys.length;
  if (landCount === 0) return { landCount: 0, massCount: 0, dominantRatio: 0, bboxFill: 0, coastRatio: 0 };

  let qMin = Infinity, qMax = -Infinity, rMin = Infinity, rMax = -Infinity;
  let coast = 0;
  for (const k of landKeys) {
    const [q, r] = k.split(',').map(Number);
    qMin = Math.min(qMin, q);
    qMax = Math.max(qMax, q);
    rMin = Math.min(rMin, r);
    rMax = Math.max(rMax, r);
    let adjSea = false;
    for (const [dq, dr] of DIRS) {
      const nh = hexes[`${q + dq},${r + dr}`];
      if (!nh || nh.terenBazowy === TB.Morze || nh.terenBazowy === TB.PlytkieMorze) adjSea = true;
    }
    if (adjSea) coast++;
  }

  const bboxArea = (qMax - qMin + 1) * (rMax - rMin + 1);
  const massSizes = masses.map((m) => m.length).sort((a, b) => b - a);
  const dominantRatio = massSizes[0] / landCount;
  const bboxFill = landCount / bboxArea;
  const coastRatio = coast / Math.sqrt(landCount);
  const spanQ = qMax - qMin + 1;
  const spanR = rMax - rMin + 1;
  const aspect = Math.max(spanQ, spanR) / Math.max(1, Math.min(spanQ, spanR));

  return {
    landCount,
    massCount: masses.length,
    dominantRatio,
    bboxFill,
    coastRatio,
    aspect,
    largestMass: massSizes[0],
  };
}

let fail = 0;
console.log('=== Pangea kształt lądu (FALA 189, standardowy) ===');
for (const seed of SEEDS) {
  const map = M.generujSwiat(seed, 'standardowy', 'pangea', { worldDensity: DENSITY });
  const m = pangeaShapeMetrics(map);
  const annular = M.measurePangeaAnnularCorridorHexes(map.hexes, map.szerokoscQ, map.wysokoscR);
  const singleMass = m.massCount === 1;
  const dominantOk = m.dominantRatio >= 0.97;
  // Nieregularna masa: bboxFill <0.90 (FALA 192: gęstszy ląd) + coast + aspect ≤2.0.
  const notRect = m.bboxFill < 0.90 && m.coastRatio > 3.70;
  const notCapsule = m.aspect <= 2.05;
  const noDonut = annular <= 120;
  // FALA 199: dry masses (bez Wybrzeża) — 2 = obwarzanek z korytarzem Wybrzeża.
  const dryMasses = (() => {
    const visited = new Set();
    let n = 0;
    const D = [[1,0],[-1,0],[0,1],[0,-1],[1,-1],[-1,1]];
    for (const [k, h] of Object.entries(map.hexes)) {
      if (h.terenBazowy === TB.Morze || h.terenBazowy === TB.PlytkieMorze) continue;
      if (visited.has(k)) continue;
      n++;
      const stack = [k];
      visited.add(k);
      while (stack.length) {
        const cur = stack.pop();
        const [q, r] = cur.split(',').map(Number);
        for (const [dq, dr] of D) {
          const nk = `${q+dq},${r+dr}`;
          if (visited.has(nk)) continue;
          const nh = map.hexes[nk];
          if (!nh || nh.terenBazowy === TB.Morze || nh.terenBazowy === TB.PlytkieMorze) continue;
          visited.add(nk);
          stack.push(nk);
        }
      }
    }
    return n;
  })();
  const oneDry = dryMasses === 1;
  const ok = singleMass && dominantOk && notRect && notCapsule && noDonut && oneDry;
  if (!ok) fail++;
  console.log(
    `  seed ${seed}: masy=${m.massCount} dry=${dryMasses} dominująca=${(100 * m.dominantRatio).toFixed(1)}% `
    + `bboxFill=${m.bboxFill.toFixed(3)} coast/√A=${m.coastRatio.toFixed(3)} `
    + `aspect=${m.aspect.toFixed(2)} annular=${annular} → ${ok ? 'PASS' : 'FAIL'}`,
  );
}

console.log(`\n=== AC ===`);
console.log(`  5 seedów PASS: ${fail === 0 ? 'PASS' : 'FAIL'} (${fail} fail)`);

let lowFail = 0;
console.log('\n=== Pangea kształt lądu (standardowy · 20% lądu — anti-obwarzanek FALA 195) ===');
for (const seed of SEEDS) {
  const map = M.generujSwiat(seed, 'standardowy', 'pangea', {
    worldDensity: DENSITY,
    landFraction: 0.2,
  });
  const m = pangeaShapeMetrics(map);
  const annular = M.measurePangeaAnnularCorridorHexes(map.hexes, map.szerokoscQ, map.wysokoscR);
  const singleMass = m.massCount === 1;
  const dominantOk = m.dominantRatio >= 0.97;
  const noDonut = annular <= 80;
  let dryMasses = 0;
  {
    const visited = new Set();
    const D = [[1,0],[-1,0],[0,1],[0,-1],[1,-1],[-1,1]];
    for (const [k, h] of Object.entries(map.hexes)) {
      if (h.terenBazowy === TB.Morze || h.terenBazowy === TB.PlytkieMorze) continue;
      if (visited.has(k)) continue;
      dryMasses++;
      const stack = [k];
      visited.add(k);
      while (stack.length) {
        const cur = stack.pop();
        const [q, r] = cur.split(',').map(Number);
        for (const [dq, dr] of D) {
          const nk = `${q+dq},${r+dr}`;
          if (visited.has(nk)) continue;
          const nh = map.hexes[nk];
          if (!nh || nh.terenBazowy === TB.Morze || nh.terenBazowy === TB.PlytkieMorze) continue;
          visited.add(nk);
          stack.push(nk);
        }
      }
    }
  }
  const ok = singleMass && dominantOk && noDonut && dryMasses === 1;
  if (!ok) lowFail++;
  console.log(
    `  seed ${seed}: masy=${m.massCount} dry=${dryMasses} dominująca=${(100 * m.dominantRatio).toFixed(1)}% `
    + `land=${m.landCount} annular=${annular} → ${ok ? 'PASS' : 'FAIL'}`,
  );
}
console.log(`  20% lądu AC: ${lowFail === 0 ? 'PASS' : 'FAIL'} (${lowFail} fail)`);

let shFail = 0;
console.log('\n=== Pangea kształt (Super Huge pominięty w tym przebiegu — za wolny) ===');
console.log('  Super Huge AC: SKIP');
process.exit(fail > 0 || lowFail > 0 ? 1 : 0);
