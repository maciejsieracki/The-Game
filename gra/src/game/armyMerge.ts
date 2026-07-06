/**
 * armyMerge.ts — stosy armii na mapie: widoczność, merge, split (v1.0).
 */

import type { RuntimeUnit } from '../units/setup';
import { keyOf } from '../units/setup';

const NEIGH: ReadonlyArray<readonly [number, number]> = [
  [1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1],
];

export interface StackDisplayInfo {
  /** Jednostki widoczne na mapie (1 reprezentant na stos). */
  visibleIds: Set<string>;
  /** rep unit id → liczba jednostek na heksie (gdy > 1). */
  badgeByRepId: Map<string, number>;
}

export function visibleStackOnHex(
  units: RuntimeUnit[],
  q: number,
  r: number,
  ownerId: number,
): RuntimeUnit[] {
  return units.filter(
    u => u.ownerId === ownerId && u.q === q && u.r === r && u.inGarnizon !== true,
  );
}

/** Najmocniejsza jednostka stosu (Atak → id). */
export function pickStackRepresentative(
  stack: RuntimeUnit[],
  attackOf: (u: RuntimeUnit) => number,
): RuntimeUnit {
  return stack.reduce((best, u) => {
    const a = attackOf(u);
    const b = attackOf(best);
    if (a !== b) return a > b ? u : best;
    return u.id < best.id ? u : best;
  });
}

/** 1 token na heks — reprezentant najmocniejszy + badge ×N. */
export function computeStackDisplay(
  units: RuntimeUnit[],
  attackOf: (u: RuntimeUnit) => number,
): StackDisplayInfo {
  const byStack = new Map<string, RuntimeUnit[]>();
  for (const u of units) {
    if (u.inGarnizon === true) continue;
    const k = u.ownerId + '|' + u.q + ',' + u.r;
    const arr = byStack.get(k);
    if (arr) arr.push(u);
    else byStack.set(k, [u]);
  }

  const visibleIds = new Set<string>();
  const badgeByRepId = new Map<string, number>();

  for (const stack of byStack.values()) {
    const rep = pickStackRepresentative(stack, attackOf);
    visibleIds.add(rep.id);
    if (stack.length > 1) badgeByRepId.set(rep.id, stack.length);
  }

  return { visibleIds, badgeByRepId };
}

/** Klik na heks — reprezentant stosu (nie losowa jednostka z kupy). */
export function unitAtRepresentative(
  q: number,
  r: number,
  units: RuntimeUnit[],
  attackOf: (u: RuntimeUnit) => number,
): RuntimeUnit | null {
  const stack = units.filter(
    u => u.q === q && u.r === r && u.inGarnizon !== true,
  );
  if (stack.length === 0) return null;
  if (stack.length === 1) return stack[0]!;
  return pickStackRepresentative(stack, attackOf);
}

/** Sąsiednie puste heksy (split cel). */
export function findAdjacentEmptyHexes(
  units: RuntimeUnit[],
  q: number,
  r: number,
  isPassable: (q: number, r: number) => boolean,
): Array<{ q: number; r: number }> {
  const out: Array<{ q: number; r: number }> = [];
  for (const [dq, dr] of NEIGH) {
    const nq = q + dq;
    const nr = r + dr;
    if (!isPassable(nq, nr)) continue;
    const occupied = units.some(
      u => u.q === nq && u.r === nr && u.inGarnizon !== true,
    );
    if (!occupied) out.push({ q: nq, r: nr });
  }
  return out;
}

/** Heks startowy ruchu (skąd przyszła) lub wolny sąsiad lądu — bez zwrotu punktów ruchu. */
export function findBounceHexFromOrigin(
  units: RuntimeUnit[],
  fromQ: number,
  fromR: number,
  exceptUnitId: string,
  isPassable?: (q: number, r: number) => boolean,
): { q: number; r: number } | null {
  return findRejectHex(units, fromQ, fromR, exceptUnitId, isPassable);
}

function findRejectHex(
  units: RuntimeUnit[],
  fromQ: number,
  fromR: number,
  exceptUnitId: string,
  isPassable?: (q: number, r: number) => boolean,
): { q: number; r: number } | null {
  const passable = (q: number, r: number): boolean =>
    isPassable ? isPassable(q, r) : true;

  const occupied = (q: number, r: number): boolean =>
    units.some(u => u.id !== exceptUnitId && u.q === q && u.r === r && u.inGarnizon !== true);

  if (!occupied(fromQ, fromR) && passable(fromQ, fromR)) return { q: fromQ, r: fromR };

  for (const [dq, dr] of NEIGH) {
    const q = fromQ + dq;
    const r = fromR + dr;
    if (!passable(q, r)) continue;
    if (!occupied(q, r)) return { q, r };
  }
  return null;
}

export function stackKey(q: number, r: number): string {
  return keyOf(q, r);
}
