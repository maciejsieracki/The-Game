'use strict';
/**
 * no-negative-stocks-ai-t2-behavior-test.cjs — R-WEB-NNS-AI-TURN2-NEGATIVE-TREASURY-Q1 (test BEHAWIORALNY).
 *
 * Uruchamia realną grę (realny bundle vite, headless Chromium, realne „Zakończ turę”) przez runner
 * no-negative-stocks-headless-measure.cjs na ziarnie 33 przez tury 1–4 i wymaga, by żaden właściciel AI
 * nie kończył tury 2–4 ze skarbcem < 0 po zakończeniu tury (kolumna `skEnd` = stan po całej turze AI;
 * kolumna `sk` zawiera surowe bankowanie przed klamrą, więc NIE jest kryterium końca tury).
 * Test statyczny (includes w źródle main.ts) NIE wystarcza — ten test wykonuje ścieżkę tury.
 *
 * Użycie (z gra/; bundle budowany OSOBNO poza repo: node ./node_modules/vite/bin/vite.js build --outDir <dist>):
 *   node tools/no-negative-stocks-ai-t2-behavior-test.cjs --dist <dist>
 * Wynik: exit 0 = PASS, 1 = FAIL (naruszenia wypisane), 2 = błąd użycia / brak wierszy (test nie może być pusty).
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : def;
}

const DIST = arg('dist', null);
if (!DIST) {
  console.error('wymagane: --dist <bundle>');
  process.exit(2);
}
const SEED = '33';
const TURNS = 4;
const RUNNER = path.join(__dirname, 'no-negative-stocks-headless-measure.cjs');
const OUT = fs.mkdtempSync(path.join(os.tmpdir(), 'nns-t2-behavior-'));

const run = spawnSync(
  process.execPath,
  [RUNNER, '--dist', DIST, '--out', OUT, '--seeds', SEED, '--turns', String(TURNS), '--modes', 'on', '--cell-sec', '400'],
  { stdio: 'inherit', timeout: 500000 },
);
if (run.status !== 0) {
  console.error('[nns-t2-behavior] runner zakończył się kodem', run.status, run.error ? String(run.error) : '');
  process.exit(2);
}

const cellFile = path.join(OUT, `cell-on-${SEED}.json`);
if (!fs.existsSync(cellFile)) {
  console.error('[nns-t2-behavior] brak pliku komórki:', cellFile);
  process.exit(2);
}
const cell = JSON.parse(fs.readFileSync(cellFile, 'utf8'));
const rows = (cell.rows || []).filter(r => r.turn >= 2 && r.turn <= TURNS);
if (rows.length === 0) {
  console.error('[nns-t2-behavior] zero wierszy AI dla tur 2–' + TURNS + ' — test pusty, nie zalicza się');
  process.exit(2);
}
const neg = rows.filter(r => r.skEnd < 0);
console.log(`[nns-t2-behavior] wiersze AI tury 2–${TURNS}: ${rows.length}; skarbiec < 0 po turze: ${neg.length}`);
for (const r of neg.slice(0, 20)) {
  console.log(`  NARUSZENIE tura ${r.turn} oid ${r.oid} (${r.civ}) skEnd=${r.skEnd} (bank przed klamrą sk=${r.sk})`);
}
if (neg.length === 0) {
  console.log('PASS: no-negative-stocks-ai-t2-behavior-test');
  process.exit(0);
}
console.log('FAIL: no-negative-stocks-ai-t2-behavior-test');
process.exit(1);
