// Summarize one run JSON: node summ.cjs <run.json>
const fs = require('fs');
const r = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const P = 0; // player owner id (assumed 0; see ZALOZENIE in report)
const pt = r.perTurn;
const pairsOf = (t) => t.wars.map(([a, b]) => [a, b]);
const involvesP = (p) => p[0] === P || p[1] === P;
let firstP = null;
for (const t of pt) { const w = pairsOf(t).filter(involvesP); if (w.length) { firstP = { turn: t.turn, partners: w.map(p => (p[0] === P ? p[1] : p[0])) }; break; } }
const before40 = pt.filter(t => t.turn < 40).map(t => t.wars.length);
const maxBefore40 = before40.length ? Math.max(...before40) : 0;
// AI-AI wars in the turn of first player war (wave) and in T<=45
let aiAiAtFirst = null;
if (firstP) { const t = pt.find(x => x.turn === firstP.turn); aiAiAtFirst = pairsOf(t).filter(p => !involvesP(p)).length; }
// per-civ war count, max over turns <= 45 (R2 proxy: no era info in snapshot)
let maxPerCivEarly = 0;
for (const t of pt.filter(x => x.turn <= 45)) { const c = {}; for (const [a, b] of pairsOf(t)) { c[a] = (c[a] || 0) + 1; c[b] = (c[b] || 0) + 1; } maxPerCivEarly = Math.max(maxPerCivEarly, ...Object.values(c), 0); }
const last = pt[pt.length - 1];
const ms = pt.map(t => t.ms).filter(Boolean).sort((a, b) => a - b);
console.log(JSON.stringify({
  file: process.argv[2].split('/').pop(), flagOn: r.flagOn, seed: r.seed, turnsRun: pt.length, errors: r.errors,
  firstPlayerWar: firstP, aiAiWarsAtFirstPlayerWarTurn: aiAiAtFirst,
  maxWarsBeforeT40: maxBefore40, maxPerCivWarsUpTo45: maxPerCivEarly,
  warsAtLastTurn: last && last.wars.length, lastTurn: last && last.turn,
  warsTimeline: pt.filter(t => t.turn >= 38 && t.turn <= 44).map(t => [t.turn, t.wars.length]),
  turnMsMedian: ms.length ? ms[Math.floor(ms.length / 2)] : null, pageErrors: r.pageErrors,
}));
