// R-RUSTPORT-P4-20-MOD11-IMPROVEMENTS-Q1 — generator of improvement / resource model
// reference vectors (MOD-11 of P4-4-MODEL-CATALOG.md).
//
// Run ONLY outside the repository (scratch dir), see README.md. The esbuild bundle links:
//  - three@0.169.0 (npm, version pinned by gra/package-lock.json at edb8fb56),
//  - web modules from `git archive edb8fb56 gra/src gra/data`, IMPORTED UNCHANGED:
//    render/improvements.ts, render/robloxImprovements.ts, render/ulepszenia-modele-p2.ts,
//    render/ulepszenia-modele-p3a.ts, render/ulepszenia-modele-p3b.ts,
//    render/kopalnia-cyny-opus5.ts, render/kopalnia-zlota-opus5.ts, render/droga-6-ramion.ts,
//    render/pastwisko-modele.ts, render/swinia-trzoda.ts, render/styleResources.ts,
//    render/mapRenderStyle.ts (buildStyleTarasyTerrace), map/road-network.ts, types/hex.ts
//    (and their own imports, e.g. render/kon-nowy-model.ts, render/hexutil.ts).
// No web code is copied: the generator only calls the web API and dumps the object
// graph (THREE.Group / THREE.Mesh, no WebGLRenderer).
// Exception (section 6 only, legacy.json): the uncalled `rbx*` builders and `addCyl` of
// robloxImprovements.ts are not exported, so the scratch copy gets ONE appended line,
// legacy-export.txt (an `export { … }` list; no statement of the module changes). Without
// that line section 6 is skipped and models/sigs/data/protokeys.json are byte-identical.
// Output: JSON files in the directory given as argv[2].

import * as THREE from 'three';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { Nakladka } from '../websrc/gra/src/types/hex';
import {
  buildImprovement, buildImprovementSectored, buildImprovementStack, IMPROVEMENTS, SECTOR_R_ELEVATED,
} from '../websrc/gra/src/render/improvements';
import { buildRobloxFoodStack, buildRobloxImprovement } from '../websrc/gra/src/render/robloxImprovements';
import * as RI from '../websrc/gra/src/render/robloxImprovements';
import {
  buildStyledResourceOverlay, placeLivestockPair, placeLivestockFigure, buildStyledCow, buildStyledSheep,
  LIVESTOCK_FIGURE_SCALE,
} from '../websrc/gra/src/render/styleResources';
import {
  buildFarma, buildKopalnia, buildKamieniolom, buildTartak, buildZagrodaDodatki,
} from '../websrc/gra/src/render/ulepszenia-modele-p2';
import {
  buildWyrab, buildObozLowiecki, buildGlinianka, buildWarzelniaSoli, buildLodzieRybackie, buildStadnina,
} from '../websrc/gra/src/render/ulepszenia-modele-p3a';
import {
  buildIrygacja, buildPoleIrygowane, buildFort, buildPosterunek, buildZlozeKlaster,
  buildZlozeMiedz, buildZlozeZelazo, buildZlozeWegiel, buildZlozeSol, buildZlozeZloto, buildZlozeCyna,
  buildZlozeGlina,
} from '../websrc/gra/src/render/ulepszenia-modele-p3b';
import { buildKopalniaZlota } from '../websrc/gra/src/render/kopalnia-zlota-opus5';
import { buildKopalniaCyny } from '../websrc/gra/src/render/kopalnia-cyny-opus5';
import { buildDrogaGwiazda } from '../websrc/gra/src/render/droga-6-ramion';
import {
  buildKrowa, buildOwca, buildLama, buildPastwiskoZwierzeta, buildZlozeKrowy, buildZlozeOwce, PASTWISKO_S,
  PASTWISKO_LAYOUT,
} from '../websrc/gra/src/render/pastwisko-modele';
import { buildSwinia, buildTrzoda, TRZODA_LAYOUT } from '../websrc/gra/src/render/swinia-trzoda';
import { buildStyleTarasyTerrace } from '../websrc/gra/src/render/mapRenderStyle';
import {
  roadPortRotationY, roadArmLength, roadMaskArms, roadMaskHasNode, roadMaskIsLonePatch, ROAD_ARM_WIDTH_RATIO,
  ROAD_NODE_RADIUS_RATIO,
} from '../websrc/gra/src/map/road-network';

