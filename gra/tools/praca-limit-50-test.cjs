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
  clampPodzialPracyBudynkiPercent,
  procentPuliImperiumZBudynkow,
  podzialPracyZProcentuPuli,
  MAX_PROCENT_PULI_IMPERIUM,
  DEFAULT_PODZIAL_PRACY,
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
  clampPodzialPracyBudynkiPercent,
  procentPuliImperiumZBudynkow,
  podzialPracyZProcentuPuli,
  MAX_PROCENT_PULI_IMPERIUM,
  DEFAULT_PODZIAL_PRACY,
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

// R-PRACA-JEDEN-PODZIAL-Q1 — AKTUALIZACJA SCENARIUSZY 1-2 (uzasadnienie w raporcie
// Operatora 01-operator.md):
//   CO PILNOWALY: „udzial ulepszen nigdy > 50%", wyrazone przez pole (a) starego,
//     DRUGIEGO suwaka: `MAX_PRACA_WSPOLNY_WOREK_PROCENT` / `clampPracaWspolnyWorekPercent`.
//   DLACZEGO STARY WARUNEK PRZESTAL BYC PRAWDA: drugi suwak ZOSTAL USUNIETY — dzielil te
//     sama Prace po raz drugi, przez co realny udzial ulepszen wynosil 0% na domyslnych
//     ustawieniach i najwyzej ~20-25% na maksymalnych. Funkcja i stala juz nie istnieja.
//   CO PILNUJE TERAZ: DOKLADNIE ta sama gwarancja (ulepszenia <= 50%, budynki >= 50%),
//     wyrazona przez JEDYNY, ocalaly podzial: `MAX_PROCENT_PULI_IMPERIUM` = 50 oraz
//     `clampPodzialPracyBudynkiPercent` (>= 50% dla budynkow). Zero rozluznienia —
//     scenariusz 2 sprawdza dodatkowo, ze KAZDE zadanie > 50% dla ulepszen jest scinane.
// UWAGA (zmiana wartosci domyslnej, jawnie): domyslny udzial ulepszen to teraz 30%
//   (dopelnienie DEFAULT_PODZIAL_PRACY.procentBudynki = 70), a nie 33% — 33% bylo
//   domyslna wartoscia USUNIETEGO drugiego suwaka. Realnie gracz dostaje wiecej niz
//   przedtem, bo przedtem te 33% z drugiego podzialu dawalo 0 Pracy na ulepszenia.

// 1. MAX_PROCENT_PULI_IMPERIUM stała (cap ulepszeń)
console.log('1. MAX_PROCENT_PULI_IMPERIUM = 50 (pin literalny, jedyny cap ulepszeń)');
{
  eq(MAX_PROCENT_PULI_IMPERIUM, 50, 'MAX_PROCENT_PULI_IMPERIUM na 50');
}

// 2. Jedyny podział — udział ulepszeń zawsze w 0-50, budynki zawsze w 50-100
console.log('2. Jedyny podział Pracy — ulepszenia 0-50%, budynki 50-100%, suma zawsze 100%');
{
  eq(procentPuliImperiumZBudynkow(undefined), 100 - DEFAULT_PODZIAL_PRACY.procentBudynki, 'undefined -> domyslny % (30)');
  eq(procentPuliImperiumZBudynkow(null), 100 - DEFAULT_PODZIAL_PRACY.procentBudynki, 'null -> domyslny %');
  eq(procentPuliImperiumZBudynkow(NaN), 100 - DEFAULT_PODZIAL_PRACY.procentBudynki, 'NaN -> domyslny %');
  eq(procentPuliImperiumZBudynkow(100), 0, 'budynki 100 -> ulepszenia 0 (dolny kraniec)');
  eq(procentPuliImperiumZBudynkow(75), 25, 'budynki 75 -> ulepszenia 25 (wewnątrz zakresu)');
  eq(procentPuliImperiumZBudynkow(50), 50, 'budynki 50 -> ulepszenia 50 (górny limit)');
  // Zadanie > 50% dla ulepszen jest NIEOSIAGALNE — ani suwakiem, ani zapisem.
  eq(procentPuliImperiumZBudynkow(25), 50, 'budynki 25 (nielegalne) -> ulepszenia scięte do 50');
  eq(procentPuliImperiumZBudynkow(0), 50, 'budynki 0 (nielegalne) -> ulepszenia scięte do 50');
  eq(procentPuliImperiumZBudynkow(-5), 50, 'budynki -5 (nielegalne) -> ulepszenia scięte do 50');
  eq(podzialPracyZProcentuPuli(75).procentBudynki, 50, 'żądanie 75% ulepszeń -> budynki 50 (cap)');
  eq(podzialPracyZProcentuPuli(100).procentBudynki, 50, 'żądanie 100% ulepszeń -> budynki 50 (cap)');
  eq(podzialPracyZProcentuPuli(150).procentBudynki, 50, 'żądanie 150% ulepszeń -> budynki 50 (cap)');
  eq(podzialPracyZProcentuPuli(-5).procentBudynki, 100, 'żądanie -5% ulepszeń -> budynki 100');
  // Suma zawsze 100% — brak stanu „100 i 50".
  for (const pctB of [50, 60, 70, 80, 90, 100]) {
    eq(clampPodzialPracyBudynkiPercent(pctB) + procentPuliImperiumZBudynkow(pctB), 100,
      `suma budynki+ulepszenia = 100% dla ${pctB}%`);
  }
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
//    (aktualizacja R-PRACA-JEDEN-PODZIAL-Q1: pole (a) to teraz jedyny podział Pracy;
//     rozdzielność obu pól — sedno P-PRACA-ULEPSZENIA-RECZNY-CAP-BUG-Q1 — bez zmian)
console.log('4. Kontrast: jedyny podział Pracy (a, cap 50) vs clampUlepszeniaPracaPercent (b, 100)');
{
  const testVal = 75;
  const resultA = procentPuliImperiumZBudynkow(100 - testVal);
  const resultB = clampUlepszeniaPracaPercent(testVal);
  eq(resultA, 50, `pole (a) jedyny podział: żądanie ${testVal}% ulepszeń -> 50 (cap, bez zmian)`);
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
