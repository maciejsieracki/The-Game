// P4-1B-Q1 (R-RUSTPORT-P4-1B-Q1-ROADMASK): generator wektorow maski drog.
//
// Wykonuje URUCHOMIONY kod pinu `07d2fbd72`: `gra/src/map/road-network.ts`
// (`ROAD_DIRS` :32-34, `computeRoadMask` :75-86, `roadHexesToRefresh` :170-182).
// Modul pinu jest czysty (zero importow, :19-22), wiec laduje sie go bezposrednio w Node 22
// (usuwanie typow TS). Plik bierzemy z `git show`, nie z drzewa roboczego.
//
// Uzycie (z dowolnego katalogu w repo):
//   node rust-port/engine/tests/p4_1b_road_mask_vectors/gen.mjs          -> zapisuje vectors.json
//   node rust-port/engine/tests/p4_1b_road_mask_vectors/gen.mjs --check  -> EXIT 1 przy roznicy
//
// Strazniki SHA-256: wyciete fragmenty pinu (linie jak wyzej) musza miec zapisane skroty;
// zmiana pinu albo przesuniecie linii -> generator konczy sie bledem.

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const PIN = '07d2fbd72';
const PIN_PATH = 'gra/src/map/road-network.ts';
const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'vectors.json');

// Linie 1-indeksowane, wlacznie.
const EXCERPTS = [
  { name: 'ROAD_DIRS', from: 32, to: 34, sha256: '' },
  { name: 'computeRoadMask', from: 75, to: 86, sha256: '' },
  { name: 'roadHexesToRefresh', from: 170, to: 182, sha256: '' },
];
const EXPECTED_SHA = {
  ROAD_DIRS: '18180afa36a20e52221bd5e67e6147bb0390c993043e23524a6c3bfb26df8598',
  computeRoadMask: '407e65b9fb9b1ecae6e9f2ba55f181b26477f7f97b1042cdbc1971796042e08c',
  roadHexesToRefresh: '0911e3586e6807474b0eb65bbe9d2f52500308824c01436d388bfd0733aa717b',
};

const src = execFileSync('git', ['show', `${PIN}:${PIN_PATH}`], { cwd: HERE, encoding: 'utf8' });
const lines = src.split('\n');
for (const ex of EXCERPTS) {
  const text = lines.slice(ex.from - 1, ex.to).join('\n');
  ex.sha256 = createHash('sha256').update(text).digest('hex');
  if (ex.sha256 !== EXPECTED_SHA[ex.name]) {
    console.error(`STRAZNIK SHA: ${ex.name} ${ex.from}-${ex.to} = ${ex.sha256}, oczekiwano ${EXPECTED_SHA[ex.name]}`);
    process.exit(2);
  }
}

const tmp = mkdtempSync(join(tmpdir(), 'p4-1b-roadmask-'));
let mod;
try {
  const tsPath = join(tmp, 'road-network.ts');
  writeFileSync(tsPath, src);
  mod = await import(pathToFileURL(tsPath).href);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
const { ROAD_DIRS, computeRoadMask, roadHexesToRefresh } = mod;

// mulberry32 (jak gen-helpers.ts) — stale ziarno, deterministyczne mapy.
function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const key = (q, r) => `${q},${r}`;

// 1. Wszystkie 64 kombinacje sasiadow, kilka srodkow (takze ujemne wspolrzedne)
//    i wariant „srodek sam ma droge" (nie wplywa na maske).
const centers = [
  [0, 0],
  [5, -3],
  [-7, 11],
];
const combos = [];
for (const [cq, cr] of centers) {
  for (const centerHasRoad of [false, true]) {
    for (let bits = 0; bits < 64; bits++) {
      const roads = [];
      if (centerHasRoad) roads.push([cq, cr]);
      for (let i = 0; i < 6; i++) {
        if (bits & (1 << i)) roads.push([cq + ROAD_DIRS[i][0], cr + ROAD_DIRS[i][1]]);
      }
      const set = new Set(roads.map(([q, r]) => key(q, r)));
      const has = (q, r) => set.has(key(q, r));
      const mask = computeRoadMask(cq, cr, has);
      const refresh = roadHexesToRefresh(cq, cr, has).map(({ q, r }) => [q, r]);
      combos.push({ q: cq, r: cr, roads, mask, refresh });
    }
  }
}

// 2. Losowe mapy prostokatne (q in 0..w, r in 0..h), sasiad spoza mapy = brak drogi
//    (jak integrator `main.ts:3144-3147`: brak klucza heksa -> false). Maska dla KAZDEGO heksa.
const mapSpecs = [
  { width: 20, height: 12, seed: 0x1b0ad, density: 0.35 },
  { width: 17, height: 13, seed: 20261115, density: 0.6 },
  { width: 1, height: 1, seed: 7, density: 1.0 },
  { width: 3, height: 2, seed: 99, density: 1.0 },
  { width: 9, height: 9, seed: 424242, density: 0.15 },
];
const maps = [];
for (const spec of mapSpecs) {
  const rnd = mulberry32(spec.seed);
  const roadRows = [];
  const set = new Set();
  for (let r = 0; r < spec.height; r++) {
    let row = '';
    for (let q = 0; q < spec.width; q++) {
      const road = rnd() < spec.density;
      row += road ? '1' : '0';
      if (road) set.add(key(q, r));
    }
    roadRows.push(row);
  }
  const inBounds = (q, r) => q >= 0 && q < spec.width && r >= 0 && r < spec.height;
  const has = (q, r) => inBounds(q, r) && set.has(key(q, r));
  const masks = [];
  for (let r = 0; r < spec.height; r++) {
    const row = [];
    for (let q = 0; q < spec.width; q++) row.push(computeRoadMask(q, r, has));
    masks.push(row);
  }
  maps.push({ width: spec.width, height: spec.height, seed: spec.seed, roads: roadRows, masks });
}

const out = {
  pin: PIN,
  source: PIN_PATH,
  excerpts: EXCERPTS,
  road_dirs: ROAD_DIRS.map(([dq, dr]) => [dq, dr]),
  combos,
  maps,
};
const json = JSON.stringify(out) + '\n';

if (process.argv.includes('--check')) {
  const cur = readFileSync(OUT, 'utf8');
  if (cur !== json) {
    console.error('vectors.json NIEZGODNY z pinem');
    process.exit(1);
  }
  console.log('vectors.json zgodny z pinem');
} else {
  writeFileSync(OUT, json);
  const hexes = maps.reduce((a, m) => a + m.width * m.height, 0);
  console.log(`zapisano: combos=${combos.length} maps=${maps.length} hexes=${hexes}`);
}
for (const ex of EXCERPTS) console.log(`${ex.name} ${ex.from}-${ex.to} sha256=${ex.sha256}`);
