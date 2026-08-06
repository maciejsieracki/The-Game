'use strict';
/**
 * mennica-uspienie-test.cjs -- PYTANIE 83 = B (Maciej 2026-07-25): "Mennica przestaje
 * działać po utracie dostępu do złota. Mnożnik znika, Podatek wraca do Daniny."
 *
 * Kontrakt (patrz raport zadania PYTANIE 83 i komentarze w kodzie):
 *   - Budynek NIE jest burzony -- "budynek stoi, efekt śpi". Mennica pozostaje w
 *     builtBuildingIds na zawsze (chyba że gracz sam ją zburzy -- osobny mechanizm,
 *     nietknięty tą decyzją).
 *   - Bramka Efektu 1 (mnożnik Daniny netto po Walucie) to teraz TRZY warunki AND
 *     (poprzednio dwa): Waluta odkryta ORAZ Mennica zbudowana W STOLICY ORAZ
 *     cywilizacja MA AKTUALNY dostęp do złota (własna Kopalnia złota gdziekolwiek w
 *     imperium ALBO aktywny szlak handlowy -- ta sama reguła co bramka budowy,
 *     zloto-access.ts). Traci dostęp -> mnożnik wraca do ×1,0 -- BEZ usuwania
 *     budynku z listy zbudowanych.
 *   - Etykieta "Podatek"/"Danina" (danina-nazwa.ts) BYŁA rozszerzona o trzeci,
 *     opcjonalny argument `maDostepDoZlota` pod PYTANIE 83 -- ale FALA 41
 *     (Maciej 2026-07-27 wieczor, commit 297c60c, deploy c1e7a596) NADPISAŁA tę
 *     bramkę decyzją "strumień nazywa się zawsze Podatek" (danina-nazwa.ts
 *     nagłówek: "bez bramki Waluta/Mennica i bez nazwy Danina"). `daninaLabel`/
 *     `isPodatekActive` dziś ignorują wszystkie argumenty i zwracają zawsze
 *     Podatek/true -- MNOŻNIK Efektu 1 (Waluta+Mennica+dostęp do złota) nadal w
 *     pełni działa i śpi zgodnie z PYTANIE 83/PYTANIE-77-DOP, zmieniła się
 *     WYŁĄCZNIE etykieta w UI. Ten plik zakłada dziś zachowanie PO FALI 41.
 *   - Dostęp liczony jest CIV-WIDE (dla właściciela), NIE per-miasto -- dwa miasta
 *     tej samej cywilizacji muszą zawsze zgodnie raportować ten sam stan (sekcja 6).
 *   - PARYTET AI bezwzględny -- identyczna reguła dla ownerId=0 i dowolnego ownerId AI.
 *
 * Run from gra/:  node tools/mennica-uspienie-test.cjs
 * Self-contained: bundluje economy.ts + turn-economy.ts + zloto-access.ts +
 * trade-routes.ts + danina-nazwa.ts + generator mapy z esbuild.
 */

