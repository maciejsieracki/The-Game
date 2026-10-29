// Reference-vector generator for MOD-14 "battle 3D", part 5: picking and camera
// (R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q5).
//
// Runs the REAL web code of `edb8fb56` (`git archive edb8fb56 gra/src gra/data`,
// three@0.169.0, esbuild@0.24.0, node v22.22.0), bundled by `build_picking.mjs` (the
// part-4 bundler with a longer appended `export { ... }` line; `battleScene.ts` text is
// otherwise unchanged).
//
// The two scenes of part 4 are rebuilt (siege `oblezenie`/`rzym`; deploy `rzym_grecja`,
// deploy `atk`), then:
//   - camera control: `_syncRendererSize`, `_onWheel`, `_onKeyZoom`, `_setZoomTarget`,
//     `_tickZoom`, `_setPanKey` (`_onKeyPanDown` / `_onKeyPanUp`), `_tickCameraPanKeys`,
//     `_clampCamTarget`, `_applyCamera`, the drag pan of `_onPanDown` / `_onPanMove` /
//     `_onPanUp`, `_computeMinimapViewport`, `worldToScreen`, the camera matrices after every
//     step (incl. the stale `matrixWorld` left by `Object3D.lookAt`);
//   - picking: `_raycastFromCanvas` (`clientRectToNdc` + `Raycaster.setFromCamera`),
//     `pickBattleGroundTileFromMeshes` (incl. `battlePickMeshUpNormal`, `clampBattleTile`),
//     `pickBattleGroundTilePlane`, `_pickGroundTile`, `_pickUnitAtScreen` and a recursive
//     `intersectObjects` over the live unit groups (meshes, group-marker `Line`s, `Sprite`s)
//     on a grid of client pixels for several camera poses, plus one ray aimed at every unit;
//   - clicks: `_onDeployClick` (+ `_handleDeployUnitPick`), `_onBattleClick`, `_doBoxSelect`
//     (`worldToClientPx`) with the logic they call recorded (Z-36-19);
//   - `extra` (Operator "pomiary", r1): cases for the mutants the r1 vectors left alive, on fresh
//     scenes — `_doBoxSelect` / `_raycastFromCanvas` on the constructor camera, height-only resize,
//     `KeyW` / `KeyS` pan, sub-pixel canvases for the minimap, the last instance of every ground
//     `InstancedMesh`, `_onBattleClick` on enemies in a field battle, deploy clicks with ring colours.
// The canvas is a fake element with a fixed client rect; `renderer.getSize/setSize` are added
// to the inert renderer of `three_shim.ts` (initial size 300×150 = an HTML canvas without
// attributes). A render is emulated as `scene.updateMatrixWorld(); camera.updateMatrixWorld()`
// — the only state `WebGLRenderer.render` changes on the scene graph (three r169).
//
// Usage: node gen_picking.mjs <out-dir>   (bundle produced by `node build_picking.mjs gen_picking`)

import './dom_stub';
import * as THREE from 'three';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as BS from '../websrc/gra/src/battle/battleScene';
import { worldToClientPx } from '../websrc/gra/src/input/picker';
import { buildTestArmies } from '../websrc/gra/src/battle/testBattle';
import { generateBattleTerrain, presetForWorldTerrain } from '../websrc/gra/src/battle/battle-terrain';
import unitsJson from '../websrc/gra/data/units.json';

// ------------------------------------------------------------- hashing (= gen_dynamics.ts)
const _f64 = new Float64Array(1);
const _f64b = new Uint8Array(_f64.buffer);
const _f32 = new Float32Array(1);
const _f32b = new Uint8Array(_f32.buffer);
class Fnv {
  h = 0x811c9dc5 >>> 0;
  byte(b: number): void { this.h ^= b & 0xff; this.h = Math.imul(this.h, 0x01000193) >>> 0; }
  u32(v: number): void { v = v >>> 0; this.byte(v); this.byte(v >>> 8); this.byte(v >>> 16); this.byte(v >>> 24); }
  f32(v: number): void { if (Number.isNaN(v)) { for (const b of [0, 0, 0xc0, 0x7f]) this.byte(b); return; } _f32[0] = v; for (let i = 0; i < 4; i++) this.byte(_f32b[i]!); }
  f64(v: number): void { if (Number.isNaN(v)) { for (const b of [0, 0, 0, 0, 0, 0, 0xf8, 0x7f]) this.byte(b); return; } _f64[0] = v; for (let i = 0; i < 8; i++) this.byte(_f64b[i]!); }
  str(s: string): void { this.u32(s.length); for (let i = 0; i < s.length; i++) this.u32(s.charCodeAt(i)); }
  bool(b: boolean): void { this.byte(b ? 1 : 0); }
}
if (new Uint8Array(new Uint16Array([1]).buffer)[0] !== 1) throw new Error('big-endian host');
function hx(nums: ArrayLike<number>): string {
  const dv = new DataView(new ArrayBuffer(8));
  let out = '';
  for (let i = 0; i < nums.length; i++) { dv.setFloat64(0, nums[i]!, false); out += dv.getBigUint64(0, false).toString(16).padStart(16, '0'); }
  return out;
}
const v3 = (v: THREE.Vector3): number[] => [v.x, v.y, v.z];
const VERBOSE = process.env.PICK_VERBOSE === '1';
const verbose: Record<string, unknown[]> = {};
function vlog(k: string, v: unknown): void { if (VERBOSE) (verbose[k] ??= []).push(v); }

// ------------------------------------------------------------- DTO of the scene (= gen_dynamics.ts)
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
for (const k of ['_sfxRout', '_sfxDeath', '_sfxShot', '_sfxMelee', '_sfxRamImpact', '_sfxCatapultImpact', '_updateSiegeHud', '_syncSiegeHudLayout']) PROTO[k] = function () {};
// requestAnimationFrame is never driven here (no frame loop); the camera steps are called directly.
(globalThis as any).requestAnimationFrame = () => 0;

