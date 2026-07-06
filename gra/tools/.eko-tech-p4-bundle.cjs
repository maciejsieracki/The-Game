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

// tools/.eko-tech-p4-entry.ts
var eko_tech_p4_entry_exports = {};
__export(eko_tech_p4_entry_exports, {
  Nakladka: () => Nakladka,
  TerenBazowy: () => TerenBazowy,
  buildImprovementQualifier: () => buildImprovementQualifier,
  computeEmpireLivestockUnlocks: () => computeEmpireLivestockUnlocks,
  depositAllowsPlayerImprovement: () => depositAllowsPlayerImprovement,
  hexHasHorseDeposit: () => hexHasHorseDeposit,
  improvementMatchesLivestockDeposit: () => improvementMatchesLivestockDeposit
});
module.exports = __toCommonJS(eko_tech_p4_entry_exports);

// src/types/hex.ts
var TerenBazowy = /* @__PURE__ */ ((TerenBazowy3) => {
  TerenBazowy3["Laka"] = "laka";
  TerenBazowy3["Rownina"] = "rownina";
  TerenBazowy3["Wzgorza"] = "wzgorza";
  TerenBazowy3["Gory"] = "gory";
  TerenBazowy3["Wybrzeze"] = "wybrzeze";
  TerenBazowy3["Morze"] = "morze";
  TerenBazowy3["Pustynia"] = "pustynia";
  return TerenBazowy3;
})(TerenBazowy || {});
var Nakladka = /* @__PURE__ */ ((Nakladka3) => {
  Nakladka3["Brak"] = "brak";
  Nakladka3["Las"] = "las";
  Nakladka3["ZlozeGliny"] = "zloze_gliny";
  Nakladka3["ZlozeRudy"] = "zloze_rudy";
  Nakladka3["ZlozeKonia"] = "zloze_konia";
  Nakladka3["ZlozeOwiec"] = "zloze_owiec";
  Nakladka3["ZlozeBydla"] = "zloze_bydla";
  Nakladka3["ZlozeLamy"] = "zloze_lamy";
  return Nakladka3;
})(Nakladka || {});

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
var LEGACY_KEY_ALIASES = {
  pastwisko: "bydlo"
};
var IMPROVEMENT_KEYS = Object.keys(IMPROVEMENTS).filter((k) => !k.startsWith("_"));
function normalizeImprovementKey(raw) {
  if (!raw || raw === "brak") return void 0;
  const key = LEGACY_KEY_ALIASES[raw] ?? raw;
  return IMPROVEMENTS[key]?.bonus !== void 0 || IMPROVEMENTS[key] ? key : IMPROVEMENTS[raw] ? raw : void 0;
}
function improvementKeysForHex(hex) {
  if (hex.ulepszenia?.length) {
    const keys = hex.ulepszenia.map((k) => normalizeImprovementKey(String(k))).filter((k) => !!k);
    return [...new Set(keys)];
  }
  const single = normalizeImprovementKey(String(hex.ulepszenie ?? "brak"));
  return single ? [single] : [];
}

