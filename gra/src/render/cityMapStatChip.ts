/**
 * cityMapStatChip.ts — etykieta miasta na mapie świata (MAPA).
 * Pigułka v1 (prototyp bez Design): nazwa + populacja + obrona (3 stany) + sygnet cywu
 * + opcjonalny glif produkcji (always-on lite; pełny hover — po makiecie Design).
 */
import * as THREE from 'three';
import type { ProductionKind } from '../game/production';
import { formatWyzwienieLabel } from '../game/population-growth-v85';
import { loadImageInto, prepareSvgForCanvas, svgToDataUri } from './unitOwnerEmblem';

/** 0 = brak tarczy · 1 = palisada (szara) · 2 = mury lub cytadela (złota). */
export type CityMapDefenseTier = 0 | 1 | 2;

/** Rodzaj obwodu obronnego — ten sam union co CityWallKind w cities.ts. */
export type CityMapWallKind = 'none' | 'palisada' | 'stone';

export interface CityMapBadgeInput {
  cityName: string;
  population: number;
  defenseTier: CityMapDefenseTier;
  /** ikonaId cywilizacji (civs.json) — do klucza cache i litery na medalionie. */
  civIconId: string;
  /** Kolor właściciela (hex 0xRRGGBB) — tło medalionu cywu. */
  ownerColor?: number;
  /** Czy w kolejce jest aktywna produkcja (pierwszy element). */
  prodActive?: boolean;
  prodKind?: ProductionKind | null;
  /** id frontu kolejki (budynek.id lub jednostka Jednostka) — ikona kanoniczna z brandAssets. */
  prodId?: string | null;
  /** Poziom Wyżywienia (poziomRacji) — tylko miasta gracza. */
  growthLevel?: number | null;
  /** Ostrzeżenie surowców — rezerwa pod hover Design (v1: tylko klucz cache). */
  resourceWarning?: boolean;
  /** true = miasto-państwo → medalion tylko sygnet kultury (bez portretu władcy). */
  isCityState?: boolean;
  /** Epoka właściciela — portret władcy na medalionie (gracz + major AI). */
  era?: number;
}

const DEFENSE_COLORS: Record<1 | 2, { fill: string; stroke: string }> = {
  1: { fill: '#9a9aa8', stroke: '#c8c8d4' },
  2: { fill: '#e8d88a', stroke: '#fff4c8' },
};

const CIV_SIGIL_STROKE = '#e8d88a';
const CIV_MEDALLION_R = 16;
const CIV_SLOT_W = 38;
const PROD_SLOT_W = 20;
const GROWTH_SLOT_W = 30;

let civSigilSvgFn: ((civIconId: string) => string) | null = null;
const civSigilImageById = new Map<string, HTMLImageElement | 'loading'>();

let leaderPortraitUrlFn: ((civIconId: string, era: number) => string | null) | null = null;
const leaderPortraitImageByKey = new Map<string, HTMLImageElement | 'loading'>();

let prodIconSvgFn: ((kind: ProductionKind, id: string) => string) | null = null;
const prodIconImageByKey = new Map<string, HTMLImageElement | 'loading'>();

/**
 * Wstrzykuje SVG sygnetu cywilizacji (main.ts → civIconSvg).
 * render/ nie importuje ui/icons/brandAssets — ten sam wzorzec co unitOwnerEmblem.
 */
export function setCityMapBadgeCivSigil(fn: (civIconId: string) => string): void {
  civSigilSvgFn = fn;
  civSigilImageById.clear();
}

/**
 * Wstrzykuje URL portretu władcy (main.ts → leaderPortraitUrl).
 * Major AI + gracz: medalion pigułki; MP → tylko sygnet kultury (isCityState).
 */
export function setCityMapBadgeLeaderPortrait(
  fn: (civIconId: string, era: number) => string | null,
): void {
  leaderPortraitUrlFn = fn;
  leaderPortraitImageByKey.clear();
}

/**
 * Wstrzykuje SVG ikony produkcji (main.ts → buildingIconSvg / unitIconSvg).
 * render/ nie importuje ui/icons/brandAssets — ten sam wzorzec co sygnet cywu.
 */
export function setCityMapBadgeProdIcon(fn: (kind: ProductionKind, id: string) => string): void {
  prodIconSvgFn = fn;
  prodIconImageByKey.clear();
}

