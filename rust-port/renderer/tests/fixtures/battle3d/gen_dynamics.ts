// Reference-vector generator for MOD-14 "battle 3D", part 4: dynamics and effects
// (R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q4).
//
// Runs the REAL web code of `edb8fb56` (`git archive edb8fb56 gra/src gra/data`,
// three@0.169.0, esbuild@0.24.0, node v22.22.0), bundled by `build_dynamics.mjs` (the
// part-3 bundler with a longer appended `export { ... }` line; `battleScene.ts` text is
// otherwise unchanged).
//
// A siege battle (`new BattleScene` with the `oblezenie` preset, civ `rzym`) and a deploy
// battle (`rzym_grecja`, deploy `atk`) are built exactly as in part 3; then the per-frame
// animations of the scene are driven with a RECORDING `requestAnimationFrame` (callbacks
// are queued and run by `frame(t)` after setting the virtual clock `vNow = t`) and the
// per-frame tickers are called directly with chosen times:
//   `_doMove`, `_doMeleeAttack`, `_doRangedAttack` + `_tickProjectiles` (`makeProjectileMesh`),
//   `_startFade` + `_tickFades`, `_attackGate` (`_animateRam`), `_attackWallTile`
//   (`_spawnCatapultBoulder`, scheduled `_breachWallTile`), `_breachWallTile`, `_breachGate`,
//   `_startRout`, `_fleeStep`, group markers (`_updateGroupFrameMarker`,
//   `_removeGroupFrameMarker`, `_syncAllGroupFrameMarkers`, `_makeGroupNumberTexture`),
//   the bar billboard of the frame loop (`hpBarGroup.lookAt(camera.position)`), float labels
//   (`_spawnDamageLabel`, `_spawnWallLabel`, `_tickFloatLabels` up to the screen projection),
//   and the 3D part of `_endDeployPhase` / of the deploy-phase frame.
// Battle LOGIC called by these methods is stubbed or only observed (P4-36 Z-36-13): blows
// (`_singleBlow`), counters, scheduling (`_schedule` records), SFX, siege HUD, morale ripples
// (`_boostEnemiesOnBreak`, `_checkMeleeScreenLost`, `_shakeAlliesOnLoss`); the DOM is the
// part-2 stub. What the logic decided (new facing, rout, retreat cell, morale) is dumped as
// the DTO the Rust port takes.
//
// Usage: node gen_dynamics.mjs <out-dir>   (bundle produced by `node build_dynamics.mjs`)

import './dom_stub';
import * as THREE from 'three';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as BS from '../websrc/gra/src/battle/battleScene';
import { buildTestArmies } from '../websrc/gra/src/battle/testBattle';
import { generateBattleTerrain, presetForWorldTerrain } from '../websrc/gra/src/battle/battle-terrain';
import unitsJson from '../websrc/gra/data/units.json';

// ------------------------------------------------------------- recording rAF
const raf: ((t: number) => void)[] = [];
(globalThis as any).requestAnimationFrame = (cb: (t: number) => void) => { raf.push(cb); return raf.length; };

