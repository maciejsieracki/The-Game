// P6.M12 - wektory z URUCHOMIONEGO weba (pin edb8fb56) dla zakresu klastrow "compute i plan spawnu":
//   gra/src/map/cluster-spawn.ts :54-69, 166-188, 210-445
//   gra/src/map/clusters.ts      :127-144, 3362-4250
//
// Metoda (bez przepisywania logiki; jak P6.M10/M11, ale BEZ kopii z `export`):
//  - `computeClusters` i `buildClusterSpawnPlan` sa EKSPORTOWANE przez web, wiec moduly `clusters.ts`,
//    `cluster-spawn.ts`, `gen-helpers.ts`, `generator.ts` ladujemy loaderem (m12-loader-hooks.mjs: tylko
//    dopisuje .ts / index.ts i traktuje .json jako modul) - BEZ STUBOW i BEZ wrapperow logiki.
//  - dane: PRAWDZIWE gra/data/civs.json i gra/data/city-names-pools.json (czytane z git archive pinu).
//  - mapy: PRAWDZIWY generateMap (7 specyfikacji, w tym 2 duze: krotszy bok >= 80, wiec ForMap != 0)
//    + mapy syntetyczne (te same co M10/M11: 12 + lustrzana) + duze syntetyczne + mapy brzegowe
//    (pusta, sam ocean, pojedynczy hex ladu, ...). Zawartosc map jest w wektorach (teren, rzeki).
//  - kazde wywolanie: wynik (lub `threw: true`, gdy web rzuca TypeError) + sygnatura `spawnCache`
//    (liczba i FNV-1a puli `ladowe`, mas ladu i pola morza).
//
// Wariant "bez dziennika": web `computeClusters` konczy sie dziennikiem diagnostycznym
// (`clusters.ts:4228-4233`), ktorego napis czyta `regiony[ci]!.length` i RZUCA TypeError, gdy klaster
// dopelniony nie ma regionu Voronoi. Zeby miec wynik takze dla przypadkow, w ktorych web rzuca,
// generator ladowuje DRUGA kopie clusters.ts, w ktorej zmieniony jest dokladnie jeden token tego logu
// (`regiony[ci]!.length` -> `regiony[ci]?.length`, asercja: jedno wystapienie). Neutralnosc zmiany
// jest weryfikowana na przypadkach niethrowing (wynik kopii == wynik oryginalu, `noDiagSame`).
//
// Uzycie:
//   node --experimental-transform-types --no-warnings --import ./m12-loader-register.mjs \
//     ./gen-m12-vectors.mjs <WEB_ROOT> <OUT_JSON>
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve as presolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [, , webRootArg, outArg] = process.argv;
if (!webRootArg || !outArg) {
  console.error('usage: <WEB_ROOT> <OUT_JSON>');
  process.exit(2);
}
const webRoot = presolve(webRootArg);
const srcPath = (p) => join(webRoot, 'gra/src', p);
const src = (p) => pathToFileURL(srcPath(p)).href;

const origLog = console.log;
const origWarn = console.warn;
const quiet = (fn) => {
  console.log = () => {};
  console.warn = () => {};
  try {
    return fn();
  } finally {
    console.log = origLog;
    console.warn = origWarn;
  }
};

const C = await import(src('map/clusters.ts'));
const clustersOrigText = readFileSync(srcPath('map/clusters.ts'), 'utf8');
const DIAG_NEEDLE = 'regiony[ci]!.length';
if (clustersOrigText.split(DIAG_NEEDLE).length !== 2) throw new Error('oczekiwano dokladnie jednego wystapienia ' + DIAG_NEEDLE);
const noDiagPath = srcPath('map/clusters.m12-nodiag.ts');
writeFileSync(noDiagPath, clustersOrigText.replace(DIAG_NEEDLE, 'regiony[ci]?.length'));
const CND = await import(pathToFileURL(noDiagPath).href);
const S = await import(src('map/cluster-spawn.ts'));
const GH = await import(src('map/gen-helpers.ts'));
const { mulberry32, buildSeaDistanceField } = GH;
const { generateMap } = await import(src('map/generator.ts'));
const civs = JSON.parse(readFileSync(join(webRoot, 'gra/data/civs.json'), 'utf8'));
const pools = JSON.parse(readFileSync(join(webRoot, 'gra/data/city-names-pools.json'), 'utf8'));
const clustersLines = readFileSync(srcPath('map/clusters.ts'), 'utf8').split('\n').length;
const spawnLines = readFileSync(srcPath('map/cluster-spawn.ts'), 'utf8').split('\n').length;

