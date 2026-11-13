'use strict';
/**
 * R-WEB-PERF-ENDTURN-RENDER-HUD-Q1 (r2): agregacja A/B z profili CDP (PERF_SAVE_PROF=<dir>/p<para>-<etykieta>.<n>.json).
 * Uzycie: node tools/perf-endturn-render-ab-aggregate.cjs <katalog> <baza> <kandydat> [<kandydat2>...]
 * Dla kazdej etykiety i numeru konca tury (1..3) mediana/min/max (ms inkluzywnie) syncUnitsRender, renderLoop, syncStatChips, UNIA, SUMA;
 * plus lacznie (suma koncow tur 1..3 danego przebiegu) i lacznie 1..2; redukcja mediany wzgledem bazy. Pary naprzemienne: nr pary w nazwie pliku.
 */
const fs = require('node:fs');
const path = require('node:path');
const { analyze } = require('./perf-endturn-render-profile-analyze.cjs');
const [dir, baseLabel, ...candLabels] = process.argv.slice(2);
const med = a => { const s = [...a].sort((x, y) => x - y); return s[Math.floor((s.length - 1) / 2)]; };
const st = a => `${med(a)} (${Math.min(...a)}/${Math.max(...a)})`;
const files = fs.readdirSync(dir).filter(f => /^p\d+-[^.]+\.\d+\.json$/.test(f));
function collect(label) {
  const runs = {};
  for (const f of files) {
    const m = f.match(/^p(\d+)-([^.]+)\.(\d+)\.json$/);
    if (m[2] !== label) continue;
    (runs[m[1]] ??= {})[m[3]] = analyze(path.join(dir, f));
  }
  return runs;
}
const METRICS = ['syncUnitsRender', 'renderLoop', 'syncStatChips', 'union', 'sum'];
function series(runs, eots, metric) {
  const out = [];
  for (const pair of Object.keys(runs)) {
    const r = runs[pair];
    if (!eots.every(e => r[e])) continue;
    out.push(eots.reduce((s, e) => s + r[e][metric], 0));
  }
  return out;
}
const groups = [['EOT1', ['1']], ['EOT2', ['2']], ['EOT3', ['3']], ['EOT1+2', ['1', '2']], ['EOT1+2+3', ['1', '2', '3']]];
const base = collect(baseLabel);
for (const label of candLabels) {
  const cand = collect(label);
  console.log(`=== ${baseLabel} vs ${label} (pary: ${baseLabel}=${Object.keys(base).length}, ${label}=${Object.keys(cand).length})`);
  for (const [name, eots] of groups) {
    for (const metric of METRICS) {
      const b = series(base, eots, metric); const c = series(cand, eots, metric);
      if (!b.length || !c.length) continue;
      const red = ((1 - med(c) / med(b)) * 100).toFixed(1);
      console.log(`${name.padEnd(9)} ${metric.padEnd(16)} ${baseLabel} n=${b.length} ${st(b).padEnd(22)} ${label} n=${c.length} ${st(c).padEnd(22)} redukcja(med) ${red}%`);
    }
  }
}
