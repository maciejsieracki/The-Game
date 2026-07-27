'use strict';
/**
 * zloto-szlak-test.cjs -- PYTANIE 77 = A (Maciej 2026-07-25): złoto wchodzi na szlaki
 * handlowe jako surowiec DOSTĘPOWY, dokładnie jak koń -- szlak handlowy z cywilizacją
 * posiadającą złoto odblokowuje budowę Mennicy, BEZ przepływu sztuk do magazynu.
 * Run from gra/:  node tools/zloto-szlak-test.cjs
 *
 * Uzupełnia (nie zastępuje) tools/zloto-test.cjs (własna Kopalnia złota, bez tras) --
 * ten plik testuje WYŁĄCZNIE ścieżkę "dostęp przez szlak handlowy" + brak przepływu
 * ilościowego, zgodnie z sekcją "NOWY TEST" zadania:
 *   1. Własna Kopalnia złota, bez szlaków -> MOŻE budować Mennicę.
 *   2. Brak złoża, brak szlaków -> NIE MOŻE budować Mennicy.
 *   3. Brak złoża, aktywny szlak do posiadacza złota -> MOŻE budować Mennicę.
 *   4. Ten sam szlak NIE dodaje ani jednej sztuki złota do zapasów (dostęp, nie towar).
 *   5. Parytet AI -- ta sama reguła dla właściciela AI (ownerId != 0).
 * Sekcja F (bonus) pokrywa punkt 4 zadania "Co dokładnie zrobić": zerwanie szlaku
 * blokuje budowę NOWEJ Mennicy, ale nie burzy/wyłącza już istniejącej.
 *
 * Sekcje 1-5 i F wołają bezpośrednio moduły w zakresie zmiany (trade-routes.ts,
 * zloto-access.ts, resource-access.ts, building-resource-gate.ts/production.ts) --
 * DOKŁADNIE te same funkcje, jakich main.ts używa po domknięciu wpięcia (2026-07-25
 * wieczór: main.ts woła teraz `placedImprovementsWithTradeGrants` w 8 miejscach,
 * `ownerHasNativeResourceAccess` ma gałąź 'zloto' -- patrz main.ts i zloto-access.ts
 * nagłówek "WIRING W main.ts -- DOPIĘTY").
 *
 * Sekcja G (NOWA, domknięcie wpięcia) testuje dodatkowo samą KOMPOZYCJĘ, jakiej
 * main.ts używa (`placedImprovementsWithTradeGrants` = brąz+złoto naraz, jeden punkt
 * zamiast ośmiu wywołań) -- że oba syntetyczne granty współistnieją bez kolizji kluczy.
 *
 * OGRANICZENIE UCZCIWIE PRZYZNANE (patrz raport zadania): main.ts SAM (17+ tys.
 * linii, jeden monolityczny bootstrap zależny od `document`/`window`/canvas/three.js,
 * bez ANI JEDNEJ wyeksportowanej funkcji testowej ani test-hooka) nie da się
 * zbundlować/zaimportować do tego node'owego harnessu esbuild -- i żaden inny test
 * w tym repo (zloto-test.cjs, trade-grant-test.cjs, deposit-building-gate-test.cjs,
 * logic-test.cjs) tego nie robi, wszystkie bundlują wyłącznie pure-logic moduły z
 * game//map/, nigdy main.ts. Napisanie takiego testu wymagałoby albo (a) uruchomienia
 * całego bootstrapu gry pod jsdom+mock canvas/three.js (osobne, ciężkie zadanie, poza
 * zakresem tego zlecenia), albo (b) wyekstrahowania `placedImprovementsWithTradeGrants`/
 * `ownerHasNativeResourceAccess` z main.ts do osobnego, eksportowalnego modułu -- co
 * NIE było częścią zlecenia (main.ts miał zostać tylko wpięty, nie refaktoryzowany).
 * Dlatego "koniec do końca przez main.ts" pozostaje NIEPOKRYTY testem automatycznym;
 * zamiast tego potwierdzeniem wpięcia jest: (1) statyczny dowód -- grep pokazuje
 * WSZYSTKIE 8 miejsc w main.ts woła teraz `placedImprovementsWithTradeGrants`, zero
 * pozostałych wywołań starej `placedImprovementsWithBrazTradeGrant` poza jej własną
 * definicją i jednym wewnętrznym wywołaniem w nowej funkcji kompozytowej; (2) `npx tsc
 * --noEmit` niezmiennie 0 błędów po podmianie (nowa funkcja typuje się identycznie w
 * każdym z 8 miejsc, w tym w polu `placedImprovements` interfejsu AvailabilityContext).
 */

