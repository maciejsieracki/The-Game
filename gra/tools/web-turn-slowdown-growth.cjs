'use strict';
/**
 * web-turn-slowdown-growth.cjs — R-WEB-TURN-SLOWDOWN-Q2 runda 2 (zarzut 3 Evaluatora):
 * przyrost self-time per funkcja między dwoma profilami CPU (np. panel miasta T13 → T73),
 * bez „(program)”/„(idle)”/„(root)” — pokazuje, KTÓRE funkcje niosą pozostały wzrost.
 *
 * Użycie: node tools/web-turn-slowdown-growth.cjs <a.cpuprofile> <b.cpuprofile> [top=15]
 */
const fs = require('fs');

const load = (f) => {
  const p = JSON.parse(fs.readFileSync(f, 'utf8'));
  const byId = new Map(p.nodes.map((n) => [n.id, n.callFrame.functionName || '(anon)']));
  const m = new Map();
  let js = 0;
  for (let i = 0; i < p.samples.length; i++) {
    const fn = byId.get(p.samples[i]);
    const d = (p.timeDeltas[i] || 0) / 1000;
    if (fn === '(program)' || fn === '(idle)' || fn === '(root)') continue;
    js += d;
    m.set(fn, (m.get(fn) || 0) + d);
  }
  return { m, js };
};
const a = load(process.argv[2]);
const b = load(process.argv[3]);
const inc = b.js - a.js;
console.log(`JS a=${a.js.toFixed(1)} ms  b=${b.js.toFixed(1)} ms  przyrost=${inc.toFixed(1)} ms`);
const names = new Set([...a.m.keys(), ...b.m.keys()]);
const rows = [...names].map((n) => [n, a.m.get(n) || 0, b.m.get(n) || 0])
  .map((r) => [...r, r[2] - r[1]])
  .sort((x, y) => y[3] - x[3])
  .slice(0, Number(process.argv[4] || 15));
for (const [n, x, y, d] of rows) {
  console.log(`${d.toFixed(1).padStart(8)} ms (${(100 * d / inc).toFixed(1).padStart(5)}% przyrostu)  ${x.toFixed(1).padStart(7)} -> ${y.toFixed(1).padStart(7)}  ${n}`);
}
