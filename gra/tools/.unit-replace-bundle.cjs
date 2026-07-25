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

// tools/.unit-replace-entry.ts
var unit_replace_entry_exports = {};
__export(unit_replace_entry_exports, {
  availableProduction: () => availableProduction,
  availableReplacementsFor: () => availableReplacementsFor,
  epochNumber: () => epochNumber
});
module.exports = __toCommonJS(unit_replace_entry_exports);

// src/game/building-cost-tempo.ts
var KOSZT_BUDYNKOW_PACE = {
  niski: 1,
  normalny: 2,
  wysoki: 4
};
function applyBuildingCostPace(bazowyKoszt, pace) {
  const mnoznik = typeof pace === "number" ? pace : KOSZT_BUDYNKOW_PACE[pace];
  return Math.max(1, Math.round(bazowyKoszt * mnoznik));
}

// src/game/unit-cost-tempo.ts
var KOSZT_JEDNOSTEK_PACE = {
  niski: 1,
  normalny: 2,
  wysoki: 4
};
function applyUnitCostPace(bazowyKoszt, pace) {
  const mnoznik = typeof pace === "number" ? pace : KOSZT_JEDNOSTEK_PACE[pace];
  return Math.max(1, Math.round(bazowyKoszt * mnoznik));
}

// src/game/difficulty-cost.ts
function isPlayerOwner(ownerId) {
  return ownerId === 0;
}
function getCostMultiplierForOwner(ownerId, difficulty) {
  if (difficulty === "normal") return 1;
  if (difficulty === "easy") return isPlayerOwner(ownerId) ? 1 : 2;
  return isPlayerOwner(ownerId) ? 2 : 1;
}
function applyDifficultyCostMultiplier(costAfterPace, ownerId, difficulty) {
  const mult = getCostMultiplierForOwner(ownerId, difficulty);
  return Math.max(1, Math.round(costAfterPace * mult));
}

