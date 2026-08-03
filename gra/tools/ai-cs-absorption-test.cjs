'use strict';
/**
 * ai-cs-absorption-test.cjs — R-AI-MP-WASAL-WCHLONIECIE
 * Run from gra/:  node tools/ai-cs-absorption-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[ai-cs-absorption-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA_ROOT = path.resolve(__dirname, '..');
const AI_SRC = process.env.AI_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const ENTRY_FILE = path.resolve(__dirname, '.ai-cs-absorption-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.ai-cs-absorption-bundle.cjs');

const ENTRY_TS = `
export {
  aiCsAbsorptionParams,
  isSisterAllianceThreatOwner,
  unitTriggersSisterAllianceThreat,
  decideAiCsClusterAction,
  rollAiCsAccept,
} from ${JSON.stringify(AI_SRC + '/game/ai-cs-absorption')};
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
    absWorkingDir: GRA_ROOT,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[ai-cs-absorption-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const {
  aiCsAbsorptionParams,
  isSisterAllianceThreatOwner,
  unitTriggersSisterAllianceThreat,
  decideAiCsClusterAction,
  rollAiCsAccept,
} = require(BUNDLE_FILE);

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error('  FAIL:', msg); }
}
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

console.log('--- T1: aiCsAbsorptionParams per difficulty ---');
const easy = aiCsAbsorptionParams('easy');
const normal = aiCsAbsorptionParams('normal');
const hard = aiCsAbsorptionParams('hard');
assert(easy.minTurn !== normal.minTurn, 'T1a: easy vs normal minTurn differ');
assert(hard.minTurn < normal.minTurn, 'T1b: hard minTurn lower than normal');
assert(hard.instantAnnexIfRatio === 1.25, 'T1c: hard instant ratio');
eq(easy.instantAnnexIfRatio, null, 'T1d: easy no instant annex');
assert(hard.clusterWarMinTurn < easy.clusterWarMinTurn, 'T1e: hard war min earlier');

console.log('\n--- T2: isSisterAllianceThreatOwner ---');
assert(isSisterAllianceThreatOwner(0), 'T2a: player is threat');
assert(!isSisterAllianceThreatOwner(5), 'T2b: AI not threat');

console.log('\n--- T3: unitTriggersSisterAllianceThreat ---');
const sisters = new Set([2, 3]);
assert(unitTriggersSisterAllianceThreat(0, sisters), 'T3a: player triggers');
assert(!unitTriggersSisterAllianceThreat(2, sisters), 'T3b: sister does not');
assert(!unitTriggersSisterAllianceThreat(7, sisters), 'T3c: other AI does not');

console.log('\n--- T4: decide hard instant_annex ---');
const instant = decideAiCsClusterAction({
  difficulty: 'hard',
  turn: 10,
  militaryRatio: 1.3,
  hasWasalDeal: false,
  hasTrybutDeal: false,
  failCount: 0,
  alreadyAtWar: false,
  napBlocked: false,
});
eq(instant.action, 'instant_annex', 'T4a: hard ratio≥1.25 turn≥10');

console.log('\n--- T5: decide easy too early ---');
const early = decideAiCsClusterAction({
  difficulty: 'easy',
  turn: 20,
  militaryRatio: 2.0,
  hasWasalDeal: false,
  hasTrybutDeal: false,
  failCount: 0,
  alreadyAtWar: false,
  napBlocked: false,
});
eq(early.action, null, 'T5a: easy turn 20 < min 28');

console.log('\n--- T6: decide annex after wasal timer ---');
const annex = decideAiCsClusterAction({
  difficulty: 'normal',
  turn: 30,
  militaryRatio: 1.5,
  hasWasalDeal: true,
  wasalSinceTurn: 18,
  hasTrybutDeal: false,
  failCount: 0,
  alreadyAtWar: false,
  napBlocked: false,
});
eq(annex.action, 'annex', 'T6a: wasal + 12 turns → annex');

console.log('\n--- T7: decide war after fails ---');
const war = decideAiCsClusterAction({
  difficulty: 'normal',
  turn: 35,
  militaryRatio: 1.5,
  hasWasalDeal: false,
  hasTrybutDeal: true,
  trybutSinceTurn: 32,
  failCount: 2,
  alreadyAtWar: false,
  napBlocked: false,
});
eq(war.action, 'war', 'T7a: failCount≥2 + turn≥30');

console.log('\n--- T8: rollAiCsAccept ---');
assert(rollAiCsAccept('trybut', easy, () => 0.0), 'T8a: rng 0 → accept');
assert(!rollAiCsAccept('trybut', easy, () => 0.99), 'T8b: rng 0.99 reject easy trybut 0.70');

console.log(`\n=== ai-cs-absorption-test: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
