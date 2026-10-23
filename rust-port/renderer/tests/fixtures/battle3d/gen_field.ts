// Reference-vector generator for MOD-14 "battle 3D", part 2: the static battlefield
// (R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q2).
//
// Runs the REAL web code of `edb8fb56` (`git archive edb8fb56 gra/src gra/data`,
// three@0.169.0, esbuild@0.24.0, node v22.22.0):
//   - `new BattleScene(opts)` — the full constructor (empty armies) under a universal DOM
//     stub (`dom_stub.ts`) with `THREE.WebGLRenderer` replaced by an inert stub
//     (`three_shim.ts`, only for battleScene.ts's `three` import);
//   - `_buildBattlefield`, `_buildSiegeInteriorBuildings`, `_buildDeployZone`,
//     `_carveWallTiles`, `_appendDeployCellOutline`, `_applyCamera` called directly on
//     `Object.create(BattleScene.prototype)` for synthetic terrain grids;
//   - `generateBattleTerrain` + `_carveBattleBox` + `_fencePlayableZone` to produce the
//     terrain-grid DTO the Rust port takes as input (ZAŁOŻENIE Z-36-3).
// `battleScene.ts` is bundled with ONE appended line `export { ... }` (build_field.mjs) so
// module-private constants/helpers are reachable; its text is otherwise unchanged.
// The siege wall subtree (`_placeSiegeWall`, part 3) is EXCLUDED from every dump.
//
// Usage: node gen_field.mjs <out-dir>   (bundle produced by `node build_field.mjs`)

import './dom_stub';
import * as THREE from 'three';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as BS from '../websrc/gra/src/battle/battleScene';
import { generateBattleTerrain, presetForWorldTerrain, type WorldTerrainInput } from '../websrc/gra/src/battle/battle-terrain';

// ------------------------------------------------------------- hashing
const _f32 = new Float32Array(1);
const _f32b = new Uint8Array(_f32.buffer);
const _f64 = new Float64Array(1);
const _f64b = new Uint8Array(_f64.buffer);
/** FNV-1a 32-bit over little-endian bytes (x86/ARM typed arrays are little-endian). */
class Fnv {
  h = 0x811c9dc5 >>> 0;
  byte(b: number): void { this.h ^= b & 0xff; this.h = Math.imul(this.h, 0x01000193) >>> 0; }
  u32(v: number): void { v = v >>> 0; this.byte(v); this.byte(v >>> 8); this.byte(v >>> 16); this.byte(v >>> 24); }
  f32(v: number): void { _f32[0] = v; for (let i = 0; i < 4; i++) this.byte(_f32b[i]!); }
  f64(v: number): void { _f64[0] = v; for (let i = 0; i < 8; i++) this.byte(_f64b[i]!); }
  str(s: string): void { this.u32(s.length); for (let i = 0; i < s.length; i++) this.u32(s.charCodeAt(i)); }
  bool(b: boolean): void { this.byte(b ? 1 : 0); }
}
/** Records a byte stream once; replayed into several hashes. */
class Sink extends Fnv {
  bytes: number[] = [];
  override byte(b: number): void { this.bytes.push(b & 0xff); }
  feed(f: Fnv): void { for (const b of this.bytes) f.byte(b); }
  hash(): number { const f = new Fnv(); this.feed(f); return f.h >>> 0; }
}
if (new Uint8Array(new Uint16Array([1]).buffer)[0] !== 1) throw new Error('big-endian host');

