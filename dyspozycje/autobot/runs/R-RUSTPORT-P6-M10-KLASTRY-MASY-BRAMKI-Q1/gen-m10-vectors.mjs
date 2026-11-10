// P6.M10 - wektory z URUCHOMIONEGO weba (pin edb8fb56) dla zakresu klastrow "masy i bramki":
//   gra/src/map/clusters.ts   :59-126, 145-167, 176-1345
//   gra/src/map/startScoring.ts :1-142
//
// Metoda (bez przepisywania logiki):
//  - clusters.ts: kopia PLIKU weba z dopisanym slowem `export` przed prywatnymi deklaracjami
//    najwyzszego poziomu (function/const/type/interface). Generator WERYFIKUJE, ze po wycieciu
//    wstawionych `export ` kopia jest bajt w bajt rowna oryginalowi (drift => blad). Kopia lezy
//    obok oryginalu w <WEB_ROOT>/gra/src/map/, wiec importy wzgledne dzialaja bez zmian.
//  - startScoring.ts: prawdziwy modul (wszystkie uzywane symbole sa eksportowane).
//  - mapy: PRAWDZIWY generateMap (5 specyfikacji jak P6.1C/M09) + mapy syntetyczne z jawnym
//    ziarnem (wiele mas, wyspy, rzeki, gory, polarny, plytkie morze).
//  - rand: mulberry32(ziarno) z licznikiem wywolan (porownujemy zuzycie strumienia).
//  - sortowanie V8: osobna kategoria wektorow (komparatory z rand i bez).
//
// Uzycie:
//   node --experimental-transform-types --no-warnings --import ./m10-loader-register.mjs \
//     ./gen-m10-vectors.mjs <WEB_ROOT> <OUT_JSON>
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

// ---------------------------------------------------------------------------
// Kopia clusters.ts z `export` przed prywatnymi deklaracjami (weryfikowana)
// ---------------------------------------------------------------------------
const clustersOrig = readFileSync(srcPath('map/clusters.ts'), 'utf8');
const origLines = clustersOrig.split('\n');
let insertedExports = 0;
const exportedLines = origLines.map((line) => {
  if (/^(function |const |type |interface )/.test(line)) {
    insertedExports++;
    return 'export ' + line;
  }
  return line;
});
const stubText = exportedLines.join('\n');
// weryfikacja: po usunieciu wstawek kopia == oryginal
const roundTrip = stubText
  .split('\n')
  .map((l, i) => (l !== origLines[i] && l === 'export ' + origLines[i] ? origLines[i] : l))
  .join('\n');
if (roundTrip !== clustersOrig) throw new Error('kopia clusters.ts rozni sie od oryginalu poza `export `');
const stubPath = srcPath('map/clusters.m10-exports.ts');
writeFileSync(stubPath, stubText);

const C = await import(pathToFileURL(stubPath).href);
const SS = await import(src('map/startScoring.ts'));
const GH = await import(src('map/gen-helpers.ts'));
const { mulberry32, buildSeaDistanceField } = GH;
const { generateMap } = await import(src('map/generator.ts'));
const { loadGameData } = await import(src('data/loader.ts'));
const data = loadGameData();

// ---------------------------------------------------------------------------
// Narzedzia
// ---------------------------------------------------------------------------
const f = (x) => (Object.is(x, -0) ? '-0' : String(x)); // f64 jako TEKST (Infinity/-Infinity/NaN tez)
const P = (h) => [h.q, h.r];
const PL = (arr) => arr.map(P);
const H = ([q, r]) => ({ q, r });
const fnv1a64 = (s) => {
  let h = 0xcbf29ce484222325n;
  for (const b of Buffer.from(s, 'utf8')) {
    h ^= BigInt(b);
    h = (h * 0x100000001b3n) & 0xffffffffffffffffn;
  }
  return h.toString(16).padStart(16, '0');
};
const mkRand = (seed) => {
  const g = mulberry32(seed);
  let n = 0;
  const fn = () => {
    n++;
    return g();
  };
  fn.count = () => n;
  return fn;
};
const gr = mulberry32(20261022);
const rnd = () => gr();
const ri = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const sampleN = (arr, n) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, Math.min(n, a.length));
};

// ---------------------------------------------------------------------------
// Mapy: teren jako kod 1-znakowy
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
  const canon = hexes.map((hx) => `${hx.coords.q},${hx.coords.r},${hx.terenBazowy}`).join(';');
  const sd = buildSeaDistanceField(map.hexes);
  const sea = hexes.map((hx) => (sd.has(`${hx.coords.q},${hx.coords.r}`) ? sd.get(`${hx.coords.q},${hx.coords.r}`) : -1));
  return { id, source, w, h, terrain, river, sea, hexesFnv: fnv1a64(canon) };
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

const REAL_SPECS = [
  { id: 'k42', w: 36, h: 28, seed: 42, typ: 'kontynenty' },
  { id: 'k7', w: 36, h: 28, seed: 7, typ: 'kontynenty' },
  { id: 'p123', w: 36, h: 28, seed: 123, typ: 'pangea' },
  { id: 'k3small', w: 24, h: 18, seed: 3, typ: 'kontynenty' },
  { id: 'w5', w: 40, h: 30, seed: 5, typ: 'wyspy' },
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
  // plytkie morze przy brzegu
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
  const rep = { id, source: 'synthetic', w, h, terrain: terrain.join(''), river };
  const web = webMapFromRep(rep);
  const sd = buildSeaDistanceField(web.hexes);
  rep.sea = Object.values(web.hexes).map((hx) => (sd.has(`${hx.coords.q},${hx.coords.r}`) ? sd.get(`${hx.coords.q},${hx.coords.r}`) : -1));
  rep.hexesFnv = fnv1a64(
    Object.values(web.hexes)
      .map((hx) => `${hx.coords.q},${hx.coords.r},${hx.terenBazowy}`)
      .join(';'),
  );
  return rep;
}

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