// ---------------------------------------------------------------------------
// Narzedzia
// ---------------------------------------------------------------------------
const P = (h) => [h.q, h.r];
const PL = (arr) => arr.map(P);
const fnv1a64 = (s) => {
  let h = 0xcbf29ce484222325n;
  for (const b of Buffer.from(s, 'utf8')) {
    h ^= BigInt(b);
    h = (h * 0x100000001b3n) & 0xffffffffffffffffn;
  }
  return h.toString(16).padStart(16, '0');
};
const digestHexes = (list) => fnv1a64(list.map((h) => `${h.q},${h.r}`).join(';'));
const gr = mulberry32(20261023);
const rnd = () => gr();
const ri = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];

// ---------------------------------------------------------------------------
// Mapy: teren jako kod 1-znakowy (jak M10/M11)
// ---------------------------------------------------------------------------
const T2C = {
  morze: 'm',
  plytkie_morze: 'p',
  laka: 'l',
  rownina: 'r',
  wzgorza: 'w',
  gory: 'g',
  pustynia: 'u',
  polarny: 'o',
};
const C2T = Object.fromEntries(Object.entries(T2C).map(([k, v]) => [v, k]));

function fnvOfWebMap(map) {
  return fnv1a64(
    Object.values(map.hexes)
      .map((hx) => `${hx.coords.q},${hx.coords.r},${hx.terenBazowy}`)
      .join(';'),
  );
}

function repFromWebMap(id, source, map) {
  const hexes = Object.values(map.hexes);
  const w = map.szerokoscQ;
  const h = map.wysokoscR;
  if (hexes.length !== w * h) throw new Error(`${id}: liczba hexow`);
  let terrain = '';
  let river = '';
  hexes.forEach((hx, i) => {
    const q = i % w;
    const r = Math.floor(i / w);
    if (hx.coords.q !== q || hx.coords.r !== r) throw new Error(`${id}: kolejnosc hexow nie jest wierszowa`);
    const c = T2C[hx.terenBazowy];
    if (!c) throw new Error(`${id}: teren ${hx.terenBazowy}`);
    terrain += c;
    river += hx.rzeka && hx.rzeka.obecna === true ? '1' : '0';
  });
  return { id, source, w, h, terrain, river, hexesFnv: fnvOfWebMap(map) };
}

function webMapFromRep(rep) {
  const hexes = {};
  for (let r = 0; r < rep.h; r++) {
    for (let q = 0; q < rep.w; q++) {
      const i = r * rep.w + q;
      hexes[`${q},${r}`] = {
        coords: { q, r },
        terenBazowy: C2T[rep.terrain[i]],
        rzeka: { obecna: rep.river[i] === '1' },
      };
    }
  }
  return { szerokoscQ: rep.w, wysokoscR: rep.h, hexes };
}

function finishRep(rep) {
  const web = webMapFromRep(rep);
  rep.hexesFnv = fnvOfWebMap(web);
  return rep;
}

