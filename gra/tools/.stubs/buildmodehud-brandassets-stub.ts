// Stub prywatny dla build-mode-hud-affordability-test.cjs (P-BRAMKA-STUB-KOLIZJA-WSPOLDZIELONY:
// każdy test ma WŁASNY plik stub — patrz `entity-card-contract-brandAssets-stub.ts`).
// Rozszerzony (T7b KARTA-ULEPSZENIA-TERENU): `buildModeHud.ts` -> `entityCards/renderer.ts`
// (`openEntityCard`, ikonka info) -> `entityCards/registry.ts` -> `sciencePicker.ts` ->
// `scienceHubHud.ts` -> `icons/brandAssets` (import.meta.glob, Vite-only) — ten sam łańcuch
// co `tech-discovery-click-brandAssets-stub.ts`, więc ten stub potrzebuje TERAZ całego
// zestawu eksportów (przedtem wystarczał sam `improvementIconSvg`, bo `buildModeHud.ts`
// importował z `icons/brandAssets` bezpośrednio tylko tę jedną funkcję).
export function brandIconSvg(_key: string, _size?: number): string { return ''; }
export function mapResourceIconSvg(_key: string, _size?: number): string { return ''; }
export function terrainIconSvg(_key: string, _size?: number): string { return ''; }
export function buildingIconSvg(_key: string, _size?: number): string { return ''; }
export function unitIconSvg(_key: string, _size?: number): string { return ''; }
export function improvementIconSvg(_key: string, _size?: number): string { return ''; }
