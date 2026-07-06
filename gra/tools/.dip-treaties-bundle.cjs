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

// tools/.dip-treaties-entry.ts
var dip_treaties_entry_exports = {};
__export(dip_treaties_entry_exports, {
  addTreaty: () => addTreaty,
  allianceObligations: () => allianceObligations,
  allianceObligationsForWarDeclaration: () => allianceObligationsForWarDeclaration,
  expireTreaties: () => expireTreaties,
  hasTreaty: () => hasTreaty,
  hydrateActiveDeals: () => hydrateActiveDeals,
  normalizeTreatyKind: () => normalizeTreatyKind,
  removeTreatiesById: () => removeTreatiesById,
  treatiesBrokenByRefusal: () => treatiesBrokenByRefusal,
  treatiesBrokenByWar: () => treatiesBrokenByWar,
  tributeDeals: () => tributeDeals
});
module.exports = __toCommonJS(dip_treaties_entry_exports);

// src/game/diplomacy-treaties.ts
function pairKey(a, b) {
  return a < b ? [a, b] : [b, a];
}
function sideOf(deal, ownerId) {
  return deal.strony[0] === ownerId || deal.strony[1] === ownerId;
}
function allyOf(deal, ownerId) {
  if (deal.strony[0] === ownerId) return deal.strony[1];
  if (deal.strony[1] === ownerId) return deal.strony[0];
  return null;
}
function isAllianceKind(rodzaj) {
  return rodzaj === "sojusz_wojskowy" /* SojuszWojskowy */ || rodzaj === "sojusz_defensywny" || rodzaj === "sojusz_pelny";
}
function normalizeTreatyKind(rodzaj) {
  if (rodzaj === "sojusz_wojskowy" /* SojuszWojskowy */) return "sojusz_pelny";
  return rodzaj;
}
function hydrateActiveDeals(deals) {
  return deals.map((d) => ({
    ...d,
    rodzaj: normalizeTreatyKind(d.rodzaj),
    strony: pairKey(d.strony[0], d.strony[1])
  }));
}
function allianceObligationsForWarDeclaration(state, declarerOwnerId, targetOwnerId) {
  return [
    ...allianceObligations(state, {
      type: "declared_war",
      declarerOwnerId,
      targetOwnerId
    }),
    ...allianceObligations(state, {
      type: "attacked",
      victimOwnerId: targetOwnerId,
      aggressorOwnerId: declarerOwnerId
    })
  ];
}
function addTreaty(state, deal) {
  const k = normalizeTreatyKind(deal.rodzaj);
  const next = { ...deal, rodzaj: k, strony: pairKey(deal.strony[0], deal.strony[1]) };
  const withoutSame = state.filter((d) => d.id !== next.id);
  return [...withoutSame, next];
}
function expireTreaties(state, turn) {
  return state.filter((d) => d.wygasaTura === null || d.wygasaTura > turn);
}
function hasTreaty(state, a, b, rodzaj) {
  const [p0, p1] = pairKey(a, b);
  return state.some((d) => {
    if (d.strony[0] !== p0 || d.strony[1] !== p1) return false;
    if (rodzaj === void 0) return true;
    return normalizeTreatyKind(d.rodzaj) === normalizeTreatyKind(rodzaj);
  });
}
function allianceObligations(state, event) {
  const out = [];
  for (const deal of state) {
    if (!isAllianceKind(deal.rodzaj)) continue;
    const kind = normalizeTreatyKind(deal.rodzaj);
    if (event.type === "attacked") {
      const { victimOwnerId, aggressorOwnerId } = event;
      if (!sideOf(deal, victimOwnerId)) continue;
      if (kind !== "sojusz_defensywny" && kind !== "sojusz_pelny") continue;
      const ally = allyOf(deal, victimOwnerId);
      if (ally === null) continue;
      out.push({
        mustDeclareWarOn: aggressorOwnerId,
        obligatedAllies: [ally],
        treatyIdsToBreakOnRefusal: [deal.id]
      });
    }
    if (event.type === "declared_war") {
      const { declarerOwnerId, targetOwnerId } = event;
      if (!sideOf(deal, declarerOwnerId)) continue;
      if (kind !== "sojusz_pelny") continue;
      const ally = allyOf(deal, declarerOwnerId);
      if (ally === null) continue;
      out.push({
        mustDeclareWarOn: targetOwnerId,
        obligatedAllies: [ally],
        treatyIdsToBreakOnRefusal: [deal.id]
      });
    }
  }
  return out;
}
function treatiesBrokenByRefusal(obligations, joinedWarOwnerIds) {
  const joined = new Set(joinedWarOwnerIds);
  const broken = /* @__PURE__ */ new Set();
  for (const ob of obligations) {
    for (const ally of ob.obligatedAllies) {
      if (!joined.has(ally)) {
        for (const tid of ob.treatyIdsToBreakOnRefusal) broken.add(tid);
      }
    }
  }
  return [...broken];
}
function dealsForPair(state, a, b) {
  const [p0, p1] = pairKey(a, b);
  return state.filter((d) => d.strony[0] === p0 && d.strony[1] === p1);
}
var BREAK_ON_WAR = /* @__PURE__ */ new Set([
  "pakt_nieagresji" /* PaktNieagresji */,
  "sojusz_wojskowy" /* SojuszWojskowy */,
  "sojusz_defensywny",
  "sojusz_pelny",
  "otwarte_granice" /* OtwartGranice */,
  "prawo_wojskowe_przemarszu" /* PrawoWojskowePrzemarszu */,
  "umowa_handlowa" /* UmowaHandlowa */
]);
function treatiesBrokenByWar(state, a, b) {
  const pair = dealsForPair(state, a, b);
  return pair.filter((d) => BREAK_ON_WAR.has(normalizeTreatyKind(d.rodzaj))).map((d) => d.id);
}
function removeTreatiesById(state, ids) {
  if (!ids.length) return state;
  const drop = new Set(ids);
  return state.filter((d) => !drop.has(d.id));
}
function tributeDeals(state) {
  return state.filter(
    (d) => d.ekonomia?.pieniadzePerTura != null && d.ekonomia.pieniadzePerTura > 0
  );
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  addTreaty,
  allianceObligations,
  allianceObligationsForWarDeclaration,
  expireTreaties,
  hasTreaty,
  hydrateActiveDeals,
  normalizeTreatyKind,
  removeTreatiesById,
  treatiesBrokenByRefusal,
  treatiesBrokenByWar,
  tributeDeals
});
