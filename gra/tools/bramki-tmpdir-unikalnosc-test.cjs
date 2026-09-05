'use strict';
/**
 * bramki-tmpdir-unikalnosc-test.cjs — P-BRAMKA-WSPOLDZIELONY-DIST-TMPDIR-Q1, GOAL pkt 3.
 *
 * PO CO TO ISTNIEJE (a nie: "co to sprawdza"). Bramka pisząca do katalogu o STAŁEJ nazwie
 * pod `os.tmpdir()` kłamie w OBIE strony, i oba kłamstwa kosztują tyle samo:
 *
 *  - FAŁSZYWY CZERWONY — dwa równoległe przebiegi `ai-buduje-budynki-test.cjs` (2026-09-05)
 *    czyściły sobie nawzajem `\/tmp\/civ-ai-buduje-budynki\/root-*` w locie (`rmSync` w lustrze
 *    + `--emptyOutDir` w buildzie). Oba `exit=1` w ciągu sekundy. Każe naprawiać sprawną pracę.
 *  - FAŁSZYWY ZIELONY — Evaluator CivPedia (2026-09-04) mierzył parytet baza-vs-HEAD dwoma
 *    przebiegami `wydarzenia-zbadano-karta-tech-real-render-test.cjs`, które mieszały ten sam
 *    `\/tmp\/civ-zbadano-karta-tech-dist`. "Parytet" był wtedy artefaktem kolizji, nie dowodem.
 *    Przepuszcza regres.
 *
 * Bez tej bramki 55. bramka napisana za miesiąc powtórzy ten sam błąd — dokładnie tak, jak
 * `mgla-sciezka-inwariant-test.cjs` powstał dopiero po CZWARTYM zgłoszeniu tego samego błędu.
 *
 * ZAKRES SKANU: `gra/tools/**\/*.cjs`, RAZEM Z PLIKAMI UKRYTYMI (`.smoke-*.cjs`). To nie jest
 * detal: rekonesans tematu robiono komendą `grep -rl "os.tmpdir()" gra/tools/*.cjs`, a powłokowy
 * glob `*.cjs` NIE łapie kropkowych nazw — pięć śledzonych w gicie plików `.smoke-*.cjs`
 * (wszystkie piszące do wspólnego `\/tmp\/smoke_bundle_eval.js`, tego samego co `smoke.cjs`)
 * było przez to niewidoczne dla audytu. Ta bramka ich nie gubi.
 *
 * TRZY REGUŁY (każda z realnego przypadku w tym repo, nie z teorii):
 *   R1  stała nazwa dosłowna: `path.join(os.tmpdir(), 'civ-cos-dist')` — wzorzec obu incydentów.
 *   R2  KORZEŃ katalogu tymczasowego jako cel zapisu: `= os.tmpdir()` / `|| os.tmpdir()`.
 *       Stąd biorą się zrzuty o stałych nazwach lądujące wprost w `\/tmp` (`recruit-*-test.cjs`).
 *   R3  nazwa ze zmiennej w pliku BEZ jakiegokolwiek znacznika per-przebieg:
 *       `path.join(os.tmpdir(), outName)` — wzorzec `weterani-test.cjs` i trzech pokrewnych.
 *
 * WZORZEC BEZPIECZNY, którego bramka NIE zgłasza (i którego nie wolno "poprawiać"):
 *   `fs.mkdtempSync(path.join(os.tmpdir(), 'prefix-'))` — unikalny z definicji kontraktu Node.
 *   Tak samo bezpieczne: nazwa zawierająca `process.pid`, `Math.random()` albo `TMPDIR_RUN_ID`.
 *
 * Bramka (z katalogu gra/): node tools/bramki-tmpdir-unikalnosc-test.cjs
 * Czas: poniżej sekundy — sam odczyt plików, zero buildu, zero przeglądarki.
 */

const fs = require('fs');
const path = require('path');

const TOOLS_DIR = __dirname;

/** Wyrażenie dające katalog tymczasowy w obu spotykanych w repo notacjach. */
const TMPDIR_CALL = String.raw`(?:os\.tmpdir\(\)|require\((?:'os'|"os")\)\.tmpdir\(\))`;
/** Znaczniki, które czynią nazwę unikalną per przebieg. */
const UNIQUE_MARK = /process\.pid|Math\.random|TMPDIR_RUN_ID|TMPDIR_RUN_DIR/;

let pass = 0;
let fail = 0;
const findings = [];
function check(label, cond, detail) {
  if (cond) { pass++; console.log('  OK   ' + label); }
  else { fail++; console.error('  FAIL ' + label + (detail !== undefined ? ' -- ' + detail : '')); }
}

/** Wszystkie `.cjs` w `tools/` i podkatalogach — ŁĄCZNIE z kropkowymi (glob `*.cjs` je gubi). */
function listCjs(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) { out.push(...listCjs(p)); continue; }
    if (ent.isFile() && ent.name.endsWith('.cjs')) out.push(p);
  }
  return out;
}

