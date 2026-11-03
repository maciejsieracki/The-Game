// Reference-vector generator for R-RUSTPORT-REPIN-3D-A-Q1, batch A1 (REPIN of the
// battle-3D scene to the CURRENT web): the order queue, attack-move ("Atakuj-marszem")
// and the immediate removal of killed units.
//
// Runs the REAL web code of `origin/main` (`git archive <main> gra/src gra/data`,
// three@0.169.0, esbuild@0.24.0, node v22.22.0), bundled by `build_a1.mjs` (the part-4
// bundler of `tests/fixtures/battle3d/build_dynamics.mjs` with its own appended
// `export { ... }` line; `battleScene.ts` text otherwise unchanged; `dom_stub.ts` and
// `three_shim.ts` are the files of `tests/fixtures/battle3d/`, unchanged).
//
// Every case runs on `Object.create(BattleScene.prototype)` with injected state (as the
// overlay cases of `gen_units.ts`); the battle logic the methods call (morale ripples,
// rout checks, terrain range, order execution, formation destinations) is stubbed or
// only observed and its decisions are dumped as the DTO the Rust test replays:
//   1. `_refreshQueuedOrderVisuals` with `attackMove` orders            (main :11013-11034)
//   2. `_issueBattleAttackMove` (+ `_orderMoveForUnits` injected)       (main :18073-18093)
//   3. `_cancelAttackMoveSelected`                                       (main :18095-18103)
//   4. the queue part of `_activateNext`                                 (main :5847-5898)
//   5. `_startFade` = immediate `_removeUnitFromScene`, `_tickFades`     (main :9440-9451, :8956-8976)
//   6. `_breachWallTile` with a defender catapult on the breached tile   (main :7553-7667)
//
// Usage: node gen_a1.mjs <out-dir>   (bundle produced by `node build_a1.mjs`)

import './dom_stub';
import * as THREE from 'three';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as BS from '../websrc/gra/src/battle/battleScene';
import unitsJson from '../websrc/gra/data/units.json';

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

// ------------------------------------------------------------- shared fixtures
const P: any = BS.BattleScene.prototype;
const W = BS.BF_COLS, H = BS.BF_ROWS;
function lcg(seed: number): () => number { let a = seed >>> 0; return () => { a = (Math.imul(a, 1664525) + 1013904223) >>> 0; return a / 4294967296; }; }
const mixTiles = (() => { const rnd = lcg(11); const t = new Uint8Array(W * H); for (let i = 0; i < W * H; i++) t[i] = Math.floor(rnd() * 6); return t; })();
function makeTm(tiles: Uint8Array): any {
  const at = (c: number, r: number): number => (c < 0 || c >= W || r < 0 || r >= H ? 0 : tiles[r * W + c]!);
  return { cols: W, rows: H, tiles, at, passable: (c: number, r: number) => { const t = at(c, r); return t !== 3 && t !== 6 && t !== 7; } };
}
const V = (x: number, y: number, z: number): THREE.Vector3 => new THREE.Vector3(x, y, z);
const sorted = (xs: Iterable<string>): string[] => [...xs].sort();

/** A fresh instance with the scene groups of the constructor (orderLines / orderPreview). */
function baseInst(tiles: Uint8Array): any {
  const inst: any = Object.create(P);
  inst.scene = new THREE.Scene();
  inst.terrainMap = makeTm(tiles);
  inst._orderLinesGroup = new THREE.Group(); inst._orderLinesGroup.name = 'orderLines'; inst.scene.add(inst._orderLinesGroup);
  inst._orderPreviewGroup = new THREE.Group(); inst._orderPreviewGroup.name = 'orderPreview'; inst._orderLinesGroup.add(inst._orderPreviewGroup);
  inst._queuedOrderArrows = [];
  inst._queuedOrderUnitIds = new Set<string>();
  inst.started = true; inst.finished = false;
  inst._deployPlayerSideOpt = 'atk';
  inst.ownedGeos = []; inst.ownedMats = [];
  inst.occByKey = new Map();
  inst.log = []; inst.fadingUnits = []; inst.floatLabels = [];
  inst.atk = []; inst.def = [];
  inst._manualMode = true; inst._manualCommanderGate = false; inst._autoBatchPlanning = false;
  inst.vNow = 0;
  return inst;
}
/** An order-overlay unit (= `gen_units.ts::fakeUnit`): group placed, NOT in the scene. */
function orderUnit(tiles: Uint8Array, id: string, side: 'atk' | 'def', q: number, r: number, extra: Record<string, unknown> = {}): any {
  const g = new THREE.Group();
  const { x, z } = BS.cellToWorld(q, r);
  g.position.set(x, BS.tileTopY(makeTm(tiles), q, r), z);
  return { bu: { id }, side, q, r, group: g, dead: false, removed: false, routed: false, fadingOut: false, acted: false, groupId: null, formationOffset: null, playerOrder: { type: 'none' }, ...extra };
}
const orderDto = (o: any): unknown[] => (o.type === 'move' || o.type === 'attackMove' ? [o.type, o.col, o.row] : o.type === 'attack' ? [o.type, o.targetId] : [o.type]);
const unitFlags = (u: any): unknown[] => [u.bu.id, u.side, u.q, u.r, u.dead ? 1 : 0, u.removed ? 1 : 0, u.routed ? 1 : 0, u.fadingOut ? 1 : 0, u.acted ? 1 : 0];

