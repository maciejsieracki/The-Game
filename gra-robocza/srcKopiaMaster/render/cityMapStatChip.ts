/**
 * cityMapStatChip.ts — etykieta miasta na mapie świata (MAPA).
 * Pigułka: nazwa + populacja w złotym kółku (spójne z W3 city badge w panelu miasta).
 */
import * as THREE from 'three';

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

/** Canvas: [NAZWA] + (pop) — jak mockup W3 / civ-v-w3-city-badge. */
export function drawCityMapBadgeCanvas(cityName: string, population: number): HTMLCanvasElement {
  const pop = Math.max(1, Math.floor(population) || 1);
  const name = (cityName || 'Miasto').trim().toUpperCase();
  const popStr = String(pop);

  const padX = 14;
  const padY = 7;
  const circleD = 30;
  const gap = 12;
  const nameFont = '700 22px Georgia, "Times New Roman", serif';
  const popFont = '700 16px Arial, Helvetica, sans-serif';

  const measure = document.createElement('canvas').getContext('2d')!;
  measure.font = nameFont;
  let displayName = name;
  if (measure.measureText(name).width > 220) {
    displayName = truncateName(measure, name, 220, nameFont);
  }
  const nameW = measure.measureText(displayName).width;

  const W = Math.ceil(padX + nameW + gap + circleD + padX);
  const H = Math.max(44, circleD + padY * 2);

  const canvas = document.createElement('canvas');
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

  ctx.font = nameFont;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#f4f0e8';
  ctx.fillText(displayName, padX, H * 0.5);

  const cx = W - padX - circleD * 0.5;
  const cy = H * 0.5;
  ctx.beginPath();
  ctx.arc(cx, cy, circleD * 0.5, 0, Math.PI * 2);
  ctx.fillStyle = '#e8d88a';
  ctx.fill();

  ctx.font = popFont;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#2a2208';
  ctx.fillText(popStr, cx, cy + 1);

  return canvas;
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

export function cityMapBadgeKey(cityName: string, population: number): string {
  const pop = Math.max(1, Math.floor(population) || 1);
  return `${(cityName || '').trim()}|${pop}`;
}

/** @deprecated alias — używaj cityMapBadgeKey */
export const cityStatChipKey = cityMapBadgeKey;

export function makeCityMapBadgeSprite(
  cityName: string,
  population: number,
  texCache: Map<string, THREE.CanvasTexture>,
): THREE.Sprite {
  const key = cityMapBadgeKey(cityName, population);
  let tex = texCache.get(key);
  if (!tex) {
    tex = new THREE.CanvasTexture(drawCityMapBadgeCanvas(cityName, population));
    tex.minFilter = THREE.LinearFilter;
    tex.colorSpace = THREE.SRGBColorSpace;
    texCache.set(key, tex);
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
  const worldH = 0.48;
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
