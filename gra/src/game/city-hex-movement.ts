/**
 * city-hex-movement.ts — reguły zajmowania heksu miasta (garnizon vs obcy).
 * PURE — bez DOM / main.ts.
 */

import type { City } from './cities';
import type { RuntimeUnit } from '../units/setup';
import { keyOf } from '../units/setup';
import { hasCityDefenders } from './siegeDefenders';

export type CityHexRef = Pick<City, 'q' | 'r' | 'ownerId'>;

export function cityAtHex(
  q: number,
  r: number,
  cities: readonly CityHexRef[],
): CityHexRef | undefined {
  return cities.find(c => c.q === q && c.r === r);
}

/**
 * Czy jednostka może zakończyć ruch na (q,r).
 * Heks miasta obcego właściciela = zablokowany (tylko zdobycie z sąsiedztwa).
 */
export function canUnitOccupyCityHex(
  unitOwnerId: number,
  q: number,
  r: number,
  cities: readonly CityHexRef[],
): boolean {
  const city = cityAtHex(q, r, cities);
  if (!city) return true;
  return city.ownerId === unitOwnerId;
}

/**
 * P-BITWA-ATAK-DYSTANSOWY-EGZEKUCJA-Q1=B (Maciej 2026-08-16, RUNDA 3): wąski wyjątek
 * egzekucji dla komend AI wyemitowanych WYŁĄCZNIE przez gałąź ataku dystansowego na
 * miasto (`ai.ts` `isWithinCityAttackRange` → `AICmdMove.rangedCityAttackEntry`) —
 * pozwala jednostce AI wejść na heks PUSTEGO (`!hasCityDefenders`, jak
 * `canCaptureCityWithoutBattle` w `siegeDefenders.ts`), NIEOBMUROWANEGO (`!city.maMur`
 * — miasto z murem idzie ZAWSZE przez oblężenie, `mapSiegeDetect.classifyCityAttack`,
 * nigdy tędy) obcego miasta. Analogiczne do `canBarbarianWalkIntoEmptyCity`
 * (`barbarians.ts`, `P-BARBARZYNCY-PUSTE-MIASTO-PRZEJECIE-Q1=B`), ale BEZ bramki
 * trudności (dotyczy tylko barbarzyńców) i BEZ realnego przejęcia miasta — ogólna
 * ścieżka zdobycia miasta przez AI (N2 werdyktu Evaluatora,
 * `P-BITWA-ATAK-DYSTANSOWY-BRAK-NA-MAPIE`) jest ŚWIADOMIE poza zakresem tej rundy;
 * jednostka jedynie wchodzi na heks (zamiast dostawać kasowany, martwy rozkaz), bez
 * zmiany właściciela miasta.
 * WOŁAJĄCY (main.ts) MUSI ograniczyć użycie do komend z `rangedCityAttackEntry===true`
 * — ta funkcja sama NIE odróżnia źródła komendy, żeby nie otworzyć ogólnego wyjątku
 * dla wszystkich rozkazów `move`.
 * / EN: a narrow execution exception for AI commands emitted EXCLUSIVELY by the
 * ranged city-attack branch (`ai.ts` `isWithinCityAttackRange` →
 * `AICmdMove.rangedCityAttackEntry`) — lets an AI unit step onto the hex of an EMPTY
 * (`!hasCityDefenders`, matching `canCaptureCityWithoutBattle` in `siegeDefenders.ts`),
 * UNWALLED (`!city.maMur` — a walled city always goes through sieging,
 * `mapSiegeDetect.classifyCityAttack`, never this path) foreign city. Analogous to
 * `canBarbarianWalkIntoEmptyCity` (`barbarians.ts`,
 * `P-BARBARZYNCY-PUSTE-MIASTO-PRZEJECIE-Q1=B`), but WITHOUT the difficulty gate
 * (barbarian-only) and WITHOUT an actual city capture — a general AI city-capture path
 * (Evaluator verdict N2, `P-BITWA-ATAK-DYSTANSOWY-BRAK-NA-MAPIE`) is DELIBERATELY out of
 * scope this round; the unit merely enters the hex (instead of the command being
 * silently dropped), without any change of city ownership.
 * CALLER (main.ts) MUST restrict use to commands with `rangedCityAttackEntry===true`
 * — this function itself does not distinguish the command's origin, so it cannot widen
 * into a general exception for all `move` commands.
 */
export function canAiEnterUndefendedCityHex(
  destCity: City | undefined,
  units: readonly RuntimeUnit[],
): boolean {
  return destCity !== undefined && !destCity.maMur && !hasCityDefenders(destCity, units);
}

/** Heksy miast, których właścicielem NIE jest dana frakcja — do blokady pathfindingu. */
export function foreignCityHexKeys(
  unitOwnerId: number,
  cities: readonly CityHexRef[],
): Set<string> {
  const s = new Set<string>();
  for (const c of cities) {
    if (c.ownerId !== unitOwnerId) s.add(keyOf(c.q, c.r));
  }
  return s;
}

export function addForeignCityBlocks(
  occupied: Set<string>,
  unitOwnerId: number,
  cities: readonly CityHexRef[],
): Set<string> {
  const out = new Set(occupied);
  for (const k of foreignCityHexKeys(unitOwnerId, cities)) out.add(k);
  return out;
}
