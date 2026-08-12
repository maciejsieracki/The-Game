'use strict';
/**
 * empire-panel-moc-scroll-preserve-test.cjs — P-MOC-BALANS-WAGI / P-MOC-PODZIAL-WIDOK, defekt
 * UX zgłoszony przez Evaluatora (Maciej, 2026-08-12): klik przełącznika widoku Rankingu Mocy
 * (Całkowita/Gospodarcza/Militarna, `empireDetailPanel.ts`, `wireMocViewButtons`) przewijał
 * panel z powrotem na sam początek, bo `render()` podmienia `.civ-emp-body` przez
 * `bodyEl.innerHTML = body` — pełna podmiana treści węzła DOM, która (zachowanie natywne
 * przeglądarki, nie coś specyficznego dla tego kodu) zeruje `scrollTop` tego węzła.
 *
 * RUNDA 1 (`05328fe6`) naprawiła TYLKO ten przypadek: zapamiętanie `bodyEl.scrollTop` w
 * `prevScrollTop` TUŻ PRZED `bodyEl.innerHTML = body`, i przywrócenie go PO podmianie — gdy nie
 * ma aktywnego celowego skoku do sekcji (`scrollTarget` null). Evaluator: PASS dla tego
 * scenariusza, ale FAIL na CZĘSTSZEJ ścieżce — `render()` nie odróżniało re-renderu TEGO SAMEGO
 * widoku (gdzie przywrócenie jest poprawne) od otwarcia NOWEGO bloku / świeżego otwarcia (gdzie
 * scroll powinien wrócić na górę). Klik żetonu HUD z INNYM blokiem albo ponowne otwarcie panelu
 * po zamknięciu przywracały scrollTop z POPRZEDNIEGO, innego widoku (panel zamknięty to
 * `transform:translateX(100%)`, NIE `display:none` — `scrollTop` przeżywa zamknięcie).
 *
 * RUNDA 2 (ten plik + `empireDetailPanel.ts`) dodaje flagę modułową `resetScrollOnNextRender`,
 * ustawianą WYŁĄCZNIE w `showEmpireDetailPanel()` (jedyne miejsce, które wie, czy to nowe
 * otwarcie/zmiana bloku, czy zwykły re-render) — `render()` w gałęzi bez celowego skoku
 * (`else`) sprawdza tę flagę: gdy `true`, ustawia `bodyEl.scrollTop = 0` i zeruje flagę; w
 * przeciwnym razie zachowuje zachowanie z rundy 1 (`bodyEl.scrollTop = prevScrollTop`).
 *
 * ZAKRES DOWODU (uczciwie): `render()` i `showEmpireDetailPanel()` w całości nie dają się
 * zbundlować esbuildem (importują SVG/audio bez skonfigurowanych loaderów w tym harnessie — ten
 * sam, udokumentowany w CLAUDE.md limit co `map-field-battle-test.cjs`/`pre-battle-save-test.cjs`),
 * więc ten test NIE uruchamia całego `render()`/`showEmpireDetailPanel()` z prawdziwym DOM.
 * Zamiast tego:
 *   A. Weryfikacja strukturalna (source-text) — kolejność i kształt zmiany w PRAWDZIWYM pliku,
 *      osobno dla `render()` (gałąź `else if (resetScrollOnNextRender)`) i dla
 *      `showEmpireDetailPanel()` (warunek `!open || newSection !== activeSection`, ustawiany
 *      PRZED nadpisaniem `activeSection`/`open`).
 *   B. WYKONYWALNY dowód behawioralny — dosłowny fragment kodu z `render()` (od
 *      `const prevScrollTop = ...` do zamknięcia całego `if/else if/else`) jest WYCIĘTY z
 *      prawdziwego, aktualnego `empireDetailPanel.ts` (nie przepisany ręcznie) i URUCHOMIONY
 *      (`new Function`) na minimalnym fake `bodyEl`, którego setter `innerHTML` naśladuje
 *      jedyne zachowanie realnego DOM istotne dla tego błędu: podmiana treści zeruje
 *      `scrollTop`. `resetScrollOnNextRender` jest przekazywane jako parametr wejściowy —
 *      symuluje to, co `showEmpireDetailPanel()` już ustawiła PRZED wywołaniem `render()`
 *      (dokładnie tak jak `pendingScrollSection` już dziś jest przekazywane jako parametr).
 *      Cztery scenariusze: S1/S4 z rundy 1 (niezmienione zachowanie) + S2/S3 nowe w rundzie 2.
 *   C/D. Weryfikacja negatywna (mutacyjna) — ta sama wycięta logika, ale z USUNIĘTĄ galęzią
 *      (C: runda 1 — przywracanie `prevScrollTop`; D: runda 2 — `else if (resetScrollOnNextRender)`),
 *      uruchomiona na tym samym fake DOM, dowodzi że S1 i S2/S3 faktycznie coś łapią.
 *
 * Każde `runReal(...)`/`runMutant(...)` jest owinięte w try/catch (nota Evaluatora): jeśli
 * naprawa/anchor tekstowy kiedyś zniknie, `new Function` na pustym/okrojonym wycinku rzuca
 * `ReferenceError` (np. `scrollTarget is not defined`) — bez try/catch cały proces testowy by
 * się wywalił zamiast wydrukować czytelne FAIL i przejść do kolejnych asercji.
 *
 * Run from gra/: node tools/empire-panel-moc-scroll-preserve-test.cjs
 */

