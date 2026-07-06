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

// tools/.pt-layout-entry.ts
var pt_layout_entry_exports = {};
__export(pt_layout_entry_exports, {
  result: () => result
});
module.exports = __toCommonJS(pt_layout_entry_exports);

// data/units.json
var units_default = [
  {
    Jednostka: "Wojownik",
    Epoka: "Kamie\u0144",
    Kultura: null,
    Tech: "-",
    "Pieni\u0105dz (koszt)": 10,
    Ludno\u015B\u0107: 1,
    Surowiec: "-",
    "Surowiec (ilo\u015B\u0107)": 0,
    "Utrzymanie (Pieni\u0105dz/tur\u0119)": 1,
    "\u017Cywno\u015B\u0107/tur\u0119": 1,
    Atak: 6,
    Uderzenie: 4,
    Obrona: 6,
    Ruch: 2,
    "Ruch w bitwie (heksy)": 4,
    Health: 30,
    "Pr\xF3g dezercji (% health)": 0.4,
    "Widok pola": 2,
    "Atak dystansowy": 0,
    "Zasi\u0119g ataku (hex)": "\u2014",
    "Ilo\u015B\u0107 pocisk\xF3w": "\u2014",
    "W zamian za": "\u2014",
    "Super-jednostka": "\u2014",
    Uwagi: null,
    "Rola (linia)": "Wr\u0119cz",
    Pancerz: 4,
    Przebicie: 0,
    "Kara obrony z flanki (%)": 15,
    "Kara obrony z ty\u0142u (%)": 30,
    "Morale bazowe": 100,
    "Morale ucieczki": 22,
    "Nazwa EN": "Warrior",
    Typ: "Swordsman",
    Klasa: "Standardowa",
    Nacja: "",
    "Bonus vs Swordsman %": 0,
    "Bonus vs Spearman %": 15,
    "Bonus vs Falangite %": 0,
    "Bonus vs Offensive %": 0,
    "Bonus vs Distance %": 0,
    "Bonus vs Mount %": 0,
    "Zmiana na": "Wojownik z mieczem i tarcz\u0105",
    "Dost\u0119pna w epokach": "Kamie\u0144"
  },
  {
    Jednostka: "Procarz",
    Epoka: "Br\u0105z",
    Kultura: null,
    Tech: "-",
    "Pieni\u0105dz (koszt)": 8,
    Ludno\u015B\u0107: 1,
    Surowiec: "-",
    "Surowiec (ilo\u015B\u0107)": 0,
    "Utrzymanie (Pieni\u0105dz/tur\u0119)": 1,
    "\u017Cywno\u015B\u0107/tur\u0119": 1,
    Atak: 2,
    Uderzenie: 2,
    Obrona: 4,
    Ruch: 2,
    "Ruch w bitwie (heksy)": 3,
    Health: 10,
    "Pr\xF3g dezercji (% health)": 0.5,
    "Widok pola": 2,
    "Atak dystansowy": 8,
    "Zasi\u0119g ataku (hex)": 4,
    "Ilo\u015B\u0107 pocisk\xF3w": 15,
    "W zamian za": "\u2014",
    "Super-jednostka": "\u2014",
    Uwagi: "proca; kr\xF3tki-\u015Bredni zasi\u0119g; standardowa jednostka dystansowa Kamie\u0144",
    "Rola (linia)": "Dystans",
    Pancerz: 2,
    Przebicie: 2,
    "Kara obrony z flanki (%)": 50,
    "Kara obrony z ty\u0142u (%)": 80,
    "Morale bazowe": 85,
    "Morale ucieczki": 25,
    "Nazwa EN": "Slinger",
    Typ: "Distance",
    Klasa: "Standardowa",
    Nacja: "",
    "Bonus vs Swordsman %": 0,
    "Bonus vs Spearman %": 0,
    "Bonus vs Falangite %": 0,
    "Bonus vs Offensive %": 0,
    "Bonus vs Distance %": 0,
    "Bonus vs Mount %": 0,
    "Zmiana na": "Kusznik",
    "Dost\u0119pna w epokach": "Br\u0105z"
  },
  {
    Jednostka: "Oszczepnik",
    Epoka: "Kamie\u0144",
    Kultura: null,
    Tech: "-",
    "Pieni\u0105dz (koszt)": 6,
    Ludno\u015B\u0107: 1,
    Surowiec: "-",
    "Surowiec (ilo\u015B\u0107)": 0,
    "Utrzymanie (Pieni\u0105dz/tur\u0119)": 1,
    "\u017Cywno\u015B\u0107/tur\u0119": 1,
    Atak: 4,
    Uderzenie: 2,
    Obrona: 4,
    Ruch: 2,
    "Ruch w bitwie (heksy)": 3,
    Health: 10,
    "Pr\xF3g dezercji (% health)": 0.5,
    "Widok pola": 2,
    "Atak dystansowy": 8,
    "Zasi\u0119g ataku (hex)": 2,
    "Ilo\u015B\u0107 pocisk\xF3w": 6,
    "W zamian za": "\u2014",
    "Super-jednostka": "\u2014",
    Uwagi: "miotacz oszczepem; NISZA: tani, mocny z bliska; Atak_dyst wy\u017Cszy ni\u017C \u0142ucznik; Zasi\u0119g=2 | BALANCE: Koszt\u21936, Atak_dyst\u21914",
    "Rola (linia)": "Dystans",
    Pancerz: 2,
    Przebicie: 2,
    "Kara obrony z flanki (%)": 50,
    "Kara obrony z ty\u0142u (%)": 80,
    "Morale bazowe": 85,
    "Morale ucieczki": 25,
    "Nazwa EN": "Javelineer",
    Typ: "Distance",
    Klasa: "Standardowa",
    Nacja: "",
    "Bonus vs Swordsman %": 0,
    "Bonus vs Spearman %": 0,
    "Bonus vs Falangite %": 0,
    "Bonus vs Offensive %": 0,
    "Bonus vs Distance %": 0,
    "Bonus vs Mount %": 0,
    "Zmiana na": "Kusznik",
    "Dost\u0119pna w epokach": "Kamie\u0144;Br\u0105z"
  },
  {
    Jednostka: "\u0141ucznik",
    Epoka: "Kamie\u0144",
    Kultura: null,
    Tech: "\u0141ucznictwo",
    "Pieni\u0105dz (koszt)": 6,
    Ludno\u015B\u0107: 1,
    Surowiec: "drewno",
    "Surowiec (ilo\u015B\u0107)": 4,
    "Utrzymanie (Pieni\u0105dz/tur\u0119)": 1,
    "\u017Cywno\u015B\u0107/tur\u0119": 1,
    Atak: 4,
    Uderzenie: 2,
    Obrona: 6,
    Ruch: 2,
    "Ruch w bitwie (heksy)": 3,
    Health: 10,
    "Pr\xF3g dezercji (% health)": 0.5,
    "Widok pola": 2,
    "Atak dystansowy": 10,
    "Zasi\u0119g ataku (hex)": 3,
    "Ilo\u015B\u0107 pocisk\xF3w": 12,
    "W zamian za": "\u2014",
    "Super-jednostka": "\u2014",
    Uwagi: null,
    "Rola (linia)": "Dystans",
    Pancerz: 2,
    Przebicie: 2,
    "Kara obrony z flanki (%)": 50,
    "Kara obrony z ty\u0142u (%)": 80,
    "Morale bazowe": 85,
    "Morale ucieczki": 25,
    "Nazwa EN": "Archer",
    Typ: "Distance",
    Klasa: "Standardowa",
    Nacja: "",
    "Bonus vs Swordsman %": 0,
    "Bonus vs Spearman %": 0,
    "Bonus vs Falangite %": 0,
    "Bonus vs Offensive %": 0,
    "Bonus vs Distance %": 0,
    "Bonus vs Mount %": 0,
    "Zmiana na": "Kusznik",
    "Dost\u0119pna w epokach": "Kamie\u0144;Br\u0105z"
  },
  {
    Jednostka: "Zwiadowca",
    Epoka: "Kamie\u0144",
    Kultura: null,
    Tech: "-",
    "Pieni\u0105dz (koszt)": 8,
    Ludno\u015B\u0107: 1,
    Surowiec: "-",
    "Surowiec (ilo\u015B\u0107)": 0,
    "Utrzymanie (Pieni\u0105dz/tur\u0119)": 1,
    "\u017Cywno\u015B\u0107/tur\u0119": 1,
    Atak: 0,
    Uderzenie: 2,
    Obrona: 2,
    Ruch: 3,
    "Ruch w bitwie (heksy)": 5,
    Health: 10,
    "Pr\xF3g dezercji (% health)": 0.6,
    "Widok pola": 5,
    "Atak dystansowy": 0,
    "Zasi\u0119g ataku (hex)": "\u2014",
    "Ilo\u015B\u0107 pocisk\xF3w": "\u2014",
    "W zamian za": "\u2014",
    "Super-jednostka": "\u2014",
    Uwagi: null,
    "Rola (linia)": "Wsparcie",
    Pancerz: 0,
    Przebicie: 0,
    "Kara obrony z flanki (%)": "\u2014",
    "Kara obrony z ty\u0142u (%)": "\u2014",
    "Morale bazowe": 60,
    "Morale ucieczki": 25,
    "Nazwa EN": "Scout",
    Typ: "Civilian",
    Klasa: "Standardowa",
    Nacja: "",
    "Bonus vs Swordsman %": 0,
    "Bonus vs Spearman %": 0,
    "Bonus vs Falangite %": 0,
    "Bonus vs Offensive %": 0,
    "Bonus vs Distance %": 0,
    "Bonus vs Mount %": 0,
    "Zmiana na": "\u2014",
    "Dost\u0119pna w epokach": "Kamie\u0144;Br\u0105z;\u017Belazo"
  },
  {
    Jednostka: "W\u0142\xF3cznik",
    Epoka: "Br\u0105z",
    Kultura: null,
    Tech: "Br\u0105zownictwo",
    "Pieni\u0105dz (koszt)": 16,
    Ludno\u015B\u0107: 1,
    Surowiec: "braz",
    "Surowiec (ilo\u015B\u0107)": 4,
    "Utrzymanie (Pieni\u0105dz/tur\u0119)": 2,
    "\u017Cywno\u015B\u0107/tur\u0119": 1,
    Atak: 6,
    Uderzenie: 6,
    Obrona: 8,
    Ruch: 2,
    "Ruch w bitwie (heksy)": 3,
    Health: 80,
    "Pr\xF3g dezercji (% health)": 0.3,
    "Widok pola": 2,
    "Atak dystansowy": 0,
    "Zasi\u0119g ataku (hex)": "\u2014",
    "Ilo\u015B\u0107 pocisk\xF3w": "\u2014",
    "W zamian za": "\u2014",
    "Super-jednostka": "\u2014",
    Uwagi: null,
    "Rola (linia)": "Wr\u0119cz",
    Pancerz: 6,
    Przebicie: 2,
    "Kara obrony z flanki (%)": 30,
    "Kara obrony z ty\u0142u (%)": 50,
    "Morale bazowe": 100,
    "Morale ucieczki": 22,
    "Nazwa EN": "Spearman",
    Typ: "Spearman",
    Klasa: "Standardowa",
    Nacja: "",
    "Bonus vs Swordsman %": 0,
    "Bonus vs Spearman %": 0,
    "Bonus vs Falangite %": 0,
    "Bonus vs Offensive %": 0,
    "Bonus vs Distance %": 0,
    "Bonus vs Mount %": 50,
    "Zmiana na": "Spearman",
    "Dost\u0119pna w epokach": "Br\u0105z;\u017Belazo"
  },
  {
    Jednostka: "Wojownik z mieczem i tarcz\u0105",
    Epoka: "Br\u0105z",
    Kultura: null,
    Tech: "Br\u0105zownictwo",
    "Pieni\u0105dz (koszt)": 16,
    Ludno\u015B\u0107: 1,
    Surowiec: "braz",
    "Surowiec (ilo\u015B\u0107)": 5,
    "Utrzymanie (Pieni\u0105dz/tur\u0119)": 2,
    "\u017Cywno\u015B\u0107/tur\u0119": 1,
    Atak: 6,
    Uderzenie: 6,
    Obrona: 6,
    Ruch: 2,
    "Ruch w bitwie (heksy)": 3,
    Health: 50,
    "Pr\xF3g dezercji (% health)": 0.3,
    "Widok pola": 2,
    "Atak dystansowy": 0,
    "Zasi\u0119g ataku (hex)": "\u2014",
    "Ilo\u015B\u0107 pocisk\xF3w": "\u2014",
    "W zamian za": "\u2014",
    "Super-jednostka": "\u2014",
    Uwagi: null,
    "Rola (linia)": "Wr\u0119cz",
    Pancerz: 4,
    Przebicie: 4,
    "Kara obrony z flanki (%)": 15,
    "Kara obrony z ty\u0142u (%)": 30,
    "Morale bazowe": 100,
    "Morale ucieczki": 22,
    "Nazwa EN": "Swordsman",
    Typ: "Swordsman",
    Klasa: "Standardowa",
    Nacja: "",
    "Bonus vs Swordsman %": 0,
    "Bonus vs Spearman %": 15,
    "Bonus vs Falangite %": 0,
    "Bonus vs Offensive %": 0,
    "Bonus vs Distance %": 0,
    "Bonus vs Mount %": 0,
    "Zmiana na": "Swordsman",
    "Dost\u0119pna w epokach": "Br\u0105z;\u017Belazo"
  },
  {
    Jednostka: "Rydwan (wo\u0142y)",
    Epoka: "Br\u0105z",
    Kultura: null,
    Tech: "Ko\u0142o",
    "Pieni\u0105dz (koszt)": 30,
    Ludno\u015B\u0107: 1,
    Surowiec: "wol",
    "Surowiec (ilo\u015B\u0107)": 1,
    "Utrzymanie (Pieni\u0105dz/tur\u0119)": 3,
    "\u017Cywno\u015B\u0107/tur\u0119": 1,
    Atak: 6,
    Uderzenie: 6,
    Obrona: 2,
    Ruch: 3,
    "Ruch w bitwie (heksy)": 5,
    Health: 100,
    "Pr\xF3g dezercji (% health)": 0.3,
    "Widok pola": 3,
    "Atak dystansowy": 0,
    "Zasi\u0119g ataku (hex)": "\u2014",
    "Ilo\u015B\u0107 pocisk\xF3w": "\u2014",
    "W zamian za": "\u2014",
    "Super-jednostka": "\u2014",
    Uwagi: "wczesny rydwan na wolach",
    "Rola (linia)": "Flanka",
    Pancerz: 2,
    Przebicie: 4,
    "Kara obrony z flanki (%)": 25,
    "Kara obrony z ty\u0142u (%)": 40,
    "Morale bazowe": 100,
    "Morale ucieczki": 10,
    "Nazwa EN": "Ox Chariot",
    Typ: "Mount",
    Klasa: "Standardowa",
    Nacja: "",
    "Bonus vs Swordsman %": 0,
    "Bonus vs Spearman %": 0,
    "Bonus vs Falangite %": 0,
    "Bonus vs Offensive %": 25,
    "Bonus vs Distance %": 50,
    "Bonus vs Mount %": 0,
    "Zmiana na": "Mount",
    "Dost\u0119pna w epokach": "Br\u0105z"
  },
  {
    Jednostka: "Konnica",
    Epoka: "Br\u0105z",
    Kultura: null,
    Tech: "Je\u017Adziectwo",
    "Pieni\u0105dz (koszt)": 22,
    Ludno\u015B\u0107: 1,
    Surowiec: "Ko\u0144",
    "Surowiec (ilo\u015B\u0107)": 1,
    "Utrzymanie (Pieni\u0105dz/tur\u0119)": 3,
    "\u017Cywno\u015B\u0107/tur\u0119": 1,
    Atak: 6,
    Uderzenie: 6,
    Obrona: 4,
    Ruch: 4,
    "Ruch w bitwie (heksy)": 6,
    Health: 80,
    "Pr\xF3g dezercji (% health)": 0.3,
    "Widok pola": 4,
    "Atak dystansowy": 0,
    "Zasi\u0119g ataku (hex)": "\u2014",
    "Ilo\u015B\u0107 pocisk\xF3w": "\u2014",
    "W zamian za": "\u2014",
    "Super-jednostka": "\u2014",
    Uwagi: "wymaga konia (Uderzenie do potwierdzenia)",
    "Rola (linia)": "Flanka",
    Pancerz: 4,
    Przebicie: 4,
    "Kara obrony z flanki (%)": 25,
    "Kara obrony z ty\u0142u (%)": 40,
    "Morale bazowe": 100,
    "Morale ucieczki": 10,
    "Nazwa EN": "Horseman",
    Typ: "Mount",
    Klasa: "Standardowa",
    Nacja: "",
    "Bonus vs Swordsman %": 0,
    "Bonus vs Spearman %": 0,
    "Bonus vs Falangite %": 0,
    "Bonus vs Offensive %": 25,
    "Bonus vs Distance %": 50,
    "Bonus vs Mount %": 0,
    "Zmiana na": "Mount",
    "Dost\u0119pna w epokach": "Br\u0105z;\u017Belazo"
  },
  {
    Jednostka: "Galera",
    Epoka: "Br\u0105z",
    Kultura: null,
    Tech: "\u017Begluga",
    "Pieni\u0105dz (koszt)": 18,
    Ludno\u015B\u0107: 1,
    Surowiec: "Deski",
    "Surowiec (ilo\u015B\u0107)": 4,
    "Utrzymanie (Pieni\u0105dz/tur\u0119)": 3,
    "\u017Cywno\u015B\u0107/tur\u0119": 1,
    Atak: 4,
    Uderzenie: 4,
    Obrona: 4,
    Ruch: 4,
    "Ruch w bitwie (heksy)": "\u2014",
    Health: 50,
    "Pr\xF3g dezercji (% health)": 0.4,
    "Widok pola": 4,
    "Atak dystansowy": 0,
    "Zasi\u0119g ataku (hex)": "\u2014",
    "Ilo\u015B\u0107 pocisk\xF3w": "\u2014",
    "W zamian za": "\u2014",
    "Super-jednostka": "\u2014",
    Uwagi: "jednostka morska (Uderzenie do potwierdzenia)",
    "Rola (linia)": "Morska",
    Pancerz: 0,
    Przebicie: 0,
    "Kara obrony z flanki (%)": "\u2014",
    "Kara obrony z ty\u0142u (%)": "\u2014",
    "Morale bazowe": 90,
    "Morale ucieczki": 20,
    "Nazwa EN": "Galley",
    Typ: "Swordsman",
    Klasa: "Standardowa",
    Nacja: "",
    "Bonus vs Swordsman %": 0,
    "Bonus vs Spearman %": 15,
    "Bonus vs Falangite %": 0,
    "Bonus vs Offensive %": 0,
    "Bonus vs Distance %": 0,
    "Bonus vs Mount %": 0,
    "Zmiana na": "Swordsman",
    "Dost\u0119pna w epokach": "Br\u0105z;\u017Belazo"
  },
  {
    Jednostka: "Falanga",
    Epoka: "Br\u0105z",
    Kultura: "Grecka",
    Tech: "Br\u0105zownictwo",
    "Pieni\u0105dz (koszt)": 18,
    Ludno\u015B\u0107: 1,
    Surowiec: "braz",
    "Surowiec (ilo\u015B\u0107)": 5,
    "Utrzymanie (Pieni\u0105dz/tur\u0119)": 2,
    "\u017Cywno\u015B\u0107/tur\u0119": 1,
    Atak: 6,
    Uderzenie: 6,
    Obrona: 10,
    Ruch: 1,
    "Ruch w bitwie (heksy)": 3,
    Health: 70,
    "Pr\xF3g dezercji (% health)": 0.2,
    "Widok pola": 1,
    "Atak dystansowy": 0,
    "Zasi\u0119g ataku (hex)": "\u2014",
    "Ilo\u015B\u0107 pocisk\xF3w": "\u2014",
    "W zamian za": "W\u0142\xF3cznik",
    "Super-jednostka": "\u2014",
    Uwagi: "najlepsza Obrona frontalna / anty-szar\u017Ca | ZA\u0141O\u017BENIE: zast\u0119puje W\u0142\xF3cznik \u2014 do potwierdzenia",
    "Rola (linia)": "Wr\u0119cz",
    Pancerz: 6,
    Przebicie: 2,
    "Kara obrony z flanki (%)": 50,
    "Kara obrony z ty\u0142u (%)": 80,
    "Morale bazowe": 110,
    "Morale ucieczki": 25,
    "Nazwa EN": "Phalanx",
    Typ: "Falangite",
    Klasa: "Specjalna",
    Nacja: "Grecja",
    "Bonus vs Swordsman %": 0,
    "Bonus vs Spearman %": 0,
    "Bonus vs Falangite %": 0,
    "Bonus vs Offensive %": 0,
    "Bonus vs Distance %": 0,
    "Bonus vs Mount %": 50,
    "Zmiana na": "Falangite",
    "Dost\u0119pna w epokach": "Br\u0105z;\u017Belazo"
  },
  {
    Jednostka: "Hieros Lochos (\u015Awi\u0119ty Zast\u0119p)",
    Epoka: "Br\u0105z",
    Kultura: "Grecka",
    Tech: "\u2014",
    "Pieni\u0105dz (koszt)": 0,
    Ludno\u015B\u0107: 1,
    Surowiec: "\u2014",
    "Surowiec (ilo\u015B\u0107)": 0,
    "Utrzymanie (Pieni\u0105dz/tur\u0119)": 0,
    "\u017Cywno\u015B\u0107/tur\u0119": 1,
    Atak: 8,
    Uderzenie: 8,
    Obrona: 10,
    Ruch: 2,
    "Ruch w bitwie (heksy)": 4,
    Health: 85,
    "Pr\xF3g dezercji (% health)": 0.1,
    "Widok pola": 2,
    "Atak dystansowy": 0,
    "Zasi\u0119g ataku (hex)": "\u2014",
    "Ilo\u015B\u0107 pocisk\xF3w": "\u2014",
    "W zamian za": "\u2014",
    "Super-jednostka": "TAK",
    Uwagi: "propozycja \u2014 do akceptacji; max 1, bezp\u0142atna, stolica, respawn",
    "Rola (linia)": "Wr\u0119cz",
    Pancerz: 6,
    Przebicie: 4,
    "Kara obrony z flanki (%)": 15,
    "Kara obrony z ty\u0142u (%)": 30,
    "Morale bazowe": 120,
    "Morale ucieczki": 18,
    "Nazwa EN": "Hieros Lochos (Sacred Band)",
    Typ: "Swordsman",
    Klasa: "Super",
    Nacja: "Grecja",
    "Bonus vs Swordsman %": 0,
    "Bonus vs Spearman %": 15,
    "Bonus vs Falangite %": 0,
    "Bonus vs Offensive %": 0,
    "Bonus vs Distance %": 0,
    "Bonus vs Mount %": 0,
    "Zmiana na": "\u2014",
    "Dost\u0119pna w epokach": "Br\u0105z;\u017Belazo"
  },
  {
    Jednostka: "Hastati",
    Epoka: "\u017Belazo",
    Kultura: "Rzymska",
    Tech: "Br\u0105zownictwo",
    "Pieni\u0105dz (koszt)": 18,
    Ludno\u015B\u0107: 1,
    Surowiec: "braz",
    "Surowiec (ilo\u015B\u0107)": 5,
    "Utrzymanie (Pieni\u0105dz/tur\u0119)": 2,
    "\u017Cywno\u015B\u0107/tur\u0119": 1,
    Atak: 6,
    Uderzenie: 6,
    Obrona: 6,
    Ruch: 2,
    "Ruch w bitwie (heksy)": 3,
    Health: 60,
    "Pr\xF3g dezercji (% health)": 0.15,
    "Widok pola": 2,
    "Atak dystansowy": 6,
    "Zasi\u0119g ataku (hex)": 2,
    "Ilo\u015B\u0107 pocisk\xF3w": 2,
    "W zamian za": "Wojownik z mieczem i tarcz\u0105",
    "Super-jednostka": "\u2014",
    Uwagi: "silna zbalansowana piechota; pilum \u2014 2 rzuty przed zwarciem",
    "Rola (linia)": "Wr\u0119cz",
    Pancerz: 4,
    Przebicie: 6,
    "Kara obrony z flanki (%)": 15,
    "Kara obrony z ty\u0142u (%)": 30,
    "Morale bazowe": 110,
    "Morale ucieczki": 25,
    "Nazwa EN": "Hastati",
    Typ: "Swordsman",
    Klasa: "Specjalna",
    Nacja: "Rzym",
    "Bonus vs Swordsman %": 0,
    "Bonus vs Spearman %": 15,
    "Bonus vs Falangite %": 0,
    "Bonus vs Offensive %": 0,
    "Bonus vs Distance %": 0,
    "Bonus vs Mount %": 0,
    "Zmiana na": "Swordsman",
    "Dost\u0119pna w epokach": "\u017Belazo"
  },
  {
    Jednostka: "Triari",
    Epoka: "\u017Belazo",
    Kultura: "Rzymska",
    Tech: "\u2014",
    "Pieni\u0105dz (koszt)": 0,
    Ludno\u015B\u0107: 1,
    Surowiec: "\u2014",
    "Surowiec (ilo\u015B\u0107)": 0,
    "Utrzymanie (Pieni\u0105dz/tur\u0119)": 0,
    "\u017Cywno\u015B\u0107/tur\u0119": 1,
    Atak: 8,
    Uderzenie: 10,
    Obrona: 8,
    Ruch: 2,
    "Ruch w bitwie (heksy)": 4,
    Health: 85,
    "Pr\xF3g dezercji (% health)": 0.1,
    "Widok pola": 2,
    "Atak dystansowy": 0,
    "Zasi\u0119g ataku (hex)": "\u2014",
    "Ilo\u015B\u0107 pocisk\xF3w": "\u2014",
    "W zamian za": "\u2014",
    "Super-jednostka": "TAK",
    Uwagi: "propozycja \u2014 do akceptacji; max 1, bezp\u0142atna, stolica, respawn",
    "Rola (linia)": "Wr\u0119cz",
    Pancerz: 6,
    Przebicie: 4,
    "Kara obrony z flanki (%)": 15,
    "Kara obrony z ty\u0142u (%)": 30,
    "Morale bazowe": 120,
    "Morale ucieczki": 18,
    "Nazwa EN": "Triari",
    Typ: "Swordsman",
    Klasa: "Super",
    Nacja: "Rzym",
    "Bonus vs Swordsman %": 0,
    "Bonus vs Spearman %": 15,
    "Bonus vs Falangite %": 0,
    "Bonus vs Offensive %": 0,
    "Bonus vs Distance %": 0,
    "Bonus vs Mount %": 0,
    "Zmiana na": "\u2014",
    "Dost\u0119pna w epokach": "\u017Belazo"
  },
  {
    Jednostka: "Je\u017Adziec chi\u0144ski",
    Epoka: "Br\u0105z",
    Kultura: "Chi\u0144czycy",
    Tech: "Je\u017Adziectwo",
    "Pieni\u0105dz (koszt)": 28,
    Ludno\u015B\u0107: 1,
    Surowiec: "Ko\u0144",
    "Surowiec (ilo\u015B\u0107)": 1,
    "Utrzymanie (Pieni\u0105dz/tur\u0119)": 3,
    "\u017Cywno\u015B\u0107/tur\u0119": 1,
    Atak: 8,
    Uderzenie: 10,
    Obrona: 4,
    Ruch: 4,
    "Ruch w bitwie (heksy)": 6,
    Health: 75,
    "Pr\xF3g dezercji (% health)": 0.2,
    "Widok pola": 4,
    "Atak dystansowy": 0,
    "Zasi\u0119g ataku (hex)": "\u2014",
    "Ilo\u015B\u0107 pocisk\xF3w": "\u2014",
    "W zamian za": "Konnica",
    "Super-jednostka": "\u2014",
    Uwagi: "jednostka specjalna; chi\u0144ska konnica szybkiego uderzenia (Xiongnu styl); silniejsza od standardowej konnicy; wymaga Konia i tech Je\u017Adziectwo | BALANCE: Utrzymanie\u21913",
    "Rola (linia)": "Flanka",
    Pancerz: 4,
    Przebicie: 4,
    "Kara obrony z flanki (%)": 25,
    "Kara obrony z ty\u0142u (%)": 40,
    "Morale bazowe": 100,
    "Morale ucieczki": 10,
    "Nazwa EN": "Chinese Cavalry",
    Typ: "Mount",
    Klasa: "Specjalna",
    Nacja: "Chiny",
    "Bonus vs Swordsman %": 0,
    "Bonus vs Spearman %": 0,
    "Bonus vs Falangite %": 0,
    "Bonus vs Offensive %": 25,
    "Bonus vs Distance %": 50,
    "Bonus vs Mount %": 0,
    "Zmiana na": "Mount",
    "Dost\u0119pna w epokach": "Br\u0105z;\u017Belazo"
  },
  {
    Jednostka: "Kusznik",
    Epoka: "\u015Aredniowiecze",
    Kultura: "Chi\u0144czycy",
    Tech: "Br\u0105zownictwo",
    "Pieni\u0105dz (koszt)": 20,
    Ludno\u015B\u0107: 1,
    Surowiec: "drewno",
    "Surowiec (ilo\u015B\u0107)": 5,
    "Utrzymanie (Pieni\u0105dz/tur\u0119)": 2,
    "\u017Cywno\u015B\u0107/tur\u0119": 1,
    Atak: 8,
    Uderzenie: 4,
    Obrona: 4,
    Ruch: 2,
    "Ruch w bitwie (heksy)": 3,
    Health: 20,
    "Pr\xF3g dezercji (% health)": 0.4,
    "Widok pola": 2,
    "Atak dystansowy": 10,
    "Zasi\u0119g ataku (hex)": 4,
    "Ilo\u015B\u0107 pocisk\xF3w": 14,
    "W zamian za": "\u0141ucznik",
    "Super-jednostka": "\u2014",
    Uwagi: "jednostka specjalna (lepsza piechota dystansowa); na razie informacyjny | BALANCE: Zasi\u0119g\u21914, Pociski\u219114; po epoce \u017Belaza (\u015Bredniowiecze); docelowy awans dla cz\u0119\u015Bci jednostek (Zmiana na \u2192 Kusznik)",
    "Rola (linia)": "Dystans",
    Pancerz: 2,
    Przebicie: 2,
    "Kara obrony z flanki (%)": 50,
    "Kara obrony z ty\u0142u (%)": 80,
    "Morale bazowe": 85,
    "Morale ucieczki": 25,
    "Nazwa EN": "Crossbowman",
    Typ: "Distance",
    Klasa: "Standardowa",
    Nacja: "Chiny",
    "Bonus vs Swordsman %": 0,
    "Bonus vs Spearman %": 0,
    "Bonus vs Falangite %": 0,
    "Bonus vs Offensive %": 0,
    "Bonus vs Distance %": 0,
    "Bonus vs Mount %": 0,
    "Zmiana na": "Distance",
    "Dost\u0119pna w epokach": "\u015Aredniowiecze"
  },
  {
    Jednostka: "Hu Ben Wei (Gwardia Tygrysa)",
    Epoka: "Br\u0105z",
    Kultura: "Chi\u0144czycy",
    Tech: "\u2014",
    "Pieni\u0105dz (koszt)": 0,
    Ludno\u015B\u0107: 1,
    Surowiec: "\u2014",
    "Surowiec (ilo\u015B\u0107)": 0,
    "Utrzymanie (Pieni\u0105dz/tur\u0119)": 0,
    "\u017Cywno\u015B\u0107/tur\u0119": 1,
    Atak: 10,
    Uderzenie: 8,
    Obrona: 7,
    Ruch: 3,
    "Ruch w bitwie (heksy)": 4,
    Health: 80,
    "Pr\xF3g dezercji (% health)": 0.1,
    "Widok pola": 3,
    "Atak dystansowy": 0,
    "Zasi\u0119g ataku (hex)": "\u2014",
    "Ilo\u015B\u0107 pocisk\xF3w": "\u2014",
    "W zamian za": "\u2014",
    "Super-jednostka": "TAK",
    Uwagi: "propozycja \u2014 do akceptacji; max 1, bezp\u0142atna, stolica, respawn | BALANCE: Obrona\u21917 (wyr\xF3wnanie rozstrza\u0142u super-jednostek ~5%)",
    "Rola (linia)": "Wr\u0119cz",
    Pancerz: 6,
    Przebicie: 4,
    "Kara obrony z flanki (%)": 15,
    "Kara obrony z ty\u0142u (%)": 30,
    "Morale bazowe": 120,
    "Morale ucieczki": 18,
    "Nazwa EN": "Hu Ben Wei (Tiger Guard)",
    Typ: "Swordsman",
    Klasa: "Super",
    Nacja: "Chiny",
    "Bonus vs Swordsman %": 0,
    "Bonus vs Spearman %": 15,
    "Bonus vs Falangite %": 0,
    "Bonus vs Offensive %": 0,
    "Bonus vs Distance %": 0,
    "Bonus vs Mount %": 0,
    "Zmiana na": "\u2014",
    "Dost\u0119pna w epokach": "Br\u0105z;\u017Belazo"
  },
  {
    Jednostka: "Impi",
    Epoka: "Br\u0105z",
    Kultura: "Zulusi",
    Tech: "Br\u0105zownictwo",
    "Pieni\u0105dz (koszt)": 16,
    Ludno\u015B\u0107: 1,
    Surowiec: "braz",
    "Surowiec (ilo\u015B\u0107)": 4,
    "Utrzymanie (Pieni\u0105dz/tur\u0119)": 2,
    "\u017Cywno\u015B\u0107/tur\u0119": 1,
    Atak: 3,
    Uderzenie: 6,
    Obrona: 6,
    Ruch: 4,
    "Ruch w bitwie (heksy)": 4,
    Health: 70,
    "Pr\xF3g dezercji (% health)": 0.15,
    "Widok pola": 4,
    "Atak dystansowy": 0,
    "Zasi\u0119g ataku (hex)": "\u2014",
    "Ilo\u015B\u0107 pocisk\xF3w": "\u2014",
    "W zamian za": "W\u0142\xF3cznik",
    "Super-jednostka": "\u2014",
    Uwagi: "jednostka specjalna; szybka piechota w\u0142\xF3cznicza (iklwa); S\u0141ABSZA w zwarciu ale TA\u0143SZA \u2014 si\u0142a Zulus\xF3w = \u0142ucznicy; Zulusi: brak rydwan\xF3w | BALANCE: Atak\u21933, Obrona\u21936, Koszt\u219316",
    "Rola (linia)": "Wr\u0119cz",
    Pancerz: 4,
    Przebicie: 2,
    "Kara obrony z flanki (%)": 30,
    "Kara obrony z ty\u0142u (%)": 50,
    "Morale bazowe": 100,
    "Morale ucieczki": 22,
    "Nazwa EN": "Impi",
    Typ: "Spearman",
    Klasa: "Specjalna",
    Nacja: "Zulu",
    "Bonus vs Swordsman %": 0,
    "Bonus vs Spearman %": 0,
    "Bonus vs Falangite %": 0,
    "Bonus vs Offensive %": 0,
    "Bonus vs Distance %": 0,
    "Bonus vs Mount %": 50,
    "Zmiana na": "Spearman",
    "Dost\u0119pna w epokach": "Br\u0105z;\u017Belazo"
  },
  {
    Jednostka: "Oszczepnik Zulu (Izijula)",
    Epoka: "Kamie\u0144",
    Kultura: "Zulusi",
    Tech: "-",
    "Pieni\u0105dz (koszt)": 20,
    Ludno\u015B\u0107: 1,
    Surowiec: "-",
    "Surowiec (ilo\u015B\u0107)": 0,
    "Utrzymanie (Pieni\u0105dz/tur\u0119)": 1,
    "\u017Cywno\u015B\u0107/tur\u0119": 1,
    Atak: 4,
    Uderzenie: 2,
    Obrona: 4,
    Ruch: 2,
    "Ruch w bitwie (heksy)": 3,
    Health: 20,
    "Pr\xF3g dezercji (% health)": 0.4,
    "Widok pola": 2,
    "Atak dystansowy": 9,
    "Zasi\u0119g ataku (hex)": 2,
    "Ilo\u015B\u0107 pocisk\xF3w": 10,
    "W zamian za": "Oszczepnik",
    "Super-jednostka": "\u2014",
    Uwagi: "jednostka specjalna; MOCNY DYSTANS \u2014 fundament si\u0142y Zulus\xF3w; wyspecjalizowany oszczepnik (assegai/izijula); du\u017Cy zapas pocisk\xF3w; Zulusi: brak rydwan\xF3w | BALANCE: Atak_dyst\u21917, Pociski\u219110, Koszt\u219120",
    "Rola (linia)": "Dystans",
    Pancerz: 2,
    Przebicie: 2,
    "Kara obrony z flanki (%)": 50,
    "Kara obrony z ty\u0142u (%)": 80,
    "Morale bazowe": 85,
    "Morale ucieczki": 25,
    "Nazwa EN": "Zulu Javelineer (Isijula)",
    Typ: "Distance",
    Klasa: "Specjalna",
    Nacja: "Zulu",
    "Bonus vs Swordsman %": 0,
    "Bonus vs Spearman %": 0,
    "Bonus vs Falangite %": 0,
    "Bonus vs Offensive %": 0,
    "Bonus vs Distance %": 0,
    "Bonus vs Mount %": 0,
    "Zmiana na": "Kusznik",
    "Dost\u0119pna w epokach": "Kamie\u0144;Br\u0105z"
  },
  {
    Jednostka: "uThulwana (Bia\u0142e Tarcze)",
    Epoka: "Br\u0105z",
    Kultura: "Zulusi",
    Tech: "\u2014",
    "Pieni\u0105dz (koszt)": 0,
    Ludno\u015B\u0107: 1,
    Surowiec: "\u2014",
    "Surowiec (ilo\u015B\u0107)": 0,
    "Utrzymanie (Pieni\u0105dz/tur\u0119)": 0,
    "\u017Cywno\u015B\u0107/tur\u0119": 1,
    Atak: 8,
    Uderzenie: 10,
    Obrona: 7,
    Ruch: 4,
    "Ruch w bitwie (heksy)": 4,
    Health: 85,
    "Pr\xF3g dezercji (% health)": 0.1,
    "Widok pola": 4,
    "Atak dystansowy": 0,
    "Zasi\u0119g ataku (hex)": "\u2014",
    "Ilo\u015B\u0107 pocisk\xF3w": "\u2014",
    "W zamian za": "\u2014",
    "Super-jednostka": "TAK",
    Uwagi: "propozycja \u2014 do akceptacji; max 1, bezp\u0142atna, stolica, respawn",
    "Rola (linia)": "Wr\u0119cz",
    Pancerz: 6,
    Przebicie: 4,
    "Kara obrony z flanki (%)": 15,
    "Kara obrony z ty\u0142u (%)": 30,
    "Morale bazowe": 120,
    "Morale ucieczki": 18,
    "Nazwa EN": "uThulwana (White Shields)",
    Typ: "Swordsman",
    Klasa: "Super",
    Nacja: "Zulu",
    "Bonus vs Swordsman %": 0,
    "Bonus vs Spearman %": 15,
    "Bonus vs Falangite %": 0,
    "Bonus vs Offensive %": 0,
    "Bonus vs Distance %": 0,
    "Bonus vs Mount %": 0,
    "Zmiana na": "\u2014",
    "Dost\u0119pna w epokach": "Br\u0105z;\u017Belazo"
  },
  {
    Jednostka: "Wojownik z maczug\u0105 (Chaska)",
    Epoka: "Kamie\u0144",
    Kultura: "Inkowie",
    Tech: "-",
    "Pieni\u0105dz (koszt)": 26,
    Ludno\u015B\u0107: 1,
    Surowiec: "-",
    "Surowiec (ilo\u015B\u0107)": 0,
    "Utrzymanie (Pieni\u0105dz/tur\u0119)": 2,
    "\u017Cywno\u015B\u0107/tur\u0119": 1,
    Atak: 8,
    Uderzenie: 8,
    Obrona: 4,
    Ruch: 3,
    "Ruch w bitwie (heksy)": 4,
    Health: 40,
    "Pr\xF3g dezercji (% health)": 0.1,
    "Widok pola": 3,
    "Atak dystansowy": 0,
    "Zasi\u0119g ataku (hex)": "\u2014",
    "Ilo\u015B\u0107 pocisk\xF3w": "\u2014",
    "W zamian za": "Wojownik",
    "Super-jednostka": "\u2014",
    Uwagi: "gwia\u017Adzista maczuga, mocna piechota wr\u0119cz, bardzo wysokie morale, walczy do \u015Bmierci | BALANCE: Atak\u21938, Przebicie\u21936, Koszt\u219126",
    "Rola (linia)": "Wr\u0119cz",
    Pancerz: 2,
    Przebicie: 6,
    "Kara obrony z flanki (%)": 15,
    "Kara obrony z ty\u0142u (%)": 30,
    "Morale bazowe": 100,
    "Morale ucieczki": 22,
    "Nazwa EN": "Mace Warrior",
    Typ: "Offensive",
    Klasa: "Specjalna",
    Nacja: "Inkowie",
    "Bonus vs Swordsman %": 25,
    "Bonus vs Spearman %": 0,
    "Bonus vs Falangite %": 0,
    "Bonus vs Offensive %": 0,
    "Bonus vs Distance %": 0,
    "Bonus vs Mount %": 0,
    "Zmiana na": "Offensive",
    "Dost\u0119pna w epokach": "Kamie\u0144;Br\u0105z"
  },
  {
    Jednostka: "Wojownik z toporem",
    Epoka: "Br\u0105z",
    Kultura: "Inkowie",
    Tech: "Br\u0105zownictwo",
    "Pieni\u0105dz (koszt)": 18,
    Ludno\u015B\u0107: 1,
    Surowiec: "braz",
    "Surowiec (ilo\u015B\u0107)": 4,
    "Utrzymanie (Pieni\u0105dz/tur\u0119)": 2,
    "\u017Cywno\u015B\u0107/tur\u0119": 1,
    Atak: 8,
    Uderzenie: 6,
    Obrona: 4,
    Ruch: 2,
    "Ruch w bitwie (heksy)": 4,
    Health: 50,
    "Pr\xF3g dezercji (% health)": 0.2,
    "Widok pola": 2,
    "Atak dystansowy": 0,
    "Zasi\u0119g ataku (hex)": "\u2014",
    "Ilo\u015B\u0107 pocisk\xF3w": "\u2014",
    "W zamian za": "Wojownik z mieczem i tarcz\u0105",
    "Super-jednostka": "\u2014",
    Uwagi: "inkaski bojownik z toporem z br\u0105zu; zast\u0119puje standardowego wojownika z mieczem",
    "Rola (linia)": "Wr\u0119cz",
    Pancerz: 2,
    Przebicie: 8,
    "Kara obrony z flanki (%)": 15,
    "Kara obrony z ty\u0142u (%)": 30,
    "Morale bazowe": 100,
    "Morale ucieczki": 22,
    "Nazwa EN": "Axe Warrior",
    Typ: "Offensive",
    Klasa: "Specjalna",
    Nacja: "Inkowie",
    "Bonus vs Swordsman %": 25,
    "Bonus vs Spearman %": 0,
    "Bonus vs Falangite %": 0,
    "Bonus vs Offensive %": 0,
    "Bonus vs Distance %": 0,
    "Bonus vs Mount %": 0,
    "Zmiana na": "Offensive",
    "Dost\u0119pna w epokach": "Br\u0105z;\u017Belazo"
  },
  {
    Jednostka: "Procarz (Huaracoc)",
    Epoka: "Br\u0105z",
    Kultura: "Inkowie",
    Tech: "-",
    "Pieni\u0105dz (koszt)": 8,
    Ludno\u015B\u0107: 1,
    Surowiec: "-",
    "Surowiec (ilo\u015B\u0107)": 0,
    "Utrzymanie (Pieni\u0105dz/tur\u0119)": 1,
    "\u017Cywno\u015B\u0107/tur\u0119": 1,
    Atak: 2,
    Uderzenie: 2,
    Obrona: 4,
    Ruch: 2,
    "Ruch w bitwie (heksy)": 3,
    Health: 10,
    "Pr\xF3g dezercji (% health)": 0.5,
    "Widok pola": 2,
    "Atak dystansowy": 8,
    "Zasi\u0119g ataku (hex)": 5,
    "Ilo\u015B\u0107 pocisk\xF3w": 15,
    "W zamian za": "Procarz",
    "Super-jednostka": "\u2014",
    Uwagi: "inkaski procarz (huaraca); kr\xF3tki-\u015Bredni zasi\u0119g; dystans | BALANCE: Zasi\u0119g\u21915 (bonus kulturowy Ink\xF3w)",
    "Rola (linia)": "Dystans",
    Pancerz: 2,
    Przebicie: 2,
    "Kara obrony z flanki (%)": 50,
    "Kara obrony z ty\u0142u (%)": 80,
    "Morale bazowe": 85,
    "Morale ucieczki": 25,
    "Nazwa EN": "Slinger (Huaraca)",
    Typ: "Distance",
    Klasa: "Specjalna",
    Nacja: "Inkowie",
    "Bonus vs Swordsman %": 0,
    "Bonus vs Spearman %": 0,
    "Bonus vs Falangite %": 0,
    "Bonus vs Offensive %": 0,
    "Bonus vs Distance %": 0,
    "Bonus vs Mount %": 0,
    "Zmiana na": "Kusznik",
    "Dost\u0119pna w epokach": "Br\u0105z"
  },
  {
    Jednostka: "Oszczepnik (Est\xF3lica)",
    Epoka: "Kamie\u0144",
    Kultura: "Inkowie",
    Tech: "-",
    "Pieni\u0105dz (koszt)": 9,
    Ludno\u015B\u0107: 1,
    Surowiec: "-",
    "Surowiec (ilo\u015B\u0107)": 0,
    "Utrzymanie (Pieni\u0105dz/tur\u0119)": 1,
    "\u017Cywno\u015B\u0107/tur\u0119": 1,
    Atak: 4,
    Uderzenie: 2,
    Obrona: 4,
    Ruch: 2,
    "Ruch w bitwie (heksy)": 3,
    Health: 10,
    "Pr\xF3g dezercji (% health)": 0.5,
    "Widok pola": 2,
    "Atak dystansowy": 8,
    "Zasi\u0119g ataku (hex)": 2,
    "Ilo\u015B\u0107 pocisk\xF3w": 6,
    "W zamian za": "Oszczepnik",
    "Super-jednostka": "\u2014",
    Uwagi: "inkaski oszczepnik (est\xF3lica/atlatl); dystans kr\xF3tki | BALANCE: Atak_dyst\u21914 (odr\xF3\u017Cnienie od bazy Oszczepnika)",
    "Rola (linia)": "Dystans",
    Pancerz: 2,
    Przebicie: 2,
    "Kara obrony z flanki (%)": 50,
    "Kara obrony z ty\u0142u (%)": 80,
    "Morale bazowe": 85,
    "Morale ucieczki": 25,
    "Nazwa EN": "Javelineer (Estolica)",
    Typ: "Distance",
    Klasa: "Specjalna",
    Nacja: "Inkowie",
    "Bonus vs Swordsman %": 0,
    "Bonus vs Spearman %": 0,
    "Bonus vs Falangite %": 0,
    "Bonus vs Offensive %": 0,
    "Bonus vs Distance %": 0,
    "Bonus vs Mount %": 0,
    "Zmiana na": "Kusznik",
    "Dost\u0119pna w epokach": "Kamie\u0144;Br\u0105z"
  },
  {
    Jednostka: "Kr\xF3lewska Gwardia",
    Epoka: "Br\u0105z",
    Kultura: "Inkowie",
    Tech: "-",
    "Pieni\u0105dz (koszt)": 0,
    Ludno\u015B\u0107: 1,
    Surowiec: "braz",
    "Surowiec (ilo\u015B\u0107)": 3,
    "Utrzymanie (Pieni\u0105dz/tur\u0119)": 0,
    "\u017Cywno\u015B\u0107/tur\u0119": 1,
    Atak: 10,
    Uderzenie: 8,
    Obrona: 8,
    Ruch: 3,
    "Ruch w bitwie (heksy)": 4,
    Health: 80,
    "Pr\xF3g dezercji (% health)": 0.1,
    "Widok pola": 3,
    "Atak dystansowy": 0,
    "Zasi\u0119g ataku (hex)": "\u2014",
    "Ilo\u015B\u0107 pocisk\xF3w": "\u2014",
    "W zamian za": "\u2014",
    "Super-jednostka": "TAK",
    Uwagi: "max 1 sztuka; stacjonuje w stolicy; po utracie stolicy odradza si\u0119 w nowej; start jako nowa jednostka w Br\u0105zie; bezp\u0142atna (Koszt=0)",
    "Rola (linia)": "Wr\u0119cz",
    Pancerz: 6,
    Przebicie: 4,
    "Kara obrony z flanki (%)": 15,
    "Kara obrony z ty\u0142u (%)": 30,
    "Morale bazowe": 120,
    "Morale ucieczki": 18,
    "Nazwa EN": "Royal Guard",
    Typ: "Swordsman",
    Klasa: "Super",
    Nacja: "Inkowie",
    "Bonus vs Swordsman %": 0,
    "Bonus vs Spearman %": 15,
    "Bonus vs Falangite %": 0,
    "Bonus vs Offensive %": 0,
    "Bonus vs Distance %": 0,
    "Bonus vs Mount %": 0,
    "Zmiana na": "\u2014",
    "Dost\u0119pna w epokach": "Br\u0105z;\u017Belazo"
  },
  {
    Jednostka: "Rydwan konny",
    Epoka: "Br\u0105z",
    Kultura: null,
    Tech: "Je\u017Adziectwo",
    "Pieni\u0105dz (koszt)": 28,
    Ludno\u015B\u0107: 1,
    Surowiec: "Ko\u0144",
    "Surowiec (ilo\u015B\u0107)": 1,
    "Utrzymanie (Pieni\u0105dz/tur\u0119)": 3,
    "\u017Cywno\u015B\u0107/tur\u0119": 1,
    Atak: 6,
    Uderzenie: 8,
    Obrona: 2,
    Ruch: 4,
    "Ruch w bitwie (heksy)": 6,
    Health: 90,
    "Pr\xF3g dezercji (% health)": 0.3,
    "Widok pola": 4,
    "Atak dystansowy": 0,
    "Zasi\u0119g ataku (hex)": "\u2014",
    "Ilo\u015B\u0107 pocisk\xF3w": "\u2014",
    "W zamian za": "\u2014",
    "Super-jednostka": "\u2014",
    Uwagi: "rydwan na koniach; wymaga dost\u0119pu do Konia; szybszy od rydwanu na wo\u0142ach",
    "Rola (linia)": "Flanka",
    Pancerz: 2,
    Przebicie: 4,
    "Kara obrony z flanki (%)": 25,
    "Kara obrony z ty\u0142u (%)": 40,
    "Morale bazowe": 100,
    "Morale ucieczki": 10,
    "Nazwa EN": "War Chariot",
    Typ: "Mount",
    Klasa: "Standardowa",
    Nacja: "",
    "Bonus vs Swordsman %": 0,
    "Bonus vs Spearman %": 0,
    "Bonus vs Falangite %": 0,
    "Bonus vs Offensive %": 25,
    "Bonus vs Distance %": 50,
    "Bonus vs Mount %": 0,
    "Zmiana na": "Mount",
    "Dost\u0119pna w epokach": "Br\u0105z;\u017Belazo"
  },
  {
    Jednostka: "\u0141ucznik egipski",
    Epoka: "Kamie\u0144",
    Kultura: "Egipt",
    Tech: "\u0141ucznictwo",
    "Pieni\u0105dz (koszt)": 14,
    Ludno\u015B\u0107: 1,
    Surowiec: "drewno",
    "Surowiec (ilo\u015B\u0107)": 4,
    "Utrzymanie (Pieni\u0105dz/tur\u0119)": 1,
    "\u017Cywno\u015B\u0107/tur\u0119": 1,
    Atak: 4,
    Uderzenie: 2,
    Obrona: 6,
    Ruch: 2,
    "Ruch w bitwie (heksy)": 3,
    Health: 20,
    "Pr\xF3g dezercji (% health)": 0.4,
    "Widok pola": 2,
    "Atak dystansowy": 10,
    "Zasi\u0119g ataku (hex)": 4,
    "Ilo\u015B\u0107 pocisk\xF3w": 12,
    "W zamian za": "\u0141ucznik",
    "Super-jednostka": "\u2014",
    Uwagi: "propozycja; jednostka specjalna; \u0142uk kompozytowy (\u0142uk refleksyjny); silniejszy dystans ni\u017C standardowy \u0142ucznik | BALANCE: Koszt\u219114, Pociski\u219312",
    "Rola (linia)": "Dystans",
    Pancerz: 2,
    Przebicie: 2,
    "Kara obrony z flanki (%)": 50,
    "Kara obrony z ty\u0142u (%)": 80,
    "Morale bazowe": 85,
    "Morale ucieczki": 25,
    "Nazwa EN": "Egyptian Archer",
    Typ: "Distance",
    Klasa: "Specjalna",
    Nacja: "Egipt",
    "Bonus vs Swordsman %": 0,
    "Bonus vs Spearman %": 0,
    "Bonus vs Falangite %": 0,
    "Bonus vs Offensive %": 0,
    "Bonus vs Distance %": 0,
    "Bonus vs Mount %": 0,
    "Zmiana na": "Kusznik",
    "Dost\u0119pna w epokach": "Kamie\u0144;Br\u0105z"
  },
  {
    Jednostka: "Rydwan egipski",
    Epoka: "Br\u0105z",
    Kultura: "Egipt",
    Tech: "Je\u017Adziectwo",
    "Pieni\u0105dz (koszt)": 32,
    Ludno\u015B\u0107: 1,
    Surowiec: "Ko\u0144",
    "Surowiec (ilo\u015B\u0107)": 1,
    "Utrzymanie (Pieni\u0105dz/tur\u0119)": 3,
    "\u017Cywno\u015B\u0107/tur\u0119": 1,
    Atak: 4,
    Uderzenie: 6,
    Obrona: 2,
    Ruch: 5,
    "Ruch w bitwie (heksy)": 6,
    Health: 90,
    "Pr\xF3g dezercji (% health)": 0.3,
    "Widok pola": 5,
    "Atak dystansowy": 8,
    "Zasi\u0119g ataku (hex)": 3,
    "Ilo\u015B\u0107 pocisk\xF3w": 14,
    "W zamian za": "Rydwan konny",
    "Super-jednostka": "\u2014",
    Uwagi: "propozycja; RYDWAN-\u0141UCZNICY \u2014 s\u0142abszy w zwarciu, silny dystans; za\u0142oga: wo\u017Anica+\u0142ucznik; du\u017Cy zapas strza\u0142 | BALANCE: Atak\u21934, Uderzenie\u21936, Atak_dyst\u21916, Pociski\u2191\u219114",
    "Rola (linia)": "Flanka",
    Pancerz: 2,
    Przebicie: 4,
    "Kara obrony z flanki (%)": 25,
    "Kara obrony z ty\u0142u (%)": 40,
    "Morale bazowe": 100,
    "Morale ucieczki": 10,
    "Nazwa EN": "Egyptian Chariot",
    Typ: "Mount",
    Klasa: "Specjalna",
    Nacja: "Egipt",
    "Bonus vs Swordsman %": 0,
    "Bonus vs Spearman %": 0,
    "Bonus vs Falangite %": 0,
    "Bonus vs Offensive %": 25,
    "Bonus vs Distance %": 50,
    "Bonus vs Mount %": 0,
    "Zmiana na": "Mount",
    "Dost\u0119pna w epokach": "Br\u0105z;\u017Belazo"
  },
  {
    Jednostka: "Wojownik z khopesh",
    Epoka: "Br\u0105z",
    Kultura: "Egipt",
    Tech: "Br\u0105zownictwo",
    "Pieni\u0105dz (koszt)": 18,
    Ludno\u015B\u0107: 1,
    Surowiec: "braz",
    "Surowiec (ilo\u015B\u0107)": 5,
    "Utrzymanie (Pieni\u0105dz/tur\u0119)": 2,
    "\u017Cywno\u015B\u0107/tur\u0119": 1,
    Atak: 6,
    Uderzenie: 6,
    Obrona: 6,
    Ruch: 2,
    "Ruch w bitwie (heksy)": 3,
    Health: 50,
    "Pr\xF3g dezercji (% health)": 0.25,
    "Widok pola": 2,
    "Atak dystansowy": 0,
    "Zasi\u0119g ataku (hex)": "\u2014",
    "Ilo\u015B\u0107 pocisk\xF3w": "\u2014",
    "W zamian za": "Wojownik z mieczem i tarcz\u0105",
    "Super-jednostka": "\u2014",
    Uwagi: "propozycja; jednostka specjalna; zakrzywiony miecz z br\u0105zu (khopesh); lepszy atak wr\u0119cz ni\u017C standardowy wojownik",
    "Rola (linia)": "Wr\u0119cz",
    Pancerz: 6,
    Przebicie: 4,
    "Kara obrony z flanki (%)": 15,
    "Kara obrony z ty\u0142u (%)": 30,
    "Morale bazowe": 100,
    "Morale ucieczki": 22,
    "Nazwa EN": "Khopesh Warrior",
    Typ: "Swordsman",
    Klasa: "Specjalna",
    Nacja: "Egipt",
    "Bonus vs Swordsman %": 0,
    "Bonus vs Spearman %": 15,
    "Bonus vs Falangite %": 0,
    "Bonus vs Offensive %": 0,
    "Bonus vs Distance %": 0,
    "Bonus vs Mount %": 0,
    "Zmiana na": "Swordsman",
    "Dost\u0119pna w epokach": "Br\u0105z;\u017Belazo"
  },
  {
    Jednostka: "Med\u017Caj (Gwardia Faraona)",
    Epoka: "Br\u0105z",
    Kultura: "Egipt",
    Tech: "\u2014",
    "Pieni\u0105dz (koszt)": 0,
    Ludno\u015B\u0107: 1,
    Surowiec: "\u2014",
    "Surowiec (ilo\u015B\u0107)": 0,
    "Utrzymanie (Pieni\u0105dz/tur\u0119)": 0,
    "\u017Cywno\u015B\u0107/tur\u0119": 1,
    Atak: 10,
    Uderzenie: 8,
    Obrona: 8,
    Ruch: 3,
    "Ruch w bitwie (heksy)": 4,
    Health: 85,
    "Pr\xF3g dezercji (% health)": 0.1,
    "Widok pola": 3,
    "Atak dystansowy": 6,
    "Zasi\u0119g ataku (hex)": 2,
    "Ilo\u015B\u0107 pocisk\xF3w": 6,
    "W zamian za": "\u2014",
    "Super-jednostka": "TAK",
    Uwagi: "propozycja; max 1, bezp\u0142atna, stolica, respawn; elitarna gwardia faraona (Nubia); \u0142uk+miecz+tarcza | BALANCE: Przebicie\u21914 (wyr\xF3wnanie do super-std)",
    "Rola (linia)": "Wr\u0119cz",
    Pancerz: 6,
    Przebicie: 4,
    "Kara obrony z flanki (%)": 15,
    "Kara obrony z ty\u0142u (%)": 30,
    "Morale bazowe": 120,
    "Morale ucieczki": 18,
    "Nazwa EN": "Medjay (Pharaoh's Guard)",
    Typ: "Swordsman",
    Klasa: "Super",
    Nacja: "Egipt",
    "Bonus vs Swordsman %": 0,
    "Bonus vs Spearman %": 15,
    "Bonus vs Falangite %": 0,
    "Bonus vs Offensive %": 0,
    "Bonus vs Distance %": 0,
    "Bonus vs Mount %": 0,
    "Zmiana na": "\u2014",
    "Dost\u0119pna w epokach": "Br\u0105z;\u017Belazo"
  },
  {
    Jednostka: "\u0141ucznik sumeryjski",
    Epoka: "Kamie\u0144",
    Kultura: "Sumerowie",
    Tech: "\u0141ucznictwo",
    "Pieni\u0105dz (koszt)": 9,
    Ludno\u015B\u0107: 1,
    Surowiec: "drewno",
    "Surowiec (ilo\u015B\u0107)": 4,
    "Utrzymanie (Pieni\u0105dz/tur\u0119)": 1,
    "\u017Cywno\u015B\u0107/tur\u0119": 1,
    Atak: 4,
    Uderzenie: 2,
    Obrona: 6,
    Ruch: 2,
    "Ruch w bitwie (heksy)": 3,
    Health: 20,
    "Pr\xF3g dezercji (% health)": 0.4,
    "Widok pola": 2,
    "Atak dystansowy": 8,
    "Zasi\u0119g ataku (hex)": 4,
    "Ilo\u015B\u0107 pocisk\xF3w": 14,
    "W zamian za": "\u0141ucznik",
    "Super-jednostka": "\u2014",
    Uwagi: "propozycja; jednostka specjalna; \u0142ucznik pieszny z \u0142ukiem kompozytowym; solidny dystans, fundament armii sumeryjskiej",
    "Rola (linia)": "Dystans",
    Pancerz: 2,
    Przebicie: 2,
    "Kara obrony z flanki (%)": 50,
    "Kara obrony z ty\u0142u (%)": 80,
    "Morale bazowe": 85,
    "Morale ucieczki": 25,
    "Nazwa EN": "Sumerian Archer",
    Typ: "Distance",
    Klasa: "Specjalna",
    Nacja: "Sumer",
    "Bonus vs Swordsman %": 0,
    "Bonus vs Spearman %": 0,
    "Bonus vs Falangite %": 0,
    "Bonus vs Offensive %": 0,
    "Bonus vs Distance %": 0,
    "Bonus vs Mount %": 0,
    "Zmiana na": "Kusznik",
    "Dost\u0119pna w epokach": "Kamie\u0144;Br\u0105z"
  },
  {
    Jednostka: "Rydwan sumeryjski",
    Epoka: "Br\u0105z",
    Kultura: "Sumerowie",
    Tech: "Je\u017Adziectwo",
    "Pieni\u0105dz (koszt)": 38,
    Ludno\u015B\u0107: 1,
    Surowiec: "Ko\u0144",
    "Surowiec (ilo\u015B\u0107)": 1,
    "Utrzymanie (Pieni\u0105dz/tur\u0119)": 3,
    "\u017Cywno\u015B\u0107/tur\u0119": 1,
    Atak: 8,
    Uderzenie: 10,
    Obrona: 4,
    Ruch: 4,
    "Ruch w bitwie (heksy)": 6,
    Health: 95,
    "Pr\xF3g dezercji (% health)": 0.3,
    "Widok pola": 4,
    "Atak dystansowy": 0,
    "Zasi\u0119g ataku (hex)": "\u2014",
    "Ilo\u015B\u0107 pocisk\xF3w": "\u2014",
    "W zamian za": "Rydwan konny",
    "Super-jednostka": "\u2014",
    Uwagi: "propozycja; MOCNY i DROGI \u2014 jedne z najlepszych rydwan\xF3w staro\u017Cytno\u015Bci; ci\u0119\u017Cki rydwan bojowy; silne uderzenie szar\u017C\u0105; wytrzyma\u0142o\u015B\u0107 Health=95 | BALANCE: Atak\u21918, Uderzenie\u219110, Koszt\u219138",
    "Rola (linia)": "Flanka",
    Pancerz: 2,
    Przebicie: 4,
    "Kara obrony z flanki (%)": 25,
    "Kara obrony z ty\u0142u (%)": 40,
    "Morale bazowe": 100,
    "Morale ucieczki": 10,
    "Nazwa EN": "Sumerian Chariot",
    Typ: "Mount",
    Klasa: "Specjalna",
    Nacja: "Sumer",
    "Bonus vs Swordsman %": 0,
    "Bonus vs Spearman %": 0,
    "Bonus vs Falangite %": 0,
    "Bonus vs Offensive %": 25,
    "Bonus vs Distance %": 50,
    "Bonus vs Mount %": 0,
    "Zmiana na": "Mount",
    "Dost\u0119pna w epokach": "Br\u0105z;\u017Belazo"
  },
  {
    Jednostka: "W\u0142\xF3cznik sumeryjski",
    Epoka: "Br\u0105z",
    Kultura: "Sumerowie",
    Tech: "Br\u0105zownictwo",
    "Pieni\u0105dz (koszt)": 18,
    Ludno\u015B\u0107: 1,
    Surowiec: "braz",
    "Surowiec (ilo\u015B\u0107)": 5,
    "Utrzymanie (Pieni\u0105dz/tur\u0119)": 2,
    "\u017Cywno\u015B\u0107/tur\u0119": 1,
    Atak: 4,
    Uderzenie: 6,
    Obrona: 8,
    Ruch: 2,
    "Ruch w bitwie (heksy)": 3,
    Health: 82,
    "Pr\xF3g dezercji (% health)": 0.25,
    "Widok pola": 2,
    "Atak dystansowy": 0,
    "Zasi\u0119g ataku (hex)": "\u2014",
    "Ilo\u015B\u0107 pocisk\xF3w": "\u2014",
    "W zamian za": "W\u0142\xF3cznik",
    "Super-jednostka": "\u2014",
    Uwagi: "propozycja; jednostka specjalna; ci\u0119\u017Cka piechota w\u0142\xF3cznicza z br\u0105zow\u0105 tarcz\u0105; lepszy pancerz i Obrona ni\u017C standardowy w\u0142\xF3cznik | BALANCE: Health\u219382",
    "Rola (linia)": "Wr\u0119cz",
    Pancerz: 6,
    Przebicie: 2,
    "Kara obrony z flanki (%)": 30,
    "Kara obrony z ty\u0142u (%)": 50,
    "Morale bazowe": 100,
    "Morale ucieczki": 22,
    "Nazwa EN": "Sumerian Spearman",
    Typ: "Spearman",
    Klasa: "Specjalna",
    Nacja: "Sumer",
    "Bonus vs Swordsman %": 0,
    "Bonus vs Spearman %": 0,
    "Bonus vs Falangite %": 0,
    "Bonus vs Offensive %": 0,
    "Bonus vs Distance %": 0,
    "Bonus vs Mount %": 50,
    "Zmiana na": "Spearman",
    "Dost\u0119pna w epokach": "Br\u0105z;\u017Belazo"
  },
  {
    Jednostka: "Gwardia Kr\xF3lewska Sumeru",
    Epoka: "Br\u0105z",
    Kultura: "Sumerowie",
    Tech: "\u2014",
    "Pieni\u0105dz (koszt)": 0,
    Ludno\u015B\u0107: 1,
    Surowiec: "\u2014",
    "Surowiec (ilo\u015B\u0107)": 0,
    "Utrzymanie (Pieni\u0105dz/tur\u0119)": 0,
    "\u017Cywno\u015B\u0107/tur\u0119": 1,
    Atak: 10,
    Uderzenie: 8,
    Obrona: 8,
    Ruch: 2,
    "Ruch w bitwie (heksy)": 4,
    Health: 85,
    "Pr\xF3g dezercji (% health)": 0.1,
    "Widok pola": 2,
    "Atak dystansowy": 0,
    "Zasi\u0119g ataku (hex)": "\u2014",
    "Ilo\u015B\u0107 pocisk\xF3w": "\u2014",
    "W zamian za": "\u2014",
    "Super-jednostka": "TAK",
    Uwagi: "propozycja; max 1, bezp\u0142atna, stolica, respawn; elitarna gwardia kr\xF3lewska (qurubuti); ci\u0119\u017Cka piechota opancerzona; najsilniejsza jednostka piesza",
    "Rola (linia)": "Wr\u0119cz",
    Pancerz: 6,
    Przebicie: 4,
    "Kara obrony z flanki (%)": 15,
    "Kara obrony z ty\u0142u (%)": 30,
    "Morale bazowe": 120,
    "Morale ucieczki": 18,
    "Nazwa EN": "Sumerian Royal Guard",
    Typ: "Swordsman",
    Klasa: "Super",
    Nacja: "Sumer",
    "Bonus vs Swordsman %": 0,
    "Bonus vs Spearman %": 15,
    "Bonus vs Falangite %": 0,
    "Bonus vs Offensive %": 0,
    "Bonus vs Distance %": 0,
    "Bonus vs Mount %": 0,
    "Zmiana na": "\u2014",
    "Dost\u0119pna w epokach": "Br\u0105z;\u017Belazo"
  },
  {
    Jednostka: "Wojownik myke\u0144ski",
    Epoka: "Br\u0105z",
    Kultura: "Grecka",
    Tech: "Br\u0105zownictwo",
    "Pieni\u0105dz (koszt)": 18,
    Ludno\u015B\u0107: 1,
    Surowiec: "braz",
    "Surowiec (ilo\u015B\u0107)": 5,
    "Utrzymanie (Pieni\u0105dz/tur\u0119)": 2,
    "\u017Cywno\u015B\u0107/tur\u0119": 1,
    Atak: 6,
    Uderzenie: 8,
    Obrona: 6,
    Ruch: 2,
    "Ruch w bitwie (heksy)": 3,
    Health: 55,
    "Pr\xF3g dezercji (% health)": 0.25,
    "Widok pola": 2,
    "Atak dystansowy": 0,
    "Zasi\u0119g ataku (hex)": "\u2014",
    "Ilo\u015B\u0107 pocisk\xF3w": "\u2014",
    "W zamian za": "Wojownik z mieczem i tarcz\u0105",
    "Super-jednostka": "\u2014",
    Uwagi: "NOWA; jednostka specjalna myke\u0144ska; tarcza wie\u017Cowa/\xF3semkowa + he\u0142m z k\u0142\xF3w dzika + d\u0142uga w\u0142\xF3cznia, br\u0105z; piechota uderzeniowa epoki br\u0105zu",
    "Rola (linia)": "Wr\u0119cz",
    Pancerz: 6,
    Przebicie: 4,
    "Kara obrony z flanki (%)": 15,
    "Kara obrony z ty\u0142u (%)": 30,
    "Morale bazowe": 100,
    "Morale ucieczki": 22,
    "Nazwa EN": "Mycenaean Warrior",
    Typ: "Swordsman",
    Klasa: "Specjalna",
    Nacja: "Grecja",
    "Bonus vs Swordsman %": 0,
    "Bonus vs Spearman %": 15,
    "Bonus vs Falangite %": 0,
    "Bonus vs Offensive %": 0,
    "Bonus vs Distance %": 0,
    "Bonus vs Mount %": 0,
    "Zmiana na": "Swordsman",
    "Dost\u0119pna w epokach": "Br\u0105z;\u017Belazo"
  },
  {
    Jednostka: "Rydwan myke\u0144ski",
    Epoka: "Br\u0105z",
    Kultura: "Grecka",
    Tech: "Je\u017Adziectwo",
    "Pieni\u0105dz (koszt)": 30,
    Ludno\u015B\u0107: 1,
    Surowiec: "Ko\u0144",
    "Surowiec (ilo\u015B\u0107)": 1,
    "Utrzymanie (Pieni\u0105dz/tur\u0119)": 3,
    "\u017Cywno\u015B\u0107/tur\u0119": 1,
    Atak: 6,
    Uderzenie: 8,
    Obrona: 2,
    Ruch: 4,
    "Ruch w bitwie (heksy)": 6,
    Health: 90,
    "Pr\xF3g dezercji (% health)": 0.3,
    "Widok pola": 4,
    "Atak dystansowy": 0,
    "Zasi\u0119g ataku (hex)": "\u2014",
    "Ilo\u015B\u0107 pocisk\xF3w": "\u2014",
    "W zamian za": "Rydwan konny",
    "Super-jednostka": "\u2014",
    Uwagi: "NOWA; myke\u0144ski rydwan bojowy na 2 konie; za\u0142oga wo\u017Anica + wojownik z w\u0142\xF3czni\u0105; mobilna flanka epoki br\u0105zu",
    "Rola (linia)": "Flanka",
    Pancerz: 2,
    Przebicie: 4,
    "Kara obrony z flanki (%)": 25,
    "Kara obrony z ty\u0142u (%)": 40,
    "Morale bazowe": 100,
    "Morale ucieczki": 10,
    "Nazwa EN": "Mycenaean Chariot",
    Typ: "Mount",
    Klasa: "Specjalna",
    Nacja: "Grecja",
    "Bonus vs Swordsman %": 0,
    "Bonus vs Spearman %": 0,
    "Bonus vs Falangite %": 0,
    "Bonus vs Offensive %": 25,
    "Bonus vs Distance %": 50,
    "Bonus vs Mount %": 0,
    "Zmiana na": "Mount",
    "Dost\u0119pna w epokach": "Br\u0105z;\u017Belazo"
  },
  {
    Jednostka: "Wojownik Sherden",
    Epoka: "Br\u0105z",
    Kultura: null,
    Tech: "Br\u0105zownictwo",
    "Pieni\u0105dz (koszt)": 18,
    Ludno\u015B\u0107: 1,
    Surowiec: "braz",
    "Surowiec (ilo\u015B\u0107)": 5,
    "Utrzymanie (Pieni\u0105dz/tur\u0119)": 2,
    "\u017Cywno\u015B\u0107/tur\u0119": 1,
    Atak: 7,
    Uderzenie: 6,
    Obrona: 6,
    Ruch: 2,
    "Ruch w bitwie (heksy)": 3,
    Health: 55,
    "Pr\xF3g dezercji (% health)": 0.25,
    "Widok pola": 2,
    "Atak dystansowy": 0,
    "Zasi\u0119g ataku (hex)": "\u2014",
    "Ilo\u015B\u0107 pocisk\xF3w": "\u2014",
    "W zamian za": "Wojownik z mieczem i tarcz\u0105",
    "Super-jednostka": "\u2014",
    Uwagi: "NOWA; Ludy Morza (region \u015Br\xF3dziemnomorski); rogaty he\u0142m + okr\u0105g\u0142a tarcza + prosty miecz z br\u0105zu; najemna piechota uderzeniowa",
    "Rola (linia)": "Wr\u0119cz",
    Pancerz: 4,
    Przebicie: 4,
    "Kara obrony z flanki (%)": 15,
    "Kara obrony z ty\u0142u (%)": 30,
    "Morale bazowe": 100,
    "Morale ucieczki": 22,
    "Nazwa EN": "Sherden Warrior",
    Typ: "Swordsman",
    Klasa: "Specjalna",
    Nacja: "Ludy Morza",
    "Bonus vs Swordsman %": 0,
    "Bonus vs Spearman %": 15,
    "Bonus vs Falangite %": 0,
    "Bonus vs Offensive %": 0,
    "Bonus vs Distance %": 0,
    "Bonus vs Mount %": 0,
    "Zmiana na": "Swordsman",
    "Dost\u0119pna w epokach": "Br\u0105z;\u017Belazo"
  },
  {
    Jednostka: "Halabardnik Shang",
    Epoka: "Br\u0105z",
    Kultura: "Chi\u0144czycy",
    Tech: "Br\u0105zownictwo",
    "Pieni\u0105dz (koszt)": 18,
    Ludno\u015B\u0107: 1,
    Surowiec: "braz",
    "Surowiec (ilo\u015B\u0107)": 5,
    "Utrzymanie (Pieni\u0105dz/tur\u0119)": 2,
    "\u017Cywno\u015B\u0107/tur\u0119": 1,
    Atak: 7,
    Uderzenie: 6,
    Obrona: 5,
    Ruch: 2,
    "Ruch w bitwie (heksy)": 3,
    Health: 50,
    "Pr\xF3g dezercji (% health)": 0.25,
    "Widok pola": 2,
    "Atak dystansowy": 0,
    "Zasi\u0119g ataku (hex)": "\u2014",
    "Ilo\u015B\u0107 pocisk\xF3w": "\u2014",
    "W zamian za": "Wojownik z mieczem i tarcz\u0105",
    "Super-jednostka": "\u2014",
    Uwagi: "NOWA; chi\u0144ski halabardnik dynastii Shang; sztylet-top\xF3r (ge) osadzony na drzewcu; lamelarny pancerz lakier-czerwony + chi\u0144ski he\u0142m; bro\u0144 drzewcowa wr\u0119cz",
    "Rola (linia)": "Wr\u0119cz",
    Pancerz: 4,
    Przebicie: 6,
    "Kara obrony z flanki (%)": 15,
    "Kara obrony z ty\u0142u (%)": 30,
    "Morale bazowe": 110,
    "Morale ucieczki": 25,
    "Nazwa EN": "Shang Halberdier",
    Typ: "Swordsman",
    Klasa: "Specjalna",
    Nacja: "Chiny",
    "Bonus vs Swordsman %": 0,
    "Bonus vs Spearman %": 15,
    "Bonus vs Falangite %": 0,
    "Bonus vs Offensive %": 0,
    "Bonus vs Distance %": 0,
    "Bonus vs Mount %": 0,
    "Zmiana na": "Swordsman",
    "Dost\u0119pna w epokach": "Br\u0105z;\u017Belazo"
  },
  {
    Jednostka: "Rydwan Shang",
    Epoka: "Br\u0105z",
    Kultura: "Chi\u0144czycy",
    Tech: "Je\u017Adziectwo",
    "Pieni\u0105dz (koszt)": 32,
    Ludno\u015B\u0107: 1,
    Surowiec: "Ko\u0144",
    "Surowiec (ilo\u015B\u0107)": 1,
    "Utrzymanie (Pieni\u0105dz/tur\u0119)": 3,
    "\u017Cywno\u015B\u0107/tur\u0119": 1,
    Atak: 6,
    Uderzenie: 8,
    Obrona: 2,
    Ruch: 4,
    "Ruch w bitwie (heksy)": 6,
    Health: 95,
    "Pr\xF3g dezercji (% health)": 0.3,
    "Widok pola": 4,
    "Atak dystansowy": 0,
    "Zasi\u0119g ataku (hex)": "\u2014",
    "Ilo\u015B\u0107 pocisk\xF3w": "\u2014",
    "W zamian za": "Rydwan konny",
    "Super-jednostka": "\u2014",
    Uwagi: "NOWA; ci\u0119\u017Cki rydwan dynastii Shang na 2 konie; za\u0142oga 3 (wo\u017Anica + halabardnik ge + \u0142ucznik); platforma dowodzenia",
    "Rola (linia)": "Flanka",
    Pancerz: 2,
    Przebicie: 4,
    "Kara obrony z flanki (%)": 25,
    "Kara obrony z ty\u0142u (%)": 40,
    "Morale bazowe": 100,
    "Morale ucieczki": 10,
    "Nazwa EN": "Shang Chariot",
    Typ: "Mount",
    Klasa: "Specjalna",
    Nacja: "Chiny",
    "Bonus vs Swordsman %": 0,
    "Bonus vs Spearman %": 0,
    "Bonus vs Falangite %": 0,
    "Bonus vs Offensive %": 25,
    "Bonus vs Distance %": 50,
    "Bonus vs Mount %": 0,
    "Zmiana na": "Mount",
    "Dost\u0119pna w epokach": "Br\u0105z;\u017Belazo"
  },
  {
    Jednostka: "\u0141ucznik akadyjski",
    Epoka: "Br\u0105z",
    Kultura: "Sumerowie",
    Tech: "\u0141ucznictwo",
    "Pieni\u0105dz (koszt)": 16,
    Ludno\u015B\u0107: 1,
    Surowiec: "drewno",
    "Surowiec (ilo\u015B\u0107)": 5,
    "Utrzymanie (Pieni\u0105dz/tur\u0119)": 2,
    "\u017Cywno\u015B\u0107/tur\u0119": 1,
    Atak: 4,
    Uderzenie: 2,
    Obrona: 6,
    Ruch: 2,
    "Ruch w bitwie (heksy)": 3,
    Health: 25,
    "Pr\xF3g dezercji (% health)": 0.4,
    "Widok pola": 2,
    "Atak dystansowy": 11,
    "Zasi\u0119g ataku (hex)": 4,
    "Ilo\u015B\u0107 pocisk\xF3w": 14,
    "W zamian za": "\u0141ucznik",
    "Super-jednostka": "\u2014",
    Uwagi: "NOWA; \u0142ucznik akadyjski z \u0142ukiem kompozytowym; he\u0142m sto\u017Ckowy + szata; silny dystans imperium akadyjskiego",
    "Rola (linia)": "Dystans",
    Pancerz: 2,
    Przebicie: 2,
    "Kara obrony z flanki (%)": 50,
    "Kara obrony z ty\u0142u (%)": 80,
    "Morale bazowe": 85,
    "Morale ucieczki": 25,
    "Nazwa EN": "Akkadian Archer",
    Typ: "Distance",
    Klasa: "Specjalna",
    Nacja: "Sumer",
    "Bonus vs Swordsman %": 0,
    "Bonus vs Spearman %": 0,
    "Bonus vs Falangite %": 0,
    "Bonus vs Offensive %": 0,
    "Bonus vs Distance %": 0,
    "Bonus vs Mount %": 0,
    "Zmiana na": "Kusznik",
    "Dost\u0119pna w epokach": "Br\u0105z;\u017Belazo"
  },
  {
    Jednostka: "Wojownik celtycki",
    Epoka: "\u017Belazo",
    Kultura: "Celtowie",
    Tech: "Br\u0105zownictwo",
    "Pieni\u0105dz (koszt)": 18,
    Ludno\u015B\u0107: 1,
    Surowiec: "braz",
    "Surowiec (ilo\u015B\u0107)": 5,
    "Utrzymanie (Pieni\u0105dz/tur\u0119)": 2,
    "\u017Cywno\u015B\u0107/tur\u0119": 1,
    Atak: 8,
    Uderzenie: 6,
    Obrona: 5,
    Ruch: 2,
    "Ruch w bitwie (heksy)": 4,
    Health: 55,
    "Pr\xF3g dezercji (% health)": 0.3,
    "Widok pola": 2,
    "Atak dystansowy": 0,
    "Zasi\u0119g ataku (hex)": "\u2014",
    "Ilo\u015B\u0107 pocisk\xF3w": "\u2014",
    "W zamian za": "Wojownik",
    "Super-jednostka": "\u2014",
    Uwagi: "NOWA; celtycki wojownik z d\u0142ugim \u017Celaznym mieczem siecznym + wysok\u0105 owaln\u0105 tarcz\u0105; tunika w paski + torc; gwa\u0142towna szar\u017Ca, s\u0142absza obrona",
    "Rola (linia)": "Wr\u0119cz",
    Pancerz: 3,
    Przebicie: 4,
    "Kara obrony z flanki (%)": 20,
    "Kara obrony z ty\u0142u (%)": 35,
    "Morale bazowe": 100,
    "Morale ucieczki": 22,
    "Nazwa EN": "Celtic Warrior",
    Typ: "Swordsman",
    Klasa: "Specjalna",
    Nacja: "Celtowie",
    "Bonus vs Swordsman %": 0,
    "Bonus vs Spearman %": 15,
    "Bonus vs Falangite %": 0,
    "Bonus vs Offensive %": 0,
    "Bonus vs Distance %": 0,
    "Bonus vs Mount %": 0,
    "Zmiana na": "Swordsman",
    "Dost\u0119pna w epokach": "\u017Belazo"
  },
  {
    Jednostka: "Gaesatae",
    Epoka: "\u017Belazo",
    Kultura: "Celtowie",
    Tech: "Br\u0105zownictwo",
    "Pieni\u0105dz (koszt)": 14,
    Ludno\u015B\u0107: 1,
    Surowiec: "braz",
    "Surowiec (ilo\u015B\u0107)": 3,
    "Utrzymanie (Pieni\u0105dz/tur\u0119)": 1,
    "\u017Cywno\u015B\u0107/tur\u0119": 1,
    Atak: 10,
    Uderzenie: 8,
    Obrona: 2,
    Ruch: 3,
    "Ruch w bitwie (heksy)": 5,
    Health: 45,
    "Pr\xF3g dezercji (% health)": 0.1,
    "Widok pola": 3,
    "Atak dystansowy": 0,
    "Zasi\u0119g ataku (hex)": "\u2014",
    "Ilo\u015B\u0107 pocisk\xF3w": "\u2014",
    "W zamian za": "\u2014",
    "Super-jednostka": "\u2014",
    Uwagi: "NOWA; nadzy celtyccy wojownicy szturmowi; walcz\u0105 nago z torciem, owaln\u0105 tarcz\u0105 i w\u0142\xF3czni\u0105/oszczepami; berserk-szar\u017Ca, bardzo wysokie morale, niemal zerowa obrona",
    "Rola (linia)": "Wr\u0119cz",
    Pancerz: 0,
    Przebicie: 2,
    "Kara obrony z flanki (%)": 25,
    "Kara obrony z ty\u0142u (%)": 40,
    "Morale bazowe": 85,
    "Morale ucieczki": 25,
    "Nazwa EN": "Gaesatae",
    Typ: "Swordsman",
    Klasa: "Specjalna",
    Nacja: "Celtowie",
    "Bonus vs Swordsman %": 0,
    "Bonus vs Spearman %": 15,
    "Bonus vs Falangite %": 0,
    "Bonus vs Offensive %": 0,
    "Bonus vs Distance %": 0,
    "Bonus vs Mount %": 0,
    "Zmiana na": "Swordsman",
    "Dost\u0119pna w epokach": "\u017Belazo"
  },
  {
    Jednostka: "Rydwan celtycki",
    Epoka: "\u017Belazo",
    Kultura: "Celtowie",
    Tech: "Je\u017Adziectwo",
    "Pieni\u0105dz (koszt)": 28,
    Ludno\u015B\u0107: 1,
    Surowiec: "Ko\u0144",
    "Surowiec (ilo\u015B\u0107)": 1,
    "Utrzymanie (Pieni\u0105dz/tur\u0119)": 3,
    "\u017Cywno\u015B\u0107/tur\u0119": 1,
    Atak: 7,
    Uderzenie: 8,
    Obrona: 2,
    Ruch: 4,
    "Ruch w bitwie (heksy)": 6,
    Health: 85,
    "Pr\xF3g dezercji (% health)": 0.3,
    "Widok pola": 4,
    "Atak dystansowy": 0,
    "Zasi\u0119g ataku (hex)": "\u2014",
    "Ilo\u015B\u0107 pocisk\xF3w": "\u2014",
    "W zamian za": "Rydwan konny",
    "Super-jednostka": "\u2014",
    Uwagi: "NOWA; lekki celtycki rydwan bojowy na 2 konie; wo\u017Anica + wojownik z oszczepami/mieczem; szybka harcownicza flanka",
    "Rola (linia)": "Flanka",
    Pancerz: 1,
    Przebicie: 4,
    "Kara obrony z flanki (%)": 25,
    "Kara obrony z ty\u0142u (%)": 40,
    "Morale bazowe": 100,
    "Morale ucieczki": 10,
    "Nazwa EN": "Celtic Chariot",
    Typ: "Mount",
    Klasa: "Specjalna",
    Nacja: "Celtowie",
    "Bonus vs Swordsman %": 0,
    "Bonus vs Spearman %": 0,
    "Bonus vs Falangite %": 0,
    "Bonus vs Offensive %": 25,
    "Bonus vs Distance %": 50,
    "Bonus vs Mount %": 0,
    "Zmiana na": "Mount",
    "Dost\u0119pna w epokach": "\u017Belazo"
  },
  {
    Jednostka: "Wojownik germa\u0144ski",
    Epoka: "\u017Belazo",
    Kultura: "Germanie",
    Tech: "Br\u0105zownictwo",
    "Pieni\u0105dz (koszt)": 16,
    Ludno\u015B\u0107: 1,
    Surowiec: "braz",
    "Surowiec (ilo\u015B\u0107)": 4,
    "Utrzymanie (Pieni\u0105dz/tur\u0119)": 2,
    "\u017Cywno\u015B\u0107/tur\u0119": 1,
    Atak: 6,
    Uderzenie: 7,
    Obrona: 6,
    Ruch: 3,
    "Ruch w bitwie (heksy)": 4,
    Health: 60,
    "Pr\xF3g dezercji (% health)": 0.2,
    "Widok pola": 3,
    "Atak dystansowy": 7,
    "Zasi\u0119g ataku (hex)": 2,
    "Ilo\u015B\u0107 pocisk\xF3w": 4,
    "W zamian za": "W\u0142\xF3cznik",
    "Super-jednostka": "\u2014",
    Uwagi: "NOWA; germa\u0144ski wojownik z frame\u0105 (kr\xF3tka w\u0142\xF3cznia do pchni\u0119cia i rzutu) + okr\u0105g\u0142a/heksagonalna tarcza drewniano-sk\xF3rzana; futrzany p\u0142aszcz, ma\u0142o/brak pancerza; walka w lesie i zasadzki",
    "Rola (linia)": "Wr\u0119cz",
    Pancerz: 2,
    Przebicie: 2,
    "Kara obrony z flanki (%)": 30,
    "Kara obrony z ty\u0142u (%)": 50,
    "Morale bazowe": 100,
    "Morale ucieczki": 22,
    "Nazwa EN": "Germanic Warrior",
    Typ: "Swordsman",
    Klasa: "Specjalna",
    Nacja: "Germanie",
    "Bonus vs Swordsman %": 0,
    "Bonus vs Spearman %": 15,
    "Bonus vs Falangite %": 0,
    "Bonus vs Offensive %": 0,
    "Bonus vs Distance %": 0,
    "Bonus vs Mount %": 0,
    "Zmiana na": "Swordsman",
    "Dost\u0119pna w epokach": "\u017Belazo"
  },
  {
    Jednostka: "Berserker germa\u0144ski",
    Epoka: "\u017Belazo",
    Kultura: "Germanie",
    Tech: "Br\u0105zownictwo",
    "Pieni\u0105dz (koszt)": 16,
    Ludno\u015B\u0107: 1,
    Surowiec: "braz",
    "Surowiec (ilo\u015B\u0107)": 3,
    "Utrzymanie (Pieni\u0105dz/tur\u0119)": 2,
    "\u017Cywno\u015B\u0107/tur\u0119": 1,
    Atak: 10,
    Uderzenie: 8,
    Obrona: 2,
    Ruch: 3,
    "Ruch w bitwie (heksy)": 5,
    Health: 50,
    "Pr\xF3g dezercji (% health)": 0.1,
    "Widok pola": 3,
    "Atak dystansowy": 0,
    "Zasi\u0119g ataku (hex)": "\u2014",
    "Ilo\u015B\u0107 pocisk\xF3w": "\u2014",
    "W zamian za": "Wojownik z mieczem i tarcz\u0105",
    "Super-jednostka": "\u2014",
    Uwagi: "NOWA; germa\u0144ski berserk; obna\u017Cona pier\u015B, sk\xF3ra wilka/nied\u017Awiedzia (\u0142eb zwierz\u0119cia na g\u0142owie), top\xF3r lub miecz, bez tarczy; sza\u0142 bojowy (+Atak, \u2212Obrona)",
    "Rola (linia)": "Wr\u0119cz",
    Pancerz: 0,
    Przebicie: 4,
    "Kara obrony z flanki (%)": 25,
    "Kara obrony z ty\u0142u (%)": 40,
    "Morale bazowe": 120,
    "Morale ucieczki": 5,
    "Nazwa EN": "Germanic Berserker",
    Typ: "Swordsman",
    Klasa: "Specjalna",
    Nacja: "Germanie",
    "Bonus vs Swordsman %": 0,
    "Bonus vs Spearman %": 15,
    "Bonus vs Falangite %": 0,
    "Bonus vs Offensive %": 0,
    "Bonus vs Distance %": 0,
    "Bonus vs Mount %": 0,
    "Zmiana na": "Swordsman",
    "Dost\u0119pna w epokach": "\u017Belazo"
  },
  {
    Jednostka: "Taran",
    Epoka: "Kamie\u0144",
    Kultura: null,
    Tech: "-",
    "Pieni\u0105dz (koszt)": 14,
    Ludno\u015B\u0107: 1,
    Surowiec: "-",
    "Surowiec (ilo\u015B\u0107)": 0,
    "Utrzymanie (Pieni\u0105dz/tur\u0119)": 1,
    "\u017Cywno\u015B\u0107/tur\u0119": 1,
    Atak: 3,
    Uderzenie: 10,
    Obrona: 2,
    Ruch: 1,
    "Ruch w bitwie (heksy)": 2,
    Health: 1400,
    "Pr\xF3g dezercji (% health)": null,
    "Widok pola": 1,
    "Atak dystansowy": 0,
    "Zasi\u0119g ataku (hex)": "\u2014",
    "Ilo\u015B\u0107 pocisk\xF3w": "\u2014",
    "W zamian za": "\u2014",
    "Super-jednostka": "\u2014",
    Uwagi: "Machina obl\u0119\u017Cnicza; \u0142amie BRAM\u0118 i mur (wysokie Przebicie/Uderzenie), s\u0142aba vs jednostki; budowana podczas obl\u0119\u017Cenia (1 tura); niez\u0142omny (machina nie routuje)",
    "Rola (linia)": "Obl\u0119\u017Cnicza",
    Pancerz: 8,
    Przebicie: 8,
    "Kara obrony z flanki (%)": "\u2014",
    "Kara obrony z ty\u0142u (%)": "\u2014",
    "Morale bazowe": 100,
    "Morale ucieczki": null,
    "Nazwa EN": "Battering Ram",
    Typ: "Siege",
    Klasa: "Specjalna",
    Nacja: "",
    "Bonus vs Swordsman %": 0,
    "Bonus vs Spearman %": 0,
    "Bonus vs Falangite %": 0,
    "Bonus vs Offensive %": 0,
    "Bonus vs Distance %": 0,
    "Bonus vs Mount %": 0,
    "Zmiana na": "\u2014",
    "Dost\u0119pna w epokach": "Kamie\u0144;Br\u0105z;\u017Belazo"
  },
  {
    Jednostka: "Katapulta",
    Epoka: "\u017Belazo",
    Kultura: null,
    Tech: "Obl\u0119\u017Cnictwo",
    "Pieni\u0105dz (koszt)": 18,
    Ludno\u015B\u0107: 1,
    Surowiec: "-",
    "Surowiec (ilo\u015B\u0107)": 0,
    "Utrzymanie (Pieni\u0105dz/tur\u0119)": 2,
    "\u017Cywno\u015B\u0107/tur\u0119": 1,
    Atak: 1,
    Uderzenie: 0,
    Obrona: 1,
    Ruch: 1,
    "Ruch w bitwie (heksy)": 1,
    Health: 500,
    "Pr\xF3g dezercji (% health)": null,
    "Widok pola": 1,
    "Atak dystansowy": 16,
    "Zasi\u0119g ataku (hex)": 6,
    "Ilo\u015B\u0107 pocisk\xF3w": 10,
    "W zamian za": "\u2014",
    "Super-jednostka": "\u2014",
    Uwagi: "Machina obl\u0119\u017Cnicza dystansowa (\u017Belazo); burzy mur/bram\u0119 z dystansu; budowana w Warsztacie oble\u017Cniczym w mie\u015Bcie (maWarsztatOblezniczy), do\u0142\u0105czana do armii przed obl\u0119\u017Ceniem \u2014 NIE in-siege; niez\u0142omny",
    "Rola (linia)": "Obl\u0119\u017Cnicza",
    Pancerz: 0,
    Przebicie: 6,
    "Kara obrony z flanki (%)": "\u2014",
    "Kara obrony z ty\u0142u (%)": "\u2014",
    "Morale bazowe": 100,
    "Morale ucieczki": null,
    "Nazwa EN": "Catapult",
    Typ: "Siege",
    Klasa: "Specjalna",
    Nacja: "",
    "Bonus vs Swordsman %": 0,
    "Bonus vs Spearman %": 0,
    "Bonus vs Falangite %": 0,
    "Bonus vs Offensive %": 0,
    "Bonus vs Distance %": 0,
    "Bonus vs Mount %": 0,
    "Zmiana na": "\u2014",
    "Dost\u0119pna w epokach": "\u017Belazo"
  },
  {
    Jednostka: "Wie\u017Ca obl\u0119\u017Cnicza",
    Epoka: "Br\u0105z",
    Kultura: null,
    Tech: "Br\u0105zownictwo",
    "Pieni\u0105dz (koszt)": 20,
    Ludno\u015B\u0107: 1,
    Surowiec: "-",
    "Surowiec (ilo\u015B\u0107)": 0,
    "Utrzymanie (Pieni\u0105dz/tur\u0119)": 2,
    "\u017Cywno\u015B\u0107/tur\u0119": 1,
    Atak: 0,
    Uderzenie: 0,
    Obrona: 4,
    Ruch: 1,
    "Ruch w bitwie (heksy)": 2,
    Health: 1800,
    "Pr\xF3g dezercji (% health)": null,
    "Widok pola": 1,
    "Atak dystansowy": 0,
    "Zasi\u0119g ataku (hex)": "\u2014",
    "Ilo\u015B\u0107 pocisk\xF3w": "\u2014",
    "W zamian za": "\u2014",
    "Super-jednostka": "\u2014",
    Uwagi: "Machina obl\u0119\u017Cnicza; umo\u017Cliwia piechocie wej\u015Bcie NA MUR (pomost przez blanki), sama nie atakuje; os\u0142ona; budowana podczas obl\u0119\u017Cenia (1 tura); niez\u0142omny",
    "Rola (linia)": "Obl\u0119\u017Cnicza",
    Pancerz: 6,
    Przebicie: 0,
    "Kara obrony z flanki (%)": "\u2014",
    "Kara obrony z ty\u0142u (%)": "\u2014",
    "Morale bazowe": 100,
    "Morale ucieczki": null,
    "Nazwa EN": "Siege Tower",
    Typ: "Siege",
    Klasa: "Specjalna",
    Nacja: "",
    "Bonus vs Swordsman %": 0,
    "Bonus vs Spearman %": 0,
    "Bonus vs Falangite %": 0,
    "Bonus vs Offensive %": 0,
    "Bonus vs Distance %": 0,
    "Bonus vs Mount %": 0,
    "Zmiana na": "\u2014",
    "Dost\u0119pna w epokach": "Br\u0105z;\u017Belazo"
  },
  {
    Jednostka: "Wojownik tyrre\u0144ski",
    Epoka: "Br\u0105z",
    Kultura: "Rzymska",
    Tech: "Br\u0105zownictwo",
    "Pieni\u0105dz (koszt)": 15,
    Ludno\u015B\u0107: 1,
    Surowiec: "braz",
    "Surowiec (ilo\u015B\u0107)": 4,
    "Utrzymanie (Pieni\u0105dz/tur\u0119)": 2,
    "\u017Cywno\u015B\u0107/tur\u0119": 1,
    Atak: 8,
    Uderzenie: 7,
    Obrona: 4,
    Ruch: 2,
    "Ruch w bitwie (heksy)": 4,
    Health: 50,
    "Pr\xF3g dezercji (% health)": 0.2,
    "Widok pola": 2,
    "Atak dystansowy": 0,
    "Zasi\u0119g ataku (hex)": "\u2014",
    "Ilo\u015B\u0107 pocisk\xF3w": "\u2014",
    "W zamian za": "\u2014",
    "Super-jednostka": "\u2014",
    Uwagi: "Lud Morza z Italii (Tursza/Teresz, przodkowie Etrusk\xF3w); abordazowy przelamujacy \u2014 TOPOR/tasak + okragla tarcza; broda, spiczasty helm, medalion",
    "Rola (linia)": "Wr\u0119cz",
    Pancerz: 3,
    Przebicie: 5,
    "Kara obrony z flanki (%)": 20,
    "Kara obrony z ty\u0142u (%)": 35,
    "Morale bazowe": 100,
    "Morale ucieczki": 22,
    "Nazwa EN": "Tyrrhenian Warrior",
    Typ: "Offensive",
    Klasa: "Specjalna",
    Nacja: "Rzym",
    "Bonus vs Swordsman %": 0,
    "Bonus vs Spearman %": 0,
    "Bonus vs Falangite %": 0,
    "Bonus vs Offensive %": 0,
    "Bonus vs Distance %": 15,
    "Bonus vs Mount %": 0,
    "Zmiana na": "Offensive",
    "Dost\u0119pna w epokach": "Br\u0105z;\u017Belazo"
  },
  {
    Jednostka: "Wojownik szekelesz",
    Epoka: "Br\u0105z",
    Kultura: "Rzymska",
    Tech: "Br\u0105zownictwo",
    "Pieni\u0105dz (koszt)": 14,
    Ludno\u015B\u0107: 1,
    Surowiec: "braz",
    "Surowiec (ilo\u015B\u0107)": 3,
    "Utrzymanie (Pieni\u0105dz/tur\u0119)": 2,
    "\u017Cywno\u015B\u0107/tur\u0119": 1,
    Atak: 5,
    Uderzenie: 5,
    Obrona: 7,
    Ruch: 2,
    "Ruch w bitwie (heksy)": 3,
    Health: 55,
    "Pr\xF3g dezercji (% health)": 0.2,
    "Widok pola": 2,
    "Atak dystansowy": 0,
    "Zasi\u0119g ataku (hex)": "\u2014",
    "Ilo\u015B\u0107 pocisk\xF3w": "\u2014",
    "W zamian za": "W\u0142\xF3cznik",
    "Super-jednostka": "\u2014",
    Uwagi: "Lud Morza z poludniowej Italii (Szekelesz); wlocznia + okragla tarcza, helm z opaska/fredzlami",
    "Rola (linia)": "Wr\u0119cz",
    Pancerz: 4,
    Przebicie: 5,
    "Kara obrony z flanki (%)": 20,
    "Kara obrony z ty\u0142u (%)": 35,
    "Morale bazowe": 100,
    "Morale ucieczki": 22,
    "Nazwa EN": "Shekelesh Warrior",
    Typ: "Spearman",
    Klasa: "Specjalna",
    Nacja: "Rzym",
    "Bonus vs Swordsman %": 0,
    "Bonus vs Spearman %": 0,
    "Bonus vs Falangite %": 0,
    "Bonus vs Offensive %": 0,
    "Bonus vs Distance %": 0,
    "Bonus vs Mount %": 25,
    "Zmiana na": "Spearman",
    "Dost\u0119pna w epokach": "Br\u0105z;\u017Belazo"
  }
];

