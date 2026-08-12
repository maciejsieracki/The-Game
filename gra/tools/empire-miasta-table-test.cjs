'use strict';
/**
 * empire-miasta-table-test.cjs — P-SUROWCE-BRAK-SZCZEGOLOW-ZUZYCIA punkt 2 (Maciej 2026-08-12,
 * `dyspozycje/PYTANIA-OTWARTE.md`): tabela „Miasta (osiedla imperium)" w panelu imperium
 * (`empireDetailPanel.ts`, zakładka Miasta/econ-miasta).
 *
 * Run from gra/:  node tools/empire-miasta-table-test.cjs
 *
 * Pokrywa:
 *   A. empireMiastaTable.ts (pure, esbuild-bundlowany naprawdę — bez DOM/SVG/audio w tym
 *      module, w przeciwieństwie do empireDetailPanel.ts, patrz sekcje D/E niżej):
 *      MIASTA_TABLE_COLUMNS (kolejność, MIASTO nie-toggle), visibleMiastaColumns (filtr),
 *      miastaColumnGridTemplate, sumResourceRecords.
 *   B. computeMiastaSummaryRow — INWARIANT zadania punkt (c): suma dla każdej kolumny liczbowej,
 *      ale WZROST to ŚREDNIA, nie suma (dowód liczbowy: sum(rows) !== avg(rows) na tych samych
 *      danych, funkcja zwraca średnią). Skip null (miasta bez danych wzrostu) w mianowniku.
 *   C. empireDetailTypes.ts (source-text — nie da się zbundlować, patrz D): nowe pola
 *      EmpireCityEconRow.utrzymanieSurowcowBudynkow / EmpireCityPoborRow.ludnoscAbsolutna.
 *   D. main.ts (source-text): cityEcon/cityPobor w buildEmpireDetailSnap() threadują te dwa
 *      pola z już policzonych źródeł (_lastPlayerCityEcon / cityManpowerSnapshot) — zero nowego
 *      przeliczenia.
 *   E. empireDetailPanel.ts (source-text — esbuild nie może zbundlować całego pliku, brak
 *      loaderów SVG/audio, patrz CLAUDE.md "znane pre-istniejące porażki" / wzorzec
 *      empire-panel-sliders-always-visible-test.cjs):
 *      (a) checkboxy filtra kolumn nad tabelą + wiring (change -> toggle set -> render()),
 *      (b) kolumna SUROWCE czyta r.surowce (= EmpireCityEconRow.utrzymanieSurowcowBudynkow)
 *          przez formatResourceUpkeepEmpireLine (istniejący formatter, zero duplikatu),
 *      (c) wiersz podsumowania renderowany z computeMiastaSummaryRow, wzrost z
 *          wzrostProcentAvg (NIE sumy).
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[empire-miasta-table-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY_FILE = path.resolve(__dirname, '.empire-miasta-table-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.empire-miasta-table-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export {
  MIASTA_TABLE_COLUMNS,
  visibleMiastaColumns,
  miastaColumnGridTemplate,
  sumResourceRecords,
  computeMiastaSummaryRow,
} from '../src/ui/empireMiastaTable';
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
  console.error('[empire-miasta-table-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE_FILE);

const MAIN_TS = path.join(GRA, 'src', 'main.ts');
const mainSrcRaw = fs.readFileSync(MAIN_TS, 'utf8');
const EMPIRE_TYPES_TS = path.join(GRA, 'src', 'ui', 'empireDetailTypes.ts');
const empireTypesSrcRaw = fs.readFileSync(EMPIRE_TYPES_TS, 'utf8');
const EMPIRE_PANEL_TS = path.join(GRA, 'src', 'ui', 'empireDetailPanel.ts');
const empirePanelSrcRaw = fs.readFileSync(EMPIRE_PANEL_TS, 'utf8');

/** Same naive line-comment strip as resource-usage-breakdown-test.cjs (safe for the same reason:
 *  no `//` occurs inside a string literal relevant to the anchors we search for here). */
function stripLineComments(src) {
  return src
    .split('\n')
    .map((line) => {
      const idx = line.indexOf('//');
      return idx >= 0 ? line.slice(0, idx) : line;
    })
    .join('\n');
}
const mainSrcStripped = stripLineComments(mainSrcRaw);