const REAL_SPECS = [
  { id: 'k42', w: 36, h: 28, seed: 42, typ: 'kontynenty' },
  { id: 'k7', w: 36, h: 28, seed: 7, typ: 'kontynenty' },
  { id: 'p123', w: 36, h: 28, seed: 123, typ: 'pangea' },
  { id: 'k3small', w: 24, h: 18, seed: 3, typ: 'kontynenty' },
  { id: 'w5', w: 40, h: 30, seed: 5, typ: 'wyspy' },
  // duze: krotszy bok >= 80 => capital*ForMap / cluster*ForMap != 0 (M10/M11 nie badaly tej sciezki w computeClusters)
  { id: 'r_s100', w: 100, h: 80, seed: 7, typ: 'kontynenty' },
  { id: 'r_d150', w: 150, h: 100, seed: 7, typ: 'pangea' },
];

function synthRep(id, w, h, seed, kind) {
  const g = mulberry32(seed);
  const r01 = () => g();
  const terrain = new Array(w * h).fill('m');
  const blobs = [];
  const nb = kind === 'archipelago' ? 14 : kind === 'pangea' ? 2 : 2 + Math.floor(r01() * 4);
  for (let i = 0; i < nb; i++) {
    const rad =
      kind === 'archipelago'
        ? 2 + r01() * 3
        : kind === 'pangea'
          ? Math.min(w, h) * (0.3 + r01() * 0.15)
          : 3 + r01() * (Math.min(w, h) / 3);
    blobs.push({ q: r01() * w, r: r01() * h, rad });
  }
  const weights = [
    ['l', 30],
    ['r', 25],
    ['w', 15],
    ['g', 8],
    ['u', 10],
    ['o', 4],
  ];
  const total = weights.reduce((s, x) => s + x[1], 0);
  const pickTerrain = () => {
    let x = r01() * total;
    for (const [c, wt] of weights) {
      x -= wt;
      if (x < 0) return c;
    }
    return 'l';
  };
  for (let r = 0; r < h; r++) {
    for (let q = 0; q < w; q++) {
      let inside = false;
      for (const b of blobs) {
        const d = Math.hypot(q - b.q, (r - b.r) * 1.1);
        if (d <= b.rad * (0.75 + 0.3 * r01())) inside = true;
      }
      if (inside && kind === 'holes' && r01() < 0.12) inside = false;
      if (inside) terrain[r * w + q] = pickTerrain();
    }
  }
  const copy = terrain.slice();
  for (let r = 0; r < h; r++) {
    for (let q = 0; q < w; q++) {
      if (copy[r * w + q] !== 'm') continue;
      const nbs = [
        [1, 0],
        [1, -1],
        [0, -1],
        [-1, 0],
        [-1, 1],
        [0, 1],
      ];
      const touchesLand = nbs.some(([dq, dr]) => {
        const nq = q + dq;
        const nr = r + dr;
        return nq >= 0 && nq < w && nr >= 0 && nr < h && copy[nr * w + nq] !== 'm' && copy[nr * w + nq] !== 'p';
      });
      if (touchesLand && r01() < 0.5) terrain[r * w + q] = 'p';
    }
  }
  let river = '';
  for (let i = 0; i < w * h; i++) river += terrain[i] !== 'm' && terrain[i] !== 'p' && r01() < 0.1 ? '1' : '0';
  return finishRep({ id, source: 'synthetic', w, h, terrain: terrain.join(''), river });
}

