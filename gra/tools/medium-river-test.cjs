'use strict';
/** FALA 175: średnie rzeki — 0 orphan, okno skrętu 6hex, junction bez ogona przez main. */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.medium-river-entry.ts');
const BUNDLE = path.resolve(__dirname, '.medium-river-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `export { generateMap } from '../src/map/generator';
export {
  riverPathViolatesTurnWindow,
  buildOceanReachableRiverHexKeys,
  collectPathHexKeysForKinds,
  pathEndsAtSea,
  oceanConnectedWaterKeys,
  pruneInvalidMediumRiverPaths,
  trimMediumRenderPathAtMain,
  hexKey,
} from '../src/map/gen-helpers';`,
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
let pass = 0;
let fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log('PASS:', msg); }
  else { fail++; console.error('FAIL:', msg); }
}

function mediumTouchesNetwork(map, path, mainKeys, reached) {
  for (const p of path) {
    if (mainKeys.has(M.hexKey(p.q, p.r))) return true;
    if (reached.has(M.hexKey(p.q, p.r))) return true;
  }
  const end = path[path.length - 1];
  if (!end) return false;
  for (const [dq, dr] of [[1,0],[-1,0],[1,-1],[-1,1],[0,1],[0,-1]]) {
    const nk = M.hexKey(end.q + dq, end.r + dr);
    if (mainKeys.has(nk) || reached.has(nk)) return true;
  }
  return false;
}

const cases = [
  { w: 80, h: 60, seed: 42, typ: 'pangea', label: 'Pangea mini' },
  { w: 80, h: 60, seed: 7, typ: 'kontynenty', label: 'Kontynenty mini' },
  { w: 120, h: 90, seed: 99, typ: 'standardowy', label: 'Standard mini' },
];

for (const { w, h, seed, typ, label } of cases) {
  const map = M.generateMap(w, h, seed, typ, {
    mapSizeMenuLabel: typ === 'pangea' && w >= 200 ? 'Duży' : 'Standardowy',
    worldDensity: { rivers: 'medium', forest: 'medium', desert: 'medium', relief: 'medium' },
  });
  const kinds = map.riverPathKinds ?? map.riverPaths.map(() => 'main');
  const ocean = M.oceanConnectedWaterKeys(map.hexes, w, h);
  const reached = M.buildOceanReachableRiverHexKeys(
    map.hexes, map.riverPaths, kinds, w, h, ocean,
  );
  const mainKeys = M.collectPathHexKeysForKinds(map.riverPaths, kinds, ['main']);
  const mainPaths = map.riverPaths.filter((_, i) => kinds[i] === 'main');

  let mediumCount = 0;
  let orphan = 0;
  let turnViol = 0;
  let seaOrphan = 0;

  for (let i = 0; i < map.riverPaths.length; i++) {
    if (kinds[i] !== 'medium') continue;
    const path = map.riverPaths[i];
    if (!path?.length) continue;
    mediumCount++;
    if (M.riverPathViolatesTurnWindow(path)) turnViol++;
    const endsSea = M.pathEndsAtSea(map.hexes, path, w, h, ocean);
    const onNet = mediumTouchesNetwork(map, path, mainKeys, reached);
    if (!onNet && !endsSea) orphan++;
    if (endsSea && !onNet) seaOrphan++;
    const trimmed = M.trimMediumRenderPathAtMain(path, mainPaths);
    if (trimmed.length > path.length) {
      fail++;
      console.error(`FAIL: ${label} trim lengthened path`);
    }
  }

  ok(mediumCount >= 0, `${label} seed ${seed}: ${mediumCount} średnich`);
  ok(orphan === 0, `${label} seed ${seed}: 0 medium orphan bez sieci/morza (${orphan})`);
  ok(turnViol === 0, `${label} seed ${seed}: 0 medium łamie okno skrętu (${turnViol})`);
  ok(seaOrphan === 0, `${label} seed ${seed}: 0 medium samotnych do oceanu (${seaOrphan})`);
}

console.log(`\nmedium-river-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
