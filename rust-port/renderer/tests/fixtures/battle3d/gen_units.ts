// Reference-vector generator for MOD-14 "battle 3D", part 3: units and overlays
// (R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q3).
//
// Runs the REAL web code of `edb8fb56` (`git archive edb8fb56 gra/src gra/data`,
// three@0.169.0, esbuild@0.24.0, node v22.22.0), bundled by `build_units.mjs` (the
// part-2 bundler with a longer appended `export { ... }` line; `battleScene.ts` text is
// otherwise unchanged):
//   - `new BattleScene(opts)` WITH armies (`buildTestArmies` presets of `testBattle.ts`
//     and synthetic rosters built from `data/units.json`), incl. sieges (`_placeSiegeWall`,
//     `_placeSiegeDefenders`) and deploy mode; the RuntimeBattleUnit state the web placement
//     produced is dumped as the DTO the Rust port takes as input (ZAŁOŻENIE Z-36-7);
//   - post-construction scene operations: `_resetDeploySide` (`_placeUnitsOneSide`),
//     `_removeUnitFromScene`, `_removeAllUnitsFromField`, the climb branch of `_activateUnit`;
//   - overlay methods called directly on `Object.create(BattleScene.prototype)` with
//     injected lookups (selection, picking and layout are logic / part 5): `makeUnitBars`,
//     `makeFallbackAvatar`, `_update{Hp,Morale,Ammo}Bar`, selection rings, `_makeOrderArrow`,
//     `_refreshQueuedOrderVisuals`, `_updateOrderPreview`, ghosts (`_refreshBattleMoveGhosts`,
//     `_refreshDeployGhosts`, `_refreshDeployGhostsAt`, `_updateDeployPlacementPreview`).
//
// Usage: node gen_units.mjs <out-dir>   (bundle produced by `node build_units.mjs`)

import './dom_stub';
import * as THREE from 'three';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as BS from '../websrc/gra/src/battle/battleScene';
import { buildTestArmies, type PresetName } from '../websrc/gra/src/battle/testBattle';
import { generateBattleTerrain, presetForWorldTerrain } from '../websrc/gra/src/battle/battle-terrain';
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
/**
 * `traverse` that skips the group-frame markers (`_updateGroupFrameMarker`, name `groupFrame`:
 * a Line + a number Sprite under a grouped unit's model; the deploy UI groups the player's
 * units). Group markers are part 4 (P4-36 §4 "znaczniki grup", §12a `_makeGroupNumberTexture`
 * -> cz. 4), so they are excluded from part-3 dumps and only counted (`markers`).
 */
function walk(root: THREE.Object3D, cb: (o: THREE.Object3D) => void, skipped: { n: number } = { n: 0 }): void {
  if (root.name === 'groupFrame') { skipped.n++; return; }
  cb(root);
  for (const c of root.children) walk(c, cb, skipped);
}
/** Unit-model signature (`tests/fixtures/unit_core/gen.ts::signature`) + every node's kind / visibility / world matrix. */
function modelRecord(root: THREE.Object3D): Record<string, unknown> {
  const f = new Fnv();
  const all = new Fnv();
  let meshes = 0, tris = 0, n = 0;
  walk(root, (o) => {
    n++;
    all.u32((o as THREE.Mesh).isMesh ? 3 : (o as THREE.Group).isGroup ? 1 : 2);
    all.bool(o.visible);
    for (const e of o.matrixWorld.elements) all.f64(e);
    if (!(o as THREE.Mesh).isMesh) return;
    const m = o as THREE.Mesh;
    meshes++;
    tris += triCount(m.geometry);
    f.u32(geoHash(m.geometry));
    const mt = m.material as THREE.MeshStandardMaterial;
    f.u32(mt.color.getHex());
    f.f64(mt.metalness); f.f64(mt.roughness);
    f.byte(mt.transparent ? 1 : 0); f.f64(mt.opacity); f.byte(mt.flatShading ? 1 : 0);
    for (const e of m.matrixWorld.elements) f.f64(e);
  });
  f.u32(meshes);
  return { n, meshes, tris, sig: f.h >>> 0, all: all.h >>> 0 };
}