// Pierwsze 12 jak w M10/M11 (te same ziarna => te same mapy; test w Rust porownuje z mapami M11).
const SYNTH_SPECS = [
  ['s_tiny', 12, 10, 11, 'continents'],
  ['s_small', 20, 14, 12, 'continents'],
  ['s_c30', 30, 24, 13, 'continents'],
  ['s_arch40', 40, 30, 14, 'archipelago'],
  ['s_pang36', 36, 28, 15, 'pangea'],
  ['s_hole40', 40, 30, 16, 'holes'],
  ['s_c50', 50, 40, 17, 'continents'],
  ['s_pang64', 64, 48, 18, 'pangea'],
  ['s_arch50', 50, 40, 19, 'archipelago'],
  ['s_c80', 80, 60, 20, 'continents'],
  ['s_pang80', 80, 60, 21, 'pangea'],
  ['s_hole64', 64, 48, 22, 'holes'],
];
// Duze syntetyczne (krotszy bok >= 80): rozmiary 'srednia' / 'duza' / 'ogromna'.
const BIG_SYNTH_SPECS = [
  ['b_s90', 90, 80, 31, 'continents'],
  ['b_d120', 120, 100, 32, 'pangea'],
  ['b_d130', 130, 100, 33, 'archipelago'],
  ['b_o200', 200, 150, 34, 'continents'],
  ['b_h110', 110, 90, 35, 'holes'],
  ['b_a150', 150, 100, 36, 'archipelago'],
  ['b_h120', 120, 100, 37, 'holes'],
];
// Typowe rozmiary gry (krotszy bok < 80): srednie mapy, na ktorych web rzadziej rzuca w dzienniku.
const MID_SYNTH_SPECS = [
  ['m_48x36', 48, 36, 41, 'continents'],
  ['m_60x40', 60, 40, 42, 'continents'],
  ['m_70x50', 70, 50, 43, 'pangea'],
  ['m_60x40a', 60, 40, 44, 'archipelago'],
  ['m_70x50h', 70, 50, 45, 'holes'],
];

function mirrorRep(id, w, h, seed) {
  const g = mulberry32(seed);
  const terrain = new Array(w * h).fill('m');
  const river = new Array(w * h).fill('0');
  const codes = ['l', 'l', 'l', 'r', 'r', 'w', 'u'];
  for (let r = 2; r <= 8; r++) {
    for (let q = 3; q <= 15; q++) {
      const t = codes[Math.floor(g() * codes.length)];
      const rv = g() < 0.08 ? '1' : '0';
      terrain[r * w + q] = t;
      terrain[(h - 1 - r) * w + (w - 1 - q)] = t;
      river[r * w + q] = rv;
      river[(h - 1 - r) * w + (w - 1 - q)] = rv;
    }
  }
  return finishRep({ id, source: 'synthetic', w, h, terrain: terrain.join(''), river: river.join('') });
}

// Mapy brzegowe (z jawna tresca terenu). Kod: m morze, p plytkie, l laka, r rownina, w wzgorza, g gory, u pustynia, o polarny.
function fillRep(id, w, h, fn) {
  const terrain = [];
  for (let r = 0; r < h; r++) for (let q = 0; q < w; q++) terrain.push(fn(q, r));
  return finishRep({ id, source: 'edge', w, h, terrain: terrain.join(''), river: '0'.repeat(w * h) });
}

