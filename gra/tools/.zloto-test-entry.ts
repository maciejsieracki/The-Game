
export { generateMap, DEFAULT_WIDTH, DEFAULT_HEIGHT } from '../src/map/generator';
export { DEPOSIT_RULES, FAIR_PLAY_DEPOSIT_IDS } from '../src/map/gen-helpers';
export { empireHasKopalniaZlota, KOPALNIA_ZLOTA_KEY } from '../src/game/zloto-access';
export { getCityResourceAccessForCity, getResourceAccessForCity } from '../src/game/resource-access';
export {
  buildImprovementQualifier, depositAllowsPlayerImprovement, galleryTerrainEligible,
} from '../src/map/improvement-build';
export { buildableProduction, eraBuildingCatalog } from '../src/game/production';
export { CITY_BUILDING_PREREQ } from '../src/game/building-resource-gate';
export { TerenBazowy, Nakladka } from '../src/types/hex';
