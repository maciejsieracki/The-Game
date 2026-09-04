'use strict';
/**
 * trade-routes-hud-filter-test.cjs -- R-HANDEL-LIMIT-TRAS-PELNY-Q1, RUNDA 2 (R2-1..R2-4).
 * Run from gra/:  node tools/trade-routes-hud-filter-test.cjs
 *
 * CO WERYFIKUJE (kryteria R2-K1..R2-K5 dispatchu; R2-K6 = tsc + bramki, osobno):
 *   R2-K1  chip HUD „Handel" pokazuje DOKLADNIE dochod gracza z JEGO tras --
 *          porownany LICZBOWO z niezalezna wartoscia policzona przez silnik
 *          (computeTradeRouteIncomeByCity zawezone do miast gracza = to, co realnie
 *          wplywa do skarbca przez turn-economy.ts::pieniadzZTras).
 *   R2-K2  panel imperium „Handel" nie zawiera ANI JEDNEGO wiersza trasy, w ktorej
 *          gracz nie jest strona.
 *   R2-K3  nakladka mapy rysuje wylacznie trasy gracza -- liczba lukow przekazanych
 *          do buildTradeRoutesOverlayGroup() porownana z liczba tras gracza.
 *   R2-K4  toasty/dziennik: przy PIERWSZYM przeliczeniu w swiecie, w ktorym AI
 *          dostaje nowy handel wewnetrzny + AI<->AI, gracz nie dostaje ani jednego
 *          komunikatu o cudzej trasie -- mierzone LICZNIKIEM wywolan showHintMessage.
 *   R2-K5  trasa WEWNETRZNA gracza jest w chipie liczona DOKLADNIE RAZ (jedna trasa,
 *          nie dwie) -- i jednoczesnie jej dochod zgadza sie ze skarbcem (silnik
 *          kredytuje obie strony, obie sa gracza -> 2x kwota strony).
 *
 * DLACZEGO TEN TEST NIE JEST TAUTOLOGICZNY (P-TECH-CARD-TEST-NIE-TESTUJE-AKTYWNEJ-
 * SCIEZKI-Q1): nie ma tu wlasnej kopii logiki z main.ts. Test WYCINA ZRODLO czterech
 * realnych blokow z gra/src/main.ts (po nazwie funkcji / kotwicy tekstowej),
 * transpiluje je esbuildem i URUCHAMIA na fiksturach ze STUBAMI zaleznosci DOM/THREE.
 * Kazda sekcja ma ponadto MUTANTA: ten sam blok z USUNIETYM filtrem wlasciciela --
 * asercje MUSZA na nim zaplonac na czerwono (sekcja M na koncu). Bez mutanta test
 * nie mierzylby niczego.
 *
 * Swiat fikstury budowany jest ZYWYM wywolaniem refreshTradeRoutes() (nie recznie
 * skladanymi obiektami TradeRoute), wiec sprawdzamy zachowanie na realnym wyniku
 * silnika po generalizacji z rundy 1.
 */

const fs   = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) { console.error('[trade-routes-hud-filter-test] esbuild not found. Run: npm install (from gra/)'); process.exit(1); }
})();

const MAIN_TS = path.resolve(__dirname, '..', 'src', 'main.ts');
const ENTRY_FILE  = path.resolve(__dirname, '.trade-hud-filter-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.trade-hud-filter-bundle.cjs');
fs.writeFileSync(ENTRY_FILE, `
export {
  refreshTradeRoutes, diffTradeRoutes, findCityConnection,
  computeTradeRouteIncomeByCity, computeTradeRouteBuildingBonusByCity,
  tradeRouteBuildingBonusForRoute, tradeRouteTotalDistanceIncome,
  DEFAULT_TRADE_ROUTE_PARAMS, DEFAULT_TRADE_ROUTE_INCOME_PARAMS,
} from '../src/game/trade-routes';
`, 'utf8');
try {
  esbuild.buildSync({ entryPoints: [ENTRY_FILE], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: BUNDLE_FILE, logLevel: 'silent' });
} catch (e) { console.error('[trade-routes-hud-filter-test] esbuild failed:\n', e.message || e); process.exit(1); }
const TR = require(BUNDLE_FILE);

let passed = 0, failed = 0;
function assert(cond, msg) { if (cond) passed++; else { failed++; console.error('  FAIL:', msg); } }
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

