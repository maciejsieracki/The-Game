// Generator wektorow P6.M05A (relief A: masy ladu, pokrycie siatki): URUCHAMIA prawdziwy kod TS weba
// (pin edb8fb56), nie literaly. Uzycie (po `git archive edb8fb56 gra/src gra/data` do wlasnego
// `mktemp -d` poza repo):
//   node --experimental-transform-types --no-warnings --import ./m05a-loader-register.mjs \
//        ./gen-m05a-vectors.mjs <WEB_ROOT> <WYJSCIE.json>
// `gen-helpers.ts` laduje sie jako KOPIA pliku z dopisanym na KONCU wierszem
// `export { ...prywatne deklaracje... };` (zadna linia oryginalu nie jest zmieniana; generator
// sprawdza, ze kopia bez dopisku jest bajt w bajt rowna oryginalowi). Loader tylko dopisuje
// .ts / /index.ts i traktuje .json jako modul - ZERO stubow logiki.
// Wariant `mapGenReliefOverflowCapFrac` z uszkodzonym JSON: DRUGA kopia drzewa `gra/` w scratch
// (`<WEB_ROOT>-variant-N`) z zmienionym `gra/data/map-gen-params.json`; uruchamiana jest ta sama
// funkcja TS z `map-gen-params-loader.ts`.
import { createHash } from 'node:crypto';
import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const root = process.argv[2];
const out = process.argv[3];
if (!root || !out) {
  console.error('uzycie: gen-m05a-vectors.mjs <WEB_ROOT> <WYJSCIE.json>');
  process.exit(2);
}
const sha = (s) => createHash('sha256').update(s).digest('hex');
const mapDir = `${root}/gra/src/map`;

// ---------- kopia gen-helpers.ts z dopisanymi eksportami prywatnych deklaracji ----------
const PRIVATE = [
  'isForestEligibleTerrain', 'FOREST_SHARE_OF_DRY_LAND', 'FOREST_OVERLAY_CAP_FRAC',
  'applyReliefToLandKeys', 'reliefBonusCapMountain', 'reliefBonusCapHighland',
  'reliefSpreadCapMountain', 'reliefSpreadCapHighland', 'applyIronMountainsToLandKeys',
  'applyCopperHighlandsToLandKeys', 'pickSpreadReliefKeys', 'RELIEF_MIN_MOUNTAINS',
  'RELIEF_MIN_HIGHLANDS', 'countMountainsInCell', 'countHighlandsInCell', 'cellHasMountain',
  'cellHasHighland', 'eligibleReliefLandCount', 'eligibleDepositLandCount',
  'cellCanHostDepositPackage', 'eligibleForestLandCount', 'pickReliefForceHex',
  'forceReliefTypeInCell', 'forceIronMountainsInCell', 'forceCopperHighlandsInCell',
  'forceReliefInCell', 'RELIEF_OVERFLOW_CAP_MULT', 'isDepositProtectedFromOverflowCap',
  'capMountainOverflowInCell', 'capHighlandOverflowInCell', 'capIronCellReliefSpread',
  'capReliefOverflowInCell', 'ensureMassIronGridCoverage', 'ensureMassCopperGridCoverage',
  'parseHexKey', 'hexAxialDistance', 'isRiverLandTerrain',
];
const original = readFileSync(`${mapDir}/gen-helpers.ts`, 'utf8');
const exportLine = `\nexport { ${PRIVATE.join(', ')} };\n`;
const copyText = original + exportLine;
if (copyText.slice(0, original.length) !== original) throw new Error('kopia != oryginal');
writeFileSync(`${mapDir}/gen-helpers.m05a-exports.ts`, copyText);
const lineCount = original.split('\n').length - (original.endsWith('\n') ? 1 : 0);

const G = await import(pathToFileURL(`${mapDir}/gen-helpers.m05a-exports.ts`).href);
const H = await import(pathToFileURL(`${root}/gra/src/types/hex.ts`).href);
const L = await import(pathToFileURL(`${root}/gra/src/data/map-gen-params-loader.ts`).href);
const { TerenBazowy, Nakladka } = H;

// ---------- pomocnicze ----------
const t = (x) => (Object.is(x, -0) ? '-0' : String(x)); // f64 jako tekst (NaN, Infinity, -0)
const rng = G.mulberry32(20261023);
const rng2 = G.mulberry32(777000111); // OSOBNY strumien dla map brzegowych (nie zmienia wynikow glownego przebiegu)
let src = rng;
const rnd = () => src();
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const ALL_TB = [TerenBazowy.Laka, TerenBazowy.Rownina, TerenBazowy.Wzgorza, TerenBazowy.Gory,
  TerenBazowy.PlytkieMorze, TerenBazowy.Morze, TerenBazowy.Pustynia, TerenBazowy.Polarny];
const NAKS = [Nakladka.Brak, Nakladka.Las, Nakladka.ZlozeGliny, Nakladka.ZlozeRudy,
  Nakladka.ZlozeKonia, Nakladka.ZlozeOwiec, Nakladka.ZlozeBydla, Nakladka.ZlozeLamy];
const TBI = Object.fromEntries(ALL_TB.map((x, i) => [x, i]));
const NKI = Object.fromEntries(NAKS.map((x, i) => [x, i]));
const TIERS = ['low', 'medium', 'high'];
const TYPS = ['kontynenty', 'pangea', 'wyspy', 'ziemia'];
const fnv1a64 = (str) => {
  let h = 0xcbf29ce484222325n;
  for (const b of Buffer.from(str, 'utf8')) { h ^= BigInt(b); h = (h * 0x100000001b3n) & 0xffffffffffffffffn; }
  return h.toString(16).padStart(16, '0');
};
const mkRand = (seed) => {
  const f = G.mulberry32(seed);
  let n = 0;
  return { fn: () => { n++; return f(); }, count: () => n, next: () => f() };
};

const cases = {};
const stats = {};
const bump = (k, v = 1) => { stats[k] = (stats[k] ?? 0) + v; };

