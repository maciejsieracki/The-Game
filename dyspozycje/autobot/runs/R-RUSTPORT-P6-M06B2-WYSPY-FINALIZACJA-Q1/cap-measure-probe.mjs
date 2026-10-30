// Probe 4 (scratchpad): ile suchego lądu (udzial) daje etap 1 enforce przy celu 0.99 (= realna pojemnosc) na mapach
// 18x18, 40x40, 60x60 (wejscie: blob, jak w generatorach). Diagnostyka do dossier §12.1.
const root = process.argv[2];
const { pathToFileURL } = await import('node:url');
const G = await import(pathToFileURL(`${root}/gra/src/map/gen-helpers.ts`).href);
const H = await import(pathToFileURL(`${root}/gra/src/types/hex.ts`).href);
const { TerenBazowy: TB, Nakladka: NK } = H;
const keyOf = (q, r) => `${q},${r}`;
const DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
const rnd0 = G.mulberry32(31337);
const rnd = () => rnd0();
function mk(W, Hh, frac) {
  const keys = []; for (let q = 0; q < W; q++) for (let r = 0; r < Hh; r++) keys.push(keyOf(q, r));
  const land = new Set(); const target = Math.round(keys.length * frac);
  const front = [keys[Math.floor(rnd() * keys.length)]]; land.add(front[0]);
  let g = 0;
  while (land.size < target && front.length && g++ < keys.length * 300) {
    const idx = Math.floor(rnd() * front.length); const [q, r] = front[idx].split(',').map(Number);
    const [dq, dr] = DIRS[Math.floor(rnd() * 6)]; const nq = q + dq, nr = r + dr;
    if (nq >= 0 && nq < W && nr >= 0 && nr < Hh) { const nk = keyOf(nq, nr); if (!land.has(nk)) { land.add(nk); front.push(nk); } }
    if (rnd() < 0.02) front.splice(idx, 1);
  }
  const o = {};
  for (let q = 0; q < W; q++) for (let r = 0; r < Hh; r++) {
    const k = keyOf(q, r);
    const t = land.has(k) ? [TB.Laka, TB.Rownina, TB.Gory][Math.floor(rnd() * 3)] : TB.Morze;
    o[k] = { coords: { q, r }, terenBazowy: t, nakladka: NK.Brak, rzeka: { obecna: false, krawedzie: [] } };
  }
  return o;
}
const out = [];
for (const [W, Hh] of [[18, 18], [40, 40], [60, 60]]) {
  const res = [];
  for (let i = 0; i < 3; i++) {
    const hx = mk(W, Hh, 0.95);
    const total = Object.keys(hx).length;
    const sc = new Map(Object.keys(hx).map((k) => [k, Math.round(rnd() * 1000) / 1000]));
    G.applyLandFractionByScore(hx, sc, 0.85, W, Hh, 'center', 0.11);
    G.enforceMapBorderOcean(hx, W, Hh);
    G.finalizeCoastAndInlandWater(hx, W, Hh, 1, undefined);
    G.enforceMapBorderOcean(hx, W, Hh);
    const before = G.countLandSeaHexes(hx).land;
    // Cel 0.99 (klamp gorny nie ma wplywu, bo 0.99 -> 0.85): osiagalny udzial po pelnym enforce z celem 0.99.
    const hy = mk(W, Hh, 0.95);
    const scy = new Map(Object.keys(hy).map((k) => [k, Math.round(rnd() * 1000) / 1000]));
    G.enforceTargetDryLandFraction(hy, scy, 0.99, W, Hh, undefined, 3, 'center');
    const landY = G.countLandSeaHexes(hy).land;
    res.push({ total, udzial_po_etapie1_cel085: +(before / total).toFixed(4), udzial_po_enforce_cel099: +(landY / total).toFixed(4) });
  }
  out.push({ mapa: `${W}x${Hh}`, probki: res });
}
console.log(JSON.stringify(out));
