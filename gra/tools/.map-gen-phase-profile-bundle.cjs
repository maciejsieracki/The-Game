"use strict";

// tools/.map-gen-phase-profile-entry.ts
var import_node_perf_hooks = require("node:perf_hooks");

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
    wegiel: { rarity: 0.1 },
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
  wegiel: 0.1,
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
  const rs2 = map_gen_params_default.gestosc?.river_scale;
  const lut = {
    mala: "mala",
    srednia: "srednia",
    duza: "duza",
    ogromna: "ogromna",
    super: "super"
  };
  const v = rs2?.[lut[size]];
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
  const h2 = map_gen_params_default.gestosc?.highland_noise_threshold;
  const k = tierKey(tier);
  if (h2 && typeof h2[k] === "number") return h2[k];
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
      miasta_panstwa: 6,
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
      miasta_panstwa: 7,
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
      miasta_panstwa: 8,
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
        kamien: { default: 7, min: 6, max: 8 },
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
function mapSizeLabelFromDims(w2, h2) {
  const area = w2 * h2;
  if (area < 4800) return "mala";
  if (area < 12e3) return "srednia";
  if (area < 25200) return "duza";
  if (area < 1e5) return "ogromna";
  return "super";
}
function mapSizeLabelFromMenuLabel(menuLabel) {
  const { w: w2, h: h2 } = menuLabelToDims(menuLabel);
  return mapSizeLabelFromDims(w2, h2);
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
  const { w: w2, h: h2 } = menuLabelToDims(mapMenuLabel);
  const areaBoost = Math.max(1, Math.sqrt(w2 * h2 / 5e3));
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
function riverMapAreaScale(w2, h2) {
  return Math.sqrt(w2 * h2 / RIVER_REF_AREA);
}
function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}
function resolveRiverMapParams(tier, w2, h2) {
  const areaScale = riverMapAreaScale(w2, h2);
  const minDim = Math.min(w2, h2);
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
  const feederPasses = clamp(4 + Math.floor(areaScale), 4, 10);
  const topUpPasses = clamp(6 + Math.floor(areaScale * 2), 6, 16);
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
  const { w: w2, h: h2 } = menuLabelToDims(mapMenuLabel);
  const params2 = resolveRiverMapParams(riversTier, w2, h2);
  const base = riverTraceLimitsForMap(mapMenuLabel);
  return {
    minLen: params2.minLen,
    maxLen: params2.maxLen,
    margin: base.margin
  };
}
function riverTraceLimitsForMap(mapMenuLabel) {
  const { w: w2, h: h2 } = menuLabelToDims(mapMenuLabel);
  const minDim = Math.min(w2, h2);
  const area = w2 * h2;
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
  { min: 4, default: 6, max: 7 },
  { min: 5, default: 7, max: 8 },
  { min: 6, default: 8, max: MAX_MIAST_PANSTWA },
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
  kamien: [3, 4, 5, 6, 7, 7],
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
  return Math.max(2, Math.round(EARTH_POLAR_OCEAN_REF_ROWS * innerH / EARTH_POLAR_OCEAN_REF_INNER_H));
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
  const total2 = steps * steps;
  for (let sy = 0; sy < steps; sy++) {
    for (let sx = 0; sx < steps; sx++) {
      const nq = t.nq - cellW * 0.5 + (sx + 0.5) / steps * cellW;
      const nr = t.nr - cellH * 0.5 + (sy + 0.5) / steps * cellH;
      if (sampleEarthTemplateLand(nq, nr)) landHits++;
    }
  }
  return landHits / total2 >= earthLandFractionThreshold(width, height) ? 1 : 0;
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
  const w2 = opts?.width ?? 120;
  const h2 = opts?.height ?? 80;
  const borderMargin = Math.max(
    mapBorderWidth(w2, h2) / Math.max(1, w2 - 1),
    mapBorderWidth(w2, h2) / Math.max(1, h2 - 1),
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
function landMaskPangea(q, r, width, height, perm, noiseScale, sparseLand = false) {
  const cx = (width - 1) / 2;
  const cy = (height - 1) / 2;
  const dx = (q - cx) / (cx + 0.5);
  const dy = (r - cy) / (cy + 0.5);
  const dist = Math.sqrt(dx * dx + dy * dy);
  const radialDiv = sparseLand ? 0.42 : 0.82;
  const radialPow = sparseLand ? 2.35 : 1.6;
  const radial = Math.max(0, 1 - Math.pow(dist / radialDiv, radialPow));
  const edgeRect = mapEdgeRectFade(q, r, width, height);
  const centerBias = sparseLand ? 1 : mapCenterRadialBias(q, r, width, height);
  const warp = fbm(perm, q * noiseScale * 0.6 + 200, r * noiseScale * 0.6 + 200, 3) * (sparseLand ? 0.18 : 0.3);
  const borderFade = landMaskBorderFade(q, r, width, height);
  return Math.min(1, Math.max(0, (radial + warp - (sparseLand ? 0.12 : 0.05)) * edgeRect * borderFade * centerBias));
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
  const map2 = /* @__PURE__ */ new Map();
  for (let r = 0; r < height; r++) {
    for (let q = 0; q < width; q++) {
      map2.set(hexKey(q, r), islandGridCellIndex(q, r, width, height));
    }
  }
  return map2;
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
  let h2 = a * 374761393 ^ b * 668265263 ^ c * 2246822519;
  h2 = Math.imul(h2 ^ h2 >>> 13, 1274126177);
  h2 = (h2 ^ h2 >>> 16) >>> 0;
  return h2 / 4294967296;
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
  for (const hex of Object.values(hexes)) {
    if (hex.nakladka === "las" /* Las */) hex.nakladka = "brak" /* Brak */;
  }
  let assigned = 0;
  const partitions = landPartitionKeysForDistribution(hexes, typ, continentOf, nContinents);
  for (const part of partitions) {
    const massSet = new Set(part.filter((k) => hexes[k]?.terenBazowy !== "morze" /* Morze */));
    for (const land of landHexesByCoverageCell(massSet, cellSize).values()) {
      if (land.length < minLand) continue;
      const eligible = land.filter(([q, r]) => {
        const h2 = hexes[hexKey(q, r)];
        if (!h2 || !isForestEligibleTerrain(h2.terenBazowy) || h2.nakladka !== "brak" /* Brak */) return false;
        if (mapHeight && climateBandAt(q, r, mapHeight) === "desert") return false;
        return true;
      }).map(([q, r]) => ({ k: hexKey(q, r), n: scratch.get(hexKey(q, r))?.forNoise ?? 0 })).sort((a, b) => b.n - a.n);
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
function mapCenterRadialBias(q, r, width, height) {
  const cx = (width - 1) / 2;
  const cy = (height - 1) / 2;
  const dx = (q - cx) / (cx + 0.5);
  const dy = (r - cy) / (cy + 0.5);
  const dist = Math.sqrt(dx * dx + dy * dy);
  return Math.max(0.12, 1 - Math.pow(dist / 0.94, 2));
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
  let total2 = mountains.length;
  let i = 0;
  while (total2 > maxMtn && total2 > minMtn && i < mountains.length) {
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
    total2--;
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
  let total2 = highlands.length;
  let i = 0;
  while (total2 > maxHi && total2 > minHi && i < highlands.length) {
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
    total2--;
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
  const eligibleCells = [...landHexesByCoverageCell(massSet, ironSize).values()].filter((land) => land.length >= minIronLand);
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
  const eligibleCells = [...landHexesByCoverageCell(massSet, copperSize).values()].filter((land) => land.length >= minCopperLand);
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
  for (let restore = 0; restore < 3; restore++) {
    let passFixed = 0;
    for (const mass of masses) {
      const massSet = new Set(mass);
      passFixed += ensureMassIronGridCoverage(hexes, scratch, tier, width, height, massSet, rand, true);
      passFixed += ensureMassCopperGridCoverage(hexes, scratch, tier, width, height, massSet, rand, true);
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
  const params2 = mapGenMountainRangeParams(tier);
  const mtnTh = mapGenMountainThreshold(tier);
  const hiTh = mapGenHighlandThreshold(tier);
  const masses = groupLandMassKeys(hexes).filter((m) => m.length >= params2.minMasaHexow).sort((a, b) => b.length - a.length || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  const addedByThisRun = [];
  for (const mass of masses) {
    const nRanges = Math.min(
      params2.maxPasmNaMase,
      Math.max(1, Math.round(mass.length / params2.hexyNaPasmo))
    );
    const seedCandidates = mountainRangeSeedCandidates(mass, hexes, scratch, width, height, rand);
    if (seedCandidates.length === 0) continue;
    const seeds = pickSpreadReliefKeys(seedCandidates, nRanges, 5);
    for (const seedKey of seeds) {
      const len = params2.dlugoscMin + Math.floor(rand() * (params2.dlugoscMax - params2.dlugoscMin + 1));
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
          if (rand() >= params2.obrzezeSzansa) continue;
          const n = scratch.get(nk)?.mtnNoise ?? 0;
          addedByThisRun.push({ k: nk, n, wasHighland: true, prev: nhex.terenBazowy });
          nhex.terenBazowy = "wzgorza" /* Wzgorza */;
          nhex.nakladka = "brak" /* Brak */;
          delete nhex.zloze;
        }
      }
    }
  }
  const { land } = countLandSeaHexes(hexes);
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
  const map2 = /* @__PURE__ */ new Map();
  for (let r = 0; r < height; r++) {
    for (let q = 0; q < width; q++) {
      const nq = q / Math.max(1, width - 1);
      const nr = r / Math.max(1, height - 1);
      map2.set(hexKey(q, r), nearestContinentZoneIndex(nq, nr, centers));
    }
  }
  return map2;
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
function countLandSeaHexes(hexes) {
  let land = 0;
  let sea = 0;
  for (const h2 of Object.values(hexes)) {
    if (h2.terenBazowy === "morze" /* Morze */ || h2.terenBazowy === "wybrzeze" /* Wybrzeze */) sea++;
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
  const h2 = hexes[hexKey(q, r)];
  if (!h2 || h2.terenBazowy === "morze" /* Morze */ || h2.terenBazowy === "wybrzeze" /* Wybrzeze */) return false;
  return countMorseNeighbors(hexes, q, r) > 0;
}
function isCoastalMorseHex(hexes, q, r) {
  const h2 = hexes[hexKey(q, r)];
  if (h2?.terenBazowy !== "morze" /* Morze */ && h2?.terenBazowy !== "wybrzeze" /* Wybrzeze */) return false;
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
  const h2 = hashInt3(q, r, seed);
  switch (band) {
    case "desert":
      return h2 < 0.5 ? "pustynia" /* Pustynia */ : "rownina" /* Rownina */;
    case "plains_north":
    case "plains_south":
      return h2 < 0.7 ? "rownina" /* Rownina */ : "laka" /* Laka */;
    case "temperate_north":
    case "temperate_south":
    default:
      return h2 < 0.85 ? "laka" /* Laka */ : "rownina" /* Rownina */;
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
function applyLandFractionByScore(hexes, landScores, targetLandFraction, width, height) {
  const clamped = Math.max(0.15, Math.min(0.85, targetLandFraction));
  const keys = Object.keys(hexes);
  const total2 = keys.length;
  const targetLand = Math.round(total2 * clamped);
  let { land } = countLandSeaHexes(hexes);
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
      if (land >= targetLand) break;
      setHexToLaka(hexes[k]);
      land++;
      adjusted++;
    }
    if (land < targetLand && hasBorder) {
      const interiorMorse = keys.filter((k) => hexes[k].terenBazowy === "morze" /* Morze */ && interiorOk(k)).sort((a, b) => (landScores.get(b) ?? 0) - (landScores.get(a) ?? 0));
      for (const k of interiorMorse) {
        if (land >= targetLand) break;
        setHexToLaka(hexes[k]);
        land++;
        adjusted++;
      }
    }
  } else if (land > targetLand) {
    const landCandidates = sortLandKeysForErosion(
      keys.filter((k) => hexes[k].terenBazowy !== "morze" /* Morze */),
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
  applyLandFractionByScore(hexes, landScores, targetLandFraction, width, height);
  applyMarginalLandZoneCaps(hexes, landScores, width, height);
  enforceMapBorderOcean(hexes, width, height);
  applyLandFractionByScore(hexes, landScores, targetLandFraction, width, height);
  applyMarginalLandZoneCaps(hexes, landScores, width, height);
  enforceMapBorderOcean(hexes, width, height);
  applyDoubleCoastRing(hexes);
}
function applyLandFractionByContinent(hexes, landScores, continentOf, nContinents, targetLandFraction, width, height) {
  const clamped = Math.max(0.15, Math.min(0.85, targetLandFraction));
  const total2 = Object.keys(hexes).length;
  const targetLand = Math.round(total2 * clamped);
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
    let land = keys.filter((k) => hexes[k].terenBazowy !== "morze" /* Morze */).length;
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
        keys.filter((k) => hexes[k].terenBazowy !== "morze" /* Morze */),
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
  const { land: finalLand } = countLandSeaHexes(hexes);
  if (finalLand !== targetLand && width != null && height != null) {
    adjusted += applyLandFractionByScore(hexes, landScores, targetLandFraction, width, height);
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
function findInlandWaterHexes(hexes, width, height) {
  const ocean = oceanConnectedWaterKeys(hexes, width, height);
  return Object.entries(hexes).filter(([k, h2]) => {
    const tb = h2.terenBazowy;
    return (tb === "morze" /* Morze */ || tb === "wybrzeze" /* Wybrzeze */) && !ocean.has(k);
  }).map(([k]) => k);
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
  let total2 = 0;
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
    total2 += n;
    if (n === 0) break;
  }
  return total2;
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
    const h2 = hexes[key];
    if (!h2 || !isLandOrCoast(h2.terenBazowy)) continue;
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
  let total2 = 0;
  for (let pass = 0; pass < 3; pass++) {
    total2 += removeTinyLandIslands(hexes, minHexes);
    const purged = purgeOpenOceanLandSpecks(hexes);
    total2 += purged;
    if (purged === 0 && pass > 0) break;
  }
  finalizeCoastAndInlandWater(hexes, width, height, coastPasses, coastOpts);
  enforceMapBorderOcean(hexes, width, height);
  return total2;
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
function riverPathRespectsSeaBuffer(hexes, path, seaDist, minInland = RIVER_MIN_INLAND_FROM_SEA, mouthTail = RIVER_MOUTH_TAIL_LEN) {
  if (path.length === 0) return false;
  const bodyEnd = Math.max(0, path.length - mouthTail);
  for (let i = 0; i < bodyEnd; i++) {
    const p = path[i];
    const h2 = hexes[hexKey(p.q, p.r)];
    if (!h2 || h2.terenBazowy === "morze" /* Morze */) return false;
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
function buildRiverFieldCache(hexes, width, height) {
  const oceanConnected = oceanConnectedWaterKeys(hexes, width, height);
  return {
    seaDist: buildSeaDistanceField(hexes),
    oceanConnected,
    openOceanDist: buildOpenOceanDistanceField(hexes, width, height, oceanConnected)
  };
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
function growRiverInlandBeforeDrainage(hexes, sq, sr, seaDist, openOceanDist, rand, inlandTargetLen, stepCap, hardMeanderLen = RIVER_HARD_MEANDER_LEN, allowReliefTraversal = false, relaxSeaBuffer = false) {
  const srcKey = hexKey(sq, sr);
  const path = [{ q: sq, r: sr }];
  const visited = /* @__PURE__ */ new Set([srcKey]);
  while (path.length < inlandTargetLen && path.length < stepCap) {
    const cur = path[path.length - 1];
    const curKey = hexKey(cur.q, cur.r);
    const curD = seaDist.get(curKey) ?? 0;
    const curOd = openOceanDist.get(curKey) ?? Infinity;
    const hardMeander = path.length < hardMeanderLen;
    const candidates = [];
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nq = cur.q + dq;
      const nr = cur.r + dr;
      const nk = hexKey(nq, nr);
      if (visited.has(nk)) continue;
      if (!canRiverFlowThrough(hexes[nk], nk, srcKey, true, void 0, allowReliefTraversal)) continue;
      const nd = seaDist.get(nk) ?? 0;
      if (!relaxSeaBuffer && nd < RIVER_MIN_INLAND_FROM_SEA) continue;
      const od = openOceanDist.get(nk) ?? Infinity;
      if (hardMeander && od < curOd) continue;
      let score = 1200 - od * 30;
      if (od > curOd + 0.5) score -= 18;
      if (nd > curD + 1) score -= 10;
      if (nd === RIVER_MIN_INLAND_FROM_SEA && od < curOd) score += 8;
      score += rand() * 0.35;
      candidates.push({ q: nq, r: nr, score });
    }
    if (candidates.length === 0) break;
    candidates.sort((a, b) => b.score - a.score);
    const pickIdx = Math.min(candidates.length - 1, Math.floor(rand() * Math.min(3, candidates.length)));
    const pick = candidates[pickIdx] ?? candidates[0];
    path.push({ q: pick.q, r: pick.r });
    visited.add(hexKey(pick.q, pick.r));
  }
  return path;
}
function growRiverFromCoastInland(hexes, mq, mr, seaDist, openOceanDist, rand, inlandTargetLen, stepCap, hardMeanderLen = RIVER_HARD_MEANDER_LEN, allowReliefTraversal = false) {
  const mouthKey = hexKey(mq, mr);
  const path = [{ q: mq, r: mr }];
  const visited = /* @__PURE__ */ new Set([mouthKey]);
  while (path.length < inlandTargetLen && path.length < stepCap) {
    const cur = path[path.length - 1];
    const curKey = hexKey(cur.q, cur.r);
    const curD = seaDist.get(curKey) ?? 0;
    const hardMeander = path.length < hardMeanderLen;
    const candidates = [];
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nq = cur.q + dq;
      const nr = cur.r + dr;
      const nk = hexKey(nq, nr);
      if (visited.has(nk)) continue;
      if (!canRiverFlowThrough(hexes[nk], nk, mouthKey, true, void 0, allowReliefTraversal)) continue;
      const nd = seaDist.get(nk) ?? 0;
      if (hardMeander && nd < curD) continue;
      let score = nd * 35;
      if (nd > curD) score += 22;
      score += rand() * 0.4;
      candidates.push({ q: nq, r: nr, score });
    }
    if (candidates.length === 0) break;
    candidates.sort((a, b) => b.score - a.score);
    const pickIdx = Math.min(candidates.length - 1, Math.floor(rand() * Math.min(3, candidates.length)));
    const pick = candidates[pickIdx] ?? candidates[0];
    path.push({ q: pick.q, r: pick.r });
    visited.add(hexKey(pick.q, pick.r));
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
  const inlandTarget = traceOpts.minLen ?? 4;
  const hardMeanderLen = traceOpts.hardMeanderLen ?? RIVER_HARD_MEANDER_LEN;
  const allowReliefTraversal = traceOpts.allowReliefTraversal ?? false;
  const stepCap = Math.max(inlandTarget + 8, Math.min(maxLen, inlandTarget + 24));
  const mouthToInland = growRiverFromCoastInland(
    hexes,
    mq,
    mr,
    seaDist,
    openOceanDist,
    rand,
    inlandTarget,
    stepCap,
    hardMeanderLen,
    allowReliefTraversal
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
    const pick = candidates[0];
    path.push({ q: pick.q, r: pick.r });
    visited.add(hexKey(pick.q, pick.r));
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
  const startK = hexKey(sq, sr);
  const h0 = openOceanDist.get(startK) ?? seaDist.get(startK);
  if (h0 == null) return [];
  if (oceanConnected.has(startK)) return [{ q: sq, r: sr }];
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
      return reconstructRiverPath(cameFrom, current);
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
      return reconstructRiverPath(cameFrom, bestK);
    }
  }
  return [{ q: sq, r: sr }];
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
  const seaDist = traceOpts.seaDist ?? buildSeaDistanceField(hexes);
  const dims = traceOpts.mapWidth != null && traceOpts.mapHeight != null ? { width: traceOpts.mapWidth, height: traceOpts.mapHeight } : inferMapDimsFromHexes(hexes);
  const openOceanDist = traceOpts.openOceanDist ?? buildOpenOceanDistanceField(hexes, dims.width, dims.height, traceOpts.oceanConnected);
  const oceanConnected = traceOpts.oceanConnected ?? oceanConnectedWaterKeys(hexes, dims.width, dims.height);
  const rand = traceOpts.rand ?? (() => 0);
  const srcKey = hexKey(sq, sr);
  const startDist = seaDist.get(srcKey);
  if (startDist == null || !Number.isFinite(startDist)) return [];
  const inlandTarget = traceOpts.minLen ?? 4;
  const mouthTailLen = traceOpts.mouthTailLen ?? RIVER_MOUTH_TAIL_LEN;
  const hardMeanderLen = traceOpts.hardMeanderLen ?? RIVER_HARD_MEANDER_LEN;
  const allowReliefTraversal = traceOpts.allowReliefTraversal ?? false;
  const relaxSeaBuffer = traceOpts.relaxSeaBuffer ?? false;
  const stepCap = Math.max(
    inlandTarget + mouthTailLen + 12,
    Math.min(maxLen, Math.ceil(startDist * 2.5) + inlandTarget + 10)
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
    relaxSeaBuffer
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
  if (!relaxSeaBuffer) {
    if (!riverPathRespectsSeaBuffer(hexes, path, seaDist) || !pathEndsAtSea(hexes, path, dims.width, dims.height, oceanConnected)) {
      return [];
    }
  } else if (!pathEndsAtSea(hexes, path, dims.width, dims.height, oceanConnected)) {
    return [];
  }
  return path;
}
function traceRiverForGridFill(hexes, sq, sr, maxLen, catalogMinLen, acceptLen, traceOpts, relaxSeaBuffer = false) {
  const tries = [catalogMinLen, Math.max(acceptLen, Math.floor(catalogMinLen * 0.6)), acceptLen, 3];
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
  return t === "laka" /* Laka */ || t === "rownina" /* Rownina */ || t === "wzgorza" /* Wzgorza */ || t === "gory" /* Gory */ || t === "pustynia" /* Pustynia */;
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
function markRiverEdge(hexes, q, r, edgeIdx) {
  if (edgeIdx < 0) return;
  const hex = hexes[hexKey(q, r)];
  if (!hex || hex.terenBazowy === "morze" /* Morze */) return;
  if (!isRiverLandTerrain(hex.terenBazowy) && hex.terenBazowy !== "wybrzeze" /* Wybrzeze */) return;
  const edges = hex.rzeka?.krawedzie ?? [];
  if (!edges.includes(edgeIdx)) edges.push(edgeIdx);
  hex.rzeka = { obecna: edges.length > 0, krawedzie: edges };
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
    const eB = neighborDirIndex(b.q, b.r, a.q, a.r);
    markRiverEdge(hexes, a.q, a.r, eA);
    markRiverEdge(hexes, b.q, b.r, eB);
  }
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
  const eligible = (h2) => h2.terenBazowy !== "morze" /* Morze */ && (isRiverLandTerrain(h2.terenBazowy) || h2.terenBazowy === "wybrzeze" /* Wybrzeze */);
  if (eA >= 0 && eligible(ha)) out.push({ key: hexKey(a.q, a.r), edge: eA });
  if (eB >= 0 && eligible(hb)) out.push({ key: hexKey(b.q, b.r), edge: eB });
  return out;
}
function trimRiverPathRings(hexes, path) {
  if (path.length < 3) return path;
  const priorCount = /* @__PURE__ */ new Map();
  const laid = /* @__PURE__ */ new Map();
  const totalOnHex = (key) => (priorCount.get(key) ?? (() => {
    const h2 = hexes[key];
    const c = h2?.rzeka?.krawedzie?.length ?? 0;
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
  const trimmed = trimRiverPathRings(hexes, cleaned);
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
    const h2 = hexes[hexKey(q, r)];
    if (h2?.rzeka?.obecna) return true;
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
  for (const [k, h2] of Object.entries(hexes)) {
    if (h2.rzeka?.obecna) keys.add(k);
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
    const h2 = hexes[k];
    if (!h2?.rzeka?.krawedzie?.length) continue;
    for (const edgeIdx of h2.rzeka.krawedzie) {
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
        const h2 = hexes[hexKey(c.q, c.r)];
        if (h2?.terenBazowy === "morze" /* Morze */) return true;
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
  return result;
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
function collectRiverPathHexKeys(paths) {
  const keys = /* @__PURE__ */ new Set();
  for (const path of paths) {
    for (const p of path ?? []) keys.add(hexKey(p.q, p.r));
  }
  return keys;
}
function rankNetworkJunctionCandidates(sq, sr, junctionKeys, seaDist, maxLen, rand) {
  const out = [];
  const maxD = maxLen + 6;
  for (let dist = 3; dist <= maxD && out.length < 16; dist++) {
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
  return out.slice(0, 16);
}
function nearestRiverHexDistance(sq, sr, riverKeys) {
  let best = Infinity;
  for (const k of riverKeys) {
    const { q, r } = parseHexKey(k);
    best = Math.min(best, hexAxialDistance(sq, sr, q, r));
  }
  return best;
}
function isPathTooCloseToRiverHexes(path, riverKeys, minSep) {
  if (riverKeys.size === 0 || minSep <= 0) return false;
  for (const p of path) {
    if (nearestRiverHexDistance(p.q, p.r, riverKeys) < minSep) return true;
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
  const traceMax = riverTraceBudgetForSeaDist(startSeaDist, minLen, maxLen);
  const out = [];
  const mode = ctx.placeMode ?? "auto";
  if (mode !== "short") {
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
      ctx.relaxSeaBuffer
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
  const riverKeys = new Set(
    [...collectRiverPathHexKeys(riverPaths)].filter((k) => !massSet || massSet.has(k))
  );
  const tribTargetKinds = ctx.targetRiverKinds ?? (mode === "short" ? ["medium"] : void 0);
  const tribRiverKeys = tribTargetKinds ? collectPathHexKeysForKinds(riverPaths, ctx.riverKinds, tribTargetKinds) : riverKeys;
  const tribKeysForTrace = tribRiverKeys.size > 0 ? tribRiverKeys : riverKeys;
  if (mode !== "main-only" && tribKeysForTrace.size > 0) {
    let bestTrib = [];
    for (const j of rankNetworkJunctionCandidates(sq, sr, tribKeysForTrace, seaDist, traceMax, rand)) {
      const p = traceTributary(hexes, sq, sr, j.q, j.r, traceMax, seaDist, rand, minLen);
      if (p.length >= acceptLen && p.length > bestTrib.length) bestTrib = p;
    }
    if (bestTrib.length >= acceptLen) {
      out.push({ path: bestTrib, kind: "tributary", len: bestTrib.length });
    }
  }
  return out;
}
function pickPhase2Route(candidates) {
  const tribs = candidates.filter((c) => c.kind === "tributary");
  const seas = candidates.filter((c) => c.kind === "main");
  const pool = tribs.length > 0 ? tribs : seas;
  if (pool.length === 0) return null;
  return pool.reduce((a, b) => a.len >= b.len ? a : b);
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
function collectCoastMouthCandidates(cells, hexes, seaDist, maxSeaDist = 2) {
  const out = [];
  for (const [q, r] of cells) {
    const h2 = hexes[hexKey(q, r)];
    if (!h2 || !isRiverLandTerrain(h2.terenBazowy)) continue;
    const d = seaDist.get(hexKey(q, r)) ?? 999;
    if (d < 1 || d > maxSeaDist) continue;
    out.push({ q, r, d });
  }
  return out;
}
function tryPlaceMainRiverFromCoast(ctx, land, massSet, acceptLen) {
  const mainKeys = collectPathHexKeysForKinds(ctx.riverPaths, ctx.riverKinds, ["main"]);
  const mouths = collectCoastMouthCandidates(land, ctx.hexes, ctx.seaDist, 2);
  for (const [q, r] of expandRiverSourceCandidates(land, massSet, 2)) {
    const h2 = ctx.hexes[hexKey(q, r)];
    if (!h2 || !isRiverLandTerrain(h2.terenBazowy)) continue;
    const d = ctx.seaDist.get(hexKey(q, r)) ?? 999;
    if (d >= 1 && d <= 2) mouths.push({ q, r, d });
  }
  mouths.sort((a, b) => a.d - b.d || ctx.rand() * 2 - 1);
  const seen = /* @__PURE__ */ new Set();
  for (const mouth of mouths) {
    const mk = hexKey(mouth.q, mouth.r);
    if (seen.has(mk)) continue;
    seen.add(mk);
    const traceMax = riverTraceBudgetForSeaDist(mouth.d, ctx.minLen, ctx.maxLen);
    const path = traceRiverFromCoast(
      ctx.hexes,
      mouth.q,
      mouth.r,
      traceMax,
      {
        seaDist: ctx.seaDist,
        openOceanDist: ctx.openOceanDist,
        oceanConnected: ctx.oceanConnected,
        mapWidth: ctx.width,
        mapHeight: ctx.height,
        rand: ctx.rand,
        minLen: acceptLen,
        ...ctx.traceOptsBase,
        allowReliefTraversal: ctx.allowReliefTraversal
      }
    );
    if (path.length < acceptLen) continue;
    if (isPathTooCloseToRiverHexes(path, mainKeys, MAIN_RIVER_MIN_PATH_SEP)) continue;
    const sq = path[0].q;
    const sr = path[0].r;
    if (ctx.pushMain(path, sq, sr)) return true;
  }
  return false;
}
function tryPlaceGridSource(ctx, sq, sr, massSet) {
  const srcKey = hexKey(sq, sr);
  if (ctx.usedSources.has(srcKey)) return false;
  if (isTooCloseToRiverSource(sq, sr, ctx.usedSources, ctx.sourceSep)) return false;
  const h2 = ctx.hexes[srcKey];
  if (!h2 || !isRiverLandTerrain(h2.terenBazowy)) return false;
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
function riverTraceBudgetForSeaDist(startSeaDist, minLen, maxLen) {
  return Math.max(maxLen, minLen + 24, Math.ceil(startSeaDist * 3) + minLen);
}
var SINGLE_LARGE_MASS_HEX_THRESHOLD = 1e4;
function isSingleLargeLandmass(masses) {
  if (masses.length === 1) return true;
  const largest = masses[0]?.length ?? 0;
  return largest >= SINGLE_LARGE_MASS_HEX_THRESHOLD;
}
function massRiverCoveragePasses(massSize, singleLargeMass = false) {
  const base = Math.max(6, Math.min(24, 6 + Math.floor(Math.sqrt(massSize / 300))));
  if (!singleLargeMass) return base;
  return Math.max(6, Math.min(14, 6 + Math.floor(Math.sqrt(massSize / 550))));
}
function riverProximityMaxRounds(massSize, singleLargeMass = false) {
  const base = Math.max(16, Math.min(48, 12 + Math.floor(massSize / 350)));
  if (!singleLargeMass) return base;
  return Math.max(10, Math.min(24, 8 + Math.floor(massSize / 700)));
}
function effectiveTopUpPasses(basePasses, singleLargeMass) {
  if (!singleLargeMass) return basePasses;
  return Math.max(4, Math.ceil(basePasses * 0.65));
}
function cellEligibleForRiverPlacement(land, seaDist, minInland = 2) {
  return land.some(([q, r]) => (seaDist.get(hexKey(q, r)) ?? 0) >= minInland);
}
function isRiverProximityWalkTerrain(t) {
  return isRiverLandTerrain(t) || t === "wybrzeze" /* Wybrzeze */;
}
function maxLandHexDistanceToRiver(massLandKeys, hexes, allowReliefTraversal = true) {
  const massSet = massLandKeys instanceof Set ? massLandKeys : new Set(massLandKeys);
  const riverKeys = /* @__PURE__ */ new Set();
  for (const k of massSet) {
    if (hexes[k]?.rzeka?.obecna) riverKeys.add(k);
  }
  if (riverKeys.size === 0) return 999;
  let maxD = 0;
  for (const k of massSet) {
    const h2 = hexes[k];
    if (!h2 || !isRiverProximityWalkTerrain(h2.terenBazowy)) continue;
    if (isReliefTerrain(h2.terenBazowy)) continue;
    const { q, r } = parseHexKey(k);
    const queue = [[q, r, 0]];
    const visited = /* @__PURE__ */ new Set([k]);
    let best = 999;
    while (queue.length > 0) {
      const [cq, cr, cd] = queue.shift();
      const ck = hexKey(cq, cr);
      if (riverKeys.has(ck) && cd > 0) {
        best = cd;
        break;
      }
      if (cd >= 48) continue;
      for (const [dq, dr] of HEX_DIRECTIONS) {
        const nq = cq + dq;
        const nr = cr + dr;
        const nk = hexKey(nq, nr);
        if (visited.has(nk) || !massSet.has(nk)) continue;
        const nh = hexes[nk];
        if (!nh || !isRiverProximityWalkTerrain(nh.terenBazowy)) continue;
        if (!allowReliefTraversal && isReliefTerrain(nh.terenBazowy)) continue;
        visited.add(nk);
        queue.push([nq, nr, cd + 1]);
      }
    }
    if (best > maxD) maxD = best;
  }
  return maxD;
}
function findFarthestLandFromRiver(massSet, hexes) {
  const riverKeys = /* @__PURE__ */ new Set();
  for (const k of massSet) {
    if (hexes[k]?.rzeka?.obecna) riverKeys.add(k);
  }
  if (riverKeys.size === 0) return null;
  let best = null;
  for (const k of massSet) {
    const h2 = hexes[k];
    if (!h2 || !isRiverProximityWalkTerrain(h2.terenBazowy)) continue;
    if (isReliefTerrain(h2.terenBazowy)) continue;
    const { q, r } = parseHexKey(k);
    const queue = [[q, r, 0]];
    const visited = /* @__PURE__ */ new Set([k]);
    let dist = 999;
    while (queue.length > 0) {
      const [cq, cr, cd] = queue.shift();
      const ck = hexKey(cq, cr);
      if (riverKeys.has(ck) && cd > 0) {
        dist = cd;
        break;
      }
      if (cd >= 64) continue;
      for (const [dq, dr] of HEX_DIRECTIONS) {
        const nq = cq + dq;
        const nr = cr + dr;
        const nk = hexKey(nq, nr);
        if (visited.has(nk) || !massSet.has(nk)) continue;
        const nh = hexes[nk];
        if (!nh || !isRiverProximityWalkTerrain(nh.terenBazowy)) continue;
        visited.add(nk);
        queue.push([nq, nr, cd + 1]);
      }
    }
    if (!best || dist > best.dist) best = { q, r, dist };
  }
  return best;
}
function trySubdivideDryPatch(ctx, component, massSet) {
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
  const riverKeys = new Set(
    [...collectRiverPathHexKeys(ctx.riverPaths)].filter((k) => massSet.has(k))
  );
  if (riverKeys.size === 0) return false;
  const lowland = land.filter(([q, r]) => {
    const k = hexKey(q, r);
    if (ctx.usedSources.has(k)) return false;
    const h2 = ctx.hexes[k];
    return h2 && isDryLandWithoutRiver(h2);
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
  const traceMax = riverTraceBudgetForSeaDist(startSeaDist, ctx.minLen, ctx.maxLen);
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
    const h2 = ctx.hexes[k];
    if (h2 && isReliefRiverSource(h2.terenBazowy) && !ctx.usedSources.has(k)) {
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
    const traceMax = riverTraceBudgetForSeaDist(startSeaDist, ctx.minLen, ctx.maxLen);
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
  for (const c of candidates.slice(0, 40)) {
    if (tryPlaceGridSource(forceCtx, c.q, c.r, massSet)) return true;
    const startSeaDist = ctx.seaDist.get(hexKey(c.q, c.r)) ?? 0;
    const traceMax = riverTraceBudgetForSeaDist(
      startSeaDist,
      ctx.minLen,
      ctx.maxLen
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
function enforceMaxDryLowlandPatches(massSet, gridCtx) {
  const maxHex = MAX_DRY_LOWLAND_PATCH_HEXES;
  fillDryLowlandPatches(massSet, gridCtx, 4, 10);
  if (maxDryLowlandPatchSize(massSet, gridCtx.hexes) <= maxHex) return;
  for (let round = 0; round < 20; round++) {
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
function enforceHardRiverGridStarts(hexes, massSet, cellSize, seaDist, riverPaths, gridCtx, maxLen, reliefSourceBonus, expandSourceRadius, minInlandFromSea, baseSourceSep, acceptLen) {
  const minLand = minLandHexesForRiverCell(cellSize);
  let placed = 0;
  const cellAvgSeaDist = (cells) => {
    let s = 0;
    for (const [q, r] of cells) s += seaDist.get(hexKey(q, r)) ?? 0;
    return cells.length > 0 ? s / cells.length : 0;
  };
  const listEligibleCells = (preferInland) => [...landHexesByCoverageCell(massSet, cellSize).values()].filter((land) => land.length >= minLand).filter((land) => cellEligibleForRiverPlacement(land, seaDist, 2)).filter((land) => !cellHasRiverHex(land, hexes)).sort((a, b) => {
    const da = cellAvgSeaDist(a);
    const db = cellAvgSeaDist(b);
    return preferInland ? db - da : da - db;
  });
  const retryPasses = [
    { acceptLen, sourceSep: baseSourceSep, expand: expandSourceRadius, minInland: minInlandFromSea },
    { acceptLen: Math.max(3, acceptLen - 1), sourceSep: Math.max(2, baseSourceSep - 2), expand: expandSourceRadius + 1, minInland: Math.max(1, minInlandFromSea - 1) },
    { acceptLen: 3, sourceSep: 2, expand: expandSourceRadius + 2, minInland: 1 },
    { acceptLen: 3, sourceSep: 1, expand: expandSourceRadius + 3, minInland: 1 },
    { acceptLen: 3, sourceSep: 0, expand: expandSourceRadius + 4, minInland: 1 }
  ];
  const massHasRiver = () => {
    for (const path of riverPaths) {
      for (const p of path ?? []) {
        if (massSet.has(hexKey(p.q, p.r))) return true;
      }
    }
    return false;
  };
  if (!massHasRiver()) {
    const bootstrapLand = listEligibleCells(false)[0];
    if (bootstrapLand) {
      if (tryPlaceMainRiverFromCoast(gridCtx, bootstrapLand, massSet, 3)) {
        placed++;
      } else {
        const ranked = bootstrapLand.map(([q, r]) => ({ q, r, d: seaDist.get(hexKey(q, r)) ?? 0 })).filter((c) => c.d >= 1).sort((a, b) => a.d - b.d);
        for (const c of ranked.slice(0, 24)) {
          const localCtx = { ...gridCtx, acceptLen: 3, sourceSep: 0 };
          if (gridCtx.placeMode === "medium" || gridCtx.placeMode === "short") {
            if (tryPlaceGridSource(localCtx, c.q, c.r, massSet)) {
              placed++;
              break;
            }
            continue;
          }
          const traceMax = riverTraceBudgetForSeaDist(c.d, gridCtx.minLen, gridCtx.maxLen);
          const seaPath = traceRiverFromCoast(
            gridCtx.hexes,
            c.q,
            c.r,
            traceMax,
            {
              seaDist: gridCtx.seaDist,
              openOceanDist: gridCtx.openOceanDist,
              oceanConnected: gridCtx.oceanConnected,
              mapWidth: gridCtx.width,
              mapHeight: gridCtx.height,
              rand: gridCtx.rand,
              minLen: 3,
              ...gridCtx.traceOptsBase
            }
          );
          if (seaPath.length >= 3 && gridCtx.pushMain(seaPath, seaPath[0].q, seaPath[0].r)) {
            placed++;
            break;
          }
        }
      }
    }
  }
  for (const pass of retryPasses) {
    const unfilled = listEligibleCells(true);
    if (unfilled.length === 0) break;
    for (const land of unfilled) {
      if (cellHasRiverHex(land, hexes)) continue;
      const rankCandidates = (cells) => cells.filter(([q, r]) => !gridCtx.usedSources.has(hexKey(q, r))).map(([q, r]) => {
        const h2 = hexes[hexKey(q, r)];
        const d = seaDist.get(hexKey(q, r)) ?? 0;
        let score = d + gridCtx.rand() * 4;
        if (reliefSourceBonus > 0 && h2 && isReliefRiverSource(h2.terenBazowy)) score += reliefSourceBonus;
        else if (h2 && isRiverLandTerrain(h2.terenBazowy)) score += 12;
        return { q, r, d, score };
      }).filter((c) => c.d >= pass.minInland && isRiverLandTerrain(hexes[hexKey(c.q, c.r)]?.terenBazowy ?? "morze" /* Morze */)).sort((a, b) => b.score - a.score);
      const tryAt = (q, r) => {
        const localCtx = {
          ...gridCtx,
          acceptLen: pass.acceptLen,
          sourceSep: pass.sourceSep,
          relaxSeaBuffer: pass.acceptLen <= 3
        };
        return tryPlaceGridSource(localCtx, q, r, massSet);
      };
      let ok = false;
      for (const c of rankCandidates(land)) {
        if (tryAt(c.q, c.r)) {
          placed++;
          ok = true;
          break;
        }
      }
      if (ok || cellHasRiverHex(land, hexes)) continue;
      for (const [q, r] of expandRiverSourceCandidates(land, massSet, pass.expand)) {
        if (tryAt(q, r)) {
          placed++;
          break;
        }
      }
      if (cellHasRiverHex(land, hexes)) continue;
      for (const [q, r] of land) {
        if (tryAt(q, r)) {
          placed++;
          break;
        }
      }
    }
  }
  for (const land of listEligibleCells(true)) {
    if (cellHasRiverHex(land, hexes)) continue;
    for (const [q, r] of land) {
      const forceCtx = {
        ...gridCtx,
        acceptLen: 3,
        sourceSep: 0,
        relaxSeaBuffer: true
      };
      if (tryPlaceGridSource(forceCtx, q, r, massSet)) {
        placed++;
        break;
      }
    }
  }
  for (const land of listEligibleCells(true)) {
    if (cellHasRiverHex(land, hexes)) continue;
    if (tryForceCellRiverConnection(gridCtx, land, massSet)) placed++;
  }
  return placed;
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
function ensureRiverGridAndProximity(hexes, massSet, cellSize, seaDist, gridCtx, maxProximityDist = RIVER_PROXIMITY_MAX_DIST, singleLargeMass = false) {
  const maxRounds = riverProximityMaxRounds(massSet.size, singleLargeMass);
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
    const proxGapEarly = maxLandHexDistanceToRiver(massSet, hexes, true);
    const dryGapEarly = maxDryLowlandPatchSize(massSet, hexes);
    const unfilledEarly = listUnfilledRiverGridCells(massSet, hexes, cellSize, seaDist);
    if (proxGapEarly <= maxProximityDist && dryGapEarly <= MAX_DRY_LOWLAND_PATCH_HEXES && unfilledEarly.length === 0) break;
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
    const proxGap = maxLandHexDistanceToRiver(massSet, hexes, true);
    if (roundPlaced === 0 && proxGap > maxProximityDist) {
      const far = findFarthestLandFromRiver(massSet, hexes);
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
      enforceMaxDryLowlandPatches(massSet, forceCtx);
    }
    placed += roundPlaced;
    const dryGap = maxDryLowlandPatchSize(massSet, hexes);
    if (roundPlaced === 0 && unfilled.length === 0 && proxGap <= maxProximityDist && dryGap <= MAX_DRY_LOWLAND_PATCH_HEXES) break;
  }
  return placed;
}
function generatePhase1MainRivers(hexes, massSet, seaDist, riverPaths, riverKinds, usedSources, gridCtx, maxLen, riverParams) {
  const ctx = { ...gridCtx, placeMode: "main-only" };
  const tryMain = (sq, sr) => tryPlaceGridSource(ctx, sq, sr, massSet);
  let placed = ensureMassRiverGridCoverage(
    hexes,
    massSet,
    riverParams.mainCell,
    seaDist,
    riverPaths,
    riverKinds,
    usedSources,
    tryMain,
    gridCtx.rand,
    maxLen,
    {
      sparseMainOnly: true,
      gridStride: riverParams.mainGridStride,
      reliefSourceBonus: 0,
      expandSourceRadius: riverParams.expandSourceRadius,
      minInlandFromSea: 1,
      gridCtx: ctx,
      acceptLen: gridCtx.acceptLen
    }
  );
  if (!landMassHasMainRiver([...massSet], riverPaths, riverKinds)) {
    const minLand = minLandHexesForRiverCell(riverParams.mainCell);
    for (const land of landHexesByCoverageCell(massSet, riverParams.mainCell).values()) {
      if (land.length < minLand) continue;
      if (tryPlaceMainRiverFromCoast(ctx, land, massSet, 3)) {
        placed++;
        break;
      }
      const ranked = land.map(([q, r]) => ({ q, r, d: seaDist.get(hexKey(q, r)) ?? 0 })).filter((c) => c.d >= 1).sort((a, b) => a.d - b.d);
      for (const c of ranked.slice(0, 20)) {
        if (tryMain(c.q, c.r)) {
          placed++;
          break;
        }
      }
      if (landMassHasMainRiver([...massSet], riverPaths, riverKinds)) break;
    }
  }
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
  for (const land of cellList) {
    if (cellSatisfied(land)) continue;
    if (opts.sparseMainOnly && opts.gridCtx) {
      const acceptLen = opts.acceptLen ?? opts.gridCtx.acceptLen;
      if (tryPlaceMainRiverFromCoast(opts.gridCtx, land, massSet, acceptLen)) {
        placed++;
        continue;
      }
    }
    const ranked = land.filter(([q, r]) => !usedSources.has(hexKey(q, r))).map(([q, r]) => {
      const h2 = hexes[hexKey(q, r)];
      const d = seaDist.get(hexKey(q, r)) ?? 0;
      let score = d + rand() * 4;
      if (reliefBonus > 0 && h2 && isReliefRiverSource(h2.terenBazowy)) score += reliefBonus;
      else if (h2 && isRiverLandTerrain(h2.terenBazowy)) score += 12;
      return { q, r, d, score };
    }).filter((c) => c.d >= minInlandFromSea).sort((a, b) => b.score - a.score);
    let ok = false;
    for (const c of ranked) {
      if (tryPlace(c.q, c.r)) {
        placed++;
        ok = true;
        break;
      }
    }
    if (ok || cellSatisfied(land)) continue;
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
  const riversTier = opts.riversTier ?? "medium";
  const riverParams = opts.riverParams ?? resolveRiverMapParams(riversTier, width, height);
  const minLen = opts.minLen ?? riverParams.minLen;
  const maxLen = opts.maxLen ?? riverParams.maxLen;
  const { seaDist, oceanConnected, openOceanDist } = buildRiverFieldCache(hexes, width, height);
  const riverPaths = [];
  const riverKinds = [];
  const usedSources = /* @__PURE__ */ new Set();
  const masses = groupLandMassKeys(hexes).filter((m) => m.length >= 8).sort((a, b) => b.length - a.length);
  const singleLargeMass = isSingleLargeLandmass(masses);
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
  const pushMain = (path, sq, sr) => {
    const mainKeys = collectPathHexKeysForKinds(riverPaths, riverKinds, ["main"]);
    if (isPathTooCloseToRiverHexes(path, mainKeys, MAIN_RIVER_MIN_PATH_SEP)) return false;
    const finalized = finalizeMainRiverPath(hexes, path, width, height, oceanConnected);
    if (!finalized) return false;
    riverPaths.push(finalized);
    riverKinds.push("main");
    usedSources.add(hexKey(sq, sr));
    markRiverPath(hexes, finalized);
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
    pushShort
  };
  const report = (localPct) => {
    opts.onProgress?.(Math.max(0, Math.min(100, localPct)));
  };
  const nMasses = masses.length || 1;
  let stage2Steps = 0;
  let stage2Total = 0;
  for (const mass of masses) {
    stage2Total += massRiverCoveragePasses(mass.length, singleLargeMass);
  }
  stage2Total = Math.max(1, stage2Total);
  for (let mi = 0; mi < masses.length; mi++) {
    const mass = masses[mi];
    generatePhase1MainRivers(
      hexes,
      new Set(mass),
      seaDist,
      riverPaths,
      riverKinds,
      usedSources,
      gridCtx,
      maxLen,
      riverParams
    );
    report((mi + 1) / nMasses * 28);
  }
  const mediumCtx = { ...gridCtx, placeMode: "medium" };
  for (const mass of masses) {
    const passes = massRiverCoveragePasses(mass.length, singleLargeMass);
    for (let round = 0; round < passes; round++) {
      enforceHardRiverGridStarts(
        hexes,
        new Set(mass),
        cellSize,
        seaDist,
        riverPaths,
        mediumCtx,
        maxLen,
        riverParams.reliefSourceBonus,
        riverParams.expandSourceRadius,
        riverParams.minInlandFromSea,
        minSourceSep,
        gridTraceMinLen
      );
      stage2Steps++;
      report(28 + stage2Steps / stage2Total * 42);
    }
  }
  for (let mi = 0; mi < masses.length; mi++) {
    const mass = masses[mi];
    generatePhase3ShortRivers(
      new Set(mass),
      tributaryCell,
      seaDist,
      gridCtx,
      feederMinLen,
      feederMinSourceSep,
      riverParams.feederPasses
    );
    report(70 + (mi + 1) / nMasses * 18);
  }
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
  for (let mi = 0; mi < masses.length; mi++) {
    const mass = masses[mi];
    enforceMaxDryLowlandPatches(new Set(mass), gridCtx);
    report(96 + (mi + 1) / nMasses * 4);
  }
  report(100);
  return { paths: riverPaths, kinds: riverKinds };
}
function topUpRiverGridCoverage(hexes, width, height, riverPaths, riverKinds, rand, riversTier = "medium", minLen = 4, maxLen = 40, riverParams, onProgress) {
  const params2 = riverParams ?? resolveRiverMapParams(riversTier, width, height);
  const { seaDist, oceanConnected, openOceanDist } = buildRiverFieldCache(hexes, width, height);
  const usedSources = /* @__PURE__ */ new Set();
  for (let i = 0; i < riverPaths.length; i++) {
    const p0 = riverPaths[i]?.[0];
    if (p0) usedSources.add(hexKey(p0.q, p0.r));
  }
  const masses = groupLandMassKeys(hexes).filter((m) => m.length >= 8).sort((a, b) => b.length - a.length);
  const singleLargeMass = isSingleLargeLandmass(masses);
  const topUpPasses = effectiveTopUpPasses(params2.topUpPasses, singleLargeMass);
  const cellSize = params2.mainCell;
  const minSourceSep = Math.max(2, Math.floor(cellSize * 0.25));
  const traceOptsBase = {
    hardMeanderLen: params2.hardMeanderLen,
    mouthTailLen: params2.mouthTailLen
  };
  const seaBufferOpts = {
    minInland: params2.minInlandFromSea,
    mouthTail: params2.mouthTailLen
  };
  const pushMain = (path, sq, sr) => {
    const mainKeys = collectPathHexKeysForKinds(riverPaths, riverKinds, ["main"]);
    if (isPathTooCloseToRiverHexes(path, mainKeys, MAIN_RIVER_MIN_PATH_SEP)) return false;
    const finalized = finalizeMainRiverPath(hexes, path, width, height, oceanConnected);
    if (!finalized) return false;
    riverPaths.push(finalized);
    riverKinds.push("main");
    usedSources.add(hexKey(sq, sr));
    markRiverPath(hexes, finalized);
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
    minLen: params2.minLen,
    maxLen,
    acceptLen: params2.gridTraceMinLen,
    traceMinLen: params2.gridTraceMinLen,
    sourceSep: minSourceSep,
    traceOptsBase,
    seaBufferOpts,
    pushMain,
    pushTributary,
    pushMedium,
    placeMode: "medium"
  };
  let placed = 0;
  const totalSteps = Math.max(1, topUpPasses * masses.length);
  let step = 0;
  for (let pass = 0; pass < topUpPasses; pass++) {
    let passPlaced = 0;
    for (const mass of masses) {
      const massSet = new Set(mass);
      passPlaced += enforceHardRiverGridStarts(
        hexes,
        massSet,
        cellSize,
        seaDist,
        riverPaths,
        gridCtx,
        maxLen,
        params2.reliefSourceBonus,
        params2.expandSourceRadius,
        params2.minInlandFromSea,
        minSourceSep,
        params2.gridTraceMinLen
      );
      enforceMaxDryLowlandPatches(massSet, gridCtx);
      passPlaced += ensureRiverGridAndProximity(
        hexes,
        massSet,
        cellSize,
        seaDist,
        gridCtx,
        riverProximityMaxDist(cellSize),
        singleLargeMass
      );
      step++;
      onProgress?.(Math.min(100, step / totalSteps * 100));
    }
    placed += passPlaced;
    if (passPlaced === 0) break;
  }
  onProgress?.(100);
  return placed;
}
var BASE_DEPOSIT_RULES = [
  {
    id: "miedz",
    nakladka: null,
    allowedOn: (h2) => isDryLandTerrain(h2.terenBazowy) && h2.terenBazowy === "wzgorza" /* Wzgorza */,
    rarity: 0.1
  },
  {
    id: "zelazo",
    nakladka: null,
    allowedOn: (h2) => isDryLandTerrain(h2.terenBazowy) && h2.terenBazowy === "gory" /* Gory */,
    rarity: 0.08
  },
  {
    id: "glina",
    nakladka: "zloze_gliny" /* ZlozeGliny */,
    // TEMAT 12 (2026-07-24, Maciej): glina TYLKO przy rzece — gałąź "Łąka bez rzeki" usunięta.
    // placeDeposits() jest teraz wołane PO generateRivers (generator.ts), więc h.rzeka.obecna
    // odzwierciedla finalny stan rzek, nie "zawsze false" jak dawniej.
    allowedOn: (h2) => isDryLandTerrain(h2.terenBazowy) && h2.rzeka?.obecna === true,
    rarity: 0.3
  },
  {
    id: "konie",
    nakladka: "zloze_konia" /* ZlozeKonia */,
    allowedOn: (h2) => isDryLandTerrain(h2.terenBazowy) && h2.terenBazowy === "rownina" /* Rownina */,
    rarity: 0.1
  },
  {
    id: "wegiel",
    nakladka: null,
    // brak w enumie Nakladka -> znacznik hex.zloze
    allowedOn: (h2) => isDryLandTerrain(h2.terenBazowy) && h2.terenBazowy === "gory" /* Gory */,
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
    allowedOn: (h2) => isDryLandTerrain(h2.terenBazowy),
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
    allowedOn: (h2) => isDryLandTerrain(h2.terenBazowy) && (h2.terenBazowy === "wzgorza" /* Wzgorza */ || h2.terenBazowy === "gory" /* Gory */),
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
function ensureDepositGridCoverage(hexes, tier, typ, continentOf, nContinents, rand) {
  const cellSize = fairPlayResourceCellSize(tier);
  const minLand = minLandHexesForFairPlayCell(cellSize);
  const partitions = landPartitionKeysForDistribution(hexes, typ, continentOf, nContinents);
  let fixed = 0;
  for (const part of partitions) {
    const massSet = new Set(part.filter((k) => hexes[k]?.terenBazowy !== "morze" /* Morze */));
    for (let pass = 0; pass < 10; pass++) {
      let passFixed = 0;
      for (const land of landHexesByCoverageCell(massSet, cellSize).values()) {
        if (land.length < minLand) continue;
        for (const id of FAIR_PLAY_DEPOSIT_IDS) {
          if (forceDepositInCell(land, hexes, id, rand)) passFixed++;
        }
      }
      fixed += passFixed;
      if (passFixed === 0) break;
    }
    for (const land of landHexesByCoverageCell(massSet, cellSize).values()) {
      if (land.length < minLand) continue;
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
  for (let outer = 0; outer < 4; outer++) {
    let passFixed = 0;
    for (const mass of masses) {
      const massSet = new Set(mass);
      for (const land of landHexesByCoverageCell(massSet, cellSize).values()) {
        if (land.length < minLand || cellHasForest(land, hexes)) continue;
        const eligible = land.filter(([q, r]) => {
          const h2 = hexes[hexKey(q, r)];
          return h2 && isForestEligibleTerrain(h2.terenBazowy) && h2.nakladka === "brak" /* Brak */;
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
var IMPROVEMENT_KEYS = Object.keys(IMPROVEMENTS).filter((k) => !k.startsWith("_"));
var LIVESTOCK_SUROWIEC_KEYS = /* @__PURE__ */ new Set(["bydlo", "owce", "lama", "kon"]);
var LIVESTOCK_IMPROVEMENT_KEYS = IMPROVEMENT_KEYS.filter((k) => {
  const s = IMPROVEMENTS[k]?.surowiecOdblokowany;
  return typeof s === "string" && LIVESTOCK_SUROWIEC_KEYS.has(s);
});

// src/map/road-movement.ts
var ROAD_MIN_MOVE_COST = 1 / 3;

// src/units/setup.ts
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

// src/map/clusters.ts
var CLUSTER_CITY_STATE_MIN_HEX = 5;
var CLUSTER_CITY_STATE_MAX_HEX = 5;
var MIN_DIST_START_CITY_STATE = CLUSTER_CITY_STATE_MIN_HEX;
var MIN_DIST_FOREIGN_FROM_PLAYER = 12;
var MIN_DIST_FOREIGN_IN_CLUSTER = MIN_DIST_START_CITY_STATE;
var CLUSTER_GROWTH_RESERVE = 1;
var ROSTER_KLUCZE = [
  "grecy",
  "rzymianie",
  "chinczycy",
  "inkowie",
  "zulusi",
  "egipt",
  "sumer",
  "celtowie",
  "germanie",
  "harappa",
  "hetyci",
  "slowianie",
  "babilonia",
  "asyria",
  "fenicjanie"
];
function rosterKluczeForStartEpoch(civRoster, startEpochId) {
  if (!civRoster || !startEpochId) return [...ROSTER_KLUCZE];
  const available = new Set(civIdsAvailableAtGameEpoch(civRoster, startEpochId));
  return ROSTER_KLUCZE.filter((k) => available.has(k));
}
function mapSizeLabel(w2, h2) {
  const area = w2 * h2;
  if (area < 4800) return "mala";
  if (area < 12e3) return "srednia";
  if (area < 25200) return "duza";
  if (area < 1e5) return "ogromna";
  return "super";
}
function aktywneTypyFromSize(label) {
  const lut = {
    mala: 4,
    srednia: 5,
    duza: 6,
    ogromna: 8,
    super: 10
  };
  return lut[label];
}
function shuffleInPlace(arr, rand) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
}
var MIN_MASS_HEXES_FOR_CENTER = 12;
var ISLAND_FALLBACK_MASS_FRAC = 0.25;
var LOCAL_LAND_DOMINANCE_FRAC = 0.7;
var LOCAL_LAND_DOMINANCE_RADIUS = 3;
var PLAYER_START_MIN_MASS_HEXES = 25;
var PLAYER_START_MASS_MIN_ABSOLUTE = 30;
function qualifyingMassThreshold(largestMassSize) {
  return Math.max(
    MIN_MASS_HEXES_FOR_CENTER,
    Math.floor(largestMassSize * ISLAND_FALLBACK_MASS_FRAC)
  );
}
function buildMassHexIndex(masses) {
  const idx = /* @__PURE__ */ new Map();
  for (let mi = 0; mi < masses.length; mi++) {
    for (const h2 of masses[mi]) {
      idx.set(`${h2.q},${h2.r}`, mi);
    }
  }
  return idx;
}
function massContainingHex(hexIndex, q, r) {
  const mi = hexIndex.get(`${q},${r}`);
  return mi !== void 0 ? mi : null;
}
function isSpawnHabitableTerrain(teren) {
  return teren !== "morze" /* Morze */ && teren !== "gory" /* Gory */ && teren !== "wybrzeze" /* Wybrzeze */ && teren !== "morze" && teren !== "gory" && teren !== "wybrzeze";
}
function localLandFraction(map2, q, r, radius = LOCAL_LAND_DOMINANCE_RADIUS) {
  let landCount = 0;
  let totalCount = 0;
  for (let dq = -radius; dq <= radius; dq++) {
    const r1 = Math.max(-radius, -dq - radius);
    const r2 = Math.min(radius, -dq + radius);
    for (let dr = r1; dr <= r2; dr++) {
      const h2 = map2.hexes[`${q + dq},${r + dr}`];
      if (!h2) continue;
      totalCount++;
      if (isSpawnHabitableTerrain(h2.terenBazowy)) landCount++;
    }
  }
  const ratio = totalCount > 0 ? landCount / totalCount : 0;
  return { ratio, landCount, totalCount };
}
function passesLocalLandGate(map2, q, r, minFrac = LOCAL_LAND_DOMINANCE_FRAC, radius = LOCAL_LAND_DOMINANCE_RADIUS) {
  return localLandFraction(map2, q, r, radius).ratio >= minFrac;
}
function massSizeAtHex(q, r, masses) {
  const idx = buildMassHexIndex(masses);
  const mi = massContainingHex(idx, q, r);
  return mi !== null ? masses[mi].length : 0;
}
function passesPlayerStartMassGate(map2, q, r, masses) {
  if (!passesLocalLandGate(map2, q, r)) return false;
  const massSize = massSizeAtHex(q, r, masses);
  const largest = masses[0]?.length ?? 0;
  const scaledMin = Math.max(
    PLAYER_START_MASS_MIN_ABSOLUTE,
    Math.floor(largest * 0.08)
  );
  if (massSize >= scaledMin) return true;
  return massSize >= PLAYER_START_MIN_MASS_HEXES;
}
function pickPlayerClusterCenter(map2, masses, ladowe, mapCenter, rand) {
  const massOrder = masses.length > 0 ? [masses[0], ...masses.slice(1)] : [];
  for (const mass of massOrder) {
    const candidates = mass.map((h2) => ({ h: h2, ...localLandFraction(map2, h2.q, h2.r) })).filter((x) => passesPlayerStartMassGate(map2, x.h.q, x.h.r, masses)).sort((a, b) => {
      const da = hexDistanceAxial(a.h.q, a.h.r, mapCenter.q, mapCenter.r);
      const db = hexDistanceAxial(b.h.q, b.h.r, mapCenter.q, mapCenter.r);
      return b.ratio - a.ratio || da - db || a.h.q - b.h.q || a.h.r - b.h.r;
    });
    if (candidates.length === 0) continue;
    const top = candidates[0];
    if (candidates.length > 1) {
      const tie = candidates.filter((x) => x.ratio >= top.ratio - 1e-3);
      return tie[Math.floor(rand() * tie.length)].h;
    }
    return top.h;
  }
  const fallback = ladowe.map((h2) => ({ h: h2, ...localLandFraction(map2, h2.q, h2.r) })).filter((x) => passesPlayerStartMassGate(map2, x.h.q, x.h.r, masses)).sort((a, b) => b.ratio - a.ratio);
  return fallback[0]?.h ?? null;
}
function pickBestLocalLandSpawn(map2, pool, existing, minDist, rand) {
  const candidates = pool.filter((h2) => existing.every((p) => hexDistanceAxial(h2.q, h2.r, p.q, p.r) >= minDist)).map((h2) => ({ h: h2, ...localLandFraction(map2, h2.q, h2.r) })).filter((x) => x.ratio >= LOCAL_LAND_DOMINANCE_FRAC).sort((a, b) => b.ratio - a.ratio || a.h.q - b.h.q || a.h.r - b.h.r);
  if (candidates.length === 0) return null;
  const top = candidates[0];
  if (candidates.length > 1 && rand) {
    const tieBand = candidates.filter((x) => x.ratio >= top.ratio - 1e-3);
    return tieBand[Math.floor(rand() * tieBand.length)].h;
  }
  return top.h;
}
function assignVoronoiRegions(ladowe, centrumy) {
  const regiony = Array.from(
    { length: centrumy.length },
    () => []
  );
  for (const h2 of ladowe) {
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let ci = 0; ci < centrumy.length; ci++) {
      const d = hexDistanceAxial(h2.q, h2.r, centrumy[ci].q, centrumy[ci].r);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = ci;
      }
    }
    regiony[bestIdx].push(h2);
  }
  return regiony;
}
function groupHabitableMasses(ladowe) {
  const keySet = new Set(ladowe.map((h2) => `${h2.q},${h2.r}`));
  const visited = /* @__PURE__ */ new Set();
  const masses = [];
  for (const h2 of ladowe) {
    const startKey = `${h2.q},${h2.r}`;
    if (visited.has(startKey)) continue;
    const mass = [];
    const stack = [h2];
    visited.add(startKey);
    while (stack.length) {
      const cur = stack.pop();
      mass.push(cur);
      for (const [dq, dr] of HEX_DIRECTIONS) {
        const nq = cur.q + dq;
        const nr = cur.r + dr;
        const nk = `${nq},${nr}`;
        if (!keySet.has(nk) || visited.has(nk)) continue;
        visited.add(nk);
        stack.push({ q: nq, r: nr });
      }
    }
    if (mass.length >= MIN_MASS_HEXES_FOR_CENTER) masses.push(mass);
  }
  masses.sort((a, b) => b.length - a.length);
  return masses;
}
function massCentroid(mass) {
  let sq = 0;
  let sr = 0;
  for (const h2 of mass) {
    sq += h2.q;
    sr += h2.r;
  }
  return { q: sq / mass.length, r: sr / mass.length };
}
function pickCenterInMassWithLandGate(map2, mass, existing, minDist, preferNear, rand) {
  const centroid = massCentroid(mass);
  const candidates = mass.filter((h2) => existing.every((p) => hexDistanceAxial(h2.q, h2.r, p.q, p.r) >= minDist)).map((h2) => ({
    h: h2,
    land: localLandFraction(map2, h2.q, h2.r),
    score: hexDistanceAxial(h2.q, h2.r, centroid.q, centroid.r) + (preferNear ? hexDistanceAxial(h2.q, h2.r, preferNear.q, preferNear.r) * 0.05 : 0)
  })).filter((x) => x.land.ratio >= LOCAL_LAND_DOMINANCE_FRAC).sort((a, b) => b.land.ratio - a.land.ratio || a.score - b.score);
  if (candidates.length === 0) return null;
  const top = candidates[0];
  if (rand && candidates.length > 1) {
    const tieBand = candidates.filter((x) => x.land.ratio >= top.land.ratio - 1e-3);
    return tieBand[Math.floor(rand() * tieBand.length)].h;
  }
  return top.h;
}
function placeClusterCentersAcrossLandmasses(map2, ladowe, nNeeded, minDistBase, mapCenter, rand, marginBrzeg, bounds) {
  const { minQ, maxQ, minR, maxR } = bounds;
  const masses = groupHabitableMasses(ladowe);
  const largestMassSize = masses[0]?.length ?? 0;
  const qualThreshold = qualifyingMassThreshold(largestMassSize);
  const qualifyingMasses = masses.filter((m) => m.length >= qualThreshold);
  const centers = [];
  function okMargins(q, r, relax) {
    if (relax) return true;
    return q - minQ >= marginBrzeg && maxQ - q >= marginBrzeg && r - minR >= marginBrzeg && maxR - r >= marginBrzeg;
  }
  function hasCenter(c) {
    return centers.some((p) => p.q === c.q && p.r === c.r);
  }
  function tryPlace(c, minDist, relaxMargin, forPlayer = false) {
    if (!c || hasCenter(c)) return false;
    if (!okMargins(c.q, c.r, relaxMargin)) return false;
    if (centers.some((p) => hexDistanceAxial(c.q, c.r, p.q, p.r) < minDist)) return false;
    if (forPlayer) {
      if (!passesPlayerStartMassGate(map2, c.q, c.r, masses)) return false;
    } else if (!passesLocalLandGate(map2, c.q, c.r)) {
      return false;
    }
    centers.push(c);
    return true;
  }
  const playerCenter = pickPlayerClusterCenter(map2, masses, ladowe, mapCenter, rand);
  if (playerCenter) {
    centers.push(playerCenter);
  }
  for (let minDist = minDistBase; minDist >= 6 && centers.length < nNeeded; minDist -= 2) {
    const relaxMargin = minDist < minDistBase;
    for (let mi = 1; mi < qualifyingMasses.length && centers.length < nNeeded; mi++) {
      tryPlace(
        pickCenterInMassWithLandGate(map2, qualifyingMasses[mi], centers, minDist, void 0, rand),
        minDist,
        relaxMargin
      );
    }
    let stagnant = 0;
    while (centers.length < nNeeded && stagnant < qualifyingMasses.length + 2) {
      let placed = false;
      for (const mass of qualifyingMasses) {
        if (centers.length >= nNeeded) break;
        if (tryPlace(
          pickCenterInMassWithLandGate(map2, mass, centers, minDist, void 0, rand),
          minDist,
          relaxMargin
        )) {
          placed = true;
        }
      }
      stagnant = placed ? 0 : stagnant + 1;
    }
  }
  if (centers.length < nNeeded) {
    const shuffled = ladowe.slice();
    shuffleInPlace(shuffled, rand);
    for (const c of shuffled) {
      if (centers.length >= nNeeded) break;
      tryPlace(c, 4, true);
    }
  }
  if (centers.length < nNeeded && qualifyingMasses.length > 0) {
    for (let minDist = 4; minDist >= 2 && centers.length < nNeeded; minDist--) {
      for (const mass of qualifyingMasses) {
        if (centers.length >= nNeeded) break;
        tryPlace(
          pickCenterInMassWithLandGate(map2, mass, centers, minDist, void 0, rand),
          minDist,
          true
        );
      }
    }
  }
  return centers.slice(0, nNeeded);
}
function clusterPackRadius(maxMiast, minDist) {
  const rings = Math.max(2, Math.ceil(Math.sqrt(Math.max(1, maxMiast)) * 1.35));
  return Math.max(minDist * 2, rings * minDist);
}
function landPoolNearCore(region, centrum, maxMiast, minDist, maxRadius) {
  const packR = maxRadius != null ? maxRadius : clusterPackRadius(maxMiast, minDist);
  const near = region.map((c) => ({ c, d: hexDistanceAxial(c.q, c.r, centrum.q, centrum.r) })).filter((x) => x.d <= packR).sort((a, b) => a.d - b.d || a.c.q - b.c.q || a.c.r - b.c.r).map((x) => x.c);
  if (near.length >= maxMiast) return near;
  if (maxRadius != null) return near.length > 0 ? near : region;
  let expanded = packR + minDist;
  while (near.length < maxMiast && expanded <= packR + minDist * 6) {
    for (const c of region) {
      if (near.some((p) => p.q === c.q && p.r === c.r)) continue;
      if (hexDistanceAxial(c.q, c.r, centrum.q, centrum.r) <= expanded) near.push(c);
      if (near.length >= maxMiast * 3) break;
    }
    expanded += minDist;
  }
  return near.length > 0 ? near : region;
}
function hexesAtDistance(q, r, dist) {
  if (dist <= 0) return [{ q, r }];
  let frontier = [{ q, r }];
  for (let d = 0; d < dist; d++) {
    const next = [];
    const seen = /* @__PURE__ */ new Set();
    for (const h2 of frontier) {
      for (const dir of HEX_DIRECTIONS) {
        const nq = h2.q + dir[0];
        const nr = h2.r + dir[1];
        const k = `${nq},${nr}`;
        if (seen.has(k)) continue;
        seen.add(k);
        next.push({ q: nq, r: nr });
      }
    }
    frontier = next;
  }
  return frontier;
}
function packCityStatesHubChain(landHexes, core, count, minSep, ringDist, seed, opts) {
  if (count <= 0) return [];
  const rand = mulberry32((seed ^ 2654435769) >>> 0);
  const placed = [];
  const exclude = opts?.excludeHex ?? core;
  const anchor = opts?.anchor;
  const landSet = new Set(landHexes.map((h2) => `${h2.q},${h2.r}`));
  function validCandidate(h2, hub) {
    if (!landSet.has(`${h2.q},${h2.r}`)) return false;
    if (h2.q === exclude.q && h2.r === exclude.r) return false;
    if (hexDistanceAxial(h2.q, h2.r, hub.q, hub.r) !== ringDist) return false;
    if (hexDistanceAxial(h2.q, h2.r, core.q, core.r) < minSep) return false;
    if (anchor && hexDistanceAxial(h2.q, h2.r, anchor.q, anchor.r) < anchor.minDist) return false;
    if (placed.some((p) => p.q === h2.q && p.r === h2.r)) return false;
    return placed.every((p) => hexDistanceAxial(h2.q, h2.r, p.q, p.r) >= minSep);
  }
  const hubQueue = [core];
  let hubIdx = 0;
  while (placed.length < count && hubIdx < hubQueue.length) {
    const hub = hubQueue[hubIdx];
    hubIdx += 1;
    while (placed.length < count) {
      const cands = hexesAtDistance(hub.q, hub.r, ringDist).filter((h2) => validCandidate(h2, hub));
      if (cands.length === 0) break;
      shuffleInPlace(cands, rand);
      cands.sort((a, b) => a.q - b.q || a.r - b.r);
      const c = cands[0];
      placed.push(c);
      hubQueue.push(c);
    }
  }
  return placed;
}
function packCityStatesAroundCapital(allLand, region, capital, stateCityCount, minDist, seed, opts) {
  if (stateCityCount <= 0) {
    return { stateCities: [], growthSlot: null };
  }
  const growthReserve = opts?.growthReserve ?? CLUSTER_GROWTH_RESERVE;
  const totalPack = stateCityCount + growthReserve;
  const packOpts = { excludeHex: opts?.excludeHex ?? capital, anchor: opts?.anchor };
  const expandedR = clusterPackRadius(totalPack, minDist) * 2;
  const pools = [];
  const nearRegion = landPoolNearCore(region, capital, totalPack, minDist);
  pools.push(nearRegion);
  const nearExpanded = landPoolNearCore(region, capital, totalPack, minDist, expandedR);
  if (nearExpanded.length > nearRegion.length) pools.push(nearExpanded);
  if (allLand.length > nearExpanded.length) pools.push(allLand);
  const seeds = [
    seed,
    seed + 1367130551 >>> 0,
    seed + 2246822507 >>> 0,
    seed + 3266489909 >>> 0
  ];
  let best = [];
  for (const pool of pools) {
    for (const s of seeds) {
      const packed = packCityStatesHubChain(
        pool,
        capital,
        totalPack,
        minDist,
        CLUSTER_CITY_STATE_MAX_HEX,
        s,
        packOpts
      );
      if (packed.length > best.length) best = packed;
      if (best.length >= stateCityCount) break;
    }
    if (best.length >= stateCityCount) break;
  }
  return {
    stateCities: best.slice(0, stateCityCount),
    growthSlot: best.length > stateCityCount ? best[stateCityCount] ?? null : null
  };
}
function packRivalCitiesAroundCore(landHexes, core, rivalCount, minDist, seed) {
  if (rivalCount <= 0) return [];
  return packCityStatesAroundCapital(
    landHexes,
    landHexes,
    core,
    rivalCount,
    minDist,
    seed,
    { excludeHex: core, growthReserve: 0 }
  ).stateCities;
}
function centroidOf(hexes) {
  if (hexes.length === 0) return { q: 0, r: 0 };
  let sq = 0;
  let sr = 0;
  for (const h2 of hexes) {
    sq += h2.q;
    sr += h2.r;
  }
  return { q: sq / hexes.length, r: sr / hexes.length };
}
function buildClusterLayoutWithEdgeCapital(region, centrum, stateCityCount, minDist, rand, anchor, growthReserve = CLUSTER_GROWTH_RESERVE, map2, seed = 42) {
  if (stateCityCount < 0) return null;
  const blobCenter = centroidOf(region.length > 0 ? region : [centrum]);
  let capitalCandidates = region.filter((c) => {
    if (anchor && hexDistanceAxial(c.q, c.r, anchor.q, anchor.r) < anchor.minDist) return false;
    return true;
  });
  if (map2) {
    const gated = capitalCandidates.filter((c) => passesLocalLandGate(map2, c.q, c.r));
    if (gated.length > 0) capitalCandidates = gated;
  }
  if (capitalCandidates.length === 0) return null;
  capitalCandidates.sort((a, b) => {
    const da = hexDistanceAxial(a.q, a.r, blobCenter.q, blobCenter.r);
    const db = hexDistanceAxial(b.q, b.r, blobCenter.q, blobCenter.r);
    const jitter = rand() * 0.01;
    return db + jitter - (da + jitter) || a.q - b.q || a.r - b.r;
  });
  const capital = capitalCandidates[0];
  const { stateCities, growthSlot } = packCityStatesAroundCapital(
    region,
    region,
    capital,
    stateCityCount,
    minDist,
    seed,
    { excludeHex: capital, anchor, growthReserve }
  );
  return { capital, stateCities, growthSlot };
}
function layoutToClusterCities(layout) {
  const cities = [{
    q: layout.capital.q,
    r: layout.capital.r,
    isCapital: true
  }];
  for (const s of layout.stateCities) {
    cities.push({ q: s.q, r: s.r, isCapital: false });
  }
  return cities;
}
function buildClusterCities(region, centrum, stateCityCount, minDist, rand, anchor, seed, map2) {
  const layout = buildClusterLayoutWithEdgeCapital(
    region,
    centrum,
    stateCityCount,
    minDist,
    rand,
    anchor,
    CLUSTER_GROWTH_RESERVE,
    map2,
    seed ?? 42
  );
  if (!layout) {
    return buildClusterCitiesSimpleFallback(
      region,
      centrum,
      stateCityCount,
      minDist,
      anchor,
      seed ?? 42,
      map2
    );
  }
  return {
    cities: layoutToClusterCities(layout),
    pendingStateSlots: layout.stateCities,
    growthSlot: layout.growthSlot
  };
}
function buildClusterCitiesSimpleFallback(region, centrum, stateCityCount, minDist, anchor, seed, map2) {
  let pool = region;
  if (anchor) {
    const filtered = region.filter(
      (h2) => hexDistanceAxial(h2.q, h2.r, anchor.q, anchor.r) >= anchor.minDist
    );
    if (filtered.length > 0) pool = filtered;
  }
  if (pool.length === 0) {
    return { cities: [], pendingStateSlots: [], growthSlot: null };
  }
  const cen = centroidOf(pool);
  const capSorted = pool.slice().sort((a, b) => {
    const da = hexDistanceAxial(a.q, a.r, cen.q, cen.r);
    const db = hexDistanceAxial(b.q, b.r, cen.q, cen.r);
    return db - da || a.q - b.q || a.r - b.r;
  });
  const gatedCaps = map2 ? capSorted.filter((c) => passesLocalLandGate(map2, c.q, c.r)) : capSorted;
  const capital = gatedCaps[0] ?? (map2 ? null : capSorted[0]) ?? centrum;
  if (map2 && !passesLocalLandGate(map2, capital.q, capital.r)) {
    return { cities: [], pendingStateSlots: [], growthSlot: null };
  }
  const { stateCities, growthSlot } = packCityStatesAroundCapital(
    pool,
    pool,
    capital,
    stateCityCount,
    minDist,
    seed,
    { excludeHex: capital, anchor, growthReserve: 0 }
  );
  const cities = [{ q: capital.q, r: capital.r, isCapital: true }];
  for (const s of stateCities) {
    cities.push({ q: s.q, r: s.r, isCapital: false });
  }
  return { cities, pendingStateSlots: stateCities, growthSlot };
}
function enforceLocalLandDominance(map2, centrumy, regiony, aktywneKlucze, ladowe, masses, rand, minDist, mapCenter) {
  let relocated = false;
  for (let ci = 0; ci < centrumy.length; ci++) {
    const center = centrumy[ci];
    const ok = ci === 0 ? passesPlayerStartMassGate(map2, center.q, center.r, masses) : passesLocalLandGate(map2, center.q, center.r);
    if (ok) continue;
    const region = regiony[ci] ?? [];
    const others = centrumy.filter((_, i) => i !== ci);
    let newCenter = null;
    if (ci === 0) {
      newCenter = pickPlayerClusterCenter(map2, masses, ladowe, mapCenter, rand);
    } else {
      newCenter = pickBestLocalLandSpawn(map2, region, others, minDist, rand);
      if (!newCenter) {
        for (const mass of masses) {
          newCenter = pickCenterInMassWithLandGate(map2, mass, others, minDist, void 0, rand);
          if (newCenter) break;
        }
      }
    }
    if (newCenter) {
      centrumy[ci] = newCenter;
      relocated = true;
    }
  }
  if (relocated) {
    const newRegiony2 = assignVoronoiRegions(ladowe, centrumy);
    for (let i = 0; i < regiony.length; i++) {
      regiony[i] = newRegiony2[i];
    }
  }
  const keep = centrumy.map((c, ci) => {
    if (ci === 0) return true;
    return passesLocalLandGate(map2, c.q, c.r);
  });
  if (!passesLocalLandGate(map2, centrumy[0].q, centrumy[0].r) || !passesPlayerStartMassGate(map2, centrumy[0].q, centrumy[0].r, masses)) {
    const forced = pickPlayerClusterCenter(map2, masses, ladowe, mapCenter, rand);
    if (forced) {
      centrumy[0] = forced;
      const newRegiony2 = assignVoronoiRegions(ladowe, centrumy);
      for (let i = 0; i < regiony.length; i++) {
        regiony[i] = newRegiony2[i];
      }
      keep[0] = true;
    }
  }
  const newCentrumy = centrumy.filter((_, i) => keep[i]);
  const newAktywneKlucze = aktywneKlucze.filter((_, i) => keep[i]);
  const newRegiony = assignVoronoiRegions(ladowe, newCentrumy);
  return { centrumy: newCentrumy, regiony: newRegiony, aktywneKlucze: newAktywneKlucze };
}
function clusterCapitalPos(layout, fallback) {
  const cap = layout.cities.find((m) => m.isCapital) ?? layout.cities[0];
  return cap ? { q: cap.q, r: cap.r } : fallback;
}
function buildClusterCitiesWithLandGate(map2, region, centrum, stateCityCount, minDist, rand, anchor, seed, masses, existingCenters, minClusterDist) {
  let activeCentrum = centrum;
  for (let attempt = 0; attempt < 5; attempt++) {
    const layout = buildClusterCities(
      region,
      activeCentrum,
      stateCityCount,
      minDist,
      rand,
      anchor,
      seed,
      map2
    );
    const cap = clusterCapitalPos(layout, activeCentrum);
    if (passesLocalLandGate(map2, cap.q, cap.r)) {
      return { ...layout, centrum: activeCentrum };
    }
    const altCenter = pickBestLocalLandSpawn(map2, region, existingCenters, minClusterDist, rand);
    let nextCenter = altCenter;
    if (!nextCenter) {
      for (const mass of masses) {
        nextCenter = pickCenterInMassWithLandGate(map2, mass, existingCenters, minClusterDist, void 0, rand);
        if (nextCenter) break;
      }
    }
    if (!nextCenter) return null;
    activeCentrum = nextCenter;
  }
  return null;
}
function computeClusters(map2, opts) {
  const seed = opts?.seed ?? 42;
  const playerTypKlucz = opts?.playerTyp ?? ROSTER_KLUCZE[0];
  const rywaleNaKlaster = opts?.rywaleNaKlaster ?? 9;
  const minDystKlastrowBase = opts?.minDystansKlastrow ?? 12;
  const minDystMiastaPanstwa = opts?.minDystans ?? MIN_DIST_START_CITY_STATE;
  const minDystObcyOdGracza = MIN_DIST_FOREIGN_FROM_PLAYER;
  const rand = mulberry32(seed);
  const allHexes = Object.values(map2.hexes);
  let minQ = Infinity, maxQ = -Infinity, minR = Infinity, maxR = -Infinity;
  for (const h2 of allHexes) {
    if (h2.coords.q < minQ) minQ = h2.coords.q;
    if (h2.coords.q > maxQ) maxQ = h2.coords.q;
    if (h2.coords.r < minR) minR = h2.coords.r;
    if (h2.coords.r > maxR) maxR = h2.coords.r;
  }
  const W = maxQ - minQ + 1;
  const H = maxR - minR + 1;
  const rozmiarMapy = mapSizeLabel(W, H);
  const requestedTypy = opts?.aktywneTypy ?? aktywneTypyFromSize(rozmiarMapy);
  const epochRoster2 = rosterKluczeForStartEpoch(opts?.civRoster, opts?.startEpochId);
  const rosterCap = epochRoster2.length > 0 ? epochRoster2.length : ROSTER_KLUCZE.length;
  const nTypy = Math.min(requestedTypy, rosterCap);
  const area = W * H;
  const minDystKlastrow = Math.max(
    6,
    Math.min(minDystKlastrowBase, Math.floor(Math.sqrt(area / Math.max(nTypy, 1)) * 0.9))
  );
  const ladowe = [];
  for (const h2 of allHexes) {
    if (h2.terenBazowy !== "morze" /* Morze */ && h2.terenBazowy !== "gory" /* Gory */ && h2.terenBazowy !== "wybrzeze" /* Wybrzeze */) {
      ladowe.push({ q: h2.coords.q, r: h2.coords.r });
    }
  }
  if (ladowe.length === 0) {
    return {
      rozmiarMapy,
      aktywneTypy: 0,
      requestedTypy: nTypy,
      minDystansMiastaPanstwa: minDystMiastaPanstwa,
      maxDystansMiastaPanstwa: CLUSTER_CITY_STATE_MAX_HEX,
      minDystansObcyOdGracza: minDystObcyOdGracza,
      playerTypIndex: 0,
      klastry: []
    };
  }
  const shuffledLad = ladowe.slice();
  shuffleInPlace(shuffledLad, rand);
  const mapCenter = { q: (minQ + maxQ) / 2, r: (minR + maxR) / 2 };
  const marginBrzeg = Math.max(2, Math.floor(minDystKlastrow / 3));
  const centrumy = placeClusterCentersAcrossLandmasses(
    map2,
    ladowe,
    nTypy,
    minDystKlastrow,
    mapCenter,
    rand,
    marginBrzeg,
    { minQ, maxQ, minR, maxR }
  );
  if (centrumy.length < nTypy && typeof console !== "undefined") {
    console.warn(
      `[clusters] Tylko ${centrumy.length}/${nTypy} \u015Brodk\xF3w klastr\xF3w \u2014 mapa za ciasna lub zbyt pofragmentowany l\u0105d`
    );
  }
  const rosterSource = epochRoster2.length > 0 ? epochRoster2 : ROSTER_KLUCZE;
  const playerInEpoch = rosterSource.includes(playerTypKlucz);
  const playerKlucz = playerInEpoch ? playerTypKlucz : rosterSource[0];
  const rosterBezGracza = rosterSource.filter((k) => k !== playerKlucz);
  for (let i = rosterBezGracza.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = rosterBezGracza[i];
    rosterBezGracza[i] = rosterBezGracza[j];
    rosterBezGracza[j] = tmp;
  }
  const aktywneKlucze = [playerKlucz, ...rosterBezGracza.slice(0, nTypy - 1)];
  const rosterTrimmed = aktywneKlucze.slice(0, centrumy.length);
  while (rosterTrimmed.length < centrumy.length) {
    rosterTrimmed.push(`typ${rosterTrimmed.length}`);
  }
  const masses = groupHabitableMasses(ladowe);
  let activeCentrumy = centrumy.slice();
  let activeKlucze = rosterTrimmed.slice();
  let regiony = assignVoronoiRegions(ladowe, activeCentrumy);
  const dominanceResult = enforceLocalLandDominance(
    map2,
    activeCentrumy,
    regiony,
    activeKlucze,
    ladowe,
    masses,
    rand,
    minDystKlastrow,
    mapCenter
  );
  activeCentrumy = dominanceResult.centrumy;
  activeKlucze = dominanceResult.aktywneKlucze;
  regiony = dominanceResult.regiony;
  if (activeCentrumy.length < nTypy && typeof console !== "undefined") {
    console.warn(
      `[clusters] Po bramce lokalnego l\u0105du 70% (R=${LOCAL_LAND_DOMINANCE_RADIUS}): ${activeCentrumy.length}/${nTypy} aktywnych klastr\xF3w`
    );
  }
  const klastry = [];
  const stateCityCount = rywaleNaKlaster;
  const playerCentrum = activeCentrumy[0];
  const playerRegion = regiony[0];
  const playerLayoutResult = buildClusterCitiesWithLandGate(
    map2,
    playerRegion,
    playerCentrum,
    stateCityCount,
    minDystMiastaPanstwa,
    rand,
    void 0,
    seed,
    masses,
    [],
    minDystKlastrow
  );
  let playerCentrumFinal = playerCentrum;
  let playerLayout;
  if (playerLayoutResult) {
    playerLayout = playerLayoutResult;
    playerCentrumFinal = playerLayoutResult.centrum;
  } else {
    const forced = pickPlayerClusterCenter(map2, masses, ladowe, mapCenter, rand);
    if (forced) {
      playerCentrumFinal = forced;
      playerLayout = {
        cities: [{ q: forced.q, r: forced.r, isCapital: true }],
        pendingStateSlots: [],
        growthSlot: null
      };
    } else {
      playerLayout = { cities: [], pendingStateSlots: [], growthSlot: null };
    }
  }
  let playerCapital = playerLayout.cities.find((m) => m.isCapital) ?? playerLayout.cities[0];
  let playerCapitalPos = playerCapital ? { q: playerCapital.q, r: playerCapital.r } : playerCentrumFinal;
  if (!passesPlayerStartMassGate(map2, playerCapitalPos.q, playerCapitalPos.r, masses)) {
    const fixed = pickPlayerClusterCenter(map2, masses, ladowe, mapCenter, rand);
    if (fixed) {
      playerCentrumFinal = fixed;
      playerCapitalPos = fixed;
      playerLayout = {
        cities: [{ q: fixed.q, r: fixed.r, isCapital: true }],
        pendingStateSlots: [],
        growthSlot: null
      };
    }
  }
  const playerStateSlots = packRivalCitiesAroundCore(
    ladowe,
    playerCapitalPos,
    stateCityCount,
    minDystMiastaPanstwa,
    seed
  );
  klastry.push({
    typIndex: 0,
    typ: activeKlucze[0] ?? playerKlucz,
    centrum: playerCentrumFinal,
    miasta: playerLayout.cities,
    pendingStateSlots: playerStateSlots,
    growthSlot: playerLayout.growthSlot
  });
  for (let ci = 1; ci < activeCentrumy.length; ci++) {
    const centrum = activeCentrumy[ci];
    const region = regiony[ci];
    const foreignLayoutResult = buildClusterCitiesWithLandGate(
      map2,
      region,
      centrum,
      stateCityCount,
      MIN_DIST_FOREIGN_IN_CLUSTER,
      rand,
      { q: playerCapitalPos.q, r: playerCapitalPos.r, minDist: minDystObcyOdGracza },
      seed,
      masses,
      activeCentrumy.slice(0, ci),
      minDystKlastrow
    );
    if (!foreignLayoutResult || foreignLayoutResult.cities.length === 0) continue;
    const foreignCap = foreignLayoutResult.cities.find((m) => m.isCapital) ?? foreignLayoutResult.cities[0];
    const foreignAnchor = {
      q: playerCapitalPos.q,
      r: playerCapitalPos.r,
      minDist: minDystObcyOdGracza
    };
    const foreignRepack = packCityStatesAroundCapital(
      ladowe,
      region,
      { q: foreignCap.q, r: foreignCap.r },
      stateCityCount,
      MIN_DIST_FOREIGN_IN_CLUSTER,
      seed + ci * 2654435761 >>> 0,
      { excludeHex: { q: foreignCap.q, r: foreignCap.r }, anchor: foreignAnchor }
    );
    const foreignCities = [{
      q: foreignCap.q,
      r: foreignCap.r,
      isCapital: true
    }];
    for (const s of foreignRepack.stateCities) {
      foreignCities.push({ q: s.q, r: s.r, isCapital: false });
    }
    klastry.push({
      typIndex: klastry.length,
      typ: activeKlucze[ci] ?? `typ${ci}`,
      centrum: foreignLayoutResult.centrum,
      miasta: foreignCities,
      growthSlot: foreignRepack.growthSlot ?? foreignLayoutResult.growthSlot
    });
  }
  if (typeof console !== "undefined") {
    for (let ci = 0; ci < klastry.length; ci++) {
      const k = klastry[ci];
      if (k.miasta.length < stateCityCount + 1) {
        console.warn(
          `[clusters] Klaster '${k.typ}' (region ${ci}): tylko ${k.miasta.length}/${stateCityCount + 1} miast (region za ma\u0142y: ${regiony[ci].length} pol ladowych)`
        );
      }
    }
  }
  const placedTypy = klastry.filter((k) => k.miasta.length > 0).length;
  return {
    rozmiarMapy,
    aktywneTypy: placedTypy,
    requestedTypy: nTypy,
    minDystansMiastaPanstwa: minDystMiastaPanstwa,
    maxDystansMiastaPanstwa: CLUSTER_CITY_STATE_MAX_HEX,
    minDystansObcyOdGracza: minDystObcyOdGracza,
    playerTypIndex: 0,
    klastry
  };
}

// src/map/generator.ts
var DEFAULT_WIDTH = 36;
var DEFAULT_HEIGHT = 28;
function generateMap(width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT, seed = 42, typ = "kontynenty", genOpts, onProgress) {
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
  } else {
    zoneCenters = buildContinentCenters(
      rand,
      nCenters,
      { width, height, anchorCenter: typ === "pangea" }
    );
  }
  const nZones = typ === "kontynenty" || typ === "wyspy" ? zoneCenters.length : 0;
  const zoneOf = typ === "kontynenty" ? assignContinentIndices(width, height, zoneCenters) : typ === "wyspy" ? assignIslandGridIndices(width, height) : null;
  const hexes = {};
  const landScores = /* @__PURE__ */ new Map();
  const terrainScratch = /* @__PURE__ */ new Map();
  reportMapGenPhase(onProgress, 1, MAP_GEN_PHASE_LABELS.prep, 100);
  const terrainRowStep = Math.max(1, Math.floor(height / 24));
  for (let r = 0; r < height; r++) {
    for (let q = 0; q < width; q++) {
      const coords = { q, r };
      const key = `${q},${r}`;
      let landMask;
      if (typ === "pangea") {
        landMask = landMaskPangea(q, r, width, height, perm, shape.noiseScale, sparseLand);
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
  reportMapGenPhase(onProgress, 3, MAP_GEN_PHASE_LABELS.landSea, 5);
  const coastOpts = typ === "pangea" ? { maxInlandPoolSize: 24 } : typ === "kontynenty" ? { maxInlandPoolSize: 8 } : void 0;
  if (typ === "kontynenty") {
    removeSmallInlandWaterPools(hexes, width, height, 8);
    trimEnclosedOceanOnly(hexes, width, height);
  } else if (typ !== "pangea") {
    removeInlandWaterPools(hexes, width, height);
  } else {
    removeInlandSeaPools(hexes, width, height);
  }
  if (typ === "pangea") {
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
  } else {
    rebalanceLandFractionWithMargins(hexes, landScores, landFraction, width, height);
  }
  if (typ !== "ziemia") {
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
  reportMapGenPhase(onProgress, 5, MAP_GEN_PHASE_LABELS.coast, 20);
  thickenCoastAndSmoothInlets(hexes, width, height, 2);
  if (typ === "ziemia") {
    purgeStrayLandOutsideEarthMask(hexes, width, height);
    applyCoastRing(hexes);
  }
  enforceMapBorderOcean(hexes, width, height);
  enforceLatitudinalOceanBuffer(hexes, width, height, typ === "ziemia");
  reportMapGenPhase(onProgress, 5, MAP_GEN_PHASE_LABELS.coast, 100);
  reportMapGenPhase(onProgress, 6, MAP_GEN_PHASE_LABELS.riversMain, 0);
  const riversTier = genOpts?.worldDensity?.rivers ?? "medium";
  const riverParams = resolveRiverMapParams(riversTier, width, height);
  clearRiverMarks(hexes);
  let { paths: riverPaths, kinds: riverPathKinds } = generateRivers(hexes, width, height, rand, {
    minLen: riverParams.minLen,
    maxLen: riverParams.maxLen,
    margin: wgn.riverTrace.margin,
    riversTier,
    worldTyp: typ,
    riverParams,
    onProgress: (localPct) => {
      reportMapGenPhase(onProgress, 6, MAP_GEN_PHASE_LABELS.riversMain, localPct);
    }
  });
  reportMapGenPhase(onProgress, 6, MAP_GEN_PHASE_LABELS.riversMain, 100);
  reportMapGenPhase(onProgress, 7, MAP_GEN_PHASE_LABELS.riversFill, 5);
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
      reportMapGenPhase(onProgress, 7, MAP_GEN_PHASE_LABELS.riversFill, localPct * 0.35);
    }
  );
  stripRiverMarksFromOpenSea(hexes);
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
      reportMapGenPhase(onProgress, 7, MAP_GEN_PHASE_LABELS.riversFill, 35 + localPct * 0.35);
    }
  );
  reportMapGenPhase(onProgress, 7, MAP_GEN_PHASE_LABELS.riversFill, 72);
  ({ paths: riverPaths, kinds: riverPathKinds } = pruneOrphanRiverPaths(hexes, riverPaths, riverPathKinds, width, height));
  ({ paths: riverPaths, kinds: riverPathKinds } = pruneRiversNotReachingRealSea(hexes, riverPaths, riverPathKinds, width, height));
  reportMapGenPhase(onProgress, 7, MAP_GEN_PHASE_LABELS.riversFill, 85);
  flattenFalseCoastalRiverNotches(hexes, width, height);
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
  reportMapGenPhase(onProgress, 8, MAP_GEN_PHASE_LABELS.forest, 10);
  reapplyForestOverlay(hexes, terrainScratch, terrainTh, typ, forestTier, zoneOf, nZones, height);
  ensureForestGridCoverage(hexes, terrainScratch, forestTier, typ, zoneOf, nZones, rand);
  reportMapGenPhase(onProgress, 8, MAP_GEN_PHASE_LABELS.forest, 100);
  reportMapGenPhase(onProgress, 9, MAP_GEN_PHASE_LABELS.deposits, 15);
  placeDeposits(hexes, effectiveSeed, void 0, wgn.resourceMult, wgn.resourceBaseline);
  ensureDepositGridCoverage(hexes, reliefTier, typ, zoneOf, nZones, rand);
  stripDepositsFromWater(hexes);
  reportMapGenPhase(onProgress, 9, MAP_GEN_PHASE_LABELS.deposits, 100);
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
  reportMapGenPhase(onProgress, 10, MAP_GEN_PHASE_LABELS.starts, 100);
  return {
    szerokoscQ: width,
    wysokoscR: height,
    hexes,
    seed: effectiveSeed,
    riverPaths,
    riverPathKinds,
    startPositions
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
  const [w2, h2] = ROZMIAR_DIMS[rozmiar];
  return { w: w2, h: h2 };
}
function menuLabelToDims(label) {
  return rozmiarToDims(rozmiarFromMenuLabel(label));
}
function generujSwiat(seed, rozmiar, typ = "kontynenty", genOpts, onProgress) {
  const effectiveSeed = seed && seed !== 0 ? seed : (Date.now() ^ 3735928559) >>> 0 || 42;
  const [w2, h2] = ROZMIAR_DIMS[rozmiar];
  reportMapGenPhase(onProgress, 1, MAP_GEN_PHASE_LABELS.prep, 0);
  const map2 = generateMap(w2, h2, effectiveSeed, typ, genOpts, onProgress);
  onProgress?.("Gotowe", 100, MAP_GEN_PHASE_TOTAL, MAP_GEN_PHASE_TOTAL);
  return map2;
}

// src/game/city-names-pool.ts
function nazwaKlastraAt(names, index, fallback) {
  if (index >= 0 && index < names.length && names[index]) {
    return names[index];
  }
  return fallback;
}
function poolEntry(pools, ikonaId) {
  return pools[ikonaId];
}
function rivalPoolIndex(rivalIndex1Based, poolLen) {
  if (poolLen <= 1) return 0;
  const rivalSlots = poolLen - 1;
  return (Math.max(1, rivalIndex1Based) - 1) % rivalSlots + 1;
}
function stateCityNameAt(pools, ikonaId, index, fallback) {
  const pan = poolEntry(pools, ikonaId)?.miasta_panstwa;
  if (!pan?.length) return fallback;
  const idx = index >= 1 ? rivalPoolIndex(index, pan.length) : index;
  if (idx >= 0 && idx < pan.length && pan[idx]) {
    return pan[idx];
  }
  return fallback;
}
function playerCapitalFromPool(pools, ikonaId) {
  return stateCityNameAt(pools, ikonaId, 0, "Stolica");
}
function clusterRivalFromPool(pools, ikonaId, rivalIndex1Based) {
  const entry = poolEntry(pools, ikonaId);
  const pan = entry?.miasta_panstwa ?? [];
  const fallback = `Rywal ${rivalIndex1Based}`;
  if (!pan.length || rivalIndex1Based < 1) {
    return fallback;
  }
  const rivalSlots = pan.length - 1;
  if (rivalIndex1Based <= rivalSlots) {
    const idx = rivalPoolIndex(rivalIndex1Based, pan.length);
    const name = pan[idx];
    if (name) return name;
  }
  const regular = entry?.miasta_cywilizacji ?? [];
  const usedInCluster = new Set(pan.filter(Boolean));
  const overflowIndex = rivalIndex1Based - rivalSlots - 1;
  let skipped = 0;
  for (const name of regular) {
    if (!name || usedInCluster.has(name)) continue;
    if (skipped === overflowIndex) return name;
    skipped++;
  }
  const base = regular.find((n) => n && !usedInCluster.has(n));
  if (base) {
    return cityNameWithSuffix(base, overflowIndex + 2);
  }
  return fallback;
}
function foreignCapitalFromPool(pools, ikonaId) {
  return stateCityNameAt(pools, ikonaId, 0, ikonaId);
}
function cityNameWithSuffix(base, ordinal) {
  if (ordinal <= 1) return base;
  const roman = ["", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
  const suffix = ordinal <= 10 ? roman[ordinal] : String(ordinal);
  return `${base} ${suffix}`;
}

// src/game/civ-names.ts
function findCivByIkonaId(civs, ikonaId) {
  return civs.cywilizacje.find((c) => c.ikonaId === ikonaId);
}
function getNazwyKlastra(civs, ikonaId) {
  const def = findCivByIkonaId(civs, ikonaId);
  return def?.nazwyKlastra ?? [];
}
function playerStartCityName(civs, playerCivId, pools) {
  if (pools?.[playerCivId]) {
    return playerCapitalFromPool(pools, playerCivId);
  }
  const names = getNazwyKlastra(civs, playerCivId);
  return nazwaKlastraAt(names, 0, "Stolica");
}
function clusterRivalCityName(civs, playerCivId, rivalIndex1Based, pools) {
  if (pools?.[playerCivId]) {
    return clusterRivalFromPool(pools, playerCivId, rivalIndex1Based);
  }
  const names = getNazwyKlastra(civs, playerCivId);
  if (!names.length) return `Rywal ${rivalIndex1Based}`;
  const idx = rivalIndex1Based >= 1 ? rivalPoolIndex(rivalIndex1Based, names.length) : rivalIndex1Based;
  return nazwaKlastraAt(names, idx, `Rywal ${rivalIndex1Based}`);
}
function foreignCapitalCityName(civs, typIkonaId, pools) {
  if (pools?.[typIkonaId]) {
    return foreignCapitalFromPool(pools, typIkonaId);
  }
  const names = getNazwyKlastra(civs, typIkonaId);
  return nazwaKlastraAt(names, 0, typIkonaId);
}

// src/map/cluster-spawn.ts
function landHexesFromMap(map2) {
  const out = [];
  for (const h2 of Object.values(map2.hexes)) {
    if (h2.terenBazowy === "morze" /* Morze */ || h2.terenBazowy === "gory" /* Gory */ || h2.terenBazowy === "wybrzeze" /* Wybrzeze */ || h2.terenBazowy === "polarny" /* Polarny */) continue;
    out.push({ q: h2.coords.q, r: h2.coords.r });
  }
  return out;
}
function capitalOf(klaster) {
  const cap = klaster.miasta.find((m) => m.isCapital) ?? klaster.miasta[0];
  return cap ? { q: cap.q, r: cap.r } : null;
}
function groupForeignTypeClusters(slots) {
  const byTyp = /* @__PURE__ */ new Map();
  for (const slot of slots) {
    if (slot.isSameTypeRival) continue;
    let group = byTyp.get(slot.typ);
    if (!group) {
      group = { typ: slot.typ, ownerIds: [], positions: [] };
      byTyp.set(slot.typ, group);
    }
    group.ownerIds.push(slot.ownerId);
    group.positions.push({ q: slot.q, r: slot.r });
  }
  return [...byTyp.values()];
}
function buildClusterSpawnPlan(input) {
  const {
    map: map2,
    civs,
    seed,
    playerTyp,
    rywaleNaKlaster,
    aktywneTypy,
    startEpochId,
    cityNamesPools
  } = input;
  const placement2 = computeClusters(map2, {
    seed,
    playerTyp,
    rywaleNaKlaster,
    aktywneTypy,
    startEpochId,
    civRoster: civs.cywilizacje
  });
  const playerCluster = placement2.klastry[placement2.playerTypIndex];
  const fallbackHex = { q: 0, r: 0 };
  if (!playerCluster || playerCluster.miasta.length === 0) {
    return {
      playerStartHex: fallbackHex,
      playerStartCityName: playerStartCityName(civs, playerTyp, cityNamesPools),
      slots: [],
      foreignTypeClusters: [],
      placement: placement2,
      pendingSameTypeRivals: rywaleNaKlaster,
      pendingSameTypeRivalHexes: [],
      clusterCapitalOwnerIds: []
    };
  }
  const capPosRaw = capitalOf(playerCluster) ?? fallbackHex;
  const land = landHexesFromMap(map2);
  const masses = groupHabitableMasses(land);
  let capPos = capPosRaw;
  if (!passesPlayerStartMassGate(map2, capPos.q, capPos.r, masses)) {
    const mapCenter = {
      q: (map2.szerokoscQ - 1) / 2,
      r: (map2.wysokoscR - 1) / 2
    };
    const fixed = pickPlayerClusterCenter(map2, masses, land, mapCenter, mulberry32(seed));
    if (fixed) capPos = fixed;
  }
  const slots = [];
  const clusterCapitalOwnerIds = [];
  let nextOwnerId = 1;
  const pendingSameTypeRivals = rywaleNaKlaster;
  const pendingSameTypeRivalHexes = playerCluster.pendingStateSlots?.slice() ?? [];
  for (const klaster of placement2.klastry) {
    if (klaster.typIndex === placement2.playerTypIndex) continue;
    let rivalIdx = 0;
    for (const m of klaster.miasta) {
      const ownerId = nextOwnerId++;
      let nazwa;
      if (m.isCapital) {
        nazwa = foreignCapitalCityName(civs, klaster.typ, cityNamesPools);
        clusterCapitalOwnerIds.push(ownerId);
      } else {
        rivalIdx += 1;
        nazwa = clusterRivalCityName(civs, klaster.typ, rivalIdx, cityNamesPools);
      }
      slots.push({
        ownerId,
        q: m.q,
        r: m.r,
        nazwaMiasta: nazwa,
        typ: klaster.typ,
        isSameTypeRival: false,
        isPlayerCapital: false,
        isClusterCapital: m.isCapital
      });
    }
  }
  return {
    playerStartHex: capPos,
    playerStartCityName: playerStartCityName(civs, playerTyp, cityNamesPools),
    slots,
    foreignTypeClusters: groupForeignTypeClusters(slots),
    placement: placement2,
    pendingSameTypeRivals,
    pendingSameTypeRivalHexes,
    clusterCapitalOwnerIds
  };
}
function displayLabelForSlot(_civs, slot) {
  return slot.nazwaMiasta;
}

// data/civs.json
var civs_default = {
  cywilizacje: [
    {
      Cywilizacja: "Grecy",
      "Styl / charakter": "defensywna piechota",
      "Jednostka specjalna": "Falanga (Hoplita)",
      "Bonus startowy": "+Obrona piechoty; silna od frontu, odpiera szar\u017C\u0119",
      "Bonusy/minusy (do dopracowania)": "wolniejszy ruch",
      Uwagi: "epoka Br\u0105zu",
      Religia: "Politeizm olimpijski",
      nazwyKlastra: [
        "Ateny",
        "Sparta",
        "Korynt",
        "Teby",
        "Argos",
        "Mykeny",
        "Milet",
        "Rodos",
        "Syrakuzy",
        "Delfy"
      ],
      mnoznikHandelPieniadz: 2.3,
      ikonaId: "grecy",
      wodzowiePula: ["Perykles", "Temistokles", "Miltiades", "Kimon", "Solon", "Kleistenes", "Lizander", "Epaminondas", "Pelopidas", "Alkibiades"],
      wodzowie: {
        kamien: "Minos",
        braz: "Agamemnon",
        zelazo: "Leonidas",
        antyk: "Aleksander Wielki"
      },
      kolorHex: "#1E5AA8",
      bonusy: [
        {
          typ: "bonus_obrona",
          cel: "piechota",
          wartosc: 0.2,
          opis: "Falanga: +20% obrony piechoty przy ataku frontalnym (szyld i oszczep)",
          realizuje: "walka"
        },
        {
          typ: "jednostka_specjalna",
          cel: "piechota",
          wartosc: [
            "Falanga",
            "Wojownik myke\u0144ski",
            "Rydwan myke\u0144ski",
            "Thorakites"
          ],
          opis: "Hoplita = ulepszona piechota z tarcz\u0105; silna od frontu, odpiera szar\u017C\u0119 kawalerii",
          realizuje: "walka"
        },
        {
          typ: "bonus_zloto",
          cel: "handel",
          wartosc: 0.15,
          opis: "Morskie szlaki handlowe: +15% Daniny z port\xF3w i dr\xF3g morskich (Korynt, Ateny)",
          realizuje: "ekonomia"
        },
        {
          typ: "bonus_pobor_regen",
          cel: "rekruci",
          wartosc: -0.15,
          opis: "Mniejsze pa\u0144stwa-miasta: wolniejsza odnowa poboru (\u221215% regen/tur\u0119 vs standard 10%)",
          realizuje: "ekonomia"
        }
      ],
      typCywilizacji: "grecy",
      archetyp: "grecy",
      epokaWejscia: "kamien",
      epokiStartowe: [
        "kamien"
      ],
      nazwyMiast: [
        "Ateny",
        "Sparta",
        "Korynt",
        "Teby",
        "Argos",
        "Mykeny",
        "Milet",
        "Rodos",
        "Syrakuzy",
        "Delfy",
        "Olimpia",
        "Efez",
        "Pergamon",
        "Halikarnas",
        "Knossos",
        "Faistos",
        "Chania",
        "Epidauros",
        "Nafplion",
        "Megara",
        "Eleusis",
        "Maraton",
        "Platoje",
        "Chalkida",
        "Eretria",
        "Larisa",
        "Farsalos",
        "Trikala",
        "Iolkos",
        "Demetrias",
        "Ambrakia",
        "Nikopolis",
        "Dodona",
        "Patras",
        "Elis",
        "Pylos",
        "Messene",
        "Gytheion",
        "Monemwazja",
        "Mistra",
        "Tegea",
        "Mantineja",
        "Orchomenos",
        "Chaironeja",
        "Lebadeia",
        "Tanagra",
        "Aulis",
        "Amfissa",
        "Naupaktos",
        "Kalydon",
        "Stratos",
        "Apollonia Illiryjska",
        "Epidamnos",
        "Korkyra",
        "Zakintos",
        "Kefalonia",
        "Itaka",
        "Leukas",
        "Samos",
        "Chios",
        "Mitylena",
        "Fokaja",
        "Smyrna",
        "Klazomeny",
        "Kolofon",
        "Teos",
        "Erytraj",
        "Priene",
        "Magnezja",
        "Milas",
        "Knidos",
        "Kos",
        "Kalymnos",
        "Astypalaia",
        "Naksos",
        "Paros",
        "Melos",
        "Tera",
        "Delos",
        "Andros",
        "Tenos",
        "Mykonos",
        "Kytnos",
        "Sifnos",
        "Ios",
        "Amorgos",
        "Karpatos",
        "Gortyna",
        "Kydonia",
        "Lyktos",
        "Polirinia",
        "Eleutherna",
        "Aptera",
        "Kyrena",
        "Bizantion",
        "Selinunt",
        "Agrygent",
        "Gela",
        "Katania",
        "Messyna"
      ]
    },
    {
      Cywilizacja: "Rzymianie",
      "Styl / charakter": "ofensywna piechota + in\u017Cynieria",
      "Jednostka specjalna": "Legion (Legionista)",
      "Bonus startowy": "silny atak + pancerz; szybsza budowa dr\xF3g/budynk\xF3w; +Morale (dyscyplina)",
      "Bonusy/minusy (do dopracowania)": "wy\u017Csze utrzymanie armii",
      Uwagi: null,
      Religia: "Religia rzymska / kult pa\u0144stwa",
      nazwyKlastra: [
        "Rzym",
        "Ostia",
        "Kapua",
        "Pompeje",
        "Tarent",
        "Mediolan",
        "Akwileja",
        "Rawenna",
        "Weje",
        "Ancjum"
      ],
      mnoznikHandelPieniadz: 2,
      ikonaId: "rzymianie",
      wodzowiePula: ["Kamillus", "Cyncynat", "Fabiusz Maksymus", "Katon Starszy", "Emiliusz Paulus", "Klaudiusz", "Waleriusz", "Korneliusz", "Serwiliusz", "Fulwiusz"],
      wodzowie: {
        kamien: "Romulus",
        braz: "Numa Pompiliusz",
        zelazo: "Scypion Afryka\u0144ski",
        antyk: "Juliusz Cezar"
      },
      kolorHex: "#8B1A1A",
      bonusy: [
        {
          typ: "bonus_walka",
          cel: "piechota",
          wartosc: 0.15,
          opis: "Legion: +15% ataku i pancerza piechoty szturmowej; dyscyplina bojowa +morale",
          realizuje: "walka"
        },
        {
          typ: "koszt_redukcja",
          cel: "budynki",
          wartosc: 0.2,
          opis: "In\u017Cynieria rzymska: -20% kosztu Produkcji budowli; szybsza budowa dr\xF3g",
          realizuje: "miasto"
        },
        {
          typ: "jednostka_specjalna",
          cel: "piechota",
          wartosc: [
            "Hastati",
            "Triari"
          ],
          opis: "Legionista = ci\u0119\u017Cka piechota z pilum; silny atak + pancerz + morale",
          realizuje: "walka"
        },
        {
          typ: "mnoznik_manpower_max",
          cel: "rekruci",
          wartosc: 2,
          opis: "Legiony: 2\xD7 pula Manpower na obywatela (np. 2000 vs 1000 w epoce Kamie\u0144)",
          realizuje: "ekonomia"
        },
        {
          typ: "bonus_pobor_regen",
          cel: "rekruci",
          wartosc: 1,
          opis: "Dyscyplina legion\xF3w: 2\xD7 szybsza odnowa poboru (4% max/tur\u0119 vs standard 2%)",
          realizuje: "ekonomia"
        }
      ],
      typCywilizacji: "rzymianie",
      archetyp: "rzym",
      epokaWejscia: "kamien",
      epokiStartowe: [
        "kamien"
      ],
      nazwyMiast: [
        "Rzym",
        "Ostia",
        "Kapua",
        "Pompeje",
        "Tarent",
        "Mediolan",
        "Akwileja",
        "Rawenna",
        "Weje",
        "Ancjum",
        "Neapol",
        "Herkulanum",
        "Werona",
        "Padwa",
        "Brescia",
        "Turyn",
        "Genua",
        "Piza",
        "Florencja",
        "Perugia",
        "Asy\u017C",
        "Rimini",
        "Bolonia",
        "Parma",
        "Modena",
        "Ferrara",
        "Terracina",
        "Formia",
        "Gaeta",
        "Brindisi",
        "Bari",
        "Otranto",
        "Lecce",
        "Reggio Kalabria",
        "Krotona",
        "Sybaris",
        "Metapont",
        "Lokri",
        "Cumae",
        "Puzzole",
        "Benewent",
        "Alba Longa",
        "Tuskulum",
        "Preneste",
        "Tibur",
        "Antium",
        "Lawinium",
        "Fidenae",
        "Cerveteri",
        "Tarquinia",
        "Volterra",
        "Arezzo",
        "Kortona",
        "Chiusi",
        "Perugia Etruska",
        "Vulci",
        "Populonia",
        "Fiesole",
        "Luka",
        "Pistoia",
        "Akwilea Nowa",
        "Trewir",
        "Kolonia",
        "Moguncja",
        "Augsburg",
        "Wiede\u0144 Rzymski",
        "Lugdunum",
        "Massalia",
        "Arles",
        "Nimes",
        "Narbona",
        "Tuluza",
        "Bordeaux",
        "Londinium",
        "York",
        "Bath",
        "Chester",
        "Kartagena Hiszpa\u0144ska",
        "Tarragona",
        "Merida",
        "Sewilla",
        "Kordoba",
        "Saragossa",
        "Efez Rzymski",
        "Antiochia",
        "Damaszek",
        "Cezarea Nadmorska",
        "Aleksandria",
        "Cyrena",
        "Leptis Magna",
        "Sabratha",
        "Utica",
        "Timgad",
        "Volubilis",
        "Bizancjum",
        "Nikomedia",
        "Tesaloniki",
        "Filippi",
        "Dyrrachium",
        "Salona"
      ]
    },
    {
      Cywilizacja: "Chi\u0144czycy",
      "Styl / charakter": "dystans + kawaleria",
      "Jednostka specjalna": "Je\u017Adziec chi\u0144ski",
      "Bonus startowy": "lepsi \u0142ucznicy (+Atak/zasi\u0119g) i lepsza konnica (+Uderzenie)",
      "Bonusy/minusy (do dopracowania)": "s\u0142absza piechota szturmowa wr\u0119cz (nacisk na dystans i konnic\u0119)",
      Uwagi: "wczesna przewaga w wojnie dystansowej",
      Religia: "Konfucjanizm / Taoizm",
      nazwyKlastra: [
        "Qin",
        "Qi",
        "Chu",
        "Jin",
        "Yan",
        "Zhao",
        "Wei",
        "Han",
        "Lu",
        "Song"
      ],
      mnoznikHandelPieniadz: 2.4,
      ikonaId: "chinczycy",
      wodzowiePula: ["Cheng Tang", "Wu Ding", "Wen Wang", "Zhou Gong", "Goujian", "Fuchai", "Hel\xFC", "Ksiaze Mu", "Ksiaze Huan", "Zhuang"],
      wodzowie: {
        kamien: "Huang Di",
        braz: "Yu Wielki",
        zelazo: "Qin Shi Huang",
        antyk: "Han Wudi"
      },
      kolorHex: "#C41E3A",
      bonusy: [
        {
          typ: "bonus_walka",
          cel: "lukownicy",
          wartosc: 0.2,
          opis: "\u0141ucznicy: +20% ataku i zasi\u0119gu jednostek dystansowych (przewaga dystansowa)",
          realizuje: "walka"
        },
        {
          typ: "bonus_walka",
          cel: "kawaleria",
          wartosc: 0.15,
          opis: "Konnica stepowa: +15% uderzenia kawalerii przy szar\u017Cy",
          realizuje: "walka"
        },
        {
          typ: "jednostka_specjalna",
          cel: "kawaleria",
          wartosc: [
            "Je\u017Adziec chi\u0144ski",
            "Halabardnik Shang",
            "Rydwan Shang"
          ],
          opis: "Chi\u0144scy specjali\u015Bci: Je\u017Adziec chi\u0144ski (kawaleria stepowa), Halabardnik Shang (elitarna piechota), Rydwan Shang (rydwan bojowy)",
          realizuje: "walka"
        }
      ],
      typCywilizacji: "chinczycy",
      archetyp: "chiny",
      epokaWejscia: "kamien",
      epokiStartowe: [
        "kamien"
      ],
      nazwyMiast: [
        "Xi'an",
        "Luoyang",
        "Pekin",
        "Nankin",
        "Kaifeng",
        "Hangzhou",
        "Suzhou",
        "Chengdu",
        "Chongqing",
        "Wuhan",
        "Guangzhou",
        "Shanghai",
        "Tianjin",
        "Shenyang",
        "Harbin",
        "Jinan",
        "Taiyuan",
        "Zhengzhou",
        "Anyang",
        "Handan",
        "Linzi",
        "Yingdu",
        "Xianyang",
        "Datong",
        "Dunhuang",
        "Turfan",
        "Kaszgar",
        "Lanzhou",
        "Yinchuan",
        "Xining",
        "Kunming",
        "Guiyang",
        "Nanning",
        "Fuzhou",
        "Xiamen",
        "Quanzhou",
        "Ningbo",
        "Wenzhou",
        "Shaoxing",
        "Jiaxing",
        "Wuxi",
        "Changzhou",
        "Yangzhou",
        "Zhenjiang",
        "Hefei",
        "Nanchang",
        "Changsha",
        "Guilin",
        "Luoyi",
        "Chang'an Nowy",
        "Pingyao",
        "Qufu",
        "Zoucheng",
        "Jining",
        "Dezhou",
        "Weifang",
        "Yantai",
        "Qingdao",
        "Weihai",
        "Baoding",
        "Shijiazhuang",
        "Handan Nowy",
        "Xingtai",
        "Luoning",
        "Sanmenxia",
        "Nanyang",
        "Xiangyang",
        "Jingzhou",
        "Yichang",
        "Jingmen",
        "Ying",
        "Shou Chun",
        "Chen",
        "Song Cheng",
        "Pengcheng",
        "Xiapi",
        "Guangling",
        "Jiankang",
        "Jiangling",
        "Wancheng",
        "Chengzhou",
        "Jinyang",
        "Anyi",
        "Yong",
        "Yueyang",
        "Fenyang",
        "Puzhou",
        "Wei Cheng",
        "Daliang",
        "Ye",
        "Handan Stary",
        "Zhongshan",
        "Jicheng",
        "Xiadu",
        "Liaoyang",
        "Yan Cheng",
        "Jimo",
        "Bohai",
        "Laizhou",
        "Dengzhou"
      ]
    },
    {
      Cywilizacja: "Inkowie",
      "Styl / charakter": "nauka/kultura + elitarna piechota",
      "Jednostka specjalna": "Chaska (maczuga gwia\u017Adzista) + Kr\xF3lewska Gwardia (elita)",
      "Bonus startowy": "+Nauka/Kultura (kalendarz); bonus w lesie/d\u017Cungli",
      "Bonusy/minusy (do dopracowania)": "brak konnicy i rydwan\xF3w (brak koni/wo\u0142\xF3w; \xA78c) \u2014 si\u0142a w piechocie i dystansie",
      Uwagi: null,
      Religia: "Kult S\u0142o\u0144ca Inti",
      nazwyKlastra: [
        "Cusco",
        "Machu Picchu",
        "Ollantaytambo",
        "Pisac",
        "Sacsayhuam\xE1n",
        "Vilcabamba",
        "Cajamarca",
        "Tambo Colorado",
        "Quito",
        "Tumbes"
      ],
      mnoznikHandelPieniadz: 1.9,
      ikonaId: "inkowie",
      wodzowiePula: ["Sinchi Roca", "Lloque Yupanqui", "Mayta Capac", "Capac Yupanqui", "Inca Roca", "Yahuar Huacac", "Tupac Yupanqui", "Huayna Capac", "Atahualpa", "Huascar"],
      wodzowie: {
        kamien: "Manco C\xE1pac",
        braz: "Wirakocza Inka",
        zelazo: "Pachacuti",
        antyk: "T\xFApac Inca Yupanqui"
      },
      kolorHex: "#D4A017",
      bonusy: [
        {
          typ: "bonus_nauka",
          cel: "wszystko",
          wartosc: 0.15,
          opis: "Kalendarz s\u0142oneczny: +15% produkcji punkt\xF3w nauki (astronomia i agronomia)",
          realizuje: "ekonomia"
        },
        {
          typ: "bonus_walka",
          cel: "piechota",
          wartosc: 0.2,
          opis: "Teren g\xF3rski: +20% walki w lesie i d\u017Cungli (znajomo\u015B\u0107 terenu)",
          realizuje: "walka"
        },
        {
          typ: "jednostka_specjalna",
          cel: "piechota",
          wartosc: [
            "Wojownik z maczug\u0105 (Chaska)",
            "Wojownik z toporem",
            "Procarz (Huaracoc)",
            "Oszczepnik (Est\xF3lica)",
            "Gwardzista z champi"
          ],
          opis: "Chaska (maczuga gwia\u017Adzista) = elitarna piechota; Kr\xF3lewska Gwardia = oddzia\u0142y presti\u017Cowe",
          realizuje: "walka"
        }
      ],
      typCywilizacji: "inkowie",
      archetyp: "inkowie",
      epokaWejscia: "kamien",
      epokiStartowe: [
        "kamien"
      ],
      nazwyMiast: [
        "Cusco",
        "Machu Picchu",
        "Ollantaytambo",
        "Pisac",
        "Sacsayhuam\xE1n",
        "Vilcabamba",
        "Cajamarca",
        "Tambo Colorado",
        "Quito",
        "Tumbes",
        "Chan Chan",
        "Chavin de Huantar",
        "Tiwanaku",
        "Pachacamac",
        "Nazca",
        "Caral",
        "Kuelap",
        "Choquequirao",
        "Wi\xF1ay Wayna",
        "Moray",
        "Tipon",
        "Raqchi",
        "Huanuco Pampa",
        "Vilcashuaman",
        "Chinchero",
        "Pisac Nowy",
        "Ancon",
        "Sipan",
        "T\xFAcume",
        "Bat\xE1n Grande",
        "Sican",
        "Huaca del Sol",
        "Huaca de la Luna",
        "Chavin",
        "Sillustani",
        "Puno",
        "Copacabana",
        "Chucuito",
        "Juli",
        "Pomata",
        "Lampa",
        "Azangaro",
        "Ayaviri",
        "Huancayo",
        "Jauja",
        "Tarma",
        "Huanuco",
        "Cerro de Pasco",
        "Huaraz",
        "Recuay",
        "Huamachuco",
        "Marcahuamachuco",
        "Cajamarquilla",
        "Lima Inkaska",
        "Ica",
        "Pisco",
        "Paracas",
        "Arequipa",
        "Moquegua",
        "Tacna",
        "Arica",
        "Potosi",
        "La Paz Inkaska",
        "Oruro",
        "Cochabamba",
        "Sucre",
        "Charcas",
        "Chuquisaca",
        "Samaipata",
        "Incallajta",
        "Iskanwaya",
        "Quito Nowe",
        "Latacunga",
        "Ambato",
        "Riobamba",
        "Cuenca",
        "Loja",
        "Ingapirca",
        "Tomebamba",
        "Saraguro",
        "Ca\xF1aribamba",
        "Piura",
        "Chulucanas",
        "Lambayeque",
        "Chiclayo",
        "Trujillo",
        "Huamachuco Nowy",
        "Otuzco",
        "Cajabamba",
        "Celendin",
        "San Marcos",
        "Chota",
        "Bambamarca",
        "Huancabamba",
        "Ayacucho",
        "Huanta",
        "Andahuaylas",
        "Abancay",
        "Curahuasi",
        "Vilcashuaman Nowy"
      ]
    },
    {
      Cywilizacja: "Zulusi",
      "Styl / charakter": "szybka, agresywna piechota",
      "Jednostka specjalna": "Impi",
      "Bonus startowy": "+Ruch i +Morale piechoty; tania, silna w grupie",
      "Bonusy/minusy (do dopracowania)": "s\u0142aby dystans",
      Uwagi: null,
      Religia: "Kult przodk\xF3w / animizm",
      nazwyKlastra: [
        "uMgungundlovu",
        "Ondini",
        "Ulundi",
        "kwaBulawayo",
        "eMakhosini",
        "Nobamba",
        "Nodwengu",
        "kwaDukuza",
        "Mahlabathini",
        "Babanango"
      ],
      mnoznikHandelPieniadz: 1.8,
      ikonaId: "zulusi",
      wodzowiePula: ["Dingane", "Mpande", "Ndaba", "Jama", "Punga", "Mageba", "Zwide", "Sobhuza", "Dingiswayo", "Langalibalele"],
      wodzowie: {
        kamien: "Zulu kaMalandela",
        braz: "Senzangakhona",
        zelazo: "Czaka",
        antyk: "Cetshwayo"
      },
      kolorHex: "#2E7D32",
      bonusy: [
        {
          typ: "bonus_walka",
          cel: "piechota",
          wartosc: 0.2,
          opis: "Ruch i morale: +20% pr\u0119dko\u015Bci piechoty i +morale przy ataku w grupie (formacja buffalo)",
          realizuje: "walka"
        },
        {
          typ: "bonus_walka",
          cel: "piechota",
          wartosc: 0.1,
          opis: "Tania rekrutacja: koszt rekrutacji Impi -10% (liczebno\u015B\u0107 > jako\u015B\u0107)",
          realizuje: "ekonomia"
        },
        {
          typ: "jednostka_specjalna",
          cel: "piechota",
          wartosc: [
            "Impi",
            "Oszczepnik Zulu (Izijula)",
            "iButho z iklwa"
          ],
          opis: "Impi = szybka piechota z assegai; silna w zmasowanym ataku, s\u0142aba na dystans",
          realizuje: "walka"
        }
      ],
      typCywilizacji: "zulusi",
      archetyp: "zulusi",
      epokaWejscia: "kamien",
      epokiStartowe: [
        "kamien"
      ],
      nazwyMiast: [
        "uMgungundlovu",
        "Ondini",
        "Ulundi",
        "kwaBulawayo",
        "eMakhosini",
        "Nobamba",
        "Nodwengu",
        "kwaDukuza",
        "Mahlabathini",
        "Babanango",
        "Isandlwana",
        "kwaGqokli",
        "Eshowe",
        "Empangeni",
        "Nongoma",
        "Nkandla",
        "Mtunzini",
        "Melmoth",
        "Vryheid",
        "Pongola",
        "Hlobane",
        "Kambula",
        "Gingindlovu",
        "Ntombe",
        "Msebe",
        "Ndondakusuka",
        "Ceza",
        "Nkwalini",
        "Mtubatuba",
        "Hluhluwe",
        "Mkuze",
        "Jozini",
        "Ubombo",
        "Manguzi",
        "Sodwana",
        "kwaMbonambi",
        "Richards Bay",
        "St Lucia",
        "Nseleni",
        "Esikhawini",
        "Gibixhegu",
        "esiKlebheni",
        "Mbelebeleni",
        "kwaNzimela",
        "kwaNxumalo",
        "eNtumeni",
        "kwaMagwaza",
        "Hlabisa",
        "Nqutu",
        "Dundee",
        "Utrecht",
        "Newcastle",
        "Ladysmith",
        "Estcourt",
        "Weenen",
        "Greytown",
        "Kranskop",
        "Tugela Ferry",
        "Msinga",
        "Pomeroy",
        "Nkonjeni",
        "Louwsburg",
        "Paulpietersburg",
        "Piet Retief",
        "Golela",
        "Ingwavuma",
        "Mahlangeni",
        "Nondweni",
        "Enseleni",
        "Mandeni",
        "Groutville",
        "Stanger",
        "Tongaat",
        "Verulam",
        "Ndwedwe",
        "KwaMashu",
        "Umlazi",
        "Ntuzuma",
        "Inanda",
        "Amanzimtoti",
        "Umzinto",
        "Scottburgh",
        "Port Shepstone",
        "Harding",
        "Ixopo",
        "Underberg",
        "Bulwer",
        "Impendle",
        "Nottingham Road",
        "Mooi River",
        "Winterton",
        "Bergville",
        "Colenso",
        "Elandslaagte",
        "Glencoe",
        "Hattingspruit",
        "Wasbank",
        "Helpmekaar",
        "Landman's Drift",
        "Nongqayi"
      ]
    },
    {
      Cywilizacja: "Egipt",
      "Styl / charakter": "rydwany + \u0142ucznicy dystansowi",
      "Jednostka specjalna": "Med\u017Caj (Gwardia Faraona)",
      "Bonus startowy": "+Atak dystansowy \u0142ucznik\xF3w; rydwany szybsze, z atakiem dystansowym i du\u017Cym zapasem strza\u0142u (rydwany-\u0142ucznicy)",
      "Bonusy/minusy (do dopracowania)": "s\u0142absza ci\u0119\u017Cka piechota frontalna",
      Uwagi: "Stary \u015Awiat \u2014 pe\u0142ny dost\u0119p do koni/wo\u0142\xF3w/rydwan\xF3w",
      Religia: "Religia egipska \u2014 faraon-b\xF3g",
      nazwyKlastra: [
        "Memfis",
        "Teby",
        "Heliopolis",
        "Abydos",
        "Nekhen",
        "Elefantyna",
        "Sais",
        "Bubastis",
        "Edfu",
        "Dendera"
      ],
      mnoznikHandelPieniadz: 2.1,
      ikonaId: "egipt",
      wodzowiePula: ["Dzeser", "Snofru", "Chefren", "Mykerinos", "Pepi II", "Mentuhotep II", "Amenemhat I", "Totmes III", "Amenhotep III", "Echnaton"],
      wodzowie: {
        kamien: "Narmer",
        braz: "Chufu",
        zelazo: "Ramzes II",
        antyk: "Kleopatra VII"
      },
      kolorHex: "#E8C547",
      bonusy: [
        {
          typ: "bonus_walka",
          cel: "lukownicy",
          wartosc: 0.2,
          opis: "\u0141ucznicy na rydwanach: +20% ataku dystansowego; rydwany z du\u017Cym zapasem strza\u0142",
          realizuje: "walka"
        },
        {
          typ: "bonus_walka",
          cel: "rydwany",
          wartosc: 0.15,
          opis: "Szybkie rydwany: +15% pr\u0119dko\u015Bci i zasi\u0119gu ataku rydwan\xF3w bojowych",
          realizuje: "walka"
        },
        {
          typ: "jednostka_specjalna",
          cel: "piechota",
          wartosc: [
            "\u0141ucznik egipski",
            "\u0141ucznik nubijski",
            "Rydwan egipski",
            "Wojownik z khopesh",
            "Wojownik z \u017Celaznym khopesh"
          ],
          opis: "Med\u017Caj = elitarna gwardia; najlepsza piechota Egiptu, ochrona centrum miasta",
          realizuje: "walka"
        }
      ],
      typCywilizacji: "egipt",
      archetyp: "egipt",
      epokaWejscia: "kamien",
      epokiStartowe: [
        "kamien"
      ],
      nazwyMiast: [
        "Memfis",
        "Teby",
        "Heliopolis",
        "Abydos",
        "Nekhen",
        "Elefantyna",
        "Sais",
        "Bubastis",
        "Edfu",
        "Dendera",
        "Karnak",
        "Luksor",
        "Gize",
        "Sakkara",
        "Abu Simbel",
        "Amarna",
        "Achetaton",
        "Awaris",
        "Tanis",
        "Piramunt",
        "Buto",
        "Naukratis",
        "Rakotis",
        "Aleksandria",
        "Kanopus",
        "Rozetta",
        "Damietta",
        "Mendes",
        "Busiris",
        "Pi-Ramzes",
        "Herakleopolis",
        "Oksyrynchos",
        "Hermopolis",
        "Asjut",
        "Achmim",
        "Koptos",
        "Deir el-Bahari",
        "Deir el-Medina",
        "Medinet Habu",
        "Ramesseum",
        "Esna",
        "Kom Ombo",
        "Aswan",
        "Filae",
        "Kalabsza",
        "Buhen",
        "Kerma",
        "Napata",
        "Meroe",
        "Semna",
        "Faras",
        "Nekropolis Teba\u0144ska",
        "Hut-waret",
        "Xois",
        "Leontopolis",
        "Sebennytos",
        "Athribis",
        "Letopolis",
        "Krokodilopolis",
        "Fajum",
        "Herakleon",
        "Marea",
        "Paretonion",
        "Siwa",
        "Bahariya",
        "Farafra",
        "Dachla",
        "Charga",
        "Elkab",
        "Hierakonpolis",
        "Gebelein",
        "Armant",
        "Tod",
        "Dendur",
        "Amada",
        "Wadi Halfa",
        "Sesebi",
        "Sai",
        "Kawa",
        "Sanam",
        "Gebel Barkal",
        "Nuri",
        "Kurru",
        "Musawwarat",
        "Naga",
        "Sarabit al-Chadim",
        "Timna",
        "Serabit",
        "Tell el-Daba",
        "Tell Basta",
        "Tell el-Amarna",
        "Kom el-Hisn",
        "Kom el-Ahmar",
        "Beni Hasan",
        "El-Bersza",
        "Meir",
        "Qau el-Kebir",
        "Rifa",
        "Matmar",
        "Badari"
      ]
    },
    {
      Cywilizacja: "Sumerowie",
      "Styl / charakter": "ci\u0119\u017Cka piechota + \u0142ucznicy + mocne rydwany",
      "Jednostka specjalna": "Gwardia Kr\xF3lewska Sumeru",
      "Bonus startowy": "+Obrona i Health ci\u0119\u017Ckiej piechoty; silni \u0142ucznicy pieszni; ci\u0119\u017Ckie, mocne rydwany bojowe",
      "Bonusy/minusy (do dopracowania)": "wolniejsza lekka kawaleria",
      Uwagi: "Stary \u015Awiat \u2014 pe\u0142ny dost\u0119p do koni/wo\u0142\xF3w/rydwan\xF3w",
      Religia: "Religia sumeryjska (mezopotamska) \u2014 Enlil/Anu",
      nazwyKlastra: [
        "Uruk",
        "Ur",
        "Lagasz",
        "Kisz",
        "Nippur",
        "Eridu",
        "Umma",
        "Larsa",
        "Adab",
        "Isin"
      ],
      mnoznikHandelPieniadz: 2.2,
      ikonaId: "sumer",
      wodzowiePula: ["Etana", "Enmerkar", "Lugalbanda", "Dumuzi", "Eannatum", "Lugalzagesi", "Meskalamdug", "Mesannepada", "Enannatum", "Entemena"],
      wodzowie: {
        kamien: "Alulim",
        braz: "Gilgamesz",
        zelazo: "Ur-Nammu",
        antyk: "Szulgi"
      },
      kolorHex: "#6B4226",
      bonusy: [
        {
          typ: "bonus_obrona",
          cel: "piechota",
          wartosc: 0.2,
          opis: "Ci\u0119\u017Cka piechota: +20% obrony i HP ci\u0119\u017Ckiej piechoty (pancerz br\u0105zowy + tarcza)",
          realizuje: "walka"
        },
        {
          typ: "bonus_walka",
          cel: "rydwany",
          wartosc: 0.15,
          opis: "Ci\u0119\u017Ckie rydwany bojowe: +15% HP i obrony rydwan\xF3w (masywna konstrukcja)",
          realizuje: "walka"
        },
        {
          typ: "jednostka_specjalna",
          cel: "piechota",
          wartosc: [
            "\u0141ucznik sumeryjski",
            "Rydwan sumeryjski",
            "W\u0142\xF3cznik sumeryjski",
            "\u0141ucznik akadyjski",
            "Mur tarcz (Sargonid)"
          ],
          opis: "Gwardia Kr\xF3lewska = szczyt ci\u0119\u017Ckiej piechoty Sumeru; pancerz i lanca; +obrona miasta",
          realizuje: "walka"
        }
      ],
      typCywilizacji: "sumer",
      archetyp: "sumer",
      epokaWejscia: "kamien",
      epokiStartowe: [
        "kamien"
      ],
      nazwyMiast: [
        "Uruk",
        "Ur",
        "Lagasz",
        "Kisz",
        "Nippur",
        "Eridu",
        "Umma",
        "Larsa",
        "Adab",
        "Isin",
        "Girsu",
        "Szuruppak",
        "Bad-tibira",
        "Sippar",
        "Akszak",
        "Kutha",
        "Marad",
        "Kazallu",
        "Dilbat",
        "Borsippa",
        "Babilon",
        "Kisura",
        "Zabalam",
        "Nina",
        "Guabba",
        "Karkara",
        "Der",
        "Esznunna",
        "Malgium",
        "Terqa",
        "Mari",
        "Ebla",
        "Emar",
        "Tuttul",
        "Nagar",
        "Urkesz",
        "Aszur",
        "Niniwa",
        "Arbela",
        "Nuzi",
        "Arrapha",
        "Susa",
        "Anszan",
        "Awan",
        "Simaszki",
        "Akkad",
        "Agade",
        "Kul-Aba",
        "Kesz",
        "Abu Salabikh",
        "Fara",
        "Tello",
        "Warka",
        "Uqair",
        "Jemdet Nasr",
        "Ubaid",
        "Choga Mami",
        "Tepe Gawra",
        "Hassuna",
        "Samarra",
        "Halaf",
        "Hamoukar",
        "Tell Brak",
        "Tell Leilan",
        "Chagar Bazar",
        "Tell Beydar",
        "Tell Chuera",
        "Kar-Tukulti-Ninurta",
        "Dur-Kurigalzu",
        "Larak",
        "Kullab",
        "Puzrisz-Dagan",
        "Drehem",
        "Tell Agrab",
        "Khafajah",
        "Tell Asmar",
        "Ischali",
        "Nerebtum",
        "Shaduppum",
        "Tuba",
        "Rapiqum",
        "Hit",
        "Anah",
        "Qatna",
        "Alalakh",
        "Ugarit",
        "Karkemisz",
        "Shubat-Enlil",
        "Tell Mozan",
        "Tell Rimah",
        "Tell Taya",
        "Tepe Sialk",
        "Tepe Yahya",
        "Shahr-i Sokhta",
        "Chogha Zanbil",
        "Haft Tepe",
        "Tal-i Malyan",
        "Konar Sandal",
        "Liyan",
        "Bushehr"
      ]
    },
    {
      Cywilizacja: "Celtowie",
      "Styl / charakter": "agresywna piechota z broni\u0105 sieczn\u0105; brawurowa szar\u017Ca",
      "Jednostka specjalna": "Soldurii",
      "Bonus startowy": "+Atak/Morale piechoty przy szar\u017Cy (brawura); d\u0142ugie miecze \u2014 premia do Uderzenia",
      "Bonusy/minusy (do dopracowania)": "s\u0142absza dyscyplina/obrona w przeci\u0105g\u0142ej walce; brak ci\u0119\u017Ckiej formacji",
      Uwagi: "typ g\u0142\xF3wny \xA79d; jedn. spec. Soldurii (Maciej 2026-07-04); Gaesatae = elita najemna w units.json",
      Religia: "Religia celtycka (druidyzm)",
      nazwyKlastra: [
        "Bibracte",
        "Gergowia",
        "Alezja",
        "Avaricum",
        "Uxellodunum",
        "Manching",
        "Numancja",
        "Stradonice",
        "Z\xE1vist",
        "Heuneburg"
      ],
      mnoznikHandelPieniadz: 1.9,
      ikonaId: "celtowie",
      wodzowiePula: ["Dumnoryks", "Divitiakus", "Cassivellaunus", "Kunobelinos", "Orgetoryks", "Kastyk", "Ambioryks", "Indutiomaros", "Tasgetios", "Litawikus"],
      wodzowie: {
        kamien: "Ambigatos",
        braz: "Brennus",
        zelazo: "Wercyngetoryks",
        antyk: "Boudika"
      },
      kolorHex: "#3D6B35",
      bonusy: [
        {
          typ: "bonus_walka",
          cel: "piechota",
          wartosc: 0.25,
          opis: "Brawura szar\u017Cy: +25% ataku piechoty przy pierwszym uderzeniu (furia celtycka)",
          realizuje: "walka"
        },
        {
          typ: "bonus_walka",
          cel: "piechota",
          wartosc: 0.15,
          opis: "Gaesatae: +15% Uderzenia (miecz sieczny, si\u0142a ci\u0119cia)",
          realizuje: "walka"
        },
        {
          typ: "jednostka_specjalna",
          cel: "piechota",
          wartosc: [
            "Soldurii",
            "Rydwan celtycki",
            "Miecznik galijski"
          ],
          opis: "Soldurii \u2014 elitarna gwardia wodza; przysi\u0119ga do \u015Bmierci; silna w szar\u017Cy",
          realizuje: "walka"
        }
      ],
      typCywilizacji: "celtowie",
      archetyp: "celtowie",
      epokaWejscia: "braz",
      epokiStartowe: [
        "braz"
      ],
      nazwyMiast: [
        "Bibracte",
        "Gergowia",
        "Alezja",
        "Avaricum",
        "Uxellodunum",
        "Manching",
        "Numancja",
        "Stradonice",
        "Zavist",
        "Heuneburg",
        "Vix",
        "Mont Lassois",
        "Entremont",
        "Glanum",
        "Ens\xE9rune",
        "Corent",
        "Gondole",
        "Vienne",
        "Genabum",
        "Lutecja",
        "Divodurum",
        "Durocortorum",
        "Samarobriva",
        "Noviodunum",
        "Augustodunum",
        "Augustonemetum",
        "Vesontio",
        "Cabillonum",
        "Matisco",
        "Lugdunum",
        "Genava",
        "Noviodunum Helvetiorum",
        "Aventicum",
        "Vindonissa",
        "Basilia",
        "Turicum",
        "Salodurum",
        "Argentorate",
        "Borbetomagus",
        "Noviomagus",
        "Durocatalaunum",
        "Vellaunodunum",
        "Agedincum",
        "Autricum",
        "Suindinum",
        "Vorgium",
        "Condate",
        "Condevincum",
        "Portus Namnetum",
        "Darioritum",
        "Fanum Martis",
        "Vindinium",
        "Juliomagus",
        "Caesarodunum",
        "Limonum",
        "Mediolanum Santonum",
        "Burdigala",
        "Vesunna",
        "Segodunum",
        "Divona",
        "Nemausus",
        "Ruscino",
        "Ambrussum",
        "Ugernum",
        "Cabellio",
        "Arausio",
        "Vasio",
        "Alba Helviorum",
        "Aletum",
        "Reginca",
        "Vorganium",
        "Isca Dumnoniorum",
        "Camulodunum",
        "Verulamium",
        "Calleva Atrebatum",
        "Venta Belgarum",
        "Durnovaria",
        "Sorviodunum",
        "Corinium",
        "Glevum",
        "Viroconium",
        "Deva",
        "Eboracum",
        "Lindum",
        "Ratae",
        "Venta Icenorum",
        "Noviomagus Reginorum",
        "Maiden Castle",
        "Danebury",
        "Cadbury Castle",
        "Traprain Law",
        "Dun Aengus",
        "Emain Macha",
        "Tara",
        "Dun Ailinne",
        "Cruachan",
        "Navan Fort",
        "Downpatrick",
        "Dinorben",
        "Tre'r Ceiri"
      ]
    },
    {
      Cywilizacja: "Germanie",
      "Styl / charakter": "piechota le\u015Bna; zasadzki i furia bojowa",
      "Jednostka specjalna": "Wojownik germa\u0144ski (framea)",
      "Bonus startowy": "+walka w lesie i +zasadzka (pierwszy cios); furia bojowa (+Atak na starciu)",
      "Bonusy/minusy (do dopracowania)": "wolniejsza technologia/organizacja; s\u0142absze obl\u0119\u017Cnictwo",
      Uwagi: "typ g\u0142\xF3wny (przysz\u0142a kultura \xA79d, pokrewna Galom)",
      Religia: "Religia germa\u0144ska (Wotan / Odyn)",
      nazwyKlastra: [
        "Mattium",
        "Feddersen Wierde",
        "Hodde",
        "Gr\xF8ntoft",
        "Fl\xF6geln",
        "Wijster",
        "Ezinge",
        "Jastorf",
        "Gamla Uppsala",
        "Tofting"
      ],
      mnoznikHandelPieniadz: 1.7,
      ikonaId: "germanie",
      wodzowiePula: ["Marbod", "Segestes", "Segimer", "Inguiomer", "Chariovalda", "Katualda", "Nasua", "Cimberius", "Boioryks", "Teutobod"],
      wodzowie: {
        kamien: "Mannus",
        braz: "Ariowist",
        zelazo: "Arminiusz",
        antyk: "Alaryk I"
      },
      kolorHex: "#4A5568",
      bonusy: [
        {
          typ: "bonus_walka",
          cel: "piechota",
          wartosc: 0.25,
          opis: "Zasadzka le\u015Bna: +25% ataku przy walce w lesie lub przy pierwszym ciosie z zasadzki",
          realizuje: "walka"
        },
        {
          typ: "bonus_walka",
          cel: "piechota",
          wartosc: 0.15,
          opis: "Furia bojowa: +15% ataku na starciu (bonus morale przy bezpo\u015Brednim kontakcie)",
          realizuje: "walka"
        },
        {
          typ: "jednostka_specjalna",
          cel: "piechota",
          wartosc: [
            "Berserker germa\u0144ski"
          ],
          opis: "Framea = w\u0142\xF3cznia/oszczep germa\u0144ski; celny rzut + walka wr\u0119cz; specjalista od zasadzki",
          realizuje: "walka"
        }
      ],
      typCywilizacji: "germanie",
      archetyp: "germanie",
      epokaWejscia: "braz",
      epokiStartowe: [
        "braz"
      ],
      nazwyMiast: [
        "Mattium",
        "Feddersen Wierde",
        "Hodde",
        "Gr\xF8ntoft",
        "Fl\xF6geln",
        "Wijster",
        "Ezinge",
        "Jastorf",
        "Gamla Uppsala",
        "Tofting",
        "Haithabu",
        "Birka",
        "Ribe",
        "Hedeby",
        "Kaupang",
        "Wolin",
        "Truso",
        "Menzlin",
        "Gro\xDF Str\xF6mkendorf",
        "Reric",
        "Starigard",
        "Rugard",
        "Oldenburg",
        "Bardowick",
        "Magadoburg",
        "Erphesfurt",
        "Fulda",
        "Paderborn",
        "Corvey",
        "Herford",
        "Minden",
        "Osnabr\xFCck",
        "Bremum",
        "Hammaburg",
        "Soest",
        "Throtmanni",
        "Xanten",
        "Ubiorum",
        "Novaesium",
        "Bonna",
        "Confluentes",
        "Wormacja",
        "Mogontiacum",
        "Nida",
        "Dieburg",
        "Ladenburg",
        "Rottweil",
        "Cambodunum",
        "Reginum",
        "Castra Regina",
        "Boiodurum",
        "Iuvavum",
        "Vindobona",
        "Carnuntum",
        "Brigetio",
        "Aquincum",
        "Noreia",
        "Magdalensberg",
        "Idistaviso",
        "Teutoburg",
        "Aliso",
        "Anreppen",
        "Haltern",
        "Oberaden",
        "Waldgirmes",
        "Dorlar",
        "Kalkriese",
        "Wilzenberg",
        "Sievern",
        "Fochteloerveen",
        "Wijnaldum",
        "Elisenhof",
        "Bentumersiel",
        "Fallward",
        "Hodorf",
        "S\xFCderbrarup",
        "Sorte Muld",
        "Gudme",
        "Lundeborg",
        "Upp\xE5kra",
        "Helg\xF6",
        "Sigtuna",
        "Old L\xF6d\xF6se",
        "Trelleborg",
        "Fyrkat",
        "Aggersborg",
        "Nonnebakken",
        "Jelling",
        "Ladby",
        "Roskilde",
        "Lejre",
        "Tiss\xF8",
        "Vorbasse",
        "Dankirke",
        "Himling\xF8je",
        "Stevns",
        "Boeslunde",
        "Borgeby",
        "Valsg\xE4rde",
        "Vendel"
      ]
    },
    {
      Cywilizacja: "Harappa",
      "Styl / charakter": "Miasta-plan; handel wewn\u0119trzny; obrona mur\xF3w; niska agresja ekspansji",
      "Jednostka specjalna": "Stra\u017Cnik bram Harappy",
      "Bonus startowy": "+Handel miejski; +obrona piechoty w terytorium",
      "Bonusy/minusy (do dopracowania)": "S\u0142absza kawaleria wczesna",
      Uwagi: "roster-6 tier 1",
      Religia: "Kultura indusko-dolinna",
      nazwyKlastra: [
        "Harappa",
        "Mohenjo-daro",
        "Dholavira",
        "Rakhigarhi",
        "Ganweriwala",
        "Kalibangan",
        "Lothal",
        "Banawali",
        "Kot Diji",
        "Amri"
      ],
      mnoznikHandelPieniadz: 2.4,
      ikonaId: "harappa",
      wodzowiePula: ["Vasu", "Bharata", "Divodasa", "Sudas", "Trasadasyu", "Mandhatri", "Purukutsa", "Kuvalashva", "Anaranya", "Trishanku"],
      wodzowie: {
        kamien: "Starszy z Mehrgarh",
        braz: "Kap\u0142an-Kr\xF3l z Mohend\u017Co-Daro",
        zelazo: "Rad\u017Ca Dholaviry",
        antyk: "A\u015Boka"
      },
      kolorHex: "#C67B4E",
      bonusy: [
        {
          typ: "bonus_zloto",
          cel: "handel",
          wartosc: 0.15,
          opis: "Szlaki lokalne: +15% Daniny miast",
          realizuje: "ekonomia"
        },
        {
          typ: "bonus_obrona",
          cel: "piechota",
          wartosc: 0.15,
          opis: "Obrona mur\xF3w: +15% obrony piechoty w terytorium w\u0142asnym",
          realizuje: "walka"
        },
        {
          typ: "jednostka_specjalna",
          cel: "piechota",
          wartosc: [
            "Stra\u017Cnik bram Harappy",
            "Piechota induska",
            "Garnizon Harappy"
          ],
          opis: "Elitarna piechota bram miasta-plan",
          realizuje: "walka"
        }
      ],
      typCywilizacji: "harappa",
      archetyp: "harappa",
      epokaWejscia: "kamien",
      epokiStartowe: [
        "kamien"
      ],
      nazwyMiast: [
        "Harappa",
        "Mohenjo-daro",
        "Dholavira",
        "Rakhigarhi",
        "Ganweriwala",
        "Kalibangan",
        "Lothal",
        "Banawali",
        "Kot Diji",
        "Amri",
        "Chanhudaro",
        "Surkotada",
        "Rojdi",
        "Rangpur",
        "Desalpur",
        "Dhaneti",
        "Nagwada",
        "Nageshwar",
        "Bagasra",
        "Kuntasi",
        "Padri",
        "Somnath",
        "Prabhas Patan",
        "Lakhabaval",
        "Rupar",
        "Sanghol",
        "Bara",
        "Kotla Nihang Khan",
        "Manda",
        "Chak Purbane Syal",
        "Kunal",
        "Bhirrana",
        "Farmana",
        "Mitathal",
        "Balu",
        "Girawad",
        "Rakhi Shahpur",
        "Alamgirpur",
        "Hulas",
        "Bargaon",
        "Sanauli",
        "Baror",
        "Karanpura",
        "Nausharo",
        "Mehrgarh",
        "Sibri",
        "Dabar Kot",
        "Pirak",
        "Sutkagen Dor",
        "Sotka Koh",
        "Balakot",
        "Allahdino",
        "Naru Waro Dharo",
        "Jhukar",
        "Chhalgari",
        "Judeirjo-daro",
        "Ali Murad",
        "Gazi Shah",
        "Ghazi Shah",
        "Lohumjo-daro",
        "Rehman Dheri",
        "Sarai Khola",
        "Jalilpur",
        "Gumla",
        "Lewan",
        "Islam Chowki",
        "Hathala",
        "Tarakai Qila",
        "Dabarkot",
        "Periano Ghundai",
        "Kulli",
        "Mehi",
        "Shahi Tump",
        "Miri Qalat",
        "Nindowari",
        "Nal",
        "Anjira",
        "Togau",
        "Damb Sadaat",
        "Quetta",
        "Kili Gul Muhammad",
        "Faiz Muhammad",
        "Sadaat",
        "Rana Ghundai",
        "Sur Jangal",
        "Zangian",
        "Bampur",
        "Shahdad",
        "Jiroft",
        "Khurab",
        "Deh Morasi Ghundai",
        "Mundigak",
        "Said Qala",
        "Nad-i Ali",
        "Farukhabad",
        "Bala Hisar Charsadda",
        "Taxila",
        "Hastinapur",
        "Bhagwanpura",
        "Daimabad"
      ]
    },
    {
      Cywilizacja: "Hetyci",
      "Styl / charakter": "Charyotycy; fortyfikacje g\xF3rskie; traktaty; obrona",
      "Jednostka specjalna": "Rydwan Kapadokijski",
      "Bonus startowy": "+Rydwany; +obrona fortec",
      "Bonusy/minusy (do dopracowania)": "S\u0142abszy handel morski",
      Uwagi: "roster-6 tier 1",
      Religia: "Politeizm hetycki",
      nazwyKlastra: [
        "Hattusa",
        "Alaca H\xF6y\xFCk",
        "Kanesh",
        "Carchemish",
        "Aleppo",
        "Karkemish",
        "Sapinuwa",
        "Sarissa",
        "Ku\u015Fakl\u0131",
        "\u015Eapinuva"
      ],
      mnoznikHandelPieniadz: 2,
      ikonaId: "hetyci",
      wodzowiePula: ["Tudhalija I", "Arnuwanda I", "Mursili I", "Muwatalli II", "Hantili I", "Zidanta I", "Ammuna", "Telipinu", "Tahurwaili", "Alluwamna"],
      wodzowie: {
        kamien: "Labarna I",
        braz: "Hattusili I",
        zelazo: "Suppiluliuma I",
        antyk: "Suppiluliuma II"
      },
      kolorHex: "#7B4B8A",
      bonusy: [
        {
          typ: "bonus_walka",
          cel: "rydwany",
          wartosc: 0.2,
          opis: "Rydwan hetycki: +20% ataku rydwan\xF3w",
          realizuje: "walka"
        },
        {
          typ: "bonus_obrona",
          cel: "piechota",
          wartosc: 0.15,
          opis: "Forteca Anatolii: +15% obrony w murach/g\xF3rach",
          realizuje: "walka"
        },
        {
          typ: "jednostka_specjalna",
          cel: "rydwany",
          wartosc: [
            "Rydwan Kapadokijski",
            "Piechota hetycka",
            "Gwardia hetycka"
          ],
          opis: "Elitarny rydwan hetycki",
          realizuje: "walka"
        }
      ],
      typCywilizacji: "hetyci",
      archetyp: "hetyci",
      epokaWejscia: "braz",
      epokiStartowe: [
        "braz"
      ],
      nazwyMiast: [
        "Hattusa",
        "Alaca H\xF6y\xFCk",
        "Kanesz",
        "Karkemisz",
        "Aleppo",
        "Sapinuwa",
        "Sarissa",
        "Ku\u015Fakl\u0131",
        "Nerik",
        "Zippalanda",
        "Tarhuntassa",
        "Nesa",
        "Purushanda",
        "Zalpa",
        "Wahsusana",
        "Hupisna",
        "Tuwanuwa",
        "Landa",
        "Hattena",
        "Nenassa",
        "Ullamma",
        "Malitiya",
        "Melid",
        "Kummanni",
        "Lawazantiya",
        "Kizzuwatna",
        "Adaniya",
        "Tarsus",
        "Ura",
        "Lamiya",
        "Milawanda",
        "Apasa",
        "Arzawa",
        "Mira",
        "Hapalla",
        "Seha",
        "Wilusa",
        "Truwisa",
        "Masa",
        "Karkisa",
        "Lukka",
        "Pitassa",
        "Tummana",
        "Pala",
        "Kaska",
        "Isuwa",
        "Alse",
        "Arslantepe",
        "Tille H\xF6y\xFCk",
        "Lidar H\xF6y\xFCk",
        "Norsuntepe",
        "Korucutepe",
        "Pulur",
        "Imiku\u015Fa\u011F\u0131",
        "Tepecik",
        "De\u011Firmentepe",
        "Karah\xF6y\xFCk",
        "Acemh\xF6y\xFCk",
        "Yaz\u0131l\u0131kaya",
        "Eflatun P\u0131nar",
        "Fas\u0131llar",
        "Gavurkalesi",
        "Sivas H\xF6y\xFCk",
        "Ma\u015Fath\xF6y\xFCk",
        "Ortak\xF6y",
        "\xC7ad\u0131r H\xF6y\xFCk",
        "Kaman-Kaleh\xF6y\xFCk",
        "Kerkenes Da\u011F",
        "K\xFCltepe",
        "Karum Kanesz",
        "Karah\xF6y\xFCk Elbistan",
        "Kummuh",
        "Samsat",
        "Lidar",
        "Gritille",
        "Kurban H\xF6y\xFCk",
        "Titri\u015F H\xF6y\xFCk",
        "Hassek H\xF6y\xFCk",
        "Tell Ahmar",
        "Til Barsip",
        "Zincirli",
        "Sam'al",
        "Karatepe",
        "Sak\xE7ag\xF6z\xFC",
        "Tayinat",
        "Tell Tayinat",
        "\xC7atal H\xF6y\xFCk Amik",
        "Domuztepe",
        "Sirkeli H\xF6y\xFCk",
        "Kinet H\xF6y\xFCk",
        "Sabuniye",
        "Al Mina",
        "Kilise Tepe",
        "G\xF6zl\xFCkule",
        "Mersin",
        "Soli",
        "Kelenderis",
        "Nagidos",
        "Anemurium",
        "Iotape"
      ]
    },
    {
      Cywilizacja: "S\u0142owianie",
      "Styl / charakter": "Osady le\u015Bne; liczna piechota; ekspansja wschodnia",
      "Jednostka specjalna": "Dru\u017Cynnik",
      "Bonus startowy": "+Piechota w lesie; +regen poboru",
      "Bonusy/minusy (do dopracowania)": "Wolniejsza nauka wczesna",
      Uwagi: "roster-6 tier 1",
      Religia: "Poga\u0144stwo s\u0142owia\u0144skie",
      nazwyKlastra: [
        "Kiev",
        "Novgorod",
        "Krak\xF3w",
        "Wolin",
        "Gniezno",
        "Pskov",
        "Suzdal",
        "Belgrade",
        "Pliska",
        "Arkona"
      ],
      mnoznikHandelPieniadz: 1.8,
      ikonaId: "slowianie",
      wodzowiePula: ["Piast", "Siemowit", "Lestek", "Siemomysl", "Popiel", "Przemysl", "Ziemowit", "Choscisko", "Wiszymir", "Leszek"],
      wodzowie: {
        kamien: "Lech",
        braz: "Krak",
        zelazo: "Samo",
        antyk: "Mieszko I"
      },
      kolorHex: "#B83232",
      bonusy: [
        {
          typ: "bonus_walka",
          cel: "piechota",
          wartosc: 0.15,
          opis: "Horda le\u015Bna: +15% ataku piechoty w lesie",
          realizuje: "walka"
        },
        {
          typ: "bonus_pobor_regen",
          cel: "rekruci",
          wartosc: 0.1,
          opis: "Wsp\xF3lnota: +10% regen poboru",
          realizuje: "ekonomia"
        },
        {
          typ: "jednostka_specjalna",
          cel: "piechota",
          wartosc: [
            "Dru\u017Cynnik",
            "Je\u017Adziec z oszczepami"
          ],
          opis: "Elitarny wojownik dru\u017Cyny ksi\u0119cia",
          realizuje: "walka"
        }
      ],
      typCywilizacji: "slowianie",
      archetyp: "slowianie",
      epokaWejscia: "zelazo",
      epokiStartowe: [
        "zelazo"
      ],
      nazwyMiast: [
        "Kij\xF3w",
        "Nowogr\xF3d",
        "Krak\xF3w",
        "Wolin",
        "Gniezno",
        "Psk\xF3w",
        "Suzdal",
        "Belgrad",
        "Pliska",
        "Arkona",
        "Wieliczka",
        "Pozna\u0144",
        "Wroc\u0142aw",
        "Opole",
        "G\u0142og\xF3w",
        "Szczecin",
        "Ko\u0142obrzeg",
        "Gda\u0144sk",
        "Elbl\u0105g",
        "Toru\u0144",
        "P\u0142ock",
        "Sandomierz",
        "Lublin",
        "Przemy\u015Bl",
        "Halicz",
        "W\u0142odzimierz Wo\u0142y\u0144ski",
        "Czernih\xF3w",
        "Perejas\u0142aw",
        "Smole\u0144sk",
        "Po\u0142ock",
        "Witebsk",
        "Tur\xF3w",
        "Rost\xF3w",
        "W\u0142odzimierz nad Kla\u017Am\u0105",
        "Moskwa",
        "Twer",
        "Riaza\u0144",
        "Murom",
        "Jaros\u0142aw Ruski",
        "Wo\u0142ogda",
        "Bie\u0142ozersk",
        "Staraja \u0141adoga",
        "Izborsk",
        "Wyszogr\xF3d",
        "Czersk",
        "Sieradz",
        "\u0141\u0119czyca",
        "Kalisz",
        "Gdecz",
        "Bnin",
        "Ostr\xF3w Lednicki",
        "Grodzisk Wielkopolski",
        "Santok",
        "Mi\u0119dzyrzecz",
        "Cedynia",
        "Kamie\u0144 Pomorski",
        "Szczecinek",
        "Bia\u0142ogard",
        "Nak\u0142o",
        "Bydgoszcz",
        "W\u0142oc\u0142awek",
        "Giecz",
        "L\u0105d",
        "Radzim",
        "Ostr\xF3w Tumski",
        "Wi\u015Blica",
        "Strad\xF3w",
        "Naszacowice",
        "Chodlik",
        "Zawichost",
        "Opat\xF3w",
        "Tyniec",
        "Praga",
        "Wyszehrad",
        "O\u0142omuniec",
        "Brno",
        "Mikulczyce",
        "Stare Miasto na Morawach",
        "Bratys\u0142awa",
        "Nitra",
        "Devin",
        "Zadar",
        "Split",
        "Nin",
        "Knin",
        "Solin",
        "Trogir",
        "Kotor",
        "Ras",
        "Stari Ras",
        "Prizren",
        "Skopje",
        "Ohrid",
        "Pres\u0142aw",
        "Tyrnowo",
        "Warna",
        "Sozopol",
        "Nesebyr",
        "Ruse",
        "Sylistra"
      ]
    },
    {
      Cywilizacja: "Babilonia",
      "Styl / charakter": "Prawo, astronomia, kap\u0142ani; nauka i dyplomacja",
      "Jednostka specjalna": "Gwardia Ishtar",
      "Bonus startowy": "+Nauka; +handel rzeczny",
      "Bonusy/minusy (do dopracowania)": "Wra\u017Cliwo\u015B\u0107 na utrat\u0119 stolicy",
      Uwagi: "roster-6 tier 2",
      Religia: "Religia babilo\u0144ska (Marduk)",
      nazwyKlastra: [
        "Babilon",
        "Ur",
        "Sippar",
        "Nippur",
        "Larsa",
        "Isin",
        "Uruk",
        "Eridu",
        "Kish",
        "Akkad"
      ],
      mnoznikHandelPieniadz: 2.3,
      ikonaId: "babilonia",
      wodzowiePula: ["Sumu-la-El", "Sabium", "Apil-Sin", "Sin-muballit", "Samsu-iluna", "Abi-eszuh", "Ammi-ditana", "Ammi-saduqa", "Samsu-ditana", "Kurigalzu I"],
      wodzowie: {
        kamien: "Sumu-abum",
        braz: "Hammurabi",
        zelazo: "Nabuchodonozor II",
        antyk: "Nabonid"
      },
      kolorHex: "#2B5F8A",
      bonusy: [
        {
          typ: "bonus_nauka",
          cel: "nauka",
          wartosc: 0.15,
          opis: "Kap\u0142ani-astronomowie: +15% nauki",
          realizuje: "ekonomia"
        },
        {
          typ: "bonus_zloto",
          cel: "handel",
          wartosc: 0.1,
          opis: "Rynek Euphratu: +10% Daniny miast",
          realizuje: "ekonomia"
        },
        {
          typ: "jednostka_specjalna",
          cel: "piechota",
          wartosc: [
            "Gwardia Ishtar",
            "Wojownik babilo\u0144ski",
            "Piechota neobabilo\u0144ska"
          ],
          opis: "Elitarna gwardia \u015Bwi\u0105tynna",
          realizuje: "walka"
        }
      ],
      typCywilizacji: "babilonia",
      archetyp: "babilonia",
      epokaWejscia: "braz",
      epokiStartowe: [
        "braz"
      ],
      nazwyMiast: [
        "Babilon",
        "Ur",
        "Sippar",
        "Nippur",
        "Larsa",
        "Isin",
        "Uruk",
        "Eridu",
        "Kisz",
        "Akkad",
        "Borsippa",
        "Kutha",
        "Dilbat",
        "Marad",
        "Kazallu",
        "Opis",
        "Sela",
        "Der",
        "Mari",
        "Terqa",
        "Emar",
        "Tuttul",
        "Ebla",
        "Halab",
        "Karkemisz",
        "Hindanu",
        "Rapiqum",
        "Anah",
        "Hit",
        "Sirara",
        "Karduniasz",
        "Nemetti-Enlil",
        "Dur-Kurigalzu",
        "Duranki",
        "Namar",
        "Ellipi",
        "Susa",
        "Anszan",
        "Ekbatana",
        "Niniwa",
        "Kalhu",
        "Dur-Szarrukin",
        "Harran",
        "Tema",
        "Dumat al-D\u017Candal",
        "Duma",
        "Adummatu",
        "Bit-Adini",
        "Bit-Bahiani",
        "Guzana",
        "Arpad",
        "Melid",
        "Tabal",
        "Que",
        "Hilakku",
        "Unqi",
        "Patina",
        "Hamat",
        "Damaszek",
        "Sydon",
        "Tyr",
        "Byblos",
        "Arwad",
        "Aszkelon",
        "Gaza",
        "Jerozolima",
        "Samaria",
        "Megiddo",
        "Lakisz",
        "Hazor",
        "Jerycho",
        "Betel",
        "Sychem",
        "Hebron",
        "Beer-Szeba",
        "Aszdod",
        "Ekron",
        "Gat",
        "Joppa",
        "Berytos",
        "Kadesz",
        "Qarqar",
        "Tadmor",
        "Dura Europos",
        "Circesium",
        "Nisibis",
        "Edessa",
        "Sarug",
        "Til Huzur",
        "Tarbisu",
        "Kar-Tukulti-Ninurta",
        "Imgur-Enlil",
        "Arbail",
        "Arrapha",
        "Nuzi",
        "Lubdu",
        "Kilizi",
        "Sibaniba",
        "Dur-Katlimmu",
        "Sabi Abyad"
      ]
    },
    {
      Cywilizacja: "Asyria",
      "Styl / charakter": "Imperium obl\u0119\u017Cnicze; \u0142ucznicy; podb\xF3j",
      "Jednostka specjalna": "\u0141ucznik asyryjski",
      "Bonus startowy": "+\u0141ucznicy; +obl\u0119\u017Cenie",
      "Bonusy/minusy (do dopracowania)": "Niskie zaufanie s\u0105siad\xF3w",
      Uwagi: "roster-6 tier 2",
      Religia: "Religia asyryjska (Aszur)",
      nazwyKlastra: [
        "Ninive",
        "Assur",
        "Kalhu",
        "Dur-Sharrukin",
        "Harran",
        "Carchemish",
        "Arpad",
        "Imgur-Enlil",
        "Tushhan",
        "Arbail"
      ],
      mnoznikHandelPieniadz: 1.7,
      ikonaId: "asyria",
      wodzowiePula: ["Szamszi-Adad I", "Adad-nirari I", "Salmanasar I", "Tukulti-Ninurta I", "Aszur-uballit I", "Sargon II", "Asarhaddon", "Aszurnasirpal II", "Salmanasar III", "Sennacheryb"],
      wodzowie: {
        kamien: "Puzur-Aszur I",
        braz: "Tiglat-Pileser I",
        zelazo: "Aszurbanipal",
        antyk: "Sennacheryb"
      },
      kolorHex: "#5C4033",
      bonusy: [
        {
          typ: "bonus_walka",
          cel: "lukownicy",
          wartosc: 0.2,
          opis: "\u0141ucznicy asyryjscy: +20% ataku dystansowego",
          realizuje: "walka"
        },
        {
          typ: "bonus_walka",
          cel: "obleczenie",
          wartosc: 0.15,
          opis: "Machiny obl\u0119\u017Cnicze: +15% obl\u0119\u017Cenia",
          realizuje: "walka"
        },
        {
          typ: "jednostka_specjalna",
          cel: "lukownicy",
          wartosc: [
            "Konnica lancowa asyryjska",
            "Konnica \u0142ucznicza asyryjska",
            "\u0141ucznik asyryjski"
          ],
          opis: "Elitarny \u0142ucznik imperium",
          realizuje: "walka"
        }
      ],
      typCywilizacji: "asyria",
      archetyp: "asyria",
      epokaWejscia: "braz",
      epokiStartowe: [
        "braz"
      ],
      nazwyMiast: [
        "Ninive",
        "Assur",
        "Kalhu",
        "Dur-Szarrukin",
        "Harran",
        "Karkemisz",
        "Arpad",
        "Imgur-Enlil",
        "Tuszhan",
        "Arbail",
        "Nemed-Ishtar",
        "Kar-Tukulti-Ninurta",
        "Szibaniba",
        "Kilizi",
        "Lubdu",
        "Arrapha",
        "Nuzi",
        "Guzana",
        "Til Barsip",
        "Hindanu",
        "Sam'al",
        "Que",
        "Tabal",
        "Hilakku",
        "Melid",
        "Kummuh",
        "Patina",
        "Unqi",
        "Hamat",
        "Damaszek",
        "Samerina",
        "Aszkelon",
        "Gaza",
        "Ekron",
        "Aszdod",
        "Tyr",
        "Sydon",
        "Byblos",
        "Arwad",
        "Babilon",
        "Borsippa",
        "Sippar",
        "Kutha",
        "Uruk",
        "Ur",
        "Nippur",
        "Der",
        "Susa",
        "Madaktu",
        "Hidalu",
        "Ekbatana",
        "Parsua",
        "Namri",
        "Zamua",
        "Musasir",
        "Tuszpa",
        "Van",
        "Argishtihinili",
        "Erebuni",
        "Teishebaini",
        "Rusahinili",
        "Manna",
        "Izirtu",
        "Kar-Kashi",
        "Bit-Hamban",
        "Ellipi",
        "Bit-Jakin",
        "Bit-Dakkuri",
        "Bit-Amukani",
        "Larak",
        "Marad",
        "Kisz",
        "Isin",
        "Larsa",
        "Adab",
        "Umma",
        "Girsu",
        "Lagasz",
        "Eridu",
        "Bad-tibira",
        "Szuruppak",
        "Memfis",
        "Teby Asyryjskie",
        "Sais",
        "Tanis",
        "Migdol",
        "Pelusium",
        "Daphnae",
        "Kition",
        "Salamina Cypryjska",
        "Amathus",
        "Kurion",
        "Pafos",
        "Idalion",
        "Tamassos",
        "Marion",
        "Soloi Cypryjskie",
        "Lapithos",
        "Chytroi",
        "Golgoi"
      ]
    },
    {
      Cywilizacja: "Fenicjanie",
      "Styl / charakter": "Handel morski; kolonie; barter",
      "Jednostka specjalna": "Tyrski miecznik",
      "Bonus startowy": "+Handel morski; porty",
      "Bonusy/minusy (do dopracowania)": "S\u0142aba piechota elit l\u0105dowa",
      Uwagi: "roster-6 tier 2",
      Religia: "Religia fenicka (Ba'al)",
      nazwyKlastra: [
        "Tyr",
        "Sidon",
        "Byblos",
        "Carthage",
        "Utica",
        "Gadir",
        "Motya",
        "Tharros",
        "Kition",
        "Arwad"
      ],
      mnoznikHandelPieniadz: 2.6,
      ikonaId: "fenicjanie",
      wodzowiePula: ["Ahiram", "Ittobaal I", "Baal-Eser I", "Matten I", "Pygmalion", "Abibaal", "Elibaal", "Szipitbaal", "Mago I", "Hazdrubal"],
      wodzowie: {
        kamien: "Agenor",
        braz: "Hiram I",
        zelazo: "Dydona-Elissa",
        antyk: "Hannibal Barkas"
      },
      kolorHex: "#9B2335",
      bonusy: [
        {
          typ: "bonus_zloto",
          cel: "handel",
          wartosc: 0.25,
          opis: "Szlaki morskie: +25% Daniny z port\xF3w",
          realizuje: "ekonomia"
        },
        {
          typ: "bonus_zloto",
          cel: "handel",
          wartosc: 0.1,
          opis: "Purpura: +10% Daniny",
          realizuje: "ekonomia"
        },
        {
          typ: "jednostka_specjalna",
          cel: "piechota",
          wartosc: [
            "Tyrski miecznik",
            "Wojownik fenicki",
            "Gwardia Tyre\u0144ska"
          ],
          opis: "Elitarny wojownik fenicki",
          realizuje: "walka"
        }
      ],
      typCywilizacji: "fenicjanie",
      archetyp: "fenicjanie",
      epokaWejscia: "braz",
      epokiStartowe: [
        "braz"
      ],
      nazwyMiast: [
        "Tyr",
        "Sydon",
        "Byblos",
        "Kartagina",
        "Utica",
        "Gadir",
        "Motya",
        "Tharros",
        "Kition",
        "Arwad",
        "Berytos",
        "Trypolis",
        "Batrun",
        "Amrit",
        "Simyra",
        "Sarepta",
        "Akko",
        "Dor",
        "Jafa",
        "Ako",
        "Achziw",
        "Anafa",
        "Kabri",
        "Tell Sukas",
        "Ras Ibn Hani",
        "Al Mina",
        "Amathus",
        "Kurion",
        "Pafos",
        "Salamis",
        "Idalion",
        "Lapithos",
        "Marion",
        "Soloi",
        "Tamassos",
        "Chytroi",
        "Golgoi",
        "Kalawasos",
        "Palepafos",
        "Larnaka",
        "Panormos",
        "Solunt",
        "Lilibeum",
        "Drepanon",
        "Erice",
        "Segesta Fenicka",
        "Karales",
        "Nora",
        "Sulcis",
        "Bithia",
        "Olbia Sardy\u0144ska",
        "Melite",
        "Gaulos",
        "Ebusus",
        "Sa Caleta",
        "Malaka",
        "Sexi",
        "Abdera",
        "Carteia",
        "Baelo Claudia",
        "Lixus",
        "Mogador",
        "Tingis",
        "Rusadir",
        "Sala",
        "Cerne",
        "Tamuda",
        "Volubilis",
        "Ikosim",
        "Rusguniae",
        "Hippo Diarrhytus",
        "Hippo Regius",
        "Thabraca",
        "Cirta",
        "Sicca Veneria",
        "Thugga",
        "Sabratha",
        "Oea",
        "Leptis Magna",
        "Leptis Minor",
        "Hadrumetum",
        "Thapsus",
        "Ruspina",
        "Zama",
        "Bulla Regia",
        "Kerkouane",
        "Neapolis",
        "Klupea",
        "Carthago Nova",
        "Akra Leuke",
        "Barcelo",
        "Onoba",
        "Asta Regia",
        "Tartessos",
        "Huelva",
        "Ossonoba",
        "Balsa",
        "Myrtilis",
        "Olisipo",
        "Cetobriga"
      ]
    }
  ],
  start_gry: [
    {
      Parametr: "Osadnicy na start (gracz)",
      Warto\u015B\u0107: "1",
      Uwagi: "gracz zawsze startuje z 1 osadnikiem"
    },
    {
      Parametr: "Cywilizacje na mapie",
      Warto\u015B\u0107: "90",
      Uwagi: "9 typ\xF3w \xD7 10 miast (1 gracz + 9 rywali tego samego typu = klaster); skaluje si\u0119 z map\u0105"
    },
    {
      Parametr: "G\u0142\xF3wne cywilizacje (typy)",
      Warto\u015B\u0107: "15 (Grecy, Rzymianie, Chi\u0144czycy, Inkowie, Zulusi, Egipt, Sumerowie, Celtowie, Germanie, Harappa, Hetyci, S\u0142owianie, Babilonia, Asyria, Fenicjanie)",
      Uwagi: "pula 15 typ\xF3w (D-ROSTER-Q3); na mapie cap z rozmiaru; Celtowie = Soldurii + Gaesatae (2026-07-04)"
    },
    {
      Parametr: "Cywilizacje pocz\u0105tkowe",
      Warto\u015B\u0107: "miasta tego samego typu (klaster)",
      Uwagi: "to NIE osobne nacje \u2014 to miasta/AI tego samego typu wok\xF3\u0142 g\u0142\xF3wnej cyw. (1 gracz + 9 rywali); uproszczona dyplomacja: osobny, p\xF3\u017Aniejszy w\u0105tek"
    },
    {
      Parametr: "Rywale tego samego typu wok\xF3\u0142 gracza",
      Warto\u015B\u0107: "~9 (AI)",
      Uwagi: "9 rywali wok\xF3\u0142 gracza = klaster 10 miast danego typu; miasta min. ~9 p\xF3l od siebie (regu\u0142a map-gen)"
    },
    {
      Parametr: "Cel startu",
      Warto\u015B\u0107: "pokona\u0107 rywali w\u0142asnego typu",
      Uwagi: "zanim napotkasz inne typy cywilizacji"
    },
    {
      Parametr: "Ludno\u015B\u0107 w terenie",
      Warto\u015B\u0107: "ka\u017Cdy zamieszkiwalny heks (\u22651 \u017Cywno\u015B\u0107) = 1 wioska/1 ludno\u015B\u0107",
      Uwagi: "g\xF3ry/ja\u0142owe = 0 ludno\u015Bci"
    },
    {
      Parametr: "Przejmowanie terenu",
      Warto\u015B\u0107: "odkrycie/zaj\u0119cie \u2192 wioska + ludno\u015B\u0107 staje si\u0119 nasza (obywatele, nie niewolnicy), przypisana do najbli\u017Cszego miasta",
      Uwagi: null
    },
    {
      Parametr: "Wzrost ludno\u015Bci",
      Warto\u015B\u0107: "szybki przez ekspansj\u0119, ograniczony \u017Cywno\u015Bci\u0105",
      Uwagi: "najpierw zdob\u0105d\u017A tereny rolne, by wy\u017Cywi\u0107"
    },
    {
      Parametr: "Jednostka specjalna",
      Warto\u015B\u0107: "1 na cywilizacj\u0119",
      Uwagi: "niekoniecznie w ka\u017Cdej epoce"
    },
    {
      Parametr: "Bonusy/minusy cywilizacji",
      Warto\u015B\u0107: "do dopracowania",
      Uwagi: "doprecyzujemy p\xF3\u017Aniej"
    }
  ]
};

// src/game/diplomacy.ts
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
  /** "Aktywny handel (trwa umowa handlowa)" (+1/ture) — stackuje z tierem pokoju */
  handel_zaufanie_perTura: 1,
  /** "Aktywny sojusz wojskowy" (+3/ture, Maciej 2026-07-21) */
  sojusz_zaufanie_perTura: 3,
  /** "Aktywny pakt nieagresji" (+2/ture, Maciej 2026-07-21) */
  nap_zaufanie_perTura: 2,
  /** "Pokojowy kontakt bez wojny/NAP/sojuszu" (+1/ture, Maciej 2026-07-21) */
  pokoj_zaufanie_perTura: 1,
  /** @deprecated — zastąpione przez nap/sojusz/pokoj (2026-07-21); zostaje w JSON roundtrip */
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
  /** Zaufanie >= 91 required for SojuszWojskowy (przy równowadze sił >90%) */
  progSojuszZaufanie: 91,
  /** Zaufanie >= 70 required for WymianaTechnologii */
  progWymianaTechZaufanie: 70,
  /** Respekt >= 70 required to demand Wasalizacja */
  progWasalizacjaRespekt: 70,
  /** Respekt >= 90 required to demand Wchloniecie */
  progWchloniecieRespekt: 90,
  /** Relacja < 30 = diplomacy nearly impossible */
  progMinimalnyRelacja: 30,
  /** Relacja >= 151 = sojusz (Maciej 2026-06-30: powyżej 150) */
  progSojuszRelacja: 151,
  /** Twarda podłoga Relacji na dobrowolne umowy pozytywne (>150); premia siły nie obniża */
  progUmowaMinRelacja: 151,
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
  progPoboczneWojna: 15,
  // ---- propozycje v1.1 (Panel-D → evaluateProposal) ----
  /** Zaufanie >= wartość wymagane do NAP */
  progNapZaufanie: 40,
  /** Relacja >= wartość wymagana do NAP (Maciej 2026-07-21: 50 @ normal) */
  progNapRelacja: 50,
  /** Relacja >= wartość wymagana do handlu ¤/Praca/złoża/surowce (Maciej 2026-07-26: 0 = od neutralnej) */
  progHandelRelacja: 0,
  /** @deprecated v1.2 — usunięte „tylko równi”; zostaje w JSON dla roundtrip */
  progSojuszPartnerRwMin: 0.4,
  progSojuszPartnerRwMax: 0.7,
  /** Max obniżka progu willingnessAlly gdy proponent silniejszy (Moc/Respekt) */
  progSojuszPremiaSilniejszyMax: 0.25,
  /** Wkład przewagi Mocy (milRatio−1) × skok w premii progu */
  progSojuszPremiaMilSkok: 0.08,
  /** Wkład przewagi Respektu proponenta × skok w premii progu */
  progSojuszPremiaRespektSkok: 0.15,
  /** Poniżej tego stosunku M proponent/respondent — wymagana pełna relacja (score≥120) */
  progSojuszSlabyProponentMilRatio: 0.5,
  /** Bonus willingnessAlly gdy rozmówca silniejszy (AI słabsze — sojusz z hegemonem) */
  progSojuszPremiaSilniejszyInny: 0.2,
  /** aiDiplomacyStance.willingnessAlly min dla sojuszu */
  progSojuszWillingnessMin: 0.68,
  /** v1.3 — max podwyżka progów gdy respondent (AI) silniejszy od proponenta */
  progSojuszKaraSilniejszyMax: 0.4,
  /** v1.3 — wkład przewagi respondenta (1/milProponent − 1) × skok */
  progSojuszKaraMilSkok: 0.15,
  /** v1.3 — kara willingnessAlly na jednostkę przewagi respondenta */
  progSojuszKaraAllySkok: 0.18,
  /** v1.3 — poniżej tego stosunku M proponent/respondent → hegemon odmawia sojuszu (słaby proponent) */
  progSojuszHegemonMilRatio: 0.42,
  /** v1.3 — powyżej tego stosunku M proponent/respondent → hegemon nie szuka sojuszu równoprawnego */
  progSojuszHegemonProposerMaxMil: 2.38,
  /** v1.3c — progresywne podłogi Zauf. gdy gracz silniejszy (2×≈85, 3×≈83 — oba „w okolicy 85") */
  progSojuszPremiaGracz2xMilRatio: 2,
  progSojuszPremiaGracz2xMinZaufanie: 85,
  progSojuszPremiaGracz2xBonus: 0.06,
  progSojuszPremiaGracz3xMilRatio: 2.8,
  progSojuszPremiaGracz3xMinZaufanie: 83,
  progSojuszPremiaGracz3xBonus: 0.1,
  /** Minimalny trybut żądany (¤/turę) */
  progTrybutMinGoldPerTurn: 10,
  /** Respekt proponenta musi być > tej wartości, by żądać trybutu (spokój) */
  progTrybutZadanieMinRespekt: 70,
  /** Limit górny żądania trybutu (¤/turę) przy Respekt tuż powyżej progu (audyt #21) */
  progTrybutZadanieMaxGoldBase: 50,
  /** Limit górny: dodatek ¤/turę za każdy punkt Respektu ponad próg żądania (audyt #21) */
  progTrybutZadanieMaxGoldPerRespekt: 5,
  /** militaryRatio > wartość → „blisko wojny” (oferta trybutu) */
  progTrybutOfertaNearWarRatio: 1.2,
  /** Zaufanie < wartość → „blisko wojny” (oferta trybutu) */
  progTrybutOfertaNearWarZaufanie: 30,
  /** Minimalna oferta trybutu (¤) */
  progTrybutOfertaMinGold: 5,
  /** Bazowa oferta trybutu poza „blisko wojny”: base + epoka × epokaGold */
  progTrybutOfertaBaseGold: 10,
  progTrybutOfertaEpokaGold: 5,
  /** willingnessTrade min dla handlu */
  progHandelWillingnessMin: 0.5,
  /** Fair deal: offered/fair min */
  progHandelFairRatioMin: 0.8,
  /** Fair deal: offered/fair max */
  progHandelFairRatioMax: 1.2,
  /** Zaufanie min dla namówienia do wojny */
  progNamowWojneZaufanie: 50,
  /** Łapówka min = base × (epoka + 1) */
  progNamowWojneBribeBase: 30,
  /** Zaufanie min dla otwartych granic */
  progGraniceZaufanie: 45,
  /** Relacja min dla otwartych granic / przemarszu (G1-A) */
  progGraniceRelacja: 100,
  /** Respekt min dla prawa wojskowego przemarszu */
  progGraniceWojskoweRespekt: 55,
  /** militaryRatio min dla ultimatum */
  progUltimatumMilitaryRatio: 1.3,
  /** Jednorazowe złoto min przy ultimatum */
  progUltimatumMinGold: 20,
  /** Domyślny trybut wasala (¤/turę) */
  progWasalDefaultGoldPerTurn: 10,
  // ---- Wiarygodność cywilizacji (WIARYGODNOSC-SPECYFIKACJA.md, Etap 1) ----
  // Uwaga: wartości tymczasowo hardkodowane tutaj; docelowo mają trafić do
  // gra/data/diplomacy.json przez Panel-D Excela (poza zakresem Etapu 1) —
  // wzorem loadDiplomacyParams() dla reszty DIPLOMACY_PARAMS.
  // -- §1: skala i wartość startowa (pkt Wiarygodności, skala −100…+100) --
  /** Dolna granica skali Wiarygodności (pkt Wiarygodności), §1. */
  wiarygodnoscSkalaMin: -100,
  /** Górna granica skali Wiarygodności (pkt Wiarygodności), §1. */
  wiarygodnoscSkalaMax: 100,
  /** Próg pasma „Wzór cnoty" — W >= wartość (pkt Wiarygodności), §1. */
  wiarygodnoscProgWzorCnoty: 40,
  /** Próg pasma „Wiarołomny" — W <= wartość (pkt Wiarygodności), §1. */
  wiarygodnoscProgWiarolomny: -40,
  /** Wartość startowa Wiarygodności, poziom Łatwy (pkt Wiarygodności), §1. */
  wiarygodnoscStartLatwy: 40,
  /** Wartość startowa Wiarygodności, poziom Normalny (pkt Wiarygodności), §1. */
  wiarygodnoscStartNormalny: 20,
  /** Wartość startowa Wiarygodności, poziom Trudny (pkt Wiarygodności), §1. */
  wiarygodnoscStartTrudny: 0,
  // -- §2: KARY N1–N7 (pkt Wiarygodności, jednorazowo, wszystkie poziomy trudności) --
  /** N1 — wypowiedzenie wojny bez ostrzeżenia / atak w tej samej turze co deklaracja (pkt Wiarygodności, jednorazowo). */
  wiarygodnoscN1BezOstrzezenia: -10,
  /** N1 — okno karencji: liczba tur po wypowiedzeniu wojny, w której atak jeszcze liczy się jako "bez ostrzeżenia" (tury). */
  wiarygodnoscN1KarencjaTur: 1,
  /** N2 — wypowiedzenie wojny mimo aktywnego Paktu o Nieagresji (pkt Wiarygodności, jednorazowo). */
  wiarygodnoscN2ZlamaniePaktuNap: -18,
  /** N2 — wypowiedzenie wojny mimo aktywnego Sojuszu (pełny/defensywny), także atak na sojusznika (pkt Wiarygodności, jednorazowo). */
  wiarygodnoscN2ZlamaniePaktuSojusz: -25,
  /** N3 — atak w oknie karencji po zakończeniu porozumienia (pkt Wiarygodności, jednorazowo, na wierzchu N1/N2). */
  wiarygodnoscN3AtakWOknieKarencji: -12,
  /** N3 — okno karencji (tury) po jednostronnym anulowaniu porozumienia BEZTERMINOWEGO lub po zawarciu pokoju, przed którym atak = kara N3. */
  wiarygodnoscN3KarencjaBezterminoweTur: 10,
  /** N4 — odmowa pomocy sojusznikowi na wezwanie obowiązku sojuszniczego, kara WYŁĄCZNIE dla odmawiającego (pkt Wiarygodności, jednorazowo). */
  wiarygodnoscN4OdmowaObowiazkuSojuszu: -15,
  /** N5 — dobrowolne zerwanie traktatu CZASOWEGO (nie handlowego) (pkt Wiarygodności, jednorazowo). Bezterminowe = brak kary (patrz N3). */
  wiarygodnoscN5ZerwanieTraktatCzasowy: -6,
  /** N5 — dobrowolne zerwanie umowy handlowej CZASOWEJ (pkt Wiarygodności, jednorazowo). */
  wiarygodnoscN5ZerwanieHandelCzasowy: -4,
  /** N6 — niedotrzymanie handlu cyklicznego (3 tury z rzędu z winy strony), kara wyłącznie dla winnego (pkt Wiarygodności, jednorazowo). */
  wiarygodnoscN6NiedotrzymanieHandluCyklicznego: -2,
  /** N6 — próg kolejnych tur z rzędu z winy TEJ SAMEJ strony (dawca bez zapasu / biorca bez środków), po którym nalicza się kara (tury). */
  wiarygodnoscN6ProgTurZRzedu: 3,
  /** N7 — nieautoryzowany przemarsz, jednorazowo przy pierwszym wykryciu w danej "wizycie" (pkt Wiarygodności). Zwiadowcy wykluczeni (C-WIAR-SKAUT=A). */
  wiarygodnoscN7NieautoryzowanyPrzemarsz: -2,
  /** Odwet (C-WIAR-ODWET=A) — okno (tury) od cudzego N1/N2/N4 wobec nas, w którym nasza odwetowa wojna NIE nalicza N1/N2. */
  wiarygodnoscOdwetOknoTur: 10,
  // -- §3: NAGRODY — tabela A STRUMIEŃ (pkt Wiarygodności NA TURĘ, za każde aktualnie dotrzymywane zobowiązanie) --
  /** S1 — Sojusz (pełny lub defensywny) aktywny (pkt Wiarygodności / turę). */
  wiarygodnoscS1SojuszPerTure: 1,
  /** S2 — Pakt o nieagresji aktywny (pkt Wiarygodności / turę). */
  wiarygodnoscS2NapPerTure: 0.5,
  /** S3 — Umowa handlowa / handel cykliczny ze 100% zrealizowanych dostaw tej tury (pkt Wiarygodności / turę). */
  wiarygodnoscS3HandelPerTure: 0.3,
  /** S4 — Prawo przemarszu / otwarte granice aktywne (pkt Wiarygodności / turę). */
  wiarygodnoscS4PrzemarszPerTure: 0.2,
  // -- §3: NAGRODY — tabela B FINISZ (pkt Wiarygodności, jednorazowo, za dotrwanie do zapisanego terminu) --
  /** P1 — Sojusz dotrwany do końca (pkt Wiarygodności, jednorazowo). */
  wiarygodnoscP1FiniszSojusz: 10,
  /** P2 — Pakt o nieagresji dotrwany do końca (pkt Wiarygodności, jednorazowo). */
  wiarygodnoscP2FiniszNap: 5,
  /** P2 — Umowa handlowa dotrwana do końca (pkt Wiarygodności, jednorazowo). */
  wiarygodnoscP2FiniszHandel: 5,
  /** P3 — Handel cykliczny ze 100% dostaw aż do końca umowy (pkt Wiarygodności, jednorazowo). */
  wiarygodnoscP3FiniszHandelCykliczny: 1,
  // -- §3: NAGRODY — tabela C CZYNY (pkt Wiarygodności, jednorazowo, niepowiązane z trwającym zobowiązaniem) --
  /** P4 — kamień milowy "bez wojny" (pkt Wiarygodności, jednorazowo, powtarzalny co wiarygodnoscP4OknoBezWojnyTur tur). */
  wiarygodnoscP4BezWojny30Tur: 3,
  /** P4 — długość okna "bez wojny" wymaganego do naliczenia kamienia milowego (tury). */
  wiarygodnoscP4OknoBezWojnyTur: 30,
  /** P5 — pomoc sojusznikowi w wojnie, dołączenie z własnej woli LUB na wezwanie (pkt Wiarygodności, jednorazowo). */
  wiarygodnoscP5PomocSojusznikowi: 20,
  // -- §4: model zapominania — krzywa liniowa z trwałą podłogą (tury do osiągnięcia podłogi, wg trudności i znaku zdarzenia) --
  /** Czas zapomnienia KAR, poziom Łatwy (tury; 2,5%/turę). */
  wiarygodnoscCzasZapomnieniaKaraLatwy: 40,
  /** Czas zapomnienia KAR, poziom Normalny (tury; 1,25%/turę). */
  wiarygodnoscCzasZapomnieniaKaraNormalny: 80,
  /** Czas zapomnienia KAR, poziom Trudny (tury; 0,833%/turę). */
  wiarygodnoscCzasZapomnieniaKaraTrudny: 120,
  /** Czas zapomnienia NAGRÓD (FINISZ/CZYNY), poziom Łatwy (tury; 0,833%/turę). */
  wiarygodnoscCzasZapomnieniaNagrodaLatwy: 120,
  /** Czas zapomnienia NAGRÓD (FINISZ/CZYNY), poziom Normalny (tury; 1,25%/turę). */
  wiarygodnoscCzasZapomnieniaNagrodaNormalny: 80,
  /** Czas zapomnienia NAGRÓD (FINISZ/CZYNY), poziom Trudny (tury; 2,5%/turę). */
  wiarygodnoscCzasZapomnieniaNagrodaTrudny: 40,
  /** Trwała podłoga krzywej zapominania — ułamek [0,1] wartości pierwotnej, który zostaje NA ZAWSZE po pełnym wygaśnięciu (dotyczy WYŁĄCZNIE zdarzeń jednorazowych, nie STRUMIENIA — C-WIAR-SLAD=A). */
  wiarygodnoscTrwalaPodlogaProcent: 0.1,
  // -- §5: wpływ Wiarygodności na Zaufanie --
  /** Dzielnik strumienia Wiarygodność→Zaufanie: ΔZaufanie/turę = Wiarygodność / wartość (C-WIAR-SKALA=20). */
  wiarygodnoscZaufanieDzielnikPerTura: 20,
  /** Dźwignia 3 — twardy próg: Sojusz wymaga W >= wartość (pkt Wiarygodności), niezależnie od Zaufania/Respektu. */
  wiarygodnoscProgSojuszMin: 0,
  /** Dźwignia 3 — twardy próg: Pakt o Nieagresji wymaga W >= wartość (pkt Wiarygodności), niezależnie od Zaufania/Respektu. */
  wiarygodnoscProgNapMin: -40
};
var WAR_RELATION_SCORE_CAP = DIPLOMACY_PARAMS.progMinimalnyRelacja - 1;
var ARCHETYPE_AGGRESSION = {
  ["grecy" /* Grecy */]: 0.4,
  ["rzymianie" /* Rzymianie */]: 0.75,
  ["chinczycy" /* Chinczycy */]: 0.2,
  ["inkowie" /* Inkowie */]: 0.45,
  ["zulusi" /* Zulusi */]: 0.9,
  ["egipt" /* Egipt */]: 0.35,
  ["babilon" /* Babilon */]: 0.3,
  ["sumer" /* Sumer */]: 0.3,
  ["celtowie" /* Celtowie */]: 0.6,
  ["germanie" /* Germanie */]: 0.65,
  ["harappa" /* Harappa */]: 0.2,
  ["hetyci" /* Hetyci */]: 0.5,
  ["slowianie" /* Slowianie */]: 0.6,
  ["babilonia" /* Babilonia */]: 0.4,
  ["asyria" /* Asyria */]: 0.8,
  ["fenicjanie" /* Fenicjanie */]: 0.3,
  ["drobna_cywilizacja" /* DrobnaCywilizacja */]: 0.15
};
var ARCHETYPE_TRADE = {
  ["grecy" /* Grecy */]: 0.75,
  ["rzymianie" /* Rzymianie */]: 0.5,
  ["chinczycy" /* Chinczycy */]: 0.85,
  ["inkowie" /* Inkowie */]: 0.25,
  ["zulusi" /* Zulusi */]: 0.2,
  ["egipt" /* Egipt */]: 0.6,
  ["babilon" /* Babilon */]: 0.65,
  ["sumer" /* Sumer */]: 0.65,
  ["celtowie" /* Celtowie */]: 0.35,
  ["germanie" /* Germanie */]: 0.3,
  ["harappa" /* Harappa */]: 0.8,
  ["hetyci" /* Hetyci */]: 0.5,
  ["slowianie" /* Slowianie */]: 0.4,
  ["babilonia" /* Babilonia */]: 0.6,
  ["asyria" /* Asyria */]: 0.3,
  ["fenicjanie" /* Fenicjanie */]: 0.9,
  ["drobna_cywilizacja" /* DrobnaCywilizacja */]: 0.6
};

// src/game/diplomacy-layers.ts
function clamp2(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}
function startRelationForPair(sameType) {
  const p = DIPLOMACY_PARAMS;
  let zaufanie = p.startZaufanie;
  if (sameType) {
    zaufanie += p.rywalizacjaTenSamTyp_zaufanie;
  } else {
    zaufanie += p.roznicaKulturowa_zaufanie;
  }
  return {
    zaufanie: clamp2(zaufanie, 0, 100),
    respekt: p.startRespekt,
    status: "neutralni"
  };
}

// src/game/cluster-start.ts
function buildClusterStartPlan(input) {
  const spawnPlan = buildClusterSpawnPlan({
    map: input.map,
    civs: input.civs,
    seed: input.seed,
    playerTyp: input.playerCivId,
    rywaleNaKlaster: input.rywaleNaKlaster,
    aktywneTypy: input.aktywneTypy,
    startEpochId: input.startEpochId,
    cityNamesPools: input.cityNamesPools
  });
  const aiOwnerCivMap = /* @__PURE__ */ new Map();
  const ownerDisplayName = /* @__PURE__ */ new Map();
  const simplifiedDiplomacyOwners = /* @__PURE__ */ new Set();
  const foreignTypeOwners = /* @__PURE__ */ new Set();
  const typCityCopyOwners = /* @__PURE__ */ new Set();
  const startRelations = /* @__PURE__ */ new Map();
  const spawnCities = [];
  const aiStartHexes = [];
  for (const slot of spawnPlan.slots) {
    aiOwnerCivMap.set(slot.ownerId, slot.typ);
    ownerDisplayName.set(slot.ownerId, displayLabelForSlot(input.civs, slot));
    if (slot.isSameTypeRival) simplifiedDiplomacyOwners.add(slot.ownerId);
    else foreignTypeOwners.add(slot.ownerId);
    if (!slot.isClusterCapital) typCityCopyOwners.add(slot.ownerId);
    startRelations.set(slot.ownerId, startRelationForPair(slot.isSameTypeRival));
    spawnCities.push({
      q: slot.q,
      r: slot.r,
      ownerId: slot.ownerId,
      name: slot.nazwaMiasta
    });
    aiStartHexes.push({ q: slot.q, r: slot.r, ownerId: slot.ownerId });
  }
  return {
    playerStartHex: spawnPlan.playerStartHex,
    playerStartCityName: spawnPlan.playerStartCityName,
    aiStartHexes,
    spawnCities,
    foreignTypeClusters: spawnPlan.foreignTypeClusters,
    aiOwnerCivMap,
    ownerDisplayName,
    simplifiedDiplomacyOwners,
    foreignTypeOwners,
    typCityCopyOwners,
    startRelations,
    placement: spawnPlan.placement,
    pendingSameTypeRivals: spawnPlan.pendingSameTypeRivals,
    pendingSameTypeRivalHexes: spawnPlan.pendingSameTypeRivalHexes,
    clusterCapitalOwnerIds: spawnPlan.clusterCapitalOwnerIds
  };
}

// tools/.map-gen-phase-profile-entry.ts
var SEED = 42;
var ROZMIAR = "maly";
var DENSITY_MEDIUM = { rivers: "medium", forest: "medium", desert: "medium", relief: "medium" };
var DENSITY_LOW = { ...DENSITY_MEDIUM, rivers: "low" };
function msSince(t0) {
  return import_node_perf_hooks.performance.now() - t0;
}
function fmtSec(ms) {
  return (ms / 1e3).toFixed(2) + "s";
}
function riverStats(map2) {
  const kinds = map2.riverPathKinds ?? [];
  return {
    main: kinds.filter((k) => k === "main").length,
    trib: kinds.filter((k) => k === "tributary").length,
    total: map2.riverPaths?.length ?? 0
  };
}
var { w, h } = rozmiarToDims(ROZMIAR);
var params = resolveRiverMapParams("medium", w, h);
console.log("=== PARAMETRY RZEK (Ma\u0142y " + w + "\xD7" + h + ", tier medium) ===");
console.log(JSON.stringify({
  areaScale: +params.areaScale.toFixed(3),
  mainCell: params.mainCell,
  tributaryCell: params.tributaryCell,
  feederPasses: params.feederPasses,
  topUpPasses: params.topUpPasses,
  minLen: params.minLen,
  maxLen: params.maxLen,
  gridTraceMinLen: params.gridTraceMinLen
}, null, 2));
var tMap0 = import_node_perf_hooks.performance.now();
var map = generujSwiat(SEED, ROZMIAR, "kontynenty", {
  worldDensity: DENSITY_MEDIUM,
  mapSizeMenuLabel: "Ma\u0142y",
  civTypesCount: 4,
  cityStatesCount: 4,
  difficulty: "normal"
});
var mapMs = msSince(tMap0);
var rs = riverStats(map);
var tLow0 = import_node_perf_hooks.performance.now();
generujSwiat(SEED, ROZMIAR, "kontynenty", {
  worldDensity: DENSITY_LOW,
  mapSizeMenuLabel: "Ma\u0142y"
});
var mapLowMs = msSince(tLow0);
var epochRoster = civIdsAvailableAtGameEpoch(civs_default.cywilizacje, "kamien");
var tCl0 = import_node_perf_hooks.performance.now();
var placement = computeClusters(map, {
  seed: SEED,
  aktywneTypy: 4,
  playerTyp: "grecy",
  rywaleNaKlaster: 4,
  startEpochId: "kamien",
  civRoster: epochRoster
});
var clusterMs = msSince(tCl0);
var tPlan0 = import_node_perf_hooks.performance.now();
var plan = buildClusterStartPlan({
  map,
  civs: civs_default,
  seed: SEED,
  playerCivId: "grecy",
  rywaleNaKlaster: 4,
  aktywneTypy: 4,
  startEpochId: "kamien"
});
var planMs = msSince(tPlan0);
var tDirect0 = import_node_perf_hooks.performance.now();
generateMap(w, h, SEED, "kontynenty", { worldDensity: DENSITY_MEDIUM, mapSizeMenuLabel: "Ma\u0142y" });
var directMs = msSince(tDirect0);
console.log("\n=== CZASY (seed=42, Ma\u0142y, kontynenty) ===");
console.log("  generateMap (pe\u0142ny):     " + fmtSec(mapMs));
console.log("  generateMap rivers=low:  " + fmtSec(mapLowMs) + "  (delta W2 rzek \u2248 " + fmtSec(mapMs - mapLowMs) + ")");
console.log("  computeClusters:         " + fmtSec(clusterMs));
console.log("  buildClusterStartPlan:   " + fmtSec(planMs));
console.log("  clusters+spawn RAZEM:    " + fmtSec(clusterMs + planMs));
console.log("  reszta (map - rivers\u0394):  " + fmtSec(mapLowMs) + "  (~" + (mapLowMs / mapMs * 100).toFixed(0) + "% mapy)");
console.log("\n=== RZEKI na mapie ===");
console.log("  main=" + rs.main + " tributary=" + rs.trib + " total=" + rs.total);
console.log("\n=== KLASTRY ===");
console.log("  aktywneTypy=" + placement.aktywneTypy + " klastry=" + placement.klastry.length);
console.log("  spawnCities(AI)=" + plan.spawnCities.length + " pendingRivals=" + plan.pendingSameTypeRivals);
console.log('\n=== Udzia\u0142 faz w \u201ETworzenie \u015Bwiata" (tylko mapgen, bez buildScene) ===');
var rest = mapLowMs;
var rivers = mapMs - mapLowMs;
var total = mapMs;
console.log("  rzeki (szac. delta low\u2192medium): " + fmtSec(rivers) + " (" + (rivers / total * 100).toFixed(0) + "%)");
console.log("  reszta generatora:              " + fmtSec(rest) + " (" + (rest / total * 100).toFixed(0) + "%)");
console.log("  clusters+spawn (PO mapgen):     " + fmtSec(clusterMs + planMs) + " (poza overlay mapgen)");
