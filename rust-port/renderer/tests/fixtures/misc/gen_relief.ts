// Reference-vector generator for the REAL relief sampler wired into MOD-13
// (R-RUSTPORT-P4-24-MISC-RELIEF-WIRE-Q1).
//
// Runs the REAL web code of `edb8fb56` (`git archive edb8fb56 gra/src gra/data`,
// three@0.169.0, esbuild@0.24.0, node v22.22.0) WITHOUT any shim: bundled by
// `build_relief.mjs`, which has no plugin, so `render/rangeOverlay.ts` imports
// the real `./mapRenderStyle` and its `reliefSurfaceSampler`
// (`mapRenderStyle.ts:1107-1121` -> `powierzchniaReliefuY`, raycast into the
// hill / mountain variant of `teren-gory-wzgorza.ts`). There is no
// `__MISC_RELIEF` switch in this bundle (checked by `build_relief.mjs`).
//
// Records:
//   - `range`: `buildRangeOverlayGroup` on 4 maps that contain `Wzgorza` / `Gory`
//     (18 hex sets x 6 styles each; the hug styles drape the mine sheet over the
//     relief, the other styles cross the same hills flat);
//   - `samplers`: `reliefSurfaceSampler(teren, q, r, seed, R)(x, z)` probes as
//     binary64 bits (drape grid points + pseudo-random points), R in {1, 1.5},
//     including `null` for flat terrain.
//
// Usage: node gen_relief.mjs <out-dir>   (bundle produced by build_relief.mjs)

import * as THREE from 'three';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  buildRangeOverlayGroup, CULTURE_RANGE_STYLE, RELIGION_RANGE_STYLE, MINE_ELIGIBLE_STYLE,
  type RangeOverlayStyle,
} from '../websrc/gra/src/render/rangeOverlay';
import { reliefSurfaceSampler } from '../websrc/gra/src/render/mapRenderStyle';
import { TerenBazowy } from '../websrc/gra/src/types/hex';

// ------------------------------------------------------------- hashing (as gen.ts)
class Fnv {
  h = 0x811c9dc5 >>> 0;
  byte(b: number): void { this.h ^= b & 0xff; this.h = Math.imul(this.h, 0x01000193) >>> 0; }
  u32(v: number): void { v = v >>> 0; this.byte(v); this.byte(v >>> 8); this.byte(v >>> 16); this.byte(v >>> 24); }
  f32(v: number): void {
    const dv = new DataView(new ArrayBuffer(4)); dv.setFloat32(0, v, true);
    for (let i = 0; i < 4; i++) this.byte(dv.getUint8(i));
  }
}

function geoHash(g: THREE.BufferGeometry): number {
  const f = new Fnv();
  const pos = g.getAttribute('position');
  f.u32(pos.count);
  for (const name of ['position', 'normal', 'uv']) {
    const a = g.getAttribute(name) as THREE.BufferAttribute | undefined;
    if (!a) { f.u32(0); continue; }
    const arr = a.array as Float32Array;
    f.u32(arr.length);
    for (let i = 0; i < arr.length; i++) f.f32(arr[i]!);
  }
  if (g.index) {
    f.byte(1);
    const arr = g.index.array;
    f.u32(arr.length);
    for (let i = 0; i < arr.length; i++) f.u32(arr[i]!);
  } else {
    f.byte(0);
  }
  f.u32(g.groups.length);
  for (const gr of g.groups) { f.u32(gr.start); f.u32(gr.count); f.u32(gr.materialIndex ?? 0); }
  return f.h >>> 0;
}

function triCount(g: THREE.BufferGeometry): number {
  return g.index ? g.index.count / 3 : g.getAttribute('position').count / 3;
}

function hx(nums: ArrayLike<number>): string {
  const dv = new DataView(new ArrayBuffer(8));
  let out = '';
  for (let i = 0; i < nums.length; i++) {
    dv.setFloat64(0, nums[i]!, false);
    out += dv.getBigUint64(0, false).toString(16).padStart(16, '0');
  }
  return out;
}

