// R-RUSTPORT-P4-10-PICKING-CPU-Q1 — generator wektorów referencyjnych pickingu.
//
// Uruchamiany WYŁĄCZNIE poza repo (katalog scratch). Bundel esbuild łączy:
//  - three@0.169.0 (npm, wersja z gra/package.json),
//  - DOSŁOWNE moduły weba z `git archive edb8fb56 gra/src gra/data`
//    (picker.ts, camera.ts, hexutil.ts, mapRenderStyle.ts, teren-gory-wzgorza.ts,
//     terrain-improvements.ts, types/hex.ts) — importowane, nie przepisywane,
//  - kopie fragmentów, których nie da się zaimportować bez DOM/WebGL
//    (scene.ts: hexPrismNoBottomGeo, isDryLandTeren, terrainVis, pętla rozmieszczenia
//     pryzmów i brył, resolveTerrainPick, ZERO_MATRIX; units.ts: terrainTopY,
//     unitTerrainRelief, pickUnitIdAt; main.ts: pickHexAt, pickMapTarget) — każda
//     oznaczona `// LITERAL <plik>:<linie>`. „LITERAL” = ta sama logika i arytmetyka
//     w tej samej kolejności, NIE kopia znak po znaku: typy → `any`, komentarze usunięte,
//     ustalony styl roblox (gałęzie `renderStyle`/`styledTerrain=true`/`B_NO_BOTTOM=true`),
//     martwe dla roblox pola civ (`TERRAIN_VISUALS[t]`, `CIV_TERRAIN_TOP`) → `{height:0,yOffset:0}`,
//     usunięte materiały/kolory/`castShadow`/`scene.add`/`performance`/`*OrigMatrix`.
//     Pełna lista: README.md §Adaptations i P4-10 §7.1. Fragmenty oznaczone `MODEL`
//     (mgła) NIE są kopią — odtwarzają skutek kilku funkcji weba (opis przy nich).
// Wyjście: JSON-y w katalogu podanym jako argv[2].

import * as THREE from 'three';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { TerenBazowy } from '../websrc/gra/src/types/hex';
import {
  terrainVisualForStyle, landCoastSandNeeded, GAME_MAP_RENDER_STYLE,
} from '../websrc/gra/src/render/mapRenderStyle';
import {
  pixelToHex, worldToAxial, clientRectToNdc, refreshInstancedPickBounds,
} from '../websrc/gra/src/input/picker';
import {
  axialToWorld, worldToAxial as worldToAxialHexutil, HEX_R, mapCenter,
} from '../websrc/gra/src/render/hexutil';
import { CameraController } from '../websrc/gra/src/render/camera';
import {
  goraGeometria, wzgorzeGeometria, wariantDlaHeksa, rotacjaDlaHeksa,
  TEREN_MATERIAL, LICZBA_WARIANTOW_TERENU,
} from '../websrc/gra/src/render/teren-gory-wzgorza';
import { improvementKeysForHex } from '../websrc/gra/src/game/terrain-improvements';

const OUT = process.argv[2];
if (!OUT) throw new Error('usage: node gen.mjs <outdir>');
fs.mkdirSync(OUT, { recursive: true });

// Stuby DOM wymagane przez konstruktor CameraController (_bind dodaje nasłuchiwacze).
(globalThis as any).window = { addEventListener() {}, removeEventListener() {} };
(globalThis as any).document = { addEventListener() {}, removeEventListener() {} };