// ---------------------------------------------------------------------------
// Wycinanie realnego zrodla z main.ts
// ---------------------------------------------------------------------------
const MAIN_SRC = fs.readFileSync(MAIN_TS, 'utf8');

/** Wytnij cale cialo funkcji `function <name>(` przez dopasowanie nawiasow klamrowych. */
function extractFunction(src, name) {
  const start = src.indexOf('function ' + name + '(');
  if (start < 0) throw new Error(`nie znaleziono funkcji ${name} w main.ts`);
  const braceStart = src.indexOf('{', src.indexOf(')', start));
  let depth = 0, i = braceStart;
  for (; i < src.length; i++) {
    const ch = src[i];
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) break; }
  }
  if (depth !== 0) throw new Error(`niezbalansowane nawiasy przy ${name}`);
  return src.slice(start, i + 1);
}

/** Wytnij fragment od kotwicy `from` (wlacznie) do konca kotwicy `to` (wlacznie). */
function extractBetween(src, from, to) {
  const a = src.indexOf(from);
  if (a < 0) throw new Error(`nie znaleziono kotwicy poczatkowej: ${from}`);
  const b = src.indexOf(to, a);
  if (b < 0) throw new Error(`nie znaleziono kotwicy koncowej: ${to}`);
  return src.slice(a, b + to.length);
}

/** Transpiluj TS -> JS i uruchom z wstrzyknietym kontekstem (identyfikatory przez `with`). */
function runSnippet(tsSource, ctx, tail) {
  const js = esbuild.transformSync(tsSource, { loader: 'ts', format: 'cjs', target: 'node18' }).code;
  // eslint-disable-next-line no-new-func
  const fn = new Function('__ctx', `with (__ctx) { ${js}\n${tail || ''} }`);
  return fn(ctx);
}

const SRC_CHIP    = extractBetween(MAIN_SRC, '      let handelIncome = 0;', '        handelRouteCount++;\n      }');
const SRC_PANEL   = extractBetween(MAIN_SRC, '      const routes = tradeRoutes', '.sort((a, b) => a.dystans - b.dystans || a.id.localeCompare(b.id));');
const SRC_OVERLAY = extractFunction(MAIN_SRC, 'refreshTradeRoutesOverlay');
const SRC_REPORT  = extractFunction(MAIN_SRC, 'reportTradeRouteEvents');

// ---------------------------------------------------------------------------
// Fikstura swiata: gracz(0) + AI(1) + AI(2) + AI(3), kazdy po 2 miasta.
// Traktaty: 0<->1 (gracz<->AI) oraz 1<->2 (AI<->AI, BEZ gracza). AI(3) NIE ma
// traktatu z nikim, wiec ma WYLACZNIE handel wewnetrzny -- to wlasnie ta klasa
// tras, ktora po generalizacji zalewala HUD gracza (R2-K4).
// Kazde miasto ma Targowisko -> existence-limit 2 (1 baza + 1 budynek); miasto
// a1 dodatkowo dwa dalsze budynki handlowe (limit 4), zeby po nasyceniu przez
// pare AI<->AI zostalo mu miejsce na trasy z graczem -- inaczej fikstura nie
// zawieralaby ZEWNETRZNYCH tras gracza i nie rozroznialaby przypadku „gracz jako
// strona `from`" od „gracz jako strona `to`".
// ---------------------------------------------------------------------------
function city(id, ownerId, q) { return { id, ownerId, q, r: 0, name: 'M-' + id }; }
function buildFlatMap(maxQ) {
  const hexes = {};
  for (let q = 0; q <= maxQ; q++) hexes[`${q},0`] = { terenBazowy: 'rownina' };
  return { szerokoscQ: maxQ + 1, wysokoscR: 1, hexes, seed: 1, riverPaths: [] };
}
const MAP = buildFlatMap(80);
const CITIES = [
  city('p1', 0, 0),  city('p2', 0, 9),
  city('a1', 1, 20), city('a2', 1, 31),
  city('b1', 2, 50), city('b2', 2, 62),
  city('c1', 3, 70), city('c2', 3, 78),
];
const CITY_BUILT = new Map(CITIES.map(c => [c.id, ['targowisko']]));
CITY_BUILT.set('a1', ['targowisko', 'port', 'port_wielki']);
const PLAYER_CITY_IDS = new Set(CITIES.filter(c => c.ownerId === 0).map(c => c.id));
const NO_WAR = () => false;
// Traktat Szlakow: gracz<->AI1 oraz AI1<->AI2. Para 0<->2 BEZ traktatu.
const HAS_TREATY = (a, b) => {
  const k = [a, b].sort().join('-');
  return k === '0-1' || k === '1-2';
};
const incP  = TR.DEFAULT_TRADE_ROUTE_INCOME_PARAMS;
const parms = TR.DEFAULT_TRADE_ROUTE_PARAMS;

