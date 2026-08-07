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

// tools/.surowce-dostep-entry.ts
var surowce_dostep_entry_exports = {};
__export(surowce_dostep_entry_exports, {
  EMPIRE_ACCESS_RESOURCE_IDS: () => EMPIRE_ACCESS_RESOURCE_IDS,
  isEmpireAccessResource: () => isEmpireAccessResource,
  partitionEmpireResourceRows: () => partitionEmpireResourceRows
});
module.exports = __toCommonJS(surowce_dostep_entry_exports);

// src/game/empire-resource-access.ts
var EMPIRE_ACCESS_RESOURCE_IDS = /* @__PURE__ */ new Set([
  "ceramika",
  "sol",
  "kon",
  "zloto"
]);
function isEmpireAccessResource(id) {
  return EMPIRE_ACCESS_RESOURCE_IDS.has(id);
}
function partitionEmpireResourceRows(rows) {
  const stored = [];
  const access = [];
  for (const r of rows) {
    if (isEmpireAccessResource(r.id) || r.cap == null) {
      access.push(r);
    } else {
      stored.push(r);
    }
  }
  return { stored, access };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  EMPIRE_ACCESS_RESOURCE_IDS,
  isEmpireAccessResource,
  partitionEmpireResourceRows
});
