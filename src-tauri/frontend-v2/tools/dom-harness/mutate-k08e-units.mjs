#!/usr/bin/env node
/**
 * mutate-k08e-units.mjs — mutacje ZACHOWANIA i pól DTO/cfg dla jednostek K08E (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08E-Q1,
 * runda 2; zarzut Evaluatora: brak mutacji zachowania i mutacji pól DTO/cfg).
 *
 * Kopia `src/` (poza repo, w katalogu tymczasowym) → JEDNA zmiana w pliku portu K08E (`k08e-*.ts`) → uruchomienie
 * `run-k08e-pin.mjs --pin-dir <PIN> --src <kopia>`. ZABITA = harness EXIT 1 (różnica pin-exec vs port albo brak pokrycia).
 * EXIT 2 (błąd harnessu) NIE liczy się jako zabicie. Baseline (niezmieniona kopia) musi dać EXIT 0.
 * Repo nie jest zmieniane.
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`): node tools/dom-harness/mutate-k08e-units.mjs --pin-dir <PIN_DIR>
 * EXIT 0 <=> baseline zielony i wszystkie mutanty zabite; 1 <=> przeżycie lub błąd mutanta; 2 <=> błąd narzędzia.
 */
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const HERE = dirname(fileURLToPath(import.meta.url));
const V2_ROOT = resolve(HERE, '../..');
const PIN_DIR = argOf('--pin-dir');
if (!PIN_DIR) {
  console.error('Użycie: node tools/dom-harness/mutate-k08e-units.mjs --pin-dir <PIN_DIR>');
  process.exit(2);
}
const TMP = mkdtempSync(join(tmpdir(), 'k08e-mut-'));
const SRC_COPY = join(TMP, 'src');
cpSync(join(V2_ROOT, 'src'), SRC_COPY, { recursive: true });
const CITY = join(SRC_COPY, 'ui/cityPanel');

/** [id, plik portu, from, to] — `from` musi wystąpić w pliku co najmniej raz; zamieniane wszystkie wystąpienia. */
const MUTANTS = [
  // Zachowanie (reguły wejścia kart; nie tylko tekst).
  ['magazyn-data-null', 'k08e-magazyn.ts', 'const data = gameData() ?? null;', 'const data = null;'],
  ['magazyn-frac-zero', 'k08e-magazyn.ts', 'const frac = view.wzrostUlamkowy;', 'const frac = 0;'],
  ['magazyn-food-owner-shift', 'k08e-magazyn.ts', 'cfg.getEmpireFoodTick?.(city.ownerId)', 'cfg.getEmpireFoodTick?.(city.ownerId + 1)'],
  ['karty-a-cityid-number', 'k08e-karty-a.ts', 'String(city.id)', 'city.id'],
  ['karty-a-food-owner-shift', 'k08e-karty-a.ts', 'cfg.getEmpireFoodTick?.(city.ownerId)', 'cfg.getEmpireFoodTick?.(city.ownerId + 1)'],
  // Pola cfg (getMaxSafePoziomRacji: maksymalny bezpieczny poziom racji; fixture = 2 < poziom 3 -> klamra).
  ['magazyn-maxsafe-shift', 'k08e-magazyn.ts', 'cfg.getMaxSafePoziomRacji?.(city.id) ?? WYZYWIENIE_MAX', '(cfg.getMaxSafePoziomRacji?.(city.id) ?? WYZYWIENIE_MAX) - 1'],
  ['karty-a-maxsafe-shift', 'k08e-karty-a.ts', 'cfg.getMaxSafePoziomRacji?.(city.id) ?? WYZYWIENIE_MAX', '(cfg.getMaxSafePoziomRacji?.(city.id) ?? WYZYWIENIE_MAX) - 1'],
  // Pola DTO (ManpowerSnapshot, OrderState).
  ['karty-a-regen-field', 'k08e-karty-a.ts', 'mp.regenPerTurn', 'mp.werbMaxPrzyPelnejPuli'],
  ['karty-b-porzadek-field', 'k08e-karty-b.ts', 'state.porzadek', 'state.szczescie'],
  ['karty-b-porpct-band', 'k08e-karty-b.ts', 'porPctBand(por)', 'porPctBand(por + 1)'],
  // Stan topbar (capital, prawa do przycisku).
  ['topbar-capital-inverted', 'k08e-topbar.ts', 'capitalId === city.id', 'capitalId !== city.id'],
  ['topbar-setcapital-gate-off', 'k08e-topbar.ts', "if (!isMeCity(city.ownerId) || !cfg.onSetCapital) return '';", 'if (false) return "";'],
];

const baseFile = (rel) => join(CITY, rel);
const runHarness = () => spawnSync(process.execPath, [join(HERE, 'run-k08e-pin.mjs'), '--pin-dir', resolve(PIN_DIR), '--src', SRC_COPY], {
  encoding: 'utf8',
  timeout: 500000,
  cwd: V2_ROOT,
});

const rows = [];
let survived = 0;
let errors = 0;

const base = runHarness();
const baseOk = base.status === 0;
rows.push({ id: 'baseline', status: baseOk ? 'ZIELONY' : `CZERWONY(exit ${base.status})` });

for (const [id, rel, from, to] of MUTANTS) {
  const path = baseFile(rel);
  const original = readFileSync(path, 'utf8');
  const hits = original.split(from).length - 1;
  if (hits < 1) {
    rows.push({ id, status: 'BLAD-MUTANTA', detail: 'from nie występuje' });
    errors += 1;
    continue;
  }
  writeFileSync(path, original.split(from).join(to));
  try {
    const r = runHarness();
    if (r.status === 1) rows.push({ id, status: 'ZABITA', detail: `wystąpień=${hits}` });
    else if (r.status === 0) {
      rows.push({ id, status: 'PRZEZYLA' });
      survived += 1;
    } else {
      rows.push({ id, status: `BLAD-HARNESU(exit ${r.status})` });
      errors += 1;
    }
  } finally {
    writeFileSync(path, original);
  }
}

rmSync(TMP, { recursive: true, force: true });
for (const row of rows) console.log(`${row.id.padEnd(30)} ${row.status}${row.detail ? ` (${row.detail})` : ''}`);
const killed = rows.filter((r) => r.status === 'ZABITA').length;
console.log(`\nmutate-k08e-units: zabite ${killed}/${MUTANTS.length}, przeżyły ${survived}, błędy ${errors}, baseline ${baseOk ? 'OK' : 'FAIL'}`);
process.exit(baseOk && survived === 0 && errors === 0 ? 0 : 1);
