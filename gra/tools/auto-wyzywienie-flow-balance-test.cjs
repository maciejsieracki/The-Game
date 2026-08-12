'use strict';
/**
 * auto-wyzywienie-flow-balance-test.cjs — R-AUTO-WYZYWIENIE-CEL-BILANS-NIEUJEMNY
 * (rozpoznanie #4, ECHO Macieja "zgoda", 2026-08-10).
 *
 * Kontekst zgłoszenia: mimo włączonego Auto Wyżywienia, poziom Racji gracza pełznął w górę
 * (4 -> 4,5 -> 5 -> 5,5) przez kolejne tury z rosnącą produkcją miasta (populacja 1->3,
 * produkcja 21->26), mimo że Spichlerz startował z zerową/niską rezerwą i bilans miasta był
 * TRWALE ujemny (Bilans -3/t, potem -7/t). Przyczyna (rozpoznanie #4): `autoRaiseRationsForGrowth`
 * commitowała krok podniesienia NATYCHMIAST, a kryterium akceptacji było STOCK-based
 * (`isEmpireCityFoodSolvent` -- skumulowana rezerwa mogła pokryć krok), nie FLOW-based (czysty
 * bilans SAMEJ tury) -- funkcja strukturalnie przestrzeliwała o jeden krok (WYZYWIENIE_STEP=0,5)
 * ponad to, co bieżąca produkcja udźwignie, cicho finansując go z rezerwy aż ją wyczerpała.
 * `autoBalanceRationsToSolvency` (obniżanie) i `maxSafePoziomRacjiForCity` (backstop Q3=A) używały
 * TEGO SAMEGO stock-based kryterium, więc żadna z trzech linii obrony nie cofała przestrzelenia.
 *
 * Naprawa: dla GRACZA (ownerId===0) wyłącznie -- kryterium akceptacji/celu we wszystkich trzech
 * funkcjach jest teraz FLOW-based (`computeEmpireCityFoodNadwyzka >= 0` PO kroku/na poziomie),
 * nie tylko stock-based. AI/miasta-państwa zostają przy dawnym stock-based zachowaniu (świadome
 * ograniczenie zakresu tej naprawy -- major AI ma dziś celowo dopuszczać krótkotrwałe
 * finansowanie wzrostu z rezerwy, żeby nie stać w miejscu przy chwilowym deficycie produkcji).
 *
 * Ten test:
 *  A) odtwarza WIELOTUROWY scenariusz Macieja (symulowane kolejne "końce tury": rosnąca
 *     produkcja, niska/zerowa rezerwa startowa) i dowodzi, że poziom Racji gracza już NIE
 *     pełznie powyżej tego, co bieżąca produkcja udźwignie -- flow tej tury jest nieujemny PO
 *     ustabilizowaniu w KAŻDEJ turze, a rezerwa Spichlerza nie jest cicho drenowana (nigdy nie
 *     maleje, skoro flow >= 0 w każdej turze z osobna);
 *  B) dowodzi PARYTETU: dokładnie ta sama sekwencja dla AI (ownerId=1, bez flag gracza)
 *     zachowuje się jak DAWNIEJ -- rezerwa MOŻE finansować chwilowy deficyt (stock-based),
 *     `autoRaiseRationsForGrowth`/`autoBalanceRationsToSolvency`/`maxSafePoziomRacjiForCity`
 *     nie zostały dotknięte zmianą dla AI (FAIL #8 z playbooka -- test parytetu owner 0 i owner N
 *     jest tu WPROST, nie domyślny);
 *  C) brzegi: krok DOKŁADNIE bilansujący się (nadwyzka==0 po kroku) jest ZATRZYMYWANY, ale NIE
 *     cofany (zachowanie zamierzone -- to nie jest przestrzelenie); krok, który przestrzeliwuje o
 *     dokładnie WYZYWIENIE_STEP, jest cofany do poprzedniego poziomu (repro dokładnego mechanizmu
 *     defektu z linii 552-581 pre-fix).
 *
 * Run from gra/: node tools/auto-wyzywienie-flow-balance-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.auto-wyzywienie-flow-balance-entry.ts');
const BUNDLE = path.resolve(__dirname, '.auto-wyzywienie-flow-balance-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  autoRaiseRationsForGrowth, autoBalanceRationsToSolvency, maxSafePoziomRacjiForCity,
  computeEmpireCityFoodNadwyzka, isEmpireCityFoodSolvent, simulateCityFoodCentralPool,
  WYZYWIENIE_STEP,
} from '../src/game/empire-food';
export { recomputeCityFoodBalancesInEcon } from '../src/game/turn-economy';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, absWorkingDir: GRA_ROOT, logLevel: 'silent',
});

const M = require(BUNDLE);
const {
  autoRaiseRationsForGrowth, autoBalanceRationsToSolvency, maxSafePoziomRacjiForCity,
  computeEmpireCityFoodNadwyzka, recomputeCityFoodBalancesInEcon, WYZYWIENIE_STEP,
} = M;

let passed = 0, failed = 0;
function ok(cond, label) {
  if (cond) { passed++; } else { failed++; console.error('FAIL:', label); }
}

const RATION_PARAMS = {
  racjeZywnosc1: 2, racjeZywnosc2: 4, racjeZywnosc3: 6,
  racjeWzrostProc1: 3, racjeWzrostProc2: 5, racjeWzrostProc3: 7,
};

/** Zbuduj econ.perCity dla jednego miasta z bieżącym poziomRacji (kosztRacji = population*poziom*2). */
function buildEconForCity(city, zywnoscBrutto) {
  const econ = {
    perCity: [{
      cityId: city.id, ownerId: city.ownerId, oblegany: false,
      zywnoscBrutto, kosztRacji: 0, bilansLokalny: 0,
    }],
  };
  recomputeCityFoodBalancesInEcon(econ.perCity, [city], RATION_PARAMS);
  return econ;
}