const CIV_INITIALS: Record<string, string> = {
  grecy: 'G', grecja: 'G', rzym: 'R', rzymianie: 'R', egipt: 'E', egipcjanie: 'E',
  chiny: 'C', chinczycy: 'C', persja: 'P', persowie: 'P', zulusi: 'Z', celtowie: 'K',
  germanie: 'D', hunowie: 'H', japonia: 'J', japonczycy: 'J', inkowie: 'I',
  majowie: 'M', mongolowie: 'O', arabowie: 'A', bizancjum: 'B',
};

/**
 * wallKind z listy zbudowanych budynków — ta sama logika co getWallKind w main.ts.
 */
export function wallKindFromBuilt(
  builtBuildingIds: readonly string[] | null | undefined,
): CityMapWallKind {
  const built = builtBuildingIds ?? [];
  if (built.includes('mury') || built.includes('fort')) return 'stone';
  if (built.includes('palisada')) return 'palisada';
  return 'none';
}

/** Mapowanie wallKind → tier tarczy na pigułce (Q1=A: wyłącznie z wallKind, bez maMur). */
export function defenseTierFromWallKind(kind: CityMapWallKind): CityMapDefenseTier {
  if (kind === 'stone') return 2;
  if (kind === 'palisada') return 1;
  return 0;
}

/**
 * Trzy stany obrony na pigułce.
 * tier 0 = brak tarczy · tier 1 = palisada (szara) · tier 2 = mury lub fort (złota).
 * Q1=A: wyłącznie z wallKind (lista budynków); parametr maMur jest ignorowany.
 */
export function defenseTierFromCity(
  builtBuildingIds: readonly string[] | null | undefined,
  _maMur?: boolean,
): CityMapDefenseTier {
  return defenseTierFromWallKind(wallKindFromBuilt(builtBuildingIds));
}

export function civInitialForIconId(ikonaId: string): string {
  const key = (ikonaId || '').trim().toLowerCase();
  if (!key) return '?';
  if (CIV_INITIALS[key]) return CIV_INITIALS[key]!;
  const letter = key.charAt(0).toUpperCase();
  return /[A-ZĄĆĘŁŃÓŚŹŻ]/.test(letter) ? letter : '?';
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/** Mała tarcza obrony — lewy segment pigułki (tier 0 = nie wywoływać). */
function drawDefenseShield(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  tier: 1 | 2,
): void {
  const pal = DEFENSE_COLORS[tier];
  const w = 14;
  const h = 16;
  const x = cx - w * 0.5;
  const y = cy - h * 0.5;
  ctx.beginPath();
  ctx.moveTo(cx, y);
  ctx.lineTo(x + w, y + h * 0.22);
  ctx.lineTo(x + w, y + h * 0.62);
  ctx.quadraticCurveTo(cx, y + h + 2, x, y + h * 0.62);
  ctx.lineTo(x, y + h * 0.22);
  ctx.closePath();
  ctx.fillStyle = pal.fill;
  ctx.fill();
  ctx.strokeStyle = pal.stroke;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  if (tier === 2) {
    ctx.beginPath();
    ctx.moveTo(cx, y + 3);
    ctx.lineTo(cx, y + h - 4);
    ctx.strokeStyle = 'rgba(42, 34, 8, 0.45)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawCivMedallionDisc(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  ownerColor?: number,
): void {
  const r = CIV_MEDALLION_R;
  const col = ownerColor ?? 0xffd54a;
  const rr = (col >> 16) & 0xff;
  const gg = (col >> 8) & 0xff;
  const bb = col & 0xff;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = `rgb(${Math.round(rr * 0.55)}, ${Math.round(gg * 0.55)}, ${Math.round(bb * 0.55)})`;
  ctx.fill();
  ctx.strokeStyle = '#e8d88a';
  ctx.lineWidth = 2;
  ctx.stroke();
}

interface CivMedallionContent {
  sigilImg?: HTMLImageElement;
  portraitImg?: HTMLImageElement;
  isCityState?: boolean;
}

/** Medalion — major: portret władcy (fallback sygnet); MP: tylko sygnet kultury. */
function drawCivMedallion(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  _civIconId: string,
  ownerColor?: number,
  content?: CivMedallionContent,
): void {
  drawCivMedallionDisc(ctx, cx, cy, ownerColor);
  const r = CIV_MEDALLION_R;
  const usePortrait = !content?.isCityState && content?.portraitImg;
  const img = usePortrait ? content!.portraitImg! : content?.sigilImg;
  if (img) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r - 1.5, 0, Math.PI * 2);
    ctx.clip();
    if (usePortrait) {
      const side = (r - 1.5) * 2;
      const scale = Math.max(side / img.width, side / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, cx - w / 2, cy - (r - 1.5), w, h);
    } else {
      const side = r * 1.55;
      ctx.drawImage(img, cx - side / 2, cy - side / 2, side, side);
    }
    ctx.restore();
    return;
  }
  ctx.fillStyle = CIV_SIGIL_STROKE;
  ctx.font = 'bold 20px "Segoe UI Symbol", "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('◆', cx, cy + 1);
}

