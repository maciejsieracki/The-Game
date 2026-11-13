'use strict';
/**
 * measure-ai-trade-offer-frequency-matrix.cjs — R-WEB-AI-TRADE-OFFER-FREQUENCY-MEASURE-Q1 (r3): wznawialny runner macierzy.
 *
 * Macierz ziarna x relacje (domyslnie 1111,2222,3333 x 20,80,140), kazda komorka = jeden przebieg
 * `measure-ai-trade-offer-frequency.cjs` (MEAS_TURNS tur, tryb przyspieszony). Stan = pliki `cell-s<seed>-r<rel>.json`
 * w MATRIX_DIR: komorka z `stoppedBy==='koniec przebiegu'` jest GOTOWA i pomijana; niedokonczona (stoppedBy='limit czasu') jest WZNAWIANA: runner zapisuje quickSave do slotu w trwalym profilu Chromium
 * (MEAS_PROFILE) i stan czastkowy w pliku komorki, a kolejne wywolanie robi loadSlot i kontynuuje od zapisanej tury. Jedno wywolanie mieści sie w limicie bash:
 * nowe komorki startuja tylko gdy do MATRIX_BUDGET_SEC (domyslnie 570) zostaje >= MATRIX_CELL_SEC (domyslnie 400);
 * uruchamiaj wielokrotnie az `pending=0`. Po kazdym wywolaniu zapisuje `summary.json` i `summary.md` (tabela zbiorcza).
 *
 * Env: MATRIX_DIR (abs, wymagane), BUNDLE_DIR (abs; bundle zbudowany poza repo), MATRIX_SEEDS, MATRIX_RELS,
 *      MEAS_TURNS (150), MATRIX_PAR (2), MEAS_ARM (natural).
 */
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const DIR = process.env.MATRIX_DIR;
if (!DIR) { console.error('[matrix] brak MATRIX_DIR'); process.exit(1); }
fs.mkdirSync(DIR, { recursive: true });
const SEEDS = (process.env.MATRIX_SEEDS || '1111,2222,3333').split(',').map(Number);
const RELS = (process.env.MATRIX_RELS || '20,80,140').split(',').map(Number);
const TURNS = parseInt(process.env.MEAS_TURNS || '150', 10);
const PAR = parseInt(process.env.MATRIX_PAR || '2', 10);
const BUDGET = parseInt(process.env.MATRIX_BUDGET_SEC || '570', 10) * 1000;
const CELL_EST = parseInt(process.env.MATRIX_CELL_SEC || '400', 10) * 1000;
const t0 = Date.now();
const cellFile = (s, r) => path.join(DIR, `cell-s${s}-r${r}.json`);
const profDir = (s, r) => path.join(DIR, `profile-s${s}-r${r}`);
const isDone = (s, r) => {
  try { const d = JSON.parse(fs.readFileSync(cellFile(s, r), 'utf8')); return (d.stoppedBy === 'koniec przebiegu' && d.turnsRun >= TURNS) || d.stoppedBy === 'gracz bez miast'; } catch (_) { return false; }
};
const cells = [];
for (const s of SEEDS) for (const r of RELS) cells.push([s, r]);

function runCell(s, r) {
  return new Promise(res => {
    const env = { ...process.env, MEAS_SEED: String(s), MEAS_REL: String(r), MEAS_TURNS: String(TURNS), MEAS_RESULT: cellFile(s, r), MEAS_PROFILE: profDir(s, r), SKIP_BUILD: '1', MEAS_MAX_SEC: process.env.MATRIX_CELL_MAX_SEC || '420' };
    const p = spawn('node', [path.join(__dirname, 'measure-ai-trade-offer-frequency.cjs')], { env, stdio: ['ignore', 'pipe', 'pipe'], cwd: path.resolve(__dirname, '..') });
    let out = '';
    p.stdout.on('data', d => { out += d; });
    p.stderr.on('data', d => { out += d; });
    p.on('close', code => {
      if (isDone(s, r)) fs.rmSync(profDir(s, r), { recursive: true, force: true }); console.log(`[matrix] cell seed=${s} rel=${r} exit=${code} ${(out.match(/RESULT .*/) || [''])[0].slice(0, 160)}`); res(); });
  });
}

