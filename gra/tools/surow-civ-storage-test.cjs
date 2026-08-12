'use strict';
/**
 * surow-civ-storage-test.cjs -- standalone Node test for SUROW-CIV-01
 * (decyzja Macieja 2026-07-24): magazyn surowcow = PULA PANSTWA (civ-wide, per
 * owner), nie per-miasto.
 *
 * Run from gra/:  node tools/surow-civ-storage-test.cjs
 *
 * Pokrywa:
 *   A. ownerResourceCapacityPerType / loadOwnerStorageParams (economy-upkeep.ts)
 *      -- cap = 100 + 100 x liczba Magazynow (addytywnie, NIE mnoznik).
 *   B. reconcileOwnerResourceCaps -- klamrowanie SUMY po miastach ownera,
 *      nadwyzka ginie z miast o NAJWIEKSZYM zapasie najpierw (deterministycznie).
 *   C. ownerResourceStock(All) / deductBuildingStockCostAcrossCities /
 *      creditOwnerResourceStock (building-stock-cost.ts).
 *   D. OWNERID-AGNOSTIC (twarda zasada Macieja 2026-07-24): dokladnie ten sam
 *      scenariusz (2 miasta, 1 Magazyn, nadprodukcja ponad cap) uruchomiony
 *      RAZEM dla gracza (ownerId=0) i cywilizacji AI (ownerId=2) w JEDNYM
 *      wywolaniu reconcileOwnerResourceCaps -- obaj dostaja cap 200 i obaj
 *      tracą nadwyzke identycznie (zero galezi "tylko gracz").
 *   E. Integracja pelna: advanceCityEconomy z prawdziwym Magazynem zbudowanym
 *      w jednym miescie AI (ownerId != 0) -- cap panstwa liczony poprawnie i
 *      suma City.surowce ownera nigdy nie przekracza go po turze.
 */

const fs   = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) { console.error('[surow-civ-storage-test] esbuild not found. Run: npm install (from gra/)'); process.exit(1); }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY_FILE  = path.resolve(__dirname, '.surow-civ-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.surow-civ-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export {
  DEFAULT_OWNER_STORAGE_PARAMS, loadOwnerStorageParams,
  ownerResourceCapacityPerType, reconcileOwnerResourceCaps,
} from '../src/game/economy-upkeep';
export {
  ownerResourceStock, ownerResourceStockAll,
  deductBuildingStockCostAcrossCities, creditOwnerResourceStock,
  canAffordBuildingStock,
} from '../src/game/building-stock-cost';
export { advanceCityEconomy, ownerResourceCap } from '../src/game/turn-economy';
export { foundCityAt, canFoundCity } from '../src/game/cities';
export { generateMap } from '../src/map/generator';
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    loader: { '.ts': 'ts', '.json': 'json' },
    outfile: BUNDLE_FILE,
    absWorkingDir: GRA,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[surow-civ-storage-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE_FILE);
const econParamsRaw = require('../data/econ-params.json');
const civs = require('../data/civs.json');
const societyParams = require('../data/society-params.json');
const buildings = require('../data/buildings.json');
const units = require('../data/units.json');
const tech = require('../data/tech.json');

let passed = 0, failed = 0;
function assert(cond, msg) { if (cond) { passed++; } else { failed++; console.error('FAIL:', msg); } }
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

// ===========================================================================
// A. Cap panstwa: baza + bonus x liczba Magazynow (addytywnie)
// ===========================================================================
console.log('\n-- A. ownerResourceCapacityPerType: 500 + 100/Magazyn (addytywnie) --');
const SP = M.DEFAULT_OWNER_STORAGE_PARAMS;
eq(SP.bazaSurowcePanstwo, 500, 'default: baza panstwa = 500 (podniesiona 100->500, Maciej 2026-07-24)');
eq(SP.bonusSurowceNaBudynek, 100, 'default: bonus/Magazyn = 100');
eq(M.ownerResourceCapacityPerType(0, SP), 500, '0 Magazynow -> cap 500');
eq(M.ownerResourceCapacityPerType(1, SP), 600, '1 Magazyn -> cap 600');
eq(M.ownerResourceCapacityPerType(2, SP), 700, '2 Magazyny -> cap 700 (addytywnie, NIE x2)');
eq(M.ownerResourceCapacityPerType(5, SP), 1000, '5 Magazynow -> cap 1000');
// nie mnoznik: 2 Magazyny musi byc 300, NIE 100*100*2=20000 ani 100*(1+2)=300 przypadkiem
// rownych -- kontrola jawna roznicujaca addytywny od hipotetycznego mnoznikowego x3:
assert(M.ownerResourceCapacityPerType(2, SP) !== SP.bazaSurowcePanstwo * 3 - 1, 'sanity addytywny (nie zbieg okolicznosci)');

