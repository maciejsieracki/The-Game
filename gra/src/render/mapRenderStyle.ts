/**
 * mapRenderStyle.ts — palety i fabryki dekoracji mapy (Roblox / Minecraft).
 * Te same hexy, te same pozycje co scene.ts — inny wygląd nakładek.
 */
import * as THREE from 'three';
import { TerenBazowy } from '../types/hex';
import type { GameMap } from '../types/map';
import { climateZoneAt } from '../map/gen-helpers';
import { axialToWorld, HEX_R } from './hexutil';
import {
  goraGeometria, wzgorzeGeometria, wariantDlaHeksa, rotacjaDlaHeksa,
  TEREN_MATERIAL, LICZBA_WARIANTOW_TERENU, GORA_APEX_Y, WZGORZE_SZCZYT_Y,
} from './teren-gory-wzgorza';

export type MapRenderStyle = 'civ' | 'roblox' | 'minecraft';

/** Niska / Średnia / Wysoka — jakość GPU i szczegółowość dekoracji mapy. */
export type QualityTier = 'low' | 'medium' | 'high';

/** Stały viewport (qualitypreview — bez globalnego window.resize). */
export interface PreviewViewport {
  width: number;
  height: number;
  /** qualitypreview: aspect kamery = (width / panelColumns) / height */
  panelColumns?: number;
}

/** Opcje przekazywane z kreatora / zapisu do buildScene. */
export interface MapRenderOptions {
  style: MapRenderStyle;
  renderQuality: QualityTier;
  mapDetailQuality: QualityTier;
  previewViewport?: PreviewViewport;
  /** Wspólny renderer — unika limitu wielu kontekstów WebGL (qualitypreview). */
  sharedRenderer?: THREE.WebGLRenderer;
}

/** Domyślny styl mapy w grze (decyzja Macieja C, 2026-06-27). */
export const GAME_MAP_RENDER_STYLE: MapRenderStyle = 'roblox';

/** Domyślne presety (provisional §7 spec — render Średni, mapa Wysoka). */
export const DEFAULT_MAP_RENDER_OPTIONS: MapRenderOptions = {
  style: GAME_MAP_RENDER_STYLE,
  renderQuality: 'medium',
  mapDetailQuality: 'high',
};

/** Próg hexów: mapDetail=medium → robloxLite powyżej tej liczby. */
export const MAP_DETAIL_MEDIUM_HEX_THRESHOLD = 3000;

export interface ResolvedRenderPreset {
  robloxLite: boolean;
  antialias: boolean;
  pixelRatioMax: number;
  shadowsEnabled: boolean;
  shadowMapSize: number;
  fogFarMul: number;
}

export function normalizeMapRenderOptions(
  input?: MapRenderStyle | MapRenderOptions,
): MapRenderOptions {
  if (!input) return { ...DEFAULT_MAP_RENDER_OPTIONS };
  if (typeof input === 'string') {
    return { ...DEFAULT_MAP_RENDER_OPTIONS, style: input };
  }
  return {
    style: input.style ?? GAME_MAP_RENDER_STYLE,
    renderQuality: input.renderQuality ?? 'medium',
    mapDetailQuality: input.mapDetailQuality ?? 'high',
    previewViewport: input.previewViewport,
    sharedRenderer: input.sharedRenderer,
  };
}

/** robloxLite = koszt GPU / prostsze meshe — NIE warstwa logiczna mapy (E1, Maciej 2026-06-29). */
export function resolveRenderPreset(
  options: MapRenderOptions,
  hexCount: number,
): ResolvedRenderPreset {
  let robloxLite = false;
  if (options.style === 'roblox') {
    if (options.mapDetailQuality === 'low') {
      robloxLite = true;
    } else if (options.mapDetailQuality === 'medium') {
      robloxLite = hexCount > MAP_DETAIL_MEDIUM_HEX_THRESHOLD;
    }
  }

  switch (options.renderQuality) {
    case 'low':
      return {
        robloxLite,
        antialias: false,
        pixelRatioMax: 1.0,
        shadowsEnabled: false,
        shadowMapSize: 512,
        fogFarMul: 0.72,
      };
    case 'high':
      return {
        robloxLite,
        antialias: true,
        pixelRatioMax: 2.0,
        shadowsEnabled: true,
        shadowMapSize: 1024,
        fogFarMul: 1.0,
      };
    default:
      return {
        robloxLite,
        antialias: false,
        pixelRatioMax: 1.5,
        shadowsEnabled: false,
        shadowMapSize: 1024,
        fogFarMul: 0.9,
      };
  }
}

/**
 * Kanoniczne Y wierzchu pryzmu (height + yOffset) — źródło prawdy renderu (Maciej 2026-07-04).
 * Morze obniżone; ląd min. LAND_MIN_CLEARANCE nad morzem (woda tylko WOKÓŁ lądu, nie „pod”).
 */
export const SEA_SURFACE_TOP_Y = 0.18;
/** ZADANIE 1 (2026-07-20, kosmetyka opcjonalna): Wybrzeże = woda konsekwentnie — obniżone
 *  bliżej SEA_SURFACE_TOP_Y (płytka woda), nie „półka" lądu. Piasek na stykowych heksach
 *  prawdziwego lądu to osobna nakładka (niezmieniona). */
export const WYBRZEZE_SURFACE_TOP_Y = 0.20;
/** Min. odstęp wierzchu lądu nad taflą morza — bufor na nakładki wybrzeża/rzeki. */
export const LAND_MIN_CLEARANCE_ABOVE_SEA = 0.35;

/** Wstęga rzeki nad wierzchołkiem terenu (× promień hexa). Maciej 2026-07-09: 0.22→0.08 — po insecie
 *  wstęgi do WNĘTRZA płaskiego heksa (z dala od ściany pryzmu) duże podniesienie nie jest już potrzebne
 *  i powodowało lewitację. Rzeka na stałej płaskiej wysokości. */
export const RIVER_LIFT_ABOVE_TERRAIN_FRAC = 0.08;

export function riverSurfaceLiftY(R: number): number {
  return R * RIVER_LIFT_ABOVE_TERRAIN_FRAC;
}

/** Wysokość powierzchni hexa (height + yOffset) — Roblox: płaskie przejścia. */
export const TERRAIN_SURFACE_Y: Record<TerenBazowy, number> = {
  [TerenBazowy.Morze]: SEA_SURFACE_TOP_Y,
  [TerenBazowy.Wybrzeze]: WYBRZEZE_SURFACE_TOP_Y,
  [TerenBazowy.Laka]: SEA_SURFACE_TOP_Y + LAND_MIN_CLEARANCE_ABOVE_SEA,
  [TerenBazowy.Rownina]: SEA_SURFACE_TOP_Y + LAND_MIN_CLEARANCE_ABOVE_SEA + 0.02,
  [TerenBazowy.Pustynia]: SEA_SURFACE_TOP_Y + LAND_MIN_CLEARANCE_ABOVE_SEA + 0.08,
  [TerenBazowy.Wzgorza]: SEA_SURFACE_TOP_Y + LAND_MIN_CLEARANCE_ABOVE_SEA + 0.18,
  [TerenBazowy.Gory]: SEA_SURFACE_TOP_Y + LAND_MIN_CLEARANCE_ABOVE_SEA + 0.32,
  [TerenBazowy.Polarny]: SEA_SURFACE_TOP_Y + LAND_MIN_CLEARANCE_ABOVE_SEA + 0.04,
};

/** Głębokość pasa piasku na lądzie — ~30% promienia od krawędzi w stronę morza. */
export const LAND_COAST_SAND_FRAC = 0.30;

/** @deprecated Zastąpione przez TERRAIN_SURFACE_Y — zostaje dla starych testów/docs. */
export const LAND_HEX_Y_LIFT = 0.05;
/** @deprecated */
export const PUSTYNIA_EXTRA_Y_LIFT = 0.10;
/** @deprecated */
export const FLAT_LAND_COAST_EXTRA_Y_LIFT = 0.08;

/** Prism height/yOffset per teren — styl Roblox (minimalna różnica poziomów). */
export interface TerrainVisualSpec {
  height: number;
  yOffset: number;
}

export const ROBLOX_TERRAIN_VIS: Record<TerenBazowy, TerrainVisualSpec> = {
  [TerenBazowy.Morze]:     { height: 0.30, yOffset: 0.00 },
  /** Hybryda C — wyższy profil, mniejszy „schodek” względem lądu (top ≈ 0.40 vs ląd 0.45). */
  [TerenBazowy.Wybrzeze]:  { height: 0.30, yOffset: 0.10 },
  [TerenBazowy.Laka]:      { height: 0.38, yOffset: 0.07 },
  [TerenBazowy.Rownina]:   { height: 0.40, yOffset: 0.07 },
  /** Pustynia = profil wzgórza (Maciej 2026-07-04: nie zalewa morze). */
  [TerenBazowy.Pustynia]:  { height: 0.42, yOffset: 0.08 },
  [TerenBazowy.Wzgorza]:   { height: 0.42, yOffset: 0.08 },
  [TerenBazowy.Gory]:      { height: 0.46, yOffset: 0.12 },
  [TerenBazowy.Polarny]:   { height: 0.36, yOffset: 0.06 },
};