type AnyMat = THREE.Material & { color?: THREE.Color; flatShading?: boolean; map?: THREE.Texture | null };

function matRec(m: AnyMat): Record<string, unknown> {
  const c = m.color ?? new THREE.Color(0xffffff);
  return {
    t: m.type, color: c.getHex(), lin: hx([c.r, c.g, c.b]), flat: m.flatShading ?? false,
    transparent: m.transparent, opacity: hx([m.opacity]), dw: m.depthWrite, dt: m.depthTest,
    side: m.side, po: m.polygonOffset, pof: hx([m.polygonOffsetFactor]), pou: hx([m.polygonOffsetUnits]),
    map: m.map ? true : false,
  };
}

function kindOf(o: THREE.Object3D): string {
  if ((o as THREE.InstancedMesh).isInstancedMesh) return 'InstancedMesh';
  if ((o as THREE.Mesh).isMesh) return 'Mesh';
  if ((o as THREE.LineSegments).isLineSegments) return 'LineSegments';
  if ((o as THREE.Line).isLine) return 'Line';
  return 'Object3D';
}

function overlayRecord(group: THREE.Group): Record<string, unknown> {
  group.updateMatrixWorld(true);
  const objects: unknown[] = [];
  for (const o of group.children) {
    const k = kindOf(o);
    const m = o as THREE.Mesh;
    const g = m.geometry;
    g.computeBoundingBox();
    const bb = g.boundingBox!;
    const pos = g.getAttribute('position').array as Float32Array;
    const rec: Record<string, unknown> = {
      k, name: o.name, ro: o.renderOrder, fc: o.frustumCulled, mat: matRec(m.material as AnyMat),
      geo: {
        t: g.type, vtx: g.getAttribute('position').count, tri: triCount(g), hash: geoHash(g),
        idx: g.index ? g.index.count : -1, nor: g.getAttribute('normal') ? true : false,
        bbox: hx([bb.min.x, bb.min.y, bb.min.z, bb.max.x, bb.max.y, bb.max.z]),
        pos: pos.length <= 900 ? hx(pos) : null,
      },
    };
    if (k === 'InstancedMesh') {
      const im = o as THREE.InstancedMesh;
      rec.count = im.count;
      rec.inst = hx(im.instanceMatrix.array as Float32Array);
    }
    if (Object.keys(o.userData).length > 0) rec.ud = o.userData;
    objects.push(rec);
  }
  return { name: group.name, objects };
}

// ------------------------------------------------------------- maps with relief
const TERRAINS = [
  TerenBazowy.Laka, TerenBazowy.Rownina, TerenBazowy.Wzgorza, TerenBazowy.Gory,
  TerenBazowy.PlytkieMorze, TerenBazowy.Morze, TerenBazowy.Pustynia, TerenBazowy.Polarny,
];
const HILLY = [TerenBazowy.Wzgorza, TerenBazowy.Gory, TerenBazowy.Wzgorza, TerenBazowy.Laka, TerenBazowy.Gory];

interface MiniMap { hexes: Record<string, { coords: { q: number; r: number }; terenBazowy: TerenBazowy }>; seed?: number }
function makeMap(pick: (q: number, r: number) => TerenBazowy, seed: number | undefined): { map: MiniMap; list: [number, number, string][] } {
  const hexes: MiniMap['hexes'] = {};
  const list: [number, number, string][] = [];
  for (let q = -9; q <= 9; q++) {
    for (let r = -9; r <= 9; r++) {
      if (((q * 7 + r * 3) % 11 + 11) % 11 === 0 && Math.abs(q) + Math.abs(r) > 2) continue; // holes
      const t = pick(q, r);
      hexes[`${q},${r}`] = { coords: { q, r }, terenBazowy: t };
      list.push([q, r, t]);
    }
  }
  return { map: seed === undefined ? { hexes } : { hexes, seed }, list };
}
const mixedPick = (q: number, r: number) => TERRAINS[((q * 5 + r * 11 + 100) % 8 + 8) % 8]!;
const hillyPick = (q: number, r: number) => HILLY[((q * 3 + r * 7 + 50) % 5 + 5) % 5]!;
const maps = {
  // Same layout + seed as `mixed` of overlays.json (P4.22), now with the real sampler.
  mixed: makeMap(mixedPick, 12345),
  // `map.seed` undefined -> `?? 0`.
  noseed: makeMap(mixedPick, undefined),
  // Mostly hills / mountains, negative seed.
  hillsNeg: makeMap(hillyPick, -987654),
  // Non-integer seed above 2^32: `seed | 0` (ToInt32) wraps to -2147483648.
  hillsWrap: makeMap(hillyPick, 6442450944.75),
};

