'use strict';
/**
 * empire-panel-sliders-always-visible-test.cjs — SUPERSEDED przez P-EMPIRE-PANEL-SUWAKI-DUPLIKOWANE
 * (commit 469f3152, Evaluator FAIL szczelina 6, 2026-08-12).
 *
 * Historia: ten plik pierwotnie (BUG-SUWAKI-PRACA-SKARBIEC-ZNIKAJA-PRZY-FILTRZE-CHIPU, commit
 * b80426ff) chronił kontrakt „suwaki Skarbiec+Praca renderują się ZAWSZE, niezależnie od
 * onlyEconId" — to było poprawne dopóki jedynym problemem było to, że oba suwaki znikały razem
 * z resztą wierszy. Ale ten kontrakt jest DZIŚ NIEAKTUALNY: 469f3152 wprowadził (na zgłoszenie
 * właściciela, 3 zrzuty ekranu) wymóg, żeby każda zakładka pokazywała WYŁĄCZNIE tematycznie
 * powiązany suwak, nigdy oba naraz na filtrowanej zakładce. Stary plik dalej przechodził po tej
 * zmianie zielono (jego regex łapie tylko syntaktyczny wzorzec `if (!onlyEconId) { ... }`, nowe
 * guardy nazywają się `if (sliderVis.showTaxSplit)` — semantycznie inny warunek), więc w repo
 * stała zielona bramka autorytatywnie twierdząca coś PRZECIWNEGO do dzisiejszego kontraktu —
 * gotowy przepis na to, żeby przyszły agent „naprawił" 469f3152 z powrotem w duplikację.
 *
 * DZISIEJSZY kontrakt (patrz gra/tools/empire-panel-econ-slider-visibility-test.cjs — pełne,
 * wykonywalne pokrycie z dowodem mutacyjnym na źródle empireDetailPanel.ts): każdy suwak musi
 * być OSIĄGALNY na co najmniej jednej zakładce (nigdy globalnie martwy) i NIGDY oba naraz na
 * zakładce filtrowanej — nie „zawsze widoczne bezwarunkowo".
 *
 * Ten plik zostaje (żeby nie tracić `Run from gra/: node tools/...` w historii commitów i
 * żeby niczyj istniejący skrypt/dyspozycja odwołujący się do tej nazwy pliku nie dostał 404),
 * ale jego asercje zostały przepisane na dzisiejszy kontrakt. Pełne, mutacyjnie dowiedzione
 * pokrycie żyje w empire-panel-econ-slider-visibility-test.cjs — traktuj TEN plik jako cienką,
 * uzupełniającą warstwę (regres b80426ff: żaden suwak nie jest globalnie nieosiągalny), nie
 * jako główne źródło prawdy.
 *
 * EN: SUPERSEDED by P-EMPIRE-PANEL-SUWAKI-DUPLIKOWANE (469f3152). The old "always visible"
 * contract is stale — today's rule is "reachable on its own tab, never both on a filtered tab",
 * enforced with mutation-proof coverage in empire-panel-econ-slider-visibility-test.cjs. This
 * file's assertions were rewritten to match; treat it as a thin supplementary regression guard
 * for the original b80426ff bug (no slider ever globally unreachable), not the source of truth.
 *
 * P-BRAMKI-EMPIRE-PODZIALPRACY-SEKCJA-ZASTALE-Q1 (2026-09-07): drugie przekotwiczenie.
 * `renderDefaultPodzialPracySection()` nie istnieje już w `gra/src` — R-DESIGN-11-ZAKLADEK faza 2
 * (Maciej, zatwierdzony refaktor) przeniósł suwak Pracy z wiersza sekcji „ZASOBY IMPERIUM" do
 * WŁASNEGO bloku top-level „praca" (`renderEmpirePracaBudgetSplitSection()`, wywołane raz w
 * `renderPracaSection()`, dołączane do `body` wyłącznie przez `if (block === 'praca') body +=
 * praca;` — nie już przez `sliderVis.showLaborSplit`, patrz pełne uzasadnienie w
 * empire-panel-econ-slider-visibility-test.cjs Wymóg 4). Asercje Pracy niżej przekotwiczone na ten
 * kształt, zachowując cel „nie globalnie martwe". OPERATOR ZALECA (DECISION_REQUIRED, nie
 * wykonano samodzielnie): ten plik pokrywa się dziś niemal 1:1 z Wymogiem 4 tamtego pliku — jego
 * jedyny unikalny wkład to Wymóg 1 (filtr `onlyEconId` na pętli `econRows`, C-PANEL=B), reszta jest
 * duplikatem o słabszym dowodzie (bez mutacji na żywym procesie). Rozważ usunięcie na rzecz
 * przeniesienia Wymogu 1 do głównej bramki.
 *
 * Run from gra/: node tools/empire-panel-sliders-always-visible-test.cjs
 */
const fs = require('fs');
const path = require('path');

const SRC_PATH = path.join(__dirname, '..', 'src', 'ui', 'empireDetailPanel.ts');
const src = fs.readFileSync(SRC_PATH, 'utf8');

let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; }
  else { fail++; console.error('FAIL:', label); }
}

// ---------------------------------------------------------------------------
// Wytnij ciało sekcji „ZASOBY IMPERIUM": od nagłówka eyebrow do stopki sekcji.
// ---------------------------------------------------------------------------
const sectionMarker = 'ZASOBY IMPERIUM (STAN + PRZYROST)';
const markerIdx = src.indexOf(sectionMarker);
ok(markerIdx >= 0, 'znaleziono nagłówek sekcji "ZASOBY IMPERIUM" w empireDetailPanel.ts');

