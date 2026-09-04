'use strict';
/**
 * handel-wymiana-tech-gate-test.cjs -- standalone Node test for
 * R-HANDEL-WYMIANA-TECH-GATE-Q1.
 * Run from gra/:  node tools/handel-wymiana-tech-gate-test.cjs
 *
 * Weryfikuje ZYWO, DETERMINISTYCZNIE, z realnymi fikstrurami (miasta/traktaty/
 * predykaty) kryteria konca GOAL 4 dispatchu (zob.
 * dyspozycje/autobot/runs/R-HANDEL-WYMIANA-TECH-GATE-Q1/00-dispatch.md):
 *
 *   1. owner bez techu, traktat AKTYWNY, miasta polaczone -> zero tras (zewn.).
 *   2. owner bez techu, dwa wlasne miasta polaczone -> zero tras wewnetrznych.
 *   3. obie strony maja tech + traktat -> trasy powstaja jak dotad (brak regresu).
 *   4. jedna strona ma, druga nie -> zero tras (symetria bramki, obie kolejnosci par).
 *   5. trasa istniejaca w existingRoutes dla ownera bez techu -> NIE przetrwa refresh.
 *   6. panstwo-miasto bez techu traktowane identycznie jak cywilizacja AI (brak
 *      wyjatku) -- trade-routes.ts jest ownerId-agnostyczny (RECON A dispatchu),
 *      wiec dowod = ta sama bramka aplikowana do dwoch roznych ownerId bez
 *      zadnej galezi warunkowej dla "panstwa-miasta".
 *   7. domyslny predykat (hasTradeTech POMINIETY) -> zachowanie IDENTYCZNE jak
 *      przed zmiana (wsteczna zgodnosc, nie cicha furtka -- patrz REGULA
 *      PRZECIW SAMOOSZUKIWANIU w dispatchu).
 *   8. blokada diplomacy-locks case '5': locked===true bez techu po KAZDEJ ze
 *      stron (obie kombinacje MY/ONI), locked===false gdy obie maja.
 *
 * Trzy warstwy z REGULY PRZECIW SAMOOSZUKIWANIU (dispatch):
 *   (a) rdzen tras (refreshTradeRoutes, trade-routes.ts)          -- ZYWO, ponizej.
 *   (b) diplomacy-locks gracza (resolveDiplomacyActionLock, case '5') -- ZYWO, ponizej.
 *   (c) formAiAiTradeAgreementsIfEligible (main.ts:17651)          -- NIE jest tu
 *       testowane zywo: main.ts nie jest czystym modulem (DOM/THREE, jedna
 *       gigantyczna funkcja), funkcja nie jest eksportowana i przepisanie jej na
 *       eksportowalna byloby zmiana architektury poza allowlista tego tematu.
 *       Zamiast tego: STATYCZNA weryfikacja umiejscowienia (patrz raport
 *       Operatora -- grep z kontekstem, ten sam ksztalt co sasiednie `continue`
 *       dla isAtWar/hasSzlakowTreaty w TEJ SAMEJ petli, ktore juz dzialaja
 *       poprawnie w produkcji). Jawnie NIE liczone jako dowod rownowazny (a)/(b).
 */

const fs   = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) { console.error('[handel-wymiana-tech-gate-test] esbuild not found. Run: npm install (from gra/)'); process.exit(1); }
})();

const ENTRY_FILE  = path.resolve(__dirname, '.handel-wymiana-tech-gate-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.handel-wymiana-tech-gate-bundle.cjs');
fs.writeFileSync(ENTRY_FILE, `
export {
  refreshTradeRoutes, TRADE_TECH,
} from '../src/game/trade-routes';
export {
  resolveDiplomacyActionLock,
} from '../src/game/diplomacy-locks';
`, 'utf8');

try {
  esbuild.buildSync({ entryPoints: [ENTRY_FILE], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: BUNDLE_FILE, logLevel: 'silent' });
} catch (e) { console.error('[handel-wymiana-tech-gate-test] esbuild failed:\n', e.message || e); process.exit(1); }

const B = require(BUNDLE_FILE);
const { refreshTradeRoutes, TRADE_TECH, resolveDiplomacyActionLock } = B;

let passed = 0, failed = 0;
function assert(cond, msg) { if (cond) passed++; else { failed++; console.error('  FAIL:', msg); } }
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