let passed = 0, failed = 0;
function assert(cond, msg) { if (cond) { passed++; } else { failed++; console.error('FAIL:', msg); } }
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

// ===========================================================================
// A. empireMiastaTable.ts (pure) — kolumny + filtr widoczności (punkt a)
// ===========================================================================
console.log('\n-- A. MIASTA_TABLE_COLUMNS / visibleMiastaColumns / miastaColumnGridTemplate --');
{
  const cols = M.MIASTA_TABLE_COLUMNS;
  eq(cols.length, 8, 'MIASTA_TABLE_COLUMNS ma 8 kolumn (7 dzisiejszych + SUROWCE)');
  eq(cols.map(c => c.id).join(','), 'miasto,obyw,ludnosc,wzrost,praca,pieniadz,zywnosc,surowce',
    'kolejność kolumn = dzisiejszy układ (MIASTO,OBYW.,LUDNOŚĆ,WZROST,PRACA,PIENIĄDZ,ŻYWNOŚĆ) + SUROWCE na końcu, po prawej');
  eq(cols[0].id, 'miasto', 'pierwsza kolumna to MIASTO');
  assert(cols[0].toggle === false, 'MIASTO ma toggle=false -- nie da się jej ukryć (identyfikator wiersza)');
  for (const c of cols.slice(1)) {
    assert(c.toggle === true, `kolumna "${c.id}" ma toggle=true -- wszystkie poza MIASTO są filtrowalne (wymóg punktu a)`);
  }

  // Brak ukrytych -> wszystkie 8 kolumn widoczne, w tej samej kolejności co katalog.
  const noneHidden = M.visibleMiastaColumns(new Set());
  eq(noneHidden.length, 8, 'brak ukrytych kolumn -> wszystkie 8 widoczne');
  eq(noneHidden.map(c => c.id).join(','), cols.map(c => c.id).join(','),
    'visibleMiastaColumns() bez filtra zachowuje dokładnie tę samą kolejność co MIASTA_TABLE_COLUMNS (układ pionowych linii nie zmienia się -- wymóg punktu a)');

  // Ukrycie kilku kolumn -- pozostałe zachowują kolejność względną, MIASTO zawsze zostaje.
  const hidden = new Set(['wzrost', 'zywnosc']);
  const filtered = M.visibleMiastaColumns(hidden);
  eq(filtered.map(c => c.id).join(','), 'miasto,obyw,ludnosc,praca,pieniadz,surowce',
    'ukrycie WZROST i ŻYWNOŚĆ usuwa dokładnie te dwie kolumny, reszta zachowuje kolejność');

  // Próba "ukrycia" MIASTO (id w zbiorze hidden) jest ignorowana -- toggle=false wygrywa.
  const tryHideMiasto = M.visibleMiastaColumns(new Set(['miasto', 'obyw']));
  assert(tryHideMiasto.some(c => c.id === 'miasto'), 'MIASTO zostaje widoczne nawet jeśli jego id trafi do zbioru ukrytych (toggle=false ma pierwszeństwo)');
  assert(!tryHideMiasto.some(c => c.id === 'obyw'), 'OBYW. faktycznie znika, gdy jest w zbiorze ukrytych');

  // Ukrycie wszystkiego co toggle=true -- zostaje tylko MIASTO.
  const allToggleIds = cols.filter(c => c.toggle).map(c => c.id);
  const onlyMiasto = M.visibleMiastaColumns(new Set(allToggleIds));
  eq(onlyMiasto.length, 1, 'ukrycie wszystkich kolumn filtrowalnych zostawia tylko MIASTO (nigdy pustą tabelę)');
  eq(onlyMiasto[0].id, 'miasto', 'jedyna zostająca kolumna to MIASTO');

  // Grid template -- kolejność szerokości zgodna z kolejnością kolumn podanych na wejściu.
  eq(M.miastaColumnGridTemplate(noneHidden), cols.map(c => c.width).join(' '),
    'miastaColumnGridTemplate łączy szerokości (fr) kolumn w tej samej kolejności co lista wejściowa');
  eq(M.miastaColumnGridTemplate(filtered), 'miasto,obyw,ludnosc,praca,pieniadz,surowce'.split(',')
    .map(id => cols.find(c => c.id === id).width).join(' '),
    'grid template po filtrze zawiera TYLKO szerokości widocznych kolumn, w kolejności katalogu');
}

