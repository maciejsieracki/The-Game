// Reference-vector generator for R-RUSTPORT-REPIN-3D-A2-Q1, batch A2 (REPIN of the battle-3D
// scene to the CURRENT web): the palisade as a form of the wall and the wall towers.
//
// Runs the REAL web code of `origin/main` (`git archive <main> gra/src gra/data`, three@0.169.0,
// esbuild@0.24.0, node v22.22.0), bundled by `build_a1.mjs` UNCHANGED (`node build_a1.mjs gen_a2`;
// the same appended `export { ... }` line of `battleScene.ts`, text otherwise byte-identical;
// `dom_stub.ts` and `three_shim.ts` are the files of `tests/fixtures/battle3d/`, unchanged):
//   1. `buildSiegeWall(civ, { ..., kind })` for every civ key x kind {absent, 'mur', 'palisada'}
//      at the game size + `attachRowBreachPanels`                     (siegeWall.ts :1188-1215, :1232-1260)
//   2. `buildPalisade` parameter sweep (full node records, brzegi)    (siegeWall.ts :993-1093)
//   3. `buildWallTower(material, tileSize, wallHeight)`               (siegeWall.ts :1102-1185)
//   4. `_placeSiegeWall(civ)` -> `_placeSiegeTowers(wallCol, rLo, rHi)` on
//      `Object.create(BattleScene.prototype)` with the REAL `towerMaterialFor` / `towerRows` /
//      `miasto-params.json` (their result = the DTO the Rust test replays)
//                                                                     (battleScene.ts :3971-4044, :4053-4086)
//
// Usage: node gen_a2.mjs <out-dir>   (bundle produced by `node build_a1.mjs gen_a2`)

import './dom_stub';
import * as THREE from 'three';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as BS from '../websrc/gra/src/battle/battleScene';
import { buildSiegeWall, buildWallTower, attachRowBreachPanels } from '../websrc/gra/src/battle/siegeWall';
import { BRONZE_CIVS } from '../websrc/gra/src/render/bronzeCity';
import { towerMaterialFor } from '../websrc/gra/src/game/city-towers';

// ------------------------------------------------------------- hashing (same as gen_field.ts)
const _f32 = new Float32Array(1);
const _f32b = new Uint8Array(_f32.buffer);
const _f64 = new Float64Array(1);
const _f64b = new Uint8Array(_f64.buffer);
class Fnv {
  h = 0x811c9dc5 >>> 0;
  byte(b: number): void { this.h ^= b & 0xff; this.h = Math.imul(this.h, 0x01000193) >>> 0; }
  u32(v: number): void { v = v >>> 0; this.byte(v); this.byte(v >>> 8); this.byte(v >>> 16); this.byte(v >>> 24); }
  // NaN is hashed as ONE canonical pattern (0x7ff8… / 0x7fc0…): NaN bit patterns are
  // implementation-defined in ECMA-262 (V8 gives 0xfff8… for 0/0 and for NaN through
  // Math.min/max), so only NaN-ness is a parity property (P4-36 §3a).
  f32(v: number): void { if (Number.isNaN(v)) { for (const b of [0, 0, 0xc0, 0x7f]) this.byte(b); return; } _f32[0] = v; for (let i = 0; i < 4; i++) this.byte(_f32b[i]!); }
  f64(v: number): void { if (Number.isNaN(v)) { for (const b of [0, 0, 0, 0, 0, 0, 0xf8, 0x7f]) this.byte(b); return; } _f64[0] = v; for (let i = 0; i < 8; i++) this.byte(_f64b[i]!); }
  str(s: string): void { this.u32(s.length); for (let i = 0; i < s.length; i++) this.u32(s.charCodeAt(i)); }
  bool(b: boolean): void { this.byte(b ? 1 : 0); }
}
class Sink extends Fnv {
  bytes: number[] = [];
  override byte(b: number): void { this.bytes.push(b & 0xff); }
  feed(f: Fnv): void { for (const b of this.bytes) f.byte(b); }
  hash(): number { const f = new Fnv(); this.feed(f); return f.h >>> 0; }
}
if (new Uint8Array(new Uint16Array([1]).buffer)[0] !== 1) throw new Error('big-endian host');

