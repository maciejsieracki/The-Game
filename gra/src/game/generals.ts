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
