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

// tools/.gate-entry.ts
var gate_entry_exports = {};
__export(gate_entry_exports, {
  buildingRequiredActiveLabels: () => buildingRequiredActiveLabels
});
module.exports = __toCommonJS(gate_entry_exports);

// src/game/building-resource-gate.ts
var LABEL_BY_ASCII = {
  drewno: "Drewno",
  kamien: "Kamie\u0144",
  glina: "Glina",
  ruda: "Ruda",
  zelazo: "\u017Belazo",
  stal: "Stal",
  braz: "Br\u0105z",
  sol: "S\xF3l",
  cegla: "Ceg\u0142a",
  ceramika: "Ceramika"
};
var ERA_ACCESS_LABELS = {
  1: ["Drewno"],
  2: ["Drewno", "Kamie\u0144"],
  3: ["Drewno", "Kamie\u0144", "Ceg\u0142a"],
  4: ["Drewno", "Kamie\u0144", "Ceg\u0142a"]
};
var DEPOSIT_LINKED_BUILDING_LABELS = {
  garncarnia: ["Glina"],
  cegielnia: ["Glina"],
  spichlerz: ["Ceramika"],
  spichlerz_ii: ["S\xF3l"]
};
function eraAccessLabels(epokaWejscia) {
  if (epokaWejscia >= 4) return ERA_ACCESS_LABELS[4] ?? [];
  return ERA_ACCESS_LABELS[epokaWejscia] ?? [];
}
function buildingRequiredActiveLabels(building) {
  const out = /* @__PURE__ */ new Set();
  const hard = DEPOSIT_LINKED_BUILDING_LABELS[building.id];
  if (hard) hard.forEach((l) => out.add(l));
  const key = building.wymaganySurowiec?.trim().toLowerCase();
  if (key && LABEL_BY_ASCII[key]) out.add(LABEL_BY_ASCII[key]);
  for (const l of eraAccessLabels(building.epokaWejscia ?? 1)) out.add(l);
  return [...out];
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  buildingRequiredActiveLabels
});
