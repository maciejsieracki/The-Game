'use strict';
/**
 * econ-measure-run.cjs -- R-WEB-ECONOMY-MEASURE-EXTEND-INCOME-STOCKS-Q1: cienki wrapper na
 * `ai-economy-measure-run.cjs` (ten sam runner, te same blokady modalne, ten sam hak metryk
 * `__aiEconomyMeasure.metrics()` z polami `hud` per właściciel). Wrapper NIE zmienia logiki pomiaru:
 * przekazuje wszystkie argumenty bez zmian do runnera.
 *
 * Uzycie (z gra/, bundle budowany POZA repo, jak runner):
 *   node tools/econ-measure-run.cjs --dist <abs-dist> --profile <abs-profil> --out <abs-katalog> --seed 4242 --turns 150
 * Wynik: <out>/seed<S>.jsonl (pola `hud` w owners[]), seed<S>.state.json, seed<S>.summary.json.
 * Analiza: node tools/econ-measure-analyze.cjs --in <abs-katalog>
 */
const path = require('path');
const { spawnSync } = require('child_process');

const runner = path.resolve(__dirname, 'ai-economy-measure-run.cjs');
const r = spawnSync(process.execPath, [runner, ...process.argv.slice(2)], { stdio: 'inherit' });
process.exit(r.status === null ? 1 : r.status);
