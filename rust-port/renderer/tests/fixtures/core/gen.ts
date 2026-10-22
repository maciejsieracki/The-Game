// R-RUSTPORT-P4-12-MOD01-CORE-Q1 — generator of the MOD-01 "core" reference vectors.
//
// Run ONLY outside the repository (scratch dir), see README.md. The esbuild bundle links:
//  - three@0.169.0 (npm, version pinned by gra/package-lock.json at edb8fb56),
//  - web modules from `git archive edb8fb56 gra/src gra/data`, IMPORTED UNCHANGED:
//    render/hexutil.ts, render/hexShape.ts, render/fogDim.ts, render/zoomLod.ts,
//    render/mergeDecor.ts, render/unitVitalsPalette.ts, render/mapRenderStyle.ts,
//    render/bronzeCity.ts, render/teren-gory-wzgorza.ts (GORA_APEX_Y, WZGORZE_SZCZYT_Y),
//    game/visibility.ts (FOG_EXPLORED_BRIGHTNESS), types/hex.ts;
//  - LITERAL copies (same logic and arithmetic in the same order; only TS types removed) of
//    the three PRIVATE functions that cannot be imported:
//      rnd            — bronzeCity.ts:42-46,
//      hash2D         — mapRenderStyle.ts:345-351,
//      decorVariant5  — mapRenderStyle.ts:358-360,
//      CIV_TERRAIN_VIS— mapRenderStyle.ts:324-333 (only as the `civ` argument of
//                       terrainVisualForStyle; the exported functions use their own copy).
// Output: JSON files in the directory given as argv[2].

import * as THREE from 'three';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { TerenBazowy } from '../websrc/gra/src/types/hex';
import { HEX_R, SQRT3, axialToWorld, mapCenter, worldToAxial } from '../websrc/gra/src/render/hexutil';
import { hexRingPointsXZ, appendPointyTopHex } from '../websrc/gra/src/render/hexShape';
import { fogBrightnessForHex, applyFogDimToObject3D } from '../websrc/gra/src/render/fogDim';
import {
  normalizedZoomT, resolveZoomLodLevel, zoomLodFlags, effectivePixelRatio,
  cityBadgeLodLevelForDist, cityBadgeLodTextureScale, zoomLodForCamera,
  CITY_BADGE_LOD_NEAR_DIST, CITY_BADGE_LOD_MID_DIST, ZOOM_LOD_MARKER,
} from '../websrc/gra/src/render/zoomLod';
import {
  MERGED_DECOR_FLAG, isAlreadyMergedDecor, countMeshesInGroup, collapseToMergedMesh,
  disposeMergedDecor,
} from '../websrc/gra/src/render/mergeDecor';
import * as VIT from '../websrc/gra/src/render/unitVitalsPalette';
import * as MRS from '../websrc/gra/src/render/mapRenderStyle';
import { BRONZE_CIVS, ikonaIdToBronzeCiv } from '../websrc/gra/src/render/bronzeCity';
import { GORA_APEX_Y, WZGORZE_SZCZYT_Y } from '../websrc/gra/src/render/teren-gory-wzgorza';
import { FOG_EXPLORED_BRIGHTNESS } from '../websrc/gra/src/game/visibility';

const OUT = process.argv[2];
if (!OUT) throw new Error('usage: node core_gen.mjs <outdir>');
fs.mkdirSync(OUT, { recursive: true });

// f64 → JSON. Finite non-negative-zero numbers stay numbers (JSON.stringify is the shortest
// round-trip form); -0, NaN and ±Infinity become strings so that the Rust side sees the bits.
function n(x: number): number | string {
  if (Number.isNaN(x)) return 'NaN';
  if (x === Infinity) return 'Infinity';
  if (x === -Infinity) return '-Infinity';
  if (x === 0 && 1 / x < 0) return '-0';
  return x;
}
const arr = (a: ArrayLike<number>) => Array.from(a, n);
function write(name: string, data: unknown): void {
  const p = path.join(OUT, name);
  fs.writeFileSync(p, JSON.stringify(data));
  console.log(`${name} ${fs.statSync(p).size}`);
}

// Deterministic xorshift for test inputs (inputs only; never part of the compared logic).
let s32 = 0x1234567;
function rand(): number {
  s32 ^= s32 << 13; s32 >>>= 0;
  s32 ^= s32 >>> 17;
  s32 ^= s32 << 5; s32 >>>= 0;
  return s32 / 4294967296;
}

