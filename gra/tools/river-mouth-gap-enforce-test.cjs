'use strict';
/**
 * R-WEB-MAP-RIVER-MOUTH-GAP-FIX-Q1: odstęp między ujściami głównych rzek wzdłuż wybrzeża
 * nie może przekraczać limitu (Standard 7). Dla kontynentów seed 42 i pangei seed 7 test
 * jest CZERWONY na bazie e80d07efb (masy 19 hex: gap 18; pangea 7: gap 15) — to odtworzenie
 * defektu, nie osłabienie asercji. Zielony dopiero po naprawie generatora (ujście wymuszone).
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.river-mouth-gap-enforce-entry.ts');
const BUNDLE = path.resolve(__dirname, '.river-mouth-gap-enforce-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `export { generateMap } from '../src/map/generator';
export {
  worstMainRiverCoastMouthGapOnMass,
  mainRiverCoastMouthMaxGapForDims,
  groupLandMassKeys,
  oceanConnectedWaterKeys,
  RIVER_MOUTH_TAIL_LEN,
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
];

for (const { w, h, seed, typ, landFraction } of cases) {
  const map = M.generateMap(w, h, seed, typ, {
    mapSizeMenuLabel: 'Standardowy',
    landFraction,
    worldDensity: { rivers: 'medium', forest: 'medium', desert: 'medium', relief: 'medium' },
  });
  const maxGap = M.mainRiverCoastMouthMaxGapForDims(w, h);
  const ocean = M.oceanConnectedWaterKeys(map.hexes, w, h);
  const masses = M.groupLandMassKeys(map.hexes).filter((m) => m.length >= 8);
  let worstAll = 0;
  let badMasses = 0;
  for (const mass of masses) {
    const { ok: gapOk, worstGap } = M.worstMainRiverCoastMouthGapOnMass(
      new Set(mass), map.hexes, map.riverPaths, map.riverPathKinds ?? [], w, h, ocean, maxGap,
    );
    if (worstGap > worstAll) worstAll = worstGap;
    if (!gapOk) badMasses++;
  }
  // Grupa A (runda 3, zielona po naprawie): ciało main NIE wędruje po wodzie. Na bazie (kontynenty 42)
  // 3 mainy (polarne) miały ogon wodny 13/17/25 hex (>RIVER_MOUTH_TAIL_LEN) — ich ujście lądowało
  // daleko od wyspy i wyspa (19 hex) miała lukę 18. Mutacja: usuń `if (nd < 1) continue;` w
  // collectInlandDrainGrowCandidates (gen-helpers.ts) -> ta asercja czerwona.
  let longWaterTail = 0;
  (map.riverPathKinds ?? []).forEach((kind, i) => {
    if (kind !== 'main') return;
    const pth = map.riverPaths[i] ?? [];
    let c = 0;
    for (let j = pth.length - 1; j >= 0; j--) {
      const h = map.hexes[`${pth[j].q},${pth[j].r}`];
      if (!h || (h.terenBazowy !== M.TerenBazowy.Morze && h.terenBazowy !== M.TerenBazowy.PlytkieMorze)) break;
      c++;
    }
    if (c > M.RIVER_MOUTH_TAIL_LEN) longWaterTail++;
  });
  ok(longWaterTail === 0, `${typ} seed ${seed}: 0 main-ów z ogonem wodnym > ${M.RIVER_MOUTH_TAIL_LEN} hex (${longWaterTail})`);
  // Grupa B (NADAL CZERWONA — decyzja właściciela, zob. 10-operator-claude.md r3): limit ujść.
  ok(
    badMasses === 0,
    `${typ} seed ${seed}: ujścia main co ≤${maxGap} hex wzdłuż brzegu (złe masy ${badMasses}, worst ${worstAll})`,
  );
}

console.log(`\nriver-mouth-gap-enforce-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