const _geoHashCache = new WeakMap<THREE.BufferGeometry, number>();
function geoHash(g: THREE.BufferGeometry): number {
  const c = _geoHashCache.get(g);
  if (c !== undefined) return c;
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
  } else f.byte(0);
  f.u32(g.groups.length);
  for (const gr of g.groups) { f.u32(gr.start); f.u32(gr.count); f.u32(gr.materialIndex ?? 0); }
  const h = f.h >>> 0;
  _geoHashCache.set(g, h);
  return h;
}
function triCount(g: THREE.BufferGeometry): number {
  return g.index ? g.index.count / 3 : g.getAttribute('position').count / 3;
}
function hx(nums: ArrayLike<number>): string {
  const dv = new DataView(new ArrayBuffer(8));
  let out = '';
  for (let i = 0; i < nums.length; i++) { dv.setFloat64(0, nums[i]!, false); out += dv.getBigUint64(0, false).toString(16).padStart(16, '0'); }
  return out;
}

// ------------------------------------------------------------- node records (gen_field.ts + Ring/Circle)
const KIND: Record<string, number> = { Scene: 0, Group: 1, Object3D: 2, Mesh: 3, InstancedMesh: 4, Line: 5, AmbientLight: 6, HemisphereLight: 7, DirectionalLight: 8 };
function kindOf(o: THREE.Object3D): string {
  if ((o as THREE.Scene).isScene) return 'Scene';
  if ((o as THREE.InstancedMesh).isInstancedMesh) return 'InstancedMesh';
  if ((o as THREE.Mesh).isMesh) return 'Mesh';
  if ((o as THREE.Line).isLine) return 'Line';
  if ((o as THREE.AmbientLight).isAmbientLight) return 'AmbientLight';
  if ((o as THREE.HemisphereLight).isHemisphereLight) return 'HemisphereLight';
  if ((o as THREE.DirectionalLight).isDirectionalLight) return 'DirectionalLight';
  if ((o as THREE.Group).isGroup) return 'Group';
  if (o.type === 'Object3D') return 'Object3D';
  throw new Error(`unexpected object ${o.type}`);
}
function geoParams(g: THREE.BufferGeometry): number[] {
  const p = (g as unknown as { parameters?: Record<string, number | boolean> }).parameters;
  const order: Record<string, string[]> = {
    BoxGeometry: ['width', 'height', 'depth', 'widthSegments', 'heightSegments', 'depthSegments'],
    CylinderGeometry: ['radiusTop', 'radiusBottom', 'height', 'radialSegments', 'heightSegments', 'openEnded', 'thetaStart', 'thetaLength'],
    ConeGeometry: ['radius', 'height', 'radialSegments', 'heightSegments', 'openEnded', 'thetaStart', 'thetaLength'],
    PlaneGeometry: ['width', 'height', 'widthSegments', 'heightSegments'],
    RingGeometry: ['innerRadius', 'outerRadius', 'thetaSegments', 'phiSegments', 'thetaStart', 'thetaLength'],
    CircleGeometry: ['radius', 'segments', 'thetaStart', 'thetaLength'],
    BufferGeometry: [],
  };
  const keys = order[g.type];
  if (!keys) throw new Error(`unexpected geometry ${g.type}`);
  return keys.map((k) => { const v = p![k]; return typeof v === 'boolean' ? (v ? 1 : 0) : (v as number); });
}
type Ctx = { index: Map<THREE.Object3D, number>; matIds: Map<THREE.Material, number>; mats: THREE.Material[] };
function matId(ctx: Ctx, m: THREE.Material): number {
  if (!ctx.matIds.has(m)) { ctx.matIds.set(m, ctx.matIds.size); ctx.mats.push(m); }
  return ctx.matIds.get(m)!;
}
/** Binary material stream (= `gen_field.ts::matSig`). */
function matSig(m: THREE.Material): number {
  const mt = m as THREE.MeshStandardMaterial & THREE.LineDashedMaterial;
  const f = new Fnv();
  f.str(mt.type);
  f.u32(mt.color.getHex());
  f.f64(mt.color.r); f.f64(mt.color.g); f.f64(mt.color.b);
  f.u32(mt.side);
  f.byte(mt.flatShading === undefined ? 2 : mt.flatShading ? 1 : 0);
  f.bool(mt.transparent); f.f64(mt.opacity); f.bool(mt.depthWrite); f.bool(mt.depthTest); f.bool(mt.vertexColors);
  if ('emissive' in mt && mt.emissive) { f.byte(1); f.u32(mt.emissive.getHex()); f.f64(mt.emissive.r); f.f64(mt.emissive.g); f.f64(mt.emissive.b); } else f.byte(0);
  if (mt.type === 'MeshStandardMaterial') { f.f64(mt.roughness); f.f64(mt.metalness); }
  if (mt.type === 'LineDashedMaterial') { f.f64(mt.dashSize); f.f64(mt.gapSize); f.f64(mt.scale); }
  return f.h >>> 0;
}
/** Byte stream of one node: `gen_field.ts::nodeRecord` + the material signature of meshes / lines. */
function nodeRecord(o: THREE.Object3D, ctx: Ctx, f: Fnv): Record<string, unknown> {
  const k = kindOf(o);
  const parent = o.parent && ctx.index.has(o.parent) ? ctx.index.get(o.parent)! : -1;
  f.u32(KIND[k]!); f.str(o.name); f.u32(parent + 1);
  const p = [o.position.x, o.position.y, o.position.z];
  const r = [o.rotation.x, o.rotation.y, o.rotation.z];
  const q = [o.quaternion.x, o.quaternion.y, o.quaternion.z, o.quaternion.w];
  const s = [o.scale.x, o.scale.y, o.scale.z];
  for (const v of [...p, ...r]) f.f64(v);
  f.str(o.rotation.order);
  for (const v of [...q, ...s, ...o.matrixWorld.elements]) f.f64(v);
  f.bool(o.castShadow); f.bool(o.receiveShadow); f.bool(o.visible); f.u32(o.renderOrder | 0);
  const rec: Record<string, unknown> = { k, name: o.name, parent, p: hx(p), r: hx(r), q: hx(q), s: hx(s), cs: o.castShadow, rs: o.receiveShadow, vis: o.visible, ro: o.renderOrder };
  if (k === 'Mesh' || k === 'Line') {
    const m = o as THREE.Mesh;
    const mat = m.material as THREE.Material;
    const mid = matId(ctx, mat);
    const gh = geoHash(m.geometry);
    const par = geoParams(m.geometry);
    f.u32(mid); f.str(m.geometry.type); f.u32(gh);
    for (const v of par) f.f64(v);
    const ms = matSig(mat);
    f.u32(ms);
    if (k === 'Line') {
      const ld = m.geometry.getAttribute('lineDistance') as THREE.BufferAttribute | undefined;
      f.byte(ld ? 1 : 0);
      if (ld) for (const v of ld.array as Float32Array) f.f32(v);
    }
    rec.mat = mid; rec.matSig = ms;
    rec.geo = { t: m.geometry.type, vtx: m.geometry.getAttribute('position').count, tri: triCount(m.geometry), hash: gh, par: hx(par) };
  }
  return rec;
}
/** Full dump of a subtree (`root` included); parents are indices inside the subtree. */
function dumpTree(root: THREE.Object3D, full: boolean): Record<string, unknown> {
  root.updateMatrixWorld(true);
  const order: THREE.Object3D[] = [];
  root.traverse((o) => order.push(o));
  const ctx: Ctx = { index: new Map(), matIds: new Map(), mats: [] };
  order.forEach((o, i) => ctx.index.set(o, i));
  const all = new Fnv();
  const nodes: unknown[] = [];
  for (const o of order) {
    const sink = new Sink();
    const rec = nodeRecord(o, ctx, sink);
    sink.feed(all);
    if (full) nodes.push({ sig: sink.hash(), ...rec });
  }
  return full ? { n: order.length, sig: all.h >>> 0, nodes } : { n: order.length, sig: all.h >>> 0 };
}

