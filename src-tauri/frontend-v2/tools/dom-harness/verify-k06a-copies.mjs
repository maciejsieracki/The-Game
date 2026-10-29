#!/usr/bin/env node
/**
 * verify-k06a-copies.mjs — bramka wierności KOPII tekstowych K06A (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K06A-Q1, runda 2).
 *
 * Wzorzec: `verify-k05a-copies.mjs`. Każdy blok w `src/ui/cityPanel/k06a-fundament.ts` jest poprzedzony markerem
 * `// pin edb8fb56 gra/src/<plik>:A-B` (WYŁĄCZNIE ten format, bez dopisków); treść bloku (do następnego markera lub
 * końca pliku) musi odpowiadać liniom A..B pinu, łącznie z komentarzami dokumentacyjnymi.
 *
 * Dozwolone różnice (każda jawnie wymieniona, nie ma różnic ukrytych):
 *   - `export ` na początku linii (po obu stronach);
 *   - tokeny lokalnych kopie typów (K06A-Z5): `CityK06` → `City`, `HexK06` → `Hex` (po obu stronach, przed porównaniem);
 *   - LINE_SUBS (K06A-Z4/Z6): pojedyncze linie pinu zastąpione linią portu (delegatory, IIFE → funkcja z parametrem);
 *     każda pozycja musi trafić w pin dokładnie raz w swoim zakresie i być obecna w porcie.
 *
 * Bramka (EXIT 0 ⇔ wszystkie poniższe):
 *   TEXT    każdy blok = pin A..B po normalizacji i LINE_SUBS (puste linie końcowe pomijane);
 *   ORPHAN  żaden komentarz poza blokiem nie osierocony; blok nie kończy się komentarzem; zakres pinu nie kończy się komentarzem;
 *   COVER   deklaracje najwyższego poziomu w porcie = `wybrane.json` ∪ LOCAL_NAMES; każda jednostka ma marker;
 *   LOCAL   każda nazwa z LOCAL_NAMES jest zadeklarowana w porcie; LINE_SUBS trafiają w pin i w port.
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/verify-k06a-copies.mjs --pin-dir <PIN_DIR> [--wybrane <wybrane.json>] [--json <plik>]
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const HERE = dirname(fileURLToPath(import.meta.url));
const FRONT = resolve(HERE, '../..');
const PIN_DIR = argOf('--pin-dir');
const JSON_OUT = argOf('--json');
const PORT = resolve(argOf('--port') ?? join(FRONT, 'src/ui/cityPanel/k06a-fundament.ts'));
const WYBRANE = resolve(
  argOf('--wybrane') ??
    join(FRONT, '../../dyspozycje/autobot/runs/R-RUSTPORT-P5-8-CITYPANEL-K06A-Q1/r2-logi/wybrane.json'),
);
if (!PIN_DIR || !existsSync(join(PIN_DIR, 'gra/src'))) {
  console.error('Użycie: node tools/dom-harness/verify-k06a-copies.mjs --pin-dir <PIN_DIR> [--wybrane <plik>] [--json <plik>]');
  process.exit(2);
}

/** K06A-Z5: tokeny lokalnych kopii typów → nazwy pinu (stosowane po obu stronach). */
const TOKENS = [
  [/\bCityK06\b/g, 'City'],
  [/\bHexK06\b/g, 'Hex'],
];

/**
 * K06A-Z4/Z6: pojedyncze linie pinu (`from`, w zakresie `a..b` bloku) zastąpione linią portu (`to`).
 * `to` musi występować w porcie w obrębie bloku; `from` musi wystąpić w pinie w zakresie dokładnie raz.
 */