// src/game/civ-bonuses.ts
function civBuildingCostDiscount(bonusy) {
  if (!bonusy?.length) return 0;
  let disc = 0;
  for (const b of bonusy) {
    if (b.realizuje !== "miasto") continue;
    if (b.typ !== "koszt_redukcja") continue;
    if (b.cel !== "budynki") continue;
    if (typeof b.wartosc === "number" && b.wartosc > 0) disc += b.wartosc;
  }
  return Math.min(disc, 0.75);
}
function buildingCostAfterCivDiscount(baseCost, bonusy) {
  const disc = civBuildingCostDiscount(bonusy);
  if (disc <= 0 || baseCost <= 0) return baseCost;
  return Math.max(1, Math.floor(baseCost * (1 - disc)));
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

// src/game/braz-access.ts
var PIEC_HUTNICZY_BUILDING_ID = "odlewnia_brazu";
var KOPALNIA_MIEDZI_KEY = "kopalnia_miedzi";
function improvementKeysOnPlaced(imp) {
  if (typeof imp === "string") {
    const k = normalizeImprovementKey(imp);
    return k ? [k] : [];
  }
  return imp.map((k) => normalizeImprovementKey(String(k))).filter((k) => !!k);
}
function empireHasKopalniaMiedzi(placedImprovements) {
  if (!placedImprovements?.size) return false;
  for (const imp of placedImprovements.values()) {
    for (const key of improvementKeysOnPlaced(imp)) {
      if (key === KOPALNIA_MIEDZI_KEY) return true;
    }
  }
  return false;
}
function cityHasPiecHutniczy(builtIds) {
  return builtIds.includes(PIEC_HUTNICZY_BUILDING_ID) || builtIds.includes("odlewnia_zelaza");
}
function hasBrazAccess(placedImprovements, builtIds) {
  return empireHasKopalniaMiedzi(placedImprovements) && cityHasPiecHutniczy(builtIds);
}

// src/game/zelazo-access.ts
var ODLEWNIA_ZELAZA_BUILDING_ID = "odlewnia_zelaza";
function cityHasOdlewniaZelaza(builtIds) {
  return builtIds.includes(ODLEWNIA_ZELAZA_BUILDING_ID);
}
function hasZelazoAccess(hasKopalniaNaZlozuZelaza, builtIds) {
  return !!hasKopalniaNaZlozuZelaza && cityHasOdlewniaZelaza(builtIds);
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
var DEPOSIT_LINKED_BUILDING_LABELS = {
  garncarnia: ["Glina"],
  cegielnia: ["Glina"],
  spichlerz: ["Ceramika"],
  spichlerz_ii: ["S\xF3l"],
  stolarnia: ["Drewno"],
  kamieniarski: ["Kamie\u0144"],
  kuznia: ["Ruda"]
};
var CITY_BUILDING_PREREQ = {
  warsztat_oblezniczy: ["koszary", "akademia_wojskowa"],
  laznia_publiczna: "studnia"
};
function cityBuildingPrereqMet(prereq, builtList, buildings, isSuperseded) {
  if (!prereq) return true;
  const ids = typeof prereq === "string" ? [prereq] : prereq;
  return ids.some((id) => builtList.includes(id) || isSuperseded(id, builtList, buildings));
}
var WATER_ACCESS_BUILDING_IDS = /* @__PURE__ */ new Set(["port", "port_wielki"]);
var ASCII_BY_LABEL = Object.fromEntries(
  Object.entries(LABEL_BY_ASCII).map(([ascii, label]) => [label, ascii])
);
function empireLabelSatisfied(label, activeLabels, empireBuiltIds, empireStock) {
  if (activeLabels.includes(label)) return true;
  if (label === "Ceg\u0142a" && empireBuiltIds?.includes("cegielnia")) return true;
  if (label === "Ceramika" && empireBuiltIds?.includes("garncarnia")) return true;
  const asciiKey = ASCII_BY_LABEL[label];
  if (asciiKey && empireStock && (empireStock[asciiKey] ?? 0) > 0) return true;
  return false;
}
function buildingRequiredActiveLabels(building) {
  const out = /* @__PURE__ */ new Set();
  const hard = DEPOSIT_LINKED_BUILDING_LABELS[building.id];
  if (hard) hard.forEach((l) => out.add(l));
  const key = building.wymaganySurowiec?.trim().toLowerCase();
  if (key && LABEL_BY_ASCII[key]) out.add(LABEL_BY_ASCII[key]);
  return [...out];
}
function buildingResourceGateMet(building, activeLabels, empireBuiltIds, empireStock) {
  const required = buildingRequiredActiveLabels(building);
  if (required.length === 0) return true;
  const active = activeLabels ?? [];
  return required.every((label) => empireLabelSatisfied(label, active, empireBuiltIds, empireStock));
}

// src/game/building-upgrades.ts
var SUPPRESSED_FROM_PRODUCTION = /* @__PURE__ */ new Set(["teatr"]);
function isBuildingSuppressedFromProduction(building) {
  return SUPPRESSED_FROM_PRODUCTION.has(building.id) || building.suppressed === true;
}
function upgradeProductionDisplayName(target, buildings) {
  const from = (target.upgradeFrom ?? "").trim();
  if (!from) return target.nazwa;
  const prev = buildings.find((b) => b.id === from);
  return `Rozbuduj ${prev?.nazwa ?? from} \u2192 ${target.nazwa}`;
}

// src/game/production.ts
var EPOCH_BY_NAME = {
  Kamien: 1,
  "Kamie\u0144": 1,
  // matches data key (U+0144)
  Braz: 2,
  "Br\u0105z": 2,
  // matches data key (U+0105)
  Zelazo: 3,
  "\u017Belazo": 3
  // matches data key (U+017B)
};
function epochNumber(epoka) {
  if (epoka == null) return 1;
  const n = EPOCH_BY_NAME[epoka];
  return typeof n === "number" ? n : 1;
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
function unitCostFromDef(def) {
  const raw = def["Pieni\u0105dz (koszt)"];
  if (typeof raw === "number" && Number.isFinite(raw)) {
    if (raw > 0) return raw;
    if (raw === 0 && def["Super-jednostka"] === "TAK") return 0;
  }
  const rola = def["Rola (linia)"];
  if (rola != null) {
    const byRole = DEFAULT_COST_BY_ROLE[rola];
    if (typeof byRole === "number") return byRole;
  }
  return DEFAULT_UNIT_COST;
}
function findBuilding(data, id) {
  return data.buildings.find((b) => b.id === id);
}
function findUnit(data, id) {
  return data.units.find((u) => u.Jednostka === id);
}
function itemCost(kind, id, data, cityLevelOrEpoch) {
  if (kind === "budynek") {
    const b = findBuilding(data, id);
    if (!b) return 0;
    const level = Number.isFinite(cityLevelOrEpoch) ? Math.max(1, Math.floor(cityLevelOrEpoch)) : 1;
    const przyrostKosztu = Number.isFinite(b.przyrostKosztu) ? b.przyrostKosztu : 0;
    return Math.round(b.kosztBudowy + przyrostKosztu * (level - 1));
  }
  const u = findUnit(data, id);
  if (!u) return 0;
  return unitCostFromDef(u);
}
function buildingLocationAllowed(lokalizacja, isCapital) {
  if (lokalizacja === "stolica") return isCapital === true;
  if (lokalizacja === "region") return isCapital === false;
  return true;
}
var GLOBAL_BUILDING_PROD_MULT = 0.5;
function buildingWorkCost(baseCost, civBonusy, pace, ownerId = 0, difficulty = "normal") {
  const afterCiv = buildingCostAfterCivDiscount(baseCost, civBonusy);
  const afterPace = pace ? applyBuildingCostPace(afterCiv, pace) : afterCiv;
  const afterGlobal = Math.max(1, Math.round(afterPace * GLOBAL_BUILDING_PROD_MULT));
  return applyDifficultyCostMultiplier(afterGlobal, ownerId, difficulty);
}
function unitMoneyCost(baseCost, civBonusy, pace, ownerId = 0, difficulty = "normal") {
  let koszt = baseCost;
  const recDisc = civRecruitmentDiscount(civBonusy);
  if (recDisc > 0) {
    koszt = Math.max(1, Math.floor(koszt * (1 - recDisc)));
  }
  const afterPace = pace ? applyUnitCostPace(koszt, pace) : koszt;
  return applyDifficultyCostMultiplier(afterPace, ownerId, difficulty);
}
function civRecruitmentDiscount(bonusy) {
  if (!bonusy?.length) return 0;
  for (const b of bonusy) {
    if (b.realizuje !== "ekonomia") continue;
    const opis = (b.opis ?? "").toLowerCase();
    if (opis.includes("rekrutacji") && typeof b.wartosc === "number" && b.wartosc > 0) {
      return b.wartosc;
    }
  }
  return 0;
}
function stripDiacritics(s) {
  return s.normalize("NFD").replace(/[\u0300-\u036F]/g, "").toLowerCase();
}
function unitAllowedForCivNation(unitNacja, civUnitNacja) {
  const n = unitNacja.trim();
  if (!n) return true;
  const c = (civUnitNacja ?? "").trim();
  if (!c) return false;
  return stripDiacritics(n) === stripDiacritics(c);
}
function buildingTypeCommitted(buildingId, builtIds, queue) {
  for (const id of builtIds) if (id === buildingId) return true;
  for (const it of queue) {
    if (it.kind === "budynek" && it.id === buildingId) return true;
  }
  return false;
}
function isBuildingSupersededByUpgrade(buildingId, builtIds, buildings) {
  for (const b of buildings) {
    if (b.upgradeFrom === buildingId && builtIds.includes(b.id)) return true;
  }
  return false;
}
function isBlankReplacement(zamiast) {
  return zamiast.length === 0 || zamiast === "-" || zamiast === "\u2014";
}
function civSpecialUnitNameTokens(bonusy) {
  if (!bonusy?.length) return [];
  const tokens = [];
  for (const b of bonusy) {
    if (b.typ !== "jednostka_specjalna") continue;
    const rawValues = Array.isArray(b.wartosc) ? b.wartosc.map((v) => String(v ?? "")) : [String(b.wartosc ?? "")];
    for (const rawValue of rawValues) {
      const raw = rawValue.trim();
      if (!raw) continue;
      for (const part of raw.split("/")) {
        const trimmed = part.trim();
        if (!trimmed) continue;
        tokens.push(trimmed);
        const primary = trimmed.split("(")[0]?.trim();
        if (primary && primary !== trimmed) tokens.push(primary);
      }
    }
  }
  return tokens;
}
function unitMatchesSpecialName(unitName, tokens) {
  if (!tokens.length) return false;
  const un = stripDiacritics(unitName);
  for (const token of tokens) {
    const tn = stripDiacritics(token);
    if (!tn) continue;
    if (un === tn || un.startsWith(tn) || tn.startsWith(un) || un.includes(tn) || tn.includes(un)) {
      return true;
    }
  }
  return false;
}
function availableProduction(city, data, unlockedTechs, ctx = {}) {
  const epoch = Number.isFinite(ctx.epoch) ? ctx.epoch : 1;
  const level = Number.isFinite(ctx.buildingLevel) ? ctx.buildingLevel : 1;
  const builtList = ctx.builtBuildingIds ?? [];
  const queue = ctx.productionQueue ?? [];
  const techs = new Set(unlockedTechs);
  const specTokens = civSpecialUnitNameTokens(ctx.civBonusy);
  const ownerId = ctx.ownerId ?? 0;
  const difficulty = ctx.difficulty ?? "normal";
  const items = [];
  for (const b of data.buildings) {
    if (b.epokaWejscia > epoch) continue;
    if (isBuildingSuppressedFromProduction(b)) continue;
    const upgradeFrom = (b.upgradeFrom ?? "").trim();
    if (upgradeFrom.length > 0) {
      if (!builtList.includes(upgradeFrom)) continue;
      if (buildingTypeCommitted(b.id, builtList, queue)) continue;
    } else {
      if (isBuildingSupersededByUpgrade(b.id, builtList, data.buildings)) continue;
      if (buildingTypeCommitted(b.id, builtList, queue)) continue;
    }
    const tech = (b.techUnlock ?? "").trim();
    if (tech.length > 0 && tech !== "-" && tech !== "\u2014" && !techs.has(tech)) continue;
    if (!buildingLocationAllowed(b.lokalizacja, ctx.isCapital)) continue;
    if (b.id === PIEC_HUTNICZY_BUILDING_ID && !empireHasKopalniaMiedzi(ctx.placedImprovements)) {
      continue;
    }
    const gateLabels = ctx.empireActiveResourceLabels?.length ? ctx.empireActiveResourceLabels : ctx.activeResourceLabels;
    if (!buildingResourceGateMet(b, gateLabels, ctx.empireBuiltIds, ctx.empireResourceStock)) {
      continue;
    }
    if (!cityBuildingPrereqMet(CITY_BUILDING_PREREQ[b.id], builtList, data.buildings, isBuildingSupersededByUpgrade)) {
      continue;
    }
    if (WATER_ACCESS_BUILDING_IDS.has(b.id) && !ctx.cityHasCoastOrRiver) {
      continue;
    }
    items.push({
      kind: "budynek",
      id: b.id,
      nazwa: upgradeProductionDisplayName(b, data.buildings),
      koszt: buildingWorkCost(
        itemCost("budynek", b.id, data, level),
        ctx.civBonusy,
        ctx.buildingCostPace,
        ownerId,
        difficulty
      )
    });
  }
  const built = new Set(builtList);
  for (const u of data.units) {
    if (epochNumber(u.Epoka) > epoch) continue;
    const nacja = (u.Nacja ?? "").toString().trim();
    if (!unitAllowedForCivNation(nacja, ctx.civUnitNacja)) continue;
    const zamiast = (u["W zamian za"] ?? "").toString().trim();
    const isReplacement = !isBlankReplacement(zamiast);
    if (isReplacement) {
      if (!unitMatchesSpecialName(u.Jednostka, specTokens)) continue;
    } else if (specTokens.length > 0) {
      const replacedBySpec = data.units.some((su) => {
        const sz = (su["W zamian za"] ?? "").toString().trim();
        if (isBlankReplacement(sz) || sz !== u.Jednostka) return false;
        return unitMatchesSpecialName(su.Jednostka, specTokens);
      });
      if (replacedBySpec) continue;
    }
    const tech = (u.Tech ?? "").toString().trim();
    if (tech.length > 0 && tech !== "-" && tech !== "\u2014" && !techs.has(tech)) continue;
    if (epochNumber(u.Epoka) === 2 && !built.has("koszary") && !isBuildingSupersededByUpgrade("koszary", builtList, data.buildings)) continue;
    const surowiec = stripDiacritics((u.Surowiec ?? "").toString().trim());
    if (surowiec === "braz" && !hasBrazAccess(ctx.placedImprovements, builtList)) {
      continue;
    }
    if (surowiec === "zelazo" && !hasZelazoAccess(ctx.hasKopalniaNaZlozuZelaza, builtList)) {
      continue;
    }
    if (u["Super-jednostka"] === "TAK" && ctx.aliveUnitTypeNames?.has(u.Jednostka)) continue;
    const koszt = unitMoneyCost(
      itemCost("jednostka", u.Jednostka, data, 1),
      ctx.civBonusy,
      ctx.kosztJednostekPace,
      ownerId,
      difficulty
    );
    items.push({
      kind: "jednostka",
      id: u.Jednostka,
      nazwa: u.Jednostka,
      koszt
    });
  }
  items.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "budynek" ? -1 : 1;
    if (a.koszt !== b.koszt) return a.koszt - b.koszt;
    return a.nazwa.localeCompare(b.nazwa);
  });
  return items;
}
function availableReplacementsFor(currentUnitName, data, unlockedTechs, ctx = {}) {
  const current = findUnit(data, currentUnitName);
  if (!current) return [];
  const currentTyp = (current.Typ ?? "").toString().trim();
  const epoch = Number.isFinite(ctx.epoch) ? ctx.epoch : 1;
  const builtList = ctx.builtBuildingIds ?? [];
  const built = new Set(builtList);
  const techs = new Set(unlockedTechs);
  const specTokens = civSpecialUnitNameTokens(ctx.civBonusy);
  const ownerId = ctx.ownerId ?? 0;
  const difficulty = ctx.difficulty ?? "normal";
  function passesAvailabilityGates(u) {
    if (epochNumber(u.Epoka) > epoch) return false;
    const nacja = (u.Nacja ?? "").toString().trim();
    if (!unitAllowedForCivNation(nacja, ctx.civUnitNacja)) return false;
    const tech = (u.Tech ?? "").toString().trim();
    if (tech.length > 0 && tech !== "-" && tech !== "\u2014" && !techs.has(tech)) return false;
    if (epochNumber(u.Epoka) === 2 && !built.has("koszary") && !isBuildingSupersededByUpgrade("koszary", builtList, data.buildings)) return false;
    const surowiec = stripDiacritics((u.Surowiec ?? "").toString().trim());
    if (surowiec === "braz" && !hasBrazAccess(ctx.placedImprovements, builtList)) return false;
    if (surowiec === "zelazo" && !hasZelazoAccess(ctx.hasKopalniaNaZlozuZelaza, builtList)) return false;
    if (u["Super-jednostka"] === "TAK" && ctx.aliveUnitTypeNames?.has(u.Jednostka)) return false;
    return true;
  }
  function costOf(u) {
    return unitMoneyCost(
      itemCost("jednostka", u.Jednostka, data, 1),
      ctx.civBonusy,
      ctx.kosztJednostekPace,
      ownerId,
      difficulty
    );
  }
  const items = [];
  const seen = /* @__PURE__ */ new Set();
  for (const u of data.units) {
    if (u.Jednostka === currentUnitName) continue;
    const utyp = (u.Typ ?? "").toString().trim();
    if (!utyp || utyp !== currentTyp) continue;
    if (!passesAvailabilityGates(u)) continue;
    const zamiast = (u["W zamian za"] ?? "").toString().trim();
    if (!isBlankReplacement(zamiast) && !unitMatchesSpecialName(u.Jednostka, specTokens)) continue;
    items.push({ kind: "jednostka", id: u.Jednostka, nazwa: u.Jednostka, koszt: costOf(u) });
    seen.add(u.Jednostka);
  }
  const specialName = (current["Zast\u0105p specjalnie"] ?? "").toString().trim();
  if (specialName && !isBlankReplacement(specialName)) {
    for (const rawName of specialName.split("/")) {
      const name = rawName.trim();
      if (!name || name === currentUnitName || seen.has(name)) continue;
      const specialUnit = findUnit(data, name);
      if (!specialUnit) continue;
      if (!passesAvailabilityGates(specialUnit)) continue;
      items.push({
        kind: "jednostka",
        id: specialUnit.Jednostka,
        nazwa: specialUnit.Jednostka,
        koszt: costOf(specialUnit)
      });
      seen.add(specialUnit.Jednostka);
    }
  }
  items.sort((a, b) => {
    if (a.koszt !== b.koszt) return a.koszt - b.koszt;
    return a.nazwa.localeCompare(b.nazwa);
  });
  return items;
}
var UNIT_POPULATION_COST = miasto_params_default.jednostka_koszt_ludnosci?.wartosc ?? 1;
var DEFAULT_OUTPUT_SHARES = Object.freeze({
  produkcja: miasto_params_default.udzial_output_produkcja?.wartosc ?? 0.4,
  pieniadz: miasto_params_default.udzial_output_pieniadz?.wartosc ?? 0.3,
  nauka: miasto_params_default.udzial_output_nauka?.wartosc ?? 0.2,
  rozwoj: miasto_params_default.udzial_output_rozwoj?.wartosc ?? 0.1
});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  availableProduction,
  availableReplacementsFor,
  epochNumber
});