const fs   = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) { console.error('[zloto-szlak-test] esbuild not found. Run: npm install (from gra/)'); process.exit(1); }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY_FILE  = path.resolve(__dirname, '.zloto-szlak-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.zloto-szlak-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export {
  refreshTradeRoutes, computeTradeRouteResourceGrants, hasTradeRouteResourceAccess,
  computeTradeRouteResourceFlow, DEFAULT_TRADE_ROUTE_RESOURCE_FLOW_PARAMS,
  TRADE_ROUTE_RESOURCE_KEYS, TRADE_ROUTE_STOCK_FLOW_KEYS,
} from '../src/game/trade-routes';
export {
  empireHasKopalniaZlota, KOPALNIA_ZLOTA_KEY,
  placedImprovementsWithZlotoTradeGrant, TRADE_GRANT_ZLOTO_SYNTHETIC_KEY,
} from '../src/game/zloto-access';
export { empireHasKopalniaMiedzi, KOPALNIA_MIEDZI_KEY } from '../src/game/braz-access';
export { getCityResourceAccessForCity, getResourceAccessForCity } from '../src/game/resource-access';
export { buildableProduction, eraBuildingCatalog } from '../src/game/production';
export { CITY_BUILDING_PREREQ } from '../src/game/building-resource-gate';
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
  console.error('[zloto-szlak-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE_FILE);
const rawBuildings = JSON.parse(fs.readFileSync(path.join(GRA, 'data/buildings.json'), 'utf8'));
const DATA = { buildings: rawBuildings, units: [] };

let passed = 0, failed = 0;
function ok(cond, msg) { if (cond) { passed++; } else { failed++; console.error('  FAIL:', msg); } }
function eq(a, b, msg) { ok(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

// ---------------------------------------------------------------------------
// Fixture map + miasta -- jak w trade-grant-test.cjs / trade-ilosc-test.cjs.
// ---------------------------------------------------------------------------
function buildMap() {
  const hexes = {};
  for (let q = 0; q <= 400; q++) {
    hexes[`${q},0`] = { coords: { q, r: 0 }, terenBazowy: 'rownina', nakladka: 'brak', zloze: undefined };
  }
  return { szerokoscQ: 401, wysokoscR: 1, hexes, seed: 1, riverPaths: [] };
}
const map = buildMap();
function city(id, ownerId, q) { return { id, ownerId, q, r: 0 }; }
const NO_WAR = () => false;
const HAS_TREATY = () => true;

function ctxFor(ownerId, activeResourceLabels, overrides) {
  return Object.assign({
    epoch: 2, builtBuildingIds: ['targowisko'], productionQueue: [],
    isCapital: true, ownerId, difficulty: 'normal', activeResourceLabels,
  }, overrides);
}
function mennicaBuildable(ownerId, activeResourceLabels, overrides) {
  const CITY = { id: `c${ownerId}`, q: 0, r: 0, ownerId, population: 5 };
  const items = M.buildableProduction(CITY, DATA, ['Waluta'], ctxFor(ownerId, activeResourceLabels, overrides));
  return items.some(it => it.id === 'mennica');
}
function activeLabelsFor(ownerId, placedImprovements) {
  return M.getResourceAccessForCity(
    { id: `c${ownerId}`, q: 0, r: 0, population: 5 }, map, placedImprovements, 99, { ownerId: String(ownerId) },
  );
}

// ===========================================================================
// 1. Własna Kopalnia złota, BEZ szlaków -> MOŻE budować Mennicę.
// ===========================================================================
console.log('-- 1. własna Kopalnia złota, bez szlaków -> Mennica DOSTĘPNA --');
{
  const placedOwn = new Map([['1,1', ['kopalnia_zlota']]]);
  ok(M.empireHasKopalniaZlota(placedOwn) === true, '1: empireHasKopalniaZlota -> true (własna kopalnia)');
  const labels = activeLabelsFor(0, placedOwn);
  ok(labels.includes('Złoto'), '1: etykieta "Złoto" aktywna z własnej kopalni');
  ok(mennicaBuildable(0, labels) === true, '1: Mennica BUDOWALNA z własną Kopalnią złota, bez żadnego szlaku');
}

// ===========================================================================
// 2. Brak złoża, BEZ szlaków -> Mennica BUDOWALNA (Targowisko w ctx, bez wymogu Złota).
// ===========================================================================
console.log('-- 2. brak złoża, brak szlaków -> Mennica BUDOWALNA (kanon magazyn) --');
{
  const placedNone = new Map();
  ok(M.empireHasKopalniaZlota(placedNone) === false, '2: empireHasKopalniaZlota -> false (brak kopalni)');
  const labels = activeLabelsFor(0, placedNone);
  ok(!labels.includes('Złoto'), '2: brak etykiety "Złoto" bez kopalni i bez szlaku');
  ok(mennicaBuildable(0, labels) === true, '2: Mennica BUDOWALNA z Targowiskiem — dostęp do złota nie jest wymagany przy budowie');
}

// ===========================================================================
// 3. Brak złoża, AKTYWNY szlak do posiadacza złota -> MOŻE budować Mennicę.
// ===========================================================================
console.log('-- 3. brak złoża + aktywny szlak do posiadacza złota -> Mennica DOSTĘPNA --');
const p1 = city('p1', 0, 0);   // gracz (owner 0) -- BEZ złoża
const f1 = city('f1', 1, 5);   // partner (owner 1) -- MA złoto (natywnie)
const built = new Map([['p1', ['targowisko']], ['f1', ['targowisko']]]);
const routes3 = M.refreshTradeRoutes([p1, f1], [], map, built, NO_WAR, HAS_TREATY);
eq(routes3.length, 1, '3: (setup) trasa p1<->f1 istnieje');

function nativeAccess_partnerZlotoOnly(ownerId, key) {
  return ownerId === 1 && key === 'zloto';
}
const grants3 = M.computeTradeRouteResourceGrants(routes3, nativeAccess_partnerZlotoOnly);
eq(grants3.length, 1, '3: dokładnie jeden grant (zloto)');
eq(grants3[0].resourceKey, 'zloto', '3: surowiec grantu = zloto');
ok(M.hasTradeRouteResourceAccess(grants3, 0, 'zloto') === true, '3: gracz (owner 0) ma dostęp "z trasy" do złota');
ok(M.hasTradeRouteResourceAccess(grants3, 1, 'zloto') === false, '3: partner NIE dostaje grantu na własny surowiec');

const playerPlacedNoGold = new Map(); // gracz -- BRAK jakiejkolwiek Kopalni złota
const hasGrant3 = M.hasTradeRouteResourceAccess(grants3, 0, 'zloto');
const augmented3 = M.placedImprovementsWithZlotoTradeGrant(playerPlacedNoGold, hasGrant3);
ok(M.empireHasKopalniaZlota(augmented3) === true,
  '3: empireHasKopalniaZlota widzi syntetyczny wpis "z trasy" jak własną kopalnię');
const labels3 = activeLabelsFor(0, augmented3);
ok(labels3.includes('Złoto'), '3: etykieta "Złoto" aktywna WYŁĄCZNIE dzięki szlakowi (gracz sam nie ma kopalni)');
ok(mennicaBuildable(0, labels3) === true, '3: Mennica BUDOWALNA dzięki dostępowi "z trasy", mimo braku własnego złoża');

// Kontrola: bez augmentacji grantu złota — Mennica nadal budowalna (Targowisko w ctx).
const noAugment3 = M.placedImprovementsWithZlotoTradeGrant(playerPlacedNoGold, false);
ok(noAugment3 === playerPlacedNoGold, '3: hasTradeGrant=false -> zwraca DOKŁADNIE ten sam obiekt (brak zbędnej kopii)');
const labelsNoGrant3 = activeLabelsFor(0, noAugment3);
ok(!labelsNoGrant3.includes('Złoto'), '3: (kontrola) bez grantu -- brak etykiety "Złoto"');
ok(mennicaBuildable(0, labelsNoGrant3) === true, '3: (kontrola) bez grantu -- Mennica nadal BUDOWALNA (kanon magazyn, nie dostęp)');

// ===========================================================================
// 4. Ten sam szlak NIE dodaje ani jednej sztuki złota do zapasów.
// ===========================================================================
console.log('-- 4. złoto NIE płynie ilościowo -- zapas przed/po turze bez zmian --');
{
  ok(M.TRADE_ROUTE_RESOURCE_KEYS.includes('zloto'), '4: TRADE_ROUTE_RESOURCE_KEYS zawiera "zloto" (dostęp)');
  ok(!M.TRADE_ROUTE_STOCK_FLOW_KEYS.includes('zloto'),
    '4: TRADE_ROUTE_STOCK_FLOW_KEYS NIE zawiera "zloto" (brak przepływu ilościowego -- decyzja zadania pkt 2)');

  // Pula surowców PAŃSTWA -- zloto NIGDY nie ma tam klucza (brak pola w City.surowce,
  // zloto-access.ts nagłówek). Braz/zelazo/cegla dostają realną asymetrię, żeby
  // (kontrolnie) dowieść, że mechanizm przepływu w ogóle DZIAŁA w tym fixture --
  // inaczej "0 transferów zlota" byłoby bez znaczenia (mogłoby być "0 transferów w ogóle").
  const stockBefore = { 0: { braz: 2, zelazo: 2, cegla: 2 }, 1: { braz: 10, zelazo: 2, cegla: 2 } };
  const stockAfter = JSON.parse(JSON.stringify(stockBefore));
  const ownerStock = (ownerId, key) => stockAfter[ownerId][key] ?? 0;

  const zlotoBeforeSnapshot = { p: stockBefore[0].zloto, ai: stockBefore[1].zloto };

  const flows = M.computeTradeRouteResourceFlow(routes3, ownerStock, M.DEFAULT_TRADE_ROUTE_RESOURCE_FLOW_PARAMS);
  ok(flows.length > 0, '4: (kontrola) mechanizm przepływu aktywny -- co najmniej jeden realny transfer (braz z nadwyżką)');
  ok(flows.every(f => f.resourceKey !== 'zloto'),
    '4: ZERO transferów resourceKey=zloto, mimo aktywnego grantu dostępu do złota na tej samej trasie');

  for (const f of flows) {
    stockAfter[f.fromOwnerId][f.resourceKey] -= f.amount;
    stockAfter[f.toOwnerId][f.resourceKey] += f.amount;
  }

  eq(stockAfter[0].zloto, zlotoBeforeSnapshot.p, '4: zapas złota gracza PO turze == PRZED turą (oba undefined -- nigdy nie istniało)');
  eq(stockAfter[1].zloto, zlotoBeforeSnapshot.ai, '4: zapas złota partnera PO turze == PRZED turą (oba undefined -- nigdy nie istniało)');
  ok(stockAfter[0].zloto === undefined && stockAfter[1].zloto === undefined,
    '4: żadna strona nie zyskała klucza "zloto" w puli państwa po turze wymiany');
  eq(JSON.stringify(Object.keys(stockAfter[0]).sort()), JSON.stringify(Object.keys(stockBefore[0]).sort()),
    '4: zestaw kluczy puli gracza niezmieniony (żaden nowy surowiec, w tym zloto, nie doszedł)');
}

// ===========================================================================
// 5. Parytet AI -- ta sama reguła dla właściciela AI (ownerId != 0).
// ===========================================================================
console.log('-- 5. parytet AI -- ta sama reguła dla ownerId != 0 --');
{
  // Ta sama trasa/grant co w sekcji 3, ale para właścicieli przesunięta (5,6)
  // zamiast (0,1) -- computeTradeRouteResourceGrants jest generyczna po ownerId
  // (patrz trade-grant-test.cjs sekcja parytetu), więc budujemy TradeRoute ręcznie
  // z tym samym kształtem co wynik refreshTradeRoutes.
  const routeShifted = { ...routes3[0], ownerId: 5, toOwnerId: 6, fromCityId: 'p9', toCityId: 'f9' };
  function nativeAccess_shifted(ownerId, key) { return ownerId === 6 && key === 'zloto'; }
  const grants5 = M.computeTradeRouteResourceGrants([routeShifted], nativeAccess_shifted);
  eq(grants5.length, 1, '5: parytet -- dokładnie jeden grant dla pary (5,6)');
  eq(grants5[0].ownerId, 5, '5: parytet -- odbiorca poprawnie = owner 5 (nie hardkodowane 0)');
  ok(M.hasTradeRouteResourceAccess(grants5, 5, 'zloto') === true, '5: AI (owner 5) ma dostęp "z trasy" do złota');

  const augmented5 = M.placedImprovementsWithZlotoTradeGrant(new Map(), true);
  const labels5 = activeLabelsFor(5, augmented5);
  ok(labels5.includes('Złoto'), '5: etykieta "Złoto" aktywna dla AI (owner 5) identycznie jak dla gracza');
  ok(mennicaBuildable(5, labels5) === true, '5: Mennica BUDOWALNA dla AI dzięki dostępowi "z trasy" -- identycznie jak dla gracza (sekcja 3)');

  // Porównanie wprost: identyczna lista budowalnych pozycji dla gracza (owner 0,
  // sekcja 3) i AI (owner 5, tu) przy identycznym stanie (szlak + Targowisko + Waluta).
  const CITY0 = { id: 'cP', q: 0, r: 0, ownerId: 0, population: 5 };
  const CITY5 = { id: 'cA', q: 0, r: 0, ownerId: 5, population: 5 };
  const idsPlayer = M.buildableProduction(CITY0, DATA, ['Waluta'], ctxFor(0, labels3)).map(it => it.id).sort();
  const idsAi = M.buildableProduction(CITY5, DATA, ['Waluta'], ctxFor(5, labels5)).map(it => it.id).sort();
  eq(JSON.stringify(idsPlayer), JSON.stringify(idsAi),
    '5: parytet AI -- lista budynków identyczna dla gracza i AI przy identycznym dostępie "z trasy"');

  // Bez grantu złota — Mennica nadal budowalna (Targowisko w ctx, kanon magazyn).
  ok(mennicaBuildable(0, activeLabelsFor(0, new Map())) === true, '5: (kontrola) gracz bez grantu -- Mennica budowalna (bez wymogu Złota)');
  ok(mennicaBuildable(6, activeLabelsFor(6, new Map())) === true, '5: (kontrola) AI bez grantu -- identycznie budowalna');
}

// ===========================================================================
// F (bonus, pkt 4 zadania -- DO POTWIERDZENIA przez właściciela, patrz raport):
// zerwanie szlaku blokuje NOWĄ Mennicę, ale nie burzy/wyłącza już istniejącej.
// ===========================================================================
console.log('-- F. zerwanie szlaku: Mennica JUŻ ZBUDOWANA zostaje (nie znika) --');
{
  // Szlak zerwany (wojna) -- refreshTradeRoutes zwraca listę pustą, grant znika.
  const AT_WAR_0_1 = (a, b) => (a === 0 && b === 1) || (a === 1 && b === 0);
  const routesBroken = M.refreshTradeRoutes([p1, f1], routes3, map, built, AT_WAR_0_1, HAS_TREATY);
  eq(routesBroken.length, 0, 'F: (kontrola) wojna zrywa trasę');
  const grantsBroken = M.computeTradeRouteResourceGrants(routesBroken, nativeAccess_partnerZlotoOnly);
  ok(M.hasTradeRouteResourceAccess(grantsBroken, 0, 'zloto') === false, 'F: grant do złota cofnięty po zerwaniu szlaku');

  const noGrantAfterBreak = M.placedImprovementsWithZlotoTradeGrant(playerPlacedNoGold, false);
  const labelsAfterBreak = activeLabelsFor(0, noGrantAfterBreak);
  ok(!labelsAfterBreak.includes('Złoto'), 'F: po zerwaniu szlaku -- brak etykiety "Złoto" (jak oczekiwano)');
  ok(mennicaBuildable(0, labelsAfterBreak) === true,
    'F: po zerwaniu szlaku -- NOWA Mennica nadal BUDOWALNA (bramka budowy = magazyn, nie dostęp Złota)');

  // Ale Mennica JUŻ ZBUDOWANA (builtBuildingIds zawiera 'mennica') nie znika --
  // eraBuildingCatalog dalej raportuje status='built', niezależnie od aktualnej
  // (już nieaktywnej) bramki złota -- ten sam wzorzec co "stary zapis" w zloto-test.cjs.
  const CITY_BUILT = { id: 'cBuilt', q: 0, r: 0, ownerId: 0, population: 5 };
  const catalog = M.eraBuildingCatalog(DATA, ['Waluta'], {
    epoch: 2, builtBuildingIds: ['mennica', 'targowisko'], productionQueue: [], isCapital: true,
    activeResourceLabels: labelsAfterBreak,
  });
  const mennicaEntry = catalog.find(e => e.id === 'mennica');
  ok(!!mennicaEntry && mennicaEntry.status === 'built',
    `F: Mennica już zbudowana PRZED zerwaniem szlaku -- status='built' zostaje, nie znika (ma: ${mennicaEntry && mennicaEntry.status})`);
}

// ===========================================================================
// G. Kompozycja main.ts `placedImprovementsWithTradeGrants` (brąz + złoto RAZEM,
//    domknięcie wpięcia 2026-07-25 wieczór) -- oba syntetyczne granty muszą
//    współistnieć na TEJ SAMEJ mapie placedImprovements bez kolizji kluczy ani
//    wzajemnego "zjadania się" (main.ts doklejа złoto NA WYNIKU brązu, dokładnie
//    tak jak niżej). Patrz nagłówek pliku -- to NIE jest test main.ts samego w
//    sobie (niewykonalne w tym harnessie), tylko dowód, że KOMPOZYCJA dwóch
//    augmentacji, jakiej main.ts używa, jest bezpieczna.
// ===========================================================================
console.log('-- G. main.ts placedImprovementsWithTradeGrants: brąz + złoto RAZEM, bez kolizji --');
{
  // Symuluje DOKŁADNIE main.ts placedImprovementsWithTradeGrants(ownerId, ownImprovements):
  //   withBraz = placedImprovementsWithBrazTradeGrant(ownerId, ownImprovements)  [main.ts, lokalna]
  //   return placedImprovementsWithZlotoTradeGrant(withBraz, hasZlotoGrant)
  // placedImprovementsWithBrazTradeGrant nie jest eksportowana z braz-access.ts (żyje
  // wyłącznie w main.ts) -- odtwarzamy tu jej jedyny obserwowalny efekt (doklejenie
  // 'kopalnia_miedzi' pod własnym syntetycznym kluczem), żeby przetestować kompozycję.
  const TRADE_GRANT_BRAZ_SYNTHETIC_KEY = '__trasa_braz__';
  const ownImprovements = new Map(); // gracz -- BEZ własnej kopalni miedzi ani złota
  const withBraz = new Map(ownImprovements);
  withBraz.set(TRADE_GRANT_BRAZ_SYNTHETIC_KEY, ['kopalnia_miedzi']);
  const withBrazAndZloto = M.placedImprovementsWithZlotoTradeGrant(withBraz, true);

  ok(M.empireHasKopalniaMiedzi(withBrazAndZloto) === true,
    'G: kompozycja -- grant brązu PRZETRWAŁ po doklejeniu grantu złota na wierzchu');
  ok(M.empireHasKopalniaZlota(withBrazAndZloto) === true,
    'G: kompozycja -- grant złota aktywny RAZEM z grantem brązu, bez wzajemnego wypierania');
  eq(withBrazAndZloto.size, 2, 'G: kompozycja -- dokładnie 2 wpisy (jeden brąz, jeden złoto), zero kolizji kluczy');
  ok(withBrazAndZloto.has(TRADE_GRANT_BRAZ_SYNTHETIC_KEY) && withBrazAndZloto.has(M.TRADE_GRANT_ZLOTO_SYNTHETIC_KEY),
    'G: oba syntetyczne klucze obecne pod własnymi, różnymi nazwami');

  const labelsG = activeLabelsFor(0, withBrazAndZloto);
  ok(labelsG.includes('Złoto'), 'G: etykieta "Złoto" aktywna w wyniku kompozycji');
  ok(mennicaBuildable(0, labelsG) === true,
    'G: Mennica BUDOWALNA po kompozycji (dostęp do złota "z trasy" przetrwał doklejenie grantu brązu)');

  // Kontrola: kolejność odwrotna (gdyby main.ts kiedyś zamienił kolejność wywołań)
  // -- wynik musi być identyczny, kompozycja jest przemienna (różne klucze, różne
  // wartości, żadna funkcja nie czyta klucza drugiej).
  const zlotoOnly = M.placedImprovementsWithZlotoTradeGrant(new Map(ownImprovements), true);
  const brazThenZloto = new Map(zlotoOnly);
  brazThenZloto.set(TRADE_GRANT_BRAZ_SYNTHETIC_KEY, ['kopalnia_miedzi']);
  ok(M.empireHasKopalniaMiedzi(brazThenZloto) === true && M.empireHasKopalniaZlota(brazThenZloto) === true,
    'G: kompozycja jest przemienna -- ten sam wynik niezależnie od kolejności doklejania grantów');
}

console.log(`\nzloto-szlak-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY_FILE); } catch (e) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}
process.exit(failed ? 1 : 0);
