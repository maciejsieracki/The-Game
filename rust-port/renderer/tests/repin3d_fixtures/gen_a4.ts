// Reference-vector generator for REPIN-3D batch A4 (R-RUSTPORT-REPIN-3D-A4-Q1): the battle
// scene constructor WITH a fortification (`fortKind` from `opts.siege.builtBuildingIds`), the
// Militia (Milicja) and siege towers (Wieża oblężnicza) as spawn DTOs.
//
// Runs the REAL web code of `origin/main` (`git archive <sha> gra/src gra/data`, three@0.169.0,
// esbuild@0.24.0, node v22.22.0), bundled UNCHANGED by `tests/fixtures/battle3d/build_units.mjs`
// (`node build_units.mjs gen_a4`; part-3 bundler, appended `export { ... }` line only).
// Hashing, node records, `modelRecord`, `unitDto`, `unitsRecord`, `wallRecord`, `sceneSummary`,
// `terrainDto` and the spawn instrumentation are copied VERBATIM from
// `tests/fixtures/battle3d/gen_units.ts` (part 3), so `tests/battle3d_units.rs` reads the records
// with the same code. New here: the `fort` record (fortKind, `towerMaterialFor`, rows and the
// tower clones `_placeSiegeTowers` added to the scene root) and the Militia rosters, built by the
// web's own `buildMilitiaSquad` (`game/siegeDefenders.ts`) and turned into a `BattleUnit` as
// `main.ts` `runtimeToBattleUnit` does (`kategoria = u.category = 'domyslny'`, `nazwa = typeId`,
// `stats = def`).
//
// Usage: node gen_a4.mjs <out-dir>

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


// ------------------------------------------------------------- A4: fortification + Militia
import { buildMilitiaSquad } from '../websrc/gra/src/game/siegeDefenders';
import { towerMaterialFor } from '../websrc/gra/src/game/city-towers';
import { cityFortificationKind } from '../websrc/gra/src/game/city-fortification';

/** `runtimeToBattleUnit` (main.ts) of a virtual militiaman of `collectCityDefRoster`. */
function militiaArmy(cityId: string, population: number, era: number, ownerColor: number): BS.BattleUnit[] {
  return buildMilitiaSquad(population, era, UNITS).map((m, i) => {
    const maxHp = Math.max(1, Math.round(Number(m.def['Health']) || 10));
    return {
      id: 'militia-' + cityId + '-' + i, isArmyCommander: false, nazwa: m.typeId, kategoria: 'domyslny',
      ownerColor, stats: { ...m.def }, hp: maxHp, maxHp,
    } as unknown as BS.BattleUnit;
  });
}
/** Siege towers: the `Wieża oblężnicza` row with every model category key (routing by name). */
function towerArmy(): BS.BattleUnit[] {
  const row = UNITS.find((r) => r['Jednostka'] === 'Wieża oblężnicza');
  if (!row) throw new Error('no Wieża oblężnicza row');
  return CATS.slice(0, 6).map((cat, i) => ({
    id: `tw${i}`, nazwa: String(row['Nazwa EN']), kategoria: cat, ownerColor: OWNERS[i % OWNERS.length]!, stats: row,
    hp: 3600 - i * 500, maxHp: 3600,
  } as unknown as BS.BattleUnit));
}

