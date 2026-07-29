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

// tools/.dip-reject-cooldown-entry.ts
var dip_reject_cooldown_entry_exports = {};
__export(dip_reject_cooldown_entry_exports, {
  AI_REJECTED_OFFER_COOLDOWN_TURNS: () => AI_REJECTED_OFFER_COOLDOWN_TURNS,
  isOfferRejectedOnCooldown: () => isOfferRejectedOnCooldown,
  makeRejectedOfferCooldown: () => makeRejectedOfferCooldown,
  negotiationPartnerOwnerId: () => negotiationPartnerOwnerId,
  pruneExpiredRejectedOffers: () => pruneExpiredRejectedOffers,
  recordRejectedOffer: () => recordRejectedOffer
});
module.exports = __toCommonJS(dip_reject_cooldown_entry_exports);

// src/game/diplomacy-rejection-cooldown.ts
var AI_REJECTED_OFFER_COOLDOWN_TURNS = 3;
function makeRejectedOfferCooldown(partnerOwnerId, actionId, rejectedAtTurn, cooldownTurns = AI_REJECTED_OFFER_COOLDOWN_TURNS) {
  return {
    partnerOwnerId,
    actionId,
    rejectedAtTurn,
    expiresAtTurn: rejectedAtTurn + cooldownTurns
  };
}
function negotiationPartnerOwnerId(proposerOwnerId, responderOwnerId) {
  return proposerOwnerId === 0 ? responderOwnerId : proposerOwnerId;
}
function isOfferRejectedOnCooldown(cooldowns, partnerOwnerId, actionId, currentTurn) {
  return cooldowns.some(
    (c) => c.partnerOwnerId === partnerOwnerId && c.actionId === actionId && currentTurn < c.expiresAtTurn
  );
}
function recordRejectedOffer(cooldowns, partnerOwnerId, actionId, rejectedAtTurn, cooldownTurns = AI_REJECTED_OFFER_COOLDOWN_TURNS) {
  const entry = makeRejectedOfferCooldown(partnerOwnerId, actionId, rejectedAtTurn, cooldownTurns);
  const filtered = cooldowns.filter(
    (c) => !(c.partnerOwnerId === partnerOwnerId && c.actionId === actionId)
  );
  return [...filtered, entry];
}
function pruneExpiredRejectedOffers(cooldowns, currentTurn) {
  return cooldowns.filter((c) => currentTurn < c.expiresAtTurn);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AI_REJECTED_OFFER_COOLDOWN_TURNS,
  isOfferRejectedOnCooldown,
  makeRejectedOfferCooldown,
  negotiationPartnerOwnerId,
  pruneExpiredRejectedOffers,
  recordRejectedOffer
});
