// Reference-vector generator for MOD-04 unit core (R-RUSTPORT-P4-13-MOD04-UNIT-CORE-Q1).
//
// Runs the REAL web builders from `git archive edb8fb56 gra/src gra/data`
// (three@0.169.0) and records, for every case, the full object tree that the
// builder returns (no WebGL renderer: only geometries, materials, groups and
// `updateMatrixWorld(true)`).
//
// Web sources are imported unchanged. The only adaptation is done by the
// esbuild plugin in `build.mjs` (see README.md): it APPENDS one `export { ... }`
// line to `render/units.ts` so that internal (non-exported) functions
// (`buildCategoryModel`, `decorateChariot`, `applyCultureOverrides`,
// `attachEmbarkBoat`, `buildBaseAvatar`, `cultureFromName`, `normName`,
// `buildNamedUnit`, colour constants) can be called directly. No line of the
// web code is modified.
//
// Usage: node gen.mjs <out-dir>   (bundle produced by build.mjs)

import * as THREE from 'three';
import * as fs from 'node:fs';
import * as path from 'node:path';
// @ts-ignore -- extra exports appended by the build plugin
import * as U from '../websrc/gra/src/render/units';
import { buildHorse, buildZlozeKonie, addRiderLegs } from '../websrc/gra/src/render/kon-nowy-model';
// @ts-ignore -- getGeoNH* exports appended by the build plugin
import * as K from '../websrc/gra/src/render/kon-nowy-model';
import { buildGalera } from '../websrc/gra/src/render/galera-model';
import * as P1 from '../websrc/gra/src/render/jednostki-p1-rdzen';
import { categoryOf } from '../websrc/gra/src/units/setup';
import unitsJson from '../websrc/gra/data/units.json';

const OWNER_A = 0xd03030;
const OWNER_B = 0x2a6fdb;

// ------------------------------------------------------------- hashing
// FNV-1a 32 over little-endian bytes (identical routine in the Rust test).
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

// Floats are stored as their exact IEEE-754 binary64 bits: 16 lowercase hex
// digits per number (big-endian u64), concatenated. JSON cannot carry -0 or
// NaN and decimal text invites rounding doubts; bits make the Rust
// comparison literally `to_bits() ==`.
function hx(nums: ArrayLike<number>): string {
  const dv = new DataView(new ArrayBuffer(8));
  let out = '';
  for (let i = 0; i < nums.length; i++) {
    dv.setFloat64(0, nums[i]!, false);
    out += dv.getBigUint64(0, false).toString(16).padStart(16, '0');
  }
  return out;
}

interface MatRec { color: number; lin: string; metalness: string; roughness: string; transparent: boolean; opacity: string; flatShading: boolean; }
function matRec(m: THREE.MeshStandardMaterial): MatRec {
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

/** Model signature: mesh count + per mesh (geometry hash, material, world matrix). */
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
    nodes,
  };
}

// ------------------------------------------------------------- cases
const out: Record<string, unknown> = {};
const cases: Record<string, unknown> = {};
const add = (id: string, call: string, build: () => THREE.Object3D): void => {
  cases[id] = { call, ...(fullRecord(build()) as object) };
};

const CATS = ['falanga', 'legion', 'legionary', 'legionista', 'osadnik', 'miecznik', 'wlocznik', 'lucznik',
  'procarz', 'oszczepnik', 'maczuga', 'topor', 'konnica', 'rydwan', 'super', 'zwiadowca', 'robotnik',
  'galera', 'obleznicza', 'domyslny', 'nieznana-kategoria'];
for (const c of CATS) add(`cat:${c}`, `buildCategoryModel('${c}', OWNER_A)`, () => U.buildCategoryModel(c, OWNER_A));
add('cat:topor@B', `buildCategoryModel('topor', OWNER_B)`, () => U.buildCategoryModel('topor', OWNER_B));
add('cat:rydwan@B', `buildCategoryModel('rydwan', OWNER_B)`, () => U.buildCategoryModel('rydwan', OWNER_B));

