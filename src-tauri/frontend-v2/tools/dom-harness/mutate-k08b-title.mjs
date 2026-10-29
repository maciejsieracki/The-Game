#!/usr/bin/env node
/**
 * mutate-k08b-title.mjs — mutacje partii `title` K08B (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08B-Q1, runda 2).
 * Dla każdej mutacji: kopia `src/ui/cityPanel/k08b-title.ts` z JEDNĄ zmianą (w tym samym katalogu, bo importy są
 * względne), uruchomienie `run-k08b-title.mjs --v2 <mutant>`; ZABITA = harness EXIT != 0.
 * Kopia mutanta jest usuwana po każdym przebiegu. EXIT 0 <=> wszystkie mutacje zabite (lub równoważne jawnie).
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`): node tools/dom-harness/mutate-k08b-title.mjs --pin-dir <PIN_DIR>
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const PIN_DIR = argOf('--pin-dir');
if (!PIN_DIR) {
  console.error('Użycie: node tools/dom-harness/mutate-k08b-title.mjs --pin-dir <PIN_DIR>');
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const V2_ROOT = resolve(HERE, '../..');
const SRC = join(V2_ROOT, 'src/ui/cityPanel/k08b-title.ts');
const base = readFileSync(SRC, 'utf8');

/** [id, from, to] — `from` musi wystąpić w porcie dokładnie raz. */
const MUTANTS = [
  ['delay-220-200', 'delayMs: 220', 'delayMs: 200'],
  ['side-left-right', "if (mount.closest('.civ-ux-left')) return 'left';", "if (mount.closest('.civ-ux-left')) return 'right';"],
  ['side-auto-left', "  return 'auto';", "  return 'left';"],
  ['btn-type-missing', "  infoLink.type = 'button';\n", ''],
  ['class-ptitle', "el('div', 'ptitle')", "el('div', 'ptitl')"],
  ['btn-aria', "'Pokaż szczegóły sekcji'", "'Pokaz szczegoly sekcji'"],
  ['title-text', "'i szczegóły'", "'i szczegoly'"],
  ['title-html-as-text', 'left.innerHTML = titleHtml;', 'left.textContent = titleHtml;'],
  ['attach-build-dropped', 'attachInteractiveDetail(infoLink, buildDetail, {', 'attachInteractiveDetail(infoLink, () => mount, {'],
  ['head-no-append', '  mount.appendChild(head);\n', ''],
  ['side-hint-fixed-right', 'sideHint: resolveDetailSideHint(mount),', "sideHint: 'right',"],
];

const rows = [];
for (const [id, from, to] of MUTANTS) {
  const hits = base.split(from).length - 1;
  if (hits !== 1) {
    rows.push({ id, status: 'BLAD-MUTANTA', detail: `from wystąpień=${hits}` });
    continue;
  }
  const mutantPath = join(dirname(SRC), `.mut-title-${id}.ts`);
  writeFileSync(mutantPath, base.replace(from, to));
  try {
    const r = spawnSync(process.execPath, [join(HERE, 'run-k08b-title.mjs'), '--pin-dir', resolve(PIN_DIR), '--v2', mutantPath], {
      encoding: 'utf8',
      cwd: V2_ROOT,
    });
    rows.push({ id, status: r.status === 0 ? 'PRZETRWANA' : 'ZABITA', detail: `exit=${r.status}` });
  } finally {
    rmSync(mutantPath, { force: true });
  }
}
let bad = 0;
for (const r of rows) {
  if (r.status !== 'ZABITA') bad++;
  console.log(`${r.status.padEnd(12)} ${r.id} (${r.detail})`);
}
const killed = rows.filter((r) => r.status === 'ZABITA').length;
console.log(`mutate-k08b-title: ${killed}/${rows.length} ZABITA, nieoczekiwane=${bad}`);
process.exit(bad === 0 ? 0 : 1);
