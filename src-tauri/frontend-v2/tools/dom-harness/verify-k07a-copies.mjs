#!/usr/bin/env node
/**
 * verify-k07a-copies.mjs — bramka wierności KOPII tekstowych K07A (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K07A-Q1, runda 2).
 *
 * Wzorzec: `verify-k06a-copies.mjs`. Każdy blok w `src/ui/cityPanel/k07a-fundament.ts` jest poprzedzony markerem
 * `// pin edb8fb56 gra/src/<plik>:A-B` i zamknięty linią `// pin-end`; treść bloku musi odpowiadać liniom A..B pinu
 * po normalizacji: `export ` (po obu stronach), tokeny nazw K07A (TOKENS) i LINE_SUBS (jawne podstawienia linii).
 *
 * Bramka (EXIT 0 <=> wszystkie poniższe):
 *   TEXT    każdy blok = pin A..B po normalizacji i LINE_SUBS (puste linie końcowe pomijane);
 *   ORPHAN  żaden komentarz poza blokiem nie osierocony; blok i zakres pinu nie kończą się komentarzem;
 *   COVER   deklaracje najwyższego poziomu w porcie = jednostki (`wybrane`) ∪ LOCAL_NAMES; każda jednostka ma marker;
 *   LOCAL   każda nazwa z LOCAL_NAMES jest zadeklarowana w porcie; LINE_SUBS trafiają w pin i w port.
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/verify-k07a-copies.mjs --pin-dir <PIN_DIR> [--wybrane <plik>] [--port <plik>] [--json <plik>]
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
const PORT = resolve(argOf('--port') ?? join(FRONT, 'src/ui/cityPanel/k07a-fundament.ts'));
const WYBRANE = resolve(
  argOf('--wybrane') ??
    join(FRONT, '../../dyspozycje/autobot/runs/R-RUSTPORT-P5-8-CITYPANEL-K07A-Q1/r2-logi/wybrane-r2.json'),
);
if (!PIN_DIR || !existsSync(join(PIN_DIR, 'gra/src'))) {
  console.error('Użycie: node tools/dom-harness/verify-k07a-copies.mjs --pin-dir <PIN_DIR> [--wybrane <plik>] [--json <plik>]');
  process.exit(2);
}

/** Tokeny nazw portu → nazwy pinu (stosowane po obu stronach przed porównaniem). */
const TOKENS = [
  [/\bCityK07\b/g, 'City'],
  [/\bW3_STAT_RES_KEY_K07\b/g, 'W3_STAT_RES_KEY'],
  [/\bw3CityChipK07\b/g, 'w3CityChip'],
  [/\bcapitalBadgeOrButtonHtmlK07\b/g, 'capitalBadgeOrButtonHtml'],
  [/\bresolveK07aActiveCity\b/g, 'resolveActiveCity'],
];

/**
 * Jawne podstawienia linii (K07A-Z2): pojedyncza linia pinu w zakresie `a..b` zastąpiona linią portu `to`.
 * `from` musi wystąpić w pinie w zakresie dokładnie raz; `to` musi wystąpić w porcie w bloku dokładnie raz.
 */
const LINE_SUBS = [
  { a: 10329, b: 10334, from: '  const fresh = cfg.getCities?.().find(c => c.id === activeCity!.id);', to: '  const fresh = deps?.getCities().find(c => c.id === activeCity!.id);', why: 'K07A-Z2 cfg.getCities -> deps' },
  { a: 10393, b: 10419, from: '    buildChipDeltaStockHtml(civRate, civStock) +', to: "    (deps ? deps.chipDeltaStockHtml(civRate, civStock) : '') +", why: 'K07A-Z2 buildChipDeltaStockHtml -> deps' },
  { a: 10719, b: 10734, from: '  const capitalId = cfg.getCapitalCityId?.(city.ownerId) ?? null;', to: '  const capitalId = deps?.getCapitalCityId(city.ownerId) ?? null;', why: 'K07A-Z2 cfg.getCapitalCityId -> deps' },
  { a: 10719, b: 10734, from: "  if (!isMeCity(city.ownerId) || !cfg.onSetCapital) return '';", to: "  if (!deps || !deps.isMe(city.ownerId) || !deps.canSetCapital) return '';", why: 'K07A-Z2 isMeCity/onSetCapital -> deps' },
  { a: 10719, b: 10734, from: '  const allCitiesForCapital = cfg.getCities?.() ?? [];', to: '  const allCitiesForCapital = deps?.getCities() ?? [];', why: 'K07A-Z2 cfg.getCities -> deps' },
];

