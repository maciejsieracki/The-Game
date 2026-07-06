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

// tools/.civ-entry-epoch-entry.ts
var civ_entry_epoch_entry_exports = {};
__export(civ_entry_epoch_entry_exports, {
  civIdsAvailableAtGameEpoch: () => civIdsAvailableAtGameEpoch,
  getCivEpokaWejscia: () => getCivEpokaWejscia,
  isCivAvailableAtGameEpoch: () => isCivAvailableAtGameEpoch
});
module.exports = __toCommonJS(civ_entry_epoch_entry_exports);

// src/game/civ-entry-epoch.ts
var GAME_EPOCH_ORDER = ["kamien", "braz", "zelazo"];
function gameEpochIndex(epochId) {
  const i = GAME_EPOCH_ORDER.indexOf(epochId);
  return i >= 0 ? i : GAME_EPOCH_ORDER.length;
}
function getCivEpokaWejscia(civ) {
  const direct = civ.epokaWejscia;
  if (direct && GAME_EPOCH_ORDER.includes(direct)) {
    return direct;
  }
  const legacy = civ.epokiStartowe;
  if (legacy && legacy.length > 0) {
    const indices = legacy.map((e) => gameEpochIndex(e)).filter((i) => i < GAME_EPOCH_ORDER.length);
    if (indices.length > 0) {
      const min = Math.min(...indices);
      return GAME_EPOCH_ORDER[min];
    }
  }
  return "kamien";
}
function isCivAvailableAtGameEpoch(civ, gameEpochId) {
  const entryIdx = gameEpochIndex(getCivEpokaWejscia(civ));
  const gameIdx = gameEpochIndex(gameEpochId);
  return entryIdx <= gameIdx;
}
function civIdsAvailableAtGameEpoch(cywilizacje, gameEpochId) {
  return cywilizacje.filter((c) => c.ikonaId && isCivAvailableAtGameEpoch(c, gameEpochId)).map((c) => c.ikonaId);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  civIdsAvailableAtGameEpoch,
  getCivEpokaWejscia,
  isCivAvailableAtGameEpoch
});
