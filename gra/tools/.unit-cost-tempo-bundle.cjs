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

// tools/.unit-cost-tempo-entry.ts
var unit_cost_tempo_entry_exports = {};
__export(unit_cost_tempo_entry_exports, {
  KOSZT_JEDNOSTEK_PACE: () => KOSZT_JEDNOSTEK_PACE,
  applyUnitCostPace: () => applyUnitCostPace
});
module.exports = __toCommonJS(unit_cost_tempo_entry_exports);

// src/game/unit-cost-tempo.ts
var KOSZT_JEDNOSTEK_PACE = {
  niski: 1,
  normalny: 2,
  wysoki: 4
};
function applyUnitCostPace(bazowyKoszt, pace) {
  const mnoznik = typeof pace === "number" ? pace : KOSZT_JEDNOSTEK_PACE[pace];
  return Math.max(1, Math.round(bazowyKoszt * mnoznik));
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  KOSZT_JEDNOSTEK_PACE,
  applyUnitCostPace
});
