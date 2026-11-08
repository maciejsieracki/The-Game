import { readFileSync } from 'node:fs';
const a = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const b = JSON.parse(readFileSync(process.argv[3], 'utf8'));
console.log('pin old', a.pin, 'new', b.pin);
console.log('scen old', a.scenarios.length, 'new', b.scenarios.length);
console.log('scenario keys', Object.keys(a.scenarios[0]).join(','));
const counts = {};
let diffScen = 0;
function walk(x, y, p) {
  if (typeof x !== typeof y) { const k = p.replace(/\[\d+\]/g, '[]'); counts[k] = (counts[k] || 0) + 1; return; }
  if (x && typeof x === 'object') {
    for (const k of new Set([...Object.keys(x), ...Object.keys(y || {})])) walk(x[k], y?.[k], p + '.' + k);
  } else if (x !== y) { const k = p.replace(/\[\d+\]/g, '[]'); counts[k] = (counts[k] || 0) + 1; }
}
a.scenarios.forEach((s, i) => {
  const before = Object.values(counts).reduce((t, v) => t + v, 0);
  walk(s, b.scenarios[i], '');
  if (Object.values(counts).reduce((t, v) => t + v, 0) !== before) diffScen++;
});
console.log('scenarios with any diff', diffScen, 'of', a.scenarios.length);
for (const [k, v] of Object.entries(counts).sort((x, y) => y[1] - x[1]).slice(0, 30)) console.log(v, k);
