'use strict';
/**
 * victory-screen-test.cjs — test formatowania ekranu zwycięstwa (bez DOM).
 * Run from gra/: node tools/victory-screen-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch (e) {
    console.error('[victory-screen-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const ENTRY_FILE = path.resolve(__dirname, '.victory-screen-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.victory-screen-bundle.cjs');

const ENTRY_TS = `
export {
  formatVictoryTitle,
  formatVictorySubtitle,
  formatVictoryConditionLabel,
  buildVictoryScreenData,
} from '../src/ui/victoryScreen';
`;

fs.writeFileSync(ENTRY_FILE, ENTRY_TS, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE_FILE,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[victory-screen-test] esbuild failed:', e.message || e);
  process.exit(1);
}

const V = require(BUNDLE_FILE);
const {
  formatVictoryTitle,
  formatVictorySubtitle,
  formatVictoryConditionLabel,
  buildVictoryScreenData,
} = V;

let passed = 0;
let failed = 0;
function eq(a, b, msg) {
  if (a === b) { passed++; }
  else { failed++; console.error('  FAIL:', msg, `(got "${a}", want "${b}")`); }
}
function includes(hay, needle, msg) {
  if (typeof hay === 'string' && hay.includes(needle)) { passed++; }
  else { failed++; console.error('  FAIL:', msg, `(missing "${needle}" in "${hay}")`); }
}

eq(formatVictoryTitle('dominacja', 42), 'ZWYCIĘSTWO — dominacja (tura 42)', 'title dominacja');
eq(formatVictoryTitle('nauka', 10), 'ZWYCIĘSTWO NAUKOWE (tura 10)', 'title nauka');
eq(formatVictoryTitle('przegrana', 5), 'PRZEGRANA (tura 5)', 'title przegrana');

includes(
  formatVictorySubtitle('dominacja', { turn: 1, powerShare: 0.62 }),
  '62%',
  'subtitle dominacja power',
);
includes(
  formatVictorySubtitle('nauka', { turn: 1 }),
  'Rakieta',
  'subtitle nauka rocket',
);
includes(
  formatVictorySubtitle('przegrana', { turn: 1 }),
  'miasta',
  'subtitle przegrana cities',
);

eq(formatVictoryConditionLabel('dominacja'), 'Warunek: dominacja (Power)', 'label dominacja');
eq(formatVictoryConditionLabel('nauka'), 'Warunek: zwycięstwo naukowe', 'label nauka');

{
  const data = buildVictoryScreenData(
    { winner: 0, rodzaj: 'nauka' },
    { turn: 99, civLabel: 'Rzymianie' },
  );
  eq(data.rodzaj, 'nauka', 'buildVictoryScreenData rodzaj');
  eq(data.stats.turn, 99, 'buildVictoryScreenData turn');
  eq(data.stats.civLabel, 'Rzymianie', 'buildVictoryScreenData civ');
}

console.log(`\n[victory-screen-test] ${passed} passed, ${failed} failed (total ${passed + failed}).`);
process.exit(failed > 0 ? 1 : 0);
