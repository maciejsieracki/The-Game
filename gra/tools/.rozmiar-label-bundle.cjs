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

// tools/.rozmiar-label-entry.ts
var rozmiar_label_entry_exports = {};
__export(rozmiar_label_entry_exports, {
  ROZMIAR_MENU_LABELS: () => ROZMIAR_MENU_LABELS,
  eStartHexDims: () => eStartHexDims,
  eStartMiastaPanstwa: () => eStartMiastaPanstwa,
  menuLabelToDims: () => menuLabelToDims,
  rozmiarFromMenuLabel: () => rozmiarFromMenuLabel
});
module.exports = __toCommonJS(rozmiar_label_entry_exports);

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
function eStartMiastaPanstwa(menuLabel) {
  return skalaRow(menuLabel)?.miasta_panstwa;
}
function eStartHexDims(menuLabel) {
  const row = skalaRow(menuLabel);
  if (row?.hex_w && row?.hex_h) return [row.hex_w, row.hex_h];
  return void 0;
}

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
var MIN_DEVELOPMENT_HEX_PER_CIV = 90;
var SMALL_MASS_CAP_THRESHOLD = 2 * MIN_DEVELOPMENT_HEX_PER_CIV;

// src/map/generator.ts
var ROZMIAR_DIMS = mapGenRozmiarDims();
var ROZMIAR_MENU_LABELS = [
  "Malenki",
  "Ma\u0142y",
  "Standardowy",
  "Du\u017Cy",
  "Ogromny",
  "Super Huge"
];
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ROZMIAR_MENU_LABELS,
  eStartHexDims,
  eStartMiastaPanstwa,
  menuLabelToDims,
  rozmiarFromMenuLabel
});
