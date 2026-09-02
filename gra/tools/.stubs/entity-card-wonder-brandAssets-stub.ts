// Stub prywatny dla entity-card-wonder-test.cjs (P-BRAMKA-STUB-KOLIZJA-WSPOLDZIELONY:
// każdy test ma WŁASNY plik stub — patrz `entity-card-contract-brandAssets-stub.ts`).
// Łańcuch: `buildModeHud.ts` -> `entityCards/renderer.ts` (`openEntityCard`) ->
// `entityCards/registry.ts` -> `sciencePicker.ts` -> `scienceHubHud.ts` ->
// `icons/brandAssets` (import.meta.glob, Vite-only) — test nie ćwiczy ikon brandu.
export function brandIconSvg(_key: string, _size?: number): string { return ''; }
export function mapResourceIconSvg(_key: string, _size?: number): string { return ''; }
export function terrainIconSvg(_key: string, _size?: number): string { return ''; }
export function buildingIconSvg(_key: string, _size?: number): string { return ''; }
export function unitIconSvg(_key: string, _size?: number): string { return ''; }
export function improvementIconSvg(_key: string, _size?: number): string { return ''; }