// data/buildings.json
var buildings_default = [
  {
    id: "stolarnia",
    nazwa: "Stolarnia",
    kategoria: "Produkcja",
    epokaWejscia: 1,
    maksPoziom: 10,
    nazwyPoziomow: [
      "Obrobka desek",
      "Stolarnia",
      "Manufaktura drewna",
      "Ciesielstwo",
      "Szopa stolarska",
      "Warsztaty drewniane",
      "Hala produkcji",
      "Fabryka mebli",
      "Drewniana korporacja",
      "Wiezowiec z drewna"
    ],
    baza: {
      praca: 5,
      pieniadz: 0,
      zywnosc: 0,
      nauka: 0,
      kultura: 0,
      zadowolenie: 0,
      obrona: 0,
      mnoznik: 0
    },
    przyrost: {
      praca: 3,
      pieniadz: 0,
      zywnosc: 0,
      nauka: 0,
      kultura: 0,
      zadowolenie: 0,
      obrona: 0,
      mnoznik: 0
    },
    kosztBudowy: 20,
    przyrostKosztu: 10,
    utrzymanie: 1,
    przyrostUtrzymania: 0,
    wymagania: "las w zasiegu",
    uwagi: "",
    techUnlock: "Obr\xF3bka drewna"
  },
  {
    id: "kamieniarski",
    nazwa: "Warsztat kamieniarski",
    kategoria: "Produkcja",
    epokaWejscia: 1,
    maksPoziom: 10,
    nazwyPoziomow: [],
    baza: {
      praca: 4,
      pieniadz: 0,
      zywnosc: 0,
      nauka: 0,
      kultura: 0,
      zadowolenie: 0,
      obrona: 0,
      mnoznik: 0
    },
    przyrost: {
      praca: 2,
      pieniadz: 0,
      zywnosc: 0,
      nauka: 0,
      kultura: 0,
      zadowolenie: 0,
      obrona: 0,
      mnoznik: 0
    },
    kosztBudowy: 20,
    przyrostKosztu: 10,
    utrzymanie: 1,
    przyrostUtrzymania: 0,
    wymagania: "kamien w zasiegu",
    uwagi: "",
    techUnlock: "Murarstwo"
  },
  {
    id: "kuznia",
    nazwa: "Kuznia",
    kategoria: "Produkcja+Wojsko",
    epokaWejscia: 2,
    maksPoziom: 10,
    nazwyPoziomow: [],
    baza: {
      praca: 6,
      pieniadz: 1,
      zywnosc: 0,
      nauka: 0,
      kultura: 0,
      zadowolenie: 0,
      obrona: 0,
      mnoznik: 5
    },
    przyrost: {
      praca: 3,
      pieniadz: 0,
      zywnosc: 0,
      nauka: 0,
      kultura: 0,
      zadowolenie: 0,
      obrona: 0,
      mnoznik: 2
    },
    kosztBudowy: 30,
    przyrostKosztu: 10,
    utrzymanie: 2,
    przyrostUtrzymania: 1,
    wymagania: "miedz lub cyna w zasiegu",
    uwagi: "Mnoznik % dotyczy sily jednostek produkowanych w miescie",
    techUnlock: "Br\u0105zownictwo"
  },
  {
    id: "targowisko",
    nazwa: "Targowisko (Rynek)",
    kategoria: "Pieniadz",
    epokaWejscia: 1,
    maksPoziom: 10,
    nazwyPoziomow: [
      "Targowisko",
      "Rynek",
      "Gielda",
      "Dom handlowy",
      "Kompania kupiecka",
      "Bank regionalny",
      "Izba handlowa",
      "Dom finansowy",
      "Gielda papierow wartosciowych",
      "Centralny bank"
    ],
    baza: {
      praca: 0,
      pieniadz: 3,
      zywnosc: 0,
      nauka: 0,
      kultura: 0,
      zadowolenie: 0,
      obrona: 0,
      mnoznik: 0
    },
    przyrost: {
      praca: 0,
      pieniadz: 2,
      zywnosc: 0,
      nauka: 0,
      kultura: 0,
      zadowolenie: 0,
      obrona: 0,
      mnoznik: 3
    },
    kosztBudowy: 25,
    przyrostKosztu: 10,
    utrzymanie: 1,
    przyrostUtrzymania: 1,
    wymagania: "",
    uwagi: "Mnoznik % dotyczy przychodow z handlu w miescie",
    techUnlock: "Wymiana"
  },
  {
    id: "port",
    nazwa: "Port handlowy",
    kategoria: "Pieniadz",
    epokaWejscia: 2,
    maksPoziom: 10,
    nazwyPoziomow: [],
    baza: {
      praca: 1,
      pieniadz: 5,
      zywnosc: 0,
      nauka: 0,
      kultura: 0,
      zadowolenie: 0,
      obrona: 0,
      mnoznik: 0
    },
    przyrost: {
      praca: 0,
      pieniadz: 3,
      zywnosc: 0,
      nauka: 0,
      kultura: 0,
      zadowolenie: 0,
      obrona: 0,
      mnoznik: 0
    },
    kosztBudowy: 30,
    przyrostKosztu: 10,
    utrzymanie: 2,
    przyrostUtrzymania: 1,
    wymagania: "wybrzeze morskie lub rzeka",
    uwagi: "",
    techUnlock: "\u017Begluga"
  },
  {
    id: "karawanseraj",
    nazwa: "Karawanseraj",
    kategoria: "Pieniadz",
    epokaWejscia: 2,
    maksPoziom: 10,
    nazwyPoziomow: [],
    baza: {
      praca: 0,
      pieniadz: 6,
      zywnosc: 0,
      nauka: 0,
      kultura: 0,
      zadowolenie: 0,
      obrona: 0,
      mnoznik: 8
    },
    przyrost: {
      praca: 0,
      pieniadz: 3,
      zywnosc: 0,
      nauka: 0,
      kultura: 0,
      zadowolenie: 0,
      obrona: 0,
      mnoznik: 3
    },
    kosztBudowy: 25,
    przyrostKosztu: 10,
    utrzymanie: 2,
    przyrostUtrzymania: 1,
    wymagania: "",
    uwagi: "Mnoznik % dotyczy handlu ladowego (szlaki miedzy miastami)",
    techUnlock: "Handel"
  },
  {
    id: "spichlerz",
    nazwa: "Spichlerz",
    kategoria: "Zywnosc",
    epokaWejscia: 1,
    maksPoziom: 10,
    nazwyPoziomow: [],
    baza: {
      praca: 0,
      pieniadz: 0,
      zywnosc: 2,
      nauka: 0,
      kultura: 0,
      zadowolenie: 0,
      obrona: 0,
      mnoznik: 0
    },
    przyrost: {
      praca: 0,
      pieniadz: 0,
      zywnosc: 1,
      nauka: 0,
      kultura: 0,
      zadowolenie: 0,
      obrona: 0,
      mnoznik: 0
    },
    kosztBudowy: 20,
    przyrostKosztu: 8,
    utrzymanie: 1,
    przyrostUtrzymania: 0,
    wymagania: "",
    uwagi: "",
    techUnlock: "Garncarstwo"
  },
  {
    id: "swiatynia",
    nazwa: "Swiatynia",
    kategoria: "Kultura",
    epokaWejscia: 1,
    maksPoziom: 10,
    nazwyPoziomow: [],
    baza: {
      praca: 0,
      pieniadz: 0,
      zywnosc: 0,
      nauka: 0,
      kultura: 2,
      zadowolenie: 2,
      obrona: 0,
      mnoznik: 0
    },
    przyrost: {
      praca: 0,
      pieniadz: 0,
      zywnosc: 0,
      nauka: 0,
      kultura: 1,
      zadowolenie: 1,
      obrona: 0,
      mnoznik: 0
    },
    kosztBudowy: 25,
    przyrostKosztu: 10,
    utrzymanie: 1,
    przyrostUtrzymania: 1,
    wymagania: "",
    uwagi: "",
    techUnlock: "Mistycyzm"
  },
  {
    id: "biblioteka",
    nazwa: "Biblioteka",
    kategoria: "Nauka",
    epokaWejscia: 2,
    maksPoziom: 10,
    nazwyPoziomow: [
      "Skryptorium",
      "Biblioteka",
      "Akademia",
      "Instytut",
      "Laboratorium",
      "Obserwatorium",
      "Centrum badan",
      "Wydzial nauki",
      "Instytut technologii",
      "Centrum innowacji"
    ],
    baza: {
      praca: 0,
      pieniadz: 0,
      zywnosc: 0,
      nauka: 3,
      kultura: 1,
      zadowolenie: 0,
      obrona: 0,
      mnoznik: 0
    },
    przyrost: {
      praca: 0,
      pieniadz: 0,
      zywnosc: 0,
      nauka: 2,
      kultura: 1,
      zadowolenie: 0,
      obrona: 0,
      mnoznik: 0
    },
    kosztBudowy: 25,
    przyrostKosztu: 10,
    utrzymanie: 1,
    przyrostUtrzymania: 1,
    wymagania: "",
    uwagi: "",
    techUnlock: "Pismo"
  },
  {
    id: "studnia",
    nazwa: "Studnia / Laznie",
    kategoria: "Zdrowie",
    epokaWejscia: 1,
    maksPoziom: 10,
    nazwyPoziomow: [],
    baza: {
      praca: 0,
      pieniadz: 0,
      zywnosc: 0,
      nauka: 0,
      kultura: 0,
      zadowolenie: 1,
      obrona: 0,
      mnoznik: 0
    },
    przyrost: {
      praca: 0,
      pieniadz: 0,
      zywnosc: 0,
      nauka: 0,
      kultura: 0,
      zadowolenie: 1,
      obrona: 0,
      mnoznik: 0
    },
    kosztBudowy: 15,
    przyrostKosztu: 5,
    utrzymanie: 1,
    przyrostUtrzymania: 0,
    wymagania: "",
    uwagi: "Zadowolenie jako proxy Zdrowia do czasu dodania kolumny Zdrowie",
    techUnlock: "Gospodarka wodna"
  },
  {
    id: "mury",
    nazwa: "Mury",
    kategoria: "Obrona",
    epokaWejscia: 2,
    maksPoziom: 10,
    nazwyPoziomow: [],
    baza: {
      praca: 0,
      pieniadz: 0,
      zywnosc: 0,
      nauka: 0,
      kultura: 0,
      zadowolenie: 0,
      obrona: 5,
      mnoznik: 0
    },
    przyrost: {
      praca: 0,
      pieniadz: 0,
      zywnosc: 0,
      nauka: 0,
      kultura: 0,
      zadowolenie: 0,
      obrona: 3,
      mnoznik: 0
    },
    kosztBudowy: 35,
    przyrostKosztu: 12,
    utrzymanie: 2,
    przyrostUtrzymania: 1,
    wymagania: "",
    uwagi: "",
    techUnlock: "Budownictwo",
    odblokowuje: "maMur"
  },
  {
    id: "koszary",
    nazwa: "Koszary",
    kategoria: "Wojsko",
    epokaWejscia: 2,
    maksPoziom: 10,
    nazwyPoziomow: [],
    baza: {
      praca: 2,
      pieniadz: 0,
      zywnosc: 0,
      nauka: 0,
      kultura: 0,
      zadowolenie: 0,
      obrona: 0,
      mnoznik: 5
    },
    przyrost: {
      praca: 1,
      pieniadz: 0,
      zywnosc: 0,
      nauka: 0,
      kultura: 0,
      zadowolenie: 0,
      obrona: 0,
      mnoznik: 2
    },
    kosztBudowy: 25,
    przyrostKosztu: 10,
    utrzymanie: 2,
    przyrostUtrzymania: 1,
    wymagania: "",
    uwagi: "Mnoznik % dotyczy sily i exp jednostek szkolonych w miescie",
    techUnlock: "Wojskowosc"
  },
  {
    id: "magazyn",
    nazwa: "Magazyn",
    kategoria: "Produkcja+Pieniadz",
    epokaWejscia: 2,
    maksPoziom: 10,
    nazwyPoziomow: [],
    baza: {
      praca: 1,
      pieniadz: 1,
      zywnosc: 0,
      nauka: 0,
      kultura: 0,
      zadowolenie: 0,
      obrona: 0,
      mnoznik: 0
    },
    przyrost: {
      praca: 1,
      pieniadz: 1,
      zywnosc: 0,
      nauka: 0,
      kultura: 0,
      zadowolenie: 0,
      obrona: 0,
      mnoznik: 0
    },
    kosztBudowy: 20,
    przyrostKosztu: 8,
    utrzymanie: 1,
    przyrostUtrzymania: 0,
    wymagania: "",
    uwagi: "",
    techUnlock: "Handel"
  },
  {
    id: "stela",
    nazwa: "Stela / Pomnik",
    kategoria: "Kultura",
    epokaWejscia: 1,
    maksPoziom: 10,
    nazwyPoziomow: [],
    baza: {
      praca: 0,
      pieniadz: 0,
      zywnosc: 0,
      nauka: 0,
      kultura: 1,
      zadowolenie: 0,
      obrona: 0,
      mnoznik: 0
    },
    przyrost: {
      praca: 0,
      pieniadz: 0,
      zywnosc: 0,
      nauka: 0,
      kultura: 1,
      zadowolenie: 0,
      obrona: 0,
      mnoznik: 0
    },
    kosztBudowy: 15,
    przyrostKosztu: 5,
    utrzymanie: 0,
    przyrostUtrzymania: 0,
    wymagania: "",
    uwagi: "Nie wymaga utrzymania",
    techUnlock: "Murarstwo"
  },
  {
    id: "palac",
    nazwa: "Palac",
    kategoria: "Kultura/Administracja",
    epokaWejscia: 1,
    maksPoziom: 10,
    nazwyPoziomow: [
      "Dom wodza",
      "Dwor",
      "Palac zarzadcy",
      "Palac",
      "Rezydencja",
      "Dworzec",
      "Palac regionu",
      "Stolica prowincji",
      "Palac krolewski",
      "Palac cesarski"
    ],
    baza: {
      praca: 0,
      pieniadz: 0,
      zywnosc: 0,
      nauka: 0,
      kultura: 3,
      zadowolenie: 1,
      obrona: 0,
      mnoznik: 5
    },
    przyrost: {
      praca: 0,
      pieniadz: 0,
      zywnosc: 0,
      nauka: 0,
      kultura: 2,
      zadowolenie: 1,
      obrona: 0,
      mnoznik: 0
    },
    kosztBudowy: 40,
    przyrostKosztu: 12,
    utrzymanie: 2,
    przyrostUtrzymania: 1,
    wymagania: "-",
    uwagi: "1 na miasto (siedziba zarzadcy); glowne zrodlo kultury miasta",
    techUnlock: ""
  },
  {
    id: "kuznia_zelaza",
    nazwa: "Ku\u017Ania \u017Celaza",
    kategoria: "Produkcja+Wojsko",
    epokaWejscia: 3,
    maksPoziom: 10,
    nazwyPoziomow: [],
    baza: {
      praca: 8,
      pieniadz: 2,
      zywnosc: 0,
      nauka: 0,
      kultura: 0,
      zadowolenie: 0,
      obrona: 0,
      mnoznik: 8
    },
    przyrost: {
      praca: 4,
      pieniadz: 1,
      zywnosc: 0,
      nauka: 0,
      kultura: 0,
      zadowolenie: 0,
      obrona: 0,
      mnoznik: 3
    },
    kosztBudowy: 60,
    przyrostKosztu: 15,
    utrzymanie: 3,
    przyrostUtrzymania: 1,
    wymagania: "zelazo w zasiegu",
    wymaganySurowiec: "zelazo",
    uwagi: "Mnoznik % dotyczy sily jednostek zelaznych produkowanych w miescie; wymaga dostepu do zelaza",
    techUnlock: "Obr\xF3bka \u017Celaza"
  },
  {
    id: "wielka_kuznia",
    nazwa: "Wielka Ku\u017Ania",
    kategoria: "Produkcja",
    epokaWejscia: 4,
    maksPoziom: 10,
    nazwyPoziomow: [],
    baza: {
      praca: 12,
      pieniadz: 3,
      zywnosc: 0,
      nauka: 0,
      kultura: 0,
      zadowolenie: 0,
      obrona: 0,
      mnoznik: 15
    },
    przyrost: {
      praca: 5,
      pieniadz: 2,
      zywnosc: 0,
      nauka: 0,
      kultura: 0,
      zadowolenie: 0,
      obrona: 0,
      mnoznik: 4
    },
    kosztBudowy: 90,
    przyrostKosztu: 18,
    utrzymanie: 4,
    przyrostUtrzymania: 2,
    wymagania: "zelazo i stal w zasiegu; wymaga Kuznia zelaza",
    wymaganySurowiec: "stal",
    uwagi: "Mnoznik % dotyczy sily i kosztu produkcji wszystkich jednostek w miescie; wymaga dostepu do stali",
    techUnlock: "Hutnictwo \u017Celaza"
  },
  {
    id: "fort",
    nazwa: "Fort",
    kategoria: "Obrona",
    epokaWejscia: 3,
    maksPoziom: 10,
    nazwyPoziomow: [],
    baza: {
      praca: 0,
      pieniadz: 0,
      zywnosc: 0,
      nauka: 0,
      kultura: 0,
      zadowolenie: 0,
      obrona: 10,
      mnoznik: 0
    },
    przyrost: {
      praca: 0,
      pieniadz: 0,
      zywnosc: 0,
      nauka: 0,
      kultura: 0,
      zadowolenie: 0,
      obrona: 5,
      mnoznik: 0
    },
    kosztBudowy: 70,
    przyrostKosztu: 15,
    utrzymanie: 3,
    przyrostUtrzymania: 1,
    wymagania: "",
    uwagi: "+100% obrona przy obozowaniu jednostek (zasieg 10); styk MAPA/civ-bonusy-obronne-mapa.md",
    techUnlock: "In\u017Cynieria",
    odblokowuje: "maFort"
  },
  {
    id: "warsztat_oblezniczy",
    nazwa: "Warsztat obl\u0119\u017Cniczy",
    kategoria: "Wojsko",
    epokaWejscia: 3,
    maksPoziom: 10,
    nazwyPoziomow: [],
    baza: {
      praca: 4,
      pieniadz: 2,
      zywnosc: 0,
      nauka: 0,
      kultura: 0,
      zadowolenie: 0,
      obrona: 0,
      mnoznik: 10
    },
    przyrost: {
      praca: 2,
      pieniadz: 1,
      zywnosc: 0,
      nauka: 0,
      kultura: 0,
      zadowolenie: 0,
      obrona: 0,
      mnoznik: 3
    },
    kosztBudowy: 65,
    przyrostKosztu: 15,
    utrzymanie: 3,
    przyrostUtrzymania: 1,
    wymagania: "wymaga Koszary",
    uwagi: "Odblokowuje budow\u0119 Katapulty w mie\u015Bcie (maWarsztatOblezniczy). Taran i Wie\u017Ca = in-siege przy obl\u0119\u017Ceniu \u2014 styk UNITS",
    techUnlock: "Obl\u0119\u017Cnictwo",
    odblokowuje: "maWarsztatOblezniczy"
  },
  {
    id: "akademia",
    nazwa: "Akademia",
    kategoria: "Nauka",
    epokaWejscia: 3,
    maksPoziom: 10,
    nazwyPoziomow: [],
    baza: {
      praca: 0,
      pieniadz: 0,
      zywnosc: 0,
      nauka: 6,
      kultura: 2,
      zadowolenie: 0,
      obrona: 0,
      mnoznik: 10
    },
    przyrost: {
      praca: 0,
      pieniadz: 0,
      zywnosc: 0,
      nauka: 3,
      kultura: 1,
      zadowolenie: 0,
      obrona: 0,
      mnoznik: 3
    },
    kosztBudowy: 70,
    przyrostKosztu: 15,
    utrzymanie: 3,
    przyrostUtrzymania: 1,
    wymagania: "wymaga Biblioteka",
    uwagi: "Mnoznik % dotyczy globalnej puli nauki (nadbudowka nad Biblioteka)",
    techUnlock: "Filozofia"
  },
  {
    id: "teatr",
    nazwa: "Teatr",
    kategoria: "Kultura",
    epokaWejscia: 3,
    maksPoziom: 10,
    nazwyPoziomow: [],
    baza: {
      praca: 0,
      pieniadz: 0,
      zywnosc: 0,
      nauka: 0,
      kultura: 4,
      zadowolenie: 3,
      obrona: 0,
      mnoznik: 0
    },
    przyrost: {
      praca: 0,
      pieniadz: 0,
      zywnosc: 0,
      nauka: 0,
      kultura: 2,
      zadowolenie: 1,
      obrona: 0,
      mnoznik: 0
    },
    kosztBudowy: 55,
    przyrostKosztu: 12,
    utrzymanie: 2,
    przyrostUtrzymania: 1,
    wymagania: "",
    uwagi: "Glowne zrodlo kultury i zadowolenia w epoce Zelaza",
    techUnlock: "Filozofia"
  },
  {
    id: "sad",
    nazwa: "S\u0105d",
    kategoria: "Administracja",
    epokaWejscia: 3,
    maksPoziom: 10,
    nazwyPoziomow: [],
    baza: {
      praca: 0,
      pieniadz: 2,
      zywnosc: 0,
      nauka: 0,
      kultura: 1,
      zadowolenie: 2,
      obrona: 0,
      mnoznik: 0
    },
    przyrost: {
      praca: 0,
      pieniadz: 1,
      zywnosc: 0,
      nauka: 0,
      kultura: 1,
      zadowolenie: 1,
      obrona: 0,
      mnoznik: 0
    },
    kosztBudowy: 55,
    przyrostKosztu: 12,
    utrzymanie: 2,
    przyrostUtrzymania: 1,
    wymagania: "",
    uwagi: "Redukuje korupcje (anty-korupcja); zwiekszony porzadek publiczny; zadowolenie z praworz.",
    techUnlock: "Kodeks prawa"
  },
  {
    id: "pretorium",
    nazwa: "Pretorium",
    kategoria: "Administracja",
    epokaWejscia: 3,
    maksPoziom: 10,
    nazwyPoziomow: [],
    baza: {
      praca: 2,
      pieniadz: 3,
      zywnosc: 0,
      nauka: 0,
      kultura: 0,
      zadowolenie: 1,
      obrona: 2,
      mnoznik: 5
    },
    przyrost: {
      praca: 1,
      pieniadz: 2,
      zywnosc: 0,
      nauka: 0,
      kultura: 0,
      zadowolenie: 1,
      obrona: 1,
      mnoznik: 2
    },
    kosztBudowy: 75,
    przyrostKosztu: 15,
    utrzymanie: 3,
    przyrostUtrzymania: 1,
    wymagania: "",
    uwagi: "Centrum administracji prowincji; bonus do utrzymania porzadku (garnizon); mnoznik % do przychodu podatkowego",
    techUnlock: "Kodeks prawa"
  },
  {
    id: "laznia_publiczna",
    nazwa: "\u0141a\u017Ania publiczna",
    kategoria: "Zdrowie",
    epokaWejscia: 3,
    maksPoziom: 10,
    nazwyPoziomow: [],
    baza: {
      praca: 0,
      pieniadz: 0,
      zywnosc: 1,
      nauka: 0,
      kultura: 1,
      zadowolenie: 3,
      obrona: 0,
      mnoznik: 0
    },
    przyrost: {
      praca: 0,
      pieniadz: 0,
      zywnosc: 1,
      nauka: 0,
      kultura: 0,
      zadowolenie: 1,
      obrona: 0,
      mnoznik: 0
    },
    kosztBudowy: 50,
    przyrostKosztu: 12,
    utrzymanie: 2,
    przyrostUtrzymania: 1,
    wymagania: "wymaga Studnia / Laznie",
    uwagi: "Rozszerzenie Studni; zadowolenie i zdrowie (proxy zywnosc); wymagany Medycyna",
    techUnlock: "Medycyna"
  },
  {
    id: "lazaret",
    nazwa: "Lazaret",
    kategoria: "Zdrowie+Wojsko",
    epokaWejscia: 5,
    maksPoziom: 10,
    nazwyPoziomow: [],
    baza: {
      praca: 0,
      pieniadz: 0,
      zywnosc: 0,
      nauka: 1,
      kultura: 0,
      zadowolenie: 1,
      obrona: 0,
      mnoznik: 5
    },
    przyrost: {
      praca: 0,
      pieniadz: 0,
      zywnosc: 0,
      nauka: 1,
      kultura: 0,
      zadowolenie: 1,
      obrona: 0,
      mnoznik: 2
    },
    kosztBudowy: 55,
    przyrostKosztu: 12,
    utrzymanie: 2,
    przyrostUtrzymania: 1,
    wymagania: "",
    uwagi: "Regeneracja HP jednostek stacjonujacych w miescie; mnoznik % do tempa regeneracji - styk UNITS. PARKOWANIE: budynek epoki Sredniowiecze (epokaWejscia=4); poza cap v0.1 (max epoka=3=Zelazo) -- nie usuwamy, aktywuje sie w pozniejszej epoce. techUnlock docelowo tech sredniowieczna (zostaje Medycyna jako placeholder; nie wymyslac nowej techy przed decyzja Macieja).",
    techUnlock: "Medycyna"
  },
  {
    id: "akademia_wojskowa",
    nazwa: "Akademia wojskowa",
    kategoria: "Wojsko",
    epokaWejscia: 3,
    maksPoziom: 10,
    nazwyPoziomow: [],
    baza: {
      praca: 3,
      pieniadz: 2,
      zywnosc: 0,
      nauka: 0,
      kultura: 0,
      zadowolenie: 0,
      obrona: 0,
      mnoznik: 15
    },
    przyrost: {
      praca: 1,
      pieniadz: 1,
      zywnosc: 0,
      nauka: 0,
      kultura: 0,
      zadowolenie: 0,
      obrona: 0,
      mnoznik: 4
    },
    kosztBudowy: 80,
    przyrostKosztu: 18,
    utrzymanie: 4,
    przyrostUtrzymania: 2,
    wymagania: "wymaga Koszary",
    uwagi: "Mnoznik % dotyczy sily i exp WSZYSTKICH jednostek szkolonych w miescie; prereq elitarnych jednostek top-tier Zelaza \u2014 styk UNITS",
    techUnlock: "Sztuka wojenna"
  }
];

