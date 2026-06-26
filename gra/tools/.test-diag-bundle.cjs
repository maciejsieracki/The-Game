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

// tools/.test-diag-entry.ts
var test_diag_entry_exports = {};
__export(test_diag_entry_exports, {
  advanceCityEconomy: () => advanceCityEconomy
});
module.exports = __toCommonJS(test_diag_entry_exports);

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
    opis: "Zasieg okolicy miasta przy populacji < 5 (start)."
  },
  zasieg_okolicy_pop5: {
    wartosc: 10,
    jednostka: "pola/strona",
    opis: "Zasieg okolicy przy populacji >= 5."
  },
  zasieg_okolicy_pop10: {
    wartosc: 15,
    jednostka: "pola/strona",
    opis: "Zasieg okolicy przy populacji >= 10."
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
var BUILDING_LEVEL_FACTOR = miasto_params_default.budynek_mnoznik_poziomu?.wartosc ?? 1.1;
function buildingEffectAtLevel(baza, level) {
  const n = Math.max(1, Math.floor(level));
  return baza * Math.pow(BUILDING_LEVEL_FACTOR, n - 1);
}
var DEFAULT_UNIT_COST = miasto_params_default.jednostka_koszt_domyslny?.wartosc ?? 10;
var DEFAULT_COST_BY_ROLE = {
  Wsparcie: miasto_params_default.jednostka_koszt_rola_wsparcie?.wartosc ?? 12,
  Dystans: miasto_params_default.jednostka_koszt_rola_dystans?.wartosc ?? 8,
  "Wr\u0119cz": miasto_params_default.jednostka_koszt_rola_wrecz?.wartosc ?? 10,
  // melee role key
  Wrecz: miasto_params_default.jednostka_koszt_rola_wrecz?.wartosc ?? 10,
  Konnica: miasto_params_default.jednostka_koszt_rola_konnica?.wartosc ?? 16
};
var UNIT_POPULATION_COST = miasto_params_default.jednostka_koszt_ludnosci?.wartosc ?? 1;
function splitPraca(cityPraca, udzialBudynki) {
  const praca = Number.isFinite(cityPraca) && cityPraca > 0 ? cityPraca : 0;
  const u = Math.min(1, Math.max(0, Number.isFinite(udzialBudynki) ? udzialBudynki : 1));
  const doBudynkow = praca * u;
  return { doBudynkow, doPuli: praca - doBudynkow };
}
var DEFAULT_OUTPUT_SHARES = Object.freeze({
  produkcja: miasto_params_default.udzial_output_produkcja?.wartosc ?? 0.4,
  pieniadz: miasto_params_default.udzial_output_pieniadz?.wartosc ?? 0.3,
  nauka: miasto_params_default.udzial_output_nauka?.wartosc ?? 0.2,
  rozwoj: miasto_params_default.udzial_output_rozwoj?.wartosc ?? 0.1
});

// src/game/economy.ts
var TERRAIN_YIELDS = {
  ["laka" /* Laka */]: { zywnosc: 4, praca: 1, handel: 1, drewno: 1, kamien: 0 },
  ["rownina" /* Rownina */]: { zywnosc: 2, praca: 1, handel: 1, drewno: 2, kamien: 1 },
  ["wzgorza" /* Wzgorza */]: { zywnosc: 1, praca: 2, handel: 0, drewno: 2, kamien: 2 },
  ["gory" /* Gory */]: { zywnosc: 0, praca: 0, handel: 0, drewno: 2, kamien: 5 },
  ["wybrzeze" /* Wybrzeze */]: { zywnosc: 3, praca: 2, handel: 2, drewno: 0, kamien: 0 },
  ["morze" /* Morze */]: { zywnosc: 2, praca: 0, handel: 2, drewno: 0, kamien: 0 },
  ["pustynia" /* Pustynia */]: { zywnosc: 0, praca: 0, handel: 1, drewno: 0, kamien: 0 }
};
var RIVER_MODIFIER = { zywnosc: 3, praca: 2, handel: 2, drewno: 0, kamien: 0 };
var FOREST_MODIFIER = { zywnosc: -1, praca: 0, handel: -1, drewno: 3, kamien: 0 };
var ZERO_YIELD = { zywnosc: 0, praca: 0, handel: 0, drewno: 0, kamien: 0 };
function tileYield(tile) {
  const base = TERRAIN_YIELDS[tile.terenBazowy] ?? ZERO_YIELD;
  let zywnosc = base.zywnosc;
  let praca = base.praca;
  let handel = base.handel;
  let drewno = base.drewno;
  let kamien = base.kamien;
  if (tile.nakladka === "las" /* Las */) {
    zywnosc += FOREST_MODIFIER.zywnosc;
    handel += FOREST_MODIFIER.handel;
    drewno += FOREST_MODIFIER.drewno;
  }
  if (tile.maRzeke) {
    zywnosc += RIVER_MODIFIER.zywnosc;
    praca += RIVER_MODIFIER.praca;
    handel += RIVER_MODIFIER.handel;
  }
  return {
    zywnosc: Math.max(0, zywnosc),
    praca: Math.max(0, praca),
    handel: Math.max(0, handel),
    drewno: Math.max(0, drewno),
    kamien: Math.max(0, kamien)
  };
}
function buildingValue(b, level, key) {
  return Math.floor(buildingEffectAtLevel(b.baza[key], level));
}
function cityYieldPerTurn(city, workedTiles, cityBuildings, params, ctx) {
  let zywnoscTerenu = 0;
  let pracaTerenu = 0;
  let handelTerenu = 0;
  for (const tile of workedTiles) {
    const y = tileYield(tile);
    zywnoscTerenu += y.zywnosc;
    pracaTerenu += y.praca;
    handelTerenu += y.handel;
  }
  let pracaBruttoTerenu;
  if (ctx.maMlyn) {
    pracaBruttoTerenu = pracaTerenu * params.budynekMlynMnoznikPracy + params.budynekMlynBonusPracy;
  } else {
    pracaBruttoTerenu = pracaTerenu;
  }
  if (ctx.maCegielnia) {
    pracaBruttoTerenu = pracaBruttoTerenu * (1 + params.budynekCegielniBonusPracy);
  }
  let handelBrutto;
  if (ctx.maTargowisko) {
    handelBrutto = handelTerenu * (1 + params.budynekTargowiskoBonusHandlu);
  } else {
    handelBrutto = handelTerenu;
  }
  let pracaBudynkow = 0;
  let pieniadzBudynkow = 0;
  let zywnoscBudynkow = 0;
  let naukaBudynkow = 0;
  let kulturaBudynkow = 0;
  let zadBudynkow = 0;
  for (const { record, level } of cityBuildings) {
    pracaBudynkow += buildingValue(record, level, "praca");
    pieniadzBudynkow += buildingValue(record, level, "pieniadz");
    zywnoscBudynkow += buildingValue(record, level, "zywnosc");
    naukaBudynkow += buildingValue(record, level, "nauka");
    kulturaBudynkow += buildingValue(record, level, "kultura");
    zadBudynkow += buildingValue(record, level, "zadowolenie");
  }
  let totalMnoznikProc = 0;
  for (const { record, level } of cityBuildings) {
    const kat = record.kategoria;
    if (!kat.includes("Wojsko") && !kat.includes("Obrona")) {
      totalMnoznikProc += buildingValue(record, level, "mnoznik");
    }
  }
  const mnoznikFactor = 1 + totalMnoznikProc / 100;
  const pracaBruttoLacznie = (pracaBruttoTerenu + pracaBudynkow) * mnoznikFactor;
  const strata = Math.min(ctx.strataFraction, params.korupcjaCap);
  const pracaNetto = pracaBruttoLacznie * (1 - strata);
  const handelNetto = handelBrutto * (1 - strata);
  const pctNauka = city.podzia\u0142Handlu.procentNauka / 100;
  const pctPieniadz = city.podzia\u0142Handlu.procentPieniadz / 100;
  const pctLuksus = city.podzia\u0142Handlu.procentLuksus / 100;
  const naukaZHandlu = Math.floor(handelNetto * pctNauka);
  const pieniadzZHandlu = Math.floor(
    handelNetto * pctPieniadz * ctx.mennicaMnoznik
  );
  const luksusZHandlu = Math.floor(handelNetto * pctLuksus);
  const naukaBonusFactor = ctx.maBiblioteka ? 1 + params.budynekBibliotekaBonusNauki : 1;
  const naukaLokalna = Math.floor((naukaZHandlu + naukaBudynkow) * naukaBonusFactor);
  let pieniadzTotal = pieniadzZHandlu + pieniadzBudynkow;
  for (const spec of city.specjalisci) {
    if (spec === "poborca") {
      pieniadzTotal += 2;
    }
  }
  const zywnoscBrutto = zywnoscTerenu + zywnoscBudynkow;
  const zywnoscZuzyta = city.ludnosc * params.zywnoscZuzytkaPopulacja + ctx.wojskoZuzycieZywnosci;
  const zywnoscNetto = zywnoscBrutto - zywnoscZuzyta;
  return {
    praca: Math.floor(pracaNetto),
    pieniadz: Math.floor(pieniadzTotal),
    zywnosc: Math.floor(zywnoscNetto),
    nauka: naukaLokalna,
    luksus: luksusZHandlu,
    kultura: Math.floor(kulturaBudynkow),
    zadowolenie: Math.floor(zadBudynkow),
    zywnoscBrutto: Math.floor(zywnoscBrutto),
    handelBrutto: Math.floor(handelBrutto),
    pracaTerenu: Math.floor(pracaBruttoTerenu),
    pracaBudynkow: Math.floor(pracaBudynkow)
  };
}
function populationGrowth(city, zywnoscNetto, params) {
  const { ludnosc, zdrowie, maSpichlerz, maAkwedukt, magazynZywnosci } = city;
  const healthModifier = Math.max(0, 1 + zdrowie * params.zdrowieModyfikatorWspolczynnik);
  const effectiveFlow = zywnoscNetto * healthModifier;
  const popCap = maAkwedukt ? Number.MAX_SAFE_INTEGER : params.akweduktProgLudnosci;
  let nowaLudnosc = ludnosc;
  let nowyMagazynZywnosci = magazynZywnosci;
  let wzrost = false;
  let ubytek = false;
  if (!maSpichlerz) {
    if (effectiveFlow < 0 && ludnosc > 1) {
      nowaLudnosc = ludnosc - 1;
      ubytek = true;
    }
    nowyMagazynZywnosci = 0;
    return { nowaLudnosc, nowyMagazynZywnosci, wzrost, ubytek };
  }
  nowyMagazynZywnosci = magazynZywnosci + Math.floor(effectiveFlow);
  if (nowyMagazynZywnosci < 0) {
    nowyMagazynZywnosci = 0;
    if (ludnosc > 1) {
      nowaLudnosc = ludnosc - 1;
      ubytek = true;
    }
    return { nowaLudnosc, nowyMagazynZywnosci, wzrost, ubytek };
  }
  const threshold = 10 + ludnosc * params.progWzrostuWspolczynnik;
  if (nowyMagazynZywnosci >= threshold && ludnosc < popCap) {
    nowaLudnosc = ludnosc + 1;
    wzrost = true;
    nowyMagazynZywnosci = Math.floor(nowyMagazynZywnosci * params.spichlerzZachowaniePoPrzroscie);
  }
  return { nowaLudnosc, nowyMagazynZywnosci, wzrost, ubytek };
}

// src/game/economy-upkeep.ts
function readNum(group, key, difficulty, fallback) {
  const row = group ? group[key] : void 0;
  const v = row ? row[difficulty] : void 0;
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}
var DEFAULT_STORAGE_PARAMS = {
  bazaZywnosc: 20,
  bazaSurowce: 10,
  mnoznikMagazynu: 5
};
function loadStorageParams(raw, difficulty = "normal") {
  const g = raw.globalne;
  return {
    bazaZywnosc: readNum(g, "magazyn_baza_zywnosc", difficulty, DEFAULT_STORAGE_PARAMS.bazaZywnosc),
    bazaSurowce: readNum(g, "magazyn_baza_surowce", difficulty, DEFAULT_STORAGE_PARAMS.bazaSurowce),
    mnoznikMagazynu: readNum(g, "magazyn_mnoznik_spichlerz", difficulty, DEFAULT_STORAGE_PARAMS.mnoznikMagazynu)
  };
}
function foodStorageCapacity(maSpichlerz, p) {
  return maSpichlerz ? p.bazaZywnosc * p.mnoznikMagazynu : p.bazaZywnosc;
}
function resourceStorageCapacityPerType(maMagazyn, p) {
  return maMagazyn ? p.bazaSurowce * p.mnoznikMagazynu : p.bazaSurowce;
}
function loadUpkeepParams(raw, difficulty = "normal") {
  const em = raw.ekonomia_miasta;
  const bu = raw.budynki;
  const g = raw.globalne;
  return {
    budynekUtrzymanieFlat: readNum(bu, "utrzymanie_budynek", difficulty, 1),
    jednostkaUtrzymanieStd: readNum(g, "utrzymanie_jednostka_standard", difficulty, 1),
    zywnoscJednostkaRuch: readNum(em, "zywnosc_jednostka_ruch", difficulty, 1),
    zywnoscJednostkaOboz: readNum(em, "zywnosc_jednostka_oboz", difficulty, 0.5)
  };
}
function buildingUpkeep(building, level, flatOverride) {
  if (typeof flatOverride === "number" && Number.isFinite(flatOverride)) {
    return flatOverride;
  }
  const lvl = level >= 1 ? level : 1;
  const base = Number.isFinite(building.utrzymanie) ? building.utrzymanie : 0;
  return Math.floor(buildingEffectAtLevel(base, lvl));
}
function totalBuildingUpkeep(buildings, flatOverride) {
  let sum = 0;
  for (const b of buildings) {
    sum += buildingUpkeep(b.record, b.level, flatOverride);
  }
  return sum;
}
var DEFAULT_UNIT_UPKEEP_BY_CATEGORY = {
  osadnik: 1,
  robotnik: 1,
  zwiadowca: 1,
  procarz: 1,
  oszczepnik: 1,
  lucznik: 1,
  wlocznik: 2,
  miecznik: 2,
  falanga: 2,
  legionista: 2,
  maczuga: 2,
  topor: 2,
  konnica: 3,
  rydwan: 3,
  galera: 3,
  super: 0,
  domyslny: 1
};
function unitUpkeep(unit, table, standardUpkeep) {
  const byType = table[unit.typeId];
  if (typeof byType === "number" && Number.isFinite(byType)) return byType;
  const byCat = DEFAULT_UNIT_UPKEEP_BY_CATEGORY[unit.category];
  if (typeof byCat === "number" && Number.isFinite(byCat)) return byCat;
  return Number.isFinite(standardUpkeep) ? standardUpkeep : 0;
}
function totalUnitUpkeep(units, table, standardUpkeep) {
  let sum = 0;
  for (const u of units) {
    sum += unitUpkeep(u, table, standardUpkeep);
  }
  return sum;
}
function buildUnitUpkeepTable(rows) {
  const out = {};
  for (const row of rows) {
    const name = row["Jednostka"];
    if (typeof name !== "string" || name.length === 0) continue;
    let upkeep;
    const direct = row["Utrzymanie (Pieniadz/ture)"];
    if (typeof direct === "number" && Number.isFinite(direct)) {
      upkeep = direct;
    } else {
      for (const key of Object.keys(row)) {
        if (key.indexOf("Utrzymanie") === 0) {
          const v = row[key];
          if (typeof v === "number" && Number.isFinite(v)) {
            upkeep = v;
            break;
          }
        }
      }
    }
    if (upkeep !== void 0) out[name] = upkeep;
  }
  return out;
}
function militaryFoodConsumption(units, p) {
  let sum = 0;
  for (const u of units) {
    sum += u.camping ? p.zywnoscJednostkaOboz : p.zywnoscJednostkaRuch;
  }
  return sum;
}
function upkeepBalance(income, buildings, units, unitUpkeepTbl, p) {
  const utrzymanieBudynki = totalBuildingUpkeep(buildings, p.budynekUtrzymanieFlat);
  const utrzymanieJednostki = totalUnitUpkeep(units, unitUpkeepTbl, p.jednostkaUtrzymanieStd);
  const utrzymanieRazem = utrzymanieBudynki + utrzymanieJednostki;
  const inc = Number.isFinite(income) ? income : 0;
  const saldo = inc - utrzymanieRazem;
  return {
    utrzymanieBudynki,
    utrzymanieJednostki,
    utrzymanieRazem,
    saldo,
    deficyt: saldo < 0
  };
}

// src/game/converters.ts
function loadThroughput(raw, paramKey, difficulty, fallback) {
  const bu = raw.budynki ?? {};
  const row = bu[paramKey];
  const v = row ? row[difficulty] : void 0;
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}
var DEFAULT_CONVERTER_RECIPES = [
  { id: "tartak", inputs: { drewno: 1 }, output: "deski", outputAmount: 1, throughputParamKey: "budynek_tartak_przepustowosc", throughputFallback: 2 },
  { id: "mielerz", inputs: { drewno: 1 }, output: "paliwo", outputAmount: 1, throughputParamKey: "budynek_mielerz_przepustowosc", throughputFallback: 2 },
  { id: "cegielnia", inputs: { glina: 1, paliwo: 1 }, output: "cegla", outputAmount: 1, throughputParamKey: "budynek_cegielnia_przepustowosc", throughputFallback: 2 },
  { id: "huta", inputs: { ruda: 1, paliwo: 1 }, output: "braz", outputAmount: 1, throughputParamKey: "budynek_huta_przepustowosc", throughputFallback: 1 },
  { id: "garncarnia", inputs: { glina: 1, paliwo: 1 }, output: "ceramika", outputAmount: 1, throughputParamKey: "budynek_garncarnia_przepustowosc", throughputFallback: 1 }
];
function runConverter(recipe, stores, throughput, outputCapacity) {
  const have = (k) => {
    const v = stores[k];
    return typeof v === "number" && Number.isFinite(v) ? v : 0;
  };
  const tput = Number.isFinite(throughput) && throughput > 0 ? Math.floor(throughput) : 0;
  let limitWejscia = Infinity;
  for (const k of Object.keys(recipe.inputs)) {
    const perCykl = recipe.inputs[k];
    if (perCykl <= 0) continue;
    limitWejscia = Math.min(limitWejscia, Math.floor(have(k) / perCykl));
  }
  if (!Number.isFinite(limitWejscia)) limitWejscia = 0;
  const wolne = Math.max(0, outputCapacity - have(recipe.output));
  const limitWyjscia = recipe.outputAmount > 0 ? Math.floor(wolne / recipe.outputAmount) : 0;
  const cykle = Math.max(0, Math.min(tput, limitWejscia, limitWyjscia));
  const nowe = { ...stores };
  const consumed = {};
  if (cykle > 0) {
    for (const k of Object.keys(recipe.inputs)) {
      const used = recipe.inputs[k] * cykle;
      nowe[k] = have(k) - used;
      consumed[k] = used;
    }
    nowe[recipe.output] = have(recipe.output) + recipe.outputAmount * cykle;
  }
  let reason = "ok";
  if (cykle === 0) {
    if (tput === 0) reason = "zero-przepustowosci";
    else if (limitWejscia === 0) reason = "brak-wejscia";
    else if (limitWyjscia === 0) reason = "pelny-magazyn";
    else reason = "brak-wejscia";
  }
  return { produced: cykle * recipe.outputAmount, cykle, consumed, stores: nowe, reason };
}
function runConverters(recipes, stores, throughputs, capacityOf) {
  let cur = { ...stores };
  const perBuilding = {};
  for (const recipe of recipes) {
    const tput = Object.prototype.hasOwnProperty.call(throughputs, recipe.id) ? throughputs[recipe.id] : recipe.throughputFallback;
    const res = runConverter(recipe, cur, tput, capacityOf(recipe.output));
    cur = res.stores;
    perBuilding[recipe.id] = res;
  }
  return { stores: cur, perBuilding };
}

// src/game/wealth.ts
var FALLBACK_WEALTH_PARAMS = {
  capNaEpoke: 10,
  progNaPoziom: 4.5,
  mnoznikNaPoziom: 0.15,
  utrzymanieBaza: 0.2,
  utrzymaniePrzyCap: 0.4,
  zachowaniePoAwansie: 0.5,
  zadowolenieNa10pkt: 1,
  karaZero: -2
};
function loadWealthParams(raw, difficulty = "normal") {
  const g = raw.wealth ?? {};
  const read = (key, fallback) => {
    const row = g[key];
    const v = row ? row[difficulty] : void 0;
    return typeof v === "number" && Number.isFinite(v) ? v : fallback;
  };
  return {
    capNaEpoke: read("wealth_cap_na_epoke", FALLBACK_WEALTH_PARAMS.capNaEpoke),
    progNaPoziom: read("wealth_prog_na_poziom", FALLBACK_WEALTH_PARAMS.progNaPoziom),
    mnoznikNaPoziom: read("wealth_mnoznik_na_poziom", FALLBACK_WEALTH_PARAMS.mnoznikNaPoziom),
    utrzymanieBaza: read("wealth_utrzymanie_baza", FALLBACK_WEALTH_PARAMS.utrzymanieBaza),
    utrzymaniePrzyCap: read("wealth_utrzymanie_przy_cap", FALLBACK_WEALTH_PARAMS.utrzymaniePrzyCap),
    zachowaniePoAwansie: read("wealth_zachowanie_po_awansie", FALLBACK_WEALTH_PARAMS.zachowaniePoAwansie),
    zadowolenieNa10pkt: read("wealth_zadowolenie_na_10pkt", FALLBACK_WEALTH_PARAMS.zadowolenieNa10pkt),
    karaZero: read("wealth_kara_zero", FALLBACK_WEALTH_PARAMS.karaZero)
  };
}
function wealthCap(epoka, p) {
  return Math.max(0, Math.floor(epoka)) * p.capNaEpoke;
}
function wealthMnoznik(poziom, p) {
  return Math.max(1, 1 + (poziom - 1) * p.mnoznikNaPoziom);
}
function wealthZadowolenie(poziom, p) {
  if (poziom <= 0) return p.karaZero;
  return Math.floor(poziom / 10) * p.zadowolenieNa10pkt;
}
function wealthRownowaga(poziom, epoka, p) {
  const cap = wealthCap(epoka, p);
  if (cap <= 0) return p.utrzymaniePrzyCap;
  const frac = Math.min(1, Math.max(0, poziom / cap));
  return p.utrzymanieBaza + frac * (p.utrzymaniePrzyCap - p.utrzymanieBaza);
}
function wealthProg(poziom, epoka, p) {
  return p.progNaPoziom * (poziom + 1) * Math.max(1, Math.floor(epoka));
}
function advanceWealth(state, spoleczMoney, miastoMoney, epoka, p) {
  const cap = wealthCap(epoka, p);
  let poziom = Math.min(cap, Math.max(0, Math.floor(state.poziom)));
  let pula = Math.max(0, Number.isFinite(state.pula) ? state.pula : 0);
  const spol = Number.isFinite(spoleczMoney) ? Math.max(0, spoleczMoney) : 0;
  const M = Number.isFinite(miastoMoney) ? Math.max(0, miastoMoney) : 0;
  const decay = wealthRownowaga(poziom, epoka, p) * M;
  pula += spol - decay;
  let spadek = 0;
  if (pula < 0) {
    pula = 0;
    if (poziom > 0) {
      poziom -= 1;
      spadek = 1;
    }
  }
  let awans = 0;
  while (poziom < cap) {
    const prog = wealthProg(poziom, epoka, p);
    if (pula >= prog) {
      pula -= prog;
      poziom += 1;
      pula = Math.floor(pula * p.zachowaniePoAwansie);
      awans += 1;
    } else {
      break;
    }
  }
  return {
    poziom,
    pula,
    mnoznik: wealthMnoznik(poziom, p),
    zadowolenie: wealthZadowolenie(poziom, p),
    awans,
    spadek
  };
}
function freshWealthState() {
  return { poziom: 1, pula: 0 };
}

// src/game/turn-economy.ts
function buildEconParams(data, difficulty = "normal") {
  const raw = data.econParams;
  const em = raw.ekonomia_miasta ?? {};
  const bu = raw.budynki ?? {};
  const d = difficulty;
  const num = (group, key, fallback) => {
    const row = group[key];
    const v = row ? row[d] : void 0;
    return typeof v === "number" && Number.isFinite(v) ? v : fallback;
  };
  return {
    progWzrostuWspolczynnik: num(em, "pr\xF3g_wzrostu_wspolczynnik", 8),
    spichlerzZachowaniePoPrzroscie: num(em, "spichlerz_zachowanie_po_wzroscie", 0.5),
    akweduktProgLudnosci: num(em, "akwedukt_prog_ludnosci", 6),
    zywnoscZuzytkaPopulacja: num(em, "zywnosc_zuzytka_populacja", 1),
    zdrowieModyfikatorWspolczynnik: num(em, "zdrowie_modyfikator_wspolczynnik", 0.05),
    korupcjaWspolczynnikDystansu: num(em, "korupcja_wspolczynnik_dystansu", 2),
    korupcjaWspolczynnikMiast: num(em, "korupcja_wspolczynnik_miast", 1),
    korupcjaCap: num(em, "korupcja_cap", 50) / 100,
    budynekMlynMnoznikPracy: num(bu, "budynek_mlyn_mnoznik_pracy", 2),
    budynekMlynBonusPracy: num(bu, "budynek_mlyn_bonus_pracy", 2),
    budynekCegielniBonusPracy: num(bu, "budynek_cegielnia_bonus_pracy", 0.25),
    budynekTargowiskoBonusHandlu: num(bu, "budynek_targowisko_bonus_handlu", 0.5),
    budynekBibliotekaBonusNauki: num(bu, "budynek_biblioteka_bonus_nauki", 0.5),
    budynekMennicaMnoznik: num(bu, "budynek_mennica_mnoznik", 1),
    suwaakHandelNaukaDefault: num(em, "suwak_handel_nauka_domyslnie", 60),
    suwaakHandelPieniadz: num(em, "suwak_handel_pieniadz_domyslnie", 30),
    suwaakHandelLuksus: num(em, "suwak_handel_luksus_domyslnie", 10),
    suwaakPracaBudynki: num(em, "suwak_praca_budynki_domyslnie", 70),
    suwaakPracaTeren: num(em, "suwak_praca_teren_domyslnie", 30)
  };
}
function loadHealthParams(raw, difficulty) {
  const sp = raw;
  const zd = sp && typeof sp === "object" && sp["zdrowie"] ? sp["zdrowie"] : {};
  const rd = (key, fallback) => {
    const row = zd[key];
    if (!row || typeof row !== "object") return fallback;
    const v = row[difficulty];
    return typeof v === "number" && Number.isFinite(v) ? v : fallback;
  };
  return {
    rzeka: rd("zdrowie_rzeka", 2),
    akwedukt: rd("zdrowie_akwedukt", 4),
    studnia: rd("zdrowie_studnia", 2),
    targowisko: rd("zdrowie_targowisko", 2),
    ceramika: rd("zdrowie_ceramika", 1),
    maleMiastoBonus: rd("zdrowie_male_miasto_bonus", 1),
    karaZagoszczenie: rd("zdrowie_kara_zag\u0119szczenie", -1),
    progZagoszczenia: rd("zdrowie_prog_zag\u0119szczenia", 4),
    karaBagno: rd("zdrowie_kara_bagno", -1),
    karaDzungla: rd("zdrowie_kara_dzungla", -1),
    karaBrakWody: rd("zdrowie_kara_brak_wody", -2)
  };
}
function computeCityHealth(ludnosc, tiles, builtIds, hp) {
  let z = 0;
  let maRzeke = false;
  for (const t of tiles) {
    if (t.maRzeke) {
      maRzeke = true;
      break;
    }
  }
  const maStudnie = builtIds.includes("studnia");
  const maTargowisko = builtIds.includes("targowisko");
  const maAkwedukt = builtIds.includes("akwedukt");
  const maCeramike = builtIds.includes("ceramika");
  if (maRzeke) z += hp.rzeka;
  if (maAkwedukt) z += hp.akwedukt;
  if (maStudnie) z += hp.studnia;
  if (maTargowisko) z += hp.targowisko;
  if (maCeramike) z += hp.ceramika;
  if (ludnosc <= hp.progZagoszczenia) z += hp.maleMiastoBonus;
  if (ludnosc > hp.progZagoszczenia) {
    z += hp.karaZagoszczenie * (ludnosc - hp.progZagoszczenia);
  }
  if (!maRzeke && !maStudnie && !maAkwedukt) z += hp.karaBrakWody;
  return Math.round(z);
}
var HEX_NEIGHBORS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, -1],
  [-1, 1]
];
function hexToWorkedTile(hex) {
  return {
    terenBazowy: hex.terenBazowy,
    nakladka: hex.nakladka ?? "brak" /* Brak */,
    maRzeke: !!(hex.rzeka && hex.rzeka.obecna)
  };
}
function workedTilesForCity(city, map) {
  const tiles = [];
  const centre = map.hexes[`${city.q},${city.r}`];
  if (centre) tiles.push(hexToWorkedTile(centre));
  for (const [dq, dr] of HEX_NEIGHBORS) {
    const h = map.hexes[`${city.q + dq},${city.r + dr}`];
    if (h) tiles.push(hexToWorkedTile(h));
  }
  return tiles;
}
function toEconomyCity(city, params, isCapital, zdrowie = 0) {
  return {
    id: city.id,
    ludnosc: city.population,
    zdrowie,
    czyStolica: isCapital,
    maSpichlerz: false,
    maAkwedukt: false,
    magazynZywnosci: city.magazynZywnosci ?? 0,
    specjalisci: [],
    kolejkaProdukcji: [],
    podzia\u0142Handlu: {
      procentNauka: params.suwaakHandelNaukaDefault,
      procentPieniadz: params.suwaakHandelPieniadz,
      procentLuksus: params.suwaakHandelLuksus
    },
    podzia\u0142Pracy: {
      procentBudynki: params.suwaakPracaBudynki
    }
  };
}
function getCityFood(city) {
  return city.magazynZywnosci ?? 0;
}
function advanceCityEconomy(cities, map, data, difficulty = "normal", econUnits = [], growthMultByCity = /* @__PURE__ */ new Map(), builtByCity = /* @__PURE__ */ new Map(), playerEra = 1) {
  const params = buildEconParams(data, difficulty);
  const noBuildings = [];
  const rawEconParams = data.econParams;
  const upkeepParams = loadUpkeepParams(rawEconParams, difficulty);
  const storageParams = loadStorageParams(rawEconParams, difficulty);
  const unitUpkeepTbl = buildUnitUpkeepTable(data.units);
  const rawForConverters = data.econParams;
  const converterThroughputs = {};
  for (const recipe of DEFAULT_CONVERTER_RECIPES) {
    converterThroughputs[recipe.id] = loadThroughput(
      rawForConverters,
      recipe.throughputParamKey,
      difficulty,
      recipe.throughputFallback
    );
  }
  const healthParams = loadHealthParams(
    data.societyParams,
    difficulty
  );
  const wealthParams = loadWealthParams(
    data.econParams,
    difficulty
  );
  const capitalSeen = /* @__PURE__ */ new Set();
  const result = {
    perCity: [],
    cities: 0,
    totalPraca: 0,
    totalPieniadz: 0,
    totalNauka: 0,
    totalLuksus: 0,
    totalKultura: 0,
    totalZywnosc: 0,
    totalPracaPula: 0,
    growth: 0,
    starved: 0,
    upkeepByOwner: /* @__PURE__ */ new Map()
  };
  const incomeByOwner = /* @__PURE__ */ new Map();
  for (const city of cities) {
    const isCapital = !capitalSeen.has(city.ownerId);
    capitalSeen.add(city.ownerId);
    const worked = workedTilesForCity(city, map);
    const builtIds = builtByCity.get(city.id) ?? [];
    const zdrowie = computeCityHealth(city.population, worked, builtIds, healthParams);
    const econCity = toEconomyCity(city, params, isCapital, zdrowie);
    const ownerUnits = econUnits.filter((u) => u.ownerId === city.ownerId);
    const milFood = militaryFoodConsumption(ownerUnits, upkeepParams);
    const ctx = {
      wojskoZuzycieZywnosci: milFood,
      // real military food consumption (economy-upkeep s.6.3)
      strataFraction: 0,
      // no distance-corruption tracking yet
      maMlyn: false,
      maCegielnia: false,
      maTargowisko: false,
      maBiblioteka: false,
      maMennica: false,
      mennicaMnoznik: 1
    };
    const yld = cityYieldPerTurn(econCity, worked, noBuildings, params, ctx);
    const prevWealth = city.wealthState ?? freshWealthState();
    const wt = advanceWealth(
      prevWealth,
      yld.luksus,
      // spoleczMoney = strumien Luksus
      yld.pieniadz,
      // miastoMoney  = pieniadz brutto tej tury
      playerEra,
      wealthParams
    );
    city.wealthState = { poziom: wt.poziom, pula: wt.pula };
    const pieniadzPoWealth = Math.floor(yld.pieniadz * wt.mnoznik);
    const udzialBudynki = params.suwaakPracaBudynki / 100;
    const { doBudynkow, doPuli } = splitPraca(yld.praca, udzialBudynki);
    const isOblegane = city.oblegane === true;
    let magazynPoTurze;
    let obleganyGlod = false;
    if (isOblegane) {
      const garnizon = city.garnizon != null && city.garnizon > 0 ? city.garnizon : 0;
      const zuzycie = city.population + garnizon;
      const magazynPrzed = getCityFood(city);
      magazynPoTurze = Math.max(0, magazynPrzed - zuzycie);
      obleganyGlod = magazynPoTurze <= 0;
      city.magazynZywnosci = magazynPoTurze;
      const tick2 = {
        cityId: city.id,
        ownerId: city.ownerId,
        praca: yld.praca,
        pieniadz: pieniadzPoWealth,
        pieniadzBrutto: yld.pieniadz,
        zywnoscNetto: 0,
        // brak dochodu podczas oblezenia
        nauka: yld.nauka,
        luksus: yld.luksus,
        kultura: yld.kultura,
        ludnoscPrzed: city.population,
        ludnoscPo: city.population,
        // populacja nie zmienia sie podczas oblezenia
        wzrost: false,
        ubytek: false,
        zdrowie,
        doBudynkow,
        doPuli,
        wealthMnoznik: wt.mnoznik,
        wealthZadowolenie: wt.zadowolenie,
        oblegany: true,
        obleganyGlod,
        magazynPoTurze
      };
      result.perCity.push(tick2);
      incomeByOwner.set(city.ownerId, (incomeByOwner.get(city.ownerId) ?? 0) + pieniadzPoWealth);
      result.cities += 1;
      result.totalPraca += yld.praca;
      result.totalPieniadz += pieniadzPoWealth;
      result.totalNauka += yld.nauka;
      result.totalLuksus += yld.luksus;
      result.totalKultura += yld.kultura;
      result.totalZywnosc += 0;
      result.totalPracaPula += doPuli;
      continue;
    }
    const growthMult = growthMultByCity.get(city.id) ?? 1;
    const zywnoscDlaWzrostu = growthMult !== 1 ? yld.zywnosc * growthMult : yld.zywnosc;
    const grow = populationGrowth(econCity, zywnoscDlaWzrostu, params);
    const before = city.population;
    city.population = grow.nowaLudnosc;
    const maSpichlerz = false;
    const foodCap = foodStorageCapacity(maSpichlerz, storageParams);
    city.magazynZywnosci = Math.min(grow.nowyMagazynZywnosci, foodCap);
    magazynPoTurze = city.magazynZywnosci;
    incomeByOwner.set(city.ownerId, (incomeByOwner.get(city.ownerId) ?? 0) + pieniadzPoWealth);
    const maMagazyn = false;
    const resCap = resourceStorageCapacityPerType(maMagazyn, storageParams);
    const citySurowce = city.surowce ?? {};
    if (Object.keys(citySurowce).length > 0) {
      const convResult = runConverters(
        DEFAULT_CONVERTER_RECIPES,
        citySurowce,
        converterThroughputs,
        () => resCap
      );
      city.surowce = convResult.stores;
    }
    const tick = {
      cityId: city.id,
      ownerId: city.ownerId,
      praca: yld.praca,
      pieniadz: pieniadzPoWealth,
      pieniadzBrutto: yld.pieniadz,
      zywnoscNetto: yld.zywnosc,
      nauka: yld.nauka,
      luksus: yld.luksus,
      kultura: yld.kultura,
      ludnoscPrzed: before,
      ludnoscPo: grow.nowaLudnosc,
      wzrost: grow.wzrost,
      ubytek: grow.ubytek,
      zdrowie,
      doBudynkow,
      doPuli,
      wealthMnoznik: wt.mnoznik,
      wealthZadowolenie: wt.zadowolenie,
      oblegany: false,
      obleganyGlod: false,
      magazynPoTurze
    };
    result.perCity.push(tick);
    result.cities += 1;
    result.totalPraca += yld.praca;
    result.totalPieniadz += pieniadzPoWealth;
    result.totalNauka += yld.nauka;
    result.totalLuksus += yld.luksus;
    result.totalKultura += yld.kultura;
    result.totalZywnosc += yld.zywnosc;
    result.totalPracaPula += doPuli;
    if (grow.wzrost) result.growth += 1;
    if (grow.ubytek) result.starved += 1;
  }
  const ownerIds = /* @__PURE__ */ new Set([
    ...cities.map((c) => c.ownerId),
    ...econUnits.map((u) => u.ownerId)
  ]);
  for (const oid of ownerIds) {
    const income = incomeByOwner.get(oid) ?? 0;
    const ounits = econUnits.filter((u) => u.ownerId === oid);
    const balance = upkeepBalance(income, [], ounits, unitUpkeepTbl, upkeepParams);
    result.upkeepByOwner.set(oid, balance);
  }
  return result;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  advanceCityEconomy
});
