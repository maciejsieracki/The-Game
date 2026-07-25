'use strict';
/**
 * korupcja-test.cjs -- testy mechanizmu korupcji (Spec-ekonomia.md, corruptionRate +
 * corruptionBuildingReduction, economy.ts) oraz jego wpiecia w cityYieldPerTurn.
 * Uruchom z gra/: node tools/korupcja-test.cjs
 *
 * Kontekst (Maciej 2026-07-25):
 *   - D1: korupcja obciąża WYŁĄCZNIE Daninę/Podatek (handelNetto), Praca NIETKNIĘTA.
 *   - D2: corruptionRate(dystansOdStolicy, liczbaWszystkichMiast, params) wpięte w
 *     turn-economy.ts (advanceCityEconomy + previewCityEconomy), zamiast strataFraction:0.
 *   - D3: econ-params.json ma zmniejszone współczynniki (0,5 / 1 / 1,5 dystans;
 *     0,5 / 0,5 / 1 miasta; cap 38/50/62%), loader musi je czytać jako ułamki.
 *   - D4: Sąd, Pretorium, Pałac redukują korupcję ADDYTYWNIE po 30 punktów procentowych
 *     każdy, TYLKO w mieście gdzie stoją; sufit sumy redukcji 0,60 (jawny Math.min).
 *
 * Weryfikuje:
 *   1. Stolica (dystans 0), imperium 1-miastowe, normal: strata = 0,5% Daniny
 *   2. Miasto 8 pól od stolicy, imperium 5 miast, normal: strata = 10,5% Daniny
 *   3. Praca jest NIETKNIĘTA przez korupcję (D1) -- integracja przez cityYieldPerTurn
 *   4. Sąd (redukcja 30pp) obniża stratę z pkt 2: 10,5% x (1-0,30) = 7,35%
 *   5. Sąd + Pretorium (60pp): 10,5% x (1-0,60) = 4,2%
 *   6. Cap: przy skrajnym dystansie strata nie przekracza sufitu (normal 50%)
 *   7. Loader: korupcjaCap jest ułamkiem (nie liczbą procentową) po wczytaniu z JSON
 */

const fs   = require('fs');
const path = require('path');

// --- esbuild ---------------------------------------------------------------
const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[korupcja-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA_ROOT     = path.resolve(__dirname, '..');
const ENTRY_FILE   = path.resolve(__dirname, '.korupcja-entry.ts');
const BUNDLE_FILE  = path.resolve(__dirname, '.korupcja-bundle.cjs');

const ENTRY_TS = [
  `export { loadEconParams, corruptionRate, corruptionBuildingReduction, cityYieldPerTurn } from '../src/game/economy';`,
  `export { TerenBazowy, Nakladka } from '../src/types/hex';`,
  '',
].join('\n');
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
  });
} catch (e) {
  console.error('[korupcja-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE_FILE);
const {
  loadEconParams,
  corruptionRate,
  corruptionBuildingReduction,
  cityYieldPerTurn,
  TerenBazowy,
  Nakladka,
} = M;

// --- tiny assertion framework ----------------------------------------------
let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; process.stdout.write('  PASS: ' + msg + '\n'); }
  else { failed++; process.stderr.write('  FAIL: ' + msg + '\n'); }
}
function close(a, b, msg, eps) {
  eps = eps === undefined ? 1e-9 : eps;
  assert(Math.abs(a - b) < eps, msg + ' (got ' + a + ', want ' + b + ')');
}
function eq(a, b, msg) {
  assert(a === b, msg + ' (got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b) + ')');
}

// ---------------------------------------------------------------------------
// Real econ-params.json -- ten sam plik, ten sam loader co silnik.
// ---------------------------------------------------------------------------
const rawEconParams = JSON.parse(fs.readFileSync(path.resolve(GRA_ROOT, 'data', 'econ-params.json'), 'utf8'));
const paramsNormal = loadEconParams(rawEconParams, 'normal');

// ============================================================================
// TEST 0: Loader -- korupcjaCap jest ułamkiem po wczytaniu (D3)
// ============================================================================
console.log('\n--- T0: loader korupcjaCap jest ulamkiem (D3) ---');
{
  eq(paramsNormal.korupcjaCap, 0.5, 'normal korupcjaCap === 0.5 (JSON ma 50, loader dzieli przez 100)');
  eq(paramsNormal.korupcjaWspolczynnikDystansu, 1, 'normal wspolczynnik dystansu === 1 (JSON wartosc, brak parseInt/utraty ulamka)');
  eq(paramsNormal.korupcjaWspolczynnikMiast, 0.5, 'normal wspolczynnik miast === 0.5 (wartosc ulamkowa czytana poprawnie)');
  const paramsEasy = loadEconParams(rawEconParams, 'easy');
  eq(paramsEasy.korupcjaWspolczynnikDystansu, 0.5, 'easy wspolczynnik dystansu === 0.5 (ulamek, nie zaokraglony do 0/1)');
}

// ============================================================================
// TEST 1: Stolica (dystans 0), imperium 1-miastowe, normal: 0x1 + 1x0.5 = 0.5%
// ============================================================================
console.log('\n--- T1: stolica, imperium 1-miastowe, normal -> 0.5% ---');
{
  const strata = corruptionRate(0, 1, paramsNormal);
  close(strata, 0.005, 'stolica 1-miastowa: strata = 0.5% (0.005)');
}

// ============================================================================
// TEST 2: Miasto 8 pol od stolicy, imperium 5 miast, normal: 8x1 + 5x0.5 = 10.5%
// ============================================================================
console.log('\n--- T2: dystans 8, 5 miast, normal -> 10.5% ---');
{
  const strata = corruptionRate(8, 5, paramsNormal);
  close(strata, 0.105, 'dystans 8 / 5 miast: strata = 10.5% (0.105)');
}