// ---------- pula map (zapisane RAZ, przypadki wskazuja id) ----------
const mkHex = (q, r, tb, nak, riv, zl) => {
  const h = {
    coords: { q, r }, terenBazowy: tb, nakladka: nak, ulepszenie: 'brak', wlasciciel: null,
    wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {},
    rzeka: { obecna: riv, krawedzie: riv ? [0, 3] : [] },
  };
  if (zl) h.zloze = { typ: 'x' };
  return h;
};
const pool = []; // { id, w, h, rows:[[q,r,tb,nak,riv,zl]], noise:[text|null] }
const poolOut = [];
function enc(rows) {
  const o = { q: [], r: [], tb: '', nak: '', riv: '', zl: '' };
  for (const [q, r, tb, nak, riv, zl] of rows) {
    o.q.push(q); o.r.push(r); o.tb += TBI[tb]; o.nak += NKI[nak]; o.riv += riv ? '1' : '0'; o.zl += zl ? '1' : '0';
  }
  return o;
}
function fresh(m) {
  const hexes = {};
  for (const [q, r, tb, nak, riv, zl] of m.rows) hexes[G.hexKey(q, r)] = mkHex(q, r, tb, nak, !!riv, !!zl);
  const scratch = new Map();
  m.rows.forEach(([q, r], i) => {
    if (m.noiseNum[i] !== null) {
      scratch.set(G.hexKey(q, r), { elevContinental: 0, landMask: 0, mtnNoise: m.noiseNum[i], forNoise: 0, desNoise: 0 });
    }
  });
  return { hexes, scratch };
}
const dump = (hexes) => {
  let tb = ''; let nak = ''; let zl = '';
  for (const [k, h] of Object.entries(hexes)) {
    if (k !== `${h.coords.q},${h.coords.r}`) throw new Error('klucz != coords');
    tb += TBI[h.terenBazowy]; nak += NKI[h.nakladka]; zl += h.zloze ? '1' : '0';
  }
  return { tb, nak, zl };
};
const stateHash = (hexes) => { const d = dump(hexes); return fnv1a64(`${d.tb}|${d.nak}|${d.zl}`); };
const idxOf = (hexes) => new Map(Object.keys(hexes).map((k, i) => [k, i]));

const SEA = [TerenBazowy.Morze, TerenBazowy.PlytkieMorze];
const LAND = [TerenBazowy.Laka, TerenBazowy.Rownina, TerenBazowy.Pustynia, TerenBazowy.Polarny];

// mix: { gory, wzg } = udzialy; land fbm threshold; noise mode
function addMap({ w, h, seed, landFrac, gory, wzg, dep, noiseMode, order = 'row', margin = 0, holes = 0 }) {
  const perm = G.buildPermTable(G.mulberry32(seed));
  const cells = [];
  for (let r = -margin; r < h + margin; r++) for (let q = -margin; q < w + margin; q++) {
    cells.push({ q, r, n: G.fbm(perm, q * 0.11 + 7.3, r * 0.11 + 3.1, 3) });
  }
  const sorted = cells.map((c) => c.n).sort((a, b) => a - b);
  const thr = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * (1 - landFrac)))];
  let rows = cells.map((c) => {
    let water = c.n < thr;
    if (!water && holes > 0 && rnd() < holes) water = true;
    let tb;
    if (water) tb = rnd() < 0.25 ? TerenBazowy.PlytkieMorze : TerenBazowy.Morze;
    else {
      const x = rnd();
      tb = x < gory ? TerenBazowy.Gory : (x < gory + wzg ? TerenBazowy.Wzgorza : pick(LAND));
    }
    const nak = !water && rnd() < 0.1 ? Nakladka.Las : (rnd() < 0.04 ? pick(NAKS) : Nakladka.Brak);
    return [c.q, c.r, tb, nak, !water && rnd() < 0.08 ? 1 : 0, !water && rnd() < dep ? 1 : 0];
  });
  if (order === 'shuffle') rows = shuffle(rows);
  const noiseNum = rows.map(([q, r]) => {
    if (noiseMode === 'fbm') return G.fbm(perm, q * 0.21 + 1.7, r * 0.21 + 9.9, 3);
    if (noiseMode === 'quant') return Math.floor(rnd() * 12) / 16;
    if (noiseMode === 'mixed') return rnd() < 0.15 ? null : (rnd() < 0.5 ? Math.floor(rnd() * 8) / 8 : rnd());
    if (noiseMode === 'flat') return 0.5;
    throw new Error('noiseMode');
  });
  const m = { id: pool.length, w, h, rows, noiseNum, order, noiseMode };
  pool.push(m);
  poolOut.push({ id: m.id, w, h, order, noiseMode, ...enc(rows), noise: noiseNum.map((x) => (x === null ? null : t(x))) });
  return m;
}

// ---------- 0. stale i tabele ----------
cases.consts = {
  CONTINENT_CENTER_SQUARE_SIZE: t(G.CONTINENT_CENTER_SQUARE_SIZE),
  MIN_RIVER_SOURCES_PER_WATER_CELL: t(G.MIN_RIVER_SOURCES_PER_WATER_CELL),
  MIN_MOUNTAINS_IRON_CELL: t(G.MIN_MOUNTAINS_IRON_CELL),
  MIN_HIGHLANDS_COPPER_CELL: t(G.MIN_HIGHLANDS_COPPER_CELL),
  RELIEF_OVERFLOW_CAP_MULT: t(G.RELIEF_OVERFLOW_CAP_MULT),
  FOREST_OVERLAY_CAP_FRAC: t(G.FOREST_OVERLAY_CAP_FRAC),
  perTier: TIERS.map((k) => ({
    tier: k,
    FOREST_SHARE_OF_DRY_LAND: t(G.FOREST_SHARE_OF_DRY_LAND[k]),
    RELIEF_MIN_MOUNTAINS: t(G.RELIEF_MIN_MOUNTAINS[k]),
    RELIEF_MIN_HIGHLANDS: t(G.RELIEF_MIN_HIGHLANDS[k]),
    minMountainsIronCell: t(G.minMountainsIronCell(k)),
    minHighlandsCopperCell: t(G.minHighlandsCopperCell(k)),
    waterCoverageCellSize: t(G.waterCoverageCellSize(k)),
    ironCoverageCellSize: t(G.ironCoverageCellSize(k)),
    copperCoverageCellSize: t(G.copperCoverageCellSize(k)),
    reliefCoverageCellSize: t(G.reliefCoverageCellSize(k)),
    fairPlayResourceCellSize: t(G.fairPlayResourceCellSize(k)),
    forestCoverageCellSize: t(G.forestCoverageCellSize(k)),
    overflowCapFrac: [t(L.mapGenReliefOverflowCapFrac(k).mountain), t(L.mapGenReliefOverflowCapFrac(k).highland)],
  })),
  defaults: {
    minMountainsIronCell: t(G.minMountainsIronCell()),
    minHighlandsCopperCell: t(G.minHighlandsCopperCell()),
    waterCoverageCellSize: t(G.waterCoverageCellSize()),
    ironCoverageCellSize: t(G.ironCoverageCellSize()),
    copperCoverageCellSize: t(G.copperCoverageCellSize()),
    reliefCoverageCellSize: t(G.reliefCoverageCellSize()),
    fairPlayResourceCellSize: t(G.fairPlayResourceCellSize()),
    forestCoverageCellSize: t(G.forestCoverageCellSize()),
  },
};