// ------------------------------------------------------------- A2 helpers
/** `userData` of a group (keys in insertion order); objects as indices of `dumpTree(root)`. */
function udRecord(root: THREE.Object3D, o: THREE.Object3D): Record<string, unknown> {
  const order: THREE.Object3D[] = [];
  root.traverse((x) => order.push(x));
  const index = new Map(order.map((x, i) => [x, i] as const));
  const ud = o.userData;
  const out: Record<string, unknown> = { keys: Object.keys(ud) };
  for (const key of Object.keys(ud)) {
    const val = ud[key];
    if (typeof val === 'number') out[key] = hx([val]);
    else if (typeof val === 'boolean') out[key] = val;
    else if (typeof val === 'string') out[key] = { s: val };
    else if (val === null) out[key] = { null: true };
    else if (val instanceof THREE.Object3D) out[key] = { node: index.get(val) ?? -1 };
    else if (val instanceof Map) {
      out[key] = [...val.entries()].map(([k, v]) => [
        hx([k as number]),
        Array.isArray(v) ? (v as THREE.Object3D[]).map((x) => index.get(x) ?? -1) : index.get(v as THREE.Object3D) ?? -1,
      ]);
    } else throw new Error(`unexpected userData ${key}`);
  }
  return out;
}
type Opts = { lengthTiles: number; tileSize: number; height?: number; gateWidthTiles?: number; ownerColor?: number; kind?: 'palisada' | 'mur' };
const optsHx = (o: Opts): string => hx([o.lengthTiles, o.tileSize, o.height ?? NaN, o.gateWidthTiles ?? NaN]);
const optsFlags = (o: Opts): number[] => [o.height === undefined ? 0 : 1, o.gateWidthTiles === undefined ? 0 : 1, o.ownerColor === undefined ? -1 : o.ownerColor];

