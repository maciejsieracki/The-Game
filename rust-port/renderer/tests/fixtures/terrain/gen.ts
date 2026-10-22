// R-RUSTPORT-P4-11-CAMERA-TERRAIN-CPU-Q1 — generator of terrain-mesh reference vectors.
//
// Run ONLY outside the repository (scratch dir), see README.md. The esbuild bundle links:
//  - three@0.169.0 (npm, version pinned by gra/package-lock.json),
//  - web modules from `git archive edb8fb56 gra/src gra/data`, IMPORTED UNCHANGED:
//    render/mapRenderStyle.ts (styleTerrainColor, terrainVisualForStyle, landCoastSandNeeded,
//    findLandCoastSandCandidates, coast instance collectors and shared geometries,
//    computeRiverDeltaHexKeys, computeRiverMouthEdgeKeys, resolveRenderPreset,
//    normalizeMapRenderOptions, styleScenePalette), render/teren-gory-wzgorza.ts
//    (wariantDlaHeksa, rotacjaDlaHeksa, LICZBA_WARIANTOW_TERENU), render/hexutil.ts,
//    game/terrain-improvements.ts (improvementKeysForHex), game/visibility.ts
//    (FOG_EXPLORED_BRIGHTNESS), types/hex.ts;
//  - copies of buildScene fragments that cannot be imported (scene.ts needs DOM/WebGL),
//    each marked `// LITERAL scene.ts:<lines>`. LITERAL = same logic and arithmetic in the
//    same order, NOT a character copy: TS types removed, comments removed, only the
//    `roblox` branch of every `renderStyle`/`useStyledDecor`/`styledTerrain` test kept
//    (styledTerrain = true, B_NO_BOTTOM = true), DEKOR_ENABLED=false branch dropped
//    (it is `false` in the web), forests/rivers/oases/dunes/decor and every
//    material/shadow/scene.add/performance/progress statement removed.
//    Full list: README.md §Adaptations.
// Output: JSON files in the directory given as argv[2].

import * as THREE from 'three';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { TerenBazowy } from '../websrc/gra/src/types/hex';
import {
  styleTerrainColor, terrainVisualForStyle, landCoastSandNeeded, findLandCoastSandCandidates,
  createCoastInstBuffers, getCoastSharedGeometries, collectRobloxCoastWaterInst,
  collectRobloxLandCoastSandInst, computeRiverDeltaHexKeys, computeRiverMouthEdgeKeys,
  coastWaterMaterial, coastSandMaterial, resolveRenderPreset, normalizeMapRenderOptions,
  styleScenePalette,
} from '../websrc/gra/src/render/mapRenderStyle';
import { axialToWorld, HEX_R } from '../websrc/gra/src/render/hexutil';
import { wariantDlaHeksa, rotacjaDlaHeksa, LICZBA_WARIANTOW_TERENU } from '../websrc/gra/src/render/teren-gory-wzgorza';
import { improvementKeysForHex } from '../websrc/gra/src/game/terrain-improvements';
import { FOG_EXPLORED_BRIGHTNESS } from '../websrc/gra/src/game/visibility';

const OUT = process.argv[2];
if (!OUT) throw new Error('usage: node gen.mjs <outdir>');
fs.mkdirSync(OUT, { recursive: true });

