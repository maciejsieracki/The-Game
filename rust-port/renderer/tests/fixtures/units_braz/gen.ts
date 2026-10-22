// Reference-vector generator for MOD-06 Bronze-age unit models
// (R-RUSTPORT-P4-23-MOD06-UNITS-BRONZE-Q1).
//
// Runs the REAL web builders from `git archive edb8fb56 gra/src gra/data`
// (three@0.169.0, node v22.22.0) and records, for every case, the full object
// tree the builder returns (no WebGL renderer: only geometries, materials,
// groups and `updateMatrixWorld(true)`).
//
// Web sources are imported UNCHANGED and without any adaptation: the 30
// exported builders of `render/braz-*-opus5.ts` and `render/jednostki-p2/p3/
// p4/p57/p8a/p8b-*.ts`, `buildUnitModel` of `render/units.ts` (the eight
// MOD-06 builders that live inside `units.ts` are NOT exported, so they are
// reached through `buildUnitModel(categoryOf(...), owner, PL name)` — the
// real entry point), `categoryOf` of `units/setup.ts`.
//
// The record format (`fullRecord`, `signature`, `geoHash`, `hx`) is the one of
// `tests/fixtures/unit_core/gen.ts` (P4.13) and `units_kamien/gen.ts` (P4.19).
//
// Size: a `unit:`/`unitB:`/`unitEn:` case whose full record is IDENTICAL
// (deep JSON equality, `call` excluded) to an already stored case is written
// as `{ call, sameAs: <id> }`; the Rust test compares the Rust model of that
// case against the referenced web record in full.
//
// Usage: node build.mjs && node gen.mjs <out-dir>

import * as THREE from 'three';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { buildProcarzBrazOpus5 } from '../websrc/gra/src/render/braz-procarz-opus5';
import { buildWlocznikBrazOpus5 } from '../websrc/gra/src/render/braz-wlocznik-opus5';
import { buildMiecznikBrazOpus5 } from '../websrc/gra/src/render/braz-miecznik-opus5';
import { buildRydwanWolyBrazOpus5 } from '../websrc/gra/src/render/braz-rydwan-woly-opus5';
import { buildKonnicaBrazOpus5 } from '../websrc/gra/src/render/braz-konnica-opus5';
import { buildRydwanKonnyBrazOpus5 } from '../websrc/gra/src/render/braz-rydwan-konny-opus5';
import { buildRydwanKapadokijskiOpus5 } from '../websrc/gra/src/render/braz-rydwan-kapadokijski-opus5';
import { buildNubianArcherOpus5 } from '../websrc/gra/src/render/braz-lucznik-nubijski-opus5';
import { buildTaranOkutyOpus5 } from '../websrc/gra/src/render/braz-taran-opus5';
import { buildAxeWarriorInka, buildInkaSlinger } from '../websrc/gra/src/render/jednostki-p2-inka';
import { buildAkkadianArcher, buildAssyrianArcher } from '../websrc/gra/src/render/jednostki-p3-dystans';
import {
  buildSherden, buildTyrrhenian, buildShekelesh, buildMycenaeanWarrior, buildShangHalberdier,
  buildKhopeshWarrior,
} from '../websrc/gra/src/render/jednostki-p4-melee';
import { buildImpi, buildSumerianSpearman, buildSiegeTower } from '../websrc/gra/src/render/jednostki-p57-wlocznie-machiny';
import {
  buildPiechotaHetycka, buildGwardiaIshtar, buildWojownikBabilonski, buildWojownikFenicki,
} from '../websrc/gra/src/render/jednostki-p8a-bliskiwschod';
import {
  buildStraznikHarappy, buildPiechotaInduska, buildLegionRzymski, buildGwardzistaChampi,
} from '../websrc/gra/src/render/jednostki-p8b-rozni';
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

function fullRecord(root: THREE.Object3D): Record<string, unknown> {
  root.updateMatrixWorld(true);
  const mats: THREE.Material[] = (root.userData['mats'] as THREE.Material[] | undefined) ?? [];
  const nodes: unknown[] = [];
  const index = new Map<THREE.Object3D, number>();
  const bbMin = [Infinity, Infinity, Infinity];
  const bbMax = [-Infinity, -Infinity, -Infinity];
  const v = new THREE.Vector3();
  let vertices = 0;
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
      vertices += pos.count;
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
    meshes: s.meshes, tris: s.tris, sig: s.sig, vertices,
    bbox: hx([...bbMin, ...bbMax]),
    mats: mats.map((m) => matRec(m as THREE.MeshStandardMaterial)),
    celticRetint: root.userData['celticRetint'] ?? null,
    perTokenGeos: ((root.userData['perTokenGeos'] as unknown[] | undefined) ?? []).length,
    nodes,
  };
}

