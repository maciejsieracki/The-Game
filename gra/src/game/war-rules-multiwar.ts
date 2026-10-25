/**
 * war-rules-multiwar.ts -- R-WEB-WAR-RULES-MULTIWAR-Q1 (regula TYMCZASOWA).
 *
 * Czysty moduł (zero DOM, zero RNG, zero dostępu do stanu gry). Zawiera:
 *  - bramki wypowiadania wojen (R1 opóźnienie do tury 40, R2 limit równoczesnych wojen
 *    w Kamieniu na cywilizację, R3 jedna wojna epoki na epokę w skali świata),
 *  - wybór celu zaangażowania (W1: armia najpierw walczy z najbliższą armią wroga),
 *  - przydział grup armii do wrogów (W2: podział armii przy k>1 wojnach, proporcjonalnie
 *    do siły przeciwników, całe zgrupowania, bez dzielenia).
 *
 * Wartości progów są w `gra/data/war-rules-params.json` (nie w kodzie).
 * FLAGA: `WAR_RULES_MULTIWAR_ENABLED` -- OFF = dotychczasowe zachowanie (wołający
 * nie czyta tych funkcji / nie przekazuje kontekstu do planera).
 */

import warRulesParamsRaw from '../../data/war-rules-params.json';

export interface WarRulesParams {
  delayInterCivWarsUntilTurn: number;
  maxConcurrentWarsStone: number | null;
  maxConcurrentWarsFromBronze: number | null;
  maxEraForcedWarsPerEra: number;
  engageRadiusHexes: number;
  splitArmyByWarCount: boolean;
}

export const WAR_RULES_PARAMS: WarRulesParams = {
  delayInterCivWarsUntilTurn: warRulesParamsRaw.delayInterCivWarsUntilTurn,
  maxConcurrentWarsStone: warRulesParamsRaw.maxConcurrentWarsStone,
  maxConcurrentWarsFromBronze: warRulesParamsRaw.maxConcurrentWarsFromBronze,
  maxEraForcedWarsPerEra: warRulesParamsRaw.maxEraForcedWarsPerEra,
  engageRadiusHexes: warRulesParamsRaw.engageRadiusHexes,
  splitArmyByWarCount: warRulesParamsRaw.splitArmyByWarCount,
};

/** GŁÓWNA FLAGA reguł wojen (OFF = baza, hash stanu identyczny). */
export const WAR_RULES_MULTIWAR_ENABLED = true;

let overrideValue: boolean | null = null;

/** Tylko testy/diagnostyka: wymusza ON/OFF; null = wróć do stałej. */
export function setWarRulesMultiwarOverride(value: boolean | null): void {
  overrideValue = value;
}

export function isWarRulesMultiwarEnabled(): boolean {
  return overrideValue !== null ? overrideValue : WAR_RULES_MULTIWAR_ENABLED;
}

/** Epoka Kamienia (zgodnie z `empireEpochForOwner(...) === 1` w main.ts). */
export const WAR_ERA_STONE = 1;
/** Epoka Brązu i późniejsze: brak limitu równoczesnych wojen (parametr `null`). */
export const WAR_ERA_BRONZE = 2;

/** R1: czy wojny między cywilizacjami są już dozwolone w tej turze. */
export function isInterCivWarOpenAtTurn(
  turn: number,
  params: WarRulesParams = WAR_RULES_PARAMS,
): boolean {
  return turn >= params.delayInterCivWarsUntilTurn;
}

/** R2: limit równoczesnych wojen cywilizacji w danej epoce (`null` = bez limitu). */
export function concurrentWarLimitForEra(
  era: number,
  params: WarRulesParams = WAR_RULES_PARAMS,
): number | null {
  if (era === WAR_ERA_STONE) return params.maxConcurrentWarsStone;
  return params.maxConcurrentWarsFromBronze;
}

export interface InterCivWarGateInput {
  turn: number;
  /** Epoka napastnika (1 = Kamień). */
  attackerEra: number;
  /** Liczba aktywnych wojen napastnika z INNYMI CYWILIZACJAMI (bez barbarzyńców, włącznie z graczem). */
  attackerWarCount: number;
  /** Cel jest graczem -- gracz nie ma limitu (jego wybór), ale napastnik AI nadal ma. */
  targetIsPlayer: boolean;
  /** Epoka celu (ignorowana gdy `targetIsPlayer`). */
  targetEra: number;
  /** Liczba aktywnych wojen celu (ignorowana gdy `targetIsPlayer`). */
  targetWarCount: number;
}

export type WarGateReason = 'ok' | 'delay_r1' | 'stone_limit_attacker_r2' | 'stone_limit_target_r2';

/**
 * Bramka wypowiedzenia wojny między cywilizacjami (R1 + R2). Zwraca powód blokady
 * albo 'ok'. Napastnik AI w Kamieniu z już trwającą wojną nie wypowiada kolejnej, w tym
 * graczowi; cel AI w Kamieniu z już trwającą wojną nie może zostać zmuszony do kolejnej.
 */
export function evaluateInterCivWarGate(
  inp: InterCivWarGateInput,
  params: WarRulesParams = WAR_RULES_PARAMS,
): WarGateReason {
  if (!isInterCivWarOpenAtTurn(inp.turn, params)) return 'delay_r1';
  const attackerLimit = concurrentWarLimitForEra(inp.attackerEra, params);
  if (attackerLimit !== null && inp.attackerWarCount >= attackerLimit) return 'stone_limit_attacker_r2';
  if (!inp.targetIsPlayer) {
    const targetLimit = concurrentWarLimitForEra(inp.targetEra, params);
    if (targetLimit !== null && inp.targetWarCount >= targetLimit) return 'stone_limit_target_r2';
  }
  return 'ok';
}

