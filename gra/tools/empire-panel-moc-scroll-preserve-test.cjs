'use strict';
/**
 * empire-panel-moc-scroll-preserve-test.cjs — P-MOC-BALANS-WAGI / P-MOC-PODZIAL-WIDOK, defekt
 * UX zgłoszony przez Evaluatora (Maciej, 2026-08-12): klik przełącznika widoku Rankingu Mocy
 * (Całkowita/Gospodarcza/Militarna, `empireDetailPanel.ts`, `wireMocViewButtons`) przewijał
 * panel z powrotem na sam początek, bo `render()` podmienia `.civ-emp-body` przez
 * `bodyEl.innerHTML = body` — pełna podmiana treści węzła DOM, która (zachowanie natywne
 * przeglądarki, nie coś specyficznego dla tego kodu) zeruje `scrollTop` tego węzła.
 *
 * Naprawa (`gra/src/ui/empireDetailPanel.ts`, `render()`, ok. linii 1458-1469): zapamiętanie
 * `bodyEl.scrollTop` w `prevScrollTop` TUŻ PRZED `bodyEl.innerHTML = body`, i przywrócenie go
 * PO podmianie — ale WYŁĄCZNIE gdy nie ma aktywnego celowego skoku do sekcji
 * (`scrollTarget` null, czyli `pendingScrollSection` puste / blok nie jest 'all'). Gdy skok
 * jest aktywny (np. klik żetonu HUD przy otwartym panelu), przywracanie POPRZEDNIEJ pozycji
 * jest CELOWO pominięte — o pozycjonowanie dba wtedy `scrollToSection()` (płynny scroll do
 * konkretnej podsekcji), nie ma go co nadpisywać starą pozycją.
 *
 * ZAKRES DOWODU (uczciwie): `render()` w całości nie da się zbundlować esbuildem (importuje
 * SVG/audio bez skonfigurowanych loaderów w tym harnessie — ten sam, udokumentowany w
 * CLAUDE.md limit co `map-field-battle-test.cjs`/`pre-battle-save-test.cjs`), więc ten test
 * NIE uruchamia całego `render()` z prawdziwym DOM. Zamiast tego:
 *   A. Weryfikacja strukturalna (source-text) — kolejność i kształt zmiany w prawdziwym pliku.
 *   B. WYKONYWALNY dowód behawioralny — dosłowny fragment kodu (od `const prevScrollTop = ...`
 *      do zamknięcia `if/else`) jest WYCIĘTY z prawdziwego, aktualnego `empireDetailPanel.ts`
 *      (nie przepisany ręcznie) i URUCHOMIONY (`new Function`) na minimalnym fake `bodyEl`,
 *      którego setter `innerHTML` naśladuje jedyne zachowanie realnego DOM istotne dla tego
 *      błędu: podmiana treści zeruje `scrollTop`. To sprawdza DOKŁADNIE ten wycinek logiki
 *      przełącznika scrolla — nie całego renderowania panelu (reszta `render()` — HTML sekcji,
 *      wiring innych kontrolek — pozostaje pokryta przez istniejące testy source-text tego
 *      pliku, np. empire-miasta-table-test.cjs, empire-panel-econ-slider-visibility-test.cjs).
 *   C. Weryfikacja negatywna — ta sama wycięta logika, ale z USUNIĘTĄ linią przywracania
 *      (regresja: dokładnie zgłoszony błąd), uruchomiona na tym samym fake DOM, dowodzi że
 *      sekcja B faktycznie coś łapie (bez naprawy scrollTop zostaje 0, nie poprzednią wartością).
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

console.log('========================================================================');
console.log('P-MOC-BALANS-WAGI/scroll -- scrollTop zachowany po przelaczniku widoku Rankingu Mocy');
console.log('========================================================================\n');

// ---------------------------------------------------------------------------
// A. Weryfikacja strukturalna na prawdziwym pliku (source-text, wzorzec: reszta testów
//    empireDetailPanel.ts w tym repo -- plik niebundlowalny esbuildem, patrz nagłówek).
// ---------------------------------------------------------------------------
console.log('A. render(): kolejnosc zapamietaj -> podmien -> przywroc (source-text)');

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
assert('render() zawiera przywrocenie "bodyEl.scrollTop = prevScrollTop;"', restoreIdx > -1);
assert('przywrocenie nastepuje PO podmianie innerHTML', restoreIdx > innerHtmlIdx, { restoreIdx, innerHtmlIdx });

// Przywrocenie musi lezec w galezi ELSE (gdy brak celowego skoku do sekcji) -- NIE
// bezwarunkowo, zeby nie nadpisywac celowego scrollToSection() przy skoku z HUD.
const ifScrollTargetIdx = renderBody.indexOf('if (scrollTarget) {');
assert('render() ma "if (scrollTarget) {"', ifScrollTargetIdx > -1);
const elseBlockMatch = renderBody.match(/\}\s*else\s*\{\s*\n\s*bodyEl\.scrollTop = prevScrollTop;\s*\n\s*\}/);
assert(
  'przywrocenie scrollTop lezy WYLACZNIE w galezi "} else {" po "if (scrollTarget)" -- nie bezwarunkowo',
  elseBlockMatch !== null,
);
assert(
  'galaz "if (scrollTarget)" nadal woła requestAnimationFrame(...scrollToSection...) -- celowy skok do sekcji NIENARUSZONY',
  /if \(scrollTarget\) \{\s*\n\s*requestAnimationFrame\(\(\) => scrollToSection\(scrollTarget\)\);/.test(renderBody),
);
console.log('');

// ---------------------------------------------------------------------------
// B. Dowod wykonywalny -- dosłowny wycinek kodu WYCIĘTY z prawdziwego pliku i URUCHOMIONY
//    (new Function) na minimalnym fake bodyEl, ktorego setter innerHTML nasladuje jedyne
//    zachowanie realnego DOM istotne dla tego bledu (podmiana tresci zeruje scrollTop).
// ---------------------------------------------------------------------------
console.log('B. Dowod wykonywalny -- wycięty fragment render() uruchomiony na fake bodyEl');

const snippetStart = renderBody.indexOf('const prevScrollTop = bodyEl.scrollTop;');
const snippetEndAnchor = '\n  if (scrollTarget) {\n    requestAnimationFrame(() => scrollToSection(scrollTarget));\n  } else {\n    bodyEl.scrollTop = prevScrollTop;\n  }';
const snippetEnd = renderBody.indexOf(snippetEndAnchor, snippetStart);
assert('kotwica konca wycinka znaleziona (dokladny ksztalt if/else)', snippetEnd > snippetStart);
const realSnippet = (snippetStart > -1 && snippetEnd > snippetStart)
  ? renderBody.slice(snippetStart, snippetEnd + snippetEndAnchor.length)
  : '';
assert('wycinek nie jest pusty (jest co uruchomic)', realSnippet.length > 50, realSnippet.length);

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
 *  na wszystko, co fragment woła na zewnątrz (wireMocViewButtons/requestAnimationFrame/
 *  scrollToSection) -- fragment sam w sobie NIE jest przepisywany. */
