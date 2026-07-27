/**
 * unitOwnerMedallion.ts
 *
 * Medalion właściciela po LEWEJ stronie żetonu jednostki (C-OBCE-JEDN-Q2, Maciej 2026-07-27):
 *   pełna cywilizacja → portret władcy (leaderPortraitUrl)
 *   miasto-państwo    → sygnet kultury (civIconSvg)
 *   barbarzyńca       → czaszka (brandIconSvg chip-death)
 *
 * Okrągły kadr + obwódka w kolorze cywilizacji (parytet dip-leader-medallion).
 * PARYTET AI: resolver zwraca dane per ownerId — render nie rozróżnia gracza od AI.
 */

import * as THREE from 'three';
import { HEX_R } from './hexutil';
import { VETERAN_BADGE_RESERVED_Y } from './unitUpgradeBadges';
import { STAR_TILT_RAD } from './unitVeteranBadges';
import { leaderPortraitUrl } from '../ui/leaderPortraits';
import { brandIconSvg, civIconSvg } from '../ui/icons/brandAssets';

export interface OwnerMedallionInfo {
  civIconId: string;
  era: number;
  isCityState: boolean;
  isBarbarian: boolean;
}

export type OwnerMedallionResolver = (ownerId: number) => OwnerMedallionInfo;

let medallionResolver: OwnerMedallionResolver = () => ({
  civIconId: 'grecy',
  era: 1,
  isCityState: false,
  isBarbarian: false,
});

export function setOwnerMedallionResolver(fn: OwnerMedallionResolver): void {
  medallionResolver = fn;
}

const MEDALLION_X = -0.36 * HEX_R;
const MEDALLION_SCALE = 0.34;
const CANVAS_SIZE = 64;
const BORDER_PX = 3;

const UD_STATE = 'ownerMedallionState';
const UD_GROUP = 'ownerMedallionGroup';

const medallionTexCache = new Map<string, THREE.CanvasTexture>();

function hexColor(c: number): string {
  return `#${c.toString(16).padStart(6, '0')}`;
}

function stateKey(info: OwnerMedallionInfo, ownerColor: number): string {
  const mode = info.isBarbarian ? 'barb' : info.isCityState ? 'cs' : 'portrait';
  return `${mode}:${info.civIconId}:${info.era}:${ownerColor}`;
}

function disposeSprite(sprite: THREE.Sprite): void {
  const mat = sprite.material as THREE.SpriteMaterial;
  mat.map?.dispose();
  mat.dispose();
}

function makeSpriteFromTexture(tex: THREE.Texture): THREE.Sprite {
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthTest: false,
  });
  const sp = new THREE.Sprite(mat);
  sp.scale.set(MEDALLION_SCALE, MEDALLION_SCALE, 1);
  sp.renderOrder = 12;
  sp.position.set(MEDALLION_X, VETERAN_BADGE_RESERVED_Y, 0.08 * HEX_R);
  sp.rotation.x = -STAR_TILT_RAD;
  return sp;
}

function medallionGeometry(): { cx: number; cy: number; innerR: number } {
  const cx = CANVAS_SIZE / 2;
  const cy = CANVAS_SIZE / 2;
  const outerR = CANVAS_SIZE / 2 - 0.5;
  const innerR = outerR - BORDER_PX;
  return { cx, cy, innerR };
}

/** Tło radialne + clip koła — parytet .dip-leader-medallion */
function drawMedallionBackground(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  innerR: number,
): void {
  const grad = ctx.createRadialGradient(cx * 0.8, cy * 0.68, 0, cx, cy, innerR);
  grad.addColorStop(0, '#2a2416');
  grad.addColorStop(1, '#12100a');
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
}