/** yOffset tak, by wierzchołek pryzmu = TERRAIN_SURFACE_Y (roblox) lub civ + lift. */
export function terrainVisualForStyle(
  t: TerenBazowy,
  style: MapRenderStyle,
  civ: TerrainVisualSpec,
): TerrainVisualSpec {
  const base = style === 'roblox' ? ROBLOX_TERRAIN_VIS[t] : civ;
  if (style === 'roblox') {
    const topY = TERRAIN_SURFACE_Y[t];
    return { height: base.height, yOffset: topY - base.height };
  }
  if (t === TerenBazowy.Morze || t === TerenBazowy.Wybrzeze) return base;
  return { ...base, yOffset: base.yOffset + LAND_HEX_Y_LIFT };
}

export interface TerrainHeightAuditRow {
  teren: TerenBazowy;
  topY: number;
  gapAboveSea: number;
}

export interface TerrainHeightAudit {
  style: MapRenderStyle;
  seaTopY: number;
  wybrzezeTopY: number;
  coastWaterCapTopY: number;
  land: TerrainHeightAuditRow[];
  minLandGap: number;
  violations: string[];
}

/**
 * Grubość tafli capa Wybrzeża nad poziomem morza (buildStyleCoastWaterCap: stripH=0.038,
 * base/lagoon/tongue siedzą do ~0.058 nad seaTop). Wstęga ujścia MUSI płynąć powyżej tej
 * wartości, żeby nie chować się pod jasnoniebieską taflą (B0.8b hipoteza Y-order). JEDNO ŹRÓDŁO.
 */
export const COAST_WATER_CAP_THICKNESS = 0.038 * 1.15;

/** Górna tafla capa Wybrzeża w świecie (seaTopY + grubość capa). Wstęga ujścia płynie NAD nią. */
export function coastWaterCapTopY(style: MapRenderStyle = GAME_MAP_RENDER_STYLE): number {
  return terrainSurfaceTopY(TerenBazowy.Morze, style) + COAST_WATER_CAP_THICKNESS;
}

/** Diagnostyka wysokości morze vs ląd (testy + playtest). */
export function terrainHeightAudit(style: MapRenderStyle = GAME_MAP_RENDER_STYLE): TerrainHeightAudit {
  const seaTopY = terrainSurfaceTopY(TerenBazowy.Morze, style);
  const wybrzezeTopY = terrainSurfaceTopY(TerenBazowy.Wybrzeze, style);
  const coastWaterCapTopY = seaTopY + COAST_WATER_CAP_THICKNESS;
  const dryTypes: TerenBazowy[] = [
    TerenBazowy.Laka,
    TerenBazowy.Rownina,
    TerenBazowy.Pustynia,
    TerenBazowy.Wzgorza,
    TerenBazowy.Gory,
  ];
  const land = dryTypes.map((teren) => {
    const topY = terrainSurfaceTopY(teren, style);
    return { teren, topY, gapAboveSea: topY - seaTopY };
  });
  const minLandGap = land.length > 0 ? Math.min(...land.map((r) => r.gapAboveSea)) : 0;
  const violations: string[] = [];
  if (wybrzezeTopY <= seaTopY) {
    violations.push(`wybrzeże (${wybrzezeTopY.toFixed(3)}) <= morze (${seaTopY.toFixed(3)})`);
  }
  for (const row of land) {
    if (row.gapAboveSea < LAND_MIN_CLEARANCE_ABOVE_SEA - 0.001) {
      violations.push(
        `${row.teren}: luka ${row.gapAboveSea.toFixed(3)} < min ${LAND_MIN_CLEARANCE_ABOVE_SEA}`,
      );
    }
    if (row.topY <= coastWaterCapTopY) {
      violations.push(`${row.teren}: wierzchołek <= tafla wybrzeża 3D (${coastWaterCapTopY.toFixed(3)})`);
    }
  }
  return {
    style,
    seaTopY,
    wybrzezeTopY,
    coastWaterCapTopY,
    land,
    minLandGap,
    violations,
  };
}

/** Fallback Civ — spójny ze scene.ts / cities.ts (height + yOffset → powierzchnia). */
const CIV_TERRAIN_VIS: Record<TerenBazowy, TerrainVisualSpec> = {
  [TerenBazowy.Morze]:    { height: 0.30, yOffset: 0.00 },
  [TerenBazowy.Wybrzeze]: { height: 0.35, yOffset: 0.05 },
  [TerenBazowy.Laka]:     { height: 0.40, yOffset: 0.05 },
  [TerenBazowy.Rownina]:  { height: 0.45, yOffset: 0.08 },
  [TerenBazowy.Pustynia]: { height: 0.42, yOffset: 0.08 },
  [TerenBazowy.Wzgorza]:  { height: 0.70, yOffset: 0.15 },
  [TerenBazowy.Gory]:     { height: 1.20, yOffset: 0.40 },
  [TerenBazowy.Polarny]:  { height: 0.38, yOffset: 0.06 },
};

/** Y górnej powierzchni hexa — ten sam model co buildScene (overlay zasięgu / okolica). */
export function terrainSurfaceTopY(
  teren: TerenBazowy,
  style: MapRenderStyle = GAME_MAP_RENDER_STYLE,
  extraYOffset = 0,
): number {
  const spec = terrainVisualForStyle(teren, style, CIV_TERRAIN_VIS[teren]);
  return spec.height + spec.yOffset + extraYOffset;
}

function hash2D(q: number, r: number, seed: number, salt: number): number {
  let h = (Math.imul(q | 0, 0x27d4eb2d) ^ Math.imul(r | 0, 0x165667b1) ^ Math.imul(seed | 0, 0x9e3779b1) ^ Math.imul(salt | 0, 0x85ebca6b)) >>> 0;
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d) >>> 0;
  h ^= h >>> 12;
  return (h >>> 0) / 4294967296;
}

function mat(color: number, flat = true): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color, flatShading: flat });
}

/** Deterministyczny wariant dekoracji 0–4 per hex (ten sam kształt, inna kolorystyka). */
function decorVariant5(q: number, r: number, seed: number, salt: number): number {
  return Math.floor(hash2D(q, r, seed, salt) * 5);
}

// ---------------------------------------------------------------------------
// 5 wariantów kolorystycznych — kształt bez zmian (Roblox / Minecraft)
// ---------------------------------------------------------------------------

interface TreeColorVariant {
  isPine: boolean;
  trunk: number;
  leaf1: number;
  leaf2: number;
  pineLayers: readonly [number, number, number, number];
}

/** Typy drzew: sosna ciemna, sosna chłodna, dąb, brzoza, las głęboki. */
const TREE_VARIANTS: readonly TreeColorVariant[] = [
  {
    isPine: true,
    trunk: 0x8b5a2b,
    leaf1: 0x3d6b45,
    leaf2: 0x4a7a52,
    pineLayers: [0x2d4a32, 0x3d6b45, 0x4a7a52, 0x5a8f5a],
  },
  {
    isPine: true,
    trunk: 0x6a5040,
    leaf1: 0x4a6a58,
    leaf2: 0x5a7a68,
    pineLayers: [0x3a5a48, 0x4a6a58, 0x5a7a68, 0x6a8a78],
  },
  {
    isPine: false,
    trunk: 0x7a5a32,
    leaf1: 0x5a8f5a,
    leaf2: 0x6b9f62,
    pineLayers: [0x2d4a32, 0x3d6b45, 0x4a7a52, 0x5a8f5a],
  },
  {
    isPine: false,
    trunk: 0xc4b498,
    leaf1: 0xa8d4a0,
    leaf2: 0x8fbf7a,
    pineLayers: [0x2d4a32, 0x3d6b45, 0x4a7a52, 0x5a8f5a],
  },
  {
    isPine: false,
    trunk: 0x5a4028,
    leaf1: 0x3d6b45,
    leaf2: 0x2d4a32,
    pineLayers: [0x2d4a32, 0x3d6b45, 0x4a7a52, 0x5a8f5a],
  },
];

interface MountainColorVariant {
  stoneCols: readonly number[];
  stoneDk: readonly number[];
  snowBlock: number;
  snowPeak: number;
}

/** Typy gór: granit, piaskowiec, bazalt, łupek, tuf. */
const MOUNTAIN_VARIANTS: readonly MountainColorVariant[] = [
  {
    stoneCols: [0x6a7380, 0x7a8494, 0x8899aa, 0x959eb0, 0x99aabb],
    stoneDk: [0x555d68, 0x5a6270, 0x626878],
    snowBlock: 0xf0f4fa,
    snowPeak: 0xffffff,
  },
  {
    stoneCols: [0x9a8870, 0xa89880, 0xb8a890, 0xc4b4a0, 0xd0c0ac],
    stoneDk: [0x7a6850, 0x857060, 0x907868],
    snowBlock: 0xf4eee4,
    snowPeak: 0xfff8f0,
  },
  {
    stoneCols: [0x4a5058, 0x5a6268, 0x6a7278, 0x7a8288, 0x8a9298],
    stoneDk: [0x3a4048, 0x424850, 0x4a5058],
    snowBlock: 0xe8ecf0,
    snowPeak: 0xf8fafc,
  },
  {
    stoneCols: [0x5a6878, 0x6a7888, 0x7a8898, 0x8a98a8, 0x9aa8b8],
    stoneDk: [0x4a5868, 0x526070, 0x5a6878],
    snowBlock: 0xe8f0f8,
    snowPeak: 0xf4f8ff,
  },
  {
    stoneCols: [0x8a7068, 0x9a8078, 0xaa9088, 0xbaa098, 0xcab0a8],
    stoneDk: [0x6a5048, 0x755850, 0x806058],
    snowBlock: 0xf0e8e4,
    snowPeak: 0xfff4f0,
  },
];