const footMarker = 'Duża liczba = stan · zielone = netto.';
const footIdx = markerIdx >= 0 ? src.indexOf(footMarker, markerIdx) : -1;
ok(footIdx > markerIdx, 'znaleziono stopkę sekcji ZASOBY IMPERIUM (civ-emp-foot)');

const sectionBody = markerIdx >= 0 && footIdx > markerIdx ? src.slice(markerIdx, footIdx) : '';

// ---------------------------------------------------------------------------
// Wymóg 1: C-PANEL=B nienaruszone — pętla econRows nadal filtruje wiersze po onlyEconId.
// ---------------------------------------------------------------------------
ok(/if\s*\(onlyEconId\s*&&\s*r\.id\s*!==\s*onlyEconId\)\s*continue;/.test(sectionBody),
  'filtr onlyEconId nadal działa na pętli econRows (C-PANEL=B nienaruszone)');

// ---------------------------------------------------------------------------
// Wymóg 2: oba wywołania suwaków są obecne w sekcji ZASOBY IMPERIUM (osiągalne, nie usunięte
// całkiem) — ale DZIŚ pod guardem decyzji econSliderVisibilityForOnlyEconId, nie bezwarunkowo.
// ---------------------------------------------------------------------------
ok(/renderDefaultHandelSplitSection\(\)/.test(sectionBody),
  'renderDefaultHandelSplitSection() (suwak Skarbiec+Nauka) obecne w sekcji ZASOBY IMPERIUM');
// Przekotwiczone 2026-09-07 (patrz nagłówek): renderDefaultPodzialPracySection() nie istnieje już
// w src — mechanizm żyje dziś jako renderEmpirePracaBudgetSplitSection() we WŁASNYM bloku
// top-level "praca", nie jako wiersz sekcji ZASOBY IMPERIUM. Sprawdzamy więc obecność w CAŁYM
// pliku (nie sectionBody) — zachowuje cel oryginalnej asercji: suwak nie jest globalnie martwy.
ok(/renderEmpirePracaBudgetSplitSection\(\)/.test(src),
  'renderEmpirePracaBudgetSplitSection() (dawniej renderDefaultPodzialPracySection, suwak Praca) obecne w pliku (nie usunięte / nie globalnie martwe)');

// ---------------------------------------------------------------------------
// Wymóg 3 (PRZEPISANY 2026-08-12, patrz nagłówek SUPERSEDED powyżej): stary wymóg „żadne z tych
// dwóch wywołań nie może być owinięte w if(!onlyEconId)" jest dziś FAŁSZYWY jako opis kontraktu
// — DZIŚ oba wywołania SĄ warunkowe (if(sliderVis.showTaxSplit) / if(sliderVis.showLaborSplit)),
// i to jest poprawne zachowanie, nie regres. Nowy, poprawny wymóg: żaden suwak nie jest
// bezwarunkowo USUNIĘTY (globalnie martwy kod) — musi istnieć niepusty warunek bramkujący każde
// wywołanie, sterowany przez `sliderVis` (econSliderVisibilityForOnlyEconId), nie stały `false`.
// ---------------------------------------------------------------------------
ok(/if\s*\(sliderVis\.showTaxSplit\)\s*zasoby \+= renderDefaultHandelSplitSection\(\);/.test(sectionBody),
  'renderDefaultHandelSplitSection() bramkowane przez sliderVis.showTaxSplit (dzisiejszy kontrakt, nie stała false/usunięte)');
// Przekotwiczone 2026-09-07: guard dzisiaj to routing bloku (`block === 'praca'`), nie
// `sliderVis.showLaborSplit` (patrz nagłówek) — `sliderVis.showLaborSplit` samo w sobie nadal
// istnieje i jest chronione w empire-panel-econ-slider-visibility-test.cjs, ale nic w
// empireDetailPanel.ts już go nie konsumuje do bramkowania tego suwaka.
ok(/if\s*\(block === 'praca'\)\s*body \+= praca;/.test(src),
  "renderEmpirePracaBudgetSplitSection() (suwak Praca) bramkowane przez if (block === 'praca') (dzisiejszy kontrakt bloków top-level, nie stała false/usunięte)");

// Kontrola przytomności: gdyby ktoś usunął OBA wywołania całkowicie (suwaki globalnie martwe —
// regres z b80426ff w nowej postaci), powyższe dwie asercje muszą złapać to czerwono.
const deletedSection = sectionBody
  .replace('if (sliderVis.showTaxSplit) zasoby += renderDefaultHandelSplitSection();', '');
const deletedSrc = src.replace("if (block === 'praca') body += praca;", '');
const deletedStillMatches =
  /if\s*\(sliderVis\.showTaxSplit\)\s*zasoby \+= renderDefaultHandelSplitSection\(\);/.test(deletedSection)
  || /if\s*\(block === 'praca'\)\s*body \+= praca;/.test(deletedSrc);
ok(!deletedStillMatches,
  'kontrola przytomności: symulowane całkowite usunięcie obu wywołań jest wykrywalne przez ten sam regex (nie próżny test)');

console.log(`\nempire-panel-sliders-always-visible-test (SUPERSEDED, patrz nagłówek): ${pass} pass, ${fail} fail`);
process.exit(fail === 0 ? 0 : 1);
