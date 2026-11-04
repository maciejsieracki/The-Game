// Reference-vector generator for REPIN-3D batch A5 (R-RUSTPORT-REPIN-3D-A5-Q1): picking and the
// camera against the NEW scene elements of the current web — the palisade (`kind: 'palisada'`),
// the wall towers of `_placeSiegeTowers` and `fortKind` (`cityFortificationKind(builtBuildingIds)`).
//
// Runs the REAL web code of `origin/main` (`git archive <sha> gra/src gra/data`, three@0.169.0,
// esbuild@0.24.0, node v22.22.0), bundled UNCHANGED by `tests/fixtures/battle3d/build_picking.mjs`
// (`node build_picking.mjs gen_a5`; part-5 bundler, appended `export { ... }` line only).
// Hashing, the scene DTO (`unitDto`, `rle`, `terrainDto`, spawn instrumentation), the fake canvas,
// the inert renderer size, `render`, `camNums` / `camSig` and `pickRay` are copied VERBATIM from
// `tests/fixtures/battle3d/gen_picking.ts` (part 5); `pickRay` is extended by two recursive
// `intersectObjects` that the web pickers do NOT run — over the tower clones and over
// `siegeWallGroup` — to measure whether those elements lie on the ray (and therefore would occlude
// a unit / a tile if the pickers looked at them). The web pickers' target lists are
// `_battleGroundPickMeshes` (ground) and the live unit groups only (`battleScene.ts:10823-10840`,
// `:11471-11498`, `:18150-18175`).
//
// Cases: `none` (builtBuildingIds [] → no tower, civ wall), `palisada`, `mury` (siege `oblezenie`,
// civ `rzym`). Per case: the DTO + `fort` record (kind, tower material, rows, root index of every
// tower clone), then poses on a 1280×720 canvas at (13, 7):
//   - `gate`: camera on the gate (target wallCol·TILE_S − 3, gateRow·TILE_S; dist 9): a 12×8 grid
//     of client pixels, one ray at every unit (`worldToClientPx` of its group + 0.5 up), rays at the
//     gate tile and its neighbours (row N−1 / N / N+1, wall column and the one in front);
//   - `tower<i>` for the first, the middle and the last tower: camera on the tower (dist 12),
//     rays at the tower clone (base, +1, +3 up) and at the wall tiles of rows N−1 / N / N+1 of the
//     tower row, wall column and the column in front of it;
//   - `edges` (camera of `gate`): client x / y at left − 1, left, left + 1, right − 1, right,
//     right + 1 (and the same for top / bottom), then NaN / ±Infinity coordinates;
//   - `relief` (camera of `gate`): the 12×8 grid again after 28 tiles in front of the gate were
//     made river / hills / plains WITHOUT rebuilding the ground meshes (as part 5 `siege.relief`),
//     so the mesh pick and the plane pick disagree and `tileTopY` decides (both directions).
// Every client coordinate is stored as binary64 hex (NaN-safe); every ray record is
// `[ground, fromMeshes, fromPlane, unit, nGround, nUnit, nTower, nWall]` and its hit details go
// into the pose FNV (`sig`).
//
// Usage: node gen_a5.mjs <out-dir>

import './dom_stub';
import * as THREE from 'three';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as BS from '../websrc/gra/src/battle/battleScene';
import { worldToClientPx } from '../websrc/gra/src/input/picker';
import { buildTestArmies } from '../websrc/gra/src/battle/testBattle';
import { generateBattleTerrain, presetForWorldTerrain } from '../websrc/gra/src/battle/battle-terrain';
import { towerMaterialFor } from '../websrc/gra/src/game/city-towers';
import unitsJson from '../websrc/gra/data/units.json';

// ------------------------------------------------------------- hashing (= gen_picking.ts)
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

// ------------------------------------------------------------- DTO of the scene (= gen_picking.ts)
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
(globalThis as any).requestAnimationFrame = () => 0;

const UNITS = unitsJson as any[];
function build(preset: string, siege: any): { s: any; rec: Record<string, unknown> } {
  const a = buildTestArmies(UNITS, preset as any);
  spawnSnap = null; moveLog = [];
  const s: any = new BS.BattleScene({ attacker: a.attacker, defender: a.defender, teren: a.teren, siege, deploy: false } as any);
  const rec = { preset, teren: a.teren, siege, deploy: null, player: s._playerControlSide(), desert: s._desertPalette, tilesRle: rle(terrainDto(a.teren)), spawn: spawnSnap, moves: moveLog };
  moveLog = null;
  return { s, rec };
}