const OUT = process.argv[2];
if (!OUT) throw new Error('usage: node improvements_gen.mjs <outdir>');
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

// FNV-1a 32-bit over little-endian bytes.
class Fnv {
  h = 0x811c9dc5;
  u32(u: number): void {
    for (let k = 0; k < 4; k++) {
      this.h ^= (u >>> (8 * k)) & 0xff;
      this.h = Math.imul(this.h, 0x01000193) >>> 0;
    }
  }
  private dv = new DataView(new ArrayBuffer(8));
  f64(v: number): void {
    this.dv.setFloat64(0, v, true);
    this.u32(this.dv.getUint32(0, true));
    this.u32(this.dv.getUint32(4, true));
  }
}

// Geometry hash: Float32 words of position, normal, uv (if present), index values, groups.
function fnvGeometry(geo: THREE.BufferGeometry): number {
  const f = new Fnv();
  for (const name of ['position', 'normal', 'uv']) {
    const a = geo.getAttribute(name) as THREE.BufferAttribute | undefined;
    if (!a) continue;
    const arr = a.array as Float32Array;
    const u = new Uint32Array(arr.buffer, arr.byteOffset, arr.length);
    for (let i = 0; i < u.length; i++) f.u32(u[i]!);
  }
  const idx = geo.getIndex();
  if (idx) for (let i = 0; i < idx.array.length; i++) f.u32(idx.array[i]! >>> 0);
  for (const g of geo.groups) { f.u32(g.start); f.u32(g.count); f.u32(g.materialIndex ?? 0); }
  return f.h >>> 0;
}

function geoDesc(geo: any): any {
  const p = geo.parameters;
  switch (geo.type) {
    case 'BoxGeometry': return { type: 'box', w: p.width, h: p.height, d: p.depth };
    case 'CylinderGeometry': return { type: 'cyl', rt: p.radiusTop, rb: p.radiusBottom, h: p.height, seg: p.radialSegments, open: p.openEnded };
    case 'ConeGeometry': return { type: 'cone', r: p.radius, h: p.height, seg: p.radialSegments };
    case 'IcosahedronGeometry': return { type: 'ico', r: p.radius, detail: p.detail };
    case 'DodecahedronGeometry': return { type: 'dodeca', r: p.radius, detail: p.detail };
    default: throw new Error('unexpected geometry ' + geo.type);
  }
}

function matDesc(mat: any): any {
  const c = mat.color, e = mat.emissive;
  if (mat.type === 'MeshLambertMaterial') {
    return { type: 'L', hex: c.getHex(), lin: [c.r, c.g, c.b], flat: mat.flatShading, em: [e.r, e.g, e.b] };
  }
  if (mat.type === 'MeshStandardMaterial') {
    return { type: 'S', hex: c.getHex(), lin: [c.r, c.g, c.b], flat: mat.flatShading, metal: mat.metalness, rough: mat.roughness, em: [e.r, e.g, e.b] };
  }
  throw new Error('unexpected material ' + mat.type);
}

function udDesc(o: THREE.Object3D): any {
  const ud = o.userData as any;
  const keys = Object.keys(ud);
  if (keys.length === 0) return undefined;
  for (const k of keys) if (!['mats', 'perTokenGeos', 'depositDisplayScale'].includes(k)) throw new Error('unexpected userData ' + k);
  return {
    mats: Array.isArray(ud.mats) ? ud.mats.length : -1,
    geos: Array.isArray(ud.perTokenGeos) ? ud.perTokenGeos.length : -1,
    dds: typeof ud.depositDisplayScale === 'number' ? ud.depositDisplayScale : 0,
  };
}

