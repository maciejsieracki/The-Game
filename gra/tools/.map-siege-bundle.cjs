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

// tools/.map-siege-entry.ts
var map_siege_entry_exports = {};
__export(map_siege_entry_exports, {
  canInitiateSiege: () => canInitiateSiege,
  classifyCityAttack: () => classifyCityAttack,
  detectAutoSiegeOnCity: () => detectAutoSiegeOnCity,
  isAdjacentToHex: () => isAdjacentToHex
});
module.exports = __toCommonJS(map_siege_entry_exports);

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
  ["morze" /* Morze */]: Infinity
};
var _terrainCosts = { ...DEFAULT_TERRAIN_COSTS };

// src/game/mapSiegeDetect.ts
function isAdjacentToHex(q, r, tq, tr) {
  return hexDistance(q, r, tq, tr) === 1;
}
function classifyCityAttack(atakujacy, city, units) {
  const garnizonUnit = units.find(
    (u) => u.ownerId === city.ownerId && u.q === city.q && u.r === city.r
  ) ?? null;
  let tryb;
  if (city.maMur) {
    tryb = "oblezenie";
  } else if (garnizonUnit) {
    tryb = "zdobycie_z_marszu";
  } else {
    tryb = "bitwa_polowa";
  }
  return {
    tryb,
    city,
    atakujacy,
    garnizonUnit,
    oblegajacyOwnerId: atakujacy.ownerId
  };
}
function canInitiateSiege(atakujacy, city) {
  if (atakujacy.ownerId === city.ownerId) return false;
  if (!city.maMur) return false;
  return isAdjacentToHex(atakujacy.q, atakujacy.r, city.q, city.r);
}
function detectAutoSiegeOnCity(city, units) {
  if (!city.maMur) return null;
  for (const u of units) {
    if (u.ownerId === city.ownerId) continue;
    if (!isAdjacentToHex(u.q, u.r, city.q, city.r)) continue;
    return classifyCityAttack(u, city, units);
  }
  return null;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  canInitiateSiege,
  classifyCityAttack,
  detectAutoSiegeOnCity,
  isAdjacentToHex
});
