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

// tools/.dip-economy-entry.ts
var dip_economy_entry_exports = {};
__export(dip_economy_entry_exports, {
  AI_TRADE_GOLD_MAX: () => AI_TRADE_GOLD_MAX,
  activeDealsToPaymentDeals: () => activeDealsToPaymentDeals,
  aiOneShotGiftCooldownTurns: () => aiOneShotGiftCooldownTurns,
  aiOneShotGiftGoldMultiplier: () => aiOneShotGiftGoldMultiplier,
  applyDiplomaticGoldGrant: () => applyDiplomaticGoldGrant,
  applyOneShotGoldTransfer: () => applyOneShotGoldTransfer,
  canAiProposeOneShotGoldGift: () => canAiProposeOneShotGoldGift,
  capAiGoldOffer: () => capAiGoldOffer,
  tickDiplomacyPayments: () => tickDiplomacyPayments,
  tributeBreakPairsFromDeals: () => tributeBreakPairsFromDeals
});
module.exports = __toCommonJS(dip_economy_entry_exports);

// src/game/diplomacy-economy.ts
function isExpired(deal, turn) {
  return deal.doTury != null && turn > deal.doTury;
}
function activeDealsToPaymentDeals(deals, turn) {
  const out = [];
  for (const d of deals) {
    if (d.handelJednorazowy) continue;
    const perTurn = d.ekonomia?.pieniadzePerTura;
    if (perTurn == null || perTurn <= 0) continue;
    if (isExpired({ doTury: d.wygasaTura }, turn)) continue;
    out.push({
      id: d.id,
      kind: "tribute",
      payerOwnerId: d.ekonomia.payerOwnerId,
      receiverOwnerId: d.ekonomia.receiverOwnerId,
      pieniadzePerTura: perTurn,
      doTury: d.wygasaTura
    });
  }
  return out;
}
function tickDiplomacyPayments(deals, treasury, turn) {
  const paid = [];
  const broken = [];
  const messages = [];
  for (const deal of deals) {
    if (isExpired(deal, turn)) continue;
    if (deal.kind === "trade" && deal.tradeKind === "once") continue;
    let amount = 0;
    let payer = 0;
    let receiver = 0;
    if (deal.kind === "tribute") {
      amount = deal.pieniadzePerTura;
      payer = deal.payerOwnerId;
      receiver = deal.receiverOwnerId;
    } else {
      amount = deal.perTurnGold ?? deal.payload.pieniadze ?? 0;
      payer = deal.fromOwnerId;
      receiver = deal.toOwnerId;
    }
    if (amount <= 0) continue;
    const balance = treasury.getPieniadze(payer);
    if (balance < amount) {
      broken.push(deal.id);
      messages.push(`Trybut zerwany (${deal.id}): brak ${amount} \xA4 u gracza ${payer}`);
      continue;
    }
    treasury.add(payer, -amount);
    treasury.add(receiver, amount);
    paid.push(deal.id);
    messages.push(`Trybut ${amount} \xA4: ${payer} \u2192 ${receiver}`);
  }
  return { paid, broken, messages };
}
function tributeBreakPairsFromDeals(deals, brokenIds) {
  if (!brokenIds.length) return [];
  const drop = new Set(brokenIds);
  const out = [];
  for (const d of deals) {
    if (!drop.has(d.id)) continue;
    const eco = d.ekonomia;
    if (!eco?.pieniadzePerTura || eco.pieniadzePerTura <= 0) continue;
    out.push({
      dealId: d.id,
      payerOwnerId: eco.payerOwnerId,
      receiverOwnerId: eco.receiverOwnerId
    });
  }
  return out;
}
var AI_TRADE_GOLD_MAX = 20;
var AI_ONESHOT_GIFT_COOLDOWN_TURNS = {
  easy: 15,
  normal: 25,
  hard: 35
};
var AI_ONESHOT_GIFT_GOLD_MULT = {
  easy: 1.25,
  normal: 1,
  hard: 0.75
};
function aiOneShotGiftCooldownTurns(difficulty) {
  return AI_ONESHOT_GIFT_COOLDOWN_TURNS[difficulty];
}
function aiOneShotGiftGoldMultiplier(difficulty) {
  return AI_ONESHOT_GIFT_GOLD_MULT[difficulty];
}
function canAiProposeOneShotGoldGift(currentTurn, lastGiftTurn, difficulty) {
  if (lastGiftTurn == null || lastGiftTurn <= 0) return true;
  return currentTurn >= lastGiftTurn + aiOneShotGiftCooldownTurns(difficulty);
}
function capAiGoldOffer(balance, maxOffer) {
  if (!Number.isFinite(balance) || balance <= 0) return 0;
  return Math.min(Math.floor(balance), maxOffer);
}
function applyOneShotGoldTransfer(fromOwnerId, toOwnerId, amount, treasury) {
  if (amount <= 0) return { ok: false, reason: "Kwota musi by\u0107 > 0" };
  const balance = treasury.getPieniadze(fromOwnerId);
  if (balance < amount) {
    return { ok: false, reason: `Brak \u015Brodk\xF3w (${balance} < ${amount} \xA4)` };
  }
  treasury.add(fromOwnerId, -amount);
  treasury.add(toOwnerId, amount);
  return { ok: true };
}
function applyDiplomaticGoldGrant(fromOwnerId, toOwnerId, amount, treasury) {
  const result = applyOneShotGoldTransfer(fromOwnerId, toOwnerId, amount, treasury);
  if (!result.ok) return { ok: false, granted: 0, reason: result.reason };
  return { ok: true, granted: amount };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AI_TRADE_GOLD_MAX,
  activeDealsToPaymentDeals,
  aiOneShotGiftCooldownTurns,
  aiOneShotGiftGoldMultiplier,
  applyDiplomaticGoldGrant,
  applyOneShotGoldTransfer,
  canAiProposeOneShotGoldGift,
  capAiGoldOffer,
  tickDiplomacyPayments,
  tributeBreakPairsFromDeals
});
