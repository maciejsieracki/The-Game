// R-RUSTPORT-P4-21-MOD09-CITIES-Q1 — generator of city-model reference vectors (MOD-09).
//
// Run ONLY outside the repository (scratch dir), see README.md. The esbuild bundle links:
//  - three@0.169.0 (npm, version pinned by gra/package-lock.json at edb8fb56),
//  - web modules from `git archive edb8fb56 gra/src gra/data`, IMPORTED UNCHANGED:
//    render/miasto-kamien.ts, render/miasto-braz.ts, render/bronzeCityRoblox.ts,
//    render/stoneCityRoblox.ts, render/stoneCity.ts (types/labels), render/settlementModel.ts,
//    render/cityMapOutline.ts, render/cities.ts (CityRenderer) and their own imports.
// No web code is copied: the generator only calls the web API and dumps the object graph
// (THREE.Group / Mesh / LineLoop, no WebGLRenderer). CityRenderer runs with
// `hideStatChips: true` and without `getRevolt` (chip + revolt sprite need a DOM canvas;
// they are MOD-10 / overlay scope).
// Output: JSON files in the directory given as argv[2].

import * as THREE from 'three';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { TerenBazowy } from '../websrc/gra/src/types/hex';
import {
  buildMiastoKamien, buildPalisadaWal, rozmiarDlaPoziomu, MIASTO_KAMIEN_LAYOUT,
} from '../websrc/gra/src/render/miasto-kamien';
import {
  buildMiastoBraz, buildMiastoBrazGrecja, buildMiastoBrazRzym, MIASTO_BRAZ_LAYOUT,
} from '../websrc/gra/src/render/miasto-braz';
import { buildBronzeCityRoblox, BRONZE_CIVS } from '../websrc/gra/src/render/bronzeCityRoblox';
import { buildStoneAgeCityRoblox } from '../websrc/gra/src/render/stoneCityRoblox';
import { STONE_CIVS, STONE_CIV_LABELS } from '../websrc/gra/src/render/stoneCity';
import { buildSettlementModel } from '../websrc/gra/src/render/settlementModel';
import { buildCityMapOutline, placeCityMapOutline } from '../websrc/gra/src/render/cityMapOutline';
import { CityRenderer } from '../websrc/gra/src/render/cities';

const OUT = process.argv[2];
if (!OUT) throw new Error('usage: node cities_gen.mjs <outdir>');
fs.mkdirSync(OUT, { recursive: true });

// ---------------------------------------------------------------------------
// Serializer: like JSON.stringify, but keeps -0 and writes NaN/±Infinity as strings.
function ser(v: any): string {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'number') {
    if (Number.isNaN(v)) return '"NaN"';
    if (v === Infinity) return '"Infinity"';
    if (v === -Infinity) return '"-Infinity"';
    return Object.is(v, -0) ? '-0' : String(v);
  }
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'string') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map(ser).join(',') + ']';
  return '{' + Object.keys(v).filter((k) => v[k] !== undefined).map((k) => JSON.stringify(k) + ':' + ser(v[k])).join(',') + '}';
}

// ---------------------------------------------------------------------------
// FNV-1a 32-bit over little-endian u32 words (f64 = low word, then high word).
const F64 = new Float64Array(1);
const U32 = new Uint32Array(F64.buffer);
class Fnv {
  h = 0x811c9dc5;
  u(v: number): void {
    for (let k = 0; k < 4; k++) {
      this.h ^= (v >>> (8 * k)) & 0xff;
      this.h = Math.imul(this.h, 0x01000193) >>> 0;
    }
  }
  d(v: number): void { F64[0] = v; this.u(U32[0]!); this.u(U32[1]!); }
  b(v: boolean): void { this.u(v ? 1 : 0); }
}

/** Geometry hash: per attribute (position, normal, uv) the f32 count and words, or
 *  0xffffffff when absent; index (1, count, values | 0); groups (count, start/count/mi). */
