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
 * Wzgórza = schodkowy kopiec zielony PONAD prizmem (ten sam kształt co tarasy, bez brązu).
 * Wybrzeże = pełna tafła piasku + jasnoniebieska woda tylko od strony Morza (Roblox, hybryda C).
 * Ląd przy Wybrzeżu = pas piasku ~30% promienia od krawędzi morza.
 * Delta rzeki = fan 2–3 heksów jaśniejszej wody u ujścia (D-MAPA-DELTA A).
 * Pustynia = wydmy (kopuły piasku, ~1/3 hexów) + losowa (LCG, ~1 na 6) oaza: basen + palmy.
 * Rzeka = ciągła wstęga wzdłuż riverPaths (krawędzie heksów); ujście przez Wybrzeże.
 *
 * Kolor PER-KAFELEK: każdy prism dostaje deterministyczny, subtelny jitter HSL
 * (hash q,r,seed), żeby duże jednolite obszary nie były płaską plamą koloru.
 *
 * Mgła wojenna (3 stany — ląd i morze identycznie, A-FOG-04 Maciej 2026-07-03):
 *   - unknown  → heks ukryty (skala 0), ląd i morze — czarne tło wokół (FOG_HIDDEN_COLOR)
 *   - explored → prawdziwy teren, przyciemniony ×FOG_EXPLORED_BRIGHTNESS (FoW)
 *   - visible  → pełny kolor i dekor (pełny widok w zasięgu jednostki/miasta)
 * Globalna tafla oceanu tylko gdy brak unknown na mapie (całość odkryta choćby przez FoW).
 * Roblox: heksy Morze+Wybrzeże ukryte gdy widać głęboką taflę; brzeg = dekor piasku/płytkiej wody.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { GameMap } from '../types/map';
import { TerenBazowy, Nakladka } from '../types/hex';
import { axialToWorld, mapCenter, HEX_R } from './hexutil';
import {
  type MapRenderStyle,
  type MapRenderOptions,
  type QualityTier,
  DEFAULT_MAP_RENDER_OPTIONS,
  normalizeMapRenderOptions,
  resolveRenderPreset,
  styleScenePalette,
  styleTerrainColor,
  buildStyleForestCluster,
  buildStyleMountainPeak,
  buildStyleHillBump,
  buildStyleBeachRing,
  buildStyleCoastSandEdges,
  buildStyleCoastWaterCap,
  buildStyleLandCoastSandCap,
  computeRiverDeltaHexKeys,
  landCoastSandNeeded,
  buildStyleDune,
  buildStyleOasis,
  isWarmJungleForestHex,
  terrainVisualForStyle,
  terrainSurfaceTopY,
  riverSurfaceLiftY,
  coastWaterCapTopY,
} from './mapRenderStyle';
import { addRobloxSkyDecor } from './robloxCity';
import { improvementKeysForHex } from '../game/terrain-improvements';
import { FOG_EXPLORED_BRIGHTNESS } from '../game/visibility';
import {
  goraGeometria, wzgorzeGeometria, wariantDlaHeksa, rotacjaDlaHeksa,
  TEREN_MATERIAL, LICZBA_WARIANTOW_TERENU,
} from './teren-gory-wzgorza';
// GRAFIKA-TEREN-2: kępy lasu jako 5 InstancedMesh (wzorzec gór/wzgórz — vertex colors, wspólny materiał).
// Dżungla tropikalna zostaje na starej ścieżce buildStyleForestCluster (poza zakresem).
import {
  lasGeometria, wariantLasuDlaHeksa, rotacjaLasuDlaHeksa,
  LAS_MATERIAL, LICZBA_WARIANTOW_LASU,
} from './lasy-modele';
import { setImprovementDetailQuality } from './robloxImprovements';
import { collapseToMergedMesh } from './mergeDecor';
import {
  dekorLakaGeometria, dekorRowninaGeometria, dekorDlaHeksa, rotacjaDekoru,
  DEKOR_MATERIAL, DEKOR_LICZBA_WARIANTOW,
} from './dekor-laki-rowniny';
// GRAFIKA-TEREN-2: oaza klockowa (podmiana w miejscu LCG za buildStyleOasis — decyzja C właściciela).
// Desert-dekor z tego modułu NIE wpięty (decyzja A — DEKOR_ENABLED=false).
import { buildOaza, rotacjaOazy } from './oaza-pustynia';
import {
  type ZoomLodLevel,
  type ZoomLodFlags,
  normalizedZoomT,
  resolveZoomLodLevel,
  zoomLodFlags,
  effectivePixelRatio,
} from './zoomLod';
import { fogBrightnessForHex, applyFogDimToObject3D } from './fogDim';
import { landRiverRenderPath } from '../map/gen-helpers';

export type { MapRenderStyle, MapRenderOptions, QualityTier } from './mapRenderStyle';
export { DEFAULT_MAP_RENDER_OPTIONS, normalizeMapRenderOptions, resolveRenderPreset } from './mapRenderStyle';

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
  [TerenBazowy.Pustynia]:  { color: 0xd9c179, height: 0.42, yOffset: 0.08 },
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

function terrainVis(t: TerenBazowy, renderStyle: MapRenderStyle): TerenVisual {
  const civ = TERRAIN_VISUALS[t];
  const spec = terrainVisualForStyle(t, renderStyle, civ);
  return { color: civ.color, height: spec.height, yOffset: spec.yOffset };
}

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
// Wariant 5 odcieni koloru terenu (Maciej 2026-07-09) — zamiast ozdobników pustych heksów:
// Równina = 5 jasnych zieleni, Łąka/trawa = 5 ciemnych zieleni; deterministycznie per heks (hash2D),
// mgła nadal przygasza (baseColor × jasność w setFog). Wartości do dostrojenia na renderze.
const LAKA_SHADES = [0x54923a, 0x5f9e42, 0x6cab4f, 0x79b85c, 0x86c469] as const;    // 5 ciemnych zieleni (trawa/łąka)
const ROWNINA_SHADES = [0x9ac968, 0xa6d074, 0xb4dc84, 0xc0e693, 0xcaec9f] as const; // 5 jasnych zieleni (równina)

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
  /** Scalona geometria wielu odcinków — uproszczone reguły fog. */
  merged?: boolean;
  /**
   * Klucz heksa per PUNKT wejściowy wstęgi (tylko rzeki jednowstęgowe, gałąź `sharp`).
   * Punkt i → wierzchołki 2i, 2i+1; quad j łączy punkty j..j+1 (wierzchołki 2j..2j+3).
   * Pozwala na mgłę PER-HEKS: chowamy tylko quady dotykające czerni (indeks), reszta wstęgi
   * zostaje. Brak (delty scalone) → fog per całą wstęgę.
   */
  pointHex?: string[];
  /** PERF: hash stanu mgły (odkryte/ciemne per punkt) z ostatniej przebudowy — pomija `setIndex`,
   *  gdy mgła tej rzeki się nie zmieniła (np. przy samym zoomie). Bez re-uploadu GPU bez potrzeby. */
  lastFogSig?: number;
  /** Czy po ostatniej przebudowie indeksu został choć jeden widoczny quad (dla flagi visible/LOD). */
  hasVisibleQuads?: boolean;
}