// ------------------------------------------------------------- hashing (= gen_units.ts)
const _f32 = new Float32Array(1);
const _f32b = new Uint8Array(_f32.buffer);
const _f64 = new Float64Array(1);
const _f64b = new Uint8Array(_f64.buffer);
class Fnv {
  h = 0x811c9dc5 >>> 0;
  byte(b: number): void { this.h ^= b & 0xff; this.h = Math.imul(this.h, 0x01000193) >>> 0; }
  u32(v: number): void { v = v >>> 0; this.byte(v); this.byte(v >>> 8); this.byte(v >>> 16); this.byte(v >>> 24); }
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
const v3 = (v: THREE.Vector3): number[] => [v.x, v.y, v.z];

// ------------------------------------------------------------- node records (gen_units.ts + Sprite, Sphere/Icosahedron)
const KIND: Record<string, number> = { Scene: 0, Group: 1, Object3D: 2, Mesh: 3, InstancedMesh: 4, Line: 5, AmbientLight: 6, HemisphereLight: 7, DirectionalLight: 8, Sprite: 9 };
function kindOf(o: THREE.Object3D): string {
  if ((o as THREE.Scene).isScene) return 'Scene';
  if ((o as THREE.InstancedMesh).isInstancedMesh) return 'InstancedMesh';
  if ((o as THREE.Mesh).isMesh) return 'Mesh';
  if ((o as THREE.Line).isLine) return 'Line';
  if ((o as THREE.Sprite).isSprite) return 'Sprite';
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
/** Binary material stream (= `gen_units.ts::matSig`). */
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
/** Byte stream of one node: `gen_units.ts::nodeRecord`; a Sprite adds its material identity + signature. */
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
  const rec: Record<string, unknown> = { k, name: o.name, parent, p: hx(p), r: hx(r), q: hx(q), s: hx(s), vis: o.visible };
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
    rec.matSig = ms;
    rec.geo = { t: m.geometry.type, vtx: m.geometry.getAttribute('position').count, tri: triCount(m.geometry), hash: gh, par: hx(par) };
  } else if (k === 'Sprite') {
    const mat = (o as THREE.Sprite).material;
    f.u32(matId(ctx, mat));
    const ms = matSig(mat);
    f.u32(ms);
    rec.matSig = ms;
  }
  return rec;
}
/** Full dump of a subtree (`root` included); parents are indices inside the subtree. */
function dumpTree(root: THREE.Object3D, full: boolean): Record<string, unknown> {
  root.updateWorldMatrix(true, true); // ancestors too: no stale parent matrixWorld
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
/** `gen_units.ts::modelRecord` WITHOUT skipping group markers: [n, meshes, tris, sig, all]. */
function modelRecord(root: THREE.Object3D): number[] {
  root.updateWorldMatrix(true, true); // ancestors too: no stale parent matrixWorld
  const f = new Fnv();
  const all = new Fnv();
  let meshes = 0, tris = 0, n = 0;
  root.traverse((o) => {
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
  return [n, meshes, tris, f.h >>> 0, all.h >>> 0];
}
/** Root children count, node count and FNV over (kind, subtree size, visible) of every root child (no skipping). */
function sceneSummary(s: any): number[] {
  let n = 0;
  s.scene.traverse(() => { n++; });
  const f = new Fnv();
  for (const ch of s.scene.children as THREE.Object3D[]) {
    let k = 0;
    ch.traverse(() => { k++; });
    f.u32(KIND[kindOf(ch)]!); f.u32(k); f.bool(ch.visible);
  }
  return [s.scene.children.length, n, f.h >>> 0];
}

// ------------------------------------------------------------- runtime units -> DTO (= gen_units.ts)
function num(v: number): number | string { return Number.isFinite(v) && !Object.is(v, -0) ? v : hx([v]); }
function unitDto(s: any, ru: any): unknown[] {
  return [
    ru.bu.id, ru.side, ru.q, ru.r, ru.facing, ru.onWallWalkway ? 1 : 0, ru.bu.kategoria, String(ru.bu.stats?.['Jednostka'] ?? ru.bu.nazwa), ru.bu.ownerColor,
    [ru.bu.hp, ru.bu.maxHp, ru.morale, ru.moraleMax, ru.ammoLeft, ru.ammoMax].map(num), ru.ammoBarShown ? 1 : 0,
    s.scene.children.indexOf(ru.group), s.scene.children.indexOf(ru.hpBarGroup),
  ];
}
function rle(t: Uint8Array): number[] {
  const out: number[] = [];
  for (let i = 0; i < t.length;) { let j = i; while (j < t.length && t[j] === t[i]) j++; out.push(t[i]!, j - i); i = j; }
  return out;
}
function terrainDto(teren: string): Uint8Array {
  const preset = presetForWorldTerrain(undefined);
  const tm = generateBattleTerrain({ cols: BS.BF_COLS, rows: BS.BF_ROWS, seed: 'bf:' + teren, deployMargin: 4, rowMargin: BS.PLAY_ROW0, preset, safeCols: BS.battleSafeCols(false) });
  const inst: any = Object.create(BS.BattleScene.prototype);
  inst.terrainMap = tm;
  inst._carveBattleBox(false);
  inst._fencePlayableZone();
  return new Uint8Array(tm.tiles);
}

// ------------------------------------------------------------- instrumentation
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
// Logic observed (rout decisions) and silenced (audio, HUD, morale ripples to other units).
let routLog: string[] = [];
{
  const orig = PROTO._startRout;
  PROTO._startRout = function (this: any, ru: any) {
    const was = ru.routed || ru.dead || ru.fadingOut;
    orig.call(this, ru);
    if (!was) routLog.push(ru.bu.id);
  };
}
for (const k of ['_sfxRout', '_sfxDeath', '_sfxShot', '_sfxMelee', '_sfxRamImpact', '_sfxCatapultImpact', '_updateSiegeHud', '_boostEnemiesOnBreak', '_checkMeleeScreenLost', '_shakeAlliesOnLoss', '_syncSiegeHudLayout']) PROTO[k] = function () {};
let sched: [number, () => void][] = [];
PROTO._schedule = function (ms: number, cb: () => void) { sched.push([ms, cb]); };
// _doMove calls (any caller): [id, col, row, vNow, facing after the call].
let doMoveLog: unknown[] = [];
{
  const orig = PROTO._doMove;
  PROTO._doMove = function (this: any, ru: any, col: number, row: number, done: () => void) {
    const t0 = this.vNow;
    orig.call(this, ru, col, row, done);
    doMoveLog.push([ru.bu.id, col, row, t0, ru.facing]);
  };
}

/** One frame of the virtual clock: vNow = t, then every queued rAF callback once. */
function frame(s: any, t: number): void { s.vNow = t; const q = raf.splice(0); for (const cb of q) cb(t); }
const posOf = (ru: any): string => hx([...v3(ru.group.position), ...v3(ru.hpBarGroup.position)]);
const unitState = (ru: any): unknown[] => { const b = dumpTree(ru.hpBarGroup, false) as any; return [ru.bu.id, modelRecord(ru.group), [b.n, b.sig]]; };
const find = (s: any, id: string): any => [...s.atk, ...s.def].find((u: any) => u.bu.id === id);

// ------------------------------------------------------------- battle 1: siege
const UNITS = unitsJson as any[];
const out: Record<string, unknown> = {};
const ev: unknown[] = [];
function build(preset: string, siege: unknown, deploy: 'atk' | 'def' | undefined): { s: any; rec: Record<string, unknown> } {
  const a = buildTestArmies(UNITS, preset as any);
  spawnSnap = null; moveLog = [];
  const s: any = new BS.BattleScene({ attacker: a.attacker, defender: a.defender, teren: a.teren, siege: siege as any, deploy: deploy != null, deployPlayerSide: deploy } as any);
  const rec = { preset, teren: a.teren, siege, deploy: deploy ?? null, player: s._playerControlSide(), desert: s._desertPalette, tilesRle: rle(terrainDto(a.teren)), spawn: spawnSnap, moves: moveLog };
  moveLog = null;
  raf.length = 0; sched = []; doMoveLog = []; routLog = [];
  return { s, rec };
}

const { s, rec: siegeRec } = build('oblezenie', { civ: 'rzym' }, undefined);
out.siege = siegeRec;
s.finished = false; s._autoBattleSuspended = false;
// Terrain relief for the animations: hills, rivers and fords around the units used below
// (the scene's tile meshes are not rebuilt by the web either; only tileTopY reads change).
const W = BS.BF_COLS;
const setTile = (c: number, r: number, k: number): void => { s.terrainMap.tiles[r * W + c] = k; };
const atkUnits = s.atk.filter((u: any) => !s._isRam(u.bu) && !s._isCatapult(u.bu) && !u.bu.nazwa.includes('Wie'));
const archers = s.def.filter((u: any) => u.onWallWalkway);
const ram = s.atk.find((u: any) => s._isRam(u.bu));
const cats = s.atk.filter((u: any) => s._isCatapult(u.bu));
const a0 = atkUnits[0], a1 = atkUnits[1], a2 = atkUnits[2], a3 = atkUnits[3];
setTile(a0.q + 1, a0.r, 2); setTile(a0.q + 2, a0.r, 3); setTile(a0.q + 2, a0.r + 1, 4); setTile(a1.q, a1.r + 1, 2);
out.tilesNow = rle(new Uint8Array(s.terrainMap.tiles));
out.ids = { atk: atkUnits.slice(0, 6).map((u: any) => u.bu.id), archers: archers.slice(0, 4).map((u: any) => u.bu.id), ram: ram?.bu.id ?? null, cats: cats.map((u: any) => u.bu.id) };

// 1. moves (incl. onto a hill, into a river, a ford, back; fractional sample times)
{
  const plan: [any, number, number, number[]][] = [
    [a0, a0.q + 1, a0.r, [0, 1, 60.5, 119.99999999999999, 120, 239.75, 240, 300]],
    [a0, a0.q + 2, a0.r, [17, 100, 1000]],
    [a0, a0.q + 2, a0.r + 1, [3.25, 240]],
    [a0, a0.q + 1, a0.r + 1, [0.1, 200, 241]],
    [a1, a1.q, a1.r + 1, [10, 239, 240]],
    [a1, a1.q - 1, a1.r + 1, [12.5, 77, 1e6]],
  ];
  let t0 = 1000;
  for (const [ru, col, row, ts] of plan) {
    doMoveLog = [];
    s.vNow = t0;
    let doneCalls = 0;
    s._doMove(ru, col, row, () => { doneCalls++; });
    const samples = ts.map((dt) => { frame(s, t0 + dt); return [t0 + dt, posOf(ru), raf.length === 0 ? 1 : 0]; });
    raf.length = 0;
    ev.push({ op: 'move', id: ru.bu.id, col, row, t0, facing: ru.facing, samples, done: doneCalls, end: unitState(ru) });
    t0 += 777.125;
  }
}

// 2. melee lunges (plain; with counter; attacker killed by the counter)
{
  const cases: [any, any, boolean, boolean, number[]][] = [
    [a2, a3, false, false, [0, 50, 129.99, 130, 149.9, 150, 200.5, 259.999, 260, 400]],
    [a3, a2, true, false, [1, 151, 261]],
    [a2, a0, true, true, [10, 140, 150, 170, 300]],
  ];
  let t0 = 20000;
  for (const [att, def, counter, killAtt, ts] of cases) {
    sched = [];
    const blows: string[] = [];
    s._singleBlow = (x: any, y: any) => { blows.push(x.bu.id + '>' + y.bu.id); if (killAtt && x === def) { att.fadingOut = true; } return x === att ? 7 : 3; };
    s._defenderCounters = () => counter;
    const labels0 = s.floatLabels.length;
    s.vNow = t0;
    s._doMeleeAttack(att, def, () => {});
    const samples = ts.map((dt) => { frame(s, t0 + dt); return [t0 + dt, posOf(att), blows.length, raf.length === 0 ? 1 : 0]; });
    raf.length = 0;
    ev.push({ op: 'melee', att: att.bu.id, def: def.bu.id, t0, attFacing: att.facing, defFacing: def.facing, counter, killAtt, samples, sched: sched.map((x) => x[0]), labels: s.floatLabels.length - labels0, end: [unitState(att), unitState(def)] });
    att.fadingOut = false;
    delete s._singleBlow; delete s._defenderCounters;
    t0 += 1000;
  }
}

// 3. ranged shots: real archers on the wall shooting attackers + three more kinds through
//    a copy of the shooter with another category (projectileKind reads the category only).
{
  const shooters: [any, string | null][] = [[archers[0], null], [archers[1], 'procarz'], [archers[2], 'oszczepnik'], [archers[3], 'legionista']];
  const flights: any[] = [];
  let t0 = 30000;
  const shots: unknown[] = [];
  for (const [ru, cat] of shooters) {
    const att = cat ? Object.assign(Object.create(Object.getPrototypeOf(ru)), ru, { bu: { ...ru.bu, kategoria: cat } }) : ru;
    const target = atkUnits[shots.length + 2];
    sched = [];
    const n0 = s.projectiles.length;
    s.vNow = t0;
    s._doRangedAttack(att, target, () => {});
    const p = s.projectiles[n0];
    flights.push(p);
    if (cat) ru.facing = att.facing;
    shots.push({ id: ru.bu.id, cat, target: target.bu.id, t0, kind: BS.projectileKind(att.bu), facing: att.facing, ammo: num(att.ammoLeft), sched: sched.map((x) => x[0]),
      index: s.scene.children.indexOf(p.mesh), tree: dumpTree(p.mesh, shots.length === 0), bars: unitState(ru) });
    if (cat) { ru.ammoLeft = att.ammoLeft; }
    t0 += 95.5;
  }
  const ticks = [30000, 30100, 30190, 30285.75, 30380, 30380.5, 30475.5, 30571, 30666.5, 31000].map((t) => {
    s._tickProjectiles(t);
    return [t, flights.map((p) => (s.projectiles.includes(p) ? hx(v3(p.mesh.position)) : (p.mesh.parent ? 'attached' : null))), s.projectiles.length, sceneSummary(s)];
  });
  ev.push({ op: 'shots', shots, ticks });
}

// 4. projectileKind over categories / names; makeProjectileMesh for every kind
{
  const names = ['', 'Łucznik', 'Procarz', 'Oszczepnik', 'Legionista', 'Kusznik', 'Rydwan', 'Hastati', 'Slinger', 'Javelin thrower', 'Atlatl', 'Estolica', 'Archer', 'Chariot archer', 'LEGIONISTA', 'Proca', 'Kusza'];
  const cats2 = ['', 'lucznik', 'procarz', 'oszczepnik', 'legionista', 'rydwan', 'miecznik', 'Łucznik', 'konnica'];
  const kinds: unknown[] = [];
  for (const c of cats2) for (const n of names) {
    kinds.push([c, n, BS.projectileKind({ kategoria: c, nazwa: n, stats: {} } as any)]);
    kinds.push([c, n, BS.projectileKind({ kategoria: c, nazwa: 'x', stats: { Jednostka: n } } as any), 1]);
  }
  out.projectileKinds = kinds;
  out.projectileMeshes = (['arrow', 'javelin', 'pilum', 'sling'] as const).map((k) => ({ kind: k, tree: dumpTree(BS.makeProjectileMesh(k).group, true) }));
}

// 5. fades (two units with staggered starts)
{
  const victims = [atkUnits[4], atkUnits[5]];
  const t0s = [40000, 40123.5];
  s.vNow = t0s[0]; s._startFade(victims[0]);
  s.vNow = t0s[1]; s._startFade(victims[1]);
  const samples = [40000, 40001, 40250, 40499.99, 40500, 40623.4, 40623.5, 41000].map((t) => { s._tickFades(t); return [t, victims.map((u: any) => [unitState(u), u.dead ? 1 : 0, u.fadingOut ? 1 : 0, u.group.visible, u.hpBarGroup.visible]), s.fadingUnits.length]; });
  ev.push({ op: 'fade', ids: victims.map((u: any) => u.bu.id), t0s, samples });
}

// 6. ram (gate attack animation), once to the end and once interrupted by `finished`
if (ram) {
  s.gateHp = 1e9;
  for (const [t0, ts, finishAt] of [[50000, [0, 80, 159.9, 160, 160.1, 300, 319.99, 320, 500], -1], [51000, [40, 100, 200], 2]] as [number, number[], number][]) {
    const start = hx(v3(ram.group.position));
    s.vNow = t0; sched = [];
    s._attackGate(ram, () => {});
    const samples = ts.map((dt, i) => { if (i === finishAt) s.finished = true; frame(s, t0 + dt); return [t0 + dt, s.finished ? 1 : 0, hx(v3(ram.group.position)), raf.length === 0 ? 1 : 0]; });
    raf.length = 0; s.finished = false;
    ev.push({ op: 'ram', id: ram.bu.id, t0, start, gate: [s.siegeGateCol, s.siegeGateRow], samples, end: unitState(ram) });
  }
}

const snapUnits = (): Map<string, unknown[]> => new Map([...s.atk, ...s.def].map((u: any) => [u.bu.id, [u.q, u.r, u.onWallWalkway, u.dead, u.morale]]));
const changedSince = (before: Map<string, unknown[]>): unknown[] => [...s.atk, ...s.def].filter((u: any) => { const b = before.get(u.bu.id)!; return b[0] !== u.q || b[1] !== u.r || b[2] !== u.onWallWalkway || b[3] !== u.dead || b[4] !== u.morale; })
  .map((u: any) => [u.bu.id, u.q, u.r, u.onWallWalkway ? 1 : 0, u.dead ? 1 : 0, u.fadingOut ? 1 : 0, num(u.morale), unitState(u)]);

// 7. catapult boulder: flight, then the scheduled hit breaches the tile (HP set to 1)
{
  const cat = cats[0];
  const wallRow = s.siegeWallRowLo + 5;
  s.wallTileHp.set(wallRow, 1);
  s.vNow = 60000; sched = []; routLog = [];
  const kids0 = s.scene.children.length;
  s._attackWallTile(cat, wallRow, () => {});
  const boulder = s.scene.children[kids0];
  const tree = dumpTree(boulder, true);
  const samples = [0, 1, 175, 349.5, 350, 525.25, 699.9, 700, 800].map((dt) => { frame(s, 60000 + dt); return [60000 + dt, boulder.parent ? hx(v3(boulder.position)) : null, s.scene.children.length]; });
  raf.length = 0;
  const schedMs = sched.map((x) => x[0]);
  const kids1 = s.scene.children.length;
  s.vLastWall = 61000.25;
  const before = snapUnits();
  for (const [, cb] of sched.splice(0)) cb();
  ev.push({ op: 'boulder', id: cat.bu.id, row: wallRow, t0: 60000, tree, samples, sched: schedMs, changed: changedSince(before), rubble: s.scene.children.slice(kids1).map((o: THREE.Object3D, i: number) => dumpTree(o, i === 0)), routs: routLog, wall: modelRecord(s.siegeWallGroup), summary: sceneSummary(s), tiles: rle(new Uint8Array(s.terrainMap.tiles)) });
}

// 8. wall-tile breaches: under a defender (retreat), under a catapult defender (dies, no fade),
//    a row with no wall mesh, and the same row again.
{
  const onWall = s.def.filter((u: any) => u.onWallWalkway && !u.dead && !u.routed);
  const r1 = onWall[4].r;
  const catDef = onWall.find((u: any) => s._isCatapult(u.bu));
  const rows: number[] = [r1];
  if (catDef) rows.push(catDef.r);
  rows.push(s.siegeWallRowHi + 3, r1);
  // second defender cornered: occupy its retreat column so it searches further
  for (const row of rows) {
    routLog = [];
    const before = snapUnits();
    const kids1 = s.scene.children.length;
    s.vLastWall = 62000 + row;
    s._breachWallTile(row);
    const changed = changedSince(before);
    ev.push({ op: 'breachWall', row, changed, routs: routLog.map((id) => [id, find(s, id).facing, unitState(find(s, id))]), rubble: s.scene.children.slice(kids1).map((o: THREE.Object3D, i: number) => dumpTree(o, i === 0)), wall: modelRecord(s.siegeWallGroup), summary: sceneSummary(s), tiles: rle(new Uint8Array(s.terrainMap.tiles)) });
  }
}

// 9. gate breach (morale -5 for every live defender, bars updated, rout checks)
{
  routLog = [];
  s._breachGate();
  ev.push({ op: 'breachGate', gate: [s.siegeGateCol, s.siegeGateRow], morale: s.def.map((u: any) => [u.bu.id, num(u.morale), u.dead || u.fadingOut || u.routed ? 1 : 0]), routs: routLog.map((id) => [id, find(s, id).facing]), defs: s.def.map(unitState), wall: modelRecord(s.siegeWallGroup), wallTree: dumpTree(s.siegeWallGroup, false), tiles: rle(new Uint8Array(s.terrainMap.tiles)), summary: sceneSummary(s) });
}

// 10. rout + flee toward the home edge: the occupancy west of the unit is cleared (logic state
//     only) so it walks; each "turn" is one `_fleeStep` chain (scheduled steps run between
//     frames) until it is stuck at the fenced margin twice and leaves the field.
{
  const ru = [...s.atk].filter((u: any) => !u.dead && !u.routed && !u.fadingOut && u.q >= 14 && ![a0, a1, a2, a3].includes(u)).sort((x: any, y: any) => x.q - y.q || x.r - y.r)[0];
  for (const k of [...s.occByKey.keys()]) { const [c, r] = k.split(',').map(Number); if (c < ru.q && Math.abs(r - ru.r) <= 2) s.occByKey.delete(k); }
  routLog = [];
  const finishedBefore = s.finished;
  s.finished = false; // set by the end-of-battle check run by the breach morale above (logic)
  s._startRout(ru);
  doMoveLog = []; sched = [];
  let t = 70000;
  const frames: unknown[] = [];
  const turns: number[] = [];
  for (let turn = 0; turn < 6 && !ru.removed; turn++) {
    ru.moveLeft = 3;
    s.vNow = t;
    let finished = 0;
    s._fleeStep(ru, () => { finished++; });
    for (let guard = 0; guard < 50 && finished === 0; guard++) {
      for (const dt of [100, 240]) { frame(s, t + dt); frames.push([t + dt, posOf(ru)]); }
      t += 240;
      const due = sched.splice(0);
      for (const [ms, cb] of due) { t += ms; s.vNow = t; cb(); }
    }
    turns.push(doMoveLog.length);
    t += 1000;
  }
  ev.push({ op: 'flee', finishedBefore, id: ru.bu.id, routs: routLog, facing: ru.facing, moves: doMoveLog, turns, frames, removed: ru.removed ? 1 : 0, vis: [ru.group.visible, ru.hpBarGroup.visible], summary: sceneSummary(s) });
}

// 11. group markers (player = atk) incl. the number texture as recorded canvas calls
{
  const texLog: unknown[] = [];
  const origTex = PROTO._makeGroupNumberTexture;
  const g: any = globalThis;
  s._makeGroupNumberTexture = function (this: any, label: string) {
    const ops: unknown[] = [];
    const ctx = new Proxy({}, { set(_t, k, v) { ops.push(['set', String(k), v]); return true; }, get(_t, k) { return (...a: unknown[]) => { ops.push([String(k), ...a]); }; } });
    const canvas: any = { getContext: () => ctx };
    const doc = g.document;
    g.document = { createElement: (tag: string) => { ops.push(['createElement', tag]); return canvas; } };
    const tex = origTex.call(this, label);
    g.document = doc;
    ops.push(['size', canvas.width, canvas.height]);
    texLog.push([label, ops, tex.isCanvasTexture === true]);
    return tex;
  };
  const roster = s._playerRoster().filter((u: any) => !u.dead && !u.removed);
  const steps: [number, string | null, boolean][] = [[0, '3', false], [1, 'abc', false], [2, '0', false], [3, ' 12x', false], [0, '7', false], [1, null, false], [4, '-2', false], [5, '2.9', false], [7, '9', false], [7, '9', true]];
  const marks: unknown[] = [];
  for (const [i, gid, dead] of steps) {
    const ru = roster[i];
    ru.groupId = gid; ru.dead = dead;
    texLog.length = 0;
    s._updateGroupFrameMarker(ru);
    const gf = ru.group.children.find((c: THREE.Object3D) => c.name === 'groupFrame');
    marks.push({ id: ru.bu.id, gid, dead, tree: gf ? dumpTree(gf, true) : null, model: modelRecord(ru.group), tex: texLog.slice() });
    ru.dead = false;
  }
  // sync: one grouped unit died, one ungrouped
  roster[0].dead = true; roster[3].groupId = null; roster[6].groupId = '4';
  texLog.length = 0;
  s._syncAllGroupFrameMarkers();
  const after = roster.slice(0, 8).map((u: any) => [u.bu.id, u.groupId, u.dead ? 1 : 0, modelRecord(u.group)]);
  roster[0].dead = false;
  ev.push({ op: 'markers', marks, sync: { tex: texLog.slice(), after }, summary: sceneSummary(s) });
  delete s._makeGroupNumberTexture;
}

// 12. bar billboards of the frame loop for two camera poses
{
  const cams: unknown[] = [];
  for (const [dist, tgt] of [[30, null], [12.5, [20, 0, 70]]] as [number, number[] | null][]) {
    s.camDist = dist;
    if (tgt) s.camTarget.set(tgt[0], tgt[1], tgt[2]);
    s._applyCamera();
    for (const ru of [...s.atk, ...s.def]) if (!ru.dead) ru.hpBarGroup.lookAt(s.camera.position);
    const rows = [...s.atk, ...s.def].map((ru: any) => { const b = dumpTree(ru.hpBarGroup, false) as any; return [ru.bu.id, ru.dead ? 1 : 0, b.n, b.sig]; });
    cams.push({ dist, target: tgt, cam: hx(v3(s.camera.position)), rows, first: dumpTree(s.atk[0].hpBarGroup, true) });
  }
  ev.push({ op: 'billboard', cams });
}

// 13. float labels: every label spawned above, then the tick up to the screen projection
{
  const labels = s.floatLabels.map((fl: any) => [hx(v3(fl.worldPos)), fl.startTime, fl.duration, fl.riseRate]);
  const projected: number[][] = [];
  const origProject = THREE.Vector3.prototype.project;
  (THREE.Vector3.prototype as any).project = function (this: THREE.Vector3) { projected.push(v3(this)); return this; };
  const els = s.floatLabels.map((fl: any) => { const e: any = { style: {}, parentNode: { removeChild: () => { e.removed = true; } } }; fl.elem = e; return e; });
  const canvas = s.canvas;
  s.canvas = { clientWidth: 640, clientHeight: 480 };
  const ticks = [0, 1, 500.5, 1999.75, 2000, 61001, 61500, 62100, 63000.25, 64200].map((t) => {
    projected.length = 0;
    s._tickFloatLabels(t);
    return [t, projected.map((p) => hx(p)), els.map((e: any) => (e.removed ? null : e.style.opacity ?? '')), s.floatLabels.length];
  });
  (THREE.Vector3.prototype as any).project = origProject;
  s.canvas = canvas;
  ev.push({ op: 'labels', labels, ticks });
}
out.events = ev;

// ------------------------------------------------------------- battle 2: deploy phase frame + end of deploy
{
  const { s: d, rec } = build('rzym_grecja', undefined, 'atk');
  // The deploy UI groups the player's units and shows their group markers (Z-36-9).
  const groups = d._playerRoster().map((u: any) => [u.bu.id, u.groupId ?? null, d._groupFrameMarkers?.has(u.bu.id) ? 1 : 0, modelRecord(u.group)]);
  // a deploy frame: preview cleared, order lines hidden, billboards
  const prev = new THREE.Group(); prev.name = 'stalePreview'; d._orderPreviewGroup.add(prev);
  d._clearOrderPreview();
  if (d._orderLinesGroup) d._orderLinesGroup.visible = false;
  for (const ru of [...d.atk, ...d.def]) if (!ru.dead) ru.hpBarGroup.lookAt(d.camera.position);
  const frameRec = { summary: sceneSummary(d), lines: dumpTree(d._orderLinesGroup, false), bars: [...d.atk, ...d.def].map((ru: any) => { const b = dumpTree(ru.hpBarGroup, false) as any; return [b.n, b.sig]; }) };
  for (const k of ['_clearAllSelection', '_clearDeploySelection', '_syncGroupRegistry', '_teardownDeployUI', '_updateRightRailLayout', '_startBattle', '_syncMinimapPhaseChrome']) d[k] = () => {};
  d._endDeployPhase();
  const endRec = { summary: sceneSummary(d), lines: dumpTree(d._orderLinesGroup, false), deployGroup: d._deployVisualGroup ? dumpTree(d._deployVisualGroup, false) : null, zone: [d._deployZoneMeshes.length, d._deployZoneMeshes.filter((m: THREE.Object3D) => m.visible).length], ghost: d._deployGhostGroup ? dumpTree(d._deployGhostGroup, false) : null };
  out.deploy = { ...rec, groups, frame: frameRec, end: endRec };
}

// ------------------------------------------------------------- constants
const consts: Record<string, unknown> = {};
for (const k of ['MOVE_STEP_MS', 'STEP_GAP_MS', 'RANGED_FLY_MS', 'RANGED_GAP_MS', 'DEATH_FADE_MS', 'BLOW_LUNGE_MS', 'BLOW_HIT_T', 'BLOW_SETTLE_MS', 'MORALE_GATE_BREACH', 'MORALE_WALL_BREACH'] as const) consts[k] = hx([(BS as any)[k] as number]);
out.consts = consts;
{
  const xs = [0, 0.25, 0.5, 1, -0.5, 1.5, 1e-9, 0.999999, NaN, Infinity, -0];
  out.easing = xs.map((x) => [hx([x]), hx([BS.lerp(-3.5, 7.25, x), BS.easeOut(x), BS.easeIn(x)])]);
}

const dir = process.argv[2] ?? '.';
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'dynamics.json'), JSON.stringify({ three: THREE.REVISION, node: process.version, ...out }));
console.log(`battle3d dynamics events=${ev.length}`);
process.exit(0);
