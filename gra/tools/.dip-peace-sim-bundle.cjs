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

// tools/.dip-peace-sim-entry.ts
var dip_peace_sim_entry_exports = {};
__export(dip_peace_sim_entry_exports, {
  TypCywilizacji: () => TypCywilizacji,
  aiDiplomacyStance: () => aiDiplomacyStance,
  computeRespekt: () => computeRespekt,
  decideAIDiplomacy: () => decideAIDiplomacy,
  loadDefaultAIDiplomacyProgs: () => loadDefaultAIDiplomacyProgs,
  relationScore: () => relationScore
});
module.exports = __toCommonJS(dip_peace_sim_entry_exports);

// src/types/player.ts
var TypCywilizacji = /* @__PURE__ */ ((TypCywilizacji2) => {
  TypCywilizacji2["Grecy"] = "grecy";
  TypCywilizacji2["Rzymianie"] = "rzymianie";
  TypCywilizacji2["Chinczycy"] = "chinczycy";
  TypCywilizacji2["Inkowie"] = "inkowie";
  TypCywilizacji2["Zulusi"] = "zulusi";
  TypCywilizacji2["Egipt"] = "egipt";
  TypCywilizacji2["Babilon"] = "babilon";
  TypCywilizacji2["Sumer"] = "sumer";
  TypCywilizacji2["Celtowie"] = "celtowie";
  TypCywilizacji2["Germanie"] = "germanie";
  TypCywilizacji2["Harappa"] = "harappa";
  TypCywilizacji2["Hetyci"] = "hetyci";
  TypCywilizacji2["Slowianie"] = "slowianie";
  TypCywilizacji2["Babilonia"] = "babilonia";
  TypCywilizacji2["Asyria"] = "asyria";
  TypCywilizacji2["Fenicjanie"] = "fenicjanie";
  TypCywilizacji2["DrobnaCywilizacja"] = "drobna_cywilizacja";
  return TypCywilizacji2;
})(TypCywilizacji || {});

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
    progSojuszZaufanie: 91,
    progWymianaTechZaufanie: 70,
    progWasalizacjaRespekt: 70,
    progWchloniecieRespekt: 90,
    progMinimalnyRelacja: 30,
    progSojuszRelacja: 151,
    progUmowaMinRelacja: 151,
    startZaufanie: 20,
    startRespekt: 30,
    mnoznikZaufania: 1,
    mnoznikRespektu: 1,
    mnoznikPodarunku: 1,
    turyEfektuPodarunku: 5,
    progPoboczneAkceptacja: 60,
    progPoboczneHandel: 30,
    progPoboczneWojna: 15,
    progNapZaufanie: 40,
    progNapRelacja: 110,
    progHandelRelacja: 100,
    progSojuszPartnerRwMin: 0.4,
    progSojuszPartnerRwMax: 0.7,
    progSojuszPremiaSilniejszyMax: 0.25,
    progSojuszPremiaMilSkok: 0.08,
    progSojuszPremiaRespektSkok: 0.15,
    progSojuszSlabyProponentMilRatio: 0.5,
    progSojuszPremiaSilniejszyInny: 0.2,
    progSojuszWillingnessMin: 0.68,
    progSojuszKaraSilniejszyMax: 0.4,
    progSojuszKaraMilSkok: 0.15,
    progSojuszKaraAllySkok: 0.18,
    progSojuszHegemonMilRatio: 0.42,
    progSojuszHegemonProposerMaxMil: 2.38,
    progSojuszPremiaGracz2xMilRatio: 2,
    progSojuszPremiaGracz2xMinZaufanie: 85,
    progSojuszPremiaGracz2xBonus: 0.06,
    progSojuszPremiaGracz3xMilRatio: 2.8,
    progSojuszPremiaGracz3xMinZaufanie: 83,
    progSojuszPremiaGracz3xBonus: 0.1,
    progTrybutMinGoldPerTurn: 10,
    progTrybutZadanieMinRespekt: 70,
    progTrybutOfertaNearWarRatio: 1.2,
    progTrybutOfertaNearWarZaufanie: 30,
    progTrybutOfertaMinGold: 5,
    progTrybutOfertaBaseGold: 10,
    progTrybutOfertaEpokaGold: 5,
    progHandelWillingnessMin: 0.5,
    progHandelFairRatioMin: 0.8,
    progHandelFairRatioMax: 1.2,
    progNamowWojneZaufanie: 50,
    progNamowWojneBribeBase: 30,
    progGraniceZaufanie: 45,
    progGraniceRelacja: 100,
    progGraniceWojskoweRespekt: 55,
    karaPrzemarszNieautoryzowany_zaufanie_perTura: 5,
    progUltimatumMilitaryRatio: 1.3,
    progUltimatumMinGold: 20,
    progWasalDefaultGoldPerTurn: 10
  },
  handel_zloze: {
    _opis: "Dost\u0119p do jednego z\u0142o\u017Ca mineralnego/strategicznego (hex) \u2014 NIE hodowla (byd\u0142o/owce/lama = ulepszenia terenu, poza tym cennikiem). Cena w \xA4 lub Praca @ Rel 100.",
    dostep_scope: "jeden_hex",
    prog_relacja_min: 100,
    kurs_relacja_baza: 100,
    cena_baza: {
      glina: 50,
      sol: 50,
      konie: 100,
      wegiel: 100,
      miedz: 120,
      zelazo: 150
    }
  },
  handel_waluta: {
    _opis: "Wymiana \xA4 \u2194 Praca: otrzymujesz = p\u0142acisz \xD7 (Relacja / kurs_relacja_baza). Pr\xF3g Relacji = params.progHandelRelacja.",
    kurs_relacja_baza: 100
  },
  wartosc_katalog: {
    _opis: "Regu\u0142y PN dla handlu/dar\xF3w/przekupstwa. Warto\u015Bci liczone runtime z plik\xF3w \u017Ar\xF3d\u0142owych (diplomacy-value-catalog.ts). Maciej D3-KATALOG-PN 2026-06-30.",
    decyzja: "D3-KATALOG-PN",
    pn_zloto: {
      skala: 1,
      zrodlo: "1 PN = 1 \xA4"
    },
    pn_praca: {
      skala: 1,
      zrodlo: "1 PN = 1 Praca"
    },
    pn_tech: {
      pole: "Koszt nauki",
      zrodlo: "tech.json",
      tempo: "applyTempoKoszt"
    },
    pn_zloze: {
      zrodlo: "handel_zloze.cena_baza",
      scope: "jeden_hex"
    },
    pn_ulepszenie: {
      pole: "koszt_praca",
      zrodlo: "terrain-improvements.json",
      handel: false,
      uwaga: "Maciej 2026-06-30 \u2014 ulepsze\u0144 terenu (farma, tartak\u2026) NIE handlujemy; koszt_praca tylko do indeksu surowiec_boolean"
    },
    pn_jednostka: {
      pole: "Pieni\u0105dz (koszt)",
      zrodlo: "units.json"
    },
    pn_budynek: {
      pole: "kosztBudowy",
      skalowanie: "kosztBudowy * 1.10^(level-1)",
      zrodlo: "buildings.json",
      handel: false,
      uwaga: "Maciej 2026-06-30 \u2014 budynk\xF3w miasta (stolarnia\u2026) NIE handlujemy"
    },
    pn_budynek_skalowanie: 1.1,
    pn_surowiec_boolean: {
      regula: "min koszt_praca ulepszenia z surowiecOdblokowany",
      zrodlo: "terrain-improvements.json"
    },
    pn_zywnosc: {
      jednostki_na_pn: 1,
      zrodlo: "spichlerz miasta",
      decyzja: "D3-W6b korekta Maciej 2026-06-30 \u2014 1 PN = 1 \u017Cywno\u015B\u0107 (by\u0142o 4)"
    },
    handel_prog_relacja: 100,
    dostep_zloze_wojna: {
      utrata_w_trakcie_wojny: true,
      wymaga_renegocjacji_po_pokoju: true,
      decyzja: "D3-W10 Maciej \u2014 dost\u0119p trwa\u0142y, ale w wojnie traci wa\u017Cno\u015B\u0107; po pokoju trzeba zawrze\u0107 na nowo"
    }
  },
  pn_relacja: {
    _opis: "Przelicznik nadmiaru PN na Zaufanie. D3-PN-ZAUFANIE: 100 PN = +1 Zauf.; max +5/tur\u0119. D3-W1=A tylko nadmiar. D3-W2=C dobra wola.",
    pn_na_zaufanie: 100,
    max_zaufanie_na_ture: 5,
    min_nadmiar_pn: 1,
    prog_dar_relacja: 30,
    dobra_wola_po_wymianie: true,
    dobra_wola_tur: 3,
    dobra_wola_min_nadmiar_pn: 100,
    dobra_wola_zaufanie_per_tura: 1
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
      Opis: "Zezwolenie na swobodny ruch jednostek cywilnych lub wojskowych. Nieautoryzowany przemarsz: \u22125 Zaufanie/tura u w\u0142a\u015Bciciela (koniec tury, bez stacku jednostek).",
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
      Opis: "Respekt proponenta >70 + min 10 \xA4/tur\u0119 (\u017C\u0105danie, spok\xF3j). W wojnie: tylko oferta jednorazowych reparacji \xA4 za pok\xF3j.",
      "Dost\u0119pne: G\u0142\xF3wni rywale": "TAK",
      "Dost\u0119pne: Poboczni": "TAK",
      Koszt: "\u017B\u0105danie: \u226510 Pieni\u0119dzy/tura; Oferta: dowolna kwota",
      Efekt: "Akceptacja \u017C\u0105dania: p\u0142atno\u015Bci + +10 Respekt; Odmowa: \u221210 Relacja, casus belli. Oferta: +5 Relacja"
    },
    {
      Akcja: "9. Ultimatum / gro\u017Aba",
      Opis: "W wojnie: przewaga militarnej M \u22651,3\xD7 + reparacje \u226520 \xA4 (v1.0). Odmowa = casus belli. Wycofanie wojsk / miasto \u2014 p\xF3\u017Aniej.",
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
    },
    {
      Akcja: "13. Prezent / dar",
      Opis: "Jednostronny dar PN (\xA4, Praca, surowce, tech) bez wymiany. Wzrost Zaufania z warto\u015Bci daru (D3-G3-B). Wymaga Relacji \u2265 prog_dar_relacja.",
      "Dost\u0119pne: G\u0142\xF3wni rywale": "TAK",
      "Dost\u0119pne: Poboczni": "TAK",
      Koszt: "Warto\u015B\u0107 oddawanych zasob\xF3w (PN)",
      Efekt: "\u0394Zaufanie z sumy PN; opcjonalna dobra wola kilka tur. Nie zast\u0119puje handlu (akcja 5)."
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
      "Zdarzenie / Dzia\u0142anie": "Nieautoryzowany przemarsz (jednostka na cudzym terytorium bez traktatu)",
      Parametr: "Zaufanie",
      Zmiana: "-5",
      "Znak (+/\u2212)": "-",
      "Typ (co tur\u0119 / jednorazowo)": "co tur\u0119",
      Uwagi: "Koniec tury; raz na par\u0119 intruz\u2192w\u0142a\u015Bciciel; wyj\u0105tki: wojna, otwarte granice, prawo przemarszu, sojusz (D3-BORD)"
    },
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
      "Waga (%)": 24,
      Opis: "G\u0142\xF3wny sygna\u0142 hard power \u2014 widoczna si\u0142a militarna."
    },
    {
      Czynnik: "Wygrane bitwy (historia bojowa, skumulowana)",
      "Waga (%)": 17,
      Opis: "Kumulatywna historia zwyciestw. Sygnalizuje doswiadczenie bojowe i agresywnosc; trudno podrobi\u0107."
    },
    {
      Czynnik: "Ludno\u015B\u0107 (mieszka\u0144cy imperium, ludno\u015B\u0107 absolutna)",
      "Waga (%)": 15,
      Opis: "Wielko\u015B\u0107 populacji \u2014 potencja\u0142 gospodarczy i baza rekrutacyjna."
    },
    {
      Czynnik: "Rekruci (pula poboru / Manpower bie\u017C\u0105cy)",
      "Waga (%)": 15,
      Opis: "Gotowo\u015B\u0107 mobilizacyjna \u2014 ile wojska mo\u017Cna werbowa\u0107 teraz."
    },
    {
      Czynnik: "Liczba miast i kontrolowane terytorium",
      "Waga (%)": 12,
      Opis: "Wieksze imperium = wiecej zasobow i zdolnosci produkcyjnych."
    },
    {
      Czynnik: "Gospodarka (skarbiec/dochod)",
      "Waga (%)": 10,
      Opis: "Bogata nacja finansuje wojne i lapowki dyplomatyczne."
    },
    {
      Czynnik: "Epoka / postep technologiczny",
      "Waga (%)": 7,
      Opis: "Wyzsza epoka = lepsza technologia wojskowa (Kamien=0, Braz=0.5, Zelazo=1.0 itp.)."
    },
    {
      Czynnik: "SUMA WAG \u2192",
      "Waga (%)": 100,
      Opis: "% (dostosuj wagi \u2014 powinny sumowac sie do 100%). Militaria (armia+bitwy) = 41%."
    }
  ],
  panel_sterowania: {
    A: {
      name: "WAGI KOMPONENTOW POTEGI NACJI (hard power \u2014 podstawa Respektu)",
      records: [
        {
          "Komponent Potegi": "Wielko\u015B\u0107 armii (absolutna liczba jednostek bojowych)",
          Klucz: "wielkoscArmii",
          "Waga (%)": 24,
          Opis: "Glowny sygnal hard power \u2014 widoczna sila militarna"
        },
        {
          "Komponent Potegi": "Wygrane bitwy (historia bojowa, skumulowana)",
          Klucz: "wygraneBitwy",
          "Waga (%)": 17,
          Opis: "Kumulatywna historia zwyciestw; trudno podrobi\u0107"
        },
        {
          "Komponent Potegi": "Ludno\u015B\u0107 (mieszka\u0144cy imperium)",
          Klucz: "ludnosc",
          "Waga (%)": 15,
          Opis: "Populacja absolutna \u2014 baza gospodarcza i rekrutacyjna"
        },
        {
          "Komponent Potegi": "Rekruci (pula poboru / Manpower)",
          Klucz: "rekruci",
          "Waga (%)": 15,
          Opis: "Bie\u017C\u0105ca gotowo\u015B\u0107 werbunkowa"
        },
        {
          "Komponent Potegi": "Liczba miast i kontrolowane terytorium",
          Klucz: "miasta",
          "Waga (%)": 12,
          Opis: "Wieksze imperium = wiecej zasobow"
        },
        {
          "Komponent Potegi": "Gospodarka (skarbiec/dochod)",
          Klucz: "gospodarka",
          "Waga (%)": 10,
          Opis: "Poziom ekonomiczny; dostep do surowcow strategicznych"
        },
        {
          "Komponent Potegi": "Epoka / postep technologiczny",
          Klucz: "epoka",
          "Waga (%)": 7,
          Opis: "Wyzsza epoka = lepsza technologia wojskowa"
        },
        {
          "Komponent Potegi": "SUMA WAG \u2192",
          Klucz: "\u2014",
          "Waga (%)": null,
          Opis: "Powinna wynosic 100. Militaria (armia+bitwy) = 41%."
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
  },
  perNacja: [
    {
      Cywilizacja: "Grecy",
      sklonnoscSojusze: 6,
      lojalnosc: 7,
      progWojny: 4,
      pamietliwosc: 6,
      otwartoscHandel: 8,
      nastawienieBazowe: 59,
      uwagi: "seed CYW 2026-06-27"
    },
    {
      Cywilizacja: "Rzymianie",
      sklonnoscSojusze: 2,
      lojalnosc: 6,
      progWojny: 8,
      pamietliwosc: 7,
      otwartoscHandel: 5,
      nastawienieBazowe: 44,
      uwagi: "seed CYW 2026-06-27"
    },
    {
      Cywilizacja: "Chi\u0144czycy",
      sklonnoscSojusze: 8,
      lojalnosc: 7,
      progWojny: 2,
      pamietliwosc: 5,
      otwartoscHandel: 8,
      nastawienieBazowe: 66,
      uwagi: "seed CYW 2026-06-27"
    },
    {
      Cywilizacja: "Inkowie",
      sklonnoscSojusze: 6,
      lojalnosc: 7,
      progWojny: 4,
      pamietliwosc: 6,
      otwartoscHandel: 2,
      nastawienieBazowe: 45,
      uwagi: "seed CYW 2026-06-27"
    },
    {
      Cywilizacja: "Zulusi",
      sklonnoscSojusze: 1,
      lojalnosc: 5,
      progWojny: 9,
      pamietliwosc: 8,
      otwartoscHandel: 2,
      nastawienieBazowe: 32,
      uwagi: "seed CYW 2026-06-27"
    },
    {
      Cywilizacja: "Egipt",
      sklonnoscSojusze: 6,
      lojalnosc: 7,
      progWojny: 4,
      pamietliwosc: 5,
      otwartoscHandel: 6,
      nastawienieBazowe: 56,
      uwagi: "seed CYW 2026-06-27"
    },
    {
      Cywilizacja: "Sumerowie",
      sklonnoscSojusze: 7,
      lojalnosc: 7,
      progWojny: 3,
      pamietliwosc: 5,
      otwartoscHandel: 6,
      nastawienieBazowe: 59,
      uwagi: "seed CYW 2026-06-27"
    },
    {
      Cywilizacja: "Celtowie",
      sklonnoscSojusze: 4,
      lojalnosc: 6,
      progWojny: 6,
      pamietliwosc: 6,
      otwartoscHandel: 4,
      nastawienieBazowe: 44,
      uwagi: "seed CYW 2026-06-27"
    },
    {
      Cywilizacja: "Germanie",
      sklonnoscSojusze: 4,
      lojalnosc: 6,
      progWojny: 6,
      pamietliwosc: 7,
      otwartoscHandel: 3,
      nastawienieBazowe: 41,
      uwagi: "seed CYW 2026-06-27"
    },
    {
      Cywilizacja: "Harappa",
      sklonnoscSojusze: 7,
      lojalnosc: 6,
      progWojny: 2,
      pamietliwosc: 5,
      otwartoscHandel: 8,
      nastawienieBazowe: 58,
      uwagi: "draft roster-6"
    },
    {
      Cywilizacja: "Hetyci",
      sklonnoscSojusze: 5,
      lojalnosc: 6,
      progWojny: 5,
      pamietliwosc: 5,
      otwartoscHandel: 5,
      nastawienieBazowe: 52,
      uwagi: "draft roster-6"
    },
    {
      Cywilizacja: "S\u0142owianie",
      sklonnoscSojusze: 4,
      lojalnosc: 5,
      progWojny: 6,
      pamietliwosc: 5,
      otwartoscHandel: 4,
      nastawienieBazowe: 48,
      uwagi: "draft roster-6"
    },
    {
      Cywilizacja: "Babilonia",
      sklonnoscSojusze: 6,
      lojalnosc: 5,
      progWojny: 4,
      pamietliwosc: 5,
      otwartoscHandel: 6,
      nastawienieBazowe: 55,
      uwagi: "draft roster-6"
    },
    {
      Cywilizacja: "Asyria",
      sklonnoscSojusze: 2,
      lojalnosc: 4,
      progWojny: 9,
      pamietliwosc: 5,
      otwartoscHandel: 3,
      nastawienieBazowe: 38,
      uwagi: "draft roster-6"
    },
    {
      Cywilizacja: "Fenicjanie",
      sklonnoscSojusze: 5,
      lojalnosc: 4,
      progWojny: 3,
      pamietliwosc: 5,
      otwartoscHandel: 9,
      nastawienieBazowe: 62,
      uwagi: "draft roster-6"
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
        },
        {
          typ: "bonus_pobor_regen",
          cel: "rekruci",
          wartosc: -0.15,
          opis: "Mniejsze pa\u0144stwa-miasta: wolniejsza odnowa poboru (\u221215% regen/tur\u0119 vs standard 10%)",
          realizuje: "ekonomia"
        }
      ],
      typCywilizacji: "grecy",
      archetyp: "grecy",
      epokaWejscia: "kamien",
      epokiStartowe: [
        "kamien"
      ]
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
        },
        {
          typ: "bonus_pobor_regen",
          cel: "rekruci",
          wartosc: 0.35,
          opis: "Dyscyplina legion\xF3w: szybsza odnowa poboru (+35% regen/tur\u0119 vs standard 10%)",
          realizuje: "ekonomia"
        }
      ],
      typCywilizacji: "rzymianie",
      archetyp: "rzym",
      epokaWejscia: "kamien",
      epokiStartowe: [
        "kamien"
      ]
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
      archetyp: "chiny",
      epokaWejscia: "kamien",
      epokiStartowe: [
        "kamien"
      ]
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
      archetyp: "inkowie",
      epokaWejscia: "kamien",
      epokiStartowe: [
        "kamien"
      ]
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
      archetyp: "zulusi",
      epokaWejscia: "kamien",
      epokiStartowe: [
        "kamien"
      ]
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
      archetyp: "egipt",
      epokaWejscia: "kamien",
      epokiStartowe: [
        "kamien"
      ]
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
      ikonaId: "sumer",
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
      typCywilizacji: "sumer",
      archetyp: "sumer",
      epokaWejscia: "kamien",
      epokiStartowe: [
        "kamien"
      ]
    },
    {
      Cywilizacja: "Celtowie",
      "Styl / charakter": "agresywna piechota z broni\u0105 sieczn\u0105; brawurowa szar\u017Ca",
      "Jednostka specjalna": "Soldurii",
      "Bonus startowy": "+Atak/Morale piechoty przy szar\u017Cy (brawura); d\u0142ugie miecze \u2014 premia do Uderzenia",
      "Bonusy/minusy (do dopracowania)": "s\u0142absza dyscyplina/obrona w przeci\u0105g\u0142ej walce; brak ci\u0119\u017Ckiej formacji",
      Uwagi: "typ g\u0142\xF3wny \xA79d; jedn. spec. Soldurii (Maciej 2026-07-04); Gaesatae = elita najemna w units.json",
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
          opis: "Gaesatae: +15% Uderzenia (miecz sieczny, si\u0142a ci\u0119cia)",
          realizuje: "walka"
        },
        {
          typ: "jednostka_specjalna",
          cel: "piechota",
          wartosc: "Soldurii",
          opis: "Soldurii \u2014 elitarna gwardia wodza; przysi\u0119ga do \u015Bmierci; silna w szar\u017Cy",
          realizuje: "walka"
        }
      ],
      typCywilizacji: "celtowie",
      archetyp: "celtowie",
      epokaWejscia: "braz",
      epokiStartowe: [
        "braz"
      ]
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
      archetyp: "germanie",
      epokaWejscia: "braz",
      epokiStartowe: [
        "braz"
      ]
    },
    {
      Cywilizacja: "Harappa",
      "Styl / charakter": "Miasta-plan; handel wewn\u0119trzny; obrona mur\xF3w; niska agresja ekspansji",
      "Jednostka specjalna": "Stra\u017Cnik bram Harappy",
      "Bonus startowy": "+Handel miejski; +obrona piechoty w terytorium",
      "Bonusy/minusy (do dopracowania)": "S\u0142absza kawaleria wczesna",
      Uwagi: "roster-6 tier 1",
      Religia: "Kultura indusko-dolinna",
      nazwyKlastra: [
        "Harappa",
        "Mohenjo-daro",
        "Dholavira",
        "Rakhigarhi",
        "Ganweriwala",
        "Kalibangan",
        "Lothal",
        "Banawali",
        "Kot Diji",
        "Amri"
      ],
      mnoznikHandelPieniadz: 2.4,
      ikonaId: "harappa",
      bonusy: [
        {
          typ: "bonus_zloto",
          cel: "handel",
          wartosc: 0.15,
          opis: "Szlaki lokalne: +15% z\u0142ota z handlu w miastach",
          realizuje: "ekonomia"
        },
        {
          typ: "bonus_obrona",
          cel: "piechota",
          wartosc: 0.15,
          opis: "Obrona mur\xF3w: +15% obrony piechoty w terytorium w\u0142asnym",
          realizuje: "walka"
        },
        {
          typ: "jednostka_specjalna",
          cel: "piechota",
          wartosc: "Stra\u017Cnik bram Harappy",
          opis: "Elitarna piechota bram miasta-plan",
          realizuje: "walka"
        }
      ],
      typCywilizacji: "harappa",
      archetyp: "harappa",
      epokaWejscia: "kamien",
      epokiStartowe: [
        "kamien"
      ]
    },
    {
      Cywilizacja: "Hetyci",
      "Styl / charakter": "Charyotycy; fortyfikacje g\xF3rskie; traktaty; obrona",
      "Jednostka specjalna": "Rydwan Kapadokijski",
      "Bonus startowy": "+Rydwany; +obrona fortec",
      "Bonusy/minusy (do dopracowania)": "S\u0142abszy handel morski",
      Uwagi: "roster-6 tier 1",
      Religia: "Politeizm hetycki",
      nazwyKlastra: [
        "Hattusa",
        "Alaca H\xF6y\xFCk",
        "Kanesh",
        "Carchemish",
        "Aleppo",
        "Karkemish",
        "Sapinuwa",
        "Sarissa",
        "Ku\u015Fakl\u0131",
        "\u015Eapinuva"
      ],
      mnoznikHandelPieniadz: 2,
      ikonaId: "hetyci",
      bonusy: [
        {
          typ: "bonus_walka",
          cel: "rydwany",
          wartosc: 0.2,
          opis: "Rydwan hetycki: +20% ataku rydwan\xF3w",
          realizuje: "walka"
        },
        {
          typ: "bonus_obrona",
          cel: "piechota",
          wartosc: 0.15,
          opis: "Forteca Anatolii: +15% obrony w murach/g\xF3rach",
          realizuje: "walka"
        },
        {
          typ: "jednostka_specjalna",
          cel: "rydwany",
          wartosc: "Rydwan Kapadokijski",
          opis: "Elitarny rydwan hetycki",
          realizuje: "walka"
        }
      ],
      typCywilizacji: "hetyci",
      archetyp: "hetyci",
      epokaWejscia: "braz",
      epokiStartowe: [
        "braz"
      ]
    },
    {
      Cywilizacja: "S\u0142owianie",
      "Styl / charakter": "Osady le\u015Bne; liczna piechota; ekspansja wschodnia",
      "Jednostka specjalna": "Dru\u017Cynnik",
      "Bonus startowy": "+Piechota w lesie; +regen poboru",
      "Bonusy/minusy (do dopracowania)": "Wolniejsza nauka wczesna",
      Uwagi: "roster-6 tier 1",
      Religia: "Poga\u0144stwo s\u0142owia\u0144skie",
      nazwyKlastra: [
        "Kiev",
        "Novgorod",
        "Krak\xF3w",
        "Wolin",
        "Gniezno",
        "Pskov",
        "Suzdal",
        "Belgrade",
        "Pliska",
        "Arkona"
      ],
      mnoznikHandelPieniadz: 1.8,
      ikonaId: "slowianie",
      bonusy: [
        {
          typ: "bonus_walka",
          cel: "piechota",
          wartosc: 0.15,
          opis: "Horda le\u015Bna: +15% ataku piechoty w lesie",
          realizuje: "walka"
        },
        {
          typ: "bonus_pobor_regen",
          cel: "rekruci",
          wartosc: 0.1,
          opis: "Wsp\xF3lnota: +10% regen poboru",
          realizuje: "ekonomia"
        },
        {
          typ: "jednostka_specjalna",
          cel: "piechota",
          wartosc: "Dru\u017Cynnik",
          opis: "Elitarny wojownik dru\u017Cyny ksi\u0119cia",
          realizuje: "walka"
        }
      ],
      typCywilizacji: "slowianie",
      archetyp: "slowianie",
      epokaWejscia: "zelazo",
      epokiStartowe: [
        "zelazo"
      ]
    },
    {
      Cywilizacja: "Babilonia",
      "Styl / charakter": "Prawo, astronomia, kap\u0142ani; nauka i dyplomacja",
      "Jednostka specjalna": "Gwardia Ishtar",
      "Bonus startowy": "+Nauka; +handel rzeczny",
      "Bonusy/minusy (do dopracowania)": "Wra\u017Cliwo\u015B\u0107 na utrat\u0119 stolicy",
      Uwagi: "roster-6 tier 2",
      Religia: "Religia babilo\u0144ska (Marduk)",
      nazwyKlastra: [
        "Babilon",
        "Ur",
        "Sippar",
        "Nippur",
        "Larsa",
        "Isin",
        "Uruk",
        "Eridu",
        "Kish",
        "Akkad"
      ],
      mnoznikHandelPieniadz: 2.3,
      ikonaId: "babilonia",
      bonusy: [
        {
          typ: "bonus_nauka",
          cel: "nauka",
          wartosc: 0.15,
          opis: "Kap\u0142ani-astronomowie: +15% nauki",
          realizuje: "ekonomia"
        },
        {
          typ: "bonus_zloto",
          cel: "handel",
          wartosc: 0.1,
          opis: "Rynek Euphratu: +10% z\u0142ota",
          realizuje: "ekonomia"
        },
        {
          typ: "jednostka_specjalna",
          cel: "piechota",
          wartosc: "Gwardia Ishtar",
          opis: "Elitarna gwardia \u015Bwi\u0105tynna",
          realizuje: "walka"
        }
      ],
      typCywilizacji: "babilonia",
      archetyp: "babilonia",
      epokaWejscia: "braz",
      epokiStartowe: [
        "braz"
      ]
    },
    {
      Cywilizacja: "Asyria",
      "Styl / charakter": "Imperium obl\u0119\u017Cnicze; \u0142ucznicy; podb\xF3j",
      "Jednostka specjalna": "\u0141ucznik asyryjski",
      "Bonus startowy": "+\u0141ucznicy; +obl\u0119\u017Cenie",
      "Bonusy/minusy (do dopracowania)": "Niskie zaufanie s\u0105siad\xF3w",
      Uwagi: "roster-6 tier 2",
      Religia: "Religia asyryjska (Aszur)",
      nazwyKlastra: [
        "Ninive",
        "Assur",
        "Kalhu",
        "Dur-Sharrukin",
        "Harran",
        "Carchemish",
        "Arpad",
        "Imgur-Enlil",
        "Tushhan",
        "Nineveh"
      ],
      mnoznikHandelPieniadz: 1.7,
      ikonaId: "asyria",
      bonusy: [
        {
          typ: "bonus_walka",
          cel: "lukownicy",
          wartosc: 0.2,
          opis: "\u0141ucznicy asyryjscy: +20% ataku dystansowego",
          realizuje: "walka"
        },
        {
          typ: "bonus_walka",
          cel: "obleczenie",
          wartosc: 0.15,
          opis: "Machiny obl\u0119\u017Cnicze: +15% obl\u0119\u017Cenia",
          realizuje: "walka"
        },
        {
          typ: "jednostka_specjalna",
          cel: "lukownicy",
          wartosc: "\u0141ucznik asyryjski",
          opis: "Elitarny \u0142ucznik imperium",
          realizuje: "walka"
        }
      ],
      typCywilizacji: "asyria",
      archetyp: "asyria",
      epokaWejscia: "braz",
      epokiStartowe: [
        "braz"
      ]
    },
    {
      Cywilizacja: "Fenicjanie",
      "Styl / charakter": "Handel morski; kolonie; barter",
      "Jednostka specjalna": "Tyrski miecznik",
      "Bonus startowy": "+Handel morski; porty",
      "Bonusy/minusy (do dopracowania)": "S\u0142aba piechota elit l\u0105dowa",
      Uwagi: "roster-6 tier 2",
      Religia: "Religia fenicka (Ba'al)",
      nazwyKlastra: [
        "Tyr",
        "Sidon",
        "Byblos",
        "Carthage",
        "Utica",
        "Gadir",
        "Motya",
        "Tharros",
        "Kition",
        "Arwad"
      ],
      mnoznikHandelPieniadz: 2.6,
      ikonaId: "fenicjanie",
      bonusy: [
        {
          typ: "bonus_zloto",
          cel: "handel",
          wartosc: 0.25,
          opis: "Szlaki morskie: +25% z\u0142ota z port\xF3w",
          realizuje: "ekonomia"
        },
        {
          typ: "bonus_zloto",
          cel: "handel",
          wartosc: 0.1,
          opis: "Purpura: +10% handlu",
          realizuje: "ekonomia"
        },
        {
          typ: "jednostka_specjalna",
          cel: "piechota",
          wartosc: "Tyrski miecznik",
          opis: "Elitarny wojownik fenicki",
          realizuje: "walka"
        }
      ],
      typCywilizacji: "fenicjanie",
      archetyp: "fenicjanie",
      epokaWejscia: "braz",
      epokiStartowe: [
        "braz"
      ]
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
      Warto\u015B\u0107: "15 (Grecy, Rzymianie, Chi\u0144czycy, Inkowie, Zulusi, Egipt, Sumerowie, Celtowie, Germanie, Harappa, Hetyci, S\u0142owianie, Babilonia, Asyria, Fenicjanie)",
      Uwagi: "pula 15 typ\xF3w (D-ROSTER-Q3); na mapie cap z rozmiaru; Celtowie = Soldurii + Gaesatae (2026-07-04)"
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

// data/civ-ai.json
var civ_ai_default = {
  cywilizacje: [
    {
      Cywilizacja: "Grecy",
      agresywnosc: 4,
      ekspansywnosc: 0,
      priorytetMilitarny: 5,
      priorytetEkonomia: 5,
      priorytetNauka: 6,
      tolerancjaRyzyka: 4,
      sklonnoscDoPodboju: 2,
      profilMapy: "kopia_typu_obronna",
      uwagi: "seed CYW 2026-06-27; handel=0.75"
    },
    {
      Cywilizacja: "Rzymianie",
      agresywnosc: 8,
      ekspansywnosc: 0,
      priorytetMilitarny: 6,
      priorytetEkonomia: 5,
      priorytetNauka: 5,
      tolerancjaRyzyka: 8,
      sklonnoscDoPodboju: 4,
      profilMapy: "kopia_typu_obronna",
      uwagi: "seed CYW 2026-06-27; handel=0.5"
    },
    {
      Cywilizacja: "Chi\u0144czycy",
      agresywnosc: 2,
      ekspansywnosc: 0,
      priorytetMilitarny: 4,
      priorytetEkonomia: 6,
      priorytetNauka: 6,
      tolerancjaRyzyka: 2,
      sklonnoscDoPodboju: 1,
      profilMapy: "kopia_typu_obronna",
      uwagi: "seed CYW 2026-06-27; handel=0.85"
    },
    {
      Cywilizacja: "Inkowie",
      agresywnosc: 4,
      ekspansywnosc: 0,
      priorytetMilitarny: 5,
      priorytetEkonomia: 5,
      priorytetNauka: 5,
      tolerancjaRyzyka: 4,
      sklonnoscDoPodboju: 3,
      profilMapy: "kopia_typu_obronna",
      uwagi: "seed CYW 2026-06-27; handel=0.25"
    },
    {
      Cywilizacja: "Zulusi",
      agresywnosc: 9,
      ekspansywnosc: 0,
      priorytetMilitarny: 8,
      priorytetEkonomia: 4,
      priorytetNauka: 4,
      tolerancjaRyzyka: 9,
      sklonnoscDoPodboju: 5,
      profilMapy: "kopia_typu_obronna",
      uwagi: "seed CYW 2026-06-27; handel=0.2"
    },
    {
      Cywilizacja: "Egipt",
      agresywnosc: 4,
      ekspansywnosc: 0,
      priorytetMilitarny: 5,
      priorytetEkonomia: 6,
      priorytetNauka: 5,
      tolerancjaRyzyka: 4,
      sklonnoscDoPodboju: 2,
      profilMapy: "kopia_typu_obronna",
      uwagi: "seed CYW 2026-06-27; handel=0.6"
    },
    {
      Cywilizacja: "Sumerowie",
      agresywnosc: 3,
      ekspansywnosc: 0,
      priorytetMilitarny: 4,
      priorytetEkonomia: 5,
      priorytetNauka: 8,
      tolerancjaRyzyka: 3,
      sklonnoscDoPodboju: 2,
      profilMapy: "kopia_typu_obronna",
      uwagi: "seed CYW 2026-06-27; handel=0.65"
    },
    {
      Cywilizacja: "Celtowie",
      agresywnosc: 6,
      ekspansywnosc: 0,
      priorytetMilitarny: 8,
      priorytetEkonomia: 5,
      priorytetNauka: 4,
      tolerancjaRyzyka: 6,
      sklonnoscDoPodboju: 4,
      profilMapy: "kopia_typu_obronna",
      uwagi: "seed CYW 2026-06-27; handel=0.35"
    },
    {
      Cywilizacja: "Germanie",
      agresywnosc: 6,
      ekspansywnosc: 0,
      priorytetMilitarny: 8,
      priorytetEkonomia: 4,
      priorytetNauka: 4,
      tolerancjaRyzyka: 6,
      sklonnoscDoPodboju: 4,
      profilMapy: "kopia_typu_obronna",
      uwagi: "seed CYW 2026-06-27; handel=0.3"
    },
    {
      Cywilizacja: "Harappa",
      agresywnosc: 2,
      ekspansywnosc: 0,
      priorytetMilitarny: 4,
      priorytetEkonomia: 7,
      priorytetNauka: 5,
      tolerancjaRyzyka: 4,
      sklonnoscDoPodboju: 2,
      profilMapy: "kopia_typu_obronna",
      uwagi: "draft roster-6"
    },
    {
      Cywilizacja: "Hetyci",
      agresywnosc: 5,
      ekspansywnosc: 0,
      priorytetMilitarny: 6,
      priorytetEkonomia: 5,
      priorytetNauka: 4,
      tolerancjaRyzyka: 4,
      sklonnoscDoPodboju: 2,
      profilMapy: "kopia_typu_obronna",
      uwagi: "draft roster-6"
    },
    {
      Cywilizacja: "S\u0142owianie",
      agresywnosc: 6,
      ekspansywnosc: 0,
      priorytetMilitarny: 6,
      priorytetEkonomia: 5,
      priorytetNauka: 5,
      tolerancjaRyzyka: 4,
      sklonnoscDoPodboju: 3,
      profilMapy: "kopia_typu_obronna",
      uwagi: "draft roster-6"
    },
    {
      Cywilizacja: "Babilonia",
      agresywnosc: 4,
      ekspansywnosc: 0,
      priorytetMilitarny: 5,
      priorytetEkonomia: 5,
      priorytetNauka: 5,
      tolerancjaRyzyka: 4,
      sklonnoscDoPodboju: 2,
      profilMapy: "kopia_typu_obronna",
      uwagi: "draft roster-6"
    },
    {
      Cywilizacja: "Asyria",
      agresywnosc: 8,
      ekspansywnosc: 0,
      priorytetMilitarny: 8,
      priorytetEkonomia: 5,
      priorytetNauka: 5,
      tolerancjaRyzyka: 4,
      sklonnoscDoPodboju: 5,
      profilMapy: "kopia_typu_obronna",
      uwagi: "draft roster-6"
    },
    {
      Cywilizacja: "Fenicjanie",
      agresywnosc: 3,
      ekspansywnosc: 0,
      priorytetMilitarny: 5,
      priorytetEkonomia: 8,
      priorytetNauka: 5,
      tolerancjaRyzyka: 3,
      sklonnoscDoPodboju: 2,
      profilMapy: "kopia_typu_obronna",
      uwagi: "draft roster-6"
    }
  ],
  _meta: {
    zrodlo: "Panel-D.xlsx/AI-per-nacja"
  }
};

// src/game/civ-ai-data.ts
function civAiAggressionNorm(data, civName) {
  const row = data.civAi?.cywilizacje?.find((c) => c.Cywilizacja === civName);
  if (!row || row.agresywnosc == null) return void 0;
  return Math.max(0, Math.min(1, row.agresywnosc / 10));
}
function civExcelNameFromTyp(typ) {
  if (typ === "drobna_cywilizacja" /* DrobnaCywilizacja */) return void 0;
  const row = civs_default.cywilizacje.find((c) => c.ikonaId === typ);
  return row?.Cywilizacja;
}
function diplomacyPerNacjaRow(civName) {
  const rows = diplomacy_default.perNacja;
  return rows?.find((r) => r.Cywilizacja === civName);
}
function diplomacyPerNacjaForTyp(typ) {
  const name = civExcelNameFromTyp(typ);
  return name ? diplomacyPerNacjaRow(name) : void 0;
}
function resolveArchetypeAggression(typ, fallback, data) {
  const civName = civExcelNameFromTyp(typ);
  if (!civName) return fallback;
  const fromData = data ? civAiAggressionNorm(data, civName) : (() => {
    const row = civ_ai_default.cywilizacje?.find((c) => c.Cywilizacja === civName);
    if (!row || row.agresywnosc == null) return void 0;
    return Math.max(0, Math.min(1, row.agresywnosc / 10));
  })();
  return fromData ?? fallback;
}
function resolveArchetypeTrade(typ, fallback) {
  const row = diplomacyPerNacjaForTyp(typ);
  if (row?.otwartoscHandel != null) {
    return Math.max(0, Math.min(1, row.otwartoscHandel / 10));
  }
  return fallback;
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
  /** "Aktywny handel (trwa umowa handlowa)" (+1/ture) */
  handel_zaufanie_perTura: 1,
  /** "Dotrzymany pakt (NAP lub sojusz trwa)" (+1/ture) */
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
  /** Relacja >= wartość wymagana do NAP (Maciej 2026-06-30: 110, bez innych progów) */
  progNapRelacja: 110,
  /** Relacja >= wartość wymagana do handlu ¤/Praca/złoża (Maciej 2026-06-30: 100) */
  progHandelRelacja: 100,
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
  /** Respekt min dla prawa wojskowego przemarszu */
  progGraniceWojskoweRespekt: 55,
  /** militaryRatio min dla ultimatum */
  progUltimatumMilitaryRatio: 1.3,
  /** Jednorazowe złoto min przy ultimatum */
  progUltimatumMinGold: 20,
  /** Domyślny trybut wasala (¤/turę) */
  progWasalDefaultGoldPerTurn: 10
};
function loadDiplomacyParams(json) {
  const out = {};
  if (!json || typeof json !== "object") return out;
  const params = json.params;
  if (!params || typeof params !== "object") return out;
  const src = params;
  for (const key of Object.keys(DIPLOMACY_PARAMS)) {
    const v = src[key];
    if (typeof v === "number" && Number.isFinite(v)) {
      out[key] = v;
    }
  }
  return out;
}
var _effectiveDiplomacyParams = null;
function getEffectiveDiplomacyParams() {
  if (!_effectiveDiplomacyParams) {
    _effectiveDiplomacyParams = {
      ...DIPLOMACY_PARAMS,
      ...loadDiplomacyParams(diplomacy_default)
    };
  }
  return _effectiveDiplomacyParams;
}
function diplomacyTreatyMinRelacja(adjustedThreshold, params = getEffectiveDiplomacyParams()) {
  return Math.max(params.progUmowaMinRelacja, adjustedThreshold);
}
function diplomacyProposerStrengthEase(proposerMilRatio, proposerRespekt, responderRespekt, params = getEffectiveDiplomacyParams()) {
  const milAdv = Math.max(0, proposerMilRatio - 1);
  const resAdv = Math.max(0, proposerRespekt - responderRespekt) / 100;
  let raw = milAdv * params.progSojuszPremiaMilSkok + resAdv * params.progSojuszPremiaRespektSkok;
  if (proposerMilRatio >= params.progSojuszPremiaGracz3xMilRatio) {
    raw += params.progSojuszPremiaGracz3xBonus;
  } else if (proposerMilRatio >= params.progSojuszPremiaGracz2xMilRatio) {
    raw += params.progSojuszPremiaGracz2xBonus;
  }
  const capped = Math.min(params.progSojuszPremiaSilniejszyMax, raw);
  return {
    allyThresholdDelta: capped,
    zaufanieThresholdDelta: Math.round(capped * 80),
    scoreThresholdDelta: Math.round(capped * 100)
  };
}
function diplomacyAllianceMinZaufanie(adj, proposerMilRatio, params = getEffectiveDiplomacyParams()) {
  let minZ = Math.max(
    0,
    params.progSojuszZaufanie - adj.ease.zaufanieThresholdDelta + adj.penaltyZ
  );
  if (proposerMilRatio >= params.progSojuszPremiaGracz3xMilRatio) {
    minZ = Math.max(params.progSojuszPremiaGracz3xMinZaufanie, minZ);
  } else if (proposerMilRatio >= params.progSojuszPremiaGracz2xMilRatio) {
    minZ = Math.max(params.progSojuszPremiaGracz2xMinZaufanie, minZ);
  }
  return minZ;
}
function diplomacyAllianceStrengthAdjust(proposerMilRatio, proposerRespekt, responderRespekt, params = getEffectiveDiplomacyParams()) {
  const ease = diplomacyProposerStrengthEase(
    proposerMilRatio,
    proposerRespekt,
    responderRespekt,
    params
  );
  const safeMil = Math.max(0.01, proposerMilRatio);
  const responderAdv = safeMil < 1 ? 1 / safeMil - 1 : 0;
  const rawPenalty = responderAdv * params.progSojuszKaraMilSkok;
  const cappedPenalty = Math.min(params.progSojuszKaraSilniejszyMax, rawPenalty);
  return {
    ease,
    penaltyZ: Math.round(cappedPenalty * 95),
    penaltyScore: Math.round(cappedPenalty * 110),
    penaltyAlly: cappedPenalty * 0.55,
    allyWPenalty: responderAdv * params.progSojuszKaraAllySkok,
    hegemonBlocksAlliance: safeMil <= params.progSojuszHegemonMilRatio,
    hegemonProposerNoAlliance: safeMil >= params.progSojuszHegemonProposerMaxMil
  };
}
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
function relationScore(rel) {
  return clamp(
    rel.zaufanie * DIPLOMACY_PARAMS.mnoznikZaufania + rel.respekt * DIPLOMACY_PARAMS.mnoznikRespektu,
    0,
    200
  );
}
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
function aiDiplomacyStance(aiPlayer, otherPlayer, rel, context) {
  const score = relationScore(rel);
  const { zaufanie, respekt } = rel;
  const p = getEffectiveDiplomacyParams();
  if (!aiPlayer?.typCywilizacji || !otherPlayer?.typCywilizacji) {
    return {
      willingnessWar: 0,
      willingnessPeace: 0.5,
      willingnessTrade: 0.3,
      willingnessAlly: 0
    };
  }
  if (context.isMinorCiv || aiPlayer.typCywilizacji === "drobna_cywilizacja" /* DrobnaCywilizacja */) {
    const fearFactor = respekt > p.progPoboczneAkceptacja ? 0.9 : respekt / p.progPoboczneAkceptacja;
    const tradeOpen = score > p.progPoboczneHandel ? 0.6 : 0.2;
    const warWilling = score < p.progPoboczneWojna ? 0.2 : 0.05;
    return {
      willingnessWar: warWilling,
      willingnessPeace: fearFactor,
      willingnessTrade: tradeOpen,
      willingnessAlly: 0
      // minor civs cannot form military alliances (paragraph 2 table)
    };
  }
  const archAggression = resolveArchetypeAggression(
    aiPlayer.typCywilizacji,
    ARCHETYPE_AGGRESSION[aiPlayer.typCywilizacji] ?? 0.4
  );
  const archTrade = resolveArchetypeTrade(
    aiPlayer.typCywilizacji,
    ARCHETYPE_TRADE[aiPlayer.typCywilizacji] ?? 0.5
  );
  let warW = 0;
  if (rel.status !== "wojna") {
    const respektNorm = respekt / 100;
    const relPenalty = 1 - clamp(score / 200, 0, 1);
    warW = clamp(
      archAggression * 0.5 + respektNorm * 0.3 + relPenalty * 0.2,
      0,
      1
    );
  }
  let peaceW;
  if (rel.status === "wojna") {
    const warWeariness = clamp(context.turnsAtWar / 20, 0, 0.5);
    const militaryPressure = context.militaryRatio < 1 ? (1 - context.militaryRatio) * 0.4 : 0;
    const goodwill = zaufanie / 100 * 0.2;
    peaceW = clamp(warWeariness + militaryPressure + goodwill, 0, 1);
  } else {
    peaceW = 0.8;
  }
  let tradeW = 0;
  if (score >= p.progMinimalnyRelacja) {
    const relFactor = clamp(score / 200, 0, 1) * 0.4;
    tradeW = clamp(archTrade * 0.6 + relFactor, 0, 1);
  }
  const aiMilOverOther = Math.max(0.01, context.militaryRatio);
  const otherMilOverAi = aiMilOverOther > 0 ? 1 / aiMilOverOther : 99;
  const aiRespektShare = respekt;
  const otherRespektShare = Math.max(0, 100 - respekt);
  const adj = diplomacyAllianceStrengthAdjust(
    otherMilOverAi,
    otherRespektShare,
    aiRespektShare,
    p
  );
  let minAllyZ = diplomacyAllianceMinZaufanie(adj, otherMilOverAi, p);
  let minAllyScore = diplomacyTreatyMinRelacja(
    p.progSojuszRelacja - adj.ease.scoreThresholdDelta + adj.penaltyScore,
    p
  );
  let allyW = 0;
  if (!adj.hegemonBlocksAlliance && zaufanie >= minAllyZ && score >= minAllyScore) {
    const loyaltyBonus = aiPlayer.typCywilizacji === "chinczycy" /* Chinczycy */ ? 0.2 : aiPlayer.typCywilizacji === "inkowie" /* Inkowie */ ? 0.15 : aiPlayer.typCywilizacji === "grecy" /* Grecy */ ? 0.1 : aiPlayer.typCywilizacji === "zulusi" /* Zulusi */ ? -0.2 : 0;
    const trustFactor = zaufanie / 100 * 0.6;
    const scoreFactor = clamp((score - p.progSojuszRelacja) / 80, 0, 0.3);
    allyW = clamp(trustFactor + loyaltyBonus + scoreFactor, 0, 1);
    if (aiMilOverOther < 1) {
      allyW = clamp(
        allyW + (1 - aiMilOverOther) * p.progSojuszPremiaSilniejszyInny,
        0,
        1
      );
    } else if (aiMilOverOther > 1) {
      allyW = clamp(allyW - adj.allyWPenalty, 0, 1);
    }
  }
  return {
    willingnessWar: parseFloat(warW.toFixed(4)),
    willingnessPeace: parseFloat(peaceW.toFixed(4)),
    willingnessTrade: parseFloat(tradeW.toFixed(4)),
    willingnessAlly: parseFloat(allyW.toFixed(4))
  };
}
function computeRespekt(potegaSelf, potegaPartner) {
  const sum = potegaSelf + potegaPartner;
  if (sum === 0) return 50;
  return clamp(Math.round(100 * potegaSelf / sum), 0, 100);
}

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
  ai_diplomacja_prog_wojna_sila: {
    wartosc: 0.6,
    sekcja: "\xA76 Dyplomacja AI",
    opis: "Min. respektWzgledny (0\u20131) do wypowiedzenia wojny przez AI."
  },
  ai_diplomacja_prog_wojna_agresja: {
    wartosc: 0.5,
    sekcja: "\xA76 Dyplomacja AI",
    opis: "Min. agresja archetypu (\xD7 mno\u017Cnik trudno\u015Bci) do wypowiedzenia wojny."
  },
  ai_diplomacja_prog_trybut: {
    wartosc: 0.7,
    sekcja: "\xA76 Dyplomacja AI",
    opis: "Min. respektWzgledny do \u017C\u0105dania trybutu zamiast wojny."
  },
  ai_diplomacja_prog_pokoj_slabosc: {
    wartosc: 0.4,
    sekcja: "\xA76 Dyplomacja AI",
    opis: "Max respektWzgledny w wojnie \u2014 AI proponuje pok\xF3j gdy s\u0142absze."
  },
  ai_diplomacja_prog_sojusz: {
    wartosc: 0.6,
    sekcja: "\xA76 Dyplomacja AI",
    opis: "Min. willingnessAlly do propozycji sojuszu."
  },
  ai_diplomacja_prog_handel: {
    wartosc: 0.5,
    sekcja: "\xA76 Dyplomacja AI",
    opis: "Min. willingnessTrade do propozycji handlu."
  },
  ai_diplomacja_prog_trybut_krytyczny: {
    wartosc: 0.25,
    sekcja: "\xA76 Dyplomacja AI",
    opis: "Max respektWzgledny w wojnie \u2014 AI oferuje trybut za pok\xF3j (krytyczna s\u0142abo\u015B\u0107)."
  },
  ai_diplomacja_prog_trybut_agresja_max: {
    wartosc: 0.75,
    sekcja: "\xA76 Dyplomacja AI",
    opis: "Max agresja (eff) przy kt\xF3rej AI woli trybut ni\u017C wojn\u0119."
  },
  ai_diplomacja_prog_handel_archetyp_min: {
    wartosc: 0.4,
    sekcja: "\xA76 Dyplomacja AI",
    opis: "Min. handlowo\u015B\u0107 archetypu do propozycji handlu przez AI."
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
  },
  archetype_harappa_wojsko_priorytet: {
    wartosc: -1,
    sekcja: "\xA78 Archetypy",
    opis: "Harappa: \u22121 priorytet wojsko \u2014 cywilizacja obronna i handlowa, niska agresja ekspansji."
  },
  archetype_harappa_nauka_priorytet: {
    wartosc: 0,
    sekcja: "\xA78 Archetypy",
    opis: "Harappa: delta priorytetu nauka (plan miejski, nie priorytet bibliotek)."
  },
  archetype_harappa_ekonomia_priorytet: {
    wartosc: 2,
    sekcja: "\xA78 Archetypy",
    opis: "Harappa: +2 priorytet ekonomia \u2014 szlaki lokalne i handel wewn\u0119trzny."
  },
  archetype_harappa_obrona_priorytet: {
    wartosc: 2,
    sekcja: "\xA78 Archetypy",
    opis: "Harappa: +2 priorytet obrona \u2014 mury i fortyfikacje miejskie."
  },
  archetype_hetyci_wojsko_priorytet: {
    wartosc: 1,
    sekcja: "\xA78 Archetypy",
    opis: "Hetyci: +1 priorytet wojsko \u2014 rydwany i elita bojowa."
  },
  archetype_hetyci_nauka_priorytet: {
    wartosc: 2,
    sekcja: "\xA78 Archetypy",
    opis: "Hetyci: +2 priorytet nauka \u2014 biblioteki, pismo klinowe; nauka na poziomie epoki."
  },
  archetype_hetyci_ekonomia_priorytet: {
    wartosc: 0,
    sekcja: "\xA78 Archetypy",
    opis: "Hetyci: delta priorytetu ekonomia."
  },
  archetype_hetyci_obrona_priorytet: {
    wartosc: 2,
    sekcja: "\xA78 Archetypy",
    opis: "Hetyci: +2 priorytet obrona \u2014 fortyfikacje g\xF3rskie i traktaty obronne."
  },
  archetype_slowianie_wojsko_priorytet: {
    wartosc: 2,
    sekcja: "\xA78 Archetypy",
    opis: "S\u0142owianie: +2 priorytet wojsko \u2014 liczna piechota le\u015Bna."
  },
  archetype_slowianie_nauka_priorytet: {
    wartosc: -1,
    sekcja: "\xA78 Archetypy",
    opis: "S\u0142owianie: \u22121 priorytet nauka (wsp\xF3lnota plemienna przed nauk\u0105)."
  },
  archetype_slowianie_ekonomia_priorytet: {
    wartosc: 0,
    sekcja: "\xA78 Archetypy",
    opis: "S\u0142owianie: delta priorytetu ekonomia."
  },
  archetype_slowianie_obrona_priorytet: {
    wartosc: 1,
    sekcja: "\xA78 Archetypy",
    opis: "S\u0142owianie: +1 priorytet obrona \u2014 osady le\u015Bne i warowne grody."
  },
  archetype_babilonia_wojsko_priorytet: {
    wartosc: -1,
    sekcja: "\xA78 Archetypy",
    opis: "Babilonia: \u22121 priorytet wojsko \u2014 prawo, kap\u0142ani i nauka przed armi\u0105 (nie minus na nauk\u0119)."
  },
  archetype_babilonia_nauka_priorytet: {
    wartosc: 2,
    sekcja: "\xA78 Archetypy",
    opis: "Babilonia: +2 priorytet nauka \u2014 astronomia, kap\u0142ani-uczeni, kodeks prawny."
  },
  archetype_babilonia_ekonomia_priorytet: {
    wartosc: 1,
    sekcja: "\xA78 Archetypy",
    opis: "Babilonia: +1 priorytet ekonomia \u2014 rynek Eufratu i handel."
  },
  archetype_babilonia_obrona_priorytet: {
    wartosc: 0,
    sekcja: "\xA78 Archetypy",
    opis: "Babilonia: delta priorytetu obrona."
  },
  archetype_asyria_wojsko_priorytet: {
    wartosc: 2,
    sekcja: "\xA78 Archetypy",
    opis: "Asyria: +2 priorytet wojsko \u2014 imperium obl\u0119\u017Cnicze, armia zawsze #1."
  },
  archetype_asyria_nauka_priorytet: {
    wartosc: -1,
    sekcja: "\xA78 Archetypy",
    opis: "Asyria: \u22121 priorytet nauka."
  },
  archetype_asyria_ekonomia_priorytet: {
    wartosc: -1,
    sekcja: "\xA78 Archetypy",
    opis: "Asyria: \u22121 priorytet ekonomia (wojna przed handlem)."
  },
  archetype_asyria_obrona_priorytet: {
    wartosc: 0,
    sekcja: "\xA78 Archetypy",
    opis: "Asyria: delta priorytetu obrona."
  },
  archetype_fenicjanie_wojsko_priorytet: {
    wartosc: -2,
    sekcja: "\xA78 Archetypy",
    opis: "Fenicjanie: \u22122 priorytet wojsko \u2014 unikanie totalnej wojny l\u0105dowej."
  },
  archetype_fenicjanie_nauka_priorytet: {
    wartosc: 0,
    sekcja: "\xA78 Archetypy",
    opis: "Fenicjanie: delta priorytetu nauka."
  },
  archetype_fenicjanie_ekonomia_priorytet: {
    wartosc: 2,
    sekcja: "\xA78 Archetypy",
    opis: "Fenicjanie: +2 priorytet ekonomia \u2014 handel morski i kolonie."
  },
  archetype_fenicjanie_obrona_priorytet: {
    wartosc: 0,
    sekcja: "\xA78 Archetypy",
    opis: "Fenicjanie: delta priorytetu obrona."
  }
};

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

