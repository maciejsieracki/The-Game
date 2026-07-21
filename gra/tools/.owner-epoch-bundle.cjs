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

// tools/.owner-epoch-entry.ts
var owner_epoch_entry_exports = {};
__export(owner_epoch_entry_exports, {
  computeOwnerEraFromResearch: () => computeOwnerEraFromResearch,
  grantTechEpokWczesniejszych: () => grantTechEpokWczesniejszych,
  isEraAdvanceTech: () => isEraAdvanceTech
});
module.exports = __toCommonJS(owner_epoch_entry_exports);

// src/game/civ-entry-epoch.ts
var GAME_EPOCH_ORDER = ["kamien", "braz", "zelazo"];
function gameEpochIndex(epochId) {
  const i = GAME_EPOCH_ORDER.indexOf(epochId);
  return i >= 0 ? i : GAME_EPOCH_ORDER.length;
}

// src/game/research.ts
function grantTechEpokWczesniejszych(techs, epochId) {
  const granted = /* @__PURE__ */ new Set();
  const priorLabels = [];
  if (epochId === "braz") priorLabels.push("Kamie\u0144");
  else if (epochId === "zelazo") priorLabels.push("Kamie\u0144", "Br\u0105z");
  if (priorLabels.length === 0) return granted;
  for (const row of techs) {
    const ep = row.Epoka ?? "";
    const id = row.Technologia;
    if (id && priorLabels.includes(ep)) granted.add(id);
  }
  return granted;
}

// src/game/playerState.ts
function eraAdvanceTarget(t) {
  const raw = t.awansDoEpoki;
  return typeof raw === "number" && Number.isFinite(raw) ? raw : null;
}
function isEraAdvanceTech(t) {
  return eraAdvanceTarget(t) !== null;
}

// src/game/wonder-civ-tech.ts
var EPOCH_LABEL_TO_ID = {
  Kamie\u0144: "kamien",
  "Kamien": "kamien",
  Br\u0105z: "braz",
  Braz: "braz",
  \u017Belazo: "zelazo",
  Zelazo: "zelazo"
};
function techEpochIdFromLabel(epokaLabel) {
  return EPOCH_LABEL_TO_ID[epokaLabel] ?? "kamien";
}

// src/game/owner-epoch.ts
function computeOwnerEraFromResearch(startEra, done, techRows) {
  const s = Math.max(1, Math.min(10, startEra));
  if (!done.size) return s;
  let era = s;
  for (const tname of done) {
    const t = techRows.find((row) => row.Technologia === tname);
    if (!t || !isEraAdvanceTech(t)) continue;
    const techEpIdx = gameEpochIndex(
      techEpochIdFromLabel(String(t.Epoka ?? "Kamie\u0144"))
    );
    if (techEpIdx + 2 <= s) continue;
    era = Math.min(10, era + 1);
  }
  return era;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  computeOwnerEraFromResearch,
  grantTechEpokWczesniejszych,
  isEraAdvanceTech
});
