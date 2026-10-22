// Reference-vector generator for MOD-13 "misc" (R-RUSTPORT-P4-22-MOD13-MISC-Q1).
//
// Runs the REAL web code of `edb8fb56` (`git archive edb8fb56 gra/src gra/data`,
// three@0.169.0, esbuild@0.24.0, node v22.22.0) and records what it builds:
//   - render/wioska-oboz.ts       buildWioska, buildObozBarbarzyncow
//   - render/siegeCampModels.ts   makeSiegeSoldiers, makeSiegeRam, makeSiegeTower, buildSiegeCampGroup
//   - render/siegeMarker.ts       SiegeMarkerRenderer (sync / pulse; scene graph without WebGL)
//   - render/siegeCampSync.ts     readyMachinesForCity, machinesByCampHex, campOwnerByHex
//   - render/robloxCity.ts        addRobloxSkyDecor (only; buildRobloxCity/RomeCity = D-MOD-2)
//   - render/rangeOverlay.ts      buildRangeOverlayGroup, buildTerritoryBorderGroup (+ map/territory-border.ts)
//   - render/tradeRoutesOverlay.ts buildTradeRoutesOverlayGroup
//
// No WebGL renderer: builders return THREE object graphs, the generator calls
// `updateMatrixWorld(true)` and reads them. `document` does not exist in node:
// `siegeMarker.ts` draws its sprite glyph on a canvas, so a recording stub
// canvas is installed below (it records the draw calls; the texture pixels are
// NOT reproduced — rasterisation is D-MOD-6 / RR text, see README.md).
//
// Usage: node gen.mjs <out-dir>   (bundle produced by build.mjs)

import * as THREE from 'three';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { buildWioska, buildObozBarbarzyncow, BARB_FACTION_COLOR, WIOSKA_OBOZ_LAYOUT } from '../websrc/gra/src/render/wioska-oboz';
import {
  makeSiegeSoldiers, makeSiegeRam, makeSiegeTower, buildSiegeCampGroup, DEFAULT_SIEGE_ATTACKER_COLOR,
} from '../websrc/gra/src/render/siegeCampModels';
import { SiegeMarkerRenderer } from '../websrc/gra/src/render/siegeMarker';
import { readyMachinesForCity, machinesByCampHex, campOwnerByHex } from '../websrc/gra/src/render/siegeCampSync';
import { addRobloxSkyDecor } from '../websrc/gra/src/render/robloxCity';
import {
  buildRangeOverlayGroup, buildTerritoryBorderGroup, CULTURE_RANGE_STYLE, RELIGION_RANGE_STYLE,
  MINE_ELIGIBLE_STYLE, type RangeOverlayStyle,
} from '../websrc/gra/src/render/rangeOverlay';
import { computeTerritoryBorderLoops } from '../websrc/gra/src/map/territory-border';
import { buildTradeRoutesOverlayGroup, type TradeRouteOverlayInput } from '../websrc/gra/src/render/tradeRoutesOverlay';
import { axialToWorld, HEX_R } from '../websrc/gra/src/render/hexutil';
import { TerenBazowy } from '../websrc/gra/src/types/hex';

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

/** Same byte stream as `geo_hash` in `src/models/unit_core/model.rs`. */
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

type AnyMat = THREE.Material & {
  color?: THREE.Color; flatShading?: boolean; map?: THREE.Texture | null;
};

function matRec(m: AnyMat): Record<string, unknown> {
  const c = m.color ?? new THREE.Color(0xffffff);
  return {
    t: m.type,
    color: c.getHex(),
    lin: hx([c.r, c.g, c.b]),
    flat: m.flatShading ?? false,
    transparent: m.transparent,
    opacity: hx([m.opacity]),
    dw: m.depthWrite,
    dt: m.depthTest,
    side: m.side,
    po: m.polygonOffset,
    pof: hx([m.polygonOffsetFactor]),
    pou: hx([m.polygonOffsetUnits]),
    map: m.map ? true : false,
  };
}