const out: Record<string, unknown> = {};
out.tilesHex = Buffer.from(mixTiles).toString('hex');

// ------------------------------------------------------------- 1. queued-order arrows with attackMove
{
  const cases: unknown[] = [];
  for (const [started, finished, player] of [[true, false, 'atk'], [true, false, 'def'], [false, false, 'atk'], [true, true, 'atk']] as const) {
    const inst = baseInst(mixTiles);
    inst.started = started; inst.finished = finished; inst._deployPlayerSideOpt = player;
    const u = (id: string, side: 'atk' | 'def', q: number, r: number, extra: Record<string, unknown>): any => orderUnit(mixTiles, id, side, q, r, extra);
    inst.atk = [
      u('a0', 'atk', 30, 70, { playerOrder: { type: 'attackMove', col: 40, row: 72 } }),
      u('a1', 'atk', 31, 71, { playerOrder: { type: 'attackMove', col: 31, row: 71 } }), // zero length
      u('a2', 'atk', 32, 72, { playerOrder: { type: 'move', col: 20, row: 90 } }),
      u('a3', 'atk', 33, 73, { playerOrder: { type: 'attackMove', col: 50, row: 50 }, routed: true }),
      u('a4', 'atk', 34, 74, { playerOrder: { type: 'attackMove', col: 51, row: 51 }, dead: true }),
      u('a5', 'atk', 35, 75, { playerOrder: { type: 'attack', targetId: 'd0' } }),
      u('a6', 'atk', 12, 30, { playerOrder: { type: 'attackMove', col: 0, row: 0 } }),
      u('a7', 'atk', 13, 31, { playerOrder: { type: 'attackMove', col: W - 1, row: H - 1 } }),
      u('a8', 'atk', 14, 32, { playerOrder: { type: 'attackMove', col: 52, row: 52 }, removed: true }),
    ];
    inst.def = [
      u('d0', 'def', 45, 80, { playerOrder: { type: 'attackMove', col: 41, row: 80 } }),
      u('d1', 'def', 46, 81, { playerOrder: { type: 'attack', targetId: 'a0' } }),
      u('d2', 'def', 47, 60, { playerOrder: { type: 'attackMove', col: 30, row: 60 } }),
      u('d3', 'def', 48, 61, { playerOrder: { type: 'hold' } }),
    ];
    inst._queuedOrderUnitIds = new Set(['a0', 'a6', 'd2', 'zz']);
    const stale = P._makeOrderArrow.call({}, V(1, 0, 1), V(5, 0, 5), false, true); inst._orderLinesGroup.add(stale); inst._queuedOrderArrows.push(stale);
    inst._refreshQueuedOrderVisuals();
    cases.push({ started, finished, player, arrows: inst._queuedOrderArrows.length, scene: dumpTree(inst.scene, true) });
  }
  out.queued = cases;
}

