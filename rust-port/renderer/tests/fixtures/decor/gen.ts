// R-RUSTPORT-P4-17-MOD03-TERRAIN-DECOR-Q1 — generator of terrain-decor reference vectors.
//
// Run ONLY outside the repository (scratch dir), see README.md. The esbuild bundle links:
//  - three@0.169.0 (npm, version pinned by gra/package-lock.json at edb8fb56),
//  - web modules from `git archive edb8fb56 gra/src gra/data`, IMPORTED UNCHANGED:
//    render/lasy-modele.ts, render/djungla-modele.ts, render/teren-gory-wzgorza.ts,
//    render/dekor-laki-rowniny.ts, render/oaza-pustynia.ts, render/tarasy-model.ts,
//    render/mapRenderStyle.ts (+ its imports types/hex, map/gen-helpers, render/hexutil),
//    render/riverLod.ts (+ three/examples/jsm/utils/BufferGeometryUtils.js).
// No web code is copied: the generator only calls the web API (no WebGLRenderer) and dumps
// geometries / object graphs / return values.
// Output: JSON files in the directory given as argv[2].

import * as THREE from 'three';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { TerenBazowy } from '../websrc/gra/src/types/hex';
import { axialToWorld } from '../websrc/gra/src/render/hexutil';
import * as Las from '../websrc/gra/src/render/lasy-modele';
import * as Dj from '../websrc/gra/src/render/djungla-modele';
import * as Tg from '../websrc/gra/src/render/teren-gory-wzgorza';
import * as Dk from '../websrc/gra/src/render/dekor-laki-rowniny';
import * as Oz from '../websrc/gra/src/render/oaza-pustynia';
import * as Ta from '../websrc/gra/src/render/tarasy-model';
import * as Ms from '../websrc/gra/src/render/mapRenderStyle';
import * as Rl from '../websrc/gra/src/render/riverLod';

const OUT = process.argv[2];
if (!OUT) throw new Error('usage: node decor_gen.mjs <outdir>');
fs.mkdirSync(OUT, { recursive: true });

// ---------------------------------------------------------------------------
// Serializer: like JSON.stringify, but keeps the sign of -0 (JSON.stringify(-0) === "0").
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
function write(name: string, v: any): void {
  fs.writeFileSync(path.join(OUT, name), ser(v) + '\n');
}

// Float32Array → u32 bit patterns (exact, compact).
function bits(a: ArrayLike<number> | undefined): number[] | null {
  if (!a) return null;
  const f = a instanceof Float32Array ? a : new Float32Array(Array.from(a));
  return Array.from(new Uint32Array(f.buffer, f.byteOffset, f.length));
}

// FNV-1a 32-bit over: Float32 words of position, normal, uv, color (each only if present),
// then index values (u32), then groups (start, count, materialIndex).
function fnvGeometry(geo: THREE.BufferGeometry): number {
  let h = 0x811c9dc5;
  const feed = (u: number) => {
    for (let k = 0; k < 4; k++) {
      h ^= (u >>> (8 * k)) & 0xff;
      h = Math.imul(h, 0x01000193) >>> 0;
    }
  };
  for (const name of ['position', 'normal', 'uv', 'color']) {
    const a = geo.getAttribute(name) as THREE.BufferAttribute | undefined;
    if (!a) continue;
    const f = a.array as Float32Array;
    const u = new Uint32Array(f.buffer, f.byteOffset, f.length);
    for (let i = 0; i < u.length; i++) feed(u[i]!);
  }
  const idx = geo.getIndex();
  if (idx) for (let i = 0; i < idx.array.length; i++) feed(idx.array[i]! >>> 0);
  for (const g of geo.groups) { feed(g.start); feed(g.count); feed(g.materialIndex ?? 0); }
  return h >>> 0;
}

function geoSummary(geo: THREE.BufferGeometry): any {
  const pos = geo.getAttribute('position');
  return {
    type: geo.type,
    v: pos ? pos.count : 0,
    i: geo.getIndex() ? geo.getIndex()!.count : null,
    attrs: ['position', 'normal', 'uv', 'color'].filter((n) => !!geo.getAttribute(n)),
    groups: geo.groups.length,
    hash: fnvGeometry(geo),
  };
}

function matDesc(m: any): any {
  if (m.type !== 'MeshLambertMaterial') throw new Error('unexpected material ' + m.type);
  return { type: 'lambert', hex: m.color.getHex(), lin: [m.color.r, m.color.g, m.color.b], flat: m.flatShading, vc: m.vertexColors };
}