// src/game/livestock-unlock.ts
var IMPROVEMENT_UNLOCKS_LIVESTOCK = {
  bydlo: "bydlo",
  owce: "owce",
  lama: "lama",
  stadnina: "kon"
};
var DEPOSIT_FOR_LIVESTOCK = {
  bydlo: "zloze_bydla" /* ZlozeBydla */,
  owce: "zloze_owiec" /* ZlozeOwiec */,
  lama: "zloze_lamy" /* ZlozeLamy */
};
var INCA_CIV_TYPES = /* @__PURE__ */ new Set(["inkowie", "inka", "incas"]);
function isIncaCiv(civType) {
  if (!civType) return false;
  const t = civType.toLowerCase().trim();
  return INCA_CIV_TYPES.has(t) || t.includes("inkow");
}
function livestockKeyFromImprovement(improvementKey) {
  const raw = improvementKey?.toLowerCase?.().trim();
  if (raw === "kon" || raw === "konie") return "kon";
  const k = normalizeImprovementKey(improvementKey);
  if (!k) return null;
  if (k in IMPROVEMENT_UNLOCKS_LIVESTOCK) return IMPROVEMENT_UNLOCKS_LIVESTOCK[k];
  if (k === "bydlo" || k === "owce" || k === "lama" || k === "kon") return k;
  return null;
}
function hexHasLivestockDeposit(hex, key) {
  return hex.nakladka === DEPOSIT_FOR_LIVESTOCK[key];
}
function hexHasHorseDeposit(hex) {
  return hex.nakladka === "zloze_konia" /* ZlozeKonia */;
}
function improvementMatchesLivestockDeposit(improvementKey, hex) {
  const norm = normalizeImprovementKey(improvementKey) ?? improvementKey;
  if (norm === "stadnina") return hexHasHorseDeposit(hex);
  const lk = livestockKeyFromImprovement(norm);
  if (!lk || lk === "kon") return false;
  return hexHasLivestockDeposit(hex, lk);
}
function isLivestockAllowed(civType, improvementKey, era) {
  const lk = livestockKeyFromImprovement(improvementKey);
  if (!lk) return true;
  if (lk === "kon") return !isIncaCiv(civType);
  if (lk === "lama") return isIncaCiv(civType);
  if (isIncaCiv(civType) && era < 3) return false;
  return true;
}
function keysOnPlacedHex(imp) {
  if (typeof imp === "string") return imp ? [imp] : [];
  return imp.map(String);
}
function computeEmpireLivestockUnlocks(placedImprovements, map, ownerId) {
  const unlocked = /* @__PURE__ */ new Set();
  for (const [hexKey, impRaw] of placedImprovements) {
    const hex = map.hexes[hexKey];
    if (!hex) continue;
    if (ownerId != null && hex.wlasciciel !== ownerId) continue;
    for (const impKey of keysOnPlacedHex(impRaw)) {
      const lk = livestockKeyFromImprovement(impKey);
      if (!lk) continue;
      if (!improvementMatchesLivestockDeposit(impKey, hex)) continue;
      unlocked.add(lk);
    }
  }
  return unlocked;
}
function isLivestockUnlockedForPlacement(improvementKey, hex, empireUnlocks) {
  const norm = normalizeImprovementKey(improvementKey) ?? improvementKey;
  if (norm === "stadnina") {
    return hexHasHorseDeposit(hex) || empireUnlocks.has("kon");
  }
  const lk = livestockKeyFromImprovement(norm);
  if (!lk || lk === "kon") return true;
  if (improvementMatchesLivestockDeposit(norm, hex)) return true;
  return empireUnlocks.has(lk);
}

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

// src/map/road-movement.ts
var ROAD_MIN_MOVE_COST = 1 / 3;
function isRoadImprovementKey(key) {
  return key === "droga" || key === "droga_brukowana";
}
function hexHasRoad(hex) {
  const keys = improvementKeysForHex(hex);
  return keys.some(isRoadImprovementKey);
}

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

// src/render/hexutil.ts
var SQRT3 = Math.sqrt(3);

// src/render/mapRenderStyle.ts
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
var COAST_WATER_CAP_THICKNESS = 0.038 * 1.15;
var CIV_TERRAIN_VIS = {
  ["morze" /* Morze */]: { height: 0.3, yOffset: 0 },
  ["wybrzeze" /* Wybrzeze */]: { height: 0.35, yOffset: 0.05 },
  ["laka" /* Laka */]: { height: 0.4, yOffset: 0.05 },
  ["rownina" /* Rownina */]: { height: 0.45, yOffset: 0.08 },
  ["pustynia" /* Pustynia */]: { height: 0.42, yOffset: 0.08 },
  ["wzgorza" /* Wzgorza */]: { height: 0.7, yOffset: 0.15 },
  ["gory" /* Gory */]: { height: 1.2, yOffset: 0.4 }
};
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