function geoRec(g: THREE.BufferGeometry): Record<string, unknown> {
  return {
    t: g.type,
    vtx: g.getAttribute('position').count,
    tri: triCount(g),
    hash: geoHash(g),
  };
}

function kindOf(o: THREE.Object3D): string {
  if ((o as THREE.Scene).isScene) return 'Scene';
  if ((o as THREE.InstancedMesh).isInstancedMesh) return 'InstancedMesh';
  if ((o as THREE.Mesh).isMesh) return 'Mesh';
  if ((o as THREE.Sprite).isSprite) return 'Sprite';
  if ((o as THREE.LineSegments).isLineSegments) return 'LineSegments';
  if ((o as THREE.Line).isLine) return 'Line';
  if ((o as THREE.Group).isGroup) return 'Group';
  return 'Object3D';
}

/**
 * Full object tree in traverse order + model summary. `bbox` = min/max over
 * every Mesh vertex transformed by matrixWorld (sprites/lines excluded).
 * `sig` = FNV over (geoHash, material, matrixWorld) of every Mesh.
 */
function treeRecord(root: THREE.Object3D): Record<string, unknown> {
  root.updateMatrixWorld(true);
  const nodes: unknown[] = [];
  const index = new Map<THREE.Object3D, number>();
  const lo = [Infinity, Infinity, Infinity];
  const hi = [-Infinity, -Infinity, -Infinity];
  const f = new Fnv();
  let meshes = 0;
  let tris = 0;
  const v = new THREE.Vector3();
  root.traverse((o) => {
    index.set(o, nodes.length);
    const k = kindOf(o);
    const rec: Record<string, unknown> = {
      k,
      name: o.name,
      parent: o.parent && index.has(o.parent) ? index.get(o.parent) : -1,
      p: hx([o.position.x, o.position.y, o.position.z]),
      q: hx([o.quaternion.x, o.quaternion.y, o.quaternion.z, o.quaternion.w]),
      s: hx([o.scale.x, o.scale.y, o.scale.z]),
      w: hx(o.matrixWorld.elements),
      cs: o.castShadow,
      rs: o.receiveShadow,
      ro: o.renderOrder,
    };
    if (k === 'Mesh' || k === 'Sprite') {
      const m = o as THREE.Mesh;
      rec.mat = matRec(m.material as AnyMat);
      if (k === 'Mesh') {
        rec.geo = geoRec(m.geometry);
        meshes++;
        tris += triCount(m.geometry);
        f.u32(geoHash(m.geometry));
        const mt = m.material as AnyMat;
        f.u32(mt.color!.getHex());
        f.byte(mt.flatShading ? 1 : 0);
        f.byte(mt.transparent ? 1 : 0);
        f.f64(mt.opacity);
        for (const e of m.matrixWorld.elements) f.f64(e);
        const pos = m.geometry.getAttribute('position');
        for (let i = 0; i < pos.count; i++) {
          v.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld);
          lo[0] = Math.min(lo[0]!, v.x); lo[1] = Math.min(lo[1]!, v.y); lo[2] = Math.min(lo[2]!, v.z);
          hi[0] = Math.max(hi[0]!, v.x); hi[1] = Math.max(hi[1]!, v.y); hi[2] = Math.max(hi[2]!, v.z);
        }
      }
    }
    nodes.push(rec);
  });
  f.u32(meshes);
  return { nodes, meshes, tris, sig: f.h >>> 0, bbox: hx([...lo, ...hi]) };
}

// ------------------------------------------------------------- models
const models: Record<string, unknown>[] = [];
function addModel(id: string, args: unknown, root: THREE.Object3D): void {
  models.push({ id, args, ...treeRecord(root) });
}

addModel('wioska', {}, buildWioska());
addModel('oboz', { color: null }, buildObozBarbarzyncow());
for (const c of [0x1e5aa8, 0xff00ff00, 0x000000, 0xffffff]) {
  addModel('oboz', { color: c }, buildObozBarbarzyncow(c));
}
for (const [count, color] of [[0, 0xc42020], [1, 0xc42020], [4, 0x2a6fdb], [5, 0x55aa11]] as const) {
  addModel('soldiers', { count, color }, makeSiegeSoldiers(count, color));
}
addModel('ram', {}, makeSiegeRam());
addModel('tower', {}, makeSiegeTower());

