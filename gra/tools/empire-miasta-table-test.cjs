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
 *   M. P-PANEL-MIASTA-VS-SPICHLERZ-WZROST-ROZJAZD-Q1 = B (Maciej 2026-08-16, esbuild+jsdom,
 *      REALNE wykonanie, ten sam wzorzec co sekcja L): wiersz ŚREDNIA/SUMA tabeli Miasta liczy
 *      WZROST EFEKTYWNIE (miasto głodujące -- `nakarmione === false` -- liczy się jako 0%, ta
 *      sama konwencja co Spichlerz), NIE nominalnie. Odtwarza dokładnie przykład z rejestru:
 *      3 miasta po 6%, 2 głodujące -> ŚREDNIA = round((6+0+0)/3) = 2%, NIE 6% (naiwna nominalna
 *      średnia). Osobno potwierdza, że komórki PER-MIASTO w tej samej tabeli zostają nominalne
 *      (6% dla każdego miasta, głodującego też) -- ECHO B dotyczy WYŁĄCZNIE wiersza sumarycznego.
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

// ===========================================================================
// L. REALNE wykonanie (esbuild+jsdom): filtr kolumn faktycznie zmienia liczbę komórek W KAŻDYM
//    wierszu (nie tylko w nagłówku, mutacja M2) i w wierszu podsumowania (mutacja M7) --
//    Evaluator FAIL na 89c16ec1, zadanie 3: sekcje A-K wyżej dopasowują WYŁĄCZNIE tekst źródła,
//    nie wykonanie, więc oba mutanty (M2: desync nagłówek/wiersze; M7: podsumowanie ignoruje
//    filtr, osierocone komórki) uciekały. Bundluje empireDetailPanel.ts NAPRAWDĘ (ten sam stub
//    brandAssets co resource-usage-breakdown-test.cjs -- jedyna przeszkoda Vite w drzewie
//    zależności, patrz komentarz tam), renderuje tabelę do jsdom, symuluje odznaczenie
//    checkboxów przez PRAWDZIWY wireMiastaColFilter() (change event -> miastaHiddenCols ->
//    render() no-op bo root===null poza pełnym panelem -- patrz guard na początku render() w
//    empireDetailPanel.ts), po czym renderuje DRUGI RAZ (cityMiastaMiniDetail czyta zmutowany
//    stan modułu miastaHiddenCols) i liczy realne <div> dzieci KAŻDEGO .civ-emp-mini-r
//    (wiersze miast + wiersz podsumowania) w zrenderowanym DOM.
// ===========================================================================
async function runSectionL() {
  console.log('\n-- L. cityMiastaMiniDetail + wireMiastaColFilter (esbuild+jsdom, REALNE wykonanie) --');
  let JSDOM;
  try { ({ JSDOM } = require(path.resolve(GRA, 'node_modules', 'jsdom'))); }
  catch (e) {
    console.error('[empire-miasta-table-test] jsdom not found. Run: npm install (from gra/)');
    process.exit(1);
  }

  const L_ENTRY_FILE = path.resolve(__dirname, '.empire-miasta-table-L-entry.ts');
  const L_BUNDLE_FILE = path.resolve(__dirname, '.empire-miasta-table-L-bundle.cjs');
  fs.writeFileSync(L_ENTRY_FILE, `
export {
  cityMiastaMiniDetail,
  wireMiastaColFilter,
} from '../src/ui/empireDetailPanel';
`, 'utf8');

  // Ten sam stub co resource-usage-breakdown-test.cjs: JEDYNA przeszkoda Vite w drzewie
  // zależności empireDetailPanel.ts to ./icons/brandAssets (import.meta.glob na poziomie
  // modułu) -- funkcje pod testem go nie wołają, ale moduły ES wykonują CAŁY top-level kod
  // przy imporcie, więc bez stuba require(bundle) rzuciłby wyjątkiem wcześniej.
  const L_STUB_BRAND_ASSETS_PLUGIN = {
    name: 'stub-brand-assets-L',
    setup(build) {
      build.onResolve({ filter: /icons\/brandAssets$/ }, (args) => (
        { path: args.path, namespace: 'stub-brand-assets-L' }
      ));
      build.onLoad({ filter: /.*/, namespace: 'stub-brand-assets-L' }, () => ({
        contents:
          'export function brandIconSvg(id, size) { return String(id); }\n'
          + 'export function mapResourceIconSvg(label, size) { return String(label); }\n',
        loader: 'js',
      }));
    },
  };

  // esbuild rzuca "Cannot use plugins in synchronous API calls" dla buildSync -- ta sekcja
  // (jedyna w tym pliku z pluginem) musi użyć asynchronicznego build().
  try {
    await esbuild.build({
      entryPoints: [L_ENTRY_FILE],
      bundle: true,
      platform: 'node',
      format: 'cjs',
      target: 'node18',
      loader: { '.ts': 'ts', '.json': 'json' },
      plugins: [L_STUB_BRAND_ASSETS_PLUGIN],
      outfile: L_BUNDLE_FILE,
      absWorkingDir: GRA,
      logLevel: 'silent',
    });
  } catch (e) {
    console.error('[empire-miasta-table-test] sekcja L esbuild bundling failed:\n', e.message || e);
    process.exit(1);
  }

  const dom = new JSDOM('<!doctype html><html><body></body></html>');
  global.document = dom.window.document;
  global.window = dom.window;

  delete require.cache[require.resolve(L_BUNDLE_FILE)];
  const L = require(L_BUNDLE_FILE);

  // Dwa miasta z TĄ SAMĄ nazwą "Roma" (naturalny skutek podboju -- captureCity() zachowuje
  // nazwę zdobytego miasta, patrz naprawa F2/join-po-indeksie) + trzecie miasto z inną nazwą --
  // 3 wiersze, wystarczające do odróżnienia "tylko nagłówek zmienia się" od "wszystkie wiersze".
  const ceL = [
    { name: 'Roma', pieniadz: 10, pracaPula: 2, pracaBudynki: 1, nauka: 1, utrzymanieSurowcowBudynkow: { drewno: 2 } },
    { name: 'Roma', pieniadz: 5, pracaPula: 1, pracaBudynki: 0, nauka: 0, utrzymanieSurowcowBudynkow: { kamien: 1 } },
    { name: 'Neapolis', pieniadz: 3, pracaPula: 1, pracaBudynki: 1, nauka: 0, utrzymanieSurowcowBudynkow: undefined },
  ];
  const cpL = [
    { cityId: 'c1', name: 'Roma', ludki: 5, ludnoscAbsLabel: '500', ludnoscAbsolutna: 500, rekruci: 2, rekruciMax: 10, regenPerTurn: 1 },
    { cityId: 'c2', name: 'Roma', ludki: 3, ludnoscAbsLabel: '300', ludnoscAbsolutna: 300, rekruci: 1, rekruciMax: 8, regenPerTurn: 1 },
    { cityId: 'c3', name: 'Neapolis', ludki: 2, ludnoscAbsLabel: '200', ludnoscAbsolutna: 200, rekruci: 1, rekruciMax: 6, regenPerTurn: 1 },
  ];
  const foodL = {
    zapasy: 100, maxCap: 200,
    perCityRows: [
      { cityId: 'c1', name: 'Roma', produkcja: 10, kosztRacji: 5, bilans: 5, wzrostProcent: 10 },
      { cityId: 'c2', name: 'Roma', produkcja: 8, kosztRacji: 3, bilans: 5, wzrostProcent: 20 },
      { cityId: 'c3', name: 'Neapolis', produkcja: 6, kosztRacji: 4, bilans: 2, wzrostProcent: 5 },
    ],
  };
  const eL = { osiedla: 3, ludnoscRate: 4 };

  const container = document.createElement('div');
  document.body.appendChild(container);

  // Render #1 -- stan domyślny (nic ukryte) -- wpina checkboxy do jsdom przez PRAWDZIWY
  // wireMiastaColFilter(), żeby móc je realnie odznaczyć (nie manipulować stanem modułu z boku).
  container.innerHTML = L.cityMiastaMiniDetail(ceL, cpL, foodL, eL);
  L.wireMiastaColFilter();

  const EXPECTED_TOTAL = container.querySelectorAll('.civ-emp-mini-h > *').length;
  assert(EXPECTED_TOTAL > 3, `L0: nagłówek startowy ma >3 komórek (${EXPECTED_TOTAL}) -- kontrola przytomności, dane testowe faktycznie renderują tabelę`);

  const HIDE_IDS = ['wzrost', 'zywnosc', 'surowce']; // 3 z 7 kolumn filtrowalnych (sekcja A)
  let toggled = 0;
  for (const id of HIDE_IDS) {
    const inp = container.querySelector(`input[data-miasta-col="${id}"]`);
    assert(inp !== null, `L1.${id}: checkbox dla kolumny "${id}" istnieje w DOM po render #1 (wireMiastaColFilter go znalazł)`);
    if (inp) {
      inp.checked = false;
      inp.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
      toggled++;
    }
  }
  eq(toggled, HIDE_IDS.length, 'L2: wszystkie 3 checkboxy realnie odznaczone i zdarzenie "change" wysłane -- PRAWDZIWY wireMiastaColFilter, nie wywołanie funkcji z pominięciem DOM');

  // Render #2 -- odczytuje ZMIENIONY stan modułu (miastaHiddenCols zmutowany przez handler
  // change powyżej, TRWAŁY między wywołaniami cityMiastaMiniDetail -- to jest "wyrenderuj
  // tabelę z odznaczonymi kolumnami" z zadania 3, nie symulacja przez ręczne budowanie HTML).
  const html2 = L.cityMiastaMiniDetail(ceL, cpL, foodL, eL);
  container.innerHTML = html2;

  const EXPECTED_VISIBLE = EXPECTED_TOTAL - HIDE_IDS.length;
  const headerCells = container.querySelectorAll('.civ-emp-mini-h > *').length;
  eq(headerCells, EXPECTED_VISIBLE, `L3: nagłówek ma ${EXPECTED_VISIBLE} komórek po odznaczeniu ${HIDE_IDS.length} kolumn (to już dziś działa -- kontrola przytomności przed L4/L5)`);

  const allRowEls = Array.from(container.querySelectorAll('.civ-emp-mini-r'));
  eq(allRowEls.length, cpL.length + 1, `L4: ${cpL.length} wierszy miast + 1 wiersz podsumowania = ${cpL.length + 1} elementów .civ-emp-mini-r w DOM`);

  // Rdzeń zadania 3 -- ASERCJE WYKONANIOWE (1): KAŻDY wiersz miasta (nie tylko nagłówek, patrz
  // L3) ma dokładnie EXPECTED_VISIBLE komórek. Mutacja M2 (Evaluator: desync filtr
  // nagłówka/wiersze -- nagłówek filtruje, wiersze nie) zostawiłaby tu 8 komórek zamiast 5.
  let summaryCount = 0;
  allRowEls.forEach((rowEl, i) => {
    const isSummary = rowEl.classList.contains('civ-emp-mini-summary');
    const cellCount = rowEl.children.length;
    if (isSummary) {
      summaryCount++;
      // Rdzeń zadania 3 -- ASERCJE WYKONANIOWE (2): wiersz PODSUMOWANIA też ma dokładnie
      // EXPECTED_VISIBLE komórek. Mutacja M7 (Evaluator: podsumowanie ignoruje filtr) zostawiłaby
      // tu osierocone komórki bez odpowiadającego nagłówka (8 zamiast 5).
      eq(cellCount, EXPECTED_VISIBLE,
        `L6 (mutacja M7): wiersz PODSUMOWANIA ma ${EXPECTED_VISIBLE} komórek po filtrze -- nie osierocone wartości bez nagłówka`);
    } else {
      eq(cellCount, EXPECTED_VISIBLE,
        `L5.${i} (mutacja M2): wiersz miasta #${i} ma ${EXPECTED_VISIBLE} komórek po filtrze -- desync nagłówek/wiersze by tu uciekł`);
    }
  });
  eq(summaryCount, 1, 'L7: dokładnie jeden wiersz podsumowania rozpoznany w DOM (civ-emp-mini-summary)');
}

