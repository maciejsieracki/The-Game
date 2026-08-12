'use strict';
/**
 * surowce-katalog-kolejnosc-test.cjs — P-SUROWCE-KOLEJNOSC-KART (Maciej 2026-08-12).
 *
 * Panel Surowców (empireDetailPanel.ts renderSurowceSection) renderuje karty w siatce 2
 * kolumny, wiersz po wierszu, w kolejności tablicy `CATALOG` z main.ts
 * (buildEmpireResourceRows) — `stored.map(resCardHtml).join('')`, bez żadnego sortowania
 * pośredniego. Docelowa kolejność (decyzja właściciela):
 *   W1: Drewno | Kamień          W2: Glina | Cegła         W3: Sól | Ceramika
 *   W4: Ruda (miedzi) | Brąz     W5: Ruda żelaza | Ruda cyny (placeholder)
 *   W6: Żelazo | Stal            W7: Koń | Złoto
 * "Koń" nie był na liście właściciela (nie pasuje do żadnej pary bazowy→przetworzony) —
 * umieszczony celowo TUŻ PRZED Złotem, żeby Złoto zostało ostatnią kartą. "Ruda cyny" NIE
 * istnieje w resources.json — karta placeholder wyszarzona, bez realnych danych.
 *
 * Wzorzec: esbuild-bundle-real-source — CATALOG i resPlaceholderCardHtml są WYCIĘTE z
 * prawdziwych plików (main.ts / empireDetailPanel.ts) i wykonane naprawdę (esbuild
 * transformSync ts->js), nie przepisane ręcznie jako mock — inaczej zmiana w źródle, o
 * której ktoś zapomni zaktualizować tutaj, mogłaby po cichu rozjechać się z tym testem.
 * (main.ts/empireDetailPanel.ts nie bundlują się w całości przez esbuild bez loaderów
 * SVG/audio — patrz CLAUDE.md, znane pre-istniejące porażki map-field-battle-test/
 * pre-battle-save-test — dlatego wycinamy tylko potrzebne fragmenty, ten sam wzorzec co
 * auto-wyzywienie-live-recalc-test.cjs sliceFunctionBody / citizen-resource-upkeep-test.cjs
 * balancedBraceEnd.)
 *
 * Run from gra/: node tools/surowce-katalog-kolejnosc-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[surowce-katalog-kolejnosc-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; } else { fail++; console.error('FAIL:', msg); } }
function eq(a, b, msg) { ok(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

/**
 * Balansuje nawiasy klamrowe/kwadratowe od pozycji OTWIERAJĄCEGO znaku i zwraca indeks
 * TUŻ ZA dopasowanym znakiem zamykającym. Ten sam wzorzec co `balancedBraceEnd` w
 * citizen-resource-upkeep-test.cjs / ai-founding-territory-test.cjs, uogólniony na
 * dowolną parę znaków (żeby obsłużyć też `[`...`]` tablicy CATALOG).
 */
function balancedEnd(src, openIdx, openCh, closeCh) {
  let depth = 0;
  let i = openIdx;
  for (; i < src.length; i++) {
    if (src[i] === openCh) depth++;
    else if (src[i] === closeCh) {
      depth--;
      if (depth === 0) { i++; break; }
    }
  }
  return i;
}

const MAIN_TS = path.join(__dirname, '..', 'src', 'main.ts');
const mainSrc = fs.readFileSync(MAIN_TS, 'utf8');
const PANEL_TS = path.join(__dirname, '..', 'src', 'ui', 'empireDetailPanel.ts');
const panelSrc = fs.readFileSync(PANEL_TS, 'utf8');

// ===========================================================================
// A. main.ts: CATALOG — kolejność REALNA (wycięta i wykonana, nie przepisana ręcznie).
// ===========================================================================
console.log('\n-- A. main.ts: CATALOG kolejność kart --');

const CATALOG_ANCHOR = 'const CATALOG: Cat[] = [';
const catalogAnchorIdx = mainSrc.indexOf(CATALOG_ANCHOR);
ok(catalogAnchorIdx > -1, 'main.ts: kotwica "const CATALOG: Cat[] = [" znaleziona');

let catalog = [];
if (catalogAnchorIdx > -1) {
  const openIdx = catalogAnchorIdx + CATALOG_ANCHOR.length - 1; // wskazuje na sam '['
  const closeIdx = balancedEnd(mainSrc, openIdx, '[', ']'); // tuż za dopasowanym ']'
  const arrLiteral = mainSrc.slice(openIdx, closeIdx);
  const jsCode = esbuild.transformSync(arrLiteral, { loader: 'ts', target: 'node18' }).code;
  catalog = new Function(`return ${jsCode}`)();
}

