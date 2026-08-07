'use strict';
/**
 * zloto-szlak-test.cjs -- MIGRACJA (R-MENNICA-BRAZ-ZLOTO-ASYMETRIA-Q1, decyzja (b)=A,
 * Maciej 2026-08-07): zastępuje przedmigracyjny model "syntetyczny klucz augmentacji
 * placedImprovements dla złota" (PYTANIE 77=A, 2026-07-25) modelem DZISIEJSZYM, opartym
 * na stanie (magazyn państwa / empireStock) -- analogicznie do tools/mennica-uspienie-test.cjs
 * (zmigrowany wcześniej, commit 72672f9). Historia sporu i audyt pełnej migracji:
 * docs/decyzje/R-MENNICA-BRAZ-ZLOTO-ASYMETRIA-Q1.md.
 *
 * KANON DZISIEJSZY (PYTANIE-84-R9/U-3/U-13, Maciej 2026-07-27 -- zloto-access.ts nagłówek):
 *   - Złoto NIE JEST już modelem "dostęp/access-only" jak Koń -- jest surowcem MAGAZYNOWANYM
 *     (City.surowce.zloto, suma civ-wide). Kopalnia złota produkuje 1 Złoto/turę DO MAGAZYNU
 *     (KOPALNIA_ZLOTA_YIELD_PER_TURN, zloto-access.ts), nie daje już samej "flagi dostępu".
 *   - Szlaki handlowe DOSTARCZAJĄ FIZYCZNIE złoto do magazynu państwa co turę
 *     (PYTANIE-84-U3=A, docs/decyzje/PYTANIE-84.md wiersz U3 -- "szlaki dostarczają sztuki do
 *     magazynu państwa co turę, nie tylko flagę dostępu") -- `TRADE_ROUTE_STOCK_FLOW_KEYS`
 *     (trade-routes.ts) ZAWIERA 'zloto' (świadoma zmiana względem PYTANIE-77=A pierwotnego
 *     modelu dostęp-only, patrz sekcja 4 niżej). Osobno istnieje też "boolean-grant" dostępu
 *     (`TRADE_ROUTE_RESOURCE_KEYS`/`hasTradeRouteResourceAccess`) -- używany WYŁĄCZNIE przez
 *     RUNTIME gate Mennicy (main.ts `ownerHasZlotoAccessNow`, budowa-resource-gate.ts
 *     `buildingRuntimeGateMet`/`mennicaRuntimeGateMet` przez `resolveOwnerZlotoAccess`), NIE
 *     przez bramkę BUDOWY nowej Mennicy.
 *   - Bramka BUDOWY nowej Mennicy (`buildingResourceGateMet`, production.ts `availableProduction`
 *     / `buildableProduction`) patrzy WYŁĄCZNIE na `ctx.empireResourceStock.zloto > 0`
 *     (building-resource-gate.ts `DEPOSIT_LINKED_BUILDING_LABELS.mennica = ['Złoto']` +
 *     `empireLabelSatisfied`) -- NIGDY na `placedImprovements` (mapę), NIGDY na `activeLabels`
 *     jako takie, NIGDY na boolean-grant "z trasy" bez realnego przepływu ilościowego do
 *     magazynu. To jest DOKŁADNIE ta sama bramka co Targowisko w tym samym mieście
 *     (`CITY_BUILDING_PREREQ.mennica = 'targowisko'`) -- OBA warunki muszą być spełnione.
 *   - `placedImprovementsWithZlotoTradeGrant` (zloto-access.ts) jest dziś udokumentowanym
 *     no-opem (@deprecated, PYTANIE-84-U3, wdrożone FALA 41 commit 297c60c) -- main.ts nadal
 *     ją woła (kompatybilność sygnatury `placedImprovementsWithTradeGrants`), ale wynik jest
 *     zawsze IDENTYCZNY wejściu, niezależnie od `hasTradeGrant`. Testowanie tej funkcji jako
 *     "augmentacji dającej dostęp" (jak robił ten plik przed migracją) testowało martwy kod --
 *     dostęp dziś idzie WYŁĄCZNIE przez magazyn/empireStock (sekcja G niżej).
 *
 * Run from gra/:  node tools/zloto-szlak-test.cjs
 * Uzupełnia (nie zastępuje) tools/zloto-test.cjs (własna Kopalnia złota, bez tras) --
 * ten plik testuje WYŁĄCZNIE ścieżkę "dostęp/magazyn przez szlak handlowy", zgodnie z
 * sekcjami niżej:
 *   1. Własna Kopalnia złota + magazyn > 0, bez szlaków -> MOŻE budować Mennicę.
 *   2. Brak złoża, brak szlaków, brak zapasu -> NIE MOŻE budować Mennicy (magazyn pusty).
 *   3. Brak złoża, aktywny szlak DOSTARCZAJĄCY zloto do magazynu -> MOŻE budować Mennicę
 *      (SERCE tematu -- realny mechanizm stanu, nie syntetyczny klucz).
 *   4. Weryfikacja mechanizmu przepływu ilościowego złota przez szlak (PYTANIE-84-U3=A).
 *   5. Parytet AI -- ta sama reguła dla właściciela AI (ownerId != 0).
 * Sekcja F: zerwanie szlaku nie cofa JUŻ ZGROMADZONEGO zapasu w magazynie (bramka budowy
 * patrzy na magazyn, nie na żywy dostęp) -- ale cofa boolean-grant.
 * Sekcja G: kompozycja main.ts `placedImprovementsWithTradeGrants` -- złoto jest no-opem
 * (nic nie dokleja), ale dostęp mimo to działa przez magazyn (osobna, realna ścieżka).
 *
 * OGRANICZENIE UCZCIWIE PRZYZNANE (niezmienione od wersji przedmigracyjnej): main.ts SAM
 * (17+ tys. linii, jeden monolityczny bootstrap zależny od `document`/`window`/canvas/three.js,
 * bez ANI JEDNEJ wyeksportowanej funkcji testowej ani test-hooka) nie da się zbundlować/
 * zaimportować do tego node'owego harnessu esbuild -- i żaden inny test w tym repo robi tego
 * samego (bundlują wyłącznie pure-logic moduły z game//map/, nigdy main.ts). Dlatego funkcje
 * main.ts (`ownerHasZlotoAccessNow`, `placedImprovementsWithTradeGrants`) są tu odtwarzane /
 * testowane pośrednio przez ich budulcowe funkcje eksportowane z game/* (dokładnie te same,
 * które main.ts woła) -- `buildingRuntimeGateMet` z parametrem `resolveOwnerZlotoAccess` jest
 * bezpośrednim odpowiednikiem tego, co main.ts wpina jako `ownerHasZlotoAccessNow`.
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
  empireHasKopalniaZlota, KOPALNIA_ZLOTA_KEY, ownerHasZlotoStock,
  placedImprovementsWithZlotoTradeGrant, TRADE_GRANT_ZLOTO_SYNTHETIC_KEY,
} from '../src/game/zloto-access';
export { empireHasKopalniaMiedzi, KOPALNIA_MIEDZI_KEY } from '../src/game/braz-access';
export { getCityResourceAccessForCity, getResourceAccessForCity } from '../src/game/resource-access';
export { buildableProduction, eraBuildingCatalog } from '../src/game/production';
export { CITY_BUILDING_PREREQ, buildingRuntimeGateMet } from '../src/game/building-resource-gate';
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

/**
 * Ctx dla `buildableProduction`/`eraBuildingCatalog` -- pole realnie czytane przez bramkę
 * budowy Mennicy to `empireResourceStock` (production.ts AvailabilityContext), NIE
 * `activeResourceLabels` (nazwa użyta w przedmigracyjnej wersji tego pliku -- nieistniejące
 * pole w AvailabilityContext, `buildingResourceGateMet` ignoruje `_activeLabels` dla
 * DEPOSIT_LINKED niezależnie, patrz building-resource-gate.ts `empireLabelSatisfied`).
 */