// The 4 records of this package through the real entry point (PL names).
add('unit:Galera', `buildUnitModel('galera', OWNER_A, 'Galera')`, () => U.buildUnitModel('galera', OWNER_A, 'Galera'));
add('unit:Rydwan mykeński', `buildUnitModel('rydwan', OWNER_A, 'Rydwan mykeński')`, () => U.buildUnitModel('rydwan', OWNER_A, 'Rydwan mykeński'));
add('unit:Rydwan Shang', `buildUnitModel('rydwan', OWNER_A, 'Rydwan Shang')`, () => U.buildUnitModel('rydwan', OWNER_A, 'Rydwan Shang'));
add('unit:Rydwan celtycki', `buildUnitModel('rydwan', OWNER_A, 'Rydwan celtycki')`, () => U.buildUnitModel('rydwan', OWNER_A, 'Rydwan celtycki'));
add('unit:Rydwan celtycki@B', `buildUnitModel('rydwan', OWNER_B, 'Rydwan celtycki')`, () => U.buildUnitModel('rydwan', OWNER_B, 'Rydwan celtycki'));
// Civilians (not in units.json; map passes the PL typeId).
add('unit:Osadnik', `buildUnitModel('osadnik', OWNER_A, 'Osadnik')`, () => U.buildUnitModel('osadnik', OWNER_A, 'Osadnik'));
add('unit:Robotnik', `buildUnitModel('robotnik', OWNER_A, 'Robotnik')`, () => U.buildUnitModel('robotnik', OWNER_A, 'Robotnik'));

// Named units.ts models without a units.json record (P4-7 §4.1 #1-4, #7)
for (const f of ['buildHierosLochos', 'buildCrossbowman', 'buildCeltWarrior', 'buildGermanWarrior', 'buildBerserker']) {
  add(`named:${f}`, `${f}(OWNER_A)`, () => (U as Record<string, (c: number) => THREE.Group>)[f]!(OWNER_A));
}

// galera-model.ts
add('galera:plyniecie', `buildGalera(OWNER_A)`, () => buildGalera(OWNER_A));
add('galera:atak', `buildGalera(OWNER_A, 'atak')`, () => buildGalera(OWNER_A, 'atak'));

// jednostki-p1-rdzen.ts (all 7 exports, D-MOD-3 = B)
for (const [k, f] of Object.entries({
  wojownikKamien: P1.buildWojownikKamien, oszczepnik: P1.buildOszczepnik, lucznik: P1.buildLucznik,
  zwiadowca: P1.buildZwiadowca, procarz: P1.buildProcarz, wlocznik: P1.buildWlocznik, miecznik: P1.buildMiecznik,
})) add(`p1:${k}`, `${f.name}(OWNER_A)`, () => f(OWNER_A));

// kon-nowy-model.ts
add('kon:horse', 'buildHorse(g, mat, std(0x8a6038), std(0x1a0e06), null, 0, 0)', () => {
  const g = new THREE.Group();
  const mats: THREE.Material[] = [];
  const std = (c: number) => { const m = new THREE.MeshStandardMaterial({ color: c, metalness: 0.1, roughness: 0.78 }); mats.push(m); return m; };
  buildHorse(g, std as never, std(0x8a6038), std(0x1a0e06), null, 0, 0);
  g.userData['mats'] = mats;
  return g;
});
add('kon:horseHarness', 'buildHorse(g, mat, body, mane, harness, 0.1, -0.4)', () => {
  const g = new THREE.Group();
  const mats: THREE.Material[] = [];
  const std = (c: number) => { const m = new THREE.MeshStandardMaterial({ color: c, metalness: 0.05, roughness: 0.85 }); mats.push(m); return m; };
  buildHorse(g, std as never, std(0x8a6038), std(0x1a0e06), std(0x4a3828), 0.1, -0.4);
  g.userData['mats'] = mats;
  return g;
});
add('kon:zloze', 'buildZlozeKonie()', () => buildZlozeKonie());
add('kon:zloze@0.5', 'buildZlozeKonie(0.5)', () => buildZlozeKonie(0.5));
add('kon:riderLegs', 'addRiderLegs(g, cloth, boot, 0.296)', () => {
  const g = new THREE.Group();
  const mats: THREE.Material[] = [];
  const std = (c: number) => { const m = new THREE.MeshStandardMaterial({ color: c, metalness: 0.06, roughness: 0.78 }); mats.push(m); return m; };
  addRiderLegs(g, std(0xa01f2e), std(0x3a2414), 0.296);
  g.userData['mats'] = mats;
  return g;
});

