/**
 * controller/entityCardRules.ts — wartości karty budynku liczone przez silnik (P5.4, P5-0 §6.11
 * `EntityCardDto::Building`: „zapytanie `entity_card(kind, id)` (zależy od trudności/tempa sesji)”).
 *
 * Web liczył je w adapterze karty (`gra/src/ui/entityCards/buildingAdapter.ts:137,152,257-259,267,
 * 278-280,296-297` na pinie `edb8fb56`) funkcjami `game/**` (`buildingEffectAtLevel`, `itemCost`,
 * `buildingWorkCost`, `buildingStockCost`, `stockResourceLabel`, `buildingUpkeep`,
 * `buildingResourceUpkeep`, `mnoznikRoleForBuildingId`, `cumulativeMnoznikForBuildingId`,
 * `buildingStructuralDefenseBonusLine`). W frontend-v2 adapter czyta gotowe pola z dostawcy
 * (wzorzec `unitThumbnails.ts`). Wywołanie jest synchroniczne (karta budowana przy hoverze) —
 * ZAŁOŻENIE P5.4-Z5: kontroler trzyma odpowiedzi Rust w pamięci podręcznej per (id, stan); komenda
 * Rust: NIE_ZMIERZONO.
 *
 * Atrapa MOCK (domyślny dostawca) zwraca STAŁE zera/puste mapy — niczego nie liczy (P5.13).
 */
import type { BuildingCardRulesDto, BuildingCardStateDto } from '../viewmodel/types';

export type BuildingCardRulesProvider = (buildingId: string, state: BuildingCardStateDto) => BuildingCardRulesDto;

/** Fikstura MOCK (stała, nie wyliczona). */
export const MOCK_BUILDING_CARD_RULES: BuildingCardRulesDto = {
  yieldAtDisplayLevel: {},
  yieldScale: {},
  mnoznikRole: null,
  cumulativeMnoznik: 0,
  structuralDefenseLine: null,
  workCost: 0,
  stockCost: {},
  upkeepGold: 0,
  upkeepResources: {},
  resourceLabels: {},
};

let provider: BuildingCardRulesProvider = () => MOCK_BUILDING_CARD_RULES;

export function installBuildingCardRulesProvider(p: BuildingCardRulesProvider): void {
  provider = p;
}

export function buildingCardRules(buildingId: string, state: BuildingCardStateDto): BuildingCardRulesDto {
  return provider(buildingId, state);
}
