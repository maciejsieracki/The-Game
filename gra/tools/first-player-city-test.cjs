'use strict';
/**
 * first-player-city-test.cjs — R-PIERWSZE-MIASTO (decyzja B, tylko gracz)
 * Run: node gra/tools/first-player-city-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.first-player-city-entry.ts');
const BUNDLE = path.resolve(__dirname, '.first-player-city-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  isAwaitingFirstPlayerCity,
  isHexInStartReveal,
  validateFirstPlayerCityPlacement,
  FIRST_CITY_START_REVEAL_DENIED,
} from '../src/game/first-player-city';
export { hexDistance } from '../src/units/setup';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  outfile: BUNDLE,
  absWorkingDir: GRA_ROOT,
  logLevel: 'silent',
  loader: { '.ts': 'ts', '.json': 'json' },
});

const M = require(BUNDLE);

let passed = 0;
let failed = 0;

function ok(cond, label) {
  if (cond) passed++;
  else {
    failed++;
    console.error('FAIL:', label);
  }
}
function eq(a, b, label) {
  ok(a === b, `${label} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`);
}

console.log('--- T1: isAwaitingFirstPlayerCity ---');
eq(M.isAwaitingFirstPlayerCity(false, []), true, 'T1a: 0 miast, nigdy nie miał');
eq(M.isAwaitingFirstPlayerCity(false, [{ ownerId: 1 }]), true, 'T1b: tylko AI ma miasto');
eq(M.isAwaitingFirstPlayerCity(false, [{ ownerId: 0 }]), false, 'T1c: gracz ma miasto');
eq(M.isAwaitingFirstPlayerCity(true, []), false, 'T1d: playerEverOwnedCity=true bez miast');
eq(M.isAwaitingFirstPlayerCity(false, [{ ownerId: 0 }, { ownerId: 1 }]), false, 'T1e: gracz + AI');

console.log('\n--- T2: isHexInStartReveal ---');
const start = { q: 10, r: 10 };
const dist = M.hexDistance;
eq(
  M.isHexInStartReveal(10, 10, true, start, 3, dist),
  true,
  'T2a: hex startu w kręgu',
);
eq(
  M.isHexInStartReveal(13, 10, true, start, 3, dist),
  true,
  'T2b: dystans 3 w promieniu 3',
);
eq(
  M.isHexInStartReveal(14, 10, true, start, 3, dist),
  false,
  'T2c: dystans 4 poza promieniem 3',
);
eq(
  M.isHexInStartReveal(99, 99, false, start, 3, dist),
  true,
  'T2d: po pierwszym mieście — brak ograniczenia',
);
eq(
  M.isHexInStartReveal(99, 99, true, null, 3, dist),
  true,
  'T2e: brak startHex — brak ograniczenia',
);

console.log('\n--- T3: validateFirstPlayerCityPlacement ---');
{
  const inCircle = M.validateFirstPlayerCityPlacement(10, 10, true, true, true);
  ok(inCircle.ok, 'T3a: base ok + w kręgu');
}
{
  const out = M.validateFirstPlayerCityPlacement(20, 20, true, false, true);
  eq(out.ok, false, 'T3b: poza kręgiem');
  eq(out.reason, M.FIRST_CITY_START_REVEAL_DENIED, 'T3c: komunikat poza kręgiem');
}
{
  const baseFail = M.validateFirstPlayerCityPlacement(10, 10, true, true, false, 'morze');
  eq(baseFail.ok, false, 'T3d: base fail');
  eq(baseFail.reason, 'morze', 'T3e: reason z base');
}
{
  const afterCity = M.validateFirstPlayerCityPlacement(20, 20, false, false, true);
  ok(afterCity.ok, 'T3f: po pierwszym mieście — brak kręgu');
}

console.log(`\nfirst-player-city-test: ${passed} pass, ${failed} fail`);
process.exit(failed > 0 ? 1 : 0);