function buildRunner(snippet) {
  return new Function(
    'bodyEl', 'body', 'block', 'pendingScrollSection', 'wireMocViewButtons',
    'requestAnimationFrame', 'scrollToSection',
    snippet + '\nreturn { scrollTarget: scrollTarget, pendingScrollSectionAfter: pendingScrollSection };',
  );
}

let runReal;
try {
  runReal = buildRunner(realSnippet);
} catch (e) {
  assert('wycinek jest syntaktycznie poprawnym JS po wycieciu (new Function nie rzuca)', false, e.message || String(e));
  runReal = null;
}
if (runReal) assert('wycinek jest syntaktycznie poprawnym JS po wycieciu (new Function nie rzuca)', true);

// Scenariusz 1 -- zwykly re-render BEZ celowego skoku (dokladnie przypadek z bledu: klik
// zakladki Rankingu Mocy / filtr kolumn Miasta -- pendingScrollSection null).
if (runReal) {
  const body1 = makeFakeBodyEl(842);
  let rafCalls = 0;
  let wireCalls = 0;
  const res1 = runReal(
    body1, '<div>NOWA TRESC PO PRZELACZENIU TRYBU</div>', 'moc', null,
    () => { wireCalls++; },
    () => { rafCalls++; },
    () => { /* scrollToSection -- nie powinno byc wywolane w tym scenariuszu */ },
  );
  assert('Scenariusz 1: tresc faktycznie podmieniona (innerHTML = nowy body)', body1.innerHTML === '<div>NOWA TRESC PO PRZELACZENIU TRYBU</div>');
  assert(
    'Scenariusz 1 (RDZEN DOWODU): scrollTop=842 PRZED przelaczeniem == scrollTop PO przelaczeniu (zachowany, nie wyzerowany)',
    body1.scrollTop === 842,
    { scrollTop: body1.scrollTop },
  );
  assert('Scenariusz 1: brak celowego skoku -> requestAnimationFrame NIE wywolane', rafCalls === 0, rafCalls);
  assert('Scenariusz 1: wireMocViewButtons() wywolane (przyciski podpiete na nowo po podmianie DOM)', wireCalls === 1, wireCalls);
  assert('Scenariusz 1: pendingScrollSection po przebiegu == null', res1.pendingScrollSectionAfter === null, res1.pendingScrollSectionAfter);
}

