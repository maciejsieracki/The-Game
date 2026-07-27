/**
 * unitPathFlankBadges.ts
 *
 * Ikony ścieżek ulepszeń budynkowych po bokach gwiazdek weterana (C-OBCE-JEDN-Q2):
 *   lewo  — koszary (ścieżka B / parametry miękkie)
 *   prawo — kuźnia   (ścieżka A / pancerz)
 *
 * Poziomy osobno: softPathBadgeLevel / armorPathBadgeLevel (unit-building-bonuses.ts).
 * Kolory: UPGRADE_BADGE_COLOR (brąz / srebro / złoto — C-OBCE-JEDN-Q1).
 *
 * PARYTET AI: brak warunków na ownerId — żeton wroga wygląda tak samo czytelnie.
 */

import * as THREE from 'three';
import { HEX_R } from './hexutil';
import { UPGRADE_BADGE_COLOR, VETERAN_BADGE_RESERVED_Y } from './unitUpgradeBadges';
import { STAR_SPACING, STAR_TILT_RAD } from './unitVeteranBadges';
import {
  armorPathBadgeLevel,
  softPathBadgeLevel,
  type PathBadgeLevel,
  type UnitBuildingProgress,
} from '../game/unit-building-bonuses';
import { buildingIconSvg } from '../ui/icons/brandAssets';

const FLANK_X = STAR_SPACING * 2.15;
const ICON_SCALE = 0.26;

const UD_STATE = 'pathFlankBadgeState';
const UD_GROUP = 'pathFlankBadgeGroup';

const svgTexCache = new Map<string, THREE.Texture>();

function hexColor(c: number): string {
  return `#${c.toString(16).padStart(6, '0')}`;
}

/** Barwi obrys ikony budynku kolorem poziomu (brąz / srebro / złoto) — koszary i kuźnia osobno. */
function tintBuildingSvg(svg: string, level: 1 | 2 | 3): string {
  const color = hexColor(UPGRADE_BADGE_COLOR[level]);
  return svg
    .replace(/stroke="#e8d88a"/gi, `stroke="${color}"`)
    .replace(/stroke="currentColor"/gi, `stroke="${color}"`)
    .replace(/fill="#e8d88a"/gi, `fill="${color}"`)
    .replace(/fill="currentColor"/gi, `fill="${color}"`);
}

function stateKey(soft: PathBadgeLevel, armor: PathBadgeLevel): string {
  return `${soft}:${armor}`;
}

function disposeSprite(sprite: THREE.Sprite): void {
  const mat = sprite.material as THREE.SpriteMaterial;
  mat.map?.dispose();
  mat.dispose();
}

function getBuildingIconTexture(
  buildingId: 'koszary' | 'kuznia',
  level: 1 | 2 | 3,
  invalidate: () => void,
): THREE.Texture {
  const cacheKey = `${buildingId}:${level}`;
  const cached = svgTexCache.get(cacheKey);
  if (cached) return cached;

  const svg = buildingIconSvg(undefined, buildingId);
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  svgTexCache.set(cacheKey, tex);

  const tinted = tintBuildingSvg(svg, level);
  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0, 0, 64, 64);
    ctx.drawImage(img, 6, 6, 52, 52);
    tex.needsUpdate = true;
    invalidate();
  };
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(tinted)}`;
  return tex;
}

function makeFlankSprite(
  buildingId: 'koszary' | 'kuznia',
  level: 1 | 2 | 3,
  x: number,
  invalidate: () => void,
): THREE.Sprite {
  const tex = getBuildingIconTexture(buildingId, level, invalidate);
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthTest: false,
  });
  const sp = new THREE.Sprite(mat);
  sp.scale.set(ICON_SCALE, ICON_SCALE, 1);
  sp.renderOrder = 11;
  sp.position.set(x, VETERAN_BADGE_RESERVED_Y, 0.06 * HEX_R);
  sp.rotation.x = -STAR_TILT_RAD;
  return sp;
}

/**
 * Synchronizuje ikony koszar/kuźnia na żetonie. Idempotentna — wołana z UnitRenderer.sync().
 */
export function syncUnitPathFlankBadges(
  group: THREE.Object3D,
  unit: UnitBuildingProgress | null | undefined,
): void {
  const soft = softPathBadgeLevel(unit);
  const armor = armorPathBadgeLevel(unit);
  const key = stateKey(soft, armor);
  if (group.userData[UD_STATE] === key) return;

  const old = group.userData[UD_GROUP] as THREE.Group | undefined;
  if (old) {
    group.remove(old);
    for (const child of old.children) {
      if (child instanceof THREE.Sprite) disposeSprite(child);
    }
    delete group.userData[UD_GROUP];
  }

  group.userData[UD_STATE] = key;
  if (soft === 0 && armor === 0) return;

  const invalidate = () => { group.userData[UD_STATE] = ''; };
  const g = new THREE.Group();
  g.name = 'pathFlankBadges';

  if (soft > 0) {
    g.add(makeFlankSprite('koszary', soft as 1 | 2 | 3, -FLANK_X, invalidate));
  }
  if (armor > 0) {
    g.add(makeFlankSprite('kuznia', armor as 1 | 2 | 3, FLANK_X, invalidate));
  }

  group.add(g);
  group.userData[UD_GROUP] = g;
}

export function disposeUnitPathFlankBadgeResources(): void {
  for (const t of svgTexCache.values()) t.dispose();
  svgTexCache.clear();
}