const mapsOut = {};
const webMaps = {};
// Cache map z generateMap (TYLKO do iteracji deweloperskich; ostateczny przebieg bez M12_MAPS_CACHE).
const mapsCachePath = process.env.M12_MAPS_CACHE;
let mapsCache = null;
if (mapsCachePath) {
  try {
    mapsCache = JSON.parse(readFileSync(mapsCachePath, 'utf8'));
  } catch {
    mapsCache = null;
  }
}
for (const s of REAL_SPECS) {
  if (mapsCache && mapsCache[s.id]) {
    mapsOut[s.id] = mapsCache[s.id];
    webMaps[s.id] = webMapFromRep(mapsCache[s.id]);
    continue;
  }
  const m = quiet(() => generateMap(s.w, s.h, s.seed, s.typ));
  webMaps[s.id] = m;
  mapsOut[s.id] = repFromWebMap(s.id, 'generateMap', m);
  mapsOut[s.id].spec = { w: s.w, h: s.h, seed: s.seed, typ: s.typ };
}
if (mapsCachePath && !mapsCache) {
  writeFileSync(
    mapsCachePath,
    JSON.stringify(Object.fromEntries(REAL_SPECS.map((s) => [s.id, mapsOut[s.id]]))),
  );
}
for (const [id, w, h, seed, kind] of SYNTH_SPECS.concat(MID_SYNTH_SPECS, BIG_SYNTH_SPECS)) {
  const rep = synthRep(id, w, h, seed, kind);
  mapsOut[id] = rep;
  webMaps[id] = webMapFromRep(rep);
}
{
  const rep = mirrorRep('s_mirror', 41, 21, 77);
  mapsOut[rep.id] = rep;
  webMaps[rep.id] = webMapFromRep(rep);
}
const EDGE_MAPS = [
  // pusta mapa: web liczy W = H = -Infinity
  { id: 'e_empty', w: 0, h: 0, terrain: '', river: '' },
];
for (const e of EDGE_MAPS) {
  const rep = { id: e.id, source: 'edge', w: e.w, h: e.h, terrain: e.terrain, river: e.river };
  rep.hexesFnv = fnv1a64('');
  mapsOut[e.id] = rep;
  webMaps[e.id] = { szerokoscQ: e.w, wysokoscR: e.h, hexes: {} };
}
for (const rep of [
  fillRep('e_ocean', 30, 24, () => 'm'),
  fillRep('e_shallow', 24, 20, () => 'p'),
  fillRep('e_mount', 20, 16, () => 'g'),
  fillRep('e_one', 16, 12, (q, r) => (q === 8 && r === 6 ? 'l' : 'm')),
  fillRep('e_islet3', 24, 18, (q, r) => (r === 9 && q >= 10 && q <= 12 ? 'l' : 'm')),
  fillRep('e_land', 30, 24, () => 'l'),
  fillRep('e_land_big', 64, 48, () => 'r'),
  fillRep('e_polar', 30, 24, () => 'o'),
  fillRep('e_strip', 60, 12, (q, r) => (r >= 4 && r <= 7 ? 'l' : 'm')),
  fillRep('e_two_islands', 48, 24, (q, r) => ((q - 10) ** 2 + (r - 12) ** 2 <= 49 || (q - 36) ** 2 + (r - 12) ** 2 <= 49 ? 'l' : 'm')),
  fillRep('e_land_big_sh', 90, 80, (q, r) => (q < 8 || r < 8 || q > 81 || r > 71 ? 'm' : 'l')),
  fillRep('e_strip_big', 130, 80, (q, r) => (r >= 34 && r <= 44 && q >= 4 && q <= 125 ? 'l' : 'm')),
  fillRep('e_two_big', 160, 90, (q, r) => ((q - 40) ** 2 + (r - 45) ** 2 <= 625 || (q - 120) ** 2 + (r - 45) ** 2 <= 625 ? 'l' : 'm')),
]) {
  mapsOut[rep.id] = rep;
  webMaps[rep.id] = webMapFromRep(rep);
}
const MAP_IDS = Object.keys(mapsOut);

// ---------------------------------------------------------------------------
// Sygnatury wynikow
// ---------------------------------------------------------------------------
const clusterOut = (k) => ({
  typIndex: k.typIndex,
  typ: k.typ,
  centrum: P(k.centrum),
  miasta: k.miasta.map((m) => [m.q, m.r, m.isCapital]),
  pending: k.pendingStateSlots === undefined ? null : PL(k.pendingStateSlots),
  growth: !('growthSlot' in k) || k.growthSlot === undefined ? 'absent' : k.growthSlot === null ? 'null' : P(k.growthSlot),
});

function seaSignature(seaMap, hexes) {
  const parts = [];
  for (const h of hexes) {
    const k = `${h.coords.q},${h.coords.r}`;
    parts.push(seaMap.has(k) ? `${k}=${seaMap.get(k)}` : `${k}=-`);
  }
  return { n: seaMap.size, fnv: fnv1a64(parts.join(';')) };
}

