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

// tools/.praca-na-pieniadz-entry.ts
var praca_na_pieniadz_entry_exports = {};
__export(praca_na_pieniadz_entry_exports, {
  Nakladka: () => Nakladka,
  TerenBazowy: () => TerenBazowy,
  cityYieldPerTurn: () => cityYieldPerTurn,
  loadEconParams: () => loadEconParams
});
module.exports = __toCommonJS(praca_na_pieniadz_entry_exports);

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

// data/terrain-yields.json
var terrain_yields_default = {
  terrain_types: [
    {
      Teren: "\u0141\u0105ka",
      \u017Bywno\u015B\u0107: 3,
      Praca: 1,
      Handel: 1,
      Drewno: 1,
      Kamie\u0144: 0,
      Suma: 6,
      Uwagi: null
    },
    {
      Teren: "R\xF3wnina",
      \u017Bywno\u015B\u0107: 2,
      Praca: 2,
      Handel: 1,
      Drewno: 2,
      Kamie\u0144: 1,
      Suma: 8,
      Uwagi: null
    },
    {
      Teren: "Wzg\xF3rza",
      \u017Bywno\u015B\u0107: 1,
      Praca: 3,
      Handel: 0,
      Drewno: 2,
      Kamie\u0144: 2,
      Suma: 8,
      Uwagi: "Kamie\u0144/Ruda po zbudowaniu Kopalni; +obrona"
    },
    {
      Teren: "G\xF3ry",
      \u017Bywno\u015B\u0107: 0,
      Praca: 4,
      Handel: 0,
      Drewno: 2,
      Kamie\u0144: 5,
      Suma: 11,
      Uwagi: "Nieprzechodnie dla jednostek l\u0105dowych; Kamie\u0144/Ruda po Kopalni"
    },
    {
      Teren: "Wybrze\u017Ce",
      \u017Bywno\u015B\u0107: 3,
      Praca: 2,
      Handel: 2,
      Drewno: 0,
      Kamie\u0144: 0,
      Suma: 7,
      Uwagi: "Teren morski przy l\u0105dzie (osobny od rzeki); pod port"
    },
    {
      Teren: "Morze",
      \u017Bywno\u015B\u0107: 2,
      Praca: 0,
      Handel: 2,
      Drewno: 0,
      Kamie\u0144: 0,
      Suma: 4,
      Uwagi: "Otwarta woda; rybo\u0142\xF3wstwo"
    },
    {
      Teren: "Pustynia",
      \u017Bywno\u015B\u0107: 0,
      Praca: 0,
      Handel: 1,
      Drewno: 0,
      Kamie\u0144: 0,
      Suma: 1,
      Uwagi: null
    }
  ],
  terrain_modifiers: [
    {
      Modyfikator: "Rzeka",
      \u017Bywno\u015B\u0107: 3,
      Praca: 2,
      Handel: 2,
      Drewno: 0,
      Kamie\u0144: 0,
      Suma: 7,
      Uwagi: "Dodaje bonus do DOWOLNEGO pola z rzek\u0105 (Tw\xF3j opis); razem +7 \u2014 mocny, mo\u017Cna stonowa\u0107"
    },
    {
      Modyfikator: "Las (nak\u0142adka)",
      \u017Bywno\u015B\u0107: -1,
      Praca: 3,
      Handel: -1,
      Drewno: 3,
      Kamie\u0144: 0,
      Suma: 4,
      Uwagi: "Pod lasem zawsze jest teren bazowy; las: \u2212\u017Cywno\u015B\u0107, \u2212handel, +praca (+3), +drewno \u2014 bez wzgl\u0119du na \u{1F464}/jednostk\u0119"
    }
  ]
};

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
  const z = zloze?.trim().toLowerCase();
  for (const raw of improvementKeys) {
    const key = normalizeImprovementKey(raw);
    if (key === "kopalnia_miedzi") {
      ruda += ORE_YIELD_PER_MINE;
    } else if (key === "kopalnia") {
      if (z === "zelazo") ruda_zelaza += ORE_YIELD_PER_MINE;
      else ruda += ORE_YIELD_PER_MINE;
    }
  }
  return { ruda, ruda_zelaza };
}
function applyImprovementBonuses(yld, improvementKeys) {
  for (const key of improvementKeys) {
    applyImprovementBonus(yld, key);
  }
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
  ceramika: "Ceramika"
};
var ASCII_BY_LABEL = Object.fromEntries(
  Object.entries(LABEL_BY_ASCII).map(([ascii, label]) => [label, ascii])
);

