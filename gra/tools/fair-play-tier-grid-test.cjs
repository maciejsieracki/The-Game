'use strict';
/** Bramka: siatki fair play per tier (rzeki · góry · wzgórza · las) — Maciej A 2026-07-05. */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.fair-play-tier-entry.ts');
const BUNDLE = path.resolve(__dirname, '.fair-play-tier-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `export {
  waterCoverageCellSize,
  ironCoverageCellSize,
  copperCoverageCellSize,
  forestCoverageCellSize,
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

// R-WEB-TEST-DEBT-Q14 (STARY-PIN): siatka gór (iron) zmieniona przez 4de68b3ec (FALA 110: relief medium
// 15x15, suwak Relief Mało=21 · Normalnie=15 · Dużo=12 -- ta sama siatka co wzgórza). Pin 35/25/20 był
// z 2026-07-06 (f2df10f2a). Pozostałe pola (rzeki, wzgórza, las) bez zmian.
const expect = {
  low: { river: 15, iron: 21, copper: 21, forest: 15 },
  medium: { river: 10, iron: 15, copper: 15, forest: 10 },
  high: { river: 5, iron: 12, copper: 12, forest: 5 },
};

for (const tier of ['low', 'medium', 'high']) {
  const e = expect[tier];
  ok(M.waterCoverageCellSize(tier) === e.river, `${tier}: rzeki ${e.river}`);
  ok(M.ironCoverageCellSize(tier) === e.iron, `${tier}: góry ${e.iron}`);
  ok(M.copperCoverageCellSize(tier) === e.copper, `${tier}: wzgórza ${e.copper}`);
  ok(M.forestCoverageCellSize(tier) === e.forest, `${tier}: las ${e.forest}`);
}

console.log(`\nfair-play-tier-grid-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
