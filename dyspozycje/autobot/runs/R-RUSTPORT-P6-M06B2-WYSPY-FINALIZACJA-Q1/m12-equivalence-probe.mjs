// Probe 3 (scratchpad): ile razy 2. przebieg finalizeCoastAndInlandWater FAKTYCZNIE by sie odpalil
// (po 1. przebiegu nie ma punktu stalego) i czy wtedy cokolwiek zmienia.
const root = process.argv[2];
const N = Number(process.argv[3] ?? 300);
const { pathToFileURL } = await import('node:url');
const G = await import(pathToFileURL(`${root}/gra/src/map/gen-helpers.ts`).href);
const H = await import(pathToFileURL(`${root}/gra/src/types/hex.ts`).href);
const { TerenBazowy: TB, Nakladka: NK } = H;
const keyOf = (q, r) => `${q},${r}`;
const DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
const rnd0 = G.mulberry32(9191);
const rnd = () => rnd0();
function mk(W, Hh, frac, o, noise) {
  const keys = []; for (let q = 0; q < W; q++) for (let r = 0; r < Hh; r++) keys.push(keyOf(q, r));
  const land = new Set(); const target = Math.round(keys.length * frac);
  const front = []; const seeds = 1 + Math.floor(rnd() * Math.max(1, keys.length / 30));
  for (let i = 0; i < seeds; i++) { const k = keys[Math.floor(rnd() * keys.length)]; land.add(k); front.push(k); }
  let g = 0;
  while (land.size < target && front.length && g++ < keys.length * 300) {
    const idx = Math.floor(rnd() * front.length); const [q, r] = front[idx].split(',').map(Number);
    const [dq, dr] = DIRS[Math.floor(rnd() * 6)]; const nq = q + dq, nr = r + dr;
    if (nq >= 0 && nq < W && nr >= 0 && nr < Hh) { const nk = keyOf(nq, nr); if (!land.has(nk)) { land.add(nk); front.push(nk); } }
    if (rnd() < 0.05) front.splice(idx, 1);
    if (front.length === 0 && land.size < target) { const k = keys[Math.floor(rnd() * keys.length)]; land.add(k); front.push(k); }
  }
  for (const k of keys) { if (rnd() < noise) { if (land.has(k)) land.delete(k); else land.add(k); } }
  const rows = [];
  for (let q = 0; q < W; q++) for (let r = 0; r < Hh; r++) {
    const k = keyOf(q, r); let terr;
    if (land.has(k)) { const x = rnd(); terr = x < o.mtn ? TB.Gory : x < o.mtn * 1.6 ? TB.Wzgorza : [TB.Laka, TB.Rownina, TB.Pustynia][Math.floor(rnd() * 3)]; }
    else terr = rnd() < o.plytkie ? TB.PlytkieMorze : TB.Morze;
    const water = terr === TB.Morze || terr === TB.PlytkieMorze;
    const nak = rnd() < (water ? o.lasWoda : o.lasLad) ? NK.Las : NK.Brak;
    const zloze = rnd() < (water ? o.zlozeWoda : o.zlozeLad) ? 1 : 0;
    let ro = 0, ed = [];
    if (rnd() < o.rzekaP) { ro = 1; const n = 1 + Math.floor(rnd() * 3); const s = new Set(); while (s.size < n) s.add(Math.floor(rnd() * 6)); ed = [...s].sort((a, b) => a - b); }
    rows.push([k, terr, nak, zloze, ro, ed]);
  }
  return rows;
}
function build(rows) { const o = {}; for (const [k, t, n, z, ro, ed] of rows) { const [q, r] = k.split(',').map(Number); o[k] = { coords: { q, r }, terenBazowy: t, nakladka: n, rzeka: { obecna: ro === 1, krawedzie: [...ed] }, ...(z ? { zloze: 'zloze_rudy' } : {}) }; } return o; }
const dump = (h) => JSON.stringify(Object.entries(h).map(([k, x]) => [k, x.terenBazowy, x.nakladka, x.zloze ? 1 : 0, x.rzeka.obecna ? 1 : 0, [...x.rzeka.krawedzie]]));
let total = 0, pass2Runs = 0, diffs = 0; const hits = [];
for (let i = 0; i < N; i++) {
  const sizes = [[18, 18], [24, 24], [30, 30], [40, 40], [60, 60]];
  const [W, Hh] = sizes[i % sizes.length];
  const frac = 0.15 + rnd() * 0.8;
  const o = { mtn: rnd() * 0.5, plytkie: rnd() * 0.7, lasWoda: rnd() * 0.3, lasLad: rnd() * 0.3, zlozeWoda: 0.05, zlozeLad: 0.1, rzekaP: rnd() * 0.4 };
  const noise = [0, 0.01, 0.03, 0.08][i % 4];
  const rows = mk(W, Hh, frac, o, noise);
  const sc = new Map(rows.map((r) => [r[0], Math.round(rnd() * 1000) / 1000]));
  const tgt = [0.3, 0.5, 0.7, 0.85, 0.9][i % 5];
  total++;
  const a = build(rows);
  G.applyLandFractionByScore(a, sc, Math.min(0.85, tgt), W, Hh, i % 2 ? 'mask' : 'center', 0.11);
  G.enforceMapBorderOcean(a, W, Hh);
  // Replika 1. przebiegu (ta sama kolejnosc wywolan co w finalizeCoastAndInlandWater, maxPasses=1 krok 0)
  const p1 = build(rows);
  G.applyLandFractionByScore(p1, sc, Math.min(0.85, tgt), W, Hh, i % 2 ? 'mask' : 'center', 0.11);
  G.enforceMapBorderOcean(p1, W, Hh);
  let changed = 0;
  changed += G.removeInlandWaterPools(p1, W, Hh);
  changed += G.applyDoubleCoastRing(p1);
  changed += G.sanitizeCoastHexes(p1);
  changed += G.removeInlandWaterPools(p1, W, Hh);
  const clean = G.findInlandWaterHexes(p1, W, Hh).length === 0 && G.findDryLandTouchingSea(p1).length === 0;
  const runsPass2 = !clean && changed !== 0;
  if (runsPass2) pass2Runs++;
  // Pelny finalize(1) i (2) na tym samym wejsciu co enforce.
  const b = structuredClone(a);
  G.finalizeCoastAndInlandWater(a, W, Hh, 1, undefined); G.enforceMapBorderOcean(a, W, Hh);
  G.finalizeCoastAndInlandWater(b, W, Hh, 2, undefined); G.enforceMapBorderOcean(b, W, Hh);
  if (dump(a) !== dump(b)) { diffs++; if (hits.length < 8) hits.push(`i${i} ${W}x${Hh}`); }
}
console.log(JSON.stringify({ total, przebieg2_realnie_odpalony: pass2Runs, roznice_wyjscia: diffs, przyklady: hits }));
