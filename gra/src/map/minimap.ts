/**
 * map/minimap.ts (Grupa A / lane MAPA)
 * D15=B — getMinimapData(): dane heksów dla UI minimapy (wariant B kontraktu hud.ts).
 * UI rysuje lekką siatkę 2D; MAPA dostarcza tylko dane (bez WebGL w slocie HUD).
 */

import type { GameMap } from '../types/map';
import { TerenBazowy } from '../types/hex';
import { worldToAxial, HEX_R } from '../render/hexutil';

/** Zgodne z gra/src/ui/hud.ts — MinimapHexData. */
export interface MinimapHexData {
  q: number;
  r: number;
  teren: string;
  ownerColor?: string | undefined;
  /** hidden = fog; explored = widziane kiedys; visible = aktualny wzrok */
  fog?: 'hidden' | 'explored' | 'visible';
}

/** Kontrakt A-START-04 / B-zasieg-miasta-fog: silnik przekazuje te same zbiory co scene.setFog(). */

/** Zgodne z gra/src/ui/minimapHud.ts — MinimapMarkerData. */
export interface MinimapMarkerData {
  q: number;
  r: number;
  kind: 'city' | 'outpost' | 'unit';
  color: string;
}

/** Zgodne z gra/src/ui/hud.ts — MinimapData. */
export interface MinimapData {
  cols: number;
  rows: number;
  hexes: MinimapHexData[];
  viewport?: { x: number; y: number; w: number; h: number } | undefined;
  markers?: MinimapMarkerData[];
}

export interface MinimapCityInput {
  q: number;
  r: number;
  ownerColor?: string;
  isOutpost?: boolean;
}

export interface MinimapUnitInput {
  q: number;
  r: number;
  ownerColor?: string;
}

/** Minimalny opis kamery (bez zależności od Three.js). */
export interface MinimapCameraInput {
  targetX: number;
  targetZ: number;
  distance?: number;
  fov?: number;
  aspect?: number;
}

export interface GetMinimapDataOptions {
  /** Mapowanie playerId / civId → kolor CSS (#rrggbb). */
  playerColors?: Record<string, string>;
  /** Aktualnie widoczne hexy (q,r). */
  visible?: Set<string>;
  /** Odkryte hexy (mgla). */
  explored?: Set<string>;
}

const TEREN_KEY: Record<TerenBazowy, string> = {
  [TerenBazowy.Laka]: 'Laka',
  [TerenBazowy.Rownina]: 'Rownina',
  [TerenBazowy.Wzgorza]: 'Wzgorza',
  [TerenBazowy.Gory]: 'Gory',
  [TerenBazowy.Wybrzeze]: 'Wybrzeze',
  [TerenBazowy.Morze]: 'Morze',
  [TerenBazowy.Pustynia]: 'Pustynia',
};

const DEFAULT_CITY_COLOR = '#ffd479';
const DEFAULT_OUTPOST_COLOR = '#88aaff';
const DEFAULT_UNIT_COLOR = '#ffffff';

function computeViewport(
  map: GameMap,
  camera: MinimapCameraInput,
): { x: number; y: number; w: number; h: number } | undefined {
  const dist = camera.distance ?? 40;
  const fov = camera.fov ?? (45 * Math.PI) / 180;
  const aspect = camera.aspect ?? 1.4;
  const halfW = dist * Math.tan(fov / 2) * aspect;
  const halfH = dist * Math.tan(fov / 2);

  const tl = worldToAxial(camera.targetX - halfW, camera.targetZ - halfH, HEX_R);
  const br = worldToAxial(camera.targetX + halfW, camera.targetZ + halfH, HEX_R);

  const minQ = Math.max(0, Math.min(tl.q, br.q));
  const minR = Math.max(0, Math.min(tl.r, br.r));
  const maxQ = Math.min(map.szerokoscQ - 1, Math.max(tl.q, br.q));
  const maxR = Math.min(map.wysokoscR - 1, Math.max(tl.r, br.r));

  if (maxQ <= minQ || maxR <= minR) return undefined;
  return { x: minQ, y: minR, w: maxQ - minQ + 1, h: maxR - minR + 1 };
}

/**
 * Zwraca siatkę kolorów/właścicieli heksów dla UI minimapy (D15=B).
 *
 * @param map      GameMap (hexes + wymiary)
 * @param camera   Pozycja kamery (viewport opcjonalny); null = bez ramki widoku
 * @param cities   Miasta/posterunki — nadpisują ownerColor na heksie
 * @param units    Jednostki — ownerColor na heksie gdy brak właściciela terenu
 * @param options  playerColors dla hex.wlasciciel
 */
export function getMinimapData(
  map: GameMap,
  camera: MinimapCameraInput | null,
  cities: MinimapCityInput[] = [],
  units: MinimapUnitInput[] = [],
  options: GetMinimapDataOptions = {},
): MinimapData {
  const { playerColors = {}, visible, explored } = options;
  const useFog = visible !== undefined && explored !== undefined;

  const ownerOverride = new Map<string, string>();
  for (const c of cities) {
    ownerOverride.set(
      `${c.q},${c.r}`,
      c.ownerColor ?? (c.isOutpost ? DEFAULT_OUTPOST_COLOR : DEFAULT_CITY_COLOR),
    );
  }
  for (const u of units) {
    const key = `${u.q},${u.r}`;
    if (!ownerOverride.has(key) && u.ownerColor) {
      ownerOverride.set(key, u.ownerColor);
    }
  }

  const hexes: MinimapHexData[] = [];
  for (const hex of Object.values(map.hexes)) {
    const { q, r } = hex.coords;
    const key = `${q},${r}`;
    let ownerColor = ownerOverride.get(key);
    if (!ownerColor && hex.wlasciciel) {
      ownerColor = playerColors[hex.wlasciciel];
    }
    hexes.push({
      q,
      r,
      teren: TEREN_KEY[hex.terenBazowy] ?? 'Rownina',
      ownerColor,
      fog: useFog
        ? (visible!.has(key) ? 'visible' : explored!.has(key) ? 'explored' : 'hidden')
        : undefined,
    });
  }

  const viewport = camera ? computeViewport(map, camera) : undefined;

  const markers: MinimapMarkerData[] = [];
  for (const c of cities) {
    markers.push({
      q: c.q,
      r: c.r,
      kind: c.isOutpost ? 'outpost' : 'city',
      color: c.ownerColor ?? (c.isOutpost ? DEFAULT_OUTPOST_COLOR : DEFAULT_CITY_COLOR),
    });
  }
  for (const u of units) {
    markers.push({
      q: u.q,
      r: u.r,
      kind: 'unit',
      color: u.ownerColor ?? DEFAULT_UNIT_COLOR,
    });
  }

  return {
    cols: map.szerokoscQ,
    rows: map.wysokoscR,
    hexes,
    viewport,
    markers,
  };
}