type Kind = 'taran' | 'wieza';
const campCases: { color: number; machines: Kind[] | null; fx: number; fz: number }[] = [];
for (const [fx, fz] of [[1, 0], [0, 1], [-1, 1], [1, -1], [0, 0], [-1, 0], [0, -1], [2, -1], [-0.5, 3.25]]) {
  campCases.push({ color: DEFAULT_SIEGE_ATTACKER_COLOR, machines: null, fx: fx!, fz: fz! });
}
for (const machines of [[], ['taran'], ['wieza'], ['wieza', 'taran', 'wieza'], ['taran', 'taran']] as Kind[][]) {
  campCases.push({ color: 0x2a6fdb, machines, fx: 1, fz: -1 });
}
for (const color of [0xffffff, 0x010101, 0x123456, 0xfe0000]) {
  campCases.push({ color, machines: ['taran'], fx: -1, fz: 1 });
}
for (const c of campCases) {
  addModel('camp', c, buildSiegeCampGroup({
    attackerColor: c.color,
    readyMachines: c.machines ?? undefined,
    faceDirX: c.fx,
    faceDirZ: c.fz,
  }));
}

for (const [cx, cz, span, lite] of [
  [0, 0, 10, false], [12.5, -7.25, 48, true], [-30, 64, 160, false], [0, 0, 0, true],
] as const) {
  const scene = new THREE.Scene();
  addRobloxSkyDecor(scene, cx, cz, span, lite);
  addModel('sky', { cx, cz, span, lite }, scene);
}

// ------------------------------------------------------------- siegeCampSync
const sync: Record<string, unknown>[] = [];
sync.push({ fn: 'ready', input: null, out: readyMachinesForCity({}) });
sync.push({ fn: 'ready', input: ['taran', 'wieza'], out: readyMachinesForCity({ siegeMachines: { ready: ['taran', 'wieza'] } }) });
for (const [hexes, ready] of [
  [[], ['taran']],
  [['1,2'], []],
  [['1,2', '3,-4'], ['taran', 'wieza', 'wieza']],
  [['0,0', '5,5', '0,0'], ['wieza', 'taran', 'taran', 'wieza', 'taran']],
] as [string[], Kind[]][]) {
  sync.push({ fn: 'machines', hexes, ready, out: [...machinesByCampHex(hexes, ready).entries()] });
}
{
  const units = [
    { q: 1, r: 2, ownerId: 7 }, { q: 1, r: 2, ownerId: 3 }, { q: 3, r: -4, ownerId: 7 },
    { q: 3, r: -4, ownerId: 9 }, { q: 0, r: 0, ownerId: 5 }, { q: 10, r: 1, ownerId: 2 },
  ];
  const keyOf = (q: number, r: number) => `${q},${r}`;
  for (const [hexes, cityOwner] of [
    [['1,2', '3,-4', '0,0', '10,1', 'x,1', '1,2,3', ' 3,-4', '3abc,-4', '9,9', '+3,-4', '\t1,2', '\u00a00,0', '-,1', '+10, 1'], 7],
    [['1,2', '3,-4', '0,0'], 5],
  ] as [string[], number][]) {
    sync.push({ fn: 'owners', hexes, units, cityOwner, out: [...campOwnerByHex(hexes, units, keyOf, cityOwner).entries()] });
  }
}

// ------------------------------------------------------------- siege marker
// Recording canvas stub (node has no DOM).
const canvasLog: unknown[] = [];
(globalThis as { document?: unknown }).document = {
  createElement(tag: string) {
    const c: Record<string, unknown> = { tag, width: 0, height: 0 };
    c.getContext = () => new Proxy({}, {
      get(_t, prop) {
        return (...a: unknown[]) => { canvasLog.push({ call: String(prop), args: a }); };
      },
      set(_t, prop, value) { canvasLog.push({ set: String(prop), value, w: c.width, h: c.height }); return true; },
    });
    return c;
  },
};