function civSigilCacheKey(civIconId: string): string {
  return (civIconId || '').trim().toLowerCase() || 'unknown';
}

function requestCivSigilImage(
  civIconId: string,
  onReady: (img: HTMLImageElement) => void,
): void {
  if (!civSigilSvgFn) return;
  const key = civSigilCacheKey(civIconId);
  const cached = civSigilImageById.get(key);
  if (cached instanceof HTMLImageElement) {
    onReady(cached);
    return;
  }
  if (cached === 'loading') return;
  const raw = civSigilSvgFn(civIconId);
  const svg = prepareSvgForCanvas(raw, CIV_SIGIL_STROKE);
  if (!svg) return;
  civSigilImageById.set(key, 'loading');
  loadImageInto(svgToDataUri(svg), (img) => {
    civSigilImageById.set(key, img);
    onReady(img);
  });
}

function leaderPortraitCacheKey(civIconId: string, era: number): string {
  const e = Math.max(1, Math.round(era) || 1);
  return `${civSigilCacheKey(civIconId)}:${e}`;
}

function requestLeaderPortraitImage(
  civIconId: string,
  era: number,
  onReady: (img: HTMLImageElement) => void,
): void {
  if (!leaderPortraitUrlFn) return;
  const key = leaderPortraitCacheKey(civIconId, era);
  const cached = leaderPortraitImageByKey.get(key);
  if (cached instanceof HTMLImageElement) {
    onReady(cached);
    return;
  }
  if (cached === 'loading') return;
  const url = leaderPortraitUrlFn(civIconId, era);
  if (!url) return;
  leaderPortraitImageByKey.set(key, 'loading');
  loadImageInto(url, (img) => {
    leaderPortraitImageByKey.set(key, img);
    onReady(img);
  });
}

function prodIconCacheKey(kind: ProductionKind, id: string): string {
  return `${kind}:${(id || '').trim()}`;
}

function requestProdIconImage(
  kind: ProductionKind,
  id: string,
  onReady: (img: HTMLImageElement) => void,
): void {
  if (!prodIconSvgFn) return;
  const key = prodIconCacheKey(kind, id);
  const cached = prodIconImageByKey.get(key);
  if (cached instanceof HTMLImageElement) {
    onReady(cached);
    return;
  }
  if (cached === 'loading') return;
  const raw = prodIconSvgFn(kind, id);
  const svg = prepareSvgForCanvas(raw, '#e8d88a', 1.2);
  if (!svg) return;
  prodIconImageByKey.set(key, 'loading');
  loadImageInto(svgToDataUri(svg), (img) => {
    prodIconImageByKey.set(key, img);
    onReady(img);
  });
}

/** Ikona frontu kolejki (SVG z brandAssets) — bez generycznego trójkąta/prostokąta. */
function drawProdIcon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  img?: HTMLImageElement,
): void {
  const side = 16;
  if (!img) return;
  ctx.drawImage(img, cx - side * 0.5, cy - side * 0.5, side, side);
}

/** Kompaktowa etykieta poziomu Wyżywienia (poziomRacji) — tylko miasta gracza. */
function drawGrowthLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  cy: number,
  level: number,
): void {
  const label = `W${formatWyzwienieLabel(level)}`;
  ctx.font = '700 13px Arial, Helvetica, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#d4c48a';
  ctx.fillText(label, x, cy);
}

function truncateName(
  ctx: CanvasRenderingContext2D,
  name: string,
  maxW: number,
  font: string,
): string {
  ctx.font = font;
  if (ctx.measureText(name).width <= maxW) return name;
  let s = name;
  while (s.length > 1 && ctx.measureText(s + '…').width > maxW) {
    s = s.slice(0, -1);
  }
  return s + '…';
}