const ROUTES = TR.refreshTradeRoutes(CITIES, [], MAP, CITY_BUILT, NO_WAR, HAS_TREATY, parms, undefined, incP);

// Niezalezna (po ID MIAST, nie po polach ownerId trasy) klasyfikacja tras gracza.
const isPlayerRouteByCityId = r => PLAYER_CITY_IDS.has(r.fromCityId) || PLAYER_CITY_IDS.has(r.toCityId);
const PLAYER_ROUTES  = ROUTES.filter(r => r.status === 'polaczony' && isPlayerRouteByCityId(r));
const FOREIGN_ROUTES = ROUTES.filter(r => r.status === 'polaczony' && !isPlayerRouteByCityId(r));
const INTERNAL_PLAYER_ROUTES = PLAYER_ROUTES.filter(r => PLAYER_CITY_IDS.has(r.fromCityId) && PLAYER_CITY_IDS.has(r.toCityId));

console.log('\n== Fikstura swiata (zywy refreshTradeRoutes) ==');
console.log(`  tras lacznie: ${ROUTES.length} | gracza: ${PLAYER_ROUTES.length} (w tym wewnetrznych gracza: ${INTERNAL_PLAYER_ROUTES.length}) | cudzych: ${FOREIGN_ROUTES.length}`);
for (const r of ROUTES) console.log(`    ${r.id}  owner ${r.ownerId} -> ${r.toOwnerId}  d=${r.dystans} ${r.medium}`);

// Warunki wstepne: fikstura MUSI zawierac wszystkie trzy klasy tras, inaczej
// test nie rozroznialby poprawnej implementacji od braku filtra.
assert(FOREIGN_ROUTES.length > 0, 'SETUP: fikstura zawiera trasy CUDZE (AI<->AI i/lub wewnetrzne AI) -- jest co odfiltrowac');
assert(INTERNAL_PLAYER_ROUTES.length === 1, 'SETUP: fikstura zawiera DOKLADNIE 1 trase WEWNETRZNA gracza (p1<->p2)');
assert(PLAYER_ROUTES.length > INTERNAL_PLAYER_ROUTES.length, 'SETUP: gracz ma takze co najmniej 1 trase ZEWNETRZNA');
assert(FOREIGN_ROUTES.some(r => r.ownerId !== 0 && r.toOwnerId !== 0 && r.ownerId !== r.toOwnerId), 'SETUP: fikstura zawiera trase AI<->AI BEZ udzialu gracza');
assert(FOREIGN_ROUTES.some(r => r.ownerId === r.toOwnerId && r.ownerId !== 0), 'SETUP: fikstura zawiera trase WEWNETRZNA obcej cywilizacji (nowy byt z GOAL 5)');
// USTALENIE (zmierzone na powyzszej fiksturze, nie zalozone): refreshTradeRoutes
// nadaje parom ZEWNETRZNYM kierunek kanoniczny wg rosnacego ownerId, a gracz ma
// ownerId 0 -- wiec DZIS gracz jest zawsze strona `from` trasy zewnetrznej, a
// `toOwnerId === 0` zdarza sie wylacznie dla trasy WEWNETRZNEJ. Filtr w main.ts
// jest mimo to SYMETRYCZNY (ownerId===0 || toOwnerId===0), bo opieranie UI na tej
// kolejnosci byloby cicha zaleznoscia od szczegolu implementacji silnika. Sekcja
// R2-D nizej dowodzi ZYWO, ze wszystkie cztery konsumenty obsluguja poprawnie
// takze trase z graczem po stronie `to`.
assert(!PLAYER_ROUTES.some(r => r.toOwnerId === 0 && r.ownerId !== 0),
  'SETUP: (ustalenie) w tej fiksturze gracz jest zawsze strona `from` trasy zewnetrznej -- przypadek odwrotny pokrywa sekcja R2-D');