function geoHash(geo: THREE.BufferGeometry): number {
  const f = new Fnv();
  for (const name of ['position', 'normal', 'uv']) {
    const a = geo.getAttribute(name) as THREE.BufferAttribute | undefined;
    if (!a) { f.u(0xffffffff); continue; }
    const arr = a.array as Float32Array;
    const w = new Uint32Array(arr.buffer, arr.byteOffset, arr.length);
    f.u(arr.length);
    for (let i = 0; i < w.length; i++) f.u(w[i]!);
  }
  const idx = geo.getIndex();
  if (idx) {
    f.u(1); f.u(idx.array.length);
    for (let i = 0; i < idx.array.length; i++) f.u(idx.array[i]! >>> 0);
  } else f.u(0);
  f.u(geo.groups.length);
  for (const g of geo.groups) { f.u(g.start); f.u(g.count); f.u(g.materialIndex ?? 0); }
  return f.h >>> 0;
}

function geoDesc(geo: any): any {
  const p = geo.parameters;
  switch (geo.type) {
    case 'BoxGeometry': return { type: 'box', w: p.width, h: p.height, d: p.depth };
    case 'CylinderGeometry': return { type: 'cyl', rt: p.radiusTop, rb: p.radiusBottom, h: p.height, seg: p.radialSegments };
    case 'ConeGeometry': return { type: 'cone', r: p.radius, h: p.height, seg: p.radialSegments };
    case 'CircleGeometry': return { type: 'circle', r: p.radius, seg: p.segments };
    case 'ExtrudeGeometry': return { type: 'extrude', depth: p.options.depth, bevel: p.options.bevelEnabled };
    case 'BufferGeometry': return { type: 'buffer' };
    default: throw new Error('unexpected geometry ' + geo.type);
  }
}

function matDesc(m: any): any {
  if (m.type === 'MeshLambertMaterial') {
    return { t: 'lambert', hex: m.color.getHex(), lin: [m.color.r, m.color.g, m.color.b], flat: m.flatShading,
      side: m.side, transparent: m.transparent, opacity: m.opacity };
  }
  if (m.type === 'LineBasicMaterial') {
    return { t: 'line', hex: m.color.getHex(), lin: [m.color.r, m.color.g, m.color.b], transparent: m.transparent,
      opacity: m.opacity, depthWrite: m.depthWrite };
  }
  throw new Error('unexpected material ' + m.type);
}

function matHash(f: Fnv, m: any): void {
  f.u(m.type === 'MeshLambertMaterial' ? 1 : 2);
  f.d(m.color.r); f.d(m.color.g); f.d(m.color.b);
  f.b(m.flatShading === true);
  f.b(m.transparent); f.d(m.opacity); f.b(m.depthWrite); f.u(m.side);
}

function nodeType(o: any): number { return o.isMesh ? 2 : o.isLineLoop ? 3 : 1; }