const getTopY = (q: number, r: number): number => 0.3 + 0.01 * q - 0.007 * r;
const markerSteps: Record<string, unknown>[] = [];
{
  const scene = new THREE.Scene();
  const rendererM = new SiegeMarkerRenderer(scene, {} as never);
  const steps: { ids: string[]; pos: [string, number, number][]; camps: [string, string[]][]; machines: [string, Kind[]][]; colors: [number, number][]; owners: [string, number][]; pulse: number | null }[] = [
    {
      ids: ['c1', 'c2', 'c3'],
      pos: [['c1', 2, -1], ['c2', -3, 4]],
      camps: [['c1', ['3,-1', '2,0', 'bad', '1,-1']], ['c2', ['-2,4']]],
      machines: [['3,-1', ['taran', 'wieza']], ['2,0', ['wieza']]],
      colors: [[4, 0x2a6fdb], [0, 0x00ff00]],
      owners: [['3,-1', 4], ['-2,4', 8]],
      pulse: 1.7,
    },
    {
      ids: ['c2', 'c4'],
      pos: [['c1', 2, -1], ['c2', -3, 5], ['c4', 0, 0]],
      camps: [['c2', ['-2,5', '-3,6']], ['c4', []]],
      machines: [],
      colors: [],
      owners: [],
      pulse: 0.25,
    },
    {
      ids: ['c4', 'c1'],
      pos: [['c1', 2, -1], ['c4', 0, 0]],
      camps: [['c1', ['3,-1']]],
      machines: [['3,-1', ['wieza', 'wieza', 'taran']]],
      colors: [[4, 0x2a6fdb]],
      owners: [['3,-1', 4]],
      pulse: null,
    },
    { ids: [], pos: [], camps: [], machines: [], colors: [], owners: [], pulse: 3.0 },
  ];
  for (const st of steps) {
    rendererM.sync(new Set(st.ids), new Map(st.pos.map(([id, q, r]) => [id, { q, r }])), {
      getTopY,
      campHexesByCity: new Map(st.camps),
      machinesByCampHex: new Map(st.machines),
      ownerColorById: new Map(st.colors),
      campOwnerByHex: new Map(st.owners),
    });
    if (st.pulse !== null) rendererM.pulse(st.pulse);
    markerSteps.push({ step: st, ...treeRecord(scene) });
  }
}

// ------------------------------------------------------------- overlay map
const TERRAINS = [
  TerenBazowy.Laka, TerenBazowy.Rownina, TerenBazowy.Wzgorza, TerenBazowy.Gory,
  TerenBazowy.PlytkieMorze, TerenBazowy.Morze, TerenBazowy.Pustynia, TerenBazowy.Polarny,
];
const FLAT = [TerenBazowy.Laka, TerenBazowy.Rownina, TerenBazowy.PlytkieMorze, TerenBazowy.Morze, TerenBazowy.Pustynia, TerenBazowy.Polarny];

interface MiniMap { hexes: Record<string, { coords: { q: number; r: number }; terenBazowy: TerenBazowy }>; seed?: number }
function makeMap(flat: boolean, seed: number | undefined): { map: MiniMap; list: [number, number, string][] } {
  const hexes: MiniMap['hexes'] = {};
  const list: [number, number, string][] = [];
  for (let q = -9; q <= 9; q++) {
    for (let r = -9; r <= 9; r++) {
      if (((q * 7 + r * 3) % 11 + 11) % 11 === 0 && Math.abs(q) + Math.abs(r) > 2) continue; // holes
      const h = ((q * 5 + r * 11 + 100) % 8 + 8) % 8;
      const t = flat ? FLAT[h % FLAT.length]! : TERRAINS[h]!;
      hexes[`${q},${r}`] = { coords: { q, r }, terenBazowy: t };
      list.push([q, r, t]);
    }
  }
  return { map: seed === undefined ? { hexes } : { hexes, seed }, list };
}
const maps = {
  mixed: makeMap(false, 12345),
  flat: makeMap(true, 777),
  noseed: makeMap(false, undefined),
};

