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
        // Rzeki widoczne przy średnim oddaleniu — dane są w mapie, LOD 3 je chował całkowicie.
        rivers: true,
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

// ---------------------------------------------------------------------------
// BUG-ETYKIETA-MIASTA-ROZMYTA-ZOOM — LOD plakietki miasta, W DRUGĄ STRONĘ.
// / EN: city badge LOD — the OPPOSITE direction to everything above.
//
// Wszystko wyżej ODEJMUJE jakość przy ODDALANIU. Tu jest odwrotnie: przy
// ZBLIŻANIU plakietka miasta (THREE.Sprite o STAŁEJ wysokości świata
// worldH = 0,52 j.św., render/cityMapStatChip.ts) rozciąga się na ekranie
// coraz mocniej, więc jej tekstura musi DOSTAĆ więcej pikseli, nie mniej.
// / EN: zooming IN stretches the fixed-world-height badge sprite on screen,
// so its canvas needs MORE pixels — the inverse of the zoom-out ladder above.
//
// DLACZEGO PRÓG NA ODLEGŁOŚCI BEZWZGLĘDNEJ, A NIE NA znormalizowanym `t`:
// `t` dzieli przez (maxDist − minDist), a `maxDist` zależy od ROZMIARU MAPY
// (main.ts: `Math.max(320, mapSpan * 1,2)`). Ostrość na ekranie nie zależy od
// rozmiaru mapy ani grosza — zależy wyłącznie od odległości kamery, pionowego
// FOV i wysokości viewportu. Na `t` ta sama plakietka byłaby ostra na mapie
// małej i rozmyta na dużej przy DOKŁADNIE tej samej odległości kamery.
// / EN: absolute distance, not normalized t — t divides by maxDist, which
// scales with map size, while on-screen sharpness does not.
//
// SKĄD TE DWIE LICZBY (5,5 i 11 jednostek świata) — rachunek, nie gust.
// Dane: worldH = 0,52 j.św. · FOV pionowy 50° (render/scene.ts:3080) ·
// kanwa źródłowa pigułki 48 px CSS wysokości (baseH) · minDist = 8/3 ≈ 2,67
// j.św. (main.ts:1461). Wysokość świata w kadrze na odległości d wynosi
// 2·d·tan(25°) = 0,9326·d, więc pigułka zajmuje na ekranie
// H_viewport · 0,52 / (0,9326·d) ≈ H_viewport · 0,5576 / d pikseli CSS.
// Dla viewportu 900 px CSS wychodzi (px CSS / krotność rozciągnięcia kanwy 48 px):
//   d = 2,67 (minDist) → 188 px → ×3,92   ← dzisiejsze rozmycie
//   d = 5,5            →  91 px → ×1,90
//   d = 11             →  46 px → ×0,95   ← od tej odległości NIC się nie rozciąga
//   d = 20             →  25 px → ×0,52
// Stąd: ≥ 11 j.św. = poziom 0 (dzisiejsza rozdzielczość, zero regresji),
// 5,5–11 = poziom 1 (×2 pikseli), < 5,5 = poziom 2 (×3 pikseli).
// ---------------------------------------------------------------------------

/** 0 = dzisiejsza rozdzielczość kanwy · 1 = ×2 pikseli · 2 = ×3 pikseli. */
export type CityBadgeLodLevel = 0 | 1 | 2;

/** Poniżej tej odległości kamery (j.św.) plakietka dostaje poziom 2 (×3 pikseli). */
export const CITY_BADGE_LOD_NEAR_DIST = 5.5;
/** Poniżej tej odległości kamery (j.św.) plakietka dostaje poziom 1 (×2 pikseli). */
export const CITY_BADGE_LOD_MID_DIST = 11;

const CITY_BADGE_LOD_TEXTURE_SCALE: Record<CityBadgeLodLevel, number> = {
  0: 1,
  1: 2,
  2: 3,
};

/**
 * Poziom LOD plakietki z odległości kamery. Funkcja CZYSTA — sama arytmetyka,
 * bez Three.js i bez stanu; `dist` w jednostkach świata (camCtrl.getFocusState().dist).
 * / EN: pure — camera distance in world units → badge LOD level.
 */
export function cityBadgeLodLevelForDist(dist: number): CityBadgeLodLevel {
  // Niepoprawna liczba (NaN z niezainicjowanej kamery) → poziom domyślny, nigdy droższy.
  // / EN: non-finite distance falls back to the cheapest level, never the expensive one.
  if (!Number.isFinite(dist)) return 0;
  if (dist < CITY_BADGE_LOD_NEAR_DIST) return 2;
  if (dist < CITY_BADGE_LOD_MID_DIST) return 1;
  return 0;
}

/** Mnożnik rozdzielczości kanwy pigułki dla poziomu LOD (poziom 0 → 1, czyli bez zmian). */
export function cityBadgeLodTextureScale(level: number): number {
  const lv: CityBadgeLodLevel = level === 1 || level === 2 ? level : 0;
  return CITY_BADGE_LOD_TEXTURE_SCALE[lv];
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