// ---------------------------------------------------------------------------
// LITERAL scene.ts:578-580
function isDryLandTeren(tb: TerenBazowy): boolean {
  return tb !== TerenBazowy.Morze && tb !== TerenBazowy.PlytkieMorze;
}
// LITERAL scene.ts:166-170 (civ-spec nieużywany w stylu roblox — mapRenderStyle.ts:231)
function terrainVis(t: TerenBazowy, renderStyle: any) {
  const civ = { height: 0, yOffset: 0 };
  const spec = terrainVisualForStyle(t, renderStyle, civ);
  return { height: spec.height, yOffset: spec.yOffset };
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
// LITERAL scene.ts:3139
const ZERO_MATRIX = new THREE.Matrix4().makeScale(0, 0, 0);

// LITERAL units.ts:214-224 (CIV_TERRAIN_TOP nieużywany w stylu roblox)
function terrainTopY(hex: any): number {
  const spec = terrainVisualForStyle(hex.terenBazowy, GAME_MAP_RENDER_STYLE, { height: 0, yOffset: 0 });
  return spec.height + spec.yOffset;
}
function unitTerrainRelief(t: TerenBazowy): number {
  if (t === TerenBazowy.Wzgorza) return HEX_R * 0.22;
  if (t === TerenBazowy.Gory)    return HEX_R * 0.34;
  return 0;
}

// ---------------------------------------------------------------------------
// Scena pickingu (scene.ts buildScene — tylko to, co trafia do terrainPickMeshes)
interface MapSpec {
  name: string; seed: number; W: number; H: number;
  hexes: Array<{ q: number; r: number; t: TerenBazowy; hidden?: boolean; solidHidden?: boolean; tarasy?: boolean }>;
  solidsVisible: boolean;
}

function buildPickScene(spec: MapSpec) {
  const R = HEX_R;
  const renderStyle = 'roblox';
  const map: any = { seed: spec.seed, szerokoscQ: spec.W, wysokoscR: spec.H, hexes: {} as Record<string, any> };
  for (const h of spec.hexes) {
    map.hexes[`${h.q},${h.r}`] = {
      coords: { q: h.q, r: h.r }, terenBazowy: h.t,
      ulepszenia: h.tarasy ? ['tarasy'] : undefined,
    };
  }
  // LITERAL scene.ts:1702-1703, 1723-1745 (tylko liczniki terenu / gór / wzgórz)
  const NW = LICZBA_WARIANTOW_TERENU;
  const styledTerrain = true; // useStyledDecor && renderStyle === 'roblox'
  const countByTerrain: Partial<Record<TerenBazowy, number>> = {};
  const goraVarCount: number[] = new Array(NW).fill(0);
  const wzgorzeVarCount: number[] = new Array(NW).fill(0);
  for (const hex of Object.values(map.hexes) as any[]) {
    const t = hex.terenBazowy;
    countByTerrain[t as TerenBazowy] = (countByTerrain[t as TerenBazowy] ?? 0) + 1;
    if (t === TerenBazowy.Gory) {
      if (styledTerrain) goraVarCount[wariantDlaHeksa(hex.coords.q, hex.coords.r, NW, map.seed)]!++;
    }
    if (t === TerenBazowy.Wzgorza) {
      if (styledTerrain) wzgorzeVarCount[wariantDlaHeksa(hex.coords.q, hex.coords.r, NW, map.seed)]!++;
    }
  }
  // LITERAL scene.ts:1760-1790 (bez materiałów kolorów — nie wpływają na raycast)
  const instancedMeshes: THREE.InstancedMesh[] = [];
  const terrainPickKeys = new Map<THREE.InstancedMesh, string[]>();
  const terrainIndex: Partial<Record<TerenBazowy, number>> = {};
  const terrainTypes = Object.values(TerenBazowy);
  for (const t of terrainTypes) {
    const cnt = countByTerrain[t] ?? 0;
    if (cnt === 0) continue;
    const vis = terrainVis(t, renderStyle);
    const hexR = renderStyle === 'roblox' ? R * 1.008 : R * 0.998;
    const geo = hexPrismNoBottomGeo(hexR, vis.height);
    const mat = new THREE.MeshLambertMaterial({});
    const mesh = new THREE.InstancedMesh(geo, mat, cnt);
    mesh.frustumCulled = false;
    instancedMeshes.push(mesh);
    terrainIndex[t] = instancedMeshes.length - 1;
  }
  const terrainInstanceIdx: Partial<Record<TerenBazowy, number>> = {};
  for (const t of terrainTypes) terrainInstanceIdx[t] = 0;
  // LITERAL scene.ts:1852-1872
  const goraInst: THREE.InstancedMesh[] = [];
  const wzgorzeInst: THREE.InstancedMesh[] = [];
  const goraHexKey: string[][] = [];
  const goraIdx: number[] = [];
  const wzgorzeHexKey: string[][] = [];
  const wzgorzeIdx: number[] = [];
  if (styledTerrain) {
    for (let v = 0; v < NW; v++) {
      const gm = new THREE.InstancedMesh(goraGeometria(v), TEREN_MATERIAL, Math.max(1, goraVarCount[v]!));
      gm.frustumCulled = false; gm.count = 0;
      goraInst.push(gm); goraHexKey.push([]); goraIdx.push(0);
      const wm = new THREE.InstancedMesh(wzgorzeGeometria(v), TEREN_MATERIAL, Math.max(1, wzgorzeVarCount[v]!));
      wm.frustumCulled = false; wm.count = 0;
      wzgorzeInst.push(wm); wzgorzeHexKey.push([]); wzgorzeIdx.push(0);
    }
  }
  const dummy = new THREE.Object3D();
  // LITERAL scene.ts:2088-2089
  const seaVisEarly = terrainVis(TerenBazowy.Morze, renderStyle);
  const seaSurfaceY = seaVisEarly.height + seaVisEarly.yOffset;
  const hexInstance = new Map<string, { mesh: THREE.InstancedMesh; index: number }>();
  const goraOrig: Array<{ v: number; i: number; key: string }> = [];
  const wzgOrig: Array<{ v: number; i: number; key: string }> = [];
  // LITERAL scene.ts:2213, 2246-2262, 2290-2309, 2414-2430, 2462-2480
  const c3Hexes = Object.values(map.hexes) as any[];
  for (let c3i = 0; c3i < c3Hexes.length; c3i++) {
    const hex = c3Hexes[c3i]!;
    const t   = hex.terenBazowy;
    const vis = terrainVis(t, renderStyle);
    const { x, z } = axialToWorld(hex.coords.q, hex.coords.r, R);
    const coastalDrop = (
      renderStyle === 'roblox'
      && landCoastSandNeeded(map, hex.coords.q, hex.coords.r, t)
    ) ? R * 0.045 : 0;
    const surfaceTopY = vis.height + vis.yOffset - coastalDrop;
    let y = surfaceTopY - vis.height / 2;
    let scaleY = 1;
    if (renderStyle === 'roblox' && !isDryLandTeren(t)) {
      y = seaSurfaceY - vis.height / 2;
    }
    const hexKey = `${hex.coords.q},${hex.coords.r}`;
    const meshIdx = terrainIndex[t as TerenBazowy];
    const iIdx    = terrainInstanceIdx[t as TerenBazowy] ?? 0;
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
      hexInstance.set(hexKey, { mesh, index: iIdx });
      terrainInstanceIdx[t as TerenBazowy] = iIdx + 1;
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
        goraOrig.push({ v, i: gi, key: hexKey });
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
        wzgOrig.push({ v, i: wi, key: hexKey });
        wzgorzeIdx[v] = wi + 1;
      }
    }
  }
  // LITERAL scene.ts:2721-2727
  for (let v = 0; v < goraInst.length; v++) {
    goraInst[v]!.count = goraIdx[v]!;
    terrainPickKeys.set(goraInst[v]!, goraHexKey[v]!);
    wzgorzeInst[v]!.count = wzgorzeIdx[v]!;
    terrainPickKeys.set(wzgorzeInst[v]!, wzgorzeHexKey[v]!);
  }
  // LITERAL scene.ts:3684, 3691
  const terrainPickMeshes: THREE.InstancedMesh[] = [...instancedMeshes, ...goraInst, ...wzgorzeInst];
  refreshInstancedPickBounds(terrainPickMeshes);
  // MODEL (NIE LITERAL) — skutek mgły/miast/LOD na meshach pickingu, nie kopia kodu:
  //  - pryzm heksa ukrytego (sig === 2) → ZERO_MATRIX: scene.ts:3591-3592 (setFog);
  //  - bryły gór/wzgórz ukrytego heksa (bri <= 0) lub pod miastem (decorHiddenHexKeys)
  //    → ZERO_MATRIX: scene.ts:3281-3302 (applyTerrainFog) oraz 3145-3158 (hideInstancedOnHex)
  //    wołane z 3168-3184 (hideDecorAtHex);
  //  - LOD: visible = zoomFlags.styledDecor (scene.ts:3370-3375);
  //  - reguła ocean-hide (scene.ts:3629-3637) NIE jest modelowana (P4-10 §5 NIE_ZMIERZONO).
  for (const h of spec.hexes) {
    const key = `${h.q},${h.r}`;
    if (h.hidden) {
      const e = hexInstance.get(key)!;
      e.mesh.setMatrixAt(e.index, ZERO_MATRIX);
    }
    if (h.hidden || h.solidHidden) {
      for (const o of goraOrig) if (o.key === key) goraInst[o.v]!.setMatrixAt(o.i, ZERO_MATRIX);
      for (const o of wzgOrig) if (o.key === key) wzgorzeInst[o.v]!.setMatrixAt(o.i, ZERO_MATRIX);
    }
  }
  for (let v = 0; v < goraInst.length; v++) {
    goraInst[v]!.visible = spec.solidsVisible;
    wzgorzeInst[v]!.visible = spec.solidsVisible;
  }
  // LITERAL scene.ts:3088-3098
  function resolveTerrainPick(mesh: THREE.InstancedMesh, instanceId: number): { q: number; r: number } | null {
    const keys = terrainPickKeys.get(mesh);
    const key = keys?.[instanceId];
    if (!key) return null;
    const comma = key.indexOf(',');
    if (comma < 0) return null;
    const q = Number(key.slice(0, comma));
    const r = Number(key.slice(comma + 1));
    if (!Number.isFinite(q) || !Number.isFinite(r)) return null;
    return { q, r };
  }
  // unitRenderer.topYAt (units.ts:6409-6412): hexGrid = wszystkie heksy mapy
  const topYAt = (q: number, r: number) => {
    const hex = map.hexes[`${q},${r}`];
    return hex ? terrainTopY(hex) : 0;
  };
  // eksport macierzy instancji (Float32) — do porównania z budową sceny w Rust
  const instances: any[] = [];
  terrainPickMeshes.forEach((m, mi) => {
    const keys = terrainPickKeys.get(m) ?? [];
    for (let i = 0; i < m.count; i++) {
      instances.push({ mesh: mi, i, key: keys[i] ?? null, m: Array.from(m.instanceMatrix.array.slice(i * 16, i * 16 + 16)) });
    }
  });
  return { map, terrainPickMeshes, resolveTerrainPick, topYAt, instances };
}

