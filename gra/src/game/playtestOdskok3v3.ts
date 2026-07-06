/**
 * playtestOdskok3v3.ts
 * Scenariusz testu odskoku obrońcy po auto-walce na polu (3 vs 3).
 * URL: ?playtest=odskok · Gra-podglad-PLAYTEST-WALKA.html?playtest=odskok
 *
 * Układ (2 linie na równinie, bez miast):
 *   [e0] [e1] [e2]  ← wróg (3× Łucznik, M≈45 łącznie)
 *   [u0] [u1] [u2]  ← ty (3× Hastati, M≈150 łącznie, ~3× armia)
 *
 * Atak: zaznacz środkowego Hastati (u1) → klik środkowego Łucznika (e1) → Auto.
 * Po wygranej obrońcy powinny odskoczyć o 1–3 heksy w losowym kierunku.
 */

import type { GameMap } from '../types/map';
import type { GameData } from '../data/loader';
import { TerenBazowy } from '../types/hex';
import type { City } from './cities';
import type { RuntimeUnit } from '../units/setup';
import { categoryOf, keyOf, hexNeighborCoords } from '../units/setup';
import { computeVisible } from './visibility';

export const PLAYTEST_ODSKOK_SEED = 331777;

const PLAYER_TYPE = 'Hastati';
/** Słabsi (M≈15 każdy) — łącznie M≈45 vs M≈150 gracza (~3.3× armia). */
const ENEMY_TYPE = 'Łucznik';
const AI_OWNER = 1;

export interface PlaytestOdskok3v3Result {
  units: RuntimeUnit[];
  cities: City[];
  explored: string[];
  focusQ: number;
  focusR: number;
  aiOwnerId: number;
  playerCityId: null;
  enemyCityId: string | null;
}

export function isPlaytestOdskokMode(): boolean {
  if (typeof location === 'undefined') return false;
  const pt = new URLSearchParams(location.search).get('playtest');
  if (pt === 'odskok-obl' || pt === 'odskok-miasto') return false;
  if (pt === 'odskok') return true;
  const path = location.pathname || '';
  if (/PLAYTEST-(ODSKOK-OBLEZENIE|OBLEZENIE)/i.test(path)) return false;
  return /PLAYTEST-ODSKOK/i.test(path);
}

/** 3v3 + Ateny: środkowy Łucznik (e1) w garnizonie, boczne na polu. */
export function isPlaytestOdskokOblezenieMode(): boolean {
  if (typeof location === 'undefined') return false;
  const pt = new URLSearchParams(location.search).get('playtest');
  if (pt === 'odskok-obl' || pt === 'odskok-miasto') return true;
  return /PLAYTEST-(ODSKOK-OBLEZENIE|OBLEZENIE-3v3|OBLEZENIE)/i.test(location.pathname || '');
}

function resolveTypeId(token: string, data: GameData): string {
  const direct = data.units.find(u => u.Jednostka === token);
  return direct?.Jednostka ?? token;
}

function isOpenField(map: GameMap, q: number, r: number): boolean {
  const hex = map.hexes[keyOf(q, r)];
  if (!hex) return false;
  const t = hex.terenBazowy;
  return t !== TerenBazowy.Morze && t !== TerenBazowy.Gory && t !== TerenBazowy.Wybrzeze;
}

/** 3 heksy w linii prostej (kierunek dq,dr) + linia wroga 1 heks w „przód”. */
function tryLineAt(
  map: GameMap,
  u0Q: number,
  u0R: number,
  dq: number,
  dr: number,
  perpQ: number,
  perpR: number,
): LineLayout | null {
  const playerCoords: Array<[number, number]> = [
    [u0Q, u0R],
    [u0Q + dq, u0R + dr],
    [u0Q + 2 * dq, u0R + 2 * dr],
  ];
  const enemyCoords: Array<[number, number]> = playerCoords.map(
    ([q, r]) => [q + perpQ, r + perpR] as [number, number],
  );

  if (!playerCoords.every(([q, r]) => isOpenField(map, q, r))) return null;
  if (!enemyCoords.every(([q, r]) => isOpenField(map, q, r))) return null;

  const retreatCandidates = enemyCoords.flatMap(([q, r]) => [
    [q + perpQ, r + perpR] as [number, number],
    [q + 2 * perpQ, r + 2 * perpR] as [number, number],
  ]);
  if (retreatCandidates.filter(([q, r]) => isOpenField(map, q, r)).length < 3) return null;

  return { u0Q, u0R, dq, dr, perpQ, perpR };
}