function ctxFor(ownerId, empireStock, overrides) {
  return Object.assign({
    epoch: 2, builtBuildingIds: ['targowisko'], productionQueue: [],
    isCapital: true, ownerId, difficulty: 'normal',
    empireResourceStock: empireStock,
  }, overrides);
}
function mennicaBuildable(ownerId, empireStock, overrides) {
  const CITY = { id: `c${ownerId}`, q: 0, r: 0, ownerId, population: 5 };
  const items = M.buildableProduction(CITY, DATA, ['Waluta'], ctxFor(ownerId, empireStock, overrides));
  return items.some(it => it.id === 'mennica');
}
/** Etykiety aktywne miasta -- "Złoto" dziś liczone WYŁĄCZNIE z `options.empireStock`
 *  (resource-access.ts `collectActiveAccess` -> `ownerHasZlotoStock`), nigdy z mapy. */
function activeLabelsFor(ownerId, placedImprovements, empireStock) {
  return M.getResourceAccessForCity(
    { id: `c${ownerId}`, q: 0, r: 0, population: 5 }, map, placedImprovements, 99,
    { ownerId: String(ownerId), empireStock },
  );
}

// ===========================================================================
// 1. Własna Kopalnia złota + magazyn > 0, bez szlaków -> MOŻE budować Mennicę.
// ===========================================================================
console.log('-- 1. własna Kopalnia złota (magazyn > 0), bez szlaku -> Mennica DOSTĘPNA --');
{
  const placedOwn = new Map([['50,0', ['kopalnia_zlota']]]); // hex realny na mapie testowej (buildMap: q=0..400, r=0)
  ok(M.empireHasKopalniaZlota(placedOwn) === true,
    '1: empireHasKopalniaZlota -> true (funkcja RAW skanująca placedImprovements, używana w ownerHasNativeResourceAccess main.ts -- NIE w bramce budowy, patrz kontrola niżej)');

  // Kopalnia zasila magazyn PRODUKCJĄ (1 Złoto/turę, KOPALNIA_ZLOTA_YIELD_PER_TURN) --
  // tu symulujemy stan PO kilku turach: zapas już zgromadzony w magazynie.
  const stockWithGold = { zloto: 1 };
  const labels = activeLabelsFor(0, placedOwn, stockWithGold);
  ok(labels.includes('Złoto'),
    '1: etykieta "Złoto" aktywna dzięki magazynowi (empireStock.zloto>0) -- collectActiveAccess liczy Złoto WYŁĄCZNIE z ownerHasZlotoStock, nie ze skanu mapy');
  ok(mennicaBuildable(0, stockWithGold) === true, '1: Mennica BUDOWALNA z magazynem Złota > 0 (+ Targowisko w mieście)');

  // Kontrola -- SERCE asymetrii tematu decyzji (R-MENNICA-BRAZ-ZLOTO-ASYMETRIA-Q1): Kopalnia
  // na mapie BEZ zgromadzonego zapasu w magazynie NIE odblokowuje bramki budowy (inaczej niż
  // Brąz/Żelazo, gdzie mapa+ulepszenie od razu wystarczają -- braz-access.ts hasBrazAccess).
  ok(mennicaBuildable(0, undefined) === false,
    '1: (kontrola) sama Kopalnia złota na mapie BEZ zapasu w magazynie -- Mennica NIEBUDOWALNA (bramka budowy = magazyn, nigdy mapa, dla Złota)');
}

