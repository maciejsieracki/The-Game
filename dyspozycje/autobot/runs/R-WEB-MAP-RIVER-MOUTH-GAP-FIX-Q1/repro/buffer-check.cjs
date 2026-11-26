'use strict';
// Offline: lista main-ow lamiacych bufor morski (cialo = path bez ostatnich 5 hex; woda lub seaDist<2) oraz
// main-ow z dlugim ogonem wodnym. Uzycie: node buffer-check.cjs map.json
const d = JSON.parse(require('fs').readFileSync(process.argv[2], 'utf8'));
const w = (t) => t === 'morze' || t === 'plytkie_morze';
const D = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
const sd = new Map();
const qu = [];
for (const k in d.hexes) if (w(d.hexes[k][0])) { sd.set(k, 0); qu.push(k); }
for (let i = 0; i < qu.length; i++) {
  const k = qu[i];
  const [q, r] = k.split(',').map(Number);
  for (const [a, b] of D) {
    const n = (q + a) + ',' + (r + b);
    if (!d.hexes[n] || sd.has(n)) continue;
    sd.set(n, sd.get(k) + 1);
    qu.push(n);
  }
}
let badMain = 0;
const tails = {};
d.paths.forEach((p, i) => {
  if (d.kinds[i] !== 'main') return;
  let c = 0;
  for (let j = p.length - 1; j >= 0 && w(d.hexes[p[j].q + ',' + p[j].r][0]); j--) c++;
  tails[c] = (tails[c] || 0) + 1;
  const be = Math.max(0, p.length - 5);
  let bad = false;
  for (let j = 0; j < be; j++) {
    const k = p[j].q + ',' + p[j].r;
    if (w(d.hexes[k][0]) || sd.get(k) < 2) bad = true;
  }
  if (bad) { badMain++; console.log('BAD path', i, 'len', p.length, 'start', JSON.stringify(p[0]), 'waterTail', c); }
});
console.log(JSON.stringify({ badMain, trailingWaterHistogram: tails }));
