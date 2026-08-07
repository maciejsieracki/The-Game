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

// tools/.owner-economy-entry.ts
var owner_economy_entry_exports = {};
__export(owner_economy_entry_exports, {
  advanceCityEconomy: () => advanceCityEconomy,
  canFoundCity: () => canFoundCity,
  foundCityAt: () => foundCityAt,
  freshWealthState: () => freshWealthState,
  generateMap: () => generateMap,
  sumEconomyForOwner: () => sumEconomyForOwner,
  sumEconomyForPlayerCities: () => sumEconomyForPlayerCities
});
module.exports = __toCommonJS(owner_economy_entry_exports);

// src/game/r-stawki-strojenie.ts
var R_STAWKI_KOSZT_MULT = 2;
var R_STAWKI_FALA2_MULT = 2;
var R_STAWKI_FALA1_FALA2_MULT = R_STAWKI_KOSZT_MULT * R_STAWKI_FALA2_MULT;

// data/map-gen-params.json
var map_gen_params_default = {
  _meta: {
    opis: "Panel-A export \u2014 generator E2 + mg\u0142a. Kod czyta po P3 / handoff Integratora.",
    panel: "panele-sterowania/Panel-A.xlsx",
    export: "panele-sterowania/export-a.py"
  },
  mgla: {
    default_sight_jednostki: {
      wartosc: 3,
      opis: "Domy\u015Blny promie\u0144 wzroku jednostki"
    }
  },
  gestosc: {
    surowce_mult: {
      low: 0.6,
      medium: 1,
      high: 1.4
    },
    baseline_rarity_mult: 1.35,
    rzeki_max_mala_mapa: {
      low: 20,
      medium: 50,
      high: 120
    },
    river_scale: {
      mala: 1,
      srednia: 1.35,
      duza: 1.7,
      ogromna: 2.1,
      super: 2.6
    },
    desert_noise_threshold: {
      low: 0.68,
      medium: 0.63,
      high: 0.58
    },
    forest_noise_threshold: {
      low: 0.65,
      medium: 0.58,
      high: 0.5
    },
    mountain_noise_threshold: {
      low: 0.8,
      medium: 0.68,
      high: 0.52
    },
    highland_noise_threshold: {
      low: 0.66,
      medium: 0.5,
      high: 0.38
    },
    relief_land_fraction: {
      low: { mountain: 0.06, highland: 0.126 },
      medium: { mountain: 0.1, highland: 0.15 },
      high: { mountain: 0.24, highland: 0.324 }
    },
    relief_overflow_cap_frac: {
      _opis: "Sufit g\u0119sto\u015Bci reliefu (G\xF3ry+Wzg\xF3rza) per kom\xF3rka fair-play, egzekwowany PRZY ZASIEWANIU i PO ROZRO\u015ACIE pasm (RELIEF_OVERFLOW_CAP_MULT w gen-helpers.ts). Maciej 2026-07-29: medium=10% G\xF3ry + 15% Wzg\xF3rza w kom\xF3rce 15\xD715; Ma\u0142o/Du\u017Co przeskalowane wzgl\u0119dem poprzedniego stosunku tier\xF3w.",
      low: { mountain: 0.09, highland: 0.132 },
      medium: { mountain: 0.1, highland: 0.15 },
      high: { mountain: 0.24, highland: 0.318 }
    },
    pasma_gorskie: {
      _opis: "Zadanie HILLS Q1/Q2 (2026-07-20): skupiska g\xF3r/wzg\xF3rz (seed-and-grow), spi\u0119te z tierem suwaka Relief (mountain_noise_threshold/highland_noise_threshold). Bez nowego suwaka UI. ZADANIE 3 (2026-07-20): d\u0142u\u017Csze/w\u0119\u017Csze \u0142a\u0144cuchy (kordyliery) zamiast okr\u0105g\u0142ych plam \u2014 dlugosc_min/max w g\xF3r\u0119, max_pasm_na_mase w d\xF3\u0142 (mniej ale d\u0142u\u017Cszych pasm), nowy obrzeze_szansa < 1 zmniejsza rozlewanie foothills na boki.",
      low: { hexy_na_pasmo: 320, max_pasm_na_mase: 2, dlugosc_min: 9, dlugosc_max: 11, min_masa_hexow: 40, obrzeze_szansa: 0.3 },
      medium: { hexy_na_pasmo: 240, max_pasm_na_mase: 3, dlugosc_min: 11, dlugosc_max: 14, min_masa_hexow: 30, obrzeze_szansa: 0.35 },
      high: { hexy_na_pasmo: 170, max_pasm_na_mase: 5, dlugosc_min: 13, dlugosc_max: 17, min_masa_hexow: 24, obrzeze_szansa: 0.4 }
    }
  },
  mapa_skala: {
    _opis: "Trzeciorz\u0119dny fallback (u\u017Cywany tylko gdy skala_mapy w e-start-params.json nie ma wpisu). Sync z Panel-E 2026-07-28 (typy_cywilizacji per rozmiar mapy).",
    aktywne_typy: {
      mala: 4,
      srednia: 5,
      duza: 6,
      ogromna: 12,
      super: 15
    },
    domyslni_rywale: {
      mala: 12,
      srednia: 14,
      duza: 18,
      ogromna: 22,
      super: 30
    }
  },
  generator: {
    default_width: 36,
    default_height: 28,
    rozmiar_dims: {
      malenki: [76, 52],
      maly: [108, 74],
      standardowy: [168, 120],
      duzy: [240, 168],
      ogromny: [336, 238],
      superogromny: [672, 476]
    }
  },
  deposit_rules: {
    miedz: { rarity: 0.1 },
    zelazo: { rarity: 0.08 },
    glina: {
      rarity: 0.3,
      _opis: "Maciej 2026-07-29: \xD73 g\u0119sto\u015Bci z\u0142\xF3\u017C gliny vs poprzedni standard (0.10\u21920.30). Szansa spawnu na kwal. heks = rarity \xD7 baseline_rarity_mult (1.35) \xD7 surowce_mult tieru (Ma\u0142o 0.6 / Normalnie 1.0 / Du\u017Co 1.4) \u2014 proporcje tier\xF3w bez zmian."
    },
    konie: { rarity: 0.025 },
    wegiel: { rarity: 0, _opis: "SUR-WEGIEL=B: ukryty \u2014 brak spawnu na mapie (dyplomacja bez zmian)" },
    sol: { rarity: 0.12 },
    zloto: { rarity: 0.03 }
  },
  metal_deposit_min_era: {
    miedz: 2,
    zelazo: 3,
    wegiel: 8
  }
};

// src/data/map-gen-params-loader.ts
var FALLBACK_ROZMIAR = {
  malenki: [76, 52],
  maly: [108, 74],
  standardowy: [168, 120],
  duzy: [240, 168],
  ogromny: [336, 238],
  superogromny: [672, 476]
};
var FALLBACK_RESOURCE_MULT = { low: 0.6, medium: 1, high: 1.4 };
var FALLBACK_BASELINE_RARITY = 1.35;
var FALLBACK_RIVERS = { low: 20, medium: 50, high: 120 };
var FALLBACK_RIVER_SCALE = {
  mala: 1,
  srednia: 1.35,
  duza: 1.7,
  ogromna: 2.1,
  super: 2.6
};
var FALLBACK_DESERT = { low: 0.68, medium: 0.63, high: 0.58 };
var FALLBACK_FOREST = { low: 0.65, medium: 0.58, high: 0.5 };
var FALLBACK_MOUNTAIN = { low: 0.8, medium: 0.68, high: 0.52 };
var FALLBACK_HIGHLAND = { low: 0.66, medium: 0.5, high: 0.38 };
var FALLBACK_RELIEF_OVERFLOW_CAP = {
  low: { mountain: 0.09, highland: 0.132 },
  medium: { mountain: 0.1, highland: 0.15 },
  high: { mountain: 0.24, highland: 0.318 }
};
var FALLBACK_MOUNTAIN_RANGE = {
  low: { hexyNaPasmo: 320, maxPasmNaMase: 2, dlugoscMin: 9, dlugoscMax: 15, minMasaHexow: 40, obrzezeSzansa: 0.3 },
  medium: { hexyNaPasmo: 240, maxPasmNaMase: 3, dlugoscMin: 11, dlugoscMax: 18, minMasaHexow: 30, obrzezeSzansa: 0.35 },
  high: { hexyNaPasmo: 170, maxPasmNaMase: 5, dlugoscMin: 13, dlugoscMax: 22, minMasaHexow: 24, obrzezeSzansa: 0.4 }
};
var FALLBACK_DEPOSIT_RARITY = {
  miedz: 0.1,
  zelazo: 0.08,
  glina: 0.3,
  konie: 0.1,
  wegiel: 0,
  owce: 0.08,
  bydlo: 0.07,
  sol: 0.12,
  // Maciej 2026-07-25: złoto — surowiec dostępowy Mennicy, celowo RZADSZY niż miedź/żelazo
  // (patrz gen-helpers.ts DEPOSIT_RULES komentarz przy id='zloto').
  zloto: 0.03
};
function tierKey(t) {
  return t;
}
function mapGenResourceMult(tier) {
  const m = map_gen_params_default.gestosc?.surowce_mult;
  return m?.[tierKey(tier)] ?? FALLBACK_RESOURCE_MULT[tier];
}
function mapGenResourceBaselineRarity() {
  const v = map_gen_params_default.gestosc?.baseline_rarity_mult;
  return typeof v === "number" && v > 0 ? v : FALLBACK_BASELINE_RARITY;
}
function mapGenMaxRiversBase(tier) {
  const g = map_gen_params_default.gestosc?.rzeki_max_mala_mapa;
  const k = tierKey(tier);
  if (g && typeof g[k] === "number") return g[k];
  return FALLBACK_RIVERS[tier];
}
function mapGenRiverScale(size) {
  const rs = map_gen_params_default.gestosc?.river_scale;
  const lut = {
    mala: "mala",
    srednia: "srednia",
    duza: "duza",
    ogromna: "ogromna",
    super: "super"
  };
  const v = rs?.[lut[size]];
  return typeof v === "number" && v > 0 ? v : FALLBACK_RIVER_SCALE[size];
}
function mapGenDesertThreshold(tier) {
  const d = map_gen_params_default.gestosc?.desert_noise_threshold;
  const k = tierKey(tier);
  if (d && typeof d[k] === "number") return d[k];
  return FALLBACK_DESERT[tier];
}
function mapGenForestThreshold(tier) {
  const f = map_gen_params_default.gestosc?.forest_noise_threshold;
  const k = tierKey(tier);
  if (f && typeof f[k] === "number") return f[k];
  return FALLBACK_FOREST[tier];
}
function mapGenMountainThreshold(tier) {
  const m = map_gen_params_default.gestosc?.mountain_noise_threshold;
  const k = tierKey(tier);
  if (m && typeof m[k] === "number") return m[k];
  return FALLBACK_MOUNTAIN[tier];
}
function mapGenHighlandThreshold(tier) {
  const h = map_gen_params_default.gestosc?.highland_noise_threshold;
  const k = tierKey(tier);
  if (h && typeof h[k] === "number") return h[k];
  return FALLBACK_HIGHLAND[tier];
}
function mapGenReliefOverflowCapFrac(tier) {
  const fb = FALLBACK_RELIEF_OVERFLOW_CAP[tier];
  const src = map_gen_params_default.gestosc?.relief_overflow_cap_frac;
  const row = src?.[tierKey(tier)];
  if (!row) return { ...fb };
  const mountain = typeof row.mountain === "number" && row.mountain > 0 ? row.mountain : fb.mountain;
  const highland = typeof row.highland === "number" && row.highland > 0 ? row.highland : fb.highland;
  return { mountain, highland };
}
function mapGenMountainRangeParams(tier) {
  const fb = FALLBACK_MOUNTAIN_RANGE[tier];
  const src = map_gen_params_default.gestosc?.pasma_gorskie;
  const row = src?.[tierKey(tier)];
  if (!row) return { ...fb };
  const dlugoscMin = typeof row.dlugosc_min === "number" && row.dlugosc_min > 0 ? row.dlugosc_min : fb.dlugoscMin;
  return {
    hexyNaPasmo: typeof row.hexy_na_pasmo === "number" && row.hexy_na_pasmo > 0 ? row.hexy_na_pasmo : fb.hexyNaPasmo,
    maxPasmNaMase: typeof row.max_pasm_na_mase === "number" && row.max_pasm_na_mase >= 0 ? row.max_pasm_na_mase : fb.maxPasmNaMase,
    dlugoscMin,
    dlugoscMax: typeof row.dlugosc_max === "number" && row.dlugosc_max >= dlugoscMin ? row.dlugosc_max : Math.max(fb.dlugoscMax, dlugoscMin),
    minMasaHexow: typeof row.min_masa_hexow === "number" && row.min_masa_hexow >= 0 ? row.min_masa_hexow : fb.minMasaHexow,
    obrzezeSzansa: typeof row.obrzeze_szansa === "number" && row.obrzeze_szansa >= 0 && row.obrzeze_szansa <= 1 ? row.obrzeze_szansa : fb.obrzezeSzansa
  };
}
function mapGenRozmiarDims() {
  const src = map_gen_params_default.generator?.rozmiar_dims;
  const out = { ...FALLBACK_ROZMIAR };
  if (!src) return out;
  for (const key of Object.keys(out)) {
    const pair = src[key];
    if (Array.isArray(pair) && pair.length >= 2 && pair.every((n) => typeof n === "number" && n > 0)) {
      out[key] = [pair[0], pair[1]];
    }
  }
  return out;
}
function mapGenAllDepositRarities() {
  const out = { ...FALLBACK_DEPOSIT_RARITY };
  const rules = map_gen_params_default.deposit_rules;
  if (rules) {
    for (const [id, row] of Object.entries(rules)) {
      if (typeof row?.rarity === "number" && row.rarity >= 0) out[id] = row.rarity;
    }
  }
  return out;
}

// data/e-start-params.json
var e_start_params_default = {
  _opis: "Panel-E (Grupa E): start, meta, generator E2, zwyci\u0119stwo, tempo. \u0179r\xF3d\u0142o: panele-sterowania/Panel-E.xlsx \u2192 export-e.py. ui-params.json = etykiety kreatora; ten plik = liczby i regu\u0142y silnika (docelowo odczyt w TS \u2014 dzi\u015B sync z kodem).",
  defaulty: {
    player_civ_id: "rzymianie",
    start_epoch_id: "kamien",
    map_quality_default: "\u015Arednia",
    render_quality_bundled: "medium"
  },
  skala_mapy: {
    Malenki: {
      rywale_ai: 2,
      miasta_panstwa: 3,
      typy_cywilizacji: 4,
      typy_cywilizacji_per_epoka: {
        kamien: { default: 3, min: 2, max: 4 },
        braz: { default: 4, min: 3, max: 5 },
        zelazo: { default: 4, min: 3, max: 5 }
      },
      hex_w: 76,
      hex_h: 52
    },
    Ma\u0142y: {
      rywale_ai: 3,
      miasta_panstwa: 4,
      typy_cywilizacji: 5,
      typy_cywilizacji_per_epoka: {
        kamien: { default: 4, min: 3, max: 5 },
        braz: { default: 5, min: 4, max: 6 },
        zelazo: { default: 5, min: 4, max: 6 }
      },
      hex_w: 108,
      hex_h: 74
    },
    Standardowy: {
      rywale_ai: 6,
      miasta_panstwa: 5,
      typy_cywilizacji: 6,
      typy_cywilizacji_per_epoka: {
        kamien: { default: 5, min: 4, max: 6 },
        braz: { default: 6, min: 5, max: 7 },
        zelazo: { default: 6, min: 5, max: 7 }
      },
      hex_w: 168,
      hex_h: 120
    },
    Du\u017Cy: {
      rywale_ai: 7,
      miasta_panstwa: 6,
      typy_cywilizacji: 10,
      typy_cywilizacji_per_epoka: {
        kamien: { default: 6, min: 5, max: 7 },
        braz: { default: 9, min: 8, max: 10 },
        zelazo: { default: 10, min: 9, max: 11 }
      },
      hex_w: 240,
      hex_h: 168
    },
    Ogromny: {
      rywale_ai: 8,
      miasta_panstwa: 7,
      typy_cywilizacji: 12,
      typy_cywilizacji_per_epoka: {
        kamien: { default: 7, min: 6, max: 8 },
        braz: { default: 11, min: 10, max: 12 },
        zelazo: { default: 12, min: 11, max: 13 }
      },
      hex_w: 336,
      hex_h: 238
    },
    "Super Huge": {
      rywale_ai: 10,
      miasta_panstwa: 8,
      typy_cywilizacji: 14,
      typy_cywilizacji_per_epoka: {
        kamien: { default: 8, min: 7, max: 8 },
        braz: { default: 13, min: 12, max: 14 },
        zelazo: { default: 14, min: 13, max: 15 }
      },
      hex_w: 672,
      hex_h: 476
    }
  },
  generator_e2: {
    resource_mult_low: 0.6,
    resource_mult_normal: 1,
    resource_mult_high: 1.4,
    resource_baseline_rarity: 1.35,
    river_base_low: 20,
    river_base_normal: 50,
    river_base_high: 80,
    river_scale_mala: 1,
    river_scale_srednia: 1.35,
    river_scale_duza: 1.7,
    river_scale_ogromna: 2.1,
    desert_threshold_low: 0.68,
    desert_threshold_normal: 0.63,
    desert_threshold_high: 0.58,
    forest_threshold_low: 0.65,
    forest_threshold_normal: 0.58,
    forest_threshold_high: 0.5
  },
  tempo_gry: {
    szybka: 1,
    standardowa: 2,
    dluga: 4
  },
  koszt_budynkow_pace: {
    niski: 1,
    normalny: 2,
    wysoki: 4
  },
  koszt_jednostek_pace: {
    niski: 1,
    normalny: 2,
    wysoki: 4
  },
  zwyciestwo: {
    ostatnia_epoka_v1: 3,
    prog_dominacji_power: 0.5,
    dominacja_wymaga_ostatniej_epoki: true,
    nauka_wymaga_rakiety: true
  },
  kreator_zaawansowane: {
    seed_mode_default: "random",
    manual_seed_default: 424242,
    barbarians_enabled_default: true,
    battle_always_manual_default: false,
    fog_debug_reveal_all_default: false,
    victory_power_and_dominance_default: true
  },
  decyzje_kanon: {
    e1_reset_nowa_gra: true,
    e1_tech_kaskada_epok: true,
    e1_ziemia_preset_staly: true,
    e1_zloza_tylko_gory: true,
    e1_zloza_ukryte_do_epoki: true,
    e2_barbarzyncy_do_przed_sredniowiecza: true,
    e2_buntownicy_od_sredniowiecza: true
  }
};

// src/util/norm-pl-label.ts
function normPlMenuLabel(label) {
  return label.toLowerCase().replace(/ł/g, "l").replace(/[ó]/g, "o").replace(/[ąà]/g, "a").replace(/[ę]/g, "e").replace(/[żź]/g, "z").replace(/[^a-z0-9]/g, "");
}

// src/data/e-start-params-loader.ts
var R = e_start_params_default;
var MENU_KEYS = ["Malenki", "Ma\u0142y", "Standardowy", "Du\u017Cy", "Ogromny", "Super Huge"];
function normMenuLabel(label) {
  return normPlMenuLabel(label);
}
function skalaRow(menuLabel) {
  const n = normMenuLabel(menuLabel);
  const m = R.skala_mapy;
  if (!m) return void 0;
  for (const key of Object.keys(m)) {
    if (normMenuLabel(key) === n) return m[key];
  }
  for (const key of MENU_KEYS) {
    if (normMenuLabel(key) === n) return m[key];
  }
  return void 0;
}
function eStartPlayerCivId() {
  return R.defaulty?.player_civ_id ?? "rzymianie";
}
function eStartEpochId() {
  return R.defaulty?.start_epoch_id ?? "kamien";
}
function eStartRenderQualityBundled() {
  const q = R.defaulty?.render_quality_bundled ?? "medium";
  if (q === "low" || q === "high") return q;
  return "medium";
}
function normEpochId(epochId) {
  const n = epochId.toLowerCase().replace(/ł/g, "l").trim();
  if (n === "braz" || n === "bronz") return "braz";
  if (n === "zelazo" || n === "iron") return "zelazo";
  return "kamien";
}
function eStartTypyCywilizacjiPerEpoka(menuLabel, epochId) {
  const row = skalaRow(menuLabel);
  const ep = normEpochId(epochId);
  const triple = row?.typy_cywilizacji_per_epoka?.[ep];
  if (!triple) return void 0;
  const { default: def, min, max } = triple;
  if (typeof def !== "number" || typeof min !== "number" || typeof max !== "number" || !Number.isFinite(def) || !Number.isFinite(min) || !Number.isFinite(max)) {
    return void 0;
  }
  return { default: def, min, max };
}
function eStartTypyCywilizacji(menuLabel) {
  const row = skalaRow(menuLabel);
  const kamien = row?.typy_cywilizacji_per_epoka?.kamien?.default;
  if (typeof kamien === "number" && kamien > 0) return kamien;
  return row?.typy_cywilizacji;
}
function eStartMiastaPanstwa(menuLabel) {
  return skalaRow(menuLabel)?.miasta_panstwa;
}

// src/map/villages.ts
var VILLAGE_HUTS_PER_CITY = {
  hard: 1,
  normal: 2,
  easy: 3
};
var VILLAGE_LAND_HEX_PER_VILLAGE = 140;
function expectedStartCityCount(civTypesCount, cityStatesCount) {
  const types = Math.max(1, Math.floor(civTypesCount));
  const states = Math.max(0, Math.floor(cityStatesCount));
  return types * (1 + states);
}
function villageHutsPerCityMultiplier(difficulty = "normal") {
  return VILLAGE_HUTS_PER_CITY[difficulty] ?? VILLAGE_HUTS_PER_CITY.normal;
}
function targetVillageHutCount(cityCount, difficulty = "normal") {
  const cities = Math.max(0, Math.floor(cityCount));
  return cities * villageHutsPerCityMultiplier(difficulty);
}
var VILLAGE_MIN_DIST_FROM_CITY = 3;
var VILLAGE_MIN_SPACING = 3;
function lcgNext(state) {
  const next = state * 1664525 + 1013904223 >>> 0;
  return [next, next / 4294967296];
}
function isVillageExcludedTerrain(t) {
  return t === "morze" /* Morze */ || t === "wybrzeze" /* Wybrzeze */ || t === "gory" /* Gory */ || t === "pustynia" /* Pustynia */ || t === "polarny" /* Polarny */;
}
function placeVillages(hexes, cities, existingCamps, seed, opts) {
  const minDistFromCity = opts?.minDistFromCity ?? VILLAGE_MIN_DIST_FROM_CITY;
  const spacing = opts?.spacing ?? VILLAGE_MIN_SPACING;
  const landHexPerVillage = opts?.landHexPerVillage ?? VILLAGE_LAND_HEX_PER_VILLAGE;
  let landHexCount = 0;
  const candidates = [];
  for (const key of Object.keys(hexes)) {
    const hex = hexes[key];
    if (hex === void 0) continue;
    const isSea = hex.terenBazowy === "morze" /* Morze */ || hex.terenBazowy === "wybrzeze" /* Wybrzeze */;
    if (!isSea) landHexCount++;
    if (hex.wlasciciel !== null) continue;
    if (isVillageExcludedTerrain(hex.terenBazowy)) continue;
    candidates.push({ q: hex.coords.q, r: hex.coords.r });
  }
  const targetCount = opts?.targetCount != null && Number.isFinite(opts.targetCount) ? Math.max(0, Math.floor(opts.targetCount)) : Math.max(1, Math.round(landHexCount / landHexPerVillage));
  if (candidates.length === 0) return [];
  let lcg = seed >>> 0;
  for (let i = candidates.length - 1; i > 0; i--) {
    let rnd;
    [lcg, rnd] = lcgNext(lcg);
    const j = Math.floor(rnd * (i + 1));
    const tmp = candidates[i];
    candidates[i] = candidates[j];
    candidates[j] = tmp;
  }
  const placed = existingCamps.map((c) => ({ q: c.q, r: c.r }));
  const result = [];
  for (const cand of candidates) {
    if (result.length >= targetCount) break;
    const tooCloseToCity = cities.some(
      (c) => hexDistanceAxial(cand.q, cand.r, c.q, c.r) < minDistFromCity
    );
    if (tooCloseToCity) continue;
    const tooCloseToOther = placed.some(
      (p) => hexDistanceAxial(cand.q, cand.r, p.q, p.r) < spacing
    );
    if (tooCloseToOther) continue;
    placed.push(cand);
    result.push(cand);
  }
  return result;
}

// src/map/riverGenSwitch.ts
var RIVER_GEN_STORAGE_KEY = "civ-river-gen";
var RIVER_GEN_PHASE_STORAGE_KEY = "civ-river-gen-phase";
var _override = null;
var _phaseOverride = null;
function parse01(raw) {
  if (raw === "0" || raw === "false") return false;
  if (raw === "1" || raw === "true") return true;
  return null;
}
function parsePhase(raw) {
  if (raw === "main" || raw === "main+medium" || raw === "all") return raw;
  return null;
}
function getRiverGenEnabled() {
  if (_override !== null) return _override;
  if (typeof location !== "undefined") {
    const fromUrl = parse01(new URLSearchParams(location.search).get("riverGen"));
    if (fromUrl !== null) return fromUrl;
  }
  try {
    if (typeof localStorage !== "undefined") {
      const fromStore = parse01(localStorage.getItem(RIVER_GEN_STORAGE_KEY));
      if (fromStore !== null) return fromStore;
    }
  } catch {
  }
  return true;
}
function getRiverGenPhase() {
  if (_phaseOverride !== null) return _phaseOverride;
  if (typeof location !== "undefined") {
    const fromUrl = parsePhase(new URLSearchParams(location.search).get("riverGenPhase"));
    if (fromUrl !== null) return fromUrl;
  }
  try {
    if (typeof localStorage !== "undefined") {
      const fromStore = parsePhase(localStorage.getItem(RIVER_GEN_PHASE_STORAGE_KEY));
      if (fromStore !== null) return fromStore;
    }
  } catch {
  }
  return "main+medium";
}
function isRiverGenMainOnly() {
  return getRiverGenPhase() === "main";
}
function isRiverGenFull() {
  return getRiverGenPhase() === "all";
}

// src/map/mapGenProgress.ts
var MAP_GEN_PHASE_TOTAL = 10;
var MAP_GEN_PHASE_LABELS = {
  prep: "Przygotowanie siatki",
  terrain: "Klimat i teren bazowy",
  landSea: "L\u0105d i ocean",
  relief: "Relief (g\xF3ry i wzg\xF3rza)",
  coast: "Wybrze\u017Ce",
  riversMain: "Rzeki \u2014 g\u0142\xF3wne",
  riversFill: "Rzeki \u2014 uzupe\u0142nianie",
  forest: "Las i ro\u015Blinno\u015B\u0107",
  deposits: "Z\u0142o\u017Ca mineralne",
  starts: "Pozycje startowe"
};
function reportMapGenPhase(onProgress, phaseNum, faza, localPct, phaseTotal = MAP_GEN_PHASE_TOTAL) {
  if (!onProgress) return;
  const clampedLocal = Math.max(0, Math.min(100, localPct));
  const globalPct = (phaseNum - 1 + clampedLocal / 100) / phaseTotal * 100;
  const capped = phaseNum >= phaseTotal && clampedLocal >= 100 ? 100 : Math.min(99, Math.round(globalPct));
  onProgress(faza, capped, phaseNum, phaseTotal);
}
var MAP_GEN_PHASE_KEYS = Object.keys(MAP_GEN_PHASE_LABELS);
function createMapGenTimer() {
  const ms = {};
  const genStart = performance.now();
  let lastMark = genStart;
  let current = null;
  return {
    begin(key) {
      const now = performance.now();
      if (current) {
        ms[current] = Math.round(now - lastMark);
      }
      current = key;
      lastMark = now;
    },
    finish() {
      const now = performance.now();
      if (current) {
        ms[current] = Math.round(now - lastMark);
      }
      const result = {};
      for (const k of MAP_GEN_PHASE_KEYS) {
        result[k] = ms[k] ?? 0;
      }
      result.total = Math.round(now - genStart);
      return result;
    }
  };
}

// src/map/generator.ts
var DEFAULT_WIDTH = 36;
var DEFAULT_HEIGHT = 28;
function generateMap(width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT, seed = 42, typ = "kontynenty", genOpts, onProgress) {
  const genTimer = createMapGenTimer();
  genTimer.begin("prep");
  const effectiveSeed = seed || 42;
  const wgn = resolveWorldGenNumbers(genOpts);
  const landFraction = resolveLandFraction(genOpts, typ);
  const terrainTh = {
    desert: wgn.desertThreshold,
    mountain: wgn.mountainThreshold,
    highland: wgn.highlandThreshold
  };
  const rand = mulberry32(effectiveSeed);
  const perm = buildPermTable(rand);
  const shape = defaultShapeParams(rand);
  const sizeNorm = Math.max(width, height) / DEFAULT_WIDTH;
  shape.noiseScale /= sizeNorm;
  shape.mountainScale /= Math.sqrt(sizeNorm);
  shape.forestScale /= sizeNorm;
  shape.desertScale /= sizeNorm;
  const nCenters = continentCenterCount(width, height, typ);
  const radiusBoost = Math.max(0, (landFraction - 0.5) * 0.28);
  const sparseLand = landFraction <= 0.35;
  const kontynentyRadiusMin = (sparseLand ? 0.11 : 0.13) + radiusBoost;
  const kontynentyRadiusMax = (sparseLand ? 0.19 : 0.23) + radiusBoost;
  let zoneCenters;
  if (typ === "kontynenty") {
    zoneCenters = buildFiveZoneContinentCenters(rand, width, height, kontynentyRadiusMin, kontynentyRadiusMax);
  } else if (typ === "wyspy") {
    zoneCenters = buildSixteenGridIslandCenters(rand, width, height);
  } else if (typ === "pangea") {
    zoneCenters = buildPangeaBlobCenters(rand, width, height, landFraction);
  } else {
    zoneCenters = buildContinentCenters(rand, nCenters, { width, height });
  }
  const nZones = typ === "kontynenty" || typ === "wyspy" ? zoneCenters.length : 0;
  const zoneOf = typ === "kontynenty" ? assignContinentIndices(width, height, zoneCenters) : typ === "wyspy" ? assignIslandGridIndices(width, height) : null;
  const hexes = {};
  const landScores = /* @__PURE__ */ new Map();
  const terrainScratch = /* @__PURE__ */ new Map();
  reportMapGenPhase(onProgress, 1, MAP_GEN_PHASE_LABELS.prep, 100);
  genTimer.begin("terrain");
  const terrainRowStep = Math.max(1, Math.floor(height / 24));
  for (let r = 0; r < height; r++) {
    for (let q = 0; q < width; q++) {
      const coords = { q, r };
      const key = `${q},${r}`;
      let landMask;
      if (typ === "pangea") {
        landMask = landMaskPangea(q, r, width, height, zoneCenters, perm, shape.noiseScale, landFraction);
      } else if (typ === "wyspy") {
        landMask = landMaskWyspy(q, r, width, height, zoneCenters, perm, shape.noiseScale);
      } else if (typ === "ziemia") {
        landMask = landMaskZiemia(q, r, width, height, perm, shape.noiseScale);
      } else {
        landMask = landMaskKontynenty(q, r, width, height, zoneCenters, perm, shape.noiseScale);
      }
      if (isInMapBorder(q, r, width, height)) {
        landMask = 0;
      }
      if (isInLatitudinalOceanBuffer(r, height, typ === "ziemia")) {
        landMask = 0;
      }
      landScores.set(key, landMask);
      const elevation = fbm(perm, q * shape.noiseScale, r * shape.noiseScale, 4);
      const elevContinental = elevation * landMask;
      const mtnNoise = fbm(perm, q * shape.mountainScale + shape.offMtnX, r * shape.mountainScale + shape.offMtnY, 3);
      const forNoise = fbm(perm, q * shape.forestScale + shape.offForX, r * shape.forestScale + shape.offForY, 3);
      const desNoise = fbm(perm, q * shape.desertScale + shape.offDesX, r * shape.desertScale + shape.offDesY, 3);
      const { terenBazowy, nakladka } = classifyTerrain(
        elevContinental,
        landMask,
        mtnNoise,
        forNoise,
        desNoise,
        terrainTh,
        climateBandAt(q, r, height, typ === "ziemia"),
        terrainCellBias(q, r, effectiveSeed)
      );
      terrainScratch.set(key, { elevContinental, landMask, mtnNoise, forNoise, desNoise });
      hexes[key] = {
        coords,
        terenBazowy,
        nakladka,
        ulepszenie: "brak" /* Brak */,
        wlasciciel: null,
        wioska: { istnieje: false, ludnosc: 0 },
        widocznosc: {},
        rzeka: { obecna: false, krawedzie: [] }
      };
    }
    if (onProgress && (r % terrainRowStep === 0 || r === height - 1)) {
      reportMapGenPhase(onProgress, 2, MAP_GEN_PHASE_LABELS.terrain, (r + 1) / height * 100);
    }
  }
  reportMapGenPhase(onProgress, 2, MAP_GEN_PHASE_LABELS.terrain, 100);
  genTimer.begin("landSea");
  reportMapGenPhase(onProgress, 3, MAP_GEN_PHASE_LABELS.landSea, 5);
  const coastOpts = typ === "pangea" ? { maxInlandPoolSize: 24 } : typ === "kontynenty" ? { maxInlandPoolSize: 8 } : void 0;
  if (typ === "kontynenty") {
    removeSmallInlandWaterPools(hexes, width, height, 8);
    trimEnclosedOceanOnly(hexes, width, height);
  } else if (typ !== "pangea") {
    removeInlandWaterPools(hexes, width, height);
  } else {
    removeInlandSeaPools(hexes, width, height);
    fillPangeaAnnularSeaCorridors(hexes, width, height);
  }
  if (typ === "pangea") {
    snapPangeaBagelAudit("01_po_mask_annular", hexes, width, height);
    trimDeepOceanBays(hexes, width, height);
  }
  finalizeCoastAndInlandWater(hexes, width, height, 3, coastOpts);
  if (typ === "kontynenty" || typ === "pangea") {
    removeTinyLandIslands(hexes, typ === "kontynenty" ? 8 : 10);
    if (typ === "pangea") {
      trimDeepOceanBays(hexes, width, height);
    }
    finalizeCoastAndInlandWater(hexes, width, height, 3, coastOpts);
  }
  enforceMapBorderOcean(hexes, width, height);
  enforceLatitudinalOceanBuffer(hexes, width, height, typ === "ziemia");
  if ((typ === "kontynenty" || typ === "wyspy") && zoneOf) {
    applyLandFractionByContinent(hexes, landScores, zoneOf, nZones, landFraction, width, height);
    applyMarginalLandZoneCaps(hexes, landScores, width, height);
    applyJaggedCoastNoise(hexes, perm, width, height, 2);
    removeTinyLandIslands(hexes, typ === "wyspy" ? 4 : 5);
    trimEnclosedOceanOnly(hexes, width, height);
  } else if (typ === "ziemia") {
    enforceEarthTemplateOnHexes(hexes, width, height);
    purgeOceanInsideEarthLandMask(hexes, width, height);
  } else if (typ === "pangea") {
    rebalanceLandFractionPangea(hexes, landScores, landFraction, width, height, perm);
    snapPangeaBagelAudit("02_po_rebalance1", hexes, width, height);
  } else {
    rebalanceLandFractionWithMargins(hexes, landScores, landFraction, width, height);
  }
  enforceMapBorderOcean(hexes, width, height);
  enforceLatitudinalOceanBuffer(hexes, width, height, typ === "ziemia");
  if (typ !== "pangea") {
    purgeInlandWaterForMultiLandTyp(hexes, width, height);
  }
  finalizeCoastAndInlandWater(hexes, width, height, 3, coastOpts);
  reportMapGenPhase(onProgress, 3, MAP_GEN_PHASE_LABELS.landSea, 55);
  const reliefTier = genOpts?.worldDensity?.relief ?? genOpts?.worldDensity?.rivers ?? "medium";
  const forestTier = genOpts?.worldDensity?.forest ?? "medium";
  reapplyLandTerrain(hexes, terrainScratch, effectiveSeed, terrainTh, height, reliefTier);
  if (typ !== "pangea") {
    purgeInlandWaterForMultiLandTyp(hexes, width, height);
  }
  applyReliefByNoiseRank(hexes, terrainScratch, reliefTier, width, height, typ, zoneOf, nZones);
  enforceMapBorderOcean(hexes, width, height);
  enforceLatitudinalOceanBuffer(hexes, width, height, typ === "ziemia");
  if (typ !== "pangea") {
    purgeInlandWaterForMultiLandTyp(hexes, width, height);
  }
  finalizeCoastAndInlandWater(hexes, width, height, 2, coastOpts);
  purgeReliefValleyWater(hexes, width, height);
  reportMapGenPhase(onProgress, 3, MAP_GEN_PHASE_LABELS.landSea, 100);
  genTimer.begin("relief");
  reportMapGenPhase(onProgress, 4, MAP_GEN_PHASE_LABELS.relief, 10);
  if (typ === "pangea") {
    trimDeepOceanBays(hexes, width, height);
  }
  finalizeCoastAndInlandWater(hexes, width, height, 3, coastOpts);
  purgeInlandWaterForMultiLandTyp(hexes, width, height);
  if (typ === "kontynenty" || typ === "wyspy") {
    trimEnclosedOceanOnly(hexes, width, height);
    purgeReliefValleyWater(hexes, width, height);
  }
  enforceMapBorderOcean(hexes, width, height);
  enforceLatitudinalOceanBuffer(hexes, width, height, typ === "ziemia");
  finalizeCoastAndInlandWater(hexes, width, height, 3, coastOpts);
  if (typ === "ziemia") {
    enforceEarthTemplateOnHexes(hexes, width, height);
    purgeOceanInsideEarthLandMask(hexes, width, height);
  } else if (typ === "pangea") {
    rebalanceLandFractionPangea(hexes, landScores, landFraction, width, height, perm);
    snapPangeaBagelAudit("03_po_rebalance2", hexes, width, height);
  } else {
    rebalanceLandFractionWithMargins(hexes, landScores, landFraction, width, height);
  }
  if (typ !== "ziemia" && typ !== "pangea") {
    applyJaggedCoastNoise(hexes, perm, width, height, 1);
  }
  removeSmallInlandWaterPools(hexes, width, height, 14);
  purgeInlandWaterForMultiLandTyp(hexes, width, height);
  trimDeepOceanBays(hexes, width, height);
  finalizeCoastAndInlandWater(hexes, width, height, 2, coastOpts);
  enforceMapBorderOcean(hexes, width, height);
  enforceLatitudinalOceanBuffer(hexes, width, height, typ === "ziemia");
  if (typ === "ziemia") {
    enforceEarthTemplateOnHexes(hexes, width, height);
    purgeOceanInsideEarthLandMask(hexes, width, height);
    finalizeCoastAndInlandWater(hexes, width, height, 2, coastOpts);
    enforceEarthTemplateOnHexes(hexes, width, height);
    purgeOceanInsideEarthLandMask(hexes, width, height);
  }
  finalizeLandMassAfterCoast(hexes, typ, width, height, coastOpts, 2);
  ensureReliefGridCoverage(
    hexes,
    terrainScratch,
    reliefTier,
    width,
    height,
    typ,
    zoneOf,
    nZones,
    rand
  );
  growMountainRanges(hexes, terrainScratch, reliefTier, width, height, rand);
  reportMapGenPhase(onProgress, 4, MAP_GEN_PHASE_LABELS.relief, 75);
  applyClimateBandsToHexes(hexes, height, effectiveSeed, typ === "ziemia");
  enforceLatitudinalOceanBuffer(hexes, width, height, typ === "ziemia");
  purgeInlandWaterForMultiLandTyp(hexes, width, height);
  purgeDesertEnclaveWater(hexes, width, height);
  reportMapGenPhase(onProgress, 4, MAP_GEN_PHASE_LABELS.relief, 100);
  genTimer.begin("coast");
  reportMapGenPhase(onProgress, 5, MAP_GEN_PHASE_LABELS.coast, 20);
  thickenCoastAndSmoothInlets(hexes, width, height, 2);
  if (typ === "pangea") {
    snapPangeaBagelAudit("04_po_thickenCoast", hexes, width, height);
  }
  if (typ === "ziemia") {
    purgeStrayLandOutsideEarthMask(hexes, width, height);
    applyCoastRing(hexes);
  }
  enforceMapBorderOcean(hexes, width, height);
  enforceLatitudinalOceanBuffer(hexes, width, height, typ === "ziemia");
  if (typ !== "ziemia") {
    const pangeaFillMin = typ === "pangea" ? pangeaLandLayoutParams(landFraction, width, height).fillMinScore : void 0;
    enforceTargetDryLandFraction(
      hexes,
      landScores,
      landFraction,
      width,
      height,
      coastOpts,
      void 0,
      typ === "pangea" ? "mask" : "center",
      pangeaFillMin
    );
    if (typ === "pangea") {
      snapPangeaBagelAudit("05_po_enforceLandPct", hexes, width, height);
      fillPangeaAnnularSeaCorridors(hexes, width, height);
      ensurePangeaSingleContinent(hexes, width, height);
      snapPangeaBagelAudit("06_po_ensure_A", hexes, width, height);
      enforceMapBorderOcean(hexes, width, height);
      finalizeCoastAndInlandWater(hexes, width, height, 1, coastOpts);
      snapPangeaBagelAudit("07_po_finalizeCoast", hexes, width, height);
      fillPangeaAnnularSeaCorridors(hexes, width, height);
      ensurePangeaSingleContinent(hexes, width, height);
      snapPangeaBagelAudit("08_po_ensure_B", hexes, width, height);
      enforceMapBorderOcean(hexes, width, height);
      applyCoastRing(hexes);
    }
  }
  if (typ === "pangea") {
    fillPangeaAnnularSeaCorridors(hexes, width, height);
    ensurePangeaSingleContinent(hexes, width, height);
    snapPangeaBagelAudit("09_przed_rzekami", hexes, width, height);
  }
  reportMapGenPhase(onProgress, 5, MAP_GEN_PHASE_LABELS.coast, 100);
  genTimer.begin("riversMain");
  const riverGenOn = getRiverGenEnabled();
  const riverGenMainOnly = riverGenOn && isRiverGenMainOnly();
  if (!riverGenOn) {
    console.info("[civ] riverGen: WY\u0141\u0104CZONE (kill-switch FALA 160 \u2014 ?riverGen=1 / localStorage civ-river-gen)");
  } else if (riverGenMainOnly) {
    console.info("[civ] riverGenPhase: main (tylko g\u0142\xF3wne; pe\u0142ny tor: ?riverGenPhase=all)");
  } else if (getRiverGenPhase() === "main+medium") {
    console.info("[civ] riverGenPhase: main+medium (g\u0142\xF3wne+\u015Brednie; pe\u0142ny tor: ?riverGenPhase=all)");
  }
  reportMapGenPhase(onProgress, 6, MAP_GEN_PHASE_LABELS.riversMain, 0);
  const riversTier = genOpts?.worldDensity?.rivers ?? "medium";
  const riverParams = resolveRiverMapParams(riversTier, width, height);
  clearRiverMarks(hexes);
  let riverPaths = [];
  let riverPathKinds = [];
  if (riverGenOn) {
    ({ paths: riverPaths, kinds: riverPathKinds } = generateRivers(hexes, width, height, rand, {
      minLen: riverParams.minLen,
      maxLen: riverParams.maxLen,
      margin: wgn.riverTrace.margin,
      riversTier,
      worldTyp: typ,
      riverParams,
      onProgress: (localPct) => {
        reportMapGenPhase(onProgress, 6, MAP_GEN_PHASE_LABELS.riversMain, localPct);
      }
    }));
  }
  reportMapGenPhase(onProgress, 6, MAP_GEN_PHASE_LABELS.riversMain, 100);
  genTimer.begin("riversFill");
  reportMapGenPhase(onProgress, 7, MAP_GEN_PHASE_LABELS.riversFill, 0);
  if (riverGenOn && !riverGenMainOnly) {
    stripRiverMarksFromOpenSea(hexes);
    ({ paths: riverPaths, kinds: riverPathKinds } = pruneOrphanRiverPaths(hexes, riverPaths, riverPathKinds, width, height));
    ({ paths: riverPaths, kinds: riverPathKinds } = pruneRiversNotReachingRealSea(hexes, riverPaths, riverPathKinds, width, height));
    ({ paths: riverPaths, kinds: riverPathKinds } = pruneOrphanRiverPaths(hexes, riverPaths, riverPathKinds, width, height));
    ({ paths: riverPaths, kinds: riverPathKinds } = pruneRiversNotReachingRealSea(hexes, riverPaths, riverPathKinds, width, height));
    topUpRiverGridCoverage(
      hexes,
      width,
      height,
      riverPaths,
      riverPathKinds,
      rand,
      riversTier,
      riverParams.minLen,
      riverParams.maxLen,
      riverParams,
      (localPct) => {
        reportMapGenPhase(onProgress, 7, MAP_GEN_PHASE_LABELS.riversFill, 5 + localPct * 0.75);
      }
    );
    ({ paths: riverPaths, kinds: riverPathKinds } = ensureRiverOutlets(hexes, riverPaths, riverPathKinds, width, height));
  } else if (riverGenMainOnly) {
    stripRiverMarksFromOpenSea(hexes);
    ({ paths: riverPaths, kinds: riverPathKinds } = pruneOrphanRiverPaths(hexes, riverPaths, riverPathKinds, width, height));
    reportMapGenPhase(onProgress, 7, MAP_GEN_PHASE_LABELS.riversFill, 100);
  }
  reportMapGenPhase(onProgress, 7, MAP_GEN_PHASE_LABELS.riversFill, 85);
  flattenFalseCoastalRiverNotches(hexes, width, height);
  if (riverGenOn) {
    refillMainRiverCoastMouthGapsOnMap(
      hexes,
      width,
      height,
      riverPaths,
      riverPathKinds,
      rand,
      riverParams,
      riverParams.minLen
    );
  }
  if (typ === "pangea") {
    snapPangeaBagelAudit("10_po_rzekach", hexes, width, height);
  }
  capReliefClusterSizeSafetyNet(hexes, terrainScratch);
  ensureReliefGridCoverage(
    hexes,
    terrainScratch,
    reliefTier,
    width,
    height,
    typ,
    zoneOf,
    nZones,
    rand
  );
  reportMapGenPhase(onProgress, 7, MAP_GEN_PHASE_LABELS.riversFill, 100);
  genTimer.begin("forest");
  reportMapGenPhase(onProgress, 8, MAP_GEN_PHASE_LABELS.forest, 10);
  reapplyForestOverlay(hexes, terrainScratch, terrainTh, typ, forestTier, zoneOf, nZones, height);
  ensureForestGridCoverage(hexes, terrainScratch, forestTier, typ, zoneOf, nZones, rand);
  reportMapGenPhase(onProgress, 8, MAP_GEN_PHASE_LABELS.forest, 100);
  genTimer.begin("deposits");
  reportMapGenPhase(onProgress, 9, MAP_GEN_PHASE_LABELS.deposits, 15);
  placeDeposits(hexes, effectiveSeed, void 0, wgn.resourceMult, wgn.resourceBaseline);
  ensureDepositGridCoverage(hexes, reliefTier, typ, zoneOf, nZones, rand);
  stripDepositsFromWater(hexes);
  reportMapGenPhase(onProgress, 9, MAP_GEN_PHASE_LABELS.deposits, 100);
  genTimer.begin("starts");
  reportMapGenPhase(onProgress, 10, MAP_GEN_PHASE_LABELS.starts, 10);
  const startPositions = computeStartPositions(hexes, effectiveSeed, {
    minCount: 5,
    minDist: 5,
    absMinDist: 2
  });
  const mapMenuLabel = genOpts?.mapSizeMenuLabel ?? "Standardowy";
  const startCityCount = expectedStartCityCount(
    genOpts?.civTypesCount ?? defaultCivTypesFromMapLabel(mapMenuLabel),
    clampMiastaPanstwaCount(
      genOpts?.cityStatesCount ?? defaultMiastaPanstwaFromMapLabel(mapMenuLabel)
    )
  );
  const targetHuts = targetVillageHutCount(startCityCount, genOpts?.difficulty ?? "normal");
  const villageSites = placeVillages(hexes, startPositions, [], (effectiveSeed ^ 24301) >>> 0, {
    targetCount: targetHuts
  });
  for (const site of villageSites) {
    const hex = hexes[`${site.q},${site.r}`];
    if (hex) hex.wioska = { istnieje: true, ludnosc: 1 };
  }
  reportMapGenPhase(onProgress, 10, MAP_GEN_PHASE_LABELS.starts, 70);
  if (typ === "ziemia") {
    enforceEarthTemplateOnHexes(hexes, width, height);
    purgeOceanInsideEarthLandMask(hexes, width, height);
    capReliefClusterSizeSafetyNet(hexes, terrainScratch);
    ensureReliefGridCoverage(
      hexes,
      terrainScratch,
      reliefTier,
      width,
      height,
      typ,
      zoneOf,
      nZones,
      rand
    );
    ensureDepositGridCoverage(hexes, reliefTier, typ, zoneOf, nZones, rand);
    stripDepositsFromWater(hexes);
  }
  ({ paths: riverPaths, kinds: riverPathKinds } = ensureRiverOutlets(hexes, riverPaths, riverPathKinds, width, height));
  finalizeCoastAndInlandWater(hexes, width, height, 2, coastOpts);
  ({ paths: riverPaths, kinds: riverPathKinds } = ensureRiverOutlets(hexes, riverPaths, riverPathKinds, width, height));
  capReliefClusterSizeSafetyNet(hexes, terrainScratch);
  ensureReliefGridCoverage(
    hexes,
    terrainScratch,
    reliefTier,
    width,
    height,
    typ,
    zoneOf,
    nZones,
    rand
  );
  ensureForestGridCoverage(hexes, terrainScratch, forestTier, typ, zoneOf, nZones, rand);
  ensureDepositGridCoverage(hexes, reliefTier, typ, zoneOf, nZones, rand);
  stripDepositsFromWater(hexes);
  capReliefClusterSizeSafetyNet(hexes, terrainScratch);
  ensureReliefGridCoverage(
    hexes,
    terrainScratch,
    reliefTier,
    width,
    height,
    typ,
    zoneOf,
    nZones,
    rand
  );
  reportMapGenPhase(onProgress, 10, MAP_GEN_PHASE_LABELS.starts, 100);
  const mapGenTimings = genTimer.finish();
  console.info(
    `[civ] mapGen ms | prep=${mapGenTimings.prep} terrain=${mapGenTimings.terrain} landSea=${mapGenTimings.landSea} relief=${mapGenTimings.relief} coast=${mapGenTimings.coast} riversMain=${mapGenTimings.riversMain} riversFill=${mapGenTimings.riversFill} forest=${mapGenTimings.forest} deposits=${mapGenTimings.deposits} starts=${mapGenTimings.starts} total=${mapGenTimings.total}`
  );
  return {
    szerokoscQ: width,
    wysokoscR: height,
    hexes,
    seed: effectiveSeed,
    riverPaths,
    riverPathKinds,
    startPositions,
    mapGenTimings
  };
}
var ROZMIAR_DIMS = mapGenRozmiarDims();
function normMenuLabel2(label) {
  return normPlMenuLabel(label);
}
function rozmiarFromMenuLabel(label) {
  const n = normMenuLabel2(label);
  if (n.startsWith("malen") || n === "malenki") return "malenki";
  if (n.startsWith("mal") || n === "maly" || n === "small") return "maly";
  if (n.startsWith("stand") || n.startsWith("sre") || n === "standardowy" || n === "medium") return "standardowy";
  if (n.startsWith("duz") || n === "large") return "duzy";
  if (n.startsWith("super") || n === "superhuge" || n === "kolosalny") return "superogromny";
  if (n.startsWith("ogr") || n === "ogromny" || n === "xlarge") return "ogromny";
  return "standardowy";
}
function rozmiarToDims(rozmiar) {
  const [w, h] = ROZMIAR_DIMS[rozmiar];
  return { w, h };
}
function menuLabelToDims(label) {
  return rozmiarToDims(rozmiarFromMenuLabel(label));
}

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

// src/map/newGameMapDefaults.ts
function mapSizeLabelFromDims(w, h) {
  const area = w * h;
  if (area < 4800) return "mala";
  if (area < 12e3) return "srednia";
  if (area < 25200) return "duza";
  if (area < 1e5) return "ogromna";
  return "super";
}
function mapSizeLabelFromMenuLabel(menuLabel) {
  const { w, h } = menuLabelToDims(menuLabel);
  return mapSizeLabelFromDims(w, h);
}
var DEFAULT_PLAYER_CIV_ID = eStartPlayerCivId();
var DEFAULT_START_EPOCH_ID = eStartEpochId();
var DEFAULT_RENDER_QUALITY = eStartRenderQualityBundled();
var DEFAULT_WORLD_DENSITY = {
  resources: "medium",
  rivers: "medium",
  desert: "medium",
  forest: "medium",
  relief: "medium"
};
function densityMultiplier(tier) {
  return mapGenResourceMult(tier);
}
function maxRiversFromDensity(tier) {
  return mapGenMaxRiversBase(tier);
}
var RIVER_SCALE_BY_SIZE = {
  mala: mapGenRiverScale("mala"),
  srednia: mapGenRiverScale("srednia"),
  duza: mapGenRiverScale("duza"),
  ogromna: mapGenRiverScale("ogromna"),
  super: mapGenRiverScale("super")
};
function maxRiversForMapAndDensity(mapMenuLabel, tier) {
  const base = maxRiversFromDensity(tier);
  const sizeLabel = mapSizeLabelFromMenuLabel(mapMenuLabel);
  const scale = RIVER_SCALE_BY_SIZE[sizeLabel] ?? 1;
  const { w, h } = menuLabelToDims(mapMenuLabel);
  const areaBoost = Math.max(1, Math.sqrt(w * h / 5e3));
  return Math.max(2, Math.round(base * scale * areaBoost));
}
function riverMinPathLengthForTier(tier) {
  if (tier === "high") return 35;
  if (tier === "low") return 15;
  return 25;
}
function riverGridCellSizeForTier(tier) {
  if (tier === "high") return 5;
  if (tier === "low") return 10;
  return 5;
}
var RIVER_REF_AREA = 168 * 120;
function riverMapAreaScale(w, h) {
  return Math.sqrt(w * h / RIVER_REF_AREA);
}
function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}
function resolveRiverMapParams(tier, w, h) {
  const areaScale = riverMapAreaScale(w, h);
  const minDim = Math.min(w, h);
  const tierMinLen = riverMinPathLengthForTier(tier);
  const tierCap = tier === "low" ? 5 : tier === "high" ? 8 : 6;
  const mainCell = riverGridCellSizeForTier(tier);
  const tributaryCell = Math.max(3, Math.round(mainCell * 0.5));
  const mainGridStride = 1;
  const minLen = Math.min(
    clamp(Math.round(tierMinLen * Math.max(0.65, areaScale)), 6, tierMinLen),
    Math.floor(minDim * 0.35)
  );
  const maxLen = Math.min(
    Math.max(minLen * 2, Math.floor(minDim * 0.22), Math.round(minLen * 3)),
    Math.floor(minDim * 0.75)
  );
  const gridTraceMinLen = clamp(
    Math.min(minLen, tierCap),
    3,
    Math.max(3, Math.floor(minDim * 0.12))
  );
  const feederMinLen = clamp(Math.max(3, gridTraceMinLen - 1), 3, Math.max(3, Math.floor(minDim * 0.08)));
  const hardMeanderLen = clamp(Math.round(8 * areaScale), 3, 8);
  const mouthTailLen = clamp(Math.round(5 * areaScale), 3, 5);
  const minInlandFromSea = minDim >= 40 ? 2 : 1;
  const reliefSearchMax = clamp(Math.round(14 * areaScale), 6, 28);
  const largeMap = areaScale >= 1.35;
  const feederPasses = largeMap ? clamp(2 + Math.floor(areaScale * 0.4), 2, 4) : clamp(4 + Math.floor(areaScale), 4, 10);
  const topUpPasses = largeMap ? clamp(2 + Math.floor(areaScale * 0.4), 2, 4) : clamp(6 + Math.floor(areaScale * 2), 6, 16);
  const minInlandCell = Math.max(4, Math.floor(minLen * 0.35));
  return {
    areaScale,
    minDim,
    mainCell,
    tributaryCell,
    mainGridStride,
    minLen,
    maxLen,
    gridTraceMinLen,
    feederMinLen,
    hardMeanderLen,
    mouthTailLen,
    minInlandFromSea,
    reliefSearchMin: 2,
    reliefSearchMax,
    reliefSourceBonus: 0,
    feederPasses,
    topUpPasses,
    feederSourceSepMult: 0.35,
    expandSourceRadius: clamp(Math.round(2 * areaScale), 1, 5),
    minInlandCell
  };
}
function resolveRiverTraceForMap(mapMenuLabel, riversTier) {
  const { w, h } = menuLabelToDims(mapMenuLabel);
  const params = resolveRiverMapParams(riversTier, w, h);
  const base = riverTraceLimitsForMap(mapMenuLabel);
  return {
    minLen: params.minLen,
    maxLen: params.maxLen,
    margin: base.margin
  };
}
function riverTraceLimitsForMap(mapMenuLabel) {
  const { w, h } = menuLabelToDims(mapMenuLabel);
  const minDim = Math.min(w, h);
  const area = w * h;
  return {
    minLen: area > 2e4 ? 5 : 4,
    maxLen: Math.max(40, Math.floor(minDim * 0.22)),
    margin: Math.max(2, Math.floor(minDim * 0.025))
  };
}
var RESOURCE_BASELINE_RARITY_MULT = mapGenResourceBaselineRarity();
function desertNoiseThresholdFromTier(tier) {
  return mapGenDesertThreshold(tier);
}
function forestNoiseThresholdFromTier(tier) {
  return Math.max(0.32, mapGenForestThreshold(tier) - 0.12);
}
function mountainNoiseThresholdFromTier(tier) {
  return mapGenMountainThreshold(tier);
}
function highlandNoiseThresholdFromTier(tier) {
  return mapGenHighlandThreshold(tier);
}
function resolveLandFraction(opts, typ) {
  if (opts?.landFraction != null && Number.isFinite(opts.landFraction)) {
    return Math.max(0.15, Math.min(0.85, opts.landFraction));
  }
  return defaultLandFractionForTyp(typ);
}
function resolveWorldGenNumbers(opts) {
  const wd = opts?.worldDensity ?? DEFAULT_WORLD_DENSITY;
  const reliefTier = wd.relief ?? wd.rivers ?? "medium";
  const mapLabel = opts?.mapSizeMenuLabel ?? "Standardowy";
  const resourceBaseline = opts?.worldDensity ? RESOURCE_BASELINE_RARITY_MULT : 1;
  return {
    resourceMult: densityMultiplier(wd.resources),
    resourceBaseline,
    maxRivers: maxRiversForMapAndDensity(mapLabel, wd.rivers),
    desertThreshold: desertNoiseThresholdFromTier(wd.desert),
    forestThreshold: forestNoiseThresholdFromTier(wd.forest),
    mountainThreshold: mountainNoiseThresholdFromTier(reliefTier),
    highlandThreshold: highlandNoiseThresholdFromTier(reliefTier),
    riverTrace: resolveRiverTraceForMap(mapLabel, wd.rivers)
  };
}
var MAX_MIAST_PANSTWA = 9;
function clampMiastaPanstwaCount(raw) {
  const n = Math.floor(Number(raw));
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, MAX_MIAST_PANSTWA);
}
function maxCivTypesForStartEpoch(epochId, civRoster) {
  return civIdsAvailableAtGameEpoch(civRoster, epochId).length;
}
var MAP_MENU_TIER_ORDER = [
  "malenki",
  "maly",
  "standardowy",
  "duzy",
  "ogromny",
  "superogromny"
];
var MIASTA_PANSTWA_MENU_BY_TIER = [
  { min: 2, default: 3, max: 4 },
  { min: 3, default: 4, max: 5 },
  { min: 4, default: 5, max: 7 },
  { min: 5, default: 6, max: 8 },
  { min: 6, default: 7, max: MAX_MIAST_PANSTWA },
  { min: 7, default: 8, max: MAX_MIAST_PANSTWA }
];
var EPOCH_CIV_TYPE_POOL = {
  kamien: 8,
  braz: 14,
  zelazo: 15
};
function normStartEpochId(epochId) {
  const n = (epochId ?? "kamien").toLowerCase().replace(/ł/g, "l").trim();
  if (n === "braz" || n === "bronz") return "braz";
  if (n === "zelazo" || n === "iron") return "zelazo";
  return "kamien";
}
function tripleFromDefault(def, pool) {
  const max = Math.min(def + 1, pool);
  let min = Math.max(1, def - 1);
  let adjustedDef = Math.min(Math.max(def, 1), pool);
  if (min >= max) min = Math.max(1, max - 1);
  if (adjustedDef <= min) adjustedDef = Math.min(min + 1, max);
  if (adjustedDef >= max) adjustedDef = Math.max(min + 1, max - 1);
  return { min, default: adjustedDef, max };
}
var TYPY_CYWILIZACJI_DEFAULT_BY_TIER = {
  kamien: [3, 4, 5, 6, 7, 8],
  braz: [4, 5, 6, 9, 11, 13],
  zelazo: [4, 5, 6, 10, 12, 14]
};
function fallbackTypyTriple(menuLabel, epochId) {
  const tierIdx = mapMenuTierIndex(menuLabel);
  const pool = EPOCH_CIV_TYPE_POOL[epochId];
  const def = TYPY_CYWILIZACJI_DEFAULT_BY_TIER[epochId][tierIdx] ?? TYPY_CYWILIZACJI_DEFAULT_BY_TIER[epochId][2];
  return tripleFromDefault(def, pool);
}
function civTypesTripleForMapLabel(menuLabel, epochId = "kamien") {
  const ep = normStartEpochId(epochId);
  const fromE = eStartTypyCywilizacjiPerEpoka(menuLabel, ep);
  if (fromE) {
    return {
      min: fromE.min,
      default: fromE.default,
      max: fromE.max
    };
  }
  const legacy = eStartTypyCywilizacji(menuLabel);
  if (legacy != null && legacy > 0) {
    return tripleFromDefault(legacy, EPOCH_CIV_TYPE_POOL[ep]);
  }
  return fallbackTypyTriple(menuLabel, ep);
}
function mapMenuTierIndex(menuLabel) {
  const idx = MAP_MENU_TIER_ORDER.indexOf(rozmiarFromMenuLabel(menuLabel));
  return idx >= 0 ? idx : 2;
}
function miastaPanstwaTriple(menuLabel) {
  return MIASTA_PANSTWA_MENU_BY_TIER[mapMenuTierIndex(menuLabel)] ?? MIASTA_PANSTWA_MENU_BY_TIER[2];
}
function typyCywilizacjiTriple(menuLabel, epochId = "kamien") {
  return civTypesTripleForMapLabel(menuLabel, epochId);
}
function defaultMiastaPanstwaFromMapLabel(menuLabel) {
  const fromE = eStartMiastaPanstwa(menuLabel);
  if (fromE != null && fromE > 0) return clampMiastaPanstwaCount(fromE);
  return miastaPanstwaTriple(menuLabel).default;
}
function defaultCivTypesFromMapLabel(menuLabel, epochId = "kamien", civRoster) {
  let def = typyCywilizacjiTriple(menuLabel, epochId).default;
  if (civRoster && civRoster.length > 0) {
    def = Math.min(def, maxCivTypesForStartEpoch(epochId, civRoster));
  }
  return Math.max(1, def);
}

// src/map/earth-land-mask.generated.ts
var EARTH_MASK_W = 720;
var EARTH_MASK_H = 400;
var EARTH_MASK_BBOX = {
  minX: 0.0723,
  minY: 0.0551,
  maxX: 0.9917,
  maxY: 0.7243
};
var EARTH_MASK_ROWS = [
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111100001111111111111111100000011111111110000000111111111111111111110000000000000000000000000001111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111000000000000000000011111100000000000001111111111111111111111111111111111111111111111111111111111111111000000000000000011111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111000011111111111111111100000000001111110000001111111111111111111111100000000000000000000000000111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111110000000000000000011111111100000111111111111111111111111111111111111111111111111111111111111111111111111000000000000111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011100000011111111111111111110000000000111110000011111111111111111111111111000000000000000000000000011111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111000000000000000011111111100011111111111111111111111111111111111111111111111111111111111111111111111111110000000001111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111110000000000000000000000000000000000000000000000000000011111111111111111110000000000111110000011111111111111111111111111110000000000000000000000011111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000011111111111110000000000000000000000000000000111111100000000000000011111111101111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111110011100000000000000000000000000000000000000001111111111111111110000000001111110000000011111111111111111111111111000000000000000000000011111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000001111111111111111100000000000000000000000000000000000000011110000000011111111001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111000000000000000000000000000000000000001111111111111111100000000001111111000000011111111111111111111111111100000000000000000010111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000111111111111111111111000000000000000000000000000000000000111111100000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111101111111111111111111100000001111111111111111000001110011111111000000111111100000111111111111111110000000000000000000011111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000001111111111111111111111111111111100000000000000001110000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111110001111101111111000000000000111111111100011111111000000111111111111111110000000000000000000111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111000001110001111111111111111111111111111111111111011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111110000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111110000000001111111000001111011111111111111111111110000001111111111111111111000000000000000011111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111100001111111111111111111111111111111111111111110001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111100000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111000000111111111110111111111111111111111111111100000001110011111111111111000000000000000111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111011111111111111111111111111111111111111111110011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111110000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000011111111111111100000000000000111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111110011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000111111111111111110000000000000111111111111111111111111111100000000000000001110000011110000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111110111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000011111111111111111100000000000000111111111111111111111111111000000000000000011111101111111000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111110000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000111111111111111111000000000000000111111111111111111111100000000000000000000111111111111111000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111100000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000011001111111111111000000000000000000000111111111111111111110000000000000000000000111111111111111000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111011111110000000100000111111111111000000000000000000000111111111111111111000000000000000000000000111111111111111000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100001111111000000000000011111111111000000000000000000000011111111111111100000000000000000000000000011111111111110000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000001111111111000000000000000000000011111111111111100000000000000000000000000001111111100000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000111111111000000000000000000000011111111111111000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000011000000000000000000011110000000000000000000000000011111111111110000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111101111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000001111111111000000001000000000000000000000000011111111111110000000000000000000000000000000000000000000000000000011000000000000000001111111111111111111111000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000011111111111100000000000000000000000000000000001111111111100000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111110000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000011111111111110000000000000000000000000000000000001111111000000000000000000000000000000000000000000000000000000000000000010000000011111111111111111111110000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000111110111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000111111111111110000000000000000000000000000000000000011110000000000000000000000000000000000000000000000000000000000000000010000000001111111111111111111111000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000001100011111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000111111111111111111111111110000000111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000011111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000001111111111111110000111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000011111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111100000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000011111111111111111011111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111000000000000000111111111111111111111000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111110000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000011111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111110000000000000111111111111111111110000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111110000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000011111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111100000000000000000001111111111110000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111100000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000001111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111100000000000000000011111111111100100001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000011111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111100000000000000000111111111111100100001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000011111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111110000000000000001111111111111100000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111110000000000001001111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111110000000000000011111111111111000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111000000000000011111111111110000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000110000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111000000001111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111000000000000011111111111110000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000011111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111100000011111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111100000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000001111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111100000111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111100000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111100000111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111110000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000001111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111100001111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111110000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111100001111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000011111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111100011111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111100111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000001111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111110111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000111111100111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000011111000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000011000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110011100000000111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110011110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000001111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111011110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111001110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000001111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000011111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000001111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000011111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111110111111111111111111111111000011111111111110111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111100011111110111111111111111111111100000111111111111100011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111000001111110111111111111111111111000000111111111111000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111000000111100011111111111111111111000000111111111111100011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100011111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111110000000000000001111111111111111111000000111111111111110111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000001111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111110000000000000000011111111111111111100000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111101111111111111111111111111111111111100000000000000000000111111111111111100000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111000000011111111111100111111111111111111111100000000000000000000011111111111111110000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111100000000011111111111110001111111111111111111110000000000000000000001111111111111111000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110011100000000000111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111000000000011111111111111100111111111111111111111000000000000000000001111111111111111000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111110000000000011100111111111111111111111111111111111111111111111111000111111111111111111100000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000011111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111100000000000011100001111111111111111111111111111111111111111111111111111111111111111111100000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000001110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111000000000000011100000011111111111111111111111111111111111111111111111111111111111111111110000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111000000000000011100000000111111111111111111101111111111111111111111111111111111111111111110000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111110001000000000011100000000011111111111111111000011111111111111111111111111111111111111111110000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111001111111111111100000000000000000000111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111110000000000000011000000000011111100011111111000011111111111111111111111111111111111111111110000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000111111110000000000000000000111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111110000000000000010000000000111111000001111111000001111111111111111111111111111111111111111100000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000011111110000000000000000000111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111100000000000000000000000111111110000001111111000001111111111111111111111111111111111111111110000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000001111111000000000000000000011110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111000000000000000000000000111111100000000111111000001111111111111111111111111111111111111111111000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000011111111100000000000000000111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111110000000000000000000000000111111000000000011111000000111111111111111111111111111111111111111111110000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000011111111110000000000000000111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111100000000000000001111100000011111000000000001110000000011111111111111111111111111111111111111111111110111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000011111111000000000000001111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111000000001111111111111111110000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000001111111100000000000011111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000111111100000000000111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000111111110000000011111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111011111111111111111111111111000000000000000000000000111110000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000111111110000011111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000011110000000111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000011000000001111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111100000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000010000000001111111011110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000001111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111000000000000011100000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000001111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111100000000000111111000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111110000000001111111110000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111100000001111111111100000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111000001111111111111000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111011111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011100111111111111111111111111111111111111111111111100000000011111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001110011111111111111111111111111111111111100111111000000000000111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001110011111111111111111111111111111111110000000000000000000000111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111011111111111111111111111111111111000000000000000000000000011110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111001111111111111111111111111111110000000000000000000000000011110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111000111111111111111111111111111000000000000000000000000000011110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111001111111111111111111111111111000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111000011111111111111111111111111000000000000000000000000000011110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000111111111111111111111111111100011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111100011111111111111111111111110000000000000000000000000000011110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000011111111111111111111111111100000011111011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011100001111111111111111111111110000000000000000000000000000011110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100011111111111111111111111111110000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011100001111111111111111111111110000000000000000000000000000001110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100001111111111111111111111111110000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001110000111111111111111111111110000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110001111111111111111111111111111000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001110000111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000111111111111111111111111111000000001110000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111000011111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000011111111111111111111111111110000111111000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000011000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111000001111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000001111111111111111111111111111111111111100000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000011000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011000001111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100001111111111111111111111111111111111111111000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000011000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000111111111111111111111111111111111111111100000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000011000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111000000000000000000000000001100011100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000111111111111111111111111111111111111111110000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000011000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111000000000000000000000000010000011111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000011111111111111111111111111111111111111111000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111000000000000000000000000000000000111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000011111111111111111111111111111111111111111000000000000000000011111111111111111111111111111111111111100011111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111000000000000000000000000000000000001111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000001111111111111111111111111111111111111111000000000000000000001111111111111111111111111111111111110000001111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111100000000000001111100000000000000000111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000001111111111111111111111111111111111111110000000000000000000000111111111111111111111111111111111000000000111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111100000000000011111100000000000000000011111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000111111111111111111111111111111111111100000000000000000000000000011111111111111111111111111110000000000111111111111111111111111111111100111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111110000000000111111100000000000000000001111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000111111111111111111111111111111111111000000000000000000000000000001111111111111111111111111100000000000011111111111111111111111111110000011110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111110000000001111111100000000000000000000000000001111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000011111111111111111111111111111111111000000000000000000000000000001111111111111111111111111000000000000001111111111111111111111111110000011100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111000000011111111000000000000000000000000000001111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000001111111111111111111111111111111110000000000000000000000000000001111111111111111111111111000000000000000111111111111111111111111100000011100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111100001111111111000000000000000000000000000001111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000001111111111111111111111111111111100000000000000000000000000000001111111111111111111111110000000000000000011111111111111111111111110000011100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111110000000000000000000000000001001111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000111111111111111111111111111111000000000000000000000000000000001111111111111111111111100000000000000000001111111111111111111111110000011100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000011111111111111111111111111110000000000000000000000000000000000111111111111111111111000000000000000000001111111111111111111111111000000000000000000000000000011100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000001111111111111111111111111100000000000000000000000000000000000111111111111111111110000000000000000000000111111111111111111111111000000000000000000000000000011110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000001111111111111111111111110000000000000000000000000000000000000111111111111111111100000000000000000000000111111111111111111111111100000000000000000000000000111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000111111111111111111111000000000000000000000000000000000000000111111111111111111000000000000000000000000111111111111111111111111110000000000000000000000000111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000111111111111111111110000000000000000000000000000000000000000011111111111111110000000000000000000000000111000111111111111111111111000000000000000000000000111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000011111111111111111100000000000000000000000000000000000000000011111111111111100000000000000000000000000000000011111111111111111111100000000000000000000000111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000011111111111111111000000000000000000000000000000000000000000001111111111111000000000000000000000000000000000011111111111111111111110000000000000000000000111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000011111111111111110000000000000000000000000000000000000000000001111111111111000000000000000000000000000000000011111111111111111111111000000000000000000000011100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100011111111111111000000000000000000000000000000000000000000000000111111111110000000000000000000000000000000000001111111111111111111111100000000000000000000001100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000111111111110000000000000000000000000000000000001111111111111111111111100000000000000000000000001110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000111111111110000000000000000000000000000000000001111111111111111111111100000000000000000000000000110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000011111111110000000000000000000000000000000000001111111111111111111111100000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000011111111110000000000000000000000000100000000000111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000001111111110000000000000000000000000100000000000111100011111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111000000000000000000011111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000001111111110000000000000000000000000100000000000011000000111111111111100000000000000000000000000000111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111000000000000000001111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000011111111000000000000000000000000000000000000000000000000111111110000000000000000000000000000000000000011000000011111111111000000000000000000000000001101111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111000000000000000011111111111111111111001111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111101111111111111000000000000000000000000000000000000000000000000111111110000000000000000000000000000000000000011000000000111111110000000000000000000000000000001111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111100000000000000111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000011111110000000000000000000000000000000000000011000000000011111100000000000000000000000000000011111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111000000000001111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000011111110000000000000000000000000000000000000011100000000001110000000000000000000000000000000011110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111110010110001111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000001111100000000000000000000000000000000000000011100000000000000000000000000000000000000000000011000110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111100111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000111000110000000000000000000000000000000000011100000000000000000000000000000000000000000000000001111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111100111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000010000111000000000000000000000000000000000011110000000001000000000000000000000000000000000000111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111000011111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000111000000000000000000000000000000000001110000000000000000000000000000000000000000000001111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000111000000000000000000000000000000000000111000000000000000000000000000000000000000000000111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000111000000000000000000000000000000000000011100000000000000000000000000000000000000001000011111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000111000000000000000000000000000000000000011110000000000000000000000000000000000000000000001111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111110011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000001111000000000000000000000000000011100000000000000110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111100000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111100000000000000000000000000111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111110011111110000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111110000000000000000000000001111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111000001111110000000000000000000000011111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111100000111110000000000000000000000111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111110000111111000000000000000000001111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111000111111000000000000000000111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111100111111000000000000000011111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111110011111000000000000000111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111000000000000001111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111000000000000111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111110000000000001111111111111111111000000000000000000111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111110000000000001111111111111111111000000000000000000111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111110000000000001111111111111111111000011111111000000110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000001111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111000000000001111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000011111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111100000000001111111111111111110001100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000011111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111110000000001111111111111111100011110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111110000000000111111111111111000011111110000000000000000011111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111100000000111111111111111000011111100000100000000000001111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111000000011111111111110000011111100000000000000000000111100000111111100000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111000000001111111111110000011111110000000000000000000011111011111111111000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111000000000111111111100000011111110000000000010000000011111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111110000000000000011111100000011111110000000000000000100011111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111110000000000000000111100000011111110000000000000000100001111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111100000000000000000000000000011111110000000000000000000000111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111110000000000000000000000000001110000000000000000000000000000011111111111111111110000000000000100000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111110000000000000000000000000000000000000000000000000000000000000111111111111111111000000000001000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111100000000000000000000000000000000000000000000000000000000000001111111111111111100000000011000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111000000000000000000000000000000000000000000000000000000000001111111111111111110000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111110000000000000000000000000000000000000000000000000000000000111111111111111111000000000000000010000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111100000000000000000000000000000000000000000000000000000000111111111111111111100000000000000010000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111110000000000000000000000000000000000000000000000000111111111111111111100000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111000000000000000000000000000000000000000000000000111111111111111111110000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111011100000000001000000000000000000000000011111111110001111110000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111001110000000001000000000000000000000000000111111000000111111000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000011111100000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000110000000000000000000000000000000000000000000001111100000000000000000000100000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000110000000000000000000000000000000000000000000000111100000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000110000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111000000000001110000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111110000000000000000011000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111000000000001110000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111110000000000000000111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111000000000001111000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111110000000000000001111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111000000000011111000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111110000000000000011111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111000001111111111111000000000011111100000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111110000000000000111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111110001111111111110000000000011111100000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111110000000000011111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111000000000011111110000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111100000000000111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111000000000011111110000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111000000000001111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111100000000111111110000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111110000000000011111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111110000000111111110000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111100000000000111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111000001111111110000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111000000000001111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111110001111111110000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111110000000000001111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000001100000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111000000000000001111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000001100000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111110000000000000001111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111100000000000000001111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111100000000000000000111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111000000000000000001111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111000000000000000001111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111110000000000000000011111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000011000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111110000000000000000011111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111110000000000000000011111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111110000000000000000011111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000010000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111110000000000000000011111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111110000000000000000011111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111110000000000000000011111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111110000000000000000011111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111100000000000000000011111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111000000000000000000001111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111100000111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111000000000000001111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111100000000000000000111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111110000000000000000000011111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111000000000000000000000000000000001111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111100000000000000000000000000000000000111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111110000000000000000000000000000000000001111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111100000000000000000000000000000000000000000001000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111000000000000000000000000000000000000000000001000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111100000000000000000000000000000000000000000000000010000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111000000000000000000000000000000000000000000000000110000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111100000000000000000000000000000000000000000000000001111000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111110000000000000000000000000000000000000000000000000011111100000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111110000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111100000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111100000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111000000000000000000000000000000000000000000000111001110000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111000000000000000000000000000000000000000000011111000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111000000000000000000000000000000000000000000111110000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111110000000000000000000000000000000000000000001111100000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011110000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111110000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111100000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111110000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011110000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
];

// src/map/earth-land-mask.ts
var EARTH_PLAYABLE_BORDER = 2;
var EARTH_POLAR_OCEAN_REF_ROWS = 30;
var EARTH_POLAR_OCEAN_REF_INNER_H = 115;
function earthNorthOceanRows(height) {
  return earthPolarOceanRows(height);
}
function earthSouthOceanRows(height) {
  return earthPolarOceanRows(height);
}
function earthPolarOceanRows(height) {
  const innerH = earthPlayableInnerHeight(height);
  const scaled = Math.round(EARTH_POLAR_OCEAN_REF_ROWS * innerH / EARTH_POLAR_OCEAN_REF_INNER_H);
  const cap = Math.max(
    EARTH_POLAR_OCEAN_REF_ROWS,
    Math.round(innerH * 0.12)
    // max ~12% wysokości na biegun
  );
  return Math.max(2, Math.min(scaled, cap));
}
function earthPlayableInnerHeight(height) {
  const b = EARTH_PLAYABLE_BORDER;
  return Math.max(1, height - 1 - 2 * b);
}
function earthPlayableInnerWidth(width) {
  const b = EARTH_PLAYABLE_BORDER;
  return Math.max(1, width - 1 - 2 * b);
}
function earthLandMapRows(height) {
  const innerH = earthPlayableInnerHeight(height);
  const polar = earthPolarOceanRows(height);
  return Math.max(1, innerH - polar * 2);
}
function bitAt(x, y) {
  const xi = Math.min(EARTH_MASK_W - 1, Math.max(0, x));
  const yi = Math.min(EARTH_MASK_H - 1, Math.max(0, y));
  const row = EARTH_MASK_ROWS[yi];
  if (!row || row.length <= xi) return 0;
  return row[xi] === "1" ? 1 : 0;
}
function sampleEarthTemplateLand(nq, nr) {
  if (nq < 0 || nq > 1 || nr < 0 || nr > 1) return 0;
  const fx = nq * (EARTH_MASK_W - 1);
  const fy = nr * (EARTH_MASK_H - 1);
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const x1 = Math.min(EARTH_MASK_W - 1, x0 + 1);
  const y1 = Math.min(EARTH_MASK_H - 1, y0 + 1);
  const tx = fx - x0;
  const ty = fy - y0;
  const v = (1 - tx) * (1 - ty) * bitAt(x0, y0) + tx * (1 - ty) * bitAt(x1, y0) + (1 - tx) * ty * bitAt(x0, y1) + tx * ty * bitAt(x1, y1);
  return v >= 0.45 ? 1 : 0;
}
function earthHexToTemplateNorm(q, r, width, height) {
  const b = EARTH_PLAYABLE_BORDER;
  if (q < b || r < b || q >= width - b || r >= height - b) return null;
  const innerW = earthPlayableInnerWidth(width);
  const innerH = earthPlayableInnerHeight(height);
  const north = earthNorthOceanRows(height);
  const south = earthSouthOceanRows(height);
  const relR = r - b;
  if (relR < north) return null;
  if (relR >= innerH - south) return null;
  const landRows = earthLandMapRows(height);
  const pr = (relR - north) / Math.max(1, landRows - 1);
  const pq = (q - b) / innerW;
  const { minX, minY, maxX, maxY } = EARTH_MASK_BBOX;
  return {
    nq: minX + pq * (maxX - minX),
    nr: minY + pr * (maxY - minY)
  };
}
function earthSubsampleGrid(width, height) {
  const inner = Math.min(width, height) - 2 * EARTH_PLAYABLE_BORDER;
  if (inner >= 420) return 1;
  if (inner >= 220) return 3;
  if (inner >= 110) return 5;
  return 7;
}
function earthLandFractionThreshold(width, height) {
  const inner = Math.min(width, height) - 2 * EARTH_PLAYABLE_BORDER;
  if (inner >= 320) return 0.45;
  if (inner >= 160) return 0.38;
  if (inner >= 80) return 0.32;
  return 0.26;
}
function earthTemplateLandAt(q, r, width, height) {
  const t = earthHexToTemplateNorm(q, r, width, height);
  if (!t) return 0;
  const innerW = earthPlayableInnerWidth(width);
  const { minX, minY, maxX, maxY } = EARTH_MASK_BBOX;
  const cellW = (maxX - minX) / innerW;
  const cellH = (maxY - minY) / Math.max(1, earthLandMapRows(height));
  const steps = earthSubsampleGrid(width, height);
  if (steps <= 1) return sampleEarthTemplateLand(t.nq, t.nr);
  let landHits = 0;
  const total = steps * steps;
  for (let sy = 0; sy < steps; sy++) {
    for (let sx = 0; sx < steps; sx++) {
      const nq = t.nq - cellW * 0.5 + (sx + 0.5) / steps * cellW;
      const nr = t.nr - cellH * 0.5 + (sy + 0.5) / steps * cellH;
      if (sampleEarthTemplateLand(nq, nr)) landHits++;
    }
  }
  return landHits / total >= earthLandFractionThreshold(width, height) ? 1 : 0;
}

// src/map/gen-helpers.ts
function mulberry32(seed) {
  let s = seed >>> 0;
  return () => {
    s += 1831565813;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function buildPermTable(rand) {
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = p[i];
    p[i] = p[j];
    p[j] = tmp;
  }
  return p;
}
function cosLerp(a, b, t) {
  const f = (1 - Math.cos(t * Math.PI)) * 0.5;
  return a * (1 - f) + b * f;
}
function valueNoise2D(p, x, y) {
  const xi = Math.floor(x) & 255;
  const yi = Math.floor(y) & 255;
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);
  const hash = (ix, iy) => p[p[ix & 255] + iy & 255] / 255;
  const v00 = hash(xi, yi);
  const v10 = hash(xi + 1, yi);
  const v01 = hash(xi, yi + 1);
  const v11 = hash(xi + 1, yi + 1);
  const top = cosLerp(v00, v10, xf);
  const bottom = cosLerp(v01, v11, xf);
  return cosLerp(top, bottom, yf);
}
function fbm(p, x, y, octaves = 4) {
  let value = 0, amplitude = 0.5, frequency = 1, maxValue = 0;
  for (let i = 0; i < octaves; i++) {
    value += valueNoise2D(p, x * frequency, y * frequency) * amplitude;
    maxValue += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }
  return value / maxValue;
}
var HEX_DIRECTIONS = [
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, 0],
  [-1, 1],
  [0, 1]
];
function hexDistanceAxial(aq, ar, bq, br) {
  const dq = Math.abs(aq - bq);
  const dr = Math.abs(ar - br);
  const ds = Math.abs(-aq - ar - (-bq - br));
  return Math.max(dq, dr, ds);
}
function hexKey(q, r) {
  return `${q},${r}`;
}
var CLIMATE_POLAR_FRAC = 0.05;
var CLIMATE_DESERT_HALF_ROWS = 3.5;
var CLIMATE_DESERT_HALF_FRAC = CLIMATE_DESERT_HALF_ROWS / 108;
var CLIMATE_PLAINS_HALF_FRAC = 0.075;
var CLIMATE_PROCEDURAL_LAT_BUFFER_FRAC = 0.05;
function climateBandAt(_q, r, height, isEarth = false) {
  const buf = latitudinalOceanBufferRows(height, isEarth);
  const innerH = Math.max(1, height - 2 * buf);
  const relR = (r - buf) / Math.max(1, innerH - 1);
  if (relR < 0 || relR > 1) {
    return r < height / 2 ? "polar_north" : "polar_south";
  }
  const desertHalfFrac = CLIMATE_DESERT_HALF_ROWS / innerH;
  const center = 0.5;
  const desertLo = center - desertHalfFrac;
  const desertHi = center + desertHalfFrac;
  const plainsNorthLo = desertLo - CLIMATE_PLAINS_HALF_FRAC;
  const plainsSouthHi = desertHi + CLIMATE_PLAINS_HALF_FRAC;
  if (relR < CLIMATE_POLAR_FRAC) return "polar_north";
  if (relR < plainsNorthLo) return "temperate_north";
  if (relR < desertLo) return "plains_north";
  if (relR < desertHi) return "desert";
  if (relR < plainsSouthHi) return "plains_south";
  if (relR < 1 - CLIMATE_POLAR_FRAC) return "temperate_south";
  return "polar_south";
}
function isPolarClimateBand(band) {
  return band === "polar_north" || band === "polar_south";
}
function latitudinalOceanBufferRows(height, isEarth) {
  if (isEarth) return earthPolarOceanRows(height);
  return Math.max(2, Math.round(height * CLIMATE_PROCEDURAL_LAT_BUFFER_FRAC));
}
function isInLatitudinalOceanBuffer(r, height, isEarth) {
  const buf = latitudinalOceanBufferRows(height, isEarth);
  return r < buf || r >= height - buf;
}
function canAssignClimateDesert(band) {
  return band === void 0 || band === "desert";
}
function defaultShapeParams(rand) {
  return {
    noiseScale: 0.13,
    mountainScale: 0.22,
    forestScale: 0.19,
    desertScale: 0.17,
    offMtnX: rand() * 500,
    offMtnY: rand() * 500,
    offForX: rand() * 500,
    offForY: rand() * 500,
    offDesX: rand() * 500,
    offDesY: rand() * 500
  };
}
var KONTYNENTY_ZONE_COUNT = 5;
function continentCenterCount(width, height, typ) {
  if (typ === "kontynenty") return KONTYNENTY_ZONE_COUNT;
  const area = width * height;
  return area < 2e3 ? 2 : area < 6e3 ? 3 : 4;
}
function buildContinentCenters(rand, n, opts) {
  const radiusMin = opts?.radiusMin ?? 0.28;
  const radiusMax = opts?.radiusMax ?? 0.4;
  const minDist = opts?.minCenterDist ?? 0;
  const w = opts?.width ?? 120;
  const h = opts?.height ?? 80;
  const borderMargin = Math.max(
    mapBorderWidth(w, h) / Math.max(1, w - 1),
    mapBorderWidth(w, h) / Math.max(1, h - 1),
    0.12
  );
  const clamp01 = (v) => Math.max(borderMargin, Math.min(1 - borderMargin, v));
  const centers = [];
  const pushCenter = (nq, nr, radius) => {
    const cnq = clamp01(nq);
    const cnr = clamp01(nr);
    if (minDist > 0) {
      for (const c of centers) {
        if (Math.hypot(cnq - c.nq, cnr - c.nr) < minDist) return false;
      }
    }
    centers.push({
      nq: cnq,
      nr: cnr,
      radius: radius ?? radiusMin + rand() * (radiusMax - radiusMin)
    });
    return true;
  };
  if (opts?.anchorCenter !== false && n >= 1) {
    pushCenter(0.5, 0.5, radiusMin + (radiusMax - radiusMin) * 0.5);
  }
  const ringRMin = opts?.ringRadiusMin ?? 0.16;
  const ringRMax = opts?.ringRadiusMax ?? 0.32;
  const ringSlots = n - centers.length;
  for (let i = 0; i < ringSlots; i++) {
    let placed = false;
    for (let attempt = 0; attempt < 40 && !placed; attempt++) {
      const angle = 2 * Math.PI * i / Math.max(1, ringSlots) + (rand() - 0.5) * 0.45;
      const ringR = ringRMin + rand() * (ringRMax - ringRMin);
      if (pushCenter(0.5 + Math.cos(angle) * ringR, 0.5 + Math.sin(angle) * ringR)) {
        placed = true;
      }
    }
    if (!placed) {
      pushCenter(
        borderMargin + rand() * (1 - 2 * borderMargin),
        borderMargin + rand() * (1 - 2 * borderMargin)
      );
    }
  }
  return centers;
}
function buildFiveZoneContinentCenters(rand, width, height, radiusMin, radiusMax) {
  const borderMargin = Math.max(
    mapBorderWidth(width, height) / Math.max(1, width - 1),
    mapBorderWidth(width, height) / Math.max(1, height - 1),
    0.14
  );
  const clamp01 = (v) => Math.max(borderMargin, Math.min(1 - borderMargin, v));
  const jitter = () => (rand() - 0.5) * 0.035;
  const pickR = () => radiusMin + rand() * (radiusMax - radiusMin);
  const inset = borderMargin + 0.06;
  return [
    { nq: clamp01(0.5 + jitter()), nr: clamp01(0.5 + jitter()), radius: pickR() },
    { nq: clamp01(inset + jitter()), nr: clamp01(inset + jitter()), radius: pickR() },
    { nq: clamp01(1 - inset + jitter()), nr: clamp01(inset + jitter()), radius: pickR() },
    { nq: clamp01(1 - inset + jitter()), nr: clamp01(1 - inset + jitter()), radius: pickR() },
    { nq: clamp01(inset + jitter()), nr: clamp01(1 - inset + jitter()), radius: pickR() }
  ];
}
function nearestContinentZoneIndex(nq, nr, centers) {
  let bestI = 0;
  let bestD = Infinity;
  for (let i = 0; i < centers.length; i++) {
    const c = centers[i];
    const d = Math.hypot(nq - c.nq, nr - c.nr);
    if (d < bestD) {
      bestD = d;
      bestI = i;
    }
  }
  return bestI;
}
function secondNearestContinentDist(nq, nr, centers) {
  const dists = centers.map((c) => Math.hypot(nq - c.nq, nr - c.nr)).sort((a, b) => a - b);
  return dists[1] ?? Infinity;
}
function landMaskKontynenty(q, r, width, height, centers, perm, noiseScale) {
  const nq = q / (width - 1);
  const nr = r / (height - 1);
  const borderFade = landMaskBorderFade(q, r, width, height);
  const edgeRect = mapEdgeRectFade(q, r, width, height);
  if (borderFade <= 0 || edgeRect <= 0) return 0;
  const zoneIdx = nearestContinentZoneIndex(nq, nr, centers);
  const c = centers[zoneIdx];
  const distC = Math.hypot(nq - c.nq, nr - c.nr);
  const dist2 = secondNearestContinentDist(nq, nr, centers);
  if (dist2 - distC < 0.018) return 0;
  const radial = Math.max(0, 1 - Math.pow(distC / c.radius, 1.55));
  const warpCoarse = fbm(perm, q * noiseScale * 0.55 + 100, r * noiseScale * 0.55 + 100, 4) * 0.24;
  const warpFine = fbm(perm, q * noiseScale * 1.45 + 510, r * noiseScale * 1.45 + 510, 3) * 0.16;
  const angle = Math.atan2(nr - c.nr, nq - c.nq);
  const angleNoise = fbm(perm, Math.cos(angle) * 4 + zoneIdx * 11, Math.sin(angle) * 4 + 220, 2) * 0.1;
  return Math.min(1, Math.max(0, (radial + warpCoarse + warpFine + angleNoise - 0.09) * borderFade * edgeRect));
}
function mapIsotropicFromCenter(q, r, width, height) {
  const maxDim = Math.max(1, width - 1, height - 1);
  return {
    x: (q - (width - 1) / 2) / maxDim,
    y: (r - (height - 1) / 2) / maxDim
  };
}
function normToIsotropic(nq, nr, width, height) {
  const maxDim = Math.max(1, width - 1, height - 1);
  return {
    x: (nq - 0.5) * (width - 1) / maxDim,
    y: (nr - 0.5) * (height - 1) / maxDim
  };
}
function pangeaLandT(landFraction) {
  return Math.max(0, Math.min(1, (landFraction - 0.15) / 0.7));
}
function pangeaLandLayoutParams(landFraction, width, height) {
  const t = pangeaLandT(landFraction);
  const mapScale = Math.sqrt(width * height / 20160);
  const sizeBoost = Math.min(0.06, Math.max(0, (mapScale - 1) * 0.04));
  const highLand = Math.max(0, (t - 0.55) / 0.45);
  const lowLand = Math.max(0, 1 - t / 0.45);
  const ringPull = 0.02 + sizeBoost * 0.55 + highLand * 0.04 + lowLand * 0.03;
  return {
    // Przy niskim % lądu: mniej blobów, wszystkie w centrum — daleki pierścień = donut.
    nBlobs: t < 0.28 ? 2 : t < 0.55 ? 4 : 6,
    blobRadiusMin: 0.1 + t * 0.11 + sizeBoost * 0.45,
    blobRadiusMax: 0.16 + t * 0.18 + sizeBoost * 0.9,
    ringRMin: Math.max(5e-3, 0.012 + t * 0.02 + sizeBoost * 0.06 - ringPull),
    ringRMax: Math.max(0.02, 0.035 + t * 0.07 + sizeBoost * 0.16 - ringPull * 1.2),
    clusterRadius: 0.18 + t * 0.36 + sizeBoost,
    threshold: 0.17 - t * 0.1,
    mergeSum: 0.36 + t * 0.16 + sizeBoost * 0.12 + highLand * 0.08,
    mergeMax: 0.22 + t * 0.18 + sizeBoost * 0.06 + highLand * 0.06,
    globalWarp: 0.04 + t * 0.22,
    // FALA 195: valley NIE może być najwyższe przy niskim % — to rzeźbiło moat rdzeń↔obręcz.
    valley: Math.max(0.015, 0.045 + t * 0.025 - lowLand * 0.02),
    fillMinScore: 0.03 + t * 0.08
  };
}
function buildPangeaBlobCenters(rand, width, height, landFraction) {
  const layout = pangeaLandLayoutParams(landFraction, width, height);
  const borderMargin = Math.max(
    mapBorderWidth(width, height) / Math.max(1, width - 1),
    mapBorderWidth(width, height) / Math.max(1, height - 1),
    0.12
  );
  const clamp01 = (v) => Math.max(borderMargin, Math.min(1 - borderMargin, v));
  const jitter = () => (rand() - 0.5) * 0.028;
  const pickR = () => layout.blobRadiusMin + rand() * (layout.blobRadiusMax - layout.blobRadiusMin);
  const maxDim = Math.max(1, width - 1, height - 1);
  const nBlobs = layout.nBlobs;
  const centers = [];
  centers.push({
    nq: clamp01(0.5 + jitter()),
    nr: clamp01(0.5 + jitter()),
    radius: pickR()
  });
  const ringSlots = nBlobs - 1;
  const pickRRing = () => {
    const span = layout.blobRadiusMax - layout.blobRadiusMin;
    return layout.blobRadiusMin * 1.06 + rand() * span * 1.12;
  };
  for (let i = 0; i < ringSlots; i++) {
    const angle = 2 * Math.PI * i / ringSlots + (rand() - 0.5) * 0.45;
    const ringR = layout.ringRMin + rand() * (layout.ringRMax - layout.ringRMin);
    const ix = Math.cos(angle) * ringR;
    const iy = Math.sin(angle) * ringR;
    centers.push({
      nq: clamp01(0.5 + ix * maxDim / (width - 1) + jitter()),
      nr: clamp01(0.5 + iy * maxDim / (height - 1) + jitter()),
      radius: pickRRing()
    });
  }
  return centers;
}
function pangeaBlobScore(q, r, width, height, c, zoneIdx, perm, noiseScale) {
  const p = mapIsotropicFromCenter(q, r, width, height);
  const cIso = normToIsotropic(c.nq, c.nr, width, height);
  const distC = Math.hypot(p.x - cIso.x, p.y - cIso.y);
  const radial = Math.max(0, 1 - Math.pow(distC / c.radius, 1.55));
  const warpCoarse = fbm(perm, q * noiseScale * 0.55 + 100 + zoneIdx * 37, r * noiseScale * 0.55 + 100, 4) * 0.24;
  const warpFine = fbm(perm, q * noiseScale * 1.45 + 510 + zoneIdx * 17, r * noiseScale * 1.45 + 510, 3) * 0.16;
  const angle = Math.atan2(p.y - cIso.y, p.x - cIso.x);
  const angleNoise = fbm(perm, Math.cos(angle) * 4 + zoneIdx * 11, Math.sin(angle) * 4 + 220, 2) * 0.1;
  return radial + warpCoarse + warpFine + angleNoise - 0.09;
}
function landMaskPangea(q, r, width, height, centers, perm, noiseScale, landFraction) {
  const layout = pangeaLandLayoutParams(landFraction, width, height);
  const borderFade = landMaskBorderFade(q, r, width, height);
  if (borderFade <= 0) return 0;
  let blobMax = 0;
  let blobSum = 0;
  for (let zoneIdx = 0; zoneIdx < centers.length; zoneIdx++) {
    const c = centers[zoneIdx];
    const s = pangeaBlobScore(q, r, width, height, c, zoneIdx, perm, noiseScale);
    blobMax = Math.max(blobMax, s);
    blobSum += Math.max(0, s);
  }
  const merged = Math.min(1, blobSum * layout.mergeSum + blobMax * layout.mergeMax);
  const iso = mapIsotropicFromCenter(q, r, width, height);
  const clusterDist = Math.hypot(iso.x, iso.y);
  const clusterFade = Math.max(0, 1 - Math.pow(clusterDist / layout.clusterRadius, 2.2));
  const valley = fbm(perm, q * noiseScale * 0.38 + 900, r * noiseScale * 0.38 + 900, 4) * layout.valley;
  const globalWarp = fbm(perm, q * noiseScale * 0.45 + 200, r * noiseScale * 0.45 + 200, 3) * layout.globalWarp;
  return Math.min(1, Math.max(0, (merged + globalWarp - valley - layout.threshold) * clusterFade * borderFade));
}
var ISLAND_GRID_DIVISIONS = 4;
function buildSixteenGridIslandCenters(rand, width, height) {
  const GRID = ISLAND_GRID_DIVISIONS;
  const borderMargin = Math.max(
    mapBorderWidth(width, height) / Math.max(1, width - 1),
    mapBorderWidth(width, height) / Math.max(1, height - 1),
    0.08
  );
  const clamp01 = (v) => Math.max(borderMargin, Math.min(1 - borderMargin, v));
  const cellFrac = 1 / GRID;
  const mapScale = Math.sqrt(width * height / 8e3);
  const sizeMul = Math.min(1.14, Math.max(0.86, 0.92 + mapScale * 0.07));
  const baseR = cellFrac * 0.32 * sizeMul;
  const jitter = () => (rand() - 0.5) * cellFrac * 0.22;
  const centers = [];
  for (let row = 0; row < GRID; row++) {
    for (let col = 0; col < GRID; col++) {
      centers.push({
        nq: clamp01((col + 0.5) * cellFrac + jitter()),
        nr: clamp01((row + 0.5) * cellFrac + jitter()),
        radius: baseR * (0.82 + rand() * 0.28)
      });
    }
  }
  return centers;
}
function islandGridCellIndex(q, r, width, height) {
  const GRID = ISLAND_GRID_DIVISIONS;
  const col = Math.min(GRID - 1, Math.floor(q * GRID / Math.max(1, width)));
  const row = Math.min(GRID - 1, Math.floor(r * GRID / Math.max(1, height)));
  return row * GRID + col;
}
function assignIslandGridIndices(width, height) {
  const map = /* @__PURE__ */ new Map();
  for (let r = 0; r < height; r++) {
    for (let q = 0; q < width; q++) {
      map.set(hexKey(q, r), islandGridCellIndex(q, r, width, height));
    }
  }
  return map;
}
function landMaskWyspy(q, r, width, height, centers, perm, noiseScale) {
  const GRID = ISLAND_GRID_DIVISIONS;
  const nq = q / Math.max(1, width - 1);
  const nr = r / Math.max(1, height - 1);
  const borderFade = landMaskBorderFade(q, r, width, height);
  const edgeRect = mapEdgeRectFade(q, r, width, height);
  if (borderFade <= 0 || edgeRect <= 0) return 0;
  const col = Math.min(GRID - 1, Math.floor(q * GRID / Math.max(1, width)));
  const row = Math.min(GRID - 1, Math.floor(r * GRID / Math.max(1, height)));
  const zoneIdx = row * GRID + col;
  const c = centers[zoneIdx];
  const cellW = 1 / GRID;
  const cellLeft = col * cellW;
  const cellRight = (col + 1) * cellW;
  const cellTop = row * cellW;
  const cellBottom = (row + 1) * cellW;
  const laneHalf = 0.062;
  const distToEdge = Math.min(nq - cellLeft, cellRight - nq, nr - cellTop, cellBottom - nr);
  const cellLaneFade = Math.min(1, Math.max(0, distToEdge / laneHalf));
  if (cellLaneFade <= 0) return 0;
  const distC = Math.hypot(nq - c.nq, nr - c.nr);
  const radial = Math.max(0, 1 - Math.pow(distC / c.radius, 1.88));
  const warpCoarse = fbm(perm, q * noiseScale * 0.62 + 350, r * noiseScale * 0.62 + 350, 4) * 0.18;
  const warpFine = fbm(perm, q * noiseScale * 1.55 + 620, r * noiseScale * 1.55 + 620, 3) * 0.1;
  const angle = Math.atan2(nr - c.nr, nq - c.nq);
  const angleNoise = fbm(perm, Math.cos(angle) * 5 + zoneIdx * 7, Math.sin(angle) * 5 + 330, 2) * 0.07;
  return Math.min(1, Math.max(
    0,
    (radial + warpCoarse + warpFine + angleNoise - 0.12) * borderFade * edgeRect * cellLaneFade
  ));
}
function landMaskZiemia(q, r, width, height, perm, noiseScale) {
  const template = earthTemplateLandAt(q, r, width, height);
  if (template <= 0) return 0;
  const coastNoise = fbm(perm, q * noiseScale * 0.85 + 880, r * noiseScale * 0.85 + 880, 3) * 0.09;
  return Math.min(1, Math.max(0, 0.94 + coastNoise - 0.05));
}
function reliefElevGates(mtnTh) {
  if (mtnTh <= 0.55) {
    return { mountain: 0.1, highland: 0.08, landMaskHi: 0.12, landMaskMtn: 0.15 };
  }
  if (mtnTh >= 0.75) {
    return { mountain: 0.22, highland: 0.18, landMaskHi: 0.3, landMaskMtn: 0.35 };
  }
  return { mountain: 0.14, highland: 0.11, landMaskHi: 0.2, landMaskMtn: 0.22 };
}
var TERRAIN_GLOBAL_MIX_AMP = 0.12;
var TERRAIN_CELL_JITTER_AMP = 0.65;
function terenCoverageCellSize() {
  return 4;
}
function hashInt3(a, b, c) {
  let h = a * 374761393 ^ b * 668265263 ^ c * 2246822519;
  h = Math.imul(h ^ h >>> 13, 1274126177);
  h = (h ^ h >>> 16) >>> 0;
  return h / 4294967296;
}
function terrainCellBias(q, r, seed, cellSize = terenCoverageCellSize()) {
  const cx = Math.floor(q / cellSize);
  const cy = Math.floor(r / cellSize);
  return (hashInt3(cx, cy, seed) - 0.5) * 2;
}
function terrainRownLakaJitter(forNoise, desNoise, cellBias) {
  const global = ((forNoise + desNoise) * 0.5 - 0.5) * TERRAIN_GLOBAL_MIX_AMP;
  const local = cellBias * TERRAIN_CELL_JITTER_AMP;
  return global + local;
}
function classifyTerrain(elevContinental, landMask, mtnNoise, forNoise, desNoise, thresholds, climateBand, cellBias = 0) {
  const desTh = thresholds?.desert ?? 0.63;
  const mtnTh = thresholds?.mountain ?? 0.75;
  const hiTh = thresholds?.highland ?? 0.6;
  const elevG = reliefElevGates(mtnTh);
  let terenBazowy;
  let nakladka = "brak" /* Brak */;
  if (elevContinental < 0.14) {
    terenBazowy = landMask < 0.22 ? "morze" /* Morze */ : "laka" /* Laka */;
  } else {
    const isHighlands = mtnNoise > hiTh && landMask > elevG.landMaskHi;
    const isMountain = mtnNoise > mtnTh && landMask > elevG.landMaskMtn;
    if (isMountain && elevContinental > elevG.mountain) {
      terenBazowy = "gory" /* Gory */;
    } else if (isHighlands && elevContinental > elevG.highland) {
      terenBazowy = "wzgorza" /* Wzgorza */;
    } else if (canAssignClimateDesert(climateBand) && desNoise > desTh && elevContinental > 0.18 && elevContinental < 0.45) {
      terenBazowy = "pustynia" /* Pustynia */;
    } else if (elevContinental + terrainRownLakaJitter(forNoise, desNoise, cellBias) > 0.35) {
      terenBazowy = "rownina" /* Rownina */;
    } else {
      terenBazowy = "laka" /* Laka */;
    }
  }
  return { terenBazowy, nakladka };
}
function classifyTerrainFlat(elevContinental, landMask, _mtnNoise, forNoise, desNoise, thresholds, climateBand, cellBias = 0) {
  const desTh = thresholds?.desert ?? 0.63;
  let terenBazowy;
  const nakladka = "brak" /* Brak */;
  if (elevContinental < 0.14) {
    terenBazowy = "laka" /* Laka */;
  } else if (canAssignClimateDesert(climateBand) && desNoise > desTh && elevContinental > 0.18 && elevContinental < 0.45) {
    terenBazowy = "pustynia" /* Pustynia */;
  } else if (elevContinental + terrainRownLakaJitter(forNoise, desNoise, cellBias) > 0.35) {
    terenBazowy = "rownina" /* Rownina */;
  } else {
    terenBazowy = "laka" /* Laka */;
  }
  return { terenBazowy, nakladka };
}
function reapplyForestOverlay(hexes, scratch, thresholds, typ, forestTier, continentOf, nContinents, mapHeight) {
  const share = FOREST_SHARE_OF_DRY_LAND[forestTier];
  const cellSize = forestCoverageCellSize(forestTier);
  const minLand = minLandHexesForFairPlayCell(cellSize);
  const seaDist = buildSeaDistanceField(hexes);
  for (const hex of Object.values(hexes)) {
    if (hex.nakladka === "las" /* Las */) hex.nakladka = "brak" /* Brak */;
  }
  let assigned = 0;
  const partitions = landPartitionKeysForDistribution(hexes, typ, continentOf, nContinents);
  for (const part of partitions) {
    const massSet = new Set(part.filter((k) => hexes[k]?.terenBazowy !== "morze" /* Morze */));
    let maxSeaInPart = 1;
    for (const k of massSet) {
      const d = seaDist.get(k) ?? 0;
      if (d > maxSeaInPart) maxSeaInPart = d;
    }
    for (const land of landHexesByCoverageCell(massSet, cellSize).values()) {
      if (land.length < minLand) continue;
      const eligible = land.filter(([q, r]) => {
        const h = hexes[hexKey(q, r)];
        if (!h || !isForestEligibleTerrain(h.terenBazowy) || h.nakladka !== "brak" /* Brak */) return false;
        if (mapHeight && climateBandAt(q, r, mapHeight) === "desert") return false;
        return true;
      }).map(([q, r]) => {
        const sd = seaDist.get(hexKey(q, r)) ?? 0;
        const inlandBoost = maxSeaInPart > 1 ? sd / maxSeaInPart * 0.14 : 0;
        return { k: hexKey(q, r), n: (scratch.get(hexKey(q, r))?.forNoise ?? 0) + inlandBoost };
      }).sort((a, b) => b.n - a.n);
      if (eligible.length === 0) continue;
      const mid = land[Math.floor(land.length / 2)];
      const cellBand = mapHeight ? climateBandAt(mid[0], mid[1], mapHeight) : "temperate_north";
      const zoneShareMul = cellBand === "temperate_north" || cellBand === "temperate_south" ? 1.35 : 1;
      const minForest = typ === "pangea" ? 0 : 1;
      const target = Math.max(minForest, Math.round(eligible.length * share * zoneShareMul));
      const cap = Math.min(target, Math.max(2, Math.ceil(eligible.length * FOREST_OVERLAY_CAP_FRAC)));
      for (let i = 0; i < Math.min(cap, eligible.length); i++) {
        hexes[eligible[i].k].nakladka = "las" /* Las */;
        assigned++;
      }
    }
  }
  return assigned;
}
var REAPPLY_RELIEF_BUDGET_FRAC = {
  low: 0.186,
  medium: 0.25,
  high: 0.564
};
function reapplyLandTerrain(hexes, scratch, seed, thresholds, mapHeight, reliefTier = "medium") {
  const reliefCandidates = [];
  let landCount = 0;
  for (const [key, hex] of Object.entries(hexes)) {
    if (hex.terenBazowy === "morze" /* Morze */ || hex.terenBazowy === "wybrzeze" /* Wybrzeze */) {
      continue;
    }
    const s = scratch.get(key);
    if (!s) continue;
    landCount++;
    const { q, r } = hex.coords;
    const climateBand = mapHeight ? climateBandAt(q, r, mapHeight) : void 0;
    const cellBias = terrainCellBias(q, r, seed);
    const { terenBazowy: fullTb, nakladka: fullNak } = classifyTerrain(
      s.elevContinental,
      s.landMask,
      s.mtnNoise,
      s.forNoise,
      s.desNoise,
      thresholds,
      climateBand,
      cellBias
    );
    if (fullTb === "gory" /* Gory */ || fullTb === "wzgorza" /* Wzgorza */) {
      const { terenBazowy: flatTb, nakladka: flatNak } = classifyTerrainFlat(
        s.elevContinental,
        s.landMask,
        s.mtnNoise,
        s.forNoise,
        s.desNoise,
        thresholds,
        climateBand,
        cellBias
      );
      hex.terenBazowy = flatTb;
      hex.nakladka = flatNak;
      reliefCandidates.push({ key, n: s.mtnNoise, want: fullTb });
    } else {
      hex.terenBazowy = fullTb === "morze" /* Morze */ ? "laka" /* Laka */ : fullTb;
      hex.nakladka = fullNak;
    }
  }
  if (reliefCandidates.length === 0) return;
  reliefCandidates.sort((a, b) => b.n - a.n);
  const budgetFrac = REAPPLY_RELIEF_BUDGET_FRAC[reliefTier];
  const budget = Math.floor(landCount * budgetFrac);
  for (let i = 0; i < Math.min(budget, reliefCandidates.length); i++) {
    const c = reliefCandidates[i];
    const hex = hexes[c.key];
    if (!hex) continue;
    hex.terenBazowy = c.want;
    hex.nakladka = "brak" /* Brak */;
  }
}
var FALLBACK_RELIEF_FRAC = {
  low: { mountain: 0.06, highland: 0.126 },
  medium: { mountain: 0.1, highland: 0.15 },
  high: { mountain: 0.24, highland: 0.324 }
};
function reliefLandFractions(tier) {
  return { ...FALLBACK_RELIEF_FRAC[tier] };
}
var MAP_BORDER_OCEAN_HEXES = 2;
var MAP_MARGIN_LAND_ZONE_HEXES = 10;
function mapBorderWidth(_width, _height) {
  return MAP_BORDER_OCEAN_HEXES;
}
function marginLandCapForBorderDistance(d) {
  if (d < MAP_BORDER_OCEAN_HEXES) return 0;
  if (d <= MAP_MARGIN_LAND_ZONE_HEXES) return 0.05 * (d - 1);
  return null;
}
function marginScatterScore(q, r, landScores) {
  const base = landScores.get(hexKey(q, r)) ?? 0;
  const n = (q * 73856093 ^ r * 19349663) & 65535;
  return base + n / 65535 * 0.38;
}
function countLandNeighborsInSet(hexes, q, r) {
  let n = 0;
  for (const [dq, dr] of HEX_DIRECTIONS) {
    const nh = hexes[hexKey(q + dq, r + dr)];
    if (nh && nh.terenBazowy !== "morze" /* Morze */) n++;
  }
  return n;
}
function keysAtBorderDistance(hexes, width, height, d) {
  const out = [];
  for (let r = 0; r < height; r++) {
    for (let q = 0; q < width; q++) {
      if (hexBorderDistance(q, r, width, height) !== d) continue;
      out.push(hexKey(q, r));
    }
  }
  return out;
}
function applyMarginalLandZoneCaps(hexes, landScores, width, height) {
  let adjusted = 0;
  for (let d = 0; d <= MAP_MARGIN_LAND_ZONE_HEXES; d++) {
    const cap = marginLandCapForBorderDistance(d);
    if (cap == null) continue;
    const ring = keysAtBorderDistance(hexes, width, height, d);
    if (ring.length === 0) continue;
    let land = 0;
    for (const k of ring) {
      if (hexes[k].terenBazowy !== "morze" /* Morze */) land++;
    }
    const targetLand = Math.round(ring.length * cap);
    if (land > targetLand) {
      const landKeys = ring.filter((k) => hexes[k].terenBazowy !== "morze" /* Morze */);
      const sorted = sortLandKeysForErosion(landKeys, hexes, landScores, width, height);
      for (const k of sorted) {
        if (land <= targetLand) break;
        setHexToMorze(hexes[k]);
        land--;
        adjusted++;
      }
    } else if (land < targetLand) {
      const morseKeys = ring.filter((k) => hexes[k].terenBazowy === "morze" /* Morze */);
      morseKeys.sort((a, b) => {
        const pa = parseHexKey(a);
        const pb = parseHexKey(b);
        const sa = marginScatterScore(pa.q, pa.r, landScores);
        const sb = marginScatterScore(pb.q, pb.r, landScores);
        if (Math.abs(sb - sa) > 0.02) return sb - sa;
        const na = countLandNeighborsInSet(hexes, pa.q, pa.r);
        const nb = countLandNeighborsInSet(hexes, pb.q, pb.r);
        return na - nb;
      });
      for (const k of morseKeys) {
        if (land >= targetLand) break;
        const { q, r } = parseHexKey(k);
        if (countLandNeighborsInSet(hexes, q, r) >= 5) continue;
        setHexToLaka(hexes[k]);
        land++;
        adjusted++;
      }
    }
  }
  return adjusted;
}
function landMaskBorderFade(q, r, width, height) {
  const d = hexBorderDistance(q, r, width, height);
  const cap = marginLandCapForBorderDistance(d);
  if (cap == null) return 1;
  if (cap <= 0) return 0;
  return Math.min(1, cap / 0.45);
}
function mapEdgeRectFade(q, r, width, height) {
  const b = mapBorderWidth(width, height);
  const nq = q / Math.max(1, width - 1);
  const nr = r / Math.max(1, height - 1);
  const marginQ = b / Math.max(1, width - 1);
  const marginR = b / Math.max(1, height - 1);
  return Math.min(
    Math.min(nq, 1 - nq) / Math.max(marginQ, 1e-3),
    Math.min(nr, 1 - nr) / Math.max(marginR, 1e-3),
    1
  );
}
function mapCenterDistanceNorm(q, r, width, height) {
  const cx = (width - 1) / 2;
  const cy = (height - 1) / 2;
  const dx = (q - cx) / (cx + 0.5);
  const dy = (r - cy) / (cy + 0.5);
  return Math.sqrt(dx * dx + dy * dy);
}
function hexBorderDistance(q, r, width, height) {
  return Math.min(q, r, width - 1 - q, height - 1 - r);
}
function isInMapBorder(q, r, width, height, buffer) {
  const b = buffer ?? mapBorderWidth(width, height);
  return hexBorderDistance(q, r, width, height) < b;
}
function isReliefCandidateHex(hex, q, r, width, height) {
  if (hex.terenBazowy === "morze" /* Morze */ || hex.terenBazowy === "wybrzeze" /* Wybrzeze */) {
    return false;
  }
  return !isInMapBorder(q, r, width, height);
}
function enforceMapBorderOcean(hexes, width, height, buffer) {
  const b = buffer ?? mapBorderWidth(width, height);
  let converted = 0;
  for (let r = 0; r < height; r++) {
    for (let q = 0; q < width; q++) {
      if (!isInMapBorder(q, r, width, height, b)) continue;
      const hex = hexes[hexKey(q, r)];
      if (!hex || hex.terenBazowy === "morze" /* Morze */) continue;
      setHexToMorze(hex);
      converted++;
    }
  }
  return converted;
}
function groupLandMassKeys(hexes) {
  const visited = /* @__PURE__ */ new Set();
  const groups = [];
  for (const key of Object.keys(hexes)) {
    const hex = hexes[key];
    if (!hex || hex.terenBazowy === "morze" /* Morze */) continue;
    if (visited.has(key)) continue;
    const mass = [];
    const stack = [key];
    visited.add(key);
    while (stack.length) {
      const k = stack.pop();
      mass.push(k);
      const { q, r } = parseHexKey(k);
      for (const [dq, dr] of HEX_DIRECTIONS) {
        const nk = hexKey(q + dq, r + dr);
        if (visited.has(nk)) continue;
        const nh = hexes[nk];
        if (!nh || nh.terenBazowy === "morze" /* Morze */) continue;
        visited.add(nk);
        stack.push(nk);
      }
    }
    groups.push(mass);
  }
  return groups;
}
function computeLandMassCentroid(hexes, massKeys) {
  let sumQ = 0;
  let sumR = 0;
  let count = 0;
  for (const k of massKeys) {
    const h = hexes[k];
    if (!h || !isRiverLandTerrain(h.terenBazowy)) continue;
    const { q, r } = parseHexKey(k);
    sumQ += q;
    sumR += r;
    count++;
  }
  if (count === 0) return null;
  return { q: sumQ / count, r: sumR / count };
}
var CONTINENT_CENTER_SQUARE_SIZE = 5;
function continentCenterSquare(hexes, massKeys, size = CONTINENT_CENTER_SQUARE_SIZE) {
  const landKeys = [];
  for (const k of massKeys) {
    const h = hexes[k];
    if (!h || !isRiverLandTerrain(h.terenBazowy)) continue;
    landKeys.push(k);
  }
  if (landKeys.length === 0) return null;
  const centroid = computeLandMassCentroid(hexes, landKeys);
  if (!centroid) return null;
  let qMin = Infinity;
  let qMax = -Infinity;
  let rMin = Infinity;
  let rMax = -Infinity;
  for (const k of landKeys) {
    const { q, r } = parseHexKey(k);
    qMin = Math.min(qMin, q);
    qMax = Math.max(qMax, q);
    rMin = Math.min(rMin, r);
    rMax = Math.max(rMax, r);
  }
  const spanQ = qMax - qMin + 1;
  const spanR = rMax - rMin + 1;
  let bboxQMin;
  let bboxQMax;
  let bboxRMin;
  let bboxRMax;
  if (spanQ <= size && spanR <= size) {
    bboxQMin = qMin;
    bboxQMax = qMax;
    bboxRMin = rMin;
    bboxRMax = rMax;
  } else {
    const cq = Math.round(centroid.q);
    const cr = Math.round(centroid.r);
    const half = Math.floor(size / 2);
    bboxQMin = cq - half;
    bboxQMax = cq + half;
    bboxRMin = cr - half;
    bboxRMax = cr + half;
  }
  const keys = /* @__PURE__ */ new Set();
  for (const k of landKeys) {
    const { q, r } = parseHexKey(k);
    if (q >= bboxQMin && q <= bboxQMax && r >= bboxRMin && r <= bboxRMax) {
      keys.add(k);
    }
  }
  if (keys.size === 0) {
    for (const k of landKeys) keys.add(k);
  }
  return {
    keys,
    bbox: { qMin: bboxQMin, qMax: bboxQMax, rMin: bboxRMin, rMax: bboxRMax },
    centroid
  };
}
function hexDistanceToCenterSquare(q, r, square) {
  if (!square || square.keys.size === 0) return 0;
  if (square.keys.has(hexKey(q, r))) return 0;
  let minD = Infinity;
  for (const hk of square.keys) {
    const { q: cq, r: cr } = parseHexKey(hk);
    minD = Math.min(minD, hexAxialDistance(q, r, cq, cr));
  }
  return minD;
}
function isForestEligibleTerrain(tb) {
  return tb !== "morze" /* Morze */ && tb !== "wybrzeze" /* Wybrzeze */ && tb !== "gory" /* Gory */ && tb !== "pustynia" /* Pustynia */ && tb !== "polarny" /* Polarny */;
}
function landPartitionKeysForDistribution(hexes, typ, continentOf, nContinents) {
  if ((typ === "kontynenty" || typ === "wyspy") && continentOf && nContinents > 0) {
    const zones = Array.from({ length: nContinents }, () => []);
    for (const key of Object.keys(hexes)) {
      const hex = hexes[key];
      if (!hex || hex.terenBazowy === "morze" /* Morze */) continue;
      const ci = Math.min(nContinents - 1, Math.max(0, continentOf.get(key) ?? 0));
      zones[ci].push(key);
    }
    return zones.filter((z) => z.length > 0);
  }
  return groupLandMassKeys(hexes);
}
var FOREST_SHARE_OF_DRY_LAND = {
  low: 0.38,
  medium: 0.58,
  high: 0.95
};
var FOREST_OVERLAY_CAP_FRAC = 0.95;
function applyReliefToLandKeys(hexes, scratch, tier, keys, width, height) {
  if (keys.length === 0) return;
  applyIronMountainsToLandKeys(hexes, scratch, tier, keys, width, height);
  applyCopperHighlandsToLandKeys(hexes, scratch, tier, keys, width, height);
}
function reliefBonusCapMountain(tier, landCount) {
  const frac = tier === "high" ? 0.187 : tier === "low" ? 0.067 : 0.1;
  return Math.max(0, Math.ceil(landCount * frac));
}
function reliefBonusCapHighland(tier, landCount) {
  const frac = tier === "high" ? 0.275 : tier === "low" ? 0.1 : 0.15;
  return Math.max(0, Math.ceil(landCount * frac));
}
function reliefSpreadCapMountain(tier, landCount) {
  const frac = mapGenReliefOverflowCapFrac(tier).mountain;
  return Math.max(minMountainsIronCell(tier), Math.ceil(landCount * frac));
}
function reliefSpreadCapHighland(tier, landCount) {
  const frac = mapGenReliefOverflowCapFrac(tier).highland;
  return Math.max(minHighlandsCopperCell(tier), Math.ceil(landCount * frac));
}
function applyIronMountainsToLandKeys(hexes, scratch, tier, keys, width, height) {
  const fr = reliefLandFractions(tier);
  const cellSize = ironCoverageCellSize(tier);
  const minLand = minLandHexesForReliefCell(cellSize);
  const massSet = new Set(keys);
  for (const land of landHexesByCoverageCell(massSet, cellSize).values()) {
    if (land.length < minLand) continue;
    const candidates = land.filter(([q, r]) => {
      const hex = hexes[hexKey(q, r)];
      if (!hex || hex.terenBazowy === "gory" /* Gory */) return false;
      return isReliefCandidateHex(hex, q, r, width, height);
    }).map(([q, r]) => ({
      k: hexKey(q, r),
      n: scratch.get(hexKey(q, r))?.mtnNoise ?? 0
    })).sort((a, b) => b.n - a.n);
    if (candidates.length === 0) continue;
    const bonus = Math.round(candidates.length * fr.mountain);
    const nMtn = Math.min(bonus, reliefBonusCapMountain(tier, candidates.length));
    if (nMtn <= 0) continue;
    for (const k of pickSpreadReliefKeys(candidates, nMtn, 4)) {
      hexes[k].terenBazowy = "gory" /* Gory */;
      hexes[k].nakladka = "brak" /* Brak */;
    }
  }
}
function applyCopperHighlandsToLandKeys(hexes, scratch, tier, keys, width, height) {
  const fr = reliefLandFractions(tier);
  const cellSize = copperCoverageCellSize(tier);
  const minLand = minLandHexesForReliefCell(cellSize);
  const massSet = new Set(keys);
  for (const land of landHexesByCoverageCell(massSet, cellSize).values()) {
    if (land.length < minLand) continue;
    const candidates = land.filter(([q, r]) => {
      const hex = hexes[hexKey(q, r)];
      if (!hex || hex.terenBazowy === "wzgorza" /* Wzgorza */) return false;
      return isReliefCandidateHex(hex, q, r, width, height);
    }).map(([q, r]) => ({
      k: hexKey(q, r),
      n: scratch.get(hexKey(q, r))?.mtnNoise ?? 0
    })).sort((a, b) => b.n - a.n);
    if (candidates.length === 0) continue;
    const bonus = Math.round(candidates.length * fr.highland);
    const nHi = Math.min(bonus, reliefBonusCapHighland(tier, candidates.length));
    if (nHi <= 0) continue;
    for (const k of pickSpreadReliefKeys(candidates, nHi, 3)) {
      hexes[k].terenBazowy = "wzgorza" /* Wzgorza */;
      hexes[k].nakladka = "brak" /* Brak */;
    }
  }
}
function pickSpreadReliefKeys(candidates, count, minDist) {
  if (count <= 0 || candidates.length === 0) return [];
  const picked = [];
  for (const c of candidates) {
    if (picked.length >= count) break;
    const { q, r } = parseHexKey(c.k);
    const spaced = picked.every((pk) => {
      const { q: pq, r: pr } = parseHexKey(pk);
      return hexDistanceAxial(q, r, pq, pr) >= minDist;
    });
    if (spaced) picked.push(c.k);
  }
  for (const c of candidates) {
    if (picked.length >= count) break;
    if (!picked.includes(c.k)) picked.push(c.k);
  }
  return picked;
}
function applyReliefByNoiseRank(hexes, scratch, tier, width, height, typ = "pangea", continentOf = null, nContinents = 0) {
  const partitions = landPartitionKeysForDistribution(hexes, typ, continentOf, nContinents);
  for (const part of partitions) {
    const keys = part.filter((key) => {
      const hex = hexes[key];
      if (!hex) return false;
      const { q, r } = parseHexKey(key);
      return isReliefCandidateHex(hex, q, r, width, height);
    });
    applyReliefToLandKeys(hexes, scratch, tier, keys, width, height);
  }
}
var RELIEF_MIN_MOUNTAINS = { low: 2, medium: 4, high: 5 };
var RELIEF_MIN_HIGHLANDS = { low: 2, medium: 4, high: 5 };
function minMountainsIronCell(tier = "medium") {
  return RELIEF_MIN_MOUNTAINS[tier];
}
function minHighlandsCopperCell(tier = "medium") {
  return RELIEF_MIN_HIGHLANDS[tier];
}
var MIN_MOUNTAINS_IRON_CELL = RELIEF_MIN_MOUNTAINS.medium;
var MIN_HIGHLANDS_COPPER_CELL = RELIEF_MIN_HIGHLANDS.medium;
function ironCoverageCellSize(tier = "medium") {
  if (tier === "high") return 12;
  if (tier === "low") return 21;
  return 15;
}
function copperCoverageCellSize(tier = "medium") {
  if (tier === "high") return 12;
  if (tier === "low") return 21;
  return 15;
}
function fairPlayResourceCellSize(tier = "medium") {
  return ironCoverageCellSize(tier);
}
function forestCoverageCellSize(tier = "medium") {
  if (tier === "high") return 5;
  if (tier === "low") return 15;
  return 10;
}
function minLandHexesForFairPlayCell(cellSize) {
  return minLandHexesForReliefCell(cellSize);
}
function minLandHexesForReliefCell(cellSize) {
  return Math.max(8, Math.floor(cellSize * 0.32));
}
function countMountainsInCell(cellLand, hexes) {
  let n = 0;
  for (const [q, r] of cellLand) {
    if (hexes[hexKey(q, r)]?.terenBazowy === "gory" /* Gory */) n++;
  }
  return n;
}
function countHighlandsInCell(cellLand, hexes) {
  let n = 0;
  for (const [q, r] of cellLand) {
    if (hexes[hexKey(q, r)]?.terenBazowy === "wzgorza" /* Wzgorza */) n++;
  }
  return n;
}
function cellHasIronPackage(cellLand, hexes, tier = "medium") {
  return countMountainsInCell(cellLand, hexes) >= minMountainsIronCell(tier);
}
function cellHasCopperPackage(cellLand, hexes, tier = "medium") {
  return countHighlandsInCell(cellLand, hexes) >= minHighlandsCopperCell(tier);
}
function eligibleReliefLandCount(land, hexes) {
  let n = 0;
  for (const [q, r] of land) {
    const tb = hexes[hexKey(q, r)]?.terenBazowy;
    if (tb !== void 0 && tb !== "morze" /* Morze */ && tb !== "wybrzeze" /* Wybrzeze */) n++;
  }
  return n;
}
function eligibleDepositLandCount(land, hexes) {
  return eligibleReliefLandCount(land, hexes);
}
function cellCanHostDepositPackage(land, hexes, minLand) {
  if (eligibleDepositLandCount(land, hexes) < minLand) return false;
  for (const [q, r] of land) {
    if (hexes[hexKey(q, r)]?.rzeka?.obecna) return true;
  }
  return false;
}
function eligibleForestLandCount(land, hexes) {
  let n = 0;
  for (const [q, r] of land) {
    const hex = hexes[hexKey(q, r)];
    if (hex && isForestEligibleTerrain(hex.terenBazowy)) n++;
  }
  return n;
}
function pickReliefForceHex(land, hexes, scratch, width, height, want, avoid, rand, protectHighland = false, protectMountain = false) {
  const ranked = land.filter(([q, r]) => {
    const k = hexKey(q, r);
    if (avoid.has(k)) return false;
    const hex = hexes[k];
    if (!hex || hex.terenBazowy === "morze" /* Morze */) return false;
    if (hex.terenBazowy === "wybrzeze" /* Wybrzeze */) return false;
    if (want === "mountain" && hex.terenBazowy === "gory" /* Gory */) return false;
    if (want === "highland" && hex.terenBazowy === "wzgorza" /* Wzgorza */) return false;
    if (want === "mountain" && protectHighland && hex.terenBazowy === "wzgorza" /* Wzgorza */) {
      return false;
    }
    if (want === "highland" && protectMountain && hex.terenBazowy === "gory" /* Gory */) {
      return false;
    }
    return true;
  }).map(([q, r]) => {
    const k = hexKey(q, r);
    let score = scratch.get(k)?.mtnNoise ?? 0;
    if (want === "highland") score *= 0.9;
    score += Math.min(8, hexBorderDistance(q, r, width, height)) * 0.04;
    if (hexes[k].terenBazowy === "wybrzeze" /* Wybrzeze */) score -= 0.15;
    score += rand() * 0.1;
    return { q, r, score };
  }).sort((a, b) => b.score - a.score);
  if (ranked.length === 0) return null;
  return [ranked[0].q, ranked[0].r];
}
function forceReliefTypeInCell(land, hexes, scratch, width, height, rand, want, minCount, tier) {
  const countFn = () => want === "mountain" ? countMountainsInCell(land, hexes) : countHighlandsInCell(land, hexes);
  if (countFn() >= minCount) return false;
  let changed = false;
  const placed = /* @__PURE__ */ new Set();
  let guard = 0;
  while (countFn() < minCount && guard++ < land.length + 8) {
    const protectHighland = want === "mountain" && countHighlandsInCell(land, hexes) <= minHighlandsCopperCell(tier);
    const protectMountain = want === "highland" && countMountainsInCell(land, hexes) <= minMountainsIronCell(tier);
    let spot = pickReliefForceHex(
      land,
      hexes,
      scratch,
      width,
      height,
      want,
      placed,
      rand,
      protectHighland,
      protectMountain
    );
    if (!spot) {
      spot = pickReliefForceHex(
        land,
        hexes,
        scratch,
        width,
        height,
        want,
        placed,
        rand,
        false,
        false
      );
    }
    if (!spot) {
      const ranked = land.filter(([q, r]) => {
        const k2 = hexKey(q, r);
        if (placed.has(k2)) return false;
        const hex = hexes[k2];
        if (!hex || hex.terenBazowy === "morze" /* Morze */) return false;
        if (hex.terenBazowy === "wybrzeze" /* Wybrzeze */) return false;
        if (want === "mountain" && hex.terenBazowy === "gory" /* Gory */) return false;
        if (want === "highland" && hex.terenBazowy === "wzgorza" /* Wzgorza */) return false;
        return true;
      }).map(([q, r]) => ({ q, r, n: scratch.get(hexKey(q, r))?.mtnNoise ?? 0 })).sort((a, b) => b.n - a.n);
      if (ranked.length === 0) break;
      spot = [ranked[0].q, ranked[0].r];
    }
    const k = hexKey(spot[0], spot[1]);
    const forcedHex = hexes[k];
    forcedHex.terenBazowy = want === "mountain" ? "gory" /* Gory */ : "wzgorza" /* Wzgorza */;
    forcedHex.nakladka = "brak" /* Brak */;
    delete forcedHex.zloze;
    placed.add(k);
    changed = true;
  }
  return changed;
}
function forceIronMountainsInCell(land, hexes, scratch, width, height, rand, tier) {
  return forceReliefTypeInCell(
    land,
    hexes,
    scratch,
    width,
    height,
    rand,
    "mountain",
    minMountainsIronCell(tier),
    tier
  );
}
function forceCopperHighlandsInCell(land, hexes, scratch, width, height, rand, tier) {
  return forceReliefTypeInCell(
    land,
    hexes,
    scratch,
    width,
    height,
    rand,
    "highland",
    minHighlandsCopperCell(tier),
    tier
  );
}
var RELIEF_OVERFLOW_CAP_MULT = 1;
function isDepositProtectedFromOverflowCap(hex) {
  return !!hex && !!hex.zloze;
}
function capMountainOverflowInCell(land, hexes, scratch, tier, spreadOnly = false) {
  const minMtn = minMountainsIronCell(tier);
  const baseMaxMtn = spreadOnly ? reliefSpreadCapMountain(tier, land.length) : Math.max(minMtn, reliefBonusCapMountain(tier, land.length) + minMtn);
  const maxMtn = baseMaxMtn * RELIEF_OVERFLOW_CAP_MULT;
  const mountains = land.filter(([q, r]) => hexes[hexKey(q, r)]?.terenBazowy === "gory" /* Gory */).map(([q, r]) => ({
    q,
    r,
    n: scratch.get(hexKey(q, r))?.mtnNoise ?? 0,
    protected: isDepositProtectedFromOverflowCap(hexes[hexKey(q, r)])
  })).sort((a, b) => a.n - b.n);
  let changed = false;
  let total = mountains.length;
  let i = 0;
  while (total > maxMtn && total > minMtn && i < mountains.length) {
    const cand = mountains[i];
    if (cand.protected) {
      i++;
      continue;
    }
    const dropHex = hexes[hexKey(cand.q, cand.r)];
    dropHex.terenBazowy = "wzgorza" /* Wzgorza */;
    dropHex.nakladka = "brak" /* Brak */;
    delete dropHex.zloze;
    changed = true;
    total--;
    mountains.splice(i, 1);
  }
  return changed;
}
function capHighlandOverflowInCell(land, hexes, scratch, tier, spreadOnly = false) {
  const minHi = minHighlandsCopperCell(tier);
  const baseMaxHi = spreadOnly ? reliefSpreadCapHighland(tier, land.length) : Math.max(minHi, reliefBonusCapHighland(tier, land.length) + minHi);
  const maxHi = baseMaxHi * RELIEF_OVERFLOW_CAP_MULT;
  const highlands = land.filter(([q, r]) => hexes[hexKey(q, r)]?.terenBazowy === "wzgorza" /* Wzgorza */).map(([q, r]) => ({
    q,
    r,
    n: scratch.get(hexKey(q, r))?.mtnNoise ?? 0,
    protected: isDepositProtectedFromOverflowCap(hexes[hexKey(q, r)])
  })).sort((a, b) => a.n - b.n);
  let changed = false;
  let total = highlands.length;
  let i = 0;
  while (total > maxHi && total > minHi && i < highlands.length) {
    const cand = highlands[i];
    if (cand.protected) {
      i++;
      continue;
    }
    const dropHex = hexes[hexKey(cand.q, cand.r)];
    dropHex.terenBazowy = "rownina" /* Rownina */;
    dropHex.nakladka = "brak" /* Brak */;
    delete dropHex.zloze;
    changed = true;
    total--;
    highlands.splice(i, 1);
  }
  return changed;
}
function capIronCellReliefSpread(hexes, scratch, tier, massSet) {
  const ironSize = ironCoverageCellSize(tier);
  const minIronLand = minLandHexesForReliefCell(ironSize);
  for (const land of landHexesByCoverageCell(massSet, ironSize).values()) {
    if (land.length < minIronLand) continue;
    capMountainOverflowInCell(land, hexes, scratch, tier, true);
    capHighlandOverflowInCell(land, hexes, scratch, tier, true);
  }
}
function ensureMassIronGridCoverage(hexes, scratch, tier, width, height, massSet, rand, skipCap = false) {
  const ironSize = ironCoverageCellSize(tier);
  const minIronLand = minLandHexesForReliefCell(ironSize);
  const eligibleCells = [...landHexesByCoverageCell(massSet, ironSize).values()].filter((land) => eligibleReliefLandCount(land, hexes) >= minIronLand);
  let fixed = 0;
  if (!skipCap) {
    for (const land of eligibleCells) {
      capMountainOverflowInCell(land, hexes, scratch, tier);
    }
  }
  for (let pass = 0; pass < 14; pass++) {
    let inner = 0;
    const cells = [...eligibleCells].sort((a, b) => (cellHasIronPackage(a, hexes, tier) ? 1 : 0) - (cellHasIronPackage(b, hexes, tier) ? 1 : 0));
    for (const land of cells) {
      if (cellHasIronPackage(land, hexes, tier)) continue;
      if (forceIronMountainsInCell(land, hexes, scratch, width, height, rand, tier)) inner++;
    }
    fixed += inner;
    if (inner === 0) break;
  }
  return fixed;
}
function ensureMassCopperGridCoverage(hexes, scratch, tier, width, height, massSet, rand, skipCap = false) {
  const copperSize = copperCoverageCellSize(tier);
  const minCopperLand = minLandHexesForReliefCell(copperSize);
  const eligibleCells = [...landHexesByCoverageCell(massSet, copperSize).values()].filter((land) => eligibleReliefLandCount(land, hexes) >= minCopperLand);
  let fixed = 0;
  if (!skipCap) {
    for (const land of eligibleCells) {
      capHighlandOverflowInCell(land, hexes, scratch, tier);
    }
  }
  for (let pass = 0; pass < 14; pass++) {
    let inner = 0;
    const cells = [...eligibleCells].sort((a, b) => (cellHasCopperPackage(a, hexes, tier) ? 1 : 0) - (cellHasCopperPackage(b, hexes, tier) ? 1 : 0));
    for (const land of cells) {
      if (cellHasCopperPackage(land, hexes, tier)) continue;
      if (forceCopperHighlandsInCell(land, hexes, scratch, width, height, rand, tier)) inner++;
    }
    fixed += inner;
    if (inner === 0) break;
  }
  return fixed;
}
function ensureReliefGridCoverage(hexes, scratch, tier, width, height, _typ, _continentOf, _nContinents, rand) {
  const masses = groupLandMassKeys(hexes).filter((m) => m.length >= 8).sort((a, b) => b.length - a.length);
  let fixed = 0;
  for (let outer = 0; outer < 8; outer++) {
    let passFixed = 0;
    for (const mass of masses) {
      const massSet = new Set(mass);
      passFixed += ensureMassIronGridCoverage(hexes, scratch, tier, width, height, massSet, rand);
      passFixed += ensureMassCopperGridCoverage(hexes, scratch, tier, width, height, massSet, rand);
    }
    fixed += passFixed;
    if (passFixed === 0) break;
  }
  for (const mass of masses) {
    capIronCellReliefSpread(hexes, scratch, tier, new Set(mass));
  }
  for (let restore = 0; restore < 8; restore++) {
    let passFixed = 0;
    for (const mass of masses) {
      const massSet = new Set(mass);
      passFixed += ensureMassIronGridCoverage(hexes, scratch, tier, width, height, massSet, rand, true);
      passFixed += ensureMassCopperGridCoverage(hexes, scratch, tier, width, height, massSet, rand, true);
    }
    fixed += passFixed;
    if (passFixed === 0) break;
  }
  const ironSize = ironCoverageCellSize(tier);
  const copperSize = copperCoverageCellSize(tier);
  const minIron = minLandHexesForReliefCell(ironSize);
  const minCopper = minLandHexesForReliefCell(copperSize);
  for (let mop = 0; mop < 16; mop++) {
    let passFixed = 0;
    for (const mass of masses) {
      if (mass.length < 150) continue;
      const massSet = new Set(mass);
      for (const land of landHexesByCoverageCell(massSet, ironSize).values()) {
        if (eligibleReliefLandCount(land, hexes) < minIron) continue;
        if (cellHasIronPackage(land, hexes, tier)) continue;
        if (forceIronMountainsInCell(land, hexes, scratch, width, height, rand, tier)) passFixed++;
      }
      for (const land of landHexesByCoverageCell(massSet, copperSize).values()) {
        if (eligibleReliefLandCount(land, hexes) < minCopper) continue;
        if (cellHasCopperPackage(land, hexes, tier)) continue;
        if (forceCopperHighlandsInCell(land, hexes, scratch, width, height, rand, tier)) passFixed++;
      }
    }
    fixed += passFixed;
    if (passFixed === 0) break;
  }
  return fixed;
}
var MOUNTAIN_RANGE_LAND_SHARE_CAP = 0.4;
var MAX_MOUNTAIN_RANGE_CLUSTER_SIZE = 10;
var MOUNTAIN_RANGE_REGROW_MIN_GAP = 1;
var MOUNTAIN_RANGE_REGROW_TARGET_MULT = 1;
var MOUNTAIN_RANGE_REGROW_LEN_MIN = 4;
var MOUNTAIN_RANGE_REGROW_LEN_MAX = 8;
function findSameTerrainClusters(hexes, terrain) {
  const visited = /* @__PURE__ */ new Set();
  const clusters = [];
  const keys = Object.keys(hexes).sort();
  for (const key of keys) {
    if (visited.has(key)) continue;
    const hex = hexes[key];
    if (!hex || hex.terenBazowy !== terrain) continue;
    const cluster = [];
    const stack = [key];
    visited.add(key);
    while (stack.length) {
      const k = stack.pop();
      cluster.push(k);
      const { q, r } = parseHexKey(k);
      for (const [dq, dr] of HEX_DIRECTIONS) {
        const nk = hexKey(q + dq, r + dr);
        if (visited.has(nk)) continue;
        const nh = hexes[nk];
        if (!nh || nh.terenBazowy !== terrain) continue;
        visited.add(nk);
        stack.push(nk);
      }
    }
    clusters.push(cluster);
  }
  return clusters;
}
function connectedComponentsWithin(remaining) {
  const visited = /* @__PURE__ */ new Set();
  const comps = [];
  const keys = [...remaining].sort();
  for (const key of keys) {
    if (visited.has(key)) continue;
    const comp = [];
    const stack = [key];
    visited.add(key);
    while (stack.length) {
      const k = stack.pop();
      comp.push(k);
      const { q, r } = parseHexKey(k);
      for (const [dq, dr] of HEX_DIRECTIONS) {
        const nk = hexKey(q + dq, r + dr);
        if (visited.has(nk) || !remaining.has(nk)) continue;
        visited.add(nk);
        stack.push(nk);
      }
    }
    comps.push(comp);
  }
  return comps;
}
function capMountainRangeClusterSize(hexes, scratch, terrain, fallbackTerrain, maxSize) {
  let reverted = 0;
  const clusters = findSameTerrainClusters(hexes, terrain);
  for (const cluster of clusters) {
    if (cluster.length <= maxSize) continue;
    const remaining = new Set(cluster);
    for (; ; ) {
      const comps = connectedComponentsWithin(remaining).sort((a, b) => b.length - a.length);
      const biggest = comps[0];
      if (!biggest || biggest.length <= maxSize) break;
      const sorted = [...biggest].sort((a, b) => {
        const na = scratch.get(a)?.mtnNoise ?? 0;
        const nb = scratch.get(b)?.mtnNoise ?? 0;
        if (na !== nb) return na - nb;
        return a < b ? -1 : a > b ? 1 : 0;
      });
      const victim = sorted.find((k) => !isDepositProtectedFromOverflowCap(hexes[k]));
      if (!victim) break;
      remaining.delete(victim);
      const hex = hexes[victim];
      if (hex) {
        hex.terenBazowy = fallbackTerrain;
        hex.nakladka = "brak" /* Brak */;
        delete hex.zloze;
      }
      reverted++;
    }
  }
  return reverted;
}
function capReliefClusterSizeSafetyNet(hexes, scratch) {
  capMountainRangeClusterSize(
    hexes,
    scratch,
    "gory" /* Gory */,
    "rownina" /* Rownina */,
    MAX_MOUNTAIN_RANGE_CLUSTER_SIZE
  );
  capMountainRangeClusterSize(
    hexes,
    scratch,
    "wzgorza" /* Wzgorza */,
    "rownina" /* Rownina */,
    MAX_MOUNTAIN_RANGE_CLUSTER_SIZE
  );
}
function mountainRangeSeedCandidates(mass, hexes, scratch, width, height, rand) {
  return mass.filter((k) => {
    const hex = hexes[k];
    if (!hex) return false;
    const { q, r } = parseHexKey(k);
    return isReliefCandidateHex(hex, q, r, width, height);
  }).map((k) => ({ k, n: (scratch.get(k)?.mtnNoise ?? 0) + rand() * 0.15 })).sort((a, b) => b.n - a.n);
}
function walkMountainRange(hexes, scratch, width, height, rand, start, steps) {
  const path = [];
  const visited = /* @__PURE__ */ new Set([start]);
  let cur = start;
  for (let i = 0; i < steps; i++) {
    const { q, r } = parseHexKey(cur);
    const candidates = HEX_DIRECTIONS.map(([dq, dr]) => hexKey(q + dq, r + dr)).filter((k) => {
      if (visited.has(k)) return false;
      const hex = hexes[k];
      if (!hex) return false;
      const { q: nq, r: nr } = parseHexKey(k);
      return isReliefCandidateHex(hex, nq, nr, width, height);
    }).map((k) => ({ k, n: (scratch.get(k)?.mtnNoise ?? 0) + rand() * 0.3 })).sort((a, b) => b.n - a.n);
    if (candidates.length === 0) break;
    cur = candidates[0].k;
    visited.add(cur);
    path.push(cur);
  }
  return path;
}
function bfsExpandExclusion(hexes, excluded, sources, minDist) {
  const queue = [];
  for (const k of sources) {
    if (!excluded.has(k)) excluded.add(k);
    queue.push({ k, d: 0 });
  }
  let head = 0;
  while (head < queue.length) {
    const { k, d } = queue[head++];
    if (d >= minDist) continue;
    const { q, r } = parseHexKey(k);
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nk = hexKey(q + dq, r + dr);
      if (excluded.has(nk)) continue;
      if (!hexes[nk]) continue;
      excluded.add(nk);
      queue.push({ k: nk, d: d + 1 });
    }
  }
}
function isExcludedForRegrow(k, n, mtnTh, hiTh, excludedGory, excludedWzgorza) {
  if (n > mtnTh) return excludedGory.has(k);
  if (n > hiTh) return excludedWzgorza.has(k);
  return false;
}
function walkMountainRangeAvoiding(hexes, scratch, width, height, rand, start, steps, mtnTh, hiTh, excludedGory, excludedWzgorza) {
  const path = [];
  const visited = /* @__PURE__ */ new Set([start]);
  let cur = start;
  for (let i = 0; i < steps; i++) {
    const { q, r } = parseHexKey(cur);
    const candidates = HEX_DIRECTIONS.map(([dq, dr]) => hexKey(q + dq, r + dr)).filter((k) => {
      if (visited.has(k)) return false;
      const hex = hexes[k];
      if (!hex) return false;
      const { q: nq, r: nr } = parseHexKey(k);
      if (!isReliefCandidateHex(hex, nq, nr, width, height)) return false;
      const n = scratch.get(k)?.mtnNoise ?? 0;
      return !isExcludedForRegrow(k, n, mtnTh, hiTh, excludedGory, excludedWzgorza);
    }).map((k) => ({ k, n: (scratch.get(k)?.mtnNoise ?? 0) + rand() * 0.3 })).sort((a, b) => b.n - a.n);
    if (candidates.length === 0) break;
    cur = candidates[0].k;
    visited.add(cur);
    path.push(cur);
  }
  return path;
}
function regrowLostMountainClusters(hexes, scratch, width, height, rand, masses, mtnTh, hiTh, deficit) {
  if (deficit <= 0 || masses.length === 0) return 0;
  const excludedGory = /* @__PURE__ */ new Set();
  const excludedWzgorza = /* @__PURE__ */ new Set();
  const initialGory = [];
  const initialWzgorza = [];
  for (const key of Object.keys(hexes).sort()) {
    const hex = hexes[key];
    if (hex.terenBazowy === "gory" /* Gory */) initialGory.push(key);
    else if (hex.terenBazowy === "wzgorza" /* Wzgorza */) initialWzgorza.push(key);
  }
  bfsExpandExclusion(hexes, excludedGory, initialGory, MOUNTAIN_RANGE_REGROW_MIN_GAP);
  bfsExpandExclusion(hexes, excludedWzgorza, initialWzgorza, MOUNTAIN_RANGE_REGROW_MIN_GAP);
  let recovered = 0;
  let massIdx = 0;
  let attemptsSinceProgress = 0;
  const maxAttemptsSinceProgress = masses.length * 40 + 200;
  while (recovered < deficit && attemptsSinceProgress < maxAttemptsSinceProgress) {
    const mass = masses[massIdx % masses.length];
    massIdx++;
    const seedCandidates = mass.filter((k) => {
      const hex = hexes[k];
      if (!hex) return false;
      if (hex.terenBazowy !== "laka" /* Laka */ && hex.terenBazowy !== "rownina" /* Rownina */ && hex.terenBazowy !== "pustynia" /* Pustynia */) return false;
      const { q, r } = parseHexKey(k);
      if (!isReliefCandidateHex(hex, q, r, width, height)) return false;
      const n = scratch.get(k)?.mtnNoise ?? 0;
      return !isExcludedForRegrow(k, n, mtnTh, hiTh, excludedGory, excludedWzgorza);
    }).map((k) => ({ k, n: (scratch.get(k)?.mtnNoise ?? 0) + rand() * 0.15 })).sort((a, b) => b.n - a.n);
    if (seedCandidates.length === 0) {
      attemptsSinceProgress++;
      continue;
    }
    const seedKey = seedCandidates[0].k;
    const len = MOUNTAIN_RANGE_REGROW_LEN_MIN + Math.floor(rand() * (MOUNTAIN_RANGE_REGROW_LEN_MAX - MOUNTAIN_RANGE_REGROW_LEN_MIN + 1));
    const path = [seedKey, ...walkMountainRangeAvoiding(
      hexes,
      scratch,
      width,
      height,
      rand,
      seedKey,
      len,
      mtnTh,
      hiTh,
      excludedGory,
      excludedWzgorza
    )];
    const placedGory = [];
    const placedWzgorza = [];
    for (const k of path) {
      const hex = hexes[k];
      if (!hex) continue;
      if (hex.terenBazowy !== "laka" /* Laka */ && hex.terenBazowy !== "rownina" /* Rownina */ && hex.terenBazowy !== "pustynia" /* Pustynia */) continue;
      const n = scratch.get(k)?.mtnNoise ?? 0;
      if (isExcludedForRegrow(k, n, mtnTh, hiTh, excludedGory, excludedWzgorza)) continue;
      if (n > mtnTh) {
        hex.terenBazowy = "gory" /* Gory */;
        hex.nakladka = "brak" /* Brak */;
        delete hex.zloze;
        placedGory.push(k);
        recovered++;
      } else if (n > hiTh) {
        hex.terenBazowy = "wzgorza" /* Wzgorza */;
        hex.nakladka = "brak" /* Brak */;
        delete hex.zloze;
        placedWzgorza.push(k);
        recovered++;
      }
    }
    if (placedGory.length === 0 && placedWzgorza.length === 0) {
      attemptsSinceProgress++;
      continue;
    }
    attemptsSinceProgress = 0;
    if (placedGory.length > 0) {
      bfsExpandExclusion(hexes, excludedGory, placedGory, MOUNTAIN_RANGE_REGROW_MIN_GAP);
    }
    if (placedWzgorza.length > 0) {
      bfsExpandExclusion(hexes, excludedWzgorza, placedWzgorza, MOUNTAIN_RANGE_REGROW_MIN_GAP);
    }
    if (recovered >= deficit) break;
  }
  return recovered;
}
function growMountainRanges(hexes, scratch, tier, width, height, rand) {
  const params = mapGenMountainRangeParams(tier);
  const mtnTh = mapGenMountainThreshold(tier);
  const hiTh = mapGenHighlandThreshold(tier);
  const masses = groupLandMassKeys(hexes).filter((m) => m.length >= params.minMasaHexow).sort((a, b) => b.length - a.length || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  const addedByThisRun = [];
  for (const mass of masses) {
    const nRanges = Math.min(
      params.maxPasmNaMase,
      Math.max(1, Math.round(mass.length / params.hexyNaPasmo))
    );
    const seedCandidates = mountainRangeSeedCandidates(mass, hexes, scratch, width, height, rand);
    if (seedCandidates.length === 0) continue;
    const seeds = pickSpreadReliefKeys(seedCandidates, nRanges, 5);
    for (const seedKey of seeds) {
      const len = params.dlugoscMin + Math.floor(rand() * (params.dlugoscMax - params.dlugoscMin + 1));
      const path = [seedKey, ...walkMountainRange(hexes, scratch, width, height, rand, seedKey, len)];
      const placedThisRange = [];
      for (const k of path) {
        const hex = hexes[k];
        if (!hex) continue;
        if (hex.terenBazowy === "gory" /* Gory */ || hex.terenBazowy === "wzgorza" /* Wzgorza */) {
          placedThisRange.push(k);
          continue;
        }
        if (hex.terenBazowy !== "laka" /* Laka */ && hex.terenBazowy !== "rownina" /* Rownina */ && hex.terenBazowy !== "pustynia" /* Pustynia */) {
          continue;
        }
        const n = scratch.get(k)?.mtnNoise ?? 0;
        if (n > mtnTh) {
          addedByThisRun.push({ k, n, wasHighland: false, prev: hex.terenBazowy });
          hex.terenBazowy = "gory" /* Gory */;
          hex.nakladka = "brak" /* Brak */;
          delete hex.zloze;
          placedThisRange.push(k);
        } else if (n > hiTh) {
          addedByThisRun.push({ k, n, wasHighland: true, prev: hex.terenBazowy });
          hex.terenBazowy = "wzgorza" /* Wzgorza */;
          hex.nakladka = "brak" /* Brak */;
          delete hex.zloze;
          placedThisRange.push(k);
        }
      }
      for (const k of placedThisRange) {
        const { q, r } = parseHexKey(k);
        for (const [dq, dr] of HEX_DIRECTIONS) {
          const nq = q + dq;
          const nr = r + dr;
          const nk = hexKey(nq, nr);
          const nhex = hexes[nk];
          if (!nhex) continue;
          if (nhex.terenBazowy === "gory" /* Gory */ || nhex.terenBazowy === "wzgorza" /* Wzgorza */) continue;
          if (nhex.terenBazowy !== "laka" /* Laka */ && nhex.terenBazowy !== "rownina" /* Rownina */ && nhex.terenBazowy !== "pustynia" /* Pustynia */) continue;
          if (!isReliefCandidateHex(nhex, nq, nr, width, height)) continue;
          if (rand() >= params.obrzezeSzansa) continue;
          const n = scratch.get(nk)?.mtnNoise ?? 0;
          addedByThisRun.push({ k: nk, n, wasHighland: true, prev: nhex.terenBazowy });
          nhex.terenBazowy = "wzgorza" /* Wzgorza */;
          nhex.nakladka = "brak" /* Brak */;
          delete nhex.zloze;
        }
      }
    }
  }
  const { land } = countLandSeaHexes2(hexes);
  const capCount = Math.floor(land * MOUNTAIN_RANGE_LAND_SHARE_CAP);
  let mountainous = 0;
  for (const hex of Object.values(hexes)) {
    if (hex.terenBazowy === "gory" /* Gory */ || hex.terenBazowy === "wzgorza" /* Wzgorza */) mountainous++;
  }
  if (mountainous > capCount && addedByThisRun.length > 0) {
    const revertOrder = [...addedByThisRun].sort((a, b) => {
      if (a.wasHighland !== b.wasHighland) return a.wasHighland ? -1 : 1;
      return a.n - b.n;
    });
    for (const item of revertOrder) {
      if (mountainous <= capCount) break;
      const hex = hexes[item.k];
      if (!hex) continue;
      if (hex.terenBazowy !== "gory" /* Gory */ && hex.terenBazowy !== "wzgorza" /* Wzgorza */) continue;
      hex.terenBazowy = item.prev;
      mountainous--;
    }
  }
  if (mountainous > capCount) {
    const ironSize = ironCoverageCellSize(tier);
    const copperSize = copperCoverageCellSize(tier);
    const ironCellCount = /* @__PURE__ */ new Map();
    const copperCellCount = /* @__PURE__ */ new Map();
    const cellIdOf = (q, r, size) => `${Math.floor(q / size)},${Math.floor(r / size)}`;
    const allRelief = [];
    for (const [k, hex] of Object.entries(hexes)) {
      if (hex.terenBazowy !== "gory" /* Gory */ && hex.terenBazowy !== "wzgorza" /* Wzgorza */) continue;
      const { q, r } = parseHexKey(k);
      const isHighland = hex.terenBazowy === "wzgorza" /* Wzgorza */;
      if (isHighland) {
        const ck = cellIdOf(q, r, copperSize);
        copperCellCount.set(ck, (copperCellCount.get(ck) ?? 0) + 1);
      } else {
        const ck = cellIdOf(q, r, ironSize);
        ironCellCount.set(ck, (ironCellCount.get(ck) ?? 0) + 1);
      }
      allRelief.push({ k, q, r, n: scratch.get(k)?.mtnNoise ?? 0, isHighland });
    }
    allRelief.sort((a, b) => {
      if (a.isHighland !== b.isHighland) return a.isHighland ? -1 : 1;
      return a.n - b.n;
    });
    for (const item of allRelief) {
      if (mountainous <= capCount) break;
      const hex = hexes[item.k];
      if (!hex) continue;
      if (item.isHighland) {
        const ck = cellIdOf(item.q, item.r, copperSize);
        const cnt = copperCellCount.get(ck) ?? 0;
        if (cnt <= minHighlandsCopperCell(tier)) continue;
        hex.terenBazowy = "rownina" /* Rownina */;
        hex.nakladka = "brak" /* Brak */;
        delete hex.zloze;
        copperCellCount.set(ck, cnt - 1);
      } else {
        const ck = cellIdOf(item.q, item.r, ironSize);
        const cnt = ironCellCount.get(ck) ?? 0;
        if (cnt <= minMountainsIronCell(tier)) continue;
        hex.terenBazowy = "rownina" /* Rownina */;
        hex.nakladka = "brak" /* Brak */;
        delete hex.zloze;
        ironCellCount.set(ck, cnt - 1);
      }
      mountainous--;
    }
  }
  const mtnReverted = capMountainRangeClusterSize(
    hexes,
    scratch,
    "gory" /* Gory */,
    "rownina" /* Rownina */,
    MAX_MOUNTAIN_RANGE_CLUSTER_SIZE
  );
  const hiReverted = capMountainRangeClusterSize(
    hexes,
    scratch,
    "wzgorza" /* Wzgorza */,
    "rownina" /* Rownina */,
    MAX_MOUNTAIN_RANGE_CLUSTER_SIZE
  );
  regrowLostMountainClusters(
    hexes,
    scratch,
    width,
    height,
    rand,
    masses,
    mtnTh,
    hiTh,
    Math.round((mtnReverted + hiReverted) * MOUNTAIN_RANGE_REGROW_TARGET_MULT)
  );
  capMountainRangeClusterSize(
    hexes,
    scratch,
    "gory" /* Gory */,
    "rownina" /* Rownina */,
    MAX_MOUNTAIN_RANGE_CLUSTER_SIZE
  );
  capMountainRangeClusterSize(
    hexes,
    scratch,
    "wzgorza" /* Wzgorza */,
    "rownina" /* Rownina */,
    MAX_MOUNTAIN_RANGE_CLUSTER_SIZE
  );
  return addedByThisRun.length;
}
function assignContinentIndices(width, height, centers) {
  const map = /* @__PURE__ */ new Map();
  for (let r = 0; r < height; r++) {
    for (let q = 0; q < width; q++) {
      const nq = q / Math.max(1, width - 1);
      const nr = r / Math.max(1, height - 1);
      map.set(hexKey(q, r), nearestContinentZoneIndex(nq, nr, centers));
    }
  }
  return map;
}
function parseHexKey(key) {
  const parts = key.split(",");
  return { q: Number(parts[0]), r: Number(parts[1]) };
}
function sortLandKeysForErosion(keys, hexes, landScores, width, height) {
  return [...keys].sort((a, b) => {
    const pa = parseHexKey(a);
    const pb = parseHexKey(b);
    const ba = hexBorderDistance(pa.q, pa.r, width, height);
    const bb = hexBorderDistance(pb.q, pb.r, width, height);
    if (ba !== bb) return ba - bb;
    const ca = mapCenterDistanceNorm(pa.q, pa.r, width, height);
    const cb = mapCenterDistanceNorm(pb.q, pb.r, width, height);
    if (Math.abs(ca - cb) > 0.015) return cb - ca;
    const na = countMorseNeighbors(hexes, pa.q, pa.r);
    const nb = countMorseNeighbors(hexes, pb.q, pb.r);
    if (na !== nb) return nb - na;
    const ra = erodeTerrainRank(hexes[a].terenBazowy);
    const rb = erodeTerrainRank(hexes[b].terenBazowy);
    if (ra !== rb) return ra - rb;
    return (landScores.get(a) ?? 0) - (landScores.get(b) ?? 0);
  });
}
function isLandTerrain(tb) {
  return tb === "laka" /* Laka */ || tb === "rownina" /* Rownina */ || tb === "wzgorza" /* Wzgorza */ || tb === "pustynia" /* Pustynia */;
}
function isLandOrCoast(tb) {
  return tb !== "morze" /* Morze */ && tb !== "wybrzeze" /* Wybrzeze */;
}
function defaultLandFractionForTyp(typ) {
  switch (typ) {
    case "pangea":
      return 0.6;
    case "kontynenty":
      return 0.3;
    case "wyspy":
      return 0.5;
    case "ziemia":
      return 0.21;
    default:
      return 0.3;
  }
}
function countLandSeaHexes2(hexes) {
  let land = 0;
  let sea = 0;
  for (const h of Object.values(hexes)) {
    if (h.terenBazowy === "morze" /* Morze */ || h.terenBazowy === "wybrzeze" /* Wybrzeze */) sea++;
    else land++;
  }
  return { land, sea, total: land + sea };
}
var ERODE_TERRAIN_ORDER = [
  "wybrzeze" /* Wybrzeze */,
  "laka" /* Laka */,
  "pustynia" /* Pustynia */,
  "rownina" /* Rownina */,
  "wzgorza" /* Wzgorza */,
  "gory" /* Gory */
];
function erodeTerrainRank(tb) {
  const i = ERODE_TERRAIN_ORDER.indexOf(tb);
  return i >= 0 ? i : ERODE_TERRAIN_ORDER.length;
}
function countMorseNeighbors(hexes, q, r) {
  let n = 0;
  for (const [dq, dr] of HEX_DIRECTIONS) {
    const nh = hexes[hexKey(q + dq, r + dr)];
    if (nh?.terenBazowy === "morze" /* Morze */ || nh?.terenBazowy === "wybrzeze" /* Wybrzeze */) n++;
  }
  return n;
}
function countLandNeighbors(hexes, q, r) {
  let n = 0;
  for (const [dq, dr] of HEX_DIRECTIONS) {
    const nh = hexes[hexKey(q + dq, r + dr)];
    if (nh && nh.terenBazowy !== "morze" /* Morze */ && nh.terenBazowy !== "wybrzeze" /* Wybrzeze */) n++;
  }
  return n;
}
function isCoastalLandHex(hexes, q, r) {
  const h = hexes[hexKey(q, r)];
  if (!h || h.terenBazowy === "morze" /* Morze */ || h.terenBazowy === "wybrzeze" /* Wybrzeze */) return false;
  return countMorseNeighbors(hexes, q, r) > 0;
}
function isCoastalMorseHex(hexes, q, r) {
  const h = hexes[hexKey(q, r)];
  if (h?.terenBazowy !== "morze" /* Morze */ && h?.terenBazowy !== "wybrzeze" /* Wybrzeze */) return false;
  return countLandNeighbors(hexes, q, r) > 0;
}
function setHexToMorze(hex) {
  hex.terenBazowy = "morze" /* Morze */;
  hex.nakladka = "brak" /* Brak */;
  hex.rzeka = { obecna: false, krawedzie: [] };
  delete hex.zloze;
}
function setHexToLaka(hex) {
  hex.terenBazowy = "laka" /* Laka */;
  hex.nakladka = "brak" /* Brak */;
  delete hex.zloze;
}
function enforceLatitudinalOceanBuffer(hexes, width, height, isEarth) {
  const buf = latitudinalOceanBufferRows(height, isEarth);
  let converted = 0;
  for (let r = 0; r < height; r++) {
    if (r >= buf && r < height - buf) continue;
    for (let q = 0; q < width; q++) {
      const hex = hexes[hexKey(q, r)];
      if (!hex || hex.terenBazowy === "morze" /* Morze */) continue;
      setHexToMorze(hex);
      converted++;
    }
  }
  return converted;
}
function climateBandBaseTerrain(band, q, r, seed) {
  if (isPolarClimateBand(band)) return "polarny" /* Polarny */;
  const h = hashInt3(q, r, seed);
  switch (band) {
    case "desert":
      return h < 0.5 ? "pustynia" /* Pustynia */ : "rownina" /* Rownina */;
    case "plains_north":
    case "plains_south":
      return h < 0.7 ? "rownina" /* Rownina */ : "laka" /* Laka */;
    case "temperate_north":
    case "temperate_south":
    default:
      return h < 0.85 ? "laka" /* Laka */ : "rownina" /* Rownina */;
  }
}
function applyClimateBandsToHexes(hexes, height, seed, isEarth = false) {
  let n = 0;
  for (const [key, hex] of Object.entries(hexes)) {
    const { q, r } = parseHexKey(key);
    const tb = hex.terenBazowy;
    if (tb === "morze" /* Morze */ || tb === "wybrzeze" /* Wybrzeze */ || tb === "gory" /* Gory */ || tb === "wzgorza" /* Wzgorza */) {
      continue;
    }
    const band = climateBandAt(q, r, height, isEarth);
    const want = climateBandBaseTerrain(band, q, r, seed);
    if (tb !== want) {
      hex.terenBazowy = want;
      if (want === "polarny" /* Polarny */ || want === "pustynia" /* Pustynia */) {
        hex.nakladka = "brak" /* Brak */;
        delete hex.zloze;
      }
      n++;
    } else if (want === "polarny" /* Polarny */ && hex.nakladka !== "brak" /* Brak */) {
      hex.nakladka = "brak" /* Brak */;
      delete hex.zloze;
      n++;
    }
  }
  return n;
}
function enforceEarthTemplateOnHexes(hexes, width, height) {
  let fixed = 0;
  for (const [key, hex] of Object.entries(hexes)) {
    const { q, r } = parseHexKey(key);
    if (earthTemplateLandAt(q, r, width, height) > 0) continue;
    if (hex.terenBazowy === "morze" /* Morze */) continue;
    setHexToMorze(hex);
    fixed++;
  }
  return fixed;
}
var PANGEA_LAND_FILL_MIN_SCORE = 0.11;
function applyLandFractionByScore2(hexes, landScores, targetLandFraction, width, height, fillBias = "center", minMaskFillScore = PANGEA_LAND_FILL_MIN_SCORE) {
  const clamped = Math.max(0.15, Math.min(0.85, targetLandFraction));
  const keys = Object.keys(hexes);
  const total = keys.length;
  const targetLand = Math.round(total * clamped);
  let { land } = countLandSeaHexes2(hexes);
  let adjusted = 0;
  const hasBorder = width != null && height != null && width > 0 && height > 0;
  const borderOk = (k) => {
    if (!hasBorder) return true;
    const { q, r } = parseHexKey(k);
    return !isInMapBorder(q, r, width, height);
  };
  const interiorOk = (k) => {
    if (!hasBorder) return true;
    const { q, r } = parseHexKey(k);
    return hexBorderDistance(q, r, width, height) > MAP_MARGIN_LAND_ZONE_HEXES;
  };
  if (land < targetLand) {
    const morseCandidates = keys.filter((k) => {
      if (hexes[k].terenBazowy !== "morze" /* Morze */ || !borderOk(k)) return false;
      if (fillBias === "mask" && (landScores.get(k) ?? 0) < minMaskFillScore) return false;
      return true;
    }).sort((a, b) => {
      const sa = landScores.get(a) ?? 0;
      const sb = landScores.get(b) ?? 0;
      if (Math.abs(sb - sa) > 0.04) return sb - sa;
      if (fillBias === "mask") return a.localeCompare(b);
      const pa = parseHexKey(a);
      const pb = parseHexKey(b);
      const da = hasBorder ? mapCenterDistanceNorm(pa.q, pa.r, width, height) : 0;
      const db = hasBorder ? mapCenterDistanceNorm(pb.q, pb.r, width, height) : 0;
      return da - db;
    });
    for (const k of morseCandidates) {
      if (land >= targetLand) break;
      setHexToLaka(hexes[k]);
      land++;
      adjusted++;
    }
    if (land < targetLand && hasBorder) {
      const interiorMorse = keys.filter((k) => {
        if (hexes[k].terenBazowy !== "morze" /* Morze */ || !interiorOk(k)) return false;
        if (fillBias === "mask" && (landScores.get(k) ?? 0) < minMaskFillScore) return false;
        return true;
      }).sort((a, b) => (landScores.get(b) ?? 0) - (landScores.get(a) ?? 0));
      for (const k of interiorMorse) {
        if (land >= targetLand) break;
        setHexToLaka(hexes[k]);
        land++;
        adjusted++;
      }
    }
  } else if (land > targetLand) {
    const landCandidates = sortLandKeysForErosion(
      keys.filter((k) => isDryLandTerrain(hexes[k].terenBazowy)),
      hexes,
      landScores,
      width ?? 1,
      height ?? 1
    );
    for (const k of landCandidates) {
      if (land <= targetLand) break;
      setHexToMorze(hexes[k]);
      land--;
      adjusted++;
    }
  }
  return adjusted;
}
function rebalanceLandFractionWithMargins(hexes, landScores, targetLandFraction, width, height) {
  applyLandFractionByScore2(hexes, landScores, targetLandFraction, width, height);
  applyMarginalLandZoneCaps(hexes, landScores, width, height);
  enforceMapBorderOcean(hexes, width, height);
  applyLandFractionByScore2(hexes, landScores, targetLandFraction, width, height);
  applyMarginalLandZoneCaps(hexes, landScores, width, height);
  enforceMapBorderOcean(hexes, width, height);
  applyDoubleCoastRing(hexes);
}
function erodePangeaBboxLowScoreRim(hexes, landScores, targetBboxFill = 0.74, maxErode = 1200) {
  const landKeys = Object.keys(hexes).filter((k) => isDryLandTerrain(hexes[k].terenBazowy));
  if (landKeys.length === 0) return 0;
  let qMin = Infinity, qMax = -Infinity, rMin = Infinity, rMax = -Infinity;
  for (const k of landKeys) {
    const { q, r } = parseHexKey(k);
    qMin = Math.min(qMin, q);
    qMax = Math.max(qMax, q);
    rMin = Math.min(rMin, r);
    rMax = Math.max(rMax, r);
  }
  const bboxArea = Math.max(1, (qMax - qMin + 1) * (rMax - rMin + 1));
  let landCount = landKeys.length;
  let bboxFill = landCount / bboxArea;
  if (bboxFill <= targetBboxFill) return 0;
  const midQ = (qMin + qMax) / 2;
  const midR = (rMin + rMax) / 2;
  const rim = landKeys.filter((k) => {
    const { q, r } = parseHexKey(k);
    return q <= qMin + 2 || q >= qMax - 2 || r <= rMin + 2 || r >= rMax - 2;
  }).sort((a, b) => {
    const sa = landScores.get(a) ?? 0;
    const sb = landScores.get(b) ?? 0;
    if (Math.abs(sa - sb) > 0.02) return sa - sb;
    const pa = parseHexKey(a);
    const pb = parseHexKey(b);
    const da = Math.hypot(pa.q - midQ, pa.r - midR);
    const db = Math.hypot(pb.q - midQ, pb.r - midR);
    return db - da;
  });
  let eroded = 0;
  for (const k of rim) {
    if (bboxFill <= targetBboxFill || eroded >= maxErode) break;
    setHexToMorze(hexes[k]);
    landCount--;
    bboxFill = landCount / bboxArea;
    eroded++;
  }
  return eroded;
}
function carvePangeaLongSideGulfs(hexes, landScores, perm, maxAspect = 1.85, maxCarve = 900) {
  const landKeys = Object.keys(hexes).filter((k) => isDryLandTerrain(hexes[k].terenBazowy));
  if (landKeys.length < 80) return 0;
  let qMin = Infinity, qMax = -Infinity, rMin = Infinity, rMax = -Infinity;
  for (const k of landKeys) {
    const { q, r } = parseHexKey(k);
    qMin = Math.min(qMin, q);
    qMax = Math.max(qMax, q);
    rMin = Math.min(rMin, r);
    rMax = Math.max(rMax, r);
  }
  const spanQ = qMax - qMin + 1;
  const spanR = rMax - rMin + 1;
  const aspect = Math.max(spanQ, spanR) / Math.max(1, Math.min(spanQ, spanR));
  if (aspect <= maxAspect) return 0;
  const longIsQ = spanQ >= spanR;
  const midLong = longIsQ ? (qMin + qMax) / 2 : (rMin + rMax) / 2;
  const shortMin = longIsQ ? rMin : qMin;
  const shortMax = longIsQ ? rMax : qMax;
  const shortSpan = shortMax - shortMin + 1;
  const carveDepth = Math.max(3, Math.floor(shortSpan * 0.28));
  const scored = landKeys.map((k) => {
    const { q, r } = parseHexKey(k);
    const along = longIsQ ? q : r;
    const across = longIsQ ? r : q;
    const onLongSide = across <= shortMin + carveDepth || across >= shortMax - carveDepth;
    const nearMid = Math.abs(along - midLong) < Math.max(spanQ, spanR) * 0.42;
    const noise = fbm(perm, q * 0.08 + 40, r * 0.08 + 40, 3);
    return { k, score: (landScores.get(k) ?? 0) + noise * 0.15, onLongSide, nearMid, across };
  }).filter((x) => x.onLongSide && x.nearMid).sort((a, b) => a.score - b.score);
  let carved = 0;
  for (const x of scored) {
    if (carved >= maxCarve) break;
    const distEdge = Math.min(x.across - shortMin, shortMax - x.across);
    if (distEdge > carveDepth) continue;
    setHexToMorze(hexes[x.k]);
    carved++;
  }
  return carved;
}
function rebalanceLandFractionPangea(hexes, landScores, targetLandFraction, width, height, perm) {
  const fillMin = pangeaLandLayoutParams(targetLandFraction, width, height).fillMinScore;
  fillPangeaAnnularSeaCorridors(hexes, width, height);
  applyLandFractionByScore2(hexes, landScores, targetLandFraction, width, height, "mask", fillMin);
  enforceMapBorderOcean(hexes, width, height);
  erodePangeaBboxLowScoreRim(hexes, landScores);
  carvePangeaLongSideGulfs(hexes, landScores, perm);
  fillPangeaAnnularSeaCorridors(hexes, width, height);
  applyLandFractionByScore2(hexes, landScores, targetLandFraction, width, height, "mask", fillMin);
  enforceMapBorderOcean(hexes, width, height);
  erodePangeaBboxLowScoreRim(hexes, landScores);
  carvePangeaLongSideGulfs(hexes, landScores, perm);
  fillPangeaAnnularSeaCorridors(hexes, width, height);
  ensurePangeaSingleContinent(hexes, width, height);
  applyLandFractionByScore2(hexes, landScores, targetLandFraction, width, height, "mask", fillMin);
  enforceMapBorderOcean(hexes, width, height);
  applyJaggedCoastNoise(hexes, perm, width, height, 5);
  fillPangeaAnnularSeaCorridors(hexes, width, height);
  ensurePangeaSingleContinent(hexes, width, height);
  enforceMapBorderOcean(hexes, width, height);
}
function applyLandFractionByContinent(hexes, landScores, continentOf, nContinents, targetLandFraction, width, height) {
  const clamped = Math.max(0.15, Math.min(0.85, targetLandFraction));
  const total = Object.keys(hexes).length;
  const targetLand = Math.round(total * clamped);
  const zoneKeys = Array.from({ length: nContinents }, () => []);
  for (const k of Object.keys(hexes)) {
    const raw = continentOf.get(k) ?? 0;
    const ci = Math.min(nContinents - 1, Math.max(0, raw));
    zoneKeys[ci].push(k);
  }
  const scoreSums = zoneKeys.map(
    (keys) => keys.reduce((s, k) => s + (landScores.get(k) ?? 0), 0)
  );
  const totalScore = scoreSums.reduce((a, b) => a + b, 0) || 1;
  let assigned = 0;
  let adjusted = 0;
  const hasBorder = width != null && height != null && width > 0 && height > 0;
  const borderOk = (k) => {
    if (!hasBorder) return true;
    const { q, r } = parseHexKey(k);
    return !isInMapBorder(q, r, width, height);
  };
  for (let ci = 0; ci < nContinents; ci++) {
    const keys = zoneKeys[ci];
    const quota = ci === nContinents - 1 ? targetLand - assigned : Math.round(targetLand * (scoreSums[ci] / totalScore));
    assigned += quota;
    let land = keys.filter((k) => isDryLandTerrain(hexes[k].terenBazowy)).length;
    if (land < quota) {
      const morseCandidates = keys.filter((k) => hexes[k].terenBazowy === "morze" /* Morze */ && borderOk(k)).sort((a, b) => {
        const sa = landScores.get(a) ?? 0;
        const sb = landScores.get(b) ?? 0;
        if (Math.abs(sb - sa) > 0.04) return sb - sa;
        const pa = parseHexKey(a);
        const pb = parseHexKey(b);
        const da = hasBorder ? mapCenterDistanceNorm(pa.q, pa.r, width, height) : 0;
        const db = hasBorder ? mapCenterDistanceNorm(pb.q, pb.r, width, height) : 0;
        return da - db;
      });
      for (const k of morseCandidates) {
        if (land >= quota) break;
        setHexToLaka(hexes[k]);
        land++;
        adjusted++;
      }
    } else if (land > quota) {
      const landCandidates = sortLandKeysForErosion(
        keys.filter((k) => isDryLandTerrain(hexes[k].terenBazowy)),
        hexes,
        landScores,
        width ?? 1,
        height ?? 1
      );
      for (const k of landCandidates) {
        if (land <= quota) break;
        setHexToMorze(hexes[k]);
        land--;
        adjusted++;
      }
    }
  }
  const { land: finalLand } = countLandSeaHexes2(hexes);
  if (finalLand !== targetLand && width != null && height != null) {
    adjusted += applyLandFractionByScore2(hexes, landScores, targetLandFraction, width, height);
    adjusted += applyMarginalLandZoneCaps(hexes, landScores, width, height);
    enforceMapBorderOcean(hexes, width, height);
  }
  return adjusted;
}
function isDryLandTerrain(tb) {
  return tb !== "morze" /* Morze */ && tb !== "wybrzeze" /* Wybrzeze */;
}
function applyCoastRing(hexes) {
  const toCoast = [];
  for (const [key, hex] of Object.entries(hexes)) {
    if (hex.terenBazowy !== "morze" /* Morze */) continue;
    const parts = key.split(",");
    const q = Number(parts[0]);
    const r = Number(parts[1]);
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nb = hexes[hexKey(q + dq, r + dr)];
      if (nb && isDryLandTerrain(nb.terenBazowy)) {
        toCoast.push(key);
        break;
      }
    }
  }
  for (const key of toCoast) {
    const hex = hexes[key];
    hex.terenBazowy = "wybrzeze" /* Wybrzeze */;
    hex.nakladka = "brak" /* Brak */;
    delete hex.zloze;
  }
  return toCoast.length;
}
function applyDoubleCoastRing(hexes) {
  let n = applyCoastRing(hexes);
  const toCoast = [];
  for (const [key, hex] of Object.entries(hexes)) {
    if (hex.terenBazowy !== "morze" /* Morze */) continue;
    const parts = key.split(",");
    const q = Number(parts[0]);
    const r = Number(parts[1]);
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nb = hexes[hexKey(q + dq, r + dr)];
      if (nb?.terenBazowy === "wybrzeze" /* Wybrzeze */) {
        toCoast.push(key);
        break;
      }
    }
  }
  for (const key of toCoast) {
    const hex = hexes[key];
    hex.terenBazowy = "wybrzeze" /* Wybrzeze */;
    hex.nakladka = "brak" /* Brak */;
    delete hex.zloze;
  }
  return n + toCoast.length;
}
function findDryLandTouchingSea(hexes) {
  const bad = [];
  for (const [key, hex] of Object.entries(hexes)) {
    if (!isDryLandTerrain(hex.terenBazowy)) continue;
    const parts = key.split(",");
    const q = Number(parts[0]);
    const r = Number(parts[1]);
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nb = hexes[hexKey(q + dq, r + dr)];
      if (nb?.terenBazowy === "morze" /* Morze */) {
        bad.push(key);
        break;
      }
    }
  }
  return bad;
}
function sanitizeCoastHexes(hexes) {
  const valid = /* @__PURE__ */ new Set();
  const queue = [];
  for (const [key, hex] of Object.entries(hexes)) {
    if (hex.terenBazowy !== "wybrzeze" /* Wybrzeze */) continue;
    const parts = key.split(",");
    const q = Number(parts[0]);
    const r = Number(parts[1]);
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nb = hexes[hexKey(q + dq, r + dr)];
      if (nb && isDryLandTerrain(nb.terenBazowy)) {
        valid.add(key);
        queue.push(key);
        break;
      }
    }
  }
  while (queue.length > 0) {
    const key = queue.pop();
    const parts = key.split(",");
    const q = Number(parts[0]);
    const r = Number(parts[1]);
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nk = hexKey(q + dq, r + dr);
      if (valid.has(nk)) continue;
      if (hexes[nk]?.terenBazowy === "wybrzeze" /* Wybrzeze */) {
        valid.add(nk);
        queue.push(nk);
      }
    }
  }
  let fixed = 0;
  for (const [key, hex] of Object.entries(hexes)) {
    if (hex.terenBazowy !== "wybrzeze" /* Wybrzeze */) continue;
    if (valid.has(key)) continue;
    setHexToMorze(hex);
    fixed++;
  }
  return fixed;
}
function oceanConnectedWaterKeys(hexes, width, height) {
  const connected = /* @__PURE__ */ new Set();
  const queue = [];
  const isOceanWater = (tb) => tb === "morze" /* Morze */ || tb === "wybrzeze" /* Wybrzeze */;
  for (let r = 0; r < height; r++) {
    for (let q = 0; q < width; q++) {
      if (q !== 0 && r !== 0 && q !== width - 1 && r !== height - 1) continue;
      const key = hexKey(q, r);
      const hex = hexes[key];
      if (!hex || !isOceanWater(hex.terenBazowy)) continue;
      connected.add(key);
      queue.push(key);
    }
  }
  while (queue.length > 0) {
    const key = queue.pop();
    const parts = key.split(",");
    const q = Number(parts[0]);
    const r = Number(parts[1]);
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nk = hexKey(q + dq, r + dr);
      const nh = hexes[nk];
      if (!nh || !isOceanWater(nh.terenBazowy) || connected.has(nk)) continue;
      connected.add(nk);
      queue.push(nk);
    }
  }
  return connected;
}
function oceanConnectedMorseKeys(hexes, width, height) {
  const connected = /* @__PURE__ */ new Set();
  const queue = [];
  for (let r = 0; r < height; r++) {
    for (let q = 0; q < width; q++) {
      if (q !== 0 && r !== 0 && q !== width - 1 && r !== height - 1) continue;
      const key = hexKey(q, r);
      const hex = hexes[key];
      if (!hex || hex.terenBazowy !== "morze" /* Morze */) continue;
      connected.add(key);
      queue.push(key);
    }
  }
  while (queue.length > 0) {
    const key = queue.pop();
    const parts = key.split(",");
    const q = Number(parts[0]);
    const r = Number(parts[1]);
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nk = hexKey(q + dq, r + dr);
      const nh = hexes[nk];
      if (!nh || nh.terenBazowy !== "morze" /* Morze */ || connected.has(nk)) continue;
      connected.add(nk);
      queue.push(nk);
    }
  }
  return connected;
}
function findInlandWaterHexes(hexes, width, height) {
  const ocean = oceanConnectedWaterKeys(hexes, width, height);
  return Object.entries(hexes).filter(([k, h]) => {
    const tb = h.terenBazowy;
    return (tb === "morze" /* Morze */ || tb === "wybrzeze" /* Wybrzeze */) && !ocean.has(k);
  }).map(([k]) => k);
}
function findInlandSeaHexes2(hexes, width, height) {
  const ocean = oceanConnectedMorseKeys(hexes, width, height);
  return Object.entries(hexes).filter(([k, h]) => h.terenBazowy === "morze" /* Morze */ && !ocean.has(k)).map(([k]) => k);
}
function removeInlandWaterPools(hexes, width, height) {
  const inland = findInlandWaterHexes(hexes, width, height);
  for (const key of inland) {
    const hex = hexes[key];
    hex.terenBazowy = "laka" /* Laka */;
    hex.nakladka = "brak" /* Brak */;
    delete hex.zloze;
  }
  return inland.length;
}
function purgeDesertEnclaveWater(hexes, width, height) {
  let n = 0;
  for (const key of findInlandWaterHexes(hexes, width, height)) {
    const { q, r } = parseHexKey(key);
    let pustN = 0;
    let dryN = 0;
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nh = hexes[hexKey(q + dq, r + dr)];
      if (!nh || nh.terenBazowy === "morze" /* Morze */ || nh.terenBazowy === "wybrzeze" /* Wybrzeze */) continue;
      dryN++;
      if (nh.terenBazowy === "pustynia" /* Pustynia */) pustN++;
    }
    const hex = hexes[key];
    const inDesert = climateBandAt(q, r, height) === "desert";
    hex.terenBazowy = inDesert && (pustN >= 2 || dryN > 0 && pustN >= dryN * 0.4) ? "pustynia" /* Pustynia */ : "laka" /* Laka */;
    hex.nakladka = "brak" /* Brak */;
    hex.rzeka = { obecna: false, krawedzie: [] };
    delete hex.zloze;
    n++;
  }
  return n;
}
function fillEnclosedWaterByLandNeighbors(hexes, minLandNeighbors = 5) {
  let total = 0;
  for (let pass = 0; pass < 8; pass++) {
    let n = 0;
    for (const [key, hex] of Object.entries(hexes)) {
      if (hex.terenBazowy !== "morze" /* Morze */ && hex.terenBazowy !== "wybrzeze" /* Wybrzeze */) {
        continue;
      }
      const { q, r } = parseHexKey(key);
      if (countLandNeighbors(hexes, q, r) < minLandNeighbors) continue;
      hex.terenBazowy = "laka" /* Laka */;
      hex.nakladka = "brak" /* Brak */;
      hex.rzeka = { obecna: false, krawedzie: [] };
      delete hex.zloze;
      n++;
    }
    total += n;
    if (n === 0) break;
  }
  return total;
}
function purgeInlandWaterForMultiLandTyp(hexes, width, height) {
  let n = fillEnclosedWaterByLandNeighbors(hexes, 5);
  n += removeInlandWaterPools(hexes, width, height);
  n += trimEnclosedOceanOnly(hexes, width, height);
  n += fillEnclosedWaterByLandNeighbors(hexes, 4);
  n += removeInlandWaterPools(hexes, width, height);
  return n;
}
function applyJaggedCoastNoise(hexes, perm, width, height, passes = 2) {
  const noiseScale = 0.28;
  let changed = 0;
  for (let pass = 0; pass < passes; pass++) {
    const toErode = [];
    const toFill = [];
    for (let r = 0; r < height; r++) {
      for (let q = 0; q < width; q++) {
        if (isInMapBorder(q, r, width, height)) continue;
        const key = hexKey(q, r);
        const hex = hexes[key];
        if (!hex) continue;
        const coarse = fbm(perm, q * noiseScale + pass * 17, r * noiseScale + pass * 31, 4);
        const fine = fbm(perm, q * noiseScale * 2.1 + 200, r * noiseScale * 2.1 + 200, 3) * 0.35;
        const coast = coarse + fine;
        if (hex.terenBazowy !== "morze" /* Morze */ && isCoastalLandHex(hexes, q, r)) {
          if (coast > 0.68) toErode.push(key);
        } else if (hex.terenBazowy === "morze" /* Morze */ && isCoastalMorseHex(hexes, q, r)) {
          if (coast < 0.32) toFill.push(key);
        }
      }
    }
    for (const key of toErode) {
      setHexToMorze(hexes[key]);
      changed++;
    }
    for (const key of toFill) {
      setHexToLaka(hexes[key]);
      changed++;
    }
  }
  return changed;
}
function removeSmallInlandWaterPools(hexes, width, height, maxPoolSize) {
  const inlandSet = new Set(findInlandWaterHexes(hexes, width, height));
  const visited = /* @__PURE__ */ new Set();
  let converted = 0;
  for (const start of inlandSet) {
    if (visited.has(start)) continue;
    const comp = [];
    const stack = [start];
    visited.add(start);
    while (stack.length > 0) {
      const key = stack.pop();
      comp.push(key);
      const parts = key.split(",");
      const q = Number(parts[0]);
      const r = Number(parts[1]);
      for (const [dq, dr] of HEX_DIRECTIONS) {
        const nk = hexKey(q + dq, r + dr);
        if (!inlandSet.has(nk) || visited.has(nk)) continue;
        visited.add(nk);
        stack.push(nk);
      }
    }
    if (comp.length > maxPoolSize) continue;
    for (const key of comp) {
      const hex = hexes[key];
      hex.terenBazowy = "laka" /* Laka */;
      hex.nakladka = "brak" /* Brak */;
      delete hex.zloze;
      converted++;
    }
  }
  return converted;
}
function removeInlandSeaPools(hexes, width, height) {
  return removeInlandWaterPools(hexes, width, height);
}
function pangeaAnnularMaxCorridorWidth(width, height) {
  const mapScale = Math.sqrt(width * height / 20160);
  return Math.max(6, Math.min(22, Math.round(6 + mapScale * 2.6)));
}
function groupDryLandMassKeys(hexes) {
  const visited = /* @__PURE__ */ new Set();
  const groups = [];
  for (const key of Object.keys(hexes)) {
    const hex = hexes[key];
    if (!hex || !isDryLandTerrain(hex.terenBazowy)) continue;
    if (visited.has(key)) continue;
    const mass = [];
    const stack = [key];
    visited.add(key);
    while (stack.length) {
      const k = stack.pop();
      mass.push(k);
      const { q, r } = parseHexKey(k);
      for (const [dq, dr] of HEX_DIRECTIONS) {
        const nk = hexKey(q + dq, r + dr);
        if (visited.has(nk)) continue;
        const nh = hexes[nk];
        if (!nh || !isDryLandTerrain(nh.terenBazowy)) continue;
        visited.add(nk);
        stack.push(nk);
      }
    }
    groups.push(mass);
  }
  return groups;
}
function isPangeaBridgeWater(tb) {
  return tb === "morze" /* Morze */ || tb === "wybrzeze" /* Wybrzeze */;
}
function ensurePangeaSingleContinent(hexes, width, height) {
  const mapScale = Math.sqrt(width * height / 20160);
  const maxBridge = Math.max(18, Math.min(48, Math.round(16 + mapScale * 6)));
  let converted = 0;
  for (let iter = 0; iter < 12; iter++) {
    const masses = groupDryLandMassKeys(hexes).sort((a, b) => b.length - a.length);
    if (masses.length <= 1) break;
    const main = masses[0];
    const mainSet = new Set(main);
    const dist = /* @__PURE__ */ new Map();
    const parent = /* @__PURE__ */ new Map();
    const queue = [];
    for (const k of main) {
      const { q, r } = parseHexKey(k);
      for (const [dq, dr] of HEX_DIRECTIONS) {
        const nk = hexKey(q + dq, r + dr);
        const nh = hexes[nk];
        if (!nh || !isPangeaBridgeWater(nh.terenBazowy)) continue;
        if (dist.has(nk)) continue;
        dist.set(nk, 1);
        parent.set(nk, k);
        queue.push(nk);
      }
    }
    let hitSea = null;
    let qi = 0;
    while (qi < queue.length) {
      const cur2 = queue[qi++];
      const d = dist.get(cur2);
      if (d > maxBridge) continue;
      const { q, r } = parseHexKey(cur2);
      let foundForeign = false;
      for (const [dq, dr] of HEX_DIRECTIONS) {
        const nk = hexKey(q + dq, r + dr);
        const nh = hexes[nk];
        if (!nh) continue;
        if (isDryLandTerrain(nh.terenBazowy)) {
          if (!mainSet.has(nk)) {
            hitSea = cur2;
            foundForeign = true;
            break;
          }
          continue;
        }
        if (!isPangeaBridgeWater(nh.terenBazowy)) continue;
        if (dist.has(nk)) continue;
        dist.set(nk, d + 1);
        parent.set(nk, cur2);
        queue.push(nk);
      }
      if (foundForeign) break;
    }
    if (!hitSea) {
      for (let mi = 1; mi < masses.length; mi++) {
        const other = masses[mi];
        if (other.length > Math.max(60, Math.floor(main.length * 0.25))) continue;
        for (const k of other) {
          const h = hexes[k];
          if (h && isDryLandTerrain(h.terenBazowy)) {
            setHexToMorze(h);
            converted++;
          }
        }
      }
      break;
    }
    let cur = hitSea;
    let pathLen = 0;
    while (cur && pathLen <= maxBridge + 2) {
      const h = hexes[cur];
      if (!h) break;
      if (isPangeaBridgeWater(h.terenBazowy)) {
        setHexToLaka(h);
        converted++;
      }
      if (mainSet.has(cur)) break;
      cur = parent.get(cur);
      pathLen++;
    }
  }
  converted += fillPangeaAnnularSeaCorridors(hexes, width, height);
  return converted;
}
function pangeaLandCentroid(hexes) {
  const landKeys = Object.keys(hexes).filter((k) => isDryLandTerrain(hexes[k].terenBazowy));
  if (landKeys.length < 40) return null;
  let sumQ = 0;
  let sumR = 0;
  for (const k of landKeys) {
    const { q, r } = parseHexKey(k);
    sumQ += q;
    sumR += r;
  }
  return { cQ: sumQ / landKeys.length, cR: sumR / landKeys.length };
}
function pangeaRadialDryLandSteps(hexes, q, r, cQ, cR, towardCenter, maxSteps) {
  const distSelf = Math.hypot(q - cQ, r - cR);
  if (distSelf < 0.01) return null;
  const uq = (q - cQ) / distSelf;
  const ur = (r - cR) / distSelf;
  const sign = towardCenter ? -1 : 1;
  for (let step = 1; step <= maxSteps; step++) {
    const nq = Math.round(q + sign * uq * step);
    const nr = Math.round(r + sign * ur * step);
    const nh = hexes[hexKey(nq, nr)];
    if (!nh) return null;
    if (isDryLandTerrain(nh.terenBazowy)) return step;
    if (!isPangeaBridgeWater(nh.terenBazowy)) return null;
  }
  return null;
}
function pangeaSeaHexIsAnnularCorridor(hexes, q, r, cQ, cR, maxCorridorWidth) {
  const inward = pangeaRadialDryLandSteps(hexes, q, r, cQ, cR, true, maxCorridorWidth);
  const outward = pangeaRadialDryLandSteps(hexes, q, r, cQ, cR, false, maxCorridorWidth);
  if (inward == null || outward == null) return false;
  return inward <= maxCorridorWidth && outward <= maxCorridorWidth;
}
function measurePangeaAnnularCorridorHexes(hexes, width = 0, height = 0) {
  const centroid = pangeaLandCentroid(hexes);
  if (!centroid) return 0;
  const { cQ, cR } = centroid;
  const maxW = width > 0 && height > 0 ? pangeaAnnularMaxCorridorWidth(width, height) : 6;
  let annular = 0;
  for (const hex of Object.values(hexes)) {
    if (!isPangeaBridgeWater(hex.terenBazowy)) continue;
    const { q, r } = hex.coords;
    if (pangeaSeaHexIsAnnularCorridor(hexes, q, r, cQ, cR, maxW)) annular++;
  }
  return annular;
}
var pangeaBagelAuditSnaps = null;
function snapPangeaBagelAudit(stage, hexes, width, height) {
  if (!pangeaBagelAuditSnaps) return;
  const masses = groupDryLandMassKeys(hexes);
  let dryLand = 0;
  for (const m of masses) dryLand += m.length;
  pangeaBagelAuditSnaps.push({
    stage,
    annular: measurePangeaAnnularCorridorHexes(hexes, width, height),
    dryMasses: masses.length,
    dryLand,
    inlandMorze: findInlandSeaHexes2(hexes, width, height).length
  });
}
function fillPangeaAnnularSeaCorridors(hexes, width, height, maxCorridorWidth) {
  const maxW = maxCorridorWidth ?? pangeaAnnularMaxCorridorWidth(width, height);
  const borderDepth = morseDepthFromMapBorder(hexes, width, height);
  let converted = 0;
  for (let pass = 0; pass < maxW + 2; pass++) {
    const centroid = pangeaLandCentroid(hexes);
    if (!centroid) break;
    const { cQ, cR } = centroid;
    let passConverted = 0;
    for (const [key, hex] of Object.entries(hexes)) {
      if (!isPangeaBridgeWater(hex.terenBazowy)) continue;
      const { q, r } = hex.coords;
      if (!pangeaSeaHexIsAnnularCorridor(hexes, q, r, cQ, cR, maxW)) continue;
      if (borderDepth.has(key)) {
        const distSelf = Math.hypot(q - cQ, r - cR);
        const uq = (q - cQ) / Math.max(0.01, distSelf);
        const ur = (r - cR) / Math.max(0.01, distSelf);
        let seaBand = 1;
        for (let step = 1; step <= maxW + 2; step++) {
          const oq = Math.round(q + uq * step);
          const or = Math.round(r + ur * step);
          const oh = hexes[hexKey(oq, or)];
          if (!oh || !isPangeaBridgeWater(oh.terenBazowy)) break;
          seaBand++;
        }
        for (let step = 1; step <= maxW + 2; step++) {
          const iq = Math.round(q - uq * step);
          const ir = Math.round(r - ur * step);
          const ih = hexes[hexKey(iq, ir)];
          if (!ih || !isPangeaBridgeWater(ih.terenBazowy)) break;
          seaBand++;
        }
        if (seaBand > maxW + 1) continue;
      }
      setHexToLaka(hex);
      passConverted++;
    }
    converted += passConverted;
    if (passConverted === 0) break;
  }
  return converted;
}
function morseDepthFromMapBorder(hexes, width, height) {
  const dist = /* @__PURE__ */ new Map();
  const queue = [];
  for (let r = 0; r < height; r++) {
    for (let q = 0; q < width; q++) {
      const onBorder = q === 0 || r === 0 || q === width - 1 || r === height - 1;
      if (!onBorder) continue;
      const key = hexKey(q, r);
      const hex = hexes[key];
      if (hex?.terenBazowy !== "morze" /* Morze */) continue;
      dist.set(key, 0);
      queue.push(key);
    }
  }
  let head = 0;
  while (head < queue.length) {
    const key = queue[head++];
    const d = dist.get(key);
    const parts = key.split(",");
    const q = Number(parts[0]);
    const r = Number(parts[1]);
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nk = hexKey(q + dq, r + dr);
      if (dist.has(nk)) continue;
      const nh = hexes[nk];
      if (nh?.terenBazowy !== "morze" /* Morze */) continue;
      dist.set(nk, d + 1);
      queue.push(nk);
    }
  }
  return dist;
}
function trimEnclosedOceanOnly(hexes, width, height) {
  const depth = morseDepthFromMapBorder(hexes, width, height);
  let converted = 0;
  for (const [key, hex] of Object.entries(hexes)) {
    if (hex.terenBazowy !== "morze" /* Morze */) continue;
    if (depth.has(key)) continue;
    hex.terenBazowy = "laka" /* Laka */;
    hex.nakladka = "brak" /* Brak */;
    hex.rzeka = { obecna: false, krawedzie: [] };
    delete hex.zloze;
    converted++;
  }
  return converted;
}
function purgeReliefValleyWater(hexes, width, height) {
  const depth = morseDepthFromMapBorder(hexes, width, height);
  let converted = 0;
  for (const hex of Object.values(hexes)) {
    const tb = hex.terenBazowy;
    if (tb !== "morze" /* Morze */ && tb !== "wybrzeze" /* Wybrzeze */) continue;
    const { q, r } = hex.coords;
    const key = hexKey(q, r);
    if (depth.has(key)) continue;
    let reliefNeighbors = 0;
    let dryLandNeighbors = 0;
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nh = hexes[hexKey(q + dq, r + dr)];
      if (!nh || nh.terenBazowy === "morze" /* Morze */ || nh.terenBazowy === "wybrzeze" /* Wybrzeze */) continue;
      dryLandNeighbors++;
      if (nh.terenBazowy === "gory" /* Gory */ || nh.terenBazowy === "wzgorza" /* Wzgorza */) reliefNeighbors++;
    }
    if (reliefNeighbors >= 2 && dryLandNeighbors >= 3) {
      hex.terenBazowy = "laka" /* Laka */;
      hex.nakladka = "brak" /* Brak */;
      hex.rzeka = { obecna: false, krawedzie: [] };
      delete hex.zloze;
      converted++;
    }
  }
  return converted;
}
function trimDeepOceanBays(hexes, width, height, _maxDepth) {
  const depth = morseDepthFromMapBorder(hexes, width, height);
  let converted = 0;
  for (const [key, hex] of Object.entries(hexes)) {
    if (hex.terenBazowy !== "morze" /* Morze */) continue;
    const d = depth.get(key);
    if (d !== void 0) continue;
    hex.terenBazowy = "laka" /* Laka */;
    hex.nakladka = "brak" /* Brak */;
    hex.rzeka = { obecna: false, krawedzie: [] };
    delete hex.zloze;
    converted++;
  }
  return converted;
}
function finalizeCoastAndInlandWater(hexes, width, height, maxPasses = 3, opts) {
  for (let pass = 0; pass < maxPasses; pass++) {
    let changed = 0;
    if (opts?.maxInlandPoolSize != null) {
      changed += removeSmallInlandWaterPools(hexes, width, height, opts.maxInlandPoolSize);
    } else {
      changed += removeInlandWaterPools(hexes, width, height);
    }
    changed += applyDoubleCoastRing(hexes);
    changed += sanitizeCoastHexes(hexes);
    if (opts?.maxInlandPoolSize != null) {
      changed += removeSmallInlandWaterPools(hexes, width, height, opts.maxInlandPoolSize);
    } else {
      changed += removeInlandWaterPools(hexes, width, height);
    }
    if (findInlandWaterHexes(hexes, width, height).length === 0 && findDryLandTouchingSea(hexes).length === 0) {
      break;
    }
    if (changed === 0) break;
  }
}
function thickenCoastAndSmoothInlets(hexes, width, height, coastWidth = 2) {
  let changed = 0;
  for (let pass = 0; pass < 12; pass++) {
    const toFill = [];
    for (const [key, hex] of Object.entries(hexes)) {
      if (hex.terenBazowy !== "morze" /* Morze */) continue;
      const { q, r } = parseHexKey(key);
      if (isInMapBorder(q, r, width, height)) continue;
      if (countLandNeighbors(hexes, q, r) >= 4) toFill.push(key);
    }
    if (toFill.length === 0) break;
    for (const key of toFill) {
      setHexToLaka(hexes[key]);
      changed++;
    }
  }
  changed += removeInlandWaterPools(hexes, width, height);
  for (const hex of Object.values(hexes)) {
    if (hex.terenBazowy === "wybrzeze" /* Wybrzeze */) {
      setHexToMorze(hex);
      changed++;
    }
  }
  for (let ring = 0; ring < coastWidth; ring++) {
    const toCoast = [];
    for (const [key, hex] of Object.entries(hexes)) {
      if (hex.terenBazowy !== "morze" /* Morze */) continue;
      const { q, r } = parseHexKey(key);
      for (const [dq, dr] of HEX_DIRECTIONS) {
        const nb = hexes[hexKey(q + dq, r + dr)];
        if (nb && (isDryLandTerrain(nb.terenBazowy) || nb.terenBazowy === "wybrzeze" /* Wybrzeze */)) {
          toCoast.push(key);
          break;
        }
      }
    }
    if (toCoast.length === 0) break;
    for (const key of toCoast) {
      const hex = hexes[key];
      hex.terenBazowy = "wybrzeze" /* Wybrzeze */;
      hex.nakladka = "brak" /* Brak */;
      delete hex.zloze;
      changed++;
    }
  }
  return changed;
}
function flattenFalseCoastalRiverNotches(hexes, width, height) {
  const toFlatten = [];
  for (const [key, hex] of Object.entries(hexes)) {
    if (hex.terenBazowy !== "wybrzeze" /* Wybrzeze */) continue;
    if (hex.rzeka?.obecna) continue;
    const { q, r } = parseHexKey(key);
    if (isInMapBorder(q, r, width, height)) continue;
    let morzeN = 0;
    for (const [dq, dr] of HEX_DIRECTIONS) {
      if (hexes[hexKey(q + dq, r + dr)]?.terenBazowy === "morze" /* Morze */) morzeN++;
    }
    if (morzeN >= 5) toFlatten.push(key);
  }
  for (const key of toFlatten) {
    const hex = hexes[key];
    hex.terenBazowy = "morze" /* Morze */;
    hex.nakladka = "brak" /* Brak */;
    hex.rzeka = { obecna: false, krawedzie: [] };
    delete hex.zloze;
  }
  return toFlatten.length;
}
function removeTinyLandIslands(hexes, minHexes) {
  const visited = /* @__PURE__ */ new Set();
  let removed = 0;
  for (const key of Object.keys(hexes)) {
    if (visited.has(key)) continue;
    const h = hexes[key];
    if (!h || !isLandOrCoast(h.terenBazowy)) continue;
    const stack = [key];
    const comp = [];
    visited.add(key);
    while (stack.length > 0) {
      const cur = stack.pop();
      comp.push(cur);
      const parts = cur.split(",");
      const q = Number(parts[0]);
      const r = Number(parts[1]);
      for (const [dq, dr] of HEX_DIRECTIONS) {
        const nk = hexKey(q + dq, r + dr);
        if (visited.has(nk)) continue;
        const nh = hexes[nk];
        if (!nh || !isLandOrCoast(nh.terenBazowy)) continue;
        visited.add(nk);
        stack.push(nk);
      }
    }
    if (comp.length >= minHexes) continue;
    for (const k of comp) {
      const hx = hexes[k];
      if (!hx) continue;
      hx.terenBazowy = "morze" /* Morze */;
      hx.nakladka = "brak" /* Brak */;
      hx.rzeka = { obecna: false, krawedzie: [] };
      delete hx.zloze;
      removed++;
    }
  }
  return removed;
}
function minTinyIslandHexesForTyp(typ) {
  switch (typ) {
    case "pangea":
      return 10;
    case "kontynenty":
      return 8;
    case "wyspy":
      return 4;
    case "ziemia":
      return 6;
    default:
      return 8;
  }
}
function purgeOpenOceanLandSpecks(hexes) {
  let removed = 0;
  for (const hex of Object.values(hexes)) {
    if (hex.terenBazowy === "morze" /* Morze */ || hex.terenBazowy === "wybrzeze" /* Wybrzeze */) {
      continue;
    }
    const { q, r } = hex.coords;
    let dryLandNeighbors = 0;
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nh = hexes[hexKey(q + dq, r + dr)];
      if (!nh) continue;
      if (nh.terenBazowy !== "morze" /* Morze */ && nh.terenBazowy !== "wybrzeze" /* Wybrzeze */) {
        dryLandNeighbors++;
      }
    }
    if (dryLandNeighbors > 0) continue;
    setHexToMorze(hex);
    removed++;
  }
  return removed;
}
function finalizeLandMassAfterCoast(hexes, typ, width, height, coastOpts, coastPasses = 2) {
  const minHexes = minTinyIslandHexesForTyp(typ);
  let total = 0;
  for (let pass = 0; pass < 3; pass++) {
    total += removeTinyLandIslands(hexes, minHexes);
    const purged = purgeOpenOceanLandSpecks(hexes);
    total += purged;
    if (purged === 0 && pass > 0) break;
  }
  finalizeCoastAndInlandWater(hexes, width, height, coastPasses, coastOpts);
  enforceMapBorderOcean(hexes, width, height);
  return total;
}
var DRY_LAND_FRACTION_TOLERANCE_PP = 3;
function enforceTargetDryLandFraction(hexes, landScores, targetLandFraction, width, height, coastOpts, tolerancePctPoints = DRY_LAND_FRACTION_TOLERANCE_PP, fillBias = "center", minMaskFillScore = PANGEA_LAND_FILL_MIN_SCORE) {
  const clamped = Math.max(0.15, Math.min(0.85, targetLandFraction));
  const total = Object.keys(hexes).length;
  const targetLand = Math.round(total * clamped);
  const toleranceHexes = Math.max(1, Math.round(total * tolerancePctPoints / 100));
  let adjusted = 0;
  adjusted += applyLandFractionByScore2(hexes, landScores, clamped, width, height, fillBias, minMaskFillScore);
  enforceMapBorderOcean(hexes, width, height);
  finalizeCoastAndInlandWater(hexes, width, height, 1, coastOpts);
  enforceMapBorderOcean(hexes, width, height);
  let { land } = countLandSeaHexes2(hexes);
  if (Math.abs(land - targetLand) > toleranceHexes) {
    adjusted += applyLandFractionByScore2(hexes, landScores, clamped, width, height, fillBias, minMaskFillScore);
    enforceMapBorderOcean(hexes, width, height);
    applyCoastRing(hexes);
    land = countLandSeaHexes2(hexes).land;
    if (Math.abs(land - targetLand) > toleranceHexes) {
      adjusted += applyLandFractionByScore2(hexes, landScores, clamped, width, height, fillBias, minMaskFillScore);
      enforceMapBorderOcean(hexes, width, height);
    }
  }
  return adjusted;
}
var ELEVATION_RANK = {
  ["morze" /* Morze */]: 0,
  ["wybrzeze" /* Wybrzeze */]: 1,
  ["laka" /* Laka */]: 2,
  ["pustynia" /* Pustynia */]: 3,
  ["rownina" /* Rownina */]: 4,
  ["wzgorza" /* Wzgorza */]: 5,
  ["gory" /* Gory */]: 6,
  ["polarny" /* Polarny */]: 2
};
function hexAxialDistance(q1, r1, q2, r2) {
  const dq = q1 - q2;
  const dr = r1 - r2;
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
}
function purgeOceanInsideEarthLandMask(hexes, width, height) {
  let n = 0;
  for (const [key, hex] of Object.entries(hexes)) {
    const { q, r } = parseHexKey(key);
    if (earthTemplateLandAt(q, r, width, height) <= 0) continue;
    if (hex.terenBazowy !== "morze" /* Morze */ && hex.terenBazowy !== "wybrzeze" /* Wybrzeze */) continue;
    let pustN = 0;
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nh = hexes[hexKey(q + dq, r + dr)];
      if (!nh || nh.terenBazowy === "morze" /* Morze */ || nh.terenBazowy === "wybrzeze" /* Wybrzeze */) continue;
      if (nh.terenBazowy === "pustynia" /* Pustynia */) pustN++;
    }
    hex.terenBazowy = climateBandAt(q, r, height) === "desert" && pustN >= 2 ? "pustynia" /* Pustynia */ : "laka" /* Laka */;
    hex.nakladka = "brak" /* Brak */;
    hex.rzeka = { obecna: false, krawedzie: [] };
    delete hex.zloze;
    n++;
  }
  return n;
}
function purgeStrayLandOutsideEarthMask(hexes, width, height) {
  let n = 0;
  for (const [key, hex] of Object.entries(hexes)) {
    const { q, r } = parseHexKey(key);
    if (earthTemplateLandAt(q, r, width, height) > 0) continue;
    if (!isDryLandTerrain(hex.terenBazowy)) continue;
    setHexToMorze(hex);
    n++;
  }
  return n;
}
function countMediumInlandLandHexes(hexes, path) {
  let n = 0;
  for (const p of path) {
    const h = hexes[hexKey(p.q, p.r)];
    if (h && isRiverLandTerrain(h.terenBazowy)) n++;
  }
  return n;
}
function sanitizeRiverPath(path) {
  if (path.length < 2) return path;
  const out = [{ ...path[0] }];
  const seen = /* @__PURE__ */ new Set([hexKey(path[0].q, path[0].r)]);
  for (let i = 1; i < path.length; i++) {
    const p = path[i];
    const k = hexKey(p.q, p.r);
    if (seen.has(k)) continue;
    const prev = out[out.length - 1];
    if (hexAxialDistance(prev.q, prev.r, p.q, p.r) !== 1) continue;
    out.push({ ...p });
    seen.add(k);
  }
  return out;
}
function repairRiverPathAdjacency(path, hexes, sourceKey) {
  if (path.length < 2) return path;
  const out = [{ ...path[0] }];
  const visited = /* @__PURE__ */ new Set([hexKey(out[0].q, out[0].r)]);
  for (let i = 1; i < path.length; i++) {
    const target = path[i];
    const targetK = hexKey(target.q, target.r);
    let guard = 0;
    while (guard++ < 64) {
      const cur = out[out.length - 1];
      const d = hexAxialDistance(cur.q, cur.r, target.q, target.r);
      if (d === 0) break;
      if (d === 1) {
        out.push({ ...target });
        visited.add(targetK);
        break;
      }
      let best = null;
      let bestDist = Infinity;
      for (const [dq, dr] of HEX_DIRECTIONS) {
        const nq = cur.q + dq;
        const nr = cur.r + dr;
        const nk = hexKey(nq, nr);
        if (visited.has(nk) && nk !== targetK) continue;
        if (!canRiverFlowThrough(hexes[nk], nk, sourceKey)) continue;
        const nd = hexAxialDistance(nq, nr, target.q, target.r);
        if (nd < bestDist) {
          bestDist = nd;
          best = { q: nq, r: nr };
        }
      }
      if (!best || bestDist >= d) break;
      out.push(best);
      visited.add(hexKey(best.q, best.r));
    }
  }
  return sanitizeRiverPath(out);
}
var RIVER_MIN_INLAND_FROM_SEA = 2;
var RIVER_MIN_MAIN_LEN = 3;
var RIVER_HARD_MEANDER_LEN = 8;
var RIVER_MOUTH_TAIL_LEN = 5;
var MAIN_RIVER_MIN_PATH_SEP = 3;
var MEDIUM_TRIBUTARY_SPACING_HEX = 4;
function mediumTributarySpacingHex(_width, _height, _largeMapPerf = false) {
  return MEDIUM_TRIBUTARY_SPACING_HEX;
}
var MEDIUM_TRIBUTARY_MIN_NET_LEN = 7;
function mediumTributaryMinNetLen(width, height) {
  const minDim = Math.min(width, height);
  if (minDim < 80) return 4;
  if (minDim < 120) return 5;
  return MEDIUM_TRIBUTARY_MIN_NET_LEN;
}
var MAIN_RIVER_COAST_MOUTH_MAX_GAP = 7;
function mainRiverCoastMouthMaxGapForDims(w, h) {
  const label = mapSizeLabelFromDims(w, h);
  if (label === "mala") return 5;
  return MAIN_RIVER_COAST_MOUTH_MAX_GAP;
}
function riverPathRespectsSeaBuffer(hexes, path, seaDist, minInland = RIVER_MIN_INLAND_FROM_SEA, mouthTail = RIVER_MOUTH_TAIL_LEN) {
  if (path.length === 0) return false;
  const bodyEnd = Math.max(0, path.length - mouthTail);
  for (let i = 0; i < bodyEnd; i++) {
    const p = path[i];
    const h = hexes[hexKey(p.q, p.r)];
    if (!h || h.terenBazowy === "morze" /* Morze */) return false;
    if ((seaDist.get(hexKey(p.q, p.r)) ?? 0) < minInland) return false;
  }
  return true;
}
function canRiverDrainStep(nk, nd, openOceanDist, oceanConnected, postInlandPhase) {
  if (oceanConnected.has(nk)) return true;
  const od = openOceanDist.get(nk);
  if (od == null) return false;
  if (!postInlandPhase) return nd >= RIVER_MIN_INLAND_FROM_SEA;
  if (nd >= RIVER_MIN_INLAND_FROM_SEA) return true;
  return od <= RIVER_MOUTH_TAIL_LEN;
}
function isRiverDrainageGoal(q, r, _seaDist, hexes, sourceKey, oceanConnected) {
  const k = hexKey(q, r);
  if (oceanConnected.has(k)) return true;
  for (const [dq, dr] of HEX_DIRECTIONS) {
    const nk = hexKey(q + dq, r + dr);
    if (!oceanConnected.has(nk)) continue;
    if (canRiverFlowThrough(hexes[nk], nk, sourceKey)) return true;
  }
  return false;
}
function buildSeaDistanceField(hexes) {
  const dist = /* @__PURE__ */ new Map();
  const queue = [];
  for (const [key, hex] of Object.entries(hexes)) {
    if (hex.terenBazowy === "morze" /* Morze */ || hex.terenBazowy === "wybrzeze" /* Wybrzeze */) {
      dist.set(key, 0);
      queue.push(key);
    }
  }
  let qi = 0;
  while (qi < queue.length) {
    const key = queue[qi++];
    const d = dist.get(key);
    const { q, r } = parseHexKey(key);
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nk = hexKey(q + dq, r + dr);
      if (dist.has(nk)) continue;
      if (!hexes[nk]) continue;
      dist.set(nk, d + 1);
      queue.push(nk);
    }
  }
  return dist;
}
function buildOpenOceanDistanceField(hexes, width, height, oceanConnected) {
  const ocean = oceanConnected ?? oceanConnectedWaterKeys(hexes, width, height);
  const dist = /* @__PURE__ */ new Map();
  const queue = [];
  for (const key of ocean) {
    dist.set(key, 0);
    queue.push(key);
  }
  let qi = 0;
  while (qi < queue.length) {
    const key = queue[qi++];
    const d = dist.get(key);
    const { q, r } = parseHexKey(key);
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nk = hexKey(q + dq, r + dr);
      if (dist.has(nk)) continue;
      if (!hexes[nk]) continue;
      dist.set(nk, d + 1);
      queue.push(nk);
    }
  }
  return dist;
}
var RIVER_PROFILE_ON = globalThis.process?.env?.CIV_RIVER_PROFILE === "1";
function rpNow() {
  if (typeof performance !== "undefined") return performance.now();
  return Date.now();
}
var _riverProfile = null;
function rpEnsure() {
  if (!_riverProfile) {
    _riverProfile = {
      fieldCacheMs: 0,
      fieldCacheCalls: 0,
      generateRiversMs: 0,
      genStage1Ms: 0,
      genStage2Ms: 0,
      genStage3Ms: 0,
      genDecorMs: 0,
      genDryPatchMs: 0,
      genStage2Rounds: 0,
      topUpMs: 0,
      topUpPassMs: [],
      topUpHardStartsMs: 0,
      topUpDryPatchMs: 0,
      topUpGridProxMs: 0,
      traceRiverCalls: 0,
      traceRiverMs: 0,
      aStarCalls: 0,
      aStarMs: 0,
      forceFillCalls: 0
    };
  }
  return _riverProfile;
}
function buildRiverFieldCache(hexes, width, height) {
  const t0 = RIVER_PROFILE_ON ? rpNow() : 0;
  const oceanConnected = oceanConnectedWaterKeys(hexes, width, height);
  const out = {
    seaDist: buildSeaDistanceField(hexes),
    oceanConnected,
    openOceanDist: buildOpenOceanDistanceField(hexes, width, height, oceanConnected)
  };
  if (RIVER_PROFILE_ON) {
    const s = rpEnsure();
    s.fieldCacheMs += rpNow() - t0;
    s.fieldCacheCalls++;
  }
  return out;
}
function inferMapDimsFromHexes(hexes) {
  let maxQ = 0;
  let maxR = 0;
  for (const key of Object.keys(hexes)) {
    const { q, r } = parseHexKey(key);
    if (q > maxQ) maxQ = q;
    if (r > maxR) maxR = r;
  }
  return { width: maxQ + 1, height: maxR + 1 };
}
function isReliefRiverSource(t) {
  return t === "gory" /* Gory */ || t === "wzgorza" /* Wzgorza */;
}
function pathEndsAtSea(hexes, path, width, height, oceanConnected) {
  if (path.length === 0) return false;
  const dims = width != null && height != null ? { width, height } : inferMapDimsFromHexes(hexes);
  const ocean = oceanConnected ?? oceanConnectedWaterKeys(hexes, dims.width, dims.height);
  const last = path[path.length - 1];
  const lk = hexKey(last.q, last.r);
  if (ocean.has(lk)) return true;
  for (const [dq, dr] of HEX_DIRECTIONS) {
    const nk = hexKey(last.q + dq, last.r + dr);
    if (ocean.has(nk)) return true;
  }
  return false;
}
function isReliefTerrain(t) {
  return t === "gory" /* Gory */ || t === "wzgorza" /* Wzgorza */;
}
function canRiverFlowThrough(hex, cellKey, sourceKey, blockExisting = false, allowKey, allowReliefTraversal = false) {
  if (!hex || hex.terenBazowy === "morze" /* Morze */) return false;
  if (isReliefTerrain(hex.terenBazowy) && !allowReliefTraversal) return cellKey === sourceKey;
  if (blockExisting && hex.rzeka?.obecna && cellKey !== allowKey) return false;
  return true;
}
function riverStepDir(from, to) {
  return [to.q - from.q, to.r - from.r];
}
function sameRiverDir(a, b) {
  return a[0] === b[0] && a[1] === b[1];
}
function reconstructRiverPath(cameFrom, endK) {
  const path = [];
  let cur = endK;
  while (cur) {
    const { q, r } = parseHexKey(cur);
    path.push({ q, r });
    cur = cameFrom.get(cur);
  }
  path.reverse();
  return path;
}
function growRiverInlandBeforeDrainage(hexes, sq, sr, seaDist, openOceanDist, rand, inlandTargetLen, stepCap, hardMeanderLen = RIVER_HARD_MEANDER_LEN, allowReliefTraversal = false, relaxSeaBuffer = false, inlandGrowthMax, blockRiverKeys, minPathSep = 0, landCentroid = null, landCenterSquare = null) {
  const srcKey = hexKey(sq, sr);
  const path = [{ q: sq, r: sr }];
  const visited = /* @__PURE__ */ new Set([srcKey]);
  const centroid = landCentroid ?? landCenterSquare?.centroid ?? estimateLandCentroidFromSeed(hexes, sq, sr, allowReliefTraversal);
  const growthTarget = Math.min(
    stepCap,
    inlandGrowthMax != null ? Math.max(inlandTargetLen, inlandGrowthMax) : inlandTargetLen
  );
  while (path.length < growthTarget && path.length < stepCap) {
    const cur = path[path.length - 1];
    const hardMeander = path.length < hardMeanderLen;
    const growBase = {
      hexes,
      path,
      cur,
      srcKey,
      seaDist,
      openOceanDist,
      landCentroid: centroid,
      landCenterSquare,
      rand,
      blockRiverKeys,
      minPathSep,
      allowReliefTraversal,
      hardMeander,
      relaxHardMeander: false,
      relaxSeaBuffer
    };
    let candidates = collectInlandDrainGrowCandidates(growBase).filter((c) => !visited.has(hexKey(c.q, c.r)));
    if (candidates.length === 0) {
      candidates = collectInlandDrainGrowCandidates({ ...growBase, relaxHardMeander: true }).filter((c) => !visited.has(hexKey(c.q, c.r)));
    }
    if (candidates.length === 0) {
      if (hardMeander && path.length < hardMeanderLen) {
        const softCandidates = collectInlandDrainGrowCandidates({
          ...growBase,
          relaxHardMeander: true,
          relaxSeaBuffer
        }).filter((c) => !visited.has(hexKey(c.q, c.r)));
        if (softCandidates.length === 0) break;
        softCandidates.sort((a, b) => b.score - a.score);
        const pick4 = softCandidates[0];
        path.push({ q: pick4.q, r: pick4.r });
        visited.add(hexKey(pick4.q, pick4.r));
        continue;
      }
      break;
    }
    candidates.sort((a, b) => b.score - a.score);
    const pickIdx = Math.min(candidates.length - 1, Math.floor(rand() * Math.min(3, candidates.length)));
    const pick3 = candidates[pickIdx] ?? candidates[0];
    path.push({ q: pick3.q, r: pick3.r });
    visited.add(hexKey(pick3.q, pick3.r));
  }
  return path;
}
function riverHexDirDelta(lastDir, newDir) {
  return ((newDir - lastDir) % 6 + 6) % 6;
}
function estimateLandCentroidFromSeed(hexes, mq, mr, allowReliefTraversal, visitCap = 6e3) {
  const mouthKey = hexKey(mq, mr);
  let sumQ = 0;
  let sumR = 0;
  let count = 0;
  const queue = [mouthKey];
  const seen = /* @__PURE__ */ new Set([mouthKey]);
  while (queue.length > 0 && seen.size < visitCap) {
    const k = queue.shift();
    const { q, r } = parseHexKey(k);
    const h = hexes[k];
    if (h && isRiverLandTerrain(h.terenBazowy)) {
      sumQ += q;
      sumR += r;
      count++;
    }
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nk = hexKey(q + dq, r + dr);
      if (seen.has(nk)) continue;
      if (!canRiverFlowThrough(hexes[nk], nk, mouthKey, false, void 0, allowReliefTraversal)) continue;
      seen.add(nk);
      queue.push(nk);
    }
  }
  if (count === 0) return null;
  return { q: sumQ / count, r: sumR / count };
}
function estimateLandCentroidFromMouth(hexes, mq, mr, allowReliefTraversal, visitCap = 6e3) {
  return estimateLandCentroidFromSeed(hexes, mq, mr, allowReliefTraversal, visitCap);
}
function scoreRiverStepTowardCentroid(q, r, nq, nr, centroid) {
  if (!centroid) return 0;
  const curD = hexAxialDistance(q, r, centroid.q, centroid.r);
  const nextD = hexAxialDistance(nq, nr, centroid.q, centroid.r);
  if (nextD < curD) return 22;
  if (nextD > curD) return -12;
  return 3;
}
function scoreRiverStepTowardCenterSquare(q, r, nq, nr, square) {
  if (!square) return 0;
  const curD = hexDistanceToCenterSquare(q, r, square);
  const nextD = hexDistanceToCenterSquare(nq, nr, square);
  if (square.keys.has(hexKey(nq, nr))) return 40;
  if (nextD < curD) return 32;
  if (nextD > curD) return -22;
  return 4;
}
function scoreRiverStepTowardLandCenter(q, r, nq, nr, square, centroid) {
  if (square) return scoreRiverStepTowardCenterSquare(q, r, nq, nr, square);
  return scoreRiverStepTowardCentroid(q, r, nq, nr, centroid);
}
function riverGrowStepPassesSep(nq, nr, blockRiverKeys, minPathSep, spatialIndex) {
  if (!blockRiverKeys || blockRiverKeys.size === 0 || minPathSep <= 0) return true;
  return nearestRiverHexDistance(nq, nr, blockRiverKeys, spatialIndex) >= minPathSep;
}
function collectCoastInlandGrowCandidates(o) {
  const curKey = hexKey(o.cur.q, o.cur.r);
  const curD = o.seaDist.get(curKey) ?? 0;
  const out = [];
  for (const [dq, dr] of HEX_DIRECTIONS) {
    const nq = o.cur.q + dq;
    const nr = o.cur.r + dr;
    const nk = hexKey(nq, nr);
    if (!isRiverWindowTurnAllowed(o.path, nq, nr)) continue;
    if (!canRiverFlowThrough(o.hexes[nk], nk, o.mouthKey, true, void 0, o.allowReliefTraversal)) continue;
    if (!riverGrowStepPassesSep(nq, nr, o.blockRiverKeys, o.minPathSep, o.sepIndex)) continue;
    const nd = o.seaDist.get(nk) ?? 0;
    if (o.path.length >= 1 && nd < RIVER_MIN_INLAND_FROM_SEA) continue;
    if (o.hardMeander && !o.relaxHardMeander && nd < curD) continue;
    const centerStep = scoreRiverStepTowardLandCenter(
      o.cur.q,
      o.cur.r,
      nq,
      nr,
      o.landCenterSquare,
      o.landCentroid
    );
    let score = nd * 28;
    if (nd > curD) score += 18;
    else if (nd === curD) {
      score += centerStep > 8 ? 22 : centerStep < 0 ? -36 : 2;
    }
    score += centerStep * 6.5;
    if (centerStep < 0) score -= 18;
    score += o.rand() * 0.35;
    out.push({ q: nq, r: nr, score });
  }
  return out;
}
function collectInlandDrainGrowCandidates(o) {
  const curKey = hexKey(o.cur.q, o.cur.r);
  const curD = o.seaDist.get(curKey) ?? 0;
  const curOd = o.openOceanDist.get(curKey) ?? Infinity;
  const out = [];
  for (const [dq, dr] of HEX_DIRECTIONS) {
    const nq = o.cur.q + dq;
    const nr = o.cur.r + dr;
    const nk = hexKey(nq, nr);
    if (!isRiverWindowTurnAllowed(o.path, nq, nr)) continue;
    if (!canRiverFlowThrough(o.hexes[nk], nk, o.srcKey, true, void 0, o.allowReliefTraversal)) continue;
    if (!riverGrowStepPassesSep(nq, nr, o.blockRiverKeys, o.minPathSep, o.sepIndex)) continue;
    const nd = o.seaDist.get(nk) ?? 0;
    if (!o.relaxSeaBuffer && nd < RIVER_MIN_INLAND_FROM_SEA) continue;
    const od = o.openOceanDist.get(nk) ?? Infinity;
    if (o.hardMeander && !o.relaxHardMeander && od < curOd) continue;
    let score = 1200 - od * 30;
    if (od > curOd + 0.5) score -= 18;
    if (nd > curD + 1) score -= 10;
    if (nd === RIVER_MIN_INLAND_FROM_SEA && od < curOd) score += 8;
    score += scoreRiverStepTowardLandCenter(
      o.cur.q,
      o.cur.r,
      nq,
      nr,
      o.landCenterSquare,
      o.landCentroid
    );
    score += o.rand() * 0.35;
    out.push({ q: nq, r: nr, score });
  }
  return out;
}
function growRiverFromCoastInland(hexes, mq, mr, seaDist, openOceanDist, rand, stepCap, hardMeanderLen = RIVER_HARD_MEANDER_LEN, allowReliefTraversal = false, blockRiverKeys, minPathSep = MAIN_RIVER_MIN_PATH_SEP, landCentroid = null, landCenterSquare = null, sepIndex) {
  const mouthKey = hexKey(mq, mr);
  const path = [{ q: mq, r: mr }];
  const visited = /* @__PURE__ */ new Set([mouthKey]);
  const centroid = landCentroid ?? landCenterSquare?.centroid ?? estimateLandCentroidFromMouth(hexes, mq, mr, allowReliefTraversal);
  while (path.length < stepCap) {
    const cur = path[path.length - 1];
    const hardMeander = path.length < hardMeanderLen;
    const growBase = {
      hexes,
      path,
      cur,
      mouthKey,
      seaDist,
      landCentroid: centroid,
      landCenterSquare,
      rand,
      blockRiverKeys,
      sepIndex,
      minPathSep,
      allowReliefTraversal,
      hardMeander,
      relaxHardMeander: false
    };
    let candidates = collectCoastInlandGrowCandidates(growBase).filter((c) => !visited.has(hexKey(c.q, c.r)));
    if (candidates.length === 0) {
      candidates = collectCoastInlandGrowCandidates({ ...growBase, relaxHardMeander: true }).filter((c) => !visited.has(hexKey(c.q, c.r)));
    }
    if (candidates.length === 0) break;
    candidates.sort((a, b) => b.score - a.score);
    const pickIdx = Math.min(candidates.length - 1, Math.floor(rand() * Math.min(3, candidates.length)));
    const pick3 = candidates[pickIdx] ?? candidates[0];
    path.push({ q: pick3.q, r: pick3.r });
    visited.add(hexKey(pick3.q, pick3.r));
  }
  return path;
}
function traceRiverFromCoast(hexes, mq, mr, maxLen, traceOpts = {}) {
  const seaDist = traceOpts.seaDist ?? buildSeaDistanceField(hexes);
  const dims = traceOpts.mapWidth != null && traceOpts.mapHeight != null ? { width: traceOpts.mapWidth, height: traceOpts.mapHeight } : inferMapDimsFromHexes(hexes);
  const openOceanDist = traceOpts.openOceanDist ?? buildOpenOceanDistanceField(hexes, dims.width, dims.height, traceOpts.oceanConnected);
  const oceanConnected = traceOpts.oceanConnected ?? oceanConnectedWaterKeys(hexes, dims.width, dims.height);
  const rand = traceOpts.rand ?? (() => 0);
  const mouthKey = hexKey(mq, mr);
  const startD = seaDist.get(mouthKey);
  if (startD == null || startD > 2) return [];
  const hardMeanderLen = traceOpts.hardMeanderLen ?? RIVER_HARD_MEANDER_LEN;
  const allowReliefTraversal = traceOpts.allowReliefTraversal ?? false;
  const growthCap = maxLen;
  const blockRiverKeys = traceOpts.blockRiverKeys;
  const minPathSep = traceOpts.minPathSep ?? MAIN_RIVER_MIN_PATH_SEP;
  const mouthToInland = growRiverFromCoastInland(
    hexes,
    mq,
    mr,
    seaDist,
    openOceanDist,
    rand,
    growthCap,
    hardMeanderLen,
    allowReliefTraversal,
    blockRiverKeys,
    minPathSep,
    traceOpts.landCentroid ?? null,
    traceOpts.landCenterSquare ?? null,
    traceOpts.riverSepIndex
  );
  if (mouthToInland.length < 2) return [];
  const reversed = [...mouthToInland].reverse();
  if (!pathEndsAtSea(hexes, reversed, dims.width, dims.height, oceanConnected)) return [];
  return reversed;
}
function greedyRiverDrainToSea(hexes, sq, sr, seaDist, openOceanDist, oceanConnected, maxLen, rand, sourceKey, allowReliefTraversal = false) {
  const startK = hexKey(sq, sr);
  const path = [{ q: sq, r: sr }];
  const visited = /* @__PURE__ */ new Set([startK]);
  for (let step = 0; step < maxLen; step++) {
    const cur = path[path.length - 1];
    const curKey = hexKey(cur.q, cur.r);
    if (isRiverDrainageGoal(cur.q, cur.r, seaDist, hexes, sourceKey, oceanConnected)) {
      return path;
    }
    const curOd = openOceanDist.get(curKey);
    if (curOd == null) break;
    let inDir = null;
    if (path.length >= 2) {
      const prev = path[path.length - 2];
      inDir = riverStepDir(prev, cur);
    }
    const candidates = [];
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nq = cur.q + dq;
      const nr = cur.r + dr;
      const nk = hexKey(nq, nr);
      if (visited.has(nk)) continue;
      if (!isRiverWindowTurnAllowed(path, nq, nr)) continue;
      if (!canRiverFlowThrough(hexes[nk], nk, sourceKey, true, void 0, allowReliefTraversal)) continue;
      const nd = seaDist.get(nk) ?? Infinity;
      if (!canRiverDrainStep(nk, nd, openOceanDist, oceanConnected, true)) continue;
      const od = openOceanDist.get(nk) ?? Infinity;
      if (od > curOd + 0.5) continue;
      let score = od * 12 + rand() * 0.35;
      if (inDir && sameRiverDir(inDir, [dq, dr])) score -= 1.8;
      candidates.push({ q: nq, r: nr, score });
    }
    if (candidates.length === 0) break;
    candidates.sort((a, b) => a.score - b.score);
    const pick3 = candidates[0];
    path.push({ q: pick3.q, r: pick3.r });
    visited.add(hexKey(pick3.q, pick3.r));
  }
  return path.length > 1 && isRiverDrainageGoal(
    path[path.length - 1].q,
    path[path.length - 1].r,
    seaDist,
    hexes,
    sourceKey,
    oceanConnected
  ) ? path : [];
}
var RiverAStarOpenHeap = class {
  constructor() {
    this.data = [];
  }
  push(f, seq, key) {
    const d = this.data;
    d.push([f, seq, key]);
    let i = d.length - 1;
    while (i > 0) {
      const p = i - 1 >> 1;
      if (this.less(d[i], d[p])) {
        [d[i], d[p]] = [d[p], d[i]];
        i = p;
      } else break;
    }
  }
  pop() {
    const d = this.data;
    if (d.length === 0) return void 0;
    const top = d[0];
    const last = d.pop();
    if (d.length > 0) {
      d[0] = last;
      let i = 0;
      for (; ; ) {
        let best = i;
        const l = 2 * i + 1;
        const r = l + 1;
        if (l < d.length && this.less(d[l], d[best])) best = l;
        if (r < d.length && this.less(d[r], d[best])) best = r;
        if (best === i) break;
        [d[i], d[best]] = [d[best], d[i]];
        i = best;
      }
    }
    return top;
  }
  get size() {
    return this.data.length;
  }
  less(a, b) {
    return a[0] < b[0] || a[0] === b[0] && a[1] < b[1];
  }
};
function aStarRiverToSea(hexes, sq, sr, seaDist, openOceanDist, oceanConnected, maxLen, rand = () => 0, allowReliefTraversal = false) {
  const _rpT0 = RIVER_PROFILE_ON ? rpNow() : 0;
  if (RIVER_PROFILE_ON) rpEnsure().aStarCalls++;
  const _rpDone = (result) => {
    if (RIVER_PROFILE_ON) rpEnsure().aStarMs += rpNow() - _rpT0;
    return result;
  };
  const startK = hexKey(sq, sr);
  const h0 = openOceanDist.get(startK) ?? seaDist.get(startK);
  if (h0 == null) return _rpDone([]);
  if (oceanConnected.has(startK)) return _rpDone([{ q: sq, r: sr }]);
  const gScore = /* @__PURE__ */ new Map([[startK, 0]]);
  const cameFrom = /* @__PURE__ */ new Map();
  const stepDir = /* @__PURE__ */ new Map();
  const open = /* @__PURE__ */ new Set([startK]);
  const fScore = /* @__PURE__ */ new Map([[startK, h0]]);
  const openHeap = new RiverAStarOpenHeap();
  let heapSeq = 0;
  openHeap.push(h0, heapSeq++, startK);
  let bestK = startK;
  let bestH = h0;
  while (open.size > 0) {
    let current = "";
    while (openHeap.size > 0) {
      const entry = openHeap.pop();
      const k = entry[2];
      if (!open.has(k)) continue;
      const f = fScore.get(k) ?? Infinity;
      if (f !== entry[0]) continue;
      current = k;
      break;
    }
    if (!current) break;
    const curG = gScore.get(current);
    const curH = openOceanDist.get(current) ?? Infinity;
    const { q, r } = parseHexKey(current);
    if (curH < bestH) {
      bestH = curH;
      bestK = current;
    }
    if (isRiverDrainageGoal(q, r, seaDist, hexes, startK, oceanConnected)) {
      return _rpDone(reconstructRiverPath(cameFrom, current));
    }
    open.delete(current);
    if (curG >= maxLen) continue;
    const prev = cameFrom.get(current);
    let inDir = null;
    if (prev) {
      const pp = parseHexKey(prev);
      inDir = riverStepDir({ q: pp.q, r: pp.r }, { q, r });
    }
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nk = hexKey(q + dq, r + dr);
      if (!canRiverFlowThrough(hexes[nk], nk, startK, true, void 0, allowReliefTraversal)) continue;
      const nd = seaDist.get(nk) ?? Infinity;
      if (!canRiverDrainStep(nk, nd, openOceanDist, oceanConnected, true)) continue;
      let stepCost = 1;
      if (inDir && sameRiverDir(inDir, [dq, dr])) stepCost += 0.18 + rand() * 0.12;
      const tg = curG + stepCost;
      if (tg > maxLen + 2) continue;
      if (tg >= (gScore.get(nk) ?? Infinity)) continue;
      cameFrom.set(nk, current);
      stepDir.set(nk, [dq, dr]);
      gScore.set(nk, tg);
      const nf = tg + (openOceanDist.get(nk) ?? Infinity);
      fScore.set(nk, nf);
      open.add(nk);
      openHeap.push(nf, heapSeq++, nk);
    }
  }
  if (bestK !== startK) {
    const { q, r } = parseHexKey(bestK);
    if (isRiverDrainageGoal(q, r, seaDist, hexes, startK, oceanConnected)) {
      return _rpDone(reconstructRiverPath(cameFrom, bestK));
    }
  }
  return _rpDone([{ q: sq, r: sr }]);
}
function findRiverMeanderStep(hexes, cur, target, seaDist, used, rand) {
  const curK = hexKey(cur.q, cur.r);
  const curD = seaDist.get(curK) ?? 999;
  const tgtK = hexKey(target.q, target.r);
  const toTarget = riverStepDir(cur, target);
  const opts = [];
  for (const [dq, dr] of HEX_DIRECTIONS) {
    const nq = cur.q + dq;
    const nr = cur.r + dr;
    const nk = hexKey(nq, nr);
    if (nk === tgtK || used.has(nk)) continue;
    if (sameRiverDir([dq, dr], toTarget)) continue;
    const nh = hexes[nk];
    if (!canRiverFlowThrough(nh, nk, "", true)) continue;
    const nd = seaDist.get(nk);
    if (nd == null || nd > curD) continue;
    if (nd < RIVER_MIN_INLAND_FROM_SEA) continue;
    const touchesTarget = HEX_DIRECTIONS.some(
      ([eq, er]) => nq + eq === target.q && nr + er === target.r
    );
    if (!touchesTarget) continue;
    opts.push({ q: nq, r: nr });
  }
  if (opts.length === 0) return null;
  return opts[Math.floor(rand() * opts.length)];
}
function injectRiverMeanders(path, hexes, seaDist, rand, maxExtraSteps) {
  if (path.length < 5 || maxExtraSteps <= 0) return path;
  const result = path.map((p) => ({ ...p }));
  let extra = 0;
  let straightRun = 0;
  let lastDir = null;
  for (let i = 0; i < result.length - 2 && extra < maxExtraSteps; i++) {
    const d = riverStepDir(result[i], result[i + 1]);
    if (lastDir && sameRiverDir(lastDir, d)) straightRun++;
    else {
      straightRun = 1;
      lastDir = d;
    }
    if (straightRun < 4) continue;
    if (rand() >= 0.34) continue;
    const used = new Set(result.map((p) => hexKey(p.q, p.r)));
    const bend = findRiverMeanderStep(
      hexes,
      result[i + 1],
      result[i + 2],
      seaDist,
      used,
      rand
    );
    if (!bend) continue;
    result.splice(i + 2, 0, bend);
    extra++;
    straightRun = 0;
    i += 2;
  }
  return repairRiverPathAdjacency(sanitizeRiverPath(result), hexes, hexKey(path[0].q, path[0].r));
}
function extendRiverToMinimumLength(path, hexes, seaDist, rand, minLen, stepCap) {
  if (path.length >= minLen || path.length < 3) return path;
  const srcKey = hexKey(path[0].q, path[0].r);
  let out = path;
  for (let pass = 0; pass < 12 && out.length < minLen && out.length < stepCap; pass++) {
    const need = Math.min(minLen - out.length, stepCap - out.length, 6);
    const meandered = injectRiverMeanders(out, hexes, seaDist, rand, need);
    if (meandered.length > out.length) {
      out = meandered;
      continue;
    }
    const mid = Math.max(1, Math.floor(out.length * 0.45));
    const used = new Set(out.map((p) => hexKey(p.q, p.r)));
    const a = out[mid];
    const b = out[Math.min(out.length - 1, mid + 1)];
    const bend = findRiverMeanderStep(hexes, a, b, seaDist, used, rand);
    if (bend) {
      out = [...out.slice(0, mid + 1), bend, ...out.slice(mid + 1)];
      out = repairRiverPathAdjacency(sanitizeRiverPath(out), hexes, srcKey);
    } else {
      break;
    }
  }
  return out;
}
function extendRiverToWybrzeze(hexes, path, seaDist) {
  if (path.length === 0) return path;
  const visited = new Set(path.map((p) => hexKey(p.q, p.r)));
  let cq = path[path.length - 1].q;
  let cr = path[path.length - 1].r;
  for (let extra = 0; extra < RIVER_MOUTH_TAIL_LEN; extra++) {
    const endHex = hexes[hexKey(cq, cr)];
    if (!endHex) break;
    if (endHex.terenBazowy === "wybrzeze" /* Wybrzeze */ || endHex.terenBazowy === "morze" /* Morze */) break;
    let best = null;
    let bestScore = Infinity;
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nq = cq + dq;
      const nr = cr + dr;
      const nk = hexKey(nq, nr);
      if (visited.has(nk)) continue;
      const nh = hexes[nk];
      if (!nh || nh.terenBazowy === "morze" /* Morze */ || isReliefTerrain(nh.terenBazowy)) continue;
      let score = seaDist.get(nk) ?? 999;
      if (nh.terenBazowy === "wybrzeze" /* Wybrzeze */) score -= 8;
      if (score < bestScore) {
        bestScore = score;
        best = [nq, nr];
      }
    }
    if (!best) break;
    path.push({ q: best[0], r: best[1] });
    visited.add(hexKey(best[0], best[1]));
    cq = best[0];
    cr = best[1];
  }
  return path;
}
function finishRiverMouthAtSea(hexes, path, seaDist, openOceanDist, oceanConnected, sourceKey) {
  if (path.length === 0) return path;
  const mouthReady = (q, r) => isRiverDrainageGoal(q, r, seaDist, hexes, sourceKey, oceanConnected);
  if (mouthReady(path[path.length - 1].q, path[path.length - 1].r)) return path;
  const visited = new Set(path.map((p) => hexKey(p.q, p.r)));
  let cur = path[path.length - 1];
  for (let step = 0; step < RIVER_MOUTH_TAIL_LEN + 2; step++) {
    if (mouthReady(cur.q, cur.r)) return path;
    let best = null;
    let bestScore = Infinity;
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nq = cur.q + dq;
      const nr = cur.r + dr;
      const nk = hexKey(nq, nr);
      if (visited.has(nk)) continue;
      const nh = hexes[nk];
      if (!nh || nh.terenBazowy === "morze" /* Morze */ || isReliefTerrain(nh.terenBazowy)) continue;
      const nd = seaDist.get(nk) ?? Infinity;
      if (nh.terenBazowy !== "wybrzeze" /* Wybrzeze */ && !canRiverDrainStep(nk, nd, openOceanDist, oceanConnected, true)) continue;
      if (!canRiverFlowThrough(nh, nk, sourceKey) && nh.terenBazowy !== "wybrzeze" /* Wybrzeze */) continue;
      let score = openOceanDist.get(nk) ?? nd;
      if (nh.terenBazowy === "wybrzeze" /* Wybrzeze */) score -= 15;
      if (score < bestScore) {
        bestScore = score;
        best = { q: nq, r: nr };
      }
    }
    if (!best) break;
    path.push(best);
    visited.add(hexKey(best.q, best.r));
    cur = best;
  }
  return path;
}
function traceRiver(hexes, sq, sr, maxLen = 40, traceOpts = {}) {
  const _rpT0 = RIVER_PROFILE_ON ? rpNow() : 0;
  if (RIVER_PROFILE_ON) rpEnsure().traceRiverCalls++;
  const _rpDone = (result) => {
    if (RIVER_PROFILE_ON) rpEnsure().traceRiverMs += rpNow() - _rpT0;
    return result;
  };
  const seaDist = traceOpts.seaDist ?? buildSeaDistanceField(hexes);
  const dims = traceOpts.mapWidth != null && traceOpts.mapHeight != null ? { width: traceOpts.mapWidth, height: traceOpts.mapHeight } : inferMapDimsFromHexes(hexes);
  const openOceanDist = traceOpts.openOceanDist ?? buildOpenOceanDistanceField(hexes, dims.width, dims.height, traceOpts.oceanConnected);
  const oceanConnected = traceOpts.oceanConnected ?? oceanConnectedWaterKeys(hexes, dims.width, dims.height);
  const rand = traceOpts.rand ?? (() => 0);
  const srcKey = hexKey(sq, sr);
  const startDist = seaDist.get(srcKey);
  if (startDist == null || !Number.isFinite(startDist)) return _rpDone([]);
  const inlandTarget = traceOpts.minLen ?? 4;
  const mouthTailLen = traceOpts.mouthTailLen ?? RIVER_MOUTH_TAIL_LEN;
  const hardMeanderLen = traceOpts.hardMeanderLen ?? RIVER_HARD_MEANDER_LEN;
  const allowReliefTraversal = traceOpts.allowReliefTraversal ?? false;
  const relaxSeaBuffer = traceOpts.relaxSeaBuffer ?? false;
  const stepCap = Math.max(
    inlandTarget + mouthTailLen + 12,
    Math.min(maxLen, Math.ceil(startDist * 2.5) + inlandTarget + 10)
  );
  const inlandGrowthMax = Math.min(
    stepCap - mouthTailLen - 4,
    maxLen
  );
  let path = growRiverInlandBeforeDrainage(
    hexes,
    sq,
    sr,
    seaDist,
    openOceanDist,
    rand,
    inlandTarget,
    stepCap,
    hardMeanderLen,
    allowReliefTraversal,
    relaxSeaBuffer,
    inlandGrowthMax,
    traceOpts.blockRiverKeys,
    traceOpts.minPathSep ?? 0,
    traceOpts.landCentroid ?? null,
    traceOpts.landCenterSquare ?? null
  );
  const tailFrom = path[path.length - 1];
  const drainBudget = Math.max(mouthTailLen + 4, stepCap - path.length + 1);
  let drainPath = aStarRiverToSea(
    hexes,
    tailFrom.q,
    tailFrom.r,
    seaDist,
    openOceanDist,
    oceanConnected,
    drainBudget,
    rand,
    allowReliefTraversal
  );
  if (drainPath.length <= 1) {
    drainPath = greedyRiverDrainToSea(
      hexes,
      tailFrom.q,
      tailFrom.r,
      seaDist,
      openOceanDist,
      oceanConnected,
      drainBudget,
      rand,
      srcKey,
      allowReliefTraversal
    );
  }
  if (drainPath.length > 1) {
    path = [...path, ...drainPath.slice(1)];
  } else if (path.length <= 1) {
    path = aStarRiverToSea(
      hexes,
      sq,
      sr,
      seaDist,
      openOceanDist,
      oceanConnected,
      stepCap,
      rand,
      allowReliefTraversal
    );
    if (path.length <= 1) {
      path = greedyRiverDrainToSea(
        hexes,
        sq,
        sr,
        seaDist,
        openOceanDist,
        oceanConnected,
        stepCap,
        rand,
        srcKey,
        allowReliefTraversal
      );
    }
  }
  if (path.length > stepCap) path = path.slice(0, stepCap);
  path = extendRiverToWybrzeze(hexes, path, seaDist);
  path = finishRiverMouthAtSea(hexes, path, seaDist, openOceanDist, oceanConnected, srcKey);
  path = repairRiverPathAdjacency(path, hexes, srcKey);
  path = sanitizeRiverTurnWindow(path, hexes, srcKey);
  if (!relaxSeaBuffer) {
    if (!riverPathRespectsSeaBuffer(hexes, path, seaDist) || !pathEndsAtSea(hexes, path, dims.width, dims.height, oceanConnected)) {
      return _rpDone([]);
    }
  } else if (!pathEndsAtSea(hexes, path, dims.width, dims.height, oceanConnected)) {
    return _rpDone([]);
  }
  return _rpDone(path);
}
function traceRiverForGridFill(hexes, sq, sr, maxLen, catalogMinLen, acceptLen, traceOpts, relaxSeaBuffer = false, fastMode = false) {
  const tries = fastMode ? [acceptLen, Math.max(3, Math.floor(acceptLen * 0.75))] : [catalogMinLen, Math.max(acceptLen, Math.floor(catalogMinLen * 0.6)), acceptLen, 3];
  const seen = /* @__PURE__ */ new Set();
  for (const tryMin of tries) {
    if (seen.has(String(tryMin))) continue;
    seen.add(String(tryMin));
    const path = traceRiver(hexes, sq, sr, maxLen, { ...traceOpts, minLen: tryMin });
    if (path.length < acceptLen) continue;
    if (!relaxSeaBuffer) return path;
    const seaDist = traceOpts.seaDist ?? buildSeaDistanceField(hexes);
    const dims = traceOpts.mapWidth != null && traceOpts.mapHeight != null ? { width: traceOpts.mapWidth, height: traceOpts.mapHeight } : inferMapDimsFromHexes(hexes);
    const ocean = traceOpts.oceanConnected ?? oceanConnectedWaterKeys(hexes, dims.width, dims.height);
    if (pathEndsAtSea(hexes, path, dims.width, dims.height, ocean)) return path;
  }
  return [];
}
function isRiverLandTerrain(t) {
  return t === "laka" /* Laka */ || t === "rownina" /* Rownina */ || t === "wzgorza" /* Wzgorza */ || t === "gory" /* Gory */ || t === "pustynia" /* Pustynia */ || t === "polarny" /* Polarny */;
}
function neighborDirIndex(q, r, nq, nr) {
  const dq = nq - q;
  const dr = nr - r;
  for (let i = 0; i < HEX_DIRECTIONS.length; i++) {
    const d = HEX_DIRECTIONS[i];
    if (d[0] === dq && d[1] === dr) return i;
  }
  return -1;
}
var RIVER_TURN_WINDOW_HEX = 6;
var RIVER_TURN_WINDOW_MAX_SUM = 1;
function signedRiverDirDelta(lastDir, newDir) {
  const raw = riverHexDirDelta(lastDir, newDir);
  return raw <= 3 ? raw : raw - 6;
}
function pathSegmentDirs(path) {
  const dirs = [];
  for (let i = 0; i < path.length - 1; i++) {
    const d = neighborDirIndex(path[i].q, path[i].r, path[i + 1].q, path[i + 1].r);
    if (d >= 0) dirs.push(d);
  }
  return dirs;
}
function pathSignedTurnDeltas(segmentDirs) {
  const out = [];
  for (let i = 1; i < segmentDirs.length; i++) {
    out.push(signedRiverDirDelta(segmentDirs[i - 1], segmentDirs[i]));
  }
  return out;
}
function isRiverWindowTurnAllowed(path, nq, nr, windowHex = RIVER_TURN_WINDOW_HEX, maxSum = RIVER_TURN_WINDOW_MAX_SUM) {
  const cur = path[path.length - 1];
  const stepDir = neighborDirIndex(cur.q, cur.r, nq, nr);
  if (stepDir < 0) return false;
  const dirs = pathSegmentDirs(path);
  if (dirs.length === 0) return true;
  const stepSigned = signedRiverDirDelta(dirs[dirs.length - 1], stepDir);
  if (Math.abs(stepSigned) > 1) return false;
  dirs.push(stepDir);
  const deltas = pathSignedTurnDeltas(dirs);
  const window = deltas.slice(-windowHex);
  const sum = window.reduce((a, b) => a + b, 0);
  return Math.abs(sum) <= maxSum;
}
function riverSegmentUnitVector(a, b) {
  const x1 = Math.sqrt(3) * (a.q + a.r / 2);
  const y1 = 1.5 * a.r;
  const x2 = Math.sqrt(3) * (b.q + b.r / 2);
  const y2 = 1.5 * b.r;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 1e-9) return { x: 0, y: 0 };
  return { x: dx / len, y: dy / len };
}
function riverPathHasSharpUTurn(path) {
  if (path.length < 3) return false;
  for (let i = 0; i < path.length - 2; i++) {
    const v1 = riverSegmentUnitVector(path[i], path[i + 1]);
    const v2 = riverSegmentUnitVector(path[i + 1], path[i + 2]);
    if (v1.x * v2.x + v1.y * v2.y < -0.01) return true;
  }
  return false;
}
function riverPathViolatesTurnWindow(path, windowHex = RIVER_TURN_WINDOW_HEX, maxSum = RIVER_TURN_WINDOW_MAX_SUM) {
  if (path.length < 3) return false;
  if (riverPathHasSharpUTurn(path)) return true;
  const deltas = pathSignedTurnDeltas(pathSegmentDirs(path));
  for (let i = 0; i < deltas.length; i++) {
    if (Math.abs(deltas[i]) > 1) return true;
    if (i + 1 < windowHex) continue;
    const window = deltas.slice(i + 1 - windowHex, i + 1);
    const sum = window.reduce((a, b) => a + b, 0);
    if (Math.abs(sum) > maxSum) return true;
  }
  return false;
}
function sanitizeRiverTurnWindow(path, hexes, sourceKey) {
  let out = sanitizeRiverPath(path);
  for (let guard = 0; guard < 48 && out.length >= 3; guard++) {
    if (!riverPathViolatesTurnWindow(out)) return out;
    const deltas = pathSignedTurnDeltas(pathSegmentDirs(out));
    let cutAt = -1;
    for (let i = 0; i < deltas.length; i++) {
      if (Math.abs(deltas[i]) > 1) {
        cutAt = i + 1;
        break;
      }
      if (i + 1 >= RIVER_TURN_WINDOW_HEX) {
        const w = deltas.slice(i + 1 - RIVER_TURN_WINDOW_HEX, i + 1);
        if (Math.abs(w.reduce((a, b) => a + b, 0)) > RIVER_TURN_WINDOW_MAX_SUM) {
          cutAt = i + 1;
          break;
        }
      }
    }
    if (cutAt <= 0 || cutAt >= out.length - 1) break;
    out = sanitizeRiverPath([...out.slice(0, cutAt), ...out.slice(cutAt + 1)]);
    out = repairRiverPathAdjacency(out, hexes, sourceKey);
  }
  return out;
}
function canReceiveRiverYieldMark(hex) {
  if (!hex || hex.terenBazowy === "morze" /* Morze */) return false;
  return isDryLandTerrain(hex.terenBazowy) || hex.terenBazowy === "wybrzeze" /* Wybrzeze */;
}
function markRiverEdge(hexes, q, r, edgeIdx) {
  if (edgeIdx < 0) return;
  const hex = hexes[hexKey(q, r)];
  if (!canReceiveRiverYieldMark(hex)) return;
  const edges = hex.rzeka?.krawedzie ?? [];
  if (!edges.includes(edgeIdx)) edges.push(edgeIdx);
  hex.rzeka = { obecna: edges.length > 0, krawedzie: edges };
}
function markRiverEdgePair(hexes, q, r, edgeIdx) {
  if (edgeIdx < 0) return;
  markRiverEdge(hexes, q, r, edgeIdx);
  const dir = HEX_DIRECTIONS[edgeIdx];
  if (!dir) return;
  markRiverEdge(hexes, q + dir[0], r + dir[1], (edgeIdx + 3) % 6);
}
function riverHexCornerStep(from, cw) {
  return cw ? (from + 1) % 6 : (from + 5) % 6;
}
function walkRiverHexPerimeter(fromCorner, toCorner, cw) {
  if (fromCorner === toCorner) return [fromCorner];
  const out = [];
  let c = fromCorner;
  for (let guard = 0; guard < 7; guard++) {
    out.push(c);
    if (c === toCorner) break;
    c = riverHexCornerStep(c, cw);
  }
  return out;
}
function riverCornersAlongHexEdges(dirIn, dirOut, hexParity) {
  const a = (dirIn % 6 + 6) % 6;
  const b = (dirOut % 6 + 6) % 6;
  if (a === b) return [];
  const entryOpts = [(a + 1) % 6, (a + 2) % 6];
  const exitOpts = [(b + 1) % 6, (b + 2) % 6];
  const MIN_BOKI = 1;
  let best = [];
  let bestScore = Infinity;
  let fallback = [];
  let fallbackScore = Infinity;
  for (const entry of entryOpts) {
    for (const exit of exitOpts) {
      for (const cw of [true, false]) {
        const walked = walkRiverHexPerimeter(entry, exit, cw);
        if (walked.length === 0) continue;
        let score = walked.length;
        if (score === bestScore && hexParity % 2 === 0) score += cw ? 0 : 0.01;
        else if (score === bestScore) score += cw ? 0.01 : 0;
        if (score < fallbackScore) {
          fallbackScore = score;
          fallback = walked;
        }
        if (walked.length - 1 < MIN_BOKI) continue;
        if (score < bestScore) {
          bestScore = score;
          best = walked;
        }
      }
    }
  }
  return best.length ? best : fallback;
}
function riverEdgeBetweenCorners(c1, c2) {
  if (c2 === (c1 + 1) % 6) return (c1 + 5) % 6;
  if (c2 === (c1 + 5) % 6) return (c2 + 5) % 6;
  return -1;
}
function riverTransitEdgeIndices(dirIn, dirOut, hexParity) {
  const corners = riverCornersAlongHexEdges(dirIn, dirOut, hexParity);
  if (corners.length < 2) return [];
  const edges = [];
  for (let i = 0; i < corners.length - 1; i++) {
    const ei = riverEdgeBetweenCorners(corners[i], corners[i + 1]);
    if (ei >= 0 && !edges.includes(ei)) edges.push(ei);
  }
  return edges;
}
function simplifyRiverRenderPath(path) {
  const p = path.map((h) => ({ q: h.q, r: h.r }));
  if (p.length < 3) return p;
  let changed = true;
  let guard = 0;
  while (changed && guard++ < 4e3) {
    changed = false;
    for (let i = 1; i < p.length - 1; i++) {
      const a = p[i - 1];
      const c = p[i + 1];
      if (a.q === c.q && a.r === c.r) {
        p.splice(i, 2);
        changed = true;
        break;
      }
      if (neighborDirIndex(a.q, a.r, c.q, c.r) >= 0) {
        p.splice(i, 1);
        changed = true;
        break;
      }
    }
  }
  return p;
}
function markRiverTransitEdgesOnPath(hexes, path) {
  const rp = simplifyRiverRenderPath(path);
  if (rp.length < 2) return;
  for (let i = 0; i < rp.length; i++) {
    const cur = rp[i];
    const dirIn = i > 0 ? neighborDirIndex(cur.q, cur.r, rp[i - 1].q, rp[i - 1].r) : -1;
    const dirOut = i < rp.length - 1 ? neighborDirIndex(cur.q, cur.r, rp[i + 1].q, rp[i + 1].r) : -1;
    if (dirIn < 0 || dirOut < 0) continue;
    for (const ei of riverTransitEdgeIndices(dirIn, dirOut, cur.q + cur.r)) {
      markRiverEdgePair(hexes, cur.q, cur.r, ei);
    }
  }
}
function syncRiverEdgeBonusHexes(hexes, maxPasses = 2) {
  for (let pass = 0; pass < maxPasses; pass++) {
    const work = [];
    for (const [k, h] of Object.entries(hexes)) {
      if (!h.rzeka?.krawedzie?.length) continue;
      const { q, r } = parseHexKey(k);
      for (const ei of h.rzeka.krawedzie) work.push({ q, r, ei });
    }
    if (work.length === 0) return;
    for (const { q, r, ei } of work) markRiverEdgePair(hexes, q, r, ei);
  }
}
function markRiverPath(hexes, path) {
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    const ha = hexes[hexKey(a.q, a.r)];
    const hb = hexes[hexKey(b.q, b.r)];
    if (!ha || !hb) continue;
    if (ha.terenBazowy === "morze" /* Morze */ && hb.terenBazowy === "morze" /* Morze */) continue;
    if (ha.terenBazowy === "morze" /* Morze */ || hb.terenBazowy === "morze" /* Morze */) {
      const coastal = ha.terenBazowy === "wybrzeze" /* Wybrzeze */ || hb.terenBazowy === "wybrzeze" /* Wybrzeze */;
      if (!coastal) continue;
    }
    const eA = neighborDirIndex(a.q, a.r, b.q, b.r);
    markRiverEdgePair(hexes, a.q, a.r, eA);
  }
  markRiverTransitEdgesOnPath(hexes, path);
}
function riverSegmentEdgeMarks(hexes, a, b) {
  const ha = hexes[hexKey(a.q, a.r)];
  const hb = hexes[hexKey(b.q, b.r)];
  if (!ha || !hb) return [];
  if (ha.terenBazowy === "morze" /* Morze */ && hb.terenBazowy === "morze" /* Morze */) return [];
  if (ha.terenBazowy === "morze" /* Morze */ || hb.terenBazowy === "morze" /* Morze */) {
    const coastal = ha.terenBazowy === "wybrzeze" /* Wybrzeze */ || hb.terenBazowy === "wybrzeze" /* Wybrzeze */;
    if (!coastal) return [];
  }
  const out = [];
  const eA = neighborDirIndex(a.q, a.r, b.q, b.r);
  const eB = neighborDirIndex(b.q, b.r, a.q, a.r);
  const eligible = (h) => canReceiveRiverYieldMark(h);
  if (eA >= 0 && eligible(ha)) out.push({ key: hexKey(a.q, a.r), edge: eA });
  if (eB >= 0 && eligible(hb)) out.push({ key: hexKey(b.q, b.r), edge: eB });
  return out;
}
function trimRiverPathRings(hexes, path) {
  if (path.length < 3) return path;
  const priorCount = /* @__PURE__ */ new Map();
  const laid = /* @__PURE__ */ new Map();
  const totalOnHex = (key) => (priorCount.get(key) ?? (() => {
    const h = hexes[key];
    const c = h?.rzeka?.krawedzie?.length ?? 0;
    priorCount.set(key, c);
    return c;
  })()) + (laid.get(key)?.size ?? 0);
  const hadPrior = (key) => {
    if (!priorCount.has(key)) totalOnHex(key);
    return (priorCount.get(key) ?? 0) > 0;
  };
  for (let i = 0; i < path.length - 1; i++) {
    const marks = riverSegmentEdgeMarks(hexes, path[i], path[i + 1]);
    for (const m of marks) {
      const already = laid.get(m.key)?.has(m.edge) ?? false;
      if (already) continue;
      const cur = totalOnHex(m.key);
      const limit = hadPrior(m.key) ? 4 : 3;
      if (cur >= limit) {
        return path.slice(0, i + 1);
      }
    }
    for (const m of marks) {
      const s = laid.get(m.key) ?? /* @__PURE__ */ new Set();
      s.add(m.edge);
      laid.set(m.key, s);
    }
  }
  return path;
}
function finalizeMainRiverPath(hexes, path, width, height, oceanConnected) {
  if (path.length < 2) return null;
  const cleaned = sanitizeRiverPath(path);
  if (cleaned.length < RIVER_MIN_MAIN_LEN) return null;
  const turnSafe = riverPathViolatesTurnWindow(cleaned) ? sanitizeRiverTurnWindow(cleaned, hexes, hexKey(path[0].q, path[0].r)) : cleaned;
  if (turnSafe.length < RIVER_MIN_MAIN_LEN) return null;
  const trimmed = trimRiverPathRings(hexes, turnSafe);
  if (trimmed.length < RIVER_MIN_MAIN_LEN) return null;
  if (!pathEndsAtSea(hexes, trimmed, width, height, oceanConnected)) return null;
  return trimmed;
}
function appendJunctionDownstreamHex(path, down) {
  if (!down || path.length < 2) return path;
  const last = path[path.length - 1];
  const prev = path[path.length - 2];
  if (hexAxialDistance(last.q, last.r, down.q, down.r) !== 1) return path;
  if (down.q === prev.q && down.r === prev.r) return path;
  if (path.some((p) => p.q === down.q && p.r === down.r)) return path;
  return [...path, { q: down.q, r: down.r }];
}
function tributaryTouchesOceanReachable(path, reached) {
  for (const p of path) {
    if (reached.has(hexKey(p.q, p.r))) return true;
  }
  const end = path[path.length - 1];
  if (!end) return false;
  for (const [dq, dr] of HEX_DIRECTIONS) {
    const nk = hexKey(end.q + dq, end.r + dr);
    if (reached.has(nk)) return true;
  }
  return false;
}
function finalizeTributaryPath(hexes, path, riverPaths, riverKinds, width, height, oceanConnected) {
  let out = trimRiverPathRings(hexes, path);
  if (out.length < 3) return null;
  if (out.length >= 2) {
    const junction = out[out.length - 1];
    const approach = out[out.length - 2];
    const down = networkDownstreamNeighbor(hexes, junction, approach, riverPaths);
    out = appendJunctionDownstreamHex(out, down);
  }
  if (pathEndsAtSea(hexes, out, width, height, oceanConnected)) return out;
  const reached = buildOceanReachableRiverHexKeys(
    hexes,
    riverPaths,
    riverKinds,
    width,
    height,
    oceanConnected
  );
  if (!tributaryTouchesOceanReachable(out, reached)) return null;
  return out;
}
function pathTouchesMainNetwork(path, mainKeys) {
  if (mainKeys.size === 0) return false;
  for (const p of path) {
    if (mainKeys.has(hexKey(p.q, p.r))) return true;
  }
  const end = path[path.length - 1];
  if (!end) return false;
  for (const [dq, dr] of HEX_DIRECTIONS) {
    if (mainKeys.has(hexKey(end.q + dq, end.r + dr))) return true;
  }
  return false;
}
function trimMediumTailAlongMain(path, mainKeys) {
  if (path.length < 3 || mainKeys.size === 0) return path;
  const out = [...path];
  while (out.length >= 3) {
    const last = out[out.length - 1];
    const prev = out[out.length - 2];
    if (mainKeys.has(hexKey(last.q, last.r)) && mainKeys.has(hexKey(prev.q, prev.r))) {
      out.pop();
    } else break;
  }
  return out;
}
function isMediumJoinTargetHex(q, r, mainKeys, networkKeys) {
  const k = hexKey(q, r);
  if (mainKeys.has(k) || networkKeys.has(k)) return true;
  for (const [dq, dr] of HEX_DIRECTIONS) {
    const nk = hexKey(q + dq, r + dr);
    if (mainKeys.has(nk) || networkKeys.has(nk)) return true;
  }
  return false;
}
function isHexWrapTriplet(a, b, c) {
  const dAB = neighborDirIndex(a.q, a.r, b.q, b.r);
  const dBC = neighborDirIndex(b.q, b.r, c.q, c.r);
  if (dAB < 0 || dBC < 0) return false;
  if (Math.abs(signedRiverDirDelta(dAB, dBC)) !== 2) return false;
  return hexAxialDistance(a.q, a.r, c.q, c.r) === 1;
}
function trimMediumJoinHexWrap(path, mainKeys, networkKeys) {
  let out = [...path];
  for (let guard = 0; guard < 8 && out.length >= 3; guard++) {
    const a = out[out.length - 3];
    const b = out[out.length - 2];
    const c = out[out.length - 1];
    if (mainKeys.has(hexKey(b.q, b.r))) break;
    if (!isMediumJoinTargetHex(c.q, c.r, mainKeys, networkKeys)) break;
    if (!isHexWrapTriplet(a, b, c)) break;
    out.splice(out.length - 2, 1);
  }
  return out;
}
function trimMediumBranchHexWrap(path, mainKeys) {
  let out = [...path];
  for (let guard = 0; guard < 8 && out.length >= 3; guard++) {
    const a = out[0];
    const b = out[1];
    const c = out[2];
    if (!mainKeys.has(hexKey(a.q, a.r))) break;
    if (mainKeys.has(hexKey(b.q, b.r))) break;
    if (!isHexWrapTriplet(a, b, c)) break;
    out.splice(1, 1);
  }
  return out;
}
function pickPerpDirTowardLandCenter(perpDirs, spawnQ, spawnR, square, centroid, sideToggle) {
  if (perpDirs.length === 0) return [0, 0];
  if (perpDirs.length === 1) return perpDirs[0];
  const scored = perpDirs.map((d) => ({
    d,
    s: scoreRiverStepTowardLandCenter(
      spawnQ,
      spawnR,
      spawnQ + d[0],
      spawnR + d[1],
      square,
      centroid
    )
  }));
  scored.sort((a, b) => b.s - a.s);
  if (scored[0].s >= scored[1].s + 10) return scored[0].d;
  return perpDirs[sideToggle % perpDirs.length];
}
function mainFlowDirIndex(flowDir) {
  for (let i = 0; i < HEX_DIRECTIONS.length; i++) {
    const d = HEX_DIRECTIONS[i];
    if (d[0] === flowDir[0] && d[1] === flowDir[1]) return i;
  }
  return -1;
}
function perpendicularHexDirections(flowDir) {
  const idx = mainFlowDirIndex(flowDir);
  if (idx < 0) return [];
  return [HEX_DIRECTIONS[(idx + 2) % 6], HEX_DIRECTIONS[(idx + 4) % 6]];
}
function localMainFlowDirAt(path, index) {
  if (path.length < 2) return null;
  if (index > 0 && index < path.length) {
    return riverStepDir(path[index - 1], path[index]);
  }
  if (index === 0) return riverStepDir(path[0], path[1]);
  return riverStepDir(path[path.length - 2], path[path.length - 1]);
}
function mediumPathEndHasRiverJunction(end, pathIndex, hexToPaths, hexes) {
  const eh = hexes[hexKey(end.q, end.r)];
  for (const edgeIdx of eh?.rzeka?.krawedzie ?? []) {
    const dir = HEX_DIRECTIONS[edgeIdx];
    if (!dir) continue;
    const owners = hexToPaths.get(hexKey(end.q + dir[0], end.r + dir[1]));
    if (owners && [...owners].some((x) => x !== pathIndex)) return true;
  }
  return false;
}
function mediumEndsOrphanOnFlatLand(hexes, end, pathIndex, hexToPaths, otherRiverKeys, minPathSep) {
  const endKey = hexKey(end.q, end.r);
  const h = hexes[endKey];
  if (!h || !isRiverLandTerrain(h.terenBazowy)) return true;
  if (isReliefTerrain(h.terenBazowy)) return false;
  if (otherRiverKeys.has(endKey)) return false;
  if (mediumPathEndHasRiverJunction(end, pathIndex, hexToPaths, hexes)) return false;
  const dist = nearestRiverHexDistance(end.q, end.r, otherRiverKeys);
  if (dist >= minPathSep && dist <= minPathSep + 1) return false;
  return true;
}
function collectMediumTributaryGrowCandidates(o) {
  const out = [];
  let inDir = null;
  if (o.path.length >= 2) inDir = riverStepDir(o.path[o.path.length - 2], o.cur);
  for (const [dq, dr] of HEX_DIRECTIONS) {
    const nq = o.cur.q + dq;
    const nr = o.cur.r + dr;
    const nk = hexKey(nq, nr);
    if (!isRiverWindowTurnAllowed(o.path, nq, nr)) continue;
    const onRiver = o.blockRiverKeys.has(nk);
    const isJunction = onRiver && nk !== o.startKey && o.path.length >= 2;
    if (onRiver && !isJunction) continue;
    const netSoFar = mediumTributaryNetHexCount(o.path, o.mainKeys);
    if (isJunction && netSoFar < o.minNetLen) continue;
    const nh = o.hexes[nk];
    if (!isJunction && !canRiverFlowThrough(nh, nk, o.startKey, true, void 0, false)) continue;
    if (!isJunction && netSoFar < o.minNetLen && nh?.terenBazowy === "wybrzeze" /* Wybrzeze */ && o.path.length > 1) continue;
    if (!isJunction) {
      const effectiveSep = netSoFar < o.minNetLen ? 1 : o.minPathSep;
      const sepKeys = netSoFar < o.minNetLen ? o.sepBlockKeys : o.blockRiverKeys;
      if (o.path.length > 1 && !riverGrowStepPassesSep(nq, nr, sepKeys, effectiveSep, o.sepIndex)) continue;
      if (o.path.length <= 1 && o.blockRiverKeys.has(nk) && nk !== o.startKey) continue;
    }
    const inlandSteps = netSoFar;
    let score = 0;
    if (inDir && sameRiverDir(inDir, [dq, dr])) score += inlandSteps <= 2 ? 30 : 16;
    if (dq === o.preferredDir[0] && dr === o.preferredDir[1]) {
      score += inlandSteps <= 0 ? 48 : inlandSteps <= 1 ? 16 : 3;
    }
    const centerBias = scoreRiverStepTowardLandCenter(
      o.cur.q,
      o.cur.r,
      nq,
      nr,
      o.landCenterSquare,
      o.landCentroid
    );
    score += inlandSteps <= 1 ? centerBias * 3.2 : centerBias * 5;
    if (centerBias < 0 && inlandSteps > 1) score -= 28;
    if (nh?.terenBazowy === "wybrzeze" /* Wybrzeze */ && inlandSteps > 0) score -= 90;
    score += o.rand() * (inlandSteps <= 1 ? 0.25 : 0.12);
    if (isJunction) {
      score += 55;
      if (o.mainKeys.has(nk)) score += 45;
      if (o.path.length >= 2) {
        const prev = o.path[o.path.length - 2];
        if (isHexWrapTriplet(prev, o.cur, { q: nq, r: nr })) {
          score -= 120;
        } else if (hexAxialDistance(prev.q, prev.r, nq, nr) === 1) {
          score += 30;
        }
      }
    }
    out.push({ q: nq, r: nr, score, junction: isJunction });
  }
  return out;
}
function growMediumTributaryFromMain(hexes, spawnQ, spawnR, perpDir, maxLen, blockRiverKeys, minPathSep, rand, mainKeys, seaDist, minNetLen = MEDIUM_TRIBUTARY_MIN_NET_LEN, landCenterSquare = null, parentMainKeys, sepIndex) {
  const startKey = hexKey(spawnQ, spawnR);
  const path = [{ q: spawnQ, r: spawnR }];
  const visited = /* @__PURE__ */ new Set([startKey]);
  const landCentroid = landCenterSquare?.centroid ?? estimateLandCentroidFromSeed(hexes, spawnQ, spawnR, false, 4e3);
  const sepBlockKeys = /* @__PURE__ */ new Set();
  const parent = parentMainKeys ?? mainKeys;
  for (const k of blockRiverKeys) {
    if (!parent.has(k)) sepBlockKeys.add(k);
  }
  while (path.length < maxLen) {
    const cur = path[path.length - 1];
    const growBase = {
      hexes,
      path,
      cur,
      startKey,
      preferredDir: perpDir,
      blockRiverKeys,
      sepBlockKeys,
      sepIndex: sepIndex ?? void 0,
      minPathSep,
      mainKeys,
      minNetLen,
      landCentroid,
      landCenterSquare,
      rand
    };
    const candidates = collectMediumTributaryGrowCandidates(growBase).filter((c) => !visited.has(hexKey(c.q, c.r)));
    if (candidates.length === 0) break;
    const netNow = mediumTributaryNetHexCount(path, mainKeys);
    const junctionReady = candidates.filter((c) => c.junction && netNow >= minNetLen);
    const pool = junctionReady.length > 0 ? junctionReady : candidates;
    pool.sort((a, b) => b.score - a.score);
    const pick3 = pool[0];
    path.push({ q: pick3.q, r: pick3.r });
    visited.add(hexKey(pick3.q, pick3.r));
    if (pick3.junction && netNow >= minNetLen) break;
  }
  let out = trimMediumBranchHexWrap(path, mainKeys);
  out = trimMediumJoinHexWrap(out, mainKeys, blockRiverKeys);
  if (seaDist && out.length >= 3 && mediumTributaryNetHexCount(out, mainKeys) < minNetLen) {
    const targetLen = Math.min(maxLen, out.length + minNetLen);
    let extended = extendRiverToMinimumLength(out, hexes, seaDist, rand, targetLen, maxLen);
    extended = repairRiverPathAdjacency(extended, hexes, startKey);
    if (!riverPathViolatesTurnWindow(extended)) {
      out = extended;
    }
  }
  out = trimMediumBranchHexWrap(out, mainKeys);
  out = trimMediumJoinHexWrap(out, mainKeys, blockRiverKeys);
  return out;
}
function mediumPathStartsOnMain(path, mainKeys) {
  const p0 = path[0];
  if (!p0) return false;
  return mainKeys.has(hexKey(p0.q, p0.r));
}
function mediumTributaryNetHexCount(path, mainKeys) {
  let n = 0;
  for (const p of path) {
    if (!mainKeys.has(hexKey(p.q, p.r))) n++;
  }
  return n;
}
function generateMediumTributariesFromMainRivers(ctx, massSet, maxLen, minPathSep = MAIN_RIVER_MIN_PATH_SEP) {
  const mainKeys = ctx.mainKeysCache ?? collectPathHexKeysForKinds(ctx.riverPaths, ctx.riverKinds, ["main"]);
  const blockRiverKeys = collectRiverPathHexKeys(ctx.riverPaths);
  const riverSepIndex = ctx.riverSepIndex ?? RiverHexSpatialIndex.fromKeys(blockRiverKeys);
  ctx.riverSepIndex = riverSepIndex;
  const usedSpawn = ctx.usedMediumSpawnKeys ?? /* @__PURE__ */ new Set();
  ctx.usedMediumSpawnKeys = usedSpawn;
  let placed = 0;
  let sideToggle = 0;
  const minNetLen = mediumTributaryMinNetLen(ctx.width, ctx.height);
  const spawnSpacing = mediumTributarySpacingHex(ctx.width, ctx.height, !!ctx.largeMapPerf);
  for (let pi = 0; pi < ctx.riverPaths.length; pi++) {
    if (ctx.riverKinds[pi] !== "main") continue;
    const mainPath = ctx.riverPaths[pi] ?? [];
    if (mainPath.length < 3) continue;
    const parentMainKeys = new Set(mainPath.map((mp) => hexKey(mp.q, mp.r)));
    let sinceSpawn = 0;
    for (let i = 0; i < mainPath.length; i++) {
      const p = mainPath[i];
      const pk = hexKey(p.q, p.r);
      if (!massSet.has(pk)) continue;
      sinceSpawn++;
      if (sinceSpawn < spawnSpacing) continue;
      sinceSpawn = 0;
      if (usedSpawn.has(pk)) continue;
      const flowDir = localMainFlowDirAt(mainPath, i);
      if (!flowDir) continue;
      const perpDirs = perpendicularHexDirections(flowDir);
      if (perpDirs.length === 0) continue;
      const landSquare = ctx.massCenterSquare ?? null;
      const landCentroid = landSquare?.centroid ?? estimateLandCentroidFromSeed(ctx.hexes, p.q, p.r, false, 4e3);
      const perpDir = pickPerpDirTowardLandCenter(
        perpDirs,
        p.q,
        p.r,
        landSquare,
        landCentroid,
        sideToggle
      );
      sideToggle++;
      const tryGrow = (dir) => growMediumTributaryFromMain(
        ctx.hexes,
        p.q,
        p.r,
        dir,
        maxLen,
        blockRiverKeys,
        minPathSep,
        ctx.rand,
        mainKeys,
        ctx.seaDist,
        minNetLen,
        landSquare,
        parentMainKeys,
        riverSepIndex
      );
      let tribPath = tryGrow(perpDir);
      if (mediumTributaryNetHexCount(tribPath, mainKeys) < minNetLen && perpDirs.length > 1) {
        const altDir = perpDirs[(sideToggle - 1 + 1) % perpDirs.length];
        const altPath = tryGrow(altDir);
        if (mediumTributaryNetHexCount(altPath, mainKeys) > mediumTributaryNetHexCount(tribPath, mainKeys)) {
          tribPath = altPath;
        }
      }
      if (mediumTributaryNetHexCount(tribPath, mainKeys) < minNetLen) continue;
      if (!ctx.pushMedium?.(tribPath, p.q, p.r)) continue;
      placed++;
      usedSpawn.add(pk);
      for (const tp of tribPath) {
        const tk = hexKey(tp.q, tp.r);
        blockRiverKeys.add(tk);
        riverSepIndex.add(tk);
      }
    }
  }
  return placed;
}
function buildMediumRouteTargetKeys(hexes, paths, kinds, width, height, oceanConnected) {
  const mainKeys = collectPathHexKeysForKinds(paths, kinds, ["main"]);
  const reached = buildOceanReachableRiverHexKeys(
    hexes,
    paths,
    kinds,
    width,
    height,
    oceanConnected
  );
  const targets = new Set(mainKeys);
  for (const k of collectPathHexKeysForKinds(paths, kinds, ["medium"])) {
    if (reached.has(k)) targets.add(k);
  }
  return targets;
}
function traceMediumRiver(hexes, sq, sr, tq, tr, maxLen, seaDist, rand, minLen = 3) {
  const srcKey = hexKey(sq, sr);
  let path = aStarRiverToTarget(hexes, sq, sr, tq, tr, maxLen, srcKey);
  if (path.length < 3) return [];
  path = extendRiverToMinimumLength(path, hexes, seaDist, rand, minLen, maxLen);
  path = repairRiverPathAdjacency(path, hexes, srcKey);
  if (path.length > maxLen) path = path.slice(0, maxLen);
  if (riverPathViolatesTurnWindow(path)) {
    path = sanitizeRiverTurnWindow(path, hexes, srcKey);
  }
  return path.length >= 3 ? path : [];
}
function finalizeMediumPath(hexes, path, riverPaths, riverKinds, width, height, oceanConnected) {
  if (path.length < 2) return null;
  const mainKeysEarly = collectPathHexKeysForKinds(riverPaths, riverKinds, ["main"]);
  if (path.length < 3 && !mediumPathStartsOnMain(path, mainKeysEarly)) return null;
  const srcKey = hexKey(path[0].q, path[0].r);
  let out = sanitizeRiverPath(path);
  if (riverPathViolatesTurnWindow(out)) {
    out = sanitizeRiverTurnWindow(out, hexes, srcKey);
  }
  if (out.length < 2) return null;
  const mainKeys = collectPathHexKeysForKinds(riverPaths, riverKinds, ["main"]);
  if (out.length < 3 && !mediumPathStartsOnMain(out, mainKeys)) return null;
  out = trimRiverPathRings(hexes, out);
  const networkKeys = collectRiverPathHexKeys(riverPaths);
  out = trimMediumBranchHexWrap(out, mainKeys);
  out = trimMediumJoinHexWrap(out, mainKeys, networkKeys);
  out = trimMediumTailAlongMain(out, mainKeys);
  if (out.length < 2) return null;
  if (out.length < 3 && !mediumPathStartsOnMain(out, mainKeys)) return null;
  if (!mediumPathStartsOnMain(out, mainKeys)) return null;
  if (mediumTributaryNetHexCount(out, mainKeys) < mediumTributaryMinNetLen(width, height)) return null;
  if (countMediumInlandLandHexes(hexes, out) < 3) return null;
  const reached = buildOceanReachableRiverHexKeys(
    hexes,
    riverPaths,
    riverKinds,
    width,
    height,
    oceanConnected
  );
  const touchesMain = pathTouchesMainNetwork(out, mainKeys);
  const onNetwork = tributaryTouchesOceanReachable(out, reached);
  const endsSea = pathEndsAtSea(hexes, out, width, height, oceanConnected);
  if (!onNetwork && !endsSea) return null;
  if (!touchesMain && !onNetwork) {
    if (!endsSea) return null;
  }
  if (!touchesMain && onNetwork && !endsSea) {
  }
  const hexToPaths = /* @__PURE__ */ new Map();
  for (let pi = 0; pi < riverPaths.length; pi++) {
    for (const p of riverPaths[pi] ?? []) {
      const k = hexKey(p.q, p.r);
      const s = hexToPaths.get(k) ?? /* @__PURE__ */ new Set();
      s.add(pi);
      hexToPaths.set(k, s);
    }
  }
  const pathIndex = riverPaths.length;
  const end = out[out.length - 1];
  const otherRiverKeys = collectRiverPathHexKeys(riverPaths);
  if (!endsSea && !mediumPathStartsOnMain(out, mainKeys) && mediumEndsOrphanOnFlatLand(
    hexes,
    end,
    pathIndex,
    hexToPaths,
    otherRiverKeys,
    MAIN_RIVER_MIN_PATH_SEP
  )) return null;
  return out;
}
function finalizeShortPath(hexes, path, riverPaths, riverKinds, width, height, oceanConnected) {
  let out = trimRiverPathRings(hexes, path);
  if (out.length < 3) return null;
  if (out.length >= 2) {
    const junction = out[out.length - 1];
    const approach = out[out.length - 2];
    const down = networkDownstreamNeighbor(hexes, junction, approach, riverPaths);
    out = appendJunctionDownstreamHex(out, down);
  }
  const ocean = oceanConnected;
  if (pathEndsAtSea(hexes, out, width, height, ocean)) return null;
  const mediumKeys = collectPathHexKeysForKinds(riverPaths, riverKinds, ["medium"]);
  if (mediumKeys.size === 0) return null;
  const end = out[out.length - 1];
  const endKey = hexKey(end.q, end.r);
  let onMedium = mediumKeys.has(endKey);
  if (!onMedium) {
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nk = hexKey(end.q + dq, end.r + dr);
      if (mediumKeys.has(nk)) {
        onMedium = true;
        break;
      }
    }
  }
  if (!onMedium) return null;
  const reached = buildOceanReachableRiverHexKeys(
    hexes,
    riverPaths,
    riverKinds,
    width,
    height,
    ocean
  );
  if (!tributaryTouchesOceanReachable(out, reached)) return null;
  return out;
}
function networkDownstreamNeighbor(hexes, junction, approach, riverPaths) {
  const jh = hexes[hexKey(junction.q, junction.r)];
  const edges = jh?.rzeka?.krawedzie;
  if (!edges || edges.length === 0) return void 0;
  const candidates = [];
  for (const edgeIdx of edges) {
    const dir = HEX_DIRECTIONS[edgeIdx];
    if (!dir) continue;
    const nq = junction.q + dir[0];
    const nr = junction.r + dir[1];
    if (approach && nq === approach.q && nr === approach.r) continue;
    const nh = hexes[hexKey(nq, nr)];
    if (nh?.rzeka?.obecna && nh.terenBazowy !== "morze" /* Morze */) {
      candidates.push({ q: nq, r: nr });
    }
  }
  if (candidates.length === 0) return void 0;
  if (riverPaths && riverPaths.length > 0) {
    const junctionKey = hexKey(junction.q, junction.r);
    for (const path of riverPaths) {
      for (let i = 0; i < path.length - 1; i++) {
        const a = path[i];
        const b = path[i + 1];
        const ak = hexKey(a.q, a.r);
        const bk = hexKey(b.q, b.r);
        if (ak === junctionKey) {
          const hit = candidates.find((c) => c.q === b.q && c.r === b.r);
          if (hit) return hit;
        }
        if (bk === junctionKey) {
          const hit = candidates.find((c) => c.q === a.q && c.r === a.r);
          if (hit) return hit;
        }
      }
    }
  }
  return candidates[0];
}
function stripRiverMarksFromOpenSea(hexes) {
  let n = 0;
  for (const hex of Object.values(hexes)) {
    if (hex.terenBazowy !== "morze" /* Morze */ || !hex.rzeka?.obecna) continue;
    hex.rzeka = { obecna: false, krawedzie: [] };
    n++;
  }
  return n;
}
function clearRiverMarks(hexes) {
  for (const hex of Object.values(hexes)) {
    if (hex.rzeka?.obecna) hex.rzeka = { obecna: false, krawedzie: [] };
  }
}
function tributaryCountForLength(pathLen, areaScale = 1) {
  if (pathLen < 8) return 0;
  if (pathLen < 22) return Math.max(2, Math.round(6 * areaScale));
  return Math.min(12, Math.floor(pathLen / 8 * 3 * areaScale));
}
function aStarRiverToTarget(hexes, sq, sr, tq, tr, maxLen, sourceKey, allowReliefTraversal = false) {
  const startK = hexKey(sq, sr);
  const targetK = hexKey(tq, tr);
  if (startK === targetK) return [{ q: sq, r: sr }];
  const h0 = hexAxialDistance(sq, sr, tq, tr);
  const gScore = /* @__PURE__ */ new Map([[startK, 0]]);
  const cameFrom = /* @__PURE__ */ new Map();
  const open = /* @__PURE__ */ new Set([startK]);
  const fScore = /* @__PURE__ */ new Map([[startK, h0]]);
  while (open.size > 0) {
    let current = "";
    let bestF = Infinity;
    for (const k of open) {
      const f = fScore.get(k) ?? Infinity;
      if (f < bestF) {
        bestF = f;
        current = k;
      }
    }
    if (!current) break;
    if (current === targetK) return reconstructRiverPath(cameFrom, current);
    open.delete(current);
    const curG = gScore.get(current);
    if (curG >= maxLen) continue;
    const { q, r } = parseHexKey(current);
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nk = hexKey(q + dq, r + dr);
      if (!canRiverFlowThrough(hexes[nk], nk, sourceKey, true, targetK, allowReliefTraversal)) continue;
      const tg = curG + 1;
      if (tg > maxLen) continue;
      if (tg >= (gScore.get(nk) ?? Infinity)) continue;
      cameFrom.set(nk, current);
      gScore.set(nk, tg);
      const { q: tq2, r: tr2 } = parseHexKey(nk);
      fScore.set(nk, tg + hexAxialDistance(tq2, tr2, tq, tr));
      open.add(nk);
    }
  }
  return [];
}
function findTributarySource(hexes, junction, mainPathKeys, usedSources, rand, searchMin = 3, searchMax = 8) {
  const candidates = [];
  for (let dq = -searchMax; dq <= searchMax; dq++) {
    for (let dr = -searchMax; dr <= searchMax; dr++) {
      const dist = hexAxialDistance(junction.q, junction.r, junction.q + dq, junction.r + dr);
      if (dist < searchMin || dist > searchMax) continue;
      const q = junction.q + dq;
      const r = junction.r + dr;
      const k = hexKey(q, r);
      if (mainPathKeys.has(k) || usedSources.has(k)) continue;
      const hex = hexes[k];
      if (!hex || !isReliefRiverSource(hex.terenBazowy)) continue;
      candidates.push({ q, r, score: dist * 0.4 + rand() * 2 });
    }
  }
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => a.score - b.score);
  return [candidates[0].q, candidates[0].r];
}
function traceTributary(hexes, sq, sr, tq, tr, maxLen, seaDist, rand, minLen = 3) {
  const srcKey = hexKey(sq, sr);
  let path = aStarRiverToTarget(hexes, sq, sr, tq, tr, maxLen, srcKey);
  if (path.length < 3) return [];
  path = extendRiverToMinimumLength(path, hexes, seaDist, rand, minLen, maxLen);
  const maxMeander = Math.min(10, Math.max(2, maxLen - path.length));
  path = injectRiverMeanders(path, hexes, seaDist, rand, maxMeander);
  path = repairRiverPathAdjacency(path, hexes, srcKey);
  if (path.length > maxLen) path = path.slice(0, maxLen);
  return path;
}
function addTributariesForMainRiver(hexes, mainPath, seaDist, rand, maxLen, riverPaths, riverKinds, usedSources, minSourceSep, width, height, oceanConnected, areaScale = 1, reliefSearchMin = 3, reliefSearchMax = 8) {
  const n = tributaryCountForLength(mainPath.length, areaScale);
  if (n <= 0) return;
  const mainKeys = new Set(mainPath.map((p) => hexKey(p.q, p.r)));
  const jStart = Math.max(1, Math.floor(mainPath.length * 0.18));
  const jEnd = Math.min(mainPath.length - 2, Math.floor(mainPath.length * 0.82));
  const span = jEnd - jStart;
  if (span < 2) return;
  for (let ti = 0; ti < n; ti++) {
    const jIdx = jStart + Math.floor((ti + 0.5) / n * span);
    const junction = mainPath[jIdx];
    if (!junction) continue;
    const src = findTributarySource(
      hexes,
      junction,
      mainKeys,
      usedSources,
      rand,
      reliefSearchMin,
      reliefSearchMax
    );
    if (!src) continue;
    if (isTooCloseToRiverSource(src[0], src[1], usedSources, Math.max(2, Math.floor(minSourceSep * 0.5)))) {
      continue;
    }
    const srcKey = hexKey(src[0], src[1]);
    const tribLen = Math.min(maxLen, Math.max(5, Math.floor(mainPath.length * 0.4)));
    let path = traceTributary(hexes, src[0], src[1], junction.q, junction.r, tribLen, seaDist, rand);
    if (path.length < 3) continue;
    const finalized = finalizeTributaryPath(
      hexes,
      path,
      riverPaths,
      riverKinds,
      width,
      height,
      oceanConnected
    );
    if (!finalized) continue;
    riverPaths.push(finalized);
    riverKinds.push("tributary");
    usedSources.add(srcKey);
    markRiverPath(hexes, finalized);
  }
}
function landHexesByCoverageCell(massSet, cellSize) {
  const cells = /* @__PURE__ */ new Map();
  for (const key of massSet) {
    const { q, r } = parseHexKey(key);
    const ck = `${Math.floor(q / cellSize)},${Math.floor(r / cellSize)}`;
    const arr = cells.get(ck) ?? [];
    arr.push([q, r]);
    cells.set(ck, arr);
  }
  return cells;
}
var SHORT_RIVER_MAX_DIST_FROM_MEDIUM = 5;
var MAIN_RIVER_GRID_STRIDE = 1;
function cellHasRiverHex(cellLand, hexes) {
  for (const [q, r] of cellLand) {
    const h = hexes[hexKey(q, r)];
    if (h?.rzeka?.obecna) return true;
  }
  return false;
}
function coverageCellIndex(q, r, cellSize) {
  return [Math.floor(q / cellSize), Math.floor(r / cellSize)];
}
function isSparseMainCoverageCell(land, cellSize, stride = MAIN_RIVER_GRID_STRIDE) {
  if (land.length === 0) return false;
  const [cq, cr] = coverageCellIndex(land[0][0], land[0][1], cellSize);
  return cq % stride === 0 && cr % stride === 0;
}
function collectRiverHexKeys(hexes) {
  const keys = /* @__PURE__ */ new Set();
  for (const [k, h] of Object.entries(hexes)) {
    if (h.rzeka?.obecna) keys.add(k);
  }
  return keys;
}
function collectPathHexKeysForKinds(paths, kinds, allowed) {
  const allow = allowed instanceof Set ? allowed : new Set(allowed);
  const keys = /* @__PURE__ */ new Set();
  for (let i = 0; i < paths.length; i++) {
    if (!allow.has(kinds[i] ?? "main")) continue;
    for (const p of paths[i] ?? []) keys.add(hexKey(p.q, p.r));
  }
  return keys;
}
function isNonMainRiverKind(kind) {
  return kind === "medium" || kind === "short" || kind === "tributary";
}
function buildOceanReachableRiverHexKeys(hexes, paths, kinds, width, height, oceanConnected) {
  const ocean = oceanConnected ?? oceanConnectedWaterKeys(hexes, width, height);
  const riverHexes = collectRiverHexKeys(hexes);
  const reached = /* @__PURE__ */ new Set();
  const queue = [];
  const seed = (k) => {
    if (!riverHexes.has(k) || reached.has(k)) return;
    reached.add(k);
    queue.push(k);
  };
  for (let i = 0; i < paths.length; i++) {
    if (kinds[i] !== "main") continue;
    const path = paths[i];
    if (!path?.length || !pathEndsAtSea(hexes, path, width, height, ocean)) continue;
    for (const p of path) seed(hexKey(p.q, p.r));
  }
  while (queue.length > 0) {
    const k = queue.shift();
    const { q, r } = parseHexKey(k);
    const h = hexes[k];
    if (!h?.rzeka?.krawedzie?.length) continue;
    for (const edgeIdx of h.rzeka.krawedzie) {
      const dir = HEX_DIRECTIONS[edgeIdx];
      if (!dir) continue;
      const nk = hexKey(q + dir[0], r + dir[1]);
      if (riverHexes.has(nk) && !reached.has(nk)) {
        reached.add(nk);
        queue.push(nk);
      }
    }
  }
  return reached;
}
function pruneOrphanRiverPaths(hexes, paths, kinds, width, height) {
  let curPaths = paths.slice();
  let curKinds = kinds.slice();
  for (let iter = 0; iter < 10; iter++) {
    const reached = buildOceanReachableRiverHexKeys(hexes, curPaths, curKinds, width, height);
    const ocean = oceanConnectedWaterKeys(hexes, width, height);
    const hexToPaths = /* @__PURE__ */ new Map();
    for (let pi = 0; pi < curPaths.length; pi++) {
      for (const c of curPaths[pi] ?? []) {
        const k = hexKey(c.q, c.r);
        let s = hexToPaths.get(k);
        if (!s) {
          s = /* @__PURE__ */ new Set();
          hexToPaths.set(k, s);
        }
        s.add(pi);
      }
    }
    const keptPaths = [];
    const keptKinds = [];
    let dropped = false;
    for (let i = 0; i < curPaths.length; i++) {
      const p = curPaths[i] ?? [];
      if (p.length === 0) {
        dropped = true;
        continue;
      }
      const connected = p.every((c) => {
        const h = hexes[hexKey(c.q, c.r)];
        if (h?.terenBazowy === "morze" /* Morze */) return true;
        return reached.has(hexKey(c.q, c.r));
      });
      if (!connected) {
        dropped = true;
        continue;
      }
      if (isNonMainRiverKind(curKinds[i]) && !pathEndsAtSea(hexes, p, width, height, ocean)) {
        const end = p[p.length - 1];
        const eh = hexes[hexKey(end.q, end.r)];
        let closed = false;
        for (const ei of eh?.rzeka?.krawedzie ?? []) {
          const dir = HEX_DIRECTIONS[ei];
          if (!dir) continue;
          const owners = hexToPaths.get(hexKey(end.q + dir[0], end.r + dir[1]));
          if (owners && [...owners].some((x) => x !== i)) {
            closed = true;
            break;
          }
        }
        if (!closed) {
          dropped = true;
          continue;
        }
      }
      keptPaths.push(p);
      keptKinds.push(curKinds[i] ?? "main");
    }
    clearRiverMarks(hexes);
    for (const p of keptPaths) markRiverPath(hexes, p);
    curPaths = keptPaths;
    curKinds = keptKinds;
    if (!dropped) break;
  }
  return { paths: curPaths, kinds: curKinds };
}
function pathReachesRealSea(hexes, path, width, height, goalKeys) {
  const dims = width != null && height != null ? { width, height } : inferMapDimsFromHexes(hexes);
  const goal = goalKeys ?? oceanConnectedWaterKeys(hexes, dims.width, dims.height);
  return pathEndsAtSea(hexes, path, dims.width, dims.height, goal);
}
function pruneRiversNotReachingRealSea(hexes, paths, kinds, width, height) {
  const goal = oceanConnectedWaterKeys(hexes, width, height);
  const drop = /* @__PURE__ */ new Set();
  for (let i = 0; i < paths.length; i++) {
    if (kinds[i] !== "main") continue;
    if (!pathReachesRealSea(hexes, paths[i] ?? [], width, height, goal)) drop.add(i);
  }
  if (drop.size === 0) return { paths, kinds };
  const keptPaths = paths.filter((_, i) => !drop.has(i));
  const keptKinds = kinds.filter((_, i) => !drop.has(i));
  clearRiverMarks(hexes);
  for (const p of keptPaths) markRiverPath(hexes, p);
  return pruneOrphanRiverPaths(hexes, keptPaths, keptKinds, width, height);
}
function ensureRiverOutlets(hexes, paths, kinds, width, height) {
  let result = pruneOrphanRiverPaths(hexes, paths, kinds, width, height);
  result = pruneRiversNotReachingRealSea(hexes, result.paths, result.kinds, width, height);
  const ocean = oceanConnectedWaterKeys(hexes, width, height);
  result = pruneInvalidShortRiverPaths(hexes, result.paths, result.kinds, width, height, ocean);
  scrubStrayRiverHexMarks(hexes, result.paths);
  syncRiverEdgeBonusHexes(hexes);
  return result;
}
function scrubStrayRiverHexMarks(hexes, paths) {
  clearRiverMarks(hexes);
  for (const path of paths) {
    if (path?.length) markRiverPath(hexes, path);
  }
  syncRiverEdgeBonusHexes(hexes);
}
function pruneInvalidShortRiverPaths(hexes, paths, kinds, width, height, oceanConnected) {
  const mediumKeys = collectPathHexKeysForKinds(paths, kinds, ["medium"]);
  if (mediumKeys.size === 0) return { paths, kinds };
  const drop = /* @__PURE__ */ new Set();
  for (let i = 0; i < paths.length; i++) {
    if (kinds[i] !== "short") continue;
    const p = paths[i] ?? [];
    const p0 = p[0];
    if (!p0) {
      drop.add(i);
      continue;
    }
    if (nearestRiverHexDistance(p0.q, p0.r, mediumKeys) > SHORT_RIVER_MAX_DIST_FROM_MEDIUM) {
      drop.add(i);
      continue;
    }
    if (pathEndsAtSea(hexes, p, width, height, oceanConnected)) {
      drop.add(i);
      continue;
    }
    const end = p[p.length - 1];
    let onMedium = mediumKeys.has(hexKey(end.q, end.r));
    if (!onMedium) {
      for (const [dq, dr] of HEX_DIRECTIONS) {
        if (mediumKeys.has(hexKey(end.q + dq, end.r + dr))) {
          onMedium = true;
          break;
        }
      }
    }
    if (!onMedium) drop.add(i);
  }
  if (drop.size === 0) return { paths, kinds };
  const keptPaths = paths.filter((_, i) => !drop.has(i));
  const keptKinds = kinds.filter((_, i) => !drop.has(i));
  clearRiverMarks(hexes);
  for (const p of keptPaths) markRiverPath(hexes, p);
  return { paths: keptPaths, kinds: keptKinds };
}
function pruneInvalidMediumRiverPaths(hexes, paths, kinds, width, height, oceanConnected) {
  const ocean = oceanConnected ?? oceanConnectedWaterKeys(hexes, width, height);
  const mainKeys = collectPathHexKeysForKinds(paths, kinds, ["main"]);
  const networkKeys = collectRiverPathHexKeys(paths);
  let joinRepaired = false;
  for (let i = 0; i < paths.length; i++) {
    if (kinds[i] !== "medium") continue;
    let trimmed = trimMediumBranchHexWrap(paths[i] ?? [], mainKeys);
    trimmed = trimMediumJoinHexWrap(trimmed, mainKeys, networkKeys);
    if (trimmed.length !== (paths[i]?.length ?? 0)) {
      paths[i] = trimmed;
      joinRepaired = true;
    }
  }
  if (joinRepaired) {
    clearRiverMarks(hexes);
    for (const p of paths) markRiverPath(hexes, p);
  }
  const reached = buildOceanReachableRiverHexKeys(hexes, paths, kinds, width, height, ocean);
  const hexToPaths = /* @__PURE__ */ new Map();
  for (let pi = 0; pi < paths.length; pi++) {
    for (const p of paths[pi] ?? []) {
      const k = hexKey(p.q, p.r);
      const s = hexToPaths.get(k) ?? /* @__PURE__ */ new Set();
      s.add(pi);
      hexToPaths.set(k, s);
    }
  }
  const drop = /* @__PURE__ */ new Set();
  for (let i = 0; i < paths.length; i++) {
    if (kinds[i] !== "medium") continue;
    const p = paths[i] ?? [];
    if (p.length < 2) {
      drop.add(i);
      continue;
    }
    if (p.length < 3 && !mediumPathStartsOnMain(p, mainKeys)) {
      drop.add(i);
      continue;
    }
    if (mediumTributaryNetHexCount(p, mainKeys) < mediumTributaryMinNetLen(width, height)) {
      drop.add(i);
      continue;
    }
    if (riverPathViolatesTurnWindow(p)) {
      drop.add(i);
      continue;
    }
    if (countMediumInlandLandHexes(hexes, p) < 3) {
      drop.add(i);
      continue;
    }
    const endsSea = pathEndsAtSea(hexes, p, width, height, ocean);
    const onNetwork = tributaryTouchesOceanReachable(p, reached);
    const touchesMain = pathTouchesMainNetwork(p, mainKeys);
    if (!onNetwork && !endsSea) {
      drop.add(i);
      continue;
    }
    if (!touchesMain && !onNetwork && endsSea) {
      drop.add(i);
      continue;
    }
    const startsOnMain = mediumPathStartsOnMain(p, mainKeys);
    if (!endsSea && !startsOnMain) {
      const end = p[p.length - 1];
      const eh = hexes[hexKey(end.q, end.r)];
      let closed = false;
      for (const edgeIdx of eh?.rzeka?.krawedzie ?? []) {
        const dir = HEX_DIRECTIONS[edgeIdx];
        if (!dir) continue;
        const owners = hexToPaths.get(hexKey(end.q + dir[0], end.r + dir[1]));
        if (owners && [...owners].some((x) => x !== i)) {
          closed = true;
          break;
        }
      }
      if (!closed) drop.add(i);
    }
  }
  if (drop.size === 0) return { paths, kinds };
  const keptPaths = paths.filter((_, i) => !drop.has(i));
  const keptKinds = kinds.filter((_, i) => !drop.has(i));
  clearRiverMarks(hexes);
  for (const p of keptPaths) markRiverPath(hexes, p);
  return { paths: keptPaths, kinds: keptKinds };
}
function collectRiverPathHexKeys(paths) {
  const keys = /* @__PURE__ */ new Set();
  for (const path of paths) {
    for (const p of path ?? []) keys.add(hexKey(p.q, p.r));
  }
  return keys;
}
function rankNetworkJunctionCandidates(sq, sr, junctionKeys, seaDist, maxLen, rand, junctionCap = 16) {
  const out = [];
  const maxD = maxLen + 6;
  for (let dist = 3; dist <= maxD && out.length < junctionCap; dist++) {
    for (let dq = -dist; dq <= dist; dq++) {
      for (let dr = -dist; dr <= dist; dr++) {
        if (hexAxialDistance(0, 0, dq, dr) !== dist) continue;
        const q = sq + dq;
        const r = sr + dr;
        const k = hexKey(q, r);
        if (!junctionKeys.has(k)) continue;
        const sd = seaDist.get(k) ?? 0;
        if (sd < RIVER_MIN_INLAND_FROM_SEA) continue;
        out.push({ q, r, dist, score: dist + rand() * 2 - (sd > 12 ? 4 : 0) });
      }
    }
  }
  out.sort((a, b) => a.score - b.score);
  return out.slice(0, junctionCap);
}
var RIVER_SPATIAL_CELL = 6;
var RiverHexSpatialIndex = class _RiverHexSpatialIndex {
  constructor() {
    this.buckets = /* @__PURE__ */ new Map();
    this.count = 0;
  }
  static fromKeys(keys) {
    const idx = new _RiverHexSpatialIndex();
    for (const k of keys) idx.add(k);
    return idx;
  }
  get size() {
    return this.count;
  }
  add(key) {
    const { q, r } = parseHexKey(key);
    const cell = _RiverHexSpatialIndex.cellId(q, r);
    const bucket = this.buckets.get(cell);
    if (bucket) {
      if (bucket.includes(key)) return;
      bucket.push(key);
    } else {
      this.buckets.set(cell, [key]);
    }
    this.count++;
  }
  addPath(path) {
    for (const p of path) this.add(hexKey(p.q, p.r));
  }
  static cellId(q, r) {
    return `${Math.floor(q / RIVER_SPATIAL_CELL)},${Math.floor(r / RIVER_SPATIAL_CELL)}`;
  }
  nearestDistance(sq, sr, earlyExitBelow = 0) {
    if (this.count === 0) return Infinity;
    const cq0 = Math.floor(sq / RIVER_SPATIAL_CELL);
    const cr0 = Math.floor(sr / RIVER_SPATIAL_CELL);
    let ring = 0;
    let best = Infinity;
    const maxRing = 24;
    while (ring <= maxRing) {
      for (let dq = -ring; dq <= ring; dq++) {
        for (let dr = -ring; dr <= ring; dr++) {
          if (ring > 0 && Math.abs(dq) !== ring && Math.abs(dr) !== ring) continue;
          const bucket = this.buckets.get(`${cq0 + dq},${cr0 + dr}`);
          if (!bucket) continue;
          for (const k of bucket) {
            const { q, r } = parseHexKey(k);
            const d = hexAxialDistance(sq, sr, q, r);
            if (d < best) {
              best = d;
              if (earlyExitBelow > 0 && d < earlyExitBelow) return d;
            }
          }
        }
      }
      if (best !== Infinity && best <= ring * RIVER_SPATIAL_CELL) break;
      ring++;
    }
    return best;
  }
};
function nearestRiverHexDistance(sq, sr, riverKeys, spatialIndex) {
  if (spatialIndex && spatialIndex.size > 0) {
    return spatialIndex.nearestDistance(sq, sr);
  }
  let best = Infinity;
  for (const k of riverKeys) {
    const { q, r } = parseHexKey(k);
    best = Math.min(best, hexAxialDistance(sq, sr, q, r));
  }
  return best;
}
function isPathTooCloseToRiverHexes(path, riverKeys, minSep, spatialIndex) {
  if (riverKeys.size === 0 || minSep <= 0) return false;
  if (spatialIndex && spatialIndex.size > 0) {
    for (const p of path) {
      if (spatialIndex.nearestDistance(p.q, p.r, minSep) < minSep) return true;
    }
    return false;
  }
  for (const p of path) {
    for (const k of riverKeys) {
      const { q, r } = parseHexKey(k);
      if (hexAxialDistance(p.q, p.r, q, r) < minSep) return true;
    }
  }
  return false;
}
function pathHasValidRiverOutlet(hexes, path, paths, kinds, width, height) {
  if (!path?.length) return false;
  const ocean = oceanConnectedWaterKeys(hexes, width, height);
  if (pathEndsAtSea(hexes, path, width, height, ocean)) return true;
  const reached = buildOceanReachableRiverHexKeys(hexes, paths, kinds, width, height, ocean);
  return tributaryTouchesOceanReachable(path, reached);
}
function buildGridRouteCandidates(ctx, sq, sr, massSet) {
  const {
    hexes,
    width,
    height,
    riverPaths,
    seaDist,
    openOceanDist,
    oceanConnected,
    rand,
    minLen,
    maxLen,
    acceptLen,
    traceMinLen,
    traceOptsBase,
    seaBufferOpts
  } = ctx;
  const srcKey = hexKey(sq, sr);
  const startSeaDist = seaDist.get(srcKey) ?? 999;
  const traceMax = riverTraceBudgetForSeaDist(startSeaDist, minLen, maxLen, ctx.largeMapPerf);
  const out = [];
  const mode = ctx.placeMode ?? "auto";
  const junctionCap = ctx.largeMapPerf ? 6 : 16;
  if (mode !== "short") {
    const fastTrace = !!(ctx.pangeaSingleMass || ctx.largeMapPerf);
    const seaPath = traceRiverForGridFill(
      hexes,
      sq,
      sr,
      traceMax,
      minLen,
      acceptLen,
      {
        seaDist,
        openOceanDist,
        oceanConnected,
        mapWidth: width,
        mapHeight: height,
        rand,
        ...traceOptsBase,
        allowReliefTraversal: ctx.allowReliefTraversal,
        relaxSeaBuffer: ctx.relaxSeaBuffer
      },
      ctx.relaxSeaBuffer,
      fastTrace
    );
    if (seaPath.length >= acceptLen && pathEndsAtSea(hexes, seaPath, width, height, oceanConnected) && (ctx.relaxSeaBuffer || riverPathRespectsSeaBuffer(
      hexes,
      seaPath,
      seaDist,
      seaBufferOpts.minInland,
      seaBufferOpts.mouthTail
    ))) {
      out.push({ path: seaPath, kind: "main", len: seaPath.length });
    }
  }
  if (mode === "main-only") return out;
  const riverKeys = new Set(
    [...collectRiverPathHexKeys(riverPaths)].filter((k) => !massSet || massSet.has(k))
  );
  const tribTargetKinds = ctx.targetRiverKinds ?? (mode === "short" ? ["medium"] : void 0);
  let tribKeysForTrace;
  if (mode === "medium") {
    tribKeysForTrace = buildMediumRouteTargetKeys(
      hexes,
      riverPaths,
      ctx.riverKinds,
      width,
      height,
      oceanConnected
    );
  } else {
    const tribRiverKeys = tribTargetKinds ? collectPathHexKeysForKinds(riverPaths, ctx.riverKinds, tribTargetKinds) : riverKeys;
    tribKeysForTrace = tribRiverKeys.size > 0 ? tribRiverKeys : riverKeys;
  }
  if (tribKeysForTrace.size > 0) {
    let bestTrib = [];
    let bestTribLen = Infinity;
    const traceFn = mode === "medium" ? traceMediumRiver : traceTributary;
    for (const j of rankNetworkJunctionCandidates(sq, sr, tribKeysForTrace, seaDist, traceMax, rand, junctionCap)) {
      const p = traceFn(hexes, sq, sr, j.q, j.r, traceMax, seaDist, rand, minLen);
      if (p.length >= acceptLen && p.length < bestTribLen) {
        bestTrib = p;
        bestTribLen = p.length;
      }
    }
    if (bestTrib.length >= acceptLen) {
      out.push({ path: bestTrib, kind: "tributary", len: bestTrib.length });
    }
  }
  return out;
}
function pickPhase2Route(candidates) {
  const tribs = candidates.filter((c) => c.kind === "tributary");
  if (tribs.length > 0) {
    return tribs.reduce((a, b) => a.len <= b.len ? a : b);
  }
  const seas = candidates.filter((c) => c.kind === "main");
  if (seas.length === 0) return null;
  return seas.reduce((a, b) => a.len <= b.len ? a : b);
}
function pickGeographicLongestRoute(candidates, startSeaDist, nearestRiverDist) {
  if (candidates.length === 0) return null;
  const tribs = candidates.filter((c) => c.kind === "tributary");
  const seas = candidates.filter((c) => c.kind === "main");
  let pool;
  if (tribs.length === 0) pool = seas;
  else if (seas.length === 0) pool = tribs;
  else if (nearestRiverDist < startSeaDist) pool = tribs;
  else if (nearestRiverDist > startSeaDist) pool = seas;
  else pool = candidates;
  return pool.reduce((a, b) => a.len >= b.len ? a : b);
}
function collectMassOceanCoastalLandKeys(massSet, hexes, oceanConnected) {
  const coastal = /* @__PURE__ */ new Set();
  for (const k of massSet) {
    const { q, r } = parseHexKey(k);
    if (!isCoastalLandHex(hexes, q, r)) continue;
    let touchesOcean = false;
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nk = hexKey(q + dq, r + dr);
      if (oceanConnected.has(nk)) {
        touchesOcean = true;
        break;
      }
    }
    if (touchesOcean) coastal.add(k);
  }
  return coastal;
}
function buildCoastalAdjacency(coastalKeys) {
  const adj = /* @__PURE__ */ new Map();
  for (const k of coastalKeys) {
    const { q, r } = parseHexKey(k);
    const nbs = [];
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nk = hexKey(q + dq, r + dr);
      if (coastalKeys.has(nk)) nbs.push(nk);
    }
    adj.set(k, nbs);
  }
  return adj;
}
function largestCoastalComponent(coastalKeys) {
  if (coastalKeys.size === 0) return coastalKeys;
  const adj = buildCoastalAdjacency(coastalKeys);
  const visited = /* @__PURE__ */ new Set();
  let best = [];
  for (const start of coastalKeys) {
    if (visited.has(start)) continue;
    const comp = [];
    const queue = [start];
    visited.add(start);
    let qi = 0;
    while (qi < queue.length) {
      const k = queue[qi++];
      comp.push(k);
      for (const nb of adj.get(k) ?? []) {
        if (visited.has(nb)) continue;
        visited.add(nb);
        queue.push(nb);
      }
    }
    if (comp.length > best.length) best = comp;
  }
  return new Set(best);
}
function coveredCoastalKeysFromMainRivers(coastalKeys, paths, kinds, massSet, seaDist) {
  const covered = /* @__PURE__ */ new Set();
  for (let i = 0; i < paths.length; i++) {
    if (kinds[i] !== "main") continue;
    const path = paths[i] ?? [];
    const tailStart = Math.max(0, path.length - RIVER_MOUTH_TAIL_LEN);
    for (let pi = tailStart; pi < path.length; pi++) {
      const p = path[pi];
      const pk = hexKey(p.q, p.r);
      const pd = seaDist.get(pk) ?? 999;
      if (!massSet.has(pk) && pd > 2) continue;
      if (pd > 3) continue;
      for (const ck of coastalKeys) {
        const { q, r } = parseHexKey(ck);
        if (hexDistanceAxial(p.q, p.r, q, r) <= 1) covered.add(ck);
      }
    }
  }
  return covered;
}
function coastalMouthDistances(coastalKeys, coveredCoastal) {
  const dist = /* @__PURE__ */ new Map();
  const queue = [];
  for (const k of coveredCoastal) {
    if (!coastalKeys.has(k)) continue;
    dist.set(k, 0);
    queue.push(k);
  }
  let qi = 0;
  while (qi < queue.length) {
    const k = queue[qi++];
    const d = dist.get(k);
    const { q, r } = parseHexKey(k);
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nk = hexKey(q + dq, r + dr);
      if (!coastalKeys.has(nk) || dist.has(nk)) continue;
      dist.set(nk, d + 1);
      queue.push(nk);
    }
  }
  return dist;
}
function worstCoastalMouthGap(coastalKeys, mouthDist) {
  let worst = 0;
  for (const k of coastalKeys) {
    const d = mouthDist.get(k);
    if (d == null) {
      if (coastalKeys.size > worst) worst = coastalKeys.size;
      continue;
    }
    if (d > worst) worst = d;
  }
  return worst;
}
function farthestUncoveredCoastalHexes(coastalKeys, mouthDist, limit = 8) {
  const ranked = [...coastalKeys].map((k) => ({ k, d: mouthDist.get(k) ?? coastalKeys.size })).sort((a, b) => b.d - a.d || parseHexKey(a.k).q - parseHexKey(b.k).q);
  return ranked.slice(0, limit).map((x) => x.k);
}
function worstMainRiverCoastMouthGapOnMass(massSet, hexes, paths, kinds, _width, _height, oceanConnected, maxAllowedGap, seaDist) {
  const coastal = largestCoastalComponent(
    collectMassOceanCoastalLandKeys(massSet, hexes, oceanConnected)
  );
  if (coastal.size < 2) return { ok: true, worstGap: 0 };
  const dist = seaDist ?? buildSeaDistanceField(hexes);
  const coveredCoastal = coveredCoastalKeysFromMainRivers(coastal, paths, kinds, massSet, dist);
  const mouthDist = coastalMouthDistances(coastal, coveredCoastal);
  const worst = worstCoastalMouthGap(coastal, mouthDist);
  return { ok: worst <= maxAllowedGap, worstGap: worst };
}
function topUpMainRiverCoastMouthGapsOnce(massSet, seaDist, gridCtx, maxGap, softAcceptLen) {
  const gapCtx = { ...gridCtx, allowReliefTraversal: true };
  const coastal = largestCoastalComponent(
    collectMassOceanCoastalLandKeys(massSet, gapCtx.hexes, gapCtx.oceanConnected)
  );
  if (coastal.size < 2) return 0;
  let mainKeys = gapCtx.mainKeysCache ?? collectPathHexKeysForKinds(gapCtx.riverPaths, gapCtx.riverKinds, ["main"]);
  const gapPathSep = 2;
  const gapPushMain = (path, sq, sr) => {
    if (isPathTooCloseToRiverHexes(path, mainKeys, gapPathSep)) return false;
    const finalized = finalizeMainRiverPath(
      gapCtx.hexes,
      path,
      gapCtx.width,
      gapCtx.height,
      gapCtx.oceanConnected
    );
    if (!finalized) return false;
    gapCtx.riverPaths.push(finalized);
    gapCtx.riverKinds.push("main");
    gapCtx.usedSources.add(hexKey(sq, sr));
    markRiverPath(gapCtx.hexes, finalized);
    addPathKeysToSet(finalized, mainKeys);
    if (gapCtx.mainKeysCache && gapCtx.mainKeysCache !== mainKeys) {
      addPathKeysToSet(finalized, gapCtx.mainKeysCache);
    }
    return true;
  };
  gapCtx.pushMain = gapPushMain;
  const tryAtKey = (k) => {
    const { q, r } = parseHexKey(k);
    const tryCoords = [[q, r]];
    for (const [dq, dr] of HEX_DIRECTIONS) tryCoords.push([q + dq, r + dr]);
    for (const [nq, nr] of tryCoords) {
      const d = seaDist.get(hexKey(nq, nr)) ?? 999;
      if (d < 1 || d > 2) continue;
      if (tryPlaceMainRiverAtMouth(gapCtx, nq, nr, mainKeys, softAcceptLen, gapPathSep)) {
        mainKeys = gapCtx.mainKeysCache ?? collectPathHexKeysForKinds(gapCtx.riverPaths, gapCtx.riverKinds, ["main"]);
        return true;
      }
    }
    return false;
  };
  let placed = 0;
  for (let attempt = 0; attempt < 80; attempt++) {
    const coveredCoastalNow = coveredCoastalKeysFromMainRivers(
      coastal,
      gapCtx.riverPaths,
      gapCtx.riverKinds,
      massSet,
      seaDist
    );
    const mouthDistNow = coastalMouthDistances(coastal, coveredCoastalNow);
    if (worstCoastalMouthGap(coastal, mouthDistNow) <= maxGap) break;
    const picks = farthestUncoveredCoastalHexes(coastal, mouthDistNow, 16);
    let okPlace = false;
    for (const pick3 of picks) {
      if (tryAtKey(pick3)) {
        okPlace = true;
        break;
      }
    }
    if (!okPlace) {
      const allFar = [...coastal].map((k) => ({ k, d: mouthDistNow.get(k) ?? coastal.size })).filter((x) => x.d > maxGap).sort((a, b) => b.d - a.d || parseHexKey(a.k).q - parseHexKey(b.k).q);
      for (const { k } of allFar) {
        if (tryAtKey(k)) {
          okPlace = true;
          break;
        }
      }
    }
    if (!okPlace) break;
    placed++;
  }
  return placed;
}
function topUpMainRiverCoastMouthGaps(massSet, seaDist, gridCtx, maxGap, softAcceptLen) {
  let placed = 0;
  const gapAcceptLen = Math.max(2, softAcceptLen ?? 3);
  for (let round = 0; round < 48; round++) {
    const roundPlaced = topUpMainRiverCoastMouthGapsOnce(
      massSet,
      seaDist,
      gridCtx,
      maxGap,
      gapAcceptLen
    );
    placed += roundPlaced;
    if (roundPlaced === 0) break;
    const check = worstMainRiverCoastMouthGapOnMass(
      massSet,
      gridCtx.hexes,
      gridCtx.riverPaths,
      gridCtx.riverKinds,
      gridCtx.width,
      gridCtx.height,
      gridCtx.oceanConnected,
      maxGap,
      seaDist
    );
    if (check.ok) break;
  }
  return placed;
}
function refillMainRiverCoastMouthGapsOnMap(hexes, width, height, riverPaths, riverKinds, rand, riverParams, minLen) {
  const { seaDist, oceanConnected, openOceanDist } = buildRiverFieldCache(hexes, width, height);
  const masses = groupLandMassKeys(hexes).filter((m) => m.length >= 5).sort((a, b) => b.length - a.length);
  const riverPerf = buildRiverPerfCtx(masses, riverParams.areaScale);
  const catalogMinLen = minLen ?? riverParams.minLen;
  const maxLen = riverParams.maxLen;
  const usedSources = /* @__PURE__ */ new Set();
  const mainKeysCache = collectPathHexKeysForKinds(riverPaths, riverKinds, ["main"]);
  const pushMain = (path, sq, sr) => {
    if (isPathTooCloseToRiverHexes(path, mainKeysCache, MAIN_RIVER_MIN_PATH_SEP)) return false;
    const finalized = finalizeMainRiverPath(hexes, path, width, height, oceanConnected);
    if (!finalized) return false;
    riverPaths.push(finalized);
    riverKinds.push("main");
    usedSources.add(hexKey(sq, sr));
    markRiverPath(hexes, finalized);
    addPathKeysToSet(finalized, mainKeysCache);
    return true;
  };
  const gridCtx = {
    hexes,
    width,
    height,
    riverPaths,
    riverKinds,
    usedSources,
    seaDist,
    openOceanDist,
    oceanConnected,
    rand,
    minLen: catalogMinLen,
    maxLen,
    acceptLen: riverParams.gridTraceMinLen,
    sourceSep: Math.max(2, Math.floor(riverParams.mainCell * 0.25)),
    traceMinLen: riverParams.gridTraceMinLen,
    traceOptsBase: {
      hardMeanderLen: riverParams.hardMeanderLen,
      mouthTailLen: riverParams.mouthTailLen
    },
    seaBufferOpts: {
      minInland: riverParams.minInlandFromSea,
      mouthTail: riverParams.mouthTailLen
    },
    pushMain,
    pushTributary: () => false,
    pangeaSingleMass: riverPerf.pangeaSingleMass,
    largeMapPerf: riverPerf.largeMapPerf,
    mainKeysCache,
    allowReliefTraversal: true,
    placeMode: "main-only"
  };
  const maxGap = mainRiverCoastMouthMaxGapForDims(width, height);
  let placed = 0;
  for (const mass of masses) {
    const massSet = new Set(mass);
    setMassRiverTargets(hexes, massSet, gridCtx);
    placed += topUpMainRiverCoastMouthGaps(
      massSet,
      seaDist,
      gridCtx,
      maxGap,
      2
    );
  }
  return placed;
}
function setMassRiverTargets(hexes, massSet, ctx) {
  ctx.massCentroid = computeLandMassCentroid(hexes, massSet);
  ctx.massCenterSquare = continentCenterSquare(hexes, massSet);
}
function collectCoastMouthCandidates(cells, hexes, seaDist, maxSeaDist = 2) {
  const out = [];
  for (const [q, r] of cells) {
    const h = hexes[hexKey(q, r)];
    if (!h || !isRiverLandTerrain(h.terenBazowy)) continue;
    const d = seaDist.get(hexKey(q, r)) ?? 999;
    if (d < 1 || d > maxSeaDist) continue;
    out.push({ q, r, d });
  }
  return out;
}
function tryPlaceMainRiverAtMouth(ctx, mq, mr, mainKeys, softAcceptLen, pathSep = MAIN_RIVER_MIN_PATH_SEP) {
  const targetLen = ctx.minLen;
  const acceptThreshold = softAcceptLen != null && softAcceptLen < targetLen ? softAcceptLen : targetLen;
  const mouthKey = hexKey(mq, mr);
  const startD = ctx.seaDist.get(mouthKey);
  if (startD == null || startD < 1 || startD > 2) return false;
  const traceMax = riverTraceBudgetForSeaDist(startD, targetLen, ctx.maxLen, ctx.largeMapPerf);
  const path = traceRiverFromCoast(
    ctx.hexes,
    mq,
    mr,
    Math.max(traceMax, ctx.maxLen),
    {
      seaDist: ctx.seaDist,
      openOceanDist: ctx.openOceanDist,
      oceanConnected: ctx.oceanConnected,
      mapWidth: ctx.width,
      mapHeight: ctx.height,
      rand: ctx.rand,
      minLen: targetLen,
      blockRiverKeys: mainKeys,
      minPathSep: pathSep,
      landCentroid: ctx.massCentroid ?? null,
      landCenterSquare: ctx.massCenterSquare ?? null,
      ...ctx.traceOptsBase,
      allowReliefTraversal: ctx.allowReliefTraversal
    }
  );
  if (path.length < acceptThreshold) return false;
  if (isPathTooCloseToRiverHexes(path, mainKeys, pathSep)) return false;
  const sq = path[0].q;
  const sr = path[0].r;
  if (ctx.pushMain(path, sq, sr)) {
    addPathKeysToSet(path, mainKeys);
    if (ctx.mainKeysCache && ctx.mainKeysCache !== mainKeys) {
      addPathKeysToSet(path, ctx.mainKeysCache);
    }
    return true;
  }
  return false;
}
function tryPlaceMainRiverFromCoast(ctx, land, massSet, mainKeysCache, softAcceptLen) {
  const mainKeys = mainKeysCache ?? ctx.mainKeysCache ?? collectPathHexKeysForKinds(ctx.riverPaths, ctx.riverKinds, ["main"]);
  const mouths = collectCoastMouthCandidates(land, ctx.hexes, ctx.seaDist, 2);
  if (!ctx.pangeaSingleMass) {
    for (const [q, r] of expandRiverSourceCandidates(land, massSet, 2)) {
      const h = ctx.hexes[hexKey(q, r)];
      if (!h || !isRiverLandTerrain(h.terenBazowy)) continue;
      const d = ctx.seaDist.get(hexKey(q, r)) ?? 999;
      if (d >= 1 && d <= 2) mouths.push({ q, r, d });
    }
  }
  mouths.sort((a, b) => a.d - b.d || ctx.rand() * 2 - 1);
  const seen = /* @__PURE__ */ new Set();
  const mouthLimit = ctx.pangeaSingleMass ? ctx.largeMapPerf ? 24 : 12 : ctx.largeMapPerf ? 8 : mouths.length;
  for (const mouth of mouths.slice(0, mouthLimit)) {
    const mk = hexKey(mouth.q, mouth.r);
    if (seen.has(mk)) continue;
    seen.add(mk);
    if (tryPlaceMainRiverAtMouth(ctx, mouth.q, mouth.r, mainKeys, softAcceptLen)) {
      return true;
    }
  }
  return false;
}
function tryPlaceGridSource(ctx, sq, sr, massSet) {
  const srcKey = hexKey(sq, sr);
  if (ctx.usedSources.has(srcKey)) return false;
  if (isTooCloseToRiverSource(sq, sr, ctx.usedSources, ctx.sourceSep)) return false;
  const h = ctx.hexes[srcKey];
  if (!h || !isRiverLandTerrain(h.terenBazowy)) return false;
  const mode = ctx.placeMode ?? "auto";
  if (mode === "short") {
    const mediumKeys = collectPathHexKeysForKinds(ctx.riverPaths, ctx.riverKinds, ["medium"]);
    if (mediumKeys.size === 0) return false;
    const dist = nearestRiverHexDistance(sq, sr, mediumKeys);
    if (dist > SHORT_RIVER_MAX_DIST_FROM_MEDIUM) return false;
  }
  const startSeaDist = ctx.seaDist.get(srcKey) ?? 999;
  const riverKeys = new Set(
    [...collectRiverPathHexKeys(ctx.riverPaths)].filter((k) => !massSet || massSet.has(k))
  );
  const nearestRiverDist = nearestRiverHexDistance(sq, sr, riverKeys);
  const candidates = buildGridRouteCandidates(ctx, sq, sr, massSet);
  let chosen = null;
  if (mode === "main-only") {
    chosen = candidates.filter((c) => c.kind === "main").reduce(
      (a, b) => a && a.len >= b.len ? a : b,
      null
    );
  } else if (mode === "medium") {
    chosen = pickPhase2Route(candidates);
  } else if (mode === "short") {
    chosen = candidates.filter((c) => c.kind === "tributary").reduce(
      (a, b) => a && a.len >= b.len ? a : b,
      null
    );
  } else {
    chosen = pickGeographicLongestRoute(candidates, startSeaDist, nearestRiverDist);
  }
  if (!chosen) return false;
  if (chosen.kind === "main") return ctx.pushMain(chosen.path, sq, sr);
  if (mode === "medium" && ctx.pushMedium) return ctx.pushMedium(chosen.path, sq, sr);
  if (mode === "short" && ctx.pushShort) return ctx.pushShort(chosen.path, sq, sr);
  return ctx.pushTributary(chosen.path, sq, sr);
}
function landMassHasMainRiver(massLandKeys, paths, kinds) {
  const massSet = new Set(massLandKeys);
  for (let i = 0; i < paths.length; i++) {
    if (kinds[i] !== "main") continue;
    for (const p of paths[i] ?? []) {
      if (massSet.has(hexKey(p.q, p.r))) return true;
    }
  }
  return false;
}
function cellHasMainRiverSource(cellLand, paths, kinds) {
  const cellSet = new Set(cellLand.map(([q, r]) => hexKey(q, r)));
  for (let i = 0; i < paths.length; i++) {
    if (kinds[i] !== "main") continue;
    const p0 = paths[i]?.[0];
    if (p0 && cellSet.has(hexKey(p0.q, p0.r))) return true;
  }
  return false;
}
function isTooCloseToRiverSource(sq, sr, usedSources, minSep) {
  if (minSep <= 0) return false;
  for (const sk of usedSources) {
    const { q, r } = parseHexKey(sk);
    if (hexAxialDistance(q, r, sq, sr) < minSep) return true;
  }
  return false;
}
function minLandHexesForRiverCell(cellSize) {
  return Math.max(3, Math.floor(cellSize * 0.2));
}
var RIVER_PROXIMITY_MAX_DIST = 5;
function riverProximityMaxDist(cellSize) {
  return Math.max(RIVER_PROXIMITY_MAX_DIST, Math.ceil(cellSize / 2));
}
function riverProximityEnforceTarget(cellSize) {
  const proxLimit = riverProximityMaxDist(cellSize);
  return Math.min(proxLimit + 5, Math.max(proxLimit, Math.ceil(cellSize * 2)));
}
function riverTraceBudgetForSeaDist(startSeaDist, minLen, maxLen, largeMapPerf = false) {
  const raw = Math.max(maxLen, minLen + 24, Math.ceil(startSeaDist * 3) + minLen);
  const inlandBonus = Math.min(16, Math.floor(startSeaDist / 3));
  if (!largeMapPerf) return raw + inlandBonus;
  return Math.max(maxLen, Math.min(raw, maxLen + Math.ceil(startSeaDist * 2) + 24)) + inlandBonus;
}
function isPangeaSingleMass(masses) {
  return masses.length === 1;
}
function buildRiverPerfCtx(masses, areaScale) {
  let totalLandHexes = 0;
  let maxMassSize = 0;
  for (const m of masses) {
    totalLandHexes += m.length;
    if (m.length > maxMassSize) maxMassSize = m.length;
  }
  return {
    pangeaSingleMass: isPangeaSingleMass(masses),
    largeMapPerf: areaScale >= 1.35,
    totalLandHexes,
    maxMassSize
  };
}
var HUGE_LAND_MASS_HEXES = 4800;
var LARGE_MAP_TOTAL_LAND_HEXES = 5e3;
var LARGE_MAP_MASS_HEXES = 800;
function riverRoundProfile(massSize, perf) {
  if (perf.pangeaSingleMass) return "pangea";
  if (massSize >= HUGE_LAND_MASS_HEXES) return "huge-mass";
  if (perf.largeMapPerf) {
    if (massSize >= 2e3 || perf.totalLandHexes >= LARGE_MAP_TOTAL_LAND_HEXES) return "huge-mass";
    if (massSize >= LARGE_MAP_MASS_HEXES) return "large-map";
    return "large-map";
  }
  return "normal";
}
function massRiverCoveragePasses(massSize, profile = "normal") {
  const base = Math.max(6, Math.min(24, 6 + Math.floor(Math.sqrt(massSize / 300))));
  if (profile === "normal") return base;
  if (profile === "large-map") {
    return Math.max(3, Math.min(8, 3 + Math.floor(Math.sqrt(massSize / 700))));
  }
  if (profile === "huge-mass") {
    return Math.max(2, Math.min(5, 2 + Math.floor(Math.sqrt(massSize / 1200))));
  }
  if (profile === "pangea") {
    return Math.max(3, Math.min(8, 3 + Math.floor(Math.sqrt(massSize / 6e3))));
  }
  return Math.max(2, Math.min(4, 2 + Math.floor(Math.sqrt(massSize / 2500))));
}
function riverProximityMaxRounds(massSize, profile = "normal") {
  const base = Math.max(16, Math.min(48, 12 + Math.floor(massSize / 350)));
  if (profile === "normal") return Math.min(52, base + 6);
  if (profile === "large-map") {
    return Math.max(6, Math.min(14, 6 + Math.floor(massSize / 1200)));
  }
  if (profile === "huge-mass") {
    return Math.max(6, Math.min(12, 6 + Math.floor(massSize / 2e3)));
  }
  return Math.max(3, Math.min(6, 3 + Math.floor(massSize / 4e3)));
}
function effectiveTopUpPasses(basePasses, perf) {
  if (perf.pangeaSingleMass) return Math.max(3, Math.min(basePasses, 8));
  if (perf.largeMapPerf) return Math.max(2, Math.min(basePasses, 6));
  return basePasses;
}
function effectiveFeederPasses(basePasses, perf) {
  if (perf.pangeaSingleMass) return Math.min(2, basePasses);
  if (perf.largeMapPerf) return Math.min(3, basePasses);
  return basePasses;
}
function riverAggressivePerf(perf) {
  return perf.pangeaSingleMass || perf.largeMapPerf;
}
function pangeaBootstrapMaxConsecutiveFails(areaScale) {
  return Math.max(10, Math.min(40, Math.round(10 + areaScale * 6)));
}
function pangeaBootstrapMouthMinSep(width, height) {
  const areaScale = riverMapAreaScale(width, height);
  if (areaScale >= 3.5) return 5;
  if (areaScale >= 2) return 6;
  return 8;
}
function pangeaCoastRiverGrowthCap(baseMaxLen, minDim) {
  return Math.min(
    Math.floor(minDim * 0.62),
    Math.max(baseMaxLen, Math.round(baseMaxLen * 1.85))
  );
}
function riverGridCellAvgSeaDist(cells, seaDist) {
  if (cells.length === 0) return 0;
  let s = 0;
  for (const [q, r] of cells) s += seaDist.get(hexKey(q, r)) ?? 0;
  return s / cells.length;
}
function ensurePangeaInteriorMainRivers(hexes, massSet, seaDist, gridCtx, riverParams, baseMaxLen, onAttempt) {
  const interiorMinSea = Math.max(18, Math.round(riverParams.minDim * 0.14));
  const cellSize = riverParams.mainCell;
  const minLand = minLandHexesForRiverCell(cellSize);
  const growthCap = pangeaCoastRiverGrowthCap(baseMaxLen, riverParams.minDim);
  const cellList = [...landHexesByCoverageCell(massSet, cellSize).values()].filter((land) => land.length >= minLand).filter((land) => !cellHasRiverHex(land, hexes)).filter((land) => riverGridCellAvgSeaDist(land, seaDist) >= interiorMinSea).sort((a, b) => riverGridCellAvgSeaDist(b, seaDist) - riverGridCellAvgSeaDist(a, seaDist));
  const maxCells = Math.max(28, Math.min(160, Math.round(cellList.length * 0.42)));
  let placed = 0;
  for (const land of cellList.slice(0, maxCells)) {
    onAttempt?.();
    const ranked = land.filter(([q, r]) => !gridCtx.usedSources.has(hexKey(q, r))).map(([q, r]) => {
      const h = hexes[hexKey(q, r)];
      const d = seaDist.get(hexKey(q, r)) ?? 0;
      let score = d + gridCtx.rand() * 3;
      if (h && isReliefRiverSource(h.terenBazowy)) score += 24;
      else if (h && isRiverLandTerrain(h.terenBazowy)) score += 8;
      return { q, r, d, score };
    }).filter((c) => c.d >= interiorMinSea && isRiverLandTerrain(hexes[hexKey(c.q, c.r)]?.terenBazowy ?? "morze" /* Morze */)).sort((a, b) => b.score - a.score);
    for (const c of ranked.slice(0, 10)) {
      const traceMax = Math.min(
        growthCap + Math.ceil(c.d * 0.35),
        Math.floor(riverParams.minDim * 0.72)
      );
      const path = traceRiver(hexes, c.q, c.r, traceMax, {
        seaDist: gridCtx.seaDist,
        openOceanDist: gridCtx.openOceanDist,
        oceanConnected: gridCtx.oceanConnected,
        mapWidth: gridCtx.width,
        mapHeight: gridCtx.height,
        rand: gridCtx.rand,
        minLen: Math.max(3, gridCtx.traceMinLen - 1),
        blockRiverKeys: gridCtx.mainKeysCache,
        minPathSep: MAIN_RIVER_MIN_PATH_SEP,
        riverSepIndex: gridCtx.riverSepIndex,
        landCentroid: gridCtx.massCentroid ?? null,
        landCenterSquare: gridCtx.massCenterSquare ?? null,
        allowReliefTraversal: true,
        ...gridCtx.traceOptsBase
      });
      if (path.length < gridCtx.traceMinLen) continue;
      if (gridCtx.pushMain(path, c.q, c.r)) {
        placed++;
        if (gridCtx.mainKeysCache) addPathKeysToSet(path, gridCtx.mainKeysCache);
        break;
      }
    }
  }
  return placed;
}
function addPathKeysToSet(path, keys) {
  for (const p of path) keys.add(hexKey(p.q, p.r));
}
function dryPatchEnforceMaxRounds(profile) {
  if (profile === "pangea") return 4;
  if (profile === "huge-mass") return 6;
  if (profile === "large-map") return 8;
  return 28;
}
function proximityMopRounds(profile) {
  if (profile === "pangea") return 1;
  if (profile === "huge-mass") return 1;
  if (profile === "large-map") return 3;
  return 8;
}
function cellEligibleForRiverPlacement(land, seaDist, minInland = 2) {
  return land.some(([q, r]) => (seaDist.get(hexKey(q, r)) ?? 0) >= minInland);
}
function isRiverProximityWalkTerrain(t) {
  return isRiverLandTerrain(t) || t === "wybrzeze" /* Wybrzeze */;
}
function computeRiverProximityStats(massSet, hexes, allowReliefTraversal = true) {
  const riverKeys = /* @__PURE__ */ new Set();
  for (const k of massSet) {
    if (hexes[k]?.rzeka?.obecna) riverKeys.add(k);
  }
  if (riverKeys.size === 0) return { maxDist: 999, farthest: null };
  const distToRiver = /* @__PURE__ */ new Map();
  const queue = [];
  for (const k of riverKeys) {
    distToRiver.set(k, 0);
    queue.push(k);
  }
  let qi = 0;
  while (qi < queue.length) {
    const k = queue[qi++];
    const d = distToRiver.get(k);
    const { q, r } = parseHexKey(k);
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nk = hexKey(q + dq, r + dr);
      if (distToRiver.has(nk)) continue;
      if (!massSet.has(nk)) continue;
      const nh = hexes[nk];
      if (!nh || !isRiverProximityWalkTerrain(nh.terenBazowy)) continue;
      if (!allowReliefTraversal && isReliefTerrain(nh.terenBazowy)) continue;
      distToRiver.set(nk, d + 1);
      queue.push(nk);
    }
  }
  let maxD = 0;
  let farthest = null;
  for (const k of massSet) {
    const h = hexes[k];
    if (!h || !isRiverProximityWalkTerrain(h.terenBazowy)) continue;
    if (isReliefTerrain(h.terenBazowy)) continue;
    const dist = distToRiver.get(k);
    if (dist == null) continue;
    const { q, r } = parseHexKey(k);
    const effective = dist === 0 && riverKeys.has(k) ? 1 : dist;
    if (effective > maxD) {
      maxD = effective;
      farthest = { q, r, dist: effective };
    }
  }
  return { maxDist: maxD, farthest };
}
function trySubdivideDryPatch(ctx, component, massSet) {
  if (RIVER_PROFILE_ON) rpEnsure().forceFillCalls++;
  const step = Math.max(3, Math.floor(Math.sqrt(component.length) / 2));
  const ranked = component.map(([q, r]) => ({ q, r, d: ctx.seaDist.get(hexKey(q, r)) ?? 0 })).sort((a, b) => b.d - a.d);
  for (let i = 0; i < ranked.length; i += step) {
    const c = ranked[i];
    if (tryForceCellRiverConnection(ctx, [[c.q, c.r]], massSet)) return true;
    if (tryPlaceGridSource(ctx, c.q, c.r, massSet)) return true;
  }
  return false;
}
function expandRiverSourceCandidates(land, massSet, radius = 2) {
  const out = /* @__PURE__ */ new Map();
  for (const [q, r] of land) {
    out.set(hexKey(q, r), [q, r]);
    for (let step = 1; step <= radius; step++) {
      for (const [dq, dr] of HEX_DIRECTIONS) {
        const nq = q + dq * step;
        const nr = r + dr * step;
        const k = hexKey(nq, nr);
        if (!massSet.has(k)) continue;
        out.set(k, [nq, nr]);
      }
    }
  }
  return [...out.values()];
}
function bfsNearestRiverHexOnLowland(hexes, sq, sr, riverKeys, massSet, maxDist, allowReliefTraversal = false) {
  const startK = hexKey(sq, sr);
  const queue = [[sq, sr, 0]];
  const visited = /* @__PURE__ */ new Set([startK]);
  while (queue.length > 0) {
    const [q, r, d] = queue.shift();
    const k = hexKey(q, r);
    if (riverKeys.has(k) && d > 0) return { q, r, dist: d };
    if (d >= maxDist) continue;
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nq = q + dq;
      const nr = r + dr;
      const nk = hexKey(nq, nr);
      if (visited.has(nk) || !massSet.has(nk)) continue;
      const nh = hexes[nk];
      if (!nh) continue;
      const walkable = isRiverLandTerrain(nh.terenBazowy) || allowReliefTraversal && nh.terenBazowy === "wybrzeze" /* Wybrzeze */;
      if (!walkable) continue;
      if (!allowReliefTraversal && isReliefTerrain(nh.terenBazowy)) continue;
      visited.add(nk);
      queue.push([nq, nr, d + 1]);
    }
  }
  return null;
}
function bfsLowlandRiverPath(hexes, sq, sr, tq, tr, massSet, maxLen, allowReliefTraversal = false) {
  const startK = hexKey(sq, sr);
  const targetK = hexKey(tq, tr);
  if (startK === targetK) return [{ q: sq, r: sr }];
  const cameFrom = /* @__PURE__ */ new Map();
  const queue = [startK];
  const visited = /* @__PURE__ */ new Set([startK]);
  while (queue.length > 0) {
    const current = queue.shift();
    if (current === targetK) {
      const path = [];
      let cur = current;
      while (cur) {
        const { q: q2, r: r2 } = parseHexKey(cur);
        path.push({ q: q2, r: r2 });
        cur = cameFrom.get(cur);
      }
      path.reverse();
      return path.length <= maxLen ? path : path.slice(0, maxLen);
    }
    if (visited.size > maxLen + 4) break;
    const { q, r } = parseHexKey(current);
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nk = hexKey(q + dq, r + dr);
      if (visited.has(nk) || !massSet.has(nk)) continue;
      const nh = hexes[nk];
      if (!nh || !isRiverLandTerrain(nh.terenBazowy)) continue;
      if (!allowReliefTraversal && isReliefTerrain(nh.terenBazowy) && nk !== targetK) continue;
      visited.add(nk);
      cameFrom.set(nk, current);
      queue.push(nk);
    }
  }
  return [];
}
function tryForceCellRiverConnection(ctx, land, massSet) {
  if (RIVER_PROFILE_ON) rpEnsure().forceFillCalls++;
  const riverKeys = new Set(
    [...collectRiverPathHexKeys(ctx.riverPaths)].filter((k) => massSet.has(k))
  );
  if (riverKeys.size === 0) return false;
  const lowland = land.filter(([q, r]) => {
    const k = hexKey(q, r);
    if (ctx.usedSources.has(k)) return false;
    const h = ctx.hexes[k];
    return h && isDryLandWithoutRiver(h);
  }).map(([q, r]) => ({
    q,
    r,
    d: ctx.seaDist.get(hexKey(q, r)) ?? 0,
    tie: ctx.rand()
  })).sort((a, b) => b.d - a.d || a.tie - b.tie);
  let bestSrc = null;
  let bestTarget = null;
  let bestDist = Infinity;
  const allowRelief = ctx.allowReliefTraversal ?? true;
  for (const c of lowland.slice(0, 16)) {
    const near = bfsNearestRiverHexOnLowland(
      ctx.hexes,
      c.q,
      c.r,
      riverKeys,
      massSet,
      Math.max(80, ctx.maxLen + 24),
      allowRelief
    );
    if (!near || near.dist >= bestDist) continue;
    bestDist = near.dist;
    bestSrc = [c.q, c.r];
    bestTarget = [near.q, near.r];
  }
  const maxBfsDist = Math.max(100, Math.ceil(Math.sqrt(land.length) * 4) + 16);
  if (!bestSrc || !bestTarget || bestDist > maxBfsDist) return false;
  const [sq, sr] = bestSrc;
  const [tq, tr] = bestTarget;
  const srcKey = hexKey(sq, sr);
  const traceBudget = Math.max(ctx.maxLen, Math.ceil(bestDist * 1.5) + 12);
  let path = aStarRiverToTarget(ctx.hexes, sq, sr, tq, tr, traceBudget, srcKey, allowRelief);
  if (path.length < 3) {
    path = bfsLowlandRiverPath(ctx.hexes, sq, sr, tq, tr, massSet, traceBudget, allowRelief);
  }
  if (path.length < 3) return false;
  const forceCtx = { ...ctx, acceptLen: 3, sourceSep: 0, allowReliefTraversal: allowRelief };
  const reached = buildOceanReachableRiverHexKeys(
    ctx.hexes,
    ctx.riverPaths,
    ctx.riverKinds,
    ctx.width,
    ctx.height,
    ctx.oceanConnected
  );
  if (tributaryTouchesOceanReachable(path, reached) && forceCtx.pushMedium?.(path, sq, sr)) return true;
  if (forceCtx.pushShort?.(path, sq, sr)) return true;
  if (forceCtx.pushTributary(path, sq, sr)) return true;
  const startSeaDist = ctx.seaDist.get(srcKey) ?? 0;
  const traceMax = riverTraceBudgetForSeaDist(startSeaDist, ctx.minLen, ctx.maxLen, ctx.largeMapPerf);
  const seaPath = traceRiverForGridFill(
    ctx.hexes,
    sq,
    sr,
    traceMax,
    ctx.minLen,
    3,
    {
      seaDist: ctx.seaDist,
      openOceanDist: ctx.openOceanDist,
      oceanConnected: ctx.oceanConnected,
      mapWidth: ctx.width,
      mapHeight: ctx.height,
      rand: ctx.rand,
      ...ctx.traceOptsBase,
      allowReliefTraversal: allowRelief,
      relaxSeaBuffer: true
    },
    true
  );
  if (seaPath.length >= 3 && forceCtx.pushMain?.(seaPath, sq, sr)) return true;
  if (seaPath.length >= 3 && pathHasValidRiverOutlet(ctx.hexes, seaPath, ctx.riverPaths, ctx.riverKinds, ctx.width, ctx.height) && forceCtx.pushMedium?.(seaPath, sq, sr)) return true;
  return false;
}
var MAX_DRY_LOWLAND_PATCH_HEXES = 25;
function isDryLandWithoutRiver(hex) {
  return !!hex && isRiverLandTerrain(hex.terenBazowy) && hex.rzeka?.obecna !== true;
}
function isDryLowlandPatchHex(hex) {
  return !!hex && isRiverLandTerrain(hex.terenBazowy) && !isReliefTerrain(hex.terenBazowy) && hex.rzeka?.obecna !== true;
}
function maxDryLowlandPatchSize(massLandKeys, hexes) {
  const massSet = massLandKeys instanceof Set ? massLandKeys : new Set(massLandKeys);
  const visited = /* @__PURE__ */ new Set();
  let maxSize = 0;
  for (const k of massSet) {
    if (visited.has(k) || !isDryLowlandPatchHex(hexes[k])) continue;
    const queue = [k];
    visited.add(k);
    let size = 0;
    while (queue.length > 0) {
      const cur = queue.shift();
      size++;
      const { q, r } = parseHexKey(cur);
      for (const [dq, dr] of HEX_DIRECTIONS) {
        const nk = hexKey(q + dq, r + dr);
        if (!massSet.has(nk) || visited.has(nk) || !isDryLowlandPatchHex(hexes[nk])) continue;
        visited.add(nk);
        queue.push(nk);
      }
    }
    if (size > maxSize) maxSize = size;
  }
  return maxSize;
}
function tryDrainDryPatchFromRelief(ctx, component, massSet) {
  const compSet = new Set(component.map(([q, r]) => hexKey(q, r)));
  const reliefCandidates = [];
  for (const [q, r] of component) {
    const k = hexKey(q, r);
    const h = ctx.hexes[k];
    if (h && isReliefRiverSource(h.terenBazowy) && !ctx.usedSources.has(k)) {
      const d = ctx.seaDist.get(k) ?? 0;
      reliefCandidates.push({ q, r, score: d + ctx.rand() * 2 });
    }
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nq = q + dq;
      const nr = r + dr;
      const nk = hexKey(nq, nr);
      if (!massSet.has(nk) || compSet.has(nk)) continue;
      const nh = ctx.hexes[nk];
      if (!nh || !isReliefRiverSource(nh.terenBazowy) || ctx.usedSources.has(nk)) continue;
      const d = ctx.seaDist.get(nk) ?? 0;
      reliefCandidates.push({ q: nq, r: nr, score: d + ctx.rand() * 2 });
    }
  }
  reliefCandidates.sort((a, b) => b.score - a.score);
  const traceOpts = {
    seaDist: ctx.seaDist,
    openOceanDist: ctx.openOceanDist,
    oceanConnected: ctx.oceanConnected,
    mapWidth: ctx.width,
    mapHeight: ctx.height,
    rand: ctx.rand,
    ...ctx.traceOptsBase,
    allowReliefTraversal: true,
    relaxSeaBuffer: true
  };
  for (const c of reliefCandidates.slice(0, 10)) {
    const startSeaDist = ctx.seaDist.get(hexKey(c.q, c.r)) ?? 0;
    const traceMax = riverTraceBudgetForSeaDist(startSeaDist, ctx.minLen, ctx.maxLen, ctx.largeMapPerf);
    const seaPath = traceRiverForGridFill(
      ctx.hexes,
      c.q,
      c.r,
      traceMax,
      ctx.minLen,
      3,
      traceOpts,
      true
    );
    if (seaPath.length >= 3 && ctx.pushMain(seaPath, c.q, c.r)) return true;
    if (seaPath.length >= 3 && ctx.pushMedium?.(seaPath, c.q, c.r)) return true;
  }
  const riverKeys = new Set(
    [...collectRiverPathHexKeys(ctx.riverPaths)].filter((k) => massSet.has(k))
  );
  if (riverKeys.size === 0) return false;
  for (const c of reliefCandidates.slice(0, 8)) {
    let bestJ = null;
    let bestD = Infinity;
    for (const jk of riverKeys) {
      const { q: jq, r: jr } = parseHexKey(jk);
      const d = hexAxialDistance(c.q, c.r, jq, jr);
      if (d < bestD) {
        bestD = d;
        bestJ = { q: jq, r: jr };
      }
    }
    if (!bestJ || bestD > ctx.maxLen) continue;
    const tribPath = traceTributary(
      ctx.hexes,
      c.q,
      c.r,
      bestJ.q,
      bestJ.r,
      ctx.maxLen,
      ctx.seaDist,
      ctx.rand,
      3
    );
    if (tribPath.length >= 3 && ctx.pushMedium?.(tribPath, c.q, c.r)) return true;
  }
  return false;
}
function tryForceRiverThroughDryPatch(ctx, component, massSet) {
  if (RIVER_PROFILE_ON) rpEnsure().forceFillCalls++;
  const forceCtx = {
    ...ctx,
    acceptLen: 3,
    sourceSep: 0,
    relaxSeaBuffer: true,
    allowReliefTraversal: true
  };
  const candidates = component.filter(([q, r]) => !ctx.usedSources.has(hexKey(q, r))).map(([q, r]) => ({
    q,
    r,
    d: ctx.seaDist.get(hexKey(q, r)) ?? 0,
    tie: ctx.rand()
  })).sort((a, b) => b.d - a.d || a.tie - b.tie);
  for (const c of candidates.slice(0, ctx.largeMapPerf ? 12 : 40)) {
    if (tryPlaceGridSource(forceCtx, c.q, c.r, massSet)) return true;
    const startSeaDist = ctx.seaDist.get(hexKey(c.q, c.r)) ?? 0;
    const traceMax = riverTraceBudgetForSeaDist(
      startSeaDist,
      ctx.minLen,
      ctx.maxLen,
      ctx.largeMapPerf
    );
    const seaPath = traceRiverForGridFill(
      ctx.hexes,
      c.q,
      c.r,
      traceMax,
      ctx.minLen,
      3,
      {
        seaDist: ctx.seaDist,
        openOceanDist: ctx.openOceanDist,
        oceanConnected: ctx.oceanConnected,
        mapWidth: ctx.width,
        mapHeight: ctx.height,
        rand: ctx.rand,
        ...ctx.traceOptsBase,
        allowReliefTraversal: true,
        relaxSeaBuffer: true
      },
      true
    );
    if (seaPath.length >= 3 && ctx.pushMedium?.(seaPath, c.q, c.r)) return true;
    if (seaPath.length >= 3 && ctx.pushShort?.(seaPath, c.q, c.r)) return true;
    if (seaPath.length >= 3 && ctx.pushTributary(seaPath, c.q, c.r)) return true;
  }
  return false;
}
function fillDryLowlandPatches(massSet, gridCtx, minPatchSize, maxPasses, processAllOversized = false) {
  let placed = 0;
  for (let pass = 0; pass < maxPasses; pass++) {
    let passPlaced = 0;
    const patches = [];
    const visited = /* @__PURE__ */ new Set();
    for (const k of massSet) {
      if (visited.has(k) || !isDryLandWithoutRiver(gridCtx.hexes[k])) continue;
      const component = [];
      const queue = [k];
      visited.add(k);
      while (queue.length > 0) {
        const cur = queue.shift();
        const { q, r } = parseHexKey(cur);
        component.push([q, r]);
        for (const [dq, dr] of HEX_DIRECTIONS) {
          const nk = hexKey(q + dq, r + dr);
          if (!massSet.has(nk) || visited.has(nk) || !isDryLandWithoutRiver(gridCtx.hexes[nk])) continue;
          visited.add(nk);
          queue.push(nk);
        }
      }
      if (component.length >= minPatchSize) patches.push({ land: component, size: component.length });
    }
    patches.sort((a, b) => b.size - a.size);
    const batchLimit = processAllOversized ? patches.length : Math.max(12, patches.filter((p) => p.size > MAX_DRY_LOWLAND_PATCH_HEXES).length);
    for (const { land, size } of patches.slice(0, batchLimit)) {
      if (cellHasRiverHex(land, gridCtx.hexes)) continue;
      const forceCtx = {
        ...gridCtx,
        acceptLen: 3,
        sourceSep: 0,
        relaxSeaBuffer: true,
        allowReliefTraversal: true
      };
      if (tryDrainDryPatchFromRelief(forceCtx, land, massSet)) {
        passPlaced++;
        placed++;
        continue;
      }
      if (tryForceCellRiverConnection(forceCtx, land, massSet)) {
        passPlaced++;
        placed++;
        continue;
      }
      if (size > MAX_DRY_LOWLAND_PATCH_HEXES && tryForceRiverThroughDryPatch(forceCtx, land, massSet)) {
        passPlaced++;
        placed++;
      }
    }
    if (passPlaced === 0) break;
  }
  return placed;
}
function enforceMaxDryLowlandPatches(massSet, gridCtx, roundProfile = "normal") {
  const maxHex = MAX_DRY_LOWLAND_PATCH_HEXES;
  fillDryLowlandPatches(massSet, gridCtx, 4, 10);
  if (maxDryLowlandPatchSize(massSet, gridCtx.hexes) <= maxHex) return;
  const maxRounds = dryPatchEnforceMaxRounds(roundProfile);
  for (let round = 0; round < maxRounds; round++) {
    if (maxDryLowlandPatchSize(massSet, gridCtx.hexes) <= maxHex) return;
    const n = fillDryLowlandPatches(massSet, gridCtx, maxHex + 1, 6, true);
    if (n > 0) continue;
    const oversized = findAllOversizedDryLandPatches(massSet, gridCtx.hexes, maxHex);
    if (oversized.length === 0) break;
    let anySuccess = false;
    for (const patch of oversized) {
      const forceCtx = {
        ...gridCtx,
        acceptLen: 3,
        sourceSep: 0,
        relaxSeaBuffer: true,
        allowReliefTraversal: true
      };
      if (tryForceCellRiverConnection(forceCtx, patch, massSet)) anySuccess = true;
      else if (tryForceRiverThroughDryPatch(forceCtx, patch, massSet)) anySuccess = true;
      else if (trySubdivideDryPatch(forceCtx, patch, massSet)) anySuccess = true;
    }
    if (!anySuccess) break;
  }
}
function findAllOversizedDryLandPatches(massSet, hexes, maxHex) {
  const visited = /* @__PURE__ */ new Set();
  const out = [];
  for (const k of massSet) {
    if (visited.has(k) || !isDryLowlandPatchHex(hexes[k])) continue;
    const component = [];
    const queue = [k];
    visited.add(k);
    while (queue.length > 0) {
      const cur = queue.shift();
      const { q, r } = parseHexKey(cur);
      component.push([q, r]);
      for (const [dq, dr] of HEX_DIRECTIONS) {
        const nk = hexKey(q + dq, r + dr);
        if (!massSet.has(nk) || visited.has(nk) || !isDryLowlandPatchHex(hexes[nk])) continue;
        visited.add(nk);
        queue.push(nk);
      }
    }
    if (component.length > maxHex) out.push(component);
  }
  out.sort((a, b) => b.length - a.length);
  return out;
}
function findLargestDryLowlandPatch(massSet, hexes) {
  const visited = /* @__PURE__ */ new Set();
  let best = null;
  for (const k of massSet) {
    if (visited.has(k) || !isDryLowlandPatchHex(hexes[k])) continue;
    const component = [];
    const queue = [k];
    visited.add(k);
    while (queue.length > 0) {
      const cur = queue.shift();
      const { q, r } = parseHexKey(cur);
      component.push([q, r]);
      for (const [dq, dr] of HEX_DIRECTIONS) {
        const nk = hexKey(q + dq, r + dr);
        if (!massSet.has(nk) || visited.has(nk) || !isDryLowlandPatchHex(hexes[nk])) continue;
        visited.add(nk);
        queue.push(nk);
      }
    }
    if (!best || component.length > best.length) best = component;
  }
  return best;
}
function listUnfilledRiverGridCells(massSet, hexes, cellSize, seaDist, minInland = 2) {
  const minLand = minLandHexesForRiverCell(cellSize);
  const cellAvgSeaDist = (cells) => {
    let s = 0;
    for (const [q, r] of cells) s += seaDist.get(hexKey(q, r)) ?? 0;
    return cells.length > 0 ? s / cells.length : 0;
  };
  return [...landHexesByCoverageCell(massSet, cellSize).values()].filter((land) => land.length >= minLand).filter((land) => cellEligibleForRiverPlacement(land, seaDist, minInland)).filter((land) => !cellHasRiverHex(land, hexes)).sort((a, b) => cellAvgSeaDist(b) - cellAvgSeaDist(a));
}
function ensureRiverGridAndProximity(hexes, massSet, cellSize, seaDist, gridCtx, maxProximityDist = RIVER_PROXIMITY_MAX_DIST, roundProfile = "normal") {
  const maxRounds = riverProximityMaxRounds(massSet.size, roundProfile);
  const forceCtx = {
    ...gridCtx,
    acceptLen: 3,
    sourceSep: 0,
    relaxSeaBuffer: true,
    allowReliefTraversal: true,
    placeMode: gridCtx.placeMode ?? "medium"
  };
  let placed = 0;
  for (let round = 0; round < maxRounds; round++) {
    const proxStats = computeRiverProximityStats(massSet, hexes, true);
    const proxGap = proxStats.maxDist;
    const dryGapEarly = maxDryLowlandPatchSize(massSet, hexes);
    const unfilledEarly = listUnfilledRiverGridCells(massSet, hexes, cellSize, seaDist);
    if (proxGap <= maxProximityDist && dryGapEarly <= MAX_DRY_LOWLAND_PATCH_HEXES + 5 && unfilledEarly.length === 0) break;
    let roundPlaced = 0;
    const unfilled = unfilledEarly;
    for (const land of unfilled) {
      if (cellHasRiverHex(land, hexes)) continue;
      if (tryForceCellRiverConnection(forceCtx, land, massSet)) {
        roundPlaced++;
        continue;
      }
      if (tryForceRiverThroughDryPatch(forceCtx, land, massSet)) {
        roundPlaced++;
        continue;
      }
      for (const [q, r] of land.slice(0, 10)) {
        if (tryPlaceGridSource(forceCtx, q, r, massSet)) {
          roundPlaced++;
          break;
        }
      }
    }
    if (roundPlaced === 0 && proxGap > maxProximityDist) {
      const far = proxStats.farthest;
      if (far && far.dist > maxProximityDist) {
        if (tryForceCellRiverConnection(forceCtx, [[far.q, far.r]], massSet)) roundPlaced++;
        else if (tryPlaceGridSource(forceCtx, far.q, far.r, massSet)) roundPlaced++;
      }
      const dry = findLargestDryLowlandPatch(massSet, hexes);
      if (roundPlaced === 0 && dry && dry.length >= 4) {
        if (tryForceCellRiverConnection(forceCtx, dry, massSet)) roundPlaced++;
        else if (tryForceRiverThroughDryPatch(forceCtx, dry, massSet)) roundPlaced++;
        else if (dry.length > MAX_DRY_LOWLAND_PATCH_HEXES && trySubdivideDryPatch(forceCtx, dry, massSet)) {
          roundPlaced++;
        }
      }
    }
    if (maxDryLowlandPatchSize(massSet, hexes) > MAX_DRY_LOWLAND_PATCH_HEXES) {
      enforceMaxDryLowlandPatches(massSet, forceCtx, roundProfile);
    }
    placed += roundPlaced;
    const dryGap = maxDryLowlandPatchSize(massSet, hexes);
    if (roundPlaced === 0 && unfilled.length === 0 && proxGap <= maxProximityDist && dryGap <= MAX_DRY_LOWLAND_PATCH_HEXES + 5) break;
  }
  const mopRounds = proximityMopRounds(roundProfile);
  for (let mop = 0; mop < mopRounds; mop++) {
    const finalProx = computeRiverProximityStats(massSet, hexes, true);
    if (finalProx.maxDist <= maxProximityDist) break;
    if (!finalProx.farthest) break;
    const far = finalProx.farthest;
    let fixed = false;
    if (tryForceCellRiverConnection(forceCtx, [[far.q, far.r]], massSet)) fixed = true;
    else if (tryPlaceGridSource(forceCtx, far.q, far.r, massSet)) fixed = true;
    else if (tryForceRiverThroughDryPatch(forceCtx, [[far.q, far.r]], massSet)) fixed = true;
    if (fixed) placed++;
    else break;
  }
  return placed;
}
function bootstrapMainRiversFromCoast(massSet, seaDist, gridCtx, maxRivers, onAttempt, softAcceptLen) {
  let placed = 0;
  const targetLen = gridCtx.minLen;
  const acceptThreshold = softAcceptLen != null && softAcceptLen < targetLen ? softAcceptLen : targetLen;
  const land = [];
  for (const k of massSet) {
    const { q, r } = parseHexKey(k);
    land.push([q, r]);
  }
  const mouths = collectCoastMouthCandidates(land, gridCtx.hexes, seaDist, 2);
  mouths.sort((a, b) => a.d - b.d || gridCtx.rand() * 2 - 1);
  const minSep = pangeaBootstrapMouthMinSep(gridCtx.width, gridCtx.height);
  const unlimited = !Number.isFinite(maxRivers);
  const mouthPoolCap = unlimited ? mouths.length : maxRivers + 12;
  const picked = [];
  for (const m of mouths) {
    if (picked.length >= mouthPoolCap) break;
    if (picked.every((p) => hexDistanceAxial(p.q, p.r, m.q, m.r) >= minSep)) picked.push(m);
  }
  const candidates = picked.length > 0 ? picked : mouths.slice(0, Math.max(1, mouthPoolCap));
  let mainKeys = gridCtx.mainKeysCache ?? collectPathHexKeysForKinds(gridCtx.riverPaths, gridCtx.riverKinds, ["main"]);
  let consecutiveFails = 0;
  const maxConsecutiveFails = unlimited ? Math.max(candidates.length, 1) : pangeaBootstrapMaxConsecutiveFails(
    riverMapAreaScale(gridCtx.width, gridCtx.height)
  );
  const pangeaGrowthCap = pangeaCoastRiverGrowthCap(
    gridCtx.maxLen,
    Math.min(gridCtx.width, gridCtx.height)
  );
  for (const mouth of candidates) {
    if (placed >= maxRivers) break;
    if (consecutiveFails >= maxConsecutiveFails) break;
    onAttempt?.();
    const traceMax = riverTraceBudgetForSeaDist(
      mouth.d,
      targetLen,
      pangeaGrowthCap,
      gridCtx.largeMapPerf
    );
    const path = traceRiverFromCoast(
      gridCtx.hexes,
      mouth.q,
      mouth.r,
      traceMax,
      {
        seaDist: gridCtx.seaDist,
        openOceanDist: gridCtx.openOceanDist,
        oceanConnected: gridCtx.oceanConnected,
        mapWidth: gridCtx.width,
        mapHeight: gridCtx.height,
        rand: gridCtx.rand,
        minLen: targetLen,
        blockRiverKeys: mainKeys,
        minPathSep: MAIN_RIVER_MIN_PATH_SEP,
        riverSepIndex: gridCtx.riverSepIndex,
        landCentroid: gridCtx.massCentroid ?? null,
        landCenterSquare: gridCtx.massCenterSquare ?? null,
        ...gridCtx.traceOptsBase,
        allowReliefTraversal: gridCtx.allowReliefTraversal
      }
    );
    if (path.length < acceptThreshold) {
      consecutiveFails++;
      continue;
    }
    if (isPathTooCloseToRiverHexes(path, mainKeys, MAIN_RIVER_MIN_PATH_SEP, gridCtx.riverSepIndex)) {
      consecutiveFails++;
      continue;
    }
    const sq = path[0].q;
    const sr = path[0].r;
    if (gridCtx.pushMain(path, sq, sr)) {
      placed++;
      consecutiveFails = 0;
      addPathKeysToSet(path, mainKeys);
    } else {
      consecutiveFails++;
    }
  }
  if (!landMassHasMainRiver([...massSet], gridCtx.riverPaths, gridCtx.riverKinds) && land.length > 0) {
    onAttempt?.();
    if (tryPlaceMainRiverFromCoast(gridCtx, land, massSet, mainKeys, softAcceptLen)) placed++;
  }
  return placed;
}
function generatePhase1MainRivers(hexes, massSet, seaDist, riverPaths, riverKinds, usedSources, gridCtx, maxLen, riverParams, riverPerf, onAttempt) {
  const ctx = { ...gridCtx, placeMode: "main-only" };
  if (riverPerf.pangeaSingleMass) {
    const landHexCount = massSet.size;
    const gridStride2 = riverParams.areaScale >= 3 ? 2 : 3;
    const maxRivers = Number.POSITIVE_INFINITY;
    let placed2 = bootstrapMainRiversFromCoast(massSet, seaDist, ctx, maxRivers, onAttempt);
    const tryCoastNoop = (_sq, _sr) => false;
    placed2 += ensureMassRiverGridCoverage(
      hexes,
      massSet,
      riverParams.mainCell,
      seaDist,
      riverPaths,
      riverKinds,
      usedSources,
      tryCoastNoop,
      gridCtx.rand,
      maxLen,
      {
        sparseMainOnly: true,
        gridStride: gridStride2,
        reliefSourceBonus: 0,
        expandSourceRadius: 1,
        minInlandFromSea: 1,
        gridCtx: ctx,
        acceptLen: gridCtx.minLen,
        maxCellsToProcess: Number.POSITIVE_INFINITY,
        skipHeavyFallback: false,
        coastOnlyMain: false
      }
    );
    placed2 += topUpMainRiverCoastMouthGaps(
      massSet,
      seaDist,
      ctx,
      mainRiverCoastMouthMaxGapForDims(gridCtx.width, gridCtx.height),
      2
    );
    placed2 += ensurePangeaInteriorMainRivers(
      hexes,
      massSet,
      seaDist,
      ctx,
      riverParams,
      maxLen,
      onAttempt
    );
    return placed2;
  }
  const gridStride = riverPerf.largeMapPerf ? Math.max(2, riverParams.mainGridStride) : riverParams.mainGridStride;
  const cellList = [...landHexesByCoverageCell(massSet, riverParams.mainCell).values()].filter((land) => land.length >= minLandHexesForRiverCell(riverParams.mainCell)).filter((land) => isSparseMainCoverageCell(land, riverParams.mainCell, gridStride)).filter((land) => cellEligibleForRiverPlacement(land, seaDist, 1));
  let placed = 0;
  let cellIdx = 0;
  const softLen = Math.max(3, gridCtx.traceMinLen);
  for (const land of cellList) {
    cellIdx++;
    onAttempt?.();
    if (tryPlaceMainRiverFromCoast(ctx, land, massSet) || tryPlaceMainRiverFromCoast(ctx, land, massSet, void 0, softLen)) {
      placed++;
    }
    if (cellIdx % 4 === 0) onAttempt?.();
  }
  if (!riverPerf.largeMapPerf) {
    placed += ensureMassRiverGridCoverage(
      hexes,
      massSet,
      riverParams.mainCell,
      seaDist,
      riverPaths,
      riverKinds,
      usedSources,
      () => false,
      gridCtx.rand,
      maxLen,
      {
        sparseMainOnly: true,
        gridStride,
        reliefSourceBonus: 0,
        expandSourceRadius: riverParams.expandSourceRadius,
        minInlandFromSea: 1,
        gridCtx: ctx,
        acceptLen: gridCtx.minLen,
        coastOnlyMain: true
      }
    );
  }
  if (!landMassHasMainRiver([...massSet], riverPaths, riverKinds)) {
    const minLand = minLandHexesForRiverCell(riverParams.mainCell);
    for (const land of landHexesByCoverageCell(massSet, riverParams.mainCell).values()) {
      if (land.length < minLand) continue;
      onAttempt?.();
      if (tryPlaceMainRiverFromCoast(ctx, land, massSet, void 0, softLen)) {
        placed++;
        break;
      }
      if (landMassHasMainRiver([...massSet], riverPaths, riverKinds)) break;
    }
  }
  placed += topUpMainRiverCoastMouthGaps(
    massSet,
    seaDist,
    ctx,
    mainRiverCoastMouthMaxGapForDims(gridCtx.width, gridCtx.height),
    2
  );
  return placed;
}
function generatePhase3ShortRivers(massSet, tributaryCell, seaDist, gridCtx, feederMinLen, feederSourceSep, feederPasses) {
  const mediumKeys = collectPathHexKeysForKinds(gridCtx.riverPaths, gridCtx.riverKinds, ["medium"]);
  if (mediumKeys.size === 0) return 0;
  let placed = 0;
  const ctx = {
    ...gridCtx,
    placeMode: "short",
    targetRiverKinds: ["medium"],
    acceptLen: feederMinLen,
    sourceSep: feederSourceSep
  };
  for (let pass = 0; pass < feederPasses; pass++) {
    let passPlaced = 0;
    const minLand = minLandHexesForRiverCell(tributaryCell);
    for (const land of landHexesByCoverageCell(massSet, tributaryCell).values()) {
      if (land.length < minLand) continue;
      const ranked = land.filter(([q, r]) => !gridCtx.usedSources.has(hexKey(q, r))).map(([q, r]) => ({
        q,
        r,
        riverD: nearestRiverHexDistance(q, r, mediumKeys),
        inland: seaDist.get(hexKey(q, r)) ?? 0
      })).filter((c) => c.riverD > 0 && c.riverD <= SHORT_RIVER_MAX_DIST_FROM_MEDIUM).sort((a, b) => a.riverD - b.riverD || b.inland - a.inland);
      for (const c of ranked.slice(0, 6)) {
        if (tryPlaceGridSource(ctx, c.q, c.r, massSet)) {
          passPlaced++;
          placed++;
          break;
        }
      }
    }
    if (passPlaced === 0) break;
  }
  return placed;
}
function ensureMassRiverGridCoverage(hexes, massSet, cellSize, seaDist, riverPaths, riverKinds, usedSources, tryPlace, rand, maxLen, opts = {}) {
  const minLand = minLandHexesForRiverCell(cellSize);
  const gridStride = opts.gridStride ?? MAIN_RIVER_GRID_STRIDE;
  const reliefBonus = opts.reliefSourceBonus ?? 0;
  const expandRadius = opts.expandSourceRadius ?? 2;
  const minInlandFromSea = opts.minInlandFromSea ?? RIVER_MIN_INLAND_FROM_SEA;
  const maxCells = opts.maxCellsToProcess ?? Infinity;
  const skipHeavy = opts.skipHeavyFallback ?? false;
  const coastOnlyMain = opts.coastOnlyMain === true;
  let placed = 0;
  const cellList = [...landHexesByCoverageCell(massSet, cellSize).values()].filter((land) => land.length >= minLand).filter((land) => !opts.sparseMainOnly || isSparseMainCoverageCell(land, cellSize, gridStride)).filter((land) => cellEligibleForRiverPlacement(land, seaDist, minInlandFromSea)).sort((a, b) => {
    const avg = (cells) => {
      let s = 0;
      for (const [q, r] of cells) s += seaDist.get(hexKey(q, r)) ?? 0;
      return s / cells.length;
    };
    return avg(a) - avg(b);
  });
  const cellSatisfied = (land) => {
    if (opts.requireRiverHex) return cellHasRiverHex(land, hexes);
    return cellHasMainRiverSource(land, riverPaths, riverKinds);
  };
  let mainKeysCache = opts.gridCtx ? collectPathHexKeysForKinds(riverPaths, riverKinds, ["main"]) : void 0;
  let cellsProcessed = 0;
  for (const land of cellList) {
    if (cellsProcessed >= maxCells) break;
    cellsProcessed++;
    if (cellSatisfied(land)) continue;
    if (opts.sparseMainOnly && opts.gridCtx) {
      const acceptLen = opts.acceptLen ?? opts.gridCtx.minLen;
      if (tryPlaceMainRiverFromCoast(opts.gridCtx, land, massSet, mainKeysCache, acceptLen < opts.gridCtx.minLen ? acceptLen : void 0)) {
        placed++;
        continue;
      }
      if (coastOnlyMain) {
        const soft = Math.max(3, typeof acceptLen === "number" ? acceptLen : 3);
        if (tryPlaceMainRiverFromCoast(opts.gridCtx, land, massSet, mainKeysCache, soft)) {
          placed++;
        }
        continue;
      }
    }
    if (coastOnlyMain) continue;
    const ranked = land.filter(([q, r]) => !usedSources.has(hexKey(q, r))).map(([q, r]) => {
      const h = hexes[hexKey(q, r)];
      const d = seaDist.get(hexKey(q, r)) ?? 0;
      let score = d + rand() * 4;
      if (reliefBonus > 0 && h && isReliefRiverSource(h.terenBazowy)) score += reliefBonus;
      else if (h && isRiverLandTerrain(h.terenBazowy)) score += 12;
      return { q, r, d, score };
    }).filter((c) => c.d >= minInlandFromSea).sort((a, b) => b.score - a.score);
    const rankedLimit = skipHeavy ? 3 : ranked.length;
    let ok = false;
    for (const c of ranked.slice(0, rankedLimit)) {
      if (tryPlace(c.q, c.r)) {
        placed++;
        ok = true;
        break;
      }
    }
    if (ok || cellSatisfied(land)) continue;
    if (skipHeavy) continue;
    const expanded = expandRiverSourceCandidates(land, massSet, expandRadius);
    for (const [q, r] of expanded) {
      if (tryPlace(q, r)) {
        placed++;
        break;
      }
    }
    if (cellSatisfied(land)) continue;
    const fallbackRanked = land.filter(([q, r]) => !usedSources.has(hexKey(q, r))).filter(([q, r]) => (seaDist.get(hexKey(q, r)) ?? 0) >= minInlandFromSea).slice(0, 6);
    for (const [q, r] of fallbackRanked.length > 0 ? fallbackRanked : land.slice(0, 4)) {
      if (tryPlace(q, r)) {
        placed++;
        break;
      }
    }
  }
  return placed;
}
function generateRivers(hexes, width, height, rand, opts = {}) {
  const _genT0 = RIVER_PROFILE_ON ? rpNow() : 0;
  const mainOnly = isRiverGenMainOnly();
  const riversTier = opts.riversTier ?? "medium";
  const riverParams = opts.riverParams ?? resolveRiverMapParams(riversTier, width, height);
  const minLen = opts.minLen ?? riverParams.minLen;
  const maxLen = opts.maxLen ?? riverParams.maxLen;
  const { seaDist, oceanConnected, openOceanDist } = buildRiverFieldCache(hexes, width, height);
  const riverPaths = [];
  const riverKinds = [];
  const usedSources = /* @__PURE__ */ new Set();
  const masses = groupLandMassKeys(hexes).filter((m) => m.length >= 5).sort((a, b) => b.length - a.length);
  const riverPerf = buildRiverPerfCtx(masses, riverParams.areaScale);
  const { pangeaSingleMass, largeMapPerf } = riverPerf;
  const cellSize = riverParams.mainCell;
  const tributaryCell = riverParams.tributaryCell;
  const gridTraceMinLen = riverParams.gridTraceMinLen;
  const feederMinLen = riverParams.feederMinLen;
  const minSourceSep = Math.max(2, Math.floor(cellSize * 0.25));
  const feederMinSourceSep = Math.max(2, Math.floor(tributaryCell * 0.35));
  const traceOptsBase = {
    hardMeanderLen: riverParams.hardMeanderLen,
    mouthTailLen: riverParams.mouthTailLen
  };
  const seaBufferOpts = {
    minInland: riverParams.minInlandFromSea,
    mouthTail: riverParams.mouthTailLen
  };
  const mainKeysCache = /* @__PURE__ */ new Set();
  const mainSepIndex = new RiverHexSpatialIndex();
  const pushMain = (path, sq, sr) => {
    if (isPathTooCloseToRiverHexes(path, mainKeysCache, MAIN_RIVER_MIN_PATH_SEP, mainSepIndex)) return false;
    const finalized = finalizeMainRiverPath(hexes, path, width, height, oceanConnected);
    if (!finalized) return false;
    riverPaths.push(finalized);
    riverKinds.push("main");
    usedSources.add(hexKey(sq, sr));
    markRiverPath(hexes, finalized);
    addPathKeysToSet(finalized, mainKeysCache);
    mainSepIndex.addPath(finalized);
    return true;
  };
  const pushTributary = (path, sq, sr) => {
    const out = finalizeTributaryPath(
      hexes,
      path,
      riverPaths,
      riverKinds,
      width,
      height,
      oceanConnected
    );
    if (!out) return false;
    riverPaths.push(out);
    riverKinds.push("tributary");
    usedSources.add(hexKey(sq, sr));
    markRiverPath(hexes, out);
    return true;
  };
  const pushMedium = (path, sq, sr) => {
    const out = finalizeMediumPath(
      hexes,
      path,
      riverPaths,
      riverKinds,
      width,
      height,
      oceanConnected
    );
    if (!out) return false;
    riverPaths.push(out);
    riverKinds.push("medium");
    usedSources.add(hexKey(sq, sr));
    markRiverPath(hexes, out);
    return true;
  };
  const pushShort = (path, sq, sr) => {
    const mediumKeys = collectPathHexKeysForKinds(riverPaths, riverKinds, ["medium"]);
    if (mediumKeys.size === 0) return false;
    if (nearestRiverHexDistance(sq, sr, mediumKeys) > SHORT_RIVER_MAX_DIST_FROM_MEDIUM) return false;
    const out = finalizeShortPath(
      hexes,
      path,
      riverPaths,
      riverKinds,
      width,
      height,
      oceanConnected
    );
    if (!out) return false;
    riverPaths.push(out);
    riverKinds.push("short");
    usedSources.add(hexKey(sq, sr));
    markRiverPath(hexes, out);
    return true;
  };
  const usedMediumSpawnKeys = /* @__PURE__ */ new Set();
  const gridCtx = {
    hexes,
    width,
    height,
    riverPaths,
    riverKinds,
    usedSources,
    seaDist,
    openOceanDist,
    oceanConnected,
    rand,
    minLen,
    maxLen,
    acceptLen: gridTraceMinLen,
    traceMinLen: gridTraceMinLen,
    sourceSep: minSourceSep,
    traceOptsBase,
    seaBufferOpts,
    pushMain,
    pushTributary,
    pushMedium,
    pushShort,
    pangeaSingleMass,
    largeMapPerf,
    mainKeysCache,
    riverSepIndex: mainSepIndex,
    usedMediumSpawnKeys
  };
  const report = (localPct) => {
    opts.onProgress?.(Math.max(0, Math.min(100, localPct)));
  };
  const nMasses = masses.length || 1;
  let stage2Steps = 0;
  let stage2Total = 0;
  for (const mass of masses) {
    stage2Total += massRiverCoveragePasses(mass.length, riverRoundProfile(mass.length, riverPerf));
  }
  stage2Total = Math.max(1, stage2Total);
  const _s1T0 = RIVER_PROFILE_ON ? rpNow() : 0;
  let stage1Attempts = 0;
  const stage1Budget = riverAggressivePerf(riverPerf) ? Math.max(24, Math.min(120, Math.floor((masses[0]?.length ?? 100) / 400))) : nMasses;
  for (let mi = 0; mi < masses.length; mi++) {
    const mass = masses[mi];
    const massSet = new Set(mass);
    setMassRiverTargets(hexes, massSet, gridCtx);
    generatePhase1MainRivers(
      hexes,
      massSet,
      seaDist,
      riverPaths,
      riverKinds,
      usedSources,
      gridCtx,
      maxLen,
      riverParams,
      riverPerf,
      () => {
        stage1Attempts++;
        if (riverAggressivePerf(riverPerf)) {
          report(stage1Attempts / stage1Budget * 28);
        }
      }
    );
    if (!riverAggressivePerf(riverPerf)) report((mi + 1) / nMasses * 28);
  }
  if (riverAggressivePerf(riverPerf)) report(28);
  if (RIVER_PROFILE_ON) rpEnsure().genStage1Ms += rpNow() - _s1T0;
  if (mainOnly) {
    report(100);
    if (RIVER_PROFILE_ON) rpEnsure().generateRiversMs += rpNow() - _genT0;
    return { paths: riverPaths, kinds: riverKinds };
  }
  const _s2T0 = RIVER_PROFILE_ON ? rpNow() : 0;
  const mediumCtx = { ...gridCtx, placeMode: "medium" };
  for (let mi = 0; mi < masses.length; mi++) {
    const mass = masses[mi];
    const massSet = new Set(mass);
    setMassRiverTargets(hexes, massSet, mediumCtx);
    generateMediumTributariesFromMainRivers(mediumCtx, massSet, maxLen);
    stage2Steps++;
    if (RIVER_PROFILE_ON) rpEnsure().genStage2Rounds++;
    report(28 + stage2Steps / stage2Total * 42);
  }
  if (RIVER_PROFILE_ON) rpEnsure().genStage2Ms += rpNow() - _s2T0;
  {
    const pruned = pruneInvalidMediumRiverPaths(
      hexes,
      riverPaths,
      riverKinds,
      width,
      height,
      oceanConnected
    );
    riverPaths.splice(0, riverPaths.length, ...pruned.paths);
    riverKinds.splice(0, riverKinds.length, ...pruned.kinds);
  }
  if (!isRiverGenFull()) {
    report(100);
    if (RIVER_PROFILE_ON) rpEnsure().generateRiversMs += rpNow() - _genT0;
    return { paths: riverPaths, kinds: riverKinds };
  }
  const _s3T0 = RIVER_PROFILE_ON ? rpNow() : 0;
  const feederPasses = effectiveFeederPasses(riverParams.feederPasses, riverPerf);
  if (feederPasses > 0) {
    for (let mi = 0; mi < masses.length; mi++) {
      const mass = masses[mi];
      generatePhase3ShortRivers(
        new Set(mass),
        tributaryCell,
        seaDist,
        gridCtx,
        feederMinLen,
        feederMinSourceSep,
        feederPasses
      );
      report(70 + (mi + 1) / nMasses * 18);
    }
  } else {
    report(88);
  }
  if (RIVER_PROFILE_ON) rpEnsure().genStage3Ms += rpNow() - _s3T0;
  const _decorT0 = RIVER_PROFILE_ON ? rpNow() : 0;
  if (!pangeaSingleMass && !largeMapPerf) {
    const pathCountBeforeDecor = riverPaths.length;
    for (let i = 0; i < pathCountBeforeDecor; i++) {
      if (riverKinds[i] !== "main") continue;
      const path = riverPaths[i];
      if (!path || path.length < 10) continue;
      addTributariesForMainRiver(
        hexes,
        path,
        seaDist,
        rand,
        maxLen,
        riverPaths,
        riverKinds,
        usedSources,
        minSourceSep,
        width,
        height,
        oceanConnected,
        riverParams.areaScale,
        riverParams.reliefSearchMin,
        riverParams.reliefSearchMax
      );
      if (i % 3 === 0) report(88 + i / Math.max(1, pathCountBeforeDecor) * 8);
    }
  } else {
    report(96);
  }
  if (RIVER_PROFILE_ON) rpEnsure().genDecorMs += rpNow() - _decorT0;
  const _genDryT0 = RIVER_PROFILE_ON ? rpNow() : 0;
  for (let mi = 0; mi < masses.length; mi++) {
    const mass = masses[mi];
    if (!mass) continue;
    const massSet = new Set(mass);
    const massProfile = riverRoundProfile(mass.length, riverPerf);
    enforceMaxDryLowlandPatches(massSet, gridCtx, massProfile);
    report(96 + (mi + 1) / nMasses * 4);
  }
  if (RIVER_PROFILE_ON) rpEnsure().genDryPatchMs += rpNow() - _genDryT0;
  report(100);
  syncRiverEdgeBonusHexes(hexes);
  if (RIVER_PROFILE_ON) rpEnsure().generateRiversMs += rpNow() - _genT0;
  return { paths: riverPaths, kinds: riverKinds };
}
function topUpRiverGridCoverage(hexes, width, height, riverPaths, riverKinds, rand, riversTier = "medium", minLen = 4, maxLen = 40, riverParams, onProgress) {
  const _topT0 = RIVER_PROFILE_ON ? rpNow() : 0;
  const params = riverParams ?? resolveRiverMapParams(riversTier, width, height);
  const masses = groupLandMassKeys(hexes).filter((m) => m.length >= 5).sort((a, b) => b.length - a.length);
  const riverPerf = buildRiverPerfCtx(masses, params.areaScale);
  const topUpPasses = effectiveTopUpPasses(params.topUpPasses, riverPerf);
  if (topUpPasses === 0) {
    onProgress?.(100);
    if (RIVER_PROFILE_ON) rpEnsure().topUpMs += rpNow() - _topT0;
    return 0;
  }
  const { seaDist, oceanConnected, openOceanDist } = buildRiverFieldCache(hexes, width, height);
  const usedSources = /* @__PURE__ */ new Set();
  for (let i = 0; i < riverPaths.length; i++) {
    const p0 = riverPaths[i]?.[0];
    if (p0) usedSources.add(hexKey(p0.q, p0.r));
  }
  const { pangeaSingleMass, largeMapPerf } = riverPerf;
  const cellSize = params.mainCell;
  const minSourceSep = Math.max(2, Math.floor(cellSize * 0.25));
  const traceOptsBase = {
    hardMeanderLen: params.hardMeanderLen,
    mouthTailLen: params.mouthTailLen
  };
  const seaBufferOpts = {
    minInland: params.minInlandFromSea,
    mouthTail: params.mouthTailLen
  };
  const mainKeysCache = /* @__PURE__ */ new Set();
  for (let i = 0; i < riverPaths.length; i++) {
    if (riverKinds[i] !== "main") continue;
    addPathKeysToSet(riverPaths[i] ?? [], mainKeysCache);
  }
  const topUpSepIndex = RiverHexSpatialIndex.fromKeys(mainKeysCache);
  const usedMediumSpawnKeys = /* @__PURE__ */ new Set();
  for (let i = 0; i < riverPaths.length; i++) {
    if (riverKinds[i] !== "medium") continue;
    const p0 = riverPaths[i]?.[0];
    if (p0 && mainKeysCache.has(hexKey(p0.q, p0.r))) {
      usedMediumSpawnKeys.add(hexKey(p0.q, p0.r));
    }
  }
  const pushMain = (path, sq, sr) => {
    const mainKeys = collectPathHexKeysForKinds(riverPaths, riverKinds, ["main"]);
    if (isPathTooCloseToRiverHexes(path, mainKeys, MAIN_RIVER_MIN_PATH_SEP, topUpSepIndex)) return false;
    const finalized = finalizeMainRiverPath(hexes, path, width, height, oceanConnected);
    if (!finalized) return false;
    riverPaths.push(finalized);
    riverKinds.push("main");
    usedSources.add(hexKey(sq, sr));
    markRiverPath(hexes, finalized);
    addPathKeysToSet(finalized, mainKeysCache);
    topUpSepIndex.addPath(finalized);
    return true;
  };
  const pushTributary = (path, sq, sr) => {
    const out = finalizeTributaryPath(
      hexes,
      path,
      riverPaths,
      riverKinds,
      width,
      height,
      oceanConnected
    );
    if (!out) return false;
    riverPaths.push(out);
    riverKinds.push("tributary");
    usedSources.add(hexKey(sq, sr));
    markRiverPath(hexes, out);
    return true;
  };
  const pushMedium = (path, sq, sr) => {
    const out = finalizeMediumPath(
      hexes,
      path,
      riverPaths,
      riverKinds,
      width,
      height,
      oceanConnected
    );
    if (!out) return false;
    riverPaths.push(out);
    riverKinds.push("medium");
    usedSources.add(hexKey(sq, sr));
    markRiverPath(hexes, out);
    return true;
  };
  const gridCtx = {
    hexes,
    width,
    height,
    riverPaths,
    riverKinds,
    usedSources,
    seaDist,
    openOceanDist,
    oceanConnected,
    rand,
    minLen: params.minLen,
    maxLen,
    acceptLen: params.gridTraceMinLen,
    traceMinLen: params.gridTraceMinLen,
    sourceSep: minSourceSep,
    traceOptsBase,
    seaBufferOpts,
    pushMain,
    pushTributary,
    pushMedium,
    placeMode: "medium",
    pangeaSingleMass,
    largeMapPerf,
    mainKeysCache,
    usedMediumSpawnKeys
  };
  let placed = 0;
  const totalSteps = Math.max(1, topUpPasses * masses.length);
  let step = 0;
  for (let pass = 0; pass < topUpPasses; pass++) {
    const _passT0 = RIVER_PROFILE_ON ? rpNow() : 0;
    let passPlaced = 0;
    const isLastPass = pass === topUpPasses - 1;
    for (const mass of masses) {
      const massSet = new Set(mass);
      setMassRiverTargets(hexes, massSet, gridCtx);
      const massProfile = riverRoundProfile(mass.length, riverPerf);
      if (massProfile === "normal" || pass === 0 || isLastPass) {
        const _hsT0 = RIVER_PROFILE_ON ? rpNow() : 0;
        passPlaced += generateMediumTributariesFromMainRivers(gridCtx, massSet, maxLen);
        if (RIVER_PROFILE_ON) rpEnsure().topUpHardStartsMs += rpNow() - _hsT0;
      }
      if (massProfile === "normal" || isLastPass) {
        const _dpT0 = RIVER_PROFILE_ON ? rpNow() : 0;
        enforceMaxDryLowlandPatches(massSet, gridCtx, massProfile);
        if (RIVER_PROFILE_ON) rpEnsure().topUpDryPatchMs += rpNow() - _dpT0;
        const _gpT0 = RIVER_PROFILE_ON ? rpNow() : 0;
        passPlaced += ensureRiverGridAndProximity(
          hexes,
          massSet,
          cellSize,
          seaDist,
          gridCtx,
          riverProximityEnforceTarget(cellSize),
          massProfile
        );
        if (RIVER_PROFILE_ON) rpEnsure().topUpGridProxMs += rpNow() - _gpT0;
      }
      step++;
      onProgress?.(Math.min(100, step / totalSteps * 100));
    }
    if (RIVER_PROFILE_ON) rpEnsure().topUpPassMs.push(rpNow() - _passT0);
    placed += passPlaced;
    if (passPlaced === 0) break;
  }
  onProgress?.(100);
  if (RIVER_PROFILE_ON) rpEnsure().topUpMs += rpNow() - _topT0;
  return placed;
}
var BASE_DEPOSIT_RULES = [
  {
    id: "miedz",
    nakladka: null,
    allowedOn: (h) => isDryLandTerrain(h.terenBazowy) && h.terenBazowy === "wzgorza" /* Wzgorza */,
    rarity: 0.1
  },
  {
    id: "zelazo",
    nakladka: null,
    allowedOn: (h) => isDryLandTerrain(h.terenBazowy) && h.terenBazowy === "gory" /* Gory */,
    rarity: 0.08
  },
  {
    id: "glina",
    nakladka: "zloze_gliny" /* ZlozeGliny */,
    // TEMAT 12 (2026-07-24, Maciej): glina TYLKO przy rzece — gałąź "Łąka bez rzeki" usunięta.
    // placeDeposits() jest teraz wołane PO generateRivers (generator.ts), więc h.rzeka.obecna
    // odzwierciedla finalny stan rzek, nie "zawsze false" jak dawniej.
    allowedOn: (h) => isDryLandTerrain(h.terenBazowy) && h.rzeka?.obecna === true,
    rarity: 0.3
  },
  {
    id: "konie",
    nakladka: "zloze_konia" /* ZlozeKonia */,
    allowedOn: (h) => isDryLandTerrain(h.terenBazowy) && h.terenBazowy === "rownina" /* Rownina */,
    rarity: 0.1
  },
  {
    id: "wegiel",
    nakladka: null,
    // brak w enumie Nakladka -> znacznik hex.zloze
    allowedOn: (h) => isDryLandTerrain(h.terenBazowy) && h.terenBazowy === "gory" /* Gory */,
    rarity: 0.1
  },
  // Model B (Maciej 2026-07-09): USUNIĘTE złoża owiec/bydła (ZlozeOwiec/ZlozeBydla) — hodowla to
  // teraz CZYSTE ulepszenie (Owczarnia/Pastwisko), budowane jak farma, nie surowiec na mapie.
  // Koń (wyżej) zostaje surowcem. Zmienia hash mapy (zamierzone).
  {
    id: "sol",
    nakladka: null,
    // C-MAP-SOL-ZIEMIA=B (Maciej 2026-07-25): sól na LĄDZIE najbliższym wybrzeża
    // (suchy ląd graniczący z płytkim morzem/Wybrzeżem), NIE na osobnym kaflu Wybrzeże.
    // Ta definicja działa też na mapie Ziemia (brak kafli Wybrzeże, ale jest ląd przy Morzu).
    // Koniunkcja: allowedOn (suchy ląd) + requiresCoastalLand (isCoastalLandHex w placeDeposits).
    allowedOn: (h) => isDryLandTerrain(h.terenBazowy),
    requiresCoastalLand: true,
    rarity: 0.12
  },
  {
    // Maciej 2026-07-25: złoto jako surowiec DOSTĘPOWY dla Mennicy — „wystarczy tylko
    // dostęp, nie trzeba budować wielu kopalni". Reguła terenowa: żyłowe w Górach/Wzgórzach
    // (Nubia, Anatolia, Iberia) — forma okruchowa (rzeki) świadomie pominięta (uproszczenie,
    // patrz RAPORT KOŃCOWY zloto-test.cjs). Rzadkość dużo niższa niż miedź (0.10) / żelazo
    // (0.08) — dobrana empirycznie w map-gen-params.json tak, by przy tym samym typie/rozmiarze
    // mapy złoto liczebnie wypadało rzadsze niż miedź (patrz zloto-test.cjs).
    id: "zloto",
    nakladka: null,
    allowedOn: (h) => isDryLandTerrain(h.terenBazowy) && (h.terenBazowy === "wzgorza" /* Wzgorza */ || h.terenBazowy === "gory" /* Gory */),
    rarity: 0.03
  }
];
var _depositRarities = mapGenAllDepositRarities();
var DEPOSIT_RULES = BASE_DEPOSIT_RULES.map((rule) => {
  const rarity = _depositRarities[rule.id];
  return typeof rarity === "number" ? { ...rule, rarity } : rule;
});
function placeDeposits(hexes, seed, rules = DEPOSIT_RULES, resourceMult = 1, baselineMult = 1) {
  const rand = mulberry32((seed ^ 2654435769) >>> 0);
  const keys = Object.keys(hexes).sort((a, b) => {
    const [aq, ar] = a.split(",").map(Number);
    const [bq, br] = b.split(",").map(Number);
    return aq !== bq ? aq - bq : ar - br;
  });
  const counts = {
    miedz: 0,
    zelazo: 0,
    glina: 0,
    konie: 0,
    wegiel: 0,
    owce: 0,
    bydlo: 0,
    sol: 0,
    zloto: 0
  };
  for (const key of keys) {
    const hex = hexes[key];
    if (!hex) continue;
    if (hex.zloze) continue;
    if (nakladkaBlocksDepositSpawn(hex.nakladka)) continue;
    if (hex.terenBazowy === "morze" /* Morze */ || hex.terenBazowy === "wybrzeze" /* Wybrzeze */) continue;
    const [depQ, depR] = key.split(",").map(Number);
    for (const rule of rules) {
      if (!rule.allowedOn(hex)) continue;
      if (rule.requiresCoastalLand && !isCoastalLandHex(hexes, depQ, depR)) continue;
      if (rand() < Math.min(1, rule.rarity * baselineMult * resourceMult)) {
        applyDepositToHex(hex, rule);
        counts[rule.id] = (counts[rule.id] ?? 0) + 1;
        break;
      }
    }
  }
  for (const hex of Object.values(hexes)) {
    if (!hex.zloze) continue;
    const z = hex.zloze.trim().toLowerCase();
    if (z === "miedz" && hex.zlozeMinEra == null) hex.zlozeMinEra = 2;
    if (z === "zelazo" && hex.zlozeMinEra == null) hex.zlozeMinEra = 3;
  }
  return counts;
}
var FAIR_PLAY_DEPOSIT_IDS = [
  "zelazo",
  "miedz",
  "glina"
  // Model B: bydlo/owce usunięte (hodowla = ulepszenie, nie złoże)
];
function depositRuleById(id) {
  const rule = DEPOSIT_RULES.find((r) => r.id === id);
  if (!rule) throw new Error(`Brak regu\u0142y z\u0142o\u017Ca: ${id}`);
  return rule;
}
function hexCarriesDepositType(hex, id) {
  if (hex.zloze === id) return true;
  const rule = depositRuleById(id);
  if (rule.nakladka !== null) return hex.nakladka === rule.nakladka;
  return false;
}
function cellCarriesDepositType(cellLand, hexes, id) {
  for (const [q, r] of cellLand) {
    const hex = hexes[hexKey(q, r)];
    if (hex && hexCarriesDepositType(hex, id)) return true;
  }
  return false;
}
function nakladkaBlocksDepositSpawn(nakladka) {
  return nakladka !== "brak" /* Brak */ && nakladka !== "las" /* Las */;
}
function hexCanAcceptDeposit(hex, rule) {
  if (hex.terenBazowy === "morze" /* Morze */) return false;
  if (hex.terenBazowy === "wybrzeze" /* Wybrzeze */) return false;
  if (hex.zloze) return false;
  if (nakladkaBlocksDepositSpawn(hex.nakladka)) return false;
  return rule.allowedOn(hex);
}
function applyDepositToHex(hex, rule) {
  if (hex.nakladka === "las" /* Las */) {
    hex.zloze = rule.id;
  } else if (rule.nakladka !== null) {
    hex.nakladka = rule.nakladka;
  } else {
    hex.zloze = rule.id;
  }
  if (rule.id === "miedz" && hex.zlozeMinEra == null) hex.zlozeMinEra = 2;
  if (rule.id === "zelazo" && hex.zlozeMinEra == null) hex.zlozeMinEra = 3;
}
function forceDepositOnHex(hex, rule) {
  applyDepositToHex(hex, rule);
}
function prepareTerrainForDeposit(hex, rule) {
  hex.nakladka = "brak" /* Brak */;
  delete hex.zloze;
  switch (rule.id) {
    case "zelazo":
    case "wegiel":
      hex.terenBazowy = "gory" /* Gory */;
      break;
    case "miedz":
    case "owce":
      hex.terenBazowy = "wzgorza" /* Wzgorza */;
      break;
    case "konie":
      hex.terenBazowy = "rownina" /* Rownina */;
      break;
    case "bydlo":
      hex.terenBazowy = "laka" /* Laka */;
      break;
    default:
      break;
  }
}
function pickDepositBootstrapHex(land, hexes, rule, rand) {
  const ranked = land.filter(([q, r]) => {
    const hex = hexes[hexKey(q, r)];
    if (!hex || hex.terenBazowy === "morze" /* Morze */ || hex.terenBazowy === "wybrzeze" /* Wybrzeze */) {
      return false;
    }
    if (rule.id === "glina" && !rule.allowedOn(hex)) return false;
    return true;
  }).map(([q, r]) => ({ q, r, score: rand() })).sort((a, b) => b.score - a.score);
  if (ranked.length === 0) return null;
  const spot = ranked[0];
  prepareTerrainForDeposit(hexes[hexKey(spot.q, spot.r)], rule);
  return [spot.q, spot.r];
}
function forceDepositInCell(land, hexes, id, rand) {
  if (cellCarriesDepositType(land, hexes, id)) return false;
  const rule = depositRuleById(id);
  let spot = pickDepositForceHex(land, hexes, rule, rand);
  if (!spot) spot = pickDepositBootstrapHex(land, hexes, rule, rand);
  if (!spot) return false;
  forceDepositOnHex(hexes[hexKey(spot[0], spot[1])], rule);
  return true;
}
function pickDepositForceHex(land, hexes, rule, rand) {
  const ranked = land.filter(([q, r]) => {
    const hex = hexes[hexKey(q, r)];
    return hex != null && hexCanAcceptDeposit(hex, rule);
  }).map(([q, r]) => {
    let score = 0;
    const hex = hexes[hexKey(q, r)];
    if (rule.id === "glina" && hex.rzeka?.obecna) score += 2;
    if (rule.id === "glina" && hex.terenBazowy === "laka" /* Laka */) score += 1;
    score += rand() * 0.2;
    return { q, r, score };
  }).sort((a, b) => b.score - a.score);
  if (ranked.length === 0) return null;
  return [ranked[0].q, ranked[0].r];
}
function cellHasForest(cellLand, hexes) {
  for (const [q, r] of cellLand) {
    if (hexes[hexKey(q, r)]?.nakladka === "las" /* Las */) return true;
  }
  return false;
}
function ensureDepositGridCoverage(hexes, tier, _typ, _continentOf, _nContinents, rand) {
  const cellSize = fairPlayResourceCellSize(tier);
  const minLand = minLandHexesForFairPlayCell(cellSize);
  const partitions = groupLandMassKeys(hexes).filter((m) => m.length >= 8);
  let fixed = 0;
  for (const part of partitions) {
    const massSet = new Set(part);
    for (let pass = 0; pass < 10; pass++) {
      let passFixed = 0;
      for (const land of landHexesByCoverageCell(massSet, cellSize).values()) {
        if (!cellCanHostDepositPackage(land, hexes, minLand)) continue;
        for (const id of FAIR_PLAY_DEPOSIT_IDS) {
          if (forceDepositInCell(land, hexes, id, rand)) passFixed++;
        }
      }
      fixed += passFixed;
      if (passFixed === 0) break;
    }
    for (const land of landHexesByCoverageCell(massSet, cellSize).values()) {
      if (!cellCanHostDepositPackage(land, hexes, minLand)) continue;
      for (const id of FAIR_PLAY_DEPOSIT_IDS) {
        if (!cellCarriesDepositType(land, hexes, id)) {
          forceDepositInCell(land, hexes, id, rand);
        }
      }
    }
  }
  capMountainRangeClusterSize(
    hexes,
    /* @__PURE__ */ new Map(),
    "gory" /* Gory */,
    "rownina" /* Rownina */,
    MAX_MOUNTAIN_RANGE_CLUSTER_SIZE
  );
  capMountainRangeClusterSize(
    hexes,
    /* @__PURE__ */ new Map(),
    "wzgorza" /* Wzgorza */,
    "rownina" /* Rownina */,
    MAX_MOUNTAIN_RANGE_CLUSTER_SIZE
  );
  return fixed;
}
function ensureForestGridCoverage(hexes, scratch, forestTier, _typ, _continentOf, _nContinents, rand) {
  const cellSize = forestCoverageCellSize(forestTier);
  const minLand = minLandHexesForFairPlayCell(cellSize);
  const masses = groupLandMassKeys(hexes).filter((m) => m.length >= 8).sort((a, b) => b.length - a.length);
  let fixed = 0;
  for (let outer = 0; outer < 6; outer++) {
    let passFixed = 0;
    for (const mass of masses) {
      const massSet = new Set(mass);
      for (const land of landHexesByCoverageCell(massSet, cellSize).values()) {
        if (eligibleForestLandCount(land, hexes) < minLand || cellHasForest(land, hexes)) continue;
        const eligible = land.filter(([q, r]) => {
          const h = hexes[hexKey(q, r)];
          return h && isForestEligibleTerrain(h.terenBazowy) && h.nakladka === "brak" /* Brak */;
        }).map(([q, r]) => ({
          q,
          r,
          score: (scratch.get(hexKey(q, r))?.forNoise ?? 0) + rand() * 0.15
        })).sort((a, b) => b.score - a.score);
        if (eligible.length === 0) continue;
        const spot = eligible[0];
        hexes[hexKey(spot.q, spot.r)].nakladka = "las" /* Las */;
        passFixed++;
      }
    }
    fixed += passFixed;
    if (passFixed === 0) break;
  }
  return fixed;
}
function stripDepositsFromWater(hexes) {
  let n = 0;
  for (const hex of Object.values(hexes)) {
    if (hex.terenBazowy !== "morze" /* Morze */ && hex.terenBazowy !== "wybrzeze" /* Wybrzeze */) continue;
    const had = hex.nakladka !== "brak" /* Brak */ || !!hex.zloze;
    hex.nakladka = "brak" /* Brak */;
    delete hex.zloze;
    if (had) n++;
  }
  return n;
}
function computeStartPositions(hexes, seed, opts = {}) {
  const minCount = opts.minCount ?? 5;
  const minDist = opts.minDist ?? 5;
  const absMinDist = opts.absMinDist ?? 2;
  const land = [];
  const keys = Object.keys(hexes).sort((a, b) => {
    const [aq, ar] = a.split(",").map(Number);
    const [bq, br] = b.split(",").map(Number);
    return aq !== bq ? aq - bq : ar - br;
  });
  for (const key of keys) {
    const hex = hexes[key];
    if (hex && isLandTerrain(hex.terenBazowy)) {
      land.push({ q: hex.coords.q, r: hex.coords.r });
    }
  }
  if (land.length === 0) return [];
  const rand = mulberry32((seed ^ 2246822507) >>> 0);
  const shuffled = land.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = tmp;
  }
  function greedyPick(dist) {
    const picked = [];
    for (const c of shuffled) {
      const tooClose = picked.some((p) => hexDistanceAxial(c.q, c.r, p.q, p.r) < dist);
      if (!tooClose) picked.push(c);
    }
    return picked;
  }
  let result = [];
  for (let d = minDist; d >= absMinDist; d--) {
    result = greedyPick(d);
    if (result.length >= minCount) {
      break;
    }
  }
  if (result.length < minCount) {
    const have = new Set(result.map((p) => hexKey(p.q, p.r)));
    for (const c of shuffled) {
      if (result.length >= minCount) break;
      const k = hexKey(c.q, c.r);
      if (!have.has(k)) {
        result.push(c);
        have.add(k);
      }
    }
  }
  result.sort((a, b) => a.q !== b.q ? a.q - b.q : a.r - b.r);
  return result;
}

// src/map/clusters.ts
var MIN_DEVELOPMENT_HEX_PER_CIV = 90;
var SMALL_MASS_CAP_THRESHOLD = 2 * MIN_DEVELOPMENT_HEX_PER_CIV;

// data/terrain-improvements.json
var terrain_improvements_default = {
  _meta: {
    opis: "Ulepszenia terenu (lane MIASTO: liczby bonusow + koszt + epoka). Gdzie wolno (placement) + render = MAPA. Przeplyw w turze = SILNIK. Koszt w PRACY (z puli Pracy w skarbcu, Q4). Lista uzgodniona z MAPA + uzupelniona na przyszlosc wczesnych epok (2026-06-24). EKONOMIA: dodano surowiecOdblokowany (ASCII) + zasieg_terytorium (2026-06-25).",
    bonus_pola: "zywnosc | praca | handel | pieniadz | kamien | drewno (na obrabiane pole)",
    epoka: "1=Kamien, 2=Braz, 3=Zelazo",
    decyzje_MIASTO: "lodzie_rybackie = TAK teraz; kamieniolom OSOBNO od kopalni (rozne surowce); teren NIE daje +Nauka/+Kultura (te z budynkow/specjalistow/suwaka). Tarasy = +zywnosc (nie kultura).",
    kanon_zywnosc_hodowla: "docs/decyzje/KANON-ULEPSZENIA-ZYWNOSC-HODOWLA.md (2026-06-29 Maciej) \u2014 obowiazuje nad tym plikiem do wdrozenia",
    decyzje_EKONOMIA: "surowiecOdblokowany = klucz ASCII surowca (lub null) wg modelu dostepu boolean v0.1; zasieg_terytorium: posterunek=5 (epoka 2), fort=10 (epoka 3), miasto=10 (stale); zakladanie kolejnego miasta wymaga Straznica LUB zasiegu obecnego miasta. Rozbieznosci kluczy z resources.json (brak pola id) zapisane w EKONOMIA-ulepszenia-terenu-v01.md.",
    klucze_surowcow_ASCII: "drewno | kamien | glina | ruda | zelazo | stal | bydlo | owce | lama | kon | sol | zloto",
    pole_surowiec_ilosc_tura: "SUROW-TERYT-01 (Maciej 2026-07-23): produkcja PER ZBUDOWANE ULEPSZENIE w terytorium wlasciciela, niezaleznie od obsadzenia pola populacja (workedTiles). Wartosc = surowiec/ture. Stawki REALNE: Tartak->drewno 10, Glinianka->glina 15 (PYTANIE-84-B1/B9/U-18, korekta balansu Maciej 2026-07-29: bylo 20/20), Kamieniolom->kamien 4, Kopalnia miedzi->ruda 2, Kopalnia zelaza->ruda_zelaza 2, Warzelnia soli->sol 10 (B2), Stadnina->kon 1 (B3), Kopalnia zlota->zloto 1 (B4). Brak pola w JSON -> domyslnie 2/ture (terrain-improvements.ts TERRITORY_YIELD_DEFAULT_AMOUNT, fallback bezpieczenstwa)."
  },
  farma: {
    nazwa: "Farma",
    epoka: 1,
    bonus: {
      zywnosc: 3,
      praca: 3,
      handel: 3
    },
    surowiecOdblokowany: null,
    teren: "\u0141\u0105ka, R\xF3wnina; Wzg\xF3rza z lasem",
    warunek: "ziemia uprawna; DZIA\u0141A BEZ rzeki (podstawowy); MO\u017BE na lesie (Las) \u2014 bez wyr\u0119bu (Maciej 2026-07-21)",
    koszt_praca: 20,
    tech: "Rolnictwo",
    odblokowuje: ""
  },
  irygacja: {
    nazwa: "Irygacja",
    epoka: 2,
    bonus: {
      zywnosc: 5,
      praca: 2,
      handel: 2
    },
    surowiecOdblokowany: null,
    teren: "\u0141\u0105ka, R\xF3wnina, Pustynia",
    warunek: "TYLKO pole s\u0105siaduj\u0105ce z rzek\u0105 (1 pole) lub na rzece \u2014 BRAK \u0142a\u0144cuch\xF3w; kluczowa nad Nilem",
    koszt_praca: 30,
    tech: "Irygacja",
    odblokowuje: ""
  },
  bydlo: {
    nazwa: "Trzoda",
    epoka: 1,
    bonus: {
      zywnosc: 2,
      praca: 4,
      handel: 3
    },
    surowiecOdblokowany: "bydlo",
    surowiecOdblokowany_uwaga: "ABC-18: dost\u0119p dopiero po postawieniu na z\u0142o\u017Cu trzody",
    teren: "\u0141\u0105ka, R\xF3wnina",
    warunek: "plaski l\u0105d; pierwsze: z\u0142o\u017Ce byd\u0142a; potem po odblokowaniu \u2014 bez z\u0142o\u017Ca; + farma lub solo; NIE na Pustyni",
    koszt_praca: 20,
    tech: "Oswojenie zwierz\u0105t",
    odblokowuje: "Trzoda (Rydwan po odblokowaniu)"
  },
  owce: {
    nazwa: "Owce",
    epoka: 1,
    bonus: {
      zywnosc: 1,
      praca: 2,
      handel: 2
    },
    surowiecOdblokowany: "owce",
    surowiecOdblokowany_uwaga: "pierwsze na zlozu owiec; solo na wzgorzu; bez farmy/bydla",
    teren: "Wzg\xF3rza (bez lasu)",
    warunek: "solo otwarte wzg\xF3rze (nak\u0142adka Las zabroniona); pierwsze: z\u0142o\u017Ce owiec; potem wzg\xF3rze bez z\u0142o\u017Ca po odblokowaniu",
    koszt_praca: 20,
    tech: "Oswojenie zwierz\u0105t",
    odblokowuje: "Owce (we\u0142na / jedzenie)"
  },
  lama: {
    nazwa: "Lama",
    epoka: 1,
    cywilizacje: ["inkowie"],
    bonus: {
      zywnosc: 1,
      praca: 3,
      handel: 3
    },
    surowiecOdblokowany: "lama",
    surowiecOdblokowany_uwaga: "TYLKO Inkowie; solo \u2014 bez innych ulepszen na heksie; pierwsze na zlozu lamy",
    teren: "Wzg\xF3rza, G\xF3ry",
    warunek: "solo; tylko cyw. Inkowie; wzg\xF3rza/g\xF3ry; pierwsze: z\u0142o\u017Ce lamy; NIE na \u0141\u0105ce/R\xF3wninie/Pustyni",
    koszt_praca: 20,
    tech: "Oswojenie zwierz\u0105t",
    odblokowuje: "Lama (transport / \u017Cywno\u015B\u0107)"
  },
  stadnina: {
    nazwa: "Stadnina",
    epoka: 2,
    bonus: {
      praca: 2,
      handel: 2
    },
    surowiecOdblokowany: "kon",
    surowiecOdblokowany_uwaga: "ABC-18: tylko na z\u0142o\u017Cu konia + tech Je\u017Adziectwo. PYTANIE-84-B3 (Maciej 2026-07-27): produkcja Ko\u0144 do magazynu pa\u0144stwa per ulepszenie w terytorium (SUROW-TERYT-01); stawka REALNA = 1/ture.",
    surowiec_ilosc_tura: 1,
    teren: "\u0141\u0105ka, R\xF3wnina",
    warunek: "solo; tylko heks ze z\u0142o\u017Cem konia w terytorium",
    koszt_praca: 28,
    tech: "Je\u017Adziectwo",
    odblokowuje: "Ko\u0144 (jednostki konne)"
  },
  glinianka: {
    nazwa: "Glinianka",
    epoka: 2,
    bonus: {
      praca: 1,
      glina: 2,
      handel: 2
    },
    surowiecOdblokowany: "glina",
    surowiecOdblokowany_uwaga: "GLINA-Q1=A (Maciej 2026-07-20): stala ilosc glina/ture z ulepszenia. PYTANIE-84-B1/U-18 (Maciej 2026-07-27): stawka REALNA = 20/ture; korekta balansu Maciej 2026-07-29: 15/ture (bylo 20 \u2014 magazyn PE\u0141NY). NIE bonus.glina (2) -- osobne pola.",
    surowiec_ilosc_tura: 15,
    teren: "z\u0142o\u017Ce Gliny",
    warunek: "glina \u2192 ceg\u0142a (wa\u017Cne w br\u0105zie)",
    koszt_praca: 20,
    tech: "Garncarstwo",
    odblokowuje: "Ceg\u0142a (budynki br\u0105zu)"
  },
  kamieniolom: {
    nazwa: "Kamienio\u0142om",
    epoka: 1,
    bonus: {
      praca: 1,
      kamien: 1,
      handel: 2
    },
    surowiecOdblokowany: "kamien",
    surowiecOdblokowany_uwaga: "klucz 'kamien' wg Surowiec='Kamie\u0144' w resources.json; brak pola id \u2014 propozycja EKONOMIA; UWAGA: 'kamien' pojawia sie rowniez w bonus{} jako efekt plonu \u2014 DANE musi zdecydowac czy bonus.kamien = dostep czy liczba. Stawka SUROW-TERYT-01 (Maciej 2026-07-23, REALNA) = 4/ture.",
    surowiec_ilosc_tura: 4,
    teren: "Wzg\xF3rza, G\xF3ry (kamie\u0144)",
    warunek: "budulec \u2014 mury, budynki",
    koszt_praca: 22,
    tech: "Murarstwo",
    odblokowuje: "Kamie\u0144 (mury / budynki)"
  },
  oboz_lowiecki: {
    nazwa: "Ob\xF3z \u0142owiecki",
    epoka: 1,
    bonus: {
      zywnosc: 1,
      pieniadz: 1,
      praca: 1,
      handel: 2
    },
    surowiecOdblokowany: null,
    surowiecOdblokowany_uwaga: "dzika zwierzyna nie jest osobnym surowcem w resources.json v0.1 \u2014 brak klucza; plony ekonomiczne (zywnosc+pieniadz) jako substytut",
    teren: "Las / dzika zwierzyna",
    warunek: "dzika zwierzyna",
    koszt_praca: 18,
    tech: "\u0141owiectwo",
    odblokowuje: ""
  },
  wyrab: {
    nazwa: "Wyr\u0105b",
    typ: "wycinka",
    epoka: 1,
    bonus: {
      handel: 1
    },
    surowiecOdblokowany: null,
    teren: "Las",
    warunek: "koszt 5 Pracy na start; plon +5 Drewna \xD7 1 tura (surowiec do puli pa\u0144stwa, Maciej 2026-07-24); potem teren bazowy bez lasu",
    koszt_praca: 5,
    tech: null,
    wycinka: {
      praca_per_tura: 5,
      tury: 1,
      usuwa_nakladke: "las"
    },
    odblokowuje: ""
  },
  tartak: {
    nazwa: "Tartak",
    typ: "ulepszenie",
    epoka: 1,
    bonus: {
      praca: 3,
      handel: 3
    },
    surowiecOdblokowany: "drewno",
    surowiecOdblokowany_uwaga: "SUROW-TERYT-01 (Maciej 2026-07-23): produkcja per ulepszenie w terytorium, niezaleznie od obsadzenia populacja. PYTANIE-84-B9/U-18 (Maciej 2026-07-27): stawka REALNA = 20/ture; korekta balansu Maciej 2026-07-29: 10/ture (bylo 20 \u2014 magazyn PE\u0141NY).",
    surowiec_ilosc_tura: 10,
    teren: "L\u0105d w terytorium (\u0142\u0105ka, lasy, wzg\xF3rza\u2026)",
    warunek: "sta\u0142e ulepszenie; MO\u017BE na lesie \u2014 las NIE znika; odblokowuje dost\u0119p do drewna (v0.1 bez ilo\u015Bci)",
    koszt_praca: 25,
    tech: "Obr\xF3bka drewna",
    odblokowuje: "Drewno (TYP 1 \u2014 bez desek, B-SUROW-BUD-03)"
  },
  tarasy: {
    nazwa: "Tarasy uprawne",
    epoka: 2,
    bonus: {
      zywnosc: 3,
      praca: 2,
      handel: 2
    },
    surowiecOdblokowany: null,
    teren: "Wzg\xF3rza",
    warunek: "Wzg\xF3rze w terytorium; solo; +\u017Cywno\u015B\u0107; nie na z\u0142o\u017Cu; UNIKALNE kulturowe (tylko Chi\u0144czycy + Inkowie)",
    koszt_praca: 25,
    tech: "Rolnictwo",
    odblokowuje: "",
    cywilizacje: [
      "chinczycy",
      "inkowie"
    ],
    cywilizacje_uwaga: "Pole og\xF3lne (konwencja z wonders.json: WonderDef.cywilizacje + canCivBuildWonder) \u2014 czytane przez isImprovementAllowedForCiv (game/terrain-improvements.ts), NIE hardkod per-ulepszenie. Brak pola / pusta lista = dost\u0119pne dla wszystkich cywilizacji.",
    uwagi: "C-TARASY-Q1 Maciej 2026-07-26: cofni\u0119cie T-TECH-4 (2026-07-04, 'po Rolnictwie \u2014 wszystkie cywilizacje') \u2014 zgodno\u015B\u0107 historyczna: chi\u0144skie tarasy ry\u017Cowe i andyjskie tarasy Ink\xF3w. Od teraz WY\u0141\u0104CZNIE Chi\u0144czycy + Inkowie (po Rolnictwie)."
  },
  lodzie_rybackie: {
    nazwa: "\u0141odzie rybackie",
    epoka: 1,
    bonus: {
      zywnosc: 2,
      praca: 3,
      handel: 3
    },
    surowiecOdblokowany: null,
    surowiecOdblokowany_uwaga: "ryby nie sa osobnym surowcem w resources.json v0.1; plony (zywnosc) jako substytut; DANE moze dodac klucz 'ryby' w przyszlosci",
    teren: "Wybrze\u017Ce, Morze (ryby)",
    warunek: "\u0142awica ryb",
    koszt_praca: 20,
    tech: "\u017Begluga",
    odblokowuje: ""
  },
  warzelnia_soli: {
    nazwa: "Warzelnia soli",
    epoka: 2,
    bonus: {
      pieniadz: 1,
      zywnosc: 1,
      praca: 1,
      handel: 3
    },
    surowiecOdblokowany: "sol",
    surowiecOdblokowany_uwaga: "PYTANIE-84-U21/B2 (Maciej 2026-07-27): produkcja S\xF3l do magazynu pa\u0144stwa per ulepszenie w terytorium (SUROW-TERYT-01); stawka REALNA = 10/ture. Bonus heksa (+1 \u017Bywno\u015B\u0107, +1 Pieni\u0105dz) zostaje obok surowca_ilosc_tura.",
    surowiec_ilosc_tura: 10,
    teren: "Wybrze\u017Ce, z\u0142o\u017Ce soli (hex.zloze=sol)",
    warunek: "s\xF3l \u2014 wy\u0142\u0105cznie wybrze\u017Ce morskie (kanon: z\u0142o\u017Ca soli przy brzegu) lub hex.zloze=sol",
    koszt_praca: 20,
    tech: "Garncarstwo",
    odblokowuje: "S\xF3l"
  },
  fort: {
    nazwa: "Fort",
    epoka: 3,
    bonus: {},
    surowiecOdblokowany: null,
    bonus_obrona_proc: 100,
    bonus_wymaga_obozowania: true,
    zasieg_pol: 10,
    zasieg_terytorium: 10,
    zasieg_kontroli: 10,
    teren: "dowolny l\u0105d w terytorium",
    warunek: "+100% Obrony jednostkom obozuj\u0105cym na polu fortu (bez plon\xF3w); rozszerza zasi\u0119g terytorium o promie\u0144 10 p\xF3l",
    koszt_praca: 25,
    tech: "Wojskowo\u015B\u0107",
    odblokowuje: "",
    uwagi: "ABC-10 Maciej 2026-07-04: Fort (mapa) \u2260 Cytadela (miasto). \u017Belazo ep.3; zasi\u0119g 10; +100% Obrona obozowanie"
  },
  droga: {
    nazwa: "Droga",
    epoka: 1,
    bonus: {
      handel: 1
    },
    surowiecOdblokowany: null,
    teren: "ka\u017Cdy przejezdny heks",
    warunek: "\u0142\u0105czy TYLKO miasta i posterunki (MAPA pilnuje); +szybko\u015B\u0107 ruchu jednostek",
    koszt_praca: 15,
    tech: "Ko\u0142o",
    odblokowuje: ""
  },
  droga_brukowana: {
    nazwa: "Droga brukowana",
    typ: "ulepszenie",
    epoka: 3,
    bonus: {
      handel: 2
    },
    bonus_ruch: 2,
    surowiecOdblokowany: null,
    upgradeFrom: "droga",
    teren: "hex z Drogi",
    warunek: "upgrade Drogi; +2 ruch jednostek; ta sama sie\u0107 dr\xF3g co Droga",
    koszt_praca: 25,
    tech: "Drogi brukowane",
    odblokowuje: "",
    uwagi: "T-TECH-9 Maciej 2026-07-04"
  },
  kopalnia_miedzi: {
    nazwa: "Kopalnia miedzi",
    epoka: 2,
    bonus: {
      praca: 2,
      handel: 5
    },
    surowiecOdblokowany: "ruda",
    surowiecOdblokowany_uwaga: "ruda miedzi (Odlewnia br\u0105zu); plon 2/t z kopalni_miedzi. SUROW-TERYT-01 (Maciej 2026-07-23): stawka REALNA (nie placeholder) = 2/ture.",
    surowiec_ilosc_tura: 2,
    teren: "Wzg\xF3rza, G\xF3ry, z\u0142o\u017Ce miedzi (hex.zloze=miedz) lub legacy ZlozeRudy",
    warunek: "ruda miedzi \u2192 magazyn (Odlewnia br\u0105zu)",
    koszt_praca: 22,
    tech: "Br\u0105zownictwo",
    odblokowuje: "Odlewnia br\u0105zu (budynek miejski)",
    uwagi: "ABC-7 + ABC-14 Maciej 2026-07-04: tylko heks ze z\u0142o\u017Cem rudy; R-KOPALNIA-UNIWERSALNA-Q1=B: legacy nakladka ZlozeRudy"
  },
  kopalnia_zelaza: {
    nazwa: "Kopalnia \u017Celaza",
    epoka: 3,
    bonus: {
      praca: 2,
      handel: 5
    },
    surowiecOdblokowany: "ruda_zelaza",
    surowiecOdblokowany_uwaga: "Ruda \u017Celaza (Odlewnia \u017Celaza); plon 2/t z kopalni_zelaza. SUROW-TERYT-01 (Maciej 2026-07-23): stawka REALNA = 2/ture.",
    surowiec_ilosc_tura: 2,
    teren: "Wzg\xF3rza, G\xF3ry, z\u0142o\u017Ce \u017Celaza (hex.zloze=zelazo)",
    warunek: "ruda \u017Celaza \u2192 magazyn (Odlewnia \u017Celaza)",
    koszt_praca: 22,
    tech: "Hutnictwo \u017Celaza",
    odblokowuje: "Odlewnia \u017Celaza (budynek miejski)",
    uwagi: "R-KOPALNIA-UNIWERSALNA-Q1=B (Maciej 2026-07-30): osobne ulepszenie zamiast uniwersalnej kopalnia"
  },
  kopalnia_zlota: {
    nazwa: "Kopalnia z\u0142ota",
    epoka: 2,
    bonus: {
      praca: 2,
      handel: 10
    },
    surowiecOdblokowany: "zloto",
    surowiecOdblokowany_uwaga: "PYTANIE-84-R9/B4 (Maciej 2026-07-27): Z\u0142oto do magazynu pa\u0144stwa per ulepszenie w terytorium (SUROW-TERYT-01); stawka REALNA = 1/tur\u0119. Mennica zu\u017Cywa 1 Z\u0142oto/tur\u0119 ze skarbca przy mno\u017Cniku handlu\u2192Pieni\u0105dz (U-13).",
    surowiec_ilosc_tura: 1,
    teren: "Wzg\xF3rza, G\xF3ry, z\u0142o\u017Ce z\u0142ota (hex.zloze=zloto)",
    warunek: "z\u0142o\u017Ce z\u0142ota \u2014 produkcja do magazynu pa\u0144stwa",
    koszt_praca: 22,
    tech: "Waluta",
    odblokowuje: "Mennica (Z\u0142oto w skarbcu + Targowisko w stolicy)",
    uwagi: "PYTANIE-84: z\u0142oto magazynowane (game/zloto-access.ts). Dodatkowe kopalnie \u2192 nadwy\u017Cka na handel/eksport (U-13)."
  },
  posterunek: {
    nazwa: "Posterunek (Stra\u017Cnica)",
    epoka: 2,
    bonus: {},
    surowiecOdblokowany: null,
    bonus_obrona_proc: 50,
    bonus_wymaga_obozowania: true,
    zasieg_pol: 5,
    zasieg_terytorium: 5,
    teren: "l\u0105d w/na kraw\u0119dzi w\u0142asnego zasi\u0119gu",
    warunek: "NIE miasto, BEZ plon\xF3w; ROZSZERZA zasi\u0119g terytorium o promie\u0144 5 p\xF3l; odkrywa mg\u0142\u0119; w\u0119ze\u0142 sieci dr\xF3g; +50% Obrony jednostkom obozuj\u0105cym na polu",
    koszt_praca: 30,
    tech: "-",
    tech_uwaga: "T-TECH-3 Maciej 2026-06-26: bramka AND w kodzie \u2014 Obr\xF3bka drewna + Murarstwo (improvement-tech.ts IMPROVEMENT_MULTI_TECH_REQ)",
    odblokowuje: "",
    uwagi: "Br\u0105z (epoka 2); zasieg_terytorium=5; +50% Obrona w trybie obozowania (decyzja Naster 2026-06-25)"
  },
  _miasto_zasieg_ref: {
    _komentarz: "NOTA (nie ulepsz. terenu): miasto ma zasieg_terytorium=10 (stale, wg dyspozycji EKONOMIA 2026-06-25); helper: okolica.cityRangeForPopulation \u2014 pop<5 r5, pop>=5 r10, pop>=10 r15 (wg memory civ-zasieg-miasta-dynamiczny); zasieg_terytorium=10 to wartosc poczatkowa/bazowa dla zasladania kolejnych miast"
  }
};

// src/game/terrain-improvements.ts
var IMPROVEMENTS = terrain_improvements_default;
var LEGACY_KEY_ALIASES = {
  pastwisko: "bydlo"
};
var IMPROVEMENT_KEYS = Object.keys(IMPROVEMENTS).filter((k) => !k.startsWith("_"));
function normalizeImprovementKey(raw) {
  if (!raw || raw === "brak") return void 0;
  const key = LEGACY_KEY_ALIASES[raw] ?? raw;
  return IMPROVEMENTS[key]?.bonus !== void 0 || IMPROVEMENTS[key] ? key : IMPROVEMENTS[raw] ? raw : void 0;
}
function improvementBonusForKey(key) {
  const row = IMPROVEMENTS[key];
  if (!row?.bonus) return {};
  return { ...row.bonus };
}
function applyImprovementBonus(yld, improvementKey) {
  if (!improvementKey) return;
  const b = improvementBonusForKey(improvementKey);
  if (b.zywnosc) yld.zywnosc += b.zywnosc;
  if (b.praca) yld.praca += b.praca;
  if (b.handel) yld.handel += b.handel;
  if (b.pieniadz) yld.handel += b.pieniadz;
  if (b.drewno) yld.drewno += b.drewno;
  if (b.kamien) yld.kamien += b.kamien;
  if (b.glina) yld.glina += b.glina;
}
var ORE_YIELD_PER_MINE = 2;
function oreYieldFromImprovements(improvementKeys, zloze) {
  let ruda = 0;
  let ruda_zelaza = 0;
  for (const raw of improvementKeys) {
    const key = normalizeImprovementKey(raw);
    if (key === "kopalnia_miedzi") {
      ruda += ORE_YIELD_PER_MINE;
    } else if (key === "kopalnia_zelaza") {
      ruda_zelaza += ORE_YIELD_PER_MINE;
    }
  }
  return { ruda, ruda_zelaza };
}
function applyImprovementBonuses(yld, improvementKeys) {
  for (const key of improvementKeys) {
    applyImprovementBonus(yld, key);
  }
}
var TERRITORY_YIELD_IMPROVEMENTS = /* @__PURE__ */ new Set([
  "tartak",
  "kamieniolom",
  "glinianka",
  "kopalnia_miedzi",
  "kopalnia_zelaza",
  "warzelnia_soli",
  "stadnina",
  "kopalnia_zlota"
]);
var TERRITORY_YIELD_DEFAULT_AMOUNT = 2;
function territoryYieldAmountForKey(key) {
  const row = IMPROVEMENTS[key];
  const v = row?.surowiec_ilosc_tura;
  return typeof v === "number" && Number.isFinite(v) && v > 0 ? v : TERRITORY_YIELD_DEFAULT_AMOUNT;
}
function territoryResourceYieldForImprovement(key, zloze) {
  const norm = normalizeImprovementKey(key);
  if (!norm || !TERRITORY_YIELD_IMPROVEMENTS.has(norm)) return null;
  switch (norm) {
    case "tartak":
      return { resourceKey: "drewno", amount: territoryYieldAmountForKey(norm) };
    case "kamieniolom":
      return { resourceKey: "kamien", amount: territoryYieldAmountForKey(norm) };
    case "glinianka":
      return { resourceKey: "glina", amount: territoryYieldAmountForKey(norm) };
    case "kopalnia_miedzi":
      return { resourceKey: "ruda", amount: territoryYieldAmountForKey(norm) };
    case "kopalnia_zelaza":
      return { resourceKey: "ruda_zelaza", amount: territoryYieldAmountForKey(norm) };
    case "warzelnia_soli":
      return { resourceKey: "sol", amount: territoryYieldAmountForKey(norm) };
    case "stadnina":
      return { resourceKey: "kon", amount: 1 };
    case "kopalnia_zlota":
      return { resourceKey: "zloto", amount: 1 };
    default:
      return null;
  }
}
function improvementKeysForHex(hex) {
  if (hex.ulepszenia?.length) {
    const keys = hex.ulepszenia.map((k) => normalizeImprovementKey(String(k))).filter((k) => !!k);
    return [...new Set(keys)];
  }
  const single = normalizeImprovementKey(String(hex.ulepszenie ?? "brak"));
  return single ? [single] : [];
}
var LIVESTOCK_SUROWIEC_KEYS = /* @__PURE__ */ new Set(["bydlo", "owce", "lama", "kon"]);
var LIVESTOCK_IMPROVEMENT_KEYS = IMPROVEMENT_KEYS.filter((k) => {
  const s = IMPROVEMENTS[k]?.surowiecOdblokowany;
  return typeof s === "string" && LIVESTOCK_SUROWIEC_KEYS.has(s);
});
var FARMA_POTENTIAL_FOOD_BONUS = IMPROVEMENTS.farma?.bonus?.zywnosc ?? 3;
var FOREST_FOOD_POTENTIAL_PENALTY = -3;
var FOOD_IMPROVEMENT_KEYS = /* @__PURE__ */ new Set([
  "farma",
  "irygacja",
  "tarasy",
  "bydlo",
  "owce",
  "lama",
  "oboz_lowiecki",
  "lodzie_rybackie"
]);
function foodPotentialForHex(terenBazowy, nakladka, improvementKeys) {
  const keys = improvementKeys.map((k) => normalizeImprovementKey(k)).filter((k) => !!k);
  if (keys.some((k) => FOOD_IMPROVEMENT_KEYS.has(k))) return 0;
  if (nakladka === "las" /* Las */) return FOREST_FOOD_POTENTIAL_PENALTY;
  if (terenBazowy === "laka" /* Laka */ || terenBazowy === "rownina" /* Rownina */) {
    return FARMA_POTENTIAL_FOOD_BONUS;
  }
  return 0;
}
var RESOURCE_UPKEEP_IMPROVEMENT_KEYS = /* @__PURE__ */ new Set([
  "tartak",
  "kamieniolom",
  "glinianka",
  "kopalnia_miedzi",
  "kopalnia_zelaza",
  "warzelnia_soli",
  "stadnina",
  // PYTANIE-84-B4: Kopalnia złota produkuje zloto/t do magazynu państwa (TERRITORY_YIELD powyżej).
  "kopalnia_zlota"
]);

// src/map/road-movement.ts
var ROAD_MIN_MOVE_COST = 1 / 3;

// src/units/setup.ts
var CIVILIAN_CATEGORIES = /* @__PURE__ */ new Set(["osadnik", "robotnik", "zwiadowca"]);
var CIVILIAN_TYPE_IDS = /* @__PURE__ */ new Set(["Zwiadowca", "Osadnik", "Robotnik"]);
function isCivilianUnit(u) {
  if (CIVILIAN_CATEGORIES.has(u.category)) return true;
  return CIVILIAN_TYPE_IDS.has(u.typeId);
}
function hexDistance(aq, ar, bq, br) {
  const dq = Math.abs(aq - bq);
  const dr = Math.abs(ar - br);
  const ds = Math.abs(-aq - ar - (-bq - br));
  return Math.max(dq, dr, ds);
}
var DEFAULT_TERRAIN_COSTS = {
  ["laka" /* Laka */]: 1,
  ["rownina" /* Rownina */]: 1,
  ["pustynia" /* Pustynia */]: 1,
  ["wybrzeze" /* Wybrzeze */]: Infinity,
  ["wzgorza" /* Wzgorza */]: 2,
  ["gory" /* Gory */]: Infinity,
  ["morze" /* Morze */]: Infinity,
  ["polarny" /* Polarny */]: Infinity
};
var _terrainCosts = { ...DEFAULT_TERRAIN_COSTS };
var TERRAIN_MOVEMENT_KEY_ALIASES = {
  Laka: "laka" /* Laka */,
  "\u0141\u0105ka": "laka" /* Laka */,
  laka: "laka" /* Laka */,
  Rownina: "rownina" /* Rownina */,
  "R\xF3wnina": "rownina" /* Rownina */,
  rownina: "rownina" /* Rownina */,
  Pustynia: "pustynia" /* Pustynia */,
  pustynia: "pustynia" /* Pustynia */,
  Wybrzeze: "wybrzeze" /* Wybrzeze */,
  "Wybrze\u017Ce": "wybrzeze" /* Wybrzeze */,
  wybrzeze: "wybrzeze" /* Wybrzeze */,
  Wzgorza: "wzgorza" /* Wzgorza */,
  "Wzg\xF3rza": "wzgorza" /* Wzgorza */,
  wzgorza: "wzgorza" /* Wzgorza */,
  Gory: "gory" /* Gory */,
  "G\xF3ry": "gory" /* Gory */,
  gory: "gory" /* Gory */,
  Morze: "morze" /* Morze */,
  morze: "morze" /* Morze */,
  Polarny: "polarny" /* Polarny */,
  polarny: "polarny" /* Polarny */
};

// src/game/wealth.ts
var FALLBACK_WEALTH_PARAMS = {
  capNaEpoke: 10,
  progNaPoziom: 4.5,
  mnoznikNaPoziom: 0.15,
  utrzymanieBaza: 0.2,
  utrzymaniePrzyCap: 0.4,
  zachowaniePoAwansie: 0.5,
  zadowolenieNa10pkt: 1,
  karaZero: 0,
  immunitetTur: 5
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
    karaZero: read("wealth_kara_zero", FALLBACK_WEALTH_PARAMS.karaZero),
    immunitetTur: read("wealth_immunitet_tur", FALLBACK_WEALTH_PARAMS.immunitetTur)
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
function advanceWealth(state, spoleczMoney, miastoMoney, epoka, p, opts) {
  const cap = wealthCap(epoka, p);
  let poziom = Math.min(cap, Math.max(0, Math.floor(state.poziom)));
  let pula = Math.max(0, Number.isFinite(state.pula) ? state.pula : 0);
  const minPoz = Math.max(0, Math.floor(opts?.minPoziom ?? 0));
  const spol = Number.isFinite(spoleczMoney) ? Math.max(0, spoleczMoney) : 0;
  const M = Number.isFinite(miastoMoney) ? Math.max(0, miastoMoney) : 0;
  const decay = wealthRownowaga(poziom, epoka, p) * M;
  pula += spol - decay;
  let spadek = 0;
  if (pula < 0) {
    pula = 0;
    if (poziom > minPoz) {
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

// src/game/building-stock-cost.ts
function ownerResourceStockAll(cities, ownerId) {
  const pool = {};
  for (const c of cities) {
    if (c.ownerId !== ownerId || !c.surowce) continue;
    for (const [k, v] of Object.entries(c.surowce)) {
      if (typeof v === "number" && Number.isFinite(v)) {
        pool[k] = (pool[k] ?? 0) + v;
      }
    }
  }
  return pool;
}
function ownerResourceStock(cities, ownerId, key) {
  let total = 0;
  for (const c of cities) {
    if (c.ownerId !== ownerId) continue;
    total += c.surowce?.[key] ?? 0;
  }
  return total;
}
function deductBuildingStockCostAcrossCities(cities, ownerId, cost) {
  const ownerCities = cities.filter((c) => c.ownerId === ownerId);
  for (const [key, needRaw] of Object.entries(cost)) {
    let need = needRaw;
    if (!(need > 0)) continue;
    const holders = ownerCities.filter((c) => (c.surowce?.[key] ?? 0) > 0).sort((a, b) => {
      const diff = (b.surowce?.[key] ?? 0) - (a.surowce?.[key] ?? 0);
      if (diff !== 0) return diff;
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    });
    for (const c of holders) {
      if (need <= 0) break;
      const have = c.surowce?.[key] ?? 0;
      const take = Math.min(have, need);
      if (!c.surowce) c.surowce = {};
      c.surowce[key] = have - take;
      need -= take;
    }
  }
}
function creditOwnerResourceStock(cities, ownerId, key, amount, capPerType) {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  const ownerCities = cities.filter((c) => c.ownerId === ownerId);
  if (ownerCities.length === 0) return 0;
  let toAdd = amount;
  if (typeof capPerType === "number" && Number.isFinite(capPerType)) {
    const current = ownerResourceStock(cities, ownerId, key);
    toAdd = Math.max(0, Math.min(toAdd, capPerType - current));
  }
  if (toAdd <= 0) return 0;
  const target = [...ownerCities].sort((a, b) => {
    const diff = (a.surowce?.[key] ?? 0) - (b.surowce?.[key] ?? 0);
    if (diff !== 0) return diff;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  })[0];
  if (!target.surowce) target.surowce = {};
  target.surowce[key] = (target.surowce[key] ?? 0) + toAdd;
  return toAdd;
}
function assignOwnerResourceStockFromPool(cities, ownerId, pool) {
  for (const c of cities) {
    if (c.ownerId !== ownerId) continue;
    if (!c.surowce) continue;
    for (const k of Object.keys(c.surowce)) {
      delete c.surowce[k];
    }
  }
  for (const [key, amount] of Object.entries(pool)) {
    if (typeof amount === "number" && Number.isFinite(amount) && amount > 0) {
      creditOwnerResourceStock(cities, ownerId, key, amount);
    }
  }
}

// data/epoka-ludnosc-manpower.json
var epoka_ludnosc_manpower_default = {
  _opis: "Skala ludno\u015Bci i Manpower per epoka imperium (wiersze 1\u201310). 1 ludek = ludno\u015B\u0107 absolutna na slot population (1\u201310). manpowerNaLudka = 10% ludekNaLudka. manpowerNaJednostke = koszt rekrutacji 1 jednostki (domy\u015Blnie = manpowerNaLudka; epoka 1 = po\u0142owa \u2014 Maciej 2026-08-03: wi\u0119ksza armia w Kamieniu).",
  _formuly: {
    ludnoscAbsolutna: "population \xD7 ludekNaLudka[epoka]",
    manpowerMax: "population \xD7 manpowerNaLudka[epoka]",
    kosztRekrutacji: "manpowerNaJednostke[epoka] per jednostka (ep1: 500 \u2192 2 jednostki / ludek przy pe\u0142nej puli)"
  },
  epoki: [
    { epoka: 1, ludekNaLudka: 1e4, manpowerNaLudka: 1e3, manpowerNaJednostke: 500 },
    { epoka: 2, ludekNaLudka: 2e4, manpowerNaLudka: 2e3, manpowerNaJednostke: 2e3 },
    { epoka: 3, ludekNaLudka: 4e4, manpowerNaLudka: 4e3, manpowerNaJednostke: 4e3 },
    { epoka: 4, ludekNaLudka: 8e4, manpowerNaLudka: 8e3, manpowerNaJednostke: 8e3 },
    { epoka: 5, ludekNaLudka: 16e4, manpowerNaLudka: 16e3, manpowerNaJednostke: 16e3 },
    { epoka: 6, ludekNaLudka: 32e4, manpowerNaLudka: 32e3, manpowerNaJednostke: 32e3 },
    { epoka: 7, ludekNaLudka: 64e4, manpowerNaLudka: 64e3, manpowerNaJednostke: 64e3 },
    { epoka: 8, ludekNaLudka: 12e5, manpowerNaLudka: 12e4, manpowerNaJednostke: 12e4 },
    { epoka: 9, ludekNaLudka: 24e5, manpowerNaLudka: 24e4, manpowerNaJednostke: 24e4 },
    { epoka: 10, ludekNaLudka: 48e5, manpowerNaLudka: 48e4, manpowerNaJednostke: 48e4 }
  ]
};

// data/miasto-params.json
var miasto_params_default = {
  min_dystans_miast: {
    wartosc: 4,
    jednostka: "heksy",
    opis: "Minimalny dystans (w heksach) miedzy dwoma miastami przy zakladaniu. Uzywane w cities.canFoundCity (reason 'za blisko innego miasta')."
  },
  jednostka_koszt_ludnosci: {
    wartosc: 0,
    jednostka: "ludnosc",
    opis: "Koszt ludnosci miasta za ukonczenie jednostki z kolejki (rekrutacja). USTAWIONE 0 (Maciej 2026-07-21): rekrutacja NIE zabiera juz populacji miasta \u2014 jedynym kosztem werbu jest pula Manpower (epoka-ludnosc-manpower.json / manpower.ts). production.populationCostOf; przy 0 populacja pozostaje bez zmian."
  },
  manpower_regen_proc_max_tura: {
    wartosc: 2,
    jednostka: "% max/ture",
    opis: "Co koniec tury miasto odzyskuje floor(manpowerMax \xD7 wartosc/100) Manpower (do cap). Ep1, 10 ludkow, max=10k \u2192 +200/ture. Pusta pula \u224850 tur do pelna. manpower.tickManpowerRegen."
  },
  manpower_regen_blok_oblezenie: {
    wartosc: 1,
    jednostka: "0/1",
    opis: "1 = brak odnowy Manpower gdy city.oblegane=true. 0 = regen normalnie podczas obl\u0119\u017Cenia."
  },
  manpower_uzupelnienie_hp_proc_max_tura: {
    easy: 25,
    normal: 20,
    hard: 15,
    jednostka: "% maxHP/tura",
    opis: "Co koniec tury (po odnowie puli Manpower): jednostka wojskowa leczy floor(maxHP \xD7 warto\u015B\u0107/100) HP z puli imperium. Koszt MP = ceil(healHp/maxHP \xD7 kosztJednostki). Przy braku MP \u2014 leczenie cz\u0119\u015Bciowe do dost\u0119pnej puli. manpower.tickManpowerUnitReplenishment."
  },
  jednostka_koszt_domyslny: {
    wartosc: 10,
    jednostka: "Praca",
    opis: "Domyslny koszt Pracy jednostki, gdy brak pola 'Pieniadz (koszt)' w units.json i brak dopasowania roli. production.DEFAULT_UNIT_COST."
  },
  zaloz_miasto_koszt_praca: {
    wartosc: 20,
    jednostka: "Praca",
    opis: "Koszt za\u0142o\u017Cenia miasta z mapy (tryb Budowa) \u2014 jak historyczny Osadnik (B1 Maciej 2026-06-29). Pierwsze miasto onboarding = 0 (Silnik)."
  },
  zaloz_miasto_koszt_ludnosci: {
    wartosc: 1,
    jednostka: "ludnosc",
    opis: "Ludno\u015B\u0107 pobierana przy za\u0142o\u017Ceniu kolejnego miasta (jak Osadnik Ludno\u015B\u0107=1)."
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
    opis: "Maksymalny promien okolicy miasta (cap) w modelu: cityRangeForPopulation(pop)=max(zasieg_okolicy_baza, min(pop,cap)). Maciej 2026-06-27: start min 5, rosnie 1:1 z pop."
  },
  praca_udzial_budynki: {
    wartosc: 0.7,
    jednostka: "udzial [0..1]",
    opis: "Q4: czesc Pracy miasta do kolejki budynkow; reszta -> globalna pula Pracy w skarbcu."
  },
  bonus_obrona_mur_proc: {
    wartosc: 200,
    jednostka: "% Obrony",
    opis: "Miasto Z MUREM (budynek 'mury', City.maMur) daje +200% Obrony broniacym sie jednostkom (bitwa/oblezenie). Decyzja Naster 2026-06-25. Konsumuje main.ts structureDefenseBonusFor -> combat.ts structureDefBonusPct + battleScene.ts (onWallWalkway). Miasto bez muru = brak tego bonusu. Miasto z Cytadela (upgrade Murow, patrz bonus_obrona_cytadela_proc) dostaje ten bonus RAZEM z dodatkowym -- lacznie +300%, nie osobnymi warstwami w kodzie (jeden zwracany procent: 200 albo 300)."
  },
  bonus_obrona_cytadela_proc: {
    wartosc: 100,
    jednostka: "% Obrony (dodatkowo do muru)",
    opis: `Miasto z Cytadela (budynek 'fort' -- UWAGA: to jest budynek Cytadela, upgrade Murow; NIE mylic z ulepszeniem terenowym 'fort' na mapie, ktore daje osobny bonus +100% dla obozujacych jednostek poza miastem) daje DODATKOWE +100% Obrony PONAD bonus muru -- lacznie +300% (200 mur + 100 cytadela). Decyzja Maciej 2026-07-25: "3, 100%. Bo to juz by bylo za duzo, i tak z murami jest 300%." Cytadela to upgrade budynku 'mury' (ID podmieniane w cityBuilt), wiec miasto z Cytadela NIE ma juz 'mury' w liscie budynkow -- flaga City.maMur pozostaje true (main.ts ustawia ja dla obu ID), a rozroznienie mur/cytadela robi structureDefenseBonusFor po cityBuilt.includes('fort'). Konsumuje main.ts structureDefenseBonusFor -> combat.ts structureDefBonusPct + battleScene.ts (onWallWalkway).`
  },
  bonus_obrona_baszta_proc: {
    wartosc: 100,
    jednostka: "% Obrony (dodatkowo do muru+cytadeli)",
    opis: "Decyzja 41B (Maciej 2026-07-25): Baszta -- TRZECI, niezalezny budynek obronny (buildings.json id='baszta'), dokladany obok Murow i Cytadeli (brak upgradeFrom, zaden nie zastepuje pozostalych). Daje DODATKOWE +100% Obrony PONAD Mury (+200%) i Cytadele (+100%) -- miasto z kompletem trzech budowli obronnych = +400% lacznie (200 mur + 100 cytadela + 100 baszta). Konsumuje main.ts structureDefenseBonusFor -> game/city-defense.ts cityWallDefenseBonusPercent -> combat.ts structureDefBonusPct + battleScene.ts (onWallWalkway). Baszta sama (bez Murow/Cytadeli) daje WYLACZNIE swoj wlasny +100% -- baza 'mur' (200%) aktywuje sie tylko gdy w miescie stoi realnie budynek 'mury' lub 'fort'."
  },
  bonus_obrona_palisada_proc: {
    wartosc: 100,
    jednostka: "% Obrony (wczesna palisada drewniana)",
    opis: "Palisada drewniana (buildings.json id='palisada') -- wczesna obrona miasta przed Mury kamienne: +100% Obrony broni\u0105cym si\u0119 jednostkom. Epoka Kamienia, tech Obr\xF3bka drewna. Mury (+200%) ZAST\u0118PUJ\u0104 bonus palisady (nie stackuj\u0105 -- patrz game/city-defense.ts). Konsumuje main.ts structureDefenseBonusFor -> cityWallDefenseBonusPercent -> combat.ts structureDefBonusPct + battleScene.ts (onWallWalkway). Odblokowuje City.maMur (jak Mury) dla bramki terenu przy obronie miasta."
  },
  zasieg_okolicy_baza: {
    wartosc: 5,
    jednostka: "pola/strona",
    opis: "Minimalny promien okolicy przy populacji 1..4 (start miasta = 5 heksow). Czytane przez okolica.cityRangeForPopulation (Maciej 2026-06-27)."
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

// src/game/manpower.ts
var ROWS = epoka_ludnosc_manpower_default.epoki;
var MAX_EPOKA = 10;
var DEFAULT_REGEN = {
  regenProcMaxPerTurn: 2,
  blockWhenBesieged: true
};
var DEFAULT_REPLENISH_PCT = {
  easy: 25,
  normal: 20,
  hard: 15
};
function loadManpowerReplenishParams(difficulty = "normal", raw = miasto_params_default) {
  const row = raw.manpower_uzupelnienie_hp_proc_max_tura;
  const pick3 = (key) => {
    const v = row?.[key];
    if (typeof v === "number" && Number.isFinite(v) && v >= 0) return v;
    const fb = row?.normal;
    if (typeof fb === "number" && Number.isFinite(fb) && fb >= 0) return fb;
    return DEFAULT_REPLENISH_PCT[key];
  };
  return { healPctMaxPerTurn: Math.min(100, pick3(difficulty)) };
}
function isUnitInBesiegedLocation(unit, cities) {
  if (unit.q == null || unit.r == null) return false;
  const city = cities.find((c) => c.q === unit.q && c.r === unit.r);
  if (!city || city.ownerId !== unit.ownerId) return false;
  return city.oblegane === true;
}
function replenishmentUnitSortKey(unit, cities) {
  if (isUnitInBesiegedLocation(unit, cities)) return 2;
  if (unit.inGarnizon === true) return 0;
  return 1;
}
function manpowerHealCapForTurn(maxHp, curHp, params) {
  if (maxHp <= 0 || curHp <= 0 || curHp >= maxHp) return 0;
  const cap = Math.floor(maxHp * params.healPctMaxPerTurn / 100);
  return Math.max(0, Math.min(cap, maxHp - curHp));
}
function manpowerCostForHeal(healHp, maxHp, unitCost) {
  if (healHp <= 0 || maxHp <= 0 || unitCost <= 0) return 0;
  return Math.min(unitCost, Math.ceil(healHp / maxHp * unitCost));
}
function maxAffordableManpowerHeal(desiredHeal, maxHp, unitCost, availableMp) {
  if (desiredHeal <= 0 || maxHp <= 0 || unitCost <= 0 || availableMp <= 0) return 0;
  return Math.min(desiredHeal, Math.floor(availableMp * maxHp / unitCost));
}
function tickManpowerUnitReplenishment(cities, units, difficulty, resolveOwnerEra, resolveOwnerBonusy, getMaxHp, rawMiastoParams) {
  const params = loadManpowerReplenishParams(difficulty, rawMiastoParams);
  if (params.healPctMaxPerTurn <= 0 || units.length === 0) {
    return { healedCount: 0, totalMpSpent: 0 };
  }
  const byOwner = /* @__PURE__ */ new Map();
  for (const u of units) {
    if (isCivilianUnit(u)) continue;
    const list = byOwner.get(u.ownerId) ?? [];
    list.push(u);
    byOwner.set(u.ownerId, list);
  }
  let healedCount = 0;
  let totalMpSpent = 0;
  for (const [ownerId, ownerUnits] of byOwner) {
    const epoka = resolveOwnerEra(ownerId);
    const maxMult = civManpowerMaxMult(resolveOwnerBonusy(ownerId));
    let empireMp = empireManpowerCurrent(cities, ownerId, epoka, maxMult);
    if (empireMp <= 0) continue;
    const sorted = [...ownerUnits].sort((a, b) => {
      const keyDiff = replenishmentUnitSortKey(a, cities) - replenishmentUnitSortKey(b, cities);
      return keyDiff !== 0 ? keyDiff : a.id.localeCompare(b.id);
    });
    for (const u of sorted) {
      if (isUnitInBesiegedLocation(u, cities)) continue;
      const maxHp = u.hpMax ?? getMaxHp(u.typeId);
      if (maxHp <= 0) continue;
      if (u.hpMax == null) u.hpMax = maxHp;
      const curHp = u.hp == null ? maxHp : u.hp;
      if (u.hp == null) u.hp = curHp;
      if (curHp <= 0 || curHp >= maxHp) continue;
      const unitCost = unitManpowerCostForType(u.typeId, epoka, maxMult);
      if (unitCost <= 0 || isScoutTypeId(u.typeId)) continue;
      const desiredHeal = manpowerHealCapForTurn(maxHp, curHp, params);
      if (desiredHeal <= 0) continue;
      const healHp = maxAffordableManpowerHeal(desiredHeal, maxHp, unitCost, empireMp);
      if (healHp <= 0) continue;
      const mpCost = manpowerCostForHeal(healHp, maxHp, unitCost);
      if (mpCost <= 0) continue;
      if (!deductManpowerFromEmpire(cities, ownerId, epoka, mpCost, maxMult)) continue;
      empireMp -= mpCost;
      totalMpSpent += mpCost;
      u.hp = Math.min(maxHp, curHp + healHp);
      healedCount++;
    }
  }
  return { healedCount, totalMpSpent };
}
function loadManpowerRegenParams(raw = miasto_params_default) {
  const pct = raw.manpower_regen_proc_max_tura?.wartosc;
  const block = raw.manpower_regen_blok_oblezenie?.wartosc;
  return {
    regenProcMaxPerTurn: typeof pct === "number" && pct >= 0 ? pct : DEFAULT_REGEN.regenProcMaxPerTurn,
    blockWhenBesieged: block === void 0 ? true : block !== 0
  };
}
function civManpowerRegenMult(bonusy) {
  let mult = 1;
  if (!bonusy?.length) return mult;
  for (const b of bonusy) {
    if (b.typ === "bonus_pobor_regen" && typeof b.wartosc === "number") {
      mult *= 1 + b.wartosc;
    } else if (b.typ === "mnoznik_pobor_regen" && typeof b.wartosc === "number") {
      mult *= b.wartosc;
    }
  }
  return Math.max(0.1, mult);
}
function civManpowerMaxMult(bonusy) {
  let mult = 1;
  if (!bonusy?.length) return mult;
  for (const b of bonusy) {
    if (b.typ === "bonus_pobor_pula" && typeof b.wartosc === "number") {
      mult *= 1 + b.wartosc;
    } else if (b.typ === "mnoznik_manpower_max" && typeof b.wartosc === "number") {
      mult *= b.wartosc;
    }
  }
  return Math.max(0.1, mult);
}
function civManpowerMults(bonusy) {
  return {
    regenMult: civManpowerRegenMult(bonusy),
    maxMult: civManpowerMaxMult(bonusy)
  };
}
function scaledManpower(base, maxMult) {
  return Math.floor(base * Math.max(0.1, maxMult));
}
function manpowerRegenGain(ludki, epoka, params = DEFAULT_REGEN, regenMult = 1, maxMult = 1) {
  const max = cityManpowerMax(ludki, epoka, maxMult);
  if (max <= 0 || params.regenProcMaxPerTurn <= 0) return 0;
  const pct = Math.min(100, params.regenProcMaxPerTurn) / 100;
  return Math.floor(max * pct * Math.max(0, regenMult));
}
function tickManpowerRegen(city, epoka, params = DEFAULT_REGEN, regenMult = 1, maxMult = 1) {
  const max = cityManpowerMax(city.population, epoka, maxMult);
  const cur = cityManpowerCurrent(city, epoka, maxMult);
  if (cur >= max) return max;
  if (params.blockWhenBesieged && city.oblegane) return cur;
  const gain = manpowerRegenGain(city.population, epoka, params, regenMult, maxMult);
  if (gain <= 0) return cur;
  return Math.min(max, cur + gain);
}
function epokaManpowerRow(epoka) {
  const e = Math.max(1, Math.min(MAX_EPOKA, Math.floor(epoka) || 1));
  return ROWS.find((r) => r.epoka === e) ?? ROWS[0];
}
function clampLudki(population) {
  return Math.max(1, Math.floor(population) || 1);
}
function cityLudnoscAbsolutna(ludki, epoka) {
  const row = epokaManpowerRow(epoka);
  return clampLudki(ludki) * row.ludekNaLudka;
}
function cityManpowerMax(ludki, epoka, maxMult = 1) {
  const row = epokaManpowerRow(epoka);
  return scaledManpower(clampLudki(ludki) * row.manpowerNaLudka, maxMult);
}
var SCOUT_TYPE_ID = "Zwiadowca";
function isScoutTypeId(typeId) {
  return typeId === SCOUT_TYPE_ID;
}
function unitManpowerCost(epoka, maxMult = 1) {
  return scaledManpower(epokaManpowerRow(epoka).manpowerNaJednostke, maxMult);
}
function unitManpowerCostForType(typeId, epoka, maxMult = 1) {
  if (isScoutTypeId(typeId)) return 0;
  return unitManpowerCost(epoka, maxMult);
}
function cityManpowerCurrent(city, epoka, maxMult = 1) {
  const max = cityManpowerMax(city.population, epoka, maxMult);
  if (city.manpower === void 0 || !Number.isFinite(city.manpower)) return max;
  return Math.max(0, Math.min(max, Math.floor(city.manpower)));
}
function empirePoborTotals(cities, ownerId, epoka, maxMult = 1) {
  let sumaLudkow = 0;
  let ludnoscAbsolutna = 0;
  let rekruci = 0;
  for (const c of cities) {
    if (c.ownerId !== ownerId) continue;
    sumaLudkow += clampLudki(c.population);
    ludnoscAbsolutna += cityLudnoscAbsolutna(c.population, epoka);
    rekruci += cityManpowerCurrent(c, epoka, maxMult);
  }
  return { sumaLudkow, ludnoscAbsolutna, rekruci, poborRaw: ludnoscAbsolutna + rekruci };
}
function empireManpowerCurrent(cities, ownerId, epoka, maxMult = 1) {
  return empirePoborTotals(cities, ownerId, epoka, maxMult).rekruci;
}
function deductManpowerFromEmpire(cities, ownerId, epoka, amount, maxMult = 1) {
  if (amount <= 0) return true;
  if (empireManpowerCurrent(cities, ownerId, epoka, maxMult) < amount) return false;
  let remaining = amount;
  const ownerCities = cities.filter((c) => c.ownerId === ownerId);
  const sorted = [...ownerCities].sort((a, b) => {
    const curDiff = cityManpowerCurrent(b, epoka, maxMult) - cityManpowerCurrent(a, epoka, maxMult);
    return curDiff !== 0 ? curDiff : a.id.localeCompare(b.id);
  });
  for (const c of sorted) {
    if (remaining <= 0) break;
    const cur = cityManpowerCurrent(c, epoka, maxMult);
    const take = Math.min(cur, remaining);
    if (take > 0) {
      c.manpower = cur - take;
      remaining -= take;
    }
  }
  return remaining <= 0;
}

// src/game/zloto-access.ts
var ZLOTO_STOCK_KEY = "zloto";
var ZLOTO_LABEL = "Z\u0142oto";
var MENNICA_ZLOTO_DRAIN_PER_TURN = 1;
function empireZlotoStock(empireStock) {
  if (!empireStock) return 0;
  const v = empireStock[ZLOTO_STOCK_KEY];
  return typeof v === "number" && Number.isFinite(v) && v > 0 ? v : 0;
}
function ownerCanFeedMennica(empireStock, graceActive = false) {
  if (graceActive) return true;
  return empireZlotoStock(empireStock) >= MENNICA_ZLOTO_DRAIN_PER_TURN;
}
function deductMennicaZlotoDrain(empireStock) {
  const current = empireStock[ZLOTO_STOCK_KEY] ?? 0;
  if (current < MENNICA_ZLOTO_DRAIN_PER_TURN) return { ...empireStock };
  return {
    ...empireStock,
    [ZLOTO_STOCK_KEY]: current - MENNICA_ZLOTO_DRAIN_PER_TURN
  };
}

// src/game/building-resource-gate.ts
var LABEL_BY_ASCII = {
  drewno: "Drewno",
  kamien: "Kamie\u0144",
  glina: "Glina",
  ruda: "Ruda",
  zelazo: "\u017Belazo",
  stal: "Stal",
  braz: "Br\u0105z",
  sol: "S\xF3l",
  cegla: "Ceg\u0142a",
  ceramika: "Ceramika",
  zloto: ZLOTO_LABEL,
  kon: "Ko\u0144"
};
var DEPOSIT_LINKED_BUILDING_LABELS = {
  garncarnia: ["Glina"],
  cegielnia: ["Glina"],
  // PYTANIE-84-U-24: Spichlerz I — brak bramki Ceramika przy budowie; drain B6 po postawieniu.
  // spichlerz — celowo brak wpisu (bonusy z drain co turę, patrz sekcja Spichlerz niżej).
  spichlerz_ii: ["S\xF3l"],
  stolarnia: ["Drewno"],
  kamieniarski: ["Kamie\u0144"],
  kuznia: ["Ruda"],
  odlewnia_brazu: ["Ruda"],
  // PYTANIE-84-R9/U-13 + DOSTEP-SUROWCE-Q1: Mennica — Złoto w magazynie państwa.
  mennica: [ZLOTO_LABEL]
};
var ASCII_BY_LABEL = Object.fromEntries(
  Object.entries(LABEL_BY_ASCII).map(([ascii, label]) => [label, ascii])
);
function buildingRequiredActiveLabels(building) {
  const out = /* @__PURE__ */ new Set();
  const hard = DEPOSIT_LINKED_BUILDING_LABELS[building.id];
  if (hard) hard.forEach((l) => out.add(l));
  const key = building.wymaganySurowiec?.trim().toLowerCase();
  if (key && LABEL_BY_ASCII[key]) out.add(LABEL_BY_ASCII[key]);
  return [...out];
}
var DEPOSIT_RUNTIME_GATED_BUILDING_IDS = Object.freeze(
  Object.keys(DEPOSIT_LINKED_BUILDING_LABELS)
);
var SPICHLERZ_RUNTIME_EXCLUDED = /* @__PURE__ */ new Set(["spichlerz", "spichlerz_ii"]);
function hasDepositRuntimeGate(buildingId) {
  if (SPICHLERZ_RUNTIME_EXCLUDED.has(buildingId)) return false;
  return Object.prototype.hasOwnProperty.call(DEPOSIT_LINKED_BUILDING_LABELS, buildingId);
}
function empireLabelSatisfiedAtRuntime(label, runtimeActiveBuiltIds, empireStock) {
  if (label === "Ceg\u0142a" && runtimeActiveBuiltIds.includes("cegielnia")) return true;
  if (label === "Ceramika" && runtimeActiveBuiltIds.includes("garncarnia")) return true;
  const asciiKey = ASCII_BY_LABEL[label];
  if (asciiKey && empireStock && (empireStock[asciiKey] ?? 0) > 0) return true;
  return false;
}
function mennicaRuntimeGateMet(empireStock, options) {
  if (options?.resolveOwnerZlotoAccess && options.ownerId !== void 0) {
    return options.resolveOwnerZlotoAccess(options.ownerId);
  }
  return ownerCanFeedMennica(empireStock);
}
function buildingRuntimeGateMet(building, activeLabels, runtimeActiveBuiltIds, empireStock, options) {
  if (building.id === "mennica") {
    return mennicaRuntimeGateMet(empireStock, options);
  }
  const required = buildingRequiredActiveLabels(building);
  if (required.length === 0) return true;
  return required.every(
    (label) => empireLabelSatisfiedAtRuntime(label, runtimeActiveBuiltIds, empireStock)
  );
}
function filterRuntimeActiveBuiltIds(builtIds, activeLabels, empireStock, options) {
  const active = /* @__PURE__ */ new Set();
  let changed = true;
  while (changed) {
    changed = false;
    for (const id of builtIds) {
      if (active.has(id)) continue;
      if (!hasDepositRuntimeGate(id)) {
        active.add(id);
        changed = true;
        continue;
      }
      if (buildingRuntimeGateMet(
        { id, epokaWejscia: 1 },
        activeLabels,
        [...active],
        empireStock,
        options
      )) {
        active.add(id);
        changed = true;
      }
    }
  }
  return [...active];
}
var SPICHLERZ_DRAIN_CERAMIKA_PER_TURN = 5;
var SPICHLERZ_DRAIN_SOL_PER_TURN = 5;
function paySpichlerzDrainForCity(cities, ownerId, builtIds, dryRun = false) {
  const hasI = builtIds.includes("spichlerz");
  const hasII = builtIds.includes("spichlerz_ii");
  if (!hasI && !hasII) return { ceramikaPaid: false, solPaid: false };
  let ceramikaPaid = false;
  let solPaid = false;
  if (ownerResourceStock(cities, ownerId, "ceramika") >= SPICHLERZ_DRAIN_CERAMIKA_PER_TURN) {
    if (!dryRun) {
      deductBuildingStockCostAcrossCities(cities, ownerId, {
        ceramika: SPICHLERZ_DRAIN_CERAMIKA_PER_TURN
      });
    }
    ceramikaPaid = true;
  }
  if (hasII && ownerResourceStock(cities, ownerId, "sol") >= SPICHLERZ_DRAIN_SOL_PER_TURN) {
    if (!dryRun) {
      deductBuildingStockCostAcrossCities(cities, ownerId, {
        sol: SPICHLERZ_DRAIN_SOL_PER_TURN
      });
    }
    solPaid = true;
  }
  return { ceramikaPaid, solPaid };
}
function resolveSpichlerzCityBonusState(builtIds, drain) {
  const hasII = builtIds.includes("spichlerz_ii");
  const hasI = builtIds.includes("spichlerz");
  if (!hasI && !hasII) {
    return {
      ceramikaActive: false,
      solActive: false,
      maSpichlerzPop: false,
      maSpichlerzIIPop: false
    };
  }
  const ceramikaActive = drain.ceramikaPaid;
  const solActive = hasII && drain.solPaid;
  const maSpichlerzIIPop = hasII && ceramikaActive && solActive;
  const maSpichlerzPop = ceramikaActive && !maSpichlerzIIPop;
  return { ceramikaActive, solActive, maSpichlerzPop, maSpichlerzIIPop };
}
function spichlerzHealthBonus(state) {
  if (state.maSpichlerzIIPop) return 10;
  if (state.maSpichlerzPop) return 5;
  return 0;
}
function spichlerzGrowthBonusPercent(state) {
  if (state.maSpichlerzIIPop) return 2;
  if (state.maSpichlerzPop) return 1;
  return 0;
}
function spichlerzRationFoodCostMultiplier(state) {
  if (state.maSpichlerzIIPop) return 0.5;
  if (state.maSpichlerzPop) return 0.75;
  return 1;
}
function builtIdsForSpichlerzYields(builtIds, state) {
  const effective = state.maSpichlerzIIPop ? "spichlerz_ii" : state.maSpichlerzPop ? "spichlerz" : null;
  const out = [];
  let spichlerzMapped = false;
  for (const id of builtIds) {
    if (id === "spichlerz" || id === "spichlerz_ii") {
      if (!spichlerzMapped && effective) {
        out.push(effective);
        spichlerzMapped = true;
      }
      continue;
    }
    out.push(id);
  }
  return out;
}

// src/game/unit-building-bonuses.ts
var ARMOR_PATH_MAX_PP = 45;
var SOFT_PATH_MAX_PP = 50;
var ARMOR_PATH_LEVEL_MAX_PP = [
  Math.floor(ARMOR_PATH_MAX_PP / 3),
  Math.floor(ARMOR_PATH_MAX_PP * 2 / 3)
];
var SOFT_PATH_LEVEL_MAX_PP = [
  Math.floor(SOFT_PATH_MAX_PP / 3),
  Math.floor(SOFT_PATH_MAX_PP * 2 / 3)
];

// src/game/production.ts
function buildingLevelForEpoch(epokaWejscia, cityEpoch, maksPoziom, poziomTechGate, unlockedTechs) {
  const lvl = Math.floor(cityEpoch) - Math.floor(epokaWejscia) + 1;
  const cap = Number.isFinite(maksPoziom) && maksPoziom > 0 ? Math.floor(maksPoziom) : 1;
  let level = Math.max(1, Math.min(cap, lvl));
  if (poziomTechGate) {
    const unlocked = unlockedTechs instanceof Set ? unlockedTechs : new Set(unlockedTechs ?? []);
    for (const [levelKey, techName] of Object.entries(poziomTechGate)) {
      const gateLevel = Number(levelKey);
      if (Number.isFinite(gateLevel) && level >= gateLevel && !unlocked.has(techName)) {
        level = Math.min(level, gateLevel - 1);
      }
    }
  }
  return level;
}
function buildingEffectAtLevel(baza, przyrost, level) {
  const n = Math.max(1, Math.floor(level));
  return baza + przyrost * (n - 1);
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
function cityPracaInteger(raw) {
  return Number.isFinite(raw) && raw > 0 ? Math.round(raw) : 0;
}
function splitPraca(cityPraca, udzialBudynki) {
  const total = cityPracaInteger(cityPraca);
  const u = Math.min(1, Math.max(0, Number.isFinite(udzialBudynki) ? udzialBudynki : 1));
  const doBudynkow = Math.round(total * u);
  return { doBudynkow, doPuli: total - doBudynkow };
}
var DEFAULT_OUTPUT_SHARES = Object.freeze({
  produkcja: miasto_params_default.udzial_output_produkcja?.wartosc ?? 0.4,
  pieniadz: miasto_params_default.udzial_output_pieniadz?.wartosc ?? 0.3,
  nauka: miasto_params_default.udzial_output_nauka?.wartosc ?? 0.2,
  rozwoj: miasto_params_default.udzial_output_rozwoj?.wartosc ?? 0.1
});

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
function readCityFoodBuffer(magazynZywnosci) {
  if (typeof magazynZywnosci === "number" && Number.isFinite(magazynZywnosci)) {
    return Math.max(0, magazynZywnosci);
  }
  if (magazynZywnosci && typeof magazynZywnosci === "object") {
    const a = magazynZywnosci.aktualny;
    if (typeof a === "number" && Number.isFinite(a)) return Math.max(0, a);
  }
  return 0;
}
var DEFAULT_OWNER_STORAGE_PARAMS = {
  bazaSurowcePanstwo: 1e3,
  bonusSurowceNaBudynek: 100
};
var OWNER_CAPPED_RESOURCE_KEYS = [
  "drewno",
  "kamien",
  "glina",
  "ruda",
  "ruda_zelaza",
  "cegla",
  "ceramika",
  "braz",
  "zelazo",
  "stal",
  "sol",
  "zloto",
  "kon"
];
var OWNER_CAPPED_RESOURCE_KEY_SET = new Set(OWNER_CAPPED_RESOURCE_KEYS);
function isOwnerCappedResourceKey(key) {
  return OWNER_CAPPED_RESOURCE_KEY_SET.has(key);
}
function loadOwnerStorageParams(raw, difficulty = "normal") {
  const g = raw.globalne;
  return {
    bazaSurowcePanstwo: readNum(g, "magazyn_baza_surowce", difficulty, DEFAULT_OWNER_STORAGE_PARAMS.bazaSurowcePanstwo),
    bonusSurowceNaBudynek: readNum(g, "magazyn_bonus_surowce_na_budynek", difficulty, DEFAULT_OWNER_STORAGE_PARAMS.bonusSurowceNaBudynek)
  };
}
function ownerResourceCapacityPerType(magazynCount, p = DEFAULT_OWNER_STORAGE_PARAMS) {
  const cnt = Number.isFinite(magazynCount) && magazynCount > 0 ? Math.floor(magazynCount) : 0;
  return p.bazaSurowcePanstwo + p.bonusSurowceNaBudynek * cnt;
}
function reconcileOwnerResourceCaps(cities, capForOwner) {
  const byOwner = /* @__PURE__ */ new Map();
  for (const c of cities) {
    if (!c.surowce) continue;
    const list = byOwner.get(c.ownerId) ?? [];
    list.push(c);
    byOwner.set(c.ownerId, list);
  }
  for (const [ownerId, ownerCities] of byOwner) {
    const cap = capForOwner(ownerId);
    if (!Number.isFinite(cap) || cap < 0) continue;
    const keys = /* @__PURE__ */ new Set();
    for (const c of ownerCities) {
      for (const k of Object.keys(c.surowce ?? {})) {
        if (isOwnerCappedResourceKey(k)) keys.add(k);
      }
    }
    for (const key of keys) {
      let total = 0;
      for (const c of ownerCities) total += c.surowce?.[key] ?? 0;
      let excess = total - cap;
      if (excess <= 0) continue;
      const holders = ownerCities.filter((c) => (c.surowce?.[key] ?? 0) > 0).sort((a, b) => {
        const diff = (b.surowce?.[key] ?? 0) - (a.surowce?.[key] ?? 0);
        if (diff !== 0) return diff;
        return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
      });
      for (const c of holders) {
        if (excess <= 0) break;
        const have = c.surowce?.[key] ?? 0;
        const take = Math.min(have, excess);
        c.surowce[key] = have - take;
        excess -= take;
      }
    }
  }
}
function loadUpkeepParams(raw, difficulty = "normal") {
  const em = raw.ekonomia_miasta;
  const bu = raw.budynki;
  const g = raw.globalne;
  return {
    budynekUtrzymanieFlat: readNum(bu, "utrzymanie_budynek", difficulty, 1),
    jednostkaUtrzymanieStd: readNum(g, "utrzymanie_jednostka_standard", difficulty, 1),
    zywnoscJednostkaRuch: readNum(em, "zywnosc_jednostka_ruch", difficulty, 1),
    zywnoscJednostkaOboz: readNum(em, "zywnosc_jednostka_oboz", difficulty, 0.5),
    zywnoscMnoznikTerytorium: readNum(em, "zywnosc_mnoznik_terytorium_wlasne", difficulty, 1),
    zywnoscMnoznikPozaTerytorium: readNum(em, "zywnosc_mnoznik_poza_terytorium", difficulty, 2)
  };
}
function buildingUpkeep(building, level, flatOverride) {
  const lvl = level >= 1 ? level : 1;
  let raw;
  if (!Number.isFinite(building.utrzymanie)) {
    raw = typeof flatOverride === "number" && Number.isFinite(flatOverride) ? flatOverride : 0;
  } else {
    const base = building.utrzymanie;
    const wzrost = Number.isFinite(building.przyrostUtrzymania) ? building.przyrostUtrzymania : 0;
    raw = Math.floor(buildingEffectAtLevel(base, wzrost, lvl));
  }
  return Math.floor(raw * R_STAWKI_FALA2_MULT);
}
function totalBuildingUpkeep(buildings, flatOverride) {
  let sum = 0;
  for (const b of buildings) {
    sum += buildingUpkeep(b.record, b.level, flatOverride);
  }
  return sum;
}
function buildingResourceUpkeep(building) {
  const raw = building?.koszt_surowce;
  if (!raw || typeof raw !== "object") return {};
  const out = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "number" && Number.isFinite(v) && v > 0) {
      out[k] = 1;
    }
  }
  return out;
}
function addResourceCosts(acc, add) {
  for (const [k, v] of Object.entries(add)) {
    if (typeof v === "number" && Number.isFinite(v) && v > 0) {
      acc[k] = (acc[k] ?? 0) + v;
    }
  }
}
function totalBuildingResourceUpkeep(buildings) {
  const out = {};
  for (const b of buildings) {
    addResourceCosts(out, buildingResourceUpkeep(
      b.record
    ));
  }
  return out;
}
function stripDiacriticsLower(s) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}
function unitResourceUpkeep(unitDef) {
  const out = {};
  if (!unitDef) return out;
  const rawName = (unitDef["Utrzymanie surowiec"] ?? "").toString().trim();
  if (!rawName || rawName === "-") return out;
  const ilosc = unitDef["Utrzymanie surowiec (ilo\u015B\u0107)"];
  if (typeof ilosc === "number" && Number.isFinite(ilosc) && ilosc > 0) {
    const key = stripDiacriticsLower(rawName);
    if (key) out[key] = ilosc;
  }
  return out;
}
function totalUnitResourceUpkeep(units, resolveDef) {
  const out = {};
  for (const u of units) {
    addResourceCosts(out, unitResourceUpkeep(resolveDef(u.typeId)));
  }
  return out;
}
var DEFAULT_UNIT_UPKEEP_BY_CATEGORY = {
  osadnik: 0,
  robotnik: 0,
  zwiadowca: 0,
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
  const byCat = DEFAULT_UNIT_UPKEEP_BY_CATEGORY[unit.category];
  if (typeof byCat === "number" && byCat === 0) return 0;
  let base;
  const byType = table[unit.typeId];
  if (typeof byType === "number" && Number.isFinite(byType)) base = byType;
  else if (typeof byCat === "number" && Number.isFinite(byCat)) base = byCat;
  else base = Number.isFinite(standardUpkeep) ? standardUpkeep : 0;
  if (base <= 0) return 0;
  return Math.round(base * R_STAWKI_FALA1_FALA2_MULT);
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

// data/terrain-yields.json
var terrain_yields_default = {
  terrain_types: [
    {
      Teren: "\u0141\u0105ka",
      \u017Bywno\u015B\u0107: 3,
      Praca: 1,
      Podatek: 2,
      Drewno: 1,
      Kamie\u0144: 0,
      Suma: 7,
      Uwagi: null
    },
    {
      Teren: "R\xF3wnina",
      \u017Bywno\u015B\u0107: 2,
      Praca: 2,
      Podatek: 1,
      Drewno: 2,
      Kamie\u0144: 1,
      Suma: 8,
      Uwagi: null
    },
    {
      Teren: "Wzg\xF3rza",
      \u017Bywno\u015B\u0107: 1,
      Praca: 3,
      Podatek: 0,
      Drewno: 2,
      Kamie\u0144: 2,
      Suma: 8,
      Uwagi: "Kamie\u0144/Ruda po zbudowaniu Kopalni; +obrona"
    },
    {
      Teren: "G\xF3ry",
      \u017Bywno\u015B\u0107: 0,
      Praca: 4,
      Podatek: 0,
      Drewno: 2,
      Kamie\u0144: 5,
      Suma: 11,
      Uwagi: "Nieprzechodnie dla jednostek l\u0105dowych; Kamie\u0144/Ruda po Kopalni"
    },
    {
      Teren: "Wybrze\u017Ce",
      \u017Bywno\u015B\u0107: 3,
      Praca: 2,
      Podatek: 2,
      Drewno: 0,
      Kamie\u0144: 0,
      Suma: 7,
      Uwagi: "Teren morski przy l\u0105dzie (osobny od rzeki); pod port"
    },
    {
      Teren: "Morze",
      \u017Bywno\u015B\u0107: 2,
      Praca: 0,
      Podatek: 2,
      Drewno: 0,
      Kamie\u0144: 0,
      Suma: 4,
      Uwagi: "Otwarta woda; rybo\u0142\xF3wstwo"
    },
    {
      Teren: "Pustynia",
      \u017Bywno\u015B\u0107: 0,
      Praca: 0,
      Podatek: 1,
      Drewno: 0,
      Kamie\u0144: 0,
      Suma: 1,
      Uwagi: null
    },
    {
      Teren: "Polarny",
      \u017Bywno\u015B\u0107: 0,
      Praca: 0,
      Podatek: 0,
      Drewno: 0,
      Kamie\u0144: 0,
      Suma: 0,
      Uwagi: "Strefa polarna (\u015Bnieg) \u2014 niezamieszkana, C-MAP-Q3b"
    }
  ],
  terrain_modifiers: [
    {
      Modyfikator: "Rzeka",
      \u017Bywno\u015B\u0107: 3,
      Praca: 2,
      Podatek: 3,
      Drewno: 0,
      Kamie\u0144: 0,
      Glina: 2,
      Suma: 10,
      Uwagi: "Dodaje bonus do DOWOLNEGO pola z rzek\u0105; +2 glina (szt./tur\u0119) przy rzece \u2014 plon produkcji (R-HEX-PLONY-MAGAZYN B, Maciej 2026-07-29); razem +10 z glin\u0105"
    },
    {
      Modyfikator: "Las (nak\u0142adka)",
      \u017Bywno\u015B\u0107: -1,
      Praca: 3,
      Podatek: 2,
      Drewno: 3,
      Kamie\u0144: 0,
      Glina: 0,
      Suma: 7,
      Uwagi: "Pod lasem zawsze jest teren bazowy; las: \u2212\u017Cywno\u015B\u0107, +handel (+2), +praca (+3), +drewno \u2014 bez wzgl\u0119du na \u{1F464}/jednostk\u0119"
    }
  ]
};

// src/game/economy.ts
var ZERO_YIELD = { zywnosc: 0, praca: 0, handel: 0, drewno: 0, kamien: 0, glina: 0, ruda: 0, ruda_zelaza: 0 };
var TERRAIN_NAME_TO_ENUM = {
  "\u0141\u0105ka": "laka" /* Laka */,
  "R\xF3wnina": "rownina" /* Rownina */,
  "Wzg\xF3rza": "wzgorza" /* Wzgorza */,
  "G\xF3ry": "gory" /* Gory */,
  "Wybrze\u017Ce": "wybrzeze" /* Wybrzeze */,
  "Morze": "morze" /* Morze */,
  "Pustynia": "pustynia" /* Pustynia */,
  "Polarny": "polarny" /* Polarny */
};
function terrainRowToTileYield(row) {
  return {
    zywnosc: Number(row["\u017Bywno\u015B\u0107"] ?? 0),
    praca: Number(row["Praca"] ?? 0),
    handel: Number(row["Podatek"] ?? row["Handel"] ?? 0),
    drewno: Number(row["Drewno"] ?? 0),
    kamien: Number(row["Kamie\u0144"] ?? 0),
    glina: Number(row.Glina ?? 0),
    ruda: 0,
    ruda_zelaza: 0
  };
}
function buildTerrainYields() {
  const out = {};
  for (const row of terrain_yields_default.terrain_types) {
    const key = TERRAIN_NAME_TO_ENUM[row.Teren];
    if (key) out[key] = terrainRowToTileYield(row);
  }
  return out;
}
function terrainModifier(name) {
  const row = terrain_yields_default.terrain_modifiers.find((m) => m["Modyfikator"] === name);
  return row ? terrainRowToTileYield(row) : ZERO_YIELD;
}
var TERRAIN_YIELDS = buildTerrainYields();
var RIVER_MODIFIER = terrainModifier("Rzeka");
var FOREST_MODIFIER = terrainModifier("Las (nak\u0142adka)");
function tileYield(tile) {
  const base = TERRAIN_YIELDS[tile.terenBazowy] ?? ZERO_YIELD;
  let zywnosc = base.zywnosc;
  let praca = base.praca;
  let handel = base.handel;
  let drewno = base.drewno;
  let kamien = base.kamien;
  let glina = base.glina;
  let ruda = 0;
  let ruda_zelaza = 0;
  if (tile.nakladka === "las" /* Las */) {
    zywnosc += FOREST_MODIFIER.zywnosc;
    praca += FOREST_MODIFIER.praca;
    handel += FOREST_MODIFIER.handel;
    drewno += FOREST_MODIFIER.drewno;
  }
  if (tile.maRzeke) {
    zywnosc += RIVER_MODIFIER.zywnosc;
    praca += RIVER_MODIFIER.praca;
    handel += RIVER_MODIFIER.handel;
    glina += RIVER_MODIFIER.glina;
  }
  const out = {
    zywnosc: Math.max(0, zywnosc),
    praca: Math.max(0, praca),
    handel: Math.max(0, handel),
    drewno: Math.max(0, drewno),
    kamien: Math.max(0, kamien),
    glina: Math.max(0, glina),
    ruda: 0,
    ruda_zelaza: 0
  };
  const impKeys = tile.ulepszeniaKeys?.length ? tile.ulepszeniaKeys : tile.ulepszenieKey ? [tile.ulepszenieKey] : [];
  if (impKeys.length) {
    applyImprovementBonuses(out, impKeys);
    out.zywnosc = Math.max(0, out.zywnosc);
    out.praca = Math.max(0, out.praca);
    out.handel = Math.max(0, out.handel);
    out.drewno = Math.max(0, out.drewno);
    out.kamien = Math.max(0, out.kamien);
    out.glina = Math.max(0, out.glina);
    const ore = oreYieldFromImprovements(impKeys, tile.zloze);
    out.ruda += ore.ruda;
    out.ruda_zelaza += ore.ruda_zelaza;
  }
  return out;
}
function buildingValue(b, level, key) {
  return Math.floor(buildingEffectAtLevel(b.baza[key], b.przyrost[key], level));
}
var BUILDING_HAPPINESS_BASE_PER_BUILDING = 1;
function buildingHappinessAtLevel(b, level) {
  const extra = typeof b.baza.zadowolenie === "number" && b.baza.zadowolenie !== 0 ? buildingValue(b, level, "zadowolenie") : 0;
  return BUILDING_HAPPINESS_BASE_PER_BUILDING + extra;
}
function cityBuildingEntriesFromBuiltIds(builtIds, catalog, cityEpoch, unlockedTechs) {
  const entries = [];
  for (const bid of builtIds) {
    const record = catalog.find((b) => b.id === bid);
    if (!record) continue;
    const level = buildingLevelForEpoch(
      record.epokaWejscia,
      cityEpoch,
      record.maksPoziom,
      record.poziomTechGate,
      unlockedTechs
    );
    entries.push({ record, level });
  }
  return entries;
}
function mnoznikHandelPieniadzRawForCiv(civKey, civs) {
  if (!civKey || !civs?.cywilizacje?.length) return void 0;
  const key = civKey.toLowerCase();
  for (const row of civs.cywilizacje) {
    if (!row) continue;
    const ids = [row.ikonaId, row.typCywilizacji, row.Cywilizacja].filter((s) => typeof s === "string" && s.length > 0).map((s) => s.toLowerCase());
    if (!ids.includes(key)) continue;
    const v = row.mnoznikHandelPieniadz;
    return typeof v === "number" && Number.isFinite(v) && v > 0 ? v : void 0;
  }
  return void 0;
}
var MNOZNIK_HANDEL_TRUDNOSC_DELTA = {
  easy: 0.5,
  normal: 0,
  hard: -0.5
};
function mnoznikHandelPieniadzForCivByDifficulty(civKey, civs, difficulty, fallbackScaled) {
  const raw = mnoznikHandelPieniadzRawForCiv(civKey, civs);
  if (raw === void 0) return fallbackScaled;
  return raw + (MNOZNIK_HANDEL_TRUDNOSC_DELTA[difficulty] ?? 0);
}
function civBonusyForCivKey(civKey, civs) {
  if (!civKey || !civs?.cywilizacje?.length) return [];
  const key = civKey.toLowerCase();
  for (const row of civs.cywilizacje) {
    if (!row) continue;
    const ids = [row.ikonaId, row.typCywilizacji, row.Cywilizacja].filter((s) => typeof s === "string" && s.length > 0).map((s) => s.toLowerCase());
    if (ids.includes(key)) return row.bonusy ?? [];
  }
  return [];
}
function civEconomyYieldMultipliers(bonusy) {
  let handel = 1;
  let nauka = 1;
  if (!bonusy?.length) return { handel, nauka };
  for (const b of bonusy) {
    if (b.realizuje !== "ekonomia") continue;
    if (b.typ === "bonus_zloto" && b.cel === "handel" && typeof b.wartosc === "number") {
      handel += b.wartosc;
    }
    if (b.typ === "bonus_nauka" && typeof b.wartosc === "number") {
      nauka += b.wartosc;
    }
  }
  return { handel, nauka };
}
function cityYieldPerTurn(city, workedTiles, cityBuildings, params, ctx) {
  let zywnoscTerenu = 0;
  let pracaTerenu = 0;
  let handelTerenu = 0;
  let drewnoTerenu = 0;
  let kamienTerenu = 0;
  let glinaTerenu = 0;
  let rudaTerenu = 0;
  let rudaZelazaTerenu = 0;
  for (const tile of workedTiles) {
    const y = tileYield(tile);
    zywnoscTerenu += y.zywnosc;
    pracaTerenu += y.praca;
    handelTerenu += y.handel;
    drewnoTerenu += y.drewno;
    kamienTerenu += y.kamien;
    glinaTerenu += y.glina;
    rudaTerenu += y.ruda;
    rudaZelazaTerenu += y.ruda_zelaza;
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
    zadBudynkow += buildingHappinessAtLevel(record, level);
  }
  const pracaBruttoLacznie = pracaBruttoTerenu + pracaBudynkow;
  const pracaNetto = pracaBruttoLacznie;
  const walutaOdkrytaOnly = ctx.walutaOdkryta === true;
  const pctPracaBudynki = city.podzia\u0142Pracy.procentBudynki / 100;
  const pracaInt = cityPracaInteger(pracaNetto);
  const { doPuli } = splitPraca(pracaInt, pctPracaBudynki);
  const pieniadzZPracy = ctx.maTargowisko && walutaOdkrytaOnly ? Math.floor(doPuli * params.targowiskoPracaMnoznik) : 0;
  const handelBazowy = handelTerenu + pieniadzZPracy + pieniadzBudynkow;
  let handelBrutto;
  if (ctx.maTargowisko) {
    handelBrutto = handelBazowy * (1 + params.budynekTargowiskoBonusHandlu);
  } else {
    handelBrutto = handelBazowy;
  }
  const civHandelMult = ctx.civHandelMult ?? 1;
  if (civHandelMult !== 1) {
    handelBrutto *= civHandelMult;
  }
  const liczbaTrasHandlowych = ctx.liczbaAktywnychTrasHandlowych ?? 0;
  if (liczbaTrasHandlowych > 0) {
    handelBrutto *= 1 + 0.05 * liczbaTrasHandlowych;
  }
  const strata = Math.min(ctx.strataFraction, params.korupcjaCap);
  const handelNettoRaw = handelBrutto * (1 - strata);
  const walutaActive = walutaOdkrytaOnly && ctx.maMennica === true;
  const walutaMnoznikBase = ctx.walutaMnoznikOverride ?? params.mennicaMnoznikPoWalucie;
  const walutaMnoznikAktywny = walutaActive ? walutaMnoznikBase : 1;
  const handelNetto = handelNettoRaw * walutaMnoznikAktywny;
  const pctNauka = city.podzia\u0142Handlu.procentNauka / 100;
  const pctPieniadz = city.podzia\u0142Handlu.procentPieniadz / 100;
  const pctLuksus = city.podzia\u0142Handlu.procentLuksus / 100;
  const naukaZHandlu = Math.floor(handelNetto * pctNauka);
  const pieniadzZHandlu = Math.floor(handelNetto * pctPieniadz);
  const luksusZHandlu = Math.floor(handelNetto * pctLuksus);
  const naukaBonusFactor = 1 + (ctx.maBiblioteka ? params.budynekBibliotekaBonusNauki : 0) + (ctx.maAkademia ? params.budynekAkademiaBonusNauki : 0);
  const naukaLokalnaRaw = Math.floor((naukaZHandlu + naukaBudynkow) * naukaBonusFactor);
  const civNaukaMult = ctx.civNaukaMult ?? 1;
  const naukaLokalna = civNaukaMult !== 1 ? Math.floor(naukaLokalnaRaw * civNaukaMult) : naukaLokalnaRaw;
  let pieniadzTotal = pieniadzZHandlu;
  for (const spec of city.specjalisci) {
    if (spec === "poborca") {
      pieniadzTotal += 2;
    }
  }
  const zywnoscBruttoBaza = zywnoscTerenu + zywnoscBudynkow;
  const liczbaGarncarni = ctx.liczbaGarncarni ?? 0;
  const garncarniaMnoznikZywnosci = 1 + params.budynekGarncarniaBonusZywnosci * liczbaGarncarni;
  const zywnoscBrutto = zywnoscBruttoBaza * garncarniaMnoznikZywnosci;
  const zywnoscZuzyta = city.ludnosc * params.zywnoscZuzytkaPopulacja + ctx.wojskoZuzycieZywnosci;
  const zywnoscNetto = zywnoscBrutto - zywnoscZuzyta;
  return {
    praca: pracaInt,
    pieniadz: Math.floor(pieniadzTotal),
    zywnosc: Math.floor(zywnoscNetto),
    nauka: naukaLokalna,
    luksus: luksusZHandlu,
    kultura: Math.floor(kulturaBudynkow),
    zadowolenie: Math.floor(zadBudynkow),
    zywnoscBrutto: Math.floor(zywnoscBrutto),
    handelBrutto: Math.floor(handelBrutto),
    pracaTerenu: Math.floor(pracaBruttoTerenu),
    pracaBudynkow: Math.floor(pracaBudynkow),
    pieniadzZPracy,
    pieniadzBudynkow: Math.floor(pieniadzBudynkow),
    drewnoTerenu: Math.floor(drewnoTerenu),
    kamienTerenu: Math.floor(kamienTerenu),
    glinaTerenu: Math.floor(glinaTerenu),
    rudaTerenu: Math.floor(rudaTerenu),
    rudaZelazaTerenu: Math.floor(rudaZelazaTerenu)
  };
}
function corruptionRate(dystansOdStolicy, liczbaWszystkichMiast, params) {
  const strataPct = dystansOdStolicy * params.korupcjaWspolczynnikDystansu + liczbaWszystkichMiast * params.korupcjaWspolczynnikMiast;
  const capPct = params.korupcjaCap * 100;
  return Math.min(capPct, strataPct) / 100;
}
var KORUPCJA_REDUKCJA_BUDYNKI = ["sad", "pretorium", "palac"];
var KORUPCJA_REDUKCJA_NA_BUDYNEK = 0.3;
var KORUPCJA_REDUKCJA_SUFIT = 0.6;
function corruptionBuildingReduction(builtIds) {
  let suma = 0;
  for (const id of KORUPCJA_REDUKCJA_BUDYNKI) {
    if (builtIds.includes(id)) suma += KORUPCJA_REDUKCJA_NA_BUDYNEK;
  }
  return Math.min(KORUPCJA_REDUKCJA_SUFIT, suma);
}

// data/civ-matrix.json
var civ_matrix_default = {
  _meta: {
    version: "1.0",
    source: "Cyw-macierz (11 arkuszy Cyw-01..11)",
    formula_mul_proc: "wynik = baza * (1 + wartosc)",
    formula_mul_abs: "wynik = baza * wartosc",
    formula_add: "wynik = baza + wartosc",
    formula_flag: "wartosc 1 = aktywny warunek",
    kolumny: 113,
    cywilizacje: 15
  },
  paramDefs: {
    meta_epoka_kamien: {
      domena: "meta",
      jednostka: "flag_0_1",
      modul: "start-preview.ts",
      formula: "flag"
    },
    meta_epoka_braz: {
      domena: "meta",
      jednostka: "flag_0_1",
      modul: "start-preview.ts",
      formula: "flag"
    },
    meta_epoka_zelazo: {
      domena: "meta",
      jednostka: "flag_0_1",
      modul: "start-preview.ts",
      formula: "flag"
    },
    meta_mnoznik_waluta: {
      domena: "meta",
      jednostka: "absolut",
      modul: "economy.ts",
      formula: "mul_abs"
    },
    meta_tier_roster: {
      domena: "meta",
      jednostka: "absolut",
      modul: "civ-roster.ts",
      formula: "mul_abs"
    },
    walka_atak_piechota: {
      domena: "walka",
      jednostka: "ulamek",
      modul: "civ-bonuses.ts",
      formula: "mul_proc"
    },
    walka_atak_lukownicy: {
      domena: "walka",
      jednostka: "ulamek",
      modul: "civ-bonuses.ts",
      formula: "mul_proc"
    },
    walka_atak_kawaleria: {
      domena: "walka",
      jednostka: "ulamek",
      modul: "civ-bonuses.ts",
      formula: "mul_proc"
    },
    walka_atak_rydwany: {
      domena: "walka",
      jednostka: "ulamek",
      modul: "civ-bonuses.ts",
      formula: "mul_proc"
    },
    walka_atak_obleczenie: {
      domena: "walka",
      jednostka: "ulamek",
      modul: "civ-bonuses.ts",
      formula: "mul_proc"
    },
    walka_atak_morska: {
      domena: "walka",
      jednostka: "ulamek",
      modul: "civ-bonuses.ts",
      formula: "mul_proc"
    },
    walka_atak_wszystkie: {
      domena: "walka",
      jednostka: "ulamek",
      modul: "civ-bonuses.ts",
      formula: "mul_proc"
    },
    walka_obrona_piechota: {
      domena: "walka",
      jednostka: "ulamek",
      modul: "civ-bonuses.ts",
      formula: "mul_proc"
    },
    walka_obrona_lukownicy: {
      domena: "walka",
      jednostka: "ulamek",
      modul: "civ-bonuses.ts",
      formula: "mul_proc"
    },
    walka_obrona_kawaleria: {
      domena: "walka",
      jednostka: "ulamek",
      modul: "civ-bonuses.ts",
      formula: "mul_proc"
    },
    walka_obrona_rydwany: {
      domena: "walka",
      jednostka: "ulamek",
      modul: "civ-bonuses.ts",
      formula: "mul_proc"
    },
    walka_obrona_obleczenie: {
      domena: "walka",
      jednostka: "ulamek",
      modul: "civ-bonuses.ts",
      formula: "mul_proc"
    },
    walka_obrona_morska: {
      domena: "walka",
      jednostka: "ulamek",
      modul: "civ-bonuses.ts",
      formula: "mul_proc"
    },
    walka_pancerz_piechota: {
      domena: "walka",
      jednostka: "ulamek",
      modul: "civ-bonuses.ts",
      formula: "mul_proc"
    },
    walka_pancerz_lukownicy: {
      domena: "walka",
      jednostka: "ulamek",
      modul: "civ-bonuses.ts",
      formula: "mul_proc"
    },
    walka_pancerz_kawaleria: {
      domena: "walka",
      jednostka: "ulamek",
      modul: "civ-bonuses.ts",
      formula: "mul_proc"
    },
    walka_pancerz_rydwany: {
      domena: "walka",
      jednostka: "ulamek",
      modul: "civ-bonuses.ts",
      formula: "mul_proc"
    },
    walka_uderzenie_piechota: {
      domena: "walka",
      jednostka: "ulamek",
      modul: "civ-bonuses.ts",
      formula: "mul_proc"
    },
    walka_uderzenie_kawaleria: {
      domena: "walka",
      jednostka: "ulamek",
      modul: "civ-bonuses.ts",
      formula: "mul_proc"
    },
    walka_uderzenie_rydwany: {
      domena: "walka",
      jednostka: "ulamek",
      modul: "civ-bonuses.ts",
      formula: "mul_proc"
    },
    walka_dystans_lukownicy: {
      domena: "walka",
      jednostka: "ulamek",
      modul: "civ-bonuses.ts",
      formula: "mul_proc"
    },
    walka_dystans_rydwany: {
      domena: "walka",
      jednostka: "ulamek",
      modul: "civ-bonuses.ts",
      formula: "mul_proc"
    },
    walka_hp_piechota: {
      domena: "walka",
      jednostka: "ulamek",
      modul: "civ-bonuses.ts",
      formula: "mul_proc"
    },
    walka_hp_kawaleria: {
      domena: "walka",
      jednostka: "ulamek",
      modul: "civ-bonuses.ts",
      formula: "mul_proc"
    },
    walka_hp_rydwany: {
      domena: "walka",
      jednostka: "ulamek",
      modul: "civ-bonuses.ts",
      formula: "mul_proc"
    },
    walka_ruch_bitwa_proc: {
      domena: "walka",
      jednostka: "ulamek",
      modul: "civ-bonuses.ts",
      formula: "mul_proc"
    },
    walka_zasieg_proc: {
      domena: "walka",
      jednostka: "ulamek",
      modul: "civ-bonuses.ts",
      formula: "mul_proc"
    },
    walka_oblezenie_proc: {
      domena: "walka",
      jednostka: "ulamek",
      modul: "civ-bonuses.ts",
      formula: "mul_proc"
    },
    walka_koszt_rekrutacji_proc: {
      domena: "walka",
      jednostka: "ulamek",
      modul: "production.ts",
      formula: "mul_proc"
    },
    walka_atak_piechota_teren_las: {
      domena: "walka",
      jednostka: "ulamek",
      modul: "civ-bonuses.ts",
      formula: "mul_proc"
    },
    walka_obrona_piechota_teren_las: {
      domena: "walka",
      jednostka: "ulamek",
      modul: "civ-bonuses.ts",
      formula: "mul_proc"
    },
    walka_atak_piechota_terytorium_wlasne: {
      domena: "walka",
      jednostka: "ulamek",
      modul: "civ-bonuses.ts",
      formula: "mul_proc"
    },
    walka_obrona_piechota_terytorium_wlasne: {
      domena: "walka",
      jednostka: "ulamek",
      modul: "civ-bonuses.ts",
      formula: "mul_proc"
    },
    walka_atak_piechota_w_murze: {
      domena: "walka",
      jednostka: "ulamek",
      modul: "civ-bonuses.ts",
      formula: "mul_proc"
    },
    walka_obrona_piechota_w_murze: {
      domena: "walka",
      jednostka: "ulamek",
      modul: "civ-bonuses.ts",
      formula: "mul_proc"
    },
    walka_atak_piechota_runda_szarzy: {
      domena: "walka",
      jednostka: "ulamek",
      modul: "civ-bonuses.ts",
      formula: "mul_proc"
    },
    walka_obrona_piechota_runda_szarzy: {
      domena: "walka",
      jednostka: "ulamek",
      modul: "civ-bonuses.ts",
      formula: "mul_proc"
    },
    walka_atak_piechota_teren_wybrzeze: {
      domena: "walka",
      jednostka: "ulamek",
      modul: "civ-bonuses.ts",
      formula: "mul_proc"
    },
    walka_obrona_piechota_teren_wybrzeze: {
      domena: "walka",
      jednostka: "ulamek",
      modul: "civ-bonuses.ts",
      formula: "mul_proc"
    },
    spec_Atak: {
      domena: "jednostka_spec",
      jednostka: "absolut",
      modul: "units.json+combat.ts",
      formula: "stat_abs"
    },
    spec_Obrazenia: {
      domena: "jednostka_spec",
      jednostka: "absolut",
      modul: "units.json+combat.ts",
      formula: "stat_abs"
    },
    spec_Obrona: {
      domena: "jednostka_spec",
      jednostka: "absolut",
      modul: "units.json+combat.ts",
      formula: "stat_abs"
    },
    spec_Uderzenie: {
      domena: "jednostka_spec",
      jednostka: "absolut",
      modul: "units.json+combat.ts",
      formula: "stat_abs"
    },
    spec_Pancerz: {
      domena: "jednostka_spec",
      jednostka: "absolut",
      modul: "units.json+combat.ts",
      formula: "stat_abs"
    },
    spec_Przebicie: {
      domena: "jednostka_spec",
      jednostka: "absolut",
      modul: "units.json+combat.ts",
      formula: "stat_abs"
    },
    spec_Health: {
      domena: "jednostka_spec",
      jednostka: "absolut",
      modul: "units.json+combat.ts",
      formula: "stat_abs"
    },
    spec_Atak_dystansowy: {
      domena: "jednostka_spec",
      jednostka: "absolut",
      modul: "units.json+combat.ts",
      formula: "stat_abs"
    },
    spec_Zasieg_hex: {
      domena: "jednostka_spec",
      jednostka: "absolut",
      modul: "units.json+combat.ts",
      formula: "stat_abs"
    },
    spec_Pociski: {
      domena: "jednostka_spec",
      jednostka: "absolut",
      modul: "units.json+combat.ts",
      formula: "stat_abs"
    },
    spec_Ruch_bitwa: {
      domena: "jednostka_spec",
      jednostka: "absolut",
      modul: "units.json+combat.ts",
      formula: "stat_abs"
    },
    spec_Ruch_mapa: {
      domena: "jednostka_spec",
      jednostka: "absolut",
      modul: "units.json+combat.ts",
      formula: "stat_abs"
    },
    spec_Widok: {
      domena: "jednostka_spec",
      jednostka: "absolut",
      modul: "units.json+combat.ts",
      formula: "stat_abs"
    },
    spec_Dezercja_proc: {
      domena: "jednostka_spec",
      jednostka: "absolut",
      modul: "units.json+combat.ts",
      formula: "stat_abs"
    },
    spec_Morale: {
      domena: "jednostka_spec",
      jednostka: "absolut",
      modul: "units.json+combat.ts",
      formula: "stat_abs"
    },
    spec_Koszt_pieniadz: {
      domena: "jednostka_spec",
      jednostka: "absolut",
      modul: "units.json+combat.ts",
      formula: "stat_abs"
    },
    spec_Utrzymanie: {
      domena: "jednostka_spec",
      jednostka: "absolut",
      modul: "units.json+combat.ts",
      formula: "stat_abs"
    },
    spec_Zywnosc_ture: {
      domena: "jednostka_spec",
      jednostka: "absolut",
      modul: "units.json+combat.ts",
      formula: "stat_abs"
    },
    eko_praca_proc: {
      domena: "ekonomia",
      jednostka: "ulamek",
      modul: "economy.ts",
      formula: "mul_proc"
    },
    eko_pieniadz_proc: {
      domena: "ekonomia",
      jednostka: "ulamek",
      modul: "economy.ts",
      formula: "mul_proc"
    },
    eko_pieniadz_port_proc: {
      domena: "ekonomia",
      jednostka: "ulamek",
      modul: "economy.ts",
      formula: "mul_proc"
    },
    eko_zywnosc_proc: {
      domena: "ekonomia",
      jednostka: "ulamek",
      modul: "economy.ts",
      formula: "mul_proc"
    },
    eko_nauka_proc: {
      domena: "ekonomia",
      jednostka: "ulamek",
      modul: "economy.ts",
      formula: "mul_proc"
    },
    eko_kultura_proc: {
      domena: "ekonomia",
      jednostka: "ulamek",
      modul: "economy.ts",
      formula: "mul_proc"
    },
    eko_luksus_proc: {
      domena: "ekonomia",
      jednostka: "ulamek",
      modul: "economy.ts",
      formula: "mul_proc"
    },
    eko_zadowolenie_proc: {
      domena: "ekonomia",
      jednostka: "ulamek",
      modul: "economy.ts",
      formula: "mul_proc"
    },
    eko_handel_brutto_proc: {
      domena: "ekonomia",
      jednostka: "ulamek",
      modul: "economy.ts",
      formula: "mul_proc"
    },
    eko_korupcja_proc: {
      domena: "ekonomia",
      jednostka: "ulamek",
      modul: "economy.ts",
      formula: "mul_proc"
    },
    prod_koszt_budynku_proc: {
      domena: "produkcja",
      jednostka: "ulamek",
      modul: "civ-bonuses.ts",
      formula: "mul_proc"
    },
    prod_koszt_jednostki_proc: {
      domena: "produkcja",
      jednostka: "ulamek",
      modul: "production.ts",
      formula: "mul_proc"
    },
    prod_szybkosc_budynku_proc: {
      domena: "produkcja",
      jednostka: "ulamek",
      modul: "production.ts",
      formula: "mul_proc"
    },
    prod_szybkosc_jednostki_proc: {
      domena: "produkcja",
      jednostka: "ulamek",
      modul: "production.ts",
      formula: "mul_proc"
    },
    prod_rush_koszt_proc: {
      domena: "produkcja",
      jednostka: "ulamek",
      modul: "production.ts",
      formula: "mul_proc"
    },
    lud_wzrost_proc: {
      domena: "ludnosc",
      jednostka: "ulamek",
      modul: "economy.ts",
      formula: "mul_proc"
    },
    lud_spadek_proc: {
      domena: "ludnosc",
      jednostka: "ulamek",
      modul: "economy.ts",
      formula: "mul_proc"
    },
    lud_zdrowie_proc: {
      domena: "ludnosc",
      jednostka: "ulamek",
      modul: "turn-economy.ts",
      formula: "mul_proc"
    },
    lud_zadowolenie_bazowe: {
      domena: "ludnosc",
      jednostka: "absolut",
      modul: "culture-religion.ts",
      formula: "add"
    },
    lud_limit_populacji: {
      domena: "ludnosc",
      jednostka: "absolut",
      modul: "cities.ts",
      formula: "add"
    },
    mp_regen_proc: {
      domena: "manpower",
      jednostka: "ulamek",
      modul: "manpower.ts",
      formula: "mul_proc"
    },
    mp_max_proc: {
      domena: "manpower",
      jednostka: "ulamek",
      modul: "manpower.ts",
      formula: "mul_proc"
    },
    mp_koszt_jednostki_proc: {
      domena: "manpower",
      jednostka: "ulamek",
      modul: "manpower.ts",
      formula: "mul_proc"
    },
    wealth_cap_proc: {
      domena: "spoleczenstwo",
      jednostka: "ulamek",
      modul: "wealth.ts",
      formula: "mul_proc"
    },
    wealth_mnoznik_proc: {
      domena: "spoleczenstwo",
      jednostka: "ulamek",
      modul: "wealth.ts",
      formula: "mul_proc"
    },
    kultura_naplyw_proc: {
      domena: "spoleczenstwo",
      jednostka: "ulamek",
      modul: "culture-religion.ts",
      formula: "mul_proc"
    },
    religia_spread_proc: {
      domena: "spoleczenstwo",
      jednostka: "ulamek",
      modul: "culture-religion.ts",
      formula: "mul_proc"
    },
    porzadek_produkcja_proc: {
      domena: "spoleczenstwo",
      jednostka: "ulamek",
      modul: "order.ts",
      formula: "mul_proc"
    },
    porzadek_pieniadz_proc: {
      domena: "spoleczenstwo",
      jednostka: "ulamek",
      modul: "order.ts",
      formula: "mul_proc"
    },
    porzadek_nauka_proc: {
      domena: "spoleczenstwo",
      jednostka: "ulamek",
      modul: "order.ts",
      formula: "mul_proc"
    },
    porzadek_kultura_proc: {
      domena: "spoleczenstwo",
      jednostka: "ulamek",
      modul: "order.ts",
      formula: "mul_proc"
    },
    porzadek_wzrost_proc: {
      domena: "spoleczenstwo",
      jednostka: "ulamek",
      modul: "order.ts",
      formula: "mul_proc"
    },
    obl_obrona_miasta_proc: {
      domena: "obleczenie",
      jednostka: "ulamek",
      modul: "siege.ts",
      formula: "mul_proc"
    },
    obl_mur_proc: {
      domena: "obleczenie",
      jednostka: "ulamek",
      modul: "siege.ts",
      formula: "mul_proc"
    },
    obl_machines_proc: {
      domena: "obleczenie",
      jednostka: "ulamek",
      modul: "siegeMachines.ts",
      formula: "mul_proc"
    },
    dip_sklonnosc_sojusze: {
      domena: "dyplomacja",
      jednostka: "skala_1_10",
      modul: "diplomacy.ts",
      formula: "skala"
    },
    dip_lojalnosc: {
      domena: "dyplomacja",
      jednostka: "skala_1_10",
      modul: "diplomacy.ts",
      formula: "skala"
    },
    dip_prog_wojny: {
      domena: "dyplomacja",
      jednostka: "skala_1_10",
      modul: "diplomacy.ts",
      formula: "skala"
    },
    dip_pamietliwosc: {
      domena: "dyplomacja",
      jednostka: "skala_1_10",
      modul: "diplomacy.ts",
      formula: "skala"
    },
    dip_otwartosc_handel: {
      domena: "dyplomacja",
      jednostka: "skala_1_10",
      modul: "diplomacy.ts",
      formula: "skala"
    },
    dip_nastawienie_bazowe: {
      domena: "dyplomacja",
      jednostka: "absolut",
      modul: "diplomacy.ts",
      formula: "add"
    },
    dip_agresja_archetyp: {
      domena: "dyplomacja",
      jednostka: "ulamek_0_1",
      modul: "diplomacy.ts",
      formula: "mul_abs"
    },
    dip_handlowosc_archetyp: {
      domena: "dyplomacja",
      jednostka: "ulamek_0_1",
      modul: "diplomacy.ts",
      formula: "mul_abs"
    },
    ai_agresywnosc: {
      domena: "ai",
      jednostka: "skala_1_10",
      modul: "civ-ai-data.ts",
      formula: "skala"
    },
    ai_ekspansywnosc: {
      domena: "ai",
      jednostka: "skala_1_10",
      modul: "civ-ai-data.ts",
      formula: "skala"
    },
    ai_priorytet_militarny: {
      domena: "ai",
      jednostka: "skala_1_10",
      modul: "civ-ai-data.ts",
      formula: "skala"
    },
    ai_priorytet_ekonomia: {
      domena: "ai",
      jednostka: "skala_1_10",
      modul: "civ-ai-data.ts",
      formula: "skala"
    },
    ai_priorytet_nauka: {
      domena: "ai",
      jednostka: "skala_1_10",
      modul: "civ-ai-data.ts",
      formula: "skala"
    },
    ai_tolerancja_ryzyka: {
      domena: "ai",
      jednostka: "skala_1_10",
      modul: "civ-ai-data.ts",
      formula: "skala"
    },
    ai_sklonnosc_podboju: {
      domena: "ai",
      jednostka: "skala_1_10",
      modul: "civ-ai-data.ts",
      formula: "skala"
    },
    ai_profil_obronna: {
      domena: "ai",
      jednostka: "flag_0_1",
      modul: "civ-ai-data.ts",
      formula: "flag"
    }
  },
  defaults: {
    meta_epoka_kamien: 0,
    meta_epoka_braz: 0,
    meta_epoka_zelazo: 0,
    meta_mnoznik_waluta: 2,
    meta_tier_roster: 1,
    walka_atak_piechota: 0,
    walka_atak_lukownicy: 0,
    walka_atak_kawaleria: 0,
    walka_atak_rydwany: 0,
    walka_atak_obleczenie: 0,
    walka_atak_morska: 0,
    walka_atak_wszystkie: 0,
    walka_obrona_piechota: 0,
    walka_obrona_lukownicy: 0,
    walka_obrona_kawaleria: 0,
    walka_obrona_rydwany: 0,
    walka_obrona_obleczenie: 0,
    walka_obrona_morska: 0,
    walka_pancerz_piechota: 0,
    walka_pancerz_lukownicy: 0,
    walka_pancerz_kawaleria: 0,
    walka_pancerz_rydwany: 0,
    walka_uderzenie_piechota: 0,
    walka_uderzenie_kawaleria: 0,
    walka_uderzenie_rydwany: 0,
    walka_dystans_lukownicy: 0,
    walka_dystans_rydwany: 0,
    walka_hp_piechota: 0,
    walka_hp_kawaleria: 0,
    walka_hp_rydwany: 0,
    walka_ruch_bitwa_proc: 0,
    walka_zasieg_proc: 0,
    walka_oblezenie_proc: 0,
    walka_koszt_rekrutacji_proc: 0,
    walka_atak_piechota_teren_las: 0,
    walka_obrona_piechota_teren_las: 0,
    walka_atak_piechota_terytorium_wlasne: 0,
    walka_obrona_piechota_terytorium_wlasne: 0,
    walka_atak_piechota_w_murze: 0,
    walka_obrona_piechota_w_murze: 0,
    walka_atak_piechota_runda_szarzy: 0,
    walka_obrona_piechota_runda_szarzy: 0,
    walka_atak_piechota_teren_wybrzeze: 0,
    walka_obrona_piechota_teren_wybrzeze: 0,
    spec_Atak: 0,
    spec_Obrazenia: 0,
    spec_Obrona: 0,
    spec_Uderzenie: 0,
    spec_Pancerz: 0,
    spec_Przebicie: 0,
    spec_Health: 0,
    spec_Atak_dystansowy: 0,
    spec_Zasieg_hex: 0,
    spec_Pociski: 0,
    spec_Ruch_bitwa: 0,
    spec_Ruch_mapa: 0,
    spec_Widok: 0,
    spec_Dezercja_proc: 0,
    spec_Morale: 0,
    spec_Koszt_pieniadz: 0,
    spec_Utrzymanie: 0,
    spec_Zywnosc_ture: 0,
    eko_praca_proc: 0,
    eko_pieniadz_proc: 0,
    eko_pieniadz_port_proc: 0,
    eko_zywnosc_proc: 0,
    eko_nauka_proc: 0,
    eko_kultura_proc: 0,
    eko_luksus_proc: 0,
    eko_zadowolenie_proc: 0,
    eko_handel_brutto_proc: 0,
    eko_korupcja_proc: 0,
    prod_koszt_budynku_proc: 0,
    prod_koszt_jednostki_proc: 0,
    prod_szybkosc_budynku_proc: 0,
    prod_szybkosc_jednostki_proc: 0,
    prod_rush_koszt_proc: 0,
    lud_wzrost_proc: 0,
    lud_spadek_proc: 0,
    lud_zdrowie_proc: 0,
    lud_zadowolenie_bazowe: 0,
    lud_limit_populacji: 10,
    mp_regen_proc: 0,
    mp_max_proc: 0,
    mp_koszt_jednostki_proc: 0,
    wealth_cap_proc: 0,
    wealth_mnoznik_proc: 0,
    kultura_naplyw_proc: 0,
    religia_spread_proc: 0,
    porzadek_produkcja_proc: 0,
    porzadek_pieniadz_proc: 0,
    porzadek_nauka_proc: 0,
    porzadek_kultura_proc: 0,
    porzadek_wzrost_proc: 0,
    obl_obrona_miasta_proc: 0,
    obl_mur_proc: 0,
    obl_machines_proc: 0,
    dip_sklonnosc_sojusze: 5,
    dip_lojalnosc: 5,
    dip_prog_wojny: 5,
    dip_pamietliwosc: 5,
    dip_otwartosc_handel: 5,
    dip_nastawienie_bazowe: 50,
    dip_agresja_archetyp: 0.5,
    dip_handlowosc_archetyp: 0.5,
    ai_agresywnosc: 5,
    ai_ekspansywnosc: 5,
    ai_priorytet_militarny: 5,
    ai_priorytet_ekonomia: 5,
    ai_priorytet_nauka: 5,
    ai_tolerancja_ryzyka: 5,
    ai_sklonnosc_podboju: 5,
    ai_profil_obronna: 0
  },
  cywilizacje: [
    {
      Cywilizacja: "Grecy",
      typCywilizacji: "grecy",
      ikonaId: "grecy",
      tier: 1,
      params: {
        meta_epoka_kamien: 1,
        meta_epoka_braz: 1,
        meta_epoka_zelazo: 1,
        meta_mnoznik_waluta: 2.3,
        meta_tier_roster: 1,
        walka_atak_piechota: 0,
        walka_atak_lukownicy: 0,
        walka_atak_kawaleria: 0,
        walka_atak_rydwany: 0,
        walka_atak_obleczenie: 0,
        walka_atak_morska: 0,
        walka_atak_wszystkie: 0,
        walka_obrona_piechota: 0.2,
        walka_obrona_lukownicy: 0,
        walka_obrona_kawaleria: 0,
        walka_obrona_rydwany: 0,
        walka_obrona_obleczenie: 0,
        walka_obrona_morska: 0,
        walka_pancerz_piechota: 0,
        walka_pancerz_lukownicy: 0,
        walka_pancerz_kawaleria: 0,
        walka_pancerz_rydwany: 0,
        walka_uderzenie_piechota: 0,
        walka_uderzenie_kawaleria: 0,
        walka_uderzenie_rydwany: 0,
        walka_dystans_lukownicy: 0,
        walka_dystans_rydwany: 0,
        walka_hp_piechota: 0,
        walka_hp_kawaleria: 0,
        walka_hp_rydwany: 0,
        walka_ruch_bitwa_proc: 0,
        walka_zasieg_proc: 0,
        walka_oblezenie_proc: 0,
        walka_koszt_rekrutacji_proc: 0,
        walka_atak_piechota_teren_las: 0,
        walka_obrona_piechota_teren_las: 0,
        walka_atak_piechota_terytorium_wlasne: 0,
        walka_obrona_piechota_terytorium_wlasne: 0,
        walka_atak_piechota_w_murze: 0,
        walka_obrona_piechota_w_murze: 0,
        walka_atak_piechota_runda_szarzy: 0,
        walka_obrona_piechota_runda_szarzy: 0,
        walka_atak_piechota_teren_wybrzeze: 0,
        walka_obrona_piechota_teren_wybrzeze: 0,
        spec_Atak: 48,
        spec_Obrazenia: 45,
        spec_Obrona: 100,
        spec_Uderzenie: 70,
        spec_Pancerz: 85,
        spec_Przebicie: 15,
        spec_Health: 100,
        spec_Atak_dystansowy: 0,
        spec_Zasieg_hex: 0,
        spec_Pociski: 0,
        spec_Ruch_bitwa: 3,
        spec_Ruch_mapa: 1,
        spec_Widok: 1,
        spec_Dezercja_proc: 0.2,
        spec_Morale: 75,
        spec_Koszt_pieniadz: 18,
        spec_Utrzymanie: 2,
        spec_Zywnosc_ture: 1,
        eko_praca_proc: 0.02,
        eko_pieniadz_proc: 0.15,
        eko_pieniadz_port_proc: 0.15,
        eko_zywnosc_proc: 0,
        eko_nauka_proc: 0,
        eko_kultura_proc: 0,
        eko_luksus_proc: 0,
        eko_zadowolenie_proc: 0,
        eko_handel_brutto_proc: 0.15,
        eko_korupcja_proc: 0,
        prod_koszt_budynku_proc: 0,
        prod_koszt_jednostki_proc: 0,
        prod_szybkosc_budynku_proc: 0,
        prod_szybkosc_jednostki_proc: 0,
        prod_rush_koszt_proc: 0,
        lud_wzrost_proc: 0,
        lud_spadek_proc: 0,
        lud_zdrowie_proc: 0,
        lud_zadowolenie_bazowe: 0,
        lud_limit_populacji: 10,
        mp_regen_proc: -0.15,
        mp_max_proc: 0,
        mp_koszt_jednostki_proc: 0,
        wealth_cap_proc: 0,
        wealth_mnoznik_proc: 0,
        kultura_naplyw_proc: 0,
        religia_spread_proc: 0,
        porzadek_produkcja_proc: 0,
        porzadek_pieniadz_proc: 0,
        porzadek_nauka_proc: 0,
        porzadek_kultura_proc: 0,
        porzadek_wzrost_proc: 0,
        obl_obrona_miasta_proc: 0,
        obl_mur_proc: 0,
        obl_machines_proc: 0,
        dip_sklonnosc_sojusze: 6,
        dip_lojalnosc: 7,
        dip_prog_wojny: 4,
        dip_pamietliwosc: 6,
        dip_otwartosc_handel: 8,
        dip_nastawienie_bazowe: 59,
        dip_agresja_archetyp: 0.4,
        dip_handlowosc_archetyp: 0.75,
        ai_agresywnosc: 4,
        ai_ekspansywnosc: 3,
        ai_priorytet_militarny: 5,
        ai_priorytet_ekonomia: 5,
        ai_priorytet_nauka: 6,
        ai_tolerancja_ryzyka: 4,
        ai_sklonnosc_podboju: 2,
        ai_profil_obronna: 1
      }
    },
    {
      Cywilizacja: "Rzymianie",
      typCywilizacji: "rzymianie",
      ikonaId: "rzymianie",
      tier: 1,
      params: {
        meta_epoka_kamien: 1,
        meta_epoka_braz: 1,
        meta_epoka_zelazo: 1,
        meta_mnoznik_waluta: 2,
        meta_tier_roster: 1,
        walka_atak_piechota: 0.15,
        walka_atak_lukownicy: 0,
        walka_atak_kawaleria: 0,
        walka_atak_rydwany: 0,
        walka_atak_obleczenie: 0,
        walka_atak_morska: 0,
        walka_atak_wszystkie: 0,
        walka_obrona_piechota: 0,
        walka_obrona_lukownicy: 0,
        walka_obrona_kawaleria: 0,
        walka_obrona_rydwany: 0,
        walka_obrona_obleczenie: 0,
        walka_obrona_morska: 0,
        walka_pancerz_piechota: 0.15,
        walka_pancerz_lukownicy: 0,
        walka_pancerz_kawaleria: 0,
        walka_pancerz_rydwany: 0,
        walka_uderzenie_piechota: 0,
        walka_uderzenie_kawaleria: 0,
        walka_uderzenie_rydwany: 0,
        walka_dystans_lukownicy: 0,
        walka_dystans_rydwany: 0,
        walka_hp_piechota: 0,
        walka_hp_kawaleria: 0,
        walka_hp_rydwany: 0,
        walka_ruch_bitwa_proc: 0,
        walka_zasieg_proc: 0,
        walka_oblezenie_proc: 0,
        walka_koszt_rekrutacji_proc: 0,
        walka_atak_piechota_teren_las: 0,
        walka_obrona_piechota_teren_las: 0,
        walka_atak_piechota_terytorium_wlasne: 0,
        walka_obrona_piechota_terytorium_wlasne: 0,
        walka_atak_piechota_w_murze: 0,
        walka_obrona_piechota_w_murze: 0,
        walka_atak_piechota_runda_szarzy: 0,
        walka_obrona_piechota_runda_szarzy: 0,
        walka_atak_piechota_teren_wybrzeze: 0,
        walka_obrona_piechota_teren_wybrzeze: 0,
        spec_Atak: 0,
        spec_Obrazenia: 0,
        spec_Obrona: 0,
        spec_Uderzenie: 0,
        spec_Pancerz: 0,
        spec_Przebicie: 0,
        spec_Health: 0,
        spec_Atak_dystansowy: 0,
        spec_Zasieg_hex: 0,
        spec_Pociski: 0,
        spec_Ruch_bitwa: 0,
        spec_Ruch_mapa: 0,
        spec_Widok: 0,
        spec_Dezercja_proc: 0,
        spec_Morale: 0,
        spec_Koszt_pieniadz: 0,
        spec_Utrzymanie: 0,
        spec_Zywnosc_ture: 0,
        eko_praca_proc: 0,
        eko_pieniadz_proc: 0,
        eko_pieniadz_port_proc: 0,
        eko_zywnosc_proc: 0,
        eko_nauka_proc: 0,
        eko_kultura_proc: 0,
        eko_luksus_proc: 0,
        eko_zadowolenie_proc: 0,
        eko_handel_brutto_proc: 0,
        eko_korupcja_proc: 0,
        prod_koszt_budynku_proc: 0.2,
        prod_koszt_jednostki_proc: 0,
        prod_szybkosc_budynku_proc: 0,
        prod_szybkosc_jednostki_proc: 0,
        prod_rush_koszt_proc: 0,
        lud_wzrost_proc: 0,
        lud_spadek_proc: 0,
        lud_zdrowie_proc: 0,
        lud_zadowolenie_bazowe: 0,
        lud_limit_populacji: 10,
        mp_regen_proc: 0.35,
        mp_max_proc: 0,
        mp_koszt_jednostki_proc: 0,
        wealth_cap_proc: 0,
        wealth_mnoznik_proc: 0,
        kultura_naplyw_proc: 0,
        religia_spread_proc: 0,
        porzadek_produkcja_proc: 0,
        porzadek_pieniadz_proc: 0,
        porzadek_nauka_proc: 0,
        porzadek_kultura_proc: 0,
        porzadek_wzrost_proc: 0,
        obl_obrona_miasta_proc: 0,
        obl_mur_proc: 0,
        obl_machines_proc: 0,
        dip_sklonnosc_sojusze: 2,
        dip_lojalnosc: 6,
        dip_prog_wojny: 8,
        dip_pamietliwosc: 7,
        dip_otwartosc_handel: 5,
        dip_nastawienie_bazowe: 44,
        dip_agresja_archetyp: 0.75,
        dip_handlowosc_archetyp: 0.5,
        ai_agresywnosc: 8,
        ai_ekspansywnosc: 5,
        ai_priorytet_militarny: 6,
        ai_priorytet_ekonomia: 5,
        ai_priorytet_nauka: 5,
        ai_tolerancja_ryzyka: 8,
        ai_sklonnosc_podboju: 4,
        ai_profil_obronna: 1
      }
    },
    {
      Cywilizacja: "Chi\u0144czycy",
      typCywilizacji: "chinczycy",
      ikonaId: "chinczycy",
      tier: 1,
      params: {
        meta_epoka_kamien: 1,
        meta_epoka_braz: 1,
        meta_epoka_zelazo: 1,
        meta_mnoznik_waluta: 2.4,
        meta_tier_roster: 1,
        walka_atak_piechota: 0,
        walka_atak_lukownicy: 0,
        walka_atak_kawaleria: 0,
        walka_atak_rydwany: 0,
        walka_atak_obleczenie: 0,
        walka_atak_morska: 0,
        walka_atak_wszystkie: 0,
        walka_obrona_piechota: -0.05,
        walka_obrona_lukownicy: 0,
        walka_obrona_kawaleria: 0,
        walka_obrona_rydwany: 0,
        walka_obrona_obleczenie: 0,
        walka_obrona_morska: 0,
        walka_pancerz_piechota: 0,
        walka_pancerz_lukownicy: 0,
        walka_pancerz_kawaleria: 0,
        walka_pancerz_rydwany: 0,
        walka_uderzenie_piechota: 0,
        walka_uderzenie_kawaleria: 0.15,
        walka_uderzenie_rydwany: 0,
        walka_dystans_lukownicy: 0.2,
        walka_dystans_rydwany: 0,
        walka_hp_piechota: 0,
        walka_hp_kawaleria: 0,
        walka_hp_rydwany: 0,
        walka_ruch_bitwa_proc: 0,
        walka_zasieg_proc: 0,
        walka_oblezenie_proc: 0,
        walka_koszt_rekrutacji_proc: 0,
        walka_atak_piechota_teren_las: 0,
        walka_obrona_piechota_teren_las: 0,
        walka_atak_piechota_terytorium_wlasne: 0,
        walka_obrona_piechota_terytorium_wlasne: 0,
        walka_atak_piechota_w_murze: 0,
        walka_obrona_piechota_w_murze: 0,
        walka_atak_piechota_runda_szarzy: 0,
        walka_obrona_piechota_runda_szarzy: 0,
        walka_atak_piechota_teren_wybrzeze: 0,
        walka_obrona_piechota_teren_wybrzeze: 0,
        spec_Atak: 8,
        spec_Obrazenia: 0,
        spec_Obrona: 4,
        spec_Uderzenie: 4,
        spec_Pancerz: 2,
        spec_Przebicie: 2,
        spec_Health: 20,
        spec_Atak_dystansowy: 10,
        spec_Zasieg_hex: 4,
        spec_Pociski: 14,
        spec_Ruch_bitwa: 3,
        spec_Ruch_mapa: 2,
        spec_Widok: 2,
        spec_Dezercja_proc: 0.4,
        spec_Morale: 85,
        spec_Koszt_pieniadz: 20,
        spec_Utrzymanie: 2,
        spec_Zywnosc_ture: 1,
        eko_praca_proc: 0.03,
        eko_pieniadz_proc: 0,
        eko_pieniadz_port_proc: 0,
        eko_zywnosc_proc: 0,
        eko_nauka_proc: 0,
        eko_kultura_proc: 0,
        eko_luksus_proc: 0,
        eko_zadowolenie_proc: 0,
        eko_handel_brutto_proc: 0,
        eko_korupcja_proc: 0,
        prod_koszt_budynku_proc: 0,
        prod_koszt_jednostki_proc: 0,
        prod_szybkosc_budynku_proc: 0,
        prod_szybkosc_jednostki_proc: 0,
        prod_rush_koszt_proc: 0,
        lud_wzrost_proc: 0.05,
        lud_spadek_proc: 0,
        lud_zdrowie_proc: 0,
        lud_zadowolenie_bazowe: 0,
        lud_limit_populacji: 10,
        mp_regen_proc: 0,
        mp_max_proc: 0,
        mp_koszt_jednostki_proc: 0,
        wealth_cap_proc: 0,
        wealth_mnoznik_proc: 0,
        kultura_naplyw_proc: 0,
        religia_spread_proc: 0,
        porzadek_produkcja_proc: 0,
        porzadek_pieniadz_proc: 0,
        porzadek_nauka_proc: 0,
        porzadek_kultura_proc: 0,
        porzadek_wzrost_proc: 0,
        obl_obrona_miasta_proc: 0,
        obl_mur_proc: 0,
        obl_machines_proc: 0,
        dip_sklonnosc_sojusze: 8,
        dip_lojalnosc: 7,
        dip_prog_wojny: 2,
        dip_pamietliwosc: 5,
        dip_otwartosc_handel: 8,
        dip_nastawienie_bazowe: 66,
        dip_agresja_archetyp: 0.2,
        dip_handlowosc_archetyp: 0.85,
        ai_agresywnosc: 2,
        ai_ekspansywnosc: 2,
        ai_priorytet_militarny: 4,
        ai_priorytet_ekonomia: 6,
        ai_priorytet_nauka: 6,
        ai_tolerancja_ryzyka: 2,
        ai_sklonnosc_podboju: 1,
        ai_profil_obronna: 1
      }
    },
    {
      Cywilizacja: "Inkowie",
      typCywilizacji: "inkowie",
      ikonaId: "inkowie",
      tier: 1,
      params: {
        meta_epoka_kamien: 1,
        meta_epoka_braz: 1,
        meta_epoka_zelazo: 1,
        meta_mnoznik_waluta: 1.9,
        meta_tier_roster: 1,
        walka_atak_piechota: 0,
        walka_atak_lukownicy: 0,
        walka_atak_kawaleria: -0.15,
        walka_atak_rydwany: -0.15,
        walka_atak_obleczenie: 0,
        walka_atak_morska: 0,
        walka_atak_wszystkie: 0,
        walka_obrona_piechota: 0,
        walka_obrona_lukownicy: 0,
        walka_obrona_kawaleria: 0,
        walka_obrona_rydwany: 0,
        walka_obrona_obleczenie: 0,
        walka_obrona_morska: 0,
        walka_pancerz_piechota: 0,
        walka_pancerz_lukownicy: 0,
        walka_pancerz_kawaleria: 0,
        walka_pancerz_rydwany: 0,
        walka_uderzenie_piechota: 0,
        walka_uderzenie_kawaleria: 0,
        walka_uderzenie_rydwany: 0,
        walka_dystans_lukownicy: 0,
        walka_dystans_rydwany: 0,
        walka_hp_piechota: 0,
        walka_hp_kawaleria: 0,
        walka_hp_rydwany: 0,
        walka_ruch_bitwa_proc: 0,
        walka_zasieg_proc: 0,
        walka_oblezenie_proc: 0,
        walka_koszt_rekrutacji_proc: 0,
        walka_atak_piechota_teren_las: 0.2,
        walka_obrona_piechota_teren_las: 0,
        walka_atak_piechota_terytorium_wlasne: 0,
        walka_obrona_piechota_terytorium_wlasne: 0,
        walka_atak_piechota_w_murze: 0,
        walka_obrona_piechota_w_murze: 0,
        walka_atak_piechota_runda_szarzy: 0,
        walka_obrona_piechota_runda_szarzy: 0,
        walka_atak_piechota_teren_wybrzeze: 0,
        walka_obrona_piechota_teren_wybrzeze: 0,
        spec_Atak: 8,
        spec_Obrazenia: 0,
        spec_Obrona: 4,
        spec_Uderzenie: 8,
        spec_Pancerz: 2,
        spec_Przebicie: 6,
        spec_Health: 40,
        spec_Atak_dystansowy: 0,
        spec_Zasieg_hex: 0,
        spec_Pociski: 0,
        spec_Ruch_bitwa: 4,
        spec_Ruch_mapa: 3,
        spec_Widok: 3,
        spec_Dezercja_proc: 0.1,
        spec_Morale: 100,
        spec_Koszt_pieniadz: 26,
        spec_Utrzymanie: 2,
        spec_Zywnosc_ture: 1,
        eko_praca_proc: -0.03,
        eko_pieniadz_proc: 0,
        eko_pieniadz_port_proc: 0,
        eko_zywnosc_proc: 0,
        eko_nauka_proc: 0.15,
        eko_kultura_proc: 0,
        eko_luksus_proc: 0,
        eko_zadowolenie_proc: 0,
        eko_handel_brutto_proc: 0,
        eko_korupcja_proc: 0,
        prod_koszt_budynku_proc: 0,
        prod_koszt_jednostki_proc: 0,
        prod_szybkosc_budynku_proc: 0,
        prod_szybkosc_jednostki_proc: 0,
        prod_rush_koszt_proc: 0,
        lud_wzrost_proc: 0,
        lud_spadek_proc: 0,
        lud_zdrowie_proc: 0,
        lud_zadowolenie_bazowe: 0,
        lud_limit_populacji: 10,
        mp_regen_proc: 0,
        mp_max_proc: 0,
        mp_koszt_jednostki_proc: 0,
        wealth_cap_proc: 0,
        wealth_mnoznik_proc: 0,
        kultura_naplyw_proc: 0,
        religia_spread_proc: 0,
        porzadek_produkcja_proc: 0,
        porzadek_pieniadz_proc: 0,
        porzadek_nauka_proc: 0,
        porzadek_kultura_proc: 0,
        porzadek_wzrost_proc: 0,
        obl_obrona_miasta_proc: 0,
        obl_mur_proc: 0,
        obl_machines_proc: 0,
        dip_sklonnosc_sojusze: 6,
        dip_lojalnosc: 7,
        dip_prog_wojny: 4,
        dip_pamietliwosc: 6,
        dip_otwartosc_handel: 2,
        dip_nastawienie_bazowe: 45,
        dip_agresja_archetyp: 0.45,
        dip_handlowosc_archetyp: 0.25,
        ai_agresywnosc: 4,
        ai_ekspansywnosc: 3,
        ai_priorytet_militarny: 5,
        ai_priorytet_ekonomia: 5,
        ai_priorytet_nauka: 5,
        ai_tolerancja_ryzyka: 4,
        ai_sklonnosc_podboju: 3,
        ai_profil_obronna: 1
      }
    },
    {
      Cywilizacja: "Zulusi",
      typCywilizacji: "zulusi",
      ikonaId: "zulusi",
      tier: 1,
      params: {
        meta_epoka_kamien: 1,
        meta_epoka_braz: 1,
        meta_epoka_zelazo: 1,
        meta_mnoznik_waluta: 1.8,
        meta_tier_roster: 1,
        walka_atak_piechota: 0,
        walka_atak_lukownicy: 0,
        walka_atak_kawaleria: 0,
        walka_atak_rydwany: 0,
        walka_atak_obleczenie: 0,
        walka_atak_morska: 0,
        walka_atak_wszystkie: 0,
        walka_obrona_piechota: 0,
        walka_obrona_lukownicy: 0,
        walka_obrona_kawaleria: 0,
        walka_obrona_rydwany: 0,
        walka_obrona_obleczenie: 0,
        walka_obrona_morska: 0,
        walka_pancerz_piechota: 0,
        walka_pancerz_lukownicy: 0,
        walka_pancerz_kawaleria: 0,
        walka_pancerz_rydwany: 0,
        walka_uderzenie_piechota: 0,
        walka_uderzenie_kawaleria: 0,
        walka_uderzenie_rydwany: 0,
        walka_dystans_lukownicy: -0.1,
        walka_dystans_rydwany: 0,
        walka_hp_piechota: 0,
        walka_hp_kawaleria: 0,
        walka_hp_rydwany: 0,
        walka_ruch_bitwa_proc: 0.2,
        walka_zasieg_proc: 0,
        walka_oblezenie_proc: 0,
        walka_koszt_rekrutacji_proc: 0.1,
        walka_atak_piechota_teren_las: 0,
        walka_obrona_piechota_teren_las: 0,
        walka_atak_piechota_terytorium_wlasne: 0,
        walka_obrona_piechota_terytorium_wlasne: 0,
        walka_atak_piechota_w_murze: 0,
        walka_obrona_piechota_w_murze: 0,
        walka_atak_piechota_runda_szarzy: 0,
        walka_obrona_piechota_runda_szarzy: 0,
        walka_atak_piechota_teren_wybrzeze: 0,
        walka_obrona_piechota_teren_wybrzeze: 0,
        spec_Atak: 3,
        spec_Obrazenia: 0,
        spec_Obrona: 6,
        spec_Uderzenie: 6,
        spec_Pancerz: 4,
        spec_Przebicie: 2,
        spec_Health: 70,
        spec_Atak_dystansowy: 0,
        spec_Zasieg_hex: 0,
        spec_Pociski: 0,
        spec_Ruch_bitwa: 4,
        spec_Ruch_mapa: 4,
        spec_Widok: 4,
        spec_Dezercja_proc: 0.15,
        spec_Morale: 100,
        spec_Koszt_pieniadz: 16,
        spec_Utrzymanie: 2,
        spec_Zywnosc_ture: 1,
        eko_praca_proc: -0.03,
        eko_pieniadz_proc: 0,
        eko_pieniadz_port_proc: 0,
        eko_zywnosc_proc: 0,
        eko_nauka_proc: 0,
        eko_kultura_proc: 0,
        eko_luksus_proc: 0,
        eko_zadowolenie_proc: 0,
        eko_handel_brutto_proc: 0,
        eko_korupcja_proc: 0,
        prod_koszt_budynku_proc: 0,
        prod_koszt_jednostki_proc: 0.1,
        prod_szybkosc_budynku_proc: 0,
        prod_szybkosc_jednostki_proc: 0,
        prod_rush_koszt_proc: 0,
        lud_wzrost_proc: -0.05,
        lud_spadek_proc: 0,
        lud_zdrowie_proc: 0,
        lud_zadowolenie_bazowe: 0,
        lud_limit_populacji: 10,
        mp_regen_proc: 0,
        mp_max_proc: 0,
        mp_koszt_jednostki_proc: 0,
        wealth_cap_proc: 0,
        wealth_mnoznik_proc: 0,
        kultura_naplyw_proc: 0,
        religia_spread_proc: 0,
        porzadek_produkcja_proc: 0,
        porzadek_pieniadz_proc: 0,
        porzadek_nauka_proc: 0,
        porzadek_kultura_proc: 0,
        porzadek_wzrost_proc: 0,
        obl_obrona_miasta_proc: 0,
        obl_mur_proc: 0,
        obl_machines_proc: 0,
        dip_sklonnosc_sojusze: 1,
        dip_lojalnosc: 5,
        dip_prog_wojny: 9,
        dip_pamietliwosc: 8,
        dip_otwartosc_handel: 2,
        dip_nastawienie_bazowe: 32,
        dip_agresja_archetyp: 0.9,
        dip_handlowosc_archetyp: 0.2,
        ai_agresywnosc: 9,
        ai_ekspansywnosc: 4,
        ai_priorytet_militarny: 8,
        ai_priorytet_ekonomia: 4,
        ai_priorytet_nauka: 4,
        ai_tolerancja_ryzyka: 9,
        ai_sklonnosc_podboju: 5,
        ai_profil_obronna: 1
      }
    },
    {
      Cywilizacja: "Egipt",
      typCywilizacji: "egipt",
      ikonaId: "egipt",
      tier: 1,
      params: {
        meta_epoka_kamien: 1,
        meta_epoka_braz: 1,
        meta_epoka_zelazo: 1,
        meta_mnoznik_waluta: 2.1,
        meta_tier_roster: 1,
        walka_atak_piechota: 0,
        walka_atak_lukownicy: 0,
        walka_atak_kawaleria: 0,
        walka_atak_rydwany: 0,
        walka_atak_obleczenie: 0,
        walka_atak_morska: 0,
        walka_atak_wszystkie: 0,
        walka_obrona_piechota: 0,
        walka_obrona_lukownicy: 0,
        walka_obrona_kawaleria: 0,
        walka_obrona_rydwany: 0,
        walka_obrona_obleczenie: 0,
        walka_obrona_morska: 0,
        walka_pancerz_piechota: 0,
        walka_pancerz_lukownicy: 0,
        walka_pancerz_kawaleria: 0,
        walka_pancerz_rydwany: 0,
        walka_uderzenie_piechota: 0,
        walka_uderzenie_kawaleria: 0,
        walka_uderzenie_rydwany: 0,
        walka_dystans_lukownicy: 0.2,
        walka_dystans_rydwany: 0,
        walka_hp_piechota: 0,
        walka_hp_kawaleria: 0,
        walka_hp_rydwany: 0,
        walka_ruch_bitwa_proc: 0.15,
        walka_zasieg_proc: 0,
        walka_oblezenie_proc: 0,
        walka_koszt_rekrutacji_proc: 0,
        walka_atak_piechota_teren_las: 0,
        walka_obrona_piechota_teren_las: 0,
        walka_atak_piechota_terytorium_wlasne: 0,
        walka_obrona_piechota_terytorium_wlasne: 0,
        walka_atak_piechota_w_murze: 0,
        walka_obrona_piechota_w_murze: 0,
        walka_atak_piechota_runda_szarzy: 0,
        walka_obrona_piechota_runda_szarzy: 0,
        walka_atak_piechota_teren_wybrzeze: 0,
        walka_obrona_piechota_teren_wybrzeze: 0,
        spec_Atak: 10,
        spec_Obrazenia: 0,
        spec_Obrona: 8,
        spec_Uderzenie: 8,
        spec_Pancerz: 6,
        spec_Przebicie: 4,
        spec_Health: 85,
        spec_Atak_dystansowy: 6,
        spec_Zasieg_hex: 2,
        spec_Pociski: 6,
        spec_Ruch_bitwa: 4,
        spec_Ruch_mapa: 3,
        spec_Widok: 3,
        spec_Dezercja_proc: 0.1,
        spec_Morale: 120,
        spec_Koszt_pieniadz: 0,
        spec_Utrzymanie: 0,
        spec_Zywnosc_ture: 1,
        eko_praca_proc: 0.01,
        eko_pieniadz_proc: 0,
        eko_pieniadz_port_proc: 0,
        eko_zywnosc_proc: 0,
        eko_nauka_proc: 0,
        eko_kultura_proc: 0,
        eko_luksus_proc: 0,
        eko_zadowolenie_proc: 0,
        eko_handel_brutto_proc: 0,
        eko_korupcja_proc: 0,
        prod_koszt_budynku_proc: 0,
        prod_koszt_jednostki_proc: 0,
        prod_szybkosc_budynku_proc: 0,
        prod_szybkosc_jednostki_proc: 0,
        prod_rush_koszt_proc: 0,
        lud_wzrost_proc: 0.05,
        lud_spadek_proc: 0,
        lud_zdrowie_proc: 0,
        lud_zadowolenie_bazowe: 0,
        lud_limit_populacji: 10,
        mp_regen_proc: 0,
        mp_max_proc: 0,
        mp_koszt_jednostki_proc: 0,
        wealth_cap_proc: 0,
        wealth_mnoznik_proc: 0,
        kultura_naplyw_proc: 0,
        religia_spread_proc: 0,
        porzadek_produkcja_proc: 0,
        porzadek_pieniadz_proc: 0,
        porzadek_nauka_proc: 0,
        porzadek_kultura_proc: 0,
        porzadek_wzrost_proc: 0,
        obl_obrona_miasta_proc: 0,
        obl_mur_proc: 0,
        obl_machines_proc: 0,
        dip_sklonnosc_sojusze: 6,
        dip_lojalnosc: 7,
        dip_prog_wojny: 4,
        dip_pamietliwosc: 5,
        dip_otwartosc_handel: 6,
        dip_nastawienie_bazowe: 56,
        dip_agresja_archetyp: 0.35,
        dip_handlowosc_archetyp: 0.6,
        ai_agresywnosc: 4,
        ai_ekspansywnosc: 2,
        ai_priorytet_militarny: 5,
        ai_priorytet_ekonomia: 6,
        ai_priorytet_nauka: 5,
        ai_tolerancja_ryzyka: 4,
        ai_sklonnosc_podboju: 2,
        ai_profil_obronna: 1
      }
    },
    {
      Cywilizacja: "Sumerowie",
      typCywilizacji: "sumer",
      ikonaId: "sumer",
      tier: 1,
      params: {
        meta_epoka_kamien: 1,
        meta_epoka_braz: 1,
        meta_epoka_zelazo: 1,
        meta_mnoznik_waluta: 2.2,
        meta_tier_roster: 1,
        walka_atak_piechota: 0,
        walka_atak_lukownicy: 0,
        walka_atak_kawaleria: 0,
        walka_atak_rydwany: 0,
        walka_atak_obleczenie: 0,
        walka_atak_morska: 0,
        walka_atak_wszystkie: 0,
        walka_obrona_piechota: 0.2,
        walka_obrona_lukownicy: 0,
        walka_obrona_kawaleria: 0,
        walka_obrona_rydwany: 0,
        walka_obrona_obleczenie: 0,
        walka_obrona_morska: 0,
        walka_pancerz_piechota: 0,
        walka_pancerz_lukownicy: 0,
        walka_pancerz_kawaleria: 0,
        walka_pancerz_rydwany: 0,
        walka_uderzenie_piechota: 0,
        walka_uderzenie_kawaleria: 0,
        walka_uderzenie_rydwany: 0,
        walka_dystans_lukownicy: 0,
        walka_dystans_rydwany: 0,
        walka_hp_piechota: 0.2,
        walka_hp_kawaleria: 0,
        walka_hp_rydwany: 0.15,
        walka_ruch_bitwa_proc: 0,
        walka_zasieg_proc: 0,
        walka_oblezenie_proc: 0,
        walka_koszt_rekrutacji_proc: 0,
        walka_atak_piechota_teren_las: 0,
        walka_obrona_piechota_teren_las: 0,
        walka_atak_piechota_terytorium_wlasne: 0,
        walka_obrona_piechota_terytorium_wlasne: 0,
        walka_atak_piechota_w_murze: 0,
        walka_obrona_piechota_w_murze: 0,
        walka_atak_piechota_runda_szarzy: 0,
        walka_obrona_piechota_runda_szarzy: 0,
        walka_atak_piechota_teren_wybrzeze: 0,
        walka_obrona_piechota_teren_wybrzeze: 0,
        spec_Atak: 10,
        spec_Obrazenia: 0,
        spec_Obrona: 8,
        spec_Uderzenie: 8,
        spec_Pancerz: 6,
        spec_Przebicie: 4,
        spec_Health: 85,
        spec_Atak_dystansowy: 0,
        spec_Zasieg_hex: 0,
        spec_Pociski: 0,
        spec_Ruch_bitwa: 4,
        spec_Ruch_mapa: 2,
        spec_Widok: 2,
        spec_Dezercja_proc: 0.1,
        spec_Morale: 120,
        spec_Koszt_pieniadz: 0,
        spec_Utrzymanie: 0,
        spec_Zywnosc_ture: 1,
        eko_praca_proc: 0.01,
        eko_pieniadz_proc: 0,
        eko_pieniadz_port_proc: 0,
        eko_zywnosc_proc: 0,
        eko_nauka_proc: 0,
        eko_kultura_proc: 0,
        eko_luksus_proc: 0,
        eko_zadowolenie_proc: 0,
        eko_handel_brutto_proc: 0,
        eko_korupcja_proc: 0,
        prod_koszt_budynku_proc: 0,
        prod_koszt_jednostki_proc: 0,
        prod_szybkosc_budynku_proc: 0,
        prod_szybkosc_jednostki_proc: 0,
        prod_rush_koszt_proc: 0,
        lud_wzrost_proc: 0,
        lud_spadek_proc: 0,
        lud_zdrowie_proc: 0,
        lud_zadowolenie_bazowe: 0,
        lud_limit_populacji: 10,
        mp_regen_proc: 0,
        mp_max_proc: 0,
        mp_koszt_jednostki_proc: 0,
        wealth_cap_proc: 0,
        wealth_mnoznik_proc: 0,
        kultura_naplyw_proc: 0,
        religia_spread_proc: 0,
        porzadek_produkcja_proc: 0,
        porzadek_pieniadz_proc: 0,
        porzadek_nauka_proc: 0,
        porzadek_kultura_proc: 0,
        porzadek_wzrost_proc: 0,
        obl_obrona_miasta_proc: 0,
        obl_mur_proc: 0,
        obl_machines_proc: 0,
        dip_sklonnosc_sojusze: 7,
        dip_lojalnosc: 7,
        dip_prog_wojny: 3,
        dip_pamietliwosc: 5,
        dip_otwartosc_handel: 6,
        dip_nastawienie_bazowe: 59,
        dip_agresja_archetyp: 0.3,
        dip_handlowosc_archetyp: 0.65,
        ai_agresywnosc: 3,
        ai_ekspansywnosc: 2,
        ai_priorytet_militarny: 4,
        ai_priorytet_ekonomia: 5,
        ai_priorytet_nauka: 8,
        ai_tolerancja_ryzyka: 3,
        ai_sklonnosc_podboju: 2,
        ai_profil_obronna: 1
      }
    },
    {
      Cywilizacja: "Celtowie",
      typCywilizacji: "celtowie",
      ikonaId: "celtowie",
      tier: 1,
      params: {
        meta_epoka_kamien: 0,
        meta_epoka_braz: 1,
        meta_epoka_zelazo: 1,
        meta_mnoznik_waluta: 1.9,
        meta_tier_roster: 1,
        walka_atak_piechota: 0,
        walka_atak_lukownicy: 0,
        walka_atak_kawaleria: 0,
        walka_atak_rydwany: 0,
        walka_atak_obleczenie: 0,
        walka_atak_morska: 0,
        walka_atak_wszystkie: 0,
        walka_obrona_piechota: 0,
        walka_obrona_lukownicy: 0,
        walka_obrona_kawaleria: 0,
        walka_obrona_rydwany: 0,
        walka_obrona_obleczenie: 0,
        walka_obrona_morska: 0,
        walka_pancerz_piechota: 0,
        walka_pancerz_lukownicy: 0,
        walka_pancerz_kawaleria: 0,
        walka_pancerz_rydwany: 0,
        walka_uderzenie_piechota: 0.4,
        walka_uderzenie_kawaleria: 0,
        walka_uderzenie_rydwany: 0,
        walka_dystans_lukownicy: 0,
        walka_dystans_rydwany: 0,
        walka_hp_piechota: 0,
        walka_hp_kawaleria: 0,
        walka_hp_rydwany: 0,
        walka_ruch_bitwa_proc: 0,
        walka_zasieg_proc: 0,
        walka_oblezenie_proc: 0,
        walka_koszt_rekrutacji_proc: 0,
        walka_atak_piechota_teren_las: 0,
        walka_obrona_piechota_teren_las: 0,
        walka_atak_piechota_terytorium_wlasne: 0,
        walka_obrona_piechota_terytorium_wlasne: 0,
        walka_atak_piechota_w_murze: 0,
        walka_obrona_piechota_w_murze: 0,
        walka_atak_piechota_runda_szarzy: 0,
        walka_obrona_piechota_runda_szarzy: 0,
        walka_atak_piechota_teren_wybrzeze: 0,
        walka_obrona_piechota_teren_wybrzeze: 0,
        spec_Atak: 0,
        spec_Obrazenia: 0,
        spec_Obrona: 0,
        spec_Uderzenie: 0,
        spec_Pancerz: 0,
        spec_Przebicie: 0,
        spec_Health: 0,
        spec_Atak_dystansowy: 0,
        spec_Zasieg_hex: 0,
        spec_Pociski: 0,
        spec_Ruch_bitwa: 0,
        spec_Ruch_mapa: 0,
        spec_Widok: 0,
        spec_Dezercja_proc: 0,
        spec_Morale: 0,
        spec_Koszt_pieniadz: 0,
        spec_Utrzymanie: 0,
        spec_Zywnosc_ture: 0,
        eko_praca_proc: -0.02,
        eko_pieniadz_proc: 0,
        eko_pieniadz_port_proc: 0,
        eko_zywnosc_proc: 0,
        eko_nauka_proc: 0,
        eko_kultura_proc: 0,
        eko_luksus_proc: 0,
        eko_zadowolenie_proc: 0,
        eko_handel_brutto_proc: 0,
        eko_korupcja_proc: 0,
        prod_koszt_budynku_proc: 0,
        prod_koszt_jednostki_proc: 0,
        prod_szybkosc_budynku_proc: 0,
        prod_szybkosc_jednostki_proc: 0,
        prod_rush_koszt_proc: 0,
        lud_wzrost_proc: 0,
        lud_spadek_proc: 0,
        lud_zdrowie_proc: 0,
        lud_zadowolenie_bazowe: 0,
        lud_limit_populacji: 10,
        mp_regen_proc: 0,
        mp_max_proc: 0,
        mp_koszt_jednostki_proc: 0,
        wealth_cap_proc: 0,
        wealth_mnoznik_proc: 0,
        kultura_naplyw_proc: 0,
        religia_spread_proc: 0,
        porzadek_produkcja_proc: 0,
        porzadek_pieniadz_proc: 0,
        porzadek_nauka_proc: 0,
        porzadek_kultura_proc: 0,
        porzadek_wzrost_proc: 0,
        obl_obrona_miasta_proc: 0,
        obl_mur_proc: 0,
        obl_machines_proc: 0,
        dip_sklonnosc_sojusze: 4,
        dip_lojalnosc: 6,
        dip_prog_wojny: 6,
        dip_pamietliwosc: 6,
        dip_otwartosc_handel: 4,
        dip_nastawienie_bazowe: 44,
        dip_agresja_archetyp: 0.6,
        dip_handlowosc_archetyp: 0.35,
        ai_agresywnosc: 6,
        ai_ekspansywnosc: 4,
        ai_priorytet_militarny: 8,
        ai_priorytet_ekonomia: 5,
        ai_priorytet_nauka: 4,
        ai_tolerancja_ryzyka: 6,
        ai_sklonnosc_podboju: 4,
        ai_profil_obronna: 1
      }
    },
    {
      Cywilizacja: "Germanie",
      typCywilizacji: "germanie",
      ikonaId: "germanie",
      tier: 1,
      params: {
        meta_epoka_kamien: 0,
        meta_epoka_braz: 1,
        meta_epoka_zelazo: 1,
        meta_mnoznik_waluta: 1.7,
        meta_tier_roster: 1,
        walka_atak_piechota: 0,
        walka_atak_lukownicy: 0,
        walka_atak_kawaleria: 0,
        walka_atak_rydwany: 0,
        walka_atak_obleczenie: 0,
        walka_atak_morska: 0,
        walka_atak_wszystkie: 0,
        walka_obrona_piechota: 0,
        walka_obrona_lukownicy: 0,
        walka_obrona_kawaleria: 0,
        walka_obrona_rydwany: 0,
        walka_obrona_obleczenie: 0,
        walka_obrona_morska: 0,
        walka_pancerz_piechota: 0,
        walka_pancerz_lukownicy: 0,
        walka_pancerz_kawaleria: 0,
        walka_pancerz_rydwany: 0,
        walka_uderzenie_piechota: 0,
        walka_uderzenie_kawaleria: 0,
        walka_uderzenie_rydwany: 0,
        walka_dystans_lukownicy: 0,
        walka_dystans_rydwany: 0,
        walka_hp_piechota: 0,
        walka_hp_kawaleria: 0,
        walka_hp_rydwany: 0,
        walka_ruch_bitwa_proc: 0,
        walka_zasieg_proc: 0,
        walka_oblezenie_proc: 0,
        walka_koszt_rekrutacji_proc: 0,
        walka_atak_piechota_teren_las: 0.25,
        walka_obrona_piechota_teren_las: 0,
        walka_atak_piechota_terytorium_wlasne: 0,
        walka_obrona_piechota_terytorium_wlasne: 0,
        walka_atak_piechota_w_murze: 0,
        walka_obrona_piechota_w_murze: 0,
        walka_atak_piechota_runda_szarzy: 0.4,
        walka_obrona_piechota_runda_szarzy: 0,
        walka_atak_piechota_teren_wybrzeze: 0,
        walka_obrona_piechota_teren_wybrzeze: 0,
        spec_Atak: 45,
        spec_Obrazenia: 45,
        spec_Obrona: 38,
        spec_Uderzenie: 20,
        spec_Pancerz: 20,
        spec_Przebicie: 10,
        spec_Health: 45,
        spec_Atak_dystansowy: 0,
        spec_Zasieg_hex: 0,
        spec_Pociski: 0,
        spec_Ruch_bitwa: 4,
        spec_Ruch_mapa: 2,
        spec_Widok: 2,
        spec_Dezercja_proc: 0.4,
        spec_Morale: 50,
        spec_Koszt_pieniadz: 10,
        spec_Utrzymanie: 1,
        spec_Zywnosc_ture: 1,
        eko_praca_proc: -0.02,
        eko_pieniadz_proc: 0,
        eko_pieniadz_port_proc: 0,
        eko_zywnosc_proc: 0,
        eko_nauka_proc: 0,
        eko_kultura_proc: 0,
        eko_luksus_proc: 0,
        eko_zadowolenie_proc: 0,
        eko_handel_brutto_proc: 0,
        eko_korupcja_proc: 0,
        prod_koszt_budynku_proc: 0,
        prod_koszt_jednostki_proc: 0,
        prod_szybkosc_budynku_proc: 0,
        prod_szybkosc_jednostki_proc: 0,
        prod_rush_koszt_proc: 0,
        lud_wzrost_proc: -0.05,
        lud_spadek_proc: 0,
        lud_zdrowie_proc: 0,
        lud_zadowolenie_bazowe: 0,
        lud_limit_populacji: 10,
        mp_regen_proc: 0,
        mp_max_proc: 0,
        mp_koszt_jednostki_proc: 0,
        wealth_cap_proc: 0,
        wealth_mnoznik_proc: 0,
        kultura_naplyw_proc: 0,
        religia_spread_proc: 0,
        porzadek_produkcja_proc: 0,
        porzadek_pieniadz_proc: 0,
        porzadek_nauka_proc: 0,
        porzadek_kultura_proc: 0,
        porzadek_wzrost_proc: 0,
        obl_obrona_miasta_proc: 0,
        obl_mur_proc: 0,
        obl_machines_proc: 0,
        dip_sklonnosc_sojusze: 4,
        dip_lojalnosc: 6,
        dip_prog_wojny: 6,
        dip_pamietliwosc: 7,
        dip_otwartosc_handel: 3,
        dip_nastawienie_bazowe: 41,
        dip_agresja_archetyp: 0.65,
        dip_handlowosc_archetyp: 0.3,
        ai_agresywnosc: 6,
        ai_ekspansywnosc: 4,
        ai_priorytet_militarny: 8,
        ai_priorytet_ekonomia: 4,
        ai_priorytet_nauka: 4,
        ai_tolerancja_ryzyka: 6,
        ai_sklonnosc_podboju: 4,
        ai_profil_obronna: 1
      }
    },
    {
      Cywilizacja: "Harappa",
      typCywilizacji: "harappa",
      ikonaId: "harappa",
      tier: 1,
      params: {
        meta_epoka_kamien: 1,
        meta_epoka_braz: 0,
        meta_epoka_zelazo: 0,
        meta_mnoznik_waluta: 2.4,
        meta_tier_roster: 1,
        walka_atak_piechota: 0,
        walka_atak_lukownicy: 0,
        walka_atak_kawaleria: -0.08,
        walka_atak_rydwany: 0,
        walka_atak_obleczenie: 0,
        walka_atak_morska: 0,
        walka_atak_wszystkie: 0,
        walka_obrona_piechota: 0,
        walka_obrona_lukownicy: 0,
        walka_obrona_kawaleria: 0,
        walka_obrona_rydwany: 0,
        walka_obrona_obleczenie: 0,
        walka_obrona_morska: 0,
        walka_pancerz_piechota: 0,
        walka_pancerz_lukownicy: 0,
        walka_pancerz_kawaleria: 0,
        walka_pancerz_rydwany: 0,
        walka_uderzenie_piechota: 0,
        walka_uderzenie_kawaleria: 0,
        walka_uderzenie_rydwany: 0,
        walka_dystans_lukownicy: 0,
        walka_dystans_rydwany: 0,
        walka_hp_piechota: 0,
        walka_hp_kawaleria: 0,
        walka_hp_rydwany: 0,
        walka_ruch_bitwa_proc: 0,
        walka_zasieg_proc: 0,
        walka_oblezenie_proc: 0,
        walka_koszt_rekrutacji_proc: 0,
        walka_atak_piechota_teren_las: 0,
        walka_obrona_piechota_teren_las: 0,
        walka_atak_piechota_terytorium_wlasne: 0,
        walka_obrona_piechota_terytorium_wlasne: 0.15,
        walka_atak_piechota_w_murze: 0,
        walka_obrona_piechota_w_murze: 0,
        walka_atak_piechota_runda_szarzy: 0,
        walka_obrona_piechota_runda_szarzy: 0,
        walka_atak_piechota_teren_wybrzeze: 0,
        walka_obrona_piechota_teren_wybrzeze: 0,
        spec_Atak: 56,
        spec_Obrazenia: 56,
        spec_Obrona: 89.6,
        spec_Uderzenie: 44.8,
        spec_Pancerz: 61.6,
        spec_Przebicie: 22.4,
        spec_Health: 72.8,
        spec_Atak_dystansowy: 0,
        spec_Zasieg_hex: 0,
        spec_Pociski: 0,
        spec_Ruch_bitwa: 3,
        spec_Ruch_mapa: 2,
        spec_Widok: 2,
        spec_Dezercja_proc: 0.3,
        spec_Morale: 65,
        spec_Koszt_pieniadz: 16,
        spec_Utrzymanie: 2,
        spec_Zywnosc_ture: 1,
        eko_praca_proc: 0.04,
        eko_pieniadz_proc: 0.15,
        eko_pieniadz_port_proc: 0,
        eko_zywnosc_proc: 0,
        eko_nauka_proc: 0,
        eko_kultura_proc: 0,
        eko_luksus_proc: 0,
        eko_zadowolenie_proc: 0,
        eko_handel_brutto_proc: 0.15,
        eko_korupcja_proc: 0,
        prod_koszt_budynku_proc: 0,
        prod_koszt_jednostki_proc: 0,
        prod_szybkosc_budynku_proc: 0,
        prod_szybkosc_jednostki_proc: 0,
        prod_rush_koszt_proc: 0,
        lud_wzrost_proc: 0,
        lud_spadek_proc: 0,
        lud_zdrowie_proc: 0,
        lud_zadowolenie_bazowe: 0,
        lud_limit_populacji: 10,
        mp_regen_proc: 0,
        mp_max_proc: 0,
        mp_koszt_jednostki_proc: 0,
        wealth_cap_proc: 0,
        wealth_mnoznik_proc: 0,
        kultura_naplyw_proc: 0,
        religia_spread_proc: 0,
        porzadek_produkcja_proc: 0,
        porzadek_pieniadz_proc: 0,
        porzadek_nauka_proc: 0,
        porzadek_kultura_proc: 0,
        porzadek_wzrost_proc: 0,
        obl_obrona_miasta_proc: 0,
        obl_mur_proc: 0,
        obl_machines_proc: 0,
        dip_sklonnosc_sojusze: 7,
        dip_lojalnosc: 6,
        dip_prog_wojny: 2,
        dip_pamietliwosc: 5,
        dip_otwartosc_handel: 8,
        dip_nastawienie_bazowe: 58,
        dip_agresja_archetyp: 0.25,
        dip_handlowosc_archetyp: 0.7,
        ai_agresywnosc: 2,
        ai_ekspansywnosc: 3,
        ai_priorytet_militarny: 4,
        ai_priorytet_ekonomia: 7,
        ai_priorytet_nauka: 5,
        ai_tolerancja_ryzyka: 4,
        ai_sklonnosc_podboju: 3,
        ai_profil_obronna: 1
      }
    },
    {
      Cywilizacja: "Hetyci",
      typCywilizacji: "hetyci",
      ikonaId: "hetyci",
      tier: 1,
      params: {
        meta_epoka_kamien: 0,
        meta_epoka_braz: 1,
        meta_epoka_zelazo: 0,
        meta_mnoznik_waluta: 2,
        meta_tier_roster: 1,
        walka_atak_piechota: 0,
        walka_atak_lukownicy: 0,
        walka_atak_kawaleria: 0,
        walka_atak_rydwany: 0.2,
        walka_atak_obleczenie: 0,
        walka_atak_morska: 0,
        walka_atak_wszystkie: 0,
        walka_obrona_piechota: 0,
        walka_obrona_lukownicy: 0,
        walka_obrona_kawaleria: 0,
        walka_obrona_rydwany: 0,
        walka_obrona_obleczenie: 0,
        walka_obrona_morska: 0,
        walka_pancerz_piechota: 0,
        walka_pancerz_lukownicy: 0,
        walka_pancerz_kawaleria: 0,
        walka_pancerz_rydwany: 0,
        walka_uderzenie_piechota: 0,
        walka_uderzenie_kawaleria: 0,
        walka_uderzenie_rydwany: 0,
        walka_dystans_lukownicy: 0,
        walka_dystans_rydwany: 0,
        walka_hp_piechota: 0,
        walka_hp_kawaleria: 0,
        walka_hp_rydwany: 0,
        walka_ruch_bitwa_proc: 0,
        walka_zasieg_proc: 0,
        walka_oblezenie_proc: 0,
        walka_koszt_rekrutacji_proc: 0,
        walka_atak_piechota_teren_las: 0,
        walka_obrona_piechota_teren_las: 0,
        walka_atak_piechota_terytorium_wlasne: 0,
        walka_obrona_piechota_terytorium_wlasne: 0,
        walka_atak_piechota_w_murze: 0,
        walka_obrona_piechota_w_murze: 0.15,
        walka_atak_piechota_runda_szarzy: 0,
        walka_obrona_piechota_runda_szarzy: 0,
        walka_atak_piechota_teren_wybrzeze: 0,
        walka_obrona_piechota_teren_wybrzeze: 0,
        spec_Atak: 6.9,
        spec_Obrazenia: 0,
        spec_Obrona: 2.3,
        spec_Uderzenie: 9.2,
        spec_Pancerz: 2.3,
        spec_Przebicie: 4.6,
        spec_Health: 103.5,
        spec_Atak_dystansowy: 0,
        spec_Zasieg_hex: 0,
        spec_Pociski: 0,
        spec_Ruch_bitwa: 6,
        spec_Ruch_mapa: 4,
        spec_Widok: 4,
        spec_Dezercja_proc: 0.3,
        spec_Morale: 100,
        spec_Koszt_pieniadz: 28,
        spec_Utrzymanie: 3,
        spec_Zywnosc_ture: 1,
        eko_praca_proc: 0,
        eko_pieniadz_proc: 0,
        eko_pieniadz_port_proc: -0.05,
        eko_zywnosc_proc: 0,
        eko_nauka_proc: 0,
        eko_kultura_proc: 0,
        eko_luksus_proc: 0,
        eko_zadowolenie_proc: 0,
        eko_handel_brutto_proc: 0,
        eko_korupcja_proc: 0,
        prod_koszt_budynku_proc: 0,
        prod_koszt_jednostki_proc: 0,
        prod_szybkosc_budynku_proc: 0,
        prod_szybkosc_jednostki_proc: 0,
        prod_rush_koszt_proc: 0,
        lud_wzrost_proc: 0,
        lud_spadek_proc: 0,
        lud_zdrowie_proc: 0,
        lud_zadowolenie_bazowe: 0,
        lud_limit_populacji: 10,
        mp_regen_proc: 0,
        mp_max_proc: 0,
        mp_koszt_jednostki_proc: 0,
        wealth_cap_proc: 0,
        wealth_mnoznik_proc: 0,
        kultura_naplyw_proc: 0,
        religia_spread_proc: 0,
        porzadek_produkcja_proc: 0,
        porzadek_pieniadz_proc: 0,
        porzadek_nauka_proc: 0,
        porzadek_kultura_proc: 0,
        porzadek_wzrost_proc: 0,
        obl_obrona_miasta_proc: 0,
        obl_mur_proc: 0,
        obl_machines_proc: 0,
        dip_sklonnosc_sojusze: 5,
        dip_lojalnosc: 6,
        dip_prog_wojny: 5,
        dip_pamietliwosc: 5,
        dip_otwartosc_handel: 5,
        dip_nastawienie_bazowe: 52,
        dip_agresja_archetyp: 0.45,
        dip_handlowosc_archetyp: 0.5,
        ai_agresywnosc: 5,
        ai_ekspansywnosc: 3,
        ai_priorytet_militarny: 6,
        ai_priorytet_ekonomia: 5,
        ai_priorytet_nauka: 4,
        ai_tolerancja_ryzyka: 4,
        ai_sklonnosc_podboju: 3,
        ai_profil_obronna: 1
      }
    },
    {
      Cywilizacja: "S\u0142owianie",
      typCywilizacji: "slowianie",
      ikonaId: "slowianie",
      tier: 1,
      params: {
        meta_epoka_kamien: 0,
        meta_epoka_braz: 0,
        meta_epoka_zelazo: 1,
        meta_mnoznik_waluta: 1.8,
        meta_tier_roster: 1,
        walka_atak_piechota: 0,
        walka_atak_lukownicy: 0,
        walka_atak_kawaleria: 0,
        walka_atak_rydwany: 0,
        walka_atak_obleczenie: 0,
        walka_atak_morska: 0,
        walka_atak_wszystkie: 0,
        walka_obrona_piechota: 0,
        walka_obrona_lukownicy: 0,
        walka_obrona_kawaleria: 0,
        walka_obrona_rydwany: 0,
        walka_obrona_obleczenie: 0,
        walka_obrona_morska: 0,
        walka_pancerz_piechota: 0,
        walka_pancerz_lukownicy: 0,
        walka_pancerz_kawaleria: 0,
        walka_pancerz_rydwany: 0,
        walka_uderzenie_piechota: 0,
        walka_uderzenie_kawaleria: 0,
        walka_uderzenie_rydwany: 0,
        walka_dystans_lukownicy: 0,
        walka_dystans_rydwany: 0,
        walka_hp_piechota: 0,
        walka_hp_kawaleria: 0,
        walka_hp_rydwany: 0,
        walka_ruch_bitwa_proc: 0,
        walka_zasieg_proc: 0,
        walka_oblezenie_proc: 0,
        walka_koszt_rekrutacji_proc: 0,
        walka_atak_piechota_teren_las: 0.15,
        walka_obrona_piechota_teren_las: 0,
        walka_atak_piechota_terytorium_wlasne: 0,
        walka_obrona_piechota_terytorium_wlasne: 0,
        walka_atak_piechota_w_murze: 0,
        walka_obrona_piechota_w_murze: 0,
        walka_atak_piechota_runda_szarzy: 0,
        walka_obrona_piechota_runda_szarzy: 0,
        walka_atak_piechota_teren_wybrzeze: 0,
        walka_obrona_piechota_teren_wybrzeze: 0,
        spec_Atak: 57,
        spec_Obrazenia: 57,
        spec_Obrona: 91.2,
        spec_Uderzenie: 45.6,
        spec_Pancerz: 62.7,
        spec_Przebicie: 22.8,
        spec_Health: 74.1,
        spec_Atak_dystansowy: 0,
        spec_Zasieg_hex: 0,
        spec_Pociski: 0,
        spec_Ruch_bitwa: 3,
        spec_Ruch_mapa: 2,
        spec_Widok: 2,
        spec_Dezercja_proc: 0.3,
        spec_Morale: 65,
        spec_Koszt_pieniadz: 16,
        spec_Utrzymanie: 2,
        spec_Zywnosc_ture: 1,
        eko_praca_proc: 0,
        eko_pieniadz_proc: 0,
        eko_pieniadz_port_proc: 0,
        eko_zywnosc_proc: 0,
        eko_nauka_proc: -0.05,
        eko_kultura_proc: 0,
        eko_luksus_proc: 0,
        eko_zadowolenie_proc: 0,
        eko_handel_brutto_proc: 0,
        eko_korupcja_proc: 0,
        prod_koszt_budynku_proc: 0,
        prod_koszt_jednostki_proc: 0,
        prod_szybkosc_budynku_proc: 0,
        prod_szybkosc_jednostki_proc: 0,
        prod_rush_koszt_proc: 0,
        lud_wzrost_proc: 0.03,
        lud_spadek_proc: 0,
        lud_zdrowie_proc: 0,
        lud_zadowolenie_bazowe: 0,
        lud_limit_populacji: 10,
        mp_regen_proc: 0.1,
        mp_max_proc: 0,
        mp_koszt_jednostki_proc: 0,
        wealth_cap_proc: 0,
        wealth_mnoznik_proc: 0,
        kultura_naplyw_proc: 0,
        religia_spread_proc: 0,
        porzadek_produkcja_proc: 0,
        porzadek_pieniadz_proc: 0,
        porzadek_nauka_proc: 0,
        porzadek_kultura_proc: 0,
        porzadek_wzrost_proc: 0,
        obl_obrona_miasta_proc: 0,
        obl_mur_proc: 0,
        obl_machines_proc: 0,
        dip_sklonnosc_sojusze: 4,
        dip_lojalnosc: 5,
        dip_prog_wojny: 6,
        dip_pamietliwosc: 5,
        dip_otwartosc_handel: 4,
        dip_nastawienie_bazowe: 48,
        dip_agresja_archetyp: 0.55,
        dip_handlowosc_archetyp: 0.4,
        ai_agresywnosc: 6,
        ai_ekspansywnosc: 4,
        ai_priorytet_militarny: 6,
        ai_priorytet_ekonomia: 5,
        ai_priorytet_nauka: 5,
        ai_tolerancja_ryzyka: 4,
        ai_sklonnosc_podboju: 3,
        ai_profil_obronna: 1
      }
    },
    {
      Cywilizacja: "Babilonia",
      typCywilizacji: "babilonia",
      ikonaId: "babilonia",
      tier: 2,
      params: {
        meta_epoka_kamien: 0,
        meta_epoka_braz: 1,
        meta_epoka_zelazo: 0,
        meta_mnoznik_waluta: 2.3,
        meta_tier_roster: 2,
        walka_atak_piechota: 0,
        walka_atak_lukownicy: 0,
        walka_atak_kawaleria: 0,
        walka_atak_rydwany: 0,
        walka_atak_obleczenie: 0,
        walka_atak_morska: 0,
        walka_atak_wszystkie: 0,
        walka_obrona_piechota: 0,
        walka_obrona_lukownicy: 0,
        walka_obrona_kawaleria: 0,
        walka_obrona_rydwany: 0,
        walka_obrona_obleczenie: 0,
        walka_obrona_morska: 0,
        walka_pancerz_piechota: 0,
        walka_pancerz_lukownicy: 0,
        walka_pancerz_kawaleria: 0,
        walka_pancerz_rydwany: 0,
        walka_uderzenie_piechota: 0,
        walka_uderzenie_kawaleria: 0,
        walka_uderzenie_rydwany: 0,
        walka_dystans_lukownicy: 0,
        walka_dystans_rydwany: 0,
        walka_hp_piechota: 0,
        walka_hp_kawaleria: 0,
        walka_hp_rydwany: 0,
        walka_ruch_bitwa_proc: 0,
        walka_zasieg_proc: 0,
        walka_oblezenie_proc: 0,
        walka_koszt_rekrutacji_proc: 0,
        walka_atak_piechota_teren_las: 0,
        walka_obrona_piechota_teren_las: 0,
        walka_atak_piechota_terytorium_wlasne: 0,
        walka_obrona_piechota_terytorium_wlasne: 0,
        walka_atak_piechota_w_murze: 0,
        walka_obrona_piechota_w_murze: 0,
        walka_atak_piechota_runda_szarzy: 0,
        walka_obrona_piechota_runda_szarzy: 0,
        walka_atak_piechota_teren_wybrzeze: 0,
        walka_obrona_piechota_teren_wybrzeze: 0,
        spec_Atak: 50.85,
        spec_Obrazenia: 50.85,
        spec_Obrona: 42.94,
        spec_Uderzenie: 22.6,
        spec_Pancerz: 22.6,
        spec_Przebicie: 11.3,
        spec_Health: 50.85,
        spec_Atak_dystansowy: 0,
        spec_Zasieg_hex: 0,
        spec_Pociski: 0,
        spec_Ruch_bitwa: 4,
        spec_Ruch_mapa: 2,
        spec_Widok: 2,
        spec_Dezercja_proc: 0.4,
        spec_Morale: 50,
        spec_Koszt_pieniadz: 10,
        spec_Utrzymanie: 1,
        spec_Zywnosc_ture: 1,
        eko_praca_proc: 0,
        eko_pieniadz_proc: 0.1,
        eko_pieniadz_port_proc: 0,
        eko_zywnosc_proc: 0,
        eko_nauka_proc: 0.15,
        eko_kultura_proc: 0,
        eko_luksus_proc: 0,
        eko_zadowolenie_proc: 0,
        eko_handel_brutto_proc: 0.1,
        eko_korupcja_proc: 0,
        prod_koszt_budynku_proc: 0,
        prod_koszt_jednostki_proc: 0,
        prod_szybkosc_budynku_proc: 0,
        prod_szybkosc_jednostki_proc: 0,
        prod_rush_koszt_proc: 0,
        lud_wzrost_proc: 0,
        lud_spadek_proc: 0,
        lud_zdrowie_proc: 0,
        lud_zadowolenie_bazowe: 0,
        lud_limit_populacji: 10,
        mp_regen_proc: 0,
        mp_max_proc: 0,
        mp_koszt_jednostki_proc: 0,
        wealth_cap_proc: 0,
        wealth_mnoznik_proc: 0,
        kultura_naplyw_proc: 0,
        religia_spread_proc: 0,
        porzadek_produkcja_proc: 0,
        porzadek_pieniadz_proc: 0,
        porzadek_nauka_proc: 0,
        porzadek_kultura_proc: 0,
        porzadek_wzrost_proc: 0,
        obl_obrona_miasta_proc: 0,
        obl_mur_proc: 0,
        obl_machines_proc: 0,
        dip_sklonnosc_sojusze: 6,
        dip_lojalnosc: 5,
        dip_prog_wojny: 4,
        dip_pamietliwosc: 5,
        dip_otwartosc_handel: 6,
        dip_nastawienie_bazowe: 55,
        dip_agresja_archetyp: 0.3,
        dip_handlowosc_archetyp: 0.65,
        ai_agresywnosc: 3,
        ai_ekspansywnosc: 2,
        ai_priorytet_militarny: 4,
        ai_priorytet_ekonomia: 6,
        ai_priorytet_nauka: 8,
        ai_tolerancja_ryzyka: 4,
        ai_sklonnosc_podboju: 2,
        ai_profil_obronna: 0
      }
    },
    {
      Cywilizacja: "Asyria",
      typCywilizacji: "asyria",
      ikonaId: "asyria",
      tier: 2,
      params: {
        meta_epoka_kamien: 0,
        meta_epoka_braz: 1,
        meta_epoka_zelazo: 0,
        meta_mnoznik_waluta: 1.7,
        meta_tier_roster: 2,
        walka_atak_piechota: 0,
        walka_atak_lukownicy: 0,
        walka_atak_kawaleria: 0,
        walka_atak_rydwany: 0,
        walka_atak_obleczenie: 0.15,
        walka_atak_morska: 0,
        walka_atak_wszystkie: 0,
        walka_obrona_piechota: 0,
        walka_obrona_lukownicy: 0,
        walka_obrona_kawaleria: 0,
        walka_obrona_rydwany: 0,
        walka_obrona_obleczenie: 0,
        walka_obrona_morska: 0,
        walka_pancerz_piechota: 0,
        walka_pancerz_lukownicy: 0,
        walka_pancerz_kawaleria: 0,
        walka_pancerz_rydwany: 0,
        walka_uderzenie_piechota: 0,
        walka_uderzenie_kawaleria: 0,
        walka_uderzenie_rydwany: 0,
        walka_dystans_lukownicy: 0.2,
        walka_dystans_rydwany: 0,
        walka_hp_piechota: 0,
        walka_hp_kawaleria: 0,
        walka_hp_rydwany: 0,
        walka_ruch_bitwa_proc: 0,
        walka_zasieg_proc: 0,
        walka_oblezenie_proc: 0,
        walka_koszt_rekrutacji_proc: 0,
        walka_atak_piechota_teren_las: 0,
        walka_obrona_piechota_teren_las: 0,
        walka_atak_piechota_terytorium_wlasne: 0,
        walka_obrona_piechota_terytorium_wlasne: 0,
        walka_atak_piechota_w_murze: 0,
        walka_obrona_piechota_w_murze: 0,
        walka_atak_piechota_runda_szarzy: 0,
        walka_obrona_piechota_runda_szarzy: 0,
        walka_atak_piechota_teren_wybrzeze: 0,
        walka_obrona_piechota_teren_wybrzeze: 0,
        spec_Atak: 30,
        spec_Obrazenia: 35,
        spec_Obrona: 20,
        spec_Uderzenie: 10,
        spec_Pancerz: 10,
        spec_Przebicie: 15,
        spec_Health: 30,
        spec_Atak_dystansowy: 35,
        spec_Zasieg_hex: 3,
        spec_Pociski: 12,
        spec_Ruch_bitwa: 3,
        spec_Ruch_mapa: 2,
        spec_Widok: 2,
        spec_Dezercja_proc: 0.5,
        spec_Morale: 40,
        spec_Koszt_pieniadz: 6,
        spec_Utrzymanie: 1,
        spec_Zywnosc_ture: 1,
        eko_praca_proc: -0.02,
        eko_pieniadz_proc: 0,
        eko_pieniadz_port_proc: 0,
        eko_zywnosc_proc: 0,
        eko_nauka_proc: 0,
        eko_kultura_proc: 0,
        eko_luksus_proc: 0,
        eko_zadowolenie_proc: 0,
        eko_handel_brutto_proc: 0,
        eko_korupcja_proc: 0,
        prod_koszt_budynku_proc: 0,
        prod_koszt_jednostki_proc: 0,
        prod_szybkosc_budynku_proc: 0,
        prod_szybkosc_jednostki_proc: 0,
        prod_rush_koszt_proc: 0,
        lud_wzrost_proc: 0,
        lud_spadek_proc: 0,
        lud_zdrowie_proc: 0,
        lud_zadowolenie_bazowe: 0,
        lud_limit_populacji: 10,
        mp_regen_proc: 0,
        mp_max_proc: 0,
        mp_koszt_jednostki_proc: 0,
        wealth_cap_proc: 0,
        wealth_mnoznik_proc: 0,
        kultura_naplyw_proc: 0,
        religia_spread_proc: 0,
        porzadek_produkcja_proc: 0,
        porzadek_pieniadz_proc: 0,
        porzadek_nauka_proc: 0,
        porzadek_kultura_proc: 0,
        porzadek_wzrost_proc: 0,
        obl_obrona_miasta_proc: 0,
        obl_mur_proc: 0,
        obl_machines_proc: 0,
        dip_sklonnosc_sojusze: 2,
        dip_lojalnosc: 4,
        dip_prog_wojny: 9,
        dip_pamietliwosc: 5,
        dip_otwartosc_handel: 3,
        dip_nastawienie_bazowe: 38,
        dip_agresja_archetyp: 0.8,
        dip_handlowosc_archetyp: 0.25,
        ai_agresywnosc: 8,
        ai_ekspansywnosc: 5,
        ai_priorytet_militarny: 8,
        ai_priorytet_ekonomia: 5,
        ai_priorytet_nauka: 5,
        ai_tolerancja_ryzyka: 4,
        ai_sklonnosc_podboju: 5,
        ai_profil_obronna: 0
      }
    },
    {
      Cywilizacja: "Fenicjanie",
      typCywilizacji: "fenicjanie",
      ikonaId: "fenicjanie",
      tier: 2,
      params: {
        meta_epoka_kamien: 0,
        meta_epoka_braz: 0,
        meta_epoka_zelazo: 1,
        meta_mnoznik_waluta: 2.6,
        meta_tier_roster: 2,
        walka_atak_piechota: 0,
        walka_atak_lukownicy: 0,
        walka_atak_kawaleria: 0,
        walka_atak_rydwany: 0,
        walka_atak_obleczenie: 0,
        walka_atak_morska: 0,
        walka_atak_wszystkie: 0,
        walka_obrona_piechota: -0.05,
        walka_obrona_lukownicy: 0,
        walka_obrona_kawaleria: 0,
        walka_obrona_rydwany: 0,
        walka_obrona_obleczenie: 0,
        walka_obrona_morska: 0,
        walka_pancerz_piechota: 0,
        walka_pancerz_lukownicy: 0,
        walka_pancerz_kawaleria: 0,
        walka_pancerz_rydwany: 0,
        walka_uderzenie_piechota: 0,
        walka_uderzenie_kawaleria: 0,
        walka_uderzenie_rydwany: 0,
        walka_dystans_lukownicy: 0,
        walka_dystans_rydwany: 0,
        walka_hp_piechota: 0,
        walka_hp_kawaleria: 0,
        walka_hp_rydwany: 0,
        walka_ruch_bitwa_proc: 0,
        walka_zasieg_proc: 0,
        walka_oblezenie_proc: 0,
        walka_koszt_rekrutacji_proc: 0,
        walka_atak_piechota_teren_las: 0,
        walka_obrona_piechota_teren_las: 0,
        walka_atak_piechota_terytorium_wlasne: 0,
        walka_obrona_piechota_terytorium_wlasne: 0,
        walka_atak_piechota_w_murze: 0,
        walka_obrona_piechota_w_murze: 0,
        walka_atak_piechota_runda_szarzy: 0,
        walka_obrona_piechota_runda_szarzy: 0,
        walka_atak_piechota_teren_wybrzeze: 0,
        walka_obrona_piechota_teren_wybrzeze: 0,
        spec_Atak: 50.4,
        spec_Obrazenia: 50.4,
        spec_Obrona: 42.56,
        spec_Uderzenie: 22.4,
        spec_Pancerz: 22.4,
        spec_Przebicie: 11.2,
        spec_Health: 50.4,
        spec_Atak_dystansowy: 0,
        spec_Zasieg_hex: 0,
        spec_Pociski: 0,
        spec_Ruch_bitwa: 4,
        spec_Ruch_mapa: 2,
        spec_Widok: 2,
        spec_Dezercja_proc: 0.4,
        spec_Morale: 50,
        spec_Koszt_pieniadz: 10,
        spec_Utrzymanie: 1,
        spec_Zywnosc_ture: 1,
        eko_praca_proc: 0.05,
        eko_pieniadz_proc: 0.35,
        eko_pieniadz_port_proc: 0.25,
        eko_zywnosc_proc: 0,
        eko_nauka_proc: 0,
        eko_kultura_proc: 0,
        eko_luksus_proc: 0,
        eko_zadowolenie_proc: 0,
        eko_handel_brutto_proc: 0.35,
        eko_korupcja_proc: 0,
        prod_koszt_budynku_proc: 0,
        prod_koszt_jednostki_proc: 0,
        prod_szybkosc_budynku_proc: 0,
        prod_szybkosc_jednostki_proc: 0,
        prod_rush_koszt_proc: 0,
        lud_wzrost_proc: 0,
        lud_spadek_proc: 0,
        lud_zdrowie_proc: 0,
        lud_zadowolenie_bazowe: 0,
        lud_limit_populacji: 10,
        mp_regen_proc: 0,
        mp_max_proc: 0,
        mp_koszt_jednostki_proc: 0,
        wealth_cap_proc: 0,
        wealth_mnoznik_proc: 0,
        kultura_naplyw_proc: 0,
        religia_spread_proc: 0,
        porzadek_produkcja_proc: 0,
        porzadek_pieniadz_proc: 0,
        porzadek_nauka_proc: 0,
        porzadek_kultura_proc: 0,
        porzadek_wzrost_proc: 0,
        obl_obrona_miasta_proc: 0,
        obl_mur_proc: 0,
        obl_machines_proc: 0,
        dip_sklonnosc_sojusze: 5,
        dip_lojalnosc: 4,
        dip_prog_wojny: 3,
        dip_pamietliwosc: 5,
        dip_otwartosc_handel: 9,
        dip_nastawienie_bazowe: 62,
        dip_agresja_archetyp: 0.25,
        dip_handlowosc_archetyp: 0.9,
        ai_agresywnosc: 3,
        ai_ekspansywnosc: 2,
        ai_priorytet_militarny: 5,
        ai_priorytet_ekonomia: 8,
        ai_priorytet_nauka: 5,
        ai_tolerancja_ryzyka: 3,
        ai_sklonnosc_podboju: 3,
        ai_profil_obronna: 0
      }
    }
  ]
};

// src/game/civ-matrix.ts
var DATA = civ_matrix_default;
function resolveRow(civKey) {
  const key = civKey.toLowerCase();
  return DATA.cywilizacje.find(
    (c) => c.ikonaId.toLowerCase() === key || c.typCywilizacji.toLowerCase() === key || c.Cywilizacja.toLowerCase() === key
  );
}
function civMatrixParam(civKey, paramId) {
  const row = resolveRow(civKey);
  if (!row) return DATA.defaults[paramId] ?? 0;
  return row.params[paramId] ?? DATA.defaults[paramId] ?? 0;
}

// src/game/culture-religion.ts
function pick(row, difficulty, fallback) {
  if (row === void 0) return fallback;
  const v = row[difficulty];
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}
function clamp2(x, lo, hi) {
  if (x < lo) return lo;
  if (x > hi) return hi;
  return x;
}
var FALLBACK_CULTURE_PARAMS = Object.freeze({
  progZasieg1: 100,
  progZasieg2: 250,
  progZasieg3: 500,
  zadowolenie100: 2,
  zadowolenie75: 1,
  zadowolenie50: 0,
  karaLt50: -1,
  karaLt25: -2,
  konwersjaBaza: 1,
  konwersjaSwiatynia: 1.5,
  konwersjaAmfiteatr: 1,
  konwersjaBiblioteka: 2,
  konwersjaPalac: 2,
  konwersjaStela: 0.5,
  konwersjaSad: 2,
  konwersjaLaznia: 1,
  konwersjaCapTura: 5
});
var FALLBACK_RELIGION_PARAMS = Object.freeze({
  progDominacjiPct: 50,
  szybkoscSzerzeniaBazowa: 1,
  swiatyniaBonusSzerzenia: 1,
  szerzenieMaxDystans: 3,
  zadowolenieDominujaca: 2,
  karaObca: -2,
  karaBrakReligii: -1,
  konwersjaBazaPct: 2,
  konwersjaSwiatyniaPct: 4,
  konwersjaKregiPct: 2
});
function loadReligionParams(society, difficulty = "normal") {
  const r = society && society.religia || {};
  const f = FALLBACK_RELIGION_PARAMS;
  return {
    progDominacjiPct: pick(r.religia_prog_dominacji, difficulty, f.progDominacjiPct),
    szybkoscSzerzeniaBazowa: pick(r.religia_szybkosc_szerzenia_bazowa, difficulty, f.szybkoscSzerzeniaBazowa),
    swiatyniaBonusSzerzenia: pick(r.religia_swiatynia_bonus_szerzenia, difficulty, f.swiatyniaBonusSzerzenia),
    szerzenieMaxDystans: pick(r.religia_szerzenie_max_dystans, difficulty, f.szerzenieMaxDystans),
    zadowolenieDominujaca: pick(r.religia_zadowolenie_dominujaca, difficulty, f.zadowolenieDominujaca),
    karaObca: pick(r.religia_kara_obca, difficulty, f.karaObca),
    karaBrakReligii: pick(r.religia_kara_brak_religii, difficulty, f.karaBrakReligii),
    konwersjaBazaPct: pick(r.religia_konwersja_bazowa, difficulty, f.konwersjaBazaPct),
    konwersjaSwiatyniaPct: pick(r.religia_konwersja_swiatynia, difficulty, f.konwersjaSwiatyniaPct),
    konwersjaKregiPct: pick(r.religia_konwersja_kregi, difficulty, f.konwersjaKregiPct)
  };
}
function totalAdherents(state) {
  let sum = 0;
  for (const k in state.counts) {
    const v = state.counts[k];
    if (typeof v === "number" && Number.isFinite(v) && v > 0) sum += v;
  }
  return sum;
}
function leadingReligion(state) {
  const total = totalAdherents(state);
  if (total <= 0) return { name: null, count: 0, total: 0 };
  let bestName = null;
  let bestCount = -1;
  for (const k of Object.keys(state.counts).sort()) {
    const v = state.counts[k];
    const c = typeof v === "number" && Number.isFinite(v) && v > 0 ? v : 0;
    if (c > bestCount) {
      bestCount = c;
      bestName = k;
    }
  }
  return { name: bestName, count: Math.max(0, bestCount), total };
}
function dominantReligion(state, params = FALLBACK_RELIGION_PARAMS) {
  const { name, count, total } = leadingReligion(state);
  if (total <= 0 || name === null) {
    return { religion: null, share: 0, status: "none" };
  }
  const share = count / total;
  const threshold = clamp2(params.progDominacjiPct, 0, 100) / 100;
  if (share > threshold) {
    return { religion: name, share, status: "dominant" };
  }
  return { religion: null, share, status: "mixed" };
}
var FALLBACK_TRADE_MULT = 1;
function cityTradeMultiplier(cityReligion, ownerCivName, civs, religionParams = FALLBACK_RELIGION_PARAMS, gated = false) {
  const civList = civs && civs.cywilizacje || [];
  let civRow = null;
  if (ownerCivName) {
    for (const row of civList) {
      if (row && row.Cywilizacja === ownerCivName) {
        civRow = row;
        break;
      }
    }
  }
  let civBaseMultiplier = null;
  if (civRow !== null) {
    const v = civRow.mnoznikHandelPieniadz;
    if (typeof v === "number" && Number.isFinite(v) && v > 0) {
      civBaseMultiplier = v;
    }
  }
  const dom = dominantReligion(cityReligion, religionParams);
  const domReligion = dom.status === "dominant" ? dom.religion : null;
  let ownerReligion = null;
  if (civRow !== null) {
    const r = civRow.Religia;
    if (typeof r === "string" && r.length > 0) ownerReligion = r;
  }
  const religionMatches = domReligion !== null && ownerReligion !== null && domReligion === ownerReligion;
  const applied = gated && religionMatches && civBaseMultiplier !== null;
  const multiplier = applied ? civBaseMultiplier : FALLBACK_TRADE_MULT;
  return { multiplier, civBaseMultiplier, dominantReligion: domReligion, applied };
}

// src/map/territory.ts
function axialDistance(aq, ar, bq, br) {
  const as_ = -aq - ar;
  const bs = -bq - br;
  return (Math.abs(aq - bq) + Math.abs(ar - br) + Math.abs(as_ - bs)) / 2;
}
function cityTerritoryRadius(node) {
  if (node.isFort) return 10;
  if (node.isOutpost) return 5;
  return cityRangeForPopulation(node.pop);
}
function territoryOwnerAt(q, r, nodes) {
  let bestOwner = null;
  let bestDist = Infinity;
  for (const node of nodes) {
    const radius = cityTerritoryRadius(node);
    const dist = axialDistance(q, r, node.q, node.r);
    if (dist > radius) continue;
    if (dist < bestDist) {
      bestDist = dist;
      bestOwner = node.ownerId;
    }
  }
  return bestOwner;
}

// src/map/territory-work.ts
function buildTerritoryNodesFromCities(cities) {
  return cities.map((c) => ({
    q: c.q,
    r: c.r,
    pop: c.population,
    level: 1,
    ownerId: c.ownerId
  }));
}
function isTerritoryHexOwnedBy(q, r, ownerId, territoryNodes) {
  if (!territoryNodes.length) return false;
  return territoryOwnerAt(q, r, territoryNodes) === ownerId;
}
function makeTerritoryWorkableFilter(territoryNodes, ownerId, baseWorkable) {
  return (q, r) => {
    if (baseWorkable && !baseWorkable(q, r)) return false;
    return isTerritoryHexOwnedBy(q, r, ownerId, territoryNodes);
  };
}
function reconcileWorkedTilesForOwner(cities, territoryNodes, ownerId) {
  let changed = false;
  for (const city of cities) {
    if (city.ownerId !== ownerId) continue;
    if (!city.okolicaReczne) continue;
    const reczne = { ...city.okolicaReczne };
    let cityChanged = false;
    for (const key of Object.keys(reczne)) {
      const parts = key.split(",");
      const q = Number(parts[0]);
      const r = Number(parts[1]);
      if (!Number.isFinite(q) || !Number.isFinite(r)) continue;
      if (!isTerritoryHexOwnedBy(q, r, ownerId, territoryNodes)) {
        delete reczne[key];
        cityChanged = true;
      }
    }
    if (cityChanged) {
      city.okolicaReczne = reczne;
      changed = true;
    }
  }
  return changed;
}
function reconcileAllWorkedTiles(cities, territoryNodes) {
  const owners = new Set(cities.map((c) => c.ownerId));
  for (const oid of owners) {
    reconcileWorkedTilesForOwner(cities, territoryNodes, oid);
  }
}

// src/game/okolica.ts
var OKOLICA_RADIUS = miasto_params_default.zasieg_okolicy_miasta?.wartosc ?? 5;
var CITY_RANGE_MIN = miasto_params_default.zasieg_okolicy_baza?.wartosc ?? 5;
var CITY_RANGE_CAP = miasto_params_default.zasieg_okolicy_max?.wartosc ?? 15;
function cityRangeForPopulation(population) {
  const pop = Number.isFinite(population) ? Math.floor(population) : 0;
  if (pop <= 0) return 0;
  return Math.min(Math.max(CITY_RANGE_MIN, pop), CITY_RANGE_CAP);
}
function hexKeysWithinRadius(cq, cr, rad, map) {
  const out = [];
  const r = Number.isFinite(rad) && rad > 0 ? Math.floor(rad) : 0;
  for (let dq = -r; dq <= r; dq++) {
    const lo = Math.max(-r, -dq - r), hi = Math.min(r, -dq + r);
    for (let dr = lo; dr <= hi; dr++) {
      const key = `${cq + dq},${cr + dr}`;
      if (map.hexes[key]) out.push(key);
    }
  }
  return out;
}
function okolicaTiles(centerQ, centerR, radius, map, isWorkable) {
  const out = [];
  const rad = Number.isFinite(radius) && radius > 0 ? Math.floor(radius) : 1;
  for (const key of hexKeysWithinRadius(centerQ, centerR, rad, map)) {
    const parts = key.split(",");
    const q = Number(parts[0]);
    const rr = Number(parts[1]);
    if (!Number.isFinite(q) || !Number.isFinite(rr)) continue;
    if (q === centerQ && rr === centerR) continue;
    const d = hexDistance(centerQ, centerR, q, rr);
    if (d > rad) continue;
    if (isWorkable && !isWorkable(q, rr)) continue;
    out.push({ q, r: rr, key, dist: d });
  }
  return out;
}
function tileScore(y, wagi) {
  const wz = wagi?.zywnosc ?? 1;
  const wp = wagi?.praca ?? 1;
  const wh = wagi?.handel ?? 1;
  return (y.zywnosc ?? 0) * wz + (y.praca ?? 0) * wp + (y.handel ?? 0) * wh;
}
function tileAssignScore(y, wagi, foodPotential = 0) {
  return tileScore(y, wagi) + foodPotential;
}
function compareScoredOkolicaTiles(a, b, focus) {
  if (b.s !== a.s) return b.s - a.s;
  if (focus === "zywnosc") {
    const az = a.y.zywnosc ?? 0;
    const bz = b.y.zywnosc ?? 0;
    if (bz !== az) return bz - az;
    if (b.potential !== a.potential) return b.potential - a.potential;
  }
  if (a.t.dist !== b.t.dist) return a.t.dist - b.t.dist;
  return a.t.key.localeCompare(b.t.key);
}
function scoreOkolicaTile(t, yieldOf, opts) {
  const y = yieldOf(t.q, t.r);
  const potential = opts.potentialOf?.(t.q, t.r) ?? 0;
  return { t, s: tileAssignScore(y, opts.wagi, potential), y, potential };
}
function foodPotentialOfMapHex(map, q, r) {
  const h = map.hexes[`${q},${r}`];
  if (!h) return 0;
  const key = normalizeImprovementKey(String(h.ulepszenie ?? "brak"));
  const keys = key ? [key] : [];
  return foodPotentialForHex(h.terenBazowy, h.nakladka ?? "brak" /* Brak */, keys);
}
function assignOptionsForFocus(base, focus, map) {
  if (focus !== "zywnosc") return base;
  return {
    ...base,
    focus,
    potentialOf: (q, r) => foodPotentialOfMapHex(map, q, r)
  };
}
function effectiveIsWorkable(opts) {
  const { territoryNodes, ownerId, isWorkable } = opts;
  if (territoryNodes != null && ownerId != null) {
    return makeTerritoryWorkableFilter(territoryNodes, ownerId, isWorkable);
  }
  return isWorkable;
}
function assignWorkedTiles(centerQ, centerR, population, map, yieldOf, opts = {}) {
  const radius = opts.radius ?? cityRangeForPopulation(population);
  const tiles = okolicaTiles(centerQ, centerR, radius, map, effectiveIsWorkable(opts));
  const scored = tiles.map((t) => scoreOkolicaTile(t, yieldOf, opts));
  scored.sort((a, b) => compareScoredOkolicaTiles(a, b, opts.focus));
  const n = Math.max(0, Math.min(Math.floor(Number.isFinite(population) ? population : 0), scored.length));
  return scored.slice(0, n).map((x) => x.t);
}
function wagiForFocus(focus = DEFAULT_OKOLICA_FOCUS) {
  switch (focus) {
    case "zywnosc":
      return { zywnosc: 10, praca: 0, handel: 0 };
    case "produkcja":
      return { zywnosc: 0.5, praca: 3, handel: 0.5 };
    case "podatki":
      return { zywnosc: 0.5, praca: 0.5, handel: 3 };
    case "zrownowazone":
    default:
      return { zywnosc: 1, praca: 1, handel: 1 };
  }
}
function resolveWorkedTiles(city, map, yieldOf, opts = {}) {
  const pop = Math.max(0, Math.floor(city.population ?? 0));
  const radius = opts.radius ?? cityRangeForPopulation(pop);
  const tryb = opts.tryb ?? city.okolicaTryb ?? DEFAULT_OKOLICA_TRYB;
  const focus = opts.focus ?? city.okolicaFocus ?? DEFAULT_OKOLICA_FOCUS;
  const workFilter = effectiveIsWorkable(opts);
  if (tryb === "reczny") {
    const reczne = opts.reczne ?? city.okolicaReczne ?? {};
    const tiles = okolicaTiles(city.q, city.r, radius, map, workFilter);
    const tileMap = new Map(tiles.map((t) => [t.key, t]));
    const out = [];
    for (const [key, count] of Object.entries(reczne)) {
      if (!count || count <= 0) continue;
      const t = tileMap.get(key);
      if (t) out.push(t);
    }
    if (out.length > pop) return out.slice(0, pop);
    return out;
  }
  return assignWorkedTiles(city.q, city.r, pop, map, yieldOf, assignOptionsForFocus({
    radius,
    isWorkable: opts.isWorkable,
    territoryNodes: opts.territoryNodes,
    ownerId: opts.ownerId ?? city.ownerId,
    wagi: wagiForFocus(focus)
  }, focus, map));
}

// src/game/population-growth-v85.ts
var WYZYWIENIE_MIN = 0;
var WYZYWIENIE_MAX = 6;
var WYZYWIENIE_STEP = 0.5;
var WYZYWIENIE_LEVELS = Array.from(
  { length: Math.round((WYZYWIENIE_MAX - WYZYWIENIE_MIN) / WYZYWIENIE_STEP) + 1 },
  (_, i) => WYZYWIENIE_MIN + i * WYZYWIENIE_STEP
);
var WYZYWIENIE_GROWTH_PCT = {
  0: -10,
  0.5: -6,
  1: -2,
  1.5: 0,
  2: 1.5,
  2.5: 3,
  3: 3.5,
  3.5: 4,
  4: 4.5,
  4.5: 5,
  5: 5.5,
  5.5: 6,
  6: 7
};
var DEFAULT_POZIOM_RACJI = 4;
function pick2(row, d, fallback) {
  if (!row) return fallback;
  const v = row[d];
  return Number.isFinite(v) ? v : fallback;
}
function buildRationParams(raw, difficulty = "normal") {
  const section = raw.ekonomia_miasta ?? raw;
  return {
    racjeZywnosc1: pick2(section.racje_zywnosc_1, difficulty, 2),
    racjeZywnosc2: pick2(section.racje_zywnosc_2, difficulty, 4),
    racjeZywnosc3: pick2(section.racje_zywnosc_3, difficulty, 6),
    racjeWzrostProc1: pick2(section.racje_wzrost_proc_1, difficulty, 3),
    racjeWzrostProc2: pick2(section.racje_wzrost_proc_2, difficulty, 5),
    racjeWzrostProc3: pick2(section.racje_wzrost_proc_3, difficulty, 7)
  };
}
function clampPoziomRacji(n) {
  const clamped = Math.min(WYZYWIENIE_MAX, Math.max(WYZYWIENIE_MIN, n));
  return Math.round(clamped / WYZYWIENIE_STEP) * WYZYWIENIE_STEP;
}
function migrateProcentRozwojToPoziomRacji(procentRozwoj) {
  if (procentRozwoj === void 0) return DEFAULT_POZIOM_RACJI;
  return clampPoziomRacji(procentRozwoj / 100 * WYZYWIENIE_MAX);
}
function getCityRationLevel(city) {
  if (city.poziomRacji !== void 0) return clampPoziomRacji(city.poziomRacji);
  return migrateProcentRozwojToPoziomRacji(city.procentRozwoj);
}
function rationFoodCostPerPop(level, _params) {
  return clampPoziomRacji(level) * R_STAWKI_KOSZT_MULT;
}
function rationGrowthPercent(level, _params) {
  const key = clampPoziomRacji(level);
  return WYZYWIENIE_GROWTH_PCT[key] ?? 0;
}
function computeCityRationCost(population, level, params, spichlerzState) {
  const base = Math.max(0, population) * rationFoodCostPerPop(level, params);
  const mult = spichlerzState ? spichlerzRationFoodCostMultiplier(spichlerzState) : 1;
  return base * mult;
}
function computeGrowthPercentV85(input) {
  const racje = rationGrowthPercent(input.poziomRacji, input.rationParams);
  const maleMiasto = Math.max(0, 6 - input.population);
  const spichlerz = spichlerzGrowthBonusPercent(input.spichlerzState);
  const zdrowie = Math.floor(Math.max(0, input.zdrowie) / 10);
  const happinessPool = input.szczescieNetto + Math.floor(Math.max(0, input.wealthPoziom) / 10);
  const szczescie = Math.floor(happinessPool / 10);
  const civRaw = input.civKey ? civMatrixParam(input.civKey, "lud_wzrost_proc") : 0;
  const cywilizacja = Math.round(civRaw * 100);
  const total = racje + maleMiasto + spichlerz + zdrowie + szczescie + cywilizacja;
  return { total, racje, maleMiasto, spichlerz, zdrowie, szczescie, cywilizacja };
}

// src/game/cities.ts
var DEFAULT_OKOLICA_FOCUS = "zrownowazone";
var DEFAULT_OKOLICA_TRYB = "auto";
var DEFAULT_PODZIAL_HANDLU = {
  procentNauka: 20,
  procentPieniadz: 60,
  procentLuksus: 20
};
var DEFAULT_PODZIAL_PRACY = {
  procentBudynki: 70
};
var DEFAULT_PROCENT_ROZWOJ_WYZYWIENIE = Math.round(
  DEFAULT_POZIOM_RACJI / WYZYWIENIE_MAX * 100
);
var HANDEL_PCT_STEP = 10;
function snapHandelPct(n) {
  return Math.max(0, Math.min(100, Math.round(n / HANDEL_PCT_STEP) * HANDEL_PCT_STEP));
}
function normalizePodzialHandlu(split) {
  let p = snapHandelPct(split.procentPieniadz);
  let n = snapHandelPct(split.procentNauka);
  let l = snapHandelPct(split.procentLuksus);
  let sum = p + n + l;
  if (sum !== 100) {
    l = Math.max(0, Math.min(100, l + (100 - sum)));
    sum = p + n + l;
    if (sum !== 100) {
      n = Math.max(0, Math.min(100, n + (100 - sum)));
    }
  }
  return { procentPieniadz: p, procentNauka: n, procentLuksus: l };
}
function freshCityPodzial() {
  return {
    podzialPracy: { ...DEFAULT_PODZIAL_PRACY }
  };
}
var MIN_CITY_DISTANCE = miasto_params_default.min_dystans_miast?.wartosc ?? 5;
var MIN_CITY_DISTANCE_START_CITY_STATE = 3;
function canFoundCity(q, r, cities, map, opts) {
  const key = `${q},${r}`;
  if (!(key in map.hexes)) {
    return { ok: false, reason: "poza mapa" };
  }
  const hex = map.hexes[key];
  if (hex !== void 0) {
    if (hex.terenBazowy === "morze" /* Morze */ || hex.terenBazowy === "wybrzeze" /* Wybrzeze */) {
      return { ok: false, reason: "morze" };
    }
    if (hex.terenBazowy === "gory" /* Gory */) {
      return { ok: false, reason: "gory" };
    }
  }
  if (!opts?.clusterStartSlot) {
    for (const city of cities) {
      const minDist = opts?.foundingCityState || city.startCityState ? MIN_CITY_DISTANCE_START_CITY_STATE : MIN_CITY_DISTANCE;
      if (hexDistance(q, r, city.q, city.r) < minDist) {
        return { ok: false, reason: "za blisko innego miasta" };
      }
    }
  }
  if (opts?.withinTerritory && !opts.withinTerritory(q, r)) {
    return { ok: false, reason: "poza terytorium" };
  }
  return { ok: true, reason: "" };
}
function foundCityAt(q, r, ownerId, cities, map, name, foundingCityState = false, clusterStartSlot = false) {
  const { ok } = canFoundCity(q, r, cities, map, { foundingCityState, clusterStartSlot });
  if (!ok) {
    return null;
  }
  const podzial = freshCityPodzial();
  return {
    id: "city" + cities.length,
    ownerId,
    q,
    r,
    name,
    population: 1,
    wealthState: freshWealthState(),
    wealthImmunityRemaining: 5,
    podzialHandluOverride: false,
    podzialPracy: podzial.podzialPracy,
    procentRozwoj: DEFAULT_PROCENT_ROZWOJ_WYZYWIENIE,
    poziomRacji: DEFAULT_POZIOM_RACJI,
    ...foundingCityState ? { startCityState: true } : {}
  };
}

// src/game/empire-handel-split.ts
function resolveCityPodzialHandlu(city, ownerDefault, paramsFallback) {
  if (city.podzialHandluOverride && city.podzialHandlu) {
    return normalizePodzialHandlu(city.podzialHandlu);
  }
  if (ownerDefault) {
    return normalizePodzialHandlu(ownerDefault);
  }
  if (city.podzialHandlu) {
    return normalizePodzialHandlu(city.podzialHandlu);
  }
  return normalizePodzialHandlu(paramsFallback ?? DEFAULT_PODZIAL_HANDLU);
}

// src/game/converters.ts
function loadThroughput(raw, paramKey, difficulty, fallback) {
  const bu = raw.budynki ?? {};
  const row = bu[paramKey];
  const v = row ? row[difficulty] : void 0;
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}
var DEFAULT_CONVERTER_RECIPES = [
  { id: "cegielnia", inputs: { glina: 2, drewno: 1 }, output: "cegla", outputAmount: 1, throughputParamKey: "budynek_cegielnia_przepustowosc", throughputFallback: 3 },
  { id: "garncarnia", inputs: { glina: 1, drewno: 1 }, output: "ceramika", outputAmount: 1, throughputParamKey: "budynek_garncarnia_przepustowosc", throughputFallback: 6 },
  // 'mielerz' USUNIĘTY (Maciej 2026-07-23): Paliwo usunięte całkowicie; konwertery biorą drewno 1:1.
  { id: "huta", inputs: { ruda: 1, drewno: 1 }, output: "braz", outputAmount: 1, throughputParamKey: "budynek_huta_przepustowosc", throughputFallback: 1 },
  { id: "odlewnia_brazu", inputs: { ruda: 1, drewno: 1 }, output: "braz", outputAmount: 1, throughputParamKey: "budynek_huta_przepustowosc", throughputFallback: 1 },
  { id: "odlewnia_zelaza__braz", buildingId: "odlewnia_zelaza", inputs: { ruda: 1, drewno: 1 }, output: "braz", outputAmount: 1, throughputParamKey: "budynek_huta_przepustowosc", throughputFallback: 1 },
  { id: "odlewnia_zelaza__zelazo", buildingId: "odlewnia_zelaza", inputs: { ruda_zelaza: 1, drewno: 1 }, output: "zelazo", outputAmount: 1, throughputParamKey: "budynek_odlewnia_zelaza_przepustowosc", throughputFallback: 1 },
  { id: "wielka_odlewnia__braz", buildingId: "wielka_odlewnia", inputs: { ruda: 1, drewno: 1 }, output: "braz", outputAmount: 1, throughputParamKey: "budynek_huta_przepustowosc", throughputFallback: 1 },
  { id: "wielka_odlewnia__zelazo", buildingId: "wielka_odlewnia", inputs: { ruda_zelaza: 1, drewno: 1 }, output: "zelazo", outputAmount: 1, throughputParamKey: "budynek_odlewnia_zelaza_przepustowosc", throughputFallback: 1 },
  { id: "wielka_odlewnia__stal", buildingId: "wielka_odlewnia", inputs: { zelazo: 1, drewno: 1 }, output: "stal", outputAmount: 1, throughputParamKey: "budynek_wielka_odlewnia_przepustowosc", throughputFallback: 1 }
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
    if (perCykl === void 0 || perCykl <= 0) continue;
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
      const used = (recipe.inputs[k] ?? 0) * cykle;
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
function converterBuildingIdForRecipe(recipe) {
  return recipe.buildingId ?? recipe.id;
}
function computeGarncarniaSurplusBonus(input) {
  const nadwyzka = input.maGarncarnie ? Math.max(0, Math.floor(input.ceramikaPoDrainSpichlerza)) : 0;
  if (nadwyzka <= 0) {
    return { zdrowieBonus: 0, zadowolenieBonus: 0, nadwyzkaSztuk: 0 };
  }
  const efekt = input.efekt ?? "zdrowie";
  const zdrowieNaSztuke = input.zdrowieNaSztuke ?? 1;
  const zadowolenieNaSztuke = input.zadowolenieNaSztuke ?? 0;
  if (efekt === "zadowolenie") {
    return {
      zdrowieBonus: 0,
      zadowolenieBonus: nadwyzka * zadowolenieNaSztuke,
      nadwyzkaSztuk: nadwyzka
    };
  }
  return {
    zdrowieBonus: nadwyzka * zdrowieNaSztuke,
    zadowolenieBonus: 0,
    nadwyzkaSztuk: nadwyzka
  };
}
function runConverters(recipes, stores, throughputs, capacityOf) {
  let cur = { ...stores };
  const perBuilding = {};
  for (const recipe of recipes) {
    const tputKey = recipe.id;
    const tput = Object.prototype.hasOwnProperty.call(throughputs, tputKey) ? throughputs[tputKey] ?? recipe.throughputFallback : recipe.throughputFallback;
    const res = runConverter(recipe, cur, tput, capacityOf(recipe.output));
    cur = res.stores;
    perBuilding[recipe.id] = res;
  }
  return { stores: cur, perBuilding };
}

// src/game/order.ts
var FALLBACK_ORDER_PARAMS = Object.freeze({
  wagaSzczescie: 0.5,
  wagaPrawo: 0.5,
  progT1: 0,
  progT2: 6,
  karaProdukcjaT1: -0.15,
  karaPieniadzT1: -0.15,
  karaNaukaT1: -0.1,
  karaKulturaT1: -0.1,
  karaWzrostT1: -0.25,
  ryzykoBuntuT1: 0.05,
  bonusProdukcjaT2: 0.1,
  bonusHandelT2: 0.1
});

// src/game/society-breakdown.ts
function pickOsiedlePopBonus(block, key, pop, difficulty, legacyFlatFallback = 0) {
  const p = Math.floor(pop);
  if (p < 1 || p > 4) return 0;
  const idx = p - 1;
  const row = block?.[key];
  if (row) {
    const arr = row[difficulty];
    if (Array.isArray(arr) && typeof arr[idx] === "number" && Number.isFinite(arr[idx])) {
      return arr[idx];
    }
  }
  return legacyFlatFallback;
}

// data/wonders.json
var wonders_default = {
  _meta: {
    opis: "Cuda \u015Bwiata \u2014 epoka Antyk (v0.1). Kanon Maciej 2026-06-26.",
    dostep_E: "Wy\u0142\u0105czny \u2014 tylko wskazane pa\u0144stwa; max 1 na \u015Bwiat; inni nie widz\u0105 cudu w panelu.",
    dostep_R: "Wy\u015Bcig \u2014 ka\u017Cde pa\u0144stwo z listy cywilizacje (wszystkie 15) uczestniczy; max 1 na \u015Bwiat.",
    cuda_wyscigowe: ["wyrocznia", "hamonga", "brama_narodow"],
    cuda_wyscigowe_epoka: {
      "1": { id: "wyrocznia", nazwa: "Wyrocznia", epoka: "Kamie\u0144", profil: "kultura, mistycyzm" },
      "2": { id: "hamonga", nazwa: "Kamie\u0144 Ha'amonga", epoka: "Br\u0105z", profil: "kultura, morze, rybo\u0142\xF3wstwo" },
      "3": { id: "brama_narodow", nazwa: "Brama wszystkich narod\xF3w", epoka: "\u017Belazo", profil: "wojna, handel imperium" }
    },
    cuda_wyscigowe_uwaga: "Dok\u0142adnie 1 cud R na epok\u0119 Antyku; wszyscy 15 graczy widz\u0105 i mog\u0105 walczy\u0107; max 1 egzemplarz na \u015Bwiat.",
    wszystkie_cywilizacje: [
      "egipt",
      "sumer",
      "babilonia",
      "grecy",
      "hetyci",
      "celtowie",
      "harappa",
      "fenicjanie",
      "germanie",
      "inkowie",
      "chinczycy",
      "rzymianie",
      "asyria",
      "zulusi",
      "slowianie"
    ],
    epoka: "1=Kamie\u0144, 2=Br\u0105z, 3=\u017Belazo (Antyk); 4\u20136=\u015Aredniowiecze; 7+=Renesans i dalej",
    wieki: {
      antyk: { epoki: [1, 2, 3], opis: "Kamie\u0144\u2013Br\u0105z\u2013\u017Belazo; budowa cud\xF3w E/R z tego pliku" },
      sredniowiecze: { epoki: [4, 5, 6], opis: "Cuda Antyku nadal daj\u0105 bonusy; nowe cuda \u015Bredniowieczne \u2014 osobny plik / era" },
      renesans_plus: { epoki: [7, 8, 9, 10], opis: "Po absolut \u2014 efekty cud\xF3w Antyku wygas\u0142y" }
    },
    absolut: {
      opis: "Ostatnia epoka imperium (w\u0142\u0105cznie), w kt\xF3rej aktywne s\u0105 bonusy cudu. Od epoki absolut+1 efekt wygasa (jednorazowe przy budowie \u2014 bez absolut).",
      domyslnie_antyk: 6,
      koniec_sredniowiecza: 6,
      decyzja: "Maciej 2026-06-26: cuda Antyku + ich efekty znikaj\u0105 na koniec \u015Aredniowiecza (ep.6).",
      po_absolut: {
        decyzja: "Maciej D-CUD1: cud ZOSTAJE na mapie (nie zniszczony); wszystkie bonusy z JSON wygasaj\u0105.",
        hex: "ruina/dekor \u2014 model widoczny",
        utrzymanie_wygasly: "50pct",
        utrzymanie_wygasly_opis: "Maciej D-CUD2=C: po absolut utrzymanie = floor(utrzymanie/2), min 0 (np. Piramidy 2\u21921)",
        jedyny_efekt: {
          typ: "handel_turystyka",
          wartosc: 10,
          opis: "+10 do handlu \u2014 cud jako atrakcja turystyczna (jedyny yield po absolut)"
        }
      },
      silnik: "player.era > absolut \u2192 wy\u0142\u0105cz bonusy miasto/teren/hex/specjalne; zastosuj po_absolut.jedyny_efekt je\u015Bli aktywny"
    },
    budowa: "hex w terytorium (nie slot miasta)",
    harappa_v1: "Antyk: tylko Stupa w Sanchi (E). Nalanda + Angkor Wat \u2192 parkowane (epoka 4+).",
    chinczycy_v1: "Antyk: Terakotowa armia + Pa\u0142ac Weiyang (E). Wielki dzw\xF3n \u2192 parkowany (epoka 5+).",
    celtowie_v1: "Antyk: Roquepertuse (E, epoka 3). Kopiec grobowy/Monks Mound \u2192 parkowany.",
    koszt_jednostka: "Praca (jak budynki i ulepszenia terenu); budowa z puli Pracy najbli\u017Cszego miasta / skarbca.",
    bonus_miasto: "Yield +/tur\u0119 \xD7 KA\u017BDE miasto (pieniadz, zywnosc, nauka, kultura, zadowolenie, praca, obrona_miejsca). Bez dzielnic Civ7.",
    bonus_cywilizacja: "Tylko imperium \u2014 NIE sumowane w karcie miasta. Patrz lista bonus_cywilizacja_typy.",
    bonus_cywilizacja_typy: {
      dyplomacja_wp\u0142yw: "Wp\u0142yw / Influence (traktaty, ambasady)",
      wojna_wsparcie: "Wsparcie we wszystkich wojnach",
      relacje_zaufanie: "Zaufanie bazowe wobec innych nacji",
      relacje_respekt: "Wynika z Mocy (odkrycia) \u2014 cuda NIE daj\u0105 Mocy (decyzja Maciej 2026-06-26)",
      armia_xp: "Do\u015Bwiadczenie armii (%)",
      armia_morale: "Morale imperium po bitwie / sta\u0142e",
      walka_procent: "Atak/obrona/obl\u0119\u017Cenie (%) \u2014 jednostki poza miastem",
      pobor_regen: "Regeneracja Manpower imperium (%)",
      handel_procent: "Bonus % do tras handlowych / morskich",
      nauka_procent: "Bonus % nauki imperium (nie flat per miasto)",
      produkcja_procent: "Redukcja kosztu Pracy budynk\xF3w/ulepsze\u0144 (%)",
      magazyn_pojemnosc: "Pojemno\u015B\u0107 zapas\xF3w / trade capacity globalna",
      wzrost_ludnosci_procent: "Wzrost populacji we wszystkich miastach (%)",
      jednorazowe: "Z\u0142oto przy zdarzeniu, darmowa jednostka, kultura z wydarze\u0144 narracyjnych",
      fortyfikacja_mapa: "Bonus obrony na heksach fort\xF3w (mapa, nie yield miasta)",
      handel_turystyka: "Po absolut: jedyny efekt wygas\u0142ego cudu \u2014 +N do handlu (atrakcja turystyczna)"
    },
    bonus_zasieg: "hex = tylko pole cudu; teren = heksy danego typu w terytorium (plony \u2192 miasto w\u0142a\u015Bciciela pola). BEZ dzielnic / sasiad-dzielnica.",
    bonus_teren: "Modyfikator p\xF3l w terytorium (nie \xD7 ka\u017Cde miasto \u2014 tylko heksy spe\u0142niaj\u0105ce warunek).",
    bonus_specjalne: "Implementacja bonus_cywilizacja \u2014 silnik cud\xF3w (v1.1+). Typ = klucz z bonus_cywilizacja_typy.",
    kanon_bonusow_2026: "Maciej: yield miejski \xD73 vs v0.1 (\xD7 ka\u017Cde miasto). Wp\u0142yw, zaufanie, wojna, %, armia \u2192 cywilizacja. BEZ bonusu Mocy \u2014 Moc tylko z odkry\u0107.",
    bonus_miasto_mnoznik: 3,
    bonus_moc: "USUNI\u0118TE \u2014 Moc (P-A) pochodzi wy\u0142\u0105cznie z odkry\u0107 technologii; cuda nie dodaj\u0105 punkt\xF3w Mocy (Maciej 2026-06-26).",
    kanon_tech_wejscie: "Maciej 2026-07-03: techUnlock cudu E \u2014 ka\u017Cdy wynalazek z epoki >= epokaWejscia pa\u0144stwa; p\xF3\u017Aniejsze epoki OK; zakaz tech wcze\u015Bniejszych ni\u017C debiut nacji."
  },
  cuda: [
    {
      id: "piramidy",
      nazwa: "Piramidy",
      dostep: "E",
      cywilizacje: ["egipt"],
      techUnlock: ["Murarstwo"],
      wymagaTerenu: ["pustynia", "rzeka_sasiad"],
      epokaWejscia: 1,
      absolut: 6,
      maxNaSwiecie: 1,
      kosztBudowy: 160,
      utrzymanie: 2,
      bonusy: {
        miasto: { pieniadz: 3, praca: 3 },
        teren: [
          { typTerenu: "pustynia", pieniadz: 2, praca: 2, warunek: "hex_sasiad_rzeka" },
          { typTerenu: "rzeka_mala", pieniadz: 2, praca: 2 }
        ],
        specjalne: [
          { typ: "kapital_pustynia", wartosc: 3, opis: "Stolica na pustyni: +3 Pieni\u0105dz/tur\u0119 (cywilizacja)" },
          { typ: "dyplomacja_wp\u0142yw", wartosc: 3, opis: "+3 Wp\u0142ywu \u2014 presti\u017C faraon\xF3w (cywilizacja)" }
        ]
      }
    },
    {
      id: "wielka_stela",
      nazwa: "Wielka stela",
      dostep: "E",
      cywilizacje: ["zulusi"],
      techUnlock: ["Pismo"],
      wymagaTerenu: ["rownina"],
      epokaWejscia: 2,
      absolut: 6,
      maxNaSwiecie: 1,
      kosztBudowy: 220,
      utrzymanie: 2,
      bonusy: {
        miasto: { kultura: 3, pieniadz: 3 },
        specjalne: [
          { typ: "jednorazowe", cel: "zloto_przy_budowie_cudu", wartosc: 200, opis: "+200 Pieni\u0105dza przy uko\u0144czeniu kolejnego cudu (cywilizacja)" },
          { typ: "dyplomacja_wp\u0142yw", wartosc: 4, opis: "+4 Wp\u0142ywu \u2014 handel aksumski (cywilizacja)" }
        ]
      }
    },
    {
      id: "wiszace_ogrody",
      nazwa: "Wisz\u0105ce ogrody",
      dostep: "E",
      cywilizacje: ["babilonia"],
      techUnlock: ["Pismo"],
      wymagaTerenu: ["rzeka_sasiad"],
      epokaWejscia: 2,
      absolut: 6,
      maxNaSwiecie: 1,
      kosztBudowy: 150,
      utrzymanie: 2,
      bonusy: {
        miasto: { zywnosc: 3 },
        teren: [
          { typTerenu: "farma", zywnosc: 2, warunek: "hex_sasiad_rzeka" }
        ],
        specjalne: [
          { typ: "wzrost_ludnosci_procent", wartosc: 0.15, opis: "+15% wzrost populacji we wszystkich miastach (cywilizacja)" },
          { typ: "relacje_zaufanie", wartosc: 2, opis: "+2 bazowe Zaufanie wobec s\u0105siad\xF3w (cywilizacja)" }
        ]
      }
    },
    {
      id: "wyrocznia",
      nazwa: "Wyrocznia",
      dostep: "R",
      cywilizacje: [
        "egipt",
        "sumer",
        "babilonia",
        "grecy",
        "hetyci",
        "celtowie",
        "harappa",
        "fenicjanie",
        "germanie",
        "inkowie",
        "chinczycy",
        "rzymianie",
        "asyria",
        "zulusi",
        "slowianie"
      ],
      techUnlock: ["Mistycyzm"],
      wymagaTerenu: ["trudny_teren"],
      epokaWejscia: 1,
      absolut: 6,
      maxNaSwiecie: 1,
      kosztBudowy: 180,
      utrzymanie: 1,
      bonusy: {
        miasto: { kultura: 3 },
        specjalne: [
          { typ: "jednorazowe", cel: "kultura_wydarzenia", wartosc: 15, opis: "+15 Kultury za nagrody z wydarze\u0144 narracyjnych (cywilizacja)" },
          { typ: "relacje_zaufanie", wartosc: 3, opis: "+3 Zaufanie \u2014 wyrocznia jako arbiter (cywilizacja)" },
          { typ: "dyplomacja_wp\u0142yw", wartosc: 2, opis: "+2 Wp\u0142ywu (cywilizacja)" }
        ]
      },
      uwagi: "Jedyny cud wy\u015Bcigowy epoki Kamienia; sanktuarium / wyrocznia (Delphi, Dodona\u2026)"
    },
    {
      id: "roquepertuse",
      nazwa: "Roquepertuse",
      nazwaAlt: "Sanktuarium celtyckie \u2014 portyk z niszami na czaszki (Velaux, Galia)",
      dostep: "E",
      cywilizacje: ["celtowie"],
      techUnlock: ["In\u017Cynieria"],
      wymagaTerenu: ["wzgorze", "trudny_teren"],
      epokaWejscia: 3,
      absolut: 6,
      maxNaSwiecie: 1,
      kosztBudowy: 290,
      utrzymanie: 2,
      bonusy: {
        miasto: { kultura: 3, zadowolenie: 3 },
        hex: { kultura: 6 },
        specjalne: [
          { typ: "walka_procent", cel: "piechota_szarza", wartosc: 0.15, opis: "+15% ataku piechoty przy pierwszym uderzeniu (cywilizacja)" },
          { typ: "armia_morale", wartosc: 2, opis: "Kult g\u0142\xF3w: +2 Morale imperium przez 3 tury po wygranej bitwie obronnej (cywilizacja)" },
          { typ: "jednorazowe", cel: "kultura_wydarzenia", wartosc: 10, opis: "+10 Kultury za \u015Bwi\u0119ta religijne (cywilizacja)" },
          { typ: "wojna_wsparcie", wartosc: 1, opis: "+1 Wsparcia we wszystkich wojnach (cywilizacja)" }
        ]
      },
      uwagi: "IV\u2013III w. p.n.e.; Prowansja; centrum ceremonialne (bez sta\u0142ej zabudowy mieszkalnej); zniszczone ~III w. p.n.e."
    },
    {
      id: "stupa_sanchi",
      nazwa: "Stupa w Sanchi",
      dostep: "E",
      cywilizacje: ["harappa"],
      techUnlock: ["Religia"],
      wymagaTerenu: ["rownina"],
      epokaWejscia: 2,
      absolut: 6,
      maxNaSwiecie: 1,
      kosztBudowy: 210,
      utrzymanie: 1,
      bonusy: {
        miasto: { zadowolenie: 3, kultura: 3 },
        specjalne: [
          { typ: "kultura_z_nadwyzka_zadowolenia", wartosc: 2, opis: "+2 Kultury/tur\u0119 na ka\u017Cde 5 nadwy\u017Cki Zadowolenia w imperium (cywilizacja)" },
          { typ: "relacje_zaufanie", wartosc: 4, opis: "+4 bazowe Zaufanie \u2014 dharmiczny spok\xF3j (cywilizacja)" },
          { typ: "dyplomacja_wp\u0142yw", wartosc: 2, opis: "+2 Wp\u0142ywu (cywilizacja)" }
        ]
      }
    },
    {
      id: "petra",
      nazwa: "Petra",
      dostep: "E",
      cywilizacje: ["fenicjanie"],
      techUnlock: ["In\u017Cynieria"],
      wymagaTerenu: ["pustynia"],
      epokaWejscia: 2,
      absolut: 6,
      maxNaSwiecie: 1,
      kosztBudowy: 165,
      utrzymanie: 2,
      bonusy: {
        miasto: { pieniadz: 3 },
        teren: [
          { typTerenu: "pustynia", pieniadz: 2, praca: 2 }
        ],
        specjalne: [
          { typ: "magazyn_pojemnosc", wartosc: 6, opis: "+6 pojemno\u015B\u0107 handlu/surowc\xF3w (cywilizacja)" },
          { typ: "handel_procent", cel: "handel", wartosc: 0.15, opis: "+15% Handlu \u2014 dochodu z tras handlowych (cywilizacja); NIE zwi\u0119ksza Daniny miasta" },
          { typ: "dyplomacja_wp\u0142yw", wartosc: 5, opis: "+5 Wp\u0142ywu \u2014 karawany Nabatejczyk\xF3w (cywilizacja)" }
        ]
      }
    },
    {
      id: "hamonga",
      nazwa: "Kamie\u0144 Ha'amonga",
      dostep: "R",
      cywilizacje: [
        "egipt",
        "sumer",
        "babilonia",
        "grecy",
        "hetyci",
        "celtowie",
        "harappa",
        "fenicjanie",
        "germanie",
        "inkowie",
        "chinczycy",
        "rzymianie",
        "asyria",
        "zulusi",
        "slowianie"
      ],
      techUnlock: ["\u017Begluga"],
      wymagaTerenu: ["wybrzeze"],
      epokaWejscia: 2,
      absolut: 6,
      maxNaSwiecie: 1,
      kosztBudowy: 220,
      utrzymanie: 1,
      bonusy: {
        miasto: { kultura: 3, zywnosc: 3 },
        teren: [
          { typTerenu: "lowie_rybackie", kultura: 2, zywnosc: 2 },
          { typTerenu: "laka", kultura: 2, warunek: "hex_sasiad_wybrzeze" }
        ],
        specjalne: [
          { typ: "handel_procent", cel: "handel_morski", wartosc: 0.15, opis: "+15% Handlu \u2014 dochodu z tras handlowych morskich (cywilizacja); NIE zwi\u0119ksza Daniny miasta" },
          { typ: "dyplomacja_wp\u0142yw", wartosc: 3, opis: "+3 Wp\u0142ywu (cywilizacja)" }
        ]
      },
      uwagi: "Jedyny cud wy\u015Bcigowy epoki Br\u0105zu; megality nadmorskie, \u017Begluga"
    },
    {
      id: "kolos",
      nazwa: "Kolos Rodyjski",
      dostep: "E",
      cywilizacje: ["grecy"],
      techUnlock: ["In\u017Cynieria"],
      wymagaTerenu: ["wybrzeze"],
      epokaWejscia: 3,
      absolut: 6,
      maxNaSwiecie: 1,
      kosztBudowy: 230,
      utrzymanie: 2,
      bonusy: {
        miasto: { pieniadz: 3, kultura: 3 },
        specjalne: [
          { typ: "magazyn_pojemnosc", wartosc: 8, opis: "+8 pojemno\u015B\u0107 surowc\xF3w / trade capacity (cywilizacja)" },
          { typ: "handel_procent", cel: "handel_morski", wartosc: 0.2, opis: "+20% Handlu \u2014 dochodu z tras handlowych morskich, korzystaj\u0105cych z port\xF3w (cywilizacja); NIE zwi\u0119ksza Daniny miasta" },
          { typ: "dyplomacja_wp\u0142yw", wartosc: 6, opis: "+6 Wp\u0142ywu \u2014 Rhodos, w\u0119ze\u0142 morski (cywilizacja)" }
        ]
      }
    },
    {
      id: "osada_aschaffenburg",
      nazwa: "Osada Aschaffenburg (hala d\u0119bowa)",
      nazwaAlt: "Monumentalna budowla nad Menem, kultura late\u0144ska",
      dostep: "E",
      cywilizacje: ["germanie"],
      techUnlock: ["In\u017Cynieria"],
      wymagaTerenu: ["rzeka_sasiad"],
      epokaWejscia: 3,
      absolut: 6,
      maxNaSwiecie: 1,
      kosztBudowy: 300,
      utrzymanie: 2,
      bonusy: {
        miasto: { praca: 3 },
        teren: [
          { typTerenu: "rzeka_sasiad", praca: 2, drewno: 2 }
        ],
        specjalne: [
          { typ: "produkcja_procent", cel: "ulepszenia_drewno", wartosc: 0.15, opis: "\u221215% kosztu Pracy ulepsze\u0144 drewnianych (cywilizacja)" },
          { typ: "walka_procent", cel: "obrona_terytorium", wartosc: 0.15, opis: "+15% obrony jednostek na w\u0142asnym terytorium (cywilizacja)" },
          { typ: "pobor_regen", wartosc: 0.1, opis: "+10% regeneracji Manpower (cywilizacja)" }
        ]
      },
      uwagi: "IV w. p.n.e.; pot\u0119\u017Cne d\u0119bowe belki nad Menem (Bawaria); kultura late\u0144ska"
    },
    {
      id: "ziggurat",
      nazwa: "Ziggurat / Piramida S\u0142o\u0144ca",
      dostep: "E",
      cywilizacje: ["sumer"],
      techUnlock: ["Matematyka"],
      wymagaTerenu: ["plaski_teren"],
      epokaWejscia: 2,
      absolut: 6,
      maxNaSwiecie: 1,
      kosztBudowy: 240,
      utrzymanie: 2,
      bonusy: {
        miasto: { kultura: 6, nauka: 3 },
        specjalne: [
          { typ: "nauka_procent", cel: "nauka", wartosc: 0.15, opis: "+15% Nauki w imperium (cywilizacja)" },
          { typ: "dyplomacja_wp\u0142yw", wartosc: 4, opis: "+4 Wp\u0142ywu \u2014 kap\u0142ani-astronomowie (cywilizacja)" }
        ]
      }
    },
    {
      id: "mundo_perdido",
      nazwa: "\u015Awi\u0105tynia Mundo Perdido",
      dostep: "E",
      cywilizacje: ["inkowie"],
      techUnlock: ["Matematyka", "Murarstwo"],
      wymagaTerenu: ["tropiki"],
      epokaWejscia: 2,
      absolut: 6,
      maxNaSwiecie: 1,
      kosztBudowy: 220,
      utrzymanie: 2,
      bonusy: {
        miasto: { nauka: 3, zadowolenie: 3 },
        teren: [
          { typTerenu: "tropiki", nauka: 2, zadowolenie: 2 }
        ],
        specjalne: [
          { typ: "nauka_procent", cel: "nauka", wartosc: 0.2, opis: "+20% Nauki w imperium \u2014 kalendarz Maj\xF3w (cywilizacja)" },
          { typ: "dyplomacja_wp\u0142yw", wartosc: 3, opis: "+3 Wp\u0142ywu (cywilizacja)" }
        ]
      }
    },
    {
      id: "terakotowa_armia",
      nazwa: "Terakotowa armia",
      dostep: "E",
      cywilizacje: ["chinczycy"],
      techUnlock: ["Wojskowo\u015B\u0107"],
      wymagaTerenu: ["laka"],
      epokaWejscia: 3,
      absolut: 6,
      maxNaSwiecie: 1,
      kosztBudowy: 320,
      utrzymanie: 3,
      bonusy: {
        miasto: { praca: 3 },
        specjalne: [
          { typ: "jednorazowe", cel: "dowodca_armii", wartosc: 1, opis: "Darmowy Dow\xF3dca armii przy uko\u0144czeniu (cywilizacja)" },
          { typ: "armia_xp", wartosc: 0.25, opis: "+25% do\u015Bwiadczenia armii (cywilizacja)" },
          { typ: "walka_procent", cel: "piechota", wartosc: 0.15, opis: "+15% ataku piechoty (cywilizacja)" },
          { typ: "wojna_wsparcie", wartosc: 2, opis: "+2 Wsparcia we wszystkich wojnach (cywilizacja)" }
        ]
      },
      uwagi: "Qin, ok. 246\u2013208 p.n.e.; grobowiec Qin Shi Huanga"
    },
    {
      id: "koloseum",
      nazwa: "Koloseum",
      dostep: "E",
      cywilizacje: ["rzymianie"],
      techUnlock: ["In\u017Cynieria"],
      wymagaTerenu: ["przy_miescie"],
      epokaWejscia: 3,
      absolut: 6,
      maxNaSwiecie: 1,
      kosztBudowy: 310,
      utrzymanie: 3,
      bonusy: {
        miasto: { kultura: 3, zadowolenie: 6 },
        specjalne: [
          { typ: "produkcja_procent", cel: "budynki", wartosc: 0.15, opis: "\u221215% kosztu Produkcji budynk\xF3w (cywilizacja)" },
          { typ: "relacje_zaufanie", wartosc: 3, opis: "+3 Zaufanie wewn\u0119trzne \u2014 panem et circenses (cywilizacja)" },
          { typ: "dyplomacja_wp\u0142yw", wartosc: 4, opis: "+4 Wp\u0142ywu \u2014 chwa\u0142a Rzymu (cywilizacja)" }
        ]
      }
    },
    {
      id: "dur_sharrukin",
      nazwa: "Dur-Sharrukin",
      dostep: "E",
      cywilizacje: ["asyria"],
      techUnlock: ["Budownictwo", "Wojskowo\u015B\u0107"],
      wymagaTerenu: ["przy_miescie"],
      epokaWejscia: 2,
      absolut: 6,
      maxNaSwiecie: 1,
      kosztBudowy: 260,
      utrzymanie: 3,
      bonusy: {
        miasto: { obrona: 3 },
        specjalne: [
          { typ: "fortyfikacja_mapa", cel: "fort", wartosc: 5, opis: "+5 Obrony na heksach fortyfikacji (cywilizacja)" },
          { typ: "walka_procent", cel: "obl\u0119\u017Cenie", wartosc: 0.15, opis: "+15% skuteczno\u015Bci obl\u0119\u017Cenia (cywilizacja)" },
          { typ: "wojna_wsparcie", wartosc: 2, opis: "+2 Wsparcia we wszystkich wojnach (cywilizacja)" },
          { typ: "relacje_zaufanie", wartosc: -2, opis: "\u22122 Zaufanie u s\u0105siad\xF3w \u2014 strach przed Asyri\u0105 (cywilizacja)" }
        ]
      }
    },
    {
      id: "brama_narodow",
      nazwa: "Brama wszystkich narod\xF3w",
      dostep: "R",
      cywilizacje: [
        "egipt",
        "sumer",
        "babilonia",
        "grecy",
        "hetyci",
        "celtowie",
        "harappa",
        "fenicjanie",
        "germanie",
        "inkowie",
        "chinczycy",
        "rzymianie",
        "asyria",
        "zulusi",
        "slowianie"
      ],
      techUnlock: ["In\u017Cynieria", "Wojskowo\u015B\u0107"],
      wymagaTerenu: ["przy_miescie"],
      epokaWejscia: 3,
      absolut: 6,
      maxNaSwiecie: 1,
      kosztBudowy: 280,
      utrzymanie: 3,
      bonusy: {
        miasto: { kultura: 3, pieniadz: 3 },
        specjalne: [
          { typ: "wojna_wsparcie", wartosc: 3, opis: "+3 Wsparcia we wszystkich aktywnych wojnach (cywilizacja)" },
          { typ: "handel_procent", cel: "handel", wartosc: 0.15, opis: "+15% Handlu \u2014 dochodu z tras handlowych (cywilizacja); NIE zwi\u0119ksza Daniny miasta" },
          { typ: "dyplomacja_wp\u0142yw", wartosc: 10, opis: "+10 Wp\u0142ywu \u2014 satrapie i go\u015Bcie narod\xF3w (cywilizacja)" },
          { typ: "relacje_zaufanie", wartosc: 3, opis: "+3 Zaufanie u pa\u0144stw z aktywnym handlem (cywilizacja)" }
        ]
      },
      uwagi: "Persepolis / brama satrapii; jedyny cud wy\u015Bcigowy epoki \u017Belaza \u2014 odblokowanie po In\u017Cynierii"
    },
    {
      id: "palac_weiyang",
      nazwa: "Pa\u0142ac Weiyang",
      dostep: "E",
      cywilizacje: ["chinczycy"],
      techUnlock: ["Wymiana", "Murarstwo"],
      wymagaTerenu: ["laka"],
      epokaWejscia: 3,
      absolut: 6,
      maxNaSwiecie: 1,
      kosztBudowy: 290,
      utrzymanie: 3,
      bonusy: {
        miasto: { kultura: 3, zadowolenie: 3, pieniadz: 3 },
        specjalne: [
          { typ: "dyplomacja_wp\u0142yw", wartosc: 12, opis: "+12 Wp\u0142ywu \u2014 cesarski dw\xF3r Chang'an (cywilizacja)" },
          { typ: "handel_procent", cel: "handel", wartosc: 0.15, opis: "+15% Handlu \u2014 dochodu z tras handlowych (cywilizacja); NIE zwi\u0119ksza Daniny miasta" },
          { typ: "relacje_zaufanie", wartosc: 4, opis: "+4 bazowe Zaufanie (cywilizacja)" }
        ]
      },
      uwagi: "Zachodnia Han, 200 p.n.e.; cesarz Gaozu"
    },
    {
      id: "yerkapi",
      nazwa: "Yerkap\u0131 (Brama w ziemi)",
      nazwaAlt: "Brama Sfinks\xF3w, Hattusa",
      dostep: "E",
      cywilizacje: ["hetyci"],
      techUnlock: ["Wojskowo\u015B\u0107"],
      wymagaTerenu: ["wzgorze", "trudny_teren"],
      epokaWejscia: 2,
      absolut: 6,
      maxNaSwiecie: 1,
      kosztBudowy: 240,
      utrzymanie: 2,
      bonusy: {
        miasto: { obrona: 3 },
        hex: { obrona: 12 },
        specjalne: [
          { typ: "fortyfikacja_mapa", cel: "fort", wartosc: 5, opis: "+5 Obrony na heksach fortyfikacji (cywilizacja)" },
          { typ: "walka_procent", cel: "rydwany", wartosc: 0.15, opis: "+15% ataku rydwan\xF3w (cywilizacja)" },
          { typ: "wojna_wsparcie", wartosc: 2, opis: "+2 Wsparcia we wszystkich wojnach (cywilizacja)" },
          { typ: "relacje_zaufanie", wartosc: 2, opis: "+2 Zaufanie u sojusznik\xF3w (cywilizacja)" }
        ]
      },
      uwagi: "Nasyp ziemny + tunel sklepiony + Brama Sfinks\xF3w; kompleks obronno-sakralny Hattusy"
    },
    {
      id: "posag_peruna",
      nazwa: "Pos\u0105g Peruna",
      dostep: "E",
      cywilizacje: ["slowianie"],
      techUnlock: ["Obr\xF3bka \u017Celaza"],
      wymagaTerenu: ["wzgorze"],
      epokaWejscia: 3,
      absolut: 6,
      maxNaSwiecie: 1,
      kosztBudowy: 140,
      utrzymanie: 1,
      bonusy: {
        miasto: { kultura: 3, zadowolenie: 3 },
        hex: { kultura: 3 },
        specjalne: [
          { typ: "pobor_regen", wartosc: 0.15, opis: "+15% regeneracji Manpower (cywilizacja)" },
          { typ: "walka_procent", cel: "piechota_las", wartosc: 0.15, opis: "+15% ataku piechoty w lesie (cywilizacja)" },
          { typ: "relacje_zaufanie", wartosc: 3, opis: "+3 Zaufanie w\u015Br\xF3d plemion s\u0142owia\u0144skich (cywilizacja)" },
          { typ: "dyplomacja_wp\u0142yw", wartosc: 2, opis: "+2 Wp\u0142ywu \u2014 kult Peruna (cywilizacja)" }
        ]
      }
    }
  ],
  panstwa: {
    egipt: {
      nazwa: "Egipt",
      cuda: [
        { id: "piramidy", dostep: "E", kolejnosc: 1 },
        { id: "wyrocznia", dostep: "R", kolejnosc: 2 },
        { id: "hamonga", dostep: "R", kolejnosc: 3 },
        { id: "brama_narodow", dostep: "R", kolejnosc: 4 }
      ]
    },
    sumer: {
      nazwa: "Sumerowie",
      cuda: [
        { id: "ziggurat", dostep: "E", kolejnosc: 1 },
        { id: "wyrocznia", dostep: "R", kolejnosc: 2 },
        { id: "hamonga", dostep: "R", kolejnosc: 3 },
        { id: "brama_narodow", dostep: "R", kolejnosc: 4 }
      ]
    },
    babilonia: {
      nazwa: "Babilonia",
      cuda: [
        { id: "wiszace_ogrody", dostep: "E", kolejnosc: 1 },
        { id: "wyrocznia", dostep: "R", kolejnosc: 2 },
        { id: "hamonga", dostep: "R", kolejnosc: 3 },
        { id: "brama_narodow", dostep: "R", kolejnosc: 4 }
      ]
    },
    grecy: {
      nazwa: "Grecy",
      cuda: [
        { id: "kolos", dostep: "E", kolejnosc: 1 },
        { id: "wyrocznia", dostep: "R", kolejnosc: 2 },
        { id: "hamonga", dostep: "R", kolejnosc: 3 },
        { id: "brama_narodow", dostep: "R", kolejnosc: 4 }
      ]
    },
    hetyci: {
      nazwa: "Hetyci",
      cuda: [
        { id: "yerkapi", dostep: "E", kolejnosc: 1 },
        { id: "wyrocznia", dostep: "R", kolejnosc: 2 },
        { id: "hamonga", dostep: "R", kolejnosc: 3 },
        { id: "brama_narodow", dostep: "R", kolejnosc: 4 }
      ]
    },
    celtowie: {
      nazwa: "Celtowie",
      cuda: [
        { id: "roquepertuse", dostep: "E", kolejnosc: 1 },
        { id: "wyrocznia", dostep: "R", kolejnosc: 2 },
        { id: "hamonga", dostep: "R", kolejnosc: 3 },
        { id: "brama_narodow", dostep: "R", kolejnosc: 4 }
      ]
    },
    harappa: {
      nazwa: "Harappa",
      cuda: [
        { id: "stupa_sanchi", dostep: "E", kolejnosc: 1 },
        { id: "wyrocznia", dostep: "R", kolejnosc: 2 },
        { id: "hamonga", dostep: "R", kolejnosc: 3 },
        { id: "brama_narodow", dostep: "R", kolejnosc: 4 }
      ]
    },
    fenicjanie: {
      nazwa: "Fenicjanie",
      cuda: [
        { id: "petra", dostep: "E", kolejnosc: 1 },
        { id: "wyrocznia", dostep: "R", kolejnosc: 2 },
        { id: "hamonga", dostep: "R", kolejnosc: 3 },
        { id: "brama_narodow", dostep: "R", kolejnosc: 4 }
      ]
    },
    germanie: {
      nazwa: "Germanie",
      cuda: [
        { id: "osada_aschaffenburg", dostep: "E", kolejnosc: 1 },
        { id: "wyrocznia", dostep: "R", kolejnosc: 2 },
        { id: "hamonga", dostep: "R", kolejnosc: 3 },
        { id: "brama_narodow", dostep: "R", kolejnosc: 4 }
      ]
    },
    inkowie: {
      nazwa: "Inkowie",
      cuda: [
        { id: "mundo_perdido", dostep: "E", kolejnosc: 1 },
        { id: "wyrocznia", dostep: "R", kolejnosc: 2 },
        { id: "hamonga", dostep: "R", kolejnosc: 3 },
        { id: "brama_narodow", dostep: "R", kolejnosc: 4 }
      ]
    },
    chinczycy: {
      nazwa: "Chi\u0144czycy",
      cuda: [
        { id: "terakotowa_armia", dostep: "E", kolejnosc: 1 },
        { id: "palac_weiyang", dostep: "E", kolejnosc: 2 },
        { id: "wyrocznia", dostep: "R", kolejnosc: 3 },
        { id: "hamonga", dostep: "R", kolejnosc: 4 },
        { id: "brama_narodow", dostep: "R", kolejnosc: 5 }
      ]
    },
    rzymianie: {
      nazwa: "Rzymianie",
      cuda: [
        { id: "koloseum", dostep: "E", kolejnosc: 1 },
        { id: "wyrocznia", dostep: "R", kolejnosc: 2 },
        { id: "hamonga", dostep: "R", kolejnosc: 3 },
        { id: "brama_narodow", dostep: "R", kolejnosc: 4 }
      ]
    },
    asyria: {
      nazwa: "Asyria",
      cuda: [
        { id: "dur_sharrukin", dostep: "E", kolejnosc: 1 },
        { id: "wyrocznia", dostep: "R", kolejnosc: 2 },
        { id: "hamonga", dostep: "R", kolejnosc: 3 },
        { id: "brama_narodow", dostep: "R", kolejnosc: 4 }
      ]
    },
    zulusi: {
      nazwa: "Zulusi",
      cuda: [
        { id: "wielka_stela", dostep: "E", kolejnosc: 1 },
        { id: "wyrocznia", dostep: "R", kolejnosc: 2 },
        { id: "hamonga", dostep: "R", kolejnosc: 3 },
        { id: "brama_narodow", dostep: "R", kolejnosc: 4 }
      ]
    },
    slowianie: {
      nazwa: "S\u0142owianie",
      cuda: [
        { id: "posag_peruna", dostep: "E", kolejnosc: 1 },
        { id: "wyrocznia", dostep: "R", kolejnosc: 2 },
        { id: "hamonga", dostep: "R", kolejnosc: 3 },
        { id: "brama_narodow", dostep: "R", kolejnosc: 4 }
      ]
    }
  },
  parkowane_epoka4plus: [
    {
      id: "nalanda",
      nazwa: "Nalanda",
      dostep: "E",
      cywilizacje: ["harappa"],
      techUnlock: ["Pismo", "Matematyka"],
      wymagaTerenu: ["rownina"],
      epokaDocelowa: 4,
      epokaDocelowaOpis: "V\u2013XIII w. n.e. \u2014 \u015Bredniowiecze; uniwersytet Gupt\xF3w/Harszy",
      maxNaSwiecie: 1,
      aktywne: false,
      uwagi: "Przeniesione z Antyku 2026-06-26 \u2014 zbyt p\xF3\u017Ane na Harapp\u0119/Indus"
    },
    {
      id: "angkor_wat",
      nazwa: "Angkor Wat",
      dostep: "E",
      cywilizacje: ["harappa"],
      techUnlock: ["Budownictwo"],
      wymagaTerenu: ["rzeka_sasiad"],
      epokaDocelowa: 5,
      epokaDocelowaOpis: "ok. 1113\u20131150 n.e. \u2014 Khmer; przypisanie pa\u0144stwa do ustalenia",
      maxNaSwiecie: 1,
      aktywne: false,
      uwagi: "Przeniesione z Antyku 2026-06-26 \u2014 \u015Bredniowiecze"
    },
    {
      id: "wielki_dzwon",
      nazwa: "Wielki dzw\xF3n (Yongle / Emile Bell)",
      dostep: "E",
      cywilizacje: ["chinczycy"],
      techUnlock: ["Religia"],
      wymagaTerenu: ["trudny_teren"],
      epokaDocelowa: 6,
      epokaDocelowaOpis: "Dzwon Ming (1403\u20131424, Yongle); \u015Bwi\u0105tynia Qing (1733) \u2014 poza Antykiem",
      maxNaSwiecie: 1,
      aktywne: false,
      uwagi: "Przeniesione z Antyku 2026-06-26 \u2014 dynastie Ming/Qing"
    },
    {
      id: "mauzoleum_teodoryka",
      nazwa: "Mauzoleum Teodoryka",
      dostep: "E",
      cywilizacje: ["germanie"],
      techUnlock: ["Murarstwo"],
      wymagaTerenu: ["wybrzeze"],
      epokaDocelowa: 4,
      epokaDocelowaOpis: "VI w. n.e. \u2014 Ostrogoci, Ravenna; poza Antykiem",
      maxNaSwiecie: 1,
      aktywne: false,
      uwagi: "Zast\u0105pione w Antyku przez Osad\u0119 Aschaffenburg (2026-06-26)"
    },
    {
      id: "kopiec_grobowy",
      nazwa: "Kopiec grobowy",
      nazwaAlt: "Monks Mound (Mississippian)",
      dostep: "E",
      cywilizacje: ["celtowie"],
      techUnlock: ["Rolnictwo", "Murarstwo"],
      wymagaTerenu: ["rzeka_sasiad"],
      epokaDocelowa: 1,
      epokaDocelowaOpis: "Kultura missisipia\u0144ska \u2014 historycznie nie Galowie",
      maxNaSwiecie: 1,
      aktywne: false,
      uwagi: "Zast\u0105pione przez Roquepertuse (2026-06-26); placeholder Monks Mound"
    }
  ]
};

// src/game/wonders-data.ts
var data = wonders_default;
var wonderById = new Map(data.cuda.map((w) => [w.id, w]));

// src/game/turn-economy.ts
function applyOrderYieldMults(yld, mults) {
  if (mults.productionMult !== 1) yld.praca *= mults.productionMult;
  if (mults.pieniadzMult !== 1) yld.pieniadz *= mults.pieniadzMult;
  if (mults.naukaMult !== 1) yld.nauka *= mults.naukaMult;
  if (mults.kulturaMult !== 1) yld.kultura *= mults.kulturaMult;
}
function applyWonderCityYields(yld, bonus) {
  if (!bonus) return;
  if (bonus.pieniadz) yld.pieniadz += bonus.pieniadz;
  if (bonus.zywnosc) yld.zywnosc += bonus.zywnosc;
  if (bonus.nauka) yld.nauka += bonus.nauka;
  if (bonus.kultura) yld.kultura += bonus.kultura;
  if (bonus.praca) yld.praca += bonus.praca;
}
function civDisplayNameForKey(civKey, civs) {
  if (!civKey || !civs?.cywilizacje?.length) return null;
  const key = civKey.toLowerCase();
  for (const row of civs.cywilizacje) {
    if (!row) continue;
    const ids = [row.ikonaId, row.typCywilizacji, row.Cywilizacja].filter((s) => typeof s === "string" && s.length > 0).map((s) => s.toLowerCase());
    if (ids.includes(key)) return row.Cywilizacja ?? null;
  }
  return null;
}
function religionTradeWalutaOverride(cityReligion, ownerCivKey, maMennicaEmpireWide, walutaOdkryta, civs, societyParams, difficulty) {
  if (!walutaOdkryta || !maMennicaEmpireWide || !cityReligion) return void 0;
  const civName = civDisplayNameForKey(ownerCivKey, civs);
  if (!civName) return void 0;
  const rp = loadReligionParams(societyParams, difficulty);
  const trade = cityTradeMultiplier(
    cityReligion,
    civName,
    civs,
    rp,
    true
  );
  return trade.applied ? trade.multiplier : void 0;
}
function ownersWithMennica(cities, builtByCity) {
  const owners = /* @__PURE__ */ new Set();
  for (const c of cities) {
    if ((builtByCity.get(c.id) ?? []).includes("mennica")) owners.add(c.ownerId);
  }
  return owners;
}
function resolveWalutaMnoznikOverride(cityReligion, ownerCivKey, maMennicaEmpireWide, walutaOdkryta, civs, societyParams, difficulty, fallbackScaled) {
  const religionOverride = religionTradeWalutaOverride(
    cityReligion,
    ownerCivKey,
    maMennicaEmpireWide,
    walutaOdkryta,
    civs,
    societyParams,
    difficulty
  );
  if (religionOverride !== void 0) return religionOverride;
  return mnoznikHandelPieniadzForCivByDifficulty(ownerCivKey, civs, difficulty, fallbackScaled);
}
function buildEconParams(data2, difficulty = "normal") {
  const raw = data2.econParams;
  const em = raw.ekonomia_miasta ?? {};
  const bu = raw.budynki ?? {};
  const gl = raw.globalne ?? {};
  const d = difficulty;
  const num = (group, key, fallback) => {
    const row = group[key];
    const v = row ? row[d] : void 0;
    return typeof v === "number" && Number.isFinite(v) ? v : fallback;
  };
  return {
    progWzrostuWspolczynnik: num(em, "pr\xF3g_wzrostu_wspolczynnik", 16),
    spichlerzZachowaniePoPrzroscie: num(em, "spichlerz_zachowanie_po_wzroscie", 0.5),
    akweduktProgLudnosci: num(em, "akwedukt_prog_ludnosci", 5),
    akweduktMaxLudnosci: num(em, "akwedukt_max_ludnosci", 15),
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
    budynekAkademiaBonusNauki: num(bu, "budynek_akademia_bonus_nauki", 0.1),
    budynekGarncarniaBonusZywnosci: num(bu, "budynek_garncarnia_bonus_zywnosci_lokalnie", 0.1),
    budynekMennicaMnoznik: num(bu, "budynek_mennica_mnoznik", 1),
    // NIEUZYWANE 2026-07-25 (patrz economy.ts)
    mennicaMnoznikPoWalucie: num(gl, "mennica_mnoznik_po_walucie", 1.5),
    // JEDYNY mnoznik Efektu 1 (Waluta+Mennica scalone)
    walutaMnoznik: num(bu, "waluta_mnoznik", 2),
    // NIEUZYWANE 2026-07-25 (patrz economy.ts)
    targowiskoPracaMnoznik: num(bu, "targowisko_praca_na_pieniadz_mnoznik", 2),
    suwaakHandelNaukaDefault: num(em, "suwak_handel_nauka_domyslnie", 60),
    suwaakHandelPieniadz: num(em, "suwak_handel_pieniadz_domyslnie", 30),
    suwaakHandelLuksus: num(em, "suwak_handel_luksus_domyslnie", 10),
    suwaakPracaBudynki: num(em, "suwak_praca_budynki_domyslnie", 70),
    suwaakPracaTeren: num(em, "suwak_praca_teren_domyslnie", 30)
  };
}
function scanCityVicinityTerrain(ctx) {
  const radius = cityRangeForPopulation(ctx.city.population);
  let hasLas = false;
  let hasBagno = false;
  for (const key of hexKeysWithinRadius(ctx.city.q, ctx.city.r, radius, ctx.map)) {
    const hex = ctx.map.hexes[key];
    if (!hex) continue;
    if (!hasLas && hex.nakladka === "las" /* Las */) hasLas = true;
    if (!hasBagno && hex.terenBazowy === "bagno") hasBagno = true;
    if (hasLas && hasBagno) break;
  }
  return { hasLas, hasBagno };
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
  const progZagoszczenia = rd("zdrowie_prog_zag\u0119szczenia", 4);
  const legacyMaleMiasto = rd("zdrowie_male_miasto_bonus", 1);
  return {
    rzeka: rd("zdrowie_rzeka", 2),
    akwedukt: rd("zdrowie_akwedukt", 4),
    studnia: rd("zdrowie_studnia", 2),
    targowisko: rd("zdrowie_targowisko", 2),
    lazniaPubliczna: rd("zdrowie_laznia_publiczna", 5),
    ceramika: rd("zdrowie_ceramika", 1),
    osiedlePopBonus: (pop) => {
      const legacy = pop <= progZagoszczenia ? legacyMaleMiasto : 0;
      return pickOsiedlePopBonus(zd, "zdrowie_bonus_osiedle_pop", pop, difficulty, legacy);
    },
    karaZagoszczenie: rd("zdrowie_kara_zag\u0119szczenie", -1),
    progZagoszczenia,
    karaBagno: rd("zdrowie_kara_bagno", -1),
    bonusLas: rd("zdrowie_bonus_las", 1),
    karaDzungla: rd("zdrowie_kara_dzungla", -1),
    karaBrakWody: rd("zdrowie_kara_brak_wody", -2)
  };
}
var __riverHexSetCache = /* @__PURE__ */ new WeakMap();
function cityHasWaterAccess(city, map) {
  const paths = map.riverPaths ?? [];
  const riverHexSet = __riverHexSetCache.get(paths) ?? (() => {
    const s = /* @__PURE__ */ new Set();
    for (const path of paths) {
      for (const h of path) s.add(`${h.q},${h.r}`);
    }
    __riverHexSetCache.set(paths, s);
    return s;
  })();
  function hexHasRiver(q, r) {
    const hex = map.hexes[`${q},${r}`];
    if (hex?.rzeka?.obecna) return true;
    if (riverHexSet.has(`${q},${r}`)) return true;
    for (const [dq, dr] of HEX_NEIGHBORS) {
      if (riverHexSet.has(`${q + dq},${r + dr}`)) return true;
    }
    return false;
  }
  return hexHasRiver(city.q, city.r);
}
function computeCityHealth(ludnosc, tiles, builtIds, hp, hasWaterAccess, mapCtx, spichlerzZdrowieBonus = 0, garncarniaSurplusZdrowie = 0) {
  let z = 0;
  let maRzeke = hasWaterAccess === true;
  if (hasWaterAccess === void 0) {
    for (const t of tiles) {
      if (t.maRzeke) {
        maRzeke = true;
        break;
      }
    }
  }
  const maStudnie = builtIds.includes("studnia");
  const maTargowisko = builtIds.includes("targowisko");
  const maAkwedukt = builtIds.includes("akwedukt");
  const maLaznia = builtIds.includes("laznia_publiczna");
  if (maRzeke) z += hp.rzeka;
  if (maAkwedukt) z += hp.akwedukt;
  if (maStudnie) z += hp.studnia;
  if (maTargowisko) z += hp.targowisko;
  if (maLaznia) z += hp.lazniaPubliczna;
  const osiedleV = hp.osiedlePopBonus(ludnosc);
  if (osiedleV) z += osiedleV;
  if (ludnosc > hp.progZagoszczenia) {
    z += hp.karaZagoszczenie * (ludnosc - hp.progZagoszczenia);
  }
  if (!maRzeke && !maStudnie && !maAkwedukt) z += hp.karaBrakWody;
  if (mapCtx) {
    const vicinity = scanCityVicinityTerrain(mapCtx);
    if (vicinity.hasLas) z += hp.bonusLas;
    if (vicinity.hasBagno) z += hp.karaBagno;
  }
  if (spichlerzZdrowieBonus) z += spichlerzZdrowieBonus;
  if (garncarniaSurplusZdrowie) z += garncarniaSurplusZdrowie;
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
  const ulepszeniaKeys = improvementKeysForHex(hex);
  return {
    terenBazowy: hex.terenBazowy,
    nakladka: hex.nakladka ?? "brak" /* Brak */,
    maRzeke: !!(hex.rzeka && hex.rzeka.obecna),
    zloze: hex.zloze,
    ulepszenieKey: ulepszeniaKeys[0],
    ulepszeniaKeys: ulepszeniaKeys.length ? ulepszeniaKeys : void 0
  };
}
function cityWorkedTilesForEconomy(city, map, territoryNodes) {
  const tiles = [];
  const centreHex = map.hexes[`${city.q},${city.r}`];
  if (centreHex) tiles.push(hexToWorkedTile(centreHex));
  const pop = Math.max(0, Math.floor(city.population ?? 0));
  if (pop <= 0) return tiles;
  const radius = cityRangeForPopulation(pop);
  const yieldOf = (q, r) => {
    const h = map.hexes[`${q},${r}`];
    if (!h) return {};
    const wt = hexToWorkedTile(h);
    const y = tileYield(wt);
    return {
      zywnosc: y.zywnosc,
      praca: y.praca,
      handel: y.handel
    };
  };
  const assigned = resolveWorkedTiles(city, map, yieldOf, {
    radius,
    territoryNodes,
    ownerId: city.ownerId
  });
  for (const t of assigned) {
    const h = map.hexes[t.key];
    if (h) tiles.push(hexToWorkedTile(h));
  }
  return tiles;
}
function computeTerritoryResourceYieldByCity(cities, map, territoryNodes) {
  const out = /* @__PURE__ */ new Map();
  if (!cities.length) return out;
  function nearestOwnerCityId(q, r, ownerId) {
    let best = null;
    let bestDist = Infinity;
    for (const c of cities) {
      if (c.ownerId !== ownerId) continue;
      const d = hexDistance(q, r, c.q, c.r);
      if (d < bestDist) {
        bestDist = d;
        best = c.id;
      }
    }
    return best;
  }
  for (const hexKey2 of Object.keys(map.hexes)) {
    const hex = map.hexes[hexKey2];
    if (!hex) continue;
    const impKeys = improvementKeysForHex(hex);
    if (!impKeys.length) continue;
    const { q, r } = hex.coords;
    const owner = territoryOwnerAt(q, r, territoryNodes);
    if (owner == null) continue;
    const cityId = nearestOwnerCityId(q, r, owner);
    if (!cityId) continue;
    for (const key of impKeys) {
      const yieldRow = territoryResourceYieldForImprovement(key, hex.zloze);
      if (!yieldRow) continue;
      const rec = out.get(cityId) ?? {};
      rec[yieldRow.resourceKey] = (rec[yieldRow.resourceKey] ?? 0) + yieldRow.amount;
      out.set(cityId, rec);
    }
  }
  return out;
}
function stolarniaDrewnoMapInflowMult(stolarniaCount, bonusPerBuilding) {
  const n = Math.max(0, Math.floor(stolarniaCount));
  return 1 + bonusPerBuilding * n;
}
function applyStolarniaDrewnoMapInflow(baseDrewno, stolarniaCount, bonusPerBuilding) {
  if (!Number.isFinite(baseDrewno) || baseDrewno <= 0) return 0;
  return Math.floor(baseDrewno * stolarniaDrewnoMapInflowMult(stolarniaCount, bonusPerBuilding));
}
var ZERO_WORKED_MAGAZYN = { drewno: 0, kamien: 0, glina: 0 };
function computeWorkedMagazynYieldsByCity(cities, map, territoryNodes) {
  const out = /* @__PURE__ */ new Map();
  for (const city of cities) {
    const worked = cityWorkedTilesForEconomy(city, map, territoryNodes);
    let drewno = 0;
    let kamien = 0;
    let glina = 0;
    for (const tile of worked) {
      const y = tileYield(tile);
      drewno += y.drewno;
      kamien += y.kamien;
      glina += y.glina;
    }
    if (drewno > 0 || kamien > 0 || glina > 0) {
      out.set(city.id, { drewno, kamien, glina });
    }
  }
  return out;
}
function countResourceUpkeepImprovementsByOwner(map, territoryNodes) {
  const out = /* @__PURE__ */ new Map();
  for (const hexKey2 of Object.keys(map.hexes)) {
    const hex = map.hexes[hexKey2];
    if (!hex) continue;
    const impKeys = improvementKeysForHex(hex);
    if (!impKeys.length) continue;
    let n = 0;
    for (const key of impKeys) {
      if (RESOURCE_UPKEEP_IMPROVEMENT_KEYS.has(key)) n += 1;
    }
    if (n === 0) continue;
    const { q, r } = hex.coords;
    const owner = territoryOwnerAt(q, r, territoryNodes);
    if (owner == null) continue;
    out.set(owner, (out.get(owner) ?? 0) + n);
  }
  return out;
}
function loadResourceImprovementUpkeepCost(data2, difficulty) {
  const raw = data2.econParams;
  return loadThroughput(raw, "ulepszenie_surowcowe_upkeep_praca", difficulty, 1);
}
function computePracaUpkeepByOwner(map, territoryNodes, data2, difficulty) {
  const counts = countResourceUpkeepImprovementsByOwner(map, territoryNodes);
  const cost = loadResourceImprovementUpkeepCost(data2, difficulty);
  const out = /* @__PURE__ */ new Map();
  for (const [owner, n] of counts) out.set(owner, n * cost);
  return out;
}
function toEconomyCity(city, params, isCapital, zdrowie = 0, buildings = {}, ownerDefaultPodzial) {
  const paramsFallback = {
    procentNauka: params.suwaakHandelNaukaDefault,
    procentPieniadz: params.suwaakHandelPieniadz,
    procentLuksus: params.suwaakHandelLuksus
  };
  return {
    id: city.id,
    ludnosc: city.population,
    zdrowie,
    czyStolica: isCapital,
    maSpichlerz: buildings.maSpichlerz ?? false,
    maSpichlerzII: buildings.maSpichlerzII ?? false,
    maAkwedukt: buildings.maAkwedukt ?? false,
    magazynZywnosci: readCityFoodBufferFromCity(city),
    specjalisci: [],
    kolejkaProdukcji: [],
    podzia\u0142Handlu: resolveCityPodzialHandlu(city, ownerDefaultPodzial, paramsFallback),
    podzia\u0142Pracy: city.podzialPracy ?? {
      procentBudynki: params.suwaakPracaBudynki
    }
  };
}
function readCityFoodBufferFromCity(city) {
  return readCityFoodBuffer(city.magazynZywnosci);
}
function getCityFood(city) {
  return readCityFoodBufferFromCity(city);
}
function sumEconomyForOwner(result, ownerId) {
  let pieniadz = 0;
  let nauka = 0;
  let doPuli = 0;
  let praca = 0;
  let kultura = 0;
  let pieniadzZTras = 0;
  for (const tk of result.perCity) {
    if (tk.ownerId !== ownerId) continue;
    pieniadz += tk.pieniadz;
    nauka += tk.nauka;
    doPuli += tk.doPuli;
    praca += tk.praca;
    kultura += tk.kultura;
    pieniadzZTras += tk.pieniadzZTras;
  }
  return { pieniadz, nauka, doPuli, praca, kultura, pieniadzZTras };
}
function sumEconomyForPlayerCities(result, cities) {
  const playerCityIds = new Set(
    cities.filter((c) => c.ownerId === 0).map((c) => c.id)
  );
  let pieniadz = 0;
  let nauka = 0;
  let doPuli = 0;
  let praca = 0;
  let kultura = 0;
  let pieniadzZTras = 0;
  for (const tk of result.perCity) {
    if (!playerCityIds.has(tk.cityId)) continue;
    pieniadz += tk.pieniadz;
    nauka += tk.nauka;
    doPuli += tk.doPuli;
    praca += tk.praca;
    kultura += tk.kultura;
    pieniadzZTras += tk.pieniadzZTras;
  }
  return { pieniadz, nauka, doPuli, praca, kultura, pieniadzZTras };
}
var _spichlerzSolArmyByOwner = /* @__PURE__ */ new Map();
var _spichlerzSolCityIdsByOwner = /* @__PURE__ */ new Map();
function simulateCeramikaAfterSpichlerzDrains(cities, ownerId, builtByCity) {
  let ceramika = ownerResourceStock(cities, ownerId, "ceramika");
  for (const city of cities) {
    if (city.ownerId !== ownerId) continue;
    const builtIds = builtByCity.get(city.id) ?? [];
    const hasSpichlerz = builtIds.includes("spichlerz") || builtIds.includes("spichlerz_ii");
    if (hasSpichlerz && ceramika >= SPICHLERZ_DRAIN_CERAMIKA_PER_TURN) {
      ceramika -= SPICHLERZ_DRAIN_CERAMIKA_PER_TURN;
    }
  }
  return ceramika;
}
function computeGarncarniaSurplusZadowolenieByOwner(cities, builtByCity, stockAlreadyDrained = false) {
  const out = /* @__PURE__ */ new Map();
  const ownerIds = new Set(cities.map((c) => c.ownerId));
  for (const ownerId of ownerIds) {
    let maGarncarnie = false;
    for (const city of cities) {
      if (city.ownerId !== ownerId) continue;
      if ((builtByCity.get(city.id) ?? []).includes("garncarnia")) {
        maGarncarnie = true;
        break;
      }
    }
    const ceramikaAfter = stockAlreadyDrained ? ownerResourceStock(cities, ownerId, "ceramika") : simulateCeramikaAfterSpichlerzDrains(cities, ownerId, builtByCity);
    const { zadowolenieBonus } = computeGarncarniaSurplusBonus({
      ceramikaPoDrainSpichlerza: ceramikaAfter,
      maGarncarnie,
      efekt: "zadowolenie",
      zadowolenieNaSztuke: 1
    });
    out.set(ownerId, zadowolenieBonus);
  }
  return out;
}
function computeCityFoodBalanceV85(zywnoscBrutto, population, city, rationParams, spichlerzState) {
  const poziomRacji = getCityRationLevel(city);
  const kosztRacji = computeCityRationCost(
    population,
    poziomRacji,
    rationParams,
    spichlerzState
  );
  return {
    kosztRacji,
    bilansLokalny: zywnoscBrutto - kosztRacji,
    poziomRacji
  };
}
function runtimeActiveBuiltIdsForCity(builtIds, ownerId, resolveOwnerActiveLabels, resolveOwnerEmpireStock, resolveOwnerZlotoAccess, empireStockOverride) {
  if (!resolveOwnerActiveLabels) return builtIds;
  const gateOptions = {
    ownerId,
    resolveOwnerZlotoAccess
  };
  return filterRuntimeActiveBuiltIds(
    builtIds,
    resolveOwnerActiveLabels(ownerId),
    empireStockOverride ?? resolveOwnerEmpireStock?.(ownerId),
    gateOptions
  );
}
function tickEmpireResourcePipeline(cities, builtByCity, territoryResourceByCity, workedMagazynByCity, stolarniaCountByOwner, kamieniarskiCountByOwner, stolarniaBonusDrewnaCiv, kamieniarskiBonusKamieniaCiv, converterThroughputs, ownerResourceCapFor, resolveOwnerActiveLabels, resolveOwnerZlotoAccess) {
  const ownerIds = new Set(cities.map((c) => c.ownerId));
  for (const city of cities) {
    const terrYield = territoryResourceByCity.get(city.id);
    const worked = workedMagazynByCity.get(city.id) ?? ZERO_WORKED_MAGAZYN;
    const ownerId = city.ownerId;
    const cap = ownerResourceCapFor(ownerId);
    const stolarniaCount = stolarniaCountByOwner.get(ownerId) ?? 0;
    const kamienMult = 1 + kamieniarskiBonusKamieniaCiv * (kamieniarskiCountByOwner.get(ownerId) ?? 0);
    const creditTerritory = (key, raw, mult = 1) => {
      if (raw == null || !(raw > 0)) return;
      creditOwnerResourceStock(cities, ownerId, key, Math.floor(raw * mult), cap);
    };
    const drewnoMapBase = (terrYield?.drewno ?? 0) + worked.drewno;
    const drewnoCredit = applyStolarniaDrewnoMapInflow(
      drewnoMapBase,
      stolarniaCount,
      stolarniaBonusDrewnaCiv
    );
    if (drewnoCredit > 0) {
      creditOwnerResourceStock(cities, ownerId, "drewno", drewnoCredit, cap);
    }
    const kamienMapBase = (terrYield?.kamien ?? 0) + worked.kamien;
    creditTerritory("kamien", kamienMapBase, kamienMult);
    const glinaMapBase = (terrYield?.glina ?? 0) + worked.glina;
    creditTerritory("glina", glinaMapBase);
    if (!terrYield) continue;
    creditTerritory("ruda", terrYield.ruda);
    creditTerritory("ruda_zelaza", terrYield.ruda_zelaza);
    creditTerritory("sol", terrYield.sol);
    creditTerritory("zloto", terrYield.zloto);
    creditTerritory("kon", terrYield.kon);
  }
  for (const ownerId of ownerIds) {
    const cap = ownerResourceCapFor(ownerId);
    let pool = { ...ownerResourceStockAll(cities, ownerId) };
    for (const city of cities) {
      if (city.ownerId !== ownerId) continue;
      const builtIds = builtByCity.get(city.id) ?? [];
      const runtimeBuiltIds = runtimeActiveBuiltIdsForCity(
        builtIds,
        ownerId,
        resolveOwnerActiveLabels,
        void 0,
        resolveOwnerZlotoAccess,
        pool
      );
      const activeRecipes = DEFAULT_CONVERTER_RECIPES.filter(
        (r) => runtimeBuiltIds.includes(converterBuildingIdForRecipe(r))
      );
      if (activeRecipes.length === 0) continue;
      const convResult = runConverters(
        activeRecipes,
        pool,
        converterThroughputs,
        () => cap
      );
      pool = convResult.stores;
    }
    assignOwnerResourceStockFromPool(cities, ownerId, pool);
  }
  const spichlerzByCity = /* @__PURE__ */ new Map();
  _spichlerzSolArmyByOwner.clear();
  _spichlerzSolCityIdsByOwner.clear();
  for (const city of cities) {
    const builtIds = builtByCity.get(city.id) ?? [];
    const drain = paySpichlerzDrainForCity(cities, city.ownerId, builtIds, false);
    const state = resolveSpichlerzCityBonusState(builtIds, drain);
    spichlerzByCity.set(city.id, state);
    if (state.solActive) {
      _spichlerzSolArmyByOwner.set(city.ownerId, true);
      const prev = new Set(_spichlerzSolCityIdsByOwner.get(city.ownerId) ?? []);
      prev.add(city.id);
      _spichlerzSolCityIdsByOwner.set(city.ownerId, prev);
    }
  }
  return spichlerzByCity;
}
function applyMennicaZlotoDrainForOwners(cities, mennicaOwners, resolveOwnerTech, playerZbadane, resolveOwnerZlotoAccess) {
  for (const ownerId of mennicaOwners) {
    const ownerTech = resolveOwnerTech ? resolveOwnerTech(ownerId) : playerZbadane;
    const walutaOdkryta = ownerTech.has("Waluta") || ownerTech.has("waluta");
    if (!walutaOdkryta) continue;
    if (!resolveOwnerZlotoAccess(ownerId)) continue;
    const pool = ownerResourceStockAll(cities, ownerId);
    if (empireZlotoStock(pool) < MENNICA_ZLOTO_DRAIN_PER_TURN) continue;
    assignOwnerResourceStockFromPool(cities, ownerId, deductMennicaZlotoDrain(pool));
  }
}
function advanceCityEconomy(cities, map, data2, difficulty = "normal", econUnits = [], growthMultByCity = /* @__PURE__ */ new Map(), builtByCity = /* @__PURE__ */ new Map(), playerEra = 1, playerZbadane = /* @__PURE__ */ new Set(), ownerCivByOwnerId = /* @__PURE__ */ new Map(), orderMultByCity = /* @__PURE__ */ new Map(), resolveOwnerEra, resolveOwnerTech, wzrostLudnosciPace = "wysoki", tradeRouteCountByCity = /* @__PURE__ */ new Map(), tradeIncomeByCity = /* @__PURE__ */ new Map(), cityReligionByCityId = /* @__PURE__ */ new Map(), wonderCityYieldsByOwner = /* @__PURE__ */ new Map(), resolveOwnerZlotoAccess = () => true, resolveOwnerActiveLabels, resolveOwnerEmpireStock, ownerDefaultPodzialHandluByOwner = /* @__PURE__ */ new Map(), manpowerHeal) {
  const gameDifficulty = difficulty;
  const params = buildEconParams(data2, difficulty);
  const buildingCatalog = data2.buildings;
  const territoryNodes = buildTerritoryNodesFromCities(cities);
  reconcileAllWorkedTiles(cities, territoryNodes);
  const territoryResourceByCity = computeTerritoryResourceYieldByCity(cities, map, territoryNodes);
  const pracaUpkeepByOwner = computePracaUpkeepByOwner(map, territoryNodes, data2, difficulty);
  const rawEconParams = data2.econParams;
  const upkeepParams = loadUpkeepParams(rawEconParams, difficulty);
  const storageParams = loadStorageParams(rawEconParams, difficulty);
  const rationParams = buildRationParams(rawEconParams, difficulty);
  const unitUpkeepTbl = buildUnitUpkeepTable(data2.units);
  const rawForConverters = data2.econParams;
  const converterThroughputs = {};
  for (const recipe of DEFAULT_CONVERTER_RECIPES) {
    converterThroughputs[recipe.id] = loadThroughput(
      rawForConverters,
      recipe.throughputParamKey,
      difficulty,
      recipe.throughputFallback
    );
  }
  const stolarniaBonusDrewnaCiv = loadThroughput(
    rawForConverters,
    "budynek_stolarnia_bonus_drewna_civ",
    difficulty,
    0.1
  );
  const kamieniarskiBonusKamieniaCiv = loadThroughput(
    rawForConverters,
    "budynek_kamieniarski_bonus_kamienia_civ",
    difficulty,
    0.1
  );
  const stolarniaCountByOwner = /* @__PURE__ */ new Map();
  const kamieniarskiCountByOwner = /* @__PURE__ */ new Map();
  const magazynCountByOwner = /* @__PURE__ */ new Map();
  for (const c of cities) {
    const bIds = builtByCity.get(c.id) ?? [];
    const runtimeBIds = runtimeActiveBuiltIdsForCity(
      bIds,
      c.ownerId,
      resolveOwnerActiveLabels,
      resolveOwnerEmpireStock,
      resolveOwnerZlotoAccess
    );
    if (runtimeBIds.includes("stolarnia")) {
      stolarniaCountByOwner.set(c.ownerId, (stolarniaCountByOwner.get(c.ownerId) ?? 0) + 1);
    }
    if (runtimeBIds.includes("kamieniarski")) {
      kamieniarskiCountByOwner.set(c.ownerId, (kamieniarskiCountByOwner.get(c.ownerId) ?? 0) + 1);
    }
    if (bIds.includes("magazyn")) {
      magazynCountByOwner.set(c.ownerId, (magazynCountByOwner.get(c.ownerId) ?? 0) + 1);
    }
  }
  const ownerStorageParams = loadOwnerStorageParams(rawEconParams, difficulty);
  const ownerResCapByOwner = /* @__PURE__ */ new Map();
  function ownerResourceCapFor(ownerId) {
    const cached = ownerResCapByOwner.get(ownerId);
    if (cached !== void 0) return cached;
    const cap = ownerResourceCapacityPerType(magazynCountByOwner.get(ownerId) ?? 0, ownerStorageParams);
    ownerResCapByOwner.set(ownerId, cap);
    return cap;
  }
  const healthParams = loadHealthParams(
    data2.societyParams,
    difficulty
  );
  const wealthParams = loadWealthParams(
    data2.econParams,
    difficulty
  );
  const capitalSeen = /* @__PURE__ */ new Set();
  const mennicaOwners = ownersWithMennica(cities, builtByCity);
  const capitalCoordsByOwner = /* @__PURE__ */ new Map();
  const cityCountByOwner = /* @__PURE__ */ new Map();
  for (const c of cities) {
    if (!capitalCoordsByOwner.has(c.ownerId)) {
      capitalCoordsByOwner.set(c.ownerId, { q: c.q, r: c.r });
    }
    cityCountByOwner.set(c.ownerId, (cityCountByOwner.get(c.ownerId) ?? 0) + 1);
  }
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
    upkeepByOwner: /* @__PURE__ */ new Map(),
    resourceUpkeepByOwner: /* @__PURE__ */ new Map(),
    pracaUpkeepByOwner
  };
  const incomeByOwner = /* @__PURE__ */ new Map();
  const workedMagazynByCity = computeWorkedMagazynYieldsByCity(cities, map, territoryNodes);
  const spichlerzByCity = tickEmpireResourcePipeline(
    cities,
    builtByCity,
    territoryResourceByCity,
    workedMagazynByCity,
    stolarniaCountByOwner,
    kamieniarskiCountByOwner,
    stolarniaBonusDrewnaCiv,
    kamieniarskiBonusKamieniaCiv,
    converterThroughputs,
    ownerResourceCapFor,
    resolveOwnerActiveLabels,
    resolveOwnerZlotoAccess
  );
  const garncarniaSurplusZadowolenieByOwner = computeGarncarniaSurplusZadowolenieByOwner(
    cities,
    builtByCity,
    true
  );
  for (const city of cities) {
    const isCapital = !capitalSeen.has(city.ownerId);
    capitalSeen.add(city.ownerId);
    const worked = cityWorkedTilesForEconomy(city, map, territoryNodes);
    const builtIds = builtByCity.get(city.id) ?? [];
    const runtimeBuiltIds = runtimeActiveBuiltIdsForCity(
      builtIds,
      city.ownerId,
      resolveOwnerActiveLabels,
      resolveOwnerEmpireStock,
      resolveOwnerZlotoAccess
    );
    const spichlerzState = spichlerzByCity.get(city.id) ?? resolveSpichlerzCityBonusState(builtIds, { ceramikaPaid: false, solPaid: false });
    const hasWater = cityHasWaterAccess(city, map);
    const garncarniaZadowolenie = runtimeBuiltIds.includes("garncarnia") ? garncarniaSurplusZadowolenieByOwner.get(city.ownerId) ?? 0 : 0;
    const zdrowie = computeCityHealth(
      city.population,
      worked,
      runtimeBuiltIds,
      healthParams,
      hasWater,
      { city, map },
      spichlerzHealthBonus(spichlerzState)
    );
    const maSpichlerzII = spichlerzState.maSpichlerzIIPop;
    const maSpichlerz = spichlerzState.maSpichlerzPop;
    const maAkwedukt = runtimeBuiltIds.includes("akwedukt");
    const poziomRacji = getCityRationLevel(city);
    const ownerDefaultPodzial = ownerDefaultPodzialHandluByOwner.get(city.ownerId);
    const econCity = toEconomyCity(
      city,
      params,
      isCapital,
      zdrowie,
      { maSpichlerz, maSpichlerzII, maAkwedukt },
      ownerDefaultPodzial
    );
    const ownerEra = resolveOwnerEra ? resolveOwnerEra(city.ownerId) : city.ownerId === 0 ? playerEra : 1;
    const ownerTech = resolveOwnerTech ? resolveOwnerTech(city.ownerId) : playerZbadane;
    const walutaOdkryta = ownerTech.has("Waluta") || ownerTech.has("waluta");
    const ownerCivKey = ownerCivByOwnerId.get(city.ownerId);
    const cityReligion = cityReligionByCityId.get(city.id);
    const maMennicaBuiltEmpireWide = mennicaOwners.has(city.ownerId);
    const maMennicaEmpireWide = maMennicaBuiltEmpireWide && resolveOwnerZlotoAccess(city.ownerId);
    const walutaMnoznikOverride = resolveWalutaMnoznikOverride(
      cityReligion,
      ownerCivKey,
      maMennicaEmpireWide,
      walutaOdkryta,
      data2.civs,
      data2.societyParams,
      difficulty,
      params.mennicaMnoznikPoWalucie
    );
    const ownerBonusy = ownerCivKey ? civBonusyForCivKey(ownerCivKey, data2.civs) : [];
    const { handel: civHandelMult, nauka: civNaukaMult } = civEconomyYieldMultipliers(ownerBonusy);
    const liczbaTrasHandlowych = tradeRouteCountByCity.get(city.id) ?? 0;
    const capCoords = capitalCoordsByOwner.get(city.ownerId);
    const dystansOdStolicy = isCapital || !capCoords ? 0 : hexDistance(city.q, city.r, capCoords.q, capCoords.r);
    const liczbaWszystkichMiast = cityCountByOwner.get(city.ownerId) ?? 1;
    const strataBazowa = corruptionRate(dystansOdStolicy, liczbaWszystkichMiast, params);
    const redukcjaBudynkowKorupcji = corruptionBuildingReduction(builtIds);
    const strataFraction = strataBazowa * (1 - redukcjaBudynkowKorupcji);
    const ctx = {
      wojskoZuzycieZywnosci: 0,
      // B5: wojsko → zapasy państwa (advanceEmpireFood)
      strataFraction,
      maMlyn: runtimeBuiltIds.includes("mlyn"),
      maCegielnia: runtimeBuiltIds.includes("cegielnia"),
      maTargowisko: runtimeBuiltIds.includes("targowisko"),
      maBiblioteka: runtimeBuiltIds.includes("biblioteka"),
      maAkademia: runtimeBuiltIds.includes("akademia"),
      // Efekt 1 SCALONY (decyzja Maciej 2026-07-25): Mennica jest jednym z dwoch
      // warunkow bramki w cityYieldPerTurn (ctx.maMennica && ctx.walutaOdkryta) --
      // gdy oba prawdziwe, CALY handelNetto (Skarb+Nauka+Zamoznosc) jest mnozony
      // przez mnoznik cywilizacyjny skalowany trudnoscia (walutaMnoznikOverride,
      // patrz resolveWalutaMnoznikOverride powyzej -- ZASTEPUJE plaska regule
      // "2/1.5/1 dla wszystkich", pytanie 69). Mennica jest teraz IMPERIUM-WIDE
      // (pytanie 71/C), bo stoi wylacznie w stolicy (pytanie 70/B). PYTANIE 83=B:
      // maMennicaEmpireWide juz zawiera bramke dostepu do zlota -- gdy brak, false
      // mimo ze budynek dalej stoi (nie jest burzony).
      maMennica: maMennicaEmpireWide,
      walutaOdkryta,
      // P1b: bramka Efektu 1 (razem z maMennica) w cityYieldPerTurn
      walutaMnoznikOverride,
      // per-cyw skalowany trudnoscia (lub override religii)
      civHandelMult,
      // RDY-01: bonus_zloto handel (Grecy +15%)
      civNaukaMult,
      // RDY-01: bonus_nauka (Inkowie +15%)
      liczbaAktywnychTrasHandlowych: liczbaTrasHandlowych,
      // Handel E3: +5%/trasa
      // Zadanie 2 (2026-07-23): Garncarnia +Zywnosc% LOKALNIE -- liczba sztuk w TYM miescie.
      liczbaGarncarni: runtimeBuiltIds.filter((id) => id === "garncarnia").length
    };
    const yieldBuiltIds = builtIdsForSpichlerzYields(runtimeBuiltIds, spichlerzState);
    const cityBuildings = cityBuildingEntriesFromBuiltIds(yieldBuiltIds, buildingCatalog, ownerEra, ownerTech);
    const yld = cityYieldPerTurn(econCity, worked, cityBuildings, params, ctx);
    const orderMult = orderMultByCity.get(city.id);
    if (orderMult) applyOrderYieldMults(yld, orderMult);
    yld.praca = cityPracaInteger(yld.praca);
    const zywnoscBrutto = yld.zywnoscBrutto;
    const foodBal = computeCityFoodBalanceV85(zywnoscBrutto, city.population, city, rationParams, spichlerzState);
    yld.zywnosc = foodBal.bilansLokalny;
    applyWonderCityYields(yld, wonderCityYieldsByOwner.get(city.ownerId));
    const prevWealth = city.wealthState ?? freshWealthState();
    const wealthImmunity = (city.wealthImmunityRemaining ?? 0) > 0;
    const wt = advanceWealth(
      prevWealth,
      yld.luksus,
      // spoleczMoney = strumien Luksus
      yld.pieniadz,
      // miastoMoney  = pieniadz brutto tej tury
      ownerEra,
      wealthParams,
      wealthImmunity ? { minPoziom: 1 } : void 0
    );
    if (wealthImmunity && city.wealthImmunityRemaining != null) {
      city.wealthImmunityRemaining = Math.max(0, city.wealthImmunityRemaining - 1);
    }
    city.wealthState = { poziom: wt.poziom, pula: wt.pula };
    const pieniadzPoWealth = Math.floor(yld.pieniadz * wt.mnoznik);
    const pieniadzZTras = tradeIncomeByCity.get(city.id) ?? 0;
    const udzialBudynki = (city.podzialPracy?.procentBudynki ?? params.suwaakPracaBudynki) / 100;
    const { doBudynkow, doPuli } = splitPraca(yld.praca, udzialBudynki);
    if (ctx.maTargowisko && walutaOdkryta) {
      const pieniadzZPracyPoSplit = Math.floor(doPuli * params.targowiskoPracaMnoznik);
      yld.pieniadz = yld.pieniadz - yld.pieniadzZPracy + pieniadzZPracyPoSplit;
      yld.pieniadzZPracy = pieniadzZPracyPoSplit;
    }
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
        pieniadz: pieniadzPoWealth + pieniadzZTras,
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
        garncarniaSurplusZadowolenie: garncarniaZadowolenie,
        pieniadzZPracy: yld.pieniadzZPracy,
        pieniadzZTras,
        oblegany: true,
        obleganyGlod,
        magazynPoTurze,
        maSpichlerz,
        maSpichlerzII,
        spichlerzCeramika: spichlerzState.ceramikaActive,
        spichlerzSol: spichlerzState.solActive,
        procentRozwoj: Math.round(poziomRacji / 6 * 100),
        zywnoscBrutto: 0,
        kosztRacji: 0,
        bilansLokalny: 0,
        poziomRacji
      };
      result.perCity.push(tick2);
      incomeByOwner.set(city.ownerId, (incomeByOwner.get(city.ownerId) ?? 0) + tick2.pieniadz);
      result.cities += 1;
      result.totalPraca += yld.praca;
      result.totalPieniadz += tick2.pieniadz;
      result.totalNauka += yld.nauka;
      result.totalLuksus += yld.luksus;
      result.totalKultura += yld.kultura;
      result.totalZywnosc += 0;
      result.totalPracaPula += doPuli;
      continue;
    }
    const before = city.population;
    const growthPreview = computeGrowthPercentV85({
      population: city.population,
      poziomRacji: foodBal.poziomRacji,
      zdrowie,
      szczescieNetto: 0,
      wealthPoziom: wt.poziom,
      spichlerzState,
      civKey: ownerCivKey ?? null,
      rationParams
    });
    const ownerEpoka = ownerEra;
    const mpMults = civManpowerMults(ownerBonusy);
    if (city.manpower === void 0) {
      city.manpower = cityManpowerMax(city.population, ownerEpoka, mpMults.maxMult);
    }
    city.manpower = tickManpowerRegen(
      city,
      ownerEpoka,
      loadManpowerRegenParams(),
      mpMults.regenMult,
      mpMults.maxMult
    );
    magazynPoTurze = city.wzrostUlamkowy ?? 0;
    incomeByOwner.set(city.ownerId, (incomeByOwner.get(city.ownerId) ?? 0) + pieniadzPoWealth + pieniadzZTras);
    const tick = {
      cityId: city.id,
      ownerId: city.ownerId,
      praca: yld.praca,
      pieniadz: pieniadzPoWealth + pieniadzZTras,
      pieniadzBrutto: yld.pieniadz,
      zywnoscNetto: foodBal.bilansLokalny,
      nauka: yld.nauka,
      luksus: yld.luksus,
      kultura: yld.kultura,
      ludnoscPrzed: before,
      ludnoscPo: before,
      wzrost: false,
      ubytek: false,
      zdrowie,
      doBudynkow,
      doPuli,
      wealthMnoznik: wt.mnoznik,
      wealthZadowolenie: wt.zadowolenie,
      garncarniaSurplusZadowolenie: garncarniaZadowolenie,
      pieniadzZPracy: yld.pieniadzZPracy,
      pieniadzZTras,
      oblegany: false,
      obleganyGlod: false,
      magazynPoTurze,
      maSpichlerz,
      maSpichlerzII,
      spichlerzCeramika: spichlerzState.ceramikaActive,
      spichlerzSol: spichlerzState.solActive,
      procentRozwoj: Math.round(poziomRacji / 6 * 100),
      zywnoscBrutto,
      kosztRacji: foodBal.kosztRacji,
      bilansLokalny: foodBal.bilansLokalny,
      poziomRacji,
      wzrostProcent: growthPreview.total,
      wzrostUlamkowyPo: city.wzrostUlamkowy ?? 0
    };
    result.perCity.push(tick);
    result.cities += 1;
    result.totalPraca += yld.praca;
    result.totalPieniadz += tick.pieniadz;
    result.totalNauka += yld.nauka;
    result.totalLuksus += yld.luksus;
    result.totalKultura += yld.kultura;
    result.totalZywnosc += foodBal.bilansLokalny;
    result.totalPracaPula += doPuli;
  }
  applyMennicaZlotoDrainForOwners(
    cities,
    mennicaOwners,
    resolveOwnerTech,
    playerZbadane,
    resolveOwnerZlotoAccess
  );
  reconcileOwnerResourceCaps(cities, ownerResourceCapFor);
  const ownerIds = /* @__PURE__ */ new Set([
    ...cities.map((c) => c.ownerId),
    ...econUnits.map((u) => u.ownerId)
  ]);
  const buildingsByOwner = /* @__PURE__ */ new Map();
  for (const city of cities) {
    const builtIds = builtByCity.get(city.id) ?? [];
    if (builtIds.length === 0) continue;
    const ownerEra = resolveOwnerEra ? resolveOwnerEra(city.ownerId) : city.ownerId === 0 ? playerEra : 1;
    const ownerTech = resolveOwnerTech ? resolveOwnerTech(city.ownerId) : playerZbadane;
    const list = buildingsByOwner.get(city.ownerId) ?? [];
    for (const bid of builtIds) {
      const bdef = data2.buildings.find((b) => b.id === bid);
      if (!bdef) continue;
      const level = buildingLevelForEpoch(
        bdef.epokaWejscia,
        ownerEra,
        bdef.maksPoziom,
        bdef.poziomTechGate,
        ownerTech
      );
      list.push({ record: bdef, level });
    }
    buildingsByOwner.set(city.ownerId, list);
  }
  for (const oid of ownerIds) {
    const income = incomeByOwner.get(oid) ?? 0;
    const ounits = econUnits.filter((u) => u.ownerId === oid);
    const balance = upkeepBalance(income, buildingsByOwner.get(oid) ?? [], ounits, unitUpkeepTbl, upkeepParams);
    result.upkeepByOwner.set(oid, balance);
    const resUpkeep = totalBuildingResourceUpkeep(
      buildingsByOwner.get(oid) ?? []
    );
    addResourceCosts(
      resUpkeep,
      totalUnitResourceUpkeep(
        ounits,
        (typeId) => data2.units.find((u) => u.Jednostka === typeId)
      )
    );
    result.resourceUpkeepByOwner.set(oid, resUpkeep);
  }
  if (manpowerHeal) {
    tickManpowerUnitReplenishment(
      cities,
      manpowerHeal.units,
      difficulty,
      resolveOwnerEra ?? ((oid) => oid === 0 ? playerEra : 1),
      (oid) => {
        const key = ownerCivByOwnerId.get(oid);
        return key ? civBonusyForCivKey(key, data2.civs) : [];
      },
      manpowerHeal.getMaxHp
    );
  }
  return result;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  advanceCityEconomy,
  canFoundCity,
  foundCityAt,
  freshWealthState,
  generateMap,
  sumEconomyForOwner,
  sumEconomyForPlayerCities
});
