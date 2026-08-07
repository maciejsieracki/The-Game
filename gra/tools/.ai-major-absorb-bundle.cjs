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

// tools/.ai-major-absorb-entry.ts
var ai_major_absorb_entry_exports = {};
__export(ai_major_absorb_entry_exports, {
  AI_MAJOR_ABSORB_MIN_TURN: () => AI_MAJOR_ABSORB_MIN_TURN,
  AI_MAJOR_ABSORB_POWER_RATIO_MIN: () => AI_MAJOR_ABSORB_POWER_RATIO_MIN,
  decideAiMajorAbsorb: () => decideAiMajorAbsorb
});
module.exports = __toCommonJS(ai_major_absorb_entry_exports);

// src/game/ai-major-absorb.ts
var AI_MAJOR_ABSORB_POWER_RATIO_MIN = 1.25;
var AI_MAJOR_ABSORB_MIN_TURN = 10;
function decideAiMajorAbsorb(input) {
  if (input.difficulty !== "hard") {
    return { action: null, reason: "not_hard" };
  }
  if (input.aggressorId === 0 || input.victimId === 0) {
    return { action: null, reason: "player_involved" };
  }
  if (input.sameOwner) {
    return { action: null, reason: "same_owner" };
  }
  if (input.victimEliminated) {
    return { action: null, reason: "victim_eliminated" };
  }
  if (!input.aggressorIsMajor || !input.victimIsMajor) {
    return { action: null, reason: "not_both_major" };
  }
  if (input.requireSameCiv === true && !input.sameCiv) {
    return { action: null, reason: "different_civ" };
  }
  if (input.turn < AI_MAJOR_ABSORB_MIN_TURN) {
    return { action: null, reason: "too_early" };
  }
  if (input.powerRatio < AI_MAJOR_ABSORB_POWER_RATIO_MIN) {
    return { action: null, reason: "insufficient_power" };
  }
  const reason = input.requireSameCiv === true ? "hard_same_civ_ratio" : "hard_any_civ_ratio";
  return { action: "instant_annex", reason };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AI_MAJOR_ABSORB_MIN_TURN,
  AI_MAJOR_ABSORB_POWER_RATIO_MIN,
  decideAiMajorAbsorb
});