const LINE_SUBS = [
  // K06A-Z4: delegator `tileYield`/`improvementKeysForHex` z K05A (typ HexLike) i stała `NAKLADKA_BRAK` (K06A-Z5).
  { a: 9765, b: 9783, from: '  const ulepszeniaKeys = improvementKeysForHex(hex);', to: '  const ulepszeniaKeys = improvementKeysForHex(hex as HexLike);', why: 'K06A-Z4 typ HexLike z K05A' },
  { a: 9765, b: 9783, from: '    nakladka: hex.nakladka ?? Nakladka.Brak,', to: '    nakladka: hex.nakladka ?? NAKLADKA_BRAK,', why: 'K06A-Z5 stała Nakladka.Brak -> NAKLADKA_BRAK' },
  // K06A-Z5: typ parametru y -> TileYieldK06 (kształt pól identyczny: zywnosc/praca/handel).
  { a: 9757, b: 9763, from: 'function formatTileYieldShort(y: { zywnosc: number; praca: number; handel: number }): string {', to: 'export function formatTileYieldShort(y: TileYieldK06): string {', why: 'K06A-Z5 typ TileYieldK06' },
  // K06A-Z6: IIFE na danych JSON -> funkcja z parametrem `rows` (dane wstrzykiwane).
  { a: 9556, b: 9569, from: 'const IMPROVEMENT_KEY_TO_NAME: Record<string, string> = (() => {', to: 'export function buildImprovementKeyToName(rows: Record<string, { nazwa?: string }>): Record<string, string> {', why: 'K06A-Z6 IIFE -> funkcja' },
  { a: 9556, b: 9569, from: '  for (const [key, row] of Object.entries(terrainImprovementsData as Record<string, { nazwa?: string }>)) {', to: '  for (const [key, row] of Object.entries(rows)) {', why: 'K06A-Z6 dane wstrzykiwane' },
  { a: 9556, b: 9569, from: '})();', to: '}', why: 'K06A-Z6 koniec IIFE -> koniec funkcji' },
  // K06A-Z4: delegatory CITY_TABS / activeDrawerTab / cityTabIconHtml -> dep().
  { a: 10239, b: 10245, from: '  return CITY_TABS.map(t => {', to: '  return dep().cityTabs().map(t => {', why: 'K06A-Z4 CITY_TABS -> dep().cityTabs()' },
  { a: 10239, b: 10245, from: '    const on = activeDrawerTab === t.id;', to: '    const on = dep().activeDrawerTab() === t.id;', why: 'K06A-Z4 activeDrawerTab -> dep()' },
  { a: 10239, b: 10245, from: '      + `<span class="civ-cs-tab-inner">${cityTabIconHtml(t.id)}<span class="civ-cs-tab-lbl">${t.short}</span></span></button>`;', to: '      + `<span class="civ-cs-tab-inner">${dep().cityTabIconHtml(t.id)}<span class="civ-cs-tab-lbl">${t.short}</span></span></button>`;', why: 'K06A-Z4 cityTabIconHtml -> dep()' },
];

/** Nazwy deklaracji spoza wybrane.json: lokalne typy/delegatory/wejścia DTO (K06A-Z4/Z5/Z6/Z7) i jednostka K06A-Z6. */
const LOCAL_NAMES = new Set([
  'CityK06', 'HexK06', 'NAKLADKA_BRAK', 'TileYieldK06', 'CityTabK06', 'OrderStateK06',
  'K06aCfg', 'K06aDeps', 'cfg', 'deps', 'setK06aCfg', 'setK06aDeps', 'dep',
  'cityPanelChipIconWrap', 'tileYield', 'formatCityMapLabel', 'axialToWorld', 'switchCity', 'HEX_R',
  'setK06aActive', 'getK06aState', 'setK06aPinnedGarrisonCityId', 'getK06aActiveCity',
  'buildImprovementKeyToName',
]);

const isCommentLine = (t) => /^\/\*\*|^\/\*|^\*|^\/\//.test(t.trim()) || /\*\/\s*$/.test(t.trim());
const isDecl = (t) => /^(export\s+)?(const|let|function|type|interface|enum|class|import)\b/.test(t);
const stripExport = (t) => t.replace(/^export /, '');
const tokRev = (t) => TOKENS.reduce((acc, [re, to]) => acc.replace(re, to), t);
const trimTrailingBlank = (arr) => {
  const a = [...arr];
  while (a.length && a[a.length - 1].trim() === '') a.pop();
  return a;
};

const port = readFileSync(PORT, 'utf8').split('\n');
const pinCache = {};
const pinLines = (rel) => (pinCache[rel] ??= readFileSync(join(PIN_DIR, rel), 'utf8').split(/\r?\n/));

