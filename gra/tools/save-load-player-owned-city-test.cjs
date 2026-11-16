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

function staticChecks(src, label) {
  check(SAVE_RE.test(src), `${label}: zapis meta.playerEverOwnedCityByOwner (tylko gdy niepusty)`);
  check(RESTORE_RE.test(src), `${label}: odczyt z Array.isArray + typeof number po heurystyce`);
  check(HEURISTIC_RE.test(src), `${label}: heurystyka "ma miasto teraz" zachowana dla starych zapisow`);
}

const src = fs.readFileSync(MAIN_TS, 'utf8');
staticChecks(src, 'main.ts');

// mutacja na KOPII: usuniecie bloku odczytu musi dac FAIL (test wykrywa brak odtworzenia flagi)
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pownedcity-mut-'));
const mutPath = path.join(tmpDir, 'main-mutant.ts');
const mutated = src.replace(RESTORE_RE, 'NOOP_MUTANT');
fs.writeFileSync(mutPath, mutated);
const mutSrc = fs.readFileSync(mutPath, 'utf8');
check(!RESTORE_RE.test(mutSrc), 'mutacja kopii: blok odczytu usuniety -> odczyt NIE istnieje');
check(SAVE_RE.test(mutSrc), 'mutacja kopii: zapis nadal obecny (mutacja dotyczy tylko odczytu)');
fs.rmSync(tmpDir, { recursive: true, force: true });

console.log(failures === 0 ? 'RESULT: PASS' : `RESULT: FAIL (${failures})`);
process.exit(failures === 0 ? 0 : 1);