function strokeMedallionBorder(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  innerR: number,
  ownerColor: number,
): void {
  ctx.beginPath();
  ctx.arc(cx, cy, innerR + BORDER_PX / 2, 0, Math.PI * 2);
  ctx.strokeStyle = hexColor(ownerColor);
  ctx.lineWidth = BORDER_PX;
  ctx.stroke();
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  cx: number,
  cy: number,
  innerR: number,
): void {
  const w = 'width' in img ? img.width as number : CANVAS_SIZE;
  const h = 'height' in img ? img.height as number : CANVAS_SIZE;
  const size = innerR * 2;
  const imgAspect = w / h;
  let sw: number;
  let sh: number;
  let sx: number;
  let sy: number;
  if (imgAspect > 1) {
    sh = h;
    sw = sh;
    sx = (w - sw) / 2;
    sy = 0;
  } else {
    sw = w;
    sh = sw;
    sx = 0;
    sy = (h - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, cx - innerR, cy - innerR, size, size);
}

function renderMedallionCanvas(
  ctx: CanvasRenderingContext2D,
  ownerColor: number,
  drawContent: (ctx: CanvasRenderingContext2D, cx: number, cy: number, innerR: number) => void,
): void {
  const { cx, cy, innerR } = medallionGeometry();
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  drawMedallionBackground(ctx, cx, cy, innerR);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  ctx.clip();
  drawContent(ctx, cx, cy, innerR);
  ctx.restore();
  strokeMedallionBorder(ctx, cx, cy, innerR, ownerColor);
}

function getMedallionTexture(
  cacheKey: string,
  ownerColor: number,
  loadContent: (ctx: CanvasRenderingContext2D, onReady: () => void) => void,
  invalidate: () => void,
): THREE.CanvasTexture {
  const fullKey = `${cacheKey}:${ownerColor}`;
  const cached = medallionTexCache.get(fullKey);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  const ctx = canvas.getContext('2d')!;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  medallionTexCache.set(fullKey, tex);

  loadContent(ctx, () => {
    tex.needsUpdate = true;
    invalidate();
  });

  return tex;
}

function getPortraitMedallionTexture(
  civId: string,
  era: number,
  ownerColor: number,
  invalidate: () => void,
): THREE.CanvasTexture | null {
  const url = leaderPortraitUrl(civId, era);
  if (!url) return null;
  const cacheKey = `portrait:${civId}:${era}`;

  return getMedallionTexture(cacheKey, ownerColor, (ctx, onReady) => {
    const img = new Image();
    img.onload = () => {
      renderMedallionCanvas(ctx, ownerColor, (innerCtx, cx, cy, innerR) => {
        drawImageCover(innerCtx, img, cx, cy, innerR);
      });
      onReady();
    };
    img.onerror = () => onReady();
    img.src = url;
  }, invalidate);
}

function getSvgMedallionTexture(
  cacheKey: string,
  svg: string,
  iconTint: number,
  ownerColor: number,
  invalidate: () => void,
): THREE.CanvasTexture {
  return getMedallionTexture(cacheKey, ownerColor, (ctx, onReady) => {
    const tinted = svg.replace(/currentColor/gi, hexColor(iconTint));
    const img = new Image();
    img.onload = () => {
      renderMedallionCanvas(ctx, ownerColor, (innerCtx, cx, cy, innerR) => {
        const pad = innerR * 0.18;
        const iconSize = (innerR - pad) * 2;
        innerCtx.drawImage(img, cx - innerR + pad, cy - innerR + pad, iconSize, iconSize);
      });
      onReady();
    };
    img.onerror = () => onReady();
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(tinted)}`;
  }, invalidate);
}

function buildMedallionSprite(
  info: OwnerMedallionInfo,
  ownerColor: number,
  invalidate: () => void,
): THREE.Sprite | null {
  if (info.isBarbarian) {
    const svg = brandIconSvg('chip-death', 40);
    const tex = getSvgMedallionTexture('barb:chip-death', svg, 0xe01e1e, ownerColor, invalidate);
    return makeSpriteFromTexture(tex);
  }
  if (info.isCityState) {
    const svg = civIconSvg(info.civIconId, 40);
    const tex = getSvgMedallionTexture(`cs:${info.civIconId}`, svg, 0xe8d88a, ownerColor, invalidate);
    return makeSpriteFromTexture(tex);
  }
  const portrait = getPortraitMedallionTexture(info.civIconId, info.era, ownerColor, invalidate);
  if (!portrait) {
    const svg = civIconSvg(info.civIconId, 40);
    const tex = getSvgMedallionTexture(`fb:${info.civIconId}`, svg, 0xe8d88a, ownerColor, invalidate);
    return makeSpriteFromTexture(tex);
  }
  return makeSpriteFromTexture(portrait);
}

/**
 * Synchronizuje medalion właściciela na żetonie. Idempotentna — wołana z UnitRenderer.sync().
 */
export function syncUnitOwnerMedallion(
  group: THREE.Object3D,
  ownerId: number,
  ownerColor: number,
): void {
  const info = medallionResolver(ownerId);
  const key = stateKey(info, ownerColor);
  if (group.userData[UD_STATE] === key) return;

  const old = group.userData[UD_GROUP] as THREE.Sprite | undefined;
  if (old) {
    group.remove(old);
    disposeSprite(old);
    delete group.userData[UD_GROUP];
  }

  group.userData[UD_STATE] = key;
  const invalidate = () => { group.userData[UD_STATE] = ''; };

  const sprite = buildMedallionSprite(info, ownerColor, invalidate);
  if (!sprite) return;
  group.add(sprite);
  group.userData[UD_GROUP] = sprite;
}

export function disposeUnitOwnerMedallionResources(): void {
  for (const t of medallionTexCache.values()) t.dispose();
  medallionTexCache.clear();
}
