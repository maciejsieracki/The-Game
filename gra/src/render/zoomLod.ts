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
      };
    case 3:
      return {
        styledDecor: false,
        forestInst: false,
        forestTrunkInst: false,
        terrainDetailInst: false,
        coastDecorInst: false,
        rivers: true,
        shadows: false,
        pixelRatioMul: 0.5,
      };
    default:
      return {
        styledDecor: false,
        forestInst: false,
        forestTrunkInst: false,
        terrainDetailInst: false,
        coastDecorInst: false,
        rivers: true,
        shadows: false,
        pixelRatioMul: 0.35,
      };
  }
}

export function effectivePixelRatio(baseMax: number, mul: number): number {
  const cap = typeof window !== 'undefined' ? window.devicePixelRatio : 1;
  return Math.min(cap, Math.max(0.75, baseMax * mul));
}
