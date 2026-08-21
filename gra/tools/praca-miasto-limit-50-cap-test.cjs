'use strict';
/**
 * praca-miasto-limit-50-cap-test.cjs — R-PRACA-SUWAKI-DUPLIKAT-I-CAP-MIASTO-Q1 (Wątek C) = A,
 * ECHO właściciela 2026-08-21 (`docs/decyzje/R-PRACA-SUWAKI-DUPLIKAT-I-CAP-MIASTO-Q1.md`).
 *
 * Analogiczny do `gra/tools/praca-limit-50-test.cjs`, ale skupiony WYŁĄCZNIE na ścieżce
 * "historyczny automat" per-miasto (kontrolka #3 z reconu 01-operator.md: miasto w trybie
 * „Indywidualne" / `ulepszeniaEmpireByOwner.pracaAutoPercent` / `city.ulepszeniaPracaPercent`).
 * Dokumentuje, że ta kontrolka NIE MOŻE już pozwolić miastu (ani globalnemu automatowi
 * imperium) ustawić więcej niż `MAX_PRACA_WSPOLNY_WOREK_PROCENT` (dziś 50%) na ulepszenia —
 * ten sam cap, jaki obowiązuje suwak #1/#2 (`clampPracaWspolnyWorekPercent`).
 *
 * `praca-limit-50-test.cjs` (istniejący, zaktualizowany w tej samej rundzie) pilnuje tego
 * samego zachowania z perspektywy "dawna decyzja się zmieniła" (kontrast starych/nowych
 * wartości granicznych); ten plik jest nowy i pilnuje go z perspektywy "pełne pokrycie ścieżki
 * per-city automat + empire automat + granice + save/load", żeby żaden przyszły refaktor nie
 * mógł po cichu przywrócić 0–100% w jednym miejscu, a zapomnieć o drugim.
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

console.log('1. Cap współdzielony: MAX_PRACA_WSPOLNY_WOREK_PROCENT jest tym samym górnym limitem dla obu kontrolek');
{
  eq(MAX_PRACA_WSPOLNY_WOREK_PROCENT, 50, 'stała capu = 50');
  eq(clampPracaWspolnyWorekPercent(80), MAX_PRACA_WSPOLNY_WOREK_PROCENT, 'suwak #1/#2 ścina 80 do capu');
  eq(clampUlepszeniaPracaPercent(80), MAX_PRACA_WSPOLNY_WOREK_PROCENT, 'automat (kontrolka #3) ścina 80 do TEGO SAMEGO capu');
}

console.log('2. clampUlepszeniaPracaPercent — pełny zakres graniczny 0..150');
{
  eq(clampUlepszeniaPracaPercent(-10), 0, '-10 -> 0');
  eq(clampUlepszeniaPracaPercent(0), 0, '0 -> 0');
  eq(clampUlepszeniaPracaPercent(1), 1, '1 -> 1 (wewnątrz)');
  eq(clampUlepszeniaPracaPercent(49), 49, '49 -> 49 (wewnątrz)');
  eq(clampUlepszeniaPracaPercent(50), 50, '50 -> 50 (dokładnie na capie)');
  eq(clampUlepszeniaPracaPercent(51), 50, '51 -> 50 (jeden punkt powyżej capu — ścięte)');
  eq(clampUlepszeniaPracaPercent(70), 50, '70 -> 50 (zrzut ekranu właściciela: miasto 70/30)');
  eq(clampUlepszeniaPracaPercent(100), 50, '100 -> 50');
  eq(clampUlepszeniaPracaPercent(150), 50, '150 -> 50');
}

console.log('3. Miasto w trybie „Indywidualne" (override) NIE może przekroczyć capu — pełny zakres wartości');
{
  const empire = { ...freshUlepszeniaEmpirePolicy(), pracaAutoPercent: 33 };
  for (const raw of [0, 10, 49, 50, 51, 60, 70, 80, 99, 100, 150]) {
    const city = freshCity({
      ulepszeniaOverride: true,
      ulepszeniaFocus: 'produkcja',
      ulepszeniaTryb: 'auto',
      ulepszeniaOnlyWorked: false,
      ulepszeniaPracaPercent: raw,
    });
    const effective = resolveEffectiveUlepszenia(city, empire);
    const expected = Math.min(raw, MAX_PRACA_WSPOLNY_WOREK_PROCENT);
    eq(effective.pracaAutoPercent, expected,
      `override miasta ${raw}% -> efektywne ${expected}% (cap ${MAX_PRACA_WSPOLNY_WOREK_PROCENT}%)`);
    eq(effective.override, true, `override miasta ${raw}%: flaga override zachowana`);
  }
}

console.log('4. Miasto BEZ override dziedziczy politykę imperium — polityka imperium też ma teraz cap');
{
  const empireOver = { ...freshUlepszeniaEmpirePolicy(), pracaAutoPercent: clampUlepszeniaPracaPercent(90) };
  eq(empireOver.pracaAutoPercent, 50, 'polityka imperium ustawiana przez clampUlepszeniaPracaPercent też ścięta do 50');
  const city = freshCity({ ulepszeniaOverride: false });
  const effective = resolveEffectiveUlepszenia(city, empireOver);
  eq(effective.pracaAutoPercent, 50, 'miasto bez override dziedziczy ścięte 50% imperium');
  eq(effective.override, false, 'flaga override = false zachowana');
}

console.log('5. Zrzuty ekranu właściciela: 70/30 i 30/70 — obie strony >50% ulepszeń zostają ścięte do 50');
{
  const empire = { ...freshUlepszeniaEmpirePolicy(), pracaAutoPercent: 33 };
  const city70 = freshCity({ ulepszeniaOverride: true, ulepszeniaPracaPercent: 70 });
  eq(resolveEffectiveUlepszenia(city70, empire).pracaAutoPercent, 50, 'miasto 70% ulepszeń -> ścięte do 50%');
  // "30%/70%" z opisu właściciela to 30% ulepszeń / 70% budynków — to WEWNĄTRZ capu, bez zmian.
  const city30 = freshCity({ ulepszeniaOverride: true, ulepszeniaPracaPercent: 30 });
  eq(resolveEffectiveUlepszenia(city30, empire).pracaAutoPercent, 30, 'miasto 30% ulepszeń (wewnątrz capu) -> bez zmian');
}

console.log('6. Migracja save/load — override miasta >50% z zapisu sprzed tej decyzji zostaje ścięty przy wczytaniu');
{
  const savedOverCap = freshCity({ ulepszeniaOverride: true, ulepszeniaPracaPercent: 80 });
  ensureCitySaveDefaults(savedOverCap);
  eq(savedOverCap.ulepszeniaPracaPercent, 50, 'ensureCitySaveDefaults: zapis z 80% -> ścięty do 50% przy migracji');

  const savedAtCap = freshCity({ ulepszeniaOverride: true, ulepszeniaPracaPercent: 50 });
  ensureCitySaveDefaults(savedAtCap);
  eq(savedAtCap.ulepszeniaPracaPercent, 50, 'ensureCitySaveDefaults: zapis dokładnie na capie -> bez zmian');

  const savedUnderCap = freshCity({ ulepszeniaOverride: true, ulepszeniaPracaPercent: 20 });
  ensureCitySaveDefaults(savedUnderCap);
  eq(savedUnderCap.ulepszeniaPracaPercent, 20, 'ensureCitySaveDefaults: zapis pod capem -> bez zmian');

  // Bardzo stary zapis: tylko legacy `ulepszeniaPerTurn=3` (=100% wg migracji), bez nowego pola.
  const savedLegacy = freshCity({ ulepszeniaOverride: true, ulepszeniaPerTurn: 3 });
  ensureCitySaveDefaults(savedLegacy);
  eq(savedLegacy.ulepszeniaPracaPercent, 50,
    'ensureCitySaveDefaults: legacy perTurn=3 (100% po migracji) -> ścięty do 50% (Wątek C = A)');
}

console.log('7. resolveUlepszeniaPracaPercentFromRaw + clamp — kompozycja jak przy wczytaniu polityki imperium z zapisu');
{
  eq(clampUlepszeniaPracaPercent(resolveUlepszeniaPracaPercentFromRaw(90, undefined)), 50,
    'zapis imperium pracaAutoPercent=90 -> ścięty do 50 przy wczytaniu');
  eq(clampUlepszeniaPracaPercent(resolveUlepszeniaPracaPercentFromRaw(undefined, 3)), 50,
    'zapis imperium legacy perTurn=3 (100%) -> ścięty do 50 przy wczytaniu');
  eq(clampUlepszeniaPracaPercent(resolveUlepszeniaPracaPercentFromRaw(45, 3)), 45,
    'zapis imperium pracaAutoPercent=45 (pierwszeństwo, wewnątrz capu) -> bez zmian');
}

console.log(`\n[praca-miasto-limit-50-cap-test] ${passed} pass, ${failed} fail`);
process.exit(failed > 0 ? 1 : 0);
