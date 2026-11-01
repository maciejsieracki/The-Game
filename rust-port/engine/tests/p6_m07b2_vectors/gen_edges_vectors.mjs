// P6.M07B-Q2 partia 1 - generator wektorow z URUCHOMIONEGO kodu weba (pin edb8fb56).
//
// Uzycie (katalog tymczasowy poza repo):
//   git archive -o <DIR>/pin.tar edb8fb56 gra/src gra/data ; tar -x -f <DIR>/pin.tar -C <DIR>
//   node --experimental-strip-types gen_edges_vectors.mjs <DIR>/gra/src/map/gen-helpers.ts \
//        <DIR>/gra/src/types/hex.ts <wyjscie.json>
//
// Skrypt wyciaga DOSLOWNIE tekst funkcji/stalych z pinu (po nazwie, do domykajacej klamry
// na poziomie zerowym), uruchamia je i zapisuje wyniki. Wszystkie `out`/`d` pochodza z weba.
// Mapy heksow (wejscie) obejmuja: wode (Morze, PlytkieMorze), lad suchy, gory/wzgorza,
// nakladki (las, zloza) takze na heksach wodnych (lekcja a), istniejace krawedzie rzeki,
// brakujace heksy. Ziarno i domena sa stale -> wyjscie deterministyczne.
// Format: wiersze `maps` (indeksowane przez `m`), `cases` z polem `fn`.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const SEED = 0x5eed2027;
const PIN = 'edb8fb56';
const MAP_R = 4; // domena map i sciezek: |q|,|r| <= 4 (ring heksow ~91)
const N_MAPS = 150;

const [, , srcArg, hexArg, outArg] = process.argv;
if (!srcArg || !hexArg || !outArg) {
  console.error('usage: node --experimental-strip-types gen_edges_vectors.mjs <gen-helpers.ts> <types/hex.ts> <out.json>');
  process.exit(2);
}

// ---- 1. ekstrakcja z pinu --------------------------------------------------------------
const lines = fs.readFileSync(srcArg, 'utf8').split('\n');
const hexSrc = fs.readFileSync(hexArg, 'utf8');

function extract(prefix, kind) {
  const i = lines.findIndex((l) => l.startsWith(prefix));
  if (i < 0) throw new Error(`brak w pinie: ${prefix}`);
  const out = [];
  for (let j = i; j < lines.length; j++) {
    out.push(lines[j]);
    if (kind === 'fn' && lines[j] === '}') break;
    if (kind === 'const' && lines[j].trimEnd().endsWith(';')) break;
  }
  return out.join('\n');
}

// enum TerenBazowy z pinu (types/hex.ts) -> obiekt JS o tych samych wartosciach tekstowych
const enumStart = hexSrc.indexOf('export enum TerenBazowy {');
if (enumStart < 0) throw new Error('brak enum TerenBazowy w pinie');
const enumBody = hexSrc.slice(enumStart, hexSrc.indexOf('}', enumStart));
const tbEntries = {};
for (const m of enumBody.matchAll(/(\w+)\s*=\s*'([^']+)'/g)) tbEntries[m[1]] = m[2];
const tbStub = `const TerenBazowy = ${JSON.stringify(tbEntries)};`;

const parts = [
  'export type RiverCoord = { q: number; r: number };',
  tbStub,
  extract('export const HEX_DIRECTIONS', 'const'),
  extract('export const RIVER_TURN_WINDOW_HEX', 'const'),
  extract('export const RIVER_TURN_WINDOW_MAX_SUM', 'const'),
  extract('function hexAxialDistance', 'fn'),
  extract('export function hexKey', 'fn'),
  extract('function isWaterTerrainLocal', 'fn'),
  extract('export function isDryLandTerrain', 'fn'),
  extract('function isReliefTerrain', 'fn'),
  extract('function canRiverFlowThrough', 'fn'),
  extract('function riverHexDirDelta', 'fn'),
  extract('function neighborDirIndex', 'fn'),
  extract('function signedRiverDirDelta', 'fn'),
  extract('function pathSegmentDirs', 'fn'),
  extract('function pathSignedTurnDeltas', 'fn'),
  extract('export function riverSegmentUnitVector', 'fn'),
  extract('export function riverPathHasSharpUTurn', 'fn'),
  extract('export function riverPathViolatesTurnWindow', 'fn'),
  extract('export function sanitizeRiverPath', 'fn'),
  extract('export function repairRiverPathAdjacency', 'fn'),
  extract('function sanitizeRiverTurnWindow', 'fn'),
  extract('function canReceiveRiverYieldMark', 'fn'),
  extract('function markRiverEdge(', 'fn'),
  extract('function markRiverEdgePair', 'fn'),
  extract('function riverHexCornerStep', 'fn'),
  extract('function walkRiverHexPerimeter', 'fn'),
  extract('function riverCornersAlongHexEdges', 'fn'),
  extract('function riverEdgeBetweenCorners', 'fn'),
  extract('function riverTransitEdgeIndices', 'fn'),
  extract('function simplifyRiverRenderPath', 'fn'),
  extract('function markRiverTransitEdgesOnPath', 'fn'),
].map((s) => s.replace(/^function /m, 'export function '));

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'm07b2-edges-'));
fs.writeFileSync(path.join(tmp, 'package.json'), '{"type":"module"}\n');
const tsFile = path.join(tmp, 'web-edges.ts');
fs.writeFileSync(tsFile, parts.join('\n\n') + '\n');
const web = await import(pathToFileURL(tsFile).href);

