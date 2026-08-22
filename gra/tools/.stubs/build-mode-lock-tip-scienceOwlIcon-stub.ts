// Stub prywatny dla build-mode-lock-tip-position-real-render-test.cjs
// (P-BRAMKA-STUB-KOLIZJA-WSPOLDZIELONY).
// `icons/scienceOwlIcon.ts` importuje `.svg?raw` (Vite-only) — esbuild tego nie rozumie
// bez pluginu. Test mierzy geometrię tooltipa blokady, nie ikonę sowy.
export function scienceOwlIconHtml(): string { return ''; }