// ------------------------------------------------------------- runtime units -> DTO
/** JSON number when it survives the round trip (finite, not -0), else its binary64 bits. */
function num(v: number): number | string { return Number.isFinite(v) && !Object.is(v, -0) ? v : hx([v]); }
function unitDto(s: any, ru: any): unknown[] {
  return [
    ru.bu.id, ru.side, ru.q, ru.r, ru.facing, ru.onWallWalkway ? 1 : 0, ru.bu.kategoria, String(ru.bu.stats?.['Jednostka'] ?? ru.bu.nazwa), ru.bu.ownerColor,
    [ru.bu.hp, ru.bu.maxHp, ru.morale, ru.moraleMax, ru.ammoLeft, ru.ammoMax].map(num), ru.ammoBarShown ? 1 : 0,
    s.scene.children.indexOf(ru.group), s.scene.children.indexOf(ru.hpBarGroup),
  ];
}
/** Per unit: [id, ammoBarShown, root index of group, of bars, model [n, meshes, tris, sig, all], bars [n, sig]]; the first unit's bar tree in full. */
function unitsRecord(s: any, fullFirst: boolean): Record<string, unknown> {
  s.scene.updateMatrixWorld(true);
  const rows: unknown[] = [];
  let firstBars: unknown = null;
  for (const ru of [...s.atk, ...s.def]) {
    const m = modelRecord(ru.group) as any;
    const b = dumpTree(ru.hpBarGroup, fullFirst && firstBars === null) as any;
    if (fullFirst && firstBars === null) firstBars = b;
    rows.push([ru.bu.id, ru.ammoBarShown ? 1 : 0, s.scene.children.indexOf(ru.group), s.scene.children.indexOf(ru.hpBarGroup), [m.n, m.meshes, m.tris, m.sig, m.all], [b.n, b.sig]]);
  }
  return { rows, firstBars };
}
/** Run-length encoding of the tile bytes: [kind, count, kind, count, ...]. */
function rle(t: Uint8Array): number[] {
  const out: number[] = [];
  for (let i = 0; i < t.length;) { let j = i; while (j < t.length && t[j] === t[i]) j++; out.push(t[i]!, j - i); i = j; }
  return out;
}
function wallRecord(s: any): unknown {
  const w = s.siegeWallGroup as THREE.Group | null;
  if (!w) return null;
  s.scene.updateMatrixWorld(true);
  const ud = w.userData;
  return {
    index: s.scene.children.indexOf(w), m: modelRecord(w),
    p: hx([w.position.x, w.position.y, w.position.z]), r: hx([w.rotation.x, w.rotation.y, w.rotation.z]), q: hx([w.quaternion.x, w.quaternion.y, w.quaternion.z, w.quaternion.w]),
    rows: [...(ud['rowWallMeshes'] as Map<number, THREE.Mesh[]>).entries()].length,
    breach: [...(ud['rowBreachPanels'] as Map<number, unknown>).entries()].length,
  };
}
/** Root children count, node count and FNV over (kind, subtree size, visible) of every root child. */
function sceneSummary(s: any): Record<string, unknown> {
  let n = 0;
  const skipped = { n: 0 };
  walk(s.scene, () => { n++; }, skipped);
  const f = new Fnv();
  for (const ch of s.scene.children as THREE.Object3D[]) {
    let k = 0;
    walk(ch, () => { k++; });
    f.u32(KIND[kindOf(ch)]!); f.u32(k); f.bool(ch.visible);
  }
  return { children: s.scene.children.length, nodes: n, struct: f.h >>> 0, markers: skipped.n };
}

// ------------------------------------------------------------- armies
const UNITS = unitsJson as any[];
const CATS = ['wlocznik', 'miecznik', 'lucznik', 'procarz', 'oszczepnik', 'konnica', 'rydwan', 'falanga', 'legionista', 'maczuga', 'topor', 'domyslny', 'super', 'osadnik', 'robotnik', 'zwiadowca'];
const OWNERS = [0xffd54a, 0x4060c8, 0xc0392b, 0x2ecc71, 0x000000, 0xffffff, 0x8e44ad, 0x7f6a3b];
/** Every units.json row once: model category cycled through CATS, HP fraction cycled through 0..1. */
function synthArmy(prefix: string, salt: number): BS.BattleUnit[] {
  return UNITS.map((row, i) => {
    const maxHp = Math.max(1, Math.round(Number(row['Health']) || 10));
    const k = (i * 7 + salt) % 11;
    return {
      id: `${prefix}${i}`, nazwa: String(row['Nazwa EN'] ?? row['Jednostka']), kategoria: CATS[(i + salt) % CATS.length]!,
      ownerColor: OWNERS[(i + salt) % OWNERS.length]!, stats: row, hp: Math.round((maxHp * k) / 10), maxHp,
      veteranBonusFrac: [0, 0.1, 0.2][(i + salt) % 3],
    } as BS.BattleUnit;
  });
}

/** The terrain DTO (= gen_field.ts `terrainDto`, legacy terrains): generateBattleTerrain + _carveBattleBox + _fencePlayableZone. */
function terrainDto(teren: string): { tiles: Uint8Array; desert: boolean } {
  const preset = presetForWorldTerrain(undefined);
  const tm = generateBattleTerrain({ cols: BS.BF_COLS, rows: BS.BF_ROWS, seed: 'bf:' + teren, deployMargin: 4, rowMargin: BS.PLAY_ROW0, preset, safeCols: BS.battleSafeCols(false) });
  const inst: any = Object.create(BS.BattleScene.prototype);
  inst.terrainMap = tm;
  inst._carveBattleBox(false);
  inst._fencePlayableZone();
  return { tiles: new Uint8Array(tm.tiles), desert: preset.desertPalette };
}

