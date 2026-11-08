'use strict';
/**
 * auto-wyzywienie-live-recalc-test.cjs — P-AUTO-WYZYWIENIE-BUG1 (ECHO A Macieja)
 *
 * Kontekst: cała logika auto-dostosowania poziomu racji (autoBalanceRationsToSolvency /
 * autoRaiseRationsForGrowth / clamp maxSafePoziomRacjiForCity, main.ts ~triggerPlayerEndTurn)
 * uruchamiała się WYŁĄCZNIE na "Koniec tury". Jeśli produkcja żywności miasta spadła W TRAKCIE
 * tury (przesunięcie robotnika, ukończenie/rush-buy budynku), poziom racji zostawał przy
 * wartości bezpiecznej dla STAREJ, wyższej produkcji aż do następnego końca tury -- realny
 * deficyt widoczny graczowi wcześniej niż mechanizm zdąży zareagować.
 *
 * Naprawa: nowa funkcja `applyLiveSafeRationForCity(cityId)` w main.ts (przelicza maxSafe
 * przez `getMaxSafePoziomRacjiForPlayerCity` -- ISTNIEJĄCA funkcja, TA SAMA, której suwak
 * Wyżywienia już używał -- i obniża `city.poziomRacji`, jeśli przekracza maxSafe) wywoływana
 * z KAŻDEGO dyskretnego zdarzenia zmiany stanu wpływającego na produkcję żywności miasta
 * gracza: klik na polu okolicy, zmiana priorytetu/trybu Okolicy, ukończenie budynku (rush-buy).
 * Wywołanie na koniec tury (triggerPlayerEndTurn, Q3=A clamp) zostaje jako backstop.
 *
 * ⚠️ ŚWIADOMIE NIE dotyka ścieżki renderu/hover/mousemove (cityGrowthLive w cityPanel.ts) --
 * to dokładnie ta gorąca ścieżka, z której Evaluator kazał usunąć `getMaxSafePoziomRacjiForPlayerCity`
 * w e4155972 (pełny previewCityEconomy + pętla 13 poziomów, bez memoizacji, wynik prawie zawsze
 * wyrzucany). Ten test weryfikuje, że nowe wywołania trafiły WYŁĄCZNIE do dyskretnych handlerów
 * zdarzeń, nie do ścieżki podglądu.
 *
 * Ten test wykonuje NAPRAWDĘ ciało funkcji applyLiveSafeRationForCity wycięte z bieżącego
 * źródła main.ts (nie reimplementację-kopię), związane z mockami zależności — więc odtwarza
 * dokładnie tę logikę, którą zobaczy gracz w grze. Do wyliczenia maxSafe używa PRAWDZIWEJ
 * `maxSafePoziomRacjiForCity` z gra/src/game/empire-food.ts (zbudowanej przez esbuild),
 * NIE reimplementacji.
 *
 * node tools/auto-wyzywienie-live-recalc-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const MAIN_TS = path.join(GRA_ROOT, 'src', 'main.ts');
const src = fs.readFileSync(MAIN_TS, 'utf8');

let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; } else { fail++; console.error('FAIL:', label); }
}

// ---------------------------------------------------------------------------
// Część 1: wiring — funkcja jest wywoływana z WSZYSTKICH dyskretnych zdarzeń zmiany
// stanu wpływających na produkcję żywności miasta gracza, i TYLKO z nich (nie z hot path).
// ---------------------------------------------------------------------------
const callSitesExpected = [
  { label: 'applyOkolicaTileAdjust (klik 👤 na polu okolicy)', marker: 'function applyOkolicaTileAdjust' },
  { label: 'onOkolicaFocusChange (priorytet Okolicy, override ORAZ broadcast imperium)', marker: 'onOkolicaFocusChange:' },
  { label: 'onOkolicaFocusOverrideToggle (odpięcie/przypięcie priorytetu)', marker: 'onOkolicaFocusOverrideToggle:' },
  { label: 'onOkolicaEnterManual (auto -> ręczny)', marker: 'onOkolicaEnterManual:' },
  { label: 'onOkolicaRestoreAuto (ręczny -> auto)', marker: 'onOkolicaRestoreAuto:' },
];

function sliceHandlerBody(marker) {
  const idx = src.indexOf(marker);
  if (idx < 0) return null;
  const braceOpen = src.indexOf('{', idx);
  let depth = 0, bodyStart = -1, bodyEnd = -1;
  for (let i = braceOpen; i < src.length; i++) {
    const ch = src[i];
    if (ch === '{') { depth++; if (depth === 1) bodyStart = i + 1; }
    else if (ch === '}') { depth--; if (depth === 0) { bodyEnd = i; break; } }
  }
  return bodyStart >= 0 && bodyEnd > bodyStart ? src.slice(bodyStart, bodyEnd) : null;
}

for (const site of callSitesExpected) {
  const body = sliceHandlerBody(site.marker);
  ok(body !== null, `znaleziono handler: ${site.label}`);
  ok(!!body && body.includes('applyLiveSafeRationForCity('), `${site.label} wywołuje applyLiveSafeRationForCity(...)`);
}

// onRushBuy (dwa wystąpienia w main.ts — configureCityPanel wołane dwa razy, patrz kod).
const rushBuyCount = (src.match(/onRushBuy:/g) || []).length;
ok(rushBuyCount >= 2, `onRushBuy: zdefiniowany co najmniej 2× (znaleziono ${rushBuyCount})`);
{
  let searchFrom = 0, foundWithCall = 0;
  for (let i = 0; i < rushBuyCount; i++) {
    const idx = src.indexOf('onRushBuy:', searchFrom);
    if (idx < 0) break;
    const braceOpen = src.indexOf('{', src.indexOf('=>', idx));
    let depth = 0, bodyStart = -1, bodyEnd = -1;
    for (let j = braceOpen; j < src.length; j++) {
      const ch = src[j];
      if (ch === '{') { depth++; if (depth === 1) bodyStart = j + 1; }
      else if (ch === '}') { depth--; if (depth === 0) { bodyEnd = j; break; } }
    }
    const body = bodyStart >= 0 ? src.slice(bodyStart, bodyEnd) : '';
    if (body.includes('applyLiveSafeRationForCity(')) foundWithCall++;
    searchFrom = idx + 1;
  }
  ok(foundWithCall === rushBuyCount, `wszystkie ${rushBuyCount} definicje onRushBuy wołają applyLiveSafeRationForCity (znaleziono ${foundWithCall})`);
}

// Backstop końca tury MUSI zostać (Q3=A clamp w triggerPlayerEndTurn) -- naprawa Zadania 1
// jest DODATKIEM, nie zamiennikiem.
ok(src.includes('maxSafePoziomRacjiForCity({') && src.includes('Q3=A'),
  'backstop końca tury (Q3=A clamp, triggerPlayerEndTurn) nadal obecny w main.ts');

// ---------------------------------------------------------------------------
// Część 1b: onCityAutoWyzywienieChange (blokada #3 z rundy 1, naprawiona w rundzie 2, C-026) --
// wywołuje applyLiveSafeRationForCity WYŁĄCZNIE w gałęzi WŁĄCZANIA (enabled===true). Przy
// WYŁĄCZANIU flaga tylko spada -- żadne przeliczenie nie powinno się odbyć (poziom racji
// zostaje przy tym, co gracz miał ustawione ręcznie, wyświetlanie i tak przycina do maxSafe).
// ---------------------------------------------------------------------------
{
  const body = sliceHandlerBody('onCityAutoWyzywienieChange:');
  ok(body !== null, 'znaleziono handler: onCityAutoWyzywienieChange');
  // (a) handler zawiera wywołanie applyLiveSafeRationForCity.
  ok(!!body && body.includes('applyLiveSafeRationForCity('),
    'onCityAutoWyzywienieChange wywołuje applyLiveSafeRationForCity(...)');

  // (b) to wywołanie występuje WYŁĄCZNIE wewnątrz bloku "if (enabled) { ... }" -- policz
  // wystąpienia w CAŁYM ciele handlera i porównaj z wystąpieniami TYLKO w tym bloku; muszą
  // się zgadzać i musi być dokładnie jedno.
  let callsInIfEnabled = -1;
  let callsTotal = -1;
  if (body) {
    callsTotal = (body.match(/applyLiveSafeRationForCity\(/g) || []).length;
    const ifIdx = body.indexOf('if (enabled)');
    if (ifIdx >= 0) {
      const braceOpen = body.indexOf('{', ifIdx);
      let depth = 0, blockStart = -1, blockEnd = -1;
      for (let i = braceOpen; i < body.length; i++) {
        const ch = body[i];
        if (ch === '{') { depth++; if (depth === 1) blockStart = i + 1; }
        else if (ch === '}') { depth--; if (depth === 0) { blockEnd = i; break; } }
      }
      const ifBlock = blockStart >= 0 && blockEnd > blockStart ? body.slice(blockStart, blockEnd) : '';
      callsInIfEnabled = (ifBlock.match(/applyLiveSafeRationForCity\(/g) || []).length;
    }
  }
  ok(callsTotal === 1 && callsInIfEnabled === 1,
    `onCityAutoWyzywienieChange wywołuje applyLiveSafeRationForCity(...) dokładnie raz, WYŁĄCZNIE wewnątrz "if (enabled)" (w if(enabled)=${callsInIfEnabled}, łącznie w handlerze=${callsTotal})`);
}

// ---------------------------------------------------------------------------
// Część 2: applyLiveSafeRationForCity NIE trafiła na gorącą ścieżkę renderu/hover
// (cityGrowthLive żyje w cityPanel.ts, nie main.ts -- ale main.ts i tak nie powinien
// mieć wywołania w żadnym handlerze mousemove/hover).
// ---------------------------------------------------------------------------
{
  const mousemoveIdx = src.indexOf("addEventListener('mousemove'");
  if (mousemoveIdx >= 0) {
    // Sprawdź 3000 znaków od najbliższego mousemove listenera -- nie powinno tam
    // być wywołania applyLiveSafeRationForCity (kosztowna ścieżka: previewCityEconomy
    // pełne + pętla 13 poziomów, bez memoizacji -- dokładnie regresja z e4155972).
    const windowSrc = src.slice(mousemoveIdx, mousemoveIdx + 3000);
    ok(!windowSrc.includes('applyLiveSafeRationForCity('),
      'applyLiveSafeRationForCity NIE jest wołana w pobliżu addEventListener(mousemove) w main.ts');
  } else {
    ok(true, '(brak mousemove listenera w main.ts do sprawdzenia -- pomijam, nie fail)');
  }
}

// ---------------------------------------------------------------------------
// Część 3: wytnij CIAŁO applyLiveSafeRationForCity(cityId) i wykonaj je NAPRAWDĘ
// (nie reimplementację) z mockami zależności + PRAWDZIWĄ maxSafePoziomRacjiForCity.
// ---------------------------------------------------------------------------
const sigMarker = 'function applyLiveSafeRationForCity(cityId: string): void {';
const sigIdx = src.indexOf(sigMarker);
ok(sigIdx >= 0, 'znaleziono sygnaturę applyLiveSafeRationForCity(cityId: string): void w main.ts');

let fnBody = '';
if (sigIdx >= 0) {
  const braceOpen = sigIdx + sigMarker.length - 1;
  let depth = 0, bodyStart = -1, bodyEnd = -1;
  for (let i = braceOpen; i < src.length; i++) {
    const ch = src[i];
    if (ch === '{') { depth++; if (depth === 1) bodyStart = i + 1; }
    else if (ch === '}') { depth--; if (depth === 0) { bodyEnd = i; break; } }
  }
  ok(bodyStart >= 0 && bodyEnd > bodyStart, 'wycięto ciało applyLiveSafeRationForCity(...) licząc głębokość klamer');
  fnBody = bodyStart >= 0 && bodyEnd > bodyStart ? src.slice(bodyStart, bodyEnd) : '';
}

// Zbuduj PRAWDZIWĄ maxSafePoziomRacjiForCity + isCityAutoWyzywienieEnabled + pomocnicze
// z gra/src/game -- nie kopie.
const ENTRY = path.resolve(__dirname, '.auto-wyzywienie-live-recalc-entry.ts');
const BUNDLE = path.resolve(__dirname, '.auto-wyzywienie-live-recalc-bundle.cjs');
fs.writeFileSync(ENTRY, `
export {
  maxSafePoziomRacjiForCity, isCityAutoWyzywienieEnabled,
} from '../src/game/empire-food';
export {
  ensureCityRationDefaults, getCityRationLevel, clampPoziomRacji, rationGrowthPercent,
} from '../src/game/population-growth-v85';
export {
  recomputeCityFoodBalancesInEcon, militaryFoodConsumptionWithSpichlerz,
  spichlerzSolArmyBonusActive,
} from '../src/game/turn-economy';
export { buildEmpireFoodParams, freshEmpireFoodState } from '../src/game/empire-food';
export { WYZYWIENIE_MAX, WYZYWIENIE_MIN } from '../src/game/population-growth-v85';
// R-AUTO-WYZYWIENIE-KRYTERIUM-Q1=A: getMaxSafePoziomRacjiForPlayerCity (Część 9 niżej) liczy
// teraz koszt żywności armii inline w swoim ciele -- potrzebuje loadUpkeepParams (prawdziwa
// funkcja z economy-upkeep.ts, nie mock).
export { loadUpkeepParams } from '../src/game/economy-upkeep';
`, 'utf8');
esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, absWorkingDir: GRA_ROOT, logLevel: 'silent',
});
const M = require(BUNDLE);

function runScenario({ cityOverrides, econRow, rationParams }) {
  const city = {
    id: 'c1', ownerId: 0, population: 6, poziomRacji: undefined,
    rationMigratedV114: true, wzrostUlamkowy: 0, turyBezDoplaty: 0,
    autoWyzywienie: true,
    ...cityOverrides,
  };
  const cities = [city];
  const econ = { perCity: [{ cityId: 'c1', ownerId: 0, oblegany: false, ...econRow }] };

  let dirtyCalls = 0;
  const ctx = {
    cities,
    isCityAutoWyzywienieEnabled: M.isCityAutoWyzywienieEnabled,
    ensureCityRationDefaults: M.ensureCityRationDefaults,
    getCityRationLevel: M.getCityRationLevel,
    markCityStateDirty: () => { dirtyCalls++; },
    getMaxSafePoziomRacjiForPlayerCity: (cityId) => M.maxSafePoziomRacjiForCity({
      cityId, ownerId: 0, cities, econ, zapasyPrzed: 0,
      rationParams: rationParams ?? { r0: 0, r1: 6, r2: 12, r3: 20, r4: 30, r5: 42, r6: 56 },
    }),
  };
  const fn = new Function(
    'cities', 'isCityAutoWyzywienieEnabled', 'ensureCityRationDefaults',
    'getCityRationLevel', 'markCityStateDirty', 'getMaxSafePoziomRacjiForPlayerCity', 'cityId',
    fnBody,
  );
  fn(
    ctx.cities, ctx.isCityAutoWyzywienieEnabled, ctx.ensureCityRationDefaults,
    ctx.getCityRationLevel, ctx.markCityStateDirty, ctx.getMaxSafePoziomRacjiForPlayerCity, city.id,
  );
  return { city, dirtyCalls };
}

// Scenariusz A (SEDNO ZGŁOSZENIA): Auto Wyżywienie WŁ, poziom racji ustawiony bezpiecznie
// dla WYSOKIEJ produkcji (6 -> bezpieczny przy zywnoscBrutto=60), NASTĘPNIE symulacja spadku
// produkcji W TRAKCIE tury (zdjęcie robotnika -> zywnoscBrutto spada do 20) -- PRZED końcem
// tury. Bez naprawy Zadania 1 poziom zostałby przy 6 (deficyt widoczny graczowi) aż do
// końca tury. Z naprawą: przelicza się NATYCHMIAST w tym samym wywołaniu.
if (fnBody) {
  const rParams = { r0: 0, r1: 6, r2: 12, r3: 20, r4: 30, r5: 42, r6: 56 }; // koszt/mieszkańca rosnący z poziomem
  const scenA = runScenario({
    cityOverrides: { poziomRacji: 6 }, // bezpieczne przy WYSOKIEJ produkcji
    econRow: { zywnoscBrutto: 20, kosztRacji: 0, bilansLokalny: 0 }, // PO zdjęciu robotnika -- produkcja już spadła
    rationParams: rParams,
  });
  // Wartość dokładna (nie tylko kierunek/tautologia <=6, która nie mogła paść -- funkcja tylko
  // obniża, a start jest z 6): przy tych parametrach silnik (maxSafePoziomRacjiForCity) obniża
  // poziom z 6 do 1,5, i to w JEDNYM wywołaniu applyLiveSafeRationForCity (jedno markCityStateDirty).
  ok(scenA.city.poziomRacji === 1.5, `Scenariusz A: po spadku produkcji w trakcie tury poziom racji przeliczony z 6 na dokładnie 1,5 (got=${scenA.city.poziomRacji})`);
  ok(scenA.dirtyCalls === 1, `Scenariusz A: markCityStateDirty wołane dokładnie raz (got=${scenA.dirtyCalls})`);
}

// Scenariusz B: Auto Wyżywienie WYŁ -- funkcja NIE rusza poziomu racji (gracz steruje ręcznie,
// wyświetlanie i tak przycina Bilans/WZROST% do maxSafe -- P-WZROSTPROCENT-SUROWY-POZIOM).
if (fnBody) {
  const scenB = runScenario({
    cityOverrides: { poziomRacji: 6, autoWyzywienie: false },
    econRow: { zywnoscBrutto: 0, kosztRacji: 0, bilansLokalny: 0 }, // produkcja=0 -> maxSafe bardzo niski
  });
  ok(scenB.city.poziomRacji === 6, 'Scenariusz B: Auto Wyżywienie WYŁ -- poziomRacji NIE zmieniony mimo drastycznego spadku produkcji');
  ok(scenB.dirtyCalls === 0, 'Scenariusz B: markCityStateDirty NIE wołane, gdy Auto Wyżywienie WYŁ');
}

// Scenariusz C: miasto AI (ownerId !== 0) -- funkcja jest hookowana WYŁĄCZNIE z handlerów UI
// gracza, więc dla miast AI musi być no-op (parytet AI liczy się inaczej, w triggerPlayerEndTurn).
if (fnBody) {
  const scenC = runScenario({
    cityOverrides: { poziomRacji: 6, ownerId: 1, autoWyzywienie: true },
    econRow: { ownerId: 1, zywnoscBrutto: 0, kosztRacji: 0, bilansLokalny: 0 },
  });
  ok(scenC.city.poziomRacji === 6, 'Scenariusz C: miasto AI (ownerId!==0) -- poziomRacji nietknięty (funkcja hookowana tylko z UI gracza)');
  ok(scenC.dirtyCalls === 0, 'Scenariusz C: markCityStateDirty NIE wołane dla miasta AI');
}

// Scenariusz D: poziom racji JUŻ bezpieczny (<= maxSafe) -- brak zbędnej mutacji/dirty flag.
if (fnBody) {
  const scenD = runScenario({
    cityOverrides: { poziomRacji: 1 }, // niski poziom, prawie na pewno bezpieczny
    econRow: { zywnoscBrutto: 100, kosztRacji: 0, bilansLokalny: 0 }, // wysoka produkcja
  });
  ok(scenD.city.poziomRacji === 1, 'Scenariusz D: poziom już bezpieczny -- niezmieniony');
  ok(scenD.dirtyCalls === 0, 'Scenariusz D: markCityStateDirty NIE wołane, gdy nic się nie zmieniło (brak zbędnej pracy)');
}

// ---------------------------------------------------------------------------
// Część 4 (runda 4, Evaluator FAIL #3, blokada 1): cache `_maxSafeRationCache` w main.ts --
// (1) zapis WEWNĄTRZ getMaxSafePoziomRacjiForPlayerCity, PRZED jego `return maxSafe`;
// (2) czyszczenie WEWNĄTRZ markCityStateDirty.
//
// UWAGA (N1, ta sama runda): getMaxSafePoziomRacjiForPlayerCity zapisuje cache w PĘTLI po
// WSZYSTKICH miastach gracza (`_maxSafeRationCache.set(pc.id, ...)`), nie tylko dla `cityId` --
// patrz notatka N1 w raporcie. Asercja niżej dopuszcza obie formy zapisu (`set(cityId,` ALBO
// `set(` w ogóle) i sprawdza kontrakt, który się liczy: zapis następuje PRZED `return maxSafe`
// (cache jest świeży, zanim funkcja odda wynik wołającemu).
// ---------------------------------------------------------------------------
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

{
  const gmsSig = 'function getMaxSafePoziomRacjiForPlayerCity(cityId: string): PoziomRacji {';
  const body = sliceFunctionBody(src, gmsSig);
  ok(body !== null, 'znaleziono ciało getMaxSafePoziomRacjiForPlayerCity w main.ts');
  const setIdx = body ? body.indexOf('_maxSafeRationCache.set(') : -1;
  const returnIdx = body ? body.indexOf('return maxSafe;') : -1;
  ok(setIdx >= 0, 'getMaxSafePoziomRacjiForPlayerCity zapisuje do _maxSafeRationCache.set(...)');
  ok(returnIdx >= 0, 'getMaxSafePoziomRacjiForPlayerCity zawiera `return maxSafe;`');
  ok(setIdx >= 0 && returnIdx >= 0 && setIdx < returnIdx,
    '_maxSafeRationCache.set(...) występuje PRZED `return maxSafe;` (cache zapisany zanim funkcja odda wynik)');
  // Kontrakt musi obejmować KONKRETNIE żądane `cityId`, niezależnie od tego czy zapis jest
  // pojedynczy (`set(cityId,`) czy w pętli po wszystkich miastach gracza (N1, `set(pc.id,`
  // + `if (pc.id === cityId) maxSafe = ...`).
  const coversRequestedCityId = !!body
    && (body.includes('_maxSafeRationCache.set(cityId,')
      || (body.includes('_maxSafeRationCache.set(') && /if\s*\(\s*\w+\.id\s*===\s*cityId\s*\)/.test(body)));
  ok(coversRequestedCityId,
    'zapis do cache obejmuje żądane `cityId` (albo bezpośrednio, albo przez pętlę po miastach gracza z dopasowaniem do cityId)');
}

{
  const mcsdSig = 'function markCityStateDirty(): void {';
  const body = sliceFunctionBody(src, mcsdSig);
  ok(body !== null, 'znaleziono ciało markCityStateDirty w main.ts');
  ok(!!body && body.includes('_maxSafeRationCache.clear();'),
    'markCityStateDirty czyści _maxSafeRationCache.clear()');
}

// ---------------------------------------------------------------------------
// Część 5 (runda 4, blokada 1, punkt 3): cityGrowthLive w cityPanel.ts czyta
// cfg.getCachedMaxSafePoziomRacji i przy trafieniu (cache hit) NIE woła
// getMaxSafePoziomRacji/getMaxSafePoziomRacjiForPlayerCity -- to dokładnie regresja
// wydajnościowa, której pilnował e4155972 (pełny previewCityEconomy na hot path mousemove).
// ---------------------------------------------------------------------------
const CITY_PANEL_TS = path.join(GRA_ROOT, 'src', 'ui', 'cityPanel.ts');
const cityPanelSrc = fs.readFileSync(CITY_PANEL_TS, 'utf8');
{
  const cglSig = 'export function cityGrowthLive(city: City, map: GameMap): CityGrowthLive | null {';
  const body = sliceFunctionBody(cityPanelSrc, cglSig);
  ok(body !== null, 'znaleziono ciało cityGrowthLive w cityPanel.ts');
  ok(!!body && body.includes('cfg.getCachedMaxSafePoziomRacji'),
    'cityGrowthLive czyta cfg.getCachedMaxSafePoziomRacji (tani cache)');
  // Asercja NEGATYWNA: żadna gałąź cityGrowthLive (w tym cache-hit) nie może wołać
  // funkcji liczącej maxSafe od nowa -- ani przez cfg.getMaxSafePoziomRacji, ani przez
  // nazwę silnikową getMaxSafePoziomRacjiForPlayerCity.
  ok(!!body && !body.includes('cfg.getMaxSafePoziomRacji') && !body.includes('getMaxSafePoziomRacjiForPlayerCity'),
    'cityGrowthLive NIE woła cfg.getMaxSafePoziomRacji ani getMaxSafePoziomRacjiForPlayerCity (regresja perf pilnowana od e4155972)');
}

// ---------------------------------------------------------------------------
// Część 6 (runda 4, blokada 1, punkt 4): wytnij CIAŁO clampedGrowthBreakdown z cityPanel.ts
// i wykonaj je NAPRAWDĘ z PRAWDZIWĄ rationGrowthPercent (WYZYWIENIE_GROWTH_PCT) z
// population-growth-v85.ts (przez ten sam esbuild-bundle M co Część 3 -- rationGrowthPercent
// dołożona do exportów ENTRY powyżej).
// ---------------------------------------------------------------------------
const cgbSig = 'function clampedGrowthBreakdown(view: CityView, maxSafe?: number): GrowthPercentBreakdown {';
const cgbBody = sliceFunctionBody(cityPanelSrc, cgbSig);
ok(cgbBody !== null, 'znaleziono ciało clampedGrowthBreakdown w cityPanel.ts');

function runClampedGrowthBreakdown(view, maxSafe) {
  const fn = new Function('view', 'maxSafe', 'rationGrowthPercent', cgbBody);
  return fn(view, maxSafe, M.rationGrowthPercent);
}

const bdRaw = {
  total: 12, racje: 7, maleMiasto: 1, spichlerz: 0, zdrowie: 2, szczescie: 1, cywilizacja: 1,
};
if (cgbBody) {
  // Wariant 1: maxSafe === undefined -> wynik identyczny surowemu bd.total (i całemu obiektowi --
  // funkcja zwraca `view.growthBreakdown` bez zmian, wczesny return przed jakimkolwiek przeliczeniem).
  const view1 = { growthBreakdown: bdRaw, poziomRacji: 6 };
  const r1 = runClampedGrowthBreakdown(view1, undefined);
  ok(r1 === bdRaw, 'Wariant maxSafe===undefined: zwraca DOKŁADNIE ten sam obiekt bd (bez przeliczenia), total=' + r1.total);

  // Wariant 2: maxSafe >= poziomRacji (racje nie są przycinane) -> wynik identyczny surowemu bd.
  const view2 = { growthBreakdown: bdRaw, poziomRacji: 4 };
  const r2 = runClampedGrowthBreakdown(view2, 4); // maxSafe === poziomRacji
  ok(r2 === bdRaw, 'Wariant maxSafe>=poziomRacji: zwraca DOKŁADNIE ten sam obiekt bd (bez przeliczenia), total=' + r2.total);
  const r2b = runClampedGrowthBreakdown(view2, 6); // maxSafe > poziomRacji
  ok(r2b === bdRaw, 'Wariant maxSafe>poziomRacji: zwraca DOKŁADNIE ten sam obiekt bd (bez przeliczenia), total=' + r2b.total);

  // Wariant 3: maxSafe < poziomRacji -> total różni się DOKŁADNIE o
  // rationGrowthPercent(maxSafe) - rationGrowthPercent(poziomRacji); pozostałe 5 składników bez zmian.
  const poziomRacji3 = 6;
  const maxSafe3 = 1.5;
  const view3 = { growthBreakdown: bdRaw, poziomRacji: poziomRacji3 };
  const r3 = runClampedGrowthBreakdown(view3, maxSafe3);
  const expectedDelta = M.rationGrowthPercent(maxSafe3) - M.rationGrowthPercent(poziomRacji3);
  const actualDelta = r3.total - bdRaw.total;
  ok(expectedDelta !== 0, `(kontrola założenia testu) rationGrowthPercent(${maxSafe3})=${M.rationGrowthPercent(maxSafe3)} != rationGrowthPercent(${poziomRacji3})=${M.rationGrowthPercent(poziomRacji3)}`);
  ok(actualDelta === expectedDelta,
    `Wariant maxSafe<poziomRacji: total różni się DOKŁADNIE o rationGrowthPercent(maxSafe)-rationGrowthPercent(poziomRacji) (oczekiwano=${expectedDelta}, got=${actualDelta})`);
  ok(r3.maleMiasto === bdRaw.maleMiasto && r3.spichlerz === bdRaw.spichlerz
    && r3.zdrowie === bdRaw.zdrowie && r3.szczescie === bdRaw.szczescie && r3.cywilizacja === bdRaw.cywilizacja,
    'Wariant maxSafe<poziomRacji: pozostałe 5 składników (maleMiasto/spichlerz/zdrowie/szczescie/cywilizacja) bez zmian');
  ok(r3.racje === M.rationGrowthPercent(maxSafe3),
    `Wariant maxSafe<poziomRacji: składnik racje przeliczony na rationGrowthPercent(maxSafe) (oczekiwano=${M.rationGrowthPercent(maxSafe3)}, got=${r3.racje})`);
}

// ---------------------------------------------------------------------------
// Część 7 (runda 4, blokada 2): dwie ścieżki mid-turn, które zmieniają zapasyPanstwa BEZ
// markCityStateDirty, muszą mieć WŁASNE _maxSafeRationCache.clear() -- inaczej cache zostaje
// z nieaktualnym (nie pustym) wpisem po starcie budowy cudu / transferze żywności w dealu.
// ---------------------------------------------------------------------------
{
  const body = sliceFunctionBody(src, 'function tryDeductWonderStartFood(ownerId: number, kosztBudowy: number): boolean {');
  ok(body !== null, 'znaleziono ciało tryDeductWonderStartFood w main.ts');
  ok(!!body && body.includes('_maxSafeRationCache.clear();'),
    'tryDeductWonderStartFood czyści _maxSafeRationCache (koszt startu cudu zmienia zapasyPanstwa mid-turn)');
}
{
  const caseIdx = src.indexOf("case 'zywnosc': {");
  ok(caseIdx >= 0, "znaleziono gałąź case 'zywnosc' w transferBasketItems (main.ts)");
  let body = null;
  if (caseIdx >= 0) {
    const braceOpen = src.indexOf('{', caseIdx + "case 'zywnosc': ".length);
    let depth = 0, bodyStart = -1, bodyEnd = -1;
    for (let i = braceOpen; i < src.length; i++) {
      const ch = src[i];
      if (ch === '{') { depth++; if (depth === 1) bodyStart = i + 1; }
      else if (ch === '}') { depth--; if (depth === 0) { bodyEnd = i; break; } }
    }
    body = bodyStart >= 0 && bodyEnd > bodyStart ? src.slice(bodyStart, bodyEnd) : null;
  }
  ok(!!body && body.includes('_maxSafeRationCache.clear();'),
    "gałąź case 'zywnosc' (transferBasketItems) czyści _maxSafeRationCache (transfer żywności zmienia zapasyPanstwa mid-turn)");
}

// ---------------------------------------------------------------------------
// Część 8 (runda 5, blokada 1): wywołanie `advanceEmpireFood` (tick końca tury) w main.ts
// MUSI mieć w pobliżu WŁASNE `_maxSafeRationCache.clear()` -- `st.zapasyPanstwa = central`
// (empire-food.ts:258) leci PRZED `markCityStateDirty()` (który leci dopiero po sync
// renderera miast i kilku `yieldTurnTransitionUi()` niżej w tej samej turze), więc bez tego
// czyszczenia plakietki na mapie pokazują przeterminowany cache przez fazę AI/barbarzyńcy/
// sprawdzanie zwycięstwa.
// ---------------------------------------------------------------------------
{
  const callIdx = src.indexOf('lastEfTickResult = advanceEmpireFood(');
  ok(callIdx >= 0, 'znaleziono wywołanie advanceEmpireFood(...) w main.ts');
  const windowSrc = callIdx >= 0 ? src.slice(callIdx, callIdx + 1500) : '';
  const clearIdx = windowSrc.indexOf('_maxSafeRationCache.clear();');
  const efTickResultIdx = windowSrc.indexOf('const efTickResult = lastEfTickResult;');
  ok(clearIdx >= 0,
    '_maxSafeRationCache.clear() znaleziony w pobliżu wywołania advanceEmpireFood(...) (max 1500 znaków dalej)');
  ok(efTickResultIdx < 0 || clearIdx < 0 || clearIdx < efTickResultIdx,
    '_maxSafeRationCache.clear() następuje PRZED `const efTickResult = lastEfTickResult;` -- czyszczone od razu po ticku, nie odłożone');
}

// ---------------------------------------------------------------------------
// Część 9 (runda 5, blokada 2, POWAŻNIEJSZA -- prawdziwy bug gameplayowy): miasto OBLĘŻONE
// (`oblegane: true`, wykluczone z `playerCities` = `cities.filter(c => c.ownerId===0 && !c.oblegane)`)
// przy niewypłacalnym imperium musi dostać maxSafe = WYZYWIENIE_MIN (0), NIE zahardkodowane
// WYZYWIENIE_MAX (6) z inicjalizatora pętli `let maxSafe = WYZYWIENIE_MAX;` -- pętla po
// `playerCities` NIGDY nie trafia w `pc.id === cityId` dla miasta oblężonego (bo go tam nie ma),
// więc bez fallbacku funkcja zwracałaby 6 zamiast realnego wyniku z `maxSafePoziomRacjiForCity`.
//
// Test wycina PRAWDZIWE ciało `getMaxSafePoziomRacjiForPlayerCity(cityId)` z main.ts i wykonuje
// je z mockami zależności (previewCityEconomy zwraca ustaloną listę `perCity` -- TYLKO dla miast
// NIE-oblężonych, dokładnie jak robi to prawdziwy `previewCityEconomy(playerCities, ...)`) +
// PRAWDZIWĄ `maxSafePoziomRacjiForCity`/`buildEmpireFoodParams`/`freshEmpireFoodState` z
// gra/src/game/empire-food.ts (przez ten sam esbuild-bundle M co Część 3).
// ---------------------------------------------------------------------------
const gmsSigForRun = 'function getMaxSafePoziomRacjiForPlayerCity(cityId: string): PoziomRacji {';
const gmsBodyTs = sliceFunctionBody(src, gmsSigForRun);
ok(gmsBodyTs !== null, 'znaleziono ciało getMaxSafePoziomRacjiForPlayerCity do wykonania (Część 9)');
// Ciało zawiera składnię TS-only (`new Map<number, string>()`, inline `import('...').Typ`) --
// `new Function` (czysty JS) tego nie sparsuje. Transpiluj przez esbuild (loader 'ts'), tak jak
// robi to build produkcyjny, zamiast pisać reimplementację.
const gmsBody = gmsBodyTs
  ? esbuild.transformSync(gmsBodyTs, { loader: 'ts', target: 'node18' }).code
  : null;

function runGetMaxSafePoziomRacjiForPlayerCity({
  cityId, cities, previewPerCity, zapasyPrzed, units: unitsOverride,
}) {
  const previewCityEconomy = () => ({ perCity: previewPerCity });
  const player = { civType: 'grecy', era: 'kamien', zbadane: new Set() };
  const map = {};
  const data = { econParams: {} };
  const _menuDifficulty = 'normal';
  const cityBuilt = new Map();
  const orderMultMap = new Map();
  const empireEpochForOwner = () => 'kamien';
  const unlockedTechSetForOwner = () => new Set();
  const buildAllTerritoryNodes = () => [];
  const buildWonderCityYieldsByOwnerMap = () => new Map();
  const makeOwnerZlotoAccessResolver = () => (() => true);
  const makeOwnerRuntimeActiveLabelsResolver = () => (() => []);
  const makeOwnerEmpireStockResolver = () => (() => 0);
  const ownerDefaultPodzialHandlu = 0.5;
  const ownerDefaultPodzialPracy = 0.5;
  const empireFoodStates = new Map([[0, { zapasyPanstwa: zapasyPrzed, turyUjemnychZapasow: 0 }]]);
  const _maxSafeRationCache = new Map();
  // R-AUTO-WYZYWIENIE-KRYTERIUM-Q1=A: ciało teraz liczy kosztArmii inline (patrz komentarz przy
  // ENTRY wyżej). `units` domyślnie [] -- scenariusze E/F (blokada 2, oblężenie/insolvent) nie
  // testują koszt armii, więc brak wojska (kosztArmii=0) odtwarza dokładnie ich dotychczasowe
  // oczekiwane wartości. `cityAtUnit`/`isCampingForFoodDiscount`/`territoryOwnerAt` są tylko
  // odwoływane WEWNĄTRZ `units.map(...)` -- z pustą tablicą nigdy się nie wykonują, ale i tak
  // dajemy nieszkodliwe zaślepki (odporność na przyszłe scenariusze z niepustą `units`).
  const units = unitsOverride ?? [];
  const unitFoodTbl = {};
  const cityAtUnit = () => undefined;
  const isCampingForFoodDiscount = () => false;
  const territoryOwnerAt = () => undefined;

  const fn = new Function(
    'cityId', 'cities', 'WYZYWIENIE_MAX', 'player', 'previewCityEconomy', 'map', 'data',
    '_menuDifficulty', 'cityBuilt', 'orderMultMap', 'empireEpochForOwner', 'unlockedTechSetForOwner',
    'buildAllTerritoryNodes', 'buildWonderCityYieldsByOwnerMap', 'makeOwnerZlotoAccessResolver',
    'makeOwnerRuntimeActiveLabelsResolver', 'makeOwnerEmpireStockResolver', 'ownerDefaultPodzialHandlu',
    'ownerDefaultPodzialPracy', 'buildEmpireFoodParams', 'empireFoodStates', 'freshEmpireFoodState',
    'maxSafePoziomRacjiForCity', '_maxSafeRationCache',
    'loadUpkeepParams', 'militaryFoodConsumptionWithSpichlerz', 'spichlerzSolArmyBonusActive',
    'units', 'unitFoodTbl', 'cityAtUnit', 'isCampingForFoodDiscount', 'territoryOwnerAt',
    gmsBody,
  );
  const result = fn(
    cityId, cities, M.WYZYWIENIE_MAX, player, previewCityEconomy, map, data,
    _menuDifficulty, cityBuilt, orderMultMap, empireEpochForOwner, unlockedTechSetForOwner,
    buildAllTerritoryNodes, buildWonderCityYieldsByOwnerMap, makeOwnerZlotoAccessResolver,
    makeOwnerRuntimeActiveLabelsResolver, makeOwnerEmpireStockResolver, ownerDefaultPodzialHandlu,
    ownerDefaultPodzialPracy, M.buildEmpireFoodParams, empireFoodStates, M.freshEmpireFoodState,
    M.maxSafePoziomRacjiForCity, _maxSafeRationCache,
    M.loadUpkeepParams, M.militaryFoodConsumptionWithSpichlerz, M.spichlerzSolArmyBonusActive,
    units, unitFoodTbl, cityAtUnit, isCampingForFoodDiscount, territoryOwnerAt,
  );
  return { result, _maxSafeRationCache };
}

if (gmsBody) {
  const cities9 = [
    // poziomRacji: 0 -> koszt racji capital = 0 (rationFoodCostPerPop(0)=0), więc cała
    // produkcja=5 to czysta nadwyżka -- pozwala Scenariuszowi F (imperium wypłacalne) być
    // jednoznacznie wypłacalne bez dobierania parametrów pod wynik.
    { id: 'capital', ownerId: 0, oblegane: false, population: 5, poziomRacji: 0, rationMigratedV114: true },
    { id: 'siege', ownerId: 0, oblegane: true, population: 5, poziomRacji: 3, rationMigratedV114: true },
  ];
  // `previewPerCity` odzwierciedla dokładnie to, co realny `previewCityEconomy(playerCities, ...)`
  // by zwrócił -- WYŁĄCZNIE dla miast NIE-oblężonych (`playerCities` filtruje `!c.oblegane`),
  // miasto 'siege' celowo nieobecne.
  const previewPerCity9 = [
    {
      cityId: 'capital', ownerId: 0, oblegany: false,
      zywnoscBrutto: 5, kosztRacji: 0, bilansLokalny: 5,
      spichlerzCeramika: false, spichlerzSol: false, maSpichlerz: false, maSpichlerzII: false,
    },
  ];

  // Scenariusz E (SEDNO BLOKADY 2): imperium głęboko niewypłacalne (zapasyPrzed skrajnie
  // ujemne -- żaden poziom Wyżywienia 0..6 tego nie odwróci) -> miasto oblężone MUSI dostać
  // WYZYWIENIE_MIN (0), NIE zahardkodowane WYZYWIENIE_MAX (6) z inicjalizatora pętli.
  const scenE = runGetMaxSafePoziomRacjiForPlayerCity({
    cityId: 'siege', cities: cities9, previewPerCity: previewPerCity9, zapasyPrzed: -100000,
  });
  ok(scenE.result === 0,
    `Scenariusz E: miasto oblężone przy niewypłacalnym imperium (zapasyPrzed=-100000) -> getMaxSafePoziomRacjiForPlayerCity zwraca 0=WYZYWIENIE_MIN, NIE 6 (got=${scenE.result})`);
  ok(!scenE._maxSafeRationCache.has('siege'),
    'Scenariusz E: miasto oblężone świadomie NIE trafia do _maxSafeRationCache (fallback poza pętlą cache\'ującą)');
  ok(scenE._maxSafeRationCache.has('capital'),
    'Scenariusz E: miasto NIE-oblężone (capital) nadal trafia do _maxSafeRationCache (pętla N1 działa jak wcześniej)');

  // Kontrola założenia: to samo miasto oblężone przy WYPŁACALNYM imperium (zapasyPrzed=0,
  // capital ma czystą nadwyżkę=5, brak deficytu) dostaje maxSafe=6=WYZYWIENIE_MAX -- czyli
  // wynik NIE jest zahardkodowany na 0 w ogóle (funkcja realnie rozróżnia wypłacalne/
  // niewypłacalne, tylko poprzednio zawsze zwracała hardkodowane 6 z inicjalizatora pętli
  // niezależnie od wypłacalności -- ten test dowodzi, że dla insolvent NAPRAWDĘ dostajemy 0,
  // nie że funkcja teraz zawsze zwraca coś > 0).
  const scenF = runGetMaxSafePoziomRacjiForPlayerCity({
    cityId: 'siege', cities: cities9, previewPerCity: previewPerCity9, zapasyPrzed: 0,
  });
  ok(scenF.result === 6,
    `(kontrola założenia) Scenariusz F: miasto oblężone przy wypłacalnym imperium (bez deficytu) -> maxSafe=6=WYZYWIENIE_MAX, realnie liczony (got=${scenF.result})`);

  // Scenariusz G (N2, Evaluator 2026-08-13, domknięcie luki pokrycia
  // P-DYPLO-ARMII-KOSZT-WIAZANIE-MAIN-TS): Część 9 do tej pory testowała WYŁĄCZNIE z PUSTĄ
  // `units` (zob. komentarz przy `runGetMaxSafePoziomRacjiForPlayerCity` -- "brak wojska
  // (kosztArmii=0)"), czyli nigdy nie wykonywała realnie linii `kosztArmiiForMaxSafe =
  // militaryFoodConsumptionWithSpichlerz(playerUnitsForArmy, ...)` z NIEZEROWYM wynikiem --
  // gdyby to wiązanie (main.ts ~14264-14281, dwa wywołania `maxSafePoziomRacjiForCity` z
  // `kosztArmii: kosztArmiiForMaxSafe` w liniach ~14310 i ~14339) zostało PRZYPADKOWO usunięte
  // z jednego z dwóch miejsc, komplet dotychczasowych scenariuszy Części 9 (units=[] wszędzie)
  // nadal przechodziłby na zielono -- kosztArmii=0 niezależnie od tego, czy wiązanie istnieje.
  // Tu uruchamiamy TĘ SAMĄ realną ścieżkę (miasto 'capital', NIE oblężone -- idzie przez pętlę
  // main linii ~14301-14313, główne wiązanie, nie fallback linii ~14330-14340 testowany przez
  // Scenariusz E) dla identycznych danych miasta/zapasów, raz z PUSTĄ armią (kosztArmii=0,
  // jak dotąd) i raz z NIEPUSTĄ (2 jednostki gracza, koszt żywności > 0 liczony PRAWDZIWĄ
  // `militaryFoodConsumptionWithSpichlerz` -- nie literałem) -- i porównujemy wynik.
  // Wartości 0,5 / 0 ustalone empirycznie i deterministyczne (identyczne przy zapasyPrzed
  // 0/100/1000/10000 -- ścieżka gracza wymaga flow-bilansu nieujemnego W TEJ turze, nie tylko
  // dodatniego zapasu, patrz `requireFlowBalance`/`isRationBalanceTargetMet` w empire-food.ts).
  const scenGEmpty = runGetMaxSafePoziomRacjiForPlayerCity({
    cityId: 'capital', cities: cities9, previewPerCity: previewPerCity9, zapasyPrzed: 0, units: [],
  });
  ok(scenGEmpty.result === 0.5,
    `Scenariusz G (baseline): capital, PUSTA armia (kosztArmii=0) -> maxSafe=0.5 (got=${scenGEmpty.result})`);

  const scenGArmy = runGetMaxSafePoziomRacjiForPlayerCity({
    cityId: 'capital', cities: cities9, previewPerCity: previewPerCity9, zapasyPrzed: 0,
    units: [
      { ownerId: 0, typeId: 'wojownik', q: 0, r: 0 },
      { ownerId: 0, typeId: 'wojownik', q: 1, r: 0 },
    ],
  });
  ok(scenGArmy.result === 0,
    `Scenariusz G (N2): capital, NIEPUSTA armia (2 jednostki, kosztArmii>0 z realnej ` +
    `militaryFoodConsumptionWithSpichlerz) -> maxSafe=0=WYZYWIENIE_MIN, NIŻSZY niż baseline ` +
    `0,5 bez armii (got=${scenGArmy.result})`);
  ok(scenGArmy.result < scenGEmpty.result,
    `Scenariusz G (N2): koszt armii FAKTYCZNIE obniża "Limit Spichlerza" dla tego samego ` +
    `miasta/danych (armia=${scenGArmy.result} < pusta=${scenGEmpty.result}) -- dowód, że ` +
    `wiązanie kosztArmii w main.ts jest wykonywane, nie tylko obecne w kodzie martwym`);
}

// Sprzątanie plików tymczasowych esbuild.
try { fs.unlinkSync(ENTRY); } catch {}
try { fs.unlinkSync(BUNDLE); } catch {}

console.log(`\n${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