// ---------------------------------------------------------------------------
// Jednostki (syntetyczne modele; reguła wyboru = LITERAL units.ts:5867-5893 + main.ts:1894-1901)
interface UnitSpec { id: string; q: number; r: number; kind: 'box' | 'tall' | 'flag'; yaw: number; dx?: number; dz?: number }
function buildUnitToken(u: UnitSpec, topYAt: (q: number, r: number) => number, terrain: (q: number, r: number) => TerenBazowy | undefined) {
  const g = new THREE.Group();
  g.userData['unitId'] = u.id;
  const { x, z } = axialToWorld(u.q, u.r, HEX_R);
  const t = terrain(u.q, u.r);
  const y = topYAt(u.q, u.r) + (t ? unitTerrainRelief(t) : 0);
  g.position.set(x + (u.dx ?? 0), y, z + (u.dz ?? 0));
  g.rotation.set(0, u.yaw, 0);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.08, 12), new THREE.MeshStandardMaterial());
  base.position.set(0, 0.04, 0);
  g.add(base);
  if (u.kind === 'box' || u.kind === 'flag') {
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.42, 0.16), new THREE.MeshStandardMaterial());
    body.position.set(0, 0.29, 0);
    g.add(body);
  }
  if (u.kind === 'tall') {
    const spear = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.3, 0.05), new THREE.MeshStandardMaterial());
    spear.position.set(0.15, 0.6, -0.55);
    spear.rotation.set(0.9, 0, 0.15);
    g.add(spear);
  }
  if (u.kind === 'flag') {
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.3), new THREE.MeshStandardMaterial({ side: THREE.DoubleSide }));
    flag.position.set(0.0, 0.75, -0.3);
    flag.rotation.set(-0.4, 0.3, 0);
    g.add(flag);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.25), new THREE.MeshStandardMaterial({ side: THREE.BackSide }));
    back.position.set(0.3, 0.55, 0.1);
    back.rotation.set(0.2, 2.6, 0);
    g.add(back);
  }
  g.updateMatrixWorld(true);
  return g;
}
function exportTokenMeshes(g: THREE.Group) {
  const out: any[] = [];
  g.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const geo = m.geometry;
    const side = (m.material as THREE.Material).side;
    out.push({
      pos: Array.from(geo.attributes.position!.array as Float32Array),
      index: geo.index ? Array.from(geo.index.array as Uint16Array) : null,
      world: Array.from(m.matrixWorld.elements),
      side: side === THREE.FrontSide ? 'front' : side === THREE.BackSide ? 'back' : 'double',
    });
  });
  return out;
}

