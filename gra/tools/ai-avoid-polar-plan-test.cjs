'use strict';
/**
 * node tools/ai-avoid-polar-plan-test.cjs [--measure]
 * R-WEB-AI-AVOID-POLAR-CITIES-Q1: stolice/MP z planu startowego (buildClusterStartPlan) NIE leżą
 * na heksie Polarny ani w jego sąsiedztwie (R1/R2). Bez --measure: twarda asercja (exit 1 przy polarnych).
 * Z --measure: tylko raport liczbowy (exit 0).
 */
const path = require('path');
const fs = require('fs');
const esbuild = require('esbuild');
const GRA = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.ai-polar-plan-entry.ts');
const bundle = path.join(__dirname, '.ai-polar-plan-bundle.cjs');
fs.writeFileSync(entry, `
export { buildClusterStartPlan } from '../src/game/cluster-start';
export { generateMap } from '../src/map/generator';
export { setRiverGenPhaseOverride, setRiverGenEnabledOverride } from '../src/map/riverGenSwitch';
export { hexDistanceAxial } from '../src/map/gen-helpers';
`, 'utf8');
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  loader: { '.ts': 'ts', '.json': 'json' }, outfile: bundle, absWorkingDir: GRA, logLevel: 'silent' });
const M = require(bundle);
M.setRiverGenPhaseOverride('main');
if (process.env.RIVERS !== '1') M.setRiverGenEnabledOverride(false);
const civs = require('../data/civs.json');
const MEASURE = process.argv.includes('--measure');
const SEEDS = (process.env.SEEDS || (MEASURE ? '4242,7777,1001,2024,31337' : '4242,7777')).split(',').map(Number);
const TYPES = (process.env.TYPES || (MEASURE ? 'kontynenty,pangea,wyspy' : 'pangea,wyspy')).split(',');

function polarDist(map, q, r, maxR) {
  let best = Infinity;
  for (let dq = -maxR; dq <= maxR; dq++) for (let dr = -maxR; dr <= maxR; dr++) {
    const d = M.hexDistanceAxial(q, r, q + dq, r + dr);
    if (d > maxR) continue;
    const h = map.hexes[`${q + dq},${r + dr}`];
    if (h && h.terenBazowy === 'polarny' && d < best) best = d;
  }
  return best;
}
function collect(plan) {
  const out = [{ k: 'player', ...plan.playerStartHex }];
  for (const a of plan.aiStartHexes) out.push({ k: 'aiStart', q: a.q, r: a.r });
  for (const s of plan.spawnCities) out.push({ k: 'spawn', q: s.q, r: s.r });
  for (const g of plan.foreignTypeClusters) g.positions.forEach((p, i) => out.push({ k: i === 0 ? 'capital' : 'mp', q: p.q, r: p.r }));
  for (const p of plan.pendingSameTypeRivalHexes) out.push({ k: 'mp-pending', q: p.q, r: p.r });
  const seen = new Set();
  return out.filter(c => { const key = `${c.q},${c.r}`; if (seen.has(key)) return false; seen.add(key); return true; });
}
let tot = 0, on = 0, r1 = 0, r2 = 0, aiOn = 0, aiTot = 0;
for (const typ of TYPES) for (const seed of SEEDS) {
  const map = M.generateMap(168, 120, seed, typ);
  const plan = M.buildClusterStartPlan({ map, civs, seed, playerCivId: 'grecy', rywaleNaKlaster: 6, aktywneTypy: 8, startEpochId: 'kamien' });
  const sites = collect(plan);
  let o = 0, a1 = 0, a2 = 0; const det = [];
  for (const s of sites) {
    const d = polarDist(map, s.q, s.r, 2);
    const isAi = s.k !== 'player';
    tot++; if (isAi) aiTot++;
    if (d === 0) { on++; o++; if (isAi) aiOn++; }
    if (d <= 1) { r1++; a1++; }
    if (d <= 2) { r2++; a2++; }
    if (d <= 2) det.push(`${s.k}@${s.q},${s.r}:d${d}:${map.hexes[`${s.q},${s.r}`].terenBazowy}`);
  }
  console.log(`[${typ} ${seed}] sites=${sites.length} onPolar=${o} r<=1=${a1} r<=2=${a2} ${det.join(' ')}`);
}
console.log(`SUMA sites=${tot} (AI/MP=${aiTot}) onPolar=${on} (AI/MP=${aiOn}) r<=1=${r1} r<=2=${r2}`);
if (!MEASURE && on > 0) { console.error('FAIL: miasta na heksie polarnym'); process.exit(1); }