// ---------------------------------------------------------------------------
// LITERAL bronzeCity.ts:42-46
function rnd(nn: number, salt: number): number {
  let x = Math.imul((nn + 1) * 2654435761 + salt * 40503, 0x27d4eb2d) >>> 0;
  x ^= x >>> 15; x = Math.imul(x, 0x2c1b3c6d) >>> 0; x ^= x >>> 13;
  return (x >>> 0) / 4294967296;
}
// LITERAL mapRenderStyle.ts:345-351
function hash2D(q: number, r: number, seed: number, salt: number): number {
  let h = (Math.imul(q | 0, 0x27d4eb2d) ^ Math.imul(r | 0, 0x165667b1) ^ Math.imul(seed | 0, 0x9e3779b1) ^ Math.imul(salt | 0, 0x85ebca6b)) >>> 0;
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d) >>> 0;
  h ^= h >>> 12;
  return (h >>> 0) / 4294967296;
}
// LITERAL mapRenderStyle.ts:358-360
function decorVariant5(q: number, r: number, seed: number, salt: number): number {
  return Math.floor(hash2D(q, r, seed, salt) * 5);
}
// LITERAL mapRenderStyle.ts:324-333
const CIV_TERRAIN_VIS: any = {
  [TerenBazowy.Morze]:    { height: 0.30, yOffset: 0.00 },
  [TerenBazowy.PlytkieMorze]: { height: 0.35, yOffset: 0.05 },
  [TerenBazowy.Laka]:     { height: 0.40, yOffset: 0.05 },
  [TerenBazowy.Rownina]:  { height: 0.45, yOffset: 0.08 },
  [TerenBazowy.Pustynia]: { height: 0.42, yOffset: 0.08 },
  [TerenBazowy.Wzgorza]:  { height: 0.70, yOffset: 0.15 },
  [TerenBazowy.Gory]:     { height: 1.20, yOffset: 0.40 },
  [TerenBazowy.Polarny]:  { height: 0.38, yOffset: 0.06 },
};

const TERRAINS: string[] = Object.values(TerenBazowy) as string[];
const STYLES = ['civ', 'roblox', 'minecraft'] as const;

// ===========================================================================
// 1. hexutil
{
  const a2w: any[] = [];
  for (const R of [HEX_R, 0.5, 1.37, 1.008]) {
    for (let q = -40; q <= 40; q += 3) {
      for (let r = -40; r <= 40; r += 4) {
        const p = axialToWorld(q, r, R);
        a2w.push([n(q), n(r), n(R), n(p.x), n(p.z)]);
      }
    }
  }
  for (let i = 0; i < 400; i++) {
    const q = (rand() - 0.5) * 300, r = (rand() - 0.5) * 300;
    const p = axialToWorld(q, r);
    a2w.push([n(q), n(r), n(HEX_R), n(p.x), n(p.z)]);
  }
  const centers: any[] = [];
  for (const [w, h] of [[1, 1], [2, 2], [9, 7], [40, 30], [64, 36], [240, 168], [1000, 3]]) {
    for (const R of [HEX_R, 0.75]) {
      const c = mapCenter(w, h, R);
      centers.push([w, h, n(R), n(c.x), n(c.z)]);
    }
  }
  const w2a: any[] = [];
  for (let i = 0; i < 3000; i++) {
    const x = (rand() - 0.5) * 200, z = (rand() - 0.5) * 200;
    const R = i % 3 === 0 ? 1 : (i % 3 === 1 ? 0.8 : 1.25);
    const a = worldToAxial(x, z, R);
    w2a.push([n(x), n(z), n(R), a.q, a.r]);
  }
  // Exact edge midpoints and vertices (tie rules).
  for (let q = -3; q <= 3; q++) {
    for (let r = -3; r <= 3; r++) {
      for (const [dq, dr] of [[0.5, 0], [0, 0.5], [0.5, -0.5], [1 / 3, 1 / 3], [-1 / 3, 2 / 3], [0.5, 0.5]]) {
        const p = axialToWorld(q + dq, r + dr);
        const a = worldToAxial(p.x, p.z);
        w2a.push([n(p.x), n(p.z), 1, a.q, a.r]);
      }
    }
  }
  write('hexutil.json', { HEX_R: n(HEX_R), SQRT3: n(SQRT3), a2w, centers, w2a });
}

// ===========================================================================
// 2. hexShape
{
  const rings: any[] = [];
  for (const R of [1, 1.008, 0.92, 0.5, 2.37, 0.0001]) {
    for (const y of [0, 0.46, -0.1, 1e-9]) {
      const pts = hexRingPointsXZ(R, y);
      rings.push({ R: n(R), y: n(y), pts: pts.map((v) => [n(v.x), n(v.y), n(v.z)]) });
    }
  }
  // default y
  rings.push({ R: n(1.5), y: null, pts: hexRingPointsXZ(1.5).map((v) => [n(v.x), n(v.y), n(v.z)]) });
  const paths: any[] = [];
  for (const radius of [1, 0.93, 0.42, 3.5]) {
    for (const reverse of [false, true]) {
      for (const kind of ['shape', 'path']) {
        const p = kind === 'shape' ? new THREE.Shape() : new THREE.Path();
        appendPointyTopHex(p, radius, reverse);
        paths.push({
          radius: n(radius), reverse, kind,
          curves: p.curves.length,
          points: p.getPoints().map((v) => [n(v.x), n(v.y)]),
        });
      }
    }
  }
  // Shape with a hole: outer ring + reversed inner ring (cityMapOutline pattern).
  const holed = new THREE.Shape();
  appendPointyTopHex(holed, 1, false);
  const hole = new THREE.Path();
  appendPointyTopHex(hole, 0.8, true);
  holed.holes.push(hole);
  const ex = holed.extractPoints(12);
  write('hexshape.json', {
    rings, paths,
    holed: { shape: ex.shape.map((v) => [n(v.x), n(v.y)]), holes: ex.holes.map((h) => h.map((v) => [n(v.x), n(v.y)])) },
  });
}

