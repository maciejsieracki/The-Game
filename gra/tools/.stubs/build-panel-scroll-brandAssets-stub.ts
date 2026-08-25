// Stub prywatny dla build-panel-ulepszenia-scroll-real-render-test.cjs
// (P-BRAMKA-STUB-KOLIZJA-WSPOLDZIELONY: każdy test ma WŁASNY plik stub — patrz
// `entity-card-contract-brandAssets-stub.ts`).
// Powód: `buildModeHud.ts` -> `icons/brandAssets` oraz łańcuch
// `entityCards/renderer.ts` -> `registry.ts` -> `sciencePicker.ts` -> `scienceHubHud.ts`
// -> `icons/brandAssets` — moduł z `import.meta.glob`/`?raw` SVG (Vite-only), którego
// esbuild nie rozumie bez pluginu. Test mierzy GEOMETRIĘ tooltipa blokady, nie ikony;
// zwracamy prosty inline-SVG o realnym rozmiarze, żeby wiersz listy miał normalną wysokość.
const BOX = '<svg viewBox="0 0 18 18" width="18" height="18"><rect width="18" height="18" fill="#e8d88a"/></svg>';
export function brandIconSvg(_key: string, _size?: number): string { return BOX; }
export function mapResourceIconSvg(_key: string, _size?: number): string { return BOX; }
export function terrainIconSvg(_key: string, _size?: number): string { return BOX; }
export function buildingIconSvg(_key: string, _size?: number): string { return BOX; }
export function unitIconSvg(_key: string, _size?: number): string { return BOX; }
export function improvementIconSvg(_key: string, _size?: number): string { return BOX; }
