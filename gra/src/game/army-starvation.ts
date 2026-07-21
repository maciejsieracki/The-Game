/**
 * army-starvation.ts — głód wojska (B5-Q1): −hpFrac max HP co turę gdy zapasy państwa < 0.
 * SILNIK wywołuje po advanceEmpireFood gdy isArmyStarving(ownerId).
 * Jednostki cywilne (zwiadowca/osadnik/robotnik) są pomijane.
 */
import { isCivilianUnit } from '../units/setup';

export interface StarvationUnit {
  id: string;
  ownerId: number;
  typeId: string;
  category: string;
  hp?: number;
  hpMax?: number;
}

export interface StarvationResult {
  /** id jednostek zniszczonych (hp <= 0 po ticku). */
  destroyedIds: string[];
  /** Liczba jednostek, którym zmniejszono HP. */
  damagedCount: number;
}

/**
 * Stosuje stratę HP na jednostkach właściciela. Inicjalizuje hp/hpMax z getMaxHp gdy brak.
 * @returns destroyedIds — SILNIK usuwa te jednostki z tablicy units.
 */
export function applyArmyStarvationHpLoss(
  units: StarvationUnit[],
  ownerId: number,
  hpFrac: number,
  getMaxHp: (typeId: string) => number,
): StarvationResult {
  const frac = Math.max(0, Math.min(1, hpFrac));
  if (frac <= 0) return { destroyedIds: [], damagedCount: 0 };

  const destroyedIds: string[] = [];
  let damagedCount = 0;

  for (const u of units) {
    if (u.ownerId !== ownerId) continue;
    if (isCivilianUnit(u)) continue;
    const maxHp = u.hpMax ?? getMaxHp(u.typeId);
    if (maxHp <= 0) continue;

    if (u.hpMax == null) u.hpMax = maxHp;
    if (u.hp == null) u.hp = maxHp;

    const loss = Math.max(1, Math.floor(maxHp * frac));
    u.hp = Math.max(0, u.hp - loss);
    damagedCount++;

    if (u.hp <= 0) destroyedIds.push(u.id);
  }

  return { destroyedIds, damagedCount };
}