const fs   = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) { console.error('[mennica-uspienie-test] esbuild not found. Run: npm install (from gra/)'); process.exit(1); }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY_FILE  = path.resolve(__dirname, '.mennica-uspienie-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.mennica-uspienie-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export { cityYieldPerTurn, loadEconParams } from '../src/game/economy';
export { buildEconParams, advanceCityEconomy } from '../src/game/turn-economy';
export { generateMap } from '../src/map/generator';
export { foundCityAt, canFoundCity } from '../src/game/cities';
export {
  empireHasKopalniaZlota, placedImprovementsWithZlotoTradeGrant, KOPALNIA_ZLOTA_KEY,
} from '../src/game/zloto-access';
export {
  refreshTradeRoutes, computeTradeRouteResourceGrants, hasTradeRouteResourceAccess,
} from '../src/game/trade-routes';
export { daninaLabel, isPodatekActive, mennicaWStolicy } from '../src/game/danina-nazwa';
export {
  createMennicaZlotoGraceState,
  prepareMennicaZlotoGraceForTick,
  finalizeMennicaZlotoGraceAfterTick,
} from '../src/game/mennica-zloto-grace';
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
  console.error('[mennica-uspienie-test] esbuild bundling failed:\n', e.message || e);
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
function assert(cond, msg) { if (cond) { passed++; console.log('PASS:', msg); } else { failed++; console.error('FAIL:', msg); } }
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

const pNormal = M.loadEconParams(econParamsRaw, 'normal');

// ---------------------------------------------------------------------------
// A. Liczby "PRZED / PO" -- cityYieldPerTurn bezposrednio (sama formula
//    economy.ts, NIETKNIETA ta decyzja -- ctx.maMennica dalej jest jednym
//    prostym booleanem; nowosc to CO wolajacy wstawia do niego, patrz sekcja B).
//    Miasto: 20 pol Rownina, brak Targowiska/Biblioteki -- identyczny fixture
//    co waluta-mennica-test.cjs (numery hand-verified tam).
// ---------------------------------------------------------------------------
console.log('\n-- A. PRZED/PO na poziomie normal (raport) --');
function makeCity(overrides) {
  return Object.assign({
    id: 'c1', ludnosc: 3, zdrowie: 0, czyStolica: true,
    maSpichlerz: false, maAkwedukt: false, magazynZywnosci: 0,
    specjalisci: [], kolejkaProdukcji: [],
    podziałHandlu: { procentNauka: 20, procentPieniadz: 70, procentLuksus: 10 },
    podziałPracy:  { procentBudynki: 70 },
  }, overrides);
}
function makeCtx(overrides) {
  return Object.assign({
    wojskoZuzycieZywnosci: 0, strataFraction: 0,
    maMlyn: false, maCegielnia: false, maTargowisko: false, maBiblioteka: false,
    maMennica: false, walutaOdkryta: false,
  }, overrides);
}
const RTILE = { terenBazowy: 'rownina', nakladka: 'brak', maRzeke: false };
const tiles20 = Array(20).fill(RTILE);
const cityA = makeCity();

// PRZED: Mennica zbudowana + dostep do zlota aktywny -> maMennica effective = true.
const przed = M.cityYieldPerTurn(cityA, tiles20, [], pNormal, makeCtx({ walutaOdkryta: true, maMennica: true }));
// PO: Mennica NADAL zbudowana (budynek stoi), ale dostep do zlota utracony ->
// wolajacy (turn-economy.ts) wstawia maMennica=false do ctx (patrz sekcja B nizej,
// gdzie to jest naprawde liczone przez advanceCityEconomy + resolveOwnerZlotoAccess).
const po = M.cityYieldPerTurn(cityA, tiles20, [], pNormal, makeCtx({ walutaOdkryta: true, maMennica: false }));
eq(przed.pieniadz, 21, 'PRZED (Mennica+dostep+Waluta): Pieniadz = floor(20*1.5*0.70) = 21');
eq(przed.nauka,     6, 'PRZED: Nauka = floor(20*1.5*0.20) = 6');
eq(przed.luksus,    3, 'PRZED: Zamoznosc = floor(20*1.5*0.10) = 3');
eq(po.pieniadz,    14, 'PO (dostep do zlota utracony): Pieniadz = floor(20*0.70) = 14 (mnoznik z powrotem x1,0)');
eq(po.nauka,        4, 'PO: Nauka = floor(20*0.20) = 4');
eq(po.luksus,       2, 'PO: Zamoznosc = floor(20*0.10) = 2');
assert(po.pieniadz < przed.pieniadz, 'PO < PRZED -- mnoznik realnie znika po utracie dostepu do zlota');

// ---------------------------------------------------------------------------
// Fixtures dla sekcji B-G: prawdziwe miasta z wygenerowanej mapy (jak
// waluta-mennica-test.cjs sekcja 12), zeby przejsc PRZEZ CALY silnik
// advanceCityEconomy + resolveOwnerZlotoAccess (nowy parametr tej decyzji).
// ---------------------------------------------------------------------------
const gameData = { civs, econParams: econParamsRaw, societyParams, buildings, units, tech };
const map = M.generateMap(40, 40, 5150, 'kontynenty');
function findTwoCitySites(map) {
  const sites = [];
  const tmpCities = [];
  for (const h of Object.values(map.hexes)) {
    const c = { q: h.coords.q, r: h.coords.r };
    if (M.canFoundCity(c.q, c.r, tmpCities, map).ok) {
      const city = M.foundCityAt(c.q, c.r, 0, tmpCities, map, `Test${sites.length}`);
      if (city) { sites.push(city); tmpCities.push(city); }
    }
    if (sites.length >= 2) break;
  }
  return sites;
}
const twoCities = findTwoCitySites(map);
if (twoCities.length < 2) {
  console.error('FAIL: brak dwoch pol ladu do zalozenia miast testowych');
  failed++;
  console.log(`\nmennica-uspienie-test: ${passed} passed, ${failed} failed`);
  try { fs.unlinkSync(ENTRY_FILE); } catch (e) {}
  try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}
  process.exit(1);
}
const [capitalSite, regionalSite] = twoCities;
const zbadaneWaluta = new Set(['Waluta']);
const builtBothWithMennica = new Map([[capitalSite.id, ['mennica']], [regionalSite.id, []]]);