// ------------------------------------------------------------- canvas, renderer, render (= gen_picking.ts)
type Rect = { w: number; h: number; left: number; top: number };
function setCanvas(s: any, r: Rect): void {
  s.canvas = {
    clientWidth: r.w, clientHeight: r.h, style: {},
    getBoundingClientRect: () => ({ left: r.left, top: r.top, width: r.w, height: r.h, right: r.left + r.w, bottom: r.top + r.h, x: r.left, y: r.top }),
    addEventListener() {}, removeEventListener() {},
  };
}
function installRenderer(s: any): void {
  let rw = 300, rh = 150;
  s.renderer.getSize = (t: THREE.Vector2) => t.set(rw, rh);
  s.renderer.setSize = (w: number, h: number) => { rw = w; rh = h; };
  s.__rsize = () => [rw, rh];
}
function render(s: any): void { s.scene.updateMatrixWorld(); if (s.camera.parent === null) s.camera.updateMatrixWorld(); }
function camNums(s: any): number[] {
  const c = s.camera as THREE.PerspectiveCamera;
  return [...v3(s.camTarget), s.camDist, s.camDistTarget, s.camDistMin, s.camDistMax, ...v3(c.position),
    c.quaternion.x, c.quaternion.y, c.quaternion.z, c.quaternion.w, c.rotation.x, c.rotation.y, c.rotation.z, c.aspect,
    ...c.matrixWorld.elements, ...c.matrixWorldInverse.elements, ...c.projectionMatrix.elements, ...c.projectionMatrixInverse.elements];
}
function camSig(s: any): number { const f = new Fnv(); for (const v of camNums(s)) f.f64(v); return f.h >>> 0; }

// ------------------------------------------------------------- picking records (gen_picking.ts + towers / wall)
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
const towerMeshes = (s: any): THREE.Object3D[] => (s.siegeTowers as { mesh: THREE.Object3D | null }[]).filter((t) => t.mesh).map((t) => t.mesh!);

/** One client pixel: [ground, fromMeshes, fromPlane, unit, nGround, nUnit, nTower, nWall]. */
function pickRay(s: any, idx: Map<THREE.Object3D, number>, cx: number, cy: number, f: Fnv): number[] {
  const rc: THREE.Raycaster | null = s._raycastFromCanvas(cx, cy);
  if (!rc) { f.u32(0xdead); return [tcode(s._pickGroundTile(cx, cy)), -1, -1, unitIndex(s, s._pickUnitAtScreen(cx, cy)), -1, -1, -1, -1]; }
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
  // NOT part of any web picker: what of the towers / the wall lies on this ray.
  const th = rc.intersectObjects(towerMeshes(s), true);
  f.u32(th.length);
  for (const h of th) { f.f64(h.distance); for (const v of v3(h.point)) f.f64(v); f.u32(idx.get(h.object)!); }
  const wh = s.siegeWallGroup ? rc.intersectObject(s.siegeWallGroup, true) : [];
  f.u32(wh.length);
  for (const h of wh) { f.f64(h.distance); for (const v of v3(h.point)) f.f64(v); f.u32(idx.get(h.object)!); }
  const ground: Tile = s._pickGroundTile(cx, cy);
  const unit = unitIndex(s, s._pickUnitAtScreen(cx, cy));
  return [tcode(ground), tcode(fromMeshes), tcode(fromPlane), unit, gh.length, uh.length, th.length, s.siegeWallGroup ? wh.length : -1];
}

function setCam(s: any, x: number, z: number, dist: number): void {
  s.camTarget.set(x, 0, z); s.camDist = dist; s.camDistTarget = dist; s._applyCamera();
}

