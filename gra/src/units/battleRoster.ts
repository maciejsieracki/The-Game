/**
 * battleRoster.ts — skład armii na potyczkę (C1-Q4 / D8=A).
 * PURE: heks kotwicy + własne jednostki w promieniu 1 heksa.
 */

import type { RuntimeUnit } from './setup';
import { hexDistance } from './setup';

/** Jednostki tej samej frakcji co kotwica w promieniu 1 heksa (w tym kotwica). */
export function collectBattleRoster(
  anchor: RuntimeUnit,
  allUnits: readonly RuntimeUnit[],
): RuntimeUnit[] {
  const out: RuntimeUnit[] = [];
  const seen = new Set<string | number>();
  for (const u of allUnits) {
    if (u.ownerId !== anchor.ownerId) continue;
    if (hexDistance(anchor.q, anchor.r, u.q, u.r) > 1) continue;
    if (seen.has(u.id)) continue;
    seen.add(u.id);
    out.push(u);
  }
  if (!out.some(x => x.id === anchor.id)) out.unshift(anchor);
  return out;
}

/** Atakujący przy mieście — ta sama reguła co collectBattleRoster (dist≤1 od miasta). */
export function collectAtkRosterNearCity(
  city: { q: number; r: number },
  anchor: RuntimeUnit,
  allUnits: readonly RuntimeUnit[],
): RuntimeUnit[] {
  const out: RuntimeUnit[] = [];
  const seen = new Set<string | number>();
  for (const u of allUnits) {
    if (u.ownerId !== anchor.ownerId) continue;
    if (hexDistance(u.q, u.r, city.q, city.r) > 1) continue;
    if (seen.has(u.id)) continue;
    seen.add(u.id);
    out.push(u);
  }
  if (!out.some(x => x.id === anchor.id)) out.unshift(anchor);
  return out;
}