/** Nazwy deklaracji portu spoza jednostek: lokalne typy, deps, akcesory stanu (K07A-Z1..Z3). */
const LOCAL_NAMES = new Set([
  'CityK07', 'K07aDeps', 'deps', 'setK07aDeps', 'activeCity', 'setK07aActiveCity', 'getK07aActiveCity',
  'setK07aUxSectionRefresh', 'getK07aUxSectionRefresh',
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

// 1. Podział na bloki: marker -> treść do `// pin-end` (lub następnego markera).
const MARK = /^\/\/ pin edb8fb56 (gra\/src\/[^:\s]+):(\d+)-(\d+)$/;
const blocks = [];
const outside = [];
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
    blocks.push({ rel: '<BAD_MARKER>', a: 0, b: 0, markerLine: idx + 1, body: [], bad: text });
    cur = null;
    return;
  }
  if (cur) cur.body.push({ no: idx + 1, text });
  else outside.push({ no: idx + 1, text });
});

const findings = { text: [], orphan: [], cover: [], local: [] };
const comparisons = [];

// 2. TEXT + ORPHAN (wewnątrz bloku).
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
    if (inPin !== 1) findings.text.push(`${b.rel}:${b.a}-${b.b} LINE_SUB '${s.from.trim().slice(0, 50)}' w pinie ${inPin} razy (wymagane 1)`);
    const inPort = bodyLines.filter((l) => l === s.to).length;
    if (inPort !== 1) findings.text.push(`${b.rel}:${b.a}-${b.b} LINE_SUB '${s.to.trim().slice(0, 50)}' w porcie ${inPort} razy (wymagane 1)`);
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
  const last = bodyLines[bodyLines.length - 1] ?? '';
  if (isCommentLine(last) && !/^\s*(export|const|function|type)/.test(last)) {
    findings.orphan.push(`${b.rel}:${b.a}-${b.b} blok kończy się osieroconym komentarzem: '${last.trim().slice(0, 60)}'`);
  }
  const pinLast = trimTrailingBlank(pinRange).pop() ?? '';
  if (isCommentLine(pinLast)) {
    findings.orphan.push(`${b.rel}:${b.a}-${b.b} zakres pinu kończy się komentarzem bez deklaracji`);
  }
}

// 3. ORPHAN (poza blokami): każdy komentarz najwyższego poziomu musi poprzedzać deklarację (marker/pin-end liczą się jako kod).
{
  let i = 0;
  const firstImport = outside.findIndex((x) => /^import\b/.test(x.text));
  while (i < outside.length) {
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

// 4. COVER: deklaracje najwyższego poziomu w porcie = jednostki ∪ LOCAL_NAMES.
const declared = new Set();
for (const t of port) {
  const m = /^(?:export\s+)?(?:const|let|function|type|enum|interface)\s+([A-Za-z_$][\w$]*)/.exec(t);
  if (m) declared.add(m[1]);
}
const units = JSON.parse(readFileSync(WYBRANE, 'utf8'));
const portNames = units.map((u) => u.port ?? u.name);
const expectedNames = new Set([...portNames, ...LOCAL_NAMES]);
for (const n of portNames) if (!declared.has(n)) findings.cover.push(`brak jednostki z wybrane-r2.json w porcie: ${n}`);
for (const n of declared) if (!expectedNames.has(n) && n !== '__MARKER__') findings.cover.push(`deklaracja spoza jednostek i LOCAL_NAMES: ${n}`);
for (const n of LOCAL_NAMES) if (!declared.has(n)) findings.local.push(`brak lokalnej deklaracji ${n}`);
for (const u of units) {
  const pn = u.port ?? u.name;
  const re = new RegExp(`^(export )?(const|let|function) ${pn}\\b`);
  const hit = blocks.find((b) => b.body.some((x) => re.test(x.text)));
  if (!hit) findings.cover.push(`jednostka ${pn} nie ma bloku z markerem`);
  else if (hit.a !== u.a || hit.b !== u.b) findings.cover.push(`jednostka ${pn}: zakres markera ${hit.a}-${hit.b} != pin ${u.a}-${u.b}`);
}
for (const s of LINE_SUBS) {
  if (!blocks.some((b) => b.a === s.a && b.b === s.b && b.rel !== '<BAD_MARKER>')) findings.text.push(`LINE_SUB bez bloku ${s.a}-${s.b}: ${s.why}`);
}

const ok = Object.values(findings).every((a) => a.length === 0);
const summary = {
  pin: 'edb8fb56',
  port: PORT.split('/').slice(-3).join('/'),
  blocks: blocks.length,
  units: units.length,
  lineSubs: LINE_SUBS.length,
  comparisons,
  findings,
  status: ok ? 'OK' : 'FAIL',
};
if (JSON_OUT) writeFileSync(resolve(JSON_OUT), JSON.stringify(summary, null, 1) + '\n');
console.log(`verify-k07a-copies: blocks=${blocks.length} units=${units.length} lineSubs=${LINE_SUBS.length} ${ok ? 'OK' : 'FAIL'}`);
for (const c of comparisons) console.log(`  ${c.status} ${c.block} (${c.lines} linii, podstawienia ${c.subs})`);
for (const [k, arr] of Object.entries(findings)) for (const f of arr) console.log(`  ${k.toUpperCase()}: ${f}`);
process.exit(ok ? 0 : 1);
