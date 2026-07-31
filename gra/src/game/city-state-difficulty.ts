/**
 * Trudność państw-miast vs trudność gry + reguły konsolidacji klastra (AI-CS-CLUSTER-DIFF 2026-07-30).
 */

export type DifficultyLevel = 'easy' | 'normal' | 'hard';

/** Odwrócona skala Maciej 2026-07-30: łatwa gra → trudne PM, trudna gra → łatwe PM. */
export function cityStateDifficultyFromGameDifficulty(diff: DifficultyLevel): DifficultyLevel {
  if (diff === 'easy') return 'hard';
  if (diff === 'hard') return 'easy';
  return 'normal';
}

export const CLUSTER_CS_WAR_MIN_TURN = 20;
export const CLUSTER_CS_CONQUEST_DEADLINE_TURN = 100;

/**
 * Gdy trudność państw-miast = hard: od tury 20 każde PM co turę ma szansę
 * wypowiedzieć wojnę graczowi (Maciej 2026-07-30; podniesione do 60% po playteście t.24).
 * Blokada: aktywny traktat handlowy / surowcowy z graczem.
 */
export const CITY_STATE_PLAYER_WAR_MIN_TURN = 20;
export const CITY_STATE_PLAYER_WAR_CHANCE = 0.60;

/**
 * Czy to państwo-miasto ma w tej turze wypowiedzieć wojnę graczowi (rzut raz na turę).
 */
export function shouldCityStateRollWarOnPlayer(
  cityStateDifficulty: DifficultyLevel,
  turn: number,
  atWarWithPlayer: boolean,
  hasTradeOrResourceTreatyWithPlayer: boolean,
  rng: () => number = Math.random,
  /** Aktywna karencja pokoju z graczem — nie wypowiadaj wojny mimo roll. */
  peaceLockedWithPlayer = false,
  /** Aktywny pakt nieagresji z graczem — twardy zakaz DOW do wygaśnięcia. */
  hasNapWithPlayer = false,
): boolean {
  if (cityStateDifficulty !== 'hard') return false;
  if (turn < CITY_STATE_PLAYER_WAR_MIN_TURN) return false;
  if (atWarWithPlayer) return false;
  if (hasTradeOrResourceTreatyWithPlayer) return false;
  if (peaceLockedWithPlayer) return false;
  if (hasNapWithPlayer) return false;
  return rng() < CITY_STATE_PLAYER_WAR_CHANCE;
}

export interface ClusterStateTarget {
  ownerId: number;
  q: number;
  r: number;
}

function axialDistance(q1: number, r1: number, q2: number, r2: number): number {
  const dq = q1 - q2;
  const dr = r1 - r2;
  return (Math.abs(dq) + Math.abs(dq + dr) + Math.abs(dr)) / 2;
}

/** Twardy priorytet przejęcia CS z kręgu do tury 100 (bez kar przy niepowodzeniu). */
export function isClusterConquestDeadlineActive(
  turn: number,
  clusterStateTargets: ReadonlyArray<ClusterStateTarget>,
): boolean {
  return turn <= CLUSTER_CS_CONQUEST_DEADLINE_TURN && clusterStateTargets.length > 0;
}

/**
 * Wybiera ownerId państwa-miasta z kręgu do wymuszonej wojny:
 * - tura >= 20 i brak wojny z żadnym CS kręgu, lub
 * - aktywny deadline konsolidacji i pozostały CS bez wojny.
 * Zwraca null gdy wymuszenie nie jest potrzebne.
 */
export function pickClusterCityStateWarTargetId(
  turn: number,
  clusterStateTargets: ReadonlyArray<ClusterStateTarget>,
  atWarOwnerIds: ReadonlySet<number>,
  referenceHex?: { q: number; r: number },
  /** OwnerIds chronione paktem nieagresji — nie wybieraj do wymuszonej wojny. */
  napBlockedOwnerIds?: ReadonlySet<number>,
): number | null {
  if (clusterStateTargets.length === 0) return null;

  const napBlocked = napBlockedOwnerIds ?? new Set<number>();
  const notAtWar = clusterStateTargets.filter(
    t => !atWarOwnerIds.has(t.ownerId) && !napBlocked.has(t.ownerId),
  );
  if (notAtWar.length === 0) return null;

  const anyAtWar = clusterStateTargets.some(t => atWarOwnerIds.has(t.ownerId));
  const turn20Force = turn >= CLUSTER_CS_WAR_MIN_TURN && !anyAtWar;
  const deadlineForce = turn >= CLUSTER_CS_WAR_MIN_TURN
    && isClusterConquestDeadlineActive(turn, clusterStateTargets);

  if (!turn20Force && !deadlineForce) return null;

  const pickNearest = (): number => {
    if (!referenceHex) return notAtWar[0]!.ownerId;
    let best = notAtWar[0]!;
    let bestDist = axialDistance(best.q, best.r, referenceHex.q, referenceHex.r);
    for (let i = 1; i < notAtWar.length; i++) {
      const t = notAtWar[i]!;
      const d = axialDistance(t.q, t.r, referenceHex.q, referenceHex.r);
      if (d < bestDist) {
        best = t;
        bestDist = d;
      }
    }
    return best.ownerId;
  };

  return pickNearest();
}
