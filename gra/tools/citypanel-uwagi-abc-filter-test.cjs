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
 * RUNDA 2 — REGRES rundy 1: rozpoznawanie „ABC-<numer>" dodano w rundzie 1 do
 * `isDevOnlyPlayerText()` (funkcja odrzucająca CAŁĄ notatkę → null), co dla Brązownictwa
 * usuwało graczowi TAKŻE legalną część „kończy Epokę 1", nie tylko dev-adnotację
 * „ABC-7: ...". Naprawa rundy 2: rozpoznawanie wzorca „ABC-<numer>:" (z otaczającą
 * interpunkcją, aż do końca zdania/stringa) przeniesione do `stripInlineDevAnnotations()`
 * (funkcja WYCINAJĄCA tylko adnotację, zachowująca resztę notatki) — dla notatek
 * CAŁKOWICIE devowych (np. same PYTANIE/DECYZJA/DEC-...) `isDevOnlyPlayerText()` nadal
 * zwraca null; dla notatek MIESZANYCH (legalny tekst + „ABC-...:") `playerFacingNote()`
 * ma teraz zwracać niepusty string z samą legalną częścią.
 *
 * Ten test:
 * 1. Wycina PRAWDZIWE źródło `isDevOnlyPlayerText`/`stripInlineDevAnnotations`/
 *    `playerFacingNote` z cityPanel.ts i wykonuje je (vm), żeby sprawdzić rzeczywiste
 *    zachowanie funkcji — nie tylko obecność wzorca w tekście źródła.
 * 2. Odpytuje `gra/data/tech.json` grep-em (bez zgadywania) o WSZYSTKIE wartości pola
 *    `Uwagi` zawierające znany wzorzec notatki deweloperskiej (PYTANIE/DECYZJA/DEC-\d{8}/
 *    ABC-\d+/„patrz unit-building-bonuses") i sprawdza oczekiwane zachowanie:
 *    - wpisy CAŁKOWICIE dev-owe → `playerFacingNote()` zwraca null;
 *    - wpis MIESZANY (Brązownictwo/„ABC-7:") → `playerFacingNote()` zwraca niepusty
 *      string zawierający legalną część, BEZ fragmentu „ABC-7".
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
//
// RUNDA 2: notatka MIESZANA (legalny tekst „kończy Epokę 1" + dev-adnotacja
// „ABC-7: ..."). playerFacingNote() MUSI zwrócić niepusty string z legalną częścią,
// BEZ fragmentu ABC-7 — NIE null (to był regres rundy 1: cała notatka znikała).
// ---------------------------------------------------------------------------
if (playerFacingNote) {
  const brazownictwoUwagi = 'kończy Epokę 1; ABC-7: Popalnia brązu na mapie';
  const result = playerFacingNote(brazownictwoUwagi);
  ok(result !== null,
    `Uwagi Brązownictwa ("${brazownictwoUwagi}") NIE są odrzucone w całości przez playerFacingNote() (regres rundy 1: legalna część "kończy Epokę 1" ma zostać)`);
  ok(result === 'kończy Epokę 1',
    `playerFacingNote() zwraca dokładnie legalną część "kończy Epokę 1" (otrzymano: ${JSON.stringify(result)})`);
  ok(typeof result === 'string' && !/ABC-7/i.test(result),
    `playerFacingNote() NIE zawiera fragmentu "ABC-7" w wyniku (otrzymano: ${JSON.stringify(result)})`);
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

// Wzorce, dla których CAŁA notatka ma zniknąć (nie ma legalnej reszty do pokazania).
// „ABC-<numer>" NIE jest tu, bo w danych współistnieje z legalnym tekstem (Brązownictwo)
// — dla niego oczekiwane jest wycięcie SAMEJ adnotacji, nie całej notatki (runda 2).
const wholeNoteDevPatterns = [
  /^PYTANIE\s+\d+/i,
  /^DECYZJA\b/i,
  /^DEC-\d{8}/i,
  /\bpatrz\s+unit-building-bonuses/i,
];

if (playerFacingNote) {
  for (const v of flaggedByGrep) {
    const result = playerFacingNote(v);
    if (wholeNoteDevPatterns.some((re) => re.test(v))) {
      ok(result === null,
        `Uwagi tech.json CAŁKOWICIE dev-owe ODRZUCONE (null) przez playerFacingNote(): "${v}"`);
    } else if (/\bABC-\d+\b/i.test(v)) {
      ok(result !== null,
        `Uwagi tech.json z ABC-<numer> WSPÓŁISTNIEJĄCYM z legalnym tekstem NIE są odrzucone w całości: "${v}" -> ${JSON.stringify(result)}`);
      ok(typeof result === 'string' && !/\bABC-\d+\b/i.test(result),
        `playerFacingNote() usuwa fragment ABC-<numer> z wyniku: "${v}" -> ${JSON.stringify(result)}`);
    }
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