// ------------------------------------------------------------- 2./3. issue + cancel attack-move
function issueInst(): any {
  const inst = baseInst(mixTiles);
  const u = (id: string, q: number, r: number, extra: Record<string, unknown> = {}): any => orderUnit(mixTiles, id, 'atk', q, r, extra);
  inst.atk = [
    u('a0', 30, 70), u('a1', 31, 71, { playerOrder: { type: 'attack', targetId: 'd0' } }), u('a2', 32, 72),
    u('a3', 33, 73, { dead: true }), u('a4', 34, 74, { removed: true }), u('a5', 35, 75, { routed: true }),
    u('a6', 36, 76, { playerOrder: { type: 'hold' } }), u('a7', 37, 77, { playerOrder: { type: 'move', col: 5, row: 6 } }),
  ];
  inst.def = [orderUnit(mixTiles, 'd0', 'def', 50, 70)];
  return inst;
}
type IssueCase = { id: string; ids: string[]; col: number; row: number; queueOnly: boolean; pre: string[]; moves: [string, number, number][] };
const issueCases: IssueCase[] = [
  { id: 'queue-three', ids: ['a0', 'a1', 'a2'], col: 40, row: 70, queueOnly: true, pre: [], moves: [['a0', 40, 70], ['a1', 41, 71]] },
  { id: 'immediate-three', ids: ['a0', 'a1', 'a2'], col: 40, row: 70, queueOnly: false, pre: ['a0', 'a5', 'a7'], moves: [['a0', 40, 70], ['a1', 41, 71], ['a2', 39, 69]] },
  { id: 'empty-selection', ids: [], col: 40, row: 70, queueOnly: true, pre: ['a1'], moves: [] },
  { id: 'dead-removed-routed-unknown', ids: ['a3', 'a4', 'a5', 'zz', 'a6'], col: 10, row: 10, queueOnly: true, pre: ['a5'], moves: [['a5', 10, 10], ['a6', 11, 10]] },
  { id: 'keeps-attack-without-move', ids: ['a1'], col: 0, row: H - 1, queueOnly: true, pre: ['a1'], moves: [] },
  { id: 'immediate-edge', ids: ['a7', 'a2'], col: W - 1, row: 0, queueOnly: false, pre: ['a2'], moves: [['a7', W - 1, 0]] },
];
{
  const res: unknown[] = [];
  for (const c of issueCases) {
    const inst = issueInst();
    inst._queuedOrderUnitIds = new Set(c.pre);
    const calls: unknown[] = [];
    inst._collectOrderUnitIds = () => c.ids.slice();
    // `_orderMoveForUnits` (group formation offsets / `_moveDestinationsForSelection` = P6.13 logic)
    // is injected: the move orders it would give, never for dead / removed units (= web filter).
    inst._orderMoveForUnits = (col: number, row: number, ids: string[]) => {
      calls.push(['orderMove', col, row, ids.slice()]);
      for (const [id, mc, mr] of c.moves) {
        const unit = inst._findPlayerUnit(id);
        if (unit && !unit.dead && !unit.removed) unit.playerOrder = { type: 'move', col: mc, row: mr };
      }
    };
    inst._executeUnitsImmediate = (ids: string[]) => { calls.push(['execute', ids.slice()]); };
    inst._advanceToNextBattleUnit = (skip: Set<string>) => { calls.push(['advance', [...skip]]); };
    inst._showOrderFeedback = (msg: string) => { calls.push(['feedback', msg]); };
    let afterMove: unknown[] | null = null;
    const origRefresh = inst._refreshQueuedOrderVisuals;
    inst._refreshQueuedOrderVisuals = function (this: any) { calls.push(['refresh']); return origRefresh.call(this); };
    {
      const om = inst._orderMoveForUnits;
      inst._orderMoveForUnits = (col: number, row: number, ids: string[]) => { om(col, row, ids); afterMove = inst.atk.map((u: any) => [u.bu.id, orderDto(u.playerOrder)]); };
    }
    inst._issueBattleAttackMove(c.col, c.row, c.queueOnly);
    const issued = { orders: inst.atk.map((u: any) => [u.bu.id, orderDto(u.playerOrder)]), queued: [...inst._queuedOrderUnitIds], scene: dumpTree(inst.scene, true) };
    // 3. cancel on the issued state: a subset of the selection (+ an unknown and a non-attackMove unit)
    const cancelIds = ['a0', 'a2', 'a7', 'a5', 'zz'];
    inst._collectOrderUnitIds = () => cancelIds.slice();
    calls.push(['--cancel--']);
    inst._cancelAttackMoveSelected();
    const cancelled = { ids: cancelIds, orders: inst.atk.map((u: any) => [u.bu.id, orderDto(u.playerOrder)]), queued: [...inst._queuedOrderUnitIds], scene: dumpTree(inst.scene, true) };
    res.push({ ...c, flags: inst.atk.map(unitFlags), afterMove, calls, issued, cancelled });
  }
  out.issue = res;
}