interface HillColorVariant {
  wall: number;
  wallDk: number;
  grassA: number;
  grassB: number;
}

/** Typy wzgórz: łąka, las, pastwisko, step, bagno. */
const HILL_VARIANTS_ROBLOX: readonly HillColorVariant[] = [
  { wall: 0x3a9e42, wallDk: 0x2f7a34, grassA: 0x55d858, grassB: 0x6ee872 },
  { wall: 0x2a6e32, wallDk: 0x1f5828, grassA: 0x3a8e42, grassB: 0x4a9e52 },
  { wall: 0x4a9e32, wallDk: 0x3a8028, grassA: 0x7ab848, grassB: 0x8ec862 },
  { wall: 0x5a7a38, wallDk: 0x4a6830, grassA: 0x6a8a48, grassB: 0x7a9a58 },
  { wall: 0x2a5a30, wallDk: 0x1f4828, grassA: 0x3a7040, grassB: 0x4a8050 },
];

const HILL_VARIANTS_MINECRAFT: readonly HillColorVariant[] = [
  { wall: 0x4a8f42, wallDk: 0x3d7238, grassA: 0x6ea855, grassB: 0x72b862 },
  { wall: 0x3a7038, wallDk: 0x2d5828, grassA: 0x5a9848, grassB: 0x62a850 },
  { wall: 0x5a9840, wallDk: 0x4a8030, grassA: 0x78b050, grassB: 0x82c058 },
  { wall: 0x587838, wallDk: 0x486830, grassA: 0x689048, grassB: 0x72a050 },
  { wall: 0x3a6838, wallDk: 0x2d5028, grassA: 0x508840, grassB: 0x589848 },
];

const MINECRAFT_MOUNTAIN_VARIANTS: readonly MountainColorVariant[] = [
  { stoneCols: [0x7a8494, 0x8899aa], stoneDk: [0x6a7380], snowBlock: 0xf0f4f8, snowPeak: 0xf0f4f8 },
  { stoneCols: [0xa89880, 0xb8a890], stoneDk: [0x9a8870], snowBlock: 0xf4eee4, snowPeak: 0xf4eee4 },
  { stoneCols: [0x5a6268, 0x6a7278], stoneDk: [0x4a5058], snowBlock: 0xe8ecf0, snowPeak: 0xe8ecf0 },
  { stoneCols: [0x6a7888, 0x7a8898], stoneDk: [0x5a6878], snowBlock: 0xe8f0f8, snowPeak: 0xe8f0f8 },
  { stoneCols: [0x9a8078, 0xaa9088], stoneDk: [0x8a7068], snowBlock: 0xf0e8e4, snowPeak: 0xf0e8e4 },
];

function robloxCliffUnder(g: THREE.Group, topY: number, R: number, seed: number): void {
  const cliffH = 0.45 + (hash2D(seed, seed, seed, 4)) * 0.35;
  const cliff = new THREE.Mesh(
    new THREE.CylinderGeometry(R * 0.92, R * 0.72, cliffH, 6),
    mat(0x7a8494),
  );
  cliff.position.y = topY - cliffH / 2 - 0.02;
  cliff.castShadow = true;
  g.add(cliff);
}

const TERRAIN_CIV: Record<TerenBazowy, number> = {
  [TerenBazowy.Morze]: 0x1f5a86,
  [TerenBazowy.Wybrzeze]: 0x46a3d6,
  [TerenBazowy.Laka]: 0x6aa53f,
  [TerenBazowy.Rownina]: 0xa9b257,
  [TerenBazowy.Pustynia]: 0xd9c179,
  [TerenBazowy.Wzgorza]: 0x4f7d34,
  [TerenBazowy.Gory]: 0x9aa1a9,
  [TerenBazowy.Polarny]: 0xe8eef5,
};

/** Piasek — cienka opaska na heksie Wybrzeże, krawędź w stronę lądu (tylko 3D). */
export const COAST_SAND_ROBLOX = 0xe8d4a0;

/** MAPA-PALETA-PASTEL-v2-warm (Maciej 2026-07-03) — earth/pastel zamiast candy Roblox. */
const TERRAIN_ROBLOX: Record<TerenBazowy, number> = {
  [TerenBazowy.Morze]: 0x5594ad,
  /** Płytka woda przy brzegu (jasnoniebieski heks + tafla 3D; piasek na krawędzi w stronę lądu). */
  [TerenBazowy.Wybrzeze]: 0x82c8e0,
  [TerenBazowy.Laka]: 0x94bf78,
  [TerenBazowy.Rownina]: 0xb0ca7e,
  [TerenBazowy.Pustynia]: 0xe0c88e,
  [TerenBazowy.Wzgorza]: 0x7ea872,
  [TerenBazowy.Gory]: 0x9da8b4,
  [TerenBazowy.Polarny]: 0xeef2f8,
};

const TERRAIN_MINECRAFT: Record<TerenBazowy, number> = {
  [TerenBazowy.Morze]: 0x2b5ea8,
  [TerenBazowy.Wybrzeze]: 0x3d8fd9,
  [TerenBazowy.Laka]: 0x5b8f3c,
  [TerenBazowy.Rownina]: 0x6ea043,
  [TerenBazowy.Pustynia]: 0xdbc35c,
  [TerenBazowy.Wzgorza]: 0x4a7a32,
  [TerenBazowy.Gory]: 0x8a9099,
  [TerenBazowy.Polarny]: 0xdce4ee,
};

export function styleTerrainColor(t: TerenBazowy, style: MapRenderStyle): number {
  if (style === 'roblox') return TERRAIN_ROBLOX[t];
  if (style === 'minecraft') return TERRAIN_MINECRAFT[t];
  return TERRAIN_CIV[t];
}

export interface StyleScenePalette {
  sky: number;
  fogColor: number;
  fogExp?: number;
  fogNear?: number;
  fogFar?: number;
  deepOcean: number;
  frame: number;
  river: number;
  riverBank: number;
  flatShading: boolean;
  antialias: boolean;
}

export function styleScenePalette(style: MapRenderStyle): StyleScenePalette {
  if (style === 'roblox') {
    return {
      sky: 0xd4e0e8,
      fogColor: 0xc8d6e0,
      fogNear: 60,
      fogFar: 680,
      deepOcean: 0x487892,
      frame: 0x9a8060,
      river: 0x6aadbe,
      riverBank: 0x5a9aa8,
      flatShading: true,
      antialias: true,
    };
  }
  if (style === 'minecraft') {
    return {
      sky: 0x78a7ff,
      fogColor: 0xc0d8ff,
      fogNear: 45,
      fogFar: 220,
      deepOcean: 0x1a4a7a,
      frame: 0x5a4a3a,
      river: 0x3a7bd5,
      riverBank: 0x2a6ab5,
      flatShading: true,
      antialias: false,
    };
  }
  return {
    sky: 0x87ceeb,
    fogColor: 0x9fcfe6,
    fogExp: 0.0075,
    deepOcean: 0x163d5c,
    frame: 0x241c12,
    river: 0x5fb4e8,
    riverBank: 0x4aa6dc,
    flatShading: false,
    antialias: true,
  };
}

export interface ForestParams {
  q: number;
  r: number;
  x: number;
  z: number;
  baseY: number;
  seed: number;
  R: number;
  mapHeight: number;
}

function addRobloxTree(
  g: THREE.Group,
  tx: number,
  tz: number,
  baseY: number,
  treeH: number,
  yaw: number,
  variant: TreeColorVariant,
  lite = false,
): void {
  const sc = lite ? 1.12 : 1.45;
  const trunkH = HEX_R * (variant.isPine ? 0.28 : 0.22) * sc;
  const trunk = new THREE.Mesh(
    new THREE.BoxGeometry(HEX_R * 0.07 * sc, trunkH, HEX_R * 0.07 * sc),
    mat(variant.trunk),
  );
  trunk.position.set(tx, baseY + trunkH / 2, tz);
  trunk.rotation.y = yaw;
  trunk.castShadow = !lite;
  g.add(trunk);

  if (variant.isPine) {
    const layers = lite ? 2 : 4;
    const coneSegs = lite ? 5 : 6;
    for (let layer = 0; layer < layers; layer++) {
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(HEX_R * (0.28 - layer * 0.045) * sc, HEX_R * 0.22 * sc, coneSegs),
        mat(variant.pineLayers[layer % variant.pineLayers.length]!),
      );
      cone.position.set(tx, baseY + trunkH * 0.15 + layer * HEX_R * 0.14 * sc, tz);
      cone.rotation.y = yaw + layer * 0.2;
      cone.castShadow = !lite;
      g.add(cone);
    }
    return;
  }

  const crowns: Array<[number, number, number, number]> = lite
    ? [[0, treeH * 0.38 * sc, 0, 0.22 * sc]]
    : [
        [0, treeH * 0.38 * sc, 0, 0.26 * sc],
        [0.06 * sc, treeH * 0.28 * sc, 0.04 * sc, 0.18 * sc],
        [-0.05 * sc, treeH * 0.32 * sc, -0.03 * sc, 0.16 * sc],
      ];
  for (let ci = 0; ci < crowns.length; ci++) {
    const [ox, oy, oz, rad] = crowns[ci]!;
    const crown = new THREE.Mesh(
      new THREE.IcosahedronGeometry(HEX_R * rad, 0),
      mat(ci === 0 ? variant.leaf1 : variant.leaf2),
    );
    crown.position.set(tx + ox, baseY + trunkH + oy, tz + oz);
    crown.castShadow = !lite;
    g.add(crown);
  }
}

