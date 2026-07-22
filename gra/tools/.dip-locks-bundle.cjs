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

// tools/.dip-locks-entry.ts
var dip_locks_entry_exports = {};
__export(dip_locks_entry_exports, {
  DIPLOMACY_PARAMS: () => DIPLOMACY_PARAMS,
  DIPLO_FACTOR_LABELS_PL: () => DIPLO_FACTOR_LABELS_PL,
  appendDiploFactor: () => appendDiploFactor,
  buildRelationBreakdown: () => buildRelationBreakdown,
  formatLockedNote: () => formatLockedNote,
  getEffectiveDiplomacyParams: () => getEffectiveDiplomacyParams,
  resolveDiplomacyActionLock: () => resolveDiplomacyActionLock
});
module.exports = __toCommonJS(dip_locks_entry_exports);

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
    sojusz_zaufanie_perTura: 3,
    nap_zaufanie_perTura: 2,
    pokoj_zaufanie_perTura: 1,
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
    progNapRelacja: 50,
    progHandelRelacja: 40,
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
    handel_prog_relacja: 40,
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
var _baseDiplomacyParams = null;
var DIPLOMACY_DIFFICULTY_DELTA = {
  easy: -10,
  normal: 0,
  hard: 10
};
var DIPLO_RELATION_THRESHOLD_KEYS = [
  "progMinimalnyRelacja",
  "progSojuszRelacja",
  "progUmowaMinRelacja",
  "progNapRelacja",
  "progHandelRelacja",
  "progGraniceRelacja",
  "progPoboczneHandel",
  "progPoboczneWojna"
];
var DIPLO_ZAUFANIE_THRESHOLD_KEYS = [
  "progSojuszZaufanie",
  "progWymianaTechZaufanie",
  "progNapZaufanie",
  "progNamowWojneZaufanie",
  "progGraniceZaufanie",
  "progTrybutOfertaNearWarZaufanie",
  "progSojuszPremiaGracz2xMinZaufanie",
  "progSojuszPremiaGracz3xMinZaufanie"
];
var DIPLO_RESPEKT_THRESHOLD_KEYS = [
  "progWasalizacjaRespekt",
  "progWchloniecieRespekt",
  "progGraniceWojskoweRespekt",
  "progTrybutZadanieMinRespekt",
  "progPoboczneAkceptacja"
];
function getBaseDiplomacyParams() {
  if (!_baseDiplomacyParams) {
    _baseDiplomacyParams = {
      ...DIPLOMACY_PARAMS,
      ...loadDiplomacyParams(diplomacy_default)
    };
  }
  return _baseDiplomacyParams;
}
function scaleDiplomacyParamsForDifficulty(base, difficulty = "normal") {
  const delta = DIPLOMACY_DIFFICULTY_DELTA[difficulty];
  if (delta === 0) return { ...base };
  const out = { ...base };
  for (const k of DIPLO_RELATION_THRESHOLD_KEYS) {
    out[k] = Math.max(0, Math.min(200, base[k] + delta));
  }
  for (const k of DIPLO_ZAUFANIE_THRESHOLD_KEYS) {
    out[k] = Math.max(0, Math.min(100, base[k] + delta));
  }
  for (const k of DIPLO_RESPEKT_THRESHOLD_KEYS) {
    out[k] = Math.max(0, Math.min(100, base[k] + delta));
  }
  return out;
}
function getEffectiveDiplomacyParams(difficulty = "normal") {
  return scaleDiplomacyParamsForDifficulty(getBaseDiplomacyParams(), difficulty);
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

// src/game/diplomacy-locks.ts
function fmtProg(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}
function formatLockedNote(label, prog, masz) {
  return `zablokowana \u2014 wymaga ${label} ${fmtProg(prog)} (masz ${fmtProg(masz)})`;
}
function zaufanieGate(prog, masz) {
  if (masz >= prog) return null;
  return {
    locked: true,
    requirement: { kind: "zaufanie", prog, masz },
    note: formatLockedNote("Zaufania", prog, masz)
  };
}
function respektGate(prog, masz) {
  if (masz >= prog) return null;
  return {
    locked: true,
    requirement: { kind: "respekt", prog, masz },
    note: formatLockedNote("Respektu", prog, masz)
  };
}
function relacjaGate(prog, masz) {
  if (masz >= prog) return null;
  return {
    locked: true,
    requirement: { kind: "stan", prog, masz },
    note: formatLockedNote("Relacji", prog, masz)
  };
}
function dualGate(relTotal, zaufanie, minRel, minZauf) {
  const relOk = relTotal >= minRel;
  const zaufOk = zaufanie >= minZauf;
  if (relOk && zaufOk) return null;
  if (!zaufOk && !relOk) {
    return {
      locked: true,
      requirement: { kind: "zaufanie", prog: minZauf, masz: zaufanie },
      note: `zablokowana \u2014 wymaga Zaufania ${fmtProg(minZauf)} (masz ${fmtProg(zaufanie)}) i Relacji ${fmtProg(minRel)} (masz ${fmtProg(relTotal)})`
    };
  }
  if (!zaufOk) return zaufanieGate(minZauf, zaufanie);
  return relacjaGate(minRel, relTotal);
}
var ALREADY_NOTE = {
  "2": "ju\u017C zawarty",
  "3": "ju\u017C zawarty",
  "5": "ju\u017C zawarta"
};
function resolveDiplomacyActionLock(ctx) {
  const { actionId } = ctx;
  switch (actionId) {
    case "2": {
      if (ctx.hasNap) return { locked: false, active: true, note: ALREADY_NOTE["2"] };
      if (ctx.atWar) return { locked: true, note: "zablokowany \u2014 trwa wojna" };
      const gate = relacjaGate(ctx.progNapRelacja, ctx.relTotal);
      if (gate) return gate;
      return { locked: false, note: "" };
    }
    case "3": {
      if (ctx.hasSojusz) return { locked: false, active: true, note: ALREADY_NOTE["3"] };
      if (ctx.atWar) return { locked: true, note: "zablokowany \u2014 trwa wojna" };
      const gate = dualGate(ctx.relTotal, ctx.zaufanie, ctx.progSojuszRelacja, ctx.progSojuszZaufanie);
      if (gate) return gate;
      return { locked: false, note: "" };
    }
    case "4": {
      if (ctx.atWar) return { locked: true, note: "zablokowane \u2014 trwa wojna" };
      const gate = dualGate(ctx.relTotal, ctx.zaufanie, ctx.progGraniceRelacja, ctx.progGraniceZaufanie);
      if (gate) return gate;
      return { locked: false, note: "przemarsz wojsk dozwolony" };
    }
    case "5": {
      if (ctx.hasHandel) return { locked: false, active: true, note: ALREADY_NOTE["5"] };
      const gate = relacjaGate(ctx.progHandelRelacja, ctx.relTotal);
      if (gate) return gate;
      return { locked: false, note: "" };
    }
    case "6": {
      const gate = dualGate(ctx.relTotal, ctx.zaufanie, ctx.progHandelRelacja, ctx.progWymianaTechZaufanie);
      if (gate) return gate;
      if (ctx.sellableTechCount === 0) {
        return { locked: true, note: "zablokowana \u2014 brak technologii do wymiany" };
      }
      return { locked: false, note: "" };
    }
    case "7": {
      const gate = zaufanieGate(ctx.progNamowWojneZaufanie, ctx.zaufanie);
      if (gate) return gate;
      if (ctx.knownRivalsCount === 0) {
        return { locked: true, note: "zablokowana \u2014 brak znanych cel\xF3w wojny" };
      }
      return { locked: false, note: "" };
    }
    case "8": {
      if (ctx.atWar) {
        return { locked: false, note: "oferta reparacji za pok\xF3j" };
      }
      const gate = respektGate(ctx.progTrybutZadanieMinRespekt, ctx.respekt);
      if (gate) return gate;
      return { locked: false, note: "" };
    }
    case "9": {
      if (ctx.atWar) return { locked: true, note: "zablokowane \u2014 wymaga pokoju (trwa wojna)" };
      return { locked: false, note: "" };
    }
    case "10": {
      if (!ctx.atWar) {
        return { locked: true, note: "niedost\u0119pna \u2014 nie trwa wojna" };
      }
      return { locked: false, note: "" };
    }
    case "11": {
      if (ctx.atWar) return { locked: true, note: "ju\u017C w stanie wojny" };
      if (ctx.breaksTreatyLabel) {
        return { locked: false, note: `zrywa ${ctx.breaksTreatyLabel}` };
      }
      return { locked: false, note: "" };
    }
    case "12": {
      if (ctx.atWar) return { locked: true, note: "zablokowana \u2014 trwa wojna" };
      const gate = respektGate(ctx.progWasalizacjaRespekt, ctx.respekt);
      if (gate) return gate;
      return { locked: false, note: "" };
    }
    case "13": {
      if (ctx.atWar) return { locked: true, note: "dar niedost\u0119pny w wojnie" };
      const gate = relacjaGate(ctx.progDarRelacja, ctx.relTotal);
      if (gate) return gate;
      return { locked: false, note: "" };
    }
    default:
      return { locked: false, note: "" };
  }
}

// src/game/diplomacy-factors.ts
var DEFAULT_MAX_LOG = 40;
function appendDiploFactor(log, entry, maxLen = DEFAULT_MAX_LOG) {
  if (entry.delta === 0 || !Number.isFinite(entry.delta)) return log;
  const next = [...log, entry];
  return next.length > maxLen ? next.slice(next.length - maxLen) : next;
}
var DIPLO_FACTOR_LABELS_PL = {
  dar: "Dar przekazany",
  dar_pn: "Dar przekazany",
  handel: "Zawarcie umowy handlowej",
  handel_pn: "Rozszerzenie handlu",
  wspolny_wrog: "Wsp\xF3lny wr\xF3g \u2014 nawi\u0105zanie kooperacji",
  wspolny_wrog_respekt: "Wsp\xF3lny wr\xF3g \u2014 akceptacja",
  pomoc_sojusznikowi: "Pomoc w wojnie (historia)",
  zlamana_obietnica: "Z\u0142amana umowa (Ty)",
  zlamana_obietnica_ai: "Z\u0142amana umowa (przez AI, przesz\u0142o\u015B\u0107)",
  zdrada: "Zdrada / atak z zaskoczenia",
  szpieg_wykryty: "Szpiegostwo wykryte",
  tarcia_graniczne: "Tarcia graniczne",
  wspolna_religia: "Wsp\xF3lna religia (nawi\u0105zanie)",
  wojna_wypowiedziana: "Wypowiedzenie wojny",
  wojna_casus_belli: "Wypowiedzenie wojny (casus belli)",
  pokoj: "Zawarcie pokoju",
  wygrana_bitwa_respekt: "Wygrana bitwa (historia)",
  przewaga_militarna_respekt: "Przewaga militarna",
  slabszy_militarnie_respekt: "S\u0142abszy militarnie",
  trybut_zaakceptowany_respekt: "Akceptacja trybutu",
  trybut_odmowa: "Odmowa trybutu",
  trybut_oferta_przyjeta: "Oferta trybutu przyj\u0119ta",
  wymiana_tech_gratis: "Wymiana technologii (gratis)",
  zerwanie_handlu: "Zerwana umowa (przesz\u0142o\u015B\u0107)",
  ultimatum_spelnione: "Ultimatum spe\u0142nione",
  ultimatum_bezpodstawne: "Ultimatum bezpodstawne"
};
function pushRow(pozytywne, negatywne, label, value, perTurn) {
  if (value === 0 || !Number.isFinite(value)) return;
  const row = perTurn ? { label, value, perTurn: true } : { label, value };
  if (value > 0) pozytywne.push(row);
  else negatywne.push(row);
}
function buildRelationBreakdown(log, continuous, params) {
  const pozytywne = [];
  const negatywne = [];
  if (continuous.aktywnyHandel) {
    pushRow(pozytywne, negatywne, "Aktywny handel", params.handel_zaufanie_perTura, true);
  }
  if (continuous.pokojTrustTier === "sojusz") {
    pushRow(pozytywne, negatywne, "Aktywny sojusz", params.sojusz_zaufanie_perTura, true);
  } else if (continuous.pokojTrustTier === "nap") {
    pushRow(pozytywne, negatywne, "Trwaj\u0105cy pakt o nieagresji", params.nap_zaufanie_perTura, true);
  } else if (continuous.pokojTrustTier === "pokoj") {
    pushRow(pozytywne, negatywne, "Pokojowy kontakt", params.pokoj_zaufanie_perTura, true);
  }
  if (continuous.wspolnaReligia) {
    pushRow(pozytywne, negatywne, "Wsp\xF3lna religia", params.wspolnaReligia_zaufanie_perTura, true);
  }
  if (continuous.odmiennaReligia) {
    pushRow(pozytywne, negatywne, "Odmienna religia", params.odmiennaReligia_zaufanie_perTura, true);
  }
  if (continuous.ekspansjaPrzyGranicy) {
    pushRow(pozytywne, negatywne, "Ekspansja przy granicy", params.ekspansjaGranica_zaufanie_perTura, true);
  }
  if (continuous.rywalizacjaTenSamTyp) {
    pushRow(pozytywne, negatywne, "Rywalizacja (ten sam typ nacji)", params.rywalizacjaTenSamTyp_zaufanie);
  }
  if (continuous.roznicaKulturowa) {
    pushRow(pozytywne, negatywne, "R\xF3\u017Cna kultura", params.roznicaKulturowa_zaufanie);
  }
  for (let i = log.length - 1; i >= 0; i--) {
    const entry = log[i];
    const label = DIPLO_FACTOR_LABELS_PL[entry.eventKey] ?? entry.eventKey;
    pushRow(pozytywne, negatywne, label, entry.delta);
  }
  return { pozytywne, negatywne };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DIPLOMACY_PARAMS,
  DIPLO_FACTOR_LABELS_PL,
  appendDiploFactor,
  buildRelationBreakdown,
  formatLockedNote,
  getEffectiveDiplomacyParams,
  resolveDiplomacyActionLock
});
