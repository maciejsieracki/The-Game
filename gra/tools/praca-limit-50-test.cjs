'use strict';
/**
 * praca-limit-50-test.cjs — R-PRACA-LIMIT-50-PROC-WSPOLNY-WOREK-Q1 = A (2026-08-17).
 * Testuje limit 50% dla wspólnego worka (ulepszenia terenu).
 * Test nowej funkcji clampPracaWspolnyWorekPercent() i powiązanych ograniczeń.
 *
 * ZAKTUALIZOWANY w P-PRACA-ULEPSZENIA-RECZNY-CAP-BUG-Q1 (2026-08-22): R-PRACA-SUWAKI-DUPLIKAT-
 * I-CAP-MIASTO-Q1 (Wątek C) = A, ECHO właściciela 2026-08-21, OMYŁKOWO nałożyła nadrzędny cap
 * 50% TAKŻE na niezależny historyczny budżet automatu (`clampUlepszeniaPracaPercent`, pole (b)).
 * Ten temat naprawia tę regresję: pole (b) wraca do własnego zakresu 0-100%
 * (`MAX_ULEPSZENIA_PRACA_AUTO_PERCENT`), NIEZALEŻNIE od nadrzędnego capu 50% pola (a)
 * (`clampPracaWspolnyWorekPercent`/`MAX_PRACA_WSPOLNY_WOREK_PROCENT`, scenariusze 1-2 niżej —
 * BEZ zmian). Scenariusze 3-9 poniżej zaktualizowane, żeby dokumentować NOWE (naprawione)
 * zachowanie (cap 100% dla pola (b)); patrz też `gra/tools/praca-miasto-limit-50-cap-test.cjs`
 * (dokładniejsze pokrycie tego samego pola).
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
  MAX_ULEPSZENIA_PRACA_AUTO_PERCENT,
  DEFAULT_ULEPSZENIA_PRACA_PERCENT,
  resolveEffectiveUlepszenia,
  resolveUlepszeniaPracaPercentFromRaw,
  migrateUlepszeniaPerTurnToPercent,
  ensureCitySaveDefaults,
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
  MAX_ULEPSZENIA_PRACA_AUTO_PERCENT,
  DEFAULT_ULEPSZENIA_PRACA_PERCENT,
  resolveEffectiveUlepszenia,
  resolveUlepszeniaPracaPercentFromRaw,
  migrateUlepszeniaPerTurnToPercent,
  ensureCitySaveDefaults,
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

// 3. clampUlepszeniaPracaPercent (pole b) — NAPRAWIONE: własny cap 100%, niezależny od pola (a)
console.log('3. clampUlepszeniaPracaPercent (pole b) — własny cap 100% (P-PRACA-ULEPSZENIA-RECZNY-CAP-BUG-Q1)');
{
  eq(MAX_ULEPSZENIA_PRACA_AUTO_PERCENT, 100, 'MAX_ULEPSZENIA_PRACA_AUTO_PERCENT = 100 (naprawiona regresja)');
  eq(clampUlepszeniaPracaPercent(0), 0, '0 -> 0');
  eq(clampUlepszeniaPracaPercent(50), 50, '50 -> 50 (wewnątrz, dawny cap pola (a))');
  eq(clampUlepszeniaPracaPercent(100), 100, '100 -> 100 (NAPRAWIONE: znów 100, nie 50)');
  eq(clampUlepszeniaPracaPercent(150), 100, '150 -> 100 (górny klamr własnego zakresu 0-100)');
}

// 4. Kontrast: pole (a) ogranicza do 50, pole (b) ma własny, niezależny zakres 0-100
console.log('4. Kontrast: clampPracaWspolnyWorekPercent (a, 50) vs clampUlepszeniaPracaPercent (b, teraz 100)');
{
  const testVal = 75;
  const resultA = clampPracaWspolnyWorekPercent(testVal);
  const resultB = clampUlepszeniaPracaPercent(testVal);
  eq(resultA, 50, `pole (a) wspólny worek: ${testVal} -> 50 (bez zmian)`);
  eq(resultB, 75, `pole (b) historyczny automat: ${testVal} -> 75 (NAPRAWIONE: niezależny zakres 0-100, nie ścinane do 50)`);
}

// 5. Scenariusz: resolveEffectiveUlepszenia() — miasto z override pracaAutoPercent=80
// P-PRACA-ULEPSZENIA-RECZNY-CAP-BUG-Q1: historyczny budżet automatu (pole b) znów NIE dziedziczy
// capu nadrzędnego splitu (a) — miasto w trybie „Indywidualne" może ponownie ustawić > 50%.
console.log('5. Scenariusz: resolveEffectiveUlepszenia() — override miasta z pracaAutoPercent=80 NIE jest już ścinany do 50');
{
  // Symulujemy zapis miasta, w którym historyczny automat ma ustawione 80%.
  // Po przejściu przez resolveEffectiveUlepszenia() z override=true, 80% ma zostać bez zmian.
  const city = {
    id: 'test-city',
    ulepszeniaOverride: true,
    ulepszeniaFocus: 'produkcja',
    ulepszeniaTryb: 'auto',
    ulepszeniaOnlyWorked: false,
    ulepszeniaPracaPercent: 80,
  };
  const empire = {
    focus: 'zrownowazone',
    tryb: 'reczny',
    onlyWorked: false,
    pracaAutoPercent: 33,
  };
  const effective = resolveEffectiveUlepszenia(city, empire);
  eq(effective.pracaAutoPercent, 80, 'override miasta z 80% pozostaje 80% (naprawiona regresja, cap pola (b) = 100)');
  eq(effective.override, true, 'flaga override zachowana');
}

// 6. Scenariusz: wczytanie zapisu gry — stary zapis z pracaAutoPercent=90 pozostaje 90
console.log('6. Scenariusz: wczytanie zapisu — pracaAutoPercent=90 pozostaje 90 (cap pola (b) = 100)');
{
  // Symulujemy wczytywanie zapisu gdzie pol.pracaAutoPercent = 90.
  // Po resolveUlepszeniaPracaPercentFromRaw() + clampie 0-100 (pole b) ma wyjść 90 bez zmian.
  const result = clampUlepszeniaPracaPercent(
    resolveUlepszeniaPracaPercentFromRaw(90, undefined)
  );
  eq(result, 90, 'zapis pol.pracaAutoPercent=90 → resolveFromRaw(90) → clamp 0-100 (pole b) → 90 (bez zmian)');
}

// 7. Scenariusz: wczytanie zapisu gry — stary perTurn=3 (migruje do 100, zostaje 100)
console.log('7. Scenariusz: wczytanie zapisu — stary perTurn=3 (100%) zostaje 100 (cap pola (b) = 100)');
{
  // Symulujemy wczytywanie bardzo starego zapisu gdzie perTurn=3 (=100% wg migracji).
  // Migracja daje surowe 100, clamp 0-100 (pole b) zostawia bez zmian.
  const result = clampUlepszeniaPracaPercent(
    resolveUlepszeniaPracaPercentFromRaw(undefined, 3)
  );
  eq(result, 100, 'zapis perTurn=3 → resolveFromRaw(undef, 3) → 100% (migracja) → clamp 0-100 (pole b) → 100');
}

// 8. Scenariusz: wczytanie zapisu gry — mieszany: pracaAutoPercent=60, perTurn=2, bez ścinania
console.log('8. Scenariusz: mieszany zapis (pracaAutoPercent ma pierwszeństwo, cap pola (b) = 100 -> bez ścinania)');
{
  // resolveUlepszeniaPracaPercentFromRaw daje pierwszeństwo newVal (60), ignoruje legacyPerTurn (2);
  // clamp 0-100 (pole b) zostawia 60 bez zmian.
  const result = clampUlepszeniaPracaPercent(
    resolveUlepszeniaPracaPercentFromRaw(60, 2)
  );
  eq(result, 60, 'zapis (pracaAutoPercent=60, perTurn=2) → 60 → clamp 0-100 (pole b) → 60 (bez zmian)');
}

// 9. Scenariusz: ensureCitySaveDefaults() — migracja miasta z override + wysokim ulepszeniaPracaPercent
console.log('9. Scenariusz: ensureCitySaveDefaults() — migracja NIE przenosi już capu 50% na pole (b)');
{
  // Symulujemy miasto z ulepszeniaOverride=true i historycznym automatem ustawionym na 80%.
  // Po ensureCitySaveDefaults() ma zostać bez zmian (80) — naprawiona regresja pola (b).
  const city = {
    id: 'migrate-test-city',
    q: 0,
    r: 0,
    ownerId: 1,
    ludnosc: 1,
    fokus: 'zrownowazone',
    ulepszeniaOverride: true,
    ulepszeniaPracaPercent: 80,
  };
  ensureCitySaveDefaults(city);
  eq(city.ulepszeniaPracaPercent, 80, 'ensureCitySaveDefaults() NIE ścina już do 50% (pole (b) ma własny cap 100)');
  assert(city.ulepszeniaOverride === true, 'flaga override zachowana po ensureCitySaveDefaults()');
}

console.log(`\npraca-limit-50-test: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
