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

// tools/.river-fog-visibility-entry.ts
var river_fog_visibility_entry_exports = {};
__export(river_fog_visibility_entry_exports, {
  RIVER_FOG_SIG_OFF: () => RIVER_FOG_SIG_OFF,
  buildRiverRibbonFogIndex: () => buildRiverRibbonFogIndex,
  buildRiverRibbonFullIndex: () => buildRiverRibbonFullIndex,
  computeRiverFogSig: () => computeRiverFogSig,
  mergedRiverVisibleInFog: () => mergedRiverVisibleInFog,
  needsRiverRibbonIndexUpdate: () => needsRiverRibbonIndexUpdate
});
module.exports = __toCommonJS(river_fog_visibility_entry_exports);

// src/render/riverLod.ts
var RIVER_FOG_SIG_OFF = -1;
function computeRiverFogSig(pointHex, riverHidden) {
  let sig = 0;
  for (let k = 0; k < pointHex.length; k++) {
    sig = Math.imul(sig, 31) + (riverHidden(pointHex[k]) ? 1 : 0) | 0;
  }
  return sig;
}
function buildRiverRibbonFullIndex(pointCount) {
  const idx = [];
  for (let j = 0; j < pointCount - 1; j++) {
    const b = 2 * j;
    idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3);
  }
  return idx;
}
function buildRiverRibbonFogIndex(pointHex, riverHidden) {
  const idx = [];
  for (let j = 0; j < pointHex.length - 1; j++) {
    if (riverHidden(pointHex[j]) || riverHidden(pointHex[j + 1])) continue;
    const b = 2 * j;
    idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3);
  }
  return idx;
}
function needsRiverRibbonIndexUpdate(fogActive, lastFogSig, fogSig) {
  if (!fogActive) return lastFogSig !== RIVER_FOG_SIG_OFF;
  return lastFogSig !== fogSig;
}
function mergedRiverVisibleInFog(fogActive, riverRevealKeys, isHidden, hexKeys) {
  if (!fogActive) return true;
  const riverHidden = (k) => isHidden(k) && !riverRevealKeys?.has(k);
  if (riverRevealKeys) {
    for (const hk of hexKeys) {
      if (!riverHidden(hk)) return true;
    }
    return false;
  }
  for (const hk of hexKeys) {
    if (riverHidden(hk)) return false;
  }
  return true;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  RIVER_FOG_SIG_OFF,
  buildRiverRibbonFogIndex,
  buildRiverRibbonFullIndex,
  computeRiverFogSig,
  mergedRiverVisibleInFog,
  needsRiverRibbonIndexUpdate
});