const out: Record<string, unknown> = {};

// ------------------------------------------------------------- 1. every civ key x kind at the game size
// `_placeSiegeWall` (`:3979-3986`): lengthTiles = BF_ROWS = 156, tileSize = TILE_S = 1, height 2.5, gate 2,
// then `attachRowBreachPanels(wallCenterRow 77.5, 0, 155, 76, 77, 1)`.
{
  const KINDS: (undefined | 'mur' | 'palisada')[] = [undefined, 'mur', 'palisada'];
  const cases: unknown[] = [];
  for (const civ of [...BRONZE_CIVS, 'xyz']) {
    const sigs: Record<string, number> = {};
    for (const kind of KINDS) {
      const opts: Opts = { lengthTiles: 156, tileSize: 1, height: 2.5, gateWidthTiles: 2, ...(kind ? { kind } : {}) };
      const g = buildSiegeWall(civ as any, opts);
      const ud = udRecord(g, g);
      attachRowBreachPanels(g, 77.5, 0, 155, 76, 77, 1);
      const udBreach = udRecord(g, g);
      const tree = dumpTree(g, false) as any;
      sigs[kind ?? 'absent'] = tree.sig;
      cases.push({ civ, kind: kind ?? null, optsHx: optsHx(opts), tree, ud, udBreach });
    }
    // the additive-diff property, measured on the web itself
    if (sigs['absent'] !== sigs['mur']) throw new Error(`mur != absent for ${civ}`);
  }
  out.walls = cases;
}

