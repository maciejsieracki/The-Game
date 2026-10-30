// Generator wektorow P6.M06A6 (rodzina Pangei i kontynentow, partia 1):
// erodePangeaBboxLowScoreRim (web :3551) i carvePangeaLongSideGulfs (:3606) - prywatne, wiec
// uruchamiane z INSTRUMENTOWANEJ KOPII gen-helpers.ts (jedyna zmiana: `export` przed `function`);
// applyLandFractionByContinent (:3701) - eksportowana, uruchamiana z oryginalu.
// rebalanceLandFractionPangea (:3667) NIE jest generowana: zalezy od fillPangeaAnnularSeaCorridors
// (:4595) i ensurePangeaSingleContinent (:4375), ktore nie sa jeszcze portowane (RUNDA-2).
// URUCHAMIA prawdziwy kod TS weba (pin edb8fb56) - logiki nie przepisujemy.
//
// Uzycie (z katalogu tego pliku; loader obok):
//   node --experimental-transform-types --no-warnings --import ./m06a-loader-register.mjs \
//        ./gen-m06a6-pangea-vectors.mjs <WEB_ROOT> <KATALOG_WYJSCIOWY>
// WEB_ROOT = `git archive edb8fb56 gra/src gra/data` rozpakowane POZA repo.
// Mapa: [klucz, terrainRust]. NaN zapisany jako napis "NaN". Perm: 256 liczb.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const root = process.argv[2];
const outDir = process.argv[3];
if (!root || !outDir) {
  console.error('uzycie: gen-m06a6-pangea-vectors.mjs <WEB_ROOT> <KATALOG_WYJSCIOWY>');
  process.exit(2);
}
const mapDir = `${root}/gra/src/map`;
const originalSrc = readFileSync(`${mapDir}/gen-helpers.ts`, 'utf8');
const sha = (s) => createHash('sha256').update(s).digest('hex');

// Instrumentowana kopia: jedyna zmiana to eksport dwoch prywatnych funkcji Pangei.
let instrSrc = originalSrc;
for (const name of ['erodePangeaBboxLowScoreRim', 'carvePangeaLongSideGulfs']) {
  const before = instrSrc;
  instrSrc = instrSrc.replace(`\nfunction ${name}(`, `\nexport function ${name}(`);
  if (instrSrc === before) throw new Error(`instrumentacja ${name} nie zadzialala`);
}
const instrPath = `${mapDir}/gen-helpers.m06a6-instr.ts`;
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

const TERRAIN_WEIGHTS = [
  ['Morze', 46], ['PlytkieMorze', 10], ['Laka', 14], ['Rownina', 8],
  ['Wzgorza', 7], ['Gory', 5], ['Pustynia', 6], ['Polarny', 4],
];
// Gesty lad (do przypadkow z duzym bboxem lądu i progami liczności >= 80).
const TERRAIN_WEIGHTS_LAND = [
  ['Morze', 8], ['PlytkieMorze', 2], ['Laka', 40], ['Rownina', 20],
  ['Wzgorza', 12], ['Gory', 4], ['Pustynia', 8], ['Polarny', 2],
];
const sumW = (ws) => ws.reduce((s, [, w]) => s + w, 0);

const rng = G.mulberry32(20261101);
const rnd = () => rng();
const rint = (n) => Math.floor(rnd() * n);

function mkHex(tbRust) {
  return { terenBazowy: RUST_TO_TB[tbRust], nakladka: Nakladka.Brak, rzeka: { obecna: false, krawedzie: [] } };
}
function pickTerrain(ws) {
  let x = rnd() * sumW(ws);
  for (const [name, w] of ws) {
    if (x < w) return name;
    x -= w;
  }
  return 'Morze';
}
function randomMap(w, h, ws = TERRAIN_WEIGHTS) {
  const hexes = {};
  for (let r = 0; r < h; r++) {
    for (let q = 0; q < w; q++) hexes[`${q},${r}`] = mkHex(pickTerrain(ws));
  }
  return hexes;
}
function dumpMap(hexes) {
  return Object.entries(hexes).map(([k, hx]) => [k, TB_TO_RUST[hx.terenBazowy]]);
}
function randomScores(hexes) {
  const scores = {};
  for (const k of Object.keys(hexes)) {
    scores[k] = rnd() < 0.08 ? 0.11 : Math.round(rnd() * 100) / 100;
  }
  return scores;
}
function mapToScoreMap(scores) {
  const m = new Map();
  for (const [k, v] of Object.entries(scores)) m.set(k, v);
  return m;
}
const permArr = (perm) => Array.from(perm);
const numOut = (x) => (Number.isNaN(x) ? 'NaN' : x);