/** Rysuje pigułkę na istniejącej kanwie (async sygnet/portret — ta sama kanwa + needsUpdate). */
function paintCityMapBadgeOntoCanvas(
  canvas: HTMLCanvasElement,
  input: CityMapBadgeInput,
  medallion?: CivMedallionContent,
  prodIconImg?: HTMLImageElement,
): void {
  const pop = Math.max(1, Math.floor(input.population) || 1);
  const name = (input.cityName || 'Miasto').trim().toUpperCase();
  const popStr = String(pop);

  const padX = 10;
  const padY = 8;
  const circleD = 30;
  const gap = 8;
  const hasDefense = input.defenseTier !== 0;
  const defenseW = hasDefense ? 22 : 0;
  const civW = CIV_SLOT_W;
  const prodW = input.prodActive ? PROD_SLOT_W : 0;
  const growthW = input.growthLevel != null ? GROWTH_SLOT_W : 0;
  const nameFont = '700 22px Georgia, "Times New Roman", serif';
  const popFont = '700 16px Arial, Helvetica, sans-serif';

  const measure = document.createElement('canvas').getContext('2d')!;
  measure.font = nameFont;
  let displayName = name;
  const maxNameW = 200 - prodW - growthW;
  if (measure.measureText(name).width > maxNameW) {
    displayName = truncateName(measure, name, maxNameW, nameFont);
  }
  const nameW = measure.measureText(displayName).width;

  const leftIconsW = (hasDefense ? defenseW + gap : 0) + civW + gap;
  const midExtraW = (growthW ? gap + growthW : 0) + (prodW ? gap + prodW : 0);
  const W = Math.ceil(padX + leftIconsW + nameW + midExtraW + gap + circleD + padX);
  const H = Math.max(48, circleD + padY * 2);

  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, W, H);
  roundedRect(ctx, 2, 2, W - 4, H - 4, H * 0.45);
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, 'rgba(16, 22, 34, 0.96)');
  grad.addColorStop(1, 'rgba(8, 10, 16, 0.94)');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(232, 216, 138, 0.72)';
  ctx.lineWidth = 2;
  ctx.stroke();

  const cy = H * 0.5;
  const civCx = padX + (hasDefense ? defenseW + gap : 0) + civW * 0.5;
  if (hasDefense) {
    const shieldCx = padX + defenseW * 0.5;
    drawDefenseShield(ctx, shieldCx, cy, input.defenseTier as 1 | 2);
  }
  drawCivMedallion(ctx, civCx, cy, input.civIconId, input.ownerColor, {
  sigilImg: medallion?.sigilImg,
  portraitImg: medallion?.portraitImg,
  isCityState: input.isCityState,
});

  const nameX = padX + leftIconsW;
  ctx.font = nameFont;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#f4f0e8';
  ctx.fillText(displayName, nameX, cy);

  let afterNameX = nameX + nameW;
  if (input.growthLevel != null) {
    drawGrowthLabel(ctx, afterNameX + gap, cy, input.growthLevel);
    afterNameX += gap + growthW;
  }
  if (input.prodActive) {
    const prodCx = afterNameX + gap + prodW * 0.5;
    drawProdIcon(ctx, prodCx, cy, prodIconImg);
    afterNameX += gap + prodW;
  }

  const cx = W - padX - circleD * 0.5;
  ctx.beginPath();
  ctx.arc(cx, cy, circleD * 0.5, 0, Math.PI * 2);
  ctx.fillStyle = '#e8d88a';
  ctx.fill();

  ctx.font = popFont;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#2a2208';
  ctx.fillText(popStr, cx, cy + 1);
}

/** Canvas: [tarcza?][cyw] NAZWA [prod?] + (pop). */
export function drawCityMapBadgeCanvas(
  input: CityMapBadgeInput,
  medallion?: CivMedallionContent,
  prodIconImg?: HTMLImageElement,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  paintCityMapBadgeOntoCanvas(canvas, input, medallion, prodIconImg);
  return canvas;
}

/** @deprecated — użyj drawCityMapBadgeCanvas(CityMapBadgeInput) */
export function drawCityMapBadgeCanvasLegacy(cityName: string, population: number): HTMLCanvasElement {
  return drawCityMapBadgeCanvas({
    cityName,
    population,
    defenseTier: 0,
    civIconId: 'grecy',
  });
}

