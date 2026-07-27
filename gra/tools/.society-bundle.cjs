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

// tools/.society-entry.ts
var society_entry_exports = {};
__export(society_entry_exports, {
  computeHappinessBreakdown: () => computeHappinessBreakdown,
  computeLawBreakdown: () => computeLawBreakdown,
  computeOrderPctBreakdown: () => computeOrderPctBreakdown,
  evaluateOrderFromBreakdown: () => evaluateOrderFromBreakdown,
  happinessBucketsFromPct: () => happinessBucketsFromPct,
  isOsiedleRevoltImmune: () => isOsiedleRevoltImmune,
  loadOrderParams: () => loadOrderParams,
  loadRevoltParams: () => loadRevoltParams,
  luksusHappinessBonus: () => luksusHappinessBonus,
  orderEffectsFromPorPct: () => orderEffectsFromPorPct,
  osiedlePopMax: () => osiedlePopMax,
  porPctBand: () => porPctBand,
  tierFromPorPct: () => tierFromPorPct,
  updateRevoltGrace: () => updateRevoltGrace
});
module.exports = __toCommonJS(society_entry_exports);

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
  ceramika: "Ceramika"
};
var ASCII_BY_LABEL = Object.fromEntries(
  Object.entries(LABEL_BY_ASCII).map(([ascii, label]) => [label, ascii])
);

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