// Mapa symetryczna wzgledem srodka (inwersja (q,r) -> (w-1-q, h-1-r), w i h nieparzyste => srodek
// calkowity): dwa identyczne bloki ladu daja REMISY punktacji startu i odleglosci od srodka
// (test kolejnosci/remisow w findBestPlayerStartHex i sortowaniach).
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
  const rep = { id, source: 'synthetic', w, h, terrain: terrain.join(''), river: river.join('') };
  const web = webMapFromRep(rep);
  const sd = buildSeaDistanceField(web.hexes);
  rep.sea = Object.values(web.hexes).map((hx) => (sd.has(`${hx.coords.q},${hx.coords.r}`) ? sd.get(`${hx.coords.q},${hx.coords.r}`) : -1));
  rep.hexesFnv = fnv1a64(
    Object.values(web.hexes)
      .map((hx) => `${hx.coords.q},${hx.coords.r},${hx.terenBazowy}`)
      .join(';'),
  );
  return rep;
}

const mapsOut = {};
const webMaps = {};
for (const s of REAL_SPECS) {
  const m = quiet(() => generateMap(s.w, s.h, s.seed, s.typ));
  webMaps[s.id] = m;
  mapsOut[s.id] = repFromWebMap(s.id, 'generateMap', m);
  mapsOut[s.id].spec = { w: s.w, h: s.h, seed: s.seed, typ: s.typ };
}
for (const [id, w, h, seed, kind] of SYNTH_SPECS) {
  const rep = synthRep(id, w, h, seed, kind);
  mapsOut[id] = rep;
  webMaps[id] = webMapFromRep(rep);
}
{
  const rep = mirrorRep('s_mirror', 41, 21, 77);
  mapsOut[rep.id] = rep;
  webMaps[rep.id] = webMapFromRep(rep);
}
const MAP_IDS = Object.keys(mapsOut);

// pomocnicze per mapa
const seaMapOf = (id) => {
  const rep = mapsOut[id];
  const m = new Map();
  rep.sea.forEach((d, i) => {
    if (d >= 0) m.set(`${i % rep.w},${Math.floor(i / rep.w)}`, d);
  });
  return m;
};
const ladoweOf = (id) =>
  Object.values(webMaps[id].hexes)
    .filter((h) => C.isSpawnHabitableTerrain(h.terenBazowy))
    .map((h) => ({ q: h.coords.q, r: h.coords.r }));
const foundableOf = (id) =>
  Object.values(webMaps[id].hexes)
    .filter((h) => h.terenBazowy !== 'morze' && h.terenBazowy !== 'plytkie_morze' && h.terenBazowy !== 'gory' && h.terenBazowy !== 'polarny')
    .map((h) => ({ q: h.coords.q, r: h.coords.r }));
const massesOf = (id) => C.groupHabitableMasses(ladoweOf(id));
const randHex = (id, margin = 3) => {
  const rep = mapsOut[id];
  return { q: ri(-margin, rep.w - 1 + margin), r: ri(-margin, rep.h - 1 + margin) };
};
const digestHexes = (list) => fnv1a64(list.map((h) => `${h.q},${h.r}`).join(';'));

// ---------------------------------------------------------------------------
// Przypadki
// ---------------------------------------------------------------------------
const cases = {};
const meta = {
  pin: 'edb8fb56',
  node: process.version,
  insertedExports,
  clustersLines: origLines.length,
};

// --- stale (clusters.ts:211-248 + wyprowadzone) ---
cases.consts = {
  MIN_MASS_HEXES_FOR_CENTER: C.MIN_MASS_HEXES_FOR_CENTER,
  MIN_MASS_HEXES_FOR_SPAWN: C.MIN_MASS_HEXES_FOR_SPAWN,
  MIN_DEVELOPMENT_HEX_PER_CIV: C.MIN_DEVELOPMENT_HEX_PER_CIV,
  SMALL_MASS_CAP_THRESHOLD: C.SMALL_MASS_CAP_THRESHOLD,
  DEVELOPMENT_SPACE_RADIUS: C.DEVELOPMENT_SPACE_RADIUS,
  ISLAND_FALLBACK_MASS_FRAC: f(C.ISLAND_FALLBACK_MASS_FRAC),
  FOREIGN_MASS_MIN_ABSOLUTE: C.FOREIGN_MASS_MIN_ABSOLUTE,
  FOREIGN_MASS_FRAC_OF_LARGEST: f(C.FOREIGN_MASS_FRAC_OF_LARGEST),
  LOCAL_LAND_DOMINANCE_FRAC: f(C.LOCAL_LAND_DOMINANCE_FRAC),
  REGION_MASS_DOMINANCE_FRAC: f(C.REGION_MASS_DOMINANCE_FRAC),
  LOCAL_LAND_DOMINANCE_RADIUS: C.LOCAL_LAND_DOMINANCE_RADIUS,
  PLAYER_START_MIN_MASS_HEXES: C.PLAYER_START_MIN_MASS_HEXES,
  PLAYER_START_MASS_MIN_ABSOLUTE: C.PLAYER_START_MASS_MIN_ABSOLUTE,
  ROSTER_KLUCZE: C.ROSTER_KLUCZE,
  START_REVEAL_RADIUS: SS.START_REVEAL_RADIUS,
};