// ===========================================================================
// 2. Brak złoża, brak szlaków, brak zapasu -> Mennica NIEBUDOWALNA.
// ===========================================================================
console.log('-- 2. brak złoża, brak szlaku, brak zapasu -> Mennica NIEBUDOWALNA (bramka = magazyn państwa) --');
{
  const placedNone = new Map();
  ok(M.empireHasKopalniaZlota(placedNone) === false, '2: empireHasKopalniaZlota -> false (brak kopalni)');
  const labels = activeLabelsFor(0, placedNone, undefined);
  ok(!labels.includes('Złoto'), '2: brak etykiety "Złoto" bez kopalni, bez szlaku, bez zapasu w magazynie');
  ok(mennicaBuildable(0, undefined) === false,
    '2: Mennica NIEBUDOWALNA -- Targowisko w mieście samo NIE wystarcza (CITY_BUILDING_PREREQ spełniony), brak zapasu Złota w magazynie państwa blokuje DEPOSIT_LINKED_BUILDING_LABELS.mennica (building-resource-gate.ts)');
}

// ===========================================================================
// 3. Brak złoża, AKTYWNY szlak DOSTARCZAJĄCY złoto do magazynu -> Mennica DOSTĘPNA.
//    SERCE TEMATU migracji -- realny mechanizm stanu (empireStock), nie syntetyczny
//    klucz augmentacji placedImprovements (przedmigracyjny model, PYTANIE 77=A).
// ===========================================================================
console.log('-- 3. brak złoża + aktywny szlak dostarczający złoto do magazynu -> Mennica DOSTĘPNA --');
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
ok(M.hasTradeRouteResourceAccess(grants3, 0, 'zloto') === true, '3: gracz (owner 0) ma boolean-grant "z trasy" do złota (RUNTIME gate -- patrz niżej)');
ok(M.hasTradeRouteResourceAccess(grants3, 1, 'zloto') === false, '3: partner NIE dostaje grantu na własny surowiec');

// REALNY MECHANIZM (PYTANIE-84-U3=A, post-migracja): drugi, NIEZALEŻNY kanał -- przepływ
// ILOŚCIOWY przez TRADE_ROUTE_STOCK_FLOW_KEYS (zawiera 'zloto', patrz sekcja 4) -- to WŁAŚNIE
// ten kanał zasila magazyn państwa i otwiera bramkę BUDOWY Mennicy (nie boolean-grant sam).
ok(M.TRADE_ROUTE_STOCK_FLOW_KEYS.includes('zloto'),
  "3: (setup) 'zloto' jest w TRADE_ROUTE_STOCK_FLOW_KEYS -- szlak fizycznie dowozi złoto do magazynu (sekcja 4)");
