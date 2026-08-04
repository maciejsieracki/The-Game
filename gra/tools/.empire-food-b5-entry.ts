
export {
  advanceEmpireFood, freshEmpireFoodState, buildEmpireFoodParams,
  bindEmpireFoodRuntime, getEmpireFoodMaxCap, isArmyStarving, isArmyHungry,
  clearLastEmpireFoodTicks,
  autoBalanceRationsToSolvency, isEmpireCityFoodSolvent, simulateCityFoodCentralPool,
} from '../src/game/empire-food';
export { advanceCityEconomy, recomputeCityFoodBalancesInEcon } from '../src/game/turn-economy';
export { applyArmyStarvationHpLoss } from '../src/game/army-starvation';
