/**
 * cityOkolicaOverlay.ts — nakładka okolicy miasta na mapie 3D (Civ V style).
 * Warstwa renderu: siatka zasięgu, podświetlenie obrabianych pól, ikony plonów + 👤.
 * Jedyny wywołujący: `main.ts` → `syncOkolicaOverlay()` (przy OTWARTYM panelu miasta gracza).
 * Odznaka 👤 dzieli paletę i geometrię z ikoną na mapie świata (`render/workerFieldOverlay.ts`).
 */
import * as THREE from 'three';
import type { GameMap } from '../types/map';
import { TerenBazowy } from '../types/hex';
import { axialToWorld, HEX_R } from './hexutil';
import { buildRangeOverlayGroup, disposeRangeOverlayGroup, type RangeOverlayStyle } from './rangeOverlay';
import { GAME_MAP_RENDER_STYLE, terrainSurfaceTopY } from './mapRenderStyle';
import { hexKeysWithinRadius, type TileYield } from '../game/okolica';
import { hexHasCoveringTerrainImprovement } from '../game/terrain-improvements';
import { hexDistance } from '../units/setup';
import { workerOwnerColorRgba } from './workerFieldOverlay';

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
  /** Klucze heksów z przypisanym 👤 (bez centrum miasta). */
  workedKeys: Set<string>;
  yieldOf: (q: number, r: number) => TileYield;
  showYields?: boolean;
  /**
   * Właściciel miasta — odznaka 👤 bierze z niego kolor z palety `WORKER_OWNER_COLORS`,
   * tej samej co ikona 👤 na mapie świata. Domyślnie 0 (gracz).
   */
  ownerId?: number;
}

function hexTopY(map: GameMap, q: number, r: number, yOffset: number): number {
  const hex = map.hexes[`${q},${r}`];
  const teren = hex?.terenBazowy ?? TerenBazowy.Laka;
  return terrainSurfaceTopY(teren, GAME_MAP_RENDER_STYLE, yOffset);
}

type YieldLine = { emoji: string; value: number };

function yieldLabelLines(y: TileYield): YieldLine[] {
  const lines: YieldLine[] = [];
  if (y.zywnosc && y.zywnosc > 0) lines.push({ emoji: '🍞', value: y.zywnosc });
  if (y.praca && y.praca > 0) lines.push({ emoji: '🔨', value: y.praca });
  if (y.handel && y.handel > 0) lines.push({ emoji: '💰', value: y.handel });
  return lines;
}

/** Czytelność tekstu na canvas (większa czcionka, ostrzejsza tekstura). */
const YIELD_FONT_SCALE = 1.22;
/** Skala w świecie 3D — lekko powyżej bazowej, ale mieści się na heksie. */
const YIELD_WORLD_SCALE = 1.35 * 1.04;
/** Złote cyfry tylko na polu z 👤 (produkcyjnym); reszta — białe jak wcześniej. */
const YIELD_NUMBER_GOLD = '#e0b24a';
const YIELD_NUMBER_DEFAULT = '#fffef8';
const YIELD_EMOJI_FONT = (px: number) =>
  `${px}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
const YIELD_DIGIT_FONT = (px: number) =>
  `bold ${px}px Arial, Helvetica, sans-serif`;

/** Powiększenie cyfr (i lekko emoji) na polu produkcyjnym z 👤. */
const YIELD_WORKED_DIGIT_SCALE = 1.28;
const YIELD_WORKED_EMOJI_SCALE = 1.1;

/**
 * Odznaka 👤 — geometria w PIKSELACH KANWY, celowo nieskalowana przez YIELD_FONT_SCALE,
 * bo ma trzymać parytet z ikoną 👤 na mapie świata (`workerFieldOverlay.ts`).
 * Gęstość px→świat jest w obu warstwach praktycznie ta sama: mapa świata 0,72 świata / 64 px
 * = 0,01125; okolica 1,404 świata / 128 px = 0,01097 — więc „piksel = piksel".
 * Mapa świata: krążek R=11 px, glif 16 px (stosunek glif/średnica ≈ 0,73).
 * Tu krążek 9 px przy TYM SAMYM stosunku (13/18 ≈ 0,72): cała odznaka razem z obwódką
 * (promień zewnętrzny 9+6 = 15 px) mieści się w dotychczasowej wysokości etykiety, więc
 * `worldH` etykiety plonów NIE rośnie (nota Evaluatora #1 do P-CHLOPEK-DWA-SYSTEMY-KOLOR-NIESPOJNE).
 */
const WORKER_BADGE_R = 9;
const WORKER_BADGE_CY = 16;
const WORKER_BADGE_GLYPH_PX = 13;
/** Obwódka w kolorze właściciela + cieńszy ciemny rant — jak na mapie świata. */
const WORKER_BADGE_RING_DR = 4;
const WORKER_BADGE_RING_LW = 3.5;
const WORKER_BADGE_RIM_DR = 5.5;

/**
 * Rysuje odznakę 👤 nad etykietą plonów. Kolor krążka i obwódki = paleta właściciela
 * (`workerOwnerColorRgba`), nie sztywna zieleń — ten sam obywatel ma mieć ten sam kolor
 * na mapie świata i w nakładce okolicy. Obwódka rysowana zawsze, bo nakładka okolicy
 * powstaje wyłącznie dla miasta gracza (`main.ts` → `syncOkolicaOverlay`, warunek
 * `city.ownerId !== 0` → dispose), czyli w warunkach, w których mapa świata też ją rysuje.
 */
function drawWorkerBadge(ctx: CanvasRenderingContext2D, cx: number, ownerId: number): void {
  const cy = WORKER_BADGE_CY;

  ctx.strokeStyle = workerOwnerColorRgba(ownerId, 1);
  ctx.lineWidth = WORKER_BADGE_RING_LW;
  ctx.beginPath();
  ctx.arc(cx, cy, WORKER_BADGE_R + WORKER_BADGE_RING_DR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, WORKER_BADGE_R + WORKER_BADGE_RIM_DR, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = workerOwnerColorRgba(ownerId, 0.72);
  ctx.beginPath();
  ctx.arc(cx, cy, WORKER_BADGE_R, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = `bold ${WORKER_BADGE_GLYPH_PX}px Segoe UI, Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.fillText('👤', cx, cy + 1);
}