// Niezalezny punkt odniesienia dla dochodu gracza: to, co silnik realnie kredytuje
// MIASTOM GRACZA (turn-economy.ts::pieniadzZTras czyta dokladnie te mape).
const WONDER_BONUS = () => 0; // brak cudow handlowych w tej fiksturze
const incomeByCity = TR.computeTradeRouteIncomeByCity(ROUTES, incP, WONDER_BONUS);
let EXPECTED_PLAYER_INCOME = 0;
for (const id of PLAYER_CITY_IDS) EXPECTED_PLAYER_INCOME += incomeByCity.get(id) ?? 0;
console.log(`  [ODNIESIENIE] dochod gracza wg silnika (computeTradeRouteIncomeByCity zawezone do miast gracza) = ${EXPECTED_PLAYER_INCOME}`);

// ---------------------------------------------------------------------------
// Stuby wspolne
// ---------------------------------------------------------------------------
const chipCtx = () => ({
  tradeRoutes: ROUTES,
  handelIncomeParams: incP,
  wonderTradeRouteBonusForOwner: WONDER_BONUS,
  tradeRouteTotalDistanceIncome: TR.tradeRouteTotalDistanceIncome,
});
const panelCtx = () => ({
  tradeRoutes: ROUTES,
  cities: CITIES,
  incomeParams: incP,
  wonderTradeRouteBonusForOwner: WONDER_BONUS,
  tradeRouteTotalDistanceIncome: TR.tradeRouteTotalDistanceIncome,
  tradeRouteBuildingBonusForRoute: TR.tradeRouteBuildingBonusForRoute,
  ownerDiploLabel: id => 'CYW' + id,
});
function overlayCtx() {
  const captured = { inputs: null };
  return {
    captured,
    tradeRoutes: ROUTES,
    cities: CITIES,
    showTradeRoutesOverlay: true,
    isCityPanelOpen: () => false,
    clearTradeRoutesOverlay: () => {},
    buildTradeRoutesOverlayGroup: (_m, inputs) => { captured.inputs = inputs; return { __group: true }; },
    map: MAP,
    scene: { add: () => {}, remove: () => {} },
  };
}
function reportCtx() {
  const state = { hints: [], log: [], anchors: new Map() };
  return {
    state,
    // argumenty wywolania (przekazywane jawnie w `tail`, zeby nie kolidowaly z `with`)
    __routes: ROUTES, __prev: ROUTES, __cities: CITIES, __map: MAP,
    __params: parms, __built: CITY_BUILT, __treaty: HAS_TREATY, __inc: incP,
    cities: CITIES,
    turn: 7,
    tradeRouteEventLog: state.log,
    tradeRouteEventPlayerCityIds: state.anchors,
    showHintMessage: msg => { state.hints.push(msg); },
    refreshD1bHud: () => {},
    ownerDiploLabel: id => 'CYW' + id,
    buildAllTerritoryNodes: () => undefined,
    diffTradeRoutes: TR.diffTradeRoutes,
    findCityConnection: TR.findCityConnection,
    tradeRouteTotalDistanceIncome: TR.tradeRouteTotalDistanceIncome,
  };
}

// ===========================================================================
// R2-K1 + R2-K5 -- chip HUD „Handel"
// ===========================================================================
console.log('\n-- R2-K1/R2-K5: chip HUD „Handel" (realne zrodlo main.ts) --');
const chip = runSnippet(SRC_CHIP, chipCtx(), 'return { handelIncome, handelRouteCount };');
console.log(`  chip: handelIncome=${chip.handelIncome}, handelRouteCount=${chip.handelRouteCount}`);
eq(chip.handelIncome, EXPECTED_PLAYER_INCOME,
  'R2-K1: chip HUD pokazuje DOKLADNIE dochod gracza wg silnika (nie dochod calego swiata)');