// src/game/cities.ts
var DEFAULT_PODZIAL_HANDLU = {
  procentNauka: 20,
  procentPieniadz: 60,
  procentLuksus: 20
};
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
function pick(row, difficulty, fallback) {
  if (row === void 0) return fallback;
  const v = row[difficulty];
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}
function loadOrderParams(society, difficulty = "normal") {
  const p = society && society.porzadek || {};
  const f = FALLBACK_ORDER_PARAMS;
  return {
    wagaSzczescie: pick(p.porzadek_waga_szczescie, difficulty, f.wagaSzczescie),
    wagaPrawo: pick(p.porzadek_waga_prawo, difficulty, f.wagaPrawo),
    progT1: pick(p.porzadek_prog_t1, difficulty, f.progT1),
    progT2: pick(p.porzadek_prog_t2, difficulty, f.progT2),
    karaProdukcjaT1: pick(p.porzadek_kara_produkcja_t1, difficulty, f.karaProdukcjaT1),
    karaPieniadzT1: pick(p.porzadek_kara_pieniadz_t1, difficulty, f.karaPieniadzT1),
    karaNaukaT1: pick(p.porzadek_kara_nauka_t1, difficulty, f.karaNaukaT1),
    karaKulturaT1: pick(p.porzadek_kara_kultura_t1, difficulty, f.karaKulturaT1),
    karaWzrostT1: pick(p.porzadek_kara_wzrost_t1, difficulty, f.karaWzrostT1),
    ryzykoBuntuT1: pick(p.porzadek_ryzyko_buntu_t1, difficulty, f.ryzykoBuntuT1),
    bonusProdukcjaT2: pick(p.porzadek_bonus_produkcja_t2, difficulty, f.bonusProdukcjaT2),
    bonusHandelT2: pick(p.porzadek_bonus_handel_t2, difficulty, f.bonusHandelT2)
  };
}
function orderEffects(tier, params = FALLBACK_ORDER_PARAMS) {
  switch (tier) {
    case "unrest":
      return {
        productionMult: Math.max(0, 1 + params.karaProdukcjaT1),
        pieniadzMult: Math.max(0, 1 + params.karaPieniadzT1),
        naukaMult: Math.max(0, 1 + params.karaNaukaT1),
        kulturaMult: Math.max(0, 1 + params.karaKulturaT1),
        growthMult: Math.max(0, 1 + params.karaWzrostT1),
        tradeMult: 1,
        revoltRisk: clamp01(params.ryzykoBuntuT1)
      };
    case "order":
      return {
        productionMult: 1 + params.bonusProdukcjaT2,
        pieniadzMult: 1,
        naukaMult: 1,
        kulturaMult: 1,
        growthMult: 1,
        tradeMult: 1 + params.bonusHandelT2,
        revoltRisk: 0
      };
    case "neutral":
    default:
      return {
        productionMult: 1,
        pieniadzMult: 1,
        naukaMult: 1,
        kulturaMult: 1,
        growthMult: 1,
        tradeMult: 1,
        revoltRisk: 0
      };
  }
}
function clamp01(x) {
  if (!Number.isFinite(x)) return 0;
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

// src/game/society-breakdown.ts
var REVOLT_CRITICAL_POR_PCT = 12;
var REVOLT_GRACE_TURNS = 3;
var FALLBACK_REVOLT_PARAMS = {
  criticalPorPct: REVOLT_CRITICAL_POR_PCT,
  graceTurns: REVOLT_GRACE_TURNS
};
var SZMAX_DEFAULTS = { 1: 14, 2: 20, 3: 28 };
var PRAWMAX_DEFAULTS = { 1: 50, 2: 75, 3: 100 };
var SZ_PCT_CAP = 120;
var PRAW_PCT_CAP = 100;
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
function pickSociety(block, key, difficulty, fallback) {
  const row = block?.[key];
  if (!row) return fallback;
  const v = row[difficulty];
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}
function osiedlePopLabel(pop) {
  const p = Math.max(1, Math.floor(pop));
  return `Osiedle (${p} mieszk.)`;
}
function osiedlePopMax(society, difficulty = "normal") {
  const prBlock = society?.prawo ?? {};
  return Math.max(1, Math.floor(
    pickSociety(prBlock, "prawo_bonus_osada_prog", difficulty, 4)
  ));
}
function isOsiedleRevoltImmune(population, society = null, difficulty = "normal") {
  const p = Math.floor(population);
  if (p < 1) return false;
  return p <= osiedlePopMax(society, difficulty);
}
function loadRevoltParams(society, difficulty = "normal") {
  const block = society?.porzadek ?? {};
  return {
    criticalPorPct: pickSociety(block, "porzadek_prog_bunt_skrajny_pct", difficulty, REVOLT_CRITICAL_POR_PCT),
    graceTurns: pickSociety(block, "porzadek_grace_tur_bunt", difficulty, REVOLT_GRACE_TURNS)
  };
}
function resolvePalacTier(input) {
  const t = input.palacTier;
  if (t === 1 || t === 2 || t === 3) return t;
  if (input.hasPalac) return 1;
  return 0;
}
function clampPct(x, cap) {
  if (!Number.isFinite(x)) return 0;
  return Math.min(cap, Math.max(0, Math.round(x * 10) / 10));
}
function pctFromNetto(netto, max, cap) {
  const m = max > 0 ? max : 1;
  return clampPct(100 * netto / m, cap);
}
function szMaxForEra(era) {
  const e = Number.isFinite(era) ? Math.max(1, Math.floor(era)) : 1;
  return SZMAX_DEFAULTS[e] ?? SZMAX_DEFAULTS[3] ?? 24;
}
function prawMaxForEra(era) {
  const e = Number.isFinite(era) ? Math.max(1, Math.floor(era)) : 1;
  return PRAWMAX_DEFAULTS[e] ?? PRAWMAX_DEFAULTS[3] ?? 24;
}
var ZAMOZNOSC_SIATKA_KEY = "szczescie_siatka_zamoznosc";
var ZAMOZNOSC_SIATKA_DEFAULT = {
  easy: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  normal: [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8],
  hard: [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7]
};
function luksusHappinessBonus(procentLuksus, society, difficulty = "normal") {
  const sz = society?.szczescie ?? {};
  const luks = Number.isFinite(procentLuksus) ? procentLuksus : 0;
  const idx = Math.min(9, Math.max(0, Math.floor(luks / 10)));
  const row = sz[ZAMOZNOSC_SIATKA_KEY];
  const arr = row?.[difficulty];
  if (Array.isArray(arr) && typeof arr[idx] === "number" && Number.isFinite(arr[idx])) {
    return arr[idx];
  }
  return ZAMOZNOSC_SIATKA_DEFAULT[difficulty][idx] ?? 0;
}
function podzialLuksus(city) {
  const p = city ?? DEFAULT_PODZIAL_HANDLU;
  return p.procentLuksus ?? DEFAULT_PODZIAL_HANDLU.procentLuksus;
}
function cultureHappinessLineLabel(haKult, ownCultureShare) {
  if (haKult < 0 && ownCultureShare !== void 0 && ownCultureShare < 0.5) {
    const pct = Math.round(ownCultureShare * 100);
    return `Kultura (udzia\u0142 w\u0142asnej ${pct}%)`;
  }
  return "Kultura";
}
function computeHappinessBreakdown(input, society = null) {
  const diff = input.difficulty ?? "normal";
  const szBlock = society?.szczescie ?? {};
  const lines = [];
  const pop = Math.max(0, Math.floor(input.population ?? 0));
  const era = input.era ?? 1;
  if (input.buildingZadowolenie !== 0) {
    lines.push({ id: "budynki", label: "Budynki (+1/budynek)", value: input.buildingZadowolenie });
  }
  if (input.haKult) {
    lines.push({ id: "kultura", label: cultureHappinessLineLabel(input.haKult, input.ownCultureShare), value: input.haKult });
  }
  if (input.haRel) {
    lines.push({ id: "religia", label: "Religia", value: input.haRel });
  }
  if (input.haWealth) {
    lines.push({ id: "wealth", label: "Wealth (pula luksusu)", value: input.haWealth });
  }
  if (input.haCuda) {
    lines.push({ id: "cuda", label: "Cuda \u015Bwiata", value: input.haCuda });
  }
  if (input.hasSwiatynia) {
    const v = pickSociety(szBlock, "szczescie_swiatynia", diff, 1);
    if (v) lines.push({ id: "swiatynia", label: "\u015Awi\u0105tynia", value: v });
  }
  if (input.hasAmfiteatr) {
    const v = pickSociety(szBlock, "szczescie_amfiteatr", diff, 1);
    if (v) lines.push({ id: "amfiteatr", label: "Amfiteatr", value: v });
  }
  const progZagesz = pickSociety(szBlock, "szczescie_prog_zag\u0119szczenia", diff, 4);
  const legacyMale = pop <= progZagesz ? pickSociety(szBlock, "szczescie_male_miasto_bonus", diff, 1) : 0;
  const osiedleV = pickOsiedlePopBonus(
    szBlock,
    "szczescie_bonus_osiedle_pop",
    pop,
    diff,
    legacyMale
  );
  if (osiedleV) {
    lines.push({ id: "osiedle", label: osiedlePopLabel(pop), value: osiedleV });
  }
  if (pop > progZagesz) {
    const karaPer = pickSociety(szBlock, "szczescie_kara_wielkosc_miasta", diff, -1);
    const excess = pop - progZagesz;
    const v = karaPer * excess;
    if (v) lines.push({ id: "zageszczenie", label: `Zag\u0119szczenie (${pop}\u2212${progZagesz})`, value: v });
  }
  const luksPct = podzialLuksus(input.podzialHandlu);
  const luksBonus = luksusHappinessBonus(luksPct, society, diff);
  if (luksBonus > 0) {
    lines.push({ id: "niskie_podatki", label: `Niskie podatki (Zamo\u017Cno\u015B\u0107 ${luksPct}%)`, value: luksBonus });
  } else if (luksBonus < 0) {
    lines.push({ id: "wysokie_podatki", label: `Wysokie podatki (Zamo\u017Cno\u015B\u0107 ${luksPct}%)`, value: luksBonus });
  }
  if (input.atWar) {
    const v = pickSociety(szBlock, "szczescie_kara_wojna", diff, -3);
    if (v) lines.push({ id: "wojna", label: "Wojna", value: v });
  }
  if (input.foreignReligionDominant) {
    const v = pickSociety(szBlock, "szczescie_kara_obca_religia", diff, -2);
    if (v) lines.push({ id: "obca_religia", label: "Obca religia", value: v });
  }
  if (input.conquestUnstablePenalty) {
    lines.push({
      id: "podboj_niestabilny",
      label: "Podb\xF3j: obca kultura i religia",
      value: input.conquestUnstablePenalty
    });
  }
  if (input.stolicaEasyBonus) {
    const v = pickSociety(szBlock, "szczescie_bonus_stolica_easy", diff, 1);
    if (v) lines.push({ id: "stolica_easy", label: "Stolica imperium (easy)", value: v });
  }
  const netto = lines.reduce((s, l) => s + l.value, 0);
  const szMax = szMaxForEra(era);
  const szPct = pctFromNetto(netto, szMax, SZ_PCT_CAP);
  return { lines, netto, szMax, szPct };
}
function computeLawBreakdown(input, society = null) {
  const diff = input.difficulty ?? "normal";
  const prBlock = society?.prawo ?? {};
  const lines = [];
  const era = input.era ?? 1;
  const perUnit = pickSociety(prBlock, "prawo_garnizon_per_jednostka", diff, 20);
  const capUnits = pickSociety(prBlock, "prawo_garnizon_cap_jednostek", diff, 5);
  const units = Math.max(0, Math.floor(input.garnizonCount ?? 0));
  const effective = Math.min(units, capUnits);
  if (effective > 0) {
    lines.push({
      id: "garnizon",
      label: `Garnizon (${effective} jedn.)`,
      value: perUnit * effective
    });
  }
  if (input.hasDomStarszyzny) {
    const v = pickSociety(prBlock, "prawo_dom_starszyzny", diff, 28);
    if (v) lines.push({ id: "dom_starszyzny", label: "Dom Starszyzny", value: v });
  }
  if (input.hasDworZarzadcy) {
    const v = pickSociety(prBlock, "prawo_dwor_zarzadcy", diff, 33);
    if (v) lines.push({ id: "dwor_zarzadcy", label: "Dw\xF3r Zarz\u0105dcy", value: v });
  }
  if (input.hasPretorium) {
    const v = pickSociety(prBlock, "prawo_pretorium", diff, 2);
    if (v) lines.push({ id: "pretorium", label: "Pretorium", value: v });
  }
  if (input.hasTrybunal) {
    const v = pickSociety(prBlock, "prawo_trybunal", diff, 17);
    if (v) lines.push({ id: "trybunal", label: "Trybuna\u0142", value: v });
  }
  if (input.hasSad) {
    const v = pickSociety(prBlock, "prawo_sad", diff, 2);
    if (v) lines.push({ id: "sad", label: "S\u0105d", value: v });
  }
  const palacTier = resolvePalacTier(input);
  if (palacTier === 1 || palacTier === 2 || palacTier === 3) {
    const palacByTier = {
      1: { key: "prawo_palac", fallback: 35, label: "Pa\u0142ac" },
      2: { key: "prawo_palac_ii", fallback: 45, label: "Pa\u0142ac II" },
      3: { key: "prawo_palac_iii", fallback: 55, label: "Pa\u0142ac III" }
    };
    const { key, fallback, label } = palacByTier[palacTier];
    const v = pickSociety(prBlock, key, diff, fallback);
    if (v) lines.push({ id: "palac", label, value: v });
  }
  if (input.brakGarnizonuKara) {
    const v = pickSociety(prBlock, "prawo_kara_brak_garnizonu", diff, -2);
    if (v) lines.push({ id: "brak_garnizonu", label: "Brak garnizonu (du\u017Ce miasto)", value: v });
  }
  if (input.conquestNoGarrisonPenalty) {
    lines.push({
      id: "podboj_bez_garnizonu",
      label: "Podb\xF3j bez garnizonu",
      value: input.conquestNoGarrisonPenalty
    });
  }
  const pop = Math.max(0, Math.floor(input.population ?? 0));
  const osadaProg = pickSociety(prBlock, "prawo_bonus_osada_prog", diff, 4);
  const legacyOsada = pop > 0 && pop <= osadaProg ? pickSociety(prBlock, "prawo_bonus_osada", diff, 3) : 0;
  const osiedleV = pickOsiedlePopBonus(
    prBlock,
    "prawo_bonus_osiedle_pop",
    pop,
    diff,
    legacyOsada
  );
  if (osiedleV) {
    lines.push({ id: "osiedle", label: osiedlePopLabel(pop), value: osiedleV });
  }
  if (input.stolicaEasyBonus) {
    const v = pickSociety(prBlock, "prawo_bonus_stolica_easy", diff, 1);
    if (v) lines.push({ id: "stolica_easy", label: "Stolica imperium (easy)", value: v });
  }
  const netto = lines.reduce((s, l) => s + l.value, 0);
  const prawMax = prawMaxForEra(era);
  const prawPct = pctFromNetto(Math.max(0, netto), prawMax, PRAW_PCT_CAP);
  return { lines, netto, prawMax, prawPct };
}
function porPctBand(porPct, criticalPorPct = REVOLT_CRITICAL_POR_PCT) {
  const p = Number.isFinite(porPct) ? porPct : 0;
  const crit = Number.isFinite(criticalPorPct) ? criticalPorPct : REVOLT_CRITICAL_POR_PCT;
  if (p >= 90) return "lad";
  if (p >= 70) return "spokoj";
  if (p >= 50) return "napiecie";
  if (p >= 30) return "niepokoj";
  if (p >= crit) return "bunt";
  return "bunt_skrajny";
}
var POR_BAND_LABELS = {
  lad: "\u0141ad",
  spokoj: "Spok\xF3j",
  napiecie: "Napi\u0119cie",
  niepokoj: "Niepok\xF3j",
  bunt: "Bunt",
  bunt_skrajny: "Bunt skrajny"
};
function tierFromPorPct(porPct) {
  const p = Number.isFinite(porPct) ? porPct : 0;
  if (p >= 90) return "order";
  if (p >= 30) return "neutral";
  return "unrest";
}
function orderEffectsFromPorPct(porPct, params = FALLBACK_ORDER_PARAMS, criticalPorPct = REVOLT_CRITICAL_POR_PCT) {
  const band = porPctBand(porPct, criticalPorPct);
  switch (band) {
    case "lad":
      return orderEffects("order", params);
    case "spokoj":
      return orderEffects("neutral", params);
    case "napiecie":
      return {
        productionMult: 0.95,
        pieniadzMult: 1,
        naukaMult: 1,
        kulturaMult: 1,
        growthMult: 1,
        tradeMult: 1,
        revoltRisk: 0
      };
    case "niepokoj":
      return orderEffects("unrest", params);
    case "bunt":
      return {
        ...orderEffects("unrest", params),
        revoltRisk: params.ryzykoBuntuT1
      };
    case "bunt_skrajny":
    default: {
      const base = orderEffects("unrest", params);
      return {
        productionMult: Math.max(0, base.productionMult - 0.15),
        pieniadzMult: Math.max(0, base.pieniadzMult - 0.15),
        naukaMult: Math.max(0, base.naukaMult - 0.15),
        kulturaMult: Math.max(0, base.kulturaMult - 0.15),
        growthMult: base.growthMult,
        tradeMult: 1,
        revoltRisk: Math.min(1, params.ryzykoBuntuT1 + 0.03)
      };
    }
  }
}
function computePorPct(szPct, prawPct, params = FALLBACK_ORDER_PARAMS) {
  const wS = params.wagaSzczescie;
  const wP = params.wagaPrawo;
  return clampPct(wS * szPct + wP * prawPct, SZ_PCT_CAP);
}
function computeOrderPctBreakdown(sz, prawo, params = FALLBACK_ORDER_PARAMS, revolt = FALLBACK_REVOLT_PARAMS) {
  const porPct = computePorPct(sz.szPct, prawo.prawPct, params);
  const band = porPctBand(porPct, revolt.criticalPorPct);
  const tier = tierFromPorPct(porPct);
  const effects = orderEffectsFromPorPct(porPct, params, revolt.criticalPorPct);
  return {
    sz,
    prawo,
    wagaSz: params.wagaSzczescie,
    wagaPraw: params.wagaPrawo,
    porPct,
    tier,
    band,
    bandLabel: POR_BAND_LABELS[band],
    effects
  };
}
function evaluateOrderFromBreakdown(happinessInput, lawInput, society, difficulty = "normal") {
  const params = loadOrderParams(society, difficulty);
  const revolt = loadRevoltParams(society, difficulty);
  const sz = computeHappinessBreakdown(happinessInput, society);
  const prawo = computeLawBreakdown(lawInput, society);
  return computeOrderPctBreakdown(sz, prawo, params, revolt);
}
function updateRevoltGrace(currentGrace, porPct, revolt = FALLBACK_REVOLT_PARAMS) {
  const crit = revolt.criticalPorPct;
  const graceTurns = Math.max(0, Math.floor(revolt.graceTurns));
  if (porPct >= crit) {
    return {
      revoltGraceRemaining: null,
      revoltWarning: false,
      shouldTriggerRebellion: false,
      graceTurnsLeft: null
    };
  }
  if (currentGrace === null || currentGrace === void 0) {
    return {
      revoltGraceRemaining: graceTurns,
      revoltWarning: true,
      shouldTriggerRebellion: false,
      graceTurnsLeft: graceTurns
    };
  }
  if (currentGrace > 0) {
    const next = currentGrace - 1;
    return {
      revoltGraceRemaining: next,
      revoltWarning: true,
      shouldTriggerRebellion: false,
      graceTurnsLeft: next
    };
  }
  return {
    revoltGraceRemaining: 0,
    revoltWarning: true,
    shouldTriggerRebellion: true,
    graceTurnsLeft: 0
  };
}
function happinessBucketsFromPct(population, szPct) {
  const pop = Number.isFinite(population) && population > 0 ? Math.floor(population) : 0;
  if (pop <= 0) return { zadowoleni: 0, kontentni: 0, niezadowoleni: 0 };
  const p = Number.isFinite(szPct) ? szPct : 0;
  const happyFrac = Math.min(1, Math.max(0, (p - 50) / 50));
  const unhappyFrac = Math.min(1, Math.max(0, (50 - p) / 50));
  const zadowoleni = Math.floor(pop * happyFrac);
  const niezadowoleni = Math.floor(pop * unhappyFrac);
  const kontentni = pop - zadowoleni - niezadowoleni;
  return { zadowoleni, kontentni, niezadowoleni };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  computeHappinessBreakdown,
  computeLawBreakdown,
  computeOrderPctBreakdown,
  evaluateOrderFromBreakdown,
  happinessBucketsFromPct,
  isOsiedleRevoltImmune,
  loadOrderParams,
  loadRevoltParams,
  luksusHappinessBonus,
  orderEffectsFromPorPct,
  osiedlePopMax,
  porPctBand,
  tierFromPorPct,
  updateRevoltGrace
});
