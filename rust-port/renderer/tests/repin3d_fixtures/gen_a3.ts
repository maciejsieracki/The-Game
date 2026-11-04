// Reference-vector generator for R-RUSTPORT-REPIN-3D-A3-Q1, batch A3 (REPIN of the battle-3D
// scene to the CURRENT web): breaking a wall tower, the tower volley / shot / flight, the wall
// breach on the wall AND on the palisade, the gate breach on the palisade.
//
// Runs the REAL web code of `origin/main` (`git archive <main> gra/src gra/data`, three@0.169.0,
// esbuild@0.24.0, node v22.22.0), bundled by `build_a1.mjs` UNCHANGED (`node build_a1.mjs gen_a3`;
// the same appended `export { ... }` line of `battleScene.ts`, text otherwise byte-identical;
// `dom_stub.ts` and `three_shim.ts` are the files of `tests/fixtures/battle3d/`, unchanged).
// Every case runs on `Object.create(BattleScene.prototype)` after the REAL `_carveWallTiles` +
// `_placeSiegeWall` (+ `_placeSiegeTowers` with the REAL `towerMaterialFor` / `towerRows` /
// `strongestRangedUnitForEra` / `towerRangeFor` / `miasto-params.json`):
//   1. `_breachWallTile(row)` sequences (first tower row twice, plain row, rLo / rHi, gate row,
//      last tower row, rHi + 1, -1) x fortKind {mur, palisada x2, none}   (battleScene.ts :7553-7610)
//      -> `_destroyTowerAtRow` (:4089-4095) from :7563
//   2. `_breachGate()` x fortKind, + one gate tile already open, + gateCol < 0   (:7672-7726)
//   3. `_fireSiegeTowers()` (:4103-4116) -> `_fireOneTower` (:4118-4162) -> `_tickProjectiles`
//      (:8938-8954); `pickTowerTarget` (P6.13) runs for real, its pick = the DTO the Rust test replays.
//
// Usage: node gen_a3.mjs <out-dir>   (bundle produced by `node build_a1.mjs gen_a3`)

import './dom_stub';
import * as THREE from 'three';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as BS from '../websrc/gra/src/battle/battleScene';
import { towerMaterialFor, pickTowerTarget } from '../websrc/gra/src/game/city-towers';

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
    SphereGeometry: ['radius', 'widthSegments', 'heightSegments', 'phiStart', 'phiLength', 'thetaStart', 'thetaLength'],
    IcosahedronGeometry: ['radius', 'detail'],
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


// ------------------------------------------------------------- A3 fixtures
const P: any = BS.BattleScene.prototype;
const W = BS.BF_COLS, H = BS.BF_ROWS;
function lcg(seed: number): () => number { let a = seed >>> 0; return () => { a = (Math.imul(a, 1664525) + 1013904223) >>> 0; return a / 4294967296; }; }
const mixTiles = (() => { const rnd = lcg(23); const t = new Uint8Array(W * H); for (let i = 0; i < W * H; i++) t[i] = Math.floor(rnd() * 6); return t; })();
function makeTm(tiles: Uint8Array): any {
  const at = (c: number, r: number): number => (c < 0 || c >= W || r < 0 || r >= H ? 0 : tiles[r * W + c]!);
  return { cols: W, rows: H, tiles, at, passable: (c: number, r: number) => { const t = at(c, r); return t !== 3 && t !== 6 && t !== 7; } };
}
function tilesFnv(t: Uint8Array): number { const f = new Fnv(); for (const b of t) f.byte(b); return f.h >>> 0; }
function sceneIdx(inst: any): Map<THREE.Object3D, number> {
  const order: THREE.Object3D[] = [];
  inst.scene.traverse((x: THREE.Object3D) => order.push(x));
  return new Map(order.map((x, i) => [x, i] as const));
}
const towerState = (inst: any): unknown[] => { const idx = sceneIdx(inst); return inst.siegeTowers.map((t: any) => [t.row, t.destroyed, t.mesh ? idx.get(t.mesh) ?? -2 : -1, t.mesh ? t.mesh.visible : null]); };

