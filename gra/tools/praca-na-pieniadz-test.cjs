'use strict';
/**
 * praca-na-pieniadz-test.cjs -- testy D5 (Maciej 2026-07-25, PYTANIE 76 = B):
 * Pieniadz z konwersji Pracy (Efekt 2: Targowisko+Waluta, pula-Praca x
 * targowiskoPracaMnoznik) wchodzi do PULI Daniny/Podatku (dzielonej suwakiem miasta
 * Nauka/Pieniadz/Luksus), zamiast trafiac wprost do skarbca z pominieciem suwaka.
 * Uruchom z gra/: node tools/praca-na-pieniadz-test.cjs
 *
 * Weryfikuje:
 *   1. Miasto z Targowiskiem+Waluta (bez Mennicy), suwak 20/60/20 (domyslne wartosci
 *      po decyzji 74=A): pieniadzZPracy rozklada sie w tych proporcjach (nie w 100%
 *      do skarbca).
 *   2. Mnoznik Waluty/Mennicy NIE mnozy pieniadzZPracy -- to samo miasto z Mennica i
 *      bez Mennicy ma identyczna wartosc pola pieniadzZPracy.
 *   3. Suma trzech strumieni po podziale (Nauka+Pieniadz+Luksus) = pula
 *      (handelNetto + pieniadzZPracy) -- nic nie ginie, nic sie nie dubluje.
 */

const fs   = require('fs');
const path = require('path');