// --- roster ---
{
  const rows = data.civs.cywilizacje.map((c) => ({ ikonaId: c.ikonaId, epokaWejscia: c.epokaWejscia, epokiStartowe: c.epokiStartowe }));
  const epochs = ['kamien', 'braz', 'zelazo', 'nieznana', '', undefined];
  const out = [];
  const synthRows = [];
  for (let i = 0; i < 40; i++) {
    const n = ri(0, 18);
    const rr = [];
    for (let j = 0; j < n; j++) {
      const row = {};
      if (rnd() < 0.9) row.ikonaId = rnd() < 0.85 ? pick(C.ROSTER_KLUCZE) : pick(['', 'obcy', 'x']);
      const t = rnd();
      if (t < 0.5) row.epokaWejscia = pick(['kamien', 'braz', 'zelazo', 'zly']);
      if (t > 0.3 && t < 0.8) row.epokiStartowe = Array.from({ length: ri(0, 3) }, () => pick(['kamien', 'braz', 'zelazo', 'x']));
      rr.push(row);
    }
    synthRows.push(rr);
  }
  const rosterCases = [{ name: 'civs.json', rows }, ...synthRows.map((rr, i) => ({ name: `synth${i}`, rows: rr })), { name: 'undefined', rows: undefined }];
  for (const rc of rosterCases) {
    for (const ep of epochs) {
      out.push({
        rosterName: rc.name,
        rows: rc.rows === undefined ? null : rc.rows,
        epoch: ep === undefined ? null : ep,
        result: C.rosterKluczeForStartEpoch(rc.rows, ep),
      });
    }
  }
  cases.rosterKluczeForStartEpoch = out;

  const reorder = [];
  const rosterVariants = [C.ROSTER_KLUCZE, C.ROSTER_KLUCZE.slice(0, 6), [], ['a', 'b', 'c', 'd'], ['a', '', 'b']];
  for (let i = 0; i < 200; i++) {
    const roster = pick(rosterVariants);
    let preferred;
    const t = rnd();
    if (t < 0.1) preferred = undefined;
    else if (t < 0.2) preferred = [];
    else {
      preferred = Array.from({ length: ri(1, 8) }, () => (rnd() < 0.15 ? pick(['', 'zzz', 'q']) : pick(roster.length ? roster : C.ROSTER_KLUCZE)));
    }
    reorder.push({ roster, preferred: preferred === undefined ? null : preferred, result: C.reorderRosterByPreference(roster, preferred) });
  }
  cases.reorderRosterByPreference = reorder;
}

// --- rozmiar mapy ---
{
  const dims = [];
  for (let w = 1; w <= 400; w += 37) for (let h = 1; h <= 400; h += 41) dims.push([w, h]);
  dims.push([60, 80], [61, 80], [100, 120], [168, 120], [120, 100], [250, 100], [251, 100], [0, 10]);
  for (const [a, b] of [
    [4799, 1],
    [4800, 1],
    [11999, 1],
    [12000, 1],
    [25199, 1],
    [25200, 1],
    [99999, 1],
    [100000, 1],
  ])
    dims.push([a, b]);
  cases.mapSizeLabel = dims.map(([w, h]) => ({ w, h, label: C.mapSizeLabel(w, h) }));
  cases.aktywneTypyFromSize = ['mala', 'srednia', 'duza', 'ogromna', 'super'].map((l) => ({ label: l, n: C.aktywneTypyFromSize(l) }));
}

// --- progi, capy, kwalifikacja mas ---
{
  const sizes = [];
  for (let i = 0; i <= 700; i += 1) sizes.push(i);
  cases.thresholds = sizes.map((n) => ({
    n,
    qualifying: C.qualifyingMassThreshold(n),
    foreign: C.foreignSpawnMassThreshold(n),
    cap: C.massTypeCap(n),
  }));
  const dummyMasses = (lens) => lens.map((n) => Array.from({ length: n }, (_, i) => ({ q: i, r: 0 })));
  const lensCases = [[], [100], [5], [200, 100], [500, 80, 40], [300, 300, 30], [900, 90, 89, 91], [60, 40], [1000, 100, 90, 89, 12], [150, 150, 150], [95, 95]];
  for (let i = 0; i < 160; i++) {
    const k = ri(0, 7);
    const lens = Array.from({ length: k }, () => pick([ri(12, 60), ri(60, 200), ri(200, 700), ri(800, 1500)]));
    lens.sort((a, b) => (rnd() < 0.2 ? 0 : b - a));
    lensCases.push(lens);
  }
  cases.massQualifies = [];
  cases.allocate = [];
  cases.qualifyingIndices = [];
  for (const lens of lensCases) {
    const masses = dummyMasses(lens);
    for (let i = 0; i < lens.length; i++) {
      cases.massQualifies.push({ lens, i, size: lens[i], result: C.massQualifiesForForeignSpawn(lens[i], masses) });
    }
    cases.massQualifies.push({ lens, i: -1, size: 77, result: C.massQualifiesForForeignSpawn(77, masses) });
    cases.qualifyingIndices.push({ lens, result: C.qualifyingMassIndicesForSpawn(masses) });
    for (const n of [-1, 0, 1, 2, 3, 4, 5, 7, 10, 14]) {
      cases.allocate.push({ lens, n, result: quiet(() => C.allocateTypyToMasses(n, masses)) });
    }
  }
}

// --- izHabitable ---
cases.isSpawnHabitable = ['laka', 'rownina', 'wzgorza', 'gory', 'plytkie_morze', 'morze', 'pustynia', 'polarny', 'inne', ''].map((t) => ({
  teren: t,
  result: C.isSpawnHabitableTerrain(t),
}));