// loadOwnerStorageParams: real econ-params.json (SUROW-CIV-01 wartosci wlasciciela)
const paramsNormal = M.loadOwnerStorageParams(econParamsRaw, 'normal');
eq(paramsNormal.bazaSurowcePanstwo, 500, 'econ-params.json normal: magazyn_baza_surowce = 500 (baza 100->500)');
eq(paramsNormal.bonusSurowceNaBudynek, 100, 'econ-params.json normal: magazyn_bonus_surowce_na_budynek = 100');
const paramsEasy = M.loadOwnerStorageParams(econParamsRaw, 'easy');
eq(paramsEasy.bazaSurowcePanstwo, 500, 'econ-params.json easy: 500 (płaskie, decyzja Macieja 2026-07-24)');
const paramsHard = M.loadOwnerStorageParams(econParamsRaw, 'hard');
eq(paramsHard.bazaSurowcePanstwo, 500, 'econ-params.json hard: 500 (płaskie, decyzja Macieja 2026-07-24)');

// fallback gdy brak w JSON
eq(M.loadOwnerStorageParams({}, 'normal').bazaSurowcePanstwo, 500, 'load: brak JSON -> fallback 500');

// ===========================================================================
// B. reconcileOwnerResourceCaps: nadwyzka ginie z NAJWIEKSZEGO zapasu najpierw
// ===========================================================================
console.log('\n-- B. reconcileOwnerResourceCaps: klamrowanie sumy, deterministyczna kolejnosc --');
function makeCities(spec) {
  // spec: [{id, ownerId, surowce}]
  return spec.map(s => ({ id: s.id, ownerId: s.ownerId, surowce: { ...s.surowce } }));
}

{
  const cities = makeCities([
    { id: 'a', ownerId: 0, surowce: { drewno: 80 } },
    { id: 'b', ownerId: 0, surowce: { drewno: 50 } },
    { id: 'c', ownerId: 0, surowce: { drewno: 10 } },
  ]);
  // suma=140, cap=100 -> excess=40 -- bierze NAJPIERW z 'a' (80, najwiekszy)
  M.reconcileOwnerResourceCaps(cities, () => 100);
  const total = cities.reduce((s, c) => s + (c.surowce.drewno ?? 0), 0);
  eq(total, 100, 'suma po reconcile = cap (100)');
  eq(cities[0].surowce.drewno, 40, 'a (najwiekszy, 80) traci cala nadwyzke 40 -> 40');
  eq(cities[1].surowce.drewno, 50, 'b (50) niezmieniony (nadwyzka pokryta przez a)');
  eq(cities[2].surowce.drewno, 10, 'c (10) niezmieniony');
}

{
  // Remis: dwa miasta o tym samym zapasie -- tie-break po id rosnaco (bierze od 'a' przed 'z')
  const cities = makeCities([
    { id: 'z', ownerId: 0, surowce: { kamien: 60 } },
    { id: 'a', ownerId: 0, surowce: { kamien: 60 } },
  ]);
  // suma=120, cap=100 -> excess=20 -- remis 60/60, bierze od 'a' (id rosnaco) najpierw
  M.reconcileOwnerResourceCaps(cities, () => 100);
  const a = cities.find(c => c.id === 'a');
  const z = cities.find(c => c.id === 'z');
  eq(a.surowce.kamien, 40, 'remis: id "a" (rosnaco pierwszy) traci nadwyzke -> 40');
  eq(z.surowce.kamien, 60, 'remis: id "z" niezmieniony');
}

{
  // Suma <= cap -> zero zmian (no-op)
  const cities = makeCities([
    { id: 'a', ownerId: 0, surowce: { ruda: 30 } },
    { id: 'b', ownerId: 0, surowce: { ruda: 30 } },
  ]);
  M.reconcileOwnerResourceCaps(cities, () => 100);
  eq(cities[0].surowce.ruda, 30, 'suma (60) <= cap (100) -> a niezmieniony');
  eq(cities[1].surowce.ruda, 30, 'suma (60) <= cap (100) -> b niezmieniony');
}