// Scenariusz 2 -- celowy skok do sekcji (np. klik żetonu HUD przy juz otwartym panelu,
// block='all', pendingScrollSection ustawione) -- przywracanie STAREJ pozycji musi zostac
// pominiete, bo o pozycje dba requestAnimationFrame(scrollToSection).
if (runReal) {
  const body2 = makeFakeBodyEl(842);
  let rafCalls = 0;
  const res2 = runReal(
    body2, '<div>PELNY WIDOK</div>', 'all', 'moc',
    () => {},
    () => { rafCalls++; },
    () => {},
  );
  assert('Scenariusz 2: scrollTarget wyliczony poprawnie ("moc", bo block==="all" i pendingScrollSection="moc")', res2.scrollTarget === 'moc', res2.scrollTarget);
  assert('Scenariusz 2: celowy skok -> requestAnimationFrame WYWOLANE (scrollToSection zaplanowane)', rafCalls === 1, rafCalls);
  assert(
    'Scenariusz 2: stara pozycja (842) NIE jest synchronicznie przywracana -- galaz else pominieta, bo o docelowa pozycje zadba scrollToSection',
    body2.scrollTop === 0,
    { scrollTop: body2.scrollTop },
  );
}
console.log('');

// ---------------------------------------------------------------------------
// C. Weryfikacja negatywna -- ta sama wycieta logika, ale z USUNIETA galezia "else" (regresja:
//    dokladnie zgloszony blad -- scrollTop nigdy nie jest przywracany). Dowod, ze Scenariusz 1
//    z sekcji B realnie cos lapie, a nie jest tautologia.
// ---------------------------------------------------------------------------
console.log('C. Weryfikacja negatywna -- mutacja regresyjna (usuniete przywracanie) lapana przez Scenariusz 1');

const mutatedSnippet = realSnippet.replace(
  '  } else {\n    bodyEl.scrollTop = prevScrollTop;\n  }',
  '  } // MUTANT: galaz else (przywracanie scrollTop) usunieta -- dokladnie zgloszony blad',
);
assert('mutacja regresyjna faktycznie zmienila wycinek (kotwica zamiany istnieje)', mutatedSnippet !== realSnippet);

let runMutant = null;
try {
  runMutant = buildRunner(mutatedSnippet);
} catch (e) {
  assert('zmutowany wycinek jest syntaktycznie poprawny (regresja nie psuje samej skladni)', false, e.message || String(e));
}
if (runMutant) {
  const bodyM = makeFakeBodyEl(842);
  runMutant(
    bodyM, '<div>NOWA TRESC</div>', 'moc', null,
    () => {},
    () => {},
    () => {},
  );
  assert(
    'MUTANT (bez przywracania) lapany CZERWONO: scrollTop PO przelaczeniu == 0, NIE 842 -- dowod, ze Scenariusz 1 faktycznie testuje fix, nie jest tautologia',
    bodyM.scrollTop !== 842,
    { scrollTop: bodyM.scrollTop },
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
