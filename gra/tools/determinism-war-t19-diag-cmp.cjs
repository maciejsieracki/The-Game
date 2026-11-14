const fs = require('fs');
const a = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const b = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
const max = +process.argv[4] || 30;
const out = [];
function walk(x, y, p) {
  if (out.length >= max) return;
  if (x === y) return;
  if (typeof x !== 'object' || typeof y !== 'object' || x === null || y === null) {
    out.push(p + ' : ' + JSON.stringify(x) + ' vs ' + JSON.stringify(y));
    return;
  }
  if (Array.isArray(x) !== Array.isArray(y)) { out.push(p + ' type'); return; }
  if (Array.isArray(x) && x.length !== y.length) out.push(p + ' len ' + x.length + ' vs ' + y.length);
  const keys = new Set([...Object.keys(x), ...Object.keys(y)]);
  for (const k of keys) {
    walk(x[k], y[k], p + '.' + k);
    if (out.length >= max) return;
  }
}
walk(a, b, '');
console.log(out.join('\n') || 'IDENTICAL');