// src/game/production.ts
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

// src/game/economy.ts
var KEY_PROG_WZROSTU = "pr\xF3g_wzrostu_wspolczynnik";
function loadEconParams(raw, difficulty) {
  const em = raw.ekonomia_miasta ?? {};
  const bu = raw.budynki ?? {};
  const gl = raw.globalne ?? {};
  const d = difficulty;
  const read = (group, key, fallback) => {
    const row = group[key];
    const v = row ? row[d] : void 0;
    return typeof v === "number" && Number.isFinite(v) ? v : fallback;
  };
  return {
    progWzrostuWspolczynnik: read(em, KEY_PROG_WZROSTU, 16),
    spichlerzZachowaniePoPrzroscie: read(em, "spichlerz_zachowanie_po_wzroscie", 0.5),
    akweduktProgLudnosci: read(em, "akwedukt_prog_ludnosci", 5),
    akweduktMaxLudnosci: read(em, "akwedukt_max_ludnosci", 15),
    zywnoscZuzytkaPopulacja: read(em, "zywnosc_zuzytka_populacja", 1),
    zdrowieModyfikatorWspolczynnik: read(em, "zdrowie_modyfikator_wspolczynnik", 0.05),
    korupcjaWspolczynnikDystansu: read(em, "korupcja_wspolczynnik_dystansu", 2),
    korupcjaWspolczynnikMiast: read(em, "korupcja_wspolczynnik_miast", 1),
    korupcjaCap: read(em, "korupcja_cap", 50) / 100,
    budynekMlynMnoznikPracy: read(bu, "budynek_mlyn_mnoznik_pracy", 2),
    budynekMlynBonusPracy: read(bu, "budynek_mlyn_bonus_pracy", 2),
    budynekCegielniBonusPracy: read(bu, "budynek_cegielnia_bonus_pracy", 0.25),
    budynekTargowiskoBonusHandlu: read(bu, "budynek_targowisko_bonus_handlu", 0.5),
    budynekBibliotekaBonusNauki: read(bu, "budynek_biblioteka_bonus_nauki", 0.5),
    budynekAkademiaBonusNauki: read(bu, "budynek_akademia_bonus_nauki", 0.1),
    budynekGarncarniaBonusZywnosci: read(bu, "budynek_garncarnia_bonus_zywnosci_lokalnie", 0.1),
    budynekMennicaMnoznik: read(bu, "budynek_mennica_mnoznik", 1),
    // NIEUZYWANE 2026-07-25
    mennicaMnoznikPoWalucie: read(gl, "mennica_mnoznik_po_walucie", 1.5),
    // JEDYNY mnoznik Efektu 1
    walutaMnoznik: read(bu, "waluta_mnoznik", 2),
    // NIEUZYWANE 2026-07-25
    targowiskoPracaMnoznik: read(bu, "targowisko_praca_na_pieniadz_mnoznik", 2),
    suwaakHandelNaukaDefault: read(em, "suwak_handel_nauka_domyslnie", 60),
    suwaakHandelPieniadz: read(em, "suwak_handel_pieniadz_domyslnie", 30),
    suwaakHandelLuksus: read(em, "suwak_handel_luksus_domyslnie", 10),
    suwaakPracaBudynki: read(em, "suwak_praca_budynki_domyslnie", 70),
    suwaakPracaTeren: read(em, "suwak_praca_teren_domyslnie", 30)
  };
}
var ZERO_YIELD = { zywnosc: 0, praca: 0, handel: 0, drewno: 0, kamien: 0, glina: 0, ruda: 0, ruda_zelaza: 0 };
var TERRAIN_NAME_TO_ENUM = {
  "\u0141\u0105ka": "laka" /* Laka */,
  "R\xF3wnina": "rownina" /* Rownina */,
  "Wzg\xF3rza": "wzgorza" /* Wzgorza */,
  "G\xF3ry": "gory" /* Gory */,
  "Wybrze\u017Ce": "wybrzeze" /* Wybrzeze */,
  "Morze": "morze" /* Morze */,
  "Pustynia": "pustynia" /* Pustynia */
};
function terrainRowToTileYield(row) {
  return {
    zywnosc: Number(row["\u017Bywno\u015B\u0107"] ?? 0),
    praca: Number(row["Praca"] ?? 0),
    handel: Number(row["Handel"] ?? 0),
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
  let handelBrutto;
  if (ctx.maTargowisko) {
    handelBrutto = handelTerenu * (1 + params.budynekTargowiskoBonusHandlu);
  } else {
    handelBrutto = handelTerenu;
  }
  const civHandelMult = ctx.civHandelMult ?? 1;
  if (civHandelMult !== 1) {
    handelBrutto *= civHandelMult;
  }
  const liczbaTrasHandlowych = ctx.liczbaAktywnychTrasHandlowych ?? 0;
  if (liczbaTrasHandlowych > 0) {
    handelBrutto *= 1 + 0.05 * liczbaTrasHandlowych;
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
  const strata = Math.min(ctx.strataFraction, params.korupcjaCap);
  const pracaNetto = pracaBruttoLacznie;
  const handelNettoRaw = handelBrutto * (1 - strata);
  const walutaOdkrytaOnly = ctx.walutaOdkryta === true;
  const walutaActive = walutaOdkrytaOnly && ctx.maMennica === true;
  const walutaMnoznikBase = ctx.walutaMnoznikOverride ?? params.mennicaMnoznikPoWalucie;
  const walutaMnoznikAktywny = walutaActive ? walutaMnoznikBase : 1;
  const handelNetto = handelNettoRaw * walutaMnoznikAktywny;
  const pctPracaBudynki = city.podzia\u0142Pracy.procentBudynki / 100;
  const pracaInt = cityPracaInteger(pracaNetto);
  const { doPuli } = splitPraca(pracaInt, pctPracaBudynki);
  const pieniadzZPracy = ctx.maTargowisko && walutaOdkrytaOnly ? Math.floor(doPuli * params.targowiskoPracaMnoznik) : 0;
  const handelNettoPula = handelNetto + pieniadzZPracy;
  const pctNauka = city.podzia\u0142Handlu.procentNauka / 100;
  const pctPieniadz = city.podzia\u0142Handlu.procentPieniadz / 100;
  const pctLuksus = city.podzia\u0142Handlu.procentLuksus / 100;
  const naukaZHandlu = Math.floor(handelNettoPula * pctNauka);
  const pieniadzZHandlu = Math.floor(handelNettoPula * pctPieniadz);
  const luksusZHandlu = Math.floor(handelNettoPula * pctLuksus);
  const naukaBonusFactor = 1 + (ctx.maBiblioteka ? params.budynekBibliotekaBonusNauki : 0) + (ctx.maAkademia ? params.budynekAkademiaBonusNauki : 0);
  const naukaLokalnaRaw = Math.floor((naukaZHandlu + naukaBudynkow) * naukaBonusFactor);
  const civNaukaMult = ctx.civNaukaMult ?? 1;
  const naukaLokalna = civNaukaMult !== 1 ? Math.floor(naukaLokalnaRaw * civNaukaMult) : naukaLokalnaRaw;
  let pieniadzTotal = pieniadzZHandlu + pieniadzBudynkow;
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
    drewnoTerenu: Math.floor(drewnoTerenu),
    kamienTerenu: Math.floor(kamienTerenu),
    glinaTerenu: Math.floor(glinaTerenu),
    rudaTerenu: Math.floor(rudaTerenu),
    rudaZelazaTerenu: Math.floor(rudaZelazaTerenu)
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Nakladka,
  TerenBazowy,
  cityYieldPerTurn,
  loadEconParams
});