eq(chip.handelRouteCount, PLAYER_ROUTES.length,
  'R2-K1: chip liczy DOKLADNIE trasy gracza (liczone niezaleznie po id miast gracza)');
{
  // Kontrola nietautologicznosci liczbowej: dochod CALEGO swiata jest istotnie wiekszy.
  let worldIncome = 0;
  for (const v of incomeByCity.values()) worldIncome += v;
  assert(worldIncome > EXPECTED_PLAYER_INCOME,
    `R2-K1: (kontrola) dochod calego swiata (${worldIncome}) jest WIEKSZY niz dochod gracza (${EXPECTED_PLAYER_INCOME}) -- filtr ma co odciac`);
}
{
  // R2-K5: trasa WEWNETRZNA liczona RAZ w liczbie tras...
  const ctxOnlyInternal = chipCtx();
  ctxOnlyInternal.tradeRoutes = INTERNAL_PLAYER_ROUTES;
  const only = runSnippet(SRC_CHIP, ctxOnlyInternal, 'return { handelIncome, handelRouteCount };');
  eq(only.handelRouteCount, 1, 'R2-K5: trasa WEWNETRZNA gracza liczy sie w chipie DOKLADNIE RAZ (1 trasa, nie 2)');
  // ...a jej dochod zgadza sie ze skarbcem (silnik kredytuje OBA miasta gracza).
  const r = INTERNAL_PLAYER_ROUTES[0];
  const perSide = TR.tradeRouteTotalDistanceIncome(r.dystans, r.medium, incP);
  const engineInternal = TR.computeTradeRouteIncomeByCity([r], incP, WONDER_BONUS);
  let engineSum = 0;
  for (const id of PLAYER_CITY_IDS) engineSum += engineInternal.get(id) ?? 0;
  eq(only.handelIncome, engineSum,
    `R2-K5: dochod trasy wewnetrznej w chipie == kwota kredytowana miastom gracza przez silnik (2 x ${perSide})`);
  eq(engineSum, perSide * 2, 'R2-K5: (kontrola) silnik faktycznie kredytuje OBA miasta gracza -- 2 x kwota strony');
}

// ===========================================================================
// R2-K2 -- panel imperium „Handel"
// ===========================================================================
console.log('\n-- R2-K2: panel imperium „Handel" (realne zrodlo buildEmpireTradeSnap) --');
const panelRows = runSnippet(SRC_PANEL, panelCtx(), 'return routes;');
console.log(`  wierszy w panelu: ${panelRows.length}`);
for (const row of panelRows) console.log(`    id=${row.id} city=${row.cityId} partner=${row.partnerCityName} (${row.partnerOwnerLabel}) income=${row.income}`);
assert(panelRows.every(row => PLAYER_CITY_IDS.has(row.cityId)),
  'R2-K2: KAZDY wiersz panelu ma w kolumnie „miasto" MIASTO GRACZA (zaden wiersz cudzej trasy)');
{
  const foreignIds = new Set(FOREIGN_ROUTES.map(r => r.id));
  assert(!panelRows.some(row => foreignIds.has(row.id) || foreignIds.has(String(row.id).split('@')[0])),
    'R2-K2: panel nie zawiera ANI JEDNEGO wiersza pochodzacego z trasy, w ktorej gracz nie jest strona');
}
{
  // Suma panelu MUSI sie zgadzac z chipem i ze skarbcem (jedna liczba w trzech miejscach).
  const total = panelRows.reduce((s, r) => s + r.income, 0);
  eq(total, EXPECTED_PLAYER_INCOME, 'R2-K2: suma dochodu w panelu == chip HUD == kwota ze skarbca');
  eq(total, chip.handelIncome, 'R2-K2: suma dochodu w panelu identyczna z chipem HUD');
}
{
  // DECYZJA R2-2: trasa wewnetrzna gracza -> DWA wiersze z ROZNYMI id, po jednym
  // z perspektywy kazdego miasta gracza (odwzorowanie silnika, ktory kredytuje oba).
  const r = INTERNAL_PLAYER_ROUTES[0];
  const rows = panelRows.filter(row => String(row.id).split('@')[0] === r.id);
  eq(rows.length, 2, 'R2-2 (decyzja): trasa WEWNETRZNA gracza daje DWA wiersze panelu, po jednym na miasto gracza');
  eq(new Set(rows.map(x => x.id)).size, 2, 'R2-2: oba wiersze trasy wewnetrznej maja ROZNE id');
  eq(new Set(rows.map(x => x.cityId)).size, 2, 'R2-2: oba wiersze wskazuja ROZNE miasta gracza (grupowanie per-miasto dziala dla obu)');
  // Premia budynkowa tez jest kredytowana OBU miastom (computeTradeRouteBuildingBonusByCity).
  const bonusByCity = TR.computeTradeRouteBuildingBonusByCity([r], incP);
  let engineBonus = 0;
  for (const id of PLAYER_CITY_IDS) engineBonus += bonusByCity.get(id) ?? 0;
  const panelBonus = rows.reduce((s, x) => s + x.premiaBudynku, 0);
  eq(panelBonus, engineBonus, 'R2-2: suma premii 5% z obu wierszy == premia kredytowana miastom gracza przez silnik');
  // Trasy ZEWNETRZNE zachowuja NIEZMIENIONE id (bez sufiksu) -- zero regresji dla konsumentow id.
  const extIds = PLAYER_ROUTES.filter(x => x.id !== r.id).map(x => x.id);
  assert(extIds.every(id => panelRows.some(row => row.id === id)),
    'R2-2: trasy ZEWNETRZNE gracza zachowuja niezmienione id wiersza (bez sufiksu)');
}

