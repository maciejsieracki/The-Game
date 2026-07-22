'use strict';
/**
 * victory-test.cjs — standalone Node test for src/game/victory.ts.
 * Run from gra/: node tools/victory-test.cjs
 */

const fs   = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch (e) {
    console.error('[victory-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const ENTRY_FILE  = path.resolve(__dirname, '.victory-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.victory-bundle.cjs');

const ENTRY_TS = `
export {
  checkVictory, isDominacjaVictory, isNaukaVictory, powerShare,
  allTechInScopeResearched, OSTATNIA_EPOKA_GRY_V1, PROG_DOMINACJI_POWER,
  isEliminated,
} from '../src/game/victory';
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
  console.error('[victory-test] esbuild failed:', e.message || e);
  process.exit(1);
}

const V = require(BUNDLE_FILE);
const {
  checkVictory, isDominacjaVictory, isNaukaVictory, powerShare,
  allTechInScopeResearched, OSTATNIA_EPOKA_GRY_V1,
} = V;

let passed = 0;
let failed = 0;
function eq(a, b, msg) {
  if (a === b) { passed++; }
  else { failed++; console.error('  FAIL:', msg, `(got ${a}, want ${b})`); }
}

const city = (ownerId, name = 'X') => ({ ownerId, name, q: 0, r: 0, population: 1 });

// powerShare
eq(powerShare(60, [60, 40]), 0.6, 'powerShare 60/100');
eq(powerShare(51, [51, 49]), 0.51, 'powerShare >50%');

// dominacja
eq(isDominacjaVictory(60, [60, 40], 3, 3), true, 'dominacja era3 power>50%');
eq(isDominacjaVictory(60, [60, 40], 2, 3), false, 'dominacja blocked before last era');
eq(isDominacjaVictory(40, [40, 60], 3, 3), false, 'dominacja power<=50%');

// nauka
eq(isNaukaVictory(true, true), true, 'nauka both flags');
eq(isNaukaVictory(true, false), false, 'nauka no rocket');
eq(allTechInScopeResearched(new Set(['A', 'B']), ['A', 'B']), true, 'allTech scope');

// checkVictory integration
{
  const r = checkVictory({
    players: [{ id: 0, typCywilizacji: 'grecy', ai: false }],
    cities: [city(0)],
    gracz: 0,
    potegaGracza: 55,
    potegiWszystkich: [55, 45],
    graczEra: 3,
    ostatniaEpoka: OSTATNIA_EPOKA_GRY_V1,
  });
  eq(r?.rodzaj, 'dominacja', 'checkVictory dominacja');
}

{
  const r = checkVictory({
    players: [{ id: 0, typCywilizacji: 'grecy', ai: false }],
    cities: [],
    gracz: 0,
    liczbaOsadnikow: 0,
    graczKiedysMialMiasto: true,
  });
  eq(r?.rodzaj, 'przegrana', 'checkVictory defeat');
}

{
  const r = checkVictory({
    players: [{ id: 0, typCywilizacji: 'grecy', ai: false }],
    cities: [city(0)],
    gracz: 0,
    wszystkieTechZbadane: true,
    rakietaWystrzelona: true,
  });
  eq(r?.rodzaj, 'nauka', 'checkVictory science');
}

{
  const r = checkVictory({
    players: [{ id: 0, typCywilizacji: 'grecy', ai: false }],
    cities: [city(0)],
    gracz: 0,
    potegaGracza: 55,
    potegiWszystkich: [55, 45],
    graczEra: 2,
  });
  eq(r, null, 'checkVictory continues before last era');
}

console.log(`\n[victory-test] ${passed} passed, ${failed} failed (total ${passed + failed}).`);
process.exit(failed > 0 ? 1 : 0);
