
export {
  advanceEmpireFood, freshEmpireFoodState, buildEmpireFoodParams,
  bindEmpireFoodRuntime, getEmpireFoodSplit, getEmpireFoodMaxCap, isArmyStarving,
  computeEmpireFoodNetDelta, computeEmpireFoodNetDeltaFromCityFoods, getCityFoodSplit,
  clearLastEmpireFoodTicks, computeEmpireFoodMaxCap,
} from '../src/game/empire-food';
export { advanceCityEconomy } from '../src/game/turn-economy';
export { applyArmyStarvationHpLoss } from '../src/game/army-starvation';
