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

// tools/.army-hunger-combat-entry.ts
var army_hunger_combat_entry_exports = {};
__export(army_hunger_combat_entry_exports, {
  advanceEmpireFood: () => advanceEmpireFood,
  applyArmyHungerStatMultToCombatUnit: () => applyArmyHungerStatMultToCombatUnit,
  bindEmpireFoodRuntime: () => bindEmpireFoodRuntime,
  buildEmpireFoodParams: () => buildEmpireFoodParams,
  clearLastEmpireFoodTicks: () => clearLastEmpireFoodTicks,
  freshEmpireFoodState: () => freshEmpireFoodState,
  isArmyHungry: () => isArmyHungry,
  isArmyStarving: () => isArmyStarving
});
module.exports = __toCommonJS(army_hunger_combat_entry_exports);

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
    pole_surowiec_ilosc_tura: "SUROW-TERYT-01 (Maciej 2026-07-23): produkcja PER ZBUDOWANE ULEPSZENIE w terytorium wlasciciela, niezaleznie od obsadzenia pola populacja (workedTiles). Wartosc = surowiec/ture. Stawki REALNE: Tartak->drewno 20, Glinianka->glina 20 (PYTANIE-84-B1/B9/U-18), Kamieniolom->kamien 4, Kopalnia miedzi->ruda 2, Kopalnia (zloze zelaza)->ruda_zelaza 2, Warzelnia soli->sol 10 (B2), Stadnina->kon 1 (B3), Kopalnia zlota->zloto 1 (B4). Brak pola w JSON -> domyslnie 2/ture (terrain-improvements.ts TERRITORY_YIELD_DEFAULT_AMOUNT, fallback bezpieczenstwa)."
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
    surowiecOdblokowany_uwaga: "GLINA-Q1=A (Maciej 2026-07-20): stala ilosc glina/ture z ulepszenia. PYTANIE-84-B1/U-18 (Maciej 2026-07-27): stawka REALNA = 20/ture (Cegielnia 3/t + Garncarnia 6/t + nadwy\u017Cka). NIE bonus.glina (2) -- osobne pola.",
    surowiec_ilosc_tura: 20,
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
    surowiecOdblokowany_uwaga: "SUROW-TERYT-01 (Maciej 2026-07-23): produkcja per ulepszenie w terytorium, niezaleznie od obsadzenia populacja. PYTANIE-84-B9/U-18 (Maciej 2026-07-27): stawka REALNA = 20/ture.",
    surowiec_ilosc_tura: 20,
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

