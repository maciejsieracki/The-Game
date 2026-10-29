#!/usr/bin/env node
/**
 * mutate-k08d-wealth.mjs — mutacje kopii K08D partii `wealth` (`k08d-wealth.ts`, `k08d-wealth-pasek.ts`) i delegatów
 * zamożności w `k08d-deps.ts` (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08D-Q1, runda 4, NAPRAW 3a).
 *
 * Dwa rodzaje:
 *   MUTATIONS        — literał w bloku pinu: zabity przez bramkę `verify-k08d-copies.mjs` (partia właściwa) LUB harness;
 *   FIELD_MUTATIONS  — pole/argument/delegat (tryb harness-only, bramka TEXT pominięta): zabity wyłącznie przez harness.
 * Plik jest przywracany bajt w bajt. EXIT 0 <=> baseline zielony i wszystkie mutacje zabite.
 *
 * Użycie (z katalogu `src-tauri/frontend-v2/`): node tools/dom-harness/mutate-k08d-wealth.mjs --pin-dir <PIN_DIR>
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
  console.error('Użycie: node tools/dom-harness/mutate-k08d-wealth.mjs --pin-dir <PIN_DIR>');
  process.exit(2);
}
const CP = join(V2, 'src/ui/cityPanel');
const FILES = {
  pasek: { path: join(CP, 'k08d-wealth-pasek.ts'), batch: 'wealth-pasek' },
  wealth: { path: join(CP, 'k08d-wealth.ts'), batch: 'wealth' },
  deps: { path: join(CP, 'k08d-deps.ts'), batch: null },
};

/** [plik, literał oryginalny, literał zmutowany, opis] — literał oryginalny musi wystąpić dokładnie raz. */
const MUTATIONS = [
  ['pasek', 'Kolejny W${nextW} za ok. ${opts.etaW}', 'Kolejny W${nextW} za ${opts.etaW}', 'appendWealthCompactStrip: tekst ETA'],
  ['pasek', "'Pełna — brak kolejnego poziomu w tej epoce'", "'Pełna'", 'buildWealthCompactTooltipCard: tekst pełnej puli'],
  ['wealth', "'Brak danych parametrów zamożności.'", "'Brak danych.'", 'renderWealth: tekst braku parametrów'],
  ['wealth', "'<span>Zamożność</span>'", "'<span>Zamozność</span>'", 'renderWealth: tytuł sekcji'],
  ['wealth', "'Pasek w panelu pokazuje tylko postęp puli", "'Pasek w panelu pokazuje postęp puli", 'buildWealthDetailCard: tekst wstępu'],
  ['wealth', "'→ do puli zamożności'", "'→ do puli'", 'buildWealthDetailCard: etykieta wiersza „Saldo"'],
];

/** Pola / argumenty / delegaty (harness-only). */
const FIELD_MUTATIONS = [
  ['wealth', 'const cap = wealthCap(epoch, wealthParams);', 'const cap = wealthCap(epoch + 1, wealthParams);', 'renderWealth: cap z epoki przesuniętej o 1'],
  ['wealth', 'const szBonus = wealthZadowolenie(ws.poziom, wealthParams, epoch);', 'const szBonus = wealthZadowolenie(ws.poziom, wealthParams, epoch + 1);', 'renderWealth: szBonus z epoki przesuniętej'],
  ['wealth', 'const mnoz = wealthMnoznik(ws.poziom, wealthParams);', 'const mnoz = wealthMnoznik(ws.poziom + 1, wealthParams);', 'renderWealth: mnożnik z poziomu przesuniętego'],
  ['wealth', 'const rown = wealthRownowaga(ws.poziom, epoch, p);', 'const rown = wealthRownowaga(ws.poziom + 1, epoch, p);', 'buildWealthDetailCard: równowaga z poziomu przesuniętego'],
  ['wealth', 'const szcz = wealthZadowolenie(ws.poziom, p, epoch);', 'const szcz = wealthZadowolenie(ws.poziom, p, epoch + 1);', 'buildWealthDetailCard: szczęście z epoki przesuniętej'],
  ['wealth', 'const prog = wealthProg(ws.poziom, epoch, p);', 'const prog = wealthProg(ws.poziom, epoch + 1, p);', 'buildWealthDetailCard: próg z epoki przesuniętej'],
  ['wealth', 'const podzial = readPodzialHandlu(city, data);', 'const podzial = readPodzialHandlu(city, null);', 'buildWealthDetailCard: podział bez danych (data nie przekazane)'],
  ['deps', "depK08d('wealthCap')(epoch, p)", "depK08d('wealthCap')(epoch + 1, p)", 'wealthCap (k08d-deps): epoka przesunięta'],
  ['deps', "depK08d('wealthMnoznik')(poziom, p)", "depK08d('wealthMnoznik')(poziom + 1, p)", 'wealthMnoznik (k08d-deps): poziom przesunięty'],
  ['deps', "depK08d('loadWealthParams')(econParams, difficulty)", "depK08d('loadWealthParams')(econParams, 'hard')", 'loadWealthParams (k08d-deps): trudność zafiksowana'],
];

const runCheck = (cmd, argv) => {
  try {
    execFileSync(cmd, argv, { cwd: V2, stdio: 'pipe' });
    return 0;
  } catch (e) {
    return typeof e.status === 'number' ? e.status : 2;
  }
};
const verifyBatch = (batch) => runCheck('node', ['tools/dom-harness/verify-k08d-copies.mjs', '--pin-dir', PIN_DIR, '--batch', batch]);
const harness = () => runCheck('node', ['tools/dom-harness/run-k08d-wealth-pin.mjs', '--pin-dir', PIN_DIR]);
const verifyFor = (key) => (FILES[key].batch ? verifyBatch(FILES[key].batch) : 0);

const base = { verifyPasek: verifyBatch('wealth-pasek'), verifyWealth: verifyBatch('wealth'), harness: harness() };
if (base.verifyPasek !== 0 || base.verifyWealth !== 0 || base.harness !== 0) {
  console.error(`BASELINE FAIL: ${JSON.stringify(base)}`);
  process.exit(1);
}
console.log('baseline: verify wealth-pasek=0, verify wealth=0, harness=0');

const mutateOnce = (file, from, to, runVerify, key) => {
  const orig = readFileSync(file, 'utf8');
  const count = orig.split(from).length - 1;
  if (count !== 1) return { error: `literał wystąpił ${count} razy` };
  let rc;
  try {
    writeFileSync(file, orig.split(from).join(to));
    rc = { verify: runVerify ? verifyFor(key) : 0, harness: harness() };
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
  const r = mutateOnce(FILES[key].path, from, to, true, key);
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
  const r = mutateOnce(FILES[key].path, from, to, false, key);
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
console.log(`\nmutacje wealth: ZABITE ${killed}/${total} (pola/delegaty harness-only: ${fieldKilled}/${FIELD_MUTATIONS.length})`);
process.exit(killed === total ? 0 : 1);