const UNITS = unitsJson as any[];
function build(preset: string, siege: unknown, deploy: 'atk' | 'def' | undefined): { s: any; rec: Record<string, unknown> } {
  const a = buildTestArmies(UNITS, preset as any);
  spawnSnap = null; moveLog = [];
  const s: any = new BS.BattleScene({ attacker: a.attacker, defender: a.defender, teren: a.teren, siege: siege as any, deploy: deploy != null, deployPlayerSide: deploy } as any);
  const rec = { preset, teren: a.teren, siege, deploy: deploy ?? null, player: s._playerControlSide(), desert: s._desertPalette, tilesRle: rle(terrainDto(a.teren)), spawn: spawnSnap, moves: moveLog };
  moveLog = null;
  return { s, rec };
}

/**
 * FNV of the scene DTO: the scenes are the part-4 ones (`dynamics.json` `siege` / `deploy`); the Rust
 * test builds them from there and checks this signature (same stream as `battle3d_picking.rs::dto_sig`).
 */
function dtoSig(rec: any, groups: unknown[][] | null): number {
  const f = new Fnv();
  const tl = rec.tilesRle as number[]; f.u32(tl.length); for (const v of tl) f.u32(v);
  const sp = rec.spawn as any[]; f.u32(sp.length);
  for (const r of sp) {
    f.str(r[0]); f.str(r[1]); f.u32(r[2]); f.u32(r[3]); f.u32(r[4]); f.u32(r[5]); f.str(r[6]); f.str(r[7]); f.u32(r[8]);
    for (const v of r[9]) { if (typeof v === 'string') { const dv = new DataView(new ArrayBuffer(8)); dv.setBigUint64(0, BigInt('0x' + v), false); f.f64(dv.getFloat64(0, false)); } else f.f64(v); }
    f.u32(r[10]); f.u32(r[11]); f.u32(r[12]);
  }
  const mv = rec.moves as any[]; f.u32(mv.length); for (const m of mv) { f.str(m[0]); f.u32(m[1]); f.u32(m[2]); }
  f.str(String(rec.player)); f.bool(!!rec.desert); f.str(rec.siege ? String(rec.siege.civ) : ''); f.str(rec.deploy ?? '');
  if (groups) { f.u32(groups.length); for (const x of groups) { f.str(x[0] as string); f.bool(x[1] !== null); f.str((x[1] as string | null) ?? ''); f.u32(x[2] as number); } }
  return f.h >>> 0;
}

// ------------------------------------------------------------- canvas, renderer, render
type Rect = { w: number; h: number; left: number; top: number };
function setCanvas(s: any, r: Rect): void {
  s.canvas = {
    clientWidth: r.w, clientHeight: r.h, style: {},
    getBoundingClientRect: () => ({ left: r.left, top: r.top, width: r.w, height: r.h, right: r.left + r.w, bottom: r.top + r.h, x: r.left, y: r.top }),
    addEventListener() {}, removeEventListener() {},
  };
}
function installRenderer(s: any): void {
  let rw = 300, rh = 150; // HTMLCanvasElement default bitmap size (canvas created without attributes)
  s.renderer.getSize = (t: THREE.Vector2) => t.set(rw, rh);
  s.renderer.setSize = (w: number, h: number) => { rw = w; rh = h; };
  s.__rsize = () => [rw, rh];
}
/** What `WebGLRenderer.render(scene, camera)` does to the graph (three r169 `WebGLRenderer.js`). */
function render(s: any): void { s.scene.updateMatrixWorld(); if (s.camera.parent === null) s.camera.updateMatrixWorld(); }

// ------------------------------------------------------------- camera records
function camNums(s: any): number[] {
  const c = s.camera as THREE.PerspectiveCamera;
  return [...v3(s.camTarget), s.camDist, s.camDistTarget, s.camDistMin, s.camDistMax, ...v3(c.position),
    c.quaternion.x, c.quaternion.y, c.quaternion.z, c.quaternion.w, c.rotation.x, c.rotation.y, c.rotation.z, c.aspect,
    ...c.matrixWorld.elements, ...c.matrixWorldInverse.elements, ...c.projectionMatrix.elements, ...c.projectionMatrixInverse.elements];
}
function camSig(s: any): number {
  const f = new Fnv();
  for (const v of camNums(s)) f.f64(v);
  vlog('cam', hx(camNums(s)));
  return f.h >>> 0;
}
function minimapVp(s: any): number[] { const v = s._computeMinimapViewport(); return [v.colMin, v.rowMin, v.colMax, v.rowMax]; }

const ev = (o: Record<string, unknown>): any => ({ button: 0, buttons: 0, clientX: 0, clientY: 0, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false, pointerId: 1, target: null, preventDefault() { this.__pd = true; }, stopPropagation() {}, ...o });

/** Replays one camera op on `s`; returns its record (op + result + camera signature + minimap viewport). */
function camOp(s: any, op: unknown[]): unknown[] {
  const [k] = op as [string];
  let res: unknown = null;
  switch (k) {
    case 'canvas': setCanvas(s, { w: op[1] as number, h: op[2] as number, left: op[3] as number, top: op[4] as number }); break;
    case 'sync': s._syncRendererSize(); res = s.__rsize(); break;
    case 'wheel': { const e = ev({ deltaY: op[1] }); s._onWheel(e); res = e.__pd ? 1 : 0; break; }
    case 'key': { const e = ev({ key: op[1] }); s._onKeyZoom(e); res = e.__pd ? 1 : 0; break; }
    case 'zoomTarget': s._setZoomTarget(op[1]); break;
    case 'panKey': {
      const e = ev({ code: op[1], target: op[3] ? { tagName: 'input' } : null });
      if (op[2]) s._onKeyPanDown(e); else s._onKeyPanUp(e);
      const pk = s._camPanKeys;
      res = [e.__pd ? 1 : 0, pk.up ? 1 : 0, pk.down ? 1 : 0, pk.left ? 1 : 0, pk.right ? 1 : 0];
      break;
    }
    case 'frame': s._syncRendererSize(); s._tickZoom(); s._tickCameraPanKeys(); break; // camera part of the frame loop (`:8518-8520`, `:8537-8539`)
    case 'tickZoom': s._tickZoom(); break;
    case 'tickPan': s._tickCameraPanKeys(); break;
    case 'render': render(s); break;
    case 'apply': s._applyCamera(); break;
    case 'clamp': s._clampCamTarget(); break;
    case 'setTarget': s.camTarget.set(op[1], op[2], op[3]); break;
    case 'setDist': s.camDist = op[1]; break;
    case 'panDown': s._onPanDown(ev({ button: op[1], clientX: op[2], clientY: op[3] })); res = [s.panning ? 1 : 0]; break;
    case 'panMove': s._onPanMove(ev({ buttons: op[3], clientX: op[1], clientY: op[2] })); res = [s.panning ? 1 : 0]; break;
    case 'panUp': s._onPanUp(ev({ button: op[1], clientX: op[2], clientY: op[3] })); res = [s.panning ? 1 : 0]; break;
    default: throw new Error('op ' + k);
  }
  return [op, res, camSig(s), minimapVp(s)];
}

