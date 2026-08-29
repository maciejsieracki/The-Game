// Stub prywatny dla entity-card-contract-test.cjs (P-BRAMKA-STUB-KOLIZJA-WSPOLDZIELONY,
// patrz `entity-card-contract-brandAssets-stub.ts` dla pełne uzasadnienie łańcucha
// importów). `icons/scienceOwlIcon.ts` importuje `.svg?raw` (Vite-only), esbuild/node
// tego nie rozumie bez pluginu — test kontraktu kart nie testuje ikony sowy.
export function scienceOwlIconHtml(): string { return ''; }
