// R-RUSTPORT-P4-14-MOD12-WONDERS-Q1 — generator of wonder-model reference vectors.
//
// Run ONLY outside the repository (scratch dir), see README.md. The esbuild bundle links:
//  - three@0.169.0 (npm, version pinned by gra/package-lock.json at edb8fb56),
//  - web modules from `git archive edb8fb56 gra/src gra/data`, IMPORTED UNCHANGED:
//    render/wonderModels.ts (buildWonderModel, WONDER_MODEL_IDS),
//    render/wonderRenderer.ts (WonderRenderer), render/hexutil.ts, types/hex.ts,
//    and gra/data/wonders.json (ids of `cuda` and `parkowane_epoka4plus`).
// No web code is copied: the generator only calls the web API and dumps the object
// graph (THREE.Group / THREE.Mesh, no WebGLRenderer).
// Output: JSON files in the directory given as argv[2].

import * as THREE from 'three';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { TerenBazowy } from '../websrc/gra/src/types/hex';
import { buildWonderModel, WONDER_MODEL_IDS } from '../websrc/gra/src/render/wonderModels';
import { WonderRenderer } from '../websrc/gra/src/render/wonderRenderer';
import wondersJson from '../websrc/gra/data/wonders.json';

const OUT = process.argv[2];
if (!OUT) throw new Error('usage: node wonders_gen.mjs <outdir>');
fs.mkdirSync(OUT, { recursive: true });

// ---------------------------------------------------------------------------
// Serializer: like JSON.stringify, but keeps the sign of -0 (JSON.stringify(-0) === "0").
function ser(v: any): string {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'number') {
    if (!Number.isFinite(v)) throw new Error('non-finite number');
    return Object.is(v, -0) ? '-0' : String(v);
  }
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'string') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map(ser).join(',') + ']';
  return '{' + Object.keys(v).filter((k) => v[k] !== undefined).map((k) => JSON.stringify(k) + ':' + ser(v[k])).join(',') + '}';
}

// FNV-1a 32-bit over little-endian bytes: Float32 attribute words, then index values as u32.
function fnvGeometry(geo: THREE.BufferGeometry): number {
  let h = 0x811c9dc5;
  const feed = (u: number) => {
    for (let k = 0; k < 4; k++) {
      h ^= (u >>> (8 * k)) & 0xff;
      h = Math.imul(h, 0x01000193) >>> 0;
    }
  };
  for (const name of ['position', 'normal', 'uv']) {
    const a = geo.getAttribute(name) as THREE.BufferAttribute;
    const f = a.array as Float32Array;
    const u = new Uint32Array(f.buffer, f.byteOffset, f.length);
    for (let i = 0; i < u.length; i++) feed(u[i]!);
  }
  const idx = geo.getIndex();
  if (idx) for (let i = 0; i < idx.array.length; i++) feed(idx.array[i]! >>> 0);
  for (const g of geo.groups) { feed(g.start); feed(g.count); feed(g.materialIndex ?? 0); }
  return h >>> 0;
}

function geoDesc(geo: any): any {
  const p = geo.parameters;
  switch (geo.type) {
    case 'BoxGeometry': return { type: 'box', w: p.width, h: p.height, d: p.depth };
    case 'CylinderGeometry': return { type: 'cyl', rt: p.radiusTop, rb: p.radiusBottom, h: p.height, seg: p.radialSegments };
    case 'ConeGeometry': return { type: 'cone', r: p.radius, h: p.height, seg: p.radialSegments };
    default: throw new Error('unexpected geometry ' + geo.type);
  }
}

function matDesc(mat: any): any {
  if (mat.type !== 'MeshLambertMaterial') throw new Error('unexpected material ' + mat.type);
  return { type: 'lambert', hex: mat.color.getHex(), lin: [mat.color.r, mat.color.g, mat.color.b], flat: mat.flatShading };
}

