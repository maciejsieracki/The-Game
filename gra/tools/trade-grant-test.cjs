'use strict';
/**
 * trade-grant-test.cjs -- standalone Node test for temat #4 (Handel E3b): dostęp do
 * surowca civ-wide (braz/zelazo/kon) PRZEZ TRASĘ HANDLOWĄ (HANDEL-Q11=B, boolean grant)
 * + cofanie automatyczne przy wojnie/zerwaniu/utracie połączenia.
 * Run from gra/:  node tools/trade-grant-test.cjs
 *
 * Self-contained: bundles trade-routes.ts z esbuild (no runtime imports). Covers:
 *   A. Partner ma dostęp (native) -> gracz dostaje grant "z trasy" na ten surowiec.
 *   B. Gracz BEZ dostępu natywnego i BEZ trasy -> brak grantu.
 *   C. Symetria: obie strony mogą jednocześnie dawać sobie RÓŻNE surowce jedną trasą.
 *   D. Trasa nieaktywna (status brak_polaczenia) -> nie daje grantu.
 *   E. Wojna zrywa trasę (refreshTradeRoutes) -> przeliczenie grantów z nowej (pustej)
 *      listy tras cofa dostęp automatycznie -- bez osobnego mechanizmu dezaktywacji.
 *   F. Powrót do pokoju odtwarza trasę -> grant wraca przy kolejnym przeliczeniu.
 *   G. hasTradeRouteResourceAccess / firstTradeRouteResourceGrant -- helpery UI.
 *   H. Żadnych grantów, gdy OBIE strony już mają natywny dostęp do tego samego surowca
 *      (grant nie jest potrzebny -- ownerHasNativeAccess już true, nic nie "psuje" nic).
 *   I. C-HANDEL-UMOWA=B (2026-07-23): brak/zerwanie Umowy Handlowej (bez wojny) cofa
 *      trasę -> cofa grant, tym samym mechanizmem co wojna (E) -- traktat to kolejna
 *      bramka refreshTradeRoutes, grant nadal jest czystą pochodną listy tras.
 */