/** Same byte stream as `scene::geo_hash`. */
const _geoHashCache = new WeakMap<THREE.BufferGeometry, number>();
function geoHash(g: THREE.BufferGeometry): number {
  const cached = _geoHashCache.get(g);
  if (cached !== undefined) return cached;
  const h = geoHashRaw(g);
  _geoHashCache.set(g, h);
  return h;
}
function geoHashRaw(g: THREE.BufferGeometry): number {
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
/** IEEE-754 binary32 bits, 8 hex digits per number. */
function hx32(nums: ArrayLike<number>): string {
  const dv = new DataView(new ArrayBuffer(4));
  let out = '';
  for (let i = 0; i < nums.length; i++) {
    dv.setFloat32(0, nums[i]!, false);
    out += dv.getUint32(0, false).toString(16).padStart(8, '0');
  }
  return out;
}
function bytesHex(a: Uint8Array): string {
  let s = '';
  for (const b of a) s += b.toString(16).padStart(2, '0');
  return s;
}
function bytesFnv(a: Uint8Array): number { const f = new Fnv(); f.u32(a.length); for (const b of a) f.byte(b); return f.h >>> 0; }

// ------------------------------------------------------------- object records
const KIND: Record<string, number> = {
  Scene: 0, Group: 1, Object3D: 2, Mesh: 3, InstancedMesh: 4, Line: 5,
  AmbientLight: 6, HemisphereLight: 7, DirectionalLight: 8,
};
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
    SphereGeometry: ['radius', 'widthSegments', 'heightSegments', 'phiStart', 'phiLength', 'thetaStart', 'thetaLength'],
    IcosahedronGeometry: ['radius', 'detail'],
    PlaneGeometry: ['width', 'height', 'widthSegments', 'heightSegments'],
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

function matRecord(m: THREE.Material): Record<string, unknown> {
  const mt = m as THREE.MeshStandardMaterial & THREE.LineDashedMaterial;
  const rec: Record<string, unknown> = {
    t: mt.type,
    color: mt.color.getHex(),
    lin: hx([mt.color.r, mt.color.g, mt.color.b]),
    side: mt.side,
    flat: mt.flatShading ?? null,
    transparent: mt.transparent,
    opacity: hx([mt.opacity]),
    dw: mt.depthWrite,
    dt: mt.depthTest,
    vc: mt.vertexColors,
  };
  if ('emissive' in mt && mt.emissive) { rec.emissive = mt.emissive.getHex(); rec.emLin = hx([mt.emissive.r, mt.emissive.g, mt.emissive.b]); }
  if (mt.type === 'MeshStandardMaterial') { rec.rough = hx([mt.roughness]); rec.metal = hx([mt.metalness]); }
  if (mt.type === 'LineDashedMaterial') { rec.dash = hx([mt.dashSize, mt.gapSize, mt.scale]); }
  return rec;
}

/** Binary material stream (mirrored by `battle3d_field.rs::mat_sig`). */
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

/** Byte stream of one node (mirrored by `battle3d_field.rs::node_sig`). */
function nodeRecord(o: THREE.Object3D, ctx: Ctx, f: Fnv): Record<string, unknown> {
  const k = kindOf(o);
  const parent = o.parent && ctx.index.has(o.parent) ? ctx.index.get(o.parent)! : -1;
  f.u32(KIND[k]!);
  f.str(o.name);
  f.u32(parent + 1);
  const p = [o.position.x, o.position.y, o.position.z];
  const r = [o.rotation.x, o.rotation.y, o.rotation.z];
  const q = [o.quaternion.x, o.quaternion.y, o.quaternion.z, o.quaternion.w];
  const s = [o.scale.x, o.scale.y, o.scale.z];
  for (const v of [...p, ...r]) f.f64(v);
  f.str(o.rotation.order);
  for (const v of [...q, ...s, ...o.matrixWorld.elements]) f.f64(v);
  f.bool(o.castShadow); f.bool(o.receiveShadow); f.bool(o.visible); f.u32(o.renderOrder | 0);
  const rec: Record<string, unknown> = {
    k, name: o.name, parent, p: hx(p), r: hx(r), q: hx(q), s: hx(s), w: hx(o.matrixWorld.elements),
    cs: o.castShadow, rs: o.receiveShadow, vis: o.visible, ro: o.renderOrder,
  };
  if (k === 'Mesh' || k === 'InstancedMesh' || k === 'Line') {
    const m = o as THREE.Mesh;
    const mid = matId(ctx, m.material as THREE.Material);
    const gh = geoHash(m.geometry);
    const par = geoParams(m.geometry);
    f.u32(mid); f.str(m.geometry.type); f.u32(gh);
    for (const v of par) f.f64(v);
    rec.mat = mid;
    rec.geo = { t: m.geometry.type, vtx: m.geometry.getAttribute('position').count, tri: triCount(m.geometry), hash: gh, par: hx(par) };
    if (k === 'Line') {
      const ld = m.geometry.getAttribute('lineDistance') as THREE.BufferAttribute | undefined;
      f.byte(ld ? 1 : 0);
      if (ld) for (const v of ld.array as Float32Array) f.f32(v);
      rec.geo = { ...(rec.geo as object), pos: hx32(m.geometry.getAttribute('position').array as Float32Array), ld: ld ? hx32(ld.array as Float32Array) : null };
    }
  }
  if (k === 'InstancedMesh') {
    const im = o as THREE.InstancedMesh;
    const arr = im.instanceMatrix.array as Float32Array;
    f.u32(im.instanceMatrix.count); f.u32(im.count);
    const fm = new Fnv(); for (const v of arr) fm.f32(v);
    f.u32(fm.h >>> 0);
    let colHash: number | null = null;
    if (im.instanceColor) {
      const fc = new Fnv(); for (const v of im.instanceColor.array as Float32Array) fc.f32(v);
      colHash = fc.h >>> 0;
      f.byte(1); f.u32(colHash);
    } else f.byte(0);
    const bs = im.boundingSphere;
    if (bs) { f.byte(1); f.f64(bs.center.x); f.f64(bs.center.y); f.f64(bs.center.z); f.f64(bs.radius); } else f.byte(0);
    rec.inst = {
      cap: im.instanceMatrix.count, count: im.count, mHash: fm.h >>> 0, cHash: colHash,
      first: hx32(arr.slice(0, 32)), last: im.count > 0 ? hx32(arr.slice((im.count - 1) * 16, im.count * 16)) : '',
      firstColor: im.instanceColor ? hx32((im.instanceColor.array as Float32Array).slice(0, 6)) : null,
      bs: bs ? hx([bs.center.x, bs.center.y, bs.center.z, bs.radius]) : null,
    };
  }
  if (k === 'AmbientLight' || k === 'HemisphereLight' || k === 'DirectionalLight') {
    const l = o as THREE.DirectionalLight & THREE.HemisphereLight;
    const lr: Record<string, unknown> = { color: hx([l.color.r, l.color.g, l.color.b]), hex: l.color.getHex(), intensity: hx([l.intensity]) };
    f.f64(l.color.r); f.f64(l.color.g); f.f64(l.color.b); f.f64(l.intensity);
    if (k === 'HemisphereLight') {
      lr.ground = hx([l.groundColor.r, l.groundColor.g, l.groundColor.b]); lr.groundHex = l.groundColor.getHex();
      f.f64(l.groundColor.r); f.f64(l.groundColor.g); f.f64(l.groundColor.b);
    }
    if (k === 'DirectionalLight') {
      const t = l.target;
      const ti = ctx.index.has(t) ? ctx.index.get(t)! : -1;
      const tp = [t.position.x, t.position.y, t.position.z];
      const sh = l.shadow;
      const cam = sh.camera as THREE.OrthographicCamera;
      const shadow = [sh.mapSize.x, sh.mapSize.y, cam.near, cam.far, cam.left, cam.right, cam.top, cam.bottom, sh.bias, sh.normalBias, sh.radius];
      f.u32(ti + 1);
      for (const v of [...tp, ...shadow]) f.f64(v);
      lr.target = ti; lr.targetPos = hx(tp); lr.shadow = hx(shadow);
    }
    rec.light = lr;
  }
  return rec;
}

/** Traverse order index; the siege wall subtree is skipped (part 3). */
function indexScene(root: THREE.Object3D, skip: THREE.Object3D | null): THREE.Object3D[] {
  const out: THREE.Object3D[] = [];
  const walk = (o: THREE.Object3D): void => {
    if (o === skip) return;
    out.push(o);
    for (const c of o.children) walk(c);
  };
  walk(root);
  return out;
}

const FULL_CAP = 3;

function dumpScene(scene: THREE.Scene, skip: THREE.Object3D | null): { rec: Record<string, unknown>; index: Map<THREE.Object3D, number> } {
  scene.updateMatrixWorld(true);
  const order = indexScene(scene, skip);
  const ctx: Ctx = { index: new Map(), matIds: new Map(), mats: [] };
  order.forEach((o, i) => ctx.index.set(o, i));
  // Runs of consecutive top-level children with the same label.
  const label = (o: THREE.Object3D): string => {
    const k = kindOf(o);
    if (k === 'Mesh' || k === 'InstancedMesh' || k === 'Line') {
      const m = o as THREE.Mesh;
      return `${k}:${m.geometry.type}:${geoHash(m.geometry)}:${(m.material as THREE.Material).type}`;
    }
    return `${k}:${o.name}`;
  };
  const top = scene.children.filter((c) => c !== skip);
  const runs: Record<string, unknown>[] = [];
  const all = new Fnv();
  // scene root record first
  nodeRecord(scene, ctx, all);
  let i = 0;
  while (i < top.length) {
    const lb = label(top[i]!);
    let j = i;
    while (j < top.length && label(top[j]!) === lb) j++;
    const f = new Fnv();
    const full: unknown[] = [];
    let nodes = 0;
    for (let c = i; c < j; c++) {
      for (const o of indexScene(top[c]!, skip)) {
        const sink = new Sink();
        const rec = nodeRecord(o, ctx, sink);
        sink.feed(f);
        sink.feed(all);
        if (nodes < FULL_CAP) full.push({ i: ctx.index.get(o), sig: sink.hash(), ...rec });
        nodes++;
      }
    }
    runs.push({ label: lb, start: i, children: j - i, nodes, sig: f.h >>> 0, full });
    i = j;
  }
  const matSigs = ctx.mats.map((m) => matSig(m));
  const seen = new Set<number>();
  const matFull: unknown[] = [];
  ctx.mats.forEach((m, id) => {
    const sg = matSigs[id]!;
    if (seen.has(sg) || matFull.length >= 40) return;
    seen.add(sg);
    matFull.push({ id, sig: sg, ...matRecord(m) });
  });
  return { rec: { nodeCount: order.length, sig: all.h >>> 0, runs, matSigs, matFull }, index: ctx.index };
}

// ------------------------------------------------------------- terrain DTO
type Grid = { cols: number; rows: number; tiles: Uint8Array };
function makeTm(g: Grid): any {
  const { cols, rows, tiles } = g;
  const at = (c: number, r: number): number => (c < 0 || c >= cols || r < 0 || r >= rows ? 0 : tiles[r * cols + c]!);
  return { cols, rows, tiles, at, passable: (c: number, r: number) => { const t = at(c, r); return t !== 3 && t !== 6 && t !== 7; } };
}

/** The DTO input: generateBattleTerrain + _carveBattleBox + _fencePlayableZone (constructor :2686-2703). */
function terrainDto(teren: string, worldTerrain: WorldTerrainInput | undefined): { grid: Grid; desert: boolean } {
  const preset = presetForWorldTerrain(worldTerrain);
  const presetActive = worldTerrain != null;
  const tm = generateBattleTerrain({
    cols: BS.BF_COLS, rows: BS.BF_ROWS, seed: 'bf:' + teren, deployMargin: 4, rowMargin: BS.PLAY_ROW0,
    preset, safeCols: BS.battleSafeCols(presetActive),
  });
  const inst: any = Object.create(BS.BattleScene.prototype);
  inst.terrainMap = tm;
  inst._carveBattleBox(presetActive);
  inst._fencePlayableZone();
  return { grid: { cols: tm.cols, rows: tm.rows, tiles: new Uint8Array(tm.tiles) }, desert: preset.desertPalette };
}

function siegeRecord(s: any): Record<string, unknown> {
  return {
    wallCol: s.siegeWallCol, rowLo: s.siegeWallRowLo, rowHi: s.siegeWallRowHi, gateCol: s.siegeGateCol, gateRow: s.siegeGateRow,
    gateHp: s.gateHp, gateOpen: s.gateOpen, wallTileHp: [...(s.wallTileHp as Map<number, number>).entries()].map(([k, v]) => [k, v]),
  };
}

function cameraRecord(s: any): Record<string, unknown> {
  const cam = s.camera as THREE.PerspectiveCamera;
  cam.updateMatrixWorld(true);
  return {
    fov: hx([cam.fov]), aspect: hx([cam.aspect]), near: hx([cam.near]), far: hx([cam.far]), zoom: hx([cam.zoom]),
    p: hx([cam.position.x, cam.position.y, cam.position.z]),
    r: hx([cam.rotation.x, cam.rotation.y, cam.rotation.z]),
    q: hx([cam.quaternion.x, cam.quaternion.y, cam.quaternion.z, cam.quaternion.w]),
    up: hx([cam.up.x, cam.up.y, cam.up.z]),
    w: hx(cam.matrixWorld.elements), proj: hx(cam.projectionMatrix.elements),
    target: hx([s.camTarget.x, s.camTarget.y, s.camTarget.z]), dir: hx([s.camDir.x, s.camDir.y, s.camDir.z]),
    dist: hx([s.camDist, s.camDistTarget, s.camDistMin, s.camDistMax]),
  };
}

// ------------------------------------------------------------- cases
const out: Record<string, unknown> = {};

// 1. Constructor cases: `new BattleScene(opts)` with empty armies.
type CtorCase = { id: string; teren: string; worldTerrain?: WorldTerrainInput; siege?: { civ?: string; defCiv?: string }; deploy?: 'atk' | 'def' };
const ctorCases: CtorCase[] = [
  { id: 'legacy-laka', teren: 'Laka' },
  { id: 'legacy-las', teren: 'Las' },
  { id: 'legacy-gory', teren: 'Góry' },
  { id: 'preset-laka', teren: 'Laka', worldTerrain: { baza: 'laka' } },
  { id: 'preset-rownina', teren: 'Rownina', worldTerrain: { baza: 'rownina' } },
  { id: 'preset-wzgorza', teren: 'Wzgorza', worldTerrain: { baza: 'wzgorza' } },
  { id: 'preset-gory', teren: 'Gory', worldTerrain: { baza: 'gory' } },
  { id: 'preset-pustynia', teren: 'Pustynia', worldTerrain: { baza: 'pustynia' } },
  { id: 'preset-plytkie', teren: 'Plytkie morze', worldTerrain: { baza: 'plytkie_morze' } },
  { id: 'preset-las', teren: 'Rownina', worldTerrain: { baza: 'rownina', las: true } },
  { id: 'preset-rzeka', teren: 'Rownina', worldTerrain: { baza: 'rownina', rzeka: true } },
  { id: 'siege-legacy', teren: 'Laka', siege: { civ: 'rzym' } },
  { id: 'siege-wzgorza-egipt', teren: 'Wzgorza', worldTerrain: { baza: 'wzgorza' }, siege: { civ: 'rzym', defCiv: 'egipt' } },
  { id: 'deploy-atk', teren: 'Laka', worldTerrain: { baza: 'laka', las: true }, deploy: 'atk' },
  { id: 'deploy-def', teren: 'Las', deploy: 'def' },
  { id: 'deploy-siege-def', teren: 'Laka', siege: { civ: 'zulu' }, deploy: 'def' },
];
const ctorOut: unknown[] = [];
for (const c of ctorCases) {
  const dto = terrainDto(c.teren, c.worldTerrain);
  const s: any = new BS.BattleScene({
    attacker: [], defender: [], teren: c.teren, worldTerrain: c.worldTerrain, siege: c.siege as any,
    deploy: c.deploy != null, deployPlayerSide: c.deploy,
  } as any);
  // The DTO, carved with the web _carveWallTiles, must equal the constructor's grid.
  const chk: any = Object.create(BS.BattleScene.prototype);
  chk.terrainMap = makeTm({ ...dto.grid, tiles: new Uint8Array(dto.grid.tiles) });
  chk.wallTileHp = new Map();
  if (c.siege) chk._carveWallTiles();
  if (bytesHex(chk.terrainMap.tiles) !== bytesHex(s.terrainMap.tiles)) throw new Error(`DTO mismatch ${c.id}`);
  if (dto.desert !== s._desertPalette) throw new Error(`desert mismatch ${c.id}`);
  const { rec, index } = dumpScene(s.scene, s.siegeWallGroup ?? null);
  const r = s.renderer;
  ctorOut.push({
    id: c.id, teren: c.teren, worldTerrain: c.worldTerrain ?? null, siege: c.siege ?? null, deploy: c.deploy ?? null,
    desert: dto.desert, cols: dto.grid.cols, rows: dto.grid.rows, tilesIn: bytesHex(dto.grid.tiles),
    tilesOutHash: bytesFnv(s.terrainMap.tiles),
    siegeState: siegeRecord(s), wallIndexInChildren: s.siegeWallGroup ? s.scene.children.indexOf(s.siegeWallGroup) : -1,
    env: {
      background: hx([s.scene.background.r, s.scene.background.g, s.scene.background.b]), backgroundHex: s.scene.background.getHex(),
      fog: { t: s.scene.fog.isFogExp2 ? 'FogExp2' : 'Fog', color: hx([s.scene.fog.color.r, s.scene.fog.color.g, s.scene.fog.color.b]), hex: s.scene.fog.color.getHex(), density: hx([s.scene.fog.density]) },
    },
    renderer: { shadowMap: r.shadowMap.enabled, shadowType: r.shadowMap.type, toneMapping: r.toneMapping, exposure: hx([r.toneMappingExposure]), pixelRatio: hx([r.pixelRatio]) },
    camera: cameraRecord(s),
    groundPick: (s._battleGroundPickMeshes as THREE.Object3D[]).map((m) => index.get(m) ?? -1),
    deployZone: (s._deployZoneMeshes as THREE.Object3D[] | undefined ?? []).map((m) => index.get(m) ?? -1),
    deployGroup: s._deployVisualGroup ? index.get(s._deployVisualGroup) ?? -1 : -1,
    ...rec,
  });
}
out.ctor = ctorOut;

// 2. Synthetic grids through the builders called directly.
function lcg(seed: number): () => number {
  let a = seed >>> 0;
  return () => { a = (Math.imul(a, 1664525) + 1013904223) >>> 0; return a / 4294967296; };
}
function synthGrid(cols: number, rows: number, fill: (c: number, r: number, rnd: () => number) => number, seed: number): Grid {
  const rnd = lcg(seed);
  const tiles = new Uint8Array(cols * rows);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) tiles[r * cols + c] = fill(c, r, rnd);
  return { cols, rows, tiles };
}
type SynCase = { id: string; grid: Grid; desert: boolean; wall: 'carve' | number | null; gateRow?: number; deploy: 'atk' | 'def' | null; outlines: [number, number, number, number, number, number, boolean][] };
const W = BS.BF_COLS, H = BS.BF_ROWS;
const mix = (_c: number, _r: number, rnd: () => number): number => Math.floor(rnd() * 8);
const synCases: SynCase[] = [
  { id: 'all-plains', grid: synthGrid(W, H, () => 0, 1), desert: false, wall: null, deploy: null, outlines: [] },
  { id: 'all-plains-desert', grid: synthGrid(W, H, () => 0, 1), desert: true, wall: 'carve', deploy: 'atk', outlines: [] },
  { id: 'mix', grid: synthGrid(W, H, mix, 7), desert: false, wall: 'carve', deploy: 'atk',
    outlines: [[30, 70, 32, 72, 0x44bbff, 0.5, false], [12, 40, 12, 40, 0xff0000, 0.9, true], [0, 0, 67, 155, 0xd4af37, 1, true], [40, 80, 38, 78, 0x00ff00, 0.25, false]] },
  { id: 'mix-desert', grid: synthGrid(W, H, mix, 99), desert: true, wall: 'carve', deploy: 'def', outlines: [[33, 77, 35, 80, 0x123456, 0.7, true]] },
  { id: 'mix-small-grid', grid: synthGrid(20, 30, mix, 3), desert: false, wall: 40, deploy: 'def', outlines: [[18, 28, 22, 33, 0xffffff, 0.3, true]] },
  { id: 'all-river', grid: synthGrid(W, H, () => 3, 1), desert: false, wall: 'carve', deploy: 'atk', outlines: [] },
  { id: 'no-interior-room', grid: synthGrid(W, H, mix, 11), desert: false, wall: 60, deploy: null, outlines: [] },
  // `siegeGateRow` 79: plot row 76 sits exactly STREET_HALF (3) away (in the game the gate row is always 77).
  { id: 'interior-gate-79', grid: synthGrid(W, H, () => 0, 1), desert: false, wall: 40, gateRow: 79, deploy: null, outlines: [] },
  { id: 'hills-rocks', grid: synthGrid(W, H, (_c, _r, rnd) => (rnd() < 0.5 ? 2 : 5), 5), desert: false, wall: -1, deploy: null, outlines: [[25, 60, 27, 61, 0x808080, 0.6, false]] },
];
const synOut: unknown[] = [];
for (const c of synCases) {
  const inst: any = Object.create(BS.BattleScene.prototype);
  inst.scene = new THREE.Scene();
  inst.ownedGeos = []; inst.ownedMats = [];
  inst._desertPalette = c.desert;
  inst.terrainMap = makeTm({ ...c.grid, tiles: new Uint8Array(c.grid.tiles) });
  inst.wallTileHp = new Map();
  inst.siegeWallCol = -1; inst.siegeGateRow = -1;
  inst._deployZoneMeshes = [];
  inst._deployPlayerSideOpt = c.deploy ?? 'atk';
  if (c.wall === 'carve') inst._carveWallTiles();
  else if (typeof c.wall === 'number') { inst.siegeWallCol = c.wall; inst.siegeGateRow = c.gateRow ?? BS.PLAY_MID_ROW; }
  inst._buildBattlefield('');
  if (c.wall !== null) inst._buildSiegeInteriorBuildings();
  if (c.deploy) inst._buildDeployZone();
  let ghost: THREE.Group | null = null;
  if (c.outlines.length > 0) {
    inst._deployGhostGroup = null;
    inst._initDeployGhostLayer();
    ghost = inst._deployGhostGroup;
    inst._deployGhostOwnedGeos = []; inst._deployGhostOwnedMats = [];
    for (const o of c.outlines) inst._appendDeployCellOutline(...o);
  }
  const { rec, index } = dumpScene(inst.scene, null);
  synOut.push({
    id: c.id, desert: c.desert, wall: c.wall, gateRow: c.gateRow ?? null, deploy: c.deploy, outlines: c.outlines.map((o) => [...o.slice(0, 4), o[4], hx([o[5] as number]), o[6]]),
    cols: c.grid.cols, rows: c.grid.rows, tilesIn: bytesHex(c.grid.tiles), tilesOutHash: bytesFnv(inst.terrainMap.tiles),
    siegeState: siegeRecord(inst),
    groundPick: (inst._battleGroundPickMeshes as THREE.Object3D[]).map((m) => index.get(m) ?? -1),
    deployZone: (inst._deployZoneMeshes as THREE.Object3D[]).map((m) => index.get(m) ?? -1),
    deployGroup: inst._deployVisualGroup ? index.get(inst._deployVisualGroup) ?? -1 : -1,
    ...rec,
  });
}
out.synthetic = synOut;

