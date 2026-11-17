/**
 * R-WEB-ARMY-AMBUSH-ACTION-CORE-Q1 (runda 4) -- JADRO KROKU RUCHU wobec zasadzki.
 *
 * Wyodrebnione z main.ts (zagniezdzone funkcje startAnimatedMove / applyMarchSegmentInstant / executor AI /
 * petla barbarzyncow), zeby wpiecie dalo sie testowac na REALNYM kodzie (nie `String.includes` na zrodle) i
 * zeby mutacje (usuniecie guardu, zly predykat miasta, brak zdjecia stanu) byly widoczne dla testow.
 * main.ts wola WYLACZNIE te funkcje -- nie ma wlasnej kopii regul.
 *
 * Modul czysty: bez DOM i stanu globalnego; zaleznosci od swiata gry (wojna, miasta) jako parametry.
 */
import type { RuntimeUnit } from '../units/setup';
import { hexDistance } from '../units/setup';
import {
  cancelAmbush,
  isStackAmbushed,
  reconcileAmbush,
  resolveAmbushTrigger,
  truncatePathAtAmbush,
  unitsVisibleToViewer,
  isAmbushHiddenFromMover,
  type AmbushWarPredicate,
} from './ambush';

/** Rozkaz ruchu zdejmuje zasadzke ze stosu, ktory sie rusza (armia przestaje czekac). */
export function releaseAmbushOnMoveOrder(stack: RuntimeUnit[]): void {
  cancelAmbush(stack);
}

/** Cykl zycia zasadzki w swiecie gry: miasto na heksie = zasadzka wygasa. Zwraca liczbe zdjetych stanow. */
export function reconcileAmbushInWorld(
  units: RuntimeUnit[],
  cities: ReadonlyArray<{ q: number; r: number }>,
): number {
  return reconcileAmbush(units, (q, r) => cities.some(c => c.q === q && c.r === r));
}

/** Jednostki, ktore widz (wlasciciel widoku) moze narysowac / wskazac / policzyc -- bez cudzych zasadzek. */
export function unitsForViewer<T extends Pick<RuntimeUnit, 'ownerId' | 'ambush'>>(
  units: ReadonlyArray<T>,
  viewerOwnerId: number,
): T[] {
  return unitsVisibleToViewer(units, viewerOwnerId);
}

export type AmbushMovePlan<T extends { q: number; r: number }> =
  /** Trasa czysta (brak zasadzki wroga na trasie). */
  | { kind: 'clear'; path: T[] }
  /** Zasadzka na trasie, ale ruch nie ma prawa otworzyc bitwy (np. koniec tury bez `launchAttack`): ruch nie rusza. */
  | { kind: 'blocked'; path: T[]; ambushHex: { q: number; r: number } }
  /** Zasadzka tuz przy starcie (pusta trasa): bitwa od razu, bez ruchu. */
  | { kind: 'fire-now'; path: T[]; ambushHex: { q: number; r: number } }
  /** Trasa przycieta przed zasadzka; po ruchu otwiera sie bitwa o heks zasadzki. */
  | { kind: 'cut'; path: T[]; ambushHex: { q: number; r: number } };

/**
 * Plan kroku ruchu gracza (animowanego `launchAttack=true`, albo natychmiastowego marszu konca tury).
 * `launchAttack=false`: zasadzka zostaje nietknieta, a ruch sie nie odbywa (kind 'blocked').
 */
export function planPlayerAmbushMove<T extends { q: number; r: number }>(
  units: ReadonlyArray<Pick<RuntimeUnit, 'ownerId' | 'ambush' | 'q' | 'r'>>,
  path: ReadonlyArray<T>,
  moverOwnerId: number,
  isAtWar: AmbushWarPredicate,
  launchAttack: boolean,
): AmbushMovePlan<T> {
  const cut = truncatePathAtAmbush(units, path, moverOwnerId, isAtWar);
  if (cut.ambushHex === undefined) return { kind: 'clear', path: cut.path };
  if (!launchAttack) return { kind: 'blocked', path: [], ambushHex: cut.ambushHex };
  if (cut.path.length === 0) return { kind: 'fire-now', path: [], ambushHex: cut.ambushHex };
  return { kind: 'cut', path: cut.path, ambushHex: cut.ambushHex };
}

export interface AmbushBattleOrder {
  defender: RuntimeUnit;
  revealed: RuntimeUnit[];
  ambushOwnerId: number;
}

/**
 * Przycinacz trasy AI (wykonawca ruchu): `cut(path)` obcina trase przed zasadzka wroga w wojnie i zapamietuje heks
 * zasadzki, `hit()` zwraca go po ruchu (do `resolveAmbushAfterMove`).
 */
export function makeAmbushPathCutter(
  units: ReadonlyArray<Pick<RuntimeUnit, 'ownerId' | 'ambush' | 'q' | 'r'>>,
  moverOwnerId: number,
  isAtWar: AmbushWarPredicate,
): {
  cut: <T extends { q: number; r: number }>(path: ReadonlyArray<T>) => T[];
  hit: () => { q: number; r: number } | undefined;
} {
  let hitHex: { q: number; r: number } | undefined;
  return {
    cut: <T extends { q: number; r: number }>(path: ReadonlyArray<T>): T[] => {
      const res = truncatePathAtAmbush(units, path, moverOwnerId, isAtWar);
      if (res.ambushHex !== undefined) hitHex = res.ambushHex;
      return res.path;
    },
    hit: () => hitHex,
  };
}

