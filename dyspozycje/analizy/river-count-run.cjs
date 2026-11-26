'use strict';
/**
 * Runner równoległy do river-count-measure-2x.cjs (R-WEB-MAP-RIVER-TIERS-RECON-Q1, r3).
 * Użycie: node river-count-run.cjs <SCRATCH> <wiersze JSON-owe jako plik> <plik-wyjściowy.jsonl> [równoległość=4]
 * Wiersz zadania (JSON): {"label":"V3sep1","env":{"RIVER_PATHSEP":"1"},"args":["84","60","1","base","main+medium","kontynenty"]}
 * Zasada: jedno zadanie = jeden proces node measure-one.cjs (SCRATCH po `prepare`).
 * Wynik: do pliku wyjściowego dopisywana linia JSON {label, env, r:{...pomiar...}} po zakończeniu zadania.
 */
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const [, , SCRATCH, JOBS, OUT, PAR] = process.argv;
const par = Number(PAR || 4);
const jobs = fs.readFileSync(JOBS, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
let next = 0;
let running = 0;
function launch() {
  while (running < par && next < jobs.length) {
    const job = jobs[next++];
    running++;
    const child = cp.spawn('node', [path.join(SCRATCH, 'measure-one.cjs'), ...job.args], {
      env: { ...process.env, ...(job.env || {}) },
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    let buf = '';
    child.stdout.on('data', (d) => { buf += d; });
    child.on('close', () => {
      const line = buf.split('\n').find((l) => l.startsWith('{'));
      let r = null;
      try { r = JSON.parse(line); } catch { /* nieudany pomiar */ }
      fs.appendFileSync(OUT, JSON.stringify({ label: job.label, env: job.env || {}, r }) + '\n');
      running--;
      launch();
    });
  }
}
launch();
