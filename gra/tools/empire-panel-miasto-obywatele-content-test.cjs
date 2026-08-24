'use strict';
/**
 * empire-panel-miasto-obywatele-content-test.cjs — P-PANEL-MIASTO-OBYWATELE-TRESC-NIEPELNA
 * (Maciej 2026-08-16, ECHO A: dociągnięcie brakujących pozycji zatwierdzonych list Miasto (8)/
 * Obywatele (9), R-DESIGN-11-ZAKLADEK Q2=B) + RUNDA 2 (naprawa N1 Evaluatora FAIL 6366e81e).
 *
 * Run: cd gra && node tools/empire-panel-miasto-obywatele-content-test.cjs
 *
 * Sekcje A-C sprawdzają WYŁĄCZNIE źródło-tekst (`indexOf`/regex na surowym pliku), z granicami
 * wycinków (start funkcji → koniec funkcji), nie gołym `includes()` gdziekolwiek w pliku — nie
 * łapią mutacji WARTOŚCIOWYCH (potwierdzone Evaluatorem: 4 mutacje arytmetyczne przeszły 59/0
 * zielono w rundzie 1). Sekcja D (RUNDA 2, naprawa N1) domyka tę lukę REALNYM wykonaniem:
 * `renderMiastoSection`/`renderObywateleSection` DAJĄ SIĘ esbuild-zbundlować (ten sam stub
 * `icons/brandAssets` co sekcja L `empire-miasta-table-test.cjs` — jedyna przeszkoda Vite w
 * drzewie zależności; main.ts, w przeciwieństwie do empireDetailPanel.ts, NADAL nie da się
 * zbundlować — jedna funkcja-domknięcie, patrz sekcja B źródło-tekst).
 *
 * Pokrywa:
 *   A. empireDetailTypes.ts — nowe pola/typy (EmpireCityBuildingGroupRow, EmpireCityQueueItemRow,
 *      EmpireCityDefenseRow, EmpireCityEconRow.{buildingGroups,queue,queueWstrzymana,defense},
 *      EmpireCityPoborRow.{zdrowieBuildingCount,prawoAdminBuildingCount,prawoPct,poziomRacji,
 *      racjaGrowthPct}, EmpireTradeRouteRow.cityId, EmpireHappinessSourceRow/EmpireHappinessSnap,
 *      EmpireDetailSnap.happiness, aggregateHappinessSources (naprawa N1, wyciągnięta funkcja)).
 *   B. main.ts buildEmpireDetailSnap() — GROUNDING: cada nowe pole liczone z ISTNIEJĄCEJ funkcji
 *      silnika (groupBuiltBuildingIds/cityProd/structureDefenseBonusFor/unitsOnCityHexForLaw/
 *      cityOrderState/getCityRationLevel/rationGrowthPercent/aggregateHappinessSources), nie
 *      wymyślone od zera.
 *   C. empireDetailPanel.ts — renderMiastoSection/renderObywateleSection renderują 4+4 nowe
 *      podsekcje (Budynki/Kolejka produkcji/Obrona miasta/Handel per miasto; Zdrowie/Prawo i
 *      administracja/Wyżywienie/rozbicie Zadowolenia), sygnatura renderObywateleSection przyjmuje
 *      `happiness`, i call site przekazuje `snap.happiness`.
 *   D. REALNE wykonanie (esbuild [+jsdom dla D4]) — naprawa N1 (Evaluator FAIL 6366e81e, runda 2):
 *      D1 aggregateHappinessSources() (empireDetailTypes.ts, funkcja z sekcji A/B — main.ts ją
 *         woła, nie duplikuje) — 2+ miast z tym samym `id` źródła MUSI się zsumować (nie
 *         nadpisać) → łapie mutację Evaluatora „=" zamiast „+=" w sumowaniu Zadowolenia.
 *      D2 cityWallDefenseBonusPercent() (game/city-defense.ts — formuła, którą
 *         structureDefenseBonusFor() w main.ts woła dla defense.structBonusPct) — wartości
 *         dokładne dla mury/mury+fort/palisada/baszta → łapie mutację „bonus murów ×2".
 *      D3 unitsOnCityHexForLaw() (game/armyMerge.ts — funkcja, którą main.ts woła dla
 *         defense.garnizonCount) — pusto/jawna+ukryta/oblegający pominięty/obcy właściciel
 *         pominięty/inny heks pominięty → łapie mutację „garnizon +1" (gdyby wkradła się do tej
 *         funkcji) i pokrywa własne przypadki brzegowe zadania (pusty garnizon, mieszany skład).
 *      D4 renderMiastoSection() (empireDetailPanel.ts, REALNE wykonanie, esbuild+jsdom) —
 *         (a) SZLAKI w wierszu podsumowania = suma PO PAIRED, nie `trade.routes.length" globalne
 *             (regresja N3 — trasa „widmo" spoza `paired` w danych testowych to wykrywa),
 *         (b) DOCHÓD = suma arytmetyczna per miasto i w podsumowaniu, nie podwojona → łapie
 *             mutację „dochód tras ×2",
 *         (c) % postępu kolejki na obu brzegach: postep=0 → „(0%)", postep=koszt → „(100%)",
 *         (d) kolejka PUSTA → „pusta" (własny przypadek brzegowy zadania),
 *         (e) miasto BEZ murów → „brak murów", miasto Z murami → dokładny „+200%" (własny
 *             przypadek brzegowy zadania + kontrola przytomności dla D2).
 */

const fs = require('fs');
const path = require('path');

const GRA_DIR = path.resolve(__dirname, '..');
const TYPES_TS = path.join(GRA_DIR, 'src/ui/empireDetailTypes.ts');
const MAIN_TS = path.join(GRA_DIR, 'src/main.ts');
const PANEL_TS = path.join(GRA_DIR, 'src/ui/empireDetailPanel.ts');

const typesSrc = fs.readFileSync(TYPES_TS, 'utf8');
const mainSrcRaw = fs.readFileSync(MAIN_TS, 'utf8');
const panelSrc = fs.readFileSync(PANEL_TS, 'utf8');

