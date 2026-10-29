#!/usr/bin/env node
/**
 * gen-k08d-port.mjs — generator portu K08D (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08D-Q1, runda 1).
 * Bloki jednostek = linie pinu `edb8fb56` (`gra/src/ui/cityPanel.ts`) po podstawieniach `k08d-subs.mjs` (pusta lista).
 * Bramka `verify-k08d-copies.mjs` sprawdza wynik względem pinu (ten sam `k08d-subs.mjs`).
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/gen-k08d-port.mjs --pin-dir <PIN_DIR> --batch handel|slider [--out <plik.ts>]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { applySubsK08d, batchByNameK08d, codeEndLine } from './k08d-subs.mjs';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const HERE = dirname(fileURLToPath(import.meta.url));
const PIN_DIR = argOf('--pin-dir');
if (!PIN_DIR || !argOf('--batch')) {
  console.error('Użycie: node tools/dom-harness/gen-k08d-port.mjs --pin-dir <PIN_DIR> --batch handel|slider [--out <plik>]');
  process.exit(2);
}
const BATCH = batchByNameK08d(argOf('--batch'));
const OUT = resolve(argOf('--out') ?? join(HERE, '../../src/ui/cityPanel', BATCH.file));
const pin = readFileSync(join(resolve(PIN_DIR), 'gra/src/ui/cityPanel.ts'), 'utf8').split(/\r?\n/);
const units = BATCH.units.slice();

const blockText = (u) => {
  const b = codeEndLine(pin, u.a, u.b);
  const lines = applySubsK08d({ a: u.a, b: u.b }, pin.slice(u.a - 1, b));
  if (/^(function|const|type) /.test(lines[0])) lines[0] = `export ${lines[0]}`;
  return [`// pin edb8fb56 gra/src/ui/cityPanel.ts:${u.a}-${b}`, ...lines, '// pin-end'].join('\n');
};

const parts = [
  BATCH.header,
  '',
  BATCH.imports,
  '',
  `// ─── Jednostki K08D, partia ${BATCH.file} (kopie pinu wygenerowane; markery = bramka verify-k08d-copies.mjs) ─────────────`,
  '',
];
for (const u of units) parts.push(blockText(u), '');
writeFileSync(OUT, parts.join('\n').replace(/\n{3,}/g, '\n\n').replace(/\s*$/, '\n'));
console.log(`gen-k08d-port: ${units.length} bloków -> ${OUT}`);
