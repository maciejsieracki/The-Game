/**
 * wonderRenderer.ts — render cudów świata na heksach mapy (MAPA).
 */
import * as THREE from 'three';
import type { GameMap } from '../types/map';
import type { Hex } from '../types/hex';
import { TerenBazowy } from '../types/hex';
import { axialToWorld, HEX_R } from './hexutil';
import { GAME_MAP_RENDER_STYLE, terrainVisualForStyle, type MapRenderStyle } from './mapRenderStyle';
import { buildWonderModel } from './wonderModels';

export interface PlacedWonder {
  wonderId: string;
  q: number;
  r: number;
  ownerId: number;
  /** Po absolut — ruina (szary model, bez bonusów). */
  ruin?: boolean;
}

const OWNER_COLORS: number[] = [
  0xffd54a, 0xe53935, 0x43a047, 0x1e88e5,
  0xfb8c00, 0x8e24aa, 0x00acc1, 0xf06292,
];

const WONDER_LIFT = 0.004 * HEX_R;
const WONDER_SCALE = 1.15;

interface TerrainTopY {
  height: number;
  yOffset: number;
}

const CIV_TERRAIN_HEIGHT: Record<TerenBazowy, TerrainTopY> = {
  [TerenBazowy.Morze]:    { height: 0.30, yOffset: 0.00 },
  [TerenBazowy.Wybrzeze]: { height: 0.35, yOffset: 0.05 },
  [TerenBazowy.Laka]:     { height: 0.40, yOffset: 0.05 },
  [TerenBazowy.Rownina]:  { height: 0.45, yOffset: 0.08 },
  [TerenBazowy.Pustynia]: { height: 0.42, yOffset: 0.08 },
  [TerenBazowy.Wzgorza]:  { height: 0.70, yOffset: 0.15 },
  [TerenBazowy.Gory]:     { height: 1.20, yOffset: 0.40 },
};

function terrainTopY(hex: Hex, style: MapRenderStyle = GAME_MAP_RENDER_STYLE): number {
  const civ = CIV_TERRAIN_HEIGHT[hex.terenBazowy];
  const spec = terrainVisualForStyle(hex.terenBazowy, style, civ);
  return spec.height + spec.yOffset;
}

function ownerColor(ownerId: number): number {
  return OWNER_COLORS[ownerId % OWNER_COLORS.length]!;
}

export interface WonderRenderOptions {
  isVisible?: (w: PlacedWonder) => boolean;
}

export class WonderRenderer {
  private scene: THREE.Scene;
  private hexGrid: Map<string, Hex>;
  private models = new Map<string, THREE.Group>();
  private modelMaterials = new Map<string, THREE.Material[]>();

  constructor(scene: THREE.Scene, map: GameMap) {
    this.scene = scene;
    this.hexGrid = new Map(Object.entries(map.hexes));
  }

  sync(placed: PlacedWonder[], options?: WonderRenderOptions): void {
    const present = new Set<string>();

    for (const w of placed) {
      const key = `${w.wonderId}@${w.q},${w.r}`;
      present.add(key);
      const visible = options?.isVisible?.(w) ?? true;
      const hex = this.hexGrid.get(`${w.q},${w.r}`);
      const topY = hex ? terrainTopY(hex) : 0;
      const yBase = topY + WONDER_LIFT;
      const visualKey = `${w.wonderId}|${w.ownerId}|${w.ruin ? 1 : 0}`;

      if (this.models.has(key)) {
        const grp = this.models.get(key)!;
        grp.visible = visible;
        if (grp.userData['visualKey'] === visualKey) {
          const { x, z } = axialToWorld(w.q, w.r, HEX_R);
          grp.position.set(x, yBase, z);
          continue;
        }
        this._remove(key);
      }

      const group = buildWonderModel(w.wonderId, {
        ruin: w.ruin ?? false,
        ownerColor: ownerColor(w.ownerId),
      });
      const { x, z } = axialToWorld(w.q, w.r, HEX_R);
      group.position.set(x, yBase, z);
      group.scale.setScalar(WONDER_SCALE);
      group.userData['visualKey'] = visualKey;
      group.userData['wonderKey'] = key;
      group.visible = visible;
      this._register(key, group);
      this.scene.add(group);
    }

    for (const key of [...this.models.keys()]) {
      if (!present.has(key)) this._remove(key);
    }
  }

  applyFogVisibility(vis: ReadonlySet<string>, fogOn: boolean): void {
    for (const [key, grp] of this.models) {
      if (!fogOn) {
        grp.visible = true;
        continue;
      }
      const hexKey = key.split('@')[1] ?? '';
      grp.visible = vis.has(hexKey);
    }
  }

  dispose(): void {
    for (const key of [...this.models.keys()]) this._remove(key);
  }

  private _register(key: string, group: THREE.Group): void {
    this.models.set(key, group);
    this.modelMaterials.set(key, (group.userData['mats'] as THREE.Material[]) ?? []);
  }

  private _remove(key: string): void {
    const grp = this.models.get(key);
    if (grp) {
      this.scene.remove(grp);
      for (const m of this.modelMaterials.get(key) ?? []) m.dispose();
      this.models.delete(key);
      this.modelMaterials.delete(key);
    }
  }
}