export function cityMapBadgeKey(input: CityMapBadgeInput): string;
export function cityMapBadgeKey(cityName: string, population: number): string;
export function cityMapBadgeKey(
  a: CityMapBadgeInput | string,
  population?: number,
): string {
  if (typeof a === 'string') {
    const pop = Math.max(1, Math.floor(population ?? 1) || 1);
    return `${(a || '').trim()}|${pop}`;
  }
  const pop = Math.max(1, Math.floor(a.population) || 1);
  const prod = a.prodActive
    ? `${a.prodKind ?? 'b'}:${(a.prodId || '').trim()}`
    : '-';
  const growth = a.growthLevel != null
    ? `g${formatWyzwienieLabel(a.growthLevel)}`
    : 'g-';
  const cs = a.isCityState ? 'cs1' : 'cs0';
  const era = a.era != null
    ? `e${Math.max(1, Math.round(a.era) || 1)}`
    : 'e-';
  return [
    (a.cityName || '').trim(),
    pop,
    `d${a.defenseTier}`,
    `c${(a.civIconId || '').trim().toLowerCase()}`,
    `p${prod}`,
    growth,
    `w${a.resourceWarning ? 1 : 0}`,
    cs,
    era,
  ].join('|');
}

/** @deprecated alias — używaj cityMapBadgeKey */
export const cityStatChipKey = cityMapBadgeKey;

export function makeCityMapBadgeSprite(
  input: CityMapBadgeInput,
  texCache: Map<string, THREE.CanvasTexture>,
): THREE.Sprite;
export function makeCityMapBadgeSprite(
  cityName: string,
  population: number,
  texCache: Map<string, THREE.CanvasTexture>,
): THREE.Sprite;
export function makeCityMapBadgeSprite(
  a: CityMapBadgeInput | string,
  b: Map<string, THREE.CanvasTexture> | number,
  c?: Map<string, THREE.CanvasTexture>,
): THREE.Sprite {
  const input: CityMapBadgeInput = typeof a === 'string'
    ? { cityName: a, population: b as number, defenseTier: 0, civIconId: 'grecy' }
    : a;
  const texCache = (typeof a === 'string' ? c : b) as Map<string, THREE.CanvasTexture>;

  const key = cityMapBadgeKey(input);
  let tex = texCache.get(key);
  if (!tex) {
    const canvas = document.createElement('canvas');
    paintCityMapBadgeOntoCanvas(canvas, input);
    tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    tex.colorSpace = THREE.SRGBColorSpace;
    texCache.set(key, tex);
    const repaint = (medallion?: CivMedallionContent, prodImg?: HTMLImageElement) => {
      paintCityMapBadgeOntoCanvas(tex!.image as HTMLCanvasElement, input, medallion, prodImg);
      tex!.needsUpdate = true;
    };
    let civImg: HTMLImageElement | undefined;
    let portraitImg: HTMLImageElement | undefined;
    let prodImg: HTMLImageElement | undefined;
    const medallionContent = (): CivMedallionContent => ({
      sigilImg: civImg,
      portraitImg,
      isCityState: input.isCityState,
    });
    const refreshMedallion = () => repaint(medallionContent(), prodImg);
    requestCivSigilImage(input.civIconId, (img) => {
      civImg = img;
      refreshMedallion();
    });
    if (!input.isCityState) {
      const era = input.era ?? 1;
      requestLeaderPortraitImage(input.civIconId, era, (img) => {
        portraitImg = img;
        refreshMedallion();
      });
    }
    if (input.prodActive && input.prodKind && input.prodId) {
      requestProdIconImage(input.prodKind, input.prodId, (img) => {
        prodImg = img;
        refreshMedallion();
      });
    }
  }
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthTest: false,
    toneMapped: false,
  });
  const sprite = new THREE.Sprite(mat);
  const img = tex.image as HTMLCanvasElement;
  const aspect = img.width / img.height;
  const worldH = 0.52;
  sprite.scale.set(worldH * aspect, worldH, 1);
  sprite.position.set(0, 0.92, 0);
  sprite.renderOrder = 12;
  return sprite;
}

/** @deprecated alias — używaj makeCityMapBadgeSprite */
export const makeCityStatChipSprite = makeCityMapBadgeSprite;

export function disposeCityStatChipTextures(cache: Map<string, THREE.CanvasTexture>): void {
  for (const tex of cache.values()) tex.dispose();
  cache.clear();
}
