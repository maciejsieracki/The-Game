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
 * SZEŚĆ REGUŁ — jedna rodzina błędu w sześciu notacjach, każda z realnego przypadku w tym
 * repo albo ze zmierzonej ucieczki mutacyjnej, nie z teorii:
 *   R1  stała nazwa dosłowna: `path.join(os.tmpdir(), 'civ-cos-dist')` — wzorzec obu incydentów.
 *   R2  KORZEŃ katalogu tymczasowego jako cel zapisu: `= os.tmpdir()` / `|| os.tmpdir()`.
 *       Stąd biorą się zrzuty o stałych nazwach lądujące wprost w `\/tmp` (`recruit-*-test.cjs`).
 *   R3  nazwa ZE ZMIENNEJ: `path.join(os.tmpdir(), outName)` — wzorzec `weterani-test.cjs`
 *       i trzech pokrewnych. Rozstrzyga WYŁĄCZNIE treść argumentu: znacznik unikalności
 *       gdziekolwiek indziej w pliku nie czyni tej ścieżki unikalną — historia tej pułapki
 *       (Final Control rundy 1 wstawił z powrotem oryginalny defekt, bramka została zielona)
 *       stoi w komentarzu przy gałęzi R3 w kodzie, niżej.
 *   R4  konkatenacja `os.tmpdir() + '/nazwa'` — forma równoważna R1, niewidoczna dla `path.join`.
 *       Łapie też wariant owinięty w szablon: `` `${os.tmpdir()}` + '/nazwa' ``.
 *   R5  DOSŁOWNA ścieżka `\/tmp\/...`, w pliku, który `os.tmpdir()` może nigdy nie wywołać.
 *   R6  interpolacja `` `${os.tmpdir()}/nazwa` `` w szablonie — forma, której nie widzi
 *       żadna z R1-R5, a dziś najzwyklejszy sposób zapisu tej ścieżki.
 *
 * ZASIĘG TŁUMIKA (R4 i R6): znacznik unikalności zwalnia ze zgłoszenia tylko wtedy, gdy stoi
 * w SAMYM WYRAŻENIU ŚCIEŻKI — nie „gdziekolwiek w tej samej linii". To ta sama klasa błędu,
 * którą runda 2 usunęła z R3 (tam tłumik działał na poziomie CAŁEGO PLIKU): `` `${os.tmpdir()}
 * /civ-x` ``; `console.log(process.pid);` w jednej linii zostawiało bramkę zieloną, bo `pid`
 * użyty z zupełnie innego powodu wyciszał zgłoszenie.
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

/**
 * Jedyne dopuszczone DOSLOWNE sciezki `/tmp/...` — kazda z powodem, wzorem jawnej
 * whitelisty `mgla-sciezka-inwariant-test.cjs`. Wpis wolno dodac TYLKO dla sciezki
 * czytanej, nigdy zapisywanej: wejscie moze byc wspoldzielone, bo dwa przebiegi
 * czytajace ten sam katalog sobie nie przeszkadzaja. Kazdy CEL ZAPISU musi byc
 * unikalny per przebieg i whitelisty nie dostanie.
 */
const TMP_LITERAL_WHITELIST = {
  // domyslne WEJSCIE: rozpakowany wczesniej stan bazowy, tylko odczyt (nadpisywalne env-em)
  'ev4-kryteria-check.cjs::/tmp/ev4-przed-r3/gra/src': true,
  // domyslne WEJSCIE analizy: katalog raportu wyprodukowanego wczesniej przez inne narzedzie
  'wojny-kamien-ev-analiza.cjs::/tmp/ev-out': true,
  'wojny-zelazo-analiza.cjs::/tmp/zelazo-out': true,
  // domyslne WEJSCIE: rozpakowany checkout stanu pre-main, wylacznie odczyt
  'miasta-panstwa-wylaczone-test.cjs::/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/pre-main/gra': true,
};

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