// ------------------------------------------------------------- 2. palisade sweep (full node records)
{
  type Breach = [number, number, number, number, number, number];
  const sweep: [string, Opts, Breach[]][] = [
    ['defaults', { lengthTiles: 12, tileSize: 1 }, [[5.5, 0, 11, 5, 6, 1], [6, 0, 11, 6, 6, 1]]],
    ['small-half', { lengthTiles: 10, tileSize: 0.5, height: 1.8, gateWidthTiles: 3 }, [[4.5, 0, 9, 4, 5, 0.5]]],
    ['odd-tall', { lengthTiles: 7, tileSize: 1.3, height: 4.4, gateWidthTiles: 1, ownerColor: 0x123456 }, [[3, 0, 6, 3, 3, 1.3], [3, -2, 8, 9, 9, 1.3]]],
    ['frac', { lengthTiles: 9.5, tileSize: 0.73, height: 2.5, gateWidthTiles: 2 }, [[4.25, 0, 9, 3, 4, 0.73]]],
    ['low-wide-gate', { lengthTiles: 5, tileSize: 2, height: 1, gateWidthTiles: 4 }, []],
    // N-1 / N / N+1 around the gate width (2): no side, an empty side, one tile per side
    ['len-1', { lengthTiles: 1, tileSize: 1, height: 2.5, gateWidthTiles: 2 }, [[0, 0, 0, 5, 5, 1]]],
    ['no-side', { lengthTiles: 2, tileSize: 1, height: 2.5, gateWidthTiles: 2 }, [[0.5, 0, 1, 0, 1, 1]]],
    ['len-3', { lengthTiles: 3, tileSize: 1, height: 2.5, gateWidthTiles: 2 }, [[1, 0, 2, 1, 1, 1]]],
    ['len-4', { lengthTiles: 4, tileSize: 1, height: 2.5, gateWidthTiles: 2 }, [[1.5, 0, 3, 1, 2, 1]]],
    // the `sx < L/2 - T*0.01` loop bound: a last tile start 0.005 T before L/2 (inside the 1% margin)
    ['len-eps', { lengthTiles: 6.005, tileSize: 1, height: 2.5, gateWidthTiles: 2 }, [[2.5, 0, 6, 2, 3, 1]]],
    ['gate-zero', { lengthTiles: 6, tileSize: 1, height: 2.5, gateWidthTiles: 0 }, [[0, -0, 0, 5, 6, 1], [2.5, -0, 5, 9, 9, 1]]],
    ['gate-half', { lengthTiles: 6, tileSize: 1, height: 2.5, gateWidthTiles: 0.5 }, [[0, -0, 0, 5, 6, 1], [2.5, -0, 5, 9, 9, 1]]],
    ['tile-zero', { lengthTiles: 6, tileSize: 0, height: 2.5, gateWidthTiles: 2 }, [[2.5, 0, 5, 2, 3, 0]]],
    ['tile-neg', { lengthTiles: 6, tileSize: -1, height: 2.5, gateWidthTiles: 2 }, []],
    ['len-neg', { lengthTiles: -4, tileSize: 1, height: 2.5, gateWidthTiles: 2 }, []],
    // NaN inputs: the segment loop does not run for NaN `L` / `T` (no NaN Map key); a NaN height
    // gives NaN pole heights (`toFixed(3)` = 'NaN': one shared geometry) — NaN hashed canonically.
    ['nan-height', { lengthTiles: 8, tileSize: 1, height: NaN, gateWidthTiles: 2 }, [[3.5, 0, 7, 3, 4, 1]]],
    ['nan-tile', { lengthTiles: 8, tileSize: NaN, height: 2.5, gateWidthTiles: 2 }, [[3.5, 0, 7, 3, 4, NaN]]],
    ['nan-len', { lengthTiles: NaN, tileSize: 1, height: 2.5, gateWidthTiles: 2 }, []],
    ['nan-gate', { lengthTiles: 8, tileSize: 1, height: 2.5, gateWidthTiles: NaN }, [[3.5, 0, 7, 3, 4, 1]]],
    // a long, finely tiled palisade: many `toFixed(3)` geometry-cache hits (heights that differ but share a key)
    ['cache', { lengthTiles: 60, tileSize: 0.25, height: 3.3, gateWidthTiles: 2 }, []],
  ];
  // Size budget: full node records for these sweeps; the others are dumped as `{ n, sig }` (the
  // signature still covers every byte of every node record).
  const FULL = new Set(['defaults', 'odd-tall', 'frac', 'len-3', 'gate-half', 'nan-height', 'nan-gate']);
  const cases: unknown[] = [];
  for (const [name, o, breach] of sweep) {
    const opts: Opts = { ...o, kind: 'palisada' };
    const g = buildSiegeWall('zulu', opts);
    const ud = udRecord(g, g);
    const breaches: unknown[] = [];
    for (const b of breach) { attachRowBreachPanels(g, ...b); breaches.push({ args: hx(b), ud: udRecord(g, g) }); }
    // geometry-cache hits: poles whose geometry height differs from their own `hv` (position.y * 2)
    let cacheHits = 0;
    g.traverse((x) => {
      const m = x as THREE.Mesh;
      if (m.isMesh && m.geometry.type === 'CylinderGeometry' && x.parent !== g) {
        const hgeo = (m.geometry as any).parameters.height as number;
        if (hgeo !== m.position.y * 2 && !Number.isNaN(hgeo)) cacheHits++;
      }
    });
    cases.push({ id: name, optsHx: optsHx(opts), flags: optsFlags(opts), tree: dumpTree(g, FULL.has(name)), ud, breaches, cacheHits });
  }
  out.palisades = cases;
}

// ------------------------------------------------------------- 3. buildWallTower
{
  const cases: unknown[] = [];
  const dims: [number, number][] = [[1, 2.5], [0.5, 1.8], [1.3, 4.4], [0, 2.5], [1, 0], [-1, 2.5], [NaN, 2.5], [1, NaN], [Infinity, 2.5]];
  for (const material of ['kamien', 'drewno'] as const) {
    for (const [t, h] of dims) {
      const g = buildWallTower(material, t, h);
      cases.push({ material, args: hx([t, h]), tree: dumpTree(g, true), ud: udRecord(g, g) });
    }
  }
  out.towers = cases;
}

