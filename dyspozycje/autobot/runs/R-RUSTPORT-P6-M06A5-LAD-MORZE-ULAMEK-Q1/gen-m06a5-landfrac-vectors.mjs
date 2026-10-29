// Generator wektorow P6.M06A5 partia 1 (rodzina ulamka lądu):
// assignContinentIndices (web :3186), sortLandKeysForErosion (:3207, prywatna - instrumentowana
// KOPIA gen-helpers.ts w katalogu weba, eksport tylko w kopii), applyLandFractionByScore (:3444),
// rebalanceLandFractionWithMargins (:3532).
// URUCHAMIA prawdziwy kod TS weba (pin edb8fb56) - logiki nie przepisujemy.
//
// Uzycie (z katalogu tego pliku; loader obok):
//   node --experimental-transform-types --no-warnings --import ./m06a-loader-register.mjs \
//        ./gen-m06a5-landfrac-vectors.mjs <WEB_ROOT> <WYJSCIE.json>
// WEB_ROOT = `git archive edb8fb56 gra/src gra/data` rozpakowane POZA repo.
// Mapa: [klucz, terrainRust]. Wynik: liczba zmian + [klucz, terrainRust] w kolejnosci wstawiania.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const root = process.argv[2];
const out = process.argv[3];
if (!root || !out) {
  console.error('uzycie: gen-m06a5-landfrac-vectors.mjs <WEB_ROOT> <WYJSCIE.json>');
  process.exit(2);
}
const mapDir = `${root}/gra/src/map`;
const originalSrc = readFileSync(`${mapDir}/gen-helpers.ts`, 'utf8');
const sha = (s) => createHash('sha256').update(s).digest('hex');

// Instrumentowana kopia: jedyna zmiana to eksport prywatnej sortLandKeysForErosion.
const instrSrc = originalSrc.replace(
  '\nfunction sortLandKeysForErosion(',
  '\nexport function sortLandKeysForErosion(',
);
if (instrSrc === originalSrc) throw new Error('instrumentacja sortLandKeysForErosion nie zadzialala');
const instrPath = `${mapDir}/gen-helpers.m06a5-instr.ts`;
writeFileSync(instrPath, instrSrc);

const G = await import(pathToFileURL(`${mapDir}/gen-helpers.ts`).href);
const GI = await import(pathToFileURL(instrPath).href);
const H = await import(pathToFileURL(`${root}/gra/src/types/hex.ts`).href);
const { TerenBazowy, Nakladka } = H;

const TB_TO_RUST = {
  [TerenBazowy.Laka]: 'Laka',
  [TerenBazowy.Rownina]: 'Rownina',
  [TerenBazowy.Wzgorza]: 'Wzgorza',
  [TerenBazowy.Gory]: 'Gory',
  [TerenBazowy.PlytkieMorze]: 'PlytkieMorze',
  [TerenBazowy.Morze]: 'Morze',
  [TerenBazowy.Pustynia]: 'Pustynia',
  [TerenBazowy.Polarny]: 'Polarny',
};
// Odwrotne mapowanie nazwa Rust -> wartosc enumu webu (jawnie, bez zgadywania typu wartosci).
const RUST_TO_TB = {
  Laka: TerenBazowy.Laka,
  Rownina: TerenBazowy.Rownina,
  Wzgorza: TerenBazowy.Wzgorza,
  Gory: TerenBazowy.Gory,
  PlytkieMorze: TerenBazowy.PlytkieMorze,
  Morze: TerenBazowy.Morze,
  Pustynia: TerenBazowy.Pustynia,
  Polarny: TerenBazowy.Polarny,
};

// Wagi wylosowania terenu (tylko do generatora; wartosci podane w wektorze jako nazwy Rust).
const TERRAIN_WEIGHTS = [
  ['Morze', 46], ['PlytkieMorze', 10], ['Laka', 14], ['Rownina', 8],
  ['Wzgorza', 7], ['Gory', 5], ['Pustynia', 6], ['Polarny', 4],
];
const TERRAIN_TOTAL = TERRAIN_WEIGHTS.reduce((s, [, w]) => s + w, 0);

const rng = G.mulberry32(20261031);
const rnd = () => rng();
const rint = (n) => Math.floor(rnd() * n);

function mkHex(tbRust) {
  return { terenBazowy: RUST_TO_TB[tbRust], nakladka: Nakladka.Brak, rzeka: { obecna: false, krawedzie: [] } };
}
function pickTerrain() {
  let x = rnd() * TERRAIN_TOTAL;
  for (const [name, w] of TERRAIN_WEIGHTS) {
    if (x < w) return name;
    x -= w;
  }
  return 'Morze';
}
function randomMap(w, h) {
  const hexes = {};
  for (let r = 0; r < h; r++) {
    for (let q = 0; q < w; q++) hexes[`${q},${r}`] = mkHex(pickTerrain());
  }
  return hexes;
}
function dumpMap(hexes) {
  return Object.entries(hexes).map(([k, hx]) => [k, TB_TO_RUST[hx.terenBazowy]]);
}
// Wynik skrocony do terenow (zmiany w landsea dotykaja terenBazowy; overlay/rzeka nie sa porownywane).
function dumpTerrains(hexes) {
  return Object.entries(hexes).map(([k, hx]) => [k, TB_TO_RUST[hx.terenBazowy]]);
}
function randomScores(hexes) {
  const scores = {};
  for (const k of Object.keys(hexes)) {
    // dwa miejsca po przecinku -> duzo remisow i roznic dokladnie 0.04 / 0.11
    scores[k] = rnd() < 0.08 ? 0.11 : Math.round(rnd() * 100) / 100;
  }
  return scores;
}
function mapToScoreMap(scores) {
  const m = new Map();
  for (const [k, v] of Object.entries(scores)) m.set(k, v);
  return m;
}

