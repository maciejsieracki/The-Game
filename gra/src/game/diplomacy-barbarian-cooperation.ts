/**
 * R-DYPLO-WSPOLNA-WALKA-BARB-PRZEMARSZ-Q1.
 * Pure contract and roster rules for the temporary, symmetric cooperation deal.
 */
import type { ActiveDeal } from './diplomacy-treaties';
import { hasBarbarianCooperationTreaty } from './diplomacy-treaties';
import { hexDistance, isCivilianUnit } from '../units/setup';
import type { RuntimeUnit } from '../units/setup';

export const BARBARIAN_COOPERATION_RADIUS = 2;
/**
 * R-DYPLO-WSPOLNA-WALKA-BARB-KARENCJA-Q1 (korekta wcześniejszego zamierzenia właściciela):
 * ta stała NIE JEST już czasem trwania samej umowy (patrz
 * `BARBARIAN_COOPERATION_DURATION_CHOICES`/`BARBARIAN_COOPERATION_DEFAULT_DURATION_TURNS`
 * niżej) — jest długością OKRESU KARENCJI PO WYGAŚNIĘCIU LUB JEDNOSTRONNYM USUNIĘCIU
 * traktatu: przez tyle tur `hasAuthorizedBorderCrossing` nadal traktuje parę jak
 * autoryzowaną do przemarszu wojskowego (bez kary Zaufania), dając czas na wycofanie
 * jednostek — mechanizm karencji żyje w `diplomacy-treaties.ts`
 * (`recordBarbarianCooperationGrace`/`isBarbarianCooperationGraceActive`).
 */
export const BARBARIAN_COOPERATION_TURNS = 3;
/** Jawne wybory gracza w formularzu „Wspólna walka z barbarzyńcami" (Bezterminowy = osobna opcja, `treatyTurns: 0`). */
export const BARBARIAN_COOPERATION_DURATION_CHOICES: readonly number[] = [5, 10, 15];
/** Domyślny czas trwania, gdy payload nie niesie jawnego `treatyTurns` (środek widełek wyżej). */
export const BARBARIAN_COOPERATION_DEFAULT_DURATION_TURNS = 10;

/**
 * Jednostka kwalifikuje się do automatycznej pomocy tylko jako aktywna jednostka
 * lądowa. Jednostki już obsługiwane przez trwającą bitwę są blokowane do jej końca.
 */
export function isEligibleBarbarianCooperationUnit(
  unit: RuntimeUnit,
  activeBattleUnitIds: ReadonlySet<string> = new Set(),
): boolean {
  return !isCivilianUnit(unit)
    && unit.inGarnizon !== true
    && unit.embarked !== true
    && unit.seaRaider !== true
    && unit.oblegaCityId === undefined
    && !activeBattleUnitIds.has(unit.id);
}

/**
 * Dodaje do normalnego rosteru jednostki partnera objętego aktywną umową,
 * znajdujące się w promieniu 2 od heksa walki. Roster własnego właściciela
 * pozostaje nietknięty — ta funkcja tylko dołącza pomocników.
 */
export function collectBarbarianCooperationUnits(
  battleOwnerId: number,
  battleQ: number,
  battleR: number,
  allUnits: readonly RuntimeUnit[],
  activeDeals: readonly ActiveDeal[],
  activeBattleUnitIds: ReadonlySet<string> = new Set(),
): RuntimeUnit[] {
  const partnerIds = new Set<number>();
  for (const unit of allUnits) {
    if (unit.ownerId === battleOwnerId || unit.ownerId === -1) continue;
    if (!hasBarbarianCooperationTreaty(activeDeals, battleOwnerId, unit.ownerId)) continue;
    partnerIds.add(unit.ownerId);
  }
  return allUnits.filter(unit =>
    partnerIds.has(unit.ownerId)
      && isEligibleBarbarianCooperationUnit(unit, activeBattleUnitIds)
      && hexDistance(unit.q, unit.r, battleQ, battleR) <= BARBARIAN_COOPERATION_RADIUS,
  );
}

/** Stabilny, testowalny merge bez duplikatów; kotwica/własny roster zachowuje kolejność. */
export function mergeBattleRosterWithBarbarianCooperation(
  baseRoster: readonly RuntimeUnit[],
  helpers: readonly RuntimeUnit[],
): RuntimeUnit[] {
  const out = [...baseRoster];
  const seen = new Set(out.map(unit => unit.id));
  for (const helper of helpers) {
    if (seen.has(helper.id)) continue;
    seen.add(helper.id);
    out.push(helper);
  }
  return out;
}
