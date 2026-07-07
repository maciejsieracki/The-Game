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

// tools/.tt-entry.ts
var tt_entry_exports = {};
__export(tt_entry_exports, {
  TEMPO_GRY: () => TEMPO_GRY,
  applyTempoKoszt: () => applyTempoKoszt
});
module.exports = __toCommonJS(tt_entry_exports);

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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TEMPO_GRY,
  applyTempoKoszt
});