function dumpObject(root: THREE.Object3D | null): any {
  if (root === null) return null;
  root.updateMatrixWorld(true);
  const nodes: any[] = [];
  const index = new Map<THREE.Object3D, number>();
  root.traverse((o) => {
    index.set(o, nodes.length);
    const n: any = {
      type: (o as any).isMesh ? 'Mesh' : (o as any).isGroup ? 'Group' : 'Object3D',
      parent: o === root ? -1 : index.get(o.parent!),
      name: o.name,
      ro: o.renderOrder,
      pos: [o.position.x, o.position.y, o.position.z],
      rot: [o.rotation.x, o.rotation.y, o.rotation.z, o.rotation.order],
      scale: [o.scale.x, o.scale.y, o.scale.z],
      cast: o.castShadow,
      recv: o.receiveShadow,
      mw: Array.from(o.matrixWorld.elements),
    };
    if ((o as any).isMesh) {
      const m = o as THREE.Mesh;
      if (Array.isArray(m.material)) throw new Error('material array');
      n.mat = matDesc(m.material);
      n.geo = geoSummary(m.geometry);
    }
    nodes.push(n);
  });
  const box = new THREE.Box3().setFromObject(root, true);
  return { nodes, box: [box.min.x, box.min.y, box.min.z, box.max.x, box.max.y, box.max.z] };
}

function dumpGeometry(name: string, geo: THREE.BufferGeometry): any {
  return {
    name,
    gname: geo.name,
    v: geo.getAttribute('position').count,
    pos: bits(geo.getAttribute('position').array as Float32Array),
    nor: bits(geo.getAttribute('normal').array as Float32Array),
    col: bits(geo.getAttribute('color').array as Float32Array),
    hash: fnvGeometry(geo),
  };
}

// ---------------------------------------------------------------------------
// 1. powierzchniaReliefuY FIRST (before anything could touch the shared geometries).
const reliefSamples: any[] = [];
let rst = 0x2545f491;
{
  const rots = [0, 1, 2, 3, 4, 5].map((k) => k * (Math.PI / 3)).concat([0.3, -1.1]);
  const pts: number[] = [];
  for (let i = -4; i <= 4; i++) pts.push(i * 0.25);
  for (const typ of ['wzgorze', 'gora'] as const) {
    for (const w of [0, 1, 2, 3, 4, -1, 7]) {
      for (const rot of rots) {
        const ys: number[] = [];
        for (const x of pts) for (const z of pts) ys.push(Tg.powierzchniaReliefuY(typ, w, rot, x, z));
        // + 150 pseudo-random points in [-1.05, 1.05]^2 (recorded, replayed by the test)
        const rp: number[] = [];
        const rys: number[] = [];
        for (let k = 0; k < 150; k++) {
          rst = (Math.imul(rst, 1664525) + 1013904223) >>> 0;
          const x = (rst / 4294967296) * 2.1 - 1.05;
          rst = (Math.imul(rst, 1664525) + 1013904223) >>> 0;
          const z = (rst / 4294967296) * 2.1 - 1.05;
          rp.push(x, z);
          rys.push(Tg.powierzchniaReliefuY(typ, w, rot, x, z));
        }
        reliefSamples.push({ typ, w, rot, ys, rp, rys });
      }
    }
  }
}
const samplers: any[] = [];
{
  const terrs = [TerenBazowy.Wzgorza, TerenBazowy.Gory, TerenBazowy.Laka, TerenBazowy.Morze];
  const pts: Array<[number, number]> = [[0, 0], [0.3, -0.2], [-0.55, 0.4], [0.7, 0.1], [-0.2, -0.75], [1.1, 0.2]];
  for (let k = 0; k < 24; k++) {
    const q = (k * 7) % 11 - 5, r = (k * 5) % 9 - 4, seed = [0, 1, 42, -7, 123456789][k % 5]!;
    const teren = terrs[k % 4]!;
    const R = k % 3 === 0 ? 1.5 : 1;
    const s = Ms.reliefSurfaceSampler(teren, q, r, seed, R);
    samplers.push({ teren, q, r, seed, R, ys: s ? pts.map(([x, z]) => s(x * R, z * R)) : null, pts });
  }
}
// Round 2 (Evaluator objection 3): >= 50 DISTINCT seeds for every
// (relief type, wariantDlaHeksa variant) of the sampler. Hexes / seeds are
// enumerated deterministically; a candidate is kept while its variant quota
// (50) is open. The web `wariantDlaHeksa` only SELECTS the inputs.
const samplersSeeds: any[] = [];
{
  const pts: Array<[number, number]> = [[0, 0], [0.3, -0.2], [-0.55, 0.4], [0.7, 0.1], [-0.2, -0.75], [1.1, 0.2]];
  for (const teren of [TerenBazowy.Wzgorza, TerenBazowy.Gory]) {
    const quota = new Array(Tg.LICZBA_WARIANTOW_TERENU).fill(0);
    for (let k = 0; k < 100000 && quota.some((n) => n < 50); k++) {
      const q = ((k * 13) % 23) - 11, r = ((k * 7) % 19) - 9, seed = k * 7919 - 1000003;
      const v = Tg.wariantDlaHeksa(q, r, Tg.LICZBA_WARIANTOW_TERENU, seed);
      if (quota[v] >= 50) continue;
      quota[v]++;
      const R = k % 2 === 0 ? 1 : 1.5;
      const s = Ms.reliefSurfaceSampler(teren, q, r, seed, R);
      samplersSeeds.push({ teren, q, r, seed, R, ys: s ? pts.map(([x, z]) => s(x * R, z * R)) : null, pts });
    }
  }
}

