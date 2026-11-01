'use strict';
/**
 * live-verify-robocza-2-report.cjs — R-WEB-LIVE-VERIFY-ROBOCZA-2-Q1: agregacja evidence (gen2-*.json, smoke2-*.json) do tabel T1/T3/T4/T5.
 * Usage: node gra/tools/live-verify-robocza-2-report.cjs  (zapisuje evidence/podsumowanie-T1-T5.json)
 */
const fs = require('fs');
const path = require('path');
const E = path.resolve(__dirname, '..', '..', 'dyspozycje', 'autobot', 'runs', 'R-WEB-LIVE-VERIFY-ROBOCZA-2-Q1', 'evidence');
const rd = (f) => JSON.parse(fs.readFileSync(path.join(E, f), 'utf8'));
const median = (a) => { const s = a.slice().sort((x, y) => x - y); if (!s.length) return null; const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const rows = [];
for (const f of fs.readdirSync(E).filter((x) => /^(gen2|smoke2)-.*\.json$/.test(x)).sort()) {
  const o = rd(f);
  if (!o.start) { rows.push({ file: f, error: o.error || 'brak start' }); continue; }
  rows.push({ file: f, typ: o.typ || 'kontynenty', seed: o.seedSeen ?? o.seedWanted ?? o.seed, uiLand: o.uiLand, capMin: o.start.capMin, capPair: o.start.capPair, caps: o.start.capsCount,
    landPct: o.start.landPct, landHexes: o.start.landHexes, waterHexes: o.start.waterHexes, hexes: o.start.hexes, polarHexes: o.start.polarHexes,
    polarCapsStart: o.start.polarCaps.length, polarAiStart: o.start.polarAiCities.length, playerPolar: o.start.playerPolar, aiCitiesStart: o.start.aiCitiesTotal,
    turnsDone: (o.turnLog || []).filter((t) => t.ok).length, stalledAt: o.stalledAt ?? null, endTurn: o.end ? o.end.turn : null, aiCitiesEnd: o.end ? o.end.aiCitiesTotal : null,
    polarAiEnd: o.end ? o.end.polarAiCities : null, polarCapsEnd: o.end ? o.end.polarCaps : null, polarFallbackLogs: o.polarFallbackLogs ?? null,
    at30: o.at30 ? { turn: o.at30.turn, aiCities: o.at30.aiCitiesTotal, polarAi: o.at30.polarAiCities, polarHexes: o.at30.polarHexes } : null,
    pageErrors: (o.pageErrors || []).length });
}
const t1 = rows.filter((r) => r.capMin != null && r.file.startsWith('gen2') || r.file.startsWith('smoke2'));
const caps = t1.map((r) => r.capMin).filter((x) => x != null).sort((a, b) => a - b);
const summary = {
  T1: { n: caps.length, sorted: caps, median: median(caps), min: caps[0], max: caps[caps.length - 1], lt25: caps.filter((x) => x < 25).length, lt25Pct: +(100 * caps.filter((x) => x < 25).length / caps.length).toFixed(0),
    perMap: t1.map((r) => `${r.typ}${r.seed}=${r.capMin}`) },
  T3: t1.map((r) => ({ typ: r.typ, seed: r.seed, ui: r.uiLand, landPct: r.landPct, land: r.landHexes, water: r.waterHexes, hexes: r.hexes })),
  T4: rows.filter((r) => r.endTurn || r.at30).map((r) => ({ typ: r.typ, seed: r.seed, polarHexes: r.polarHexes, startPolarCaps: r.polarCapsStart, startPolarAi: r.polarAiStart, endTurn: r.endTurn, aiEnd: r.aiCitiesEnd, polarAiEnd: r.polarAiEnd, polarCapsEnd: r.polarCapsEnd, at30: r.at30, fallbackLogs: r.polarFallbackLogs })),
  rows,
};
fs.writeFileSync(path.join(E, 'podsumowanie-T1-T5.json'), JSON.stringify(summary, null, 2));
console.log('T1', JSON.stringify(summary.T1));
for (const x of summary.T3) console.log('T3', JSON.stringify(x));
for (const x of summary.T4) console.log('T4', JSON.stringify(x));
