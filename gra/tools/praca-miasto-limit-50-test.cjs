'use strict';
/**
 * praca-miasto-limit-50-test.cjs — lokalny podział miasta.
 * Kontrakt: Budynki 50–100%, Pula Pracy = reszta 0–50%; automat ulepszeń
 * pozostaje osobnym budżetem 0–100%.
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[praca-miasto-limit-50-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = process.env.UPP_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const ENTRY_FILE = path.resolve(__dirname, '.praca-miasto-limit-50-test-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.praca-miasto-limit-50-test-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export {
  DEFAULT_PODZIAL_PRACY,
  MIN_PODZIAL_PRACY_BUDYNKI_PERCENT,
  MAX_PODZIAL_PRACY_BUDYNKI_PERCENT,
  clampPodzialPracyBudynkiPercent,
  clampUlepszeniaPracaPercent,
  ensureCityPodzialDefaults,
} from ${JSON.stringify(SRC + '/game/cities')};
export {
  resolveCityPodzialPracy,
  migratePodzialPracyOnLoad,
} from ${JSON.stringify(SRC + '/game/empire-city-defaults')};
`, 'utf8');

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
  console.error('[praca-miasto-limit-50-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE_FILE);
let passed = 0;
let failed = 0;
function ok(condition, message) {
  if (condition) {
    passed++;
    console.log('PASS:', message);
  } else {
    failed++;
    console.error('FAIL:', message);
  }
}
function eq(actual, expected, message) {
  ok(actual === expected, `${message} (got ${actual}, want ${expected})`);
}

eq(M.MIN_PODZIAL_PRACY_BUDYNKI_PERCENT, 50, 'minimum lokalnego udziału budynków = 50%');
eq(M.MAX_PODZIAL_PRACY_BUDYNKI_PERCENT, 100, 'maksimum lokalnego udziału budynków = 100%');

for (const [raw, expected] of [[-20, 50], [0, 50], [1, 50], [49, 50], [50, 50], [70, 70], [100, 100], [150, 100]]) {
  eq(
    M.clampPodzialPracyBudynkiPercent(raw),
    expected,
    `clamp lokalny ${raw} → ${expected}% budynków`,
  );
}
eq(
  M.clampPodzialPracyBudynkiPercent(Number.NaN),
  M.DEFAULT_PODZIAL_PRACY.procentBudynki,
  'niepoprawny lokalny zapis → domyślne 70% budynków',
);

for (const raw of [0, 49, 50, 70, 100, 150]) {
  const resolved = M.resolveCityPodzialPracy(
    { ownerId: 0, podzialPracyOverride: true, podzialPracy: { procentBudynki: raw } },
    { procentBudynki: 70 },
  );
  const expected = Math.max(50, Math.min(100, raw));
  eq(resolved.procentBudynki, expected, `resolver override ${raw} → ${expected}% budynków`);
  ok(100 - resolved.procentBudynki >= 0 && 100 - resolved.procentBudynki <= 50,
    `resolver override ${raw}: pula jako reszta mieści się w 0–50%`);
}

const fallback = M.resolveCityPodzialPracy(
  { ownerId: 5, podzialPracyOverride: false },
  undefined,
  { procentBudynki: 42 },
);
eq(fallback.procentBudynki, 50, 'fallback 42% budynków → minimum 50%');

const legacyCities = [
  { id: 'c1', ownerId: 0, podzialPracy: { procentBudynki: 70 } },
  { id: 'c2', ownerId: 0, podzialPracy: { procentBudynki: 0 } },
];
const defaults = new Map();
M.migratePodzialPracyOnLoad(legacyCities, defaults, undefined);
eq(defaults.get(0).procentBudynki, 70, 'migracja zachowuje default z pierwszego miasta');
eq(legacyCities[1].podzialPracy.procentBudynki, 50, 'migracja normalizuje stary lokalny zapis 0% do 50%');
ok(legacyCities[1].podzialPracyOverride === true, 'migracja zachowuje lokalny override po normalizacji');

const loadedCity = {
  id: 'loaded',
  ownerId: 0,
  podzialPracyOverride: true,
  podzialPracy: { procentBudynki: 0 },
};
M.ensureCityPodzialDefaults(loadedCity);
eq(loadedCity.podzialPracy.procentBudynki, 50, 'ensureCityPodzialDefaults normalizuje wczytany lokalny zapis 0%');
const loadedEffective = M.resolveCityPodzialPracy(loadedCity, undefined);
eq(loadedEffective.procentBudynki, 50, 'wczytany lokalny zapis 0% nie schodzi poniżej 50%');

// R-PRACA-SUWAKI-DUPLIKAT-I-CAP-MIASTO-Q1 (Wątek C) = A, ECHO właściciela 2026-08-21: od tej
// decyzji clampUlepszeniaPracaPercent (historyczny budżet automatu, empire i per-city override)
// egzekwuje TEN SAM nadrzędny cap 50% co clampPracaWspolnyWorekPercent — nie ma już własnego,
// niezależnego maksimum 100%. Cofa wcześniejsze zachowanie testowane tu do FALI poprzedzającej
// tę decyzję; pełne pokrycie w `gra/tools/praca-limit-50-test.cjs` (scenariusze 3-9) i
// `gra/tools/praca-miasto-limit-50-cap-test.cjs` (nowy test tego wątku).
eq(M.clampUlepszeniaPracaPercent(0), 0, 'automat 0% pozostaje legalny');
eq(M.clampUlepszeniaPracaPercent(50), 50, 'automat 50% pozostaje legalny (górny limit nadrzędnego capu)');
eq(M.clampUlepszeniaPracaPercent(100), 50, 'automat 100% zostaje ścięty do nadrzędnego capu 50% (Wątek C = A)');
eq(M.clampUlepszeniaPracaPercent(150), 50, 'automat clampuje do nadrzędnego capu 50%, nie własnego maksimum 100%');

console.log(`\n[praca-miasto-limit-50-test] ${passed} pass, ${failed} fail`);
process.exit(failed > 0 ? 1 : 0);
