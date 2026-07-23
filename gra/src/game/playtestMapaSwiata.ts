/**
 * playtestMapaSwiata.ts
 * Sandbox mapy świata: miasto gracza + jednostka + HUD + budowa — bez menu / kreatora.
 * URL: ?playtest=mapa · Gra-podglad-PLAYTEST-MAPA.html
 *
 * Układ:
 *   [Testpolis + Hastati w mieście] — [Hastati #2 obok] — [Hastati #1 → Ateny + Łucznik w garnizonie]
 */

import type { GameMap } from '../types/map';
import type { GameData } from '../data/loader';
import type { City } from './cities';
import type { CityProduction } from './production';
import type { RuntimeUnit } from '../units/setup';
import { categoryOf, hexDistance, keyOf } from '../units/setup';
import { TerenBazowy } from '../types/hex';
import {
  buildPlaytestMiastoEkonomia,
  PLAYTEST_MIASTO_SEED,
  type PlaytestMiastoResult,
} from './playtestMiastoEkonomia';
import {
  DEFAULT_WORLD_DENSITY,
  densityTierFromLabel,
  densityTierToLabel,
  type WorldGenerationPreset,
} from '../map/newGameMapDefaults';

export { PLAYTEST_MIASTO_SEED as PLAYTEST_MAPA_SEED };

export const PLAYTEST_MAPA_AI_OWNER = 1;

export const PLAYTEST_MAPA_HINT =
  'PLAYTEST MAPA: 3× Hastati · Ateny: Łucznik · szturm = preBattle · Ctrl+F5 = restart · ?density=low|medium|high (E2 gęstość).';

/** E2 — gęstość świata w sandboxie mapy (URL, bez kreatora). */
export function resolvePlaytestMapaWorldDensity(): {
  preset: WorldGenerationPreset;
  labels: { resources: string; rivers: string; desert: string; forest: string; relief: string };
} {
  if (typeof location === 'undefined') {
    const labels = {
      resources: 'Normalnie',
      rivers: 'Normalnie',
      desert: 'Normalnie',
      forest: 'Normalnie',
      relief: 'Normalnie',
    };
    return { preset: { ...DEFAULT_WORLD_DENSITY }, labels };
  }
  const qs = new URLSearchParams(location.search);
  const bulk = qs.get('density') ?? qs.get('gestosc');
  const bulkTier = bulk ? densityTierFromLabel(bulk) : null;
  const axis = (key: keyof WorldGenerationPreset): WorldGenerationPreset[keyof WorldGenerationPreset] => {
    const raw = qs.get(key);
    if (raw) return densityTierFromLabel(raw);
    if (bulkTier) return bulkTier;
    return DEFAULT_WORLD_DENSITY[key];
  };
  const preset: WorldGenerationPreset = {
    resources: axis('resources'),
    rivers: axis('rivers'),
    desert: axis('desert'),
    forest: axis('forest'),
    relief: axis('relief'),
  };
  return {
    preset,
    labels: {
      resources: densityTierToLabel(preset.resources),
      rivers: densityTierToLabel(preset.rivers),
      desert: densityTierToLabel(preset.desert),
      forest: densityTierToLabel(preset.forest),
      relief: densityTierToLabel(preset.relief),
    },
  };
}

export interface PlaytestMapaSwiataResult extends PlaytestMiastoResult {
  units: RuntimeUnit[];
  /** Pula pracy imperium na start (ulepszenia terenu). */
  pracaStart: number;
  pracaRateStart: number;
  aiOwnerId: number;
  enemyCityId: string;
}

export function isPlaytestMapaSwiataMode(): boolean {
  if (typeof location === 'undefined') return false;
  const qs = new URLSearchParams(location.search);
  const pt = qs.get('playtest');
  return pt === 'mapa' || pt === 'sandbox' || /PLAYTEST-MAPA/i.test(location.pathname || '');
}

const NEIGH_DIRS: ReadonlyArray<readonly [number, number]> = [
  [1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1],
];

function resolveUnitType(data: GameData, token: string): string {
  const direct = data.units.find(u => u.Jednostka === token);
  return direct?.Jednostka ?? token;
}

function isLandPassable(map: GameMap, q: number, r: number): boolean {
  const hex = map.hexes[keyOf(q, r)];
  if (!hex) return false;
  const t = hex.terenBazowy;
  return t !== TerenBazowy.Morze && t !== TerenBazowy.Gory;
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
      def?.['Typ'],
    ),
    q,
    r,
    ruch,
    ruchLeft: ruch,
  };
}

