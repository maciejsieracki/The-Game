'use strict';
/**
 * R-AI-PRACA-BUDYNKI-ULEPSZENIA-Q1 — owner policy gate.
 *
 * Exercises the real owner-aware policy and budget-cap helpers, then checks
 * that main.ts calls that production path. The main module is a browser
 * bootstrap, so its private closures are checked through exact call-site
 * wiring rather than by starting the full UI.
 *
 * Run from gra/: node tools/ai-praca-budynki-ulepszenia-owner-policy-test.cjs
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = path.resolve(GRA_ROOT, 'src');
const entryFile = path.join(os.tmpdir(), `ai-policy-entry-${process.pid}.ts`);
const bundleFile = path.join(os.tmpdir(), `ai-policy-bundle-${process.pid}.cjs`);

let passed = 0;
let failed = 0;
function assert(name, condition, detail = '') {
  if (condition) {
    passed++;
    console.log(`PASS: ${name}`);
  } else {
    failed++;
    console.log(`FAIL: ${name}${detail ? ` -- ${detail}` : ''}`);
  }
}

const esbuild = (() => {
  try { return require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild')); }
  catch (error) {
    console.error('[ai-policy-test] esbuild not found:', error.message || error);
    process.exit(1);
  }
})();

fs.writeFileSync(entryFile, `
export {
  AI_FIXED_PROCENT_BUDYNKI,
  AI_MAJOR_ULEPSZENIA_PRACA_PERCENT,
  DEFAULT_ULEPSZENIA_PRACA_PERCENT,
  computeAiImprovementBudgetCapForOwner,
  freshUlepszeniaEmpirePolicy,
  freshUlepszeniaEmpirePolicyForOwner,
} from ${JSON.stringify(path.join(SRC, 'game', 'cities'))};
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [entryFile],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: bundleFile,
    absWorkingDir: GRA_ROOT,
    logLevel: 'silent',
  });

  const M = require(bundleFile);
  const aiOwner = (ownerId) => [7, 8, 9].includes(ownerId);

  console.log('1. Wspólny default pozostaje graczom 33%, a każdy owner AI dostaje 100%');
  assert('DEFAULT_ULEPSZENIA_PRACA_PERCENT = 33', M.DEFAULT_ULEPSZENIA_PRACA_PERCENT === 33);
  assert('AI_MAJOR_ULEPSZENIA_PRACA_PERCENT = 100', M.AI_MAJOR_ULEPSZENIA_PRACA_PERCENT === 100);
  assert('fresh policy player = 33%', M.freshUlepszeniaEmpirePolicy().pracaAutoPercent === 33);
  assert(
    'owner-aware policy major AI = 100%',
    M.freshUlepszeniaEmpirePolicyForOwner(7, aiOwner).pracaAutoPercent === 100,
  );
  assert(
    'owner-aware policy city-state = 100%',
    M.freshUlepszeniaEmpirePolicyForOwner(8, aiOwner).pracaAutoPercent === 100,
  );
  assert(
    'owner-aware policy defensive-copy = 100%',
    M.freshUlepszeniaEmpirePolicyForOwner(9, aiOwner).pracaAutoPercent === 100,
  );
  assert(
    'owner-aware policy player/hotseat = shared 33%',
    M.freshUlepszeniaEmpirePolicyForOwner(0, aiOwner).pracaAutoPercent === 33
      && M.freshUlepszeniaEmpirePolicyForOwner(2, aiOwner).pracaAutoPercent === 33,
  );

  console.log('2. Cap jest pełną skumulowaną pulą AI, bez drugiego splitu');
  const cumulativePools = [0, 1, 49, 50, 101, 1000];
  for (const pool of cumulativePools) {
    const majorCap = M.computeAiImprovementBudgetCapForOwner(7, pool, aiOwner);
    const cityStateCap = M.computeAiImprovementBudgetCapForOwner(8, pool, aiOwner);
    const defensiveCopyCap = M.computeAiImprovementBudgetCapForOwner(9, pool, aiOwner);
    assert(`major AI pool ${pool} -> full cap`, majorCap === pool);
    assert(`city-state pool ${pool} -> full cap`, cityStateCap === pool);
    assert(`defensive-copy pool ${pool} -> full cap`, defensiveCopyCap === pool);
  }

  const mainSource = fs.readFileSync(path.join(SRC, 'main.ts'), 'utf8');
  const aiSource = fs.readFileSync(path.join(SRC, 'game', 'ai.ts'), 'utf8');
  console.log('3. Realne call sites main.ts są owner-aware');
  assert(
    'initial owner seeding uses owner-aware policy',
    mainSource.includes('freshUlepszeniaEmpirePolicyForOwner(ownerId, aiImprovementOwner)'),
  );
  assert(
    'new/captured owner seeding uses real AI predicate',
    mainSource.includes('freshUlepszeniaEmpirePolicyForOwner(c.ownerId, isAiImprovementOwner)'),
  );
  assert(
    'AI predicate excludes human owners and sentinels',
    mainSource.includes('ownerId > 0 && isAiOwner(humanSeats, ownerId)')
      && !mainSource.includes('isAiOwner(humanSeats, ownerId) && !isCityStateOwner(ownerId)'),
  );
  assert(
    'save/load re-seeds AI owners to 100%',
    mainSource.includes('loadedPolicy.pracaAutoPercent = AI_MAJOR_ULEPSZENIA_PRACA_PERCENT'),
  );
  assert(
    'AI budget cap calls the executable owner-aware production helper',
    mainSource.includes('const aiPool = aiPracaPoolByOwner.get(ownerId) ?? 0;')
      && mainSource.includes(
        'computeAiImprovementBudgetCapForOwner(ownerId, aiPool, isAiImprovementOwner)',
      ),
  );
  assert(
    'AI passes the calculated absolute cap to the real planner',
    mainSource.includes('improvementBudgetCap: aiImprovementBudgetByOwner.get(ownerId)'),
  );
  assert('50/50 Work split constant remains 50%', M.AI_FIXED_PROCENT_BUDYNKI === 50);
  assert('AI planner does not perform a second split', !aiSource.includes('splitEmpirePracaBudget'));
} finally {
  try { fs.unlinkSync(entryFile); } catch {}
  try { fs.unlinkSync(bundleFile); } catch {}
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exitCode = failed === 0 ? 0 : 1;
