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
  tickRebelProtectionEndOfTurn,
  POST_CAPTURE_FRESH_TURNS,
  POST_CAPTURE_REBELLION_RECONQUEST_TURNS,
  POST_CAPTURE_LAW_PCT,
  REBEL_PROTECTION_TURNS,
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
eq(markCity.rebelProtectionTurnsRemaining, M.REBEL_PROTECTION_TURNS, 'mark rebellion starts 20-turn protection window (R-MIASTA-REBELIA-OCHRONA-20-TUR-Q1)');
eq(M.REBEL_PROTECTION_TURNS, 20, 'REBEL_PROTECTION_TURNS constant is 20');

// R-MIASTA-REBELIA-OCHRONA-20-TUR-Q1: markCityRebellionStarted works identically for an
// AI-owned city (ownerId>0) -- the counter/protection logic itself is symmetric player/AI,
// even though today's ONLY natural trigger site (main.ts ~27775) is gated to ownerId===0
// (see GOAL 7 / dispatch RECON) -- that trigger-site gate is a pre-existing fact of the
// rebellion mechanism, not a limitation of this new logic.
const markCityAi = { ownerId: 3 };
M.markCityRebellionStarted(markCityAi);
eq(markCityAi.rebelPreviousOwnerId, 3, 'mark rebellion (AI owner) stores owner');
eq(markCityAi.rebelProtectionTurnsRemaining, 20, 'mark rebellion (AI owner) starts 20-turn protection window');

const tickCity = { postCaptureLawTurnsRemaining: 2, wasRebellionReconquest: false };
M.tickPostCaptureLawEndOfTurn(tickCity);
eq(tickCity.postCaptureLawTurnsRemaining, 1, 'tick decrements');
M.tickPostCaptureLawEndOfTurn(tickCity);
eq(tickCity.postCaptureLawTurnsRemaining, undefined, 'tick clears at 0');

// R-MIASTA-REBELIA-OCHRONA-20-TUR-Q1: tickRebelProtectionEndOfTurn is a SEPARATE counter
// from postCaptureLawTurnsRemaining -- run it 19 times (20 -> 1, still active) then once
// more (1 -> 0, field deleted = protection over). Also prove it is unconditional: it must
// run identically regardless of postCaptureLawTurnsRemaining being present/active or not
// (GOAL 2: "bezwarunkowo, nie tylko gdy postCaptureLawActive").
const protCity = { rebelState: true, rebelProtectionTurnsRemaining: 20 };
for (let i = 0; i < 19; i++) M.tickRebelProtectionEndOfTurn(protCity);
eq(protCity.rebelProtectionTurnsRemaining, 1, 'rebel protection: 19 ticks from 20 -> 1 (still active, in window)');
M.tickRebelProtectionEndOfTurn(protCity);
eq(protCity.rebelProtectionTurnsRemaining, undefined, 'rebel protection: 20th tick clears the field (window over, fair game)');
M.tickRebelProtectionEndOfTurn(protCity);
eq(protCity.rebelProtectionTurnsRemaining, undefined, 'rebel protection: ticking an already-cleared city is a no-op (no negative/undefined crash)');

const noCounterCity = { rebelState: true };
M.tickRebelProtectionEndOfTurn(noCounterCity);
eq(noCounterCity.rebelProtectionTurnsRemaining, undefined, 'rebel protection: ticking a city with no counter set is a safe no-op');

// R-MIASTA-REBELIA-OCHRONA-20-TUR-Q1 (GOAL 4/regression 7): applyPostCaptureLawOnCapture
// clears BOTH rebelPreviousOwnerId AND the new rebelProtectionTurnsRemaining together,
// on every capture (fresh conquest AND reconquest) -- and the pre-existing
// postCaptureLawTurnsRemaining/wasRebellionReconquest bonus values are UNCHANGED by the
// new field's presence (zero regression on B-LAW-Q1's own counter/conditions).
const reconquestCity = {
  id: 'c3', ownerId: M.REBEL_FACTION_OWNER_ID, rebelPreviousOwnerId: 0, rebelState: true,
  rebelProtectionTurnsRemaining: 14,
};
M.applyPostCaptureLawOnCapture(reconquestCity, 0, M.REBEL_FACTION_OWNER_ID);
eq(reconquestCity.rebelProtectionTurnsRemaining, undefined, 'reconquest within protection window clears rebelProtectionTurnsRemaining too');
eq(reconquestCity.postCaptureLawTurnsRemaining, M.POST_CAPTURE_REBELLION_RECONQUEST_TURNS, 'regression: reconquest still grants 10-turn Prawo bonus (B-LAW-Q1 untouched)');
eq(reconquestCity.wasRebellionReconquest, true, 'regression: reconquest flag still set true (B-LAW-Q1 untouched)');

const thirdPartyCaptureCity = {
  id: 'c4', ownerId: M.REBEL_FACTION_OWNER_ID, rebelPreviousOwnerId: 0, rebelState: true,
  rebelProtectionTurnsRemaining: 14,
};
M.applyPostCaptureLawOnCapture(thirdPartyCaptureCity, 2, M.REBEL_FACTION_OWNER_ID);
eq(thirdPartyCaptureCity.rebelProtectionTurnsRemaining, undefined, 'third-party capture within window also clears rebelProtectionTurnsRemaining (fresh conquest, not reconquest)');
eq(thirdPartyCaptureCity.postCaptureLawTurnsRemaining, M.POST_CAPTURE_FRESH_TURNS, 'regression: fresh conquest still grants 5-turn Prawo bonus (B-LAW-Q1 untouched)');
eq(thirdPartyCaptureCity.wasRebellionReconquest, false, 'regression: fresh conquest flag still false (B-LAW-Q1 untouched)');

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