// ===========================================================================
// Scene-tree specs shared by fogDim and mergeDecor. The Rust test builds the same tree from
// the spec (geometries with crate::geom builders, which are bit-compatible with three r169).
type GeoSpec = { kind: string; args: number[]; colorAttr?: boolean; nonIndexed?: boolean };
type MatSpec = { type: string; color?: number; vertexColors?: boolean };
type NodeSpec = {
  type: 'group' | 'mesh' | 'object3d' | 'sprite';
  pos?: number[]; rot?: [number, number, number, string]; scale?: number[];
  geo?: GeoSpec; mats?: MatSpec[]; array?: boolean; shared?: string;
  children?: NodeSpec[]; flag?: boolean;
};

function makeGeo(g: GeoSpec): THREE.BufferGeometry {
  let geo: THREE.BufferGeometry;
  const a = g.args;
  switch (g.kind) {
    case 'box': geo = new THREE.BoxGeometry(a[0], a[1], a[2], a[3], a[4], a[5]); break;
    case 'cylinder': geo = new THREE.CylinderGeometry(a[0], a[1], a[2], a[3], a[4], !!a[5]); break;
    case 'cone': geo = new THREE.ConeGeometry(a[0], a[1], a[2], a[3]); break;
    case 'sphere': geo = new THREE.SphereGeometry(a[0], a[1], a[2]); break;
    case 'icosahedron': geo = new THREE.IcosahedronGeometry(a[0], a[1]); break;
    case 'plane': geo = new THREE.PlaneGeometry(a[0], a[1], a[2], a[3]); break;
    case 'empty': geo = new THREE.BufferGeometry(); break;
    default: throw new Error(g.kind);
  }
  if (g.nonIndexed) geo = geo.toNonIndexed();
  if (g.colorAttr) {
    const cnt = geo.getAttribute('position').count;
    const c: number[] = [];
    for (let i = 0; i < cnt; i++) c.push(((i * 37) % 101) / 100, ((i * 11) % 53) / 52, ((i * 5) % 7) / 6);
    geo.setAttribute('color', new THREE.Float32BufferAttribute(c, 3));
  }
  return geo;
}
function makeMat(m: MatSpec): THREE.Material {
  const p: any = {};
  if (m.color !== undefined) p.color = m.color;
  if (m.vertexColors) p.vertexColors = true;
  switch (m.type) {
    case 'lambert': return new THREE.MeshLambertMaterial(p);
    case 'standard': return new THREE.MeshStandardMaterial(p);
    case 'basic': return new THREE.MeshBasicMaterial(p);
    case 'phong': return new THREE.MeshPhongMaterial(p);
    case 'physical': return new THREE.MeshPhysicalMaterial(p);
    case 'toon': return new THREE.MeshToonMaterial(p);
    case 'normal': return new THREE.MeshNormalMaterial();
    case 'sprite': return new THREE.SpriteMaterial(p);
    default: throw new Error(m.type);
  }
}
function build(spec: NodeSpec, shared: Map<string, THREE.Material[]>): THREE.Object3D {
  let o: THREE.Object3D;
  if (spec.type === 'mesh') {
    let mats: THREE.Material[];
    if (spec.shared && shared.has(spec.shared)) mats = shared.get(spec.shared)!;
    else {
      mats = (spec.mats ?? []).map(makeMat);
      if (spec.shared) shared.set(spec.shared, mats);
    }
    o = new THREE.Mesh(makeGeo(spec.geo!), spec.array ? mats : mats[0]);
  } else if (spec.type === 'sprite') {
    o = new THREE.Sprite(makeMat(spec.mats![0]) as THREE.SpriteMaterial);
  } else if (spec.type === 'group') {
    o = new THREE.Group();
  } else {
    o = new THREE.Object3D();
  }
  if (spec.pos) o.position.set(spec.pos[0], spec.pos[1], spec.pos[2]);
  if (spec.rot) o.rotation.set(spec.rot[0], spec.rot[1], spec.rot[2], spec.rot[3] as any);
  if (spec.scale) o.scale.set(spec.scale[0], spec.scale[1], spec.scale[2]);
  if (spec.flag) o.userData[MERGED_DECOR_FLAG] = true;
  for (const c of spec.children ?? []) o.add(build(c, shared));
  return o;
}
// Pre-order traversal (= Object3D.traverse) of the meshes (+ sprites) with their material colours.
function dumpColors(root: THREE.Object3D): any[] {
  const out: any[] = [];
  root.traverse((obj) => {
    const m = obj as any;
    if (!m.isMesh && !m.isSprite) return;
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    out.push(mats.map((mt: any) => (mt && mt.color ? [n(mt.color.r), n(mt.color.g), n(mt.color.b)] : null)));
  });
  return out;
}