// --- masy, cache, dominacja ---
{
  cases.groupMasses = [];
  cases.massCache = [];
  const fixtures = [];
  for (const id of MAP_IDS) {
    fixtures.push({ name: `${id}:habitable`, list: ladoweOf(id) });
    fixtures.push({ name: `${id}:foundable`, list: foundableOf(id) });
    const shuffled = sampleN(ladoweOf(id), 100000);
    fixtures.push({ name: `${id}:shuffled`, list: shuffled });
  }
  fixtures.push({ name: 'empty', list: [] });
  fixtures.push({ name: 'single', list: [{ q: 3, r: 3 }] });
  fixtures.push({ name: 'dups', list: [...ladoweOf('s_small'), ...ladoweOf('s_small').slice(0, 30)] });
  fixtures.push({ name: 'neg', list: ladoweOf('s_small').map((h) => ({ q: h.q - 30, r: h.r - 20 })) });
  for (const fx of fixtures) {
    const masses = C.groupHabitableMasses(fx.list);
    cases.groupMasses.push({
      name: fx.name,
      input: PL(fx.list),
      count: masses.length,
      sizes: masses.map((m) => m.length),
      fnv: fnv1a64(masses.map((m) => digestHexes(m)).join('|')),
      first: masses.length ? PL(masses[0].slice(0, 5)) : [],
    });
    const cache = C.createMassLandCache(fx.list);
    const cache2 = C.massLandCacheFromMasses(masses);
    cases.massCache.push({
      name: fx.name,
      indexSize: cache.hexIndex.size,
      indexFnv: fnv1a64([...cache.hexIndex.entries()].map(([k, v]) => `${k}=${v}`).join(';')),
      setSizes: cache.massSets.map((s) => s.size),
      sameAsFromMasses: JSON.stringify([...cache.hexIndex]) === JSON.stringify([...cache2.hexIndex]),
    });
  }
  cases.regionDominance = [];
  for (const id of MAP_IDS) {
    const masses = massesOf(id);
    const lad = ladoweOf(id);
    for (let i = 0; i < 12; i++) {
      const region = sampleN(lad, ri(0, 200));
      const center = rnd() < 0.8 && lad.length ? pick(lad) : randHex(id);
      const r = C.regionMassDominance(region, center, masses);
      cases.regionDominance.push({
        map: id,
        region: PL(region),
        center: P(center),
        ratio: f(r.ratio),
        centerMassIndex: r.centerMassIndex,
        dominantMassIndex: r.dominantMassIndex,
      });
    }
  }
}

// --- lokalny lad, przestrzen rozwoju, bramki masy ---
{
  cases.localLand = [];
  cases.localGate = [];
  cases.devSpace = [];
  cases.massSizeAt = [];
  cases.playerMassGate = [];
  for (const id of MAP_IDS) {
    const map = webMaps[id];
    const masses = massesOf(id);
    const cache = C.massLandCacheFromMasses(masses);
    for (let i = 0; i < 40; i++) {
      const h = randHex(id);
      const radius = pick([undefined, undefined, 1, 2, 3, 5, 0]);
      const r = C.localLandFraction(map, h.q, h.r, radius);
      cases.localLand.push({ map: id, q: h.q, r: h.r, radius: radius === undefined ? null : radius, ratio: f(r.ratio), landCount: r.landCount, totalCount: r.totalCount });
      const minFrac = pick([undefined, 0.5, 0.7, 0.9, 1, 0]);
      cases.localGate.push({
        map: id,
        q: h.q,
        r: h.r,
        minFrac: minFrac === undefined ? null : f(minFrac),
        radius: radius === undefined ? null : radius,
        result: C.passesLocalLandGate(map, h.q, h.r, minFrac, radius),
      });
    }
    for (let i = 0; i < 50; i++) {
      const h = rnd() < 0.7 && ladoweOf(id).length ? pick(ladoweOf(id)) : randHex(id);
      const radius = pick([undefined, undefined, 2, 6, 9, 0]);
      const viaCache = rnd() < 0.5;
      cases.devSpace.push({
        map: id,
        q: h.q,
        r: h.r,
        radius: radius === undefined ? null : radius,
        form: viaCache ? 'cache' : 'masses',
        result: C.developmentSpaceScore(map, h.q, h.r, viaCache ? cache : masses, radius),
      });
      const viaCache2 = rnd() < 0.5;
      cases.massSizeAt.push({ map: id, q: h.q, r: h.r, form: viaCache2 ? 'cache' : 'masses', result: C.massSizeAtHex(h.q, h.r, viaCache2 ? cache : masses) });
      const viaCache3 = rnd() < 0.5;
      cases.playerMassGate.push({ map: id, q: h.q, r: h.r, form: viaCache3 ? 'cache' : 'masses', result: C.passesPlayerStartMassGate(map, h.q, h.r, viaCache3 ? cache : masses) });
    }
  }
  // pelne przejscie po jednej mapie: wszystkie hexy
  cases.playerMassGateAll = {};
  for (const id of ['k42', 's_c30', 's_arch40']) {
    const map = webMaps[id];
    const masses = massesOf(id);
    let bits = '';
    for (const hx of Object.values(map.hexes)) bits += C.passesPlayerStartMassGate(map, hx.coords.q, hx.coords.r, masses) ? '1' : '0';
    cases.playerMassGateAll[id] = bits;
  }
}