// ---------------------------------------------------------------------------------------------
// erodePangeaBboxLowScoreRim: parametry (targetBboxFill, maxErode) podawane jawnie.
// ---------------------------------------------------------------------------------------------
const ERODE_TARGETS = [0.74, 0.5, 0.6, 0.7, 0.73, 0.75, 0.8, 0.1, 0.0];
function erodeCase(id, hexes, scores, target, maxErode) {
  const ws = JSON.parse(JSON.stringify(hexes));
  const sm = mapToScoreMap(scores);
  const before = dumpMap(hexes);
  const eroded = GI.erodePangeaBboxLowScoreRim(ws, sm, target, maxErode);
  return {
    id,
    target: numOut(target),
    max: maxErode,
    map: before,
    scores: Object.entries(scores),
    expect: { eroded, terrains: dumpMap(ws) },
  };
}

// ---------------------------------------------------------------------------------------------
// carvePangeaLongSideGulfs: perm + maxAspect + maxCarve.
// ---------------------------------------------------------------------------------------------
function carveCase(id, hexes, scores, perm, maxAspect, maxCarve) {
  const ws = JSON.parse(JSON.stringify(hexes));
  const sm = mapToScoreMap(scores);
  const before = dumpMap(hexes);
  const carved = GI.carvePangeaLongSideGulfs(ws, sm, perm, maxAspect, maxCarve);
  return {
    id,
    perm: permArr(perm),
    maxAspect: numOut(maxAspect),
    maxCarve,
    map: before,
    scores: Object.entries(scores),
    expect: { carved, terrains: dumpMap(ws) },
  };
}

// ---------------------------------------------------------------------------------------------
// applyLandFractionByContinent: continentOf (Map), nContinents, target, dims.
// ---------------------------------------------------------------------------------------------
function contCase(id, hexes, scores, continentEntries, nContinents, target, dims) {
  const ws = JSON.parse(JSON.stringify(hexes));
  const sm = mapToScoreMap(scores);
  const cm = new Map(continentEntries);
  const before = dumpMap(hexes);
  const adjusted = G.applyLandFractionByContinent(
    ws,
    sm,
    cm,
    nContinents,
    target,
    dims ? dims[0] : undefined,
    dims ? dims[1] : undefined,
  );
  return {
    id,
    target: numOut(target),
    nContinents,
    dims,
    map: before,
    scores: Object.entries(scores).map(([k, v]) => [k, numOut(v)]),
    continentOf: continentEntries,
    expect: { adjusted, terrains: dumpMap(ws) },
  };
}

// --- losowe przypadki erozji (N=160) ----------------------------------------------------------
const erodeRand = [];
for (let i = 0; i < 160; i++) {
  const w = 3 + rint(12);
  const h = 3 + rint(12);
  const hexes = randomMap(w, h, i % 2 === 0 ? TERRAIN_WEIGHTS_LAND : TERRAIN_WEIGHTS);
  const scores = randomScores(hexes);
  const target = i % 3 === 0 ? ERODE_TARGETS[rint(ERODE_TARGETS.length)] : 0.3 + rnd() * 0.6;
  const maxErode = i % 4 === 0 ? [0, 1, 2, 5][rint(4)] : [1200, 40, 9, 300][rint(4)];
  erodeRand.push(erodeCase(`er_${i}`, hexes, scores, target, maxErode));
}