function dumpModel(g: THREE.Group): any {
  g.updateMatrixWorld(true);
  const mats: THREE.Material[] = [...(g.userData['mats'] as THREE.Material[])];
  const userMats = mats.length;
  const nodes: any[] = [];
  const index = new Map<THREE.Object3D, number>();
  let vertices = 0;
  let triangles = 0;
  g.traverse((o) => {
    const node: any = {
      t: (o as any).isMesh ? 'M' : 'G',
      parent: o.parent && index.has(o.parent) ? index.get(o.parent) : -1,
      p: [o.position.x, o.position.y, o.position.z],
      r: [o.rotation.x, o.rotation.y, o.rotation.z],
      s: [o.scale.x, o.scale.y, o.scale.z],
      cs: o.castShadow,
      rs: o.receiveShadow,
      w: Array.from(o.matrixWorld.elements),
    };
    index.set(o, nodes.length);
    if ((o as any).isMesh) {
      const m = o as THREE.Mesh;
      const geo = m.geometry as THREE.BufferGeometry;
      let mi = mats.indexOf(m.material as THREE.Material);
      if (mi < 0) { mats.push(m.material as THREE.Material); mi = mats.length - 1; }
      node.geo = geoDesc(geo);
      node.mat = mi;
      node.nv = geo.getAttribute('position').count;
      node.ni = geo.getIndex()!.count;
      node.hash = fnvGeometry(geo);
      vertices += node.nv;
      triangles += node.ni / 3;
    }
    nodes.push(node);
  });
  const bb = new THREE.Box3().setFromObject(g, true);
  return {
    userMats,
    materials: mats.map(matDesc),
    nodes,
    meshes: nodes.filter((n) => n.t === 'M').length,
    vertices,
    triangles,
    bbox: [bb.min.x, bb.min.y, bb.min.z, bb.max.x, bb.max.y, bb.max.z],
  };
}

// ---------------------------------------------------------------------------
// 1) Models.
const cuda: string[] = (wondersJson as any).cuda.map((c: any) => c.id);
const parked: string[] = (wondersJson as any).parkowane_epoka4plus.map((c: any) => c.id);
const ids = [...cuda, ...parked, 'nieznany_cud', ''];
const owners: (number | undefined)[] = [undefined, 0xffd54a, 0x8e24aa];
const models: any[] = [];
for (const id of ids) {
  for (const ruin of [false, true]) {
    for (const ownerColor of owners) {
      const g = buildWonderModel(id, ownerColor === undefined ? { ruin } : { ruin, ownerColor });
      models.push({ id, ruin, ownerColor: ownerColor ?? null, model: dumpModel(g) });
    }
  }
}
// opts omitted entirely (default `{}`)
models.push({ id: 'piramidy', ruin: null, ownerColor: null, model: dumpModel(buildWonderModel('piramidy')) });
fs.writeFileSync(path.join(OUT, 'models.json'), ser({
  wonderModelIds: [...WONDER_MODEL_IDS],
  cuda,
  parked,
  models,
}));

// ---------------------------------------------------------------------------
// 2) WonderRenderer.sync / applyFogVisibility scenario.
const T = TerenBazowy as any;
const terrainOrder = [T.Laka, T.Rownina, T.Wzgorza, T.Gory, T.PlytkieMorze, T.Morze, T.Pustynia, T.Polarny];
const hexes: Record<string, any> = {};
let n = 0;
for (let r = -2; r <= 3; r++) {
  for (let q = -3; q <= 4; q++) {
    if (q === 4 && r === 3) continue; // hole: wonder placed off-map -> topY 0
    hexes[`${q},${r}`] = { q, r, terenBazowy: terrainOrder[n % terrainOrder.length] };
    n++;
  }
}
const scene = new THREE.Scene();
const wr = new WonderRenderer(scene, { hexes } as any);

function dumpScene(label: string): any {
  scene.updateMatrixWorld(true);
  return {
    label,
    children: scene.children.map((c) => {
      const g = c as THREE.Group;
      const userMats = g.userData['mats'] as THREE.Material[];
      let bannerHex: number | null = null;
      let nodes = 0;
      g.traverse((o) => {
        nodes++;
        if ((o as any).isMesh && !userMats.includes((o as THREE.Mesh).material as THREE.Material)) {
          bannerHex = ((o as THREE.Mesh).material as any).color.getHex();
        }
      });
      return {
        key: g.userData['wonderKey'],
        visualKey: g.userData['visualKey'],
        visible: g.visible,
        p: [g.position.x, g.position.y, g.position.z],
        s: [g.scale.x, g.scale.y, g.scale.z],
        w: Array.from(g.matrixWorld.elements),
        nodes,
        mat0: (userMats[0] as any).color.getHex(),
        bannerHex,
      };
    }),
  };
}

const steps: any[] = [];
const P = (wonderId: string, q: number, r: number, ownerId: number, ruin?: boolean) =>
  (ruin === undefined ? { wonderId, q, r, ownerId } : { wonderId, q, r, ownerId, ruin });