type CtorCase = { id: string; preset?: PresetName; synth?: [number, number]; teren?: string; siege?: { civ?: string; defCiv?: string }; deploy?: 'atk' | 'def'; post?: string[] };
const ctorCases: CtorCase[] = [
  { id: 'maly', preset: 'maly' },
  { id: 'rzym-grecja', preset: 'rzym_grecja' },
  { id: 'konnica', preset: 'konnica', teren: 'Las' },
  { id: 'maciej-playtest', preset: 'maciej_playtest', teren: 'Góry' },
  { id: 'oblezenie-rzym', preset: 'oblezenie', siege: { civ: 'rzym' }, post: ['climb'] },
  { id: 'oblezenie-duze-egipt', preset: 'oblezenie_duze', siege: { civ: 'rzym', defCiv: 'egipt' } },
  { id: 'synth-all', synth: [0, 3], teren: 'Laka', post: ['removeOne', 'removeAll'] },
  { id: 'synth-siege-zulu', synth: [5, 9], siege: { civ: 'zulu' } },
  { id: 'deploy-atk', preset: 'rzym_grecja', deploy: 'atk', post: ['resetAtk'] },
  { id: 'deploy-def', preset: 'konnica', deploy: 'def', post: ['resetDef'] },
  { id: 'deploy-siege-def', preset: 'oblezenie', siege: { civ: 'chiny' }, deploy: 'def', post: ['resetDef'] },
];

// Instrumentation (observation only; the wrapped methods run unchanged): the unit state right
// after `_placeUnits` / `_placeUnitsOneSide` (= the spawn DTO; the deploy UI may move units
// afterwards) and every `_moveDeployUnit(ru, col, row)` call (deploy layout moves).
const PROTO: any = BS.BattleScene.prototype;
let spawnSnap: unknown[] | null = null;
let moveLog: [string, number, number][] | null = null;
for (const m of ['_placeUnits', '_placeUnitsOneSide'] as const) {
  const orig = PROTO[m];
  PROTO[m] = function (this: any, ...args: unknown[]) {
    const res = orig.apply(this, args);
    spawnSnap = [...this.atk, ...this.def].map((ru: any) => unitDto(this, ru));
    return res;
  };
}
{
  const orig = PROTO._moveDeployUnit;
  PROTO._moveDeployUnit = function (this: any, ru: any, col: number, row: number) {
    if (moveLog) moveLog.push([ru.bu.id, col, row]);
    return orig.call(this, ru, col, row);
  };
}

const out: Record<string, unknown> = {};
const ctorOut: unknown[] = [];
for (const c of ctorCases) {
  let atk: BS.BattleUnit[], def: BS.BattleUnit[], teren: string;
  if (c.preset) { const a = buildTestArmies(UNITS, c.preset); atk = a.attacker; def = a.defender; teren = c.teren ?? a.teren; }
  else { atk = synthArmy('a', c.synth![0]); def = synthArmy('d', c.synth![1]); teren = c.teren ?? 'Laka'; }
  spawnSnap = null; moveLog = [];
  const s: any = new BS.BattleScene({ attacker: atk, defender: def, teren, siege: c.siege as any, deploy: c.deploy != null, deployPlayerSide: c.deploy } as any);
  const ctorSpawn = spawnSnap, ctorMoves = moveLog;
  moveLog = null;
  // The DTO, carved with the web _carveWallTiles for sieges, must equal the constructor's grid.
  const dto = terrainDto(teren);
  {
    const chk: any = Object.create(BS.BattleScene.prototype);
    chk.terrainMap = { cols: BS.BF_COLS, rows: BS.BF_ROWS, tiles: new Uint8Array(dto.tiles) };
    chk.wallTileHp = new Map();
    if (c.siege) chk._carveWallTiles();
    if (Buffer.compare(Buffer.from(chk.terrainMap.tiles), Buffer.from(s.terrainMap.tiles)) !== 0) throw new Error(`DTO mismatch ${c.id}`);
    if (dto.desert !== s._desertPalette) throw new Error(`desert mismatch ${c.id}`);
  }
  const rec: Record<string, unknown> = {
    id: c.id, teren, siege: c.siege ?? null, deploy: c.deploy ?? null, player: s._playerControlSide(),
    tilesRle: rle(dto.tiles), desert: dto.desert, spawn: ctorSpawn, moves: ctorMoves,
    wall: wallRecord(s), units: unitsRecord(s, true), scene: sceneSummary(s),
    deployGhostIndex: s._deployGhostGroup ? s.scene.children.indexOf(s._deployGhostGroup) : -1,
  };
  const posts: unknown[] = [];
  for (const p of c.post ?? []) {
    if (p === 'resetAtk' || p === 'resetDef') {
      spawnSnap = null; moveLog = [];
      s._resetDeploySide(p === 'resetAtk' ? 'atk' : 'def');
      const moves = moveLog; moveLog = null;
      posts.push({ op: p, spawn: spawnSnap, moves, units: unitsRecord(s, false), scene: sceneSummary(s) });
    } else if (p === 'removeOne') {
      const victims = [s.atk[0], s.def[3], s.def[3]];
      for (const v of victims) s._removeUnitFromScene(v);
      posts.push({ op: p, ids: victims.map((v: any) => v.bu.id), vis: victims.map((v: any) => [v.group.visible, v.hpBarGroup.visible]), scene: sceneSummary(s) });
    } else if (p === 'removeAll') {
      s._removeAllUnitsFromField();
      posts.push({ op: p, scene: sceneSummary(s) });
    } else if (p === 'climb') {
      // `_activateUnit` reaches the climb branch (`:5860-5892`) with the logic hooks before it neutralised:
      const ru = s.atk.find((u: any) => !u.mounted && u.bu.stats?.['Typ'] !== 'Siege');
      const row = ru.r;
      s.occByKey.delete(`${ru.q},${ru.r}`);
      ru.q = s.siegeWallCol - 2; // two tiles in front of the wall; the tower is adjacent at wallCol-1
      s.towerAtWallRows.add(row);
      ru.surroundApplied = true;
      s._applyTerrainRange = () => {}; s._updateFacing = () => {}; s._manualMode = false; s._isUnitDoctrineAuto = () => false;
      // DIRS4 east neighbour (q+1, r) = (wallCol-1, row): climb when wallCol/row is free.
      const wallKey = `${s.siegeWallCol},${row}`;
      const occupant = s.occByKey.get(wallKey);
      if (occupant) s.occByKey.delete(wallKey);
      let doneCalls = 0;
      s._activateUnit(ru, () => { doneCalls++; });
      s.scene.updateMatrixWorld(true);
      posts.push({ op: p, id: ru.bu.id, row, wallCol: s.siegeWallCol, q: ru.q, r: ru.r, onWall: ru.onWallWalkway, moveLeft: ru.moveLeft, done: doneCalls,
        gp: hx([ru.group.position.x, ru.group.position.y, ru.group.position.z]), bp: hx([ru.hpBarGroup.position.x, ru.hpBarGroup.position.y, ru.hpBarGroup.position.z]) });
    }
  }
  rec.posts = posts;
  ctorOut.push(rec);
}
out.ctor = ctorOut;