// --- hooki M11 (wektory dla testowej implementacji cechy) ---
{
  const hk = [];
  for (let i = 0; i < 400; i++) {
    const q = ri(-5, 40);
    const r = ri(-5, 40);
    const midQ = pick([0, 17.5, 20, 33.5, 5.25]);
    const midR = pick([0, 13.5, 20, 30, 7.75]);
    hk.push({ kind: 'quad', q, r, midQ: f(midQ), midR: f(midR), result: C.landQuadrantIndex(q, r, midQ, midR) });
  }
  for (let n = -1; n <= 12; n++) hk.push({ kind: 'minQuarters', n, result: C.minimumSpreadQuartersRequired(n) });
  for (let i = 0; i < 200; i++) {
    const sea = pick([0, 1, 4, 9, 10, 12, 15, 17, 30, 0.5, 11.5]);
    const mn = pick([0, 4, 7, 10, 12, 14, -1]);
    const mx = pick([0, 9, 12, 15, 19, 5]);
    hk.push({ kind: 'bandPenalty', sea: f(sea), min: f(mn), max: f(mx), result: f(C.capitalSeaBandPenalty(sea, mn, mx)) });
  }
  for (let i = 0; i < 150; i++) {
    const centers = Array.from({ length: ri(0, 8) }, () => ({ q: ri(0, 40), r: ri(0, 30) }));
    const midQ = pick([10, 20, 17.5]);
    const midR = pick([10, 15, 14.5]);
    const counts = C.countCentersPerQuadrant(centers, midQ, midR);
    hk.push({ kind: 'countPerQuad', centers: PL(centers), midQ: f(midQ), midR: f(midR), result: counts });
    const nNeeded = ri(2, 10);
    const pref = C.preferredQuadrantsForSpread(counts, nNeeded);
    hk.push({ kind: 'preferred', counts, nNeeded, result: pref === null ? null : [...pref].sort((a, b) => a - b) });
    const bbox = { minQ: 0, maxQ: ri(10, 60), minR: 0, maxR: ri(10, 50) };
    const sp = C.clusterCenterQuadrantSpread(centers, bbox);
    hk.push({ kind: 'spread', centers: PL(centers), bbox, result: { occupiedQuadrants: sp.occupiedQuadrants, qSpan: f(sp.qSpan), rSpan: f(sp.rSpan) } });
    const c = { q: ri(0, 40), r: ri(0, 30) };
    const msd = C.minCapitalSeparationDistance(c, centers);
    hk.push({ kind: 'minSep', c: P(c), others: PL(centers), result: msd === null ? null : f(msd) });
  }
  const sd = new Map([['1,1', 4], ['2,2', 0], ['5,5', 12]]);
  for (const [q, r, m] of [[1, 1, 4], [1, 1, 5], [2, 2, 0], [9, 9, 0], [9, 9, 1], [5, 5, 12], [5, 5, 13]]) {
    hk.push({ kind: 'seaGate', sea: [[1, 1, 4], [2, 2, 0], [5, 5, 12]], q, r, min: m, at: C.seaDistAt(sd, q, r), result: C.passesMinSeaDistGate(sd, q, r, m) });
  }
  cases.hooks = hk;
}

// --- kandydaci / sortowania / wybory ---
const mkCandidate = (id, h, seaMap, minSeaDist) => {
  const map = webMaps[id];
  const masses = massesOf(id);
  const cache = C.massLandCacheFromMasses(masses);
  return {
    h,
    land: C.localLandFraction(map, h.q, h.r),
    dev: C.developmentSpaceScore(map, h.q, h.r, cache),
    sea: seaMap ? C.seaDistAt(seaMap, h.q, h.r) : minSeaDist,
  };
};
const candOut = (c) => [c.h.q, c.h.r, f(c.land.ratio), c.land.landCount, c.land.totalCount, c.dev, f(c.sea)];
const candIn = (a) => ({ h: { q: a[0], r: a[1] }, land: { ratio: Number(a[2]), landCount: a[3], totalCount: a[4] }, dev: a[5], sea: Number(a[6]) });
const seaOut = (m) => (m ? [...m.entries()].map(([k, v]) => [...k.split(',').map(Number), v]) : null);
const bboxOf = (list) => ({
  minQ: Math.min(...list.map((h) => h.q)),
  maxQ: Math.max(...list.map((h) => h.q)),
  minR: Math.min(...list.map((h) => h.r)),
  maxR: Math.max(...list.map((h) => h.r)),
});
const centerOf = (id) => ({ q: (mapsOut[id].w - 1) / 2, r: (mapsOut[id].h - 1) / 2 });
const MC_VARIANTS = [null, [0, 0], [5, 3], [17.5, 13.5]];
const SORT_MAPS = MAP_IDS.filter((id) => ladoweOf(id).length > 0);
const SEA_VARIANTS = [
  { sea: false, min: 0, max: 0 },
  { sea: true, min: 0, max: 0 },
  { sea: true, min: 4, max: 9 },
  { sea: true, min: 7, max: 12 },
  { sea: true, min: 10, max: 15 },
];

// sortSpawnLandCandidates
cases.sortSpawn = [];
for (let i = 0; i < 160; i++) {
  const id = pick(SORT_MAPS);
  const lad = ladoweOf(id);
  const sv = pick(SEA_VARIANTS);
  const seaMap = sv.sea ? seaMapOf(id) : null;
  const subset = sampleN(lad, ri(0, 60));
  const cands = subset.map((h) => mkCandidate(id, h, seaMap, sv.min));
  const mcv = pick(MC_VARIANTS);
  const mapCenter = mcv ? { q: mcv[0], r: mcv[1] } : centerOf(id);
  const seaFirst = rnd() < 0.3;
  const arr = cands.map((c) => ({ ...c }));
  C.sortSpawnLandCandidates(arr, mapCenter, seaFirst, sv.min, sv.max);
  cases.sortSpawn.push({ map: id, mapCenter: [f(mapCenter.q), f(mapCenter.r)], seaFirst, minSea: sv.min, maxSea: sv.max, cands: cands.map(candOut), order: arr.map((c) => [c.h.q, c.h.r]) });
}

// sortSpawnCandidatesWithSpreadBias
cases.sortSpread = [];
for (let i = 0; i < 100; i++) {
  const id = pick(SORT_MAPS);
  const lad = ladoweOf(id);
  const sv = pick(SEA_VARIANTS);
  const seaMap = sv.sea ? seaMapOf(id) : null;
  const subset = sampleN(lad, ri(0, 60));
  const cands = subset.map((h) => mkCandidate(id, h, seaMap, sv.min));
  const prior = sampleN(lad, ri(0, 5));
  const bbox = bboxOf(lad);
  const spreadN = pick([2, 3, 4, 5, 6, 8, 10]);
  const mapCenter = centerOf(id);
  const seaFirst = rnd() < 0.3;
  const arr = cands.map((c) => ({ ...c }));
  C.sortSpawnCandidatesWithSpreadBias(arr, mapCenter, prior, bbox, spreadN, seaFirst, sv.min, sv.max);
  cases.sortSpread.push({
    map: id,
    mapCenter: [f(mapCenter.q), f(mapCenter.r)],
    prior: PL(prior),
    bbox,
    spreadN,
    seaFirst,
    minSea: sv.min,
    maxSea: sv.max,
    cands: cands.map(candOut),
    order: arr.map((c) => [c.h.q, c.h.r]),
  });
}