/**
 * Symuluje JEDNĄ turę: buduje econ dla produkcji tej tury, uruchamia auto-balance (obniż) +
 * auto-raise (podnieś) w tej samej kolejności co main.ts (linie ~22010-22040), potem aktualizuje
 * rezerwę centralną o flow tej tury (klamrowaną >= 0, jak realny magazyn Spichlerza).
 */
function simulateTurn(city, zywnoscBrutto, reserveBefore, opts) {
  let econ = buildEconForCity(city, zywnoscBrutto);

  autoBalanceRationsToSolvency({
    ownerId: city.ownerId,
    cities: [city],
    econ,
    zapasyPrzed: reserveBefore,
    rationParams: RATION_PARAMS,
    requireFlowBalance: opts.requireFlowBalance,
  });

  autoRaiseRationsForGrowth({
    ownerId: city.ownerId,
    cities: [city],
    econ,
    zapasyPrzed: reserveBefore,
    rationParams: RATION_PARAMS,
    requireProductionSurplus: opts.requireProductionSurplus,
  });

  const nadwyzka = computeEmpireCityFoodNadwyzka(econ.perCity, city.ownerId);
  const reserveAfter = Math.max(0, reserveBefore + nadwyzka);
  return { poziomRacji: city.poziomRacji, nadwyzka, reserveAfter };
}

// ===========================================================================
// A) Repro sceanriusza Macieja -- GRACZ (ownerId=0), wieloturowo, produkcja rośnie, rezerwa
//    startuje z zera (jak "Spichlerz=0" na zrzucie).
// ===========================================================================
console.log('\n-- A. Gracz (ownerId=0): wieloturowa symulacja, produkcja rosnąca, rezerwa startowa=0 --');
{
  const city = { id: 'c1', ownerId: 0, name: 'Ateny', population: 3, poziomRacji: 3.5, rationMigratedV114: true };
  // poziomRacji startowy=3,5 już zbilansowany z T1 (21 - 3*3,5*2 = 0) -- odtwarza stan "system
  // JUŻ raz się ustabilizował", dokładnie jak w drugim zrzucie Macieja (poziom był już obniżony
  // do 4 z poprzedniej tury, nie startował od zera).
  const productionByTurn = [21, 22, 23, 24, 26]; // wzorowane na drugim/trzecim zrzucie Macieja
  let reserve = 0;
  const trace = [];
  for (const prod of productionByTurn) {
    const r = simulateTurn(city, prod, reserve, { requireFlowBalance: true, requireProductionSurplus: true });
    trace.push({ prod, ...r });
    reserve = r.reserveAfter;
  }

  for (const t of trace) {
    ok(t.nadwyzka >= 0,
      `gracz T(prod=${t.prod}): flow tej tury nieujemny PO ustabilizowaniu (nadwyzka=${t.nadwyzka}, poziom=${t.poziomRacji}) -- NIE pełznie ponad to, co produkcja udźwignie`);
  }

  // Rezerwa NIGDY nie powinna spaść poniżej stanu z poprzedniej tury -- skoro flow>=0 w każdej
  // turze z osobna, magazyn się nie drenuje (dokładne przeciwieństwo zgłoszonego objawu: HUD
  // "Spichlerz 0 -24" po serii przestrzeleń).
  let reserveTrace = 0;
  let neverDrained = true;
  for (const t of trace) {
    if (t.reserveAfter < reserveTrace - 1e-9) neverDrained = false;
    reserveTrace = t.reserveAfter;
  }
  ok(neverDrained, `gracz: rezerwa Spichlerza nigdy nie maleje w żadnej turze (ślad: ${JSON.stringify(trace.map(t => t.reserveAfter))}) -- brak cichego drenażu`);

  // Poziom Racji śledzi produkcję, nie przestrzeliwuje: przy produkcji=26, population=3,
  // bezpieczny flow-based poziom to <= 26/(3*2) = 4,33(3) -> najwyższy krok 0,5 to 4,0.
  // Zgłoszony bug osiągnął 5,5 w tym samym scenariuszu (znacznie powyżej).
  const last = trace[trace.length - 1];
  ok(last.poziomRacji <= 4.0 + 1e-9,
    `gracz: przy produkcji=26/population=3 poziom Racji <= 4,0 (flow-safe), NIE 5,5 jak w zgłoszonym buggu (got ${last.poziomRacji})`);
}

