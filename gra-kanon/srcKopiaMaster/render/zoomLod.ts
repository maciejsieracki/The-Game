/**
 * zoomLod.ts — progi jakości renderu w zależności od oddalenia kamery (zoom out).
 * Przy dużym zoom out ukrywamy drogie dekoracje i obniżamy pixel ratio, żeby
 * uniknąć klatkowania — bez przeliczania geometrii mapy.
 */

export type ZoomLodLevel = 0 | 1 | 2 | 3 | 4;

export interface ZoomLodFlags {
  /** Grupy 3D (drzewka, szczyty, wzgórza, brzeg…) — buildStyle* w scene.ts */
  styledDecor: boolean;
  /** Instancje koron lasu (InstancedMesh) */
  forestInst: boolean;
  /** Pnie lasu — osobna siatka */
  forestTrunkInst: boolean;
  /** Śnieg, krzewy, szczyty, wzgórza — instancje */
  terrainDetailInst: boolean;
  /** Plaża, wydmy, oazy — instancje */
  coastDecorInst: boolean;
  /** Meshe rzek (woda + brzegi) */
  rivers: boolean;
  /** Cienie kierunkowe (DirectionalLight + shadowMap) */
  shadows: boolean;
  /** Mnożnik pixelRatio względem preset.pixelRatioMax */
  pixelRatioMul: number;
  /**
   * Skalarny „budżet" gęstości dekoracji ∈ [0,1] (1 = pełna, 0 = brak).
   * A4: pojedynczy uchwyt dla integratora, gdyby chciał sterować gęstością
   * dekoru progresywnie (np. co drugi element instancji) zamiast twardego on/off
   * z pól *Inst. NIEUŻYWANY dziś przez scene.ts — pole addytywne, nie zmienia
   * obecnego renderu; scene.ts destrukturyzuje tylko potrzebne mu flagi.
   */
  decorDensity: number;
}

export function normalizedZoomT(dist: number, minDist: number, maxDist: number): number {
  const span = Math.max(1e-6, maxDist - minDist);
  return Math.min(1, Math.max(0, (dist - minDist) / span));
}

/** 5 poziomów LOD — t ∈ [0,1] od bliska do maksymalnego oddalenia. */
export function resolveZoomLodLevel(t: number): ZoomLodLevel {
  if (t < 0.20) return 0;
  if (t < 0.40) return 1;
  if (t < 0.60) return 2;
  if (t < 0.80) return 3;
  return 4;
}

export function zoomLodFlags(level: ZoomLodLevel, baseShadows: boolean): ZoomLodFlags {
  switch (level) {
    case 0:
      return {
        styledDecor: true,
        forestInst: true,
        forestTrunkInst: true,
        terrainDetailInst: true,
        coastDecorInst: true,
        rivers: true,
        shadows: baseShadows,
        pixelRatioMul: 1.0,
        decorDensity: 1.0,
      };
    case 1:
      return {
        styledDecor: true,
        forestInst: true,
        forestTrunkInst: false,
        terrainDetailInst: true,
        coastDecorInst: true,
        rivers: true,
        shadows: false,
        pixelRatioMul: 0.85,
        decorDensity: 0.85,
      };
    case 2:
      return {
        styledDecor: false,
        forestInst: true,
        forestTrunkInst: false,
        terrainDetailInst: false,
        coastDecorInst: true,
        rivers: true,
        shadows: false,
        pixelRatioMul: 0.65,
        decorDensity: 0.6,
      };
    case 3:
      return {
        styledDecor: false,
        forestInst: false,
        forestTrunkInst: false,
        terrainDetailInst: false,
        coastDecorInst: false,
        // A1a (civ-zoom-lod-a1a4): rzeki OFF na dalekim LOD — setki meshy woda+brzeg
        // to tysiące draw calli na Super Huge, a przy pixelRatio 0.5 ledwie widoczne.
        rivers: false,
        shadows: false,
        pixelRatioMul: 0.5,
        decorDensity: 0.25,
      };
    default:
      return {
        styledDecor: false,
        forestInst: false,
        forestTrunkInst: false,
        terrainDetailInst: false,
        coastDecorInst: false,
        // A1a (civ-zoom-lod-a1a4): rzeki OFF na maksymalnym oddaleniu (level 4).
        rivers: false,
        shadows: false,
        pixelRatioMul: 0.35,
        decorDensity: 0.0,
      };
  }
}

export function effectivePixelRatio(baseMax: number, mul: number): number {
  const cap = typeof window !== 'undefined' ? window.devicePixelRatio : 1;
  return Math.min(cap, Math.max(0.75, baseMax * mul));
}

/** Marker wersji tego modułu (A1+A4). Reeksportowany w wyniku zoomLodForCamera. */
export const ZOOM_LOD_MARKER = 'civ-zoom-lod-a1a4';

export interface ZoomLodResult {
  level: ZoomLodLevel;
  flags: ZoomLodFlags;
  /** Znormalizowane t ∈ [0,1] użyte do wyboru poziomu (przydatne do debug-overlay/A4). */
  t: number;
  /** Marker wykonywanego kodu — 'civ-zoom-lod-a1a4'. */
  marker: string;
}

/**
 * A4/A1: jednym wywołaniem z odległości kamery zwraca dyskretny poziom LOD (0..4)
 * i komplet flag per poziom (m.in. rivers OFF na LOD 3-4). Funkcja CZYSTA — brak
 * rand(), brak efektów Three.js, tylko arytmetyka na przekazanych liczbach.
 * Wygodna alternatywa dla ręcznego łańcucha normalizedZoomT → resolveZoomLodLevel
 * → zoomLodFlags (który scene.ts stosuje dziś w setZoomLod).
 */
export function zoomLodForCamera(
  dist: number,
  minDist: number,
  maxDist: number,
  baseShadows: boolean,
): ZoomLodResult {
  const t = normalizedZoomT(dist, minDist, maxDist);
  const level = resolveZoomLodLevel(t);
  const flags = zoomLodFlags(level, baseShadows);
  return { level, flags, t, marker: ZOOM_LOD_MARKER };
}
