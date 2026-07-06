/**
 * Assety brand-book PACZKA FINAL — sync z
 * docs/ux/claude-design/.../brand-book/eksport/ → gra/src/ui/icons/brand/
 */

import type { BuildingDef, UnitDef } from '../../data/loader';
import { categoryOf } from '../../units/setup';
import buildingMapJson from './brand/building-icon-map.json';
import civMapJson from './brand/civ-icon-map.json';
import epochMapJson from './brand/epoch-icon-map.json';
import settingMapJson from './brand/setting-icon-map.json';
import iconsManifest from './brand/icons-manifest.json';
import unitMapJson from './brand/unit-icon-map.json';
import menuEmblemSvg from './brand/menu-emblem.svg?raw';
import motionCss from './brand/motion.css?raw';
import menuBackgroundCss from './brand/menu-background.css?raw';
import menuComponentsCss from './brand/menu-components.css?raw';

const svgBySuffix = import.meta.glob('./brand/**/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

type ManifestEntry = { '24'?: string; '40'?: string; tier?: string };
type ManifestRoot = { icons: Record<string, ManifestEntry> };
type IdMapRoot = { map: Record<string, string> };

const manifest = iconsManifest as ManifestRoot;
const buildingMap = buildingMapJson as IdMapRoot;
const unitMap = unitMapJson as IdMapRoot;
const civMap = civMapJson as IdMapRoot;
const epochMap = epochMapJson as IdMapRoot;
const settingMap = settingMapJson as IdMapRoot;

function findSvgRaw(suffix: string): string {
  const norm = suffix.replace(/\\/g, '/');
  for (const [path, raw] of Object.entries(svgBySuffix)) {
    if (path.replace(/\\/g, '/').endsWith(norm)) return raw;
  }
  return '';
}

function normalizeSvg(raw: string, size?: number): string {
  if (!raw) return '';
  let out = raw
    .replace(/stroke="#e8d88a"/gi, 'stroke="currentColor"')
    .replace(/stroke-width="1\.5"/g, 'stroke-width="1.5"');
  if (size != null) {
    out = out.replace(/\swidth="[^"]*"/, ` width="${size}"`);
    out = out.replace(/\sheight="[^"]*"/, ` height="${size}"`);
  }
  return out;
}

export type BrandIconSize = 16 | 18 | 20 | 24 | 28 | 32 | 40 | number;

function manifestRel(id: string, size: BrandIconSize): string {
  const entry = manifest.icons[id];
  if (!entry) return '';
  const rel = size === 40 ? entry['40'] : entry['24'];
  if (!rel) return '';
  return rel.replace(/^eksport\/icons\//, '');
}

/** Ikona Tier 1–2 (HUD / toolbar) z manifestu. */
export function brandIconSvg(id: string, size: BrandIconSize = 24): string {
  const rel = manifestRel(id, size);
  if (rel) {
    const fromManifest = normalizeSvg(findSvgRaw(rel), size);
    if (fromManifest) return fromManifest;
  }
  const flat = normalizeSvg(findSvgRaw(`${id}.svg`), size);
  if (flat) return flat;
  const tierRel = manifestRel(id, size === 40 ? 40 : 24);
  const tierGuess = tierRel || `${id}-${size}.svg`;
  return normalizeSvg(findSvgRaw(tierGuess), size);
}

function buildingBldId(def: BuildingDef | undefined, buildingId?: string): string {
  const id = (buildingId ?? def?.id ?? '').toLowerCase();
  if (id && buildingMap.map[id]) return buildingMap.map[id]!;
  const k = (def?.kategoria ?? '').toLowerCase();
  if (k.includes('obron') || k.includes('wojsk')) return k.includes('wojsk') ? 'bld-military' : 'bld-defense';
  if (k.includes('pieniad') || k.includes('handel')) return 'bld-trade';
  if (k.includes('zywn')) return 'bld-food';
  if (k.includes('kult')) return 'bld-culture';
  if (k.includes('nauka')) return 'bld-science';
  if (k.includes('zdrow')) return 'bld-health';
  if (k.includes('produkc')) return 'bld-production';
  if (k.includes('admin')) return 'bld-admin';
  return buildingMap.map._default ?? 'bld-default';
}

/** SVG miniatury budynku @24. */
export function buildingIconSvg(def: BuildingDef | undefined, buildingId?: string): string {
  const bld = buildingBldId(def, buildingId);
  return normalizeSvg(findSvgRaw(`buildings/${bld}.svg`), 24);
}

function unitCategoryKey(u: UnitDef | undefined, id?: string, isSuper?: boolean): string {
  if (isSuper) return 'super-jednostka';
  const cat = categoryOf(u?.Jednostka ?? id ?? '', u?.['Rola (linia)'] ?? '', !!isSuper);
  return cat;
}

/** SVG miniatury jednostki @24. */
export function unitIconSvg(u: UnitDef | undefined, id?: string): string {
  const isSuper = u?.['Super-jednostka'] === 'TAK';
  const key = unitCategoryKey(u, id, isSuper);
  const unitId = unitMap.map[key] ?? unitMap.map._default ?? 'unit-default';
  return normalizeSvg(findSvgRaw(`units/${unitId}.svg`), 24);
}

function civSvgRel(ikonaId: string): string {
  const raw = civMap.map[ikonaId] ?? civMap.map._default ?? '';
  if (!raw) return '';
  return raw
    .replace(/^eksport\/icons\//, '')
    .replace(/^icons\//, '');
}

/** Medalion cywilizacji (kreator / dyplomacja) z civ-icon-map.json. */
export function civIconSvg(ikonaId: string, size: BrandIconSize = 24): string {
  const rel = civSvgRel(ikonaId);
  if (!rel) return normalizeSvg(findSvgRaw('civilizations/civ-default.svg'), size);
  const svg = normalizeSvg(findSvgRaw(rel), size);
  if (svg) return svg;
  return normalizeSvg(findSvgRaw('civilizations/civ-default.svg'), size);
}

function epochSvgRel(epochId: string): string {
  const name = epochMap.map[epochId] ?? epochMap.map._default ?? '';
  if (!name) return '';
  return `epochs/${name}.svg`;
}

/** Medalion epoki startowej (kreator krok 2) z epoch-icon-map.json. */
export function epochIconSvg(epochId: string, size: BrandIconSize = 24): string {
  const rel = epochSvgRel(epochId);
  const fallback = epochMap.map._default ?? 'epoch-kamien';
  if (!rel) return normalizeSvg(findSvgRaw(`epochs/${fallback}.svg`), size);
  const svg = normalizeSvg(findSvgRaw(rel), size);
  if (svg) return svg;
  return normalizeSvg(findSvgRaw(`epochs/${fallback}.svg`), size);
}

function settingSvgRel(key: string): string {
  const name = settingMap.map[key] ?? settingMap.map._default ?? '';
  if (!name) return '';
  return `settings/${name}.svg`;
}

/** Ikona ustawienia kreatora (krok 4) z setting-icon-map.json. */
export function settingIconSvg(key: string, size: 20 | 24 = 24): string {
  const rel = settingSvgRel(key);
  const fallback = settingMap.map._default ?? 'sett-difficulty';
  if (!rel) return normalizeSvg(findSvgRaw(`settings/${fallback}.svg`), size);
  const svg = normalizeSvg(findSvgRaw(rel), size);
  if (svg) return svg;
  return normalizeSvg(findSvgRaw(`settings/${fallback}.svg`), size);
}

export function brandMenuComponentsCss(): string {
  return menuComponentsCss;
}

/** Ikona przycisku menu (manifest menu-*). */
export function menuIconSvg(id: string, size: BrandIconSize = 24): string {
  return brandIconSvg(id, size);
}

export function brandMenuEmblemSvg(): string {
  return normalizeSvg(menuEmblemSvg, 80);
}

/** Gwiazda kompasu — kreator krok 1 intro (menu-emblem.svg). */
export function newGameIntroEmblemSvg(size: 40 | 44 = 44): string {
  return normalizeSvg(menuEmblemSvg, size);
}

export function brandMotionCss(): string {
  return motionCss;
}

export function brandMenuBackgroundCss(): string {
  return menuBackgroundCss;
}

/** HTML miniatury (panel miasta / picon). */
export function svgThumbHtml(svg: string): string {
  return svg || '';
}