// pickTiedSpawnLandCandidate
cases.pickTied = [];
for (let i = 0; i < 120; i++) {
  const id = pick(SORT_MAPS);
  const lad = ladoweOf(id);
  const seaMap = seaMapOf(id);
  const subset = sampleN(lad, ri(0, 30));
  const cands = subset.map((h) => mkCandidate(id, h, seaMap, 0));
  // sortuj jak w grze, zeby top byl sensowny; czesc przypadkow bez sortowania
  if (rnd() < 0.7) C.sortSpawnLandCandidates(cands, centerOf(id));
  const seed = ri(1, 2 ** 31);
  const rand = mkRand(seed);
  const res = C.pickTiedSpawnLandCandidate(cands, rand);
  cases.pickTied.push({ cands: cands.map(candOut), seed, result: res ? P(res) : null, randCalls: rand.count() });
}

// playerStartCandidatesOnMasses
cases.playerCands = [];
for (const id of SORT_MAPS) {
  const map = webMaps[id];
  const cache = C.massLandCacheFromMasses(massesOf(id));
  for (const sv of [{ sea: false, min: 0 }, { sea: true, min: 0 }, { sea: true, min: 3 }, { sea: true, min: 6 }]) {
    for (const req of [true, false]) {
      const seaMap = sv.sea ? seaMapOf(id) : undefined;
      const res = C.playerStartCandidatesOnMasses(map, cache, seaMap, sv.min, req);
      cases.playerCands.push({ map: id, useSea: sv.sea, minSea: sv.min, requireSeaGate: req, count: res.length, fnv: fnv1a64(res.map((c) => candOut(c).join(',')).join(';')), first: res.slice(0, 3).map(candOut) });
    }
  }
}

// pickPlayerClusterCenter
cases.pickPlayer = [];
for (const id of SORT_MAPS) {
  const map = webMaps[id];
  const lad = ladoweOf(id);
  const masses = massesOf(id);
  for (const sv of [{ sea: false, min: 0 }, { sea: true, min: 2 }, { sea: true, min: 5 }, { sea: true, min: 9 }]) {
    for (const seed of [ri(1, 1e9), ri(1, 1e9)]) {
      const seaMap = sv.sea ? seaMapOf(id) : undefined;
      const rand = mkRand(seed);
      const form = rnd() < 0.5 ? 'cache' : 'masses';
      const res = C.pickPlayerClusterCenter(map, form === 'cache' ? C.massLandCacheFromMasses(masses) : masses, lad, centerOf(id), rand, seaMap, sv.min);
      cases.pickPlayer.push({ map: id, useSea: sv.sea, minSea: sv.min, seed, form, result: res ? P(res) : null, randCalls: rand.count() });
    }
  }
}

// pickBestLocalLandSpawn
cases.pickBestLocal = [];
for (let i = 0; i < 200; i++) {
  const id = pick(SORT_MAPS);
  const map = webMaps[id];
  const lad = ladoweOf(id);
  const cache = C.massLandCacheFromMasses(massesOf(id));
  const pool = sampleN(lad, ri(0, 120));
  const existing = sampleN(lad, ri(0, 3));
  const minDist = pick([2, 3, 5, 8]);
  const useSea = rnd() < 0.6;
  const minSea = pick([0, 2, 4, 8]);
  const seed = ri(1, 1e9);
  const withRand = rnd() < 0.7;
  const rand = withRand ? mkRand(seed) : undefined;
  const res = C.pickBestLocalLandSpawn(map, pool, existing, minDist, cache, rand, useSea ? seaMapOf(id) : undefined, minSea);
  cases.pickBestLocal.push({ map: id, pool: PL(pool), existing: PL(existing), minDist, useSea, minSea, seed, withRand, result: res ? P(res) : null, randCalls: rand ? rand.count() : 0 });
}

// assignVoronoiRegions + massCentroid
cases.voronoi = [];
cases.centroid = [];
for (let i = 0; i < 80; i++) {
  const id = pick(SORT_MAPS);
  const lad = sampleN(ladoweOf(id), ri(0, 300));
  const centers = sampleN(ladoweOf(id), ri(0, 6));
  let result;
  try {
    const regs = C.assignVoronoiRegions(lad, centers);
    result = { throws: false, sizes: regs.map((r) => r.length), fnv: fnv1a64(regs.map((r) => digestHexes(r)).join('|')) };
  } catch (e) {
    result = { throws: true, error: String(e.constructor.name) };
  }
  cases.voronoi.push({ map: id, ladowe: PL(lad), centers: PL(centers), ...result });
  const mass = sampleN(ladoweOf(id), ri(0, 200));
  const c = C.massCentroid(mass);
  cases.centroid.push({ mass: PL(mass), q: f(c.q), r: f(c.r) });
}

