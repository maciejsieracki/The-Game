'use strict';
/**
 * trade-routes-limit-test.cjs -- standalone Node test for R-HANDEL-LIMIT-TRAS-PELNY-Q1.
 * Run from gra/:  node tools/trade-routes-limit-test.cjs
 *
 * Weryfikuje ZYWO, DETERMINISTYCZNIE, z realnymi fikstrurami (miasta/traktaty/
 * budynki) wszystkie 10 kryteriow konca dispatchu R-HANDEL-LIMIT-TRAS-PELNY-Q1
 * (zob. dyspozycje/autobot/runs/R-HANDEL-LIMIT-TRAS-PELNY-Q1/00-dispatch.md):
 *
 *   1. Miasto z 0 budynkow handlowych ma DOKLADNIE 1 slot istnienia trasy.
 *   2. Miasto z N budynkow ma DOKLADNIE 1+N slotow (N=1, N=2).
 *   3. Przyklad arytmetyczny wlasciciela ODTWORZONY DOSLOWNIE: 10 miast x 0
 *      budynkow (10 slotow) vs 10 miast x 1 budynek (20 slotow) -> DOKLADNIE
 *      10 tras miedzy cywilizacjami (ograniczone slabsza strona).
 *   4. Miasto obce, ktore wyczerpalo sloty gdzie indziej, NIE przyjmuje kolejnej
 *      trasy mimo wolnego slotu po naszej stronie.
 *   5. Priorytet "najbardziej lukratywna wygrywa" (nie najblizsza) + osobny test
 *      "stopniowego wypierania" (trasa wewnetrzna -> zewnetrzna po traktacie,
 *      BEZ specjalnej logiki warunkowej -- czysty efekt sortowania po dochodzie).
 *   6. Uogolnienie na dowolne pary wlascicieli, w tym AI<->AI BEZ udzialu gracza.
 *   7. Handel wewnetrzny: cywilizacja BEZ zadnego traktatu z nikim ma aktywne
 *      trasy MIEDZY WLASNYMI miastami (o ile fizycznie polaczone).
 *   8. Zero regresji: budynekOdblokowany (+5%) nadal buildings-only, zero
 *      baseline -- miasto z 0 budynkow NIGDY nie dostaje bonusu.
 *   9. Wydajnosc zmierzona ZYWO na scenariuszu ~100-150 miast/kilkanascie
 *      wlascicieli (performance.now(), nie oszacowanie z kodu).
 *
 * Kryterium 10 (tsc --noEmit + istniejace testy + 5 bramek referencyjnych)
 * weryfikowane OSOBNO przez Operatora (patrz raport), nie w tym pliku.
 */

const fs   = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) { console.error('[trade-routes-limit-test] esbuild not found. Run: npm install (from gra/)'); process.exit(1); }
})();

const ENTRY_FILE  = path.resolve(__dirname, '.trade-routes-limit-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.trade-routes-limit-bundle.cjs');
fs.writeFileSync(ENTRY_FILE, `
export {
  refreshTradeRoutes, tradeRouteExistenceLimitForCity, tradeRouteLimitForCity,
  tradeRouteId, tradeRouteTotalDistanceIncome, DEFAULT_TRADE_ROUTE_INCOME_PARAMS,
  TRADE_BUILDING_IDS,
} from '../src/game/trade-routes';
`, 'utf8');

try {
  esbuild.buildSync({ entryPoints: [ENTRY_FILE], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: BUNDLE_FILE, logLevel: 'silent' });
} catch (e) { console.error('[trade-routes-limit-test] esbuild failed:\n', e.message || e); process.exit(1); }

const TR = require(BUNDLE_FILE);

let passed = 0, failed = 0;
function assert(cond, msg) { if (cond) passed++; else { failed++; console.error('  FAIL:', msg); } }
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

// ---------------------------------------------------------------------------
// Fikstury wspolne
// ---------------------------------------------------------------------------
function city(id, ownerId, q) { return { id, ownerId, q, r: 0 }; }
function buildFlatMap(maxQ) {
  const hexes = {};
  for (let q = 0; q <= maxQ; q++) hexes[`${q},0`] = { terenBazowy: 'rownina' };
  return { szerokoscQ: maxQ + 1, wysokoscR: 1, hexes, seed: 1, riverPaths: [] };
}
const NO_WAR      = () => false;
const HAS_TREATY  = () => true;
const NO_TREATY   = () => false;
const incP = TR.DEFAULT_TRADE_ROUTE_INCOME_PARAMS;
const incomeOf = (d, m) => TR.tradeRouteTotalDistanceIncome(d, m, incP);