// ---------------------------------------------------------------------------
// Fikstury wspolne (wzorzec: trade-routes-limit-test.cjs)
// ---------------------------------------------------------------------------
function city(id, ownerId, q) { return { id, ownerId, q, r: 0 }; }
function buildFlatMap(maxQ) {
  const hexes = {};
  for (let q = 0; q <= maxQ; q++) hexes[`${q},0`] = { terenBazowy: 'rownina' };
  return { szerokoscQ: maxQ + 1, wysokoscR: 1, hexes, seed: 1, riverPaths: [] };
}
const NO_WAR     = () => false;
const HAS_TREATY = () => true;
const NO_TREATY  = () => false;
const ALL_HAVE_TECH  = () => true;
const NONE_HAVE_TECH = () => false;

eq(TRADE_TECH, 'Wymiana', '(setup) TRADE_TECH eksportuje literalna nazwe techu "Wymiana"');

// ===========================================================================
// KRYTERIUM 1 -- owner bez techu, traktat AKTYWNY, miasta polaczone -> zero tras zewnetrznych
// ===========================================================================
console.log('\n-- Kryterium 1: owner bez techu + traktat aktywny -> zero tras zewnetrznych --');
{
  const map = buildFlatMap(30);
  const p = city('k1-p', 0, 0);
  const f = city('k1-f', 1, 5);
  const routesNoTech = refreshTradeRoutes([p, f], [], map, new Map(), NO_WAR, HAS_TREATY, undefined, undefined, undefined, NONE_HAVE_TECH);
  eq(routesNoTech.length, 0, 'K1: traktat aktywny + fizyczna laczonosc, ale ZADEN wlasciciel nie ma techu -> ZERO tras');
  // Kontrola nietautologicznosci fikstury: z realnym techem ta sama para TWORZY trase.
  const routesWithTech = refreshTradeRoutes([p, f], [], map, new Map(), NO_WAR, HAS_TREATY, undefined, undefined, undefined, ALL_HAVE_TECH);
  eq(routesWithTech.length, 1, 'K1: (kontrola) ta sama fikstura Z technologia -> 1 trasa -- ZERO wyzej to efekt bramki, nie geometrii/traktatu');
}

// ===========================================================================
// KRYTERIUM 2 -- owner bez techu, dwa wlasne miasta polaczone -> zero tras wewnetrznych
// ===========================================================================
console.log('\n-- Kryterium 2: owner bez techu, 2 wlasne miasta polaczone -> zero tras wewnetrznych --');
{
  const map = buildFlatMap(30);
  const p1 = city('k2-p1', 0, 0);
  const p2 = city('k2-p2', 0, 3);
  const routesNoTech = refreshTradeRoutes([p1, p2], [], map, new Map(), NO_WAR, NO_TREATY, undefined, undefined, undefined, NONE_HAVE_TECH);
  eq(routesNoTech.length, 0, 'K2: dwa wlasne miasta fizycznie polaczone, brak techu -> ZERO tras wewnetrznych (traktat nie jest w ogole wymagany dla wewnetrznej, ale tech TAK)');
  const routesWithTech = refreshTradeRoutes([p1, p2], [], map, new Map(), NO_WAR, NO_TREATY, undefined, undefined, undefined, ALL_HAVE_TECH);
  eq(routesWithTech.length, 1, 'K2: (kontrola) ta sama fikstura Z technologia -> 1 trasa wewnetrzna -- ZERO wyzej to efekt bramki, nie geometrii');
}

// ===========================================================================
// KRYTERIUM 3 -- obie strony maja tech + traktat -> trasy jak dotad (brak regresu)
// ===========================================================================
console.log('\n-- Kryterium 3: obie strony maja tech + traktat -> brak regresu --');
{
  const map = buildFlatMap(30);
  const p = city('k3-p', 0, 0);
  const f = city('k3-f', 1, 5);
  const p2 = city('k3-p2', 0, 3);
  // p potrzebuje 2 sloty istnienia (1 na f zewnetrzna + 1 na p2 wewnetrzna) --
  // 0 budynkow dawaloby limit=1, za malo dla obu tras jednoczesnie (nie blad
  // bramki techu, tylko istniejacy, niezalezny limit existence-slotow z
  // R-HANDEL-LIMIT-TRAS-PELNY-Q1 -- izolujemy test od niego).
  const built = new Map([['k3-p', ['targowisko']]]);
  const routes = refreshTradeRoutes([p, f, p2], [], map, built, NO_WAR, HAS_TREATY, undefined, undefined, undefined, ALL_HAVE_TECH);
  eq(routes.length, 2, 'K3: obie strony maja tech -- 1 trasa zewnetrzna (p<->f) + 1 wewnetrzna (p<->p2), zero regresu wobec zachowania sprzed tego tematu');
}

