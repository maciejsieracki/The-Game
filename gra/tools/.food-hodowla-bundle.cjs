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

// tools/.food-hodowla-entry.ts
var food_hodowla_entry_exports = {};
__export(food_hodowla_entry_exports, {
  Nakladka: () => Nakladka,
  TerenBazowy: () => TerenBazowy,
  computeEmpireLivestockUnlocks: () => computeEmpireLivestockUnlocks,
  getResourceAccessForCity: () => getResourceAccessForCity,
  improvementBonusForKey: () => improvementBonusForKey,
  improvementKeysForHex: () => improvementKeysForHex,
  isLivestockAllowed: () => isLivestockAllowed,
  isLivestockUnlockedForPlacement: () => isLivestockUnlockedForPlacement,
  tileYield: () => tileYield
});
module.exports = __toCommonJS(food_hodowla_entry_exports);

// src/types/hex.ts
var TerenBazowy = /* @__PURE__ */ ((TerenBazowy2) => {
  TerenBazowy2["Laka"] = "laka";
  TerenBazowy2["Rownina"] = "rownina";
  TerenBazowy2["Wzgorza"] = "wzgorza";
  TerenBazowy2["Gory"] = "gory";
  TerenBazowy2["Wybrzeze"] = "wybrzeze";
  TerenBazowy2["Morze"] = "morze";
  TerenBazowy2["Pustynia"] = "pustynia";
  return TerenBazowy2;
})(TerenBazowy || {});
var Nakladka = /* @__PURE__ */ ((Nakladka2) => {
  Nakladka2["Brak"] = "brak";
  Nakladka2["Las"] = "las";
  Nakladka2["ZlozeGliny"] = "zloze_gliny";
  Nakladka2["ZlozeRudy"] = "zloze_rudy";
  Nakladka2["ZlozeKonia"] = "zloze_konia";
  Nakladka2["ZlozeOwiec"] = "zloze_owiec";
  Nakladka2["ZlozeBydla"] = "zloze_bydla";
  Nakladka2["ZlozeLamy"] = "zloze_lamy";
  return Nakladka2;
})(Nakladka || {});

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
}
function applyImprovementBonuses(yld, improvementKeys) {
  for (const key of improvementKeys) {
    applyImprovementBonus(yld, key);
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

// src/game/braz-access.ts
var PIEC_HUTNICZY_BUILDING_ID = "odlewnia_brazu";
var POPALNIA_BRAZU_KEY = "popalnia_brazu";
function improvementKeysOnPlaced(imp) {
  if (typeof imp === "string") {
    const k = normalizeImprovementKey(imp);
    return k ? [k] : [];
  }
  return imp.map((k) => normalizeImprovementKey(String(k))).filter((k) => !!k);
}
function empireHasPopalniaBrazu(placedImprovements) {
  if (!placedImprovements?.size) return false;
  for (const imp of placedImprovements.values()) {
    for (const key of improvementKeysOnPlaced(imp)) {
      if (key === POPALNIA_BRAZU_KEY) return true;
    }
  }
  return false;
}
function cityHasPiecHutniczy(builtIds) {
  return builtIds.includes(PIEC_HUTNICZY_BUILDING_ID) || builtIds.includes("odlewnia_zelaza");
}
function hasBrazAccess(placedImprovements, builtIds) {
  return empireHasPopalniaBrazu(placedImprovements) && cityHasPiecHutniczy(builtIds);
}

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
var RIVER_MODIFIER = { zywnosc: 3, praca: 2, handel: 2, drewno: 0, kamien: 0 };
var FOREST_MODIFIER = { zywnosc: -1, praca: 0, handel: -1, drewno: 3, kamien: 0 };
var ZERO_YIELD = { zywnosc: 0, praca: 0, handel: 0, drewno: 0, kamien: 0 };
function tileYield(tile) {
  const base = TERRAIN_YIELDS[tile.terenBazowy] ?? ZERO_YIELD;
  let zywnosc = base.zywnosc;
  let praca = base.praca;
  let handel = base.handel;
  let drewno = base.drewno;
  let kamien = base.kamien;
  if (tile.nakladka === "las" /* Las */) {
    zywnosc += FOREST_MODIFIER.zywnosc;
    handel += FOREST_MODIFIER.handel;
    drewno += FOREST_MODIFIER.drewno;
  }
  if (tile.maRzeke) {
    zywnosc += RIVER_MODIFIER.zywnosc;
    praca += RIVER_MODIFIER.praca;
    handel += RIVER_MODIFIER.handel;
  }
  const out = {
    zywnosc: Math.max(0, zywnosc),
    praca: Math.max(0, praca),
    handel: Math.max(0, handel),
    drewno: Math.max(0, drewno),
    kamien: Math.max(0, kamien)
  };
  const impKeys = tile.ulepszeniaKeys?.length ? tile.ulepszeniaKeys : tile.ulepszenieKey ? [tile.ulepszenieKey] : [];
  if (impKeys.length) {
    applyImprovementBonuses(out, impKeys);
    out.zywnosc = Math.max(0, out.zywnosc);
    out.praca = Math.max(0, out.praca);
    out.handel = Math.max(0, out.handel);
    out.drewno = Math.max(0, out.drewno);
    out.kamien = Math.max(0, out.kamien);
  }
  return out;
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
var FALLBACK_METAL_ERA = { miedz: 2, zelazo: 3 };
function mapGenMetalDepositMinEra() {
  const m = map_gen_params_default.metal_deposit_min_era;
  if (!m || typeof m !== "object") return { ...FALLBACK_METAL_ERA };
  return { ...FALLBACK_METAL_ERA, ...m };
}

// src/map/deposit-era.ts
var METAL_DEPOSIT_MIN_ERA = mapGenMetalDepositMinEra();
function zlozeMinEraFor(hex) {
  if (hex.zlozeMinEra != null) return hex.zlozeMinEra;
  const z = hex.zloze?.trim().toLowerCase();
  if (z && METAL_DEPOSIT_MIN_ERA[z] != null) return METAL_DEPOSIT_MIN_ERA[z];
  return 1;
}
function isDepositVisible(hex, currentEra) {
  if (!hex.zloze) return true;
  return currentEra >= zlozeMinEraFor(hex);
}

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

// src/game/culture-religion.ts
function finiteOr(v, fallback = 0) {
  return Number.isFinite(v) ? v : fallback;
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
  konwersjaBiblioteka: 0.5,
  konwersjaCapTura: 5
});
function cityBorderRadius(culturePoints, params = FALLBACK_CULTURE_PARAMS) {
  const c = finiteOr(culturePoints, 0);
  if (c >= params.progZasieg3) return 3;
  if (c >= params.progZasieg2) return 2;
  if (c >= params.progZasieg1) return 1;
  return 0;
}
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
function citySightRadius(population, kulturaSkumulowana = 0) {
  const base = cityRangeForPopulation(population);
  if (base <= 0) return 0;
  return base + cityBorderRadius(kulturaSkumulowana);
}

// src/game/resource-access.ts
function parseSurowiecOdblokowany(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  const t = raw.trim();
  if (t.startsWith("[")) {
    try {
      const parsed = JSON.parse(t);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
    }
  }
  return [raw];
}
var IMPROVEMENTS2 = terrain_improvements_default;
var NAKLADKA_LABEL = {
  ["zloze_gliny" /* ZlozeGliny */]: "Glina",
  ["zloze_rudy" /* ZlozeRudy */]: "Ruda",
  ["zloze_konia" /* ZlozeKonia */]: "Ko\u0144",
  ["zloze_owiec" /* ZlozeOwiec */]: "Owce",
  ["zloze_bydla" /* ZlozeBydla */]: "Byd\u0142o (krowa/w\xF3\u0142)",
  ["zloze_lamy" /* ZlozeLamy */]: "Lama"
};
var ZLOZE_LABEL = {
  wegiel: "W\u0119giel",
  sol: "S\xF3l",
  miedz: "Ruda miedzi",
  zelazo: "Ruda \u017Celaza",
  stal: "Stal"
};
var SUROWIEC_KEY_LABEL = {
  drewno: "Drewno",
  kamien: "Kamie\u0144",
  glina: "Glina",
  ruda: "Ruda",
  zelazo: "\u017Belazo",
  stal: "Stal",
  bydlo: "Byd\u0142o (krowa/w\xF3\u0142)",
  owce: "Owce",
  lama: "Lama",
  kon: "Ko\u0144",
  sol: "S\xF3l",
  braz: "Br\u0105z"
};
function labelForHex(hex, currentEra = 99) {
  const z = hex.zloze?.trim().toLowerCase();
  if (z) {
    if (!isDepositVisible(hex, currentEra)) return null;
    if (ZLOZE_LABEL[z]) return ZLOZE_LABEL[z];
    return z.charAt(0).toUpperCase() + z.slice(1);
  }
  const n = hex.nakladka;
  if (n && n !== "brak" /* Brak */ && n !== "las" /* Las */ && NAKLADKA_LABEL[n]) {
    return NAKLADKA_LABEL[n];
  }
  return null;
}
function labelsForImprovementUnlock(improvementKey) {
  if (!improvementKey) return [];
  const keys = parseSurowiecOdblokowany(IMPROVEMENTS2[improvementKey]?.surowiecOdblokowany);
  if (keys.length === 0) return [];
  return keys.map((k) => SUROWIEC_KEY_LABEL[k] ?? (k ? k.charAt(0).toUpperCase() + k.slice(1) : "")).filter(Boolean);
}
function improvementKeysOnPlacedHex(imp) {
  if (typeof imp === "string") {
    const k = normalizeImprovementKey(imp);
    return k ? [k] : [];
  }
  return imp.map((k) => normalizeImprovementKey(String(k))).filter((k) => !!k);
}
function sortLabels(labels) {
  return Array.from(labels).sort((a, b) => a.localeCompare(b, "pl"));
}
function hexesInCitySight(city, map) {
  const sight = citySightRadius(city.population, city.kulturaSkumulowana ?? 0);
  if (sight <= 0) return [];
  const out = [];
  for (const [hexKey, hex] of Object.entries(map.hexes)) {
    if (hexDistance(city.q, city.r, hex.coords.q, hex.coords.r) > sight) continue;
    out.push({ hexKey, hex });
  }
  return out;
}
function collectDepositPotential(city, map, currentEra) {
  const found = /* @__PURE__ */ new Set();
  for (const { hex } of hexesInCitySight(city, map)) {
    const label = labelForHex(hex, currentEra);
    if (label) found.add(label);
  }
  return found;
}
function collectActiveAccess(city, map, placedImprovements, options) {
  const sight = citySightRadius(city.population, city.kulturaSkumulowana ?? 0);
  const found = /* @__PURE__ */ new Set();
  if (placedImprovements && sight > 0) {
    for (const [hexKey, impKey] of placedImprovements) {
      const hex = map.hexes[hexKey];
      if (!hex) continue;
      if (hexDistance(city.q, city.r, hex.coords.q, hex.coords.r) > sight) continue;
      for (const key of improvementKeysOnPlacedHex(impKey)) {
        for (const label of labelsForImprovementUnlock(key)) {
          found.add(label);
        }
      }
    }
  }
  const livestockUnlocks = options.empireLivestockUnlocks ?? (placedImprovements ? computeEmpireLivestockUnlocks(placedImprovements, map, options.ownerId) : void 0);
  if (livestockUnlocks) {
    for (const lk of livestockUnlocks) {
      const label = SUROWIEC_KEY_LABEL[lk];
      if (label) found.add(label);
    }
  }
  if (options.builtIds && hasBrazAccess(placedImprovements, options.builtIds)) {
    found.add(SUROWIEC_KEY_LABEL.braz);
  }
  return found;
}
function getCityResourceAccessForCity(city, map, placedImprovements, currentEra = 99, options = {}) {
  const activeSet = collectActiveAccess(city, map, placedImprovements, options);
  const potentialRaw = collectDepositPotential(city, map, currentEra);
  const potentialSet = /* @__PURE__ */ new Set();
  for (const label of potentialRaw) {
    if (!activeSet.has(label)) potentialSet.add(label);
  }
  return {
    potential: sortLabels(potentialSet),
    active: sortLabels(activeSet)
  };
}
function getResourceAccessForCity(city, map, placedImprovements, currentEra = 99, options = {}) {
  return getCityResourceAccessForCity(
    city,
    map,
    placedImprovements,
    currentEra,
    options
  ).active;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Nakladka,
  TerenBazowy,
  computeEmpireLivestockUnlocks,
  getResourceAccessForCity,
  improvementBonusForKey,
  improvementKeysForHex,
  isLivestockAllowed,
  isLivestockUnlockedForPlacement,
  tileYield
});