// ===========================================================================
// D. OWNERID-AGNOSTIC (twarda zasada Macieja 2026-07-24): gracz i AI IDENTYCZNIE
// ===========================================================================
console.log('\n-- D. OWNERID-AGNOSTIC: gracz (ownerId=0) i AI (ownerId=2) traktowani identycznie --');
{
  // Dwa identyczne scenariusze (2 miasta, suma 700, cap 500) -- jeden dla gracza
  // (ownerId=0), jeden dla AI (ownerId=2) -- w JEDNYM wywolaniu reconcile.
  const cities = makeCities([
    { id: 'p1', ownerId: 0, surowce: { drewno: 400 } },
    { id: 'p2', ownerId: 0, surowce: { drewno: 300 } },
    { id: 'ai1', ownerId: 2, surowce: { drewno: 400 } },
    { id: 'ai2', ownerId: 2, surowce: { drewno: 300 } },
  ]);
  // capForOwner zwraca TA SAMA formule dla obu ownerow (0 Magazynow -> 500) --
  // brak jakiejkolwiek galezi "if (ownerId === 0)".
  M.reconcileOwnerResourceCaps(cities, (ownerId) => M.ownerResourceCapacityPerType(0, M.DEFAULT_OWNER_STORAGE_PARAMS));

  const playerTotal = cities.filter(c => c.ownerId === 0).reduce((s, c) => s + (c.surowce.drewno ?? 0), 0);
  const aiTotal = cities.filter(c => c.ownerId === 2).reduce((s, c) => s + (c.surowce.drewno ?? 0), 0);
  eq(playerTotal, 500, 'OWNERID-AGNOSTIC: gracz (ownerId=0) klamrowany do cap 500');
  eq(aiTotal, 500, 'OWNERID-AGNOSTIC: AI (ownerId=2, ownerId!=0) klamrowany do cap 500 TAK SAMO jak gracz');

  const ai1 = cities.find(c => c.id === 'ai1');
  const ai2 = cities.find(c => c.id === 'ai2');
  const p1 = cities.find(c => c.id === 'p1');
  const p2 = cities.find(c => c.id === 'p2');
  eq(ai1.surowce.drewno, p1.surowce.drewno, 'AI miasto o najwiekszym zapasie traci nadwyzke IDENTYCZNIE jak gracz (200 == 200)');
  eq(ai2.surowce.drewno, p2.surowce.drewno, 'AI drugie miasto niezmienione IDENTYCZNIE jak u gracza (300 == 300)');
  eq(ai1.surowce.drewno, 200, 'AI (ownerId!=0): miasto z 400 -> 200 po odjeciu nadwyzki (700-500=200)');
}

// ===========================================================================
// C. ownerResourceStock(All) / deductBuildingStockCostAcrossCities / creditOwnerResourceStock
// ===========================================================================
console.log('\n-- C. Pula ownera: getter + pobor rozproszony + kredyt (dyplomacja/handel) --');
{
  const cities = makeCities([
    { id: 'x1', ownerId: 7, surowce: { glina: 5, drewno: 3 } },
    { id: 'x2', ownerId: 7, surowce: { glina: 9 } },
    { id: 'y1', ownerId: 8, surowce: { glina: 100 } }, // inny owner -- nie powinien wplywac
  ]);
  eq(M.ownerResourceStock(cities, 7, 'glina'), 14, 'ownerResourceStock: suma gliny ownera 7 = 5+9=14 (owner 8 pominiety)');
  const all = M.ownerResourceStockAll(cities, 7);
  eq(all.glina, 14, 'ownerResourceStockAll: glina=14');
  eq(all.drewno, 3, 'ownerResourceStockAll: drewno=3');

  // canAffordBuildingStock dziala na wyniku ownerResourceStockAll bez zmian (zero-modyfikacji API)
  assert(M.canAffordBuildingStock(all, { glina: 14 }), 'canAffordBuildingStock: pula ownera pokrywa dokladny koszt');
  assert(!M.canAffordBuildingStock(all, { glina: 15 }), 'canAffordBuildingStock: pula ownera NIE pokrywa kosztu > suma');

  // deduct: koszt glina:12 -- bierze NAJPIERW z x2 (9, mniejszy niz 12) -> bierze wszystko z x2 (9),
  // potem 3 z x1 (5) -> x1 zostaje 2, x2 zostaje 0
  M.deductBuildingStockCostAcrossCities(cities, 7, { glina: 12 });
  const x1 = cities.find(c => c.id === 'x1');
  const x2 = cities.find(c => c.id === 'x2');
  const y1 = cities.find(c => c.id === 'y1');
  eq(x2.surowce.glina, 0, 'deduct: x2 (najwiekszy zapas 9) oplacony jako pierwszy -> 0');
  eq(x1.surowce.glina, 2, 'deduct: reszta kosztu (12-9=3) z x1 (5) -> 2');
  eq(y1.surowce.glina, 100, 'deduct: inny owner (8) NIETKNIETY');

  // credit: dodaje do miasta o NAJMNIEJSZYM zapasie (x1=2 < x2=0 -- wiec x2 jako mniejszy)
  const added = M.creditOwnerResourceStock(cities, 7, 'glina', 5);
  eq(added, 5, 'credit: caly amount dodany (brak capu)');
  eq(x2.surowce.glina, 5, 'credit: trafia do miasta o najmniejszym zapasie (x2=0 -> 5)');
  eq(x1.surowce.glina, 2, 'credit: x1 (2, wiekszy niz x2 przed dodaniem) niezmieniony');

  // credit z capem: pula ownera 7 teraz = 2+5=7; cap=10 -> mozna dodac max 3
  const addedCapped = M.creditOwnerResourceStock(cities, 7, 'glina', 10, 10);
  eq(addedCapped, 3, 'credit z capem: przycina dodatek do wolnego miejsca (10-7=3, nie 10)');
  eq(M.ownerResourceStock(cities, 7, 'glina'), 10, 'credit z capem: suma po dodaniu = dokladnie cap');
}

