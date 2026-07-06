/**
 * minecraftScene.ts — ten sam buildScene co mapa gry, styl dekoracji Minecraft.
 */
import type { GameMap } from '../types/map';
import { buildScene, type SceneResult } from './scene';

export function buildMinecraftScene(map: GameMap, canvas: HTMLCanvasElement): Promise<SceneResult> {
  return buildScene(map, canvas, 'minecraft');
}

export { TERRAIN_SURFACE_Y as MINECRAFT_TERRAIN_TOP } from './mapRenderStyle';