const stockLedger3 = { 0: { zloto: 0 }, 1: { zloto: 10 } }; // partner ma nadwyżkę z własnej kopalni
const ownerStockFn3 = (ownerId, key) => stockLedger3[ownerId]?.[key] ?? 0;
const flows3 = M.computeTradeRouteResourceFlow(routes3, ownerStockFn3, M.DEFAULT_TRADE_ROUTE_RESOURCE_FLOW_PARAMS);
const zlotoFlow3 = flows3.find(f => f.resourceKey === 'zloto');
ok(!!zlotoFlow3 && zlotoFlow3.toOwnerId === 0, '3: transfer złota realnie policzony DO gracza (owner 0) z nadwyżki partnera');
for (const f of flows3) { stockLedger3[f.fromOwnerId][f.resourceKey] -= f.amount; stockLedger3[f.toOwnerId][f.resourceKey] += f.amount; }
const empireStockAfterFlow = { zloto: stockLedger3[0].zloto };
ok(empireStockAfterFlow.zloto > 0, `3: magazyn gracza ma Złoto > 0 po turze wymiany (${empireStockAfterFlow.zloto})`);

// Dostęp działa przez REALNE funkcje silnika (nie syntetyczny klucz placedImprovements):
ok(M.ownerHasZlotoStock(empireStockAfterFlow) === true, '3: ownerHasZlotoStock -- magazyn zasilony przez szlak daje dostęp');
const labels3 = activeLabelsFor(0, new Map(), empireStockAfterFlow);
ok(labels3.includes('Złoto'), '3: etykieta "Złoto" aktywna dzięki dostarczonemu przez szlak zapasowi (NIE dzięki syntetycznemu wpisowi w placedImprovements)');
ok(mennicaBuildable(0, empireStockAfterFlow) === true, '3: Mennica BUDOWALNA dzięki magazynowi zasilonemu przez szlak');

// RUNTIME gate (mennicaRuntimeGateMet, przez eksportowaną buildingRuntimeGateMet) -- dwie
// ścieżki, dokładnie jak main.ts:
// (a) fallback bez resolvera -- czysty stock (jak wyżej, ownerCanFeedMennica).
ok(M.buildingRuntimeGateMet({ id: 'mennica', epokaWejscia: 2 }, undefined, [], empireStockAfterFlow) === true,
  '3: buildingRuntimeGateMet (fallback ownerCanFeedMennica) -- aktywny dzięki stockowi z trasy');
// (b) main.ts realnie wpina resolveOwnerZlotoAccess = ownerHasZlotoAccessNow (main.ts:3396-3400,
//     OR: stock LUB natywna kopalnia LUB boolean-grant z trasy) -- symulujemy TEN SAM wzorzec
//     wprost boolean-grantem, BEZ żadnego stocku, żeby dowieść, że RUNTIME gate (w przeciwieństwie
//     do BUILD gate) reaguje też na sam boolean-grant, nie tylko na fizyczny zapas.
const hasGrant3 = M.hasTradeRouteResourceAccess(grants3, 0, 'zloto');
ok(M.buildingRuntimeGateMet(
  { id: 'mennica', epokaWejscia: 2 }, undefined, [], undefined,
  { ownerId: 0, resolveOwnerZlotoAccess: oid => oid === 0 && hasGrant3 },
) === true, '3: buildingRuntimeGateMet z resolverem (odpowiednik main.ts ownerHasZlotoAccessNow) -- aktywny dzięki SAMEMU boolean-grantowi, bez żadnego stocku w magazynie');

// KONTROLA -- asymetria build vs runtime: BUILD gate (buildingResourceGateMet, production.ts)
// NIE zna resolvera/boolean-grantu -- patrzy WYŁĄCZNIE na empireResourceStock. Sam boolean-grant
// (bez realnego przepływu ilościowego z sekcji wyżej) NIE odblokowuje budowy NOWEJ Mennicy.
ok(mennicaBuildable(0, undefined) === false,
  '3: (kontrola) sam boolean-grant "z trasy" (bez realnego przepływu do magazynu) NIE wystarcza do budowy NOWEJ Mennicy -- BUILD gate patrzy wyłącznie na magazyn, nie na dostęp/grant');

