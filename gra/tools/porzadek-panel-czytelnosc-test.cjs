'use strict';
/**
 * porzadek-panel-czytelnosc-test.cjs — P-PORZADEK-PANEL-CZYTELNOSC-ROZBICIE (Maciej 2026-08-12).
 *
 * Run from gra/:  node tools/porzadek-panel-czytelnosc-test.cjs
 *
 * Panel "Porządek" per miasto (Szczęście / Zaopatrzenie obywateli / Prawo / Porządek łącznie,
 * `gra/src/ui/cityPanel.ts`) pokazywał każdy pasek jako jeden zbity ciąg tekstu oddzielony
 * `" · "` (np. "Budynki (+1/budynek): +35 · Kultura: +4 · Religia: +4"), a blok "Zaopatrzenie
 * obywateli" pokazywał stawkę per capita (zawsze ±1) zamiast łącznego zużycia miasta. Właściciel:
 * "za bardzo nadziubdziane i nieczytelne", chce KAŻDY składnik w osobnej linii + realną łączną
 * wartość zużycia (populacja miasta × stawka) + widoczne rozbicie % wkładu Szczęścia/Prawa do
 * Porządku łącznie.
 *
 * Pokrywa:
 *   A. citizenUpkeepDisplayLines (citizen-resource-upkeep.ts) — łączne zużycie miasta
 *      (Math.floor(populacja × CITIZEN_UPKEEP_RATE_PER_CITIZEN)), NIE stawka per capita.
 *   B. orderContributionPct (society-breakdown.ts) — % wkładu Szczęścia/Prawa do PorPct,
 *      zawsze sumujące się do 100.
 *   C-H. cityPanel.ts jako TEKST (wzorem spichlerz-cap-citypanel-wiring-test.cjs /
 *      citizen-resource-upkeep-test.cjs sekcja J — plik nie bundluje się samodzielnie, więc
 *      okna źródła + regex/indexOf zamiast pełnego wykonania): format blokowy (nie
 *      `.join(' · ')`), wiring populacji miasta do bloku Zaopatrzenia, wiring % wkładu do stanu
 *      i do renderowania Porządku łącznie, oraz że `resolveOrderState` NIE gubi tych pól w
 *      gałęzi "werdykt silnika" (fromEngine=true).
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) { console.error('[porzadek-panel-czytelnosc-test] esbuild not found. Run: npm install (from gra/)'); process.exit(1); }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY_FILE = path.resolve(__dirname, '.porzadek-panel-czytelnosc-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.porzadek-panel-czytelnosc-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export {
  citizenUpkeepDisplayLines,
  CITIZEN_UPKEEP_RATE_PER_CITIZEN,
} from '../src/game/citizen-resource-upkeep';
export { orderContributionPct, computePorPct } from '../src/game/society-breakdown';
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
  console.error('[porzadek-panel-czytelnosc-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE_FILE);

let passed = 0, failed = 0;
function assert(cond, msg) { if (cond) { passed++; } else { failed++; console.error('FAIL:', msg); } }
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }
function deepEq(a, b, msg) {
  const sa = JSON.stringify(a);
  const sb = JSON.stringify(b);
  assert(sa === sb, `${msg} (got ${sa}, want ${sb})`);
}

// ===========================================================================
// A. citizenUpkeepDisplayLines — łączna wartość dla MIASTA, nie per capita
// ===========================================================================
console.log('\n-- A. citizenUpkeepDisplayLines -- łączne zużycie miasta (populacja × stawka) --');
{
  eq(M.CITIZEN_UPKEEP_RATE_PER_CITIZEN, 1.0, 'kanon: stawka = 1,0 sztuka surowca / obywatela / turę (ta sama co computeCitizenResourceDrain, PRZYWRÓCONA Maciej 2026-08-13, R-EKONOMIA-SUROWCE-SKALA-5X-Q1)');

  const cov = { available: ['drewno', 'glina'], missing: ['kamien'] };

  // Math.floor(20 * 1,0) = 20 -- wybrane tak, by dawało niezerowy, łatwy do ręcznej weryfikacji wynik.
  const pop20 = M.citizenUpkeepDisplayLines(cov, 20);
  deepEq(
    pop20,
    [
      { key: 'drewno', value: 20, available: true },
      { key: 'glina', value: 20, available: true },
      { key: 'kamien', value: -20, available: false },
    ],
    'populacja=20: wartość = ±Math.floor(populacja × 1,0) = ±20 dla KAŻDEGO surowca, kolejność dostępne->brakujące',
  );

  // Math.floor(35 * 1,0) = 35 -- inna populacja, żeby dowieść skalowania (nie stała).
  const pop35 = M.citizenUpkeepDisplayLines(cov, 35);
  eq(pop35[0].value, 35, 'populacja=35: wartość dostępnego surowca = 35, NIE stały +1 (regresja do stawki per capita)');
  eq(pop35[2].value, -35, 'populacja=35: wartość brakującego surowca = -35, NIE stały -1');
  assert(pop35[0].value !== pop20[0].value, 'wartość SKALUJE SIĘ z populacją miasta (35 ≠ 20) -- dowód że to nie jest stała kary Szczęścia');

  // R-EKONOMIA-SUROWCE-SKALA-5X-Q1 (Maciej 2026-08-13): przy stawce 0,2 (2026-08-12) mała
  // populacja floorowała do zera -- DOKŁADNIE ten problem usuwa powrót do stawki 1,0 (patrz
  // JSDoc modułu citizen-resource-upkeep.ts). Test odwrócony: populacja=1 daje TERAZ
  // niezerowe zapotrzebowanie (Math.floor(1*1,0)=1), nie zero -- dowód że naprawa granulacji
  // faktycznie działa, nie tylko dokumentacja.
  const pop1 = M.citizenUpkeepDisplayLines(cov, 1);
  eq(pop1[0].value, 1, 'populacja=1: Math.floor(1*1,0)=1 -- stawka 1,0 NIE floruje do zera dla populacji ≥1 (naprawiony problem granulacji z ery stawki 0,2)');

  const pop0 = M.citizenUpkeepDisplayLines(cov, 0);
  eq(pop0[0].value, 0, 'populacja=0: zero zapotrzebowania -> wartość 0 (nie crash, nie stała ±1)');
  eq(pop0[2].value, 0, 'populacja=0: brakujący surowiec też 0 (bez fałszywego -1)');

  const popNeg = M.citizenUpkeepDisplayLines(cov, -5);
  eq(popNeg[0].value, 0, 'populacja ujemna (dane śmieciowe) traktowana jak 0 -- zero regresji/crashu, wzorem computeCitizenResourceDrain');
  const popNaN = M.citizenUpkeepDisplayLines(cov, NaN);
  eq(popNaN[0].value, 0, 'populacja NaN traktowana jak 0');

  // Math.floor(34.9) = 34 (obcięcie populacji), potem Math.floor(34 * 1,0) = 34.
  const popFrac = M.citizenUpkeepDisplayLines(cov, 34.9);
  eq(popFrac[0].value, 34, 'populacja ułamkowa ścinana w dół (Math.floor) PRZED przemnożeniem przez stawkę, spójnie z computeCitizenResourceDrain');

  eq(M.citizenUpkeepDisplayLines({ available: [], missing: [] }, 10).length, 0, 'brak wymaganych surowców -> pusta lista wierszy');
}

// ===========================================================================
// B. orderContributionPct — % wkładu Szczęścia/Prawa do Porządku łącznie
// ===========================================================================
console.log('\n-- B. orderContributionPct -- % wkładu Szczęścia/Prawa (sumuje się do 100) --');
{
  // Wagi równe (0.5/0.5), SzPct=80 > PrawPct=20 -> Szczęście "ciągnie" wynik mocniej -> wkład > 50%.
  const a = M.orderContributionPct(80, 20, 0.5, 0.5);
  eq(a.szWkladPct, 80, 'wagi równe, SzPct=80/PrawPct=20 -> wkład Szczęścia = udział wartości ważonej = 80%');
  eq(a.prawWkladPct, 20, 'dopełnienie do 100: wkład Prawa = 20%');
  eq(a.szWkladPct + a.prawWkladPct, 100, 'oba wkłady sumują się do dokładnie 100');

  // Wartości równe (50/50), wagi nierówne (0.7/0.3) -> wkład = same wagi.
  const b = M.orderContributionPct(50, 50, 0.7, 0.3);
  eq(b.szWkladPct, 70, 'SzPct=PrawPct=50, wagi 0.7/0.3 -> wkład Szczęścia = 70% (proporcjonalny do wagi przy równych wartościach)');
  eq(b.prawWkladPct, 30, 'wkład Prawa = 30%');

  // Symetria: zamiana Sz<->Prawo odwraca wkłady.
  const c1 = M.orderContributionPct(90, 30, 0.5, 0.5);
  const c2 = M.orderContributionPct(30, 90, 0.5, 0.5);
  eq(c1.szWkladPct, c2.prawWkladPct, 'symetria: wkład Sz przy (90,30) = wkład Prawa przy (30,90) (te same wagi)');

  // Fallback: oba paski na zero (brak sygnału z wartości) -> podział wg samych wag, nie /0.
  const zero = M.orderContributionPct(0, 0, 0.5, 0.5);
  eq(zero.szWkladPct, 50, 'oba paski = 0 -> fallback do podziału wg wag (0.5/0.5 -> 50/50), brak dzielenia przez zero / NaN');
  eq(zero.prawWkladPct, 50, 'fallback symetryczny dla Prawa');
  assert(Number.isFinite(zero.szWkladPct) && Number.isFinite(zero.prawWkladPct), 'fallback zero/zero nie daje NaN/Infinity');

  const zeroUnequalW = M.orderContributionPct(0, 0, 0.8, 0.2);
  eq(zeroUnequalW.szWkladPct, 80, 'fallback zero/zero z NIERÓWNYMI wagami -> podział wg wag (80/20), nie sztywne 50/50');

  // Spójność z computePorPct: wkład * wynikowy porPct powinien odtworzyć ważoną sumę (przy braku clampu).
  const szPct = 64, prawPct = 40, wSz = 0.6, wPraw = 0.4;
  const porPct = M.computePorPct(szPct, prawPct, { wagaSzczescie: wSz, wagaPrawo: wPraw });
  const wklad = M.orderContributionPct(szPct, prawPct, wSz, wPraw);
  const reconstructed = (wklad.szWkladPct / 100) * porPct + (wklad.prawWkladPct / 100) * porPct;
  assert(Math.abs(reconstructed - porPct) < 0.6, `wkład% zastosowany do porPct odtwarza porPct w granicach zaokrągleń (got ${reconstructed.toFixed(2)}, porPct=${porPct})`);

  // Property: dla wielu losowych-ale-deterministycznych kombinacji, wkłady zawsze sumują się do 100.
  const combos = [
    [10, 90, 0.5, 0.5], [100, 0, 0.3, 0.7], [0, 100, 0.9, 0.1],
    [55, 45, 0.5, 0.5], [1, 1, 0.5, 0.5], [120, 0, 0.5, 0.5],
  ];
  for (const [sz, praw, ws, wp] of combos) {
    const r = M.orderContributionPct(sz, praw, ws, wp);
    eq(r.szWkladPct + r.prawWkladPct, 100, `property: suma wkładów = 100 dla (szPct=${sz}, prawPct=${praw}, wagaSz=${ws}, wagaPraw=${wp})`);
  }
}

// ===========================================================================
// C-H. cityPanel.ts jako TEKST -- format blokowy (nie inline join) + wiring
// (wzorem citizen-resource-upkeep-test.cjs sekcja J / spichlerz-cap-citypanel-wiring-test.cjs
// -- plik nie bundluje się samodzielnie, patrz JSDoc modułu)
// ===========================================================================
console.log('\n-- C-H. cityPanel.ts (tekst): format blokowy + wiring populacji/% wkładu --');
{
  const CITY_PANEL_TS = path.join(GRA, 'src', 'ui', 'cityPanel.ts');
  const src = fs.readFileSync(CITY_PANEL_TS, 'utf8');

  function windowBetween(startMarker, endMarker, fromIdx = 0) {
    const s = src.indexOf(startMarker, fromIdx);
    if (s < 0) return { start: -1, end: -1, body: '' };
    const e = src.indexOf(endMarker, s + startMarker.length);
    if (e < 0) return { start: s, end: -1, body: '' };
    return { start: s, end: e, body: src.slice(s, e) };
  }

  // -------------------------------------------------------------------------
  // C. formatW4InlineBreakdown (dawny join(' · ')) całkowicie usunięty z pliku.
  // -------------------------------------------------------------------------
  // Sprawdzamy KSZTAŁT deklaracji/wywołania, nie goły string -- JSDoc komentarze w kodzie mogą
  // legalnie WSPOMINAĆ starą nazwę jako historyczny kontekst naprawy, to nie jest regresja.
  assert(!src.includes('function formatW4InlineBreakdown('), 'C1: cityPanel.ts NIE zawiera już DEKLARACJI formatW4InlineBreakdown (martwa funkcja usunięta, nie tylko odpięta)');
  assert(!/[^.\w]formatW4InlineBreakdown\(/.test(src), 'C2: cityPanel.ts NIE zawiera już żadnego WYWOŁANIA formatW4InlineBreakdown(...)');

  // -------------------------------------------------------------------------
  // D. appendW4PctMetricBlock -- rozpiska renderuje się BLOKOWO (appendBreakdownLines), nie
  //    przez .join(' · ') w tej funkcji. Ta jedna funkcja obsługuje WSZYSTKIE trzy paski
  //    (Szczęście / Prawo / Porządek łącznie) + blok Zaopatrzenia obywateli -- naprawa w NIEJ
  //    naprawia wszystkie cztery na raz.
  // -------------------------------------------------------------------------
  const w4 = windowBetween('function appendW4PctMetricBlock(', '\nfunction ');
  assert(w4.start > -1, 'D0: znaleziono function appendW4PctMetricBlock(...) w cityPanel.ts');
  assert(w4.end > w4.start, 'D0b: znaleziono koniec appendW4PctMetricBlock (kolejna top-level function)');
  assert(w4.body.includes('appendBreakdownLines(block, lines, emptyHint)'), 'D1: appendW4PctMetricBlock renderuje rozpiskę przez appendBreakdownLines (jeden div/linia na składnik) -- ten sam wzorzec co blok "Zdrowie miasta"');
  assert(!w4.body.includes(".join(' · ')"), "D2 (zabija regresję do inline): appendW4PctMetricBlock NIE zawiera .join(' · ') -- brak zbitego ciągu tekstu");
  assert(!w4.body.includes('civ-w4-inline-breakdown'), 'D3: appendW4PctMetricBlock NIE używa już kontenera civ-w4-inline-breakdown (stary, jednoliniowy kontener)');

  // -------------------------------------------------------------------------
  // E. appendCitizenUpkeepBlock -- przyjmuje cityPopulation i buduje wiersze przez
  //    citizenUpkeepDisplayLines (łączna wartość miasta), NIE przez stare stałe ±1.
  // -------------------------------------------------------------------------
  const cub = windowBetween('function appendCitizenUpkeepBlock(', '\nfunction ');
  assert(cub.start > -1, 'E0: znaleziono function appendCitizenUpkeepBlock(...) w cityPanel.ts');
  assert(/function appendCitizenUpkeepBlock\([^)]*cityPopulation: number[^)]*\): void \{/.test(src.slice(cub.start, cub.start + 200)), 'E1: appendCitizenUpkeepBlock przyjmuje parametr cityPopulation: number');
  assert(cub.body.includes('citizenUpkeepDisplayLines(upkeep, cityPopulation)'), 'E2: appendCitizenUpkeepBlock woła citizenUpkeepDisplayLines(upkeep, cityPopulation) -- łączna wartość dla TEGO miasta');
  assert(!cub.body.includes('CITIZEN_UPKEEP_HAPPINESS_PER_AVAILABLE') && !cub.body.includes('CITIZEN_UPKEEP_HAPPINESS_PER_MISSING'), 'E3 (zabija regresję do per-capita): appendCitizenUpkeepBlock NIE używa już stałych kary Szczęścia (±1) jako wyświetlanej ilości surowca');

  // -------------------------------------------------------------------------
  // F. renderSpoleczenstwo -- wywołanie appendCitizenUpkeepBlock PRZEKAZUJE city.population
  //    (dowód wiringu na realnym call-site, nie tylko że parametr istnieje w sygnaturze).
  // -------------------------------------------------------------------------
  const rs = windowBetween(
    'function renderSpoleczenstwo(mount: HTMLElement, city: City, data: GameData): void {',
    '\nfunction ',
  );
  assert(rs.start > -1, 'F0: znaleziono function renderSpoleczenstwo(...) w cityPanel.ts');
  assert(rs.body.includes('appendCitizenUpkeepBlock(mount, state.citizenUpkeep, city.population)'), 'F1: renderSpoleczenstwo woła appendCitizenUpkeepBlock(mount, state.citizenUpkeep, city.population) -- populacja TEGO miasta, nie imperium');

  // -------------------------------------------------------------------------
  // G. renderSpoleczenstwo -- blok "Porządek łącznie" pokazuje % wkładu Szczęścia i Prawa,
  //    KAŻDY w osobnej linii (dwa oddzielne elementy), nie złączone przez " · ".
  // -------------------------------------------------------------------------
  assert(rs.body.includes('state.szWkladPct'), 'G1: renderSpoleczenstwo czyta state.szWkladPct (rozbicie % wkładu Szczęścia)');
  assert(rs.body.includes('state.prawWkladPct'), 'G2: renderSpoleczenstwo czyta state.prawWkladPct (rozbicie % wkładu Prawa)');
  const szRowMatch = /szRow\.textContent = `Szczęście: \$\{Math\.round\(state\.szWkladPct\)\}% wkładu`/.test(rs.body);
  const prawRowMatch = /prawRow\.textContent = `Prawo: \$\{Math\.round\(state\.prawWkladPct\)\}% wkładu`/.test(rs.body);
  assert(szRowMatch, 'G3: wiersz Szczęścia renderowany jako osobny element (szRow.textContent), format "Szczęście: N% wkładu"');
  assert(prawRowMatch, 'G4: wiersz Prawa renderowany jako osobny element (prawRow.textContent), format "Prawo: N% wkładu"');
  assert(rs.body.includes('wkladBox.appendChild(szRow)') && rs.body.includes('wkladBox.appendChild(prawRow)'), 'G5: oba wiersze dołączone jako OSOBNE dzieci DOM (appendChild ×2) -- blokowo, nie jeden string złączony');
  assert(!/wkładu[^`"]*·[^`"]*wkładu/.test(rs.body), "G6 (zabija regresję do inline): brak wzorca łączącego OBA wkłady jednym ciągiem przez '·' w tym samym literale");

  // -------------------------------------------------------------------------
  // H. computeOrderStateLocal -- liczy orderContributionPct i zapisuje wynik do stanu (nie tylko
  //    liczy i odrzuca). resolveOrderState -- gałąź "werdykt silnika" (fromEngine=true) NIE gubi
  //    tych pól (ten sam wzorzec co dla porPct/prawPct, patrz komentarz w pliku o dokładnie tej
  //    klasie regresji: nadpisanie tylko części pól przy scaleniu z `live`).
  // -------------------------------------------------------------------------
  const cos = windowBetween(
    'function computeOrderStateLocal(city: City, data: GameData): { state: OrderState; fromEngine: boolean } {',
    '\nfunction ',
  );
  assert(cos.start > -1, 'H0: znaleziono function computeOrderStateLocal(...) w cityPanel.ts');
  assert(cos.body.includes('orderContributionPct(ordPct.sz.szPct, ordPct.prawo.prawPct, ordPct.wagaSz, ordPct.wagaPraw)'), 'H1: computeOrderStateLocal woła orderContributionPct z DOKŁADNIE tych samych sz/prawPct i wag, co reszta stanu (spójność z paskami wyżej)');
  assert(/szWkladPct:\s*wklad\.szWkladPct/.test(cos.body), 'H2: computeOrderStateLocal zapisuje szWkladPct do zwracanego stanu');
  assert(/prawWkladPct:\s*wklad\.prawWkladPct/.test(cos.body), 'H3: computeOrderStateLocal zapisuje prawWkladPct do zwracanego stanu');

  const ros = windowBetween(
    'function resolveOrderState(city: City, data: GameData): { state: OrderState; fromEngine: boolean } {',
    '\nfunction ',
  );
  assert(ros.start > -1, 'H4: znaleziono function resolveOrderState(...) w cityPanel.ts');
  assert(
    /szWkladPct:\s*computed\.state\.szWkladPct/.test(ros.body) && /prawWkladPct:\s*computed\.state\.prawWkladPct/.test(ros.body),
    'H5 (zabija regresję "gałąź silnika gubi % wkładu"): resolveOrderState w gałęzi live (fromEngine=true) jawnie przenosi szWkladPct/prawWkladPct z computed.state -- inaczej `...live` nadpisałby je na undefined, bo silnik (main.ts) tych pól nie liczy',
  );

  // -------------------------------------------------------------------------
  // I. FIX (Evaluator FAIL, 2026-08-12): -0 w gałęzi "missing" renderował się jako zielone "+0"
  //    (dostępny) zamiast czerwone "brakujący", bo appendBreakdownLines klasyfikował status
  //    wyłącznie po znaku value (`value >= 0`), a `-0 >= 0` jest w JS PRAWDĄ. Przy stawce
  //    0,2 (stan na 2026-08-12) populacja miasta 1-4 (Math.floor(pop*0,2)===0) była normalną
  //    sytuacją na starcie KAŻDEJ rozgrywki; PO R-EKONOMIA-SUROWCE-SKALA-5X-Q1 (2026-08-13,
  //    stawka wróciła do 1,0) ten konkretny wyzwalacz już nie zachodzi dla populacji ≥1 --
  //    -0 nadal MOŻE wystąpić przy populacji dokładnie 0 (floor(0×1,0)=0), więc test poniżej
  //    (wejścia syntetyczne, nie liczone z realnej populacji) zostaje w pełni zasadny.
  //    Naprawa: BreakdownLine.neg (opcjonalny), appendCitizenUpkeepBlock przekazuje
  //    neg: !l.available jawnie zamiast polegać na znaku.
  // -------------------------------------------------------------------------
  const abl = windowBetween('function appendBreakdownLines(', '\nfunction ');
  assert(abl.start > -1, 'I0: znaleziono function appendBreakdownLines(...) w cityPanel.ts');
  assert(
    abl.body.includes('const isNeg = l.neg === true || l.value < 0;'),
    'I1: appendBreakdownLines klasyfikuje status przez l.neg (jawny), z fallbackiem na l.value < 0 -- NIE l.value >= 0 (który myli -0 z "dostępny")',
  );
  assert(
    !/el\('div', l\.value >= 0 \? 'pos' : 'neg'\)/.test(abl.body),
    "I2 (zabija regresję -0): appendBreakdownLines NIE klasyfikuje już wyłącznie po `l.value >= 0`",
  );

  assert(
    cub.body.includes('neg: !l.available'),
    'I3: appendCitizenUpkeepBlock przekazuje neg: !l.available (status z silnika, nie ze znaku wartości)',
  );

  // Dowód wykonaniem: wycięta REALNA klasyfikacja z appendBreakdownLines, uruchomiona na
  // dokładnie tym wejściu, które łamało poprzednią wersję (-0, populacja miasta = 1).
  const isNegFnSrc = abl.body.match(/const isNeg = l\.neg === true \|\| l\.value < 0;/);
  assert(isNegFnSrc, 'I4: kotwica wycięcia realnej klasyfikacji znaleziona (do uruchomienia poniżej)');
  if (isNegFnSrc) {
    const classify = new Function('l', `const isNeg = l.neg === true || l.value < 0; return isNeg;`);
    assert(classify({ value: -0, neg: true }) === true, 'I5: value=-0, neg=true (surowiec brakujący, populacja mała) -> klasyfikowany jako "neg" (czerwony)');
    assert(classify({ value: -0, neg: false }) === false, 'I6: value=-0, neg=false (surowiec dostępny mimo -0) -> klasyfikowany jako "pos" (zielony) -- neg ma pierwszeństwo przed znakiem');
    assert(classify({ value: -7 }) === true, 'I7: brak neg, value ujemne -> nadal "neg" (fallback zachowany dla innych wołających appendBreakdownLines)');
    assert(classify({ value: 4 }) === false, 'I8: brak neg, value dodatnie -> nadal "pos" (fallback zachowany)');
  }

  // -------------------------------------------------------------------------
  // I9-I12 (Evaluator, 2026-08-12): kolor (I1-I8 wyżej) naprawiony wcześniej (3b851610),
  // ale SAM TEKST liczby w czerwonym wierszu nadal czytał się "+0" dla -0 -- `l.value >= 0`
  // jest w JS PRAWDĄ dla -0, więc znak "+" trafiał do wiersza status "brak" (przy stawce 0,2
  // ówczesną normalną sytuacją była populacja miasta 1-4, `Math.floor(pop*0,2)===0`; po
  // R-EKONOMIA-SUROWCE-SKALA-5X-Q1 2026-08-13 -- populacja dokładnie 0). Naprawa: `showAsZero = isNeg &&
  // Math.abs(l.value) === 0` -- gdy true, tekst to "0" bez znaku (ani + ani -0); dla
  // zwykłych wartości (dodatnich i ujemnych różnych od zera) formuła nie zmienia wyniku.
  // Dowód wykonaniem: wycięta REALNA formuła tekstu z appendBreakdownLines, uruchomiona
  // na tych samych klasach wejść co I5-I8 (neg + zero, zwykły dodatni, zwykły ujemny).
  // -------------------------------------------------------------------------
  const textFormulaMatch = abl.body.match(
    /const showAsZero = isNeg && Math\.abs\(l\.value\) === 0;\s*\n\s*row\.textContent = `\$\{l\.label\}: \$\{showAsZero \? '0' : `\$\{l\.value >= 0 \? '\+' : ''\}\$\{l\.value\}`\}`;/,
  );
  assert(!!textFormulaMatch, 'I9: appendBreakdownLines zawiera formułę tekstu sprzęgniętą z isNeg/showAsZero (nie goły `l.value >= 0 ? "+" : ""` bez świadomości -0)');
  if (textFormulaMatch) {
    const renderText = new Function('l', `
      const isNeg = l.neg === true || l.value < 0;
      const showAsZero = isNeg && Math.abs(l.value) === 0;
      return \`\${l.label}: \${showAsZero ? '0' : \`\${l.value >= 0 ? '+' : ''}\${l.value}\`}\`;
    `);
    eq(renderText({ label: 'Kamień', value: -0, neg: true }), 'Kamień: 0', 'I10: value=-0, neg=true (brakujący surowiec, populacja 1-4) -> tekst "Kamień: 0" BEZ znaku + i BEZ "-0" (naprawiony bug Evaluatora)');
    eq(renderText({ label: 'Drewno', value: 5, neg: false }), 'Drewno: +5', 'I11: value=5, neg=false (zwykły dodatni) -> tekst "Drewno: +5" (bez regresji)');
    eq(renderText({ label: 'Glina', value: -5, neg: true }), 'Glina: -5', 'I12: value=-5, neg=true (zwykły ujemny) -> tekst "Glina: -5" (bez regresji)');
  }

  // -------------------------------------------------------------------------
  // J. appendBreakdownLines -- WYKONANIE na REALNYM kodzie ze shim-em DOM
  // (Evaluator M2, 2026-08-12): sekcja D wyżej pinuje TYLKO WOŁAJĄCEGO
  // (appendW4PctMetricBlock faktycznie woła appendBreakdownLines), a sekcja I
  // wyżej pinuje TYLKO klasyfikację/tekst POJEDYNCZEJ linii (isNeg,
  // showAsZero) -- ale NIC nie pinowało samego ROZBICIA BLOKOWEGO: czy
  // składniki lądują w OSOBNYCH elementach DOM, czy sklejone w JEDEN div
  // przez ' · '. Dowód Evaluatora: mutacja "cofnij rozbicie blokowe, sklej
  // wszystkie składniki w JEDEN div (np. box.textContent =
  // lines.map(...).join(' · ') zamiast pętli z box.appendChild(row))"
  // przechodziła 67/67 bez żadnej czerwonej asercji.
  //
  // Metoda: WYCINAMY realne źródło appendBreakdownLines z cityPanel.ts (ten
  // sam `abl.body`, którego już używa sekcja I) -- NIE kopiujemy założonej
  // wersji z pamięci. cityPanel.ts NIE bundluje się samodzielnie (patrz JSDoc
  // modułu na górze tego pliku), więc zamiast pełnego modułu transpilujemy
  // WYCIĘTY fragment przez esbuild (loader 'ts', ten sam pakiet, którego cały
  // ten plik używa do budowy bundla A/B) i wykonujemy go przez `new Function`
  // z minimalnym shim-em DOM (odpowiednik `el()` z cityPanel.ts:
  // className/appendChild/textContent) -- ten sam wzorzec ekstrakcji +
  // wykonania co sekcja I (tam bez shimu DOM, bo klasyfikacja jest
  // bezstanowa; tu appendBreakdownLines realnie buduje drzewo DOM, więc shim
  // MUSI je odwzorować).
  // EN: cuts the REAL source of appendBreakdownLines out of cityPanel.ts (the
  // same abl.body section I already uses), transpiles it with esbuild (TS ->
  // JS) since cityPanel.ts does not bundle standalone, and executes it via
  // `new Function` against a minimal DOM shim -- proving the block-per-item
  // DOM structure on today's actual implementation, not an assumed copy.
  // -------------------------------------------------------------------------
  function makeShimEl(tag, cls) {
    return {
      tagName: tag,
      className: cls,
      children: [],
      _text: '',
      appendChild(child) { this.children.push(child); },
      set textContent(v) { this._text = v; },
      get textContent() { return this._text; },
    };
  }

  let appendBreakdownLinesReal = null;
  try {
    const transpiled = esbuild.transformSync(abl.body, { loader: 'ts' }).code;
    const factory = new Function('el', `${transpiled}\nreturn appendBreakdownLines;`);
    appendBreakdownLinesReal = factory(makeShimEl);
  } catch (e) {
    assert(false, `J0: ekstrakcja + transpilacja + instancjacja appendBreakdownLines z cityPanel.ts nie powiodła się (${e && e.message ? e.message : e})`);
  }

  if (appendBreakdownLinesReal) {
    const mount = makeShimEl('div', 'mount-stub');
    const lines3 = [
      { label: 'Budynki', value: 5 },
      { label: 'Kultura', value: -3 },
      { label: 'Religia', value: 2 },
    ];
    appendBreakdownLinesReal(mount, lines3, 'brak');

    eq(mount.children.length, 1, 'J1: appendBreakdownLines dołącza DOKŁADNIE JEDEN kontener (.or-lines) do mount');
    const box = mount.children[0];
    if (box) {
      eq(
        box.children.length,
        lines3.length,
        `J2 (zabija regresję do sklejenia, dowód wykonaniem realnego kodu): kontener wynikowy ma ${lines3.length} elementy-dzieci -- RÓWNO liczbie składników (3), NIE 1 sklejony div (mutacja "cofnij rozbicie blokowe" daje tu box.children.length=0, bo box.textContent zamiast box.appendChild(row) na linię)`,
      );
      for (let i = 0; i < box.children.length; i++) {
        const childText = box.children[i].textContent || '';
        assert(!childText.includes('·'), `J3.${i}: pojedynczy element-dziecko "${childText}" NIE zawiera znaku '·' łączącego wiele składników w jednym tekście`);
      }
      const texts = box.children.map((c) => c.textContent);
      deepEq(texts, ['Budynki: +5', 'Kultura: -3', 'Religia: +2'], 'J4: każdy składnik trafił do WŁASNEGO elementu z poprawnym tekstem, w kolejności wejściowej (dowód wykonaniem, nie tylko obecności wzorca w źródle)');
    }

    // J5: liczba elementów SKALUJE SIĘ z liczbą składników (5 wejść -> 5 elementów),
    // nie jest to przypadek "akurat 3 = 3".
    const mount5 = makeShimEl('div', 'mount-stub-5');
    const lines5 = [
      { label: 'A', value: 1 }, { label: 'B', value: 2 }, { label: 'C', value: 3 },
      { label: 'D', value: 4 }, { label: 'E', value: 5 },
    ];
    appendBreakdownLinesReal(mount5, lines5, 'brak');
    eq(mount5.children[0].children.length, 5, 'J5: 5 składników wejściowych -> 5 elementów-dzieci (skalowanie z wejściem, nie stała liczba)');
  }
}

// ===========================================================================
// K. orderContributionPct -- prawWkladPct PINOWANY jako dopełnienie, nie
// osobna formuła (Evaluator M8, 2026-08-12)
// ===========================================================================
// Sekcja B wyżej sprawdza WIELOKROTNIE "szWkladPct + prawWkladPct === 100" --
// ale skoro implementacja liczy `prawWkladPct = 100 - szWkladPct`, KAŻDA taka
// asercja jest TOŻSAMOŚCIOWO prawdziwa niezależnie od poprawności obliczeń
// (dopełnienie do 100 zawsze sumuje się do 100, nawet gdyby szWkladPct był
// policzony źle) -- nie testuje NICZEGO. Dowód Evaluatora: mutacja "policz
// oba wkłady OSOBNO z zaokrągleniem" (np. Math.round(sz) i Math.round(100-sz)
// zamienione na dwa NIEZALEŻNE Math.round z osobnych formuł) przechodziła
// 67/67, mimo że dla niektórych par wejściowych daje sumę != 100 (np.
// 42+57=99, przykład Evaluatora).
//
// Dwie NIEZALEŻNE linie obrony:
//   K0-K2: PIN ŹRÓDŁOWY -- ciało funkcji orderContributionPct (society-
//     breakdown.ts) zawiera DOSŁOWNIE `prawWkladPct: 100 - szWkladPct` w OBU
//     gałęziach (total>0 i fallback total<=0), NIE osobną formułę z
//     Math.round zastosowanym do weightedPraw/wPrawSafe.
//   K3-K6: DOWÓD WYKONANIEM na KONKRETNEJ parze wejściowej, gdzie granica
//     zaokrąglenia .5 rozjeżdża naiwną (niezależną) implementację od
//     dzisiejszej: sz=3, praw=5, wagaSz=wagaPraw=0.5 -> wartość ważona przed
//     zaokrągleniem to 37,5%/62,5% (weightedSz=1.5, weightedPraw=2.5,
//     total=4.0). Dzisiejsza (zależna) implementacja: szWkladPct=
//     Math.round(37.5)=38, prawWkladPct=100-38=62 (suma=100, zweryfikowane
//     numerycznie poza tym plikiem). NAIWNA niezależna dałaby tu
//     prawWkladPct=Math.round(62.5)=63 (suma=101) -- ta konkretna para
//     RÓŻNICUJE obie implementacje (w przeciwieństwie do kombinacji w
//     sekcji B, gdzie żadna nie trafia w granicę .5 i naiwna wersja też
//     przechodzi przez przypadek).
// ===========================================================================
console.log('\n-- K. orderContributionPct -- prawWkladPct PINOWANY jako dopełnienie (nie osobna formuła) --');
{
  const SOC_BREAKDOWN_TS = path.join(GRA, 'src', 'game', 'society-breakdown.ts');
  const socSrc = fs.readFileSync(SOC_BREAKDOWN_TS, 'utf8');

  function windowBetweenSrc(text, startMarker, endMarker, fromIdx = 0) {
    const s = text.indexOf(startMarker, fromIdx);
    if (s < 0) return { start: -1, end: -1, body: '' };
    const e = text.indexOf(endMarker, s + startMarker.length);
    if (e < 0) return { start: s, end: -1, body: '' };
    return { start: s, end: e, body: text.slice(s, e) };
  }

  const ocp = windowBetweenSrc(socSrc, 'export function orderContributionPct(', '\nexport function ');
  assert(ocp.start > -1, 'K0: znaleziono function orderContributionPct(...) w society-breakdown.ts');

  const dependentOccurrences = (ocp.body.match(/prawWkladPct:\s*100\s*-\s*szWkladPct/g) || []).length;
  eq(dependentOccurrences, 2, 'K1: `prawWkladPct: 100 - szWkladPct` występuje w OBU gałęziach (total>0 i fallback total<=0) -- zawsze dopełnienie, nigdy osobna formuła');
  assert(
    !/prawWkladPct:\s*Math\.round/.test(ocp.body),
    'K2 (zabija regresję do niezależnego zaokrąglenia): ciało funkcji NIE przypisuje prawWkladPct z WŁASNEGO Math.round -- musi być dopełnieniem szWkladPct',
  );

  // K3-K6: dowód wykonaniem na realnej, zbundlowanej funkcji (M z sekcji A/B
  // wyżej), na granicy zaokrąglenia .5 (sz=3, praw=5, wagi 0.5/0.5).
  const edge = M.orderContributionPct(3, 5, 0.5, 0.5);
  eq(edge.szWkladPct, 38, 'K3: sz=3,praw=5,wagi=0.5/0.5 -> ważona wartość przed zaokrągleniem 37,5% -> Math.round(37.5)=38');
  eq(edge.prawWkladPct, 62, 'K4: DZISIEJSZA implementacja daje prawWkladPct=62 (dopełnienie 100-38), NIE Math.round(62.5)=63 (dowód że to dopełnienie, nie osobna formuła)');
  eq(edge.szWkladPct + edge.prawWkladPct, 100, 'K5: suma = 100 na granicy zaokrąglenia .5 -- dzięki dopełnieniu, nie przypadkiem');

  const naiveIndependentPraw = Math.round(62.5);
  assert(
    naiveIndependentPraw !== edge.prawWkladPct,
    `K6 (dowód że ta para RÓŻNICUJE mutację): naiwne NIEZALEŻNE zaokrąglenie Math.round(62.5)=${naiveIndependentPraw} != dzisiejsze prawWkladPct=${edge.prawWkladPct} -- mutacja "policz osobno" zmieniłaby wynik na tym wejściu, więc K3/K4 realnie łapią regresję`,
  );
}

console.log(`\nporzadek-panel-czytelnosc-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY_FILE); } catch (e) { /* noop */ }
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) { /* noop */ }
process.exit(failed > 0 ? 1 : 0);