// data/resources.json
var resources_default = [
  {
    Surowiec: "\u017Bywno\u015B\u0107",
    Typ: "surowy",
    "\u0179r\xF3d\u0142o / budynek": "pola (wg terenu)",
    Uwagi: "konsumpcja: 1/ludnosc + 1/jednostke"
  },
  {
    Surowiec: "Drewno",
    Typ: "surowy",
    "\u0179r\xF3d\u0142o / budynek": "Las",
    Uwagi: "budulec; wejscie Tartaku i Mielerza"
  },
  {
    Surowiec: "Kamie\u0144",
    Typ: "surowy",
    "\u0179r\xF3d\u0142o / budynek": "Wzg\xF3rza/G\xF3ry + Kopalnia",
    Uwagi: "budulec"
  },
  {
    Surowiec: "Glina",
    Typ: "surowy",
    "\u0179r\xF3d\u0142o / budynek": "z\u0142o\u017Ce Glina",
    Uwagi: "wejscie Cegielni i Garncarni"
  },
  {
    Surowiec: "Ruda",
    Typ: "surowy",
    "\u0179r\xF3d\u0142o / budynek": "z\u0142o\u017Ce Ruda + Kopalnia",
    Uwagi: "wejscie Huty"
  },
  {
    Surowiec: "Byd\u0142o (krowa/w\xF3\u0142)",
    Typ: "hodowla",
    "\u0179r\xF3d\u0142o / budynek": "z\u0142o\u017Ce/handel (zarodek) + Pastwisko",
    Uwagi: "min. 1 sztuka ze z\u0142o\u017Ca lub handlu uruchamia hodowle; +produkcja (x200%) gdy przypisane; Rydwan; NIEDOST\u0118PNE u Maj\xF3w/Ameryki \u015Arodkowej (brak w Nowym \u015Awiecie przed kontaktem europejskim)"
  },
  {
    Surowiec: "Owce",
    Typ: "hodowla",
    "\u0179r\xF3d\u0142o / budynek": "z\u0142o\u017Ce/handel (zarodek) + Pastwisko",
    Uwagi: "+2 zywnosci gdy przypisane; tylko laki/rowniny/wzgorza; dost\u0119pne globalnie (Stary i Nowy \u015Awiat \u2014 Ameryka Pd.: owce andyjskie)"
  },
  {
    Surowiec: "Lama",
    Typ: "hodowla",
    "\u0179r\xF3d\u0142o / budynek": "z\u0142o\u017Ce/handel (zarodek) + Pastwisko",
    Uwagi: "TYLKO Inkowie/Ameryka \u015Arodk.-Pd.; substytut Byd\u0142a \u2014 mniejszy bonus: +1 produkcja (vs +2 Byd\u0142o); transport surowc\xF3w (ograniczony); brak Rydwanu (konne niedost\u0119pne); owce/lama = jedyne du\u017Ce zwierz\u0119ta w Nowym \u015Awiecie"
  },
  {
    Surowiec: "Ko\u0144",
    Typ: "hodowla",
    "\u0179r\xF3d\u0142o / budynek": "z\u0142o\u017Ce Konie / Stajnia (p\xF3\u017Aniej)",
    Uwagi: "Konnica (Br\u0105z) i rydwany konne; NIEDOST\u0118PNY u Maj\xF3w/Ameryki (konie wygin\u0119\u0142y w Nowym \u015Awiecie ~10 000 p.n.e.)"
  },
  {
    Surowiec: "Deski",
    Typ: "przetworzony",
    "\u0179r\xF3d\u0142o / budynek": "Tartak (z drewna)",
    Uwagi: "budulec"
  },
  {
    Surowiec: "Paliwo (w\u0119giel drzewny)",
    Typ: "przetworzony",
    "\u0179r\xF3d\u0142o / budynek": "Mielerz (z drewna)",
    Uwagi: "wejscie Cegielni, Garncarni i Huty"
  },
  {
    Surowiec: "Ceg\u0142a",
    Typ: "przetworzony",
    "\u0179r\xF3d\u0142o / budynek": "Cegielnia (glina+paliwo)",
    Uwagi: "budulec"
  },
  {
    Surowiec: "Ceramika",
    Typ: "przetworzony (luksus)",
    "\u0179r\xF3d\u0142o / budynek": "Garncarnia (z gliny)",
    Uwagi: "+zadowolenie, +Zdrowie"
  },
  {
    Surowiec: "Br\u0105z",
    Typ: "przetworzony",
    "\u0179r\xF3d\u0142o / budynek": "Huta (ruda+paliwo)",
    Uwagi: "budulec + jednostki brazowe"
  },
  {
    Surowiec: "\u017Belazo",
    Typ: "surowy",
    "\u0179r\xF3d\u0142o / budynek": "z\u0142o\u017Ce Ruda \u017Celaza + Ku\u017Ania \u017Celaza",
    Uwagi: "model dost\u0119pu v0.1 = boolean (z\u0142o\u017Ce w zasi\u0119gu + ulepszenie); odblokowuje tech Obr\xF3bka \u017Celaza; prereq Ku\u017Ani \u017Celaza"
  },
  {
    Surowiec: "Stal",
    Typ: "przetworzony",
    "\u0179r\xF3d\u0142o / budynek": "Wielka Ku\u017Ania (\u017Celazo+paliwo)",
    Uwagi: "odblokowuje tech Hutnictwo \u017Celaza; prereq Wielkiej Ku\u017Ani; model dost\u0119pu v0.1 = boolean"
  }
];