// Deprecated no-op -- placedImprovementsWithZlotoTradeGrant NIE bierze już udziału w żadnej
// z powyższych ścieżek (main.ts wywołuje ją nadal z powodów kompatybilności sygnatury, ale
// wynik jest zawsze identyczny wejściu -- patrz sekcja G, pełny dowód kompozycji).
const playerPlacedNoGold = new Map(); // gracz -- BRAK jakiejkolwiek Kopalni złota na mapie
const noAugment3 = M.placedImprovementsWithZlotoTradeGrant(playerPlacedNoGold, hasGrant3);
ok(noAugment3 === playerPlacedNoGold,
  '3: placedImprovementsWithZlotoTradeGrant -- no-op, zwraca DOKŁADNIE ten sam obiekt niezależnie od hasTradeGrant=true (deprecated, PYTANIE-84-U3)');

// ===========================================================================
// 4. Weryfikacja mechanizmu przepływu ILOŚCIOWEGO złota przez szlak (PYTANIE-84-U3=A).
//    UWAGA: przedmigracyjna wersja tego pliku asercjonowała, że TRADE_ROUTE_STOCK_FLOW_KEYS
//    NIE zawiera 'zloto' (model PYTANIE-77=A, 2026-07-25: złoto = dostęp-only jak Koń w owym
//    czasie). To był PIERWOTNY model -- ŚWIADOMIE ZASTĄPIONY przez PYTANIE-84-U3=A (Maciej,
//    2026-07-27, docs/decyzje/PYTANIE-84.md wiersz U3): "szlaki dostarczają sztuki do magazynu
//    państwa co turę, nie tylko flagę dostępu". Zweryfikowane bezpośrednio w źródle:
//    trade-routes.ts (linie ~928-931, ~1049-1057) opisuje to jako ZAMIERZONĄ, udokumentowaną
//    zmianę -- NIE bug. Ta sekcja testuje więc DZISIEJSZE, zamierzone zachowanie (flow > 0),
//    nie stary (przedmigracyjny) brak przepływu.
// ===========================================================================
console.log('-- 4. złoto PŁYNIE ilościowo przez szlak (PYTANIE-84-U3=A) -- weryfikacja mechanizmu --');
{
  ok(M.TRADE_ROUTE_RESOURCE_KEYS.includes('zloto'), '4: TRADE_ROUTE_RESOURCE_KEYS zawiera "zloto" (boolean-grant dostępu, patrz sekcja 3)');
  ok(M.TRADE_ROUTE_STOCK_FLOW_KEYS.includes('zloto'),
    "4: TRADE_ROUTE_STOCK_FLOW_KEYS ZAWIERA 'zloto' -- PYTANIE-84-U3=A: przepływ ilościowy jest ZAMIERZONY (nie bug), zastąpił pierwotny model dostęp-only z PYTANIE-77=A (patrz nagłówek pliku)");

  const stockBefore = { 0: { braz: 2, zelazo: 2, cegla: 2, zloto: 0 }, 1: { braz: 10, zelazo: 2, cegla: 2, zloto: 10 } };
  const stockAfter = JSON.parse(JSON.stringify(stockBefore));
  const ownerStock = (ownerId, key) => stockAfter[ownerId][key] ?? 0;

  const flows = M.computeTradeRouteResourceFlow(routes3, ownerStock, M.DEFAULT_TRADE_ROUTE_RESOURCE_FLOW_PARAMS);
  const zlotoFlows = flows.filter(f => f.resourceKey === 'zloto');
  ok(zlotoFlows.length === 1, `4: dokładnie jeden transfer złota policzony na trasie p1<->f1 (ma: ${zlotoFlows.length})`);
  ok(!!zlotoFlows[0] && zlotoFlows[0].fromOwnerId === 1 && zlotoFlows[0].toOwnerId === 0,
    '4: złoto płynie OD partnera (większa nadwyżka: 10) DO gracza (mniejszy zapas: 0)');
  const minReserve = M.DEFAULT_TRADE_ROUTE_RESOURCE_FLOW_PARAMS.minStockReserve;
  eq(zlotoFlows[0] && zlotoFlows[0].amount, stockBefore[1].zloto - minReserve,
    `4: ilość transferu = nadwyżka partnera ponad rezerwę (${stockBefore[1].zloto} - ${minReserve} = ${stockBefore[1].zloto - minReserve})`);

  for (const f of flows) {
    stockAfter[f.fromOwnerId][f.resourceKey] -= f.amount;
    stockAfter[f.toOwnerId][f.resourceKey] += f.amount;
  }
  ok(stockAfter[0].zloto > stockBefore[0].zloto,
    `4: zapas złota gracza PO turze > PRZED (${stockAfter[0].zloto} > ${stockBefore[0].zloto}) -- realny przypływ, nie tylko dostęp`);
  ok(M.ownerHasZlotoStock(stockAfter[0]) === true,
    '4: magazyn gracza po turze wymiany spełnia ownerHasZlotoStock -- ten sam mechanizm co bramka budowy Mennicy (sekcja 3)');
}