const TARGETS_FIXED = [0.15, 0.85, 0.2, 0.3, 0.5, 0.6, 0.1, 0.9, 0.149999, 0.850001, 0.25, 0.75];

const cases = { apply: [], sort: [], rebalance: [], assign: [] };

// --- applyLandFractionByScore ---------------------------------------------------------------
for (let i = 0; i < 260; i++) {
  const w = 2 + rint(8);
  const h = 2 + rint(8);
  const hexes = randomMap(w, h);
  const total = w * h;
  const scores = randomScores(hexes);
  let target;
  const mode = i % 4;
  if (mode === 0) target = TARGETS_FIXED[rint(TARGETS_FIXED.length)];
  else if (mode === 1) target = rnd() * 1.2 - 0.1;
  else if (mode === 2) {
    // granica zaokraglenia Math.round: total*clamped = k + 0.5
    const k = rint(total);
    target = (k + 0.5) / total;
  } else target = 0.15 + rnd() * 0.7;
  const dimsKind = rint(10);
  const dims = dimsKind === 0 ? null : dimsKind === 1 ? [w, 0] : [w, h];
  const fill = rnd() < 0.5 ? 'center' : 'mask';
  const minMask = fill === 'mask' ? (rnd() < 0.5 ? 0.11 : [0.0, 0.05, 0.2, 0.5][rint(4)]) : 0.11;

  const beforeMap = dumpMap(hexes);
  const ws = JSON.parse(JSON.stringify(hexes));
  const sm = mapToScoreMap(scores);
  const adjusted = G.applyLandFractionByScore(
    ws,
    sm,
    target,
    dims ? dims[0] : undefined,
    dims ? dims[1] : undefined,
    fill,
    minMask,
  );
  cases.apply.push({
    id: `ap_${i}`,
    target,
    dims,
    fill,
    min: minMask,
    total,
    map: beforeMap,
    scores: Object.entries(scores),
    expect: { adjusted, terrains: dumpTerrains(ws) },
  });
}

// --- rebalanceLandFractionWithMargins -------------------------------------------------------
for (let i = 0; i < 90; i++) {
  const w = 4 + rint(9);
  const h = 4 + rint(9);
  const hexes = randomMap(w, h);
  const scores = randomScores(hexes);
  const target = i % 3 === 0 ? TARGETS_FIXED[rint(TARGETS_FIXED.length)] : 0.15 + rnd() * 0.7;
  const beforeMap = dumpMap(hexes);
  const ws = JSON.parse(JSON.stringify(hexes));
  G.rebalanceLandFractionWithMargins(ws, mapToScoreMap(scores), target, w, h);
  cases.rebalance.push({
    id: `rb_${i}`,
    target,
    w,
    h,
    map: beforeMap,
    scores: Object.entries(scores),
    expect: { terrains: dumpTerrains(ws) },
  });
}

// --- sortLandKeysForErosion (instrumentowana kopia) ------------------------------------------
for (let i = 0; i < 120; i++) {
  const w = 1 + rint(9);
  const h = 1 + rint(9);
  const hexes = randomMap(w, h);
  const scores = randomScores(hexes);
  const keysAll = Object.keys(hexes);
  // podzbior w losowej kolejnosci (jak dry-land filter w webie)
  const keys = keysAll.filter(() => rnd() < 0.8).sort(() => rnd() - 0.5);
  const dimsKind = rint(8);
  const dims = dimsKind === 0 ? null : [w, h];
  const sortedWeb = GI.sortLandKeysForErosion(
    keys,
    hexes,
    mapToScoreMap(scores),
    dims ? dims[0] : 1,
    dims ? dims[1] : 1,
  );
  cases.sort.push({
    id: `so_${i}`,
    w,
    h,
    dims,
    map: dumpMap(hexes),
    scores: Object.entries(scores),
    keys,
    expect: sortedWeb,
  });
}

// --- assignContinentIndices -----------------------------------------------------------------
for (let i = 0; i < 40; i++) {
  const w = 1 + rint(12);
  const h = 1 + rint(12);
  const nc = 1 + rint(5);
  const centers = [];
  for (let c = 0; c < nc; c++) {
    // czesc centrow powtorzona (remisy -> pierwszy indeks)
    if (c > 0 && rnd() < 0.3) centers.push({ ...centers[0] });
    else centers.push({ nq: rnd(), nr: rnd(), radius: 0.1 + rnd() * 0.5 });
  }
  const m = G.assignContinentIndices(w, h, centers);
  cases.assign.push({
    id: `as_${i}`,
    w,
    h,
    centers: centers.map((c) => [c.nq, c.nr, c.radius]),
    expect: Array.from(m.entries()),
  });
}

const counts = Object.fromEntries(Object.entries(cases).map(([k, v]) => [k, v.length]));
const payload = {
  meta: {
    temat: 'R-RUSTPORT-P6-M06A5-LAD-MORZE-ULAMEK-Q1',
    gen_helpers_pin: 'edb8fb56',
    gen_helpers_sha256: sha(originalSrc),
    symbols: [
      'assignContinentIndices', 'sortLandKeysForErosion (instr. eksport w kopii)',
      'applyLandFractionByScore', 'rebalanceLandFractionWithMargins',
    ],
    terrain_map: TB_TO_RUST,
    seed: 20261031,
    uwaga: 'Komparator sortowania web jest niekoherentny (tolerancje); TimSort V8 odtwarza js_array_sort_by.',
  },
  counts,
  cases,
};
writeFileSync(out, JSON.stringify(payload));
console.log(JSON.stringify({ out, counts }));