// data/tech.json
var tech_default = {
  tempo_gry: {
    szybka: 0.2,
    standardowa: 1,
    dluga: 5,
    _opis: "Globalny mnoznik kosztu badan wybierany przy starcie gry. Stosuje sie do KAZDEGO 'Koszt nauki' w tablicy 'technologie' przez funkcje applyTempoKoszt() z gra/src/game/tech-tempo.ts. Przyklad: tech koszt=100, tempo szybka -> round(100*0.2)=20 pkt; dluga -> round(100*5.0)=500 pkt."
  },
  technologie: [
    {
      Technologia: "Obr\xF3bka drewna",
      Epoka: "Kamie\u0144",
      Poziom: 1,
      "Dost\u0119p do surowca.": "Dost\u0119p do drewna",
      "wymagany budynek": null,
      "Wymaga (prereq)": "\u2014",
      "Odblokowuje surowiec.": "deski, paliwo",
      "Odblokowuje budynek": "Tartak, Mielerz",
      "Koszt nauki": 12,
      Uwagi: null
    },
    {
      Technologia: "Garncarstwo",
      Epoka: "Kamie\u0144",
      Poziom: 1,
      "Dost\u0119p do surowca.": "Dost\u0119p do glina",
      "wymagany budynek": null,
      "Wymaga (prereq)": "\u2014",
      "Odblokowuje surowiec.": "ceg\u0142a",
      "Odblokowuje budynek": "Spichlerz, Cegielnia, Garncarz",
      "Koszt nauki": 10,
      Uwagi: null
    },
    {
      Technologia: "Murarstwo",
      Epoka: "Kamie\u0144",
      Poziom: 1,
      "Dost\u0119p do surowca.": "Dost\u0119p do kamie\u0144",
      "wymagany budynek": null,
      "Wymaga (prereq)": "\u2014",
      "Odblokowuje surowiec.": "kamien",
      "Odblokowuje budynek": "Mury, Kopalnia",
      "Koszt nauki": 14,
      Uwagi: null
    },
    {
      Technologia: "\u0141ucznictwo",
      Epoka: "Kamie\u0144",
      Poziom: 1,
      "Dost\u0119p do surowca.": "Dost\u0119p do drewna",
      "wymagany budynek": null,
      "Wymaga (prereq)": "\u2014",
      "Odblokowuje surowiec.": null,
      "Odblokowuje budynek": "\u0141ucznik",
      "Koszt nauki": 14,
      Uwagi: null
    },
    {
      Technologia: "Oswojenie zwierz\u0105t",
      Epoka: "Kamie\u0144",
      Poziom: 1,
      "Dost\u0119p do surowca.": "Dost\u0119p do krowa/byk, owce",
      "wymagany budynek": null,
      "Wymaga (prereq)": "\u2014",
      "Odblokowuje surowiec.": "krowa/byk, owce",
      "Odblokowuje budynek": "Pasterstwo",
      "Koszt nauki": 12,
      Uwagi: null
    },
    {
      Technologia: "Mistycyzm",
      Epoka: "Kamie\u0144",
      Poziom: 1,
      "Dost\u0119p do surowca.": null,
      "wymagany budynek": null,
      "Wymaga (prereq)": "\u2014",
      "Odblokowuje surowiec.": null,
      "Odblokowuje budynek": "Swiatynia",
      "Koszt nauki": 10,
      Uwagi: null
    },
    {
      Technologia: "Wymiana",
      Epoka: "Kamie\u0144",
      Poziom: 1,
      "Dost\u0119p do surowca.": null,
      "wymagany budynek": null,
      "Wymaga (prereq)": "Garncarstwo",
      "Odblokowuje surowiec.": null,
      "Odblokowuje budynek": "Targowisko",
      "Koszt nauki": 16,
      Uwagi: null
    },
    {
      Technologia: "Gospodarka wodna",
      Epoka: "Kamie\u0144",
      Poziom: 1,
      "Dost\u0119p do surowca.": null,
      "wymagany budynek": null,
      "Wymaga (prereq)": "Garncarstwo",
      "Odblokowuje surowiec.": null,
      "Odblokowuje budynek": "Studnia / Laznia",
      "Koszt nauki": 18,
      Uwagi: null
    },
    {
      Technologia: "Ko\u0142o",
      Epoka: "Kamie\u0144",
      Poziom: 2,
      "Dost\u0119p do surowca.": "Dost\u0119p do drewna",
      "wymagany budynek": null,
      "Wymaga (prereq)": "Oswojenie zwierz\u0105t",
      "Odblokowuje surowiec.": "krowa/byk",
      "Odblokowuje budynek": "Rydwan, Drogi",
      "Koszt nauki": 22,
      Uwagi: null
    },
    {
      Technologia: "Br\u0105zownictwo",
      Epoka: "Kamie\u0144",
      Poziom: 2,
      "Dost\u0119p do surowca.": "Dost\u0119p do br\u0105zu",
      "wymagany budynek": null,
      "Wymaga (prereq)": "Garncarstwo",
      "Odblokowuje surowiec.": null,
      "Odblokowuje budynek": "Huta, br\u0105z, jednostki br\u0105zowe \u2192 Epoka 2",
      "Koszt nauki": 45,
      Uwagi: "ko\u0144czy Epok\u0119 1"
    },
    {
      Technologia: "\u017Begluga",
      Epoka: "Br\u0105z",
      Poziom: 2,
      "Dost\u0119p do surowca.": "Deski",
      "wymagany budynek": "Tartak",
      "Wymaga (prereq)": "Obr\xF3bka drewna",
      "Odblokowuje surowiec.": null,
      "Odblokowuje budynek": "Statki, Port",
      "Koszt nauki": 40,
      Uwagi: null
    },
    {
      Technologia: "Pismo",
      Epoka: "Br\u0105z",
      Poziom: 3,
      "Dost\u0119p do surowca.": "Ceramika",
      "wymagany budynek": "Cegielnia",
      "Wymaga (prereq)": "Garncarstwo",
      "Odblokowuje surowiec.": null,
      "Odblokowuje budynek": "Biblioteka",
      "Koszt nauki": 45,
      Uwagi: null
    },
    {
      Technologia: "Religia",
      Epoka: "Br\u0105z",
      Poziom: 3,
      "Dost\u0119p do surowca.": "Ceramika",
      "wymagany budynek": "Cegielnia",
      "Wymaga (prereq)": "Garncarstwo",
      "Odblokowuje surowiec.": null,
      "Odblokowuje budynek": "\u015Awi\u0105tynia",
      "Koszt nauki": 48,
      Uwagi: null
    },
    {
      Technologia: "Je\u017Adziectwo",
      Epoka: "Br\u0105z",
      Poziom: 3,
      "Dost\u0119p do surowca.": "kon",
      "wymagany budynek": null,
      "Wymaga (prereq)": "Ko\u0142o + Br\u0105zownictwo",
      "Odblokowuje surowiec.": null,
      "Odblokowuje budynek": "Konnica",
      "Koszt nauki": 56,
      Uwagi: null
    },
    {
      Technologia: "Wojskowosc",
      Epoka: "Br\u0105z",
      Poziom: 3,
      "Dost\u0119p do surowca.": null,
      "wymagany budynek": null,
      "Wymaga (prereq)": "Br\u0105zownictwo",
      "Odblokowuje surowiec.": null,
      "Odblokowuje budynek": "Koszary",
      "Koszt nauki": 52,
      Uwagi: null
    },
    {
      Technologia: "Matematyka",
      Epoka: "Br\u0105z",
      Poziom: 4,
      "Dost\u0119p do surowca.": null,
      "wymagany budynek": null,
      "Wymaga (prereq)": "Pismo",
      "Odblokowuje surowiec.": null,
      "Odblokowuje budynek": "(prereq Budownictwa)",
      "Koszt nauki": 68,
      Uwagi: null
    },
    {
      Technologia: "Handel",
      Epoka: "Br\u0105z",
      Poziom: 4,
      "Dost\u0119p do surowca.": null,
      "wymagany budynek": null,
      "Wymaga (prereq)": "Pismo",
      "Odblokowuje surowiec.": null,
      "Odblokowuje budynek": "Drogi handlowe \u2192 Waluta",
      "Koszt nauki": 74,
      Uwagi: null
    },
    {
      Technologia: "Prawo (Kodeks)",
      Epoka: "Br\u0105z",
      Poziom: 4,
      "Dost\u0119p do surowca.": null,
      "wymagany budynek": null,
      "Wymaga (prereq)": "Pismo",
      "Odblokowuje surowiec.": null,
      "Odblokowuje budynek": "Porz\u0105dek / S\u0105dy",
      "Koszt nauki": 62,
      Uwagi: null
    },
    {
      Technologia: "Budownictwo",
      Epoka: "Br\u0105z",
      Poziom: 5,
      "Dost\u0119p do surowca.": "ceg\u0142a",
      "wymagany budynek": null,
      "Wymaga (prereq)": "Matematyka + Murarstwo",
      "Odblokowuje surowiec.": null,
      "Odblokowuje budynek": "Akwedukt",
      "Koszt nauki": 85,
      Uwagi: null
    },
    {
      Technologia: "Waluta",
      Epoka: "Br\u0105z",
      Poziom: 5,
      "Dost\u0119p do surowca.": "handel",
      "wymagany budynek": null,
      "Wymaga (prereq)": "Handel + Matematyka",
      "Odblokowuje surowiec.": null,
      "Odblokowuje budynek": "Pieni\u0105dz, Targowisko, Mennica",
      "Koszt nauki": 100,
      Uwagi: "ko\u0144czy Epok\u0119 2 (Pieni\u0105dz)"
    },
    {
      Technologia: "Obr\xF3bka \u017Celaza",
      Epoka: "\u017Belazo",
      Poziom: 6,
      "Dost\u0119p do surowca.": "Dost\u0119p do \u017Celazo",
      "wymagany budynek": "Huta",
      "Wymaga (prereq)": "Br\u0105zownictwo",
      "Odblokowuje surowiec.": "\u017Celazo",
      "Odblokowuje budynek": "Ku\u017Ania \u017Celaza",
      "Koszt nauki": 120,
      Uwagi: "ko\u0144czy Epok\u0119 2 / otwiera Epok\u0119 3; jednostki \u017Celazne (Wojownik celtycki, Wojownik germa\u0144ski itp.) \u2014 do zdefiniowania przez UNITS; Ku\u017Ania \u017Celaza = NOWY budynek dla EKONOMIA"
    },
    {
      Technologia: "In\u017Cynieria",
      Epoka: "\u017Belazo",
      Poziom: 6,
      "Dost\u0119p do surowca.": null,
      "wymagany budynek": null,
      "Wymaga (prereq)": "Budownictwo",
      "Odblokowuje surowiec.": null,
      "Odblokowuje budynek": "Akwedukt (ulepszony), Fort",
      "Koszt nauki": 130,
      Uwagi: "Fort = NOWY budynek (obrona terenu, zasi\u0119g 10, +100% obrona przy obozowaniu \u2014 zob. civ-bonusy-obronne-mapa.md); Akwedukt ulepszony = rozszerzenie istniej\u0105cego Akweduktu"
    },
    {
      Technologia: "Obl\u0119\u017Cnictwo",
      Epoka: "\u017Belazo",
      Poziom: 6,
      "Dost\u0119p do surowca.": null,
      "wymagany budynek": "Koszary",
      "Wymaga (prereq)": "Matematyka + Wojskowosc",
      "Odblokowuje surowiec.": null,
      "Odblokowuje budynek": "Warsztat obl\u0119\u017Cniczy",
      "Koszt nauki": 140,
      Uwagi: "jednostki: Katapulta, Taran, Wie\u017Ca obl\u0119\u017Cnicza (cz\u0119\u015B\u0107 ju\u017C w UNITS \u2014 weryfikacja przez UNITS); Warsztat obl\u0119\u017Cniczy = NOWY budynek dla EKONOMIA; Katapulta wymaga tego tech (aktualizacja Tech w units.json przez UNITS)"
    },
    {
      Technologia: "Filozofia",
      Epoka: "\u017Belazo",
      Poziom: 7,
      "Dost\u0119p do surowca.": null,
      "wymagany budynek": "Biblioteka",
      "Wymaga (prereq)": "Pismo + Religia",
      "Odblokowuje surowiec.": null,
      "Odblokowuje budynek": "Akademia, Teatr",
      "Koszt nauki": 150,
      Uwagi: "Akademia = NOWY budynek (nauka++); Teatr = NOWY budynek (kultura++, zadowolenie++); oba dla EKONOMIA"
    },
    {
      Technologia: "Kodeks prawa",
      Epoka: "\u017Belazo",
      Poziom: 7,
      "Dost\u0119p do surowca.": null,
      "wymagany budynek": null,
      "Wymaga (prereq)": "Prawo (Kodeks) + Pismo",
      "Odblokowuje surowiec.": null,
      "Odblokowuje budynek": "S\u0105d, Pretorium",
      "Koszt nauki": 155,
      Uwagi: "S\u0105d = NOWY budynek (administracja, zadowolenie+, korupcja-); Pretorium = NOWY budynek (administracja, bonus do utrzymania porz\u0105dku); oba dla EKONOMIA"
    },
    {
      Technologia: "Drogi \u017Celazne",
      Epoka: "\u017Belazo",
      Poziom: 7,
      "Dost\u0119p do surowca.": "\u017Celazo",
      "wymagany budynek": null,
      "Wymaga (prereq)": "In\u017Cynieria + Obr\xF3bka \u017Celaza",
      "Odblokowuje surowiec.": null,
      "Odblokowuje budynek": "Drogi brukowane (ulepszenie terenu)",
      "Koszt nauki": 170,
      Uwagi: "Drogi brukowane = NOWE ulepszenie terenu dla DANE/MAPA (+ruch, +handel mi\u0119dzy miastami); bonus +pieni\u0105dz na szlakach handlowych"
    },
    {
      Technologia: "Medycyna",
      Epoka: "\u017Belazo",
      Poziom: 7,
      "Dost\u0119p do surowca.": null,
      "wymagany budynek": "Studnia / Laznia",
      "Wymaga (prereq)": "Filozofia + Gospodarka wodna",
      "Odblokowuje surowiec.": null,
      "Odblokowuje budynek": "\u0141a\u017Ania publiczna, Lazaret",
      "Koszt nauki": 162,
      Uwagi: "\u0141a\u017Ania publiczna = NOWY budynek (zadowolenie++, zdrowie++); Lazaret = NOWY budynek (odnawianie HP jednostek w mie\u015Bcie); oba dla EKONOMIA; styk z UNITS (regeneracja)"
    },
    {
      Technologia: "Hutnictwo \u017Celaza",
      Epoka: "\u017Belazo",
      Poziom: 8,
      "Dost\u0119p do surowca.": "\u017Celazo",
      "wymagany budynek": "Ku\u017Ania \u017Celaza",
      "Wymaga (prereq)": "Obr\xF3bka \u017Celaza + In\u017Cynieria",
      "Odblokowuje surowiec.": "stal (prereq)",
      "Odblokowuje budynek": "Wielka Ku\u017Ania",
      "Koszt nauki": 185,
      Uwagi: "Wielka Ku\u017Ania = NOWY budynek (produkcja++, mnoznik jednostek++); stal = NOWY surowiec dla DANE (prereq dalszych epok); EKONOMIA dodaje surowiec; UNITS aktualizuje jednostki \u017Celazne wy\u017Cszego poziomu"
    },
    {
      Technologia: "Sztuka wojenna",
      Epoka: "\u017Belazo",
      Poziom: 8,
      "Dost\u0119p do surowca.": null,
      "wymagany budynek": "Koszary",
      "Wymaga (prereq)": "Obl\u0119\u017Cnictwo + Obr\xF3bka \u017Celaza",
      "Odblokowuje surowiec.": null,
      "Odblokowuje budynek": "Akademia wojskowa",
      "Koszt nauki": 200,
      Uwagi: "ko\u0144czy Epok\u0119 3 (cap v0.1); Akademia wojskowa = NOWY budynek (mnoznik sily i exp jednostek ++, prereq elitarnych jednostek \u017Celaznych); UNITS definiuje jednostki top-tier \u017Belaza; EKONOMIA dodaje budynek"
    }
  ]
};