// ===========================================================================
// 5. Parytet AI -- ta sama reguła dla właściciela AI (ownerId != 0).
// ===========================================================================
console.log('-- 5. parytet AI -- ta sama reguła dla ownerId != 0 --');
{
  const OWNER_AI = 5, OWNER_AI_PARTNER = 6;
  // computeTradeRouteResourceGrants/computeTradeRouteResourceFlow są ownerId-agnostyczne
  // (patrz sekcja 3) -- odtwarzamy trasę p1<->f1 z parą ownerId przesuniętą na (5,6), zamiast
  // wołać refreshTradeRoutes (która łączy WYŁĄCZNIE gracz(0)<->obca cywilizacja).
  const routeShifted = { ...routes3[0], id: 'p9-f9-shift', ownerId: OWNER_AI, toOwnerId: OWNER_AI_PARTNER, fromCityId: 'p9', toCityId: 'f9' };
  function nativeAccess_shifted(ownerId, key) { return ownerId === OWNER_AI_PARTNER && key === 'zloto'; }
  const grants5 = M.computeTradeRouteResourceGrants([routeShifted], nativeAccess_shifted);
  eq(grants5.length, 1, '5: parytet -- dokładnie jeden grant dla pary (5,6)');
  eq(grants5[0].ownerId, OWNER_AI, '5: parytet -- odbiorca poprawnie = owner 5 (nie hardkodowane 0)');
  ok(M.hasTradeRouteResourceAccess(grants5, OWNER_AI, 'zloto') === true, '5: AI (owner 5) ma boolean-grant "z trasy" do złota');

  const stockLedger5 = { [OWNER_AI]: { zloto: 0 }, [OWNER_AI_PARTNER]: { zloto: 10 } };
  const ownerStockFn5 = (ownerId, key) => stockLedger5[ownerId]?.[key] ?? 0;
  const flows5 = M.computeTradeRouteResourceFlow([routeShifted], ownerStockFn5, M.DEFAULT_TRADE_ROUTE_RESOURCE_FLOW_PARAMS);
  for (const f of flows5) { stockLedger5[f.fromOwnerId][f.resourceKey] -= f.amount; stockLedger5[f.toOwnerId][f.resourceKey] += f.amount; }
  const empireStockAi = { zloto: stockLedger5[OWNER_AI].zloto };
  ok(empireStockAi.zloto > 0, `5: magazyn AI ma Złoto > 0 po turze wymiany (${empireStockAi.zloto})`);
  ok(M.ownerHasZlotoStock(empireStockAi) === true, '5: AI -- ownerHasZlotoStock działa identycznie jak dla gracza (sekcja 3)');

  const labels5 = activeLabelsFor(OWNER_AI, new Map(), empireStockAi);
  ok(labels5.includes('Złoto'), '5: etykieta "Złoto" aktywna dla AI dzięki magazynowi -- identycznie jak dla gracza (sekcja 3)');
  ok(mennicaBuildable(OWNER_AI, empireStockAi) === true,
    '5: Mennica BUDOWALNA dla AI dzięki magazynowi zasilonemu przez szlak -- identycznie jak dla gracza (sekcja 3)');

  ok(M.buildingRuntimeGateMet(
    { id: 'mennica', epokaWejscia: 2 }, undefined, [], undefined,
    { ownerId: OWNER_AI, resolveOwnerZlotoAccess: oid => oid === OWNER_AI && M.hasTradeRouteResourceAccess(grants5, OWNER_AI, 'zloto') },
  ) === true, '5: AI -- RUNTIME gate aktywny przez resolver (boolean-grant), parytet z gracza (sekcja 3)');

  // Porównanie wprost: identyczna lista budowalnych pozycji dla gracza i AI przy identycznym magazynie.
  const CITY0 = { id: 'cP', q: 0, r: 0, ownerId: 0, population: 5 };
  const CITY5 = { id: 'cA', q: 0, r: 0, ownerId: OWNER_AI, population: 5 };
  const idsPlayer = M.buildableProduction(CITY0, DATA, ['Waluta'], ctxFor(0, empireStockAi)).map(it => it.id).sort();
  const idsAi = M.buildableProduction(CITY5, DATA, ['Waluta'], ctxFor(OWNER_AI, empireStockAi)).map(it => it.id).sort();
  eq(JSON.stringify(idsPlayer), JSON.stringify(idsAi),
    '5: parytet AI -- lista budynków identyczna dla gracza i AI przy identycznym magazynie');

  // Kontrola -- bez żadnego zapasu, ani gracz, ani AI nie mogą zbudować Mennicy.
  ok(mennicaBuildable(0, undefined) === false, '5: (kontrola) gracz bez zapasu -- Mennica NIEBUDOWALNA');
  ok(mennicaBuildable(OWNER_AI_PARTNER, undefined) === false, '5: (kontrola) AI bez zapasu -- identycznie NIEBUDOWALNA');
}