// ===========================================================================
// KRYTERIUM 4 -- jedna strona ma, druga nie -> zero tras (symetria, obie kolejnosci)
// ===========================================================================
console.log('\n-- Kryterium 4: jedna strona ma tech, druga nie -> zero tras (symetria) --');
{
  const map = buildFlatMap(30);
  const a = city('k4-a', 0, 0);
  const b = city('k4-b', 1, 5);
  const hasOnlyA = (ownerId) => ownerId === 0;
  const hasOnlyB = (ownerId) => ownerId === 1;
  const routesAonly = refreshTradeRoutes([a, b], [], map, new Map(), NO_WAR, HAS_TREATY, undefined, undefined, undefined, hasOnlyA);
  eq(routesAonly.length, 0, 'K4a: TYLKO owner A (0) ma tech, B (1) nie -> zero tras');
  const routesBonly = refreshTradeRoutes([a, b], [], map, new Map(), NO_WAR, HAS_TREATY, undefined, undefined, undefined, hasOnlyB);
  eq(routesBonly.length, 0, 'K4b: TYLKO owner B (1) ma tech, A (0) nie -> zero tras (kolejnosc odwrocona, ta sama para)');
}

// ===========================================================================
// KRYTERIUM 5 -- trasa istniejaca dla ownera bez techu NIE przetrwa refresh
// ===========================================================================
console.log('\n-- Kryterium 5: trasa ISTNIEJACA dla ownera, ktory (hipotetycznie) stracil tech -- NIE przetrwa refresh --');
{
  const map = buildFlatMap(30);
  const p = city('k5-p', 0, 0);
  const f = city('k5-f', 1, 5);
  const existing = refreshTradeRoutes([p, f], [], map, new Map(), NO_WAR, HAS_TREATY, undefined, undefined, undefined, ALL_HAVE_TECH);
  eq(existing.length, 1, 'K5: (setup) trasa powstaje z technologia -- ta sama trasa idzie do existingRoutes nastepnej tury');
  const refreshed = refreshTradeRoutes([p, f], existing, map, new Map(), NO_WAR, HAS_TREATY, undefined, undefined, undefined, NONE_HAVE_TECH);
  eq(refreshed.length, 0, 'K5: refresh z predykatem odmawiajacym techu -- trasa KONTYNUUJACA znika, tak samo jak przy utracie traktatu/geometrii');
}

// ===========================================================================
// KRYTERIUM 6 -- panstwo-miasto traktowane identycznie jak AI (brak wyjatku)
// ===========================================================================
console.log('\n-- Kryterium 6: panstwo-miasto (ownerId dowolny >0) bez wyjatku -- ta sama bramka co AI --');
{
  const map = buildFlatMap(30);
  // trade-routes.ts nie zna pojecia "panstwo-miasto" (RECON A) -- test dowodzi
  // TO WLASNIE: dwa rozne ownerId (jeden "reprezentujacy" panstwo-miasto,
  // drugi zwykle AI) dostaja IDENTYCZNY wynik bramki bez zadnej galezi kodu.
  const cityStateOwnerId = 7;  // umowne "panstwo-miasto"
  const regularAiOwnerId = 2;  // umowne "zwykle AI"
  const cs = city('k6-cs', cityStateOwnerId, 0);
  const ai = city('k6-ai', regularAiOwnerId, 5);
  const noTechForEither = () => false;
  const routesNoTech = refreshTradeRoutes([cs, ai], [], map, new Map(), NO_WAR, HAS_TREATY, undefined, undefined, undefined, noTechForEither);
  eq(routesNoTech.length, 0, 'K6a: panstwo-miasto (7) <-> AI (2), zaden nie ma techu -> zero tras, bez wyjatku dla panstwa-miasta');
  const techOnlyForCityState = (ownerId) => ownerId === cityStateOwnerId;
  const routesCsOnly = refreshTradeRoutes([cs, ai], [], map, new Map(), NO_WAR, HAS_TREATY, undefined, undefined, undefined, techOnlyForCityState);
  eq(routesCsOnly.length, 0, 'K6b: TYLKO panstwo-miasto ma tech, AI nie -> nadal zero (panstwo-miasto NIE dostaje przepustki)');
  const techForBoth = () => true;
  const routesBoth = refreshTradeRoutes([cs, ai], [], map, new Map(), NO_WAR, HAS_TREATY, undefined, undefined, undefined, techForBoth);
  eq(routesBoth.length, 1, 'K6c: (kontrola) oba maja tech -> 1 trasa -- panstwo-miasto handluje na TYCH SAMYCH zasadach co AI, nie gorzej ani lepiej');
}

