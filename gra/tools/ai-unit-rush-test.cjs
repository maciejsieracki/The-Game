'use strict';
/**
 * ai-unit-rush-test.cjs -- standalone Node test dla R-AI-MP-REKRUTACJA-
 * SKARBIEC-ZAMIAST-BUDOWY-Q1: AI kupuje jednostkę za złoto poza wojną,
 * tak jak gracz, przez wspólną ścieżkę rekrutacji.
 *
 * Run from gra/:  node tools/ai-unit-rush-test.cjs
 *
 * Wzorowany na tools/unit-stock-cost-test.cjs (ten sam sposob budowania
 * bundla esbuild + styl asercji).
 *
 * Predykat (CZYSTY, bez dostępu do main.ts/stanu gry):
 *   shouldAIPurchaseUnit({ treasury, goldCost, hasManpower }) -> boolean
 *   true wtw: hasManpower && treasury >= goldCost.
 *
 * Pokrywa tabelę przypadków z zadania:
 *   - brak wojny -> true
 *   - brak Manpower -> false
 *   - za mało złota (treasury < goldCost) -> false
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
export { shouldAIPurchaseUnit } from '../src/game/ai';
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
const { shouldAIPurchaseUnit } = M;

let passed = 0, failed = 0;
function assert(cond, msg) { if (cond) { passed++; } else { failed++; console.error('FAIL:', msg); } }
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

const BASE = {
  treasury: 300,
  goldCost: 50,
  hasManpower: true,
};

console.log('\n-- A. Tabela przypadkow: shouldAIPurchaseUnit --');

// 1. Wszystko OK -> true
eq(shouldAIPurchaseUnit({ ...BASE }), true, 'wszystko OK -> true');

// 2. Poza wojną -> true (wojna nie jest bramką kanonu zakupu)
eq(shouldAIPurchaseUnit({ ...BASE }), true, 'poza wojną -> true');

// 3. Brak Manpower -> false
eq(shouldAIPurchaseUnit({ ...BASE, hasManpower: false }), false, 'brak Manpower -> false');

// 4. Za malo zlota (treasury < reserve + goldCost) -> false
eq(
  shouldAIPurchaseUnit({ ...BASE, treasury: BASE.goldCost - 1 }),
  false,
  'za malo zlota (treasury < goldCost) -> false',
);

// 5. Dawny limit AI nie blokuje kanonicznego zakupu.
eq(
  shouldAIPurchaseUnit({ ...BASE }),
  true,
  'brak AI-only limitu zakupów -> true',
);

// 6. Brzeg: treasury == goldCost -> true
eq(
  shouldAIPurchaseUnit({ ...BASE, treasury: BASE.goldCost }),
  true,
  'brzeg treasury == goldCost -> true',
);

// 7. Kombinacja warunków kanonicznych niespełnionych naraz -> false
eq(
  shouldAIPurchaseUnit({ ...BASE, hasManpower: false, treasury: 0 }),
  false,
  'wiele warunkow niespelnionych naraz -> false',
);

console.log(`\nai-unit-rush-test: ${passed} passed, ${failed} failed`);

try { fs.unlinkSync(ENTRY_FILE); } catch (_e) { /* noop */ }
try { fs.unlinkSync(BUNDLE_FILE); } catch (_e) { /* noop */ }

process.exit(failed > 0 ? 1 : 0);
