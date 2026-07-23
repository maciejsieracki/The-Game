/**
 * playtestWalkaMapy.ts
 * Presety playtestu walki na mapie.
 *
 * ?playtest=walka | Gra-podglad-PLAYTEST-WALKA.html → 1v1 (Hastati vs Łucznik, bez miasta)
 * ?playtest=oblez → oblężenie (Hastati obok Aten z murem)
 *
 * DUŻE BITWY (28 vs 28, klik jednej jednostki zbiera całą armię — promień
 * PLAYTEST_BITWA_DUZA_ROSTER_RADIUS):
 *   Gra-…-PLAYTEST-BITWA-DUZA.html    → duża bitwa polowa Rzym vs Grecja
 *   Gra-…-PLAYTEST-OBLEZENIE-DUZE.html → duże oblężenie: Grecja broni Aten (mur), Rzym atakuje
 * Skład jednej strony: 10× piechota liniowa (Hastati / Falanga) + 10× Łucznik + 8× Konnica.
 * (battleScene układa piechotę z przodu, łuczników z tyłu, konnicę na skrzydłach —
 *  builder podaje tylko roster.)
 */

import type { GameMap } from '../types/map';
import type { GameData } from '../data/loader';
import { TerenBazowy } from '../types/hex';
import type { City } from './cities';
import { computeVisible } from './visibility';
import type { RuntimeUnit } from '../units/setup';
import { categoryOf, hexDistance, hexNeighborCoords, keyOf } from '../units/setup';

// Marker (side-effect) — przeżywa tree-shaking, potwierdza że duża bitwa jest w bundlu.
(globalThis as any).__CIV_BITWA_DUZA = 'civ-bitwa-duza';

export const PLAYTEST_WALKA_SEED = 424242;

export const PLAYTEST_ROSTER_RADIUS = 1;

/**
 * Promień zbierania rosteru dla DUŻYCH bitew: klaster 28 jednostek mieści się
 * w promieniu ~4–5 od kotwicy, więc 6 gwarantuje, że jeden klik zbiera całą
 * armię strony (collectPlaytestBattleRoster i tak filtruje po ownerId).
 */
export const PLAYTEST_BITWA_DUZA_ROSTER_RADIUS = 6;

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

/** Blok składu: typ jednostki (dokładna nazwa „Jednostka" z units.json) + liczba. */
interface RosterBlock {
  typeId: string;
  count: number;
}

/** Rzym (gracz, ownerId 0): 10× Hastati + 10× Łucznik + 8× Konnica = 28. */
const BITWA_DUZA_PLAYER_BLOCKS: ReadonlyArray<RosterBlock> = [
  { typeId: 'Hastati', count: 10 },
  { typeId: 'Łucznik', count: 10 },
  { typeId: 'Konnica', count: 8 },
];

/** Grecja (wróg, ownerId 1): 10× Falanga + 10× Łucznik + 8× Konnica = 28. */
const BITWA_DUZA_ENEMY_BLOCKS: ReadonlyArray<RosterBlock> = [
  { typeId: 'Falanga', count: 10 },
  { typeId: 'Łucznik', count: 10 },
  { typeId: 'Konnica', count: 8 },
];

function totalRoster(blocks: ReadonlyArray<RosterBlock>): number {
  return blocks.reduce((a, b) => a + b.count, 0);
}

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

/** Duża bitwa polowa (28 vs 28): Gra-…-PLAYTEST-BITWA-DUZA.html */
export function isPlaytestBitwaDuzaMode(): boolean {
  if (typeof location === 'undefined') return false;
  if (new URLSearchParams(location.search).get('playtest') === 'bitwa-duza') return true;
  return /PLAYTEST-BITWA-DUZA/i.test(location.pathname || '');
}