// Full graph + signature. The signature is an FNV-1a over exactly the dumped scalars
// (same order as tests/improvements_web_parity.rs `signature`).
function dumpModel(g: THREE.Group): any {
  g.updateMatrixWorld(true);
  const mats: THREE.Material[] = [];
  const nodes: any[] = [];
  const index = new Map<THREE.Object3D, number>();
  let vertices = 0;
  let triangles = 0;
  g.traverse((o) => {
    const node: any = {
      t: (o as any).isMesh ? 'M' : 'G',
      parent: o.parent && index.has(o.parent) ? index.get(o.parent) : -1,
      p: [o.position.x, o.position.y, o.position.z],
      q: [o.quaternion.x, o.quaternion.y, o.quaternion.z, o.quaternion.w],
      s: [o.scale.x, o.scale.y, o.scale.z],
      cs: o.castShadow,
      rs: o.receiveShadow,
      w: Array.from(o.matrixWorld.elements),
      ud: udDesc(o),
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
      const idx = geo.getIndex();
      node.ni = idx ? idx.count : -1;
      node.hash = fnvGeometry(geo);
      vertices += node.nv;
      triangles += (idx ? idx.count : node.nv) / 3;
    }
    nodes.push(node);
  });
  const materials = mats.map(matDesc);
  const bb = new THREE.Box3().setFromObject(g, true);
  const f = new Fnv();
  for (const n of nodes) {
    f.u32(n.t === 'M' ? 1 : 0);
    f.u32(n.parent + 1);
    for (const v of n.p) f.f64(v);
    for (const v of n.q) f.f64(v);
    for (const v of n.s) f.f64(v);
    f.u32(n.cs ? 1 : 0);
    f.u32(n.rs ? 1 : 0);
    for (const v of n.w) f.f64(v);
    if (n.ud) { f.u32(1); f.u32(n.ud.mats + 1); f.u32(n.ud.geos + 1); f.f64(n.ud.dds); } else f.u32(0);
    if (n.t === 'M') { f.u32(n.hash); f.u32(n.nv); f.u32(n.ni + 1); f.u32(n.mat); }
  }
  f.u32(materials.length);
  for (const m of materials) {
    f.u32(m.type === 'S' ? 1 : 0);
    for (const v of m.lin) f.f64(v);
    f.u32(m.flat ? 1 : 0);
    f.f64(m.type === 'S' ? m.metal : 0);
    f.f64(m.type === 'S' ? m.rough : 0);
    for (const v of m.em) f.f64(v);
  }
  return {
    materials,
    nodes,
    meshes: nodes.filter((n) => n.t === 'M').length,
    vertices,
    triangles,
    bbox: bb.isEmpty() ? null : [bb.min.x, bb.min.y, bb.min.z, bb.max.x, bb.max.y, bb.max.z],
    sig: f.h >>> 0,
  };
}

function compact(d: any): any {
  return { nodes: d.nodes.length, meshes: d.meshes, vertices: d.vertices, triangles: d.triangles, bbox: d.bbox, sig: d.sig };
}

const full: any[] = [];
const sigs: any[] = [];
const F = (name: string, g: THREE.Group | null) => full.push({ name, model: g ? dumpModel(g) : null });
const C = (name: string, g: THREE.Group | null) => sigs.push({ name, model: g ? compact(dumpModel(g)) : null });

