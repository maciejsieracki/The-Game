#!/usr/bin/env node
/**
 * gen-k08c-port.mjs — generator portu K08C (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08C-Q1, runda 1).
 * Bloki jednostek = linie pinu `edb8fb56` (`gra/src/ui/cityPanel.ts`) po podstawieniach `k08c-subs.mjs`
 * (`applySubsK08c`, w rundzie 1 pusta lista). Nagłówek i importy partii są w `k08c-subs.mjs`.
 * Bramka `verify-k08c-copies.mjs` sprawdza wynik względem pinu (ten sam `k08c-subs.mjs`).
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/gen-k08c-port.mjs --pin-dir <PIN_DIR> [--batch praca] [--out <plik.ts>]
 * Domyślny `--out`: `src/ui/cityPanel/k08c-praca.ts`.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { applySubsK08c, batchByNameK08c, codeEndLine } from './k08c-subs.mjs';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const HERE = dirname(fileURLToPath(import.meta.url));
const PIN_DIR = argOf('--pin-dir');
if (!PIN_DIR) {
  console.error('Użycie: node tools/dom-harness/gen-k08c-port.mjs --pin-dir <PIN_DIR> [--batch praca] [--out <plik>]');
  process.exit(2);
}
const BATCH = batchByNameK08c(argOf('--batch') ?? 'praca');
const OUT = resolve(argOf('--out') ?? join(HERE, '../../src/ui/cityPanel', BATCH.file));
const pin = readFileSync(join(resolve(PIN_DIR), 'gra/src/ui/cityPanel.ts'), 'utf8').split(/\r?\n/);
const units = BATCH.units.slice().sort((x, y) => x.a - y.a);

/** Zakres bloku: zakończony linią `}`/`};`/`;`/`)` (bez końcowych komentarzy i pustych linii). */
const blockRange = (u) => ({ a: u.a, b: codeEndLine(pin, u.a, u.b) });

const blockText = (u) => {
  const { a, b } = blockRange(u);
  const lines = applySubsK08c({ a: u.a, b: u.b }, pin.slice(a - 1, b));
  if (/^(function|const|type) /.test(lines[0])) lines[0] = `export ${lines[0]}`;
  return [`// pin edb8fb56 gra/src/ui/cityPanel.ts:${a}-${b}`, ...lines, '// pin-end'].join('\n');
};

const parts = [
  BATCH.header,
  '',
  BATCH.imports,
  '',
  `// ─── Jednostki K08C, partia ${BATCH.file} (kopie pinu wygenerowane; markery = bramka verify-k08c-copies.mjs) ─────────────`,
  '',
];
for (const u of units) {
  parts.push(blockText(u), '');
}
writeFileSync(OUT, parts.join('\n').replace(/\n{3,}/g, '\n\n').replace(/\s*$/, '\n'));
console.log(`gen-k08c-port: ${units.length} bloków -> ${OUT}`);