// src/render/styleResources.ts
var S = 2.05 / 3;

// data/epoka-ludnosc-manpower.json
var epoka_ludnosc_manpower_default = {
  _opis: "Skala ludno\u015Bci i Manpower per epoka imperium (wiersze 1\u201310). 1 ludek = ludno\u015B\u0107 absolutna na slot population (1\u201310). manpowerNaLudka = 10% ludekNaLudka. manpowerNaJednostke = 10% manpowerNaLudka (koszt rekrutacji 1 jednostki).",
  _formuly: {
    ludnoscAbsolutna: "population \xD7 ludekNaLudka[epoka]",
    manpowerMax: "population \xD7 manpowerNaLudka[epoka]",
    kosztRekrutacji: "manpowerNaJednostke[epoka] per jednostka"
  },
  epoki: [
    { epoka: 1, ludekNaLudka: 1e4, manpowerNaLudka: 1e3, manpowerNaJednostke: 100 },
    { epoka: 2, ludekNaLudka: 2e4, manpowerNaLudka: 2e3, manpowerNaJednostke: 200 },
    { epoka: 3, ludekNaLudka: 4e4, manpowerNaLudka: 4e3, manpowerNaJednostke: 400 },
    { epoka: 4, ludekNaLudka: 8e4, manpowerNaLudka: 8e3, manpowerNaJednostke: 800 },
    { epoka: 5, ludekNaLudka: 16e4, manpowerNaLudka: 16e3, manpowerNaJednostke: 1600 },
    { epoka: 6, ludekNaLudka: 32e4, manpowerNaLudka: 32e3, manpowerNaJednostke: 3200 },
    { epoka: 7, ludekNaLudka: 64e4, manpowerNaLudka: 64e3, manpowerNaJednostke: 6400 },
    { epoka: 8, ludekNaLudka: 12e5, manpowerNaLudka: 12e4, manpowerNaJednostke: 12e3 },
    { epoka: 9, ludekNaLudka: 24e5, manpowerNaLudka: 24e4, manpowerNaJednostke: 24e3 },
    { epoka: 10, ludekNaLudka: 48e5, manpowerNaLudka: 48e4, manpowerNaJednostke: 48e3 }
  ]
};

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
  manpower_regen_proc_max_tura: {
    wartosc: 10,
    jednostka: "% max/ture",
    opis: "Co koniec tury miasto odzyskuje floor(manpowerMax \xD7 wartosc/100) Manpower (do cap). Ep1, 10 ludkow, max=10k \u2192 +1000/ture. Pusta pula \u224810 tur do pelna. manpower.tickManpowerRegen."
  },
  manpower_regen_blok_oblezenie: {
    wartosc: 1,
    jednostka: "0/1",
    opis: "1 = brak odnowy Manpower gdy city.oblegane=true. 0 = regen normalnie podczas obl\u0119\u017Cenia."
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
    opis: "Miasto Z MUREM daje +200% Obrony broniacym sie jednostkom (bitwa/oblezenie). Decyzja Naster 2026-06-25. Konsumuje game/siege.ts + battleScene (defensa miasta). Miasto bez muru = brak tego bonusu."
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

// src/game/production.ts
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
var UNIT_POPULATION_COST = miasto_params_default.jednostka_koszt_ludnosci?.wartosc ?? 1;
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
  konwersjaBiblioteka: 0.5,
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
  konwersjaSwiatyniaPct: 2
});

// src/game/cities.ts
var MIN_CITY_DISTANCE = miasto_params_default.min_dystans_miast?.wartosc ?? 5;