/** Palma — dżungla / oaza (D-B2-3 A). */
function addRobloxPalm(
  g: THREE.Group,
  tx: number,
  tz: number,
  baseY: number,
  yaw: number,
  lite: boolean,
  variant: TreeColorVariant,
): void {
  const sc = lite ? 1.0 : 1.2;
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(HEX_R * 0.035 * sc, HEX_R * 0.05 * sc, HEX_R * 0.48 * sc, 5),
    mat(variant.trunk),
  );
  trunk.position.set(tx, baseY + HEX_R * 0.24 * sc, tz);
  trunk.castShadow = !lite;
  g.add(trunk);
  const frondGreens = [variant.leaf2, variant.leaf1, variant.pineLayers[0]!];
  const frondCount = lite ? 2 : 4;
  for (let fi = 0; fi < frondCount; fi++) {
    const fa = yaw + (fi / 4) * Math.PI * 2;
    const frond = new THREE.Mesh(
      new THREE.ConeGeometry(HEX_R * 0.14 * sc, HEX_R * 0.24 * sc, 4),
      mat(frondGreens[fi % frondGreens.length]!),
    );
    frond.position.set(tx + Math.cos(fa) * HEX_R * 0.16 * sc, baseY + HEX_R * 0.5 * sc, tz + Math.sin(fa) * HEX_R * 0.16 * sc);
    frond.rotation.z = 0.55;
    frond.rotation.y = fa;
    frond.castShadow = !lite;
    g.add(frond);
  }
}

/** Parasol dżunglowy — płaska korona. */
function addRobloxJungleUmbrella(
  g: THREE.Group,
  tx: number,
  tz: number,
  baseY: number,
  yaw: number,
  lite: boolean,
  variant: TreeColorVariant,
): void {
  const sc = lite ? 1.0 : 1.25;
  const trunkH = HEX_R * 0.38 * sc;
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(HEX_R * 0.04 * sc, HEX_R * 0.055 * sc, trunkH, 5),
    mat(variant.trunk),
  );
  trunk.position.set(tx, baseY + trunkH / 2, tz);
  trunk.castShadow = !lite;
  g.add(trunk);
  if (!lite) {
    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(HEX_R * 0.32 * sc, HEX_R * 0.28 * sc, HEX_R * 0.06 * sc, 6),
      mat(variant.leaf1),
    );
    cap.position.set(tx, baseY + trunkH + HEX_R * 0.04 * sc, tz);
    cap.rotation.y = yaw;
    cap.castShadow = true;
    g.add(cap);
  }
}

function addMinecraftSpruce(
  g: THREE.Group,
  tx: number,
  tz: number,
  baseY: number,
  tall: boolean,
  yaw: number,
  variant: TreeColorVariant,
  lite = false,
): void {
  const b = HEX_R * 0.11;
  const trunkH = lite ? 3 : (tall ? 5 : 4);
  for (let y = 1; y <= trunkH; y++) {
    const log = new THREE.Mesh(new THREE.BoxGeometry(b * 0.7, b, b * 0.7), mat(variant.trunk));
    log.position.set(tx, baseY + y * b, tz);
    log.rotation.y = yaw;
    log.castShadow = !lite;
    g.add(log);
  }
  const leafMat = mat(variant.leaf1);
  const leafLayers = lite ? 1 : (tall ? 2 : 1);
  for (let layer = 0; layer <= leafLayers; layer++) {
    const y = baseY + (trunkH + layer) * b;
    const rad = layer === 0 ? 1 : (lite ? 1 : 2);
    for (let dx = -rad; dx <= rad; dx++) {
      for (let dz = -rad; dz <= rad; dz++) {
        if (Math.abs(dx) + Math.abs(dz) > rad + 1) continue;
        if (dx === 0 && dz === 0 && layer < 1) continue;
        const leaf = new THREE.Mesh(new THREE.BoxGeometry(b, b, b), leafMat);
        leaf.position.set(tx + dx * b, y, tz + dz * b);
        leaf.castShadow = !lite;
        g.add(leaf);
      }
    }
  }
}

/** Deterministyczna liczba drzew dekoracyjnych na hex z lasem (3–5) — niezależna od robloxLite. */
export function forestTreeCountForHex(q: number, r: number, seed: number): number {
  return 3 + Math.floor(hash2D(q, r, seed, 1) * 3);
}

/** D-B2-3 A — biom ciepły: las-dżungla w pasie tropikalnym (strefa klimatu, nie hash). */
export function isWarmJungleForestHex(q: number, r: number, mapHeight: number): boolean {
  return climateZoneAt(q, r, mapHeight) === 'tropical';
}

export function jungleForestTreeCountForHex(q: number, r: number, seed: number): number {
  return 5 + Math.floor(hash2D(q, r, seed, 889) * 3);
}

/** Kępa lasu — 3–5 drzew (hash2D). lite = prostsze meshe, ta sama liczba drzew (E1). */
export function buildStyleForestCluster(style: MapRenderStyle, p: ForestParams, lite = false): THREE.Group {
  const root = new THREE.Group();
  if (style === 'civ') return root;
  const { q, r, x, z, baseY, seed, R, mapHeight } = p;
  const jungle = style === 'roblox' && isWarmJungleForestHex(q, r, mapHeight);
  const treeCount = jungle ? jungleForestTreeCountForHex(q, r, seed) : forestTreeCountForHex(q, r, seed);
  const hexTreeBias = decorVariant5(q, r, seed, 300);
  for (let ti = 0; ti < treeCount; ti++) {
    const angle = hash2D(q, r, seed, 10 + ti) * Math.PI * 2;
    const spread = (0.12 + hash2D(q, r, seed, 40 + ti) * 0.36) * R;
    const tx = x + Math.cos(angle) * spread;
    const tz = z + Math.sin(angle) * spread;
    const treeH = 0.26 + hash2D(q, r, seed, 70 + ti) * 0.30;
    const yaw = hash2D(q, r, seed, 100 + ti) * Math.PI * 2;
    const treeVariant = TREE_VARIANTS[(hexTreeBias + ti) % 5]!;
    if (style === 'roblox') {
      if (jungle) {
        const kind = hash2D(q, r, seed, 160 + ti);
        if (kind > 0.66) addRobloxPalm(root, tx, tz, baseY, yaw, lite, treeVariant);
        else if (kind > 0.33) addRobloxJungleUmbrella(root, tx, tz, baseY, yaw, lite, treeVariant);
        else addRobloxTree(root, tx, tz, baseY, treeH, yaw, treeVariant, lite);
      } else {
        addRobloxTree(root, tx, tz, baseY, treeH, yaw, treeVariant, lite);
      }
    } else {
      addMinecraftSpruce(root, tx, tz, baseY, treeH > 0.38, yaw, treeVariant, lite);
    }
  }
  return root;
}

export interface PeakParams {
  q: number;
  r: number;
  x: number;
  z: number;
  topY: number;
  seed: number;
  R: number;
}

export function buildStyleMountainPeak(style: MapRenderStyle, p: PeakParams, lite = false): THREE.Group {
  const g = new THREE.Group();
  if (style === 'civ') return g;
  const { q, r, x, z, topY, seed, R } = p;
  /** Wyrównanie do siatki hex — tylko wielokrotności 60°, bez losowego przesunięcia. */
  const hexSnap = Math.floor(hash2D(q, r, seed, 6) * 6) * (Math.PI / 3);
  g.position.set(x, 0, z);
  const mtnVariant = decorVariant5(q, r, seed, 400);

  if (style === 'roblox') {
    // GRAFIKA-3D partia TEREN: nowy zmergowany model góry (5 wariantów sylwetki,
    // vertex colors, spód y=0; HEX_R=1 = R, więc bez skalowania). Wariant i obrót
    // deterministyczne (bez zmian hasha mapy).
    const mesh = new THREE.Mesh(
      goraGeometria(wariantDlaHeksa(q, r, LICZBA_WARIANTOW_TERENU, seed)),
      TEREN_MATERIAL,
    );
    mesh.position.set(0, topY, 0);
    mesh.rotation.y = rotacjaDlaHeksa(q, r, seed);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    g.add(mesh);
  } else {
    const pal = MINECRAFT_MOUNTAIN_VARIANTS[mtnVariant]!;
    const tiers = lite ? 3 : 4;
    const tierScale = 1.25 + hash2D(q, r, seed, 5) * 0.12;
    let radius = R * 0.82;
    let y = topY;
    const b = R * 0.14 * tierScale;
    for (let i = 0; i < tiers; i++) {
      const h = b * (1.05 - i * 0.12);
      const stone = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius * 1.02, h, 6),
        mat(i === tiers - 1 ? pal.stoneCols[1]! : pal.stoneCols[0]!),
      );
      stone.position.set(0, y + h / 2, 0);
      stone.rotation.y = hexSnap;
      stone.castShadow = true;
      g.add(stone);
      y += h * 0.88;
      radius *= 0.72;
    }
    const snow = new THREE.Mesh(
      new THREE.BoxGeometry(radius * 2.1, b * 0.55, radius * 2.1),
      mat(pal.snowBlock),
    );
    snow.position.set(0, y + b * 0.3, 0);
    snow.rotation.y = hexSnap;
    g.add(snow);
  }
  return g;
}

