'use strict';
/**
 * auto-improvements-test.cjs — picker wspólny gracz+AI (game/auto-improvements.ts).
 * Run from gra/:  node tools/auto-improvements-test.cjs
 *
 * R-AUTO-PRACA-BUDZET-PROCENT-Q1=B (2026-08-14): dawny limit SZTUK (`maxPerCity`/`getMaxPerCity`,
 * 1-3/miasto/turę) zastąpiony % budżetu Pracy (`pracaBudgetPercent`/`getPracaBudgetPercent`,
 * 0-100%) liczonym od SKUMULOWANEJ puli Pracy na WEJŚCIU do wywołania (nie od przyrostu).
 * Testy 4/7/8/9 przepisane pod nową logikę (świadomie, nie usunięto pokrycia — patrz komentarze
 * przy każdym). Testy 10-12 to nowe asercje (a)-(c) z dyspozycji Operatora; migracja starego
 * zapisu (d) żyje w osobnym pliku `ulepszenia-praca-percent-test.cjs` (to test game/cities.ts,
 * nie auto-improvements.ts).
 *
 * RUNDA 2 (2026-08-14, naprawa FAIL Evaluatora): runda 1 liczyła `pct% × pula` OSOBNO dla
 * KAŻDEGO miasta zamiast jako JEDEN wspólny budżet całego wywołania — przy N miastach automat
 * mógł wydać do N×pct% puli (zmierzone: 98,7% zamiast 33% przy 4 miastach). Naprawione: WSPÓLNY,
 * dzielony licznik `globalSpent` (patrz auto-improvements.ts) — test 12 przepisany pod nową,
 * poprawną semantykę (zachowując ochronę niezależności OD KOLEJNOŚCI miast — jedyne, co stary
 * test 12 słusznie chronił). Nowy test 13 przypina `AUTO_ULEPSZENIA_PRACA_RESERVE` LICZBOWO
 * (łapie mutację 30→0 — stare testy 9/11 porównują stałą z samą sobą, tautologia). Nowy test 14
 * potwierdza wprost sedno naprawy: łączny wydatek dla tego samego % NIE zależy od liczby miast N.
 *
 * R-AUTO-PRACA-BUDZET-PROCENT-Q3=B (2026-08-14, decyzja właściciela, follow-up ABC rundy 2):
 * runda 2 zostawiła znalezisko — override per-miasto (`getPracaBudgetPercent`) mógł przebić
 * politykę imperium (`pracaBudgetPercent`), bo pułap liczył się od WŁASNEGO % miasta, nie od
 * polityki imperium (zmierzone: override 80% przy polityce 20% → automat wydawał 80% CAŁEJ puli
 * imperium). Naprawione: nadrzędny `imperiumBudgetCap`, liczony RAZ z polityki imperium — patrz
 * `effectiveCityCap` w auto-improvements.ts. Nowy test 15 = scenariusz Evaluatora (a) —
 * potwierdza SUMĘ ≤ pułap imperium mimo override. Nowy test 16 = regression guard (b) — bez
 * override wynik identyczny jak przed tą naprawą. Mutacja (c) — usunięcie pułapu imperium —
 * zweryfikowana ręcznie przez Operatora (AI_SRC_DIR na zmutowaną kopię źródła), nie wbudowana na
 * stałe w ten plik (wymagałaby dublowania wewnętrznej implementacji funkcji w harnessie testu).
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[auto-improvements-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = process.env.AI_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const ENTRY_FILE = path.resolve(__dirname, '.auto-improvements-test-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.auto-improvements-test-bundle.cjs');

const ENTRY_TS = `
export {
  pickAutoImprovements,
  prioritiesForUlepszeniaFocus,
  AUTO_ULEPSZENIA_PRACA_RESERVE,
} from ${JSON.stringify(SRC + '/game/auto-improvements')};
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
  });
} catch (e) {
  console.error('[auto-improvements-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const { pickAutoImprovements, AUTO_ULEPSZENIA_PRACA_RESERVE } = require(BUNDLE_FILE);

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error('  FAIL:', msg); }
}
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

function makeFlatMap(w, h) {
  const hexes = {};
  for (let q = 0; q < w; q++) {
    for (let r = 0; r < h; r++) {
      const k = `${q},${r}`;
      hexes[k] = {
        coords: { q, r },
        terenBazowy: 'rownina',
        nakladka: 'brak',
        ulepszenie: 'brak',
        wlasciciel: null,
        wioska: { istnieje: false, ludnosc: 0 },
        widocznosc: {},
        rzeka: { obecna: false, krawedzie: [] },
      };
    }
  }
  return { szerokoscQ: w, wysokoscR: h, hexes, seed: 42, riverPaths: [] };
}

function makeHillMap(w, h) {
  const m = makeFlatMap(w, h);
  for (const hex of Object.values(m.hexes)) hex.terenBazowy = 'wzgorza';
  return m;
}

function makeCity(id, ownerId, q, r, population = 2, extra = {}) {
  return { id, ownerId, q, r, name: 'TestCity', population, ...extra };
}

// pracaAvailable=50 + pracaBudgetPercent=100 (jawnie, żeby test był czytelny niezależnie od
// domyślnej wartości funkcji): dokładnie tyle, by starczyło na JEDNO typowe ulepszenie z tej
// puli testów (farma/bydlo/owce/lama/lodzie_rybackie=40 Pracy, kamieniolom=44 Pracy po
// R_STAWKI_FALA2_MULT×2), ale NIE na drugie (min. koszt kolejnego typu w tych samych listach to
// 36, więc pracaLeft=10 po pierwszym picku zawsze za mało). Odizolowuje testy 1/2/3/5/6 (logika
// KWALIFIKACJI heksa/typu) od mechanizmu %-budżetu (testowanego osobno w 10-13) — przed
// R-AUTO-PRACA-BUDZET-PROCENT-Q1=B tę rolę pełnił domyślny sztuk-cap=1 przy pracaAvailable=200.
function baseOpts(city, map) {
  return {
    cities: [city],
    ownerId: city.ownerId,
    map,
    territoryNodes: [{ q: city.q, r: city.r, pop: city.population, level: 1, ownerId: city.ownerId }],
    placedImprovements: new Map(),
    pracaAvailable: 50,
    pracaBudgetPercent: 100,
    unlockedTechs: new Set(['Rolnictwo', 'Kamieniarstwo']),
    pracaSurplusThreshold: 0,
    skipWyrab: true,
    civArchetype: 'grecy',
  };
}

// 1. focus zywnosc prefers farm over mine when both qualify
console.log('1. focus zywnosc — farma przed kamieniolom');
{
  const map = makeFlatMap(20, 20);
  // heks (16,15) rownina — farma; (17,15) wzgorza — kamieniolom
  map.hexes['17,15'].terenBazowy = 'wzgorza';
  const city = makeCity('c1', 0, 15, 15, 3, { ulepszeniaFocus: 'zywnosc' });
  const picks = pickAutoImprovements(baseOpts(city, map));
  eq(picks.length, 1, 'jedno ulepszenie');
  eq(picks[0].key, 'farma', 'zywnosc wybiera farme zamiast kamieniolomu');
}

// 2. onlyWorked=true skips unworked qualifying hex
console.log('2. onlyWorked=true — pomija nieobrabiane');
{
  const map = makeFlatMap(20, 20);
  const city = makeCity('c2', 0, 10, 10, 1, {
    ulepszeniaFocus: 'zywnosc',
    ulepszeniaOnlyWorked: true,
  });
  const opts = baseOpts(city, map);
  opts.getOnlyWorked = c => c.ulepszeniaOnlyWorked ?? false;
  opts.getWorkedHexKeys = () => new Set(['11,10']); // tylko jeden hex worked, nie (10,10) centrum
  const picks = pickAutoImprovements(opts);
  eq(picks.length, 1, 'znajduje ulepszenie na worked');
  eq(picks[0].q, 11, 'wybiera worked hex 11,10');
  eq(picks[0].r, 10, 'wybiera worked hex 11,10');
}

// 3. onlyWorked=false can pick unworked
console.log('3. onlyWorked=false — moze nieobrabiane');
{
  const map = makeFlatMap(20, 20);
  const city = makeCity('c3', 0, 10, 10, 1, {
    ulepszeniaFocus: 'zywnosc',
    ulepszeniaOnlyWorked: false,
  });
  const opts = baseOpts(city, map);
  opts.getOnlyWorked = c => c.ulepszeniaOnlyWorked ?? false;
  opts.getWorkedHexKeys = () => new Set(['99,99']); // zaden realny hex
  const picks = pickAutoImprovements(opts);
  eq(picks.length, 1, 'bez filtra worked — kwalifikujacy hex');
}

// 4. R-AUTO-PRACA-BUDZET-PROCENT-Q1=B — sztuk-cap USUNIĘTY: przy 100% budżetu i dużej puli jedno
// miasto może dostać WIĘCEJ NIŻ jedno ulepszenie w tym samym wywołaniu (przed tą zmianą default
// był maxPerCity=1, więc to zawsze zatrzymywało się na 1 niezależnie od pracaAvailable). To jest
// też test-mutacyjny (e) z dyspozycji: gdyby ktoś przywrócił stary sztuk-cap (albo twardy cap=3),
// ten test złapie regresję (5 !== 1 i 5 !== 3).
console.log('4. brak sztuk-cap — 100% budzetu + duza pula = wiele ulepszen w 1 miescie');
{
  const map = makeFlatMap(30, 30);
  const city = makeCity('c4', 0, 15, 15, 6, { ulepszeniaFocus: 'zywnosc' });
  const opts = baseOpts(city, map);
  opts.pracaAvailable = 200; // 200 / 40 (farma) = dokladnie 5
  opts.pracaBudgetPercent = 100;
  const picks = pickAutoImprovements(opts);
  eq(picks.length, 5, '200 Pracy / 100% budzet / farma=40 -> 5 ulepszen (stary kod capsowalby na 1)');
  assert(picks.every(p => p.key === 'farma'), 'wszystkie 5 to farma (priorytet zywnosc, budzet nie wyczerpany aby przejsc do kolejnego typu)');
}

// 5. wyrab skipped when skipWyrab
console.log('5. skipWyrab — brak wyrab');
{
  const map = makeFlatMap(20, 20);
  for (const hex of Object.values(map.hexes)) hex.nakladka = 'las';
  const city = makeCity('c5', 0, 10, 10, 3, { ulepszeniaFocus: 'zrownowazone' });
  const opts = baseOpts(city, map);
  opts.skipWyrab = true;
  opts.unlockedTechs = new Set(); // wyrab bez tech — ale skipWyrab i tak wycina
  const picks = pickAutoImprovements(opts);
  eq(picks.length, 0, 'skipWyrab — zero ulepszen na samej lesie');
  const hasWyrab = picks.some(p => p.key === 'wyrab');
  eq(hasWyrab, false, 'brak wyrab w wyniku');
}

// 6. surowce focus picks mine on hills
console.log('6. focus surowce — kamieniolom na wzgorzach');
{
  const map = makeHillMap(20, 20);
  const city = makeCity('c6', 0, 10, 10, 3, { ulepszeniaFocus: 'surowce' });
  const opts = baseOpts(city, map);
  opts.unlockedTechs = new Set(['Murarstwo']);
  const picks = pickAutoImprovements(opts);
  eq(picks.length, 1, 'jedno ulepszenie surowcowe');
  eq(picks[0].key, 'kamieniolom', 'surowce wybiera kamieniolom');
}

// 7. R-AUTO-PRACA-BUDZET-PROCENT-Q1=B — getPracaBudgetPercent per-miasto = 50% (zastępuje dawny
// getMaxPerCity=2; ten sam "kształt" pokrycia — override per miasto — nowym mechanizmem).
console.log('7. getPracaBudgetPercent=50%');
{
  const map = makeFlatMap(30, 30);
  const city = makeCity('c7', 0, 15, 15, 5, { ulepszeniaFocus: 'zywnosc' });
  const opts = baseOpts(city, map);
  opts.getPracaBudgetPercent = () => 50;
  opts.pracaAvailable = 200; // budzet = 50% * 200 = 100 -> 2x farma (80), 3cia (120) przekracza
  const picks = pickAutoImprovements(opts);
  assert(picks.length === 2, `getPracaBudgetPercent=50% z puli 200 → 2 picki (got ${picks.length})`);
}

// 8. getPracaBudgetPercent = 75% (zastępuje dawny getMaxPerCity=3)
console.log('8. getPracaBudgetPercent=75%');
{
  const map = makeFlatMap(30, 30);
  const city = makeCity('c8', 0, 15, 15, 6, { ulepszeniaFocus: 'zywnosc' });
  const opts = baseOpts(city, map);
  opts.getPracaBudgetPercent = () => 75;
  opts.pracaAvailable = 200; // budzet = 75% * 200 = 150 -> 3x farma (120), 4ta (160) przekracza
  const picks = pickAutoImprovements(opts);
  assert(picks.length === 3, `getPracaBudgetPercent=75% z puli 200 → 3 picki (got ${picks.length})`);
}

// 9. rezerwa Pracy — nie zjada całej puli (izolowane od %-budżetu: pracaBudgetPercent=100, żeby
// jedynym ograniczeniem był flat AUTO_ULEPSZENIA_PRACA_RESERVE, nie interakcja z %).
// NAPRAWIONO przy tej samej okazji: druga część testu miała pracaAvailable=rezerwa+25=55, co przy
// koszcie farmy=40 (po R_STAWKI_FALA2_MULT×2 na 20 bazowych) NIGDY nie starczało na 1 pick z
// zachowaniem rezerwy (55-40=15 < 30) — asercja failowała od zawsze, niezależnie od tego zadania
// (zweryfikowane na tym samym kodzie PRZED zmianami tej sesji). Naprawione na rezerwa+45=75
// (75-40=35 >= 30 rezerwy).
console.log('9. rezerwa Pracy ' + AUTO_ULEPSZENIA_PRACA_RESERVE);
{
  const map = makeFlatMap(30, 30);
  const city = makeCity('c9', 0, 15, 15, 5, { ulepszeniaFocus: 'zywnosc' });
  const opts = baseOpts(city, map);
  opts.pracaBudgetPercent = 100;
  opts.pracaAvailable = AUTO_ULEPSZENIA_PRACA_RESERVE + 5;
  opts.pracaSurplusThreshold = AUTO_ULEPSZENIA_PRACA_RESERVE;
  const picks = pickAutoImprovements(opts);
  eq(picks.length, 0, 'pula = rezerwa+5, koszt farmy(40) > 5 dostepnych ponad rezerwe -> 0 pickow');
  opts.pracaAvailable = AUTO_ULEPSZENIA_PRACA_RESERVE + 45;
  const picks2 = pickAutoImprovements(opts);
  eq(picks2.length, 1, 'pula = rezerwa+45, starcza na 1 farme (40) z zachowaniem rezerwy -> 1 pick');
}

// 10. (a) R-AUTO-PRACA-BUDZET-PROCENT-Q1=B — 0% = auto-manager CAŁKOWICIE wyłączony, mimo że
// Pracy jest pod dostatkiem (cała zostaje dla gracza).
console.log('10. pracaBudgetPercent=0% — zero auto-ulepszen mimo dostepnej Pracy');
{
  const map = makeFlatMap(30, 30);
  const city = makeCity('c10', 0, 15, 15, 5, { ulepszeniaFocus: 'zywnosc' });
  const opts = baseOpts(city, map);
  opts.pracaAvailable = 500;
  opts.pracaBudgetPercent = 0;
  const picks = pickAutoImprovements(opts);
  eq(picks.length, 0, '0% budzetu -> zero auto-ulepszen, mimo 500 Pracy dostepnej');
}

// 11. (b) 100% = auto-manager wydaje AŻ DO flat-rezerwy, nigdy poniżej.
console.log('11. pracaBudgetPercent=100% — wydaje do flat-rezerwy, nie ponizej');
{
  const map = makeFlatMap(30, 30);
  const city = makeCity('c11', 0, 15, 15, 6, { ulepszeniaFocus: 'zywnosc' });
  const opts = baseOpts(city, map);
  opts.pracaAvailable = 150; // 3x farma(40)=120, dokladnie 30 zostaje = rezerwa
  opts.pracaBudgetPercent = 100;
  opts.pracaSurplusThreshold = AUTO_ULEPSZENIA_PRACA_RESERVE;
  const picks = pickAutoImprovements(opts);
  const totalSpent = picks.reduce((s, p) => s + p.kosztPraca, 0);
  eq(picks.length, 3, '100% + pula 150 -> 3 farmy (120 Pracy), zostaje dokladnie rezerwa 30');
  eq(totalSpent, 120, 'laczny wydatek = 120 (150 - rezerwa 30) -- pula NIGDY nie schodzi ponizej rezerwy');
}

// 12. R-AUTO-PRACA-BUDZET-PROCENT-Q1=B (RUNDA 2 — naprawa FAIL Evaluatora): wartość pośrednia
// (50%) to JEDEN wspólny budżet dla CAŁEGO wywołania (wszystkich miast razem), NIE osobny budżet
// per miasto. PRZED naprawą ten test asercjonował wprost błędną semantykę: "2 miasta x 50% każde
// = 100% pełnej puli" (cityA dostawał 2 picki, cityB TEŻ 2 picki, razem 4 = 160 Pracy ze 100%
// puli 200 — de facto 80% zamiast deklarowanych 50%, przy większej liczbie miast narastałoby do
// N-krotności). PO naprawie: łączny wydatek obu miast razem ≤ 50% × 200 = 100 Pracy, NIEZALEŻNIE
// od liczby miast. Miasta czerpią z TEJ SAMEJ puli PO KOLEI (kolejność = po id) — cityA
// (przetwarzane 1.) zjada budżet do 80 Pracy (2 farmy; 3-cia farma=120>100 przekroczyłaby budżet),
// cityB (2.) dostaje 0 — budżet WSPÓLNY już wyczerpany przez cityA. To jest DOKŁADNIE oczekiwane:
// "ile zostaje dla gracza" liczy się raz dla całego imperium, nie raz na miasto.
// Zachowana ochrona z rundy 1 (jedyne, co Evaluator uznał za słuszne w starym teście 12):
// niezależność OD KOLEJNOŚCI miast — nie per-city rozbicia (to zależy od kolejności, i tak ma
// być — patrz dokumentacja funkcji), tylko ŁĄCZNEJ WYDANEJ SUMY. Test odwraca kolejność w tablicy
// wejściowej `cities` i potwierdza identyczną łączną sumę (funkcja i tak sortuje po id
// wewnętrznie — `orderedCities` — więc kolejność w tablicy wejściowej nie powinna nic zmieniać).
console.log('12. pracaBudgetPercent=50% — JEDEN wspólny budżet dla obu miast razem (nie per miasto)');
{
  const map = makeFlatMap(60, 60);
  const cityA = makeCity('cA', 0, 15, 15, 6, { ulepszeniaFocus: 'zywnosc' });
  const cityB = makeCity('cB', 0, 45, 45, 6, { ulepszeniaFocus: 'zywnosc' });
  const mkOpts = (citiesInInputOrder) => ({
    cities: citiesInInputOrder,
    ownerId: 0,
    map,
    territoryNodes: [
      { q: cityA.q, r: cityA.r, pop: cityA.population, level: 1, ownerId: 0 },
      { q: cityB.q, r: cityB.r, pop: cityB.population, level: 1, ownerId: 0 },
    ],
    placedImprovements: new Map(),
    pracaAvailable: 200,
    pracaBudgetPercent: 50,
    unlockedTechs: new Set(['Rolnictwo', 'Kamieniarstwo']),
    pracaSurplusThreshold: 0,
    skipWyrab: true,
    civArchetype: 'grecy',
  });

  const picks = pickAutoImprovements(mkOpts([cityA, cityB]));
  const picksA = picks.filter(p => p.cityId === 'cA').length;
  const picksB = picks.filter(p => p.cityId === 'cB').length;
  const totalSpent = picks.reduce((s, p) => s + p.kosztPraca, 0);
  eq(picksA, 2, 'miasto cA (przetwarzane 1. wg id): 2 farmy (80 Pracy) — 3-cia (120) przekroczylaby wspolny budzet 100');
  eq(picksB, 0, 'miasto cB (przetwarzane 2.): 0 pickow — wspolny budzet (100) juz wyczerpany przez cA (80), kolejna farma (120) go przekracza');
  eq(totalSpent, 80, 'laczny wydatek OBU miast razem = 80, nie 160 jak w bledej wersji sprzed naprawy');
  assert(totalSpent <= 0.5 * 200, `laczny wydatek (${totalSpent}) <= 50% z puli 200 (100) -- to jest CALY sens naprawy rundy 2`);

  // Niezaleznosc od kolejnosci w tablicy WEJSCIOWEJ (funkcja i tak sortuje po id wewnetrznie).
  const picksReversed = pickAutoImprovements(mkOpts([cityB, cityA]));
  const totalSpentReversed = picksReversed.reduce((s, p) => s + p.kosztPraca, 0);
  eq(totalSpentReversed, totalSpent, 'kolejnosc miast w tablicy WEJSCIOWEJ nie zmienia lacznej wydanej sumy (funkcja sortuje po id sama)');
}

// 13. R-AUTO-PRACA-BUDZET-PROCENT-Q1=B (runda 2) — test-mutacyjny łapiący flat-rezerwę
// zmutowaną na 0. Testy 9/11 odwołują się do AUTO_ULEPSZENIA_PRACA_RESERVE SYMBOLICZNIE po obu
// stronach porównania (`pracaAvailable = AUTO_ULEPSZENIA_PRACA_RESERVE + 45` itd.) — gdyby ktoś
// zmutował samą stałą w źródle (30 -> 0), te testy pozostałyby zielone (tautologia: liczą się
// względem SIEBIE, nie względem realnej, ustalonej wartości). Ten test przypina: (a) samą stałą
// LICZBOWO na 30 (łapie mutację stałej wprost), (b) zachowanie pickera przy puli w zakresie
// 40-65 (wskazanym przez Evaluatora) z LITERALNYM threshold=30 przekazanym z zewnątrz — niezależnie
// od wartości stałej. Farma kosztuje 40 Pracy: pula=60, 60-40=20 < 30 rezerwy -> 0 pickow. Gdyby
// rezerwa realnie nie była egzekwowana (np. potraktowana jako 0), farma zmieściłaby się (20>=0) i
// test złapałby różnicę.
console.log('13. AUTO_ULEPSZENIA_PRACA_RESERVE = 30 (pin literalny, łapie mutację na 0)');
{
  eq(AUTO_ULEPSZENIA_PRACA_RESERVE, 30, 'stala rezerwy przypieta LITERALNIE na 30 (nie porownanie do samej siebie)');

  const map = makeFlatMap(30, 30);
  const city = makeCity('c13', 0, 15, 15, 5, { ulepszeniaFocus: 'zywnosc' });
  const opts = baseOpts(city, map);
  opts.pracaAvailable = 60; // w zakresie 40-65 wskazanym przez Evaluatora jako nietestowany dzis
  opts.pracaBudgetPercent = 100;
  opts.pracaSurplusThreshold = 30; // LITERALNIE, nie przez odwolanie do stalej
  const picks = pickAutoImprovements(opts);
  eq(picks.length, 0, 'pula=60, rezerwa literalna=30, farma=40 Pracy: 60-40=20 < 30 rezerwy -> 0 pickow');
}

// 14. R-AUTO-PRACA-BUDZET-PROCENT-Q1=B (runda 2) — sedno naprawy jako test regresyjny: dla TEGO
// SAMEGO % i TEJ SAMEJ puli startowej, łączny wydatek automatu jest NIEZALEŻNY od liczby miast N.
// 1 miasto i 4 miasta (ten sam właściciel, pct=30%, pula=1000) muszą wydać RAZEM dokładnie tyle
// samo (280 = 7 farm x 40 Pracy; 8-ma farma=320 przekroczyłaby budżet 300=30%x1000). PRZED
// naprawą rundy 2 każde miasto liczyło budżet OSOBNO od pełnej puli, więc 4 miasta wydałyby razem
// do 4x tyle (ograniczone tu tylko flat-rezerwą/pulą, nie %-em) — ten test łapie dokładnie ten
// regres, gdyby ktoś przywrócił per-miasto cityBudget.
console.log('14. laczny wydatek NIEZALEZNY od liczby miast N (1 vs 4 miasta, ten sam %)');
{
  const map = makeFlatMap(100, 100);
  const mkOpts = citiesArr => ({
    cities: citiesArr,
    ownerId: 0,
    map,
    territoryNodes: citiesArr.map(c => ({ q: c.q, r: c.r, pop: c.population, level: 1, ownerId: 0 })),
    placedImprovements: new Map(),
    pracaAvailable: 1000,
    pracaBudgetPercent: 30,
    unlockedTechs: new Set(['Rolnictwo', 'Kamieniarstwo']),
    pracaSurplusThreshold: 0,
    skipWyrab: true,
    civArchetype: 'grecy',
  });

  const oneCity = [makeCity('n1', 0, 10, 10, 3, { ulepszeniaFocus: 'zywnosc' })];
  const picksOne = pickAutoImprovements(mkOpts(oneCity));
  const spentOne = picksOne.reduce((s, p) => s + p.kosztPraca, 0);
  eq(spentOne, 280, '1 miasto, 30% z puli 1000 (budzet=300): 7 farm x 40 = 280 (8. farma=320 przekroczylaby budzet)');

  // Miasta daleko od siebie (>> promien 6), zeby uniknac sporu o wspolne heksy -- nieistotne dla
  // wyniku (tylko n1, pierwsze wg id, cokolwiek dostaje), ale czysciej izoluje test.
  const fourCities = [
    makeCity('n1', 0, 10, 10, 3, { ulepszeniaFocus: 'zywnosc' }),
    makeCity('n2', 0, 10, 50, 3, { ulepszeniaFocus: 'zywnosc' }),
    makeCity('n3', 0, 10, 90, 3, { ulepszeniaFocus: 'zywnosc' }),
    makeCity('n4', 0, 50, 10, 3, { ulepszeniaFocus: 'zywnosc' }),
  ];
  const picksFour = pickAutoImprovements(mkOpts(fourCities));
  const spentFour = picksFour.reduce((s, p) => s + p.kosztPraca, 0);
  eq(spentFour, spentOne, '4 miasta, TEN SAM % i TA SAMA pula startowa: laczny wydatek IDENTYCZNY jak przy 1 miescie (280), nie 4x wiecej');
  assert(spentFour <= 0.3 * 1000, `laczny wydatek (${spentFour}) <= 30% z puli 1000 (300), niezaleznie od N=4 miast`);
}

// 15. R-AUTO-PRACA-BUDZET-PROCENT-Q3=B (2026-08-14, decyzja właściciela) — scenariusz
// DOKŁADNIE ten, który zmierzył Evaluator: polityka imperium 20% (`pracaBudgetPercent`), miasto
// cA ma override 80% (`getPracaBudgetPercent`), miasto cB nie ma override — dziedziczy politykę
// imperium 20%. Pula 1000, rezerwa 30. PRZED tą naprawą: cA liczyło swój pułap OD SWOJEGO
// override (80% × 1000 = 800), niezależnie od polityki imperium — automat wydawał do 800 Pracy
// (80% CAŁEJ puli) na cA, a cB (dziedziczące 20%) dostawało 0, mimo że panel obiecywał mu "20%
// Pracy". PO naprawie: nadrzędny `imperiumBudgetCap` = 20% × 1000 = 200 ogranicza SUMĘ całego
// wywołania niezależnie od override cA — cA (przetwarzane 1. wg id) zjada wspólny pułap do 200
// (5 farm × 40 = 200), cB dostaje 0 (pułap już wyczerpany) — DOKŁADNIE tak jak dziś dla miast BEZ
// override, bo „Autopraca działa z budżetu całej cywilizacji, a nie z budżetu miasta" (słowa
// właściciela). Kluczowa asercja: SUMA <= 200, NIE 800 jak w błędnej wersji sprzed naprawy.
console.log('15. Q3=B — polityka imperium 20% jest TWARDYM pułapem SUMY mimo override miasta 80%');
{
  const map = makeFlatMap(80, 80);
  // Miasta daleko od siebie żeby uniknąć sporu o wspólne heksy (nieistotne dla wyniku — cA,
  // pierwsze wg id, i tak zjada caly pulap samo).
  const cityA = makeCity('cA', 0, 20, 20, 6, { ulepszeniaFocus: 'zywnosc' });
  const cityB = makeCity('cB', 0, 60, 60, 6, { ulepszeniaFocus: 'zywnosc' });
  const opts = {
    cities: [cityA, cityB],
    ownerId: 0,
    map,
    territoryNodes: [
      { q: cityA.q, r: cityA.r, pop: cityA.population, level: 1, ownerId: 0 },
      { q: cityB.q, r: cityB.r, pop: cityB.population, level: 1, ownerId: 0 },
    ],
    placedImprovements: new Map(),
    pracaAvailable: 1000,
    pracaBudgetPercent: 20, // polityka IMPERIUM — źródło nadrzędnego pułapu
    getPracaBudgetPercent: c => (c.id === 'cA' ? 80 : 20), // cA override 80%, cB dziedziczy 20%
    unlockedTechs: new Set(['Rolnictwo', 'Kamieniarstwo']),
    pracaSurplusThreshold: 30,
    skipWyrab: true,
    civArchetype: 'grecy',
  };
  const picks = pickAutoImprovements(opts);
  const picksA = picks.filter(p => p.cityId === 'cA').length;
  const picksB = picks.filter(p => p.cityId === 'cB').length;
  const totalSpent = picks.reduce((s, p) => s + p.kosztPraca, 0);

  assert(totalSpent <= 200, `SEDNO NAPRAWY: laczny wydatek (${totalSpent}) <= 20% z puli 1000 (200) MIMO override cA=80% (bledna wersja sprzed naprawy dawala 800)`);
  eq(totalSpent, 200, 'laczny wydatek = dokladnie 200 (5 farm cA x 40 Pracy) — pulap imperium wyczerpany przez cA');
  eq(picksA, 5, 'cA (override 80%, przetwarzane 1. wg id): 5 farm — 6-ta (240) przekroczylaby wspolny pulap imperium 200');
  eq(picksB, 0, 'cB (dziedziczy polityke imperium 20%): 0 pickow — pulap imperium (200) juz wyczerpany przez cA, mimo ze panel obiecuje mu 20% Pracy');
}

// 16. R-AUTO-PRACA-BUDZET-PROCENT-Q3=B — REGRESSION GUARD: gdy WSZYSTKIE miasta mają TĘ
// SAMĄ politykę (żadne nie ma własnego override, różnego od polityki imperium),
// `imperiumBudgetCap` i suma `cityBudgetCap` dają DOKŁADNIE ten sam wynik co przed tą naprawą
// (Q1=B, runda 2) — nowy nadrzędny pułap jest wtedy zawsze RÓWNY pułapowi per-miasto, więc
// `effectiveCityCap = min(cityBudgetCap, imperiumBudgetCap)` nie zmienia niczego. Test porównuje
// WPROST: (1) wywołanie BEZ getPracaBudgetPercent (jak dawny test 12/14 — jedyne źródło % to
// pracaBudgetPercent), (2) wywołanie Z getPracaBudgetPercent, ale zwracającym TĘ SAMĄ wartość co
// pracaBudgetPercent dla każdego miasta (jawny "brak override" przez inny kod ścieżki) — oba
// MUSZĄ dać identyczny wynik, bo semantycznie to ten sam scenariusz.
console.log('16. Q3=B REGRESSION GUARD — bez override (wszystkie miasta = polityka imperium) wynik identyczny jak przed naprawa');
{
  const map = makeFlatMap(60, 60);
  const cityA = makeCity('cA', 0, 15, 15, 6, { ulepszeniaFocus: 'zywnosc' });
  const cityB = makeCity('cB', 0, 45, 45, 6, { ulepszeniaFocus: 'zywnosc' });
  const mkOpts = (extra) => ({
    cities: [cityA, cityB],
    ownerId: 0,
    map,
    territoryNodes: [
      { q: cityA.q, r: cityA.r, pop: cityA.population, level: 1, ownerId: 0 },
      { q: cityB.q, r: cityB.r, pop: cityB.population, level: 1, ownerId: 0 },
    ],
    placedImprovements: new Map(),
    pracaAvailable: 200,
    pracaBudgetPercent: 50,
    unlockedTechs: new Set(['Rolnictwo', 'Kamieniarstwo']),
    pracaSurplusThreshold: 0,
    skipWyrab: true,
    civArchetype: 'grecy',
    ...extra,
  });

  // (1) BEZ getPracaBudgetPercent — jedyne zrodlo % to pracaBudgetPercent (jak stary test 12/14).
  const picksNoOverrideFn = pickAutoImprovements(mkOpts({}));
  const spentNoOverrideFn = picksNoOverrideFn.reduce((s, p) => s + p.kosztPraca, 0);

  // (2) Z getPracaBudgetPercent, ale zwracajacym DOKLADNIE te sama wartosc co pracaBudgetPercent
  // dla kazdego miasta — jawny "brak realnego override" inna sciezka kodu.
  const picksExplicitSame = pickAutoImprovements(mkOpts({ getPracaBudgetPercent: () => 50 }));
  const spentExplicitSame = picksExplicitSame.reduce((s, p) => s + p.kosztPraca, 0);

  eq(spentNoOverrideFn, 80, 'bez override: laczny wydatek = 80 (2 farmy cA x 40) — jak test 12 przed ta naprawa (niezmienione)');
  eq(spentExplicitSame, spentNoOverrideFn, 'getPracaBudgetPercent zwracajacy TA SAMA wartosc co polityka imperium daje IDENTYCZNY wynik jak brak override — nowy pulap imperium nie zmienia zachowania gdy brak realnego override');
}

console.log('-- 17. FALA 292: STRUKTURA (regex na main.ts) — split absolutny jest policzony przed pickerem, a picker nie dzieli go drugi raz --');
{
  const MAIN_TS = path.resolve(__dirname, '..', 'src', 'main.ts');
  const mainSrc = fs.readFileSync(MAIN_TS, 'utf8');

  const RE_SPLIT_CALL =
    /const playerPracaBudget = splitEmpirePracaBudget\(\s*playerPracaPool,\s*effectivePracaSplitForOwner\(0\)\.procentUlepszenia,/;
  const RE_ABSOLUTE_CAP = /improvementBudgetCap: playerPracaBudget\.doUlepszen,/;
  const RE_NO_SECOND_PERCENT_CAP = /pracaBudgetPercent: 100,/;
  const RE_OWNER_SPLIT_SAVE =
    /ownerDefaultPracaSplit:\s*Array\.from\(ownerDefaultPracaSplit\.entries\(\)\)/;
  const RE_OWNER_SPLIT_LOAD =
    /const savedPracaSplit = saved\.meta\?\.ownerDefaultPracaSplit/;
  const RE_OWNER_SPLIT_MIGRATION =
    /ownerDefaultPracaSplit\.set\(oid,\s*\{\s*procentUlepszenia:\s*clampPracaWspolnyWorekPercent\(raw\?\.procentUlepszenia\)/s;
  assert(RE_SPLIT_CALL.test(mainSrc),
    '17a: main liczy split całej puli przed pickerem');
  assert(RE_ABSOLUTE_CAP.test(mainSrc),
    '17b: picker dostaje absolutny budżet ulepszeń');
  assert(RE_NO_SECOND_PERCENT_CAP.test(mainSrc),
    '17c: picker nie nakłada drugiego procentowego capu');
  assert(RE_OWNER_SPLIT_SAVE.test(mainSrc) && RE_OWNER_SPLIT_LOAD.test(mainSrc),
    '17e: nadrzędny split ownera ma jawny roundtrip zapisu/odczytu');
  assert(RE_OWNER_SPLIT_MIGRATION.test(mainSrc),
    '17f: odczyt starego/brakującego splitu zaciska tylko warstwę 0–50%');

  const CALL_COUNT = (mainSrc.match(/pickAutoImprovements\(/g) || []).length;
  eq(CALL_COUNT, 1, '17d: dokladnie JEDNO wywolanie pickAutoImprovements() w main.ts -- jesli ta liczba sie zmieni, straznik 17a nie pokrywa automatycznie nowego wywolania i wymaga rewizji');
}

console.log('-- 18. FALA 292: realny picker respektuje absolutny split mimo starego override per-miasto --');
{
  const map = makeFlatMap(60, 60);
  const cityA = makeCity('cA', 0, 15, 15, 6, { ulepszeniaFocus: 'zywnosc' });
  const cityB = makeCity('cB', 0, 45, 45, 6, { ulepszeniaFocus: 'zywnosc' });
  const picks = pickAutoImprovements({
    cities: [cityA, cityB],
    ownerId: 0,
    map,
    territoryNodes: [
      { q: cityA.q, r: cityA.r, pop: cityA.population, level: 1, ownerId: 0 },
      { q: cityB.q, r: cityB.r, pop: cityB.population, level: 1, ownerId: 0 },
    ],
    placedImprovements: new Map(),
    pracaAvailable: 200,
    pracaBudgetPercent: 100,
    improvementBudgetCap: 40,
    getPracaBudgetPercent: () => 80,
    unlockedTechs: new Set(['Rolnictwo', 'Kamieniarstwo']),
    pracaSurplusThreshold: 0,
    skipWyrab: true,
  });
  const spent = picks.reduce((sum, pick) => sum + pick.kosztPraca, 0);
  eq(spent, 40, 'override 80% nie przebija absolutnego capu 40 Pracy (jedno ulepszenie)');
  assert(spent <= 100, 'realny wydatek pozostaje poniżej 50% puli 200 Pracy');
}

console.log(`\nauto-improvements-test: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
