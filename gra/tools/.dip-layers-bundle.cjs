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

// tools/.dip-layers-entry.ts
var dip_layers_entry_exports = {};
__export(dip_layers_entry_exports, {
  BARBARIAN_OWNER_ID: () => BARBARIAN_OWNER_ID,
  barbarianWarRelation: () => barbarianWarRelation,
  computeDiplomaticContacts: () => computeDiplomaticContacts,
  diplomacyLayerForOwner: () => diplomacyLayerForOwner,
  filterDiplomacyCommandsForEstablishedContact: () => filterDiplomacyCommandsForEstablishedContact
});
module.exports = __toCommonJS(dip_layers_entry_exports);

// data/terrain-improvements.json
var terrain_improvements_default = {
  _meta: {
    opis: "Ulepszenia terenu (lane MIASTO: liczby bonusow + koszt + epoka). Gdzie wolno (placement) + render = MAPA. Przeplyw w turze = SILNIK. Koszt w PRACY (z puli Pracy w skarbcu, Q4). Lista uzgodniona z MAPA + uzupelniona na przyszlosc wczesnych epok (2026-06-24). EKONOMIA: dodano surowiecOdblokowany (ASCII) + zasieg_terytorium (2026-06-25).",
    bonus_pola: "zywnosc | praca | handel | pieniadz | kamien | drewno (na obrabiane pole)",
    epoka: "1=Kamien, 2=Braz, 3=Zelazo",
    decyzje_MIASTO: "lodzie_rybackie = TAK teraz; kamieniolom OSOBNO od kopalni (rozne surowce); teren NIE daje +Nauka/+Kultura (te z budynkow/specjalistow/suwaka). Tarasy = +zywnosc (nie kultura).",
    kanon_zywnosc_hodowla: "docs/decyzje/KANON-ULEPSZENIA-ZYWNOSC-HODOWLA.md (2026-06-29 Maciej) \u2014 obowiazuje nad tym plikiem do wdrozenia",
    decyzje_EKONOMIA: "surowiecOdblokowany = klucz ASCII surowca (lub null) wg modelu dostepu boolean v0.1; zasieg_terytorium: posterunek=5 (epoka 2), fort=10 (epoka 3), miasto=10 (stale); zakladanie kolejnego miasta wymaga Straznica LUB zasiegu obecnego miasta. Rozbieznosci kluczy z resources.json (brak pola id) zapisane w EKONOMIA-ulepszenia-terenu-v01.md.",
    klucze_surowcow_ASCII: "drewno | kamien | glina | ruda | zelazo | stal | bydlo | owce | lama | kon | sol",
    pole_surowiec_ilosc_tura: "SUROW-TERYT-01 (Maciej 2026-07-23): produkcja PER ZBUDOWANE ULEPSZENIE w terytorium wlasciciela, niezaleznie od obsadzenia pola populacja (workedTiles). Wartosc = surowiec/ture. Stawki REALNE (Maciej 2026-07-23, korekta po ECHO placeholdera): Tartak->drewno 4, Kamieniolom->kamien 4, Glinianka->glina 4, Kopalnia miedzi->ruda 2, Kopalnia (zloze zelaza)->ruda_zelaza 2. Brak pola w JSON -> domyslnie 2/ture (terrain-improvements.ts TERRITORY_YIELD_DEFAULT_AMOUNT, fallback bezpieczenstwa)."
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
      glina: 2
    },
    surowiecOdblokowany: "glina",
    surowiecOdblokowany_uwaga: "GLINA-Q1=A (Maciej 2026-07-20): stala ilosc glina/ture z ulepszenia. Stawka SUROW-TERYT-01: 4/ture, podniesiona do 5 przy C-SUROW-CEGLA=A (Maciej 2026-07-24, odciazenie cegly wg symulacji -- glina musi nadazyc za Cegielnia 3/ture). NIE bonus.glina (2) -- osobne pola.",
    surowiec_ilosc_tura: 5,
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
      praca: 3
    },
    surowiecOdblokowany: "drewno",
    surowiecOdblokowany_uwaga: "SUROW-TERYT-01 (Maciej 2026-07-23): produkcja per ulepszenie w terytorium, niezaleznie od obsadzenia populacja -- patrz surowiec_ilosc_tura (REALNA stawka 4/ture, nie placeholder).",
    surowiec_ilosc_tura: 4,
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
      zywnosc: 3
    },
    surowiecOdblokowany: null,
    teren: "Wzg\xF3rza",
    warunek: "Wzg\xF3rze w terytorium; solo; +\u017Cywno\u015B\u0107; nie na z\u0142o\u017Cu; UNIKALNE kulturowe (tylko Chi\u0144czycy + Inkowie)",
    koszt_praca: 25,
    tech: "Rolnictwo",
    odblokowuje: "",
    cywilizacje: ["chinczycy", "inkowie"],
    cywilizacje_uwaga: "Pole og\xF3lne (konwencja z wonders.json: WonderDef.cywilizacje + canCivBuildWonder) \u2014 czytane przez isImprovementAllowedForCiv (game/terrain-improvements.ts), NIE hardkod per-ulepszenie. Brak pola / pusta lista = dost\u0119pne dla wszystkich cywilizacji.",
    uwagi: "C-TARASY-Q1 Maciej 2026-07-26: cofni\u0119cie T-TECH-4 (2026-07-04, 'po Rolnictwie \u2014 wszystkie cywilizacje') \u2014 zgodno\u015B\u0107 historyczna: chi\u0144skie tarasy ry\u017Cowe i andyjskie tarasy Ink\xF3w. Od teraz WY\u0141\u0104CZNIE Chi\u0144czycy + Inkowie (po Rolnictwie)."
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
      praca: 2
    },
    surowiecOdblokowany: null,
    surowiecOdblokowany_uwaga: "Maciej 2026-07-25: z\u0142oto jest surowcem DOST\u0118POWYM \u2014 bez magazynowania, bez ilo\u015Bci/tur\u0119. W przeciwie\u0144stwie do Kopalni miedzi/kopalni na z\u0142o\u017Cu \u017Celaza, ta Kopalnia NIE zasila \u017Cadnej puli (celowo brak surowiecOdblokowany i surowiec_ilosc_tura) \u2014 liczy si\u0119 wy\u0142\u0105cznie fakt jej istnienia gdziekolwiek w imperium (empireHasKopalniaZlota, game/zloto-access.ts).",
    teren: "Wzg\xF3rza, G\xF3ry, z\u0142o\u017Ce z\u0142ota (hex.zloze=zloto)",
    warunek: "dost\u0119p imperium do Z\u0142ota (bramka Mennicy) \u2014 bez wydobycia ilo\u015Bciowego",
    koszt_praca: 22,
    tech: "Waluta",
    odblokowuje: "Mennica (dost\u0119p do Z\u0142ota, obok Targowiska w tym mie\u015Bcie)",
    uwagi: "Maciej 2026-07-25: \u201Ez\u0142oto potraktujemy jako surowiec, do kt\xF3rego wystarczy tylko dost\u0119p \u2014 nie trzeba budowa\u0107 wielu kopalni\u201D. Wzorowana na Kopalni miedzi (kopalnia_miedzi) \u2014 dedykowane ulepszenie, tylko na hex.zloze=zloto."
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

