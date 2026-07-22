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

// tools/.civ-roster-entry.ts
var civ_roster_entry_exports = {};
__export(civ_roster_entry_exports, {
  assignAiCivTypes: () => assignAiCivTypes,
  civIdsAvailableAtGameEpoch: () => civIdsAvailableAtGameEpoch,
  civIdsFromRoster: () => civIdsFromRoster,
  pickActiveCivPool: () => pickActiveCivPool
});
module.exports = __toCommonJS(civ_roster_entry_exports);

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

// src/game/civ-roster.ts
function makeRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = s + 1831565813 >>> 0;
    let t = s;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function civIdsFromRoster(cywilizacje) {
  return cywilizacje.map((c) => c.ikonaId ?? "").filter((id) => id !== "");
}
function pickActiveCivPool(allCivIds, playerCivId, aktywneTypy, numAi, seed) {
  const pool = [...new Set(allCivIds.filter(Boolean))];
  if (pool.length === 0) return playerCivId ? [playerCivId] : [];
  const typesNeeded = Math.max(1, Math.min(aktywneTypy, 1 + numAi));
  const others = pool.filter((id) => id !== playerCivId);
  const rng = makeRng(seed >>> 0);
  const shuffled = [...others];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const a = shuffled[i];
    const b = shuffled[j];
    shuffled[i] = b;
    shuffled[j] = a;
  }
  const needOthers = Math.min(typesNeeded - 1, shuffled.length);
  const picked = shuffled.slice(0, needOthers);
  const active = playerCivId && pool.includes(playerCivId) ? [playerCivId, ...picked] : picked.length > 0 ? picked.slice(0, typesNeeded) : [pool[0]];
  return [...new Set(active.filter((id) => !!id))].slice(0, typesNeeded);
}
function assignAiCivTypes(input) {
  const { allCivIds, playerCivId, aiOwnerIds, aktywneTypy, seed } = input;
  const sorted = [...aiOwnerIds].sort((a, b) => a - b);
  const activePool = pickActiveCivPool(
    allCivIds,
    playerCivId,
    aktywneTypy,
    sorted.length,
    seed
  );
  const aiTypes = activePool.filter((id) => id !== playerCivId);
  const rng = makeRng(seed + 7919 >>> 0);
  const shuffledAi = [...aiTypes];
  for (let i = shuffledAi.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const a = shuffledAi[i];
    const b = shuffledAi[j];
    shuffledAi[i] = b;
    shuffledAi[j] = a;
  }
  const out = /* @__PURE__ */ new Map();
  const fallback = allCivIds.find((id) => id && id !== playerCivId) ?? "grecy";
  sorted.forEach((ownerId, idx) => {
    const type = shuffledAi.length > 0 ? shuffledAi[idx % shuffledAi.length] : fallback;
    out.set(ownerId, type ?? fallback);
  });
  return out;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  assignAiCivTypes,
  civIdsAvailableAtGameEpoch,
  civIdsFromRoster,
  pickActiveCivPool
});