interface LineLayout {
  u0Q: number;
  u0R: number;
  dq: number;
  dr: number;
  perpQ: number;
  perpR: number;
}

const LINE_DIRS: ReadonlyArray<readonly [number, number]> = [
  [1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1],
];

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

function makeGarrisonUnit(
  id: string,
  ownerId: number,
  typeId: string,
  data: GameData,
  q: number,
  r: number,
): RuntimeUnit {
  return { ...makeUnit(id, ownerId, typeId, data, q, r), inGarnizon: true };
}

function makeEnemyCity(q: number, r: number, garnizonUnits: number): City {
  return {
    id: 'city_ateny_odskok',
    ownerId: AI_OWNER,
    q,
    r,
    name: 'Ateny',
    population: 4,
    maMur: true,
    magazynZywnosci: 20,
    garnizon: garnizonUnits,
    oblegane: false,
    podzialHandlu: { procentPieniadz: 50, procentNauka: 25, procentLuksus: 25 },
    podzialPracy: { procentBudynki: 50 },
  };
}

function findLineLayout(map: GameMap): LineLayout | null {
  for (const key of Object.keys(map.hexes)) {
    const [qs, rs] = key.split(',');
    const u0Q = Number(qs);
    const u0R = Number(rs);
    if (!Number.isFinite(u0Q) || !Number.isFinite(u0R)) continue;

    for (const [dq, dr] of LINE_DIRS) {
      for (const [perpQ, perpR] of LINE_DIRS) {
        if (dq === perpQ && dr === perpR) continue;
        if (dq === -perpQ && dr === -perpR) continue;
        const hit = tryLineAt(map, u0Q, u0R, dq, dr, perpQ, perpR);
        if (hit) return hit;
      }
    }
  }
  return null;
}

/** Szturm (C3): do składu wchodzą tylko jednostki dist≤1 od miasta — 3 sloty na pierścieniu. */
interface SiegeRingLayout {
  cityQ: number;
  cityR: number;
  playerHexes: Array<[number, number]>;
  enemyHexes: Array<[number, number]>;
}

function pickSiegeRing(map: GameMap, cityQ: number, cityR: number): SiegeRingLayout | null {
  if (!isOpenField(map, cityQ, cityR)) return null;
  const openNeighbors = hexNeighborCoords(cityQ, cityR)
    .filter(({ q, r }) => isOpenField(map, q, r))
    .map(({ q, r }) => [q, r] as [number, number]);
  if (openNeighbors.length < 5) return null;
  return {
    cityQ,
    cityR,
    playerHexes: openNeighbors.slice(0, 3),
    enemyHexes: openNeighbors.slice(3, 5),
  };
}

function findSiegeRingLayout(map: GameMap): SiegeRingLayout | null {
  for (const key of Object.keys(map.hexes)) {
    const [qs, rs] = key.split(',');
    const cityQ = Number(qs);
    const cityR = Number(rs);
    if (!Number.isFinite(cityQ) || !Number.isFinite(cityR)) continue;
    const ring = pickSiegeRing(map, cityQ, cityR);
    if (ring) return ring;
  }
  return null;
}