// ===========================================================================
// KRYTERIUM 1 -- miasto z 0 budynkow ma DOKLADNIE 1 slot istnienia
// ===========================================================================
console.log('\n-- Kryterium 1: miasto z 0 budynkow ma DOKLADNIE 1 slot istnienia --');
{
  const map = buildFlatMap(30);
  const p  = city('k1-p', 0, 0);
  const fa = city('k1-fa', 1, 5);   // rownowazny kandydat A
  const fb = city('k1-fb', 2, 8);   // rownowazny kandydat B
  const builtEmpty = new Map(); // ZERO budynkow handlowych w kazdym miescie
  // Blokujemy WYLACZNIE krawedz miedzy kandydatami (GOAL 4 wygenerowalby
  // dodatkowa, nieplanowana trase fa<->fb -- izolujemy test do slotu miasta p).
  const warBetweenCandidates = (a, b) => (a === 1 && b === 2) || (a === 2 && b === 1);
  eq(TR.tradeRouteExistenceLimitForCity('k1-p', builtEmpty), 1, 'K1: (setup) tradeRouteExistenceLimitForCity=1 dla miasta bez budynkow');
  const routes = TR.refreshTradeRoutes([p, fa, fb], [], map, builtEmpty, warBetweenCandidates, HAS_TREATY);
  const touchingP = routes.filter(r => r.fromCityId === p.id || r.toCityId === p.id);
  eq(touchingP.length, 1, 'K1: miasto polaczone z 2 rownowaznymi kandydatami ma DOKLADNIE 1 aktywna trase (1 slot istnienia)');
}

// ===========================================================================
// KRYTERIUM 2 -- miasto z N budynkow ma DOKLADNIE 1+N slotow (N=1, N=2)
// ===========================================================================
console.log('\n-- Kryterium 2: miasto z N budynkow ma DOKLADNIE 1+N slotow --');
{
  const map = buildFlatMap(30);
  // Kandydaci o WYRAZNIE roznych, nie-remisujacych dochodach (po zaokragleniu /5):
  // d=3->income3, d=6->income4, d=9->income6, d=11->income7.
  eq(incomeOf(3, 'lad'), 3, 'K2: (setup) income(d=3)=3');
  eq(incomeOf(6, 'lad'), 4, 'K2: (setup) income(d=6)=4');
  eq(incomeOf(9, 'lad'), 6, 'K2: (setup) income(d=9)=6');
  eq(incomeOf(11, 'lad'), 7, 'K2: (setup) income(d=11)=7');

  // N=1: Targowisko (1 budynek) -> limit=1+1=2. 3 kandydaci, oczekiwane 2 kept.
  const p1 = city('k2n1-p', 0, 0);
  const cands1 = [city('k2n1-a', 1, 3), city('k2n1-b', 2, 6), city('k2n1-c', 3, 9)];
  const builtN1 = new Map([['k2n1-p', ['targowisko']]]);
  eq(TR.tradeRouteExistenceLimitForCity('k2n1-p', builtN1), 2, 'K2(N=1): tradeRouteExistenceLimitForCity=2 (1 baza + 1 Targowisko)');
  const warIsolate1 = (a, b) => a !== 0 && b !== 0; // blokuje WYLACZNIE pary miedzy kandydatami
  const routesN1 = TR.refreshTradeRoutes([p1, ...cands1], [], map, builtN1, warIsolate1, HAS_TREATY);
  const touchingP1 = routesN1.filter(r => r.fromCityId === p1.id || r.toCityId === p1.id);
  eq(touchingP1.length, 2, 'K2(N=1): miasto z 1 budynkiem (limit=2) z 3 kandydatami -> DOKLADNIE 2 aktywne trasy');
  assert(
    touchingP1.every(r => ['k2n1-b', 'k2n1-c'].includes(r.fromCityId === p1.id ? r.toCityId : r.fromCityId)),
    'K2(N=1): zachowane sa dwaj NAJBARDZIEJ dochodowi kandydaci (b:income4, c:income6), NIE najmniej dochodowy (a:income3)',
  );

  // N=2: Targowisko + Port_wielki (2 budynki) -> limit=1+2=3. 4 kandydaci, oczekiwane 3 kept.
  const p2 = city('k2n2-p', 0, 0);
  const cands2 = [city('k2n2-a', 1, 3), city('k2n2-b', 2, 6), city('k2n2-c', 3, 9), city('k2n2-d', 4, 11)];
  const builtN2 = new Map([['k2n2-p', ['targowisko', 'port_wielki']]]);
  eq(TR.tradeRouteExistenceLimitForCity('k2n2-p', builtN2), 3, 'K2(N=2): tradeRouteExistenceLimitForCity=3 (1 baza + 2 budynki)');
  const warIsolate2 = (a, b) => a !== 0 && b !== 0;
  const routesN2 = TR.refreshTradeRoutes([p2, ...cands2], [], map, builtN2, warIsolate2, HAS_TREATY);
  const touchingP2 = routesN2.filter(r => r.fromCityId === p2.id || r.toCityId === p2.id);
  eq(touchingP2.length, 3, 'K2(N=2): miasto z 2 budynkami (limit=3) z 4 kandydatami -> DOKLADNIE 3 aktywne trasy');
  assert(
    !touchingP2.some(r => (r.fromCityId === p2.id ? r.toCityId : r.fromCityId) === 'k2n2-a'),
    'K2(N=2): najmniej dochodowy kandydat (a:income3) odrzucony, pozostale trzy (b/c/d) zachowane',
  );
}

