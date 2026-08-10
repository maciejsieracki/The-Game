'use strict';
/**
 * auto-wyzywienie-bilans-clamp-test.cjs — P-AUTO-WYZYWIENIE-PODWOJNY-BLAD, Bug #2
 *
 * Kontekst: panel miasta pokazywał "Auto Wyżywienie WŁ" a mimo to wiersz "Bilans"
 * w gra/src/ui/cityPanel.ts liczył z SUROWEGO (nieprzyciętego) city.poziomRacji, podczas
 * gdy suwak/etykieta wzrostu OBOK niego w tym samym panelu już liczyły z PRZYCIĘTEGO
 * poziomu (Math.min(poziomRacji, maxSafe), maxSafe = cfg.getMaxSafePoziomRacji(cityId) —
 * limit Spichlerza). Wynik: dwie liczby w tym samym panelu, licząc z różnych poziomów
 * Wyżywienia, jedna gorsza niż druga -- mimo że silnik i tak auto-koryguje realny poziom
 * do maxSafe na koniec tury (Spichlerz >= 0).
 *
 * Naprawa: `cityFoodSplit(view, maxSafe)` w cityPanel.ts przyjmuje teraz opcjonalny
 * `maxSafe` i -- gdy `view.poziomRacji` go przekracza -- przelicza koszt racji do
 * PRZYCIĘTEGO poziomu (koszt jest liniowy w poziomie, więc skalowanie proporcją daje
 * identyczny wynik co pełne przeliczenie przez computeCityRationCost, bez potrzeby
 * przekazywania tu rationParams/spichlerzState). 6 z 7 wywołań cityFoodSplit(view)
 * w cityPanel.ts zostało zaktualizowanych, żeby przekazywać maxSafe. Wyjątek:
 * `cityGrowthLive` (gorąca ścieżka renderu mapy) świadomie NIE przekazuje maxSafe --
 * liczenie go tam (pełny previewCityEconomy x13 poziomów, bez memoizacji) byłoby
 * prawie zawsze wyrzucaną pracą (Evaluator, poprawka nr 2).
 *
 * Naprawiono też błąd zaokrąglenia IEEE-754: kolejność mnożenia/dzielenia w
 * przeliczeniu proporcją musi być mnożenie PRZED dzieleniem (nawias wymuszający
 * dzielenie najpierw zaniżał wynik o 1 w realnych przypadkach, np. 3,5/5 nie jest
 * reprezentowalne binarnie -- Evaluator, poprawka nr 1).
 *
 * Ten test wykonuje NAPRAWDĘ ciało funkcji cityFoodSplit wycięte z bieżącego źródła
 * cityPanel.ts (nie reimplementację-kopię, która mogłaby się rozjechać z realnym kodem),
 * więc odtwarza dokładnie to samo zachowanie, które zobaczy gracz w panelu.
 *
 * node tools/auto-wyzywienie-bilans-clamp-test.cjs
 */
const fs = require('fs');
const path = require('path');

const CITY_PANEL_TS = path.join(__dirname, '..', 'src', 'ui', 'cityPanel.ts');
const src = fs.readFileSync(CITY_PANEL_TS, 'utf8');

let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; }
  else { fail++; console.error('FAIL:', label); }
}

// ---------------------------------------------------------------------------
// Wytnij ciało cityFoodSplit(...) licząc głębokość klamer od otwierającej klamry
// sygnatury funkcji -- odporne na zawartość (if-blok wewnątrz), w odróżnieniu od
// wyszukiwania kolejnego "\nfunction " (kruche przy dopiskach komentarzy).
// ---------------------------------------------------------------------------
const sigMarker = 'function cityFoodSplit(view: CityView, maxSafe?: number)';
const sigIdx = src.indexOf(sigMarker);
ok(sigIdx >= 0, 'znaleziono sygnaturę cityFoodSplit(view: CityView, maxSafe?: number) w cityPanel.ts');

let fnBody = '';
if (sigIdx >= 0) {
  // Sygnatura ma adnotację typu zwracanego z WŁASNYMI klamrami ("): { total: ... } {"),
  // więc pierwsza "{" po sigIdx należy do typu, nie do ciała funkcji. Ciało zaczyna się
  // od OSTATNIEJ "{" w linii sygnatury (linia zawsze kończy się " {" przed nową linią).
  const sigLineEnd = src.indexOf('\n', sigIdx);
  const braceOpen = src.lastIndexOf('{', sigLineEnd);
  ok(braceOpen > sigIdx, 'znaleziono otwierającą klamrę CIAŁA cityFoodSplit(...) (ostatnia "{" w linii sygnatury)');
  let depth = 0;
  let bodyStart = -1;
  let bodyEnd = -1;
  for (let i = braceOpen; i < src.length; i++) {
    const ch = src[i];
    if (ch === '{') {
      depth++;
      if (depth === 1) bodyStart = i + 1;
    } else if (ch === '}') {
      depth--;
      if (depth === 0) { bodyEnd = i; break; }
    }
  }
  ok(bodyStart >= 0 && bodyEnd > bodyStart, 'wycięto ciało cityFoodSplit(...) licząc głębokość klamer');
  fnBody = bodyStart >= 0 && bodyEnd > bodyStart ? src.slice(bodyStart, bodyEnd) : '';
}

