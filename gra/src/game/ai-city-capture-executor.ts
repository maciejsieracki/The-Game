/**
 * Egzekutor zwykłego ruchu AI z wąską ścieżką przejęcia pustego miasta.
 * PURE względem DOM; mutuje wyłącznie przekazaną jednostkę i wywołuje callbacki
 * efektów silnika po zaakceptowaniu prawdziwej komendy.
 */

import { canAiEnterEmptyEnemyCity } from './city-hex-movement';

export interface AiCityMoveCommand {
  unitId: string;
  toQ: number;
  toR: number;
  targetCityId?: string;
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
  blockedKeys: Set<string>;
  destinationKey: string;
  computePath: (
    unit: AiCityMoveUnit,
    toQ: number,
    toR: number,
    blockedKeys: Set<string>,
  ) => readonly AiCityMovePathHex[];
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
  if (canEnterEmptyCity) blockedKeys.delete(opts.destinationKey);
  const path = opts.computePath(unit, command.toQ, command.toR, blockedKeys);
  if (path.length === 0) {
    return { moved: false, captured: false, path };
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
