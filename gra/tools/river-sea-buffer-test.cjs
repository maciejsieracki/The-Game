'use strict';
/** Rzeki: bufor 2 hex od morza (ciało) + brak krawędzi rzeki na czystym oceanie. */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.river-sea-buffer-entry.ts');
const BUNDLE = path.resolve(__dirname, '.river-sea-buffer-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `export { generateMap } from '../src/map/generator';
export {
  riverPathRespectsSeaBuffer,
  buildSeaDistanceField,
  RIVER_MIN_INLAND_FROM_SEA,
  worstMainRiverCoastMouthGapOnMass,
  mainRiverCoastMouthMaxGapForDims,
  groupLandMassKeys,
  oceanConnectedWaterKeys,
} from '../src/map/gen-helpers';
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
  logLevel: 'silent',
  resolveExtensions: ['.ts', '.js', '.json'],
});

const M = require(BUNDLE);
const { TerenBazowy } = M;

let pass = 0;
let fail = 0;
function ok(cond, msg) {
  if (cond) {
    pass++;
    console.log('PASS:', msg);
  } else {
    fail++;
    console.error('FAIL:', msg);
  }
}

const cases = [
  { w: 168, h: 120, seed: 42, typ: 'kontynenty', landFraction: 0.3 },
  { w: 168, h: 120, seed: 7, typ: 'pangea', landFraction: 0.35 },
  { w: 168, h: 120, seed: 99, typ: 'ziemia' },
];

for (const { w, h, seed, typ, landFraction } of cases) {
  const map = M.generateMap(w, h, seed, typ, {
    mapSizeMenuLabel: 'Standardowy',
    landFraction,
    worldDensity: { rivers: 'medium', forest: 'medium', desert: 'medium', relief: 'medium' },
  });
  const seaDist = M.buildSeaDistanceField(map.hexes);
  let oceanRiver = 0;
  for (const hex of Object.values(map.hexes)) {
    if (hex.terenBazowy === TerenBazowy.Morze && hex.rzeka?.obecna) oceanRiver++;
  }
  ok(oceanRiver === 0, `${typ} seed ${seed}: 0 krawędzi rzeki na czystym morzu (${oceanRiver})`);

  let badMain = 0;
  for (let i = 0; i < map.riverPaths.length; i++) {
    if (map.riverPathKinds?.[i] !== 'main') continue;
    const path = map.riverPaths[i];
    if (!path?.length) continue;
    if (!M.riverPathRespectsSeaBuffer(map.hexes, path, seaDist, M.RIVER_MIN_INLAND_FROM_SEA)) badMain++;
  }
  ok(badMain === 0, `${typ} seed ${seed}: główne nurty respektują bufor ${M.RIVER_MIN_INLAND_FROM_SEA} hex (${badMain} złych)`);

  const maxGap = M.mainRiverCoastMouthMaxGapForDims(w, h);
  const ocean = M.oceanConnectedWaterKeys(map.hexes, w, h);
  const masses = M.groupLandMassKeys(map.hexes).filter((m) => m.length >= 8);
  const coastTol = typ === 'ziemia' ? maxGap + 35 : maxGap;
  let worstCoastGap = 0;
  let badCoastGaps = 0;
  for (const mass of masses) {
    const massSet = new Set(mass);
    const { ok: gapOk, worstGap } = M.worstMainRiverCoastMouthGapOnMass(
      massSet, map.hexes, map.riverPaths, map.riverPathKinds ?? [], w, h, ocean, coastTol,
    );
    if (worstGap > worstCoastGap) worstCoastGap = worstGap;
    if (!gapOk) badCoastGaps++;
  }
  ok(
    badCoastGaps === 0,
    `${typ} seed ${seed}: ujścia main co ≤${coastTol} hex wzdłuż brzegu (złe masy ${badCoastGaps}, worst ${worstCoastGap})`,
  );
}

console.log(`\nriver-sea-buffer-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
