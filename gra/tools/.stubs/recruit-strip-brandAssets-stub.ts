// Stub prywatny dla recruit-resource-strip-real-render-test.cjs (wzorzec:
// P-BRAMKA-STUB-KOLIZJA-WSPOLDZIELONY — każdy test ma WŁASNY plik stub).
// Zastępuje TYLKO import SVG (asset .svg?raw, którego esbuild w Node nie
// obsługuje) — appendRecruitMilitaryResourceStrip pod testem NIE sprawdza
// treści SVG (to sprawdza appendCityResourceStockStrip -- nietknięty, poza
// zakresem tego tematu), tylko strukturę DOM chipów + wartości liczbowe.
export type BrandIconSize = number;
export function brandIconSvg(_key: string, _size?: number): string { return ''; }
export function mapResourceIconSvg(_key: string, _size?: number): string { return '<svg data-stub="1"></svg>'; }
export function terrainIconSvg(_key: string, _size?: number): string { return ''; }
export function buildingIconSvg(_key: string, _size?: number): string { return ''; }
export function unitIconSvg(_key: string, _size?: number): string { return ''; }
export function improvementIconSvg(_key: string, _size?: number): string { return ''; }
export function civIconSvg(_key: string, _size?: number): string { return ''; }