/** A battle instance after `_carveWallTiles` + `_placeSiegeWall(civ)` (the constructor order). */
function fortInst(fortKind: string, civ: string, era: number): any {
  const tiles = new Uint8Array(mixTiles);
  const inst: any = Object.create(P);
  inst.scene = new THREE.Scene();
  inst.overlay = (globalThis as any).document.createElement('div');
  inst.terrainMap = makeTm(tiles); inst.wallTileHp = new Map();
  inst._carveWallTiles();
  inst.fortKind = fortKind; inst._siegeDefCiv = civ; inst._defenderEra = era; inst._battleData = {};
  inst.ownedGeos = []; inst.ownedMats = []; inst.siegeTowers = []; inst.towerShooterRow = null;
  inst.finished = false;
  for (const k of ['_updateSiegeHud', '_syncSiegeHudChromeVisibility', '_syncSiegeHudLayout', '_sfxShot', '_sfxDeath', '_applyTerrainRange']) inst[k] = () => {};
  inst._placeSiegeWall(civ);
  inst.log = []; inst.def = []; inst.atk = []; inst.projectiles = []; inst.floatLabels = []; inst.vNow = 0;
  inst.wallEverBreached = false;
  inst._labels = [] as unknown[];
  inst._spawnWallLabel = (c: number, r: number, text: string, color: string) => { inst._labels.push([c, r, text, color]); };
  inst._checkRout = () => {};
  inst._updateMoraleBar = () => {};
  return inst;
}
const header = (inst: any, fortKind: string, civ: string): Record<string, unknown> => ({
  fortKind, civ,
  layout: [inst.siegeWallCol, inst.siegeWallRowLo, inst.siegeWallRowHi, inst.siegeGateRow],
  towerMaterial: towerMaterialFor(fortKind as any),
  towerRows: inst.siegeTowers.map((t: any) => t.row),
  placed: towerState(inst),
});

const out: Record<string, unknown> = {};
out.tilesHex = Buffer.from(mixTiles).toString('hex');

// ------------------------------------------------------------- 1. wall / palisade breach (+ tower)
{
  const cases: unknown[] = [];
  for (const [fortKind, civ] of [['mur', 'egipt'], ['palisada', 'zulu'], ['palisada', 'rzym'], ['none', 'rzym']] as const) {
    const inst = fortInst(fortKind, civ, 2);
    const h = header(inst, fortKind, civ);
    const tr: number[] = inst.siegeTowers.map((t: any) => t.row);
    const first = tr[0] ?? 4, last = tr[tr.length - 1] ?? 150;
    const rows = [first, first, first + 1, inst.siegeWallRowLo, inst.siegeWallRowHi, inst.siegeGateRow, last, inst.siegeWallRowHi + 1, -1];
    const wallUd = (inst.siegeWallGroup as THREE.Group).userData;
    const steps: unknown[] = [];
    for (const row of rows) {
      const logN = inst.log.length, labN = inst._labels.length;
      const kidsN = inst.scene.children.length;
      inst._breachWallTile(row);
      const idx = sceneIdx(inst);
      const segs = (wallUd['rowWallMeshes'] as Map<number, THREE.Object3D[]>).get(row);
      steps.push({
        row,
        log: inst.log.slice(logN),
        labels: inst._labels.slice(labN),
        towers: towerState(inst),
        segs: segs ? segs.map((m) => [idx.get(m) ?? -1, kindOf(m), m.visible, m.children.length]) : null,
        rubble: inst.scene.children.slice(kidsN).map((m: THREE.Object3D) => dumpTree(m, true)),
        breached: inst.wallEverBreached,
        hpRows: inst.wallTileHp.size,
        tilesFnv: tilesFnv(inst.terrainMap.tiles),
        scene: dumpTree(inst.scene, false),
      });
    }
    cases.push({ ...h, steps });
  }
  out.breach = cases;
}

// ------------------------------------------------------------- 2. gate breach (mur / palisade)
{
  const cases: unknown[] = [];
  const variants: [string, string, string][] = [
    ['mur', 'egipt', 'both'], ['palisada', 'zulu', 'both'], ['palisada', 'rzym', 'one-open'],
    ['palisada', 'zulu', 'gate-col-neg'], ['none', 'rzym', 'both'], ['mur', 'zulu', 'one-open'],
  ];
  for (const [fortKind, civ, v] of variants) {
    const inst = fortInst(fortKind, civ, 2);
    const h = header(inst, fortKind, civ);
    if (v === 'one-open') inst.terrainMap.tiles[inst.siegeGateRow * W + inst.siegeGateCol] = 0;
    if (v === 'gate-col-neg') inst.siegeGateCol = -1;
    const pre = tilesFnv(inst.terrainMap.tiles);
    inst._breachGate();
    const wall = inst.siegeWallGroup as THREE.Group;
    const order: THREE.Object3D[] = [];
    wall.traverse((x) => order.push(x));
    const hidden = order.map((x, i) => [i, x.visible] as const).filter(([, vis]) => !vis).map(([i]) => i);
    cases.push({ ...h, variant: v, preTilesFnv: pre, tilesFnv: tilesFnv(inst.terrainMap.tiles), gateOpen: inst.gateOpen, breached: inst.wallEverBreached, hidden, wallNodes: order.length, scene: dumpTree(inst.scene, false) });
  }
  out.gate = cases;
}