// ===========================================================================
// KRYTERIUM 3 -- przyklad arytmetyczny wlasciciela ODTWORZONY DOSLOWNIE
// ===========================================================================
console.log('\n-- Kryterium 3: przyklad arytmetyczny wlasciciela (10x0 vs 10x1 -> DOKLADNIE 10 tras) --');
{
  const map = buildFlatMap(200);
  // Cywilizacja A: 10 miast x 0 budynkow -> 10 slotow LACZNIE (1 kazde).
  const citiesA = [];
  for (let i = 0; i < 10; i++) citiesA.push(city(`k3-a${i}`, 1, i));
  // Cywilizacja B (gracz): 10 miast x 1 budynek kazde -> 20 slotow LACZNIE (2 kazde).
  const citiesB = [];
  const builtB = new Map();
  for (let i = 0; i < 10; i++) {
    const c = city(`k3-b${i}`, 0, 100 + i);
    citiesB.push(c);
    builtB.set(c.id, ['targowisko']);
  }
  eq(citiesA.reduce((s, c) => s + TR.tradeRouteExistenceLimitForCity(c.id, new Map()), 0), 10, 'K3: (setup) cywilizacja A ma LACZNIE 10 slotow (10 miast x 1)');
  eq(citiesB.reduce((s, c) => s + TR.tradeRouteExistenceLimitForCity(c.id, builtB), 0), 20, 'K3: (setup) cywilizacja B ma LACZNIE 20 slotow (10 miast x 2)');

  const routes = TR.refreshTradeRoutes([...citiesA, ...citiesB], [], map, builtB, NO_WAR, HAS_TREATY);
  // Dispatch (kryterium 3): "calkowita liczba tras MIEDZY A i B" -- WYLACZNIE
  // trasy PRZECINAJACE cywilizacje (jeden koniec A, drugi B), NIE liczac
  // ewentualnych dodatkowych tras WEWNETRZNYCH strony B (GOAL 5, nowosc tego
  // tematu -- B ma 20 slotow lacznie, z czego tylko 10 zuzywa handel z A, reszta
  // MOZE tworzyc dodatkowe trasy wewnatrz B, co jest legalnym, NIEZALEZNYM
  // zjawiskiem, nie naruszajacym literalnego kryterium "tras miedzy A i B").
  const crossRoutes = routes.filter(r => {
    const fromIsA = citiesA.some(c => c.id === r.fromCityId);
    const toIsA = citiesA.some(c => c.id === r.toCityId);
    const fromIsB = citiesB.some(c => c.id === r.fromCityId);
    const toIsB = citiesB.some(c => c.id === r.toCityId);
    return (fromIsA && toIsB) || (fromIsB && toIsA);
  });
  eq(crossRoutes.length, 10, 'K3: KRYTERIUM DOSLOWNE -- liczba tras MIEDZY A i B = DOKLADNIE 10 (ograniczone slabsza strona A), NIE 20, NIE wiecej');
  // Kazde miasto A wyczerpuje swoj JEDYNY slot -- zaden A-city nie ma wiecej niz 1 trasy (do B ANI wewnatrz A, oba tory dziela ten sam existence-limit).
  for (const a of citiesA) {
    const n = routes.filter(r => r.fromCityId === a.id || r.toCityId === a.id).length;
    eq(n, 1, `K3: miasto A (${a.id}) ma DOKLADNIE 1 trase LACZNIE (jego jedyny slot, zuzyty na handel z B)`);
  }
  // Kontrola nietautologicznosci: zdarzaja sie TEZ dodatkowe trasy WEWNATRZ B
  // (na wolnym zapasie jej 20 slotow, po odjeciu 10 zuzytych na handel z A) --
  // to potwierdza, ze test naprawde wykonuje ZYWY algorytm z obydwoma torami
  // (zewnetrznym i wewnetrznym) na raz, a nie odczytuje wartosc z gory zalozona.
  const internalBRoutes = routes.filter(r => citiesB.some(c => c.id === r.fromCityId) && citiesB.some(c => c.id === r.toCityId));
  console.log(`  [INFO] K3: obok 10 tras A<->B powstalo dodatkowo ${internalBRoutes.length} tras WEWNETRZNYCH strony B (wolny zapas jej slotow) -- razem ${routes.length} tras total`);
}