// ===========================================================================
// R2-K3 -- nakladka mapy
// ===========================================================================
console.log('\n-- R2-K3: nakladka mapy (realne zrodlo refreshTradeRoutesOverlay) --');
{
  const ctx = overlayCtx();
  runSnippet(SRC_OVERLAY, ctx, 'refreshTradeRoutesOverlay();');
  const drawn = ctx.captured.inputs || [];
  console.log(`  lukow narysowanych: ${drawn.length} | tras gracza: ${PLAYER_ROUTES.length} | tras w swiecie: ${ROUTES.length}`);
  eq(drawn.length, PLAYER_ROUTES.length, 'R2-K3: liczba lukow na mapie == liczba tras GRACZA (nie tras calego swiata)');
  assert(drawn.length < ROUTES.length, 'R2-K3: (kontrola) narysowano MNIEJ lukow niz jest tras w swiecie -- cudze odfiltrowane');
  // Kazdy narysowany luk musi laczyc wspolrzedne, z ktorych co najmniej jedna to miasto gracza.
  const playerQ = new Set(CITIES.filter(c => PLAYER_CITY_IDS.has(c.id)).map(c => c.q));
  assert(drawn.every(inp => playerQ.has(inp.fromQ) || playerQ.has(inp.toQ)),
    'R2-K3: KAZDY narysowany luk ma co najmniej jeden koniec w miescie gracza');
  eq(drawn.filter(inp => playerQ.has(inp.fromQ) && playerQ.has(inp.toQ)).length, 1,
    'R2-K3: trasa WEWNETRZNA gracza narysowana DOKLADNIE RAZ (jeden luk, nie dwa)');
}

// ===========================================================================
// R2-K4 -- toasty / dziennik WYDARZENIA
// ===========================================================================
console.log('\n-- R2-K4: toasty i dziennik (realne zrodlo reportTradeRouteEvents) --');
{
  // Scenariusz „PIERWSZE przeliczenie po zmianie": prevRoutes = PUSTE, wiec `added`
  // to CALY swiat naraz (handel wewnetrzny powstaje jednoczesnie dla kazdej cywilizacji
  // + trasy AI<->AI) -- dokladnie „wysyp" toastow, przed ktorym ostrzega dispatch R2-4.
  const ctx = reportCtx();
  runSnippet(
    SRC_REPORT, ctx,
    'reportTradeRouteEvents([], __ctx.__routes, __ctx.__cities, __ctx.__map, __ctx.__params, __ctx.__built, () => false, __ctx.__treaty, __ctx.__inc);',
  );
  console.log('  toasty:'); for (const h of ctx.state.hints) console.log('    ' + h);
  eq(ctx.state.hints.length, PLAYER_ROUTES.length,
    `R2-K4: licznik wywolan showHintMessage == liczba tras GRACZA (${PLAYER_ROUTES.length}), mimo ${ROUTES.length} nowych tras w swiecie`);
  const foreignNames = CITIES.filter(c => !PLAYER_CITY_IDS.has(c.id)).map(c => c.name);
  const playerNames  = CITIES.filter(c => PLAYER_CITY_IDS.has(c.id)).map(c => c.name);
  assert(ctx.state.hints.every(h => playerNames.some(n => h.includes(n))),
    'R2-K4: KAZDY komunikat dotyczy trasy z miastem gracza');
  assert(!ctx.state.hints.some(h => foreignNames.every(n => h.includes(n))),
    'R2-K4: zaden komunikat nie opisuje trasy miedzy DWOMA miastami obcymi (AI<->AI / wewnetrzny AI)');
  eq(ctx.state.log.length, Math.min(6, PLAYER_ROUTES.length),
    'R2-K4: dziennik WYDARZENIA dostaje wpisy wylacznie za trasy gracza');
  // Kotwica linku musi wskazywac MIASTO GRACZA takze wtedy, gdy gracz jest strona `to`.
  assert([...ctx.state.anchors.values()].every(cid => PLAYER_CITY_IDS.has(cid)),
    'R2-K4: kotwica `tradeRouteEventPlayerCityIds` wskazuje ZAWSZE miasto gracza (nie `fromCityId` na slepo)');
  // Trasa wewnetrzna gracza -> DOKLADNIE JEDEN komunikat.
  const internalId = INTERNAL_PLAYER_ROUTES[0].id;
  eq(ctx.state.log.filter(e => e.id.endsWith(internalId)).length, 1,
    'R2-K4: trasa WEWNETRZNA gracza daje DOKLADNIE JEDEN wpis (nie dwa)');
}
{
  // Zerwanie trasy WEWNETRZNEJ gracza: powod NIE moze brzmiec „zerwana Umowa Szlakow"
  // (z samym soba nie ma traktatu) ani „brak polaczenia" (granica nie obowiazuje).
  const ctx = reportCtx();
  const internal = INTERNAL_PLAYER_ROUTES[0];
  runSnippet(
    SRC_REPORT, ctx,
    'reportTradeRouteEvents(__ctx.__prev, [], __ctx.__cities, __ctx.__map, __ctx.__params, __ctx.__built, () => false, __ctx.__treaty, __ctx.__inc);',
    );
  const lost = ctx.state.hints.filter(h => h.includes('zerwany'));
  console.log('  toasty (zerwanie):'); for (const h of lost) console.log('    ' + h);
  eq(lost.length, PLAYER_ROUTES.length, 'R2-K4: zerwanie -- komunikaty wylacznie za trasy gracza');
  const internalMsg = lost.find(h => h.includes('M-p1') && h.includes('M-p2'));
  assert(!!internalMsg, 'R2-K4: jest komunikat o zerwaniu trasy wewnetrznej gracza');
  assert(!internalMsg.includes('Umowa') && !internalMsg.includes('Umowy'),
    `R2-K4: powod zerwania trasy WEWNETRZNEJ nie moze byc falszywym „zerwana Umowa Szlakow" (jest: ${internalMsg})`);
  assert(internalMsg.includes('handel wewnętrzny'),
    'R2-K4: komunikat trasy wewnetrznej jest opisany jako „handel wewnętrzny", nie wlasna nazwa cywilizacji');
  void internal;
}