// 1. Podział na bloki (marker -> treść do następnego markera). Marker = decl dla sprawdzenia osierocenia.
const MARK = /^\/\/ pin edb8fb56 (gra\/src\/[^:\s]+):(\d+)-(\d+)$/;
const blocks = [];
const outside = []; // [lineNo, text] poza blokami
let cur = null;
port.forEach((text, idx) => {
  if (/^\/\/ pin-end$/.test(text)) {
    cur = null;
    outside.push({ no: idx + 1, text: 'const __END__ = 0;' });
    return;
  }
  const m = MARK.exec(text);
  if (m) {
    cur = { rel: m[1], a: Number(m[2]), b: Number(m[3]), markerLine: idx + 1, body: [] };
    blocks.push(cur);
    outside.push({ no: idx + 1, text: 'const __MARKER__ = 0;' });
    return;
  }
  if (/^\/\/ pin/.test(text)) {
    // Marker w niepoprawnym formacie (np. z dopiskiem) — błąd bramki, nie jest cichym komentarzem.
    blocks.push({ rel: '<BAD_MARKER>', a: 0, b: 0, markerLine: idx + 1, body: [], bad: text });
    cur = null;
    return;
  }
  if (cur) cur.body.push({ no: idx + 1, text });
  else outside.push({ no: idx + 1, text });
});

const findings = { text: [], orphan: [], cover: [], local: [] };
const comparisons = [];

// 2. TEXT: porównanie bloków z pinem.
for (const b of blocks) {
  if (b.bad !== undefined) {
    findings.text.push(`linia ${b.markerLine}: marker niezgodny z formatem '// pin edb8fb56 gra/src/<plik>:A-B': '${b.bad.trim()}'`);
    continue;
  }
  const bodyLines = trimTrailingBlank(b.body.map((x) => x.text));
  const pin = pinLines(b.rel);
  if (b.b > pin.length) {
    findings.text.push(`${b.rel}:${b.a}-${b.b} poza zakresem pinu (${pin.length} linii)`);
    continue;
  }
  const pinRange = pin.slice(b.a - 1, b.b);
  const subsHere = LINE_SUBS.filter((s) => s.a === b.a && s.b === b.b);
  const expected = pinRange.map((l) => {
    const hit = subsHere.find((s) => s.from === l);
    return hit ? hit.to : l;
  });
  for (const s of subsHere) {
    const inPin = pinRange.filter((l) => l === s.from).length;
    if (inPin !== 1) findings.text.push(`${b.rel}:${b.a}-${b.b} LINE_SUB '${s.from.trim().slice(0, 50)}' występuje w pinie ${inPin} razy (wymagane 1)`);
    const inPort = bodyLines.filter((l) => l === s.to).length;
    if (inPort !== 1) findings.text.push(`${b.rel}:${b.a}-${b.b} LINE_SUB '${s.to.trim().slice(0, 50)}' występuje w porcie ${inPort} razy (wymagane 1)`);
  }
  const exp = trimTrailingBlank(expected).map((l) => tokRev(stripExport(l)));
  const got = bodyLines.map((l) => tokRev(stripExport(l)));
  const same = exp.length === got.length && exp.every((l, i) => l === got[i]);
  comparisons.push({ block: `${b.rel}:${b.a}-${b.b}`, lines: exp.length, subs: subsHere.length, status: same ? 'OK' : 'ROZNICA' });
  if (!same) {
    const i = exp.findIndex((l, k) => l !== got[k]);
    findings.text.push(
      `${b.rel}:${b.a}-${b.b} różnica od linii ${i + 1} bloku: pin='${exp[i] ?? '<brak>'}' port='${got[i] ?? '<brak>'}' (długości ${exp.length}/${got.length})`,
    );
  }
  // 3. ORPHAN (wewnątrz bloku): ostatnia niepusta linia nie może być komentarzem.
  const last = bodyLines[bodyLines.length - 1] ?? '';
  if (isCommentLine(last) && !/^\s*(export|const|function|type)/.test(last)) {
    findings.orphan.push(`${b.rel}:${b.a}-${b.b} blok kończy się osieroconym komentarzem: '${last.trim().slice(0, 60)}'`);
  }
  const pinLast = trimTrailingBlank(pinRange).pop() ?? '';
  if (isCommentLine(pinLast)) {
    findings.orphan.push(`${b.rel}:${b.a}-${b.b} zakres pinu kończy się komentarzem bez deklaracji`);
  }
}