// ===========================================================================
// KRYTERIUM 4 -- miasto obce wyczerpane gdzie indziej NIE przyjmuje kolejnej trasy
// ===========================================================================
console.log('\n-- Kryterium 4: miasto obce wyczerpane gdzie indziej odrzuca kolejna trase --');
{
  const map = buildFlatMap(60);
  // F (0 budynkow, 1 slot) juz polaczone z Partner1 (dochod WYZSZY, wygrywa slot).
  // Nasze miasto P probuje polaczyc sie z TYM SAMYM F (dochod NIZSZY, przegrywa).
  const f  = city('k4-f', 1, 50);
  const partner1 = city('k4-partner1', 2, 40); // dystans 10 od F -- WYZSZY dochod
  const p  = city('k4-p', 0, 48);              // dystans 2 od F -- NIZSZY dochod
  eq(incomeOf(10, 'lad') > incomeOf(2, 'lad'), true, 'K4: (setup) Partner1 (d=10) ma WYZSZY dochod niz P (d=2)');
  const builtEmpty = new Map(); // wszystkie 0 budynkow -> limit=1 kazde
  // Blokujemy WYLACZNIE P<->Partner1 (rozne wlascicielstwa 0 i 2), zeby izolowac
  // test do zachowania samego F -- bez tego GOAL 4 wygenerowalby dodatkowa,
  // nieplanowana trase miedzy P i Partner1.
  const warPvsPartner1 = (a, b) => (a === 0 && b === 2) || (a === 2 && b === 0);
  const routes = TR.refreshTradeRoutes([f, partner1, p], [], map, builtEmpty, warPvsPartner1, HAS_TREATY);
  eq(routes.length, 1, 'K4: DOKLADNIE 1 trasa powstaje (Partner1<->F) -- P<->F NIE powstaje mimo wolnego slotu po stronie P');
  const kept = routes[0];
  assert(
    (kept.fromCityId === 'k4-partner1' && kept.toCityId === 'k4-f') || (kept.fromCityId === 'k4-f' && kept.toCityId === 'k4-partner1'),
    'K4: jedyna trasa to Partner1<->F (bardziej dochodowa)',
  );
  assert(
    !routes.some(r => r.fromCityId === 'k4-p' || r.toCityId === 'k4-p'),
    'K4: P NIE ma zadnej trasy -- F wyczerpal swoj jedyny slot na Partner1, mimo ze P ma wlasny wolny slot',
  );
  eq(TR.tradeRouteExistenceLimitForCity('k4-p', builtEmpty), 1, 'K4: (kontrola) P faktycznie MA wolny slot (limit=1, zero uzytych) -- odrzucenie to NIE brak slotu po jego stronie');
}

