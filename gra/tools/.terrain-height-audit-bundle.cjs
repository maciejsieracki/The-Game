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

// tools/.terrain-height-audit-entry.ts
var terrain_height_audit_entry_exports = {};
__export(terrain_height_audit_entry_exports, {
  LAND_MIN_CLEARANCE_ABOVE_SEA: () => LAND_MIN_CLEARANCE_ABOVE_SEA,
  SEA_SURFACE_TOP_Y: () => SEA_SURFACE_TOP_Y,
  auditMapTerrainData: () => auditMapTerrainData,
  generateMap: () => generateMap,
  terrainHeightAudit: () => terrainHeightAudit
});
module.exports = __toCommonJS(terrain_height_audit_entry_exports);

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
    }
  },
  mapa_skala: {
    aktywne_typy: {
      mala: 4,
      srednia: 5,
      duza: 6,
      ogromna: 8,
      super: 10
    },
    domyslni_rywale: {
      mala: 6,
      srednia: 7,
      duza: 9,
      ogromna: 11,
      super: 15
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
    konie: { rarity: 0.1 },
    wegiel: { rarity: 0.1 },
    owce: { rarity: 0.08 },
    bydlo: { rarity: 0.07 },
    lama: { rarity: 0.06 },
    luksus: { rarity: 0.06 },
    sol: { rarity: 0.12 }
  },
  metal_deposit_min_era: {
    miedz: 2,
    zelazo: 3
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
    Malenki: { rywale_ai: 2, miasta_panstwa: 4, typy_cywilizacji: 4, hex_w: 76, hex_h: 52 },
    Ma\u0142y: { rywale_ai: 3, miasta_panstwa: 5, typy_cywilizacji: 5, hex_w: 108, hex_h: 74 },
    Standardowy: { rywale_ai: 6, miasta_panstwa: 6, typy_cywilizacji: 6, hex_w: 168, hex_h: 120 },
    Du\u017Cy: { rywale_ai: 7, miasta_panstwa: 7, typy_cywilizacji: 7, hex_w: 240, hex_h: 168 },
    Ogromny: { rywale_ai: 8, miasta_panstwa: 8, typy_cywilizacji: 10, hex_w: 336, hex_h: 238 },
    "Super Huge": { rywale_ai: 10, miasta_panstwa: 8, typy_cywilizacji: 12, hex_w: 672, hex_h: 476 }
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
    szybka: 0.2,
    standardowa: 1,
    dluga: 5
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
    nazwa: "Byd\u0142o",
    epoka: 1,
    bonus: {
      zywnosc: 2,
      praca: 3
    },
    surowiecOdblokowany: "bydlo",
    surowiecOdblokowany_uwaga: "ABC-18: dost\u0119p dopiero po postawieniu na z\u0142o\u017Cu byd\u0142a",
    teren: "\u0141\u0105ka, R\xF3wnina",
    warunek: "plaski l\u0105d; pierwsze: z\u0142o\u017Ce byd\u0142a; potem po odblokowaniu \u2014 bez z\u0142o\u017Ca; + farma lub solo; NIE na Pustyni",
    koszt_praca: 20,
    tech: "Oswojenie zwierz\u0105t",
    odblokowuje: "Byd\u0142o (Rydwan po odblokowaniu)"
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
    teren: "\u0141\u0105ka, R\xF3wnina, Wzg\xF3rza",
    warunek: "solo; tylko cyw. Inkowie; pierwsze: z\u0142o\u017Ce lamy; NIE na Pustyni",
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
      praca: 1
    },
    surowiecOdblokowany: "glina",
    surowiecOdblokowany_uwaga: "klucz 'glina' wg Surowiec='Glina' w resources.json; brak pola id \u2014 propozycja EKONOMIA",
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
    warunek: "darmowa wycinka; +20 Pracy/tur\u0119 \xD7 3 tury (=60); potem teren bazowy bez lasu",
    koszt_praca: 0,
    tech: null,
    wycinka: {
      praca_per_tura: 20,
      tury: 3,
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
    tech: "Wojskowosc",
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
  popalnia_brazu: {
    nazwa: "Popalnia br\u0105zu",
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
var DEFAULT_WIDTH = 36;
var DEFAULT_HEIGHT = 28;
function generateMap(width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT, seed = 42, typ = "kontynenty", genOpts) {
  const effectiveSeed = seed || 42;
  const wgn = resolveWorldGenNumbers(genOpts);
  const landFraction = resolveLandFraction(genOpts, typ);
  const terrainTh = {
    desert: wgn.desertThreshold,
    forest: wgn.forestThreshold,
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
        climateZoneAt(q, r, height)
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
  }
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
  if (typ !== "pangea") {
    purgeInlandWaterForMultiLandTyp(hexes, width, height);
  } else {
    purgeInlandWaterForMultiLandTyp(hexes, width, height);
  }
  finalizeCoastAndInlandWater(hexes, width, height, 3, coastOpts);
  const reliefTier = genOpts?.worldDensity?.relief ?? genOpts?.worldDensity?.rivers ?? "medium";
  const forestTier = genOpts?.worldDensity?.forest ?? "medium";
  reapplyLandTerrain(hexes, terrainScratch, terrainTh, height);
  if (typ !== "pangea") {
    purgeInlandWaterForMultiLandTyp(hexes, width, height);
  }
  applyReliefByNoiseRank(hexes, terrainScratch, reliefTier, width, height, typ, zoneOf, nZones);
  reapplyForestOverlay(hexes, terrainScratch, terrainTh, typ, forestTier, zoneOf, nZones, height);
  enforceMapBorderOcean(hexes, width, height);
  if (typ !== "pangea") {
    purgeInlandWaterForMultiLandTyp(hexes, width, height);
  }
  finalizeCoastAndInlandWater(hexes, width, height, 2, coastOpts);
  purgeReliefValleyWater(hexes, width, height);
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
  if (typ === "ziemia") {
    enforceEarthTemplateOnHexes(hexes, width, height);
    purgeOceanInsideEarthLandMask(hexes, width, height);
    finalizeCoastAndInlandWater(hexes, width, height, 2, coastOpts);
    enforceEarthTemplateOnHexes(hexes, width, height);
    purgeOceanInsideEarthLandMask(hexes, width, height);
  }
  finalizeLandMassAfterCoast(hexes, typ, width, height, coastOpts, 2);
  placeDeposits(hexes, effectiveSeed, void 0, wgn.resourceMult, wgn.resourceBaseline);
  ensureDepositGridCoverage(hexes, reliefTier, typ, zoneOf, nZones, rand);
  finalizeLandMassAfterCoast(hexes, typ, width, height, coastOpts, 1);
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
  ensureForestGridCoverage(hexes, terrainScratch, forestTier, typ, zoneOf, nZones, rand);
  purgeInlandWaterForMultiLandTyp(hexes, width, height);
  purgeDesertEnclaveWater(hexes, width, height);
  const riversTier = genOpts?.worldDensity?.rivers ?? "medium";
  clearRiverMarks(hexes);
  const { paths: riverPaths, kinds: riverPathKinds } = generateRivers(hexes, width, height, rand, {
    minLen: wgn.riverTrace.minLen,
    maxLen: wgn.riverTrace.maxLen,
    margin: wgn.riverTrace.margin,
    riversTier,
    worldTyp: typ
  });
  topUpRiverGridCoverage(
    hexes,
    width,
    height,
    riverPaths,
    riverPathKinds,
    rand,
    riversTier,
    wgn.riverTrace.minLen,
    wgn.riverTrace.maxLen
  );
  stripRiverMarksFromOpenSea(hexes);
  stripDepositsFromWater(hexes);
  const startPositions = computeStartPositions(hexes, effectiveSeed, {
    minCount: 5,
    minDist: 5,
    absMinDist: 2
  });
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
function normMenuLabel(label) {
  return normPlMenuLabel(label);
}
function rozmiarFromMenuLabel(label) {
  const n = normMenuLabel(label);
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
function riverGridTraceMinLen(catalogMinLen, tier = "medium") {
  const cap = tier === "low" ? 10 : 12;
  return Math.min(catalogMinLen, cap);
}
function resolveRiverTraceForMap(mapMenuLabel, riversTier) {
  const base = riverTraceLimitsForMap(mapMenuLabel);
  const minLen = riverMinPathLengthForTier(riversTier);
  return {
    minLen,
    maxLen: Math.max(base.maxLen, minLen * 3, minLen + 40),
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

// src/map/earth-land-mask.generated.ts
var EARTH_MASK_W = 720;
var EARTH_MASK_H = 400;
var EARTH_MASK_BBOX = {
  minX: 0.0723,
  minY: 0.0551,
  maxX: 0.9917,
  maxY: 0.9123
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
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111100000111111111111011100000011111110110000000111101111111000111100000000000000000000000000001111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111000000000000000000011111000000000000000111111111111111111111111111111111111111111111111111111111111000000000000000000011110000110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111000000011111111111110011100000000000000000000000111001111111111111111000000000000000000000000000001111111111111111111111111111111111111101100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111100000000000000000011111101100000111100011111111111111111111111111111111111111111111111111111111111111110000000000000001111111110111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000011111111111111111000000000000001100000000111101111111111111111000000000000000000000000000001111111111111111111111111111111111111100110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111100000000000000000011111001100000111000111111111111111111111111111111111111111111111111111111111111111110000000000000001111111110111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000011111111111111111000000000000111110000010111111111111111111111111000000000000000000000000000011111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000101111110010000000000000000000000000000000000111100000000000000011111110001110011111111111111111111111111111111111111111111111111111111111111111111111100000111111111111111111111111110000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010111111111111111110000001000000000000000000000000000000000000000000000111111111111110000000001111000000000000011111110111111111111111000000000000000000000001111111111111111111111111111111111001011000000000000000000000000000000000000000000000000000000000000000111111111111111000000000000000000000000000000000000000011100000000011111110001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111110000000000000000000000000000000000000000000000001111111111111100000000001111000000000000000011000011111111111111100000000000000000010100111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000011111111111111000000000000000000000000000000000000000010100000000011111110001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111000000110000001111111111111100000000001111111100001111000001110000111110000000011110000000001111111111111100000000000000000000000011111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000001111111111111111111111111100000000000000000001100000000000000011111110000011111100001001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100011110001100000000111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011000000000000000000000011111111111111111111111111111111111111111011100011111111111111111111111110001100000000000000000000000001111101100000011100000000010001111111100000000000000000000000000111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000101111111111111111111111111111111111000000001110000000011110011111111111111100000111100000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111100000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111000000000000001100000000010001011111110000011111100000000110000111111111010000000000000000011111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111100001111000111111111111111111111111111111111110001111000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111100000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111000000000000111110000000110001111111111000111111100000001110000111111111110000000000000000011111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111100001111000011111111111111111111111111111111110001111000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111110011111111111111110011111111111111111110000000000000000111111111110000000000000000111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111110000111111111111111111111111111111011111101110001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100100000000000000000111111110011111110000000000000011111111111111111111111110000000000000000000100000001110000000000000000000000000000000000000000001111111111111111111111111111111111111111111110111111111111111111111111111001111111110000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000111111100011111100000000000000111111111111111111111101100000000000000000000100000000110000000000000000000000000000000000000000001111111111111111111111111111111111111111111100111111111111111111111111111001111111110000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001001111111111100000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000001111111100001100000000000000000011111111111111111100000000000000000000000111111111111111000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001100000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000111100000000011001111111111110000000000000000000000011111111111111110000000000000000000000000111111111111111000000000000000000000000000000000000001111111111111111100001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000001111110000000100000011111111111000000000000000000000011111111111111100000000000000000000000000010111111111110000000000000000000000000000000000000011111111111111111100011111111111111111111111111111111111111111111111111111111110111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000001110111000000000000011111111111000000000000000000000011111111111111100000000000000000000000000010111111111110000000000000000000000000000000000000011111111111111111100011111111111111111111111111111111111111111111111111111111110111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000001111000111000000000000000000000011111111111111000000000000000000000000000000101100000000000000000000000000000000000000000011111111111111111111011111111111111111111111111111111111111111111111111111111111110111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000111100001000000000000000000000001111111111110000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000011000000000000000000001100000000000000000000000000001111111111100000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000001110011000000000001000000000000000000000000001111111111100000000000000000000000000000000000000000000000000000011000000000000000000111111111111111111100000011111111111111111111111111111111111111111111111111111111111111011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000001111111110000000000000000000000000000000000001111111111000000000000000000000000000000000000000000000000000000000000000000000000010111111111111111111100000011111111111111111111111111111111111111111111111111111111111111011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000011100011111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111100011001111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000001111111111110000000000000000000000000000000000000001110000000000000000000000000000000000000000000000000000000000000000010000000000111111111111111111100000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000100001111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111110001011000111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000001111111111110000000000000000000000000000000000000001110000000000000000000000000000000000000000000000000000000000000000010000000000111111111111111111100000011111111111111111111111111111111111111111111111111111111111111011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000100001111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000100111111111111111000111000000000000111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000011111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111000000011110000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000011111101000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111000010000000000000000001111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000011111111111000000011000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110100011110000000000011100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001011011111100000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000011111111111111110000111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000111111100011111111100000000011011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000011110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001001111100000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000011111111111111110001111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111100011111111100000000010111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000011110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011100000000000000000000000000000001011111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111101100000000000000000000001111111100000001000011111111111111111111111111111111111111111111111111111111110111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000011110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001100000000000000000000000000001011111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111100000000000000000011101111111000100001110011111111111111111111111111111111111111111111111111111111111011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011000000000000000000000000000000000001011111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111100000000000000000011101111111100100001110011111111111111111111111111111111111111111111111111111111111011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000110100111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000001111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111100000000000000001111100111111100000001111111111111111111111111111111111111111111111111111111111111111011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000111101111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111000000000000001000001111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111000000000000000011110001111010000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000011111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001011111111111111111111111111111111111111111111111111111111111111111111111111111000000000000001111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111011111110000000000000001110001000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000011111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000110000000000000000000000000000000000000000000000001011111111111111111111111111111111111111111111111111111111111111111111111111111000000000000011111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000010011111110000000000000001110011001000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000011111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111100000001111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000011111111011110000000000000001010000000000011000011111111111111111111111111111111111111111111111111111111111111011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000011111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111100000111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000011111111000011111000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111100001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000001111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111100000111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000011111111000011111000000000000000011111111001111111111111111111111111111111111111111111111111111111111111111111111101011101111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000001111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111000000111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000011111111001111111110000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111101111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100010000000000000000000000011111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111110000000111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000011111111001111111111000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111101111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111101100000000000000000000001111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111000000111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000111111100011111111111000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111101111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111101110000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111100001111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000111111100011111111111000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111110111111101111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100110000000000000000000000101000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111100011111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000011000000001111111111000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111001100111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110101000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100001100000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111110000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111001111100111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100001100000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111110111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110001111100111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001100011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111110111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100011000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000001000000000111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010101111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110001110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000111000000000001111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000010011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100011111000000000011111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100011110000000000000111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000101111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000011011101111000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000001001100000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000001001100000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111100111111100001111111111111111111110000001111111111110001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111000001110000001111111111111111110100000001111111110000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111000001110000001111111111111111111100000001111111110000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110001111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111110111111111111111111111111111111000001111110111111111111111111100000000111111111110000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000011110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111110000111111111111111111111111100000000010000000111111111111111100000000111111111110000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000001110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111100011111000111111111111111111111111100000000000000000001111111111111110000000111111111111100001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000011100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000001100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111100011111000111111111111111111111111100000000000000000001111111111111110000000111111111111100001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000011100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111110111100000011111110000111111111111111111111000000000000000000000100001111111111100000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100111100000000000011111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111000000000010101111110000000111111111111111111000000000000000000000000111111111111100000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111000000000010101111110000000111111111111111111000000000000000000000000011111111111100000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100010100000000000111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010111111111111111111111000000000010000111111100000011111111111111111000000000000000000000000011111101111110000000100111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000100001100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111110000000000000000001111111100001111111111111111111000011111111000000000111111111100000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000011000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111110000000000000011100000001111111001111111111001111000111111111111111111111111111111111111100000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000111111111111100000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111110000000000000011100000001111111001111111111001111000111111111111111111111111111111111111010000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111110000000000000011100000000011100101111111110000001111111111111111111111111111111111111111110000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000111111111111000000000000000000000110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111010001000000000011100000000000111000011111100000001111111111111111111111111111111111111111110000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000110000011110000000000000000000000011100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111110000000000000000000000000000101000001111111000000111111111111111111111111111111111111111000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000111100000000000000000000011110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111110000000000000010000000000000111000001111111000000111111111111111111111111111111111111111000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000111000000000000000000000011110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111110010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111000000000000000000000000111111100000000011011000001111111111111111111111111111111111111111000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000111110000000000000000000011110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111110010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111110000000000000000000000000111100000000000011111000000111111111111111111111111111111111111111100000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000111100000000000000000011110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111110000000000000000000000000111100000000000011111000000111111111111111111111111111111111111111110000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000011110111100000000000000000011110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111110100000000000000000001100000001111000000000001110000000011111111111111111111111111111111111111111110000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000011110000000000000000011110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011000000000000001111111111111110000000000000000000000000000000000011000011100001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000111110000000000000011111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111110000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000011111100000000000011111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111110000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000011111100000000000011111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011000000011111111111111111111111000000000000000000000000111110000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000011111110000000111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111110000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111010000000000010000000000111100011001100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111100000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000010000000000111100011001100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111100000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000010000000001110000011100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111110000000000000001100000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111110000000000000001100000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111100000000001111110000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111000000000111111111000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011100111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111000000000111111111000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000011111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111000000011111111111100000011101111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000011111111111111111111111111111111111111111111000000011111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111110001111111111111111111111111111111111111111111111111111111001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000011111111111111111111111111111111111000011111000000000000011100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111110011111111111111111111111111110000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001100011111111111111111111111111111111110000001111000000000000011100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111110011111111111111111111111111110000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100001111111111111111111111111111111100000000000000000000000011110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111110011011111111111111111111111111000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000111111111111111111111111111100000000000000000000000000011110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111101111111111111111111111111111000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000110000111111111111111111111111110000000000000000000000000000011110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000111111111111111111111111110000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000110000011111111111111111111111110000000000000000000000000000011110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000111111111111111111111111110000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111000011111111111111111111111100000000000000000000000000000011110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000001111111111111111111111110000000011110001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011000000111111111111111111111100000000000000000000000000000001110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000001111111111111111111111111000000000010000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011000000111111111111111111111110000000000000000000000000000001110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000001111111111111111111111111000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000111111111111111111111100000000000000000000000000000000110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000111111111111111111111111100000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000111111111111111111111100000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000111111111111111111111111100000000000000000000011111101100011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000011111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000011111111111111111111111110000000001110000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000011111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000011111111111111111111111111100000001110000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011000001111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000111111111111111111111111100000011110000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000011000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000011111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000011111111111111111111111111111111111100000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000011000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000011111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000011111111111111111111111111111111111010000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000011000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111110000000000000000000000000001100011000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000011111111111111111111111111111111111111110000000000000000000001111111111111111111111111111111111111111001111111111111111111111111111111111111111111111101000000011000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111100000000000000000000000000010000011110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000011111111111111111111111111111111111111111000000000000000000111111011111111111111111111111111111111111000111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111110000000000000000000000000000000000001110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000001111111111111111111111111111111111111110000000000000000000001111011111111111111111111111111110100000000111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111110000000000000000000000000000000000000110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000001111111111111111111111111111111111111110000000000000000000001111011111111111111111111111111111000000000111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111000000000000001111100000000000000000111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000111111111111111111111111111111111111010000000000000000000000110000111111111111111111111111110000000000111111111111111111111111111111100011100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111000000000000011111100000000000000000001111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000011111111111111111111111111111111111000000000000000000000000000000111111111111111111111111100000000000111111111111111111111111111100000001100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111000000000000001111100000000000000000001111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000001111111111111111111111111111111111000000000000000000000000000000111111111111111111111111100000000000011111111111111111111111111100000001100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111100000000000111111000000000000000000000000000001111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000001111111111111111111111111111111110000000000000000000000000000001111111111111111111111111000000000000000011111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111100000000000111111000000000000000000000000000001111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000001111111111111111111111111111111100000000000000000000000000000000111111111111111111111100000000000000000011111111111111111111111100000011100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111110000000011111100000000000000000000000000000001111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000011111111111111111111111111111000000000000000000000000000000000111111111111111111111100000000000000000000111111111111111111111100000011100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111000001011111100000000000000000000000000001001110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000011111111111111111111111111111000000000000000000000000000000000111111111111111111111100000000000000000000111111111111111111111100000011100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000001111111111111111111111111100000000000000000000000000000000000111111111111111111110000000000000000000000111111111111111111111100000000000000000000000000000011100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000001011111111111111111111111100000000000000000000000000000000000011111111111111111100000000000000000000000011111111111111111111111000000000000000000000000000011100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000011111111111111111110000000000000000000000000000000000000000011111111111111111000000000000000000000000011100011111111111111101100000000000000000000000000011110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000011111111111111111110000000000000000000000000000000000000000011111111111111111000000000000000000000000111100001111111111111111100000000000000000000000000011110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111110001111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000011111111111111111100000000000000000000000000000000000000000011111111111111110000000000000000000000000111000011111111111111111111000000000000000000000000011100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000011111111111111111100000000000000000000000000000000000000000000111111111110000000000000000000000000000000000001111111111111111111100000000000000000000000111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000011111111111111111000000000000000000000000000000000000000000000111111111110000000000000000000000000000000000001111111111111111111100000000000000000000000111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000001111111111110000000000000000000000000000000000000000000000000111111111110000000000000000000000000000000000001111111111111111111110000000000000000000000011100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100001111111111000000000000000000000000000000000000000000000000000011111111110000000000000000000000000000000000001111111111111111111110000000000000000000000001100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110001111110000000000000000000000000000000000000000000000000000000011111111110000000000000000000000000000000000001111111111111111111111100000000000000000000000001110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110001111110000000000000000000000000000000000000000000000000000000011111111110000000000000000000000000000000000001111101111111111111111100000000000000000000000000110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111101100000000000000000000000000000000000000000000000000000000000001111111110000000000000000000000000000000000000011001111111111111111100000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111110000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000001111111110000000000000000000000000100000000000011000001111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000001111111110000000000000000000000000100000000000010000001111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011110000000000000000000000011000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000011111110000000000000000000000000100000000000010000000001111111111100000000000000000000000000000101000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011110000000000000000000111110011111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000011111000000000000000000000000000000000000000000000000011111110000000000000000000000000000000000000010000000001111111110000000000000000000000000001100111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001110000000000000000011111111111111111110000111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000111111111100000000000000000000000000000000000000000000000000001111110000000000000000000000000000000000000010000000000011111000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001110000000000000000011111111111111001110000111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000111111111110000000000000000000000000000000000000000000000000001111110000000000000000000000000000000000000010000000000011111000000000000000000000000000000001011000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011100000000000000011111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000001111000000000000000000000000000000000000000010000000000001110000000000000000000000000000000011000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001110000010100000111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000001111000000000000000000000000000000000000000011000000000000000000000000000000000000000000000010000110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111100110001111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000010000110000000000000000000000000000000000011100000000000000000000000000000000000000000000000000111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111100001001111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000010000110000000000000000000000000000000000011100000000001000000000000000000000000000000000000000111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011000001111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000111000000000000000000000000000000000001100000000000000000000000000000000000000000000001111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000111000000000000000000000000000000000000010000000000000000000000000000000000000000000000000111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000111000000000000000000000000000000000000010000000000000000000000000000000000000000001000000111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000111000000000000000000000000000000000000001000000000000000000000000000000000000000000000001100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111110000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000001110000000000000000000000000000011100000000000000110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111100001111100000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111100000000000000000000000000111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111100001111100000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111100000000000000000000000000111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000011000000000000000000000000000110001111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010110000000111110000000000000000000000000111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111100000111110000000000000000000000111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111100000111110000000000000000000000111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001110000011110000000000000000000001111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111100001110000000000000000000011111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011110001111000000000000000111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011110001111000000000000000111111111111101000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111000011000000000000000111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111110000000000000001111111111111111111000000000000000000111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111000000000000001111111111111111111000000000000000000111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111110000000000001111111111111111100000011111111000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000011111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111000000000001111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000011111111111111111111111111111111111111111111111111111111111100110100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111000000000001011111111111111100001100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000011111111111111111111111111111111111111111111111111111111111000110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111000000000000011111111111111100001100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111011110011111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111100000000000011111111111111000011100010000000000000000011111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111101111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111100000000000011111111111100000011111100000100000000000001111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001011111111111111111111111111111111111111111111111111111111111111111111110110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111110111000000001111111111100000011111100000000000000000000000000000011110000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111011000000001111111111100000011101100000000000000000000000110000111111000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111100000000000001001111100000011101100000000000010000000011110001111111110000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111100000000000000000011000000001101100000000000000000100001111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111100000000000000000011100000001101110000000000000000100001111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111110100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111100000000000000000000000000001100010000000000000000000000000111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111100000000000000000000000000001100000000000000000000000000000000011111111111111110000000000000100000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011100000000000000000000000000000000000000000000000000000000000000000111111111111111000000000001000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010100000000000000000000000000000000000000000000000000000000000000000111111111111111000000000011000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011000000000000000000000000000000000000000000000000000000000000000011111111111111110000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111000000000000000000000000000000000000000000000000000000000000011111111111111111000000000000000010000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111100000000000000000000000000000000000000000000000000000000000011111111111111111000000000000000010000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111010000000000000000000000000000000000000000000000000011111111111111110000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111000000000000000000000000000000000000000000000000111111111100000111000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111011100000000001000000000000000000000000000011111000000011110000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111001110000000001000000000000000000000000000001111000000011110000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000001110000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000110000000000000000000000000000000000000000000000111100000000000000000000100000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000110000000000000000000000000000000000000000000000111100000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000101111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111000000000001110000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111110000000000000000011000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111000000000001110000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111110000000000000000111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111110000000000001110000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111110000000000000000111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111110000000000001110000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111110000000000000001111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000111111111110000000000001110000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111100000000000000111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111100000111111111000000000000001111100000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111100000000000000111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111100000111111111000000000000011111110000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111000000000000001111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111110000000000011111110000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111000000000001111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111000000000011111110000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111100000000000011111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111110000000011111110000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111100000000000011111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111110000000011111110000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111100000000000001111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111100000111111110000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111000000000000001111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111100000111111110000000000000000000000000000000000000000000000000000000000000001100000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111000000000000001111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000001100000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111110000000000000001111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111000000000000000000011111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111110000000000000000000011111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111110000000000000000000011111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111110000000000000000001111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111110000000000000000001111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000011000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111110000000000000000011111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111110000000000000000011111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111110000000000000000011111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000010000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111110000000000000000011111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111110000000000000000011111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111110000000000000000011111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111110000000000000000011111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111110000000000000000000001111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111110000000000000000000001111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111110100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111010000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111110100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111000001111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111100000000000111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111000000000000000000011111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111100000000000000000000011111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111000000000000000000000011110011111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111110111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111000000000000000000000000000000000000011111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111000000000000000000000000000000000000011111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111110000101000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111000000000000000000000000000000000000000011111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111110000000000000000000000000000000000000000000001000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111110000000000000000000000000000000000000000000001000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001011111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111000000000000000000000000000000000000000000000000010000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111100000000000000000000000000000000000000000000000000001100000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111000111000000000000000000000000000000000000000000000000000011111100000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111110000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111110000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111110000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011100000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011100000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111100010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011011000000000000000000000000000000000000000000000111001100000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000110001111111111110010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011110000000000000000000000000000000000000000000001110000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000110001111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011110000000000000000000000000000000000000000000001110000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111010000000000000000000000000000000000000000001110000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000101111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111110100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111110100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111100000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111100000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111100000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111110000000000000000011000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010001110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001001110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000101110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001100011000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000101100011000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011110000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
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
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111110000000000000000000000000000000000000000000000000000000000000000011111111110000000111110000000000000000000000011111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000010011100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111110000000000000000000000000000000000000000000000111111111111111111111111111111100011111111110000000111111110000111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111110000000000000000000000001111011111111111111111111111111111111111111111111111111111110111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111011111111111111111111111111111111110000000000000001111110011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000110000000111111111111111111111111111111111111111111000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011100000000111111111111111111111111111111111111111111000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111011010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001100001111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111000001111111111111111111111111111111111111111110000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111100010011110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111000000000011111000000000011111111111111111111111111111111111111111111111111111111110000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111101100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011110011111111000000000000000000000000000000000000000000000000000000000000000000000000000011000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111101110111110000000000000000000000000000000000000000000000000000000000000000000011100111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011000111100110111100000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111011000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111110000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000100000000000000000011000000001110111111000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111101111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111100000000001110000000000110000001000001011110111111000000000000000000000000000000000000000000000000000000000000001011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001100000000000000000000000000011111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000111001100000000000000111111111111111111111111111111111100111111111111111100000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111101111111111111111111111111111111110000111100001111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000001011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111011111111111111000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000110011111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000111110111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110001000000000000000000000000000000000000000011111100000000000111011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000110000000000000000000000011111000000000000001000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000001111111111000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000001000000000001111111010000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000011111111111100111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001100000111111111111111111111111111111111111111111111111111111111111111111111111111111101111111111111111000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110111111111111110001111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111101111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001100000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111100000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
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
  const innerW = Math.max(1, width - 1 - 2 * b);
  const innerH = Math.max(1, height - 1 - 2 * b);
  const pq = (q - b) / innerW;
  const pr = (r - b) / innerH;
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
  const b = EARTH_PLAYABLE_BORDER;
  const innerW = Math.max(1, width - 1 - 2 * b);
  const innerH = Math.max(1, height - 1 - 2 * b);
  const { minX, minY, maxX, maxY } = EARTH_MASK_BBOX;
  const cellW = (maxX - minX) / innerW;
  const cellH = (maxY - minY) / innerH;
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
var CLIMATE_ARID_HALF_FRAC = 0.075;
var CLIMATE_TROPICAL_HALF_FRAC = 0.3;
function climateZoneAt(_q, r, height) {
  const midRow = (height - 1) / 2;
  const dist = Math.abs(r - midRow) / (height / 2);
  if (dist < CLIMATE_ARID_HALF_FRAC) return "arid";
  if (dist < CLIMATE_TROPICAL_HALF_FRAC) return "tropical";
  return "temperate";
}
function climateForestThreshold(zone, baseForTh) {
  if (zone === "arid") return 1.1;
  if (zone === "temperate") return baseForTh - 0.06;
  return baseForTh;
}
function canAssignClimateDesert(zone) {
  return zone === void 0 || zone === "arid";
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
function classifyTerrain(elevContinental, landMask, mtnNoise, forNoise, desNoise, thresholds, climateZone) {
  const desTh = thresholds?.desert ?? 0.63;
  const forTh = climateForestThreshold(climateZone, thresholds?.forest ?? 0.58);
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
    } else if (canAssignClimateDesert(climateZone) && desNoise > desTh && elevContinental > 0.18 && elevContinental < 0.45) {
      terenBazowy = "pustynia" /* Pustynia */;
    } else if (elevContinental > 0.35) {
      terenBazowy = "rownina" /* Rownina */;
    } else {
      terenBazowy = "laka" /* Laka */;
    }
    if (climateZone !== "arid" && terenBazowy !== "gory" /* Gory */ && terenBazowy !== "pustynia" /* Pustynia */ && forNoise > forTh && (landMask > 0.04 || elevContinental > 0.14)) {
      nakladka = "las" /* Las */;
    }
  }
  return { terenBazowy, nakladka };
}
function classifyTerrainFlat(elevContinental, landMask, _mtnNoise, forNoise, desNoise, thresholds, climateZone) {
  const desTh = thresholds?.desert ?? 0.63;
  const forTh = climateForestThreshold(climateZone, thresholds?.forest ?? 0.58);
  let terenBazowy;
  let nakladka = "brak" /* Brak */;
  if (elevContinental < 0.14) {
    terenBazowy = "laka" /* Laka */;
  } else if (canAssignClimateDesert(climateZone) && desNoise > desTh && elevContinental > 0.18 && elevContinental < 0.45) {
    terenBazowy = "pustynia" /* Pustynia */;
  } else if (elevContinental > 0.35) {
    terenBazowy = "rownina" /* Rownina */;
  } else {
    terenBazowy = "laka" /* Laka */;
  }
  if (climateZone !== "arid" && terenBazowy !== "pustynia" /* Pustynia */ && forNoise > forTh && (landMask > 0.04 || elevContinental > 0.14)) {
    nakladka = "las" /* Las */;
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
        const h = hexes[hexKey(q, r)];
        if (!h || !isForestEligibleTerrain(h.terenBazowy) || h.nakladka !== "brak" /* Brak */) return false;
        if (mapHeight && climateZoneAt(q, r, mapHeight) === "arid") return false;
        return true;
      }).map(([q, r]) => ({ k: hexKey(q, r), n: scratch.get(hexKey(q, r))?.forNoise ?? 0 })).sort((a, b) => b.n - a.n);
      if (eligible.length === 0) continue;
      const mid = land[Math.floor(land.length / 2)];
      const cellZone = mapHeight ? climateZoneAt(mid[0], mid[1], mapHeight) : "temperate";
      const zoneShareMul = cellZone === "temperate" ? 1.35 : 1;
      const minForest = typ === "pangea" ? 0 : 1;
      const target = Math.max(minForest, Math.round(eligible.length * share * zoneShareMul));
      const cap = Math.min(target, Math.max(2, Math.ceil(eligible.length * 0.18)));
      for (let i = 0; i < Math.min(cap, eligible.length); i++) {
        hexes[eligible[i].k].nakladka = "las" /* Las */;
        assigned++;
      }
    }
  }
  return assigned;
}
function reapplyLandTerrain(hexes, scratch, thresholds, mapHeight) {
  for (const [key, hex] of Object.entries(hexes)) {
    if (hex.terenBazowy === "morze" /* Morze */ || hex.terenBazowy === "wybrzeze" /* Wybrzeze */) {
      continue;
    }
    const s = scratch.get(key);
    if (!s) continue;
    const { q, r } = hex.coords;
    const climateZone = mapHeight ? climateZoneAt(q, r, mapHeight) : void 0;
    const { terenBazowy, nakladka } = classifyTerrainFlat(
      s.elevContinental,
      s.landMask,
      s.mtnNoise,
      s.forNoise,
      s.desNoise,
      thresholds,
      climateZone
    );
    hex.terenBazowy = terenBazowy;
    hex.nakladka = nakladka;
  }
}
var FALLBACK_RELIEF_FRAC = {
  low: { mountain: 0.03, highland: 0.07 },
  medium: { mountain: 0.06, highland: 0.11 },
  high: { mountain: 0.12, highland: 0.18 }
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
  return tb !== "morze" /* Morze */ && tb !== "wybrzeze" /* Wybrzeze */ && tb !== "gory" /* Gory */ && tb !== "pustynia" /* Pustynia */;
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
  low: 0.22,
  medium: 0.36,
  high: 0.5
};
function applyReliefToLandKeys(hexes, scratch, tier, keys, width, height) {
  if (keys.length === 0) return;
  applyIronMountainsToLandKeys(hexes, scratch, tier, keys, width, height);
  applyCopperHighlandsToLandKeys(hexes, scratch, tier, keys, width, height);
}
function reliefBonusCapMountain(tier, landCount) {
  const frac = tier === "high" ? 0.14 : tier === "low" ? 0.05 : 0.09;
  return Math.max(0, Math.ceil(landCount * frac));
}
function reliefBonusCapHighland(tier, landCount) {
  const frac = tier === "high" ? 0.22 : tier === "low" ? 0.08 : 0.14;
  return Math.max(0, Math.ceil(landCount * frac));
}
function reliefSpreadCapMountain(tier, landCount) {
  const frac = tier === "high" ? 0.08 : tier === "low" ? 0.03 : 0.04;
  return Math.max(MIN_MOUNTAINS_IRON_CELL, Math.ceil(landCount * frac));
}
function reliefSpreadCapHighland(tier, landCount) {
  const frac = tier === "high" ? 0.12 : tier === "low" ? 0.05 : 0.06;
  return Math.max(MIN_HIGHLANDS_COPPER_CELL, Math.ceil(landCount * frac));
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
var MIN_HIGHLANDS_COPPER_CELL = 2;
var MIN_MOUNTAINS_IRON_CELL = 2;
function waterCoverageCellSize(tier = "medium") {
  if (tier === "high") return 5;
  if (tier === "low") return 15;
  return 10;
}
function ironCoverageCellSize(tier = "medium") {
  if (tier === "high") return 20;
  if (tier === "low") return 35;
  return 25;
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
function cellHasIronPackage(cellLand, hexes) {
  return countMountainsInCell(cellLand, hexes) >= MIN_MOUNTAINS_IRON_CELL;
}
function cellHasCopperPackage(cellLand, hexes) {
  return countHighlandsInCell(cellLand, hexes) >= MIN_HIGHLANDS_COPPER_CELL;
}
function pickReliefForceHex(land, hexes, scratch, width, height, want, avoid, rand, protectHighland = false, protectMountain = false) {
  const ranked = land.filter(([q, r]) => {
    const k = hexKey(q, r);
    if (avoid.has(k)) return false;
    const hex = hexes[k];
    if (!hex || hex.terenBazowy === "morze" /* Morze */) return false;
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
function forceReliefTypeInCell(land, hexes, scratch, width, height, rand, want, minCount) {
  const countFn = () => want === "mountain" ? countMountainsInCell(land, hexes) : countHighlandsInCell(land, hexes);
  if (countFn() >= minCount) return false;
  let changed = false;
  const placed = /* @__PURE__ */ new Set();
  let guard = 0;
  while (countFn() < minCount && guard++ < land.length + 8) {
    const protectHighland = want === "mountain" && countHighlandsInCell(land, hexes) <= MIN_HIGHLANDS_COPPER_CELL;
    const protectMountain = want === "highland" && countMountainsInCell(land, hexes) <= MIN_MOUNTAINS_IRON_CELL;
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
        if (want === "mountain" && hex.terenBazowy === "gory" /* Gory */) return false;
        if (want === "highland" && hex.terenBazowy === "wzgorza" /* Wzgorza */) return false;
        return true;
      }).map(([q, r]) => ({ q, r, n: scratch.get(hexKey(q, r))?.mtnNoise ?? 0 })).sort((a, b) => b.n - a.n);
      if (ranked.length === 0) break;
      spot = [ranked[0].q, ranked[0].r];
    }
    const k = hexKey(spot[0], spot[1]);
    hexes[k].terenBazowy = want === "mountain" ? "gory" /* Gory */ : "wzgorza" /* Wzgorza */;
    hexes[k].nakladka = "brak" /* Brak */;
    placed.add(k);
    changed = true;
  }
  return changed;
}
function forceIronMountainsInCell(land, hexes, scratch, width, height, rand) {
  return forceReliefTypeInCell(
    land,
    hexes,
    scratch,
    width,
    height,
    rand,
    "mountain",
    MIN_MOUNTAINS_IRON_CELL
  );
}
function forceCopperHighlandsInCell(land, hexes, scratch, width, height, rand) {
  return forceReliefTypeInCell(
    land,
    hexes,
    scratch,
    width,
    height,
    rand,
    "highland",
    MIN_HIGHLANDS_COPPER_CELL
  );
}
function capMountainOverflowInCell(land, hexes, scratch, tier, spreadOnly = false) {
  const maxMtn = spreadOnly ? reliefSpreadCapMountain(tier, land.length) : Math.max(MIN_MOUNTAINS_IRON_CELL, reliefBonusCapMountain(tier, land.length) + MIN_MOUNTAINS_IRON_CELL);
  const mountains = land.filter(([q, r]) => hexes[hexKey(q, r)]?.terenBazowy === "gory" /* Gory */).map(([q, r]) => ({ q, r, n: scratch.get(hexKey(q, r))?.mtnNoise ?? 0 })).sort((a, b) => a.n - b.n);
  let changed = false;
  while (mountains.length > maxMtn && mountains.length > MIN_MOUNTAINS_IRON_CELL) {
    const drop = mountains.shift();
    hexes[hexKey(drop.q, drop.r)].terenBazowy = "wzgorza" /* Wzgorza */;
    hexes[hexKey(drop.q, drop.r)].nakladka = "brak" /* Brak */;
    changed = true;
  }
  return changed;
}
function capHighlandOverflowInCell(land, hexes, scratch, tier, spreadOnly = false) {
  const maxHi = spreadOnly ? reliefSpreadCapHighland(tier, land.length) : Math.max(MIN_HIGHLANDS_COPPER_CELL, reliefBonusCapHighland(tier, land.length) + MIN_HIGHLANDS_COPPER_CELL);
  const highlands = land.filter(([q, r]) => hexes[hexKey(q, r)]?.terenBazowy === "wzgorza" /* Wzgorza */).map(([q, r]) => ({ q, r, n: scratch.get(hexKey(q, r))?.mtnNoise ?? 0 })).sort((a, b) => a.n - b.n);
  let changed = false;
  while (highlands.length > maxHi && highlands.length > MIN_HIGHLANDS_COPPER_CELL) {
    const drop = highlands.shift();
    hexes[hexKey(drop.q, drop.r)].terenBazowy = "rownina" /* Rownina */;
    hexes[hexKey(drop.q, drop.r)].nakladka = "brak" /* Brak */;
    changed = true;
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
    const cells = [...eligibleCells].sort((a, b) => (cellHasIronPackage(a, hexes) ? 1 : 0) - (cellHasIronPackage(b, hexes) ? 1 : 0));
    for (const land of cells) {
      if (cellHasIronPackage(land, hexes)) continue;
      if (forceIronMountainsInCell(land, hexes, scratch, width, height, rand)) inner++;
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
    const cells = [...eligibleCells].sort((a, b) => (cellHasCopperPackage(a, hexes) ? 1 : 0) - (cellHasCopperPackage(b, hexes) ? 1 : 0));
    for (const land of cells) {
      if (cellHasCopperPackage(land, hexes)) continue;
      if (forceCopperHighlandsInCell(land, hexes, scratch, width, height, rand)) inner++;
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
  return tb !== "morze" /* Morze */;
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
    if (h.terenBazowy === "morze" /* Morze */) sea++;
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
    if (nh?.terenBazowy === "morze" /* Morze */) n++;
  }
  return n;
}
function countLandNeighbors(hexes, q, r) {
  let n = 0;
  for (const [dq, dr] of HEX_DIRECTIONS) {
    const nh = hexes[hexKey(q + dq, r + dr)];
    if (nh && nh.terenBazowy !== "morze" /* Morze */) n++;
  }
  return n;
}
function isCoastalLandHex(hexes, q, r) {
  const h = hexes[hexKey(q, r)];
  if (!h || h.terenBazowy === "morze" /* Morze */) return false;
  return countMorseNeighbors(hexes, q, r) > 0;
}
function isCoastalMorseHex(hexes, q, r) {
  const h = hexes[hexKey(q, r)];
  if (h?.terenBazowy !== "morze" /* Morze */) return false;
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
function applyLandFractionByScore2(hexes, landScores, targetLandFraction, width, height) {
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
  applyLandFractionByScore2(hexes, landScores, targetLandFraction, width, height);
  applyMarginalLandZoneCaps(hexes, landScores, width, height);
  enforceMapBorderOcean(hexes, width, height);
  applyLandFractionByScore2(hexes, landScores, targetLandFraction, width, height);
  applyMarginalLandZoneCaps(hexes, landScores, width, height);
  enforceMapBorderOcean(hexes, width, height);
  applyDoubleCoastRing(hexes);
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
    if (!isDryLandTerrain(hex.terenBazowy)) continue;
    const parts = key.split(",");
    const q = Number(parts[0]);
    const r = Number(parts[1]);
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nb = hexes[hexKey(q + dq, r + dr)];
      if (nb?.terenBazowy === "morze" /* Morze */) {
        toCoast.push(key);
        break;
      }
    }
  }
  for (const key of toCoast) hexes[key].terenBazowy = "wybrzeze" /* Wybrzeze */;
  return toCoast.length;
}
function applyDoubleCoastRing(hexes) {
  let n = applyCoastRing(hexes);
  const toCoast = [];
  for (const [key, hex] of Object.entries(hexes)) {
    if (!isDryLandTerrain(hex.terenBazowy)) continue;
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
  for (const key of toCoast) hexes[key].terenBazowy = "wybrzeze" /* Wybrzeze */;
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
function mapHeightFromHexes(hexes) {
  let maxR = 0;
  for (const h of Object.values(hexes)) {
    if (h.coords.r > maxR) maxR = h.coords.r;
  }
  return maxR + 1;
}
function sanitizeCoastHexes(hexes) {
  const valid = /* @__PURE__ */ new Set();
  for (const [key, hex] of Object.entries(hexes)) {
    if (hex.terenBazowy !== "wybrzeze" /* Wybrzeze */) continue;
    const parts = key.split(",");
    const q = Number(parts[0]);
    const r = Number(parts[1]);
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nb = hexes[hexKey(q + dq, r + dr)];
      if (nb && isDryLandTerrain(nb.terenBazowy)) {
        valid.add(key);
        break;
      }
    }
  }
  let propagated = true;
  while (propagated) {
    propagated = false;
    for (const [key, hex] of Object.entries(hexes)) {
      if (hex.terenBazowy !== "wybrzeze" /* Wybrzeze */ || valid.has(key)) continue;
      const parts = key.split(",");
      const q = Number(parts[0]);
      const r = Number(parts[1]);
      for (const [dq, dr] of HEX_DIRECTIONS) {
        const nk = hexKey(q + dq, r + dr);
        if (hexes[nk]?.terenBazowy === "wybrzeze" /* Wybrzeze */ && valid.has(nk)) {
          valid.add(key);
          propagated = true;
          break;
        }
      }
    }
  }
  let fixed = 0;
  const mapHeight = mapHeightFromHexes(hexes);
  for (const [key, hex] of Object.entries(hexes)) {
    if (hex.terenBazowy !== "wybrzeze" /* Wybrzeze */) continue;
    const parts = key.split(",");
    const q = Number(parts[0]);
    const r = Number(parts[1]);
    const touchesSea = HEX_DIRECTIONS.some(
      ([dq, dr]) => hexes[hexKey(q + dq, r + dr)]?.terenBazowy === "morze" /* Morze */
    );
    if (!valid.has(key)) {
      let pustN = 0;
      for (const [dq, dr] of HEX_DIRECTIONS) {
        const nh = hexes[hexKey(q + dq, r + dr)];
        if (nh && nh.terenBazowy === "pustynia" /* Pustynia */) pustN++;
      }
      const inArid = climateZoneAt(q, r, mapHeight) === "arid";
      hex.terenBazowy = inArid && pustN >= 2 ? "pustynia" /* Pustynia */ : "laka" /* Laka */;
      hex.nakladka = "brak" /* Brak */;
      delete hex.zloze;
      fixed++;
      continue;
    }
    if (!touchesSea) {
      hex.terenBazowy = "laka" /* Laka */;
      fixed++;
    }
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
    const inArid = climateZoneAt(q, r, height) === "arid";
    hex.terenBazowy = inArid && (pustN >= 2 || dryN > 0 && pustN >= dryN * 0.4) ? "pustynia" /* Pustynia */ : "laka" /* Laka */;
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
    if (opts?.maxInlandPoolSize != null) {
      removeSmallInlandWaterPools(hexes, width, height, opts.maxInlandPoolSize);
    } else {
      removeInlandWaterPools(hexes, width, height);
    }
    applyDoubleCoastRing(hexes);
    sanitizeCoastHexes(hexes);
    if (opts?.maxInlandPoolSize != null) {
      removeSmallInlandWaterPools(hexes, width, height, opts.maxInlandPoolSize);
    } else {
      removeInlandWaterPools(hexes, width, height);
    }
    if (findInlandWaterHexes(hexes, width, height).length === 0 && findDryLandTouchingSea(hexes).length === 0) {
      break;
    }
  }
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
function countOpenOceanLandSpecks2(hexes) {
  let n = 0;
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
    if (dryLandNeighbors === 0) n++;
  }
  return n;
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
function auditMapTerrainData(hexes, width, height) {
  const byTeren = {};
  for (const hex of Object.values(hexes)) {
    const k = hex.terenBazowy;
    byTeren[k] = (byTeren[k] ?? 0) + 1;
  }
  const inlandMorse = findInlandSeaHexes2(hexes, width, height);
  const inlandSet = new Set(inlandMorse);
  const visited = /* @__PURE__ */ new Set();
  let enclosedInlandMorzeComponents = 0;
  for (const start of inlandMorse) {
    if (visited.has(start)) continue;
    enclosedInlandMorzeComponents++;
    const stack = [start];
    visited.add(start);
    while (stack.length > 0) {
      const cur = stack.pop();
      const parts = cur.split(",");
      const q = Number(parts[0]);
      const r = Number(parts[1]);
      for (const [dq, dr] of HEX_DIRECTIONS) {
        const nk = hexKey(q + dq, r + dr);
        if (visited.has(nk) || !inlandSet.has(nk)) continue;
        visited.add(nk);
        stack.push(nk);
      }
    }
  }
  return {
    totalHexes: Object.keys(hexes).length,
    byTeren,
    openOceanLandSpecks: countOpenOceanLandSpecks2(hexes),
    enclosedInlandMorzeHexes: inlandMorse.length,
    enclosedInlandMorzeComponents
  };
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
    hex.terenBazowy = climateZoneAt(q, r, height) === "arid" && pustN >= 2 ? "pustynia" /* Pustynia */ : "laka" /* Laka */;
    hex.nakladka = "brak" /* Brak */;
    hex.rzeka = { obecna: false, krawedzie: [] };
    delete hex.zloze;
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
var RIVER_MOUTH_TAIL_LEN = 5;
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
function canRiverFlowThrough(hex, cellKey, sourceKey) {
  if (!hex || hex.terenBazowy === "morze" /* Morze */) return false;
  if (isReliefTerrain(hex.terenBazowy)) return cellKey === sourceKey;
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
function growRiverInlandBeforeDrainage(hexes, sq, sr, seaDist, openOceanDist, rand, inlandTargetLen, stepCap) {
  const srcKey = hexKey(sq, sr);
  const path = [{ q: sq, r: sr }];
  const visited = /* @__PURE__ */ new Set([srcKey]);
  while (path.length < inlandTargetLen && path.length < stepCap) {
    const cur = path[path.length - 1];
    const curKey = hexKey(cur.q, cur.r);
    const curD = seaDist.get(curKey) ?? 0;
    const curOd = openOceanDist.get(curKey) ?? Infinity;
    const candidates = [];
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nq = cur.q + dq;
      const nr = cur.r + dr;
      const nk = hexKey(nq, nr);
      if (visited.has(nk)) continue;
      if (!canRiverFlowThrough(hexes[nk], nk, srcKey)) continue;
      const nd = seaDist.get(nk) ?? 0;
      if (nd < RIVER_MIN_INLAND_FROM_SEA) continue;
      const od = openOceanDist.get(nk) ?? Infinity;
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
function greedyRiverDrainToSea(hexes, sq, sr, seaDist, openOceanDist, oceanConnected, maxLen, rand, sourceKey) {
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
      if (!canRiverFlowThrough(hexes[nk], nk, sourceKey)) continue;
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
function aStarRiverToSea(hexes, sq, sr, seaDist, openOceanDist, oceanConnected, maxLen, rand = () => 0) {
  const startK = hexKey(sq, sr);
  const h0 = openOceanDist.get(startK) ?? seaDist.get(startK);
  if (h0 == null) return [];
  if (oceanConnected.has(startK)) return [{ q: sq, r: sr }];
  const gScore = /* @__PURE__ */ new Map([[startK, 0]]);
  const cameFrom = /* @__PURE__ */ new Map();
  const stepDir = /* @__PURE__ */ new Map();
  const open = /* @__PURE__ */ new Set([startK]);
  const fScore = /* @__PURE__ */ new Map([[startK, h0]]);
  let bestK = startK;
  let bestH = h0;
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
      if (!canRiverFlowThrough(hexes[nk], nk, startK)) continue;
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
      fScore.set(nk, tg + (openOceanDist.get(nk) ?? Infinity));
      open.add(nk);
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
    if (!canRiverFlowThrough(nh, nk, "")) continue;
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
function extendRiverToWybrzeze(hexes, path, seaDist) {
  if (path.length === 0) return path;
  const visited = new Set(path.map((p) => hexKey(p.q, p.r)));
  let cq = path[path.length - 1].q;
  let cr = path[path.length - 1].r;
  for (let extra = 0; extra < RIVER_MOUTH_TAIL_LEN; extra++) {
    const endHex = hexes[hexKey(cq, cr)];
    if (!endHex) break;
    if (endHex.terenBazowy === "wybrzeze" /* Wybrzeze */) {
      const touchesMorse = HEX_DIRECTIONS.some(
        ([dq, dr]) => hexes[hexKey(cq + dq, cr + dr)]?.terenBazowy === "morze" /* Morze */
      );
      if (touchesMorse) break;
    }
    if (endHex.terenBazowy === "morze" /* Morze */) break;
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
      if (nh.terenBazowy === "wybrzeze" /* Wybrzeze */) {
        score -= 8;
        if (HEX_DIRECTIONS.some(
          ([ddq, ddr]) => hexes[hexKey(nq + ddq, nr + ddr)]?.terenBazowy === "morze" /* Morze */
        )) score -= 12;
      }
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
  const mouthReady = (q, r) => {
    const h = hexes[hexKey(q, r)];
    if (!h) return false;
    if (h.terenBazowy === "wybrzeze" /* Wybrzeze */) {
      return HEX_DIRECTIONS.some(
        ([dq, dr]) => hexes[hexKey(q + dq, r + dr)]?.terenBazowy === "morze" /* Morze */
      );
    }
    return isRiverDrainageGoal(q, r, seaDist, hexes, sourceKey, oceanConnected);
  };
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
      if (nh.terenBazowy === "wybrzeze" /* Wybrzeze */) {
        score -= 15;
        if (HEX_DIRECTIONS.some(
          ([ddq, ddr]) => hexes[hexKey(nq + ddq, nr + ddr)]?.terenBazowy === "morze" /* Morze */
        )) score -= 20;
      }
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
  const stepCap = Math.max(
    inlandTarget + RIVER_MOUTH_TAIL_LEN + 12,
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
    stepCap
  );
  const tailFrom = path[path.length - 1];
  const drainBudget = Math.max(RIVER_MOUTH_TAIL_LEN + 4, stepCap - path.length + 1);
  let drainPath = aStarRiverToSea(
    hexes,
    tailFrom.q,
    tailFrom.r,
    seaDist,
    openOceanDist,
    oceanConnected,
    drainBudget,
    rand
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
      srcKey
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
      rand
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
        srcKey
      );
    }
  }
  if (path.length > stepCap) path = path.slice(0, stepCap);
  path = extendRiverToWybrzeze(hexes, path, seaDist);
  path = finishRiverMouthAtSea(hexes, path, seaDist, openOceanDist, oceanConnected, srcKey);
  path = repairRiverPathAdjacency(path, hexes, srcKey);
  if (!riverPathRespectsSeaBuffer(hexes, path, seaDist) || !pathEndsAtSea(hexes, path, dims.width, dims.height, oceanConnected)) {
    return [];
  }
  return path;
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
  const eligible = (h) => h.terenBazowy !== "morze" /* Morze */ && (isRiverLandTerrain(h.terenBazowy) || h.terenBazowy === "wybrzeze" /* Wybrzeze */);
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
function appendJunctionDownstreamHex(path, down) {
  if (!down || path.length < 2) return path;
  const last = path[path.length - 1];
  const prev = path[path.length - 2];
  if (hexAxialDistance(last.q, last.r, down.q, down.r) !== 1) return path;
  if (down.q === prev.q && down.r === prev.r) return path;
  if (path.some((p) => p.q === down.q && p.r === down.r)) return path;
  return [...path, { q: down.q, r: down.r }];
}
function networkDownstreamNeighbor(hexes, junction, approach) {
  const jh = hexes[hexKey(junction.q, junction.r)];
  const edges = jh?.rzeka?.krawedzie;
  if (!edges || edges.length === 0) return void 0;
  for (const edgeIdx of edges) {
    const dir = HEX_DIRECTIONS[edgeIdx];
    if (!dir) continue;
    const nq = junction.q + dir[0];
    const nr = junction.r + dir[1];
    if (approach && nq === approach.q && nr === approach.r) continue;
    const nh = hexes[hexKey(nq, nr)];
    if (nh?.rzeka?.obecna && nh.terenBazowy !== "morze" /* Morze */) return { q: nq, r: nr };
  }
  return void 0;
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
function tributaryCountForLength(pathLen) {
  if (pathLen < 12) return 0;
  if (pathLen < 22) return 2;
  return Math.min(4, Math.floor(pathLen / 8));
}
function aStarRiverToTarget(hexes, sq, sr, tq, tr, maxLen, sourceKey) {
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
      if (!canRiverFlowThrough(hexes[nk], nk, sourceKey)) continue;
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
function findTributarySource(hexes, junction, mainPathKeys, usedSources, rand) {
  const candidates = [];
  for (let dq = -8; dq <= 8; dq++) {
    for (let dr = -8; dr <= 8; dr++) {
      const dist = hexAxialDistance(junction.q, junction.r, junction.q + dq, junction.r + dr);
      if (dist < 3 || dist > 8) continue;
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
function traceTributary(hexes, sq, sr, tq, tr, maxLen, seaDist, rand) {
  const srcKey = hexKey(sq, sr);
  let path = aStarRiverToTarget(hexes, sq, sr, tq, tr, maxLen, srcKey);
  if (path.length < 3) return [];
  const maxMeander = Math.min(2, Math.floor(path.length * 0.08));
  path = injectRiverMeanders(path, hexes, seaDist, rand, maxMeander);
  path = repairRiverPathAdjacency(path, hexes, srcKey);
  return path;
}
function addTributariesForMainRiver(hexes, mainPath, seaDist, rand, maxLen, riverPaths, riverKinds, usedSources, minSourceSep) {
  const n = tributaryCountForLength(mainPath.length);
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
    const src = findTributarySource(hexes, junction, mainKeys, usedSources, rand);
    if (!src) continue;
    if (isTooCloseToRiverSource(src[0], src[1], usedSources, Math.max(2, Math.floor(minSourceSep * 0.5)))) {
      continue;
    }
    const srcKey = hexKey(src[0], src[1]);
    const tribLen = Math.min(maxLen, Math.max(5, Math.floor(mainPath.length * 0.4)));
    let path = traceTributary(hexes, src[0], src[1], junction.q, junction.r, tribLen, seaDist, rand);
    if (path.length < 3) continue;
    path = trimRiverPathRings(hexes, path);
    if (path.length >= 2) {
      const end = path[path.length - 1];
      const approach = path[path.length - 2];
      const down = networkDownstreamNeighbor(hexes, end, approach);
      path = appendJunctionDownstreamHex(path, down);
    }
    riverPaths.push(path);
    riverKinds.push("tributary");
    usedSources.add(srcKey);
    markRiverPath(hexes, path);
  }
}
function riverCoverageCellSize(tier = "medium") {
  return waterCoverageCellSize(tier);
}
function riverTributaryCellSize(tier = "medium") {
  if (tier === "high") return 4;
  if (tier === "low") return 11;
  return 7;
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
var MAIN_RIVER_GRID_STRIDE = 3;
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
function isSparseMainCoverageCell(land, cellSize) {
  if (land.length === 0) return false;
  const [cq, cr] = coverageCellIndex(land[0][0], land[0][1], cellSize);
  return cq % MAIN_RIVER_GRID_STRIDE === 0 && cr % MAIN_RIVER_GRID_STRIDE === 0;
}
function collectRiverHexKeys(hexes) {
  const keys = /* @__PURE__ */ new Set();
  for (const [k, h] of Object.entries(hexes)) {
    if (h.rzeka?.obecna) keys.add(k);
  }
  return keys;
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
  return out.slice(0, 8);
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
  for (const sk of usedSources) {
    const { q, r } = parseHexKey(sk);
    if (hexAxialDistance(q, r, sq, sr) < minSep) return true;
  }
  return false;
}
function minLandHexesForRiverCell(cellSize) {
  return Math.max(4, Math.floor(cellSize * 0.35));
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
function ensureMassRiverGridCoverage(hexes, massSet, cellSize, seaDist, riverPaths, riverKinds, usedSources, tryPlace, rand, maxLen, opts = {}) {
  const minLand = minLandHexesForRiverCell(cellSize);
  let placed = 0;
  const cellList = [...landHexesByCoverageCell(massSet, cellSize).values()].filter((land) => land.length >= minLand).filter((land) => !opts.sparseMainOnly || isSparseMainCoverageCell(land, cellSize)).filter(
    (land) => land.some(([q, r]) => {
      const d = seaDist.get(hexKey(q, r)) ?? 999;
      return d >= 2 && d <= maxLen + 8;
    })
  ).sort((a, b) => {
    const avg = (cells) => {
      let s = 0;
      for (const [q, r] of cells) s += seaDist.get(hexKey(q, r)) ?? 0;
      return s / cells.length;
    };
    return avg(b) - avg(a);
  });
  const cellSatisfied = (land) => {
    if (opts.requireRiverHex) return cellHasRiverHex(land, hexes);
    return cellHasMainRiverSource(land, riverPaths, riverKinds);
  };
  for (const land of cellList) {
    if (cellSatisfied(land)) continue;
    const ranked = land.filter(([q, r]) => !usedSources.has(hexKey(q, r))).map(([q, r]) => {
      const h = hexes[hexKey(q, r)];
      const d = seaDist.get(hexKey(q, r)) ?? 0;
      let score = d + rand() * 4;
      if (h && isReliefRiverSource(h.terenBazowy)) score += 55;
      else if (h && isRiverLandTerrain(h.terenBazowy)) score += 12;
      return { q, r, d, score };
    }).filter((c) => c.d >= RIVER_MIN_INLAND_FROM_SEA).sort((a, b) => b.score - a.score);
    let ok = false;
    for (const c of ranked) {
      if (tryPlace(c.q, c.r)) {
        placed++;
        ok = true;
        break;
      }
    }
    if (ok || cellSatisfied(land)) continue;
    const expanded = expandRiverSourceCandidates(land, massSet, 2);
    for (const [q, r] of expanded) {
      if (tryPlace(q, r)) {
        placed++;
        break;
      }
    }
    if (cellSatisfied(land)) continue;
    const fallbackRanked = land.filter(([q, r]) => !usedSources.has(hexKey(q, r))).filter(([q, r]) => (seaDist.get(hexKey(q, r)) ?? 0) >= RIVER_MIN_INLAND_FROM_SEA).slice(0, 6);
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
  const minLen = opts.minLen ?? 4;
  const maxLen = opts.maxLen ?? 40;
  const riversTier = opts.riversTier ?? "medium";
  const seaDist = buildSeaDistanceField(hexes);
  const oceanConnected = oceanConnectedWaterKeys(hexes, width, height);
  const openOceanDist = buildOpenOceanDistanceField(hexes, width, height, oceanConnected);
  const riverPaths = [];
  const riverKinds = [];
  const usedSources = /* @__PURE__ */ new Set();
  const masses = groupLandMassKeys(hexes).filter((m) => m.length >= 8).sort((a, b) => b.length - a.length);
  const cellSize = riverCoverageCellSize(riversTier);
  const gridTraceMinLen = riverGridTraceMinLen(minLen, riversTier);
  const feederMinLen = Math.max(4, Math.min(gridTraceMinLen, 10));
  const minSourceSep = Math.max(2, Math.floor(cellSize * 0.75));
  const pushMain = (path, sq, sr) => {
    const trimmed = trimRiverPathRings(hexes, path);
    riverPaths.push(trimmed);
    riverKinds.push("main");
    usedSources.add(hexKey(sq, sr));
    markRiverPath(hexes, trimmed);
    return true;
  };
  const pushTributary = (path, sq, sr) => {
    let out = trimRiverPathRings(hexes, path);
    if (out.length >= 2) {
      const junction = out[out.length - 1];
      const approach = out[out.length - 2];
      const down = networkDownstreamNeighbor(hexes, junction, approach);
      out = appendJunctionDownstreamHex(out, down);
    }
    riverPaths.push(out);
    riverKinds.push("tributary");
    usedSources.add(hexKey(sq, sr));
    markRiverPath(hexes, out);
    return true;
  };
  const tryPlaceGridRiver = (sq, sr) => {
    const srcKey = hexKey(sq, sr);
    if (usedSources.has(srcKey)) return false;
    if (isTooCloseToRiverSource(sq, sr, usedSources, minSourceSep)) return false;
    if (openOceanDist.get(srcKey) == null) return false;
    const startDist = seaDist.get(srcKey) ?? 999;
    const traceMax = Math.max(maxLen, minLen + 24, Math.ceil(startDist * 2.8) + minLen);
    const path = traceRiver(hexes, sq, sr, traceMax, {
      seaDist,
      openOceanDist,
      oceanConnected,
      mapWidth: width,
      mapHeight: height,
      rand,
      minLen
    });
    if (path.length < gridTraceMinLen) return false;
    if (!pathEndsAtSea(hexes, path, width, height, oceanConnected)) return false;
    if (!riverPathRespectsSeaBuffer(hexes, path, seaDist)) return false;
    return pushMain(path, sq, sr);
  };
  const tryPlaceFeederRiver = (sq, sr, junctionKeysOverride) => {
    const srcKey = hexKey(sq, sr);
    if (usedSources.has(srcKey)) return false;
    if (isTooCloseToRiverSource(sq, sr, usedSources, Math.max(2, Math.floor(minSourceSep * 0.55)))) {
      return false;
    }
    if (openOceanDist.get(srcKey) == null) return false;
    const startDist = seaDist.get(srcKey) ?? 999;
    const traceMax = Math.max(maxLen, minLen + 20, Math.ceil(startDist * 2.6) + minLen);
    const junctionKeys = junctionKeysOverride ?? (() => {
      const reach = buildOceanReachableRiverHexKeys(
        hexes,
        riverPaths,
        riverKinds,
        width,
        height,
        oceanConnected
      );
      const pool = /* @__PURE__ */ new Set();
      for (const k of collectRiverPathHexKeys(riverPaths)) {
        if (reach.has(k)) pool.add(k);
      }
      return pool;
    })();
    if (junctionKeys.size === 0) {
      const seaPath2 = traceRiver(hexes, sq, sr, traceMax, {
        seaDist,
        openOceanDist,
        oceanConnected,
        mapWidth: width,
        mapHeight: height,
        rand,
        minLen
      });
      if (seaPath2.length >= feederMinLen && pathEndsAtSea(hexes, seaPath2, width, height, oceanConnected) && riverPathRespectsSeaBuffer(hexes, seaPath2, seaDist)) {
        return pushMain(seaPath2, sq, sr);
      }
      return false;
    }
    let bestNetPath = [];
    let bestNetLen = Infinity;
    for (const j of rankNetworkJunctionCandidates(sq, sr, junctionKeys, seaDist, traceMax, rand)) {
      const p = traceTributary(hexes, sq, sr, j.q, j.r, traceMax, seaDist, rand);
      if (p.length < 3 || p.length < feederMinLen - 2) continue;
      if (p.length < bestNetLen) {
        bestNetLen = p.length;
        bestNetPath = p;
      }
    }
    if (bestNetPath.length >= 3) {
      const needSeaCompare = bestNetLen > Math.min(traceMax * 0.5, startDist + 6);
      if (needSeaCompare) {
        const seaPath2 = traceRiver(hexes, sq, sr, traceMax, {
          seaDist,
          openOceanDist,
          oceanConnected,
          mapWidth: width,
          mapHeight: height,
          rand,
          minLen
        });
        const seaOk = seaPath2.length >= feederMinLen && pathEndsAtSea(hexes, seaPath2, width, height, oceanConnected) && riverPathRespectsSeaBuffer(hexes, seaPath2, seaDist);
        if (seaOk && seaPath2.length < bestNetLen) {
          return pushMain(seaPath2, sq, sr);
        }
      }
      return pushTributary(bestNetPath, sq, sr);
    }
    const seaPath = traceRiver(hexes, sq, sr, traceMax, {
      seaDist,
      openOceanDist,
      oceanConnected,
      mapWidth: width,
      mapHeight: height,
      rand,
      minLen
    });
    if (seaPath.length >= feederMinLen && pathEndsAtSea(hexes, seaPath, width, height, oceanConnected) && riverPathRespectsSeaBuffer(hexes, seaPath, seaDist)) {
      return pushMain(seaPath, sq, sr);
    }
    return false;
  };
  for (let pass = 0; pass < 6; pass++) {
    let passPlaced = 0;
    for (const mass of masses) {
      passPlaced += ensureMassRiverGridCoverage(
        hexes,
        new Set(mass),
        cellSize,
        seaDist,
        riverPaths,
        riverKinds,
        usedSources,
        tryPlaceGridRiver,
        rand,
        maxLen,
        { sparseMainOnly: true }
      );
    }
    if (passPlaced === 0) break;
  }
  for (let pass = 0; pass < 3; pass++) {
    let passPlaced = 0;
    const reach = buildOceanReachableRiverHexKeys(
      hexes,
      riverPaths,
      riverKinds,
      width,
      height,
      oceanConnected
    );
    const junctionKeys = /* @__PURE__ */ new Set();
    for (const k of collectRiverPathHexKeys(riverPaths)) {
      if (reach.has(k)) junctionKeys.add(k);
    }
    const tryFeeder = (sq, sr) => tryPlaceFeederRiver(sq, sr, junctionKeys);
    for (const mass of masses) {
      passPlaced += ensureMassRiverGridCoverage(
        hexes,
        new Set(mass),
        cellSize,
        seaDist,
        riverPaths,
        riverKinds,
        usedSources,
        tryFeeder,
        rand,
        maxLen,
        { requireRiverHex: true }
      );
    }
    if (passPlaced === 0) break;
  }
  for (const mass of masses) {
    const massSet = new Set(mass);
    const minLand = minLandHexesForRiverCell(cellSize);
    for (const land of landHexesByCoverageCell(massSet, cellSize).values()) {
      if (land.length < minLand) continue;
      if (cellHasRiverHex(land, hexes)) continue;
      const reachable = land.some(([q, r]) => {
        const d = seaDist.get(hexKey(q, r)) ?? 999;
        return d >= 2 && d <= maxLen + 40;
      });
      if (!reachable) continue;
      for (const [q, r] of land) {
        if (openOceanDist.get(hexKey(q, r)) == null) continue;
        if (tryPlaceFeederRiver(q, r)) break;
      }
    }
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
      minSourceSep
    );
  }
  return { paths: riverPaths, kinds: riverKinds };
}
function topUpRiverGridCoverage(hexes, width, height, riverPaths, riverKinds, rand, riversTier = "medium", minLen = 4, maxLen = 40) {
  const seaDist = buildSeaDistanceField(hexes);
  const oceanConnected = oceanConnectedWaterKeys(hexes, width, height);
  const openOceanDist = buildOpenOceanDistanceField(hexes, width, height, oceanConnected);
  const usedSources = /* @__PURE__ */ new Set();
  for (let i = 0; i < riverPaths.length; i++) {
    const p0 = riverPaths[i]?.[0];
    if (p0) usedSources.add(hexKey(p0.q, p0.r));
  }
  const masses = groupLandMassKeys(hexes).filter((m) => m.length >= 8).sort((a, b) => b.length - a.length);
  const cellSize = riverTributaryCellSize(riversTier);
  const gridTraceMinLen = riverGridTraceMinLen(minLen, riversTier);
  const feederMinLen = Math.max(4, Math.min(gridTraceMinLen, 10));
  const minSourceSep = Math.max(2, Math.floor(cellSize * 0.75));
  const pushMain = (path, sq, sr) => {
    const trimmed = trimRiverPathRings(hexes, path);
    riverPaths.push(trimmed);
    riverKinds.push("main");
    usedSources.add(hexKey(sq, sr));
    markRiverPath(hexes, trimmed);
    return true;
  };
  const pushTributary = (path, sq, sr) => {
    let out = trimRiverPathRings(hexes, path);
    if (out.length >= 2) {
      const junction = out[out.length - 1];
      const approach = out[out.length - 2];
      const down = networkDownstreamNeighbor(hexes, junction, approach);
      out = appendJunctionDownstreamHex(out, down);
    }
    riverPaths.push(out);
    riverKinds.push("tributary");
    usedSources.add(hexKey(sq, sr));
    markRiverPath(hexes, out);
    return true;
  };
  const tryPlaceFeederRiver = (sq, sr, junctionKeysOverride) => {
    const srcKey = hexKey(sq, sr);
    if (usedSources.has(srcKey)) return false;
    if (isTooCloseToRiverSource(sq, sr, usedSources, Math.max(2, Math.floor(minSourceSep * 0.55)))) {
      return false;
    }
    if (openOceanDist.get(srcKey) == null) return false;
    const startDist = seaDist.get(srcKey) ?? 999;
    const traceMax = Math.max(maxLen, minLen + 20, Math.ceil(startDist * 2.6) + minLen);
    const junctionKeys = junctionKeysOverride ?? (() => {
      const reach = buildOceanReachableRiverHexKeys(
        hexes,
        riverPaths,
        riverKinds,
        width,
        height,
        oceanConnected
      );
      const pool = /* @__PURE__ */ new Set();
      for (const k of collectRiverPathHexKeys(riverPaths)) {
        if (reach.has(k)) pool.add(k);
      }
      return pool;
    })();
    if (junctionKeys.size === 0) {
      const seaPath2 = traceRiver(hexes, sq, sr, traceMax, {
        seaDist,
        openOceanDist,
        oceanConnected,
        mapWidth: width,
        mapHeight: height,
        rand,
        minLen
      });
      if (seaPath2.length >= feederMinLen && pathEndsAtSea(hexes, seaPath2, width, height, oceanConnected) && riverPathRespectsSeaBuffer(hexes, seaPath2, seaDist)) {
        return pushMain(seaPath2, sq, sr);
      }
      return false;
    }
    let bestNetPath = [];
    let bestNetLen = Infinity;
    for (const j of rankNetworkJunctionCandidates(sq, sr, junctionKeys, seaDist, traceMax, rand)) {
      const p = traceTributary(hexes, sq, sr, j.q, j.r, traceMax, seaDist, rand);
      if (p.length < 3 || p.length < feederMinLen - 2) continue;
      if (p.length < bestNetLen) {
        bestNetLen = p.length;
        bestNetPath = p;
      }
    }
    if (bestNetPath.length >= 3) {
      const needSeaCompare = bestNetLen > Math.min(traceMax * 0.5, startDist + 6);
      if (needSeaCompare) {
        const seaPath2 = traceRiver(hexes, sq, sr, traceMax, {
          seaDist,
          openOceanDist,
          oceanConnected,
          mapWidth: width,
          mapHeight: height,
          rand,
          minLen
        });
        const seaOk = seaPath2.length >= feederMinLen && pathEndsAtSea(hexes, seaPath2, width, height, oceanConnected) && riverPathRespectsSeaBuffer(hexes, seaPath2, seaDist);
        if (seaOk && seaPath2.length < bestNetLen) return pushMain(seaPath2, sq, sr);
      }
      return pushTributary(bestNetPath, sq, sr);
    }
    const seaPath = traceRiver(hexes, sq, sr, traceMax, {
      seaDist,
      openOceanDist,
      oceanConnected,
      mapWidth: width,
      mapHeight: height,
      rand,
      minLen
    });
    if (seaPath.length >= feederMinLen && pathEndsAtSea(hexes, seaPath, width, height, oceanConnected) && riverPathRespectsSeaBuffer(hexes, seaPath, seaDist)) {
      return pushMain(seaPath, sq, sr);
    }
    return false;
  };
  let placed = 0;
  for (let pass = 0; pass < 5; pass++) {
    let passPlaced = 0;
    const reach = buildOceanReachableRiverHexKeys(
      hexes,
      riverPaths,
      riverKinds,
      width,
      height,
      oceanConnected
    );
    const junctionKeys = /* @__PURE__ */ new Set();
    for (const k of collectRiverPathHexKeys(riverPaths)) {
      if (reach.has(k)) junctionKeys.add(k);
    }
    const tryFeeder = (sq, sr) => tryPlaceFeederRiver(sq, sr, junctionKeys);
    for (const mass of masses) {
      passPlaced += ensureMassRiverGridCoverage(
        hexes,
        new Set(mass),
        cellSize,
        seaDist,
        riverPaths,
        riverKinds,
        usedSources,
        tryFeeder,
        rand,
        maxLen,
        { requireRiverHex: true }
      );
    }
    placed += passPlaced;
    if (passPlaced === 0) break;
  }
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
  {
    id: "owce",
    nakladka: "zloze_owiec" /* ZlozeOwiec */,
    allowedOn: (h) => isDryLandTerrain(h.terenBazowy) && h.terenBazowy === "wzgorza" /* Wzgorza */,
    rarity: 0.08
  },
  {
    id: "bydlo",
    nakladka: "zloze_bydla" /* ZlozeBydla */,
    allowedOn: (h) => isDryLandTerrain(h.terenBazowy) && (h.terenBazowy === "laka" /* Laka */ || h.terenBazowy === "rownina" /* Rownina */),
    rarity: 0.07
  },
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
    sol: 0
  };
  for (const key of keys) {
    const hex = hexes[key];
    if (!hex) continue;
    if (hex.nakladka !== "brak" /* Brak */) continue;
    if (hex.zloze) continue;
    if (hex.terenBazowy === "morze" /* Morze */ || hex.terenBazowy === "wybrzeze" /* Wybrzeze */) continue;
    for (const rule of rules) {
      if (!rule.allowedOn(hex)) continue;
      if (rand() < Math.min(1, rule.rarity * baselineMult * resourceMult)) {
        if (rule.nakladka !== null) {
          hex.nakladka = rule.nakladka;
        } else {
          hex.zloze = rule.id;
        }
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
  "glina",
  "konie",
  "bydlo",
  "owce"
];
function depositRuleById(id) {
  const rule = DEPOSIT_RULES.find((r) => r.id === id);
  if (!rule) throw new Error(`Brak regu\u0142y z\u0142o\u017Ca: ${id}`);
  return rule;
}
function hexCarriesDepositType(hex, id) {
  const rule = depositRuleById(id);
  if (rule.nakladka !== null) return hex.nakladka === rule.nakladka;
  return hex.zloze === id;
}
function cellCarriesDepositType(cellLand, hexes, id) {
  for (const [q, r] of cellLand) {
    const hex = hexes[hexKey(q, r)];
    if (hex && hexCarriesDepositType(hex, id)) return true;
  }
  return false;
}
function hexCanAcceptDeposit(hex, rule, allowForestClear) {
  if (hex.terenBazowy === "morze" /* Morze */ || hex.terenBazowy === "wybrzeze" /* Wybrzeze */) {
    return false;
  }
  if (hex.zloze) return false;
  if (hex.nakladka !== "brak" /* Brak */) {
    if (!allowForestClear || hex.nakladka !== "las" /* Las */) return false;
  }
  return rule.allowedOn(hex);
}
function forceDepositOnHex(hex, rule) {
  if (hex.nakladka === "las" /* Las */) hex.nakladka = "brak" /* Brak */;
  if (rule.nakladka !== null) {
    hex.nakladka = rule.nakladka;
  } else {
    hex.zloze = rule.id;
  }
  if (rule.id === "miedz" && hex.zlozeMinEra == null) hex.zlozeMinEra = 2;
  if (rule.id === "zelazo" && hex.zlozeMinEra == null) hex.zlozeMinEra = 3;
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
    case "glina":
      hex.terenBazowy = "laka" /* Laka */;
      break;
    case "konie":
      hex.terenBazowy = "rownina" /* Rownina */;
      break;
    case "bydlo":
      hex.terenBazowy = "laka" /* Laka */;
      break;
    case "sol":
      hex.terenBazowy = "pustynia" /* Pustynia */;
      break;
    default:
      break;
  }
}
function pickDepositBootstrapHex(land, hexes, rule, rand) {
  const ranked = land.filter(([q, r]) => {
    const hex = hexes[hexKey(q, r)];
    return hex && hex.terenBazowy !== "morze" /* Morze */ && hex.terenBazowy !== "wybrzeze" /* Wybrzeze */;
  }).map(([q, r]) => ({ q, r, score: rand() })).sort((a, b) => b.score - a.score);
  if (ranked.length === 0) return null;
  const spot = ranked[0];
  prepareTerrainForDeposit(hexes[hexKey(spot.q, spot.r)], rule);
  if (rule.id === "glina") {
    hexes[hexKey(spot.q, spot.r)].rzeka = { ...hexes[hexKey(spot.q, spot.r)].rzeka ?? {}, obecna: true };
  }
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
  const tryPick = (allowForestClear) => {
    const ranked = land.filter(([q, r]) => {
      const hex = hexes[hexKey(q, r)];
      return hex != null && hexCanAcceptDeposit(hex, rule, allowForestClear);
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
  };
  return tryPick(false) ?? tryPick(true);
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
    for (let pass = 0; pass < 6; pass++) {
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
  }
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

// src/render/hexutil.ts
var SQRT3 = Math.sqrt(3);

// src/render/mapRenderStyle.ts
var GAME_MAP_RENDER_STYLE = "roblox";
var SEA_SURFACE_TOP_Y = 0.18;
var WYBRZEZE_SURFACE_TOP_Y = 0.28;
var LAND_MIN_CLEARANCE_ABOVE_SEA = 0.35;
var TERRAIN_SURFACE_Y = {
  ["morze" /* Morze */]: SEA_SURFACE_TOP_Y,
  ["wybrzeze" /* Wybrzeze */]: WYBRZEZE_SURFACE_TOP_Y,
  ["laka" /* Laka */]: SEA_SURFACE_TOP_Y + LAND_MIN_CLEARANCE_ABOVE_SEA,
  ["rownina" /* Rownina */]: SEA_SURFACE_TOP_Y + LAND_MIN_CLEARANCE_ABOVE_SEA + 0.02,
  ["pustynia" /* Pustynia */]: SEA_SURFACE_TOP_Y + LAND_MIN_CLEARANCE_ABOVE_SEA + 0.08,
  ["wzgorza" /* Wzgorza */]: SEA_SURFACE_TOP_Y + LAND_MIN_CLEARANCE_ABOVE_SEA + 0.18,
  ["gory" /* Gory */]: SEA_SURFACE_TOP_Y + LAND_MIN_CLEARANCE_ABOVE_SEA + 0.32
};
var LAND_HEX_Y_LIFT = 0.05;
var ROBLOX_TERRAIN_VIS = {
  ["morze" /* Morze */]: { height: 0.3, yOffset: 0 },
  /** Hybryda C — wyższy profil, mniejszy „schodek” względem lądu (top ≈ 0.40 vs ląd 0.45). */
  ["wybrzeze" /* Wybrzeze */]: { height: 0.3, yOffset: 0.1 },
  ["laka" /* Laka */]: { height: 0.38, yOffset: 0.07 },
  ["rownina" /* Rownina */]: { height: 0.4, yOffset: 0.07 },
  /** Pustynia = profil wzgórza (Maciej 2026-07-04: nie zalewa morze). */
  ["pustynia" /* Pustynia */]: { height: 0.42, yOffset: 0.08 },
  ["wzgorza" /* Wzgorza */]: { height: 0.42, yOffset: 0.08 },
  ["gory" /* Gory */]: { height: 0.46, yOffset: 0.12 }
};
function terrainVisualForStyle(t, style, civ) {
  const base = style === "roblox" ? ROBLOX_TERRAIN_VIS[t] : civ;
  if (style === "roblox") {
    const topY = TERRAIN_SURFACE_Y[t];
    return { height: base.height, yOffset: topY - base.height };
  }
  if (t === "morze" /* Morze */ || t === "wybrzeze" /* Wybrzeze */) return base;
  return { ...base, yOffset: base.yOffset + LAND_HEX_Y_LIFT };
}
var COAST_WATER_CAP_THICKNESS = 0.038 * 1.15;
function terrainHeightAudit(style = GAME_MAP_RENDER_STYLE) {
  const seaTopY = terrainSurfaceTopY("morze" /* Morze */, style);
  const wybrzezeTopY = terrainSurfaceTopY("wybrzeze" /* Wybrzeze */, style);
  const coastWaterCapTopY = seaTopY + COAST_WATER_CAP_THICKNESS;
  const dryTypes = [
    "laka" /* Laka */,
    "rownina" /* Rownina */,
    "pustynia" /* Pustynia */,
    "wzgorza" /* Wzgorza */,
    "gory" /* Gory */
  ];
  const land = dryTypes.map((teren) => {
    const topY = terrainSurfaceTopY(teren, style);
    return { teren, topY, gapAboveSea: topY - seaTopY };
  });
  const minLandGap = land.length > 0 ? Math.min(...land.map((r) => r.gapAboveSea)) : 0;
  const violations = [];
  if (wybrzezeTopY <= seaTopY) {
    violations.push(`wybrze\u017Ce (${wybrzezeTopY.toFixed(3)}) <= morze (${seaTopY.toFixed(3)})`);
  }
  for (const row of land) {
    if (row.gapAboveSea < LAND_MIN_CLEARANCE_ABOVE_SEA - 1e-3) {
      violations.push(
        `${row.teren}: luka ${row.gapAboveSea.toFixed(3)} < min ${LAND_MIN_CLEARANCE_ABOVE_SEA}`
      );
    }
    if (row.topY <= coastWaterCapTopY) {
      violations.push(`${row.teren}: wierzcho\u0142ek <= tafla wybrze\u017Ca 3D (${coastWaterCapTopY.toFixed(3)})`);
    }
  }
  return {
    style,
    seaTopY,
    wybrzezeTopY,
    coastWaterCapTopY,
    land,
    minLandGap,
    violations
  };
}
var CIV_TERRAIN_VIS = {
  ["morze" /* Morze */]: { height: 0.3, yOffset: 0 },
  ["wybrzeze" /* Wybrzeze */]: { height: 0.35, yOffset: 0.05 },
  ["laka" /* Laka */]: { height: 0.4, yOffset: 0.05 },
  ["rownina" /* Rownina */]: { height: 0.45, yOffset: 0.08 },
  ["pustynia" /* Pustynia */]: { height: 0.42, yOffset: 0.08 },
  ["wzgorza" /* Wzgorza */]: { height: 0.7, yOffset: 0.15 },
  ["gory" /* Gory */]: { height: 1.2, yOffset: 0.4 }
};
function terrainSurfaceTopY(teren, style = GAME_MAP_RENDER_STYLE, extraYOffset = 0) {
  const spec = terrainVisualForStyle(teren, style, CIV_TERRAIN_VIS[teren]);
  return spec.height + spec.yOffset + extraYOffset;
}
var TERRAIN_CIV = {
  ["morze" /* Morze */]: 2054790,
  ["wybrzeze" /* Wybrzeze */]: 4629462,
  ["laka" /* Laka */]: 6989119,
  ["rownina" /* Rownina */]: 11121239,
  ["pustynia" /* Pustynia */]: 14270841,
  ["wzgorza" /* Wzgorza */]: 5209396,
  ["gory" /* Gory */]: 10133929
};
var TERRAIN_ROBLOX = {
  ["morze" /* Morze */]: 5608621,
  /** Płytka woda przy brzegu (jasnoniebieski heks + tafla 3D; piasek na krawędzi w stronę lądu). */
  ["wybrzeze" /* Wybrzeze */]: 8571104,
  ["laka" /* Laka */]: 9748344,
  ["rownina" /* Rownina */]: 11586174,
  ["pustynia" /* Pustynia */]: 14731406,
  ["wzgorza" /* Wzgorza */]: 8300658,
  ["gory" /* Gory */]: 10332340
};
var TERRAIN_MINECRAFT = {
  ["morze" /* Morze */]: 2842280,
  ["wybrzeze" /* Wybrzeze */]: 4034521,
  ["laka" /* Laka */]: 6000444,
  ["rownina" /* Rownina */]: 7249987,
  ["pustynia" /* Pustynia */]: 14402396,
  ["wzgorza" /* Wzgorza */]: 4880946,
  ["gory" /* Gory */]: 9080985
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LAND_MIN_CLEARANCE_ABOVE_SEA,
  SEA_SURFACE_TOP_Y,
  auditMapTerrainData,
  generateMap,
  terrainHeightAudit
});