// ------------------------------------------------------------- picking records
type Tile = { col: number; row: number } | null;
const tcode = (t: Tile): number => (t ? t.col * 1000 + t.row : -1);

function sceneIndex(s: any): Map<THREE.Object3D, number> {
  const m = new Map<THREE.Object3D, number>();
  let i = 0;
  s.scene.traverse((o: THREE.Object3D) => { m.set(o, i++); });
  return m;
}
function liveGroups(s: any): THREE.Object3D[] {
  return [...s.atk, ...s.def].filter((u: any) => !u.dead && !u.fadingOut && !u.removed).map((u: any) => u.group);
}
const unitIndex = (s: any, ru: any): number => (ru ? [...s.atk, ...s.def].indexOf(ru) : -1);

/** One client pixel: [ground, fromMeshes, fromPlane, unit, nGround, nUnit]; hit details go into `f`. */
function pickRay(s: any, idx: Map<THREE.Object3D, number>, cx: number, cy: number, f: Fnv): number[] {
  const rc: THREE.Raycaster | null = s._raycastFromCanvas(cx, cy);
  if (!rc) { f.u32(0xdead); return [tcode(s._pickGroundTile(cx, cy)), -1, -1, unitIndex(s, s._pickUnitAtScreen(cx, cy)), -1, -1]; }
  for (const v of [...v3(rc.ray.origin), ...v3(rc.ray.direction)]) f.f64(v);
  const tm = s.terrainMap;
  const fromMeshes: Tile = BS.pickBattleGroundTileFromMeshes(rc, tm, s._battleGroundPickMeshes);
  const fromPlane: Tile = BS.pickBattleGroundTilePlane(rc, tm);
  const gh = rc.intersectObjects(s._battleGroundPickMeshes, false);
  f.u32(gh.length);
  for (const h of gh) {
    f.f64(h.distance); for (const v of v3(h.point)) f.f64(v);
    f.f64(BS.battlePickMeshUpNormal(h)); f.u32(idx.get(h.object)!); f.u32(h.instanceId ?? 0xffffffff);
  }
  const uh = rc.intersectObjects(liveGroups(s), true);
  f.u32(uh.length);
  for (const h of uh) { f.f64(h.distance); for (const v of v3(h.point)) f.f64(v); f.u32(idx.get(h.object)!); }
  const ground: Tile = s._pickGroundTile(cx, cy);
  const unit = unitIndex(s, s._pickUnitAtScreen(cx, cy));
  vlog('rays', [cx, cy, hx([...v3(rc.ray.origin), ...v3(rc.ray.direction)]), gh.slice(0, 4).map((h) => [hx([h.distance, ...v3(h.point), BS.battlePickMeshUpNormal(h)]), idx.get(h.object), h.instanceId ?? -1]), uh.slice(0, 4).map((h) => [hx([h.distance, ...v3(h.point)]), idx.get(h.object), h.object.type])]);
  return [tcode(ground), tcode(fromMeshes), tcode(fromPlane), unit, gh.length, uh.length];
}

/** A pose: grid of NX×NY client pixels + one ray at every live unit (`worldToClientPx` of its group + 0.5 up). */
function pickPose(s: any, rect: Rect, nx: number, ny: number, aimUnits: boolean): Record<string, unknown> {
  render(s);
  const idx = sceneIndex(s);
  if (VERBOSE) {
    // Z-36-21: Mesh.raycast's local box test only runs for geometry.boundingBox !== null.
    let meshes = 0, withBox = 0, matArrays = 0, backSide = 0;
    s.scene.traverse((o: any) => {
      if (!o.isMesh) return;
      meshes++;
      if (o.geometry.boundingBox !== null) withBox++;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      if (Array.isArray(o.material)) matArrays++;
      if (mats.some((m: any) => m.side === THREE.BackSide)) backSide++;
    });
    vlog('geometry', { meshes, withBox, matArrays, backSide });
  }
  const f = new Fnv();
  const grid: number[][] = [];
  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      const cx = rect.left + (i * rect.w) / nx + 0.37 * ((j % 3) + 1);
      const cy = rect.top + (j * rect.h) / ny + 0.61 * ((i % 2) + 1);
      grid.push(pickRay(s, idx, cx, cy, f));
    }
  }
  const aimed: unknown[] = [];
  if (aimUnits) {
    s.camera.updateMatrixWorld(true);
    for (const ru of [...s.atk, ...s.def]) {
      const p = ru.group.position;
      const px = worldToClientPx(p.x, p.y + 0.5, p.z, s.camera, s.canvas);
      if (!px) { aimed.push(null); continue; }
      aimed.push([hx([px.x, px.y]), ...pickRay(s, idx, px.x, px.y, f)]);
    }
  }
  return { cam: camSig(s), grid, aimed, sig: f.h >>> 0 };
}

// ------------------------------------------------------------- run
const out: Record<string, unknown> = {};
const RECT: Rect = { w: 1280, h: 720, left: 13, top: 7 };