type A4Case = {
  id: string; preset?: PresetName; teren?: string; siege?: { civ?: string; defCiv?: string; builtBuildingIds?: string[] };
  deploy?: 'atk' | 'def'; post?: string[];
  militia?: { pop: number; era: number; keepDef: boolean }; towers?: boolean;
};
const a4Cases: A4Case[] = [
  // fortKind sweep (cityFortificationKind: 'mury' | 'fort' > 'palisada' > 'none')
  { id: 'fort-none-rzym', preset: 'oblezenie', siege: { civ: 'rzym', builtBuildingIds: [] } },
  { id: 'fort-palisada-rzym', preset: 'oblezenie', siege: { civ: 'rzym', builtBuildingIds: ['palisada'] }, post: ['climb'] },
  { id: 'fort-mury-rzym', preset: 'oblezenie', siege: { civ: 'rzym', builtBuildingIds: ['mury'] } },
  { id: 'fort-fort-rzym', preset: 'oblezenie', siege: { civ: 'rzym', builtBuildingIds: ['fort'] } },
  { id: 'fort-both-rzym', preset: 'oblezenie', siege: { civ: 'rzym', builtBuildingIds: ['palisada', 'mury'] } },
  { id: 'fort-other-rzym', preset: 'oblezenie', siege: { civ: 'rzym', builtBuildingIds: ['koszary', 'Palisada'] } },
  { id: 'fort-palisada-egipt', preset: 'oblezenie_duze', siege: { civ: 'rzym', defCiv: 'egipt', builtBuildingIds: ['palisada'] } },
  { id: 'fort-mury-zulu', preset: 'oblezenie', siege: { civ: 'zulu', builtBuildingIds: ['mury'] } },
  { id: 'fort-palisada-deploy-def', preset: 'oblezenie', siege: { civ: 'chiny', builtBuildingIds: ['palisada'] }, deploy: 'def', post: ['resetDef'] },
  { id: 'fort-mury-deploy-atk', preset: 'oblezenie', siege: { civ: 'grecja', builtBuildingIds: ['mury'] }, deploy: 'atk', post: ['resetAtk'] },
  // Militia (Milicja) as defenders: eras 1/2/3, odd headcount, alone or with the real garrison
  { id: 'militia-field-kamien', preset: 'maly', militia: { pop: 5, era: 1, keepDef: false } },
  { id: 'militia-field-braz', preset: 'maly', militia: { pop: 4, era: 2, keepDef: true } },
  { id: 'militia-field-zelazo', preset: 'rzym_grecja', militia: { pop: 7, era: 3, keepDef: true } },
  { id: 'militia-siege-palisada', preset: 'oblezenie', siege: { civ: 'rzym', builtBuildingIds: ['palisada'] }, militia: { pop: 6, era: 2, keepDef: true } },
  { id: 'militia-siege-mury-only', preset: 'oblezenie', siege: { civ: 'egipt', builtBuildingIds: ['mury'] }, militia: { pop: 3, era: 1, keepDef: false } },
  { id: 'militia-pop0', preset: 'maly', militia: { pop: 0, era: 1, keepDef: true } },
  // Siege towers (Wieża oblężnicza) under every fortification
  { id: 'towers-field', preset: 'maly', towers: true },
  { id: 'towers-siege-palisada', preset: 'oblezenie', siege: { civ: 'rzym', builtBuildingIds: ['palisada'] }, towers: true },
  { id: 'towers-siege-mury', preset: 'oblezenie', siege: { civ: 'germanie', builtBuildingIds: ['mury'] }, towers: true },
];

function fortRecord(s: any): unknown {
  s.scene.updateMatrixWorld(true);
  return {
    kind: s.fortKind, material: towerMaterialFor(s.fortKind),
    towers: (s.siegeTowers as { row: number; mesh: THREE.Group | null; destroyed: boolean }[]).map((t) => ({
      row: t.row, index: t.mesh ? s.scene.children.indexOf(t.mesh) : -1, m: t.mesh ? modelRecord(t.mesh) : null,
      p: t.mesh ? hx([t.mesh.position.x, t.mesh.position.y, t.mesh.position.z]) : null,
    })),
  };
}