/** Rozbicie listy argumentow po przecinkach NAJWYZSZEGO poziomu. */
function splitTopLevel(argSrc) {
  const out = []; let depth = 0, cur = '', instr = null;
  for (let i = 0; i < argSrc.length; i++) {
    const c = argSrc[i];
    if (instr) {
      cur += c;
      if (c === '\\') { cur += argSrc[++i] || ''; continue; }
      if (c === instr) instr = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { instr = c; cur += c; continue; }
    if (c === '(' || c === '[' || c === '{') depth++;
    else if (c === ')' || c === ']' || c === '}') depth--;
    if (c === ',' && depth === 0) { out.push(cur.trim()); cur = ''; continue; }
    cur += c;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/** Czy wyrazenie jest STALYM literalem tekstowym (bez interpolacji)? */
function isLiteralExpr(e) {
  return /^'[^']*'$/.test(e) || /^"[^"]*"$/.test(e) || (/^`[^`]*`$/.test(e) && !e.includes('${'));
}

/**
 * Segment sciezki tuz po `${tmpdir}` W SZABLONIE: do pierwszej spacji, backticka albo
 * cudzyslowu na ZEROWYM poziomie zagniezdzenia `${...}` (zeby `-${process.pid}` zostalo
 * w srodku, a `\` console.log(process.pid)` juz nie). To jest cale wyrazenie sciezki
 * i tylko na nim wolno pytac o znacznik unikalnosci.
 */
function templateSegmentAfter(rest) {
  let depth = 0;
  let out = '';
  for (let i = 0; i < rest.length; i++) {
    const c = rest[i];
    if (c === '$' && rest[i + 1] === '{') { depth++; out += '${'; i++; continue; }
    if (c === '}' && depth > 0) { depth--; out += c; continue; }
    if (depth === 0 && (/\s/.test(c) || c === '`' || c === "'" || c === '"')) break;
    out += c;
  }
  return out;
}

/** Reszta INSTRUKCJI po `os.tmpdir() +` — do pierwszego `;` poza literalem tekstowym. */
function statementRestOf(rest) {
  let instr = null;
  for (let i = 0; i < rest.length; i++) {
    const c = rest[i];
    if (instr) {
      if (c === '\\') { i++; continue; }
      if (c === instr) instr = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { instr = c; continue; }
    if (c === ';') return rest.slice(0, i);
  }
  return rest;
}

let scanned = 0;
for (const file of files) {
  const rel = path.relative(TOOLS_DIR, file);
  const src = fs.readFileSync(file, 'utf8');
  const lines = src.split('\n');

  // --- R5: DOSLOWNA sciezka '/tmp/...' — klasa CALKOWICIE poza zasiegiem R1-R4 ----------
  // Plik moze nigdy nie wywolac os.tmpdir() i mimo to pisac do wspoldzielonego katalogu
  // (np. `const OUT_DIR = '/tmp/civ-dist-...'` + `--emptyOutDir`). Dlatego ta regula
  // dziala na KAZDYM pliku, nie tylko na tych z `tmpdir` — inaczej audyt oparty na
  // `grep os.tmpdir()` nie zobaczylby ich nigdy, tak jak nie zobaczyl za pierwszym razem.
  const litRe = /(['"`])\/tmp\/([^'"`\n]*)\1/g;
  let lm;
  while ((lm = litRe.exec(src)) !== null) {
    const lineNo = src.slice(0, lm.index).split('\n').length;
    const line = lines[lineNo - 1];
    if (isCommentLine(line)) continue;
    // (bez literalu '/tmp/' w tym miejscu — inaczej detektor zglaszalby sam siebie)
    const full = lm[0].slice(1, -1);
    if (UNIQUE_MARK.test(line)) continue;              // nazwa juz uzmienniona w tej linii
    if (TMP_LITERAL_WHITELIST[rel + '::' + full]) continue;   // wejscie tylko-do-odczytu
    findings.push({ rule: 'R5', rel, lineNo, arg: full, line: line.trim() });
  }

  if (!src.includes('tmpdir')) continue;
  scanned++;
  // Swiadomie NIE liczymy tu zadnego znacznika „na poziomie pliku" — patrz komentarz przy R3.

  // --- R1 + R3: `path.join|resolve(<tmpdir>, ARG...)` ----------------------------------
  const callRe = new RegExp(String.raw`path\.(?:join|resolve)\(\s*` + TMPDIR_CALL, 'g');
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

    // `path.join(tmpdir, 'a', 'b')` to nadal STALA sciezka. Liczy sie kazdy segment:
    // gdyby patrzec tylko na pierwszy argument jako calosc, forma wieloargumentowa
    // wpadalaby do R3 i znikala w kazdym pliku majacym gdziekolwiek znacznik unikalnosci.
    const segs = splitTopLevel(arg);
    const allLiteral = segs.length > 0 && segs.every(isLiteralExpr);
    if (allLiteral) {
      findings.push({ rule: 'R1', rel, lineNo, arg, line: line.trim() });
    } else {
      // Runda 1 miala tu `else if (!fileHasUniqueMark)` — warunek NA POZIOMIE CALEGO PLIKU.
      // Po naprawie 57 plikow kazdy z nich ma gdzies znacznik unikalnosci, wiec R3 byla
      // w nich MARTWA: wstawienie z powrotem oryginalnego defektu (`path.join(os.tmpdir(),
      // outName)` w `weterani-test.cjs:75`) zostawialo bramke ZIELONA. Zabezpieczenie przed
      // nawrotem chronilo wylacznie dopoty, dopoki nawrotu nie bylo. Znacznik gdziekolwiek
      // indziej w pliku NIE uzmiennia tej konkretnej sciezki — liczy sie wylacznie ARG.
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

  // --- R4: KONKATENACJA `os.tmpdir() + '/nazwa'` ----------------------------------------
  // Forma rownowazna R1, ktorej `path.join` nie widzi. Bez tej reguly nowa bramka pisze
  // do wspoldzielonego katalogu i przechodzi na zielono — czyli scenariusz "55. bramka
  // za miesiac" nie jest zatrzymany, a to jest cala racja istnienia tej bramki.
  // Owiniecie w szablon (`` `${os.tmpdir()}` + '/nazwa' ``) to nadal ta sama konkatenacja:
  // bez tej alternatywy zapis wpadal w SZCZELINE miedzy R4 a R6 — dla R6 po `}` stal backtick
  // zamiast `/`, dla R4 po `os.tmpdir()` stal `}` zamiast `+`, wiec przechodzil na zielono.
  const concatRe = new RegExp(
    '(?:`\\$\\{\\s*' + TMPDIR_CALL + '\\s*\\}`|' + TMPDIR_CALL + ')' + String.raw`\s*\+\s*`, 'g');
  while ((m = concatRe.exec(src)) !== null) {
    const lineNo = src.slice(0, m.index).split('\n').length;
    const line = lines[lineNo - 1];
    if (isCommentLine(line)) continue;
    // Reszta INSTRUKCJI (do `;`), nie reszta linii: znacznik postawiony za srednikiem,
    // w zupelnie innym wyrazeniu, nie uzmiennia tej sciezki i nie moze tlumic zgloszenia.
    const rest = statementRestOf(src.slice(m.index + m[0].length).split('\n')[0]);
    if (UNIQUE_MARK.test(rest)) continue;
    findings.push({ rule: 'R4', rel, lineNo, arg: rest.trim().slice(0, 60), line: line.trim() });
  }

  // --- R6: INTERPOLACJA `${<tmpdir>}/nazwa` w szablonie --------------------------------
  // SZOSTA regula, szosta notacja TEJ SAMEJ rodziny — i jedyna, ktorej nie widzi zadna z R1-R5: R1/R3 patrza
  // wylacznie na `path.join|resolve`, R2 na korzen po `=`/`||`, R4 na konkatenacje `+`,
  // a R5 na DOSLOWNY literal sciezki tymczasowej. Zapis `--outDir ${...}/civ-cos-dist`
  // nie jest zadnym z nich — a to najzwyklejszy wspolczesny sposob sklejenia tej sciezki,
  // czyli doslownie scenariusz „55. bramka za miesiac", dla ktorego ta bramka istnieje.
  const interpRe = new RegExp(String.raw`\$\{\s*` + TMPDIR_CALL + String.raw`\s*\}`, 'g');
  while ((m = interpRe.exec(src)) !== null) {
    const lineNo = src.slice(0, m.index).split('\n').length;
    const line = lines[lineNo - 1];
    if (isCommentLine(line)) continue;
    // Liczy sie WYLACZNIE uzycie jako PREFIKS sciezki (`}/nazwa`). Samo `${...}` bez
    // segmentu za nim (koniec szablonu, spacja, przecinek) nie wskazuje nowego celu zapisu
    // — to korzen, ktory ma juz swoja regule R2, i podwojne zgloszenie tylko szumi.
    const rest = src.slice(m.index + m[0].length).split('\n')[0];
    if (!rest.startsWith('/')) continue;
    // Pytamy o znacznik WYLACZNIE w segmencie sciezki, nie w calej reszcie linii:
    // `}/civ-x-${process.pid}` jest unikalne, ale `}/civ-x`; console.log(process.pid);`
    // juz NIE — a stara wersja tlumila oba tak samo.
    const seg = templateSegmentAfter(rest);
    if (UNIQUE_MARK.test(seg)) continue;
    findings.push({ rule: 'R6', rel, lineNo, arg: rest.trim().slice(0, 60), line: line.trim() });
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