// attachEmbarkBoat on representative tokens
add('embark:topor', `attachEmbarkBoat(buildCategoryModel('topor'))`, () => { const g = U.buildCategoryModel('topor', OWNER_A); U.attachEmbarkBoat(g); return g; });
add('embark:rydwan', `attachEmbarkBoat(buildCategoryModel('rydwan'))`, () => { const g = U.buildCategoryModel('rydwan', OWNER_A); U.attachEmbarkBoat(g); return g; });
add('embark:p1miecznik', `attachEmbarkBoat(buildCategoryModel('miecznik'))`, () => { const g = U.buildCategoryModel('miecznik', OWNER_A); U.attachEmbarkBoat(g); return g; });

// applyCultureOverrides — every culture on a foot category + skip paths
const CULTURES = ['rzym', 'grecja', 'chiny', 'zulu', 'inka', 'egipt', 'sumer', 'germanie', 'neutral'];
for (const cu of CULTURES) {
  add(`culture:topor:${cu}`, `applyCultureOverrides(buildCategoryModel('topor'), 'topor', '${cu}')`, () => {
    const g = U.buildCategoryModel('topor', OWNER_A); U.applyCultureOverrides(g, 'topor', cu, OWNER_A); return g;
  });
}
for (const [cat, cu] of [['super', 'zulu'], ['osadnik', 'egipt'], ['robotnik', 'inka'], ['legionista', 'grecja'], ['maczuga', 'sumer'], ['konnica', 'rzym'], ['miecznik', 'egipt']] as const) {
  add(`culture:${cat}:${cu}`, `applyCultureOverrides(buildCategoryModel('${cat}'), '${cat}', '${cu}')`, () => {
    const g = U.buildCategoryModel(cat, OWNER_A); U.applyCultureOverrides(g, cat, cu, OWNER_A); return g;
  });
}

// ------------------------------------------------------------- routing of all 75 records (PL and EN)
type Row = Record<string, unknown>;
const rows = unitsJson as unknown as Row[];
const records: unknown[] = [];
for (const r of rows) {
  const pl = String(r['Jednostka']);
  const en = String(r['Nazwa EN'] ?? '');
  const role = String(r['Rola'] ?? r['Rola (linia)'] ?? '');
  const isSuper = r['Super-jednostka'] === 'TAK';
  const cat = categoryOf(pl, role, isSuper, r['Typ'] as string | undefined);
  const sPl = signature(U.buildUnitModel(cat, OWNER_A, pl));
  const sEn = signature(U.buildUnitModel(cat, OWNER_A, en));
  records.push({
    pl, en, category: cat, epoka: r['Epoka'], kultura: r['Kultura'], super: isSuper,
    normPl: U.normName(pl), normEn: U.normName(en),
    culturePl: U.cultureFromName(pl), cultureEn: U.cultureFromName(en),
    sigPl: sPl, sigEn: sEn,
  });
}
// Civilians (CIVILIAN_TYPE_IDS minus Zwiadowca, which is a units.json row).
for (const [pl, cat] of [['Osadnik', 'osadnik'], ['Robotnik', 'robotnik']] as const) {
  const s = signature(U.buildUnitModel(cat, OWNER_A, pl));
  records.push({ pl, en: null, category: cat, civilian: true, normPl: U.normName(pl), culturePl: U.cultureFromName(pl), sigPl: s, sigEn: null });
}