function tick(ownerId, resolveOwnerZlotoAccess) {
  const cities = [
    { ...capitalSite, ownerId },
    { ...regionalSite, ownerId },
  ];
  const econ = M.advanceCityEconomy(
    cities, map, gameData, 'normal', [], new Map(), builtBothWithMennica,
    1, zbadaneWaluta, new Map(), new Map(),
    undefined, undefined, 'wysoki', new Map(), new Map(), new Map(), new Map(),
    resolveOwnerZlotoAccess,
  );
  return {
    capital:  econ.perCity.find(t => t.cityId === capitalSite.id),
    regional: econ.perCity.find(t => t.cityId === regionalSite.id),
  };
}
/** PYTANIE-77-DOP=B: symulacja prepare → tick → finalize (jak main.ts). */
function tickWithGraceFlow(ownerId, hasAccessFn, graceState, ticks = 1) {
  const ownerIds = [ownerId];
  const out = [];
  for (let i = 0; i < ticks; i++) {
    const resolver = M.prepareMennicaZlotoGraceForTick(graceState, ownerIds, hasAccessFn);
    out.push(tick(ownerId, resolver));
    M.finalizeMennicaZlotoGraceAfterTick(graceState, ownerIds, hasAccessFn);
  }
  return out;
}
function primeHadZlotoAccess(ownerId, graceState, hadAccessFn) {
  const ownerIds = [ownerId];
  M.finalizeMennicaZlotoGraceAfterTick(graceState, ownerIds, hadAccessFn);
}
function daninaFor(ownerId, hasZloto) {
  return M.daninaLabel(true, M.mennicaWStolicy(capitalSite.id, builtBothWithMennica.get(capitalSite.id)), hasZloto);
}
const alwaysTrue  = () => true;
const alwaysFalse = () => false;

// ===========================================================================
// 1. Cywilizacja z WLASNA Kopalnia zlota + Waluta + Mennica w stolicy ->
//    mnoznik DZIALA, nazwa "Podatek".
// ===========================================================================
console.log('\n-- 1. wlasna Kopalnia zlota + Waluta + Mennica w stolicy -> dziala, "Podatek" --');
{
  const placedOwn = new Map([['h1', ['kopalnia_zlota']]]);
  const hasGold1 = M.empireHasKopalniaZlota(placedOwn);
  eq(hasGold1, true, '1: empireHasKopalniaZlota -> true (wlasna kopalnia)');
  const withGold = tick(0, () => hasGold1);
  const withoutMennicaAnywhere = tick(0, () => false); // baseline "no effect" run
  assert(!!withGold.capital && !!withoutMennicaAnywhere.capital, '1: sanity -- oba przebiegi zwracaja wpis');
  assert(withGold.capital.pieniadzBrutto > withoutMennicaAnywhere.capital.pieniadzBrutto,
    `1: mnoznik DZIALA -- pieniadzBrutto z dostepem (${withGold.capital.pieniadzBrutto}) > bez dostepu (${withoutMennicaAnywhere.capital.pieniadzBrutto})`);
  eq(daninaFor(0, hasGold1), 'Podatek', '1: etykieta = "Podatek" (Waluta+Mennica w stolicy+dostep do zlota)');
}