/** Rays at the client pixels `pts` (hex-stored); `null` for a world point `worldToClientPx` rejects. */
function rays(s: any, idx: Map<THREE.Object3D, number>, pts: ([number, number] | null)[], f: Fnv): unknown[] {
  return pts.map((p) => (p ? [hx(p), ...pickRay(s, idx, p[0], p[1], f)] : null));
}
function px(s: any, p: [number, number, number]): [number, number] | null {
  s.camera.updateMatrixWorld(true);
  const r = worldToClientPx(p[0], p[1], p[2], s.camera, s.canvas);
  return r ? [r.x, r.y] : null;
}
/** Tile centres (wall column and the one in front) of rows N−1, N, N+1. */
function tilePts(s: any, wallCol: number, row: number): ([number, number] | null)[] {
  const out: ([number, number] | null)[] = [];
  for (const col of [wallCol - 1, wallCol]) for (const r of [row - 1, row, row + 1]) {
    const c = BS.cellToWorld(col, r);
    out.push(px(s, [c.x, BS.tileTopY(s.terrainMap, col, r), c.z]));
  }
  return out;
}

// ------------------------------------------------------------- run
const out: Record<string, unknown> = {};
const RECT: Rect = { w: 1280, h: 720, left: 13, top: 7 };
const CASES: { id: string; siege: any }[] = [
  { id: 'none', siege: { civ: 'rzym', builtBuildingIds: [] } },
  { id: 'palisada', siege: { civ: 'rzym', builtBuildingIds: ['palisada'] } },
  { id: 'mury', siege: { civ: 'rzym', builtBuildingIds: ['mury'] } },
];
const cases: unknown[] = [];
let nRays = 0, nTowerHitRays = 0, nWallHitRays = 0;
const count = (rs: unknown[]): void => {
  for (const r of rs as (unknown[] | null)[]) {
    if (!r) continue;
    nRays++;
    if ((r[7] as number) > 0) nTowerHitRays++;
    if ((r[8] as number) > 0) nWallHitRays++;
  }
};
for (const cs of CASES) {
  const { s, rec } = build('oblezenie', cs.siege);
  installRenderer(s);
  setCanvas(s, RECT);
  s._syncRendererSize();
  render(s);
  const towers = s.siegeTowers as { row: number; mesh: THREE.Object3D | null; destroyed: boolean }[];
  const fort = {
    kind: s.fortKind, material: towerMaterialFor(s.fortKind),
    towers: towers.map((t) => ({ row: t.row, index: t.mesh ? s.scene.children.indexOf(t.mesh) : -1 })),
  };
  const wallCol = s.siegeWallCol as number;
  const gateRow = s.siegeGateRow as number;
  const occ = [...s.occByKey.entries()].map(([k, u]: [string, any]) => [k, u.bu.id]);
  const poses: Record<string, unknown>[] = [];
  // gate
  {
    setCam(s, wallCol * BS.TILE_S - 3, gateRow * BS.TILE_S, 9);
    render(s);
    const idx = sceneIndex(s);
    const f = new Fnv();
    const grid: unknown[] = [];
    for (let j = 0; j < 8; j++) for (let i = 0; i < 12; i++) {
      const cx = RECT.left + (i * RECT.w) / 12 + 0.37 * ((j % 3) + 1);
      const cy = RECT.top + (j * RECT.h) / 8 + 0.61 * ((i % 2) + 1);
      grid.push([hx([cx, cy]), ...pickRay(s, idx, cx, cy, f)]);
    }
    const aimed = rays(s, idx, [...s.atk, ...s.def].map((ru: any) => px(s, [ru.group.position.x, ru.group.position.y + 0.5, ru.group.position.z])), f);
    const gate = rays(s, idx, tilePts(s, wallCol, gateRow), f);
    count(grid); count(aimed); count(gate);
    poses.push({ name: 'gate', cam: camSig(s), grid, aimed, gate, sig: f.h >>> 0 });
  }
  // towers: first, middle, last
  const pick = towers.length === 0 ? [] : [...new Set([0, Math.floor(towers.length / 2), towers.length - 1])];
  for (const ti of pick) {
    const t = towers[ti]!;
    const m = t.mesh!;
    setCam(s, m.position.x, m.position.z, 12);
    render(s);
    const idx = sceneIndex(s);
    const f = new Fnv();
    const tower = rays(s, idx, [0, 1, 3].map((dy) => px(s, [m.position.x, m.position.y + dy, m.position.z])), f);
    const tiles = rays(s, idx, tilePts(s, wallCol, t.row), f);
    count(tower); count(tiles);
    poses.push({ name: 'tower' + ti, tower: ti, target: hx([m.position.x, m.position.z]), cam: camSig(s), rays: tower, tiles, sig: f.h >>> 0 });
  }
  // edges and non-finite coordinates (camera of `gate`)
  {
    setCam(s, wallCol * BS.TILE_S - 3, gateRow * BS.TILE_S, 9);
    render(s);
    const idx = sceneIndex(s);
    const f = new Fnv();
    const xs = [RECT.left - 1, RECT.left, RECT.left + 1, RECT.left + RECT.w - 1, RECT.left + RECT.w, RECT.left + RECT.w + 1];
    const ys = [RECT.top - 1, RECT.top, RECT.top + 1, RECT.top + RECT.h - 1, RECT.top + RECT.h, RECT.top + RECT.h + 1];
    const midX = RECT.left + RECT.w / 2, midY = RECT.top + RECT.h / 2;
    const pts: [number, number][] = [
      ...xs.map((x) => [x, midY] as [number, number]), ...ys.map((y) => [midX, y] as [number, number]),
      [xs[0]!, ys[0]!], [xs[5]!, ys[5]!],
      [NaN, midY], [midX, NaN], [NaN, NaN], [Infinity, midY], [-Infinity, midY], [midX, Infinity], [midX, -Infinity],
    ];
    const edge = rays(s, idx, pts, f);
    count(edge);
    poses.push({ name: 'edges', cam: camSig(s), rays: edge, sig: f.h >>> 0 });
  }
  // relief in front of the gate (tile kinds changed WITHOUT rebuilding the ground meshes, as
  // part 5 `siege.relief`): mesh pick and plane pick disagree, `tileTopY` decides (camera of `gate`)
  {
    const relief: [number, number, number][] = [];
    // rows gateRow−3 … gateRow+3, columns wallCol−4 … wallCol−1: river (3) on even row offsets,
    // hills (2) in the farthest column, plains (0) elsewhere — the plane pick can end on a lower
    // (river) or a higher (hill) tile than the mesh pick
    for (let dc = 1; dc <= 4; dc++) for (let dr = -3; dr <= 3; dr++) relief.push([wallCol - dc, gateRow + dr, dr % 2 === 0 ? 3 : dc === 4 ? 2 : 0]);
    for (const [col, row, k] of relief) s.terrainMap.tiles[row * BS.BF_COLS + col] = k;
    setCam(s, wallCol * BS.TILE_S - 3, gateRow * BS.TILE_S, 9);
    render(s);
    const idx = sceneIndex(s);
    const f = new Fnv();
    const grid: unknown[] = [];
    for (let j = 0; j < 8; j++) for (let i = 0; i < 12; i++) {
      const cx = RECT.left + (i * RECT.w) / 12 + 0.37 * ((j % 3) + 1);
      const cy = RECT.top + (j * RECT.h) / 8 + 0.61 * ((i % 2) + 1);
      grid.push([hx([cx, cy]), ...pickRay(s, idx, cx, cy, f)]);
    }
    // rays at y = 0 near the tile borders (±0.45 along z, +0.45 along x) of every changed tile:
    // where the plane iterations step onto the neighbour
    const near: ([number, number] | null)[] = [];
    for (const [col, row] of relief) {
      const c = BS.cellToWorld(col, row);
      for (const [dx, dz] of [[0, 0.45], [0, -0.45], [0.45, 0]]) near.push(px(s, [c.x + dx!, 0, c.z + dz!]));
    }
    const nearRays = rays(s, idx, near, f);
    count(grid); count(nearRays);
    poses.push({ name: 'relief', relief, cam: camSig(s), rays: grid, near: nearRays, sig: f.h >>> 0 });
  }
  cases.push({ id: cs.id, rec, fort, wallCol, gateRow, occ, poses });
}
out.three = THREE.REVISION;
out.node = process.version;
out.rect = [RECT.w, RECT.h, RECT.left, RECT.top];
out.cases = cases;
out.counts = { rays: nRays, towerHitRays: nTowerHitRays, wallHitRays: nWallHitRays };
const dir = process.argv[2] ?? '.';
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'a5.json'), JSON.stringify(out));
console.log(`repin3d a5 cases=${cases.length} rays=${nRays} towerHitRays=${nTowerHitRays} wallHitRays=${nWallHitRays}`);