const EXPECTED_ORDER = [
  'drewno', 'kamien', 'glina', 'cegla', 'sol', 'ceramika',
  'ruda', 'braz', 'ruda_zelaza', 'ruda_cyny', 'zelazo', 'stal',
  'kon', 'zloto',
];

eq(catalog.length, EXPECTED_ORDER.length,
  `CATALOG ma ${EXPECTED_ORDER.length} kart (13 realnych surowców + 1 placeholder „Ruda cyny")`);
eq(JSON.stringify(catalog.map(c => c.id)), JSON.stringify(EXPECTED_ORDER),
  'CATALOG: kolejność id dokładnie wg wskazania właściciela');

const EXPECTED_ROWS = [
  ['drewno', 'kamien'],
  ['glina', 'cegla'],
  ['sol', 'ceramika'],
  ['ruda', 'braz'],
  ['ruda_zelaza', 'ruda_cyny'],
  ['zelazo', 'stal'],
  ['kon', 'zloto'],
];
for (let i = 0; i < EXPECTED_ROWS.length; i++) {
  const [left, right] = EXPECTED_ROWS[i];
  eq(catalog[i * 2] && catalog[i * 2].id, left, `wiersz ${i + 1} (siatka 2 kolumny), lewa karta = ${left}`);
  eq(catalog[i * 2 + 1] && catalog[i * 2 + 1].id, right, `wiersz ${i + 1} (siatka 2 kolumny), prawa karta = ${right}`);
}

eq(catalog.length > 0 && catalog[catalog.length - 1].id, 'zloto', 'Złoto jest OSTATNIĄ kartą katalogu');
eq(catalog.length > 1 && catalog[catalog.length - 2].id, 'kon',
  'Koń jest TUŻ PRZED Złotem (nie było na liście właściciela — decyzja udokumentowana w main.ts)');

const rudaCyny = catalog.find(c => c.id === 'ruda_cyny');
ok(!!rudaCyny, 'CATALOG zawiera wpis ruda_cyny');
ok(!!rudaCyny && rudaCyny.placeholder === true, 'ruda_cyny.placeholder === true');
ok(!!rudaCyny && /wkr.tce/i.test(rudaCyny.label), 'ruda_cyny.label sygnalizuje "wkrótce" (nieaktywny surowiec)');
for (const c of catalog) {
  if (c.id === 'ruda_cyny') continue;
  ok(!c.placeholder, `${c.id}: placeholder NIE ustawiony (tylko ruda_cyny jest placeholderem)`);
}

// resources.json NIE zawiera "Ruda cyny" — to jest zamierzony placeholder, nie zapomniany
// realny surowiec (P-SUROWCE-KOLEJNOSC-KART: zakaz dodawania realnego surowca do danych gry).
const RESOURCES_JSON = path.join(__dirname, '..', 'data', 'resources.json');
const resourcesRaw = fs.readFileSync(RESOURCES_JSON, 'utf8');
ok(!/cyna|cyny/i.test(resourcesRaw),
  'resources.json NIE zawiera "cyna"/"cyny" — Ruda cyny zostaje WYŁĄCZNIE kartą UI placeholder, zgodnie ze zleceniem');

// ===========================================================================
// B. main.ts: buildEmpireResourceRows — brak sortowania po zbudowaniu wierszy (kolejność
//    finalna = kolejność iteracji CATALOG).
// ===========================================================================
console.log('\n-- B. buildEmpireResourceRows: kolejność wierszy = kolejność CATALOG, bez sortowania --');

const FN_ANCHOR = 'function buildEmpireResourceRows(ownerId: number): EmpireResourceRow[] {';
const fnStart = mainSrc.indexOf(FN_ANCHOR);
ok(fnStart > -1, 'main.ts: kotwica "function buildEmpireResourceRows(...)" znaleziona');

let fnBody = '';
if (fnStart > -1) {
  const braceOpenIdx = fnStart + FN_ANCHOR.length - 1; // wskazuje na '{' kończące sygnaturę
  const braceCloseIdx = balancedEnd(mainSrc, braceOpenIdx, '{', '}');
  fnBody = mainSrc.slice(fnStart, braceCloseIdx);
}