// data/civs.json
var civs_default = {
  cywilizacje: [
    {
      Cywilizacja: "Grecy",
      "Styl / charakter": "defensywna piechota",
      "Jednostka specjalna": "Falanga (Hoplita)",
      "Bonus startowy": "+Obrona piechoty; silna od frontu, odpiera szar\u017C\u0119",
      "Bonusy/minusy (do dopracowania)": "wolniejszy ruch",
      Uwagi: "epoka Br\u0105zu",
      Religia: "Politeizm olimpijski",
      nazwyKlastra: [
        "Ateny",
        "Sparta",
        "Korynt",
        "Teby",
        "Argos",
        "Mykeny",
        "Milet",
        "Rodos",
        "Syrakuzy",
        "Delfy"
      ],
      mnoznikHandelPieniadz: 2.3,
      ikonaId: "grecy",
      bonusy: [
        {
          typ: "bonus_obrona",
          cel: "piechota",
          wartosc: 0.2,
          opis: "Falanga: +20% obrony piechoty przy ataku frontalnym (szyld i oszczep)",
          realizuje: "walka"
        },
        {
          typ: "jednostka_specjalna",
          cel: "piechota",
          wartosc: "Falanga (Hoplita)",
          opis: "Hoplita = ulepszona piechota z tarcz\u0105; silna od frontu, odpiera szar\u017C\u0119 kawalerii",
          realizuje: "walka"
        },
        {
          typ: "bonus_zloto",
          cel: "handel",
          wartosc: 0.15,
          opis: "Morskie szlaki handlowe: +15% z\u0142ota z port\xF3w i dr\xF3g morskich (Korynt, Ateny)",
          realizuje: "ekonomia"
        }
      ],
      typCywilizacji: "grecy",
      archetyp: "grecy"
    },
    {
      Cywilizacja: "Rzymianie",
      "Styl / charakter": "ofensywna piechota + in\u017Cynieria",
      "Jednostka specjalna": "Legion (Legionista)",
      "Bonus startowy": "silny atak + pancerz; szybsza budowa dr\xF3g/budynk\xF3w; +Morale (dyscyplina)",
      "Bonusy/minusy (do dopracowania)": "wy\u017Csze utrzymanie armii",
      Uwagi: null,
      Religia: "Religia rzymska / kult pa\u0144stwa",
      nazwyKlastra: [
        "Rzym",
        "Ostia",
        "Kapua",
        "Pompeje",
        "Tarent",
        "Mediolan",
        "Akwileja",
        "Rawenna",
        "Weje",
        "Ancjum"
      ],
      mnoznikHandelPieniadz: 2,
      ikonaId: "rzymianie",
      bonusy: [
        {
          typ: "bonus_walka",
          cel: "piechota",
          wartosc: 0.15,
          opis: "Legion: +15% ataku i pancerza piechoty szturmowej; dyscyplina bojowa +morale",
          realizuje: "walka"
        },
        {
          typ: "koszt_redukcja",
          cel: "budynki",
          wartosc: 0.2,
          opis: "In\u017Cynieria rzymska: -20% kosztu Produkcji budowli; szybsza budowa dr\xF3g",
          realizuje: "miasto"
        },
        {
          typ: "jednostka_specjalna",
          cel: "piechota",
          wartosc: "Legion (Legionista)",
          opis: "Legionista = ci\u0119\u017Cka piechota z pilum; silny atak + pancerz + morale",
          realizuje: "walka"
        }
      ],
      typCywilizacji: "rzymianie",
      archetyp: "rzym"
    },
    {
      Cywilizacja: "Chi\u0144czycy",
      "Styl / charakter": "dystans + kawaleria",
      "Jednostka specjalna": "Kusznik (lepszy \u0142ucznik)",
      "Bonus startowy": "lepsi \u0142ucznicy (+Atak/zasi\u0119g) i lepsza konnica (+Uderzenie)",
      "Bonusy/minusy (do dopracowania)": "s\u0142absza piechota szturmowa wr\u0119cz (nacisk na dystans i konnic\u0119)",
      Uwagi: "wczesna przewaga w wojnie dystansowej",
      Religia: "Konfucjanizm / Taoizm",
      nazwyKlastra: [
        "Qin",
        "Qi",
        "Chu",
        "Jin",
        "Yan",
        "Zhao",
        "Wei",
        "Han",
        "Lu",
        "Song"
      ],
      mnoznikHandelPieniadz: 2.4,
      ikonaId: "chinczycy",
      bonusy: [
        {
          typ: "bonus_walka",
          cel: "lukownicy",
          wartosc: 0.2,
          opis: "Kusznik: +20% ataku i zasi\u0119gu \u0142ucznik\xF3w/kusznik\xF3w (przewaga dystansowa)",
          realizuje: "walka"
        },
        {
          typ: "bonus_walka",
          cel: "kawaleria",
          wartosc: 0.15,
          opis: "Konnica stepowa: +15% uderzenia kawalerii przy szar\u017Cy",
          realizuje: "walka"
        },
        {
          typ: "jednostka_specjalna",
          cel: "dystans",
          wartosc: "Kusznik (lepszy \u0142ucznik)",
          opis: "Kusznik = silniejszy \u0142ucznik z kusz\u0105; wi\u0119kszy zasi\u0119g i przebicie pancerza",
          realizuje: "walka"
        }
      ],
      typCywilizacji: "chinczycy",
      archetyp: "chiny"
    },
    {
      Cywilizacja: "Inkowie",
      "Styl / charakter": "nauka/kultura + elitarna piechota",
      "Jednostka specjalna": "Chaska (maczuga gwia\u017Adzista) + Kr\xF3lewska Gwardia (elita)",
      "Bonus startowy": "+Nauka/Kultura (kalendarz); bonus w lesie/d\u017Cungli",
      "Bonusy/minusy (do dopracowania)": "brak konnicy i rydwan\xF3w (brak koni/wo\u0142\xF3w; \xA78c) \u2014 si\u0142a w piechocie i dystansie",
      Uwagi: null,
      Religia: "Kult S\u0142o\u0144ca Inti",
      nazwyKlastra: [
        "Cusco",
        "Machu Picchu",
        "Ollantaytambo",
        "Pisac",
        "Sacsayhuam\xE1n",
        "Vilcabamba",
        "Cajamarca",
        "Tambo Colorado",
        "Quito",
        "Tumbes"
      ],
      mnoznikHandelPieniadz: 1.9,
      ikonaId: "inkowie",
      bonusy: [
        {
          typ: "bonus_nauka",
          cel: "wszystko",
          wartosc: 0.15,
          opis: "Kalendarz s\u0142oneczny: +15% produkcji punkt\xF3w nauki (astronomia i agronomia)",
          realizuje: "ekonomia"
        },
        {
          typ: "bonus_walka",
          cel: "piechota",
          wartosc: 0.2,
          opis: "Teren g\xF3rski: +20% walki w lesie i d\u017Cungli (znajomo\u015B\u0107 terenu)",
          realizuje: "walka"
        },
        {
          typ: "jednostka_specjalna",
          cel: "piechota",
          wartosc: "Chaska / Kr\xF3lewska Gwardia",
          opis: "Chaska (maczuga gwia\u017Adzista) = elitarna piechota; Kr\xF3lewska Gwardia = oddzia\u0142y presti\u017Cowe",
          realizuje: "walka"
        }
      ],
      typCywilizacji: "inkowie",
      archetyp: "inkowie"
    },
    {
      Cywilizacja: "Zulusi",
      "Styl / charakter": "szybka, agresywna piechota",
      "Jednostka specjalna": "Impi",
      "Bonus startowy": "+Ruch i +Morale piechoty; tania, silna w grupie",
      "Bonusy/minusy (do dopracowania)": "s\u0142aby dystans",
      Uwagi: null,
      Religia: "Kult przodk\xF3w / animizm",
      nazwyKlastra: [
        "uMgungundlovu",
        "Ondini",
        "Ulundi",
        "kwaBulawayo",
        "eMakhosini",
        "Nobamba",
        "Nodwengu",
        "kwaDukuza",
        "Mahlabathini",
        "Babanango"
      ],
      mnoznikHandelPieniadz: 1.8,
      ikonaId: "zulusi",
      bonusy: [
        {
          typ: "bonus_walka",
          cel: "piechota",
          wartosc: 0.2,
          opis: "Ruch i morale: +20% pr\u0119dko\u015Bci piechoty i +morale przy ataku w grupie (formacja buffalo)",
          realizuje: "walka"
        },
        {
          typ: "bonus_walka",
          cel: "piechota",
          wartosc: 0.1,
          opis: "Tania rekrutacja: koszt rekrutacji Impi -10% (liczebno\u015B\u0107 > jako\u015B\u0107)",
          realizuje: "ekonomia"
        },
        {
          typ: "jednostka_specjalna",
          cel: "piechota",
          wartosc: "Impi",
          opis: "Impi = szybka piechota z assegai; silna w zmasowanym ataku, s\u0142aba na dystans",
          realizuje: "walka"
        }
      ],
      typCywilizacji: "zulusi",
      archetyp: "zulusi"
    },
    {
      Cywilizacja: "Egipt",
      "Styl / charakter": "rydwany + \u0142ucznicy dystansowi",
      "Jednostka specjalna": "Med\u017Caj (Gwardia Faraona)",
      "Bonus startowy": "+Atak dystansowy \u0142ucznik\xF3w; rydwany szybsze, z atakiem dystansowym i du\u017Cym zapasem strza\u0142u (rydwany-\u0142ucznicy)",
      "Bonusy/minusy (do dopracowania)": "s\u0142absza ci\u0119\u017Cka piechota frontalna",
      Uwagi: "Stary \u015Awiat \u2014 pe\u0142ny dost\u0119p do koni/wo\u0142\xF3w/rydwan\xF3w",
      Religia: "Religia egipska \u2014 faraon-b\xF3g",
      nazwyKlastra: [
        "Memfis",
        "Teby",
        "Heliopolis",
        "Abydos",
        "Nekhen",
        "Elefantyna",
        "Sais",
        "Bubastis",
        "Edfu",
        "Dendera"
      ],
      mnoznikHandelPieniadz: 2.1,
      ikonaId: "egipt",
      bonusy: [
        {
          typ: "bonus_walka",
          cel: "lukownicy",
          wartosc: 0.2,
          opis: "\u0141ucznicy na rydwanach: +20% ataku dystansowego; rydwany z du\u017Cym zapasem strza\u0142",
          realizuje: "walka"
        },
        {
          typ: "bonus_walka",
          cel: "rydwany",
          wartosc: 0.15,
          opis: "Szybkie rydwany: +15% pr\u0119dko\u015Bci i zasi\u0119gu ataku rydwan\xF3w bojowych",
          realizuje: "walka"
        },
        {
          typ: "jednostka_specjalna",
          cel: "piechota",
          wartosc: "Med\u017Caj (Gwardia Faraona)",
          opis: "Med\u017Caj = elitarna gwardia; najlepsza piechota Egiptu, ochrona centrum miasta",
          realizuje: "walka"
        }
      ],
      typCywilizacji: "egipt",
      archetyp: "egipt"
    },
    {
      Cywilizacja: "Sumerowie",
      "Styl / charakter": "ci\u0119\u017Cka piechota + \u0142ucznicy + mocne rydwany",
      "Jednostka specjalna": "Gwardia Kr\xF3lewska Sumeru",
      "Bonus startowy": "+Obrona i Health ci\u0119\u017Ckiej piechoty; silni \u0142ucznicy pieszni; ci\u0119\u017Ckie, mocne rydwany bojowe",
      "Bonusy/minusy (do dopracowania)": "wolniejsza lekka kawaleria",
      Uwagi: "Stary \u015Awiat \u2014 pe\u0142ny dost\u0119p do koni/wo\u0142\xF3w/rydwan\xF3w",
      Religia: "Religia sumeryjska (mezopotamska) \u2014 Enlil/Anu",
      nazwyKlastra: [
        "Uruk",
        "Ur",
        "Lagasz",
        "Kisz",
        "Nippur",
        "Eridu",
        "Umma",
        "Larsa",
        "Adab",
        "Isin"
      ],
      mnoznikHandelPieniadz: 2.2,
      ikonaId: "babilon",
      bonusy: [
        {
          typ: "bonus_obrona",
          cel: "piechota",
          wartosc: 0.2,
          opis: "Ci\u0119\u017Cka piechota: +20% obrony i HP ci\u0119\u017Ckiej piechoty (pancerz br\u0105zowy + tarcza)",
          realizuje: "walka"
        },
        {
          typ: "bonus_walka",
          cel: "rydwany",
          wartosc: 0.15,
          opis: "Ci\u0119\u017Ckie rydwany bojowe: +15% HP i obrony rydwan\xF3w (masywna konstrukcja)",
          realizuje: "walka"
        },
        {
          typ: "jednostka_specjalna",
          cel: "piechota",
          wartosc: "Gwardia Kr\xF3lewska Sumeru",
          opis: "Gwardia Kr\xF3lewska = szczyt ci\u0119\u017Ckiej piechoty Sumeru; pancerz i lanca; +obrona miasta",
          realizuje: "walka"
        }
      ],
      typCywilizacji: "babilon",
      archetyp: "sumer"
    },
    {
      Cywilizacja: "Celtowie",
      "Styl / charakter": "agresywna piechota z broni\u0105 sieczn\u0105; brawurowa szar\u017Ca",
      "Jednostka specjalna": "Miecznik galijski",
      "Bonus startowy": "+Atak/Morale piechoty przy szar\u017Cy (brawura); d\u0142ugie miecze \u2014 premia do Uderzenia",
      "Bonusy/minusy (do dopracowania)": "s\u0142absza dyscyplina/obrona w przeci\u0105g\u0142ej walce; brak ci\u0119\u017Ckiej formacji",
      Uwagi: "typ g\u0142\xF3wny (przysz\u0142a kultura \xA79d); ref-17 Miecznik galijski",
      Religia: "Religia celtycka (druidyzm)",
      nazwyKlastra: [
        "Bibracte",
        "Gergowia",
        "Alezja",
        "Avaricum",
        "Uxellodunum",
        "Manching",
        "Numancja",
        "Stradonice",
        "Z\xE1vist",
        "Heuneburg"
      ],
      mnoznikHandelPieniadz: 1.9,
      ikonaId: "celtowie",
      bonusy: [
        {
          typ: "bonus_walka",
          cel: "piechota",
          wartosc: 0.25,
          opis: "Brawura szar\u017Cy: +25% ataku piechoty przy pierwszym uderzeniu (furia celtycka)",
          realizuje: "walka"
        },
        {
          typ: "bonus_walka",
          cel: "piechota",
          wartosc: 0.15,
          opis: "D\u0142ugi miecz galijski: +15% Uderzenia (zasi\u0119g ostrza i si\u0142a ci\u0119cia)",
          realizuje: "walka"
        },
        {
          typ: "jednostka_specjalna",
          cel: "piechota",
          wartosc: "Miecznik galijski",
          opis: "Miecznik galijski = wojownik z d\u0142ugim mieczem; silny w szar\u017Cy, s\u0142abszy w przeci\u0105g\u0142ej obronie",
          realizuje: "walka"
        }
      ],
      typCywilizacji: "celtowie",
      archetyp: "celtowie"
    },
    {
      Cywilizacja: "Germanie",
      "Styl / charakter": "piechota le\u015Bna; zasadzki i furia bojowa",
      "Jednostka specjalna": "Wojownik germa\u0144ski (framea)",
      "Bonus startowy": "+walka w lesie i +zasadzka (pierwszy cios); furia bojowa (+Atak na starciu)",
      "Bonusy/minusy (do dopracowania)": "wolniejsza technologia/organizacja; s\u0142absze obl\u0119\u017Cnictwo",
      Uwagi: "typ g\u0142\xF3wny (przysz\u0142a kultura \xA79d, pokrewna Galom)",
      Religia: "Religia germa\u0144ska (Wotan / Odyn)",
      nazwyKlastra: [
        "Mattium",
        "Feddersen Wierde",
        "Hodde",
        "Gr\xF8ntoft",
        "Fl\xF6geln",
        "Wijster",
        "Ezinge",
        "Jastorf",
        "Gamla Uppsala",
        "Tofting"
      ],
      mnoznikHandelPieniadz: 1.7,
      ikonaId: "germanie",
      bonusy: [
        {
          typ: "bonus_walka",
          cel: "piechota",
          wartosc: 0.25,
          opis: "Zasadzka le\u015Bna: +25% ataku przy walce w lesie lub przy pierwszym ciosie z zasadzki",
          realizuje: "walka"
        },
        {
          typ: "bonus_walka",
          cel: "piechota",
          wartosc: 0.15,
          opis: "Furia bojowa: +15% ataku na starciu (bonus morale przy bezpo\u015Brednim kontakcie)",
          realizuje: "walka"
        },
        {
          typ: "jednostka_specjalna",
          cel: "piechota",
          wartosc: "Wojownik germa\u0144ski (framea)",
          opis: "Framea = w\u0142\xF3cznia/oszczep germa\u0144ski; celny rzut + walka wr\u0119cz; specjalista od zasadzki",
          realizuje: "walka"
        }
      ],
      typCywilizacji: "germanie",
      archetyp: "germanie"
    }
  ],
  start_gry: [
    {
      Parametr: "Osadnicy na start (gracz)",
      Warto\u015B\u0107: "1",
      Uwagi: "gracz zawsze startuje z 1 osadnikiem"
    },
    {
      Parametr: "Cywilizacje na mapie",
      Warto\u015B\u0107: "90",
      Uwagi: "9 typ\xF3w \xD7 10 miast (1 gracz + 9 rywali tego samego typu = klaster); skaluje si\u0119 z map\u0105"
    },
    {
      Parametr: "G\u0142\xF3wne cywilizacje (typy)",
      Warto\u015B\u0107: "9 (Grecy, Rzymianie, Chi\u0144czycy, Inkowie, Zulusi, Egipt, Sumerowie, Celtowie, Germanie)",
      Uwagi: "typy rozmieszczone w r\xF3\u017Cnych regionach mapy (Celtowie/Germanie = \xA79d; Celtowie = Galowie / Miecznik galijski)"
    },
    {
      Parametr: "Cywilizacje pocz\u0105tkowe",
      Warto\u015B\u0107: "miasta tego samego typu (klaster)",
      Uwagi: "to NIE osobne nacje \u2014 to miasta/AI tego samego typu wok\xF3\u0142 g\u0142\xF3wnej cyw. (1 gracz + 9 rywali); uproszczona dyplomacja: osobny, p\xF3\u017Aniejszy w\u0105tek"
    },
    {
      Parametr: "Rywale tego samego typu wok\xF3\u0142 gracza",
      Warto\u015B\u0107: "~9 (AI)",
      Uwagi: "9 rywali wok\xF3\u0142 gracza = klaster 10 miast danego typu; miasta min. ~9 p\xF3l od siebie (regu\u0142a map-gen)"
    },
    {
      Parametr: "Cel startu",
      Warto\u015B\u0107: "pokona\u0107 rywali w\u0142asnego typu",
      Uwagi: "zanim napotkasz inne typy cywilizacji"
    },
    {
      Parametr: "Ludno\u015B\u0107 w terenie",
      Warto\u015B\u0107: "ka\u017Cdy zamieszkiwalny heks (\u22651 \u017Cywno\u015B\u0107) = 1 wioska/1 ludno\u015B\u0107",
      Uwagi: "g\xF3ry/ja\u0142owe = 0 ludno\u015Bci"
    },
    {
      Parametr: "Przejmowanie terenu",
      Warto\u015B\u0107: "odkrycie/zaj\u0119cie \u2192 wioska + ludno\u015B\u0107 staje si\u0119 nasza (obywatele, nie niewolnicy), przypisana do najbli\u017Cszego miasta",
      Uwagi: null
    },
    {
      Parametr: "Wzrost ludno\u015Bci",
      Warto\u015B\u0107: "szybki przez ekspansj\u0119, ograniczony \u017Cywno\u015Bci\u0105",
      Uwagi: "najpierw zdob\u0105d\u017A tereny rolne, by wy\u017Cywi\u0107"
    },
    {
      Parametr: "Jednostka specjalna",
      Warto\u015B\u0107: "1 na cywilizacj\u0119",
      Uwagi: "niekoniecznie w ka\u017Cdej epoce"
    },
    {
      Parametr: "Bonusy/minusy cywilizacji",
      Warto\u015B\u0107: "do dopracowania",
      Uwagi: "doprecyzujemy p\xF3\u017Aniej"
    }
  ]
};

// data/terrain-yields.json
var terrain_yields_default = {
  terrain_types: [
    {
      Teren: "\u0141\u0105ka",
      \u017Bywno\u015B\u0107: 4,
      Praca: 1,
      Handel: 1,
      Drewno: 1,
      Kamie\u0144: 0,
      Suma: 7,
      Uwagi: null
    },
    {
      Teren: "R\xF3wnina",
      \u017Bywno\u015B\u0107: 2,
      Praca: 1,
      Handel: 1,
      Drewno: 2,
      Kamie\u0144: 1,
      Suma: 7,
      Uwagi: null
    },
    {
      Teren: "Wzg\xF3rza",
      \u017Bywno\u015B\u0107: 1,
      Praca: 2,
      Handel: 0,
      Drewno: 2,
      Kamie\u0144: 2,
      Suma: 7,
      Uwagi: "Kamie\u0144/Ruda po zbudowaniu Kopalni; +obrona"
    },
    {
      Teren: "G\xF3ry",
      \u017Bywno\u015B\u0107: 0,
      Praca: 0,
      Handel: 0,
      Drewno: 2,
      Kamie\u0144: 5,
      Suma: 7,
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
      Praca: 0,
      Handel: -1,
      Drewno: 3,
      Kamie\u0144: 0,
      Suma: 1,
      Uwagi: "Pod lasem zawsze jest teren bazowy (\u0142\u0105ka/r\xF3wnina/wzg\xF3rza itp.); las daje +drewno, redukuje \u017Cywno\u015B\u0107 i handel"
    }
  ]
};

// data/terrain-combat.json
var terrain_combat_default = [
  {
    Teren: "P\u0142askie (r\xF3wnina/\u0142\u0105ka)",
    "Koszt wej\u015Bcia (ruch)": "1",
    "Bonus Obrona": "+0%",
    "\u0394 Zasi\u0119g (dystansowi)": "0",
    "Kawaleria/Rydwan": "pe\u0142ny ruch (najszybsze)",
    "Efekt specjalny": "kawaleria i rydwany optymalne na p\u0142askim"
  },
  {
    Teren: "Las",
    "Koszt wej\u015Bcia (ruch)": "2 (\xBD ruchu)",
    "Bonus Obrona": "+50% TYLKO vs \u0142ucznicy/konnica/rydwany",
    "\u0394 Zasi\u0119g (dystansowi)": "\u22121 (zas\u0142ona)",
    "Kawaleria/Rydwan": "koszt \xD72 \u2014 mocno spowolnione",
    "Efekt specjalny": "dystansowi \u2212celno\u015B\u0107; brak bonusu obrony w piechota vs piechota"
  },
  {
    Teren: "Wzg\xF3rza",
    "Koszt wej\u015Bcia (ruch)": "2 (wej\u015Bcie zu\u017Cywa ca\u0142\u0105 tur\u0119 ruchu)",
    "Bonus Obrona": "+50%",
    "\u0394 Zasi\u0119g (dystansowi)": "+1",
    "Kawaleria/Rydwan": "spowolnione",
    "Efekt specjalny": "\u0142ucznicy +1 zasi\u0119g; wej\u015Bcie = traci 1 tur\u0119, ale +50% Obrona"
  },
  {
    Teren: "G\xF3ry",
    "Koszt wej\u015Bcia (ruch)": "3\u20134 (bardzo wolno)",
    "Bonus Obrona": "+50\u2013100%",
    "\u0394 Zasi\u0119g (dystansowi)": "+1",
    "Kawaleria/Rydwan": "NIEDOST\u0118PNE dla kawalerii/rydwan\xF3w",
    "Efekt specjalny": "tylko piechota; silna obrona"
  },
  {
    Teren: "Rzeka",
    "Koszt wej\u015Bcia (ruch)": "wej\u015Bcie = STOP (ko\u0144czy ruch, stoi 1 tur\u0119)",
    "Bonus Obrona": "\u2014",
    "\u0394 Zasi\u0119g (dystansowi)": "\u2014",
    "Kawaleria/Rydwan": "przekraczanie ryzykowne",
    "Efekt specjalny": "wszystkie jednostki zatrzymuj\u0105 si\u0119 na 1 tur\u0119; \u221225% Atak przy przekraczaniu"
  },
  {
    Teren: "Pustynia",
    "Koszt wej\u015Bcia (ruch)": "1\u20132",
    "Bonus Obrona": "+0%",
    "\u0394 Zasi\u0119g (dystansowi)": "0",
    "Kawaleria/Rydwan": "normalny/spowolnione",
    "Efekt specjalny": "brak os\u0142ony"
  },
  {
    Teren: "Wybrze\u017Ce / Morze",
    "Koszt wej\u015Bcia (ruch)": "\u2014",
    "Bonus Obrona": "\u2014",
    "\u0394 Zasi\u0119g (dystansowi)": "\u2014",
    "Kawaleria/Rydwan": "\u2014",
    "Efekt specjalny": "tylko jednostki morskie (Galera); piechota nie wchodzi na g\u0142\u0119bok\u0105 wod\u0119"
  }
];

// data/counters.json
var counters_default = [
  {
    "Typ atakuj\u0105cy": "W\u0142\xF3cznik",
    "Cel (typ)": "Konnica/Rydwan",
    Bonus: "+50%",
    "Rodzaj (Atak/Obrona)": "Atak",
    Status: "potwierdzone"
  },
  {
    "Typ atakuj\u0105cy": "W\u0142\xF3cznik",
    "Cel (typ)": "Konnica/Rydwan",
    Bonus: "+50%",
    "Rodzaj (Atak/Obrona)": "Obrona",
    Status: "potwierdzone"
  },
  {
    "Typ atakuj\u0105cy": "Konnica/Rydwan",
    "Cel (typ)": "Dystansowe (\u0142ucznik/oszczepnik/procarz)",
    Bonus: "+50%",
    "Rodzaj (Atak/Obrona)": "Atak",
    Status: "potwierdzone"
  },
  {
    "Typ atakuj\u0105cy": "Procarz",
    "Cel (typ)": "W\u0142\xF3cznik",
    Bonus: "+50%",
    "Rodzaj (Atak/Obrona)": "Atak",
    Status: "potwierdzone"
  },
  {
    "Typ atakuj\u0105cy": "Atak z flanki (z boku)",
    "Cel (typ)": "Falanga, \u0142ucznicy",
    Bonus: "\u221250%",
    "Rodzaj (Atak/Obrona)": "Obrona",
    Status: "potwierdzone"
  }
];

// data/diplomacy.json
var diplomacy_default = {
  params: {
    handelZawarcie_zaufanie: 2,
    pomocSojusznikowi_zaufanie: 10,
    wspolnyWrogNawiazanie_zaufanie: 5,
    dar_zaufanie: 6,
    zlamanaPaktGracz_zaufanie: -40,
    zlamanaPaktAI_zaufanie: -20,
    zdrada_zaufanie: -50,
    szpiegWykryty_zaufanie: -15,
    rywalizacjaTenSamTyp_zaufanie: -20,
    roznicaKulturowa_zaufanie: -5,
    przewagaMilitarna_respekt: 15,
    slabszyMilitarnie_respekt: -10,
    wygraBitwa_respekt: 5,
    trybut_respekt: 10,
    wspolnyWrogAkceptacja_respekt: 10,
    handel_zaufanie_perTura: 1,
    aktywnyPakt_zaufanie_perTura: 1,
    dobraWola_zaufanie_perTura: 1,
    wspolnyWrog_zaufanie_perTura: 1,
    wspolnaReligia_zaufanie_perTura: 0.5,
    odmiennaReligia_zaufanie_perTura: -0.5,
    ekspansjaGranica_zaufanie_perTura: -2,
    urazyHistoryczne_zaufanie_perTura: -2,
    progSojuszZaufanie: 60,
    progWymianaTechZaufanie: 70,
    progWasalizacjaRespekt: 70,
    progWchloniecieRespekt: 90,
    progMinimalnyRelacja: 30,
    progSojuszRelacja: 120,
    startZaufanie: 20,
    startRespekt: 30,
    mnoznikZaufania: 1,
    mnoznikRespektu: 1,
    mnoznikPodarunku: 1,
    turyEfektuPodarunku: 5,
    progPoboczneAkceptacja: 60,
    progPoboczneHandel: 30,
    progPoboczneWojna: 15
  },
  akcje_dyplomatyczne: [
    {
      Akcja: "1. Nawi\u0105zanie kontaktu",
      Opis: "Pierwszy kontakt \u2014 otwiera okno dyplomatyczne. Bez tego \u017Cadne dalsze akcje nie s\u0105 mo\u017Cliwe. Automatyczne przy spotkaniu jednostek lub aktywowane przez pos\u0142a\u0144ca.",
      "Dost\u0119pne: G\u0142\xF3wni rywale": "TAK",
      "Dost\u0119pne: Poboczni": "TAK",
      Koszt: "Bezp\u0142atny przy spotkaniu; Pos\u0142aniec: 5 Pieni\u0119dzy (lub 50 Pracy przed Walut\u0105)",
      Efekt: "Odblokowanie wszystkich dost\u0119pnych akcji; pierwsze wra\u017Cenie (+/\u2212 Relacja zale\u017Cnie od si\u0142y i archetypu)"
    },
    {
      Akcja: "2. Pakt o nieagresji",
      Opis: "Obie strony zobowi\u0105zuj\u0105 si\u0119 nie atakowa\u0107 przez N tur. Z\u0142amanie: \u221230 Relacja, \u221220 Zaufanie, kara reputacyjna u s\u0105siad\xF3w.",
      "Dost\u0119pne: G\u0142\xF3wni rywale": "TAK",
      "Dost\u0119pne: Poboczni": "UPR",
      Koszt: "Brak kosztu walutowego; warto\u015B\u0107 polityczna",
      Efekt: "Flaga NAP aktywny na 10\u201320 tur (negocjowalne). UPR: automatyczny, sta\u0142y czas 10 tur"
    },
    {
      Akcja: "3. Sojusz wojskowy",
      Opis: "Formalne przymierze: atak na jedn\u0105 stron\u0119 = atak na obie. Wypowiedzenie: \u221225 Relacja, \u221220 Zaufanie.",
      "Dost\u0119pne: G\u0142\xF3wni rywale": "TAK",
      "Dost\u0119pne: Poboczni": "NIE",
      Koszt: "Negocjacja \u2014 mo\u017Ce wymaga\u0107 op\u0142aty lub wymiany technologii jako gwarantu",
      Efekt: "Automatyczne wej\u015Bcie do wojen partnera (lub odmowa: \u221215 Zaufanie). Czas: bezterminowy"
    },
    {
      Akcja: "4. Otwarte granice / prawo przemarszu",
      Opis: "Zezwolenie na swobodny ruch jednostek cywilnych lub wojskowych. Nieautoryzowany przemarsz: \u221215 Relacja/tura.",
      "Dost\u0119pne: G\u0142\xF3wni rywale": "TAK",
      "Dost\u0119pne: Poboczni": "UPR",
      Koszt: "Cywilne: 10\u201330 Pieni\u0119dzy; Wojskowe: 20\u201360 Pieni\u0119dzy + wzajemno\u015B\u0107",
      Efekt: "Jednostki poruszaj\u0105 si\u0119 swobodnie przez obce terytorium. UPR: tylko cywilne, bez negocjacji ceny"
    },
    {
      Akcja: "5. Umowa handlowa",
      Opis: "Regularny lub jednorazowy transfer surowc\xF3w, Pracy lub Pieni\u0119dzy. Handel Pieni\u0105dzem wymaga Waluty u obu stron. Zerwanie: \u221215 Relacja, \u221210 Zaufanie.",
      "Dost\u0119pne: G\u0142\xF3wni rywale": "TAK",
      "Dost\u0119pne: Poboczni": "UPR",
      Koszt: "Okre\u015Blony w tre\u015Bci umowy (np. 10 Pieni\u0119dzy/tura za dost\u0119p do rudy)",
      Efekt: "Transfer zasob\xF3w; +2 Relacja/tura, +1 Zaufanie/tura przy aktywnym handlu. UPR: jednorazowe transakcje"
    },
    {
      Akcja: "6. Wymiana / sprzeda\u017C technologii",
      Opis: "Przekazanie wynalazku drugiej stronie \u2014 sprzeda\u017C lub wymiana za inn\u0105 technologi\u0119 / surowce / Pieni\u0105dze. Wymiana bezp\u0142atna: +5 Zaufanie.",
      "Dost\u0119pne: G\u0142\xF3wni rywale": "TAK",
      "Dost\u0119pne: Poboczni": "NIE",
      Koszt: "Sprzeda\u017C: 50\u2013300 Pieni\u0119dzy (zale\u017Cnie od epoki); Wymiana: technologia o zbli\u017Conej warto\u015Bci",
      Efekt: "Kupuj\u0105cy zyskuje technologi\u0119 natychmiast; sprzedaj\u0105cy traci przewag\u0119 lecz zysk finansowy/reputacyjny"
    },
    {
      Akcja: "7. Wsp\xF3lny wr\xF3g / namowa do wojny",
      Opis: "Pro\u015Bba do cywilizacji, by wypowiedzia\u0142a wojn\u0119 wskazanemu wrogowi. Skuteczno\u015B\u0107 zale\u017Cy od Respektu i Relacji.",
      "Dost\u0119pne: G\u0142\xF3wni rywale": "TAK",
      "Dost\u0119pne: Poboczni": "NIE",
      Koszt: "30\u2013150 Pieni\u0119dzy (\u0142ap\xF3wka) lub zobowi\u0105zanie do ataku / oddanie surowc\xF3w",
      Efekt: "Akceptacja: wskazana cyw. wypowiada wojn\u0119 + gracz: +10 Respekt, +5 Relacja z nam\xF3wionym. Odmowa: brak skutku"
    },
    {
      Akcja: "8. \u017B\u0105danie / oferta trybutu",
      Opis: "Silniejsza strona \u017C\u0105da p\u0142atno\u015Bci od s\u0142abszej. Mo\u017Cna te\u017C odwr\xF3ci\u0107 \u2014 zaoferowa\u0107 trybut, by unikn\u0105\u0107 konfliktu.",
      "Dost\u0119pne: G\u0142\xF3wni rywale": "TAK",
      "Dost\u0119pne: Poboczni": "TAK",
      Koszt: "\u017B\u0105danie: \u226510 Pieni\u0119dzy/tura; Oferta: dowolna kwota",
      Efekt: "Akceptacja \u017C\u0105dania: p\u0142atno\u015Bci + +10 Respekt; Odmowa: \u221210 Relacja, casus belli. Oferta: +5 Relacja"
    },
    {
      Akcja: "9. Ultimatum / gro\u017Aba",
      Opis: "\u017B\u0105danie natychmiastowego spe\u0142nienia warunku (wycofanie wojsk, oddanie miasta itp.) pod gro\u017Ab\u0105 wojny.",
      "Dost\u0119pne: G\u0142\xF3wni rywale": "TAK",
      "Dost\u0119pne: Poboczni": "UPR",
      Koszt: "Brak kosztu walutowego; wysokie ryzyko reputacyjne przy nieuzasadnionym u\u017Cyciu",
      Efekt: "Spe\u0142nienie: warunek zrealizowany, \u22125 Relacja u adresata. Odmowa: casus belli. UPR: tylko poddanie si\u0119"
    },
    {
      Akcja: "10. Propozycja pokoju / zawieszenia broni",
      Opis: "Zako\u0144czenie aktywnej wojny pokojem (trwa\u0142ym) lub rozejmem (tymczasowym). Mo\u017Ce zawiera\u0107 warunki: reparacje, cesja terytori\xF3w.",
      "Dost\u0119pne: G\u0142\xF3wni rywale": "TAK",
      "Dost\u0119pne: Poboczni": "TAK",
      Koszt: "Reparacje: 50\u2013500 Pieni\u0119dzy lub cesja terytori\xF3w (opcjonalne)",
      Efekt: "Pok\xF3j: +5 Relacja po czasie. Rozejm: na 5\u201315 tur bez kary za wznowienie. Odrzucenie: brak skutku"
    },
    {
      Akcja: "11. Wypowiedzenie wojny",
      Opis: "Formalna deklaracja stanu wojennego. Z casus belli lub bez (agresja niesprowokowana = kara reputacyjna).",
      "Dost\u0119pne: G\u0142\xF3wni rywale": "TAK",
      "Dost\u0119pne: Poboczni": "TAK",
      Koszt: "Brak kosztu walutowego; koszt reputacyjny zale\u017Cny od kontekstu",
      Efekt: "Z casus belli: \u221210 Relacja u wszystkich. Bez c.b.: \u221225 Relacja u wszystkich, \u221220 Zaufanie, flaga agresor"
    },
    {
      Akcja: "12. Wasalizacja / wch\u0142oni\u0119cie",
      Opis: "S\u0142absza cywilizacja staje si\u0119 wasalem (zachowuje terytorium, p\u0142aci trybut) lub zostaje w pe\u0142ni wch\u0142oni\u0119ta przez gracza.",
      "Dost\u0119pne: G\u0142\xF3wni rywale": "TAK",
      "Dost\u0119pne: Poboczni": "TAK",
      Koszt: "Wasalizacja: 100\u2013300 Pieni\u0119dzy gwarancji + zobowi\u0105zanie ochrony; Wch\u0142oni\u0119cie: kary reputacyjne",
      Efekt: "Wasal: trybut, prawo przemarszu, zakaz sojuszy bez zgody. Wch\u0142oni\u0119cie: miasta przechodz\u0105, niezadowolenie N tur"
    }
  ],
  parametry_relacji: [
    {
      Parametr: "Relacja og\xF3lna",
      Zakres: "0 \u2026 200",
      "Warto\u015B\u0107 startowa": 50,
      Opis: "Suma Zaufania + Respektu (Relacja = Zaufanie + Respekt, zakres 0\u2013200). Okre\u015Bla d\u017Awigni\u0119 negocjacyjn\u0105. Poni\u017Cej 30: dyplomacja niemal niemo\u017Cliwa; powy\u017Cej 120: sojusze osi\u0105galne."
    },
    {
      Parametr: "Respekt / Strach",
      Zakres: "0 \u2026 100",
      "Warto\u015B\u0107 startowa": 30,
      Opis: "CZYSTA MOC (hard power). Zale\u017Cy WY\u0141\u0104CZNIE od: si\u0142y/wielko\u015Bci armii, liczby wygranych bitew i punkt\xF3w mocy cywilizacji (Power = wojsko + miasta + gospodarka + epoka). Liczony WZGL\u0118DEM partnera."
    },
    {
      Parametr: "Zaufanie",
      Zakres: "0 \u2026 100",
      "Warto\u015B\u0107 startowa": 20,
      Opis: "RELACJA MI\u0118KKA / goodwill. Zmienia si\u0119 od dzia\u0142a\u0144 (pakty, pomoc, handel, podarunki). Ka\u017Cde dzia\u0142anie ma znak +/\u2212. Cz\u0119\u015B\u0107 zmian jednorazowa, cz\u0119\u015B\u0107 co tur\u0119. Darmowe podarunki podnosz\u0105 zaufanie z czasem."
    }
  ],
  zmiany_parametr\u00F3w: [
    {
      "Zdarzenie / Dzia\u0142anie": "Aktywny handel (trwa umowa handlowa)",
      Parametr: "Zaufanie",
      Zmiana: "+1",
      "Znak (+/\u2212)": "+",
      "Typ (co tur\u0119 / jednorazowo)": "co tur\u0119",
      Uwagi: "Przez ca\u0142y czas trwania umowy handlowej"
    },
    {
      "Zdarzenie / Dzia\u0142anie": "Zawarcie umowy handlowej",
      Parametr: "Zaufanie",
      Zmiana: "+2",
      "Znak (+/\u2212)": "+",
      "Typ (co tur\u0119 / jednorazowo)": "jednorazowo",
      Uwagi: "Bonus przy podpisaniu nowej umowy"
    },
    {
      "Zdarzenie / Dzia\u0142anie": "Dotrzymany pakt (NAP lub sojusz trwa)",
      Parametr: "Zaufanie",
      Zmiana: "+1",
      "Znak (+/\u2212)": "+",
      "Typ (co tur\u0119 / jednorazowo)": "co tur\u0119",
      Uwagi: "Pasywny bonus za ka\u017Cd\u0105 tur\u0119 aktywnego paktu"
    },
    {
      "Zdarzenie / Dzia\u0142anie": "Pomoc w wojnie sojusznikowi",
      Parametr: "Zaufanie",
      Zmiana: "+10",
      "Znak (+/\u2212)": "+",
      "Typ (co tur\u0119 / jednorazowo)": "jednorazowo",
      Uwagi: "Bonus po zako\u0144czeniu wsp\xF3lnej kampanii"
    },
    {
      "Zdarzenie / Dzia\u0142anie": "Wsp\xF3lny wr\xF3g \u2014 nawi\u0105zanie kooperacji",
      Parametr: "Zaufanie",
      Zmiana: "+5",
      "Znak (+/\u2212)": "+",
      "Typ (co tur\u0119 / jednorazowo)": "jednorazowo",
      Uwagi: "Bonus przy ustanowieniu wsp\xF3lnego wroga"
    },
    {
      "Zdarzenie / Dzia\u0142anie": "Wsp\xF3lny wr\xF3g (trwa aktywna kooperacja)",
      Parametr: "Zaufanie",
      Zmiana: "+1",
      "Znak (+/\u2212)": "+",
      "Typ (co tur\u0119 / jednorazowo)": "co tur\u0119",
      Uwagi: "Przez ca\u0142y czas trwania wsp\xF3\u0142pracy"
    },
    {
      "Zdarzenie / Dzia\u0142anie": "Podarunek surowca / Pieni\u0105dza (gratis)",
      Parametr: "Zaufanie",
      Zmiana: "+6",
      "Znak (+/\u2212)": "+",
      "Typ (co tur\u0119 / jednorazowo)": "jednorazowo",
      Uwagi: "Darmowy dar bez wymiany wzajemnej; goodwill jednorazowy"
    },
    {
      "Zdarzenie / Dzia\u0142anie": "Podarunek surowca / Pieni\u0105dza (gratis)",
      Parametr: "Zaufanie",
      Zmiana: "+1",
      "Znak (+/\u2212)": "+",
      "Typ (co tur\u0119 / jednorazowo)": "co tur\u0119",
      Uwagi: "Efekt dobrej woli utrzymuje si\u0119 kilka tur po podarunku"
    },
    {
      "Zdarzenie / Dzia\u0142anie": "Wsp\xF3lna religia",
      Parametr: "Zaufanie",
      Zmiana: "+0.5 (max +15)",
      "Znak (+/\u2212)": "+",
      "Typ (co tur\u0119 / jednorazowo)": "co tur\u0119",
      Uwagi: "Pasywny bonus gdy obie cywilizacje wyznaj\u0105 t\u0119 sam\u0105 religi\u0119"
    },
    {
      "Zdarzenie / Dzia\u0142anie": "Odmienna religia",
      Parametr: "Zaufanie",
      Zmiana: "-0.5 (max -10)",
      "Znak (+/\u2212)": "-",
      "Typ (co tur\u0119 / jednorazowo)": "co tur\u0119",
      Uwagi: "Pasywne tarcia; istotniejsze w epoce religijnej"
    },
    {
      "Zdarzenie / Dzia\u0142anie": "Ekspansja / osadnictwo przy granicy",
      Parametr: "Zaufanie",
      Zmiana: "-2",
      "Znak (+/\u2212)": "-",
      "Typ (co tur\u0119 / jednorazowo)": "co tur\u0119",
      Uwagi: "Gracz lub AI zak\u0142ada miasto / przesuwa wojska przy granicy"
    },
    {
      "Zdarzenie / Dzia\u0142anie": "Z\u0142amany pakt przez gracza",
      Parametr: "Zaufanie",
      Zmiana: "-40",
      "Znak (+/\u2212)": "-",
      "Typ (co tur\u0119 / jednorazowo)": "jednorazowo",
      Uwagi: "Informacja rozchodzi si\u0119 do s\u0105siad\xF3w (-5 Relacja u ka\u017Cdego)"
    },
    {
      "Zdarzenie / Dzia\u0142anie": "Z\u0142amany pakt przez AI",
      Parametr: "Zaufanie",
      Zmiana: "-20",
      "Znak (+/\u2212)": "-",
      "Typ (co tur\u0119 / jednorazowo)": "jednorazowo",
      Uwagi: "Gracz traci Zaufanie do tej cywilizacji"
    },
    {
      "Zdarzenie / Dzia\u0142anie": "Zdrada / atak z zaskoczenia (na gracza)",
      Parametr: "Zaufanie",
      Zmiana: "-50",
      "Znak (+/\u2212)": "-",
      "Typ (co tur\u0119 / jednorazowo)": "jednorazowo",
      Uwagi: "Flaga 'agresor'; kara reputacyjna globalna"
    },
    {
      "Zdarzenie / Dzia\u0142anie": "Szpiegostwo wykryte przez przeciwnika",
      Parametr: "Zaufanie",
      Zmiana: "-15",
      "Znak (+/\u2212)": "-",
      "Typ (co tur\u0119 / jednorazowo)": "jednorazowo",
      Uwagi: "Gdy szpieg gracza zostaje schwytany (epoka p\xF3\u017Ana)"
    },
    {
      "Zdarzenie / Dzia\u0142anie": "Rywalizacja tego samego typu (start gry)",
      Parametr: "Zaufanie",
      Zmiana: "-20",
      "Znak (+/\u2212)": "-",
      "Typ (co tur\u0119 / jednorazowo)": "jednorazowo",
      Uwagi: "Startowa korekta przy inicjalizacji mapy (Grecy vs Grecy itp.)"
    },
    {
      "Zdarzenie / Dzia\u0142anie": "Du\u017Ca r\xF3\u017Cnica kulturowa (r\xF3\u017Cny typ)",
      Parametr: "Zaufanie",
      Zmiana: "-5",
      "Znak (+/\u2212)": "-",
      "Typ (co tur\u0119 / jednorazowo)": "jednorazowo",
      Uwagi: "Bazowe tarcia mi\u0119dzy innymi archetypalnie cywilizacjami"
    },
    {
      "Zdarzenie / Dzia\u0142anie": "Urazy historyczne (nagromadzone)",
      Parametr: "Zaufanie",
      Zmiana: "-10 \u2026 -40",
      "Znak (+/\u2212)": "-",
      "Typ (co tur\u0119 / jednorazowo)": "co tur\u0119",
      Uwagi: "Maleje powoli co 20 tur; trwa\u0142a korekta za ataki/aneksje"
    },
    {
      "Zdarzenie / Dzia\u0142anie": "Znacz\u0105ca przewaga militarna gracza",
      Parametr: "Respekt",
      Zmiana: "+15",
      "Znak (+/\u2212)": "+",
      "Typ (co tur\u0119 / jednorazowo)": "jednorazowo",
      Uwagi: "Skok przy przekroczeniu progu si\u0142y (2\xD7 lub 5\xD7 warto\u015B\u0107 AI)"
    },
    {
      "Zdarzenie / Dzia\u0142anie": "Gracz s\u0142abszy militarnie od partnera",
      Parametr: "Respekt",
      Zmiana: "-10",
      "Znak (+/\u2212)": "-",
      "Typ (co tur\u0119 / jednorazowo)": "jednorazowo",
      Uwagi: "Respekt spada; AI staje si\u0119 asertywniejsze"
    },
    {
      "Zdarzenie / Dzia\u0142anie": "Wygrana bitwa (historia bojowa)",
      Parametr: "Respekt",
      Zmiana: "+5",
      "Znak (+/\u2212)": "+",
      "Typ (co tur\u0119 / jednorazowo)": "jednorazowo",
      Uwagi: "Ka\u017Cda wygrana bitwa podnosi punkty mocy bojowej gracza"
    },
    {
      "Zdarzenie / Dzia\u0142anie": "Pr\xF3g: Sojusz dost\u0119pny gdy Zaufanie \u2265",
      Parametr: "Zaufanie",
      Zmiana: 60,
      "Znak (+/\u2212)": "pr\xF3g",
      "Typ (co tur\u0119 / jednorazowo)": "pr\xF3g (sta\u0142y)",
      Uwagi: "Poni\u017Cej progu opcja Sojusz wojskowy jest nieaktywna"
    },
    {
      "Zdarzenie / Dzia\u0142anie": "Pr\xF3g: Wymiana technologii gdy Zaufanie \u2265",
      Parametr: "Zaufanie",
      Zmiana: 70,
      "Znak (+/\u2212)": "pr\xF3g",
      "Typ (co tur\u0119 / jednorazowo)": "pr\xF3g (sta\u0142y)",
      Uwagi: "Poni\u017Cej progu akcja Wymiana technologii jest zablokowana"
    }
  ],
  "respekt_-_czynniki": [
    {
      Czynnik: "Wielko\u015B\u0107 armii (absolutna liczba jednostek bojowych)",
      "Waga (%)": 28,
      Opis: "G\u0142\xF3wny sygna\u0142 hard power \u2014 widoczna si\u0142a militarna. Dominuje, bo Respekt = strach."
    },
    {
      Czynnik: "Wygrane bitwy (historia bojowa, skumulowana)",
      "Waga (%)": 20,
      Opis: "Kumulatywna historia zwyciestw. Sygnalizuje doswiadczenie bojowe i agresywnosc; trudno podrobi\u0107."
    },
    {
      Czynnik: "Ludnosc (mieszkancy/jednostki w miastach)",
      "Waga (%)": 18,
      Opis: "Potencjal mobilizacyjny \u2014 wiecej ludnosci = wiecej rekrutow i sily roboczej."
    },
    {
      Czynnik: "Liczba miast i kontrolowane terytorium",
      "Waga (%)": 14,
      Opis: "Wieksze imperium = wiecej zasobow i zdolnosci produkcyjnych."
    },
    {
      Czynnik: "Gospodarka (skarbiec/dochod)",
      "Waga (%)": 12,
      Opis: "Bogata nacja finansuje wojne i lapowki dyplomatyczne."
    },
    {
      Czynnik: "Epoka / postep technologiczny",
      "Waga (%)": 8,
      Opis: "Wyzsza epoka = lepsza technologia wojskowa (Kamien=0, Braz=0.5, Zelazo=1.0 itp.)."
    },
    {
      Czynnik: "SUMA WAG \u2192",
      "Waga (%)": 100,
      Opis: "% (dostosuj wagi \u2014 powinny sumowac sie do 100%). Militaria (armia+bitwy) = 48%."
    }
  ],
  panel_sterowania: {
    A: {
      name: "WAGI KOMPONENTOW POTEGI NACJI (hard power \u2014 podstawa Respektu)",
      records: [
        {
          "Komponent Potegi": "Wielko\u015B\u0107 armii (absolutna liczba jednostek bojowych)",
          Klucz: "wielkoscArmii",
          "Waga (%)": 28,
          Opis: "Glowny sygnal hard power \u2014 widoczna sila militarna"
        },
        {
          "Komponent Potegi": "Wygrane bitwy (historia bojowa, skumulowana)",
          Klucz: "wygraneBitwy",
          "Waga (%)": 20,
          Opis: "Kumulatywna historia zwyciestw; trudno podrobi\u0107"
        },
        {
          "Komponent Potegi": "Ludnosc (mieszkancy/jednostki w miastach)",
          Klucz: "ludnosc",
          "Waga (%)": 18,
          Opis: "Potencjal mobilizacyjny nacji"
        },
        {
          "Komponent Potegi": "Liczba miast i kontrolowane terytorium",
          Klucz: "miasta",
          "Waga (%)": 14,
          Opis: "Wieksze imperium = wiecej zasobow i rekrutacji"
        },
        {
          "Komponent Potegi": "Gospodarka (skarbiec/dochod)",
          Klucz: "gospodarka",
          "Waga (%)": 12,
          Opis: "Poziom ekonomiczny; dostep do surowcow strategicznych"
        },
        {
          "Komponent Potegi": "Epoka / postep technologiczny",
          Klucz: "epoka",
          "Waga (%)": 8,
          Opis: "Wyzsza epoka = lepsza technologia wojskowa"
        },
        {
          "Komponent Potegi": "SUMA WAG \u2192",
          Klucz: "\u2014",
          "Waga (%)": null,
          Opis: "Powinna wynosic 100. Militaria (armia+bitwy) = 48%."
        }
      ]
    },
    B: {
      name: "STA\u0141E MODELU",
      records: [
        {
          Parametr: "Formu\u0142a Relacji og\xF3lnej",
          Warto\u015B\u0107: "Zaufanie + Respekt",
          Opis: "Relacja = Zaufanie + Respekt; zakres 0\u2013200"
        },
        {
          Parametr: "Waga Zaufania w d\u017Awigni",
          Warto\u015B\u0107: 1,
          Opis: "Mno\u017Cnik Zaufania przy liczeniu d\u017Awigni (domy\u015Blnie 1.0)"
        },
        {
          Parametr: "Waga Respektu w d\u017Awigni",
          Warto\u015B\u0107: 1,
          Opis: "Mno\u017Cnik Respektu przy liczeniu d\u017Awigni (domy\u015Blnie 1.0)"
        },
        {
          Parametr: "Maksymalna Relacja og\xF3lna",
          Warto\u015B\u0107: 200,
          Opis: "Maks. Zaufanie (100) + maks. Respekt (100)"
        }
      ]
    },
    C: {
      name: "PROGI AKCJI DYPLOMATYCZNYCH",
      records: [
        {
          "Akcja / warunek": "Sojusz wojskowy gdy Zaufanie \u2265",
          Pr\u00F3g: 60,
          Opis: "Poni\u017Cej progu opcja Sojusz jest nieaktywna"
        },
        {
          "Akcja / warunek": "Wymiana technologii gdy Zaufanie \u2265",
          Pr\u00F3g: 70,
          Opis: "Poni\u017Cej progu Wymiana technologii zablokowana"
        },
        {
          "Akcja / warunek": "Wasalizacja gdy Respekt \u2265",
          Pr\u00F3g: 70,
          Opis: "Pr\xF3g Respektu dla \u017C\u0105dania wasalizacji"
        },
        {
          "Akcja / warunek": "Wch\u0142oni\u0119cie gdy Respekt \u2265",
          Pr\u00F3g: 90,
          Opis: "Pr\xF3g Respektu dla \u017C\u0105dania wch\u0142oni\u0119cia"
        },
        {
          "Akcja / warunek": "Dyplomacja mo\u017Cliwa gdy Relacja \u2265",
          Pr\u00F3g: 30,
          Opis: "Poni\u017Cej AI odmawia wi\u0119kszo\u015Bci akcji"
        },
        {
          "Akcja / warunek": "Sojusze osi\u0105galne gdy Relacja \u2265",
          Pr\u00F3g: 120,
          Opis: "Powy\u017Cej sojusze s\u0105 realistyczne"
        }
      ]
    },
    D: {
      name: "BAZOWE TEMPO ZAUFANIA CO TUR\u0118",
      records: [
        {
          "Stan / zdarzenie ci\u0105g\u0142e": "Aktywny handel",
          "\u0394 Zaufanie/tur\u0119": 1,
          Uwagi: "+1/tur\u0119 przez czas umowy"
        },
        {
          "Stan / zdarzenie ci\u0105g\u0142e": "Aktywny pakt NAP / sojusz",
          "\u0394 Zaufanie/tur\u0119": 1,
          Uwagi: "+1/tur\u0119 przez czas paktu"
        },
        {
          "Stan / zdarzenie ci\u0105g\u0142e": "Efekt dobrej woli (podarunek)",
          "\u0394 Zaufanie/tur\u0119": 1,
          Uwagi: "+1/tur\u0119 przez kilka tur po podarunku"
        },
        {
          "Stan / zdarzenie ci\u0105g\u0142e": "Wsp\xF3lny wr\xF3g (kooperacja)",
          "\u0394 Zaufanie/tur\u0119": 1,
          Uwagi: "+1/tur\u0119 przez czas kooperacji"
        },
        {
          "Stan / zdarzenie ci\u0105g\u0142e": "Wsp\xF3lna religia",
          "\u0394 Zaufanie/tur\u0119": 0.5,
          Uwagi: "+0.5/tur\u0119 biernie, gdy ta sama religia"
        },
        {
          "Stan / zdarzenie ci\u0105g\u0142e": "Odmienna religia",
          "\u0394 Zaufanie/tur\u0119": -0.5,
          Uwagi: "\u22120.5/tur\u0119 biernie przy innych religiach"
        },
        {
          "Stan / zdarzenie ci\u0105g\u0142e": "Ekspansja przy granicy",
          "\u0394 Zaufanie/tur\u0119": -2,
          Uwagi: "\u22122/tur\u0119 przy osadnictwie / wojskach przy granicy"
        },
        {
          "Stan / zdarzenie ci\u0105g\u0142e": "Urazy historyczne (zanikaj\u0105ce)",
          "\u0394 Zaufanie/tur\u0119": -2,
          Uwagi: "\u22122/tur\u0119; zanika co 20 tur"
        }
      ]
    },
    E: {
      name: "GLOBALNE MNO\u017BNIKI",
      records: [
        {
          "Mno\u017Cnik / parametr": "Mno\u017Cnik globalny Zaufania",
          Warto\u015B\u0107: 1,
          Opis: "Przemn\xF3\u017C, by przyspieszy\u0107 / zwolni\u0107 dynamik\u0119 Zaufania"
        },
        {
          "Mno\u017Cnik / parametr": "Mno\u017Cnik globalny Respektu",
          Warto\u015B\u0107: 1,
          Opis: "Przemn\xF3\u017C, by przyspieszy\u0107 / zwolni\u0107 dynamik\u0119 Respektu"
        },
        {
          "Mno\u017Cnik / parametr": "Mno\u017Cnik \u0142ap\xF3wek (podarunek)",
          Warto\u015B\u0107: 1,
          Opis: "Zwi\u0119ksz, by podarunki mia\u0142y wi\u0119kszy wp\u0142yw (np. 1.5 = +50%)"
        },
        {
          "Mno\u017Cnik / parametr": "Czas efektu podarunku (tury)",
          Warto\u015B\u0107: 5,
          Opis: "Ile tur po podarunku trwa efekt +1 Zaufanie/tur\u0119"
        }
      ]
    },
    F: {
      name: "KALKULATOR RELACJI I D\u0179WIGNI NEGOCJACYJNEJ",
      records: [
        {
          "DANE WEJ\u015ACIOWE (\u017C\xF3\u0142te = edytowalne)": "Zaufanie (0\u2013100)",
          "WYNIKI (zielone = formu\u0142y)": "Relacja og\xF3lna (0\u2013200)"
        },
        {
          "DANE WEJ\u015ACIOWE (\u017C\xF3\u0142te = edytowalne)": "Respekt (0\u2013100)",
          "WYNIKI (zielone = formu\u0142y)": "D\u017Awignia negocjacyjna (0\u2013100%)"
        },
        {
          "DANE WEJ\u015ACIOWE (\u017C\xF3\u0142te = edytowalne)": "LEGENDA: \u017B\xF3\u0142te = edytowalne. Zielone = wyliczane formu\u0142ami Excela. Zmie\u0144 Zaufanie / Respekt \u2192 wyniki przelicz\u0105 si\u0119 automatycznie.",
          "WYNIKI (zielone = formu\u0142y)": null
        }
      ]
    }
  }
};

