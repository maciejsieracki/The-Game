#!/usr/bin/env node
/**
 * verify-k08d-copies.mjs — bramka wierności KOPII tekstowych K08D (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08D-Q1, runda 1).
 *
 * Każdy blok w `src/ui/cityPanel/k08d-*.ts` jest poprzedzony markerem `// pin edb8fb56 gra/src/ui/cityPanel.ts:A-B`
 * i zamknięty linią `// pin-end`. Treść bloku musi odpowiadać liniom A..B pinu po podstawieniach `k08d-subs.mjs`
 * (`applySubsK08d`) i normalizacji `export ` na pierwszej linii deklaracji (po obu stronach).
 *
 * Bramka (EXIT 0 <=> wszystkie poniższe):
 *   TEXT    każdy blok partii = pin A..B (bajt w bajt, bez pustych linii końcowych);
 *   SUBS    każde podstawienie LINE_SUBS_K08D trafia w zakres pinu DOKŁADNIE raz (lista pusta = OK);
 *   COVER   każda jednostka partii ma marker o poprawnym zakresie; żaden marker poza partią (ORPHAN = 0);
 *   EXPORT  deklaracje najwyższego poziomu w pliku = jednostki partii (żadnej osieroconej kopii).
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/verify-k08d-copies.mjs --pin-dir <PIN_DIR> --batch handel|slider [--port <plik>] [--json <plik>]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LINE_SUBS_K08D, applySubsK08d, batchByNameK08d, codeEndLine, countSubK08d } from './k08d-subs.mjs';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const HERE = dirname(fileURLToPath(import.meta.url));
const PIN_DIR = argOf('--pin-dir');
if (!PIN_DIR || !argOf('--batch')) {
  console.error('Użycie: node tools/dom-harness/verify-k08d-copies.mjs --pin-dir <PIN_DIR> --batch handel|slider [--port <plik>] [--json <plik>]');
  process.exit(2);
}
const BATCH = batchByNameK08d(argOf('--batch'));
const PORT = resolve(argOf('--port') ?? join(HERE, '../../src/ui/cityPanel', BATCH.file));
const JSON_OUT = argOf('--json');
const pin = readFileSync(join(resolve(PIN_DIR), 'gra/src/ui/cityPanel.ts'), 'utf8').split(/\r?\n/);
const port = readFileSync(PORT, 'utf8').split(/\r?\n/);

const fails = [];
const report = { TEXT: 0, SUBS: 0, COVER: 0, EXPORT: 0, blocks: 0 };

// SUBS: każde podstawienie w zakresie pinu dokładnie raz.
for (const s of LINE_SUBS_K08D) {
  const countInRange = countSubK08d(pin, s.a, s.b, s.from);
  if (countInRange !== 1) fails.push(`SUBS: "${s.from}" w ${s.a}-${s.b} wystąpień=${countInRange} (oczekiwano 1)`);
  else report.SUBS++;
}

// Bloki w porcie.
const markerRe = /^\/\/ pin edb8fb56 gra\/src\/ui\/cityPanel\.ts:(\d+)-(\d+)$/;
const blocks = [];
for (let i = 0; i < port.length; i++) {
  const m = markerRe.exec(port[i]);
  if (!m) continue;
  let j = i + 1;
  while (j < port.length && port[j] !== '// pin-end') j++;
  if (j >= port.length) {
    fails.push(`TEXT: marker ${m[1]}-${m[2]} bez // pin-end`);
    break;
  }
  blocks.push({ a: Number(m[1]), b: Number(m[2]), body: port.slice(i + 1, j), line: i + 1 });
  i = j;
}
report.blocks = blocks.length;

// COVER / ORPHAN: markery = jednostki partii (A-B = zakres po codeEndLine).
const expected = BATCH.units.map((u) => ({ name: u.name, a: u.a, b: codeEndLine(pin, u.a, u.b) }));
for (const e of expected) {
  const blk = blocks.find((x) => x.a === e.a);
  if (!blk) {
    fails.push(`COVER: brak markera dla ${e.name} (${e.a})`);
    continue;
  }
  if (blk.b !== e.b) fails.push(`COVER: ${e.name} zakres portu ${blk.a}-${blk.b} != pin ${e.a}-${e.b}`);
  else report.COVER++;
  // TEXT: pin A..B po podstawieniach, normalizacja `export ` na pierwszej linii deklaracji.
  const want = applySubsK08d({ a: e.a, b: BATCH.units.find((u) => u.name === e.name).b }, pin.slice(e.a - 1, e.b));
  if (/^(function|const|type) /.test(want[0])) want[0] = `export ${want[0]}`;
  const got = blk.body;
  const diff = got.length !== want.length || got.some((l, k) => l !== want[k]);
  if (diff) {
    const k = got.findIndex((l, idx) => l !== want[idx]);
    fails.push(`TEXT: ${e.name} różni się od pinu od linii ${k + 1} (port: ${JSON.stringify(got[k])}, pin: ${JSON.stringify(want[k])})`);
  } else report.TEXT++;
}
for (const blk of blocks) {
  if (!expected.some((e) => e.a === blk.a)) fails.push(`ORPHAN: marker ${blk.a}-${blk.b} poza partią`);
}
report.ORPHAN = blocks.filter((blk) => !expected.some((e) => e.a === blk.a)).length;

// EXPORT: deklaracje najwyższego poziomu (poza importami i nagłówkiem) = jednostki partii.
const declRe = /^(?:export\s+)?(?:async\s+)?(?:function|const|let|type|interface|class)\s+([A-Za-z_$][\w$]*)/;
const declared = port.map((l) => declRe.exec(l)?.[1]).filter(Boolean);
const want = BATCH.units.map((u) => u.name);
const extra = declared.filter((n) => !want.includes(n));
const missing = want.filter((n) => !declared.includes(n));
if (extra.length) fails.push(`EXPORT: deklaracje spoza partii: ${extra.join(', ')}`);
if (missing.length) fails.push(`EXPORT: brak deklaracji: ${missing.join(', ')}`);
if (!extra.length && !missing.length) report.EXPORT = declared.length;

report.fails = fails.length;
console.log(JSON.stringify(report, null, 1));
for (const f of fails) console.log('FAIL ' + f);
if (JSON_OUT) writeFileSync(JSON_OUT, JSON.stringify({ report, fails }, null, 1) + '\n');
console.log(fails.length === 0 ? 'verify-k08d-copies: OK' : `verify-k08d-copies: ${fails.length} różnic`);
process.exit(fails.length === 0 ? 0 : 1);