// ---------- 1. wariant sufitu przepelnienia z uszkodzonym JSON (ta sama funkcja TS) ----------
cases.overflowVariants = [];
{
  const base = JSON.parse(readFileSync(`${root}/gra/data/map-gen-params.json`, 'utf8'));
  const variants = [
    ['bez-sekcji', (j) => { delete j.gestosc.relief_overflow_cap_frac; }],
    ['bez-gestosc', (j) => { delete j.gestosc; }],
    ['zero-gory-low', (j) => { j.gestosc.relief_overflow_cap_frac.low.mountain = 0; }],
    ['ujemne-wzg-high', (j) => { j.gestosc.relief_overflow_cap_frac.high.highland = -0.5; }],
    ['tekst-medium', (j) => { j.gestosc.relief_overflow_cap_frac.medium.mountain = '0.9'; }],
    ['brak-wiersza-medium', (j) => { delete j.gestosc.relief_overflow_cap_frac.medium; }],
    ['brak-pola-high', (j) => { delete j.gestosc.relief_overflow_cap_frac.high.mountain; }],
    ['inne-wartosci', (j) => { j.gestosc.relief_overflow_cap_frac.low = { mountain: 0.5, highland: 0.7 }; }],
    ['null-low', (j) => { j.gestosc.relief_overflow_cap_frac.low = { mountain: null, highland: 0.2 }; }],
    ['mieszany', (j) => {
      const c = j.gestosc.relief_overflow_cap_frac;
      c.low = { mountain: 0.5, highland: 0 };
      c.medium = { mountain: -1, highland: 0.77 };
      c.high = { mountain: 'x', highland: 0.33 };
    }],
    ['wszystkie-inne', (j) => {
      const c = j.gestosc.relief_overflow_cap_frac;
      c.low = { mountain: 0.11, highland: 0.12 };
      c.medium = { mountain: 0.21, highland: 0.22 };
      c.high = { mountain: 0.31, highland: 0.32 };
    }],
  ];
  let n = 0;
  for (const [name, mut] of variants) {
    n++;
    const vroot = `${root}-variant-${n}`;
    mkdirSync(vroot, { recursive: true });
    cpSync(`${root}/gra`, `${vroot}/gra`, { recursive: true });
    const j = JSON.parse(JSON.stringify(base));
    mut(j);
    writeFileSync(`${vroot}/gra/data/map-gen-params.json`, JSON.stringify(j));
    const VL = await import(pathToFileURL(`${vroot}/gra/src/data/map-gen-params-loader.ts`).href);
    const rows = TIERS.map((k) => {
      const f = VL.mapGenReliefOverflowCapFrac(k);
      const src = j.gestosc?.relief_overflow_cap_frac?.[k];
      const raw = (x) => (typeof x === 'number' ? t(x) : null); // Rust dostaje tylko liczby
      return { tier: k, mountainIn: src ? raw(src.mountain) : null, highlandIn: src ? raw(src.highland) : null,
        out: [t(f.mountain), t(f.highland)] };
    });
    cases.overflowVariants.push({ name, rows });
  }
}

// ---------- 2. tabele liczbowe: capy, min ladu w komorce ----------
cases.caps = [];
{
  const counts = [];
  for (let i = 0; i <= 400; i++) counts.push(i);
  for (let i = 0; i < 400; i++) counts.push(ri(401, 20000));
  counts.push(0.5, 2.5, -3, 1e9, Number.NaN, Infinity);
  for (const tier of TIERS) for (const c of counts) {
    cases.caps.push([tier, t(c), t(G.reliefBonusCapMountain(tier, c)), t(G.reliefBonusCapHighland(tier, c)),
      t(G.reliefSpreadCapMountain(tier, c)), t(G.reliefSpreadCapHighland(tier, c))]);
  }
}
cases.minLand = [];
{
  const sizes = [0, -0, 1, 5, 7, 10, 12, 15, 21, 24, 25, 24.9, 25.0001, 30, 31, 33.7, 100, 1000, -5, 0.5, 2.5,
    Number.NaN, Infinity, -Infinity, 1e300];
  for (let i = 0; i < 300; i++) sizes.push(ri(1, 160) + (rnd() < 0.3 ? rnd() : 0));
  for (const s of sizes) cases.minLand.push([t(s), t(G.minLandHexesForReliefCell(s)), t(G.minLandHexesForFairPlayCell(s))]);
}

// ---------- 3. landHexesByCoverageCell na kluczach niezaleznych od map ----------
cases.landCells = [];
{
  const sizes = [1, 2, 3, 5, 7, 10, 12, 15, 21, 7.5, 0.5, 100, 1];
  for (let i = 0; i < 80; i++) {
    const n = pick([0, 1, 5, 40, 200, 600]);
    const span = pick([3, 12, 30, 60]);
    const keys = [];
    for (let k = 0; k < n; k++) keys.push(G.hexKey(ri(-span, span * 2), ri(-span, span * 2)));
    if (n > 3 && rnd() < 0.3) keys.push(keys[0], keys[1]); // duplikaty w Set sie zwijaja
    const set = new Set(keys);
    const cs = sizes[i % sizes.length];
    const res = [...G.landHexesByCoverageCell(set, cs).entries()].map(([ck, arr]) => [ck, arr.map(([q, r]) => [q, r])]);
    cases.landCells.push({ keys, cellSize: t(cs), out: res });
  }
}