// data/econ-params.json
var econ_params_default = {
  ekonomia_miasta: {
    pr\u00F3g_wzrostu_wspolczynnik: {
      easy: 6,
      normal: 8,
      hard: 10,
      jednostka: "per 1 ludno\u015Bci",
      opis: "Pr\xF3g wzrostu populacji: Pr\xF3g(N) = 10 + N \xD7 warto\u015B\u0107. Wi\u0119kszy = wolniejszy wzrost. [PT]"
    },
    spichlerz_zachowanie_po_wzroscie: {
      easy: 0.62,
      normal: 0.5,
      hard: 0.38,
      jednostka: "%",
      opis: "U\u0142amek \u017Cywno\u015Bci zachowany w Spichlerzu po awansie populacji (0.50 = 50%). [PT]"
    },
    akwedukt_prog_ludnosci: {
      easy: 8,
      normal: 6,
      hard: 4,
      jednostka: "ludno\u015B\u0107",
      opis: "Max populacja bez Akweduktu. Po jego budowie blokada zdj\u0119ta. [PT]"
    },
    zywnosc_zuzytka_populacja: {
      easy: 1,
      normal: 1,
      hard: 2,
      jednostka: "\u017Cywno\u015B\u0107/tur\u0119/os.",
      opis: "Zu\u017Cycie \u017Cywno\u015Bci na 1 punkt populacji na tur\u0119."
    },
    zywnosc_jednostka_ruch: {
      easy: 1,
      normal: 1,
      hard: 2,
      jednostka: "\u017Cywno\u015B\u0107/tur\u0119",
      opis: "Zu\u017Cycie \u017Cywno\u015Bci jednostki wojskowej w ruchu lub w garnizonie."
    },
    zywnosc_jednostka_oboz: {
      easy: 0.38,
      normal: 0.5,
      hard: 0.62,
      jednostka: "\u017Cywno\u015B\u0107/tur\u0119",
      opis: "Zu\u017Cycie \u017Cywno\u015Bci jednostki wojskowej obozuj\u0105cej (bez ruchu)."
    },
    suwak_handel_nauka_domyslnie: {
      easy: 20,
      normal: 20,
      hard: 20,
      jednostka: "%",
      opis: "Domy\u015Blny udzia\u0142 strumienia Nauka (= BADANIA) w podziale Handlu netto. Default 20% (Maciej 2026-06-25)."
    },
    suwak_handel_pieniadz_domyslnie: {
      easy: 70,
      normal: 70,
      hard: 70,
      jednostka: "%",
      opis: "Domy\u015Blny udzia\u0142 strumienia Pieni\u0105dz (= SKARBIEC/podatek) w podziale Handlu netto. Default 70% (Maciej 2026-06-25)."
    },
    suwak_handel_luksus_domyslnie: {
      easy: 10,
      normal: 10,
      hard: 10,
      jednostka: "%",
      opis: "Domy\u015Blny udzia\u0142 strumienia Luksus (= WEALTH/rozw\xF3j) w podziale Handlu netto. Default 10% (Maciej 2026-06-25)."
    },
    suwak_praca_budynki_domyslnie: {
      easy: 70,
      normal: 70,
      hard: 70,
      jednostka: "%",
      opis: "Domy\u015Blny udzia\u0142 strumienia Praca\u2192Budynki w podziale Pracy netto. [PT]"
    },
    suwak_praca_teren_domyslnie: {
      easy: 30,
      normal: 30,
      hard: 30,
      jednostka: "%",
      opis: "Domy\u015Blny udzia\u0142 strumienia Praca\u2192Teren (ulepszenia heks\xF3w). [PT]"
    },
    suwak_zywnosc_rozwoj_domyslnie: {
      easy: 70,
      normal: 70,
      hard: 60,
      jednostka: "%",
      opis: "Domy\u015Blny udzia\u0142 brutto \u017Cywno\u015Bci imperium \u2192 rozw\xF3j miast (magazyn/wzrost). Reszta \u2192 zapasy pa\u0144stwa. Decyzja Maciej Q1 HUD 2026-06-26."
    },
    glod_wojska_hp_frac: {
      easy: 0.06,
      normal: 0.08,
      hard: 0.1,
      jednostka: "u\u0142amek maxHP",
      opis: "Atrycja HP jednostek na mapie gdy zapasy pa\u0144stwa < 0 po koszcie armii (\u22128% maxHP/tura normal)."
    },
    korupcja_wspolczynnik_dystansu: {
      easy: 1,
      normal: 2,
      hard: 3,
      jednostka: "per pole",
      opis: "Strata% += Dystans_od_Stolicy \xD7 warto\u015B\u0107. Im wi\u0119kszy, tym dotkliwsza korupcja. [PT]"
    },
    korupcja_wspolczynnik_miast: {
      easy: 1,
      normal: 1,
      hard: 2,
      jednostka: "per miasto",
      opis: "Strata% += Liczba_Miast \xD7 warto\u015B\u0107. Ka\u017Cde nowe miasto podnosi korupcj\u0119 globalnie. [PT]"
    },
    korupcja_cap: {
      easy: 38,
      normal: 50,
      hard: 62,
      jednostka: "%",
      opis: "Maksymalna strata z tytu\u0142u korupcji/marnotrawstwa (cap = 50%). [PT]"
    }
  },
  budynki: {
    budynek_mlyn_mnoznik_pracy: {
      easy: 3,
      normal: 2,
      hard: 1,
      jednostka: "\xD7",
      opis: "Mno\u017Cnik M\u0142yna na ca\u0142\u0105 Prac\u0119 bazow\u0105 miasta (Praca_brutto = \u03A3 \xD7 warto\u015B\u0107). [PT]"
    },
    budynek_mlyn_bonus_pracy: {
      easy: 3,
      normal: 2,
      hard: 1,
      jednostka: "Praca/tur\u0119",
      opis: "Sta\u0142y bonus Pracy dodawany przez M\u0142yn po mno\u017Cniku. [PT]"
    },
    budynek_cegielnia_bonus_pracy: {
      easy: 0.31,
      normal: 0.25,
      hard: 0.19,
      jednostka: "%",
      opis: "Premia Cegielni do lokalnej Pracy (+25% Pracy brutto). [PT]"
    },
    budynek_targowisko_bonus_handlu: {
      easy: 0.62,
      normal: 0.5,
      hard: 0.38,
      jednostka: "%",
      opis: "Premia Targowiska do Handlu brutto (+50%). [PT]"
    },
    budynek_mennica_mnoznik: {
      easy: 2,
      normal: 1,
      hard: 0,
      jednostka: "\xD7",
      opis: "Mno\u017Cnik Mennicy (Handel\u2192Pieni\u0105dz). Docelowo \xD71,5\u2013\xD72,0 po upgrade. [PT]"
    },
    budynek_biblioteka_bonus_nauki: {
      easy: 0.62,
      normal: 0.5,
      hard: 0.38,
      jednostka: "%",
      opis: "Premia Biblioteki do Nauki lokalnie (+50%). [PT \u2014 do strojenia]"
    },
    waluta_mnoznik: {
      easy: 2,
      normal: 2,
      hard: 2,
      jednostka: "\xD7",
      opis: "Efekt 1 (Waluta tech): mnoznik na caly handelNetto miasta gdy walutaOdkryta=true (\xD72 na cala pule Handlu przed podzialem). Dotyczy wszystkich miast automatycznie po wynalezieniu Waluty."
    },
    targowisko_praca_na_pieniadz_mnoznik: {
      easy: 2,
      normal: 2,
      hard: 2,
      jednostka: "\xD7",
      opis: "Efekt 2 (Targowisko + Waluta): mnoznik konwersji puli-Pracy (doPuli) na Pieniadz. Aktywny per-miasto gdy maTargowisko=true i walutaOdkryta=true. pieniadzZPracy = floor(doPuli \xD7 mnoznik)."
    },
    budynek_tartak_przepustowosc: {
      easy: 3,
      normal: 2,
      hard: 1,
      jednostka: "szt/tur\u0119",
      opis: "Maks konwersja Drewno\u2192Deski w Tartaku na tur\u0119. [PT]"
    },
    budynek_mielerz_przepustowosc: {
      easy: 3,
      normal: 2,
      hard: 1,
      jednostka: "szt/tur\u0119",
      opis: "Maks konwersja Drewno\u2192Paliwo w Mielerzni na tur\u0119. [PT]"
    },
    budynek_cegielnia_przepustowosc: {
      easy: 3,
      normal: 2,
      hard: 1,
      jednostka: "szt/tur\u0119",
      opis: "Maks konwersja (Glina+Paliwo)\u2192Ceg\u0142a w Cegielni na tur\u0119. [PT]"
    },
    budynek_huta_przepustowosc: {
      easy: 2,
      normal: 1,
      hard: 0,
      jednostka: "szt/tur\u0119",
      opis: "Maks konwersja (Ruda+Paliwo)\u2192Br\u0105z w Hucie na tur\u0119. [PT]"
    },
    budynek_garncarnia_przepustowosc: {
      easy: 2,
      normal: 1,
      hard: 0,
      jednostka: "szt/tur\u0119",
      opis: "Maks konwersja (Glina+Paliwo)\u2192Ceramika w Garncarni na tur\u0119. [PT]"
    },
    utrzymanie_budynek: {
      easy: 1,
      normal: 1,
      hard: 2,
      jednostka: "Pieni\u0105dz/tur\u0119",
      opis: "Koszt utrzymania ka\u017Cdego budynku (niezr\xF3\u017Cnicowany w v0.1). [PT]"
    }
  },
  teren_mapa: {
    teren_rzeka_zywnosc: {
      easy: 4,
      normal: 3,
      hard: 2,
      jednostka: "\u017Cywno\u015B\u0107/tur\u0119",
      opis: "Bonus \u017Cywno\u015Bci z nak\u0142adki Rzeka na pole bazowe. (Bazowe plony \u2192 Plony-terenow.xlsx)"
    },
    teren_rzeka_praca: {
      easy: 3,
      normal: 2,
      hard: 1,
      jednostka: "Praca/tur\u0119",
      opis: "Bonus Pracy z nak\u0142adki Rzeka na pole bazowe."
    },
    teren_rzeka_handel: {
      easy: 3,
      normal: 2,
      hard: 1,
      jednostka: "Handel/tur\u0119",
      opis: "Bonus Handlu z nak\u0142adki Rzeka na pole bazowe."
    },
    teren_las_zywnosc: {
      easy: -0.75,
      normal: -1,
      hard: -1.25,
      jednostka: "\u017Cywno\u015B\u0107/tur\u0119",
      opis: "Modyfikator \u017Cywno\u015Bci z nak\u0142adki Las (kara \u2014 las utrudnia uprawy)."
    },
    teren_las_handel: {
      easy: -0.75,
      normal: -1,
      hard: -1.25,
      jednostka: "Handel/tur\u0119",
      opis: "Modyfikator Handlu z nak\u0142adki Las (kara \u2014 las utrudnia ruch handlowy)."
    },
    teren_las_drewno: {
      easy: 4,
      normal: 3,
      hard: 2,
      jednostka: "Drewno/tur\u0119",
      opis: "Bonus Drewna z nak\u0142adki Las."
    },
    ulepszenie_farma_zywnosc: {
      easy: 3,
      normal: 2,
      hard: 1,
      jednostka: "\u017Cywno\u015B\u0107/tur\u0119",
      opis: "Bonus \u017Cywno\u015Bci z wybudowanej Farmy na polu (\u0141\u0105ka, R\xF3wnina). [PT \u2014 do strojenia]"
    },
    ulepszenie_irygacja_zywnosc: {
      easy: 4,
      normal: 3,
      hard: 2,
      jednostka: "\u017Cywno\u015B\u0107/tur\u0119",
      opis: "Bonus \u017Cywno\u015Bci z Irygacji (lepsze pola uprawne, wymaga tech). [PT \u2014 do strojenia]"
    },
    ulepszenie_kopalnia_kamien: {
      easy: 3,
      normal: 2,
      hard: 1,
      jednostka: "Kamie\u0144/tur\u0119",
      opis: "Bonus Kamienia z Kopalni na Wzg\xF3rzach/G\xF3rach (wymaga tech Murarstwo). [PT \u2014 do strojenia]"
    },
    ulepszenie_droga_ruch: {
      easy: 2,
      normal: 1,
      hard: 0,
      jednostka: "hex/tur\u0119 bonus",
      opis: "Bonus szybko\u015Bci ruchu jednostek na polach z Drog\u0105 (skr\xF3cenie kosztu ruchu). [PT \u2014 do strojenia]"
    },
    ulepszenie_pastwisko_bydlo_produkcja: {
      easy: 3,
      normal: 2,
      hard: 1,
      jednostka: "\xD7",
      opis: "Mno\u017Cnik Pracy/produkcji gdy byd\u0142o przypisane do Pastwiska (\xD7200%). [PT \u2014 do strojenia]"
    },
    ulepszenie_pastwisko_owce_zywnosc: {
      easy: 3,
      normal: 2,
      hard: 1,
      jednostka: "\u017Cywno\u015B\u0107/tur\u0119",
      opis: "Bonus \u017Cywno\u015Bci gdy owce przypisane do Pastwiska. [PT \u2014 do strojenia]"
    }
  },
  wealth: {
    wealth_cap_na_epoke: {
      easy: 10,
      normal: 10,
      hard: 10,
      jednostka: "poziom/epoka",
      opis: "Cap poziomu Wealth = epoka * wartosc. Epoka 1 -> 10, epoka 10 -> 100."
    },
    wealth_prog_na_poziom: {
      easy: 3.5,
      normal: 4.5,
      hard: 6,
      jednostka: "srodki",
      opis: "Prog awansu L->L+1 = wartosc * (L+1) * epoka. Wyzszy = wolniejszy wzrost Wealth."
    },
    wealth_mnoznik_na_poziom: {
      easy: 0.18,
      normal: 0.15,
      hard: 0.12,
      jednostka: "x per poziom",
      opis: "Mnoznik strumienia podatku = max(1, 1+(W-1)*wartosc). W=1 -> x1, W=10 -> x2.35 (normal)."
    },
    wealth_utrzymanie_baza: {
      easy: 0.15,
      normal: 0.2,
      hard: 0.25,
      jednostka: "udzial pieniadza",
      opis: "Udzial pieniadza miasta potrzebny na utrzymanie przy W=0 (rownowaga bazowa)."
    },
    wealth_utrzymanie_przy_cap: {
      easy: 0.35,
      normal: 0.4,
      hard: 0.5,
      jednostka: "udzial pieniadza",
      opis: "Udzial pieniadza miasta potrzebny na utrzymanie przy W=cap. Liniowa interpolacja miedzy baza a cap."
    },
    wealth_zachowanie_po_awansie: {
      easy: 0.6,
      normal: 0.5,
      hard: 0.4,
      jednostka: "ulamek",
      opis: "Ulamek puli zachowany po awansie poziomu Wealth (jak Spichlerz po wzroscie populacji)."
    },
    wealth_zadowolenie_na_10pkt: {
      easy: 1,
      normal: 1,
      hard: 1,
      jednostka: "zadowoleni/10 poz.",
      opis: "Ile zadowolonych mieszkancow daje kazde 10 poziomow Wealth (W10->+1, W20->+2, ...)."
    },
    wealth_kara_zero: {
      easy: -1,
      normal: -2,
      hard: -3,
      jednostka: "zadowoleni",
      opis: "Kara zadowolenia gdy Wealth = 0 (bieda spoleczna). Wartosc ujemna."
    }
  },
  globalne: {
    kurs_pieniadz_praca: {
      easy: 1,
      normal: 1,
      hard: 1,
      jednostka: "1:1",
      opis: "Kurs bazowy: 1 Pieni\u0105dz = 1 Praca (u\u017Cywany do wykupu budynk\xF3w za Pieni\u0105dz)."
    },
    mennica_mnoznik_po_walucie: {
      easy: 1.88,
      normal: 1.5,
      hard: 1.12,
      jednostka: "\xD7",
      opis: "Mno\u017Cnik Mennicy aktywny po odkryciu technologii Waluta. [PT \u2014 docelowo \xD71,5\u2013\xD72,0]"
    },
    luksus_przelicznik_zadowolenie: {
      easy: 4,
      normal: 5,
      hard: 6,
      jednostka: "Luksus / +1 mieszk.",
      opis: "Ile jednostek Luksusu daje +1 zadowolony mieszkaniec. [PT]"
    },
    magazyn_baza_zywnosc: {
      easy: 25,
      normal: 20,
      hard: 15,
      jednostka: "\u017Cywno\u015B\u0107",
      opis: "Bazowa pojemno\u015B\u0107 Magazynu \u017Bywno\u015Bci (bez Spichlerza). [PT]"
    },
    magazyn_baza_surowce: {
      easy: 12,
      normal: 10,
      hard: 8,
      jednostka: "szt/typ surowca",
      opis: "Bazowa pojemno\u015B\u0107 per typ surowca (bez Magazynu Surowc\xF3w). [PT]"
    },
    magazyn_mnoznik_spichlerz: {
      easy: 6,
      normal: 5,
      hard: 4,
      jednostka: "\xD7",
      opis: "Mno\u017Cnik pojemno\u015Bci przy wybudowanym Spichlerzu / Magazynie Surowc\xF3w. [PT]"
    },
    utrzymanie_jednostka_standard: {
      easy: 1,
      normal: 1,
      hard: 2,
      jednostka: "Pieni\u0105dz/tur\u0119",
      opis: "Koszt utrzymania standardowej jednostki wojskowej. [PT]"
    },
    skarbiec_centralny_lokalizacja: {
      easy: "stolica",
      normal: "stolica",
      hard: "stolica",
      jednostka: "miasto",
      opis: "Skarbiec zawsze w stolicy; utrata stolicy zeruje go do 0."
    }
  }
};