// Uruchamiamy REALNE ciało funkcji ze źródła (nie kopię-reimplementację).
let cityFoodSplit = null;
try {
  // eslint-disable-next-line no-new-func
  cityFoodSplit = new Function('view', 'maxSafe', fnBody);
  ok(typeof cityFoodSplit === 'function', 'ciało cityFoodSplit(...) skompilowało się jako funkcja JS wykonywalna');
} catch (e) {
  ok(false, `ciało cityFoodSplit(...) skompilowało się jako funkcja JS wykonywalna -- błąd: ${e.message}`);
}

function view(poziomRacji, zywnoscBrutto, kosztRacji) {
  const bilansLokalny = zywnoscBrutto - kosztRacji;
  return { poziomRacji, zywnoscBrutto, kosztRacji, bilansLokalny };
}

if (cityFoodSplit) {
  // -------------------------------------------------------------------------
  // 1) Bez maxSafe (parametr pominięty) -- zachowanie identyczne jak PRZED naprawą
  //    (żaden istniejący caller, który nie przekazuje maxSafe, nie ma się zmienić).
  // -------------------------------------------------------------------------
  {
    const v = view(2, 11, 4); // poziom 2, produkcja 11, koszt 4 -> bilans 7
    const r = cityFoodSplit(v, undefined);
    ok(r.total === 7 && r.racje === 4 && r.produkcja === 11 && r.clamped === false,
      `brak maxSafe -- zachowanie niezmienione (got ${JSON.stringify(r)})`);
  }

  // -------------------------------------------------------------------------
  // 2) maxSafe DOKŁADNIE równy poziomRacji -- brak przycięcia (`<` ścisłe, nie `<=`).
  // -------------------------------------------------------------------------
  {
    const v = view(3, 20, 9);
    const r = cityFoodSplit(v, 3);
    ok(r.clamped === false && r.total === 11 && r.racje === 9,
      `maxSafe == poziomRacji -- brak przycięcia (got ${JSON.stringify(r)})`);
  }

  // -------------------------------------------------------------------------
  // 3) maxSafe > poziomRacji (limit ma zapas) -- brak przycięcia.
  // -------------------------------------------------------------------------
  {
    const v = view(2, 10, 4);
    const r = cityFoodSplit(v, 6);
    ok(r.clamped === false && r.total === 6 && r.racje === 4,
      `maxSafe > poziomRacji -- brak przycięcia (got ${JSON.stringify(r)})`);
  }

  // -------------------------------------------------------------------------
  // 4) REPRO zgłoszenia Macieja: populacja 6, produkcja 11, poziomRacji=1 -> koszt
  //    racji silnika 12 -> bilansLokalny RAW = -1 (to właśnie ta liczba straszyła
  //    w panelu obok "Auto Wyżywienie WŁ"). Miasto ma limit Spichlerza maxSafe=0.5
  //    (suwak by pokazał poziom 0,5, nie 1). Bilans MUSI liczyć z przyciętego 0,5,
  //    nie z surowego 1 -- inaczej to dokładnie regres zgłoszonego buga.
  // -------------------------------------------------------------------------
  {
    const v = view(1, 11, 12); // bilansLokalny RAW = -1 (stary, buggy wynik)
    const r = cityFoodSplit(v, 0.5);
    ok(r.clamped === true, `REPRO Macieja: clamped=true gdy poziomRacji(1) > maxSafe(0.5) (got ${JSON.stringify(r)})`);
    // koszt liniowy: 12 * (0.5/1) = 6 -> bilans = 11 - 6 = 5 (NIE -1).
    ok(r.racje === 6, `REPRO Macieja: racje przeliczone do przyciętego poziomu 0,5 -> 6 (got ${r.racje})`);
    ok(r.total === 5, `REPRO Macieja: total NIE pokazuje już -1 (stary bug), tylko 5 (got ${r.total})`);
    ok(r.total !== Math.round(v.bilansLokalny),
      `REPRO Macieja: total (${r.total}) różni się od surowego bilansLokalny (${Math.round(v.bilansLokalny)}) -- dowód, że naprawa faktycznie zmienia wynik`);
  }

  // -------------------------------------------------------------------------
  // 5) Brzeg: poziomRacji === 0 -- zero nigdy nie jest "przycinane" (dzielenie przez
  //    poziomRacji byłoby dzieleniem przez zero) -- musi zwrócić surowe wartości bez NaN.
  // -------------------------------------------------------------------------
  {
    const v = view(0, 5, 0);
    const r = cityFoodSplit(v, 0);
    ok(r.clamped === false, `poziomRacji=0 -- clamped zawsze false (got ${JSON.stringify(r)})`);
    ok(!Number.isNaN(r.total) && !Number.isNaN(r.racje), `poziomRacji=0 -- brak NaN (got ${JSON.stringify(r)})`);
    ok(r.total === 5 && r.racje === 0, `poziomRacji=0 -- wartości surowe bez zmian (got ${JSON.stringify(r)})`);
  }

  // -------------------------------------------------------------------------
  // 6) Brzeg: maxSafe === 0 przy poziomRacji > 0 (pełne przycięcie do zera) -- koszt
  //    racji spada do 0, bilans = cała produkcja brutto, bez NaN/Infinity.
  // -------------------------------------------------------------------------
  {
    const v = view(2, 8, 6);
    const r = cityFoodSplit(v, 0);
    ok(r.clamped === true, `maxSafe=0, poziomRacji>0 -- clamped=true (got ${JSON.stringify(r)})`);
    ok(r.racje === 0 && r.total === 8, `maxSafe=0 -- racje=0, total=produkcja (got ${JSON.stringify(r)})`);
    ok(Number.isFinite(r.total) && Number.isFinite(r.racje), `maxSafe=0 -- brak NaN/Infinity (got ${JSON.stringify(r)})`);
  }
}