/** Model summary: counts, bbox, materials (first-use order), one FNV over every node. */
function dumpModel(root: THREE.Object3D, detail: boolean): any {
  root.updateMatrixWorld(true);
  const mats: THREE.Material[] = [];
  const index = new Map<THREE.Object3D, number>();
  const f = new Fnv();
  const nodes: any[] = [];
  let meshes = 0, lines = 0, vertices = 0, triangles = 0, count = 0;
  root.traverse((o: any) => {
    const parent = o.parent && index.has(o.parent) ? index.get(o.parent)! : -1;
    index.set(o, count++);
    const t = nodeType(o);
    f.u(t); f.u(parent >>> 0);
    for (const v of [o.position.x, o.position.y, o.position.z, o.rotation.x, o.rotation.y, o.rotation.z,
      o.quaternion.x, o.quaternion.y, o.quaternion.z, o.quaternion.w, o.scale.x, o.scale.y, o.scale.z]) f.d(v);
    for (const v of o.matrixWorld.elements) f.d(v);
    f.b(o.castShadow); f.b(o.receiveShadow); f.b(o.visible); f.u(o.renderOrder >>> 0);
    let node: any = null;
    if (detail) {
      node = { t, parent, p: [o.position.x, o.position.y, o.position.z], r: [o.rotation.x, o.rotation.y, o.rotation.z],
        s: [o.scale.x, o.scale.y, o.scale.z], w: Array.from(o.matrixWorld.elements), cs: o.castShadow, rs: o.receiveShadow };
    }
    if (t !== 1) {
      const geo = o.geometry as THREE.BufferGeometry;
      let mi = mats.indexOf(o.material);
      if (mi < 0) { mats.push(o.material); mi = mats.length - 1; }
      const gh = geoHash(geo);
      f.u(gh); f.u(mi);
      const nv = geo.getAttribute('position').count;
      vertices += nv;
      if (t === 2) {
        meshes++;
        triangles += (geo.getIndex() ? geo.getIndex()!.count : nv) / 3;
      } else lines++;
      if (node) { node.geo = geoDesc(geo); node.mat = mi; node.nv = nv; node.gh = gh; }
    }
    if (node) nodes.push(node);
  });
  for (const m of mats) matHash(f, m);
  const bb = new THREE.Box3().setFromObject(root, true);
  const out: any = {
    nodes: count, meshes, lines, vertices, triangles,
    bbox: [bb.min.x, bb.min.y, bb.min.z, bb.max.x, bb.max.y, bb.max.z],
    materials: mats.map(matDesc),
    hash: f.h >>> 0,
    userData: { model: root.userData['model'], poziom: root.userData['poziom'], rozmiar: root.userData['rozmiar'] },
  };
  if (detail) out.detail = nodes;
  return out;
}

const DETAIL = new Set<string>();
const models: any[] = [];
function add(call: any, g: THREE.Group, detailKey?: string): void {
  models.push({ call, model: dumpModel(g, detailKey !== undefined) });
}

// ---------------------------------------------------------------------------
// 1) miasto-kamien (era 1, live map path): levels × mur × colour.
const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const EXTRA_LEVELS = [0, 11, -3, 2.5, 3.5, 6.49, NaN];
for (const L of [...LEVELS, ...EXTRA_LEVELS]) {
  for (const mur of [false, true]) {
    for (const color of [undefined, 0x8e24aa]) {
      const det = (L === 1 || L === 10) && color === undefined ? 'd' : undefined;
      add({ f: 'kamien', level: L, mur, color: color ?? null }, buildMiastoKamien(L, color === undefined ? { mur } : { mur, color }), det);
    }
  }
}
// threshold names, default arguments, colour above 24 bits
for (const name of ['male', 'srednie', 'duze'] as const) add({ f: 'kamien', level: name, mur: true, color: null }, buildMiastoKamien(name, { mur: true }));
add({ f: 'kamien_default' }, buildMiastoKamien());
add({ f: 'kamien', level: 4, mur: false, color: 0x1ff0080 }, buildMiastoKamien(4, { color: 0x1ff0080 }));
// palisade wall alone (shared with bronze)
for (const rz of ['male', 'srednie', 'duze'] as const) {
  add({ f: 'palisada', rozmiar: rz, color: null }, (() => { const g = new THREE.Group(); g.add(buildPalisadaWal(rz)); return g; })());
}

// 2) miasto-braz (era >= 2, live map path): grecja / rzym × levels × walls × colour.
const WALLS: Array<{ mur?: boolean; palisada?: boolean }> = [{}, { mur: true }, { palisada: true }, { mur: true, palisada: true }];
for (const civ of ['grecja', 'rzym']) {
  for (const L of [...LEVELS, ...EXTRA_LEVELS]) {
    for (const w of WALLS) {
      for (const color of [undefined, 0x8e24aa]) {
        if (EXTRA_LEVELS.includes(L) && color !== undefined) continue;
        const opts: any = { ...w };
        if (color !== undefined) opts.color = color;
        const det = (L === 1 || L === 10) && color === undefined && (w.mur || w.palisada) && !(w.mur && w.palisada) ? 'd' : undefined;
        add({ f: 'braz', civ, level: L, mur: w.mur ?? false, palisada: w.palisada ?? false, color: color ?? null },
          buildMiastoBraz(civ, L, opts), det);
      }
    }
  }
}
for (const civ of ['egipt', 'sumer', 'nieznana', '']) {
  add({ f: 'braz', civ, level: 7, mur: true, palisada: false, color: null }, buildMiastoBraz(civ, 7, { mur: true }));
}
for (const name of ['male', 'srednie', 'duze'] as const) {
  add({ f: 'braz_grecja', level: name, mur: false, palisada: true, color: null }, buildMiastoBrazGrecja(name, { palisada: true }));
  add({ f: 'braz_rzym', level: name, mur: true, palisada: false, color: null }, buildMiastoBrazRzym(name, { mur: true }));
}
add({ f: 'braz_grecja_default' }, buildMiastoBrazGrecja());
add({ f: 'braz_rzym_default' }, buildMiastoBrazRzym());

