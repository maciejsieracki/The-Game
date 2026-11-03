// REPIN-DELTA-4 (pin 23dd158e9): wektory z URUCHOMIONEGO weba dla czystych funkcji delty.
//  - freshwater.ts (hasFreshwaterAccess / isFreshwaterReservedHex / isLakeHex / isLakeAdjacent / hasRiverWaterAccess)
//  - fort-territory.ts fortSightSources
//  - clusters.ts capitalMinSeparation* (proporcjonalny sep stolic, sufit wykonalnosci)
//  - gen-helpers.ts topUpPangeaLandFraction (fazy 1-3)
// Uruchomienie (Node 22, katalog `tools`; WEB_ROOT = rozpakowany archiwum git 23dd158e9 gra/src + gra/data):
//   node --experimental-transform-types --no-warnings --import ./repin-b-loader-register.mjs \
//        ./gen-repin4-vectors.mjs <WEB_ROOT> <KATALOG_WYJSCIA>
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve as presolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const webRoot = presolve(process.argv[2]);
const outDir = presolve(process.argv[3]);
mkdirSync(outDir, { recursive: true });
const src = (p) => pathToFileURL(join(webRoot, 'gra/src', p)).href;
const PIN = '23dd158e9';

const FW = await import(src('map/freshwater.ts'));
const FT = await import(src('game/fort-territory.ts'));
const CL = await import(src('map/clusters.ts'));
const GH = await import(src('map/gen-helpers.ts'));
const HX = await import(src('types/hex.ts'));
const TB = HX.TerenBazowy;
const NK = HX.Nakladka;

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(0x4d474e44);
const chance = (p) => rnd() < p;
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];

// ---------------------------------------------------------------- freshwater
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]];
function mkFwMap(kind) {
  const W = ri(8, 16), H = ri(8, 14);
  const cells = [];
  for (let r = 0; r < H; r++) for (let q = 0; q < W; q++) cells.push([q, r]);
  const keep = cells.filter(() => !chance(kind === 'dziury' ? 0.12 : 0));
  const water = new Set();
  if (kind === 'ocean-krawedz') {
    for (const [q, r] of keep) if (q <= 1 || r <= 0 || q >= W - 2 || r >= H - 1) water.add(`${q},${r}`);
  }
  // stawy wewnatrz ladu
  const ponds = kind === 'obwod-lad' ? ri(2, 3) : ri(0, 3);
  for (let p = 0; p < ponds; p++) {
    const cq = ri(3, W - 4), cr = ri(3, H - 4);
    water.add(`${cq},${cr}`);
    for (const [dq, dr] of NB) if (chance(0.45)) water.add(`${cq + dq},${cr + dr}`);
  }
  if (kind === 'obwod-lad') {
    // zadna woda nie dotyka krawedzi: usun wode przy krawedzi
    for (const k of [...water]) { const [q, r] = k.split(',').map(Number); if (q <= 1 || r <= 1 || q >= W - 2 || r >= H - 2) water.delete(k); }
  }
  const hexes = keep.map(([q, r]) => {
    const k = `${q},${r}`;
    const w = water.has(k);
    return { q, r, teren: w ? pick([TB.Morze, TB.PlytkieMorze]) : pick([TB.Laka, TB.Rownina, TB.Wzgorza, TB.Gory, TB.Pustynia]), obecna: !w && chance(0.06) };
  });
  const land = hexes.filter(h => ![TB.Morze, TB.PlytkieMorze].includes(h.teren));
  const riverPaths = [];
  for (let i = 0; i < ri(0, 2); i++) {
    const path = [];
    let h = pick(land);
    for (let s = 0; s < ri(2, 5); s++) { path.push([h.q, h.r]); const [dq, dr] = pick(NB); h = { q: h.q + dq, r: h.r + dr }; }
    riverPaths.push(path);
  }
  return { hexes, riverPaths, W, H };
}
const toWeb = (m) => {
  const hexes = {};
  for (const h of m.hexes) {
    hexes[`${h.q},${h.r}`] = { coords: { q: h.q, r: h.r }, terenBazowy: h.teren, nakladka: NK.Brak, rzeka: { obecna: h.obecna, krawedzie: [] } };
  }
  return { hexes, riverPaths: m.riverPaths.map(p => p.map(([q, r]) => ({ q, r }))) };
};
const fw = [];
const kinds = ['zwykla', 'dziury', 'ocean-krawedz', 'obwod-lad', 'zwykla', 'dziury'];
for (let i = 0; i < 90; i++) {
  const m = mkFwMap(kinds[i % kinds.length]);
  const web = toWeb(m);
  const queries = [];
  const pts = [...m.hexes.map(h => [h.q, h.r]), [-1, -1], [m.W + 2, 3], [0, 0]];
  for (const [q, r] of pts) {
    queries.push([q, r,
      FW.hasFreshwaterAccess({ q, r }, web) ? 1 : 0,
      FW.isFreshwaterReservedHex(web, q, r) ? 1 : 0,
      FW.isLakeHex(web, q, r) ? 1 : 0,
      FW.isLakeAdjacent(web, q, r) ? 1 : 0,
      FW.hasRiverWaterAccess(web, q, r) ? 1 : 0]);
  }
  fw.push({
    kind: kinds[i % kinds.length],
    hexes: m.hexes.map(h => [h.q, h.r, h.teren, h.obecna ? 1 : 0]),
    riverPaths: m.riverPaths,
    lakes: [...FW.getLakeHexSet(web)].sort(),
    queries,
  });
}
// przypadek reczny: mapa tylko z woda (zadnej skladowej na krawedzi nie ma, jedna wielka) + dwie skladowe
{
  const mk = (cells) => ({ hexes: cells.map(([q, r, t]) => ({ q, r, teren: t, obecna: false })), riverPaths: [], W: 12, H: 12 });
  const cases = [];
  const full = []; for (let r = 1; r < 6; r++) for (let q = 1; q < 6; q++) full.push([q, r, TB.Laka]);
  const c1 = full.map(([q, r, t]) => [q, r, (q === 2 || q === 3) && (r === 2 || r === 3) ? TB.Morze : (q === 5 && r === 4 ? TB.PlytkieMorze : t)]);
  cases.push(['dwie-skladowe-bez-krawedzi', mk(c1)]);
  const c2 = full.map(([q, r, t]) => [q, r, TB.Morze]);
  cases.push(['sama-woda', mk(c2)]);
  const c3 = [[0, 0, TB.Laka], [1, 0, TB.Morze], [2, 0, TB.Laka]];
  cases.push(['jedno-pole-wody-na-krawedzi', mk(c3)]);
  for (const [kind, m] of cases) {
    const web = toWeb(m);
    const queries = m.hexes.map(h => [h.q, h.r,
      FW.hasFreshwaterAccess({ q: h.q, r: h.r }, web) ? 1 : 0, FW.isFreshwaterReservedHex(web, h.q, h.r) ? 1 : 0,
      FW.isLakeHex(web, h.q, h.r) ? 1 : 0, FW.isLakeAdjacent(web, h.q, h.r) ? 1 : 0, FW.hasRiverWaterAccess(web, h.q, h.r) ? 1 : 0]);
    fw.push({ kind, hexes: m.hexes.map(h => [h.q, h.r, h.teren, 0]), riverPaths: [], lakes: [...FW.getLakeHexSet(web)].sort(), queries });
  }
}

