#!/usr/bin/env node
/**
 * verify-k07b-copies.mjs — bramka kopii K07B (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K07B-Q1).
 * Dla każdego bloku `// pin edb8fb56 gra/src/ui/cityPanel.ts:A-B` … `// pin-end` w `src/ui/cityPanel/k07b-*.ts`
 * porównuje treść z pinem (po zmianie nazw PIN_TO_PORT_NAMES z `k07a-subs.mjs`, z `export ` przed pierwszą linią).
 * Raportuje też ORPHAN: linie komentarza pinu w zakresie jednostki, których brak w kopii (cel: 0).
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/verify-k07b-copies.mjs --pin-dir <PIN_DIR>
 * Wyjście: 0 = zgodne, 1 = niezgodności, 2 = błąd użycia.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PIN_TO_PORT_NAMES, codeEndLine } from './k07a-subs.mjs';

const args = process.argv.slice(2);
const i = args.indexOf('--pin-dir');
const PIN_DIR = i >= 0 ? args[i + 1] : undefined;
if (!PIN_DIR) {
  console.error('Użycie: node tools/dom-harness/verify-k07b-copies.mjs --pin-dir <PIN_DIR>');
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const DIR = resolve(HERE, '../../src/ui/cityPanel');
const pin = readFileSync(join(resolve(PIN_DIR), 'gra/src/ui/cityPanel.ts'), 'utf8').split(/\r?\n/);
const renamePin = (line) => PIN_TO_PORT_NAMES.reduce((acc, [re, to]) => acc.replace(re, to), line);

let blocks = 0;
let mismatches = 0;
let orphan = 0;
for (const f of readdirSync(DIR).filter((n) => /^k07b-.*\.ts$/.test(n)).sort()) {
  const lines = readFileSync(join(DIR, f), 'utf8').split(/\r?\n/);
  for (let k = 0; k < lines.length; k++) {
    const m = /^\/\/ pin edb8fb56 gra\/src\/ui\/cityPanel\.ts:(\d+)-(\d+)$/.exec(lines[k]);
    if (!m) continue;
    blocks++;
    const a = Number(m[1]);
    const b = Number(m[2]);
    if (codeEndLine(pin, a, b) !== b) {
      mismatches++;
      console.log(`${f}:${k + 1} BLOK-ZAKRES pin:${a}-${b} nie kończy się na linii kodu`);
    }
    const expected = pin.slice(a - 1, b).map(renamePin);
    if (/^(function|const) /.test(expected[0])) expected[0] = `export ${expected[0]}`;
    const got = [];
    let j = k + 1;
    while (j < lines.length && lines[j] !== '// pin-end') got.push(lines[j++]);
    if (lines[j] !== '// pin-end') {
      mismatches++;
      console.log(`${f}:${k + 1} brak // pin-end`);
      break;
    }
    if (got.length !== expected.length || got.some((l, n) => l !== expected[n])) {
      mismatches++;
      const n = got.findIndex((l, x) => l !== expected[x]);
      console.log(`${f}:${k + 1} NIEZGODNOŚĆ pin:${a}-${b} linia=${n + 1}`);
    }
    for (let p = a - 1; p < b; p++) {
      if (/^\s*\/\//.test(pin[p]) && !got.some((l) => l.includes(pin[p].trim().slice(0, 40)))) orphan++;
    }
    k = j;
  }
}
console.log(`verify-k07b-copies: bloków=${blocks} niezgodnych=${mismatches} ORPHAN=${orphan}`);
process.exit(mismatches > 0 || orphan > 0 ? 1 : 0);