type K = [number, number];
const keyStr = (k: K) => `${k[0]},${k[1]}`;
function disk(c: K, n: number): K[] {
  const out: K[] = [];
  for (let dq = -n; dq <= n; dq++) {
    for (let dr = Math.max(-n, -dq - n); dr <= Math.min(n, -dq + n); dr++) out.push([c[0] + dq, c[1] + dr]);
  }
  return out;
}
function ring(c: K, n: number): K[] {
  return disk(c, n).filter(([q, r]) => {
    const dq = q - c[0], dr = r - c[1];
    return Math.max(Math.abs(dq), Math.abs(dr), Math.abs(dq + dr)) === n;
  });
}
function grow(seed: number, n: number): K[] {
  let s = seed >>> 0;
  const rnd = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
  const set = new Map<string, K>([['0,0', [0, 0]]]);
  const DIRS: K[] = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
  while (set.size < n) {
    const arr = [...set.values()];
    const b = arr[Math.floor(rnd() * arr.length)]!;
    const d = DIRS[Math.floor(rnd() * 6)]!;
    const k: K = [b[0] + d[0], b[1] + d[1]];
    if (!set.has(keyStr(k))) set.set(keyStr(k), k);
  }
  return [...set.values()];
}

const hexSets: Record<string, K[]> = {};
for (let n = 0; n <= 4; n++) hexSets[`disk0_${n}`] = disk([0, 0], n);
for (let n = 1; n <= 3; n++) hexSets[`disk_3_-2_${n}`] = disk([3, -2], n);
hexSets.line2 = [[0, 0], [1, 0]];
hexSets.ring1 = ring([0, 0], 1);
hexSets.ring2 = ring([1, 1], 2);
hexSets.islands = [...disk([-4, 0], 1), [4, 1], [5, 1]];
hexSets.lshape = [[0, 0], [1, 0], [2, 0], [3, 0], [3, -1], [3, -2], [3, -3], [-1, 1], [-2, 2]];
hexSets.corner = [[0, 0], [1, 1], [2, -1]];
hexSets.missing = [[0, 0], [1, 0], [11, 0], [12, 0], [-30, 2], [2, 2]];
hexSets.grow25 = grow(42, 25);
hexSets.grow40 = grow(7, 40);
hexSets.empty = [];

const BANDED: RangeOverlayStyle = {
  tintColor: 0x123456, tintOpacity: 0.3, borderColor: 0x654321, borderOpacity: 0.8, borderBandWidth: 0.12, yOffset: 0.07,
};
const BANDED_HUG: RangeOverlayStyle = { ...BANDED, borderBandWidth: 0.2, hugTerrainRelief: true };
const NO_Y: RangeOverlayStyle = { tintColor: 0xabcdef, tintOpacity: 0.5, borderColor: 0x00ff00, borderOpacity: 1 };
const STYLES: Record<string, RangeOverlayStyle> = {
  culture: CULTURE_RANGE_STYLE, religion: RELIGION_RANGE_STYLE, mine: MINE_ELIGIBLE_STYLE,
  banded: BANDED, bandedHug: BANDED_HUG, noY: NO_Y,
};
const styleConsts: Record<string, unknown> = {};
for (const [id, s] of Object.entries(STYLES)) {
  styleConsts[id] = {
    tintColor: s.tintColor, tintOpacity: hx([s.tintOpacity]), borderColor: s.borderColor,
    borderOpacity: hx([s.borderOpacity]), borderBandWidth: s.borderBandWidth === undefined ? null : hx([s.borderBandWidth]),
    yOffset: s.yOffset === undefined ? null : hx([s.yOffset]), hug: s.hugTerrainRelief ?? null,
  };
}