function placementOut(p, mapId) {
  const out = {
    rozmiar: p.rozmiarMapy,
    aktywne: p.aktywneTypy,
    requested: p.requestedTypy === undefined ? null : p.requestedTypy,
    minDyst: p.minDystansMiastaPanstwa,
    maxDyst: p.maxDystansMiastaPanstwa,
    minObcy: p.minDystansObcyOdGracza,
    playerTypIndex: p.playerTypIndex,
    klastry: p.klastry.map(clusterOut),
    cache: null,
  };
  if (p.spawnCache) {
    const sc = p.spawnCache;
    const masses = sc.landCache.masses;
    out.cache = {
      ladoweN: sc.ladowe.length,
      ladoweFnv: digestHexes(sc.ladowe),
      massesN: masses.length,
      massSizes: masses.map((m) => m.length),
      massesFnv: fnv1a64(masses.map((m) => digestHexes(m)).join('|')),
      sea: seaSignature(sc.seaDist, Object.values(webMaps[mapId].hexes)),
      seaEqualsField: JSON.stringify([...sc.seaDist]) === JSON.stringify([...buildSeaDistanceField(webMaps[mapId].hexes)]),
    };
  }
  return out;
}

function planOut(plan, mapId) {
  return {
    playerStartHex: P(plan.playerStartHex),
    playerStartCityName: plan.playerStartCityName,
    slots: plan.slots.map((s) => ({
      ownerId: s.ownerId,
      q: s.q,
      r: s.r,
      nazwa: s.nazwaMiasta,
      typ: s.typ,
      sameRival: s.isSameTypeRival,
      playerCap: s.isPlayerCapital,
      clusterCap: s.isClusterCapital === undefined ? null : s.isClusterCapital,
    })),
    foreign: plan.foreignTypeClusters.map((g) => ({ typ: g.typ, ownerIds: g.ownerIds, positions: PL(g.positions) })),
    pendingRivals: plan.pendingSameTypeRivals,
    pendingHexes: PL(plan.pendingSameTypeRivalHexes),
    clusterCapIds: plan.clusterCapitalOwnerIds,
    pendingOwnerIds: plan.pendingSameTypeRivalOwnerIds,
    placement: placementOut(plan.placement, mapId),
  };
}

// ---------------------------------------------------------------------------
// Przypadki
// ---------------------------------------------------------------------------
const cases = {};
const meta = {
  pin: 'edb8fb56',
  node: process.version,
  clustersLines,
  spawnLines,
};
// ROSTER_KLUCZE jest prywatne w webie: czytamy je z TEKSTU clusters.ts (clusters.ts:69-85), nie przepisujemy.
const ROSTER = (() => {
  const text = readFileSync(srcPath('map/clusters.ts'), 'utf8');
  const m = /const ROSTER_KLUCZE: string\[\] = \[([\s\S]*?)\];/.exec(text);
  if (!m) throw new Error('brak ROSTER_KLUCZE w clusters.ts');
  return [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]);
})();
const EPOCHS = ['kamien', 'braz', 'zelazo'];
const SEEDS = [undefined, 0, 1, 7, 13, 42, 99, 123, 2024, 31337, 65535, 1000003, 2147483647, 4294967295];
const SEEDS_DEF = SEEDS.filter((s) => s !== undefined);

cases.seaField = MAP_IDS.map((id) => {
  const hexes = Object.values(webMaps[id].hexes);
  return { map: id, sea: seaSignature(buildSeaDistanceField(webMaps[id].hexes), hexes) };
});

// --- compute ---
function webOpts(spec) {
  const o = {};
  if (spec.seed !== undefined) o.seed = spec.seed;
  if (spec.aktywneTypy !== undefined) o.aktywneTypy = spec.aktywneTypy;
  if (spec.playerTyp !== undefined) o.playerTyp = spec.playerTyp;
  if (spec.minDystans !== undefined) o.minDystans = spec.minDystans;
  if (spec.rywale !== undefined) o.rywaleNaKlaster = spec.rywale;
  if (spec.minDystKl !== undefined) o.minDystansKlastrow = spec.minDystKl;
  if (spec.epoch !== undefined) o.startEpochId = spec.epoch;
  if (spec.roster) o.civRoster = civs.cywilizacje;
  if (spec.preferred !== undefined) o.preferredCivIds = spec.preferred;
  return o;
}