// 3) bronzeCityRoblox (ghost, era >= 2): 11 civs × levels × walls.
for (const civ of BRONZE_CIVS) {
  for (const L of [...LEVELS, 0, 12, 4.5]) {
    for (const walls of [false, true]) {
      const det = (L === 1 || L === 10) && walls && (civ === 'grecja' || civ === 'hetyci') ? 'd' : undefined;
      add({ f: 'ghost_braz', civ, level: L, owner: 0xffd54a, walls }, buildBronzeCityRoblox(civ, L, 0xffd54a, walls), det);
    }
  }
}
add({ f: 'ghost_braz', civ: 'chiny', level: 6, owner: 0x8e24aa, walls: true }, buildBronzeCityRoblox('chiny', 6, 0x8e24aa, true));
add({ f: 'ghost_braz_default_walls', civ: 'rzym', level: 3, owner: 0xffd54a }, buildBronzeCityRoblox('rzym', 3, 0xffd54a));

// 4) stoneCityRoblox (ghost, era 1): per civ + universal overload.
for (const civ of BRONZE_CIVS) {
  for (const L of [...LEVELS, 0, 12, 5.5]) {
    for (const walls of [false, true]) {
      const det = (L === 1 || L === 10) && walls && (civ === 'chiny' || civ === 'zulu') ? 'd' : undefined;
      add({ f: 'ghost_kamien', civ, level: L, owner: 0xffd54a, walls }, buildStoneAgeCityRoblox(civ, L, 0xffd54a, walls), det);
    }
  }
}
for (const L of [...LEVELS, 0, 12]) {
  for (const walls of [false, true]) {
    add({ f: 'ghost_kamien_uni', level: L, owner: 0xffd54a, walls }, buildStoneAgeCityRoblox(L, 0xffd54a, walls), L === 10 && walls ? 'd' : undefined);
  }
}
add({ f: 'ghost_kamien_uni_default_walls', level: 4, owner: 0x43a047 }, buildStoneAgeCityRoblox(4, 0x43a047));
add({ f: 'ghost_kamien_default_walls', civ: 'egipt', level: 8, owner: 0x43a047 }, buildStoneAgeCityRoblox('egipt', 8, 0x43a047));

// 5) settlementModel (roblox style = GAME_MAP_RENDER_STYLE): era routing + level clamp.
for (const era of [0, 1, 2, 3]) {
  for (const civ of ['grecja', 'egipt', 'zulu'] as const) {
    for (const L of [1, 6, 10, 0, 13, 2.5]) {
      for (const walls of [false, true]) {
        add({ f: 'settlement', era, civ, level: L, owner: 0xffd54a, walls }, buildSettlementModel(era, civ, L, 0xffd54a, walls));
      }
    }
  }
}

// 6) cityMapOutline.
const outlines: any[] = [];
for (const [q, r, topY, col, war] of [[0, 0, 0.5, 0xffd54a, false], [3, -2, 0.47, 0xe53935, true],
  [-5, 7, 0, 0x00acc1, false], [12, 40, 0.9, 0x8e24aa, true]] as Array<[number, number, number, number, boolean]>) {
  const g = buildCityMapOutline(q, r, topY, col, war);
  outlines.push({ call: { q, r, topY, color: col, atWar: war }, model: dumpModel(g, true) });
}
{
  const g = buildCityMapOutline(1, 1, 0.4, 0x43a047);
  placeCityMapOutline(g, -2, 5, 0.62);
  outlines.push({ call: { q: 1, r: 1, topY: 0.4, color: 0x43a047, atWar: null, place: [-2, 5, 0.62] }, model: dumpModel(g, true),
    hex: g.userData['outlineHex'] });
}