/** Kolejka geometrii rzek przed merge do jednego mesha per materiał (BATCH 3 / A1b). */
interface RiverGeoBucket {
  mat: THREE.Material;
  geos: THREE.BufferGeometry[];
  hexKeys: Set<string>;
  renderOrder: number;
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
   * oraz ukrywa/przywraca nakładki (las, śnieg, krzewy, oazy).
   * Rzeki są WYJĄTKIEM (Właściciel 2026-07-10): renderują się zawsze pełnym kolorem,
   * niezależnie od stanu mgły — patrz pętla `riverEntries` w `applyZoomLodDecor`.
   * @param visible  Zbiór kluczy "q,r" aktualnie widocznych hexów.
   * @param explored Zbiór kluczy "q,r" odkrytych, lecz nie widocznych hexów.
   *
   * Poziomy:
   *   visible  → factor 1.0  (pełny kolor bazowy)
   *   explored → factor FOG_EXPLORED_BRIGHTNESS (przyciemniony, zapamiętany)
   *   unknown  → kolor 0x0b0d12 (ciemna mgła, ustawiany bezpośrednio)
   */
  setFog: (visible: Set<string>, explored: Set<string>, opts?: { landReveal?: boolean }) => void;
  /** F-CITY-HEX: trwale ukryj dekoracje terenu (las, oaza…) na hexie miasta. */
  hideDecorAtHex: (hexKey: string) => void;
  /**
   * Dynamiczny LOD przy oddalaniu kamery — ukrywa drogie dekoracje i obniża pixel ratio.
   * Wywoływać co klatkę z odległością kamery (dist, minDist, maxDist).
   */
  setZoomLod: (dist: number, minDist: number, maxDist: number) => void;
  /** Aktualny poziom zoom LOD (0–4) — overlay F9. */
  getZoomLodLevel: () => ZoomLodLevel;
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
  halfWidth: number | number[],
  segmentsPerSpan: number,
  sharp = false,
): THREE.BufferGeometry {
  if (points.length < 2) return new THREE.BufferGeometry();

  const positions: number[] = [];
  const normals:   number[] = [];
  const uvs:       number[] = [];
  const indices:   number[] = [];
  let vertexCount = 0;
  let uAccum = 0;

  // Grubość wg rzędu cieku (Właściciel 2026-07-10, zad. 4): `halfWidth` może być tablicą — jedna
  // wartość per punkt wejściowy (1:1 w gałęzi `sharp`, jedyna aktualnie używana przez rzeki).
  const scalarHalfWidth = Array.isArray(halfWidth) ? (halfWidth[0] ?? 0) : halfWidth;
  const hwAt = (i: number): number => Array.isArray(halfWidth)
    ? (halfWidth[i] ?? halfWidth[halfWidth.length - 1] ?? scalarHalfWidth)
    : halfWidth;

  const emitCrossSection = (pt: THREE.Vector3, tFlat: THREE.Vector3, u: number, hw: number): void => {
    const right = new THREE.Vector3(-tFlat.z, 0, tFlat.x);
    const left  = new THREE.Vector3(pt.x - right.x * hw, pt.y, pt.z - right.z * hw);
    const rightV = new THREE.Vector3(pt.x + right.x * hw, pt.y, pt.z + right.z * hw);
    positions.push(left.x, left.y, left.z, rightV.x, rightV.y, rightV.z);
    normals.push(0, 1, 0, 0, 1, 0);
    uvs.push(0, u, 1, u);
    if (vertexCount > 0) {
      const base = vertexCount;
      indices.push(base - 2, base, base - 1, base - 1, base, base + 1);
    }
    vertexCount += 2;
  };

  if (sharp) {
    for (let i = 0; i < points.length; i++) {
      const pt = points[i]!;
      let tFlat: THREE.Vector3;
      if (i === 0) {
        const n = points[1]!;
        tFlat = new THREE.Vector3(n.x - pt.x, 0, n.z - pt.z).normalize();
      } else if (i === points.length - 1) {
        const p = points[i - 1]!;
        tFlat = new THREE.Vector3(pt.x - p.x, 0, pt.z - p.z).normalize();
      } else {
        const p = points[i - 1]!;
        const n = points[i + 1]!;
        tFlat = new THREE.Vector3(n.x - p.x, 0, n.z - p.z).normalize();
      }
      if (i > 0) uAccum += pt.distanceTo(points[i - 1]!);
      emitCrossSection(pt, tFlat, uAccum, hwAt(i));
    }
  } else {
    // Interpoluj ścieżkę przez CatmullRom dla gładkości (ujścia / estuary). Nie wspiera per-punktowej
    // tablicy szerokości (resampling nie ma 1:1 z punktami wejścia) — używany zawsze ze skalarem.
    const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
    const totalSeg = Math.max(20, points.length * segmentsPerSpan);

    for (let i = 0; i <= totalSeg; i++) {
      const t = i / totalSeg;
      const pt = curve.getPoint(t);
      const tVec = curve.getTangent(t);
      const tFlat = new THREE.Vector3(tVec.x, 0, tVec.z).normalize();
      emitCrossSection(pt, tFlat, t, scalarHalfWidth);
    }
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
function blendedTerrainHex(
  map: GameMap,
  q: number,
  r: number,
  baseHex: number,
  isWater: boolean,
  renderStyle: MapRenderStyle = 'civ',
  selfTeren?: TerenBazowy,
): number {
  const base = new THREE.Color(baseHex);
  const acc = new THREE.Color(0, 0, 0);
  let n = 0;
  for (const [dq, dr] of HEX_NEIGHBORS) {
    const nb = map.hexes[`${q + dq},${r + dr}`];
    if (!nb) continue;
    // Suchy ląd nie miesza koloru z morzem/wybrzeżem (inaczej „zalanie” przy zoom).
    if (selfTeren
      && selfTeren !== TerenBazowy.Morze
      && selfTeren !== TerenBazowy.Wybrzeze
      && (nb.terenBazowy === TerenBazowy.Morze || nb.terenBazowy === TerenBazowy.Wybrzeze)) {
      continue;
    }
    if (selfTeren === TerenBazowy.Wybrzeze
      && nb.terenBazowy !== TerenBazowy.Morze
      && nb.terenBazowy !== TerenBazowy.Wybrzeze) {
      continue;
    }
    const nbHex = renderStyle === 'civ'
      ? TERRAIN_VISUALS[nb.terenBazowy].color
      : styleTerrainColor(nb.terenBazowy, renderStyle);
    acc.add(new THREE.Color(nbHex));
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

/** Hexy współdzielone przez dwa wierzchołki krawędzi rzeki (węższy zestaw niż union). */
function riverSegmentHexKeys(v0: Vtx, v1: Vtx): Set<string> {
  const shared = new Set<string>();
  for (const k of v0.hexKeys) {
    if (v1.hexKeys.includes(k)) shared.add(k);
  }
  if (shared.size > 0) return shared;
  const fallback = new Set<string>();
  for (const k of v0.hexKeys) fallback.add(k);
  for (const k of v1.hexKeys) fallback.add(k);
  return fallback;
}

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

const AXIAL_DIRS: ReadonlyArray<readonly [number, number]> = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];

function isDryLandTeren(tb: TerenBazowy): boolean {
  return tb !== TerenBazowy.Morze && tb !== TerenBazowy.Wybrzeze;
}

function hasWybrzezeNeighbor(map: GameMap, q: number, r: number): boolean {
  for (const [dq, dr] of AXIAL_DIRS) {
    if (map.hexes[`${q + dq},${r + dr}`]?.terenBazowy === TerenBazowy.Wybrzeze) return true;
  }
  return false;
}

function hasMorzeNeighbor(map: GameMap, q: number, r: number): boolean {
  for (const [dq, dr] of AXIAL_DIRS) {
    if (map.hexes[`${q + dq},${r + dr}`]?.terenBazowy === TerenBazowy.Morze) return true;
  }
  return false;
}

/**
 * B0.7/B0.8/B0.9 (Owner 2026-07-20: „Wybrzeże JEST częścią morza" — dotknięcie Wybrzeża =
 * dotarcie do morza = koniec biegu, NIE wymagamy dojścia do głębokiego Morza).
 * Trasa realnie kończy w morzu, gdy ostatni hex JEST wodą (Morze lub Wybrzeże) albo ostatni
 * hex to ląd SĄSIADUJĄCY z wodą (Morze lub Wybrzeże). Tylko takie trasy dostają wstęgę
 * ujścia — dopływy (koniec na junction w głębi lądu) NIE.
 */
function pathReachesOpenSeaRender(map: GameMap, path: Array<{ q: number; r: number }>): boolean {
  if (path.length < 1) return false;
  const last = path[path.length - 1]!;
  const lastH = map.hexes[`${last.q},${last.r}`];
  if (!lastH) return false;
  if (!isDryLandTeren(lastH.terenBazowy)) return true; // ostatni hex JEST wodą (Morze lub Wybrzeże)
  // Ostatni hex to ląd — ujście, jeśli SĄSIADUJE wprost z wodą (Morze lub Wybrzeże).
  return hasWybrzezeNeighbor(map, last.q, last.r) || hasMorzeNeighbor(map, last.q, last.r);
}

/**
 * Punkty ujścia: ostatni heks LĄDU → krótkie wejście w PIERWSZY heks Wybrzeża → spływ
 * (wodospad) do tafli. Łańcuch budowany PROSTO z trasy (render-only) — dawny
 * coastalRiverRenderPath zwracał łańcuch długości 1 dla ~99% rzek (urywał się na ostatnim
 * Wybrzeżu przed unshiftem lądu), przez co ujście nie renderowało się w ogóle i rzeka
 * „chowała się pod ziemią" przed wodą.
 * KOTWICA: pierwszy punkt = środek ostatniego heksa lądu = dokładnie tam, gdzie kończy się
 * wstęga lądowa (renderLandRiversFromPaths z extendToJoin) → styk bez luki.
 * B0.9 (Owner 2026-07-20): „Wybrzeże JEST częścią morza" — ujście KOŃCZY SIĘ na pierwszym
 * heksie Wybrzeża, do którego dochodzi rzeka. NIE ciągniemy dalej pasem wybrzeża (coastWidth=2)
 * do heksa Morze — to właśnie „przepychanie się przez pas wybrzeża", którego reguła zabrania.
 */
function buildCoastalRiverPointChain(
  map: GameMap,
  path: Array<{ q: number; r: number }>,
  R: number,
  riverMouthY: number,
): { pts: THREE.Vector3[]; hexKeys: Set<string> } {
  const hexKeys = new Set<string>();
  const pts: THREE.Vector3[] = [];
  if (path.length < 1) return { pts, hexKeys };

  const COAST_OFFSET = R * 0.14;

  // Pierwszy heks NIE-lądowy w trasie (Wybrzeże LUB Morze) = cel ujścia; heks bezpośrednio
  // przed nim = ostatni ląd (styk bez luki z wstęgą lądową).
  let landHex: { q: number; r: number } | null = null;
  let coastHex: { q: number; r: number } | null = null;
  for (let i = 0; i < path.length; i++) {
    const h = map.hexes[`${path[i]!.q},${path[i]!.r}`];
    if (h && !isDryLandTeren(h.terenBazowy)) {
      coastHex = { q: path[i]!.q, r: path[i]!.r };
      if (i > 0) landHex = { q: path[i - 1]!.q, r: path[i - 1]!.r };
      break;
    }
  }
  if (!coastHex) {
    // Trasa (render) kończy na lądzie stykającym się z wodą wprost — landRiverRenderPath ucina
    // bieg PRZED heksem wody, więc w `path` może nie być żadnego heksu wody. Dobierz sąsiada
    // deterministycznie: stały porządek AXIAL_DIRS, pierwszy pasujący (Wybrzeże lub Morze).
    const last = path[path.length - 1]!;
    landHex = { q: last.q, r: last.r };
    for (const [dq, dr] of AXIAL_DIRS) {
      const nq = last.q + dq, nr = last.r + dr;
      const nh = map.hexes[`${nq},${nr}`];
      if (nh && !isDryLandTeren(nh.terenBazowy)) { coastHex = { q: nq, r: nr }; break; }
    }
  }
  if (!landHex || !coastHex) return { pts, hexKeys };
  hexKeys.add(`${landHex.q},${landHex.r}`);
  hexKeys.add(`${coastHex.q},${coastHex.r}`);

  // KOTWICA: środek ostatniego heksa lądu (na wysokości lądu) — koniec wstęgi lądowej ląduje TU.
  const landCenter = axialToWorld(landHex.q, landHex.r, R);
  const landY = riverHexSurfaceY(map, landHex.q, landHex.r, 'roblox', riverMouthY, COAST_OFFSET, R) ?? riverMouthY;
  pts.push(new THREE.Vector3(landCenter.x, landY, landCenter.z));

  // Krawędź styku ląd → Wybrzeże (poziom tafli od tego miejsca — wodospad domknie Y poniżej).
  const edgeMid = sharedEdgeMidpoint(landHex.q, landHex.r, coastHex.q, coastHex.r, R);
  if (edgeMid) pts.push(new THREE.Vector3(edgeMid.x, riverMouthY, edgeMid.z));

  // Krótkie wejście w płytką wodę PIERWSZEGO heksa Wybrzeża — TU kończy się ujście.
  // NIE idziemy dalej w stronę środka/drugiego pierścienia wybrzeża ani do Morza.
  const coastCenter = axialToWorld(coastHex.q, coastHex.r, R);
  const tIn = 0.4; // krótki odcinek w głąb pierwszego heksa Wybrzeża
  const baseX = edgeMid ? edgeMid.x : landCenter.x;
  const baseZ = edgeMid ? edgeMid.z : landCenter.z;
  const inX = baseX + (coastCenter.x - baseX) * tIn;
  const inZ = baseZ + (coastCenter.z - baseZ) * tIn;
  pts.push(new THREE.Vector3(inX, riverMouthY, inZ));

  // Wodospad: część lądowa trzyma plateau (wysokość ostatniego heksa lądu), na styku ląd→morze
  // wstęga spada pionowo do tafli (riverMouthY). Korona spina się z kotwicą lądową (bez luki).
  const shaped = applyCoastalWaterfall(pts, riverMouthY, landY, R);
  return { pts: shaped, hexKeys };
}

function coastalRiverKeySet(map: GameMap, path: Array<{ q: number; r: number }>): Set<string> {
  const keys = new Set<string>();
  const { hexKeys } = buildCoastalRiverPointChain(map, path, 1, 0);
  for (const k of hexKeys) keys.add(k);
  for (let i = Math.max(0, path.length - 6); i < path.length; i++) {
    keys.add(`${path[i]!.q},${path[i]!.r}`);
  }
  return keys;
}

function riverVertexOnCoastalPath(v: Vtx, coastalKeys: Set<string>): boolean {
  return v.hexKeys.some(k => coastalKeys.has(k));
}

function riverVertexAtCoast(map: GameMap, v: Vtx, coastalKeys: Set<string>): boolean {
  if (riverVertexOnCoastalPath(v, coastalKeys)) return true;
  for (const k of v.hexKeys) {
    const h = map.hexes[k];
    if (!h) continue;
    if (h.terenBazowy === TerenBazowy.Wybrzeze || h.terenBazowy === TerenBazowy.Morze) return true;
    if (h.rzeka?.obecna && hasWybrzezeNeighbor(map, h.coords.q, h.coords.r)) return true;
  }
  return false;
}

/**
 * BUG-RZEKI-RENDER — wariant B „wodospad" (Maciej 2026-07-06). Przerabia listę punktów
 * wstęgi ujścia tak, by NIGDY nie schodziła pod mesh lądu/wybrzeża:
 *  - część nad lądem trzyma stały poziom lądu (plateau) do samej krawędzi wybrzeża,
 *  - na styku ląd→morze wstęga spada stromo (prawie pionowo) do poziomu tafli (mouthY),
 *  - dalej płynie płasko na mouthY (nad wierzchem pryzmu wybrzeża).
 * Zamiast skosu, który interpolował Y pod ścianę pryzmu (efekt „rzeka tonie"), robimy
 * pionowy próg. Pion realizujemy jako 2 punkty z małym przesunięciem poziomym (nudge),
 * bo buildRibbonGeometry liczy przekrój z tangensu spłaszczonego do XZ — punkty o tym
 * samym X/Z dałyby zdegenerowany (NaN) przekrój. RENDER-ONLY: zero wpływu na generację.
 */
function applyCoastalWaterfall(
  pts: THREE.Vector3[],
  mouthY: number,
  landPlateauY: number,
  R: number,
): THREE.Vector3[] {
  if (pts.length < 2 || !(landPlateauY > mouthY + 1e-4)) return pts;
  // Próg klasyfikacji: punkt „morski" = Y bliżej mouthY niż lądowego plateau.
  const seaThreshold = mouthY + (landPlateauY - mouthY) * 0.5;
  let k = pts.length;
  for (let i = 0; i < pts.length; i++) {
    if (pts[i]!.y < seaThreshold) { k = i; break; }
  }
  if (k === 0) {
    // Brak części lądowej — cała wstęga płaska na tafli.
    return pts.map(p => new THREE.Vector3(p.x, mouthY, p.z));
  }
  if (k >= pts.length) {
    // Sama część lądowa (nie powinno się zdarzyć dla ujścia) — trzymaj plateau.
    return pts.map(p => new THREE.Vector3(p.x, landPlateauY, p.z));
  }
  const out: THREE.Vector3[] = [];
  // Plateau lądowe płaskie do krawędzi (kasuje „obwis" uśrednionego środka krawędzi).
  for (let i = 0; i < k; i++) out.push(new THREE.Vector3(pts[i]!.x, landPlateauY, pts[i]!.z));
  const edge = pts[k - 1]!;
  const sea = pts[k]!;
  const dx = sea.x - edge.x;
  const dz = sea.z - edge.z;
  const len = Math.hypot(dx, dz) || 1;
  const nudge = R * 0.06; // małe przesunięcie poziome — pion, ale ważny tangens dla wstęgi
  const lipX = edge.x + (dx / len) * nudge;
  const lipZ = edge.z + (dz / len) * nudge;
  out.push(new THREE.Vector3(lipX, landPlateauY, lipZ));                 // korona wodospadu
  out.push(new THREE.Vector3(lipX + (dx / len) * nudge, mouthY, lipZ + (dz / len) * nudge)); // stopa
  // Część morska płaska na tafli.
  for (let i = k; i < pts.length; i++) out.push(new THREE.Vector3(pts[i]!.x, mouthY, pts[i]!.z));
  return out;
}

/** Lejek estuary — rozszerzenie wstęgi rzeki w stronę morza (trapez płaski). */
function buildEstuaryFunnelGeometry(
  apex: THREE.Vector3,
  seaPt: THREE.Vector3,
  halfWidthNarrow: number,
  halfWidthWide: number,
): THREE.BufferGeometry {
  const dx = seaPt.x - apex.x;
  const dz = seaPt.z - apex.z;
  const len = Math.hypot(dx, dz) || 1;
  const px = -dz / len;
  const pz = dx / len;
  const y = apex.y;

  const positions = [
    apex.x + px * halfWidthNarrow, y, apex.z + pz * halfWidthNarrow,
    apex.x - px * halfWidthNarrow, y, apex.z - pz * halfWidthNarrow,
    seaPt.x + px * halfWidthWide, y, seaPt.z + pz * halfWidthWide,
    seaPt.x - px * halfWidthWide, y, seaPt.z - pz * halfWidthWide,
  ];
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex([0, 1, 2, 1, 3, 2]);
  geo.computeVertexNormals();
  return geo;
}

/** Wstęgi wzdłuż riverPaths — ujście przez Wybrzeże do Morza (tylko krawędzie hex). */
function renderCoastalRiverExtension(
  map: GameMap,
  path: Array<{ q: number; r: number }>,
  R: number,
  riverMouthY: number,
  riverWaterBucket: RiverGeoBucket,
  riverDeltaTopBucket: RiverGeoBucket,
  coastFunnelBucket: RiverGeoBucket,
  halfWidth: number,
  deltaKeys: Set<string>,
): void {
  const { pts: chainPts, hexKeys } = buildCoastalRiverPointChain(map, path, R, riverMouthY);
  if (chainPts.length < 2) return;

  const pts: THREE.Vector3[] = [];
  for (const p of chainPts) {
    if (pts.length === 0 || pts[pts.length - 1]!.distanceTo(p) > R * 0.02) pts.push(p);
  }
  if (pts.length < 2) return;

  const touchesDelta = [...hexKeys].some(k => deltaKeys.has(k));
  const segCount = pts.length - 1;

  for (let i = 0; i < segCount; i++) {
    const t = segCount <= 1 ? 1 : i / (segCount - 1);
    const segPts = [pts[i]!, pts[i + 1]!];
    const widthMul = 1.08 + t * 2.65;
    const useCoastMat = touchesDelta ? t >= 0.12 : t >= 0.45;
    // Z1: „deltowa” część wstęgi trafia do bucketa o renderOrder wstęgi (nad lejkiem), nie do lejka.
    const bucket = useCoastMat ? riverDeltaTopBucket : riverWaterBucket;
    const geo = buildRibbonGeometry(segPts, halfWidth * widthMul, 12, true);
    queueRiverGeo(bucket, geo, hexKeys);
  }

  if (pts.length >= 3 && touchesDelta) {
    const apex = pts[pts.length - 3]!;
    const seaPt = pts[pts.length - 1]!;
    if (apex.distanceTo(seaPt) <= R * 3.5) {
      const funnelGeo = buildEstuaryFunnelGeometry(
        apex,
        seaPt,
        halfWidth * 1.35,
        halfWidth * 3.4,
      );
      queueRiverGeo(coastFunnelBucket, funnelGeo, hexKeys);
    }
  }
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

/** Wierzch pryzmu heksa (ta sama formuła co dekoracje las/góry). */
function hexSurfaceTopY(t: TerenBazowy, renderStyle: MapRenderStyle): number {
  const vis = terrainVis(t, renderStyle);
  return vis.height + vis.yOffset;
}

/** Y wstęgi rzeki — NAD powierzchnią heksa (+ relief na wzgórzach/górach). */
function riverHexSurfaceY(
  map: GameMap,
  q: number,
  r: number,
  renderStyle: MapRenderStyle,
  riverMouthY: number,
  surfaceOffset: number,
  R: number,
): number | null {
  const h = map.hexes[`${q},${r}`];
  if (!h || h.terenBazowy === TerenBazowy.Morze) return null;
  // Tylko sam heks Wybrzeże schodzi do poziomu morza; sąsiedztwo plaży NIE obcina lądu.
  if (h.terenBazowy === TerenBazowy.Wybrzeze) return riverMouthY;
  // Maciej 2026-07-09: STAŁA PŁASKA wysokość — rzeka na poziomie równin/łąk niezależnie od faktycznego
  // terenu heksa (bez per-hex bonusów wzgórz/gór). Rzeka nie płynie w górę→dół→w górę.
  // R nieużywane po zdjęciu bonusów.
  void R;
  return terrainSurfaceTopY(TerenBazowy.Laka, renderStyle) + surfaceOffset;
}

function neighborDirIndex(q: number, r: number, nq: number, nr: number): number {
  const dq = nq - q;
  const dr = nr - r;
  for (let i = 0; i < HEX_NEIGHBORS.length; i++) {
    const nb = HEX_NEIGHBORS[i]!;
    if (nb[0] === dq && nb[1] === dr) return i;
  }
  return -1;
}

/** Środek krawędzi heksa w kierunku sąsiada dir (pointy-top: krawędź dir = rogi (dir+1),(dir+2)). */
function hexEdgeMidpointByDir(q: number, r: number, dir: number, R: number): { x: number; z: number } {
  const c = axialToWorld(q, r, R);
  const cs = hexCorners(c.x, c.z, R);
  const d = ((dir % 6) + 6) % 6;
  const p0 = cs[(d + 1) % 6]!;
  const p1 = cs[(d + 2) % 6]!;
  return { x: (p0.x + p1.x) * 0.5, z: (p0.z + p1.z) * 0.5 };
}

// ---------------------------------------------------------------------------
// Rzeki PO WEWNĘTRZNEJ STRONIE ŚCIANEK heksa — KANCIASTO (Owner 2026-07-10, twarda wytyczna
// „!!"): NIE prosta przez środek pola (odrzucona „centrolinia"), NIE gładka krzywa (odrzucony
// CatmullRom/Chaikin — „to nie styl Roblox"). Geometria KRAWĘDZIOWA: polilinia biegnie OBWODEM
// heksów — środek krawędzi WEJŚCIA → ROGI łuku (najkrótszy po ściankach, ≥2 boki) → środek
// krawędzi WYJŚCIA. Rogi INSETOWANE ku środkowi WŁASNEGO heksa (RIVER_INSET_FRAC) = hug
// WEWNĘTRZNEJ strony ścianki. JEDEN punkt na przejściu przez ściankę (wspólny środek krawędzi,
// bez insetu) → ZERO „domków". Render sharp=true (proste odcinki + załamania na rogach), BEZ
// wygładzania. RENDER-ONLY (nie zmienia generatora ani hasza mapy).
// ---------------------------------------------------------------------------

/** Wspólny środek krawędzi dwóch sąsiednich heksów (granica hex1|hex2). */
function sharedEdgeMidpoint(
  q1: number, r1: number, q2: number, r2: number, R: number,
): { x: number; z: number } | null {
  const dir = neighborDirIndex(q1, r1, q2, r2);
  if (dir < 0) return null;
  return hexEdgeMidpointByDir(q1, r1, dir, R);
}

/** Następny róg obwodu heksa (pointy-top; cw = zgodnie z ruchem wskazówek). */
function hexCornerStep(from: number, cw: boolean): number {
  return cw ? (from + 1) % 6 : (from + 5) % 6;
}

/** Droga wzdłuż obwodu heksa (rogi) między dwoma rogami — bez przekątnej przez pole. */
function walkHexPerimeter(fromCorner: number, toCorner: number, cw: boolean): number[] {
  if (fromCorner === toCorner) return [fromCorner];
  const out: number[] = [];
  let c = fromCorner;
  for (let guard = 0; guard < 7; guard++) {
    out.push(c);
    if (c === toCorner) break;
    c = hexCornerStep(c, cw);
  }
  return out;
}

/**
 * Rogi obwodu między krawędzią WEJŚCIA (dirIn) a WYJŚCIA (dirOut) — NAJKRÓTSZY łuk po ściankach.
 * Owner 2026-07-10: rzeka MUSI biec przez MINIMUM DWIE ŚCIANKI na każdy heks. UWAGA na liczenie
 * „boków": owner liczy ODCINKI ŚCIANEK po których biegnie rzeka = walked.length (pół-ścianka
 * wejścia + pełne boki róg-róg + pół-ścianka wyjścia); kod trzyma walked.length-1 = same PEŁNE
 * boki róg-róg. MIN_BOKI=1 (walked.length-1 ≥ 1 → walked.length ≥ 2) daje owner-boki ≥ 2:
 *   bieg prosty (krawędzie przeciwległe, diff 3) → walked 3 = 3 ścianki,
 *   łagodny skręt (diff 2)                       → walked 2 = 2 ścianki,
 *   ostry skręt (krawędzie sąsiednie, diff 1)    → już zwinięty przez simplifyRiverRenderPath.
 * Odrzucamy tylko walked.length=1 (clip rogu, 0 pełnych boków = tylko 1 ścianka). NIE żądamy
 * walked.length-1 ≥ 2 (owner-boki ≥ 3): to wymuszało przy łagodnym skręcie overshoot rogu →
 * prostopadły „domek", a przy ostrzejszych — objazd obwodu → ZAMKNIĘTE PĘTLE („plaster miodu").
 * Fallback: najkrótszy łuk w ogóle (degeneracja). hexParity rozstrzyga remis strony deterministycznie.
 */
function riverCornersAlongHexEdges(dirIn: number, dirOut: number, hexParity: number): number[] {
  const a = ((dirIn % 6) + 6) % 6;
  const b = ((dirOut % 6) + 6) % 6;
  if (a === b) return [];
  const entryOpts = [(a + 1) % 6, (a + 2) % 6];
  const exitOpts = [(b + 1) % 6, (b + 2) % 6];
  const MIN_BOKI = 1; // walked.length-1 = pełne boki róg-róg; =1 → hug pełnej ścianki + 2 połówki
                      // ścianek wejścia/wyjścia = wizualnie ≥2 ścianki/heks BEZ „domków". (=2
                      // wymuszało przy łagodnym skręcie overshoot rogu → prostopadły dzióbek.)
  let best: number[] = [];
  let bestScore = Infinity;
  let fallback: number[] = [];
  let fallbackScore = Infinity;
  for (const entry of entryOpts) {
    for (const exit of exitOpts) {
      for (const cw of [true, false]) {
        const walked = walkHexPerimeter(entry, exit, cw);
        if (walked.length === 0) continue;
        let score = walked.length;
        if (score === bestScore && hexParity % 2 === 0) score += cw ? 0 : 0.01;
        else if (score === bestScore) score += cw ? 0.01 : 0;
        if (score < fallbackScore) { fallbackScore = score; fallback = walked; }
        if (walked.length - 1 < MIN_BOKI) continue; // odrzuć „clip rogu" (0 pełnych boków)
        if (score < bestScore) { bestScore = score; best = walked; }
      }
    }
  }
  return best.length ? best : fallback;
}

/** Rogi obwodu heksa (cur) na trasie prev→cur→next, we współrzędnych świata. */
function riverTransitCornersOnHex(
  q: number, r: number, qPrev: number, rPrev: number, qNext: number, rNext: number, R: number,
): Array<{ x: number; z: number }> {
  const dirIn = neighborDirIndex(q, r, qPrev, rPrev);
  const dirOut = neighborDirIndex(q, r, qNext, rNext);
  if (dirIn < 0 || dirOut < 0) return [];
  const wc = axialToWorld(q, r, R);
  const cs = hexCorners(wc.x, wc.z, R);
  return riverCornersAlongHexEdges(dirIn, dirOut, q + r).map((ci) => ({ x: cs[ci]!.x, z: cs[ci]!.z }));
}

/** Wsunięcie rogu łuku ku środkowi WŁASNEGO heksa (hug WEWNĘTRZNEJ strony ścianki —
 *  rzeka widoczna po krawędzi, ale nie ginie pod wzgórzem sąsiada za ścianką). */
const RIVER_INSET_FRAC = 0.15;

/**
 * Regularyzacja ścieżki rzeki POD RENDER (render-only — NIE zmienia generatora ani hasza mapy).
 * Zwija dwa artefakty meandra generatora, które psuły wygląd wstęgi:
 *  - zawrót 180° (H[i-1] == H[i+1]) — „spike tam i z powrotem" → usuwamy H[i] i H[i+1],
 *  - zakręt ≥120° (H[i-1] SĄSIADUJE z H[i+1]) — skrót korytarzem → usuwamy H[i].
 * Po dojściu do punktu stałego zostają WYŁĄCZNIE zakręty ≤60° i proste biegi. Ponieważ wstęga
 * biegnie przez punkty-przejścia = ŚREDNIE środków kolejnych heksów (patrz buildRiverPointsFromHexPath),
 * przy zakrętach ≤60° każdy wierzchołek wstęgi ma odchylenie ≤60°, a ciasny 60°-zygzak (…d,d+1,d,d+1…)
 * uśrednia się do PROSTEJ — stąd znika „schodkowy" wygląd i wymuszona jest kadencja meandra.
 * Pierwszy i ostatni heks są nienaruszalne (źródło / ujście / węzeł konfluencji).
 */
function simplifyRiverRenderPath(
  path: Array<{ q: number; r: number }>,
): Array<{ q: number; r: number }> {
  const p = path.map((h) => ({ q: h.q, r: h.r }));
  if (p.length < 3) return p;
  let changed = true;
  let guard = 0;
  while (changed && guard++ < 4000) {
    changed = false;
    for (let i = 1; i < p.length - 1; i++) {
      const a = p[i - 1]!;
      const c = p[i + 1]!;
      // 180° zawrót: sąsiedzi H[i] to ten sam heks → wytnij oba środkowe (degeneracja).
      if (a.q === c.q && a.r === c.r) { p.splice(i, 2); changed = true; break; }
      // ≥120° zakręt: H[i-1] sąsiaduje bezpośrednio z H[i+1] → skrót, zostaje ≤60°.
      if (neighborDirIndex(a.q, a.r, c.q, c.r) >= 0) { p.splice(i, 1); changed = true; break; }
    }
  }
  return p;
}

/**
 * Wstęga rzeki = polilinia KANCIASTA PO WEWNĘTRZNEJ STRONIE ŚCIANEK heksów (Owner 2026-07-10 —
 * powrót od odrzuconej „centrolinii" prostej i odrzuconego gładkiego CatmullRom/Chaikin; „to nie
 * styl Roblox"). Dla każdego heksa trasy rzeka biegnie jego OBWODEM: środek krawędzi WEJŚCIA →
 * ROGI łuku (najkrótszy po ściankach, ≥2 boki) → środek krawędzi WYJŚCIA.
 *  - ROGI łuku INSETOWANE ku środkowi WŁASNEGO heksa (RIVER_INSET_FRAC) → hug WEWNĘTRZNEJ strony
 *    ścianki: widoczna po krawędzi, ale nie ginie pod wzgórzem sąsiada za ścianką,
 *  - wspólny środek krawędzi = JEDEN punkt bez insetu (granica dwóch heksów RZEKI, obie strony
 *    to koryto) → ZERO „domków" (dawniej exit-ku-cur + entry-ku-next dawały prostopadły dzióbek),
 *  - polilinia SUROWA (kanciasta) renderowana buildRibbonGeometry sharp=true → proste odcinki +
 *    załamania na rogach. BEZ Chaikina, BEZ CatmullRom = zero wygładzania (owner: kanciasto),
 *  - stała PŁASKA wysokość (riverHexSurfaceY) — bez lewitacji góra-dół-góra,
 *  - simplifyRiverRenderPath ścina zawroty 180° / skręty ≥120° → brak pętli heksagonalnych i
 *    (kluczowe dla ≥2 boki) usuwa transity przez sąsiednie krawędzie, które musiałyby objeżdżać
 *    obwód → filtr ≥2 boki nie generuje pętli ani zawrotów.
 * `extendToJoin`: dołóż środek OSTATNIEGO heksa — dla dopływu tip wchodzi w kanał głównej rzeki
 * (konfluencja), dla rzeki głównej wstęga kończy się w środku ostatniego heksa lądu = styk bez
 * luki z łańcuchem przybrzeżnym (buildCoastalRiverPointChain kotwiczy się w tym samym punkcie).
 */
function buildRiverPointsFromHexPath(
  map: GameMap,
  path: Array<{ q: number; r: number }>,
  R: number,
  renderStyle: MapRenderStyle,
  riverMouthY: number,
  surfaceOffset: number,
  _coastalKeys: Set<string>,
  extendToJoin = false,
  /** Zad. 4 (rząd cieku): mnożnik szerokości dla heksa (q,r) tej trasy. Brak → 1 (bez zmian). */
  widthAtHex?: (q: number, r: number) => number,
): { pts: THREE.Vector3[]; hexKeys: Set<string>; widths: number[]; pointHex: string[] } {
  const pts: THREE.Vector3[] = [];
  const widths: number[] = [];
  // Heks per PUNKT (równoległa tablica do pts) — dla mgły per-heks na wstędze. Zad. bramki dedup
  // ta sama co pts/widths, więc pointHex[i] ↔ pts[i] ↔ wierzchołki 2i/2i+1 w buildRibbonGeometry.
  const pointHex: string[] = [];
  const hexKeys = new Set<string>();
  if (path.length < 2) return { pts, hexKeys, widths, pointHex };

  // Fog: pokryj WSZYSTKIE oryginalne heksy trasy (także zwinięte przez simplify).
  for (const h of path) hexKeys.add(`${h.q},${h.r}`);

  const yAt = (q: number, r: number): number | null =>
    riverHexSurfaceY(map, q, r, renderStyle, riverMouthY, surfaceOffset, R);
  const wAt = (q: number, r: number): number => widthAtHex ? widthAtHex(q, r) : 1;

  const rp = simplifyRiverRenderPath(path);
  if (rp.length < 2) return { pts, hexKeys, widths, pointHex };

  // Inset surowego rogu obwodu ku środkowi WŁASNEGO heksa (hug wewnętrznej ścianki).
  const insetToward = (x: number, z: number, hq: number, hr: number): { x: number; z: number } => {
    const c = axialToWorld(hq, hr, R);
    return { x: x + (c.x - x) * RIVER_INSET_FRAC, z: z + (c.z - z) * RIVER_INSET_FRAC };
  };

  // Surowa polilinia PO ŚCIANKACH — jeden punkt na przejście przez ściankę (bez domków), kanciasto.
  // `w` = mnożnik szerokości w tym punkcie (rząd cieku) — równoległa tablica do `pts` (ta sama
  // dedup-brama dystansu, żeby długości pts/widths zawsze się zgadzały).
  const pushPt = (x: number, z: number, y: number, w: number, hexKey: string): void => {
    const p = new THREE.Vector3(x, y, z);
    if (pts.length === 0 || pts[pts.length - 1]!.distanceTo(p) > R * 0.004) {
      pts.push(p);
      widths.push(w);
      pointHex.push(hexKey);
    }
  };

  // Start: środek wspólnej krawędzi hex0|hex1, INSET ku hex1 (na wewnętrznym paśmie, nie na samej
  // ściance) — rzeka „rodzi się" tu, spójnie z rogami łuku (bez nadmiarowego nubu przy źródle).
  {
    const a = rp[0]!;
    const b = rp[1]!;
    const mid0 = sharedEdgeMidpoint(a.q, a.r, b.q, b.r, R);
    const ya = yAt(a.q, a.r);
    const yb = yAt(b.q, b.r);
    if (mid0 && ya != null && yb != null) {
      const p0 = insetToward(mid0.x, mid0.z, b.q, b.r);
      pushPt(p0.x, p0.z, (ya + yb) * 0.5, wAt(b.q, b.r), `${b.q},${b.r}`);
    }
  }

  // Heksy środkowe: TYLKO rogi łuku obwodu (inset ku cur, ≥2 boki). ŚRODKÓW KRAWĘDZI PRZEJŚCIA
  // NIE dodajemy — to one były źródłem „domków": nieinsetowany środek ścianki między dwoma
  // insetowanymi rogami dawał prostopadły dzióbek (out-and-back do połowy ścianki), który Chaikin
  // wcześniej wygładzał. Bez Chaikina rogi sąsiednich heksów łączą się WPROST przez wspólną
  // ściankę — czysty odcinek po wewnętrznej stronie krawędzi, ZERO dzióbków, kanciasto.
  for (let i = 1; i < rp.length - 1; i++) {
    const prev = rp[i - 1]!;
    const cur = rp[i]!;
    const next = rp[i + 1]!;
    if (neighborDirIndex(prev.q, prev.r, cur.q, cur.r) < 0) continue;
    if (neighborDirIndex(cur.q, cur.r, next.q, next.r) < 0) continue;
    const yc = yAt(cur.q, cur.r);
    if (yc == null) continue;

    const wc = wAt(cur.q, cur.r);
    for (const corner of riverTransitCornersOnHex(
      cur.q, cur.r, prev.q, prev.r, next.q, next.r, R,
    )) {
      const pc = insetToward(corner.x, corner.z, cur.q, cur.r);
      pushPt(pc.x, pc.z, yc, wc, `${cur.q},${cur.r}`);
    }
  }

  // Dopływ / ujście: dołóż środek OSTATNIEGO heksa. Dopływ → tip wchodzi w kanał głównej rzeki
  // (czyste scalenie w konfluencji). Rzeka główna dochodząca do morza → koniec wstęgi lądowej
  // ląduje w środku ostatniego heksa lądu = punkt STYKU z łańcuchem przybrzeżnym (bez luki).
  if (extendToJoin && rp.length >= 2) {
    const last = rp[rp.length - 1]!;
    const yl = yAt(last.q, last.r);
    if (yl != null) {
      const cl = axialToWorld(last.q, last.r, R);
      pushPt(cl.x, cl.z, yl, wAt(last.q, last.r), `${last.q},${last.r}`);
    }
  }

  return { pts, hexKeys, widths, pointHex };
}

/** Jedna ciągła wstęga na trasę riverPaths — rogi i środki krawędzi (NIE przez środek heksa).
 * hex.rzeka.krawedzie zostaje dla logiki gry; render idzie po pełnej ścieżce.
 */
function renderLandRiversFromPaths(
  map: GameMap,
  paths: Array<Array<{ q: number; r: number }>>,
  kinds: Array<'main' | 'tributary' | undefined>,
  R: number,
  renderStyle: MapRenderStyle,
  riverMouthY: number,
  surfaceOffset: number,
  mainHalfWidth: number,
  scene: THREE.Scene,
  riverEntries: RiverEntry[],
  riverMat: THREE.Material,
  renderOrder: number,
): Set<string> {
  const landHexKeys = new Set<string>();

  for (let pi = 0; pi < paths.length; pi++) {
    const path = paths[pi]!;
    if (path.length < 2) continue;
    const landPath = landRiverRenderPath(map.hexes, path);
    if (landPath.length < 2) continue;

    const kind = kinds[pi] ?? 'main';
    const landLen = landPath.length;
    let widthMul = kind === 'main'
      ? Math.min(1.35, 0.85 + landLen * 0.008)
      : landLen < 10
        ? 0.4
        : landLen < 18
          ? 0.55
          : 0.7;
    const halfWidth = mainHalfWidth * widthMul;

    // extendToJoin: dopływ scala się w węźle głównej rzeki; rzeka główna dochodząca do morza
    // kończy wstęgę w środku ostatniego heksa lądu = styk z łańcuchem przybrzeżnym (bez luki).
    const reachesSea = pathReachesOpenSeaRender(map, path);
    const { pts, hexKeys, pointHex } = buildRiverPointsFromHexPath(
      map, landPath, R, renderStyle, riverMouthY, surfaceOffset, new Set<string>(),
      kind === 'tributary' || reachesSea,
    );
    if (pts.length < 2) continue;

    // Jedna trasa = jeden wpis fog (nie scalać wszystkich rzek mapy w jeden mesh).
    const pathBucket: RiverGeoBucket = {
      mat: riverMat, geos: [], hexKeys: new Set(), renderOrder,
    };
    // sharp=true → KANCIASTA wstęga po ściankach (proste odcinki + załamania na rogach), ZERO
    // wygładzania (owner: „to nie styl Roblox" o krzywych). Punkty to już polilinia po obwodzie.
    pushRiverMesh(pathBucket, pts, hexKeys, halfWidth, 8, true);
    flushRiverBucket(scene, pathBucket, riverEntries, pointHex);
    for (const k of hexKeys) landHexKeys.add(k);
  }
  return landHexKeys;
}

function queueRiverGeo(
  bucket: RiverGeoBucket,
  geo: THREE.BufferGeometry,
  hexKeys: Set<string>,
): void {
  bucket.geos.push(geo);
  for (const k of hexKeys) bucket.hexKeys.add(k);
}

function flushRiverBucket(
  scene: THREE.Scene,
  bucket: RiverGeoBucket,
  riverEntries: RiverEntry[],
  /** Heks per punkt wstęgi (mgła per-heks). Tylko dla pojedynczej geo (jedna trasa, bez merge). */
  pointHex?: string[],
): void {
  if (bucket.geos.length === 0) return;
  const merged = bucket.geos.length === 1
    ? bucket.geos[0]!
    : mergeGeometries(bucket.geos);
  if (!merged) return;
  const mesh = new THREE.Mesh(merged, bucket.mat);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.renderOrder = bucket.renderOrder;
  scene.add(mesh);
  riverEntries.push({
    waterMesh: mesh,
    bankMesh: mesh,
    waterGeo: merged,
    bankGeo: merged,
    hexKeys: bucket.hexKeys,
    merged: bucket.geos.length > 1,
    // Per-heks fog tylko dla jednowstęgowej geo (merge przesuwa offsety wierzchołków → niepewne).
    pointHex: bucket.geos.length === 1 ? pointHex : undefined,
  });
  if (bucket.geos.length > 1) {
    for (const g of bucket.geos) g.dispose();
  }
}

function pushRiverMesh(
  bucket: RiverGeoBucket,
  pts: THREE.Vector3[],
  hexKeys: Set<string>,
  halfWidth: number | number[],
  segmentsPerSpan = 16,
  sharp = true,
): void {
  if (pts.length < 2) return;
  const geo = buildRibbonGeometry(pts, halfWidth, segmentsPerSpan, sharp);
  queueRiverGeo(bucket, geo, hexKeys);
}

// ---------------------------------------------------------------------------
// Pomiar czasu ostatniego pełnego przebiegu setFog (A4/A5 — overlay F9).
// Modułowy, bo naraz aktywna jest tylko jedna scena; getter czyta ostatni pomiar
// z bieżącej sceny bez rozszerzania kontraktu SceneResult / wpięć w main.ts.
// ---------------------------------------------------------------------------
let lastSetFogMs = 0;
/** Czas ostatniego pełnego przebiegu setFog w ms (aktywna scena). Overlay F9. */
export function getLastSetFogMs(): number {
  return lastSetFogMs;
}

// ---------------------------------------------------------------------------
// C3 — chunked scene build (DYSPOZYCJA-WYDAJNOSC C3).
// Budowa sceny (główna pętla po heksach) rozbita na porcje (chunki) z oddaniem
// klatki między nimi, żeby na wielkich mapach ("Super Huge") główny wątek nie
// blokował się na sekundy ("strona nie odpowiada"). C3 to WYŁĄCZNIE zmiana
// harmonogramu: TA SAMA praca (te same meshe/materiały/macierze/InstancedMesh),
// tylko rozłożona na kilka klatek. Zero zmian wizualnych/gameplay; PRNG nietknięty.
// Marker do grepowania zbudowanego bundla: 'civ-scene-chunked-c3'.
// ---------------------------------------------------------------------------
const C3_MARKER = 'civ-scene-chunked-c3';
/** Budżet czasu na jedną porcję głównej pętli (ms) — po przekroczeniu oddaj klatkę. */
const C3_CHUNK_TIME_BUDGET_MS = 14;
/** Twardy limit heksów na porcję (bezpiecznik gdy zegar jest gruby/zamrożony). */
const C3_CHUNK_MAX_HEXES = 4000;

/** Oddaj jedną klatkę (rAF) — pozwala przeglądarce odświeżyć overlay i nie zawiesić się. */
function c3NextFrame(): Promise<void> {
  return new Promise<void>((r) => requestAnimationFrame(() => r()));
}

/** Callback postępu budowy sceny (C3). pct = 0..100 (procent porcji zrobionych). */
export type SceneBuildProgress = (pct: number) => void;

/**
 * B (cięcie geometrii): hex-graniastosłup BEZ dolnej pokrywy. Spód heksa nigdy nie jest
 * widoczny (kamera z góry), a dolna pokrywa to 6 z 24 trójkątów → ~25% mniej trójkątów
 * bazowych heksów, PIXEL-IDENTYCZNIE. Zostawiamy boki (relief przy klifach) + górną pokrywę.
 */
function hexPrismNoBottomGeo(radius: number, height: number, radial = 6): THREE.CylinderGeometry {
  const g = new THREE.CylinderGeometry(radius, radius, height, radial, 1);
  const idx = g.getIndex();
  if (idx) {
    // Grupy CylinderGeometry: 0=boki, 1=górna pokrywa, 2=DOLNA pokrywa (ostatnia w indeksie).
    const bottom = g.groups.find((gr) => gr.materialIndex === 2);
    if (bottom) {
      const arr = idx.array as Uint16Array | Uint32Array;
      const kept = arr.slice(0, bottom.start); // boki + góra, bez dolnej pokrywy
      g.setIndex(new THREE.BufferAttribute(kept, 1));
      g.clearGroups();
    }
  }
  return g;
}

export async function buildScene(
  map: GameMap,
  canvas: HTMLCanvasElement,
  styleOrOptions?: MapRenderStyle | MapRenderOptions,
  onProgress?: SceneBuildProgress,
): Promise<SceneResult> {
  // Odwołanie do markera C3, żeby nie został wycięty przez tree-shaking (integrator
  // grepuje ten literał w zbudowanym bundlu). Nie zmienia zachowania.
  void C3_MARKER;
  if (typeof globalThis !== "undefined") { (globalThis as any).__CIV_MARKERS = "civ-scene-chunked-c3|civ-culling-b06|civ-zoom-lod-a1a4"; }
  const CIV_CULLING_B06 = 'civ-culling-b06'; void CIV_CULLING_B06;
  const renderOptions = normalizeMapRenderOptions(styleOrOptions);
  const renderStyle = renderOptions.style;
  const hexCount = Object.keys(map.hexes).length;
  // Eksperyment B (heks bez dolnej pokrywy, ~25% mniej tri bazowych). Domyślnie WŁĄCZONE.
  // Przełącznik pomiarowy: ?nobottom=0 → pełny pryzm (z dolną pokrywą) do porównania F9.
  const B_NO_BOTTOM =
    (typeof location !== 'undefined'
      ? new URLSearchParams(location.search).get('nobottom')
      : null) !== '0';
  const preset = resolveRenderPreset(renderOptions, hexCount);
  const robloxLite = preset.robloxLite;
  // GRAFIKA-3D: jakość dekoracji ulepszeń (stadnina 1/2 konie itp.) wg ustawienia gracza.
  setImprovementDetailQuality(renderOptions.mapDetailQuality);
  const palette = styleScenePalette(renderStyle);
  const useStyledDecor = renderStyle !== 'civ';
  const styledOverlays: Array<{ group: THREE.Group; hexKey: string }> = [];
  const R = HEX_R;
  const vpW = renderOptions.previewViewport?.width ?? window.innerWidth;
  const vpH = renderOptions.previewViewport?.height ?? window.innerHeight;
  const fixedViewport = renderOptions.previewViewport != null;
  const panelCols = Math.max(1, renderOptions.previewViewport?.panelColumns ?? 1);
  const camAspect = (vpW / panelCols) / vpH;

  // -- Renderer (jakość GPU z kreatora / menu)
  const ownRenderer = renderOptions.sharedRenderer == null;
  const renderer = renderOptions.sharedRenderer
    ?? new THREE.WebGLRenderer({ canvas, antialias: preset.antialias, powerPreference: 'high-performance' });
  if (ownRenderer) {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, preset.pixelRatioMax));
    renderer.setSize(vpW, vpH);
  }
  if (renderStyle === 'civ') {
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
  }
  renderer.shadowMap.enabled = preset.shadowsEnabled;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  // FPS: cienie na żądanie. Shadow pass ≈ drugi przebieg CAŁEJ geometrii co klatkę, a przy
  // panie/idle kamery cienie się NIE zmieniają (są w world-space). Wyłączamy auto-render shadow
  // mapy — Three.js rysuje ją tylko gdy needsUpdate=true i konsumuje flagę po renderze. Flagę
  // podnosimy przy realnej zmianie casterów: setFog (odsłonięcie/ukrycie terenu), applyZoomGpuSettings
  // (LOD), spawn ulepszeń, oraz per-klatkę animacji ruchu (pętla main.ts). Pierwszy render: true.
  if (renderer.shadowMap.enabled) {
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;
  }

  // -- Scena + tlo
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(palette.sky);
  if (palette.fogExp !== undefined) {
    scene.fog = new THREE.FogExp2(palette.fogColor, palette.fogExp);
  } else {
    const fogNear = palette.fogNear ?? 40;
    const fogFar = (palette.fogFar ?? 200) * preset.fogFarMul;
    scene.fog = new THREE.Fog(palette.fogColor, fogNear, fogFar);
  }

  // -- Swiatla
  const hemi = new THREE.HemisphereLight(
    renderStyle === 'roblox' ? 0xffffff : 0xd4eaff,
    renderStyle === 'roblox' ? 0x88cc88 : 0x5a5040,
    renderStyle === 'roblox' ? 1.05 : 0.9,
  );
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(renderStyle === 'roblox' ? 0xfffef0 : 0xfff0cc, renderStyle === 'roblox' ? 1.25 : 1.4);
  sun.position.set(60, 100, 40);
  sun.castShadow = preset.shadowsEnabled;
  if (preset.shadowsEnabled) {
    sun.shadow.mapSize.set(preset.shadowMapSize, preset.shadowMapSize);
  }
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far  = 500;
  const sc = renderStyle === 'roblox'
    ? Math.max(70, Math.max(map.szerokoscQ, map.wysokoscR) * R * 0.55)
    : 60;
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
  // CylinderGeometry(6) jest juz pointy-top -- bez rotacji.

  // Zlicz ilosc per teren i nakladke
  // GRAFIKA-3D partia TEREN stage 2: w stylu roblox góry/wzgórza renderujemy jako
  // 10 InstancedMesh (5 wariantów gór + 5 wzgórz) zamiast per-heks styledOverlays.
  const NW = LICZBA_WARIANTOW_TERENU;
  const styledTerrain = useStyledDecor && renderStyle === 'roblox';
  const countByTerrain: Partial<Record<TerenBazowy, number>> = {};
  let forestCount = 0;
  let mountainSnowCount = 0;
  let hillCount = 0;
  let desertCount = 0;
  const goraVarCount: number[] = new Array(NW).fill(0);
  const wzgorzeVarCount: number[] = new Array(NW).fill(0);
  // GRAFIKA-TEREN-2: kępy lasu (5 wariantów) — pre-count wariantów do alokacji InstancedMesh (jak góry/wzgórza).
  const NL = LICZBA_WARIANTOW_LASU;
  // NATURALNY las = warianty 0..3 (BEZ L4 „przetrzebionego": pieńki+kłoda). L4 zarezerwowany na
  // dynamiczny wyrąb (hexClearingStates) — na starcie las ma być PEŁNY, nie wyglądać na wyrąbany.
  const NL_NATURAL = 4;
  const lasVarCount: number[] = new Array(NL).fill(0);
  // DEKOR: mikrodekor łąk/równin — pre-count wariantów (jak goraVarCount) do alokacji InstancedMesh.
  const dekorLakaVarCount: number[] = new Array(DEKOR_LICZBA_WARIANTOW).fill(0);
  const dekorRowninaVarCount: number[] = new Array(DEKOR_LICZBA_WARIANTOW).fill(0);

  for (const hex of Object.values(map.hexes)) {
    const t = hex.terenBazowy;
    countByTerrain[t] = (countByTerrain[t] ?? 0) + 1;
    if (hex.nakladka === Nakladka.Las) {
      forestCount++;
      // Kępa lasu instancjonowana tylko dla stylu roblox POZA strefą tropikalną (dżungla = stara ścieżka).
      if (styledTerrain && t !== TerenBazowy.Morze && t !== TerenBazowy.Wybrzeze
          && !isWarmJungleForestHex(hex.coords.q, hex.coords.r, map.wysokoscR)) {
        lasVarCount[wariantLasuDlaHeksa(hex.coords.q, hex.coords.r, NL_NATURAL, map.seed)]!++;
      }
    }
    if (t === TerenBazowy.Gory) {
      mountainSnowCount++;
      if (styledTerrain) goraVarCount[wariantDlaHeksa(hex.coords.q, hex.coords.r, NW, map.seed)]!++;
    }
    if (t === TerenBazowy.Wzgorza) {
      hillCount++;
      if (styledTerrain) wzgorzeVarCount[wariantDlaHeksa(hex.coords.q, hex.coords.r, NW, map.seed)]!++;
    }
    if (t === TerenBazowy.Pustynia) desertCount++;
    // DEKOR: policz warianty mikrodekoru na heksach łąki/równiny (styl roblox; ~45% pustych).
    if (styledTerrain && (t === TerenBazowy.Laka || t === TerenBazowy.Rownina)) {
      const dw = dekorDlaHeksa(hex.coords.q, hex.coords.r, map.seed);
      if (dw !== null) {
        if (t === TerenBazowy.Laka) dekorLakaVarCount[dw]!++;
        else dekorRowninaVarCount[dw]!++;
      }
    }
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
    const vis = terrainVis(t, renderStyle);
    // Roblox: lekki overlap zamyka trójkątne szczeliny między heksami (prześwit tafli oceanu).
    const hexR = renderStyle === 'roblox' ? R * 1.008 : R * 0.998;
    const geo = B_NO_BOTTOM
      ? hexPrismNoBottomGeo(hexR, vis.height)
      : new THREE.CylinderGeometry(hexR, hexR, vis.height, 6, 1); // ?nobottom=0: pełny pryzm (pomiar B)
    // Brak rotateY -- CylinderGeometry(6) jest juz pointy-top jak axialToWorld.
    const mat = new THREE.MeshLambertMaterial({
      color: styleTerrainColor(t, renderStyle),
      flatShading: palette.flatShading,
    });
    terrainMaterials[t] = mat;
    const mesh = new THREE.InstancedMesh(geo, mat, cnt);
    mesh.frustumCulled = false;
    mesh.castShadow    = true;
    mesh.receiveShadow = true;
    instancedMeshes.push(mesh);
    scene.add(mesh);
    terrainIndex[t] = instancedMeshes.length - 1;
  }

  const terrainInstanceIdx: Partial<Record<TerenBazowy, number>> = {};
  for (const t of terrainTypes) terrainInstanceIdx[t] = 0;

  // -- Las -- InstancedMesh stozkow (korony) + cienkie pnie (trunks) [tylko styl Civ]
  const maxTrees = forestCount * MAX_TREES_PER_FOREST;
  const forestConeGeo = useStyledDecor ? new THREE.ConeGeometry(1, 1, 3) : new THREE.ConeGeometry(R * 0.17, R * 0.50, 6);
  const forestConeMat = new THREE.MeshLambertMaterial({ color: FOREST_CONE_COLOR });
  const forestMesh = new THREE.InstancedMesh(forestConeGeo, forestConeMat, useStyledDecor ? 0 : maxTrees);
  forestMesh.frustumCulled = false;
  forestMesh.castShadow = true;
  forestMesh.receiveShadow = true;
  if (!useStyledDecor) scene.add(forestMesh);

  // Pnie drzew lasu -- krotkie, ciemne walce pod koronami
  const forestTrunkGeo = useStyledDecor ? new THREE.CylinderGeometry(1, 1, 1, 3) : new THREE.CylinderGeometry(R * 0.035, R * 0.05, R * 0.18, 5);
  const forestTrunkMat = new THREE.MeshLambertMaterial({ color: FOREST_TRUNK_COLOR });
  const forestTrunkMesh = new THREE.InstancedMesh(forestTrunkGeo, forestTrunkMat, useStyledDecor ? 0 : maxTrees);
  forestTrunkMesh.frustumCulled = false;
  forestTrunkMesh.castShadow = true;
  if (!useStyledDecor) scene.add(forestTrunkMesh);

  // -- Snieg na gorach
  const snowGeo = useStyledDecor ? new THREE.ConeGeometry(1, 1, 3) : new THREE.ConeGeometry(R * 0.42, R * 0.45, 6);
  // Brak rotateY -- snieg jest maly, orientacja bez znaczenia, ale spojnosc.
  const snowMat = new THREE.MeshLambertMaterial({ color: SNOW_COLOR });
  const snowMesh = new THREE.InstancedMesh(snowGeo, snowMat, useStyledDecor ? 0 : mountainSnowCount);
  snowMesh.frustumCulled = false;
  snowMesh.castShadow = true;
  if (!useStyledDecor) scene.add(snowMesh);

  // -- Krzewy na wzgorzach -- male stozki (mniejsze niz las)
  const shrubConeGeo = useStyledDecor ? new THREE.ConeGeometry(1, 1, 3) : new THREE.ConeGeometry(R * 0.13, R * 0.38, 6);
  const shrubConeMat = new THREE.MeshLambertMaterial({ color: SHRUB_COLOR });
  const shrubMesh = new THREE.InstancedMesh(shrubConeGeo, shrubConeMat, useStyledDecor ? 0 : hillCount * MAX_SHRUBS_PER_HILL);
  shrubMesh.frustumCulled = false;
  shrubMesh.castShadow = true;
  if (!useStyledDecor) scene.add(shrubMesh);

  // -- Dekoracyjny szczyt skalny na gorach
  const peakGeo = useStyledDecor ? new THREE.ConeGeometry(1, 1, 3) : new THREE.ConeGeometry(R * 0.55, R * 0.85, 6);
  const peakMat = new THREE.MeshLambertMaterial({ color: PEAK_ROCK_COLOR, flatShading: true });
  const peakMesh = new THREE.InstancedMesh(peakGeo, peakMat, useStyledDecor ? 0 : mountainSnowCount);
  peakMesh.frustumCulled = false;
  peakMesh.castShadow = true;
  peakMesh.receiveShadow = true;
  if (!useStyledDecor) scene.add(peakMesh);

  // -- Trawiasty kopiec na wzgorzach
  const hillBumpGeo = useStyledDecor ? new THREE.SphereGeometry(1, 4, 3) : new THREE.SphereGeometry(R * 0.62, 8, 5, 0, Math.PI * 2, 0, Math.PI * 0.5);
  const hillBumpMat = new THREE.MeshLambertMaterial({ color: HILL_GRASS_COLOR, flatShading: true });
  const hillBumpMesh = new THREE.InstancedMesh(hillBumpGeo, hillBumpMat, useStyledDecor ? 0 : hillCount);
  hillBumpMesh.frustumCulled = false;
  hillBumpMesh.castShadow = true;
  hillBumpMesh.receiveShadow = true;
  if (!useStyledDecor) scene.add(hillBumpMesh);

  // GRAFIKA-3D partia TEREN stage 2: 10 InstancedMesh (5 gora + 5 wzgorze wariantów),
  // wspólny TEREN_MATERIAL (vertexColors), frustumCulled=false jak peak/hillBump.
  // Fog: matrix-hide (nieodkryte/miasto) + instanceColor-dim (explored) — patrz applyTerrainFog.
  const goraInst: THREE.InstancedMesh[] = [];
  const wzgorzeInst: THREE.InstancedMesh[] = [];
  const goraHexKey: string[][] = [];
  const goraOrigMatrix: THREE.Matrix4[][] = [];
  const goraIdx: number[] = [];
  const wzgorzeHexKey: string[][] = [];
  const wzgorzeOrigMatrix: THREE.Matrix4[][] = [];
  const wzgorzeIdx: number[] = [];
  if (styledTerrain) {
    for (let v = 0; v < NW; v++) {
      const gm = new THREE.InstancedMesh(goraGeometria(v), TEREN_MATERIAL, Math.max(1, goraVarCount[v]!));
      gm.frustumCulled = false; gm.castShadow = true; gm.receiveShadow = true; gm.count = 0;
      scene.add(gm);
      goraInst.push(gm); goraHexKey.push([]); goraOrigMatrix.push([]); goraIdx.push(0);
      const wm = new THREE.InstancedMesh(wzgorzeGeometria(v), TEREN_MATERIAL, Math.max(1, wzgorzeVarCount[v]!));
      wm.frustumCulled = false; wm.castShadow = true; wm.receiveShadow = true; wm.count = 0;
      scene.add(wm);
      wzgorzeInst.push(wm); wzgorzeHexKey.push([]); wzgorzeOrigMatrix.push([]); wzgorzeIdx.push(0);
    }
  }

  // GRAFIKA-TEREN-2: 5 InstancedMesh kęp lasu (poza dżunglą tropikalną) — wspólny LAS_MATERIAL
  // (vertexColors, flatShading). Wzorzec gór/wzgórz: fog = matrix-hide + instanceColor-dim.
  const lasInst: THREE.InstancedMesh[] = [];
  const lasHexKey: string[][] = [];
  const lasOrigMatrix: THREE.Matrix4[][] = [];
  const lasIdx: number[] = [];
  if (styledTerrain) {
    for (let v = 0; v < NL; v++) {
      const lm = new THREE.InstancedMesh(lasGeometria(v), LAS_MATERIAL, Math.max(1, lasVarCount[v]!));
      lm.frustumCulled = false; lm.castShadow = true; lm.receiveShadow = true; lm.count = 0;
      scene.add(lm);
      lasInst.push(lm); lasHexKey.push([]); lasOrigMatrix.push([]); lasIdx.push(0);
    }
  }

  // DEKOR mikrodekor łąk/równin (MASTER [14:00] pkt 2): 4+4 InstancedMesh w JEDNEJ grupie
  // = 8 draw calli na całą mapę. Wzorzec jak góry/wzgórza; castShadow OFF (mikrodetal, cień nic
  // nie wnosi a kosztuje pass); matrixAutoUpdate zamrażany globalnym traverse na końcu buildScene.
  // LOD: dekorGroup.visible = terrainDetailInst (poziomy 0-1). Fog: applyTerrainFog (wspólny materiał).
  // DEKOR WYŁĄCZONY (Maciej 2026-07-09): ozdobniki pustych heksów rozmywały czytelność
  // (nie było wiadomo co surowiec/ulepszenie/ozdoba). Zastąpione wariantem 3 odcieni koloru
  // terenu (patrz baseColor niżej). Kod dekoru zostaje za flagą — łatwy powrót gdyby trzeba.
  const DEKOR_ENABLED = false;
  const dekorGroup = new THREE.Group();
  const dekorLakaInst: THREE.InstancedMesh[] = [];
  const dekorLakaHexKey: string[][] = [];
  const dekorLakaOrig: THREE.Matrix4[][] = [];
  const dekorLakaIdx: number[] = [];
  const dekorRowninaInst: THREE.InstancedMesh[] = [];
  const dekorRowninaHexKey: string[][] = [];
  const dekorRowninaOrig: THREE.Matrix4[][] = [];
  const dekorRowninaIdx: number[] = [];
  // FPS fog: hexKey → instancja dekoru, żeby mgła aktualizowała dekor DIFFEM (tylko zmienione
  // heksy w setFog), a nie pełnym skanem ~80–150k instancji co wywołanie (regresja 1,9→139 ms).
  const dekorRefByHex = new Map<string, { mesh: THREE.InstancedMesh; index: number; orig: THREE.Matrix4 }>();
  if (styledTerrain && DEKOR_ENABLED) {
    for (let w = 0; w < DEKOR_LICZBA_WARIANTOW; w++) {
      const lm = new THREE.InstancedMesh(dekorLakaGeometria(w), DEKOR_MATERIAL, Math.max(1, dekorLakaVarCount[w]!));
      lm.frustumCulled = false; lm.castShadow = false; lm.receiveShadow = true; lm.count = 0;
      dekorGroup.add(lm);
      dekorLakaInst.push(lm); dekorLakaHexKey.push([]); dekorLakaOrig.push([]); dekorLakaIdx.push(0);
      const rm = new THREE.InstancedMesh(dekorRowninaGeometria(w), DEKOR_MATERIAL, Math.max(1, dekorRowninaVarCount[w]!));
      rm.frustumCulled = false; rm.castShadow = false; rm.receiveShadow = true; rm.count = 0;
      dekorGroup.add(rm);
      dekorRowninaInst.push(rm); dekorRowninaHexKey.push([]); dekorRowninaOrig.push([]); dekorRowninaIdx.push(0);
    }
    scene.add(dekorGroup);
  }

  // -- Piaszczysty pierscien wybrzeza
  const coastCount = countByTerrain[TerenBazowy.Wybrzeze] ?? 0;
  const beachGeo = useStyledDecor ? new THREE.CylinderGeometry(1, 1, 1, 3) : new THREE.CylinderGeometry(R * 0.92, R * 0.96, R * 0.03, 6);
  const beachMat = new THREE.MeshLambertMaterial({ color: BEACH_SAND_COLOR });
  const beachMesh = new THREE.InstancedMesh(beachGeo, beachMat, useStyledDecor ? 0 : coastCount);
  beachMesh.frustumCulled = false;
  beachMesh.receiveShadow = true;
  if (!useStyledDecor) scene.add(beachMesh);

  // -- Wydmy pustynne
  const duneGeo = useStyledDecor ? new THREE.SphereGeometry(1, 4, 3) : new THREE.SphereGeometry(R * 0.5, 7, 4, 0, Math.PI * 2, 0, Math.PI * 0.5);
  const duneMat = new THREE.MeshLambertMaterial({ color: DUNE_SAND_COLOR, flatShading: true });
  const duneMesh = new THREE.InstancedMesh(duneGeo, duneMat, useStyledDecor ? 0 : desertCount);
  duneMesh.frustumCulled = false;
  duneMesh.castShadow = true;
  duneMesh.receiveShadow = true;
  if (!useStyledDecor) scene.add(duneMesh);

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

  const oasisPoolMesh  = new THREE.InstancedMesh(oasisPoolGeo,  oasisPoolMat,  useStyledDecor ? 0 : maxOasis);
  oasisPoolMesh.frustumCulled = false;
  const oasisTrunkMesh = new THREE.InstancedMesh(oasisTrunkGeo, oasisTrunkMat, useStyledDecor ? 0 : maxOasisTrunk);
  oasisTrunkMesh.frustumCulled = false;
  const oasisFrondMesh = new THREE.InstancedMesh(oasisFrondGeo, oasisFrondMat, useStyledDecor ? 0 : maxOasisFrond);
  oasisFrondMesh.frustumCulled = false;
  oasisPoolMesh.castShadow  = false;  oasisPoolMesh.receiveShadow  = true;
  oasisTrunkMesh.castShadow = true;   oasisTrunkMesh.receiveShadow = false;
  oasisFrondMesh.castShadow = true;   oasisFrondMesh.receiveShadow = false;
  if (!useStyledDecor) {
    scene.add(oasisPoolMesh);
    scene.add(oasisTrunkMesh);
    scene.add(oasisFrondMesh);
  }

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

  // Materiał wody rzeki — nieprzezroczysty, nad terenem (polygonOffset vs z-fighting).
  const riverWaterMat = new THREE.MeshLambertMaterial({
    color: palette.river,
    emissive: renderStyle === 'roblox' ? 0x2288dd : 0x1a7fd4,
    emissiveIntensity: 0.65,
    side: THREE.DoubleSide,
    depthWrite: true,
    polygonOffset: true,
    polygonOffsetFactor: 2,
    polygonOffsetUnits: 2,
  });

  const riverBankMat = new THREE.MeshLambertMaterial({
    color: palette.riverBank,
    side: THREE.DoubleSide,
  });

  const coastDeltaMat = new THREE.MeshLambertMaterial({
    color: styleTerrainColor(TerenBazowy.Wybrzeze, renderStyle),
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
  const hexOrigMatrix = new Map<string, THREE.Matrix4>();
  const hexTeren = new Map<string, TerenBazowy>();

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

  const seaVisEarly = terrainVis(TerenBazowy.Morze, renderStyle);
  const seaSurfaceY = seaVisEarly.height + seaVisEarly.yOffset;
  const deltaHexKeys = renderStyle === 'roblox' ? computeRiverDeltaHexKeys(map) : new Set<string>();

  // C3 — główna pętla po heksach rozbita na porcje (chunki). Materializujemy listę
  // heksów RAZ i iterujemy po indeksie, żeby zachować DOKŁADNIE tę samą kolejność co
  // wcześniejsze `for..of Object.values(map.hexes)` (kluczowe dla stanu LCG `rnd()`
  // oazy i byte-for-byte identycznego wyniku). Po każdej porcji oddajemy klatkę
  // (c3NextFrame) i raportujemy postęp do overlaya „Budowanie sceny… N%".
  const c3Hexes = Object.values(map.hexes);
  const c3Total = c3Hexes.length;
  onProgress?.(0);
  let c3ChunkStart = performance.now();
  let c3ChunkCount = 0;
  for (let c3i = 0; c3i < c3Total; c3i++) {
    const hex = c3Hexes[c3i]!;
    const t   = hex.terenBazowy;
    const vis = terrainVis(t, renderStyle);
    const { x, z } = axialToWorld(hex.coords.q, hex.coords.r, R);
    // Morze / Wybrzeże (roblox): płaska tafla na wspólnym poziomie seaSurfaceY.
    let y = vis.height / 2 + vis.yOffset;
    let scaleY = 1;
    if (renderStyle === 'roblox' && t === TerenBazowy.Morze) {
      y = seaSurfaceY - vis.height / 2;
    } else if (renderStyle === 'roblox' && t === TerenBazowy.Wybrzeze) {
      const wyTop = vis.height + vis.yOffset;
      y = wyTop - vis.height / 2;
    }
    const hexKey = `${hex.coords.q},${hex.coords.r}`;

    // DEKOR: mikrodekor pustego heksa łąki/równiny (styl roblox). Obecność/wariant/rotacja
    // deterministyczne z hash(map.seed) — generator NIETKNIĘTY. Spód modelu = wierzch pryzmu.
    if (styledTerrain && DEKOR_ENABLED && (t === TerenBazowy.Laka || t === TerenBazowy.Rownina)) {
      const dw = dekorDlaHeksa(hex.coords.q, hex.coords.r, map.seed);
      if (dw !== null) {
        const dTopY = vis.height + vis.yOffset;
        dummy.position.set(x, dTopY, z);
        dummy.rotation.set(0, rotacjaDekoru(hex.coords.q, hex.coords.r, map.seed), 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        const dOrig = dummy.matrix.clone();
        if (t === TerenBazowy.Laka) {
          const di = dekorLakaIdx[dw]!;
          dekorLakaInst[dw]!.setMatrixAt(di, dummy.matrix);
          dekorLakaHexKey[dw]![di] = hexKey;
          dekorLakaOrig[dw]![di] = dOrig;
          dekorRefByHex.set(hexKey, { mesh: dekorLakaInst[dw]!, index: di, orig: dOrig });
          dekorLakaIdx[dw] = di + 1;
        } else {
          const di = dekorRowninaIdx[dw]!;
          dekorRowninaInst[dw]!.setMatrixAt(di, dummy.matrix);
          dekorRowninaHexKey[dw]![di] = hexKey;
          dekorRowninaOrig[dw]![di] = dOrig;
          dekorRefByHex.set(hexKey, { mesh: dekorRowninaInst[dw]!, index: di, orig: dOrig });
          dekorRowninaIdx[dw] = di + 1;
        }
      }
    }

    // Hex prism
    const meshIdx = terrainIndex[t];
    const iIdx    = terrainInstanceIdx[t] ?? 0;
    if (meshIdx !== undefined) {
      const mesh = instancedMeshes[meshIdx]!;
      dummy.position.set(x, y, z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, scaleY, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(iIdx, dummy.matrix);
      hexOrigMatrix.set(hexKey, dummy.matrix.clone());
      hexTeren.set(hexKey, t);

      // Inicjalizuj kolor instancji: kolor bazowy terenu + deterministyczny jitter HSL.
      // Wybrzeże roblox: jednolity #82C8E0 (D-COAST-2 — bez blendu z lądem / ciemnej obwódki).
      const isCoastRoblox = t === TerenBazowy.Wybrzeze && renderStyle === 'roblox';
      const isWater = t === TerenBazowy.Morze
        || isCoastRoblox
        || (t === TerenBazowy.Wybrzeze && renderStyle !== 'roblox');
      const baseTerrainHex = styleTerrainColor(t, renderStyle);
      const blendedHex = isCoastRoblox
        ? baseTerrainHex
        : blendedTerrainHex(map, hex.coords.q, hex.coords.r, baseTerrainHex, isWater, renderStyle, t);
      // Łąka/Równina (styl roblox): 5 dyskretnych odcieni zamiast ozdobników. Inne tereny: jitter HSL.
      const shades = styledTerrain
        ? (t === TerenBazowy.Laka ? LAKA_SHADES : t === TerenBazowy.Rownina ? ROWNINA_SHADES : null)
        : null;
      const baseColor = isCoastRoblox
        ? new THREE.Color(baseTerrainHex)
        : shades !== null
          ? new THREE.Color(shades[Math.floor(hash2D(hex.coords.q, hex.coords.r, map.seed, 4242) * shades.length) % shades.length]!)
          : jitteredTerrainColor(blendedHex, hex.coords.q, hex.coords.r, map.seed, isWater);
      // Rzeka = wstęga na krawędzi (pushRiverMesh), nie tint całego heksu.
      mesh.setColorAt(iIdx, baseColor);

      // Rejestruj wpis w mapie instancji (fog-of-war)
      hexInstance.set(hexKey, { mesh, index: iIdx, baseColor });

      terrainInstanceIdx[t] = iIdx + 1;
    }

    // Las — dekoracja 3D gdy nakladka=Las (logika gry); robloxLite tylko upraszcza meshe (E1).
    if (hex.nakladka === Nakladka.Las && t !== TerenBazowy.Morze && t !== TerenBazowy.Wybrzeze) {
      const baseY = vis.height + vis.yOffset;
      const q = hex.coords.q, r = hex.coords.r;
      if (styledTerrain && !isWarmJungleForestHex(q, r, map.wysokoscR)) {
        // GRAFIKA-TEREN-2: instancjonowana kępa lasu (wariant + rotacja deterministyczne; R=1 → bez skali).
        // NL_NATURAL (4): tylko pełne warianty 0..3 — nigdy L4 „przetrzebiony" na starcie mapy.
        const v = wariantLasuDlaHeksa(q, r, NL_NATURAL, map.seed);
        dummy.position.set(x, baseY, z);
        dummy.rotation.set(0, rotacjaLasuDlaHeksa(q, r, map.seed), 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        const lm = lasInst[v]!;
        const li = lasIdx[v]!;
        lm.setMatrixAt(li, dummy.matrix);
        lasHexKey[v]![li] = hexKey;
        lasOrigMatrix[v]![li] = dummy.matrix.clone();
        lasIdx[v] = li + 1;
      } else if (useStyledDecor) {
        // Dżungla tropikalna (palmy/parasole) — stara ścieżka klastra drzew (poza zakresem GRAFIKA-TEREN-2).
        const cluster = buildStyleForestCluster(renderStyle, { q, r, x, z, baseY, seed: map.seed, R, mapHeight: map.wysokoscR }, robloxLite);
        styledOverlays.push({ group: cluster, hexKey });
        scene.add(cluster);
      } else {
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
    }

    // Gory -- dekoracyjny szczyt skalny PONAD prizmem + sniezna czapka.
    if (t === TerenBazowy.Gory) {
      const topY = vis.height + vis.yOffset;
      const q = hex.coords.q, r = hex.coords.r;
      if (styledTerrain) {
        // GRAFIKA-3D partia TEREN stage 2: instanced góra (wariant + rotacja deterministyczne; R=1 → bez skali)
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
      } else if (useStyledDecor) {
        const peak = buildStyleMountainPeak(renderStyle, { q, r, x, z, topY, seed: map.seed, R }, robloxLite);
        styledOverlays.push({ group: peak, hexKey });
        scene.add(peak);
      } else {
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
    }

    // Wzgorza — schodkowy kopiec zielony (tarasy = osobny model ulepszenia, bez podwójnego stosu).
    if (t === TerenBazowy.Wzgorza) {
      const baseY = vis.height + vis.yOffset;
      const q = hex.coords.q, r = hex.coords.r;
      const hillLayers = improvementKeysForHex(hex);
      if (styledTerrain && !hillLayers.includes('tarasy')) {
        // GRAFIKA-3D partia TEREN stage 2: instanced wzgórze (plateau 0.392 zachowane w modelu)
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
      } else if (useStyledDecor && !hillLayers.includes('tarasy')) {
        const hill = buildStyleHillBump(renderStyle, { q, r, x, z, baseY, seed: map.seed, R }, robloxLite);
        styledOverlays.push({ group: hill, hexKey });
        scene.add(hill);
      } else {
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
    }

    // Brzeg hybryda C: ląd = pas piasku; Wybrzeże = pełna tafła piasku + woda od strony Morza.
    const topYCoast = vis.height + vis.yOffset;
    if (useStyledDecor && renderStyle === 'roblox' && t === TerenBazowy.Wybrzeze) {
      const coastGroup = new THREE.Group();
      const hexQ = hex.coords.q;
      const hexR = hex.coords.r;
      const isDelta = deltaHexKeys.has(hexKey);
      // Wybrzeże = jasnoniebieska tafla (D-COAST-2); piasek tylko na lądzie (landCoastSandCap).
      const water = buildStyleCoastWaterCap(
        renderStyle, map, hexQ, hexR, x, z, seaSurfaceY, R,
        { lite: robloxLite, deltaKeys: deltaHexKeys, isDelta },
      );
      if (water.children.length > 0) coastGroup.add(water);
      if (coastGroup.children.length > 0) {
        styledOverlays.push({ group: coastGroup, hexKey });
        scene.add(coastGroup);
      }
    } else if (useStyledDecor && renderStyle === 'roblox' && landCoastSandNeeded(map, hex.coords.q, hex.coords.r, t)) {
      const landSand = buildStyleLandCoastSandCap(renderStyle, {
        map,
        q: hex.coords.q,
        r: hex.coords.r,
        x,
        z,
        topY: vis.height + vis.yOffset,
        R,
        self: t,
      }, robloxLite);
      if (landSand.children.length > 0) {
        styledOverlays.push({ group: landSand, hexKey });
        scene.add(landSand);
      }
    } else if (useStyledDecor && renderStyle === 'minecraft' && t !== TerenBazowy.Morze && t !== TerenBazowy.Wybrzeze) {
      const sand = buildStyleCoastSandEdges(renderStyle, {
        map,
        q: hex.coords.q,
        r: hex.coords.r,
        x,
        z,
        topY: topYCoast,
        R,
        self: t,
      }, robloxLite);
      if (sand.children.length > 0) {
        styledOverlays.push({ group: sand, hexKey });
        scene.add(sand);
      }
    } else if (t === TerenBazowy.Wybrzeze && useStyledDecor && renderStyle === 'minecraft') {
      const beach = buildStyleBeachRing(renderStyle, x, topYCoast, z, R);
      styledOverlays.push({ group: beach, hexKey });
      scene.add(beach);
    } else if (t === TerenBazowy.Wybrzeze && !useStyledDecor) {
      dummy.position.set(x, topYCoast + R * 0.015, z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      beachMesh.setMatrixAt(beachIdx, dummy.matrix);
      beachHexKey[beachIdx] = hexKey;
      beachOrigMatrix[beachIdx] = dummy.matrix.clone();
      beachIdx++;
    }

    if (t === TerenBazowy.Pustynia) {
      const q = hex.coords.q, r = hex.coords.r;
      if (useStyledDecor) {
        const dune = buildStyleDune(renderStyle, q, r, x, z, vis.height + vis.yOffset, map.seed, R);
        if (dune) {
          styledOverlays.push({ group: dune, hexKey });
          scene.add(dune);
        }
      } else if (hash2D(q, r, map.seed, 9) < 0.34) {
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

    if (t === TerenBazowy.Pustynia) {
      const oasisRoll = rnd();
      if (oasisRoll < 1.0 / 6.0) {
        const baseY = vis.height + vis.yOffset;
        if (useStyledDecor) {
          const palmCount = oasisRoll < 1.0 / 12.0 ? 1 : 2;
          // GRAFIKA-TEREN-2: oaza klockowa (348 tri) w miejscu buildStyleOasis (decyzja C — LCG bez zmian).
          const oasis = buildOaza();
          oasis.position.set(x, baseY, z);
          oasis.rotation.y = rotacjaOazy(hex.coords.q, hex.coords.r, map.seed);
          styledOverlays.push({ group: oasis, hexKey });
          scene.add(oasis);
          // Zachowaj strumień LCG: stary buildStyleOasis (roblox) konsumował 2×palmCount rnd() — utrzymuje zestaw oaz.
          for (let i = 0; i < palmCount; i++) { rnd(); rnd(); }
        } else {
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

    // --- C3: granica porcji (chunk) ---------------------------------------
    // Po przekroczeniu budżetu czasu LUB twardego limitu heksów: oddaj klatkę
    // (rAF), zaktualizuj pasek postępu i zacznij nowy budżet. Await TYLKO na
    // granicy porcji (nie per-heks), więc narzut jest znikomy (~garść rAF).
    c3ChunkCount++;
    const c3IsLast = c3i === c3Total - 1;
    if (
      !c3IsLast &&
      (c3ChunkCount >= C3_CHUNK_MAX_HEXES ||
        performance.now() - c3ChunkStart >= C3_CHUNK_TIME_BUDGET_MS)
    ) {
      onProgress?.(((c3i + 1) / c3Total) * 100);
      await c3NextFrame();
      c3ChunkStart = performance.now();
      c3ChunkCount = 0;
    }
  }
  onProgress?.(100);

  // Aktualizuj bufor instancji + przycinaj count do faktycznie użytych instancji
  for (const t of terrainTypes) {
    const meshIdx = terrainIndex[t];
    const used = terrainInstanceIdx[t] ?? 0;
    if (meshIdx === undefined || used === 0) continue;
    instancedMeshes[meshIdx]!.count = used;
  }
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
  // GRAFIKA-3D partia TEREN stage 2: finalizacja liczników 10 InstancedMesh terenu.
  for (let v = 0; v < goraInst.length; v++) {
    goraInst[v]!.count = goraIdx[v]!;
    goraInst[v]!.instanceMatrix.needsUpdate = true;
    wzgorzeInst[v]!.count = wzgorzeIdx[v]!;
    wzgorzeInst[v]!.instanceMatrix.needsUpdate = true;
  }
  // GRAFIKA-TEREN-2: finalizacja liczników 5 InstancedMesh kęp lasu.
  for (let v = 0; v < lasInst.length; v++) {
    lasInst[v]!.count = lasIdx[v]!;
    lasInst[v]!.instanceMatrix.needsUpdate = true;
  }
  // DEKOR: finalizacja liczników 8 InstancedMesh mikrodekoru łąk/równin.
  for (let w = 0; w < dekorLakaInst.length; w++) {
    dekorLakaInst[w]!.count = dekorLakaIdx[w]!;
    dekorLakaInst[w]!.instanceMatrix.needsUpdate = true;
    dekorRowninaInst[w]!.count = dekorRowninaIdx[w]!;
    dekorRowninaInst[w]!.instanceMatrix.needsUpdate = true;
  }

  // FPS lewar 1+3: każda grupa styledOverlays (wybrzeże/plaże/wydmy/oazy — po ~5-20 boxów/heks,
  // skalują się z rozmiarem mapy) → 1 zmergowany mesh + zamrożona macierz. Fog działa bez zmian
  // (własny materiał vertexColors → applyFogDimToObject3D dimuje per-grupa jak dotąd).
  for (const { group } of styledOverlays) {
    collapseToMergedMesh(group);
    group.matrixAutoUpdate = false;
    group.updateMatrix();
  }
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
  const pathKinds = map.riverPathKinds ?? paths.map(() => 'main' as const);

  const seaVisForRiver = terrainVis(TerenBazowy.Morze, renderStyle);
  const seaTopY = seaVisForRiver.height + seaVisForRiver.yOffset;
  // BUG-RZEKI-RENDER (wariant B „wodospad", Maciej 2026-07-06): flat sea level wstęgi
  // ujścia MUSI leżeć NAD wierzchem pryzmu Wybrzeża (~0.28), inaczej płaska końcówka chowa
  // się w bloku wybrzeża (poprzednio riverMouthY≈0.250 < 0.280 → wstęga „tonęła" pod lądem).
  // Sea level = wierzch capa Wybrzeża + margines; drop lądu→morze robi buildCoastalRiverPointChain
  // pionowym progiem (wodospad), a nie skosem wchodzącym pod mesh.
  const capTopY = coastWaterCapTopY(renderStyle);
  const coastPrismTopY = terrainSurfaceTopY(TerenBazowy.Wybrzeze, renderStyle);
  const riverMouthY = Math.max(capTopY + R * 0.026, coastPrismTopY + R * 0.035);

  // Wstęgi wzdłuż krawędzi hex (Roblox: proste odcinki obwodu, bez środka pola).
  const RIVER_MAIN_HALF_WIDTH = R * 0.052;
  const RIVER_SURFACE_OFFSET   = riverSurfaceLiftY(R);

  const LAND_RIVER_RENDER_ORDER = 55;
  // B0.8b (Z1): wstęga ujścia RYSUJE SIĘ NAD capem Wybrzeża i nad lejkiem delty.
  // renderOrder 58 > land 55 > cap-overlay (0/1) i > lejek (coastDeltaBucket 50).
  const RIVER_MOUTH_RENDER_ORDER = 58;

  const landHexKeysAll = renderLandRiversFromPaths(
    map, paths, pathKinds, R, renderStyle, riverMouthY, RIVER_SURFACE_OFFSET,
    RIVER_MAIN_HALF_WIDTH, scene, riverEntries, riverWaterMat, LAND_RIVER_RENDER_ORDER,
  );
  for (const k of landHexKeysAll) riverHexKeys.push(k);

  for (let pi = 0; pi < paths.length; pi++) {
    const path = paths[pi]!;
    if (path.length < 2) continue;
    if ((pathKinds[pi] ?? 'main') !== 'main') continue;
    // B0.7/B0.8: wstęga ujścia + lejek TYLKO gdy trasa realnie kończy w morzu (nie junction).
    // pathReachesOpenSeaRender wystarcza (buildCoastalRiverPointChain sam buduje łańcuch lub
    // zwraca pusto) — dawny dodatkowy warunek pathNearCoast blokował rzeki wpadające wprost w Morze.
    if (pathReachesOpenSeaRender(map, path)) {
      const coastRiverBucket: RiverGeoBucket = {
        mat: riverWaterMat, geos: [], hexKeys: new Set(), renderOrder: RIVER_MOUTH_RENDER_ORDER,
      };
      const coastRiverDeltaTopBucket: RiverGeoBucket = {
        mat: coastDeltaMat, geos: [], hexKeys: new Set(), renderOrder: RIVER_MOUTH_RENDER_ORDER,
      };
      const coastDeltaBucket: RiverGeoBucket = {
        mat: coastDeltaMat, geos: [], hexKeys: new Set(), renderOrder: 50,
      };
      renderCoastalRiverExtension(
        map, path, R, riverMouthY,
        coastRiverBucket, coastRiverDeltaTopBucket, coastDeltaBucket,
        RIVER_MAIN_HALF_WIDTH, deltaHexKeys,
      );
      flushRiverBucket(scene, coastDeltaBucket, riverEntries);
      flushRiverBucket(scene, coastRiverBucket, riverEntries);
      flushRiverBucket(scene, coastRiverDeltaTopBucket, riverEntries);
    }
  }

  // ---------------------------------------------------------------------------
  // F1 — ocean wokol kontynentu + ramka swiata (plansza)
  // ---------------------------------------------------------------------------
  const mapMaxDim = Math.max(map.szerokoscQ, map.wysokoscR);
  const mapSpanForCam = mapMaxDim * R * 1.85;
  const maxZoomDist = Math.max(320, mapSpanForCam * 1.2);

  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const hex of Object.values(map.hexes)) {
    const { x, z } = axialToWorld(hex.coords.q, hex.coords.r, R);
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  }
  const seaVis = terrainVis(TerenBazowy.Morze, renderStyle);
  const seaTop = seaVis.height + seaVis.yOffset;
  /** Tło oceanu — głęboko pod lądem; właściwa tafla = heksy Morze/Wybrzeże (nie ta płaszczyzna). */
  const mapSpanBounds = Math.max(maxX - minX, maxZ - minZ);
  const OCEAN_BACKDROP_DEPTH = Math.min(28, Math.max(14, mapSpanBounds * 0.012));
  const OCEAN_BED_Y = seaTop - OCEAN_BACKDROP_DEPTH;
  /** Pad musi przykryć kadr przy maxZoomDist — poprzednio R*7 zostawiał szare rogi. */
  const padO = Math.max(R * 7, maxZoomDist * 3.2, mapSpanBounds * 0.85);
  const padF = R * 1.4;  // ramka tuz przy krawedzi mapy
  const cXb = (minX + maxX) / 2, cZb = (minZ + maxZ) / 2;

  // Plaszczyzna glebokiego oceanu pod calym swiatem (wypelnia tlo wokol ladu).
  const oceanGeo = new THREE.PlaneGeometry((maxX - minX) + padO * 2, (maxZ - minZ) + padO * 2);
  const oceanMat = new THREE.MeshLambertMaterial({
    color: palette.deepOcean,
    depthWrite: true,
    fog: false,
  });
  const oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
  oceanMesh.rotation.x = -Math.PI / 2;
  oceanMesh.renderOrder = -10;
  oceanMesh.position.set(cXb, OCEAN_BED_Y, cZb);
  // Płaszczyzna głębokiego oceanu leży 14-28 j. POD taflą (OCEAN_BED_Y) — cień kontynentu
  // rzucany na nią wyglądał jak „lewitujący", przesunięty cień na wodzie (tylko pod
  // kontynentem w kadrze kamery cienia). Dekoracyjne tło nie potrzebuje cienia → OFF.
  oceanMesh.receiveShadow = false;
  scene.add(oceanMesh);

  // Ramka swiata — 4 listwy obramowania wokol mapy (ciemny kamien/drewno), w oceanie.
  const frameMat = new THREE.MeshLambertMaterial({ color: palette.frame, fog: false });
  const frameGeos: THREE.BoxGeometry[] = [];
  const frameMeshes: THREE.Mesh[] = [];
  const fx0 = minX - padF, fx1 = maxX + padF, fz0 = minZ - padF, fz1 = maxZ + padF;
  const frameBarH = R * 0.6, frameBarT = R * 0.7, frameY = seaTop + R * 0.12;
  const addBar = (w: number, d: number, px: number, pz: number) => {
    const g = new THREE.BoxGeometry(w, frameBarH, d);
    const m = new THREE.Mesh(g, frameMat);
    m.position.set(px, frameY, pz);
    m.castShadow = true;
    m.receiveShadow = true;
    scene.add(m);
    frameMeshes.push(m);
    frameGeos.push(g);
  };
  const spanX = (fx1 - fx0) + frameBarT * 2;
  addBar(spanX, frameBarT, (fx0 + fx1) / 2, fz0 - frameBarT / 2); // gora
  addBar(spanX, frameBarT, (fx0 + fx1) / 2, fz1 + frameBarT / 2); // dol
  addBar(frameBarT, (fz1 - fz0), fx0 - frameBarT / 2, (fz0 + fz1) / 2); // lewo
  addBar(frameBarT, (fz1 - fz0), fx1 + frameBarT / 2, (fz0 + fz1) / 2); // prawo

  // -- Kamera
  const center = mapCenter(map.szerokoscQ, map.wysokoscR, R);

  if (renderStyle === 'roblox') {
    const mapSpan = mapSpanForCam;
    const fogFar = Math.max(mapSpan * 2.6, maxZoomDist * 5.5);
    scene.fog = new THREE.Fog(palette.fogColor, mapSpan * 0.28, fogFar);
    addRobloxSkyDecor(scene, center.x, center.z, mapSpan, robloxLite);
    scene.add(new THREE.AmbientLight(0xffffff, 0.3));
  }

  const farClip = renderStyle === 'roblox'
    ? Math.max(1200, maxZoomDist * 5, mapMaxDim * R * 6)
    : Math.max(600, mapMaxDim * 3.5);
  const camera = new THREE.PerspectiveCamera(
    50,
    camAspect,
    0.5,
    farClip,
  );
  const camDist = Math.max(map.szerokoscQ, map.wysokoscR) * R * (renderStyle === 'roblox' ? 1.65 : 1.45);
  camera.position.set(center.x, camDist * 0.9, center.z + camDist * 0.7);
  camera.lookAt(center.x, 0, center.z);

  // -- Resize handler (pominięty gdy previewViewport — qualitypreview zarządza rozmiarem)
  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  if (!fixedViewport) {
    window.addEventListener('resize', onResize);
  }

  // -- Dispose
  function dispose() {
    if (!fixedViewport) {
      window.removeEventListener('resize', onResize);
    }
    for (const m of instancedMeshes) { m.geometry.dispose(); }
    for (const mat of Object.values(terrainMaterials)) mat?.dispose();
    forestConeGeo.dispose(); forestConeMat.dispose();
    forestTrunkGeo.dispose(); forestTrunkMat.dispose();
    snowGeo.dispose(); snowMat.dispose();
    shrubConeGeo.dispose(); shrubConeMat.dispose();
    // Nowe dekoracje terenu
    peakGeo.dispose(); peakMat.dispose();
    hillBumpGeo.dispose(); hillBumpMat.dispose();
    // GRAFIKA-3D partia TEREN stage 2: zwolnij bufory instancji (geometria gór/wzgórz i
    // TEREN_MATERIAL są współdzielone/cache w module — NIE dispose'ować ich tutaj).
    for (const m of goraInst) m.dispose();
    for (const m of wzgorzeInst) m.dispose();
    for (const m of dekorLakaInst) m.dispose();
    for (const m of dekorRowninaInst) m.dispose();
    beachGeo.dispose(); beachMat.dispose();
    duneGeo.dispose(); duneMat.dispose();
    // Oazy (InstancedMesh)
    oasisPoolGeo.dispose();  oasisPoolMat.dispose();
    oasisTrunkGeo.dispose(); oasisTrunkMat.dispose();
    oasisFrondGeo.dispose(); oasisFrondMat.dispose();
    // Rzeki (woda + brzegi per entry; merged = jedna geo)
    for (const entry of riverEntries) {
      entry.waterGeo.dispose();
      if (entry.bankGeo !== entry.waterGeo) entry.bankGeo.dispose();
    }
    riverWaterMat.dispose();
    riverBankMat.dispose();
    coastDeltaMat.dispose();
    // Ocean + ramka swiata (F1)
    oceanGeo.dispose(); oceanMat.dispose();
    for (const g of frameGeos) g.dispose();
    frameMat.dispose();
    if (ownRenderer) {
      renderer.dispose();
    }
  }

  // ---------------------------------------------------------------------------
  // setFog -- przelicza kolory prizmow terenu wedlug stanu mgly wojennej
  // oraz ukrywa/przywraca nakladki (las, snieg, krzewy, oazy). Rzeki WYJATEK: zawsze widoczne.
  // ---------------------------------------------------------------------------

  // Macierz zerowa (skala 0,0,0) — ukrywa instancje InstancedMesh
  const ZERO_MATRIX = new THREE.Matrix4().makeScale(0, 0, 0);
  /** Hexy z miastem — dekoracje terenu ukryte na stałe (F-CITY-HEX); grunt zostaje widoczny. */
  const decorHiddenHexKeys = new Set<string>();

  const hideInstancedOnHex = (
    mesh: THREE.InstancedMesh,
    keys: string[],
    orig: THREE.Matrix4[],
    hexKey: string,
  ): void => {
    let touched = false;
    for (let i = 0; i < mesh.count; i++) {
      if (keys[i] !== hexKey) continue;
      mesh.setMatrixAt(i, ZERO_MATRIX);
      touched = true;
    }
    if (touched) mesh.instanceMatrix.needsUpdate = true;
  };

  function hideDecorAtHex(hexKey: string): void {
    decorHiddenHexKeys.add(hexKey);
    // F-CITY-HEX: tylko dekor (las, zasoby, wydma…) — NIE ukrywaj kafelka terenu (inaczej „dziura” z oceanem).
    for (const { group, hexKey: hk } of styledOverlays) {
      if (hk === hexKey) group.visible = false;
    }
    hideInstancedOnHex(forestMesh, forestHexKey, forestOrigMatrix, hexKey);
    hideInstancedOnHex(forestTrunkMesh, forestTrunkHexKey, forestTrunkOrigMatrix, hexKey);
    hideInstancedOnHex(snowMesh, snowHexKey, snowOrigMatrix, hexKey);
    hideInstancedOnHex(shrubMesh, shrubHexKey, shrubOrigMatrix, hexKey);
    hideInstancedOnHex(peakMesh, peakHexKey, peakOrigMatrix, hexKey);
    hideInstancedOnHex(hillBumpMesh, hillBumpHexKey, hillBumpOrigMatrix, hexKey);
    for (let v = 0; v < goraInst.length; v++) {
      hideInstancedOnHex(goraInst[v]!, goraHexKey[v]!, goraOrigMatrix[v]!, hexKey);
      hideInstancedOnHex(wzgorzeInst[v]!, wzgorzeHexKey[v]!, wzgorzeOrigMatrix[v]!, hexKey);
    }
    // GRAFIKA-TEREN-2: schowaj kępę lasu pod miastem/ulepszeniem na tym heksie (wzorzec gór/wzgórz).
    for (let v = 0; v < lasInst.length; v++) {
      hideInstancedOnHex(lasInst[v]!, lasHexKey[v]!, lasOrigMatrix[v]!, hexKey);
    }
    // DEKOR: schowaj mikrodekor pod miastem/ulepszeniem na tym heksie (wzorzec jak las).
    for (let w = 0; w < dekorLakaInst.length; w++) {
      hideInstancedOnHex(dekorLakaInst[w]!, dekorLakaHexKey[w]!, dekorLakaOrig[w]!, hexKey);
      hideInstancedOnHex(dekorRowninaInst[w]!, dekorRowninaHexKey[w]!, dekorRowninaOrig[w]!, hexKey);
    }
    hideInstancedOnHex(beachMesh, beachHexKey, beachOrigMatrix, hexKey);
    hideInstancedOnHex(duneMesh, duneHexKey, duneOrigMatrix, hexKey);
    hideInstancedOnHex(oasisPoolMesh, oasisPoolHexKey, oasisPoolOrigMat, hexKey);
    hideInstancedOnHex(oasisTrunkMesh, oasisTrunkHexKey, oasisTrunkOrigMat, hexKey);
    hideInstancedOnHex(oasisFrondMesh, oasisFrondHexKey, oasisFrondOrigMat, hexKey);
    // Przywróć kafelek terenu (F-CITY-HEX — tylko dekor ukryty, nie „dziura” z oceanem).
    const entry = hexInstance.get(hexKey);
    if (entry) {
      const orig = hexOrigMatrix.get(hexKey);
      if (orig) {
        entry.mesh.setMatrixAt(entry.index, orig);
        entry.mesh.instanceMatrix.needsUpdate = true;
      }
    }
  }

  const skyBgColor = palette.sky;
  const sceneFog = scene.fog;

  let currentZoomLod: ZoomLodLevel = 0;
  let zoomFlags: ZoomLodFlags = zoomLodFlags(0, preset.shadowsEnabled);
  let lastFogVisible: Set<string> | null = null;
  let lastFogExplored: Set<string> | null = null;
  let lastAnyHidden = false;
  // A5: dirty-set dla setFog. Cache stanu widoczności per heks (0=visible, 1=explored,
  // 2=hidden). Deklarowane w domknięciu buildScene → auto-reset przy nowej scenie,
  // brak przecieku między scenami. Sygnatura = wyłącznie kategoria stanu, bo kolor
  // i macierz głównej pętli zależą TYLKO od niej (baseColor, FOG_EXPLORED_BRIGHTNESS,
  // FOG_HIDDEN_COLOR, hexOrigMatrix są stałe per heks/globalnie). Kontekst globalny
  // (roblox ocean-hide) obsłużony osobno przez unieważnienie całego cache poniżej.
  const lastFogSig = new Map<string, number>();
  // Poprzedni kontekst globalny wpływający na interpretację macierzy oceanu:
  // showOceanBackdrop (=!anyHidden||landReveal). Zmiana → pełny przebieg (czyścimy cache).
  let lastFogShowOceanBackdrop: boolean | null = null;

  function applyZoomGpuSettings(): void {
    if (ownRenderer) {
      renderer.setPixelRatio(effectivePixelRatio(preset.pixelRatioMax, zoomFlags.pixelRatioMul));
    }
    renderer.shadowMap.enabled = zoomFlags.shadows;
    sun.castShadow = zoomFlags.shadows;
    // FPS cienie na żądanie: powrót do bliskiego LOD włącza cienie → jednorazowe przerysowanie
    // shadow mapy (auto-render wyłączony). Oddalenie (shadows=false) i tak jej nie rysuje.
    if (zoomFlags.shadows) renderer.shadowMap.needsUpdate = true;
  }

  function applyZoomLodDecor(anyHiddenFinal: boolean): void {
    const hasFog = lastFogVisible !== null && lastFogExplored !== null;
    const visible = lastFogVisible ?? new Set<string>();
    const explored = lastFogExplored ?? new Set<string>();
    const isHidden = (k: string) => hasFog && !visible.has(k) && !explored.has(k);
    const overlayHidden = (k: string) =>
      isHidden(k) || decorHiddenHexKeys.has(k);

    const applyOverlayFog = (
      mesh: THREE.InstancedMesh,
      keys: string[],
      orig: THREE.Matrix4[],
    ) => {
      const cnt = mesh.count;
      for (let i = 0; i < cnt; i++) {
        const k = keys[i];
        if (k === undefined) continue;
        if (overlayHidden(k)) {
          mesh.setMatrixAt(i, ZERO_MATRIX);
        } else {
          const m = orig[i];
          if (m) mesh.setMatrixAt(i, m);
        }
      }
      mesh.instanceMatrix.needsUpdate = true;
    };

    // GRAFIKA-3D partia TEREN stage 2: fog dla instanced gór/wzgórz — matrix-hide (nieodkryte
    // / miasto) + instanceColor-dim (explored ×FOG_EXPLORED_BRIGHTNESS). Parytet z dimmingiem
    // styledOverlays (applyFogDimToObject3D), bo tu materiał wspólny — dimujemy per-instancję.
    const _terrainDim = new THREE.Color();
    const applyTerrainFog = (
      mesh: THREE.InstancedMesh,
      keys: string[],
      orig: THREE.Matrix4[],
    ) => {
      const cnt = mesh.count;
      for (let i = 0; i < cnt; i++) {
        const k = keys[i];
        if (k === undefined) continue;
        const bri = fogBrightnessForHex(k, visible, explored, hasFog);
        if (bri <= 0 || decorHiddenHexKeys.has(k)) {
          mesh.setMatrixAt(i, ZERO_MATRIX);
        } else {
          const m = orig[i];
          if (m) mesh.setMatrixAt(i, m);
          _terrainDim.setScalar(bri);
          mesh.setColorAt(i, _terrainDim);
        }
      }
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    };

    forestMesh.visible = zoomFlags.forestInst;
    if (zoomFlags.forestInst) applyOverlayFog(forestMesh, forestHexKey, forestOrigMatrix);

    forestTrunkMesh.visible = zoomFlags.forestTrunkInst;
    if (zoomFlags.forestTrunkInst) applyOverlayFog(forestTrunkMesh, forestTrunkHexKey, forestTrunkOrigMatrix);

    snowMesh.visible = zoomFlags.terrainDetailInst;
    if (zoomFlags.terrainDetailInst) applyOverlayFog(snowMesh, snowHexKey, snowOrigMatrix);

    shrubMesh.visible = zoomFlags.terrainDetailInst;
    if (zoomFlags.terrainDetailInst) applyOverlayFog(shrubMesh, shrubHexKey, shrubOrigMatrix);

    peakMesh.visible = zoomFlags.terrainDetailInst;
    if (zoomFlags.terrainDetailInst) applyOverlayFog(peakMesh, peakHexKey, peakOrigMatrix);

    hillBumpMesh.visible = zoomFlags.terrainDetailInst;
    if (zoomFlags.terrainDetailInst) applyOverlayFog(hillBumpMesh, hillBumpHexKey, hillBumpOrigMatrix);

    // DEKOR mikrodekor łąk/równin — LOD 0-1 (terrainDetailInst); fog per-instancja (wspólny materiał).
    // DEKOR: tylko LOD (widoczność). Mgła dekoru aktualizowana DIFFEM w setFog (dekorRefByHex),
    // NIE pełnym skanem tutaj — inaczej ~80–150k instancji × każde odsłonięcie = regresja 139 ms.
    // Instancje mają zawsze aktualny stan mgły z diffu, więc przy powrocie LOD są poprawne.
    dekorGroup.visible = zoomFlags.terrainDetailInst;

    // GRAFIKA-3D partia TEREN stage 2: instanced góry/wzgórza — widoczność jak styledDecor.
    for (let v = 0; v < goraInst.length; v++) {
      goraInst[v]!.visible = zoomFlags.styledDecor;
      if (zoomFlags.styledDecor) applyTerrainFog(goraInst[v]!, goraHexKey[v]!, goraOrigMatrix[v]!);
      wzgorzeInst[v]!.visible = zoomFlags.styledDecor;
      if (zoomFlags.styledDecor) applyTerrainFog(wzgorzeInst[v]!, wzgorzeHexKey[v]!, wzgorzeOrigMatrix[v]!);
    }
    // GRAFIKA-TEREN-2: instancjonowane kępy lasu — widoczność/mgła jak góry/wzgórza (styledDecor).
    for (let v = 0; v < lasInst.length; v++) {
      lasInst[v]!.visible = zoomFlags.styledDecor;
      if (zoomFlags.styledDecor) applyTerrainFog(lasInst[v]!, lasHexKey[v]!, lasOrigMatrix[v]!);
    }

    beachMesh.visible = zoomFlags.coastDecorInst;
    if (zoomFlags.coastDecorInst) applyOverlayFog(beachMesh, beachHexKey, beachOrigMatrix);

    duneMesh.visible = zoomFlags.coastDecorInst;
    if (zoomFlags.coastDecorInst) applyOverlayFog(duneMesh, duneHexKey, duneOrigMatrix);

    oasisPoolMesh.visible = zoomFlags.coastDecorInst;
    if (zoomFlags.coastDecorInst) applyOverlayFog(oasisPoolMesh, oasisPoolHexKey, oasisPoolOrigMat);

    oasisTrunkMesh.visible = zoomFlags.coastDecorInst;
    if (zoomFlags.coastDecorInst) applyOverlayFog(oasisTrunkMesh, oasisTrunkHexKey, oasisTrunkOrigMat);

    oasisFrondMesh.visible = zoomFlags.coastDecorInst;
    if (zoomFlags.coastDecorInst) applyOverlayFog(oasisFrondMesh, oasisFrondHexKey, oasisFrondOrigMat);

    // Właściciel 2026-07-10: rzeki NIE mają być widoczne na ciemnym (nieodkrytym) polu, ALE
    // odkryta część rzeki MA zostać widoczna — i CAŁOŚĆ, gdy nie ma fog-of-war. Rozwiązanie:
    // mgła PER-HEKS. Dla rzek jednowstęgowych (entry.pointHex) rysujemy tylko te quady, których
    // OBA końce leżą na odkrytym polu — przez przebudowę INDEKSU (pozycje wierzchołków nietknięte
    // → identyczny wygląd, 1 draw-call). Ciemne odcinki po prostu wypadają z indeksu.
    // Delty scalone (bez pointHex) → fallback: ukryj całą wstęgę, gdy KTÓRYKOLWIEK heks w czerni.
    // Bez mgły (hasFog=false) overlayHidden zawsze false → indeks pełny → cała rzeka widoczna.
    for (const entry of riverEntries) {
      const ph = entry.pointHex;
      if (ph && ph.length >= 2) {
        // PERF: `setIndex` (re-upload GPU) TYLKO gdy zmienił się stan mgły tej rzeki. Sygnatura =
        // tani 32-bit hash odkryte/ciemne per punkt (same Set.has). Zoom lub setFog na niezmienionej
        // rzece → sam hash, ZERO setIndex/alokacji. Pętla i tak nie odpala się per-klatka.
        let sig = 0;
        for (let k = 0; k < ph.length; k++) {
          sig = (Math.imul(sig, 31) + (overlayHidden(ph[k]!) ? 1 : 0)) | 0;
        }
        if (sig !== entry.lastFogSig) {
          entry.lastFogSig = sig;
          const idx: number[] = [];
          for (let j = 0; j < ph.length - 1; j++) {
            if (overlayHidden(ph[j]!) || overlayHidden(ph[j + 1]!)) continue;
            const b = 2 * j; // punkt j → wierzch. 2j/2j+1; quad j..j+1 = 2 trójkąty (winding jak build)
            idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3);
          }
          entry.waterGeo.setIndex(idx);
          entry.hasVisibleQuads = idx.length > 0;
        }
        const riverVis = zoomFlags.rivers && (entry.hasVisibleQuads ?? true);
        entry.waterMesh.visible = riverVis;
        entry.bankMesh.visible = riverVis;
      } else {
        let allRevealed = true;
        for (const hk of entry.hexKeys) {
          if (overlayHidden(hk)) { allRevealed = false; break; }
        }
        const riverVis = zoomFlags.rivers && allRevealed;
        entry.waterMesh.visible = riverVis;
        entry.bankMesh.visible = riverVis;
      }
    }

    for (const { group, hexKey: hk } of styledOverlays) {
      const hidden = overlayHidden(hk);
      group.visible = zoomFlags.styledDecor && !hidden;
      if (!group.visible) continue;
      const bri = fogBrightnessForHex(hk, visible, explored, hasFog);
      applyFogDimToObject3D(group, bri);
    }
  }

  function setZoomLod(dist: number, minDist: number, maxDist: number): void {
    const t = normalizedZoomT(dist, minDist, maxDist);
    const level = resolveZoomLodLevel(t);
    if (level === currentZoomLod) return;
    currentZoomLod = level;
    zoomFlags = zoomLodFlags(level, preset.shadowsEnabled);
    applyZoomGpuSettings();
    applyZoomLodDecor(lastAnyHidden);
  }

  function setFog(visible: Set<string>, explored: Set<string>, opts?: { landReveal?: boolean }): void {
    const __fogT0 = performance.now();
    const prevVisible = lastFogVisible;
    lastFogVisible = visible;
    lastFogExplored = explored;
    const landReveal = opts?.landReveal ?? false;
    // Pomocnik: czy hex jest niewidoczny i nieodkryty?
    const isHidden = (k: string) => !visible.has(k) && !explored.has(k);

    // -- Baza: kolory + ukrycie geometrii terenu (unknown = brak heksa, nie kontur kontynentu)
    const touchedMeshes = new Set<THREE.InstancedMesh>();
    // FPS: anyHidden = czy istnieje JAKIKOLWIEK ukryty heks (early-exit; przy obecnej mgle
    // kończy na pierwszym nieodkrytym, bez skanu 320k).
    let anyHidden = false;
    for (const [key] of hexInstance) {
      if (isHidden(key)) { anyHidden = true; break; }
    }

    // A5: kontekst globalny decydujący o roblox ocean-hide (patrz pętla ~2100 niżej).
    // Jeśli się zmienił, interpretacja macierzy heksów Morze/Wybrzeże się zmienia
    // (ZERO ↔ orig), więc per-heks sygnatura stanu nie wystarcza → pełny przebieg.
    const showOceanBackdropNow = !anyHidden || landReveal;
    const contextChanged = showOceanBackdropNow !== lastFogShowOceanBackdrop;
    if (contextChanged) {
      lastFogSig.clear();
      lastFogShowOceanBackdrop = showOceanBackdropNow;
    }

    // FPS: iteruj TYLKO heksy, które ZMIENIŁY przynależność do `visible` vs poprzednie
    // wywołanie (symetryczna różnica), zamiast całych ~320k.
    // Dlaczego wystarczy sam `visible` (bez explored): `explored` rośnie wyłącznie o aktualnie
    // widoczne heksy (addExplored(explored,vis) tuż przed setFog) i NIGDY nie maleje. Zatem
    // KAŻDE przejście mgły (hidden→visible, visible→explored, explored→visible) zmienia
    // przynależność do `visible` — a explored bez zmiany visible nie zmienia `sig`. Dodatkowo
    // w normalnej grze `explored` to TEN SAM obiekt co poprzednio (współdzielony), więc diff po
    // nim i tak byłby pusty (i kosztowny — iteruje rosnący zbiór). revealAllLand daje nowy
    // (scalony) explored, ale jego włączenie zmienia kontekst → pełny przebieg poniżej.
    let keysToScan: Iterable<string>;
    if (contextChanged || prevVisible === null) {
      keysToScan = hexInstance.keys();
    } else {
      const changed = new Set<string>();
      for (const k of visible) if (!prevVisible.has(k)) changed.add(k);
      for (const k of prevVisible) if (!visible.has(k)) changed.add(k);
      keysToScan = changed;
    }

    const touchedDekorMeshes = new Set<THREE.InstancedMesh>();
    const _dekorFogC = new THREE.Color();
    for (const key of keysToScan) {
      const entry = hexInstance.get(key);
      if (entry === undefined) continue;
      // 0=visible, 1=explored, 2=hidden. Pokrywa kolor (3 gałęzie) i macierz (isHidden→ZERO).
      const sig = visible.has(key) ? 0 : explored.has(key) ? 1 : 2;
      if (lastFogSig.get(key) === sig) continue; // brak zmiany → zero operacji GPU

      const { mesh, index, baseColor } = entry;
      let color: THREE.Color;

      if (sig === 0) {
        color = baseColor.clone();
      } else if (sig === 1) {
        color = baseColor.clone().multiplyScalar(FOG_EXPLORED_BRIGHTNESS);
      } else {
        color = FOG_HIDDEN_COLOR.clone();
      }

      mesh.setColorAt(index, color);
      if (sig === 2) {
        mesh.setMatrixAt(index, ZERO_MATRIX);
      } else {
        const orig = hexOrigMatrix.get(key);
        if (orig) mesh.setMatrixAt(index, orig);
      }
      lastFogSig.set(key, sig);
      touchedMeshes.add(mesh);

      // FPS fog: mikrodekor tego heksa dzieli stan mgły (ten sam sig) — aktualizuj DIFFEM (tylko
      // zmienione heksy), nie pełnym skanem ~80–150k instancji per setFog (naprawa regresji 139 ms).
      const dref = dekorRefByHex.get(key);
      if (dref !== undefined) {
        if (sig === 2 || decorHiddenHexKeys.has(key)) {
          dref.mesh.setMatrixAt(dref.index, ZERO_MATRIX); // hidden lub pod miastem → schowaj
        } else {
          dref.mesh.setMatrixAt(dref.index, dref.orig);
          _dekorFogC.setScalar(sig === 0 ? 1 : FOG_EXPLORED_BRIGHTNESS);
          dref.mesh.setColorAt(dref.index, _dekorFogC); // visible=pełny, explored=przygaszony
        }
        touchedDekorMeshes.add(dref.mesh);
      }
    }

    // Zatwierdz zmiany kolorow i macierzy na wszystkich dotknietych meshach
    for (const mesh of touchedMeshes) {
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.instanceMatrix.needsUpdate = true;
    }
    for (const m of touchedDekorMeshes) {
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }

    const anyHiddenFinal = anyHidden;
    // A5: ten sam kontekst, którego użyto do decyzji o unieważnieniu cache wyżej —
    // jedno źródło prawdy, by roblox ocean-hide i cache nigdy się nie rozjechały.
    const showOceanBackdrop = showOceanBackdropNow;
    // Roblox: heksy Morze/Wybrzeże ukryte gdy widać głęboką taflę (unikaj podwójnej wody).
    if (renderStyle === 'roblox' && showOceanBackdrop) {
      for (const [key, entry] of hexInstance) {
        const teren = hexTeren.get(key);
        if (teren !== TerenBazowy.Morze && teren !== TerenBazowy.Wybrzeze) continue;
        entry.mesh.setMatrixAt(entry.index, ZERO_MATRIX);
        touchedMeshes.add(entry.mesh);
      }
    }

    // Skrót M (landReveal): tafla oceanu + tło wody, choć heksy Morza nadal unknown.
    oceanMesh.visible = showOceanBackdrop;
    if (showOceanBackdrop) {
      oceanMesh.position.y = OCEAN_BED_Y;
    }
    for (const fm of frameMeshes) fm.visible = showOceanBackdrop;
    scene.background = new THREE.Color(
      showOceanBackdrop ? palette.deepOcean : FOG_HIDDEN_COLOR.getHex(),
    );
    scene.fog = showOceanBackdrop ? sceneFog : null;

    lastAnyHidden = anyHiddenFinal && !landReveal;
    applyZoomLodDecor(anyHiddenFinal && !landReveal);
    // FPS cienie na żądanie: geometria casterów zmieniła się tylko gdy jakiś heks realnie
    // zmienił stan (touchedMeshes>0 = ukrycie/odsłonięcie terenu, a wtedy i dekor per-heks).
    // Pusty diff (np. odświeżenie mgły bez zmian przy hover/select) NIE rusza shadow pass.
    if (touchedMeshes.size > 0) renderer.shadowMap.needsUpdate = true;
    lastSetFogMs = performance.now() - __fogT0;
  }

  function getZoomLodLevel(): ZoomLodLevel {
    return currentZoomLod;
  }

  // FPS: statyczne InstancedMeshe terenu/dekoracji (baza heksów, las, śnieg, szczyty, garby
  // wzgórz, plaże/wydmy/oazy, 10× góry/wzgórza) nie zmieniają WŁASNEJ macierzy — instancje
  // pozycjonowane są przez instanceMatrix (setMatrixAt), a sam mesh stoi w origin. matrixAutoUpdate
  // off zdejmuje per-frame updateMatrix z każdego z nich. Celujemy tylko w isInstancedMesh, więc
  // oceanMesh (jego position.y zmienia się w setFog) i wstęgi rzek zostają nietknięte.
  scene.traverse((o) => {
    if ((o as THREE.InstancedMesh).isInstancedMesh) {
      o.matrixAutoUpdate = false;
      o.updateMatrix();
    }
  });
  return { scene, camera, renderer, center, dispose, setFog, hideDecorAtHex, setZoomLod, getZoomLodLevel };
}
