/**
 * scene.ts
 * Buduje scenę Three.js dla mapy hex The Game.
 *
 * Jeden CylinderGeometry(R, R, h, 6) per heks — prism sześcioboczny.
 * THREE.CylinderGeometry(6 segmentów) generuje pointy-top (pierwszy wierzchołek
 * w +Z, theta=0), co pasuje do axialToWorld (pointy-top). NIE rotujemy geometrii.
 * Kolory materiałów przypisane per typ terenu, scalane w grupy
 * (InstancedMesh osobno per teren-typ dla wydajności).
 *
 * Las = kępa 3–5 drzew (pień walcowy + korona stożkowa), deterministyczna per kafelek.
 * Góry = dekoracyjny szczyt skalny PONAD prizmem + śnieżna czapka na jego wierzchołku.
 * Wzgórza = trawiasty kopiec (kopuła) PONAD prizmem + krzewy na nim.
 * Wybrzeże = cienki piaszczysty pierścień (plaża) na szczycie hexa.
 * Pustynia = wydmy (kopuły piasku, ~1/3 hexów) + losowa (LCG, ~1 na 6) oaza: basen + palmy.
 * Rzeka = wczytywana z map.riverPaths (ścieżki z generatora mapy),
 *         wstęga płaska (ribbon) z szerszym brzegiem; wiele rzek obsługiwane.
 *         Wstęga siedzi PONIŻEJ szczytu terenu (wycięty kanał), nie unosi się.
 *
 * Kolor PER-KAFELEK: każdy prism dostaje deterministyczny, subtelny jitter HSL
 * (hash q,r,seed), żeby duże jednolite obszary nie były płaską plamą koloru.
 *
 * Mgła wojenna (fog-of-war):
 *   - visible  → kolor bazowy terenu (factor 1.0)
 *   - explored → przyciemniony (factor 0.45)
 *   - unknown  → ciemny kolor mgły 0x0b0d12 (ustawiany bezpośrednio)
 * setFog(visible, explored) przelicza kolory instancji dla prizmów terenu
 * ORAZ ukrywa/przywraca nakładki (las, śnieg, krzewy, szczyty, kopce, plaże, wydmy, oazy, rzeki).
 */

import * as THREE from 'three';
import type { GameMap } from '../types/map';
import { TerenBazowy, Nakladka } from '../types/hex';
import { axialToWorld, mapCenter, HEX_R } from './hexutil';

// ---------------------------------------------------------------------------
// Paleta kolorów i parametry wysokości per teren
// ---------------------------------------------------------------------------

interface TerenVisual {
  color: number;
  height: number; // high of the prism
  yOffset: number; // dodatkowe podniesienie środka (>0 gdy prism wyżej)
}

const TERRAIN_VISUALS: Record<TerenBazowy, TerenVisual> = {
  [TerenBazowy.Morze]:     { color: 0x1f5a86, height: 0.30, yOffset: 0.00 },
  [TerenBazowy.Wybrzeze]:  { color: 0x46a3d6, height: 0.35, yOffset: 0.05 },
  [TerenBazowy.Laka]:      { color: 0x6aa53f, height: 0.40, yOffset: 0.05 },
  [TerenBazowy.Rownina]:   { color: 0xa9b257, height: 0.45, yOffset: 0.08 },
  [TerenBazowy.Pustynia]:  { color: 0xd9c179, height: 0.40, yOffset: 0.05 },
  [TerenBazowy.Wzgorza]:   { color: 0x4f7d34, height: 0.55, yOffset: 0.10 },
  [TerenBazowy.Gory]:      { color: 0x9aa1a9, height: 0.60, yOffset: 0.20 },
};

const FOREST_COLOR      = 0x1b5e20;
const FOREST_CONE_COLOR = 0x2f6b34;
const SNOW_COLOR        = 0xf5f7fa;
const SHRUB_COLOR       = 0x356b2c;

// Kolory oazy
const OASIS_WATER_COLOR = 0x3fa9c9;
const OASIS_TRUNK_COLOR = 0x6b4f2a;
const OASIS_FROND_COLOR = 0x2e8b3f;

// Kolor wody rzeki i brzegów (earthen bank)
const RIVER_COLOR = 0x5fb4e8;
const RIVER_BANK_COLOR = 0x4aa6dc;  // ciemniejszy, ziemisty kolor brzegu

// Kolor mgły wojennej (nieznane hexsy)
const FOG_HIDDEN_COLOR = new THREE.Color(0x0b0d12);

// Dekoracyjne szczyty / kopce (geometria PONAD szczytem prizmu — nie zmienia height/yOffset)
const PEAK_ROCK_COLOR  = 0x828c97;  // skala szczytu gory (ciemniejsza niz prism)
const HILL_GRASS_COLOR = 0x52823f;  // trawiasty kopiec na wzgorzu
const FOREST_TRUNK_COLOR = 0x5b4327; // pien drzewa lasu
const BEACH_SAND_COLOR = 0x5fb7e6;  // piaszczysty pierscien wybrzeza
const DUNE_SAND_COLOR  = 0xcaa861;  // wydma pustynna (ciemniejszy piasek)

// F1 — ocean wokol swiata + ramka (plansza)
const DEEP_OCEAN_COLOR = 0x163d5c;  // gleboki ocean poza kontynentem (ciemniejszy niz Morze)
const FRAME_COLOR      = 0x241c12;  // ciemna listwa ramki swiata (kamien/drewno)

// ---------------------------------------------------------------------------
// Deterministyczny hash 2D (q,r) -> [0,1). Mieszanie bitowe (xorshift-podobne).
// Daje stabilny, powtarzalny "szum" per kafelek -- ta sama (q,r,seed) -> ten sam wynik.
// salt roznicuje wiele niezaleznych strumieni dla jednego kafelka.
// ---------------------------------------------------------------------------
function hash2D(q: number, r: number, seed: number, salt: number): number {
  let h = (Math.imul(q | 0, 0x27d4eb2d) ^ Math.imul(r | 0, 0x165667b1) ^ Math.imul(seed | 0, 0x9e3779b1) ^ Math.imul(salt | 0, 0x85ebca6b)) >>> 0;
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d) >>> 0;
  h ^= h >>> 12;
  h = Math.imul(h, 0x297a2d39) >>> 0;
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

/**
 * Zwraca kolor bazowy terenu z subtelnym, deterministycznym jitterem HSL.
 * Duze jednolite obszary tego samego terenu przestaja byc plaska plama koloru.
 * Woda (Morze/Wybrzeze) dostaje mniejszy jitter (gladsza tafla).
 */