fs.writeFileSync(path.join(OUT, 'models.json'), ser({
  bronzeCivs: [...BRONZE_CIVS],
  stoneCivs: [...STONE_CIVS],
  stoneCivLabels: STONE_CIVS.map((c) => STONE_CIV_LABELS[c]),
  rozmiar: [...LEVELS, ...EXTRA_LEVELS].map((L) => [L, rozmiarDlaPoziomu(L)]),
  kamienLayout: MIASTO_KAMIEN_LAYOUT,
  brazLayout: MIASTO_BRAZ_LAYOUT,
  models,
  outlines,
}));

// ---------------------------------------------------------------------------
// 7) CityRenderer scenario (CPU part: model choice, placement, reuse, fog, outlines).
const T = TerenBazowy as any;
const terrainOrder = [T.Laka, T.Rownina, T.Wzgorza, T.Gory, T.PlytkieMorze, T.Morze, T.Pustynia, T.Polarny];
const hexes: Record<string, any> = {};
let n = 0;
for (let r = -2; r <= 3; r++) {
  for (let q = -3; q <= 4; q++) {
    if (q === 4 && r === 3) continue; // hole: city off-map -> topY 0
    hexes[`${q},${r}`] = { q, r, terenBazowy: terrainOrder[n % terrainOrder.length] };
    n++;
  }
}
const scene = new THREE.Scene();
const cr = new CityRenderer(scene, { hexes } as any);
const outlineCity = new Map<THREE.Object3D, string>();

function dumpScene(): any {
  scene.updateMatrixWorld(true);
  // outline groups carry no cityId: resolve by the renderer's private map (read-only)
  for (const [id, g] of (cr as any).mapOutlines as Map<string, THREE.Group>) outlineCity.set(g, id);
  return scene.children.map((c) => {
    const g = c as THREE.Group;
    if (g.userData['outlineCivColor'] !== undefined) {
      return { kind: 'outline', cityId: outlineCity.get(g) ?? null, civColor: g.userData['outlineCivColor'],
        atWar: g.userData['outlineAtWar'], hex: g.userData['outlineHex'], visible: g.visible,
        p: [g.position.x, g.position.y, g.position.z], model: dumpModel(g, false) };
    }
    return { kind: 'city', cityId: g.userData['cityId'], visualKey: g.userData['visualKey'], ownerId: g.userData['ownerId'],
      q: g.userData['q'], r: g.userData['r'], visible: g.visible, p: [g.position.x, g.position.y, g.position.z],
      s: [g.scale.x, g.scale.y, g.scale.z], model: dumpModel(g, false) };
  });
}

type C = { id: string; ownerId: number; q: number; r: number; name: string; population: number };
const C = (id: string, ownerId: number, q: number, r: number, population: number): C => ({ id, ownerId, q, r, name: id, population });
// Option sets, described by name so that the Rust test can rebuild the same callbacks.
const optionSets: Record<string, any> = {
  full: {
    hideStatChips: true,
    getEra: (o: number) => [1, 2, 3, 1, 2, 2, 1, 4][o % 8],
    getCiv: (o: number) => (['grecja', 'rzym', 'egipt', 'zulu', 'rzym', 'chiny', 'grecja', 'hetyci'] as const)[o % 8],
    getLevel: (id: string) => (id.length * 3) % 11,
    getWallKind: (id: string) => (['none', 'stone', 'palisada'] as const)[id.charCodeAt(id.length - 1) % 3],
    isVisible: (c: C) => (c.q + c.r) % 3 !== 0,
    getMapOutlineKind: (o: number) => (['player', 'war', 'neutral', null, 'ally'] as const)[o % 5],
  },
  walls_only: {
    hideStatChips: true,
    getWalls: (id: string) => id.endsWith('a'),
  },
  defaults: { hideStatChips: true },
  color_fn: {
    hideStatChips: true,
    getEra: (o: number) => 1 + (o % 2),
    ownerColorFn: (o: number) => 0x102030 + o * 0x010101,
    getMapOutlineKind: (o: number) => (o % 2 === 0 ? 'war' : 'neutral'),
    getWalls: (id: string) => id.length % 2 === 0,
  },
  outline_swap: {
    hideStatChips: true,
    getMapOutlineKind: (o: number) => (['neutral', null, 'war', 'player'] as const)[o % 4],
  },
};
const cities1 = [C('a', 0, 0, 0, 3), C('bb', 1, 1, 0, 5), C('ccc', 2, -2, 1, 7), C('dddd', 3, 3, -2, 10),
  C('eeeee', 4, 4, 3, 2), C('f', 5, -3, -2, 1), C('gg', 6, 2, 2, 9), C('hhh', 7, -1, 3, 6), C('ia', 9, 0, -1, 4)];