// ===========================================================================
// B. sumResourceRecords -- agregacja kolumny SUROWCE (punkt b i c)
// ===========================================================================
console.log('\n-- B. sumResourceRecords -- suma per-miasto rekordów zużycia surowców --');
{
  const drewnoKamien = { drewno: 2, kamien: 1 };
  const drewnoCeramika = { drewno: 1, ceramika: 3 };
  const sum = M.sumResourceRecords([drewnoKamien, drewnoCeramika, undefined, {}]);
  eq(sum.drewno, 3, 'drewno: 2 (miasto A) + 1 (miasto B) = 3 -- SUMA po miastach, nie inne przeliczenie');
  eq(sum.kamien, 1, 'kamien: tylko miasto A -> 1');
  eq(sum.ceramika, 3, 'ceramika: tylko miasto B -> 3');
  assert(!('zelazo' in sum), 'zelazo: żadne miasto go nie zużywa -> brak klucza (nie 0 jawne)');

  const empty = M.sumResourceRecords([undefined, null, {}]);
  eq(Object.keys(empty).length, 0, 'wszystkie miasta bez zużycia surowców -> rekord pusty, bez crasha');

  // Wejścia NIE są mutowane.
  M.sumResourceRecords([drewnoKamien]);
  eq(drewnoKamien.drewno, 2, 'sumResourceRecords nie mutuje wejściowych rekordów per miasto');
}

// ===========================================================================
// C. computeMiastaSummaryRow -- INWARIANT zadania: WZROST to ŚREDNIA, reszta to SUMA (punkt c)
// ===========================================================================
console.log('\n-- C. computeMiastaSummaryRow -- suma kolumn liczbowych, ŚREDNIA dla WZROST (nie suma) --');
{
  const rows = [
    { obyw: 5, ludnoscAbsolutna: 1000, wzrostProcent: 10, praca: 20, pieniadz: 30, zywnosc: -5, surowce: { drewno: 2 } },
    { obyw: 3, ludnoscAbsolutna: 600, wzrostProcent: 20, praca: 15, pieniadz: -10, zywnosc: 8, surowce: { drewno: 1, kamien: 1 } },
    { obyw: 7, ludnoscAbsolutna: 1400, wzrostProcent: 30, praca: 25, pieniadz: 5, zywnosc: 2, surowce: undefined },
  ];
  const s = M.computeMiastaSummaryRow(rows);

  eq(s.obywTotal, 15, 'OBYW.: 5+3+7=15 -- suma');
  eq(s.ludnoscAbsolutnaTotal, 3000, 'LUDNOŚĆ: 1000+600+1400=3000 -- suma (wartość surowa, nie sklejanie etykiet)');
  eq(s.pracaTotal, 60, 'PRACA: 20+15+25=60 -- suma');
  eq(s.pieniadzTotal, 25, 'PIENIĄDZ: 30-10+5=25 -- suma');
  eq(s.zywnoscTotal, 5, 'ŻYWNOŚĆ: -5+8+2=5 -- suma');
  eq(s.surowceTotal.drewno, 3, 'SUROWCE.drewno: 2+1+0=3 -- suma po miastach');
  eq(s.surowceTotal.kamien, 1, 'SUROWCE.kamien: tylko miasto B -> 1');

  // Rdzeń wymogu (c): WZROST = (10+20+30)/3 = 20, a NIE suma (60). Test wprost odróżnia oba
  // wyniki -- gdyby ktoś podmienił średnią na sumę, ten assert wykryje regres natychmiast.
  const naiveSum = 10 + 20 + 30;
  assert(s.wzrostProcentAvg !== naiveSum, 'kontrola przytomności: średnia (20) != suma (60) na tych danych -- test faktycznie coś sprawdza');
  eq(s.wzrostProcentAvg, 20, 'WZROST: (10+20+30)/3 = 20 -- ŚREDNIA, zaokrąglona jak pojedyncza komórka (Math.round)');

  // Zaokrąglenie średniej (nie ucięcie) -- (10+15)/2 = 12.5 -> 13 (Math.round, tak jak komórka).
  const roundingRows = [
    { obyw: 1, ludnoscAbsolutna: 0, wzrostProcent: 10, praca: 0, pieniadz: 0, zywnosc: 0, surowce: undefined },
    { obyw: 1, ludnoscAbsolutna: 0, wzrostProcent: 15, praca: 0, pieniadz: 0, zywnosc: 0, surowce: undefined },
  ];
  eq(M.computeMiastaSummaryRow(roundingRows).wzrostProcentAvg, 13, 'średnia WZROST zaokrąglana Math.round (12.5 -> 13), tak jak pojedyncza komórka wzrostu');

  // Miasta BEZ danych wzrostu (null, np. przed 1. turą) są WYŁĄCZONE z mianownika średniej,
  // nie liczone jako 0 (co zaniżałoby średnią sztucznie).
  const withNulls = [
    { obyw: 1, ludnoscAbsolutna: 0, wzrostProcent: 40, praca: 0, pieniadz: 0, zywnosc: 0, surowce: undefined },
    { obyw: 1, ludnoscAbsolutna: 0, wzrostProcent: null, praca: 0, pieniadz: 0, zywnosc: 0, surowce: undefined },
  ];
  eq(M.computeMiastaSummaryRow(withNulls).wzrostProcentAvg, 40,
    'miasto z wzrostProcent=null (brak danych) pomijane w mianowniku średniej -- średnia z JEDNEGO miasta (40), nie (40+0)/2=20');

  // Brak jakichkolwiek danych wzrostu -> average null (UI pokazuje "—", nie 0% ani NaN%).
  const allNull = [
    { obyw: 1, ludnoscAbsolutna: 0, wzrostProcent: null, praca: 0, pieniadz: 0, zywnosc: 0, surowce: undefined },
  ];
  eq(M.computeMiastaSummaryRow(allNull).wzrostProcentAvg, null, 'wszystkie miasta bez danych wzrostu -> average null (nie NaN, nie 0)');

  // Pusta tabela (brak miast) -- brak crasha, wszystkie sumy 0, średnia null.
  const empty = M.computeMiastaSummaryRow([]);
  eq(empty.obywTotal, 0, 'pusta tabela: obywTotal 0');
  eq(empty.wzrostProcentAvg, null, 'pusta tabela: wzrostProcentAvg null (brak dzielenia przez zero)');
  eq(Object.keys(empty.surowceTotal).length, 0, 'pusta tabela: surowceTotal pusty rekord');
}