// ===========================================================================
// KRYTERIUM 7 -- domyslny predykat (hasTradeTech POMINIETY) -> zachowanie identyczne jak przed zmiana
// ===========================================================================
console.log('\n-- Kryterium 7: domyslny predykat (parametr POMINIETY) -> wsteczna zgodnosc, NIE cicha furtka --');
{
  const map = buildFlatMap(30);
  const p = city('k7-p', 0, 0);
  const f = city('k7-f', 1, 5);
  // Wywolanie BEZ 10. argumentu -- wywolujacy spoza allowlisty tego tematu
  // (np. istniejace testy trade-routes-limit-test.cjs) nie przekazuja go w ogole.
  const routesDefault = refreshTradeRoutes([p, f], [], map, new Map(), NO_WAR, HAS_TREATY);
  eq(routesDefault.length, 1, 'K7: brak 10. argumentu -> domyslne () => true -> trasa powstaje DOKLADNIE jak przed tym tematem');
}

// ===========================================================================
// KRYTERIUM 8 -- diplomacy-locks case '5': locked wg techu obu stron
// ===========================================================================
console.log("\n-- Kryterium 8: diplomacy-locks case '5' -- locked wg technologii obu stron --");
{
  const baseCtx = {
    actionId: '5',
    contact: true,
    atWar: false,
    relTotal: 999,      // powyzej kazdego progu -- izoluje test do bramki techu
    zaufanie: 999,
    respekt: 100,
    hasNap: false,
    hasHandel: false,   // traktat JESZCZE nie zawarty -- inaczej case zwraca 'juz zawarta' przed dojsciem do bramki
    hasTradeConnection: true,
    hasSojusz: false,
    sellableTechCount: 0,
    buyableTechCount: 0,
    knownRivalsCount: 0,
    progNapRelacja: 0, progHandelRelacja: 0, progSojuszRelacja: 0, progSojuszZaufanie: 0,
    progGraniceRelacja: 0, progGraniceZaufanie: 0, progWymianaTechZaufanie: 0,
    progNamowWojneZaufanie: 0, progWasalizacjaRespekt: 0, progTrybutZadanieMinRespekt: 0,
    progDarRelacja: 0,
  };
  const rNone = resolveDiplomacyActionLock({ ...baseCtx, hasTradeTechSelf: false, hasTradeTechOther: false });
  eq(rNone.locked, true, "K8a: MY nie mamy techu, ONI tez nie -- locked===true");
  assert(/Wymiana/.test(rNone.note), `K8a: note wspomina technologie Wymiana (got: ${JSON.stringify(rNone.note)})`);

  const rSelfOnly = resolveDiplomacyActionLock({ ...baseCtx, hasTradeTechSelf: false, hasTradeTechOther: true });
  eq(rSelfOnly.locked, true, "K8b: MY nie mamy techu, ONI maja -- locked===true");
  assert(/nie zbadano/i.test(rSelfOnly.note), `K8b: note rozroznia "to MY nie mamy" (got: ${JSON.stringify(rSelfOnly.note)})`);

  const rOtherOnly = resolveDiplomacyActionLock({ ...baseCtx, hasTradeTechSelf: true, hasTradeTechOther: false });
  eq(rOtherOnly.locked, true, "K8c: MY mamy techu, ONI nie -- locked===true");
  assert(/partner/i.test(rOtherOnly.note), `K8c: note rozroznia "to ONI nie maja" (got: ${JSON.stringify(rOtherOnly.note)})`);

  const rBoth = resolveDiplomacyActionLock({ ...baseCtx, hasTradeTechSelf: true, hasTradeTechOther: true });
  eq(rBoth.locked, false, 'K8d: obie strony maja tech (pozostale warunki spelnione) -- locked===false');
}

// ---------------------------------------------------------------------------
console.log(`\n=== handel-wymiana-tech-gate-test: ${passed} passed, ${failed} failed ===`);
try { fs.unlinkSync(ENTRY_FILE); } catch (e) { /* noop */ }
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) { /* noop */ }
process.exit(failed > 0 ? 1 : 0);