let noDiagSame = 0;
function runCompute(id, spec, checkNoDiag = false) {
  const row = { map: id, spec };
  let res;
  try {
    res = quiet(() => C.computeClusters(webMaps[id], webOpts(spec)));
  } catch (e) {
    row.threw = true;
    row.error = String(e && e.message ? e.message : e).slice(0, 120);
    // wynik, ktory web zbudowal PRZED rzuceniem w dzienniku (kopia z jednym tokenem zmienionym)
    const nd = quiet(() => CND.computeClusters(webMaps[id], webOpts(spec)));
    row.noDiagResult = placementOut(nd, id);
    return row;
  }
  row.threw = false;
  row.result = placementOut(res, id);
  if (checkNoDiag) {
    const nd = quiet(() => CND.computeClusters(webMaps[id], webOpts(spec)));
    const a = JSON.stringify(row.result);
    const b = JSON.stringify(placementOut(nd, id));
    if (a !== b) throw new Error(`kopia bez dziennika rozni sie od oryginalu: ${id} ${JSON.stringify(spec)}`);
    row.noDiagSame = true;
    noDiagSame++;
  }
  return row;
}

function randomSpec(big) {
  const spec = {};
  const sd = pick(SEEDS);
  if (sd !== undefined) spec.seed = sd;
  if (rnd() < 0.5) spec.rywale = pick([0, 1, 2, 3, 4, 6, 9, 12]);
  else if (rnd() < 0.3) spec.rywale = 9;
  if (rnd() < 0.35) spec.aktywneTypy = pick(big ? [3, 5, 6, 8, 10, 12] : [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20]);
  if (rnd() < 0.45) spec.playerTyp = pick(ROSTER.concat(['nieznany', 'inkowie', 'zulusi']));
  if (rnd() < 0.2) spec.minDystans = pick([3, 4, 5, 6, 8]);
  if (rnd() < 0.2) spec.minDystKl = pick([0, 4, 6, 10, 12, 16, 20]);
  const ep = rnd();
  if (ep < 0.35) {
    spec.epoch = pick(EPOCHS);
    spec.roster = true;
  } else if (ep < 0.42) {
    spec.roster = true; // roster bez epoki => ignorowany
  } else if (ep < 0.46) {
    spec.epoch = pick(EPOCHS); // epoka bez rosteru => ignorowana
  } else if (ep < 0.49) {
    spec.epoch = 'xyz'; // epoka nieznana
    spec.roster = true;
  }
  if (rnd() < 0.25) {
    const n = ri(0, 6);
    const pref = [];
    for (let i = 0; i < n; i++) pref.push(pick(ROSTER.concat(['nieznany', ''])));
    spec.preferred = pref;
  }
  return spec;
}

const SMALL_IDS = MAP_IDS.filter((id) => !id.startsWith('b_') && !id.startsWith('r_') && !id.startsWith('e_') && !id.startsWith('m_') && id !== 's_c80' && id !== 's_pang80');
const MID_IDS = ['s_c80', 's_pang80', 's_hole64', 's_pang64', 's_arch50', 's_c50'].concat(MAP_IDS.filter((id) => id.startsWith('m_')));
const BIG_IDS = MAP_IDS.filter((id) => id.startsWith('b_') || id.startsWith('r_'));
const EDGE_IDS = MAP_IDS.filter((id) => id.startsWith('e_'));