// ---------------------------------------------------------------------------
// LITERAL scene.ts:138-147 (only to keep terrainVis literal; the civ spec is ignored by
// terrainVisualForStyle in the roblox style, mapRenderStyle.ts:231)
const TERRAIN_VISUALS: any = {
  [TerenBazowy.Morze]: { color: 0x1f5a86, height: 0.30, yOffset: 0.00 },
  [TerenBazowy.PlytkieMorze]: { color: 0x46a3d6, height: 0.35, yOffset: 0.05 },
  [TerenBazowy.Laka]: { color: 0x6aa53f, height: 0.40, yOffset: 0.05 },
  [TerenBazowy.Rownina]: { color: 0xa9b257, height: 0.45, yOffset: 0.08 },
  [TerenBazowy.Pustynia]: { color: 0xd9c179, height: 0.42, yOffset: 0.08 },
  [TerenBazowy.Wzgorza]: { color: 0x4f7d34, height: 0.55, yOffset: 0.10 },
  [TerenBazowy.Gory]: { color: 0x9aa1a9, height: 0.60, yOffset: 0.20 },
  [TerenBazowy.Polarny]: { color: 0xe8eef5, height: 0.38, yOffset: 0.06 },
};
// LITERAL scene.ts:164
const FOG_HIDDEN_COLOR = new THREE.Color(0x0b0d12);
// LITERAL scene.ts:166-170
function terrainVis(t: any, renderStyle: any) {
  const civ = TERRAIN_VISUALS[t];
  const spec = terrainVisualForStyle(t, renderStyle, civ);
  return { color: civ.color, height: spec.height, yOffset: spec.yOffset };
}
// LITERAL scene.ts:188-196
function hash2D(q: number, r: number, seed: number, salt: number): number {
  let h = (Math.imul(q | 0, 0x27d4eb2d) ^ Math.imul(r | 0, 0x165667b1) ^ Math.imul(seed | 0, 0x9e3779b1) ^ Math.imul(salt | 0, 0x85ebca6b)) >>> 0;
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d) >>> 0;
  h ^= h >>> 12;
  h = Math.imul(h, 0x297a2d39) >>> 0;
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}
// LITERAL scene.ts:206-207
const LAKA_SHADES = [0x54923a, 0x5f9e42, 0x6cab4f, 0x79b85c, 0x86c469] as const;
const ROWNINA_SHADES = [0x9ac968, 0xa6d074, 0xb4dc84, 0xc0e693, 0xcaec9f] as const;
// LITERAL scene.ts:209-232
function jitteredTerrainColor(baseHex: number, q: number, r: number, seed: number, isWater: boolean): THREE.Color {
  const c = new THREE.Color(baseHex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  const nH = hash2D(q, r, seed, 101) - 0.5;
  const nS = hash2D(q, r, seed, 202) - 0.5;
  const nL = hash2D(q, r, seed, 303) - 0.5;
  const hueAmt = isWater ? 0.010 : 0.022;
  const satAmt = isWater ? 0.05 : 0.10;
  const litAmt = isWater ? 0.030 : 0.060;
  let h = hsl.h + nH * hueAmt;
  h = h - Math.floor(h);
  const s = Math.max(0, Math.min(1, hsl.s + nS * satAmt));
  const l = Math.max(0, Math.min(1, hsl.l + nL * litAmt));
  c.setHSL(h, s, l);
  return c;
}
// LITERAL scene.ts:476-478
const HEX_NEIGHBORS: ReadonlyArray<readonly [number, number]> = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
// LITERAL scene.ts:484-519 (renderStyle fixed to 'roblox' by the caller)
function blendedTerrainHex(map: any, q: number, r: number, baseHex: number, isWater: boolean, renderStyle: any = 'civ', selfTeren?: any): number {
  const base = new THREE.Color(baseHex);
  const acc = new THREE.Color(0, 0, 0);
  let n = 0;
  for (const [dq, dr] of HEX_NEIGHBORS) {
    const nb = map.hexes[`${q + dq},${r + dr}`];
    if (!nb) continue;
    if (selfTeren && isDryLandTeren(selfTeren) && !isDryLandTeren(nb.terenBazowy)) continue;
    if (selfTeren === TerenBazowy.PlytkieMorze && isDryLandTeren(nb.terenBazowy)) continue;
    const nbHex = renderStyle === 'civ' ? TERRAIN_VISUALS[nb.terenBazowy].color : styleTerrainColor(nb.terenBazowy, renderStyle);
    acc.add(new THREE.Color(nbHex));
    n++;
  }
  if (n === 0) return baseHex;
  acc.multiplyScalar(1 / n);
  base.lerp(acc, isWater ? 0.07 : 0.18);
  return base.getHex();
}
// LITERAL scene.ts:578-580
function isDryLandTeren(tb: any): boolean {
  return tb !== TerenBazowy.Morze && tb !== TerenBazowy.PlytkieMorze;
}
// LITERAL scene.ts:1563-1576
function hexPrismNoBottomGeo(radius: number, height: number, radial = 6): THREE.CylinderGeometry {
  const g = new THREE.CylinderGeometry(radius, radius, height, radial, 1);
  const idx = g.getIndex();
  if (idx) {
    const bottom = g.groups.find((gr) => gr.materialIndex === 2);
    if (bottom) {
      const arr = idx.array as Uint16Array | Uint32Array;
      const kept = arr.slice(0, bottom.start);
      g.setIndex(new THREE.BufferAttribute(kept, 1));
      g.clearGroups();
    }
  }
  return g;
}

const geoDump = (g: THREE.BufferGeometry) => ({
  pos: Array.from(g.attributes.position!.array as Float32Array),
  nor: Array.from(g.attributes.normal!.array as Float32Array),
  uv: Array.from(g.attributes.uv!.array as Float32Array),
  idx: g.index ? Array.from(g.index.array as any) : null,
  groups: g.groups.map((gr) => [gr.start, gr.count, gr.materialIndex ?? 0]),
});
const colorDump = (c: THREE.Color) => [c.r, c.g, c.b];

// ---------------------------------------------------------------------------
interface HexSpec { q: number; r: number; t: any; tarasy?: boolean }
interface MapSpec {
  name: string; seed: number; W: number; H: number; hexes: HexSpec[];
  rivers: Array<{ path: Array<[number, number]>; kind?: string }>;
  kindsGiven: boolean;
  mapDetailQuality: 'low' | 'medium' | 'high';
  fog: Array<{ visible: string[] | 'ALL'; explored: string[] | 'ALL'; landReveal?: boolean }>;
}

function buildTerrain(spec: MapSpec) {
  const map: any = { seed: spec.seed, szerokoscQ: spec.W, wysokoscR: spec.H, hexes: {} as Record<string, any> };
  for (const h of spec.hexes) {
    map.hexes[`${h.q},${h.r}`] = { coords: { q: h.q, r: h.r }, terenBazowy: h.t, ulepszenia: h.tarasy ? ['tarasy'] : undefined };
  }
  map.riverPaths = spec.rivers.map((p) => p.path.map(([q, r]) => ({ q, r })));
  if (spec.kindsGiven) map.riverPathKinds = spec.rivers.map((p) => p.kind ?? 'main');
  // LITERAL scene.ts:1590-1611 (only what the terrain uses)
  const renderOptions = normalizeMapRenderOptions({ style: 'roblox', mapDetailQuality: spec.mapDetailQuality } as any);
  const renderStyle = renderOptions.style;
  const hexCount = Object.keys(map.hexes).length;
  const preset = resolveRenderPreset(renderOptions, hexCount);
  const robloxLite = preset.robloxLite;
  const palette = styleScenePalette(renderStyle);
  const useStyledDecor = renderStyle !== 'civ';
  const R = HEX_R;
  // LITERAL scene.ts:1702-1754 (terrain / mountain / hill counters only)
  const NW = LICZBA_WARIANTOW_TERENU;
  const styledTerrain = useStyledDecor && renderStyle === 'roblox';
  const countByTerrain: any = {};
  const goraVarCount: number[] = new Array(NW).fill(0);
  const wzgorzeVarCount: number[] = new Array(NW).fill(0);
  for (const hex of Object.values(map.hexes) as any[]) {
    const t = hex.terenBazowy;
    countByTerrain[t] = (countByTerrain[t] ?? 0) + 1;
    if (t === TerenBazowy.Gory) { if (styledTerrain) goraVarCount[wariantDlaHeksa(hex.coords.q, hex.coords.r, NW, map.seed)]!++; }
    if (t === TerenBazowy.Wzgorza) { if (styledTerrain) wzgorzeVarCount[wariantDlaHeksa(hex.coords.q, hex.coords.r, NW, map.seed)]!++; }
  }
  // LITERAL scene.ts:1760-1794
  const instancedMeshes: THREE.InstancedMesh[] = [];
  const terrainPickKeys = new Map<THREE.InstancedMesh, string[]>();
  const terrainMaterials: any = {};
  const terrainIndex: any = {};
  const terrainTypes = Object.values(TerenBazowy);
  for (const t of terrainTypes) {
    const cnt = countByTerrain[t] ?? 0;
    if (cnt === 0) continue;
    const vis = terrainVis(t, renderStyle);
    const hexR = renderStyle === 'roblox' ? R * 1.008 : R * 0.998;
    const geo = hexPrismNoBottomGeo(hexR, vis.height);
    const mat = new THREE.MeshLambertMaterial({ color: styleTerrainColor(t, renderStyle), flatShading: palette.flatShading });
    terrainMaterials[t] = mat;
    const mesh = new THREE.InstancedMesh(geo, mat, cnt);
    mesh.frustumCulled = false;
    instancedMeshes.push(mesh);
    terrainIndex[t] = instancedMeshes.length - 1;
  }
  const terrainInstanceIdx: any = {};
  for (const t of terrainTypes) terrainInstanceIdx[t] = 0;
  // LITERAL scene.ts:1852-1871 (solid geometries replaced by a 1-vertex stub: only the
  // instance matrices are exported; the solid geometries belong to the model topics)
  const goraInst: THREE.InstancedMesh[] = [];
  const wzgorzeInst: THREE.InstancedMesh[] = [];
  const goraHexKey: string[][] = [];
  const goraOrigMatrix: THREE.Matrix4[][] = [];
  const goraIdx: number[] = [];
  const wzgorzeHexKey: string[][] = [];
  const wzgorzeOrigMatrix: THREE.Matrix4[][] = [];
  const wzgorzeIdx: number[] = [];
  const stubGeo = new THREE.BufferGeometry();
  if (styledTerrain) {
    for (let v = 0; v < NW; v++) {
      const gm = new THREE.InstancedMesh(stubGeo, undefined as any, Math.max(1, goraVarCount[v]!));
      gm.count = 0;
      goraInst.push(gm); goraHexKey.push([]); goraOrigMatrix.push([]); goraIdx.push(0);
      const wm = new THREE.InstancedMesh(stubGeo, undefined as any, Math.max(1, wzgorzeVarCount[v]!));
      wm.count = 0;
      wzgorzeInst.push(wm); wzgorzeHexKey.push([]); wzgorzeOrigMatrix.push([]); wzgorzeIdx.push(0);
    }
  }
  // LITERAL scene.ts:2047-2049, 2078, 2088-2101
  const hexInstance = new Map<string, { mesh: THREE.InstancedMesh; index: number; baseColor: THREE.Color }>();
  const hexOrigMatrix = new Map<string, THREE.Matrix4>();
  const hexTeren = new Map<string, any>();
  const dummy = new THREE.Object3D();
  const seaVisEarly = terrainVis(TerenBazowy.Morze, renderStyle);
  const seaSurfaceY = seaVisEarly.height + seaVisEarly.yOffset;
  const deltaHexKeys = renderStyle === 'roblox' ? computeRiverDeltaHexKeys(map) : new Set<string>();
  const cachedMouthEdges = renderStyle === 'roblox' ? computeRiverMouthEdgeKeys(map) : undefined;
  const landCoastSandKeys = (useStyledDecor && renderStyle === 'roblox') ? new Set(findLandCoastSandCandidates(map)) : null;
  const coastInstBuf: any = useStyledDecor && renderStyle === 'roblox' ? createCoastInstBuffers() : null;
  const coastInstMeshes: THREE.InstancedMesh[] = [];
  const coastInstHexKey: string[][] = [];
  const coastInstOrig: THREE.Matrix4[][] = [];
  const blendedDump: any[] = [];
  // LITERAL scene.ts:2213-2216, 2246-2263, 2294-2339, 2414-2430, 2461-2478, 2520-2534
  const c3Hexes = Object.values(map.hexes) as any[];
  const c3Total = c3Hexes.length;
  const coastCollectLite = robloxLite;
  for (let c3i = 0; c3i < c3Total; c3i++) {
    const hex = c3Hexes[c3i]!;
    const t = hex.terenBazowy;
    const vis = terrainVis(t, renderStyle);
    const { x, z } = axialToWorld(hex.coords.q, hex.coords.r, R);
    const coastalDrop = (renderStyle === 'roblox' && landCoastSandNeeded(map, hex.coords.q, hex.coords.r, t)) ? R * 0.045 : 0;
    const surfaceTopY = vis.height + vis.yOffset - coastalDrop;
    let y = surfaceTopY - vis.height / 2;
    let scaleY = 1;
    if (renderStyle === 'roblox' && !isDryLandTeren(t)) {
      y = seaSurfaceY - vis.height / 2;
    }
    const hexKey = `${hex.coords.q},${hex.coords.r}`;
    const meshIdx = terrainIndex[t];
    const iIdx = terrainInstanceIdx[t] ?? 0;
    if (meshIdx !== undefined) {
      const mesh = instancedMeshes[meshIdx]!;
      dummy.position.set(x, y, z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, scaleY, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(iIdx, dummy.matrix);
      let pickKeys = terrainPickKeys.get(mesh);
      if (!pickKeys) { pickKeys = []; terrainPickKeys.set(mesh, pickKeys); }
      pickKeys[iIdx] = hexKey;
      hexOrigMatrix.set(hexKey, dummy.matrix.clone());
      hexTeren.set(hexKey, t);
      const isCoastRoblox = t === TerenBazowy.PlytkieMorze && renderStyle === 'roblox';
      const isWater = !isDryLandTeren(t);
      const baseTerrainHex = styleTerrainColor(t, renderStyle);
      const blendedHex = isCoastRoblox ? baseTerrainHex : blendedTerrainHex(map, hex.coords.q, hex.coords.r, baseTerrainHex, isWater, renderStyle, t);
      const shades = styledTerrain ? (t === TerenBazowy.Laka ? LAKA_SHADES : t === TerenBazowy.Rownina ? ROWNINA_SHADES : null) : null;
      const baseColor = isCoastRoblox
        ? new THREE.Color(baseTerrainHex)
        : shades !== null
          ? new THREE.Color(shades[Math.floor(hash2D(hex.coords.q, hex.coords.r, map.seed, 4242) * shades.length) % shades.length]!)
          : jitteredTerrainColor(blendedHex, hex.coords.q, hex.coords.r, map.seed, isWater);
      mesh.setColorAt(iIdx, baseColor);
      hexInstance.set(hexKey, { mesh, index: iIdx, baseColor });
      blendedDump.push({ key: hexKey, blended: blendedHex, base: colorDump(baseColor) });
      terrainInstanceIdx[t] = iIdx + 1;
    }
    if (t === TerenBazowy.Gory) {
      const topY = vis.height + vis.yOffset;
      const q = hex.coords.q, r = hex.coords.r;
      if (styledTerrain) {
        const v = wariantDlaHeksa(q, r, NW, map.seed);
        dummy.position.set(x, topY, z);
        dummy.rotation.set(0, rotacjaDlaHeksa(q, r, map.seed), 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        const gm = goraInst[v]!;
        const gi = goraIdx[v]!;
        gm.setMatrixAt(gi, dummy.matrix);
        goraHexKey[v]![gi] = hexKey;
        goraOrigMatrix[v]![gi] = dummy.matrix.clone();
        goraIdx[v] = gi + 1;
      }
    }
    if (t === TerenBazowy.Wzgorza) {
      const baseY = vis.height + vis.yOffset;
      const q = hex.coords.q, r = hex.coords.r;
      const hillLayers = improvementKeysForHex(hex);
      if (styledTerrain && !hillLayers.includes('tarasy')) {
        const v = wariantDlaHeksa(q, r, NW, map.seed);
        dummy.position.set(x, baseY, z);
        dummy.rotation.set(0, rotacjaDlaHeksa(q, r, map.seed), 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        const wm = wzgorzeInst[v]!;
        const wi = wzgorzeIdx[v]!;
        wm.setMatrixAt(wi, dummy.matrix);
        wzgorzeHexKey[v]![wi] = hexKey;
        wzgorzeOrigMatrix[v]![wi] = dummy.matrix.clone();
        wzgorzeIdx[v] = wi + 1;
      }
    }
    if (useStyledDecor && renderStyle === 'roblox' && t === TerenBazowy.PlytkieMorze && coastInstBuf) {
      const hexQ = hex.coords.q;
      const hexR = hex.coords.r;
      const isDelta = deltaHexKeys.has(hexKey);
      collectRobloxCoastWaterInst(coastInstBuf, map, hexQ, hexR, x, z, seaSurfaceY, R, hexKey,
        { lite: coastCollectLite, isDelta, mouthEdges: cachedMouthEdges }, dummy);
    } else if (useStyledDecor && renderStyle === 'roblox' && landCoastSandKeys?.has(hexKey) && coastInstBuf) {
      collectRobloxLandCoastSandInst(coastInstBuf, map, hex.coords.q, hex.coords.r, x, z, surfaceTopY, R, hexKey, robloxLite, dummy);
    }
  }
  // LITERAL scene.ts:2693-2703, 2721-2728
  for (const t of terrainTypes) {
    const meshIdx = terrainIndex[t];
    const used = terrainInstanceIdx[t] ?? 0;
    if (meshIdx === undefined || used === 0) continue;
    instancedMeshes[meshIdx]!.count = used;
  }
  for (let v = 0; v < goraInst.length; v++) {
    goraInst[v]!.count = goraIdx[v]!;
    terrainPickKeys.set(goraInst[v]!, goraHexKey[v]!);
    wzgorzeInst[v]!.count = wzgorzeIdx[v]!;
    terrainPickKeys.set(wzgorzeInst[v]!, wzgorzeHexKey[v]!);
  }
  // LITERAL scene.ts:2749-2786
  const coastLayersDump: any[] = [];
  if (coastInstBuf) {
    const coastGeo = getCoastSharedGeometries(robloxLite);
    const waterMat = coastWaterMaterial();
    const sandMat = coastSandMaterial();
    const _coastWhite = new THREE.Color(1, 1, 1);
    const flushCoastLayer = (name: string, slots: any[], geo: THREE.BufferGeometry, mat: THREE.MeshLambertMaterial, renderOrder: number): void => {
      if (slots.length === 0) return;
      const mesh = new THREE.InstancedMesh(geo, mat, slots.length);
      mesh.frustumCulled = false;
      mesh.renderOrder = renderOrder;
      const keys: string[] = [];
      const orig: THREE.Matrix4[] = [];
      for (let i = 0; i < slots.length; i++) {
        mesh.setMatrixAt(i, slots[i]!.matrix);
        keys[i] = slots[i]!.hexKey;
        orig[i] = slots[i]!.matrix;
      }
      mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(slots.length * 3), 3);
      for (let i = 0; i < slots.length; i++) mesh.setColorAt(i, _coastWhite);
      coastInstMeshes.push(mesh);
      coastInstHexKey.push(keys);
      coastInstOrig.push(orig);
      coastLayersDump.push({
        layer: name, renderOrder, count: mesh.count, geo: geoDump(geo), mat: colorDump(mat.color), flat: mat.flatShading,
        m: Array.from(mesh.instanceMatrix.array), c: Array.from(mesh.instanceColor!.array), keys,
      });
    };
    flushCoastLayer('waterPool', coastInstBuf.waterPool, coastGeo.pool, waterMat, 0);
    flushCoastLayer('waterEdge', coastInstBuf.waterEdge, coastGeo.waterEdge, waterMat, 1);
    flushCoastLayer('waterLagoon', coastInstBuf.waterLagoon, coastGeo.lagoon, waterMat, 1);
    flushCoastLayer('waterTongue', coastInstBuf.waterTongue, coastGeo.tongue, waterMat, 1);
    flushCoastLayer('landSand', coastInstBuf.landSand, coastGeo.landSand, sandMat, 3);
  }
  // LITERAL scene.ts:2997-3054 (ocean backdrop + frame; materials reduced to their colour)
  const mapMaxDim = Math.max(map.szerokoscQ, map.wysokoscR);
  const mapSpanForCam = mapMaxDim * R * 1.85;
  const maxZoomDist = Math.max(320, mapSpanForCam * 1.2);
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const hex of Object.values(map.hexes) as any[]) {
    const { x, z } = axialToWorld(hex.coords.q, hex.coords.r, R);
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  }
  const seaVis = terrainVis(TerenBazowy.Morze, renderStyle);
  const seaTop = seaVis.height + seaVis.yOffset;
  const mapSpanBounds = Math.max(maxX - minX, maxZ - minZ);
  const OCEAN_BACKDROP_DEPTH = Math.min(28, Math.max(14, mapSpanBounds * 0.012));
  const OCEAN_BED_Y = seaTop - OCEAN_BACKDROP_DEPTH;
  const padO = Math.max(R * 7, maxZoomDist * 3.2, mapSpanBounds * 0.85);
  const padF = R * 1.4;
  const cXb = (minX + maxX) / 2, cZb = (minZ + maxZ) / 2;
  const oceanGeo = new THREE.PlaneGeometry((maxX - minX) + padO * 2, (maxZ - minZ) + padO * 2);
  const oceanMat = new THREE.MeshLambertMaterial({ color: palette.deepOcean, depthWrite: true, fog: false });
  const oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
  oceanMesh.rotation.x = -Math.PI / 2;
  oceanMesh.renderOrder = -10;
  oceanMesh.position.set(cXb, OCEAN_BED_Y, cZb);
  const frameMat = new THREE.MeshLambertMaterial({ color: palette.frame, fog: false });
  const frameMeshes: THREE.Mesh[] = [];
  const fx0 = minX - padF, fx1 = maxX + padF, fz0 = minZ - padF, fz1 = maxZ + padF;
  const frameBarH = R * 0.6, frameBarT = R * 0.7, frameY = seaTop + R * 0.12;
  const addBar = (w: number, d: number, px: number, pz: number) => {
    const g = new THREE.BoxGeometry(w, frameBarH, d);
    const m = new THREE.Mesh(g, frameMat);
    m.position.set(px, frameY, pz);
    frameMeshes.push(m);
  };
  const spanX = (fx1 - fx0) + frameBarT * 2;
  addBar(spanX, frameBarT, (fx0 + fx1) / 2, fz0 - frameBarT / 2);
  addBar(spanX, frameBarT, (fx0 + fx1) / 2, fz1 + frameBarT / 2);
  addBar(frameBarT, (fz1 - fz0), fx0 - frameBarT / 2, (fz0 + fz1) / 2);
  addBar(frameBarT, (fz1 - fz0), fx1 + frameBarT / 2, (fz0 + fz1) / 2);
  oceanMesh.updateMatrixWorld(true);
  for (const m of frameMeshes) m.updateMatrixWorld(true);

  // dump of the build result
  const prismDump = instancedMeshes.map((m) => {
    const t = terrainTypes.find((tt) => terrainIndex[tt] !== undefined && instancedMeshes[terrainIndex[tt]] === m)!;
    return {
      t, count: m.count, geo: geoDump(m.geometry), mat: colorDump((m.material as THREE.MeshLambertMaterial).color),
      flat: (m.material as THREE.MeshLambertMaterial).flatShading,
      m: Array.from(m.instanceMatrix.array.slice(0, m.count * 16)), c: Array.from(m.instanceColor!.array.slice(0, m.count * 3)),
      keys: terrainPickKeys.get(m)!.slice(0, m.count),
    };
  });
  const solidDump = (arr: THREE.InstancedMesh[], keys: string[][]) => arr.map((m, v) => ({
    v, count: m.count, m: Array.from(m.instanceMatrix.array.slice(0, m.count * 16)), keys: keys[v]!.slice(0, m.count),
  }));
  const build = {
    robloxLite, hexCount,
    deltaKeys: [...deltaHexKeys].sort(), mouthEdges: [...(cachedMouthEdges ?? [])].sort(),
    sandKeys: [...(landCoastSandKeys ?? [])],
    prisms: prismDump, blended: blendedDump,
    gora: solidDump(goraInst, goraHexKey), wzgorze: solidDump(wzgorzeInst, wzgorzeHexKey),
    coast: coastLayersDump,
    backdrop: {
      bedY: OCEAN_BED_Y, ocean: { geo: geoDump(oceanGeo), world: Array.from(oceanMesh.matrixWorld.elements), mat: colorDump(oceanMat.color) },
      frame: frameMeshes.map((m) => ({ geo: geoDump(m.geometry), world: Array.from(m.matrixWorld.elements) })), frameMat: colorDump(frameMat.color),
    },
  };

  // ---------------------------------------------------------------------------
  // LITERAL scene.ts:3139, 3221-3235, 3522-3637 (prism part of setFog: colours, matrices,
  // dirty-set cache, ocean-hide). Dropped: decor (dekorRefByHex is empty: DEKOR_ENABLED=false),
  // ocean/frame visibility (exported as the `show` flag), scene.background/fog,
  // applyZoomLodDecor (solids/coast fog — out of scope, NIE_ZMIERZONO), shadow flags, timing.
  const ZERO_MATRIX = new THREE.Matrix4().makeScale(0, 0, 0);
  let lastFogVisible: Set<string> | null = null;
  let lastFogExplored: Set<string> | null = null;
  const lastFogSig = new Map<string, number>();
  let lastFogShowOceanBackdrop: boolean | null = null;
  function setFog(visible: Set<string>, explored: Set<string>, opts?: { landReveal?: boolean }): boolean {
    const prevVisible = lastFogVisible;
    lastFogVisible = visible;
    lastFogExplored = explored;
    const landReveal = opts?.landReveal ?? false;
    const isHidden = (k: string) => !visible.has(k) && !explored.has(k);
    const touchedMeshes = new Set<THREE.InstancedMesh>();
    let anyHidden = false;
    for (const [key] of hexInstance) {
      if (isHidden(key)) { anyHidden = true; break; }
    }
    const showOceanBackdropNow = !anyHidden || landReveal;
    const contextChanged = showOceanBackdropNow !== lastFogShowOceanBackdrop;
    if (contextChanged) {
      lastFogSig.clear();
      lastFogShowOceanBackdrop = showOceanBackdropNow;
    }
    let keysToScan: Iterable<string>;
    if (contextChanged || prevVisible === null) {
      keysToScan = hexInstance.keys();
    } else {
      const changed = new Set<string>();
      for (const k of visible) if (!prevVisible.has(k)) changed.add(k);
      for (const k of prevVisible) if (!visible.has(k)) changed.add(k);
      keysToScan = changed;
    }
    for (const key of keysToScan) {
      const entry = hexInstance.get(key);
      if (entry === undefined) continue;
      const sig = visible.has(key) ? 0 : explored.has(key) ? 1 : 2;
      if (lastFogSig.get(key) === sig) continue;
      const { mesh, index, baseColor } = entry;
      let color: THREE.Color;
      if (sig === 0) color = baseColor.clone();
      else if (sig === 1) color = baseColor.clone().multiplyScalar(FOG_EXPLORED_BRIGHTNESS);
      else color = FOG_HIDDEN_COLOR.clone();
      mesh.setColorAt(index, color);
      if (sig === 2) mesh.setMatrixAt(index, ZERO_MATRIX);
      else { const orig = hexOrigMatrix.get(key); if (orig) mesh.setMatrixAt(index, orig); }
      lastFogSig.set(key, sig);
      touchedMeshes.add(mesh);
    }
    const showOceanBackdrop = showOceanBackdropNow;
    if (renderStyle === 'roblox' && showOceanBackdrop) {
      for (const [key, entry] of hexInstance) {
        const teren = hexTeren.get(key);
        if (teren === undefined || isDryLandTeren(teren)) continue;
        entry.mesh.setMatrixAt(entry.index, ZERO_MATRIX);
        touchedMeshes.add(entry.mesh);
      }
    }
    return showOceanBackdrop;
  }
  const allKeys = Object.keys(map.hexes);
  const fogDump: any[] = [];
  for (const call of spec.fog) {
    const vis = new Set(call.visible === 'ALL' ? allKeys : call.visible);
    const exp = new Set(call.explored === 'ALL' ? allKeys : call.explored);
    const show = setFog(vis, exp, { landReveal: call.landReveal ?? false });
    fogDump.push({
      call: { visible: [...vis], explored: [...exp], landReveal: call.landReveal ?? false }, show,
      prisms: instancedMeshes.map((m) => ({ m: Array.from(m.instanceMatrix.array.slice(0, m.count * 16)), c: Array.from(m.instanceColor!.array.slice(0, m.count * 3)) })),
    });
  }
  return {
    name: spec.name, seed: spec.seed, W: spec.W, H: spec.H, mapDetailQuality: spec.mapDetailQuality,
    hexes: spec.hexes.map((h) => [h.q, h.r, h.t, h.tarasy ? 1 : 0]),
    rivers: spec.rivers.map((p) => ({ path: p.path, kind: spec.kindsGiven ? (p.kind ?? 'main') : null })),
    build, fog: fogDump,
  };
}

// ---------------------------------------------------------------------------
// Test maps
function lcg(seed: number) { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
const T: Record<string, any> = {
  M: TerenBazowy.Morze, P: TerenBazowy.PlytkieMorze, L: TerenBazowy.Laka, R: TerenBazowy.Rownina,
  D: TerenBazowy.Pustynia, W: TerenBazowy.Wzgorza, G: TerenBazowy.Gory, O: TerenBazowy.Polarny,
};
function fromRows(rows: string[], dq = 0, dr = 0): HexSpec[] {
  const out: HexSpec[] = [];
  for (let r = 0; r < rows.length; r++) for (let q = 0; q < rows[r]!.length; q++) {
    const ch = rows[r]![q]!;
    if (ch === '.') continue;
    out.push({ q: q + dq, r: r + dr, t: T[ch.toUpperCase()]!, tarasy: ch === 'w' });
  }
  return out;
}
const keysOf = (hs: HexSpec[], pred: (h: HexSpec) => boolean) => hs.filter(pred).map((h) => `${h.q},${h.r}`);

// noise-like random map: elevation from summed sines (deterministic), terrain by thresholds
function randomMap(name: string, seed: number, W: number, H: number, rseed: number, q0 = 0, r0 = 0) {
  const rnd = lcg(rseed);
  const ph = [rnd() * 6.283, rnd() * 6.283, rnd() * 6.283, rnd() * 6.283];
  const fr = [0.11 + rnd() * 0.1, 0.07 + rnd() * 0.1, 0.23 + rnd() * 0.1];
  const hexes: HexSpec[] = [];
  const elev = new Map<string, number>();
  for (let r = 0; r < H; r++) for (let q = 0; q < W; q++) {
    const e = 0.5 * Math.sin(q * fr[0]! + ph[0]!) + 0.4 * Math.cos(r * fr[1]! + ph[1]!) + 0.3 * Math.sin((q + r) * fr[2]! + ph[2]!) + (rnd() - 0.5) * 0.25;
    const m = Math.sin(q * 0.31 + r * 0.17 + ph[3]!);
    let t: any;
    if (e < -0.35) t = TerenBazowy.Morze;
    else if (e < -0.18) t = TerenBazowy.PlytkieMorze;
    else if (e > 0.72) t = TerenBazowy.Gory;
    else if (e > 0.5) t = TerenBazowy.Wzgorza;
    else if (r < 2 || r >= H - 2) t = TerenBazowy.Polarny;
    else t = m > 0.4 ? TerenBazowy.Pustynia : m > -0.2 ? TerenBazowy.Rownina : TerenBazowy.Laka;
    const qq = q + q0, rr = r + r0;
    elev.set(`${qq},${rr}`, e);
    hexes.push({ q: qq, r: rr, t, tarasy: t === TerenBazowy.Wzgorza && rnd() < 0.2 });
  }
  // rivers: downhill walks from high land until water
  const rivers: Array<{ path: Array<[number, number]>; kind?: string }> = [];
  const kinds = ['main', 'main', 'medium', 'short', 'tributary'];
  const byKey = new Map(hexes.map((h) => [`${h.q},${h.r}`, h]));
  for (let i = 0; i < Math.max(3, Math.floor(W * H / 120)); i++) {
    const start = hexes[Math.floor(rnd() * hexes.length)]!;
    if (!isDryLandTeren(start.t)) continue;
    const path: Array<[number, number]> = [[start.q, start.r]];
    let cur = start;
    for (let s = 0; s < 40; s++) {
      let best: HexSpec | null = null; let be = Infinity;
      for (const [dq, dr] of HEX_NEIGHBORS) {
        const nb = byKey.get(`${cur.q + dq},${cur.r + dr}`);
        if (!nb || path.some(([a, b]) => a === nb.q && b === nb.r)) continue;
        const e = elev.get(`${nb.q},${nb.r}`)! + rnd() * 0.05;
        if (e < be) { be = e; best = nb; }
      }
      if (!best) break;
      path.push([best.q, best.r]);
      cur = best;
      if (!isDryLandTeren(cur.t)) break;
    }
    rivers.push({ path, kind: kinds[Math.floor(rnd() * kinds.length)] });
  }
  return { name, seed, W, H, hexes, rivers };
}

const maps: MapSpec[] = [];
{
  // A: 9x7 hand-made, all 8 terrains, coast + sea, two rivers to the sea (delta / mouth edges)
  const hexes = fromRows([
    'MMMMMMMMM',
    'MPPPPPPMM',
    'PLRDLWGPM',
    'PLwGGWLRP',
    'PDRWGLOLP',
    'MPLRWDLPM',
    'MMPPPPPMM',
  ]);
  const rivers = [
    { path: [[5, 4], [5, 5], [5, 6]] as Array<[number, number]>, kind: 'main' },
    { path: [[3, 3], [2, 4], [1, 4], [0, 4]] as Array<[number, number]>, kind: 'main' },
    { path: [[6, 2], [7, 2]] as Array<[number, number]>, kind: 'tributary' },
    { path: [[2, 2], [2, 1]] as Array<[number, number]>, kind: 'main' },
  ];
  const vis = keysOf(hexes, (h) => h.q >= 2 && h.q <= 5 && h.r >= 1 && h.r <= 4);
  const vis2 = keysOf(hexes, (h) => h.q >= 4 && h.r >= 3);
  const ex2 = [...new Set([...vis, ...vis2])];
  maps.push({ name: 'A', seed: 12345, W: 9, H: 7, hexes, rivers, kindsGiven: true, mapDetailQuality: 'high', fog: [
    { visible: vis, explored: vis },
    { visible: vis2, explored: ex2 },
    { visible: vis2, explored: ex2 },
    { visible: 'ALL', explored: 'ALL' },
    { visible: vis, explored: ex2 },
    { visible: vis, explored: ex2, landReveal: true },
    { visible: [], explored: ex2 },
    { visible: [], explored: [] },
  ] });
  // A-lite: same map, low detail (robloxLite) and no riverPathKinds (all 'main')
  maps.push({ name: 'A-lite', seed: 12345, W: 9, H: 7, hexes, rivers, kindsGiven: false, mapDetailQuality: 'low', fog: [] });
}
{
  // B: 12x9 pseudo-random (as P4-10), negative seed, holes, reversed key order, terraces
  const rnd = lcg(777);
  const all = Object.values(TerenBazowy);
  const hexes: HexSpec[] = [];
  for (let r = 0; r < 9; r++) for (let q = 0; q < 12; q++) {
    if ((q === 5 && r === 4) || (q === 0 && r === 8)) continue;
    const t = all[Math.floor(rnd() * all.length)]!;
    hexes.push({ q, r, t, tarasy: t === TerenBazowy.Wzgorza && q === 7 });
  }
  hexes.reverse();
  const vis = keysOf(hexes, (h) => (h.q + h.r) % 3 !== 0);
  maps.push({ name: 'B', seed: -42, W: 12, H: 9, hexes, rivers: [{ path: [[3, 3], [3, 4], [3, 5], [2, 6]] }], kindsGiven: false,
    mapDetailQuality: 'high', fog: [
      { visible: vis, explored: vis }, { visible: 'ALL', explored: 'ALL' }, { visible: vis.slice(0, 20), explored: vis },
      { visible: vis.slice(10, 40), explored: vis, landReveal: true }] });
}
{
  const c = randomMap('C', 2026, 40, 30, 4242);
  const vis = keysOf(c.hexes, (h) => (h.q - 20) ** 2 + (h.r - 15) ** 2 < 70);
  const ex = keysOf(c.hexes, (h) => (h.q - 18) ** 2 + (h.r - 14) ** 2 < 160);
  maps.push({ ...c, kindsGiven: true, mapDetailQuality: 'high', fog: [{ visible: vis, explored: [...new Set([...vis, ...ex])] }, { visible: 'ALL', explored: 'ALL' }] });
  const d = randomMap('D', 123456789, 64, 36, 99, -10, -5);
  maps.push({ ...d, kindsGiven: true, mapDetailQuality: 'medium', fog: [] });
  const e = randomMap('E', -2147483648, 70, 50, 31337);
  maps.push({ ...e, kindsGiven: true, mapDetailQuality: 'medium', fog: [] }); // 3500 hexes > 3000 → lite
  const f = randomMap('F', 7, 25, 18, 5);
  maps.push({ ...f, kindsGiven: false, mapDetailQuality: 'low', fog: [{ visible: [], explored: [] }, { visible: 'ALL', explored: 'ALL' }] });
}

const results = maps.map(buildTerrain);
let nInst = 0;
for (const r of results) {
  for (const p of r.build.prisms) nInst += p.count;
  for (const g of [...r.build.gora, ...r.build.wzgorze]) nInst += g.count;
  for (const c of r.build.coast) nInst += c.count;
}
for (const r of results) {
  fs.writeFileSync(path.join(OUT, `map_${r.name}.json`), JSON.stringify({ generator: 'tests/fixtures/terrain/gen.ts', three: THREE.REVISION, ...r }));
}

// ---------------------------------------------------------------------------
// Colour math micro-vectors (THREE.Color r169 with ColorManagement on).
const crnd = lcg(2468);
const color: any = { setHex: [], getHex: [], hsl: [], pow: [], hypot: [], preset: [] };
for (let i = 0; i < 1024; i++) {
  const hex = i < 256 ? i * 0x010101 : Math.floor(crnd() * 0x1000000);
  const c = new THREE.Color(hex);
  color.setHex.push([hex, c.r, c.g, c.b]);
}
for (let i = 0; i < 2048; i++) {
  const c = new THREE.Color().setRGB(crnd() * 1.1 - 0.05, crnd(), i % 7 === 0 ? 0.0031308 : crnd());
  color.getHex.push([c.r, c.g, c.b, c.getHex()]);
}
for (let i = 0; i < 2048; i++) {
  const c = new THREE.Color(Math.floor(crnd() * 0x1000000));
  if (i % 11 === 0) c.setScalar(crnd());
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  const h2 = crnd() * 2.4 - 0.7, s2 = crnd() * 1.3 - 0.15, l2 = crnd() * 1.3 - 0.15;
  const d = new THREE.Color().setHSL(h2, i % 13 === 0 ? 0 : s2, l2);
  color.hsl.push([c.r, c.g, c.b, hsl.h, hsl.s, hsl.l, h2, i % 13 === 0 ? 0 : s2, l2, d.r, d.g, d.b]);
}
// Math.pow (V8 base::ieee754::pow) on the transfer-function exponents and random ones.
for (let i = 0; i < 6144; i++) {
  const x = i % 4 === 0 ? crnd() : i % 4 === 1 ? crnd() * 1.1 + 0.04 : i % 4 === 2 ? crnd() * 1e3 : (crnd() - 0.5) * 20;
  const y = i % 5 === 0 ? 2.4 : i % 5 === 1 ? 0.41666 : i % 5 === 2 ? (crnd() - 0.5) * 12 : i % 5 === 3 ? Math.round((crnd() - 0.5) * 12) : crnd() * 700 - 350;
  const p = Math.pow(x, y);
  if (Number.isFinite(p) || p === 0) color.pow.push([x, y, Number.isNaN(p) ? null : p]);
  else color.pow.push([x, y, Number.isNaN(p) ? null : p > 0 ? 'inf' : '-inf']);
}
// Math.hypot (V8 builtin, 2 arguments) on random and neighbour-direction inputs.
for (let i = 0; i < 2048; i++) {
  const a = i % 3 === 0 ? (crnd() - 0.5) * 4 : i % 3 === 1 ? (crnd() - 0.5) * 1e-3 : (crnd() - 0.5) * 1e6;
  const b = i % 7 === 0 ? 0 : i % 3 === 2 ? (crnd() - 0.5) * 4 : (crnd() - 0.5) * 100;
  color.hypot.push([a, b, Math.hypot(a, b)]);
}
for (const d of ['low', 'medium', 'high']) for (const n of [0, 2999, 3000, 3001, 7999, 8000, 8001, 40000]) {
  color.preset.push([d, n, resolveRenderPreset(normalizeMapRenderOptions({ style: 'roblox', mapDetailQuality: d } as any), n).robloxLite]);
}
fs.writeFileSync(path.join(OUT, 'color.json'), JSON.stringify({ generator: 'tests/fixtures/terrain/gen.ts', three: THREE.REVISION, fogExplored: FOG_EXPLORED_BRIGHTNESS, ...color }));
console.log(`terrain maps=${results.length} instances=${nInst} fogCalls=${results.reduce((a, r) => a + r.fog.length, 0)} colorCases=${color.setHex.length + color.getHex.length + color.hsl.length} pow=${color.pow.length} hypot=${color.hypot.length}`);