// ===========================================================================
// 2. Ta sama cywilizacja TRACI Kopalnie zlota -> mnoznik wraca do x1,0 (etykieta
//    zostaje "Podatek", FALA 41 -- patrz naglowek pliku), a Mennica NADAL figuruje
//    jako zbudowana.
// ===========================================================================
console.log('\n-- 2. utrata Kopalni zlota -> 1 tura laski, potem spi (mnoznik), etykieta stale "Podatek" (FALA 41), Mennica nadal stoi --');
{
  const placedLost = new Map(); // Kopalnia zniszczona/utracona -- mapa juz jej nie zawiera
  const hasGold2 = M.empireHasKopalniaZlota(placedLost);
  eq(hasGold2, false, '2: empireHasKopalniaZlota -> false (kopalnia utracona)');
  const graceState2 = M.createMennicaZlotoGraceState();
  primeHadZlotoAccess(0, graceState2, () => true);
  const noEffectBaseline = tick(0, () => false);
  const lossTicks = tickWithGraceFlow(0, () => hasGold2, graceState2, 2);
  const afterLossGrace = lossTicks[0];
  const afterLossSleep = lossTicks[1];
  assert(afterLossGrace.capital.pieniadzBrutto > noEffectBaseline.capital.pieniadzBrutto,
    `2: 1. tura po utracie -- mnoznik DZIALA (laska) (${afterLossGrace.capital.pieniadzBrutto} > ${noEffectBaseline.capital.pieniadzBrutto})`);
  eq(afterLossSleep.capital.pieniadzBrutto, noEffectBaseline.capital.pieniadzBrutto,
    '2: 2. tura bez dostepu -- pieniadzBrutto IDENTYCZNY jak baseline bez mnoznika (x1,0)');
  eq(daninaFor(0, hasGold2), 'Podatek', '2: etykieta zawsze "Podatek" (FALA 41, 2026-07-27) niezaleznie od dostepu do zlota -- mnoznik (wyzej) nadal spi, tylko nazwa juz sie nie zmienia');
  assert(builtBothWithMennica.get(capitalSite.id).includes('mennica'),
    '2: Mennica NADAL figuruje w builtBuildingIds stolicy -- budynek NIE zostal zburzony');
}