// ------------------------------------------------------------- direct calls
const P: any = BS.BattleScene.prototype;
const direct: Record<string, unknown> = {};

// 1. makeUnitBars / makeFallbackAvatar
direct.bars = [0x3a6ad0, 0xc84040, 0, 0xffffff, 0x123456].flatMap((col) => [false, true].map((shown) => ({ color: col, shown, tree: dumpTree(BS.makeUnitBars(col, shown).hpBarGroup, true) })));
direct.fallback = [0xffd54a, 0x4060c8, 0].map((col) => ({ color: col, tree: dumpTree(BS.makeFallbackAvatar(col), true) }));

// 2. bar updates
{
  const inf = Infinity, nan = NaN;
  const rows: number[][] = [
    // hp, maxHp, morale, moraleMax, ammoLeft, ammoMax, shown(0/1)
    [60, 60, 50, 50, 2, 2, 1], [0, 60, 0, 50, 0, 2, 1], [37, 60, 30, 50, 1, 2, 1], [36, 60, 20, 50, 1, 3, 1], [18, 60, 1, 50, 3, 3, 1],
    [19, 60, 49.5, 50, 0, 0, 1], [70, 60, 80, 50, inf, inf, 0], [-5, 60, -3, 50, -1, 2, 1], [5, 0, 5, 0, 5, 0, 1], [0, 0, 0, -1, nan, 4, 1],
    [nan, 60, nan, 50, 2, nan, 1], [60.000001, 60, 50, 75, 2, inf, 1], [36.000000000000004, 60, 25, 50, 7, 10, 0], [18.000000000000004, 60, 33, 99, 1, 1, 1],
    [1, 3, 2, 3, 2, 3, 1], [2, 3, 1, 3, 1, 3, 1], [123, 456, 78, 90, 5, 9, 1], [1e-300, 1, 1e-300, 1, 1e-300, 1, 1],
  ];
  direct.barUpdates = rows.map((row) => {
    const [hp, maxHp, morale, moraleMax, ammoLeft, ammoMax, shown] = row as [number, number, number, number, number, number, number];
    const b = BS.makeUnitBars(0x3a6ad0, shown === 1);
    const ru: any = { bu: { hp, maxHp }, morale, moraleMax, ammoLeft, ammoMax, ammoBarShown: shown === 1, ...b };
    P._updateHpBar.call({}, ru); P._updateMoraleBar.call({}, ru); P._updateAmmoBar.call({}, ru);
    return { in: hx(row), tree: dumpTree(b.hpBarGroup, true) };
  });
}

// 3. dirYaw / sideColor
direct.dirYaw = [0, 1, 2, 3, 4, -1].map((d) => [d, hx([BS.dirYaw(d as any)])]);
direct.sideColor = [['atk', 'atk'], ['atk', 'def'], ['def', 'atk'], ['def', 'def']].map(([a, b]) => [a, b, BS.sideColor(a as any, b as any)]);

