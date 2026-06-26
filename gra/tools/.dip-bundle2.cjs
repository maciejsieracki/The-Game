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

// tools/.dip-entry2.ts
var dip_entry2_exports = {};
__export(dip_entry2_exports, {
  DIPLOMACY_PARAMS: () => DIPLOMACY_PARAMS,
  RodzajTraktatu: () => RodzajTraktatu,
  StanWojny: () => StanWojny,
  TypCywilizacji: () => TypCywilizacji,
  aiDiplomacyStance: () => aiDiplomacyStance,
  applyDiplomaticEvent: () => applyDiplomaticEvent,
  initialRelation: () => initialRelation,
  loadDiplomacyParams: () => loadDiplomacyParams,
  relationScore: () => relationScore,
  toRelation: () => toRelation
});
module.exports = __toCommonJS(dip_entry2_exports);

// ../../../../../tmp/diptest/src/types/diplomacy.ts
var RodzajTraktatu = /* @__PURE__ */ ((RodzajTraktatu2) => {
  RodzajTraktatu2["PaktNieagresji"] = "pakt_nieagresji";
  RodzajTraktatu2["SojuszWojskowy"] = "sojusz_wojskowy";
  RodzajTraktatu2["OtwartGranice"] = "otwarte_granice";
  RodzajTraktatu2["PrawoWojskowePrzemarszu"] = "prawo_wojskowe_przemarszu";
  RodzajTraktatu2["UmowaHandlowa"] = "umowa_handlowa";
  RodzajTraktatu2["Wasalizacja"] = "wasalizacja";
  RodzajTraktatu2["Rozejm"] = "rozejm";
  return RodzajTraktatu2;
})(RodzajTraktatu || {});
var StanWojny = /* @__PURE__ */ ((StanWojny2) => {
  StanWojny2["Pokoj"] = "pokoj";
  StanWojny2["Rozejm"] = "rozejm";
  StanWojny2["Wojna"] = "wojna";
  StanWojny2["CasusBelli"] = "casus_belli";
  return StanWojny2;
})(StanWojny || {});

// ../../../../../tmp/diptest/src/types/player.ts
var TypCywilizacji = /* @__PURE__ */ ((TypCywilizacji2) => {
  TypCywilizacji2["Grecy"] = "grecy";
  TypCywilizacji2["Rzymianie"] = "rzymianie";
  TypCywilizacji2["Chinczycy"] = "chinczycy";
  TypCywilizacji2["Inkowie"] = "inkowie";
  TypCywilizacji2["Zulusi"] = "zulusi";
  TypCywilizacji2["Egipt"] = "egipt";
  TypCywilizacji2["Babilon"] = "babilon";
  TypCywilizacji2["DrobnaCywilizacja"] = "drobna_cywilizacja";
  return TypCywilizacji2;
})(TypCywilizacji || {});