// ===========================================================================
// D. empireDetailTypes.ts -- nowe pola źródłowe (source-text, patrz nagłówek modułu)
// ===========================================================================
console.log('\n-- D. empireDetailTypes.ts: EmpireCityEconRow.utrzymanieSurowcowBudynkow / EmpireCityPoborRow.ludnoscAbsolutna --');
{
  assert(empireTypesSrcRaw.includes('utrzymanieSurowcowBudynkow?: Record<string, number>;'),
    'D1: EmpireCityEconRow deklaruje utrzymanieSurowcowBudynkow (per-miasto, opcjonalne -- brak wpisu przed 1. turą)');
  assert(empireTypesSrcRaw.includes('ludnoscAbsolutna: number;'),
    'D2: EmpireCityPoborRow deklaruje ludnoscAbsolutna (wartość surowa do sumowania w wierszu podsumowania)');

  const econIdx = empireTypesSrcRaw.indexOf('export interface EmpireCityEconRow');
  const poborIdx = empireTypesSrcRaw.indexOf('export interface EmpireCityPoborRow');
  assert(econIdx > -1 && poborIdx > econIdx, 'D3: EmpireCityEconRow zdefiniowane przed EmpireCityPoborRow (kolejność pliku nienaruszona)');
  const econBody = empireTypesSrcRaw.slice(econIdx, poborIdx);
  assert(econBody.includes('utrzymanieSurowcowBudynkow?: Record<string, number>;'),
    'D4: pole utrzymanieSurowcowBudynkow leży WEWNĄTRZ interfejsu EmpireCityEconRow (nie gdzie indziej w pliku)');
}

