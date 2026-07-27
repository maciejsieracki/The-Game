/**
 * unitOwnerMedallion.ts
 *
 * Medalion właściciela po LEWEJ stronie żetonu jednostki (C-OBCE-JEDN-Q2, Maciej 2026-07-27):
 *   pełna cywilizacja → portret władcy (leaderPortraitUrl)
 *   miasto-państwo    → sygnet kultury (civIconSvg)
 *   barbarzyńca       → czaszka (brandIconSvg chip-death)
 *
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

const UD_STATE = 'ownerMedallionState';
const UD_GROUP = 'ownerMedallionGroup';

const portraitTexCache = new Map<string, THREE.Texture>();
const svgTexCache = new Map<string, THREE.Texture>();
const portraitLoader = new THREE.TextureLoader();

function portraitCacheKey(civId: string, era: number): string {
  return `${civId}:${era}`;
}

function hexColor(c: number): string {
  return `#${c.toString(16).padStart(6, '0')}`;
}

function stateKey(info: OwnerMedallionInfo): string {
  const mode = info.isBarbarian ? 'barb' : info.isCityState ? 'cs' : 'portrait';
  return `${mode}:${info.civIconId}:${info.era}`;
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

function getPortraitTexture(
  civId: string,
  era: number,
  invalidate: () => void,
): THREE.Texture | null {
  const key = portraitCacheKey(civId, era);
  const cached = portraitTexCache.get(key);
  if (cached) return cached;
  const url = leaderPortraitUrl(civId, era);
  if (!url) return null;
  const tex = portraitLoader.load(url, () => invalidate());
  tex.colorSpace = THREE.SRGBColorSpace;
  portraitTexCache.set(key, tex);
  return tex;
}

function getSvgTexture(
  cacheKey: string,
  svg: string,
  color: number,
  invalidate: () => void,
): THREE.Texture {
  const fullKey = `${cacheKey}:${color}`;
  const cached = svgTexCache.get(fullKey);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  svgTexCache.set(fullKey, tex);

  const tinted = svg.replace(/currentColor/gi, hexColor(color));
  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0, 0, 64, 64);
    ctx.drawImage(img, 4, 4, 56, 56);
    tex.needsUpdate = true;
    invalidate();
  };
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(tinted)}`;
  return tex;
}

function buildMedallionSprite(
  info: OwnerMedallionInfo,
  invalidate: () => void,
): THREE.Sprite | null {
  if (info.isBarbarian) {
    const svg = brandIconSvg('chip-death', 40);
    const tex = getSvgTexture('chip-death', svg, 0xe01e1e, invalidate);
    return makeSpriteFromTexture(tex);
  }
  if (info.isCityState) {
    const svg = civIconSvg(info.civIconId, 40);
    const tex = getSvgTexture(`civ:${info.civIconId}`, svg, 0xe8d88a, invalidate);
    return makeSpriteFromTexture(tex);
  }
  const portrait = getPortraitTexture(info.civIconId, info.era, invalidate);
  if (!portrait) {
    const svg = civIconSvg(info.civIconId, 40);
    const tex = getSvgTexture(`civ-fb:${info.civIconId}`, svg, 0xe8d88a, invalidate);
    return makeSpriteFromTexture(tex);
  }
  return makeSpriteFromTexture(portrait);
}

/**
 * Synchronizuje medalion właściciela na żetonie. Idempotentna — wołana z UnitRenderer.sync().
 */
export function syncUnitOwnerMedallion(group: THREE.Object3D, ownerId: number): void {
  const info = medallionResolver(ownerId);
  const key = stateKey(info);
  if (group.userData[UD_STATE] === key) return;

  const old = group.userData[UD_GROUP] as THREE.Sprite | undefined;
  if (old) {
    group.remove(old);
    disposeSprite(old);
    delete group.userData[UD_GROUP];
  }

  group.userData[UD_STATE] = key;
  const invalidate = () => { group.userData[UD_STATE] = ''; };

  const sprite = buildMedallionSprite(info, invalidate);
  if (!sprite) return;
  group.add(sprite);
  group.userData[UD_GROUP] = sprite;
}

export function disposeUnitOwnerMedallionResources(): void {
  for (const t of portraitTexCache.values()) t.dispose();
  portraitTexCache.clear();
  for (const t of svgTexCache.values()) t.dispose();
  svgTexCache.clear();
}
