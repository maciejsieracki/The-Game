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

// tools/.building-queue-refund-entry.ts
var building_queue_refund_entry_exports = {};
__export(building_queue_refund_entry_exports, {
  buildingStockCost: () => buildingStockCost,
  deductBuildingStockCostAcrossCities: () => deductBuildingStockCostAcrossCities,
  ownerResourceStock: () => ownerResourceStock,
  refundBuildingStockCostAcrossCities: () => refundBuildingStockCostAcrossCities
});
module.exports = __toCommonJS(building_queue_refund_entry_exports);

// src/game/r-stawki-strojenie.ts
var R_STAWKI_KOSZT_MULT = 2;
var R_STAWKI_FALA2_MULT = 2;
var R_STAWKI_FALA1_FALA2_MULT = R_STAWKI_KOSZT_MULT * R_STAWKI_FALA2_MULT;
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

// src/game/building-stock-cost.ts
function buildingStockCost(building) {
  return scaleStockCostRecord(building?.koszt_surowce);
}
function ownerResourceStock(cities, ownerId, key) {
  let total = 0;
  for (const c of cities) {
    if (c.ownerId !== ownerId) continue;
    total += c.surowce?.[key] ?? 0;
  }
  return total;
}
function refundBuildingStockCostAcrossCities(cities, ownerId, cost) {
  for (const [key, amount] of Object.entries(cost)) {
    if (typeof amount === "number" && Number.isFinite(amount) && amount > 0) {
      creditOwnerResourceStock(cities, ownerId, key, amount);
    }
  }
}
function deductBuildingStockCostAcrossCities(cities, ownerId, cost) {
  const ownerCities = cities.filter((c) => c.ownerId === ownerId);
  for (const [key, needRaw] of Object.entries(cost)) {
    let need = needRaw;
    if (!(need > 0)) continue;
    const holders = ownerCities.filter((c) => (c.surowce?.[key] ?? 0) > 0).sort((a, b) => {
      const diff = (b.surowce?.[key] ?? 0) - (a.surowce?.[key] ?? 0);
      if (diff !== 0) return diff;
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    });
    for (const c of holders) {
      if (need <= 0) break;
      const have = c.surowce?.[key] ?? 0;
      const take = Math.min(have, need);
      if (!c.surowce) c.surowce = {};
      c.surowce[key] = have - take;
      need -= take;
    }
  }
}
function creditOwnerResourceStock(cities, ownerId, key, amount, capPerType) {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  const ownerCities = cities.filter((c) => c.ownerId === ownerId);
  if (ownerCities.length === 0) return 0;
  let toAdd = amount;
  if (typeof capPerType === "number" && Number.isFinite(capPerType)) {
    const current = ownerResourceStock(cities, ownerId, key);
    toAdd = Math.max(0, Math.min(toAdd, capPerType - current));
  }
  if (toAdd <= 0) return 0;
  const target = [...ownerCities].sort((a, b) => {
    const diff = (a.surowce?.[key] ?? 0) - (b.surowce?.[key] ?? 0);
    if (diff !== 0) return diff;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  })[0];
  if (!target.surowce) target.surowce = {};
  target.surowce[key] = (target.surowce[key] ?? 0) + toAdd;
  return toAdd;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  buildingStockCost,
  deductBuildingStockCostAcrossCities,
  ownerResourceStock,
  refundBuildingStockCostAcrossCities
});
