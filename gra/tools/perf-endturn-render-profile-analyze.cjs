'use strict';
/**
 * R-WEB-PERF-ENDTURN-RENDER-HUD-Q1 (r2): analiza profili CPU (CDP) zapisanych przez perf-endturn-render-hud-live-test.cjs (PERF_SAVE_PROF).
 * Uzycie: node tools/perf-endturn-render-profile-analyze.cjs <plik.json>... [--top=N] [--under=funkcja]
 * Wypisuje inkluzywny czas SUMA/UNIA trzech funkcji celu oraz top inkluzywnych funkcji (opcjonalnie tylko pod wskazana funkcja).
 */
const fs = require('node:fs');
const args = process.argv.slice(2);
const files = args.filter(a => !a.startsWith('--'));
const opt = k => (args.find(a => a.startsWith(`--${k}=`)) || '').split('=')[1];
const TOP = Number(opt('top')) || 25;
const UNDER = opt('under');
const TARGETS = ['syncUnitsRender', 'renderLoop', 'syncStatChips'];

function analyze(file) {
  const prof = JSON.parse(fs.readFileSync(file, 'utf8'));
  const nodes = new Map(prof.nodes.map(n => [n.id, n]));
  const parent = new Map();
  for (const n of prof.nodes) for (const c of n.children || []) parent.set(c, n.id);
  const dt = prof.timeDeltas;
  const incl = {}; const tgt = { syncUnitsRender: 0, renderLoop: 0, syncStatChips: 0, union: 0, sum: 0 };
  const key = cf => `${cf.functionName || '(anon)'}:${cf.lineNumber}`;
  for (let i = 0; i < prof.samples.length; i++) {
    const d = (dt[i] || 0) / 1000;
    const seen = new Set(); const seenT = new Set(); let underOk = !UNDER;
    for (let nid = prof.samples[i]; nid !== undefined; nid = parent.get(nid)) {
      const cf = nodes.get(nid).callFrame;
      if (UNDER && cf.functionName === UNDER) underOk = true;
      const k = key(cf);
      if (!seen.has(k)) { seen.add(k); (incl[k] ??= { all: 0, under: 0 }).all += d; if (underOk) incl[k].under += 0; }
      if (TARGETS.includes(cf.functionName) && !seenT.has(cf.functionName)) { seenT.add(cf.functionName); tgt[cf.functionName] += d; tgt.sum += d; }
    }
    if (seenT.size) tgt.union += d;
    if (UNDER && underOk) {
      const seen2 = new Set();
      for (let nid = prof.samples[i]; nid !== undefined; nid = parent.get(nid)) {
        const k = key(nodes.get(nid).callFrame);
        if (!seen2.has(k)) { seen2.add(k); incl[k].under += d; }
      }
    }
  }
  const col = UNDER ? 'under' : 'all';
  const top = Object.entries(incl).sort((a, b) => b[1][col] - a[1][col]).slice(0, TOP).map(([k, v]) => `${k} ${v[col].toFixed(0)}`);
  const r = Object.fromEntries(Object.entries(tgt).map(([k, v]) => [k, +v.toFixed(0)]));
  return { file, ...r, top };
}
if (require.main === module) for (const f of files) {
  const r = analyze(f);
  console.log(JSON.stringify({ file: r.file, syncUnitsRender: r.syncUnitsRender, renderLoop: r.renderLoop, syncStatChips: r.syncStatChips, union: r.union, sum: r.sum }));
  if (opt('top') !== undefined || UNDER) console.log('  ' + r.top.join('\n  '));
}
module.exports = { analyze };
