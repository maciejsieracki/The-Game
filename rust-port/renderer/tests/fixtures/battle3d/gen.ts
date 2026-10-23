// Reference-vector generator for MOD-14 "battle 3D", round 1: `battle/siegeWall.ts`
// (R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q1).
//
// Runs the REAL web code of `edb8fb56` (`git archive edb8fb56 gra/src gra/data`,
// three@0.169.0, esbuild@0.24.0, node v22.22.0), imported unchanged:
//   - battle/siegeWall.ts   buildSiegeWall (9 styles + fallbacks), attachRowBreachPanels
// No WebGL renderer: the builder returns a THREE object graph; this script calls
// `updateMatrixWorld(true)` and dumps it (node tree, transforms, geometry hashes,
// material parameters, the `userData` contract consumed by battleScene.ts).
//
// Usage: node gen.mjs <out-dir>   (bundle produced by build.mjs)

import * as THREE from 'three';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { buildSiegeWall, attachRowBreachPanels, type SiegeWallOpts } from '../websrc/gra/src/battle/siegeWall';
import { BRONZE_CIVS, type BronzeCiv } from '../websrc/gra/src/render/bronzeCity';

// ------------------------------------------------------------- hashing
class Fnv {
  h = 0x811c9dc5 >>> 0;
  byte(b: number): void { this.h ^= b & 0xff; this.h = Math.imul(this.h, 0x01000193) >>> 0; }
  u32(v: number): void { v = v >>> 0; this.byte(v); this.byte(v >>> 8); this.byte(v >>> 16); this.byte(v >>> 24); }
  f32(v: number): void {
    const dv = new DataView(new ArrayBuffer(4)); dv.setFloat32(0, v, true);
    for (let i = 0; i < 4; i++) this.byte(dv.getUint8(i));
  }
  f64(v: number): void {
    const dv = new DataView(new ArrayBuffer(8)); dv.setFloat64(0, v, true);
    for (let i = 0; i < 8; i++) this.byte(dv.getUint8(i));
  }
}

/** Same byte stream as `scene::geo_hash` (`src/scene/hash.rs`). */
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

/** IEEE-754 binary64 bits, 16 hex digits per number, concatenated. */
function hx(nums: ArrayLike<number>): string {
  const dv = new DataView(new ArrayBuffer(8));
  let out = '';
  for (let i = 0; i < nums.length; i++) {
    dv.setFloat64(0, nums[i]!, false);
    out += dv.getBigUint64(0, false).toString(16).padStart(16, '0');
  }
  return out;
}

function kindOf(o: THREE.Object3D): string {
  if ((o as THREE.Mesh).isMesh) return 'Mesh';
  if ((o as THREE.Group).isGroup) return 'Group';
  return 'Object3D';
}

/** Geometry constructor parameters, as numbers (bits) — catches a wrong primitive even when hashes agree. */
function geoParams(g: THREE.BufferGeometry): string {
  const p = (g as unknown as { parameters: Record<string, number | boolean> }).parameters;
  const order: Record<string, string[]> = {
    BoxGeometry: ['width', 'height', 'depth', 'widthSegments', 'heightSegments', 'depthSegments'],
    CylinderGeometry: ['radiusTop', 'radiusBottom', 'height', 'radialSegments', 'heightSegments', 'openEnded', 'thetaStart', 'thetaLength'],
    ConeGeometry: ['radius', 'height', 'radialSegments', 'heightSegments', 'openEnded', 'thetaStart', 'thetaLength'],
  };
  const keys = order[g.type];
  if (!keys) throw new Error(`unexpected geometry ${g.type}`);
  return hx(keys.map((k) => {
    const v = p[k];
    return typeof v === 'boolean' ? (v ? 1 : 0) : (v as number);
  }));
}

/**
 * Full object tree in traverse order + summary. `bbox` = min/max over every
 * Mesh vertex transformed by matrixWorld. `sig` = FNV over (geoHash,
 * color.getHex(), roughness, metalness, side, matrixWorld) of every Mesh.
 */