// ===========================================================================
// M. REALNE wykonanie (esbuild+jsdom) -- P-PANEL-MIASTA-VS-SPICHLERZ-WZROST-ROZJAZD-Q1 = B
//    (Maciej 2026-08-16): wiersz ŚREDNIA tabeli Miasta liczy WZROST EFEKTYWNIE (miasto
//    głodujące = 0%), dokładnie odtwarzając przykład z rejestru: 3 miasta po 6%, 2 głodujące
//    -> ŚREDNIA 2%, NIE 6%. Świeży require (cache wyczyszczony) tego samego L_BUNDLE_FILE co
//    sekcja L -- moduł startuje z PUSTYM miastaHiddenCols, niezależnie od checkboxów
//    odznaczonych przez sekcję L wyżej (moduł-level stan by inaczej przeciekł między sekcjami).
// ===========================================================================
async function runSectionM() {
  console.log('\n-- M. cityMiastaMiniDetail -- WZROST wiersza ŚREDNIA liczony EFEKTYWNIE (ECHO B) --');

  // Tak samo jak sekcja L -- ten sam bundle plik (już zbudowany przez runSectionL powyżej,
  // ta sama ścieżka wyliczona lokalnie bo L_BUNDLE_FILE żyje w zasięgu runSectionL).
  const M_BUNDLE_FILE = path.resolve(__dirname, '.empire-miasta-table-L-bundle.cjs');
  delete require.cache[require.resolve(M_BUNDLE_FILE)];
  const M = require(M_BUNDLE_FILE);

  // Przykład z rejestru dosłownie: 3 miasta, każde NOMINALNIE 6% wzrostu, 2 z nich głodujące
  // (`nakarmione: false`) -- ten sam warunek co Spichlerz (`nakarmione === false`).
  const ceM = [
    { name: 'Miasto A', pieniadz: 0, pracaPula: 0, pracaBudynki: 0, nauka: 0, utrzymanieSurowcowBudynkow: undefined },
    { name: 'Miasto B', pieniadz: 0, pracaPula: 0, pracaBudynki: 0, nauka: 0, utrzymanieSurowcowBudynkow: undefined },
    { name: 'Miasto C', pieniadz: 0, pracaPula: 0, pracaBudynki: 0, nauka: 0, utrzymanieSurowcowBudynkow: undefined },
  ];
  const cpM = [
    { cityId: 'm1', name: 'Miasto A', ludki: 1, ludnoscAbsLabel: '100', ludnoscAbsolutna: 100, rekruci: 0, rekruciMax: 0, regenPerTurn: 0 },
    { cityId: 'm2', name: 'Miasto B', ludki: 1, ludnoscAbsLabel: '100', ludnoscAbsolutna: 100, rekruci: 0, rekruciMax: 0, regenPerTurn: 0 },
    { cityId: 'm3', name: 'Miasto C', ludki: 1, ludnoscAbsLabel: '100', ludnoscAbsolutna: 100, rekruci: 0, rekruciMax: 0, regenPerTurn: 0 },
  ];
  const foodM = {
    zapasy: 100, maxCap: 200,
    perCityRows: [
      { cityId: 'm1', name: 'Miasto A', produkcja: 10, kosztRacji: 5, bilans: 5, wzrostProcent: 6, nakarmione: true },
      { cityId: 'm2', name: 'Miasto B', produkcja: 10, kosztRacji: 5, bilans: -2, wzrostProcent: 6, nakarmione: false },
      { cityId: 'm3', name: 'Miasto C', produkcja: 10, kosztRacji: 5, bilans: -2, wzrostProcent: 6, nakarmione: false },
    ],
  };
  const eM = { osiedla: 3, ludnoscRate: 2 };

  const containerM = document.createElement('div');
  document.body.appendChild(containerM);
  containerM.innerHTML = M.cityMiastaMiniDetail(ceM, cpM, foodM, eM);

  const allRowsM = Array.from(containerM.querySelectorAll('.civ-emp-mini-r'));
  const summaryRowM = allRowsM.find(el => el.classList.contains('civ-emp-mini-summary'));
  const cityRowsM = allRowsM.filter(el => !el.classList.contains('civ-emp-mini-summary'));
  assert(summaryRowM !== undefined, 'M1: wiersz podsumowania (civ-emp-mini-summary) znaleziony w renderze scenariusza z rejestru');
  eq(cityRowsM.length, 3, 'M2: trzy wiersze miast wyrenderowane dla scenariusza z rejestru');

  // Kolumna WZROST to indeks 3 wśród kolumn widocznych domyślnie: MIASTO(0), OBYW.(1),
  // LUDNOŚĆ(2), WZROST(3) -- brak ukrytych kolumn (świeży moduł, sekcja A potwierdza tę
  // kolejność dla MIASTA_TABLE_COLUMNS).
  const WZROST_COL_IDX = 3;

  // Rdzeń naprawy: komórki PER-MIASTO (nawet głodujących) pozostają NOMINALNE -- ECHO B
  // dotyczy WYŁĄCZNIE wiersza sumarycznego, nie tych komórek.
  cityRowsM.forEach((rowEl, i) => {
    const txt = rowEl.children[WZROST_COL_IDX] ? rowEl.children[WZROST_COL_IDX].textContent : null;
    eq(txt, '6%', `M3.${i}: komórka WZROST per-miasto pozostaje NOMINALNA (6%) niezależnie od głodu miasta -- ECHO B dotyczy tylko wiersza ŚREDNIA, nie komórek per-miasto tej samej tabeli`);
  });

  // Rdzeń naprawy: ŚREDNIA EFEKTYWNA = round((6+0+0)/3) = 2%, NIE naiwna nominalna 6%.
  const wzrostCellM = summaryRowM ? summaryRowM.children[WZROST_COL_IDX] : null;
  const wzrostTxtM = wzrostCellM ? wzrostCellM.textContent : null;
  assert(wzrostTxtM !== '6%', 'M4: kontrola przytomności -- ŚREDNIA NIE jest już starą nominalną wartością 6% (gdyby naprawa nie zadziałała, ten assert by to złapał)');
  eq(wzrostTxtM, '2%', 'M5 (rdzeń ECHO B): wiersz ŚREDNIA w zakładce Miasta = round((6+0+0)/3) = 2% -- EFEKTYWNIE, głodujące miasta liczone jako 0%, dokładnie jak przykład z rejestru (P-PANEL-MIASTA-VS-SPICHLERZ-WZROST-ROZJAZD)');
}

runSectionL()
  .then(() => runSectionM())
  .then(() => {
    console.log(`\nempire-miasta-table-test: ${passed} passed, ${failed} failed`);
    process.exitCode = failed > 0 ? 1 : 0;
  }).catch((e) => {
    console.error('[empire-miasta-table-test] sekcja L/M unexpected error:', e && e.stack || e);
    process.exitCode = 1;
  });