// data/ai-params.json
var ai_params_default = {
  trudnosc_poziom1_bonus_produkcja: {
    wartosc: 0,
    sekcja: "\xA77 Trudno\u015B\u0107 Lv1",
    opis: "Bonus do produkcji Pracy AI na poziomie Prostym (0 = brak; te same zasady co gracz)."
  },
  trudnosc_poziom1_bonus_nauka: {
    wartosc: 0,
    sekcja: "\xA77 Trudno\u015B\u0107 Lv1",
    opis: "Bonus punkt\xF3w Nauki/tur\u0119 AI na poziomie Prostym."
  },
  trudnosc_poziom1_startowe_jednostki: {
    wartosc: 0,
    sekcja: "\xA77 Trudno\u015B\u0107 Lv1",
    opis: "Dodatkowe jednostki startowe AI na poziomie Prostym."
  },
  trudnosc_poziom1_startowe_miasta: {
    wartosc: 0,
    sekcja: "\xA77 Trudno\u015B\u0107 Lv1",
    opis: "Dodatkowe miasta startowe AI na poziomie Prostym."
  },
  trudnosc_poziom1_bonus_walka: {
    wartosc: 0,
    sekcja: "\xA77 Trudno\u015B\u0107 Lv1",
    opis: "Bonus % do statystyk walki jednostek AI na poziomie Prostym."
  },
  trudnosc_poziom2_bonus_produkcja: {
    wartosc: 0.1,
    sekcja: "\xA77 Trudno\u015B\u0107 Lv2",
    opis: "Bonus do produkcji Pracy AI na poziomie Normalnym (+10%)."
  },
  trudnosc_poziom2_bonus_nauka: {
    wartosc: 1,
    sekcja: "\xA77 Trudno\u015B\u0107 Lv2",
    opis: "Bonus punkt\xF3w Nauki/tur\u0119 AI na poziomie Normalnym (+1/tur\u0119)."
  },
  trudnosc_poziom2_startowe_jednostki: {
    wartosc: 1,
    sekcja: "\xA77 Trudno\u015B\u0107 Lv2",
    opis: "Dodatkowe jednostki startowe AI na poziomie Normalnym."
  },
  trudnosc_poziom2_startowe_miasta: {
    wartosc: 0,
    sekcja: "\xA77 Trudno\u015B\u0107 Lv2",
    opis: "Dodatkowe miasta startowe AI na poziomie Normalnym."
  },
  trudnosc_poziom2_bonus_walka: {
    wartosc: 0,
    sekcja: "\xA77 Trudno\u015B\u0107 Lv2",
    opis: "Bonus % do statystyk walki jednostek AI na poziomie Normalnym."
  },
  trudnosc_poziom3_bonus_produkcja: {
    wartosc: 0.25,
    sekcja: "\xA77 Trudno\u015B\u0107 Lv3",
    opis: "Bonus do produkcji Pracy AI na poziomie Trudnym (+25%)."
  },
  trudnosc_poziom3_bonus_nauka: {
    wartosc: 0,
    sekcja: "\xA77 Trudno\u015B\u0107 Lv3",
    opis: "Bonus punkt\xF3w Nauki/tur\u0119 AI na poziomie Trudnym (0 = bez bonusu nauka)."
  },
  trudnosc_poziom3_startowe_jednostki: {
    wartosc: 0,
    sekcja: "\xA77 Trudno\u015B\u0107 Lv3",
    opis: "Dodatkowe jednostki startowe AI na poziomie Trudnym."
  },
  trudnosc_poziom3_startowe_miasta: {
    wartosc: 1,
    sekcja: "\xA77 Trudno\u015B\u0107 Lv3",
    opis: "Dodatkowe miasto startowe AI na poziomie Trudnym (+1 miasto)."
  },
  trudnosc_poziom3_bonus_walka: {
    wartosc: 0.05,
    sekcja: "\xA77 Trudno\u015B\u0107 Lv3",
    opis: "Bonus do statystyk walki jednostek AI na poziomie Trudnym (+5%)."
  },
  archetype_grecy_wojsko_priorytet: {
    wartosc: 0,
    sekcja: "\xA78 Archetypy",
    opis: "Grecy: delta priorytetu wojsko (0 = bez zmiany; +1 = wy\u017Cej; \u22121 = ni\u017Cej)."
  },
  archetype_grecy_nauka_priorytet: {
    wartosc: 1,
    sekcja: "\xA78 Archetypy",
    opis: "Grecy: delta priorytetu nauka/biblioteka (+1 = Biblioteka i Koszary r\xF3wnorz\u0119dne)."
  },
  archetype_grecy_ekonomia_priorytet: {
    wartosc: 0,
    sekcja: "\xA78 Archetypy",
    opis: "Grecy: delta priorytetu ekonomia."
  },
  archetype_grecy_obrona_priorytet: {
    wartosc: 0,
    sekcja: "\xA78 Archetypy",
    opis: "Grecy: delta priorytetu obrona."
  },
  archetype_rzym_wojsko_priorytet: {
    wartosc: 1,
    sekcja: "\xA78 Archetypy",
    opis: "Rzym: +1 priorytet Koszary i jednostki wojskowe."
  },
  archetype_rzym_nauka_priorytet: {
    wartosc: 0,
    sekcja: "\xA78 Archetypy",
    opis: "Rzym: delta priorytetu nauka."
  },
  archetype_rzym_ekonomia_priorytet: {
    wartosc: 0,
    sekcja: "\xA78 Archetypy",
    opis: "Rzym: delta priorytetu ekonomia."
  },
  archetype_rzym_obrona_priorytet: {
    wartosc: 0,
    sekcja: "\xA78 Archetypy",
    opis: "Rzym: delta priorytetu obrona."
  },
  archetype_chiny_wojsko_priorytet: {
    wartosc: -1,
    sekcja: "\xA78 Archetypy",
    opis: "Chiny: \u22121 priorytet wojsko (niech\u0119tnie buduj\u0105 armi\u0119 na starcie)."
  },
  archetype_chiny_nauka_priorytet: {
    wartosc: 1,
    sekcja: "\xA78 Archetypy",
    opis: "Chiny: +1 priorytet nauka."
  },
  archetype_chiny_ekonomia_priorytet: {
    wartosc: 1,
    sekcja: "\xA78 Archetypy",
    opis: "Chiny: +1 priorytet ekonomia (budynki ekonomiczne wy\u017Cej)."
  },
  archetype_chiny_obrona_priorytet: {
    wartosc: 0,
    sekcja: "\xA78 Archetypy",
    opis: "Chiny: delta priorytetu obrona."
  },
  archetype_zulusi_wojsko_priorytet: {
    wartosc: 2,
    sekcja: "\xA78 Archetypy",
    opis: "Zulusi: +2 priorytet wojsko \u2014 jednostki zawsze #1."
  },
  archetype_zulusi_nauka_priorytet: {
    wartosc: -1,
    sekcja: "\xA78 Archetypy",
    opis: "Zulusi: \u22121 priorytet nauka."
  },
  archetype_zulusi_ekonomia_priorytet: {
    wartosc: -1,
    sekcja: "\xA78 Archetypy",
    opis: "Zulusi: \u22121 priorytet ekonomia."
  },
  archetype_zulusi_obrona_priorytet: {
    wartosc: 0,
    sekcja: "\xA78 Archetypy",
    opis: "Zulusi: delta priorytetu obrona."
  },
  archetype_inkowie_wojsko_priorytet: {
    wartosc: 0,
    sekcja: "\xA78 Archetypy",
    opis: "Inkowie: delta priorytetu wojsko."
  },
  archetype_inkowie_nauka_priorytet: {
    wartosc: 0,
    sekcja: "\xA78 Archetypy",
    opis: "Inkowie: delta priorytetu nauka."
  },
  archetype_inkowie_ekonomia_priorytet: {
    wartosc: 0,
    sekcja: "\xA78 Archetypy",
    opis: "Inkowie: delta priorytetu ekonomia."
  },
  archetype_inkowie_obrona_priorytet: {
    wartosc: 1,
    sekcja: "\xA78 Archetypy",
    opis: "Inkowie: +1 priorytet obrona (Mury przy zagro\u017Ceniu)."
  },
  archetype_egipt_wojsko_priorytet: {
    wartosc: 0,
    sekcja: "\xA78 Archetypy",
    opis: "Egipt: delta priorytetu wojsko."
  },
  archetype_egipt_nauka_priorytet: {
    wartosc: 0,
    sekcja: "\xA78 Archetypy",
    opis: "Egipt: delta priorytetu nauka."
  },
  archetype_egipt_ekonomia_priorytet: {
    wartosc: 1,
    sekcja: "\xA78 Archetypy",
    opis: "Egipt: +1 priorytet ekonomia i budynki kultury."
  },
  archetype_egipt_obrona_priorytet: {
    wartosc: 0,
    sekcja: "\xA78 Archetypy",
    opis: "Egipt: delta priorytetu obrona."
  },
  archetype_sumer_wojsko_priorytet: {
    wartosc: -1,
    sekcja: "\xA78 Archetypy",
    opis: "Sumerowie: \u22121 priorytet wojsko (dopiero po Koszarach)."
  },
  archetype_sumer_nauka_priorytet: {
    wartosc: 2,
    sekcja: "\xA78 Archetypy",
    opis: "Sumerowie: +2 priorytet nauka \u2014 Nauka zawsze #1."
  },
  archetype_sumer_ekonomia_priorytet: {
    wartosc: 0,
    sekcja: "\xA78 Archetypy",
    opis: "Sumerowie: delta priorytetu ekonomia."
  },
  archetype_sumer_obrona_priorytet: {
    wartosc: 0,
    sekcja: "\xA78 Archetypy",
    opis: "Sumerowie: delta priorytetu obrona."
  },
  dyplomacja_strach_prog_nap: {
    wartosc: 60,
    sekcja: "\xA76 Dyplomacja",
    opis: "Pr\xF3g Respekt/Strach gracza wobec AI, po kt\xF3rym AI proponuje NAP lub trybut."
  },
  dyplomacja_strach_prog_trybut: {
    wartosc: 60,
    sekcja: "\xA76 Dyplomacja",
    opis: "Pr\xF3g Respekt/Strach AI wobec gracza, po kt\xF3rym AI mo\u017Ce \u017C\u0105da\u0107 trybutu."
  },
  dyplomacja_relacja_handel: {
    wartosc: 30,
    sekcja: "\xA76 Dyplomacja",
    opis: "Minimalna Relacja og\xF3lna (>30) wymagana do propozycji prostego handlu."
  },
  dyplomacja_relacja_startowa_rywale: {
    wartosc: -20,
    sekcja: "\xA76 Dyplomacja",
    opis: "Startowa Relacja rywali tego samego archetypu (zawsze wroga, np. \u221220)."
  },
  dyplomacja_relacja_prog_wojna: {
    wartosc: -40,
    sekcja: "\xA76 Dyplomacja",
    opis: "Relacja \u2264 warto\u015B\u0107 \u2192 poboczna AI mo\u017Ce wypowiedzie\u0107 wojn\u0119."
  },
  dyplomacja_max_propozycji_ture: {
    wartosc: 1,
    sekcja: "\xA76 Dyplomacja",
    opis: "Max liczba propozycji dyplomatycznych wysy\u0142anych przez AI do jednego gracza/tury."
  },
  dyplomacja_zdrowie_armii_pok\u00F3j: {
    wartosc: 0.4,
    sekcja: "\xA76 Dyplomacja",
    opis: "Pr\xF3g HP armii AI (% startowego) poni\u017Cej kt\xF3rego AI wysy\u0142a propozycj\u0119 pokoju."
  },
  ai_wycofanie_hp_prog: {
    wartosc: 0.3,
    sekcja: "\xA72 Ruch",
    opis: "Pr\xF3g Health (% startowego) poni\u017Cej kt\xF3rego jednostka AI wycofuje si\u0119 do obozu/miasta."
  },
  ekspansja_min_dystans_miast: {
    wartosc: 5,
    sekcja: "\xA73 Ekspansja",
    opis: "Minimalna odleg\u0142o\u015B\u0107 (pola heksagonalne) mi\u0119dzy miastami AI przy zak\u0142adaniu nowego."
  },
  ekspansja_zagroz_zasieg: {
    wartosc: 5,
    sekcja: "\xA73/\xA74 Ekspansja",
    opis: "Zasi\u0119g (pola) od miasta AI, przy kt\xF3rym ustawiana jest flaga ZAGRO\u017BENIE."
  },
  ekspansja_heurystyka_zywnosc_pkt: {
    wartosc: 3,
    sekcja: "\xA73 Ekspansja",
    opis: "Punkty za pole z \u017Bywno\u015Bci\u0105 \u2265 3 przy heurystyce wyboru lokalizacji miasta."
  },
  ekspansja_heurystyka_praca_pkt: {
    wartosc: 2,
    sekcja: "\xA73 Ekspansja",
    opis: "Punkty za pole z Prac\u0105 \u2265 2."
  },
  ekspansja_heurystyka_handel_pkt: {
    wartosc: 1,
    sekcja: "\xA73 Ekspansja",
    opis: "Punkty za pole z Handlem \u2265 1."
  },
  ekspansja_heurystyka_rzeka_pkt: {
    wartosc: 2,
    sekcja: "\xA73 Ekspansja",
    opis: "Punkty za s\u0105siedztwo rzeki."
  },
  ekspansja_heurystyka_surowiec_pkt: {
    wartosc: 2,
    sekcja: "\xA73 Ekspansja",
    opis: "Punkty za dost\u0119p do surowca (ruda, glina, kamie\u0144)."
  },
  ekspansja_heurystyka_granica_kara: {
    wartosc: -3,
    sekcja: "\xA73 Ekspansja",
    opis: "Kara punktowa za blisko\u015B\u0107 granicy wroga < 5 p\xF3l."
  },
  barbarzyncy_start_tura: {
    wartosc: 5,
    sekcja: "\xA75 Barbarzyncy",
    opis: "Pierwsza tura, od ktorej barbarzyncy sa aktywni (spawny/ruch)."
  },
  barbarzyncy_max_obozy: {
    wartosc: 6,
    sekcja: "\xA75 Barbarzyncy",
    opis: "Maksymalna liczba obozow barbarzynskich na mapie naraz."
  },
  barbarzyncy_min_dystans_miasto: {
    wartosc: 5,
    sekcja: "\xA75 Barbarzyncy",
    opis: "Min. odleglosc (heks) nowego obozu od dowolnego miasta."
  },
  barbarzyncy_odstep_obozow: {
    wartosc: 6,
    sekcja: "\xA75 Barbarzyncy",
    opis: "Min. odleglosc (heks) miedzy obozami."
  },
  barbarzyncy_interwal_spawnu: {
    wartosc: 6,
    sekcja: "\xA75 Barbarzyncy",
    opis: "Co ile tur oboz tworzy jednostke (reset po spawnie)."
  },
  barbarzyncy_jednostek_na_oboz: {
    wartosc: 2,
    sekcja: "\xA75 Barbarzyncy",
    opis: "Limit zywych barbarzyncow liczony w promieniu kontroli obozu."
  },
  barbarzyncy_zasieg_kontroli: {
    wartosc: 3,
    sekcja: "\xA75 Barbarzyncy",
    opis: "Promien (heks) liczenia jednostek nalezacych do obozu (limit)."
  },
  barbarzyncy_zasieg_agresji: {
    wartosc: 6,
    sekcja: "\xA75 Barbarzyncy",
    opis: "Goni cele w tym promieniu (heks); dalej bezczynny przy obozie."
  },
  barbarzyncy_prog_odwrotu_hp: {
    wartosc: 0.3,
    sekcja: "\xA75 Barbarzyncy",
    opis: "Ulamek HP (0..1) ponizej ktorego jednostka wraca do obozu."
  },
  archetype_celtowie_wojsko_priorytet: {
    wartosc: 2,
    sekcja: "\xA78 Archetypy",
    opis: "Celtowie: +2 priorytet wojsko \u2014 szar\u017Ce i najazdy (podobnie jak Zulusi)."
  },
  archetype_celtowie_nauka_priorytet: {
    wartosc: -1,
    sekcja: "\xA78 Archetypy",
    opis: "Celtowie: \u22121 priorytet nauka (druydzi to wyj\u0105tek, nie regu\u0142a)."
  },
  archetype_celtowie_ekonomia_priorytet: {
    wartosc: 0,
    sekcja: "\xA78 Archetypy",
    opis: "Celtowie: delta priorytetu ekonomia (oppida = handel lokalny, neutralny)."
  },
  archetype_celtowie_obrona_priorytet: {
    wartosc: 1,
    sekcja: "\xA78 Archetypy",
    opis: "Celtowie: +1 priorytet obrona (oppida = warowne osady)."
  },
  archetype_germanie_wojsko_priorytet: {
    wartosc: 2,
    sekcja: "\xA78 Archetypy",
    opis: "Germanie: +2 priorytet wojsko \u2014 furia bojowa, zawsze armia #1."
  },
  archetype_germanie_nauka_priorytet: {
    wartosc: -1,
    sekcja: "\xA78 Archetypy",
    opis: "Germanie: \u22121 priorytet nauka (plemiona, nie cywilizacja uczona)."
  },
  archetype_germanie_ekonomia_priorytet: {
    wartosc: -1,
    sekcja: "\xA78 Archetypy",
    opis: "Germanie: \u22121 priorytet ekonomia (gospodarka plemienna, barter)."
  },
  archetype_germanie_obrona_priorytet: {
    wartosc: 0,
    sekcja: "\xA78 Archetypy",
    opis: "Germanie: delta priorytetu obrona (lasy = naturalna obrona, nie mury)."
  }
};

// data/society-params.json
var society_params_default = {
  zdrowie: {
    zdrowie_rzeka: {
      easy: 3,
      normal: 2,
      hard: 1,
      jednostka: "pkt Zdrowia",
      opis: "Bonus Zdrowia gdy miasto s\u0105siaduje z Rzek\u0105 (\u015Bwie\u017Ca woda w pobli\u017Cu). [PT]"
    },
    zdrowie_akwedukt: {
      easy: 5,
      normal: 4,
      hard: 3,
      jednostka: "pkt Zdrowia",
      opis: "Bonus Zdrowia z wybudowanego Akweduktu (infrastruktura wodna). Odblokowanie wzrostu >6 ludno\u015Bci. [PT]"
    },
    zdrowie_studnia: {
      easy: 3,
      normal: 2,
      hard: 1,
      jednostka: "pkt Zdrowia",
      opis: "Bonus Zdrowia ze Studni (dost\u0119p do wody gruntowej, wczesna epoka). [PT \u2014 do strojenia]"
    },
    zdrowie_targowisko: {
      easy: 3,
      normal: 2,
      hard: 1,
      jednostka: "pkt Zdrowia",
      opis: "Bonus Zdrowia z wybudowanego Targowiska (handel \u015Bwie\u017C\u0105 \u017Cywno\u015Bci\u0105 i artyku\u0142ami). [PT]"
    },
    zdrowie_ceramika: {
      easy: 2,
      normal: 1,
      hard: 0,
      jednostka: "pkt Zdrowia",
      opis: "Bonus Zdrowia z Ceramiki/Garncarni (higiena \u2014 naczynia do przechowywania \u017Cywno\u015Bci). [PT]"
    },
    zdrowie_male_miasto_bonus: {
      easy: 2,
      normal: 1,
      hard: 0,
      jednostka: "pkt Zdrowia",
      opis: "Bonus Zdrowia za ma\u0142e miasto (populacja \u2264 pr\xF3g zag\u0119szczenia). Ma\u0142e miasto = \u0142atwiejsze zarz\u0105dzanie sanitarne. [PT]"
    },
    zdrowie_kara_zag\u0119szczenie: {
      easy: -0.75,
      normal: -1,
      hard: -1.25,
      jednostka: "pkt/1 ludno\u015Bci",
      opis: "Kara Zdrowia za zag\u0119szczenie \u2014 odejmuje 1 pkt Zdrowia za ka\u017Cdy punkt populacji powy\u017Cej progu zag\u0119szczenia. [PT]"
    },
    zdrowie_prog_zag\u0119szczenia: {
      easy: 5,
      normal: 4,
      hard: 3,
      jednostka: "ludno\u015B\u0107",
      opis: "Pr\xF3g zag\u0119szczenia \u2014 poni\u017Cej tej liczby mieszka\u0144c\xF3w kara zag\u0119szczenia NIE jest naliczana. [PT \u2014 do strojenia]"
    },
    zdrowie_kara_bagno: {
      easy: -0.75,
      normal: -1,
      hard: -1.25,
      jednostka: "pkt Zdrowia",
      opis: "Kara Zdrowia gdy bagno lub d\u017Cungla w promieniu miasta (choroby, komary). [PT]"
    },
    zdrowie_kara_dzungla: {
      easy: -0.75,
      normal: -1,
      hard: -1.25,
      jednostka: "pkt Zdrowia",
      opis: "Kara Zdrowia za d\u017Cungl\u0119 w pobli\u017Cu (wilgo\u0107, choroby tropikalne). [PT \u2014 do strojenia]"
    },
    zdrowie_kara_zanieczyszczenie: {
      easy: -0.75,
      normal: -1,
      hard: -1.25,
      jednostka: "pkt Zdrowia",
      opis: "Kara Zdrowia za zanieczyszczenie dymu/przemys\u0142owe (aktywna gdy dzia\u0142aj\u0105 budynki przemys\u0142owe \u2014 Huta, Mielerz itp.). P\xF3\u017Ane epoki. [PT]"
    },
    zdrowie_kara_brak_wody: {
      easy: -1,
      normal: -2,
      hard: -3,
      jednostka: "pkt Zdrowia",
      opis: "Kara Zdrowia gdy miasto nie ma dost\u0119pu do \u015Bwie\u017Cej wody (brak Rzeki, Studni ani Akweduktu). [PT \u2014 do strojenia]"
    },
    zdrowie_modyfikator_wzrostu: {
      easy: 0.06,
      normal: 0.05,
      hard: 0.04,
      jednostka: "per pkt Zdrowia",
      opis: "Modyfikator_Zdrowia = max(0, 1 + Zdrowie \xD7 warto\u015B\u0107). Np. Zdrowie +4 \u2192 \xD71,20; Zdrowie \u22123 \u2192 stagnacja. [PT]"
    },
    zdrowie_prog_stagnacja: {
      easy: 0,
      normal: 0,
      hard: 0,
      jednostka: "pkt Zdrowia",
      opis: "Gdy Zdrowie \u2264 tego progu \u2192 wzrost populacji zatrzymany (stagnacja). Wzrost odblokowany dopiero gdy Zdrowie > 0. [PT]"
    },
    zdrowie_prog_ubytek_populacji: {
      easy: -6,
      normal: -5,
      hard: -4,
      jednostka: "pkt Zdrowia",
      opis: "Gdy Zdrowie < tej warto\u015Bci \u2192 mo\u017Cliwy ubytek populacji (co N tur jedna jednostka populacji umiera). [PT \u2014 do strojenia]"
    },
    zdrowie_tempo_ubytku: {
      easy: 4,
      normal: 3,
      hard: 2,
      jednostka: "tur/utrata",
      opis: "Co ile tur nast\u0119puje utrata 1 punktu populacji, gdy Zdrowie < progu ubytku. [PT \u2014 do strojenia]"
    }
  },
  szczescie: {
    szczescie_swiatynia: {
      easy: 2,
      normal: 1,
      hard: 0,
      jednostka: "zadowolony mieszk.",
      opis: "\u015Awi\u0105tynia daje +1 zadowolony mieszkaniec w mie\u015Bcie (efekt religijno-kulturowy). [PT]"
    },
    szczescie_amfiteatr: {
      easy: 2,
      normal: 1,
      hard: 0,
      jednostka: "zadowolony mieszk.",
      opis: "Amfiteatr/rozrywka daje +1 zadowolonego mieszka\u0144ca (igrzyska, widowiska). [PT \u2014 do strojenia]"
    },
    szczescie_luksus_na_mieszkanca: {
      easy: 4,
      normal: 5,
      hard: 6,
      jednostka: "Luksus / +1 mieszk.",
      opis: "Ile jednostek Luksusu potrzeba na +1 zadowolonego mieszka\u0144ca (unikalny luksus). [PT]"
    },
    szczescie_ustroj_bonus: {
      easy: 2,
      normal: 1,
      hard: 0,
      jednostka: "pkt Zadowolenia",
      opis: "Bonus Zadowolenia z dobrego ustroju politycznego (republika, demokracja itp.). [PT \u2014 do strojenia]"
    },
    szczescie_religia_dominujaca: {
      easy: 3,
      normal: 2,
      hard: 1,
      jednostka: "pkt Zadowolenia",
      opis: "Bonus Zadowolenia z religii dominuj\u0105cej w mie\u015Bcie (jedno\u015B\u0107 wyznaniowa, wsp\xF3lne warto\u015Bci). [PT]"
    },
    szczescie_kultura_dominujaca: {
      easy: 2,
      normal: 1,
      hard: 0,
      jednostka: "pkt Zadowolenia",
      opis: "Bonus Zadowolenia gdy nasza kultura dominuje w mie\u015Bcie (\u226580% kultury w\u0142asnej). [PT \u2014 do strojenia]"
    },
    szczescie_male_miasto_bonus: {
      easy: 2,
      normal: 1,
      hard: 0,
      jednostka: "pkt Zadowolenia",
      opis: "Bonus Zadowolenia za ma\u0142e miasto (populacja \u2264 pr\xF3g zag\u0119szczenia). Mieszka\u0144cy czuj\u0105 si\u0119 mniej t\u0142oczno. [PT]"
    },
    szczescie_kara_wielkosc_miasta: {
      easy: -0.75,
      normal: -1,
      hard: -1.25,
      jednostka: "pkt/1 ludno\u015Bci",
      opis: "Kara Zadowolenia za ka\u017Cdy punkt populacji powy\u017Cej progu zag\u0119szczenia (zag\u0119szczenie \u2192 niezadowolenie). [PT]"
    },
    szczescie_prog_zag\u0119szczenia: {
      easy: 5,
      normal: 4,
      hard: 3,
      jednostka: "ludno\u015B\u0107",
      opis: "Pr\xF3g zag\u0119szczenia dla szcz\u0119\u015Bcia \u2014 poni\u017Cej tej liczby mieszka\u0144c\xF3w kara zag\u0119szczenia nie jest naliczana. [PT]"
    },
    szczescie_kara_wojna: {
      easy: -2,
      normal: -3,
      hard: -4,
      jednostka: "pkt Zadowolenia",
      opis: "Kara Zadowolenia w czasie stanu wojennego (zm\u0119czenie wojn\u0105 \u2014 dotyczy ca\u0142ej cywilizacji). [PT]"
    },
    szczescie_kara_obca_kultura: {
      easy: -0.75,
      normal: -1,
      hard: -1.25,
      jednostka: "pkt Zadowolenia",
      opis: "Kara Zadowolenia za dominuj\u0105c\u0105 obc\u0105 kultur\u0119 w mie\u015Bcie (<50% w\u0142asnej kultury). [PT \u2014 do strojenia]"
    },
    szczescie_kara_obca_religia: {
      easy: -1,
      normal: -2,
      hard: -3,
      jednostka: "pkt Zadowolenia",
      opis: "Kara Zadowolenia gdy obca religia dominuje w mie\u015Bcie (po podboju). [PT]"
    },
    szczescie_kara_wysokie_podatki: {
      easy: 0,
      normal: -1,
      hard: -2,
      jednostka: "pkt/poziom",
      opis: "Kara Zadowolenia za ka\u017Cdy poziom powy\u017Cej bazowej stawki podatkowej (wy\u017Csze podatki \u2192 gniew). [PT \u2014 do strojenia]"
    },
    szczescie_bonus_luksus_30: {
      easy: 2,
      normal: 1,
      hard: 0,
      jednostka: "pkt Sz",
      opis: "Bonus Szcz\u0119\u015Bcia gdy udzia\u0142 Luksus/Wealth \u2265 30% (niskie podatki). [B2-narzedzia-stabilizacji]"
    },
    szczescie_bonus_luksus_40: {
      easy: 3,
      normal: 2,
      hard: 1,
      jednostka: "pkt Sz",
      opis: "Bonus Sz gdy Luksus \u2265 40%."
    },
    szczescie_bonus_luksus_50: {
      easy: 4,
      normal: 3,
      hard: 2,
      jednostka: "pkt Sz",
      opis: "Bonus Sz gdy Luksus \u2265 50%."
    },
    szczescie_bonus_luksus_60: {
      easy: 5,
      normal: 4,
      hard: 3,
      jednostka: "pkt Sz",
      opis: "Bonus Sz gdy Luksus \u2265 60%."
    },
    szczescie_bonus_luksus_70: {
      easy: 6,
      normal: 5,
      hard: 4,
      jednostka: "pkt Sz",
      opis: "Bonus Sz gdy Luksus \u2265 70% (max)."
    },
    szczescie_prog_bunt: {
      easy: 4,
      normal: 3,
      hard: 2,
      jednostka: "niezadowoleni",
      opis: "Gdy liczba niezadowolonych mieszka\u0144c\xF3w \u2265 tej warto\u015Bci \u2192 ryzyko buntu/strajku (brak produkcji z tych mieszka\u0144c\xF3w). [PT]"
    },
    szczescie_prog_strajk_produkcja: {
      easy: -1,
      normal: -1,
      hard: -1,
      jednostka: "\xD7",
      opis: "Wsp\xF3\u0142czynnik utraty produkcji na ka\u017Cdego niezadowolonego mieszka\u0144ca w stanie buntu (strajk \u2192 utrata Pracy). [PT \u2014 do strojenia]"
    },
    szczescie_prog_bonus_wzrost: {
      easy: 2,
      normal: 3,
      hard: 4,
      jednostka: "zadowoleni",
      opis: "Gdy liczba zadowolonych mieszka\u0144c\xF3w \u2265 tej warto\u015Bci \u2192 bonus do wzrostu populacji (+%). [PT]"
    },
    szczescie_bonus_wzrost_wartosc: {
      easy: 0.12,
      normal: 0.1,
      hard: 0.08,
      jednostka: "\xD7",
      opis: "Mno\u017Cnik wzrostu populacji przy wysokim zadowoleniu (\u2265 progu). Np. 0,10 = +10% szybciej. [PT \u2014 do strojenia]"
    },
    szczescie_prog_bonus_produkcja: {
      easy: 4,
      normal: 5,
      hard: 6,
      jednostka: "zadowoleni",
      opis: "Gdy liczba zadowolonych mieszka\u0144c\xF3w \u2265 tej warto\u015Bci \u2192 bonus do produkcji (Pracy). [PT]"
    },
    szczescie_bonus_produkcja_wartosc: {
      easy: 0.12,
      normal: 0.1,
      hard: 0.08,
      jednostka: "\xD7",
      opis: "Mno\u017Cnik produkcji (Pracy) przy bardzo wysokim zadowoleniu (\u2265 progu). Np. 0,10 = +10% Pracy. [PT \u2014 do strojenia]"
    }
  },
  kultura: {
    kultura_palac: {
      easy: 5,
      normal: 4,
      hard: 3,
      jednostka: "Kultura/tur\u0119",
      opis: "Produkcja kultury z Pa\u0142acu (stolica cywilizacji). [PT \u2014 do strojenia]"
    },
    kultura_swiatynia: {
      easy: 3,
      normal: 2,
      hard: 1,
      jednostka: "Kultura/tur\u0119",
      opis: "Produkcja kultury ze \u015Awi\u0105tyni. [PT \u2014 do strojenia]"
    },
    kultura_biblioteka: {
      easy: 2,
      normal: 1,
      hard: 0,
      jednostka: "Kultura/tur\u0119",
      opis: "Produkcja kultury z Biblioteki (zbiorowe dziedzictwo wiedzy). [PT \u2014 do strojenia]"
    },
    kultura_amfiteatr: {
      easy: 3,
      normal: 2,
      hard: 1,
      jednostka: "Kultura/tur\u0119",
      opis: "Produkcja kultury z Amfiteatru (widowiska, sztuka, teatr). [PT \u2014 do strojenia]"
    },
    kultura_cud_bonus: {
      easy: 6,
      normal: 5,
      hard: 4,
      jednostka: "Kultura/tur\u0119",
      opis: "Bonus kultury z Cudu \u015Awiata (warto\u015B\u0107 per cud; cuda maj\u0105 wy\u017Cszy bonus ni\u017C standardowe budynki). [PT \u2014 do strojenia]"
    },
    kultura_specjalista_artysta: {
      easy: 3,
      normal: 2,
      hard: 1,
      jednostka: "Kultura/tur\u0119",
      opis: "Produkcja kultury Specjalisty Artysty przypisanego do miasta (+2 Kultury/tur\u0119 per artysta). [PT]"
    },
    kultura_prog_zasieg_1: {
      easy: 75,
      normal: 100,
      hard: 125,
      jednostka: "pkt Kultury [PT]",
      opis: "Pr\xF3g kultury skumulowanej do 1. ekspansji granic (zasi\u0119g +1 pole wok\xF3\u0142 miasta). [PT]"
    },
    kultura_prog_zasieg_2: {
      easy: 188,
      normal: 250,
      hard: 312,
      jednostka: "pkt Kultury [PT]",
      opis: "Pr\xF3g kultury do 2. ekspansji granic. [PT]"
    },
    kultura_prog_zasieg_3: {
      easy: 375,
      normal: 500,
      hard: 625,
      jednostka: "pkt Kultury [PT]",
      opis: "Pr\xF3g kultury do 3. ekspansji granic. [PT]"
    },
    kultura_zadowolenie_100pct: {
      easy: 3,
      normal: 2,
      hard: 1,
      jednostka: "pkt Zadowolenia",
      opis: "Bonus Zadowolenia gdy 100% kultury w mie\u015Bcie to nasza kultura (pe\u0142na jedno\u015B\u0107 kulturowa). [PT \u2014 do strojenia]"
    },
    kultura_zadowolenie_75pct: {
      easy: 2,
      normal: 1,
      hard: 0,
      jednostka: "pkt Zadowolenia",
      opis: "Bonus Zadowolenia gdy \u226575% kultury naszej (wysoka jedno\u015B\u0107 kulturowa). [PT \u2014 do strojenia]"
    },
    kultura_zadowolenie_50pct: {
      easy: 0,
      normal: 0,
      hard: 0,
      jednostka: "pkt Zadowolenia",
      opis: "Zadowolenie neutralne gdy 50% kultury naszej (mieszane miasto). [PT \u2014 do strojenia]"
    },
    kultura_kara_zadowolenie_lt50: {
      easy: -0.75,
      normal: -1,
      hard: -1.25,
      jednostka: "pkt Zadowolenia",
      opis: "Kara Zadowolenia gdy <50% kultury naszej (obca kultura dominuje \u2192 napi\u0119cia spo\u0142eczne). [PT \u2014 do strojenia]"
    },
    kultura_kara_zadowolenie_lt25: {
      easy: -1,
      normal: -2,
      hard: -3,
      jednostka: "pkt Zadowolenia",
      opis: "Kara Zadowolenia gdy <25% kultury naszej (wyra\u017Ana dominacja obcej kultury \u2192 ryzyko buntu). [PT \u2014 do strojenia]"
    },
    kultura_konwersja_baza_tura: {
      easy: 2,
      normal: 1,
      hard: 0,
      jednostka: "%/tur\u0119",
      opis: "Bazowa pr\u0119dko\u015B\u0107 konwersji kultury podbitego terenu/miasta (% kultury w\u0142asnej dodawanej na tur\u0119 bez budynk\xF3w). [PT]"
    },
    kultura_konwersja_swiatynia: {
      easy: 1.88,
      normal: 1.5,
      hard: 1.12,
      jednostka: "%/tur\u0119",
      opis: "Dodatkowa pr\u0119dko\u015B\u0107 konwersji kulturowej ze \u015Awi\u0105tyni w mie\u015Bcie (+% w\u0142asnej kultury/tur\u0119 per budynek). [PT \u2014 do strojenia]"
    },
    kultura_konwersja_amfiteatr: {
      easy: 2,
      normal: 1,
      hard: 0,
      jednostka: "%/tur\u0119",
      opis: "Dodatkowa pr\u0119dko\u015B\u0107 konwersji kulturowej z Amfiteatru (widowiska = soft power). [PT \u2014 do strojenia]"
    },
    kultura_konwersja_biblioteka: {
      easy: 0.62,
      normal: 0.5,
      hard: 0.38,
      jednostka: "%/tur\u0119",
      opis: "Dodatkowa pr\u0119dko\u015B\u0107 konwersji kulturowej z Biblioteki. [PT \u2014 do strojenia]"
    },
    kultura_konwersja_cel_100pct: {
      easy: 100,
      normal: 100,
      hard: 100,
      jednostka: "%",
      opis: "Cel konwersji = 100% naszej kultury. Dop\xF3ki poni\u017Cej 100%: niezadowolenie/ryzyko buntu (malej\u0105ce w miar\u0119 konwersji). [PT]"
    },
    kultura_konwersja_cap_tura: {
      easy: 6,
      normal: 5,
      hard: 4,
      jednostka: "%/tur\u0119",
      opis: "Maksymalna \u0142\u0105czna pr\u0119dko\u015B\u0107 konwersji na tur\u0119 (cap, niezale\u017Cnie od liczby budynk\xF3w kulturalnych). [PT \u2014 do strojenia]"
    }
  },
  religia: {
    religia_prog_dominacji: {
      easy: 38,
      normal: 50,
      hard: 62,
      jednostka: "%",
      opis: "Pr\xF3g % wyznawc\xF3w w mie\u015Bcie, przy kt\xF3rym religia jest uznana za dominuj\u0105c\u0105. [PT \u2014 do strojenia]"
    },
    religia_szybkosc_szerzenia_bazowa: {
      easy: 2,
      normal: 1,
      hard: 0,
      jednostka: "miasto/tur\u0119",
      opis: "Bazowa liczba s\u0105siednich miast, do kt\xF3rych religia mo\u017Ce dotrze\u0107 na tur\u0119 (bez bonus\xF3w). [PT]"
    },
    religia_swiatynia_bonus_szerzenia: {
      easy: 2,
      normal: 1,
      hard: 0,
      jednostka: "miasto/tur\u0119",
      opis: "Bonus pr\u0119dko\u015Bci szerzenia si\u0119 religii ze \u015Awi\u0105tyni (\u015Awi\u0105tynia = centrum misji). [PT \u2014 do strojenia]"
    },
    religia_szerzenie_max_dystans: {
      easy: 4,
      normal: 3,
      hard: 2,
      jednostka: "heks\xF3w",
      opis: "Maksymalny dystans w heksach, na kt\xF3ry religia mo\u017Ce si\u0119 szerzy\u0107 bez budynk\xF3w misyjnych. [PT \u2014 do strojenia]"
    },
    religia_zadowolenie_dominujaca: {
      easy: 3,
      normal: 2,
      hard: 1,
      jednostka: "pkt Zadowolenia",
      opis: "Bonus Zadowolenia gdy nasza religia dominuje w mie\u015Bcie (jedno\u015B\u0107 wyznaniowa). [PT]"
    },
    religia_swiatynia_zadowolenie: {
      easy: 2,
      normal: 1,
      hard: 0,
      jednostka: "zadowolony mieszk.",
      opis: "Bonus Zadowolenia ze \u015Awi\u0105tyni (wyznawcy maj\u0105 poczucie przynale\u017Cno\u015Bci duchowej). [PT]"
    },
    religia_jednosc_bonus_produkcja: {
      easy: 0.06,
      normal: 0.05,
      hard: 0.04,
      jednostka: "\xD7",
      opis: "Bonus do produkcji (Pracy) gdy >80% miast cywilizacji wyznaje t\u0119 sam\u0105 religi\u0119 (jedno\u015B\u0107 wyznaniowa). [PT \u2014 do strojenia]"
    },
    religia_kara_obca: {
      easy: -1,
      normal: -2,
      hard: -3,
      jednostka: "pkt Zadowolenia",
      opis: "Kara Zadowolenia gdy obca religia dominuje w mie\u015Bcie (po podboju lub konwersji przez rywala). [PT]"
    },
    religia_kara_brak_religii: {
      easy: -0.75,
      normal: -1,
      hard: -1.25,
      jednostka: "pkt Zadowolenia",
      opis: "Kara Zadowolenia gdy miasto nie ma \u017Cadnej dominuj\u0105cej religii (brak duchowo\u015Bci = niepok\xF3j spo\u0142eczny). [PT \u2014 do strojenia]"
    },
    religia_bonus_dyplomacja_wspolna: {
      easy: 12,
      normal: 10,
      hard: 8,
      jednostka: "pkt relacji",
      opis: "Bonus dyplomatyczny za wsp\xF3ln\u0105 religi\u0119 z graczem s\u0105siednim (wsp\xF3lne warto\u015Bci, porozumienie). [PT]"
    },
    religia_kara_dyplomacja_rozna: {
      easy: -8,
      normal: -10,
      hard: -12,
      jednostka: "pkt relacji",
      opis: "Kara dyplomatyczna za inn\u0105 religi\u0119 z graczem s\u0105siednim (tarcia ideologiczne). [PT]"
    },
    religia_bonus_dyplomacja_misja: {
      easy: 6,
      normal: 5,
      hard: 4,
      jednostka: "pkt relacji",
      opis: "Dodatkowy bonus dyplomatyczny je\u015Bli wyslano misjonarza do cywilizacji i podj\u0105\u0142 dzia\u0142alno\u015B\u0107. [PT \u2014 do strojenia]"
    },
    religia_konwersja_bazowa: {
      easy: 3,
      normal: 2,
      hard: 1,
      jednostka: "%/tur\u0119",
      opis: "Bazowa pr\u0119dko\u015B\u0107 konwersji religijnej podbitego miasta (% wyznawc\xF3w nowej religii na tur\u0119). [PT]"
    },
    religia_konwersja_swiatynia: {
      easy: 3,
      normal: 2,
      hard: 1,
      jednostka: "%/tur\u0119",
      opis: "Przyspieszenie konwersji religijnej ze \u015Awi\u0105tyni w podbitym mie\u015Bcie. [PT \u2014 do strojenia]"
    },
    religia_konwersja_cel: {
      easy: 100,
      normal: 100,
      hard: 100,
      jednostka: "%",
      opis: "Cel konwersji = 100% wyznawc\xF3w naszej religii. Dop\xF3ki poni\u017Cej: kara Zadowolenia (obca religia). [PT]"
    }
  },
  religie_cywilizacji: [
    {
      Cywilizacja: "Grecy",
      "Religia / wyznanie": "Politeizm olimpijski",
      "G\u0142\xF3wne b\xF3stwo / idea": "Olimpijscy bogowie (Zeus, Atena, Apollo\u2026)",
      "Wp\u0142yw na parametry (bonusy) [propozycja, edytowalne]": "+2 Kultura/tur\u0119 w ka\u017Cdym mie\u015Bcie ze \u015Awi\u0105tyni\u0105; +1 Zadowolony mieszkaniec podczas igrzysk/\u015Bwi\u0105t (1 tura co 10 tur); +5 pkt relacji dyplomatycznych z cywilizacjami tej samej grupy kulturowej."
    },
    {
      Cywilizacja: "Rzymianie",
      "Religia / wyznanie": "Religia rzymska / kult pa\u0144stwa",
      "G\u0142\xF3wne b\xF3stwo / idea": "Jowisz / deifikacja cesarza",
      "Wp\u0142yw na parametry (bonusy) [propozycja, edytowalne]": "+1 Zadowolony mieszkaniec w ka\u017Cdym mie\u015Bcie ze \u015Awi\u0105tyni\u0105; +2 pkt jedno\u015Bci (lojalno\u015B\u0107) we wszystkich miastach; \u22125% kary korupcji (biurokratyczna pobo\u017Cno\u015B\u0107). Strata Stolicy = utrata bonus\xF3w religijnych na 5 tur."
    },
    {
      Cywilizacja: "Chi\u0144czycy",
      "Religia / wyznanie": "Konfucjanizm / Taoizm",
      "G\u0142\xF3wne b\xF3stwo / idea": "Konfucjusz / Tao (Droga harmonii)",
      "Wp\u0142yw na parametry (bonusy) [propozycja, edytowalne]": "+1 Nauka/tur\u0119 w ka\u017Cdym mie\u015Bcie z Bibliotek\u0105; \u22121 kara Zadowolenia za zag\u0119szczenie (porz\u0105dek spo\u0142eczny); +2 Zadowolenia z ustroju administracyjnego (harmonia i hierarchia)."
    },
    {
      Cywilizacja: "Inkowie",
      "Religia / wyznanie": "Kult S\u0142o\u0144ca Inti",
      "G\u0142\xF3wne b\xF3stwo / idea": "Inti \u2014 S\u0142o\u0144ce, syn boga Viracochy",
      "Wp\u0142yw na parametry (bonusy) [propozycja, edytowalne]": "+2 \u017Bywno\u015B\u0107/tur\u0119 w miastach z Farm\u0105/Irygacj\u0105 (b\u0142ogos\u0142awie\u0144stwo rolnicze); +1 Zadowolony mieszkaniec (jedno\u015B\u0107 z bogiem-kr\xF3lem); +5% pr\u0119dko\u015Bci wzrostu populacji w stolicy."
    },
    {
      Cywilizacja: "Zulusi",
      "Religia / wyznanie": "Kult przodk\xF3w / animizm",
      "G\u0142\xF3wne b\xF3stwo / idea": "Mzimu \u2014 duchy przodk\xF3w; Unkulunkulu \u2014 Stw\xF3rca",
      "Wp\u0142yw na parametry (bonusy) [propozycja, edytowalne]": "+10 Morale jednostek wojskowych (wsparcie duchowe przodk\xF3w); +1 Zadowolony mieszkaniec per 3 jednostki wojskowe w garnizonie (chwa\u0142a wojownika); +2 pkt jedno\u015Bci ca\u0142ej cywilizacji."
    },
    {
      Cywilizacja: "Egipt",
      "Religia / wyznanie": "Religia egipska \u2014 faraon-b\xF3g",
      "G\u0142\xF3wne b\xF3stwo / idea": "Ra / Amun-Ra; faraon jako \u017Cywy b\xF3g",
      "Wp\u0142yw na parametry (bonusy) [propozycja, edytowalne]": "+3 Kultura/tur\u0119 z Pa\u0142acu (boski majestat w\u0142adcy); +1 Zadowolony mieszkaniec w stolicy (kult faraona); \u221210% kosztu Pracy przy budowie Cud\xF3w \u015Awiata (b\u0142ogos\u0142awie\u0144stwo bog\xF3w)."
    },
    {
      Cywilizacja: "Sumerowie",
      "Religia / wyznanie": "Religia sumeryjska (mezopotamska) \u2014 Enlil/Anu",
      "G\u0142\xF3wne b\xF3stwo / idea": "Enlil/Anu \u2014 bogowie sumeryjscy; Enlil \u2014 b\xF3g nieba i wiatru",
      "Wp\u0142yw na parametry (bonusy) [propozycja, edytowalne]": "+2 Nauka/tur\u0119 w miastach z Obserwatorium/Bibliotek\u0105 (astronomia i matematyka kap\u0142an\xF3w); +1 Zadowolony mieszkaniec per \u015Awi\u0105tynia-Zikkurat; +5 pkt relacji dyplomatycznych z cywilizacjami uznaj\u0105cymi Sumer\xF3w za lidera cywilizacji."
    },
    {
      Cywilizacja: "Celtowie",
      "Religia / wyznanie": "Religia celtycka (druidyzm)",
      "G\u0142\xF3wne b\xF3stwo / idea": "Druidzi \u2014 kap\u0142ani natury; Matka Ziemia / bogowie le\u015Bni",
      "Wp\u0142yw na parametry (bonusy) [propozycja, edytowalne]": "+10 Morale piechoty przy szar\u017Cy (duch wojownika); +1 Zadowolony mieszkaniec w miastach le\u015Bnych; +5% pr\u0119dko\u015Bci ruchu jednostek w lesie (znajomo\u015B\u0107 terenu)."
    },
    {
      Cywilizacja: "Germanie",
      "Religia / wyznanie": "Religia germa\u0144ska (Wotan / Odyn)",
      "G\u0142\xF3wne b\xF3stwo / idea": "Wotan/Odyn \u2014 b\xF3g wojny i m\u0105dro\u015Bci; Th\xF3r \u2014 piorun",
      "Wp\u0142yw na parametry (bonusy) [propozycja, edytowalne]": "+10 Morale przy zasadzce / pierwszym uderzeniu; +1 Zadowolony mieszkaniec per 2 jednostki w lesie; \u22125% kosztu rekrutacji piechoty (kult wojownika)."
    }
  ],
  porzadek: {
    porzadek_waga_szczescie: {
      easy: 0.5,
      normal: 0.5,
      hard: 0.5,
      jednostka: "waga",
      opis: "Waga Szcz\u0119\u015Bcia w Porz\u0105dku: Porz\u0105dek = round(waga_szczescie \xD7 Szcz\u0119\u015Bcie + waga_prawo \xD7 Prawo). Domy\u015Blnie 0,5 (\u015Brednia Szcz\u0119\u015Bcia i Prawa). [PT]"
    },
    porzadek_waga_prawo: {
      easy: 0.5,
      normal: 0.5,
      hard: 0.5,
      jednostka: "waga",
      opis: "Waga Prawa w Porz\u0105dku (patrz porzadek_waga_szczescie). Prawo = nowy wska\u017Anik \u0142adu/administracji miasta (rz\u0105dy, s\u0105dy); dop\xF3ki brak podsystemu Prawa, przyjmuje 0. [PT]"
    },
    porzadek_prog_t1: {
      easy: -1,
      normal: 0,
      hard: 1,
      jednostka: "pkt Porz\u0105dku",
      opis: "Pr\xF3g T1: gdy Porz\u0105dek < T1 \u2192 niepok\xF3j ('unrest') \u2014 kary do produkcji/wzrostu i ryzyko buntu. Ni\u017Cszy T1 = \u0142agodniej (easy). [PT \u2014 do strojenia]"
    },
    porzadek_prog_t2: {
      easy: 4,
      normal: 6,
      hard: 8,
      jednostka: "pkt Porz\u0105dku",
      opis: "Pr\xF3g T2: gdy Porz\u0105dek \u2265 T2 \u2192 bonus Porz\u0105dku ('order') \u2014 premia do produkcji i handlu. Mi\u0119dzy T1 a T2 \u2192 neutralnie. Ni\u017Cszy T2 = \u0142atwiej o bonus (easy). [PT \u2014 do strojenia]"
    },
    porzadek_kara_produkcja_t1: {
      easy: -0.1,
      normal: -0.15,
      hard: -0.2,
      jednostka: "\xD7 (frakcja)",
      opis: "Kara produkcji (Pracy) w niepokoju (Porz\u0105dek < T1). Mno\u017Cnik = max(0, 1 + warto\u015B\u0107). Np. \u22120,15 \u2192 \xD70,85 produkcji. [PT]"
    },
    porzadek_kara_pieniadz_t1: {
      easy: -0.1,
      normal: -0.15,
      hard: -0.2,
      jednostka: "\xD7 (frakcja)",
      opis: "Kara Pieni\u0105dza w niepokoju (B2-Q6). Mno\u017Cnik = max(0, 1 + warto\u015B\u0107). [PT]"
    },
    porzadek_kara_nauka_t1: {
      easy: -0.08,
      normal: -0.1,
      hard: -0.12,
      jednostka: "\xD7 (frakcja)",
      opis: "Kara Nauki w niepokoju (B2-Q6). Mno\u017Cnik = max(0, 1 + warto\u015B\u0107). [PT]"
    },
    porzadek_kara_kultura_t1: {
      easy: -0.08,
      normal: -0.1,
      hard: -0.12,
      jednostka: "\xD7 (frakcja)",
      opis: "Kara Kultury w niepokoju (B2-Q6). Mno\u017Cnik = max(0, 1 + warto\u015B\u0107). [PT]"
    },
    porzadek_kara_wzrost_t1: {
      easy: -0.15,
      normal: -0.25,
      hard: -0.35,
      jednostka: "\xD7 (frakcja)",
      opis: "Kara tempa wzrostu populacji w niepokoju (Porz\u0105dek < T1). Mno\u017Cnik = max(0, 1 + warto\u015B\u0107). [PT \u2014 do strojenia]"
    },
    porzadek_ryzyko_buntu_t1: {
      easy: 0.05,
      normal: 0.05,
      hard: 0.08,
      jednostka: "prawdopodobie\u0144stwo/tur\u0119",
      opis: "Ryzyko migracji buntu na tur\u0119 w niepokoju (B2-Q6=C: ~5% normal). Engine losuje migracj\u0119 \u22121/+1 pop w imperium. [PT]"
    },
    porzadek_bonus_produkcja_t2: {
      easy: 0.12,
      normal: 0.1,
      hard: 0.08,
      jednostka: "\xD7 (frakcja)",
      opis: "Bonus produkcji (Pracy) przy wysokim Porz\u0105dku (\u2265 T2). Mno\u017Cnik = 1 + warto\u015B\u0107. Np. 0,10 \u2192 \xD71,10. [PT \u2014 do strojenia]"
    },
    porzadek_bonus_handel_t2: {
      easy: 0.12,
      normal: 0.1,
      hard: 0.08,
      jednostka: "\xD7 (frakcja)",
      opis: "Bonus handlu (Handel) przy wysokim Porz\u0105dku (\u2265 T2). Mno\u017Cnik = 1 + warto\u015B\u0107. [PT \u2014 do strojenia]"
    }
  },
  prawo: {
    prawo_garnizon_per_jednostka: {
      easy: 25,
      normal: 20,
      hard: 15,
      jednostka: "pkt Prawa",
      opis: "Prawo z garnizonu \u2014 +pkt per jednostka w mie\u015Bcie (do cap). [B2-narzedzia-stabilizacji]"
    },
    prawo_garnizon_cap_jednostek: {
      easy: 5,
      normal: 5,
      hard: 4,
      jednostka: "jednostki",
      opis: "Max jednostek liczonych do Prawa (5 \u2192 PrawPct\u2248100%)."
    },
    prawo_ratusz: {
      easy: 4,
      normal: 3,
      hard: 2,
      jednostka: "pkt Prawa",
      opis: "Bonus Prawa z Ratusza (gdy wpi\u0119ty w budynki)."
    },
    prawo_pretorium: {
      easy: 3,
      normal: 2,
      hard: 1,
      jednostka: "pkt Prawa",
      opis: "Bonus Prawa z Pretorium."
    },
    prawo_sad: {
      easy: 3,
      normal: 2,
      hard: 1,
      jednostka: "pkt Prawa",
      opis: "Bonus Prawa z S\u0105du."
    },
    prawo_kara_brak_garnizonu: {
      easy: -1,
      normal: -2,
      hard: -3,
      jednostka: "pkt Prawa",
      opis: "Kara gdy pop\u22656 i brak garnizonu (opcjonalne v1.0)."
    }
  }
};

