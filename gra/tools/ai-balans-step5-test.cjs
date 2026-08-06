'use strict';
/**
 * ai-balans-step5-test.cjs — AI-BALANS-STEP5 / R-AI-TRUDNOSC P0-1 + C.2 Q1 / C.3 Q2
 * bonus_produkcja → realna Praca major AI (doBudynkow + doPuli × mult z JSON).
 * Run from gra/: node tools/ai-balans-step5-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[ai-balans-step5-test] esbuild not found');
    process.exit(1);
  }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY_FILE = path.resolve(__dirname, '.ai-balans-step5-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.ai-balans-step5-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export { loadDifficultyParams } from '../src/game/ai';
export {
  qualifiesForMajorAiDifficultyBonus,
  difficultyProductionMultiplier,
} from '../src/game/ai-difficulty-bonus';
export { pracaImperialPoolGain } from '../src/game/production';
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
  console.error('[ai-balans-step5-test] bundle failed:', e.message || e);
  process.exit(1);
}

const {
  loadDifficultyParams,
  qualifiesForMajorAiDifficultyBonus,
  difficultyProductionMultiplier,
  pracaImperialPoolGain,
} = require(BUNDLE_FILE);

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
function approx(a, b, msg, eps = 0.001) {
  assert(Math.abs(a - b) < eps, `${msg} (got ${a}, want ~${b})`);
}

const data = makeData();

/** Odpowiednik main.ts:difficultyProductionMultForOwner (major only, poziom 1|2|3). */
function productionMultForOwner(ownerId, isCityState, poziom) {
  if (!qualifiesForMajorAiDifficultyBonus(ownerId, isCityState)) return 1;
  const params = loadDifficultyParams(data, poziom);
  return difficultyProductionMultiplier(params.bonusProdukcja);
}

/** Odpowiednik ticku produkcji w main.ts (~20845-20866). */
function scaleProductionTick(econTick, mult) {
  return {
    doBudynkow: econTick.doBudynkow * mult,
    doPuli: econTick.doPuli * mult,
  };
}

console.log('\n--- T1: loadDifficultyParams — bonus_produkcja z JSON ---');
{
  eq(loadDifficultyParams(data, 1).bonusProdukcja, 0, 'T1a: L1 bonus_produkcja = 0');
  eq(loadDifficultyParams(data, 2).bonusProdukcja, 0.1, 'T1b: L2 bonus_produkcja = 0.1');
  eq(loadDifficultyParams(data, 3).bonusProdukcja, 0.25, 'T1c: L3 bonus_produkcja = 0.25');
}

console.log('\n--- T2: difficultyProductionMultiplier — L1/L2/L3 ---');
{
  eq(difficultyProductionMultiplier(0), 1, 'T2a: L1 mult = 1');
  approx(difficultyProductionMultiplier(0.1), 1.1, 'T2b: L2 mult ≈ 1.1');
  approx(difficultyProductionMultiplier(0.25), 1.25, 'T2c: L3 mult ≈ 1.25');
}

console.log('\n--- T3: major-only gate — gracz / MP / barbar bez bonusu ---');
{
  eq(productionMultForOwner(0, false, 3), 1, 'T3a: gracz ownerId=0 → mult 1');
  eq(productionMultForOwner(5, true, 3), 1, 'T3b: miasto-państwo → mult 1');
  eq(qualifiesForMajorAiDifficultyBonus(2, false), true, 'T3c: major AI qualifies');
}

console.log('\n--- T4: major AI — mult per poziom trudności ---');
{
  eq(productionMultForOwner(2, false, 1), 1, 'T4a: major L1 → mult 1');
  approx(productionMultForOwner(2, false, 2), 1.1, 'T4b: major L2 → mult ≈ 1.1');
  approx(productionMultForOwner(2, false, 3), 1.25, 'T4c: major L3 → mult ≈ 1.25');
}

console.log('\n--- T5: mock tick produkcji — doBudynkow/doPuli × mult ---');
{
  const base = { doBudynkow: 10, doPuli: 6 };
  const l3 = scaleProductionTick(base, 1.25);
  approx(l3.doBudynkow, 12.5, 'T5a: doBudynkow 10 × 1.25 = 12.5');
  approx(l3.doPuli, 7.5, 'T5b: doPuli 6 × 1.25 = 7.5');

  const pracaBudynki = base.doBudynkow * 1.25;
  approx(pracaBudynki, 12.5, 'T5c: pracaBudynki (kolejka zajęta) × mult');

  const poolGain = pracaImperialPoolGain(l3, false);
  approx(poolGain, 7.5, 'T5d: pula imperium = scaled doPuli gdy kolejka zajęta');
}

console.log('\n--- T6: gracz — produkcja bez skalowania ---');
{
  const base = { doBudynkow: 10, doPuli: 6 };
  const mult = productionMultForOwner(0, false, 3);
  const scaled = scaleProductionTick(base, mult);
  eq(scaled.doBudynkow, 10, 'T6a: gracz doBudynkow bez zmian');
  eq(scaled.doPuli, 6, 'T6b: gracz doPuli bez zmian');
}

console.log(`\n=== ai-balans-step5-test: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