// ../../../../../tmp/diptest/src/game/diplomacy.ts
var DIPLOMACY_PARAMS = {
  // ---- one-shot Zaufanie deltas (jednorazowo) ----
  /** "Zawarcie umowy handlowej" (+2 Zaufanie, jednorazowo) */
  handelZawarcie_zaufanie: 2,
  /** "Pomoc w wojnie sojusznikowi" (+10 Zaufanie, jednorazowo) */
  pomocSojusznikowi_zaufanie: 10,
  /** "Wspolny wrog -- nawiazanie kooperacji" (+5 Zaufanie, jednorazowo) */
  wspolnyWrogNawiazanie_zaufanie: 5,
  /** "Podarunek surowca / Pieniadza (gratis)" (+6 Zaufanie, jednorazowo) */
  dar_zaufanie: 6,
  /** "Zlamany pakt przez gracza" (-40 Zaufanie, jednorazowo) */
  zlamanaPaktGracz_zaufanie: -40,
  /** "Zlamany pakt przez AI" (-20 Zaufanie, jednorazowo) */
  zlamanaPaktAI_zaufanie: -20,
  /** "Zdrada / atak z zaskoczenia (na gracza)" (-50 Zaufanie, jednorazowo) */
  zdrada_zaufanie: -50,
  /** "Szpiegostwo wykryte przez przeciwnika" (-15 Zaufanie, jednorazowo) */
  szpiegWykryty_zaufanie: -15,
  /** "Rywalizacja tego samego typu (start gry)" (-20 Zaufanie, jednorazowo) */
  rywalizacjaTenSamTyp_zaufanie: -20,
  /** "Duza roznica kulturowa (rozny typ)" (-5 Zaufanie, jednorazowo) */
  roznicaKulturowa_zaufanie: -5,
  // ---- one-shot Respekt deltas (jednorazowo) ----
  /** "Znaczaca przewaga militarna gracza" (+15 Respekt, jednorazowo; 2x or 5x threshold) */
  przewagaMilitarna_respekt: 15,
  /** "Gracz slabszy militarnie od partnera" (-10 Respekt, jednorazowo) */
  slabszyMilitarnie_respekt: -10,
  /** "Wygrana bitwa (historia bojowa)" (+5 Respekt, jednorazowo) */
  wygraBitwa_respekt: 5,
  /** "Akceptacja zadania trybutu" (+10 Respekt, jednorazowo) */
  trybut_respekt: 10,
  /** "Wspolny wrog zaakceptowany" (+10 Respekt, jednorazowo) */
  wspolnyWrogAkceptacja_respekt: 10,
  // ---- per-turn Zaufanie deltas (co ture) ----
  /** "Aktywny handel (trwa umowa handlowa)" (+1/ture) */
  handel_zaufanie_perTura: 1,
  /** "Dotrzymany pakt (NAP lub sojusz trwa)" (+1/ture) */
  aktywnyPakt_zaufanie_perTura: 1,
  /** "Efekt dobrej woli (podarunek)" (+1/ture przez kilka tur) */
  dobraWola_zaufanie_perTura: 1,
  /** "Wspolny wrog (kooperacja trwa)" (+1/ture) */
  wspolnyWrog_zaufanie_perTura: 1,
  /** "Wspolna religia" (+0.5/ture, max +15) */
  wspolnaReligia_zaufanie_perTura: 0.5,
  /** "Odmienna religia" (-0.5/ture, max -10) */
  odmiennaReligia_zaufanie_perTura: -0.5,
  /** "Ekspansja przy granicy" (-2/ture) */
  ekspansjaGranica_zaufanie_perTura: -2,
  /** "Urazy historyczne (zanikajace)" (-2/ture; fades every 20 turns) */
  urazyHistoryczne_zaufanie_perTura: -2,
  // ---- thresholds (progi akcji; sekcja C) ----
  /** Zaufanie >= 60 required for SojuszWojskowy */
  progSojuszZaufanie: 60,
  /** Zaufanie >= 70 required for WymianaTechnologii */
  progWymianaTechZaufanie: 70,
  /** Respekt >= 70 required to demand Wasalizacja */
  progWasalizacjaRespekt: 70,
  /** Respekt >= 90 required to demand Wchloniecie */
  progWchloniecieRespekt: 90,
  /** Relacja < 30 = diplomacy nearly impossible */
  progMinimalnyRelacja: 30,
  /** Relacja >= 120 = alliances realistic */
  progSojuszRelacja: 120,
  // ---- starting values (wartosci startowe) ----
  startZaufanie: 20,
  startRespekt: 30,
  // ---- global multipliers (sekcja E) ----
  mnoznikZaufania: 1,
  mnoznikRespektu: 1,
  mnoznikPodarunku: 1,
  turyEfektuPodarunku: 5,
  // ---- simplified minor-civ threshold (paragraph 5.2) ----
  /** Minor civ accepts tribute / NAP / annexation when player Respekt > this */
  progPoboczneAkceptacja: 60,
  /** Minor civ at peace when Relacja > this */
  progPoboczneHandel: 30,
  /**
   * Minor civ may go to war when Relacja drops BELOW this (0-200 scale).
   * Remaps Dyplomacja-szablon.md 5.2 "Relacja < -40" onto the 3.1 range 0-200:
   * Relacja = Zaufanie + Respekt is clamped >= 0, so a negative floor is
   * unreachable -- "very hostile" is modelled as a low positive threshold.
   * (The "player attacks" war trigger from 5.2 is handled by the engine.)
   */
  progPoboczneWojna: 15
};
function loadDiplomacyParams(json) {
  const out = {};
  if (!json || typeof json !== "object") return out;
  const params = json.params;
  if (!params || typeof params !== "object") return out;
  const src = params;
  for (const key of Object.keys(DIPLOMACY_PARAMS)) {
    const v = src[key];
    if (typeof v === "number" && Number.isFinite(v)) {
      out[key] = v;
    }
  }
  return out;
}
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
function relationScore(rel) {
  return clamp(
    rel.zaufanie * DIPLOMACY_PARAMS.mnoznikZaufania + rel.respekt * DIPLOMACY_PARAMS.mnoznikRespektu,
    0,
    200
  );
}
function applyDiplomaticEvent(rel, event, params = {}) {
  const p = { ...DIPLOMACY_PARAMS, ...params };
  let dZ = 0;
  let dR = 0;
  let newStatus = rel.status;
  switch (event) {
    case "wojna_wypowiedziana":
      dZ = -20;
      newStatus = "wojna";
      break;
    case "pokoj":
      dZ = 5;
      newStatus = "pokoj";
      break;
    case "handel":
      dZ = p.handelZawarcie_zaufanie;
      break;
    case "wspolny_wrog":
      dZ = p.wspolnyWrogNawiazanie_zaufanie;
      dR = p.wspolnyWrogAkceptacja_respekt;
      break;
    case "zlamana_obietnica":
      dZ = p.zlamanaPaktGracz_zaufanie;
      break;
    case "zlamana_obietnica_ai":
      dZ = p.zlamanaPaktAI_zaufanie;
      break;
    case "zdrada":
      dZ = p.zdrada_zaufanie;
      newStatus = "wojna";
      break;
    case "tarcia_graniczne":
      dZ = p.ekspansjaGranica_zaufanie_perTura;
      break;
    case "dar":
      dZ = p.dar_zaufanie * p.mnoznikPodarunku;
      break;
    case "wspolna_religia":
      dZ = 1;
      break;
    case "pomoc_sojusznikowi":
      dZ = p.pomocSojusznikowi_zaufanie;
      break;
    case "wygrana_bitwa":
      dR = p.wygraBitwa_respekt;
      break;
    case "przewaga_militarna":
      dR = p.przewagaMilitarna_respekt;
      break;
    case "slabszy_militarnie":
      dR = p.slabszyMilitarnie_respekt;
      break;
    case "trybut_zaakceptowany":
      dR = p.trybut_respekt;
      break;
    case "wojna_casus_belli":
      dZ = -10;
      newStatus = "wojna";
      break;
    case "ultimatum_spelnione":
      dZ = -5;
      break;
    case "ultimatum_bezpodstawne":
      dZ = -10;
      dR = -10;
      break;
    case "trybut_odmowa":
      dZ = -10;
      break;
    case "trybut_oferta_przyjeta":
      dZ = 5;
      break;
    case "wymiana_tech_gratis":
      dZ = 5;
      break;
  }
  const newZ = clamp(rel.zaufanie + dZ, 0, 100);
  const newR = clamp(rel.respekt + dR, 0, 100);
  return {
    zaufanie: newZ,
    respekt: newR,
    status: newStatus
  };
}
var ARCHETYPE_AGGRESSION = {
  ["grecy" /* Grecy */]: 0.4,
  // Srednia
  ["rzymianie" /* Rzymianie */]: 0.75,
  // Wysoka
  ["chinczycy" /* Chinczycy */]: 0.2,
  // Niska
  ["inkowie" /* Inkowie */]: 0.45,
  // Srednia (izolacjonizm; offensive when threatened)
  ["zulusi" /* Zulusi */]: 0.9,
  // Bardzo wysoka
  ["egipt" /* Egipt */]: 0.35,
  // not in paragraph 4; reasonable middle
  ["babilon" /* Babilon */]: 0.3,
  // not in paragraph 4; reasonable middle
  ["drobna_cywilizacja" /* DrobnaCywilizacja */]: 0.15
  // Minor civs rarely initiate war (paragraph 5.2)
};
var ARCHETYPE_TRADE = {
  ["grecy" /* Grecy */]: 0.75,
  // Wysoka
  ["rzymianie" /* Rzymianie */]: 0.5,
  // Srednia
  ["chinczycy" /* Chinczycy */]: 0.85,
  // Wysoka (priorytet handel i technologia)
  ["inkowie" /* Inkowie */]: 0.25,
  // Niska (izolacjonizm)
  ["zulusi" /* Zulusi */]: 0.2,
  // Niska
  ["egipt" /* Egipt */]: 0.6,
  ["babilon" /* Babilon */]: 0.65,
  ["drobna_cywilizacja" /* DrobnaCywilizacja */]: 0.6
  // Easy to trade per paragraph 5.2
};
function aiDiplomacyStance(aiPlayer, otherPlayer, rel, context) {
  const score = relationScore(rel);
  const { zaufanie, respekt } = rel;
  const p = DIPLOMACY_PARAMS;
  if (context.isMinorCiv || aiPlayer.typCywilizacji === "drobna_cywilizacja" /* DrobnaCywilizacja */) {
    const fearFactor = respekt > p.progPoboczneAkceptacja ? 0.9 : respekt / p.progPoboczneAkceptacja;
    const tradeOpen = score > p.progPoboczneHandel ? 0.6 : 0.2;
    const warWilling = score < p.progPoboczneWojna ? 0.2 : 0.05;
    return {
      willingnessWar: warWilling,
      willingnessPeace: fearFactor,
      willingnessTrade: tradeOpen,
      willingnessAlly: 0
      // minor civs cannot form military alliances (paragraph 2 table)
    };
  }
  const archAggression = ARCHETYPE_AGGRESSION[aiPlayer.typCywilizacji] ?? 0.4;
  const archTrade = ARCHETYPE_TRADE[aiPlayer.typCywilizacji] ?? 0.5;
  let warW = 0;
  if (rel.status !== "wojna") {
    const respektNorm = respekt / 100;
    const relPenalty = 1 - clamp(score / 200, 0, 1);
    warW = clamp(
      archAggression * 0.5 + respektNorm * 0.3 + relPenalty * 0.2,
      0,
      1
    );
  }
  let peaceW;
  if (rel.status === "wojna") {
    const warWeariness = clamp(context.turnsAtWar / 20, 0, 0.5);
    const militaryPressure = context.militaryRatio < 1 ? (1 - context.militaryRatio) * 0.4 : 0;
    const goodwill = zaufanie / 100 * 0.2;
    peaceW = clamp(warWeariness + militaryPressure + goodwill, 0, 1);
  } else {
    peaceW = 0.8;
  }
  let tradeW = 0;
  if (score >= p.progMinimalnyRelacja) {
    const relFactor = clamp(score / 200, 0, 1) * 0.4;
    tradeW = clamp(archTrade * 0.6 + relFactor, 0, 1);
  }
  let allyW = 0;
  if (zaufanie >= p.progSojuszZaufanie && score >= p.progSojuszRelacja) {
    const loyaltyBonus = aiPlayer.typCywilizacji === "chinczycy" /* Chinczycy */ ? 0.2 : aiPlayer.typCywilizacji === "inkowie" /* Inkowie */ ? 0.15 : aiPlayer.typCywilizacji === "grecy" /* Grecy */ ? 0.1 : aiPlayer.typCywilizacji === "zulusi" /* Zulusi */ ? -0.2 : 0;
    const trustFactor = zaufanie / 100 * 0.6;
    const scoreFactor = clamp((score - p.progSojuszRelacja) / 80, 0, 0.3);
    allyW = clamp(trustFactor + loyaltyBonus + scoreFactor, 0, 1);
  }
  return {
    willingnessWar: parseFloat(warW.toFixed(4)),
    willingnessPeace: parseFloat(peaceW.toFixed(4)),
    willingnessTrade: parseFloat(tradeW.toFixed(4)),
    willingnessAlly: parseFloat(allyW.toFixed(4))
  };
}
function initialRelation(playerA, playerB) {
  const p = DIPLOMACY_PARAMS;
  let zaufanie = p.startZaufanie;
  if (playerA.typCywilizacji === playerB.typCywilizacji) {
    zaufanie += p.rywalizacjaTenSamTyp_zaufanie;
  } else if (playerA.typCywilizacji !== "drobna_cywilizacja" /* DrobnaCywilizacja */ && playerB.typCywilizacji !== "drobna_cywilizacja" /* DrobnaCywilizacja */) {
    zaufanie += p.roznicaKulturowa_zaufanie;
  }
  return {
    zaufanie: clamp(zaufanie, 0, 100),
    respekt: p.startRespekt,
    status: "neutralni"
  };
}
function toRelation(rdip) {
  const hasSojusz = rdip.traktaty.some((t) => t.rodzaj === "sojusz_wojskowy");
  let status;
  switch (rdip.stanWojny) {
    case "wojna" /* Wojna */:
    case "casus_belli" /* CasusBelli */:
      status = "wojna";
      break;
    case "rozejm" /* Rozejm */:
    case "pokoj" /* Pokoj */:
      status = hasSojusz ? "sojusz" : "pokoj";
      break;
    default:
      status = hasSojusz ? "sojusz" : "neutralni";
  }
  return {
    zaufanie: rdip.zaufanie,
    respekt: rdip.respekt,
    status
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DIPLOMACY_PARAMS,
  RodzajTraktatu,
  StanWojny,
  TypCywilizacji,
  aiDiplomacyStance,
  applyDiplomaticEvent,
  initialRelation,
  loadDiplomacyParams,
  relationScore,
  toRelation
});