export function buildPlaytestOdskok3v3(map: GameMap, data: GameData): PlaytestOdskok3v3Result | null {
  const layout = findLineLayout(map);
  if (!layout) return null;

  const playerType = resolveTypeId(PLAYER_TYPE, data);
  const enemyType = resolveTypeId(ENEMY_TYPE, data);
  const { u0Q, u0R, dq, dr, perpQ, perpR } = layout;

  const units: RuntimeUnit[] = [
    makeUnit('u0', 0, playerType, data, u0Q, u0R),
    makeUnit('u1', 0, playerType, data, u0Q + dq, u0R + dr),
    makeUnit('u2', 0, playerType, data, u0Q + 2 * dq, u0R + 2 * dr),
    makeUnit('e0', AI_OWNER, enemyType, data, u0Q + perpQ, u0R + perpR),
    makeUnit('e1', AI_OWNER, enemyType, data, u0Q + dq + perpQ, u0R + dr + perpR),
    makeUnit('e2', AI_OWNER, enemyType, data, u0Q + 2 * dq + perpQ, u0R + 2 * dr + perpR),
  ];

  const explored = Array.from(
    computeVisible(units.filter(u => u.ownerId === 0), map, 12),
  );

  return {
    units,
    cities: [],
    explored,
    focusQ: u0Q + dq,
    focusR: u0R + dr,
    aiOwnerId: AI_OWNER,
    playerCityId: null,
    enemyCityId: null,
  };
}

/**
 * Oblężenie: 3× Hastati na pierścieniu wokół Aten (dist≤1 — wszystkie w szturmie),
 * e1 w garnizonie, e0/e2 na pozostałych heksach przy murze.
 */
export function buildPlaytestOdskokOblezenie(
  map: GameMap,
  data: GameData,
): PlaytestOdskok3v3Result | null {
  const ring = findSiegeRingLayout(map);
  if (!ring) return null;

  const playerType = resolveTypeId(PLAYER_TYPE, data);
  const enemyType = resolveTypeId(ENEMY_TYPE, data);
  const { cityQ, cityR, playerHexes, enemyHexes } = ring;
  const enemyCity = makeEnemyCity(cityQ, cityR, 1);

  const [p0, p1, p2] = playerHexes;
  const [d0, d1] = enemyHexes;
  if (!p0 || !p1 || !p2 || !d0 || !d1) return null;

  const units: RuntimeUnit[] = [
    makeUnit('u0', 0, playerType, data, p0[0], p0[1]),
    makeUnit('u1', 0, playerType, data, p1[0], p1[1]),
    makeUnit('u2', 0, playerType, data, p2[0], p2[1]),
    makeUnit('e0', AI_OWNER, enemyType, data, d0[0], d0[1]),
    makeGarrisonUnit('e1', AI_OWNER, enemyType, data, cityQ, cityR),
    makeUnit('e2', AI_OWNER, enemyType, data, d1[0], d1[1]),
  ];

  const explored = Array.from(
    computeVisible(units.filter(u => u.ownerId === 0 && u.inGarnizon !== true), map, 12),
  );

  return {
    units,
    cities: [enemyCity],
    explored,
    focusQ: p1[0],
    focusR: p1[1],
    aiOwnerId: AI_OWNER,
    playerCityId: null,
    enemyCityId: enemyCity.id,
  };
}

export const PLAYTEST_ODSKOK_HINT =
  'PLAYTEST ODSKOK 3v3 (pole): 3× Hastati vs 3× Łucznik — bez miasta. ' +
  'Środkowy Hastati → środkowy Łucznik → Auto. ' +
  'OBLĘŻENIE MIASTA (e1 w Atenach, e0/e2 na polu): otwórz Gra-podglad-PLAYTEST-OBLEZENIE-3v3.html · Ctrl+F5.';

export const PLAYTEST_ODSKOK_OBLEZENIE_HINT =
  'PLAYTEST OBLĘŻENIE 3v3: 3× Hastati przy murze Aten (wszystkie w szturmie) vs 2× Łucznik + garnizon. ' +
  'Klik miasto → Oblężaj → Szturm — powinno być Szturm (3). Ctrl+F5 = restart.';
