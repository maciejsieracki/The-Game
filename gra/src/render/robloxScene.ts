/**
 * robloxScene.ts — buildScene w stylu Roblox + eksport miast.
 */
import type { GameMap } from '../types/map';
import { buildScene, type SceneResult } from './scene';

export function buildRobloxScene(map: GameMap, canvas: HTMLCanvasElement): Promise<SceneResult> {
  return buildScene(map, canvas, 'roblox');
}

export { TERRAIN_SURFACE_Y as ROBLOX_TERRAIN_TOP } from './mapRenderStyle';
export { buildRobloxCity, buildRobloxRomeCity } from './robloxCity';