// src/game/army-starvation.ts
function round4(x) {
  return Math.round(x * 1e4) / 1e4;
}
function applyArmyHungerStatMultToCombatUnit(cu, mult) {
  if (mult >= 1 || mult <= 0) return cu;
  const progRaw = cu["Prog dezercji (% health)"];
  const progScaled = progRaw === null || progRaw === void 0 ? progRaw : round4(progRaw * (2 - mult));
  return {
    ...cu,
    meleeAttack: cu.meleeAttack * mult,
    meleeDefence: cu.meleeDefence * mult,
    weaponDamage: cu.weaponDamage * mult,
    piercing: cu.piercing * mult,
    chargeBonus: cu.chargeBonus * mult,
    health: cu.health * mult,
    missileAttack: cu.missileAttack * mult,
    "Prog dezercji (% health)": progScaled
  };
}

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
  // PYTANIE-84-R9/U-13: Mennica wymaga Złota w magazynie państwa (R3=B) LUB aktywnego
  // źródła (Kopalnia złota / szlak → stock). Runtime drain 1/t — game/zloto-access.ts.
  mennica: [ZLOTO_LABEL]
};
var ASCII_BY_LABEL = Object.fromEntries(
  Object.entries(LABEL_BY_ASCII).map(([ascii, label]) => [label, ascii])
);
var DEPOSIT_RUNTIME_GATED_BUILDING_IDS = Object.freeze(
  Object.keys(DEPOSIT_LINKED_BUILDING_LABELS)
);
var SPICHLERZ_EMPIRE_CAP_I = 100;
var SPICHLERZ_EMPIRE_CAP_II_FULL = 150;
function spichlerzArmyFoodCostMultiplier(opts) {
  let m = 1;
  if (!opts.onOwnTerritory && opts.solArmyBonusActive) m *= 0.5;
  if (opts.isGarrisonInSolCity) m *= 0.5;
  return m;
}

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
  return base * mnoznikTerytorium;
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
      Suma: 8,
      Uwagi: "Dodaje bonus do DOWOLNEGO pola z rzek\u0105 (Tw\xF3j opis); razem +8 \u2014 mocny, mo\u017Cna stonowa\u0107"
    },
    {
      Modyfikator: "Las (nak\u0142adka)",
      \u017Bywno\u015B\u0107: -1,
      Praca: 3,
      Podatek: 2,
      Drewno: 3,
      Kamie\u0144: 0,
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
    // Glina nie ma bazy terenu ani modyfikatora w terrain-yields.json -- wylacznie z bonusu
    // ulepszenia (glinianka, GLINA-Q1=A), doklejane w tileYield() nizej.
    glina: 0,
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

// src/game/okolica.ts
var OKOLICA_RADIUS = miasto_params_default.zasieg_okolicy_miasta?.wartosc ?? 5;
var CITY_RANGE_MIN = miasto_params_default.zasieg_okolicy_baza?.wartosc ?? 5;
var CITY_RANGE_CAP = miasto_params_default.zasieg_okolicy_max?.wartosc ?? 15;

// src/game/population-growth-v85.ts
function pick(row, d, fallback) {
  if (!row) return fallback;
  const v = row[d];
  return Number.isFinite(v) ? v : fallback;
}
function buildRationParams(raw, difficulty = "normal") {
  const section = raw.ekonomia_miasta ?? raw;
  return {
    racjeZywnosc1: pick(section.racje_zywnosc_1, difficulty, 1),
    racjeZywnosc2: pick(section.racje_zywnosc_2, difficulty, 2),
    racjeZywnosc3: pick(section.racje_zywnosc_3, difficulty, 3),
    racjeWzrostProc1: pick(section.racje_wzrost_proc_1, difficulty, 3),
    racjeWzrostProc2: pick(section.racje_wzrost_proc_2, difficulty, 5),
    racjeWzrostProc3: pick(section.racje_wzrost_proc_3, difficulty, 7)
  };
}

// src/game/cities.ts
var MIN_CITY_DISTANCE = miasto_params_default.min_dystans_miast?.wartosc ?? 5;

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

// src/game/empire-food.ts
function pick2(row, d, fallback) {
  if (!row) return fallback;
  const v = row[d];
  return Number.isFinite(v) ? v : fallback;
}
function buildEmpireFoodParams(raw, difficulty = "normal") {
  const em = raw.ekonomia_miasta ?? raw;
  const gl = raw.globalne ?? raw;
  return {
    centralCapBaza: pick2(
      gl.magazyn_centralny_baza_zywnosc ?? em.magazyn_centralny_baza_zywnosc,
      difficulty,
      500
    ),
    centralCapBonusMagazyn: pick2(
      gl.magazyn_centralny_bonus_zywnosc_na_budynek ?? em.magazyn_centralny_bonus_zywnosc_na_budynek,
      difficulty,
      100
    ),
    glodWojskaHpFrac: pick2(em.glod_wojska_hp_frac, difficulty, 0.08),
    glodWojskaKarencjaTur: pick2(em.glod_wojska_karencja_tur, difficulty, 3),
    glodWojskaStatMult: pick2(em.glod_wojska_stat_mult, difficulty, 0.75),
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
function isArmyHungry(ownerId) {
  return _lastTicks.get(ownerId)?.glodWojska ?? false;
}
function isArmyStarving(ownerId) {
  return _lastTicks.get(ownerId)?.glodWojskaAtrycjaAktywna ?? false;
}
function _setLastEmpireFoodTicks(ticks) {
  _lastTicks = ticks;
}
function clearLastEmpireFoodTicks() {
  _lastTicks = /* @__PURE__ */ new Map();
  _maxCapByOwner = /* @__PURE__ */ new Map();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  advanceEmpireFood,
  applyArmyHungerStatMultToCombatUnit,
  bindEmpireFoodRuntime,
  buildEmpireFoodParams,
  clearLastEmpireFoodTicks,
  freshEmpireFoodState,
  isArmyHungry,
  isArmyStarving
});
