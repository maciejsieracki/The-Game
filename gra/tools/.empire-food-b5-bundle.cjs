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

// tools/.empire-food-b5-entry.ts
var empire_food_b5_entry_exports = {};
__export(empire_food_b5_entry_exports, {
  advanceCityEconomy: () => advanceCityEconomy,
  advanceEmpireFood: () => advanceEmpireFood,
  applyArmyStarvationHpLoss: () => applyArmyStarvationHpLoss,
  autoBalanceRationsToSolvency: () => autoBalanceRationsToSolvency,
  bindEmpireFoodRuntime: () => bindEmpireFoodRuntime,
  buildEmpireFoodParams: () => buildEmpireFoodParams,
  clearLastEmpireFoodTicks: () => clearLastEmpireFoodTicks,
  freshEmpireFoodState: () => freshEmpireFoodState,
  getEmpireFoodMaxCap: () => getEmpireFoodMaxCap,
  isArmyHungry: () => isArmyHungry,
  isArmyStarving: () => isArmyStarving,
  isEmpireCityFoodSolvent: () => isEmpireCityFoodSolvent,
  recomputeCityFoodBalancesInEcon: () => recomputeCityFoodBalancesInEcon,
  simulateCityFoodCentralPool: () => simulateCityFoodCentralPool
});
module.exports = __toCommonJS(empire_food_b5_entry_exports);

// src/game/r-stawki-strojenie.ts
var R_STAWKI_KOSZT_MULT = 2;

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

