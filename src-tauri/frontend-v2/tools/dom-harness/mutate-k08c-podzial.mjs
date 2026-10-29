#!/usr/bin/env node
/**
 * mutate-k08c-podzial.mjs — mutacje partii `podzial` K08C (`src/ui/cityPanel/k08c-podzial.ts`, `renderPodzialPracy`),
 * P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08C-Q1, runda 2.
 * Dla każdej mutacji: kopia portu z JEDNĄ zmianą (obok oryginału), uruchomienie
 * `run-k08c-podzial-pin.mjs --port <kopia>`. ZABITA = EXIT 1. EXIT 2 (błąd harnessu) nie liczy się jako zabicie.
 * Oryginał nie jest modyfikowany; kopia jest usuwana po każdym przebiegu.
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`): node tools/dom-harness/mutate-k08c-podzial.mjs --pin-dir <PIN_DIR>
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
  console.error('Użycie: node tools/dom-harness/mutate-k08c-podzial.mjs --pin-dir <PIN_DIR>');
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const V2_ROOT = resolve(HERE, '../..');
const SRC = join(V2_ROOT, 'src/ui/cityPanel/k08c-podzial.ts');
const base = readFileSync(SRC, 'utf8');

/** [id, from, to] — `from` musi wystąpić w pliku dokładnie raz. */
const MUTANTS = [
  ['slider-min-0', 'inp.min = String(MIN_PODZIAL_PRACY_BUDYNKI_PERCENT);', 'inp.min = String(0);'],
  ['slider-step-5', 'inp.step = String(HANDEL_PCT_STEP);', 'inp.step = String(5);'],
  ['slider-max-90', 'inp.max = String(MAX_PODZIAL_PRACY_BUDYNKI_PERCENT);', 'inp.max = String(90);'],
  ['override-inverted', 'cfg.getPodzialPracyOverride?.(city.id) === true,', 'cfg.getPodzialPracyOverride?.(city.id) !== true,'],
  ['rival-gets-slider', '  if (player) {\n    const inp', '  if (true) {\n    const inp'],
  ['pula-label-short', '${cityPanelChipIconWrap(\'chip-crate\', 16)} ${PULA_LBL_PELNA} <b>', '${cityPanelChipIconWrap(\'chip-crate\', 16)} ${PULA_LBL} <b>'],
  ['callback-dropped', 'cfg.onPodzialPracyChange?.(city.id, { procentBudynki: v });', 'void v;'],
  ['callback-complement', 'cfg.onPodzialPracyChange?.(city.id, { procentBudynki: v });', 'cfg.onPodzialPracyChange?.(city.id, { procentBudynki: 100 - v });'],
  ['info-dropped', '  appendPodzialPracyInfo(mount, city, view, data);', ''],
  ['no-early-return', '  if (!cfg.onPodzialPracyChange) return;\n', ''],
];

const rows = [];
let survived = 0;
let errors = 0;
for (const [id, from, to] of MUTANTS) {
  const hits = base.split(from).length - 1;
  if (hits !== 1) {
    rows.push({ id, status: 'BLAD-MUTANTA', detail: `from wystąpień=${hits}` });
    errors += 1;
    continue;
  }
  const mutantPath = join(dirname(SRC), `.mut-k08cPodzial-${id}.ts`);
  writeFileSync(mutantPath, base.replace(from, to));
  try {
    const r = spawnSync(process.execPath, [
      join(HERE, 'run-k08c-podzial-pin.mjs'), '--pin-dir', resolve(PIN_DIR), '--port', mutantPath,
    ], { encoding: 'utf8', timeout: 500000 });
    const failLines = (r.stdout ?? '').split('\n').filter((l) => l.startsWith('FAIL')).length;
    if (r.status === 1) rows.push({ id, status: 'ZABITA', detail: `FAIL checków=${failLines}` });
    else if (r.status === 0) { rows.push({ id, status: 'PRZEZYLA', detail: 'harness EXIT 0' }); survived += 1; }
    else { rows.push({ id, status: 'BLAD-HARNESU', detail: `EXIT ${r.status} (nie liczy się jako zabicie)` }); errors += 1; }
  } finally {
    rmSync(mutantPath, { force: true });
  }
}
for (const r of rows) console.log(`${r.status.padEnd(14)} ${r.id} | ${r.detail}`);
const killed = rows.filter((r) => r.status === 'ZABITA').length;
console.log(`\nmutacje k08c-podzial: ${killed}/${MUTANTS.length} ZABITA, przeżyło=${survived}, błędy=${errors}`);
process.exit(survived === 0 && errors === 0 ? 0 : 1);