type K = [number, number];
const keyStr = (k: K) => `${k[0]},${k[1]}`;
function disk(c: K, n: number): K[] {
  const out: K[] = [];
  for (let dq = -n; dq <= n; dq++) {
    for (let dr = Math.max(-n, -dq - n); dr <= Math.min(n, -dq + n); dr++) out.push([c[0] + dq, c[1] + dr]);
  }
  return out;
}
function ring(c: K, n: number): K[] {
  return disk(c, n).filter(([q, r]) => {
    const dq = q - c[0], dr = r - c[1];
    return Math.max(Math.abs(dq), Math.abs(dr), Math.abs(dq + dr)) === n;
  });
}
function grow(seed: number, n: number): K[] {
  let s = seed >>> 0;
  const rnd = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
  const set = new Map<string, K>([['0,0', [0, 0]]]);
  const DIRS: K[] = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
  while (set.size < n) {
    const arr = [...set.values()];
    const b = arr[Math.floor(rnd() * arr.length)]!;
    const d = DIRS[Math.floor(rnd() * 6)]!;
    const k: K = [b[0] + d[0], b[1] + d[1]];
    if (!set.has(keyStr(k))) set.set(keyStr(k), k);
  }
  return [...set.values()];
}

const hexSets: Record<string, K[]> = {};
for (let n = 0; n <= 4; n++) hexSets[`disk0_${n}`] = disk([0, 0], n);
for (let n = 1; n <= 3; n++) hexSets[`disk_3_-2_${n}`] = disk([3, -2], n);
hexSets.line2 = [[0, 0], [1, 0]];
hexSets.ring1 = ring([0, 0], 1);
hexSets.ring2 = ring([1, 1], 2);
hexSets.islands = [...disk([-4, 0], 1), [4, 1], [5, 1]];
hexSets.lshape = [[0, 0], [1, 0], [2, 0], [3, 0], [3, -1], [3, -2], [3, -3], [-1, 1], [-2, 2]];
hexSets.corner = [[0, 0], [1, 1], [2, -1]];
hexSets.missing = [[0, 0], [1, 0], [11, 0], [12, 0], [-30, 2], [2, 2]];
hexSets.grow25 = grow(42, 25);
hexSets.grow40 = grow(7, 40);
hexSets.empty = [];

const BANDED: RangeOverlayStyle = {
  tintColor: 0x123456, tintOpacity: 0.3, borderColor: 0x654321, borderOpacity: 0.8, borderBandWidth: 0.12, yOffset: 0.07,
};
const BANDED_HUG: RangeOverlayStyle = { ...BANDED, borderBandWidth: 0.2, hugTerrainRelief: true };
const NO_Y: RangeOverlayStyle = { tintColor: 0xabcdef, tintOpacity: 0.5, borderColor: 0x00ff00, borderOpacity: 1 };
const STYLES: Record<string, RangeOverlayStyle> = {
  culture: CULTURE_RANGE_STYLE, religion: RELIGION_RANGE_STYLE, mine: MINE_ELIGIBLE_STYLE,
  banded: BANDED, bandedHug: BANDED_HUG, noY: NO_Y,
};

function overlayRecord(group: THREE.Group): Record<string, unknown> {
  group.updateMatrixWorld(true);
  const objects: unknown[] = [];
  for (const o of group.children) {
    const k = kindOf(o);
    const m = o as THREE.Mesh;
    const g = m.geometry;
    g.computeBoundingBox();
    const bb = g.boundingBox!;
    const pos = g.getAttribute('position').array as Float32Array;
    const rec: Record<string, unknown> = {
      k,
      name: o.name,
      ro: o.renderOrder,
      fc: o.frustumCulled,
      mat: matRec(m.material as AnyMat),
      geo: {
        ...geoRec(g),
        idx: g.index ? g.index.count : -1,
        nor: g.getAttribute('normal') ? true : false,
        bbox: hx([bb.min.x, bb.min.y, bb.min.z, bb.max.x, bb.max.y, bb.max.z]),
        pos: pos.length <= 900 ? hx(pos) : null,
      },
    };
    if (k === 'InstancedMesh') {
      const im = o as THREE.InstancedMesh;
      rec.count = im.count;
      rec.inst = hx(im.instanceMatrix.array as Float32Array);
    }
    if (Object.keys(o.userData).length > 0) rec.ud = o.userData;
    objects.push(rec);
  }
  return { name: group.name, objects };
}