// ===========================================================================
// E. main.ts -- threadowanie pól z już policzonych źródeł, zero nowego przeliczenia
// ===========================================================================
console.log('\n-- E. main.ts buildEmpireDetailSnap(): cityEcon/cityPobor threadują gotowe liczby --');
{
  assert(
    mainSrcStripped.includes('utrzymanieSurowcowBudynkow: tk?.utrzymanieSurowcowBudynkow,'),
    'E1: cityEcon.utrzymanieSurowcowBudynkow czyta WPROST tk?.utrzymanieSurowcowBudynkow (ten sam `tk` z _lastPlayerCityEcon co utrzymanieBudynkow tuż obok, zero nowego wywołania)',
  );
  assert(
    mainSrcStripped.includes('ludnoscAbsolutna: mp.ludnoscAbsolutna,'),
    'E2: cityPobor.ludnoscAbsolutna czyta WPROST mp.ludnoscAbsolutna (ten sam `mp` z cityManpowerSnapshot co ludnoscAbsLabel tuż obok)',
  );

  // Kotwica: obie linie leżą wewnątrz buildEmpireDetailSnap(), w blokach cityEcon/cityPobor
  // odpowiednio (nie w jakiejś zupełnie innej, niepowiązanej funkcji pliku).
  const fnIdx = mainSrcStripped.indexOf('function buildEmpireDetailSnap(): EmpireDetailSnap {');
  const fnEnd = fnIdx > -1 ? mainSrcStripped.indexOf('\n    }\n', fnIdx) : -1;
  assert(fnIdx > -1, 'E3: kotwica "function buildEmpireDetailSnap()" znaleziona');
  const cityEconIdx = mainSrcStripped.indexOf('const cityEcon = pc.map(c => {', fnIdx);
  const cityPoborIdx = mainSrcStripped.indexOf('const cityPobor = pc.map(c => {', fnIdx);
  assert(cityEconIdx > fnIdx && cityPoborIdx > cityEconIdx, 'E4: cityEcon zdefiniowane przed cityPobor, oba wewnątrz buildEmpireDetailSnap()');
  const cityEconWindow = mainSrcStripped.slice(cityEconIdx, cityPoborIdx);
  assert(cityEconWindow.includes('utrzymanieSurowcowBudynkow: tk?.utrzymanieSurowcowBudynkow,'),
    'E5: utrzymanieSurowcowBudynkow leży w bloku cityEcon.map (nie przypadkiem gdzie indziej w pliku)');
  const cityPoborEndIdx = mainSrcStripped.indexOf('let rekruciMax = 0;', cityPoborIdx);
  const cityPoborWindow = cityPoborEndIdx > cityPoborIdx ? mainSrcStripped.slice(cityPoborIdx, cityPoborEndIdx) : '';
  assert(cityPoborWindow.includes('ludnoscAbsolutna: mp.ludnoscAbsolutna,'),
    'E6: ludnoscAbsolutna leży w bloku cityPobor.map (nie przypadkiem gdzie indziej w pliku)');

  assert(
    mainSrcStripped.includes('function buildingResourceUpkeepForCityId(cityId: string, ownerId: number): Record<string, number> {'),
    'E7: buildingResourceUpkeepForCityId (źródło per-miasto liczby dla utrzymanieSurowcowBudynkow) nadal istnieje w main.ts',
  );
}