const out: Record<string, unknown> = {};
const ctorOut: unknown[] = [];
let nMilitia = 0, nTowers = 0, nSiegeTowerUnits = 0;
for (const c of a4Cases) {
  const a = buildTestArmies(UNITS, c.preset!);
  let atk = a.attacker, def = a.defender;
  const teren = c.teren ?? a.teren;
  if (c.militia) {
    const mil = militiaArmy('c1', c.militia.pop, c.militia.era, def[0]?.ownerColor ?? 0x4060c8);
    nMilitia += mil.length;
    def = c.militia.keepDef ? [...def, ...mil] : mil;
  }
  if (c.towers) atk = [...atk, ...towerArmy()];
  spawnSnap = null; moveLog = [];
  const s: any = new BS.BattleScene({ attacker: atk, defender: def, teren, siege: c.siege as any, deploy: c.deploy != null, deployPlayerSide: c.deploy } as any);
  const ctorSpawn = spawnSnap, ctorMoves = moveLog;
  moveLog = null;
  if (s.fortKind !== cityFortificationKind(c.siege?.builtBuildingIds)) throw new Error(`fortKind ${c.id}`);
  const dto = terrainDto(teren);
  {
    const chk: any = Object.create(BS.BattleScene.prototype);
    chk.terrainMap = { cols: BS.BF_COLS, rows: BS.BF_ROWS, tiles: new Uint8Array(dto.tiles) };
    chk.wallTileHp = new Map();
    if (c.siege) chk._carveWallTiles();
    if (Buffer.compare(Buffer.from(chk.terrainMap.tiles), Buffer.from(s.terrainMap.tiles)) !== 0) throw new Error(`DTO mismatch ${c.id}`);
    if (dto.desert !== s._desertPalette) throw new Error(`desert mismatch ${c.id}`);
  }
  nTowers += (s.siegeTowers as unknown[]).length;
  nSiegeTowerUnits += [...s.atk, ...s.def].filter((ru: any) => String(ru.bu.stats?.['Jednostka']) === 'Wieża oblężnicza').length;
  const rec: Record<string, unknown> = {
    id: c.id, teren, siege: c.siege ?? null, deploy: c.deploy ?? null, player: s._playerControlSide(),
    tilesRle: rle(dto.tiles), desert: dto.desert, spawn: ctorSpawn, moves: ctorMoves,
    wall: wallRecord(s), fort: fortRecord(s), units: unitsRecord(s, true), scene: sceneSummary(s),
    deployGhostIndex: s._deployGhostGroup ? s.scene.children.indexOf(s._deployGhostGroup) : -1,
  };
  const posts: unknown[] = [];
  for (const p of c.post ?? []) {
    if (p === 'resetAtk' || p === 'resetDef') {
      spawnSnap = null; moveLog = [];
      s._resetDeploySide(p === 'resetAtk' ? 'atk' : 'def');
      const moves = moveLog; moveLog = null;
      posts.push({ op: p, spawn: spawnSnap, moves, units: unitsRecord(s, false), scene: sceneSummary(s) });
    } else if (p === 'climb') {
      // as gen_units.ts: `_activateUnit` reaches the climb branch with the logic hooks before it neutralised
      const ru = s.atk.find((u: any) => !u.mounted && u.bu.stats?.['Typ'] !== 'Siege');
      const row = ru.r;
      s.occByKey.delete(`${ru.q},${ru.r}`);
      ru.q = s.siegeWallCol - 2;
      s.towerAtWallRows.add(row);
      ru.surroundApplied = true;
      s._applyTerrainRange = () => {}; s._updateFacing = () => {}; s._manualMode = false; s._isUnitDoctrineAuto = () => false;
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

const dir = process.argv[2] ?? '.';
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'a4.json'), JSON.stringify({ three: THREE.REVISION, node: process.version, ...out }));
const nUnits = (ctorOut as any[]).reduce((acc, c) => acc + c.units.rows.length, 0);
console.log(`repin3d a4 ctor=${ctorOut.length} units=${nUnits} militia=${nMilitia} siegeTowerUnits=${nSiegeTowerUnits} wallTowers=${nTowers}`);
process.exit(0);