// ---------------------------------------------------------------- fortSightSources
const sight = [];
for (let i = 0; i < 120; i++) {
  const forts = [];
  for (let j = 0; j < ri(0, 6); j++) {
    const f = { q: ri(-8, 8), r: ri(-8, 8), ownerId: ri(0, 3), type: chance(0.5) ? 'fort' : 'posterunek' };
    if (chance(0.3)) f.contestedUseless = chance(0.7);
    forts.push(f);
  }
  const ownerId = ri(0, 3);
  sight.push({ forts, ownerId, expected: FT.fortSightSources(forts, ownerId).map(s => [s.q, s.r, s.radius]) });
}

// ---------------------------------------------------------------- capital separation
const capsep = [];
const SIZES = ['mala', 'srednia', 'duza', 'ogromna', 'super'];
const DIMS = [[30, 20], [60, 40], [79, 79], [80, 60], [80, 80], [120, 84], [168, 120], [240, 168], [336, 238], [672, 476], [100, 100], [80, 200]];
const CIVS = [undefined, 0, 1, 2, 3, 5, 7, 10, 20, 40];
const LANDS = [undefined, 0, -5, 500, 3000, 9000, 20000, 90000];
for (const s of SIZES) for (const [w, h] of DIMS) {
  capsep.push({ kind: 'prop', rozmiar: s, w, h, expected: CL.capitalMinSeparationProportional(s, w, h) });
  for (const c of CIVS) for (const l of LANDS) {
    capsep.push({ kind: 'forMap', rozmiar: s, w, h, civ: c ?? null, land: l ?? null, expected: CL.capitalMinSeparationForMap(s, w, h, c, l) });
  }
}

