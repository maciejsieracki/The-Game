'use strict';
/** ai-city-live-summarize.cjs <evidenceDir> — tabela PRE/POST z plikow <label>-<typ>-<seed>.json (ai-city-live-measure.cjs). */
const fs = require('fs');
const path = require('path');
const dir = process.argv[2];
const files = fs.readdirSync(dir).filter((f) => /^(pre|post|w\d+)-.*\.json$/.test(f));
const rows = files.map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')));
const out = [];
for (const r of rows.sort((a, b) => (a.typ + a.label).localeCompare(b.typ + b.label))) {
  const ts = r.turnStats || {};
  out.push(`## ${r.label} ${r.typ} seed=${r.seed} ${r.size} done=${r.done} genMs=${r.genMs} turnMs median=${ts.median} p95=${ts.p95} max=${ts.max}`);
  for (const k of ['t1', 't25', 't50', 't75', 't100']) {
    const s = r.snaps[k];
    if (!s) continue;
    out.push(`${k}: AI major=${s.majorCities} (civ=${s.majorOwners} min/med/max=${s.perMajorMin}/${s.perMajorMedian}/${s.perMajorMax}) CS=${s.csCities} gracz=${s.meCities} `
      + `zalozone=${s.founded} high=${s.foundedHigh} low=${s.foundedLow} polar(na/obok)=${s.polarOnHex}/${s.polarOnOrAdjacent} perMajor=${JSON.stringify(s.perMajor)}`);
  }
}
const byTyp = {};
for (const r of rows) (byTyp[r.typ] = byTyp[r.typ] || {})[r.label] = r;
for (const [typ, g] of Object.entries(byTyp)) {
  if (!g.pre) continue;
  for (const [lbl, r] of Object.entries(g)) {
    if (lbl === 'pre') continue;
    for (const k of ['t25', 't50', 't75', 't100']) {
      const a = g.pre.snaps[k], b = r.snaps[k];
      if (a && b) out.push(`DELTA ${typ} ${lbl} vs pre ${k}: ${a.majorCities} -> ${b.majorCities} (${(100 * (b.majorCities - a.majorCities) / a.majorCities).toFixed(1)}%)`);
    }
  }
}
console.log(out.join('\n'));
