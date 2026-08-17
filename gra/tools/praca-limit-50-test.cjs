'use strict';
/**
 * praca-limit-50-test.cjs — R-PRACA-LIMIT-50-PROC-WSPOLNY-WOREK-Q1 = A (2026-08-17).
 * Testuje limit 50% dla wspólnego worka (ulepszenia terenu).
 * Test nowej funkcji clampPracaWspolnyWorekPercent() i powiązanych ograniczeń.
 * Run from gra/:  node tools/praca-limit-50-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[praca-limit-50-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = process.env.UPP_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const ENTRY_FILE = path.resolve(__dirname, '.praca-limit-50-test-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.praca-limit-50-test-bundle.cjs');

const ENTRY_TS = `
export {
  clampPracaWspolnyWorekPercent,
  MAX_PRACA_WSPOLNY_WOREK_PROCENT,
  clampUlepszeniaPracaPercent,
  DEFAULT_ULEPSZENIA_PRACA_PERCENT,
  resolveEffectiveUlepszenia,
  resolveUlepszeniaPracaPercentFromRaw,
  migrateUlepszeniaPerTurnToPercent,
} from ${JSON.stringify(SRC + '/game/cities')};
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
    loader: { '.json': 'json' },
  });
} catch (e) {
  console.error('[praca-limit-50-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const {
  clampPracaWspolnyWorekPercent,
  MAX_PRACA_WSPOLNY_WOREK_PROCENT,
  clampUlepszeniaPracaPercent,
  DEFAULT_ULEPSZENIA_PRACA_PERCENT,
  resolveEffectiveUlepszenia,
  resolveUlepszeniaPracaPercentFromRaw,
  migrateUlepszeniaPerTurnToPercent,
} = require(BUNDLE_FILE);

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error('  FAIL:', msg); }
}
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

// 1. MAX_PRACA_WSPOLNY_WOREK_PROCENT stała
console.log('1. MAX_PRACA_WSPOLNY_WOREK_PROCENT = 50 (pin literalny)');
{
  eq(MAX_PRACA_WSPOLNY_WOREK_PROCENT, 50, 'MAX_PRACA_WSPOLNY_WOREK_PROCENT na 50');
}

// 2. clampPracaWspolnyWorekPercent — zakres 0-50
console.log('2. clampPracaWspolnyWorekPercent — zakres 0-50');
{
  eq(clampPracaWspolnyWorekPercent(undefined), DEFAULT_ULEPSZENIA_PRACA_PERCENT, 'undefined -> domyslny %');
  eq(clampPracaWspolnyWorekPercent(null), DEFAULT_ULEPSZENIA_PRACA_PERCENT, 'null -> domyslny %');
  eq(clampPracaWspolnyWorekPercent(NaN), DEFAULT_ULEPSZENIA_PRACA_PERCENT, 'NaN -> domyslny %');
  eq(clampPracaWspolnyWorekPercent(-5), 0, '-5 -> 0 (dolny klamr)');
  eq(clampPracaWspolnyWorekPercent(25), 25, '25 -> 25 (wewnątrz zakresu)');
  eq(clampPracaWspolnyWorekPercent(50), 50, '50 -> 50 (górny limit)');
  eq(clampPracaWspolnyWorekPercent(75), 50, '75 -> 50 (górny klamr — NOWY limit)');
  eq(clampPracaWspolnyWorekPercent(100), 50, '100 -> 50 (górny klamr — NOWY limit)');
  eq(clampPracaWspolnyWorekPercent(150), 50, '150 -> 50 (górny klamr — NOWY limit)');
}

// 3. Porównanie: clampUlepszeniaPracaPercent NIEZMIENIONA
console.log('3. clampUlepszeniaPracaPercent nadal wspiera 0-100 (NIEZMIENIONA)');
{
  eq(clampUlepszeniaPracaPercent(0), 0, '0 -> 0');
  eq(clampUlepszeniaPracaPercent(50), 50, '50 -> 50');
  eq(clampUlepszeniaPracaPercent(100), 100, '100 -> 100 (WCIĄŻ dostępny dla migracji!)');
  eq(clampUlepszeniaPracaPercent(150), 100, '150 -> 100');
}

// 4. Kontrast: nowa funkcja limituje do 50, stara do 100
console.log('4. Kontrast: clampPracaWspolnyWorekPercent (50) vs clampUlepszeniaPracaPercent (100)');
{
  const testVal = 75;
  const resultNew = clampPracaWspolnyWorekPercent(testVal);
  const resultOld = clampUlepszeniaPracaPercent(testVal);
  eq(resultNew, 50, `nowa funkcja: ${testVal} -> 50 (limit wspólnego worka)`);
  eq(resultOld, 75, `stara funkcja: ${testVal} -> 75 (bez zmian, dla migracji)`);
}

// 5. Scenariusz: resolveEffectiveUlepszenia() — miasto z override pracaAutoPercent=80
console.log('5. Scenariusz: resolveEffectiveUlepszenia() — override miasta z pracaAutoPercent > 50');
{
  // Symulujemy stary/nielegalny zapis gdzie city.ulepszeniaPracaPercent = 80
  // Po przejściu przez resolveEffectiveUlepszenia() z override=true, powinno być ≤50
  const city = {
    id: 'test-city',
    ulepszeniaOverride: true,
    ulepszeniaFocus: 'produkcja',
    ulepszeniaTryb: 'auto',
    ulepszeniaOnlyWorked: false,
    ulepszeniaPracaPercent: 80, // Stary/nielegalny zapis > 50
  };
  const empire = {
    focus: 'zrownowazone',
    tryb: 'reczny',
    onlyWorked: false,
    pracaAutoPercent: 33,
  };
  const effective = resolveEffectiveUlepszenia(city, empire);
  eq(effective.pracaAutoPercent, 50, 'override cidade z 80% clampuje do 50% (limit wspólnego worka)');
  eq(effective.override, true, 'flaga override zachowana');
}

// 6. Scenariusz: wczytanie zapisu gry — stary zapis z pracaAutoPercent=90
console.log('6. Scenariusz: wczytanie zapisu — stary pracaAutoPercent=90 clampuje do 50%');
{
  // Symulujemy wczytywanie starego zapisu gdzie pol.pracaAutoPercent = 90 (przed limitacją)
  // Po resolveUlepszeniaPracaPercentFromRaw() + clampPracaWspolnyWorekPercent() powinno być 50
  const result = clampPracaWspolnyWorekPercent(
    resolveUlepszeniaPracaPercentFromRaw(90, undefined)
  );
  eq(result, 50, 'zapis pol.pracaAutoPercent=90 → resolveFromRaw(90) → clampTo50 → 50');
}

// 7. Scenariusz: wczytanie zapisu gry — stary perTurn=3 (migruje do 100, potem clampuje)
console.log('7. Scenariusz: wczytanie zapisu — stary perTurn=3 (100%) clampuje do 50%');
{
  // Symulujemy wczytywanie bardzo starego zapisu gdzie perTurn=3 (=100%)
  // Po migracji i clampowaniu powinno być 50
  const result = clampPracaWspolnyWorekPercent(
    resolveUlepszeniaPracaPercentFromRaw(undefined, 3)
  );
  eq(result, 50, 'zapis perTurn=3 → resolveFromRaw(undef, 3) → 100% → clampTo50 → 50');
}

// 8. Scenariusz: wczytanie zapisu gry — mieszany: pracaAutoPercent=60, perTurn=2
console.log('8. Scenariusz: mieszany zapis (pracaAutoPercent ma pierwszeństwo)');
{
  // resolveUlepszeniaPracaPercentFromRaw daje pierwszeństwo newVal, ignoruje legacyPerTurn
  const result = clampPracaWspolnyWorekPercent(
    resolveUlepszeniaPracaPercentFromRaw(60, 2)
  );
  eq(result, 50, 'zapis (pracaAutoPercent=60, perTurn=2) → 60 → clampTo50 → 50');
}

console.log(`\npraca-limit-50-test: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
