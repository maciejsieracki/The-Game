/**
 * cityOkolicaOverlay.ts — nakładka okolicy miasta na mapie 3D (Civ V style).
 * Warstwa renderu: siatka zasięgu, podświetlenie obrabianych pól, etykiety plonów + badge W.
 * Używane przez okolicapreview; docelowo Integrator wpienie przy otwartym panelu miasta.
 */
import * as THREE from 'three';
import type { GameMap } from '../types/map';
import { TerenBazowy } from '../types/hex';
import { axialToWorld, HEX_R } from './hexutil';
import { buildRangeOverlayGroup, disposeRangeOverlayGroup, type RangeOverlayStyle } from './rangeOverlay';
import { GAME_MAP_RENDER_STYLE, terrainSurfaceTopY } from './mapRenderStyle';
import type { TileYield } from '../game/okolica';
import { hexDistance } from '../units/setup';

export const CITY_RANGE_OVERLAY_STYLE: RangeOverlayStyle = {
  tintColor: 0xc8a840,
  tintOpacity: 0.12,
  borderColor: 0x66aaff,
  borderOpacity: 0.88,
  borderBandWidth: 0,
  yOffset: 0.06,
};

/** Centrum miasta — mocniejsza niebieska obwódka (łatwo znaleźć na mapie). */
export const CITY_CENTER_OVERLAY_STYLE: RangeOverlayStyle = {
  tintColor: 0x3080e0,
  tintOpacity: 0.28,
  borderColor: 0x88c4ff,
  borderOpacity: 0.98,
  borderBandWidth: 0,
  yOffset: 0.11,
};

export const CITY_WORKED_OVERLAY_STYLE: RangeOverlayStyle = {
  tintColor: 0x28ff78,
  tintOpacity: 0.46,
  borderColor: 0x66ffaa,
  borderOpacity: 0.78,
  borderBandWidth: 0,
  yOffset: 0.09,
};

export interface CityOkolicaOverlayParams {
  cityQ: number;
  cityR: number;
  range: number;
  /** Klucze heksów z przypisanym W (bez centrum miasta). */
  workedKeys: Set<string>;
  yieldOf: (q: number, r: number) => TileYield;
  showYields?: boolean;
}

function hexTopY(map: GameMap, q: number, r: number, yOffset: number): number {
  const hex = map.hexes[`${q},${r}`];
  const teren = hex?.terenBazowy ?? TerenBazowy.Laka;
  return terrainSurfaceTopY(teren, GAME_MAP_RENDER_STYLE, yOffset);
}

type YieldLine = { tag: string; color: string; value: number };

const YIELD_CANVAS: Record<'zywnosc' | 'praca' | 'handel', { tag: string; color: string }> = {
  zywnosc: { tag: 'Ż', color: '#e8d88a' },
  praca: { tag: 'P', color: '#d98a3a' },
  handel: { tag: 'H', color: '#7ad0a0' },
};

function yieldLabelLines(y: TileYield): YieldLine[] {
  const lines: YieldLine[] = [];
  if (y.zywnosc && y.zywnosc > 0) lines.push({ ...YIELD_CANVAS.zywnosc, value: y.zywnosc });
  if (y.praca && y.praca > 0) lines.push({ ...YIELD_CANVAS.praca, value: y.praca });
  if (y.handel && y.handel > 0) lines.push({ ...YIELD_CANVAS.handel, value: y.handel });
  return lines;
}

/** Czytelność tekstu na canvas (większa czcionka, ostrzejsza tekstura). */
const YIELD_FONT_SCALE = 1.22;
/** Skala w świecie 3D — lekko powyżej bazowej, ale mieści się na heksie. */
const YIELD_WORLD_SCALE = 1.35 * 1.04;
/** Złote cyfry tylko na polu z W (produkcyjnym); reszta — białe jak wcześniej. */
const YIELD_NUMBER_GOLD = '#e0b24a';
const YIELD_NUMBER_DEFAULT = '#fffef8';
const YIELD_TAG_FONT = (px: number) =>
  `bold ${px}px Arial, Helvetica, sans-serif`;
const YIELD_DIGIT_FONT = (px: number) =>
  `bold ${px}px Arial, Helvetica, sans-serif`;

/** Powiększenie cyfr (i lekko tagów) na polu produkcyjnym z W. */
const YIELD_WORKED_DIGIT_SCALE = 1.28;
const YIELD_WORKED_TAG_SCALE = 1.1;

function drawYieldLine(
  ctx: CanvasRenderingContext2D,
  cx: number,
  y: number,
  line: YieldLine,
  fontPx: number,
  worked: boolean,
): void {
  const numStr = String(line.value);
  const tagPx = worked ? Math.round(fontPx * YIELD_WORKED_TAG_SCALE) : fontPx;
  const digitPx = worked ? Math.round(fontPx * YIELD_WORKED_DIGIT_SCALE) : fontPx;

  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  ctx.font = YIELD_TAG_FONT(tagPx);
  const tagW = ctx.measureText(line.tag).width;
  ctx.font = YIELD_DIGIT_FONT(digitPx);
  const numW = ctx.measureText(numStr).width;
  let x = cx - (tagW + numW) / 2;

  ctx.font = YIELD_TAG_FONT(tagPx);
  ctx.fillStyle = line.color;
  ctx.fillText(line.tag, x, y);
  x += tagW;

  ctx.font = YIELD_DIGIT_FONT(digitPx);
  ctx.fillStyle = worked ? YIELD_NUMBER_GOLD : YIELD_NUMBER_DEFAULT;
  ctx.shadowColor = worked ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = worked ? 3 : 2;
  ctx.shadowOffsetY = 1;
  ctx.fillText(numStr, x, y - (worked ? 2 : 0));
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
}

