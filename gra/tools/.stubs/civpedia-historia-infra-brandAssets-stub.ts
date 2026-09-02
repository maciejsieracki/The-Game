// Stub prywatny dla civpedia-historia-infra-test.cjs (P-BRAMKA-STUB-KOLIZJA-WSPOLDZIELONY:
// każdy test ma WŁASNY plik stub, nie dzieli go z innymi bramkami). Powód
// stubowania: `wikiHubHud.ts` -> `icons/wikiBookIcon.ts` -> `icons/brandAssets` —
// moduł z `import.meta.glob`/`?raw` SVG (Vite), których esbuild/node nie
// rozumie bez pluginu. Ten test nie sprawdza ikon brandu — pusty stub wystarcza.
export function brandIconSvg(_key: string, _size?: number): string { return ''; }
export function mapResourceIconSvg(_key: string, _size?: number): string { return ''; }
export function terrainIconSvg(_key: string, _size?: number): string { return ''; }
export function buildingIconSvg(_key: string, _size?: number): string { return ''; }
export function unitIconSvg(_key: string, _size?: number): string { return ''; }
export function improvementIconSvg(_key: string, _size?: number): string { return ''; }