export interface HillParams {
  q: number;
  r: number;
  x: number;
  z: number;
  baseY: number;
  seed: number;
  R: number;
}

/** Schodkowy kopiec — wspólna geometria wzgórza i ulepszenia Tarasy. */
function addSteppedTerraceHill(
  g: THREE.Group,
  p: HillParams,
  style: 'roblox' | 'minecraft',
  lite: boolean,
  mode: 'natural' | 'cultivated',
): void {
  const { q, r, x, z, baseY, seed, R } = p;
  const tiers = lite ? 3 : 5;
  /** Wyrównanie do siatki hex — bez losowego przesunięcia na heksie. */
  const yaw = Math.floor(hash2D(q, r, seed, 4) * 6) * (Math.PI / 3);

  let wallColor: number;
  let wallDk: number;
  let grassA: number;
  let grassB: number;
  let faceColor: number;

  if (mode === 'natural') {
    const hillPal = style === 'roblox'
      ? HILL_VARIANTS_ROBLOX[decorVariant5(q, r, seed, 500)]!
      : HILL_VARIANTS_MINECRAFT[decorVariant5(q, r, seed, 500)]!;
    wallColor = hillPal.wall;
    wallDk = hillPal.wallDk;
    grassA = hillPal.grassA;
    grassB = hillPal.grassB;
    faceColor = wallDk;
  } else {
    wallColor = style === 'roblox' ? 0xc4a574 : 0x9a8c70;
    wallDk = style === 'roblox' ? 0xa08050 : 0x77694f;
    grassA = style === 'roblox' ? 0x55ee55 : 0x6ea043;
    grassB = style === 'roblox' ? 0x44cc55 : 0x5b8f3c;
    faceColor = wallDk;
  }

  let radius = R * 0.9;
  let y = baseY;

  for (let i = 0; i < tiers; i++) {
    const wallH = 0.048 + (i === 0 ? 0.012 : 0);
    const wall = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius * 1.03, wallH, 6),
      mat(i % 2 ? wallColor : wallDk),
    );
    wall.position.set(x, y + wallH / 2, z);
    wall.rotation.y = yaw;
    wall.castShadow = true;
    wall.receiveShadow = true;
    g.add(wall);

    const topH = 0.028;
    const topR = radius * 0.86;
    const top = new THREE.Mesh(
      new THREE.CylinderGeometry(topR, topR, topH, 6),
      mat(i === tiers - 1 ? grassA : (i % 2 ? grassB : grassA)),
    );
    top.position.set(x, y + wallH + topH / 2, z);
    top.rotation.y = yaw;
    top.castShadow = true;
    top.receiveShadow = true;
    g.add(top);

    // Ścianka stopnia od frontu — brąz tylko na tarasach uprawnych
    if (!lite && i >= 1) {
      const face = new THREE.Mesh(
        new THREE.BoxGeometry(radius * 0.92, wallH * 1.15, 0.07),
        mat(faceColor),
      );
      face.position.set(
        x + Math.cos(yaw) * radius * 0.52,
        y + wallH / 2,
        z + Math.sin(yaw) * radius * 0.52,
      );
      face.rotation.y = yaw;
      face.castShadow = true;
      g.add(face);
    }

    y += wallH + topH;
    radius *= 0.74;
  }

  if (!lite && mode === 'cultivated') {
    const shrubCount = 1 + Math.floor(hash2D(q, r, seed, 8) * 2);
    for (let si = 0; si < shrubCount; si++) {
      const angle = yaw + hash2D(q, r, seed, 200 + si) * 0.8 - 0.4;
      const spread = hash2D(q, r, seed, 230 + si) * R * 0.22;
      const sx = x + Math.cos(angle) * spread;
      const sz = z + Math.sin(angle) * spread;
      const b = R * 0.07;
      const shrub = new THREE.Mesh(
        new THREE.BoxGeometry(b, b * 1.3, b),
        mat(style === 'roblox' ? 0x2d8a27 : 0x2d5a27),
      );
      shrub.position.set(sx, y + b * 0.5, sz);
      shrub.castShadow = true;
      g.add(shrub);
    }
  }
}

/** Ulepszenie tarasy — schodki z brązowymi murami (tryb cultivated). */
export function buildStyleTarasyTerrace(style: MapRenderStyle, lite = false, R = 1): THREE.Group {
  const g = new THREE.Group();
  if (style === 'civ') return g;
  const meshStyle = style === 'minecraft' ? 'minecraft' : 'roblox';
  addSteppedTerraceHill(
    g,
    { q: 0, r: 0, x: 0, z: 0, baseY: 0, seed: 17, R },
    meshStyle,
    lite,
    'cultivated',
  );
  return g;
}

/** Wzgórze bazowe — ten sam kształt co tarasy, kolorystyka zielona (natural). */
export function buildStyleHillBump(style: MapRenderStyle, p: HillParams, lite = false): THREE.Group {
  const g = new THREE.Group();
  if (style === 'civ') return g;

  g.position.set(p.x, 0, p.z);
  if (style === 'roblox') {
    // GRAFIKA-3D partia TEREN: nowy model wzgórza (5 wariantów sylwetki). Plateau szczytu =
    // WZGORZE_SZCZYT_Y (0.392) = styleHillBumpSurfaceY(0) — parytet z jednostkami/ulepszeniami.
    // Spód y=0, HEX_R=1. Wariant i obrót deterministyczne (bez zmian hasha mapy).
    const mesh = new THREE.Mesh(
      wzgorzeGeometria(wariantDlaHeksa(p.q, p.r, LICZBA_WARIANTOW_TERENU, p.seed)),
      TEREN_MATERIAL,
    );
    mesh.position.set(0, p.baseY, 0);
    mesh.rotation.y = rotacjaDlaHeksa(p.q, p.r, p.seed);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    g.add(mesh);
    return g;
  }
  const local: HillParams = { ...p, x: 0, z: 0 };
  addSteppedTerraceHill(g, local, 'minecraft', lite, 'natural');
  return g;
}

/** Y wierzchołka schodkowego kopca (natural/tarasy — ta sama geometria tierów). */
export function styleHillBumpSurfaceY(baseY: number, lite = false): number {
  const tiers = lite ? 3 : 5;
  let y = baseY;
  for (let i = 0; i < tiers; i++) {
    const wallH = 0.048 + (i === 0 ? 0.012 : 0);
    y += wallH + 0.028;
  }
  return y;
}

/** Y powierzchni pod ulepszeniem na szczycie góry (Roblox — spójne z buildStyleMountainPeak). */
export function styleMountainPeakSurfaceY(
  topY: number,
  q: number,
  r: number,
  seed: number,
  R: number,
  lite = false,
): number {
  // GRAFIKA-3D partia TEREN: apex nowego modelu góry = GORA_APEX_Y[wariant] nad wierzchem heksa.
  void R; void lite; // interfejs zachowany (wołane przez galleryDecorSurfaceY)
  return topY + GORA_APEX_Y[wariantDlaHeksa(q, r, LICZBA_WARIANTOW_TERENU, seed)]!;
}

/**
 * Galeria / podgląd — Y wierzchołka schodkowego kopca (komórki bez modelu / tarasy).
 * Komórki z modelem na wzg./górach: buildGalleryBuildingPad.
 */
export function galleryDecorSurfaceY(
  teren: TerenBazowy,
  hexTopY: number,
  improvementKeys: readonly string[],
  opts: { lite?: boolean; q?: number; r?: number; seed?: number; R?: number } = {},
): number {
  const lite = opts.lite ?? false;
  const q = opts.q ?? 0;
  const r = opts.r ?? 0;
  const seed = opts.seed ?? 0;
  const R = opts.R ?? 1;

  if (teren === TerenBazowy.Wzgorza && !improvementKeys.includes('tarasy')) {
    return styleHillBumpSurfaceY(hexTopY, lite);
  }
  if (teren === TerenBazowy.Gory) {
    return styleMountainPeakSurfaceY(hexTopY, q, r, seed, R, lite);
  }
  return hexTopY;
}

/** Ułamek reliefu wzgórza przy ściance heksa (sektor ~0.6–0.7 R) vs plateau szczytu. */
const WZGORZE_EDGE_RELIEF_FRAC = 0.38;

/**
 * Y osadzenia markera złoża / ulepszenia surowcowego na wzg./górach przy ściance heksa
 * (compactDepositAtEdge, buildImprovementSectored). Nie TERRAIN_SURFACE_Y (wyższe niż pryzm)
 * ani apex kopca (to centrum heksa).
 */
export function elevatedTerrainEdgeSurfaceY(
  teren: TerenBazowy,
  hexTopY: number,
): number {
  if (teren === TerenBazowy.Wzgorza) {
    return hexTopY + WZGORZE_SZCZYT_Y * WZGORZE_EDGE_RELIEF_FRAC;
  }
  if (teren === TerenBazowy.Gory) {
    return hexTopY;
  }
  return hexTopY;
}