// 4. ORPHAN (poza blokami): każdy komentarz musi poprzedzać deklarację (marker liczy się jako deklaracja); wyjątek: nagłówek pliku.
{
  let i = 0;
  const firstImport = outside.findIndex((x) => /^import\b/.test(x.text));
  while (i < outside.length) {
    // Komentarze wcięte (dokumentacja członków interfejsów) nie są deklaracjami najwyższego poziomu.
    if (!/^\s/.test(outside[i].text) && isCommentLine(outside[i].text)) {
      let j = i;
      while (j < outside.length && (isCommentLine(outside[j].text) || outside[j].text.trim() === '')) j++;
      let k = j;
      while (k < outside.length && outside[k].text.trim() === '') k++;
      const next = outside[k]?.text ?? '';
      const isHeader = firstImport >= 0 && i < firstImport && i === 0;
      if (!isHeader && !isDecl(next)) {
        findings.orphan.push(`linia ${outside[i].no}: komentarz poza blokiem nie poprzedza deklaracji (następna: '${next.trim().slice(0, 50)}')`);
      }
      i = j;
    } else i++;
  }
}

// 5. COVER: deklaracje najwyższego poziomu w porcie = wybrane ∪ LOCAL_NAMES.
const declared = new Set();
for (const t of port) {
  const m = /^(?:export\s+)?(?:const|let|function|type|enum|interface)\s+([A-Za-z_$][\w$]*)/.exec(t);
  if (m) declared.add(m[1]);
}
const wybrane = JSON.parse(readFileSync(WYBRANE, 'utf8')).map((u) => u.name);
const expectedNames = new Set([...wybrane, ...LOCAL_NAMES]);
for (const n of wybrane) if (!declared.has(n)) findings.cover.push(`brak jednostki z wybrane.json w porcie: ${n}`);
for (const n of declared) if (!expectedNames.has(n) && n !== '__MARKER__') findings.cover.push(`deklaracja spoza wybrane.json i LOCAL_NAMES: ${n}`);
for (const n of LOCAL_NAMES) if (!declared.has(n)) findings.local.push(`brak lokalnej deklaracji ${n}`);

// 6. COVER: każda jednostka z wybrane.json ma swój marker w zakresie pinu zawierającym deklarację.
for (const n of wybrane) {
  const re = new RegExp(`^(export )?(const|let|function) ${n}\\b`);
  const hit = blocks.find((b) => b.body.some((x) => re.test(x.text)));
  if (!hit) findings.cover.push(`jednostka ${n} nie ma bloku z markerem`);
}
// 7. LINE_SUBS: każda pozycja musi należeć do istniejącego bloku.
for (const s of LINE_SUBS) {
  if (!blocks.some((b) => b.a === s.a && b.b === s.b && b.rel !== '<BAD_MARKER>')) findings.text.push(`LINE_SUB bez bloku ${s.a}-${s.b}: ${s.why}`);
}

const ok = Object.values(findings).every((a) => a.length === 0);
const summary = {
  pin: 'edb8fb56',
  port: PORT.split('/').slice(-3).join('/'),
  blocks: blocks.length,
  wybraneUnits: wybrane.length,
  lineSubs: LINE_SUBS.length,
  comparisons,
  findings,
  status: ok ? 'OK' : 'FAIL',
};
if (JSON_OUT) writeFileSync(resolve(JSON_OUT), JSON.stringify(summary, null, 1) + '\n');
console.log(`verify-k06a-copies: blocks=${blocks.length} wybrane=${wybrane.length} lineSubs=${LINE_SUBS.length} ${ok ? 'OK' : 'FAIL'}`);
for (const c of comparisons) console.log(`  ${c.status} ${c.block} (${c.lines} linii, podstawienia ${c.subs})`);
for (const [k, arr] of Object.entries(findings)) for (const f of arr) console.log(`  ${k.toUpperCase()}: ${f}`);
process.exit(ok ? 0 : 1);