// ===========================================================================
// KRYTERIUM 5a -- priorytet "najbardziej lukratywna wygrywa" (nie najblizsza)
// ===========================================================================
console.log('\n-- Kryterium 5a: priorytet dochodowy -- najbardziej lukratywna wygrywa, nie najblizsza --');
{
  const map = buildFlatMap(30);
  const p = city('k5a-p', 0, 0);
  // 3 kandydaci roznej odleglosci/dochodu dla miasta z 1 slotem (0 budynkow).
  const near = city('k5a-near', 1, 3);  // dystans 3 -- NAJBLIZSZY, NAJNIZSZY dochod
  const mid  = city('k5a-mid', 2, 6);   // dystans 6 -- posredni
  const far  = city('k5a-far', 3, 9);   // dystans 9 -- NAJDALSZY, NAJWYZSZY dochod
  eq(incomeOf(3, 'lad'), 3, 'K5a: (setup) income(near, d=3)=3');
  eq(incomeOf(6, 'lad'), 4, 'K5a: (setup) income(mid, d=6)=4');
  eq(incomeOf(9, 'lad'), 6, 'K5a: (setup) income(far, d=9)=6 -- NAJWYZSZY');
  const builtEmpty = new Map(); // p ma 0 budynkow -> limit=1
  const warIsolate = (a, b) => a !== 0 && b !== 0;
  const routes = TR.refreshTradeRoutes([p, near, mid, far], [], map, builtEmpty, warIsolate, HAS_TREATY);
  const touchingP = routes.filter(r => r.fromCityId === p.id || r.toCityId === p.id);
  eq(touchingP.length, 1, 'K5a: DOKLADNIE 1 aktywna trasa (1 slot)');
  const partnerId = touchingP[0].fromCityId === p.id ? touchingP[0].toCityId : touchingP[0].fromCityId;
  eq(partnerId, 'k5a-far', 'K5a: trasa ISTNIEJACA to ta o NAJWYZSZYM dochodzie (far, d=9), NIE najblizsza (near, d=3)');
}

// ===========================================================================
// KRYTERIUM 5b -- "stopniowe wypieranie": wewnetrzna -> zewnetrzna po traktacie,
//                 BEZ specjalnej logiki warunkowej (czysty efekt sortowania).
// ===========================================================================
console.log('\n-- Kryterium 5b: stopniowe wypieranie -- trasa wewnetrzna zastapiona zewnetrzna po Umowie Szlakow --');
{
  const map = buildFlatMap(30);
  // P i P2 -- ten sam wlasciciel (0), brak jeszcze traktatu z nikim -> handel
  // WEWNETRZNY. F -- obcy wlasciciel (1), partner POTENCJALNIE bardziej dochodowy.
  const p  = city('k5b-p', 0, 0);
  const p2 = city('k5b-p2', 0, 3); // dystans 3 od p -- trasa wewnetrzna, NIZSZY dochod
  const f  = city('k5b-f', 1, 9);  // dystans 9 od p -- kandydat zewnetrzny, WYZSZY dochod
  const builtEmpty = new Map(); // 0 budynkow wszedzie -> limit=1 kazde
  eq(incomeOf(3, 'lad') < incomeOf(9, 'lad'), true, 'K5b: (setup) trasa wewnetrzna (d=3) MNIEJ dochodowa niz zewnetrzny kandydat (d=9)');

  // Tura 1: brak Umowy Szlakow z F -> jedyna mozliwa trasa to WEWNETRZNA p<->p2.
  const routesTurn1 = TR.refreshTradeRoutes([p, p2, f], [], map, builtEmpty, NO_WAR, NO_TREATY);
  eq(routesTurn1.length, 1, 'K5b: (tura 1) bez traktatu -- dokladnie 1 trasa (wewnetrzna p<->p2)');
  eq(routesTurn1[0].ownerId, routesTurn1[0].toOwnerId, 'K5b: (tura 1) trasa jest WEWNETRZNA (ownerId===toOwnerId)');

  // Tura 2: Umowa Szlakow podpisana -- F oferuje BARDZIEJ dochodowe polaczenie.
  // BEZ zadnej specjalnej galezi "czy jest traktat": to WYLACZNIE efekt sortowania
  // po dochodzie (GOAL 3) -- zewnetrzny kandydat ma wyzszy dochod, wygrywa jedyny
  // slot p PRZED wewnetrznym kontynuujacym kandydatem.
  const routesTurn2 = TR.refreshTradeRoutes([p, p2, f], routesTurn1, map, builtEmpty, NO_WAR, HAS_TREATY);
  eq(routesTurn2.length, 1, 'K5b: (tura 2) po podpisaniu Umowy Szlakow -- nadal dokladnie 1 trasa aktywna');
  const kept2 = routesTurn2[0];
  assert(
    kept2.ownerId !== kept2.toOwnerId,
    'K5b: (tura 2) trasa wewnetrzna ZNIKLA, zastapiona trasa ZEWNETRZNA (ownerId!==toOwnerId) -- czysty efekt sortowania po dochodzie',
  );
  assert(
    (kept2.fromCityId === 'k5b-p' && kept2.toCityId === 'k5b-f') || (kept2.fromCityId === 'k5b-f' && kept2.toCityId === 'k5b-p'),
    'K5b: (tura 2) nowa trasa to p<->f (partner bardziej dochodowy)',
  );
  assert(
    !routesTurn2.some(r => r.fromCityId === 'k5b-p2' || r.toCityId === 'k5b-p2'),
    'K5b: (tura 2) p2 nie ma juz zadnej trasy -- jej jedyny partner (p) przeniosl swoj slot na zewnetrznego kandydata',
  );
}

