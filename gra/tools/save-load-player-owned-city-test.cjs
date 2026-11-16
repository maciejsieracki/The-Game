#!/usr/bin/env node
/**
 * R-WEB-SAVE-LOAD-PLAYER-OWNED-CITY-AND-LEDGER-HISTORY-Q1 (#433) -- test regresji flagi
 * `playerEverOwnedCityByOwner` w zapisie/wczytaniu.
 *
 * Defekt: flaga (per fotel) nie byla zapisywana, a po wczytaniu odtwarzana heurystycznie
 * ("ma miasto teraz"). Gracz z 0 miastami po wczytaniu mial false, wiec isAwaitingFirstPlayerCity
 * blokowalo "Zakoncz ture" mimo ze gracz kiedys mial miasto.
 *
 * Warstwa STATYCZNA (ulamek sekundy):
 *   - zapis: meta.playerEverOwnedCityByOwner dopisywane z Array.from(playerEverOwnedCityByOwner)
 *     (tylko gdy zbior niepusty -- bajty zapisu bez zmian gdy pusty);
 *   - odczyt: w restoreGameFromSave po heurystyce, chroniony Array.isArray + typeof number;
 *   - mutacja na KOPII main.ts (usuniecie odczytu) MUSI dac FAIL.
 *
 * Uzycie (z gra/):
 *   node tools/save-load-player-owned-city-test.cjs [--main <sciezka do main.ts>]
 * Exit 1 przy kazdym niepowodzeniu.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : def;
}

const GRA = path.resolve(__dirname, '..');
const MAIN_TS = path.resolve(arg('main', path.join(GRA, 'src', 'main.ts')));

let failures = 0;
function check(ok, msg) {
  console.log((ok ? 'OK    ' : 'FAIL  ') + msg);
  if (!ok) failures++;
}

const SAVE_RE = /\.\.\.\(playerEverOwnedCityByOwner\.size > 0\s*\?\s*\{\s*playerEverOwnedCityByOwner:\s*Array\.from\(playerEverOwnedCityByOwner\)\s*\}\s*:\s*\{\}\)/;
const RESTORE_RE = /const savedEverOwnedCity: unknown = saved\.meta\?\.playerEverOwnedCityByOwner;\s*if \(Array\.isArray\(savedEverOwnedCity\)\)\s*\{[\s\S]{0,250}playerEverOwnedCityByOwner\.add\(oid\)/;
const HEURISTIC_RE = /if \(cities\.some\(c => c\.ownerId === oid\)\) playerEverOwnedCityByOwner\.add\(oid\);/;

// Zwraca liczbe NIEspelnionych warunkow statycznych dla danego zrodla (0 = wszystko na miejscu).
function staticFailures(src) {
  let bad = 0;
  if (!SAVE_RE.test(src)) bad++;
  if (!RESTORE_RE.test(src)) bad++;
  if (!HEURISTIC_RE.test(src)) bad++;
  return bad;
}

const src = fs.readFileSync(MAIN_TS, 'utf8');
check(SAVE_RE.test(src), 'main.ts: zapis meta.playerEverOwnedCityByOwner (tylko gdy niepusty)');
check(RESTORE_RE.test(src), 'main.ts: odczyt z Array.isArray + typeof number po heurystyce');
check(HEURISTIC_RE.test(src), 'main.ts: heurystyka "ma miasto teraz" zachowana dla starych zapisow');

// Mutacje na KOPIACH (nie na main.ts): kazda musi byc WYKRYTA przez staticFailures (wynik > 0).
// Mutacja A: usuniecie bloku odczytu. Mutacja B: usuniecie zapisu. Zaden z warunkow nie jest
// sprawdzany przez siebie samego -- liczy sie to, czy test zaczerwienieje sie na zmienionym kodzie.
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pownedcity-mut-'));
const mutants = {
  'bez odczytu (RESTORE)': src.replace(RESTORE_RE, 'NOOP_MUTANT_RESTORE'),
  'bez zapisu (SAVE)': src.replace(SAVE_RE, 'NOOP_MUTANT_SAVE'),
};
for (const [name, text] of Object.entries(mutants)) {
  const p = path.join(tmpDir, 'main-mutant.ts');
  fs.writeFileSync(p, text);
  const n = staticFailures(fs.readFileSync(p, 'utf8'));
  check(n > 0, `mutacja kopii "${name}" wykryta przez test (niespelnionych warunkow: ${n})`);
}
fs.rmSync(tmpDir, { recursive: true, force: true });
check(staticFailures(src) === 0, 'main.ts: wszystkie warunki statyczne spelnione');

console.log(failures === 0 ? 'RESULT: PASS' : `RESULT: FAIL (${failures})`);
process.exit(failures === 0 ? 0 : 1);