// --- przypadki brzegowe erozji (blok 10x10 z rogami; liczba lądu L wokol progu 0.74) --------
function blockLandKeys(bw, bh, count, rngFn) {
  // rogi zawsze w zbiorze (bbox = blok); reszta losowo
  const corners = [[0, 0], [bw - 1, bh - 1], [0, bh - 1], [bw - 1, 0]].filter(
    (p, i, a) => a.findIndex((x) => x[0] === p[0] && x[1] === p[1]) === i,
  );
  const rest = [];
  for (let r = 0; r < bh; r++) for (let q = 0; q < bw; q++) {
    if (!corners.some(([cq, cr]) => cq === q && cr === r)) rest.push([q, r]);
  }
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(rngFn() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return [...corners, ...rest].slice(0, count).map(([q, r]) => `${q},${r}`);
}
function blockMap(bw, bh, mw, mh, landKeys, landTerrain) {
  const set = new Set(landKeys);
  const hexes = {};
  for (let r = 0; r < mh; r++) for (let q = 0; q < mw; q++) {
    const k = `${q},${r}`;
    const inBlock = q < bw && r < bh;
    hexes[k] = mkHex(inBlock && set.has(k) ? landTerrain() : 'Morze');
  }
  return hexes;
}
const edgeErode = [];
let eid = 0;
for (const L of [73, 74, 75, 4, 50, 99, 100]) {
  for (const target of [0.74, 0.75, 0.73]) {
    for (const maxErode of [1200, 0, 1, 3]) {
      const keys = blockLandKeys(10, 10, L, rnd);
      const hexes = blockMap(10, 10, 12, 12, keys, () => ['Laka', 'Rownina', 'Gory'][rint(3)]);
      // remisy wynikow: wszystkie wyniki rowne (tie-break po odleglosci), i warianty roznic 0.02
      const variant = eid % 3;
      const scores = {};
      for (const k of Object.keys(hexes)) {
        scores[k] = variant === 0 ? 0.5 : variant === 1 ? (rint(2) ? 0.11 : 0.13) : Math.round(rnd() * 100) / 100;
      }
      edgeErode.push(erodeCase(`ee_${eid++}`, hexes, scores, target, maxErode));
    }
  }
}
// tolerancja score 0.02 dokladnie: 0.13-0.11 (IEEE > 0.02) i 0.12-0.10
for (const [a, b] of [[0.13, 0.11], [0.12, 0.10], [0.11, 0.13], [0.5, 0.48], [0.03, 0.01]]) {
  const keys = blockLandKeys(10, 10, 74, rnd);
  const hexes = blockMap(10, 10, 12, 12, keys, () => 'Laka');
  const scores = {};
  for (const k of Object.keys(hexes)) scores[k] = rint(2) ? a : b;
  edgeErode.push(erodeCase(`ee_${eid++}`, hexes, scores, 0.74, 1200));
}
// pusta mapa lądu i brak lądu powyzej progu
edgeErode.push(erodeCase(`ee_${eid++}`, blockMap(3, 3, 3, 3, [], () => 'Laka'), {}, 0.74, 1200));

// --- losowe przypadki Pangei: carve (N=160) ----------------------------------------------------
const carveRand = [];
for (let i = 0; i < 160; i++) {
  const w = 4 + rint(40);
  const h = 2 + rint(14);
  const hexes = randomMap(w, h, TERRAIN_WEIGHTS_LAND);
  const scores = randomScores(hexes);
  const perm = G.buildPermTable(G.mulberry32(1000 + i));
  const maxAspect = [1.85, 1.85, 1.0, 2.5, 1.5][rint(5)];
  const maxCarve = [900, 900, 0, 1, 7, 60][rint(6)];
  carveRand.push(carveCase(`cv_${i}`, hexes, scores, perm, maxAspect, maxCarve));
}

// --- przypadki brzegowe carve: prog 80 lądu, aspect 1.85, glebokosc, blisko srodka -------------
const edgeCarve = [];
let cid = 0;
for (const [bw, bh] of [[37, 20], [20, 37], [38, 20], [40, 10], [40, 12], [40, 13], [25, 10], [30, 12], [41, 20], [10, 40]]) {
  for (const L of [79, 80, 81]) {
    if (L > bw * bh) continue;
    const keys = blockLandKeys(bw, bh, L, rnd);
    const hexes = blockMap(bw, bh, bw + 2, bh + 2, keys, () => ['Laka', 'Rownina'][rint(2)]);
    const scores = {};
    for (const k of Object.keys(hexes)) scores[k] = Math.round(rnd() * 100) / 100;
    const perm = G.buildPermTable(G.mulberry32(5000 + cid));
    edgeCarve.push(carveCase(`ce_${cid++}`, hexes, scores, perm, 1.85, 900));
    // ten sam przypadek z maxCarve 1 i z maxAspect dokladnie rownym aspektowi (1.85 dla 37x20)
    edgeCarve.push(carveCase(`ce_${cid++}`, hexes, scores, perm, bw / bh, 900));
    edgeCarve.push(carveCase(`ce_${cid++}`, hexes, scores, perm, 1.85, 1));
  }
}

// --- applyLandFractionByContinent (N=200 losowych + brzegowe) ---------------------------------
const TARGETS_FIXED = [0.15, 0.85, 0.2, 0.3, 0.5, 0.6, 0.1, 0.9, 0.149999, 0.850001, 0.25, 0.75];
const contRand = [];
for (let i = 0; i < 200; i++) {
  const w = 2 + rint(11);
  const h = 2 + rint(11);
  const hexes = randomMap(w, h);
  const scores = randomScores(hexes);
  const nContinents = 1 + rint(4);
  const entries = [];
  for (const k of Object.keys(hexes)) {
    const roll = rnd();
    if (roll < 0.1) continue; // brak wpisu -> ?? 0
    entries.push([k, roll < 0.2 ? -1 : roll < 0.3 ? nContinents + 2 : rint(nContinents)]);
  }
  let target;
  const mode = i % 5;
  if (mode === 0) target = TARGETS_FIXED[rint(TARGETS_FIXED.length)];
  else if (mode === 1) target = rnd() * 1.2 - 0.1;
  else if (mode === 2) target = i % 10 === 2 ? NaN : 0.15 + rnd() * 0.7;
  else target = 0.15 + rnd() * 0.7;
  const dimsKind = rint(10);
  const dims = dimsKind === 0 ? null : dimsKind === 1 ? [w, 0] : [w, h];
  contRand.push(contCase(`co_${i}`, hexes, scores, entries, nContinents, target, dims));
}
// brzegowe: zero zmian, NaN, nContinents 1, granica zaokraglenia Math.round
// nContinents = 0 pominiete: web rzuca TypeError (zoneKeys[-1]), patrz ZALOZENIE Z-N0 w dokumencie.
for (const [i, target, nc] of [[0, NaN, 2], [1, 0.5, 1], [3, 0.15, 3], [4, 0.85, 3], [5, 0.149999, 2]]) {
  const hexes = randomMap(6, 6);
  const scores = randomScores(hexes);
  const entries = Object.keys(hexes).map((k, j) => [k, j % Math.max(1, nc)]);
  contRand.push(contCase(`coe_${i}`, hexes, scores, entries, nc, target, [6, 6]));
}

// --- RUNDA 3 (dopisane NA KONCU; poprzednie przypadki i ich RNG bez zmian, prefiks zachowany) ---
// K08: wynik NaN w landScores (web: `reduce(...) || 1` -> NaN traktowany jak 0 -> dzielnik 1).
// Wartosc NaN trafia do sumy kontynentu (`?? 0` nie lapie NaN), wiec sumaAll = NaN.
const nanCases = [];
for (let i = 0; i < 48; i++) {
  const w = 3 + rint(8);
  const h = 3 + rint(8);
  const hexes = randomMap(w, h, TERRAIN_WEIGHTS_LAND);
  const scores = randomScores(hexes);
  const keys = Object.keys(hexes);
  const nNan = 1 + rint(3);
  for (let j = 0; j < nNan; j++) scores[keys[rint(keys.length)]] = NaN;
  const nContinents = 2 + rint(3);
  const entries = keys.map((k) => [k, rint(nContinents)]);
  const target = 0.15 + rnd() * 0.7;
  const dims = i % 3 === 0 ? null : [w, h];
  nanCases.push(contCase(`cn_${i}`, hexes, scores, entries, nContinents, target, dims));
}
// K11: suma wynikow = 0 (web: `|| 1`), bez NaN; bez gałęzi zerowej dzielnik 0 -> NaN.
for (let i = 0; i < 12; i++) {
  const w = 3 + rint(8);
  const h = 3 + rint(8);
  const hexes = randomMap(w, h, TERRAIN_WEIGHTS_LAND);
  const scores = {};
  for (const k of Object.keys(hexes)) scores[k] = 0;
  const keys = Object.keys(hexes);
  const nContinents = 2 + rint(2);
  const entries = keys.map((k) => [k, rint(nContinents)]);
  const target = 0.15 + rnd() * 0.7;
  nanCases.push(contCase(`cz_${i}`, hexes, scores, entries, nContinents, target, [w, h]));
}
// K09: |Δscore| == 0.04 DOKLADNIE (IEEE: 0.04-0.0 = 0.04; 0.08-0.04 = 0.04, bo 0.08 = 2*0.04).
// Mapa 15x15: dwa kandydaty morza (Sea) w srodku, reszta PlytkieMorze (nie-kandydat) i Laka
// (112 suchych, cel 113 -> dokladnie jeden przydział morza). Dla `>` remis rozstrzyga odległość
// od centrum; dla `>=` decyduje wynik. Kontrola: wysoki wynik bliżej centrum (zgodne obie gałęzie).
const tolCases = [];
{
  const W = 15;
  const H = 15;
  // dokladnie na progu (N) oraz N-1 / N+1 ulp (2^-57 w przedziale [2^-5, 2^-4)) dla `>` i `>=`
  const ULP = 2 ** -57;
  const pairs = [[0.0, 0.04], [0.04, 0.08], [0.0, 0.04 - ULP], [0.0, 0.04 + ULP]];
  const positions = [[4, 7, 7, 7], [10, 7, 7, 7], [7, 4, 7, 7], [7, 10, 7, 7], [5, 5, 7, 7], [2, 7, 7, 7]];
  let tid = 0;
  for (const [lo, hi] of pairs) {
    for (const [fq, fr, nq, nr] of positions) {
      for (const farHi of [true, false]) {
        const hexes = {};
        for (let r = 0; r < H; r++) for (let q = 0; q < W; q++) hexes[`${q},${r}`] = mkHex('PlytkieMorze');
        const fk = `${fq},${fr}`;
        const nk = `${nq},${nr}`;
        hexes[fk] = mkHex('Morze');
        hexes[nk] = mkHex('Morze');
        let placed = 0;
        for (let r = 0; r < H && placed < 112; r++) {
          for (let q = 0; q < W && placed < 112; q++) {
            const k = `${q},${r}`;
            if (k === fk || k === nk) continue;
            hexes[k] = mkHex('Laka');
            placed++;
          }
        }
        const scores = {};
        for (const k of Object.keys(hexes)) scores[k] = 0.0;
        scores[fk] = farHi ? hi : lo;
        scores[nk] = farHi ? lo : hi;
        tolCases.push(contCase(`ct_${tid++}`, hexes, scores, [], 1, 0.5, [W, H]));
      }
    }
  }
}

const cases = {
  erode: [...erodeRand, ...edgeErode],
  carve: [...carveRand, ...edgeCarve],
  contfrac: [...contRand, ...nanCases, ...tolCases],
};
const counts = Object.fromEntries(Object.entries(cases).map(([k, v]) => [k, v.length]));
const meta = {
  temat: 'R-RUSTPORT-P6-M06A6-LAD-MORZE-PANGEA-Q1',
  gen_helpers_pin: 'edb8fb56',
  gen_helpers_sha256: sha(originalSrc),
  symbols: [
    'erodePangeaBboxLowScoreRim (instr. eksport w kopii)',
    'carvePangeaLongSideGulfs (instr. eksport w kopii)',
    'applyLandFractionByContinent',
  ],
  terrain_map: TB_TO_RUST,
  seed: 20261101,
  uwaga: 'Komparator sortowania web niekoherentny (tolerancje); TimSort V8 odtwarza js_array_sort_by.',
};
const files = {
  erode: 'erode-vectors.json',
  carve: 'carve-vectors.json',
  contfrac: 'contfrac-vectors.json',
};
for (const [name, list] of Object.entries(cases)) {
  const payload = { meta, counts: { [name]: list.length }, cases: { [name]: list } };
  writeFileSync(`${outDir}/${files[name]}`, JSON.stringify(payload));
}
console.log(JSON.stringify({ outDir, counts }));