// ---------------------------------------------------------------------------
// 7) Wywołania cityFoodSplit(...) w cityPanel.ts: DOKŁADNIE 6 przekazują maxSafe
//    (regres: nowy/przywrócony call site bez drugiego argumentu cicho wraca do
//    starego buga -- tsc tego nie złapie, bo maxSafe jest opcjonalny) i DOKŁADNIE
//    1 gołe wywołanie cityFoodSplit(view) -- to jedyny świadomy wyjątek, w
//    cityGrowthLive (gorąca ścieżka mousemove/renderu mapy; liczenie maxSafe tam
//    byłoby prawie zawsze wyrzucaną pracą, patrz P-AUTO-WYZYWIENIE-PODWOJNY-BLAD
//    poprawka Evaluatora nr 2).
// ---------------------------------------------------------------------------
const bareCalls = (src.match(/cityFoodSplit\(view\)/g) || []).length;
ok(bareCalls === 1,
  `dokładnie 1 gołe wywołanie cityFoodSplit(view) bez maxSafe w cityPanel.ts -- świadomy wyjątek w cityGrowthLive (znaleziono ${bareCalls})`);
const wiredCalls = (src.match(/cityFoodSplit\(view,\s*maxSafe\)/g) || []).length;
ok(wiredCalls === 6,
  `dokładnie 6 wywołań cityFoodSplit(view, maxSafe) w cityPanel.ts (znaleziono ${wiredCalls}) -- jeśli liczba się zmieniła bo dodano/usunięto call site, zaktualizuj tę liczbę świadomie`);

// ---------------------------------------------------------------------------
// 8) Błąd zaokrąglenia IEEE-754: nawias wokół dzielenia PRZED mnożeniem zaniżał
//    racje o 1 w realnych przypadkach (np. 3,5/5 = 0,69999999999999996 zamiast
//    0,7). Naprawa: mnożenie PRZED dzieleniem (`kosztRacji * effectiveLevel /
//    poziomRacji`), bez nawiasu. view(5, 60, 45) z maxSafe=3.5 MUSI dać racje=32,
//    total=28 -- NIE 31/29 (stary, buggy wynik ze starego kodu z nawiasem).
// ---------------------------------------------------------------------------
if (cityFoodSplit) {
  const v = view(5, 60, 45); // poziomRacji=5, zywnoscBrutto=60, kosztRacji=45
  const r = cityFoodSplit(v, 3.5);
  ok(r.clamped === true, `IEEE-754 repro: clamped=true gdy poziomRacji(5) > maxSafe(3.5) (got ${JSON.stringify(r)})`);
  ok(r.racje === 32, `IEEE-754 repro: racje=32 (mnożenie przed dzieleniem), NIE 31 (stary bug z nawiasem) (got ${r.racje})`);
  ok(r.total === 28, `IEEE-754 repro: total=28 (60-32), NIE 29 (stary bug) (got ${r.total})`);
}

console.log(`\nauto-wyzywienie-bilans-clamp-test: ${pass} pass, ${fail} fail`);
process.exit(fail === 0 ? 0 : 1);