// 3. _applyCamera for clamped / unclamped distances (camera as data).
const camOut: unknown[] = [];
for (const [dist, tx, tz] of [[30, 33, 77], [1, 10, 10], [500, 0, 0], [101.2, 67.5, 155.25], [Number.NaN, 5, 5]] as const) {
  const inst: any = Object.create(BS.BattleScene.prototype);
  inst.camera = new THREE.PerspectiveCamera(48, 1, 0.1, 4000);
  inst.camTarget = new THREE.Vector3(tx, 0, tz);
  inst.camDir = new THREE.Vector3(0, 0.92, 0.92).normalize();
  inst.camDist = dist; inst.camDistTarget = dist; inst.camDistMin = 7.7; inst.camDistMax = 257.4;
  inst._applyCamera();
  camOut.push({ in: hx([dist, tx, tz]), ...cameraRecord(inst) });
}
out.applyCamera = camOut;

// 4. Module constants (equality test) and pure helpers.
const consts: Record<string, unknown> = {};
for (const k of ['BF_COLS', 'BF_ROWS', 'PLAYABLE_COLS', 'PLAYABLE_ROWS', 'PLAY_COL0', 'PLAY_ROW0', 'PLAY_COL1', 'PLAY_ROW1',
  'PLAY_MID_COL', 'PLAY_MID_ROW', 'TILE_S', 'TILE_H', 'MAX_PER_SIDE', 'RANK_WIDTH', 'MAX_RANKS', 'DEPLOY_MARGIN', 'FRONT_GAP',
  'ATK_FRONT_COL', 'DEF_FRONT_COL', 'ATK_COL_STEP', 'DEF_COL_STEP', 'DEPLOY_MID_COL', 'DEPLOY_DEF_MIN_COL',
  'FOREST_CONE_COLOR', 'FOREST_CONE_COLOR2', 'FOREST_TRUNK_COLOR', 'HILL_GRASS_COLOR', 'SHRUB_COLOR', 'ROCK_COLOR',
  'RIVER_WATER_COLOR', 'HILL_GRASS_COLOR_DESERT', 'SHRUB_COLOR_DESERT', 'ROCK_COLOR_DESERT', 'GRASS_TUFT_COLOR_A',
  'GRASS_TUFT_COLOR_B', 'PEBBLE_COLOR', 'TINY_BUSH_COLOR', 'GRASS_TUFT_COLOR_A_DESERT', 'GRASS_TUFT_COLOR_B_DESERT',
  'HILL_LIFT', 'HILL_BUMP_RADIUS', 'HILL_SUMMIT_Y', 'RIVER_DROP'] as const) {
  consts[k] = hx([(BS as any)[k] as number]);
}
consts.BT_FLOOR_COLOR = Object.entries(BS.BT_FLOOR_COLOR).map(([k, v]) => [Number(k), v]);
consts.BT_FLOOR_COLOR_DESERT = Object.entries(BS.BT_FLOOR_COLOR_DESERT).map(([k, v]) => [Number(k), v]);
consts.SIEGE_BLDG_BODY_COLORS = BS.SIEGE_BLDG_BODY_COLORS;
consts.SIEGE_BLDG_ROOF_COLORS = BS.SIEGE_BLDG_ROOF_COLORS;
consts.WALL_TILE_HP = (BS.BattleScene as any).WALL_TILE_HP;
consts.deployClearRanks = [BS.deployClearRanksFor(false), BS.deployClearRanksFor(true)];
consts.battleSafeCols = [BS.battleSafeCols(false), BS.battleSafeCols(true)];
out.consts = consts;