// ---------- 4. pickSpreadReliefKeys ----------
cases.pickSpread = [];
{
  for (let i = 0; i < 400; i++) {
    const n = pick([0, 1, 2, 5, 12, 40, 120]);
    const span = pick([4, 10, 25]);
    const cands = [];
    for (let k = 0; k < n; k++) {
      const key = G.hexKey(ri(0, span), ri(0, span));
      cands.push({ k: key, n: rnd() });
    }
    if (n > 4 && rnd() < 0.4) cands.push({ ...cands[0] }); // duplikat klucza
    const count = pick([0, 1, 2, 3, 5, 8, 20, 200, -1, 2.5, 0.5, Number.NaN, 7]);
    const minDist = pick([0, 1, 3, 4, 5, 100, -2, 2.5, Number.NaN]);
    const res = G.pickSpreadReliefKeys(cands, count, minDist);
    cases.pickSpread.push({ cands: cands.map((c) => [c.k, t(c.n)]), count: t(count), minDist: t(minDist), out: res });
    bump(res.length > 0 ? 'pickSpread.nonempty' : 'pickSpread.empty');
  }
}

// ---------- 5. pula map ----------
const MAP_SPECS = [];
{
  const dims = [[20, 16], [26, 20], [30, 24], [36, 28], [40, 30], [48, 34], [56, 40], [64, 44]];
  const mixes = [
    { gory: 0, wzg: 0 }, { gory: 0.02, wzg: 0.03 }, { gory: 0.05, wzg: 0.1 }, { gory: 0.15, wzg: 0.2 },
    { gory: 0.4, wzg: 0.3 }, { gory: 0.0, wzg: 0.5 }, { gory: 0.6, wzg: 0 },
  ];
  const deps = [0, 0, 0.05, 0.3];
  const noises = ['fbm', 'quant', 'mixed', 'flat'];
  let seed = 100;
  for (let i = 0; i < 34; i++) {
    const [w, h] = dims[i % dims.length];
    MAP_SPECS.push({
      w, h, seed: seed++, landFrac: pick([0.35, 0.5, 0.65, 0.85, 0.95]), ...mixes[i % mixes.length],
      dep: deps[i % deps.length], noiseMode: noises[i % noises.length], order: i % 5 === 4 ? 'shuffle' : 'row',
      margin: i % 7 === 6 ? 3 : 0, holes: i % 6 === 5 ? 0.12 : 0,
    });
  }
  // duze mapy (Ogromny): 90x60 i 100x66, tylko kilka
  for (const [w, h] of [[90, 60], [100, 66]]) {
    MAP_SPECS.push({ w, h, seed: seed++, landFrac: 0.55, gory: 0.08, wzg: 0.1, dep: 0.05, noiseMode: 'fbm', order: 'row', margin: 0, holes: 0 });
  }
  // mapy z remisami szumu i mala wyspa/archipelag
  for (let i = 0; i < 4; i++) {
    MAP_SPECS.push({ w: 44, h: 32, seed: seed++, landFrac: 0.3, gory: 0.1, wzg: 0.1, dep: 0.1, noiseMode: 'quant', order: 'shuffle', margin: 0, holes: 0.25 });
  }
}
const maps = MAP_SPECS.map((s) => addMap(s));

// pomocnicze: masy z web, komorki
function massesOf(hexes) { return G.groupLandMassKeys(hexes); }
function cellsOf(keys, size) { return [...G.landHexesByCoverageCell(new Set(keys), size).values()]; }
const cellHash = (cell) => fnv1a64(cell.map(([q, r]) => `${q},${r}`).join(';'));
const idxHash = (arr) => fnv1a64(arr.join(','));
const baseDump = new Map(); // id -> dump
const baseOf = (m) => { if (!baseDump.has(m.id)) baseDump.set(m.id, dump(fresh(m).hexes)); return baseDump.get(m.id); };
// zmiany wzgledem stanu wejsciowego: [indeks, tb, nak, zl] (tb/nak/zl jako znaki)
const diffOf = (m, hexes) => {
  const b = baseOf(m); const a = dump(hexes);
  const d = [];
  for (let i = 0; i < b.tb.length; i++) {
    if (b.tb[i] !== a.tb[i] || b.nak[i] !== a.nak[i] || b.zl[i] !== a.zl[i]) d.push([i, a.tb[i], a.nak[i], a.zl[i]]);
  }
  return d;
};
// ciag ciagly continentOf z formuly (wejscie, nie logika): indeks heksu -> wartosc | brak
function contValue(i, n, variant) {
  if (i % 19 === 5) return undefined;
  let v = (i * 7 + Math.floor(i / 5)) % n;
  if (variant === 2) {
    if (i % 23 === 0) v = n + 5;
    else if (i % 29 === 0) v = -3;
    else if (i % 31 === 0) v = n;
  }
  return v;
}
function contMap(hexes, n, variant) {
  const cont = new Map();
  Object.keys(hexes).forEach((k, i) => {
    if (SEA.includes(hexes[k].terenBazowy)) return;
    const v = contValue(i, n, variant);
    if (v !== undefined) cont.set(k, v);
  });
  return cont;
}

// Mapy BRZEGOWE (osobny strumien losowy `rng2`): blob dokladnie N heksow ladu (N = 7, 8, 9, 10 wokol
// podlogi `max(8, floor(cellSize*0.32))` = 8 dla rozmiarow komorek 12/15/21) wewnatrz JEDNEJ komorki dla
// wszystkich trzech rozmiarow siatki (q, r w [4, 9], komorki 12/15/21 maja tam indeks 0,0). Wykrywa
// mutacje `<` -> `<=` / `>=` -> `>` na progu minimalnej liczby heksow ladu w komorce.
function addBoundaryMap({ n, kind }) {
  const w = 14;
  const h = 14;
  const blob = new Set();
  for (let i = 0; i < n; i++) blob.add(G.hexKey(4 + (i % 6), 4 + Math.floor(i / 6)));
  const rows = [];
  for (let r = 0; r < h; r++) for (let q = 0; q < w; q++) {
    const inBlob = blob.has(G.hexKey(q, r));
    let tb;
    if (!inBlob) tb = rnd() < 0.3 ? TerenBazowy.PlytkieMorze : TerenBazowy.Morze;
    else if (kind === 'gory') tb = TerenBazowy.Gory;
    else if (kind === 'wzg') tb = TerenBazowy.Wzgorza;
    else if (kind === 'laka') tb = TerenBazowy.Laka;
    else tb = (q + r) % 2 === 0 ? TerenBazowy.Gory : TerenBazowy.Wzgorza;
    rows.push([q, r, tb, Nakladka.Brak, inBlob && rnd() < 0.3 ? 1 : 0, inBlob && rnd() < 0.2 ? 1 : 0]);
  }
  const noiseNum = rows.map(() => Math.floor(rnd() * 6) / 8); // remisy
  const m = { id: pool.length, w, h, rows, noiseNum, order: 'row', noiseMode: 'quant' };
  pool.push(m);
  poolOut.push({ id: m.id, w, h, order: 'row', noiseMode: 'quant-granica', ...enc(rows), noise: noiseNum.map((x) => t(x)) });
  return m;
}