// Klasyfikacja z offerLog (niezalezna od wersji runnera): handel = cykliczne + jednorazowe o actionId handlowym; reszta = oferty dyplomatyczne.
const TRADE_ACTIONS = new Set(['handel', 'umowa_handlowa', 'umowa_szlakow']);
function classify(d) {
  const log = d.offerLog || [];
  const cyclic = log.filter(x => x.type !== 'jednorazowa').length;
  const oneShotTrade = log.filter(x => x.type === 'jednorazowa' && TRADE_ACTIONS.has(x.actionId)).length;
  const other = {};
  for (const x of log) if (x.type === 'jednorazowa' && !TRADE_ACTIONS.has(x.actionId)) other[x.actionId] = (other[x.actionId] || 0) + 1;
  const otherN = Object.values(other).reduce((a, b) => a + b, 0);
  const t = d.turnsRun || 0;
  const p = n => (t ? +(n * 100 / t).toFixed(2) : 0);
  return { offers: cyclic + oneShotTrade, cyclic, oneShot: oneShotTrade, other, otherN, per100: p(cyclic + oneShotTrade), per100Cyclic: p(cyclic), per100OneShot: p(oneShotTrade), per100Other: p(otherN) };
}
function summarize() {
  const rows = [];
  for (const [s, r] of cells) {
    let d = null;
    try { d = JSON.parse(fs.readFileSync(cellFile(s, r), 'utf8')); } catch (_) { /* brak */ }
    if (!d) { rows.push({ seed: s, rel: r, status: 'BRAK' }); continue; }
    rows.push({
      seed: s, rel: r, status: (d.stoppedBy === 'koniec przebiegu' || d.stoppedBy === 'gracz bez miast') ? (d.stoppedBy === 'koniec przebiegu' ? 'OK' : 'OK (gracz bez miast od tury ' + d.playerCitiesLostAtTurn + ')') : 'NIEDOKONCZONE:' + d.stoppedBy,
      turnsRun: d.turnsRun, ...classify(d),
      activePrzyjmij: d.activePrzyjmij, pairs: d.pairs, relDrift: d.relDrift, autoBattles: d.autoBattles, scriptRejected: d.scriptRejected,
    });
  }
  const pending = rows.filter(x => !x.status.startsWith('OK')).length;
  fs.writeFileSync(path.join(DIR, 'summary.json'), JSON.stringify({ turns: TURNS, seeds: SEEDS, rels: RELS, pending, rows }, null, 2));
  const md = ['| ziarno | relacja | tury | oferty handlowe | cykliczne | jednorazowe handlowe | /100 tur (cykl.) | /100 tur (jednor. handlowe) | oferty dyplomatyczne (nie handel) | /100 tur (dypl.) | Przyjmij aktywne | pary surowców | status |', '|---|---|---|---|---|---|---|---|---|---|---|---|---|'];
  for (const x of rows) md.push(`| ${x.seed} | ${x.rel} | ${x.turnsRun ?? '-'} | ${x.offers ?? '-'} | ${x.cyclic ?? '-'} | ${x.oneShot ?? '-'} | ${x.per100Cyclic ?? '-'} | ${x.per100OneShot ?? '-'} | ${x.other ? JSON.stringify(x.other) : '-'} | ${x.per100Other ?? '-'} | ${x.activePrzyjmij ?? '-'} | ${x.pairs ? JSON.stringify(x.pairs) : '-'} | ${x.status} |`);
  fs.writeFileSync(path.join(DIR, 'summary.md'), md.join('\n') + '\n');
  console.log(`[matrix] pending=${pending}/${cells.length}`);
  return pending;
}

async function main() {
  const queue = cells.filter(([s, r]) => !isDone(s, r));
  console.log(`[matrix] do zrobienia ${queue.length}/${cells.length}`);
  let active = 0;
  await new Promise(resolve => {
    const pump = () => {
      while (active < PAR && queue.length && (Date.now() - t0 + CELL_EST) <= BUDGET) {
        const [s, r] = queue.shift(); active++;
        runCell(s, r).then(() => { active--; pump(); });
      }
      if (active === 0) resolve();
    };
    pump();
  });
  const pending = summarize();
  process.exit(pending === 0 ? 0 : 2);
}
main();