const L = (color: number): MatSpec => ({ type: 'lambert', color });
const SCENES: Record<string, NodeSpec> = {
  // House-like decor: nested groups, rotations in several orders, non-uniform scale.
  house: {
    type: 'group', pos: [3.5, 0.2, -1.25], rot: [0, 0.7, 0, 'XYZ'],
    children: [
      { type: 'mesh', geo: { kind: 'box', args: [0.3, 0.2, 0.25, 1, 1, 1] }, mats: [L(0xd8c8a8)], pos: [0.1, 0.1, 0] },
      { type: 'mesh', geo: { kind: 'cone', args: [0.22, 0.15, 4, 1] }, mats: [L(0x9a3a2a)], pos: [0.1, 0.27, 0], rot: [0, Math.PI / 4, 0, 'XYZ'] },
      {
        type: 'group', pos: [-0.2, 0, 0.15], rot: [0.1, -0.4, 0.05, 'YXZ'], scale: [1.2, 0.8, 1.1],
        children: [
          { type: 'mesh', geo: { kind: 'cylinder', args: [0.03, 0.04, 0.3, 6, 1, 0] }, mats: [L(0x6b4a2a)], pos: [0, 0.15, 0] },
          { type: 'mesh', geo: { kind: 'sphere', args: [0.09, 6, 4] }, mats: [{ type: 'standard', color: 0x3f7f3a }], pos: [0, 0.34, 0], scale: [1, 0.7, 1] },
          { type: 'object3d', pos: [0.5, 0.5, 0.5], children: [
            { type: 'mesh', geo: { kind: 'icosahedron', args: [0.05, 0] }, mats: [{ type: 'phong', color: 0xaaaaaa }], pos: [0.01, 0.02, 0.03], rot: [1.1, 2.2, -0.3, 'ZYX'] },
          ] },
        ],
      },
      { type: 'mesh', geo: { kind: 'plane', args: [0.6, 0.6, 2, 1] }, mats: [{ type: 'basic', color: 0x80b0ff }], rot: [-Math.PI / 2, 0, 0, 'XYZ'], pos: [0, 0.005, 0] },
    ],
  },
  // Vertex-colour geometry (lasy / tarasy pattern) next to solid materials; material arrays.
  forest: {
    type: 'group',
    children: [
      { type: 'mesh', geo: { kind: 'cone', args: [0.12, 0.3, 7, 2], colorAttr: true }, mats: [L(0x224422)], pos: [0.2, 0.15, 0.1], rot: [0, 1.3, 0, 'XYZ'] },
      { type: 'mesh', geo: { kind: 'box', args: [0.1, 0.1, 0.1, 2, 1, 1] }, mats: [L(0x334455), L(0xff0000), L(0x00ff00)], array: true, pos: [-0.3, 0.05, 0.2] },
      { type: 'mesh', geo: { kind: 'icosahedron', args: [0.08, 1], colorAttr: true }, mats: [{ type: 'toon', color: 0x112233 }], pos: [0, 0.4, -0.2] },
      { type: 'mesh', geo: { kind: 'box', args: [0.05, 0.4, 0.05, 1, 1, 1], nonIndexed: true }, mats: [{ type: 'normal' }], pos: [0.3, 0.2, -0.3], scale: [1, 1.5, 1] },
      { type: 'mesh', geo: { kind: 'sphere', args: [0.05, 5, 3] }, mats: [], array: true, pos: [0.0, 0.6, 0.0] },
      { type: 'sprite', mats: [{ type: 'sprite', color: 0xffaa00 }], pos: [0, 1, 0] },
    ],
  },
  // Shared materials across meshes; a physical material (excluded from fog by constructor).
  shared: {
    type: 'group', scale: [2, 2, 2],
    children: [
      { type: 'mesh', geo: { kind: 'box', args: [0.2, 0.2, 0.2, 1, 1, 1] }, mats: [L(0x777700)], shared: 'A', pos: [0.5, 0, 0] },
      { type: 'mesh', geo: { kind: 'box', args: [0.2, 0.3, 0.2, 1, 1, 1] }, shared: 'A', pos: [-0.5, 0, 0] },
      { type: 'mesh', geo: { kind: 'cylinder', args: [0.1, 0.1, 0.2, 8, 1, 1] }, mats: [{ type: 'physical', color: 0x8899aa }], pos: [0, 0, 0.5] },
    ],
  },
  // Root itself is a Mesh with children (traverse visits the root first).
  meshRoot: {
    type: 'mesh', geo: { kind: 'box', args: [1, 0.1, 1, 1, 1, 1] }, mats: [L(0x445566)], pos: [10, 0, 10],
    children: [
      { type: 'mesh', geo: { kind: 'cone', args: [0.1, 0.2, 5, 1] }, mats: [L(0x998877)], pos: [0, 0.15, 0] },
    ],
  },
  empty: { type: 'group' },
  onlyGroups: { type: 'group', children: [{ type: 'group' }, { type: 'object3d', children: [{ type: 'group' }] }] },
  emptyGeo: { type: 'group', children: [{ type: 'mesh', geo: { kind: 'empty', args: [] }, mats: [L(0xffffff)] }] },
  flagged: { type: 'group', flag: true, children: [
    { type: 'mesh', geo: { kind: 'box', args: [0.1, 0.1, 0.1, 1, 1, 1] }, mats: [L(0x123456)] },
    { type: 'mesh', geo: { kind: 'box', args: [0.1, 0.1, 0.1, 1, 1, 1] }, mats: [L(0x654321)], pos: [1, 0, 0] },
  ] },
  singleVc: { type: 'group', children: [
    { type: 'mesh', geo: { kind: 'box', args: [0.1, 0.1, 0.1, 1, 1, 1] }, mats: [{ type: 'lambert', color: 0x202020, vertexColors: true }] },
  ] },
  single: { type: 'group', children: [
    { type: 'mesh', geo: { kind: 'box', args: [0.1, 0.2, 0.3, 1, 1, 1] }, mats: [L(0xc0ffee)], pos: [0.3, 0.2, 0.1], rot: [0.3, 0.2, 0.1, 'XZY'] },
  ] },
};