function jitteredTerrainColor(
  baseHex: number,
  q: number,
  r: number,
  seed: number,
  isWater: boolean,
): THREE.Color {
  const c = new THREE.Color(baseHex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  // Trzy niezalezne strumienie szumu (hue / saturation / lightness)
  const nH = hash2D(q, r, seed, 101) - 0.5;
  const nS = hash2D(q, r, seed, 202) - 0.5;
  const nL = hash2D(q, r, seed, 303) - 0.5;
  const hueAmt = isWater ? 0.010 : 0.022;
  const satAmt = isWater ? 0.05  : 0.10;
  const litAmt = isWater ? 0.030 : 0.060;
  let h = hsl.h + nH * hueAmt;
  h = h - Math.floor(h); // wrap do [0,1)
  const s = Math.max(0, Math.min(1, hsl.s + nS * satAmt));
  const l = Math.max(0, Math.min(1, hsl.l + nL * litAmt));
  c.setHSL(h, s, l);
  return c;
}

// ---------------------------------------------------------------------------
// Budowa sceny
// ---------------------------------------------------------------------------

/** Wpis w mapie instancji — łączy InstancedMesh + indeks instancji + bazowy kolor terenu. */
interface HexInstanceEntry {
  mesh:      THREE.InstancedMesh;
  index:     number;
  baseColor: THREE.Color;
}

/** Jedna siatka rzeki (woda + brzegi) + zbiór kluczy hex wzdłuż jej trasy (dla fog-of-war). */
interface RiverEntry {
  waterMesh: THREE.Mesh;
  bankMesh:  THREE.Mesh;
  waterGeo:  THREE.BufferGeometry;
  bankGeo:   THREE.BufferGeometry;
  hexKeys:   Set<string>;
}

export interface SceneResult {
  scene:    THREE.Scene;
  camera:   THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  /** Środek mapy w world space (cel kamery i centrum panowania). */
  center:   { x: number; z: number };
  dispose:  () => void;
  /**
   * Przelicza kolory prizmów terenu według stanu mgły wojennej,
   * oraz ukrywa/przywraca nakładki (las, śnieg, krzewy, oazy, rzeki).
   * @param visible  Zbiór kluczy "q,r" aktualnie widocznych hexów.
   * @param explored Zbiór kluczy "q,r" odkrytych, lecz nie widocznych hexów.
   *
   * Poziomy:
   *   visible  → factor 1.0  (pełny kolor bazowy)
   *   explored → factor 0.45 (przyciemniony, zapamiętany)
   *   unknown  → kolor 0x0b0d12 (ciemna mgła, ustawiany bezpośrednio)
   */
  setFog: (visible: Set<string>, explored: Set<string>) => void;
}

// ---------------------------------------------------------------------------
// Pomocnik: buduje płaską wstęgę (ribbon) wzdłuż krzywej 3D.
//
// Zwraca BufferGeometry z siatką złożoną z czworobocznych segmentów.
// Każdy segment ma stały Y (podany jako yBase), szerokość halfWidth*2.
// Wstęga jest pozioma -- normalne skierowane w górę (0,1,0).
// Krawędzie prostopadłe do kierunku ścieżki w płaszczyźnie XZ.
// ---------------------------------------------------------------------------

function buildRibbonGeometry(
  points: THREE.Vector3[],
  halfWidth: number,
  segmentsPerSpan: number,
): THREE.BufferGeometry {
  if (points.length < 2) return new THREE.BufferGeometry();

  // Interpoluj ścieżkę przez CatmullRom dla gładkości
  const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
  const totalSeg = Math.max(20, points.length * segmentsPerSpan);

  const positions: number[] = [];
  const normals:   number[] = [];
  const uvs:       number[] = [];
  const indices:   number[] = [];

  let vertexCount = 0;

  for (let i = 0; i <= totalSeg; i++) {
    const t = i / totalSeg;
    const pt = curve.getPoint(t);

    // Kierunek styczny w XZ (tangent spłaszczony do płaszczyzny poziomej)
    const tVec = curve.getTangent(t);
    const tFlat = new THREE.Vector3(tVec.x, 0, tVec.z).normalize();

    // Wektor prostopadły w płaszczyźnie XZ (prawo ścieżki)
    const right = new THREE.Vector3(-tFlat.z, 0, tFlat.x);

    // Lewy i prawy wierzchołek wstęgi (Y = pt.y z krzywej, poniżej terenu)
    const left  = new THREE.Vector3(pt.x - right.x * halfWidth, pt.y, pt.z - right.z * halfWidth);
    const rightV = new THREE.Vector3(pt.x + right.x * halfWidth, pt.y, pt.z + right.z * halfWidth);

    positions.push(left.x,  left.y,  left.z);
    positions.push(rightV.x, rightV.y, rightV.z);

    normals.push(0, 1, 0, 0, 1, 0);
    uvs.push(0, t, 1, t);

    if (i > 0) {
      const base = vertexCount;
      // Czworobok z dwóch trójkątów
      // Poprzedni rząd: base-2 (lewy), base-1 (prawy)
      // Bieżący rząd:   base   (lewy), base+1 (prawy)
      indices.push(base - 2, base,     base - 1);
      indices.push(base - 1, base,     base + 1);
    }

    vertexCount += 2;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal',   new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv',       new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  return geo;
}

// ---------------------------------------------------------------------------
// F1 — pomocniki: rogi heksa, blend biomow, rzeki na KRAWEDZIACH
// ---------------------------------------------------------------------------

/** 6 rogow pointy-top heksa (konwencja CylinderGeometry(6): rog 0 w +Z). */
function hexCorners(cx: number, cz: number, R: number): { x: number; z: number }[] {
  const out: { x: number; z: number }[] = [];
  for (let k = 0; k < 6; k++) {
    const a = (Math.PI / 3) * k; // 60 stopni * k
    out.push({ x: cx + R * Math.sin(a), z: cz + R * Math.cos(a) });
  }
  return out;
}

/** Aksjalni sasiedzi pointy-top — 6 kierunkow. */
const HEX_NEIGHBORS: ReadonlyArray<readonly [number, number]> = [
  [1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1],
];

/**
 * Kolor bazowy terenu zmieszany ze srednia sasiadow -> miekkie przejscia biomow
 * na granicach. Zwraca hex (number). Woda miesza sie slabiej (czystsza tafla).
 */
function blendedTerrainHex(map: GameMap, q: number, r: number, baseHex: number, isWater: boolean): number {
  const base = new THREE.Color(baseHex);
  const acc = new THREE.Color(0, 0, 0);
  let n = 0;
  for (const [dq, dr] of HEX_NEIGHBORS) {
    const nb = map.hexes[`${q + dq},${r + dr}`];
    if (!nb) continue;
    acc.add(new THREE.Color(TERRAIN_VISUALS[nb.terenBazowy].color));
    n++;
  }
  if (n === 0) return baseHex;
  acc.multiplyScalar(1 / n);
  base.lerp(acc, isWater ? 0.07 : 0.18);
  return base.getHex();
}


// ---------------------------------------------------------------------------
// F1: rzeka jako splyw po WIERZCHOLKACH (graf rogow heksow) -> krawedziami, jeden kierunek.
// ---------------------------------------------------------------------------
function terrainRank(t: TerenBazowy): number {
  switch (t) {
    case TerenBazowy.Morze: return 0;
    case TerenBazowy.Wybrzeze: return 1;
    case TerenBazowy.Wzgorza: return 3;
    case TerenBazowy.Gory: return 4;
    default: return 2; // Laka / Rownina / Pustynia
  }
}
function vKey(x: number, z: number): string { return `${Math.round(x * 50)},${Math.round(z * 50)}`; }

interface Vtx { x: number; z: number; hexKeys: string[]; }

function buildVertexGraph(map: GameMap, R: number): Map<string, Vtx> {
  const verts = new Map<string, Vtx>();
  for (const hex of Object.values(map.hexes)) {
    const c = axialToWorld(hex.coords.q, hex.coords.r, R);
    const cs = hexCorners(c.x, c.z, R);
    const hk = `${hex.coords.q},${hex.coords.r}`;
    for (const corner of cs) {
      const k = vKey(corner.x, corner.z);
      let v = verts.get(k);
      if (!v) { v = { x: corner.x, z: corner.z, hexKeys: [] }; verts.set(k, v); }
      if (!v.hexKeys.includes(hk)) v.hexKeys.push(hk);
    }
  }
  return verts;
}

function vElev(map: GameMap, v: Vtx): number {
  let s = 0;
  for (const hk of v.hexKeys) { const h = map.hexes[hk]; s += h ? terrainRank(h.terenBazowy) : 2; }
  return s / v.hexKeys.length;
}
function vIsSea(map: GameMap, v: Vtx): boolean {
  return v.hexKeys.some(hk => { const h = map.hexes[hk]; return !!h && (h.terenBazowy === TerenBazowy.Morze || h.terenBazowy === TerenBazowy.Wybrzeze); });
}
function vNeighbors(map: GameMap, R: number, k: string, verts: Map<string, Vtx>): string[] {
  const v = verts.get(k); if (!v) return [];
  const out = new Set<string>();
  for (const hk of v.hexKeys) {
    const h = map.hexes[hk]; if (!h) continue;
    const c = axialToWorld(h.coords.q, h.coords.r, R);
    const cs = hexCorners(c.x, c.z, R);
    let idx = -1;
    for (let i = 0; i < 6; i++) if (vKey(cs[i]!.x, cs[i]!.z) === k) { idx = i; break; }
    if (idx < 0) continue;
    out.add(vKey(cs[(idx + 1) % 6]!.x, cs[(idx + 1) % 6]!.z));
    out.add(vKey(cs[(idx + 5) % 6]!.x, cs[(idx + 5) % 6]!.z));
  }
  return [...out];
}

// Trasa rzeki: od najwyzszego rogu heksa-zrodla, splyw do najnizszego sasiada, az do morza.
function traceRiverVertices(map: GameMap, R: number, verts: Map<string, Vtx>, src: { q: number; r: number }): Vtx[] {
  const sc = axialToWorld(src.q, src.r, R);
  const scs = hexCorners(sc.x, sc.z, R);
  let startK = vKey(scs[0]!.x, scs[0]!.z), startE = -1;
  for (const corner of scs) {
    const k = vKey(corner.x, corner.z); const v = verts.get(k);
    if (v) { const e = vElev(map, v); if (e > startE) { startE = e; startK = k; } }
  }
  const out: Vtx[] = [];
  const visited = new Set<string>();
  let curK = startK;
  for (let step = 0; step < 500; step++) {
    const v = verts.get(curK); if (!v || visited.has(curK)) break;
    visited.add(curK); out.push(v);
    if (vIsSea(map, v)) break; // ujscie na styku z morzem
    const nbs = vNeighbors(map, R, curK, verts).filter(nk => !visited.has(nk) && verts.has(nk));
    if (nbs.length === 0) break;
    let best = nbs[0]!, bestE = vElev(map, verts.get(best)!);
    for (const nk of nbs) { const e = vElev(map, verts.get(nk)!); if (e < bestE) { bestE = e; best = nk; } }
    curK = best;
  }
  return out;
}

export function buildScene(map: GameMap, canvas: HTMLCanvasElement): SceneResult {
  // -- Renderer
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // -- Scena + tlo
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb); // sky blue
  scene.fog = new THREE.FogExp2(0x9fcfe6, 0.0075);

  // -- Swiatla
  const hemi = new THREE.HemisphereLight(0xd4eaff, 0x5a5040, 0.9);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff0cc, 1.4);
  sun.position.set(60, 100, 40);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far  = 500;
  const sc = 60;
  sun.shadow.camera.left   = -sc;
  sun.shadow.camera.right  =  sc;
  sun.shadow.camera.top    =  sc;
  sun.shadow.camera.bottom = -sc;
  scene.add(sun);

  // Subtelne swiatlo wypelniajace z przeciwnej strony — mieksze cienie, bogatsze biomy.
  const fill = new THREE.DirectionalLight(0xbcd4ff, 0.35);
  fill.position.set(-50, 60, -30);
  scene.add(fill);

  // -- Geometrie wspoldzielone
  const R = HEX_R;
  // CylinderGeometry(6) jest juz pointy-top -- bez rotacji.

  // Zlicz ilosc per teren i nakladke
  const countByTerrain: Partial<Record<TerenBazowy, number>> = {};
  let forestCount = 0;
  let mountainSnowCount = 0;
  let hillCount = 0;
  let desertCount = 0;

  for (const hex of Object.values(map.hexes)) {
    const t = hex.terenBazowy;
    countByTerrain[t] = (countByTerrain[t] ?? 0) + 1;
    if (hex.nakladka === Nakladka.Las) forestCount++;
    if (t === TerenBazowy.Gory) mountainSnowCount++;
    if (t === TerenBazowy.Wzgorza) hillCount++;
    if (t === TerenBazowy.Pustynia) desertCount++;
  }

  // Maks. liczby instancji dekoracji (z zapasem na deterministyczna zmiennosc)
  const MAX_TREES_PER_FOREST = 6;   // korony (las gestszy, naturalne kepy); pnie tyle samo
  const MAX_SHRUBS_PER_HILL  = 3;   // krzewy na wzgorzu

  // -- Instanced hex prisms per terrain type
  const instancedMeshes: THREE.InstancedMesh[] = [];
  const terrainMaterials: Partial<Record<TerenBazowy, THREE.MeshLambertMaterial>> = {};

  const terrainIndex: Partial<Record<TerenBazowy, number>> = {};

  const terrainTypes = Object.values(TerenBazowy);
  for (const t of terrainTypes) {
    const cnt = countByTerrain[t] ?? 0;
    if (cnt === 0) continue;
    const vis = TERRAIN_VISUALS[t];
    const geo = new THREE.CylinderGeometry(R * 0.998, R * 0.998, vis.height, 6, 1);
    // Brak rotateY -- CylinderGeometry(6) jest juz pointy-top jak axialToWorld.
    const mat = new THREE.MeshLambertMaterial({ color: vis.color });
    terrainMaterials[t] = mat;
    const mesh = new THREE.InstancedMesh(geo, mat, cnt);
    mesh.castShadow    = true;
    mesh.receiveShadow = true;
    instancedMeshes.push(mesh);
    scene.add(mesh);
    terrainIndex[t] = instancedMeshes.length - 1;
  }

  const terrainInstanceIdx: Partial<Record<TerenBazowy, number>> = {};
  for (const t of terrainTypes) terrainInstanceIdx[t] = 0;

  // -- Las -- InstancedMesh stozkow (korony) + cienkie pnie (trunks)
  const maxTrees = forestCount * MAX_TREES_PER_FOREST;
  const forestConeGeo = new THREE.ConeGeometry(R * 0.17, R * 0.50, 6);
  const forestConeMat = new THREE.MeshLambertMaterial({ color: FOREST_CONE_COLOR });
  const forestMesh = new THREE.InstancedMesh(forestConeGeo, forestConeMat, maxTrees);
  forestMesh.castShadow = true;
  forestMesh.receiveShadow = true;
  scene.add(forestMesh);

  // Pnie drzew lasu -- krotkie, ciemne walce pod koronami
  const forestTrunkGeo = new THREE.CylinderGeometry(R * 0.035, R * 0.05, R * 0.18, 5);
  const forestTrunkMat = new THREE.MeshLambertMaterial({ color: FOREST_TRUNK_COLOR });
  const forestTrunkMesh = new THREE.InstancedMesh(forestTrunkGeo, forestTrunkMat, maxTrees);
  forestTrunkMesh.castShadow = true;
  scene.add(forestTrunkMesh);

  // -- Snieg na gorach
  const snowGeo = new THREE.ConeGeometry(R * 0.42, R * 0.45, 6);
  // Brak rotateY -- snieg jest maly, orientacja bez znaczenia, ale spojnosc.
  const snowMat = new THREE.MeshLambertMaterial({ color: SNOW_COLOR });
  const snowMesh = new THREE.InstancedMesh(snowGeo, snowMat, mountainSnowCount);
  snowMesh.castShadow = true;
  scene.add(snowMesh);

  // -- Krzewy na wzgorzach -- male stozki (mniejsze niz las)
  const shrubConeGeo = new THREE.ConeGeometry(R * 0.13, R * 0.38, 6);
  const shrubConeMat = new THREE.MeshLambertMaterial({ color: SHRUB_COLOR });
  const shrubMesh = new THREE.InstancedMesh(shrubConeGeo, shrubConeMat, hillCount * MAX_SHRUBS_PER_HILL);
  shrubMesh.castShadow = true;
  scene.add(shrubMesh);

  // -- Dekoracyjny szczyt skalny na gorach -- niski, szeroki stozek PONAD prizmem.
  //    Nie zmienia wysokosci prizmu; tylko wienczy go ostrym wierzcholkiem.
  const peakGeo = new THREE.ConeGeometry(R * 0.55, R * 0.85, 6);
  const peakMat = new THREE.MeshLambertMaterial({ color: PEAK_ROCK_COLOR, flatShading: true });
  const peakMesh = new THREE.InstancedMesh(peakGeo, peakMat, mountainSnowCount);
  peakMesh.castShadow = true;
  peakMesh.receiveShadow = true;
  scene.add(peakMesh);

  // -- Trawiasty kopiec na wzgorzach -- splaszczona polkula PONAD prizmem (delikatne wybrzuszenie terenu).
  const hillBumpGeo = new THREE.SphereGeometry(R * 0.62, 8, 5, 0, Math.PI * 2, 0, Math.PI * 0.5);
  const hillBumpMat = new THREE.MeshLambertMaterial({ color: HILL_GRASS_COLOR, flatShading: true });
  const hillBumpMesh = new THREE.InstancedMesh(hillBumpGeo, hillBumpMat, hillCount);
  hillBumpMesh.castShadow = true;
  hillBumpMesh.receiveShadow = true;
  scene.add(hillBumpMesh);

  // -- Piaszczysty pierscien wybrzeza -- cienki plaski dysk na szczycie hexa wybrzeza.
  const coastCount = countByTerrain[TerenBazowy.Wybrzeze] ?? 0;
  const beachGeo = new THREE.CylinderGeometry(R * 0.92, R * 0.96, R * 0.03, 6);
  const beachMat = new THREE.MeshLambertMaterial({ color: BEACH_SAND_COLOR });
  const beachMesh = new THREE.InstancedMesh(beachGeo, beachMat, coastCount);
  beachMesh.receiveShadow = true;
  scene.add(beachMesh);

  // -- Wydmy pustynne -- niskie, szerokie kopuly piasku PONAD prizmem (~1/3 hexow pustyni).
  const duneGeo = new THREE.SphereGeometry(R * 0.5, 7, 4, 0, Math.PI * 2, 0, Math.PI * 0.5);
  const duneMat = new THREE.MeshLambertMaterial({ color: DUNE_SAND_COLOR, flatShading: true });
  const duneMesh = new THREE.InstancedMesh(duneGeo, duneMat, desertCount);
  duneMesh.castShadow = true;
  duneMesh.receiveShadow = true;
  scene.add(duneMesh);

  // ---------------------------------------------------------------------------
  // Oaza na pustyni -- InstancedMesh (pool + trunks + fronds); ~1/6 hexow pustyni.
  // Max instancji: desertCount/6 oaz * 1 pool, * 2 trunks, * 2*4 fronds
  // ---------------------------------------------------------------------------

  // Geometrie współdzielone dla elementów oazy
  const oasisPoolGeo  = new THREE.CylinderGeometry(R * 0.35, R * 0.35, R * 0.04, 16);
  const oasisPoolMat  = new THREE.MeshLambertMaterial({ color: OASIS_WATER_COLOR });
  const oasisTrunkGeo = new THREE.CylinderGeometry(R * 0.04, R * 0.055, R * 0.55, 6);
  const oasisTrunkMat = new THREE.MeshLambertMaterial({ color: OASIS_TRUNK_COLOR });
  const oasisFrondGeo = new THREE.ConeGeometry(R * 0.18, R * 0.32, 5);
  const oasisFrondMat = new THREE.MeshLambertMaterial({ color: OASIS_FROND_COLOR });

  // Górna granica instancji oazy (z zapasem: zakładamy ~1/6 hexow pustyni)
  const maxOasis      = Math.ceil(desertCount / 5) + 4;   // oazy
  const maxOasisTrunk = maxOasis * 2;                      // max 2 palmy / oaza
  const maxOasisFrond = maxOasis * 2 * 4;                  // max 4 liscie / palma

  const oasisPoolMesh  = new THREE.InstancedMesh(oasisPoolGeo,  oasisPoolMat,  maxOasis);
  const oasisTrunkMesh = new THREE.InstancedMesh(oasisTrunkGeo, oasisTrunkMat, maxOasisTrunk);
  const oasisFrondMesh = new THREE.InstancedMesh(oasisFrondGeo, oasisFrondMat, maxOasisFrond);
  oasisPoolMesh.castShadow  = false;  oasisPoolMesh.receiveShadow  = true;
  oasisTrunkMesh.castShadow = true;   oasisTrunkMesh.receiveShadow = false;
  oasisFrondMesh.castShadow = true;   oasisFrondMesh.receiveShadow = false;
  scene.add(oasisPoolMesh);
  scene.add(oasisTrunkMesh);
  scene.add(oasisFrondMesh);

  // Tablice kluczy i oryginalnych macierzy (fog-of-war)
  const oasisPoolHexKey:   string[]         = [];
  const oasisPoolOrigMat:  THREE.Matrix4[]  = [];
  const oasisTrunkHexKey:  string[]         = [];
  const oasisTrunkOrigMat: THREE.Matrix4[]  = [];
  const oasisFrondHexKey:  string[]         = [];
  const oasisFrondOrigMat: THREE.Matrix4[]  = [];

  let oasisPoolIdx  = 0;
  let oasisTrunkIdx = 0;
  let oasisFrondIdx = 0;

  // ---------------------------------------------------------------------------
  // Materiały rzeki (wspólne dla wszystkich ścieżek)
  // Rzeka = płaska wstęga (ribbon) wycięta w terenie + ciemniejsze brzegi.
  // ---------------------------------------------------------------------------

  // Materiał wody rzeki -- płaski, nieco przezroczysty z góry
  const riverWaterMat = new THREE.MeshLambertMaterial({
    color: RIVER_COLOR,
    emissive: 0x2a6fa0,
    side: THREE.DoubleSide,
  });

  // Materiał brzegu rzeki -- ziemisty, ciemniejszy pas po bokach wody
  const riverBankMat = new THREE.MeshLambertMaterial({
    color: RIVER_BANK_COLOR,
    side: THREE.DoubleSide,
  });

  // Tablica wszystkich wpisów rzek (woda + brzegi) z hex-kluczami (fog-of-war)
  const riverEntries: RiverEntry[] = [];

  // Zbiór wszystkich hex-kluczy wzdłuż rzek (unia wszystkich ścieżek) -- dla fog-of-war
  let riverHexKeys: string[] = [];

  // ---------------------------------------------------------------------------
  // LCG -- deterministyczny PRNG (ten sam co istnieje, seed z map.seed)
  // ---------------------------------------------------------------------------

  let rndState = map.seed;
  const rnd = () => {
    rndState = (Math.imul(rndState, 1664525) + 1013904223) >>> 0;
    return rndState / 4294967296;
  };

  // ---------------------------------------------------------------------------
  // Mapa instancji dla fog-of-war -- klucz "q,r" → mesh + index + baseColor
  // ---------------------------------------------------------------------------

  const hexInstance = new Map<string, HexInstanceEntry>();

  // ---------------------------------------------------------------------------
  // Tablice nakladek dla fog-of-war (las, snieg, krzewy + nowe dekoracje)
  // Indeks i odpowiada i-tej instancji w danym InstancedMesh.
  // ---------------------------------------------------------------------------

  const forestHexKey:  string[]          = [];
  const forestOrigMatrix: THREE.Matrix4[] = [];
  const forestTrunkHexKey: string[]       = [];
  const forestTrunkOrigMatrix: THREE.Matrix4[] = [];
  const shrubHexKey:   string[]          = [];
  const shrubOrigMatrix: THREE.Matrix4[]  = [];
  const snowHexKey:    string[]          = [];
  const snowOrigMatrix:  THREE.Matrix4[]  = [];
  // Nowe dekoracje (szczyty gor, kopce wzgorz, pierscienie wybrzeza, wydmy)
  const peakHexKey:    string[]          = [];
  const peakOrigMatrix:  THREE.Matrix4[]  = [];
  const hillBumpHexKey: string[]         = [];
  const hillBumpOrigMatrix: THREE.Matrix4[] = [];
  const beachHexKey:   string[]          = [];
  const beachOrigMatrix: THREE.Matrix4[]  = [];
  const duneHexKey:    string[]          = [];
  const duneOrigMatrix:  THREE.Matrix4[]  = [];

  // ---------------------------------------------------------------------------
  // Pętla główna -- wypełnij macierze instancji + oazy
  // ---------------------------------------------------------------------------

  const dummy = new THREE.Object3D();
  let forestIdx      = 0;
  let forestTrunkIdx = 0;
  let snowIdx        = 0;
  let shrubIdx       = 0;
  let peakIdx        = 0;
  let hillBumpIdx    = 0;
  let beachIdx       = 0;
  let duneIdx        = 0;

  for (const hex of Object.values(map.hexes)) {
    const t   = hex.terenBazowy;
    const vis = TERRAIN_VISUALS[t];
    const { x, z } = axialToWorld(hex.coords.q, hex.coords.r, R);
    const y = vis.height / 2 + vis.yOffset;
    const hexKey = `${hex.coords.q},${hex.coords.r}`;

    // Hex prism
    const meshIdx = terrainIndex[t];
    const iIdx    = terrainInstanceIdx[t] ?? 0;
    if (meshIdx !== undefined) {
      const mesh = instancedMeshes[meshIdx]!;
      dummy.position.set(x, y, z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(iIdx, dummy.matrix);

      // Inicjalizuj kolor instancji: kolor bazowy terenu + deterministyczny jitter HSL.
      // Dzieki temu duze jednolite obszary nie sa plaska plama jednego koloru.
      // baseColor zapamietany Z jitterem -> fog-of-war przelicza poprawnie (mnozy ten kolor).
      const isWater = t === TerenBazowy.Morze || t === TerenBazowy.Wybrzeze;
      // F1: zmieszaj kolor terenu ze srednia sasiadow (miekkie granice biomow), potem jitter.
      const blendedHex = blendedTerrainHex(map, hex.coords.q, hex.coords.r, vis.color, isWater);
      const baseColor = jitteredTerrainColor(blendedHex, hex.coords.q, hex.coords.r, map.seed, isWater);
      mesh.setColorAt(iIdx, baseColor);

      // Rejestruj wpis w mapie instancji (fog-of-war)
      hexInstance.set(hexKey, { mesh, index: iIdx, baseColor });

      terrainInstanceIdx[t] = iIdx + 1;
    }

    // Las -- naturalna kepa 3-5 drzew (korona + pien), deterministyczna per kafelek.
    // Uzywa hash2D(q,r) zamiast wspolnego LCG -> uklad stabilny niezaleznie od kolejnosci hexow.
    if (hex.nakladka === Nakladka.Las) {
      const baseY = vis.height + vis.yOffset;
      const q = hex.coords.q, r = hex.coords.r;
      const treeCount = 3 + Math.floor(hash2D(q, r, map.seed, 1) * 3); // 3..5
      for (let ti = 0; ti < treeCount && forestIdx < forestMesh.count; ti++) {
        // Kazde drzewo: niezalezne strumienie szumu (kat, promien, wysokosc, obrot).
        const angle  = hash2D(q, r, map.seed, 10 + ti) * Math.PI * 2;
        // Pierscieniowy rozklad: drzewa rzadziej w samym srodku -> naturalna kepa.
        const spread = (0.12 + hash2D(q, r, map.seed, 40 + ti) * 0.36) * R;
        const tx = x + Math.cos(angle) * spread;
        const tz = z + Math.sin(angle) * spread;
        const treeH  = 0.26 + hash2D(q, r, map.seed, 70 + ti) * 0.30; // wysokosc korony
        const yaw    = hash2D(q, r, map.seed, 100 + ti) * Math.PI * 2;
        const trunkH = R * 0.18;

        // Pien -- krotki walec u podstawy drzewa
        if (forestTrunkIdx < forestTrunkMesh.count) {
          dummy.position.set(tx, baseY + trunkH / 2, tz);
          dummy.scale.set(1, 1, 1);
          dummy.rotation.set(0, yaw, 0);
          dummy.updateMatrix();
          forestTrunkMesh.setMatrixAt(forestTrunkIdx, dummy.matrix);
          forestTrunkHexKey[forestTrunkIdx] = hexKey;
          forestTrunkOrigMatrix[forestTrunkIdx] = dummy.matrix.clone();
          forestTrunkIdx++;
        }

        // Korona -- stozek na pniu, lekko zwezony losowo (rozne grubosci drzew)
        const widthScale = 0.85 + hash2D(q, r, map.seed, 130 + ti) * 0.4;
        dummy.position.set(tx, baseY + trunkH + treeH / 2, tz);
        dummy.scale.set(widthScale, treeH / 0.50, widthScale);
        dummy.rotation.set(0, yaw, 0);
        dummy.updateMatrix();
        forestMesh.setMatrixAt(forestIdx, dummy.matrix);
        // Zapisz klucz heksa i oryginalna macierz dla fog-of-war
        forestHexKey[forestIdx] = hexKey;
        forestOrigMatrix[forestIdx] = dummy.matrix.clone();
        forestIdx++;
      }
    }

    // Gory -- dekoracyjny szczyt skalny PONAD prizmem + sniezna czapka na jego wierzcholku.
    if (t === TerenBazowy.Gory) {
      const topY = vis.height + vis.yOffset; // szczyt prizmu (NIEZMIENIONY)
      const q = hex.coords.q, r = hex.coords.r;

      // Szczyt: niski stozek o zmiennej wysokosci/obrocie (rozne sylwetki gor)
      const peakH = R * (0.35 + hash2D(q, r, map.seed, 5) * 0.22);
      const peakYaw = hash2D(q, r, map.seed, 6) * Math.PI * 2;
      const peakWidth = 0.85 + hash2D(q, r, map.seed, 7) * 0.3;
      dummy.position.set(x, topY + peakH / 2, z);
      dummy.scale.set(peakWidth, peakH / 0.85, peakWidth);
      dummy.rotation.set(0, peakYaw, 0);
      dummy.updateMatrix();
      peakMesh.setMatrixAt(peakIdx, dummy.matrix);
      peakHexKey[peakIdx] = hexKey;
      peakOrigMatrix[peakIdx] = dummy.matrix.clone();
      peakIdx++;

      // Snieg: maly dysk na wierzcholku dekoracyjnego szczytu (skaluje sie do jego wysokosci)
      const snowScale = peakWidth * 0.55;
      dummy.position.set(x, topY + peakH * 0.74, z);
      dummy.rotation.set(0, peakYaw, 0);
      dummy.scale.set(snowScale, 1, snowScale);
      dummy.updateMatrix();
      snowMesh.setMatrixAt(snowIdx, dummy.matrix);
      // Zapisz klucz heksa i oryginalna macierz dla fog-of-war
      snowHexKey[snowIdx] = hexKey;
      snowOrigMatrix[snowIdx] = dummy.matrix.clone();
      snowIdx++;
    }

    // Wzgorza -- trawiasty kopiec (kopula) PONAD prizmem + 1-3 krzewy na nim.
    // Deterministyczne per kafelek (hash2D), wiec uklad jest stabilny.
    if (t === TerenBazowy.Wzgorza) {
      const baseY = vis.height + vis.yOffset;
      const q = hex.coords.q, r = hex.coords.r;

      // Kopiec: splaszczona kopula o zmiennej wysokosci/szerokosci (faliste wzgorza)
      const bumpH = 0.14 + hash2D(q, r, map.seed, 2) * 0.16;
      const bumpW = 0.80 + hash2D(q, r, map.seed, 3) * 0.30;
      const bumpYaw = hash2D(q, r, map.seed, 4) * Math.PI * 2;
      dummy.position.set(x, baseY, z);
      // SphereGeometry(R*0.62) polkula -> skala Y nadaje docelowa wysokosc kopca
      dummy.scale.set(bumpW, bumpH / 0.62, bumpW);
      dummy.rotation.set(0, bumpYaw, 0);
      dummy.updateMatrix();
      hillBumpMesh.setMatrixAt(hillBumpIdx, dummy.matrix);
      hillBumpHexKey[hillBumpIdx] = hexKey;
      hillBumpOrigMatrix[hillBumpIdx] = dummy.matrix.clone();
      hillBumpIdx++;

      // Krzewy na kopcu -- start od jego wierzcholka (baseY + bumpH)
      const shrubBaseY = baseY + bumpH;
      const shrubCount = 1 + Math.floor(hash2D(q, r, map.seed, 8) * 3); // 1..3
      for (let si = 0; si < shrubCount && shrubIdx < hillCount * MAX_SHRUBS_PER_HILL; si++) {
        const angle  = hash2D(q, r, map.seed, 200 + si) * Math.PI * 2;
        const spread = hash2D(q, r, map.seed, 230 + si) * R * 0.38;
        const sx = x + Math.cos(angle) * spread;
        const sz = z + Math.sin(angle) * spread;
        const shrubH = 0.16 + hash2D(q, r, map.seed, 260 + si) * 0.18;
        dummy.position.set(sx, shrubBaseY + shrubH / 2, sz);
        dummy.scale.set(1, shrubH / 0.38, 1);
        dummy.rotation.set(0, hash2D(q, r, map.seed, 290 + si) * Math.PI * 2, 0);
        dummy.updateMatrix();
        shrubMesh.setMatrixAt(shrubIdx, dummy.matrix);
        // Zapisz klucz heksa i oryginalna macierz dla fog-of-war
        shrubHexKey[shrubIdx] = hexKey;
        shrubOrigMatrix[shrubIdx] = dummy.matrix.clone();
        shrubIdx++;
      }
    }

    // Wybrzeze -- cienki piaszczysty pierscien na szczycie hexa (plaza).
    if (t === TerenBazowy.Wybrzeze) {
      const topY = vis.height + vis.yOffset;
      dummy.position.set(x, topY + R * 0.015, z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      beachMesh.setMatrixAt(beachIdx, dummy.matrix);
      beachHexKey[beachIdx] = hexKey;
      beachOrigMatrix[beachIdx] = dummy.matrix.clone();
      beachIdx++;
    }

    // -------------------------------------------------------------------------
    // Wydma pustynna -- niska kopula piasku PONAD prizmem, ~1/3 hexow (deterministycznie).
    // hash2D nie rusza wspolnego LCG -> nie zaburza losowania oazy ponizej.
    // -------------------------------------------------------------------------
    if (t === TerenBazowy.Pustynia) {
      const q = hex.coords.q, r = hex.coords.r;
      if (hash2D(q, r, map.seed, 9) < 0.34) {
        const baseY = vis.height + vis.yOffset;
        const duneH = 0.06 + hash2D(q, r, map.seed, 11) * 0.10;
        const duneW = 0.7 + hash2D(q, r, map.seed, 12) * 0.5;
        const dAng  = hash2D(q, r, map.seed, 13) * Math.PI * 2;
        const dOff  = hash2D(q, r, map.seed, 14) * R * 0.25;
        dummy.position.set(x + Math.cos(dAng) * dOff, baseY, z + Math.sin(dAng) * dOff);
        // SphereGeometry(R*0.5) polkula -> skala Y nadaje wysokosc wydmy, X/Z elipse
        dummy.scale.set(duneW, duneH / 0.5, duneW * (0.7 + hash2D(q, r, map.seed, 15) * 0.4));
        dummy.rotation.set(0, dAng, 0);
        dummy.updateMatrix();
        duneMesh.setMatrixAt(duneIdx, dummy.matrix);
        duneHexKey[duneIdx] = hexKey;
        duneOrigMatrix[duneIdx] = dummy.matrix.clone();
        duneIdx++;
      }
    }

    // -------------------------------------------------------------------------
    // Oaza na pustyni -- ~1 na 6 hexow pustyni (LCG deterministyczny), InstancedMesh
    // -------------------------------------------------------------------------
    if (t === TerenBazowy.Pustynia) {
      // Consume one rnd() call per desert hex for determinism regardless of branch
      const oasisRoll = rnd();
      if (oasisRoll < 1.0 / 6.0) {
        const baseY = vis.height + vis.yOffset; // top of the desert prism

        // Basen wodny -- plaska cylinder na srodku hexa
        if (oasisPoolIdx < oasisPoolMesh.count) {
          dummy.position.set(x, baseY + R * 0.02, z);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          oasisPoolMesh.setMatrixAt(oasisPoolIdx, dummy.matrix);
          oasisPoolHexKey[oasisPoolIdx]  = hexKey;
          oasisPoolOrigMat[oasisPoolIdx] = dummy.matrix.clone();
          oasisPoolIdx++;
        }

        // 1 lub 2 palmy
        const palmCount = oasisRoll < 1.0 / 12.0 ? 1 : 2;
        for (let pi = 0; pi < palmCount; pi++) {
          // Pozycja palmy -- obok basenu
          const palmAngle = rnd() * Math.PI * 2;
          const palmDist  = R * (0.30 + rnd() * 0.15);
          const px = x + Math.cos(palmAngle) * palmDist;
          const pz = z + Math.sin(palmAngle) * palmDist;

          // Pien palmy -- instancja
          if (oasisTrunkIdx < oasisTrunkMesh.count) {
            dummy.position.set(px, baseY + R * 0.275, pz);
            dummy.rotation.set(0, rnd() * Math.PI * 2, (rnd() - 0.5) * 0.25);
            dummy.scale.set(1, 1, 1);
            dummy.updateMatrix();
            oasisTrunkMesh.setMatrixAt(oasisTrunkIdx, dummy.matrix);
            oasisTrunkHexKey[oasisTrunkIdx]  = hexKey;
            oasisTrunkOrigMat[oasisTrunkIdx] = dummy.matrix.clone();
            oasisTrunkIdx++;
          } else {
            // Consume rnd() calls even when count exceeded (preserve LCG state)
            rnd(); rnd();
          }

          // Liscie palmy -- 3-4 stozki rozchodzace sie od czubka pnia
          const frondCount = 3 + (rnd() > 0.5 ? 1 : 0);
          const trunkTopY = baseY + R * 0.55;
          for (let fi = 0; fi < frondCount; fi++) {
            const frondAngle = (fi / frondCount) * Math.PI * 2 + rnd() * 0.4;
            const tiltOut = 0.55 + rnd() * 0.25; // angle from vertical
            if (oasisFrondIdx < oasisFrondMesh.count) {
              dummy.position.set(
                px + Math.cos(frondAngle) * R * 0.18,
                trunkTopY + R * 0.10,
                pz + Math.sin(frondAngle) * R * 0.18,
              );
              dummy.rotation.set(tiltOut, frondAngle + Math.PI * 0.5, 0);
              dummy.scale.set(1, 1, 1);
              dummy.updateMatrix();
              oasisFrondMesh.setMatrixAt(oasisFrondIdx, dummy.matrix);
              oasisFrondHexKey[oasisFrondIdx]  = hexKey;
              oasisFrondOrigMat[oasisFrondIdx] = dummy.matrix.clone();
              oasisFrondIdx++;
            }
          }
        }
      }
    }
  }

  // Aktualizuj bufor instancji
  for (const m of instancedMeshes) {
    m.instanceMatrix.needsUpdate = true;
    // Zatwierdź inicjalne kolory instancji (bazowe kolory terenu)
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }
  forestMesh.count = forestIdx;
  forestMesh.instanceMatrix.needsUpdate = true;
  forestTrunkMesh.count = forestTrunkIdx;
  forestTrunkMesh.instanceMatrix.needsUpdate = true;
  snowMesh.count = snowIdx;
  snowMesh.instanceMatrix.needsUpdate = true;
  shrubMesh.count = shrubIdx;
  shrubMesh.instanceMatrix.needsUpdate = true;
  peakMesh.count = peakIdx;
  peakMesh.instanceMatrix.needsUpdate = true;
  hillBumpMesh.count = hillBumpIdx;
  hillBumpMesh.instanceMatrix.needsUpdate = true;
  beachMesh.count = beachIdx;
  beachMesh.instanceMatrix.needsUpdate = true;
  duneMesh.count = duneIdx;
  duneMesh.instanceMatrix.needsUpdate = true;
  oasisPoolMesh.count  = oasisPoolIdx;
  oasisPoolMesh.instanceMatrix.needsUpdate  = true;
  oasisTrunkMesh.count = oasisTrunkIdx;
  oasisTrunkMesh.instanceMatrix.needsUpdate = true;
  oasisFrondMesh.count = oasisFrondIdx;
  oasisFrondMesh.instanceMatrix.needsUpdate = true;

  // ---------------------------------------------------------------------------
  // Rzeki -- wczytywane z map.riverPaths (dane generatora mapy)
  // (opis jak w oryginale; wstega wody + brzegi, ponizej szczytu terenu)
  // ---------------------------------------------------------------------------

  const paths = map.riverPaths ?? [];

  // Parametry wyglądu rzeki
  // F1: rzeki na KRAWEDZIACH -> wezsze niz dawna wstega przez srodek.
  const RIVER_WATER_HALF_WIDTH = R * 0.14; // szerokość połówkowa wody
  const RIVER_DEPTH_BELOW      = -R * 0.02; // zagłębienie poniżej szczytu terenu

  const riverVerts = buildVertexGraph(map, R);
  for (const path of paths) {
    if (path.length < 2) continue;
    const vpath = traceRiverVertices(map, R, riverVerts, path[0]!);
    if (vpath.length < 2) continue;
    const hk = new Set<string>();
    const pts: THREE.Vector3[] = vpath.map(v => {
      for (const k of v.hexKeys) hk.add(k);
      let top = -Infinity;
      for (const k of v.hexKeys) { const h = map.hexes[k]; const vis = TERRAIN_VISUALS[h ? h.terenBazowy : TerenBazowy.Laka]; top = Math.max(top, vis.height + vis.yOffset); }
      return new THREE.Vector3(v.x, top - RIVER_DEPTH_BELOW, v.z);
    });
    const waterGeo = buildRibbonGeometry(pts, RIVER_WATER_HALF_WIDTH, 12);
    const waterMesh = new THREE.Mesh(waterGeo, riverWaterMat);
    waterMesh.castShadow = false;
    waterMesh.receiveShadow = true;
    scene.add(waterMesh);
    riverEntries.push({ waterMesh, bankMesh: waterMesh, waterGeo, bankGeo: waterGeo, hexKeys: hk });
    // --- DELTA u ujscia: cienkie strugi z konca rzeki do krawedzi mouth-heksa stykajacych sie z woda ---
    const lastV = vpath[vpath.length - 1]!;
    let mouthKey: string | null = null;
    for (const k of lastV.hexKeys) { const h = map.hexes[k]; if (h && h.terenBazowy !== TerenBazowy.Morze && h.terenBazowy !== TerenBazowy.Wybrzeze) { mouthKey = k; break; } }
    if (!mouthKey) for (const k of lastV.hexKeys) { const h = map.hexes[k]; if (h && h.terenBazowy === TerenBazowy.Wybrzeze) { mouthKey = k; break; } }
    if (mouthKey) {
      const mh = map.hexes[mouthKey]!;
      const mc = axialToWorld(mh.coords.q, mh.coords.r, R);
      const mco = hexCorners(mc.x, mc.z, R);
      const mvis = TERRAIN_VISUALS[mh.terenBazowy];
      const yD = (mvis.height + mvis.yOffset) - RIVER_DEPTH_BELOW;
      const NB6: ReadonlyArray<readonly [number, number]> = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
      for (let e = 0; e < 6; e++) {
        const a = mco[e]!, b = mco[(e + 1) % 6]!;
        const midx = (a.x + b.x) / 2, midz = (a.z + b.z) / 2;
        const ncx = 2 * midx - mc.x, ncz = 2 * midz - mc.z;
        let water = false;
        for (const [dq, dr] of NB6) {
          const nh = map.hexes[`${mh.coords.q + dq},${mh.coords.r + dr}`];
          if (!nh) continue;
          const nc = axialToWorld(nh.coords.q, nh.coords.r, R);
          if (Math.abs(nc.x - ncx) < R * 0.25 && Math.abs(nc.z - ncz) < R * 0.25) {
            water = (nh.terenBazowy === TerenBazowy.Morze || nh.terenBazowy === TerenBazowy.Wybrzeze);
            break;
          }
        }
        if (!water) continue;
        // struga z konca rzeki do srodka krawedzi wodnej (cienka)
        const fg = buildRibbonGeometry([
          new THREE.Vector3(lastV.x, yD, lastV.z),
          new THREE.Vector3((lastV.x + midx) / 2, yD, (lastV.z + midz) / 2),
          new THREE.Vector3(midx, yD, midz),
        ], R * 0.045, 6);
        const fm = new THREE.Mesh(fg, riverWaterMat); fm.receiveShadow = true; scene.add(fm);
        riverEntries.push({ waterMesh: fm, bankMesh: fm, waterGeo: fg, bankGeo: fg, hexKeys: hk });
        // oplecenie: cienka struga WZDLUZ krawedzi wodnej (a -> mid -> b)
      }
    }
    for (const k of hk) riverHexKeys.push(k);
  }

  // ---------------------------------------------------------------------------
  // F1 — ocean wokol kontynentu + ramka swiata (plansza)
  // ---------------------------------------------------------------------------
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const hex of Object.values(map.hexes)) {
    const { x, z } = axialToWorld(hex.coords.q, hex.coords.r, R);
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  }
  const seaTop = TERRAIN_VISUALS[TerenBazowy.Morze].height + TERRAIN_VISUALS[TerenBazowy.Morze].yOffset;
  const padO = R * 7;    // ocean siega poza mape
  const padF = R * 1.4;  // ramka tuz przy krawedzi mapy
  const cXb = (minX + maxX) / 2, cZb = (minZ + maxZ) / 2;

  // Plaszczyzna glebokiego oceanu pod calym swiatem (wypelnia tlo wokol ladu).
  const oceanGeo = new THREE.PlaneGeometry((maxX - minX) + padO * 2, (maxZ - minZ) + padO * 2);
  const oceanMat = new THREE.MeshLambertMaterial({ color: DEEP_OCEAN_COLOR });
  const oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
  oceanMesh.rotation.x = -Math.PI / 2;
  oceanMesh.position.set(cXb, seaTop - R * 0.02, cZb);
  oceanMesh.receiveShadow = true;
  scene.add(oceanMesh);

  // Ramka swiata — 4 listwy obramowania wokol mapy (ciemny kamien/drewno), w oceanie.
  const frameMat = new THREE.MeshLambertMaterial({ color: FRAME_COLOR });
  const frameGeos: THREE.BoxGeometry[] = [];
  const fx0 = minX - padF, fx1 = maxX + padF, fz0 = minZ - padF, fz1 = maxZ + padF;
  const frameBarH = R * 0.6, frameBarT = R * 0.7, frameY = seaTop + R * 0.12;
  const addBar = (w: number, d: number, px: number, pz: number) => {
    const g = new THREE.BoxGeometry(w, frameBarH, d);
    const m = new THREE.Mesh(g, frameMat);
    m.position.set(px, frameY, pz);
    m.castShadow = true;
    m.receiveShadow = true;
    scene.add(m);
    frameGeos.push(g);
  };
  const spanX = (fx1 - fx0) + frameBarT * 2;
  addBar(spanX, frameBarT, (fx0 + fx1) / 2, fz0 - frameBarT / 2); // gora
  addBar(spanX, frameBarT, (fx0 + fx1) / 2, fz1 + frameBarT / 2); // dol
  addBar(frameBarT, (fz1 - fz0), fx0 - frameBarT / 2, (fz0 + fz1) / 2); // lewo
  addBar(frameBarT, (fz1 - fz0), fx1 + frameBarT / 2, (fz0 + fz1) / 2); // prawo

  // -- Kamera
  const center = mapCenter(map.szerokoscQ, map.wysokoscR, R);
  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.5, 600);
  const camDist = Math.max(map.szerokoscQ, map.wysokoscR) * R * 1.45;
  camera.position.set(center.x, camDist * 0.9, center.z + camDist * 0.7);
  camera.lookAt(center.x, 0, center.z);

  // -- Resize handler
  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', onResize);

  // -- Dispose
  function dispose() {
    window.removeEventListener('resize', onResize);
    for (const m of instancedMeshes) { m.geometry.dispose(); }
    for (const mat of Object.values(terrainMaterials)) mat?.dispose();
    forestConeGeo.dispose(); forestConeMat.dispose();
    forestTrunkGeo.dispose(); forestTrunkMat.dispose();
    snowGeo.dispose(); snowMat.dispose();
    shrubConeGeo.dispose(); shrubConeMat.dispose();
    // Nowe dekoracje terenu
    peakGeo.dispose(); peakMat.dispose();
    hillBumpGeo.dispose(); hillBumpMat.dispose();
    beachGeo.dispose(); beachMat.dispose();
    duneGeo.dispose(); duneMat.dispose();
    // Oazy (InstancedMesh)
    oasisPoolGeo.dispose();  oasisPoolMat.dispose();
    oasisTrunkGeo.dispose(); oasisTrunkMat.dispose();
    oasisFrondGeo.dispose(); oasisFrondMat.dispose();
    // Rzeki (woda + brzegi per entry)
    for (const entry of riverEntries) {
      entry.waterGeo.dispose();
      entry.bankGeo.dispose();
    }
    riverWaterMat.dispose();
    riverBankMat.dispose();
    // Ocean + ramka swiata (F1)
    oceanGeo.dispose(); oceanMat.dispose();
    for (const g of frameGeos) g.dispose();
    frameMat.dispose();
    renderer.dispose();
  }

  // ---------------------------------------------------------------------------
  // setFog -- przelicza kolory prizmow terenu wedlug stanu mgly wojennej
  // oraz ukrywa/przywraca nakladki (las, snieg, krzewy, oazy, rzeki)
  // ---------------------------------------------------------------------------

  // Macierz zerowa (skala 0,0,0) — ukrywa instancje InstancedMesh
  const ZERO_MATRIX = new THREE.Matrix4().makeScale(0, 0, 0);

  function setFog(visible: Set<string>, explored: Set<string>): void {
    // Pomocnik: czy hex jest niewidoczny i nieodkryty?
    const isHidden = (k: string) => !visible.has(k) && !explored.has(k);

    // -- Baza: przelicz kolory prizmow terenu
    const touchedMeshes = new Set<THREE.InstancedMesh>();

    for (const [key, entry] of hexInstance) {
      const { mesh, index, baseColor } = entry;
      let color: THREE.Color;

      if (visible.has(key)) {
        color = baseColor.clone();
      } else if (explored.has(key)) {
        color = baseColor.clone().multiplyScalar(0.45);
      } else {
        color = FOG_HIDDEN_COLOR.clone();
      }

      mesh.setColorAt(index, color);
      touchedMeshes.add(mesh);
    }

    // Zatwierdz zmiany kolorow na wszystkich dotknietych meshach
    for (const mesh of touchedMeshes) {
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }

    // -- Nakladki instancji: ukryj (skala 0) hexy nieodkryte, przywroc macierz dla widzianych/odkrytych.
    const applyOverlayFog = (
      mesh: THREE.InstancedMesh,
      keys: string[],
      orig: THREE.Matrix4[],
    ) => {
      const cnt = mesh.count;
      for (let i = 0; i < cnt; i++) {
        const k = keys[i];
        if (k === undefined) continue;
        if (isHidden(k)) {
          mesh.setMatrixAt(i, ZERO_MATRIX);
        } else {
          const m = orig[i];
          if (m) mesh.setMatrixAt(i, m);
        }
      }
      mesh.instanceMatrix.needsUpdate = true;
    };

    applyOverlayFog(forestMesh,      forestHexKey,      forestOrigMatrix);
    applyOverlayFog(forestTrunkMesh, forestTrunkHexKey, forestTrunkOrigMatrix);
    applyOverlayFog(snowMesh,        snowHexKey,        snowOrigMatrix);
    applyOverlayFog(shrubMesh,       shrubHexKey,       shrubOrigMatrix);
    applyOverlayFog(peakMesh,        peakHexKey,        peakOrigMatrix);
    applyOverlayFog(hillBumpMesh,    hillBumpHexKey,    hillBumpOrigMatrix);
    applyOverlayFog(beachMesh,       beachHexKey,       beachOrigMatrix);
    applyOverlayFog(duneMesh,        duneHexKey,        duneOrigMatrix);

    // -- Oazy: instancje -- ukryj/przywroc przez macierz skali 0
    applyOverlayFog(oasisPoolMesh,  oasisPoolHexKey,  oasisPoolOrigMat);
    applyOverlayFog(oasisTrunkMesh, oasisTrunkHexKey, oasisTrunkOrigMat);
    applyOverlayFog(oasisFrondMesh, oasisFrondHexKey, oasisFrondOrigMat);

    // -- Rzeki: kazda siatka (woda + brzegi) widoczna, gdy choc jeden jej hex jest widziany lub odkryty
    for (const entry of riverEntries) {
      const show = Array.from(entry.hexKeys).some(k => visible.has(k) || explored.has(k));
      entry.waterMesh.visible = show;
      entry.bankMesh.visible  = show;
    }
  }

  return { scene, camera, renderer, center, dispose, setFog };
}