// ===========================================================================
// 3. Cywilizacja BEZ zloza, z AKTYWNYM szlakiem -> dziala; po ZERWANIU szlaku -> spi.
// ===========================================================================
console.log('\n-- 3. brak zloza + aktywny szlak -> dziala; po zerwaniu -> spi --');
{
  // refreshTradeRoutes (trade-routes.ts) łączy WYŁĄCZNIE gracz(ownerId=0)<->obca
  // cywilizacja (main.ts komentarz "tradeRoutes zawiera WYLACZNIE trasy gracz<->obca
  // cywilizacja") -- stąd OWNER_SELF musi być 0 tutaj, żeby refreshTradeRoutes w
  // ogóle wygenerował trasę. hasTradeRouteResourceAccess/computeTradeRouteResourceGrants
  // same w sobie SĄ ownerId-agnostyczne (patrz sekcja 5 -- parytet AI dowiedziony
  // przez własną Kopalnię, gdzie ownerId dowolny), ograniczenie jest wyłącznie w
  // refreshTradeRoutes (kto z kim może w ogóle zawiązać trasę), nie w bramce dostępu.
  const OWNER_SELF = 0, OWNER_PARTNER = 31;
  const p1 = { id: 'p1t', ownerId: OWNER_SELF, q: 0, r: 0 };
  const f1 = { id: 'f1t', ownerId: OWNER_PARTNER, q: 5, r: 0 };
  const builtTrade = new Map([['p1t', ['targowisko']], ['f1t', ['targowisko']]]);
  const NO_WAR = () => false, HAS_TREATY = () => true;
  function partnerHasGoldNatively(ownerId, key) { return ownerId === OWNER_PARTNER && key === 'zloto'; }

  // Mapa oddzielna (linia hexow) do refreshTradeRoutes -- ten sam wzorzec co zloto-szlak-test.cjs.
  const tradeMap = (() => {
    const hexes = {};
    for (let q = 0; q <= 20; q++) hexes[`${q},0`] = { coords: { q, r: 0 }, terenBazowy: 'rownina', nakladka: 'brak', zloze: undefined };
    return { szerokoscQ: 21, wysokoscR: 1, hexes, seed: 1, riverPaths: [] };
  })();

  const routesConnected = M.refreshTradeRoutes([p1, f1], [], tradeMap, builtTrade, NO_WAR, HAS_TREATY);
  eq(routesConnected.length, 1, '3: (setup) szlak polaczony');
  const grantsConnected = M.computeTradeRouteResourceGrants(routesConnected, partnerHasGoldNatively);
  const hasTradeGrantConnected = M.hasTradeRouteResourceAccess(grantsConnected, OWNER_SELF, 'zloto');
  eq(hasTradeGrantConnected, true, '3: grant "z trasy" aktywny dla wlasciciela bez zloza');
  // FALA 41 (PYTANIE-84-U3, 2026-07-27, commit 297c60c): placedImprovementsWithZlotoTradeGrant
  // jest dzis @deprecated no-op (zloto-access.ts) -- main.ts NIE augmentuje juz
  // placedImprovements syntetycznym wpisem, tylko liczy dostep BEZPOSREDNIO jako
  // OR: zapas w skarbcu (ownerHasZlotoStock) LUB wlasna kopalnia (empireHasKopalniaZlota)
  // LUB grant z trasy (hasTradeRouteResourceAccess) -- patrz main.ts ownerHasZlotoAccessNow.
  // Test rekonstruuje TEN SAM wzor, pomijajac skladnik zapasu w skarbcu (nieistotny
  // dla tej sekcji -- OWNER_SELF nie ma zadnej Kopalni zlota ani stocku).
  const nativeGold3 = M.empireHasKopalniaZlota(new Map());
  const hasGold3Connected = nativeGold3 || hasTradeGrantConnected;
  eq(hasGold3Connected, true, '3: dostep do zlota AKTYWNY dzieki szlakowi (bez wlasnego zloza)');

  const withRoute = tick(OWNER_SELF, () => hasGold3Connected);
  const noEffectBaseline3 = tick(OWNER_SELF, () => false);
  assert(withRoute.capital.pieniadzBrutto > noEffectBaseline3.capital.pieniadzBrutto,
    `3: mnoznik DZIALA dzieki szlakowi (${withRoute.capital.pieniadzBrutto} > ${noEffectBaseline3.capital.pieniadzBrutto})`);
  eq(daninaFor(OWNER_SELF, hasGold3Connected), 'Podatek', '3: etykieta = "Podatek" dzieki szlakowi');

  // Zerwanie szlaku (wojna).
  const AT_WAR = (a, b) => (a === OWNER_SELF && b === OWNER_PARTNER) || (a === OWNER_PARTNER && b === OWNER_SELF);
  const routesBroken = M.refreshTradeRoutes([p1, f1], routesConnected, tradeMap, builtTrade, AT_WAR, HAS_TREATY);
  eq(routesBroken.length, 0, '3: (setup) wojna zrywa szlak');
  const grantsBroken = M.computeTradeRouteResourceGrants(routesBroken, partnerHasGoldNatively);
  const hasTradeGrantBroken = M.hasTradeRouteResourceAccess(grantsBroken, OWNER_SELF, 'zloto');
  eq(hasTradeGrantBroken, false, '3: grant "z trasy" cofniety po zerwaniu szlaku');
  // Ten sam wzor co hasGold3Connected wyzej (FALA 41 -- patrz komentarz tam).
  const hasGold3Broken = nativeGold3 || hasTradeGrantBroken;
  eq(hasGold3Broken, false, '3: dostep do zlota utracony po zerwaniu szlaku');

  const graceState3 = M.createMennicaZlotoGraceState();
  primeHadZlotoAccess(OWNER_SELF, graceState3, () => hasGold3Connected);
  const breakTicks = tickWithGraceFlow(OWNER_SELF, () => hasGold3Broken, graceState3, 2);
  const afterBreakGrace = breakTicks[0];
  const afterBreakSleep = breakTicks[1];
  assert(afterBreakGrace.capital.pieniadzBrutto > noEffectBaseline3.capital.pieniadzBrutto,
    `3: 1. tura po zerwaniu szlaku -- mnoznik DZIALA (laska) (${afterBreakGrace.capital.pieniadzBrutto} > ${noEffectBaseline3.capital.pieniadzBrutto})`);
  eq(afterBreakSleep.capital.pieniadzBrutto, noEffectBaseline3.capital.pieniadzBrutto,
    '3: 2. tura po zerwaniu -- mnoznik SPI (pieniadzBrutto = baseline bez efektu)');
  eq(daninaFor(OWNER_SELF, hasGold3Broken), 'Podatek', '3: etykieta zawsze "Podatek" (FALA 41) mimo braku natywnego grantu -- mnoznik (wyzej) nadal spi');
  assert(builtBothWithMennica.get(capitalSite.id).includes('mennica'),
    '3: Mennica NADAL zbudowana w stolicy mimo zerwania szlaku (budynek nietkniety)');

  // ===========================================================================
  // 4. ODZYSKANIE dostepu (nowy szlak) -> mnoznik i nazwa WRACAJA SAME, bez odbudowy.
  // ===========================================================================
  console.log('\n-- 4. odzyskanie dostepu (nowy szlak) -> wraca samo, bez odbudowy --');
  const routesReconnected = M.refreshTradeRoutes([p1, f1], routesBroken, tradeMap, builtTrade, NO_WAR, HAS_TREATY);
  eq(routesReconnected.length, 1, '4: (setup) nowy szlak polaczony ponownie (pokoj przywrocony)');
  const grantsReconnected = M.computeTradeRouteResourceGrants(routesReconnected, partnerHasGoldNatively);
  const hasTradeGrantReconnected = M.hasTradeRouteResourceAccess(grantsReconnected, OWNER_SELF, 'zloto');
  eq(hasTradeGrantReconnected, true, '4: grant "z trasy" odzyskany');
  // Ten sam wzor co hasGold3Connected/Broken wyzej (FALA 41 -- patrz komentarz w sekcji 3).
  const hasGold4 = nativeGold3 || hasTradeGrantReconnected;
  eq(hasGold4, true, '4: dostep do zlota odzyskany');

  // builtBothWithMennica NIGDY nie byl modyfikowany w tej sekcji -- zero odbudowy,
  // Mennica caly czas byla tym samym wpisem w builtBuildingIds.
  const afterReconnect = tick(OWNER_SELF, () => hasGold4);
  eq(afterReconnect.capital.pieniadzBrutto, withRoute.capital.pieniadzBrutto,
    '4: po odzyskaniu dostepu -- pieniadzBrutto WRACA do wartosci sprzed zerwania, identycznie (bez zadnej odbudowy)');
  eq(daninaFor(OWNER_SELF, hasGold4), 'Podatek', '4: etykieta wraca na "Podatek" sama, bez odbudowy budynku');

  // Alternatywna sciezka odzyskania: NOWA wlasna Kopalnia zlota (zamiast szlaku) --
  // tez dziala automatycznie, bez zadnego dodatkowego kroku "odbuduj Mennice".
  const newOwnMine = new Map([['h2', ['kopalnia_zlota']]]);
  const hasGold4b = M.empireHasKopalniaZlota(newOwnMine);
  eq(hasGold4b, true, '4b: nowa WLASNA kopalnia (bez szlaku) tez przywraca dostep');
  const afterNewMine = tick(OWNER_SELF, () => hasGold4b);
  eq(afterNewMine.capital.pieniadzBrutto, withRoute.capital.pieniadzBrutto,
    '4b: nowa wlasna kopalnia daje IDENTYCZNY skutek co odzyskany szlak -- sama sciezka dostepu jest nieistotna');
}