/**
 * Galeria: szeroki płaski pad na wzgórzu/górze zamiast wąskich schodków —
 * tartak, wyrąb i inne szerokie modele nie chowają się w ściankach kopca.
 */
export function buildGalleryBuildingPad(
  teren: TerenBazowy,
  x: number,
  hexTopY: number,
  z: number,
  R: number,
  wide = false,
): { group: THREE.Group; surfaceY: number } {
  const g = new THREE.Group();
  const padH = teren === TerenBazowy.Gory ? 0.16 : 0.14;
  const topCol = teren === TerenBazowy.Gory ? 0x8899aa : styleTerrainColor(teren, 'roblox');
  const rimCol = teren === TerenBazowy.Gory ? 0x6a7380 : 0x3a9e42;
  const topR = R * (wide ? 0.99 : 0.94);
  const botR = R * (wide ? 1.0 : 0.98);

  const pad = new THREE.Mesh(
    new THREE.CylinderGeometry(topR, botR, padH, 6),
    mat(topCol),
  );
  pad.position.set(x, hexTopY + padH / 2, z);
  pad.castShadow = true;
  pad.receiveShadow = true;
  g.add(pad);

  const rim = new THREE.Mesh(
    new THREE.CylinderGeometry(R * 0.97, R * 1.0, padH * 0.32, 6),
    mat(rimCol),
  );
  rim.position.set(x, hexTopY + padH * 0.18, z);
  rim.castShadow = true;
  g.add(rim);

  return { group: g, surfaceY: hexTopY + padH };
}

/** Galeria — osadzenie fortu: wzgórze = trawiasta polana; góry = kamienna półka na szczycie. */
export function buildGalleryFortMount(
  teren: TerenBazowy.Wzgorza | TerenBazowy.Gory,
  x: number,
  hexTopY: number,
  z: number,
  R: number,
): { group: THREE.Group; surfaceY: number } {
  const g = new THREE.Group();

  if (teren === TerenBazowy.Wzgorza) {
    // Wypoziomowany pagórek — niski, trawiasty pad (fort jest mały, ~0.45 hex).
    const padH = 0.08;
    const topR = R * 0.50;
    const grass = styleTerrainColor(TerenBazowy.Wzgorza, 'roblox');
    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(topR, topR * 1.04, padH, 6),
      mat(grass),
    );
    pad.position.set(x, hexTopY + padH / 2, z);
    pad.castShadow = true;
    pad.receiveShadow = true;
    g.add(pad);
    const rim = new THREE.Mesh(
      new THREE.CylinderGeometry(topR * 1.02, topR * 1.08, padH * 0.35, 6),
      mat(0x3a9e42),
    );
    rim.position.set(x, hexTopY + padH * 0.22, z);
    rim.castShadow = true;
    g.add(rim);
    return { group: g, surfaceY: hexTopY + padH };
  }

  // Góry — wąska kamienna półka osadzona w szczycie (mniejsza średnica, wyższy filar skalny).
  const padH = 0.11;
  const topR = R * 0.44;
  const stone = 0x8899aa;
  const stoneDk = 0x5a6270;
  const embed = new THREE.Mesh(
    new THREE.CylinderGeometry(topR * 1.15, topR * 1.28, padH * 0.5, 6),
    mat(stoneDk),
  );
  embed.position.set(x, hexTopY + padH * 0.25, z);
  embed.castShadow = true;
  embed.receiveShadow = true;
  g.add(embed);
  const shelf = new THREE.Mesh(
    new THREE.CylinderGeometry(topR, topR * 0.88, padH * 0.5, 6),
    mat(stone),
  );
  shelf.position.set(x, hexTopY + padH * 0.72, z);
  shelf.castShadow = true;
  shelf.receiveShadow = true;
  g.add(shelf);
  return { group: g, surfaceY: hexTopY + padH };
}

/** Piasek plaży — alias (buildStyleBeachRing / klocki brzegu). */
export function buildStyleBeachRing(style: MapRenderStyle, x: number, topY: number, z: number, R: number): THREE.Group {
  const g = new THREE.Group();
  if (style === 'civ') return g;
  const sand = style === 'roblox' ? COAST_SAND_ROBLOX : 0xdbc35c;
  const ring = new THREE.Mesh(
    new THREE.CylinderGeometry(R * 0.92, R * 0.96, R * 0.045, 6),
    mat(sand),
  );
  ring.position.set(x, topY + R * 0.022, z);
  ring.receiveShadow = true;
  g.add(ring);
  return g;
}

/** 6 kierunków sąsiedztwa aksjalnego (pointy-top) — jak w scene.ts. */
const AXIAL_NEIGHBORS: ReadonlyArray<readonly [number, number]> = [
  [1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1],
];

export interface CoastSandParams {
  map: GameMap;
  q: number;
  r: number;
  x: number;
  z: number;
  topY: number;
  R: number;
  self: TerenBazowy;
}

function isDryLandTeren(tb: TerenBazowy): boolean {
  return tb !== TerenBazowy.Morze && tb !== TerenBazowy.Wybrzeze;
}

export { isDryLandTeren as isDryLandTerrain };

/** Suchy ląd z sąsiadem Wybrzeże — kandydat na nakładkę piasku (hybryda C / A). */
export function landCoastSandNeeded(map: GameMap, q: number, r: number, self: TerenBazowy): boolean {
  if (!isDryLandTeren(self)) return false;
  for (const [dq, dr] of AXIAL_NEIGHBORS) {
    if (map.hexes[`${q + dq},${r + dr}`]?.terenBazowy === TerenBazowy.Wybrzeze) return true;
  }
  return false;
}

/** Wszystkie hexy lądu sąsiadujące z Wybrzeżem (test / diagnostyka). */
export function findLandCoastSandCandidates(map: GameMap): string[] {
  const out: string[] = [];
  for (const hex of Object.values(map.hexes)) {
    const { q, r } = hex.coords;
    if (landCoastSandNeeded(map, q, r, hex.terenBazowy)) out.push(`${q},${r}`);
  }
  return out;
}

function hasMorzeNeighbor(map: GameMap, q: number, r: number): boolean {
  for (const [dq, dr] of AXIAL_NEIGHBORS) {
    if (map.hexes[`${q + dq},${r + dr}`]?.terenBazowy === TerenBazowy.Morze) return true;
  }
  return false;
}

/** Wybrzeże u ujścia rzeki (ostatnie ~8 heksów ścieżki). */
export function findRiverMouthWybrzeze(
  map: GameMap,
  path: Array<{ q: number; r: number }>,
): { q: number; r: number } | null {
  if (path.length < 1) return null;

  for (let i = path.length - 1; i >= Math.max(0, path.length - 8); i--) {
    const pt = path[i]!;
    const h = map.hexes[`${pt.q},${pt.r}`];
    if (!h) continue;
    if (h.terenBazowy === TerenBazowy.Wybrzeze) return pt;
  }

  for (let i = path.length - 1; i >= Math.max(0, path.length - 8); i--) {
    const pt = path[i]!;
    const h = map.hexes[`${pt.q},${pt.r}`];
    if (!h || !isDryLandTeren(h.terenBazowy)) continue;
    const prev = i >= 1 ? path[i - 1]! : null;
    let bestWy: { q: number; r: number } | null = null;
    let bestScore = -Infinity;
    for (const [dq, dr] of AXIAL_NEIGHBORS) {
      const nq = pt.q + dq;
      const nr = pt.r + dr;
      const nh = map.hexes[`${nq},${nr}`];
      if (nh?.terenBazowy !== TerenBazowy.Wybrzeze) continue;
      let score = 1;
      if (prev) score = (nq - pt.q) * (pt.q - prev.q) + (nr - pt.r) * (pt.r - prev.r);
      if (score > bestScore) {
        bestScore = score;
        bestWy = { q: nq, r: nr };
      }
    }
    if (bestWy) return bestWy;
  }

  for (let i = path.length - 1; i >= Math.max(0, path.length - 8); i--) {
    const pt = path[i]!;
    const h = map.hexes[`${pt.q},${pt.r}`];
    if (h?.terenBazowy !== TerenBazowy.Morze) continue;
    for (const [dq, dr] of AXIAL_NEIGHBORS) {
      const nh = map.hexes[`${pt.q + dq},${pt.r + dr}`];
      if (nh?.terenBazowy === TerenBazowy.Wybrzeze) return { q: pt.q + dq, r: pt.r + dr };
    }
  }

  return null;
}

/**
 * Czy ostatni hex trasy (lub jego sąsiad) to woda otwarta — trasa realnie kończy w morzu.
 * B0.7: dekor ujścia TYLKO dla tras kończących w morzu, nie dla dopływów (junction).
 */
function pathReachesOpenSea(map: GameMap, path: Array<{ q: number; r: number }>): boolean {
  if (path.length < 1) return false;
  const last = path[path.length - 1]!;
  const lastH = map.hexes[`${last.q},${last.r}`];
  if (!lastH) return false;
  // ostatni hex to woda, albo Wybrzeże graniczące z Morzem, albo ląd stykający się z Wybrzeżem+Morzem
  if (lastH.terenBazowy === TerenBazowy.Morze) return true;
  if (lastH.terenBazowy === TerenBazowy.Wybrzeze) return hasMorzeNeighbor(map, last.q, last.r);
  for (const [dq, dr] of AXIAL_NEIGHBORS) {
    const nh = map.hexes[`${last.q + dq},${last.r + dr}`];
    if (nh?.terenBazowy === TerenBazowy.Wybrzeze && hasMorzeNeighbor(map, last.q + dq, last.r + dr)) {
      return true;
    }
  }
  return false;
}