const helpers: Record<string, unknown> = {};
{
  const rnd = lcg(2024);
  const lt: unknown[] = []; const bl: unknown[] = [];
  const colors = [0, 0xffffff, 0x6fa84a, 0x9a9080, 0x123456, 0xd7b877, 0x808080, 0x010203];
  const amounts = [0, 1, 0.5, 0.022, 0.05, -0.07, 0.0675, -0.0675, 0.0225, 0.07, 1e-9, -1e-9];
  for (const c of colors) for (const a of amounts) { lt.push([c, hx([a]), BS.lighten(c, a)]); bl.push([c, 0x9090a0, hx([a]), BS.blend(c, 0x9090a0, a)]); }
  for (let i = 0; i < 200; i++) {
    const c = Math.floor(rnd() * 0x1000000); const d = Math.floor(rnd() * 0x1000000); const a = rnd() * 2 - 1;
    lt.push([c, hx([a]), BS.lighten(c, a)]); bl.push([c, d, hx([a]), BS.blend(c, d, a)]);
  }
  helpers.lighten = lt; helpers.blend = bl;
  const gable = BS.makeGableRoofGeometry();
  helpers.gable = { hash: geoHash(gable), pos: hx32(gable.getAttribute('position').array as Float32Array), nor: hx32(gable.getAttribute('normal').array as Float32Array) };
  const cw: unknown[] = [];
  for (const [c, r] of [[0, 0], [33, 77], [67, 155], [-1, 2.5], [12.25, -3]]) { const w = BS.cellToWorld(c!, r!); cw.push([hx([c!, r!]), hx([w.x, w.z])]); }
  helpers.cellToWorld = cw;
  const grid = makeTm(synthGrid(W, H, mix, 7));
  const tt: unknown[] = [];
  for (const [c, r] of [[0, 0], [5, 5], [33, 77], [70, 10], [-1, 3], [10, 200]]) tt.push([c, r, hx([BS.tileTopY(grid, c!, r!)])]);
  helpers.tileTopY = tt;
}
out.helpers = helpers;

const dir = process.argv[2] ?? '.';
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'field.json'), JSON.stringify({ three: THREE.REVISION, node: process.version, ...out }));
console.log(`battle3d field ctor=${ctorOut.length} synthetic=${synOut.length} nodes=${[...ctorOut, ...synOut].reduce((a: number, c: any) => a + c.nodeCount, 0)}`);