const steps: any[] = [];
const doSync = (cities: C[], opt: string) => {
  cr.sync(cities as any, optionSets[opt]);
  steps.push({ op: 'sync', cities, options: opt, after: dumpScene() });
};
doSync(cities1, 'full');
doSync(cities1, 'full');                                              // reuse: nothing rebuilt
const cities3 = cities1.filter((c) => c.id !== 'dddd').map((c) => (c.id === 'bb' ? { ...c, q: -1, r: -1 } : c.id === 'gg' ? { ...c, ownerId: 8 } : c));
cities3.push(C('jjj', 10, 2, -1, 8));
doSync(cities3, 'full');                                              // moved / re-owned / removed / new
const fog = (vis: string[], fogOn: boolean, player?: number) => {
  if (player === undefined) cr.applyFogVisibility(new Set(vis), fogOn);
  else cr.applyFogVisibility(new Set(vis), fogOn, player);
  steps.push({ op: 'fog', vis, fogOn, player: player ?? null, after: dumpScene() });
};
fog(['0,0', '-1,-1', '2,-1', '9,9'], true);
fog([], false);
fog(['-2,1', '4,3'], true, 2);
fog([], true, 2);                                                     // only the player's (owner 2) cities stay
fog([], true);                                                        // default player HUMAN_OWNER_PRIMARY = 0
cr.syncMapOutlines(cities3 as any, optionSets['outline_swap']);
steps.push({ op: 'outlines', cities: cities3, options: 'outline_swap', after: dumpScene() });
doSync(cities3, 'walls_only');                                        // default civ map, population level
const cities8 = [C('a', 0, 0, 0, 0), C('kk', 12, 1, 1, 15), C('lla', 3, -3, 2, 3.7), C('mm', 1, 4, 3, 6)];
doSync(cities8, 'defaults');
doSync(cities8, 'color_fn');
doSync([], 'defaults');
cr.dispose();
steps.push({ op: 'dispose', after: dumpScene() });

// 8) Legacy fallback model (cities.ts buildCityModel): reached only when the settlement
// builder throws — provoked through the public API with an era whose valueOf throws.
const legacy: any[] = [];
for (const col of [0xffd54a, 0x8e24aa]) {
  const sc = new THREE.Scene();
  const r2 = new CityRenderer(sc, { hexes } as any);
  const badEra = { valueOf() { throw new Error('forced'); }, toString() { return 'X'; } };
  const warn = console.warn; console.warn = () => {};
  r2.sync([C('z', 0, 0, 0, 1)] as any, { hideStatChips: true, getEra: () => badEra as any, ownerColorFn: () => col });
  console.warn = warn;
  const g = sc.children[0] as THREE.Group;
  legacy.push({ color: col, p: [g.position.x, g.position.y, g.position.z], model: dumpModel(g, true) });
}

fs.writeFileSync(path.join(OUT, 'renderer.json'), ser({
  hexes: Object.values(hexes).map((h: any) => [h.q, h.r, h.terenBazowy]),
  steps,
  legacy,
}));

console.log(`cities models=${models.length} outlines=${outlines.length} steps=${steps.length} legacy=${legacy.length}`);