// ---- 2. PRNG, mapy, sciezki ------------------------------------------------------------
let st = SEED >>> 0;
function rnd() {
  st = (st + 0x6d2b79f5) >>> 0;
  let t = st;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const ri = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
const inDom = (q, r) => Math.abs(q) <= MAP_R && Math.abs(r) <= MAP_R && Math.abs(q + r) <= MAP_R;
const keyOf = (q, r) => `${q},${r}`;

const TERRAIN_KEYS = [
  'morze', 'morze', 'plytkie_morze', 'plytkie_morze', 'laka', 'laka', 'laka',
  'rownina', 'rownina', 'pustynia', 'wzgorza', 'gory', 'polarny',
];
const OVERLAYS = ['brak', 'brak', 'las', 'las', 'zloze_rudy', 'zloze_gliny', 'zloze_konia'];

function randomMap() {
  const hexes = [];
  for (let q = -MAP_R; q <= MAP_R; q++) {
    for (let r = -MAP_R; r <= MAP_R; r++) {
      if (!inDom(q, r)) continue;
      if (rnd() < 0.08) continue; // brakujacy heks
      const t = pick(TERRAIN_KEYS);
      const n = pick(OVERLAYS);
      const z = rnd() < 0.15;
      let rz = null;
      const u = rnd();
      if (u < 0.22) {
        const k = ri(1, 3);
        const edges = [];
        while (edges.length < k) {
          const e = ri(0, 5);
          if (!edges.includes(e)) edges.push(e);
        }
        rz = { obecna: true, krawedzie: edges };
      } else if (u < 0.27) {
        rz = { obecna: false, krawedzie: [] };
      }
      hexes.push({ k: keyOf(q, r), q, r, t, n, z, rz });
    }
  }
  return hexes;
}

function hexesObj(list) {
  const o = {};
  for (const h of list) {
    o[h.k] = {
      q: h.q,
      r: h.r,
      terenBazowy: h.t,
      nakladka: h.n,
      zloze: h.z ? { typ: 'test' } : undefined,
      rzeka: h.rz === null ? undefined : { obecna: h.rz.obecna, krawedzie: [...h.rz.krawedzie] },
    };
  }
  return o;
}

// stan rzeki znormalizowany: (obecna, krawedzie) dla kazdego klucza mapy wejsciowej
function riverSnapshot(hexes, list) {
  return list.map((h) => {
    const hx = hexes[h.k];
    return [h.k, hx ? (hx.rzeka?.obecna ? 1 : 0) : 0, hx ? [...(hx.rzeka?.krawedzie ?? [])] : []];
  });
}
function diffSnapshot(before, after) {
  const d = [];
  for (let i = 0; i < before.length; i++) {
    if (JSON.stringify(before[i]) !== JSON.stringify(after[i])) d.push(after[i]);
  }
  return d;
}

// sciezka losowa; tryby: 'walk', 'jump' (skoki niesasiednie), 'loop' (powrot na wczesniejszy heks)
function randomPath(len, mode) {
  const p = [[ri(-MAP_R, MAP_R), ri(-MAP_R, MAP_R)]];
  while (!inDom(p[0][0], p[0][1])) p[0] = [ri(-2, 2), ri(-2, 2)];
  for (let k = 0; k < len; k++) {
    const [cq, cr] = p[p.length - 1];
    if (mode === 'jump' && rnd() < 0.2) {
      const nq = cq + ri(-2, 2);
      const nr = cr + ri(-2, 2);
      if (inDom(nq, nr)) { p.push([nq, nr]); continue; }
    }
    if (mode === 'loop' && p.length > 3 && rnd() < 0.2) {
      const [bq, br] = p[ri(0, p.length - 2)];
      p.push([bq, br]);
      continue;
    }
    let ok = false;
    for (let t = 0; t < 10 && !ok; t++) {
      const [dq, dr] = pick(DIRS);
      if (inDom(cq + dq, cr + dr)) { p.push([cq + dq, cr + dr]); ok = true; }
    }
    if (!ok) break;
  }
  return p;
}
// plaski ciag [q0, r0, q1, r1, ...] (format pola `p` / `out`)
const flat = (p) => p.flatMap(([q, r]) => [q, r]);
const toObjs = (p) => p.map(([q, r]) => ({ q, r }));

// ---- 3. mapy i przypadki -----------------------------------------------------------------
const maps = [];
for (let i = 0; i < N_MAPS; i++) maps.push(randomMap());
const hexObjs = maps.map((m) => hexesObj(m));

const cases = [];
const stats = {};
const bump = (k) => { stats[k] = (stats[k] ?? 0) + 1; };

// canReceiveRiverYieldMark: kazdy klucz mapy + brakujacy
for (let i = 0; i < 3000; i++) {
  const m = i % N_MAPS;
  const list = maps[m];
  const h = i % 7 === 0 ? { k: '99,99' } : pick(list);
  const out = web.canReceiveRiverYieldMark(hexObjs[m][h.k]);
  cases.push({ fn: 'canreceive', m, k: h.k, out });
  bump('canreceive');
}

// markRiverEdge / markRiverEdgePair: losowe krawedzie -1..6 (poza kontraktem 0..5 tylko -1 i 6)
for (const [name, fn] of [['mark_edge', web.markRiverEdge], ['mark_pair', web.markRiverEdgePair]]) {
  for (let i = 0; i < 2500; i++) {
    const m = i % N_MAPS;
    const list = maps[m];
    const h = i % 11 === 0 ? { q: 40, r: 40 } : pick(list);
    const e = i % 13 === 0 ? -1 : ri(0, 5);
    const hx = hexesObj(list);
    const before = riverSnapshot(hx, list);
    fn(hx, h.q, h.r, e);
    const d = diffSnapshot(before, riverSnapshot(hx, list));
    cases.push({ fn: name, m, q: h.q, r: h.r, e, d });
    bump(name);
  }
}

// markRiverTransitEdgesOnPath: sciezki 0..14 krokow, tryby walk/jump/loop
for (let i = 0; i < 3000; i++) {
  const m = i % N_MAPS;
  const list = maps[m];
  const mode = ['walk', 'walk', 'jump', 'loop'][i % 4];
  const p = randomPath(ri(0, 14), mode);
  const hx = hexesObj(list);
  const before = riverSnapshot(hx, list);
  web.markRiverTransitEdgesOnPath(hx, toObjs(p));
  const d = diffSnapshot(before, riverSnapshot(hx, list));
  cases.push({ fn: 'mark_transit', m, p: flat(p), d });
  bump('mark_transit');
}

// simplifyRiverRenderPath
for (let i = 0; i < 3000; i++) {
  const mode = ['walk', 'jump', 'loop'][i % 3];
  const p = randomPath(ri(0, 14), mode);
  const out = web.simplifyRiverRenderPath(toObjs(p));
  cases.push({ fn: 'simplify', p: flat(p), out: flat(out.map((h) => [h.q, h.r])) });
  bump('simplify');
}

// sanitizeRiverTurnWindow (uzywa sanitizeRiverPath + repairRiverPathAdjacency + okna)
for (let i = 0; i < 3000; i++) {
  const m = i % N_MAPS;
  const list = maps[m];
  const mode = ['walk', 'jump', 'loop', 'walk'][i % 4];
  const p = randomPath(ri(0, 16), mode);
  const src = i % 9 === 0 ? '99,99' : pick(list).k;
  const out = web.sanitizeRiverTurnWindow(toObjs(p), hexObjs[m], src);
  cases.push({ fn: 'sanitize_window', m, p: flat(p), src, out: flat(out.map((h) => [h.q, h.r])) });
  bump('sanitize_window');
}

// geometria obwodu: wyczerpujaco
for (let f = 0; f < 6; f++) {
  for (const cw of [true, false]) {
    cases.push({ fn: 'corner_step', f, cw, out: web.riverHexCornerStep(f, cw) });
    bump('corner_step');
    for (let t = 0; t < 6; t++) {
      cases.push({ fn: 'walk', f, t, cw, out: web.walkRiverHexPerimeter(f, t, cw) });
      bump('walk');
    }
  }
}
for (let a = 0; a < 6; a++) {
  for (let b = 0; b < 6; b++) {
    cases.push({ fn: 'edge_between', a, b, out: web.riverEdgeBetweenCorners(a, b) });
    bump('edge_between');
  }
}
for (let i = -12; i <= 12; i++) {
  for (let o = -12; o <= 12; o++) {
    for (const par of [0, 1]) {
      cases.push({ fn: 'corners', i, o, par, out: web.riverCornersAlongHexEdges(i, o, par) });
      bump('corners');
    }
  }
}
for (let i = -6; i <= 12; i++) {
  for (let o = -6; o <= 12; o++) {
    for (const par of [0, 1]) {
      cases.push({ fn: 'transit_idx', i, o, par, out: web.riverTransitEdgeIndices(i, o, par) });
      bump('transit_idx');
    }
  }
}

const doc = {
  format: 'p6-m07b2-edges-v1',
  pin: PIN,
  seed: SEED,
  domain_r: MAP_R,
  terrain_keys: TERRAIN_KEYS,
  stats,
  maps,
  cases,
};
fs.writeFileSync(outArg, JSON.stringify(doc) + '\n');
console.log(JSON.stringify({ cases: cases.length, stats, bytes: fs.statSync(outArg).size }));
