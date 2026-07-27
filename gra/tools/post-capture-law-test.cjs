'use strict';
/**
 * post-capture-law-test.cjs — bonus Prawa po podboju (B-LAW-Q1)
 * Run: cd gra && node tools/post-capture-law-test.cjs
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.post-capture-law-entry.ts');
const BUNDLE = path.resolve(__dirname, '.post-capture-law-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  applyPostCaptureLawOnCapture,
  applyPostCaptureLawOverride,
  isPostCaptureLawActive,
  isRebellionReconquest,
  markCityRebellionStarted,
  tickPostCaptureLawEndOfTurn,
  POST_CAPTURE_FRESH_TURNS,
  POST_CAPTURE_REBELLION_RECONQUEST_TURNS,
  POST_CAPTURE_LAW_PCT,
  REBEL_FACTION_OWNER_ID,
} from '../src/game/post-capture-law';
export { evaluateOrderFromBreakdown } from '../src/game/society-breakdown';
`, 'utf8');

try {
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
} catch (e) {
  console.error('[post-capture-law-test] bundle failed:', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE);
let passed = 0;
let failed = 0;

function eq(a, b, msg) {
  if (a === b) { passed++; console.log('  [OK] ' + msg); }
  else { failed++; console.error('  [FAIL] ' + msg + ' got ' + JSON.stringify(a) + ' expected ' + JSON.stringify(b)); }
}

console.log('\n[post-capture-law-test]\n');

const freshCity = { id: 'c1', ownerId: 1 };
M.applyPostCaptureLawOnCapture(freshCity, 0, 1);
eq(freshCity.postCaptureLawTurnsRemaining, M.POST_CAPTURE_FRESH_TURNS, 'fresh conquest -> 5 turns');
eq(freshCity.wasRebellionReconquest, false, 'fresh conquest flag false');

const rebelCity = { id: 'c2', ownerId: M.REBEL_FACTION_OWNER_ID, rebelPreviousOwnerId: 0, rebelState: true };
eq(M.isRebellionReconquest(M.REBEL_FACTION_OWNER_ID, 0, rebelCity), true, 'detect rebellion reconquest');
M.applyPostCaptureLawOnCapture(rebelCity, 0, M.REBEL_FACTION_OWNER_ID);
eq(rebelCity.postCaptureLawTurnsRemaining, M.POST_CAPTURE_REBELLION_RECONQUEST_TURNS, 'reconquest -> 10 turns');
eq(rebelCity.wasRebellionReconquest, true, 'reconquest flag true');
eq(rebelCity.rebelPreviousOwnerId, undefined, 'clears rebelPreviousOwnerId');

const markCity = { ownerId: 0 };
M.markCityRebellionStarted(markCity);
eq(markCity.rebelPreviousOwnerId, 0, 'mark rebellion stores owner');

const tickCity = { postCaptureLawTurnsRemaining: 2, wasRebellionReconquest: false };
M.tickPostCaptureLawEndOfTurn(tickCity);
eq(tickCity.postCaptureLawTurnsRemaining, 1, 'tick decrements');
M.tickPostCaptureLawEndOfTurn(tickCity);
eq(tickCity.postCaptureLawTurnsRemaining, undefined, 'tick clears at 0');

const ord = M.evaluateOrderFromBreakdown(
  { population: 10, buildingZadowolenie: 0, era: 1 },
  { garnizonCount: 0, era: 1 },
  null,
  'normal',
);
const bonusCity = { postCaptureLawTurnsRemaining: 3 };
const over = M.applyPostCaptureLawOverride(ord, bonusCity, null, 'normal');
eq(over.prawo.prawPct, M.POST_CAPTURE_LAW_PCT, 'override forces 100% prawo');
eq(over.effects.revoltRisk, 0, 'override zero revolt risk');

console.log('\npost-capture-law-test: ' + passed + ' pass, ' + failed + ' fail');
process.exit(failed > 0 ? 1 : 0);
