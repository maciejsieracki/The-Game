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

// tools/.research-entry.ts
var research_entry_exports = {};
__export(research_entry_exports, {
  chooseAIResearch: () => chooseAIResearch
});
module.exports = __toCommonJS(research_entry_exports);

// src/units/setup.ts
var DEFAULT_TERRAIN_COSTS = {
  ["laka" /* Laka */]: 1,
  ["rownina" /* Rownina */]: 1,
  ["pustynia" /* Pustynia */]: 1,
  ["wybrzeze" /* Wybrzeze */]: Infinity,
  ["wzgorza" /* Wzgorza */]: 2,
  ["gory" /* Gory */]: Infinity,
  ["morze" /* Morze */]: Infinity
};
var _terrainCosts = { ...DEFAULT_TERRAIN_COSTS };

// data/miasto-params.json
var miasto_params_default = {
  min_dystans_miast: {
    wartosc: 5,
    jednostka: "heksy",
    opis: "Minimalny dystans (w heksach) miedzy dwoma miastami przy zakladaniu. Uzywane w cities.canFoundCity (reason 'za blisko innego miasta')."
  },
  budynek_mnoznik_poziomu: {
    wartosc: 1.1,
    jednostka: "x / poziom",
    opis: "Mnoznik compound (procent skladany) efektu I kosztu budynku za kazdy poziom: wartosc^(poziom-1). Decyzja Naster = +10%/epoke. Uzywany w production.itemCost (koszt) i buildingEffectAtLevel (efekt)."
  },
  jednostka_koszt_ludnosci: {
    wartosc: 1,
    jednostka: "ludnosc",
    opis: "Ile ludnosci kosztuje miasto ukonczenie jednostki z kolejki (rekrutacja). production.populationCostOf; odjecie + clamp do min.1 robi petla tury."
  },
  jednostka_koszt_domyslny: {
    wartosc: 10,
    jednostka: "Praca",
    opis: "Domyslny koszt Pracy jednostki, gdy brak pola 'Pieniadz (koszt)' w units.json i brak dopasowania roli. production.DEFAULT_UNIT_COST."
  },
  jednostka_koszt_rola_wsparcie: {
    wartosc: 12,
    jednostka: "Praca",
    opis: "Fallback kosztu Pracy dla roli 'Wsparcie', gdy brak 'Pieniadz (koszt)'."
  },
  jednostka_koszt_rola_dystans: {
    wartosc: 8,
    jednostka: "Praca",
    opis: "Fallback kosztu Pracy dla roli 'Dystans' (jednostki dystansowe)."
  },
  jednostka_koszt_rola_wrecz: {
    wartosc: 10,
    jednostka: "Praca",
    opis: "Fallback kosztu Pracy dla roli 'Wrecz' (piechota wrecz)."
  },
  jednostka_koszt_rola_konnica: {
    wartosc: 16,
    jednostka: "Praca",
    opis: "Fallback kosztu Pracy dla roli 'Konnica'."
  },
  zasieg_okolicy_miasta: {
    wartosc: 10,
    jednostka: "pola/strona",
    opis: "Promien okolicy roboczej miasta (pola na plony) z kazdej strony = 10 (bylo 5; ROZSZERZONE o +5 z kazdej strony, decyzja Naster). ~21x21 ~331 heksow. Tu przydzielasz mieszkancow; to tez zasieg budowy miasta."
  },
  zasieg_okolicy_max: {
    wartosc: 15,
    jednostka: "pola/strona",
    opis: "Maksymalny promien okolicy miasta (cap) w modelu liniowym zasieg=populacja: cityRangeForPopulation(pop)=min(pop,cap). Decyzja Naster 2026-06-25. Zastepuje schodkowy model baza/pop5/pop10."
  },
  praca_udzial_budynki: {
    wartosc: 0.7,
    jednostka: "udzial [0..1]",
    opis: "Q4: czesc Pracy miasta do kolejki budynkow; reszta -> globalna pula Pracy w skarbcu."
  },
  bonus_obrona_mur_proc: {
    wartosc: 200,
    jednostka: "% Obrony",
    opis: "Miasto Z MUREM daje +200% Obrony broniacym sie jednostkom (bitwa/oblezenie). Decyzja Naster 2026-06-25. Konsumuje game/siege.ts + battleScene (defensa miasta). Miasto bez muru = brak tego bonusu."
  },
  zasieg_okolicy_baza: {
    wartosc: 5,
    jednostka: "pola/strona",
    opis: "[LEGACY - nieuzywane od 2026-06-25] Zasieg okolicy miasta przy populacji < 5 (stary model schodkowy). Zachowane dla wstecznej zgodnosci parsowania."
  },
  zasieg_okolicy_pop5: {
    wartosc: 10,
    jednostka: "pola/strona",
    opis: "[LEGACY - nieuzywane od 2026-06-25] Zasieg okolicy przy populacji >= 5 (stary model schodkowy). Zachowane dla wstecznej zgodnosci parsowania."
  },
  zasieg_okolicy_pop10: {
    wartosc: 15,
    jednostka: "pola/strona",
    opis: "[LEGACY - nieuzywane od 2026-06-25] Zasieg okolicy przy populacji >= 10 (stary model schodkowy). Zachowane dla wstecznej zgodnosci parsowania."
  },
  udzial_output_produkcja: {
    wartosc: 0.4,
    jednostka: "udzial [0..1]",
    opis: "Domyslny udzial outputu miasta kierowany do strumienia PRODUKCJA. production.DEFAULT_OUTPUT_SHARES / splitOutput."
  },
  udzial_output_pieniadz: {
    wartosc: 0.3,
    jednostka: "udzial [0..1]",
    opis: "Domyslny udzial outputu miasta kierowany do strumienia PIENIADZ. production.DEFAULT_OUTPUT_SHARES / splitOutput."
  },
  udzial_output_nauka: {
    wartosc: 0.2,
    jednostka: "udzial [0..1]",
    opis: "Domyslny udzial outputu miasta kierowany do strumienia NAUKA. production.DEFAULT_OUTPUT_SHARES / splitOutput."
  },
  udzial_output_rozwoj: {
    wartosc: 0.1,
    jednostka: "udzial [0..1]",
    opis: "Domyslny udzial outputu miasta kierowany do strumienia ROZWOJ. production.DEFAULT_OUTPUT_SHARES / splitOutput."
  }
};

