// Reference-vector generator for MOD-05 Stone-age unit models
// (R-RUSTPORT-P4-19-MOD05-UNITS-STONE-Q1).
//
// Runs the REAL web builders from `git archive edb8fb56 gra/src gra/data`
// (three@0.169.0, node v22.22.0) and records, for every case, the full object
// tree the builder returns (no WebGL renderer: only geometries, materials,
// groups and `updateMatrixWorld(true)`).
//
// Web sources are imported UNCHANGED and without any adaptation: the ten
// builders are exported by `render/kamien-*-opus5.ts`, `buildUnitModel` by
// `render/units.ts`, `categoryOf` by `units/setup.ts`.
//
// The record format (`fullRecord`, `signature`, `geoHash`, `hx`) is the one of
// `tests/fixtures/unit_core/gen.ts` (P4.13), so the Rust tests compare with
// `to_bits()` exactly like `unit_core_web_parity.rs`.
//
// Usage: node build.mjs && node gen.mjs <out-dir>

import * as THREE from 'three';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  buildWojownikOpus5, buildOszczepnikOpus5, buildLucznikOpus5, buildZwiadowcaOpus5,
} from '../websrc/gra/src/render/kamien-bazowe-opus5';
import { buildMaceWarriorOpus5, buildInkaJavelineerOpus5 } from '../websrc/gra/src/render/kamien-inka-opus5';
import { buildBatteringRamOpus5, buildZuluJavelineerOpus5 } from '../websrc/gra/src/render/kamien-zulu-taran-opus5';
import { buildEgyptianArcherOpus5, buildSumerianArcherOpus5 } from '../websrc/gra/src/render/kamien-lucznicy-opus5';
import { buildUnitModel } from '../websrc/gra/src/render/units';
import { categoryOf } from '../websrc/gra/src/units/setup';
import unitsJson from '../websrc/gra/data/units.json';

const OWNER_A = 0xd03030;
const OWNER_B = 0x2a6fdb;

// ------------------------------------------------------------- hashing
class Fnv {
  h = 0x811c9dc5 >>> 0;
  byte(b: number): void {
    this.h ^= b & 0xff;
    this.h = Math.imul(this.h, 0x01000193) >>> 0;
  }
  u32(v: number): void {
    v = v >>> 0;
    this.byte(v); this.byte(v >>> 8); this.byte(v >>> 16); this.byte(v >>> 24);
  }
  f32(v: number): void {
    const dv = new DataView(new ArrayBuffer(4));
    dv.setFloat32(0, v, true);
    for (let i = 0; i < 4; i++) this.byte(dv.getUint8(i));
  }
  f64(v: number): void {
    const dv = new DataView(new ArrayBuffer(8));
    dv.setFloat64(0, v, true);
    for (let i = 0; i < 8; i++) this.byte(dv.getUint8(i));
  }
}

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

// IEEE-754 binary64 bits, 16 lowercase hex digits per number, concatenated.
function hx(nums: ArrayLike<number>): string {
  const dv = new DataView(new ArrayBuffer(8));
  let out = '';
  for (let i = 0; i < nums.length; i++) {
    dv.setFloat64(0, nums[i]!, false);
    out += dv.getBigUint64(0, false).toString(16).padStart(16, '0');
  }
  return out;
}

function matRec(m: THREE.MeshStandardMaterial): unknown {
  return {
    color: m.color.getHex(),
    lin: hx([m.color.r, m.color.g, m.color.b]),
    metalness: hx([m.metalness]),
    roughness: hx([m.roughness]),
    transparent: m.transparent,
    opacity: hx([m.opacity]),
    flatShading: m.flatShading,
  };
}

