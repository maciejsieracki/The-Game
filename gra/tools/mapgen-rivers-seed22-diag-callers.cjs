#!/usr/bin/env node
// Agregacja próbek CPU wg łańcucha wywołań (6 ramek) — użycie: node mapgen-rivers-seed22-diag-callers.cjs <x.cpuprofile>
const p = JSON.parse(require('fs').readFileSync(process.argv[2]));
const byId = new Map(p.nodes.map((n) => [n.id, n])); const parent = new Map();
for (const n of p.nodes) for (const c of (n.children || [])) parent.set(c, n.id);
const self = new Map(); p.samples.forEach((s, i) => self.set(s, (self.get(s) || 0) + p.timeDeltas[i]));
const agg = new Map(); let tot = 0;
for (const [id, t] of self) {
  tot += t; const chain = []; let c = id;
  while (c) { const n = byId.get(c); chain.push(n.callFrame.functionName + ':' + (n.callFrame.lineNumber + 1)); c = parent.get(c); }
  const key = chain.slice(0, 6).join(' < '); agg.set(key, (agg.get(key) || 0) + t);
}
[...agg.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).forEach(([k, v]) => console.log((100 * v / tot).toFixed(1) + '% ' + k));
