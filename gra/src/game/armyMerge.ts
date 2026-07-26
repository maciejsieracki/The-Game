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
  /** MAP-Q1: rep token ids z chipem głodu (armia państwa głoduje). */
  starvingRepIds?: Set<string>;
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

/**
 * C-GARN-Q1 rozszerzenie (Maciej 2026-07-26): "Ufortyfikuj" chowa jednostkę
 * (RuntimeUnit.inGarnizon=true) do garnizonu miasta — wtedy visibleStackOnHex
 * (powyżej) świadomie ją wyklucza, bo ten filtr steruje też merge'em armii
 * i blokadami ruchu na mapie (NIE zmieniamy go — patrz handoff C-GARN-Q1).
 * Bez tej funkcji jednostka raz ufortyfikowana nie miała już żadnego stosu do
 * policzenia ruchu/akcji (playerStackAt zwracał pustą tablicę), więc mimo że
 * dało się ją "zaznaczyć" z listy armii, każda akcja (ruch, Czuwaj, Pomiń)
 * była no-opem.
 *
 * `activeUnitStack` daje "stos do działania" dla JUŻ ZAZNACZONEJ jednostki:
 * ukryta w garnizonie -> stos-solo [u] (Ufort. chowa tylko JEDNĄ konkretną
 * jednostkę, nie cały widoczny stos, więc wyjście też jest per-jednostka);
 * w przeciwnym razie zwykły, widoczny stos na jej heksie (bez zmian).
 */
export function activeUnitStack(
  units: RuntimeUnit[],
  active: RuntimeUnit,
): RuntimeUnit[] {
  if (active.inGarnizon === true) return [active];
  return visibleStackOnHex(units, active.q, active.r, active.ownerId);
}

/**
 * Wyprowadza jednostkę z ukrytego garnizonu: odfortyfikowanie + budzenie
 * (sentry) w jednym kroku — dokładnie to, czego oczekuje właściciel przy
 * rozkazie ruchu wydanym jednostce z listy armii ("wtedy automatycznie
 * następuje odfortyfikowanie albo odśpienie"), a także przycisk „Opuść
 * garnizon" w panelu miasta i w panelu akcji jednostki.
 * Mutuje `u` w miejscu; zwraca `true`, jeśli coś się rzeczywiście zmieniło
 * (żeby wołający zsynchronizował licznik garnizonu miasta — `city.garnizon`).
 */
export function exitGarnizon(u: RuntimeUnit): boolean {
  if (u.inGarnizon !== true) return false;
  u.inGarnizon = false;
  u.sentry = false;
  return true;
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

/** Cofnięcie wielu jednostek (np. cały przybywający stos) — po jednym heksie każda. */
export function assignBounceHexesForUnits(
  units: RuntimeUnit[],
  preferQ: number,
  preferR: number,
  unitIds: readonly string[],
  isPassable?: (q: number, r: number) => boolean,
): Map<string, { q: number; r: number }> {
  const passable = (q: number, r: number): boolean =>
    isPassable ? isPassable(q, r) : true;
  const out = new Map<string, { q: number; r: number }>();
  const virtualOcc = new Set<string>();

  const isOccupied = (q: number, r: number, exceptId: string): boolean => {
    const k = keyOf(q, r);
    if (virtualOcc.has(k)) return true;
    return units.some(
      u => u.id !== exceptId
        && !unitIds.includes(u.id)
        && u.q === q
        && u.r === r
        && u.inGarnizon !== true,
    );
  };

  const trySpot = (exceptId: string): { q: number; r: number } | null => {
    if (!isOccupied(preferQ, preferR, exceptId) && passable(preferQ, preferR)) {
      return { q: preferQ, r: preferR };
    }
    for (const [dq, dr] of NEIGH) {
      const q = preferQ + dq;
      const r = preferR + dr;
      if (!passable(q, r)) continue;
      if (!isOccupied(q, r, exceptId)) return { q, r };
    }
    return null;
  };

  for (const uid of unitIds) {
    const spot = trySpot(uid);
    if (!spot) continue;
    out.set(uid, spot);
    virtualOcc.add(keyOf(spot.q, spot.r));
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

/** Wspólny pul ruchu stosu — minimum z członków (par. 6b: armia rusza łącznie). */
export function stackRuchLeft(stack: ReadonlyArray<RuntimeUnit>): number {
  if (stack.length === 0) return 0;
  return Math.min(...stack.map(u => u.ruchLeft));
}

/** Ujednolic ruchLeft wszystkich członków stosu (domyślnie = min obecnych). */
export function syncStackRuchLeft(stack: RuntimeUnit[], ruchLeft?: number): void {
  if (stack.length === 0) return;
  const v = ruchLeft ?? stackRuchLeft(stack);
  for (const u of stack) u.ruchLeft = v;
}

/** Odejmij koszt ruchu od wspólnego pulu stosu. */
export function deductStackRuchLeft(stack: RuntimeUnit[], cost: number): void {
  syncStackRuchLeft(stack, Math.max(0, stackRuchLeft(stack) - cost));
}

/** Jednostka z ruchLeft = pul stosu (do pathfindingu). */
export function unitWithStackRuch(
  unit: RuntimeUnit,
  stack: ReadonlyArray<RuntimeUnit>,
): RuntimeUnit {
  if (stack.length <= 1) return unit;
  const pooled = stackRuchLeft(stack);
  return pooled === unit.ruchLeft ? unit : { ...unit, ruchLeft: pooled };
}

/**
 * Jednostki właściciela na heksie miasta → bonus Prawo (Porządek).
 * Liczy stojące na polu miasta i ukryte w garnizonie (inGarnizon); pomija oblegających.
 */
export function countLawGarrisonOnCityHex(
  units: ReadonlyArray<RuntimeUnit>,
  cityQ: number,
  cityR: number,
  ownerId: number,
): number {
  return units.filter(
    u => u.ownerId === ownerId
      && u.q === cityQ
      && u.r === cityR
      && !u.oblegaCityId,
  ).length;
}

/** Jednostki na heksie miasta (do panelu Porządek / lista garnizonu). */
export function unitsOnCityHexForLaw(
  units: ReadonlyArray<RuntimeUnit>,
  cityQ: number,
  cityR: number,
  ownerId: number,
): RuntimeUnit[] {
  return units.filter(
    u => u.ownerId === ownerId
      && u.q === cityQ
      && u.r === cityR
      && !u.oblegaCityId,
  );
}
