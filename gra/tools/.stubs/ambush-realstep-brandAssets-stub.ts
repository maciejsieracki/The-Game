// Stub prywatny dla ambush-realstep-test.cjs (jeden plik stub na test, bez wspoldzielenia).
// Zastepuje ui/icons/brandAssets.ts (Vite import.meta.glob nie bundluje sie do node).
export function brandIconSvg(id: string, size?: number): string {
  return `<svg data-icon="${id}" data-size="${size ?? 24}"></svg>`;
}
export function mapResourceIconSvg(key: string, size?: number): string {
  return `<svg data-resicon="${key}" data-size="${size ?? 24}"></svg>`;
}
export function terrainIconSvg(key: string, size?: number): string {
  return `<svg data-terrain="${key}" data-size="${size ?? 24}"></svg>`;
}
export function improvementIconSvg(key: string, size?: number): string {
  return `<svg data-impr="${key}" data-size="${size ?? 24}"></svg>`;
}
export function brandIconDataUri(id: string): string { return 'data:,' + id; }
export function unitIconSvg(typeId?: unknown, size?: number): string {
  return `<svg data-unit="${typeof typeId === 'string' ? typeId : ''}" data-size="${size ?? 24}"></svg>`;
}
export function svgThumbHtml(svg: string): string { return svg; }