// src/game/okolica.ts
var OKOLICA_RADIUS = miasto_params_default.zasieg_okolicy_miasta?.wartosc ?? 5;
var CITY_RANGE_MIN = miasto_params_default.zasieg_okolicy_baza?.wartosc ?? 5;
var CITY_RANGE_CAP = miasto_params_default.zasieg_okolicy_max?.wartosc ?? 15;
function cityRangeForPopulation(population) {
  const pop = Number.isFinite(population) ? Math.floor(population) : 0;
  if (pop <= 0) return 0;
  return Math.min(Math.max(CITY_RANGE_MIN, pop), CITY_RANGE_CAP);
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
function isInTerritory(q, r, nodes) {
  for (const node of nodes) {
    if (axialDistance(q, r, node.q, node.r) <= cityTerritoryRadius(node)) return true;
  }
  return false;
}

// src/map/improvement-build.ts
var TERENY_LADU = /* @__PURE__ */ new Set([
  "laka" /* Laka */,
  "rownina" /* Rownina */,
  "wzgorza" /* Wzgorza */,
  "gory" /* Gory */,
  "pustynia" /* Pustynia */,
  "wybrzeze" /* Wybrzeze */
]);
var TARTAK_TERENY = /* @__PURE__ */ new Set([
  "laka" /* Laka */,
  "rownina" /* Rownina */,
  "wzgorza" /* Wzgorza */,
  "pustynia" /* Pustynia */,
  "wybrzeze" /* Wybrzeze */
]);
var FLAT_FARM = /* @__PURE__ */ new Set(["laka" /* Laka */, "rownina" /* Rownina */]);
var FLAT_IRR = /* @__PURE__ */ new Set([
  "laka" /* Laka */,
  "rownina" /* Rownina */,
  "pustynia" /* Pustynia */
]);
var FOOD_LAYER_KEYS = /* @__PURE__ */ new Set([
  "farma",
  "irygacja",
  "bydlo",
  "owce",
  "lama",
  "tarasy"
]);
var SOLO_FOOD_KEYS = /* @__PURE__ */ new Set(["tarasy", "owce", "lama"]);
var TERRAIN_ALLOW = {
  farma: FLAT_FARM,
  irygacja: FLAT_IRR,
  bydlo: FLAT_FARM,
  owce: /* @__PURE__ */ new Set(["wzgorza" /* Wzgorza */]),
  lama: /* @__PURE__ */ new Set(["laka" /* Laka */, "rownina" /* Rownina */, "wzgorza" /* Wzgorza */]),
  stadnina: /* @__PURE__ */ new Set(["laka" /* Laka */, "rownina" /* Rownina */]),
  kopalnia: /* @__PURE__ */ new Set(["wzgorza" /* Wzgorza */, "gory" /* Gory */]),
  glinianka: null,
  kamieniolom: /* @__PURE__ */ new Set(["wzgorza" /* Wzgorza */, "gory" /* Gory */]),
  oboz_lowiecki: null,
  wyrab: null,
  lodzie_rybackie: /* @__PURE__ */ new Set(["wybrzeze" /* Wybrzeze */, "morze" /* Morze */]),
  tarasy: /* @__PURE__ */ new Set(["wzgorza" /* Wzgorza */]),
  fort: null,
  droga: null,
  droga_brukowana: null,
  posterunek: null,
  popalnia_brazu: /* @__PURE__ */ new Set(["wzgorza" /* Wzgorza */, "gory" /* Gory */])
};
function hasBlockingDepositForFarm(hex) {
  if (hex.zloze) return true;
  if (hex.nakladka === "brak" /* Brak */ || hex.nakladka === "las" /* Las */) return false;
  if (hex.nakladka === "zloze_bydla" /* ZlozeBydla */ || hex.nakladka === "zloze_owiec" /* ZlozeOwiec */) return false;
  return true;
}
function hexHasRudaDeposit(hex) {
  const zloze = hex.zloze;
  if (zloze === "ruda" || zloze === "miedz" || zloze === "zelazo" || zloze === "wegiel") return true;
  return hex.nakladka === "zloze_rudy" /* ZlozeRudy */;
}
function hexHasDepositReserve(hex) {
  if (hex.zloze) return true;
  if (hex.nakladka !== "brak" /* Brak */ && hex.nakladka !== "las" /* Las */) return true;
  return false;
}
function depositAllowsPlayerImprovement(key, hex) {
  const nakladka = hex.nakladka;
  const zloze = hex.zloze;
  const teren = hex.terenBazowy;
  switch (key) {
    case "glinianka":
      return nakladka === "zloze_gliny" /* ZlozeGliny */;
    case "kopalnia":
      if (teren === "gory" /* Gory */) {
        return zloze === "miedz" || zloze === "zelazo" || zloze === "wegiel" || nakladka === "zloze_rudy" /* ZlozeRudy */;
      }
      return nakladka === "zloze_rudy" /* ZlozeRudy */;
    case "warzelnia_soli":
      return zloze === "sol";
    case "popalnia_brazu":
      return hexHasRudaDeposit(hex);
    case "bydlo":
      return nakladka === "zloze_bydla" /* ZlozeBydla */;
    case "owce":
      return nakladka === "zloze_owiec" /* ZlozeOwiec */;
    case "lama":
      return nakladka === "zloze_lamy" /* ZlozeLamy */;
    case "stadnina":
      return hex.nakladka === "zloze_konia" /* ZlozeKonia */;
    case "oboz_lowiecki":
      return nakladka === "las" /* Las */ || hasAnimalDeposit(nakladka);
    default:
      return false;
  }
}
function canAddFoodLayer(existing, newKey) {
  const ex = existing.filter((k) => FOOD_LAYER_KEYS.has(k));
  if (ex.includes(newKey)) return false;
  if (SOLO_FOOD_KEYS.has(newKey)) return ex.length === 0;
  if (ex.some((k) => SOLO_FOOD_KEYS.has(k))) return false;
  const hasF = ex.includes("farma");
  const hasI = ex.includes("irygacja");
  const hasB = ex.includes("bydlo");
  switch (newKey) {
    case "farma":
      if (ex.length === 0) return true;
      return ex.length === 1 && (hasI || hasB);
    case "irygacja":
      if (ex.length === 0) return true;
      return ex.length === 1 && hasF && !hasB;
    case "bydlo":
      if (ex.length === 0) return true;
      return ex.length === 1 && hasF && !hasI;
    default:
      return false;
  }
}
function keysOnPlacedHex2(imp) {
  if (typeof imp === "string") return imp ? [imp] : [];
  return imp.map(String);
}
function getHexLayers(hexKey, hex, placedImprovements) {
  const keys = new Set(improvementKeysForHex(hex));
  const ext = placedImprovements?.get(hexKey);
  if (ext) {
    for (const k of keysOnPlacedHex2(ext)) {
      const n = k.toLowerCase().trim();
      if (n && n !== "brak") keys.add(n);
    }
  }
  return [...keys];
}
function isFoodKey(key) {
  return FOOD_LAYER_KEYS.has(key);
}
function buildPlacedImprovementsMap(map, placedImprovements) {
  if (placedImprovements) return placedImprovements;
  const m = /* @__PURE__ */ new Map();
  for (const [key, hex] of Object.entries(map.hexes)) {
    const keys = improvementKeysForHex(hex);
    if (keys.length) m.set(key, keys);
    else {
      const single = normalizeImprovementKey(String(hex.ulepszenie ?? "brak"));
      if (single) m.set(key, [single]);
    }
  }
  return m;
}
function hexNeighbors(q, r) {
  return [
    { q: q + 1, r },
    { q: q - 1, r },
    { q, r: r + 1 },
    { q, r: r - 1 },
    { q: q + 1, r: r - 1 },
    { q: q - 1, r: r + 1 }
  ];
}
function buildRiverHexSet(map) {
  const set = /* @__PURE__ */ new Set();
  for (const path of map.riverPaths) {
    for (const p of path) set.add(`${p.q},${p.r}`);
  }
  return set;
}
var NAKLADKI_ZWIERZECZE = /* @__PURE__ */ new Set([
  "zloze_konia" /* ZlozeKonia */,
  "zloze_owiec" /* ZlozeOwiec */,
  "zloze_bydla" /* ZlozeBydla */,
  "zloze_lamy" /* ZlozeLamy */
]);
function hasAnimalDeposit(nakladka) {
  return NAKLADKI_ZWIERZECZE.has(nakladka);
}
function hexZloze(hex) {
  return hex?.zloze;
}
function createQualifier(state) {
  const { map, cityNodes, playerCivArchetype } = state;
  const playerEra = state.playerEra ?? 1;
  const placedKeys = state.placedKeys ?? /* @__PURE__ */ new Set();
  const roadKeys = state.roadKeys ?? /* @__PURE__ */ new Set();
  const riverHexSet = buildRiverHexSet(map);
  const placedMap = buildPlacedImprovementsMap(map, state.placedImprovements);
  const empireUnlocks = computeEmpireLivestockUnlocks(
    placedMap,
    map,
    state.playerOwnerId
  );
  function isOnTerritoryEdge(q, r) {
    if (isInTerritory(q, r, cityNodes)) return true;
    for (const nb of hexNeighbors(q, r)) {
      if (isInTerritory(nb.q, nb.r, cityNodes)) return true;
    }
    return false;
  }
  function isRoadQualified(q, r) {
    for (const nb of hexNeighbors(q, r)) {
      const nbKey = `${nb.q},${nb.r}`;
      if (roadKeys.has(nbKey)) return true;
      const nbHex = map.hexes[nbKey];
      if (nbHex && hexHasRoad(nbHex)) return true;
      for (const node of cityNodes) {
        if (nb.q === node.q && nb.r === node.r) return true;
      }
    }
    for (const node of cityNodes) {
      if (axialDistance(q, r, node.q, node.r) === 1) return true;
    }
    return false;
  }
  function isRiverAdjacent(q, r) {
    const hex = map.hexes[`${q},${r}`];
    if (hex?.rzeka?.obecna) return true;
    if (riverHexSet.has(`${q},${r}`)) return true;
    for (const nb of hexNeighbors(q, r)) {
      if (riverHexSet.has(`${nb.q},${nb.r}`)) return true;
    }
    return false;
  }
  function qualifies(key, q, r) {
    const hexKey = `${q},${r}`;
    const hex = map.hexes[hexKey];
    if (!hex) return false;
    const teren = hex.terenBazowy;
    const nakladka = hex.nakladka;
    const zloze = hexZloze(hex);
    const existing = getHexLayers(hexKey, hex, placedMap);
    if (hexHasDepositReserve(hex) && !depositAllowsPlayerImprovement(key, hex)) {
      return false;
    }
    if (key === "droga_brukowana") {
      if (!TERENY_LADU.has(teren)) return false;
      const hasDroga = existing.includes("droga") || hex.ulepszenie === "droga" /* Droga */;
      const hasBruk = existing.includes("droga_brukowana") || hex.ulepszenie === "droga_brukowana" /* DrogaBrukowana */;
      return hasDroga && !hasBruk;
    }
    if (key !== "droga") {
      const nonFoodExisting = existing.filter((k) => !FOOD_LAYER_KEYS.has(k));
      if (isFoodKey(key)) {
        if (nonFoodExisting.length > 0) return false;
        if (!canAddFoodLayer(existing, key)) return false;
      } else if (existing.length > 0 || placedKeys.has(hexKey)) {
        return false;
      }
    } else if (placedKeys.has(hexKey)) {
      return false;
    }
    switch (key) {
      case "farma":
        if (!FLAT_FARM.has(teren)) return false;
        if (hasBlockingDepositForFarm(hex)) return false;
        if (!isInTerritory(q, r, cityNodes)) return false;
        return true;
      case "irygacja":
        if (!FLAT_IRR.has(teren)) return false;
        if (hasBlockingDepositForFarm(hex)) return false;
        if (!isInTerritory(q, r, cityNodes)) return false;
        return isRiverAdjacent(q, r);
      case "bydlo":
        if (!FLAT_FARM.has(teren)) return false;
        if (!isInTerritory(q, r, cityNodes)) return false;
        if (!isLivestockAllowed(playerCivArchetype, key, playerEra)) return false;
        return isLivestockUnlockedForPlacement(key, hex, empireUnlocks);
      case "owce":
        if (teren !== "wzgorza" /* Wzgorza */) return false;
        if (!isInTerritory(q, r, cityNodes)) return false;
        if (!isLivestockAllowed(playerCivArchetype, key, playerEra)) return false;
        return isLivestockUnlockedForPlacement(key, hex, empireUnlocks);
      case "lama":
        if (teren === "pustynia" /* Pustynia */) return false;
        if (!TERRAIN_ALLOW.lama?.has(teren)) return false;
        if (!isInTerritory(q, r, cityNodes)) return false;
        if (!isLivestockAllowed(playerCivArchetype, key, playerEra)) return false;
        return isLivestockUnlockedForPlacement(key, hex, empireUnlocks);
      case "stadnina":
        if (!isInTerritory(q, r, cityNodes)) return false;
        if (teren !== "laka" /* Laka */ && teren !== "rownina" /* Rownina */) return false;
        if (!isLivestockAllowed(playerCivArchetype, key, playerEra)) return false;
        return hex.nakladka === "zloze_konia" /* ZlozeKonia */ || isLivestockUnlockedForPlacement(key, hex, empireUnlocks);
      case "droga":
        return TERENY_LADU.has(teren) && isRoadQualified(q, r);
      case "posterunek":
        return TERENY_LADU.has(teren) && isOnTerritoryEdge(q, r);
      case "fort":
        return TERENY_LADU.has(teren) && isInTerritory(q, r, cityNodes);
      case "glinianka":
        return nakladka === "zloze_gliny" /* ZlozeGliny */ && isInTerritory(q, r, cityNodes);
      case "kopalnia":
        if (!isInTerritory(q, r, cityNodes)) return false;
        if (teren !== "gory" /* Gory */) return nakladka === "zloze_rudy" /* ZlozeRudy */;
        return zloze === "miedz" || zloze === "zelazo" || zloze === "wegiel" || nakladka === "zloze_rudy" /* ZlozeRudy */;
      case "wyrab":
        return nakladka === "las" /* Las */ && isInTerritory(q, r, cityNodes);
      case "tartak": {
        if (!isInTerritory(q, r, cityNodes)) return false;
        return TARTAK_TERENY.has(teren);
      }
      case "oboz_lowiecki": {
        if (!isInTerritory(q, r, cityNodes)) return false;
        return nakladka === "las" /* Las */ || hasAnimalDeposit(nakladka);
      }
      case "warzelnia_soli":
        if (!isInTerritory(q, r, cityNodes)) return false;
        return zloze === "sol";
      case "popalnia_brazu":
        if (!isInTerritory(q, r, cityNodes)) return false;
        if (teren !== "wzgorza" /* Wzgorza */ && teren !== "gory" /* Gory */) return false;
        return hexHasRudaDeposit(hex);
      case "tarasy": {
        if (!isInTerritory(q, r, cityNodes)) return false;
        if (hasBlockingDepositForFarm(hex)) return false;
        return teren === "wzgorza" /* Wzgorza */;
      }
      case "lodzie_rybackie":
        if (!isInTerritory(q, r, cityNodes)) return false;
        return teren === "wybrzeze" /* Wybrzeze */ || teren === "morze" /* Morze */;
      default: {
        const allowed = TERRAIN_ALLOW[key];
        if (!TERENY_LADU.has(teren)) return false;
        if (!isInTerritory(q, r, cityNodes)) return false;
        if (allowed && !allowed.has(teren)) return false;
        return true;
      }
    }
  }
  return qualifies;
}
function buildImprovementQualifier(state) {
  return createQualifier(state);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Nakladka,
  TerenBazowy,
  buildImprovementQualifier,
  computeEmpireLivestockUnlocks,
  depositAllowsPlayerImprovement,
  hexHasHorseDeposit,
  improvementMatchesLivestockDeposit
});
