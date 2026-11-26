'use strict';
// Offline: ASCII widok masy lądu z rzekami (dump z dump-map.cjs). Uzycie: node inspect-mass.cjs map.json <rozmiar masy>
const fs = require('fs');
const d = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const want = Number(process.argv[3]);
const isWater = (t) => t === 'morze' || t === 'plytkie_morze';
const DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
const seen = new Set();
const masses = [];
for (const k of Object.keys(d.hexes)) {
  if (seen.has(k) || isWater(d.hexes[k][0])) continue;
  const comp = []; const st = [k]; seen.add(k);
  while (st.length) {
    const c = st.pop(); comp.push(c);
    const [q, r] = c.split(',').map(Number);
    for (const [dq, dr] of DIRS) {
      const nk = `${q + dq},${r + dr}`;
      if (!d.hexes[nk] || seen.has(nk) || isWater(d.hexes[nk][0])) continue;
      seen.add(nk); st.push(nk);
    }
  }
  masses.push(comp);
}
const mass = masses.find((m) => m.length === want);
if (!mass) { console.log('brak masy', want, masses.map((m) => m.length).sort((a, b) => b - a).join(',')); process.exit(1); }
const ms = new Set(mass);
let minq = 1e9, maxq = -1e9, minr = 1e9, maxr = -1e9;
for (const k of mass) { const [q, r] = k.split(',').map(Number); minq = Math.min(minq, q); maxq = Math.max(maxq, q); minr = Math.min(minr, r); maxr = Math.max(maxr, r); }
const pathIdx = new Map();
d.paths.forEach((p, i) => p.forEach((c, j) => { const k = `${c.q},${c.r}`; if (!pathIdx.has(k)) pathIdx.set(k, []); pathIdx.get(k).push([i, j]); }));
console.log('mass', want, 'bbox q', minq, maxq, 'r', minr, maxr);
const involved = new Set();
for (let r = minr - 1; r <= maxr + 1; r++) {
  let line = ' '.repeat(Math.max(0, r - minr + 1));
  for (let q = minq - 2; q <= maxq + 2; q++) {
    const k = `${q},${r}`; const h = d.hexes[k];
    let ch = ' ';
    if (h) {
      if (isWater(h[0])) ch = '~';
      else {
        const pi = pathIdx.get(k);
        if (pi) { const kind = d.kinds[pi[0][0]]; ch = kind === 'main' ? 'M' : kind === 'medium' ? 'm' : 't'; pi.forEach(([i]) => involved.add(i)); }
        else ch = h[0] === 'gory' ? '^' : h[0] === 'wzgorza' ? 'n' : '.';
      }
    }
    line += ch + ' ';
  }
  console.log(line);
}
for (const i of involved) {
  const p = d.paths[i];
  console.log('path', i, d.kinds[i], 'len', p.length, 'start', JSON.stringify(p[0]), 'end', JSON.stringify(p[p.length - 1]));
}