// ===========================================================================
// E. Integracja pelna: advanceCityEconomy, Magazyn w miescie AI (ownerId != 0)
// ===========================================================================
console.log('\n-- E. advanceCityEconomy: cap panstwa + reconcile per owner (gracz I AI) --');
{
  const map = M.generateMap(40, 40, 9191, 'kontynenty');
  const data = { civs, econParams: econParamsRaw, societyParams, buildings, units, tech };

  function landHexes(n, minDist) {
    const all = [];
    for (const h of Object.values(map.hexes)) {
      const c = { q: h.coords.q, r: h.coords.r };
      if (M.canFoundCity(c.q, c.r, [], map).ok) all.push(c);
    }
    const picked = [];
    for (const c of all) {
      if (picked.every(p => (Math.abs(c.q - p.q) + Math.abs(c.q + c.r - p.q - p.r) + Math.abs(c.r - p.r)) / 2 >= minDist)) {
        picked.push(c);
        if (picked.length >= n) break;
      }
    }
    return picked;
  }

  const spots = landHexes(4, 6);
  if (spots.length < 4) {
    console.error('FAIL: brak wystarczajaco lądu do zalozenia 4 miast testowych');
    process.exit(1);
  }

  const cities = [];
  // Gracz (ownerId=0): 2 miasta, jedno z Magazynem.
  const p1 = M.foundCityAt(spots[0].q, spots[0].r, 0, cities, map, 'Player1'); cities.push(p1);
  const p2 = M.foundCityAt(spots[1].q, spots[1].r, 0, cities, map, 'Player2'); cities.push(p2);
  // AI (ownerId=2): 2 miasta, jedno z Magazynem -- IDENTYCZNY setup jak gracza.
  const ai1 = M.foundCityAt(spots[2].q, spots[2].r, 2, cities, map, 'AI1'); cities.push(ai1);
  const ai2 = M.foundCityAt(spots[3].q, spots[3].r, 2, cities, map, 'AI2'); cities.push(ai2);

  // Zasilamy magazyny recznie PRZED tura, ponad cap (500 + 100x1 magazyn = 600),
  // zeby sprawdzic reconcile bez zaleznosci od tempa produkcji terenu.
  p1.surowce = { drewno: 760 };
  p2.surowce = { drewno: 0 };
  ai1.surowce = { drewno: 760 };
  ai2.surowce = { drewno: 0 };

  const builtByCity = new Map([
    [p1.id, ['magazyn']],
    [p2.id, []],
    [ai1.id, ['magazyn']],
    [ai2.id, []],
  ]);

  const econ = M.advanceCityEconomy(
    cities, map, data, 'normal', [], new Map(), builtByCity, 1, new Set(), new Map(), new Map(),
  );
  assert(!!econ, 'advanceCityEconomy nie rzuca wyjatku z Magazynem w miescie AI');

  const playerTotal = cities.filter(c => c.ownerId === 0).reduce((s, c) => s + (c.surowce.drewno ?? 0), 0);
  const aiTotal = cities.filter(c => c.ownerId === 2).reduce((s, c) => s + (c.surowce.drewno ?? 0), 0);
  const expectedCap = M.ownerResourceCap(cities, builtByCity, 0, data, 'normal');
  eq(expectedCap, 600, 'cap panstwa (1 Magazyn, normal): 500 + 100x1 = 600');
  const expectedCapAi = M.ownerResourceCap(cities, builtByCity, 2, data, 'normal');
  eq(expectedCapAi, 600, 'OWNERID-AGNOSTIC: cap panstwa AI (ownerId=2, 1 Magazyn) TAKI SAM jak gracza = 600');
  assert(playerTotal <= expectedCap, `gracz: suma drewna (${playerTotal}) <= cap panstwa (${expectedCap}) po turze`);
  assert(aiTotal <= expectedCapAi, `AI (ownerId=2): suma drewna (${aiTotal}) <= cap panstwa (${expectedCapAi}) po turze -- MAGAZYNY DZIALAJA DLA AI`);
  assert(aiTotal > 0, 'AI zachowuje surowiec do capu (nie zeruje wszystkiego -- reconcile tylko tnie nadwyzke)');
}

