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
  ownerId?: number;
  ownerColor?: string;
  isOutpost?: boolean;
}

export interface MinimapUnitInput {
  q: number;
  r: number;
  ownerId?: number;
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
  /** ownerId gracza (domyślnie 0) — własne miasta/jednostki zawsze na minimapie. */
  playerOwnerId?: number;
  /** false = dev FoW wył. (jak refreshFog bez mgły). */
  fogOn?: boolean;
}

const TEREN_KEY: Record<TerenBazowy, string> = {
  [TerenBazowy.Laka]: 'Laka',
  [TerenBazowy.Rownina]: 'Rownina',
  [TerenBazowy.Wzgorza]: 'Wzgorza',
  [TerenBazowy.Gory]: 'Gory',
  [TerenBazowy.PlytkieMorze]: 'Wybrzeze',
  [TerenBazowy.Morze]: 'Morze',
  [TerenBazowy.Pustynia]: 'Pustynia',
  [TerenBazowy.Polarny]: 'Polarny',
};

const DEFAULT_CITY_COLOR = '#ffd479';
const DEFAULT_OUTPOST_COLOR = '#88aaff';
const DEFAULT_UNIT_COLOR = '#ffffff';

type MinimapFogState = 'hidden' | 'explored' | 'visible';

function hexFogState(
  key: string,
  visible: Set<string>,
  explored: Set<string>,
): MinimapFogState {
  if (visible.has(key)) return 'visible';
  if (explored.has(key)) return 'explored';
  return 'hidden';
}

/** Zgodne z cityRenderer.applyFogVisibility + visibleUnitsList (main.ts). */
function isMinimapMarkerVisible(
  q: number,
  r: number,
  ownerId: number,
  kind: 'city' | 'outpost' | 'unit',
  opts: {
    useFog: boolean;
    fogOn: boolean;
    visible: Set<string>;
    explored: Set<string>;
    playerOwnerId: number;
  },
): boolean {
  if (!opts.useFog || !opts.fogOn) return true;
  if (ownerId === opts.playerOwnerId) return true;
  const key = `${q},${r}`;
  if (kind === 'unit') return opts.visible.has(key);
  return opts.visible.has(key) || opts.explored.has(key);
}

/** Wystawiona też na zewnątrz (TEMAT #23 — woda pozycyjna, audio/muzyka-antyczna.ts
 *  przez main.ts): zwraca dokładnie ten sam prostokąt heksów q/r co ramka widoku na
 *  minimapie — reużycie zamiast liczenia kadru kamery drugi raz. */
export function computeViewport(
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

// FPS: cache statycznej struktury minimapy. q/r/teren heksa nie zmieniają się w trakcie
// gry, więc alokujemy tablicę obiektów + klucze RAZ per mapa; przy każdym wywołaniu tylko
// mutujemy fog + ownerColor (koniec 320k alokacji/wywołanie na dużych mapach). ownerColor
// czytamy z żywego hex.wlasciciel (własność zmienia się), stąd cache referencji heksów.
type MinimapHexRef = GameMap['hexes'][string];
let _mmCacheMap: GameMap | null = null;
let _mmHexes: MinimapHexData[] = [];
let _mmKeys: string[] = [];
let _mmRefs: MinimapHexRef[] = [];

function ensureMinimapCache(map: GameMap): void {
  if (_mmCacheMap === map) return;
  _mmHexes = [];
  _mmKeys = [];
  _mmRefs = [];
  for (const hex of Object.values(map.hexes)) {
    const { q, r } = hex.coords;
    _mmHexes.push({ q, r, teren: TEREN_KEY[hex.terenBazowy] ?? 'Rownina', ownerColor: undefined, fog: undefined });
    _mmKeys.push(`${q},${r}`);
    _mmRefs.push(hex);
  }
  _mmCacheMap = map;
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
  const {
    playerColors = {},
    visible,
    explored,
    playerOwnerId = 0,
    fogOn = true,
  } = options;
  const useFog = visible !== undefined && explored !== undefined;
  const fogOpts = {
    useFog,
    fogOn,
    visible: visible ?? new Set<string>(),
    explored: explored ?? new Set<string>(),
    playerOwnerId,
  };

  const ownerOverride = new Map<string, string>();
  for (const c of cities) {
    const kind = c.isOutpost ? 'outpost' as const : 'city' as const;
    if (!isMinimapMarkerVisible(c.q, c.r, c.ownerId ?? -1, kind, fogOpts)) continue;
    ownerOverride.set(
      `${c.q},${c.r}`,
      c.ownerColor ?? (c.isOutpost ? DEFAULT_OUTPOST_COLOR : DEFAULT_CITY_COLOR),
    );
  }
  for (const u of units) {
    if (!isMinimapMarkerVisible(u.q, u.r, u.ownerId ?? -1, 'unit', fogOpts)) continue;
    const key = `${u.q},${u.r}`;
    if (!ownerOverride.has(key) && u.ownerColor) {
      ownerOverride.set(key, u.ownerColor);
    }
  }

  ensureMinimapCache(map);
  const hexes = _mmHexes;
  for (let i = 0; i < hexes.length; i++) {
    const obj = hexes[i]!;
    const key = _mmKeys[i]!;
    const fog: MinimapFogState | undefined = useFog
      ? hexFogState(key, fogOpts.visible, fogOpts.explored)
      : undefined;
    let ownerColor = ownerOverride.get(key);
    const wl = _mmRefs[i]!.wlasciciel;
    if (!ownerColor && wl) {
      ownerColor = playerColors[wl];
    }
    if (fog === 'hidden') ownerColor = undefined;
    obj.ownerColor = ownerColor;
    obj.fog = fog;
  }

  const viewport = camera ? computeViewport(map, camera) : undefined;

  const markers: MinimapMarkerData[] = [];
  for (const c of cities) {
    const kind = c.isOutpost ? 'outpost' as const : 'city' as const;
    if (!isMinimapMarkerVisible(c.q, c.r, c.ownerId ?? -1, kind, fogOpts)) continue;
    markers.push({
      q: c.q,
      r: c.r,
      kind: c.isOutpost ? 'outpost' : 'city',
      color: c.ownerColor ?? (c.isOutpost ? DEFAULT_OUTPOST_COLOR : DEFAULT_CITY_COLOR),
    });
  }
  for (const u of units) {
    if (!isMinimapMarkerVisible(u.q, u.r, u.ownerId ?? -1, 'unit', fogOpts)) continue;
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