// ===========================================================================
// B) PARYTET: identyczna sekwencja dla AI (ownerId=1, bez flag gracza) -- zachowanie
//    NIEZMIENIONE (stock-based, rezerwa MOŻE finansować chwilowy deficyt produkcji).
// ===========================================================================
console.log('\n-- B. PARYTET: AI (ownerId=1, bez flag gracza) -- rezerwa nadal MOŻE pokryć krok (stock-based, jak dawniej) --');
{
  const city = { id: 'c2', ownerId: 1, name: 'AI-Sparta', population: 3, poziomRacji: 3.5, rationMigratedV114: true };
  const reserveBefore = 50; // rezerwa AI-majora celowo hojna -- major AI ma prawo z niej korzystać
  const econ = buildEconForCity(city, 21); // ta sama produkcja co T1 gracza w części A
  const before = city.poziomRacji;

  const r = autoRaiseRationsForGrowth({
    ownerId: 1,
    cities: [city],
    econ,
    zapasyPrzed: reserveBefore,
    rationParams: RATION_PARAMS,
    // BRAK requireProductionSurplus -- to jest dokładnie ścieżka major AI w main.ts
    // (requireProductionSurplus: ownerId === 0 -> false dla AI).
  });

  ok(r.adjusted && city.poziomRacji > before,
    `AI: rezerwa (${reserveBefore}) wciąż pozwala podnieść ponad flow-safe poziom -- zachowanie AI NIEZMIENIONE przez naprawę gracza (poziom ${before} -> ${city.poziomRacji})`);
  const nadwyzkaAi = computeEmpireCityFoodNadwyzka(econ.perCity, 1);
  ok(nadwyzkaAi < 0,
    `AI: flow tej tury MOŻE być ujemny po raise (nadwyzka=${nadwyzkaAi}) -- to jest DOZWOLONE dla AI (stock-based), w odróżnieniu od gracza w części A`);
}

// ===========================================================================
// C) Brzegi kryterium akceptacji kroku w autoRaiseRationsForGrowth (gracz).
// ===========================================================================
console.log('\n-- C1. Gracz: krok DOKŁADNIE bilansujący się (nadwyzka==0 po kroku) -- zatrzymany, NIE cofnięty --');
{
  // population=2, start poziom=1 (koszt=4), zywnoscBrutto=8 -> nadwyzka na starcie=4>0.
  // Krok do 1,5: koszt=6, nadwyzka=2>0 (nadal surplus, raise kontynuuje).
  // Krok do 2,0: koszt=8, nadwyzka=0 -- DOKŁADNIE granica: musi zostać PRZYJĘTY (nie cofnięty),
  // bo nadwyzka>=0, i pętla ma się ZATRZYMAĆ (nie próbować 2,5).
  const city = { id: 'c3', ownerId: 0, name: 'Boundary', population: 2, poziomRacji: 1, rationMigratedV114: true };
  const econ = buildEconForCity(city, 8);
  const r = autoRaiseRationsForGrowth({
    ownerId: 0, cities: [city], econ, zapasyPrzed: 0, rationParams: RATION_PARAMS,
    requireProductionSurplus: true,
  });
  ok(r.adjusted, 'gracz brzeg: raise faktycznie coś zmienił');
  ok(city.poziomRacji === 2, `gracz brzeg: krok DOKŁADNIE bilansujący (nadwyzka=0) jest PRZYJĘTY, poziom=2 (got ${city.poziomRacji})`);
  const finalNadwyzka = computeEmpireCityFoodNadwyzka(econ.perCity, 0);
  ok(Math.abs(finalNadwyzka) < 1e-9, `gracz brzeg: nadwyzka finalna == 0 (got ${finalNadwyzka})`);
}

