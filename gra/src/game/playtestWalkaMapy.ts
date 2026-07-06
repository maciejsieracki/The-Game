/**
 * playtestWalkaMapy.ts
 * Presety playtestu walki na mapie.
 *
 * ?playtest=walka | Gra-podglad-PLAYTEST-WALKA.html → 1v1 (Hastati vs Łucznik, bez miasta)
 * ?playtest=oblez → oblężenie (Hastati obok Aten z murem)
 */

import type { GameMap } from '../types/map';
import type { GameData } from '../data/loader';
import { TerenBazowy } from '../types/hex';
import type { City } from './cities';
import { computeVisible } from './visibility';
import type { RuntimeUnit } from '../units/setup';
import { categoryOf, hexDistance, keyOf } from '../units/setup';

export const PLAYTEST_WALKA_SEED = 424242;

export const PLAYTEST_ROSTER_RADIUS = 1;

export type PlaytestWalkaVariant = '1v1' | 'oblez';

export interface PlaytestWalkaResult {
  units: RuntimeUnit[];
  cities: City[];
  explored: string[];
  focusQ: number;
  focusR: number;
  aiOwnerId: number;
  /** Brak miasta gracza w tym presetcie. */
  playerCityId: null;
  enemyCityId: string | null;
}

const PLAYER_TYPE = 'Hastati';
const ENEMY_UNIT_TYPE = 'Łucznik';
const AI_OWNER = 1;

const NEIGH_DIRS: ReadonlyArray<readonly [number, number]> = [
  [1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1],
];

export function resolvePlaytestWalkaVariant(): PlaytestWalkaVariant {
  if (typeof location === 'undefined') return '1v1';
  const qs = new URLSearchParams(location.search);
  if (qs.get('playtest') === 'oblez') return 'oblez';
  return '1v1';
}

export function isPlaytestWalkaMode(): boolean {
  if (typeof location === 'undefined') return false;
  const qs = new URLSearchParams(location.search);
  const pt = qs.get('playtest');
  return pt === 'walka' || pt === 'oblez' || /PLAYTEST-WALKA/i.test(location.pathname || '');
}

export function collectPlaytestBattleRoster(
  anchor: RuntimeUnit,
  allUnits: RuntimeUnit[],
  radius: number = PLAYTEST_ROSTER_RADIUS,
): RuntimeUnit[] {
  const out: RuntimeUnit[] = [];
  const seen = new Set<string | number>();
  for (const u of allUnits) {
    if (u.ownerId !== anchor.ownerId) continue;
    if (hexDistance(anchor.q, anchor.r, u.q, u.r) > radius) continue;
    if (seen.has(u.id)) continue;
    seen.add(u.id);
    out.push(u);
  }
  if (!out.some(x => x.id === anchor.id)) out.unshift(anchor);
  return out;
}

function isLandPassable(map: GameMap, q: number, r: number): boolean {
  const hex = map.hexes[keyOf(q, r)];
  if (!hex) return false;
  const t = hex.terenBazowy;
  return t !== TerenBazowy.Morze && t !== TerenBazowy.Wybrzeze && t !== TerenBazowy.Gory;
}

function resolveTypeId(token: string, data: GameData): string {
  const direct = data.units.find(u => u.Jednostka === token);
  return direct?.Jednostka ?? token;
}

function makeUnit(
  id: string,
  ownerId: number,
  typeId: string,
  data: GameData,
  q: number,
  r: number,
): RuntimeUnit {
  const def = data.units.find(u => u.Jednostka === typeId);
  const ruch = def && typeof def.Ruch === 'number' && def.Ruch > 0 ? def.Ruch : 2;
  return {
    id,
    ownerId,
    typeId,
    category: categoryOf(
      typeId,
      def?.['Rola (linia)'] ?? '',
      def?.['Super-jednostka'] === 'TAK',
    ),
    q,
    r,
    ruch,
    ruchLeft: ruch,
  };
}

