// Stub prywatny dla build-panel-ulepszenia-scroll-real-render-test.cjs
// (P-BRAMKA-STUB-KOLIZJA-WSPOLDZIELONY).
// `icons/scienceOwlIcon.ts` importuje `.svg?raw` (Vite-only) — esbuild tego nie rozumie
// bez pluginu. Test mierzy osiągalność i klikalność ostatniej pozycji listy po scrollu,
// nie ikonę sowy.
export function scienceOwlIconHtml(): string { return ''; }
// RUNDA 3 — `hudChip6c.ts` (prawdziwe chipy prawego klastra HUD, montowane teraz w scenie
// testu) importuje `scienceOwlIconSized`. Ten sam powód co wyżej: `.svg?raw` jest Vite-only.
export function scienceOwlIconSized(_size?: number): string { return ''; }
