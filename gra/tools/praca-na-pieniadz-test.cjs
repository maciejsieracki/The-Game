'use strict';
/**
 * praca-na-pieniadz-test.cjs -- testy D5 POPRAWIONE (Maciej 2026-07-25, PYTANIE 76=B,
 * korekta tego samego dnia). Cytat wlasciciela: "Pieniądz z konwersji pracy wchodzi
 * do daniny, później do podatku i jest potem mnożony przez walutę i mennicę i
 * wszystkie inne wskaźniki handlu... zamieniamy to na równowartość podatku."
 *
 * Sens: pieniadzZPracy (Efekt 2: Targowisko+Waluta, pula-Praca x targowiskoPracaMnoznik)
 * NIE jest osobnym strumieniem doklejanym po fakcie do gotowej puli Daniny -- wchodzi
 * do Daniny/Handlu U ZRODLA (do handelBrutto, PRZED Targowiskiem), wiec przechodzi
 * przez WSZYSTKIE mnozniki Handlu na tych samych prawach co Danina z terenu:
 * Targowisko, civHandelMult, trasy handlowe, korupcja (D1: Danina/Podatek, nie Praca),
 * Waluta+Mennica -- dopiero na koncu podzial suwakiem Nauka/Pieniadz/Luksus.
 *
 * Uruchom z gra/: node tools/praca-na-pieniadz-test.cjs
 *
 * Weryfikuje:
 *   1. handelBrutto (zwracane pole, PRZED korupcja/Waluta+Mennica) juz zawiera
 *      pieniadzZPracy PRZEMNOZONY przez premie Targowiska -- dowod, ze wchodzi do
 *      Daniny u zrodla, nie po fakcie.
 *   2. civHandelMult mnozy CALY strumien (w tym czesc z konwersji Pracy).
 *   3. Korupcja (strataFraction) redukuje CALY strumien (w tym czesc z konwersji
 *      Pracy) -- zgodnie z D1 (dotyczy Daniny/Podatku, nie Pracy).
 *   4. Waluta+Mennica MNOZY strumien z konwersji Pracy (POPRAWKA -- przed korekta
 *      bledny test twierdzil, ze NIE mnozy; teraz odwrotnie: mnozy, bo to juz Danina).
 *   5. Pole pieniadzZPracy w CityYieldResult to nadal SUROWA (przed-mnoznikowa)
 *      wartosc informacyjna -- identyczna niezaleznie od Mennicy/Targowiska/civMult
 *      (bo liczona PRZED nimi); realny wplyw multiplikatorow widac dopiero w
 *      finalnych polach nauka/pieniadz/luksus.
 *   6. Suma trzech strumieni po podziale = pula (handelBrutto po wszystkich
 *      mnoznikach) -- nic nie ginie, nic sie nie dubluje.
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
// Real econ-params.json + loader (normal) -- suwak 20/60/20 (decyzja 74=A) i
// mennicaMnoznikPoWalucie (1,5 na normal) czytane z JSON, NIE hardkodowane tutaj.
// ---------------------------------------------------------------------------
const rawEconParams = JSON.parse(fs.readFileSync(path.resolve(GRA_ROOT, 'data', 'econ-params.json'), 'utf8'));
const params = loadEconParams(rawEconParams, 'normal');
eq(params.mennicaMnoznikPoWalucie, 1.5, 'zalozenie fixture: mennicaMnoznikPoWalucie (normal) = 1.5');
eq(params.targowiskoPracaMnoznik, 2, 'zalozenie fixture: targowiskoPracaMnoznik = 2');
eq(params.budynekTargowiskoBonusHandlu, 0.5, 'zalozenie fixture: budynekTargowiskoBonusHandlu (normal) = 0.5 (+50%)');

// Fixture: 5x Gory (Praca=4, Handel=0 kazda -- brak Handlu terenowego, zeby
// pieniadzZPracy byl JEDYNYM zrodlem Daniny, latwo policzalnym) -> pracaTerenu=20,
// handelTerenu=0. procentBudynki=0 -> cala Praca netto idzie do puli (doPuli=20).
// pieniadzZPracy = doPuli(20) x targowiskoPracaMnoznik(2) = 40.
// handelBazowy = handelTerenu(0) + pieniadzZPracy(40) = 40.
// handelBrutto (Targowisko +50%) = 40 x 1.5 = 60 -- liczby dobrane tak, zeby
// zarowno 60 (bez Mennicy) jak i 60x1.5=90 (z Mennica) dzielily sie CZYSTO na
// 20/60/20 bez utraty na floor().
const workedTiles = Array.from({ length: 5 }, () => ({
  terenBazowy: TerenBazowy.Gory,
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
  podziałPracy:  { procentBudynki: 0 }, // 100% Pracy netto -> pula (doPuli)
};

function ctxFor(opts) {
  return {
    wojskoZuzycieZywnosci: 0,
    strataFraction: opts.strataFraction ?? 0,
    maMlyn: false, maCegielnia: false,
    maTargowisko: true,       // Efekt 2 wymaga Targowiska...
    maBiblioteka: false, maAkademia: false,
    maMennica: opts.maMennica ?? false,
    walutaOdkryta: true,      // ...i odkrytej Waluty (walutaOdkrytaOnly)
    civHandelMult: opts.civHandelMult ?? 1,
    civNaukaMult: 1,
  };
}

// ============================================================================
// TEST 1: handelBrutto (zwracane pole) JUZ zawiera pieniadzZPracy PRZEMNOZONY
// przez Targowisko -- dowod ze wchodzi do Daniny u zrodla (D5 poprawione).
// Gdyby (blednie, jak przed korekta) doklejano pieniadzZPracy PO Targowisku,
// handelBrutto = handelTerenu(0) x 1.5 + pieniadzZPracy(40) = 40, NIE 60.
// ============================================================================
console.log('\n--- T1: pieniadzZPracy wchodzi do handelBrutto PRZED Targowiskiem ---');
{
  const yld = cityYieldPerTurn(baseCity, workedTiles, [], params, ctxFor({}));
  eq(yld.pieniadzZPracy, 40, 'pieniadzZPracy (surowa wartosc) = doPuli(20) x targowiskoPracaMnoznik(2) = 40');
  eq(yld.handelBrutto, 60, 'handelBrutto = (handelTerenu(0)+pieniadzZPracy(40)) x Targowisko(1.5) = 60, NIE 40 (dowod ze Targowisko mnozy tez konwersje Pracy)');
}

// ============================================================================
// TEST 2: civHandelMult mnozy CALY strumien (w tym pieniadzZPracy wtopiony w baze).
// civHandelMult=2 -> handelBrutto = 60 x 2 = 120 (nie 40x2+... czy inna czesciowa kombinacja).
// ============================================================================
console.log('\n--- T2: civHandelMult mnozy tez konwersje Pracy (jest w tej samej bazie) ---');
{
  const bez = cityYieldPerTurn(baseCity, workedTiles, [], params, ctxFor({ civHandelMult: 1 }));
  const zCiv = cityYieldPerTurn(baseCity, workedTiles, [], params, ctxFor({ civHandelMult: 2 }));
  eq(bez.handelBrutto, 60, 'civHandelMult=1: handelBrutto = 60 (bazowy)');
  eq(zCiv.handelBrutto, 120, 'civHandelMult=2: handelBrutto = 60 x 2 = 120 (mnoznik dziala na CALA baze, w tym pieniadzZPracy)');
}

// ============================================================================
// TEST 3: Korupcja redukuje CALY strumien (D1: dotyczy Daniny/Podatku -- a
// pieniadzZPracy to TERAZ czesc Daniny, wiec i on jest redukowany).
// strataFraction=0.30 (30%): pieniadz/nauka/luksus spadaja proporcjonalnie o 30%
// wzgledem strataFraction=0 (Praca -- gdyby ja tu liczyc -- pozostalaby NIETKNIETA,
// patrz korupcja-test.cjs T3, D1 nie jest tu ponownie testowane wprost).
// ============================================================================
console.log('\n--- T3: korupcja (D1: Danina/Podatek) redukuje tez czesc z konwersji Pracy ---');
{
  const bezKorupcji = cityYieldPerTurn(baseCity, workedTiles, [], params, ctxFor({ strataFraction: 0 }));
  const zKorupcja   = cityYieldPerTurn(baseCity, workedTiles, [], params, ctxFor({ strataFraction: 0.30 }));
  eq(bezKorupcji.pieniadz, 36, 'bez korupcji: Pieniadz = floor(60 x 0.60) = 36');
  eq(zKorupcja.pieniadz, 25, 'korupcja 30%: Pieniadz = floor((60 x 0.70) x 0.60) = floor(25.2) = 25 (strumien z konwersji Pracy tez strata dotyka)');
  assert(zKorupcja.pieniadz < bezKorupcji.pieniadz, 'korupcja obniza Pieniadz takze gdy jego zrodlem jest w calosci konwersja Pracy');
  assert(zKorupcja.nauka < bezKorupcji.nauka, 'korupcja obniza tez Nauke z tego strumienia');
  assert(zKorupcja.luksus < bezKorupcji.luksus, 'korupcja obniza tez Luksus/Zamoznosc z tego strumienia');
}

// ============================================================================
// TEST 4 (POPRAWKA GLOWNA): Waluta+Mennica MNOZY strumien z konwersji Pracy --
// bez Mennicy: handelNetto=60 (mnoznik nieaktywny). Z Mennica: handelNetto =
// 60 x mennicaMnoznikPoWalucie(1.5) = 90. Podzial 20/60/20 obu (60 i 90 dzieli sie
// czysto): bez Mennicy Pieniadz=36/Nauka=12/Luksus=12; z Mennica Pieniadz=54/
// Nauka=18/Luksus=18 -- dokladnie x1.5, dowod ze mnoznik TERAZ obejmuje tez
// pieniadze pochodzace z konwersji Pracy (przed korekta bylo odwrotnie: strumien
// byl POZA zasiegiem mnoznika).
// ============================================================================
console.log('\n--- T4 (GLOWNA POPRAWKA): Waluta+Mennica MNOZY strumien z konwersji Pracy ---');
{
  const bezMennicy = cityYieldPerTurn(baseCity, workedTiles, [], params, ctxFor({ maMennica: false }));
  const zMennica    = cityYieldPerTurn(baseCity, workedTiles, [], params, ctxFor({ maMennica: true }));

  eq(bezMennicy.pieniadz, 36, 'bez Mennicy: Pieniadz = floor(60 x 0.60) = 36');
  eq(zMennica.pieniadz, 54, 'z Mennica: Pieniadz = floor(90 x 0.60) = 54 = 36 x 1.5 (mnoznik TERAZ obejmuje konwersje Pracy)');
  eq(bezMennicy.nauka, 12, 'bez Mennicy: Nauka = floor(60 x 0.20) = 12');
  eq(zMennica.nauka, 18, 'z Mennica: Nauka = floor(90 x 0.20) = 18 = 12 x 1.5');
  eq(bezMennicy.luksus, 12, 'bez Mennicy: Luksus = floor(60 x 0.20) = 12');
  eq(zMennica.luksus, 18, 'z Mennica: Luksus = floor(90 x 0.20) = 18 = 12 x 1.5');

  assert(zMennica.pieniadz / bezMennicy.pieniadz === params.mennicaMnoznikPoWalucie,
    'stosunek Pieniadz(z Mennica)/Pieniadz(bez Mennicy) = mennicaMnoznikPoWalucie (1.5) dokladnie');

  // Pole pieniadzZPracy samo w sobie pozostaje SUROWA (przed-mnoznikowa) wartoscia
  // informacyjna -- identyczne 40 w obu przypadkach, bo liczone PRZED Targowiskiem/
  // civHandelMult/korupcja/Waluta+Mennica. Realny wplyw mnoznika widac w polach
  // nauka/pieniadz/luksus powyzej, NIE w tym polu.
  eq(bezMennicy.pieniadzZPracy, 40, 'pieniadzZPracy (surowe, przed-mnoznikowe) = 40 bez Mennicy');
  eq(zMennica.pieniadzZPracy, 40, 'pieniadzZPracy (surowe, przed-mnoznikowe) = 40 takze z Mennica -- pole raportuje wartosc PRZED mnoznikami, realny efekt widac w nauka/pieniadz/luksus');
}

// ============================================================================
// TEST 5: Suma trzech strumieni po podziale = pula (handelBrutto po wszystkich
// mnoznikach handlu) -- bez Mennicy (pula=60) i z Mennica (pula=90), obie dzielone
// bez utraty na floor() dzieki dobranym liczbom fixture.
// ============================================================================
console.log('\n--- T5: suma strumieni po podziale = pula (nic nie ginie/dubluje) ---');
{
  const bezMennicy = cityYieldPerTurn(baseCity, workedTiles, [], params, ctxFor({ maMennica: false }));
  const zMennica    = cityYieldPerTurn(baseCity, workedTiles, [], params, ctxFor({ maMennica: true }));

  const sumaBez = bezMennicy.nauka + bezMennicy.pieniadz + bezMennicy.luksus;
  const sumaZ   = zMennica.nauka + zMennica.pieniadz + zMennica.luksus;
  eq(sumaBez, 60, 'bez Mennicy: Nauka(12)+Pieniadz(36)+Luksus(12) = 60 = handelBrutto, dokladnie');
  eq(sumaZ, 90, 'z Mennica: Nauka(18)+Pieniadz(54)+Luksus(18) = 90 = handelBrutto x mennicaMnoznikPoWalucie(1.5), dokladnie');
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
