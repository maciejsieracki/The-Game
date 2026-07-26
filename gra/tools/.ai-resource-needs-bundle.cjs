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

// tools/.ai-resource-needs-entry.ts
var ai_resource_needs_entry_exports = {};
__export(ai_resource_needs_entry_exports, {
  detectOwnerResourceNeeds: () => detectOwnerResourceNeeds,
  resourceKeysNeededForBuildingQueue: () => resourceKeysNeededForBuildingQueue
});
module.exports = __toCommonJS(ai_resource_needs_entry_exports);

// src/game/diplomacy-resource-trade-pick.ts
function detectPricedResourceDeficits(goods, pricedKeys, pakietWielkosc) {
  const deficits = [];
  for (const key of pricedKeys) {
    const entry = goods.find((g) => g.key === key);
    const stock = entry?.ilosc ?? 0;
    if (stock < pakietWielkosc) {
      deficits.push({ key, gap: pakietWielkosc - stock });
    }
  }
  deficits.sort((a, b) => b.gap - a.gap);
  return deficits.map((d) => d.key);
}

// src/game/building-stock-cost.ts
function buildingStockCost(building) {
  const raw = building?.koszt_surowce;
  const out = {};
  if (!raw) return out;
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "number" && Number.isFinite(v) && v > 0) out[k] = v;
  }
  return out;
}

// src/game/ai-resource-needs.ts
var FOOD_URGENT_THRESHOLD = 8;
function mergeDeficitKeys(stock, fromBuild) {
  const seen = /* @__PURE__ */ new Set();
  const out = [];
  for (const k of [...stock, ...fromBuild]) {
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(k);
  }
  return out;
}
function resourceKeysNeededForBuildingQueue(input) {
  const needed = /* @__PURE__ */ new Set();
  const stockByKey = new Map(input.goods.map((g) => [g.key, g.ilosc ?? 0]));
  for (const buildingId of input.queuedBuildingIds) {
    const cost = buildingStockCost(
      { koszt_surowce: input.lookupBuildingStockCost(buildingId) ?? void 0 }
    );
    for (const [key, amount] of Object.entries(cost)) {
      const have = stockByKey.get(key) ?? 0;
      if (have < amount) needed.add(key);
    }
  }
  return [...needed];
}
function detectOwnerResourceNeeds(input) {
  const pakiet = Math.max(1, input.pakietWielkosc);
  const stockDeficits = detectPricedResourceDeficits(
    input.goods,
    input.pricedKeys,
    pakiet
  );
  const buildDeficits = input.queuedBuildingIds?.length && input.lookupBuildingStockCost ? resourceKeysNeededForBuildingQueue({
    queuedBuildingIds: input.queuedBuildingIds,
    goods: input.goods,
    lookupBuildingStockCost: input.lookupBuildingStockCost
  }) : [];
  const deficitKeys = mergeDeficitKeys(stockDeficits, buildDeficits);
  const needsResource = {};
  for (const k of deficitKeys) needsResource[k] = true;
  const foodThreshold = input.foodUrgentThreshold ?? FOOD_URGENT_THRESHOLD;
  if (input.foodReserve != null && input.foodReserve < foodThreshold) {
    needsResource.zywnosc = true;
    if (!deficitKeys.includes("zywnosc")) deficitKeys.push("zywnosc");
  }
  const urgentKeys = [];
  for (const key of deficitKeys) {
    if (key === "zywnosc") {
      if (input.foodReserve != null && input.foodReserve < foodThreshold) {
        urgentKeys.push(key);
      }
      continue;
    }
    const entry = input.goods.find((g) => g.key === key);
    const stock = entry?.ilosc ?? 0;
    if (stock < pakiet * 0.25) urgentKeys.push(key);
  }
  return { needsResource, deficitKeys, urgentKeys };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  detectOwnerResourceNeeds,
  resourceKeysNeededForBuildingQueue
});