// ---------------------------------------------------------------------------
// 2. Shared geometries (34 variants) + wrap + triangle counts + materials.
const geometries: any[] = [];
for (let w = 0; w < 5; w++) geometries.push(dumpGeometry(`las${w}`, Las.lasGeometria(w)));
for (let w = 0; w < 5; w++) geometries.push(dumpGeometry(`djungla${w}`, Dj.djunglaGeometria(w)));
for (let w = 0; w < 5; w++) geometries.push(dumpGeometry(`wzgorze${w}`, Tg.wzgorzeGeometria(w)));
for (let w = 0; w < 5; w++) geometries.push(dumpGeometry(`gora${w}`, Tg.goraGeometria(w)));
for (let w = 0; w < 4; w++) geometries.push(dumpGeometry(`laka${w}`, Dk.dekorLakaGeometria(w)));
for (let w = 0; w < 4; w++) geometries.push(dumpGeometry(`rownina${w}`, Dk.dekorRowninaGeometria(w)));
for (let w = 0; w < 4; w++) geometries.push(dumpGeometry(`pustynia${w}`, Oz.dekorPustyniaGeometria(w)));
geometries.push(dumpGeometry('tarasy0', Ta.tarasyGeometria(0)));
geometries.push(dumpGeometry('tarasy3', Ta.tarasyGeometria(3)));

const wrapW: number[] = [];
for (let w = -11; w <= 12; w++) wrapW.push(w);
const ident = (fn: (w: number) => THREE.BufferGeometry, n: number) =>
  wrapW.map((w) => { const g = fn(w); for (let k = 0; k < n; k++) if (fn(k) === g) return k; return -1; });
const wrap = {
  w: wrapW,
  las: ident(Las.lasGeometria, 5),
  djungla: ident(Dj.djunglaGeometria, 5),
  wzgorze: ident(Tg.wzgorzeGeometria, 5),
  gora: ident(Tg.goraGeometria, 5),
  laka: ident(Dk.dekorLakaGeometria, 4),
  rownina: ident(Dk.dekorRowninaGeometria, 4),
  pustynia: ident(Oz.dekorPustyniaGeometria, 4),
};
const tri = {
  las: wrapW.map((w) => Las.trojkatyLasu(w)),
  wzgorze: wrapW.map((w) => Tg.trojkatyWariantu('wzgorze', w)),
  gora: wrapW.map((w) => Tg.trojkatyWariantu('gora', w)),
  laka: wrapW.map((w) => Dk.trojkatyDekoru('laka', w)),
  rownina: wrapW.map((w) => Dk.trojkatyDekoru('rownina', w)),
  pustynia: wrapW.map((w) => Oz.trojkatyDekoruPustyni(w)),
  tarasy: [Ta.trojkatyTarasow(0), Ta.trojkatyTarasow(3)],
};
const materials = {
  las: matDesc(Las.LAS_MATERIAL),
  djungla: matDesc(Dj.DJUNGLA_MATERIAL),
  teren: matDesc(Tg.TEREN_MATERIAL),
  dekor: matDesc(Dk.DEKOR_MATERIAL),
  pustynia: matDesc(Oz.DEKOR_PUSTYNIA_MATERIAL),
  tarasy: matDesc(Ta.TARASY_MATERIAL),
};
const constants = {
  LICZBA_WARIANTOW_LASU: Las.LICZBA_WARIANTOW_LASU, LAS_MAX_Y: Las.LAS_MAX_Y, LAS_FOOTPRINT_R: Las.LAS_FOOTPRINT_R,
  SOL_WARIANT_LASU: Las.SOL_WARIANT_LASU, SOL_ROTACJA_LASU: Las.SOL_ROTACJA_LASU,
  LICZBA_WARIANTOW_DJUNGLI: Dj.LICZBA_WARIANTOW_DJUNGLI, SOL_WARIANT_DJUNGLI: Dj.SOL_WARIANT_DJUNGLI, SOL_ROTACJA_DJUNGLI: Dj.SOL_ROTACJA_DJUNGLI,
  LICZBA_WARIANTOW_TERENU: Tg.LICZBA_WARIANTOW_TERENU, WZGORZE_SZCZYT_Y: Tg.WZGORZE_SZCZYT_Y, GORA_APEX_Y: Tg.GORA_APEX_Y,
  WZGORZE_FOOTPRINT_R: Tg.WZGORZE_FOOTPRINT_R, GORA_FOOTPRINT_R: Tg.GORA_FOOTPRINT_R,
  DEKOR_LICZBA_WARIANTOW: Dk.DEKOR_LICZBA_WARIANTOW, DEKOR_UDZIAL_PUSTYCH: Dk.DEKOR_UDZIAL_PUSTYCH,
  DEKOR_MAX_WYSOKOSC: Dk.DEKOR_MAX_WYSOKOSC, DEKOR_FOOTPRINT_R: Dk.DEKOR_FOOTPRINT_R, DEKOR_LOD_MAX_POZIOM: Dk.DEKOR_LOD_MAX_POZIOM,
  DEKOR_PUSTYNIA_LICZBA_WARIANTOW: Oz.DEKOR_PUSTYNIA_LICZBA_WARIANTOW, DEKOR_PUSTYNIA_UDZIAL_PUSTYCH: Oz.DEKOR_PUSTYNIA_UDZIAL_PUSTYCH,
  DEKOR_PUSTYNIA_MAX_WYSOKOSC: Oz.DEKOR_PUSTYNIA_MAX_WYSOKOSC, DEKOR_PUSTYNIA_FOOTPRINT_R: Oz.DEKOR_PUSTYNIA_FOOTPRINT_R,
  DEKOR_PUSTYNIA_LOD_MAX_POZIOM: Oz.DEKOR_PUSTYNIA_LOD_MAX_POZIOM,
  SALT_PUSTYNIA_OBECNOSC: Oz.SALT_PUSTYNIA_OBECNOSC, SALT_PUSTYNIA_WARIANT: Oz.SALT_PUSTYNIA_WARIANT,
  SALT_PUSTYNIA_ROTACJA: Oz.SALT_PUSTYNIA_ROTACJA, SALT_OAZA_ROTACJA: Oz.SALT_OAZA_ROTACJA,
  RIVER_LOD_MARKER: Rl.RIVER_LOD_MARKER, RIVER_LOD_HIDE_FROM_LEVEL: Rl.RIVER_LOD_HIDE_FROM_LEVEL, RIVER_FOG_SIG_OFF: Rl.RIVER_FOG_SIG_OFF,
};
write('geometries.json', { geometries, wrap, tri, materials, constants });