const fs   = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) { console.error('[trade-grant-test] esbuild not found. Run: npm install (from gra/)'); process.exit(1); }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY_FILE  = path.resolve(__dirname, '.trade-grant-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.trade-grant-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export {
  refreshTradeRoutes, tradeRouteId,
  computeTradeRouteResourceGrants, hasTradeRouteResourceAccess, firstTradeRouteResourceGrant,
  TRADE_ROUTE_RESOURCE_KEYS,
} from '../src/game/trade-routes';
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
  console.error('[trade-grant-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const TR = require(BUNDLE_FILE);

let passed = 0, failed = 0;
function assert(cond, msg) { if (cond) passed++; else { failed++; console.error('  FAIL:', msg); } }
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

// ---------------------------------------------------------------------------
// Fixture map: jeden dlugi rzad r=0, cala 'rownina' (ladowa, przechodnia) -- jak
// w trade-routes-income-test.cjs.
// ---------------------------------------------------------------------------
function buildMap() {
  const hexes = {};
  for (let q = 0; q <= 400; q++) hexes[`${q},0`] = { terenBazowy: 'rownina' };
  return { szerokoscQ: 401, wysokoscR: 1, hexes, seed: 1, riverPaths: [] };
}
const map = buildMap();
function city(id, ownerId, q) { return { id, ownerId, q, r: 0 }; }
const NO_WAR = () => false;
const AT_WAR_0_1 = (a, b) => (a === 0 && b === 1) || (a === 1 && b === 0);
// C-HANDEL-UMOWA=B (2026-07-23): refreshTradeRoutes wymaga jawnego predykatu Umowy
// Handlowej (6. argument). HAS_TREATY = para ma zawarta umowe -- uzywany w A-H, ktore
// testuja granty niezaleznie od gatingu traktatu; gating dedykowany w sekcji I.
const HAS_TREATY = () => true;
const NO_TREATY  = () => false;

// ---------------------------------------------------------------------------
// A. Partner ma dostęp natywny -> gracz dostaje grant "z trasy"
// ---------------------------------------------------------------------------
console.log('\n-- A. computeTradeRouteResourceGrants: partner ma dostęp -> gracz dostaje grant --');
const p1 = city('p1', 0, 0);
const f1 = city('f1', 1, 5);
const built = new Map([['p1', ['targowisko']], ['f1', ['targowisko']]]);

const routesA = TR.refreshTradeRoutes([p1, f1], [], map, built, NO_WAR, HAS_TREATY);
eq(routesA.length, 1, 'A: (setup) trasa p1<->f1 istnieje');

// Partner (owner 1) ma braz natywnie; gracz (owner 0) nie ma niczego natywnie.
function nativeAccess_partnerBrazOnly(ownerId, key) {
  return ownerId === 1 && key === 'braz';
}
const grantsA = TR.computeTradeRouteResourceGrants(routesA, nativeAccess_partnerBrazOnly);
eq(grantsA.length, 1, 'A: dokladnie jeden grant');
eq(grantsA[0].ownerId, 0, 'A: odbiorca = gracz (owner 0)');
eq(grantsA[0].resourceKey, 'braz', 'A: surowiec = braz');
eq(grantsA[0].viaOwnerId, 1, 'A: partner = owner 1');
eq(grantsA[0].viaCityId, 'p1', 'A: viaCityId = koniec trasy odbiorcy (miasto gracza)');
eq(grantsA[0].routeId, routesA[0].id, 'A: routeId = id trasy');
eq(TR.hasTradeRouteResourceAccess(grantsA, 0, 'braz'), true, 'A: hasTradeRouteResourceAccess(gracz, braz) = true');
eq(TR.hasTradeRouteResourceAccess(grantsA, 1, 'braz'), false, 'A: partner NIE dostaje grantu na wlasny surowiec');

// ---------------------------------------------------------------------------
// B. Zero dostępu natywnego po żadnej stronie -> zero grantów
// ---------------------------------------------------------------------------
console.log('\n-- B. brak dostepu natywnego -> brak grantow --');
const NO_NATIVE = () => false;
const grantsB = TR.computeTradeRouteResourceGrants(routesA, NO_NATIVE);
eq(grantsB.length, 0, 'B: zero grantow gdy nikt nie ma dostepu natywnego');
eq(TR.hasTradeRouteResourceAccess(grantsB, 0, 'braz'), false, 'B: gracz bez grantu');

// ---------------------------------------------------------------------------
// C. Symetria: obie strony dają sobie RÓŻNE surowce jedną trasą
// ---------------------------------------------------------------------------
console.log('\n-- C. symetria: gracz ma zelazo natywnie, partner ma braz natywnie -> wymiana obu kierunkow --');
function nativeAccess_symmetric(ownerId, key) {
  if (ownerId === 0 && key === 'zelazo') return true; // gracz ma zelazo
  if (ownerId === 1 && key === 'braz') return true;   // partner ma braz
  return false;
}
const grantsC = TR.computeTradeRouteResourceGrants(routesA, nativeAccess_symmetric);
eq(grantsC.length, 2, 'C: dwa granty (jeden w kazda strone)');
eq(TR.hasTradeRouteResourceAccess(grantsC, 0, 'braz'), true, 'C: gracz dostaje braz od partnera');
eq(TR.hasTradeRouteResourceAccess(grantsC, 1, 'zelazo'), true, 'C: partner dostaje zelazo od gracza');
eq(TR.hasTradeRouteResourceAccess(grantsC, 0, 'zelazo'), false, 'C: gracz NIE dostaje grantu na wlasny surowiec (ma go juz natywnie -- ownerHasNativeAccess, nie grant)');
eq(TR.hasTradeRouteResourceAccess(grantsC, 1, 'braz'), false, 'C: partner analogicznie bez grantu na wlasny surowiec');
eq(TR.hasTradeRouteResourceAccess(grantsC, 0, 'kon'), false, 'C: brak natywnego dostepu do kon po zadnej stronie -> brak grantu');

// ---------------------------------------------------------------------------
// D. Trasa nieaktywna (status brak_polaczenia) -> nie daje grantu
// ---------------------------------------------------------------------------
console.log('\n-- D. trasa status=brak_polaczenia -> zero grantow --');
const inactiveRoute = { ...routesA[0], status: 'brak_polaczenia' };
const grantsD = TR.computeTradeRouteResourceGrants([inactiveRoute], nativeAccess_partnerBrazOnly);
eq(grantsD.length, 0, 'D: trasa nieaktywna nie generuje grantu');

// ---------------------------------------------------------------------------
// E. Wojna zrywa trase -> przeliczenie z nowej (pustej) listy cofa grant
// ---------------------------------------------------------------------------
console.log('\n-- E. wojna: refreshTradeRoutes usuwa trase -> recompute grantow daje zero --');
const routesE_war = TR.refreshTradeRoutes([p1, f1], routesA, map, built, AT_WAR_0_1, HAS_TREATY);
eq(routesE_war.length, 0, 'E: (kontrola trade-routes.ts) wojna -> lista tras pusta');
const grantsE = TR.computeTradeRouteResourceGrants(routesE_war, nativeAccess_partnerBrazOnly);
eq(grantsE.length, 0, 'E: grant cofniety automatycznie -- BEZ osobnej dezaktywacji, tylko przeliczenie z aktualnej listy tras');
eq(TR.hasTradeRouteResourceAccess(grantsE, 0, 'braz'), false, 'E: gracz traci dostep do brazu po wojnie');

// ---------------------------------------------------------------------------
// F. Powrot do pokoju odtwarza trase -> grant wraca
// ---------------------------------------------------------------------------
console.log('\n-- F. powrot do pokoju: trasa odtworzona -> grant wraca --');
const routesF_peace = TR.refreshTradeRoutes([p1, f1], routesE_war, map, built, NO_WAR, HAS_TREATY);
eq(routesF_peace.length, 1, 'F: (kontrola) trasa odtworzona po powrocie do pokoju');
const grantsF = TR.computeTradeRouteResourceGrants(routesF_peace, nativeAccess_partnerBrazOnly);
eq(grantsF.length, 1, 'F: grant wraca po odtworzeniu trasy');
eq(TR.hasTradeRouteResourceAccess(grantsF, 0, 'braz'), true, 'F: gracz odzyskuje dostep do brazu');

// Rownowaznie: zerwanie umowy handlowej symulowane brakiem trasy w ogole
// (np. limit tras spadl do 0 po zniszczeniu Targowiska) -- ta sama sciezka co wojna,
// bo trade-routes.ts juz usuwa trase z listy (refreshTradeRoutes), a grant jest
// czysta pochodna tej listy.
console.log('\n-- F2. "zerwanie" (limit tras = 0, budynek handlowy zniszczony) -> grant znika --');
const builtNoTargowisko = new Map([['p1', []], ['f1', ['targowisko']]]);
const routesF2 = TR.refreshTradeRoutes([p1, f1], routesF_peace, map, builtNoTargowisko, NO_WAR, HAS_TREATY);
eq(routesF2.length, 0, 'F2: (kontrola) limit tras=0 po stronie gracza -> trasa usunieta');
const grantsF2 = TR.computeTradeRouteResourceGrants(routesF2, nativeAccess_partnerBrazOnly);
eq(grantsF2.length, 0, 'F2: grant znika razem z trasa (zerwanie != wojna, ten sam mechanizm)');

// ---------------------------------------------------------------------------
// G. firstTradeRouteResourceGrant -- helper UI (zrodlo "szlak handlowy z X")
// ---------------------------------------------------------------------------
console.log('\n-- G. firstTradeRouteResourceGrant: helper UI --');
const g1 = TR.firstTradeRouteResourceGrant(grantsA, 0, 'braz');
assert(g1 !== undefined, 'G: grant istnieje dla (0, braz)');
eq(g1.viaOwnerId, 1, 'G: viaOwnerId wskazuje partnera do wyswietlenia zrodla');
const gNone = TR.firstTradeRouteResourceGrant(grantsA, 0, 'zelazo');
eq(gNone, undefined, 'G: brak grantu -> undefined (surowiec inny niz przyznany)');

// ---------------------------------------------------------------------------
// H. Oboje maja natywny dostep do tego samego surowca -> zero grantow (nie trzeba)
// ---------------------------------------------------------------------------
console.log('\n-- H. oboje maja braz natywnie -> zero grantow (niepotrzebne) --');
function nativeAccess_bothBraz(_ownerId, key) { return key === 'braz'; }
const grantsH = TR.computeTradeRouteResourceGrants(routesA, nativeAccess_bothBraz);
eq(grantsH.length, 0, 'H: nikt nie dostaje grantu -- oboje juz maja dostep natywnie (ownerHasNativeAccess prawdziwe po obu stronach, ale grant idzie tylko do STRONY PRZECIWNEJ ktora go NIE MA -- tu obie juz maja, wiec brak sensu przyznawania)');

// ---------------------------------------------------------------------------
// I. C-HANDEL-UMOWA=B: brak/zerwanie Umowy Handlowej (bez wojny) cofa trase -> cofa grant
// ---------------------------------------------------------------------------
console.log('\n-- I. brak/zerwanie Umowy Handlowej (bez wojny) -> trasa i grant znikaja --');
const routesI_noTreaty = TR.refreshTradeRoutes([p1, f1], [], map, built, NO_WAR, NO_TREATY);
eq(routesI_noTreaty.length, 0, 'I: pokoj + geometria OK, ale BRAK Umowy Handlowej -> zero tras');
const grantsI_noTreaty = TR.computeTradeRouteResourceGrants(routesI_noTreaty, nativeAccess_partnerBrazOnly);
eq(grantsI_noTreaty.length, 0, 'I: bez trasy -- zero grantow');

const routesI_signed = TR.refreshTradeRoutes([p1, f1], routesI_noTreaty, map, built, NO_WAR, HAS_TREATY);
eq(routesI_signed.length, 1, 'I: zawarcie Umowy Handlowej -> trasa powstaje');
const grantsI_signed = TR.computeTradeRouteResourceGrants(routesI_signed, nativeAccess_partnerBrazOnly);
eq(grantsI_signed.length, 1, 'I: po zawarciu traktatu -- grant wraca');
eq(TR.hasTradeRouteResourceAccess(grantsI_signed, 0, 'braz'), true, 'I: gracz ma dostep do brazu przez nowo zawarta trase');

const routesI_broken = TR.refreshTradeRoutes([p1, f1], routesI_signed, map, built, NO_WAR, NO_TREATY);
eq(routesI_broken.length, 0, 'I: zerwanie Umowy Handlowej (NADAL pokoj, brak wojny) -> trasa znika');
const grantsI_broken = TR.computeTradeRouteResourceGrants(routesI_broken, nativeAccess_partnerBrazOnly);
eq(grantsI_broken.length, 0, 'I: grant cofniety razem z trasa -- ta sama pochodna, tylko inna przyczyna zerwania niz wojna (E)');
eq(TR.hasTradeRouteResourceAccess(grantsI_broken, 0, 'braz'), false, 'I: gracz traci dostep do brazu po zerwaniu traktatu');

console.log(`\ntrade-grant-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY_FILE); } catch (e) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}
process.exit(failed ? 1 : 0);