// ---------------------------------------------------------------------------
// 1) buildImprovement — every ImprovementKey + odd keys.
const KEYS = [
  'droga', 'droga_brukowana', 'farma', 'bydlo', 'owce', 'lama', 'stadnina', 'kopalnia_zelaza', 'kamieniolom',
  'oboz_lowiecki', 'wyrab', 'tartak', 'irygacja', 'pole_irygowane', 'glinianka', 'tarasy', 'lodzie_rybackie',
  'warzelnia_soli', 'fort', 'posterunek', 'pastwisko', 'kopalnia_miedzi', 'kopalnia_zlota', 'kopalnia_cyny',
];
for (const k of KEYS) F(`imp:${k}`, buildImprovement(k as any));
for (const k of ['fort', 'posterunek']) {
  for (const o of [0x8e24aa, 0x1234abcd, 0, -1]) F(`imp:${k}:${o}`, buildImprovement(k as any, o));
}
for (const k of ['nieznane', 'brak', '', 'toString']) F(`imp:${k}`, buildImprovement(k as any));
F('rbx:farma', buildRobloxImprovement('farma' as any));

// 2) Building blocks.
F('p2:farma:default', buildFarma());
F('p2:farma:solo', buildFarma({ wariant: 'solo' }));
F('p2:farma:pastwisko', buildFarma({ wariant: 'pastwisko' }));
F('p2:kopalnia', buildKopalnia());
F('p2:kamieniolom', buildKamieniolom());
F('p2:tartak', buildTartak());
F('p2:zagroda:1', buildZagrodaDodatki());
F('p2:zagroda:0.8', buildZagrodaDodatki(0.8));
F('p3a:wyrab', buildWyrab());
F('p3a:oboz', buildObozLowiecki());
F('p3a:glinianka', buildGlinianka());
F('p3a:warzelnia', buildWarzelniaSoli());
F('p3a:lodzie', buildLodzieRybackie());
for (const n of [undefined, 0, 1, 2, 3]) F(`p3a:stadnina:${n}`, buildStadnina(n));
F('p3b:irygacja', buildIrygacja());
F('p3b:pole', buildPoleIrygowane());
F('p3b:fort:default', buildFort());
F('p3b:fort:green', buildFort(0x00ff00));
F('p3b:posterunek:default', buildPosterunek());
F('p3b:posterunek:big', buildPosterunek(0x7fabcdef));
for (const t of ['miedz', 'zelazo', 'wegiel', 'sol', 'glina', 'zloto', 'cyna', 'inne']) {
  for (const du of [0, 0.9, 0.5]) F(`p3b:klaster:${t}:${du}`, buildZlozeKlaster(t as any, du));
}
F('p3b:klaster:miedz:default', buildZlozeKlaster('miedz'));
F('p3b:zloze:miedz', buildZlozeMiedz());
F('p3b:zloze:zelazo', buildZlozeZelazo());
F('p3b:zloze:wegiel', buildZlozeWegiel());
F('p3b:zloze:sol', buildZlozeSol());
F('p3b:zloze:zloto', buildZlozeZloto());
F('p3b:zloze:cyna', buildZlozeCyna());
F('p3b:zloze:glina', buildZlozeGlina());
F('kop:zlota', buildKopalniaZlota());
F('kop:cyny', buildKopalniaCyny());
F('kop:zlota:2', buildKopalniaZlota());
F('kop:cyny:2', buildKopalniaCyny());
for (const poza of [undefined, 'stojaca', 'pasaca']) for (const wariant of [undefined, 'lacata', 'brazowa']) {
  F(`past:krowa:${poza}:${wariant}`, buildKrowa({ poza: poza as any, wariant: wariant as any }));
}
for (const poza of [undefined, 'stojaca', 'skubiaca']) for (const wariant of [undefined, 'biala', 'czarna']) {
  F(`past:owca:${poza}:${wariant}`, buildOwca({ poza: poza as any, wariant: wariant as any }));
}
F('past:krowa:noopts', buildKrowa());
F('past:owca:noopts', buildOwca());
F('past:lama', buildLama());
F('past:zwierzeta:1', buildPastwiskoZwierzeta());
F('past:zwierzeta:1.3', buildPastwiskoZwierzeta(1.3));
F('past:zlozeKrowy', buildZlozeKrowy());
F('past:zlozeKrowy:0.7', buildZlozeKrowy(0.7));
F('past:zlozeOwce', buildZlozeOwce());
F('past:zlozeOwce:0.9', buildZlozeOwce(0.9));
for (const poza of [undefined, 'stojaca', 'ryjaca']) for (const wariant of [undefined, 'rozowa', 'laciata']) {
  F(`swin:swinia:${poza}:${wariant}`, buildSwinia({ poza: poza as any, wariant: wariant as any }));
}
F('swin:swinia:noopts', buildSwinia());
F('swin:trzoda:noopts', buildTrzoda());
for (const j of ['niska', 'normalna', 'wysoka']) F(`swin:trzoda:${j}`, buildTrzoda({ jakosc: j as any }));
F('swin:trzoda:hexR0.75', buildTrzoda({ hexR: 0.75 }));
F('taras:0.88', buildStyleTarasyTerrace('roblox', false, 0.88));
F('taras:lite:1', buildStyleTarasyTerrace('roblox', true, 1));
F('taras:1', buildStyleTarasyTerrace('roblox'));
F('styled:cow', buildStyledCow());
F('styled:sheep', buildStyledSheep());
{
  const g = new THREE.Group(); placeLivestockPair(g, 'cow', 0.1, -0.2, 'roblox'); F('styled:pair:cow', g);
}
{
  const g = new THREE.Group(); placeLivestockPair(g, 'sheep', -0.3, 0.05, 'roblox'); F('styled:pair:sheep', g);
}
{
  const g = new THREE.Group(); placeLivestockFigure(g, 'cow', 0.2, 0.3, 1.1, 'roblox', 2); F('styled:fig:cow:2', g);
}
{
  const g = new THREE.Group(); placeLivestockFigure(g, 'sheep', 0, 0, -0.4, 'roblox'); F('styled:fig:sheep', g);
}
const NAKL = [Nakladka.Brak, Nakladka.Las, Nakladka.ZlozeGliny, Nakladka.ZlozeRudy, Nakladka.ZlozeKonia,
  Nakladka.ZlozeOwiec, Nakladka.ZlozeBydla, Nakladka.ZlozeLamy];
