'use strict';
/**
 * empire-religia-panel-coverage-test.cjs — Panel 11 zakladek Faza 2 (Religia).
 * Wzorzec: empire-skarbiec-panel-coverage-test.cjs (M2, Faza 1) — ta sama luka opisana przez
 * Evaluatora tam ("routing bez treści przechodzi bramki zielono") sprawdzana tu dla bloku
 * `religia`: żadna INNA bramka nie dowodzi, że `if (block === 'religia') body += religia;` w
 * `render()` (`empireDetailPanel.ts`) faktycznie DOLEWA treść do `body` — usunięcie tej linii
 * przechodziłoby przez `empire-panel-split-test.cjs` (sprawdza TYLKO routing sekcja→blok) i
 * `tsc` zielono, panel renderowałby się CAŁKOWICIE PUSTY dla klika "Religia".
 *
 * ZAKRES DOWODU (ten sam limit co M2 — `render()` w całości nie daje się zbundlować esbuildem,
 * importuje SVG/audio bez skonfigurowanych loaderów, udokumentowany limit w CLAUDE.md §BRAMKI):
 *   A. Weryfikacja strukturalna (source-text) na PRAWDZIWYM pliku — linia
 *      `if (block === 'religia') body += religia;` istnieje w bloku składania `body`.
 *   B. Dowód wykonywalny — DOSŁOWNY wycinek składania `body` (od `let body = '';` do ostatniej
 *      linii `body += handel;`) WYCIĘTY z prawdziwego pliku i URUCHOMIONY (`new Function`) z
 *      `religia` ustawionym na marker zawierający dokładnie ten sam tekst, jaki
 *      `renderReligiaSection()` faktycznie emituje (`<div class="civ-emp-eyebrow">RELIGIA
 *      IMPERIUM</div>`, zweryfikowane osobną asercją source-text) — dla `block='religia'` body
 *      MUSI zawierać ten marker i być niepuste; dla innych bloków (`'moc'`, `'all'`, `'praca'`,
 *      `'nauka'`, `'skarbiec'`) NIE MOŻE.
 *   C. Weryfikacja negatywna (mutacyjna) — ta sama linia usunięta, uruchomiona na tych samych
 *      parametrach (block='religia') — dowodzi, że test B faktycznie łapie regresję (panel
 *      pusty), a nie jest tautologią. Trwały odpowiednik ręcznej mutacji kontrolnej (usuń →
 *      czerwono → przywróć) zleconej w zadaniu — żyje w bramce, łapie regresję na stałe.
 *
 * Run from gra/: node tools/empire-religia-panel-coverage-test.cjs
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
console.log('Faza 2 (Religia) -- render(): blok "religia" faktycznie dolewa tresc do body (nie tylko routing)');
console.log('========================================================================\n');

// ---------------------------------------------------------------------------
// A. Weryfikacja strukturalna na prawdziwym pliku (source-text).
// ---------------------------------------------------------------------------
console.log('A. render(): linia "if (block === \'religia\') body += religia;" istnieje w bloku skladania body (source-text)');

const marker = '<div class="civ-emp-eyebrow">RELIGIA IMPERIUM</div>';
assert(
  'renderReligiaSection() faktycznie emituje marker "RELIGIA IMPERIUM" (kotwica markera dla dowodu B nie ucieka od prawdziwego kodu)',
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

const religiaLine = "if (block === 'religia') body += religia;";
assert(
  'wycinek zawiera "' + religiaLine + '"',
  assemblySnippet.includes(religiaLine),
);
console.log('');

// ---------------------------------------------------------------------------
// B. Dowod wykonywalny -- dosłowny wycinek skladania body URUCHOMIONY (new Function) z
//    zaslepkami tresci per blok; `religia` niesie realny marker sekcji.
// ---------------------------------------------------------------------------
console.log('B. Dowod wykonywalny -- wyciety wycinek skladania body uruchomiony z realnym markerem "RELIGIA IMPERIUM"');

function buildRunner(snippet) {
  return new Function(
    'block', 'params', 'moc', 'zasoby', 'skarbiec', 'praca', 'nauka', 'religia',
    'spichlerz', 'armia', 'kult', 'sur', 'handel',
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

const religiaMock = marker + '<div class="civ-emp-relig-name">Kult olimpijski</div>';
const mockArgsFor = (block) => [
  block, '<div>PARAMS</div>', '<div>MOC</div>', '<div>ZASOBY</div>', '<div>SKARBIEC</div>', '<div>PRACA</div>',
  '<div>NAUKA</div>', religiaMock, '<div>SPICHLERZ</div>', '<div>ARMIA</div>',
  '<div>KULT</div>', '<div>SUR</div>', '<div>HANDEL</div>',
];

const bodyReligia = safeRun('B1', runReal, mockArgsFor('religia'));
assert(
  'RDZEN: block="religia" -> body NIEPUSTE i zawiera marker "RELIGIA IMPERIUM" (dokladnie luka opisana przez wzorzec M2/Evaluatora)',
  typeof bodyReligia === 'string' && bodyReligia.length > 0 && bodyReligia.includes(marker),
  { bodyReligia },
);

for (const otherBlock of ['moc', 'all', 'praca', 'nauka', 'skarbiec']) {
  const bodyOther = safeRun('B-' + otherBlock, runReal, mockArgsFor(otherBlock));
  assert(
    `block="${otherBlock}" -> body NIE zawiera marker Religii (bloki sie nie mieszaja)`,
    typeof bodyOther === 'string' && !bodyOther.includes(marker),
    { bodyOther },
  );
}
console.log('');

// ---------------------------------------------------------------------------
// C. Weryfikacja negatywna (mutacyjna) -- linia "if (block === 'religia') body += religia;"
//    usunieta -> panel calkowicie pusty. Trwaly odpowiednik zleconej recznej mutacji
//    kontrolnej (usun -> czerwono -> przywroc).
// ---------------------------------------------------------------------------
console.log('C. Weryfikacja negatywna -- mutacja usuwajaca "body += religia;", lapana przez B1');

const mutatedSnippet = assemblySnippet.replace(
  religiaLine,
  "// MUTANT: linia 'body += religia;' usunieta -- regresja analogiczna do M2 (Skarbiec, Faza 1)",
);
assert('mutacja faktycznie zmieniła wycinek (kotwica zamiany istnieje)', mutatedSnippet !== assemblySnippet);

let runMutant = null;
try {
  runMutant = buildRunner(mutatedSnippet);
  assert('zmutowany wycinek jest syntaktycznie poprawny (regresja nie psuje samej skladni)', true);
} catch (e) {
  assert('zmutowany wycinek jest syntaktycznie poprawny (regresja nie psuje samej skladni)', false, e.message || String(e));
}

const bodyMutant = safeRun('C1', runMutant, mockArgsFor('religia'));
assert(
  'MUTANT (linia usunieta) lapany CZERWONO: block="religia" -> body PUSTE (""), NIE zawiera marker',
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