// ===========================================================================
// F. Zerwanie szlaku: magazyn JUŻ ZGROMADZONY PRZETRWAŁ zerwanie (bramka budowy = magazyn,
//    nie żywy dostęp) -- ale boolean-grant (RUNTIME gate) jest cofnięty natychmiast.
// ===========================================================================
console.log('-- F. zerwanie szlaku: magazyn przetrwał zerwanie (bramka budowy = magazyn, nie żywy dostęp) --');
{
  const AT_WAR_0_1 = (a, b) => (a === 0 && b === 1) || (a === 1 && b === 0);
  const routesBroken = M.refreshTradeRoutes([p1, f1], routes3, map, built, AT_WAR_0_1, HAS_TREATY);
  eq(routesBroken.length, 0, 'F: (kontrola) wojna zrywa trasę');
  const grantsBroken = M.computeTradeRouteResourceGrants(routesBroken, nativeAccess_partnerZlotoOnly);
  ok(M.hasTradeRouteResourceAccess(grantsBroken, 0, 'zloto') === false, 'F: boolean-grant do złota cofnięty natychmiast po zerwaniu szlaku');
  ok(!activeLabelsFor(0, new Map(), undefined).includes('Złoto'),
    'F: (kontrola) bez żadnego wcześniej zgromadzonego zapasu -- po zerwaniu szlaku brak etykiety "Złoto"');

  // Magazyn zgromadzony PRZED zerwaniem (sekcja 3, empireStockAfterFlow) jest stanem NIEZALEŻNYM
  // od żywej trasy -- bramka budowy patrzy WYŁĄCZNIE na bieżący magazyn, nie sprawdza, czy trasa
  // wciąż istnieje. Dowód rozdzielenia dwóch niezależnych mechanizmów (boolean-grant vs magazyn).
  ok(mennicaBuildable(0, empireStockAfterFlow) === true,
    'F: po zerwaniu szlaku -- Mennica nadal BUDOWALNA dzięki JUŻ ZGROMADZONEMU zapasowi Złota (magazyn przetrwał zerwanie trasy, boolean-grant nie)');
  ok(mennicaBuildable(0, undefined) === false,
    'F: (kontrola) bez wcześniej zgromadzonego zapasu -- po zerwaniu szlaku Mennica NIEBUDOWALNA (brak jakiegokolwiek źródła)');

  // Mennica JUŻ ZBUDOWANA (builtBuildingIds) nie znika niezależnie od bramki -- eraBuildingCatalog
  // raportuje status='built' na podstawie samej obecności w builtBuildingIds, PRZED sprawdzeniem
  // jakiejkolwiek bramki surowcowej (production.ts eraBuildingCatalog kolejność warunków).
  const catalog = M.eraBuildingCatalog(DATA, ['Waluta'], {
    epoch: 2, builtBuildingIds: ['mennica', 'targowisko'], productionQueue: [], isCapital: true,
  });
  const mennicaEntry = catalog.find(e => e.id === 'mennica');
  ok(!!mennicaEntry && mennicaEntry.status === 'built',
    `F: Mennica już zbudowana PRZED zerwaniem szlaku -- status='built' zostaje niezależnie od bramki (budynek już stoi) (ma: ${mennicaEntry && mennicaEntry.status})`);
}