const fs = require('fs');
const path = require('path');

const GRA_DIR = path.resolve(__dirname, '..');
const PANEL_TS = path.join(GRA_DIR, 'src/ui/empireDetailPanel.ts');
const panelSrc = fs.readFileSync(PANEL_TS, 'utf8');

let pass = 0;
let fail = 0;
function assert(label, cond, detail) {
  if (cond) {
    pass++;
    console.log('  PASS: ' + label);
  } else {
    fail++;
    console.log('  FAIL: ' + label + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : ''));
  }
}

/** Owija wywolanie wycietego fragmentu w try/catch (nota Evaluatora) -- gdy fragment brakuje
 *  lub jest okrojony (naprawa nieobecna), `new Function` moze rzucic ReferenceError zamiast
 *  po prostu dac zly wynik; lapiemy to jako czysty FAIL zamiast wywalac caly proces testowy. */
function safeRun(label, runner, args) {
  if (!runner) {
    assert(label + ': runner dostepny (wycinek zbudowany)', false, 'runner is null');
    return null;
  }
  try {
    return runner(...args);
  } catch (e) {
    assert(label + ': wykonanie nie rzucilo wyjatku (np. ReferenceError gdy naprawa/anchor brakuje)', false, e.message || String(e));
    return null;
  }
}

console.log('========================================================================');
console.log('P-MOC-BALANS-WAGI/scroll -- scrollTop RUNDA 1 (re-render tego samego widoku) +');
console.log('RUNDA 2 (nowy blok / swieze otwarcie resetuje scroll do gory)');
console.log('========================================================================\n');

// ---------------------------------------------------------------------------
// A. Weryfikacja strukturalna na prawdziwym pliku (source-text, wzorzec: reszta testów
//    empireDetailPanel.ts w tym repo -- plik niebundlowalny esbuildem, patrz nagłówek).
// ---------------------------------------------------------------------------
console.log('A1. render(): kolejnosc zapamietaj -> podmien -> [skok | reset (RUNDA 2) | przywroc] (source-text)');

const renderStartIdx = panelSrc.indexOf('function render(): void {');
assert('znaleziono "function render(): void {"', renderStartIdx > -1);
const renderEndIdx = renderStartIdx > -1
  ? panelSrc.indexOf('\nlet backdrop: HTMLDivElement | null = null;', renderStartIdx)
  : -1;