// 4. selection rings on fake runtime units
{
  const inst: any = Object.create(P);
  inst._selectionRings = new Map(); inst.ownedGeos = []; inst.ownedMats = [];
  const mk = (id: string, groupId: string | null) => ({ bu: { id }, group: new THREE.Group(), groupId, dead: false, removed: false });
  const u1 = mk('u1', null), u2 = mk('u2', 'g1'), u3 = mk('u3', null);
  u1.group.position.set(3, 0.2, 4); u1.group.rotation.y = 1.25; u2.group.position.set(-1, 0, 2); u2.group.scale.setScalar(1.3);
  inst._addSelectionRing(u1); inst._addSelectionRing(u2); inst._addSelectionRing(u1); inst._addSelectionRing(u3);
  const ringsAfterAdd = [u1, u2, u3].map((u) => dumpTree(u.group, true));
  u1.groupId = 'g7'; inst._refreshUnitRingColor(u1); u2.groupId = null; inst._refreshUnitRingColor(u2);
  (inst._selectionRings.get('u3') as THREE.Mesh).position.set(9, 9, 9);
  inst._removeSelectionRing(u3); inst._removeSelectionRing(u3);
  const ringsAfterRefresh = [u1, u2, u3].map((u) => dumpTree(u.group, true));
  // _refreshDeploySelectionVisuals: scale reset of the whole roster + ring position of selected units (UI calls stubbed).
  inst._deployGhostGroup = null;
  inst._selectedUnits = new Set(['u2']);
  inst._playerControlSide = () => 'atk';
  inst.atk = [u1, u2, { ...mk('u4', null), dead: true }]; inst.def = [];
  inst.atk[2].group.scale.setScalar(2);
  (inst._selectionRings.get('u2') as THREE.Mesh).position.set(0, 5, 0);
  (inst._selectionRings.get('u1') as THREE.Mesh).position.set(0, 6, 0);
  for (const k of ['_updateRosterBar', '_updateBattleRosterHeader', '_updateDeployDetailPanel', '_updateBattleQuickSelectBar', '_updateDeployToolbarSelection', '_syncDeployToolbarFromSelection', '_updateDeployGroupsBar', '_updateDeployStrategyBar', '_syncDeployRosterGroupVisibility', '_refreshDeployGroupHeaderLabels', '_syncRosterBottomInset']) inst[k] = () => {};
  inst._primarySelectedUnit = () => null;
  inst._refreshDeploySelectionVisuals();
  const afterVisuals = inst.atk.map((u: any) => dumpTree(u.group, true));
  direct.rings = { afterAdd: ringsAfterAdd, afterRefresh: ringsAfterRefresh, afterVisuals };
}

// 5. order arrows
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
{
  const arrows: [THREE.Vector3, THREE.Vector3, boolean, boolean][] = [
    [V(31, 0.12, 77), V(36, 0.12, 77), false, false], [V(31, 0.12, 77), V(36, 0.46, 80), true, false], [V(10, 0.2, 20), V(10.05, 0.3, 20.05), false, true],
    [V(10, 0.2, 20), V(10.06, 0.2, 20.06), true, true], [V(0, 0, 0), V(0, 0, 0), true, false], [V(5.5, 0.12, 9.25), V(-3.75, 0.12, 120.5), false, true],
    [V(40, 0.12, 50), V(39, 0.12, 50), true, true], [V(40, 0.12, 50), V(40, 0.12, 50.5), false, false], [V(-0.5, 1, 2), V(1.5, -1, -2), true, false],
    [V(12.3, 0.12, 45.6), V(12.3 + 0.0565, 0.12, 45.6 + 0.0566), false, false], [V(1, 0.12, 1), V(1.3, 0.12, 2.1), true, true], [V(67, 0.12, 155), V(0, 0.12, 0), false, false],
  ];
  direct.arrows = arrows.map(([a, b, atk, pre]) => ({ in: hx([a.x, a.y, a.z, b.x, b.y, b.z]), atk, pre, tree: dumpTree(P._makeOrderArrow.call({}, a, b, atk, pre), true) }));
}

// Terrain for the overlay cases: LCG mix of all kinds (= gen_field.ts `mix`, seed 7).
function lcg(seed: number): () => number { let a = seed >>> 0; return () => { a = (Math.imul(a, 1664525) + 1013904223) >>> 0; return a / 4294967296; }; }
const W = BS.BF_COLS, H = BS.BF_ROWS;
const mixTiles = (() => { const rnd = lcg(7); const t = new Uint8Array(W * H); for (let i = 0; i < W * H; i++) t[i] = Math.floor(rnd() * 8); return t; })();
function makeTm(tiles: Uint8Array): any {
  const at = (c: number, r: number): number => (c < 0 || c >= W || r < 0 || r >= H ? 0 : tiles[r * W + c]!);
  return { cols: W, rows: H, tiles, at, passable: (c: number, r: number) => { const t = at(c, r); return t !== 3 && t !== 6 && t !== 7; } };
}
direct.tilesHex = Buffer.from(mixTiles).toString('hex');

/** A fresh instance with the scene groups of the constructor (orderLines/orderPreview) and optionally the ghost layer. */
function overlayInst(ghostLayer: boolean): any {
  const inst: any = Object.create(P);
  inst.scene = new THREE.Scene();
  inst.terrainMap = makeTm(mixTiles);
  inst._orderLinesGroup = new THREE.Group(); inst._orderLinesGroup.name = 'orderLines'; inst.scene.add(inst._orderLinesGroup);
  inst._orderPreviewGroup = new THREE.Group(); inst._orderPreviewGroup.name = 'orderPreview'; inst._orderLinesGroup.add(inst._orderPreviewGroup);
  inst._queuedOrderArrows = [];
  inst._deployGhostGroup = null; inst._deployGhostOwnedGeos = []; inst._deployGhostOwnedMats = [];
  if (ghostLayer) inst._initDeployGhostLayer();
  inst.ownedGeos = []; inst.ownedMats = [];
  return inst;
}
function fakeUnit(id: string, side: 'atk' | 'def', q: number, r: number, extra: Record<string, unknown> = {}): any {
  const g = new THREE.Group();
  const { x, z } = BS.cellToWorld(q, r);
  g.position.set(x, BS.tileTopY(makeTm(mixTiles), q, r), z);
  return { bu: { id }, side, q, r, group: g, dead: false, removed: false, routed: false, groupId: null, formationOffset: null, playerOrder: { type: 'none' }, ...extra };
}
function sceneDump(inst: any): unknown { return dumpTree(inst.scene, true); }

