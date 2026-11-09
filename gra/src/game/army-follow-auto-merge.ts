/**
 * army-follow-auto-merge.ts — R-WEB-ARMY-FOLLOW-LEADER-AUTO-MERGE-NO-PROMPT-Q1.
 *
 * Gdy jednostka gracza ma wlaczony tryb „Idz do wodza” (`followGeneral`) i dotarla na heks
 * armii wodza, scalenie dzieje sie AUTOMATYCZNIE, bez monitu o polaczenie. Pytanie o polaczenie
 * zostaje tylko przy recznym najechaniu jednostka bez trybu podazania (decyzja wlasciciela).
 *
 * Modul jest czysty (bez importow z main.ts / renderu) — decyzje sa testowalne headless
 * (gra/tools/army-follow-leader-auto-merge-test.cjs) i uzywa ich promptMergeIfCoLocated w main.ts.
 */
import { canJoinStackAt, type StackUnitLike } from './army-stack-limit';

export interface FollowAutoMergeUnit extends StackUnitLike {
  followGeneral?: boolean;
  isGeneral?: boolean;
}

/**
 * - `merge`: wszystkie wchodzace jednostki podazaja za wodzem, a na heksie stoi wodz → scal bez monitu.
 * - `limit-blocked`: to samo, ale scalenie przekroczyloby limit armii → hint, bez scalania i bez monitu.
 * - `none`: brak automatu → dotychczasowy monit (reczne najechanie albo brak wodza na heksie).
 */
export type FollowAutoMergeDecision = 'none' | 'merge' | 'limit-blocked';

/**
 * Decyzja automatycznego scalenia dla wchodzacych jednostek `arriving` na heks (q,r).
 * `existing` = jednostki wlasciciela juz stojace na heksie (bez wchodzacych);
 * `units` = pelna lista jednostek (do liczenia limitu stosu na heksie).
 */
export function followLeaderAutoMergeDecision(
  units: ReadonlyArray<FollowAutoMergeUnit>,
  arriving: ReadonlyArray<FollowAutoMergeUnit>,
  existing: ReadonlyArray<FollowAutoMergeUnit>,
  q: number,
  r: number,
  limit: number,
): FollowAutoMergeDecision {
  if (arriving.length === 0 || existing.length === 0) return 'none';
  if (!arriving.every(u => u.followGeneral === true && u.isGeneral !== true)) return 'none';
  if (!existing.some(u => u.isGeneral === true)) return 'none';
  if (!canJoinStackAt(units, arriving, q, r, limit)) return 'limit-blocked';
  return 'merge';
}