const range: Record<string, unknown>[] = [];
const g = globalThis as { __MISC_RELIEF?: string };
for (const [mapId, relief] of [['flat', 'real'], ['mixed', 'analytic'], ['noseed', 'analytic']] as const) {
  g.__MISC_RELIEF = relief;
  const map = maps[mapId].map;
  for (const [setId, keys] of Object.entries(hexSets)) {
    for (const [styleId, style] of Object.entries(STYLES)) {
      if (mapId === 'noseed' && !style.hugTerrainRelief) continue;
      const set = new Set(keys.map(keyStr));
      range.push({ map: mapId, relief, set: setId, style: styleId, ...overlayRecord(buildRangeOverlayGroup(map as never, set, style)) });
    }
  }
}
g.__MISC_RELIEF = 'real';

// Style constants as the web defines them.
const styleConsts: Record<string, unknown> = {};
for (const [id, s] of Object.entries(STYLES)) {
  styleConsts[id] = {
    tintColor: s.tintColor, tintOpacity: hx([s.tintOpacity]), borderColor: s.borderColor,
    borderOpacity: hx([s.borderOpacity]), borderBandWidth: s.borderBandWidth === undefined ? null : hx([s.borderBandWidth]),
    yOffset: s.yOffset === undefined ? null : hx([s.yOffset]), hug: s.hugTerrainRelief ?? null,
  };
}

// ------------------------------------------------------------- territory
const loops: Record<string, unknown>[] = [];
for (const [setId, keys] of Object.entries(hexSets)) {
  const map = maps.mixed.map;
  const center = (q: number, r: number) => (map.hexes[`${q},${r}`] ? axialToWorld(q, r, HEX_R) : null);
  const ls = computeTerritoryBorderLoops(new Set(keys.map(keyStr)), center);
  loops.push({ set: setId, loops: ls.map((l) => hx(l.flatMap((p) => [p.x, p.z]))) });
}

const OWNER_COLORS: Record<number, number> = { 1: 0xd03030, 2: 0x2a6fdb, 3: 0x33aa55, 4: 0xffcc00 };
const REL_COLORS: Record<number, number> = { 1: 0x888888, 2: 0xff0000, 3: 0x00ff00, 4: 0x0000ff };
const territoryCases: { id: string; owners: [number, string][]; rel: boolean; band: number | null; opacity: number | null; relBand: number | null }[] = [
  { id: 'two', owners: [[1, 'disk0_2'], [2, 'disk_3_-2_1']], rel: false, band: null, opacity: null, relBand: null },
  { id: 'two_rel', owners: [[1, 'disk0_2'], [2, 'disk_3_-2_1']], rel: true, band: null, opacity: null, relBand: null },
  { id: 'shapes_rel', owners: [[3, 'ring2'], [1, 'lshape'], [4, 'line2'], [2, 'islands']], rel: true, band: null, opacity: null, relBand: null },
  { id: 'grow_custom', owners: [[2, 'grow25'], [3, 'corner'], [1, 'empty']], rel: true, band: 0.3, opacity: 0.55, relBand: 0.2 },
  { id: 'grow40_thin', owners: [[4, 'grow40'], [1, 'missing']], rel: true, band: 0.6, opacity: null, relBand: null },
  { id: 'zero_band', owners: [[1, 'disk0_1']], rel: true, band: 0, opacity: null, relBand: null },
  { id: 'ring1_rel', owners: [[2, 'ring1']], rel: true, band: null, opacity: null, relBand: null },
];
const territory: Record<string, unknown>[] = [];
for (const c of territoryCases) {
  const byOwner = new Map<number, Set<string>>(c.owners.map(([o, s]) => [o, new Set(hexSets[s]!.map(keyStr))]));
  const args: unknown[] = [maps.mixed.map, byOwner, (o: number) => OWNER_COLORS[o]!];
  // Pass `undefined` for omitted params so defaults apply exactly as in the web.
  args.push(c.band ?? undefined, c.opacity ?? undefined, c.rel ? (o: number) => REL_COLORS[o]! : undefined, c.relBand ?? undefined);
  const grp = (buildTerritoryBorderGroup as (...a: unknown[]) => THREE.Group)(...args);
  territory.push({ ...c, ...overlayRecord(grp) });
}