// 6. _refreshQueuedOrderVisuals
{
  const cases: unknown[] = [];
  for (const [started, finished, player] of [[true, false, 'atk'], [true, false, 'def'], [false, false, 'atk'], [true, true, 'atk']] as const) {
    const inst = overlayInst(false);
    inst.started = started; inst.finished = finished; inst._playerControlSide = () => player;
    inst.atk = [
      fakeUnit('a0', 'atk', 30, 70, { playerOrder: { type: 'move', col: 40, row: 72 } }),
      fakeUnit('a1', 'atk', 31, 71, { playerOrder: { type: 'attack', targetId: 'd0' } }),
      fakeUnit('a2', 'atk', 32, 72, { playerOrder: { type: 'attack', targetId: 'd1' } }), // target dead
      fakeUnit('a3', 'atk', 33, 73, { playerOrder: { type: 'move', col: 33, row: 73 } }), // zero length
      fakeUnit('a4', 'atk', 34, 74, { playerOrder: { type: 'move', col: 20, row: 90 }, routed: true }),
      fakeUnit('a5', 'atk', 35, 75, { playerOrder: { type: 'hold' } }),
      fakeUnit('a6', 'atk', 12, 30, { playerOrder: { type: 'attack', targetId: 'd2' } }),
      fakeUnit('a7', 'atk', 13, 31, { playerOrder: { type: 'move', col: 13, row: 32 } }),
    ];
    inst.def = [
      fakeUnit('d0', 'def', 45, 80, { playerOrder: { type: 'move', col: 41, row: 80 } }), fakeUnit('d1', 'def', 46, 81, { dead: true }),
      fakeUnit('d2', 'def', 47, 60, { playerOrder: { type: 'attack', targetId: 'a0' } }), fakeUnit('d3', 'def', 48, 61, { playerOrder: { type: 'attack', targetId: 'a2' }, removed: true }),
    ];
    inst._queuedOrderUnitIds = new Set(['a1', 'a7', 'd2']);
    // a stale arrow from an earlier refresh must be removed
    const stale = P._makeOrderArrow.call({}, V(1, 0, 1), V(5, 0, 5), true, false); inst._orderLinesGroup.add(stale); inst._queuedOrderArrows.push(stale);
    inst._refreshQueuedOrderVisuals();
    cases.push({ started, finished, player, queued: inst._queuedOrderArrows.length, scene: sceneDump(inst) });
  }
  direct.queued = cases;
}

