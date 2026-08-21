'use strict';
/**
 * praca-limit-50-test.cjs — R-PRACA-LIMIT-50-PROC-WSPOLNY-WOREK-Q1 = A (2026-08-17).
 * Testuje limit 50% dla wspólnego worka (ulepszenia terenu).
 * Test nowej funkcji clampPracaWspolnyWorekPercent() i powiązanych ograniczeń.
 *
 * ZAKTUALIZOWANY w R-PRACA-SUWAKI-DUPLIKAT-I-CAP-MIASTO-Q1 (Wątek C) = A, ECHO właściciela
 * 2026-08-21 (`docs/decyzje/R-PRACA-SUWAKI-DUPLIKAT-I-CAP-MIASTO-Q1.md`): historyczny budżet
 * automatu (`clampUlepszeniaPracaPercent`) PRZESTAŁ być niezależny od nadrzędnego capu 50% —
 * cofnięto wcześniejszą decyzję z 2026-08-17, że miasto w trybie „Indywidualne"/automat może
 * przekroczyć 50%. Scenariusze 3-9 poniżej zaktualizowane, żeby dokumentować NOWE zachowanie
 * (cap 50% wszędzie); patrz też `gra/tools/praca-miasto-limit-50-cap-test.cjs` (nowy test,
 * per-city automat, dokładniejsze pokrycie tej samej decyzji).
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

// 3. clampUlepszeniaPracaPercent — od Wątku C egzekwuje TEN SAM cap 50% co clampPracaWspolnyWorekPercent
console.log('3. clampUlepszeniaPracaPercent — od Wątku C egzekwuje cap 50% (ZMIENIONA)');
{
  eq(clampUlepszeniaPracaPercent(0), 0, '0 -> 0');
  eq(clampUlepszeniaPracaPercent(50), 50, '50 -> 50 (górny limit)');
  eq(clampUlepszeniaPracaPercent(100), 50, '100 -> 50 (NOWY cap, dawniej 100)');
  eq(clampUlepszeniaPracaPercent(150), 50, '150 -> 50 (NOWY cap)');
}

// 4. Kontrast: obie funkcje limitują teraz do 50 (Wątek C ujednolicił cap)
console.log('4. Kontrast: clampPracaWspolnyWorekPercent (50) vs clampUlepszeniaPracaPercent (teraz też 50)');
{
  const testVal = 75;
  const resultNew = clampPracaWspolnyWorekPercent(testVal);
  const resultOld = clampUlepszeniaPracaPercent(testVal);
  eq(resultNew, 50, `nowa funkcja: ${testVal} -> 50 (limit wspólnego worka)`);
  eq(resultOld, 50, `historyczny automat: ${testVal} -> 50 (Wątek C = A, ujednolicony cap, dawniej 75)`);
}

// 5. Scenariusz: resolveEffectiveUlepszenia() — miasto z override pracaAutoPercent=80
// R-PRACA-SUWAKI-DUPLIKAT-I-CAP-MIASTO-Q1 (Wątek C) = A: historyczny budżet automatu TERAZ
// dziedziczy cap nadrzędnego splitu 50% — miasto w trybie „Indywidualne" nie może już go
// obejść. Cofa decyzję z 2026-08-17 testowaną tu wcześniej.
console.log('5. Scenariusz: resolveEffectiveUlepszenia() — override miasta z pracaAutoPercent > 50 zostaje ścięty do 50 (Wątek C = A)');
{
  // Symulujemy zapis miasta, w którym historyczny automat ma ustawione 80%.
  // Po przejściu przez resolveEffectiveUlepszenia() z override=true, cap 50% ma być wymuszony.
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
  eq(effective.pracaAutoPercent, 50, 'override miasta z 80% zostaje ścięty do 50% (cap nadrzędny, Wątek C = A)');
  eq(effective.override, true, 'flaga override zachowana');
}

// 6. Scenariusz: wczytanie zapisu gry — stary zapis z pracaAutoPercent=90 zostaje ścięty do 50
console.log('6. Scenariusz: wczytanie zapisu — stary pracaAutoPercent=90 zostaje ścięty do capu 50 (migracja, Wątek C)');
{
  // Symulujemy wczytywanie starego zapisu gdzie pol.pracaAutoPercent = 90 (sprzed capu).
  // Po resolveUlepszeniaPracaPercentFromRaw() + NOWYM clampie 0–50 ma wyjść 50.
  const result = clampUlepszeniaPracaPercent(
    resolveUlepszeniaPracaPercentFromRaw(90, undefined)
  );
  eq(result, 50, 'zapis pol.pracaAutoPercent=90 → resolveFromRaw(90) → clampTo50 (Wątek C) → 50');
}

// 7. Scenariusz: wczytanie zapisu gry — stary perTurn=3 (migruje do 100, potem ścięty do capu)
console.log('7. Scenariusz: wczytanie zapisu — stary perTurn=3 (100%) zostaje ścięty do capu 50 (migracja, Wątek C)');
{
  // Symulujemy wczytywanie bardzo starego zapisu gdzie perTurn=3 (=100% wg migracji).
  // Migracja daje surowe 100, ale NOWY clamp (Wątek C) ścina do 50 przy tym samym wczytaniu.
  const result = clampUlepszeniaPracaPercent(
    resolveUlepszeniaPracaPercentFromRaw(undefined, 3)
  );
  eq(result, 50, 'zapis perTurn=3 → resolveFromRaw(undef, 3) → 100% (migracja) → clampTo50 (Wątek C) → 50');
}

// 8. Scenariusz: wczytanie zapisu gry — mieszany: pracaAutoPercent=60, perTurn=2, ścięte do capu
console.log('8. Scenariusz: mieszany zapis (pracaAutoPercent ma pierwszeństwo, potem cap 50 z Wątku C)');
{
  // resolveUlepszeniaPracaPercentFromRaw daje pierwszeństwo newVal (60), ignoruje legacyPerTurn (2);
  // NOWY clamp (Wątek C) ścina 60 -> 50.
  const result = clampUlepszeniaPracaPercent(
    resolveUlepszeniaPracaPercentFromRaw(60, 2)
  );
  eq(result, 50, 'zapis (pracaAutoPercent=60, perTurn=2) → 60 → clampTo50 (Wątek C) → 50');
}

// 9. Scenariusz: ensureCitySaveDefaults() — migracja miasta z override + wysokim ulepszeniaPracaPercent
console.log('9. Scenariusz: ensureCitySaveDefaults() — migracja TERAZ przenosi cap 50% do automatu (Wątek C = A)');
{
  // Symulujemy miasto z ulepszeniaOverride=true i historycznym automatem ustawionym na 80%
  // (istniejący zapis sprzed tej decyzji). Po ensureCitySaveDefaults() ma zostać ścięte do 50 —
  // to jest dokładnie migracja save/load, o którą prosiło ECHO właściciela.
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
  eq(city.ulepszeniaPracaPercent, 50, 'ensureCitySaveDefaults() TERAZ przenosi cap 50% do automatu (Wątek C = A)');
  assert(city.ulepszeniaOverride === true, 'flaga override zachowana po ensureCitySaveDefaults()');
}

console.log(`\npraca-limit-50-test: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