const ZLOZA = [undefined, 'miedz', 'zelazo', 'wegiel', 'sol', 'zloto', 'cyna', 'glina', 'konie', 'owce', 'bydlo', 'xyz', ''];
for (const n of NAKL) for (const z of ZLOZA) {
  const fromNak = ![Nakladka.Brak, Nakladka.Las].includes(n);
  if (fromNak && z !== undefined && z !== 'miedz') continue; // nakladka wins; one zloze per nakladka is enough
  F(`res:${n}:${z ?? 'undefined'}`, buildStyledResourceOverlay(n, 'roblox', z));
}

// 3) Roads: every mask, both types (compact); full dumps for a few.
for (const typ of ['droga', 'droga_brukowana'] as const) {
  for (let mask = 0; mask < 64; mask++) C(`road:${typ}:${mask}:1`, buildDrogaGwiazda(typ, mask));
  for (const mask of [0, 1, 7, 63, 64 + 5]) C(`road:${typ}:${mask}:0.8`, buildDrogaGwiazda(typ, mask, 0.8));
  for (const mask of [0, 5, 63]) F(`road:${typ}:${mask}`, buildDrogaGwiazda(typ, mask));
}

// 4) Sectored layout (compact).
const f1 = (x: number, z: number) => 0.2 + 0.1 * x - 0.05 * z + 0.02 * x * z;
const f2 = (x: number, _z: number) => -0.1 + x * 0.01;
const f3 = (_x: number, _z: number) => NaN;
const SECT: Array<{ name: string; keys: string[]; owner?: number; hexR?: number; relief?: any; mask?: number }> = [];
for (const k of KEYS) SECT.push({ name: k, keys: [k] });
SECT.push(
  { name: 'droga-only', keys: ['droga'] },
  { name: 'bruk+droga', keys: ['droga_brukowana', 'droga'] },
  { name: 'mix-mask5', keys: ['droga', 'farma', 'kopalnia_zelaza', 'fort'], mask: 0b000101 },
  { name: 'mix-mask0', keys: ['droga_brukowana', 'kamieniolom'], mask: 0 },
  { name: 'farm-overlays', keys: ['farma', 'irygacja', 'tarasy'] },
  { name: 'kam+kop', keys: ['kamieniolom', 'kopalnia_miedzi'] },
  { name: 'animals', keys: ['bydlo', 'owce', 'lama', 'pastwisko'] },
  { name: 'forts', keys: ['fort', 'posterunek'] },
  { name: 'forest', keys: ['tartak', 'wyrab', 'oboz_lowiecki'] },
  { name: 'brak', keys: ['brak', '', 'farma'] },
  { name: 'unknown', keys: ['nieznane'] },
  { name: 'dup', keys: ['farma', 'farma'] },
  { name: 'empty', keys: [] },
  { name: 'all', keys: [...KEYS] },
  { name: 'hexR1.3', keys: ['farma', 'kopalnia_zlota', 'droga'], hexR: 1.3 },
  { name: 'elev-f1', keys: ['kopalnia_cyny', 'kamieniolom', 'bydlo'], relief: { sectorR: SECTOR_R_ELEVATED, surfaceY: f1 } },
  { name: 'f2', keys: ['kopalnia_zelaza', 'stadnina', 'lodzie_rybackie'], relief: { surfaceY: f2 } },
  { name: 'f3', keys: ['glinianka', 'warzelnia_soli'], relief: { surfaceY: f3 } },
  { name: 'sectorR0.5', keys: ['fort', 'farma'], relief: { sectorR: 0.5 } },
  { name: 'owner', keys: ['fort', 'posterunek', 'owce'], owner: 0x8e24aa },
);
for (const s of SECT) {
  C(`sect:${s.name}`, buildImprovementSectored(s.keys, s.owner, undefined, s.hexR, s.relief, s.mask));
}
F('sect-full:mix-mask5', buildImprovementSectored(['droga', 'farma', 'kopalnia_zelaza', 'fort'], undefined, undefined, undefined, undefined, 0b000101));
F('sect-full:elev-f1', buildImprovementSectored(['kopalnia_cyny', 'kamieniolom', 'bydlo'], undefined, undefined, undefined, { sectorR: SECTOR_R_ELEVATED, surfaceY: f1 }));

