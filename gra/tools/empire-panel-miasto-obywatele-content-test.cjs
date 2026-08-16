'use strict';
/**
 * empire-panel-miasto-obywatele-content-test.cjs — P-PANEL-MIASTO-OBYWATELE-TRESC-NIEPELNA
 * (Maciej 2026-08-16, ECHO A: dociągnięcie brakujących pozycji zatwierdzonych list Miasto (8)/
 * Obywatele (9), R-DESIGN-11-ZAKLADEK Q2=B).
 *
 * Run: cd gra && node tools/empire-panel-miasto-obywatele-content-test.cjs
 *
 * `empireDetailPanel.ts` NIE da się esbuild-zbundlować w tym repo (importuje SVG/audio bez
 * loaderów w esbuild CJS — patrz CLAUDE.md „znane pre-istniejące porażki" i wzorzec sekcji E/L
 * `empire-miasta-table-test.cjs`), więc ten test — jak jego poprzednicy — sprawdza źródło-tekst
 * (`indexOf`/regex na surowym pliku), z granicami wycinków (start funkcji → koniec funkcji), nie
 * gołym `includes()` gdziekolwiek w pliku, żeby nie łapać przypadkowych trafień w innych sekcjach.
 *
 * Pokrywa:
 *   A. empireDetailTypes.ts — nowe pola/typy (EmpireCityBuildingGroupRow, EmpireCityQueueItemRow,
 *      EmpireCityDefenseRow, EmpireCityEconRow.{buildingGroups,queue,queueWstrzymana,defense},
 *      EmpireCityPoborRow.{zdrowieBuildingCount,prawoAdminBuildingCount,prawoPct,poziomRacji,
 *      racjaGrowthPct}, EmpireTradeRouteRow.cityId, EmpireHappinessSourceRow/EmpireHappinessSnap,
 *      EmpireDetailSnap.happiness).
 *   B. main.ts buildEmpireDetailSnap() — GROUNDING: cada nowe pole liczone z ISTNIEJĄCEJ funkcji
 *      silnika (groupBuiltBuildingIds/cityProd/structureDefenseBonusFor/unitsOnCityHexForLaw/
 *      cityOrderState/getCityRationLevel/rationGrowthPercent), nie wymyślone od zera.
 *   C. empireDetailPanel.ts — renderMiastoSection/renderObywateleSection renderują 4+4 nowe
 *      podsekcje (Budynki/Kolejka produkcji/Obrona miasta/Handel per miasto; Zdrowie/Prawo i
 *      administracja/Wyżywienie/rozbicie Zadowolenia), sygnatura renderObywateleSection przyjmuje
 *      `happiness`, i call site przekazuje `snap.happiness`.
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
}

ok(typesSrc.includes('happiness: EmpireHappinessSnap;'), 'EmpireDetailSnap.happiness: EmpireHappinessSnap');

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

ok(fnBody.includes('const happinessAgg = new Map<string, { label: string; value: number }>();'),
  'happiness: agregacja przez Map (suma po id), nie wymyślone wartości');
ok(fnBody.includes('if (!ord?.szLines) continue;'),
  'happiness: iteruje TYLKO miasta z policzonym cityOrderState.szLines (silnik), pomija brakujące');
ok(fnBody.includes('for (const line of ord.szLines) {'),
  'happiness: źródła = cityOrderState.szLines (society-breakdown.ts computeHappinessBreakdown) — TA SAMA rozpiska co panel miasta');
ok(fnBody.includes('happinessHasData = true;'),
  'happiness.hasData sygnalizuje T0 (przed 1. turą) zamiast fałszywego zera');
ok(fnBody.includes('happiness,'),
  'buildEmpireDetailSnap() zwraca pole happiness w obiekcie wynikowym');

// Trade route cityId — poza buildEmpireDetailSnap() (osobna funkcja buildEmpireTradeSnap).
ok(mainSrc.includes('cityId: r.fromCityId,') && mainSrc.includes('cityName: myCity?.name ?? r.fromCityId,'),
  'buildEmpireTradeSnap(): EmpireTradeRouteRow.cityId = r.fromCityId (TradeRoute), obok cityName istniejącego');

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

// -- Call site: snap.happiness przekazany do renderObywateleSection --
ok(panelSrc.includes('renderObywateleSection(ce, cp, e, p, k, snap.religion, snap.resources, snap.happiness);'),
  'call site: renderObywateleSection() wywołane z snap.happiness jako ostatnim argumentem');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
