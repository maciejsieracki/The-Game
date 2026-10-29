/** General recruitment cap: one at the start, then one additional General per era. */
export function generalLimitForEra(era: number): number {
  return Number.isFinite(era) ? Math.max(1, Math.floor(era)) : 1;
}

export interface GeneralRosterCount {
  alive: number;
  queued: number;
}

/** A General queued for recruitment reserves a slot just like a living General. */
export function generalSlotsUsed(count: GeneralRosterCount): number {
  return Math.max(0, Math.floor(count.alive)) + Math.max(0, Math.floor(count.queued));
}

export function canRecruitGeneral(era: number, count: GeneralRosterCount): boolean {
  return generalSlotsUsed(count) < generalLimitForEra(era);
}

/** Stone-era leader model: ordinary infantry before the Wheel, ox chariot after it. */
export function stoneGeneralUnitId(hasWheel: boolean): 'Wojownik' | 'Rydwan (woły)' {
  return hasWheel ? 'Rydwan (woły)' : 'Wojownik';
}

export interface GeneralPurchaseRequest extends GeneralRosterCount {
  cityId: string;
  capitalCityId: string;
  era: number;
  requestedQuantity: number;
  requestedItemId: string;
  requestedCost: number;
  offeredItemId: string | null;
  offeredCost: number | null;
}

/** Run the real purchase continuation only when the selected city and offer are valid. */
export function attemptGeneralPurchase(request: GeneralPurchaseRequest, purchase: () => boolean): boolean {
  if (request.requestedQuantity !== 1 || request.cityId !== request.capitalCityId) return false;
  if (!request.offeredItemId || request.offeredItemId !== request.requestedItemId) return false;
  if (request.offeredCost == null || request.offeredCost !== request.requestedCost) return false;
  if (!canRecruitGeneral(request.era, request)) return false;
  return purchase();
}

/** A newborn non-General unit's destination is the live position of its owner's General. */
export function generalFollowDestination(
  unit: { ownerId: number; inGarnizon?: boolean; oblegaCityId?: string },
  general: { ownerId: number; q: number; r: number; id: string; isGeneral?: boolean } | undefined,
): { point: { q: number; r: number }; generalTargetId: string } | null {
  if (!general || general.isGeneral !== true || general.ownerId !== unit.ownerId
      || unit.inGarnizon === true || unit.oblegaCityId) return null;
  return { point: { q: general.q, r: general.r }, generalTargetId: general.id };
}

export interface GeneralFollowCandidate {
  id: string;
  ownerId: number;
  q: number;
  r: number;
  isGeneral?: boolean;
  hp?: number;
  dead?: boolean;
  removed?: boolean;
  routed?: boolean;
}

/** Select the nearest living commander belonging to a non-commander unit's owner. */
export function nearestLivingGeneral<T extends GeneralFollowCandidate>(
  unit: GeneralFollowCandidate,
  roster: readonly T[],
): T | undefined {
  if (unit.isGeneral === true || unit.dead === true || unit.removed === true || unit.routed === true) return undefined;
  return roster
    .filter(candidate => candidate.id !== unit.id
      && candidate.ownerId === unit.ownerId
      && candidate.isGeneral === true
      && candidate.dead !== true
      && candidate.removed !== true
      && candidate.routed !== true
      && (candidate.hp == null || candidate.hp > 0))
    .sort((a, b) => hexDistance(unit.q, unit.r, a.q, a.r) - hexDistance(unit.q, unit.r, b.q, b.r)
      || a.id.localeCompare(b.id))[0];
}

function hexDistance(aq: number, ar: number, bq: number, br: number): number {
  const dq = aq - bq;
  const dr = ar - br;
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
}

/** Plan and enqueue every deferred newborn that can follow its owner's live General. */
export function planDeferredGeneralMarchBatch(
  unitIds: readonly string[],
  planUnit: (unitId: string) => boolean,
  enqueue: (unitIds: string[]) => void,
): string[] {
  const marchingIds: string[] = [];
  for (const unitId of unitIds) {
    if (planUnit(unitId)) marchingIds.push(unitId);
  }
  if (marchingIds.length > 0) enqueue(marchingIds);
  return marchingIds;
}