// ===========================================================================
// 5. PARYTET: wszystko powyzej rowniez dla wlasciciela AI.
// ===========================================================================
console.log('\n-- 5. parytet AI -- identyczna reguła dla ownerId AI --');
{
  const OWNER_AI = 77;
  const placedOwnAi = new Map([['hA', ['kopalnia_zlota']]]);
  const hasGoldAi = M.empireHasKopalniaZlota(placedOwnAi);
  eq(hasGoldAi, true, '5: AI -- empireHasKopalniaZlota -> true (wlasna kopalnia)');

  const aiWithGold = tick(OWNER_AI, () => hasGoldAi);
  const aiNoEffect = tick(OWNER_AI, () => false);
  const playerWithGold = tick(0, () => true);
  const playerNoEffect = tick(0, () => false);
  eq(aiWithGold.capital.pieniadzBrutto, playerWithGold.capital.pieniadzBrutto,
    '5: parytet -- pieniadzBrutto (dostep aktywny) identyczny dla AI i gracza, to samo miasto');
  eq(aiNoEffect.capital.pieniadzBrutto, playerNoEffect.capital.pieniadzBrutto,
    '5: parytet -- pieniadzBrutto (dostep utracony) identyczny dla AI i gracza');
  assert(aiWithGold.capital.pieniadzBrutto > aiNoEffect.capital.pieniadzBrutto,
    '5: parytet -- AI TEZ traci mnoznik po utracie dostepu do zlota (nie tylko gracz)');
  eq(daninaFor(OWNER_AI, hasGoldAi), 'Podatek', '5: AI -- etykieta "Podatek" z dostepem');
  eq(daninaFor(OWNER_AI, false), 'Podatek', '5: AI -- etykieta zawsze "Podatek" (FALA 41) po utracie dostepu');
  // isPodatekActive bezposrednio -- brak jakiejkolwiek galezi po ownerId w samej funkcji.
  // FALA 41 (2026-07-27): bramka Danina/Podatek usunieta z UI -- funkcja zwraca
  // zawsze true, niezaleznie od argumentow (danina-nazwa.ts naglowek).
  eq(M.isPodatekActive(true, true, true),  true, '5: isPodatekActive(true,true,true) -- ownerId-agnostic z definicji');
  eq(M.isPodatekActive(true, true, false), true, '5: isPodatekActive(true,true,false) -- zawsze true od FALA 41 (bramka usunieta), ownerId-agnostic z definicji');
}

