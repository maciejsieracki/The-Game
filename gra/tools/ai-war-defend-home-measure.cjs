'use strict';
/**
 * ai-war-defend-home-measure.cjs -- metryki PRZED/PO na pelnych przebiegach (R-WEB-AI-WAR-DEFEND-HOME-BEFORE-OFFENSE-Q1).
 * Uruchom z gra/:  node tools/ai-war-defend-home-measure.cjs [turns=120] [seeds=6]
 * Silnik zastepczy (NIE main.ts): 4-6 cywilizacji AI, kazda 3 miasta, wojna wszystkich ze wszystkimi sasiadami,
 * co 3 tury nowa jednostka w stolicy. PRZED = setHomeWarDefenseOverride(false), PO = true (ten sam kod).
 * Wyniki z tej symulacji sa przyblizeniem (uproszczony model walki, bez ekonomii/mgly) -- patrz raport.
 */
const S = require('./ai-war-defend-home-sim.cjs');

const TURNS = Number(process.argv[2] || 120);
const SEEDS = Number(process.argv[3] || 6);

function rng(seed) { let x = seed >>> 0 || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; }

function scenario(seed) {
  const rand = rng(seed * 7919 + 13);
  const n = 4 + (seed % 3); // 4..6 AI
  const W = 64; const H = 36;
  const cx = W / 2; const cy = H / 2; const rad = 20;
  const cities = []; const units = []; const aiOwners = [];
  for (let i = 0; i < n; i++) {
    const owner = i + 1; aiOwners.push(owner);
    const ang = (i / n) * Math.PI * 2 + rand() * 0.2;
    const hx = Math.round(cx + Math.cos(ang) * rad * 1.4);
    const hy = Math.round(cy + Math.sin(ang) * rad * 0.7);
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    const pos = [[0, 0], [3, 2], [-3, 3]];
    pos.forEach(([dq, dr], k) => {
      cities.push(S.mkCity(`c${owner}${String.fromCharCode(97 + k)}`, owner, clamp(hx + dq, 2, W - 3), clamp(hy + dr, 2, H - 3)));
    });
    for (let k = 0; k < 6; k++) {
      units.push(S.mkUnit(`u${owner}_${k}`, owner, clamp(hx + (k % 3) - 1, 1, W - 2), clamp(hy + Math.floor(k / 3) - 1, 1, H - 2)));
    }
  }
  const wars = new Set();
  for (let a = 1; a <= n; a++) for (let b = a + 1; b <= n; b++) wars.add(`${a}_${b}`);
  return { map: S.makeMap(W, H), units, cities, wars, aiOwners };
}

const E = S.loadEngine(null, 'measure');
const agg = { off: [], on: [] };
for (let seed = 1; seed <= SEEDS; seed++) {
  for (const hd of [false, true]) {
    const st = S.simulate(scenario(seed), { engine: E, homeDefense: hd, turns: TURNS, reinforceEvery: 3 });
    const tot = (o) => Object.values(o).reduce((a, b) => a + b, 0);
    const row = {
      seed, civs: 4 + (seed % 3), exchanges: st.exchanges, exchangesWide: st.exchangesWide, captures: st.captures, recaptures: st.recaptures,
      battles: st.battles, invaderUnitTurns: st.invaderUnitTurns, invaderTurns: st.invaderTurns,
      longestInvasion: st.longestInvasion, longInvasionEpisodes: st.longInvasionEpisodes,
      avgTurnMs: Number((st.perTurnMs.reduce((a, b) => a + b, 0) / st.perTurnMs.length).toFixed(2)),
    };
    (hd ? agg.on : agg.off).push(row);
    console.log((hd ? 'PO    ' : 'PRZED ') + JSON.stringify(row));
  }
}
const sum = (rows, k) => rows.reduce((a, r) => a + r[k], 0);
console.log('\nSUMA po ' + SEEDS + ' ziarnach x ' + TURNS + ' tur:');
for (const k of ['exchanges', 'exchangesWide', 'captures', 'recaptures', 'battles', 'invaderUnitTurns', 'longInvasionEpisodes']) {
  console.log(`  ${k.padEnd(22)} PRZED=${sum(agg.off, k)}  PO=${sum(agg.on, k)}`);
}
console.log(`  avgTurnMs              PRZED=${(sum(agg.off, 'avgTurnMs') / SEEDS).toFixed(2)}  PO=${(sum(agg.on, 'avgTurnMs') / SEEDS).toFixed(2)}`);
console.log(`  longestInvasion(max)   PRZED=${Math.max(...agg.off.map(r => r.longestInvasion))}  PO=${Math.max(...agg.on.map(r => r.longestInvasion))}`);
S.cleanup(E);
