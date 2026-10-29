/**
 * K04 batch 2 (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K04-Q1, runda 3): poziomy i utrzymanie budynków z DTO.
 *
 * Pin `gra/src/ui/cityPanel.ts` (edb8fb56): `buildingUiDisplayLevel` (:6478), `buildingOwnedLevel` (:6556),
 * `sumOwnedBuildingsUpkeep` (:6568), `ownerHasSpichlerz` (:1304).
 *
 * Reguła P5.13: UI nie liczy poziomu epoki ani utrzymania. Pin liczył `buildingLevelForEpoch(...)` i
 * `buildingUpkeep(def, level)` z `cfg.getEpoch`/`cfg.getUnlockedTechs`; tutaj poziom i utrzymanie są polami DTO
 * (`CityPanelInputsDto.ownedLevels`, `CityPanelInputsDto.upkeepById`) liczonymi przez silnik (ZAŁOŻENIE K04-Z3).
 * Lista miast właściciela (pin `cfg.getCities` + `cfg.getBuiltBuildingIds`) przychodzi jako argument (ZAŁOŻENIE K04-Z4).
 */
import type { PlayerId } from '../../viewmodel/types';

/** Poziomy budynków po id definicji (DTO). Brak wpisu = poziom 1 (ZAŁOŻENIE K04-Z3). */
export type OwnedLevelMap = Readonly<Record<string, number>>;

/** Utrzymanie po id definicji na poziomie właściciela (DTO); brak wpisu = pomijane (jak brak `def` w pinie). */
export type UpkeepMap = Readonly<Record<string, number>>;

/** Miasto właściciela z listą zbudowanych budynków (DTO, ZAŁOŻENIE K04-Z4). */
export interface OwnedCityBuildings {
  ownerId: PlayerId;
  builtIds: readonly string[];
}

/** Pin :6556-6566 `buildingOwnedLevel` — poziom budynku w mieście (z DTO). */
export function buildingOwnedLevelFromDto(defId: string, levels: OwnedLevelMap): number {
  return levels[defId] ?? 1;
}

/**
 * Pin :6478-6481 `buildingUiDisplayLevel`. Pin: `!city` → 1; w przeciwnym razie poziom miasta.
 * Port: `levels === undefined` ⇔ brak kontekstu miasta (pin `city` undefined).
 */
export function buildingUiDisplayLevelFromDto(defId: string, levels: OwnedLevelMap | undefined): number {
  if (levels === undefined) return 1;
  return buildingOwnedLevelFromDto(defId, levels);
}

/**
 * Pin :6568-6576 `sumOwnedBuildingsUpkeep`. Pin: sumuje `buildingUpkeep(def, level)` po zbudowanych id,
 * pomijając id bez definicji. Port: sumuje `upkeepById` po zbudowanych id; brak wpisu = pominięte.
 */
export function sumOwnedBuildingsUpkeepFromDto(built: readonly string[], upkeepById: UpkeepMap): number {
  let sum = 0;
  for (const id of built) {
    const u = upkeepById[id];
    if (u === undefined) continue;
    sum += u;
  }
  return sum;
}

/**
 * Pin :1304-1311 `ownerHasSpichlerz`. Pin: czy którekolwiek miasto właściciela ma `spichlerz` w zbudowanych.
 * Port: ten sam warunek po liście miast z DTO.
 */
export function ownerHasSpichlerzFromCities(ownerId: PlayerId, cities: readonly OwnedCityBuildings[]): boolean {
  for (const c of cities) {
    if (c.ownerId !== ownerId) continue;
    if (c.builtIds.includes('spichlerz')) return true;
  }
  return false;
}