// ========================================================== battle 1: siege
{
  const { s, rec } = build('oblezenie', { civ: 'rzym' }, undefined);
  installRenderer(s);
  const occ = (): unknown[] => [...s.occByKey.entries()].map(([k, u]: [string, any]) => [k, u.bu.id]);
  const cam0 = hx(camNums(s)); // after the constructor: aspect 1, matrixWorld from the constructor's lookAt
  const ops: unknown[][] = [
    ['canvas', RECT.w, RECT.h, RECT.left, RECT.top], ['sync'], ['sync'], ['render'],
    ['wheel', 100], ['frame'], ['frame'], ['frame'], ['wheel', -53.5], ['wheel', 3], ['frame'],
    ...Array.from({ length: 30 }, () => ['frame']),
    ['key', '+'], ['key', '='], ['key', 'Add'], ['frame'], ['key', '-'], ['key', '_'], ['key', 'Subtract'], ['key', 'x'],
    ['frame'], ['frame'], ['wheel', 1e4], ['frame'], ['wheel', -1e5], ['frame'], ['frame'], ['zoomTarget', 25.5], ['frame'],
    ...Array.from({ length: 40 }, () => ['frame']),
    ['render'],
    ['panKey', 'KeyA', 1, 0], ['frame'], ['frame'], ['panKey', 'ArrowUp', 1, 0], ['frame'], ['panKey', 'KeyW', 1, 1], ['panKey', 'KeyQ', 1, 0],
    ...Array.from({ length: 25 }, () => ['frame']),
    ['panKey', 'KeyA', 0, 0], ['panKey', 'ArrowUp', 0, 0], ['panKey', 'KeyD', 1, 0], ['panKey', 'ArrowDown', 1, 0], ['frame'], ['frame'],
    ['panKey', 'ArrowRight', 1, 0], ['panKey', 'KeyS', 1, 0], ['frame'], ['panKey', 'KeyD', 0, 0], ['panKey', 'ArrowRight', 0, 0], ['panKey', 'KeyS', 0, 0],
    ['panKey', 'ArrowDown', 0, 0], ['frame'], ['render'],
    ['canvas', 0, 500, 0, 0], ['frame'], ['canvas', 800, 1200, -4, 3.5], ['sync'], ['render'],
    ['panDown', 2, 400, 300], ['panMove', 430.5, 280, 2], ['panMove', 900, -50, 2], ['panUp', 2, 900, -50],
    ['panDown', 1, 10, 10], ['panMove', -3000, 4000, 4], ['panUp', 1, -3000, 4000],
    ['panDown', 0, 100, 100], ['panMove', 102, 103, 1], ['panUp', 0, 102, 103],
    ['panDown', 3, 0, 0], ['panMove', 50, 50, 8], ['panUp', 3, 50, 50],
    ['canvas', RECT.w, RECT.h, RECT.left, RECT.top], ['sync'], ['setTarget', 1e3, 0, -1e3], ['setDist', 2], ['clamp'], ['apply'],
    ['setDist', 500], ['apply'], ['setDist', 30], ['setTarget', 33, 0, 77.25], ['apply'], ['render'],
  ];
  const panFlags = [s.deployPhase ? 1 : 0, s._manualMode ? 1 : 0, s.started ? 1 : 0, s.finished ? 1 : 0];
  const camOps = ops.map((op) => camOp(s, op));
  // worldToScreen on a stale camera (after _applyCamera without a render) and after a render, empty canvas
  const pts: [number, number, number][] = [[33, 0, 77.25], [0, 0, 0], [60.5, 2.5, 140], [33, 40, 100], [10, -1, 50]];
  s.camTarget.set(40, 0, 70); s.camDist = 22; s._applyCamera();
  const w2s = (): unknown[] => pts.map((p) => { const r = BS.worldToScreen(new THREE.Vector3(...p), s.camera, s.canvas); return r ? hx([r.x, r.y]) : null; });
  const toScreen = { stale: w2s(), camStale: hx(camNums(s)) } as Record<string, unknown>;
  render(s);
  toScreen.fresh = w2s();
  setCanvas(s, { w: 0, h: 10, left: 0, top: 0 });
  toScreen.empty = w2s();
  setCanvas(s, RECT);
  const clientPx = pts.map((p) => { const r = worldToClientPx(p[0], p[1], p[2], s.camera, s.canvas); return r ? hx([r.x, r.y]) : null; });

  // picking poses
  const poses: unknown[] = [];
  s.camTarget.set(33, 0, 77.5); s.camDist = 30; s.camDistTarget = 30; s._applyCamera();
  poses.push({ name: 'default', ...pickPose(s, RECT, 16, 10, true) });
  // close-up over the wall and the gate (hits wall-top archers, rams, the gate)
  const wallCol = s.siegeWallCol;
  s.camTarget.set(wallCol * BS.TILE_S - 3, 0, s.siegeGateRow * BS.TILE_S); s.camDist = 9; s.camDistTarget = 9; s._applyCamera();
  poses.push({ name: 'wall', ...pickPose(s, RECT, 16, 10, true) });
  // a few unit flags that the pickers filter (dead / fading / removed), hills and a river under
  // the camera (tile kinds only — the meshes are not rebuilt, so the plane and the meshes disagree)
  const flagged: unknown[] = [];
  const all = [...s.atk, ...s.def];
  for (const [i, k] of [[2, 'dead'], [5, 'fadingOut'], [9, 'removed'], [12, 'dead'], [all.length - 3, 'removed']] as [number, string][]) {
    all[i][k] = true; flagged.push([all[i].bu.id, k]);
  }
  const W = BS.BF_COLS;
  const a0 = s.atk[0];
  const relief: number[][] = [];
  for (let d = 0; d < 6; d++) {
    const c = a0.q - 2 + d, r = a0.r + 1;
    const k = d < 3 ? 2 : (d < 5 ? 3 : 4);
    s.terrainMap.tiles[r * W + c] = k; relief.push([c, r, k]);
  }
  s.camTarget.set(a0.q * BS.TILE_S, 0, a0.r * BS.TILE_S); s.camDist = 12; s.camDistTarget = 12; s._applyCamera();
  poses.push({ name: 'flags', ...pickPose(s, RECT, 12, 8, true) });
  // far zoom-out, a different aspect and an offset rect
  const R2: Rect = { w: 911, h: 1333, left: -20.5, top: 41 };
  setCanvas(s, R2); s._syncRendererSize();
  s.camTarget.set(30, 0, 70); s.camDist = 180; s.camDistTarget = 180; s._applyCamera();
  poses.push({ name: 'far', rect: [R2.w, R2.h, R2.left, R2.top], ...pickPose(s, R2, 10, 12, false) });
  setCanvas(s, { w: 0, h: 720, left: 0, top: 0 });
  const emptyRect = [s._raycastFromCanvas(5, 5) === null ? 1 : 0, tcode(s._pickGroundTile(5, 5)), unitIndex(s, s._pickUnitAtScreen(5, 5))];
  setCanvas(s, RECT); s._syncRendererSize();

  // battle clicks (the logic they reach is recorded, not run — Z-36-19)
  s.camTarget.set(33, 0, 77.5); s.camDist = 30; s.camDistTarget = 30; s._applyCamera(); render(s);
  const log: unknown[] = [];
  s._handleBattleUnitPick = (ru: any, c: boolean, sh: boolean) => log.push(['pick', ru.bu.id, c ? 1 : 0, sh ? 1 : 0]);
  s._issueBattleAttack = (id: string, q: boolean) => log.push(['attack', id, q ? 1 : 0]);
  s._issueBattleMove = (c: number, r: number, q: boolean) => log.push(['move', c, r, q ? 1 : 0]);
  s.camera.updateMatrixWorld(true);
  const targets: [number, number][] = [];
  for (const ru of [...s.atk.slice(0, 6), ...s.def.slice(0, 6), all[2], all[5], all[9]]) {
    const px = worldToClientPx(ru.group.position.x, ru.group.position.y + 0.4, ru.group.position.z, s.camera, s.canvas)!;
    targets.push([px.x, px.y]);
  }
  targets.push([640, 360], [200.5, 650.25], [1200, 40], [13, 7]);
  const battleClicks: unknown[] = [];
  const combos: [boolean, boolean, boolean, number, number][] = [[false, false, false, 0, 0], [true, false, false, 2, 1], [false, true, true, 1, 0], [false, false, true, 0, 3]];
  for (const [ctrl, shift, awaiting, round, nsel] of combos) {
    s._lastClickModifiers = { ctrl, shift }; s._battleAwaitingOrders = awaiting; s.roundNo = round;
    s._selectedUnits = new Set(s.atk.slice(0, nsel).map((u: any) => u.bu.id));
    for (const [x, y] of targets) {
      log.length = 0;
      render(s); // a frame between two clicks (no scene change here)
      s._onBattleClick(x, y);
      battleClicks.push([hx([x, y]), ctrl ? 1 : 0, shift ? 1 : 0, awaiting ? 1 : 0, round, nsel, log.slice()]);
    }
  }
  // box select (battle: manual → player roster; not manual → this.atk)
  const box: unknown[] = [];
  const ringLog: string[] = [];
  s._clearAllSelection = () => ringLog.push('clear');
  s._addSelectionRing = (ru: any) => ringLog.push(ru.bu.id);
  for (const k of ['_updateRosterBar', '_updateSelectedPanel', '_showOrderFeedback', '_updateBattleQuickSelectBar', '_updateBattleSelectionBar', '_refreshDeploySelectionVisuals', '_showDeployFeedback']) s[k] = () => {};
  const atk7 = s.atk[7]; atk7.routed = true; flagged.push([atk7.bu.id, 'routed']);
  for (const manual of [true, false]) {
    s._manualMode = manual;
    for (const r of [[0, 0, 2000, 2000], [300, 200, 700, 500], [640.5, 360, 640.5, 360], [-100, -100, 10, 10], [500, 0, 900, 720]]) {
      ringLog.length = 0;
      s._doBoxSelect(r[0], r[1], r[2], r[3]);
      box.push([manual ? 1 : 0, r, ringLog.slice()]);
    }
  }
  // `_onKeyToggleBars` (in the line range of `_tickCameraPanKeys`'s inventory row): bar groups of live units
  const barsOps: [string, number, number][] = [['h', 0, 0], ['H', 0, 0], ['h', 1, 0], ['h', 0, 1], ['x', 0, 0], ['H', 0, 0]];
  const bars = barsOps.map(([k, ed, ct]) => {
    const e = ev({ key: k, target: ed ? { tagName: 'textarea' } : null, ctrlKey: ct === 1 });
    s._onKeyToggleBars(e);
    return [k, ed, ct, e.__pd ? 1 : 0, s.barsVisible ? 1 : 0, [...s.atk, ...s.def].map((u: any) => (u.hpBarGroup.visible ? '1' : '0')).join('')];
  });
  out.siege = { dto: dtoSig(rec, null), occ: occ(), flagged, relief, cam0, panFlags, bars, camOps, toScreen, clientPx, poses, emptyRect, battleClicks, box };
}

