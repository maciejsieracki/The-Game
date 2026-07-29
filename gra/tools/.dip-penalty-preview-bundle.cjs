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

// tools/.dip-penalty-preview-entry.ts
var dip_penalty_preview_entry_exports = {};
__export(dip_penalty_preview_entry_exports, {
  formatDiploPenaltyShort: () => formatDiploPenaltyShort,
  previewVoluntaryTreatyBreakPenalties: () => previewVoluntaryTreatyBreakPenalties,
  previewWarDeclarationPenalties: () => previewWarDeclarationPenalties
});
module.exports = __toCommonJS(dip_penalty_preview_entry_exports);

// src/game/diplomacy-treaties.ts
function pairKey(a, b) {
  return a < b ? [a, b] : [b, a];
}
function normalizeTreatyKind(rodzaj) {
  if (rodzaj === "sojusz_wojskowy" /* SojuszWojskowy */) return "sojusz_pelny";
  return rodzaj;
}
function hasTreaty(state, a, b, rodzaj) {
  const [p0, p1] = pairKey(a, b);
  return state.some((d) => {
    if (d.strony[0] !== p0 || d.strony[1] !== p1) return false;
    if (rodzaj === void 0) return true;
    return normalizeTreatyKind(d.rodzaj) === normalizeTreatyKind(rodzaj);
  });
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

// src/game/diplomacy-penalty-preview.ts
function signed(n) {
  return n > 0 ? `+${n}` : String(n);
}
function pushLine(lines, kind, delta, reason) {
  if (kind === "info" || delta !== 0) lines.push({ kind, delta, reason });
}
function totals(lines) {
  let wiarygodnoscTotal = 0;
  let zaufanieTotal = 0;
  for (const l of lines) {
    if (l.kind === "wiarygodnosc") wiarygodnoscTotal += l.delta;
    if (l.kind === "zaufanie") zaufanieTotal += l.delta;
  }
  return { wiarygodnoscTotal, zaufanieTotal };
}
function isAllianceKind(rodzaj) {
  const k = normalizeTreatyKind(rodzaj);
  return k === "sojusz_pelny" || k === "sojusz_defensywny" || k === "sojusz_wojskowy" /* SojuszWojskowy */;
}
function dealInvolvesOwners(deal, a, b) {
  const p0 = Math.min(a, b);
  const p1 = Math.max(a, b);
  return deal.strony[0] === p0 && deal.strony[1] === p1;
}
function formatDiploPenaltyShort(p) {
  const parts = [];
  if (p.wiarygodnoscTotal !== 0) parts.push(`Wiarygodno\u015B\u0107 ${signed(p.wiarygodnoscTotal)}`);
  if (p.zaufanieTotal !== 0) parts.push(`Zaufanie ${signed(p.zaufanieTotal)}`);
  const info = p.lines.filter((l) => l.kind === "info").map((l) => l.reason);
  parts.push(...info);
  return parts.join(" \xB7 ") || "brak kary";
}
function previewWarDeclarationPenalties(input) {
  const { declarerId, targetId, activeDeals, params, isRetaliation, attackSameTurn } = input;
  const lines = [];
  const deals = [...activeDeals];
  if (!isRetaliation) {
    const hasAlliance = deals.some(
      (d) => dealInvolvesOwners(d, declarerId, targetId) && isAllianceKind(d.rodzaj)
    );
    const hasNap = hasTreaty(deals, declarerId, targetId, "pakt_nieagresji" /* PaktNieagresji */);
    if (hasAlliance) {
      pushLine(
        lines,
        "wiarygodnosc",
        params.wiarygodnoscN2ZlamaniePaktuSojusz,
        "zerwanie sojuszu przez wypowiedzenie wojny"
      );
    } else if (hasNap) {
      pushLine(
        lines,
        "wiarygodnosc",
        params.wiarygodnoscN2ZlamaniePaktuNap,
        "zerwanie paktu o nieagresji przez wypowiedzenie wojny"
      );
    }
  }
  const brokenIds = treatiesBrokenByWar(deals, declarerId, targetId);
  if (brokenIds.length > 0) {
    const hasTrade = deals.some(
      (d) => brokenIds.includes(d.id) && normalizeTreatyKind(d.rodzaj) === "umowa_handlowa" /* UmowaHandlowa */
    );
    pushLine(
      lines,
      "zaufanie",
      params.zlamanaPaktGracz_zaufanie,
      hasTrade ? "zerwanie aktywnej umowy handlowej (w tym cyklicznej) przez wojn\u0119" : "zerwanie aktywnego traktatu przez wojn\u0119"
    );
  }
  if (attackSameTurn && !isRetaliation) {
    pushLine(
      lines,
      "wiarygodnosc",
      params.wiarygodnoscN1BezOstrzezenia,
      "atak w tej samej turze co wypowiedzenie wojny (bez ostrze\u017Cenia)"
    );
  }
  return { lines, ...totals(lines) };
}
function previewVoluntaryTreatyBreakPenalties(deal, params) {
  const lines = [];
  const isTrade = normalizeTreatyKind(deal.rodzaj) === "umowa_handlowa" /* UmowaHandlowa */;
  if (deal.wygasaTura === null) {
    pushLine(
      lines,
      "info",
      0,
      `brak kary Wiarygodno\u015Bci za samo zerwanie; przez ${params.wiarygodnoscN3KarencjaBezterminoweTur} tur atak na tego partnera kosztuje ${signed(params.wiarygodnoscN3AtakWOknieKarencji)} Wiarygodno\u015Bci`
    );
  } else {
    pushLine(
      lines,
      "wiarygodnosc",
      isTrade ? params.wiarygodnoscN5ZerwanieHandelCzasowy : params.wiarygodnoscN5ZerwanieTraktatCzasowy,
      isTrade ? "dobrowolne zerwanie umowy handlowej" : "dobrowolne zerwanie traktatu"
    );
  }
  pushLine(
    lines,
    "zaufanie",
    isTrade ? -10 : -15,
    isTrade ? "zerwanie umowy handlowej" : "zerwanie traktatu"
  );
  return { lines, ...totals(lines) };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  formatDiploPenaltyShort,
  previewVoluntaryTreatyBreakPenalties,
  previewWarDeclarationPenalties
});