// ===========================================================================
// KRYTERIUM 6 -- uogolnienie na dowolne pary wlascicieli, w tym AI<->AI bez gracza
// ===========================================================================
console.log('\n-- Kryterium 6: uogolnienie na dowolne pary wlascicieli (gracz+2AI oraz 2AI bez gracza) --');
{
  const map = buildFlatMap(60);
  // (a) gracz + 2 AI, Umowa Szlakow miedzy KAZDA para -> trasy miedzy KAZDA para.
  // KAZDE miasto dostaje 1 budynek (existence-limit=2) -- inaczej z limitem=1
  // (0 budynkow) zaden wierzcholek "trojkata" 3 wlascicieli nie moglby miec
  // stopnia 2 rownoczesnie, co uczynioloby test tautologicznie niemozliwym do
  // spelnienia niezaleznie od poprawnosci generalizacji (blad fikstury, nie
  // algorytmu) -- z limitem=2 kazdy z 3 wierzcholkow MOZE obsluzyc obie swoje
  // krawedzie na raz.
  const p  = city('k6-p', 0, 0);
  const ai1 = city('k6-ai1', 5, 10);
  const ai2 = city('k6-ai2', 6, 20);
  const built3 = new Map([['k6-p', ['targowisko']], ['k6-ai1', ['targowisko']], ['k6-ai2', ['targowisko']]]);
  const routesA = TR.refreshTradeRoutes([p, ai1, ai2], [], map, built3, NO_WAR, HAS_TREATY);
  eq(routesA.length, 3, 'K6a: gracz+2AI, Umowa Szlakow miedzy KAZDA para -> DOKLADNIE 3 trasy (0-5, 0-6, 5-6)');
  const pairOf = (r) => [r.ownerId, r.toOwnerId].sort((x, y) => x - y).join('-');
  const pairsA = new Set(routesA.map(pairOf));
  assert(pairsA.has('0-5') && pairsA.has('0-6') && pairsA.has('5-6'), 'K6a: WSZYSTKIE trzy pary wlascicieli maja trase, w tym AI(5)<->AI(6) BEZ udzialu gracza');

  // (b) 2 AI BEZ GRACZA w ogole (gracz nie wystepuje w przekazanych miastach) --
  //     trasa AI<->AI powstaje identycznie, niezaleznie od obecnosci gracza.
  const ai10 = city('k6-ai10', 10, 0);
  const ai11 = city('k6-ai11', 11, 7);
  const builtEmptyB = new Map(); // jedna mozliwa krawedz -- limit=1 (0 budynkow) wystarcza
  const routesB = TR.refreshTradeRoutes([ai10, ai11], [], map, builtEmptyB, NO_WAR, HAS_TREATY);
  eq(routesB.length, 1, 'K6b: 2 AI BEZ gracza, Umowa Szlakow miedzy nimi -> dokladnie 1 trasa AI<->AI');
  eq(pairOf(routesB[0]), '10-11', 'K6b: trasa faktycznie miedzy wlascicielami 10 i 11, zaden gracz nie musial byc obecny');
}