// ===========================================================================
// 3. fogDim
{
  const vis = new Set(['0,0', '1,0', '-2,5']);
  const exp = new Set(['0,0', '3,3', '4,-1']);
  const bright: any[] = [];
  for (const key of ['0,0', '1,0', '3,3', '4,-1', '9,9', '-2,5', '']) {
    for (const fog of [true, false]) bright.push([key, fog, n(fogBrightnessForHex(key, vis, exp, fog))]);
  }
  const seqs: any[] = [];
  const SEQ = [1, FOG_EXPLORED_BRIGHTNESS, 0, 0.5, -1, 1, 0.175, 2, 0.333, NaN, 1];
  for (const name of ['house', 'forest', 'shared', 'meshRoot', 'single']) {
    const root = build(SCENES[name]!, new Map());
    const steps: any[] = [];
    for (const b of SEQ) {
      applyFogDimToObject3D(root, b);
      steps.push({ b: n(b), colors: dumpColors(root) });
    }
    seqs.push({ scene: name, initial: dumpColors(build(SCENES[name]!, new Map())), steps });
  }
  write('fogdim.json', { FOG_EXPLORED_BRIGHTNESS: n(FOG_EXPLORED_BRIGHTNESS), bright, seqs });
}

// ===========================================================================
// 4. zoomLod
{
  const ts: any[] = [];
  const dists = [-5, 0, 1, 2.67, 8 / 3, 5, 10, 20, 47.5, 100, 320, 400, 1e9, NaN, Infinity, -Infinity];
  const ranges: [number, number][] = [[8 / 3, 320], [0, 1], [5, 5], [10, 5], [2, 2 + 1e-7], [0, Infinity]];
  for (const d of dists) for (const [a, b] of ranges) ts.push([n(d), n(a), n(b), n(normalizedZoomT(d, a, b))]);
  const lv: any[] = [];
  const tvals = [-1, 0, 0.1, 0.19999999999999998, 0.2, 0.2000000000000001, 0.39999999999999997, 0.4,
    0.5, 0.6, 0.6000000000000001, 0.7999999999999999, 0.8, 0.9, 1, 2, NaN];
  for (const t of tvals) lv.push([n(t), resolveZoomLodLevel(t)]);
  const flags: any[] = [];
  for (const level of [0, 1, 2, 3, 4] as const) {
    for (const sh of [false, true]) flags.push({ level, sh, f: zoomLodFlags(level, sh) });
  }
  const pr: any[] = [];
  const prIn: [number, number][] = [[1, 1], [1.5, 0.85], [2, 0.65], [1, 0.5], [2, 0.35], [1, 0.35], [0.5, 1], [3, 1], [1.5, 1], [NaN, 1]];
  for (const [b, m] of prIn) pr.push([null, n(b), n(m), n(effectivePixelRatio(b, m))]);
  for (const dpr of [1, 1.25, 2, 3, 0.5]) {
    (globalThis as any).window = { devicePixelRatio: dpr };
    for (const [b, m] of prIn) pr.push([n(dpr), n(b), n(m), n(effectivePixelRatio(b, m))]);
  }
  delete (globalThis as any).window;
  const badge: any[] = [];
  for (const d of [0, 2.67, 5.4999999, 5.5, 5.5000001, 8, 10.99999, 11, 11.0000001, 50, -3, NaN, Infinity, -Infinity]) {
    badge.push([n(d), cityBadgeLodLevelForDist(d)]);
  }
  const scale: any[] = [];
  for (const l of [0, 1, 2, 3, -1, 1.5, NaN, 4]) scale.push([n(l), n(cityBadgeLodTextureScale(l))]);
  const cam: any[] = [];
  for (const d of dists) for (const [a, b] of ranges) for (const sh of [false, true]) {
    const r = zoomLodForCamera(d, a, b, sh);
    cam.push([n(d), n(a), n(b), sh, r.level, n(r.t), r.marker, r.flags.shadows, n(r.flags.pixelRatioMul)]);
  }
  write('zoomlod.json', {
    NEAR: n(CITY_BADGE_LOD_NEAR_DIST), MID: n(CITY_BADGE_LOD_MID_DIST), MARKER: ZOOM_LOD_MARKER,
    ts, lv, flags: flags.map((x) => ({ level: x.level, sh: x.sh, f: Object.fromEntries(Object.entries(x.f).map(([k, v]) => [k, typeof v === 'number' ? n(v) : v])) })),
    pr, badge, scale, cam,
  });
}

