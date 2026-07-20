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
      low: { mountain: 0.03, highland: 0.07 },
      medium: { mountain: 0.06, highland: 0.11 },
      high: { mountain: 0.12, highland: 0.18 }
    },
    pasma_gorskie: {
      _opis: "Zadanie HILLS Q1/Q2 (2026-07-20): skupiska g\xF3r/wzg\xF3rz (seed-and-grow), spi\u0119te z tierem suwaka Relief (mountain_noise_threshold/highland_noise_threshold). Bez nowego suwaka UI. ZADANIE 3 (2026-07-20): d\u0142u\u017Csze/w\u0119\u017Csze \u0142a\u0144cuchy (kordyliery) zamiast okr\u0105g\u0142ych plam \u2014 dlugosc_min/max w g\xF3r\u0119, max_pasm_na_mase w d\xF3\u0142 (mniej ale d\u0142u\u017Cszych pasm), nowy obrzeze_szansa < 1 zmniejsza rozlewanie foothills na boki.",
      low: { hexy_na_pasmo: 320, max_pasm_na_mase: 2, dlugosc_min: 9, dlugosc_max: 11, min_masa_hexow: 40, obrzeze_szansa: 0.3 },
      medium: { hexy_na_pasmo: 240, max_pasm_na_mase: 3, dlugosc_min: 11, dlugosc_max: 14, min_masa_hexow: 30, obrzeze_szansa: 0.35 },
      high: { hexy_na_pasmo: 170, max_pasm_na_mase: 5, dlugosc_min: 13, dlugosc_max: 17, min_masa_hexow: 24, obrzeze_szansa: 0.4 }
    }
  },
  mapa_skala: {
    _opis: "Trzeciorz\u0119dny fallback (u\u017Cywany tylko gdy skala_mapy w e-start-params.json nie ma wpisu). \xD72 balans 2026-07-20, aktywne_typy przyci\u0119te do sufitu rosteru 15 nacji (ogromna/super).",
    aktywne_typy: {
      mala: 8,
      srednia: 10,
      duza: 12,
      ogromna: 15,
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
    glina: { rarity: 0.1 },
    konie: { rarity: 0.025 },
    wegiel: { rarity: 0.1 },
    owce: { rarity: 0.14 },
    bydlo: { rarity: 0.12 },
    lama: { rarity: 0.06 },
    luksus: { rarity: 0.06 },
    sol: { rarity: 0.12 }
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
  glina: 0.1,
  konie: 0.1,
  wegiel: 0.1,
  owce: 0.08,
  bydlo: 0.07,
  sol: 0.12
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
    Malenki: { rywale_ai: 2, miasta_panstwa: 8, typy_cywilizacji: 7, hex_w: 76, hex_h: 52 },
    Ma\u0142y: { rywale_ai: 3, miasta_panstwa: 10, typy_cywilizacji: 10, hex_w: 108, hex_h: 74 },
    Standardowy: { rywale_ai: 6, miasta_panstwa: 12, typy_cywilizacji: 12, hex_w: 168, hex_h: 120 },
    Du\u017Cy: { rywale_ai: 7, miasta_panstwa: 14, typy_cywilizacji: 14, hex_w: 240, hex_h: 168 },
    Ogromny: { rywale_ai: 8, miasta_panstwa: 16, typy_cywilizacji: 15, hex_w: 336, hex_h: 238 },
    "Super Huge": { rywale_ai: 10, miasta_panstwa: 16, typy_cywilizacji: 15, hex_w: 672, hex_h: 476 }
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
var RESOURCE_BASELINE_RARITY_MULT = mapGenResourceBaselineRarity();

// src/map/gen-helpers.ts
var RELIEF_OVERFLOW_CAP_MULT = Number.POSITIVE_INFINITY;
function isLandTerrain(tb) {
  return tb === "laka" /* Laka */ || tb === "rownina" /* Rownina */ || tb === "wzgorza" /* Wzgorza */ || tb === "pustynia" /* Pustynia */;
}
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
  ["gory" /* Gory */]: 6
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
    allowedOn: (h) => isDryLandTerrain(h.terenBazowy) && (h.terenBazowy === "laka" /* Laka */ || isLandTerrain(h.terenBazowy) && h.rzeka?.obecna === true),
    rarity: 0.1
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
    allowedOn: (h) => isDryLandTerrain(h.terenBazowy) && (h.terenBazowy === "pustynia" /* Pustynia */ || h.terenBazowy === "rownina" /* Rownina */),
    rarity: 0.12
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
    klucze_surowcow_ASCII: "drewno | kamien | glina | ruda | zelazo | stal | bydlo | owce | lama | kon | sol"
  },
  farma: {
    nazwa: "Farma",
    epoka: 1,
    bonus: {
      zywnosc: 3
    },
    surowiecOdblokowany: null,
    teren: "\u0141\u0105ka, R\xF3wnina",
    warunek: "ziemia uprawna; DZIA\u0141A BEZ rzeki (podstawowy)",
    koszt_praca: 20,
    tech: "Rolnictwo",
    odblokowuje: ""
  },
  irygacja: {
    nazwa: "Irygacja",
    epoka: 2,
    bonus: {
      zywnosc: 5
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
      praca: 3
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
      praca: 2
    },
    surowiecOdblokowany: "owce",
    surowiecOdblokowany_uwaga: "pierwsze na zlozu owiec; solo na wzgorzu; bez farmy/bydla",
    teren: "Wzg\xF3rza",
    warunek: "solo wzg\xF3rze; pierwsze: z\u0142o\u017Ce owiec; potem wzg\xF3rze bez z\u0142o\u017Ca po odblokowaniu",
    koszt_praca: 20,
    tech: "Oswojenie zwierz\u0105t",
    odblokowuje: "Owce (we\u0142na / jedzenie)"
  },
  lama: {
    nazwa: "Lama",
    epoka: 1,
    bonus: {
      zywnosc: 1,
      praca: 3
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
      praca: 2
    },
    surowiecOdblokowany: "kon",
    surowiecOdblokowany_uwaga: "ABC-18: tylko na z\u0142o\u017Cu konia + tech Je\u017Adziectwo",
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
      praca: 2
    },
    surowiecOdblokowany: "ruda",
    surowiecOdblokowany_uwaga: "klucz 'ruda' wg Surowiec='Ruda' w resources.json; brak pola id \u2014 propozycja EKONOMIA, wymaga uzgodnienia z DANE",
    teren: "Wzg\xF3rza, G\xF3ry, z\u0142o\u017Ce Rudy",
    warunek: "wydobycie rudy do magazynu",
    koszt_praca: 25,
    tech: "Murarstwo",
    odblokowuje: "Metal/Br\u0105z (jednostki br\u0105zowe, mury)"
  },
  glinianka: {
    nazwa: "Glinianka",
    epoka: 2,
    bonus: {
      praca: 1,
      glina: 2
    },
    surowiecOdblokowany: "glina",
    surowiecOdblokowany_uwaga: "GLINA-Q1=A (Maciej 2026-07-20): stala ilosc 2 glina/ture z ulepszenia (bonus.glina), analogicznie do drewna/kamienia. Klucz 'glina' wg Surowiec='Glina' w resources.json.",
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
      kamien: 1
    },
    surowiecOdblokowany: "kamien",
    surowiecOdblokowany_uwaga: "klucz 'kamien' wg Surowiec='Kamie\u0144' w resources.json; brak pola id \u2014 propozycja EKONOMIA; UWAGA: 'kamien' pojawia sie rowniez w bonus{} jako efekt plonu \u2014 DANE musi zdecydowac czy bonus.kamien = dostep czy liczba",
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
      pieniadz: 1
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
    bonus: {},
    surowiecOdblokowany: null,
    teren: "Las",
    warunek: "koszt 5 Pracy na start; +5 Pracy \xD7 1 tura (=5, netto zero); potem teren bazowy bez lasu",
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
      praca: 3
    },
    surowiecOdblokowany: "drewno",
    surowiecOdblokowany_uwaga: "v0.1: tylko dost\u0119p boolean (panel Surowce) \u2014 bez liczenia ilo\u015Bci w magazynie",
    teren: "L\u0105d w terytorium (\u0142\u0105ka, lasy, wzg\xF3rza\u2026)",
    warunek: "sta\u0142e ulepszenie; MO\u017BE na lesie \u2014 las NIE znika; odblokowuje dost\u0119p do drewna (v0.1 bez ilo\u015Bci)",
    koszt_praca: 25,
    tech: "Obr\xF3bka drewna",
    odblokowuje: "Deski (z budynkiem miejskim Tartak)"
  },
  tarasy: {
    nazwa: "Tarasy uprawne",
    epoka: 2,
    bonus: {
      zywnosc: 3
    },
    surowiecOdblokowany: null,
    teren: "Wzg\xF3rza",
    warunek: "Wzg\xF3rze w terytorium; solo; +\u017Cywno\u015B\u0107; nie na z\u0142o\u017Cu",
    koszt_praca: 25,
    tech: "Rolnictwo",
    odblokowuje: "",
    uwagi: "T-TECH-4 Maciej 2026-07-04: po Rolnictwie \u2014 wszystkie cywilizacje"
  },
  lodzie_rybackie: {
    nazwa: "\u0141odzie rybackie",
    epoka: 1,
    bonus: {
      zywnosc: 2,
      praca: 3
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
      zywnosc: 1
    },
    surowiecOdblokowany: "sol",
    surowiecOdblokowany_uwaga: "klucz 'sol' \u2014 Sol nie ma wpisu w resources.json v0.1 (brak Surowiec='Sol'); propozycja EKONOMIA: dodac 'sol' do resources.json; wymaga uzgodnienia z DANE",
    teren: "z\u0142o\u017Ce soli (Pustynia/R\xF3wnina \u2014 hex.zloze=sol)",
    warunek: "s\xF3l (konserwacja \u017Cywno\u015Bci + handel); bez wybrze\u017Ca bez z\u0142o\u017Ca",
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
    bonus: {},
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
      praca: 2
    },
    surowiecOdblokowany: "ruda",
    teren: "Wzg\xF3rza, G\xF3ry, z\u0142o\u017Ce Rudy",
    warunek: "wst\u0119pne przetwarzanie rudy (przed Odlewni\u0105 w mie\u015Bcie)",
    koszt_praca: 22,
    tech: "Br\u0105zownictwo",
    odblokowuje: "Odlewnia br\u0105zu (budynek miejski)",
    uwagi: "ABC-7 + ABC-14 Maciej 2026-07-04: tylko heks ze z\u0142o\u017Cem rudy"
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
  ["morze" /* Morze */]: Infinity
};
var _terrainCosts = { ...DEFAULT_TERRAIN_COSTS };

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