assert('znaleziono koniec render() (kotwica nastepnej deklaracji "let backdrop")', renderEndIdx > renderStartIdx);
const renderBody = (renderStartIdx > -1 && renderEndIdx > renderStartIdx)
  ? panelSrc.slice(renderStartIdx, renderEndIdx)
  : '';

const prevScrollIdx = renderBody.indexOf('const prevScrollTop = bodyEl.scrollTop;');
const innerHtmlIdx = renderBody.indexOf('bodyEl.innerHTML = body;');
assert('render() zawiera "const prevScrollTop = bodyEl.scrollTop;"', prevScrollIdx > -1);
assert('render() zawiera "bodyEl.innerHTML = body;"', innerHtmlIdx > -1);
assert(
  'prevScrollTop zapamietany PRZED podmiana innerHTML (nie po -- inaczej zapamietalibysmy juz wyzerowana wartosc)',
  prevScrollIdx > -1 && innerHtmlIdx > -1 && prevScrollIdx < innerHtmlIdx,
  { prevScrollIdx, innerHtmlIdx },
);

const restoreIdx = renderBody.indexOf('bodyEl.scrollTop = prevScrollTop;');
assert('render() zawiera przywrocenie "bodyEl.scrollTop = prevScrollTop;" (RUNDA 1, galaz koncowa)', restoreIdx > -1);
assert('przywrocenie nastepuje PO podmianie innerHTML', restoreIdx > innerHtmlIdx, { restoreIdx, innerHtmlIdx });