// ===========================================================================
// F. empireDetailPanel.ts -- punkt (a) filtr kolumn + wiring
// ===========================================================================
console.log('\n-- F. empireDetailPanel.ts: checkboxy filtra kolumn nad tabelą + wiring --');
{
  assert(
    empirePanelSrcRaw.includes("import {\n  MIASTA_TABLE_COLUMNS,\n  visibleMiastaColumns,\n  miastaColumnGridTemplate,\n  computeMiastaSummaryRow,\n  type MiastaColDef,\n} from './empireMiastaTable';"),
    'F1: empireDetailPanel.ts importuje kanon kolumn/agregacji z empireMiastaTable.ts (nie duplikuje definicji lokalnie)',
  );
  assert(empirePanelSrcRaw.includes('const miastaHiddenCols = new Set<string>();'),
    'F2: stan widoczności kolumn trzymany w module-level Set (trwa między renderami, jak activeSection)');

  const filterFnIdx = empirePanelSrcRaw.indexOf('function cityMiastaColFilterHtml(): string {');
  assert(filterFnIdx > -1, 'F3: cityMiastaColFilterHtml zdefiniowana');
  const filterFnEnd = filterFnIdx > -1 ? empirePanelSrcRaw.indexOf('\n}\n', filterFnIdx) : -1;
  const filterFnBody = (filterFnIdx > -1 && filterFnEnd > filterFnIdx) ? empirePanelSrcRaw.slice(filterFnIdx, filterFnEnd) : '';
  assert(filterFnBody.includes('MIASTA_TABLE_COLUMNS.filter(c => c.toggle)'),
    'F4: checkboxy renderowane TYLKO dla kolumn z toggle=true -- MIASTO nie dostaje checkboxa (zawsze widoczne)');
  assert(filterFnBody.includes('type="checkbox" data-miasta-col='),
    'F5: każdy chip to <input type="checkbox"> z data-miasta-col identyfikującym kolumnę');
  assert(filterFnBody.includes("id=\"civ-emp-miasta-colfilter\""),
    'F6: kontener filtra ma stabilne id (potrzebne do wiring przez document.getElementById, wzorzec emp-handel-split/emp-praca-split)');

  const wireFnIdx = empirePanelSrcRaw.indexOf('function wireMiastaColFilter(): void {');
  assert(wireFnIdx > -1, 'F7: wireMiastaColFilter zdefiniowana');
  const wireFnEnd = wireFnIdx > -1 ? empirePanelSrcRaw.indexOf('\n}\n', wireFnIdx) : -1;
  const wireFnBody = (wireFnIdx > -1 && wireFnEnd > wireFnIdx) ? empirePanelSrcRaw.slice(wireFnIdx, wireFnEnd) : '';
  assert(wireFnBody.includes("document.getElementById('civ-emp-miasta-colfilter')"),
    'F8: wiring znajduje kontener przez ten sam id co F6');
  assert(wireFnBody.includes("addEventListener('change'"),
    'F9: checkboxy nasłuchują "change" (standardowy event dla <input type="checkbox">, wzorzec zgodny z "input" range slajderów obok)');
  assert(wireFnBody.includes('miastaHiddenCols.delete(id)') && wireFnBody.includes('miastaHiddenCols.add(id)'),
    'F10: zaznaczenie -> delete z ukrytych (pokaż), odznaczenie -> add do ukrytych (ukryj)');
  assert(wireFnBody.includes('render();'),
    'F11: zmiana checkboxa wywołuje render() -- natychmiastowe odświeżenie tabeli z nowym zestawem kolumn, ten sam wzorzec re-renderu co reszta panelu');

  assert(empirePanelSrcRaw.includes('queueMicrotask(wireMiastaColFilter);'),
    'F12: wiring podpięty przez queueMicrotask PO zbudowaniu HTML (ten sam wzorzec co wireDefaultHandelSplitInputs/wireDefaultPodzialPracyInputs -- DOM istnieje dopiero po synchronicznym innerHTML=)');
}

// ===========================================================================
// G. empireDetailPanel.ts -- punkt (b) kolumna SUROWCE per miasto
// ===========================================================================
console.log('\n-- G. empireDetailPanel.ts: kolumna SUROWCE czyta EmpireCityEconRow.utrzymanieSurowcowBudynkow --');
{
  assert(empirePanelSrcRaw.includes('surowce: econ?.utrzymanieSurowcowBudynkow,'),
    'G1: wiersz miasta czyta surowce z econ.utrzymanieSurowcowBudynkow (pole wystawione w main.ts, sekcja E) -- NIE przelicza nic samodzielnie w UI');

  const cellFnIdx = empirePanelSrcRaw.indexOf('function miastaCellFor(r: {');
  assert(cellFnIdx > -1, 'G2: miastaCellFor zdefiniowana');
  const cellFnEnd = cellFnIdx > -1 ? empirePanelSrcRaw.indexOf('\n}\n', cellFnIdx) : -1;
  const cellFnBody = (cellFnIdx > -1 && cellFnEnd > cellFnIdx) ? empirePanelSrcRaw.slice(cellFnIdx, cellFnEnd) : '';
  assert(cellFnBody.includes("case 'surowce': return formatResourceUpkeepEmpireLine(r.surowce);"),
    'G3: komórka SUROWCE formatowana przez formatResourceUpkeepEmpireLine -- funkcja JUŻ ISTNIEJĄCA (używana też w bilansie skarbca), nie nowy duplikat formatera');

  assert(
    empirePanelSrcRaw.includes("miasta: cityMiastaMiniDetail(ce, cp, snap.food, e),"),
    'G4: cityMiastaMiniDetail nadal wpięte w detailFor.miasta (wejście do tabeli w render() nienaruszone)',
  );
}

