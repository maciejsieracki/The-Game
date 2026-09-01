// Stub prywatny dla citypanel-uwagi-hostcard-removed-real-render-test.cjs
// (P-BRAMKA-STUB-KOLIZJA-WSPOLDZIELONY: własny stub, nie dzielony z innymi bramkami).
// Powód: `cityPanel.ts` ciągnie transytywnie WIELE modułów UI (buildModeHud,
// sidePanelHud, icons/iconRegistry.ts z relatywnym `./brandAssets` itd.), które
// razem używają całego API `icons/brandAssets.ts` (moduł z `import.meta.glob`/
// `?raw` SVG — Vite-only, esbuild/node tego nie rozumie bez pluginu). Ten test nie
// weryfikuje ikon brandu — puste no-opy wystarczają.
export type BrandIconSize = 16 | 18 | 20 | 24 | 28 | 32 | 40 | number;
export function brandIconSvg(_id?: string, _size?: BrandIconSize): string { return ''; }
export function improvementIconSvg(_key?: string, _size?: BrandIconSize): string { return ''; }
export function mapResourceIconSvg(_key?: string, _size?: BrandIconSize): string { return ''; }
export function terrainIconSvg(_key?: string, _size?: BrandIconSize): string { return ''; }
export function buildingIconSvg(_def?: unknown, _id?: string): string { return ''; }
export function unitIconSvg(_u?: unknown, _id?: string): string { return ''; }
export function civIconSvg(_id?: string, _size?: BrandIconSize): string { return ''; }
export function epochIconSvg(_id?: string, _size?: BrandIconSize): string { return ''; }
export function settingIconSvg(_key?: string, _size?: 20 | 24): string { return ''; }
export function brandMenuComponentsCss(): string { return ''; }
export function menuIconSvg(_id?: string, _size?: BrandIconSize): string { return ''; }
export function brandMenuEmblemSvg(): string { return ''; }
export function newGameIntroEmblemSvg(_size?: 40 | 44): string { return ''; }
export function brandMotionCss(): string { return ''; }
export function brandMenuBackgroundCss(): string { return ''; }
export function svgThumbHtml(_svg?: string): string { return ''; }
