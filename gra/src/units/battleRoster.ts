/**
 * battleRoster.ts — skład armii na potyczkę (C1-Q4 / D8=A).
 * PURE: heks kotwicy + własne jednostki w promieniu 1 heksa.
 * Wykluczenie cywilów (zwiadowca/osadnik/robotnik) z sąsiednich hexów —
 * kanon: isFieldBattleUnit + „bez zwiadowców, osadników w M polu" (GRUPA-C).
 */

import type { RuntimeUnit } from './setup';
import { hexDistance, isCivilianUnit } from './setup';

export type BattleRosterSide = 'attacker' | 'defender';

export interface BattleRosterIncludeCtx {
  side: BattleRosterSide;
  anchor: RuntimeUnit;
  /** Heks starcia — cywil obrońcy tylko gdy stoi na tym hexie. */
  battleHex: { q: number; r: number };
}

/**
 * Cywile w bitwie tylko gdy:
 * - atakujący: jednostka-kotwica (bezpośrednio atakuje / zaatakowana),
 * - obrońca: stoi na hexie starcia (np. garnizon w mieście).
 */
export function shouldIncludeInBattleRoster(
  u: RuntimeUnit,
  ctx: BattleRosterIncludeCtx,
): boolean {
  if (!isCivilianUnit(u)) return true;
  if (ctx.side === 'attacker') return u.id === ctx.anchor.id;
  return u.q === ctx.battleHex.q && u.r === ctx.battleHex.r;
}

function collectUnitsInRadius(
  anchor: RuntimeUnit,
  allUnits: readonly RuntimeUnit[],
  radiusFrom: (u: RuntimeUnit) => number,
  ctx: BattleRosterIncludeCtx,
): RuntimeUnit[] {
  const out: RuntimeUnit[] = [];
  const seen = new Set<string | number>();
  for (const u of allUnits) {
    if (u.ownerId !== anchor.ownerId) continue;
    if (radiusFrom(u) > 1) continue;
    if (!shouldIncludeInBattleRoster(u, ctx)) continue;
    if (seen.has(u.id)) continue;
    seen.add(u.id);
    out.push(u);
  }
  if (!out.some(x => x.id === anchor.id) && shouldIncludeInBattleRoster(anchor, ctx)) {
    out.unshift(anchor);
  }
  // Kotwica zawsze pierwsza — lead capture / post-battle używa atkRoster[0].
  const anchorIdx = out.findIndex(x => x.id === anchor.id);
  if (anchorIdx > 0) {
    out.splice(anchorIdx, 1);
    out.unshift(anchor);
  }
  return out;
}

/** Jednostki tej samej frakcji co kotwica w promieniu 1 heksa (w tym kotwica). */
export function collectBattleRoster(
  anchor: RuntimeUnit,
  allUnits: readonly RuntimeUnit[],
  side: BattleRosterSide = 'attacker',
): RuntimeUnit[] {
  const battleHex = { q: anchor.q, r: anchor.r };
  const ctx: BattleRosterIncludeCtx = { side, anchor, battleHex };
  return collectUnitsInRadius(
    anchor,
    allUnits,
    u => hexDistance(anchor.q, anchor.r, u.q, u.r),
    ctx,
  );
}

/** Atakujący przy mieście — dist≤1 od miasta; bez cywilów-z sąsiadów. */
export function collectAtkRosterNearCity(
  city: { q: number; r: number },
  anchor: RuntimeUnit,
  allUnits: readonly RuntimeUnit[],
): RuntimeUnit[] {
  const ctx: BattleRosterIncludeCtx = {
    side: 'attacker',
    anchor,
    battleHex: { q: city.q, r: city.r },
  };
  return collectUnitsInRadius(
    anchor,
    allUnits,
    u => hexDistance(u.q, u.r, city.q, city.r),
    ctx,
  );
}

/** Obrońcy przy mieście — dist≤1; cywil tylko na hexie miasta. */
export function collectDefRosterNearCity(
  city: { q: number; r: number },
  allUnits: readonly RuntimeUnit[],
): RuntimeUnit[] {
  const anchorOnCity = allUnits.find(
    u => u.q === city.q && u.r === city.r,
  );
  const anchor: RuntimeUnit = anchorOnCity ?? {
    id: '__city_hex__',
    ownerId: allUnits.find(u => hexDistance(u.q, u.r, city.q, city.r) <= 1)?.ownerId ?? -1,
    typeId: '__anchor__',
    category: 'domyslny',
    q: city.q,
    r: city.r,
    ruch: 0,
    ruchLeft: 0,
  };
  const ctx: BattleRosterIncludeCtx = {
    side: 'defender',
    anchor,
    battleHex: { q: city.q, r: city.r },
  };
  const out: RuntimeUnit[] = [];
  const seen = new Set<string | number>();
  for (const u of allUnits) {
    if (hexDistance(u.q, u.r, city.q, city.r) > 1) continue;
    if (!shouldIncludeInBattleRoster(u, ctx)) continue;
    if (seen.has(u.id)) continue;
    seen.add(u.id);
    out.push(u);
  }
  return out;
}
