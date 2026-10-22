'use strict';
/**
 * web-turn-slowdown-compare.cjs — R-WEB-TURN-SLOWDOWN-Q2: zestawienie przed/po z CSV
 * `web-turn-slowdown-measure.cjs`: średnie (i mediany) dla tur 10–20 i 70–80, iloraz
 * 70–80 / 10–20, oraz zgodność skrótów stanu per tura między przebiegami.
 *
 * Użycie: node tools/web-turn-slowdown-compare.cjs <etykieta=plik.csv> [...]
 */
const fs = require('fs');

const load = (spec) => {
  const i = spec.indexOf('=');
  const lines = fs.readFileSync(spec.slice(i + 1), 'utf8').trim().split('\n');
  const head = lines[0].split(',');
  return { label: spec.slice(0, i), rows: lines.slice(1).map((l) => Object.fromEntries(l.split(',').map((v, j) => [head[j], v]))) };
};
const runs = process.argv.slice(2).map(load);
const stat = (rows, key, a, b) => {
  const v = rows.filter((r) => +r.turn >= a && +r.turn <= b).map((r) => +r[key]).sort((x, y) => x - y);
  const mean = v.reduce((s, x) => s + x, 0) / v.length;
  const med = v[Math.floor(v.length / 2)];
  return { mean, med, n: v.length };
};
for (const run of runs) {
  console.log(`== ${run.label}`);
  for (const key of ['endTurnMs', 'cityOpenSyncMs', 'cityOpenFrameMs', 'jsHeapMB', 'domNodes', 'jsEventListeners', 'textures', 'saveBytes']) {
    const e = stat(run.rows, key, 10, 20), l = stat(run.rows, key, 70, 80);
    console.log(`  ${key.padEnd(17)} T10-20 śr=${e.mean.toFixed(1)} med=${e.med}  T70-80 śr=${l.mean.toFixed(1)} med=${l.med}  iloraz(śr)=${(l.mean / e.mean).toFixed(2)}`);
  }
}
if (runs.length >= 2) {
  const [a, b] = runs;
  const hb = new Map(b.rows.map((r) => [r.turn, r.saveHash]));
  let same = 0, diff = 0, first = null;
  for (const r of a.rows) {
    if (!hb.has(r.turn)) continue;
    if (hb.get(r.turn) === r.saveHash) same++; else { diff++; if (first === null) first = r.turn; }
  }
  console.log(`== skróty stanu ${a.label} vs ${b.label}: zgodne=${same} różne=${diff}` + (first !== null ? ` pierwsza różnica w turze ${first}` : ''));
}