function runSections(ms, init) {
// ---------- 6. masy, centroid, kwadrat centrum, odleglosc ----------
if (init) { cases.masses = []; cases.center = []; }
for (const m of ms) {
  const { hexes } = fresh(m);
  const ix = idxOf(hexes);
  const masses = massesOf(hexes);
  cases.masses.push({ map: m.id, out: masses.map((ms) => ms.map((k) => ix.get(k))) });
  bump('masses.total', masses.length);
  const candidateSets = [];
  masses.slice(0, 5).forEach((ms, mi) => candidateSets.push({ massIdx: mi, keys: ms }));
  const allKeys = Object.keys(hexes);
  for (let i = 0; i < 4; i++) {
    const sub = [];
    const n = pick([0, 1, 3, 10, 40]);
    for (let k = 0; k < n; k++) sub.push(pick(allKeys));
    if (n > 2 && rnd() < 0.5) sub.push(sub[0]);
    candidateSets.push({ massIdx: null, keys: sub });
  }
  for (const cs of candidateSets) {
    const ks = cs.keys;
    const centroid = G.computeLandMassCentroid(hexes, ks);
    const sizes = [undefined, 1, 2, 3, 4, 5, 6, 9, 0, 4.5, 25, -2];
    const sqs = [];
    for (const sz of [undefined, pick(sizes), pick(sizes)]) {
      const sq = sz === undefined ? G.continentCenterSquare(hexes, ks) : G.continentCenterSquare(hexes, ks, sz);
      const rec = {
        size: sz === undefined ? null : t(sz),
        out: sq === null ? null : {
          keys: [...sq.keys].map((k) => ix.get(k)),
          bbox: [t(sq.bbox.qMin), t(sq.bbox.qMax), t(sq.bbox.rMin), t(sq.bbox.rMax)],
          centroid: [t(sq.centroid.q), t(sq.centroid.r)],
        },
        dist: null,
      };
      bump(sq === null ? 'center.null' : 'center.some');
      if (sq !== null) {
        const pts = [];
        for (let k = 0; k < 10; k++) pts.push([ri(-6, m.w + 6), ri(-6, m.h + 6)]);
        pts.push([sq.centroid.q, sq.centroid.r], [Number.NaN, 2], [2.5, 3.5]);
        const first = [...sq.keys][0];
        if (first !== undefined) { const p = G.parseHexKey(first); pts.push([p.q, p.r]); }
        rec.dist = pts.map(([q, r]) => [t(q), t(r), t(G.hexDistanceToCenterSquare(q, r, sq))]);
        bump('centerDist.points', pts.length);
      }
      sqs.push(rec);
    }
    cases.center.push({
      map: m.id, massIdx: cs.massIdx, keys: cs.massIdx === null ? ks.map((k) => ix.get(k)) : null,
      centroid: centroid === null ? null : [t(centroid.q), t(centroid.r)], squares: sqs,
    });
    bump(centroid === null ? 'centroid.null' : 'centroid.some');
  }
}
if (init) cases.nullSquareDist = [[t(1), t(2), t(G.hexDistanceToCenterSquare(1, 2, null))]];

// ---------- 7. partycje ----------
if (init) cases.partition = [];
for (const m of ms) {
  const { hexes } = fresh(m);
  const ix = idxOf(hexes);
  for (const typ of TYPS) {
    for (let variant = 0; variant < 3; variant++) {
      let cont = null; let n = 0; let nOrig = 0;
      if (variant > 0) {
        n = pick([1, 2, 3, 4, 7]);
        nOrig = n;
        cont = contMap(hexes, n, variant);
        if (variant === 2 && rnd() < 0.3) n = 0; // nContinents = 0 -> masy
      }
      const res = G.landPartitionKeysForDistribution(hexes, typ, cont, n);
      const idxs = res.map((z) => z.map((k) => ix.get(k)));
      cases.partition.push({
        map: m.id, typ, n, nOrig, variant, zones: idxs.length, sizes: idxs.map((z) => z.length),
        hashes: idxs.map((z) => idxHash(z)),
      });
      bump(`partition.${typ}.${cont === null ? 'nocont' : 'cont'}`);
      if (cont !== null && (typ === 'kontynenty' || typ === 'wyspy') && n > 0) bump('partition.voronoiPath');
    }
  }
}

// ---------- 8. teren las-kwalifikujacy, liczniki w komorkach ----------
if (init) {
  cases.forestEligible = ALL_TB.map((tb) => [TBI[tb], G.isForestEligibleTerrain(tb) ? 1 : 0]);
  cases.riverLand = ALL_TB.map((tb) => [TBI[tb], G.isRiverLandTerrain(tb) ? 1 : 0]);
  cases.cellCounts = [];
  cases.canHostEdge = [];
}
for (const m of ms) {
  const { hexes } = fresh(m);
  const masses = massesOf(hexes);
  masses.slice(0, 3).forEach((mass, massIdx) => {
    for (const tier of TIERS) {
      const size = G.ironCoverageCellSize(tier);
      cellsOf(mass, size).slice(0, 6).forEach((land, cellIdx) => {
        const extra = rnd() < 0.2 ? [[m.w + 50, m.h + 50]] : []; // wspolrzedne spoza mapy
        const cell = [...land, ...extra];
        const minLand = pick([0, 3, 8, 12, 40, 100]);
        cases.cellCounts.push({
          map: m.id, tier, massIdx, size, cellIdx, extra, len: land.length, cellHash: cellHash(land),
          mtn: G.countMountainsInCell(cell, hexes), hi: G.countHighlandsInCell(cell, hexes),
          hasM: G.cellHasMountain(cell, hexes) ? 1 : 0, hasH: G.cellHasHighland(cell, hexes) ? 1 : 0,
          iron: G.cellHasIronPackage(cell, hexes, tier) ? 1 : 0, copper: G.cellHasCopperPackage(cell, hexes, tier) ? 1 : 0,
          ironDef: G.cellHasIronPackage(cell, hexes) ? 1 : 0, copperDef: G.cellHasCopperPackage(cell, hexes) ? 1 : 0,
          relief: G.cellHasReliefPackage(cell, hexes) ? 1 : 0,
          eligRelief: G.eligibleReliefLandCount(cell, hexes), eligDep: G.eligibleDepositLandCount(cell, hexes),
          minLand, canHost: G.cellCanHostDepositPackage(cell, hexes, minLand) ? 1 : 0,
          eligForest: G.eligibleForestLandCount(cell, hexes),
        });
        bump('cellCounts.cases');
        bump(G.cellHasIronPackage(cell, hexes, tier) ? 'cellCounts.ironYes' : 'cellCounts.ironNo');
        bump(G.cellHasCopperPackage(cell, hexes, tier) ? 'cellCounts.copperYes' : 'cellCounts.copperNo');
        bump(G.cellCanHostDepositPackage(cell, hexes, minLand) ? 'cellCounts.hostYes' : 'cellCounts.hostNo');
        // granica `eligible < minLand`: minLand = dokladna liczba -1 / 0 / +1 (bez losowania)
        for (const dl of [-1, 0, 1]) {
          const ml = G.eligibleDepositLandCount(cell, hexes) + dl;
          cases.canHostEdge.push({
            map: m.id, tier, massIdx, size, cellIdx, extra, len: land.length, cellHash: cellHash(land),
            minLand: ml, out: G.cellCanHostDepositPackage(cell, hexes, ml) ? 1 : 0,
          });
          bump(G.cellCanHostDepositPackage(cell, hexes, ml) ? 'canHostEdge.yes' : 'canHostEdge.no');
        }
      });
    }
  });
}

// ---------- 9. wskazniki pokrycia ----------
if (init) cases.ratios = [];
for (const m of ms) {
  const { hexes } = fresh(m);
  const masses = massesOf(hexes);
  const sel = [];
  if (masses[0]) sel.push({ massIdx: 0, all: false });
  if (masses[1]) sel.push({ massIdx: 1, all: false });
  if (masses.length > 1) sel.push({ massIdx: null, all: true });
  for (const s of sel) {
    const mass = s.all ? masses.reduce((a, b) => a.concat(b), []) : masses[s.massIdx];
    const dup = mass.length > 3 && rnd() < 0.3;
    const keys = dup ? [...mass, mass[0]] : mass;
    for (const tier of TIERS) {
      const out = { map: m.id, tier, massIdx: s.massIdx, all: s.all, dup, iron: [], copper: [], relief: [] };
      for (const cs of [G.ironCoverageCellSize(tier), G.copperCoverageCellSize(tier), pick([5, 7, 10, 25])]) {
        out.iron.push([t(cs), t(G.ironGridCoverageRatio(keys, hexes, cs, tier)), t(G.ironGridCoverageRatio(keys, hexes, cs))]);
        out.copper.push([t(cs), t(G.copperGridCoverageRatio(keys, hexes, cs, tier)), t(G.copperGridCoverageRatio(keys, hexes, cs))]);
      }
      out.relief.push(['u', t(G.ironCoverageCellSize(tier)), null, t(G.reliefGridCoverageRatio(keys, hexes, G.ironCoverageCellSize(tier)))]);
      out.relief.push(['c', t(G.ironCoverageCellSize(tier)), t(G.copperCoverageCellSize(tier)),
        t(G.reliefGridCoverageRatio(keys, hexes, G.ironCoverageCellSize(tier), G.copperCoverageCellSize(tier)))]);
      const odd = pick([8, 13, 17, 30]);
      out.relief.push(['o', t(odd), null, t(G.reliefGridCoverageRatio(keys, hexes, odd))]);
      out.assert = G.assertReliefGridCoverage(keys, hexes, tier) ? 1 : 0;
      cases.ratios.push(out);
      bump(out.assert ? 'ratios.assertYes' : 'ratios.assertNo');
      bump(Number(out.iron[0][1]) === 1 ? 'ratios.ironFull' : 'ratios.ironPartial');
      bump(Number(out.copper[0][1]) === 1 ? 'ratios.copperFull' : 'ratios.copperPartial');
    }
  }
}

// ---------- 10. operacje komorkowe: pickReliefForceHex, forceType, cap ----------
const cellSample = [];
for (const m of ms) {
  const { hexes } = fresh(m);
  const masses = massesOf(hexes);
  masses.forEach((mass, massIdx) => {
    if (mass.length < 8 || massIdx > 1) return;
    for (const tier of TIERS) {
      const size = pick([G.ironCoverageCellSize(tier), G.copperCoverageCellSize(tier), 12, 21]);
      const all = cellsOf(mass, size);
      const idxs = shuffle(all.map((c, i) => i).filter((i) => all[i].length >= 4)).slice(0, 3);
      for (const cellIdx of idxs) cellSample.push({ m, tier, massIdx, size, cellIdx, cell: all[cellIdx] });
    }
  });
}
if (init) { cases.pickForce = []; cases.forceType = []; cases.capCell = []; }
const ref = (s) => ({ map: s.m.id, massIdx: s.massIdx, size: s.size, cellIdx: s.cellIdx, len: s.cell.length, cellHash: cellHash(s.cell) });
for (const s of cellSample) {
  const { m, tier, cell } = s;
  for (let rep = 0; rep < 2; rep++) {
    const { hexes, scratch } = fresh(m);
    const want = pick(['mountain', 'highland']);
    const avoid = new Set();
    if (rnd() < 0.5) for (const [q, r] of cell) if (rnd() < 0.2) avoid.add(G.hexKey(q, r));
    const ph = rnd() < 0.5; const pm = rnd() < 0.5;
    const seed = ri(1, 4294967295);
    const rr = mkRand(seed);
    const res = G.pickReliefForceHex(cell, hexes, scratch, m.w, m.h, want, avoid, rr.fn, ph, pm);
    cases.pickForce.push({
      ...ref(s), want, avoid: [...avoid], ph: ph ? 1 : 0, pm: pm ? 1 : 0, seed,
      out: res === null ? null : [res[0], res[1]], calls: rr.count(), next: t(rr.next()),
    });
    bump(res === null ? 'pickForce.null' : 'pickForce.some');
  }
  for (const kind of ['type-mountain', 'type-highland', 'iron', 'copper', 'both']) {
    const { hexes, scratch } = fresh(m);
    const seed = ri(1, 4294967295);
    const rr = mkRand(seed);
    let ret; let minCount = null;
    if (kind === 'type-mountain') { minCount = pick([1, 2, 4, 6, 12, 40]); ret = G.forceReliefTypeInCell(cell, hexes, scratch, m.w, m.h, rr.fn, 'mountain', minCount, tier); }
    else if (kind === 'type-highland') { minCount = pick([1, 2, 4, 6, 12, 40]); ret = G.forceReliefTypeInCell(cell, hexes, scratch, m.w, m.h, rr.fn, 'highland', minCount, tier); }
    else if (kind === 'iron') ret = G.forceIronMountainsInCell(cell, hexes, scratch, m.w, m.h, rr.fn, tier);
    else if (kind === 'copper') ret = G.forceCopperHighlandsInCell(cell, hexes, scratch, m.w, m.h, rr.fn, tier);
    else ret = G.forceReliefInCell(cell, hexes, scratch, m.w, m.h, rr.fn);
    cases.forceType.push({
      ...ref(s), kind, tier, minCount: minCount === null ? null : t(minCount), seed, ret: ret ? 1 : 0,
      calls: rr.count(), next: t(rr.next()), diff: diffOf(m, hexes), hash: stateHash(hexes),
    });
    bump(`forceType.${kind}.${ret ? 'changed' : 'same'}`);
  }
  for (const kind of ['mtn', 'hi', 'mtn-spread', 'hi-spread', 'relief']) {
    const { hexes, scratch } = fresh(m);
    let ret;
    if (kind === 'mtn') ret = G.capMountainOverflowInCell(cell, hexes, scratch, tier);
    else if (kind === 'hi') ret = G.capHighlandOverflowInCell(cell, hexes, scratch, tier);
    else if (kind === 'mtn-spread') ret = G.capMountainOverflowInCell(cell, hexes, scratch, tier, true);
    else if (kind === 'hi-spread') ret = G.capHighlandOverflowInCell(cell, hexes, scratch, tier, true);
    else ret = G.capReliefOverflowInCell(cell, hexes, scratch, tier);
    cases.capCell.push({ ...ref(s), kind, tier, ret: ret ? 1 : 0, diff: diffOf(m, hexes), hash: stateHash(hexes) });
    bump(`capCell.${kind}.${ret ? 'changed' : 'same'}`);
  }
}
// pickReliefForceHex: przypadki z wynikiem null (wszystko wykluczone / sama woda), zero losowan
for (const s of cellSample.slice(0, 24)) {
  const { m, cell } = s;
  const { hexes, scratch } = fresh(m);
  const avoid = new Set(cell.map(([q, r]) => G.hexKey(q, r)));
  const seed = ri(1, 4294967295);
  const rr = mkRand(seed);
  const want = pick(['mountain', 'highland']);
  const res = G.pickReliefForceHex(cell, hexes, scratch, m.w, m.h, want, avoid, rr.fn, false, false);
  cases.pickForce.push({
    ...ref(s), want, avoid: [...avoid], ph: 0, pm: 0, seed, out: res === null ? null : [res[0], res[1]],
    calls: rr.count(), next: t(rr.next()),
  });
  bump(res === null ? 'pickForce.null' : 'pickForce.some');
}
if (init) cases.depositProtected = [
  [0, G.isDepositProtectedFromOverflowCap(undefined) ? 1 : 0],
  [1, G.isDepositProtectedFromOverflowCap(mkHex(0, 0, TerenBazowy.Gory, Nakladka.Brak, false, false)) ? 1 : 0],
  [2, G.isDepositProtectedFromOverflowCap(mkHex(0, 0, TerenBazowy.Gory, Nakladka.Brak, false, true)) ? 1 : 0],
];

// ---------- 11. capIronCellReliefSpread, ensureMass*, apply* na kluczach ----------
if (init) { cases.capSpread = []; cases.ensureMass = []; cases.applyKeys = []; cases.applyRank = []; }
for (const m of ms) {
  const { hexes } = fresh(m);
  const allMasses = massesOf(hexes);
  const big = allMasses.map((x, i) => i).filter((i) => allMasses[i].length >= 8)
    .sort((a, b) => allMasses[b].length - allMasses[a].length).slice(0, 2);
  for (const tier of TIERS) {
    for (const massIdx of big) {
      const mass = allMasses[massIdx];
      {
        const f = fresh(m);
        G.capIronCellReliefSpread(f.hexes, f.scratch, tier, new Set(mass));
        cases.capSpread.push({ map: m.id, tier, massIdx, diff: diffOf(m, f.hexes), hash: stateHash(f.hexes) });
        bump('capSpread.cases');
        if (stateHash(f.hexes) !== stateHash(hexes)) bump('capSpread.changed');
      }
      for (const kind of ['iron', 'copper']) for (const skipCap of [false, true]) {
        const f = fresh(m);
        const seed = ri(1, 4294967295);
        const rr = mkRand(seed);
        const fixed = kind === 'iron'
          ? G.ensureMassIronGridCoverage(f.hexes, f.scratch, tier, m.w, m.h, new Set(mass), rr.fn, skipCap)
          : G.ensureMassCopperGridCoverage(f.hexes, f.scratch, tier, m.w, m.h, new Set(mass), rr.fn, skipCap);
        cases.ensureMass.push({
          map: m.id, tier, kind, skipCap: skipCap ? 1 : 0, massIdx, seed, fixed, calls: rr.count(),
          next: t(rr.next()), diff: diffOf(m, f.hexes), hash: stateHash(f.hexes),
        });
        bump(`ensureMass.${kind}.${skipCap ? 'skip' : 'cap'}.${fixed > 0 ? 'fixed' : 'none'}`);
      }
    }
  }
}
for (const m of ms) {
  const { hexes } = fresh(m);
  const ix = idxOf(hexes);
  const masses = massesOf(hexes);
  const allLand = Object.keys(hexes).filter((k) => !SEA.includes(hexes[k].terenBazowy));
  for (const tier of TIERS) {
    for (let rep = 0; rep < 2; rep++) {
      const kind = pick(['iron', 'copper', 'both']);
      let spec; let keys;
      const x = rnd();
      if (x < 0.3) { spec = { type: 'allLand' }; keys = allLand; }
      else if (x < 0.6 && masses.length > 0) {
        const mi = ri(0, Math.min(masses.length, 3) - 1);
        const dup = rnd() < 0.4;
        spec = { type: 'mass', massIdx: mi, dup }; keys = dup ? [...masses[mi], masses[mi][0]] : masses[mi];
      } else if (x < 0.9 && hexes && Object.keys(hexes).length <= 1500) {
        const frac = pick([0.7, 0.2, 0.02]);
        keys = shuffle(allLand.filter(() => rnd() < frac));
        spec = { type: 'explicit', keys: keys.map((k) => ix.get(k)) };
      } else { spec = { type: 'explicit', keys: [] }; keys = []; }
      const f = fresh(m);
      if (kind === 'iron') G.applyIronMountainsToLandKeys(f.hexes, f.scratch, tier, keys, m.w, m.h);
      else if (kind === 'copper') G.applyCopperHighlandsToLandKeys(f.hexes, f.scratch, tier, keys, m.w, m.h);
      else G.applyReliefToLandKeys(f.hexes, f.scratch, tier, keys, m.w, m.h);
      cases.applyKeys.push({ map: m.id, tier, kind, spec, diff: diffOf(m, f.hexes), hash: stateHash(f.hexes) });
      bump(`applyKeys.${kind}.${stateHash(f.hexes) !== stateHash(hexes) ? 'changed' : 'same'}`);
      bump(`applyKeys.spec.${spec.type}`);
    }
    for (const typ of TYPS) {
      let cont = null; let n = 0; let variant = 0;
      if ((typ === 'kontynenty' || typ === 'wyspy') && rnd() < 0.8) {
        n = pick([2, 3, 4]); variant = pick([1, 1, 2]);
        cont = contMap(hexes, n, variant);
      }
      const f = fresh(m);
      G.applyReliefByNoiseRank(f.hexes, f.scratch, tier, m.w, m.h, typ, cont, n);
      cases.applyRank.push({ map: m.id, tier, typ, n, variant, diff: diffOf(m, f.hexes), hash: stateHash(f.hexes) });
      bump(`applyRank.${typ}.${stateHash(f.hexes) !== stateHash(hexes) ? 'changed' : 'same'}`);
    }
  }
}
// applyReliefByNoiseRank z domyslnymi argumentami weba (typ pangea, continentOf null, n=0)
if (init) cases.applyRankDefault = [];
for (const m of (init ? maps.slice(0, 12) : [])) {
  for (const tier of TIERS) {
    const f = fresh(m);
    G.applyReliefByNoiseRank(f.hexes, f.scratch, tier, m.w, m.h);
    cases.applyRankDefault.push({ map: m.id, tier, diff: diffOf(m, f.hexes), hash: stateHash(f.hexes) });
  }
}

}