// ---------------------------------------------------------------------------
// 3. Per-hex hash functions: 54 seeds x 121 hexes per function.
const seeds: number[] = [];
for (let s = 0; s < 50; s++) seeds.push(s);
seeds.push(-1, 2147483647, -2147483648, 123456789);
const coords: Array<[number, number]> = [];
for (let q = -5; q <= 5; q++) for (let r = -5; r <= 5; r++) coords.push([q, r]);
type F = (q: number, r: number, seed: number) => number | null;
const fns: Record<string, F> = {
  wariantLasu: (q, r, s) => Las.wariantLasuDlaHeksa(q, r, 5, s),
  rotacjaLasu: (q, r, s) => Las.rotacjaLasuDlaHeksa(q, r, s),
  wariantDjungli: (q, r, s) => Dj.wariantDjungliDlaHeksa(q, r, 5, s),
  rotacjaDjungli: (q, r, s) => Dj.rotacjaDjungliDlaHeksa(q, r, s),
  wariantTerenu: (q, r, s) => Tg.wariantDlaHeksa(q, r, 5, s),
  wariantTerenuSalt77: (q, r, s) => Tg.wariantDlaHeksa(q, r, 5, s, 77),
  rotacjaTerenu: (q, r, s) => Tg.rotacjaDlaHeksa(q, r, s),
  dekor: (q, r, s) => Dk.dekorDlaHeksa(q, r, s),
  rotacjaDekoru: (q, r, s) => Dk.rotacjaDekoru(q, r, s),
  dekorPustyni: (q, r, s) => Oz.dekorPustyniDlaHeksa(q, r, s),
  rotacjaPustyni: (q, r, s) => Oz.rotacjaDekoruPustyni(q, r, s),
  rotacjaOazy: (q, r, s) => Oz.rotacjaOazy(q, r, s),
  tarasyWariant: (q, r, s) => Ta.tarasyWariantDlaHeksa(q, r, s),
  forestTreeCount: (q, r, s) => Ms.forestTreeCountForHex(q, r, s),
  jungleTreeCount: (q, r, s) => Ms.jungleForestTreeCountForHex(q, r, s),
};
const hashOut: any = { seeds, coords, fns: {} };
for (const [name, fn] of Object.entries(fns)) {
  const table: number[] = [];
  const idx: number[] = [];
  for (const s of seeds) for (const [q, r] of coords) {
    const v = fn(q, r, s);
    if (v === null) { idx.push(-1); continue; }
    let k = table.findIndex((t) => Object.is(t, v));
    if (k < 0) { k = table.length; table.push(v); }
    idx.push(k);
  }
  hashOut.fns[name] = { table, idx };
}
const climate: any[] = [];
for (const h of [10, 20, 30, 41, 60, 108, 200]) {
  const rows: boolean[] = [];
  for (let r = -3; r <= h + 3; r++) rows.push(Ms.isWarmJungleForestHex(0, r, h));
  climate.push({ h, r0: -3, rows });
}
hashOut.climate = climate;
write('hashes.json', hashOut);