function makeLabelSprite(lines: YieldLine[], worker: boolean): THREE.Sprite {
  const s = YIELD_FONT_SCALE;
  const fontPx = Math.round(13 * s);
  const lineH = Math.round(14.5 * s);
  const lineHWorked = Math.round(16.5 * s);
  const padBottom = Math.round(7 * s);
  const startY = worker ? Math.round(24 * s) : Math.round(7 * s);
  const rowH = (i: number) => (worker ? lineHWorked : lineH);
  const h = Math.max(
    Math.round((worker ? 56 : 38) * s),
    startY + lines.reduce((sum, _, i) => sum + rowH(i), 0) + padBottom,
  );
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 128, h);

  if (worker) {
    const badgeR = Math.round(11 * s);
    const badgeY = Math.round(14 * s);
    ctx.fillStyle = 'rgba(30,80,30,0.88)';
    ctx.beginPath();
    ctx.arc(64, badgeY, badgeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = `bold ${Math.round(14 * s)}px Segoe UI, Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText('W', 64, badgeY + 1);
  }

  ctx.font = YIELD_DIGIT_FONT(fontPx);
  let rowY = startY;
  lines.forEach((line, i) => {
    drawYieldLine(ctx, 64, rowY, line, fontPx, worker);
    rowY += rowH(i);
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.renderOrder = 20;
  /** Środek sprite'a — pozycja Y liczona tak, by większość etykiety leżała na heksie. */
  sprite.center.set(0.5, 0.5);
  const worldScale = YIELD_WORLD_SCALE;
  const worldH = (h / 128) * worldScale;
  sprite.scale.set(worldScale, worldH, 1);
  sprite.userData.labelWorldHeight = worldH;
  return sprite;
}

/** Ustawia sprite plonów w obrębie heksa (środek w poziomie, lekko nad powierzchnią). */
function placeYieldLabelSprite(sprite: THREE.Sprite, map: GameMap, q: number, r: number): void {
  const { x, z } = axialToWorld(q, r, HEX_R);
  const worldH = (sprite.userData.labelWorldHeight as number) ?? sprite.scale.y;
  const surfaceY = hexTopY(map, q, r, 0.05);
  sprite.position.set(x, surfaceY + worldH * 0.38, z);
}

function collectRangeKeys(map: GameMap, cq: number, cr: number, range: number): Set<string> {
  const keys = new Set<string>();
  for (const key of Object.keys(map.hexes)) {
    const [qs, rs] = key.split(',');
    const q = Number(qs);
    const r = Number(rs);
    if (!Number.isFinite(q) || !Number.isFinite(r)) continue;
    if (hexDistance(cq, cr, q, r) <= range) keys.add(key);
  }
  return keys;
}

/** Buduje grupę overlay (zasięg + obrabiane + etykiety plonów). */
export function buildCityOkolicaOverlayGroup(
  map: GameMap,
  params: CityOkolicaOverlayParams,
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'city-okolica-overlay';

  const rangeKeys = collectRangeKeys(map, params.cityQ, params.cityR, params.range);
  const rangeGroup = buildRangeOverlayGroup(map, rangeKeys, CITY_RANGE_OVERLAY_STYLE);
  rangeGroup.name = 'okolica-range';
  group.add(rangeGroup);

  const cityKey = `${params.cityQ},${params.cityR}`;
  const centerGroup = buildRangeOverlayGroup(map, new Set([cityKey]), CITY_CENTER_OVERLAY_STYLE);
  centerGroup.name = 'okolica-city-center';
  group.add(centerGroup);

  if (params.workedKeys.size > 0) {
    const workedGroup = buildRangeOverlayGroup(map, params.workedKeys, CITY_WORKED_OVERLAY_STYLE);
    workedGroup.name = 'okolica-worked';
    group.add(workedGroup);
  }

  if (params.showYields !== false) {
    const labels = new THREE.Group();
    labels.name = 'okolica-yields';
    for (const key of rangeKeys) {
      const hex = map.hexes[key];
      if (!hex) continue;
      const { q, r } = hex.coords;
      if (q === params.cityQ && r === params.cityR) continue;
      const t = hex.terenBazowy;
      if (t === TerenBazowy.Morze || t === TerenBazowy.Gory) continue;

      const yld = params.yieldOf(q, r);
      const parts = yieldLabelLines(yld);
      if (parts.length === 0) continue;

      const worker = params.workedKeys.has(key);
      const sprite = makeLabelSprite(parts, worker);
      placeYieldLabelSprite(sprite, map, q, r);
      labels.add(sprite);
    }
    group.add(labels);
  }

  return group;
}

/** Zastępuje overlay na scenie (usuwa poprzedni, dodaje nowy). */
export function syncCityOkolicaOverlay(
  scene: THREE.Scene,
  current: THREE.Group | null,
  map: GameMap,
  params: CityOkolicaOverlayParams,
): THREE.Group {
  if (current) {
    scene.remove(current);
    disposeCityOkolicaOverlayGroup(current);
  }
  const next = buildCityOkolicaOverlayGroup(map, params);
  scene.add(next);
  return next;
}

export function disposeCityOkolicaOverlayGroup(group: THREE.Group | null): void {
  if (!group) return;
  group.traverse((obj) => {
    const sprite = obj as THREE.Sprite;
    if (sprite.material) {
      const mat = sprite.material as THREE.SpriteMaterial;
      if (mat.map) mat.map.dispose();
      mat.dispose();
    }
    const mesh = obj as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of mats) {
      if (m) (m as THREE.Material).dispose();
    }
  });
  group.traverse((child) => {
    if (child instanceof THREE.Group && child.name === 'range-overlay') {
      disposeRangeOverlayGroup(child);
    }
  });
  group.clear();
}