// 7. _updateOrderPreview (picking / selection / formation lookups injected; part 5 / P6.13)
{
  type PreviewCase = { id: string; deployPhase?: boolean; drag?: boolean; manual: boolean; sel: string[]; hover?: string | null; tile?: [number, number] | null; occ?: string | null; dest?: [string, number, number][]; ghost: boolean };
  const pcases: PreviewCase[] = [
    { id: 'hover-enemy', manual: true, sel: ['a0', 'a1', 'a4', 'zz'], hover: 'd0', tile: [45, 80], ghost: true },
    { id: 'hover-dead-enemy-tile-occ', manual: true, sel: ['a0', 'a2'], hover: 'd1', tile: [47, 60], occ: 'd2', ghost: true },
    { id: 'hover-own-tile-free', manual: true, sel: ['a0', 'a1', 'a2', 'a3'], hover: 'a3', tile: [40, 70], dest: [['a0', 41, 70], ['a1', 40, 71], ['a2', 40, 69]], ghost: true },
    { id: 'group-members', manual: true, sel: ['a5', 'a6', 'a0'], tile: [50, 100], dest: [['a5', 51, 100], ['a7', 50, 99]], ghost: true },
    { id: 'no-tile', manual: true, sel: ['a0'], tile: null, ghost: true },
    { id: 'not-manual', manual: false, sel: ['a0'], tile: [40, 70], ghost: true },
    { id: 'no-selection', manual: true, sel: [], tile: [40, 70], ghost: true },
    { id: 'move-no-ghost-layer', manual: true, sel: ['a0', 'a1'], tile: [3, 2], dest: [['a0', 3, 2]], ghost: false },
    { id: 'tile-own-occupant', manual: true, sel: ['a1'], tile: [30, 70], occ: 'a0', dest: [['a1', 30, 70]], ghost: true },
    { id: 'deploy-phase-hover', deployPhase: true, manual: true, sel: ['a0', 'a1'], tile: [20, 75], ghost: true },
    { id: 'deploy-phase-drag', deployPhase: true, drag: true, manual: true, sel: ['a0'], tile: [20, 75], ghost: true },
  ];
  const res: unknown[] = [];
  for (const c of pcases) {
    const inst = overlayInst(c.ghost);
    inst._playerControlSide = () => 'atk';
    const roster: Record<string, any> = {
      a0: fakeUnit('a0', 'atk', 30, 70), a1: fakeUnit('a1', 'atk', 31, 71), a2: fakeUnit('a2', 'atk', 32, 72, { dead: true }), a3: fakeUnit('a3', 'atk', 40, 70),
      a4: fakeUnit('a4', 'atk', 34, 74, { routed: true }), a5: fakeUnit('a5', 'atk', 35, 75, { groupId: 'g1' }), a6: fakeUnit('a6', 'atk', 36, 76, { groupId: 'g1' }),
      a7: fakeUnit('a7', 'atk', 37, 77, { groupId: 'g1', formationOffset: { dc: -1, dr: 2 } }), a8: fakeUnit('a8', 'atk', 38, 78, { groupId: 'g1', removed: true }),
      d0: fakeUnit('d0', 'def', 45, 80), d1: fakeUnit('d1', 'def', 46, 81, { dead: true }), d2: fakeUnit('d2', 'def', 47, 60),
    };
    inst.atk = ['a0', 'a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8'].map((k) => roster[k]); inst.def = ['d0', 'd1', 'd2'].map((k) => roster[k]);
    inst.deployPhase = c.deployPhase === true; inst._deployDrag = c.drag ? { anchorCol: 20, anchorRow: 75, curCol: 22, curRow: 78 } : null;
    inst._selectedUnits = new Set(c.sel);
    inst._isManualInputActive = () => c.manual;
    inst._pickUnitAtScreen = () => (c.hover ? roster[c.hover] : null);
    inst._pickGroundTile = () => (c.tile ? { col: c.tile[0], row: c.tile[1] } : null);
    inst.occByKey = new Map<string, any>();
    if (c.occ && c.tile) inst.occByKey.set(`${c.tile[0]},${c.tile[1]}`, roster[c.occ]);
    inst.occByKey.set('41,70', roster.a3); // a3 stands where a0 would go
    inst._moveDestinationsForSelection = () => new Map((c.dest ?? []).map(([id, col, row]) => [id, { col, row }]));
    inst._liveGroupMemberIds = (gid: string) => (gid === 'g1' ? ['a5', 'a6', 'a7', 'a8', 'zz'] : []);
    inst._passableForUnit = (_ru: any, col: number, row: number) => inst.terrainMap.passable(col, row);
    inst._inDeployPlayerZone = (col: number) => col < 33;
    inst._computeDeployPlacementLayout = (units: any[], col: number, row: number) => new Map(units.map((u: any, i: number) => [u.bu.id, { col: col + i, row: row - i }]));
    inst._computeDeployGhostLayout = (units: any[], ac: number, ar: number, dc: number, dr: number) => new Map(units.map((u: any, i: number) => [u.bu.id, { col: ac + i, row: ar + ((dr - ar) >> 1) + i * (dc - ac) }]));
    inst._isDeployCellOk = (col: number, row: number) => inst.terrainMap.passable(col, row) && col !== 21;
    inst._updateOrderPreview(0, 0);
    res.push({ id: c.id, scene: sceneDump(inst) });
  }
  direct.preview = res;
}

