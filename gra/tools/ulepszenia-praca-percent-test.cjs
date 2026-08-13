'use strict';
/**
 * ulepszenia-praca-percent-test.cjs — R-AUTO-PRACA-BUDZET-PROCENT-Q1=B (2026-08-14).
 * Migracja starego `ulepszeniaPerTurn`/`perTurn` (1|2|3 sztuk) → nowy `%` budżetu Pracy
 * (game/cities.ts). NIE testuje picker (auto-improvements.ts) — to auto-improvements-test.cjs.
 * Run from gra/:  node tools/ulepszenia-praca-percent-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[ulepszenia-praca-percent-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = process.env.UPP_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const ENTRY_FILE = path.resolve(__dirname, '.ulepszenia-praca-percent-test-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.ulepszenia-praca-percent-test-bundle.cjs');

const ENTRY_TS = `
export {
  clampUlepszeniaPracaPercent,
  migrateUlepszeniaPerTurnToPercent,
  resolveUlepszeniaPracaPercentFromRaw,
  DEFAULT_ULEPSZENIA_PRACA_PERCENT,
  freshUlepszeniaEmpirePolicy,
  resolveEffectiveUlepszenia,
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
  console.error('[ulepszenia-praca-percent-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const {
  clampUlepszeniaPracaPercent,
  migrateUlepszeniaPerTurnToPercent,
  resolveUlepszeniaPracaPercentFromRaw,
  DEFAULT_ULEPSZENIA_PRACA_PERCENT,
  freshUlepszeniaEmpirePolicy,
  resolveEffectiveUlepszenia,
  ensureCitySaveDefaults,
} = require(BUNDLE_FILE);

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error('  FAIL:', msg); }
}
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

// Miasto minimalne — tylko pola, które ensureCitySaveDefaults/resolveEffectiveUlepszenia realnie
// czytają w tej ścieżce; reszta (podzialPracy itd.) jest dopisywana przez ensureCitySaveDefaults
// samo (to jego zadanie — migracja pełnego zapisu), więc nie musimy jej symulować tu.
function makeRawCity(extra) {
  return { id: 'city1', ownerId: 0, name: 'Test', population: 3, ...extra };
}

// 1. clampUlepszeniaPracaPercent — zakres i fallback
console.log('1. clampUlepszeniaPracaPercent — zakres 0-100 i fallback');
{
  eq(clampUlepszeniaPracaPercent(undefined), DEFAULT_ULEPSZENIA_PRACA_PERCENT, 'undefined -> domyslny %');
  eq(clampUlepszeniaPracaPercent(null), DEFAULT_ULEPSZENIA_PRACA_PERCENT, 'null -> domyslny %');
  eq(clampUlepszeniaPracaPercent(NaN), DEFAULT_ULEPSZENIA_PRACA_PERCENT, 'NaN -> domyslny %');
  eq(clampUlepszeniaPracaPercent(-5), 0, '-5 -> 0 (dolny klamr)');
  eq(clampUlepszeniaPracaPercent(150), 100, '150 -> 100 (gorny klamr)');
  eq(clampUlepszeniaPracaPercent(42.6), 43, '42.6 -> 43 (zaokraglenie)');
  eq(clampUlepszeniaPracaPercent(0), 0, '0 pozostaje 0 (auto-manager wylaczony to poprawna wartosc)');
  eq(clampUlepszeniaPracaPercent(100), 100, '100 pozostaje 100');
}

// 2. migrateUlepszeniaPerTurnToPercent — mapowanie 1/2/3 -> %
console.log('2. migrateUlepszeniaPerTurnToPercent — 1->33, 2->66, 3->100');
{
  eq(migrateUlepszeniaPerTurnToPercent(1), 33, '1 sztuka -> 33%');
  eq(migrateUlepszeniaPerTurnToPercent(2), 66, '2 sztuki -> 66%');
  eq(migrateUlepszeniaPerTurnToPercent(3), 100, '3 sztuki -> 100%');
}

// 3. resolveUlepszeniaPracaPercentFromRaw — oba kształty zapisu + priorytet nowego pola
console.log('3. resolveUlepszeniaPracaPercentFromRaw — nowy/stary zapis, priorytet nowego');
{
  eq(resolveUlepszeniaPracaPercentFromRaw(70, undefined), 70, 'tylko nowe pole (70) -> 70');
  eq(resolveUlepszeniaPracaPercentFromRaw(undefined, 2), 66, 'tylko stare pole (perTurn=2) -> 66');
  eq(resolveUlepszeniaPracaPercentFromRaw(undefined, undefined), DEFAULT_ULEPSZENIA_PRACA_PERCENT, 'brak obu -> domyslny %');
  eq(resolveUlepszeniaPracaPercentFromRaw(70, 2), 70, 'oba obecne -> nowe pole wygrywa (stabilnosc pod powtorna migracja)');
  eq(resolveUlepszeniaPracaPercentFromRaw(undefined, 5), DEFAULT_ULEPSZENIA_PRACA_PERCENT, 'nieprawidlowa stara wartosc (5, spoza 1-3) -> domyslny %, bez crasha');
}

// 4. (d) migracja starego zapisu miasta: ulepszeniaPerTurn:2 (bez ulepszeniaPracaPercent) -> 66%
// bez crasha. Symuluje JSON.parse starego save'u — pole ma inny ksztalt niz typ City dzisiaj,
// dlatego rzutujemy przez podanie property wprost (JS nie sprawdza typow w runtime).
console.log('4. (d) migracja zapisu: ulepszeniaPerTurn=2 (stary) -> ulepszeniaPracaPercent=66, bez crasha');
{
  const oldSaveCity = makeRawCity({ ulepszeniaOverride: true, ulepszeniaPerTurn: 2 });
  let threw = false;
  try {
    ensureCitySaveDefaults(oldSaveCity);
  } catch (e) {
    threw = true;
    console.error('  (wyjatek):', e && e.message);
  }
  assert(!threw, 'ensureCitySaveDefaults na starym zapisie NIE rzuca wyjatku');
  eq(oldSaveCity.ulepszeniaPracaPercent, 66, 'stare ulepszeniaPerTurn=2 zmigrowane na ulepszeniaPracaPercent=66');
}

// 5. (d, idempotencja) powtorne wywolanie migracji na JUZ zmigrowanym mieście nie cofa wartosci
// do domyslnej ani nie odczytuje ponownie skasowanego pola perTurn.
console.log('5. (d) migracja jest idempotentna — powtorne wywolanie nie psuje juz-zmigrowanej wartosci');
{
  const alreadyMigrated = makeRawCity({
    ulepszeniaOverride: true,
    ulepszeniaPracaPercent: 80,
    ulepszeniaPerTurn: 2, // pole-widmo ze starego zapisu, NIE powinno juz byc czytane
  });
  ensureCitySaveDefaults(alreadyMigrated);
  eq(alreadyMigrated.ulepszeniaPracaPercent, 80, '1. wywolanie: nowe pole (80) ma pierwszenstwo nad widmo-polem perTurn=2');
  ensureCitySaveDefaults(alreadyMigrated);
  eq(alreadyMigrated.ulepszeniaPracaPercent, 80, '2. wywolanie (idempotencja): wartosc nadal 80, nie przeskoczyla na 66');
}

// 6. (d) miasto BEZ override — ensureCitySaveDefaults nie dotyka pola % (jak przed migracja: tylko
// override=true dostaje wlasne ustawienia; miasta dziedziczace polityke panstwa nie potrzebuja
// wlasnego pola i nie powinny go dostac "przy okazji").
console.log('6. miasto bez override — brak ulepszeniaPracaPercent po migracji (dziedziczy polityke panstwa)');
{
  const noOverrideCity = makeRawCity({ ulepszeniaOverride: false });
  ensureCitySaveDefaults(noOverrideCity);
  eq(noOverrideCity.ulepszeniaPracaPercent, undefined, 'brak override -> pole % pozostaje undefined (efektywna wartosc idzie z polityki panstwa)');
}

// 7. resolveEffectiveUlepszenia — miasto bez override dziedziczy % panstwa; z override — wlasny %
console.log('7. resolveEffectiveUlepszenia — dziedziczenie panstwa vs override miasta');
{
  const empire = freshUlepszeniaEmpirePolicy();
  eq(empire.pracaAutoPercent, DEFAULT_ULEPSZENIA_PRACA_PERCENT, 'swieza polityka panstwa: domyslny %');

  const inheritCity = makeRawCity({ ulepszeniaOverride: false });
  const effInherit = resolveEffectiveUlepszenia(inheritCity, empire);
  eq(effInherit.pracaAutoPercent, empire.pracaAutoPercent, 'miasto bez override -> efektywny % = % panstwa');
  eq(effInherit.override, false, 'override=false zgloszone poprawnie');

  const overrideCity = makeRawCity({ ulepszeniaOverride: true, ulepszeniaPracaPercent: 12 });
  const effOverride = resolveEffectiveUlepszenia(overrideCity, empire);
  eq(effOverride.pracaAutoPercent, 12, 'miasto z override -> efektywny % = wlasny (12), NIE panstwa');
  eq(effOverride.override, true, 'override=true zgloszone poprawnie');
}

console.log(`\nulepszenia-praca-percent-test: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