// Extra name vectors for normName / cultureFromName / buildNamedUnit coverage
// (incl. the 5 named-but-unused models and the SUPER whitelist).
const extraNames = ['', 'Wojownik celtycki', 'Celtic Warrior', 'Kusznik', 'Crossbowman', 'Wojownik germański zwykły',
  'Germanic Warrior', 'Hieros Lochos', 'Sacred Band', 'Legion Rzymski', 'Roman Legion', 'Legion', 'Berserker',
  'ŁUCZNIK', 'Łódź', 'Zażółć gęślą jaźń', 'Évocati', 'Triarii', 'hoplita', 'Impi', 'Rydwan (woły)', 'Rydwan woły',
  // already-decomposed input (base letter + U+0301 / U+0328): normName must drop the marks
  'Évocati', 'Wlócznik sumeryjski', 'Łąka',
  // a 'legion' name that a later rule would catch: the explicit fall-through (units.ts:1681) must win
  'Legion z maczugą (Chaska)', 'Legion hastati',
  // 'ink' without 'inka' (cultureFromName units.ts:1018)
  'Wojownik Inków',
  'royal guard sumer', 'Królewska Gwardia', 'Gwardia Królewska Sumeru', 'Inka', 'Qurubuti'];
const names: unknown[] = [];
for (const n of extraNames) names.push({ name: n, norm: U.normName(n), culture: U.cultureFromName(n) });
const namedSigs: unknown[] = [];
for (const n of extraNames) {
  const named = U.buildNamedUnit(U.normName(n), OWNER_A);
  namedSigs.push({ name: n, sig: named ? signature(named) : null });
}

// ------------------------------------------------------------- part catalogues
// Every `function getGeo*` of units.ts (88) and kon-nowy-model.ts (20), and the
// p1 singleton registry (filled by the p1 cases above).
const partRec = (g: THREE.BufferGeometry) => ({
  type: g.type,
  // ShapeGeometry parameters carry a random `uuid` (Shape.toJSON): omitted so
  // the fixture is reproducible; the geometry itself is covered by `hash`.
  params: g.type === 'ShapeGeometry' ? null : ((g as unknown as { parameters?: unknown }).parameters ?? null),
  vtx: g.getAttribute('position').count,
  tri: triCount(g),
  hash: geoHash(g),
});
const parts: Record<string, unknown> = {};
for (const [k, f] of Object.entries(U as Record<string, unknown>)) {
  if (k.startsWith('getGeo') && typeof f === 'function') parts[`units:${k}`] = partRec((f as () => THREE.BufferGeometry)());
}
for (const [k, f] of Object.entries(K as Record<string, unknown>)) {
  if (k.startsWith('getGeo') && typeof f === 'function') parts[`kon:${k}`] = partRec((f as () => THREE.BufferGeometry)());
}
for (const [k, g] of Object.entries((P1 as unknown as { p1Geos: Record<string, THREE.BufferGeometry> }).p1Geos)) {
  parts[`p1:${k}`] = partRec(g);
}
out['parts'] = parts;

// buildUnitModel('super', owner, name): SUPER_Z_MODELEM_NAZWANYM whitelist and
// buildSuperUnit culture dispatch (units.ts:1088-1110, 4807-4825).
const superNames = ['Qurubuti', 'qurubuti z miastem', 'Evocati', 'Triari', 'Triarii', 'Hieros Lochos', 'Wojownik germański',
  'Hu Ben Wei', 'Tiger Guard', 'White Shields', 'Medjay', 'Royal Guard', 'Sumerian Royal Guard', 'Gwardia Faraona',
  'Nieznany super', 'Legion', 'Hastati', 'Falanga', 'Wojownik celtycki', 'Impi', 'Chaska', 'Wojownik Inków', ''];
out['superSigs'] = superNames.map((n) => ({ name: n, sig: signature(U.buildUnitModel('super', OWNER_A, n)) }));

out['owner'] = { a: OWNER_A, b: OWNER_B };
out['cases'] = cases;
out['records'] = records;
out['names'] = names;
out['namedSigs'] = namedSigs;

const dir = process.argv[2] ?? '.';
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'unit_core.json'), JSON.stringify(out));
console.log(`unit_core cases=${Object.keys(cases).length} records=${records.length} names=${names.length}`);