/**
 * Po ruchu AI / barbarzyncy: jesli trasa zostala przycieta przed zasadzka (`ambushHex`) i jednostka stoi
 * BEZPOSREDNIO obok niej -- ujawnia zasadzke i zwraca obronce do rozkazu ataku. Inaczej brak bitwy, a zasadzka
 * zostaje (ruch skonczyl sie dalej od niej).
 */
export function resolveAmbushAfterMove(
  units: RuntimeUnit[],
  mover: Pick<RuntimeUnit, 'q' | 'r' | 'ownerId'>,
  ambushHex: { q: number; r: number } | undefined,
  isAtWar: AmbushWarPredicate,
): AmbushBattleOrder | undefined {
  if (ambushHex === undefined) return undefined;
  if (hexDistance(mover.q, mover.r, ambushHex.q, ambushHex.r) !== 1) return undefined;
  const res = resolveAmbushTrigger(units, ambushHex.q, ambushHex.r, mover.ownerId, isAtWar);
  if (!res.triggered || res.revealed.length === 0) return undefined;
  return { defender: res.revealed[0]!, revealed: res.revealed, ambushOwnerId: res.ambushOwnerId! };
}

/**
 * Lista jednostek widziana przez PLANISTE (AI/barbarzyncy) o wlascicielu `plannerOwnerId`: zasadzki wrogow,
 * z ktorymi moze walczyc (`canEngage`), sa odfiltrowane -- planista traktuje ich heks jak pusty i nie zna
 * ich pozycji (ani jako cel, ani jako zagrozenie). Brak zasadzek = ta sama tablica.
 */
export function unitsForPlanner<T extends Pick<RuntimeUnit, 'ownerId' | 'ambush'>>(
  units: T[],
  plannerOwnerId: number,
  canEngage: (otherOwnerId: number) => boolean,
): T[] {
  if (!units.some(u => u.ambush === true && u.ownerId !== plannerOwnerId && canEngage(u.ownerId))) return units;
  return units.filter(u => !isAmbushHiddenFromMover(u, plannerOwnerId, (_a, b) => canEngage(b)));
}

/** Czy ktorakolwiek jednostka stosu jest w zasadzce (znacznik dla wlasciciela). */
export function stackIsAmbushed(stack: ReadonlyArray<Pick<RuntimeUnit, 'ambush'>>): boolean {
  return isStackAmbushed(stack);
}

/** Plan ruchu `move` barbarzyncy wobec zasadzki (czysty; wydzielony z petli barbarzyncow main.ts). */
export interface BarbarianMovePlan {
  /** Heks docelowy po przycieciu trasy przed zasadzka (= zadany cel, gdy trasa czysta). */
  toQ: number;
  toR: number;
  /** Barbarzynca zostaje w miejscu (zasadzka tuz przy starcie). */
  stays: boolean;
  /** Heks zasadzki, ktora przycela trase (undefined = trasa czysta). */
  ambushHex?: { q: number; r: number };
}

/**
 * Trasa barbarzyncy przez zasadzke gracza/AI (dla niego heks pusty) konczy sie PRZED nia.
 * `fullPath` = trasa do celu liczona pathfindingiem BEZ widocznosci zasadzki; `null` = brak zasadzek, bez zmian.
 */
export function planBarbarianAmbushMove<T extends { q: number; r: number }>(
  units: ReadonlyArray<Pick<RuntimeUnit, 'ownerId' | 'ambush' | 'q' | 'r'>>,
  barb: Pick<RuntimeUnit, 'q' | 'r' | 'ownerId'>,
  destQ: number,
  destR: number,
  fullPath: ReadonlyArray<T> | null,
  isAtWar: AmbushWarPredicate,
): BarbarianMovePlan {
  let toQ = destQ;
  let toR = destR;
  let ambushHex: { q: number; r: number } | undefined;
  if (fullPath !== null) {
    const plan = planPlayerAmbushMove(units, fullPath, barb.ownerId, isAtWar, true);
    if (plan.kind !== 'clear') {
      ambushHex = plan.ambushHex;
      if (plan.path.length === 0) {
        toQ = barb.q;
        toR = barb.r;
      } else {
        const last = plan.path[plan.path.length - 1]!;
        toQ = last.q;
        toR = last.r;
      }
    }
  }
  return { toQ, toR, stays: toQ === barb.q && toR === barb.r, ambushHex };
}

/**
 * Po ruchu barbarzyncy: ujawnia zasadzke (jesli stoi tuz przy niej) i zwraca komende `attack` do wstrzykniecia
 * oraz obronce (do komunikatu dla wlasciciela zasadzki). Brak zasadzki w zasiegu = undefined.
 */
export function buildBarbarianAmbushAttack(
  units: RuntimeUnit[],
  barb: Pick<RuntimeUnit, 'id' | 'q' | 'r' | 'ownerId'>,
  ambushHex: { q: number; r: number } | undefined,
  isAtWar: AmbushWarPredicate,
): { cmd: { type: 'attack'; unitId: string; targetUnitId: string }; defender: RuntimeUnit } | undefined {
  const order = resolveAmbushAfterMove(units, barb, ambushHex, isAtWar);
  if (order === undefined) return undefined;
  return { cmd: { type: 'attack', unitId: barb.id, targetUnitId: order.defender.id }, defender: order.defender };
}