function treeRecord(root: THREE.Object3D, full: boolean, world: boolean): { rec: Record<string, unknown>; index: Map<THREE.Object3D, number> } {
  root.updateMatrixWorld(true);
  const nodes: unknown[] = [];
  const index = new Map<THREE.Object3D, number>();
  const matIds = new Map<THREE.Material, number>();
  const lo = [Infinity, Infinity, Infinity];
  const hi = [-Infinity, -Infinity, -Infinity];
  const f = new Fnv();
  let meshes = 0;
  let tris = 0;
  const v = new THREE.Vector3();
  root.traverse((o) => {
    index.set(o, index.size);
    const k = kindOf(o);
    const rec: Record<string, unknown> = {
      k,
      name: o.name,
      parent: o.parent && index.has(o.parent) ? index.get(o.parent) : -1,
      p: hx([o.position.x, o.position.y, o.position.z]),
      cs: o.castShadow,
      rs: o.receiveShadow,
      ro: o.renderOrder,
      vis: o.visible,
    };
    // Size budget (README): rotation / quaternion / scale are dumped only when they differ from the
    // Object3D defaults (bit-exact check: +0 Euler, (0,0,0,1) quaternion, (1,1,1) scale); the Rust test
    // asserts the defaults when a key is absent.
    const r = [o.rotation.x, o.rotation.y, o.rotation.z];
    const q = [o.quaternion.x, o.quaternion.y, o.quaternion.z, o.quaternion.w];
    const sc = [o.scale.x, o.scale.y, o.scale.z];
    if (hx(r) !== hx([0, 0, 0]) || hx(q) !== hx([0, 0, 0, 1])) { rec.r = hx(r); rec.q = hx(q); }
    if (hx(sc) !== hx([1, 1, 1])) rec.s = hx(sc);
    if (world) rec.w = hx(o.matrixWorld.elements);
    if (k === 'Mesh') {
      const m = o as THREE.Mesh;
      const mt = m.material as THREE.MeshStandardMaterial;
      if (!matIds.has(mt)) matIds.set(mt, matIds.size);
      rec.mat = {
        id: matIds.get(mt),
        t: mt.type,
        color: mt.color.getHex(),
        lin: hx([mt.color.r, mt.color.g, mt.color.b]),
        rough: hx([mt.roughness]),
        metal: hx([mt.metalness]),
        side: mt.side,
        flat: mt.flatShading,
        transparent: mt.transparent,
        opacity: hx([mt.opacity]),
        dw: mt.depthWrite,
        dt: mt.depthTest,
        emissive: mt.emissive.getHex(),
      };
      rec.geo = { t: m.geometry.type, vtx: m.geometry.getAttribute('position').count, tri: triCount(m.geometry), hash: geoHash(m.geometry), par: geoParams(m.geometry) };
      meshes++;
      tris += triCount(m.geometry);
      f.u32(geoHash(m.geometry));
      f.u32(mt.color.getHex());
      f.f64(mt.roughness);
      f.f64(mt.metalness);
      f.u32(mt.side);
      for (const e of m.matrixWorld.elements) f.f64(e);
      const pos = m.geometry.getAttribute('position');
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld);
        lo[0] = Math.min(lo[0]!, v.x); lo[1] = Math.min(lo[1]!, v.y); lo[2] = Math.min(lo[2]!, v.z);
        hi[0] = Math.max(hi[0]!, v.x); hi[1] = Math.max(hi[1]!, v.y); hi[2] = Math.max(hi[2]!, v.z);
      }
    }
    nodes.push(rec);
  });
  f.u32(meshes);
  const rec: Record<string, unknown> = {
    nodeCount: nodes.length, meshes, tris, materials: matIds.size, sig: f.h >>> 0, bbox: hx([...lo, ...hi]),
  };
  if (full) rec.nodes = nodes;
  return { rec, index };
}

/** The `userData` contract of the wall group (keys in insertion order). */
function userDataRecord(g: THREE.Group, index: Map<THREE.Object3D, number>): Record<string, unknown> {
  const ud = g.userData;
  const out: Record<string, unknown> = { keys: Object.keys(ud) };
  for (const key of Object.keys(ud)) {
    const val = ud[key];
    if (typeof val === 'number') out[key] = hx([val]);
    else if (typeof val === 'boolean') out[key] = val;
    else if (val instanceof THREE.Object3D) out[key] = { node: index.get(val) ?? -1 };
    else if (val instanceof Map) {
      out[key] = [...val.entries()].map(([k, v]) => [
        hx([k as number]),
        Array.isArray(v) ? (v as THREE.Object3D[]).map((o) => index.get(o) ?? -1) : index.get(v as THREE.Object3D) ?? -1,
      ]);
    } else throw new Error(`unexpected userData ${key}`);
  }
  return out;
}

// ------------------------------------------------------------- cases
type Breach = [number, number, number, number, number, number];
type Case = { id: string; civ: string; opts: SiegeWallOpts; breach: Breach[]; full: boolean; world: boolean };
const cases: Case[] = [];