// ===========================================================================
// H. empireDetailPanel.ts -- punkt (c) wiersz podsumowania, WZROST = średnia (nie suma)
// ===========================================================================
console.log('\n-- H. empireDetailPanel.ts: wiersz podsumowania z computeMiastaSummaryRow, wzrost = avg --');
{
  const detailFnIdx = empirePanelSrcRaw.indexOf('function cityMiastaMiniDetail(');
  assert(detailFnIdx > -1, 'H1: cityMiastaMiniDetail zdefiniowana');
  const detailFnEnd = detailFnIdx > -1 ? empirePanelSrcRaw.indexOf('\nfunction cityPoborMiniRekruci(', detailFnIdx) : -1;
  assert(detailFnEnd > detailFnIdx, 'H2: kotwica końcowa (następna funkcja cityPoborMiniRekruci) znaleziona PO cityMiastaMiniDetail');
  const detailFnBody = (detailFnIdx > -1 && detailFnEnd > detailFnIdx) ? empirePanelSrcRaw.slice(detailFnIdx, detailFnEnd) : '';

  assert(detailFnBody.includes('const summary = computeMiastaSummaryRow(rows.map(r => ({'),
    'H3: wiersz podsumowania budowany przez computeMiastaSummaryRow (sekcja C, pure) z tych samych `rows`, co wiersze tabeli powyżej -- nie osobne przeliczenie');
  assert(detailFnBody.includes("case 'wzrost': return summary.wzrostProcentAvg != null"),
    'H4 (rdzeń wymogu -- WZROST to ŚREDNIA nie suma): komórka podsumowania WZROST czyta summary.wzrostProcentAvg, POLE KTÓRE (sekcja C) jest liczone jako średnia, nie summary.wzrostProcentTotal / summary.wzrostProcentSum (takie pole w ogóle nie istnieje w MiastaSummaryRow)');
  assert(!/wzrostProcentTotal|wzrostProcentSum/.test(empirePanelSrcRaw),
    'H5: w całym pliku NIE istnieje żadne pole "suma wzrostu" (wzrostProcentTotal/Sum) -- jedyna dostępna wartość zbiorcza wzrostu to average, wykluczone jest przypadkowe podpięcie sumy');
  assert(detailFnBody.includes("case 'obyw': return String(summary.obywTotal);")
    && detailFnBody.includes('case \'praca\': return signedTxt(summary.pracaTotal);')
    && detailFnBody.includes('case \'pieniadz\': return signedTxt(summary.pieniadzTotal);')
    && detailFnBody.includes('case \'zywnosc\': return signedIntTxt(summary.zywnoscTotal);')
    && detailFnBody.includes('case \'surowce\': return formatResourceUpkeepEmpireLine(summary.surowceTotal);'),
    'H6: pozostałe kolumny (Obyw./Praca/Pieniądz/Żywność/Surowce) podsumowania czytają pola *Total (suma) -- kontrast wprost z wzrostProcentAvg w H4');

  assert(detailFnBody.includes('civ-emp-mini-summary'),
    'H7: wiersz podsumowania ma dedykowaną klasę CSS (wizualnie odróżniony od zwykłych wierszy -- wymóg zadania punkt c)');
  assert(empirePanelSrcRaw.includes('.civ-emp-mini-summary{') && /font-weight:\s*700/.test(empirePanelSrcRaw),
    'H8: .civ-emp-mini-summary ma zdefiniowany styl pogrubienia (odróżnienie wizualne)');

  // Wiersz podsumowania renderowany PO pętli po wierszach miast (na końcu tabeli -- wymóg "na końcu tabeli").
  const rowsLoopIdx = detailFnBody.indexOf('for (const r of rows) {');
  const summaryRowIdx = detailFnBody.indexOf('civ-emp-mini-summary');
  assert(rowsLoopIdx > -1 && summaryRowIdx > rowsLoopIdx,
    'H9: wiersz podsumowania (civ-emp-mini-summary) leży w kodzie PO pętli renderującej wiersze miast -- ląduje na końcu tabeli, nie na początku/w środku');
}

console.log(`\nempire-miasta-table-test: ${passed} passed, ${failed} failed`);
process.exitCode = failed > 0 ? 1 : 0;
