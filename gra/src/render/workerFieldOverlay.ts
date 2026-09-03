/**
 * workerFieldOverlay.ts — ikonki pracowników na mapie świata (pola z robotnikami).
 * Kolor = paleta właściciela (jak jednostki/miasta); gracz dostaje dodatkową obwódkę.
 */
import * as THREE from 'three';
import type { GameMap } from '../types/map';
import { TerenBazowy } from '../types/hex';
import { axialToWorld, HEX_R } from './hexutil';
import { GAME_MAP_RENDER_STYLE, terrainSurfaceTopY } from './mapRenderStyle';
import { fogBrightnessForHex } from './fogDim';

const WORKER_ICON_SCALE = 0.72;
const WORKER_Y_OFFSET = 0.18;
const WORKER_BASE_OPACITY = 0.9;

/**
 * Paleta właścicieli — zsynchronizowana z render/units.ts i render/cities.ts.
 * Eksportowana, bo TĘ SAMĄ paletę musi używać odznaka 👤 w nakładce okolicy miasta
 * (`render/cityOkolicaOverlay.ts`) — inaczej ten sam obywatel ma dwa różne kolory
 * zależnie od tego, czy panel miasta jest otwarty (`P-CHLOPEK-DWA-SYSTEMY-KOLOR-NIESPOJNE`).
 */
export const WORKER_OWNER_COLORS: number[] = [
  0xffd54a, // 0 = gracz (złoto)
  0xe53935, // 1 = czerwony
  0x43a047, // 2 = zielony
  0x1e88e5, // 3 = niebieski
  0xfb8c00, // 4 = pomarańczowy
  0x8e24aa, // 5 = fioletowy
  0x00acc1, // 6 = turkusowy
  0xf06292, // 7 = różowy
];

/** Kolor właściciela (0xRRGGBB) dla ikony 👤 — zawijany modulo długość palety. */
export function workerOwnerColor(ownerId: number): number {
  return WORKER_OWNER_COLORS[ownerId % WORKER_OWNER_COLORS.length]!;
}

function hexToRgba(hex: number, alpha: number): string {
  const r = (hex >> 16) & 255;
  const g = (hex >> 8) & 255;
  const b = hex & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Kolor właściciela jako `rgba(...)` — do rysowania na kanwie (2D). */
export function workerOwnerColorRgba(ownerId: number, alpha: number): string {
  return hexToRgba(workerOwnerColor(ownerId), alpha);
}

function hexTopY(map: GameMap, q: number, r: number): number {
  const hex = map.hexes[`${q},${r}`];
  const teren = hex?.terenBazowy ?? TerenBazowy.Laka;
  return terrainSurfaceTopY(teren, GAME_MAP_RENDER_STYLE, WORKER_Y_OFFSET);
}

const workerSpriteCache = new Map<string, THREE.CanvasTexture>();

function workerSpriteCacheKey(ownerId: number, playerOwnerId: number): string {
  return `${ownerId}|ring:${ownerId === playerOwnerId ? 1 : 0}`;
}

/** Ikona 👤 na tle w kolorze cywilizacji; gracz — dodatkowa obwódka w swoim kolorze. */
function getWorkerIconTexture(ownerId: number, playerOwnerId: number): THREE.CanvasTexture {
  const key = workerSpriteCacheKey(ownerId, playerOwnerId);
  let tex = workerSpriteCache.get(key);
  if (tex) return tex;

  const color = workerOwnerColor(ownerId);
  const isPlayer = ownerId === playerOwnerId;
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 64, 64);

  const cx = 32;
  const cy = 32;
  const badgeR = isPlayer ? 11 : 12;

  if (isPlayer) {
    ctx.strokeStyle = hexToRgba(color, 1);
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(cx, cy, badgeR + 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, badgeR + 5.5, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.fillStyle = hexToRgba(color, isPlayer ? 0.72 : 0.62);
  ctx.beginPath();
  ctx.arc(cx, cy, badgeR, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = 'bold 16px Segoe UI, Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.fillText('👤', cx, cy + 1);

  tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  workerSpriteCache.set(key, tex);
  return tex;
}

function makeWorkerIconSprite(ownerId: number, playerOwnerId: number): THREE.Sprite {
  const tex = getWorkerIconTexture(ownerId, playerOwnerId);
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    opacity: WORKER_BASE_OPACITY,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
  mat.userData.fogBaseOpacity = WORKER_BASE_OPACITY;
  const sprite = new THREE.Sprite(mat);
  sprite.renderOrder = 18;
  sprite.center.set(0.5, 0.5);
  sprite.scale.set(WORKER_ICON_SCALE, WORKER_ICON_SCALE, 1);
  return sprite;
}

/** Buduje grupę ikon pracowników — hexKey → ownerId. */
export function buildWorkerFieldOverlayGroup(
  map: GameMap,
  workedByOwner: Map<string, number>,
  playerOwnerId: number,
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'worker-field-overlay';

  for (const [key, ownerId] of workedByOwner) {
    const hex = map.hexes[key];
    if (!hex) continue;
    const { q, r } = hex.coords;
    const t = hex.terenBazowy;
    // Świadomie Morze/Gory-only, nie isWaterTerrain (P-MAPGEN-PANGEA-OBRYS-P4-WYBRZEZE-Q1):
    // PlytkieMorze JEST obsadzalne (rybołówstwo) — patrz okolica.ts::isLandWorkableHex,
    // wspólne źródło prawdy dla silnika ekonomii; ikona pracownika ma się tam renderować.
    if (t === TerenBazowy.Morze || t === TerenBazowy.Gory) continue;

    const sprite = makeWorkerIconSprite(ownerId, playerOwnerId);
    sprite.userData.hexKey = key;
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
  workedByOwner: Map<string, number>,
  playerOwnerId: number = 0,
): THREE.Group | null {
  if (current) {
    scene.remove(current);
    disposeWorkerFieldOverlayGroup(current);
  }
  if (workedByOwner.size === 0) return null;
  const next = buildWorkerFieldOverlayGroup(map, workedByOwner, playerOwnerId);
  scene.add(next);
  return next;
}

/** Ukrywa/przyciemnia ikony poza zasięgiem widzenia — jak syncResourceOverlayFog. */
export function syncWorkerFieldOverlayFog(
  group: THREE.Group | null,
  vis: Set<string>,
  exploredKeys: Set<string>,
  fogActive: boolean,
): void {
  if (!group) return;
  group.traverse((obj) => {
    const sprite = obj as THREE.Sprite;
    if (!sprite.material) return;
    const hexKey = sprite.userData.hexKey as string | undefined;
    if (!hexKey) return;
    const mat = sprite.material as THREE.SpriteMaterial;
    const baseOpacity = (mat.userData.fogBaseOpacity as number) ?? WORKER_BASE_OPACITY;
    const bri = fogBrightnessForHex(hexKey, vis, exploredKeys, fogActive);
    sprite.visible = bri > 0;
    if (bri > 0) mat.opacity = baseOpacity * bri;
  });
}

export function disposeWorkerFieldOverlayGroup(group: THREE.Group | null): void {
  if (!group) return;
  group.traverse((obj) => {
    const sprite = obj as THREE.Sprite;
    if (!sprite.material) return;
    const mat = sprite.material as THREE.SpriteMaterial;
    mat.dispose();
  });
  group.clear();
}

/** Czyści współdzielone tekstury ikon (np. przy zamykaniu sceny). */
export function disposeWorkerFieldSpriteCache(): void {
  for (const tex of workerSpriteCache.values()) tex.dispose();
  workerSpriteCache.clear();
}