// --- esbuild ---------------------------------------------------------------
const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[praca-na-pieniadz-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA_ROOT     = path.resolve(__dirname, '..');
const ENTRY_FILE   = path.resolve(__dirname, '.praca-na-pieniadz-entry.ts');
const BUNDLE_FILE  = path.resolve(__dirname, '.praca-na-pieniadz-bundle.cjs');

const ENTRY_TS = [
  `export { loadEconParams, cityYieldPerTurn } from '../src/game/economy';`,
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
  console.error('[praca-na-pieniadz-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE_FILE);
const { loadEconParams, cityYieldPerTurn, TerenBazowy, Nakladka } = M;

// --- tiny assertion framework ----------------------------------------------
let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; process.stdout.write('  PASS: ' + msg + '\n'); }
  else { failed++; process.stderr.write('  FAIL: ' + msg + '\n'); }
}
function eq(a, b, msg) {
  assert(a === b, msg + ' (got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b) + ')');
}

// ---------------------------------------------------------------------------
// Real econ-params.json + loader (normal) -- suwak 20/60/20 (decyzja 74=A) czytany
// z JSON, NIE hardkodowany tutaj.
// ---------------------------------------------------------------------------
const rawEconParams = JSON.parse(fs.readFileSync(path.resolve(GRA_ROOT, 'data', 'econ-params.json'), 'utf8'));
const params = loadEconParams(rawEconParams, 'normal');

// Fixture: 10x Laka (Zywnosc 3 / Praca 1 / Handel 1 kazda) -> pracaTerenu=10,
// handelTerenu=10. Liczby dobrane tak, zeby podzial suwakiem 20/60/20 wychodzil
// bez utraty na floor() (pula = 35, 42.5 -- patrz test 3).
const workedTiles = Array.from({ length: 10 }, () => ({
  terenBazowy: TerenBazowy.Laka,
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
  podziałHandlu: { procentNauka: 20, procentPieniadz: 60, procentLuksus: 20 }, // decyzja 74=A
  podziałPracy:  { procentBudynki: 0 }, // 100% Pracy netto -> pula (doPuli), zeby pieniadzZPracy byl czytelny
};

function ctxFor(maMennica) {
  return {
    wojskoZuzycieZywnosci: 0,
    strataFraction: 0, // D5 jest niezalezny od korupcji -- izolujemy zmienna
    maMlyn: false, maCegielnia: false,
    maTargowisko: true,       // Efekt 2 wymaga Targowiska...
    maBiblioteka: false, maAkademia: false,
    maMennica,
    walutaOdkryta: true,      // ...i odkrytej Waluty (walutaOdkrytaOnly)
    civHandelMult: 1, civNaukaMult: 1,
  };
}

// ============================================================================
// TEST 1: bez Mennicy -- pieniadzZPracy rozklada sie 20/60/20, NIE w 100% do skarbca
// handelTerenu=10 -> handelBrutto (Targowisko +50%) = 15; strata=0, mnoznik=1 (brak
// Mennicy) -> handelNetto=15. pracaNetto=10, doPuli=10 (procentBudynki=0),
// pieniadzZPracy = 10 * targowiskoPracaMnoznik(2) = 20. Pula = 15+20 = 35.
// Podzial 20/60/20 na 35: Nauka=7, Pieniadz=21, Luksus=7.
// ============================================================================
console.log('\n--- T1: bez Mennicy -- pula 35 dzielona 20/60/20 ---');
{
  const yld = cityYieldPerTurn(baseCity, workedTiles, [], params, ctxFor(false));
  eq(yld.pieniadzZPracy, 20, 'pieniadzZPracy = doPuli(10) x targowiskoPracaMnoznik(2) = 20 (pole nadal raportowane)');
  eq(yld.handelBrutto, 15, 'handelBrutto (Targowisko +50% na handelTerenu=10) = 15');
  eq(yld.nauka, 7, 'Nauka = floor(35 x 0.20) = 7 (D5: pula zawiera pieniadzZPracy)');
  eq(yld.pieniadz, 21, 'Pieniadz = floor(35 x 0.60) = 21 (NIE 9+20=29 jak przed D5 -- patrz raport)');
  eq(yld.luksus, 7, 'Luksus = floor(35 x 0.20) = 7');
  assert(yld.pieniadz < 29, 'Pieniadz NIE trafia juz w 100% do skarbca (przed D5 byloby 9+20=29)');
}

// ============================================================================
// TEST 2: Mennica NIE mnozy pieniadzZPracy -- ta sama wartosc z i bez Mennicy.
// Z Mennica: walutaActive=true -> handelNetto = 15 x mennicaMnoznikPoWalucie(1.5) = 22.5.
// pieniadzZPracy zostaje 20 (liczony z doPuli, NIEZALEZNIE od walutaMnoznikAktywny).
// ============================================================================
console.log('\n--- T2: Mennica NIE mnozy strumienia z konwersji Pracy ---');
{
  const bezMennicy = cityYieldPerTurn(baseCity, workedTiles, [], params, ctxFor(false));
  const zMennica    = cityYieldPerTurn(baseCity, workedTiles, [], params, ctxFor(true));
  eq(bezMennicy.pieniadzZPracy, zMennica.pieniadzZPracy, 'pieniadzZPracy identyczny z i bez Mennicy (mnoznik jej NIE dotyczy)');
  eq(zMennica.pieniadzZPracy, 20, 'pieniadzZPracy z Mennica dalej = 20 (nie 20 x 1.5 = 30)');
  assert(zMennica.pieniadz > bezMennicy.pieniadz, 'Skarbiec z Mennica wyzszy (mnoznik dziala na handelNetto z terenu/budynkow, nie na pieniadzZPracy)');
}

// ============================================================================
// TEST 3: Suma trzech strumieni po podziale = pula (handelNetto + pieniadzZPracy).
// Uzywamy fixture bez Mennicy, gdzie pula=35 dzieli sie bez utraty na floor().
// ============================================================================
console.log('\n--- T3: suma strumieni po podziale = pula (nic nie ginie/dubluje) ---');
{
  const yld = cityYieldPerTurn(baseCity, workedTiles, [], params, ctxFor(false));
  const pula = 15 + yld.pieniadzZPracy; // handelNetto(15, liczone wyzej) + pieniadzZPracy
  const suma = yld.nauka + yld.pieniadz + yld.luksus;
  eq(pula, 35, 'pula (handelNetto=15 + pieniadzZPracy=20) = 35');
  eq(suma, 35, 'Nauka(7) + Pieniadz(21) + Luksus(7) = 35 = pula, dokladnie (podzial 20/60/20 bez reszty)');
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
