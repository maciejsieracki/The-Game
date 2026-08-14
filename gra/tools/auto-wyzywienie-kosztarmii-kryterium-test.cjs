'use strict';
/**
 * auto-wyzywienie-kosztarmii-kryterium-test.cjs — R-AUTO-WYZYWIENIE-KRYTERIUM-Q1=A,
 * z doprecyzowaniem właściciela (ECHO 2026-08-13, `dyspozycje/PYTANIA-OTWARTE.md`).
 *
 * Kontekst zgłoszenia (`P-AUTO-WYZYWIENIE-ZAPASY-NIE-STEROWANE`, recon `a730e8bbcfd7760a2`):
 * Ateny (Produkcja 46, Koszt racji 50 przy poziomie 5 -> Bilans -4), Milet (Produkcja 17,
 * Koszt racji 11 -> Bilans +6). Nadwyżka miast = +2. Wojsko (koszt żywności armii) = -20.
 * PRZED naprawą: kryterium "bezpieczny poziom" (`isEmpireCityFoodSolvent`/
 * `isRationBalanceTargetMet`) liczyło WYŁĄCZNIE Nadwyżkę miast (+2>=0 => "solvent"), całkowicie
 * ignorując koszt Wojska -- Auto Wyżywienie uznawało Ateny za bezpieczne i przestawało obniżać
 * Racje, mimo że PRAWDZIWY przyrost zapasów tej tury (Nadwyżka - kosztArmii = 2-20 = -18) był
 * głęboko ujemny. HUD pokazywał "Przyrost zapasów = 0" tylko dlatego, że `Math.max(0, central)`
 * w `advanceEmpireFood` przycina wynik do zera -- rzeczywisty deficyt (-18) był ukryty.
 *
 * Właściciela doprecyzowanie (ważniejsze niż litera A/B): wyznacznikiem NIE jest stan bufora
 * (Spichlerz > 0 "wytrzymujący" chwilowy minus), tylko rzeczywisty PRZYROST ZAPASÓW za turę,
 * który ma być ZAWSZE >= 0 -- co wymaga uwzględnienia kosztu Wojska w kryterium (Q2=B, wdrożone
 * łącznie z Q1=A na wyraźne życzenie właściciela w tym samym ECHO).
 *
 * Ten test dowodzi:
 *  A) STARE zachowanie (kosztArmii pominięty/domyślny 0, dokładnie kompatybilność wsteczna) --
 *     Auto Wyżywienie uznaje Ateny/Milet za "bezpieczne" i NIC nie obniża, mimo realnego
 *     deficytu -18 -- odtwarza DOKŁADNIE zgłoszony bug (kontrola: dowodzi, że scenariusz
 *     faktycznie odtwarza defekt, nie trywialny przypadek).
 *  B) NOWE zachowanie (kosztArmii=20 przekazany) -- `autoBalanceRationsToSolvency` DALEJ obniża
 *     Racje (Ateny 5,0 -> 4,0; Milet 0,5 -> 0,0, oba miasta cięte proporcjonalnie krok-po-kroku,
 *     zgodnie z istniejącą logiką pętli) aż `Nadwyżka - kosztArmii >= 0` NAPRAWDĘ (nie tylko
 *     `Nadwyżka >= 0` jak dawniej).
 *  C) `isEmpireCityFoodSolvent` bezpośrednio: przy kosztArmii=0 (stare zachowanie) scenariusz
 *     wychodzi "solvent" (bug); przy kosztArmii=20 (nowe) -- "niewypłacalne" (poprawnie).
 *  D) `maxSafePoziomRacjiForCity` (backstop panelu miasta, Limit Spichlerza) dla Aten z
 *     kosztArmii=20 zwraca poziom niższy niż bez kosztu armii -- Limit Spichlerza w panelu
 *     miasta też uwzględnia teraz wojsko.
 *
 * Run from gra/: node tools/auto-wyzywienie-kosztarmii-kryterium-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.auto-wyzywienie-kosztarmii-kryterium-entry.ts');
const BUNDLE = path.resolve(__dirname, '.auto-wyzywienie-kosztarmii-kryterium-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  autoBalanceRationsToSolvency, maxSafePoziomRacjiForCity,
  computeEmpireCityFoodNadwyzka, isEmpireCityFoodSolvent,
} from '../src/game/empire-food';
export { recomputeCityFoodBalancesInEcon } from '../src/game/turn-economy';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, absWorkingDir: GRA_ROOT, logLevel: 'silent',
});

const M = require(BUNDLE);
const {
  autoBalanceRationsToSolvency, maxSafePoziomRacjiForCity,
  computeEmpireCityFoodNadwyzka, isEmpireCityFoodSolvent, recomputeCityFoodBalancesInEcon,
} = M;

let passed = 0, failed = 0;
function ok(cond, label) {
  if (cond) { passed++; } else { failed++; console.error('FAIL:', label); }
}

const RATION_PARAMS = {
  racjeZywnosc1: 2, racjeZywnosc2: 4, racjeZywnosc3: 6,
  racjeWzrostProc1: 3, racjeWzrostProc2: 5, racjeWzrostProc3: 7,
};

// Ateny: population=5, poziomRacji=5 -> kosztRacji = 5*5*2 = 50, produkcja=46, bilans=-4.
// Milet: population=11, poziomRacji=0,5 -> kosztRacji = 11*0,5*2 = 11, produkcja=17, bilans=+6.
// Nadwyżka miast = -4+6 = +2 (dokładnie jak w zgłoszeniu). Wojsko (kosztArmii) = 20.
const KOSZT_ARMII = 20;

function buildCities() {
  return [
    { id: 'ateny', ownerId: 0, name: 'Ateny', population: 5, poziomRacji: 5, rationMigratedV114: true },
    { id: 'milet', ownerId: 0, name: 'Milet', population: 11, poziomRacji: 0.5, rationMigratedV114: true },
  ];
}

function buildEcon(cities) {
  const econ = {
    perCity: [
      { cityId: 'ateny', ownerId: 0, oblegany: false, zywnoscBrutto: 46, kosztRacji: 0, bilansLokalny: 0 },
      { cityId: 'milet', ownerId: 0, oblegany: false, zywnoscBrutto: 17, kosztRacji: 0, bilansLokalny: 0 },
    ],
  };
  recomputeCityFoodBalancesInEcon(econ.perCity, cities, RATION_PARAMS);
  return econ;
}

// ---------------------------------------------------------------------------
// Kontrola założenia: econ zbudowany dokładnie odtwarza liczby ze zgłoszenia.
// ---------------------------------------------------------------------------
{
  const cities = buildCities();
  const econ = buildEcon(cities);
  const ateny = econ.perCity.find(t => t.cityId === 'ateny');
  const milet = econ.perCity.find(t => t.cityId === 'milet');
  ok(ateny.kosztRacji === 50, `kontrola: Ateny koszt Racji=50 przy poziomie 5 (got ${ateny.kosztRacji})`);
  ok(ateny.bilansLokalny === -4, `kontrola: Ateny bilans=-4 (got ${ateny.bilansLokalny})`);
  ok(milet.kosztRacji === 11, `kontrola: Milet koszt Racji=11 przy poziomie 0,5 (got ${milet.kosztRacji})`);
  ok(milet.bilansLokalny === 6, `kontrola: Milet bilans=+6 (got ${milet.bilansLokalny})`);
  const nadwyzka = computeEmpireCityFoodNadwyzka(econ.perCity, 0);
  ok(nadwyzka === 2, `kontrola: Nadwyżka miast = +2, jak w zgłoszeniu (got ${nadwyzka})`);
}

// ---------------------------------------------------------------------------
// A) STARE zachowanie (kosztArmii pominięty = 0, wsteczna kompatybilność) -- reprodukuje bug:
//    Auto Wyżywienie NIC nie obniża, mimo realnego deficytu -18 (2 - 20).
// ---------------------------------------------------------------------------
console.log('\n-- A. Repro buga: kosztArmii=0 (stare zachowanie) -- Auto Wyżywienie NIE obniża, mimo realnego deficytu -18 --');
{
  const cities = buildCities();
  const econ = buildEcon(cities);
  const r = autoBalanceRationsToSolvency({
    ownerId: 0, cities, econ, zapasyPrzed: 0, rationParams: RATION_PARAMS,
    requireFlowBalance: true,
    // kosztArmii CELOWO pominięty -- odtwarza dokładnie stare (przed naprawą) zachowanie.
  });
  ok(r.adjusted === false,
    `bug repro: BEZ kosztArmii w kryterium, Auto Wyżywienie uznaje Ateny/Milet za "bezpieczne" i nic nie zmienia (adjusted=${r.adjusted}) -- mimo realnego deficytu -18`);
  const atenyLvl = cities.find(c => c.id === 'ateny').poziomRacji;
  ok(atenyLvl === 5, `bug repro: poziom Racji Aten zostaje na 5,0 (stary bug) (got ${atenyLvl})`);
}

// ---------------------------------------------------------------------------
// B) NOWE zachowanie (kosztArmii=20 przekazany) -- Auto Wyżywienie DALEJ obniża Racje, aż
//    Nadwyżka - kosztArmii >= 0 NAPRAWDĘ.
// ---------------------------------------------------------------------------
console.log('\n-- B. Naprawa: kosztArmii=20 przekazany -- Auto Wyżywienie DALEJ obniża Racje aż Nadwyżka-kosztArmii>=0 --');
{
  const cities = buildCities();
  const econ = buildEcon(cities);
  const r = autoBalanceRationsToSolvency({
    ownerId: 0, cities, econ, zapasyPrzed: 0, rationParams: RATION_PARAMS,
    requireFlowBalance: true,
    kosztArmii: KOSZT_ARMII,
  });
  ok(r.adjusted === true,
    `naprawa: Z kosztArmii=20 w kryterium, Auto Wyżywienie DALEJ obniża Racje (adjusted=${r.adjusted})`);

  const atenyLvl = cities.find(c => c.id === 'ateny').poziomRacji;
  const miletLvl = cities.find(c => c.id === 'milet').poziomRacji;
  ok(atenyLvl === 4, `naprawa: Ateny obniżone z 5,0 do 4,0 (got ${atenyLvl})`);
  ok(miletLvl === 0, `naprawa: Milet obniżone z 0,5 do 0,0=WYZYWIENIE_MIN (got ${miletLvl})`);

  const nadwyzkaFinal = computeEmpireCityFoodNadwyzka(econ.perCity, 0);
  ok(nadwyzkaFinal >= KOSZT_ARMII,
    `naprawa: PO korekcie, Nadwyżka miast (${nadwyzkaFinal}) >= kosztArmii (${KOSZT_ARMII}) -- prawdziwy PRZYROST ZAPASÓW tej tury >= 0 (${nadwyzkaFinal - KOSZT_ARMII})`);
  ok(nadwyzkaFinal === 23,
    `naprawa: wartość dokładna Nadwyżki finalnej = 23 (Ateny bilans=6 + Milet bilans=17) (got ${nadwyzkaFinal})`);
}

// ---------------------------------------------------------------------------
// C) isEmpireCityFoodSolvent bezpośrednio -- ta sama para liczb, z/bez kosztArmii.
// ---------------------------------------------------------------------------
console.log('\n-- C. isEmpireCityFoodSolvent: kosztArmii=0 "solvent" (bug) vs kosztArmii=20 "niewypłacalne" (poprawnie) --');
{
  const cities = buildCities();
  const econ = buildEcon(cities);
  const solventOld = isEmpireCityFoodSolvent(0, econ.perCity, 0);
  ok(solventOld === true,
    `C: BEZ kosztArmii, isEmpireCityFoodSolvent zwraca true (Nadwyżka+0-0=+2>=0) -- odtwarza bug (got ${solventOld})`);
  const solventNew = isEmpireCityFoodSolvent(0, econ.perCity, 0, KOSZT_ARMII);
  ok(solventNew === false,
    `C: Z kosztArmii=20, isEmpireCityFoodSolvent zwraca false (Nadwyżka+0-20=-18<0) -- prawidłowo flaguje niewypłacalność (got ${solventNew})`);
}

// ---------------------------------------------------------------------------
// D) maxSafePoziomRacjiForCity (backstop panelu miasta / Limit Spichlerza) dla Aten --
//    z kosztArmii=20, Milet zostaje na SWOIM bieżącym poziomie (0,5, bilans=+6).
// ---------------------------------------------------------------------------
console.log('\n-- D. maxSafePoziomRacjiForCity (Limit Spichlerza panelu): Ateny z kosztArmii=20 vs bez --');
{
  const cities = buildCities(); // Milet zostaje przy poziomRacji=0,5 (bilans=+6) -- NIE zerowany.
  const econ = buildEcon(cities);

  const maxSafeOld = maxSafePoziomRacjiForCity({
    cityId: 'ateny', ownerId: 0, cities, econ, zapasyPrzed: 0, rationParams: RATION_PARAMS,
    // kosztArmii pominięty -- stare zachowanie panelu.
  });
  ok(maxSafeOld === 5,
    `D: BEZ kosztArmii, Limit Spichlerza Aten = 5,0 (Nadwyżka+Milet(+6)>=0 przy każdym poziomie <=5) (got ${maxSafeOld})`);

  const maxSafeNew = maxSafePoziomRacjiForCity({
    cityId: 'ateny', ownerId: 0, cities, econ, zapasyPrzed: 0, rationParams: RATION_PARAMS,
    kosztArmii: KOSZT_ARMII,
  });
  ok(maxSafeNew === 3,
    `D: Z kosztArmii=20, Limit Spichlerza Aten spada do 3,0 (bilans_Ateny(16)+Milet(6)-20=2>=0; przy 3,5 bilans=11, 11+6-20=-3<0) (got ${maxSafeNew})`);
  ok(maxSafeNew < maxSafeOld,
    `D: Limit Spichlerza panelu miasta z uwzględnieniem Wojska jest NIŻSZY niż bez (${maxSafeNew} < ${maxSafeOld})`);
}

console.log(`\nauto-wyzywienie-kosztarmii-kryterium-test: ${passed} pass, ${failed} fail`);

try { fs.unlinkSync(ENTRY); } catch (_e) { /* noop */ }
try { fs.unlinkSync(BUNDLE); } catch (_e) { /* noop */ }

process.exit(failed === 0 ? 0 : 1);