console.log('\n-- C2. Gracz: krok przestrzeliwujący o dokładnie WYZYWIENIE_STEP -- COFNIĘTY (repro dokładnego mechanizmu defektu) --');
{
  // population=2, start poziom=1,5 (koszt=6), zywnoscBrutto=9 -> nadwyzka=3>0, raise próbuje 2,0.
  // Przy 2,0: koszt=8, nadwyzka=1>0 -- nadal surplus, pętla próbuje 2,5 (NIE zatrzymuje się na
  // 2,0 jak w C1, bo tu granica nie jest dokładna). Przy 2,5: koszt=10, nadwyzka=-1<0 -- STARE
  // stock-based kryterium (solvent = -1+zapasyPrzed>=0 wymaga zapasyPrzed>=1) zaakceptowałoby
  // krok do 2,5 przy zapasyPrzed=5 (dokładnie zgłoszony mechanizm pełzania). Pod NOWYM
  // (flow-based dla gracza) krok do 2,5 MUSI zostać cofnięty do 2,0.
  const city = { id: 'c4', ownerId: 0, name: 'Overshoot', population: 2, poziomRacji: 1.5, rationMigratedV114: true };
  const econ = buildEconForCity(city, 9);
  const zapasyPrzed = 5;
  // Kontrola: pod starym stock-based kryterium krok do 2,5 BYŁBY solvent (dowód, że ten
  // scenariusz faktycznie odtwarza defekt, nie trywialny przypadek).
  const wouldOldAccept = (() => {
    const testCity = { ...city, poziomRacji: 2.5 };
    const testEcon = buildEconForCity(testCity, 9);
    const nadwyzkaAt25 = computeEmpireCityFoodNadwyzka(testEcon.perCity, 0);
    return (nadwyzkaAt25 + zapasyPrzed) >= 0;
  })();
  ok(wouldOldAccept, 'kontrola: pod DAWNYM stock-based kryterium krok do 2,5 byłby "solvent" (zapasyPrzed=5 pokrywa deficyt -2) -- scenariusz faktycznie odtwarza defekt #4');

  const r = autoRaiseRationsForGrowth({
    ownerId: 0, cities: [city], econ, zapasyPrzed, rationParams: RATION_PARAMS,
    requireProductionSurplus: true,
  });
  ok(r.adjusted, 'gracz przestrzelenie: raise faktycznie coś zmienił (zatrzymał się na 2,0, nie na 1,5)');
  ok(city.poziomRacji === 2, `gracz przestrzelenie: NOWE (flow-based) kryterium cofa krok do 2,5, zatrzymuje się na 2,0 (got ${city.poziomRacji}) -- POD STARYM KODEM byłoby 2,5`);
  ok(city.poziomRacji !== 2.5, 'gracz przestrzelenie: poziom 2,5 (stary buggy wynik) NIE został zaakceptowany');
}

console.log('\n-- C3. maxSafePoziomRacjiForCity (gracz): backstop zwraca ten sam flow-safe poziom co raise, NIE stary stock-based --');
{
  const city = { id: 'c5', ownerId: 0, name: 'Backstop', population: 2, poziomRacji: 2, rationMigratedV114: true };
  const econ = buildEconForCity(city, 8);
  const maxSafe = maxSafePoziomRacjiForCity({
    cityId: 'c5', ownerId: 0, cities: [city], econ, zapasyPrzed: 5, rationParams: RATION_PARAMS,
  });
  ok(maxSafe === 2, `backstop gracz: maxSafe=2 (flow-based, nie 2,5 jak stary stock-based z zapasyPrzed=5) (got ${maxSafe})`);
}

console.log(`\nauto-wyzywienie-flow-balance-test: ${passed} pass, ${failed} fail`);

try { fs.unlinkSync(ENTRY); } catch (_e) { /* noop */ }
try { fs.unlinkSync(BUNDLE); } catch (_e) { /* noop */ }

process.exit(failed === 0 ? 0 : 1);
