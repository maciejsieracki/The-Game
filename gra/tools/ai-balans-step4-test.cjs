'use strict';
/**
 * ai-balans-step4-test.cjs — AI-BALANS-STEP4 / R-AI-TRUDNOSC C.3 Ś1
 * L3 cuda prog_koszt_x 70→80: major AI akceptuje droższe cuda na Trudnym.
 * Run from gra/: node tools/ai-balans-step4-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[ai-balans-step4-test] esbuild not found');
    process.exit(1);
  }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY_FILE = path.resolve(__dirname, '.ai-balans-step4-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.ai-balans-step4-bundle.cjs');

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
  console.error('[ai-balans-step4-test] bundle failed:', e.message || e);
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

console.log('\n--- T1: loadAiWonderParams — prog_koszt_x + throttle per poziom ---');
{
  const l1 = loadAiWonderParams(data, 1);
  const l2 = loadAiWonderParams(data, 2);
  const l3 = loadAiWonderParams(data, 3);
  eq(l1.progKosztX, 25, 'T1a: L1 prog_koszt_x = 25');
  eq(l2.progKosztX, 45, 'T1b: L2 prog_koszt_x = 45');
  eq(l3.progKosztX, 80, 'T1c: L3 prog_koszt_x = 80 (było 70)');
  eq(l1.throttleTur, 8, 'T1d: L1 throttle = 8');
  eq(l2.throttleTur, 5, 'T1e: L2 throttle = 5');
  eq(l3.throttleTur, 2, 'T1f: L3 throttle = 2 (STEP3, bez zmian)');
}

console.log('\n--- T2: decideAiWonderBuild — prog 80 vs stary 70 (koszt 750, praca 10) ---');
{
  const cityCandidates = [{ cityId: 'c1', queueEmpty: true, pracaPerTurn: 10 }];
  const buildableWonders = [{ id: 'w1', kosztBudowy: 750, dostep: 'E' }];
  const turn = 4;
  const ownerId = 0;

  const pickNew = decideAiWonderBuild(
    turn, ownerId, false, cityCandidates, buildableWonders,
    { progKosztX: 80, throttleTur: 2 },
  );
  const pickOld = decideAiWonderBuild(
    turn, ownerId, false, cityCandidates, buildableWonders,
    { progKosztX: 70, throttleTur: 2 },
  );

  eq(pickNew?.cityId, 'c1', 'T2a: prog 80 → 750 <= 800 akceptuje cud');
  eq(pickNew?.wonderId, 'w1', 'T2a: prog 80 → wonderId');
  eq(pickOld, null, 'T2b: prog 70 (stary) → 750 > 700 odrzuca');
}

console.log('\n--- T3: decideAiWonderBuild — throttle L3=2 bez zmian (tura 3 blokada) ---');
{
  const cityCandidates = [{ cityId: 'c1', queueEmpty: true, pracaPerTurn: 10 }];
  const buildableWonders = [{ id: 'w1', kosztBudowy: 100, dostep: 'E' }];
  const pick = decideAiWonderBuild(
    3, 0, false, cityCandidates, buildableWonders,
    { progKosztX: 80, throttleTur: 2 },
  );
  eq(pick, null, 'T3a: tura 3 + throttle 2 → null (modulo)');
}

console.log(`\n=== ai-balans-step4-test: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
