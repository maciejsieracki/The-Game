/**
 * k08b-deps.ts (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K08B-Q1, runda 3): delegaty K08B do funkcji pinu `edb8fb56`, których
 * nie ma jeszcze w porcie w kształcie pinu (K08B-Z7). Plik RĘCZNY (nie generowany, poza bramką kopii).
 *
 * Każdy delegat idzie przez `dep` z `k06b-deps.ts`, czyli przez ten sam obiekt zależności co K06B (`setK06bDeps`).
 * Brak delegatu = wyjątek `K06B: brak delegatu <nazwa>` (cicha wartość domyślna jest zakazana).
 * Wiring kontrolera (`setK06bDeps` o te nazwy): NIE_ZROBIONE w rundzie 3. Reguły gry zostają po stronie wiringu
 * (P5.13: UI nie liczy reguł gry), więc żaden import z `game/`, `data/` ani `types/` tu nie występuje.
 */
import { dep } from './k06b-deps';

/** Typ wejścia sortowania siły jednostki (pin: `game/unit-power`); po stronie wiringu. */
export type UnitPowerInput = any;

/** Pin :6568 `sumOwnedBuildingsUpkeep(built, data, city)`. */
export const sumOwnedBuildingsUpkeep = (...args: any[]): any => dep('sumOwnedBuildingsUpkeep')(...args);

/** Pin `groupBuiltBuildingIds(built, data.buildings)` (grupy budynków wg `grupa`). */
export const groupBuiltBuildingIds = (...args: any[]): any => dep('groupBuiltBuildingIds')(...args);

/** Pin :6206 `appendRecruitMilitaryResourceStrip(mount, city, data, units)`. Port DTO K04B (`appendRecruitMilitaryResourceStripK04b`) ma inny kontrakt; wiring składa pin-owy kontrakt. */
export const appendRecruitMilitaryResourceStrip = (...args: any[]): any => dep('appendRecruitMilitaryResourceStrip')(...args);

/** Pin `purchasableUnits(city, data, techs, ctx)` (game/production). */
export const purchasableUnits = (...args: any[]): any => dep('purchasableUnits')(...args);

/** Pin `sortByUnitPowerDescending(units, key)` (game/unit-power). */
export const sortByUnitPowerDescending = (units: any, key: (u: any) => UnitPowerInput): any =>
  dep('sortByUnitPowerDescending')(units, key);

/** Pin `getUnitDef(data, id)` (data/loader). */
export const getUnitDef = (...args: any[]): any => dep('getUnitDef')(...args);