// data/terrain-movement.json
var terrain_movement_default = {
  costs: {
    Laka: 1,
    Rownina: 1,
    Pustynia: 2,
    Wybrzeze: 99,
    Wzgorza: 2,
    Gory: 99,
    Morze: 99
  },
  forestExtra: 1
};

// src/data/loader.ts
function loadGameData() {
  return {
    units: units_default,
    buildings: buildings_default,
    resources: resources_default,
    tech: Array.isArray(tech_default) ? tech_default : tech_default.technologie ?? [],
    civs: civs_default,
    terrainYields: terrain_yields_default,
    terrainCombat: terrain_combat_default,
    counters: counters_default,
    diplomacy: diplomacy_default,
    econParams: econ_params_default,
    aiParams: ai_params_default,
    societyParams: society_params_default,
    terrainMovement: terrain_movement_default
  };
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
  const p2 = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p2[i] = i;
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = p2[i];
    p2[i] = p2[j];
    p2[j] = tmp;
  }
  return p2;
}
function cosLerp(a, b, t) {
  const f = (1 - Math.cos(t * Math.PI)) * 0.5;
  return a * (1 - f) + b * f;
}
function valueNoise2D(p2, x, y) {
  const xi = Math.floor(x) & 255;
  const yi = Math.floor(y) & 255;
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);
  const hash = (ix, iy) => p2[p2[ix & 255] + iy & 255] / 255;
  const v00 = hash(xi, yi);
  const v10 = hash(xi + 1, yi);
  const v01 = hash(xi, yi + 1);
  const v11 = hash(xi + 1, yi + 1);
  const top = cosLerp(v00, v10, xf);
  const bottom = cosLerp(v01, v11, xf);
  return cosLerp(top, bottom, yf);
}
function fbm(p2, x, y, octaves = 4) {
  let value = 0, amplitude = 0.5, frequency = 1, maxValue = 0;
  for (let i = 0; i < octaves; i++) {
    value += valueNoise2D(p2, x * frequency, y * frequency) * amplitude;
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
function buildContinentCenters(rand, n) {
  const centers = [];
  const margin = 0.15;
  for (let i = 0; i < n; i++) {
    centers.push({
      nq: margin + rand() * (1 - 2 * margin),
      nr: margin + rand() * (1 - 2 * margin),
      radius: 0.28 + rand() * 0.12
      // promien 28-40% mapy
    });
  }
  return centers;
}
function landMaskKontynenty(q, r, width, height, centers, perm, noiseScale) {
  const nq = q / (width - 1);
  const nr = r / (height - 1);
  const edgeQ = Math.min(nq, 1 - nq) / 0.12;
  const edgeR = Math.min(nr, 1 - nr) / 0.1;
  const edgeMask = Math.min(1, edgeQ) * Math.min(1, edgeR);
  let best = 0;
  for (const c of centers) {
    const dq = nq - c.nq;
    const dr = nr - c.nr;
    const dist = Math.sqrt(dq * dq + dr * dr);
    const radial = Math.max(0, 1 - Math.pow(dist / c.radius, 1.8));
    if (radial > best) best = radial;
  }
  const warp = fbm(perm, q * noiseScale * 0.7 + 100, r * noiseScale * 0.7 + 100, 3) * 0.25;
  return Math.min(1, Math.max(0, (best + warp - 0.12) * edgeMask));
}
function landMaskPangea(q, r, width, height, perm, noiseScale) {
  const cx = (width - 1) / 2;
  const cy = (height - 1) / 2;
  const dx = (q - cx) / (cx + 0.5);
  const dy = (r - cy) / (cy + 0.5);
  const dist = Math.sqrt(dx * dx + dy * dy);
  const radial = Math.max(0, 1 - Math.pow(dist / 1.05, 1.4));
  const warp = fbm(perm, q * noiseScale * 0.6 + 200, r * noiseScale * 0.6 + 200, 3) * 0.3;
  return Math.min(1, Math.max(0, radial + warp - 0.05));
}
function landMaskWyspy(q, r, width, height, perm, noiseScale) {
  const nq = q / (width - 1);
  const nr = r / (height - 1);
  const edgeQ = Math.min(nq, 1 - nq) / 0.08;
  const edgeR = Math.min(nr, 1 - nr) / 0.08;
  const edgeMask = Math.min(1, edgeQ) * Math.min(1, edgeR);
  const coarse = fbm(perm, q * noiseScale * 1.1 + 300, r * noiseScale * 1.1 + 300, 4);
  const fine = fbm(perm, q * noiseScale * 2.2 + 400, r * noiseScale * 2.2 + 400, 3) * 0.3;
  return Math.min(1, Math.max(0, (coarse + fine - 0.5) * 1.6 * edgeMask));
}
var ZIEMIA_LAND_CENTERS = [
  { nq: 0.17, nr: 0.32, radius: 0.15 },
  { nq: 0.22, nr: 0.58, radius: 0.11 },
  { nq: 0.48, nr: 0.26, radius: 0.13 },
  { nq: 0.6, nr: 0.34, radius: 0.19 },
  { nq: 0.5, nr: 0.52, radius: 0.12 },
  { nq: 0.8, nr: 0.66, radius: 0.08 }
];
function landMaskZiemia(q, r, width, height, perm, noiseScale) {
  const raw = landMaskKontynenty(q, r, width, height, ZIEMIA_LAND_CENTERS, perm, noiseScale * 0.85);
  return Math.min(1, Math.max(0, raw * 1.05 - 0.02));
}
function classifyTerrain(elevContinental, landMask, mtnNoise, forNoise, desNoise) {
  let terenBazowy;
  let nakladka = "brak" /* Brak */;
  if (elevContinental < 0.14) {
    terenBazowy = "morze" /* Morze */;
  } else {
    const isHighlands = mtnNoise > 0.6 && landMask > 0.25;
    const isMountain = mtnNoise > 0.75 && landMask > 0.3;
    if (isMountain && elevContinental > 0.2) {
      terenBazowy = "gory" /* Gory */;
    } else if (isHighlands && elevContinental > 0.16) {
      terenBazowy = "wzgorza" /* Wzgorza */;
    } else if (desNoise > 0.63 && elevContinental > 0.18 && elevContinental < 0.45) {
      terenBazowy = "pustynia" /* Pustynia */;
    } else if (elevContinental > 0.35) {
      terenBazowy = "rownina" /* Rownina */;
    } else {
      terenBazowy = "laka" /* Laka */;
    }
    if (terenBazowy !== "gory" /* Gory */ && terenBazowy !== "pustynia" /* Pustynia */ && forNoise > 0.58 && elevContinental > 0.2) {
      nakladka = "las" /* Las */;
    }
  }
  return { terenBazowy, nakladka };
}
function isLandTerrain(tb) {
  return tb === "laka" /* Laka */ || tb === "rownina" /* Rownina */ || tb === "wzgorza" /* Wzgorza */ || tb === "pustynia" /* Pustynia */;
}
function isLandOrCoast(tb) {
  return tb !== "morze" /* Morze */;
}
function isDryLandTerrain(tb) {
  return tb !== "morze" /* Morze */ && tb !== "wybrzeze" /* Wybrzeze */;
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
  for (const [key, hex] of Object.entries(hexes)) {
    if (hex.terenBazowy !== "wybrzeze" /* Wybrzeze */) continue;
    const parts = key.split(",");
    const q = Number(parts[0]);
    const r = Number(parts[1]);
    const touchesSea = HEX_DIRECTIONS.some(
      ([dq, dr]) => hexes[hexKey(q + dq, r + dr)]?.terenBazowy === "morze" /* Morze */
    );
    if (!valid.has(key)) {
      hex.terenBazowy = "morze" /* Morze */;
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
var ELEVATION_RANK = {
  ["morze" /* Morze */]: 0,
  ["wybrzeze" /* Wybrzeze */]: 1,
  ["laka" /* Laka */]: 2,
  ["pustynia" /* Pustynia */]: 3,
  ["rownina" /* Rownina */]: 4,
  ["wzgorza" /* Wzgorza */]: 5,
  ["gory" /* Gory */]: 6
};
function traceRiver(hexes, sq, sr, maxLen = 40) {
  const path = [{ q: sq, r: sr }];
  const visited = /* @__PURE__ */ new Set([hexKey(sq, sr)]);
  let cq = sq, cr = sr;
  for (let step = 0; step < maxLen; step++) {
    const curHex = hexes[hexKey(cq, cr)];
    if (!curHex) break;
    if (curHex.terenBazowy === "morze" /* Morze */) break;
    let bestRank = ELEVATION_RANK[curHex.terenBazowy];
    let bestNeighbors = [];
    for (const [dq, dr] of HEX_DIRECTIONS) {
      const nq = cq + dq;
      const nr = cr + dr;
      const key = hexKey(nq, nr);
      if (visited.has(key)) continue;
      const nhex = hexes[key];
      if (!nhex) continue;
      const rank = ELEVATION_RANK[nhex.terenBazowy];
      if (rank < bestRank) {
        bestRank = rank;
        bestNeighbors = [[nq, nr]];
      } else if (rank === bestRank) {
        bestNeighbors.push([nq, nr]);
      }
    }
    if (bestNeighbors.length === 0) break;
    const next = bestNeighbors[0];
    path.push({ q: next[0], r: next[1] });
    visited.add(hexKey(next[0], next[1]));
    cq = next[0];
    cr = next[1];
    const nHex = hexes[hexKey(cq, cr)];
    if (nHex && nHex.terenBazowy === "morze" /* Morze */) break;
  }
  return path;
}
function generateRivers(hexes, width, height, rand, opts = {}) {
  const maxRivers = opts.maxRivers ?? 2;
  const minLen = opts.minLen ?? 4;
  const maxLen = opts.maxLen ?? 40;
  const margin = opts.margin ?? 2;
  const riverSources = [];
  for (let r = margin; r < height - margin; r++) {
    for (let q = margin; q < width - margin; q++) {
      const hex = hexes[hexKey(q, r)];
      if (!hex) continue;
      const t = hex.terenBazowy;
      if (t === "gory" /* Gory */ || t === "wzgorza" /* Wzgorza */) {
        riverSources.push([q, r]);
      }
    }
  }
  const riverPaths = [];
  const usedHexKeys = /* @__PURE__ */ new Set();
  const total = riverSources.length;
  if (total > 0) {
    const step = Math.max(1, Math.floor(total / 8));
    for (let river = 0; river < maxRivers; river++) {
      let best = [];
      for (let attempt = 0; attempt < 8; attempt++) {
        const seedOffset = Math.floor(rand() * total);
        const idx = (seedOffset + attempt * step) % total;
        const src = riverSources[idx];
        if (!src) continue;
        const srcKey = hexKey(src[0], src[1]);
        if (usedHexKeys.has(srcKey)) continue;
        const candidate = traceRiver(hexes, src[0], src[1], maxLen);
        if (candidate.length > best.length) best = candidate;
      }
      if (best.length >= minLen) {
        riverPaths.push(best);
        for (const { q, r } of best) {
          const hex = hexes[hexKey(q, r)];
          if (hex) hex.rzeka = { obecna: true, krawedzie: [] };
          usedHexKeys.add(hexKey(q, r));
        }
      }
    }
  }
  if (riverPaths.length === 0) {
    const fallback = [];
    const midR = Math.floor(height / 2);
    for (let q = 0; q < width; q += 2) {
      const r = midR + (q % 4 === 0 ? -1 : 1);
      fallback.push({ q, r });
      const hex = hexes[hexKey(q, r)];
      if (hex) hex.rzeka = { obecna: true, krawedzie: [] };
    }
    if (fallback.length >= minLen) riverPaths.push(fallback);
  }
  return riverPaths;
}
var DEPOSIT_RULES = [
  {
    id: "ruda",
    nakladka: "zloze_rudy" /* ZlozeRudy */,
    allowedOn: (h) => h.terenBazowy === "wzgorza" /* Wzgorza */ || h.terenBazowy === "gory" /* Gory */,
    rarity: 0.12
  },
  {
    id: "glina",
    nakladka: "zloze_gliny" /* ZlozeGliny */,
    allowedOn: (h) => h.terenBazowy === "laka" /* Laka */ || isLandTerrain(h.terenBazowy) && h.rzeka?.obecna === true,
    rarity: 0.1
  },
  {
    id: "konie",
    nakladka: "zloze_konia" /* ZlozeKonia */,
    allowedOn: (h) => h.terenBazowy === "rownina" /* Rownina */,
    rarity: 0.1
  },
  {
    id: "wegiel",
    nakladka: null,
    // brak w enumie Nakladka -> znacznik hex.zloze
    allowedOn: (h) => h.terenBazowy === "gory" /* Gory */,
    rarity: 0.1
  },
  {
    id: "owce",
    nakladka: "zloze_owiec" /* ZlozeOwiec */,
    allowedOn: (h) => h.terenBazowy === "laka" /* Laka */ || h.terenBazowy === "rownina" /* Rownina */ || h.terenBazowy === "wzgorza" /* Wzgorza */,
    rarity: 0.08
  },
  {
    id: "bydlo",
    nakladka: "zloze_bydla" /* ZlozeBydla */,
    allowedOn: (h) => h.terenBazowy === "laka" /* Laka */ || h.terenBazowy === "rownina" /* Rownina */,
    rarity: 0.07
  },
  {
    id: "lama",
    nakladka: "zloze_lamy" /* ZlozeLamy */,
    allowedOn: (h) => h.terenBazowy === "wzgorza" /* Wzgorza */ || h.terenBazowy === "pustynia" /* Pustynia */,
    rarity: 0.06
  },
  {
    id: "luksus",
    nakladka: null,
    allowedOn: (h) => h.terenBazowy === "laka" /* Laka */ || h.terenBazowy === "rownina" /* Rownina */,
    rarity: 0.06
  },
  {
    id: "sol",
    nakladka: null,
    allowedOn: (h) => h.terenBazowy === "pustynia" /* Pustynia */ || h.terenBazowy === "rownina" /* Rownina */,
    rarity: 0.12
  }
];
function placeDeposits(hexes, seed, rules = DEPOSIT_RULES) {
  const rand = mulberry32((seed ^ 2654435769) >>> 0);
  const keys = Object.keys(hexes).sort((a, b) => {
    const [aq, ar] = a.split(",").map(Number);
    const [bq, br] = b.split(",").map(Number);
    return aq !== bq ? aq - bq : ar - br;
  });
  const counts = {
    ruda: 0,
    glina: 0,
    konie: 0,
    wegiel: 0,
    owce: 0,
    bydlo: 0,
    lama: 0,
    luksus: 0,
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
      if (rand() < rule.rarity) {
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
  return counts;
}
function stripDepositsFromWater(hexes) {
  for (const hex of Object.values(hexes)) {
    if (hex.terenBazowy !== "morze" /* Morze */ && hex.terenBazowy !== "wybrzeze" /* Wybrzeze */) continue;
    hex.nakladka = "brak" /* Brak */;
    delete hex.zloze;
  }
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
      const tooClose = picked.some((p2) => hexDistanceAxial(c.q, c.r, p2.q, p2.r) < dist);
      if (!tooClose) picked.push(c);
    }
    return picked;
  }
  let result2 = [];
  for (let d2 = minDist; d2 >= absMinDist; d2--) {
    result2 = greedyPick(d2);
    if (result2.length >= minCount) {
      break;
    }
  }
  if (result2.length < minCount) {
    const have = new Set(result2.map((p2) => hexKey(p2.q, p2.r)));
    for (const c of shuffled) {
      if (result2.length >= minCount) break;
      const k = hexKey(c.q, c.r);
      if (!have.has(k)) {
        result2.push(c);
        have.add(k);
      }
    }
  }
  result2.sort((a, b) => a.q !== b.q ? a.q - b.q : a.r - b.r);
  return result2;
}

// src/units/setup.ts
function normalizeForMatch(s) {
  const nfd = s.normalize("NFD").replace(/[̀-ͯ]/g, "");
  return nfd.replace(/[Łł]/g, "l").toLowerCase();
}
function categoryOf(name, role, isSuper) {
  if (isSuper) return "super";
  const n = normalizeForMatch(name ?? "");
  const r = normalizeForMatch(role ?? "");
  if (n.includes("osadnik") || r.includes("osadnik")) return "osadnik";
  if (n.includes("robotnik") || n.includes("worker") || n.includes("budown") || r.includes("robotnik")) return "robotnik";
  if (n.includes("zwiadowca") || n.includes("scout") || n.includes("zwiad") || r.includes("zwiadowca")) return "zwiadowca";
  if (n.includes("galera") || n.includes("galley") || n.includes("okret") || n.includes("statek") || r.includes("morsk") || r.includes("naval")) return "galera";
  if (n.includes("rydwan") || n.includes("chariot") || r.includes("rydwan") || r.includes("chariot")) return "rydwan";
  const konnicaKw = ["konnic", "jezdz", "jazd", "kawaler", "rycerz", "cavalry", "horse"];
  if (konnicaKw.some((kw) => n.includes(kw) || r.includes(kw))) return "konnica";
  if (n.includes("falanga") || n.includes("hoplit") || n.includes("phalanx")) return "falanga";
  if (n.includes("legionist") || n.includes("hastati")) return "legionista";
  const wloczKw = ["wloczn", "pikinier", "spear", "impi"];
  if (wloczKw.some((kw) => n.includes(kw) || r.includes(kw))) return "wlocznik";
  const mieczKw = ["miecz", "sword", "gladi", "khopesh"];
  if (mieczKw.some((kw) => n.includes(kw) || r.includes(kw))) return "miecznik";
  const luczKw = ["luczn", "archer", "kusznik", "crossbow"];
  if (luczKw.some((kw) => n.includes(kw) || r.includes(kw))) return "lucznik";
  const procarKw = ["procarz", "sling"];
  if (procarKw.some((kw) => n.includes(kw) || r.includes(kw))) return "procarz";
  const oszczepKw = ["oszczep", "javelin", "atlatl", "estolic"];
  if (oszczepKw.some((kw) => n.includes(kw) || r.includes(kw))) return "oszczepnik";
  const maczugKw = ["maczug", "chaska", "club", "mace"];
  if (maczugKw.some((kw) => n.includes(kw) || r.includes(kw))) return "maczuga";
  const toporKw = ["topor", "axe"];
  if (toporKw.some((kw) => n.includes(kw) || r.includes(kw))) return "topor";
  const oblezKw = ["taran", "katapult", "oblezn", "siege", "battering", "trebuchet"];
  if (oblezKw.some((kw) => n.includes(kw) || r.includes(kw))) return "obleznicza";
  return "domyslny";
}
function keyOf(q, r) {
  return `${q},${r}`;
}
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

// src/map/generator.ts
var DEFAULT_WIDTH = 36;
var DEFAULT_HEIGHT = 28;
function generateMap(width = DEFAULT_WIDTH, height = DEFAULT_HEIGHT, seed = 42, typ = "kontynenty") {
  const effectiveSeed = seed || 42;
  const rand = mulberry32(effectiveSeed);
  const perm = buildPermTable(rand);
  const shape = defaultShapeParams(rand);
  const sizeNorm = Math.max(width, height) / DEFAULT_WIDTH;
  shape.noiseScale /= sizeNorm;
  shape.mountainScale /= sizeNorm;
  shape.forestScale /= sizeNorm;
  shape.desertScale /= sizeNorm;
  let nCenters = width * height < 2e3 ? 2 : width * height < 6e3 ? 3 : 4;
  if (typ === "kontynenty") {
    nCenters = width * height < 1e4 ? 1 : 2;
  }
  const continentCenters = buildContinentCenters(rand, nCenters);
  const hexes = {};
  for (let r = 0; r < height; r++) {
    for (let q = 0; q < width; q++) {
      const coords = { q, r };
      const key = `${q},${r}`;
      let landMask;
      if (typ === "pangea") {
        landMask = landMaskPangea(q, r, width, height, perm, shape.noiseScale);
      } else if (typ === "wyspy") {
        landMask = landMaskWyspy(q, r, width, height, perm, shape.noiseScale);
      } else if (typ === "ziemia") {
        landMask = landMaskZiemia(q, r, width, height, perm, shape.noiseScale);
      } else {
        landMask = landMaskKontynenty(q, r, width, height, continentCenters, perm, shape.noiseScale);
      }
      const elevation = fbm(perm, q * shape.noiseScale, r * shape.noiseScale, 4);
      const elevContinental = elevation * landMask;
      const mtnNoise = fbm(perm, q * shape.mountainScale + shape.offMtnX, r * shape.mountainScale + shape.offMtnY, 3);
      const forNoise = fbm(perm, q * shape.forestScale + shape.offForX, r * shape.forestScale + shape.offForY, 3);
      const desNoise = fbm(perm, q * shape.desertScale + shape.offDesX, r * shape.desertScale + shape.offDesY, 3);
      const { terenBazowy, nakladka } = classifyTerrain(elevContinental, landMask, mtnNoise, forNoise, desNoise);
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
  {
    const NB = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
    const toCoast = [];
    for (const key of Object.keys(hexes)) {
      const h = hexes[key];
      if (h.terenBazowy === "morze" /* Morze */ || h.terenBazowy === "wybrzeze" /* Wybrzeze */) continue;
      const parts = key.split(",");
      const q = Number(parts[0]);
      const r = Number(parts[1]);
      for (const [dq, dr] of NB) {
        const nb = hexes[`${q + dq},${r + dr}`];
        if (nb && nb.terenBazowy === "morze" /* Morze */) {
          toCoast.push(key);
          break;
        }
      }
    }
    for (const key of toCoast) hexes[key].terenBazowy = "wybrzeze" /* Wybrzeze */;
    sanitizeCoastHexes(hexes);
  }
  if (typ === "kontynenty" || typ === "pangea") {
    removeTinyLandIslands(hexes, 10);
    sanitizeCoastHexes(hexes);
  }
  const riverPaths = generateRivers(hexes, width, height, rand, {
    maxRivers: 5,
    minLen: 4,
    maxLen: 40,
    margin: 2
  });
  placeDeposits(hexes, effectiveSeed);
  stripDepositsFromWater(hexes);
  const startPositions = computeStartPositions(hexes, effectiveSeed, {
    minCount: 5,
    minDist: 5,
    absMinDist: 2
  });
  return { szerokoscQ: width, wysokoscR: height, hexes, seed: effectiveSeed, riverPaths, startPositions };
}
var ROZMIAR_DIMS = {
  malenki: [38, 26],
  maly: [54, 37],
  standardowy: [84, 60],
  duzy: [120, 84],
  ogromny: [168, 119]
};
function normMenuLabel(label) {
  return label.toLowerCase().replace(/ł/g, "l").replace(/[ó]/g, "o").replace(/[ąà]/g, "a").replace(/[ę]/g, "e").replace(/[^a-z0-9]/g, "");
}
function rozmiarFromMenuLabel(label) {
  const n = normMenuLabel(label);
  if (n.startsWith("malen") || n === "malenki") return "malenki";
  if (n.startsWith("mal") || n === "maly" || n === "small") return "maly";
  if (n.startsWith("stand") || n.startsWith("sre") || n === "standardowy" || n === "medium") return "standardowy";
  if (n.startsWith("duz") || n === "large") return "duzy";
  if (n.startsWith("ogr") || n === "ogromny" || n === "xlarge") return "ogromny";
  return "standardowy";
}
function generujSwiat(seed, rozmiar, typ = "kontynenty") {
  const effectiveSeed = seed && seed !== 0 ? seed : (Date.now() ^ 3735928559) >>> 0 || 42;
  const [w, h] = ROZMIAR_DIMS[rozmiar];
  return generateMap(w, h, effectiveSeed, typ);
}

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
  jednostka_koszt_domyslny: {
    wartosc: 10,
    jednostka: "Praca",
    opis: "Domyslny koszt Pracy jednostki, gdy brak pola 'Pieniadz (koszt)' w units.json i brak dopasowania roli. production.DEFAULT_UNIT_COST."
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

// src/game/visibility.ts
function computeVisible(playerUnits, map, sightOrResolver) {
  const visible = /* @__PURE__ */ new Set();
  for (const unit of playerUnits) {
    const sight = typeof sightOrResolver === "function" ? sightOrResolver(unit) : sightOrResolver;
    for (let dq = -sight; dq <= sight; dq++) {
      for (let dr = -sight; dr <= sight; dr++) {
        if (hexDistance(unit.q, unit.r, unit.q + dq, unit.r + dr) <= sight) {
          const k = keyOf(unit.q + dq, unit.r + dr);
          if (k in map.hexes) {
            visible.add(k);
          }
        }
      }
    }
  }
  return visible;
}

// src/game/playtestWalkaMapy.ts
var PLAYTEST_WALKA_SEED = 424242;
var PLAYER_TYPE = "Hastati";
var PLAYER_SIEGE_TYPE = "Lucznik";
var ENEMY_TYPE = "Falanga";
var AI_OWNER = 1;
var CITY_SPACING = 6;
function isLandPassable(map, q, r) {
  const hex = map.hexes[keyOf(q, r)];
  if (!hex) return false;
  const t = hex.terenBazowy;
  return t !== "morze" /* Morze */ && t !== "wybrzeze" /* Wybrzeze */ && t !== "gory" /* Gory */;
}
function resolveTypeId(token, data) {
  const direct = data.units.find((u) => u.Jednostka === token);
  return direct?.Jednostka ?? token;
}
function makeUnit(id, ownerId, typeId, data, q, r) {
  const def = data.units.find((u) => u.Jednostka === typeId);
  const ruch = def && typeof def.Ruch === "number" && def.Ruch > 0 ? def.Ruch : 2;
  return {
    id,
    ownerId,
    typeId,
    category: categoryOf(
      typeId,
      def?.["Rola (linia)"] ?? "",
      def?.["Super-jednostka"] === "TAK"
    ),
    q,
    r,
    ruch,
    ruchLeft: ruch
  };
}
function makePresetCity(id, ownerId, q, r, name, opts) {
  return {
    id,
    ownerId,
    q,
    r,
    name,
    population: opts.population,
    maMur: opts.maMur,
    magazynZywnosci: opts.magazyn,
    garnizon: opts.garnizon ?? 0,
    oblegane: false,
    podzialHandlu: { procentPieniadz: 50, procentNauka: 25, procentLuksus: 25 },
    podzialPracy: { procentBudynki: 50 }
  };
}
function pickBesideCity(map, cityQ, cityR, reserved) {
  const candidates = [
    [cityQ + 1, cityR],
    [cityQ, cityR + 1],
    [cityQ, cityR - 1],
    [cityQ - 1, cityR + 1],
    [cityQ - 1, cityR],
    [cityQ + 1, cityR - 1]
  ];
  for (const [q, r] of candidates) {
    const k = keyOf(q, r);
    if (reserved.has(k)) continue;
    if (!isLandPassable(map, q, r)) continue;
    return { q, r };
  }
  return null;
}
function findPlaytestLayout(map) {
  const cq = Math.round((map.szerokoscQ - 1) / 2);
  const cr = Math.round((map.wysokoscR - 1) / 2);
  for (let dq = -4; dq <= 4; dq++) {
    for (let dr = -4; dr <= 4; dr++) {
      const playerQ = cq + dq;
      const playerR = cr + dr;
      const romaQ = playerQ - CITY_SPACING;
      const romaR = playerR;
      const enemyRomaQ = romaQ - 1;
      const enemyRomaR = romaR;
      const enemy1Q = playerQ - 1;
      const enemy1R = playerR;
      const cityQ = playerQ + 1;
      const cityR = playerR;
      const hexes = [
        [enemyRomaQ, enemyRomaR],
        [romaQ, romaR],
        [playerQ, playerR],
        [enemy1Q, enemy1R],
        [cityQ, cityR]
      ];
      if (!hexes.every(([q, r]) => isLandPassable(map, q, r))) continue;
      const reserved = new Set(hexes.map(([q, r]) => keyOf(q, r)));
      const e2 = pickBesideCity(map, cityQ, cityR, reserved);
      if (!e2) continue;
      reserved.add(keyOf(e2.q, e2.r));
      const pSiege = pickBesideCity(map, cityQ, cityR, reserved);
      if (!pSiege) continue;
      return {
        romaQ,
        romaR,
        enemyRomaQ,
        enemyRomaR,
        enemy1Q,
        enemy1R,
        playerQ,
        playerR,
        cityQ,
        cityR,
        enemy2Q: e2.q,
        enemy2R: e2.r,
        playerSiegeQ: pSiege.q,
        playerSiegeR: pSiege.r
      };
    }
  }
  return null;
}
function buildPlaytestWalkaMapy(map, data) {
  const layout = findPlaytestLayout(map);
  if (!layout) return null;
  const playerType = resolveTypeId(PLAYER_TYPE, data);
  const playerSiegeType = resolveTypeId(PLAYER_SIEGE_TYPE, data);
  const enemyType = resolveTypeId(ENEMY_TYPE, data);
  const units = [
    makeUnit("u0", 0, playerType, data, layout.playerQ, layout.playerR),
    makeUnit("u1", AI_OWNER, enemyType, data, layout.enemy1Q, layout.enemy1R),
    makeUnit("u2", AI_OWNER, enemyType, data, layout.enemy2Q, layout.enemy2R),
    makeUnit("u3", AI_OWNER, enemyType, data, layout.enemyRomaQ, layout.enemyRomaR),
    makeUnit("u4", 0, playerSiegeType, data, layout.playerSiegeQ, layout.playerSiegeR)
  ];
  const cities = [
    makePresetCity("city0", 0, layout.romaQ, layout.romaR, "Rzym", {
      population: 3,
      maMur: true,
      magazyn: 18,
      garnizon: 0
    }),
    makePresetCity("city1", AI_OWNER, layout.cityQ, layout.cityR, "Ateny", {
      population: 3,
      maMur: true,
      magazyn: 15,
      garnizon: 1
    })
  ];
  const explored = Array.from(
    computeVisible(units.filter((u) => u.ownerId === 0), map, 8)
  );
  return {
    units,
    cities,
    explored,
    focusQ: layout.playerQ,
    focusR: layout.playerR,
    aiOwnerId: AI_OWNER,
    playerCityId: "city0",
    enemyCityId: "city1"
  };
}

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

// tools/.pt-layout-entry.ts
var d = loadGameData();
var m = generujSwiat(PLAYTEST_WALKA_SEED, rozmiarFromMenuLabel("Maly"), "kontynenty");
var p = buildPlaytestWalkaMapy(m, d);
if (!p) throw new Error("no preset");
var pl = p.units.find((u) => u.ownerId === 0);
var at = p.cities.find((c) => c.id === "city1");
var rom = p.cities.find((c) => c.id === "city0");
var result = {
  distPlayerAteny: hexDistance(pl.q, pl.r, at.q, at.r),
  autoRoma: detectAutoSiegeOnCity(rom, p.units)?.tryb,
  canSiegeAteny: canInitiateSiege(pl, at)
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  result
});
