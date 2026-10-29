#!/usr/bin/env node
/**
 * mutate-k08d-wiring.mjs — mutacje WIRINGU K08D (`src/controller/k08dWiring.ts`), P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08D-Q1,
 * odpowiedź na zarzut Evaluatora r1 (pkt 1: brak mutacji wiringu K08D).
 *
 * Każda mutacja = kopia wiringu z JEDNĄ zmianą (obok oryginału), uruchomienie `run-k08d-wiring.mjs --wiring <kopia>`.
 * ZABITA = harness EXIT 1 (FAIL checku). EXIT 2 (błąd harnessu) NIE liczy się jako zabicie. Oryginał nie jest zmieniany.
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`): node tools/dom-harness/mutate-k08d-wiring.mjs
 * EXIT 0 <=> wszystkie mutacje zabite i baseline zielony; 1 <=> przeżycie lub błąd mutanta; 2 <=> błąd narzędzia.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const V2_ROOT = resolve(HERE, '../..');
const SRC = join(V2_ROOT, 'src/controller/k08dWiring.ts');
const base = readFileSync(SRC, 'utf8');

/** [id, from, to] — `from` musi wystąpić w pliku dokładnie raz. */
const MUTANTS = [
  ['buildEconParams-args-swapped', 'rules.buildEconParams(data, difficulty)', 'rules.buildEconParams(difficulty as never, data as never)'],
  ['buildEconParams-difficulty-fixed', 'rules.buildEconParams(data, difficulty)', "rules.buildEconParams(data, 'normal')"],
  ['biblioteka-empty-list', 'rules.cityHasBibliotekaLine(builtIds)', 'rules.cityHasBibliotekaLine([])'],
  ['biblioteka-shifted-ids', 'rules.cityHasBibliotekaLine(builtIds)', 'rules.cityHasBibliotekaLine(builtIds.slice(1))'],
  ['mnoznik-fallback-zeroed', 'rules.mnoznikHandelPieniadzForCivByDifficulty(civKey, civs, difficulty, fallbackScaled)', 'rules.mnoznikHandelPieniadzForCivByDifficulty(civKey, civs, difficulty, 0)'],
  ['mnoznik-civKey-dropped', 'rules.mnoznikHandelPieniadzForCivByDifficulty(civKey, civs, difficulty, fallbackScaled)', 'rules.mnoznikHandelPieniadzForCivByDifficulty(null, civs, difficulty, fallbackScaled)'],
  ['trasy-empty-list', 'rules.computeTradeRouteBuildingBonusByCity(routes)', 'rules.computeTradeRouteBuildingBonusByCity([])'],
  ['trasy-delegate-dropped', '    computeTradeRouteBuildingBonusByCity: (routes) => rules.computeTradeRouteBuildingBonusByCity(routes),\n', ''],
  ['biblioteka-delegate-dropped', '    cityHasBibliotekaLine: (builtIds) => rules.cityHasBibliotekaLine(builtIds),\n', ''],
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
  const mutantPath = join(dirname(SRC), `.mut-k08dWiring-${id}.ts`);
  writeFileSync(mutantPath, base.replace(from, to));
  try {
    const r = spawnSync(process.execPath, [join(HERE, 'run-k08d-wiring.mjs'), '--wiring', mutantPath], {
      encoding: 'utf8',
      timeout: 500000,
    });
    const failLines = (r.stdout ?? '').split('\n').filter((l) => l.startsWith('FAIL')).length;
    if (r.status === 1) rows.push({ id, status: 'ZABITA', detail: `FAIL checków=${failLines}` });
    else if (r.status === 0) {
      rows.push({ id, status: 'PRZEZYLA', detail: 'harness EXIT 0' });
      survived += 1;
    } else {
      rows.push({ id, status: 'BLAD-HARNESU', detail: `EXIT ${r.status} (nie liczy się jako zabicie)` });
      errors += 1;
    }
  } finally {
    rmSync(mutantPath, { force: true });
  }
}
// Baseline: oryginał musi być zielony (inaczej zabicia nic nie znaczą).
const baseline = spawnSync(process.execPath, [join(HERE, 'run-k08d-wiring.mjs')], { encoding: 'utf8', timeout: 500000 });
console.log(`baseline run-k08d-wiring: EXIT ${baseline.status}`);
for (const r of rows) console.log(`${r.status.padEnd(14)} ${r.id} | ${r.detail}`);
const killed = rows.filter((r) => r.status === 'ZABITA').length;
console.log(`\nmutacje k08d-wiring: ${killed}/${MUTANTS.length} ZABITA, przeżyło=${survived}, błędy=${errors}`);
process.exit(baseline.status === 0 && survived === 0 && errors === 0 ? 0 : 1);
