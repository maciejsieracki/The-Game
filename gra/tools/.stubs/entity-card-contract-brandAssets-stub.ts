// Stub prywatny dla entity-card-contract-test.cjs (P-BRAMKA-STUB-KOLIZJA-WSPOLDZIELONY:
// każdy test ma WŁASNY plik stub, nie dzieli go z innymi bramkami — patrz nota w
// army-merge-dismiss-bounce-test.cjs). Powód stubowania: `registry.ts` reużywa
// `sciencePicker.ts` (technology resolver, ECHO=C), które importuje `scienceHubHud.ts`
// (dla typów + `refreshScienceHubIfOpen`), które z kolei importuje `icons/brandAssets`
// — moduł z `import.meta.glob`/`?raw` SVG (Vite), których esbuild/node nie rozumie
// bez pluginu. Test kontraktu kart nie testuje ikon brandu — pusty stub wystarcza.
export function brandIconSvg(_key: string, _size?: number): string { return ''; }
export function mapResourceIconSvg(_key: string, _size?: number): string { return ''; }
export function terrainIconSvg(_key: string, _size?: number): string { return ''; }
export function buildingIconSvg(_key: string, _size?: number): string { return ''; }
export function unitIconSvg(_key: string, _size?: number): string { return ''; }
export function improvementIconSvg(_key: string, _size?: number): string { return ''; }