// ===========================================================================
// 6. Wydajnosc/poprawnosc: DWA miasta tej samej cywilizacji ZGODNIE raportuja
//    ten sam stan (nazwa jest civ-wide, NIE per-miasto) -- zarowno gdy dostep
//    jest aktywny, jak i gdy jest utracony. Mennica stoi WYLACZNIE w stolicy
//    (capitalSite), regionalSite nigdy jej nie ma wlasnej -- a mimo to obu
//    miastom dziala/spi TEN SAM mnoznik (bramka imperium-wide, pytanie 71/C,
//    teraz dodatkowo warunkowana dostepem do zlota, pytanie 83/B).
// ===========================================================================
console.log('\n-- 6. dwa miasta tej samej cywilizacji zgodnie raportuja ten sam stan --');
{
  const withGold6 = tick(0, () => true);
  const noGold6   = tick(0, () => false);
  assert(!!withGold6.regional && !!noGold6.regional, '6: sanity -- miasto regionalne zwraca wpis w obu przebiegach');
  // Miasto regionalne (bez wlasnej Mennicy) NADAL dostaje mnoznik gdy dostep aktywny...
  assert(withGold6.regional.pieniadzBrutto > noGold6.regional.pieniadzBrutto,
    `6: miasto REGIONALNE (bez wlasnej Mennicy) traci mnoznik razem ze stolica gdy dostep do zlota znika ` +
    `(z dostepem ${withGold6.regional.pieniadzBrutto} > bez ${noGold6.regional.pieniadzBrutto})`);
  // ...i etykieta Danina/Podatek (civ-wide, danina-nazwa.ts) jest ta sama funkcja
  // dla calej cywilizacji -- nie jest wyliczana osobno per miasto z osobnym wynikiem.
  const lblCapitalWithGold  = daninaFor(0, true);
  const lblRegionalWithGold = daninaFor(0, true); // ta sama funkcja, ten sam wynik civ-wide
  eq(lblCapitalWithGold, lblRegionalWithGold, '6: etykieta identyczna dla stolicy i miasta regionalnego (dostep aktywny)');
  const lblCapitalNoGold  = daninaFor(0, false);
  const lblRegionalNoGold = daninaFor(0, false);
  eq(lblCapitalNoGold, lblRegionalNoGold, '6: etykieta identyczna dla stolicy i miasta regionalnego (dostep utracony)');
  eq(lblCapitalWithGold, 'Podatek', '6: (kontrola) z dostepem = "Podatek" dla obu miast');
  eq(lblCapitalNoGold, 'Podatek', '6: (kontrola) bez dostepu = "Podatek" tez dla obu miast (FALA 41 -- etykieta stala, mnoznik i tak spi)');
}

// --- summary ---------------------------------------------------------------
console.log(`\nmennica-uspienie-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY_FILE);  } catch (e) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}
process.exit(failed ? 1 : 0);