/** Etykieta epoki wojny wymuszonej z powodu wypowiedzenia (prefiks `R-EPOKA-*-WYMUSZONA-WOJNA:`). */
export type ForcedEraTag = 'bronze' | 'stone' | 'iron';

const FORCED_EPOCH_WAR_POWOD_RE = /^R-EPOKA-(BRAZU|KAMIEN|ZELAZO)-WYMUSZONA-WOJNA:/;

/** Zwraca etykietę epoki, jeśli `powod` jest powodem wojny wymuszonej epoki; w przeciwnym razie null. */
export function forcedEraTagFromPowod(powod: string | undefined): ForcedEraTag | null {
  if (typeof powod !== 'string') return null;
  const m = FORCED_EPOCH_WAR_POWOD_RE.exec(powod);
  if (!m) return null;
  if (m[1] === 'BRAZU') return 'bronze';
  if (m[1] === 'KAMIEN') return 'stone';
  return 'iron';
}

/**
 * R3: najwyżej `maxEraForcedWarsPerEra` wojen epoki (wymuszonych) na epokę, w skali
 * CAŁEGO świata. `declaredByTag` = liczba już wypowiedzianych wojen epoki danej etykiety.
 */
export function canDeclareEraForcedWar(
  tag: ForcedEraTag,
  declaredByTag: ReadonlyMap<ForcedEraTag, number>,
  params: WarRulesParams = WAR_RULES_PARAMS,
): boolean {
  return (declaredByTag.get(tag) ?? 0) < params.maxEraForcedWarsPerEra;
}

export interface EngageArmyHex {
  q: number;
  r: number;
  ownerId: number;
}

/**
 * W1: najbliższa wrogą armia w promieniu zaangażowania od kotwicy grupy (`anchor`).
 * Remis dystansu: mniejsze q, potem mniejsze r, potem mniejszy ownerId (deterministycznie).
 * Zwraca null, gdy brak wrogiej armii w promieniu => grupa maszeruje na stolicę.
 */
export function pickEngagementArmy(
  anchor: { q: number; r: number },
  enemyArmies: ReadonlyArray<EngageArmyHex>,
  hexDistanceFn: (aq: number, ar: number, bq: number, br: number) => number,
  radius: number = WAR_RULES_PARAMS.engageRadiusHexes,
): EngageArmyHex | null {
  let best: EngageArmyHex | null = null;
  let bestD = Infinity;
  for (const e of enemyArmies) {
    const d = hexDistanceFn(anchor.q, anchor.r, e.q, e.r);
    if (d > radius) continue;
    if (
      d < bestD
      || (d === bestD && best !== null && (e.q < best.q || (e.q === best.q && (e.r < best.r || (e.r === best.r && e.ownerId < best.ownerId)))))
    ) {
      best = e;
      bestD = d;
    }
  }
  return best;
}

export interface ArmyGroupRef {
  id: string;
  size: number;
}

export interface EnemyStrengthRef {
  ownerId: number;
  strength: number;
}

/**
 * W2: przydział CAŁYCH grup armii do wrogów proporcjonalnie do siły przeciwników.
 * Najpierw (jeśli grup wystarcza) każdy wróg dostaje min. 1 grupę (największe grupy
 * najpierw), potem każda pozostała grupa idzie do wroga z największym deficytem
 * (idealny udział - przydzielona liczba jednostek). Remis: mniejszy ownerId.
 * Grupy NIE są dzielone. Zwraca mapę groupId -> ownerId.
 */
export function allocateGroupsToEnemies(
  groups: ReadonlyArray<ArmyGroupRef>,
  enemies: ReadonlyArray<EnemyStrengthRef>,
): Map<string, number> {
  const out = new Map<string, number>();
  if (groups.length === 0 || enemies.length === 0) return out;
  const enemiesSorted = enemies.slice().sort((a, b) => a.ownerId - b.ownerId);
  const totalStrength = enemiesSorted.reduce((s, e) => s + Math.max(0, e.strength), 0);
  const totalSize = groups.reduce((s, g) => s + g.size, 0);
  const ideal = new Map<number, number>();
  for (const e of enemiesSorted) {
    const share = totalStrength > 0 ? Math.max(0, e.strength) / totalStrength : 1 / enemiesSorted.length;
    ideal.set(e.ownerId, share * totalSize);
  }
  const assigned = new Map<number, number>();
  for (const e of enemiesSorted) assigned.set(e.ownerId, 0);
  const order = groups.slice().sort((a, b) => b.size - a.size || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  // Min. 1 grupa na wroga, jeśli grup wystarcza (najsilniejszy wróg dostaje największą grupę).
  let gi = 0;
  if (order.length >= enemiesSorted.length) {
    const byStrength = enemiesSorted.slice().sort((a, b) => b.strength - a.strength || a.ownerId - b.ownerId);
    for (const e of byStrength) {
      const g = order[gi++]!;
      out.set(g.id, e.ownerId);
      assigned.set(e.ownerId, (assigned.get(e.ownerId) ?? 0) + g.size);
    }
  }
  for (; gi < order.length; gi++) {
    const g = order[gi]!;
    let bestOwner = enemiesSorted[0]!.ownerId;
    let bestDeficit = -Infinity;
    for (const e of enemiesSorted) {
      const deficit = (ideal.get(e.ownerId) ?? 0) - (assigned.get(e.ownerId) ?? 0);
      if (deficit > bestDeficit) {
        bestDeficit = deficit;
        bestOwner = e.ownerId;
      }
    }
    out.set(g.id, bestOwner);
    assigned.set(bestOwner, (assigned.get(bestOwner) ?? 0) + g.size);
  }
  return out;
}