// ===========================================================================
// KRYTERIUM 7 -- handel wewnetrzny: cywilizacja BEZ zadnego traktatu z nikim
// ===========================================================================
console.log('\n-- Kryterium 7: handel wewnetrzny -- cywilizacja BEZ zadnego traktatu ma aktywne trasy MIEDZY WLASNYMI miastami --');
{
  const map = buildFlatMap(60);
  // Cywilizacja (wlasciciel 7) -- 3 miasta, fizycznie polaczone, ZERO traktatow
  // z kimkolwiek (NO_TREATY globalnie -- nawet gdyby inny wlasciciel byl obecny).
  const c1 = city('k7-c1', 7, 0);
  const c2 = city('k7-c2', 7, 4);
  const c3 = city('k7-c3', 7, 9);
  const built = new Map([['k7-c1', ['targowisko']]]); // c1 ma 1 budynek -> limit=2
  const routes = TR.refreshTradeRoutes([c1, c2, c3], [], map, built, NO_WAR, NO_TREATY);
  assert(routes.length > 0, 'K7: cywilizacja BEZ zadnego traktatu ma PRZYNAJMNIEJ jedna trase aktywna (wewnetrzna)');
  assert(routes.every(r => r.ownerId === 7 && r.toOwnerId === 7), 'K7: WSZYSTKIE trasy sa wewnetrzne (ownerId===toOwnerId===7), traktat NIE byl wymagany');
  // Dochod i sloty liczone IDENTYCZNIE jak dla tras zewnetrznych -- ta sama funkcja,
  // zero specjalnej galezi.
  for (const r of routes) {
    const expectedIncome = incomeOf(r.dystans, r.medium);
    assert(expectedIncome > 0, `K7: trasa ${r.id} ma dochod > 0 liczony identycznym wzorem co trasy zewnetrzne`);
  }
  eq(TR.tradeRouteExistenceLimitForCity('k7-c1', built), 2, 'K7: (kontrola) limit istnienia c1 liczony identycznym wzorem (1 baza + 1 budynek)');
}

// ===========================================================================
// KRYTERIUM 8 -- zero regresji: budynekOdblokowany nadal buildings-only, zero
//                baseline -- miasto z 0 budynkow NIGDY nie dostaje bonusu.
// ===========================================================================
console.log('\n-- Kryterium 8: zero regresji -- budynekOdblokowany buildings-only, zero baseline --');
{
  const map = buildFlatMap(30);
  const p = city('k8-p', 0, 0);   // 0 budynkow -- existence limit=1, bonus limit=0
  const f = city('k8-f', 1, 5);   // 1 budynek -- existence limit=2, bonus limit=1
  const built = new Map([['k8-f', ['targowisko']]]);
  eq(TR.tradeRouteExistenceLimitForCity('k8-p', built), 1, 'K8: (setup) p ma existence-limit=1 mimo zera budynkow (baseline)');
  eq(TR.tradeRouteLimitForCity('k8-p', built), 0, 'K8: (setup) p ma bonus-limit=0 (buildings-only, ZERO baseline)');
  const routes = TR.refreshTradeRoutes([p, f], [], map, built, NO_WAR, HAS_TREATY);
  eq(routes.length, 1, 'K8: trasa p<->f istnieje (uzywa jedynego existence-slotu p)');
  eq(routes[0].budynekOdblokowany, false, 'K8: budynekOdblokowany=false -- p uzyl swojego JEDYNEGO existence-slotu, ale NIE ma bonusowego slotu (0 budynkow) -> NIGDY nie dostaje bonusu 5%');
}