// ========================================================== battle 2: deploy
{
  const { s, rec } = build('rzym_grecja', undefined, 'atk');
  installRenderer(s);
  const groups = s._playerRoster().map((u: any) => [u.bu.id, u.groupId ?? null, s._groupFrameMarkers?.has(u.bu.id) ? 1 : 0]);
  setCanvas(s, RECT); s._syncRendererSize();
  const poses: unknown[] = [];
  poses.push({ name: 'deploy', ...pickPose(s, RECT, 16, 10, true) });
  const p = s._playerRoster()[0];
  s.camTarget.set(p.q * BS.TILE_S + 1, 0, p.r * BS.TILE_S); s.camDist = 7; s.camDistTarget = 7; s._applyCamera();
  poses.push({ name: 'markers', ...pickPose(s, RECT, 16, 10, true) });

  // deploy clicks: `_onDeployClick` + the real `_handleDeployUnitPick` / `_refreshDeploySelectionVisuals`
  // (3D part); logic and UI they reach are recorded.
  s.camTarget.set(33, 0, 77.5); s.camDist = 30; s.camDistTarget = 30; s._applyCamera(); render(s);
  const log: unknown[] = [];
  s._applyDeployPlacement = (units: any[], a: number, b: number, c: number, d: number) => log.push(['place', units.map((u) => u.bu.id), a, b, c, d]);
  s._clearDeployGhosts = function (this: any) { log.push(['ghosts']); };
  s._showDeployFeedback = (m: string) => log.push(['feedback', m]);
  s._clearDeploySelectionState = () => log.push(['clearSel']);
  for (const k of ['_updateRosterBar', '_updateDeployToolbarSelection', '_syncDeployRosterGroupVisibility', '_updateSelectedPanel', '_renderDeployRoster', '_updateDeployToolbarStatus', '_syncGroupRegistry']) s[k] = () => {};
  const roster = s._playerRoster();
  const enemy = s._playerControlSide() === 'atk' ? s.def : s.atk;
  s.camera.updateMatrixWorld(true);
  const aim = (ru: any, dy: number): [number, number] => { const q = worldToClientPx(ru.group.position.x, ru.group.position.y + dy, ru.group.position.z, s.camera, s.canvas)!; return [q.x, q.y]; };
  const tileAt = (c: number, r: number): [number, number] => { const q = worldToClientPx(c * BS.TILE_S, 0, r * BS.TILE_S, s.camera, s.canvas)!; return [q.x, q.y]; };
  const r0 = roster[0], r1 = roster[1], r5 = roster[5], r20 = roster[20];
  // 0 plain, 1 ctrl, 2 shift, 3 ctrl+shift; preferPlacement
  const plan: [[number, number], number, boolean][] = [
    [aim(r0, 0.4), 0, false], [aim(r0, 0.4), 0, false], [aim(r1, 0.6), 1, false], [aim(r5, 0.2), 2, false], [aim(r1, 0.6), 1, false],
    [aim(r20, 0.5), 0, false], [aim(r20, 1.2), 3, false], [aim(r5, 0.2), 2, false],
    [tileAt(r0.q + 1, r0.r + 2), 0, false], [tileAt(r0.q + 1, r0.r + 2), 0, true], [tileAt(60, 77), 0, false], [aim(enemy[0], 0.5), 0, false],
    [tileAt(5, 3), 0, true], [aim(r1, 0.6), 0, true], [[640, 360], 1, false], [[1279, 700], 0, false], [[13, 7], 2, false],
  ];
  const deployClicks: unknown[] = [];
  const sel = (): unknown[] => [[...s._selectedUnits], s._deploySelected?.bu.id ?? null, [...s._selectionRings.keys()]];
  const scaleSig = (): number => { const f = new Fnv(); for (const u of roster) { for (const v of v3(u.group.scale)) f.f64(v); const ring = s._selectionRings.get(u.bu.id); f.u32(ring ? u.group.children.indexOf(ring) : 0xffffffff); if (ring) for (const v of v3(ring.position)) f.f64(v); } return f.h >>> 0; };
  for (const [[x, y], mods, prefer] of plan) {
    log.length = 0;
    s._lastClickModifiers = { ctrl: (mods & 1) !== 0, shift: (mods & 2) !== 0 };
    render(s); // a frame between two clicks: rings / scales of the previous click get their matrixWorld
    s._onDeployClick(x, y, prefer);
    deployClicks.push([hx([x, y]), mods, prefer ? 1 : 0, log.slice(), sel(), scaleSig()]);
  }
  // impassable cell inside the zone with a selection: make the clicked tile a river (3) for this click
  {
    const [x, y] = tileAt(r0.q + 2, r0.r - 3);
    const c = r0.q + 2, r = r0.r - 3;
    const old = s.terrainMap.tiles[r * BS.BF_COLS + c];
    s.terrainMap.tiles[r * BS.BF_COLS + c] = 3;
    log.length = 0;
    s._lastClickModifiers = { ctrl: false, shift: false };
    render(s);
    s._onDeployClick(x, y, true);
    deployClicks.push([hx([x, y]), 0, 1, log.slice(), sel(), scaleSig(), [c, r, 3]]);
    s.terrainMap.tiles[r * BS.BF_COLS + c] = old;
  }
  // deploy box select: player roster
  const box: unknown[] = [];
  const ringLog: string[] = [];
  s._clearAllSelection = () => ringLog.push('clear');
  s._addSelectionRing = (ru: any) => ringLog.push(ru.bu.id);
  for (const r of [[0, 0, 2000, 2000], [300, 200, 700, 500], [640, 0, 1280, 720]]) {
    ringLog.length = 0;
    s._doBoxSelect(r[0], r[1], r[2], r[3]);
    box.push([1, r, ringLog.slice()]);
  }
  const zone = [BS.DEPLOY_MIN_COL, BS.DEPLOY_MAX_COL, BS.DEPLOY_MIN_ROW, BS.DEPLOY_MAX_ROW];
  out.deploy = { dto: dtoSig(rec, groups), zone, occ: [...s.occByKey.entries()].map(([k, u]: [string, any]) => [k, u.bu.id]), poses, deployClicks, box };
}