function makePresetCity(
  id: string,
  ownerId: number,
  q: number,
  r: number,
  name: string,
): City {
  return {
    id,
    ownerId,
    q,
    r,
    name,
    population: 4,
    maMur: true,
    magazynZywnosci: 20,
    garnizon: 0,
    oblegane: false,
    podzialHandlu: { procentPieniadz: 50, procentNauka: 25, procentLuksus: 25 },
    podzialPracy: { procentBudynki: 50 },
  };
}

interface PairLayout {
  playerQ: number;
  playerR: number;
  foeQ: number;
  foeR: number;
}

/** Para sąsiednich heksów lądu. */
function findAdjacentLandPair(map: GameMap): PairLayout | null {
  for (const key of Object.keys(map.hexes)) {
    const [qs, rs] = key.split(',');
    const playerQ = Number(qs);
    const playerR = Number(rs);
    if (!Number.isFinite(playerQ) || !Number.isFinite(playerR)) continue;
    if (!isLandPassable(map, playerQ, playerR)) continue;

    for (const [dq, dr] of NEIGH_DIRS) {
      const foeQ = playerQ + dq;
      const foeR = playerR + dr;
      if (!isLandPassable(map, foeQ, foeR)) continue;
      return { playerQ, playerR, foeQ, foeR };
    }
  }
  return null;
}

function build1v1Preset(map: GameMap, data: GameData): PlaytestWalkaResult | null {
  const layout = findAdjacentLandPair(map);
  if (!layout) return null;

  const playerType = resolveTypeId(PLAYER_TYPE, data);
  const enemyType = resolveTypeId(ENEMY_UNIT_TYPE, data);

  const units: RuntimeUnit[] = [
    makeUnit('u0', 0, playerType, data, layout.playerQ, layout.playerR),
    makeUnit('u-ai-1', AI_OWNER, enemyType, data, layout.foeQ, layout.foeR),
  ];

  const explored = Array.from(
    computeVisible(units.filter(u => u.ownerId === 0), map, 10),
  );

  return {
    units,
    cities: [],
    explored,
    focusQ: layout.playerQ,
    focusR: layout.playerR,
    aiOwnerId: AI_OWNER,
    playerCityId: null,
    enemyCityId: null,
  };
}

function buildOblezPreset(map: GameMap, data: GameData): PlaytestWalkaResult | null {
  const layout = findAdjacentLandPair(map);
  if (!layout) return null;

  const playerType = resolveTypeId(PLAYER_TYPE, data);

  const units: RuntimeUnit[] = [
    makeUnit('u0', 0, playerType, data, layout.playerQ, layout.playerR),
  ];

  const cities: City[] = [
    makePresetCity('city0', AI_OWNER, layout.foeQ, layout.foeR, 'Ateny'),
  ];

  const explored = Array.from(
    computeVisible(units.filter(u => u.ownerId === 0), map, 10),
  );

  return {
    units,
    cities,
    explored,
    focusQ: layout.playerQ,
    focusR: layout.playerR,
    aiOwnerId: AI_OWNER,
    playerCityId: null,
    enemyCityId: 'city0',
  };
}

export function buildPlaytestWalkaMapy(
  map: GameMap,
  data: GameData,
  variant: PlaytestWalkaVariant = resolvePlaytestWalkaVariant(),
): PlaytestWalkaResult | null {
  return variant === 'oblez' ? buildOblezPreset(map, data) : build1v1Preset(map, data);
}

export const PLAYTEST_WALKA_HINT =
  'PLAYTEST 1v1: Hastati vs wrogi Łucznik (sąsiad). ' +
  'Klik swoją jednostkę → klik wroga = pre-bitwa C-01. Bez miasta na mapie. Ctrl+F5 = restart.';

export const PLAYTEST_OBLEZ_HINT =
  'PLAYTEST oblężenie: Hastati obok Aten (mur). ' +
  'Klik swoją jednostkę → klik Ateny = Oblężaj / Szturm.';