// ------------------------------------------------------------- cases
const cases: Record<string, unknown> = {};
const stored = new Map<string, string>(); // JSON of the record → first case id
let deduped = 0;
const add = (id: string, call: string, build: () => THREE.Object3D): void => {
  const rec = fullRecord(build());
  const key = JSON.stringify(rec);
  const same = stored.get(key);
  if (same !== undefined) {
    cases[id] = { call, sameAs: same };
    deduped++;
    return;
  }
  stored.set(key, id);
  cases[id] = { call, ...rec };
};

// The 30 exported builders of the package, both owner colours.
const BUILDERS: [string, (c: number) => THREE.Group][] = [
  ['buildProcarzBrazOpus5', buildProcarzBrazOpus5],
  ['buildWlocznikBrazOpus5', buildWlocznikBrazOpus5],
  ['buildMiecznikBrazOpus5', buildMiecznikBrazOpus5],
  ['buildRydwanWolyBrazOpus5', buildRydwanWolyBrazOpus5],
  ['buildKonnicaBrazOpus5', buildKonnicaBrazOpus5],
  ['buildRydwanKonnyBrazOpus5', buildRydwanKonnyBrazOpus5],
  ['buildRydwanKapadokijskiOpus5', buildRydwanKapadokijskiOpus5],
  ['buildNubianArcherOpus5', buildNubianArcherOpus5],
  ['buildTaranOkutyOpus5', buildTaranOkutyOpus5],
  ['buildAxeWarriorInka', buildAxeWarriorInka],
  ['buildInkaSlinger', buildInkaSlinger],
  ['buildAkkadianArcher', buildAkkadianArcher],
  ['buildAssyrianArcher', buildAssyrianArcher],
  ['buildSherden', buildSherden],
  ['buildTyrrhenian', buildTyrrhenian],
  ['buildShekelesh', buildShekelesh],
  ['buildMycenaeanWarrior', buildMycenaeanWarrior],
  ['buildShangHalberdier', buildShangHalberdier],
  ['buildKhopeshWarrior', buildKhopeshWarrior],
  ['buildImpi', buildImpi],
  ['buildSumerianSpearman', buildSumerianSpearman],
  ['buildSiegeTower', buildSiegeTower],
  ['buildPiechotaHetycka', buildPiechotaHetycka],
  ['buildGwardiaIshtar', buildGwardiaIshtar],
  ['buildWojownikBabilonski', buildWojownikBabilonski],
  ['buildWojownikFenicki', buildWojownikFenicki],
  ['buildStraznikHarappy', buildStraznikHarappy],
  ['buildPiechotaInduska', buildPiechotaInduska],
  ['buildLegionRzymski', buildLegionRzymski],
  ['buildGwardzistaChampi', buildGwardzistaChampi],
];
for (const [name, f] of BUILDERS) {
  add(`fn:${name}`, `${name}(OWNER_A)`, () => f(OWNER_A));
  add(`fn:${name}@B`, `${name}(OWNER_B)`, () => f(OWNER_B));
}

// Every units.json record of the Bronze epoch (40: 37 of MOD-06 + Galera,
// Rydwan mykeński, Rydwan Shang of MOD-04) through the real entry point
// `buildUnitModel(categoryOf(...), owner, name)`: PL name with both owner
// colours (`unit:` / `unitB:`; `unitB:` also covers the eight non-exported
// `units.ts` builders with OWNER_B) and EN name (`unitEn:`, battle path).
type Row = Record<string, unknown>;
const rows = unitsJson as unknown as Row[];
const records: unknown[] = [];
for (const r of rows) {
  if (r['Epoka'] !== 'Brąz') continue;
  const pl = String(r['Jednostka']);
  const en = String(r['Nazwa EN'] ?? '');
  const role = String(r['Rola'] ?? r['Rola (linia)'] ?? '');
  const isSuper = r['Super-jednostka'] === 'TAK';
  const cat = categoryOf(pl, role, isSuper, r['Typ'] as string | undefined);
  add(`unit:${pl}`, `buildUnitModel('${cat}', OWNER_A, '${pl}')`, () => buildUnitModel(cat, OWNER_A, pl));
  add(`unitB:${pl}`, `buildUnitModel('${cat}', OWNER_B, '${pl}')`, () => buildUnitModel(cat, OWNER_B, pl));
  add(`unitEn:${pl}`, `buildUnitModel('${cat}', OWNER_A, '${en}')`, () => buildUnitModel(cat, OWNER_A, en));
  records.push({ pl, en, category: cat });
}

const out = { owner: { a: OWNER_A, b: OWNER_B }, cases, records };
const dir = process.argv[2] ?? '.';
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'units_braz.json'), JSON.stringify(out));
console.log(`units_braz cases=${Object.keys(cases).length} stored=${stored.size} sameAs=${deduped} records=${records.length}`);