// ---------------------------------------------------------------------------
// Kamera: PerspectiveCamera z scene.ts:3075-3085 + CameraController (camera.ts) z
// nadpisanym target/dist i _syncCamera (camera.ts:130-144).
function makeCamera(spec: MapSpec, vpW: number, vpH: number, tx: number, tz: number, dist: number) {
  const R = HEX_R;
  const center = mapCenter(spec.W, spec.H, R);
  // LITERAL scene.ts:2997-2999, 3074-3085
  const mapMaxDim = Math.max(spec.W, spec.H);
  const mapSpanForCam = mapMaxDim * R * 1.85;
  const maxZoomDist = Math.max(320, mapSpanForCam * 1.2);
  const farClip = Math.max(1200, maxZoomDist * 5, mapMaxDim * R * 6);
  const camAspect = vpW / vpH;
  const camera = new THREE.PerspectiveCamera(50, camAspect, 0.5, farClip);
  const camDist = Math.max(spec.W, spec.H) * R * 1.65;
  camera.position.set(center.x, camDist * 0.9, center.z + camDist * 0.7);
  camera.lookAt(center.x, 0, center.z);
  const canvasStub: any = { addEventListener() {}, removeEventListener() {} };
  const ctrl: any = new CameraController(camera, canvasStub, { x: center.x, z: center.z }, { minDist: 8 / 3, maxDist: maxZoomDist });
  ctrl.target.x = tx; ctrl.target.z = tz; ctrl.dist = dist;
  ctrl._syncCamera();
  // scene.ts:3105-3106 onResize
  camera.aspect = vpW / vpH;
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);
  return { camera, farClip, maxZoomDist };
}

function projectToClient(p: THREE.Vector3, camera: THREE.Camera, rect: any) {
  const v = p.clone().project(camera);
  return { x: rect.left + (v.x * 0.5 + 0.5) * rect.width, y: rect.top + (-v.y * 0.5 + 0.5) * rect.height };
}

// ---------------------------------------------------------------------------
// Mapy testowe
function lcg(seed: number) { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }

function mapA(): MapSpec {
  // 9x7, ręcznie: rząd morza, wybrzeże, ląd z plażą, wzgórza/góry przy sobie i przy niskim terenie.
  const rows = [
    'MMMMMMMMM',
    'MPPPPPPMM',
    'PLRDLWGPM',
    'PLWGGWLRP',
    'PDRWGLOLP',
    'MPLRWDLPM',
    'MMPPPPPMM',
  ];
  const T: Record<string, TerenBazowy> = {
    M: TerenBazowy.Morze, P: TerenBazowy.PlytkieMorze, L: TerenBazowy.Laka, R: TerenBazowy.Rownina,
    D: TerenBazowy.Pustynia, W: TerenBazowy.Wzgorza, G: TerenBazowy.Gory, O: TerenBazowy.Polarny,
  };
  const hexes: MapSpec['hexes'] = [];
  for (let r = 0; r < rows.length; r++) for (let q = 0; q < rows[r]!.length; q++) {
    hexes.push({ q, r, t: T[rows[r]![q]!]! });
  }
  return { name: 'A', seed: 12345, W: 9, H: 7, hexes, solidsVisible: true };
}
function mapB(): MapSpec {
  // 12x9 pseudolosowa, z mgłą, bryłą ukrytą (miasto), tarasami i dziurami w siatce.
  const rnd = lcg(777);
  const all = Object.values(TerenBazowy);
  const hexes: MapSpec['hexes'] = [];
  for (let r = 0; r < 9; r++) for (let q = 0; q < 12; q++) {
    if ((q === 5 && r === 4) || (q === 0 && r === 8)) continue; // dziury
    const t = all[Math.floor(rnd() * all.length)]!;
    const hidden = (q >= 9 && r <= 2) || (q <= 1 && r >= 6);
    const solidHidden = q === 3 && r === 3;
    const tarasy = t === TerenBazowy.Wzgorza && q === 7;
    hexes.push({ q, r, t, hidden, solidHidden, tarasy });
  }
  // kolejność wstawiania kluczy nie po wierszach (Object.values zachowuje kolejność wstawiania)
  hexes.reverse();
  return { name: 'B', seed: -42, W: 12, H: 9, hexes, solidsVisible: true };
}
function mapC(): MapSpec {
  // jak A, ale bryły niewidoczne (LOD: zoomFlags.styledDecor=false) — ujemne q/r w kadrze.
  const a = mapA();
  return { ...a, name: 'C', hexes: a.hexes.map(h => ({ ...h, q: h.q - 4, r: h.r - 3 })), solidsVisible: false };
}
function mapE(): MapSpec {
  // 8x6 prawie cała pod mgłą (ścieżka awaryjna y=0 → y=topYAt): Wybrzeże (0,22 vs 0,18),
  // ląd z plażą (topYAt bez coastalDrop), wzgórza, góry; jedno okno odsłonięte.
  const rows = ['MPPLLWGG', 'PPLRWWGO', 'MPDLRLPP', 'PPPPLDRP', 'MMPPPPMM', 'MMMPPMMM'];
  const T: Record<string, TerenBazowy> = {
    M: TerenBazowy.Morze, P: TerenBazowy.PlytkieMorze, L: TerenBazowy.Laka, R: TerenBazowy.Rownina,
    D: TerenBazowy.Pustynia, W: TerenBazowy.Wzgorza, G: TerenBazowy.Gory, O: TerenBazowy.Polarny,
  };
  const hexes: MapSpec['hexes'] = [];
  for (let r = 0; r < rows.length; r++) for (let q = 0; q < rows[r]!.length; q++) {
    hexes.push({ q, r, t: T[rows[r]![q]!]!, hidden: !(q >= 3 && q <= 4 && r >= 2 && r <= 3) });
  }
  return { name: 'E', seed: 2026, W: 8, H: 6, hexes, solidsVisible: true };
}
function mapD(): MapSpec {
  // płaska Łąka 7x7 (wszystkie wierzchy na 0,46) — pas nakładania 1,008R bez schodków.
  const hexes: MapSpec['hexes'] = [];
  for (let r = 0; r < 7; r++) for (let q = 0; q < 7; q++) hexes.push({ q, r, t: (q + r) % 3 === 0 ? TerenBazowy.Rownina : TerenBazowy.Laka });
  return { name: 'D', seed: 1, W: 7, H: 7, hexes, solidsVisible: true };
}

// ---------------------------------------------------------------------------
const golden: any = { generator: 'refscript/gen.ts', three: THREE.REVISION, scenarios: [] };
const sceneDump: any = { maps: {} };
const solidsDump: any = { gora: [], wzgorze: [] };
for (let v = 0; v < LICZBA_WARIANTOW_TERENU; v++) {
  solidsDump.gora.push(Array.from(goraGeometria(v).attributes.position!.array as Float32Array));
  solidsDump.wzgorze.push(Array.from(wzgorzeGeometria(v).attributes.position!.array as Float32Array));
}
const prismDump: any = {};

