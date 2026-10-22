'use strict';
/**
 * web-turn-slowdown-profile-summary.cjs — R-WEB-TURN-SLOWDOWN-Q2 (B): streszczenie
 * profilu CPU (.cpuprofile z CDP Profiler) — top funkcji wg self-time i total-time.
 * Bundle budowany z `--minify false`, więc nazwy funkcji = nazwy z `gra/src/**`
 * (plik:linia w źródle ustalane `grep -n "function <nazwa>" gra/src`).
 *
 * Użycie: node tools/web-turn-slowdown-profile-summary.cjs <plik.cpuprofile> [top=25]
 */
const fs = require('fs');
const file = process.argv[2];
const TOP = Number(process.argv[3] || 25);
const prof = JSON.parse(fs.readFileSync(file, 'utf8'));
const byId = new Map(prof.nodes.map((n) => [n.id, n]));
const parent = new Map();
for (const n of prof.nodes) for (const c of n.children || []) parent.set(c, n.id);
const dt = new Map();
for (let i = 0; i < prof.samples.length; i++) {
  const id = prof.samples[i];
  dt.set(id, (dt.get(id) || 0) + (prof.timeDeltas[i] || 0));
}
const key = (n) => `${n.callFrame.functionName || '(anon)'} @L${n.callFrame.lineNumber + 1}`;
const self = new Map();
const total = new Map();
let all = 0;
for (const [id, us] of dt) {
  all += us;
  const n = byId.get(id);
  self.set(key(n), (self.get(key(n)) || 0) + us);
  const seen = new Set();
  let cur = id;
  while (cur !== undefined) {
    const k = key(byId.get(cur));
    if (!seen.has(k)) { seen.add(k); total.set(k, (total.get(k) || 0) + us); }
    cur = parent.get(cur);
  }
}
const fmt = (m) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, TOP)
  .map(([k, us]) => `${(us / 1000).toFixed(1).padStart(9)} ms ${(100 * us / all).toFixed(1).padStart(5)}%  ${k}`).join('\n');
console.log(`PROFIL ${file}: łącznie ${(all / 1000).toFixed(1)} ms próbek`);
console.log('--- TOP self-time ---');
console.log(fmt(self));
console.log('--- TOP total-time (inclusive) ---');
console.log(fmt(total));