// src/game/cities.ts
var MIN_CITY_DISTANCE = miasto_params_default.min_dystans_miast?.wartosc ?? 5;

// src/game/diplomacy.ts
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
  ["celtowie" /* Celtowie */]: 0.6,
  // Wysoka (brawura szarzy, agresywna piechota)
  ["germanie" /* Germanie */]: 0.65,
  // Wysoka (piechota lesna, zasadzki, furia bojna)
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
  ["celtowie" /* Celtowie */]: 0.35,
  // Niska (kultury wojownikow, niski handel)
  ["germanie" /* Germanie */]: 0.3,
  // Niska (piechota lesna, handel wtorny)
  ["drobna_cywilizacja" /* DrobnaCywilizacja */]: 0.6
  // Easy to trade per paragraph 5.2
};

// src/game/ai.ts
function parsePrereqs(wyrazenie) {
  if (!wyrazenie) return [];
  const t = wyrazenie.trim();
  if (!t || t === "-" || t === "\u2014" || t === "\u2013" || t.toLowerCase() === "brak") return [];
  return t.split("+").map((s) => s.trim()).filter((s) => s.length > 0);
}
function scoreTech(tech, ukonczone, opts) {
  if (ukonczone.has(tech.Technologia)) return -Infinity;
  const prereqs = parsePrereqs(tech["Wymaga (prereq)"]);
  if (!prereqs.every((p) => ukonczone.has(p))) return -Infinity;
  const mods = opts.mods ?? { wojsko: 0, nauka: 0, ekonomia: 0, obrona: 0 };
  const earlyPhase = (opts.myCitiesCount ?? 1) < 3;
  const underThreat = opts.underThreat ?? false;
  const allBuilt = new Set(opts.allBuiltBuildings ?? []);
  const unlocks = (tech["Odblokowuje budynek"] ?? "").toLowerCase();
  const koszt = typeof tech["Koszt nauki"] === "number" && tech["Koszt nauki"] > 0 ? tech["Koszt nauki"] : 10 + Math.max(0, (tech.Poziom ?? 1) - 1) * 4;
  let score = 0;
  const unlocksGranary = unlocks.includes("spichlerz");
  const unlocksCegielnia = unlocks.includes("cegielnia");
  if (unlocksGranary && !allBuilt.has("Spichlerz")) score += 120;
  if (unlocksCegielnia && !allBuilt.has("Cegielnia")) score += 80;
  const unlocksMilitary = unlocks.includes("koszary") || unlocks.includes("jednostki bron") || unlocks.includes("konnica") || unlocks.includes("lucznik") || unlocks.includes("huta");
  if (unlocksMilitary) {
    score += underThreat ? 100 : earlyPhase ? 40 : 80;
  }
  if (unlocks.includes("mury")) {
    score += underThreat ? 110 : 30;
  }
  const unlocksEconomy = unlocks.includes("tartak") || unlocks.includes("targowisko") || unlocks.includes("akwedukt") || unlocks.includes("biblioteka") || unlocks.includes("studnia") || unlocks.includes("pasterstwo");
  if (unlocksEconomy) score += earlyPhase ? 50 : 70;
  const unlocksExpansion = unlocks.includes("drogi") || unlocks.includes("rydwan") || unlocks.includes("statki") || unlocks.includes("port");
  if (unlocksExpansion) score += earlyPhase ? 60 : 40;
  const unlocksFood = unlocks.includes("farm") || unlocks.includes("pastwisko") || unlocks.includes("pasterstw");
  if (unlocksFood) score += earlyPhase ? 55 : 25;
  if (tech.Technologia === "Pismo") score += earlyPhase ? 20 : 50;
  if (tech.Technologia === "Brazownictwo" || tech.Technologia === "Br\u0105zownictwo") {
    score += underThreat ? 90 : earlyPhase ? 70 : 50;
  }
  if (tech.Technologia === "Wojskowosc") score += underThreat ? 95 : earlyPhase ? 35 : 75;
  score += 10;
  score += mods.nauka * 20;
  score += Math.max(0, 30 - koszt);
  return score;
}
function chooseAIResearch(techData, ukonczone, opts = {}) {
  const done = ukonczone instanceof Set ? ukonczone : new Set(ukonczone);
  let bestScore = -Infinity;
  let bestTech = null;
  for (const tech of techData) {
    const s = scoreTech(tech, done, opts);
    if (s > bestScore) {
      bestScore = s;
      bestTech = tech.Technologia;
    }
  }
  return bestTech;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  chooseAIResearch
});