/** Linia będąca w całości komentarzem — opis wzorca nie jest jego użyciem. */
function isCommentLine(line) {
  const t = line.trim();
  return t.startsWith('//') || t.startsWith('*') || t.startsWith('/*');
}

/**
 * Wycina argument nazwy z `path.join(<tmpdir>, ARG)` — z liczeniem nawiasów, bo ARG bywa
 * wyrażeniem (`\`x-${id}\``, `a + b`, wywołaniem). Zwraca null, gdy to nie ta forma.
 */
function nameArgAfter(src, idxAfterTmpdirCall) {
  let i = idxAfterTmpdirCall;
  while (i < src.length && /\s/.test(src[i])) i++;
  if (src[i] !== ',') return null;
  i++;
  let depth = 0;
  const start = i;
  for (; i < src.length; i++) {
    const c = src[i];
    if (c === '(' || c === '[' || c === '{') depth++;
    else if (c === ']' || c === '}') depth--;
    else if (c === ')') { if (depth === 0) return src.slice(start, i).trim(); depth--; }
  }
  return null;
}

const files = listCjs(TOOLS_DIR).sort();
check('skan objął jakiekolwiek pliki .cjs w tools/', files.length > 0, files.length);

let scanned = 0;
for (const file of files) {
  const rel = path.relative(TOOLS_DIR, file);
  const src = fs.readFileSync(file, 'utf8');
  if (!src.includes('tmpdir')) continue;
  scanned++;
  const lines = src.split('\n');
  const fileHasUniqueMark = UNIQUE_MARK.test(src) || src.includes('mkdtempSync');

  // --- R1 + R3: `path.join|resolve(<tmpdir>, ARG)` -------------------------------------
  const joinRe = new RegExp(String.raw`path\.(?:join|resolve)\(\s*` + TMPDIR_CALL + String.raw`\s*\)?`, 'g');
  // (uwaga: dopasowujemy do domkniecia wywolania tmpdir, dalej idzie recznie liczony ARG)
  const callRe = new RegExp(String.raw`path\.(?:join|resolve)\(\s*` + TMPDIR_CALL, 'g');
  void joinRe;
  let m;
  while ((m = callRe.exec(src)) !== null) {
    const lineNo = src.slice(0, m.index).split('\n').length;
    const line = lines[lineNo - 1];
    if (isCommentLine(line)) continue;
    // Wzorzec BEZPIECZNY: cale wywolanie opakowane w fs.mkdtempSync(...).
    const before = src.slice(Math.max(0, m.index - 20), m.index);
    if (/mkdtempSync\(\s*$/.test(before)) continue;

    const arg = nameArgAfter(src, m.index + m[0].length);
    if (arg === null) continue;
    if (UNIQUE_MARK.test(arg)) continue;

    const isLiteral = /^'[^']*'$/.test(arg) || /^"[^"]*"$/.test(arg) || (/^`[^`]*`$/.test(arg) && !arg.includes('${'));
    if (isLiteral) {
      findings.push({ rule: 'R1', rel, lineNo, arg, line: line.trim() });
    } else if (!fileHasUniqueMark) {
      findings.push({ rule: 'R3', rel, lineNo, arg, line: line.trim() });
    }
  }

  // --- R2: KORZEN os.tmpdir() wprost jako cel zapisu ------------------------------------
  const rootRe = new RegExp(String.raw`(?:=|\|\|)\s*` + TMPDIR_CALL + String.raw`\s*;`, 'g');
  while ((m = rootRe.exec(src)) !== null) {
    const lineNo = src.slice(0, m.index).split('\n').length;
    const line = lines[lineNo - 1];
    if (isCommentLine(line)) continue;
    findings.push({ rule: 'R2', rel, lineNo, arg: '(korzen os.tmpdir())', line: line.trim() });
  }
}

check('skan objął pliki używające tmpdir', scanned > 0, scanned);

if (findings.length > 0) {
  console.error('\n=== STALE (nieunikalne) sciezki pod os.tmpdir() ===');
  for (const f of findings) {
    console.error(`  [${f.rule}] ${f.rel}:${f.lineNo}  ${f.arg}`);
    console.error(`         ${f.line}`);
  }
  console.error('\nNaprawa: nazwa MUSI byc unikalna per przebieg — `fs.mkdtempSync(path.join(os.tmpdir(),');
  console.error('\'prefiks-\'))` albo sufiks z `process.pid` + losowym. Sprzatanie po sobie ZOSTAJE:');
  console.error('unikalnosc bez kasowania zamienia kolizje w staly wyciek dysku.\n');
}

check('zadna bramka w tools/ nie pisze do STALEJ nazwy pod os.tmpdir()',
  findings.length === 0, findings.length === 0 ? undefined : findings.length + ' trafien');

console.log(`\n[bramki-tmpdir-unikalnosc-test] przeskanowano ${scanned} plikow z tmpdir (z ${files.length} .cjs)`);
console.log(`[bramki-tmpdir-unikalnosc-test] PASS=${pass} FAIL=${fail}`);
process.exit(fail === 0 ? 0 : 1);
