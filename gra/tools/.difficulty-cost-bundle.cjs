"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// tools/.difficulty-cost-entry.ts
var difficulty_cost_entry_exports = {};
__export(difficulty_cost_entry_exports, {
  applyBuildingCostPace: () => applyBuildingCostPace,
  applyDifficultyCostMultiplier: () => applyDifficultyCostMultiplier,
  applyGrowthThresholdPace: () => applyGrowthThresholdPace,
  applyPopulationGrowthThreshold: () => applyPopulationGrowthThreshold,
  getCostMultiplierForOwner: () => getCostMultiplierForOwner,
  getPopulationGrowthDifficultyMultiplier: () => getPopulationGrowthDifficultyMultiplier,
  getPopulationGrowthThresholdMultiplier: () => getPopulationGrowthThresholdMultiplier,
  scaledResearchCost: () => scaledResearchCost
});
module.exports = __toCommonJS(difficulty_cost_entry_exports);

// src/game/tech-tempo.ts
var TEMPO_GRY = {
  szybka: 1,
  standardowa: 2,
  dluga: 4
};
function applyTempoKoszt(bazowyKoszt, tempo) {
  const mnoznik = typeof tempo === "number" ? tempo : TEMPO_GRY[tempo];
  return Math.max(1, Math.round(bazowyKoszt * mnoznik));
}

// src/game/population-growth-tempo.ts
var WZROST_LUDNOSCI_PACE = {
  wysoki: 1,
  normalny: 2,
  wolny: 4
};
function applyGrowthThresholdPace(bazowyProg, pace) {
  const mnoznik = typeof pace === "number" ? pace : WZROST_LUDNOSCI_PACE[pace];
  return Math.max(1, Math.round(bazowyProg * mnoznik));
}

// src/game/difficulty-cost.ts
var GLOBAL_RESEARCH_COST_MULT = 1;
function isPlayerOwner(ownerId) {
  return ownerId === 0;
}
function getCostMultiplierForOwner(ownerId, difficulty) {
  if (difficulty === "normal") return 1;
  if (difficulty === "easy") return isPlayerOwner(ownerId) ? 1 : 2;
  return isPlayerOwner(ownerId) ? 2 : 1;
}
function applyDifficultyCostMultiplier(costAfterPace, ownerId, difficulty) {
  const mult = getCostMultiplierForOwner(ownerId, difficulty);
  return Math.max(1, Math.round(costAfterPace * mult));
}
function scaledResearchCost(baseCost, tempo, ownerId, difficulty) {
  const afterTempo = applyTempoKoszt(baseCost, tempo);
  const afterGlobal = Math.max(1, Math.round(afterTempo * GLOBAL_RESEARCH_COST_MULT));
  return applyDifficultyCostMultiplier(afterGlobal, ownerId, difficulty);
}
function getPopulationGrowthDifficultyMultiplier(ownerId, difficulty) {
  if (difficulty === "normal") return 1;
  if (difficulty === "easy") return isPlayerOwner(ownerId) ? 1 : 2;
  return isPlayerOwner(ownerId) ? 2 : 0.5;
}
function getPopulationGrowthThresholdMultiplier(ownerId, pace, difficulty) {
  const paceMult = typeof pace === "number" ? pace : WZROST_LUDNOSCI_PACE[pace];
  return paceMult * getPopulationGrowthDifficultyMultiplier(ownerId, difficulty);
}
function applyPopulationGrowthThreshold(baseThreshold, ownerId, pace, difficulty) {
  const mult = getPopulationGrowthThresholdMultiplier(ownerId, pace, difficulty);
  return Math.max(1, Math.round(baseThreshold * mult));
}

// src/game/building-cost-tempo.ts
var KOSZT_BUDYNKOW_PACE = {
  niski: 1,
  normalny: 2,
  wysoki: 4
};
function applyBuildingCostPace(bazowyKoszt, pace) {
  const mnoznik = typeof pace === "number" ? pace : KOSZT_BUDYNKOW_PACE[pace];
  return Math.max(1, Math.round(bazowyKoszt * mnoznik));
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  applyBuildingCostPace,
  applyDifficultyCostMultiplier,
  applyGrowthThresholdPace,
  applyPopulationGrowthThreshold,
  getCostMultiplierForOwner,
  getPopulationGrowthDifficultyMultiplier,
  getPopulationGrowthThresholdMultiplier,
  scaledResearchCost
});