// ===========================================================================
// 5. mergeDecor
{
  let geoDispose = 0, matDispose = 0;
  const gd = THREE.BufferGeometry.prototype.dispose;
  const md = THREE.Material.prototype.dispose;
  THREE.BufferGeometry.prototype.dispose = function () { geoDispose++; return gd.call(this); };
  THREE.Material.prototype.dispose = function () { matDispose++; return md.call(this); };
  const cases: any[] = [];
  for (const name of Object.keys(SCENES)) {
    const g = build(SCENES[name]!, new Map());
    const before = { already: isAlreadyMergedDecor(g), count: countMeshesInGroup(g), children: g.children.length };
    const ret = collapseToMergedMesh(g);
    const after: any = {
      same: ret === g, children: g.children.length, groupFlag: g.userData[MERGED_DECOR_FLAG] === true,
      already: isAlreadyMergedDecor(g), count: countMeshesInGroup(g),
    };
    const only = g.children.length === 1 ? (g.children[0] as THREE.Mesh) : null;
    if (after.groupFlag && only) {
      const geo = only.geometry;
      const m = only.material as THREE.MeshLambertMaterial;
      after.merged = {
        childFlag: only.userData[MERGED_DECOR_FLAG] === true,
        attrs: Object.keys(geo.attributes),
        indexed: geo.index !== null,
        position: arr(geo.getAttribute('position').array),
        color: arr(geo.getAttribute('color').array),
        mat: { type: m.type, vertexColors: m.vertexColors, flatShading: m.flatShading, color: [n(m.color.r), n(m.color.g), n(m.color.b)] },
        castShadow: only.castShadow, receiveShadow: only.receiveShadow, matrixAutoUpdate: only.matrixAutoUpdate,
        pos: [n(only.position.x), n(only.position.y), n(only.position.z)],
      };
    }
    // Second collapse is a no-op.
    const again = collapseToMergedMesh(g);
    after.secondSame = again === g && g.children.length === after.children;
    // Fog on the merged result.
    applyFogDimToObject3D(g, FOG_EXPLORED_BRIGHTNESS);
    after.fogged = dumpColors(g);
    // Dispose: append an unflagged child after the collapse; only the flagged mesh is disposed.
    g.add(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial()));
    geoDispose = 0; matDispose = 0;
    disposeMergedDecor(g);
    after.dispose = [geoDispose, matDispose];
    cases.push({ name, spec: SCENES[name], before, after });
  }
  THREE.BufferGeometry.prototype.dispose = gd;
  THREE.Material.prototype.dispose = md;
  write('mergedecor.json', { FLAG: MERGED_DECOR_FLAG, cases });
}

// ===========================================================================
// 6. unitVitalsPalette
write('vitals.json', Object.fromEntries(Object.entries(VIT).map(([k, v]) => [k, typeof v === 'number' ? n(v) : v])));

