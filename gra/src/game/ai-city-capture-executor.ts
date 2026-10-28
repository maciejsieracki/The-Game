/**
 * Egzekutor zwykłego ruchu AI z wąską ścieżką przejęcia pustego miasta.
 * PURE względem DOM; mutuje wyłącznie przekazaną jednostkę i wywołuje callbacki
 * efektów silnika po zaakceptowaniu prawdziwej komendy.
 */

import { canAiEnterEmptyEnemyCity } from './city-hex-movement';
import { keyOf } from '../units/setup';

export interface AiCityMoveCommand {
  unitId: string;
  toQ: number;
  toR: number;
  targetCityId?: string;
  allowFriendlyStack?: boolean;
}

export interface AiCityMoveUnit {
  id: string;
  ownerId: number;
  q: number;
  r: number;
  ruchLeft: number;
}

export interface AiCityMoveCity {
  id: string;
  ownerId: number;
  q: number;
  r: number;
  maMur?: boolean;
}

export interface AiCityMovePathHex {
  q: number;
  r: number;
}

export interface ExecuteAiCityMoveOptions {
  command: AiCityMoveCommand;
  unit: AiCityMoveUnit;
  cities: readonly AiCityMoveCity[];
  cityBuiltIds: readonly string[];
  hasCityDefenders: boolean;
  /**
   * Czy jednostka wykonująca rozkaz jest cywilna (osadnik/robotnik/zwiadowca).
   * Cywil NIE przejmuje miasta (`tryAutoCaptureEmptyCityAt` wymaga kotwicy
   * niecywilnej), więc nie wolno mu też wejść na heks obcego miasta — inaczej
   * parkuje w cudzym mieście i traci turę bez efektu (parytet z graczem).
   */
  unitIsCivilian: boolean;
  targetVisible: boolean;
  canOccupyCityHex: boolean;
  /** Stan wojny sprawdzany ponownie przy wykonaniu rozkazu, nie tylko przy jego planowaniu. */
  canEngageOwner?: (targetOwnerId: number) => boolean;
  blockedKeys: Set<string>;
  destinationKey: string;
  computePath: (
    unit: AiCityMoveUnit,
    toQ: number,
    toR: number,
    blockedKeys: Set<string>,
  ) => readonly AiCityMovePathHex[];
  /**
   * R-WEB-AI-MOVE-RANGE-Q1: przycięcie trasy do budżetu ruchu jednostki (wołane
   * PRZED zerowaniem `ruchLeft`). Wstrzykiwane z main.ts (koszt terenu jednostki).
   * Gdy trasa zostaje skrócona, koniec nie może stać na zablokowanym heksie
   * (obce miasto/zajęty heks) -- zdejmowany jest do ostatniego wolnego.
   */
  truncatePath?: (path: readonly AiCityMovePathHex[]) => readonly AiCityMovePathHex[];
  onMoved?: () => void;
  onCapture?: (city: AiCityMoveCity, unit: AiCityMoveUnit) => boolean;
}

export interface ExecuteAiCityMoveResult {
  moved: boolean;
  captured: boolean;
  path: readonly AiCityMovePathHex[];
}

/**
 * Wykonuje jedną komendę `move` AI. Zwykłe obce miasto jest nadal blokowane;
 * wyjątek dotyczy wyłącznie komendy celującej w widoczne, sąsiednie, puste
 * i nieufortyfikowane miasto.
 */
export function executeAiCityMove(
  opts: ExecuteAiCityMoveOptions,
): ExecuteAiCityMoveResult {
  const { command, unit } = opts;
  const destinationCity = opts.cities.find(
    city => city.q === command.toQ
      && city.r === command.toR
      && city.ownerId !== unit.ownerId,
  );
  const canEnterEmptyCity = destinationCity !== undefined
    && (opts.canEngageOwner?.(destinationCity.ownerId) ?? true)
    && command.targetCityId === destinationCity.id
    && opts.targetVisible
    && canAiEnterEmptyEnemyCity(
      unit.ownerId,
      unit.q,
      unit.r,
      destinationCity,
      opts.cityBuiltIds,
      opts.hasCityDefenders,
      opts.unitIsCivilian,
    );

  if (!canEnterEmptyCity && !opts.canOccupyCityHex) {
    return { moved: false, captured: false, path: [] };
  }

  const blockedKeys = new Set(opts.blockedKeys);
  // Occupancy is resolved by the caller. A destination can contain both a
  // friendly stack and an enemy, so the command flag cannot safely clear it.
  if (canEnterEmptyCity) blockedKeys.delete(opts.destinationKey);
  let path: readonly AiCityMovePathHex[] = opts.computePath(
    unit,
    command.toQ,
    command.toR,
    blockedKeys,
  );
  if (path.length === 0) {
    return { moved: false, captured: false, path };
  }
  if (opts.truncatePath !== undefined) {
    const cut = opts.truncatePath(path);
    if (cut.length < path.length) {
      let end = cut.length;
      while (end > 0 && blockedKeys.has(keyOf(cut[end - 1]!.q, cut[end - 1]!.r))) end--;
      path = cut.slice(0, end);
      if (path.length === 0) {
        return { moved: false, captured: false, path };
      }
    }
  }

  const last = path[path.length - 1]!;
  if (!canEnterEmptyCity && !opts.canOccupyCityHex) {
    return { moved: false, captured: false, path: [] };
  }
  unit.q = last.q;
  unit.r = last.r;
  unit.ruchLeft = 0;
  opts.onMoved?.();

  const captured = canEnterEmptyCity
    && last.q === command.toQ
    && last.r === command.toR
    && opts.onCapture?.(destinationCity, unit) === true;
  return { moved: true, captured, path };
}
