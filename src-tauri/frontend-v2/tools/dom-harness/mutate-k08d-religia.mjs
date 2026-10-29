#!/usr/bin/env node
/**
 * mutate-k08d-religia.mjs — mutacje kopii K08D partii `religia` (`k08d-religia.ts`) i delegatów religii w `k08d-deps.ts`
 * (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08D-Q1, runda 3, NAPRAW 3c).
 *
 * Dwa rodzaje:
 *   MUTATIONS        — literał w bloku pinu: zabity przez bramkę `verify-k08d-copies.mjs --batch religia` LUB harness;
 *   FIELD_MUTATIONS  — pole/klucz/delegat (tryb harness-only, bramka TEXT pominięta): zabity wyłącznie przez harness.
 * Plik jest przywracany bajt w bajt. EXIT 0 <=> wszystkie mutacje zabite.
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`): node tools/dom-harness/mutate-k08d-religia.mjs --pin-dir <PIN_DIR>
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const argOf = (k) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const HERE = dirname(fileURLToPath(import.meta.url));
const V2 = resolve(HERE, '../..');
const PIN_DIR = argOf('--pin-dir');
if (!PIN_DIR) {
  console.error('Użycie: node tools/dom-harness/mutate-k08d-religia.mjs --pin-dir <PIN_DIR>');
  process.exit(2);
}
const CP = join(V2, 'src/ui/cityPanel');
const FILES = { religia: join(CP, 'k08d-religia.ts'), deps: join(CP, 'k08d-deps.ts') };

/** [plik, literał oryginalny, literał zmutowany, opis] — literał oryginalny musi wystąpić dokładnie raz. */
const MUTATIONS = [
  ['religia', "label: 'Państwo',", "label: 'Panstwo',", 'renderReligia: etykieta chipu Państwo'],
  ['religia', "'Szerzenie', 'Sąsiednie miasta + Świątynia przyspieszają konwersję'", "'Szerzenie', 'Sąsiednie miasta'", 'buildTopBarReligiaDetailCard: tekst karty (Szerzenie)'],
  ['religia', "const val = row.note ? `${row.pct}% · ${row.note}` : `${row.pct}%`;", "const val = row.note ? `${row.pct}% - ${row.note}` : `${row.pct}%`;", 'appendCompositionBlock: separator wiersza'],
  ['religia', "'Brak rozpisanych składników religii w tym mieście.',", "'Brak składników.',", 'renderReligia: tekst pustego składu'],
];

/** Pola / delegaty (harness-only). */
const FIELD_MUTATIONS = [
  ['religia', 'const xRelTop = religiaXRelTop(city.ownerId, data);', 'const xRelTop = religiaXRelTop(city.id, data);', 'religiaXRelTop: klucz miasta zamiast właściciela'],
  ['religia', 'const relSzPkt = relState ? religiaSzPunkty(relState.wplywSzczescie, city.ownerId) : 0;', 'const relSzPkt = relState ? religiaSzPunkty(relState.wplywSzczescie, city.id) : 0;', 'renderReligia: relSzPkt z id miasta zamiast właściciela'],
  ['religia', 'const szPkt = religiaSzPunkty(relState.wplywSzczescie, city.ownerId);', 'const szPkt = religiaSzPunkty(relState.wplywSzczescie, city.id);', 'renderReligia: szPkt karty z id miasta'],
  ['religia', 'const szPkt = religiaSzPunkty(relState.wplywSzczescie, city.ownerId);', 'const szPkt = religiaSzPunkty(relState.przyrostWiernych ?? 0, city.ownerId);', 'renderReligia: szPkt z przyrostu zamiast wpływu'],
  ['deps', "depK08d('religiaSzPunkty')(wskaznik, ownerId)", "depK08d('religiaSzPunkty')(wskaznik, ownerId + 1)", 'religiaSzPunkty (k08d-deps): przesunięty ownerId'],
  ['deps', "depK08d('religiaXRelTop')(ownerId, data)", "depK08d('religiaXRelTop')(ownerId + 1, data)", 'religiaXRelTop (k08d-deps): przesunięty ownerId'],
];

const runCheck = (cmd, argv) => {
  try {
    execFileSync(cmd, argv, { cwd: V2, stdio: 'pipe' });
    return 0;
  } catch (e) {
    return typeof e.status === 'number' ? e.status : 2;
  }
};
const verifyBatch = () => runCheck('node', ['tools/dom-harness/verify-k08d-copies.mjs', '--pin-dir', PIN_DIR, '--batch', 'religia']);
const harness = () => runCheck('node', ['tools/dom-harness/run-k08d-religia-pin.mjs', '--pin-dir', PIN_DIR]);

const base = { verify: verifyBatch(), harness: harness() };
if (base.verify !== 0 || base.harness !== 0) {
  console.error(`BASELINE FAIL: ${JSON.stringify(base)}`);
  process.exit(1);
}
console.log('baseline: verify religia=0, harness=0');

const mutateOnce = (file, from, to, runVerify) => {
  const orig = readFileSync(file, 'utf8');
  const count = orig.split(from).length - 1;
  if (count !== 1) return { error: `literał wystąpił ${count} razy` };
  let rc;
  try {
    writeFileSync(file, orig.split(from).join(to));
    rc = { verify: runVerify ? verifyBatch() : 0, harness: harness() };
  } finally {
    writeFileSync(file, orig);
  }
  if (readFileSync(file, 'utf8') !== orig) return { error: 'PRZYWRACANIE NIEUDANE' };
  return rc;
};

let killed = 0;
let total = 0;
for (const [key, from, to, desc] of MUTATIONS) {
  total++;
  const r = mutateOnce(FILES[key], from, to, true);
  if (r.error) {
    console.log(`BLAD-MUTANTA ${desc}: ${r.error}`);
    process.exit(2);
  }
  const isKilled = r.verify !== 0 || r.harness !== 0;
  if (isKilled) killed++;
  console.log(`${isKilled ? 'ZABITA' : 'PRZEZYTA'} ${desc} | verify=${r.verify} harness=${r.harness}`);
}
let fieldKilled = 0;
for (const [key, from, to, desc] of FIELD_MUTATIONS) {
  total++;
  const r = mutateOnce(FILES[key], from, to, false);
  if (r.error) {
    console.log(`BLAD-MUTANTA ${desc}: ${r.error}`);
    process.exit(2);
  }
  const isKilled = r.harness !== 0;
  if (isKilled) {
    fieldKilled++;
    killed++;
  }
  console.log(`${isKilled ? 'ZABITA' : 'PRZEZYTA'} [pole, harness-only] ${desc} | harness=${r.harness}`);
}
console.log(`\nmutacje religia: ZABITE ${killed}/${total} (pola/delegaty harness-only: ${fieldKilled}/${FIELD_MUTATIONS.length})`);
process.exit(killed === total ? 0 : 1);
