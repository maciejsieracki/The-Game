#!/usr/bin/env node
/**
 * mutate-k08e-wiring.mjs — mutacje WIRINGU K08E (`src/controller/k08eWiring.ts`), P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08E-Q1,
 * runda 2 (odpowiedź na zarzut: brak mutacji wiringu K08E).
 *
 * Każda mutacja = kopia wiringu z JEDNĄ zmianą (obok oryginału, nazwa z kropką), uruchomienie
 * `run-k08e-wiring.mjs --wiring <kopia>`. ZABITA = harness EXIT 1 (FAIL checku). EXIT 2 (błąd harnessu) NIE liczy się
 * jako zabicie. Oryginał nie jest zmieniany. Baseline (oryginał) musi dać EXIT 0.
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`): node tools/dom-harness/mutate-k08e-wiring.mjs
 * EXIT 0 <=> baseline zielony i wszystkie mutacje zabite; 1 <=> przeżycie lub błąd mutanta; 2 <=> błąd narzędzia.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const V2_ROOT = resolve(HERE, '../..');
const SRC = join(V2_ROOT, 'src/controller/k08eWiring.ts');
const base = readFileSync(SRC, 'utf8');

/** [id, from, to] — `from` musi wystąpić w pliku dokładnie raz. */
const MUTANTS = [
  ['rationParams-args-swapped', 'rules.buildRationParams(econParams, difficulty)', 'rules.buildRationParams(difficulty as never, econParams as never)'],
  ['rationParams-difficulty-fixed', 'rules.buildRationParams(econParams, difficulty)', "rules.buildRationParams(econParams, 'normal')"],
  ['ludnosc-epoch-shifted', 'rules.cityLudnoscAbsolutna(population, epoch)', 'rules.cityLudnoscAbsolutna(population, epoch + 1)'],
  ['ludnosc-population-dropped', 'rules.cityLudnoscAbsolutna(population, epoch)', 'rules.cityLudnoscAbsolutna(0, epoch)'],
  ['orderState-data-dropped', 'rules.resolveOrderState(city, data)', 'rules.resolveOrderState(city, null as never)'],
  ['orderState-delegate-dropped', '    resolveOrderState: (city, data) => rules.resolveOrderState(city, data),\n', ''],
  ['switchCity-dir-inverted', 'rules.switchCity(dir)', 'rules.switchCity(dir === 1 ? -1 : 1)'],
  ['cityHealth-map-dropped', 'rules.resolveCityHealth(city, map, data)', 'rules.resolveCityHealth(city, null as never, data)'],
  ['cityHealth-data-dropped', 'rules.resolveCityHealth(city, map, data)', 'rules.resolveCityHealth(city, map, null as never)'],
  ['porPctBand-delegate-dropped', '    porPctBand: (por) => rules.porPctBand(por),\n', ''],
  ['porBandLabel-band-shifted', 'rules.porBandLabel(band)', "rules.porBandLabel(band + 'x')"],
  ['ownerCities-delegate-dropped', '    ownerCities: (city) => rules.ownerCities(city),\n', ''],
  ['cityPanelTitle-city-dropped', 'rules.cityPanelTitle(city)', 'rules.cityPanelTitle(null as never)'],
  ['flankChips-view-dropped', 'rules.buildCityOnlyW3FlankChips(city, view, data, map)', 'rules.buildCityOnlyW3FlankChips(city, null as never, data, map)'],
  ['flankChips-map-dropped', 'rules.buildCityOnlyW3FlankChips(city, view, data, map)', 'rules.buildCityOnlyW3FlankChips(city, view, data, null)'],
];

const rows = [];
let survived = 0;
let errors = 0;

const runHarness = (wiringPath) => spawnSync(process.execPath, [join(HERE, 'run-k08e-wiring.mjs'), '--wiring', wiringPath], {
  encoding: 'utf8',
  timeout: 300000,
});

/* Baseline: oryginał musi być zielony. */
const baseRun = runHarness(SRC);
const baseOk = baseRun.status === 0;
rows.push({ id: 'baseline', status: baseOk ? 'ZIELONY' : `CZERWONY(exit ${baseRun.status})` });

for (const [id, from, to] of MUTANTS) {
  const hits = base.split(from).length - 1;
  if (hits !== 1) {
    rows.push({ id, status: 'BLAD-MUTANTA', detail: `from wystąpień=${hits}` });
    errors += 1;
    continue;
  }
  const mutantPath = join(dirname(SRC), `.mut-k08eWiring-${id}.ts`);
  writeFileSync(mutantPath, base.replace(from, to));
  try {
    const r = runHarness(mutantPath);
    if (r.status === 1) {
      rows.push({ id, status: 'ZABITA' });
    } else if (r.status === 0) {
      rows.push({ id, status: 'PRZEZYLA' });
      survived += 1;
    } else {
      rows.push({ id, status: `BLAD-HARNESU(exit ${r.status})` });
      errors += 1;
    }
  } finally {
    rmSync(mutantPath, { force: true });
  }
}

for (const row of rows) console.log(`${row.id.padEnd(32)} ${row.status}${row.detail ? ` (${row.detail})` : ''}`);
const killed = rows.filter((r) => r.status === 'ZABITA').length;
console.log(`\nmutate-k08e-wiring: zabite ${killed}/${MUTANTS.length}, przeżyły ${survived}, błędy ${errors}, baseline ${baseOk ? 'OK' : 'FAIL'}`);
process.exit(survived === 0 && errors === 0 && baseOk ? 0 : errors > 0 && baseOk && survived === 0 ? 2 : 1);