// 8. ghosts directly: battle-move ghosts, deploy drag ghosts, hover ghosts, placement-preview branches
{
  const res: unknown[] = [];
  type GCase = { id: string; fn: 'move' | 'drag' | 'at' | 'placement'; ghost: boolean; sel: string[]; deployPhase?: boolean; drag?: [number, number, number, number] | null; tile?: [number, number] | null; dest?: [string, number, number][]; layout?: [string, number, number][]; okNot?: [number, number][]; zone?: number; twice?: boolean };
  const gcases: GCase[] = [
    { id: 'move-ghosts', fn: 'move', ghost: true, sel: ['a0', 'a1', 'a2'], dest: [['a0', 41, 70], ['a1', 40, 71], ['zz', 12, 12], ['a2', 3, 3]], tile: [40, 70] },
    { id: 'move-ghosts-river', fn: 'move', ghost: true, sel: ['a0'], dest: [['a0', 0, 0], ['a1', 30, 70], ['a3', 40, 70]], tile: [0, 0] },
    { id: 'move-no-layer', fn: 'move', ghost: false, sel: ['a0'], dest: [['a0', 41, 70]], tile: [41, 70] },
    { id: 'move-empty-sel', fn: 'move', ghost: true, sel: [], dest: [['a0', 41, 70]], tile: [41, 70] },
    { id: 'drag', fn: 'drag', ghost: true, sel: ['a0', 'a1', 'a3', 'zz'], drag: [20, 75, 26, 70], layout: [['a0', 20, 75], ['a1', 21, 74], ['a3', 22, 76]], twice: true },
    { id: 'drag-partial-layout', fn: 'drag', ghost: false, sel: ['a0', 'a1'], drag: [5, 140, 5, 140], layout: [['a1', 6, 141]] },
    { id: 'drag-none', fn: 'drag', ghost: true, sel: ['a0'], drag: null, layout: [['a0', 1, 1]] },
    { id: 'drag-dead-only', fn: 'drag', ghost: true, sel: ['a2'], drag: [1, 1, 2, 2], layout: [['a2', 1, 1]] },
    { id: 'at', fn: 'at', ghost: true, deployPhase: true, sel: ['a0', 'a1', 'a3'], tile: [15, 60], layout: [['a0', 15, 60], ['a1', 16, 59], ['a3', 21, 58]] },
    { id: 'at-from-scratch', fn: 'at', ghost: false, deployPhase: true, sel: ['a1'], tile: [3, 150], layout: [['a1', 2, 155]] },
    { id: 'at-not-deploy', fn: 'at', ghost: true, deployPhase: false, sel: ['a0'], tile: [15, 60], layout: [['a0', 15, 60]] },
    { id: 'placement-zone', fn: 'placement', ghost: true, deployPhase: true, sel: ['a0', 'a1'], tile: [20, 70], zone: 33, layout: [['a0', 20, 70], ['a1', 19, 71]] },
    { id: 'placement-out-of-zone', fn: 'placement', ghost: true, deployPhase: true, sel: ['a0'], tile: [40, 70], zone: 33, layout: [['a0', 40, 70]] },
    { id: 'placement-no-tile', fn: 'placement', ghost: true, deployPhase: true, sel: ['a0'], tile: null, zone: 33 },
    { id: 'placement-drag', fn: 'placement', ghost: true, deployPhase: true, sel: ['a0', 'a1'], drag: [10, 30, 14, 36], layout: [['a0', 10, 30], ['a1', 12, 33]], zone: 33 },
    { id: 'placement-no-phase', fn: 'placement', ghost: true, deployPhase: false, sel: ['a0'], tile: [20, 70], zone: 33 },
  ];
  for (const c of gcases) {
    const inst = overlayInst(c.ghost);
    inst._playerControlSide = () => 'atk';
    const roster: Record<string, any> = { a0: fakeUnit('a0', 'atk', 30, 70), a1: fakeUnit('a1', 'atk', 31, 71), a2: fakeUnit('a2', 'atk', 32, 72, { dead: true }), a3: fakeUnit('a3', 'atk', 40, 70) };
    inst.atk = Object.values(roster); inst.def = [];
    inst.deployPhase = c.deployPhase === true;
    inst._deployDrag = c.drag ? { anchorCol: c.drag[0], anchorRow: c.drag[1], curCol: c.drag[2], curRow: c.drag[3] } : null;
    inst._selectedUnits = new Set(c.sel);
    inst.occByKey = new Map<string, any>([['30,70', roster.a0], ['31,71', roster.a1], ['40,70', roster.a3]]);
    inst._passableForUnit = (_ru: any, col: number, row: number) => inst.terrainMap.passable(col, row);
    inst._pickGroundTile = () => (c.tile ? { col: c.tile[0], row: c.tile[1] } : null);
    inst._inDeployPlayerZone = (col: number) => col < (c.zone ?? 999);
    const layout = new Map((c.layout ?? []).map(([id, col, row]) => [id, { col, row }]));
    inst._computeDeployPlacementLayout = () => layout;
    inst._computeDeployGhostLayout = () => layout;
    inst._isDeployCellOk = (col: number, row: number, skip: Set<string>) => {
      const o = inst.occByKey.get(`${col},${row}`);
      return inst.terrainMap.passable(col, row) && (!o || skip.has(o.bu.id));
    };
    inst._moveDestinationsForSelection = () => new Map((c.dest ?? []).map(([id, col, row]) => [id, { col, row }]));
    for (let k = 0; k < (c.twice ? 2 : 1); k++) {
      if (c.fn === 'move') inst._refreshBattleMoveGhosts(c.tile![0], c.tile![1]);
      else if (c.fn === 'drag') inst._refreshDeployGhosts();
      else if (c.fn === 'at') inst._refreshDeployGhostsAt(c.tile![0], c.tile![1]);
      else inst._updateDeployPlacementPreview(0, 0);
    }
    res.push({ id: c.id, scene: sceneDump(inst) });
  }
  direct.ghosts = res;
}

// 9. constants
const consts: Record<string, unknown> = {};
for (const k of ['HPBAR_W', 'HPBAR_H', 'HPBAR_Y', 'BAR_GAP_Y', 'MORALEBAR_Y', 'AMMOBAR_Y', 'AMMOBAR_COLOR', 'BAR_OUTLINE_PAD', 'BAR_OUTLINE_Z', 'ORDER_LINE_Y', 'ORDER_COLOR_MOVE', 'ORDER_COLOR_ATTACK', 'ORDER_MOVE_OPACITY', 'ORDER_ATTACK_OPACITY'] as const) consts[k] = hx([(BS as any)[k] as number]);
consts.DIR_DELTA = (BS as any).DIR_DELTA;
out.consts = consts;
out.direct = direct;

const dir = process.argv[2] ?? '.';
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'units.json'), JSON.stringify({ three: THREE.REVISION, node: process.version, ...out }));
const nUnits = (ctorOut as any[]).reduce((a, c) => a + c.units.rows.length, 0);
console.log(`battle3d units ctor=${ctorOut.length} units=${nUnits} bars=${(direct.bars as unknown[]).length} arrows=${(direct.arrows as unknown[]).length} preview=${(direct.preview as unknown[]).length} ghosts=${(direct.ghosts as unknown[]).length}`);
process.exit(0);