/** Duże oblężenie (28 vs 28, Grecja broni Aten): Gra-…-PLAYTEST-OBLEZENIE-DUZE.html */
export function isPlaytestOblezenieDuzeMode(): boolean {
  if (typeof location === 'undefined') return false;
  if (new URLSearchParams(location.search).get('playtest') === 'oblezenie-duze') return true;
  return /PLAYTEST-OBLEZENIE-DUZE/i.test(location.pathname || '');
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
      def?.['Typ'],
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

// ===========================================================================
// DUŻE BITWY (28 vs 28) — placed clusters, klik jednej jednostki zbiera armię.
// ===========================================================================

/**
 * BFS „spiralą" od kotwicy po lądzie przechodnim: zwraca dokładnie `count`
 * kolejnych, unikalnych heksów lądu (łącznie z kotwicą). `blocked` wyklucza
 * heksy zajęte przez drugą stronę / miasto. null gdy nie starczy lądu.
 */
function collectLandCluster(
  map: GameMap,
  anchorQ: number,
  anchorR: number,
  count: number,
  blocked: Set<string>,
): Array<[number, number]> | null {
  if (!isLandPassable(map, anchorQ, anchorR)) return null;
  if (blocked.has(keyOf(anchorQ, anchorR))) return null;

  const out: Array<[number, number]> = [];
  const seen = new Set<string>();
  const queue: Array<[number, number]> = [[anchorQ, anchorR]];
  seen.add(keyOf(anchorQ, anchorR));

  while (queue.length > 0 && out.length < count) {
    const [q, r] = queue.shift() as [number, number];
    if (blocked.has(keyOf(q, r))) continue;
    if (!isLandPassable(map, q, r)) continue;
    out.push([q, r]);
    for (const { q: nq, r: nr } of hexNeighborCoords(q, r)) {
      const k = keyOf(nq, nr);
      if (seen.has(k)) continue;
      seen.add(k);
      queue.push([nq, nr]);
    }
  }
  return out.length >= count ? out : null;
}

interface BigClusterLayout {
  playerHexes: Array<[number, number]>;
  enemyHexes: Array<[number, number]>;
  playerAnchor: [number, number];
  enemyAnchor: [number, number];
}

/**
 * Dwa rozłączne klastry lądu obok siebie: kotwica gracza + kotwica wroga w
 * odległości `gap` heksów, każda rozrasta się BFS-em do `playerCount`/`enemyCount`.
 * Klaster wroga jest „blocked" dla gracza (i odwrotnie), więc się nie nakładają.
 */
function findBigClusterLayout(
  map: GameMap,
  playerCount: number,
  enemyCount: number,
  gap: number,
): BigClusterLayout | null {
  for (const key of Object.keys(map.hexes)) {
    const [qs, rs] = key.split(',');
    const pQ = Number(qs);
    const pR = Number(rs);
    if (!Number.isFinite(pQ) || !Number.isFinite(pR)) continue;
    if (!isLandPassable(map, pQ, pR)) continue;

    for (const [dq, dr] of NEIGH_DIRS) {
      const eQ = pQ + dq * gap;
      const eR = pR + dr * gap;
      if (!isLandPassable(map, eQ, eR)) continue;

      // Klaster gracza (bez heksów zarezerwowanych na kotwicę wroga).
      const reservedForEnemy = new Set<string>([keyOf(eQ, eR)]);
      const playerHexes = collectLandCluster(map, pQ, pR, playerCount, reservedForEnemy);
      if (!playerHexes) continue;

      const playerSet = new Set(playerHexes.map(([q, r]) => keyOf(q, r)));
      const enemyHexes = collectLandCluster(map, eQ, eR, enemyCount, playerSet);
      if (!enemyHexes) continue;

      return {
        playerHexes,
        enemyHexes,
        playerAnchor: [pQ, pR],
        enemyAnchor: [eQ, eR],
      };
    }
  }
  return null;
}

/** Rozłóż bloki rosteru po podanych heksach; jeden unikalny id na jednostkę. */
function placeRoster(
  hexes: Array<[number, number]>,
  ownerId: number,
  blocks: ReadonlyArray<RosterBlock>,
  data: GameData,
  idPrefix: string,
): RuntimeUnit[] {
  const units: RuntimeUnit[] = [];
  let i = 0;
  for (const block of blocks) {
    const typeId = resolveTypeId(block.typeId, data);
    for (let n = 0; n < block.count && i < hexes.length; n++, i++) {
      const [q, r] = hexes[i]!;
      units.push(makeUnit(idPrefix + i, ownerId, typeId, data, q, r));
    }
  }
  return units;
}

/**
 * DUŻA BITWA POLOWA: Rzym (28) vs Grecja (28) na otwartym lądzie, dwa klastry.
 * focus między klastrami; klik dowolnej jednostki + promień
 * PLAYTEST_BITWA_DUZA_ROSTER_RADIUS zbiera całą jej armię.
 */
export function buildBitwaDuzaPreset(map: GameMap, data: GameData): PlaytestWalkaResult | null {
  const playerCount = totalRoster(BITWA_DUZA_PLAYER_BLOCKS);
  const enemyCount = totalRoster(BITWA_DUZA_ENEMY_BLOCKS);
  const layout = findBigClusterLayout(map, playerCount, enemyCount, 4);
  if (!layout) return null;

  const units: RuntimeUnit[] = [
    ...placeRoster(layout.playerHexes, 0, BITWA_DUZA_PLAYER_BLOCKS, data, 'u'),
    ...placeRoster(layout.enemyHexes, AI_OWNER, BITWA_DUZA_ENEMY_BLOCKS, data, 'e'),
  ];

  const focusQ = Math.round((layout.playerAnchor[0] + layout.enemyAnchor[0]) / 2);
  const focusR = Math.round((layout.playerAnchor[1] + layout.enemyAnchor[1]) / 2);

  const explored = Array.from(
    computeVisible(units.filter(u => u.ownerId === 0), map, 12),
  );

  return {
    units,
    cities: [],
    explored,
    focusQ,
    focusR,
    aiOwnerId: AI_OWNER,
    playerCityId: null,
    enemyCityId: null,
  };
}

/**
 * DUŻE OBLĘŻENIE: Grecja broni Aten (mur), Rzym (28) atakuje klastrem obok muru.
 * Wróg: garnizon + reszta armii na polu wokół miasta. Model jak buildOblezPreset /
 * buildPlaytestOdskokOblezenie, ale duże rostery.
 */
export function buildOblezenieDuzePreset(map: GameMap, data: GameData): PlaytestWalkaResult | null {
  const playerCount = totalRoster(BITWA_DUZA_PLAYER_BLOCKS);
  const enemyCount = totalRoster(BITWA_DUZA_ENEMY_BLOCKS);
  // Miasto stoi na kotwicy wroga; armia obrońcy rozrasta się wokół niej.
  const layout = findBigClusterLayout(map, playerCount, enemyCount, 4);
  if (!layout) return null;

  const [cityQ, cityR] = layout.enemyAnchor;

  // Obrońca = dokładnie 28 jednostek: 1 (pierwsza Falanga) w garnizonie na heksie
  // miasta, pozostałe 27 (skład minus 1 Falanga) na polu wokół muru.
  const fieldBlocks: RosterBlock[] = BITWA_DUZA_ENEMY_BLOCKS.map((b, idx) =>
    idx === 0 ? { typeId: b.typeId, count: Math.max(0, b.count - 1) } : { ...b },
  );
  const enemyOnField = layout.enemyHexes.filter(([q, r]) => !(q === cityQ && r === cityR));
  const enemyUnits = placeRoster(enemyOnField, AI_OWNER, fieldBlocks, data, 'e');
  // Jedna jednostka broni z wewnątrz (garnizon) — pierwsza Falanga.
  const garrisonType = resolveTypeId(BITWA_DUZA_ENEMY_BLOCKS[0]!.typeId, data);
  const garrison: RuntimeUnit = {
    ...makeUnit('e-gar', AI_OWNER, garrisonType, data, cityQ, cityR),
    inGarnizon: true,
  };

  const playerUnits = placeRoster(layout.playerHexes, 0, BITWA_DUZA_PLAYER_BLOCKS, data, 'u');

  const units: RuntimeUnit[] = [...playerUnits, garrison, ...enemyUnits];

  const cities: City[] = [
    makePresetCity('city0', AI_OWNER, cityQ, cityR, 'Ateny'),
  ];

  const focusQ = Math.round((layout.playerAnchor[0] + cityQ) / 2);
  const focusR = Math.round((layout.playerAnchor[1] + cityR) / 2);

  const explored = Array.from(
    computeVisible(units.filter(u => u.ownerId === 0), map, 12),
  );

  return {
    units,
    cities,
    explored,
    focusQ,
    focusR,
    aiOwnerId: AI_OWNER,
    playerCityId: null,
    enemyCityId: 'city0',
  };
}

export const PLAYTEST_WALKA_HINT =
  'PLAYTEST 1v1: Hastati vs wrogi Łucznik (sąsiad). ' +
  'Klik swoją jednostkę → klik wroga = pre-bitwa C-01. Bez miasta na mapie. Ctrl+F5 = restart.';

export const PLAYTEST_OBLEZ_HINT =
  'PLAYTEST oblężenie: Hastati obok Aten (mur). ' +
  'Klik swoją jednostkę → klik Ateny = Oblężaj / Szturm.';

export const PLAYTEST_BITWA_DUZA_HINT =
  'PLAYTEST DUŻA BITWA: Rzym (10 Hastati + 10 Łucznik + 8 Konnica) vs ' +
  'Grecja (10 Falanga + 10 Łucznik + 8 Konnica) na polu. ' +
  'Klik swoją jednostkę → klik wroga = cała armia w bitwie. Ctrl+F5 = restart.';

export const PLAYTEST_OBLEZENIE_DUZE_HINT =
  'PLAYTEST DUŻE OBLĘŻENIE: Rzym (28) szturmuje Ateny (mur) bronione przez Grecję (28 + garnizon). ' +
  'Klik swoją jednostkę → klik Ateny = Oblężaj / Szturm. Ctrl+F5 = restart.';