const maps = [mapA(), mapB(), mapC(), mapD(), mapE()];
const viewports = [
  { left: 0, top: 0, width: 1280, height: 720 },
  { left: 37.5, top: 12, width: 800, height: 600 },
  { left: 0, top: 56, width: 375, height: 812 },
];

const unitsFor: Record<string, UnitSpec[]> = {
  A: [
    { id: 'u-gora', q: 4, r: 3, kind: 'tall', yaw: 0.3 },
    { id: 'u-laka', q: 1, r: 2, kind: 'flag', yaw: 1.1 },
    { id: 'u-miasto', q: 3, r: 4, kind: 'box', yaw: 0, dx: 0.42, dz: 0.38 }, // offset jak na mieście → wystaje nad sąsiada
    { id: 'u-woda', q: 2, r: 1, kind: 'box', yaw: 2.0 },
  ],
  B: [
    { id: 'b1', q: 6, r: 4, kind: 'tall', yaw: -0.7 },
    { id: 'b2', q: 2, r: 2, kind: 'flag', yaw: 0.5 },
  ],
  C: [], D: [], E: [],
};

for (const spec of maps) {
  const built = buildPickScene(spec);
  sceneDump.maps[spec.name] = {
    seed: spec.seed, W: spec.W, H: spec.H, solidsVisible: spec.solidsVisible,
    hexes: spec.hexes.map(h => ({ q: h.q, r: h.r, t: h.t, hidden: !!h.hidden, solidHidden: !!h.solidHidden, tarasy: !!h.tarasy })),
    instances: built.instances,
    units: (unitsFor[spec.name] ?? []).map((u) => { const g = buildUnitToken(u, built.topYAt, (q, r) => built.map.hexes[`${q},${r}`]?.terenBazowy); return { id: u.id, q: u.q, r: u.r, meshes: exportTokenMeshes(g) }; }),
    meshKinds: built.terrainPickMeshes.map((m) => m.geometry.type === 'CylinderGeometry' ? 'prism' : m.geometry.name),
  };
  for (const m of built.terrainPickMeshes) {
    if (m.geometry.type === 'CylinderGeometry') {
      const p = (m.geometry as THREE.CylinderGeometry).parameters;
      prismDump[String(p.height)] = { radius: p.radiusTop, height: p.height, pos: Array.from(m.geometry.attributes.position!.array as Float32Array), index: Array.from(m.geometry.index!.array as Uint16Array) };
    }
  }
  const terrainOf = (q: number, r: number) => built.map.hexes[`${q},${r}`]?.terenBazowy as TerenBazowy | undefined;
  const tokens = (unitsFor[spec.name] ?? []).map(u => ({ u, g: buildUnitToken(u, built.topYAt, terrainOf) }));
  const center = mapCenter(spec.W, spec.H, HEX_R);
  const cams = [
    { tx: center.x, tz: center.z, dist: 8 / 3 },
    { tx: center.x, tz: center.z, dist: 6.5 },
    { tx: center.x - 2.3, tz: center.z + 1.7, dist: 11 },
    { tx: center.x, tz: center.z, dist: 24 },
  ];
  if (spec.name === 'A') cams.push({ tx: center.x, tz: center.z, dist: 320 });
  for (let ci = 0; ci < cams.length; ci++) for (let vi = 0; vi < viewports.length; vi++) {
    const cam = cams[ci]!;
    const rect = viewports[vi]!;
    if (spec.name !== 'A' && vi === 2 && ci > 1) continue;
    const { camera, farClip } = makeCamera(spec, rect.width, rect.height, cam.tx, cam.tz, cam.dist);
    const canvas: any = { getBoundingClientRect: () => rect };
    // LITERAL units.ts:5867-5893 (this.tokens → tokens)
    function pickUnitIdAt(clientX: number, clientY: number, canvas: any, camera: THREE.Camera): string | null {
      const rect = canvas.getBoundingClientRect();
      const ndc = clientRectToNdc(clientX, clientY, rect);
      if (!ndc) return null;
      camera.updateMatrixWorld(true);
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(ndc.x, ndc.y), camera);
      const roots = tokens.map(t => t.g).filter((o) => o.visible);
      if (roots.length === 0) return null;
      const hits = raycaster.intersectObjects(roots, true);
      for (const h of hits) {
        let obj: THREE.Object3D | null = h.object;
        while (obj) {
          const uid = obj.userData['unitId'];
          if (typeof uid === 'string' && uid.length > 0) return uid;
          obj = obj.parent;
        }
      }
      return null;
    }
    // LITERAL main.ts:1885-1901
    function pickHexAt(clientX: number, clientY: number): { q: number; r: number } | null {
      return pixelToHex(
        clientX, clientY, canvas, camera, HEX_R,
        built.terrainPickMeshes, built.resolveTerrainPick,
        (q, r) => built.topYAt(q, r),
      );
    }
    function pickMapTarget(clientX: number, clientY: number): { q: number; r: number } | null {
      const unitId = pickUnitIdAt(clientX, clientY, canvas, camera);
      if (unitId) {
        const u = tokens.map(t => t.u).find((x) => x.id === unitId);
        if (u) return { q: u.q, r: u.r };
      }
      return pickHexAt(clientX, clientY);
    }
    // --- punkty
    const pts: Array<{ x: number; y: number; tag: string }> = [];
    const GX = 12, GY = 7;
    for (let j = 0; j <= GY; j++) for (let i = 0; i <= GX; i++) {
      pts.push({ x: rect.left + (i / GX) * rect.width, y: rect.top + (j / GY) * rect.height, tag: 'grid' });
    }
    // punkty celowane (rzut punktów świata): środki, rogi, krawędzie, pas 1,008R, boki pryzmów, bryły
    const vis = (t: TerenBazowy) => terrainVis(t, 'roblox');
    for (const h of spec.hexes) {
      if (!h.hidden && (h.q * 7 + h.r * 3 + ci + vi) % 7 !== 0) continue;
      if (h.hidden && (h.q * 5 + h.r * 3 + ci + vi) % 5 !== 0) continue;
      const { x, z } = axialToWorld(h.q, h.r, HEX_R);
      const top = vis(h.t).height + vis(h.t).yOffset;
      const add = (wx: number, wy: number, wz: number, tag: string) => {
        const c = projectToClient(new THREE.Vector3(wx, wy, wz), camera, rect);
        if (c.x >= rect.left - 2 && c.x <= rect.left + rect.width + 2 && c.y >= rect.top - 2 && c.y <= rect.top + rect.height + 2) pts.push({ x: c.x, y: c.y, tag });
      };
      add(x, top, z, 'center');
      for (let k = 0; k < 6; k++) {
        const a = Math.PI / 2 + k * Math.PI / 3;
        const a2 = Math.PI / 2 + (k + 1) * Math.PI / 3;
        add(x + Math.cos(a), top, z + Math.sin(a), 'corner');
        const mx = (Math.cos(a) + Math.cos(a2)) / 2, mz = (Math.sin(a) + Math.sin(a2)) / 2;
        add(x + mx, top, z + mz, 'edge');
        add(x + mx * 1.004, top, z + mz * 1.004, 'overlap');
        add(x + mx * 0.999, top, z + mz * 0.999, 'edge-in');
        add(x + mx * 1.001, top, z + mz * 1.001, 'edge-out');
        add(x + mx * 1.008, top - 0.06, z + mz * 1.008, 'side');
        add(x + mx * 1.008, top - 0.15, z + mz * 1.008, 'side-low');
      }
      if (h.hidden) {
        // ścieżka awaryjna: punkty na płaszczyznach pomiędzy/na topYAt, przy krawędziach
        for (let k = 0; k < 6; k++) {
          const a = Math.PI / 2 + k * Math.PI / 3, a2 = Math.PI / 2 + (k + 1) * Math.PI / 3;
          const mx = (Math.cos(a) + Math.cos(a2)) / 2, mz = (Math.sin(a) + Math.sin(a2)) / 2;
          for (const f of [0.97, 1.0, 1.03]) for (const yy of [0.2, top]) add(x + mx * f, yy, z + mz * f, 'fog');
        }
      }
      if (h.t === TerenBazowy.Gory || h.t === TerenBazowy.Wzgorza) {
        for (const hh of [0.15, 0.3, 0.5, 0.7]) for (const rr of [0, 0.3, 0.6]) add(x + rr * 0.7, top + hh, z + rr * 0.7, 'solid');
        add(x, top + 0.9, z - 0.2, 'solid-peak');
      }
    }
    for (const { g } of tokens) {
      const bb = new THREE.Box3().setFromObject(g);
      for (let k = 0; k < 9; k++) {
        const p = new THREE.Vector3(
          bb.min.x + (bb.max.x - bb.min.x) * ((k % 3) / 2),
          bb.min.y + (bb.max.y - bb.min.y) * (0.3 + 0.2 * Math.floor(k / 3)),
          bb.min.z + (bb.max.z - bb.min.z) * ((k * 5 % 3) / 2),
        );
        const c = projectToClient(p, camera, rect);
        pts.push({ x: c.x, y: c.y, tag: 'unit' });
      }
    }
    // punkty dokładnie na pikselach całkowitych w pobliżu środka (typowe zdarzenia myszy)
    for (let k = 0; k < 12; k++) pts.push({ x: Math.round(rect.left + rect.width * (0.3 + 0.035 * k)), y: Math.round(rect.top + rect.height * (0.62 - 0.02 * k)), tag: 'int' });
    const results = pts.map((p) => {
      const tgt = pickMapTarget(p.x, p.y);
      const hexOnly = pickHexAt(p.x, p.y);
      const o: any = { x: p.x, y: p.y, k: p.tag, h: hexOnly ? [hexOnly.q, hexOnly.r] : null };
      if (JSON.stringify(tgt) !== JSON.stringify(hexOnly)) o.t = tgt ? [tgt.q, tgt.r] : null;
      return o;
    });
    // kontrola matematyki kamery: promień Three dla kilku NDC
    const rays = [[0, 0], [-1, 1], [1, -1], [0.37, -0.81], [-0.999, 0.5]].map(([nx, ny]) => {
      const rc = new THREE.Raycaster();
      rc.setFromCamera(new THREE.Vector2(nx!, ny!), camera);
      return { ndc: [nx, ny], o: rc.ray.origin.toArray(), d: rc.ray.direction.toArray() };
    });
    golden.scenarios.push({
      map: spec.name, rect, camera: { tx: cam.tx, tz: cam.tz, dist: cam.dist, far: farClip },
      cameraMatrixWorld: Array.from(camera.matrixWorld.elements),
      projection: Array.from(camera.projectionMatrix.elements),
      projectionInverse: Array.from(camera.projectionMatrixInverse.elements),
      rays,
      points: results,
    });
  }
}

