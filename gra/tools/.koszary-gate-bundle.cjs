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

// tools/.koszary-gate-entry.ts
var koszary_gate_entry_exports = {};
__export(koszary_gate_entry_exports, {
  EPOCH_BY_NAME: () => EPOCH_BY_NAME,
  availableProduction: () => availableProduction,
  epochNumber: () => epochNumber,
  purchasableUnits: () => purchasableUnits
});
module.exports = __toCommonJS(koszary_gate_entry_exports);

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

// src/game/production.ts
var EPOCH_BY_NAME = {
  Kamien: 1,
  "Kamie\u0144": 1,
  // matches data key (U+0144)
  Braz: 2,
  "Br\u0105z": 2,
  // matches data key (U+0105)
  Zelazo: 3,
  "\u017Belazo": 3
  // matches data key (U+017B)
};
function epochNumber(epoka) {
  if (epoka == null) return 1;
  const n = EPOCH_BY_NAME[epoka];
  return typeof n === "number" ? n : 1;
}
var BUILDING_LEVEL_FACTOR = miasto_params_default.budynek_mnoznik_poziomu?.wartosc ?? 1.1;
var DEFAULT_UNIT_COST = miasto_params_default.jednostka_koszt_domyslny?.wartosc ?? 10;
var DEFAULT_COST_BY_ROLE = {
  Wsparcie: miasto_params_default.jednostka_koszt_rola_wsparcie?.wartosc ?? 12,
  Dystans: miasto_params_default.jednostka_koszt_rola_dystans?.wartosc ?? 8,
  "Wr\u0119cz": miasto_params_default.jednostka_koszt_rola_wrecz?.wartosc ?? 10,
  // melee role key
  Wrecz: miasto_params_default.jednostka_koszt_rola_wrecz?.wartosc ?? 10,
  Konnica: miasto_params_default.jednostka_koszt_rola_konnica?.wartosc ?? 16
};
function unitCostFromDef(def) {
  const raw = def["Pieni\u0105dz (koszt)"];
  if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) {
    return raw;
  }
  const rola = def["Rola (linia)"];
  if (rola != null) {
    const byRole = DEFAULT_COST_BY_ROLE[rola];
    if (typeof byRole === "number") return byRole;
  }
  return DEFAULT_UNIT_COST;
}
function findBuilding(data, id) {
  return data.buildings.find((b) => b.id === id);
}
function findUnit(data, id) {
  return data.units.find((u) => u.Jednostka === id);
}
function itemCost(kind, id, data, cityLevelOrEpoch) {
  if (kind === "budynek") {
    const b = findBuilding(data, id);
    if (!b) return 0;
    const level = Number.isFinite(cityLevelOrEpoch) ? Math.max(1, Math.floor(cityLevelOrEpoch)) : 1;
    return Math.round(b.kosztBudowy * Math.pow(BUILDING_LEVEL_FACTOR, level - 1));
  }
  const u = findUnit(data, id);
  if (!u) return 0;
  return unitCostFromDef(u);
}
function availableProduction(city, data, unlockedTechs, ctx = {}) {
  const epoch = Number.isFinite(ctx.epoch) ? ctx.epoch : 1;
  const level = Number.isFinite(ctx.buildingLevel) ? ctx.buildingLevel : 1;
  const built = new Set(ctx.builtBuildingIds ?? []);
  const techs = new Set(unlockedTechs);
  const items = [];
  for (const b of data.buildings) {
    if (b.epokaWejscia > epoch) continue;
    if (built.has(b.id)) continue;
    const tech = (b.techUnlock ?? "").trim();
    if (tech.length > 0 && !techs.has(tech)) continue;
    items.push({
      kind: "budynek",
      id: b.id,
      nazwa: b.nazwa,
      koszt: itemCost("budynek", b.id, data, level)
    });
  }
  for (const u of data.units) {
    if (epochNumber(u.Epoka) > epoch) continue;
    const zamiast = (u["W zamian za"] ?? "").toString().trim();
    if (zamiast.length > 0 && zamiast !== "-" && zamiast !== "\u2014") continue;
    const tech = (u.Tech ?? "").toString().trim();
    if (tech.length > 0 && tech !== "-" && !techs.has(tech)) continue;
    if (epochNumber(u.Epoka) === 2 && !built.has("koszary")) continue;
    items.push({
      kind: "jednostka",
      id: u.Jednostka,
      nazwa: u.Jednostka,
      koszt: itemCost("jednostka", u.Jednostka, data, 1)
    });
  }
  items.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "budynek" ? -1 : 1;
    if (a.koszt !== b.koszt) return a.koszt - b.koszt;
    return a.nazwa.localeCompare(b.nazwa);
  });
  return items;
}
var UNIT_POPULATION_COST = miasto_params_default.jednostka_koszt_ludnosci?.wartosc ?? 1;
function purchasableUnits(city, data, unlockedTechs, ctx = {}) {
  return availableProduction(city, data, unlockedTechs, ctx).filter((it) => it.kind === "jednostka");
}
var DEFAULT_OUTPUT_SHARES = Object.freeze({
  produkcja: miasto_params_default.udzial_output_produkcja?.wartosc ?? 0.4,
  pieniadz: miasto_params_default.udzial_output_pieniadz?.wartosc ?? 0.3,
  nauka: miasto_params_default.udzial_output_nauka?.wartosc ?? 0.2,
  rozwoj: miasto_params_default.udzial_output_rozwoj?.wartosc ?? 0.1
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  EPOCH_BY_NAME,
  availableProduction,
  epochNumber,
  purchasableUnits
});
