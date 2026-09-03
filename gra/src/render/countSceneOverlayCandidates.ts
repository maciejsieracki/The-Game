/**
 * Offline licznik kandydatów styledOverlays (bez WebGL) — diagnostyka R-SCENA-PERF.
 * Odwzorowuje warunki pushStyledOverlay w buildScene (scene.ts).
 */
import type { GameMap } from '../types/map';
import { TerenBazowy, Nakladka } from '../types/hex';
import type { MapRenderStyle } from './mapRenderStyle';
import { improvementKeysForHex } from '../game/terrain-improvements';
import { isWaterTerrain } from '../units/setup';

function hash2D(q: number, r: number, seed: number, salt: number): number {
  let h = (Math.imul(q | 0, 0x27d4eb2d) ^ Math.imul(r | 0, 0x165667b1) ^ Math.imul(seed | 0, 0x9e3779b1) ^ Math.imul(salt | 0, 0x85ebca6b)) >>> 0;
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d) >>> 0;
  h ^= h >>> 12;
  h = Math.imul(h, 0x297a2d39) >>> 0;
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

/** Szacunkowa liczba meshów w klastrze lasu (dżungla/minecraft) — do estymacji merge. */
export const EST_FOREST_CLUSTER_MESHES = 12;
/** Oaza klockowa (buildOaza) — zawsze ciężka do collapse. */
export const EST_OASIS_MESHES = 40;

export interface SceneOverlayCandidateCounts {
  total: number;
  jungleForest: number;
  minecraftForest: number;
  minecraftMountain: number;
  minecraftHill: number;
  minecraftBeach: number;
  dune: number;
  oasis: number;
  /** Szacunek overlayów wymagających collapseToMergedMesh (forest + oasis + mesh≥7). */
  estHeavyMerge: number;
  /** Szacunek overlayów lekkich (brzeg 1–6 mesh) — merge pomijany. */
  estLightSkip: number;
}

function makeRnd(seed: number): () => number {
  let rndState = seed;
  return () => {
    rndState = (Math.imul(rndState, 1664525) + 1013904223) >>> 0;
    return rndState / 4294967296;
  };
}

/**
 * Liczy kandydatów styledOverlays dla danego stylu renderu (bez budowania THREE).
 * Kolejność iteracji = Object.values(map.hexes) jak w buildScene.
 */
export function countSceneOverlayCandidates(
  map: GameMap,
  renderStyle: MapRenderStyle = 'roblox',
): SceneOverlayCandidateCounts {
  const useStyledDecor = renderStyle !== 'civ';
  const styledTerrain = useStyledDecor && renderStyle === 'roblox';
  const rnd = makeRnd(map.seed);

  const out: SceneOverlayCandidateCounts = {
    total: 0,
    jungleForest: 0,
    minecraftForest: 0,
    minecraftMountain: 0,
    minecraftHill: 0,
    minecraftBeach: 0,
    dune: 0,
    oasis: 0,
    estHeavyMerge: 0,
    estLightSkip: 0,
  };

  if (!useStyledDecor) return out;

  const bump = (key: keyof Omit<SceneOverlayCandidateCounts, 'total' | 'estHeavyMerge' | 'estLightSkip'>, heavy: boolean): void => {
    out[key]++;
    out.total++;
    if (heavy) out.estHeavyMerge++;
    else out.estLightSkip++;
  };

  for (const hex of Object.values(map.hexes)) {
    const t = hex.terenBazowy;
    const q = hex.coords.q;
    const r = hex.coords.r;

    if (hex.nakladka === Nakladka.Las && !isWaterTerrain(t)) {
      if (styledTerrain) {
        // roblox: las + dżungla = InstancedMesh — nie styledOverlay
      } else if (useStyledDecor) {
        bump('minecraftForest', true);
      }
    }

    if (t === TerenBazowy.Gory && useStyledDecor && !styledTerrain) {
      bump('minecraftMountain', false);
    }

    if (t === TerenBazowy.Wzgorza && useStyledDecor && !styledTerrain) {
      const hillLayers = improvementKeysForHex(hex);
      if (!hillLayers.includes('tarasy')) bump('minecraftHill', false);
    }

    if (t === TerenBazowy.PlytkieMorze && useStyledDecor && renderStyle === 'minecraft') {
      bump('minecraftBeach', false);
    }

    if (t === TerenBazowy.Pustynia && useStyledDecor) {
      if (hash2D(q, r, map.seed, 9) < 0.34) bump('dune', false);
    }

    if (t === TerenBazowy.Pustynia) {
      const oasisRoll = rnd();
      if (oasisRoll < 1.0 / 6.0 && useStyledDecor) {
        bump('oasis', true);
        const palmCount = oasisRoll < 1.0 / 12.0 ? 1 : 2;
        for (let i = 0; i < palmCount; i++) { rnd(); rnd(); }
      }
    }
  }

  return out;
}