// 5) Stack + food stack (compact).
const FOOD = ['farma', 'irygacja', 'bydlo', 'owce'];
for (let bits = 0; bits < 16; bits++) {
  const ks = FOOD.filter((_, i) => bits & (1 << i));
  C(`food:${ks.join('+') || '-'}`, buildRobloxFoodStack(ks));
  C(`stack:${ks.join('+') || '-'}`, buildImprovementStack(ks));
  C(`stack:${ks.join('+') || '-'}+fort`, buildImprovementStack([...ks, 'fort'], 0x8e24aa));
}
C('food:brak+fort', buildRobloxFoodStack(['brak', 'fort']));
C('food:owce+bydlo+brak', buildRobloxFoodStack(['owce', '', 'bydlo', 'brak']));
C('stack:farma+irygacja+kamieniolom', buildImprovementStack(['farma', 'irygacja', 'kamieniolom']));
C('stack:tartak+fort', buildImprovementStack(['tartak', 'fort']));
C('stack:pole+pastwisko', buildImprovementStack(['pole_irygowane', 'pastwisko']));
C('stack:brak', buildImprovementStack(['brak', '']));
C('stack:farma+farma+owce', buildImprovementStack(['farma', 'farma', 'owce', 'droga']));
F('stack-full:farma+bydlo+owce+fort', buildImprovementStack(['farma', 'bydlo', 'owce', 'fort']));