// ===========================================================================
// 7. mapRenderStyle (palettes, heights, quality; no builders)
{
  const consts: any = {};
  for (const k of ['GAME_MAP_RENDER_STYLE', 'MAP_DETAIL_MEDIUM_HEX_THRESHOLD', 'LARGE_MAP_LITE_HEX_THRESHOLD',
    'SCENE_BUILD_FAST_HEX_THRESHOLD', 'SEA_SURFACE_TOP_Y', 'WYBRZEZE_SURFACE_TOP_Y', 'LAND_MIN_CLEARANCE_ABOVE_SEA',
    'RIVER_LIFT_ABOVE_TERRAIN_FRAC', 'FLAT_LAND_SURFACE_Y', 'LAND_COAST_SAND_FRAC', 'LAND_HEX_Y_LIFT',
    'PUSTYNIA_EXTRA_Y_LIFT', 'FLAT_LAND_COAST_EXTRA_Y_LIFT', 'COAST_WATER_CAP_THICKNESS', 'COAST_SAND_ROBLOX']) {
    const v = (MRS as any)[k];
    consts[k] = typeof v === 'number' ? n(v) : v;
  }
  consts.DEFAULT_MAP_RENDER_OPTIONS = MRS.DEFAULT_MAP_RENDER_OPTIONS;
  const surface = TERRAINS.map((t) => [t, n((MRS.TERRAIN_SURFACE_Y as any)[t])]);
  const robloxVis = TERRAINS.map((t) => [t, n((MRS.ROBLOX_TERRAIN_VIS as any)[t].height), n((MRS.ROBLOX_TERRAIN_VIS as any)[t].yOffset)]);
  const vis: any[] = [];
  const civSpecs = [null, { height: 0.5, yOffset: 0.1 }, { height: 0.123, yOffset: -0.7 }];
  for (const t of TERRAINS) for (const s of STYLES) for (const cs of civSpecs) {
    const civ = cs ?? CIV_TERRAIN_VIS[t];
    const r = MRS.terrainVisualForStyle(t as any, s, civ);
    vis.push([t, s, n(civ.height), n(civ.yOffset), n(r.height), n(r.yOffset)]);
  }
  const topY: any[] = [];
  for (const t of TERRAINS) for (const s of STYLES) for (const e of [0, 0.05, -0.02, 1e-3]) {
    topY.push([t, s, n(e), n(MRS.terrainSurfaceTopY(t as any, s, e))]);
  }
  for (const t of TERRAINS) topY.push([t, null, null, n(MRS.terrainSurfaceTopY(t as any))]);
  const capTop = STYLES.map((s) => [s, n(MRS.coastWaterCapTopY(s))]);
  capTop.push([null, n(MRS.coastWaterCapTopY())]);
  const audits = STYLES.map((s) => {
    const a = MRS.terrainHeightAudit(s);
    return { style: a.style, seaTopY: n(a.seaTopY), plytkieMorzeTopY: n(a.plytkieMorzeTopY), coastWaterCapTopY: n(a.coastWaterCapTopY),
      land: a.land.map((r) => [r.teren, n(r.topY), n(r.gapAboveSea)]), minLandGap: n(a.minLandGap), violations: a.violations };
  });
  const colors: any[] = [];
  for (const t of TERRAINS) for (const s of STYLES) colors.push([t, s, MRS.styleTerrainColor(t as any, s)]);
  const palettes = STYLES.map((s) => [s, MRS.styleScenePalette(s)]);
  const lift = [0, 1, 0.5, 1.008, 2.5, -1].map((R) => [n(R), n(MRS.riverSurfaceLiftY(R))]);
  // Options + presets.
  const optIn: any[] = [undefined, 'civ', 'roblox', 'minecraft', {}, { style: 'minecraft' }, { renderQuality: 'low' },
    { mapDetailQuality: 'low', renderQuality: 'high' }, { style: 'civ', renderQuality: 'medium', mapDetailQuality: 'medium',
      previewViewport: { width: 800, height: 600, panelColumns: 3 } }, { previewViewport: { width: 10, height: 20 } }];
  const norm = optIn.map((i) => [i === undefined ? null : i, MRS.normalizeMapRenderOptions(i)]);
  const presets: any[] = [];
  const Q = ['low', 'medium', 'high'] as const;
  for (const s of STYLES) for (const rq of Q) for (const dq of Q) {
    for (const hc of [0, 1, 2999, 3000, 3001, 7999, 8000, 8001, 40000]) {
      const p = MRS.resolveRenderPreset({ style: s, renderQuality: rq, mapDetailQuality: dq }, hc);
      presets.push([s, rq, dq, hc, p.robloxLite, p.antialias, n(p.pixelRatioMax), p.shadowsEnabled, p.shadowMapSize, n(p.fogFarMul)]);
    }
  }
  const fast = [0, 31999, 32000, 32001, 40320].map((h) => [h, MRS.isSceneBuildFastPath(h)]);
  // Dense landmass: synthetic maps (only riverPaths.length and hexes' terenBazowy are read).
  const dense: any[] = [];
  const mk = (paths: number, land: number, water: number, noPaths = false) => {
    const hexes: any = {};
    let i = 0;
    for (let k = 0; k < land; k++, i++) hexes[`${i},0`] = { terenBazowy: TERRAINS[[0, 1, 2, 3, 6, 7][k % 6]!] };
    for (let k = 0; k < water; k++, i++) hexes[`${i},0`] = { terenBazowy: k % 2 ? 'morze' : 'plytkie_morze' };
    return { hexes, riverPaths: noPaths ? undefined : new Array(paths).fill([]) };
  };
  for (const [p, l, w, np] of [[0, 10, 0, true], [79, 100, 0, false], [80, 50, 50, false], [80, 51, 49, false], [100, 49, 51, false],
    [119, 1, 0, false], [119, 0, 0, false], [120, 0, 10, false], [500, 0, 0, false], [90, 2, 1, false], [90, 1, 1, false]] as const) {
    const m = mk(p, l, w, np);
    const terr = Object.values(m.hexes).map((h: any) => h.terenBazowy);
    for (const hc of [0, 32000]) dense.push([np ? null : p, terr, hc, MRS.isDenseLandmassMap(m as any), MRS.isRiverRenderFast(hc, m as any), MRS.isSceneBuildAggressive(hc, m as any)]);
  }
  // Deterministic decor counts / variants.
  const counts: any[] = [];
  for (let i = 0; i < 600; i++) {
    const q = Math.floor((rand() - 0.5) * 400), r = Math.floor((rand() - 0.5) * 400);
    const seed = i % 5 === 0 ? -2147483648 : Math.floor((rand() - 0.5) * 4294967296);
    const salt = Math.floor(rand() * 2000);
    counts.push([q, r, seed, salt, n(hash2D(q, r, seed, salt)), decorVariant5(q, r, seed, salt),
      MRS.forestTreeCountForHex(q, r, seed), MRS.jungleForestTreeCountForHex(q, r, seed)]);
  }
  // Heights of decor surfaces.
  const hills: any[] = [];
  for (const b of [0, 0.46, 0.64, 0.78, -0.3]) for (const lite of [false, true]) hills.push([n(b), lite, n(MRS.styleHillBumpSurfaceY(b, lite))]);
  hills.push([n(0.64), null, n(MRS.styleHillBumpSurfaceY(0.64))]);
  const peaks: any[] = [];
  for (let i = 0; i < 200; i++) {
    const q = Math.floor((rand() - 0.5) * 200), r = Math.floor((rand() - 0.5) * 200);
    const seed = Math.floor((rand() - 0.5) * 100000);
    const top = [0.78, 0.64, 1.0][i % 3]!;
    peaks.push([n(top), q, r, seed, n(MRS.styleMountainPeakSurfaceY(top, q, r, seed, 1, i % 2 === 0))]);
  }
  const gallery: any[] = [];
  for (const t of TERRAINS) for (const keys of [[], ['tarasy'], ['kopalnia', 'tarasy'], ['kopalnia']]) {
    for (const opts of [undefined, { lite: true }, { q: 3, r: -7, seed: 42 }, { q: -11, r: 5, seed: 7, lite: true, R: 2 }]) {
      const top = MRS.terrainSurfaceTopY(t as any);
      gallery.push([t, n(top), keys, opts ?? null, n(MRS.galleryDecorSurfaceY(t as any, top, keys, opts))]);
    }
  }
  const edge = TERRAINS.map((t) => [t, n(MRS.elevatedTerrainEdgeSurfaceY(t as any, 0.64))]);
  write('mapstyle.json', {
    consts, surface, robloxVis, vis, topY, capTop, audits, colors, palettes, lift, norm, presets, fast, dense,
    counts, hills, peaks, gallery, edge, GORA_APEX_Y: GORA_APEX_Y.map(n), WZGORZE_SZCZYT_Y: n(WZGORZE_SZCZYT_Y),
  });
}