// ------------------------------------------------------------- 4. _placeSiegeWall + _placeSiegeTowers
{
  const P: any = BS.BattleScene.prototype;
  const W = BS.BF_COLS, H = BS.BF_ROWS;
  const tm = (): any => {
    const tiles = new Uint8Array(W * H);
    const at = (c: number, r: number): number => (c < 0 || c >= W || r < 0 || r >= H ? 0 : tiles[r * W + c]!);
    return { cols: W, rows: H, tiles, at, passable: () => true };
  };
  // the game layout (`_carveWallTiles`) + hand-made layouts at the row-count brzegi of `towerRows`
  const game = ((): number[] => {
    const inst: any = Object.create(P);
    inst.terrainMap = tm(); inst.wallTileHp = new Map();
    inst._carveWallTiles();
    return [inst.siegeWallCol, inst.siegeWallRowLo, inst.siegeWallRowHi, inst.siegeGateRow];
  })();
  const layouts: [string, number[]][] = [
    ['game', game],
    ['band', [40, 10, 20, 15]],
    ['one-row', [0, 5, 5, 5]],
    ['three-rows', [3, 0, 2, 1]],
    ['four-rows-no-gate', [3, 0, 3, 50]],
    ['gate-on-first-tower', [7, 0, 12, 2]],
    ['no-wall', [-1, 0, 155, 78]],
  ];
  const cases: unknown[] = [];
  for (const [lname, [col, lo, hi, gate]] of layouts) {
    const civs = lname === 'game' ? ['rzym', 'zulu', 'egipt'] : ['egipt'];
    for (const civ of civs) {
      for (const fortKind of ['none', 'mur', 'palisada']) {
        const inst: any = Object.create(P);
        inst.scene = new THREE.Scene();
        inst.overlay = (globalThis as any).document.createElement('div');
        inst.siegeWallCol = col; inst.siegeWallRowLo = lo; inst.siegeWallRowHi = hi; inst.siegeGateRow = gate;
        inst.fortKind = fortKind; inst._siegeDefCiv = civ; inst._defenderEra = 2; inst._battleData = {};
        inst.ownedGeos = []; inst.ownedMats = []; inst.siegeTowers = [];
        inst.finished = false;
        for (const k of ['_updateSiegeHud', '_syncSiegeHudChromeVisibility', '_syncSiegeHudLayout']) inst[k] = () => {};
        inst._placeSiegeWall(civ);
        const order: THREE.Object3D[] = [];
        inst.scene.traverse((x: THREE.Object3D) => order.push(x));
        const idx = new Map(order.map((x, i) => [x, i] as const));
        const towers = inst.siegeTowers.map((t: any) => [t.row, t.destroyed, t.mesh ? idx.get(t.mesh) ?? -2 : -1]);
        const mats = new Set<THREE.Material>();
        inst.scene.traverse((x: any) => { if (x.isMesh) mats.add(x.material); });
        const wall = inst.siegeWallGroup as THREE.Group | null;
        cases.push({
          layout: lname, civ, fortKind, args: [col, lo, hi, gate],
          towerMaterial: towerMaterialFor(fortKind as any),
          towers,
          // the first / last tower in full (clones of one model), every tower's sub-tree summary
          towerFirst: inst.siegeTowers.length ? dumpTree(inst.siegeTowers[0].mesh, true) : null,
          towerLast: inst.siegeTowers.length ? dumpTree(inst.siegeTowers[inst.siegeTowers.length - 1].mesh, true) : null,
          towerSigs: inst.siegeTowers.map((t: any) => (dumpTree(t.mesh, false) as any).sig),
          towerUd: inst.siegeTowers.length ? udRecord(inst.siegeTowers[0].mesh, inst.siegeTowers[0].mesh) : null,
          wall: wall ? { node: idx.get(wall), ud: udRecord(wall, wall) } : null,
          materials: mats.size,
          scene: dumpTree(inst.scene, false),
        });
      }
    }
  }
  out.place = cases;
}

const dir = process.argv[2] ?? '.';
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'a2.json'), JSON.stringify({ three: THREE.REVISION, node: process.version, ...out }));
console.log(`repin3d a2 walls=${(out.walls as unknown[]).length} palisades=${(out.palisades as unknown[]).length} towers=${(out.towers as unknown[]).length} place=${(out.place as unknown[]).length}`);
process.exit(0);