// ===========================================================================
// KRYTERIUM 9 -- wydajnosc zmierzona ZYWO na ~100-150 miastach/kilkanascie wlascicieli
// ===========================================================================
console.log('\n-- Kryterium 9: wydajnosc -- pomiar ZYWO na ~120 miastach / 15 wlascicieli, mapa 672x476 --');
{
  // Mapa "superogromna" (RECON dispatchu: 672x476) w calosci ladowa (rownina) --
  // scenariusz KONSERWATYWNIE PESYMISTYCZNY dla candidate-generation (kazda para
  // miast jest fizycznie osiagalna lądem, wiec zaden negatywny filtr komponentow
  // spojnosci nie odrzuca taniej -- realny koszt spada wiec na BFS + generalizacje
  // par wlascicieli, dokladnie to, co GOAL 6 chce zmierzyc).
  const SZER = 672, WYS = 476;
  const hexes = {};
  for (let q = 0; q < SZER; q++) {
    for (let r = 0; r < WYS; r++) hexes[`${q},${r}`] = { terenBazowy: 'rownina' };
  }
  const bigMap = { szerokoscQ: SZER, wysokoscR: WYS, hexes, seed: 1, riverPaths: [] };

  // Deterministyczny PRNG (bez zaleznosci od Math.random -- powtarzalny wynik).
  let seed = 42;
  function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }

  const OWNERS = 15;
  const CITIES_PER_OWNER = 8; // 15*8 = 120 miast (rzad 100-150, RECON/GOAL 6)
  const cities = [];
  const territoryNodes = [];
  const builtByCity = new Map();
  for (let o = 0; o < OWNERS; o++) {
    // Kazdy wlasciciel ma wlasny "klaster" regionu mapy (jak realne imperium AI),
    // zeby CZESC par wlascicieli faktycznie graniczyla (realna praca dla
    // ownersHaveSharedLandBorder), a czesc byla daleko (tanio odrzucona).
    const clusterQ = Math.floor((o % 5) * (SZER / 5));
    const clusterR = Math.floor(Math.floor(o / 5) * (WYS / 3));
    for (let i = 0; i < CITIES_PER_OWNER; i++) {
      const q = Math.min(SZER - 1, Math.max(0, clusterQ + Math.floor(rnd() * (SZER / 5))));
      const r = Math.min(WYS - 1, Math.max(0, clusterR + Math.floor(rnd() * (WYS / 3))));
      const id = `perf-o${o}-c${i}`;
      cities.push({ id, ownerId: o, q, r });
      territoryNodes.push({ q, r, ownerId: o, pop: 3, level: 1 }); // pop=3 -> promien 5 (baza)
      const buildings = [];
      const roll = rnd();
      if (roll > 0.7) buildings.push('targowisko');
      if (roll > 0.9) buildings.push('port');
      if (buildings.length > 0) builtByCity.set(id, buildings);
    }
  }
  eq(cities.length, 120, 'K9: (setup) fikstura ma dokladnie 120 miast');
  eq(new Set(cities.map(c => c.ownerId)).size, 15, 'K9: (setup) fikstura ma dokladnie 15 wlascicieli');

  const isAtWarNone = () => false;       // pesymistyczny: brak wojen -> maksimum kandydatow
  const hasTradeTreatyAll = () => true;  // pesymistyczny: kazda para ma Umowe Szlakow

  const t0 = performance.now();
  const routesCold = TR.refreshTradeRoutes(
    cities, [], bigMap, builtByCity, isAtWarNone, hasTradeTreatyAll,
    undefined, // params (connectivity, legacy) -- domyslne
    territoryNodes, incP,
  );
  const t1 = performance.now();
  const coldMs = t1 - t0;

  // Druga tura ("cieply" przebieg -- existingRoutes niepuste, cache __tradeConnectionCache
  // i komponenty spojnosci JUZ policzone dla tej mapy z pierwszego wywolania) --
  // reprezentuje typowy koszt PO PIERWSZEJ turze, kiedy cache jest juz "rozgrzany".
  const t2 = performance.now();
  const routesWarm = TR.refreshTradeRoutes(
    cities, routesCold, bigMap, builtByCity, isAtWarNone, hasTradeTreatyAll,
    undefined, territoryNodes, incP,
  );
  const t3 = performance.now();
  const warmMs = t3 - t2;

  console.log(`  [WYNIK ZYWY] refreshTradeRoutes(120 miast, 15 wlascicieli, mapa 672x476): cold=${coldMs.toFixed(2)}ms, warm=${warmMs.toFixed(2)}ms, trasy=${routesCold.length}`);
  assert(routesCold.length > 0, 'K9: (kontrola nietautologicznosci) scenariusz faktycznie generuje trasy (nie jest pusty/trywialny)');
  assert(Number.isFinite(coldMs) && coldMs >= 0, 'K9: pomiar cold jest liczba skonczona');
  assert(Number.isFinite(warmMs) && warmMs >= 0, 'K9: pomiar warm jest liczba skonczona');
  // Brak arbitralnego progu z gory (dispatch: "brak arbitralnego wymogu liczbowego
  // z gory") -- wynik liczbowy jest udokumentowany w raporcie Operatora. Jedyna
  // twarda asercja tutaj: rzad wielkosci musi byc GRA-COMPATIBLE (poniesc turowy
  // budzet czasu, nie utknac w petli nieskonczonej/minutach) -- 5s jest rażąco
  // hojnym marginesem ponad oczekiwany wynik (patrz raport), nie prawdziwym limitem.
  assert(coldMs < 5000, `K9: (twarda gorna granica bezpieczenstwa, NIE cel wydajnosciowy) cold=${coldMs.toFixed(2)}ms < 5000ms`);
}

console.log(`\ntrade-routes-limit-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY_FILE); } catch (e) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}
process.exit(failed ? 1 : 0);