// Przywrocenie musi lezec w koncowej galezi ELSE (gdy brak celowego skoku do sekcji I brak
// resetu z rundy 2) -- NIE bezwarunkowo, zeby nie nadpisywac celowego scrollToSection() ani
// nowego resetu do gory.
const ifScrollTargetIdx = renderBody.indexOf('if (scrollTarget) {');
assert('render() ma "if (scrollTarget) {"', ifScrollTargetIdx > -1);
const elseBlockMatch = renderBody.match(/\}\s*else\s*\{\s*\n\s*bodyEl\.scrollTop = prevScrollTop;\s*\n\s*\}/);
assert(
  'przywrocenie scrollTop lezy WYLACZNIE w koncowej galezi "} else {" -- nie bezwarunkowo, nie w "else if"',
  elseBlockMatch !== null,
);
assert(
  'galaz "if (scrollTarget)" nadal woła requestAnimationFrame(...scrollToSection...) -- celowy skok do sekcji NIENARUSZONY (RUNDA 1)',
  /if \(scrollTarget\) \{\s*\n\s*requestAnimationFrame\(\(\) => scrollToSection\(scrollTarget\)\);/.test(renderBody),
);

// RUNDA 2 -- galaz posrednia "else if (resetScrollOnNextRender)", MIEDZY celowym skokiem a
// koncowym przywroceniem prevScrollTop.
const elseIfIdx = renderBody.indexOf('} else if (resetScrollOnNextRender) {');
assert('render() ma odrebna galaz "} else if (resetScrollOnNextRender) {" (RUNDA 2)', elseIfIdx > -1);
assert(
  'galaz "else if (resetScrollOnNextRender)" lezy MIEDZY "if (scrollTarget)" a koncowym przywroceniem prevScrollTop (kolejnosc: skok -> reset -> przywroc)',
  ifScrollTargetIdx > -1 && elseIfIdx > ifScrollTargetIdx && restoreIdx > elseIfIdx,
  { ifScrollTargetIdx, elseIfIdx, restoreIdx },
);
assert(
  'galaz "else if (resetScrollOnNextRender)" ustawia scrollTop=0 i zeruje flage (kolejnosc: zeruj -> ustaw 0)',
  /else if \(resetScrollOnNextRender\) \{[\s\S]{0,400}?resetScrollOnNextRender = false;[\s\S]{0,120}?bodyEl\.scrollTop = 0;/.test(renderBody),
);
console.log('');

console.log('A2. showEmpireDetailPanel(): flaga resetScrollOnNextRender ustawiana na podstawie STAREGO open/activeSection, PRZED ich nadpisaniem (source-text)');

assert('modul deklaruje "let resetScrollOnNextRender = false;"', panelSrc.includes('let resetScrollOnNextRender = false;'));

const showFnStartIdx = panelSrc.indexOf('export function showEmpireDetailPanel(section?: string): void {');
assert('znaleziono "export function showEmpireDetailPanel(section?: string): void {"', showFnStartIdx > -1);
const showFnEndIdx = showFnStartIdx > -1
  ? panelSrc.indexOf('\nexport function hideEmpireDetailPanel', showFnStartIdx)
  : -1;
assert('znaleziono koniec showEmpireDetailPanel() (kotwica "export function hideEmpireDetailPanel")', showFnEndIdx > showFnStartIdx);
const showFnBody = (showFnStartIdx > -1 && showFnEndIdx > showFnStartIdx)
  ? panelSrc.slice(showFnStartIdx, showFnEndIdx)
  : '';

assert(
  'showEmpireDetailPanel() zawiera warunek "if (!open || newSection !== activeSection)" ktory ustawia "resetScrollOnNextRender = true;"',
  /if \(!open \|\| newSection !== activeSection\) \{\s*\n\s*resetScrollOnNextRender = true;/.test(showFnBody),
);

const condIdx = showFnBody.indexOf('if (!open || newSection !== activeSection)');
const activeAssignIdx = showFnBody.indexOf('activeSection = newSection;');
const openAssignIdx = showFnBody.indexOf('open = true;');
assert(
  'kolejnosc w showEmpireDetailPanel(): warunek (czyta STARE activeSection/open) -> activeSection=newSection -> open=true',
  condIdx > -1 && activeAssignIdx > condIdx && openAssignIdx > activeAssignIdx,
  { condIdx, activeAssignIdx, openAssignIdx },
);
console.log('');

// ---------------------------------------------------------------------------
// B. Dowod wykonywalny -- dosłowny wycinek kodu WYCIĘTY z prawdziwego pliku i URUCHOMIONY
//    (new Function) na minimalnym fake bodyEl, ktorego setter innerHTML nasladuje jedyne
//    zachowanie realnego DOM istotne dla tego bledu (podmiana tresci zeruje scrollTop).
// ---------------------------------------------------------------------------
console.log('B. Dowod wykonywalny -- wycięty fragment render() uruchomiony na fake bodyEl (S1/S4 z rundy 1 + S2/S3 nowe w rundzie 2)');

const snippetStart = renderBody.indexOf('const prevScrollTop = bodyEl.scrollTop;');
// Kotwica konca = KONCOWA galaz "} else { bodyEl.scrollTop = prevScrollTop; }" -- lezy PO
// galezi "else if (resetScrollOnNextRender)" (patrz A1), wiec wycinek obejmuje cala trojke
// if/else-if/else, nie tylko pierwsza i ostatnia galaz.
const snippetCloseAnchor = '\n  } else {\n    bodyEl.scrollTop = prevScrollTop;\n  }';
const snippetCloseIdx = snippetStart > -1 ? renderBody.indexOf(snippetCloseAnchor, snippetStart) : -1;
const snippetEnd = snippetCloseIdx > -1 ? snippetCloseIdx + snippetCloseAnchor.length : -1;
assert('kotwica konca wycinka znaleziona (koncowa galaz "} else { bodyEl.scrollTop = prevScrollTop; }")', snippetEnd > snippetStart);
const realSnippet = (snippetStart > -1 && snippetEnd > snippetStart)
  ? renderBody.slice(snippetStart, snippetEnd)
  : '';
assert('wycinek nie jest pusty (jest co uruchomic)', realSnippet.length > 50, realSnippet.length);
assert('wycinek zawiera obie galezie -- RUNDA 1 (prevScrollTop) i RUNDA 2 (resetScrollOnNextRender)',
  realSnippet.includes('resetScrollOnNextRender') && realSnippet.includes('prevScrollTop'));

/** Fake .civ-emp-body -- jedyne zachowanie realnego DOM istotne tutaj: ustawienie innerHTML
 *  zeruje scrollTop (dokladnie tak dzieje sie w prawdziwej przegladarce, to jest ZRODLO
 *  zglosznego bledu, nie zalozenie testu). */
function makeFakeBodyEl(initialScrollTop) {
  let _scrollTop = initialScrollTop;
  let _innerHTML = '';
  return {
    get scrollTop() { return _scrollTop; },
    set scrollTop(v) { _scrollTop = v; },
    get innerHTML() { return _innerHTML; },
    set innerHTML(v) { _innerHTML = v; _scrollTop = 0; },
  };
}

/** Buduje funkcje wykonywalna z DOSŁOWNEGO fragmentu źródła (snippet) + parametry-zaślepki
 *  na wszystko, co fragment woła/czyta na zewnątrz (wireMocViewButtons/requestAnimationFrame/
 *  scrollToSection/resetScrollOnNextRender) -- fragment sam w sobie NIE jest przepisywany.
 *  resetScrollOnNextRender jest zwykłym parametrem funkcji (jak pendingScrollSection już w
 *  rundzie 1) -- przypisanie w srodku (resetScrollOnNextRender = false) jest lokalne dla tego
 *  wywolania, nie wycieka do modulu, dokladnie jak w prawdziwym kodzie to modul-level let. */
function buildRunner(snippet) {
  return new Function(
    'bodyEl', 'body', 'block', 'pendingScrollSection', 'resetScrollOnNextRender',
    'wireMocViewButtons', 'requestAnimationFrame', 'scrollToSection',
    snippet + '\nreturn { scrollTarget: scrollTarget, pendingScrollSectionAfter: pendingScrollSection, '
      + 'resetScrollOnNextRenderAfter: resetScrollOnNextRender };',
  );
}

let runReal = null;
try {
  runReal = buildRunner(realSnippet);
  assert('wycinek jest syntaktycznie poprawnym JS po wycieciu (new Function nie rzuca)', true);
} catch (e) {
  assert('wycinek jest syntaktycznie poprawnym JS po wycieciu (new Function nie rzuca)', false, e.message || String(e));
}

// S1 (RUNDA 1, bylo "Scenariusz 1") -- zwykly re-render BEZ celowego skoku i BEZ resetu z
// rundy 2 (dokladnie przypadek z pierwszego zgloszenia: klik zakladki Rankingu Mocy / filtr
// kolumn Miasta -- pendingScrollSection null, resetScrollOnNextRender false, bo te wywolania
// NIE ida przez showEmpireDetailPanel, tylko wola render() bezposrednio).
{
  const body1 = makeFakeBodyEl(842);
  let rafCalls = 0;
  let wireCalls = 0;
  const res1 = safeRun('S1', runReal, [
    body1, '<div>NOWA TRESC PO PRZELACZENIU TRYBU</div>', 'moc', null, false,
    () => { wireCalls++; },
    () => { rafCalls++; },
    () => { /* scrollToSection -- nie powinno byc wywolane w tym scenariuszu */ },
  ]);
  assert('S1: tresc faktycznie podmieniona (innerHTML = nowy body)', body1.innerHTML === '<div>NOWA TRESC PO PRZELACZENIU TRYBU</div>');
  assert(
    'S1 (RDZEN DOWODU RUNDY 1): scrollTop=842 PRZED przelaczeniem == scrollTop PO przelaczeniu (zachowany, nie wyzerowany)',
    body1.scrollTop === 842,
    { scrollTop: body1.scrollTop },
  );
  assert('S1: brak celowego skoku -> requestAnimationFrame NIE wywolane', rafCalls === 0, rafCalls);
  assert('S1: wireMocViewButtons() wywolane (przyciski podpiete na nowo po podmianie DOM)', wireCalls === 1, wireCalls);
  if (res1) {
    assert('S1: pendingScrollSection po przebiegu == null', res1.pendingScrollSectionAfter === null, res1.pendingScrollSectionAfter);
    assert('S1: resetScrollOnNextRender po przebiegu == false (nie bylo ustawione, nie ma czego zerowac)', res1.resetScrollOnNextRenderAfter === false, res1.resetScrollOnNextRenderAfter);
  }
}

// S2 (RUNDA 2, NOWY -- Evaluator: "klik zetonu HUD po scrollu w innym bloku, oczekiwane 0,
// otrzymane 600"). Klik zetonu HUD z INNYM blokiem niz aktualnie widoczny (np. Surowce, po
// przewinieciu w innym bloku) -- showEmpireDetailPanel juz ustawila resetScrollOnNextRender=true,
// bo sekcja sie zmienila. block='surowce' (!=='all') wiec scrollTarget jest zawsze null
// niezaleznie od pendingScrollSection -- to WLASNIE byl blad rundy 1: koncowa galaz "else"
// bezwarunkowo przywracala prevScrollTop, ignorujac ze to NOWY, inny blok.
{
  const body2 = makeFakeBodyEl(600);
  let rafCalls = 0;
  const res2 = safeRun('S2', runReal, [
    body2, '<div>BLOK SUROWCE</div>', 'surowce', 'surowce', true,
    () => {},
    () => { rafCalls++; },
    () => {},
  ]);
  assert('S2: tresc faktycznie podmieniona (innerHTML = nowy body)', body2.innerHTML === '<div>BLOK SUROWCE</div>');
  assert('S2: block!=="all" -> brak celowego skoku -> requestAnimationFrame NIE wywolane', rafCalls === 0, rafCalls);
  assert(
    'S2 (RDZEN DOWODU RUNDY 2): scrollTop PO renderze == 0, NIE 600 -- nowy blok pokazany OD GORY, nie ze starym scrollem z INNEGO bloku',
    body2.scrollTop === 0,
    { scrollTop: body2.scrollTop },
  );
  if (res2) {
    assert('S2: resetScrollOnNextRender wyzerowana po zuzyciu (nie zostaje "true" na kolejny render)', res2.resetScrollOnNextRenderAfter === false, res2.resetScrollOnNextRenderAfter);
  }
}

// S3 (RUNDA 2, NOWY -- Evaluator: "ponowne otwarcie panelu po zamknieciu, oczekiwane 0,
// otrzymane 900"). Panel byl ZAMKNIETY (transform:translateX(100%), scrollTop PRZEZYWA
// zamkniecie, NIE display:none) -- showEmpireDetailPanel wykrywa !open -> ustawia
// resetScrollOnNextRender=true. Tu block='all' (pelny panel, swierze otwarcie bez konkretnej
// podsekcji), pendingScrollSection=null (brak celowego skoku) -> scrollTarget=null przez brak
// pendingScrollSection, nie przez block -- inna droga do tego samego scrollTarget=null co S2,
// wiec S2 i S3 razem pokrywaja obie przyczyny scrollTarget=null opisane w recepcie Evaluatora.
{
  const body3 = makeFakeBodyEl(900);
  let rafCalls = 0;
  const res3 = safeRun('S3', runReal, [
    body3, '<div>PELNY PANEL PO PONOWNYM OTWARCIU</div>', 'all', null, true,
    () => {},
    () => { rafCalls++; },
    () => {},
  ]);
  assert('S3: tresc faktycznie podmieniona (innerHTML = nowy body)', body3.innerHTML === '<div>PELNY PANEL PO PONOWNYM OTWARCIU</div>');
  assert('S3: pendingScrollSection=null -> brak celowego skoku -> requestAnimationFrame NIE wywolane', rafCalls === 0, rafCalls);
  assert(
    'S3 (RDZEN DOWODU RUNDY 2): scrollTop PO renderze == 0, NIE 900 -- swieze otwarcie pokazuje panel OD GORY, nie ze starym scrollem sprzed zamkniecia',
    body3.scrollTop === 0,
    { scrollTop: body3.scrollTop },
  );
  if (res3) {
    assert('S3: resetScrollOnNextRender wyzerowana po zuzyciu', res3.resetScrollOnNextRenderAfter === false, res3.resetScrollOnNextRenderAfter);
  }
}

// S4 (RUNDA 1, bylo "Scenariusz 2") -- celowy skok do sekcji (np. klik zetonu HUD przy juz
// otwartym panelu, block='all', pendingScrollSection ustawione) -- przywracanie STAREJ pozycji
// (ani reset z rundy 2) NIE moze zajsc, bo o pozycje dba requestAnimationFrame(scrollToSection).
{
  const body4 = makeFakeBodyEl(842);
  let rafCalls = 0;
  const res4 = safeRun('S4', runReal, [
    body4, '<div>PELNY WIDOK</div>', 'all', 'moc', false,
    () => {},
    () => { rafCalls++; },
    () => {},
  ]);
  if (res4) {
    assert('S4: scrollTarget wyliczony poprawnie ("moc", bo block==="all" i pendingScrollSection="moc")', res4.scrollTarget === 'moc', res4.scrollTarget);
  }
  assert('S4: celowy skok -> requestAnimationFrame WYWOLANE (scrollToSection zaplanowane)', rafCalls === 1, rafCalls);
  assert(
    'S4: stara pozycja (842) NIE jest synchronicznie przywracana -- galaz if(scrollTarget) wygrywa nad else-if/else, o docelowa pozycje zadba scrollToSection',
    body4.scrollTop === 0,
    { scrollTop: body4.scrollTop },
  );
}
console.log('');

// ---------------------------------------------------------------------------
// C. Weryfikacja negatywna (RUNDA 1) -- ta sama wycieta logika, ale z USUNIETA koncowa galezia
//    "else" (regresja: dokladnie pierwotny blad -- scrollTop nigdy nie jest przywracany).
//    Dowod, ze S1 z sekcji B realnie cos lapie, a nie jest tautologia.
// ---------------------------------------------------------------------------
console.log('C. Weryfikacja negatywna RUNDY 1 -- mutacja usuwajaca przywracanie prevScrollTop, lapana przez S1');

const mutatedSnippetR1 = realSnippet.replace(
  '  } else {\n    bodyEl.scrollTop = prevScrollTop;\n  }',
  '  } // MUTANT RUNDY 1: koncowa galaz else (przywracanie scrollTop) usunieta -- dokladnie pierwotnie zgloszony blad',
);
assert('mutacja RUNDY 1 faktycznie zmienila wycinek (kotwica zamiany istnieje)', mutatedSnippetR1 !== realSnippet);

let runMutantR1 = null;
try {
  runMutantR1 = buildRunner(mutatedSnippetR1);
  assert('zmutowany (RUNDA 1) wycinek jest syntaktycznie poprawny (regresja nie psuje samej skladni)', true);
} catch (e) {
  assert('zmutowany (RUNDA 1) wycinek jest syntaktycznie poprawny (regresja nie psuje samej skladni)', false, e.message || String(e));
}
{
  const bodyM1 = makeFakeBodyEl(842);
  safeRun('MUTANT RUNDA 1', runMutantR1, [
    bodyM1, '<div>NOWA TRESC</div>', 'moc', null, false,
    () => {}, () => {}, () => {},
  ]);
  assert(
    'MUTANT RUNDY 1 (bez przywracania) lapany CZERWONO przez S1: scrollTop PO przelaczeniu == 0, NIE 842',
    bodyM1.scrollTop !== 842,
    { scrollTop: bodyM1.scrollTop },
  );
}
console.log('');

// ---------------------------------------------------------------------------
// D. Weryfikacja negatywna (RUNDA 2) -- ta sama wycieta logika, ale z USUNIETA galezia
//    "else if (resetScrollOnNextRender)" -- dokladnie regresja rundy 1 (05328fe6), ktora
//    Evaluator zlapal: klik zetonu HUD z innym blokiem znowu przywraca prevScrollTop zamiast 0.
//    Dowod, ze S2/S3 z sekcji B realnie cos lapia, a nie sa tautologia.
// ---------------------------------------------------------------------------
console.log('D. Weryfikacja negatywna RUNDY 2 -- mutacja usuwajaca galaz resetScrollOnNextRender, lapana przez S2/S3');

const elseIfMarker = '} else if (resetScrollOnNextRender) {';
const finalElseMarker = '} else {\n    bodyEl.scrollTop = prevScrollTop;\n  }';
const elseIfStartInSnippet = realSnippet.indexOf(elseIfMarker);
const finalElseStartInSnippet = elseIfStartInSnippet > -1 ? realSnippet.indexOf(finalElseMarker, elseIfStartInSnippet) : -1;
assert(
  'granice galezi "else if (resetScrollOnNextRender)" znalezione w wycinku (do usuniecia mutacja D)',
  elseIfStartInSnippet > -1 && finalElseStartInSnippet > elseIfStartInSnippet,
  { elseIfStartInSnippet, finalElseStartInSnippet },
);
const mutatedSnippetR2 = (elseIfStartInSnippet > -1 && finalElseStartInSnippet > elseIfStartInSnippet)
  ? realSnippet.slice(0, elseIfStartInSnippet) + realSnippet.slice(finalElseStartInSnippet)
  : '';
assert('mutacja RUNDY 2 faktycznie zmienila wycinek (galaz usunieta)', mutatedSnippetR2 !== '' && mutatedSnippetR2 !== realSnippet);

let runMutantR2 = null;
try {
  runMutantR2 = mutatedSnippetR2 ? buildRunner(mutatedSnippetR2) : null;
  if (runMutantR2) assert('zmutowany (RUNDA 2) wycinek jest syntaktycznie poprawny (regresja nie psuje samej skladni)', true);
} catch (e) {
  assert('zmutowany (RUNDA 2) wycinek jest syntaktycznie poprawny (regresja nie psuje samej skladni)', false, e.message || String(e));
}
{
  // Powtarzamy DOKLADNIE parametry S2 (block='surowce', resetScrollOnNextRender=true, prevScrollTop=600)
  // na kodzie cofnietym do stanu rundy 1 -- to jest dowod mutacyjny "cofnij naprawe -> S2 czerwone".
  const bodyM2 = makeFakeBodyEl(600);
  safeRun('MUTANT RUNDA 2 (parametry S2)', runMutantR2, [
    bodyM2, '<div>BLOK SUROWCE</div>', 'surowce', 'surowce', true,
    () => {}, () => {}, () => {},
  ]);
  assert(
    'MUTANT RUNDY 2 (galaz resetScrollOnNextRender usunieta) lapany CZERWONO przez S2: scrollTop PO przelaczeniu == 600 (blad rundy 1 odtworzony), NIE 0',
    mutatedSnippetR2 !== '' ? bodyM2.scrollTop === 600 : true,
    { scrollTop: bodyM2.scrollTop, mutantBuilt: mutatedSnippetR2 !== '' },
  );
}
console.log('');

console.log('========================================================================');
if (fail === 0) {
  console.log(`OK (${pass}/${pass})`);
  process.exit(0);
} else {
  console.log(`FAILED: ${pass} passed, ${fail} failed`);
  process.exit(1);
}
