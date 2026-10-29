#!/usr/bin/env node
/**
 * mutate-k05b-dto.mjs — mutacje producenta DTO `panelInputs.k05a` (P5-8 K05B, runda 2, ZADANIE 1).
 * Każda mutacja zmienia DOKŁADNIE jedno wystąpienie wzorca w `src/controller/cityPanelK05a.ts` (w pamięci, plugin esbuild
 * w run-k05b-dto.mjs). Mutant ZABITY = harness EXIT 1; PRZEZYL = EXIT 0; BLAD = EXIT 2 lub wzorzec niejednoznaczny.
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`): node tools/dom-harness/mutate-k05b-dto.mjs
 * EXIT 0 <=> wszystkie zabite; 1 <=> >=1 przeżył lub błąd.
 */
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const V2_ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const FILE = join(V2_ROOT, 'src/controller/cityPanelK05a.ts');
const HARNESS = join(V2_ROOT, 'tools/dom-harness/run-k05b-dto.mjs');

/** [id, z, na] — `z` musi wystąpić w pliku dokładnie raz. */
const MUTANTS = [
  ['dto-zamiana-owner-city', 'empireRekruciTotalByOwner: copyRec(raw.empireRekruciTotal),', 'empireRekruciTotalByOwner: copyRec(raw.manpowerBiezacy),'],
  ['dto-zamiana-city-owner', 'manpowerBiezacyByCity: copyRec(raw.manpowerBiezacy),', 'manpowerBiezacyByCity: copyRec(raw.empireRekruciTotal),'],
  ['dto-koszt-jednostek-pusty', 'manpowerCostByUnit: copyRec(raw.manpowerCost),', 'manpowerCostByUnit: undefined,'],
  ['dto-lancuch-odwrocony', '[k, [...v]]', '[k, [...v].reverse()]'],
  ['dto-etykiety-pusty', 'stockResourceLabelByKey: copyRec(raw.stockLabels),', 'stockResourceLabelByKey: undefined,'],
  ['dto-koszt-surowcowy-pole', '[k, { ...v }]', '[k, { ...v, extra: 1 }]'],
  ['dto-atrapa-wartosc', 'empireRekruciTotal: { 0: 14 },', 'empireRekruciTotal: { 0: 15 },'],
  ['dto-atrapa-koszt', 'manpowerCost: { phalanx: 6, lucznik: 4 },', 'manpowerCost: { phalanx: 6, lucznik: 5 },'],
];

let killed = 0;
const survived = [];
const errors = [];
for (const [id, from, to] of MUTANTS) {
  const src = readFileSync(FILE, 'utf8');
  const n = src.split(from).length - 1;
  if (n !== 1) {
    errors.push(`${id}: wzorzec występuje ${n} razy`);
    console.log(`BLAD    ${id}: wzorzec występuje ${n} razy`);
    continue;
  }
  const env = { ...process.env, K05B_MUTANT: JSON.stringify({ file: 'cityPanelK05a.ts', from, to }) };
  const r = spawnSync(process.execPath, [HARNESS], { env, encoding: 'utf8', timeout: 240000 });
  if (r.status === 1) {
    killed++;
    console.log(`ZABITY  ${id}`);
  } else if (r.status === 0) {
    survived.push(id);
    console.log(`PRZEZYL ${id}`);
  } else {
    errors.push(`${id}: EXIT ${r.status}`);
    console.log(`BLAD    ${id}: EXIT ${r.status}`);
  }
}
console.log(`mutantów ${MUTANTS.length}, zabitych ${killed}, przeżytych ${survived.length}, błędów ${errors.length}`);
if (survived.length) console.log(`przeżyte: ${survived.join(', ')}`);
process.exit(survived.length === 0 && errors.length === 0 ? 0 : 1);
