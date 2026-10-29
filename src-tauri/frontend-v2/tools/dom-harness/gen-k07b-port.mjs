#!/usr/bin/env node
/**
 * gen-k07b-port.mjs — generator bloków portu K07B (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K07B-Q1).
 * Bloki jednostek DOM = linie pinu `edb8fb56` (`gra/src/ui/cityPanel.ts`) po zmianie nazw (`PIN_TO_PORT_NAMES`
 * z `k07a-subs.mjs`). Nagłówek (importy, sekcje K07B-Z1..Z5) to stały tekst podany przez `--header <plik>`.
 * Zakresy: `codeEndLine` z `k07a-subs.mjs` (ten sam algorytm co select-k07a.mjs).
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/gen-k07b-port.mjs --pin-dir <PIN_DIR> --wybrane <wybrane.json> --header <naglowek.ts> --out <plik.ts>
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { PIN_TO_PORT_NAMES, codeEndLine } from './k07a-subs.mjs';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const PIN_DIR = argOf('--pin-dir');
const WYBRANE = argOf('--wybrane');
const HEADER = argOf('--header');
const OUT = argOf('--out');
if (!PIN_DIR || !WYBRANE || !HEADER || !OUT) {
  console.error('Użycie: node tools/dom-harness/gen-k07b-port.mjs --pin-dir <PIN_DIR> --wybrane <wybrane.json> --header <plik> --out <plik.ts>');
  process.exit(2);
}
const pin = readFileSync(join(resolve(PIN_DIR), 'gra/src/ui/cityPanel.ts'), 'utf8').split(/\r?\n/);
const units = JSON.parse(readFileSync(resolve(WYBRANE), 'utf8')).slice().sort((x, y) => x.a - y.a);
const renamePin = (line) => PIN_TO_PORT_NAMES.reduce((acc, [re, to]) => acc.replace(re, to), line);

const blockText = (u) => {
  const b = codeEndLine(pin, u.a, u.b);
  const lines = pin.slice(u.a - 1, b).map(renamePin);
  if (/^(function|const) /.test(lines[0])) lines[0] = `export ${lines[0]}`;
  return [`// pin edb8fb56 gra/src/ui/cityPanel.ts:${u.a}-${b}`, ...lines, '// pin-end'].join('\n');
};

const body = units.map(blockText).join('\n\n');
writeFileSync(resolve(OUT), `${readFileSync(resolve(HEADER), 'utf8').trimEnd()}\n\n${body}\n`);
console.log(`zapisano: ${resolve(OUT)} jednostek=${units.length}`);