// src/game/cities.ts
var MIN_CITY_DISTANCE = miasto_params_default.min_dystans_miast?.wartosc ?? 5;

// src/game/ai.ts
var PROG_WOJNA_SILA = 0.6;
var PROG_WOJNA_AGRESJA = 0.5;
var PROG_TRYBUT = 0.7;
var PROG_POKOJ_SLABOSC = 0.4;
var PROG_SOJUSZ = 0.6;
var PROG_HANDEL = 0.5;
function staticAiParam(key, fallback) {
  const entry = ai_params_default[key];
  const v = entry?.wartosc;
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}
function loadDefaultAIDiplomacyProgs() {
  const dip = getEffectiveDiplomacyParams();
  return {
    progWojnaSila: staticAiParam("ai_diplomacja_prog_wojna_sila", PROG_WOJNA_SILA),
    progWojnaAgresja: staticAiParam("ai_diplomacja_prog_wojna_agresja", PROG_WOJNA_AGRESJA),
    progTrybut: staticAiParam("ai_diplomacja_prog_trybut", PROG_TRYBUT),
    progPokojSlabosc: staticAiParam("ai_diplomacja_prog_pokoj_slabosc", PROG_POKOJ_SLABOSC),
    progSojusz: staticAiParam("ai_diplomacja_prog_sojusz", PROG_SOJUSZ),
    progHandel: staticAiParam("ai_diplomacja_prog_handel", PROG_HANDEL),
    progTrybutKrytyczny: staticAiParam("ai_diplomacja_prog_trybut_krytyczny", 0.25),
    progTrybutAgresjaMax: staticAiParam("ai_diplomacja_prog_trybut_agresja_max", 0.75),
    progHandelArchetypeMin: staticAiParam("ai_diplomacja_prog_handel_archetyp_min", 0.4),
    progHandelRelacjaMin: dip.progHandelRelacja
  };
}
function decideAIDiplomacy(inp, params, agresjaMnoznik = 1) {
  if (!inp?.relacje?.length) return [];
  const p = {
    ...loadDefaultAIDiplomacyProgs(),
    ...params
  };
  const komendy = [];
  for (const rel of inp.relacje) {
    const rw = rel.respektWzgledny;
    const militaryRatio = rw >= 1 ? 99 : rw <= 0 ? 0.01 : rw / (1 - rw);
    const ctx = {
      isMinorCiv: false,
      // decyzja o minor civ leży po stronie silnika; tu zakładamy główną cyw.
      militaryRatio,
      currentTurn: 0,
      // nie wpływa na logikę v0.1
      turnsAtWar: rel.stanWojny ? 5 : 0
      // heurystyka – wystarczy do oceny peaceW
    };
    const stubAIPlayer = { typCywilizacji: "grecy" };
    const stubOtherPlayer = { typCywilizacji: "rzym" };
    const stance = aiDiplomacyStance(stubAIPlayer, stubOtherPlayer, rel.relation, ctx);
    const score = relationScore(rel.relation);
    const { progMinimalnyRelacja } = getEffectiveDiplomacyParams();
    const effAgresja = Math.min(1, inp.agresja * agresjaMnoznik);
    if (rel.stanWojny && rw <= p.progTrybutKrytyczny) {
      komendy.push({
        type: "oferuj_trybut_za_pokoj",
        targetId: rel.partnerId,
        powod: `krytyczna slabosz w wojnie (respektWzgledny=${rw.toFixed(2)}): oferujemy trybut za pokoj`
      });
      continue;
    }
    if (rel.stanWojny && rw <= p.progPokojSlabosc) {
      komendy.push({
        type: "zaproponuj_pokoj",
        targetId: rel.partnerId,
        powod: `slabszy w wojnie (respektWzgledny=${rw.toFixed(2)} <= prog=${p.progPokojSlabosc}): proponujemy pokoj`
      });
      continue;
    }
    const dipTrybut = getEffectiveDiplomacyParams();
    const proposerRespektPct = Math.round(100 * rw);
    if (!rel.stanWojny && proposerRespektPct > dipTrybut.progTrybutZadanieMinRespekt && effAgresja >= p.progWojnaAgresja * 0.5 && effAgresja < p.progTrybutAgresjaMax) {
      komendy.push({
        type: "zadaj_trybut",
        targetId: rel.partnerId,
        powod: `Respekt ${proposerRespektPct} > ${dipTrybut.progTrybutZadanieMinRespekt}, srednia agresja (effAgresja=${effAgresja.toFixed(2)} < 0.75): zadamy trybut zamiast wojny`
      });
      continue;
    }
    if (!rel.stanWojny && stance.willingnessWar > 0 && rw >= p.progWojnaSila && effAgresja >= p.progWojnaAgresja && score < progMinimalnyRelacja) {
      komendy.push({
        type: "wypowiedz_wojne",
        targetId: rel.partnerId,
        powod: `wrogie nastawienie (score=${score}, willingnessWar=${stance.willingnessWar.toFixed(2)}), wystarczajaca przewaga (rw=${rw.toFixed(2)}) i effAgresja (${effAgresja.toFixed(2)}): wypowiadamy wojne`
      });
      continue;
    }
    const dipP = getEffectiveDiplomacyParams();
    const aiMilRatio = rw >= 1 ? 99 : rw <= 0 ? 0.01 : rw / (1 - rw);
    const aiRespekt = Math.round(rw * 100);
    const partnerRespekt = Math.round((1 - rw) * 100);
    const sojuszAdj = diplomacyAllianceStrengthAdjust(
      aiMilRatio,
      aiRespekt,
      partnerRespekt,
      dipP
    );
    const minSojuszAlly = p.progSojusz - sojuszAdj.ease.allyThresholdDelta + sojuszAdj.penaltyAlly;
    const minSojuszScore = diplomacyTreatyMinRelacja(
      dipP.progSojuszRelacja - sojuszAdj.ease.scoreThresholdDelta + sojuszAdj.penaltyScore,
      dipP
    );
    if (!rel.stanWojny && !sojuszAdj.hegemonProposerNoAlliance && stance.willingnessAlly >= minSojuszAlly && score >= minSojuszScore && rel.relation.zaufanie >= diplomacyAllianceMinZaufanie(sojuszAdj, aiMilRatio, dipP)) {
      komendy.push({
        type: "zaproponuj_sojusz",
        targetId: rel.partnerId,
        powod: `willingnessAlly=${stance.willingnessAlly.toFixed(2)} >= prog=${minSojuszAlly.toFixed(2)} (rw=${rw.toFixed(2)}): proponujemy sojusz`
      });
      continue;
    }
    const handlowosc = inp.handlowosc ?? p.progHandelArchetypeMin;
    if (!rel.stanWojny && stance.willingnessTrade >= p.progHandel && handlowosc >= p.progHandelArchetypeMin && score > p.progHandelRelacjaMin) {
      komendy.push({
        type: "zaproponuj_handel",
        targetId: rel.partnerId,
        powod: `willingnessTrade=${stance.willingnessTrade.toFixed(2)} >= prog=${p.progHandel}, handlowosc=${handlowosc.toFixed(2)} >= 0.4: proponujemy handel`
      });
      continue;
    }
  }
  return komendy;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TypCywilizacji,
  aiDiplomacyStance,
  computeRespekt,
  decideAIDiplomacy,
  loadDefaultAIDiplomacyProgs,
  relationScore
});