// ---------------------------------------------------------------------------
// 4. Builders → object graphs.
const builders: any[] = [];
const add = (id: string, args: any, obj: THREE.Object3D | null) => builders.push({ id, args, obj: dumpObject(obj) });
for (let w = -2; w <= 6; w++) {
  add('buildLas', [w], Las.buildLas(w));
  add('buildWzgorze', [w], Tg.buildWzgorze(w));
  add('buildGora', [w], Tg.buildGora(w));
  add('buildDekorLaka', [w], Dk.buildDekorLaka(w));
  add('buildDekorRownina', [w], Dk.buildDekorRownina(w));
  add('buildDekorPustynia', [w], Oz.buildDekorPustynia(w));
}
add('buildTarasy', [0], Ta.buildTarasy(0));
add('buildTarasy', [3], Ta.buildTarasy(3));
add('buildOaza', [], Oz.buildOaza());

// hexes for the per-hex builders
const hexes: Array<{ q: number; r: number; seed: number }> = [];
for (let k = 0; k < 60; k++) {
  hexes.push({ q: ((k * 13) % 23) - 11, r: ((k * 7) % 61) - 2, seed: [0, 1, 7, 42, -3, 99991][k % 6]! });
}
for (const [i, h] of hexes.entries()) {
  const { x, z } = axialToWorld(h.q, h.r, 1);
  const mapHeight = [30, 60, 108][i % 3]!;
  for (const lite of [false, true]) {
    add('buildStyleForestCluster', [h.q, h.r, x, z, 0.46, h.seed, 1, mapHeight, lite],
      Ms.buildStyleForestCluster('roblox', { q: h.q, r: h.r, x, z, baseY: 0.46, seed: h.seed, R: 1, mapHeight }, lite));
  }
  add('buildStyleMountainPeak', [h.q, h.r, x, z, 0.78, h.seed, 1],
    Ms.buildStyleMountainPeak('roblox', { q: h.q, r: h.r, x, z, topY: 0.78, seed: h.seed, R: 1 }, false));
  add('buildStyleHillBump', [h.q, h.r, x, z, 0.64, h.seed, 1],
    Ms.buildStyleHillBump('roblox', { q: h.q, r: h.r, x, z, baseY: 0.64, seed: h.seed, R: 1 }, false));
  add('buildStyleDune', [h.q, h.r, x, z, 0.56, h.seed, 1], Ms.buildStyleDune('roblox', h.q, h.r, x, z, 0.56, h.seed, 1));
}
// 150 extra forest clusters on the tropical rows of a 60-row map (jungle: palm / umbrella / tree split)
for (let k = 0; k < 150; k++) {
  const r = [23, 24, 25, 33, 34, 35, 36][k % 7]!, q = ((k * 11) % 31) - 15, seed = (k * 104729) % 2001 - 1000;
  const { x, z } = axialToWorld(q, r, 1);
  add('buildStyleForestCluster', [q, r, x, z, 0.46, seed, 1, 60, false],
    Ms.buildStyleForestCluster('roblox', { q, r, x, z, baseY: 0.46, seed, R: 1, mapHeight: 60 }, false));
}
// 400 extra hexes for the dune threshold (hash2D(…, 9) < 0.34)
for (let k = 0; k < 400; k++) {
  const q = ((k * 17) % 41) - 20, r = ((k * 29) % 37) - 18, seed = (k * 7919) % 1000 - 500;
  const { x, z } = axialToWorld(q, r, 1);
  add('buildStyleDune', [q, r, x, z, 0.56, seed, 1], Ms.buildStyleDune('roblox', q, r, x, z, 0.56, seed, 1));
}
for (const lite of [false, true]) for (const R of [1, 1.2]) add('buildStyleTarasyTerrace', [lite, R], Ms.buildStyleTarasyTerrace('roblox', lite, R));
const allTerr = [TerenBazowy.Laka, TerenBazowy.Rownina, TerenBazowy.Wzgorza, TerenBazowy.Gory, TerenBazowy.PlytkieMorze,
  TerenBazowy.Morze, TerenBazowy.Pustynia, TerenBazowy.Polarny];
