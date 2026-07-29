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

// tools/.population-growth-v85-bonus-entry.ts
var population_growth_v85_bonus_entry_exports = {};
__export(population_growth_v85_bonus_entry_exports, {
  buildRationParams: () => buildRationParams,
  computeCityRationCost: () => computeCityRationCost,
  computeGrowthPercentV85: () => computeGrowthPercentV85,
  resolveSpichlerzCityBonusState: () => resolveSpichlerzCityBonusState,
  spichlerzGrowthBonusPercent: () => spichlerzGrowthBonusPercent,
  spichlerzHealthBonus: () => spichlerzHealthBonus,
  spichlerzRationFoodCostMultiplier: () => spichlerzRationFoodCostMultiplier
});
module.exports = __toCommonJS(population_growth_v85_bonus_entry_exports);

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
var FALLBACK_BASELINE_RARITY = 1.35;
var FALLBACK_RIVER_SCALE = {
  mala: 1,
  srednia: 1.35,
  duza: 1.7,
  ogromna: 2.1,
  super: 2.6
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
function mapGenResourceBaselineRarity() {
  const v = map_gen_params_default.gestosc?.baseline_rarity_mult;
  return typeof v === "number" && v > 0 ? v : FALLBACK_BASELINE_RARITY;
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

// src/data/e-start-params-loader.ts
var R = e_start_params_default;
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

// src/map/generator.ts
var ROZMIAR_DIMS = mapGenRozmiarDims();

// src/map/newGameMapDefaults.ts
var DEFAULT_PLAYER_CIV_ID = eStartPlayerCivId();
var DEFAULT_START_EPOCH_ID = eStartEpochId();
var DEFAULT_RENDER_QUALITY = eStartRenderQualityBundled();
var RIVER_SCALE_BY_SIZE = {
  mala: mapGenRiverScale("mala"),
  srednia: mapGenRiverScale("srednia"),
  duza: mapGenRiverScale("duza"),
  ogromna: mapGenRiverScale("ogromna"),
  super: mapGenRiverScale("super")
};
var RIVER_REF_AREA = 168 * 120;
var RESOURCE_BASELINE_RARITY_MULT = mapGenResourceBaselineRarity();

// src/map/gen-helpers.ts
var RELIEF_MIN_MOUNTAINS = { low: 2, medium: 4, high: 5 };
var RELIEF_MIN_HIGHLANDS = { low: 2, medium: 4, high: 5 };
var MIN_MOUNTAINS_IRON_CELL = RELIEF_MIN_MOUNTAINS.medium;
var MIN_HIGHLANDS_COPPER_CELL = RELIEF_MIN_HIGHLANDS.medium;
var ERODE_TERRAIN_ORDER = [
  "wybrzeze" /* Wybrzeze */,
  "laka" /* Laka */,
  "pustynia" /* Pustynia */,
  "rownina" /* Rownina */,
  "wzgorza" /* Wzgorza */,
  "gory" /* Gory */
];
function isDryLandTerrain(tb) {
  return tb !== "morze" /* Morze */ && tb !== "wybrzeze" /* Wybrzeze */;
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
    pole_surowiec_ilosc_tura: "SUROW-TERYT-01 (Maciej 2026-07-23): produkcja PER ZBUDOWANE ULEPSZENIE w terytorium wlasciciela, niezaleznie od obsadzenia pola populacja (workedTiles). Wartosc = surowiec/ture. Stawki REALNE: Tartak->drewno 10, Glinianka->glina 15 (PYTANIE-84-B1/B9/U-18, korekta balansu Maciej 2026-07-29: bylo 20/20), Kamieniolom->kamien 4, Kopalnia miedzi->ruda 2, Kopalnia (zloze zelaza)->ruda_zelaza 2, Warzelnia soli->sol 10 (B2), Stadnina->kon 1 (B3), Kopalnia zlota->zloto 1 (B4). Brak pola w JSON -> domyslnie 2/ture (terrain-improvements.ts TERRITORY_YIELD_DEFAULT_AMOUNT, fallback bezpieczenstwa)."
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
  kopalnia: {
    nazwa: "Kopalnia",
    epoka: 1,
    bonus: {
      praca: 2,
      handel: 3
    },
    surowiecOdblokowany: "ruda",
    surowiecOdblokowany_uwaga: "ruda miedzi lub ruda_zelaza (zale\u017Cnie od z\u0142o\u017Ca); plon 2/t z kopalni. SUROW-TERYT-01 (Maciej 2026-07-23): stawka REALNA (nie placeholder) = 2/ture dla ruda_zelaza (kopalnia na z\u0142o\u017Cu \u017Celaza).",
    surowiec_ilosc_tura: 2,
    teren: "Wzg\xF3rza, G\xF3ry, z\u0142o\u017Ce rudy miedzi lub \u017Celaza",
    warunek: "wydobycie rudy do magazynu miasta (ruda / ruda_zelaza)",
    koszt_praca: 25,
    tech: "Murarstwo",
    odblokowuje: "Metal/Br\u0105z (jednostki br\u0105zowe, mury)"
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
    teren: "Wzg\xF3rza, G\xF3ry, z\u0142o\u017Ce miedzi (hex.zloze=miedz)",
    warunek: "ruda miedzi \u2192 magazyn (Odlewnia br\u0105zu)",
    koszt_praca: 22,
    tech: "Br\u0105zownictwo",
    odblokowuje: "Odlewnia br\u0105zu (budynek miejski)",
    uwagi: "ABC-7 + ABC-14 Maciej 2026-07-04: tylko heks ze z\u0142o\u017Cem rudy"
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

// data/epoka-ludnosc-manpower.json
var epoka_ludnosc_manpower_default = {
  _opis: "Skala ludno\u015Bci i Manpower per epoka imperium (wiersze 1\u201310). 1 ludek = ludno\u015B\u0107 absolutna na slot population (1\u201310). manpowerNaLudka = 10% ludekNaLudka. manpowerNaJednostke = manpowerNaLudka (koszt rekrutacji 1 jednostki = pe\u0142ny slot manpower; 1 ludek = 1 jednostka przy pe\u0142nej puli).",
  _formuly: {
    ludnoscAbsolutna: "population \xD7 ludekNaLudka[epoka]",
    manpowerMax: "population \xD7 manpowerNaLudka[epoka]",
    kosztRekrutacji: "manpowerNaJednostke[epoka] = manpowerNaLudka[epoka] per jednostka"
  },
  epoki: [
    { epoka: 1, ludekNaLudka: 1e4, manpowerNaLudka: 1e3, manpowerNaJednostke: 1e3 },
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
    wartosc: 5,
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

// src/game/zloto-access.ts
var ZLOTO_LABEL = "Z\u0142oto";

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
var DEPOSIT_RUNTIME_GATED_BUILDING_IDS = Object.freeze(
  Object.keys(DEPOSIT_LINKED_BUILDING_LABELS)
);
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
var DEFAULT_OUTPUT_SHARES = Object.freeze({
  produkcja: miasto_params_default.udzial_output_produkcja?.wartosc ?? 0.4,
  pieniadz: miasto_params_default.udzial_output_pieniadz?.wartosc ?? 0.3,
  nauka: miasto_params_default.udzial_output_nauka?.wartosc ?? 0.2,
  rozwoj: miasto_params_default.udzial_output_rozwoj?.wartosc ?? 0.1
});

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

// src/game/economy-upkeep.ts
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

// src/game/cities.ts
var MIN_CITY_DISTANCE = miasto_params_default.min_dystans_miast?.wartosc ?? 5;

// src/game/okolica.ts
var OKOLICA_RADIUS = miasto_params_default.zasieg_okolicy_miasta?.wartosc ?? 5;
var CITY_RANGE_MIN = miasto_params_default.zasieg_okolicy_baza?.wartosc ?? 5;
var CITY_RANGE_CAP = miasto_params_default.zasieg_okolicy_max?.wartosc ?? 15;

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
function pick(row, d, fallback) {
  if (!row) return fallback;
  const v = row[d];
  return Number.isFinite(v) ? v : fallback;
}
function buildRationParams(raw, difficulty = "normal") {
  const section = raw.ekonomia_miasta ?? raw;
  return {
    racjeZywnosc1: pick(section.racje_zywnosc_1, difficulty, 2),
    racjeZywnosc2: pick(section.racje_zywnosc_2, difficulty, 4),
    racjeZywnosc3: pick(section.racje_zywnosc_3, difficulty, 6),
    racjeWzrostProc1: pick(section.racje_wzrost_proc_1, difficulty, 3),
    racjeWzrostProc2: pick(section.racje_wzrost_proc_2, difficulty, 5),
    racjeWzrostProc3: pick(section.racje_wzrost_proc_3, difficulty, 7)
  };
}
function clampPoziomRacji(n) {
  const clamped = Math.min(WYZYWIENIE_MAX, Math.max(WYZYWIENIE_MIN, n));
  return Math.round(clamped / WYZYWIENIE_STEP) * WYZYWIENIE_STEP;
}
function rationFoodCostPerPop(level, _params) {
  return clampPoziomRacji(level);
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  buildRationParams,
  computeCityRationCost,
  computeGrowthPercentV85,
  resolveSpichlerzCityBonusState,
  spichlerzGrowthBonusPercent,
  spichlerzHealthBonus,
  spichlerzRationFoodCostMultiplier
});
