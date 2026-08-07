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

// tools/.r-stawki-fala2-entry.ts
var r_stawki_fala2_entry_exports = {};
__export(r_stawki_fala2_entry_exports, {
  buildingStockCost: () => buildingStockCost,
  isResearchEraFala2Extra: () => isResearchEraFala2Extra,
  normalizeResearchEra: () => normalizeResearchEra,
  scaleImprovementWorkCost: () => scaleImprovementWorkCost,
  scaleStockCostRecord: () => scaleStockCostRecord,
  scaledResearchCost: () => scaledResearchCost,
  scaledWonderFoodCost: () => scaledWonderFoodCost,
  scaledWonderWorkCost: () => scaledWonderWorkCost
});
module.exports = __toCommonJS(r_stawki_fala2_entry_exports);

// src/game/r-stawki-strojenie.ts
var R_STAWKI_KOSZT_MULT = 2;
var R_STAWKI_FALA2_MULT = 2;
var R_STAWKI_FALA1_FALA2_MULT = R_STAWKI_KOSZT_MULT * R_STAWKI_FALA2_MULT;
function stripDiacriticsLower(s) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}
function normalizeResearchEra(epoka) {
  if (!epoka) return "kamien";
  const n = stripDiacriticsLower(epoka);
  if (n === "braz" || n === "br\u0105z") return "braz";
  if (n === "zelazo" || n === "\u017Celazo") return "zelazo";
  if (n === "kamien" || n === "kamie\u0144") return "kamien";
  return n;
}
function isResearchEraFala2Extra(epoka) {
  const era = normalizeResearchEra(epoka);
  return era === "braz" || era === "zelazo";
}
function scaleStockCostRecord(raw) {
  const out = {};
  if (!raw) return out;
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "number" && Number.isFinite(v) && v > 0) {
      out[k] = Math.max(1, Math.round(v * R_STAWKI_FALA2_MULT));
    }
  }
  return out;
}
function scaleImprovementWorkCost(base) {
  if (!Number.isFinite(base) || base <= 0) return 0;
  return Math.max(1, Math.round(base * R_STAWKI_FALA2_MULT));
}
function scaledWonderWorkCost(kosztBudowy) {
  if (!Number.isFinite(kosztBudowy) || kosztBudowy <= 0) return 0;
  return Math.max(1, Math.round(kosztBudowy * R_STAWKI_FALA2_MULT));
}
function scaledWonderFoodCost(kosztBudowy) {
  return scaledWonderWorkCost(kosztBudowy);
}

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

// src/game/difficulty-cost.ts
var GLOBAL_RESEARCH_COST_MULT = R_STAWKI_KOSZT_MULT;
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
function scaledResearchCost(baseCost, tempo, ownerId, difficulty, epoka) {
  const afterTempo = applyTempoKoszt(baseCost, tempo);
  let afterGlobal = Math.max(1, Math.round(afterTempo * GLOBAL_RESEARCH_COST_MULT));
  if (isResearchEraFala2Extra(epoka)) {
    afterGlobal = Math.max(1, Math.round(afterGlobal * R_STAWKI_FALA2_MULT));
  }
  return applyDifficultyCostMultiplier(afterGlobal, ownerId, difficulty);
}

// src/game/building-stock-cost.ts
function buildingStockCost(building) {
  return scaleStockCostRecord(building?.koszt_surowce);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  buildingStockCost,
  isResearchEraFala2Extra,
  normalizeResearchEra,
  scaleImprovementWorkCost,
  scaleStockCostRecord,
  scaledResearchCost,
  scaledWonderFoodCost,
  scaledWonderWorkCost
});