// ===========================================================================
// G. Kompozycja main.ts `placedImprovementsWithTradeGrants` (brąz + złoto RAZEM) --
//    złoto jest DZIŚ no-opem (nic nie dokleja do placedImprovements), ale dostęp do złota
//    mimo to DZIAŁA -- przez zupełnie inną, niezależną ścieżkę (magazyn/empireStock).
//    Przed migracją ten plik testował, że kompozycja DOKLEJA syntetyczny wpis złota do mapy
//    -- to jest DOKŁADNIE zachowanie, które już nie istnieje (no-op jest zamierzony, patrz
//    nagłówek pliku i docs/decyzje/R-MENNICA-BRAZ-ZLOTO-ASYMETRIA-Q1.md).
// ===========================================================================
console.log('-- G. main.ts placedImprovementsWithTradeGrants: złoto jest no-op, brąz nadal działa; dostęp do złota idzie przez magazyn --');
{
  // Symuluje main.ts placedImprovementsWithTradeGrants(ownerId, ownImprovements):
  //   withBraz = placedImprovementsWithBrazTradeGrant(ownerId, ownImprovements)  [main.ts, lokalna]
  //   return placedImprovementsWithZlotoTradeGrant(withBraz, hasZlotoGrant)      [no-op]
  // placedImprovementsWithBrazTradeGrant nie jest eksportowana z braz-access.ts (żyje
  // wyłącznie w main.ts) -- odtwarzamy tu jej jedyny obserwowalny efekt (doklejenie
  // 'kopalnia_miedzi' pod własnym syntetycznym kluczem), żeby przetestować kompozycję.
  const TRADE_GRANT_BRAZ_SYNTHETIC_KEY = '__trasa_braz__';
  const ownImprovements = new Map(); // gracz -- BEZ własnej kopalni miedzi ani złota
  const withBraz = new Map(ownImprovements);
  withBraz.set(TRADE_GRANT_BRAZ_SYNTHETIC_KEY, ['kopalnia_miedzi']);
  const withBrazAndZloto = M.placedImprovementsWithZlotoTradeGrant(withBraz, true); // hasZlotoGrant=true, ale NO-OP

  ok(M.empireHasKopalniaMiedzi(withBrazAndZloto) === true,
    'G: kompozycja -- grant brązu nadal działa (jedyna realna augmentacja tej pary, złoto jest no-op)');
  ok(M.empireHasKopalniaZlota(withBrazAndZloto) === false,
    'G: kompozycja -- grant złota jest NO-OP (PYTANIE-84-U3, commit 297c60c) -- empireHasKopalniaZlota widzi TYLKO realną kopalnię na mapie, nigdy syntetyczny wpis');
  eq(withBrazAndZloto.size, 1, 'G: kompozycja -- DOKŁADNIE 1 wpis (tylko brązu) -- złoto NIC nie dokleja do mapy (no-op)');
  ok(withBrazAndZloto.has(TRADE_GRANT_BRAZ_SYNTHETIC_KEY) && !withBrazAndZloto.has(M.TRADE_GRANT_ZLOTO_SYNTHETIC_KEY),
    'G: tylko klucz syntetyczny brązu obecny na mapie -- klucz złota (TRADE_GRANT_ZLOTO_SYNTHETIC_KEY) nigdy nie trafia do placedImprovements');

  // Mimo no-op na mapie, dostęp do złota REALNIE działa -- przez INNĄ ścieżkę (magazyn),
  // dokładnie tak jak main.ts ownerHasZlotoAccessNow (main.ts:3396-3400): OR niezależny od
  // placedImprovements. Symulujemy tu jeden z trzech składników OR -- zapas w magazynie.
  const empireStockG = { zloto: 3 };
  ok(M.ownerHasZlotoStock(empireStockG) === true,
    'G: ownerHasZlotoAccessNow -- składnik "zapas w magazynie" działa NIEZALEŻNIE od kompozycji placedImprovements powyżej');
  const labelsG = activeLabelsFor(0, withBrazAndZloto, empireStockG);
  ok(labelsG.includes('Złoto'),
    'G: etykieta "Złoto" aktywna dzięki magazynowi (empireStock), NIE dzięki kompozycji placedImprovements (która dla złota jest no-op)');
  ok(mennicaBuildable(0, empireStockG) === true,
    'G: Mennica BUDOWALNA dzięki magazynowi -- kompozycja placedImprovements (brąz+złoto) jest całkowicie nieistotna dla bramki złota');

  // Kolejność doklejania grantów -- przemienna DLA BRĄZU (jedyny realnie działający składnik);
  // złoto no-op nie zależy od kolejności z definicji (zawsze zwraca wejście bez zmian).
  const zlotoOnly = M.placedImprovementsWithZlotoTradeGrant(new Map(ownImprovements), true);
  const brazThenZloto = new Map(zlotoOnly);
  brazThenZloto.set(TRADE_GRANT_BRAZ_SYNTHETIC_KEY, ['kopalnia_miedzi']);
  ok(M.empireHasKopalniaMiedzi(brazThenZloto) === true && M.empireHasKopalniaZlota(brazThenZloto) === false,
    'G: kompozycja przemienna dla brązu niezależnie od kolejności -- złoto zawsze no-op, niezależnie od kolejności doklejania');
}

console.log(`\nzloto-szlak-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY_FILE); } catch (e) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}
process.exit(failed ? 1 : 0);
