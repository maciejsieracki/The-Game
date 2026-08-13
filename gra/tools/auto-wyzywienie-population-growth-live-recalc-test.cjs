'use strict';
/**
 * auto-wyzywienie-population-growth-live-recalc-test.cjs — P-AUTO-WYZYWIENIE-BUG2 (ECHO A Macieja)
 *
 * Kontekst: `applyLiveSafeRationForCity` (main.ts, P-AUTO-WYZYWIENIE-BUG1) przeliczała bezpieczny
 * poziom Racji z KAŻDEGO dyskretnego zdarzenia UI, ale NIGDY z przyrostu populacji tej samej
 * tury -- koszt Racji skaluje się liniowo z populacją (`computeCityRationCost`), populacja rośnie
 * niemal zawsze przy małych miastach (bonus "Małe miasto"), więc poziom uznany za bezpieczny w
 * turze N stawał się deficytowy w N+1: NIC nie wyzwalało ponownej walidacji po wzroście.
 *
 * Naprawa (ECHO A): `applyPostCentralPopulationGrowth` (population-growth-v85.ts) przyjmuje
 * opcjonalny callback `onCityPopulationChanged(cityId)`, wołany PO faktycznej zmianie
 * `city.population` w tej turze (nie tylko gdy liczony jest procent wzrostu). main.ts spina go z
 * `applyLiveSafeRationForCity`. Callback zamiast importu main.ts -- unika cyklicznego importu
 * main.ts <-> population-growth-v85.ts. Analogicznie: 4 miejsca `seedCityOwnerDefaults(...)`,
 * które mogą przekazać miasto GRACZOWI (founding gracza, kapitulacja głodowa, wchłonięcie
 * dyplomatyczne, podbój w bitwie), teraz wołają `applyLiveSafeRationForCity` zaraz po.
 *
 * Ten test wykonuje NAPRAWDĘ:
 *  - `applyPostCentralPopulationGrowth` z gra/src/game/population-growth-v85.ts (zbudowaną przez
 *    esbuild, nie reimplementację) -- realny mechanizm wzrostu populacji;
 *  - ciało `applyLiveSafeRationForCity` wycięte z main.ts (wzorem
 *    auto-wyzywienie-live-recalc-test.cjs Część 3), z `getMaxSafePoziomRacjiForPlayerCity`
 *    mockowanym na PRAWDZIWĄ `maxSafePoziomRacjiForCity` z empire-food.ts.
 *
 * node tools/auto-wyzywienie-population-growth-live-recalc-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const MAIN_TS = path.join(GRA_ROOT, 'src', 'main.ts');
const POPGROWTH_TS = path.join(GRA_ROOT, 'src', 'game', 'population-growth-v85.ts');
const src = fs.readFileSync(MAIN_TS, 'utf8');
const popGrowthSrc = fs.readFileSync(POPGROWTH_TS, 'utf8');

let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; } else { fail++; console.error('FAIL:', label); }
}

function sliceFunctionBody(source, sigMarker) {
  const sigIdx = source.indexOf(sigMarker);
  if (sigIdx < 0) return null;
  const braceOpen = sigIdx + sigMarker.length - 1;
  let depth = 0, bodyStart = -1, bodyEnd = -1;
  for (let i = braceOpen; i < source.length; i++) {
    const ch = source[i];
    if (ch === '{') { depth++; if (depth === 1) bodyStart = i + 1; }
    else if (ch === '}') { depth--; if (depth === 0) { bodyEnd = i; break; } }
  }
  return bodyStart >= 0 && bodyEnd > bodyStart ? source.slice(bodyStart, bodyEnd) : null;
}

// RUNDA 2 (Nota A): wycina CAŁĄ instrukcję blokową (np. `for (...) { ... }`) zaczynającą się od
// headerMarker, WŁĄCZNIE z nawiasami klamrowymi -- do wykonania jako prawdziwy fragment main.ts
// (nie reimplementacja), analogicznie do sliceFunctionBody powyżej (ciała funkcji).
function sliceStatementBlock(source, headerMarker) {
  const headerIdx = source.indexOf(headerMarker);
  if (headerIdx < 0) return null;
  const braceOpen = source.indexOf('{', headerIdx);
  if (braceOpen < 0) return null;
  let depth = 0, end = -1;
  for (let i = braceOpen; i < source.length; i++) {
    const ch = source[i];
    if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) { end = i; break; } }
  }
  return end >= 0 ? source.slice(headerIdx, end + 1) : null;
}

// ---------------------------------------------------------------------------
// Część 1: wiring statyczny -- population-growth-v85.ts woła onCityPopulationChanged
// WEWNĄTRZ `if (city.population !== before)`, PO rebalanceWorkersAfterPopulationChange/
// refreshManpowerAfterPopChange (tzn. PO faktycznym zapisaniu nowej populacji).
// ---------------------------------------------------------------------------
{
  const sig = 'export function applyPostCentralPopulationGrowth(opts: PostCentralGrowthOpts): void {';
  const body = sliceFunctionBody(popGrowthSrc, sig);
  ok(body !== null, 'znaleziono ciało applyPostCentralPopulationGrowth w population-growth-v85.ts');

  const ifIdx = body ? body.indexOf('if (city.population !== before)') : -1;
  ok(ifIdx >= 0, 'applyPostCentralPopulationGrowth zawiera `if (city.population !== before)`');

  let ifBlock = '';
  if (body && ifIdx >= 0) {
    const braceOpen = body.indexOf('{', ifIdx);
    let depth = 0, blockStart = -1, blockEnd = -1;
    for (let i = braceOpen; i < body.length; i++) {
      const ch = body[i];
      if (ch === '{') { depth++; if (depth === 1) blockStart = i + 1; }
      else if (ch === '}') { depth--; if (depth === 0) { blockEnd = i; break; } }
    }
    ifBlock = blockStart >= 0 && blockEnd > blockStart ? body.slice(blockStart, blockEnd) : '';
  }
  ok(ifBlock.includes('onCityPopulationChanged?.(city.id)'),
    'blok `if (city.population !== before)` woła onCityPopulationChanged?.(city.id)');

  // Musi zostać PO faktycznym zapisie populacji (city.population = growth.nowaLudnosc leci
  // PRZED tym blokiem, poza nim) -- sprawdzamy, że wywołanie nie poprzedza rebalance/manpower
  // (czyli że nie trafiło na sam początek bloku, przed realnym przeliczeniem tego zdarzenia).
  const rebalIdx = ifBlock.indexOf('rebalanceWorkersAfterPopulationChange(');
  const callIdx = ifBlock.indexOf('onCityPopulationChanged?.(city.id)');
  ok(rebalIdx >= 0 && callIdx >= 0 && rebalIdx < callIdx,
    'onCityPopulationChanged wołany PO rebalanceWorkersAfterPopulationChange w tym samym bloku (nie przed)');
}

// ---------------------------------------------------------------------------
// Część 2 (RUNDA 2, Nota A -- Evaluator P-AUTO-WYZYWIENIE-SPICHLERZ-NAWRACAJACY-DEFICYT):
// wywołanie applyPostCentralPopulationGrowth({...}) w main.ts NIE woła applyLiveSafeRationForCity
// PER-MIASTO od razu w callbacku (to był błąd rundy 1 -- miasta B..N mają wtedy jeszcze STARE
// populacje w previewCityEconomy wołanym dla miasta A) -- callback ma TYLKO zbierać cityId do
// Setu; realne zbiorcze przeliczenie musi stać PO wywołaniu applyPostCentralPopulationGrowth,
// czyli PO zakończeniu CAŁEJ pętli wzrostu (wszystkie miasta mają już finalną populację).
// ---------------------------------------------------------------------------
{
  const callIdx = src.indexOf('applyPostCentralPopulationGrowth({');
  ok(callIdx >= 0, 'znaleziono wywołanie applyPostCentralPopulationGrowth({...}) w main.ts');
  let argsBody = '', bodyEndIdx = -1;
  if (callIdx >= 0) {
    const braceOpen = src.indexOf('{', callIdx);
    let depth = 0, bodyStart = -1, bodyEnd = -1;
    for (let i = braceOpen; i < src.length; i++) {
      const ch = src[i];
      if (ch === '{') { depth++; if (depth === 1) bodyStart = i + 1; }
      else if (ch === '}') { depth--; if (depth === 0) { bodyEnd = i; break; } }
    }
    argsBody = bodyStart >= 0 && bodyEnd > bodyStart ? src.slice(bodyStart, bodyEnd) : '';
    bodyEndIdx = bodyEnd;
  }
  ok(argsBody.includes('onCityPopulationChanged:'),
    'wywołanie applyPostCentralPopulationGrowth w main.ts przekazuje onCityPopulationChanged');
  ok(argsBody.includes('grownCityIdsForLiveRation.add(cityId)'),
    'NOTA A: onCityPopulationChanged W ARGUMENTACH WOŁANIA (podczas pętli wzrostu) TYLKO zbiera cityId do Setu -- nie woła applyLiveSafeRationForCity od razu');
  ok(!argsBody.includes('applyLiveSafeRationForCity('),
    'NOTA A: argumenty applyPostCentralPopulationGrowth NIE wołają applyLiveSafeRationForCity bezpośrednio (to był błąd rundy 1)');

  // Zbiorcza pętla PO wywołaniu (poza argsBody, w kodzie następującym PO zamknięciu wywołania).
  const afterCall = bodyEndIdx >= 0 ? src.slice(bodyEndIdx, bodyEndIdx + 1000) : '';
  ok(afterCall.includes('for (const grownCityId of grownCityIdsForLiveRation)'),
    'NOTA A: PO applyPostCentralPopulationGrowth następuje pętla po grownCityIdsForLiveRation (zbiorcze przeliczenie)');
  ok(afterCall.includes('applyLiveSafeRationForCity(grownCityId)'),
    'NOTA A: pętla PO applyPostCentralPopulationGrowth woła applyLiveSafeRationForCity dla każdego zebranego miasta');
}

// ---------------------------------------------------------------------------
// Część 3: wiring miejsc `seedCityOwnerDefaults(...)`, które mogą przekazać miasto graczowi
// -- każde woła applyLiveSafeRationForCity w bezpośrednim sąsiedztwie (max 400 znaków dalej).
// UWAGA (RUNDA 2, Nota B): `resolveSiegeSurrender` NIE jest już w tej pętli -- jej wywołanie
// applyLiveSafeRationForCity zostało PRZENIESIONE daleko od seedCityOwnerDefaults (za
// endMapSiege, patrz Część 3b niżej), więc test "sąsiedztwa 400 znaków" celowo go pomija.
// ---------------------------------------------------------------------------
{
  const seedCallSites = [
    { label: 'tryFoundPlayerCityAt (founding gracza)', marker: 'function tryFoundPlayerCityAt(' },
    { label: 'annexCityStateToOwner (wchłonięcie dyplomatyczne)', marker: 'function annexCityStateToOwner(' },
  ];
  for (const site of seedCallSites) {
    const body = sliceFunctionBody(src, site.marker);
    ok(body !== null, `znaleziono funkcję: ${site.label}`);
    const seedIdx = body ? body.indexOf('seedCityOwnerDefaults(') : -1;
    ok(seedIdx >= 0, `${site.label}: woła seedCityOwnerDefaults(...)`);
    const window = body && seedIdx >= 0 ? body.slice(seedIdx, seedIdx + 400) : '';
    ok(window.includes('applyLiveSafeRationForCity('),
      `${site.label}: applyLiveSafeRationForCity(...) w sąsiedztwie seedCityOwnerDefaults(...) (max 400 znaków dalej)`);
  }

  // ---------------------------------------------------------------------------
  // Część 3b (NOTA B, runda 2 Evaluatora): w `resolveSiegeSurrender` applyLiveSafeRationForCity
  // musi stać PO endMapSiege(cityId) (miasto ma wtedy już oblegane=false -> trafia do filtra
  // `playerCities` w getMaxSafePoziomRacjiForPlayerCity, zamiast liczyć się zdegenerowanym
  // fallbackiem), i PO ustaleniu finalnej populacji miasta (city.population = Math.max(1, ...)
  // w gałęzi przejęcia) -- "najpierw ustal finalny stan miasta, potem przelicz na tej podstawie".
  // ---------------------------------------------------------------------------
  {
    const body = sliceFunctionBody(src, 'function resolveSiegeSurrender(cityId: string): void {');
    ok(body !== null, 'znaleziono funkcję resolveSiegeSurrender (Nota B)');

    const lastEndMapSiegeIdx = body ? body.lastIndexOf('endMapSiege(cityId);') : -1;
    const applyIdx = body ? body.indexOf('applyLiveSafeRationForCity(cityId)') : -1;
    const popFixIdx = body ? body.indexOf('city.population = Math.max(1, city.population);') : -1;

    ok(lastEndMapSiegeIdx >= 0, 'resolveSiegeSurrender: woła endMapSiege(cityId) (Nota B)');
    ok(applyIdx >= 0, 'resolveSiegeSurrender: woła applyLiveSafeRationForCity(cityId) (Nota B)');
    ok(popFixIdx >= 0, 'resolveSiegeSurrender: ustawia city.population = Math.max(1, city.population) (Nota B)');

    ok(popFixIdx >= 0 && lastEndMapSiegeIdx >= 0 && popFixIdx < lastEndMapSiegeIdx,
      'NOTA B: city.population = Math.max(1, ...) w resolveSiegeSurrender ustawiane PRZED endMapSiege(cityId) (finalny stan miasta przed przeliczeniem)');
    ok(applyIdx >= 0 && lastEndMapSiegeIdx >= 0 && applyIdx > lastEndMapSiegeIdx,
      'NOTA B: applyLiveSafeRationForCity(cityId) w resolveSiegeSurrender stoi PO (ostatnim) endMapSiege(cityId), NIE przed -- inaczej miasto ma jeszcze oblegane=true i wypada z filtra playerCities');
  }

  // applyCityCaptureToMap (podbój w bitwie): return type z brace-delimited obiektem POPRZEDZA
  // ciało funkcji, więc sliceFunctionBody (licząca głębokość klamer od '(' sygnatury) złapałaby
  // TYP zwracany, nie realne ciało -- sprawdzamy bezpośrednio callback `onOwnerChanged`, który
  // jego marker `=> {` kończy dokładnie na otwierającej klamrze ciała strzałki.
  const onOwnerChangedMarker = 'onOwnerChanged: (c: City): void => {';
  {
    const idx = src.indexOf(onOwnerChangedMarker);
    ok(idx >= 0, 'applyCityCaptureToMap (podbój w bitwie): znaleziono callback onOwnerChanged: (c: City): void => {...}');
    let body = null;
    if (idx >= 0) {
      const braceOpen = idx + onOwnerChangedMarker.length - 1; // wskazuje na finalne '{' markera
      let depth = 0, bodyStart = -1, bodyEnd = -1;
      for (let i = braceOpen; i < src.length; i++) {
        const ch = src[i];
        if (ch === '{') { depth++; if (depth === 1) bodyStart = i + 1; }
        else if (ch === '}') { depth--; if (depth === 0) { bodyEnd = i; break; } }
      }
      body = bodyStart >= 0 && bodyEnd > bodyStart ? src.slice(bodyStart, bodyEnd) : null;
    }
    ok(!!body && body.includes('seedCityOwnerDefaults(') && body.includes('applyLiveSafeRationForCity('),
      'applyCityCaptureToMap (podbój w bitwie): callback onOwnerChanged woła zarówno seedCityOwnerDefaults(...) jak i applyLiveSafeRationForCity(...)');
  }
}

// ---------------------------------------------------------------------------
// Część 4 (SEDNO ZGŁOSZENIA): wykonaj NAPRAWDĘ applyPostCentralPopulationGrowth (bundled z
// population-growth-v85.ts) + ciało applyLiveSafeRationForCity (wycięte z main.ts) spięte tym
// samym callbackiem co main.ts. Scenariusz: miasto gracza Ludność 1, poziom Racji=6 (bezpieczny
// DOKŁADNIE dla Ludność 1 przy tej produkcji -- bilans=0), wzrostUlamkowy=0,99 + WZROST% tej tury
// wystarczający, by w JEDNYM wywołaniu przekroczyć próg 1,0 i podnieść populację do 2. Bez
// naprawy: poziom Racji zostałby przy 6 (bezpieczny dla starej Ludności 1, deficytowy dla nowej
// Ludności 2) aż do końca kolejnej tury. Z naprawą: przeliczony NATYCHMIAST w tym samym wywołaniu.
// ---------------------------------------------------------------------------
const ENTRY = path.resolve(__dirname, '.pop-growth-live-recalc-entry.ts');
const BUNDLE = path.resolve(__dirname, '.pop-growth-live-recalc-bundle.cjs');
fs.writeFileSync(ENTRY, `
export { applyPostCentralPopulationGrowth } from '../src/game/population-growth-v85';
export { ensureCityRationDefaults, getCityRationLevel } from '../src/game/population-growth-v85';
export { maxSafePoziomRacjiForCity, isCityAutoWyzywienieEnabled } from '../src/game/empire-food';
`, 'utf8');
esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, absWorkingDir: GRA_ROOT, logLevel: 'silent',
});
const M = require(BUNDLE);

// Ciało REALNEJ applyLiveSafeRationForCity, wycięte z main.ts (nie reimplementacja).
const sigMarker = 'function applyLiveSafeRationForCity(cityId: string): void {';
const sigIdx = src.indexOf(sigMarker);
ok(sigIdx >= 0, 'znaleziono sygnaturę applyLiveSafeRationForCity(cityId: string): void w main.ts (Część 4)');
let fnBody = '';
if (sigIdx >= 0) {
  const braceOpen = sigIdx + sigMarker.length - 1;
  let depth = 0, bodyStart = -1, bodyEnd = -1;
  for (let i = braceOpen; i < src.length; i++) {
    const ch = src[i];
    if (ch === '{') { depth++; if (depth === 1) bodyStart = i + 1; }
    else if (ch === '}') { depth--; if (depth === 0) { bodyEnd = i; break; } }
  }
  fnBody = bodyStart >= 0 && bodyEnd > bodyStart ? src.slice(bodyStart, bodyEnd) : '';
}
ok(!!fnBody, 'wycięto ciało applyLiveSafeRationForCity(...) (Część 4)');

if (fnBody && M.applyPostCentralPopulationGrowth) {
  const rationParams = { r0: 0, r1: 6, r2: 12, r3: 20, r4: 30, r5: 42, r6: 56 }; // pola nieużywane przez computeCityRationCost (koszt = poziom*2, R_STAWKI_KOSZT_MULT)

  const city = {
    id: 'c1', ownerId: 0, population: 1, poziomRacji: 6, // bezpieczny DOKŁADNIE dla Ludność 1 (koszt=1*6*2=12=produkcja)
    rationMigratedV114: true, wzrostUlamkowy: 0.99, turyBezDoplaty: 0,
    autoWyzywienie: true, manpower: 0,
  };
  const cities = [city];
  const tick = {
    cityId: 'c1', ownerId: 0, oblegany: false,
    zywnoscBrutto: 12, kosztRacji: 12, bilansLokalny: 0, zdrowie: 0,
    spichlerzCeramika: false, spichlerzSol: false, maSpichlerz: false, maSpichlerzII: false,
  };
  const econ = { perCity: [tick], growth: 0, starved: 0 };
  const efResult = {
    perOwner: [{
      perCityRows: [{ cityId: 'c1' }],
      fedByCityId: new Map([['c1', true]]),
    }],
  };

  let dirtyCalls = 0;
  function runApplyLiveSafeRationForCity(cityId) {
    const ctx = {
      cities,
      isCityAutoWyzywienieEnabled: M.isCityAutoWyzywienieEnabled,
      ensureCityRationDefaults: M.ensureCityRationDefaults,
      getCityRationLevel: M.getCityRationLevel,
      markCityStateDirty: () => { dirtyCalls++; },
      getMaxSafePoziomRacjiForPlayerCity: (cid) => M.maxSafePoziomRacjiForCity({
        cityId: cid, ownerId: 0, cities, econ, zapasyPrzed: 0, rationParams,
      }),
    };
    const fn = new Function(
      'cities', 'isCityAutoWyzywienieEnabled', 'ensureCityRationDefaults',
      'getCityRationLevel', 'markCityStateDirty', 'getMaxSafePoziomRacjiForPlayerCity', 'cityId',
      fnBody,
    );
    fn(
      ctx.cities, ctx.isCityAutoWyzywienieEnabled, ctx.ensureCityRationDefaults,
      ctx.getCityRationLevel, ctx.markCityStateDirty, ctx.getMaxSafePoziomRacjiForPlayerCity, cityId,
    );
  }

  // Kontrola założenia (PRZED wzrostem): przy Ludność 1 poziom 6 JEST bezpieczny -- test nie
  // dowodziłby niczego, gdyby start już był niebezpieczny.
  const maxSafeAtPop1 = M.maxSafePoziomRacjiForCity({
    cityId: 'c1', ownerId: 0, cities, econ, zapasyPrzed: 0, rationParams,
  });
  ok(maxSafeAtPop1 === 6, `(kontrola założenia) przy Ludność 1 maxSafe=6 -- poziom startowy 6 jest bezpieczny (got=${maxSafeAtPop1})`);
  ok(city.population === 1, '(kontrola założenia) populacja startowa = 1');

  // Krok 1: uruchom REALNY applyPostCentralPopulationGrowth z callbackiem spinającym dokładnie
  // tak jak main.ts (onCityPopulationChanged -> runApplyLiveSafeRationForCity).
  M.applyPostCentralPopulationGrowth({
    cities,
    econ,
    efResult,
    map: {},
    territoryNodes: [],
    econParams: { akweduktProgLudnosci: 5, spichlerzProgLudnosci: 8, akweduktMaxLudnosci: 12 },
    rationParams,
    onCityPopulationChanged: (cityId) => runApplyLiveSafeRationForCity(cityId),
  });

  ok(city.population === 2, `SEDNO: populacja faktycznie wzrosła z 1 do 2 w tym samym wywołaniu (got=${city.population})`);

  const maxSafeAtPop2 = M.maxSafePoziomRacjiForCity({
    cityId: 'c1', ownerId: 0, cities, econ, zapasyPrzed: 0, rationParams,
  });
  ok(maxSafeAtPop2 === 3, `(kontrola założenia) przy Ludność 2 maxSafe=3 -- ten sam poziom 6 stałby się deficytowy (got=${maxSafeAtPop2})`);

  ok(city.poziomRacji === 3,
    `SEDNO ZGŁOSZENIA: poziom Racji obniżony z 6 do bezpiecznego dla NOWEJ populacji (3) PRZED końcem tej tury -- nie dopiero po kolejnej (got=${city.poziomRacji})`);
  ok(dirtyCalls === 1, `markCityStateDirty wołane dokładnie raz w trakcie tego przeliczenia (got=${dirtyCalls})`);
} else {
  ok(false, 'Część 4 pominięta -- brak fnBody lub M.applyPostCentralPopulationGrowth (patrz FAIL wyżej)');
}

// ---------------------------------------------------------------------------
// Część 5 (RUNDA 2, NOTA A -- Evaluator P-AUTO-WYZYWIENIE-SPICHLERZ-NAWRACAJACY-DEFICYT):
// SCENARIUSZ WIELOMIASTOWY. DWA miasta gracza rosną w TEJ SAMEJ turze, w JEDNYM wywołaniu
// applyPostCentralPopulationGrowth. Bug rundy 1: `getMaxSafePoziomRacjiForPlayerCity` liczy
// previewCityEconomy CAŁEGO imperium gracza -- gdy wołana PER-MIASTO W TRAKCIE pętli wzrostu
// (stary wzorzec), miasto przetworzone jako PIERWSZE (tu: cA) widzi jeszcze STARĄ (sprzed-
// wzrostu) populację miasta przetwarzanego PO nim (tu: cB). Naprawa: callback tylko zbiera
// cityId do Setu; realne przeliczenie (pętla WYCIĘTA z main.ts, nie reimplementacja -- patrz
// forLoopStmt niżej) startuje dopiero PO zakończeniu CAŁEJ pętli wzrostu, gdy WSZYSTKIE miasta
// mają już finalną populację.
//
// Test dowodzi tego NAJBEZPOŚREDNIEJ możliwej rzeczy: jaką populację miasta cB "widzi"
// przeliczenie maxSafe dla miasta cA w chwili wywołania -- bez polegania na dalszych,
// sekwencyjnie zależnych efektach (kolejność w Secie wpływa też na to, jaki poziomRacji ma
// SĄSIEDNIE miasto w danym momencie -- to osobna, wcześniej istniejąca właściwość wspólnej
// puli imperium, nie przedmiot Noty A).
// ---------------------------------------------------------------------------
{
  const forLoopMarker = 'for (const grownCityId of grownCityIdsForLiveRation) {';
  const forLoopStmt = sliceStatementBlock(src, forLoopMarker);
  ok(forLoopStmt !== null,
    'main.ts: znaleziono zbiorczą pętlę PO applyPostCentralPopulationGrowth (Nota A, Część 5) -- cofnięcie fixu usuwa ten fragment i wywala tę sekcję');

  function makeTwoCityFixture() {
    const cA = {
      id: 'cA', ownerId: 0, population: 1, poziomRacji: 6,
      rationMigratedV114: true, wzrostUlamkowy: 0.99, turyBezDoplaty: 0,
      autoWyzywienie: true, manpower: 0,
    };
    const cB = {
      id: 'cB', ownerId: 0, population: 1, poziomRacji: 6,
      rationMigratedV114: true, wzrostUlamkowy: 0.99, turyBezDoplaty: 0,
      autoWyzywienie: true, manpower: 0,
    };
    const cities2 = [cA, cB];
    const mkTick = (cityId) => ({
      cityId, ownerId: 0, oblegany: false,
      zywnoscBrutto: 12, kosztRacji: 12, bilansLokalny: 0, zdrowie: 0,
      spichlerzCeramika: false, spichlerzSol: false, maSpichlerz: false, maSpichlerzII: false,
    });
    const econ2 = { perCity: [mkTick('cA'), mkTick('cB')], growth: 0, starved: 0 };
    const efResult2 = {
      perOwner: [{
        perCityRows: [{ cityId: 'cA' }, { cityId: 'cB' }],
        fedByCityId: new Map([['cA', true], ['cB', true]]),
      }],
    };
    return { cities2, econ2, efResult2 };
  }
  const rationParams2 = { r0: 0, r1: 6, r2: 12, r3: 20, r4: 30, r5: 42, r6: 56 };
  const growthOpts2 = {
    map: {}, territoryNodes: [],
    econParams: { akweduktProgLudnosci: 5, spichlerzProgLudnosci: 8, akweduktMaxLudnosci: 12 },
    rationParams: rationParams2,
  };

  // --- Scenariusz "PRZED Notą A" (runda 1): applyLiveSafeRationForCity wołane NATYCHMIAST w
  // callbacku, W TRAKCIE pętli wzrostu -- odtwarza dokładnie błąd zgłoszony przez Evaluatora.
  let bugSnapshotCbPopWhenAProcessed = null;
  {
    const { cities2, econ2, efResult2 } = makeTwoCityFixture();
    const snapshots = [];
    M.applyPostCentralPopulationGrowth({
      cities: cities2, econ: econ2, efResult: efResult2, ...growthOpts2,
      onCityPopulationChanged: (cityId) => {
        // Podglądamy populację WSZYSTKICH miast w chwili wywołania -- dokładnie to, co
        // getMaxSafePoziomRacjiForPlayerCity/previewCityEconomy realnie widzą.
        snapshots.push({
          forCity: cityId,
          cBPopulation: cities2.find(c => c.id === 'cB').population,
        });
      },
    });
    ok(snapshots.length === 2,
      `(wzorzec SPRZED Noty A) 2 wywołania onCityPopulationChanged podczas pętli wzrostu (got=${snapshots.length})`);
    const cAsnap = snapshots.find(s => s.forCity === 'cA');
    ok(!!cAsnap, '(wzorzec SPRZED Noty A) wywołanie zaszło dla cA');
    bugSnapshotCbPopWhenAProcessed = cAsnap ? cAsnap.cBPopulation : null;
    ok(bugSnapshotCbPopWhenAProcessed === 1,
      `BUG (wzorzec SPRZED Noty A): przy przeliczaniu cA (przetworzone PIERWSZE w pętli), cB ma jeszcze STARĄ populację 1 zamiast finalnej 2 (got=${bugSnapshotCbPopWhenAProcessed})`);
  }

  // --- Scenariusz "PO Nocie A" (ten test celowo wykonuje PRAWDZIWY fragment main.ts wycięty
  // powyżej -- forLoopStmt -- nie reimplementację): callback TYLKO zbiera cityId do Setu;
  // zbiorcza pętla startuje PO zakończeniu applyPostCentralPopulationGrowth.
  let fixedSnapshotCbPopWhenAProcessed = null;
  {
    const { cities2, econ2, efResult2 } = makeTwoCityFixture();
    const snapshots = [];
    const grownCityIdsForLiveRation = new Set();
    M.applyPostCentralPopulationGrowth({
      cities: cities2, econ: econ2, efResult: efResult2, ...growthOpts2,
      onCityPopulationChanged: cityId => grownCityIdsForLiveRation.add(cityId),
    });
    if (forLoopStmt) {
      const spyApplyLiveSafeRationForCity = (cityId) => {
        snapshots.push({
          forCity: cityId,
          cBPopulation: cities2.find(c => c.id === 'cB').population,
        });
      };
      const runLoop = new Function(
        'grownCityIdsForLiveRation', 'applyLiveSafeRationForCity', forLoopStmt,
      );
      runLoop(grownCityIdsForLiveRation, spyApplyLiveSafeRationForCity);
    }
    ok(snapshots.length === 2,
      `(NOTA A, naprawione) 2 wywołania w zbiorczej pętli PO applyPostCentralPopulationGrowth (got=${snapshots.length})`);
    const cAsnap = snapshots.find(s => s.forCity === 'cA');
    ok(!!cAsnap, '(NOTA A, naprawione) wywołanie zaszło dla cA');
    fixedSnapshotCbPopWhenAProcessed = cAsnap ? cAsnap.cBPopulation : null;
    ok(fixedSnapshotCbPopWhenAProcessed === 2,
      `NAPRAWIONE (Nota A): przy przeliczaniu cA (nadal PIERWSZE w Secie, ale PO całej pętli wzrostu), cB ma już FINALNĄ populację 2, nie STARĄ 1 (got=${fixedSnapshotCbPopWhenAProcessed})`);
  }

  // SEDNO ZGŁOSZENIA (kontrast buggy vs naprawione): to WYŁĄCZNIE zmiana MOMENTU wywołania
  // (Nota A) zmienia, jaką populację cB "widzi" przeliczenie dla cA -- ten sam fixture, ten
  // sam callback wewnętrznie, jedyna różnica to czy applyLiveSafeRationForCity woła się W
  // TRAKCIE czy PO pętli wzrostu.
  ok(bugSnapshotCbPopWhenAProcessed !== null && fixedSnapshotCbPopWhenAProcessed !== null
    && bugSnapshotCbPopWhenAProcessed !== fixedSnapshotCbPopWhenAProcessed,
    `SEDNO: naprawa Noty A faktycznie ZMIENIA obserwowaną populację cB w momencie przeliczania cA (przed=${bugSnapshotCbPopWhenAProcessed}, po=${fixedSnapshotCbPopWhenAProcessed}) -- dowód, że test wykrywa TĘ konkretną poprawkę`);

  // Dodatkowo, PO naprawionym (zbiorczym) przebiegu, RZECZYWISTE applyLiveSafeRationForCity
  // (ciało wycięte z main.ts w Części 4, `fnBody`) uruchomione dla OBU miast musi zejść z
  // domyślnego poziomu 6 -- przy wspólnej puli imperium przynajmniej JEDNO z dwóch miast musi
  // pokryć deficyt wynikający z podwojonej populacji obu miast (12 produkcji vs 24 kosztu przy
  // niezmienionym poziomie 6 dla KAŻDEGO z nich x2 miasta = korekta nieunikniona).
  if (fnBody) {
    const { cities2, econ2, efResult2 } = makeTwoCityFixture();
    const grownCityIdsForLiveRation = new Set();
    M.applyPostCentralPopulationGrowth({
      cities: cities2, econ: econ2, efResult: efResult2, ...growthOpts2,
      onCityPopulationChanged: cityId => grownCityIdsForLiveRation.add(cityId),
    });
    ok(cities2.every(c => c.population === 2),
      `(kontrola założenia Część 5) OBA miasta faktycznie urosły do Ludność 2 w tym samym wywołaniu (got=${cities2.map(c => c.population).join(',')})`);
    if (forLoopStmt) {
      const realApplyLiveSafeRationForCity = (cityId) => {
        const ctx = {
          cities: cities2,
          isCityAutoWyzywienieEnabled: M.isCityAutoWyzywienieEnabled,
          ensureCityRationDefaults: M.ensureCityRationDefaults,
          getCityRationLevel: M.getCityRationLevel,
          markCityStateDirty: () => {},
          getMaxSafePoziomRacjiForPlayerCity: (cid) => M.maxSafePoziomRacjiForCity({
            cityId: cid, ownerId: 0, cities: cities2, econ: econ2, zapasyPrzed: 0,
            rationParams: rationParams2,
          }),
        };
        const fn = new Function(
          'cities', 'isCityAutoWyzywienieEnabled', 'ensureCityRationDefaults',
          'getCityRationLevel', 'markCityStateDirty', 'getMaxSafePoziomRacjiForPlayerCity', 'cityId',
          fnBody,
        );
        fn(
          ctx.cities, ctx.isCityAutoWyzywienieEnabled, ctx.ensureCityRationDefaults,
          ctx.getCityRationLevel, ctx.markCityStateDirty, ctx.getMaxSafePoziomRacjiForPlayerCity, cityId,
        );
      };
      const runLoop = new Function(
        'grownCityIdsForLiveRation', 'applyLiveSafeRationForCity', forLoopStmt,
      );
      runLoop(grownCityIdsForLiveRation, realApplyLiveSafeRationForCity);
      const cAFinal = cities2.find(c => c.id === 'cA').poziomRacji;
      const cBFinal = cities2.find(c => c.id === 'cB').poziomRacji;
      ok(cAFinal < 6 || cBFinal < 6,
        `NAPRAWIONE: PO zbiorczym przeliczeniu OBU miast, przynajmniej jedno ma poziom Racji obniżony poniżej startowego 6 (żeby pokryć realny wspólny deficyt Ludność 2 dla obu miast) (cA=${cAFinal}, cB=${cBFinal})`);
    } else {
      ok(false, 'Część 5 (kontrola realnej pętli) pominięta -- brak forLoopStmt (patrz FAIL wyżej)');
    }
  } else {
    ok(false, 'Część 5 (kontrola realnej pętli) pominięta -- brak fnBody (patrz FAIL w Części 4)');
  }
}

// Sprzątanie plików tymczasowych esbuild.
try { fs.unlinkSync(ENTRY); } catch {}
try { fs.unlinkSync(BUNDLE); } catch {}

console.log(`\n${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