function signature(root: THREE.Object3D): { meshes: number; tris: number; sig: number } {
  root.updateMatrixWorld(true);
  const f = new Fnv();
  let meshes = 0;
  let tris = 0;
  root.traverse((o) => {
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
  return { meshes, tris, sig: f.h >>> 0 };
}

function fullRecord(root: THREE.Object3D): unknown {
  root.updateMatrixWorld(true);
  const mats: THREE.Material[] = (root.userData['mats'] as THREE.Material[] | undefined) ?? [];
  const nodes: unknown[] = [];
  const index = new Map<THREE.Object3D, number>();
  const bbMin = [Infinity, Infinity, Infinity];
  const bbMax = [-Infinity, -Infinity, -Infinity];
  const v = new THREE.Vector3();
  root.traverse((o) => {
    const i = nodes.length;
    index.set(o, i);
    const base = {
      kind: (o as THREE.Mesh).isMesh ? 'mesh' : 'group',
      name: o.name,
      parent: o.parent && index.has(o.parent) ? index.get(o.parent) : -1,
      p: hx([o.position.x, o.position.y, o.position.z]),
      q: hx([o.quaternion.x, o.quaternion.y, o.quaternion.z, o.quaternion.w]),
      s: hx([o.scale.x, o.scale.y, o.scale.z]),
      w: hx(o.matrixWorld.elements),
    };
    if ((o as THREE.Mesh).isMesh) {
      const m = o as THREE.Mesh;
      const g = m.geometry;
      const pos = g.getAttribute('position');
      for (let k = 0; k < pos.count; k++) {
        v.fromBufferAttribute(pos, k).applyMatrix4(m.matrixWorld);
        bbMin[0] = Math.min(bbMin[0]!, v.x); bbMin[1] = Math.min(bbMin[1]!, v.y); bbMin[2] = Math.min(bbMin[2]!, v.z);
        bbMax[0] = Math.max(bbMax[0]!, v.x); bbMax[1] = Math.max(bbMax[1]!, v.y); bbMax[2] = Math.max(bbMax[2]!, v.z);
      }
      nodes.push({
        ...base,
        geo: { type: g.type, vtx: pos.count, tri: triCount(g), hash: geoHash(g) },
        mat: matRec(m.material as THREE.MeshStandardMaterial),
        matIndex: mats.indexOf(m.material as THREE.Material),
      });
    } else {
      nodes.push(base);
    }
  });
  const s = signature(root);
  return {
    meshes: s.meshes, tris: s.tris, sig: s.sig,
    bbox: hx([...bbMin, ...bbMax]),
    mats: mats.map((m) => matRec(m as THREE.MeshStandardMaterial)),
    celticRetint: root.userData['celticRetint'] ?? null,
    perTokenGeos: ((root.userData['perTokenGeos'] as unknown[] | undefined) ?? []).length,
    nodes,
  };
}

// ------------------------------------------------------------- cases
const cases: Record<string, unknown> = {};
const add = (id: string, call: string, build: () => THREE.Object3D): void => {
  cases[id] = { call, ...(fullRecord(build()) as object) };
};

// The ten exported builders of the package, both owner colours.
const BUILDERS: [string, (c: number) => THREE.Group][] = [
  ['buildWojownikOpus5', buildWojownikOpus5],
  ['buildOszczepnikOpus5', buildOszczepnikOpus5],
  ['buildLucznikOpus5', buildLucznikOpus5],
  ['buildZwiadowcaOpus5', buildZwiadowcaOpus5],
  ['buildMaceWarriorOpus5', buildMaceWarriorOpus5],
  ['buildInkaJavelineerOpus5', buildInkaJavelineerOpus5],
  ['buildZuluJavelineerOpus5', buildZuluJavelineerOpus5],
  ['buildBatteringRamOpus5', buildBatteringRamOpus5],
  ['buildEgyptianArcherOpus5', buildEgyptianArcherOpus5],
  ['buildSumerianArcherOpus5', buildSumerianArcherOpus5],
];
for (const [name, f] of BUILDERS) {
  add(`fn:${name}`, `${name}(OWNER_A)`, () => f(OWNER_A));
  add(`fn:${name}@B`, `${name}(OWNER_B)`, () => f(OWNER_B));
}

// The ten units.json records of the package through the real entry point
// (`buildUnitModel(categoryOf(...), owner, name)`), PL and EN name.
type Row = Record<string, unknown>;
const rows = unitsJson as unknown as Row[];
const records: unknown[] = [];
for (const r of rows) {
  if (r['Epoka'] !== 'Kamień') continue;
  const pl = String(r['Jednostka']);
  const en = String(r['Nazwa EN'] ?? '');
  const role = String(r['Rola'] ?? r['Rola (linia)'] ?? '');
  const isSuper = r['Super-jednostka'] === 'TAK';
  const cat = categoryOf(pl, role, isSuper, r['Typ'] as string | undefined);
  add(`unit:${pl}`, `buildUnitModel('${cat}', OWNER_A, '${pl}')`, () => buildUnitModel(cat, OWNER_A, pl));
  add(`unitEn:${pl}`, `buildUnitModel('${cat}', OWNER_A, '${en}')`, () => buildUnitModel(cat, OWNER_A, en));
  records.push({ pl, en, category: cat });
}

// Math.asin vectors (V8): the Euler round trip of `quaternion.copy(q);
// rotation.y += …` (kamien-zulu-taran-opus5.ts) goes through
// Euler.setFromRotationMatrix -> Math.asin.
const asinX: number[] = [];
for (let k = -1000; k <= 1000; k++) asinX.push(k / 1000);
for (let k = 0; k < 3000; k++) asinX.push(Math.sin(k * 0.7311) * 0.9999999);
for (const e of [1e-9, 1e-12, 2 ** -27, 2 ** -28, 0.5, 0.4999999999, 0.975, 0.97499999, 0.9999999, 1, -1, 0, -0]) {
  asinX.push(e, -e);
}
const asin = { x: hx(asinX), y: hx(asinX.map((x) => Math.asin(x))) };

const out = { owner: { a: OWNER_A, b: OWNER_B }, cases, records, asin };
const dir = process.argv[2] ?? '.';
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'units_kamien.json'), JSON.stringify(out));
console.log(`units_kamien cases=${Object.keys(cases).length} records=${records.length} asin=${asinX.length}`);
