'use strict';
/**
 * praca-miasto-limit-50-cap-test.cjs — P-PRACA-ULEPSZENIA-RECZNY-CAP-BUG-Q1.
 *
 * Naprawia regresję z R-PRACA-SUWAKI-DUPLIKAT-I-CAP-MIASTO-Q1 (Wątek C = A, ECHO
 * właściciela 2026-08-21, `docs/decyzje/R-PRACA-SUWAKI-DUPLIKAT-I-CAP-MIASTO-Q1.md`), która
 * OMYŁKOWO nałożyła nadrzędny cap cywilizacji `MAX_PRACA_WSPOLNY_WOREK_PROCENT` (50%) TAKŻE
 * na niezależne pole (b) — historyczny budżet automatu ulepszeń per-miasto/imperium
 * (`ulepszeniaEmpireByOwner.pracaAutoPercent` / `city.ulepszeniaPracaPercent`, kontrolka #3 z
 * reconu 01-operator.md, suwak „Automatyzacja ulepszeń terenu → Ręczny"). To pole NIE dzieli
 * clampu z polem (a) `EmpirePracaSplit.procentUlepszenia` (suwak #1/#2,
 * `clampPracaWspolnyWorekPercent`) — od tego tematu ma znów własny zakres 0–100%
 * (`MAX_ULEPSZENIA_PRACA_AUTO_PERCENT`).
 *
 * `praca-limit-50-test.cjs` (scenariusze 3–9, zaktualizowany w tej samej rundzie) pilnuje tego
 * samego zachowania z perspektywy "dawna decyzja się zmieniła"; ten plik pilnuje go z
 * perspektywy "pełne pokrycie ścieżki per-city automat + empire automat + granice + save/load"
 * dla pola (b), żeby żaden przyszły refaktor nie mógł po cichu z powrotem złączyć clampu (b)
 * z clampem (a).
 *
 * Run from gra/:  node tools/praca-miasto-limit-50-cap-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[praca-miasto-limit-50-cap-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = process.env.UPP_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const ENTRY_FILE = path.resolve(__dirname, '.praca-miasto-limit-50-cap-test-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.praca-miasto-limit-50-cap-test-bundle.cjs');

const ENTRY_TS = `
export {
  clampUlepszeniaPracaPercent,
  MAX_ULEPSZENIA_PRACA_AUTO_PERCENT,
  MAX_PRACA_WSPOLNY_WOREK_PROCENT,
  clampPracaWspolnyWorekPercent,
  resolveEffectiveUlepszenia,
  resolveUlepszeniaPracaPercentFromRaw,
  freshUlepszeniaEmpirePolicy,
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
  console.error('[praca-miasto-limit-50-cap-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const {
  clampUlepszeniaPracaPercent,
  MAX_ULEPSZENIA_PRACA_AUTO_PERCENT,
  MAX_PRACA_WSPOLNY_WOREK_PROCENT,
  clampPracaWspolnyWorekPercent,
  resolveEffectiveUlepszenia,
  resolveUlepszeniaPracaPercentFromRaw,
  freshUlepszeniaEmpirePolicy,
  ensureCitySaveDefaults,
} = require(BUNDLE_FILE);

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error('  FAIL:', msg); }
}
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

function freshCity(overrides) {
  return {
    id: 'city-1',
    q: 0,
    r: 0,
    ownerId: 0,
    ludnosc: 1,
    fokus: 'zrownowazone',
    ...overrides,
  };
}

console.log('1. Cap NIEwspółdzielony: pole (b) ma własny zakres 0-100%, pole (a) zostaje przy 50%');
{
  eq(MAX_PRACA_WSPOLNY_WOREK_PROCENT, 50, 'stała capu pola (a) = 50 — bez zmian');
  eq(MAX_ULEPSZENIA_PRACA_AUTO_PERCENT, 100, 'stała capu pola (b) = 100 (naprawiona regresja)');
  eq(clampPracaWspolnyWorekPercent(80), MAX_PRACA_WSPOLNY_WOREK_PROCENT, 'suwak #1/#2 (a) nadal ścina 80 do 50');
  eq(clampUlepszeniaPracaPercent(80), 80, 'automat (b, kontrolka #3) NIE ścina 80 — wewnątrz 0-100%');
}

console.log('2. clampUlepszeniaPracaPercent (pole b) — pełny zakres graniczny 0..150');
{
  eq(clampUlepszeniaPracaPercent(-10), 0, '-10 -> 0');
  eq(clampUlepszeniaPracaPercent(0), 0, '0 -> 0');
  eq(clampUlepszeniaPracaPercent(1), 1, '1 -> 1 (wewnątrz)');
  eq(clampUlepszeniaPracaPercent(49), 49, '49 -> 49 (wewnątrz)');
  eq(clampUlepszeniaPracaPercent(50), 50, '50 -> 50 (dawny cap, teraz zwykła wartość wewnątrz)');
  eq(clampUlepszeniaPracaPercent(51), 51, '51 -> 51 (powyżej dawnego capu — już nieścinane)');
  eq(clampUlepszeniaPracaPercent(70), 70, '70 -> 70 (zrzut ekranu właściciela: miasto 70/30 — dozwolone)');
  eq(clampUlepszeniaPracaPercent(99), 99, '99 -> 99 (wewnątrz)');
  eq(clampUlepszeniaPracaPercent(100), 100, '100 -> 100 (na nowym capie)');
  eq(clampUlepszeniaPracaPercent(101), 100, '101 -> 100 (jeden punkt powyżej nowego capu — ścięte)');
  eq(clampUlepszeniaPracaPercent(150), 100, '150 -> 100');
}

console.log('3. Miasto w trybie „Indywidualne" (override) — pełny zakres 0-100%, bez ścinania do 50');
{
  const empire = { ...freshUlepszeniaEmpirePolicy(), pracaAutoPercent: 33 };
  for (const raw of [0, 10, 49, 50, 51, 60, 70, 80, 99, 100]) {
    const city = freshCity({
      ulepszeniaOverride: true,
      ulepszeniaFocus: 'produkcja',
      ulepszeniaTryb: 'auto',
      ulepszeniaOnlyWorked: false,
      ulepszeniaPracaPercent: raw,
    });
    const effective = resolveEffectiveUlepszenia(city, empire);
    eq(effective.pracaAutoPercent, raw,
      `override miasta ${raw}% -> efektywne ${raw}% (bez ścinania, cap pola (b) = 100%)`);
    eq(effective.override, true, `override miasta ${raw}%: flaga override zachowana`);
  }
  const cityAbove = freshCity({ ulepszeniaOverride: true, ulepszeniaPracaPercent: 150 });
  eq(resolveEffectiveUlepszenia(cityAbove, empire).pracaAutoPercent, 100,
    'override miasta 150% (poza zakresem) -> ścięte do 100%, nie do 50%');
}

console.log('4. Miasto BEZ override dziedziczy politykę imperium — polityka imperium ma teraz cap 100%');
{
  const empireOver = { ...freshUlepszeniaEmpirePolicy(), pracaAutoPercent: clampUlepszeniaPracaPercent(90) };
  eq(empireOver.pracaAutoPercent, 90, 'polityka imperium 90% NIE jest ścinana (wewnątrz 0-100%)');
  const city = freshCity({ ulepszeniaOverride: false });
  const effective = resolveEffectiveUlepszenia(city, empireOver);
  eq(effective.pracaAutoPercent, 90, 'miasto bez override dziedziczy 90% imperium bez ścinania');
  eq(effective.override, false, 'flaga override = false zachowana');

  const empireOverCap = { ...freshUlepszeniaEmpirePolicy(), pracaAutoPercent: clampUlepszeniaPracaPercent(150) };
  eq(empireOverCap.pracaAutoPercent, 100, 'polityka imperium 150% (poza zakresem) -> ścięta do 100%');
}

console.log('5. Zrzuty ekranu właściciela: 70/30 i 30/70 — pole (b) dopuszcza obie strony bez ścinania');
{
  const empire = { ...freshUlepszeniaEmpirePolicy(), pracaAutoPercent: 33 };
  const city70 = freshCity({ ulepszeniaOverride: true, ulepszeniaPracaPercent: 70 });
  eq(resolveEffectiveUlepszenia(city70, empire).pracaAutoPercent, 70,
    'miasto 70% ulepszeń -> bez zmian (dawny błąd ścinał to do 50%)');
  const city30 = freshCity({ ulepszeniaOverride: true, ulepszeniaPracaPercent: 30 });
  eq(resolveEffectiveUlepszenia(city30, empire).pracaAutoPercent, 30, 'miasto 30% ulepszeń (wewnątrz) -> bez zmian');
}

console.log('6. Migracja save/load — override miasta >50% z zapisu NIE jest już ścinany do 50% (tylko do 100%)');
{
  const savedOverOldCap = freshCity({ ulepszeniaOverride: true, ulepszeniaPracaPercent: 80 });
  ensureCitySaveDefaults(savedOverOldCap);
  eq(savedOverOldCap.ulepszeniaPracaPercent, 80, 'ensureCitySaveDefaults: zapis z 80% -> bez zmian (naprawiona regresja)');

  const savedAt100 = freshCity({ ulepszeniaOverride: true, ulepszeniaPracaPercent: 100 });
  ensureCitySaveDefaults(savedAt100);
  eq(savedAt100.ulepszeniaPracaPercent, 100, 'ensureCitySaveDefaults: zapis dokładnie na nowym capie (100%) -> bez zmian');

  const savedAboveNewCap = freshCity({ ulepszeniaOverride: true, ulepszeniaPracaPercent: 150 });
  ensureCitySaveDefaults(savedAboveNewCap);
  eq(savedAboveNewCap.ulepszeniaPracaPercent, 100, 'ensureCitySaveDefaults: zapis 150% -> ścięty do 100%');

  const savedUnderCap = freshCity({ ulepszeniaOverride: true, ulepszeniaPracaPercent: 20 });
  ensureCitySaveDefaults(savedUnderCap);
  eq(savedUnderCap.ulepszeniaPracaPercent, 20, 'ensureCitySaveDefaults: zapis pod capem -> bez zmian');

  // Bardzo stary zapis: tylko legacy `ulepszeniaPerTurn=3` (=100% wg migracji), bez nowego pola.
  const savedLegacy = freshCity({ ulepszeniaOverride: true, ulepszeniaPerTurn: 3 });
  ensureCitySaveDefaults(savedLegacy);
  eq(savedLegacy.ulepszeniaPracaPercent, 100,
    'ensureCitySaveDefaults: legacy perTurn=3 (100% po migracji) -> zostaje 100%, nie jest ścinane do 50%');
}

console.log('7. resolveUlepszeniaPracaPercentFromRaw + clamp — kompozycja jak przy wczytaniu polityki imperium z zapisu');
{
  eq(clampUlepszeniaPracaPercent(resolveUlepszeniaPracaPercentFromRaw(90, undefined)), 90,
    'zapis imperium pracaAutoPercent=90 -> bez zmian przy wczytaniu (wewnątrz 0-100%)');
  eq(clampUlepszeniaPracaPercent(resolveUlepszeniaPracaPercentFromRaw(undefined, 3)), 100,
    'zapis imperium legacy perTurn=3 (100%) -> pozostaje 100 przy wczytaniu');
  eq(clampUlepszeniaPracaPercent(resolveUlepszeniaPracaPercentFromRaw(45, 3)), 45,
    'zapis imperium pracaAutoPercent=45 (pierwszeństwo, wewnątrz capu) -> bez zmian');
}

console.log(`\n[praca-miasto-limit-50-cap-test] ${passed} pass, ${failed} fail`);
process.exit(failed > 0 ? 1 : 0);
