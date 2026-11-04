// R-RUSTPORT-REPIN-3D-B4-Q1 — reference vectors for batch B4 (`cities.ts` settlement model
// resource registry, `bronze/stoneCityRoblox.ts` shared hex-wall-ring geometry flag).
//
// Run ONLY outside the repository (scratch dir), see README_B.md. Links three@0.169.0 and the
// web modules from `git archive origin/main gra/src gra/data`, IMPORTED UNCHANGED. No web code
// is copied: `registerOwnedMeshResources` is private, so it is reached through the public
// `CityRenderer.sync` (the only caller, `buildSettlementModelForStyle`, `cities.ts:229-250`).
// Output: `b4.json` in the directory given as argv[2].

import * as THREE from 'three';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { TerenBazowy } from '../websrc/gra/src/types/hex';
import { CityRenderer } from '../websrc/gra/src/render/cities';
import { buildMiastoBraz } from '../websrc/gra/src/render/miasto-braz';
import { buildMiastoKamien } from '../websrc/gra/src/render/miasto-kamien';
import { buildBronzeCityRoblox, BRONZE_CIVS } from '../websrc/gra/src/render/bronzeCityRoblox';
import { buildStoneAgeCityRoblox } from '../websrc/gra/src/render/stoneCityRoblox';

const OUT = process.argv[2];
if (!OUT) throw new Error('usage: node gen_b4.mjs <outdir>');
fs.mkdirSync(OUT, { recursive: true });

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

/** Resource registry view of a model group: userData key order, `mats` as indices into the
 *  first-use material list (traverse order, every `isMesh`, arrays expanded), `perCityGeos`
 *  as the traverse index of the FIRST mesh using each geometry, plus the mesh / unique counts
 *  and the `sharedTransientGeometry` flags of mesh geometries. */
function registry(g: THREE.Object3D): any {
  const firstMat: THREE.Material[] = [];
  const geoFirstMesh = new Map<THREE.BufferGeometry, number>();
  let meshes = 0, nonMeshDrawables = 0, sharedFlag = 0, sharedFlagUnique = new Set<THREE.BufferGeometry>();
  let ti = 0;
  g.traverse((o: any) => {
    const idx = ti++;
    if (!o.isMesh) { if (o.geometry) nonMeshDrawables++; return; }
    meshes++;
    if (!geoFirstMesh.has(o.geometry)) geoFirstMesh.set(o.geometry, idx);
    const ms = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of ms) if (m && !firstMat.includes(m)) firstMat.push(m);
    if (o.geometry.userData && o.geometry.userData['sharedTransientGeometry'] === true) {
      sharedFlag++; sharedFlagUnique.add(o.geometry);
    }
  });
  const ud = g.userData;
  const mats = Array.isArray(ud['mats']) ? (ud['mats'] as THREE.Material[]).map((m) => firstMat.indexOf(m)) : null;
  const geos = Array.isArray(ud['perCityGeos'])
    ? (ud['perCityGeos'] as THREE.BufferGeometry[]).map((x) => geoFirstMesh.get(x) ?? -1) : null;
  return {
    keys: Object.keys(ud),
    mats, geos,
    meshes, nonMeshDrawables,
    uniqueMats: firstMat.length, uniqueGeos: geoFirstMesh.size,
    sharedFlag, sharedFlagUnique: sharedFlagUnique.size,
  };
}

// ---------------------------------------------------------------------------
// 1) Settlement models through CityRenderer.sync (one city, rebuilt on every visualKey change).
const T = TerenBazowy as any;
const hexes: Record<string, any> = { '0,0': { q: 0, r: 0, terenBazowy: T.Laka } };
const scene = new THREE.Scene();
const cr = new CityRenderer(scene, { hexes } as any);
const city = { id: 'x', ownerId: 3, q: 0, r: 0, name: 'x', population: 4 };
const ERAS = [1, 2, 3, 0, 7];
const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 0, 11, 2.5, 6.49, NaN];
const WALLS = ['none', 'stone', 'palisada'] as const;
const settlement: any[] = [];
let prevGroup: THREE.Object3D | null = null;
let disposedOnSwap = 0;
for (const era of ERAS) {
  const civs = era >= 2 ? [...BRONZE_CIVS] : ['grecja', 'zulu'];
  for (const civ of civs) {
    for (const level of LEVELS) {
      for (const wallKind of WALLS) {
        for (const color of [null, 0x8e24aa]) {
          const opts: any = {
            hideStatChips: true,
            getEra: () => era, getCiv: () => civ, getLevel: () => level, getWallKind: () => wallKind,
          };
          if (color !== null) opts.ownerColorFn = () => color;
          // count GPU disposals of the previous model (M1: after the swap)
          let disposed = 0;
          if (prevGroup) {
            const seen = new Set<any>();
            prevGroup.traverse((o: any) => {
              if (!o.isMesh) return;
              for (const r of [o.geometry, ...(Array.isArray(o.material) ? o.material : [o.material])]) {
                if (seen.has(r)) continue; seen.add(r);
                r.addEventListener('dispose', () => { disposed++; });
              }
            });
          }
          cr.sync([city] as any, opts);
          const g = scene.children.find((c) => c.userData['cityId'] === 'x')!;
          if (prevGroup && g !== prevGroup) disposedOnSwap += disposed;
          const reused = g === prevGroup;
          prevGroup = g;
          settlement.push({ era, civ, level, wallKind, color, reused, disposedPrev: disposed, reg: registry(g) });
        }
      }
    }
  }
}

// 2) The builders alone (no registry: the keys are added by the renderer only).
const builders: any[] = [];
for (const L of [1, 10]) {
  builders.push({ f: 'kamien', level: L, reg: registry(buildMiastoKamien(L, { mur: true })) });
  builders.push({ f: 'braz', civ: 'grecja', level: L, reg: registry(buildMiastoBraz('grecja', L, { mur: true })) });
  builders.push({ f: 'braz', civ: 'rzym', level: L, reg: registry(buildMiastoBraz('rzym', L, { palisada: true })) });
}

// 3) Ghost models: the cached hex wall ring now carries `sharedTransientGeometry`.
const ghosts: any[] = [];
for (const civ of BRONZE_CIVS) {
  for (const L of [1, 5, 10]) {
    for (const walls of [false, true]) {
      ghosts.push({ f: 'ghost_braz', civ, level: L, walls, reg: registry(buildBronzeCityRoblox(civ, L, 0xffd54a, walls)) });
      ghosts.push({ f: 'ghost_kamien', civ, level: L, walls, reg: registry(buildStoneAgeCityRoblox(civ, L, 0xffd54a, walls)) });
    }
  }
}
for (const walls of [false, true]) {
  ghosts.push({ f: 'ghost_kamien_uni', level: 6, walls, reg: registry(buildStoneAgeCityRoblox(6, 0xffd54a, walls)) });
}

fs.writeFileSync(path.join(OUT, 'b4.json'), ser({ settlement, builders, ghosts, disposedOnSwap }));
console.log(`b4 settlement=${settlement.length} builders=${builders.length} ghosts=${ghosts.length} disposedOnSwap=${disposedOnSwap}`);