/**
 * Delta A — fan 2–3 heksów Wybrzeże u ujścia rzeki (jaśniejsza woda, poziom tafli).
 * B0.7 (2026-07-05): delta WYŁĄCZNIE dla tras 'main' kończących w morzu; dopływy (junction)
 * i trasy niesięgające morza — zero dekoru brzegowego. Ujścia bliżej niż 3 hex scalone.
 */
export function computeRiverDeltaHexKeys(map: GameMap, maxHexes = 3): Set<string> {
  const keys = new Set<string>();
  const paths = map.riverPaths ?? [];
  const kinds = map.riverPathKinds ?? paths.map(() => 'main' as const);
  const usedMouths: Array<{ q: number; r: number }> = [];
  for (let pi = 0; pi < paths.length; pi++) {
    const path = paths[pi]!;
    if ((kinds[pi] ?? 'main') !== 'main') continue;      // dopływ → koniec na junction, bez delty
    if (!pathReachesOpenSea(map, path)) continue;         // trasa niekończąca w morzu → bez delty
    const mouth = findRiverMouthWybrzeze(map, path);
    if (!mouth) continue;

    const startKey = `${mouth.q},${mouth.r}`;
    if (map.hexes[startKey]?.terenBazowy !== TerenBazowy.Wybrzeze) continue;
    // anty-kolizja: pomiń ujście bliżej niż 3 hex od już zakwalifikowanego (scal do jednego)
    let tooClose = false;
    for (const m of usedMouths) {
      const dq = m.q - mouth.q;
      const dr = m.r - mouth.r;
      if ((Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2 < 3) { tooClose = true; break; }
    }
    if (tooClose) continue;
    usedMouths.push({ q: mouth.q, r: mouth.r });

    const queue: Array<{ q: number; r: number }> = [mouth];
    keys.add(startKey);
    let mouthCount = 1; // limit maxHexes liczony PER-ujście (nie globalnie)

    while (queue.length > 0 && mouthCount < maxHexes) {
      const cur = queue.shift()!;
      const scored: Array<{ q: number; r: number; score: number }> = [];
      for (const [dq, dr] of AXIAL_NEIGHBORS) {
        const nq = cur.q + dq;
        const nr = cur.r + dr;
        const nk = `${nq},${nr}`;
        if (keys.has(nk)) continue;
        const nh = map.hexes[nk];
        if (nh?.terenBazowy !== TerenBazowy.Wybrzeze) continue;
        let score = hasMorzeNeighbor(map, nq, nr) ? 3 : 1;
        if (path.some(p => p.q === nq && p.r === nr)) score += 2;
        scored.push({ q: nq, r: nr, score });
      }
      scored.sort((a, b) => b.score - a.score);
      for (const c of scored) {
        if (mouthCount >= maxHexes) break;
        keys.add(`${c.q},${c.r}`);
        queue.push({ q: c.q, r: c.r });
        mouthCount++;
      }
    }
  }
  return keys;
}

/**
 * Opaska piasku na heksie Wybrzeże — pełna górna powierzchnia (hybryda B).
 */
export function buildStyleCoastSandTopCap(
  style: MapRenderStyle,
  x: number,
  topY: number,
  z: number,
  R: number,
  lite = false,
): THREE.Mesh | null {
  if (style !== 'roblox') return null;
  const capH = lite ? R * 0.048 : R * 0.058;
  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(R * 0.90, R * 0.93, capH, 6),
    mat(COAST_SAND_ROBLOX),
  );
  cap.position.set(x, topY + capH * 0.52 + 0.012, z);
  cap.receiveShadow = true;
  cap.castShadow = !lite;
  cap.renderOrder = 2;
  return cap;
}

/**
 * Piasek na suchym lądzie — pas ~30% promienia od krawędzi w stronę Wybrzeża (hybryda A).
 */
export function buildStyleLandCoastSandCap(
  style: MapRenderStyle,
  p: CoastSandParams,
  lite = false,
): THREE.Group {
  const g = new THREE.Group();
  if (style !== 'roblox' || !isDryLandTeren(p.self)) return g;

  const { map, q, r, x, z, topY, R } = p;
  const sandColor = COAST_SAND_ROBLOX;
  const apothem = R * (Math.sqrt(3) / 2);
  const edgeLen = R * 1.02;
  const stripDepth = R * LAND_COAST_SAND_FRAC;
  /** Cienka skórka na wierzchu lądu — bez wrażenia wydmy (Maciej 2026-07-03). */
  const stripH = lite ? R * 0.010 : R * 0.013;
  const flushLift = 0.002;

  for (const [dq, dr] of AXIAL_NEIGHBORS) {
    const lq = q + dq;
    const lr = r + dr;
    const nbHex = map.hexes[`${lq},${lr}`];
    if (nbHex?.terenBazowy !== TerenBazowy.Wybrzeze) continue;

    const nbWorld = axialToWorld(lq, lr, R);
    const dx = nbWorld.x - x;
    const dz = nbWorld.z - z;
    const dist = Math.hypot(dx, dz) || 1;
    const nx = dx / dist;
    const nz = dz / dist;
    const edgeDist = apothem;
    const ex = x + nx * (edgeDist - stripDepth * 0.52);
    const ez = z + nz * (edgeDist - stripDepth * 0.52);
    const yaw = Math.atan2(nx, nz);

    const sand = new THREE.Mesh(
      new THREE.BoxGeometry(edgeLen, stripH, stripDepth),
      mat(sandColor),
    );
    sand.position.set(ex, topY + flushLift + stripH * 0.5, ez);
    sand.rotation.y = yaw;
    sand.receiveShadow = true;
    sand.castShadow = false;
    sand.renderOrder = 3;
    g.add(sand);
  }
  return g;
}

/**
 * Opaska piasku na heksie Wybrzeże — krawędź w stronę lądu (uzupełnienie pełnej tafli piasku).
 */
function coastEdgeNeedsSand(self: TerenBazowy, neighbor: TerenBazowy | null): boolean {
  if (self !== TerenBazowy.Wybrzeze) return false;
  return neighbor !== null && isDryLandTeren(neighbor);
}

/**
 * Krawędź ujścia rzeki (ląd→Wybrzeże) — tylko tam pomijamy piasek.
 */
function riverMouthEdgeKeys(map: GameMap): Set<string> {
  const keys = new Set<string>();
  for (const path of map.riverPaths ?? []) {
    if (path.length < 1) continue;
    const last = path[path.length - 1]!;
    const lastH = map.hexes[`${last.q},${last.r}`];
    if (!lastH) continue;
    const prev = path.length >= 2 ? path[path.length - 2]! : null;

    if (lastH.terenBazowy === TerenBazowy.Wybrzeze && prev) {
      keys.add(`${prev.q},${prev.r}|${last.q},${last.r}`);
      continue;
    }
    if (!isDryLandTeren(lastH.terenBazowy)) continue;

    let bestWy: { q: number; r: number } | null = null;
    let bestScore = -Infinity;
    for (const [dq, dr] of AXIAL_NEIGHBORS) {
      const nq = last.q + dq;
      const nr = last.r + dr;
      const nh = map.hexes[`${nq},${nr}`];
      if (nh?.terenBazowy !== TerenBazowy.Wybrzeze) continue;
      let score = 1;
      if (prev) score = (nq - last.q) * (last.q - prev.q) + (nr - last.r) * (last.r - prev.r);
      if (score > bestScore) {
        bestScore = score;
        bestWy = { q: nq, r: nr };
      }
    }
    if (bestWy) keys.add(`${last.q},${last.r}|${bestWy.q},${bestWy.r}`);
  }
  return keys;
}

/**
 * Piasek NA krawędzi wspólnej z lądem — styk z lądem, bez płytkiej wody między.
 */
export function buildStyleCoastSandEdges(
  style: MapRenderStyle,
  p: CoastSandParams,
  lite = false,
): THREE.Group {
  const g = new THREE.Group();
  if (style !== 'roblox') return g;
  const { map, q, r, x, z, topY, R, self } = p;
  const sandColor = COAST_SAND_ROBLOX;
  const apothem = R * (Math.sqrt(3) / 2);
  const edgeLen = R * 1.02;
  const stripDepth = lite ? R * 0.10 : R * 0.12;
  const stripH = R * 0.065;
  const mouthEdges = riverMouthEdgeKeys(map);

  for (const [dq, dr] of AXIAL_NEIGHBORS) {
    const lq = q + dq;
    const lr = r + dr;
    const nbHex = map.hexes[`${lq},${lr}`];
    const nbTeren = nbHex?.terenBazowy ?? null;
    if (!coastEdgeNeedsSand(self, nbTeren)) continue;
    if (mouthEdges.has(`${lq},${lr}|${q},${r}`)) continue;

    const nbWorld = axialToWorld(lq, lr, R);
    const dx = nbWorld.x - x;
    const dz = nbWorld.z - z;
    const dist = Math.hypot(dx, dz) || 1;
    const nx = dx / dist;
    const nz = dz / dist;
    // Środek pasa tuż za krawędzią wspólną — piasek zaczyna się na styku z lądem.
    const edgeDist = apothem;
    const ex = x + nx * (edgeDist + stripDepth * 0.48);
    const ez = z + nz * (edgeDist + stripDepth * 0.48);
    const yaw = Math.atan2(nx, nz);

    const sand = new THREE.Mesh(
      new THREE.BoxGeometry(edgeLen, stripH, stripDepth),
      mat(sandColor),
    );
    sand.position.set(ex, topY + stripH * 0.52 + 0.014, ez);
    sand.rotation.y = yaw;
    sand.receiveShadow = true;
    sand.castShadow = !lite;
    sand.renderOrder = 3;
    g.add(sand);
  }
  return g;
}