// pickCenterInMass / WithLandGate / Spread / OnLandPoolSpread
cases.pickCenterInMass = [];
cases.pickCenterGate = [];
cases.pickCenterSpread = [];
cases.pickCenterPool = [];
for (let i = 0; i < 160; i++) {
  const id = pick(SORT_MAPS);
  const map = webMaps[id];
  const lad = ladoweOf(id);
  const masses = massesOf(id);
  if (masses.length === 0) continue;
  const cache = C.massLandCacheFromMasses(masses);
  const mass = pick(masses);
  const existing = sampleN(lad, ri(0, 4));
  const minDist = pick([2, 4, 6, 9, 12]);
  const preferNear = rnd() < 0.5 ? pick(lad) : undefined;
  const seed = ri(1, 1e9);
  const withRand = rnd() < 0.7;
  const useSea = rnd() < 0.6;
  const minSea = pick([0, 2, 4, 8]);
  const seaMap = useSea ? seaMapOf(id) : undefined;

  {
    const rand = withRand ? mkRand(seed) : undefined;
    const res = C.pickCenterInMass(mass, existing, minDist, preferNear, rand);
    cases.pickCenterInMass.push({ map: id, massIndex: masses.indexOf(mass), massFnv: digestHexes(mass), existing: PL(existing), minDist, preferNear: preferNear ? P(preferNear) : null, seed, withRand, result: res ? P(res) : null, randCalls: rand ? rand.count() : 0 });
  }
  {
    const rand = withRand ? mkRand(seed) : undefined;
    const res = C.pickCenterInMassWithLandGate(map, mass, existing, minDist, cache, preferNear, rand, seaMap, minSea);
    cases.pickCenterGate.push({ map: id, massIndex: masses.indexOf(mass), existing: PL(existing), minDist, preferNear: preferNear ? P(preferNear) : null, seed, withRand, useSea, minSea, result: res ? P(res) : null, randCalls: rand ? rand.count() : 0 });
  }
  for (let v = 0; v < 2; v++) {
    const useBBox = rnd() < 0.8;
    const bbox = useBBox ? bboxOf(lad) : undefined;
    const nNeeded = pick([2, 4, 5, 6, 7, 8, 10]);
    const spreadOpts = rnd() < 0.8 ? { nNeeded } : undefined;
    const rand = withRand ? mkRand(seed + v) : undefined;
    const res = C.pickCenterInMassSpread(map, mass, existing, minDist, cache, rand, seaMap, minSea, bbox, spreadOpts);
    cases.pickCenterSpread.push({
      map: id,
      massIndex: masses.indexOf(mass),
      existing: PL(existing),
      minDist,
      seed: seed + v,
      withRand,
      useSea,
      minSea,
      bbox: bbox ?? null,
      nNeeded: spreadOpts ? spreadOpts.nNeeded : null,
      result: res ? P(res) : null,
      randCalls: rand ? rand.count() : 0,
    });
  }
  {
    const bbox = bboxOf(lad);
    const nNeeded = pick([3, 5, 6, 8]);
    const rand = mkRand(seed);
    const pool = rnd() < 0.5 ? lad : sampleN(lad, ri(1, 200));
    const res = C.pickCenterOnLandPoolSpread(map, pool, existing, minDist, cache, rand, seaMap, minSea, bbox, { nNeeded });
    cases.pickCenterPool.push({ map: id, pool: PL(pool), existing: PL(existing), minDist, seed, useSea, minSea, nNeeded, result: res ? P(res) : null, randCalls: rand.count() });
  }
}

// balanceClusterSpread / enforceQuarterSpreadOnCenters
cases.balance = [];
cases.enforce = [];
for (let i = 0; i < 90; i++) {
  const id = pick(SORT_MAPS.filter((m) => ladoweOf(m).length > 40));
  const map = webMaps[id];
  const lad = ladoweOf(id);
  const cache = C.massLandCacheFromMasses(massesOf(id));
  const bbox = bboxOf(lad);
  const centers = sampleN(lad.filter((h) => C.passesLocalLandGate(map, h.q, h.r)), ri(2, 7));
  const minDist = pick([4, 6, 8, 10, 12]);
  const useSea = rnd() < 0.5;
  const minSea = pick([0, 2, 4]);
  const seaMap = useSea ? seaMapOf(id) : undefined;
  const maxIter = pick([undefined, 1, 2, 4, 6, 0]);
  const nNeeded = pick([4, 5, 6, 7, 8, 10]);
  const seed = ri(1, 1e9);
  {
    const rand = mkRand(seed);
    const res = C.balanceClusterSpread(map, centers, lad, cache, minDist, rand, seaMap, minSea, bbox, maxIter, { nNeeded });
    cases.balance.push({ map: id, centers: PL(centers), minDist, useSea, minSea, maxIterations: maxIter === undefined ? null : maxIter, nNeeded, seed, result: PL(res), randCalls: rand.count() });
  }
  {
    const rand = mkRand(seed);
    const res = C.enforceQuarterSpreadOnCenters(map, centers, lad, cache, minDist, rand, seaMap, minSea, bbox, nNeeded);
    cases.enforce.push({ map: id, centers: PL(centers), minDist, useSea, minSea, nNeeded, seed, result: PL(res), randCalls: rand.count() });
  }
}

// placeClusterCentersAcrossLandmasses
cases.place = [];
for (const id of SORT_MAPS) {
  const rep = mapsOut[id];
  const map = webMaps[id];
  const lad = ladoweOf(id);
  const cache = C.massLandCacheFromMasses(massesOf(id));
  const bounds = { minQ: 0, maxQ: rep.w - 1, minR: 0, maxR: rep.h - 1 };
  const variants = [];
  for (let k = 0; k < 6; k++) {
    variants.push({
      nNeeded: pick([1, 2, 3, 4, 5, 6, 7, 8, 10]),
      minDistBase: pick([0, 3, 5, 8, 10, 12, 15, 17]),
      margin: pick([0, 1, 2, 3]),
      useSea: rnd() < 0.5,
      minSea: pick([0, 2, 4, 6]),
      seed: ri(1, 1e9),
    });
  }
  for (const v of variants) {
    const rand = mkRand(v.seed);
    const seaMap = v.useSea ? seaMapOf(id) : undefined;
    const res = quiet(() => C.placeClusterCentersAcrossLandmasses(map, lad, cache, v.nNeeded, v.minDistBase, centerOf(id), rand, v.margin, bounds, seaMap, v.minSea));
    cases.place.push({ map: id, ...v, result: PL(res), randCalls: rand.count() });
  }
}
// przypadki brzegowe place: pusty lad, mapa bez ladu
{
  const rep = mapsOut['s_tiny'];
  const map = webMaps['s_tiny'];
  const cache = C.massLandCacheFromMasses([]);
  const bounds = { minQ: 0, maxQ: rep.w - 1, minR: 0, maxR: rep.h - 1 };
  for (const n of [-2, -1, 0, 1, 3]) {
    const rand = mkRand(5);
    const res = quiet(() => C.placeClusterCentersAcrossLandmasses(map, [], cache, n, 5, centerOf('s_tiny'), rand, 1, bounds, undefined, 0));
    cases.place.push({ map: 's_tiny', empty: true, nNeeded: n, minDistBase: 5, margin: 1, useSea: false, minSea: 0, seed: 5, result: PL(res), randCalls: rand.count() });
  }
}