// ------------------------------------------------------------- trade routes
const routeLists: { id: string; routes: TradeRouteOverlayInput[] }[] = [
  { id: 'basic', routes: [
    { fromQ: 0, fromR: 0, toQ: 3, toR: -2, medium: 'lad' },
    { fromQ: -5, fromR: 2, toQ: 6, toR: -4, medium: 'morze' },
    { fromQ: 1, fromR: 1, toQ: 1, toR: 1, medium: 'lad' },
  ] },
  { id: 'long', routes: [
    { fromQ: 0, fromR: 0, toQ: 40, toR: -20, medium: 'morze' },
    { fromQ: -2, fromR: 5, toQ: 4, toR: 4, medium: 'lad' },
    { fromQ: 8, fromR: -8, toQ: -8, toR: 8, medium: 'lad' },
    { fromQ: 2, fromR: 2, toQ: 3, toR: 2, medium: 'morze' },
  ] },
  { id: 'empty', routes: [] },
];
const trade: Record<string, unknown>[] = [];
for (const rl of routeLists) {
  trade.push({ id: rl.id, routes: rl.routes, ...overlayRecord(buildTradeRoutesOverlayGroup(maps.mixed.map as never, rl.routes)) });
}

// three r169 QuadraticBezierCurve3.getPoints(ARC_SEGMENTS = 28) on random
// double control points: checks the Bezier evaluation in double precision
// (the route Line attribute is Float32 and would hide a 1-ulp difference).
const bezier: Record<string, unknown>[] = [];
{
  let s = 12345;
  const rnd = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return (s / 4294967296 - 0.5) * 40; };
  for (let i = 0; i < 24; i++) {
    const v = [rnd(), rnd(), rnd(), rnd(), rnd(), rnd(), rnd(), rnd(), rnd()];
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(v[0], v[1], v[2]), new THREE.Vector3(v[3], v[4], v[5]), new THREE.Vector3(v[6], v[7], v[8]),
    );
    bezier.push({ ctrl: hx(v), pts: hx(curve.getPoints(28).flatMap((p) => [p.x, p.y, p.z])) });
  }
}

// ------------------------------------------------------------- output
const outDir = process.argv[2] ?? '.';
fs.mkdirSync(outDir, { recursive: true });
const constants = {
  BARB_FACTION_COLOR, WIOSKA_OBOZ_LAYOUT, DEFAULT_SIEGE_ATTACKER_COLOR,
  wioskaRotY: hx([WIOSKA_OBOZ_LAYOUT.wioska.budynek.rotY]),
  obozRotY: hx([WIOSKA_OBOZ_LAYOUT.obozBarbarzyncow.budynek.rotY]),
};
fs.writeFileSync(path.join(outDir, 'models.json'), JSON.stringify({ constants, models }));
fs.writeFileSync(path.join(outDir, 'siege.json'), JSON.stringify({ sync, markerSteps, canvasLog }));
fs.writeFileSync(path.join(outDir, 'overlays.json'), JSON.stringify({
  maps: Object.fromEntries(Object.entries(maps).map(([id, m]) => [id, { seed: m.map.seed ?? null, hexes: m.list }])),
  hexSets, styles: styleConsts, range, loops, territory, trade, bezier,
}));
console.log(`misc models=${models.length} sync=${sync.length} markerSteps=${markerSteps.length} range=${range.length} loops=${loops.length} territory=${territory.length} trade=${trade.length}`);