// ---------------------------------------------------------------------------
// worldToAxial (oba warianty) i Math.round — wektory czystych funkcji
const w2a: any[] = [];
const addW = (x: number, z: number, tag: string) => {
  const a = worldToAxial(x, z, HEX_R);
  const b = worldToAxialHexutil(x, z, HEX_R);
  w2a.push({ x, z, tag, picker: [a.q, a.r], hexutil: [b.q, b.r] });
};
const SQ3 = Math.sqrt(3);
for (let r = -3; r <= 3; r++) for (let q = -3; q <= 3; q++) {
  const c = axialToWorld(q, r, HEX_R);
  addW(c.x, c.z, 'center');
  for (let k = 0; k < 6; k++) {
    const a = Math.PI / 2 + k * Math.PI / 3;
    addW(c.x + Math.cos(a), c.z + Math.sin(a), 'corner');
    const a2 = Math.PI / 2 + (k + 1) * Math.PI / 3;
    addW(c.x + (Math.cos(a) + Math.cos(a2)) / 2, c.z + (Math.sin(a) + Math.sin(a2)) / 2, 'edge-mid');
  }
}
// konstruowane remisy: frakcyjne aksjalne z resztami 0,5 / równymi resztami
const fr = [-2.5, -1.5, -0.5, 0.5, 1.5, 2.5, -1.25, 0.25, 1.75, -0.75, 1 / 3, -1 / 3, 2 / 3, -2 / 3];
for (const qf of fr) for (const rf of fr) {
  addW(SQ3 * (qf + rf / 2), 1.5 * rf, 'frac');
}
const rnd = lcg(99);
for (let i = 0; i < 400; i++) addW((rnd() - 0.5) * 60, (rnd() - 0.5) * 60, 'random');
const roundVals = [0.5, -0.5, 1.5, -1.5, 2.5, -2.5, 0.49999999999999994, -0.49999999999999994, 4503599627370497, -4503599627370497, 4503599627370496.5, -0, 0, -1e-300, 1e-300, 1.4999999999999998, -1.5000000000000002, 123456.5, -123456.5, -7.5, 7.5, 2 ** 52 + 0.5, -(2 ** 52) - 0.5];
const roundDump = roundVals.map(v => ({ v, round: Math.round(v) }));
const ndcDump = [
  [100, 200, { left: 0, top: 0, width: 1280, height: 720 }],
  [37.5, 12, { left: 37.5, top: 12, width: 800, height: 600 }],
  [837.5, 612, { left: 37.5, top: 12, width: 800, height: 600 }],
  [5, 5, { left: 0, top: 0, width: 0, height: 10 }],
  [5, 5, { left: 0, top: 0, width: 10, height: -1 }],
  [333.3, 444.4, { left: 0.5, top: 56, width: 375, height: 812 }],
].map(([x, y, rect]) => ({ x, y, rect, ndc: clientRectToNdc(x as number, y as number, rect as any) }));

fs.writeFileSync(path.join(OUT, 'golden_pick.json'), JSON.stringify(golden));
fs.writeFileSync(path.join(OUT, 'scenes.json'), JSON.stringify(sceneDump));
fs.writeFileSync(path.join(OUT, 'geometry.json'), JSON.stringify({ solids: solidsDump, prisms: prismDump }));
fs.writeFileSync(path.join(OUT, 'math.json'), JSON.stringify({ worldToAxial: w2a, mathRound: roundDump, clientRectToNdc: ndcDump }));
let total = 0;
for (const s of golden.scenarios) total += s.points.length;
console.log(`scenarios=${golden.scenarios.length} points=${total} w2a=${w2a.length} round=${roundDump.length} ndc=${ndcDump.length}`);