// ===========================================================================
// SEKCJA R2-D -- gracz po stronie `to` trasy (odpornosc na kierunek kanoniczny)
// ===========================================================================
console.log('\n-- R2-D: trasa z graczem po stronie `to` (odwrocony kierunek) --');
{
  const src = PLAYER_ROUTES.find(r => r.ownerId === 0 && r.toOwnerId !== 0);
  assert(!!src, 'R2-D: (setup) jest zewnetrzna trasa gracza do odwrocenia');
  const rev = {
    ...src,
    id: 'rev:' + src.id,
    fromCityId: src.toCityId, ownerId: src.toOwnerId,
    toCityId: src.fromCityId, toOwnerId: src.ownerId,
  };
  const only = [rev];
  const perSide = TR.tradeRouteTotalDistanceIncome(rev.dystans, rev.medium, incP);

  const c = chipCtx(); c.tradeRoutes = only;
  const chipRev = runSnippet(SRC_CHIP, c, 'return { handelIncome, handelRouteCount };');
  eq(chipRev.handelRouteCount, 1, 'R2-D: chip liczy trase z graczem po stronie `to`');
  eq(chipRev.handelIncome, perSide, 'R2-D: chip nie podwaja dochodu trasy ZEWNETRZNEJ z graczem po stronie `to`');

  const p = panelCtx(); p.tradeRoutes = only;
  const rowsRev = runSnippet(SRC_PANEL, p, 'return routes;');
  eq(rowsRev.length, 1, 'R2-D: panel daje DOKLADNIE 1 wiersz dla trasy zewnetrznej (nie dwa)');
  eq(rowsRev[0].cityId, src.fromCityId, 'R2-D: wiersz panelu jest z perspektywy MIASTA GRACZA, nie `fromCityId` trasy');
  eq(rowsRev[0].id, rev.id, 'R2-D: id wiersza trasy zewnetrznej NIEZMIENIONE (bez sufiksu)');
  eq(rowsRev[0].partnerCityName, 'M-' + rev.fromCityId, 'R2-D: partnerem jest miasto obce');

  const o = overlayCtx(); o.tradeRoutes = only;
  runSnippet(SRC_OVERLAY, o, 'refreshTradeRoutesOverlay();');
  eq((o.captured.inputs || []).length, 1, 'R2-D: nakladka rysuje trase z graczem po stronie `to`');

  const rc = reportCtx(); rc.__routes = only;
  runSnippet(SRC_REPORT, rc, 'reportTradeRouteEvents([], __ctx.__routes, __ctx.__cities, __ctx.__map, __ctx.__params, __ctx.__built, () => false, __ctx.__treaty, __ctx.__inc);');
  eq(rc.state.hints.length, 1, 'R2-D: dokladnie 1 komunikat o trasie z graczem po stronie `to`');
  eq([...rc.state.anchors.values()][0], src.fromCityId, 'R2-D: kotwica linku wskazuje MIASTO GRACZA, nie `fromCityId` trasy');
}