for (const t of allTerr) for (const wide of [false, true]) {
  const r = Ms.buildGalleryBuildingPad(t, 1.5, 0.64, -0.5, 1, wide);
  builders.push({ id: 'buildGalleryBuildingPad', args: [t, 1.5, 0.64, -0.5, 1, wide], obj: dumpObject(r.group), surfaceY: r.surfaceY });
}
for (const t of [TerenBazowy.Wzgorza, TerenBazowy.Gory, TerenBazowy.Laka]) {
  const r = Ms.buildGalleryFortMount(t as any, -0.7, 0.78, 2.1, 1.1);
  builders.push({ id: 'buildGalleryFortMount', args: [t, -0.7, 0.78, 2.1, 1.1], obj: dumpObject(r.group), surfaceY: r.surfaceY });
}
add('buildStyleBeachRing', [0.4, 0.22, -1.3, 1], Ms.buildStyleBeachRing('roblox', 0.4, 0.22, -1.3, 1));
add('buildStyleBeachRing', [0, 0.5, 0, 1.3], Ms.buildStyleBeachRing('roblox', 0, 0.5, 0, 1.3));
for (const lite of [false, true]) add('buildStyleCoastSandTopCap', [2.6, 0.22, 1.5, 1, lite], Ms.buildStyleCoastSandTopCap('roblox', 2.6, 0.22, 1.5, 1, lite));

// oasis with a recorded rnd() sequence
for (const palmCount of [0, 1, 2, 3, 4]) {
  let st = 0x9e3779b9 ^ (palmCount * 2654435761);
  const used: number[] = [];
  const rnd = () => { st = (Math.imul(st, 1664525) + 1013904223) >>> 0; const v = st / 4294967296; used.push(v); return v; };
  const o = Ms.buildStyleOasis('roblox', 0.3, -0.4, 0.56, 1, palmCount, rnd);
  builders.push({ id: 'buildStyleOasis', args: [0.3, -0.4, 0.56, 1, palmCount], rnd: used, obj: dumpObject(o) });
}