// ============================================================================
// TEST 3: Praca NIETKNIETA przez korupcje (D1) -- integracja przez cityYieldPerTurn.
// 5x Rownina (Praca=2,Handel=1 kazda) -> pracaTerenu=10, handelTerenu=5.
// Suwak Handlu: 100% -> Pieniadz, zeby handelNetto bylo widoczne wprost w yld.pieniadz.
// ============================================================================
console.log('\n--- T3: Praca nietknieta korupcja, Handel/Podatek redukowany (D1) ---');
{
  const workedTiles = Array.from({ length: 5 }, () => ({
    terenBazowy: TerenBazowy.Rownina,
    nakladka:    Nakladka.Brak,
    maRzeke:     false,
  }));
  const baseCity = {
    id: 'test-city',
    ludnosc: 3,
    zdrowie: 0,
    czyStolica: false,
    maSpichlerz: false,
    maAkwedukt: false,
    magazynZywnosci: 0,
    specjalisci: [],
    kolejkaProdukcji: [],
    podziałHandlu: { procentNauka: 0, procentPieniadz: 100, procentLuksus: 0 },
    podziałPracy:  { procentBudynki: 50 },
  };
  const baseCtx = {
    wojskoZuzycieZywnosci: 0,
    maMlyn: false, maCegielnia: false, maTargowisko: false,
    maBiblioteka: false, maAkademia: false,
    maMennica: false, walutaOdkryta: false,
    civHandelMult: 1, civNaukaMult: 1,
  };

  const strata8_5miast = corruptionRate(8, 5, paramsNormal); // 0.105 (test 2)

  const yldZero   = cityYieldPerTurn(baseCity, workedTiles, [], paramsNormal, { ...baseCtx, strataFraction: 0 });
  const yldKorup  = cityYieldPerTurn(baseCity, workedTiles, [], paramsNormal, { ...baseCtx, strataFraction: strata8_5miast });

  eq(yldZero.praca, 10, 'bez korupcji: Praca = pracaBruttoLacznie (10)');
  eq(yldKorup.praca, 10, 'z korupcja 10.5%: Praca dalej = 10 (D1 -- Praca NIETKNIETA)');
  assert(yldKorup.pieniadz < yldZero.pieniadz, 'z korupcja: Pieniadz (z Daniny/Podatku) NIZSZY niz bez korupcji');
  eq(yldZero.pieniadz, 5, 'bez korupcji: Pieniadz = floor(handelNetto=5) = 5');
  eq(yldKorup.pieniadz, Math.floor(5 * (1 - strata8_5miast)), 'z korupcja: Pieniadz = floor(5 * (1 - 0.105)) = 4');
}

// ============================================================================
// TEST 4: Sad (redukcja 30pp) w miescie z pkt 2: 10.5% x (1-0.30) = 7.35%
// ============================================================================
console.log('\n--- T4: Sad redukuje strate z pkt 2 o 30pp -> 7.35% ---');
{
  const strataBazowa = corruptionRate(8, 5, paramsNormal); // 0.105
  const redukcja = corruptionBuildingReduction(['sad']);
  eq(redukcja, 0.30, 'Sad: redukcja = 0.30 (30 punktow procentowych)');
  const strataPoRedukcji = strataBazowa * (1 - redukcja);
  close(strataPoRedukcji, 0.0735, 'Sad: 10.5% x (1-0.30) = 7.35% (0.0735)');
}

// ============================================================================
// TEST 5: Sad + Pretorium (miasto regionalne): 10.5% x (1-0.60) = 4.2%
// ============================================================================
console.log('\n--- T5: Sad + Pretorium -> 60pp redukcji -> 4.2% ---');
{
  const strataBazowa = corruptionRate(8, 5, paramsNormal); // 0.105
  const redukcja = corruptionBuildingReduction(['sad', 'pretorium']);
  eq(redukcja, 0.60, 'Sad+Pretorium: redukcja = 0.60 (2x30pp)');
  const strataPoRedukcji = strataBazowa * (1 - redukcja);
  close(strataPoRedukcji, 0.042, 'Sad+Pretorium: 10.5% x (1-0.60) = 4.2% (0.042)');
}

// ============================================================================
// TEST 5b: Sufit redukcji -- Sad+Pretorium+Palac (nie powinno sie zdarzyc w danych
// dzisiejszych, bo Palac=stolica i Pretorium=region sie wykluczaja) nie przekracza 0.60
// (zabezpieczenie Math.min z D4, na wypadek zmiany danych).
// ============================================================================
console.log('\n--- T5b: sufit redukcji 0.60 (Sad+Pretorium+Palac) ---');
{
  const redukcja = corruptionBuildingReduction(['sad', 'pretorium', 'palac']);
  eq(redukcja, 0.60, 'Sad+Pretorium+Palac: redukcja zabezpieczona na 0.60, nie 0.90');
}

// ============================================================================
// TEST 6: Cap -- skrajny dystans, strata nie przekracza sufitu (normal 50%)
// ============================================================================
console.log('\n--- T6: cap normal 50% przy skrajnym dystansie ---');
{
  const strata = corruptionRate(1000, 1000, paramsNormal);
  close(strata, 0.5, 'skrajny dystans/liczba miast: strata capowana na 50% (0.5)');
  eq(paramsNormal.korupcjaCap, 0.5, 'cap uzyty przez corruptionRate zgadza sie z paramsNormal.korupcjaCap');
}

// ============================================================================
// WYNIK
// ============================================================================
console.log('\n========================================');
console.log('PASSED:', passed, '/ FAILED:', failed, '/ TOTAL:', passed + failed);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('ALL GREEN');
}