// 6) Uncalled `rbx*` builders + `addCyl` (D-MOD-3 = B). The web module does not export
// them; they exist on `RI` only when the scratch copy has the one line from README.md
// ("legacy export") appended. Without it nothing is written for this section, and the
// other three files are byte-identical either way (an `export` list changes no code).
const LEGACY = [
  'rbxDroga', 'rbxDrogaBrukowana', 'rbxFarma', 'rbxPastwisko', 'rbxKopalnia', 'rbxKamieniolom',
  'rbxObozLowiecki', 'rbxWyrab', 'rbxTartak', 'rbxPoleIrygowane', 'rbxGlinianka', 'rbxLodzie',
  'rbxWarzelniaSoli', 'rbxFort', 'rbxPosterunek',
];
const RIX = RI as any;
const legacy: any[] = [];
if (LEGACY.every((n) => typeof RIX[n] === 'function') && typeof RIX['addCyl'] === 'function') {
  const L = (name: string, g: THREE.Group) => legacy.push({ name, model: dumpModel(g) });
  for (const n of LEGACY) {
    const owners = n === 'rbxFort' || n === 'rbxPosterunek' ? [0xffd54a, 0x8e24aa, 0x1234abcd, 0, -1] : [undefined];
    for (const o of owners) {
      const g = new THREE.Group();
      RIX[n](g, o);
      L(o === undefined ? `legacy:${n}` : `legacy:${n}:${o}`, g);
    }
  }
  { const g = new THREE.Group(); RIX['addCyl'](g, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0x123456); L('legacy:addCyl:default', g); }
  { const g = new THREE.Group(); RIX['addCyl'](g, 0.3, 0.1, 0.25, -0.2, 0.05, 0.7, 0xabcdef, 9); L('legacy:addCyl:9', g); }
}

// 7) Z6: keys that are names of `Object.prototype` members. `BUILDERS[key]` then finds the
// inherited member; record whether the web throws (message) or returns a group (full dump).
const PROTO_KEYS = ['__proto__', 'hasOwnProperty', 'valueOf', '__defineGetter__', 'constructor', 'toString',
  'isPrototypeOf', 'propertyIsEnumerable', 'toLocaleString', '__lookupGetter__', '__defineSetter__', '__lookupSetter__'];
const protoKeys: any[] = [];
for (const k of PROTO_KEYS) {
  try {
    protoKeys.push({ key: k, threw: null, model: dumpModel(buildImprovement(k as any)) });
  } catch (e: any) {
    protoKeys.push({ key: k, threw: String(e && e.message), model: null });
  }
}

// ---------------------------------------------------------------------------
const data = {
  improvements: IMPROVEMENTS,
  keys: KEYS,
  sectorRElevated: SECTOR_R_ELEVATED,
  pastwiskoS: PASTWISKO_S,
  pastwiskoSloty: PASTWISKO_LAYOUT.sloty,
  trzodaSloty: TRZODA_LAYOUT.sloty,
  livestockScale: LIVESTOCK_FIGURE_SCALE,
  road: {
    armWidth: ROAD_ARM_WIDTH_RATIO,
    nodeRadius: ROAD_NODE_RADIUS_RATIO,
    armLength: roadArmLength(),
    armLength08: roadArmLength(0.8),
    portRotY: [0, 1, 2, 3, 4, 5, 6].map((d) => roadPortRotationY(d)),
    masks: Array.from({ length: 64 }, (_, m) => ({ arms: roadMaskArms(m), node: roadMaskHasNode(m), lone: roadMaskIsLonePatch(m) })),
  },
};
fs.writeFileSync(path.join(OUT, 'data.json'), ser(data));
fs.writeFileSync(path.join(OUT, 'models.json'), ser({ models: full }));
fs.writeFileSync(path.join(OUT, 'sigs.json'), ser({ models: sigs }));
fs.writeFileSync(path.join(OUT, 'protokeys.json'), ser({ keys: protoKeys }));
if (legacy.length > 0) fs.writeFileSync(path.join(OUT, 'legacy.json'), ser({ models: legacy }));
console.log(`improvements full=${full.length} sigs=${sigs.length} legacy=${legacy.length}`);