// coast map
const coastMap: any = { hexes: {}, riverPaths: [], riverPathKinds: [] };
const terrAt = (q: number, r: number): TerenBazowy => {
  const d = (Math.abs(q) + Math.abs(r) + Math.abs(q + r)) / 2;
  if (d >= 5) return TerenBazowy.Morze;
  if (d === 4) return ((q * 3 + r * 5) & 3) === 0 ? TerenBazowy.Morze : TerenBazowy.PlytkieMorze;
  if (d === 3) return ((q + 2 * r) % 3 === 0) ? TerenBazowy.PlytkieMorze : allTerr[(q * 7 + r * 3 + 64) % 4]!;
  return [TerenBazowy.Laka, TerenBazowy.Rownina, TerenBazowy.Wzgorza, TerenBazowy.Pustynia, TerenBazowy.Gory][(q * 5 + r * 11 + 100) % 5]!;
};
for (let q = -6; q <= 6; q++) for (let r = -6; r <= 6; r++) {
  if ((Math.abs(q) + Math.abs(r) + Math.abs(q + r)) / 2 > 6) continue;
  coastMap.hexes[`${q},${r}`] = { coords: { q, r }, terenBazowy: terrAt(q, r) };
}
coastMap.riverPaths = [
  [{ q: 0, r: 0 }, { q: 1, r: 0 }, { q: 2, r: 0 }, { q: 3, r: 0 }, { q: 4, r: 0 }],
  [{ q: 0, r: 1 }, { q: -1, r: 2 }, { q: -1, r: 3 }],
  [{ q: 1, r: -1 }, { q: 1, r: -2 }, { q: 2, r: -3 }, { q: 2, r: -4 }, { q: 3, r: -5 }],
  [{ q: -1, r: -1 }, { q: -2, r: -1 }],
];
coastMap.riverPathKinds = ['main', 'main', 'tributary', 'main'];
const mouthEdges = Ms.computeRiverMouthEdgeKeys(coastMap);
const deltaKeys = Ms.computeRiverDeltaHexKeys(coastMap);
const coast: any[] = [];
for (const hex of Object.values(coastMap.hexes) as any[]) {
  const { q, r } = hex.coords;
  const { x, z } = axialToWorld(q, r, 1);
  for (const lite of [false, true]) {
    if (hex.terenBazowy === TerenBazowy.PlytkieMorze) {
      coast.push({ id: 'water', q, r, lite, obj: dumpObject(Ms.buildStyleCoastWaterCap('roblox', coastMap, q, r, x, z, 0.18, 1, { lite, deltaKeys, mouthEdges })) });
      coast.push({ id: 'sandEdges', q, r, lite, obj: dumpObject(Ms.buildStyleCoastSandEdges('roblox', { map: coastMap, q, r, x, z, topY: 0.22, R: 1, self: hex.terenBazowy }, lite, mouthEdges)) });
    } else {
      coast.push({ id: 'landSand', q, r, lite, obj: dumpObject(Ms.buildStyleLandCoastSandCap('roblox', { map: coastMap, q, r, x, z, topY: 0.46, R: 1, self: hex.terenBazowy }, lite)) });
    }
  }
}
// isDelta forced, without deltaKeys
for (const [q, r] of [[0, 4], [4, -4], [-4, 0]] as Array<[number, number]>) {
  const { x, z } = axialToWorld(q, r, 1);
  coast.push({ id: 'waterForcedDelta', q, r, lite: false, obj: dumpObject(Ms.buildStyleCoastWaterCap('roblox', coastMap, q, r, x, z, 0.18, 1, { isDelta: true, mouthEdges })) });
}
// Round 2 (Evaluator objection 3): buildStyleMountainPeak / buildStyleHillBump
// with >= 50 DISTINCT seeds per silhouette variant (`wariantDlaHeksa`), in a
// separate file so `builders.json` stays below 4 MB.
const reliefBuilders: any[] = [];
for (const id of ['buildStyleMountainPeak', 'buildStyleHillBump']) {
  const quota = new Array(Tg.LICZBA_WARIANTOW_TERENU).fill(0);
  for (let k = 0; k < 100000 && quota.some((n) => n < 50); k++) {
    const q = ((k * 17) % 29) - 14, r = ((k * 11) % 31) - 15, seed = k * 104729 - 2000003;
    const v = Tg.wariantDlaHeksa(q, r, Tg.LICZBA_WARIANTOW_TERENU, seed);
    if (quota[v] >= 50) continue;
    quota[v]++;
    const { x, z } = axialToWorld(q, r, 1);
    if (id === 'buildStyleMountainPeak') {
      reliefBuilders.push({ id, args: [q, r, x, z, 0.78, seed, 1],
        obj: dumpObject(Ms.buildStyleMountainPeak('roblox', { q, r, x, z, topY: 0.78, seed, R: 1 }, false)) });
    } else {
      reliefBuilders.push({ id, args: [q, r, x, z, 0.64, seed, 1],
        obj: dumpObject(Ms.buildStyleHillBump('roblox', { q, r, x, z, baseY: 0.64, seed, R: 1 }, false)) });
    }
  }
}
write('relief_builders.json', { builders: reliefBuilders });
write('builders.json', {
  builders,
  coastMap: { hexes: Object.values(coastMap.hexes).map((h: any) => [h.coords.q, h.coords.r, h.terenBazowy]), riverPaths: coastMap.riverPaths.map((p: any) => p.map((c: any) => [c.q, c.r])), riverPathKinds: coastMap.riverPathKinds },
  mouthEdges: [...mouthEdges].sort(),
  deltaKeys: [...deltaKeys].sort(),
  coast,
});
write('relief.json', { reliefSamples, samplers, samplersSeeds });

