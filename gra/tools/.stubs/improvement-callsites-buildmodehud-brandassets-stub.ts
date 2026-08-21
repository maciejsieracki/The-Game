// Stub prywatny dla improvement-card-callsites-test.cjs (P-BRAMKA-STUB-KOLIZJA-WSPOLDZIELONY:
// każdy test ma WŁASNY plik stub — patrz `entity-card-contract-brandAssets-stub.ts`).
// Powód: `techDiscoveryNotice.ts` -> `icons/brandAssets` (import.meta.glob, Vite-only) i
// `entityCards/registry.ts` -> `sciencePicker.ts` -> `scienceHubHud.ts` -> `icons/brandAssets`
// (ten sam łańcuch). Test klika prawdziwe przyciski akcji karty — nie testuje ikon brandu.
export function brandIconSvg(_key: string, _size?: number): string { return ''; }
export function mapResourceIconSvg(_key: string, _size?: number): string { return ''; }
export function terrainIconSvg(_key: string, _size?: number): string { return ''; }
export function buildingIconSvg(_key: string, _size?: number): string { return ''; }
export function unitIconSvg(_key: string, _size?: number): string { return ''; }
export function improvementIconSvg(_key: string, _size?: number): string { return ''; }
