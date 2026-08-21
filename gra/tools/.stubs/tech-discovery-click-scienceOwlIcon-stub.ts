// Stub prywatny dla tech-discovery-card-click-test.cjs (P-BRAMKA-STUB-KOLIZJA-WSPOLDZIELONY).
// `icons/scienceOwlIcon.ts` importuje `.svg?raw` (Vite-only) -- esbuild/node tego nie
// rozumie bez pluginu. Test nie testuje ikony sowy.
export function scienceOwlIconHtml(): string { return ''; }
