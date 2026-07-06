/**
 * buildInfo.ts — stempel builda + marker grep w bundlu (DESIGN-RZEKI §PILNE, civ-workflow).
 * Po vite build publish script podmienia CIV-BUILD-STAMP-PENDING → data · md5.
 */

/** Grep w *.html: musi być ≥1 trafień po publishu. */
export const CIV_BUNDLE_MARKER = 'CIV-BUNDLE-MARKER-map-perf-20260705-c3';

/** Placeholder — publish-robocza-bundle.ps1 podmienia w wygenerowanym HTML. */
export const CIV_BUILD_STAMP = 'CIV-BUILD-STAMP-PENDING';

/** Linia w menu głównym (data + skrócony md5 bundla). */
export function getBuildStampLine(): string {
  return CIV_BUILD_STAMP;
}

/** Marker fazy buildScene async (verify-publish). */
export const CIV_SCENE_BUILD_HINT = 'Budowanie świata 3D';

/** Wszystkie stringi bramki publish — obiekt na window zapobiega tree-shake. */
export const CIV_PUBLISH_MARKERS = {
  bundle: CIV_BUNDLE_MARKER,
  stamp: CIV_BUILD_STAMP,
  sceneBuild: CIV_SCENE_BUILD_HINT,
  mapLoadOverlay: 'civ-map-load-overlay',
  mapLoadElapsed: 'civ-map-load-elapsed',
} as const;