/** Same naive line-comment strip as other source-text tests in this repo (safe: no `//` occurs
 *  inside a string literal relevant to the anchors searched here). */
function stripLineComments(src) {
  return src
    .split('\n')
    .map((line) => {
      const idx = line.indexOf('//');
      return idx >= 0 ? line.slice(0, idx) : line;
    })
    .join('\n');
}
const mainSrc = stripLineComments(mainSrcRaw);

let pass = 0;
let fail = 0;
function ok(cond, label) {
  if (cond) { pass++; }
  else { fail++; console.error('FAIL:', label); }
}
function eqv(actual, expected, label) {
  ok(actual === expected, `${label} (got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)})`);
}

const esbuild = (() => {
  const apiPath = path.resolve(GRA_DIR, 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[empire-panel-miasto-obywatele-content-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

// ===========================================================================
// A. empireDetailTypes.ts — nowe pola/typy
// ===========================================================================
console.log('-- A. empireDetailTypes.ts --');

ok(typesSrc.includes('export interface EmpireCityBuildingGroupRow'),
  'EmpireCityBuildingGroupRow zdefiniowany');
ok(typesSrc.includes('export interface EmpireCityQueueItemRow'),
  'EmpireCityQueueItemRow zdefiniowany');
ok(typesSrc.includes('export interface EmpireCityDefenseRow'),
  'EmpireCityDefenseRow zdefiniowany');
ok(typesSrc.includes('export interface EmpireHappinessSourceRow'),
  'EmpireHappinessSourceRow zdefiniowany');
ok(typesSrc.includes('export interface EmpireHappinessSnap'),
  'EmpireHappinessSnap zdefiniowany');

{
  const econIdx = typesSrc.indexOf('export interface EmpireCityEconRow');
  const poborIdx = typesSrc.indexOf('export interface EmpireCityBuildingGroupRow');
  ok(econIdx > -1 && poborIdx > econIdx, 'EmpireCityEconRow poprzedza EmpireCityBuildingGroupRow (kolejność deklaracji)');
  const econBody = econIdx > -1 && poborIdx > econIdx ? typesSrc.slice(econIdx, poborIdx) : '';
  ok(econBody.includes('buildingGroups: EmpireCityBuildingGroupRow[];'),
    'EmpireCityEconRow.buildingGroups: EmpireCityBuildingGroupRow[]');
  ok(econBody.includes('queue: EmpireCityQueueItemRow[];'),
    'EmpireCityEconRow.queue: EmpireCityQueueItemRow[]');
  ok(econBody.includes('queueWstrzymana: boolean;'),
    'EmpireCityEconRow.queueWstrzymana: boolean');
  ok(econBody.includes('defense: EmpireCityDefenseRow;'),
    'EmpireCityEconRow.defense: EmpireCityDefenseRow');
}

{
  const poborIdx = typesSrc.indexOf('export interface EmpireCityPoborRow');
  const happinessRowIdx = typesSrc.indexOf('export interface EmpireHappinessSourceRow');
  ok(poborIdx > -1 && happinessRowIdx > poborIdx, 'EmpireCityPoborRow poprzedza EmpireHappinessSourceRow');
  const poborBody = poborIdx > -1 && happinessRowIdx > poborIdx ? typesSrc.slice(poborIdx, happinessRowIdx) : '';
  ok(poborBody.includes('zdrowieBuildingCount: number;'), 'EmpireCityPoborRow.zdrowieBuildingCount: number');
  ok(poborBody.includes('prawoAdminBuildingCount: number;'), 'EmpireCityPoborRow.prawoAdminBuildingCount: number');
  ok(poborBody.includes('prawoPct: number | null;'), 'EmpireCityPoborRow.prawoPct: number | null');
  ok(poborBody.includes('poziomRacji: number;'), 'EmpireCityPoborRow.poziomRacji: number');
  ok(poborBody.includes('racjaGrowthPct: number;'), 'EmpireCityPoborRow.racjaGrowthPct: number');
}

{
  const tradeIdx = typesSrc.indexOf('export interface EmpireTradeRouteRow');
  ok(tradeIdx > -1, 'EmpireTradeRouteRow znaleziony');
  const tradeEnd = tradeIdx > -1 ? typesSrc.indexOf('\n}\n', tradeIdx) : -1;
  const tradeBody = tradeEnd > tradeIdx ? typesSrc.slice(tradeIdx, tradeEnd) : '';
  ok(tradeBody.includes('cityId: string;'), 'EmpireTradeRouteRow.cityId: string (join niezawodny, P-EMPIRE-MIASTA-JOIN-INDEX)');
  // T6 (R-HANDEL-SZLAKI-PRZEBUDOWA-Q1): rozklad dochodu per trasa -- DWA nosniki celowo.
  // Flaga mowi DLACZEGO (brak budynku), liczba mowi ILE; sama liczba 0 nie odroznilaby
  // "5% = 0, bo nie ma Targowiska" od zwyklego zera i UI nie mialoby czego wyswietlic.
  ok(tradeBody.includes('budynekOdblokowany: boolean;'),
    'T6: EmpireTradeRouteRow.budynekOdblokowany: boolean (stan pokrycia budynkowego TEJ trasy, z TradeRoute/T3)');
  ok(tradeBody.includes('premiaBudynku: number;'),
    'T6: EmpireTradeRouteRow.premiaBudynku: number (skladnik 5% TEJ trasy, ta sama liczba co w economy.ts)');
}

ok(typesSrc.includes('happiness: EmpireHappinessSnap;'), 'EmpireDetailSnap.happiness: EmpireHappinessSnap');
ok(typesSrc.includes('export function aggregateHappinessSources('),
  'aggregateHappinessSources() zdefiniowana i eksportowana (naprawa N1, runda 2)');

// ===========================================================================
// B. main.ts buildEmpireDetailSnap() — grounding (ekspozycja UI, nie nowa logika)
// ===========================================================================
console.log('-- B. main.ts buildEmpireDetailSnap() grounding --');

const fnIdx = mainSrc.indexOf('function buildEmpireDetailSnap(): EmpireDetailSnap {');
ok(fnIdx > -1, 'buildEmpireDetailSnap() znaleziona w main.ts');
const fnEnd = fnIdx > -1 ? mainSrc.indexOf('\n    }\n', fnIdx) : -1;
ok(fnEnd > fnIdx, 'koniec buildEmpireDetailSnap() znaleziony');
const fnBody = fnEnd > fnIdx ? mainSrc.slice(fnIdx, fnEnd) : '';

// Import gwarantujący, że groupBuiltBuildingIds nie jest lokalną reimplementacją.
ok(mainSrc.includes("import { cityPalacTier, groupBuiltBuildingIds } from './game/building-upgrades';"),
  'groupBuiltBuildingIds zaimportowany z game/building-upgrades (istniejąca, czysta funkcja)');
ok(mainSrc.includes('rationGrowthPercent,') && mainSrc.includes("from './game/population-growth-v85';"),
  'rationGrowthPercent zaimportowany z game/population-growth-v85 (istniejąca, czysta funkcja)');

ok(fnBody.includes('groupBuiltBuildingIds(builtIds, data.buildings)'),
  'cityEcon: buildingGroups liczone przez groupBuiltBuildingIds (nie ręczne zliczanie)');
ok(fnBody.includes('cityProd.get(c.id)'),
  'cityEcon: kolejka czytana z cityProd (Map<string, CityProduction>) — TO SAMO źródło co panel miasta');
ok(fnBody.includes('structureDefenseBonusFor(c.q, c.r)'),
  'cityEcon.defense.structBonusPct = structureDefenseBonusFor() — TA SAMA funkcja co silnik walki/oblężenia');
ok(fnBody.includes('unitsOnCityHexForLaw(units, c.q, c.r, c.ownerId)'),
  'cityEcon.defense.garnizonCount = unitsOnCityHexForLaw() — TA SAMA funkcja co rozpiska Prawa');
ok(fnBody.includes('hasWalls: structBonusPct > 0'),
  'defense.hasWalls pochodna structBonusPct (nie osobne, potencjalnie rozjeżdżające się źródło)');
// Naprawa N1 (runda 2): main.ts NIE JEST bundlowalny (sekcje D2/D3 testują REALNIE
// cityWallDefenseBonusPercent()/unitsOnCityHexForLaw() z ich modułów źródłowych, nie stąd) —
// więc mutacja dopisana WYŁĄCZNIE na call site w main.ts (np. „.length + 1", „structBonusPct * 2")
// nie przeszłaby przez zbundlowaną funkcję. Regex DOKŁADNEGO dopasowania całej linii (nie
// substring .includes()) zamyka tę lukę: jakikolwiek dodatkowy operator po prawej stronie łamie
// dopasowanie.
ok(/const structBonusPct = structureDefenseBonusFor\(c\.q, c\.r\);\s*$/m.test(fnBody),
  'cityEcon.defense.structBonusPct = DOKŁADNIE structureDefenseBonusFor(c.q, c.r), zero dodatkowej arytmetyki na call site (łapie mutację „bonus murów ×2" w main.ts)');
ok(/const garnizonCount = unitsOnCityHexForLaw\(units, c\.q, c\.r, c\.ownerId\)\.length;\s*$/m.test(fnBody),
  'cityEcon.defense.garnizonCount = DOKŁADNIE unitsOnCityHexForLaw(...).length, zero dodatkowej arytmetyki na call site (łapie mutację „garnizon +1" w main.ts)');

ok(fnBody.includes("poborBuildingGroups.find(g => g.grupa === 'Zdrowie')"),
  "cityPobor.zdrowieBuildingCount liczony z grupy 'Zdrowie' (BUILDING_GROUP_ORDER)");
ok(fnBody.includes("const prawoAdminBuildingCount = poborBuildingGroups")
  && fnBody.includes(".find(g => g.grupa === 'Prawo i administracja')"),
  "cityPobor.prawoAdminBuildingCount liczony z grupy 'Prawo i administracja' (BUILDING_GROUP_ORDER)");
ok(fnBody.includes('const ord = cityOrderState.get(c.id);') && fnBody.includes('prawoPct: ord?.prawPct ?? null,'),
  'cityPobor.prawoPct czytany WPROST z cityOrderState.prawPct (silnik, koniec tury) — nie przeliczany osobno');
ok(fnBody.includes('const poziomRacji = getCityRationLevel(c);'),
  'cityPobor.poziomRacji = getCityRationLevel() — ta sama czysta funkcja co silnik ekonomii');
ok(fnBody.includes('racjaGrowthPct: rationGrowthPercent(poziomRacji),'),
  'cityPobor.racjaGrowthPct = rationGrowthPercent() — ta sama czysta funkcja co silnik wzrostu');

// Naprawa N1 (runda 2, Evaluator FAIL 6366e81e): agregacja Zadowolenia wyciągnięta do czystej,
// eksportowanej funkcji `aggregateHappinessSources()` (empireDetailTypes.ts) — main.ts musi ją
// WOŁAĆ, nie duplikować pętlą inline (duplikat mógłby się po cichu rozjechać z testem sekcji D).
ok(mainSrc.includes('import { aggregateHappinessSources } from \'./ui/empireDetailTypes\';'),
  'aggregateHappinessSources zaimportowana z empireDetailTypes.ts (nie lokalna reimplementacja)');
ok(fnBody.includes('aggregateHappinessSources(') && fnBody.includes('cityOrderState.get(c.id)?.szLines'),
  'happiness: buildEmpireDetailSnap() woła aggregateHappinessSources() z cityOrderState.szLines WSZYSTKICH miast gracza');
ok(!fnBody.includes('const happinessAgg = new Map'),
  'happiness: main.ts NIE duplikuje pętli agregującej inline (musi wołać funkcję wyciągniętą do empireDetailTypes.ts)');
ok(fnBody.includes('happiness,'),
  'buildEmpireDetailSnap() zwraca pole happiness w obiekcie wynikowym');

// Trade route cityId — poza buildEmpireDetailSnap() (osobna funkcja buildEmpireTradeSnap).
ok(mainSrc.includes('cityId: r.fromCityId,') && mainSrc.includes('cityName: myCity?.name ?? r.fromCityId,'),
  'buildEmpireTradeSnap(): EmpireTradeRouteRow.cityId = r.fromCityId (TradeRoute), obok cityName istniejącego');

// T6: rozkład dochodu per trasa liczony WYŁĄCZNIE funkcją silnika, nie własną kopią wzoru.
// Gdyby ktoś wrócił do literału `0.05 *` w buildEmpireTradeSnap, panel stałby się CZWARTYM
// miejscem liczącym tę samą premię — dokładnie precedens P-HANDEL-SZLAKI-WZOR-DUPLIKAT-Q1.
ok(mainSrc.includes('const premiaBudynku = tradeRouteBuildingBonusForRoute(r, incomeParams);'),
  'T6: buildEmpireTradeSnap() liczy premię 5% przez tradeRouteBuildingBonusForRoute() (trade-routes.ts), nie własnym wzorem');
ok(mainSrc.includes('budynekOdblokowany: r.budynekOdblokowany,') && mainSrc.includes('premiaBudynku,'),
  'T6: buildEmpireTradeSnap() przekazuje do snapa oba pola rozkładu (flaga budynku + kwota 5%)');
{
  const snapIdx = mainSrc.indexOf('function buildEmpireTradeSnap()');
  const snapBody = snapIdx > -1 ? mainSrc.slice(snapIdx, snapIdx + 4000) : '';
  ok(snapIdx > -1, 'T6: buildEmpireTradeSnap() znaleziona w main.ts');
  ok(!/0\.05\s*\*/.test(snapBody),
    'T6: w ciele buildEmpireTradeSnap() NIE ma literału „0.05 *" (stawka 5% żyje wyłącznie w trade-routes.ts)');
}

// ===========================================================================
// C. empireDetailPanel.ts — render + wiring
// ===========================================================================
console.log('-- C. empireDetailPanel.ts render + wiring --');

const miastoIdx = panelSrc.indexOf('function renderMiastoSection(');
const obywateleIdx = panelSrc.indexOf('function renderObywateleSection(');
ok(miastoIdx > -1 && obywateleIdx > miastoIdx, 'renderMiastoSection() poprzedza renderObywateleSection()');
const cityPoborMiniIdx = panelSrc.indexOf('function cityPoborMiniRekruci(');
ok(cityPoborMiniIdx > obywateleIdx, 'cityPoborMiniRekruci() następuje po renderObywateleSection() (granica wycinka)');
const miastoBody = panelSrc.slice(miastoIdx, obywateleIdx);
const obywateleBody = panelSrc.slice(obywateleIdx, cityPoborMiniIdx);

// -- Miasto: 4 nowe podsekcje --
ok(miastoBody.includes("subHdr('Budynki')"), 'renderMiastoSection: nagłówek „Budynki"');
ok(miastoBody.includes('econ?.buildingGroups ?? []'), 'renderMiastoSection: Budynki czyta econ.buildingGroups (snapshot), nie liczy same');
ok(miastoBody.includes("subHdr('Kolejka produkcji')"), 'renderMiastoSection: nagłówek „Kolejka produkcji"');
ok(miastoBody.includes('econ?.queue ?? []'), 'renderMiastoSection: Kolejka czyta econ.queue (snapshot)');
ok(miastoBody.includes("subHdr('Obrona miasta')"), 'renderMiastoSection: nagłówek „Obrona miasta"');
ok(miastoBody.includes('econ?.defense'), 'renderMiastoSection: Obrona czyta econ.defense (snapshot)');
ok(miastoBody.includes("subHdr('Handel — szlaki per miasto')"), 'renderMiastoSection: nagłówek „Handel — szlaki per miasto"');
ok(miastoBody.includes('trade.routes.filter(r => r.cityId === pob.cityId)'),
  'renderMiastoSection: Handel filtruje trade.routes PO cityId (nie po cityName niejednoznacznym po podboju)');
// Naprawa N3 (runda 2): SZLAKI w podsumowaniu MUSI liczyć się z `sRoutes` (suma po paired),
// NIE z `trade.routes.length` (zawsze cała cywilizacja) — kotwica źródło-tekst + real-execution
// w sekcji D4 niżej.
ok(miastoBody.includes('sRoutes += cityRoutes.length;'),
  'renderMiastoSection: SZLAKI podsumowania sumowane po paired (sRoutes), nie trade.routes.length (naprawa N3)');
ok(!miastoBody.includes('<div>${trade.routes.length}</div>'),
  'renderMiastoSection: podsumowanie Handlu NIE używa już trade.routes.length (naprawa N3)');
// Naprawa N4.1: etykieta „Pieniądza/turę" przywrócona przy DOCHÓD (stopka sekcji Handel).
ok(miastoBody.includes('Pieniądza/turę'),
  'renderMiastoSection: stopka Handlu nazywa jednostkę DOCHÓD wprost (Pieniądza/turę) — naprawa N4.1');

// -- Obywatele: 3 nowe podsekcje + rozbicie Zadowolenia + sygnatura --
ok(panelSrc.includes(
  'function renderObywateleSection(\n'
  + '  ce: EmpireDetailSnap[\'cityEcon\'],\n'
  + '  cp: EmpireDetailSnap[\'cityPobor\'],\n'
  + '  e: EmpireDetailSnap[\'economy\'],\n'
  + '  p: EmpireDetailSnap[\'power\'],\n'
  + '  k: EmpireDetailSnap[\'kultura\'],\n'
  + '  religion: EmpireDetailSnap[\'religion\'],\n'
  + '  resources: EmpireResourceRow[],\n'
  + "  happiness: EmpireDetailSnap['happiness'],\n"
  + '): string {',
), 'renderObywateleSection: sygnatura przyjmuje happiness: EmpireDetailSnap[\'happiness\']');
ok(obywateleBody.includes("subHdr('Zdrowie')"), 'renderObywateleSection: nagłówek „Zdrowie"');
ok(obywateleBody.includes('c.zdrowieBuildingCount'), 'renderObywateleSection: Zdrowie czyta cityPobor.zdrowieBuildingCount');
ok(obywateleBody.includes("subHdr('Prawo i administracja')"), 'renderObywateleSection: nagłówek „Prawo i administracja"');
ok(obywateleBody.includes('c.prawoPct') && obywateleBody.includes('c.prawoAdminBuildingCount'),
  'renderObywateleSection: Prawo czyta cityPobor.prawoPct + prawoAdminBuildingCount');
ok(obywateleBody.includes("subHdr('Wyżywienie')"), 'renderObywateleSection: nagłówek „Wyżywienie"');
ok(obywateleBody.includes('formatWyzwienieLabel(c.poziomRacji)') && obywateleBody.includes('c.racjaGrowthPct'),
  'renderObywateleSection: Wyżywienie czyta cityPobor.poziomRacji + racjaGrowthPct');
ok(obywateleBody.includes('happiness.sources') && obywateleBody.includes('happiness.hasData'),
  'renderObywateleSection: rozbicie Zadowolenia czyta happiness.sources/hasData (snapshot, nie wymyślone)');
ok(obywateleBody.includes('e.zadowolenie ?? (happiness.hasData ? happiness.totalNetto : null)'),
  'renderObywateleSection: poziom Zadowolenia ma fallback na happiness.totalNetto (e.zadowolenie nigdy nie jest wypełniane silnikiem)');
// Naprawa N4.2/N4.3 (runda 2): jednostka „Sz" przy Zadowoleniu (hero-sub + każde źródło) i
// etykieta „Poziom imperium" (myląca — to suma netto, nie poziom) zastąpiona.
ok(obywateleBody.includes('${signedIntTxt(zadow)} Sz</b>'),
  'renderObywateleSection: hero-sub Zadowolenia ma jednostkę Sz (naprawa N4.2)');
ok(obywateleBody.includes('${signedTxt(src.value)} Sz</span>'),
  'renderObywateleSection: każde źródło rozbicia Zadowolenia ma jednostkę Sz (naprawa N4.2)');
ok(!obywateleBody.includes('>Poziom imperium<'),
  'renderObywateleSection: etykieta „Poziom imperium" usunięta (myląca — to suma netto, nie poziom/tier — naprawa N4.3)');
ok(obywateleBody.includes('Suma netto (wszystkie miasta)'),
  'renderObywateleSection: nowa etykieta „Suma netto (wszystkie miasta)" (naprawa N4.3)');

// -- Call site: snap.happiness przekazany do renderObywateleSection --
ok(panelSrc.includes('renderObywateleSection(ce, cp, e, p, k, snap.religion, snap.resources, snap.happiness);'),
  'call site: renderObywateleSection() wywołane z snap.happiness jako ostatnim argumentem');

// ===========================================================================
// D. REALNE wykonanie — naprawa N1 (Evaluator FAIL 6366e81e, runda 2). Patrz JSDoc na górze
//    pliku dla pełnego opisu D1-D4.
// ===========================================================================

function runSectionD1() {
  console.log('\n-- D1. aggregateHappinessSources() (esbuild, REALNE wykonanie) --');
  const ENTRY = path.resolve(__dirname, '.empire-panel-D1-entry.ts');
  const BUNDLE = path.resolve(__dirname, '.empire-panel-D1-bundle.cjs');
  fs.writeFileSync(ENTRY, `export { aggregateHappinessSources } from '../src/ui/empireDetailTypes';\n`, 'utf8');
  try {
    esbuild.buildSync({
      entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
      outfile: BUNDLE, absWorkingDir: GRA_DIR, logLevel: 'silent',
      resolveExtensions: ['.ts', '.js', '.json'],
    });
  } catch (e) {
    console.error('[empire-panel-miasto-obywatele-content-test] sekcja D1 esbuild bundling failed:\n', e.message || e);
    process.exit(1);
  }
  delete require.cache[require.resolve(BUNDLE)];
  const { aggregateHappinessSources } = require(BUNDLE);

  // Puste wejście -> hasData=false, sources=[], totalNetto=0.
  const empty = aggregateHappinessSources([undefined, undefined]);
  eqv(empty.hasData, false, 'D1a: hasData=false gdy żadne miasto nie ma szLines');
  eqv(empty.sources.length, 0, 'D1a: sources=[] gdy żadne miasto nie ma szLines');
  eqv(empty.totalNetto, 0, 'D1a: totalNetto=0 gdy żadne miasto nie ma szLines');

  // RDZEŃ mutacji Evaluatora „=" zamiast „+=" -- 2 miasta z TYM SAMYM id źródła MUSZĄ się
  // zsumować, nie nadpisać ostatnią wartością.
  const twoCities = aggregateHappinessSources([
    [{ id: 'budynki', label: 'Budynki', value: 5 }, { id: 'kultura', label: 'Kultura', value: 2 }],
    [{ id: 'budynki', label: 'Budynki', value: 3 }],
  ]);
  eqv(twoCities.hasData, true, 'D1b: hasData=true gdy co najmniej jedno miasto ma szLines');
  const budynkiRow = twoCities.sources.find(s => s.id === 'budynki');
  eqv(budynkiRow && budynkiRow.value, 8, 'D1b (mutacja „=" zamiast „+="): źródło „budynki" z 2 miast (5+3) sumuje się do 8, nie nadpisuje ostatnią wartością (3)');
  const kulturaRow = twoCities.sources.find(s => s.id === 'kultura');
  eqv(kulturaRow && kulturaRow.value, 2, 'D1b: źródło obecne tylko w jednym mieście zachowuje swoją wartość (2)');
  eqv(twoCities.totalNetto, 10, 'D1b: totalNetto = suma WSZYSTKICH źródeł po agregacji (8+2=10)');

  // Trzecie miasto bez szLines (jeszcze przed 1. turą) -- pomijane, nie zeruje reszty.
  const mixed = aggregateHappinessSources([
    [{ id: 'a', label: 'A', value: -4 }],
    undefined,
    [{ id: 'a', label: 'A', value: -1 }],
  ]);
  eqv(mixed.sources.find(s => s.id === 'a').value, -5, 'D1c: ujemne wartości też się sumują poprawnie (-4 + -1 = -5), miasto bez szLines pomijane');

  console.log(`D1: ${pass} passed so far, ${fail} failed so far`);
}

function runSectionD2() {
  console.log('\n-- D2. cityWallDefenseBonusPercent() (esbuild, REALNE wykonanie) --');
  const ENTRY = path.resolve(__dirname, '.empire-panel-D2-entry.ts');
  const BUNDLE = path.resolve(__dirname, '.empire-panel-D2-bundle.cjs');
  fs.writeFileSync(ENTRY, `export { cityWallDefenseBonusPercent } from '../src/game/city-defense';\n`, 'utf8');
  try {
    esbuild.buildSync({
      entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
      outfile: BUNDLE, absWorkingDir: GRA_DIR, logLevel: 'silent',
      resolveExtensions: ['.ts', '.js', '.json'],
    });
  } catch (e) {
    console.error('[empire-panel-miasto-obywatele-content-test] sekcja D2 esbuild bundling failed:\n', e.message || e);
    process.exit(1);
  }
  delete require.cache[require.resolve(BUNDLE)];
  const { cityWallDefenseBonusPercent } = require(BUNDLE);

  const params = { mur: 100, cytadela: 50, baszta: 25, palisada: 40 };
  eqv(cityWallDefenseBonusPercent([], params), 0, 'D2a: brak budynków obronnych -> 0% (kontrola przytomności dla „brak murów")');
  eqv(cityWallDefenseBonusPercent(['mury'], params), 100, 'D2b (mutacja „bonus murów ×2"): same mury -> dokładnie 100%, nie 200%');
  eqv(cityWallDefenseBonusPercent(['fort'], params), 150, 'D2c: fort (mury+cytadela) -> dokładnie 150%, nie 300%');
  eqv(cityWallDefenseBonusPercent(['palisada'], params), 40, 'D2d: sama palisada (bez murów/fortu) -> dokładnie 40%');
  eqv(cityWallDefenseBonusPercent(['mury', 'baszta'], params), 125, 'D2e: mury+baszta -> dokładnie 125% (100+25), nie podwojone');

  console.log(`D2: ${pass} passed so far, ${fail} failed so far`);
}

function runSectionD3() {
  console.log('\n-- D3. unitsOnCityHexForLaw() (esbuild, REALNE wykonanie) --');
  const ENTRY = path.resolve(__dirname, '.empire-panel-D3-entry.ts');
  const BUNDLE = path.resolve(__dirname, '.empire-panel-D3-bundle.cjs');
  fs.writeFileSync(ENTRY, `export { unitsOnCityHexForLaw } from '../src/game/armyMerge';\n`, 'utf8');
  try {
    esbuild.buildSync({
      entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
      outfile: BUNDLE, absWorkingDir: GRA_DIR, logLevel: 'silent',
      resolveExtensions: ['.ts', '.js', '.json'],
    });
  } catch (e) {
    console.error('[empire-panel-miasto-obywatele-content-test] sekcja D3 esbuild bundling failed:\n', e.message || e);
    process.exit(1);
  }
  delete require.cache[require.resolve(BUNDLE)];
  const { unitsOnCityHexForLaw } = require(BUNDLE);

  eqv(unitsOnCityHexForLaw([], 5, 5, 0).length, 0, 'D3a: garnizon=0 gdy pusto (przypadek brzegowy zadania)');

  const units = [
    { id: 'jawna', ownerId: 0, q: 5, r: 5 },
    { id: 'ukryta', ownerId: 0, q: 5, r: 5, inGarnizon: true },
    { id: 'oblegajacy', ownerId: 0, q: 5, r: 5, oblegaCityId: 'wroga-stolica' },
    { id: 'obcy-wlasciciel', ownerId: 1, q: 5, r: 5 },
    { id: 'inny-heks', ownerId: 0, q: 6, r: 5 },
  ];
  const res = unitsOnCityHexForLaw(units, 5, 5, 0);
  eqv(res.length, 2, 'D3b (mutacja „garnizon +1"): jawna+ukryta liczone, oblegający/obcy właściciel/inny heks pominięte -> dokładnie 2');
  ok(res.some(u => u.id === 'jawna') && res.some(u => u.id === 'ukryta'),
    'D3c: zwrócone jednostki to dokładnie jawna+ukryta (nie przypadkowe 2 z 5)');

  console.log(`D3: ${pass} passed so far, ${fail} failed so far`);
}

async function runSectionD4() {
  console.log('\n-- D4. renderMiastoSection() (esbuild+jsdom, REALNE wykonanie) --');
  let JSDOM;
  try { ({ JSDOM } = require(path.resolve(GRA_DIR, 'node_modules', 'jsdom'))); }
  catch (e) {
    console.error('[empire-panel-miasto-obywatele-content-test] jsdom not found. Run: npm install (from gra/)');
    process.exit(1);
  }

  const ENTRY = path.resolve(__dirname, '.empire-panel-D4-entry.ts');
  const BUNDLE = path.resolve(__dirname, '.empire-panel-D4-bundle.cjs');
  fs.writeFileSync(ENTRY, `export { renderMiastoSection } from '../src/ui/empireDetailPanel';\n`, 'utf8');

  // Ten sam stub co sekcja L empire-miasta-table-test.cjs: JEDYNA przeszkoda Vite w drzewie
  // zależności empireDetailPanel.ts to ./icons/brandAssets (import.meta.glob na poziomie
  // modułu) -- renderMiastoSection go woła (ikonka nagłówka), stub zwraca id jako string.
  const STUB_BRAND_ASSETS_PLUGIN = {
    name: 'stub-brand-assets-D4',
    setup(build) {
      build.onResolve({ filter: /icons\/brandAssets$/ }, (args) => (
        { path: args.path, namespace: 'stub-brand-assets-D4' }
      ));
      build.onLoad({ filter: /.*/, namespace: 'stub-brand-assets-D4' }, () => ({
        contents:
          'export function brandIconSvg(id, size) { return String(id); }\n'
          + 'export function mapResourceIconSvg(label, size) { return String(label); }\n',
        loader: 'js',
      }));
    },
  };

  try {
    await esbuild.build({
      entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
      loader: { '.ts': 'ts', '.json': 'json' },
      plugins: [STUB_BRAND_ASSETS_PLUGIN],
      outfile: BUNDLE, absWorkingDir: GRA_DIR, logLevel: 'silent',
    });
  } catch (e) {
    console.error('[empire-panel-miasto-obywatele-content-test] sekcja D4 esbuild bundling failed:\n', e.message || e);
    process.exit(1);
  }

  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  global.document = dom.window.document;
  global.window = dom.window;

  delete require.cache[require.resolve(BUNDLE)];
  const { renderMiastoSection } = require(BUNDLE);

  // 3 miasta: Roma (kolejka front postep=0 -- brzeg dolny, BEZ murów), Neapolis (kolejka front
  // postep===koszt -- brzeg górny 100%, Z murami+fortem), Ostia (kolejka PUSTA, bez tras).
  const cp = [
    { cityId: 'c1', name: 'Roma', ludki: 5, ludnoscAbsLabel: '500', ludnoscAbsolutna: 500, rekruci: 0, rekruciMax: 0, regenPerTurn: 0 },
    { cityId: 'c2', name: 'Neapolis', ludki: 3, ludnoscAbsLabel: '300', ludnoscAbsolutna: 300, rekruci: 0, rekruciMax: 0, regenPerTurn: 0 },
    { cityId: 'c3', name: 'Ostia', ludki: 1, ludnoscAbsLabel: '100', ludnoscAbsolutna: 100, rekruci: 0, rekruciMax: 0, regenPerTurn: 0 },
  ];
  const ce = [
    {
      pieniadz: 10, pracaPula: 2, pracaBudynki: 1, nauka: 5, buildingGroups: [],
      queue: [{ nazwa: 'Świątynia', koszt: 100, postep: 0 }], queueWstrzymana: false,
      defense: { structBonusPct: 0, hasWalls: false, garnizonCount: 0 },
    },
    {
      pieniadz: 6, pracaPula: 1, pracaBudynki: 0, nauka: 2, buildingGroups: [],
      queue: [{ nazwa: 'Mury', koszt: 50, postep: 50 }], queueWstrzymana: false,
      defense: { structBonusPct: 200, hasWalls: true, garnizonCount: 3 },
    },
    {
      pieniadz: 1, pracaPula: 0, pracaBudynki: 0, nauka: 0, buildingGroups: [],
      queue: [], queueWstrzymana: false,
      defense: { structBonusPct: 0, hasWalls: false, garnizonCount: 0 },
    },
  ];
  // Trasy: Roma 2 (10+5=15), Neapolis 1 (7), Ostia 0 -- plus jedna trasa „widmo" z cityId spoza
  // `cp`/`paired` (symuluje rozjazd danych) -- gdyby regresja N3 wróciła do trade.routes.length,
  // SZLAKI podsumowania pokazałoby 4 zamiast poprawnych 3 (2+1+0).
  // T6 (R-HANDEL-SZLAKI-PRZEBUDOWA-Q1): fixture niesie teraz rozkład dochodu per trasa.
  // Roma = przypadek MIESZANY (r1 z budynkiem +0,5; r2 BEZ budynku) — celowo najtrudniejszy:
  // miasto ma jednocześnie naliczoną premię i trasę, która na budynek dopiero czeka.
  // Neapolis = wyłącznie trasa Z budynkiem (+0,35). Ostia = brak tras (kolumna pusta).
  const trade = {
    routes: [
      { id: 'r1', cityId: 'c1', cityName: 'Roma', partnerCityName: 'X', partnerOwnerLabel: 'Sumerowie', medium: 'lad', dystans: 2, income: 10, budynekOdblokowany: true, premiaBudynku: 0.5 },
      { id: 'r2', cityId: 'c1', cityName: 'Roma', partnerCityName: 'Y', partnerOwnerLabel: 'Rzymianie', medium: 'morze', dystans: 3, income: 5, budynekOdblokowany: false, premiaBudynku: 0 },
      { id: 'r3', cityId: 'c2', cityName: 'Neapolis', partnerCityName: 'Z', partnerOwnerLabel: 'Chińczycy', medium: 'lad', dystans: 1, income: 7, budynekOdblokowany: true, premiaBudynku: 0.35 },
      { id: 'r-widmo', cityId: 'c-ghost', cityName: '???', partnerCityName: 'W', partnerOwnerLabel: 'Harappa', medium: 'lad', dystans: 1, income: 999, budynekOdblokowany: true, premiaBudynku: 49.95 },
    ],
  };
  const e = { nauka: 0 };
  const resources = [];

  const html = renderMiastoSection(ce, cp, e, trade, resources);
  const container = document.createElement('div');
  container.innerHTML = html;

  const minis = container.querySelectorAll('.civ-emp-mini');
  eqv(minis.length, 5, 'D4-0: dokładnie 5 bloków .civ-emp-mini (Wpływy/Kolejka/Obrona/Populacja/Handel) -- kontrola przytomności przed indeksowaniem po pozycji');

  // -- Kolejka produkcji (index 1) -- (c) % postępu na obu brzegach + (d) kolejka pusta --
  const kolejkaRows = minis[1] ? Array.from(minis[1].querySelectorAll('.civ-emp-mini-r')) : [];
  eqv(kolejkaRows.length, 3, 'D4-1: Kolejka -- 3 wiersze miast, bez podsumowania');
  ok(kolejkaRows[0] && kolejkaRows[0].textContent.includes('Świątynia') && kolejkaRows[0].textContent.includes('(0%)'),
    'D4c-dolny-brzeg: Roma (postep=0/100) pokazuje dokładnie „(0%)"');
  ok(kolejkaRows[1] && kolejkaRows[1].textContent.includes('Mury') && kolejkaRows[1].textContent.includes('(100%)'),
    'D4c-gorny-brzeg: Neapolis (postep=50/50) pokazuje dokładnie „(100%)", nie 200%/50%');
  ok(kolejkaRows[2] && kolejkaRows[2].textContent.includes('pusta'),
    'D4d: Ostia (kolejka pusta) pokazuje „pusta" (przypadek brzegowy zadania)');

  // -- Obrona miasta (index 2) -- (e) brak murów vs mury dokładne --
  const obronaRows = minis[2] ? Array.from(minis[2].querySelectorAll('.civ-emp-mini-r')) : [];
  eqv(obronaRows.length, 3, 'D4-2: Obrona -- 3 wiersze miast, bez podsumowania');
  ok(obronaRows[0] && obronaRows[0].textContent.includes('brak murów'),
    'D4e-brak-murow: Roma (structBonusPct=0) pokazuje „brak murów" (przypadek brzegowy zadania)');
  ok(obronaRows[1] && obronaRows[1].textContent.includes('+200%'),
    'D4e-z-murami: Neapolis (structBonusPct=200) pokazuje dokładnie „+200%", nie „+400%" (mutacja „bonus murów ×2" w łańcuchu renderu)');
  ok(obronaRows[1] && obronaRows[1].textContent.includes('3'),
    'D4-garnizon: Neapolis (garnizonCount=3) pokazuje 3 w kolumnie GARNIZON');

  // -- Handel — szlaki per miasto (index 4) -- (a) SZLAKI po paired, (b) DOCHÓD nie podwojony --
  const handelRows = minis[4] ? Array.from(minis[4].querySelectorAll('.civ-emp-mini-r')) : [];
  eqv(handelRows.length, 4, 'D4-3: Handel -- 3 wiersze miast + 1 podsumowanie');
  ok(handelRows[0] && handelRows[0].textContent.includes('+15'),
    'D4b-roma: Roma DOCHÓD = +15 (10+5), nie +30 (mutacja „dochód tras ×2")');
  ok(handelRows[1] && handelRows[1].textContent.includes('+7'),
    'D4b-neapolis: Neapolis DOCHÓD = +7, nie +14');
  const summaryRow = handelRows.find(r => r.classList.contains('civ-emp-mini-summary'));
  ok(summaryRow !== undefined, 'D4-4: wiersz podsumowania Handlu rozpoznany (civ-emp-mini-summary)');
  ok(summaryRow && summaryRow.textContent.includes('3') && !summaryRow.textContent.match(/\b4\b/),
    'D4a (naprawa N3, mutacja „SZLAKI z trade.routes.length"): SZLAKI podsumowania = 3 (2+1+0 po paired), NIE 4 (trasa „widmo" spoza paired wykluczona)');
  ok(summaryRow && summaryRow.textContent.includes('+22'),
    'D4b-suma: DOCHÓD podsumowania = +22 (15+7+0), nie podwojone i nie licząc trasy „widmo" (+999)');

  // -- T6: rozkład dochodu (składnik 5% + „bez budynku") w tej samej tabeli --
  const romaSplit = handelRows[0] ? handelRows[0].querySelector('.civ-emp-route-split') : null;
  ok(romaSplit !== null, 'T6-D4-split-istnieje: wiersz Romy ma drugą linię ze składnikiem 5% (.civ-emp-route-split)');
  ok(romaSplit && romaSplit.textContent.includes('+0,5'),
    'T6-D4-roma-kwota: Roma pokazuje zsumowaną premię 5% swoich tras = +0,5 (r1 z budynkiem), przecinek dziesiętny PL');
  ok(romaSplit && romaSplit.textContent.includes('1 bez budynku'),
    'T6-D4-roma-brak: Roma ma jawnie napisane, że 1 trasa (r2) czeka na budynek — gracz widzi DLACZEGO premia nie jest wyższa');
  ok(romaSplit && romaSplit.className.includes('off'),
    'T6-D4-roma-stan: przy trasie bez budynku linia dostaje wariant „off" (kolor ostrzegawczy), nie „on"');
  ok(romaSplit && (romaSplit.getAttribute('title') || '').length > 0,
    'T6-D4-roma-tooltip: linia niesie pełne wyjaśnienie w title (kolor nigdy nie niesie stanu sam)');

  const neapolisSplit = handelRows[1] ? handelRows[1].querySelector('.civ-emp-route-split') : null;
  ok(neapolisSplit && neapolisSplit.textContent.includes('+0,4') && neapolisSplit.className.includes('on'),
    'T6-D4-neapolis: same trasy z budynkiem -> wariant „on" i kwota +0,4 (0,35 zaokrąglone do 1 miejsca)');
  ok(neapolisSplit && !neapolisSplit.textContent.includes('bez budynku'),
    'T6-D4-neapolis-brak-falszywki: miasto bez tras czekających na budynek NIE dostaje adnotacji „bez budynku"');

  const ostiaSplit = handelRows[2] ? handelRows[2].querySelector('.civ-emp-route-split') : null;
  ok(ostiaSplit === null,
    'T6-D4-ostia: miasto BEZ tras nie dostaje linii rozkładu (nie ma czego rozkładać — pusty wiersz zamiast mylącego „+0 · 5%")');

  const sumSplit = summaryRow ? summaryRow.querySelector('.civ-emp-route-split') : null;
  ok(sumSplit && sumSplit.textContent.includes('+0,9'),
    'T6-D4-suma-kwota: podsumowanie sumuje TE SAME premiaBudynku co wiersze (0,5+0,35+0 = 0,85 -> +0,9), bez trasy „widmo" (+49,95)');
  ok(sumSplit && sumSplit.textContent.includes('1 bez budynku'),
    'T6-D4-suma-brak: podsumowanie liczy trasy czekające na budynek w tym samym zakresie co DOCHÓD (1, nie 2 z widmem)');

  console.log(`D4: ${pass} passed so far, ${fail} failed so far`);
}

(async () => {
  runSectionD1();
  runSectionD2();
  runSectionD3();
  await runSectionD4();

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => {
  console.error('[empire-panel-miasto-obywatele-content-test] unexpected error:', e && e.stack || e);
  process.exit(1);
});