const placed1 = [
  ...cuda.map((id, i) => P(id, (i % 8) - 3, Math.floor(i / 8) - 2, i, i % 5 === 0 ? true : (i % 5 === 1 ? false : undefined))),
  P('nalanda', 2, 1, 3),
  P('nieznany_cud', 4, 3, 2),          // off-map hex
  P('piramidy', 4, 2, 9),              // same wonder twice on another hex
  P('kolos', 3, 1, -1),                // negative owner: OWNER_COLORS[-1] -> undefined -> no banner
];
const inv1 = (w: any) => (w.q + w.r) % 2 !== 0;
steps.push({ op: 'sync', placed: placed1, isVisible: 'odd', ownerColorFn: null });
wr.sync(placed1 as any, { isVisible: inv1 });
steps[steps.length - 1].after = dumpScene('s1');

// step 2: remove some, change ruin of one (rebuild -> moves to the end), change owner of one,
// keep others (only visibility/position refresh), no options.
const placed2 = placed1
  .filter((_, i) => i % 4 !== 3)
  .map((w: any, i) => (i === 2 ? { ...w, ruin: !w.ruin } : i === 5 ? { ...w, ownerId: w.ownerId + 1 } : w));
steps.push({ op: 'sync', placed: placed2, isVisible: null, ownerColorFn: null });
wr.sync(placed2 as any);
steps[steps.length - 1].after = dumpScene('s2');

// step 3: fog on with a visibility set.
const vis3 = ['-3,-2', '0,-2', '2,-1', '4,2', '4,3', '1,0', '9,9'];
steps.push({ op: 'fog', vis: vis3, fogOn: true });
wr.applyFogVisibility(new Set(vis3), true);
steps[steps.length - 1].after = dumpScene('s3');

// step 4: fog off.
steps.push({ op: 'fog', vis: [], fogOn: false });
wr.applyFogVisibility(new Set(), false);
steps[steps.length - 1].after = dumpScene('s4');

// step 5: ownerColorFn — existing models keep their banner (visualKey has no colour); new ones use it.
const placed5 = [...placed2, P('posag_peruna', 0, 0, 4, true), P('', 1, 1, 0)];
steps.push({ op: 'sync', placed: placed5, isVisible: 'even', ownerColorFn: 'plus' });
wr.sync(placed5 as any, { isVisible: (w: any) => (w.q + w.r) % 2 === 0, ownerColorFn: (id: number) => 0x102030 + id * 0x010101 });
steps[steps.length - 1].after = dumpScene('s5');

// step 6: fog on with empty set, then sync([]) and dispose.
steps.push({ op: 'fog', vis: [], fogOn: true });
wr.applyFogVisibility(new Set(), true);
steps[steps.length - 1].after = dumpScene('s6');
steps.push({ op: 'sync', placed: [], isVisible: null, ownerColorFn: null });
wr.sync([]);
steps[steps.length - 1].after = dumpScene('s7');
steps.push({ op: 'sync', placed: placed1, isVisible: null, ownerColorFn: null });
wr.sync(placed1 as any);
steps[steps.length - 1].after = dumpScene('s8');
steps.push({ op: 'dispose' });
wr.dispose();
steps[steps.length - 1].after = dumpScene('s9');

fs.writeFileSync(path.join(OUT, 'renderer.json'), ser({
  hexes: Object.values(hexes).map((h: any) => [h.q, h.r, h.terenBazowy]),
  steps,
}));

// ---------------------------------------------------------------------------
// 3) Math.sin / Math.cos vectors (V8 fdlibm) for the Rust js_sin/js_cos port.
const angles: number[] = [0, -0, 1e-300, -1e-9, Math.PI / 4, -Math.PI / 4, 3 * Math.PI / 4, Math.PI / 2,
  -Math.PI / 2, Math.PI, 2 * Math.PI, 0.7853981633974483, 0.7853981633974484, 2.356194490192345,
  1.5707963267948966, 823549.6, -823549.6];
for (const nSeg of [6, 7, 14, 16, 18, 24]) {
  for (let i = 0; i <= nSeg; i++) {
    const a = (i / nSeg) * Math.PI * 2;
    angles.push(a, a - Math.PI / 2, -a + Math.PI / 2, (-a + Math.PI / 2) / 2);
  }
}
let seed = 20261022;
const rnd = () => { seed = (Math.imul(seed, 1103515245) + 12345) >>> 0; return seed / 4294967296; };
for (let i = 0; i < 4096; i++) angles.push((rnd() * 2 - 1) * (i < 2048 ? 10 : 800000));
fs.writeFileSync(path.join(OUT, 'trig.json'), ser({
  x: angles,
  sin: angles.map((a) => Math.sin(a)),
  cos: angles.map((a) => Math.cos(a)),
}));

console.log(`wonders models=${models.length} steps=${steps.length} hexes=${Object.keys(hexes).length} trig=${angles.length}`);