// 1. The game call (`battleScene.ts:3905-3910` + `:3930-3938`):
//    lengthTiles = BF_ROWS = 156, tileSize = TILE_S = 1, height 2.5, gate 2;
//    attachRowBreachPanels(wallCenterRow 77.5, rows 0..155, gate rows 76..77, 1).
for (const civ of BRONZE_CIVS) {
  cases.push({
    id: `game-${civ}`, civ, opts: { lengthTiles: 156, tileSize: 1.0, height: 2.5, gateWidthTiles: 2 },
    breach: [[77.5, 0, 155, 76, 77, 1.0]],
    // aztek / hetyci route to buildGrecja (`siegeWall.ts:998-999`): summary only, the tree is game-grecja's.
    full: civ !== 'aztek' && civ !== 'hetyci',
    world: false,
  });
}
// 2. Unknown keys -> default branch (`:999`).
for (const civ of ['', 'xyz', 'Grecja']) {
  cases.push({ id: `unknown-${civ || 'empty'}`, civ, opts: { lengthTiles: 8, tileSize: 1 }, breach: [], full: true, world: true });
}
// 3. Parameter sweep over the 9 styles (defaults, odd/fractional lengths, tile sizes, heights, gate widths,
//    a 0-width side (lengthTiles == gateWidthTiles) and an ignored ownerColor).
const sweep: [string, SiegeWallOpts, Breach[]][] = [
  ['defaults', { lengthTiles: 12, tileSize: 1 }, [[5.5, 0, 11, 5, 6, 1], [6, 0, 11, 6, 6, 1], [5.5, 0, 11, 1, 3, 1]]],
  ['small-half', { lengthTiles: 10, tileSize: 0.5, height: 1.8, gateWidthTiles: 3 }, [[4.5, 0, 9, 4, 5, 0.5]]],
  ['odd-tall', { lengthTiles: 7, tileSize: 1.3, height: 4.4, gateWidthTiles: 1, ownerColor: 0x123456 }, [[3, 0, 6, 3, 3, 1.3], [3, -2, 8, 9, 9, 1.3]]],
  ['frac', { lengthTiles: 9.5, tileSize: 0.73, height: 2.5, gateWidthTiles: 2 }, [[4.25, 0, 9, 3, 4, 0.73]]],
  ['low-wide-gate', { lengthTiles: 5, tileSize: 2, height: 1, gateWidthTiles: 4 }, []],
  ['no-side', { lengthTiles: 2, tileSize: 1, height: 2.5, gateWidthTiles: 2 }, [[0.5, 0, 1, 0, 1, 1]]],
  // Round 2 (Evaluator r1, objections 1-2): JS `Map` key semantics (SameValueZero, `-0` stored as `+0`, all
  // NaN keys one entry). `gateWidthTiles < 1` puts a segment centre in (-0.5, 0) -> `Math.round` = `-0`;
  // `rowLo = -0` makes the first breach row `-0`; `tileSize` 0 (`L = 0`: no segment, `0 / 0` in the breach lookup).
  // `tileSize` NaN is NOT a case: NaN keys are unreachable (the segment loop `sx < endX - T * 0.01` is false for
  // NaN, `r <= rowHi` likewise), and every NaN-producing output then carries V8's NaN bit pattern (measured
  // 0xfff8... for an input of 0x7ff8...), which ECMA-262 leaves implementation-defined (P4-36 doc, §3a).
  ['gate-zero', { lengthTiles: 6, tileSize: 1, height: 2.5, gateWidthTiles: 0 }, [[0, -0, 0, 5, 6, 1], [2.5, -0, 5, 9, 9, 1]]],
  ['gate-half', { lengthTiles: 6, tileSize: 1, height: 2.5, gateWidthTiles: 0.5 }, [[0, -0, 0, 5, 6, 1], [2.5, -0, 5, 9, 9, 1]]],
  ['tile-zero', { lengthTiles: 6, tileSize: 0, height: 2.5, gateWidthTiles: 2 }, [[2.5, 0, 5, 2, 3, 0], [2.5, -0, 5, 9, 9, 1]]],
];
// Per-node world matrices are dumped for these sweeps only (size budget, README); every mesh's world
// matrix of EVERY case still enters `sig` bit for bit.
const WORLD_SWEEPS = new Set(['defaults', 'frac', 'no-side']);
for (const civ of ['grecja', 'rzym', 'sumer', 'egipt', 'inka', 'chiny', 'zulu', 'celtowie', 'germanie']) {
  for (const [name, opts, breach] of sweep) cases.push({ id: `${name}-${civ}`, civ, opts, breach, full: true, world: WORLD_SWEEPS.has(name) });
}

const out: Record<string, unknown>[] = [];
for (const c of cases) {
  const g = buildSiegeWall(c.civ as BronzeCiv, c.opts);
  const before = treeRecord(g, false, false);
  const ud0 = userDataRecord(g, before.index);
  const breaches: unknown[] = [];
  for (const b of c.breach) {
    attachRowBreachPanels(g, ...b);
    breaches.push({ args: hx(b), ud: userDataRecord(g, before.index) });
  }
  const { rec } = treeRecord(g, c.full, c.world);
  out.push({ id: c.id, civ: c.civ, opts: { ...c.opts }, optsHx: hx([c.opts.lengthTiles, c.opts.tileSize, c.opts.height ?? NaN, c.opts.gateWidthTiles ?? NaN]), ...rec, ud: ud0, breaches });
}

const dir = process.argv[2] ?? '.';
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'siege_wall.json'), JSON.stringify({ three: THREE.REVISION, node: process.version, cases: out }));
console.log(`battle3d siegeWall cases=${out.length} meshes=${out.reduce((a, c) => a + (c.meshes as number), 0)}`);
