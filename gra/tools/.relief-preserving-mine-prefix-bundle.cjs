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

// tools/.relief-preserving-mine-prefix-entry.ts
var relief_preserving_mine_prefix_entry_exports = {};
__export(relief_preserving_mine_prefix_entry_exports, {
  preservesHillRelief: () => preservesHillRelief,
  preservesHillReliefKey: () => preservesHillReliefKey
});
module.exports = __toCommonJS(relief_preserving_mine_prefix_entry_exports);

// src/game/relief-preserving-improvements.ts
var PRESERVES_HILL_RELIEF_EXPLICIT_KEYS = /* @__PURE__ */ new Set(["bydlo", "owce", "lama", "kamieniolom"]);
var KOPALNIA_PREFIX = "kopalnia_";
var KOPALNIA_LEGACY_KEY = "kopalnia";
function preservesHillReliefKey(key) {
  if (PRESERVES_HILL_RELIEF_EXPLICIT_KEYS.has(key)) return true;
  return key === KOPALNIA_LEGACY_KEY || key.startsWith(KOPALNIA_PREFIX);
}
function preservesHillRelief(layers) {
  return layers.length > 0 && layers.every(preservesHillReliefKey);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  preservesHillRelief,
  preservesHillReliefKey
});