ok(/for \(const c of CATALOG\) \{/.test(fnBody),
  'buildEmpireResourceRows: pętla "for (const c of CATALOG)" nadal steruje kolejnością wierszy');
ok(!/rows\.sort\(/.test(fnBody),
  'buildEmpireResourceRows: `rows` NIE jest sortowane po zbudowaniu (kolejność = kolejność iteracji CATALOG)');
ok(!/CATALOG\.sort\(/.test(fnBody),
  'buildEmpireResourceRows: CATALOG NIE jest sortowany przed iteracją');
ok(/return rows;/.test(fnBody),
  'buildEmpireResourceRows: zwraca `rows` bezpośrednio (bez pośredniej transformacji kolejności)');
ok(/if \(c\.placeholder\) \{/.test(fnBody),
  'buildEmpireResourceRows: gałąź `if (c.placeholder)` obecna w pętli (karta Ruda cyny bez realnych danych)');

// ===========================================================================
// C. empireDetailPanel.ts: renderowanie zachowuje kolejność (filter/map, bez sortowania) +
//    gałąź placeholder wpięta w resCardHtml.
// ===========================================================================
console.log('\n-- C. empireDetailPanel.ts: renderowanie zachowuje kolejność + gałąź placeholder --');

ok(panelSrc.includes("const stored = rows.filter(r => r.cap != null);"),
  'renderSurowceSection: "stored = rows.filter(...)" (Array.filter zachowuje kolejność wejściową)');
ok(panelSrc.includes("${stored.map(resCardHtml).join('')}"),
  'renderSurowceSection: karty renderowane przez "stored.map(resCardHtml).join(\'\')" (Array.map zachowuje kolejność)');
ok(!/stored\.sort\(/.test(panelSrc) && !/rows\.sort\(/.test(panelSrc),
  'empireDetailPanel.ts: ani "stored", ani "rows" nie są NIGDZIE sortowane przed renderowaniem');
ok(panelSrc.includes('if (r.placeholder) return resPlaceholderCardHtml(r);'),
  'resCardHtml: gałąź placeholder wpięta PRZED normalnym renderowaniem karty (Ruda cyny nie przechodzi przez realną logikę stock/cap/bar)');

// ===========================================================================
// D. resPlaceholderCardHtml — RUNTIME: prawdziwa funkcja (esc + resPlaceholderCardHtml)
//    wycięta z empireDetailPanel.ts i wykonana z esbuild.transformSync, nie reimplementacja.
// ===========================================================================
console.log('\n-- D. resPlaceholderCardHtml (RUNTIME, esbuild-transpilowana realna funkcja) --');

const ESC_ANCHOR = 'function esc(s: string): string {';
const escStart = panelSrc.indexOf(ESC_ANCHOR);
ok(escStart > -1, 'empireDetailPanel.ts: kotwica "function esc(...)" znaleziona');

const PLACEHOLDER_ANCHOR = 'function resPlaceholderCardHtml(r: EmpireResourceRow): string {';
const phStart = panelSrc.indexOf(PLACEHOLDER_ANCHOR);
ok(phStart > -1, 'empireDetailPanel.ts: kotwica "function resPlaceholderCardHtml(...)" znaleziona');

if (escStart > -1 && phStart > -1) {
  const escBraceIdx = escStart + ESC_ANCHOR.length - 1;
  const escEnd = balancedEnd(panelSrc, escBraceIdx, '{', '}');
  const escSrc = panelSrc.slice(escStart, escEnd);

  const phBraceIdx = phStart + PLACEHOLDER_ANCHOR.length - 1;
  const phEnd = balancedEnd(panelSrc, phBraceIdx, '{', '}');
  const phSrc = panelSrc.slice(phStart, phEnd);

  const combinedTs = `${escSrc}\n${phSrc}\nreturn resPlaceholderCardHtml;`;
  const combinedJs = esbuild.transformSync(combinedTs, { loader: 'ts', target: 'node18' }).code;
  const resPlaceholderCardHtml = new Function(combinedJs)();

  // Dane "realne" celowo różne od zera — dowód, że funkcja placeholder IGNORUJE realne
  // stock/cap/rate i zawsze pokazuje 0/0 (mockRow symuluje "co by było gdyby ktoś podpiął
  // prawdziwe dane" — funkcja i tak musi je zignorować, taki jest kontrakt placeholdera).
  const mockRow = {
    id: 'ruda_cyny', label: 'Ruda cyny — wkrótce', icon: '⛏️',
    stock: 999, ratePerTurn: 999, typ: 'surowy', dostep: true, cap: 999, placeholder: true,
  };
  const html = resPlaceholderCardHtml(mockRow);

  ok(html.includes('placeholder'), 'HTML karty zawiera klasę "placeholder"');
  ok(html.includes('opacity:0.45'), 'HTML karty ma obniżoną opacity (0.45) — wyszarzona/nieaktywna');
  ok(html.includes('<span class="cur">0</span>'),
    'HTML karty pokazuje "0" (stock) mimo mockRow.stock=999 — funkcja ignoruje realne dane, zawsze 0');
  ok(html.includes('<span class="cap">/ 0</span>'),
    'HTML karty pokazuje "/ 0" (cap) mimo mockRow.cap=999 — zawsze 0, karta „0/0"');
  ok(!html.includes('civ-emp-res-bar'), 'HTML karty NIE zawiera paska postępu (civ-emp-res-bar)');
  ok(!html.includes('civ-emp-res-rate'), 'HTML karty NIE zawiera linii tempa/turę (civ-emp-res-rate) — brak realnych danych');
  ok(!html.includes('civ-emp-res-citizen-badge'), 'HTML karty NIE zawiera badge\'a Obywateli (brak realnych danych silnika)');
  ok(html.includes('Ruda cyny'), 'HTML karty zawiera etykietę "Ruda cyny"');
  ok(/wkr.tce/i.test(html), 'HTML karty zawiera "wkrótce" (sygnał nieaktywności)');
}

// ===========================================================================
// E. chip HUD "Surowce" -- placeholder NIE wchodzi do sumy/alertu (Evaluator FAIL, 2026-08-12)
// ===========================================================================
console.log('\n-- E. chip HUD "Surowce" -- wiersz placeholder wyłączony z surowceTotal/resourceAlertCount --');
{
  const FILTER_ANCHOR = 'const storedResourceRows = resourceRows.filter(';
  const filterStart = mainSrc.indexOf(FILTER_ANCHOR);
  ok(filterStart > -1, 'main.ts: kotwica "const storedResourceRows = resourceRows.filter(" znaleziona');
  if (filterStart > -1) {
    const lineEnd = mainSrc.indexOf('\n', filterStart);
    const filterLine = mainSrc.slice(filterStart, lineEnd);
    ok(filterLine.includes('!r.placeholder'),
      'REGRESJA-EVALUATORA: filtr storedResourceRows wyklucza r.placeholder (bez tego placeholder z cap=0/stock=0 wpada jako "surowiec na limicie")');

    // Wycinamy PRAWDZIWY predykat filtra z main.ts (nie przepisujemy ręcznie) i uruchamiamy
    // na fixture: 13 zdrowych wierszy (cap=1000, stock=10, rate=+1 -- wszystkie OK) + 1
    // wiersz placeholder (cap=0, stock=0, ratePerTurn=0, placeholder=true).
    const predicateSrc = filterLine.slice(
      FILTER_ANCHOR.length,
      filterLine.lastIndexOf(')'),
    );
    // predicateSrc to JUŻ pełne wyrażenie strzałkowe "r => ...", więc ewaluujemy je jako
    // wyrażenie (bez owijania w dodatkowy parametr 'r' -- to dawało funkcję zwracającą
    // funkcję zamiast boola, przez co .filter() przepuszczał WSZYSTKO jako "prawdziwe").
    const filterFn = new Function(`return (${predicateSrc});`)();

    const healthyRows = Array.from({ length: 13 }, (_, i) => ({
      id: `res${i}`, cap: 1000, stock: 10, ratePerTurn: 1, placeholder: false,
    }));
    const placeholderRow = { id: 'ruda_cyny', cap: 0, stock: 0, ratePerTurn: 0, placeholder: true };
    const resourceRows = [...healthyRows, placeholderRow];

    const storedResourceRows = resourceRows.filter(filterFn);
    const resourceAlertCount = storedResourceRows.filter(
      r => r.ratePerTurn < 0 || r.stock >= (r.cap ?? Infinity),
    ).length;
    const surowceTotal = storedResourceRows.length;

    eq(surowceTotal, 13, 'surowceTotal == 13 (placeholder NIE liczy się do mianownika chipu, mimo cap!=null)');
    eq(resourceAlertCount, 0, 'resourceAlertCount == 0 (placeholder stock(0)>=cap(0) NIE wywołuje już fałszywego alertu)');
  }
}

console.log(`\nsurowce-katalog-kolejnosc: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