// ===========================================================================
// SEKCJA M -- MUTANTY (dowod nietautologicznosci)
// Ten sam realny kod z USUNIETYM filtrem wlasciciela MUSI zawiesc te same asercje.
// ===========================================================================
console.log('\n-- SEKCJA M: mutanty (filtr wlasciciela usuniety -> asercje MUSZA zaplonac) --');
function mutantFails(label, mutatedSrc, ctxFactory, tail, check) {
  let ok = false, detail = '';
  try {
    const ctx = ctxFactory();
    const res = runSnippet(mutatedSrc, ctx, tail);
    const verdict = check(res, ctx);
    ok = verdict.failed;
    detail = verdict.detail;
  } catch (e) { ok = true; detail = 'wyjatek: ' + (e.message || e); }
  assert(ok, `MUTANT ${label}: bez filtra wlasciciela asercja MUSI zaplonac -- a nie zaplonela (${detail})`);
  if (ok) console.log(`  [OK] mutant ${label} wykryty: ${detail}`);
}

mutantFails(
  'chip HUD',
  SRC_CHIP.replace('if (!fromPlayer && !toPlayer) continue;', ''),
  chipCtx, 'return { handelIncome, handelRouteCount };',
  res => ({ failed: res.handelIncome !== EXPECTED_PLAYER_INCOME, detail: `handelIncome=${res.handelIncome} != ${EXPECTED_PLAYER_INCOME}` }),
);
mutantFails(
  // Mutant odtwarza zachowanie SPRZED poprawki: brak filtra wlasciciela ORAZ wiersz
  // zawsze z perspektywy `fromCityId` (dawne `cityId: r.fromCityId`).
  'panel imperium',
  SRC_PANEL.replace(" && (r.ownerId === 0 || r.toOwnerId === 0)", '')
           .replace('if (r.ownerId === 0) {', 'if (true) {')
           .replace('if (r.toOwnerId === 0) {', 'if (false) {'),
  panelCtx, 'return routes;',
  rows => ({ failed: !rows.every(row => PLAYER_CITY_IDS.has(row.cityId)), detail: `wierszy=${rows.length}, w tym cudze` }),
);
mutantFails(
  'nakladka mapy',
  SRC_OVERLAY.replace('if (route.ownerId !== 0 && route.toOwnerId !== 0) continue;', ''),
  overlayCtx, 'refreshTradeRoutesOverlay();',
  (_r, ctx) => ({ failed: (ctx.captured.inputs || []).length !== PLAYER_ROUTES.length, detail: `lukow=${(ctx.captured.inputs || []).length} != ${PLAYER_ROUTES.length}` }),
);
mutantFails(
  'toasty',
  SRC_REPORT.replace('const added = diff.added.filter(isPlayerRoute);', 'const added = diff.added;')
            .replace('const removed = diff.removed.filter(isPlayerRoute);', 'const removed = diff.removed;'),
  reportCtx,
  'reportTradeRouteEvents([], __ctx.__routes, __ctx.__cities, __ctx.__map, __ctx.__params, __ctx.__built, () => false, __ctx.__treaty, __ctx.__inc);',
  (_r, ctx) => ({ failed: ctx.state.hints.length !== PLAYER_ROUTES.length, detail: `toastow=${ctx.state.hints.length} != ${PLAYER_ROUTES.length}` }),
);

// ---------------------------------------------------------------------------
try { fs.unlinkSync(ENTRY_FILE); } catch (e) { void e; }
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) { void e; }

console.log(`\n[trade-routes-hud-filter-test] passed=${passed} failed=${failed}`);
process.exit(failed === 0 ? 0 : 1);