// ===========================================================================
// F. P-MAGAZYN-PRZEKROCZENIE-LIMITU-GLINA-DREWNO (2026-08-09): symulacja
//    kilku RÓWNOLEGŁYCH wyrębów lasu (main.ts triggerPlayerEndTurn, pętla
//    hexClearingStates) blisko capu magazynu -- ta pętla leci PO jedynym w
//    turze reconcileOwnerResourceCaps, więc każde jej wywołanie
//    creditOwnerResourceStock MUSI dostawać capPerType (main.ts:~21045 po
//    naprawie), inaczej Drewno rośnie bez ograniczenia mimo etykiety "PEŁNY".
//
//    UWAGA (Evaluator 2026-08-09): ta sekcja testuje wyłącznie KONTRAKT
//    BIBLIOTEKI creditOwnerResourceStock (building-stock-cost.ts) wołanej
//    BEZPOŚREDNIO -- nigdy nie dotyka main.ts, więc NIE łapie regresji, gdyby
//    ktoś usunął 5. argument z KONKRETNEGO wywołania w pętli wyrębu. Ten
//    kontrakt biblioteki był zawsze poprawny (nie tu był bug) -- dowód
//    miejsca wystąpienia buga jest w sekcji G niżej (strażnik tekstowy na
//    źródle main.ts).
// ===========================================================================
console.log('\n-- F. Wielokrotny wyrąb lasu (drewno) blisko capu -- NIE przekracza cap --');
{
  // Cap liczony DYNAMICZNIE z realnych econ-params.json (nie hardkodowany) -- sekcja A
  // powyżej jest dziś czerwona (dług testowy: bazaSurowcePanstwo w danych = 1000, nie
  // 500 jak zakładał stary test z 2026-07-24), więc ten test NIE zakłada konkretnej
  // wartości bazy, tylko używa tego samego ownerResourceCap co main.ts po naprawie.
  const data = { civs, econParams: econParamsRaw, societyParams, buildings, units, tech };
  const builtByCityF = new Map([['w1', ['magazyn']]]);
  const capProbe = M.ownerResourceCap([{ id: 'w1', ownerId: 0 }], builtByCityF, 0, data, 'normal');
  assert(capProbe > 20, `cap panstwa (1 Magazyn, normal) = ${capProbe} -- wystarczajaco duzy na scenariusz ponizej`);

  const startStock = capProbe - 10; // blisko capu, zostaje dokladnie 10 wolnego miejsca
  const cities = makeCities([{ id: 'w1', ownerId: 0, surowce: { drewno: startStock } }]);

  // 3 rownoległe wyręby, kazdy dający +25 Drewna (tak jak main.ts liczy drewnoCredit
  // per hex w petli) -- SUMA (75) znacznie przekroczylaby cap gdyby nie byla capowana
  // per-wywolanie, dokladnie jak w buggym main.ts PRZED naprawa (creditOwnerResourceStock
  // bez 5. argumentu).
  const credited = [];
  for (let i = 0; i < 3; i++) {
    credited.push(M.creditOwnerResourceStock(cities, 0, 'drewno', 25, capProbe));
  }
  const total = M.ownerResourceStock(cities, 0, 'drewno');
  eq(total, capProbe, `po 3 rownoleglych wyrebach: suma drewna = dokladnie cap (${capProbe}), nie ${startStock + 75}`);
  assert(total <= capProbe, `suma drewna (${total}) nigdy nie przekracza cap panstwa (${capProbe})`);
  eq(credited[0], 10, 'wyrab #1: dodano tylko wolne miejsce do capu (10, nie pelne 25)');
  eq(credited[1], 0, 'wyrab #2: magazyn juz pelny (na cap) -- 0 dodane');
  eq(credited[2], 0, 'wyrab #3: magazyn juz pelny (na cap) -- 0 dodane');

  // Kontrola negatywna: ten sam scenariusz BEZ capu (regres do stanu sprzed naprawy)
  // musi przekroczyc cap -- potwierdza, ze test faktycznie lapie bug, gdyby capPerType
  // zniknal z wywolania w main.ts.
  const citiesUncapped = makeCities([{ id: 'w2', ownerId: 0, surowce: { drewno: startStock } }]);
  for (let i = 0; i < 3; i++) {
    M.creditOwnerResourceStock(citiesUncapped, 0, 'drewno', 25 /* brak capPerType -- bug */);
  }
  const totalUncapped = M.ownerResourceStock(citiesUncapped, 0, 'drewno');
  eq(totalUncapped, startStock + 75, `kontrola negatywna: BEZ capPerType suma (${startStock}+75=${startStock + 75}) faktycznie przekracza cap (${capProbe}) -- test jest miarodajny`);
  assert(totalUncapped > capProbe, 'kontrola negatywna: potwierdza, ze bug (brak capu) realnie psuje magazyn');
}