// ------------------------------------------------------------- 3. tower volley / shot / flight
{
  type Enemy = [string, number, number, number, Partial<{ dead: boolean; fadingOut: boolean; routed: boolean; removed: boolean }>];
  type FireCase = { id: string; fortKind: string; civ: string; era: number; shooter?: Record<string, unknown> | null; finished?: boolean; preDestroy?: number; dropTile?: number; destroyBeforeShot?: number; finishBeforeShot?: number; enemies: (wc: number, rows: number[]) => Enemy[] };
  const near = (wc: number, rows: number[]): Enemy[] => [
    ['e0', wc - 1, rows[0]!, 9, {}],               // d = 1 (tower 0)
    ['e1', wc - 2, rows[0]! + 1, 4, {}],           // d = 3
    ['e2', wc - 1, rows[1]!, 9, { dead: true }],   // skipped by the filter
    ['e3', wc - 2, rows[1]!, 7, {}],
    ['e4', wc - 2, rows[1]! + 1, 7, {}],
    ['e5', wc - 1, rows[2]! - 1, 6, { routed: true }],
    ['e6', wc - 3, rows[2]!, 2, { fadingOut: true }],
    ['e7', wc - 4, rows[2]! + 2, 5, {}],
    ['e8', wc, rows[3]!, 5, {}],                   // d = 0 (on the tower tile) -> skipped
    ['e9', wc - 1, rows[4]!, 3, { removed: true }],
    ['e10', wc - 30, rows[5]!, 1, {}],             // out of range
    ['e11', wc - 1, rows[3]! + 1, 8, {}],
    ['e12', wc - 1, rows[3]! - 1, 2, {}],          // d tie with e11 -> lower hp wins
  ];
  const cases: FireCase[] = [
    { id: 'palisade-era1', fortKind: 'palisada', civ: 'zulu', era: 1, enemies: near },
    { id: 'palisade-era2', fortKind: 'palisada', civ: 'zulu', era: 2, preDestroy: 1, dropTile: 2, enemies: near },
    { id: 'palisade-era3', fortKind: 'palisada', civ: 'rzym', era: 3, destroyBeforeShot: 0, enemies: near },
    { id: 'mur-era2', fortKind: 'mur', civ: 'egipt', era: 2, finishBeforeShot: 3, enemies: near },
    { id: 'mur-sling', fortKind: 'mur', civ: 'egipt', era: 2, shooter: { Jednostka: 'Procarz', Typ: 'Distance', Health: 6 }, enemies: near },
    { id: 'mur-javelin', fortKind: 'mur', civ: 'egipt', era: 2, shooter: { Jednostka: 'Oszczepnik', Typ: 'Distance' }, enemies: near },
    { id: 'mur-pilum', fortKind: 'mur', civ: 'rzym', era: 2, shooter: { Jednostka: 'Legionista', Typ: 'Melee', Health: 0 }, enemies: near },
    { id: 'mur-no-name', fortKind: 'mur', civ: 'egipt', era: 2, shooter: { Typ: 'procarz' }, enemies: near },
    { id: 'mur-no-name-no-type', fortKind: 'mur', civ: 'egipt', era: 2, shooter: { Health: 3 }, enemies: near },
    { id: 'finished', fortKind: 'mur', civ: 'egipt', era: 2, finished: true, enemies: near },
    { id: 'no-shooter', fortKind: 'palisada', civ: 'zulu', era: 2, shooter: null, enemies: near },
    { id: 'no-towers', fortKind: 'none', civ: 'rzym', era: 2, enemies: near },
    { id: 'no-enemies', fortKind: 'palisada', civ: 'zulu', era: 2, enemies: () => [] },
  ];
  const res: unknown[] = [];
  for (const c of cases) {
    const inst = fortInst(c.fortKind, c.civ, c.era);
    const h = header(inst, c.fortKind, c.civ);
    const realShooter = inst.towerShooterRow;
    if (c.shooter !== undefined) inst.towerShooterRow = c.shooter;
    const sr = inst.towerShooterRow as Record<string, unknown> | null;
    const wc = inst.siegeWallCol;
    const rows: number[] = inst.siegeTowers.map((t: any) => t.row);
    while (rows.length < 6) rows.push(40 + rows.length * 4);
    inst.atk = c.enemies(wc, rows).map(([id, q, r, hp, fl]) => ({ bu: { id, nazwa: id, hp }, q, r, dead: false, fadingOut: false, routed: false, removed: false, ...fl }));
    const preLog: string[] = [];
    if (c.preDestroy !== undefined && inst.siegeTowers[c.preDestroy]) { const n = inst.log.length; inst._destroyTowerAtRow(inst.siegeTowers[c.preDestroy].row); preLog.push(...inst.log.slice(n)); }
    if (c.dropTile !== undefined && inst.siegeTowers[c.dropTile]) inst.wallTileHp.delete(inst.siegeTowers[c.dropTile].row);
    inst.finished = !!c.finished;
    const pre = towerState(inst);
    const sched: [number, () => void][] = [];
    inst._schedule = (ms: number, cb: () => void) => { sched.push([ms, cb]); };
    const logN = inst.log.length;
    inst._fireSiegeTowers();
    const volleyLog = inst.log.slice(logN);
    const plan = sched.map(([ms]) => ms);
    // the tower of each scheduled shot: the live towers in order (= the closures' `t`)
    const planRows: number[] = [];
    for (const t of inst.siegeTowers) { if (planRows.length >= sched.length) break; if (!t.destroyed && inst.wallTileHp.has(t.row)) planRows.push(t.row); }
    const afterVolley = { towers: towerState(inst), scene: dumpTree(inst.scene, false) };
    const shots: unknown[] = [];
    const volley = sched.slice();
    sched.length = 0;
    volley.forEach(([ms, cb], k) => {
      const preLines: string[] = [];
      if (c.destroyBeforeShot === k) { const n = inst.log.length; inst._destroyTowerAtRow(planRows[k]); preLines.push(...inst.log.slice(n)); }
      if (c.finishBeforeShot === k) inst.finished = true;
      inst.vNow = 1000 + ms;
      const ln = inst.log.length, pn = inst.projectiles.length, sn = sched.length;
      const finished = inst.finished;
      // the DTO: what `pickTowerTarget` (P6.13) gives on this state, computed with the same
      // arguments as `_fireOneTower` (:4124-4128) whether or not the guard lets the shot run
      const enemies = inst.atk.filter((u: any) => !u.dead && !u.fadingOut && !u.routed && !u.removed);
      const pick = pickTowerTarget({ q: wc, r: planRows[k]! }, inst.towerRange, enemies.map((u: any) => ({ q: u.q, r: u.r, hp: u.bu.hp })));
      const target = pick >= 0 ? enemies[pick] : null;
      cb();
      const lines = inst.log.slice(ln);
      const m = lines.length ? /strzela do (.*)\.$/.exec(lines[lines.length - 1]) : null;
      if (m && (!target || target.bu.nazwa !== m[1])) throw new Error(`target mismatch ${c.id} ${k}`);
      const p = inst.projectiles.length > pn ? inst.projectiles[inst.projectiles.length - 1] : null;
      shots.push({
        k, row: planRows[k], t0: hx([inst.vNow]), finished, preLines,
        destroyed: inst.siegeTowers.find((t: any) => t.row === planRows[k])?.destroyed ?? null,
        log: lines,
        target: target ? [target.q, target.r, target.bu.nazwa] : null,
        proj: p ? { tree: dumpTree(p.mesh, true), from: hx([p.from.x, p.from.y, p.from.z]), to: hx([p.to.x, p.to.y, p.to.z]), t0: hx([p.t0]), dur: hx([p.dur]) } : null,
        blow: sched.slice(sn).map(([d]) => d),
        towers: towerState(inst),
        scene: dumpTree(inst.scene, false),
      });
    });
    // the flight (`_tickProjectiles` of the frame loop) at a few virtual times
    const ticks: unknown[] = [];
    for (const t of [1000, 1100, 1190, 1380, 1560, 1740, 2000, 3000]) {
      inst._tickProjectiles(t);
      ticks.push({ t: hx([t]), pos: inst.projectiles.map((q: any) => hx([q.mesh.position.x, q.mesh.position.y, q.mesh.position.z])), scene: dumpTree(inst.scene, false) });
    }
    res.push({
      ...h, id: c.id, era: c.era, pre, preLog,
      dropRow: c.dropTile !== undefined && inst.siegeTowers[c.dropTile] ? inst.siegeTowers[c.dropTile].row : null,
      shooter: sr ? { typ: sr['Typ'] ?? null, jednostka: sr['Jednostka'] ?? null } : null,
      realShooter: realShooter ? String(realShooter['Jednostka']) : null,
      towerRange: inst.towerRange,
      finished: !!c.finished,
      volley: { plan, planRows, log: volleyLog, ...afterVolley },
      shots, ticks,
    });
  }
  out.fire = res;
}

const dir = process.argv[2] ?? '.';
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'a3.json'), JSON.stringify({ three: THREE.REVISION, node: process.version, ...out }));
console.log(`repin3d a3 breach=${(out.breach as unknown[]).length} gate=${(out.gate as unknown[]).length} fire=${(out.fire as unknown[]).length}`);
process.exit(0);