cases.compute = [];
// domyslne wejscie (bez opts) na kazdej mapie
for (const id of MAP_IDS) cases.compute.push(runCompute(id, {}, !id.startsWith('b_') && !id.startsWith('r_')));
// losowe na malych/srednich
for (let i = 0; i < 230; i++) cases.compute.push(runCompute(pick(SMALL_IDS), randomSpec(false), i % 4 === 0));
for (let i = 0; i < 130; i++) cases.compute.push(runCompute(pick(MID_IDS), randomSpec(false), i % 5 === 0));
for (let i = 0; i < 80; i++) cases.compute.push(runCompute(pick(BIG_IDS), randomSpec(true)));
for (let i = 0; i < 60; i++) cases.compute.push(runCompute(pick(EDGE_IDS), randomSpec(false)));
// zakres typow na kazdej mapie (wymusza dopelnienia i dropy)
for (const id of SMALL_IDS.concat(MID_IDS)) {
  for (const n of [2, 5, 8, 10]) {
    cases.compute.push(runCompute(id, { seed: pick(SEEDS_DEF), aktywneTypy: n, rywale: pick([0, 3, 9]) }));
  }
}

// --- spawn ---
function runSpawn(id, spec) {
  const input = {
    map: webMaps[id],
    civs,
    seed: spec.seed,
    playerTyp: spec.playerTyp,
    rywaleNaKlaster: spec.rywale,
  };
  if (spec.aktywneTypy !== undefined) input.aktywneTypy = spec.aktywneTypy;
  if (spec.epoch !== undefined) input.startEpochId = spec.epoch;
  if (spec.pools) input.cityNamesPools = pools;
  if (spec.preferred !== undefined) input.preferredCivIds = spec.preferred;
  const row = { map: id, spec };
  let res;
  try {
    res = quiet(() => S.buildClusterSpawnPlan(input));
  } catch (e) {
    row.threw = true;
    row.error = String(e && e.message ? e.message : e).slice(0, 120);
    return row;
  }
  row.threw = false;
  row.result = planOut(res, id);
  return row;
}

function randomSpawnSpec(big) {
  const spec = {
    seed: pick(SEEDS_DEF.concat([ri(1, 1e9), ri(1, 1e9)])),
    playerTyp: pick(ROSTER.concat(['nieznany'])),
    rywale: pick([0, 1, 2, 3, 4, 6, 9]),
    pools: rnd() < 0.5,
  };
  if (rnd() < 0.3) spec.aktywneTypy = pick(big ? [3, 5, 6, 8, 10] : [2, 3, 4, 5, 6, 7, 8, 10, 12]);
  if (rnd() < 0.35) spec.epoch = pick(EPOCHS.concat(['xyz']));
  if (rnd() < 0.2) {
    const n = ri(0, 5);
    const pref = [];
    for (let i = 0; i < n; i++) pref.push(pick(ROSTER.concat(['nieznany'])));
    spec.preferred = pref;
  }
  return spec;
}

cases.spawn = [];
for (let i = 0; i < 170; i++) cases.spawn.push(runSpawn(pick(SMALL_IDS), randomSpawnSpec(false)));
for (let i = 0; i < 80; i++) cases.spawn.push(runSpawn(pick(MID_IDS), randomSpawnSpec(false)));
for (let i = 0; i < 70; i++) cases.spawn.push(runSpawn(pick(BIG_IDS), randomSpawnSpec(true)));
for (let i = 0; i < 25; i++) cases.spawn.push(runSpawn(pick(EDGE_IDS), randomSpawnSpec(false)));
for (const id of SMALL_IDS.concat(MID_IDS)) {
  cases.spawn.push(runSpawn(id, { seed: pick(SEEDS_DEF), playerTyp: pick(ROSTER), rywale: 4, pools: true, aktywneTypy: pick([5, 8, 10]) }));
}

const out = { pin: 'edb8fb56', meta, maps: mapsOut, cases };
writeFileSync(outArg, JSON.stringify(out));
const counts = Object.fromEntries(Object.entries(cases).map(([k, v]) => [k, v.length]));
const threwCompute = cases.compute.filter((c) => c.threw).length;
const threwSpawn = cases.spawn.filter((c) => c.threw).length;
origLog('OK ' + JSON.stringify({ maps: MAP_IDS.length, meta, counts, threwCompute, threwSpawn, noDiagSame }));