// ===========================================================================
// G. STRAŻNIK TEKSTOWY na main.ts -- pokrywa MIEJSCE WYSTĄPIENIA buga
//    (Evaluator 2026-08-09): sekcja F wyżej testuje tylko bibliotekę
//    (building-stock-cost.ts), wołaną bezpośrednio -- main.ts jest zbyt
//    ciężki, żeby bundlować (importy Vite-specific), więc pokrycie
//    KONKRETNEGO wywołania w pętli wyrębu lasu robimy wzorcem "strażnika
//    tekstowego" (patrz tools/border-march-wygasanie-test.cjs) -- czytamy
//    src/main.ts jako zwykły tekst i sprawdzamy obecność 5. argumentu
//    (cap) w wywołaniu creditOwnerResourceStock wewnątrz pętli
//    `for (const [hexKey, st] of hexClearingStates)`.
//
//    Dowód mutacyjny (ręczny, opisany w raporcie): usunięcie 5. argumentu
//    z main.ts:~21045 na kopii powoduje czerwony wynik TEJ sekcji, mimo że
//    sekcja F wyżej zostaje zielona -- to właśnie luka, którą ta sekcja
//    zamyka.
// ===========================================================================
console.log('\n-- G. main.ts (strażnik tekstowy): wyrąb lasu przekazuje cap do creditOwnerResourceStock --');
{
  const MAIN_TS = path.join(__dirname, '..', 'src', 'main.ts');
  const mainSrc = fs.readFileSync(MAIN_TS, 'utf8');

  // Wytnij ciało pętli wyrębu lasu (od nagłówka `for` do zamykającej klamry pętli,
  // rozpoznanej po tym, że kolejna linia woła refreshPlayerCityEcon).
  const loopStart = mainSrc.indexOf('for (const [hexKey, st] of hexClearingStates)');
  assert(loopStart >= 0, 'main.ts: znaleziono pętlę wyrębu lasu (for hexClearingStates)');
  const loopEndMarker = 'refreshPlayerCityEcon(econ.perCity);';
  const loopEndIdx = mainSrc.indexOf(loopEndMarker, loopStart);
  assert(loopEndIdx > loopStart, 'main.ts: znaleziono koniec pętli wyrębu lasu (przed refreshPlayerCityEcon)');
  const loopBody = loopStart >= 0 && loopEndIdx > loopStart ? mainSrc.slice(loopStart, loopEndIdx) : '';

  // Wywołanie creditOwnerResourceStock dla 'drewno' MUSI mieć 5. argument (cap) --
  // dokładnie ten fragment, jaki Operator zostawił w kodzie po naprawie.
  const drewnoCallMatch = loopBody.match(
    /creditOwnerResourceStock\(cities, ownerId, 'drewno', drewnoCredit(, \w+)?\)/,
  );
  assert(!!drewnoCallMatch,
    "main.ts: znaleziono wywołanie creditOwnerResourceStock(cities, ownerId, 'drewno', drewnoCredit...) w pętli wyrębu");
  assert(!!(drewnoCallMatch && drewnoCallMatch[1]),
    'main.ts:~21045 wywołanie w pętli wyrębu PRZEKAZUJE 5. argument (cap) do creditOwnerResourceStock -- ' +
    'bez niego Drewno rośnie bez ograniczenia mimo pełnego magazynu (regresja P-MAGAZYN-PRZEKROCZENIE-LIMITU-GLINA-DREWNO)');

  // cap MUSI być liczony przez ownerResourceCap (ta sama funkcja co reszta ekonomii),
  // nie hardkodowaną stałą -- kontroluje, że naprawa nie "przeszła" przez sztuczną wartość.
  // P-MAGAZYN-SKALOWANIE-EPOKA-Q1 (Maciej 2026-08-12): wywołanie ma dziś 6 argumentów
  // (dołożony `empireEpochForOwner(ownerId)` jako `era`) i jest sformatowane wieloliniowo
  // przez ESLint/Prettier po dodaniu argumentu -- regex tolerancyjny na białe znaki/nowe
  // linie między argumentami i między `ownerResourceCap(` a otwierającym `cities,`.
  assert(/const drewnoCap = ownerResourceCap\(\s*cities,\s*cityBuilt,\s*ownerId,\s*data,\s*_menuDifficulty,\s*empireEpochForOwner\(ownerId\),?\s*\);/.test(loopBody),
    'main.ts: drewnoCap liczony przez ownerResourceCap(cities, cityBuilt, ownerId, data, _menuDifficulty, empireEpochForOwner(ownerId)) w pętli wyrębu');
}