// src/map/mapGenProgress.ts
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
var MAP_GEN_PHASE_KEYS = Object.keys(MAP_GEN_PHASE_LABELS);

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
var CLIMATE_DESERT_HALF_ROWS = 3.5;
var CLIMATE_DESERT_HALF_FRAC = CLIMATE_DESERT_HALF_ROWS / 108;
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
var RIVER_PROFILE_ON = globalThis.process?.env?.CIV_RIVER_PROFILE === "1";
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
  const pick4 = (key) => {
    const v = row?.[key];
    if (typeof v === "number" && Number.isFinite(v) && v >= 0) return v;
    const fb = row?.normal;
    if (typeof fb === "number" && Number.isFinite(fb) && fb >= 0) return fb;
    return DEFAULT_REPLENISH_PCT[key];
  };
  return { healPctMaxPerTurn: Math.min(100, pick4(difficulty)) };
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
var SPICHLERZ_EMPIRE_CAP_I = 100;
var SPICHLERZ_EMPIRE_CAP_II_FULL = 150;
function spichlerzArmyFoodCostMultiplier(opts) {
  let m = 1;
  if (!opts.onOwnTerritory && opts.solArmyBonusActive) m *= 0.5;
  if (opts.isGarrisonInSolCity) m *= 0.5;
  return m;
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
  if (!Number.isFinite(building.utrzymanie)) {
    return typeof flatOverride === "number" && Number.isFinite(flatOverride) ? flatOverride : 0;
  }
  const base = building.utrzymanie;
  const wzrost = Number.isFinite(building.przyrostUtrzymania) ? building.przyrostUtrzymania : 0;
  return Math.floor(buildingEffectAtLevel(base, wzrost, lvl));
}
function totalBuildingUpkeep(buildings, flatOverride) {
  let sum = 0;
  for (const b of buildings) {
    sum += buildingUpkeep(b.record, b.level, flatOverride);
  }
  return sum;
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
  return Math.round(base * R_STAWKI_KOSZT_MULT);
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
function unitFoodPerTurn(unit, p, foodTable = {}) {
  let base = p.zywnoscJednostkaRuch;
  if (unit.typeId && typeof foodTable[unit.typeId] === "number") {
    base = foodTable[unit.typeId];
  }
  if (base <= 0) return 0;
  if (unit.camping) {
    const ratio = p.zywnoscJednostkaOboz / (p.zywnoscJednostkaRuch || 1);
    base = base * ratio;
  }
  const onOwnTerritory = unit.onOwnTerritory ?? true;
  const mnoznikTerytorium = onOwnTerritory ? p.zywnoscMnoznikTerytorium ?? 1 : p.zywnoscMnoznikPozaTerytorium ?? 2;
  const food = base * mnoznikTerytorium;
  if (food <= 0) return 0;
  return food * R_STAWKI_KOSZT_MULT;
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
function clamp(x, lo, hi) {
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
  const threshold = clamp(params.progDominacjiPct, 0, 100) / 100;
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
  const scored = tiles.map((t) => ({ t, s: tileScore(yieldOf(t.q, t.r), opts.wagi) }));
  scored.sort((a, b) => {
    if (b.s !== a.s) return b.s - a.s;
    if (a.t.dist !== b.t.dist) return a.t.dist - b.t.dist;
    return a.t.key.localeCompare(b.t.key);
  });
  const n = Math.max(0, Math.min(Math.floor(Number.isFinite(population) ? population : 0), scored.length));
  return scored.slice(0, n).map((x) => x.t);
}
function wagiForFocus(focus = DEFAULT_OKOLICA_FOCUS) {
  switch (focus) {
    case "zywnosc":
      return { zywnosc: 3, praca: 0.5, handel: 0.5 };
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
  return assignWorkedTiles(city.q, city.r, pop, map, yieldOf, {
    radius,
    isWorkable: opts.isWorkable,
    territoryNodes: opts.territoryNodes,
    ownerId: opts.ownerId ?? city.ownerId,
    wagi: wagiForFocus(focus)
  });
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
function migrateLegacyRationLevel(old) {
  if (old === 1) return 2;
  if (old === 2) return 4;
  if (old === 3) return 6;
  return clampPoziomRacji(old);
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
function ensureCityRationDefaults(city) {
  if (!city.rationMigratedV114) {
    if (city.poziomRacji !== void 0 && Number.isInteger(city.poziomRacji) && city.poziomRacji >= 1 && city.poziomRacji <= 3) {
      city.poziomRacji = migrateLegacyRationLevel(city.poziomRacji);
    } else if (city.poziomRacji === void 0 && city.procentRozwoj !== void 0) {
      city.poziomRacji = migrateProcentRozwojToPoziomRacji(city.procentRozwoj);
    }
    city.rationMigratedV114 = true;
  }
  if (city.poziomRacji === void 0) {
    city.poziomRacji = DEFAULT_POZIOM_RACJI;
  } else {
    city.poziomRacji = clampPoziomRacji(city.poziomRacji);
  }
  if (city.wzrostUlamkowy === void 0) city.wzrostUlamkowy = 0;
  if (city.turyBezDoplaty === void 0) city.turyBezDoplaty = 0;
}

// src/game/cities.ts
var DEFAULT_OKOLICA_FOCUS = "zrownowazone";
var DEFAULT_OKOLICA_TRYB = "auto";
var DEFAULT_PODZIAL_HANDLU = {
  procentNauka: 20,
  procentPieniadz: 60,
  procentLuksus: 20
};
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
var MIN_CITY_DISTANCE = miasto_params_default.min_dystans_miast?.wartosc ?? 5;

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
var _spichlerzSolArmyByOwner = /* @__PURE__ */ new Map();
var _spichlerzSolCityIdsByOwner = /* @__PURE__ */ new Map();
function spichlerzSolArmyBonusActive(ownerId) {
  return _spichlerzSolArmyByOwner.get(ownerId) ?? false;
}
function spichlerzSolPayingCityIds(ownerId) {
  return _spichlerzSolCityIdsByOwner.get(ownerId) ?? /* @__PURE__ */ new Set();
}
function militaryFoodConsumptionWithSpichlerz(units, ownerId, upkeep, foodTable = {}, opts) {
  const solArmy = opts?.solArmyOverride ?? spichlerzSolArmyBonusActive(ownerId);
  const solCities = opts?.solCityIdsOverride ?? spichlerzSolPayingCityIds(ownerId);
  let sum = 0;
  for (const u of units) {
    if (u.ownerId !== ownerId) continue;
    const base = unitFoodPerTurn(u, upkeep, foodTable);
    const mult = spichlerzArmyFoodCostMultiplier({
      solArmyBonusActive: solArmy,
      onOwnTerritory: u.onOwnTerritory ?? true,
      isGarrisonInSolCity: !!(u.inGarnizon && u.garrisonCityId && solCities.has(u.garrisonCityId))
    });
    sum += base * mult;
  }
  return sum;
}
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
function recomputeCityFoodBalancesInEcon(perCity, cities, rationParams, spichlerzByCity) {
  const cityById = new Map(cities.map((c) => [c.id, c]));
  for (const tick of perCity) {
    const city = cityById.get(tick.cityId);
    if (!city) continue;
    const spichlerz = spichlerzByCity?.get(tick.cityId) ?? {
      ceramikaActive: tick.spichlerzCeramika ?? false,
      solActive: tick.spichlerzSol ?? false,
      maSpichlerzPop: tick.maSpichlerz ?? false,
      maSpichlerzIIPop: tick.maSpichlerzII ?? false
    };
    const produkcja = tick.zywnoscBrutto ?? Math.max(0, (tick.zywnoscNetto ?? 0) + (tick.kosztRacji ?? 0));
    const foodBal = computeCityFoodBalanceV85(
      produkcja,
      city.population,
      city,
      rationParams,
      spichlerz
    );
    tick.kosztRacji = foodBal.kosztRacji;
    tick.bilansLokalny = foodBal.bilansLokalny;
    tick.zywnoscNetto = foodBal.bilansLokalny;
    tick.poziomRacji = foodBal.poziomRacji;
  }
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

// src/game/barbarians.ts
var BARBARIAN_OWNER_ID = -1;
function isBarbarian(ownerId) {
  return ownerId === BARBARIAN_OWNER_ID;
}

// src/game/empire-food.ts
function pick3(row, d, fallback) {
  if (!row) return fallback;
  const v = row[d];
  return Number.isFinite(v) ? v : fallback;
}
function buildEmpireFoodParams(raw, difficulty = "normal") {
  const em = raw.ekonomia_miasta ?? raw;
  const gl = raw.globalne ?? raw;
  return {
    centralCapBaza: pick3(
      gl.magazyn_centralny_baza_zywnosc ?? em.magazyn_centralny_baza_zywnosc,
      difficulty,
      1e3
    ),
    centralCapBonusMagazyn: pick3(
      gl.magazyn_centralny_bonus_zywnosc_na_budynek ?? em.magazyn_centralny_bonus_zywnosc_na_budynek,
      difficulty,
      100
    ),
    glodWojskaHpFrac: pick3(em.glod_wojska_hp_frac, difficulty, 0.08),
    glodWojskaKarencjaTur: pick3(em.glod_wojska_karencja_tur, difficulty, 3),
    glodWojskaStatMult: pick3(em.glod_wojska_stat_mult, difficulty, 0.75),
    rationParams: buildRationParams(raw, difficulty)
  };
}
function freshEmpireFoodState(_procentRozwojDefault = 100) {
  return { zapasyPanstwa: 0, turyUjemnychZapasow: 0 };
}
function countMagazynByOwner(perCity, builtByCity) {
  const out = /* @__PURE__ */ new Map();
  if (!builtByCity) return out;
  const seen = /* @__PURE__ */ new Set();
  for (const tick of perCity) {
    if (seen.has(tick.cityId)) continue;
    seen.add(tick.cityId);
    if ((builtByCity.get(tick.cityId) ?? []).includes("magazyn")) {
      out.set(tick.ownerId, (out.get(tick.ownerId) ?? 0) + 1);
    }
  }
  return out;
}
function computeCentralFoodCap(ownerId, perCity, magazynCount, params) {
  let spichlerzCap = 0;
  for (const tick of perCity) {
    if (tick.ownerId !== ownerId || tick.oblegany) continue;
    if (tick.maSpichlerzII) spichlerzCap += SPICHLERZ_EMPIRE_CAP_II_FULL;
    else if (tick.maSpichlerz) spichlerzCap += SPICHLERZ_EMPIRE_CAP_I;
  }
  return params.centralCapBaza + params.centralCapBonusMagazyn * magazynCount + spichlerzCap;
}
function advanceEmpireFood(econ, units, states, upkeep, params, foodTable = {}, builtByCity) {
  const magazynCountByOwner = countMagazynByOwner(econ.perCity, builtByCity);
  const perOwner = [];
  const byOwner = /* @__PURE__ */ new Map();
  const ownerIds = /* @__PURE__ */ new Set([
    ...econ.perCity.map((t) => t.ownerId),
    ...states.keys(),
    ...units.map((u) => u.ownerId)
  ]);
  for (const ownerId of ownerIds) {
    if (isBarbarian(ownerId)) continue;
    const st = states.get(ownerId) ?? freshEmpireFoodState();
    if (!states.has(ownerId)) states.set(ownerId, st);
    const zapasyPrzed = st.zapasyPanstwa;
    let central = zapasyPrzed;
    let uprawaHodowla = 0;
    let wyzwienieLudnosci = 0;
    let pomocMiastom = 0;
    const deficits = [];
    const perCityRows = [];
    const fedByCityId = /* @__PURE__ */ new Map();
    for (const tick2 of econ.perCity) {
      if (tick2.ownerId !== ownerId || tick2.oblegany) continue;
      const produkcja = tick2.zywnoscBrutto ?? Math.max(0, tick2.zywnoscNetto + (tick2.kosztRacji ?? 0));
      const kosztRacji = tick2.kosztRacji ?? 0;
      const bilans = tick2.bilansLokalny ?? produkcja - kosztRacji;
      uprawaHodowla += produkcja;
      wyzwienieLudnosci += kosztRacji;
      perCityRows.push({
        cityId: tick2.cityId,
        name: tick2.cityId,
        produkcja,
        kosztRacji,
        bilans,
        wzrostProcent: tick2.wzrostProcent ?? 0,
        nakarmione: false
      });
      if (bilans >= 0) {
        central += bilans;
        fedByCityId.set(tick2.cityId, true);
      } else {
        deficits.push({ cityId: tick2.cityId, need: -bilans, name: tick2.cityId });
      }
    }
    for (const d of deficits) {
      const covered = Math.min(d.need, Math.max(0, central));
      central -= covered;
      pomocMiastom += covered;
      const fed = covered >= d.need;
      fedByCityId.set(d.cityId, fed);
      const row = perCityRows.find((r) => r.cityId === d.cityId);
      if (row) row.nakarmione = fed;
    }
    const nadwyzka = uprawaHodowla - wyzwienieLudnosci;
    const spichlerzStolicy = central;
    const kosztArmii = militaryFoodConsumptionWithSpichlerz(units, ownerId, upkeep, foodTable);
    central -= kosztArmii;
    const przyrostZapasow = central - zapasyPrzed;
    const maxCap = computeCentralFoodCap(
      ownerId,
      econ.perCity,
      magazynCountByOwner.get(ownerId) ?? 0,
      params
    );
    if (central > maxCap) central = maxCap;
    if (central < 0) central = central;
    st.zapasyPanstwa = central;
    _maxCapByOwner.set(ownerId, maxCap);
    const turyUjemnychZapasowPrzed = st.turyUjemnychZapasow ?? 0;
    const turyUjemnychZapasowPo = central < 0 ? turyUjemnychZapasowPrzed + 1 : 0;
    st.turyUjemnychZapasow = turyUjemnychZapasowPo;
    const tick = {
      ownerId,
      uprawaHodowla,
      wyzwienieLudnosci,
      nadwyzka,
      pomocMiastom,
      spichlerzStolicy,
      wojsko: kosztArmii,
      przyrostZapasow,
      zapasyPrzed,
      zapasyPo: central,
      maxCap,
      kosztArmii,
      glodWojska: central < 0,
      turyUjemnychZapasowPo,
      glodWojskaAtrycjaAktywna: turyUjemnychZapasowPo >= params.glodWojskaKarencjaTur,
      zywnoscBrutto: uprawaHodowla,
      doRozwoju: 0,
      doPanstwa: nadwyzka,
      perCityRows,
      fedByCityId
    };
    perOwner.push(tick);
    byOwner.set(ownerId, tick);
  }
  _setLastEmpireFoodTicks(byOwner);
  return { perOwner, byOwner };
}
var _lastTicks = /* @__PURE__ */ new Map();
var _statesRef = /* @__PURE__ */ new Map();
var _maxCapByOwner = /* @__PURE__ */ new Map();
function bindEmpireFoodRuntime(states) {
  _statesRef = states;
}
function getEmpireFoodMaxCap(ownerId) {
  return _maxCapByOwner.get(ownerId) ?? 0;
}
function isArmyHungry(ownerId) {
  if (isBarbarian(ownerId)) return false;
  return _lastTicks.get(ownerId)?.glodWojska ?? false;
}
function isArmyStarving(ownerId) {
  if (isBarbarian(ownerId)) return false;
  return _lastTicks.get(ownerId)?.glodWojskaAtrycjaAktywna ?? false;
}
function _setLastEmpireFoodTicks(ticks) {
  _lastTicks = ticks;
}
function clearLastEmpireFoodTicks() {
  _lastTicks = /* @__PURE__ */ new Map();
  _maxCapByOwner = /* @__PURE__ */ new Map();
}
function computeEmpireCityFoodNadwyzka(perCity, ownerId) {
  let uprawa = 0;
  let koszt = 0;
  for (const tick of perCity) {
    if (tick.ownerId !== ownerId || tick.oblegany) continue;
    const produkcja = tick.zywnoscBrutto ?? 0;
    const kosztRacji = tick.kosztRacji ?? 0;
    uprawa += produkcja;
    koszt += kosztRacji;
  }
  return uprawa - koszt;
}
function simulateCityFoodCentralPool(zapasyPrzed, perCity, ownerId) {
  let central = zapasyPrzed;
  const deficits = [];
  for (const tick of perCity) {
    if (tick.ownerId !== ownerId || tick.oblegany) continue;
    const produkcja = tick.zywnoscBrutto ?? 0;
    const koszt = tick.kosztRacji ?? 0;
    const bilans = tick.bilansLokalny ?? produkcja - koszt;
    if (bilans >= 0) {
      central += bilans;
    } else {
      deficits.push(-bilans);
    }
  }
  for (const need of deficits) {
    const covered = Math.min(need, Math.max(0, central));
    central -= covered;
  }
  return central;
}
function isEmpireCityFoodSolvent(zapasyPrzed, perCity, ownerId) {
  return computeEmpireCityFoodNadwyzka(perCity, ownerId) + zapasyPrzed >= 0;
}
function autoBalanceRationsToSolvency(opts) {
  const { ownerId, cities, econ, zapasyPrzed, rationParams, spichlerzByCity } = opts;
  const ownerCities = cities.filter((c) => c.ownerId === ownerId);
  if (ownerCities.length === 0) {
    return { adjusted: false, changes: [] };
  }
  if (isEmpireCityFoodSolvent(zapasyPrzed, econ.perCity, ownerId)) {
    return { adjusted: false, changes: [] };
  }
  const oldLevels = /* @__PURE__ */ new Map();
  for (const c of ownerCities) {
    ensureCityRationDefaults(c);
    oldLevels.set(c.id, getCityRationLevel(c));
  }
  const maxSteps = Math.round((WYZYWIENIE_MAX - WYZYWIENIE_MIN) / WYZYWIENIE_STEP) + 2;
  for (let step = 0; step < maxSteps; step++) {
    if (isEmpireCityFoodSolvent(zapasyPrzed, econ.perCity, ownerId)) break;
    let lowered = false;
    for (const c of ownerCities) {
      const lvl = getCityRationLevel(c);
      if (lvl > WYZYWIENIE_MIN) {
        c.poziomRacji = clampPoziomRacji(lvl - WYZYWIENIE_STEP);
        lowered = true;
      }
    }
    if (!lowered) break;
    recomputeCityFoodBalancesInEcon(econ.perCity, cities, rationParams, spichlerzByCity);
  }
  const changes = [];
  for (const c of ownerCities) {
    const oldLvl = oldLevels.get(c.id);
    const newLvl = getCityRationLevel(c);
    if (newLvl !== oldLvl) {
      changes.push({ cityId: c.id, name: c.name, oldLevel: oldLvl, newLevel: newLvl });
    }
  }
  return { adjusted: changes.length > 0, changes };
}

// src/game/army-starvation.ts
function applyArmyStarvationHpLoss(units, ownerId, hpFrac, getMaxHp) {
  const frac = Math.max(0, Math.min(1, hpFrac));
  if (frac <= 0) return { destroyedIds: [], damagedCount: 0 };
  const destroyedIds = [];
  let damagedCount = 0;
  for (const u of units) {
    if (u.ownerId !== ownerId) continue;
    if (isCivilianUnit(u)) continue;
    const maxHp = u.hpMax ?? getMaxHp(u.typeId);
    if (maxHp <= 0) continue;
    if (u.hpMax == null) u.hpMax = maxHp;
    if (u.hp == null) u.hp = maxHp;
    const loss = Math.max(1, Math.floor(maxHp * frac));
    u.hp = Math.max(0, u.hp - loss);
    damagedCount++;
    if (u.hp <= 0) destroyedIds.push(u.id);
  }
  return { destroyedIds, damagedCount };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  advanceCityEconomy,
  advanceEmpireFood,
  applyArmyStarvationHpLoss,
  autoBalanceRationsToSolvency,
  bindEmpireFoodRuntime,
  buildEmpireFoodParams,
  clearLastEmpireFoodTicks,
  freshEmpireFoodState,
  getEmpireFoodMaxCap,
  isArmyHungry,
  isArmyStarving,
  isEmpireCityFoodSolvent,
  recomputeCityFoodBalancesInEcon,
  simulateCityFoodCentralPool
});