function drawYieldLine(
  ctx: CanvasRenderingContext2D,
  cx: number,
  y: number,
  line: YieldLine,
  fontPx: number,
  worked: boolean,
): void {
  const numStr = String(line.value);
  const emojiPx = worked ? Math.round(fontPx * YIELD_WORKED_EMOJI_SCALE) : fontPx;
  const digitPx = worked ? Math.round(fontPx * YIELD_WORKED_DIGIT_SCALE) : fontPx;

  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  ctx.font = YIELD_EMOJI_FONT(emojiPx);
  const emojiW = ctx.measureText(line.emoji).width;
  ctx.font = YIELD_DIGIT_FONT(digitPx);
  const numW = ctx.measureText(numStr).width;
  let x = cx - (emojiW + numW) / 2;

  ctx.font = YIELD_EMOJI_FONT(emojiPx);
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.fillText(line.emoji, x, y);
  x += emojiW;

  ctx.font = YIELD_DIGIT_FONT(digitPx);
  ctx.fillStyle = worked ? YIELD_NUMBER_GOLD : YIELD_NUMBER_DEFAULT;
  ctx.shadowColor = worked ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = worked ? 3 : 2;
  ctx.shadowOffsetY = 1;
  ctx.fillText(numStr, x, y - (worked ? 2 : 0));
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
}

function makeLabelSprite(lines: YieldLine[], worker: boolean, ownerId: number): THREE.Sprite {
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

  if (worker) drawWorkerBadge(ctx, 64, ownerId);

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
  for (const key of hexKeysWithinRadius(cq, cr, range, map)) {
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
      const t = hex.terenBazowy;
      // Świadomie Morze/Gory-only, nie isWaterTerrain (P-MAPGEN-PANGEA-OBRYS-P4-WYBRZEZE-Q1):
      // PlytkieMorze JEST obsadzalne i ma plony — patrz okolica.ts::isLandWorkableHex.
      if (t === TerenBazowy.Morze || t === TerenBazowy.Gory) continue;
      // R-HEKS-PLONY-UKRYTE-POD-MIASTEM (Maciej 2026-08-08): heks centrum miasta ZAWSZE
      // ma realne plony z wlasnego terenu (silnik: cityWorkedTilesForEconomy — "Centrum
      // (hex miasta) ZAWSZE daje plony z wlasnego terenu — bez 👤"), wiec nie pomijamy go
      // nawet gdy przypadkiem niesie klasyfikacje "ulepszenie" (np. ocalale przy zalozeniu
      // wg macierzy B, lub postawione po fakcie) — inaczej gracz nie widzi w ogole liczb na
      // wlasnym hexie miasta, mimo ze silnik je liczy.
      if (key !== cityKey && hexHasCoveringTerrainImprovement(hex)) continue;

      const yld = params.yieldOf(q, r);
      const parts = yieldLabelLines(yld);
      if (parts.length === 0) continue;

      const worker = params.workedKeys.has(key);
      const sprite = makeLabelSprite(parts, worker, params.ownerId ?? 0);
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