/** Jasnoniebieska tafla — tylko od strony Morza (kierunek brzegu), nie pod piaskiem przy lądzie. */
export function buildStyleCoastWaterCap(
  style: MapRenderStyle,
  map: GameMap,
  q: number,
  r: number,
  x: number,
  z: number,
  seaTopY: number,
  R: number,
  opts: { lite?: boolean; deltaKeys?: Set<string>; isDelta?: boolean } = {},
): THREE.Group {
  const g = new THREE.Group();
  if (style !== 'roblox') return g;

  const lite = opts.lite ?? false;
  const waterColor = TERRAIN_ROBLOX[TerenBazowy.Wybrzeze];
  const deepWaterColor = 0x163d5c;
  const apothem = R * (Math.sqrt(3) / 2);
  const edgeLen = R * 1.04;
  const isDelta = opts.isDelta ?? opts.deltaKeys?.has(`${q},${r}`) ?? false;
  const stripDepth = isDelta ? R * 0.62 : R * 0.50;
  const stripH = lite ? 0.028 : 0.038;
  const mouthEdges = riverMouthEdgeKeys(map);

  // Płytkie wypełnienie heksu (po ukryciu pryzmatu Wybrzeże — bez „dziur” do głębokiej tafli).
  if (!isDelta) {
    const basePool = new THREE.Mesh(
      new THREE.CylinderGeometry(R * 0.91, R * 0.93, stripH * 1.15, 6),
      mat(waterColor),
    );
    basePool.position.set(x, seaTopY + stripH * 0.55, z);
    basePool.receiveShadow = true;
    basePool.renderOrder = 0;
    g.add(basePool);
  }

  for (const [dq, dr] of AXIAL_NEIGHBORS) {
    const lq = q + dq;
    const lr = r + dr;
    const nbHex = map.hexes[`${lq},${lr}`];
    const nbTeren = nbHex?.terenBazowy ?? null;
    if (nbTeren !== TerenBazowy.Morze) continue;
    if (mouthEdges.has(`${lq},${lr}|${q},${r}`)) continue;

    const nbWorld = axialToWorld(lq, lr, R);
    const dx = nbWorld.x - x;
    const dz = nbWorld.z - z;
    const dist = Math.hypot(dx, dz) || 1;
    const nx = dx / dist;
    const nz = dz / dist;
    const ex = x + nx * (apothem + stripDepth * 0.42);
    const ez = z + nz * (apothem + stripDepth * 0.42);
    const yaw = Math.atan2(nx, nz);

    const water = new THREE.Mesh(
      new THREE.BoxGeometry(edgeLen, stripH, stripDepth),
      mat(deepWaterColor),
    );
    water.position.set(ex, seaTopY + stripH * 0.52 + 0.014, ez);
    water.rotation.y = yaw;
    water.receiveShadow = true;
    water.renderOrder = 1;
    g.add(water);
  }

  if (isDelta) {
    // Mielizna — pełna tafla płytkiej wody (zamiast samego piasku u ujścia).
    const lagoon = new THREE.Mesh(
      new THREE.CylinderGeometry(R * 0.86, R * 0.88, stripH * 1.35, 6),
      mat(waterColor),
    );
    lagoon.position.set(x, seaTopY + stripH * 0.58 + 0.012, z);
    lagoon.receiveShadow = true;
    lagoon.renderOrder = 1;
    g.add(lagoon);

    // Język estuary w stronę Morza — wizualne połączenie z oceanem.
    let bestSea: { nx: number; nz: number } | null = null;
    let bestScore = -Infinity;
    for (const [dq, dr] of AXIAL_NEIGHBORS) {
      const nbHex = map.hexes[`${q + dq},${r + dr}`];
      if (nbHex?.terenBazowy !== TerenBazowy.Morze) continue;
      const nbWorld = axialToWorld(q + dq, r + dr, R);
      const dx = nbWorld.x - x;
      const dz = nbWorld.z - z;
      const dist = Math.hypot(dx, dz) || 1;
      const score = 1 / dist;
      if (score > bestScore) {
        bestScore = score;
        bestSea = { nx: dx / dist, nz: dz / dist };
      }
    }
    if (bestSea) {
      const tongueLen = R * 1.22;
      const tongueW = R * 0.78;
      const tongue = new THREE.Mesh(
        new THREE.BoxGeometry(tongueW, stripH * 1.25, tongueLen),
        mat(waterColor),
      );
      const ex = x + bestSea.nx * (apothem + tongueLen * 0.44);
      const ez = z + bestSea.nz * (apothem + tongueLen * 0.44);
      tongue.position.set(ex, seaTopY + stripH * 0.58 + 0.014, ez);
      tongue.rotation.y = Math.atan2(bestSea.nx, bestSea.nz);
      tongue.receiveShadow = true;
      tongue.renderOrder = 1;
      g.add(tongue);
    }
  }

  return g;
}

export function buildStyleDune(style: MapRenderStyle, q: number, r: number, x: number, z: number, baseY: number, seed: number, R: number): THREE.Group | null {
  if (style === 'civ') return null;
  if (hash2D(q, r, seed, 9) >= 0.34) return null;
  const g = new THREE.Group();
  const duneH = 0.06 + hash2D(q, r, seed, 11) * 0.10;
  const duneW = 0.7 + hash2D(q, r, seed, 12) * 0.5;
  const dAng = hash2D(q, r, seed, 13) * Math.PI * 2;
  const dOff = hash2D(q, r, seed, 14) * R * 0.25;
  const sand = style === 'roblox' ? 0xffd54a : 0xc9a861;
  const px = x + Math.cos(dAng) * dOff;
  const pz = z + Math.sin(dAng) * dOff;

  if (style === 'roblox') {
    const dune = new THREE.Mesh(new THREE.IcosahedronGeometry(R * 0.35 * duneW, 0), mat(sand));
    dune.position.set(px, baseY + duneH, pz);
    dune.scale.y = duneH / 0.25;
    dune.castShadow = true;
    g.add(dune);
  } else {
    const b = R * 0.1;
    const dune = new THREE.Mesh(new THREE.BoxGeometry(b * duneW * 2, b, b * duneW), mat(sand));
    dune.position.set(px, baseY + b / 2, pz);
    dune.rotation.y = dAng;
    dune.castShadow = true;
    g.add(dune);
  }
  return g;
}

export function buildStyleOasis(
  style: MapRenderStyle,
  x: number,
  z: number,
  baseY: number,
  R: number,
  palmCount: number,
  rnd: () => number,
): THREE.Group {
  const g = new THREE.Group();
  if (style === 'civ') return g;
  const water = style === 'roblox' ? 0x00bfff : 0x3a7bd5;
  const pool = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.35, R * 0.35, R * 0.04, style === 'minecraft' ? 6 : 16), mat(water));
  pool.position.set(x, baseY + R * 0.02, z);
  pool.receiveShadow = true;
  g.add(pool);

  for (let pi = 0; pi < palmCount; pi++) {
    const palmAngle = rnd() * Math.PI * 2;
    const palmDist = R * (0.30 + rnd() * 0.15);
    const px = x + Math.cos(palmAngle) * palmDist;
    const pz = z + Math.sin(palmAngle) * palmDist;
    if (style === 'roblox') {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.035, R * 0.05, R * 0.5, 5), mat(0x8b5a2b));
      trunk.position.set(px, baseY + R * 0.27, pz);
      trunk.castShadow = true;
      g.add(trunk);
      for (let fi = 0; fi < 4; fi++) {
        const fa = (fi / 4) * Math.PI * 2;
        const frond = new THREE.Mesh(new THREE.ConeGeometry(R * 0.12, R * 0.22, 4), mat(0x33dd55));
        frond.position.set(px + Math.cos(fa) * R * 0.15, baseY + R * 0.52, pz + Math.sin(fa) * R * 0.15);
        frond.rotation.z = 0.6;
        frond.rotation.y = fa;
        g.add(frond);
      }
    } else {
      const b = R * 0.09;
      for (let y = 1; y <= 4; y++) {
        const log = new THREE.Mesh(new THREE.BoxGeometry(b * 0.6, b, b * 0.6), mat(0x6b4a2b));
        log.position.set(px, baseY + y * b, pz);
        g.add(log);
      }
      for (let fi = 0; fi < 4; fi++) {
        const fa = (fi / 4) * Math.PI * 2;
        const leaf = new THREE.Mesh(new THREE.BoxGeometry(b * 1.5, b * 0.4, b * 0.5), mat(0x3a8a3a));
        leaf.position.set(px + Math.cos(fa) * b, baseY + 5 * b, pz + Math.sin(fa) * b);
        leaf.rotation.y = fa;
        g.add(leaf);
      }
    }
  }
  return g;
}