// ------------------------------------------------------------- 4. the queue part of `_activateNext`
type ActCase = { id: string; manual: boolean; turnIdx: number; pre: string[]; flags: Record<string, Partial<{ dead: boolean; fadingOut: boolean; removed: boolean; acted: boolean }>> };
const actCases: ActCase[] = [
  { id: 'skips-clear-and-consume', manual: true, turnIdx: 0, pre: ['a0', 'a1', 'a3', 'd0'], flags: { a0: { dead: true }, a1: { acted: true }, a2: { removed: true } } },
  { id: 'auto-keeps-queue', manual: false, turnIdx: 0, pre: ['a0', 'a1', 'a3', 'd0'], flags: { a0: { dead: true }, a1: { acted: true }, a2: { removed: true } } },
  { id: 'exhausted', manual: true, turnIdx: 4, pre: ['a4', 'd1', 'a0'], flags: { a4: { acted: true }, d0: { dead: true }, d1: { fadingOut: true } } },
  { id: 'activated-not-queued', manual: true, turnIdx: 0, pre: ['a2', 'd1'], flags: {} },
  { id: 'past-end', manual: true, turnIdx: 9, pre: ['a0', 'a3'], flags: {} },
  { id: 'fading-and-enemy-skips', manual: true, turnIdx: 1, pre: ['a1', 'd0', 'a2'], flags: { a1: { fadingOut: true }, d0: { removed: true } } },
];
{
  const res: unknown[] = [];
  for (const c of actCases) {
    const inst = baseInst(mixTiles);
    const u = (id: string, side: 'atk' | 'def', q: number, r: number, order: unknown): any => orderUnit(mixTiles, id, side, q, r, { playerOrder: order, ...(c.flags[id] ?? {}) });
    inst.atk = [u('a0', 'atk', 20, 60, { type: 'move', col: 25, row: 60 }), u('a1', 'atk', 21, 61, { type: 'attackMove', col: 26, row: 61 }), u('a2', 'atk', 22, 62, { type: 'move', col: 27, row: 62 }),
      u('a3', 'atk', 23, 63, { type: 'attackMove', col: 28, row: 63 }), u('a4', 'atk', 24, 64, { type: 'attack', targetId: 'd1' })];
    inst.def = [u('d0', 'def', 40, 60, { type: 'none' }), u('d1', 'def', 41, 61, { type: 'none' })];
    // the snapshot order of `_beginTurn` (interleaved atk/def)
    inst.turnOrder = [inst.atk[0], inst.def[0], inst.atk[1], inst.def[1], inst.atk[2], inst.atk[3], inst.atk[4]];
    inst.turnIdx = c.turnIdx;
    inst._queuedOrderUnitIds = new Set(c.pre);
    inst._manualMode = c.manual;
    inst._battleAwaitingOrders = false;
    inst._autoBattleSuspended = true; // the activation callback returns right after the queue step
    const calls: unknown[] = [];
    inst._checkEnd = () => false;
    inst._updateBattlePhaseBanner = () => {};
    inst._schedule = (ms: number) => { calls.push(['schedule', ms]); };
    inst._activateUnit = (ru: any, done: () => void) => { calls.push(['activate', ru.bu.id]); done(); };
    const origRefresh = inst._refreshQueuedOrderVisuals;
    inst._refreshQueuedOrderVisuals = function (this: any) { calls.push(['refresh', [...this._queuedOrderUnitIds]]); return origRefresh.call(this); };
    inst._activateNext();
    res.push({ ...c, order: inst.turnOrder.map(unitFlags), turnIdxAfter: inst.turnIdx, queued: [...inst._queuedOrderUnitIds], calls, scene: dumpTree(inst.scene, true) });
  }
  out.activate = res;
}