// --- startScoring ---
{
  cases.reveal = ['easy', 'normal', 'hard', 'inne'].map((d) => ({ diff: d, result: SS.startRevealRadiusForDifficulty(d) }));
  cases.scoreStart = [];
  cases.bestStart = [];
  for (const id of MAP_IDS) {
    const map = webMaps[id];
    for (let i = 0; i < 80; i++) {
      const h = rnd() < 0.8 ? pick(Object.values(map.hexes)).coords : randHex(id);
      cases.scoreStart.push({ map: id, q: h.q, r: h.r, score: f(SS.scoreCityStartHex(map, h.q, h.r)) });
    }
    const best = SS.findBestPlayerStartHex(map);
    cases.bestStart.push({ map: id, result: best ? P(best) : null });
  }
  // wszystkie hexy jednej mapy (pelne pokrycie punktacji)
  cases.scoreStartAll = {};
  for (const id of ['k42', 's_c30']) {
    const map = webMaps[id];
    cases.scoreStartAll[id] = Object.values(map.hexes).map((hx) => f(SS.scoreCityStartHex(map, hx.coords.q, hx.coords.r)));
  }
}

// --- sortowanie V8 ---
{
  const out = [];
  const addCase = (name, n, kind, seed, gen) => {
    // gen(i) -> element {v, id}; kind: 'num' | 'randSign' | 'randTern' | 'randOr'
    const items = Array.from({ length: n }, (_, i) => gen(i));
    const arr = items.map((x) => ({ ...x }));
    let calls = 0;
    const rand = mkRand(seed);
    let cmp;
    if (kind === 'num') cmp = (a, b) => ((calls++), a.v - b.v);
    else if (kind === 'randSign') cmp = (a, b) => ((calls++), (rand() * 2 - 1) || a.v - b.v);
    else if (kind === 'randTern') cmp = (a, b) => ((calls++), Math.floor(rand() * 3) - 1);
    else if (kind === 'numNaN') cmp = (a, b) => ((calls++), a.v % 7 === 0 ? NaN : a.v - b.v);
    else throw new Error(kind);
    arr.sort(cmp);
    out.push({ name, n, kind, seed, input: items.map((x) => x.v), order: arr.map((x) => x.id), cmpCalls: calls, randCalls: rand.count() });
  };
  const sizes = [0, 1, 2, 3, 4, 5, 7, 10, 16, 31, 32, 33, 50, 63, 64, 65, 66, 96, 100, 127, 128, 129, 160, 192, 200, 255, 256, 257, 320, 400, 640, 700, 1000, 1280];
  for (const n of sizes) {
    for (const kind of ['num', 'randSign', 'randTern', 'numNaN']) {
      const seed = ri(1, 1e9);
      addCase(`random-int/${n}`, n, kind, seed, (i) => ({ v: ri(0, Math.max(1, Math.floor(n / 3))), id: i }));
      addCase(`sorted/${n}`, n, kind, seed + 1, (i) => ({ v: i, id: i }));
      addCase(`reversed/${n}`, n, kind, seed + 2, (i) => ({ v: n - i, id: i }));
      addCase(`organ/${n}`, n, kind, seed + 3, (i) => ({ v: i < n / 2 ? i : n - i, id: i }));
      addCase(`runs/${n}`, n, kind, seed + 4, (i) => ({ v: (i % 17) * 3 + Math.floor(i / 17), id: i }));
      addCase(`equal/${n}`, n, kind, seed + 5, (i) => ({ v: 5, id: i }));
    }
  }
  // zlozone: dlugie biegi + galopowanie
  for (const n of [300, 600, 1000, 2000]) {
    for (const kind of ['num', 'randSign']) {
      const seed = ri(1, 1e9);
      addCase(`blocks/${n}`, n, kind, seed, (i) => ({ v: Math.floor(i / 50) * 100 + (i % 50 === 0 ? 0 : (i * 7) % 11), id: i }));
      addCase(`interleave/${n}`, n, kind, seed + 1, (i) => ({ v: i % 2 === 0 ? i : i + 1000, id: i }));
      addCase(`sawtooth/${n}`, n, kind, seed + 2, (i) => ({ v: (i % 90) * 5, id: i }));
    }
  }
  // biegi naturalne o dlugosciach a == b + c (b > c): granica niezmiennika scalania `len[n-2] > len[n-1] + len[n]`
  for (const L of [[140, 80, 60], [150, 90, 60], [160, 100, 60], [140, 80, 60, 45], [200, 120, 80, 70, 50]]) {
    const n = L.reduce((a, b) => a + b, 0);
    const starts = [];
    let acc = 0;
    for (const len of L) {
      starts.push(acc);
      acc += len;
    }
    for (const kind of ['num', 'randSign']) {
      addCase(`eqinv/${L.join('-')}`, n, kind, ri(1, 1e9), (i) => {
        let j = starts.length - 1;
        while (starts[j] > i) j--;
        return { v: (L.length - j) * 1000 + (i - starts[j]), id: i };
      });
    }
  }
  cases.v8sort = out;
}

const out = { pin: 'edb8fb56', meta, maps: mapsOut, cases };
writeFileSync(outArg, JSON.stringify(out));
const counts = Object.fromEntries(Object.entries(cases).map(([k, v]) => [k, Array.isArray(v) ? v.length : Object.keys(v).length]));
origLog('OK ' + JSON.stringify({ insertedExports, maps: MAP_IDS.length, counts }));
