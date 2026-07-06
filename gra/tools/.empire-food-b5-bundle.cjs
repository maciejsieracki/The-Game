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

// tools/.empire-food-b5-entry.ts
var empire_food_b5_entry_exports = {};
__export(empire_food_b5_entry_exports, {
  advanceCityEconomy: () => advanceCityEconomy,
  advanceEmpireFood: () => advanceEmpireFood,
  applyArmyStarvationHpLoss: () => applyArmyStarvationHpLoss,
  bindEmpireFoodRuntime: () => bindEmpireFoodRuntime,
  buildEmpireFoodParams: () => buildEmpireFoodParams,
  freshEmpireFoodState: () => freshEmpireFoodState,
  getEmpireFoodMaxCap: () => getEmpireFoodMaxCap,
  getEmpireFoodSplit: () => getEmpireFoodSplit,
  isArmyStarving: () => isArmyStarving
});
module.exports = __toCommonJS(empire_food_b5_entry_exports);

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
var MAX_EPOKA = 10;
var DEFAULT_REGEN = {
  regenProcMaxPerTurn: 10,
  blockWhenBesieged: true
};
function loadManpowerRegenParams(raw = miasto_params_default) {
  const pct = raw.manpower_regen_proc_max_tura?.wartosc;
  const block = raw.manpower_regen_blok_oblezenie?.wartosc;
  return {
    regenProcMaxPerTurn: typeof pct === "number" && pct >= 0 ? pct : DEFAULT_REGEN.regenProcMaxPerTurn,
    blockWhenBesieged: block === void 0 ? true : block !== 0
  };
}
function civManpowerRegenMult(bonusy) {
  let mult = 1;
  if (!bonusy?.length) return mult;
  for (const b of bonusy) {
    if (b.typ === "bonus_pobor_regen" && typeof b.wartosc === "number") {
      mult *= 1 + b.wartosc;
    } else if (b.typ === "mnoznik_pobor_regen" && typeof b.wartosc === "number") {
      mult *= b.wartosc;
    }
  }
  return Math.max(0.1, mult);
}
function manpowerRegenGain(ludki, epoka, params = DEFAULT_REGEN, regenMult = 1) {
  const max = cityManpowerMax(ludki, epoka);
  if (max <= 0 || params.regenProcMaxPerTurn <= 0) return 0;
  const pct = Math.min(100, params.regenProcMaxPerTurn) / 100;
  return Math.floor(max * pct * Math.max(0, regenMult));
}
function tickManpowerRegen(city, epoka, params = DEFAULT_REGEN, regenMult = 1) {
  const max = cityManpowerMax(city.population, epoka);
  const cur = cityManpowerCurrent(city, epoka);
  if (cur >= max) return max;
  if (params.blockWhenBesieged && city.oblegane) return cur;
  const gain = manpowerRegenGain(city.population, epoka, params, regenMult);
  if (gain <= 0) return cur;
  return Math.min(max, cur + gain);
}
function epokaManpowerRow(epoka) {
  const e = Math.max(1, Math.min(MAX_EPOKA, Math.floor(epoka) || 1));
  return ROWS.find((r) => r.epoka === e) ?? ROWS[0];
}
function clampLudki(population) {
  return Math.max(1, Math.floor(population) || 1);
}
function cityManpowerMax(ludki, epoka) {
  const row = epokaManpowerRow(epoka);
  return clampLudki(ludki) * row.manpowerNaLudka;
}
function cityManpowerCurrent(city, epoka) {
  const max = cityManpowerMax(city.population, epoka);
  if (city.manpower === void 0 || !Number.isFinite(city.manpower)) return max;
  return Math.max(0, Math.min(max, Math.floor(city.manpower)));
}
function refreshManpowerAfterPopChange(city, epoka, previousPop) {
  const max = cityManpowerMax(city.population, epoka);
  const cur = cityManpowerCurrent(city, epoka);
  if (previousPop !== void 0 && previousPop !== city.population) {
    const oldMax = cityManpowerMax(previousPop, epoka);
    if (city.population > previousPop) {
      return Math.min(max, cur + (max - oldMax));
    }
    return Math.min(cur, max);
  }
  return max;
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

// src/game/production.ts
var BUILDING_LEVEL_FACTOR = miasto_params_default.budynek_mnoznik_poziomu?.wartosc ?? 1.1;
function buildingEffectAtLevel(baza, level) {
  const n = Math.max(1, Math.floor(level));
  return baza * Math.pow(BUILDING_LEVEL_FACTOR, n - 1);
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
function splitPraca(cityPraca, udzialBudynki) {
  const praca = Number.isFinite(cityPraca) && cityPraca > 0 ? cityPraca : 0;
  const u = Math.min(1, Math.max(0, Number.isFinite(udzialBudynki) ? udzialBudynki : 1));
  const doBudynkow = praca * u;
  return { doBudynkow, doPuli: praca - doBudynkow };
}
var DEFAULT_OUTPUT_SHARES = Object.freeze({
  produkcja: miasto_params_default.udzial_output_produkcja?.wartosc ?? 0.4,
  pieniadz: miasto_params_default.udzial_output_pieniadz?.wartosc ?? 0.3,
  nauka: miasto_params_default.udzial_output_nauka?.wartosc ?? 0.2,
  rozwoj: miasto_params_default.udzial_output_rozwoj?.wartosc ?? 0.1
});

// src/game/economy-upkeep.ts
function readNum(group, key, difficulty, fallback) {
  const row = group ? group[key] : void 0;
  const v = row ? row[difficulty] : void 0;
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}
var DEFAULT_STORAGE_PARAMS = {
  bazaZywnosc: 20,
  bazaSurowce: 10,
  mnoznikMagazynu: 5
};
function loadStorageParams(raw, difficulty = "normal") {
  const g = raw.globalne;
  return {
    bazaZywnosc: readNum(g, "magazyn_baza_zywnosc", difficulty, DEFAULT_STORAGE_PARAMS.bazaZywnosc),
    bazaSurowce: readNum(g, "magazyn_baza_surowce", difficulty, DEFAULT_STORAGE_PARAMS.bazaSurowce),
    mnoznikMagazynu: readNum(g, "magazyn_mnoznik_spichlerz", difficulty, DEFAULT_STORAGE_PARAMS.mnoznikMagazynu)
  };
}
function foodStorageCapacity(maSpichlerz, p) {
  return maSpichlerz ? p.bazaZywnosc * p.mnoznikMagazynu : p.bazaZywnosc;
}
function resourceStorageCapacityPerType(maMagazyn, p) {
  return maMagazyn ? p.bazaSurowce * p.mnoznikMagazynu : p.bazaSurowce;
}
function loadUpkeepParams(raw, difficulty = "normal") {
  const em = raw.ekonomia_miasta;
  const bu = raw.budynki;
  const g = raw.globalne;
  return {
    budynekUtrzymanieFlat: readNum(bu, "utrzymanie_budynek", difficulty, 1),
    jednostkaUtrzymanieStd: readNum(g, "utrzymanie_jednostka_standard", difficulty, 1),
    zywnoscJednostkaRuch: readNum(em, "zywnosc_jednostka_ruch", difficulty, 1),
    zywnoscJednostkaOboz: readNum(em, "zywnosc_jednostka_oboz", difficulty, 0.5)
  };
}
function buildingUpkeep(building, level, flatOverride) {
  if (typeof flatOverride === "number" && Number.isFinite(flatOverride)) {
    return flatOverride;
  }
  const lvl = level >= 1 ? level : 1;
  const base = Number.isFinite(building.utrzymanie) ? building.utrzymanie : 0;
  return Math.floor(buildingEffectAtLevel(base, lvl));
}
function totalBuildingUpkeep(buildings, flatOverride) {
  let sum = 0;
  for (const b of buildings) {
    sum += buildingUpkeep(b.record, b.level, flatOverride);
  }
  return sum;
}
var DEFAULT_UNIT_UPKEEP_BY_CATEGORY = {
  osadnik: 1,
  robotnik: 1,
  zwiadowca: 1,
  procarz: 1,
  oszczepnik: 1,
  lucznik: 1,
  wlocznik: 2,
  miecznik: 2,
  falanga: 2,
  legionista: 2,
  maczuga: 2,
  topor: 2,
  konnica: 3,
  rydwan: 3,
  galera: 3,
  super: 0,
  domyslny: 1
};
function unitUpkeep(unit, table, standardUpkeep) {
  const byType = table[unit.typeId];
  if (typeof byType === "number" && Number.isFinite(byType)) return byType;
  const byCat = DEFAULT_UNIT_UPKEEP_BY_CATEGORY[unit.category];
  if (typeof byCat === "number" && Number.isFinite(byCat)) return byCat;
  return Number.isFinite(standardUpkeep) ? standardUpkeep : 0;
}
function totalUnitUpkeep(units, table, standardUpkeep) {
  let sum = 0;
  for (const u of units) {
    sum += unitUpkeep(u, table, standardUpkeep);
  }
  return sum;
}
function buildUnitUpkeepTable(rows) {
  const out = {};
  for (const row of rows) {
    const name = row["Jednostka"];
    if (typeof name !== "string" || name.length === 0) continue;
    let upkeep;
    const direct = row["Utrzymanie (Pieniadz/ture)"];
    if (typeof direct === "number" && Number.isFinite(direct)) {
      upkeep = direct;
    } else {
      for (const key of Object.keys(row)) {
        if (key.indexOf("Utrzymanie") === 0) {
          const v = row[key];
          if (typeof v === "number" && Number.isFinite(v)) {
            upkeep = v;
            break;
          }
        }
      }
    }
    if (upkeep !== void 0) out[name] = upkeep;
  }
  return out;
}
function militaryFoodConsumption(units, p) {
  let sum = 0;
  for (const u of units) {
    sum += u.camping ? p.zywnoscJednostkaOboz : p.zywnoscJednostkaRuch;
  }
  return sum;
}
function upkeepBalance(income, buildings, units, unitUpkeepTbl, p) {
  const utrzymanieBudynki = totalBuildingUpkeep(buildings, p.budynekUtrzymanieFlat);
  const utrzymanieJednostki = totalUnitUpkeep(units, unitUpkeepTbl, p.jednostkaUtrzymanieStd);
  const utrzymanieRazem = utrzymanieBudynki + utrzymanieJednostki;
  const inc = Number.isFinite(income) ? income : 0;
  const saldo = inc - utrzymanieRazem;
  return {
    utrzymanieBudynki,
    utrzymanieJednostki,
    utrzymanieRazem,
    saldo,
    deficyt: saldo < 0
  };
}

// src/game/empire-food.ts
function pick(row, d, fallback) {
  if (!row) return fallback;
  const v = row[d];
  return Number.isFinite(v) ? v : fallback;
}
function buildEmpireFoodParams(raw, difficulty = "normal") {
  return {
    procentRozwojDefault: pick(raw.suwak_zywnosc_rozwoj_domyslnie, difficulty, 100),
    glodWojskaHpFrac: pick(raw.glod_wojska_hp_frac, difficulty, 0.08),
    spichlerzPojemnoscZapasowPanstwa: pick(raw.spichlerz_pojemnosc_zapasow_panstwa, difficulty, 100)
  };
}
function freshEmpireFoodState(procentRozwojDefault = 100) {
  return { zapasyPanstwa: 0, procentRozwoj: procentRozwojDefault };
}
function advanceEmpireFood(econ, units, states, upkeep, params) {
  const bruttoByOwner = /* @__PURE__ */ new Map();
  const spichlerzCountByOwner = /* @__PURE__ */ new Map();
  for (const tick of econ.perCity) {
    if (tick.maSpichlerz) {
      spichlerzCountByOwner.set(
        tick.ownerId,
        (spichlerzCountByOwner.get(tick.ownerId) ?? 0) + 1
      );
    }
    if (tick.oblegany) continue;
    const z = Math.max(0, tick.zywnoscNetto);
    bruttoByOwner.set(tick.ownerId, (bruttoByOwner.get(tick.ownerId) ?? 0) + z);
  }
  const perOwner = [];
  const byOwner = /* @__PURE__ */ new Map();
  const ownerIds = /* @__PURE__ */ new Set([
    ...bruttoByOwner.keys(),
    ...states.keys(),
    ...units.map((u) => u.ownerId)
  ]);
  for (const ownerId of ownerIds) {
    const st = states.get(ownerId) ?? freshEmpireFoodState(params.procentRozwojDefault);
    if (!states.has(ownerId)) states.set(ownerId, st);
    const pctRozwoj = Math.min(100, Math.max(0, st.procentRozwoj));
    const brutto = bruttoByOwner.get(ownerId) ?? 0;
    const doRozwoju = brutto * (pctRozwoj / 100);
    const doPanstwa = brutto - doRozwoju;
    const ownerUnits = units.filter((u) => u.ownerId === ownerId);
    const kosztArmii = militaryFoodConsumption(ownerUnits, upkeep);
    const zapasyPrzed = st.zapasyPanstwa;
    const spichlerzCount = spichlerzCountByOwner.get(ownerId) ?? 0;
    const canStoreArmyFood = spichlerzCount > 0;
    const maxZapasy = spichlerzCount * params.spichlerzPojemnoscZapasowPanstwa;
    let zapasyPo;
    if (canStoreArmyFood) {
      zapasyPo = zapasyPrzed + doPanstwa - kosztArmii;
      if (zapasyPo > maxZapasy) zapasyPo = maxZapasy;
    } else {
      zapasyPo = doPanstwa - kosztArmii;
      if (zapasyPo > 0) zapasyPo = 0;
    }
    st.zapasyPanstwa = zapasyPo;
    _maxCapByOwner.set(ownerId, maxZapasy);
    const tick = {
      ownerId,
      zywnoscBrutto: brutto,
      doRozwoju,
      doPanstwa,
      kosztArmii,
      zapasyPrzed,
      zapasyPo,
      glodWojska: zapasyPo < 0
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
function getEmpireFoodMaxCap(ownerId) {
  return _maxCapByOwner.get(ownerId) ?? 0;
}
function getEmpireFoodSplit(ownerId) {
  return _statesRef.get(ownerId)?.procentRozwoj ?? 100;
}
function isArmyStarving(ownerId) {
  const t = _lastTicks.get(ownerId);
  return t?.glodWojska ?? false;
}
function _setLastEmpireFoodTicks(ticks) {
  _lastTicks = ticks;
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

// src/game/wealth.ts
var FALLBACK_WEALTH_PARAMS = {
  capNaEpoke: 10,
  progNaPoziom: 4.5,
  mnoznikNaPoziom: 0.15,
  utrzymanieBaza: 0.2,
  utrzymaniePrzyCap: 0.4,
  zachowaniePoAwansie: 0.5,
  zadowolenieNa10pkt: 1,
  karaZero: 0,
  immunitetTur: 5
};
function loadWealthParams(raw, difficulty = "normal") {
  const g = raw.wealth ?? {};
  const read = (key, fallback) => {
    const row = g[key];
    const v = row ? row[difficulty] : void 0;
    return typeof v === "number" && Number.isFinite(v) ? v : fallback;
  };
  return {
    capNaEpoke: read("wealth_cap_na_epoke", FALLBACK_WEALTH_PARAMS.capNaEpoke),
    progNaPoziom: read("wealth_prog_na_poziom", FALLBACK_WEALTH_PARAMS.progNaPoziom),
    mnoznikNaPoziom: read("wealth_mnoznik_na_poziom", FALLBACK_WEALTH_PARAMS.mnoznikNaPoziom),
    utrzymanieBaza: read("wealth_utrzymanie_baza", FALLBACK_WEALTH_PARAMS.utrzymanieBaza),
    utrzymaniePrzyCap: read("wealth_utrzymanie_przy_cap", FALLBACK_WEALTH_PARAMS.utrzymaniePrzyCap),
    zachowaniePoAwansie: read("wealth_zachowanie_po_awansie", FALLBACK_WEALTH_PARAMS.zachowaniePoAwansie),
    zadowolenieNa10pkt: read("wealth_zadowolenie_na_10pkt", FALLBACK_WEALTH_PARAMS.zadowolenieNa10pkt),
    karaZero: read("wealth_kara_zero", FALLBACK_WEALTH_PARAMS.karaZero),
    immunitetTur: read("wealth_immunitet_tur", FALLBACK_WEALTH_PARAMS.immunitetTur)
  };
}
function wealthCap(epoka, p) {
  return Math.max(0, Math.floor(epoka)) * p.capNaEpoke;
}
function wealthMnoznik(poziom, p) {
  return Math.max(1, 1 + (poziom - 1) * p.mnoznikNaPoziom);
}
function wealthZadowolenie(poziom, p) {
  if (poziom <= 0) return p.karaZero;
  return Math.floor(poziom / 10) * p.zadowolenieNa10pkt;
}
function wealthRownowaga(poziom, epoka, p) {
  const cap = wealthCap(epoka, p);
  if (cap <= 0) return p.utrzymaniePrzyCap;
  const frac = Math.min(1, Math.max(0, poziom / cap));
  return p.utrzymanieBaza + frac * (p.utrzymaniePrzyCap - p.utrzymanieBaza);
}
function wealthProg(poziom, epoka, p) {
  return p.progNaPoziom * (poziom + 1) * Math.max(1, Math.floor(epoka));
}
function advanceWealth(state, spoleczMoney, miastoMoney, epoka, p, opts) {
  const cap = wealthCap(epoka, p);
  let poziom = Math.min(cap, Math.max(0, Math.floor(state.poziom)));
  let pula = Math.max(0, Number.isFinite(state.pula) ? state.pula : 0);
  const minPoz = Math.max(0, Math.floor(opts?.minPoziom ?? 0));
  const spol = Number.isFinite(spoleczMoney) ? Math.max(0, spoleczMoney) : 0;
  const M = Number.isFinite(miastoMoney) ? Math.max(0, miastoMoney) : 0;
  const decay = wealthRownowaga(poziom, epoka, p) * M;
  pula += spol - decay;
  let spadek = 0;
  if (pula < 0) {
    pula = 0;
    if (poziom > minPoz) {
      poziom -= 1;
      spadek = 1;
    }
  }
  let awans = 0;
  while (poziom < cap) {
    const prog = wealthProg(poziom, epoka, p);
    if (pula >= prog) {
      pula -= prog;
      poziom += 1;
      pula = Math.floor(pula * p.zachowaniePoAwansie);
      awans += 1;
    } else {
      break;
    }
  }
  return {
    poziom,
    pula,
    mnoznik: wealthMnoznik(poziom, p),
    zadowolenie: wealthZadowolenie(poziom, p),
    awans,
    spadek
  };
}
function freshWealthState() {
  return { poziom: 1, pula: 0 };
}

// src/game/cities.ts
var DEFAULT_OKOLICA_FOCUS = "zrownowazone";
var DEFAULT_OKOLICA_TRYB = "auto";
var HANDEL_PCT_STEP = 10;
function snapHandelPct(n) {
  return Math.max(0, Math.min(100, Math.round(n / HANDEL_PCT_STEP) * HANDEL_PCT_STEP));
}
function normalizePodzialHandlu(split) {
  let p = snapHandelPct(split.procentPieniadz);
  let n = snapHandelPct(split.procentNauka);
  let l = snapHandelPct(split.procentLuksus);
  let sum = p + n + l;
  if (sum !== 100) {
    l = Math.max(0, Math.min(100, l + (100 - sum)));
    sum = p + n + l;
    if (sum !== 100) {
      n = Math.max(0, Math.min(100, n + (100 - sum)));
    }
  }
  return { procentPieniadz: p, procentNauka: n, procentLuksus: l };
}
var MIN_CITY_DISTANCE = miasto_params_default.min_dystans_miast?.wartosc ?? 5;

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
function buildingValue(b, level, key) {
  return Math.floor(buildingEffectAtLevel(b.baza[key], level));
}
function mnoznikHandelPieniadzForCiv(civKey, civs, fallback = 2) {
  if (!civKey || !civs?.cywilizacje?.length) return fallback;
  const key = civKey.toLowerCase();
  for (const row of civs.cywilizacje) {
    if (!row) continue;
    const ids = [row.ikonaId, row.typCywilizacji, row.Cywilizacja].filter((s) => typeof s === "string" && s.length > 0).map((s) => s.toLowerCase());
    if (!ids.includes(key)) continue;
    const v = row.mnoznikHandelPieniadz;
    if (typeof v === "number" && Number.isFinite(v) && v > 0) return v;
    return fallback;
  }
  return fallback;
}
function civBonusyForCivKey(civKey, civs) {
  if (!civKey || !civs?.cywilizacje?.length) return [];
  const key = civKey.toLowerCase();
  for (const row of civs.cywilizacje) {
    if (!row) continue;
    const ids = [row.ikonaId, row.typCywilizacji, row.Cywilizacja].filter((s) => typeof s === "string" && s.length > 0).map((s) => s.toLowerCase());
    if (ids.includes(key)) return row.bonusy ?? [];
  }
  return [];
}
function civEconomyYieldMultipliers(bonusy) {
  let handel = 1;
  let nauka = 1;
  if (!bonusy?.length) return { handel, nauka };
  for (const b of bonusy) {
    if (b.realizuje !== "ekonomia") continue;
    if (b.typ === "bonus_zloto" && b.cel === "handel" && typeof b.wartosc === "number") {
      handel += b.wartosc;
    }
    if (b.typ === "bonus_nauka" && typeof b.wartosc === "number") {
      nauka += b.wartosc;
    }
  }
  return { handel, nauka };
}
function cityYieldPerTurn(city, workedTiles, cityBuildings, params, ctx) {
  let zywnoscTerenu = 0;
  let pracaTerenu = 0;
  let handelTerenu = 0;
  for (const tile of workedTiles) {
    const y = tileYield(tile);
    zywnoscTerenu += y.zywnosc;
    pracaTerenu += y.praca;
    handelTerenu += y.handel;
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
    zadBudynkow += buildingValue(record, level, "zadowolenie");
  }
  let totalMnoznikProc = 0;
  for (const { record, level } of cityBuildings) {
    const kat = record.kategoria;
    if (!kat.includes("Wojsko") && !kat.includes("Obrona")) {
      totalMnoznikProc += buildingValue(record, level, "mnoznik");
    }
  }
  const mnoznikFactor = 1 + totalMnoznikProc / 100;
  const pracaBruttoLacznie = (pracaBruttoTerenu + pracaBudynkow) * mnoznikFactor;
  const strata = Math.min(ctx.strataFraction, params.korupcjaCap);
  const pracaNetto = pracaBruttoLacznie * (1 - strata);
  const handelNettoRaw = handelBrutto * (1 - strata);
  const walutaActive = ctx.walutaOdkryta === true;
  const walutaMnoznikBase = ctx.walutaMnoznikOverride ?? params.walutaMnoznik;
  const walutaMnoznikAktywny = walutaActive ? walutaMnoznikBase : 1;
  const handelNetto = handelNettoRaw * walutaMnoznikAktywny;
  const pctNauka = city.podzia\u0142Handlu.procentNauka / 100;
  const pctPieniadz = city.podzia\u0142Handlu.procentPieniadz / 100;
  const pctLuksus = city.podzia\u0142Handlu.procentLuksus / 100;
  const naukaZHandlu = Math.floor(handelNetto * pctNauka);
  const pieniadzZHandlu = Math.floor(
    handelNetto * pctPieniadz * ctx.mennicaMnoznik
  );
  const luksusZHandlu = Math.floor(handelNetto * pctLuksus);
  const naukaBonusFactor = ctx.maBiblioteka ? 1 + params.budynekBibliotekaBonusNauki : 1;
  const naukaLokalnaRaw = Math.floor((naukaZHandlu + naukaBudynkow) * naukaBonusFactor);
  const civNaukaMult = ctx.civNaukaMult ?? 1;
  const naukaLokalna = civNaukaMult !== 1 ? Math.floor(naukaLokalnaRaw * civNaukaMult) : naukaLokalnaRaw;
  const pctPracaBudynki = city.podzia\u0142Pracy.procentBudynki / 100;
  const doPuli = Math.floor(Math.floor(pracaNetto) * (1 - pctPracaBudynki));
  const pieniadzZPracy = ctx.maTargowisko && walutaActive ? Math.floor(doPuli * params.targowiskoPracaMnoznik) : 0;
  let pieniadzTotal = pieniadzZHandlu + pieniadzBudynkow + pieniadzZPracy;
  for (const spec of city.specjalisci) {
    if (spec === "poborca") {
      pieniadzTotal += 2;
    }
  }
  const zywnoscBrutto = zywnoscTerenu + zywnoscBudynkow;
  const zywnoscZuzyta = city.ludnosc * params.zywnoscZuzytkaPopulacja + ctx.wojskoZuzycieZywnosci;
  const zywnoscNetto = zywnoscBrutto - zywnoscZuzyta;
  return {
    praca: Math.floor(pracaNetto),
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
    pieniadzZPracy
  };
}
function populationGrowth(city, zywnoscNetto, params) {
  const { ludnosc, zdrowie, maSpichlerz, maAkwedukt, magazynZywnosci } = city;
  const healthModifier = Math.max(0, 1 + zdrowie * params.zdrowieModyfikatorWspolczynnik);
  const effectiveFlow = zywnoscNetto * healthModifier;
  const popCap = maAkwedukt ? Number.MAX_SAFE_INTEGER : params.akweduktProgLudnosci;
  let nowaLudnosc = ludnosc;
  let nowyMagazynZywnosci = magazynZywnosci;
  let wzrost = false;
  let ubytek = false;
  nowyMagazynZywnosci = magazynZywnosci + Math.floor(effectiveFlow);
  if (nowyMagazynZywnosci < 0) {
    nowyMagazynZywnosci = 0;
    if (ludnosc > 1) {
      nowaLudnosc = ludnosc - 1;
      ubytek = true;
    }
    return { nowaLudnosc, nowyMagazynZywnosci, wzrost, ubytek };
  }
  const threshold = 10 + ludnosc * params.progWzrostuWspolczynnik;
  if (nowyMagazynZywnosci >= threshold && ludnosc < popCap) {
    nowaLudnosc = ludnosc + 1;
    wzrost = true;
    nowyMagazynZywnosci = maSpichlerz ? Math.floor(nowyMagazynZywnosci * params.spichlerzZachowaniePoPrzroscie) : 0;
  }
  return { nowaLudnosc, nowyMagazynZywnosci, wzrost, ubytek };
}

// src/game/converters.ts
function loadThroughput(raw, paramKey, difficulty, fallback) {
  const bu = raw.budynki ?? {};
  const row = bu[paramKey];
  const v = row ? row[difficulty] : void 0;
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}
var DEFAULT_CONVERTER_RECIPES = [
  { id: "tartak", inputs: { drewno: 1 }, output: "deski", outputAmount: 1, throughputParamKey: "budynek_tartak_przepustowosc", throughputFallback: 2 },
  { id: "mielerz", inputs: { drewno: 1 }, output: "paliwo", outputAmount: 1, throughputParamKey: "budynek_mielerz_przepustowosc", throughputFallback: 2 },
  { id: "cegielnia", inputs: { glina: 1, paliwo: 1 }, output: "cegla", outputAmount: 1, throughputParamKey: "budynek_cegielnia_przepustowosc", throughputFallback: 2 },
  { id: "huta", inputs: { ruda: 1, paliwo: 1 }, output: "braz", outputAmount: 1, throughputParamKey: "budynek_huta_przepustowosc", throughputFallback: 1 },
  { id: "odlewnia_brazu", inputs: { ruda: 1, paliwo: 1 }, output: "braz", outputAmount: 1, throughputParamKey: "budynek_huta_przepustowosc", throughputFallback: 1 },
  { id: "garncarnia", inputs: { glina: 1, paliwo: 1 }, output: "ceramika", outputAmount: 1, throughputParamKey: "budynek_garncarnia_przepustowosc", throughputFallback: 1 }
];
function runConverter(recipe, stores, throughput, outputCapacity) {
  const have = (k) => {
    const v = stores[k];
    return typeof v === "number" && Number.isFinite(v) ? v : 0;
  };
  const tput = Number.isFinite(throughput) && throughput > 0 ? Math.floor(throughput) : 0;
  let limitWejscia = Infinity;
  for (const k of Object.keys(recipe.inputs)) {
    const perCykl = recipe.inputs[k];
    if (perCykl === void 0 || perCykl <= 0) continue;
    limitWejscia = Math.min(limitWejscia, Math.floor(have(k) / perCykl));
  }
  if (!Number.isFinite(limitWejscia)) limitWejscia = 0;
  const wolne = Math.max(0, outputCapacity - have(recipe.output));
  const limitWyjscia = recipe.outputAmount > 0 ? Math.floor(wolne / recipe.outputAmount) : 0;
  const cykle = Math.max(0, Math.min(tput, limitWejscia, limitWyjscia));
  const nowe = { ...stores };
  const consumed = {};
  if (cykle > 0) {
    for (const k of Object.keys(recipe.inputs)) {
      const used = (recipe.inputs[k] ?? 0) * cykle;
      nowe[k] = have(k) - used;
      consumed[k] = used;
    }
    nowe[recipe.output] = have(recipe.output) + recipe.outputAmount * cykle;
  }
  let reason = "ok";
  if (cykle === 0) {
    if (tput === 0) reason = "zero-przepustowosci";
    else if (limitWejscia === 0) reason = "brak-wejscia";
    else if (limitWyjscia === 0) reason = "pelny-magazyn";
    else reason = "brak-wejscia";
  }
  return { produced: cykle * recipe.outputAmount, cykle, consumed, stores: nowe, reason };
}
function runConverters(recipes, stores, throughputs, capacityOf) {
  let cur = { ...stores };
  const perBuilding = {};
  for (const recipe of recipes) {
    const tput = Object.prototype.hasOwnProperty.call(throughputs, recipe.id) ? throughputs[recipe.id] ?? recipe.throughputFallback : recipe.throughputFallback;
    const res = runConverter(recipe, cur, tput, capacityOf(recipe.output));
    cur = res.stores;
    perBuilding[recipe.id] = res;
  }
  return { stores: cur, perBuilding };
}

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

// src/game/okolica.ts
var OKOLICA_RADIUS = miasto_params_default.zasieg_okolicy_miasta?.wartosc ?? 5;
var CITY_RANGE_MIN = miasto_params_default.zasieg_okolicy_baza?.wartosc ?? 5;
var CITY_RANGE_CAP = miasto_params_default.zasieg_okolicy_max?.wartosc ?? 15;
function cityRangeForPopulation(population) {
  const pop = Number.isFinite(population) ? Math.floor(population) : 0;
  if (pop <= 0) return 0;
  return Math.min(Math.max(CITY_RANGE_MIN, pop), CITY_RANGE_CAP);
}
function okolicaTiles(centerQ, centerR, radius, map, isWorkable) {
  const out = [];
  const rad = Number.isFinite(radius) && radius > 0 ? Math.floor(radius) : 1;
  for (const key of Object.keys(map.hexes)) {
    const parts = key.split(",");
    const q = Number(parts[0]);
    const rr = Number(parts[1]);
    if (!Number.isFinite(q) || !Number.isFinite(rr)) continue;
    if (q === centerQ && rr === centerR) continue;
    const d = hexDistance(centerQ, centerR, q, rr);
    if (d > rad) continue;
    if (isWorkable && !isWorkable(q, rr)) continue;
    out.push({ q, r: rr, key, dist: d });
  }
  return out;
}
function tileScore(y, wagi) {
  const wz = wagi?.zywnosc ?? 1;
  const wp = wagi?.praca ?? 1;
  const wh = wagi?.handel ?? 1;
  return (y.zywnosc ?? 0) * wz + (y.praca ?? 0) * wp + (y.handel ?? 0) * wh;
}
function assignWorkedTiles(centerQ, centerR, population, map, yieldOf, opts = {}) {
  const radius = opts.radius ?? cityRangeForPopulation(population);
  const tiles = okolicaTiles(centerQ, centerR, radius, map, opts.isWorkable);
  const scored = tiles.map((t) => ({ t, s: tileScore(yieldOf(t.q, t.r), opts.wagi) }));
  scored.sort((a, b) => {
    if (b.s !== a.s) return b.s - a.s;
    if (a.t.dist !== b.t.dist) return a.t.dist - b.t.dist;
    return a.t.key.localeCompare(b.t.key);
  });
  const n = Math.max(0, Math.min(Math.floor(Number.isFinite(population) ? population : 0), scored.length));
  return scored.slice(0, n).map((x) => x.t);
}
function wagiForFocus(focus = DEFAULT_OKOLICA_FOCUS) {
  switch (focus) {
    case "zywnosc":
      return { zywnosc: 3, praca: 0.5, handel: 0.5 };
    case "produkcja":
      return { zywnosc: 0.5, praca: 3, handel: 0.5 };
    case "podatki":
      return { zywnosc: 0.5, praca: 0.5, handel: 3 };
    case "zrownowazone":
    default:
      return { zywnosc: 1, praca: 1, handel: 1 };
  }
}
function resolveWorkedTiles(city, map, yieldOf, opts = {}) {
  const pop = Math.max(0, Math.floor(city.population ?? 0));
  const radius = opts.radius ?? cityRangeForPopulation(pop);
  const tryb = opts.tryb ?? city.okolicaTryb ?? DEFAULT_OKOLICA_TRYB;
  const focus = opts.focus ?? city.okolicaFocus ?? DEFAULT_OKOLICA_FOCUS;
  const isWorkable = opts.isWorkable;
  if (tryb === "reczny") {
    const reczne = opts.reczne ?? city.okolicaReczne ?? {};
    const tiles = okolicaTiles(city.q, city.r, radius, map, isWorkable);
    const tileMap = new Map(tiles.map((t) => [t.key, t]));
    const out = [];
    for (const [key, count] of Object.entries(reczne)) {
      if (!count || count <= 0) continue;
      const t = tileMap.get(key);
      if (t) out.push(t);
    }
    if (out.length > pop) return out.slice(0, pop);
    return out;
  }
  return assignWorkedTiles(city.q, city.r, pop, map, yieldOf, {
    radius,
    isWorkable,
    wagi: wagiForFocus(focus)
  });
}

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

// src/game/society-breakdown.ts
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

// src/game/turn-economy.ts
function applyOrderYieldMults(yld, mults) {
  if (mults.productionMult !== 1) yld.praca *= mults.productionMult;
  if (mults.pieniadzMult !== 1) yld.pieniadz *= mults.pieniadzMult;
  if (mults.naukaMult !== 1) yld.nauka *= mults.naukaMult;
  if (mults.kulturaMult !== 1) yld.kultura *= mults.kulturaMult;
}
function buildEconParams(data, difficulty = "normal") {
  const raw = data.econParams;
  const em = raw.ekonomia_miasta ?? {};
  const bu = raw.budynki ?? {};
  const d = difficulty;
  const num = (group, key, fallback) => {
    const row = group[key];
    const v = row ? row[d] : void 0;
    return typeof v === "number" && Number.isFinite(v) ? v : fallback;
  };
  return {
    progWzrostuWspolczynnik: num(em, "pr\xF3g_wzrostu_wspolczynnik", 8),
    spichlerzZachowaniePoPrzroscie: num(em, "spichlerz_zachowanie_po_wzroscie", 0.5),
    akweduktProgLudnosci: num(em, "akwedukt_prog_ludnosci", 6),
    zywnoscZuzytkaPopulacja: num(em, "zywnosc_zuzytka_populacja", 1),
    zdrowieModyfikatorWspolczynnik: num(em, "zdrowie_modyfikator_wspolczynnik", 0.05),
    korupcjaWspolczynnikDystansu: num(em, "korupcja_wspolczynnik_dystansu", 2),
    korupcjaWspolczynnikMiast: num(em, "korupcja_wspolczynnik_miast", 1),
    korupcjaCap: num(em, "korupcja_cap", 50) / 100,
    budynekMlynMnoznikPracy: num(bu, "budynek_mlyn_mnoznik_pracy", 2),
    budynekMlynBonusPracy: num(bu, "budynek_mlyn_bonus_pracy", 2),
    budynekCegielniBonusPracy: num(bu, "budynek_cegielnia_bonus_pracy", 0.25),
    budynekTargowiskoBonusHandlu: num(bu, "budynek_targowisko_bonus_handlu", 0.5),
    budynekBibliotekaBonusNauki: num(bu, "budynek_biblioteka_bonus_nauki", 0.5),
    budynekMennicaMnoznik: num(bu, "budynek_mennica_mnoznik", 1),
    walutaMnoznik: num(bu, "waluta_mnoznik", 2),
    targowiskoPracaMnoznik: num(bu, "targowisko_praca_na_pieniadz_mnoznik", 2),
    suwaakHandelNaukaDefault: num(em, "suwak_handel_nauka_domyslnie", 60),
    suwaakHandelPieniadz: num(em, "suwak_handel_pieniadz_domyslnie", 30),
    suwaakHandelLuksus: num(em, "suwak_handel_luksus_domyslnie", 10),
    suwaakPracaBudynki: num(em, "suwak_praca_budynki_domyslnie", 70),
    suwaakPracaTeren: num(em, "suwak_praca_teren_domyslnie", 30)
  };
}
function loadHealthParams(raw, difficulty) {
  const sp = raw;
  const zd = sp && typeof sp === "object" && sp["zdrowie"] ? sp["zdrowie"] : {};
  const rd = (key, fallback) => {
    const row = zd[key];
    if (!row || typeof row !== "object") return fallback;
    const v = row[difficulty];
    return typeof v === "number" && Number.isFinite(v) ? v : fallback;
  };
  const progZagoszczenia = rd("zdrowie_prog_zag\u0119szczenia", 4);
  const legacyMaleMiasto = rd("zdrowie_male_miasto_bonus", 1);
  return {
    rzeka: rd("zdrowie_rzeka", 2),
    akwedukt: rd("zdrowie_akwedukt", 4),
    studnia: rd("zdrowie_studnia", 2),
    targowisko: rd("zdrowie_targowisko", 2),
    ceramika: rd("zdrowie_ceramika", 1),
    osiedlePopBonus: (pop) => {
      const legacy = pop <= progZagoszczenia ? legacyMaleMiasto : 0;
      return pickOsiedlePopBonus(zd, "zdrowie_bonus_osiedle_pop", pop, difficulty, legacy);
    },
    karaZagoszczenie: rd("zdrowie_kara_zag\u0119szczenie", -1),
    progZagoszczenia,
    karaBagno: rd("zdrowie_kara_bagno", -1),
    karaDzungla: rd("zdrowie_kara_dzungla", -1),
    karaBrakWody: rd("zdrowie_kara_brak_wody", -2)
  };
}
function cityHasWaterAccess(city, map) {
  const riverHexSet = /* @__PURE__ */ new Set();
  for (const path of map.riverPaths ?? []) {
    for (const h of path) riverHexSet.add(`${h.q},${h.r}`);
  }
  function hexHasRiver(q, r) {
    const hex = map.hexes[`${q},${r}`];
    if (hex?.rzeka?.obecna) return true;
    if (riverHexSet.has(`${q},${r}`)) return true;
    for (const [dq, dr] of HEX_NEIGHBORS) {
      if (riverHexSet.has(`${q + dq},${r + dr}`)) return true;
    }
    return false;
  }
  return hexHasRiver(city.q, city.r);
}
function computeCityHealth(ludnosc, tiles, builtIds, hp, hasWaterAccess) {
  let z = 0;
  let maRzeke = hasWaterAccess === true;
  if (hasWaterAccess === void 0) {
    for (const t of tiles) {
      if (t.maRzeke) {
        maRzeke = true;
        break;
      }
    }
  }
  const maStudnie = builtIds.includes("studnia");
  const maTargowisko = builtIds.includes("targowisko");
  const maAkwedukt = builtIds.includes("akwedukt");
  const maCeramike = builtIds.includes("ceramika");
  if (maRzeke) z += hp.rzeka;
  if (maAkwedukt) z += hp.akwedukt;
  if (maStudnie) z += hp.studnia;
  if (maTargowisko) z += hp.targowisko;
  if (maCeramike) z += hp.ceramika;
  const osiedleV = hp.osiedlePopBonus(ludnosc);
  if (osiedleV) z += osiedleV;
  if (ludnosc > hp.progZagoszczenia) {
    z += hp.karaZagoszczenie * (ludnosc - hp.progZagoszczenia);
  }
  if (!maRzeke && !maStudnie && !maAkwedukt) z += hp.karaBrakWody;
  return Math.round(z);
}
var HEX_NEIGHBORS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, -1],
  [-1, 1]
];
function hexToWorkedTile(hex) {
  const ulepszeniaKeys = improvementKeysForHex(hex);
  return {
    terenBazowy: hex.terenBazowy,
    nakladka: hex.nakladka ?? "brak" /* Brak */,
    maRzeke: !!(hex.rzeka && hex.rzeka.obecna),
    ulepszenieKey: ulepszeniaKeys[0],
    ulepszeniaKeys: ulepszeniaKeys.length ? ulepszeniaKeys : void 0
  };
}
function cityWorkedTilesForEconomy(city, map) {
  const tiles = [];
  const centreHex = map.hexes[`${city.q},${city.r}`];
  if (centreHex) tiles.push(hexToWorkedTile(centreHex));
  const pop = Math.max(0, Math.floor(city.population ?? 0));
  if (pop <= 0) return tiles;
  const radius = cityRangeForPopulation(pop);
  const yieldOf = (q, r) => {
    const h = map.hexes[`${q},${r}`];
    if (!h) return {};
    const wt = hexToWorkedTile(h);
    const y = tileYield(wt);
    return {
      zywnosc: y.zywnosc,
      praca: y.praca,
      handel: y.handel
    };
  };
  const assigned = resolveWorkedTiles(city, map, yieldOf, { radius });
  for (const t of assigned) {
    const h = map.hexes[t.key];
    if (h) tiles.push(hexToWorkedTile(h));
  }
  return tiles;
}
function toEconomyCity(city, params, isCapital, zdrowie = 0, buildings = {}) {
  return {
    id: city.id,
    ludnosc: city.population,
    zdrowie,
    czyStolica: isCapital,
    maSpichlerz: buildings.maSpichlerz ?? false,
    maAkwedukt: buildings.maAkwedukt ?? false,
    magazynZywnosci: city.magazynZywnosci ?? 0,
    specjalisci: [],
    kolejkaProdukcji: [],
    podzia\u0142Handlu: normalizePodzialHandlu(city.podzialHandlu ?? {
      procentNauka: params.suwaakHandelNaukaDefault,
      procentPieniadz: params.suwaakHandelPieniadz,
      procentLuksus: params.suwaakHandelLuksus
    }),
    podzia\u0142Pracy: city.podzialPracy ?? {
      procentBudynki: params.suwaakPracaBudynki
    }
  };
}
function getCityFood(city) {
  return city.magazynZywnosci ?? 0;
}
function advanceCityEconomy(cities, map, data, difficulty = "normal", econUnits = [], growthMultByCity = /* @__PURE__ */ new Map(), builtByCity = /* @__PURE__ */ new Map(), playerEra = 1, playerZbadane = /* @__PURE__ */ new Set(), ownerCivByOwnerId = /* @__PURE__ */ new Map(), orderMultByCity = /* @__PURE__ */ new Map()) {
  const params = buildEconParams(data, difficulty);
  const noBuildings = [];
  const rawEconParams = data.econParams;
  const upkeepParams = loadUpkeepParams(rawEconParams, difficulty);
  const storageParams = loadStorageParams(rawEconParams, difficulty);
  const unitUpkeepTbl = buildUnitUpkeepTable(data.units);
  const rawForConverters = data.econParams;
  const converterThroughputs = {};
  for (const recipe of DEFAULT_CONVERTER_RECIPES) {
    converterThroughputs[recipe.id] = loadThroughput(
      rawForConverters,
      recipe.throughputParamKey,
      difficulty,
      recipe.throughputFallback
    );
  }
  const healthParams = loadHealthParams(
    data.societyParams,
    difficulty
  );
  const wealthParams = loadWealthParams(
    data.econParams,
    difficulty
  );
  const capitalSeen = /* @__PURE__ */ new Set();
  const result = {
    perCity: [],
    cities: 0,
    totalPraca: 0,
    totalPieniadz: 0,
    totalNauka: 0,
    totalLuksus: 0,
    totalKultura: 0,
    totalZywnosc: 0,
    totalPracaPula: 0,
    growth: 0,
    starved: 0,
    upkeepByOwner: /* @__PURE__ */ new Map()
  };
  const incomeByOwner = /* @__PURE__ */ new Map();
  for (const city of cities) {
    const isCapital = !capitalSeen.has(city.ownerId);
    capitalSeen.add(city.ownerId);
    const worked = cityWorkedTilesForEconomy(city, map);
    const builtIds = builtByCity.get(city.id) ?? [];
    const hasWater = cityHasWaterAccess(city, map);
    const zdrowie = computeCityHealth(city.population, worked, builtIds, healthParams, hasWater);
    const maSpichlerz = builtIds.includes("spichlerz");
    const maAkwedukt = builtIds.includes("akwedukt");
    const econCity = toEconomyCity(city, params, isCapital, zdrowie, { maSpichlerz, maAkwedukt });
    const walutaOdkryta = playerZbadane.has("Waluta") || playerZbadane.has("waluta");
    const ownerCivKey = ownerCivByOwnerId.get(city.ownerId);
    const walutaMnoznikOverride = walutaOdkryta && ownerCivKey ? mnoznikHandelPieniadzForCiv(ownerCivKey, data.civs, params.walutaMnoznik) : void 0;
    const ownerBonusy = ownerCivKey ? civBonusyForCivKey(ownerCivKey, data.civs) : [];
    const { handel: civHandelMult, nauka: civNaukaMult } = civEconomyYieldMultipliers(ownerBonusy);
    const ctx = {
      wojskoZuzycieZywnosci: 0,
      // B5: wojsko → zapasy państwa (advanceEmpireFood)
      strataFraction: 0,
      // no distance-corruption tracking yet
      maMlyn: builtIds.includes("mlyn"),
      maCegielnia: builtIds.includes("cegielnia"),
      maTargowisko: builtIds.includes("targowisko"),
      maBiblioteka: builtIds.includes("biblioteka"),
      maMennica: builtIds.includes("mennica"),
      mennicaMnoznik: 1,
      walutaOdkryta,
      // P1b: mnoznik Handel->Pieniadz gdy Waluta zbadana
      walutaMnoznikOverride,
      // RDY-11: per-cyw 1.7-2.4 gdy ownerCivByOwnerId podane
      civHandelMult,
      // RDY-01: bonus_zloto handel (Grecy +15%)
      civNaukaMult
      // RDY-01: bonus_nauka (Inkowie +15%)
    };
    const yld = cityYieldPerTurn(econCity, worked, noBuildings, params, ctx);
    const orderMult = orderMultByCity.get(city.id);
    if (orderMult) applyOrderYieldMults(yld, orderMult);
    const prevWealth = city.wealthState ?? freshWealthState();
    const wealthImmunity = (city.wealthImmunityRemaining ?? 0) > 0;
    const wt = advanceWealth(
      prevWealth,
      yld.luksus,
      // spoleczMoney = strumien Luksus
      yld.pieniadz,
      // miastoMoney  = pieniadz brutto tej tury
      playerEra,
      wealthParams,
      wealthImmunity ? { minPoziom: 1 } : void 0
    );
    if (wealthImmunity && city.wealthImmunityRemaining != null) {
      city.wealthImmunityRemaining = Math.max(0, city.wealthImmunityRemaining - 1);
    }
    city.wealthState = { poziom: wt.poziom, pula: wt.pula };
    const pieniadzPoWealth = Math.floor(yld.pieniadz * wt.mnoznik);
    const udzialBudynki = (city.podzialPracy?.procentBudynki ?? params.suwaakPracaBudynki) / 100;
    const { doBudynkow, doPuli } = splitPraca(yld.praca, udzialBudynki);
    const isOblegane = city.oblegane === true;
    let magazynPoTurze;
    let obleganyGlod = false;
    if (isOblegane) {
      const garnizon = city.garnizon != null && city.garnizon > 0 ? city.garnizon : 0;
      const zuzycie = city.population + garnizon;
      const magazynPrzed = getCityFood(city);
      magazynPoTurze = Math.max(0, magazynPrzed - zuzycie);
      obleganyGlod = magazynPoTurze <= 0;
      city.magazynZywnosci = magazynPoTurze;
      const tick2 = {
        cityId: city.id,
        ownerId: city.ownerId,
        praca: yld.praca,
        pieniadz: pieniadzPoWealth,
        pieniadzBrutto: yld.pieniadz,
        zywnoscNetto: 0,
        // brak dochodu podczas oblezenia
        nauka: yld.nauka,
        luksus: yld.luksus,
        kultura: yld.kultura,
        ludnoscPrzed: city.population,
        ludnoscPo: city.population,
        // populacja nie zmienia sie podczas oblezenia
        wzrost: false,
        ubytek: false,
        zdrowie,
        doBudynkow,
        doPuli,
        wealthMnoznik: wt.mnoznik,
        wealthZadowolenie: wt.zadowolenie,
        pieniadzZPracy: yld.pieniadzZPracy,
        oblegany: true,
        obleganyGlod,
        magazynPoTurze,
        maSpichlerz
      };
      result.perCity.push(tick2);
      incomeByOwner.set(city.ownerId, (incomeByOwner.get(city.ownerId) ?? 0) + pieniadzPoWealth);
      result.cities += 1;
      result.totalPraca += yld.praca;
      result.totalPieniadz += pieniadzPoWealth;
      result.totalNauka += yld.nauka;
      result.totalLuksus += yld.luksus;
      result.totalKultura += yld.kultura;
      result.totalZywnosc += 0;
      result.totalPracaPula += doPuli;
      continue;
    }
    const pctRozwoj = Math.min(100, Math.max(0, getEmpireFoodSplit(city.ownerId)));
    const zywnoscDoRozwoju = yld.zywnosc * (pctRozwoj / 100);
    const growthMult = growthMultByCity.get(city.id) ?? 1;
    const zywnoscDlaWzrostu = growthMult !== 1 ? zywnoscDoRozwoju * growthMult : zywnoscDoRozwoju;
    const grow = populationGrowth(econCity, zywnoscDlaWzrostu, params);
    const before = city.population;
    city.population = grow.nowaLudnosc;
    const ownerEpoka = city.ownerId === 0 ? playerEra : 1;
    if (city.manpower === void 0) {
      city.manpower = cityManpowerMax(city.population, ownerEpoka);
    } else if (grow.nowaLudnosc !== before) {
      city.manpower = refreshManpowerAfterPopChange(city, ownerEpoka, before);
    }
    city.manpower = tickManpowerRegen(
      city,
      ownerEpoka,
      loadManpowerRegenParams(),
      civManpowerRegenMult(ownerBonusy)
    );
    const foodCap = foodStorageCapacity(maSpichlerz, storageParams);
    city.magazynZywnosci = Math.min(grow.nowyMagazynZywnosci, foodCap);
    magazynPoTurze = city.magazynZywnosci;
    incomeByOwner.set(city.ownerId, (incomeByOwner.get(city.ownerId) ?? 0) + pieniadzPoWealth);
    const maMagazyn = false;
    const resCap = resourceStorageCapacityPerType(maMagazyn, storageParams);
    const citySurowce = city.surowce ?? {};
    if (Object.keys(citySurowce).length > 0) {
      const convResult = runConverters(
        DEFAULT_CONVERTER_RECIPES,
        citySurowce,
        converterThroughputs,
        () => resCap
      );
      city.surowce = convResult.stores;
    }
    const tick = {
      cityId: city.id,
      ownerId: city.ownerId,
      praca: yld.praca,
      pieniadz: pieniadzPoWealth,
      pieniadzBrutto: yld.pieniadz,
      zywnoscNetto: yld.zywnosc,
      nauka: yld.nauka,
      luksus: yld.luksus,
      kultura: yld.kultura,
      ludnoscPrzed: before,
      ludnoscPo: grow.nowaLudnosc,
      wzrost: grow.wzrost,
      ubytek: grow.ubytek,
      zdrowie,
      doBudynkow,
      doPuli,
      wealthMnoznik: wt.mnoznik,
      wealthZadowolenie: wt.zadowolenie,
      pieniadzZPracy: yld.pieniadzZPracy,
      oblegany: false,
      obleganyGlod: false,
      magazynPoTurze,
      maSpichlerz
    };
    result.perCity.push(tick);
    result.cities += 1;
    result.totalPraca += yld.praca;
    result.totalPieniadz += pieniadzPoWealth;
    result.totalNauka += yld.nauka;
    result.totalLuksus += yld.luksus;
    result.totalKultura += yld.kultura;
    result.totalZywnosc += yld.zywnosc;
    result.totalPracaPula += doPuli;
    if (grow.wzrost) result.growth += 1;
    if (grow.ubytek) result.starved += 1;
  }
  const ownerIds = /* @__PURE__ */ new Set([
    ...cities.map((c) => c.ownerId),
    ...econUnits.map((u) => u.ownerId)
  ]);
  for (const oid of ownerIds) {
    const income = incomeByOwner.get(oid) ?? 0;
    const ounits = econUnits.filter((u) => u.ownerId === oid);
    const balance = upkeepBalance(income, [], ounits, unitUpkeepTbl, upkeepParams);
    result.upkeepByOwner.set(oid, balance);
  }
  return result;
}

// src/game/army-starvation.ts
function applyArmyStarvationHpLoss(units, ownerId, hpFrac, getMaxHp) {
  const frac = Math.max(0, Math.min(1, hpFrac));
  if (frac <= 0) return { destroyedIds: [], damagedCount: 0 };
  const destroyedIds = [];
  let damagedCount = 0;
  for (const u of units) {
    if (u.ownerId !== ownerId) continue;
    const maxHp = u.hpMax ?? getMaxHp(u.typeId);
    if (maxHp <= 0) continue;
    if (u.hpMax == null) u.hpMax = maxHp;
    if (u.hp == null) u.hp = maxHp;
    const loss = Math.max(1, Math.floor(maxHp * frac));
    u.hp = Math.max(0, u.hp - loss);
    damagedCount++;
    if (u.hp <= 0) destroyedIds.push(u.id);
  }
  return { destroyedIds, damagedCount };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  advanceCityEconomy,
  advanceEmpireFood,
  applyArmyStarvationHpLoss,
  bindEmpireFoodRuntime,
  buildEmpireFoodParams,
  freshEmpireFoodState,
  getEmpireFoodMaxCap,
  getEmpireFoodSplit,
  isArmyStarving
});
