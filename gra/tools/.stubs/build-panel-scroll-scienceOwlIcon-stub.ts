// Stub prywatny dla build-panel-ulepszenia-scroll-real-render-test.cjs
// (P-BRAMKA-STUB-KOLIZJA-WSPOLDZIELONY).
// `icons/scienceOwlIcon.ts` importuje `.svg?raw` (Vite-only) — esbuild tego nie rozumie
// bez pluginu. Test mierzy osiągalność i klikalność ostatniej pozycji listy po scrollu,
// nie ikonę sowy.
export function scienceOwlIconHtml(): string { return ''; }
