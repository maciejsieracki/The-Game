
import { generateMap, DEFAULT_WIDTH, DEFAULT_HEIGHT } from '../src/map/generator';
import { computeStartPlacements, placeStartingUnits, computeReachable, computePath, keyOf, hexDistance } from '../src/units/setup';
import { computeVisible, DEFAULT_SIGHT, computePlayerVisibility, buildUnitSightResolver, computeVisibleAt, unitsVisibleOnMap } from '../src/game/visibility';
import { canFoundCity, foundCity, foundCityAt, cityName } from '../src/game/cities';
import { loadGameData } from '../src/data/loader';
import { advanceCityEconomy, buildEconParams, workedTilesForCity } from '../src/game/turn-economy';
import {
  createPlayerState, researchStep, cheapestAvailable, availableTechs,
  parsePrereqs, prereqsMet, techCost, isEraAdvanceTech, isMoneyTech, PIENIADZ_MNOZNIK,
  setPlayerResearchTarget, getResearchState,
} from '../src/game/playerState';
import { scaledResearchCost } from '../src/game/difficulty-cost';
import {
  placeDeposits, computeStartPositions, DEPOSIT_RULES, isLandTerrain, hexDistanceAxial,
} from '../src/map/gen-helpers';
import {
  cityDefenseBonus, resolveSiegeAttack, canCaptureCity, captureCity, canEnemyCapture,
  applyCityBonus, terrainDefenseMult, makeMilitia, effectiveGarrison,
  wallParamsFromBuildings, hitChance as siegeHitChance, baseDamage as siegeBaseDamage,
  WALL_BASE_OBRONA, WALL_PER_LEVEL_OBRONA, HILL_DEFENSE_MULT, MILITIA_POP_FRACTION,
} from '../src/game/siege';
import {
  computeOrder, orderTier, orderEffects, loadOrderParams, evaluateOrder,
  orderEffectsToYieldMults, pickRevoltMigrationTarget,
  FALLBACK_ORDER_PARAMS,
} from '../src/game/order';
import { isInTerritory } from '../src/map/territory';
import { cityRangeForPopulation, citySightRadius } from '../src/game/okolica';
import {
  loadCultureParams, FALLBACK_CULTURE_PARAMS, cultureThresholds,
  cityBorderRadius, accumulateCulture, cultureHappiness, convertCulture,
  loadReligionParams, FALLBACK_RELIGION_PARAMS, civReligion, isKnownCiv,
  dominantReligion, religionHappiness, spreadReligion, convertViaTemple, makeRng,
} from '../src/game/culture-religion';
import societyParamsRaw from '../data/society-params.json';
import civsRaw from '../data/civs.json';

export {
  generateMap, DEFAULT_WIDTH, DEFAULT_HEIGHT,
  computeStartPlacements, placeStartingUnits, computeReachable, computePath, keyOf, hexDistance,
  computeVisible, DEFAULT_SIGHT, computePlayerVisibility, buildUnitSightResolver, computeVisibleAt, unitsVisibleOnMap,
  canFoundCity, foundCity, foundCityAt, cityName,
  loadGameData,
  advanceCityEconomy, buildEconParams, workedTilesForCity,
  createPlayerState, researchStep, cheapestAvailable, availableTechs,
  parsePrereqs, prereqsMet, techCost, isEraAdvanceTech, isMoneyTech, PIENIADZ_MNOZNIK,
  setPlayerResearchTarget, getResearchState, scaledResearchCost,
  placeDeposits, computeStartPositions, DEPOSIT_RULES, isLandTerrain, hexDistanceAxial,
  cityDefenseBonus, resolveSiegeAttack, canCaptureCity, captureCity, canEnemyCapture,
  applyCityBonus, terrainDefenseMult, makeMilitia, effectiveGarrison,
  wallParamsFromBuildings, siegeHitChance, siegeBaseDamage,
  WALL_BASE_OBRONA, WALL_PER_LEVEL_OBRONA, HILL_DEFENSE_MULT, MILITIA_POP_FRACTION,
  computeOrder, orderTier, orderEffects, loadOrderParams, evaluateOrder,
  orderEffectsToYieldMults, pickRevoltMigrationTarget,
  FALLBACK_ORDER_PARAMS, societyParamsRaw,
  isInTerritory, cityRangeForPopulation, citySightRadius,
  loadCultureParams, FALLBACK_CULTURE_PARAMS, cultureThresholds,
  cityBorderRadius, accumulateCulture, cultureHappiness, convertCulture,
  loadReligionParams, FALLBACK_RELIGION_PARAMS, civReligion, isKnownCiv,
  dominantReligion, religionHappiness, spreadReligion, convertViaTemple, makeRng,
  civsRaw,
};