// ------------------------------------------------------------- range overlays
const range: Record<string, unknown>[] = [];
let reliefHexesDraped = 0;
for (const [mapId, m] of Object.entries(maps)) {
  for (const [setId, keys] of Object.entries(hexSets)) {
    for (const [styleId, style] of Object.entries(STYLES)) {
      const set = new Set(keys.map(keyStr));
      if (style.hugTerrainRelief) {
        for (const k of set) {
          const t = m.map.hexes[k]?.terenBazowy;
          if (t === TerenBazowy.Wzgorza || t === TerenBazowy.Gory) reliefHexesDraped++;
        }
      }
      range.push({ map: mapId, set: setId, style: styleId, ...overlayRecord(buildRangeOverlayGroup(m.map as never, set, style)) });
    }
  }
}

// ------------------------------------------------------------- sampler probes
// Drape grid of a sector (rangeOverlay.ts:339-375): corners at 0.97 R,
// HUG_RELIEF_SUBDIVISIONS = 4 -> barycentric points c*i/4 + d*j/4. Plus
// pseudo-random points in [-1.1 R, 1.1 R]^2 (inside and outside the silhouette).
const corners: [number, number][] = [];
for (let i = 0; i < 6; i++) {
  const a = (Math.PI / 3) * i;
  corners.push([0.97 * Math.sin(a), 0.97 * Math.cos(a)]);
}
const samplers: Record<string, unknown>[] = [];
let probeCount = 0;
{
  let s = 2024;
  const rnd = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return (s / 4294967296 - 0.5) * 2.2; };
  for (const [mapId, m] of Object.entries(maps)) {
    const seed = m.map.seed ?? 0;
    let taken = 0;
    for (const [q, r, t] of m.list) {
      if ((q + 2 * r) % 3 !== 0) continue; // a third of the map
      for (const R of [1, 1.5]) {
        const smp = reliefSurfaceSampler(t as TerenBazowy, q, r, seed, R);
        if (!smp) { samplers.push({ map: mapId, q, r, t, R, v: null }); continue; }
        const pts: number[] = [];
        // R = 1 (the drape radius): grid of sectors 0, 2, 4 (every corner and
        // edge of the hex once) + 12 random points; R = 1.5: 12 random points.
        for (let c = 0; c < (R === 1 ? 6 : 0); c += 2) {
          const [ax, az] = corners[c]!;
          const [bx, bz] = corners[(c + 1) % 6]!;
          for (let i = 0; i <= 4; i++) {
            for (let j = 0; i + j <= 4; j++) {
              pts.push(R * (ax * i / 4 + bx * j / 4), R * (az * i / 4 + bz * j / 4));
            }
          }
        }
        for (let n = 0; n < 12; n++) pts.push(rnd() * R, rnd() * R);
        const vals: number[] = [];
        for (let p = 0; p < pts.length; p += 2) vals.push(smp(pts[p]!, pts[p + 1]!));
        probeCount += vals.length;
        samplers.push({ map: mapId, q, r, t, R, pts: hx(pts), v: hx(vals) });
        taken++;
      }
    }
    if (taken === 0) throw new Error(`no relief hex probed on ${mapId}`);
  }
}

// ------------------------------------------------------------- output
const outDir = process.argv[2] ?? '.';
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'relief_real.json'), JSON.stringify({
  maps: Object.fromEntries(Object.entries(maps).map(([id, m]) => [id, { seed: m.map.seed ?? null, hexes: m.list }])),
  hexSets, styles: styleConsts, range, samplers,
}));
console.log(`misc relief range=${range.length} reliefHexesDraped=${reliefHexesDraped} samplers=${samplers.length} probes=${probeCount}`);