// ===========================================================================
console.log('\n-- H. main.ts (strażnik tekstowy): łup z bitwy przekazuje cap do creditOwnerResourceStock --');
{
  const MAIN_TS = path.join(__dirname, '..', 'src', 'main.ts');
  const mainSrc = fs.readFileSync(MAIN_TS, 'utf8');

  // Wytnij ciało bloku łupu z bitwy (od deklaracji `battleLoot` do warunku
  // zdobycia miasta, ktory zaczyna sie zaraz po zamknieciu tego bloku).
  const blockStart = mainSrc.indexOf('let battleLoot: BattleLoot | null = null;');
  assert(blockStart >= 0, 'main.ts: znaleziono blok łupu z bitwy (let battleLoot)');
  const blockEndMarker = 'opts?.allowCityCapture === true || opts?.siegeContext === true';
  const blockEndIdx = mainSrc.indexOf(blockEndMarker, blockStart);
  assert(blockEndIdx > blockStart, 'main.ts: znaleziono koniec bloku łupu z bitwy (przed allowCityCapture)');
  const battleLootBody = blockStart >= 0 && blockEndIdx > blockStart ? mainSrc.slice(blockStart, blockEndIdx) : '';

  // Wywołanie creditOwnerResourceStock dla łupu MUSI mieć 5. argument (cap) --
  // dokładnie ten fragment, jaki Operator zostawił w kodzie po naprawie
  // P-MAGAZYN-PRZEKROCZENIE-LIMITU-GLINA-DREWNO.
  const battleLootCallMatch = battleLootBody.match(
    /creditOwnerResourceStock\(cities, winOid, key, amt(, \w+)?\)/,
  );
  assert(!!battleLootCallMatch,
    'main.ts: znaleziono wywołanie creditOwnerResourceStock(cities, winOid, key, amt...) w bloku łupu z bitwy');
  assert(!!(battleLootCallMatch && battleLootCallMatch[1]),
    'main.ts: wywołanie w bloku łupu z bitwy PRZEKAZUJE 5. argument (cap) do creditOwnerResourceStock -- ' +
    'bez niego łup rośnie bez ograniczenia mimo pełnego magazynu (regresja P-MAGAZYN-PRZEKROCZENIE-LIMITU-GLINA-DREWNO)');

  // cap MUSI być liczony przez ownerResourceCap z epoką ZWYCIĘZCY (winOid) --
  // P-MAGAZYN-SKALOWANIE-EPOKA-Q1 (Maciej 2026-08-12): bez empireEpochForOwner(winOid)
  // cap liczony tu byłby niższy niż realnie egzekwowany przez silnik od epoki 2
  // wzwyż, łup mógłby zniknąć w całości. Regex tolerancyjny na białe znaki/nowe
  // linie, tak samo jak strażnik wyrębu (sekcja G).
  assert(/const battleLootCap = ownerResourceCap\(\s*cities,\s*cityBuilt,\s*winOid,\s*data,\s*_menuDifficulty,\s*empireEpochForOwner\(winOid\),?\s*\);/.test(battleLootBody),
    'main.ts: battleLootCap liczony przez ownerResourceCap(cities, cityBuilt, winOid, data, _menuDifficulty, empireEpochForOwner(winOid)) w bloku łupu z bitwy');
}