// ========================================================== extra cases (Operator "pomiary", r1)
// Cases added after the full mutation run on the r1 vectors left mutants alive (P4-36 §49): every
// one runs on FRESH scenes (the part-4 ones again; DTO signature re-checked), so the vectors above
// are unchanged.
{
  const extra: Record<string, unknown> = {};
  const ringStub = (s: any, ringLog: string[]): void => {
    s._clearAllSelection = () => ringLog.push('clear');
    s._addSelectionRing = (ru: any) => ringLog.push(ru.bu.id);
    for (const k of ['_updateRosterBar', '_updateSelectedPanel', '_showOrderFeedback', '_updateBattleQuickSelectBar', '_updateBattleSelectionBar', '_refreshDeploySelectionVisuals', '_showDeployFeedback']) s[k] = () => {};
  };
  /** Last (and first) instance of every InstancedMesh among the ground pick meshes: camera over it, one ray at its origin. */
  const instancedCases = (s: any): unknown[] => {
    const res: unknown[] = [];
    for (const m of s._battleGroundPickMeshes as any[]) {
      if (!m.isInstancedMesh) continue;
      for (const i of [m.count - 1, 0]) {
        m.updateMatrixWorld(true);
        const im = new THREE.Matrix4();
        m.getMatrixAt(i, im);
        const p = new THREE.Vector3(0, 0, 0).applyMatrix4(im).applyMatrix4(m.matrixWorld);
        s.camTarget.set(p.x, 0, p.z); s.camDist = 9; s.camDistTarget = 9; s._applyCamera(); render(s);
        const idx = sceneIndex(s);
        const px = worldToClientPx(p.x, p.y, p.z, s.camera, s.canvas)!;
        const rc: THREE.Raycaster = s._raycastFromCanvas(px.x, px.y)!;
        const hits = rc.intersectObjects([m], false).map((h: any) => [hx([h.distance, ...v3(h.point)]), h.instanceId]);
        res.push([idx.get(m), m.count, i, hx([p.x, p.z]), hx([px.x, px.y]), hx([...v3(rc.ray.origin), ...v3(rc.ray.direction)]), hits]);
      }
    }
    return res;
  };

  // --- siege A: _doBoxSelect on the constructor camera (matrixWorld never refreshed since the constructor's lookAt)
  {
    const { s, rec } = build('oblezenie', { civ: 'rzym' }, undefined);
    if (dtoSig(rec, null) !== (out.siege as any).dto) throw new Error('siege A DTO');
    installRenderer(s); setCanvas(s, RECT);
    const ringLog: string[] = [];
    ringStub(s, ringLog);
    const cam = hx(camNums(s)); // the constructor camera the first _doBoxSelect starts from
    const box: unknown[] = [];
    for (const r of [[0, 0, 2000, 2000], [300, 200, 700, 500], [-1e4, -1e4, 1e4, 1e4], [0, 360, 1280, 727]]) {
      ringLog.length = 0;
      s._doBoxSelect(r[0], r[1], r[2], r[3]);
      box.push([r, ringLog.slice()]);
    }
    extra.staleBox = { cam, box };
  }
  // --- siege B: _raycastFromCanvas on the constructor camera, then camera ops, then instanced picks
  {
    const { s, rec } = build('oblezenie', { civ: 'rzym' }, undefined);
    if (dtoSig(rec, null) !== (out.siege as any).dto) throw new Error('siege B DTO');
    installRenderer(s); setCanvas(s, RECT);
    const rays = ([[640, 360], [13, 7], [1292.5, 726.75], [100.5, 650.25]] as [number, number][]).map(([x, y]) => {
      const rc: THREE.Raycaster = s._raycastFromCanvas(x, y)!;
      return [x, y, hx([...v3(rc.ray.origin), ...v3(rc.ray.direction)])];
    });
    extra.staleRays = rays;
    const ops: unknown[][] = [
      ['canvas', RECT.w, RECT.h, RECT.left, RECT.top], ['sync'], ['canvas', RECT.w, 640, RECT.left, RECT.top], ['sync'], ['render'],
      ['panKey', 'KeyW', 1, 0], ['frame'], ['frame'], ['panKey', 'KeyW', 0, 0], ['panKey', 'KeyS', 1, 0], ['frame'], ['panKey', 'KeyS', 0, 0],
      ['canvas', RECT.w, 0.5, RECT.left, RECT.top], ['canvas', 0.5, 0.25, 0, 0], ['canvas', 0.75, 900, 0, 0],
      // sub-pixel canvases with a close camera: the minimap's max(1, clientHeight) floor decides the frame
      ['setDist', 3], ['canvas', 0.5, 0.25, 0, 0], ['canvas', 4, 0.5, 0, 0], ['canvas', 0.6, 0.9, 0, 0], ['setDist', 30], ['apply'],
      ['canvas', RECT.w, RECT.h, RECT.left, RECT.top], ['sync'], ['render'],
    ];
    extra.camOps = ops.map((op) => camOp(s, op));
    extra.siegeInstanced = instancedCases(s);
  }
  // --- deploy C: _onBattleClick at the enemy side (field battle, enemies on open ground) + deploy clicks with ring colours
  {
    const { s, rec } = build('rzym_grecja', undefined, 'atk');
    installRenderer(s);
    const groups = s._playerRoster().map((u: any) => [u.bu.id, u.groupId ?? null, s._groupFrameMarkers?.has(u.bu.id) ? 1 : 0]);
    if (dtoSig(rec, groups) !== (out.deploy as any).dto) throw new Error('deploy C DTO');
    // the Rust test reuses `deploy.occ` (recorded after the deploy block, whose placements are recorded, not run)
    if (JSON.stringify([...s.occByKey.entries()].map(([k, u]: [string, any]) => [k, u.bu.id])) !== JSON.stringify((out.deploy as any).occ)) throw new Error('deploy C occ');
    setCanvas(s, RECT); s._syncRendererSize();
    s.camTarget.set(33, 0, 77.5); s.camDist = 30; s.camDistTarget = 30; s._applyCamera(); render(s);
    const enemy: any[] = s._playerControlSide() === 'atk' ? s.def : s.atk;
    const roster: any[] = s._playerRoster();
    // battle clicks (logic recorded, Z-36-19)
    const blog: unknown[] = [];
    s._handleBattleUnitPick = (ru: any, c: boolean, sh: boolean) => blog.push(['pick', ru.bu.id, c ? 1 : 0, sh ? 1 : 0]);
    s._issueBattleAttack = (id: string, q: boolean) => blog.push(['attack', id, q ? 1 : 0]);
    s._issueBattleMove = (c: number, r: number, q: boolean) => blog.push(['move', c, r, q ? 1 : 0]);
    s.camera.updateMatrixWorld(true);
    const battleClicks: unknown[] = [];
    const bTargets: [number, number][] = [];
    for (const ru of enemy.slice(0, 8)) {
      for (const dy of [0.4, 0]) {
        const q = worldToClientPx(ru.group.position.x, ru.group.position.y + dy, ru.group.position.z, s.camera, s.canvas);
        if (q) bTargets.push([q.x, q.y]);
      }
    }
    for (const nsel of [1, 0]) {
      s._lastClickModifiers = { ctrl: false, shift: false }; s._battleAwaitingOrders = false; s.roundNo = 2;
      s._selectedUnits = new Set(roster.slice(0, nsel).map((u: any) => u.bu.id));
      for (const [x, y] of bTargets) {
        blog.length = 0;
        render(s);
        s._onBattleClick(x, y);
        battleClicks.push([hx([x, y]), nsel, blog.slice()]);
      }
    }
    extra.fieldBattleClicks = battleClicks;
    s._selectedUnits = new Set();
    // deploy clicks (as in the deploy block above) + every ring's colour
    const log: unknown[] = [];
    s._applyDeployPlacement = (units: any[], a: number, b: number, c: number, d: number) => log.push(['place', units.map((u) => u.bu.id), a, b, c, d]);
    s._clearDeployGhosts = function (this: any) { log.push(['ghosts']); };
    s._showDeployFeedback = (m: string) => log.push(['feedback', m]);
    s._clearDeploySelectionState = () => log.push(['clearSel']);
    for (const k of ['_updateRosterBar', '_updateDeployToolbarSelection', '_syncDeployRosterGroupVisibility', '_updateSelectedPanel', '_renderDeployRoster', '_updateDeployToolbarStatus', '_syncGroupRegistry']) s[k] = () => {};
    s.camera.updateMatrixWorld(true);
    const tileAt = (c: number, r: number): [number, number] => { const q = worldToClientPx(c * BS.TILE_S, 0, r * BS.TILE_S, s.camera, s.canvas)!; return [q.x, q.y]; };
    const inGroup = roster.filter((u: any) => u.groupId);
    const plain = roster.filter((u: any) => !u.groupId);
    // every roster unit of this scene is in a group (`dynamics.json` deploy.groups): p0 / p1 are group members too
    const g0 = inGroup[0], g1 = inGroup[1], p0 = plain[3] ?? inGroup[5], p1 = plain[7] ?? inGroup[20];
    const plan: [[number, number], number, boolean][] = [
      [tileAt(enemy[0].q, enemy[0].r), 0, false], [tileAt(enemy[3].q, enemy[3].r), 0, false],
      [tileAt(p0.q, p0.r), 0, false], [tileAt(p0.q, p0.r), 0, false],
      [tileAt(g0.q, g0.r), 1, false], [tileAt(p1.q, p1.r), 1, false], [tileAt(g1.q, g1.r), 2, false],
      [tileAt(p0.q, p0.r), 2, false], [tileAt(g0.q, g0.r), 1, false],
      [tileAt(enemy[0].q, enemy[0].r), 0, false], [tileAt(g1.q, g1.r), 0, false], [tileAt(g1.q, g1.r), 0, false],
    ];
    const sel = (): unknown[] => [[...s._selectedUnits], s._deploySelected?.bu.id ?? null, [...s._selectionRings.entries()].map(([id, ring]: [string, any]) => [id, ring.material.color.getHex()])];
    const deployClicks: unknown[] = [];
    for (const [[x, y], mods, prefer] of plan) {
      log.length = 0;
      s._lastClickModifiers = { ctrl: (mods & 1) !== 0, shift: (mods & 2) !== 0 };
      render(s);
      s._onDeployClick(x, y, prefer);
      deployClicks.push([hx([x, y]), mods, prefer ? 1 : 0, log.slice(), sel()]);
    }
    extra.deployClicks = { ids: [g0.bu.id, g1.bu.id, p0.bu.id, p1.bu.id, enemy[0].bu.id, enemy[3].bu.id], clicks: deployClicks };
    // pickBattleGroundTileFromMeshes on score ties ("first maximum wins", `score > bestScore`):
    // horizontal rays (direction.y = 0, so every hit has the same y) across the rows with hill
    // tiles; a ray is kept when its best score is shared by hits on different tiles (selection
    // only — the recorded tile is the web function's own result).
    {
      const tm = s.terrainMap;
      const meshes = s._battleGroundPickMeshes;
      const ties: unknown[] = [];
      const others: unknown[] = [];
      const rows = new Set<number>();
      for (let r = 0; r < BS.BF_ROWS; r++) for (let c = 0; c < BS.BF_COLS; c++) if (BS.tileTopY(tm, c, r) === BS.HILL_SUMMIT_Y) rows.add(r);
      let scanned = 0;
      for (const r of [...rows].sort((a, b) => a - b)) {
        for (const y of [0.02, 0.1, 0.18, 0.2, 0.26, 0.3, 0.34]) {
          for (const dz of [0, 0.25, -0.31]) {
            const rc = new THREE.Raycaster(new THREE.Vector3(-3, y, r * BS.TILE_S + dz), new THREE.Vector3(1, 0, 0));
            scanned++;
            const hits = rc.intersectObjects(meshes, false);
            let best = -Infinity;
            const at: number[] = [];
            for (const h of hits) {
              if (BS.battlePickMeshUpNormal(h) < 0.3) continue;
              const t = BS.clampBattleTile(Math.round(h.point.x / BS.TILE_S), Math.round(h.point.z / BS.TILE_S));
              if (!t) continue;
              const sc = -Math.abs(h.point.y - BS.tileTopY(tm, t.col, t.row)) * 10 + h.point.y;
              if (sc > best) { best = sc; at.length = 0; at.push(tcode(t)); } else if (sc === best) at.push(tcode(t));
            }
            const res = BS.pickBattleGroundTileFromMeshes(rc, tm, meshes);
            const recd = [hx([...v3(rc.ray.origin), ...v3(rc.ray.direction)]), tcode(res), hits.length];
            if (new Set(at).size > 1) { if (ties.length < 8) ties.push(recd); } else if (res && others.length < 4) others.push(recd);
          }
        }
      }
      extra.groundTies = { scanned, ties, others };
    }
    extra.deployInstanced = instancedCases(s);
  }
  out.extra = extra;
}

// ========================================================== pure helpers
out.helpers = {
  clamp: [[-1, 0], [0, -1], [0, 0], [67, 155], [68, 0], [0, 156], [-0, 3], [12.5, 7]].map(([c, r]) => { const t = BS.clampBattleTile(c!, r!); return t ? [hx([t.col, t.row])] : null; }),
  consts: hx([BS.BF_COLS, BS.BF_ROWS, BS.TILE_S, BS.ORDER_LINE_Y]),
};

const dir = process.argv[2] ?? '.';
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'picking.json'), JSON.stringify({ three: THREE.REVISION, node: process.version, ...out }));
if (VERBOSE) fs.writeFileSync(path.join(dir, 'picking-verbose.json'), JSON.stringify(verbose));
console.log(`battle3d picking poses=${(out.siege as any).poses.length + (out.deploy as any).poses.length}`);
process.exit(0);
