/**
 * settlementModel.ts — fabryka modeli osady na mapie (classic / Roblox).
 * Używane przez CityRenderer; main.ts → handoff SILNIK (ghost założenia miasta).
 */
import * as THREE from 'three';
import { buildBronzeCity, type BronzeCiv } from './bronzeCity';
import { buildBronzeCityRoblox } from './bronzeCityRoblox';
import { buildStoneAgeCity } from './stoneCity';
import { buildStoneAgeCityRoblox } from './stoneCityRoblox';
import { GAME_MAP_RENDER_STYLE, type MapRenderStyle } from './mapRenderStyle';

export function buildSettlementModel(
  era: number,
  civ: BronzeCiv,
  level: number,
  ownerCol: number,
  withWalls: boolean,
  style: MapRenderStyle = GAME_MAP_RENDER_STYLE,
): THREE.Group {
  const L = Math.max(1, Math.min(10, Math.round(level)));
  if (style === 'roblox') {
    if (era >= 2) return buildBronzeCityRoblox(civ, L, ownerCol, withWalls);
    // A5-S2: epoka kamienia — jeden wspólny styl dla wszystkich cywilizacji.
    return buildStoneAgeCityRoblox(L, ownerCol, withWalls);
  }
  if (era >= 2) return buildBronzeCity(civ, L, ownerCol, withWalls);
  return buildStoneAgeCity(L, ownerCol, withWalls);
}