// ------------------------------------------------------------- 5. kill = immediate removal; fades
const UNITS = unitsJson as any[];
const statsRow = UNITS.find((r) => Number(r['Morale'] ?? r['morale']) > 0) ?? UNITS[0];
/** A scene unit: fallback avatar + bar stack in the scene root (spawn order: group, bars). */
function sceneUnit(inst: any, id: string, side: 'atk' | 'def', q: number, r: number, extra: Record<string, unknown> = {}): any {
  const color = side === 'atk' ? 0x2266cc : 0xcc4422;
  const group = BS.makeFallbackAvatar(color);
  const bars = BS.makeUnitBars(BS.sideColor(side, inst._deployPlayerSideOpt), false);
  const { x, z } = BS.cellToWorld(q, r);
  const top = BS.tileTopY(inst.terrainMap, q, r);
  group.position.set(x, top, z);
  bars.hpBarGroup.position.set(x, top + BS.HPBAR_Y, z);
  inst.scene.add(group);
  inst.scene.add(bars.hpBarGroup);
  const baseBu = { id, nazwa: 'Wojownik', kategoria: 'piechota', stats: statsRow, hp: 7, maxHp: 10 };
  const ru: any = {
    isArmyCommander: false, group, ...bars, mats: group.userData['mats'], perTokenGeos: group.userData['perTokenGeos'],
    ammoBarShown: false, ammoLeft: Infinity, ammoMax: Infinity,
    q, r, side, dead: false, fadingOut: false, routed: false, removed: false, acted: false, onWallWalkway: false,
    morale: 30, moraleMax: 40, playerOrder: { type: 'none' }, ...extra,
  };
  ru.bu = { ...baseBu, ...((extra['bu'] as object | undefined) ?? {}) };
  inst._updateHpBar(ru); inst._updateMoraleBar(ru);
  inst.occByKey.set(`${q},${r}`, ru);
  return ru;
}
const sceneFlags = (u: any): unknown[] => [u.bu.id, u.removed ? 1 : 0, u.dead ? 1 : 0, u.fadingOut ? 1 : 0, u.group.parent ? 1 : 0, u.group.visible, u.hpBarGroup.parent ? 1 : 0, u.hpBarGroup.visible];
function moraleLogger(inst: any, log: unknown[]): void {
  const orig = inst._updateMoraleBar;
  inst._updateMoraleBar = function (this: any, ru: any) { log.push([ru.bu.id, hx([ru.morale, ru.moraleMax])]); return orig.call(this, ru); };
}
{
  const inst = baseInst(mixTiles);
  for (const k of ['_sfxDeath', '_sfxRout']) inst[k] = () => {};
  inst.atk = [
    sceneUnit(inst, 'k0', 'atk', 30, 70),
    sceneUnit(inst, 'k1', 'atk', 31, 70, { dead: true }),
    sceneUnit(inst, 'k2', 'atk', 32, 70, { fadingOut: true }),
    sceneUnit(inst, 'k3', 'atk', 33, 70),
    sceneUnit(inst, 'k4', 'atk', 34, 70, { routed: true }),
    sceneUnit(inst, 'k5', 'atk', 35, 71, { isArmyCommander: true, bu: { armyLeaderMoraleBonusFrac: 0.2 } }),
    sceneUnit(inst, 'k6', 'atk', 36, 71, { bu: { armyLeaderMoraleBonusFrac: 0.2 }, morale: 33, moraleMax: 48 }),
    sceneUnit(inst, 'k7', 'atk', 37, 71, { bu: { armyLeaderMoraleBonusFrac: 0 } }),
  ];
  inst.def = [
    sceneUnit(inst, 'e0', 'def', 50, 70, { bu: { armyLeaderMoraleBonusFrac: 0.3 }, morale: 50, moraleMax: 60 }),
  ];
  // k3 removed earlier (`_removeUnitFromScene` — routed off-field / `_resetDeploySide`)
  inst._removeUnitFromScene(inst.atk[3]);
  const before = dumpTree(inst.scene, true);
  const steps: unknown[] = [];
  for (const id of ['k0', 'k1', 'k2', 'k3', 'k4', 'k5', 'k0']) {
    const ru = [...inst.atk, ...inst.def].find((u: any) => u.bu.id === id);
    const mlog: unknown[] = [];
    moraleLogger(inst, mlog);
    inst.vNow = 40000 + steps.length * 37.5;
    const wasRemoved = ru.removed;
    inst._startFade(ru);
    delete inst._updateMoraleBar;
    steps.push({ id, removedNow: !wasRemoved && ru.removed ? 1 : 0, morale: mlog, flags: [...inst.atk, ...inst.def].map(sceneFlags), occ: sorted(inst.occByKey.keys()), summary: dumpTree(inst.scene, false) });
  }
  const afterKills = dumpTree(inst.scene, true);
  const fades = [40000, 40250, 40500, 41000].map((t) => { inst._tickFades(t); return [t, inst.fadingUnits.length, (dumpTree(inst.scene, false) as any).sig]; });
  out.kill = { before, steps, after: afterKills, fades, deathFadeMs: hx([BS.DEATH_FADE_MS]) };
}