// src/game/barbarians.ts
var BARBARIAN_OWNER_ID = -1;
function isBarbarian(ownerId) {
  return ownerId === BARBARIAN_OWNER_ID;
}

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
  /** Relacja >= wartość wymagana do handlu ¤/Praca/złoża (Maciej 2026-07-21: 40 @ normal) */
  progHandelRelacja: 40,
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
function hexKey(q, r) {
  return `${q},${r}`;
}
function barbarianWarRelation() {
  const p = DIPLOMACY_PARAMS;
  return {
    zaufanie: 0,
    respekt: p.startRespekt,
    status: "wojna"
  };
}
function computeDiplomaticContacts(visible, cities, units, playerOwnerId = 0) {
  const contacted = /* @__PURE__ */ new Set();
  for (const c of cities) {
    if (c.ownerId === playerOwnerId || isBarbarian(c.ownerId)) continue;
    if (visible.has(hexKey(c.q, c.r))) contacted.add(c.ownerId);
  }
  for (const u of units) {
    if (u.ownerId === playerOwnerId || isBarbarian(u.ownerId)) continue;
    if (visible.has(hexKey(u.q, u.r))) contacted.add(u.ownerId);
  }
  return contacted;
}
function diplomacyLayerForOwner(ownerId, simplifiedOwners, foreignTypeOwners, contactedOwners) {
  if (foreignTypeOwners === void 0 || contactedOwners === void 0) {
    return simplifiedOwners.has(ownerId) ? "simplified" : "full";
  }
  if (!contactedOwners.has(ownerId)) {
    return "pre_contact";
  }
  if (simplifiedOwners.has(ownerId)) return "simplified";
  return "full";
}
var ESTABLISHED_CONTACT_CMDS = /* @__PURE__ */ new Set([
  "zaproponuj_pokoj",
  "zaproponuj_sojusz",
  "zaproponuj_handel",
  "zaproponuj_umowe_handlowa",
  "zaproponuj_handel_surowiec",
  "zadaj_trybut",
  "oferuj_trybut_za_pokoj"
]);
function filterDiplomacyCommandsForEstablishedContact(cmds, contactEstablished) {
  if (contactEstablished) return cmds;
  return cmds.filter((c) => !ESTABLISHED_CONTACT_CMDS.has(c.type));
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BARBARIAN_OWNER_ID,
  barbarianWarRelation,
  computeDiplomaticContacts,
  diplomacyLayerForOwner,
  filterDiplomacyCommandsForEstablishedContact
});
