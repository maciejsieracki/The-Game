'use strict';
/** Czytnik wyników river-count-run.cjs: node river-count-show.cjs <plik.jsonl>... — tabela per mapa + sumy per etykieta. */
const fs = require('fs');
const rows = [];
for (const f of process.argv.slice(2)) {
  for (const l of fs.readFileSync(f, 'utf8').split('\n').filter(Boolean)) rows.push(JSON.parse(l));
}
rows.sort((a, b) => (a.label + (a.r ? a.r.w : 0)).localeCompare(b.label + (b.r ? b.r.w : 0)) || (a.r ? a.r.seed : 0) - (b.r ? b.r.seed : 0));
const sums = {};
for (const o of rows) {
  const r = o.r;
  if (!r) { console.log(o.label, 'FAIL'); continue; }
  const k = r.kinds, h = r.hex;
  console.log([o.label, `${r.w}x${r.h}`, r.kind, r.seed, 'main', k.main || 0, h.main || 0, 'med', k.medium || 0, h.medium || 0,
    'trib', k.tributary || 0, h.tributary || 0, 'short', k.short || 0, h.short || 0, 'vis', r.visibleDefault, 'ms', r.ms, 'nonadj', r.nonAdjacentPaths].join(' '));
  const s = (sums[o.label + ' ' + r.w + 'x' + r.h] ||= { n: 0, main: 0, med: 0, trib: 0, short: 0, vis: 0, ms: 0 });
  s.n++; s.main += k.main || 0; s.med += k.medium || 0; s.trib += k.tributary || 0; s.short += k.short || 0; s.vis += r.visibleDefault; s.ms += r.ms;
}
console.log('--- sumy (n map) ---');
for (const [k, s] of Object.entries(sums)) console.log(k, JSON.stringify(s), 'avg ms', Math.round(s.ms / s.n));