// ---------------------------------------------------------------------------
// 5. riverLod.
const rl: any = {};
{
  const mk = (kind: string): THREE.BufferGeometry => {
    switch (kind) {
      case 'box': return new THREE.BoxGeometry(1, 2, 3);
      case 'plane': return new THREE.PlaneGeometry(2, 1, 3, 2);
      case 'cyl': return new THREE.CylinderGeometry(0.5, 0.5, 1, 8);
      case 'boxc': {
        const g = new THREE.BoxGeometry(1, 1, 1);
        const n = g.getAttribute('position').count;
        const c: number[] = [];
        for (let i = 0; i < n; i++) c.push(i / n, 0.5, 1 - i / n);
        g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3));
        return g;
      }
      default: throw new Error(kind);
    }
  };
  const scenarios: string[][] = [[], ['box'], ['box', 'plane', 'cyl'], ['plane', 'plane'], ['box', 'boxc'], ['boxc', 'boxc']];
  const scene = new THREE.Scene();
  const mat = new THREE.MeshLambertMaterial({ color: 0x6aadbe });
  const flushes: any[] = [];
  const origError = console.error;
  console.error = () => {};
  for (const [si, sc] of scenarios.entries()) {
    const b = Rl.createRiverBucket(mat, si);
    for (const [k, kind] of sc.entries()) Rl.queueRiverGeo(b, mk(kind), [`${k},${si}`, `0,0`, `${si},${k}`]);
    const e = Rl.flushRiverBucket(scene, b);
    flushes.push({
      kinds: sc, ro: si,
      res: e ? { merged: e.merged, geo: geoSummary(e.geometry), hexKeys: [...e.hexKeys], ro: e.mesh.renderOrder, cast: e.mesh.castShadow, recv: e.mesh.receiveShadow, sameGeo: e.mesh.geometry === e.geometry } : null,
      queueAfter: b.geos.length,
    });
  }
  console.error = origError;
  rl.flushes = flushes;
  // mergeRiverBuckets over the same list
  {
    const bs = scenarios.map((sc, si) => { const b = Rl.createRiverBucket(mat, 10 + si); for (const kind of sc) Rl.queueRiverGeo(b, mk(kind), [`k${si}`]); return b; });
    console.error = () => {};
    const out = Rl.mergeRiverBuckets(scene, bs);
    console.error = origError;
    rl.mergeAll = out.map((e) => ({ ro: e.mesh.renderOrder, merged: e.merged, hash: fnvGeometry(e.geometry), hexKeys: [...e.hexKeys] }));
  }
  // LOD
  const lod: any[] = [];
  for (const level of [0, 1, 2, 3, 4, 5, 2.5]) for (const hide of [1, 2, 3, 4]) lod.push([level, hide, Rl.riversVisibleAtLod(level, hide)]);
  rl.lod = lod;
  rl.lodDefault = [0, 1, 2, 3, 4].map((l) => Rl.riversVisibleAtLod(l));
  // fog: deterministic point lists
  let st = 12345;
  const rnd = () => { st = (Math.imul(st, 1103515245) + 12345) >>> 0; return st / 4294967296; };
  const keys = ['0,0', '1,0', '2,-1', '3,-1', '-1,2', '4,4', '5,-2', '7,1'];
  const cases: any[] = [];
  for (let c = 0; c < 60; c++) {
    const nSeg = 1 + Math.floor(rnd() * 4);
    const segments: string[][] = [];
    for (let s = 0; s < nSeg; s++) { const len = Math.floor(rnd() * 7); const seg: string[] = []; for (let i = 0; i < len; i++) seg.push(keys[Math.floor(rnd() * keys.length)]!); segments.push(seg); }
    const hidden = keys.filter(() => rnd() < 0.35);
    const reveal = c % 3 === 0 ? null : keys.filter(() => rnd() < 0.3);
    const explored = keys.filter(() => rnd() < 0.4);
    const hid = (k: string) => hidden.includes(k);
    const pointHex = segments[0]!;
    const fogActive = c % 4 !== 0;
    const lastSig = c % 5 === 0 ? undefined : (c % 5 === 1 ? Rl.RIVER_FOG_SIG_OFF : Rl.computeRiverFogSig(pointHex, hid) + (c % 2));
    const fogSig = Rl.computeRiverFogSig(pointHex, hid);
    // applyRiverVisibility on fake entries
    const entries = segments.map((seg) => ({ mesh: { visible: true } as any, geometry: null as any, hexKeys: new Set(seg), merged: true }));
    const level = c % 6;
    const anyHidden = c % 7 !== 0;
    Rl.applyRiverVisibility(entries as any, level, anyHidden, (k) => !hidden.includes(k), (k) => explored.includes(k));
    const visApply = entries.map((e) => e.mesh.visible);
    const entries2 = segments.map((seg) => ({ mesh: { visible: true } as any, geometry: null as any, hexKeys: new Set(seg), merged: true }));
    const lodRet = Rl.applyRiverLodVisibility(entries2 as any, level);
    cases.push({
      segments, hidden, reveal, explored, fogActive, lastSig: lastSig === undefined ? null : lastSig, level, anyHidden,
      sig: fogSig,
      fullIdx: Rl.buildRiverRibbonFullIndex(pointHex.length),
      fogIdx: Rl.buildRiverRibbonFogIndex(pointHex, hid),
      needs: Rl.needsRiverRibbonIndexUpdate(fogActive, lastSig, fogSig),
      mFull: Rl.buildMergedRiverFullIndex(segments),
      mFog: Rl.buildMergedRiverFogIndex(segments, hid),
      mSig: Rl.computeMergedRiverFogSig(segments, hid),
      mVis: Rl.mergedRiverVisibleInFog(fogActive, reveal ? new Set(reveal) : null, hid, segments.flat()),
      mVisEmptyReveal: Rl.mergedRiverVisibleInFog(fogActive, new Set(), hid, segments.flat()),
      visApply,
      lodRet, visLod: entries2.map((e) => e.mesh.visible),
    });
  }
  rl.cases = cases;
  rl.fullIdxSmall = [0, 1, 2, 3].map((n) => Rl.buildRiverRibbonFullIndex(n));
}
write('riverlod.json', rl);

console.log(`decor geometries=${geometries.length} builders=${builders.length} reliefBuilders=${reliefBuilders.length} coast=${coast.length} relief=${reliefSamples.length} samplersSeeds=${samplersSeeds.length} hashfns=${Object.keys(fns).length} rlcases=${rl.cases.length}`);