// ===========================================================================
// 8. bronzeCity (types + rnd only; the builder is D-MOD-1)
{
  const keys = ['grecy', 'grecja', 'rzymianie', 'rzym', 'chinczycy', 'chiny', 'inkowie', 'inka', 'zulusi', 'zulu', 'egipt',
    'babilon', 'babilonia', 'sumerowie', 'sumer', 'harappa', 'asyria', 'celtowie', 'germanie', 'slowianie', 'hetyci',
    'fenicjanie', 'aztek', '', 'nieznany', 'Rzym', 'GRECY', 'majowie', 'persowie', ' rzym',
    'toString', 'constructor', '__proto__', 'hasOwnProperty', 'valueOf'];
  const map = keys.map((k) => {
    const v: any = ikonaIdToBronzeCiv(k);
    return [k, typeof v === 'string' ? v : `__non_string__:${typeof v}`];
  });
  const rn: any[] = [];
  for (let nn = -5; nn <= 300; nn++) for (const salt of [0, 1, 2, 3, 7, 13, 99]) rn.push([n(nn), n(salt), n(rnd(nn, salt))]);
  for (let i = 0; i < 2000; i++) {
    const nn = i % 4 === 0 ? (rand() - 0.5) * 1e6 : Math.floor((rand() - 0.5) * 1e7);
    const salt = i % 7 === 0 ? (rand() - 0.5) * 100 : Math.floor(rand() * 1000) - 50;
    rn.push([n(nn), n(salt), n(rnd(nn, salt))]);
  }
  for (const [nn, salt] of [[2 ** 31, 0], [2 ** 32, 1], [2 ** 53, 5], [-(2 ** 40), 3], [1e20, 2], [NaN, 1], [Infinity, 1], [0.5, 0.5], [-1, 0], [-1, -1e15]]) {
    rn.push([n(nn), n(salt), n(rnd(nn, salt))]);
  }
  write('bronze.json', { BRONZE_CIVS, map, rnd: rn });
}
console.log('core vectors done');