// ------------------------------------------------------------- 6. wall breach with a defender catapult on the tile
{
  const tiles = new Uint8Array(mixTiles);
  const WALL_COL = 40;
  for (let r = 60; r <= 90; r++) tiles[r * W + WALL_COL] = 6;
  // retreat cells: (41,72) free + passable, (41,74) occupied -> searched further, (41,76) river
  tiles[72 * W + 41] = 0; tiles[76 * W + 41] = 3;
  const inst = baseInst(tiles);
  inst._deployPlayerSideOpt = 'def';
  inst.siegeWallCol = WALL_COL;
  inst.siegeWallGroup = null;
  inst.siegeTowers = [];
  inst.wallTileHp = new Map([70, 72, 74, 76, 78].map((r) => [r, 640]));
  inst.wallEverBreached = false;
  const checkRouts: string[] = [];
  for (const k of ['_sfxDeath', '_spawnWallLabel', '_applyTerrainRange']) inst[k] = () => {};
  inst._checkRout = (u: any) => { checkRouts.push(u.bu.id); };
  const onWall = { onWallWalkway: true };
  inst.def = [
    sceneUnit(inst, 'c0', 'def', WALL_COL, 70, { ...onWall, bu: { nazwa: 'Katapulta', stats: { Jednostka: 'Katapulta' } } }),
    sceneUnit(inst, 'w1', 'def', WALL_COL, 72, { ...onWall }),
    sceneUnit(inst, 'w2', 'def', WALL_COL, 74, { ...onWall }),
    sceneUnit(inst, 'w3', 'def', WALL_COL, 76, { ...onWall }),
    sceneUnit(inst, 'c4', 'def', WALL_COL, 78, { ...onWall, dead: true, bu: { nazwa: 'Katapulta', stats: { Jednostka: 'Katapulta' } } }),
    sceneUnit(inst, 'g5', 'def', 41, 74),
    sceneUnit(inst, 'g6', 'def', 45, 70, { routed: true }),
  ];
  // wall-walk units stand at the walk height (`_placeSiegeDefenders`)
  for (const u of inst.def) if (u.onWallWalkway) { u.group.position.y = 2.5; u.hpBarGroup.position.y = 2.5 + BS.HPBAR_Y; }
  inst.atk = [sceneUnit(inst, 'x0', 'atk', 20, 70)];
  const breaches: unknown[] = [];
  const tiles0 = Buffer.from(tiles).toString('hex');
  for (const row of [70, 72, 74, 76, 78, 70]) {
    const mlog: unknown[] = [];
    moraleLogger(inst, mlog);
    checkRouts.length = 0;
    const before = new Map(inst.def.map((u: any) => [u.bu.id, [u.q, u.r, u.removed]]));
    inst._breachWallTile(row);
    delete inst._updateMoraleBar;
    const changed = inst.def.filter((u: any) => { const b = before.get(u.bu.id)!; return b[0] !== u.q || b[1] !== u.r || b[2] !== u.removed; })
      .map((u: any) => [u.bu.id, u.removed ? 'killed' : 'moved', u.q, u.r]);
    breaches.push({ row, changed, morale: mlog, routChecks: checkRouts.slice(), breached: inst.wallEverBreached, flags: inst.def.map(sceneFlags), occ: sorted(inst.occByKey.keys()), scene: dumpTree(inst.scene, true), tilesHex: Buffer.from(tiles).toString('hex') });
  }
  out.breach = { wallCol: WALL_COL, tilesHex: tiles0, breaches };
}

const dir = process.argv[2] ?? '.';
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'a1.json'), JSON.stringify({ three: THREE.REVISION, node: process.version, ...out }));
console.log(`repin3d a1 queued=${(out.queued as unknown[]).length} issue=${(out.issue as unknown[]).length} activate=${(out.activate as unknown[]).length} breaches=${((out.breach as any).breaches as unknown[]).length}`);
process.exit(0);