// ---------------------------------------------------------------- topUpPangeaLandFraction
function mkPangeaMap(W, H, landTarget, noise) {
  // blob ladu wokol srodka (eliptyczny dysk) o zadanym udziale ~landTarget; reszta Morze
  const cx = (W - 1) / 2, cy = (H - 1) / 2;
  const cells = [];
  for (let r = 0; r < H; r++) for (let q = 0; q < W; q++) {
    const dx = (q - cx) / (cx + 0.5), dy = (r - cy) / (cy + 0.5);
    cells.push({ q, r, d: Math.sqrt(dx * dx + dy * dy) + (rnd() - 0.5) * noise });
  }
  const sorted = [...cells].sort((a, b) => a.d - b.d);
  const nLand = Math.round(W * H * landTarget);
  const landSet = new Set(sorted.slice(0, nLand).map(c => `${c.q},${c.r}`));
  return { cells, landSet };
}
const topup = [];
const CODE = { [TB.Morze]: 'M', [TB.PlytkieMorze]: 's', [TB.Laka]: 'L', [TB.Rownina]: 'R', [TB.Wzgorza]: 'H', [TB.Pustynia]: 'D', [TB.Gory]: 'G', [TB.Polarny]: 'P' };
const q6 = (x) => Math.round(x * 1e6) / 1e6;
function runTopUp(W, H, base, noise, target, minNb, maxRounds, landTerrain) {
  const { cells, landSet } = mkPangeaMap(W, H, base, noise);
  const hexes = {};
  const scoreMap = new Map();
  const order = [];
  for (const c of cells) {
    const k = `${c.q},${c.r}`;
    order.push(k);
    hexes[k] = { coords: { q: c.q, r: c.r }, terenBazowy: landSet.has(k) ? landTerrain() : (chance(0.15) ? TB.PlytkieMorze : TB.Morze), nakladka: chance(0.5) ? NK.Las : NK.Brak, zloze: 'zelazo' };
    // wyniki maski: czesciowo kwantyzowane (remisy -> localeCompare), czesciowo ciagle; ~5% kluczy bez wyniku (?? 0)
    if (!chance(0.05)) scoreMap.set(k, chance(0.5) ? Math.round((1 - c.d) * 20) / 20 : q6(1 - c.d));
  }
  const inT = order.map(k => CODE[hexes[k].terenBazowy]).join('');
  const inN = order.map(k => (hexes[k].nakladka === NK.Las ? '1' : '0')).join('');
  const scores = order.map(k => (scoreMap.has(k) ? scoreMap.get(k) : null));
  const added = (minNb === undefined)
    ? GH.topUpPangeaLandFraction(hexes, scoreMap, target, W, H)
    : GH.topUpPangeaLandFraction(hexes, scoreMap, target, W, H, minNb, maxRounds);
  return {
    W, H, target, minNb: minNb ?? 3, maxRounds: maxRounds ?? 12, added, inT, inN, scores,
    outT: order.map(k => CODE[hexes[k].terenBazowy]).join(''),
    outN: order.map(k => (hexes[k].nakladka === NK.Las ? '1' : '0')).join(''),
    outZ: order.map(k => (hexes[k].zloze === undefined ? '0' : '1')).join(''),
  };
}
const landT = () => pick([TB.Laka, TB.Rownina, TB.Wzgorza, TB.Pustynia]);
for (const [W, H] of [[48, 32], [60, 40], [40, 40], [72, 44]]) {
  for (const base of [0.15, 0.3, 0.45, 0.55]) {
    for (const target of [0.3, 0.5, 0.6, 0.7, 0.8, 0.9, 0.1]) topup.push(runTopUp(W, H, base, 0.18, target, undefined, undefined, landT));
  }
}
for (const [mn, mr] of [[2, 12], [4, 12], [3, 1], [3, 0], [1, 30]]) topup.push(runTopUp(48, 32, 0.4, 0.2, 0.65, mn, mr, () => TB.Laka));

writeFileSync(join(outDir, 'freshwater.json'), JSON.stringify({ pin: PIN, cases: fw }) + '\n');
writeFileSync(join(outDir, 'sight.json'), JSON.stringify({ pin: PIN, cases: sight }) + '\n');
writeFileSync(join(outDir, 'capsep.json'), JSON.stringify({ pin: PIN, cases: capsep }) + '\n');
writeFileSync(join(outDir, 'topup.json'), JSON.stringify({ pin: PIN, cases: topup }) + '\n');
const nLakeMaps = fw.filter(c => c.lakes.length > 0).length;
const topAdded = topup.filter(t => t.added > 0).length;
console.log(`freshwater=${fw.length} (z jeziorami ${nLakeMaps}) sight=${sight.length} capsep=${capsep.length} topup=${topup.length} (added>0: ${topAdded})`);
