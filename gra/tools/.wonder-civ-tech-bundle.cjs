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

// tools/.wonder-civ-tech-entry.ts
var wonder_civ_tech_entry_exports = {};
__export(wonder_civ_tech_entry_exports, {
  buildTechEpochMap: () => buildTechEpochMap,
  findExclusiveWonderTechViolations: () => findExclusiveWonderTechViolations,
  getCivEpokaWejscia: () => getCivEpokaWejscia,
  wonderTechValidForCivEntry: () => wonderTechValidForCivEntry
});
module.exports = __toCommonJS(wonder_civ_tech_entry_exports);

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
function buildTechEpochMap(technologie) {
  const out = /* @__PURE__ */ new Map();
  for (const t of technologie) {
    const name = t.Technologia;
    const ep = t.Epoka;
    if (typeof name === "string" && name.length > 0 && typeof ep === "string") {
      out.set(name, techEpochIdFromLabel(ep));
    }
  }
  return out;
}
function techEpochIndex(techName, techMap) {
  const epochId = techMap.get(techName);
  return epochId != null ? gameEpochIndex(epochId) : -1;
}
function wonderTechValidForCivEntry(civ, techUnlock, techMap) {
  if (techUnlock.length === 0) return true;
  const minIdx = gameEpochIndex(getCivEpokaWejscia(civ));
  return techUnlock.every((tech) => {
    const tIdx = techEpochIndex(tech, techMap);
    return tIdx >= 0 && tIdx >= minIdx;
  });
}
function findExclusiveWonderTechViolations(cuda, cywilizacje, techMap) {
  const civById = new Map(
    cywilizacje.filter((c) => c.ikonaId).map((c) => [c.ikonaId, c])
  );
  const out = [];
  for (const w of cuda) {
    if (w.dostep !== "E" || !w.id) continue;
    const techs = w.techUnlock ?? [];
    for (const civId of w.cywilizacje ?? []) {
      const civ = civById.get(civId);
      if (!civ) continue;
      const entry = getCivEpokaWejscia(civ);
      const minIdx = gameEpochIndex(entry);
      for (const tech of techs) {
        const tEpoch = techMap.get(tech);
        const tIdx = tEpoch != null ? gameEpochIndex(tEpoch) : -1;
        if (tIdx < minIdx) {
          out.push({
            wonderId: w.id,
            civId,
            civEntryEpoch: entry,
            invalidTech: tech,
            techEpoch: tEpoch ?? "?"
          });
        }
      }
    }
  }
  return out;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  buildTechEpochMap,
  findExclusiveWonderTechViolations,
  getCivEpokaWejscia,
  wonderTechValidForCivEntry
});
