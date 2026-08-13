'use strict';
/**
 * empire-skarbiec-panel-coverage-test.cjs — M2 (Panel 11 zakladek Faza 1 - Skarbiec, 6afdde92,
 * Evaluator: PASS-WITH-NOTES, luka pokrycia).
 *
 * Luka opisana przez Evaluatora: żadna bramka nie sprawdzała, że blok `skarbiec` w `render()`
 * (`empireDetailPanel.ts`) faktycznie DOLEWA treść do `body` — usunięcie
 * `if (block === 'skarbiec') body += skarbiec;` przechodziło przez wszystkie 6 bramek zielono
 * (panel renderuje się CAŁKOWICIE PUSTY, niewykryte). `empire-panel-split-test.cjs` sprawdza
 * TYLKO routing (`empirePanelBlockForSection('econ-skarbiec') === 'skarbiec'`), nie treść.
 *
 * ZAKRES DOWODU (uczciwie, ten sam limit co `empire-panel-moc-scroll-preserve-test.cjs` — patrz
 * jego nagłówek): `render()` w całości nie daje się zbundlować esbuildem (importuje SVG/audio
 * bez skonfigurowanych loaderów w tym harnessie, udokumentowany limit w CLAUDE.md §BRAMKI). Więc:
 *   A. Weryfikacja strukturalna (source-text) na PRAWDZIWYM pliku — linia
 *      `if (block === 'skarbiec') body += skarbiec;` istnieje w bloku składania `body`.
 *   B. Dowód wykonywalny — DOSŁOWNY wycinek składania `body` (od `let body = '';` do ostatniej
 *      linii `body += handel;`) WYCIĘTY z prawdziwego pliku i URUCHOMIONY (`new Function`) z
 *      `skarbiec` ustawionym na marker zawierający dokładnie ten sam tekst, jaki
 *      `renderSkarbiecSection()` faktycznie emituje (`<div class="civ-emp-eyebrow">SKARBIEC
 *      IMPERIUM</div>`, zweryfikowane osobną asercją source-text, żeby marker nie „uciekł" od
 *      rzeczywistego kodu) — dla `block='skarbiec'` body MUSI zawierać ten marker i być
 *      niepuste; dla innych bloków (`'moc'`, `'all'`) NIE MOŻE.
 *   C. Weryfikacja negatywna (mutacyjna) — dokładnie scenariusz z opisu Evaluatora: ta sama
 *      wycięta logika, ale z USUNIĘTĄ linią `if (block === 'skarbiec') body += skarbiec;",
 *      uruchomiona na tych samych parametrach (block='skarbiec') — dowodzi, że test B faktycznie
 *      łapie regresję (panel pusty), a nie jest tautologią. To JEST trwały odpowiednik ręcznej
 *      mutacji kontrolnej zleconej w zadaniu (usuń → potwierdź czerwono → przywróć) — żyje w
 *      bramce, więc łapie regresję na stałe, nie tylko raz przy tym zleceniu.
 *
 * Run from gra/: node tools/empire-skarbiec-panel-coverage-test.cjs
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

function safeRun(label, runner, args) {
  if (!runner) {
    assert(label + ': runner dostepny (wycinek zbudowany)', false, 'runner is null');
    return null;
  }
  try {
    return runner(...args);
  } catch (e) {
    assert(label + ': wykonanie nie rzucilo wyjatku', false, e.message || String(e));
    return null;
  }
}

console.log('========================================================================');
console.log('M2 -- render(): blok "skarbiec" faktycznie dolewa tresc do body (nie tylko routing)');
console.log('========================================================================\n');

// ---------------------------------------------------------------------------
// A. Weryfikacja strukturalna na prawdziwym pliku (source-text).
// ---------------------------------------------------------------------------
console.log('A. render(): linia "if (block === \'skarbiec\') body += skarbiec;" istnieje w bloku skladania body (source-text)');

const marker = '<div class="civ-emp-eyebrow">SKARBIEC IMPERIUM</div>';
assert(
  'renderSkarbiecSection() faktycznie emituje marker "SKARBIEC IMPERIUM" (kotwica markera dla dowodu B nie ucieka od prawdziwego kodu)',
  panelSrc.includes(marker),
);

const bodyStartIdx = panelSrc.indexOf("let body = '';");
assert('znaleziono "let body = \'\';"', bodyStartIdx > -1);
const bodyEndAnchor = "if (block === 'all' || block === 'handel') body += handel;";
const bodyEndIdx = bodyStartIdx > -1 ? panelSrc.indexOf(bodyEndAnchor, bodyStartIdx) : -1;
assert('znaleziono koniec wycinka skladania body (kotwica ostatniej linii "body += handel;")', bodyEndIdx > bodyStartIdx);
const assemblySnippet = (bodyStartIdx > -1 && bodyEndIdx > bodyStartIdx)
  ? panelSrc.slice(bodyStartIdx, bodyEndIdx + bodyEndAnchor.length)
  : '';
assert('wycinek skladania body nie jest pusty (jest co uruchomic)', assemblySnippet.length > 50, assemblySnippet.length);

const skarbiecLine = "if (block === 'skarbiec') body += skarbiec;";
assert(
  'wycinek zawiera "' + skarbiecLine + '"',
  assemblySnippet.includes(skarbiecLine),
);
console.log('');

// ---------------------------------------------------------------------------
// B. Dowod wykonywalny -- dosłowny wycinek skladania body URUCHOMIONY (new Function) z
//    zaslepkami tresci per blok; `skarbiec` niesie realny marker sekcji.
// ---------------------------------------------------------------------------
console.log('B. Dowod wykonywalny -- wyciety wycinek skladania body uruchomiony z realnym markerem "SKARBIEC IMPERIUM"');

function buildRunner(snippet) {
  return new Function(
    'block', 'params', 'moc', 'zasoby', 'skarbiec', 'spichlerz', 'armia', 'kult', 'sur', 'handel',
    snippet + '\nreturn body;',
  );
}

let runReal = null;
try {
  runReal = buildRunner(assemblySnippet);
  assert('wycinek jest syntaktycznie poprawnym JS po wycieciu (new Function nie rzuca)', true);
} catch (e) {
  assert('wycinek jest syntaktycznie poprawnym JS po wycieciu (new Function nie rzuca)', false, e.message || String(e));
}

const skarbiecMock = marker + '<div class="civ-emp-hero pos">Netto +5 / turę</div>';
const mockArgsFor = (block) => [
  block, '<div>PARAMS</div>', '<div>MOC</div>', '<div>ZASOBY</div>', skarbiecMock,
  '<div>SPICHLERZ</div>', '<div>ARMIA</div>', '<div>KULT</div>', '<div>SUR</div>', '<div>HANDEL</div>',
];

const bodySkarbiec = safeRun('B1', runReal, mockArgsFor('skarbiec'));
assert(
  'M2 RDZEN: block="skarbiec" -> body NIEPUSTE i zawiera marker "SKARBIEC IMPERIUM" (dokladnie luka opisana przez Evaluatora)',
  typeof bodySkarbiec === 'string' && bodySkarbiec.length > 0 && bodySkarbiec.includes(marker),
  { bodySkarbiec },
);

const bodyMoc = safeRun('B2', runReal, mockArgsFor('moc'));
assert(
  'block="moc" -> body NIE zawiera marker Skarbca (bloki sie nie mieszaja)',
  typeof bodyMoc === 'string' && !bodyMoc.includes(marker),
  { bodyMoc },
);

const bodyAll = safeRun('B3', runReal, mockArgsFor('all'));
assert(
  'block="all" -> body NIE zawiera marker Skarbca (Skarbiec to WŁASNY blok top-level, nie czesc "all", R-DESIGN-11-ZAKLADEK faza 1)',
  typeof bodyAll === 'string' && !bodyAll.includes(marker),
  { bodyAll },
);
console.log('');

// ---------------------------------------------------------------------------
// C. Weryfikacja negatywna (mutacyjna) -- dokladnie regresja z opisu Evaluatora: linia
//    "if (block === 'skarbiec') body += skarbiec;" usunieta -> panel calkowicie pusty.
//    Trwaly odpowiednik zleconej recznej mutacji kontrolnej (usun -> czerwono -> przywroc).
// ---------------------------------------------------------------------------
console.log('C. Weryfikacja negatywna -- mutacja usuwajaca "body += skarbiec;", lapana przez B1');

const mutatedSnippet = assemblySnippet.replace(
  skarbiecLine,
  "// MUTANT M2: linia 'body += skarbiec;' usunieta -- dokladnie regresja opisana przez Evaluatora",
);
assert('mutacja faktycznie zmienila wycinek (kotwica zamiany istnieje)', mutatedSnippet !== assemblySnippet);

let runMutant = null;
try {
  runMutant = buildRunner(mutatedSnippet);
  assert('zmutowany wycinek jest syntaktycznie poprawny (regresja nie psuje samej skladni)', true);
} catch (e) {
  assert('zmutowany wycinek jest syntaktycznie poprawny (regresja nie psuje samej skladni)', false, e.message || String(e));
}

const bodyMutant = safeRun('C1', runMutant, mockArgsFor('skarbiec'));
assert(
  'MUTANT (linia usunieta) lapany CZERWONO: block="skarbiec" -> body PUSTE ("" ), NIE zawiera marker -- dokladnie "panel calkowicie pusty" z opisu Evaluatora',
  bodyMutant === '',
  { bodyMutant },
);
console.log('');

console.log('========================================================================');
if (fail === 0) {
  console.log(`OK (${pass}/${pass})`);
  process.exit(0);
} else {
  console.log(`FAILED: ${pass} passed, ${fail} failed`);
  process.exit(1);
}
