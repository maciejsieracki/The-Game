'use strict';
/**
 * diplomacy-measure-resume-test.cjs -- R-WEB-DIPLO-MEASURE-RESUMABLE-FLAGS-ONOFF-Q1: test wznowienia runnera
 * diplomacy-harder-measure-run.cjs (--stop-at).
 *
 * Asercje:
 *  P) (zawsze, bez przegladarki) pin tekstowy: runner ma opcje --stop-at, slot `dipl-measure-<TAG>`, wczytanie slotu
 *     (loadSlot) w gałęzi wznowienia, zapis slotu (quickSave), stan w <TAG>.state.json, ponowne ustawienie flag po
 *     wczytaniu (applyFlags) i obcięcie jsonl do tury slotu.
 *  R) (przegladarka; tylko z --run 1) ciagly przebieg 1..6 (--every 1) vs dwa odcinki 1..3 + 3..6 (--stop-at 3, potem 6)
 *     z tym samym --out/--profile. Porownanie: te same tury, brak duplikatow, te same wiersze bez pola czasu `sec`.
 *  C) (bez przegladarki; --a <katalog> --b <katalog>) porownanie gotowych wynikow obu wariantow (ten sam TAG).
 *
 * Uzycie (z gra/): node tools/diplomacy-measure-resume-test.cjs [--a <abs>] [--b <abs>] [--run 1 --dist <abs>]
 *   --run 1 uruchamia runner 3 razy (ok. 5 min lacznie w Chromium); pojedyncze polecenie Bash < 590 s, wiec
 *   przy wolnej maszynie uruchom pinowanie + porownanie z gotowych katalogow.
 */
const { TMPDIR_RUN_ID } = require('./_tmp-unique.cjs');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : def;
}

const GRA_DIR = path.resolve(__dirname, '..');
const RUNNER = path.join(GRA_DIR, 'tools', 'diplomacy-harder-measure-run.cjs');
const RUN = arg('run', '0') === '1';
const DIST = path.resolve(arg('dist', path.join(os.tmpdir(), `diplo-harder-dist-${TMPDIR_RUN_ID}`)));
const BASE = path.resolve(arg('base', path.join(os.tmpdir(), `diplo-resume-test-${TMPDIR_RUN_ID}`)));
const DIR_A = path.resolve(arg('a', path.join(BASE, 'A')));
const DIR_B = path.resolve(arg('b', path.join(BASE, 'B')));
const TAG = 'seed4242-harder0';
const SEED = '4242';
const TURNS = 6;

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok: !!ok });
  console.log((ok ? 'ZIELONE ' : 'CZERWONE ') + name + (detail ? ' :: ' + detail : ''));
}

// P) pin tekstowy wznowienia.
const src = fs.readFileSync(RUNNER, 'utf8');
check('P1 opcja --stop-at obecna', /indexOf\('--stop-at'\)/.test(src) && /arg\('stop-at'/.test(src));
check('P2 slot dipl-measure-<TAG>', /const SLOT = 'dipl-measure-' \+ TAG;/.test(src));
check('P3 wznowienie wczytuje slot (loadSlot) zamiast foundFirstCity', /loadSlot\(slot\)/.test(src) && /if \(fresh\)/.test(src));
check('P4 zapis slotu (quickSave) na granicy co --every i na koncu odcinka',
  /quickSave\(slot\)/.test(src) && /turn >= STOP_AT/.test(src));
check('P5 stan wznowienia <TAG>.state.json', /TAG \+ '\.state\.json'/.test(src));
check('P6 flagi ponownie ustawiane po wczytaniu (applyFlags)', /await applyFlags\(page\);/.test(src));
check('P7 jsonl obcinany do tury slotu przy wznowieniu', /JSON\.parse\(l\)\.turn <= slotTurn/.test(src));
check('P8 bez --stop-at brak zapisu slotu (domyslne wywolanie jak dotad)', /if \(SEGMENT && \(turn/.test(src));

// R) przebiegi (opcjonalnie).
function runRunner(out, profile, stopAt) {
  const args = [RUNNER, '--dist', DIST, '--out', out, '--profile', profile, '--seed', SEED, '--turns', String(TURNS), '--every', '1', '--harder', '0'];
  if (stopAt !== null) args.push('--stop-at', String(stopAt));
  execFileSync(process.execPath, args, { cwd: GRA_DIR, stdio: 'pipe', timeout: 560000, env: Object.assign({}, process.env, { CHROME_PATH: process.env.CHROME_PATH || '/usr/bin/google-chrome' }) });
}
if (RUN) {
  fs.mkdirSync(DIR_A, { recursive: true });
  fs.mkdirSync(DIR_B, { recursive: true });
  runRunner(DIR_A, path.join(BASE, 'profA'), null);
  runRunner(DIR_B, path.join(BASE, 'profB'), 3);
  runRunner(DIR_B, path.join(BASE, 'profB'), TURNS);
}

// C) porownanie wynikow.
function readRows(dir) {
  const f = path.join(dir, TAG + '.jsonl');
  if (!fs.existsSync(f)) return null;
  return fs.readFileSync(f, 'utf8').split('\n').filter(l => l.trim()).map(l => JSON.parse(l));
}
const rowsA = readRows(DIR_A);
const rowsB = readRows(DIR_B);
const podanoAB = process.argv.includes('--a') || process.argv.includes('--b');
if (!RUN && !podanoAB) {
  // Brak wynikow do porownania (ani --a/--b, ani --run 1): bieg niemozliwy bez danych -> NIE ZMIERZONO, nie CZERWONE.
  console.log('NIE ZMIERZONO :: C1-C4 pominiete: brak --a/--b i --run 1 (pin P1-P8 wykonany)');
} else if (rowsA === null || rowsB === null) {
  check('C0 wyniki obu wariantow istnieja', false, 'brak ' + TAG + '.jsonl w --a lub --b');
} else {
  const turnsA = rowsA.map(r => r.turn);
  const turnsB = rowsB.map(r => r.turn);
  const expected = Array.from({ length: TURNS - 1 }, (_, i) => i + 2);
  check('C1 ciagly: tury 2..6 (--every 1)', JSON.stringify(turnsA) === JSON.stringify(expected), JSON.stringify(turnsA));
  check('C2 wznowiony: te same tury co ciagly, bez duplikatow', JSON.stringify(turnsB) === JSON.stringify(turnsA), JSON.stringify(turnsB));
  check('C3 brak zdublowanych tur w wznowionym', new Set(turnsB).size === turnsB.length);
  const strip = r => { const o = Object.assign({}, r); delete o.sec; return JSON.stringify(o); };
  const same = rowsA.length === rowsB.length && rowsA.every((r, i) => strip(r) === strip(rowsB[i]));
  check('C4 wiersze identyczne poza polem czasu sec', same);
}

const failed = results.filter(r => !r.ok).length;
console.log(`WYNIK: ${results.length - failed} zielonych, ${failed} czerwonych`);
process.exit(failed ? 1 : 0);
