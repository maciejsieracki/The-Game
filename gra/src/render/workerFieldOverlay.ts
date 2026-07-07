/**
 * workerFieldOverlay.ts — przeźroczyste ikonki 👤 na mapie świata (pola z robotnikami).
 * E-map-worker-overlay: wszystkie miasta gracza (ownerId 0), toggle przy minimapie.
 */
import * as THREE from 'three';
import type { GameMap } from '../types/map';
import { TerenBazowy } from '../types/hex';
import { axialToWorld, HEX_R } from './hexutil';
import { GAME_MAP_RENDER_STYLE, terrainSurfaceTopY } from './mapRenderStyle';

const WORKER_ICON_SCALE = 0.72;
const WORKER_Y_OFFSET = 0.18;

function hexTopY(map: GameMap, q: number, r: number): number {
  const hex = map.hexes[`${q},${r}`];
  const teren = hex?.terenBazowy ?? TerenBazowy.Laka;
  return terrainSurfaceTopY(teren, GAME_MAP_RENDER_STYLE, WORKER_Y_OFFSET);
}

/** Minimalna przeźroczysta ikonka 👤 (jak badge w cityOkolicaOverlay). */
function makeWorkerIconSprite(): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 64, 64);

  const badgeR = 13;
  const badgeY = 32;
  ctx.fillStyle = 'rgba(30,80,30,0.55)';
  ctx.beginPath();
  ctx.arc(32, badgeY, badgeR, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = 'bold 16px Segoe UI, Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.fillText('👤', 32, badgeY + 1);

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    opacity: 0.82,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.renderOrder = 18;
  sprite.center.set(0.5, 0.5);
  sprite.scale.set(WORKER_ICON_SCALE, WORKER_ICON_SCALE, 1);
  return sprite;
}

/** Buduje grupę ikon 👤 na heksach z przypisanymi robotnikami. */
export function buildWorkerFieldOverlayGroup(
  map: GameMap,
  workedKeys: Set<string>,
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'worker-field-overlay';

  for (const key of workedKeys) {
    const hex = map.hexes[key];
    if (!hex) continue;
    const { q, r } = hex.coords;
    const t = hex.terenBazowy;
    if (t === TerenBazowy.Morze || t === TerenBazowy.Gory) continue;

    const sprite = makeWorkerIconSprite();
    const { x, z } = axialToWorld(q, r, HEX_R);
    sprite.position.set(x, hexTopY(map, q, r), z);
    group.add(sprite);
  }

  return group;
}

export function syncWorkerFieldOverlay(
  scene: THREE.Scene,
  current: THREE.Group | null,
  map: GameMap,
  workedKeys: Set<string>,
): THREE.Group | null {
  if (current) {
    scene.remove(current);
    disposeWorkerFieldOverlayGroup(current);
  }
  if (workedKeys.size === 0) return null;
  const next = buildWorkerFieldOverlayGroup(map, workedKeys);
  scene.add(next);
  return next;
}

export function disposeWorkerFieldOverlayGroup(group: THREE.Group | null): void {
  if (!group) return;
  group.traverse((obj) => {
    const sprite = obj as THREE.Sprite;
    if (!sprite.material) return;
    const mat = sprite.material as THREE.SpriteMaterial;
    if (mat.map) mat.map.dispose();
    mat.dispose();
  });
  group.clear();
}
