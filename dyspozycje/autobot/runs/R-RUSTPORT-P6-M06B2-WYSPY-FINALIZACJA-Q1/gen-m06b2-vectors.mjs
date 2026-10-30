// Generator wektorow P6.M06B2 (gen-helpers.ts:4946-5100): removeTinyLandIslands, minTinyIslandHexesForTyp,
// countOpenOceanLandSpecks, purgeOpenOceanLandSpecks, finalizeLandMassAfterCoast, enforceTargetDryLandFraction.
// URUCHAMIA prawdziwy kod TS weba (pin edb8fb56). Zadnej logiki nie przepisujemy.
// Uzycie (z katalogu webu wyeksportowanego przez `git archive edb8fb56 gra/src gra/data`):
//   node --experimental-transform-types --no-warnings --import ./m06b2-loader-register.mjs \
//        ./gen-m06b2-vectors.mjs <WEB_ROOT> <KATALOG_WYJSCIA>
// Wyjscia: web-tiny.json, web-specks.json, web-finalize.json, web-enforce.json.
// Mapa: tablica `maps` (indeks w przypadku), wiersz stanu = [klucz, terenBazowy, nakladka, zloze(0/1),
// rzekaObecna(0/1), rzekaKrawedzie[]]. Wynik funkcji = `ret` + `diff` (tylko heksy ZMIENIONE, w kolejnosci
// wstawiania); stan wyjsciowy = stan wejsciowy z podmienionymi wierszami (odtwarza test Rust).
// Kazda funkcja dostaje SWIEZA kopie mapy.
import { writeFileSync, mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const root = process.argv[2];
const outDir = process.argv[3];
if (!root || !outDir) {
  console.error('uzycie: gen-m06b2-vectors.mjs <WEB_ROOT> <KATALOG_WYJSCIA>');
  process.exit(2);
}
mkdirSync(outDir, { recursive: true });
const G = await import(pathToFileURL(`${root}/gra/src/map/gen-helpers.ts`).href);
const H = await import(pathToFileURL(`${root}/gra/src/types/hex.ts`).href);
const { TerenBazowy: TB, Nakladka: NK } = H;

const keyOf = (q, r) => `${q},${r}`;
const DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
const TYPS = ['pangea', 'kontynenty', 'wyspy', 'ziemia'];
const f = (x) => (Object.is(x, -0) ? '-0' : String(x));

function dumpObj(hexes) {
  return Object.entries(hexes).map(([k, h]) => [
    k,
    h.terenBazowy,
    h.nakladka,
    h.zloze ? 1 : 0,
    h.rzeka.obecna ? 1 : 0,
    [...h.rzeka.krawedzie],
  ]);
}
function buildObj(rows) {
  const o = {};
  for (const [k, terr, nak, z, ro, ed] of rows) {
    const [q, r] = k.split(',').map(Number);
    o[k] = {
      coords: { q, r },
      terenBazowy: terr,
      nakladka: nak,
      rzeka: { obecna: ro === 1, krawedzie: [...ed] },
      ...(z ? { zloze: 'zloze_rudy' } : {}),
    };
  }
  return o;
}
// Wiersze zmienionych heksow (po wywolaniu) wzgledem wierszy wejsciowych.
function diffRows(before, after) {
  const afterRows = dumpObj(after);
  if (afterRows.length !== before.length) throw new Error('zmiana liczby heksow');
  const old = new Map(before.map((r) => [r[0], JSON.stringify(r)]));
  const diff = [];
  for (const r of afterRows) {
    if (old.get(r[0]) !== JSON.stringify(r)) diff.push(r);
  }
  return diff;
}

// ---------- generatory map ----------
const rnd0 = G.mulberry32(20261101);
const rnd = () => rnd0();

// Blob spojny o dokladnie `s` heksach w prostokacie [x0..x1]x[y0..y1] (wzrost losowym sasiadem).
function growBlob(s, x0, x1, y0, y1) {
  const cells = new Set();
  cells.add(keyOf(x0 + Math.floor(rnd() * (x1 - x0 + 1)), y0 + Math.floor(rnd() * (y1 - y0 + 1))));
  let guard = 0;
  while (cells.size < s && guard++ < 20000) {
    const arr = [...cells];
    const [q, r] = arr[Math.floor(rnd() * arr.length)].split(',').map(Number);
    const [dq, dr] = DIRS[Math.floor(rnd() * 6)];
    const nq = q + dq;
    const nr = r + dr;
    if (nq < x0 || nq > x1 || nr < y0 || nr > y1) continue;
    cells.add(keyOf(nq, nr));
  }
  return cells;
}

// Wiersze stanu z zestawu ladu `isLand` (Set kluczy). Nakladki Las i zloza na wodzie I na lądzie.
function finishRows(W, H, land, o) {
  const rows = [];
  for (let q = 0; q < W; q++) {
    for (let r = 0; r < H; r++) {
      const k = keyOf(q, r);
      let terr;
      if (land.has(k)) {
        const x = rnd();
        if (x < o.mtn) terr = TB.Gory;
        else if (x < o.mtn * 1.6) terr = TB.Wzgorza;
        else terr = [TB.Laka, TB.Rownina, TB.Pustynia][Math.floor(rnd() * 3)];
      } else {
        terr = rnd() < o.plytkie ? TB.PlytkieMorze : TB.Morze;
      }
      const water = terr === TB.Morze || terr === TB.PlytkieMorze;
      const nak = rnd() < (water ? o.lasWoda : o.lasLad) ? NK.Las : NK.Brak;
      const zloze = rnd() < (water ? o.zlozeWoda : o.zlozeLad) ? 1 : 0;
      let ro = 0;
      let ed = [];
      if (rnd() < o.rzekaP) {
        ro = 1;
        const n = 1 + Math.floor(rnd() * 3);
        const set = new Set();
        while (set.size < n) set.add(Math.floor(rnd() * 6));
        ed = [...set].sort((a, b) => a - b);
      }
      rows.push([k, terr, nak, zloze, ro, ed]);
    }
  }
  return rows;
}

// Mapa wysp: siatka cx x cy komorek 6x6; w kazdej komorce blob o rozmiarze z `sizes` (0 = pusta).
// Dodatkowe pojedyncze lądy (`szum`) w wodzie tworza izolowane heksy.
function islandsRows(cx, cy, sizes, szum, o) {
  const W = 6 * cx;
  const H = 6 * cy;
  const land = new Set();
  let si = 0;
  for (let j = 0; j < cy; j++) {
    for (let i = 0; i < cx; i++) {
      const s = sizes[si++ % sizes.length];
      if (s === 0) continue;
      const x0 = 6 * i + 1;
      const y0 = 6 * j + 1;
      for (const k of growBlob(s, x0, x0 + 3, y0, y0 + 3)) land.add(k);
    }
  }
  for (let q = 0; q < W; q++) {
    for (let r = 0; r < H; r++) {
      if (!land.has(keyOf(q, r)) && rnd() < szum) land.add(keyOf(q, r));
    }
  }
  return { W, H, rows: finishRows(W, H, land, o) };
}

// Mapa losowa (bloby lądu przez spacer), jak w M06B1.
function blobRows(W, H, landFrac, o) {
  const keys = [];
  for (let q = 0; q < W; q++) for (let r = 0; r < H; r++) keys.push(keyOf(q, r));
  const land = new Set();
  const target = Math.round(keys.length * landFrac);
  const seeds = Math.max(1, Math.round(keys.length / 40));
  const frontier = [];
  for (let i = 0; i < seeds; i++) {
    const k = keys[Math.floor(rnd() * keys.length)];
    land.add(k);
    frontier.push(k);
  }
  let guard = 0;
  while (land.size < target && frontier.length && guard++ < keys.length * 50) {
    const idx = Math.floor(rnd() * frontier.length);
    const [q, r] = frontier[idx].split(',').map(Number);
    const [dq, dr] = DIRS[Math.floor(rnd() * 6)];
    const nq = q + dq;
    const nr = r + dr;
    if (nq >= 0 && nq < W && nr >= 0 && nr < H) {
      const nk = keyOf(nq, nr);
      if (!land.has(nk)) {
        land.add(nk);
        frontier.push(nk);
      }
    }
    if (rnd() < 0.02) frontier.splice(idx, 1);
  }
  return { W, H, rows: finishRows(W, H, land, o) };
}

const OPT_A = { mtn: 0.2, plytkie: 0.3, lasWoda: 0.12, lasLad: 0.1, zlozeWoda: 0.05, zlozeLad: 0.1, rzekaP: 0.15 };
const OPT_B = { mtn: 0.4, plytkie: 0.5, lasWoda: 0.2, lasLad: 0.15, zlozeWoda: 0.1, zlozeLad: 0.2, rzekaP: 0.3 };
const OPT_C = { mtn: 0.1, plytkie: 0.1, lasWoda: 0.05, lasLad: 0.05, zlozeWoda: 0.02, zlozeLad: 0.05, rzekaP: 0.05 };
const OPTS = [OPT_A, OPT_B, OPT_C];

const maps = [];
const addMap = (m) => {
  maps.push({ W: m.W, H: m.H, rows: m.rows });
  return maps.length - 1;
};
const mapRows = (mi) => maps[mi].rows;

// Wspolne: uruchom funkcje na swiezej kopii mapy `mi`, zwroc { ret, diff }.
function runOn(mi, fn) {
  const before = mapRows(mi);
  const hexes = buildObj(before);
  const ret = fn(hexes);
  return { ret, diff: diffRows(before, hexes) };
}

const cases = { tiny: [], minTyp: [], specks: [], purge: [], finalize: [], enforce: [] };
const stats = {};
const bump = (k, n = 1) => {
  stats[k] = (stats[k] ?? 0) + n;
};

// ===== 1. removeTinyLandIslands + minTinyIslandHexesForTyp =====
for (const typ of TYPS) {
  cases.minTyp.push({ typ, out: f(G.minTinyIslandHexesForTyp(typ)) });
}
// Mapy wysp: rozmiary 1..12 + 0; N-1/N/N+1 wzgledem kazdego progu 1..13.
const tinySizeSets = [
  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
  [3, 5, 7, 9, 11, 0, 4, 6, 8, 10, 12, 2],
  [2, 0, 4, 0, 6, 0, 8, 0, 10, 0, 12, 0, 1],
];
const tinyMaps = [];
for (let i = 0; i < 24; i++) {
  const sizes = tinySizeSets[i % tinySizeSets.length];
  const szum = [0, 0.03, 0.06][i % 3];
  const m = islandsRows(5, 4, sizes, szum, OPTS[i % 3]);
  tinyMaps.push(addMap(m));
}
for (let i = 0; i < 8; i++) {
  const W = 20 + Math.floor(rnd() * 12);
  const H = 16 + Math.floor(rnd() * 10);
  tinyMaps.push(addMap(blobRows(W, H, [0.35, 0.5, 0.65][i % 3], OPTS[i % 3])));
}
for (const mi of tinyMaps) {
  const minSweep = [];
  for (let mn = 1; mn <= 13; mn++) {
    const res = runOn(mi, (hx) => G.removeTinyLandIslands(hx, mn));
    cases.tiny.push({ id: `tiny-${mi}-m${mn}`, mi, W: maps[mi].W, H: maps[mi].H, min: mn, out: { ret: res.ret, diff: res.diff } });
    minSweep.push(res.ret);
  }
  // Statystyka: ile razy zmiana zalezy od progu (N-1 vs N vs N+1 daja inny wynik).
  for (const mn of [4, 6, 8, 10]) {
    const a = minSweep[mn - 2];
    const b = minSweep[mn - 1];
    const c = minSweep[mn];
    if (a !== b) bump('tiny_prog_N-1_vs_N_rozne');
    if (b !== c) bump('tiny_prog_N_vs_N+1_rozne');
  }
  bump('tiny_mapy');
}
for (const mi of tinyMaps) {
  for (const typ of TYPS) {
    const mn = G.minTinyIslandHexesForTyp(typ);
    const res = runOn(mi, (hx) => G.removeTinyLandIslands(hx, mn));
    cases.tiny.push({ id: `tiny-${mi}-${typ}`, mi, W: maps[mi].W, H: maps[mi].H, min: mn, typ, out: { ret: res.ret, diff: res.diff } });
  }
}

// ===== 2. countOpenOceanLandSpecks + purgeOpenOceanLandSpecks =====
const specMaps = [];
for (let i = 0; i < 20; i++) {
  if (i % 2 === 0) {
    const sizes = [1, 0, 1, 2, 0, 1, 3, 1, 0, 2];
    specMaps.push(addMap(islandsRows(4, 3, sizes, [0.05, 0.1, 0.15][i % 3], OPTS[i % 3])));
  } else {
    specMaps.push(addMap(blobRows(18 + (i % 5), 12 + (i % 4), [0.2, 0.35, 0.5][i % 3], OPTS[i % 3])));
  }
}
for (const mi of specMaps) {
  const cnt = G.countOpenOceanLandSpecks(buildObj(mapRows(mi)));
  cases.specks.push({ id: `specks-${mi}`, mi, out: f(cnt) });
  if (cnt > 0) bump('specks_mapy_z_specks');
  const res = runOn(mi, (hx) => G.purgeOpenOceanLandSpecks(hx));
  cases.purge.push({ id: `purge-specks-${mi}`, mi, W: maps[mi].W, H: maps[mi].H, out: { ret: res.ret, diff: res.diff } });
  if (res.ret > 0) bump('purge_mapy_z_usunieciem');
}

// ===== 3. finalizeLandMassAfterCoast =====
// Mapy male (3x3 komorki = 18x18) dla kosztu rozmiaru wektorow.
const finMaps = [];
for (let i = 0; i < 12; i++) {
  if (i % 2 === 0) {
    finMaps.push(addMap(islandsRows(3, 3, [1, 3, 0, 5, 7, 2, 9, 0, 4], [0.04, 0.08][i % 2], OPTS[i % 3])));
  } else {
    finMaps.push(addMap(blobRows(18, 18, [0.4, 0.55][i % 2], OPTS[i % 3])));
  }
}
const COASTP = [1, 2, 3, undefined];
for (const mi of finMaps) {
  for (const typ of TYPS) {
    for (const cp of COASTP) {
      for (const pool of [undefined, 8]) {
        const opts = pool === undefined ? undefined : { maxInlandPoolSize: pool };
        const W = maps[mi].W;
        const H = maps[mi].H;
        const res = runOn(mi, (hx) => G.finalizeLandMassAfterCoast(hx, typ, W, H, opts, cp));
        cases.finalize.push({
          id: `fin-${mi}-${typ}-cp${cp ?? 'def'}-p${pool ?? 'none'}`,
          mi, typ, W, H, coastPasses: cp ?? null, pool: pool ?? null,
          out: { ret: res.ret, diff: res.diff },
        });
      }
    }
  }
}

// ===== 4. enforceTargetDryLandFraction =====
// Wyniki wag (landScores) per mapa: wartosci losowe w [0,1) zapisane jako lista w kolejnosci kluczy.
const enfMaps = [];
for (let i = 0; i < 12; i++) {
  const mi = i % 2 === 0
    ? addMap(islandsRows(3, 3, [1, 3, 0, 5, 7, 2, 9, 0, 4], 0.05, OPTS[i % 3]))
    : addMap(blobRows(18, 18, [0.3, 0.5][i % 2], OPTS[i % 3]));
  const scores = mapRows(mi).map(() => Math.round(rnd() * 1000) / 1000);
  maps[mi].scores = scores;
  enfMaps.push(mi);
}
const TARGETS = [0.14, 0.15, 0.16, 0.5, 0.85, 0.86];
for (const mi of enfMaps) {
  const W = maps[mi].W;
  const H = maps[mi].H;
  const scoreMap = () => new Map(mapRows(mi).map((row, i) => [row[0], maps[mi].scores[i]]));
  // Cele przy granicy tolerancji: udzial suchego lądu wejscia +/- kilka punktow procentowych.
  const f0 = G.countLandSeaHexes(buildObj(mapRows(mi))).land / (W * H);
  const near = [-0.05, -0.035, -0.025, 0.025, 0.035, 0.05].map((d) => Math.round((f0 + d) * 1000) / 1000);
  for (const target of [...TARGETS, ...near]) {
    const byTol = {};
    const isNear = near.includes(target);
    for (const tol of [2, 3, 4]) {
      for (const bias of isNear ? ['center', ...(tol === 3 ? ['mask'] : [])] : ['center', 'mask']) {
        const res = runOn(mi, (hx) => G.enforceTargetDryLandFraction(hx, scoreMap(), target, W, H, undefined, tol, bias));
        cases.enforce.push({
          id: `enf-${mi}-t${target}-tol${tol}-${bias}`,
          mi, W, H, target, tol, bias,
          out: { ret: res.ret, diff: res.diff },
        });
        byTol[`${tol}-${bias}`] = JSON.stringify(res);
      }
    }
    if (byTol['2-center'] !== byTol['3-center']) bump('enf_tol2_vs_3_rozne');
    if (byTol['3-center'] !== byTol['4-center']) bump('enf_tol3_vs_4_rozne');
    if (byTol['2-mask'] !== undefined && byTol['2-mask'] !== byTol['3-mask']) bump('enf_tol2_vs_3_rozne_mask');
    if (isNear) bump('enf_cele_przy_granicy');
  }
  for (const bias of ['center', 'mask']) {
    for (const tol of [3]) {
      const a = JSON.stringify(runOn(mi, (hx) => G.enforceTargetDryLandFraction(hx, scoreMap(), 0.14, W, H, undefined, tol, bias)));
      const b = JSON.stringify(runOn(mi, (hx) => G.enforceTargetDryLandFraction(hx, scoreMap(), 0.15, W, H, undefined, tol, bias)));
      const c = JSON.stringify(runOn(mi, (hx) => G.enforceTargetDryLandFraction(hx, scoreMap(), 0.16, W, H, undefined, tol, bias)));
      if (a !== b) bump(`enf_clamp_0.14_vs_0.15_${bias}`);
      if (b !== c) bump(`enf_clamp_0.15_vs_0.16_${bias}`);
    }
  }
  bump('enf_mapy');
}

// ===== 5. Sondy granic (plik web-enforce-probe.json) =====
// (a) Rownosc granicy tolerancji: |land - targetLand| === tolHexes po pierwszym etapie (wypelnienie,
//     granica, wybrzeze 1 przebieg). Cel = m/total daje targetLand = m dokladnie. Sonda liczy etap
//     pierwszy funkcjami weba; wektor zapisuje PRAWDZIWE wyjscie enforceTargetDryLandFraction.
// (b) Klamp gorny: cele 0.9 / 0.95 / 0.99 (dla kazdego klampu 0.85 vs 0.86 inna tolerancja decyzji).
// Mapy o duzej pojemnosci lądu (0.85-0.95 lądu): dopiero na nich wypelnienie dochodzi do celu > 0.85.
const lhMaps = [];
for (let i = 0; i < 6; i++) {
  const mi = addMap(blobRows(18, 18, [0.85, 0.9, 0.95][i % 3], OPTS[i % 3]));
  maps[mi].scores = mapRows(mi).map(() => Math.round(rnd() * 1000) / 1000);
  lhMaps.push(mi);
}
const probeMaps = [...enfMaps, ...lhMaps];
const probeCases = [];
const probeHits = {};
const probeBump = (k) => {
  probeHits[k] = (probeHits[k] ?? 0) + 1;
};
for (const mi of probeMaps) {
  const W = maps[mi].W;
  const H = maps[mi].H;
  const total = mapRows(mi).length;
  const scoreMapP = () => new Map(mapRows(mi).map((row, i) => [row[0], maps[mi].scores[i]]));
  const minScore = 0.11;
  for (const tol of [2, 3, 4]) {
    const tolHexes = Math.max(1, Math.round((total * tol) / 100));
    for (const bias of ['center', 'mask']) {
      let found = 0;
      const lo = Math.ceil(0.15 * total);
      const hi = Math.floor(0.85 * total);
      for (let m = lo; m <= hi && found < 4; m++) {
        const target = m / total;
        const hx = buildObj(mapRows(mi));
        G.applyLandFractionByScore(hx, scoreMapP(), target, W, H, bias, minScore);
        G.enforceMapBorderOcean(hx, W, H);
        G.finalizeCoastAndInlandWater(hx, W, H, 1, undefined);
        G.enforceMapBorderOcean(hx, W, H);
        const land = G.countLandSeaHexes(hx).land;
        if (Math.abs(land - m) === tolHexes) {
          const res = runOn(mi, (h2) => G.enforceTargetDryLandFraction(h2, scoreMapP(), target, W, H, undefined, tol, bias));
          probeCases.push({ id: `enfprobe-eq-${mi}-m${m}-tol${tol}-${bias}`, mi, W, H, target, tol, bias, sonda: 'rownosc-granicy', out: { ret: res.ret, diff: res.diff } });
          probeBump(`rownosc_granicy_tol${tol}_${bias}`);
          found++;
        }
      }
    }
  }
  // (c) Decyzja klampu gornego: |land1 - tl(0.85)| > tol i |land1 - tl(0.86)| > tol daja rozne galezie.
  // Tolerancja w heksach T = 2..40 (tol = T*100/total daje tolHexes = T dokladnie). Cel 0.86: tlO = tl(0.85),
  // tlM = tl(0.86) roznia sie o kilka heksow; okno decyzji istnieje dla T w [|land1-tlO|, |land1-tlM|).
  for (const bias of ['center', 'mask']) {
    // Dla `mask` zawezamy kandydatow progiem minMaskFillScore (0.5 / 0.9): niedobor lądu -> okno decyzji.
    for (const ms of bias === 'mask' ? [minScore, 0.5, 0.9] : [minScore]) {
      let found = 0;
      for (let T = 2; T <= Math.round(total * 0.4) && found < 2; T++) {
        const tol = (T * 100) / total;
        const tolHexes = Math.max(1, Math.round((total * tol) / 100));
        const target = 0.86;
        const hx = buildObj(mapRows(mi));
        G.applyLandFractionByScore(hx, scoreMapP(), Math.min(0.85, target), W, H, bias, ms);
        G.enforceMapBorderOcean(hx, W, H);
        G.finalizeCoastAndInlandWater(hx, W, H, 1, undefined);
        G.enforceMapBorderOcean(hx, W, H);
        const land1 = G.countLandSeaHexes(hx).land;
        const tlO = Math.round(total * Math.min(0.85, target));
        const tlM = Math.round(total * Math.min(0.86, target));
        const dO = Math.abs(land1 - tlO) > tolHexes;
        const dM = Math.abs(land1 - tlM) > tolHexes;
        if (dO !== dM) {
          const res = runOn(mi, (h2) => G.enforceTargetDryLandFraction(h2, scoreMapP(), target, W, H, undefined, tol, bias, ms));
          probeCases.push({ id: `enfprobe-klamp-decyzja-${mi}-T${tolHexes}-${bias}-ms${ms}`, mi, W, H, target, tol, bias, minScore: ms, sonda: 'klamp-decyzja', out: { ret: res.ret, diff: res.diff } });
          probeBump(`klamp_decyzja_${bias}_ms${ms}`);
          found++;
        }
      }
    }
  }
  for (const tol of [2, 3, 4]) {
    for (const bias of ['center', 'mask']) {
      for (const target of [0.9, 0.95, 0.99]) {
        const res = runOn(mi, (h2) => G.enforceTargetDryLandFraction(h2, scoreMapP(), target, W, H, undefined, tol, bias));
        probeCases.push({ id: `enfprobe-clamp-${mi}-t${target}-tol${tol}-${bias}`, mi, W, H, target, tol, bias, sonda: 'klamp-gorny', out: { ret: res.ret, diff: res.diff } });
        probeBump('klamp_gorny');
      }
    }
  }
}
{
  const probePos = new Map(probeMaps.map((mi, j) => [mi, j]));
  const payload = {
    meta: { pin_web: 'edb8fb56', temat: 'R-RUSTPORT-P6-M06B2-WYSPY-FINALIZACJA-Q1', plik: 'web-enforce-probe.json', generator: 'gen-m06b2-vectors.mjs' },
    cases: { enforceProbe: probeCases.map((c) => ({ ...c, mi: probePos.get(c.mi) })) },
    maps: probeMaps.map((mi) => maps[mi]),
    stats: probeHits,
  };
  write('web-enforce-probe.json', payload);
}

// Zapis: kazdy plik osobno (limit 6 MB na plik wektorow).
function write(name, payload) {
  const text = JSON.stringify(payload);
  writeFileSync(`${outDir}/${name}`, text);
  console.log(JSON.stringify({ file: name, bytes: text.length, cases: Object.fromEntries(Object.entries(payload.cases).map(([k, v]) => [k, v.length])) }));
}
const meta = { pin_web: 'edb8fb56', temat: 'R-RUSTPORT-P6-M06B2-WYSPY-FINALIZACJA-Q1', generator: 'gen-m06b2-vectors.mjs' };
const used = (list) => {
  const ids = new Set(list);
  return [...ids];
};
void used;
const perFile = {
  'web-tiny.json': { cases: { tiny: cases.tiny, minTyp: cases.minTyp }, maps: tinyMaps.map((mi) => maps[mi]) },
  'web-specks.json': { cases: { specks: cases.specks, purge: cases.purge }, maps: specMaps.map((mi) => maps[mi]) },
  'web-finalize.json': { cases: { finalize: cases.finalize }, maps: finMaps.map((mi) => maps[mi]) },
  'web-enforce.json': { cases: { enforce: cases.enforce }, maps: enfMaps.map((mi) => maps[mi]) },
};
// Indeksy map w pliku sa lokalne: przepisz `mi` na indeks w tablicy `maps` danego pliku.
const remap = (list, idxList) => {
  const pos = new Map(idxList.map((mi, j) => [mi, j]));
  return list.map((c) => ({ ...c, mi: pos.get(c.mi) }));
};
perFile['web-tiny.json'].cases.tiny = remap(cases.tiny, tinyMaps);
perFile['web-specks.json'].cases.specks = remap(cases.specks, specMaps);
perFile['web-specks.json'].cases.purge = remap(cases.purge, specMaps);
perFile['web-finalize.json'].cases.finalize = remap(cases.finalize, finMaps);
perFile['web-enforce.json'].cases.enforce = remap(cases.enforce, enfMaps);
for (const [name, payload] of Object.entries(perFile)) {
  write(name, { meta: { ...meta, plik: name }, cases: payload.cases, maps: payload.maps, stats: name === 'web-tiny.json' ? stats : {} });
}
console.log(JSON.stringify({ stats }));