// ===========================================================================
console.log('\n-- I. main.ts (strażnik tekstowy): przepływ handlowy przekazuje cap do creditOwnerResourceStock --');
{
  const MAIN_TS = path.join(__dirname, '..', 'src', 'main.ts');
  const mainSrc = fs.readFileSync(MAIN_TS, 'utf8');

  // Wytnij ciało pętli przepływu ilościowego surowca przez trasy handlowe (od
  // `const tradeFlows = computeTradeRouteResourceFlow` do komunikatu bledu w
  // otaczającym catch, ktory zamyka ten blok).
  const blockStart = mainSrc.indexOf('const tradeFlows = computeTradeRouteResourceFlow(tradeRoutes,');
  assert(blockStart >= 0, 'main.ts: znaleziono pętlę przepływu handlowego (const tradeFlows = computeTradeRouteResourceFlow)');
  const blockEndMarker = 'Blad przeplywu ilosciowego surowca przez trase';
  const blockEndIdx = mainSrc.indexOf(blockEndMarker, blockStart);
  assert(blockEndIdx > blockStart, 'main.ts: znaleziono koniec pętli przepływu handlowego (przed komunikatem bledu w catch)');
  const tradeFlowBody = blockStart >= 0 && blockEndIdx > blockStart ? mainSrc.slice(blockStart, blockEndIdx) : '';

  // Wywołanie creditOwnerResourceStock dla przepływu handlowego MUSI mieć 5.
  // argument (cap) -- bez niego surowiec dopisany odbiorcy rośnie bez
  // ograniczenia mimo pełnego magazynu, a odjęcie u nadawcy
  // (deductBuildingStockCostAcrossCities wyżej w pętli) jest BEZWARUNKOWE --
  // regres tutaj oznacza realne zniszczenie surowca, nie tylko przekroczenie capu.
  const tradeFlowCallMatch = tradeFlowBody.match(
    /creditOwnerResourceStock\(cities, flow\.toOwnerId, flow\.resourceKey, flow\.amount(, \w+)?\)/,
  );
  assert(!!tradeFlowCallMatch,
    'main.ts: znaleziono wywołanie creditOwnerResourceStock(cities, flow.toOwnerId, flow.resourceKey, flow.amount...) w pętli przepływu handlowego');
  assert(!!(tradeFlowCallMatch && tradeFlowCallMatch[1]),
    'main.ts: wywołanie w pętli przepływu handlowego PRZEKAZUJE 5. argument (cap) do creditOwnerResourceStock -- ' +
    'bez niego surowiec rośnie bez ograniczenia mimo pełnego magazynu (regresja P-MAGAZYN-PRZEKROCZENIE-LIMITU-GLINA-DREWNO)');

  // cap MUSI być liczony przez ownerResourceCap z epoką ODBIORCY (flow.toOwnerId) --
  // P-MAGAZYN-SKALOWANIE-EPOKA-Q1 (Maciej 2026-08-12): bez empireEpochForOwner(flow.toOwnerId)
  // cap byłby zaniżony od epoki 2 wzwyż i surowiec mógłby zniknąć zamiast dotrzeć
  // do odbiorcy. Regex tolerancyjny na białe znaki/nowe linie, tak samo jak
  // strażnik wyrębu (sekcja G).
  assert(/const tradeFlowCap = ownerResourceCap\(\s*cities,\s*cityBuilt,\s*flow\.toOwnerId,\s*data,\s*_menuDifficulty,\s*empireEpochForOwner\(flow\.toOwnerId\),?\s*\);/.test(tradeFlowBody),
    'main.ts: tradeFlowCap liczony przez ownerResourceCap(cities, cityBuilt, flow.toOwnerId, data, _menuDifficulty, empireEpochForOwner(flow.toOwnerId)) w pętli przepływu handlowego');
}

// --- summary ---------------------------------------------------------------
console.log(`\nsurow-civ-storage-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY_FILE);  } catch (e) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}
process.exit(failed ? 1 : 0);
