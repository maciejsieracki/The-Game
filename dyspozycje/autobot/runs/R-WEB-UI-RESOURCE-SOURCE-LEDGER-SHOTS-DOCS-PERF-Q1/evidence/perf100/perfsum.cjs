const fs = require('fs');
const dirs = process.argv.slice(2);
const med = (a) => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const rows = [];
for (const d of dirs) {
  const f = d + '/seed4242.jsonl';
  if (!fs.existsSync(f)) continue;
  const L = fs.readFileSync(f, 'utf8').trim().split('\n').map((x) => JSON.parse(x));
  const T = L.filter((x) => x.ev === 'turn');
  const ms = T.map((x) => x.ms);
  const t2 = T.find((x) => x.turn === 2);
  rows.push({
    run: d.split('/').slice(-1)[0], turns: T.length, done: L.some((x) => x.ev === 'done'),
    t2ms: t2 ? t2.ms : null, meanMs: Math.round(ms.reduce((s, x) => s + x, 0) / ms.length),
    medianMs: med(ms), totalS: Math.round(ms.reduce((s, x) => s + x, 0) / 1000),
  });
}
console.log(JSON.stringify(rows));
