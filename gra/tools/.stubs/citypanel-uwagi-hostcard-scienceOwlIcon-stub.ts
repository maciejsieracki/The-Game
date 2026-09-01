// Stub prywatny dla citypanel-uwagi-hostcard-removed-real-render-test.cjs
// (P-BRAMKA-STUB-KOLIZJA-WSPOLDZIELONY: własny stub). `icons/scienceOwlIcon.ts`
// importuje `.svg?raw` (Vite-only), esbuild/node tego nie rozumie bez pluginu —
// ten test nie weryfikuje ikony sowy.
export const SCIENCE_OWL_SVG = '';
export function scienceOwlIconHtml(): string { return ''; }
export function scienceOwlIconSized(_size?: number): string { return ''; }
