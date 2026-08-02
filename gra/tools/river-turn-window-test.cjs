'use strict';
/** FALA 173: okno 6 hex |Σ signed dirDelta|≤1 + brak U-turn 180° (dot<0). */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.river-turn-window-entry.ts');
const BUNDLE = path.resolve(__dirname, '.river-turn-window-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `export { generateMap } from '../src/map/generator';
export {
  riverPathViolatesTurnWindow,
  riverPathHasSharpUTurn,
  riverGrowStepPassesSep,
  nearestRiverHexDistance,
  MAIN_RIVER_MIN_PATH_SEP,
  RIVER_TURN_WINDOW_HEX,
  RIVER_TURN_WINDOW_MAX_SUM,
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

ok(M.RIVER_TURN_WINDOW_HEX === 6, 'window hex = 6');
ok(M.RIVER_TURN_WINDOW_MAX_SUM === 1, 'max sum = 1');

// Spirala +60° co krok — łamie okno
const spiral = [
  { q: 0, r: 0 }, { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 2, r: -1 },
  { q: 2, r: -2 }, { q: 3, r: -2 }, { q: 3, r: -3 },
];
ok(M.riverPathViolatesTurnWindow(spiral), 'spirala +60° łamie okno');

// U-turn 180°
const uturn = [{ q: 0, r: 0 }, { q: 1, r: 0 }, { q: 0, r: 0 }];
ok(M.riverPathHasSharpUTurn(uturn), 'wykrywa U-turn 180°');

// FALA 173 soft sep: sep=3 OK, sep=2 odrzuć
const sepKeys = new Set(['10,0', '12,0']);
ok(M.riverGrowStepPassesSep(7, 0, sepKeys, M.MAIN_RIVER_MIN_PATH_SEP), 'soft sep: krok przy dist=3 OK');
ok(!M.riverGrowStepPassesSep(8, 0, sepKeys, M.MAIN_RIVER_MIN_PATH_SEP), 'soft sep: krok przy dist=2 FAIL');

const cases = [
  { w: 80, h: 60, seed: 42, typ: 'pangea', label: 'Pangea mini' },
  { w: 80, h: 60, seed: 7, typ: 'kontynenty', label: 'Kontynenty mini' },
];

for (const { w, h, seed, typ, label } of cases) {
  const map = M.generateMap(w, h, seed, typ, {
    mapSizeMenuLabel: typ === 'pangea' && w >= 200 ? 'Duży' : 'Standardowy',
    worldDensity: { rivers: 'medium', forest: 'medium', desert: 'medium', relief: 'medium' },
  });
  let windowViol = 0;
  let uturns = 0;
  for (const path of map.riverPaths) {
    if (!path?.length) continue;
    if (M.riverPathViolatesTurnWindow(path)) windowViol++;
    if (M.riverPathHasSharpUTurn(path)) uturns++;
  }
  ok(windowViol === 0, `${label} seed ${seed}: 0 tras łamie okno skrętu (${windowViol})`);
  ok(uturns === 0, `${label} seed ${seed}: 0 tras z U-turn 180° (${uturns})`);
}

console.log(`\nriver-turn-window-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