function makeEnemyCity(q: number, r: number): City {
  return {
    id: 'city_enemy_1',
    ownerId: PLAYTEST_MAPA_AI_OWNER,
    q,
    r,
    name: 'Ateny',
    population: 4,
    maMur: true,
    magazynZywnosci: 20,
    garnizon: 0,
    oblegane: false,
    podzialHandlu: { procentPieniadz: 50, procentNauka: 25, procentLuksus: 25 },
    podzialPracy: { procentBudynki: 50 },
  };
}

interface CombatLine {
  /** Kierunek linii do Aten (dq, dr). */
  dq: number;
  dr: number;
  playerUnitQ: number;
  playerUnitR: number;
  enemyCityQ: number;
  enemyCityR: number;
}

/** Linia: miasto gracza → … → jednostka gracza (sąsiad miasta wroga). */
function findCombatLine(map: GameMap, playerCity: City): CombatLine | null {
  for (const [dq, dr] of NEIGH_DIRS) {
    const playerUnitQ = playerCity.q + 2 * dq;
    const playerUnitR = playerCity.r + 2 * dr;
    const enemyCityQ = playerCity.q + 3 * dq;
    const enemyCityR = playerCity.r + 3 * dr;

    if (!isLandPassable(map, playerUnitQ, playerUnitR)) continue;
    if (!isLandPassable(map, enemyCityQ, enemyCityR)) continue;

    return {
      dq,
      dr,
      playerUnitQ,
      playerUnitR,
      enemyCityQ,
      enemyCityR,
    };
  }
  return null;
}

/** Inny sąsiedni heks miasta (do drugiej jednostki gracza). */
function findSecondNeighborHex(
  map: GameMap,
  playerCity: City,
  excludeQ: number,
  excludeR: number,
): { q: number; r: number } | null {
  for (const [dq, dr] of NEIGH_DIRS) {
    const q = playerCity.q + dq;
    const r = playerCity.r + dr;
    if (q === excludeQ && r === excludeR) continue;
    if (!isLandPassable(map, q, r)) continue;
    return { q, r };
  }
  return null;
}

export function buildPlaytestMapaSwiata(map: GameMap, data: GameData): PlaytestMapaSwiataResult | null {
  const base = buildPlaytestMiastoEkonomia(map, data);
  if (!base) return null;

  const playerCity = base.cities[0];
  if (!playerCity) return null;

  const line = findCombatLine(map, playerCity);
  if (!line) return null;

  const playerType = resolveUnitType(data, 'Hastati');

  const adjOnLineQ = playerCity.q + line.dq;
  const adjOnLineR = playerCity.r + line.dr;
  const secondHex = findSecondNeighborHex(map, playerCity, adjOnLineQ, adjOnLineR)
    ?? { q: adjOnLineQ, r: adjOnLineR };

  const units: RuntimeUnit[] = [
    // u0 — przy Atenach (oblężenie)
    makeUnit('u0', 0, playerType, data, line.playerUnitQ, line.playerUnitR),
    // u1 — drugi obok miasta (merge spinaczem)
    makeUnit('u1', 0, playerType, data, secondHex.q, secondHex.r),
    // u2 — trzeci stoi w mieście (merge po wejściu domkiem)
    makeUnit('u2', 0, playerType, data, playerCity.q, playerCity.r),
  ];

  const enemyCity = makeEnemyCity(line.enemyCityQ, line.enemyCityR);
  const cities = [...base.cities, enemyCity];

  const enemyArcherType = resolveUnitType(data, 'Łucznik');
  units.push(
    makeUnit('e0', PLAYTEST_MAPA_AI_OWNER, enemyArcherType, data, enemyCity.q, enemyCity.r),
  );

  const explored = new Set(base.explored);
  for (const key of Object.keys(map.hexes)) {
    const [qs, rs] = key.split(',');
    const q = Number(qs);
    const r = Number(rs);
    if (!Number.isFinite(q) || !Number.isFinite(r)) continue;
    if (hexDistance(playerCity.q, playerCity.r, q, r) <= 12) explored.add(key);
  }

  return {
    ...base,
    cities,
    explored: [...explored],
    visible: base.visible,
    units,
    pracaStart: 800,
    pracaRateStart: 28,
    aiOwnerId: PLAYTEST_MAPA_AI_OWNER,
    enemyCityId: enemyCity.id,
  };
}
