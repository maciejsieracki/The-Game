#!/usr/bin/env node
/**
 * mutate-k05a-units.mjs — mutacje behawioralne portu K05A (`src/ui/cityPanel/k05a-fundament.ts`) (P5-8,
 * R-RUSTPORT-P5-8-CITYPANEL-K05A-Q1, runda 1). Każda mutacja zmienia jeden fragment kodu portu w pliku tymczasowym;
 * harness `run-k05a-units.mjs --v2 <mutant>` musi wykryć różnicę (EXIT 1). Mutacja przeżyta = brak wykrycia = raport.
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`):
 *   node tools/dom-harness/mutate-k05a-units.mjs --pin-dir <PIN_DIR>
 * EXIT 0 <=> wszystkie mutacje zabite; 1 <=> przeżyta >=1 mutacja; 2 <=> błąd.
 */
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const PIN_DIR = argOf('--pin-dir');
if (!PIN_DIR) {
  console.error('Użycie: node tools/dom-harness/mutate-k05a-units.mjs --pin-dir <katalog z gra/src i gra/data z edb8fb56>');
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const V2_FILE = resolve(HERE, '../../src/ui/cityPanel/k05a-fundament.ts');
const HARNESS = resolve(HERE, 'run-k05a-units.mjs');
const src = readFileSync(V2_FILE, 'utf8');

/** [id, zamiennik(from), na(to)] — `from` musi występować dokładnie raz w porcie. */
const MUTANTS = [
  ['hexDist-dzielnik', '/ 2;', '/ 3;'],
  ['hexDist-trzeci-czlon', 'Math.abs(dq + dr)', 'Math.abs(dq - dr)'],
  ['hexDist-dr', 'Math.abs(dr)) / 2', 'Math.abs(dr) + 1) / 2'],
  ['rangeName-prog-maly', 'if (R <= 5)', 'if (R < 5)'],
  ['rangeName-prog-sredni', 'if (R <= 10)', 'if (R <= 9)'],
  ['rangeName-etykieta', "'średnie miasto'", "'mniejsze miasto'"],
  ['ringsTiles-mnoznik', 'n += 6 * (R + k);', 'n += 5 * (R + k);'],
  ['ringsTiles-offset', 'n += 6 * (R + k);', 'n += 6 * (R + k - 1);'],
  ['ringsTiles-granica', 'for (let k = 1; k <= rings; k++)', 'for (let k = 1; k < rings; k++)'],
  ['okStat-klasa', '<span class="ks">', '<span class="k">'],
  ['okStat-wartosc', '<b>${val}</b>', '<b>${sub}</b>'],
  ['okStat-sub', '<span class="muted">${sub}</span>', '<span class="muted">${val}</span>'],
  ['ENTITY-id', "'civ-city-panel-entity-card-css-v1'", "'civ-city-panel-entity-card-css-v2'"],
];

const tmp = mkdtempSync(join(tmpdir(), 'p58k05a-mutate-'));
const survived = [];
const killed = [];
let exitCode = 0;
try {
  for (const [id, from, to] of MUTANTS) {
    const n = src.split(from).length - 1;
    if (n !== 1) {
      console.error(`mutant ${id}: wzorzec wystąpił ${n} razy (wymagane 1)`);
      exitCode = 2;
      break;
    }
    const mutPath = join(tmp, `${id}.ts`);
    writeFileSync(mutPath, src.replace(from, to));
    const r = spawnSync(process.execPath, [HARNESS, '--pin-dir', resolve(PIN_DIR), '--v2', mutPath], { encoding: 'utf8' });
    if (r.status === 1) killed.push(id);
    else {
      survived.push(id);
      console.log(`PRZEZYTA ${id} (exit=${r.status}) ${r.stderr ? r.stderr.trim().slice(0, 200) : ''}`);
    }
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
if (exitCode === 0) {
  console.log(`mutate-k05a-units: mutacji=${MUTANTS.length} zabitych=${killed.length} przezytych=${survived.length}`);
  exitCode = survived.length === 0 ? 0 : 1;
}
process.exit(exitCode);
