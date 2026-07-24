'use strict';
/**
 * ai-unit-rush-test.cjs -- standalone Node test dla R-AI-KUP-JEDN (decyzja
 * Macieja 2026-07-24, parytet AI): AI może kupić kolejkowaną jednostkę za
 * złoto (rush), zamiast zawsze czekać na dokończenie Pracą -- ZACHOWAWCZO,
 * patrz shouldAIRushBuyUnit (game/ai.ts).
 *
 * Run from gra/:  node tools/ai-unit-rush-test.cjs
 *
 * Wzorowany na tools/unit-stock-cost-test.cjs (ten sam sposob budowania
 * bundla esbuild + styl asercji).
 *
 * Predykat (CZYSTY, bez dostępu do main.ts/stanu gry):
 *   shouldAIRushBuyUnit({ atWar, treasury, reserve, goldCost, hasManpower,
 *                         boughtThisTurn, maxPerTurn }) -> boolean
 *   true wtw: atWar && hasManpower && treasury >= reserve + goldCost
 *             && boughtThisTurn < maxPerTurn.
 *
 * Pokrywa tabelę przypadków z zadania:
 *   - brak wojny -> false
 *   - brak Manpower -> false
 *   - za mało złota (treasury < reserve+goldCost) -> false
 *   - limit turowy wyczerpany -> false
 *   - wszystko OK -> true
 *   - brzeg treasury == reserve+goldCost -> true
 */

const fs   = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) { console.error('[ai-unit-rush-test] esbuild not found. Run: npm install (from gra/)'); process.exit(1); }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY_FILE  = path.resolve(__dirname, '.ai-unit-rush-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.ai-unit-rush-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export { shouldAIRushBuyUnit } from '../src/game/ai';
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
  console.error('[ai-unit-rush-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE_FILE);
const { shouldAIRushBuyUnit } = M;

let passed = 0, failed = 0;
function assert(cond, msg) { if (cond) { passed++; } else { failed++; console.error('FAIL:', msg); } }
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

const BASE = {
  atWar: true,
  treasury: 300,
  reserve: 100,
  goldCost: 50,
  hasManpower: true,
  boughtThisTurn: 0,
  maxPerTurn: 1,
};

console.log('\n-- A. Tabela przypadkow: shouldAIRushBuyUnit --');

// 1. Wszystko OK -> true
eq(shouldAIRushBuyUnit({ ...BASE }), true, 'wszystko OK -> true');

// 2. Brak wojny -> false
eq(shouldAIRushBuyUnit({ ...BASE, atWar: false }), false, 'brak wojny -> false');

// 3. Brak Manpower -> false
eq(shouldAIRushBuyUnit({ ...BASE, hasManpower: false }), false, 'brak Manpower -> false');

// 4. Za malo zlota (treasury < reserve + goldCost) -> false
eq(
  shouldAIRushBuyUnit({ ...BASE, treasury: BASE.reserve + BASE.goldCost - 1 }),
  false,
  'za malo zlota (treasury < reserve+goldCost) -> false',
);

// 5. Limit turowy wyczerpany (boughtThisTurn >= maxPerTurn) -> false
eq(
  shouldAIRushBuyUnit({ ...BASE, boughtThisTurn: 1, maxPerTurn: 1 }),
  false,
  'limit turowy wyczerpany -> false',
);

// 6. Brzeg: treasury == reserve + goldCost -> true
eq(
  shouldAIRushBuyUnit({ ...BASE, treasury: BASE.reserve + BASE.goldCost }),
  true,
  'brzeg treasury == reserve+goldCost -> true',
);

// 7. Dodatkowy brzeg: boughtThisTurn tuz ponizej maxPerTurn wiekszego niz 1 -> true
eq(
  shouldAIRushBuyUnit({ ...BASE, boughtThisTurn: 1, maxPerTurn: 2 }),
  true,
  'boughtThisTurn(1) < maxPerTurn(2) -> true',
);

// 8. Kombinacja wielu warunkow niespelnionych naraz -> false (nie tylko jeden)
eq(
  shouldAIRushBuyUnit({ ...BASE, atWar: false, hasManpower: false, treasury: 0 }),
  false,
  'wiele warunkow niespelnionych naraz -> false',
);

console.log(`\nai-unit-rush-test: ${passed} passed, ${failed} failed`);

try { fs.unlinkSync(ENTRY_FILE); } catch (_e) { /* noop */ }
try { fs.unlinkSync(BUNDLE_FILE); } catch (_e) { /* noop */ }

process.exit(failed > 0 ? 1 : 0);
