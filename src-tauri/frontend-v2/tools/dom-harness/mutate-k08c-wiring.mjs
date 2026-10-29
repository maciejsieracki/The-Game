#!/usr/bin/env node
/**
 * mutate-k08c-wiring.mjs — mutacje WIRINGU K08C (`src/controller/k08cWiring.ts`), P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08C-Q1,
 * runda 2 (zarzut: wiring bez mutacji; mutacje dotychczas dotyczyły tylko literałów kopii).
 *
 * Dla każdej mutacji: kopia wiringu z JEDNĄ zmianą (plik obok oryginału, importy względne), uruchomienie
 * `run-k08c-wiring.mjs --wiring <kopia>`. ZABITA = harness EXIT 1 (FAIL checku). EXIT 2 (błąd harnessu) NIE liczy się
 * jako zabicie. Kopia jest usuwana po każdym przebiegu; oryginał nie jest modyfikowany.
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`): node tools/dom-harness/mutate-k08c-wiring.mjs --pin-dir <PIN_DIR>
 * EXIT 0 <=> wszystkie mutacje zabite; 1 <=> >=1 przeżyła lub błąd mutanta; 2 <=> błąd narzędzia.
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
  console.error('Użycie: node tools/dom-harness/mutate-k08c-wiring.mjs --pin-dir <PIN_DIR>');
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const V2_ROOT = resolve(HERE, '../..');
const SRC = join(V2_ROOT, 'src/controller/k08cWiring.ts');
const base = readFileSync(SRC, 'utf8');

/** [id, from, to] — `from` musi wystąpić w pliku dokładnie raz. */
const MUTANTS = [
  ['getUnitDef-by-id', 'find((u) => u.Jednostka === id)', 'find((u) => u.id === id)'],
  ['getUnitDef-first-unit', 'data?.units.find((u) => u.Jednostka === id)', 'data?.units[0]'],
  ['order-hook-dropped', 'hook: h.getPodzialPracy?.(city.id) ?? null,', 'hook: null,'],
  ['order-stored-dropped', 'stored: ext.podzialPracy ?? ext.podziałPracy ?? null,', 'stored: null,'],
  ['order-engine-constant', 'engineParam: h.engineSuwaakPracaBudynki(data),', 'engineParam: 50,'],
  ['split-pct-not-divided', 'h.splitPraca(view.praca, pct / 100)', 'h.splitPraca(view.praca, pct)'],
  ['split-host-zeroed', 'return cityPracaSplitK04b(h.splitPraca(view.praca, pct / 100), src, bounds);', 'return cityPracaSplitK04b({ total: 0, doBudynkow: 0, doPuli: 0 }, src, bounds);'],
  ['bounds-max-90', 'const bounds = K08C_PODZIAL_PRACY_BOUNDS;', 'const bounds = { min: 50, max: 90 };'],
  ['bounds-min-0', 'const bounds = K08C_PODZIAL_PRACY_BOUNDS;', 'const bounds = { min: 0, max: 100 };'],
  ['service-ignored', "if (typeof svc === 'function') return svc;", "if (false) return svc;"],
  ['stubbed-not-reported', '    stubbed.push(name);\n', ''],
  ['atrapa-silent-sum', "dlugosc(built) === 0 ? 0 : atrapaNiepusta('sumOwnedBuildingsUpkeep', built)", "dlugosc(built) === 0 ? 0 : 0"],
  ['atrapa-empty-wrong', 'dlugosc(built) === 0 ? 0 :', 'dlugosc(built) === 0 ? 1 :'],
  ['engine-snap-ignored', 'resolveEmpireSnapK(h.getEmpireHud?.(city.ownerId),', 'resolveEmpireSnapK(undefined,'],
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
  const mutantPath = join(dirname(SRC), `.mut-k08cWiring-${id}.ts`);
  writeFileSync(mutantPath, base.replace(from, to));
  try {
    const r = spawnSync(process.execPath, [
      join(HERE, 'run-k08c-wiring.mjs'), '--pin-dir', resolve(PIN_DIR), '--wiring', mutantPath,
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
console.log(`\nmutacje k08c-wiring: ${killed}/${MUTANTS.length} ZABITA, przeżyło=${survived}, błędy=${errors}`);
process.exit(survived === 0 && errors === 0 ? 0 : 1);
