// Stub prywatny dla unit-card-3d-preview-coverage-test.cjs (P-BRAMKA-STUB-KOLIZJA-WSPOLDZIELONY:
// każdy test ma WŁASNY plik stub, nie dzieli go z innymi bramkami — patrz nota w
// army-merge-dismiss-bounce-test.cjs). Powód stubowania: łańcuch importów
// registry.ts -> sciencePicker.ts -> scienceHubHud.ts -> icons/brandAssets (Vite
// `import.meta.glob`/`?raw` SVG), których esbuild/node nie rozumie bez pluginu.
// Ten test NIE testuje ikon brandu — pusty stub wystarcza. `unitMiniPreview.ts`
// (mechanizm 3D pod testem) NIE jest stubowany — to jedyny cel tego testu.
export function brandIconSvg(_key: string, _size?: number): string { return ''; }
export function mapResourceIconSvg(_key: string, _size?: number): string { return ''; }
export function terrainIconSvg(_key: string, _size?: number): string { return ''; }
export function buildingIconSvg(_key: string, _size?: number): string { return ''; }
export function unitIconSvg(_key: string, _size?: number): string { return ''; }
export function improvementIconSvg(_key: string, _size?: number): string { return ''; }
