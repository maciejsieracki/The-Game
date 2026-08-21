'use strict';
/**
 * citypanel-uwagi-abc-filter-test.cjs — P-TECH-UWAGI-WYCIEK-CITYPANEL-Q1
 *
 * Znalezisko (Final Control, przy okazji R-TECH-ULEPSZENIA-TERENU-SYNC-Q1, FALA 303):
 * `playerFacingNote()`/`isDevOnlyPlayerText()` w cityPanel.ts rozpoznawały tylko wzorce
 * PYTANIE/DECYZJA/DEC-\d{8}/„patrz unit-building-bonuses" — NIE rozpoznawały serii
 * odniesień decyzyjnych „ABC-<numer>" (np. „ABC-7:"), więc `tech.json` Brązownictwo →
 * Uwagi „kończy Epokę 1; ABC-7: Popalnia brązu na mapie" przeciekało graczowi w
 * `appendTechDetailBlock()` (panel szczegółów budynku/jednostki wymagającego tej
 * technologii). To bug filtra (nierozpoznany wzorzec), nie decyzja projektowa.
 *
 * Ten test:
 * 1. Wycina PRAWDZIWE źródło `isDevOnlyPlayerText`/`stripInlineDevAnnotations`/
 *    `playerFacingNote` z cityPanel.ts i wykonuje je (vm), żeby sprawdzić rzeczywiste
 *    zachowanie funkcji — nie tylko obecność wzorca w tekście źródła.
 * 2. Odpytuje `gra/data/tech.json` grep-em (bez zgadywania) o WSZYSTKIE wartości pola
 *    `Uwagi` zawierające znany wzorzec notatki deweloperskiej (PYTANIE/DECYZJA/DEC-\d{8}/
 *    ABC-\d+/„patrz unit-building-bonuses") i wymaga, żeby KAŻDA z nich została odrzucona
 *    przez `playerFacingNote()` (zwrot null) — regres na konkretnym wpisie
 *    Brązownictwo/„ABC-7:" i na każdym analogicznym wpisie, obecnym dziś lub dodanym
 *    później w tym samym wzorcu.
 * 3. Weryfikuje strukturalnie, że `appendTechDetailBlock()` faktycznie filtruje
 *    `t.Uwagi` przez `playerFacingNote(...)` przed wyrenderowaniem (korzeń przeoczenia z
 *    dispatcha — cityPanel.ts ma mieć TEN SAM filtr co reszta panelu, nie osobną kopię
 *    bez ABC).
 *
 * node tools/citypanel-uwagi-abc-filter-test.cjs
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const CITY_PANEL_TS = path.join(__dirname, '..', 'src', 'ui', 'cityPanel.ts');
const TECH_JSON = path.join(__dirname, '..', 'data', 'tech.json');

const src = fs.readFileSync(CITY_PANEL_TS, 'utf8');

let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; }
  else { fail++; console.error('FAIL:', label); }
}

// ---------------------------------------------------------------------------
// 1. Wytnij prawdziwe ciała isEmptyDataVal/isDevOnlyPlayerText/stripInlineDevAnnotations/
//    playerFacingNote z cityPanel.ts i wykonaj je naprawdę (vm), żeby test sprawdzał
//    RZECZYWISTE zachowanie, a nie samą obecność regexa w tekście źródła.
// ---------------------------------------------------------------------------
function extractFn(name, source) {
  const marker = `function ${name}(`;
  const start = source.indexOf(marker);
  if (start < 0) return null;
  // Znajdź otwierającą klamrę pierwszej definicji i policz zagnieżdżenie do jej zamknięcia.
  const braceStart = source.indexOf('{', start);
  if (braceStart < 0) return null;
  let depth = 0;
  for (let i = braceStart; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') {
      depth--;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  return null;
}

const isEmptyDataValSrc = extractFn('isEmptyDataVal', src);
const isDevOnlyPlayerTextSrc = extractFn('isDevOnlyPlayerText', src);
const stripInlineDevAnnotationsSrc = extractFn('stripInlineDevAnnotations', src);
const playerFacingNoteSrc = extractFn('playerFacingNote', src);

ok(!!isEmptyDataValSrc, 'znaleziono isEmptyDataVal(...) w cityPanel.ts');
ok(!!isDevOnlyPlayerTextSrc, 'znaleziono isDevOnlyPlayerText(...) w cityPanel.ts');
ok(!!stripInlineDevAnnotationsSrc, 'znaleziono stripInlineDevAnnotations(...) w cityPanel.ts');
ok(!!playerFacingNoteSrc, 'znaleziono playerFacingNote(...) w cityPanel.ts');

// Wycięte funkcje to prawdziwy TS (adnotacje typów) — `vm` chce goły JS. Te 4 funkcje mają
// wyłącznie proste adnotacje w liście parametrów i typ zwracany po `)`, więc zdejmujemy je
// mechanicznie (bez dotykania logiki/ciała funkcji) zamiast uruchamiać pełny transpiler.
function detypeFnSignature(fnSrc) {
  if (!fnSrc) return fnSrc;
  const headEnd = fnSrc.indexOf('{');
  let head = fnSrc.slice(0, headEnd);
  const body = fnSrc.slice(headEnd);
  // Typ zwracany: `) : Type {` -> `) {`
  head = head.replace(/\)\s*:\s*[^({]+$/, ')');
  // Typy parametrów: `name: Type` -> `name` (Type bez zagnieżdżonych nawiasów/przecinków).
  head = head.replace(/([A-Za-z_$][\w$]*)\s*:\s*[^,()]+(?=[,)])/g, '$1');
  return head + body;
}

const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(
  [isEmptyDataValSrc, isDevOnlyPlayerTextSrc, stripInlineDevAnnotationsSrc, playerFacingNoteSrc]
    .map(detypeFnSignature)
    .join('\n'),
  sandbox,
);

const playerFacingNote = sandbox.playerFacingNote;
const isDevOnlyPlayerText = sandbox.isDevOnlyPlayerText;
ok(typeof playerFacingNote === 'function', 'playerFacingNote wykonalne w sandboxie (vm)');
ok(typeof isDevOnlyPlayerText === 'function', 'isDevOnlyPlayerText wykonalne w sandboxie (vm)');

// ---------------------------------------------------------------------------
// 2a. Regres dokładnego przypadku ze znaleziska: Brązownictwo w tech.json.
// ---------------------------------------------------------------------------
if (playerFacingNote) {
  const brazownictwoUwagi = 'kończy Epokę 1; ABC-7: Popalnia brązu na mapie';
  ok(playerFacingNote(brazownictwoUwagi) === null,
    `Uwagi Brązownictwa ("${brazownictwoUwagi}") odrzucone przez playerFacingNote() (regres dokładnego znaleziska)`);
}

// ---------------------------------------------------------------------------
// 2b. Grep NIEZALEŻNY od zgadywania: wszystkie wartości pola "Uwagi" w tech.json
//    zawierające którykolwiek ze znanych wzorców notatki deweloperskiej muszą być
//    odrzucone przez playerFacingNote() — nie tylko literalny "ABC-7:".
// ---------------------------------------------------------------------------
const techRaw = fs.readFileSync(TECH_JSON, 'utf8');
const techData = JSON.parse(techRaw);
const devNotePatterns = [
  /^PYTANIE\s+\d+/i,
  /^DECYZJA\b/i,
  /^DEC-\d{8}/i,
  /\bpatrz\s+unit-building-bonuses/i,
  /\bABC-\d+\b/i,
];

const uwagiValues = [];
function collectUwagi(node) {
  if (Array.isArray(node)) {
    for (const v of node) collectUwagi(v);
  } else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      if (k === 'Uwagi' && typeof v === 'string') uwagiValues.push(v);
      else collectUwagi(v);
    }
  }
}
collectUwagi(techData);

ok(uwagiValues.length > 0, `znaleziono co najmniej jedno pole "Uwagi" tekstowe w tech.json (${uwagiValues.length})`);

const flaggedByGrep = uwagiValues.filter((v) => devNotePatterns.some((re) => re.test(v)));
ok(flaggedByGrep.length > 0,
  `co najmniej jedna wartość "Uwagi" w tech.json realnie zawiera wzorzec notatki deweloperskiej (znaleziono ${flaggedByGrep.length})`);
ok(flaggedByGrep.some((v) => /\bABC-\d+\b/i.test(v)),
  'wśród znalezionych wzorców jest przynajmniej jeden ABC-<numer> (dokładnie ten typ zgłoszony w dispatchu)');

if (playerFacingNote) {
  for (const v of flaggedByGrep) {
    ok(playerFacingNote(v) === null,
      `Uwagi tech.json z wzorcem dev-notatki ODRZUCONE przez playerFacingNote(): "${v}"`);
  }
}

// Kontrola przytomności: notatki BEZ żadnego znanego wzorca nadal przechodzą (nie
// nadgorliwość filtra — nie chowamy wszystkiego).
const cleanUwagi = uwagiValues.filter((v) => !devNotePatterns.some((re) => re.test(v)));
ok(cleanUwagi.length > 0, 'w tech.json są też Uwagi BEZ wzorca dev-notatki (kontrola przytomności)');
if (playerFacingNote) {
  for (const v of cleanUwagi) {
    ok(playerFacingNote(v) !== null,
      `Uwagi tech.json BEZ wzorca dev-notatki nadal przechodzi przez playerFacingNote(): "${v}"`);
  }
}

// ---------------------------------------------------------------------------
// 3. appendTechDetailBlock() musi filtrować t.Uwagi przez TEN SAM playerFacingNote(...) —
//    korzeń przeoczenia z dispatcha (cityPanel.ts miał osobną definicję filtra, ale
//    faktycznie ją wołał; ta asercja pilnuje, żeby to nadal było prawdą po każdej
//    przyszłej zmianie).
// ---------------------------------------------------------------------------
const appendTechDetailBlockSrc = extractFn('appendTechDetailBlock', src);
ok(!!appendTechDetailBlockSrc, 'znaleziono appendTechDetailBlock(...) w cityPanel.ts');
if (appendTechDetailBlockSrc) {
  ok(/playerFacingNote\(\s*t\.Uwagi\s*\)/.test(appendTechDetailBlockSrc),
    'appendTechDetailBlock() filtruje t.Uwagi przez playerFacingNote(t.Uwagi) przed wyrenderowaniem');
}

console.log(`\ncitypanel-uwagi-abc-filter-test: ${pass} pass, ${fail} fail`);
process.exit(fail === 0 ? 0 : 1);