runSections(maps, true);

// przebieg dla map brzegowych: osobny strumien losowy, ta sama logika sekcji, bez ponownej inicjalizacji
src = rng2;
const bmaps = [];
for (const n of [7, 8, 9, 10]) for (const kind of ['gory', 'wzg', 'laka', 'mix']) bmaps.push(addBoundaryMap({ n, kind }));
runSections(bmaps, false);

// pickReliefForceHex z heksami WODY w liscie `land` (funkcja musi je odfiltrowac; wolajacy web podaje tylko lad,
// wiec tylko test na poziomie funkcji to sprawdza). Osobna kategoria, strumien rng2 (dopisany na koncu).
cases.pickForceWater = [];
for (const m of maps.slice(0, 24)) {
  const { hexes, scratch } = fresh(m);
  const water = m.rows.filter((row) => SEA.includes(row[2])).map((row) => [row[0], row[1]]);
  if (water.length < 3) continue;
  const masses = massesOf(hexes);
  masses.forEach((mass, massIdx) => {
    if (mass.length < 8 || massIdx > 0) return;
    const size = pick([12, 15, 21]);
    const all = cellsOf(mass, size);
    const idxs = shuffle(all.map((c, i) => i).filter((i) => all[i].length >= 4)).slice(0, 2);
    for (const cellIdx of idxs) {
      for (const want of ['mountain', 'highland']) {
        const cell = all[cellIdx];
        const extra = shuffle(water).slice(0, ri(1, 3));
        const land = [...cell, ...extra];
        const seed = ri(1, 4294967295);
        const rr = mkRand(seed);
        const f = fresh(m);
        const res = G.pickReliefForceHex(land, f.hexes, f.scratch, m.w, m.h, want, new Set(), rr.fn, false, false);
        cases.pickForceWater.push({
          map: m.id, massIdx, size, cellIdx, len: cell.length, cellHash: cellHash(cell), want, waterExtra: extra, seed,
          out: res === null ? null : [res[0], res[1]], calls: rr.count(), next: t(rr.next()),
        });
        bump(`pickForceWater.${res === null ? 'null' : 'some'}`);
      }
    }
  });
}
src = rng;

const result = {
  meta: {
    pin_web: 'edb8fb56',
    generator: 'gen-m05a-vectors.mjs',
    node: process.version,
    gen_helpers_lines: lineCount,
    gen_helpers_sha256: sha(original),
  },
  enums: { tb: ALL_TB, nak: NAKS },
  maps: poolOut,
  cases,
  stats,
};
writeFileSync(out, JSON.stringify(result));
console.log('OK', JSON.stringify({ maps: poolOut.length, stats }, null, 1));
