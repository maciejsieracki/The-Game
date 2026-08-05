'use strict';
/**
 * ai-balans-step3-test.cjs — AI-BALANS-STEP3 / R-AI-TRUDNOSC C.3 Ś1
 * L3 cuda throttle 3→2: major AI częściej rozważa cuda na Trudnym.
 * Run from gra/: node tools/ai-balans-step3-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[ai-balans-step3-test] esbuild not found');
    process.exit(1);
  }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY_FILE = path.resolve(__dirname, '.ai-balans-step3-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.ai-balans-step3-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export { loadAiWonderParams, decideAiWonderBuild } from '../src/game/ai';
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    loader: { '.ts': 'ts', '.json': 'json' },
    outfile: BUNDLE_FILE,
    absWorkingDir: GRA,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[ai-balans-step3-test] bundle failed:', e.message || e);
  process.exit(1);
}

const { loadAiWonderParams, decideAiWonderBuild } = require(BUNDLE_FILE);

const aiParamsJson = JSON.parse(
  fs.readFileSync(path.resolve(GRA, 'data', 'ai-params.json'), 'utf8'),
);

function makeData() {
  return { aiParams: aiParamsJson };
}

let passed = 0;
let failed = 0;
function assert(cond, msg) { if (cond) passed++; else { failed++; console.error('FAIL:', msg); } }
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

const data = makeData();
const cityCandidates = [{ cityId: 'c1', queueEmpty: true, pracaPerTurn: 10 }];
const buildableWonders = [{ id: 'w1', kosztBudowy: 100, dostep: 'E' }];

console.log('\n--- T1: loadAiWonderParams — throttle per poziom ---');
{
  const l1 = loadAiWonderParams(data, 1);
  const l2 = loadAiWonderParams(data, 2);
  const l3 = loadAiWonderParams(data, 3);
  eq(l1.throttleTur, 8, 'T1a: L1 throttle = 8');
  eq(l2.throttleTur, 5, 'T1b: L2 throttle = 5');
  eq(l3.throttleTur, 2, 'T1c: L3 throttle = 2 (było 3)');
  eq(l3.progKosztX, 70, 'T1d: L3 prog_koszt_x bez zmian = 70');
}

console.log('\n--- T2: decideAiWonderBuild — throttle 2 vs stary 3 (edge tura 4) ---');
{
  const ownerId = 0;
  const turn = 4; // (4+0)%2=0 OK; (4+0)%3=1 blokada przy starym throttle
  const diffNew = { progKosztX: 70, throttleTur: 2 };
  const diffOld = { progKosztX: 70, throttleTur: 3 };

  const pickNew = decideAiWonderBuild(
    turn, ownerId, false, cityCandidates, buildableWonders, diffNew,
  );
  const pickOld = decideAiWonderBuild(
    turn, ownerId, false, cityCandidates, buildableWonders, diffOld,
  );

  eq(pickNew?.cityId, 'c1', 'T2a: throttle 2 → tura 4 woła cud (cityId)');
  eq(pickNew?.wonderId, 'w1', 'T2a: throttle 2 → tura 4 woła cud (wonderId)');
  eq(pickOld, null, 'T2b: throttle 3 (stary) → tura 4 pomija (różnica zachowania)');
}

console.log('\n--- T3: decideAiWonderBuild — throttle 2 blokuje nieparzystą turę ---');
{
  const pick = decideAiWonderBuild(
    3, 0, false, cityCandidates, buildableWonders, { progKosztX: 70, throttleTur: 2 },
  );
  eq(pick, null, 'T3a: tura 3 + throttle 2 → null (modulo)');
}

console.log(`\n=== ai-balans-step3-test: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
