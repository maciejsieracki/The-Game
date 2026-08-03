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
    progHandelRelacja: 0,
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
    progWasalDefaultGoldPerTurn: 10,
    graczWchlonieciePoWasaluTur: 10,
    graczWchloniecieKosztBaza: 150,
    graczWchloniecieKosztPerLudnosc: 25,
    graczWchloniecieKosztMin: 200
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
    dobra_wola_zaufanie_per_tura: 1,
    _opis_wiarygodnosc_limit: "Dzwignia 2 (WIARYGODNOSC-SPECYFIKACJA.md \xA75, decyzja WIAR-9.5b=B, 2026-07-26): limit max_zaufanie_na_ture zaleny od Wiarygodnosci SPRAWCY daru/handlu (proposerId). Reputacja dodatnia (W>=0) NIE zmienia limitu (zostaje max_zaufanie_na_ture=5) \u2014 karzemy zla reputacje, nie nagradzamy dobrej. Pasmo Chwiejny (W<0, W>wiarygodnoscProgWiarolomny=-40): limit obnizony. Pasmo Wiarolomny gorne (-70<W<=-40): limit dalej obnizony. Dno (W<=-70): zakup Zaufania darem calkowicie zablokowany.",
    wiarygodnosc_limit_zaufanie_chwiejny: 3,
    wiarygodnosc_limit_zaufanie_wiarolomny: 1,
    wiarygodnosc_limit_zaufanie_dno: 0,
    wiarygodnosc_limit_prog_dno: -70
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
      Akcja: "3. Sojusz (pe\u0142ny lub defensywny)",
      Opis: "Formalne przymierze: pe\u0142ny = wojna sojusznika to twoja wojna; defensywny = wchodzisz tylko gdy sojusznik jest atakowany. Wypowiedzenie: \u221225 Relacja, \u221220 Zaufanie.",
      "Dost\u0119pne: G\u0142\xF3wni rywale": "TAK",
      "Dost\u0119pne: Poboczni": "NIE",
      Koszt: "Negocjacja \u2014 mo\u017Ce wymaga\u0107 op\u0142aty lub wymiany technologii jako gwarantu",
      Efekt: "Automatyczne wej\u015Bcie do wojen partnera (lub odmowa: \u221215 Zaufanie). Czas: bezterminowy"
    },
    {
      Akcja: "4. Traktat przemarszu",
      Opis: "Zezwolenie na przemarsz jednostek cywilnych lub wojskowych przez terytorium. Nieautoryzowany przemarsz: \u22125 Zaufanie/tura u w\u0142a\u015Bciciela (koniec tury, bez stacku jednostek).",
      "Dost\u0119pne: G\u0142\xF3wni rywale": "TAK",
      "Dost\u0119pne: Poboczni": "UPR",
      Koszt: "Cywilne: 10\u201330 Pieni\u0119dzy; Wojskowe: 20\u201360 Pieni\u0119dzy + wzajemno\u015B\u0107",
      Efekt: "Jednostki poruszaj\u0105 si\u0119 swobodnie przez obce terytorium. UPR: tylko cywilne, bez negocjacji ceny"
    },
    {
      Akcja: "5. Traktat handlowy",
      Opis: "Otwiera i utrzymuje szlaki handlowe mi\u0119dzy miastami (+1 Zaufanie/tur\u0119). Bez koszyka towar\xF3w \u2014 wymiana surowc\xF3w to osobna umowa (akcja 14). Zerwanie: \u221215 Relacja, \u221210 Zaufanie.",
      "Dost\u0119pne: G\u0142\xF3wni rywale": "TAK",
      "Dost\u0119pne: Poboczni": "UPR",
      Koszt: "Okre\u015Blony w tre\u015Bci umowy (np. 10 Pieni\u0119dzy/tura za dost\u0119p do rudy)",
      Efekt: "Szlaki handlowe; +2 Relacja/tura, +1 Zaufanie/tura przy aktywnym traktacie handlowym. UPR: jednorazowe transakcje (akcja 14)"
    },
    {
      Akcja: "14. Umowa wymiany surowc\xF3w",
      Opis: "Koszyk towar\xF3w jednorazowo lub co tur\u0119 (PN, surowce). Nie otwiera szlak\xF3w \u2014 wymaga osobnego traktatu handlowego (akcja 5) na trasy handlowe.",
      "Dost\u0119pne: G\u0142\xF3wni rywale": "TAK",
      "Dost\u0119pne: Poboczni": "UPR",
      Koszt: "Okre\u015Blony w koszyku negocjacji",
      Efekt: "Transfer zasob\xF3w wg umowy; nie zast\u0119puje traktatu handlowego"
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
      Akcja: "12. Wasalizacja",
      Opis: "Miasto-pa\u0144stwo staje si\u0119 wasalem \u2014 zachowuje terytorium, p\u0142aci trybut co tur\u0119. Wymaga Respektu \u2265 prog_wasalizacja.",
      "Dost\u0119pne: G\u0142\xF3wni rywale": "TAK",
      "Dost\u0119pne: Poboczni": "TAK",
      Koszt: "Wasalizacja: trybut \xA4/tur\u0119 (domy\u015Blnie 10) + zobowi\u0105zanie ochrony",
      Efekt: "Wasal: trybut, prawo przemarszu, zakaz sojuszy bez zgody suzerena"
    },
    {
      Akcja: "15. Wch\u0142oni\u0119cie",
      Opis: "Po aktywnym wasalu (min. 10 tur) gracz mo\u017Ce w pe\u0142ni wch\u0142oni\u0107 miasto-pa\u0144stwo \u2014 jednorazowa op\u0142ata \xA4 (skala ludno\u015Bci), zgoda wasala.",
      "Dost\u0119pne: G\u0142\xF3wni rywale": "NIE",
      "Dost\u0119pne: Poboczni": "TAK",
      Koszt: "max(200, 150 + 25 \xD7 ludno\u015B\u0107 MP) \xA4 jednorazowo",
      Efekt: "Miasta MP przechodz\u0105 do gracza; wasalizacja znika; MP eliminowane z mapy"
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
      low: { mountain: 0.06, highland: 0.126 },
      medium: { mountain: 0.1, highland: 0.15 },
      high: { mountain: 0.24, highland: 0.324 }
    },
    relief_overflow_cap_frac: {
      _opis: "Sufit g\u0119sto\u015Bci reliefu (G\xF3ry+Wzg\xF3rza) per kom\xF3rka fair-play, egzekwowany PRZY ZASIEWANIU i PO ROZRO\u015ACIE pasm (RELIEF_OVERFLOW_CAP_MULT w gen-helpers.ts). Maciej 2026-07-29: medium=10% G\xF3ry + 15% Wzg\xF3rza w kom\xF3rce 15\xD715; Ma\u0142o/Du\u017Co przeskalowane wzgl\u0119dem poprzedniego stosunku tier\xF3w.",
      low: { mountain: 0.09, highland: 0.132 },
      medium: { mountain: 0.1, highland: 0.15 },
      high: { mountain: 0.24, highland: 0.318 }
    },
    pasma_gorskie: {
      _opis: "Zadanie HILLS Q1/Q2 (2026-07-20): skupiska g\xF3r/wzg\xF3rz (seed-and-grow), spi\u0119te z tierem suwaka Relief (mountain_noise_threshold/highland_noise_threshold). Bez nowego suwaka UI. ZADANIE 3 (2026-07-20): d\u0142u\u017Csze/w\u0119\u017Csze \u0142a\u0144cuchy (kordyliery) zamiast okr\u0105g\u0142ych plam \u2014 dlugosc_min/max w g\xF3r\u0119, max_pasm_na_mase w d\xF3\u0142 (mniej ale d\u0142u\u017Cszych pasm), nowy obrzeze_szansa < 1 zmniejsza rozlewanie foothills na boki.",
      low: { hexy_na_pasmo: 320, max_pasm_na_mase: 2, dlugosc_min: 9, dlugosc_max: 11, min_masa_hexow: 40, obrzeze_szansa: 0.3 },
      medium: { hexy_na_pasmo: 240, max_pasm_na_mase: 3, dlugosc_min: 11, dlugosc_max: 14, min_masa_hexow: 30, obrzeze_szansa: 0.35 },
      high: { hexy_na_pasmo: 170, max_pasm_na_mase: 5, dlugosc_min: 13, dlugosc_max: 17, min_masa_hexow: 24, obrzeze_szansa: 0.4 }
    }
  },
  mapa_skala: {
    _opis: "Trzeciorz\u0119dny fallback (u\u017Cywany tylko gdy skala_mapy w e-start-params.json nie ma wpisu). Sync z Panel-E 2026-07-28 (typy_cywilizacji per rozmiar mapy).",
    aktywne_typy: {
      mala: 4,
      srednia: 5,
      duza: 6,
      ogromna: 12,
      super: 15
    },
    domyslni_rywale: {
      mala: 12,
      srednia: 14,
      duza: 18,
      ogromna: 22,
      super: 30
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
    glina: {
      rarity: 0.3,
      _opis: "Maciej 2026-07-29: \xD73 g\u0119sto\u015Bci z\u0142\xF3\u017C gliny vs poprzedni standard (0.10\u21920.30). Szansa spawnu na kwal. heks = rarity \xD7 baseline_rarity_mult (1.35) \xD7 surowce_mult tieru (Ma\u0142o 0.6 / Normalnie 1.0 / Du\u017Co 1.4) \u2014 proporcje tier\xF3w bez zmian."
    },
    konie: { rarity: 0.025 },
    wegiel: { rarity: 0.1 },
    sol: { rarity: 0.12 },
    zloto: { rarity: 0.03 }
  },
  metal_deposit_min_era: {
    miedz: 2,
    zelazo: 3,
    wegiel: 8
  }
};

// src/data/map-gen-params-loader.ts
var FALLBACK_ROZMIAR = {
  malenki: [76, 52],
  maly: [108, 74],
  standardowy: [168, 120],
  duzy: [240, 168],
  ogromny: [336, 238],
  superogromny: [672, 476]
};
var FALLBACK_BASELINE_RARITY = 1.35;
var FALLBACK_RIVER_SCALE = {
  mala: 1,
  srednia: 1.35,
  duza: 1.7,
  ogromna: 2.1,
  super: 2.6
};
var FALLBACK_DEPOSIT_RARITY = {
  miedz: 0.1,
  zelazo: 0.08,
  glina: 0.3,
  konie: 0.1,
  wegiel: 0.1,
  owce: 0.08,
  bydlo: 0.07,
  sol: 0.12,
  // Maciej 2026-07-25: złoto — surowiec dostępowy Mennicy, celowo RZADSZY niż miedź/żelazo
  // (patrz gen-helpers.ts DEPOSIT_RULES komentarz przy id='zloto').
  zloto: 0.03
};
function mapGenResourceBaselineRarity() {
  const v = map_gen_params_default.gestosc?.baseline_rarity_mult;
  return typeof v === "number" && v > 0 ? v : FALLBACK_BASELINE_RARITY;
}
function mapGenRiverScale(size) {
  const rs = map_gen_params_default.gestosc?.river_scale;
  const lut = {
    mala: "mala",
    srednia: "srednia",
    duza: "duza",
    ogromna: "ogromna",
    super: "super"
  };
  const v = rs?.[lut[size]];
  return typeof v === "number" && v > 0 ? v : FALLBACK_RIVER_SCALE[size];
}
function mapGenRozmiarDims() {
  const src = map_gen_params_default.generator?.rozmiar_dims;
  const out = { ...FALLBACK_ROZMIAR };
  if (!src) return out;
  for (const key of Object.keys(out)) {
    const pair = src[key];
    if (Array.isArray(pair) && pair.length >= 2 && pair.every((n) => typeof n === "number" && n > 0)) {
      out[key] = [pair[0], pair[1]];
    }
  }
  return out;
}
function mapGenAllDepositRarities() {
  const out = { ...FALLBACK_DEPOSIT_RARITY };
  const rules = map_gen_params_default.deposit_rules;
  if (rules) {
    for (const [id, row] of Object.entries(rules)) {
      if (typeof row?.rarity === "number" && row.rarity >= 0) out[id] = row.rarity;
    }
  }
  return out;
}

// data/e-start-params.json
var e_start_params_default = {
  _opis: "Panel-E (Grupa E): start, meta, generator E2, zwyci\u0119stwo, tempo. \u0179r\xF3d\u0142o: panele-sterowania/Panel-E.xlsx \u2192 export-e.py. ui-params.json = etykiety kreatora; ten plik = liczby i regu\u0142y silnika (docelowo odczyt w TS \u2014 dzi\u015B sync z kodem).",
  defaulty: {
    player_civ_id: "rzymianie",
    start_epoch_id: "kamien",
    map_quality_default: "\u015Arednia",
    render_quality_bundled: "medium"
  },
  skala_mapy: {
    Malenki: {
      rywale_ai: 2,
      miasta_panstwa: 3,
      typy_cywilizacji: 4,
      typy_cywilizacji_per_epoka: {
        kamien: { default: 3, min: 2, max: 4 },
        braz: { default: 4, min: 3, max: 5 },
        zelazo: { default: 4, min: 3, max: 5 }
      },
      hex_w: 76,
      hex_h: 52
    },
    Ma\u0142y: {
      rywale_ai: 3,
      miasta_panstwa: 4,
      typy_cywilizacji: 5,
      typy_cywilizacji_per_epoka: {
        kamien: { default: 4, min: 3, max: 5 },
        braz: { default: 5, min: 4, max: 6 },
        zelazo: { default: 5, min: 4, max: 6 }
      },
      hex_w: 108,
      hex_h: 74
    },
    Standardowy: {
      rywale_ai: 6,
      miasta_panstwa: 5,
      typy_cywilizacji: 6,
      typy_cywilizacji_per_epoka: {
        kamien: { default: 5, min: 4, max: 6 },
        braz: { default: 6, min: 5, max: 7 },
        zelazo: { default: 6, min: 5, max: 7 }
      },
      hex_w: 168,
      hex_h: 120
    },
    Du\u017Cy: {
      rywale_ai: 7,
      miasta_panstwa: 6,
      typy_cywilizacji: 10,
      typy_cywilizacji_per_epoka: {
        kamien: { default: 6, min: 5, max: 7 },
        braz: { default: 9, min: 8, max: 10 },
        zelazo: { default: 10, min: 9, max: 11 }
      },
      hex_w: 240,
      hex_h: 168
    },
    Ogromny: {
      rywale_ai: 8,
      miasta_panstwa: 7,
      typy_cywilizacji: 12,
      typy_cywilizacji_per_epoka: {
        kamien: { default: 7, min: 6, max: 8 },
        braz: { default: 11, min: 10, max: 12 },
        zelazo: { default: 12, min: 11, max: 13 }
      },
      hex_w: 336,
      hex_h: 238
    },
    "Super Huge": {
      rywale_ai: 10,
      miasta_panstwa: 8,
      typy_cywilizacji: 14,
      typy_cywilizacji_per_epoka: {
        kamien: { default: 8, min: 7, max: 8 },
        braz: { default: 13, min: 12, max: 14 },
        zelazo: { default: 14, min: 13, max: 15 }
      },
      hex_w: 672,
      hex_h: 476
    }
  },
  generator_e2: {
    resource_mult_low: 0.6,
    resource_mult_normal: 1,
    resource_mult_high: 1.4,
    resource_baseline_rarity: 1.35,
    river_base_low: 20,
    river_base_normal: 50,
    river_base_high: 80,
    river_scale_mala: 1,
    river_scale_srednia: 1.35,
    river_scale_duza: 1.7,
    river_scale_ogromna: 2.1,
    desert_threshold_low: 0.68,
    desert_threshold_normal: 0.63,
    desert_threshold_high: 0.58,
    forest_threshold_low: 0.65,
    forest_threshold_normal: 0.58,
    forest_threshold_high: 0.5
  },
  tempo_gry: {
    szybka: 1,
    standardowa: 2,
    dluga: 4
  },
  koszt_budynkow_pace: {
    niski: 1,
    normalny: 2,
    wysoki: 4
  },
  koszt_jednostek_pace: {
    niski: 1,
    normalny: 2,
    wysoki: 4
  },
  zwyciestwo: {
    ostatnia_epoka_v1: 3,
    prog_dominacji_power: 0.5,
    dominacja_wymaga_ostatniej_epoki: true,
    nauka_wymaga_rakiety: true
  },
  kreator_zaawansowane: {
    seed_mode_default: "random",
    manual_seed_default: 424242,
    barbarians_enabled_default: true,
    battle_always_manual_default: false,
    fog_debug_reveal_all_default: false,
    victory_power_and_dominance_default: true
  },
  decyzje_kanon: {
    e1_reset_nowa_gra: true,
    e1_tech_kaskada_epok: true,
    e1_ziemia_preset_staly: true,
    e1_zloza_tylko_gory: true,
    e1_zloza_ukryte_do_epoki: true,
    e2_barbarzyncy_do_przed_sredniowiecza: true,
    e2_buntownicy_od_sredniowiecza: true
  }
};

// src/data/e-start-params-loader.ts
var R = e_start_params_default;
function eStartPlayerCivId() {
  return R.defaulty?.player_civ_id ?? "rzymianie";
}
function eStartEpochId() {
  return R.defaulty?.start_epoch_id ?? "kamien";
}
function eStartRenderQualityBundled() {
  const q = R.defaulty?.render_quality_bundled ?? "medium";
  if (q === "low" || q === "high") return q;
  return "medium";
}

// src/map/mapGenProgress.ts
var MAP_GEN_PHASE_LABELS = {
  prep: "Przygotowanie siatki",
  terrain: "Klimat i teren bazowy",
  landSea: "L\u0105d i ocean",
  relief: "Relief (g\xF3ry i wzg\xF3rza)",
  coast: "Wybrze\u017Ce",
  riversMain: "Rzeki \u2014 g\u0142\xF3wne",
  riversFill: "Rzeki \u2014 uzupe\u0142nianie",
  forest: "Las i ro\u015Blinno\u015B\u0107",
  deposits: "Z\u0142o\u017Ca mineralne",
  starts: "Pozycje startowe"
};
var MAP_GEN_PHASE_KEYS = Object.keys(MAP_GEN_PHASE_LABELS);

// src/map/generator.ts
var ROZMIAR_DIMS = mapGenRozmiarDims();

// src/map/newGameMapDefaults.ts
var DEFAULT_PLAYER_CIV_ID = eStartPlayerCivId();
var DEFAULT_START_EPOCH_ID = eStartEpochId();
var DEFAULT_RENDER_QUALITY = eStartRenderQualityBundled();
var RIVER_SCALE_BY_SIZE = {
  mala: mapGenRiverScale("mala"),
  srednia: mapGenRiverScale("srednia"),
  duza: mapGenRiverScale("duza"),
  ogromna: mapGenRiverScale("ogromna"),
  super: mapGenRiverScale("super")
};
var RIVER_REF_AREA = 168 * 120;
var RESOURCE_BASELINE_RARITY_MULT = mapGenResourceBaselineRarity();

// src/map/gen-helpers.ts
var CLIMATE_DESERT_HALF_ROWS = 3.5;
var CLIMATE_DESERT_HALF_FRAC = CLIMATE_DESERT_HALF_ROWS / 108;
var RELIEF_MIN_MOUNTAINS = { low: 2, medium: 4, high: 5 };
var RELIEF_MIN_HIGHLANDS = { low: 2, medium: 4, high: 5 };
var MIN_MOUNTAINS_IRON_CELL = RELIEF_MIN_MOUNTAINS.medium;
var MIN_HIGHLANDS_COPPER_CELL = RELIEF_MIN_HIGHLANDS.medium;
var ERODE_TERRAIN_ORDER = [
  "wybrzeze" /* Wybrzeze */,
  "laka" /* Laka */,
  "pustynia" /* Pustynia */,
  "rownina" /* Rownina */,
  "wzgorza" /* Wzgorza */,
  "gory" /* Gory */
];
function isDryLandTerrain(tb) {
  return tb !== "morze" /* Morze */ && tb !== "wybrzeze" /* Wybrzeze */;
}
var ELEVATION_RANK = {
  ["morze" /* Morze */]: 0,
  ["wybrzeze" /* Wybrzeze */]: 1,
  ["laka" /* Laka */]: 2,
  ["pustynia" /* Pustynia */]: 3,
  ["rownina" /* Rownina */]: 4,
  ["wzgorza" /* Wzgorza */]: 5,
  ["gory" /* Gory */]: 6,
  ["polarny" /* Polarny */]: 2
};
var RIVER_PROFILE_ON = globalThis.process?.env?.CIV_RIVER_PROFILE === "1";
var BASE_DEPOSIT_RULES = [
  {
    id: "miedz",
    nakladka: null,
    allowedOn: (h) => isDryLandTerrain(h.terenBazowy) && h.terenBazowy === "wzgorza" /* Wzgorza */,
    rarity: 0.1
  },
  {
    id: "zelazo",
    nakladka: null,
    allowedOn: (h) => isDryLandTerrain(h.terenBazowy) && h.terenBazowy === "gory" /* Gory */,
    rarity: 0.08
  },
  {
    id: "glina",
    nakladka: "zloze_gliny" /* ZlozeGliny */,
    // TEMAT 12 (2026-07-24, Maciej): glina TYLKO przy rzece — gałąź "Łąka bez rzeki" usunięta.
    // placeDeposits() jest teraz wołane PO generateRivers (generator.ts), więc h.rzeka.obecna
    // odzwierciedla finalny stan rzek, nie "zawsze false" jak dawniej.
    allowedOn: (h) => isDryLandTerrain(h.terenBazowy) && h.rzeka?.obecna === true,
    rarity: 0.3
  },
  {
    id: "konie",
    nakladka: "zloze_konia" /* ZlozeKonia */,
    allowedOn: (h) => isDryLandTerrain(h.terenBazowy) && h.terenBazowy === "rownina" /* Rownina */,
    rarity: 0.1
  },
  {
    id: "wegiel",
    nakladka: null,
    // brak w enumie Nakladka -> znacznik hex.zloze
    allowedOn: (h) => isDryLandTerrain(h.terenBazowy) && h.terenBazowy === "gory" /* Gory */,
    rarity: 0.1
  },
  // Model B (Maciej 2026-07-09): USUNIĘTE złoża owiec/bydła (ZlozeOwiec/ZlozeBydla) — hodowla to
  // teraz CZYSTE ulepszenie (Owczarnia/Pastwisko), budowane jak farma, nie surowiec na mapie.
  // Koń (wyżej) zostaje surowcem. Zmienia hash mapy (zamierzone).
  {
    id: "sol",
    nakladka: null,
    // C-MAP-SOL-ZIEMIA=B (Maciej 2026-07-25): sól na LĄDZIE najbliższym wybrzeża
    // (suchy ląd graniczący z płytkim morzem/Wybrzeżem), NIE na osobnym kaflu Wybrzeże.
    // Ta definicja działa też na mapie Ziemia (brak kafli Wybrzeże, ale jest ląd przy Morzu).
    // Koniunkcja: allowedOn (suchy ląd) + requiresCoastalLand (isCoastalLandHex w placeDeposits).
    allowedOn: (h) => isDryLandTerrain(h.terenBazowy),
    requiresCoastalLand: true,
    rarity: 0.12
  },
  {
    // Maciej 2026-07-25: złoto jako surowiec DOSTĘPOWY dla Mennicy — „wystarczy tylko
    // dostęp, nie trzeba budować wielu kopalni". Reguła terenowa: żyłowe w Górach/Wzgórzach
    // (Nubia, Anatolia, Iberia) — forma okruchowa (rzeki) świadomie pominięta (uproszczenie,
    // patrz RAPORT KOŃCOWY zloto-test.cjs). Rzadkość dużo niższa niż miedź (0.10) / żelazo
    // (0.08) — dobrana empirycznie w map-gen-params.json tak, by przy tym samym typie/rozmiarze
    // mapy złoto liczebnie wypadało rzadsze niż miedź (patrz zloto-test.cjs).
    id: "zloto",
    nakladka: null,
    allowedOn: (h) => isDryLandTerrain(h.terenBazowy) && (h.terenBazowy === "wzgorza" /* Wzgorza */ || h.terenBazowy === "gory" /* Gory */),
    rarity: 0.03
  }
];
var _depositRarities = mapGenAllDepositRarities();
var DEPOSIT_RULES = BASE_DEPOSIT_RULES.map((rule) => {
  const rarity = _depositRarities[rule.id];
  return typeof rarity === "number" ? { ...rule, rarity } : rule;
});

// src/map/clusters.ts
var MIN_DEVELOPMENT_HEX_PER_CIV = 90;
var SMALL_MASS_CAP_THRESHOLD = 2 * MIN_DEVELOPMENT_HEX_PER_CIV;

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
    pole_surowiec_ilosc_tura: "SUROW-TERYT-01 (Maciej 2026-07-23): produkcja PER ZBUDOWANE ULEPSZENIE w terytorium wlasciciela, niezaleznie od obsadzenia pola populacja (workedTiles). Wartosc = surowiec/ture. Stawki REALNE: Tartak->drewno 10, Glinianka->glina 15 (PYTANIE-84-B1/B9/U-18, korekta balansu Maciej 2026-07-29: bylo 20/20), Kamieniolom->kamien 4, Kopalnia miedzi->ruda 2, Kopalnia zelaza->ruda_zelaza 2, Warzelnia soli->sol 10 (B2), Stadnina->kon 1 (B3), Kopalnia zlota->zloto 1 (B4). Brak pola w JSON -> domyslnie 2/ture (terrain-improvements.ts TERRITORY_YIELD_DEFAULT_AMOUNT, fallback bezpieczenstwa)."
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
    teren: "Wzg\xF3rza (bez lasu)",
    warunek: "solo otwarte wzg\xF3rze (nak\u0142adka Las zabroniona); pierwsze: z\u0142o\u017Ce owiec; potem wzg\xF3rze bez z\u0142o\u017Ca po odblokowaniu",
    koszt_praca: 20,
    tech: "Oswojenie zwierz\u0105t",
    odblokowuje: "Owce (we\u0142na / jedzenie)"
  },
  lama: {
    nazwa: "Lama",
    epoka: 1,
    cywilizacje: ["inkowie"],
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
  glinianka: {
    nazwa: "Glinianka",
    epoka: 2,
    bonus: {
      praca: 1,
      glina: 2,
      handel: 2
    },
    surowiecOdblokowany: "glina",
    surowiecOdblokowany_uwaga: "GLINA-Q1=A (Maciej 2026-07-20): stala ilosc glina/ture z ulepszenia. PYTANIE-84-B1/U-18 (Maciej 2026-07-27): stawka REALNA = 20/ture; korekta balansu Maciej 2026-07-29: 15/ture (bylo 20 \u2014 magazyn PE\u0141NY). NIE bonus.glina (2) -- osobne pola.",
    surowiec_ilosc_tura: 15,
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
    surowiecOdblokowany_uwaga: "SUROW-TERYT-01 (Maciej 2026-07-23): produkcja per ulepszenie w terytorium, niezaleznie od obsadzenia populacja. PYTANIE-84-B9/U-18 (Maciej 2026-07-27): stawka REALNA = 20/ture; korekta balansu Maciej 2026-07-29: 10/ture (bylo 20 \u2014 magazyn PE\u0141NY).",
    surowiec_ilosc_tura: 10,
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
    teren: "Wzg\xF3rza, G\xF3ry, z\u0142o\u017Ce miedzi (hex.zloze=miedz) lub legacy ZlozeRudy",
    warunek: "ruda miedzi \u2192 magazyn (Odlewnia br\u0105zu)",
    koszt_praca: 22,
    tech: "Br\u0105zownictwo",
    odblokowuje: "Odlewnia br\u0105zu (budynek miejski)",
    uwagi: "ABC-7 + ABC-14 Maciej 2026-07-04: tylko heks ze z\u0142o\u017Cem rudy; R-KOPALNIA-UNIWERSALNA-Q1=B: legacy nakladka ZlozeRudy"
  },
  kopalnia_zelaza: {
    nazwa: "Kopalnia \u017Celaza",
    epoka: 3,
    bonus: {
      praca: 2,
      handel: 5
    },
    surowiecOdblokowany: "ruda_zelaza",
    surowiecOdblokowany_uwaga: "Ruda \u017Celaza (Odlewnia \u017Celaza); plon 2/t z kopalni_zelaza. SUROW-TERYT-01 (Maciej 2026-07-23): stawka REALNA = 2/ture.",
    surowiec_ilosc_tura: 2,
    teren: "Wzg\xF3rza, G\xF3ry, z\u0142o\u017Ce \u017Celaza (hex.zloze=zelazo)",
    warunek: "ruda \u017Celaza \u2192 magazyn (Odlewnia \u017Celaza)",
    koszt_praca: 22,
    tech: "Hutnictwo \u017Celaza",
    odblokowuje: "Odlewnia \u017Celaza (budynek miejski)",
    uwagi: "R-KOPALNIA-UNIWERSALNA-Q1=B (Maciej 2026-07-30): osobne ulepszenie zamiast uniwersalnej kopalnia"
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
var LIVESTOCK_SUROWIEC_KEYS = /* @__PURE__ */ new Set(["bydlo", "owce", "lama", "kon"]);
var LIVESTOCK_IMPROVEMENT_KEYS = IMPROVEMENT_KEYS.filter((k) => {
  const s = IMPROVEMENTS[k]?.surowiecOdblokowany;
  return typeof s === "string" && LIVESTOCK_SUROWIEC_KEYS.has(s);
});

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
var TERRAIN_MOVEMENT_KEY_ALIASES = {
  Laka: "laka" /* Laka */,
  "\u0141\u0105ka": "laka" /* Laka */,
  laka: "laka" /* Laka */,
  Rownina: "rownina" /* Rownina */,
  "R\xF3wnina": "rownina" /* Rownina */,
  rownina: "rownina" /* Rownina */,
  Pustynia: "pustynia" /* Pustynia */,
  pustynia: "pustynia" /* Pustynia */,
  Wybrzeze: "wybrzeze" /* Wybrzeze */,
  "Wybrze\u017Ce": "wybrzeze" /* Wybrzeze */,
  wybrzeze: "wybrzeze" /* Wybrzeze */,
  Wzgorza: "wzgorza" /* Wzgorza */,
  "Wzg\xF3rza": "wzgorza" /* Wzgorza */,
  wzgorza: "wzgorza" /* Wzgorza */,
  Gory: "gory" /* Gory */,
  "G\xF3ry": "gory" /* Gory */,
  gory: "gory" /* Gory */,
  Morze: "morze" /* Morze */,
  morze: "morze" /* Morze */,
  Polarny: "polarny" /* Polarny */,
  polarny: "polarny" /* Polarny */
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
  /** Relacja >= wartość wymagana do handlu ¤/Praca/złoża/surowce (Maciej 2026-07-26: 0 = od neutralnej) */
  progHandelRelacja: 0,
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
  /** R-GRACZ-WCHLONIECIE: min tur wasalu przed wchłonięciem MP przez gracza */
  graczWchlonieciePoWasaluTur: 10,
  /** R-GRACZ-WCHLONIECIE: baza kosztu wchłonięcia (¤) */
  graczWchloniecieKosztBaza: 150,
  /** R-GRACZ-WCHLONIECIE: koszt per ludność MP (¤) */
  graczWchloniecieKosztPerLudnosc: 25,
  /** R-GRACZ-WCHLONIECIE: minimalny koszt wchłonięcia (¤) */
  graczWchloniecieKosztMin: 200,
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
var WAR_RELATION_SCORE_CAP = DIPLOMACY_PARAMS.progMinimalnyRelacja - 1;
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
  "5": "ju\u017C zawarta",
  "14": "ju\u017C zawarta"
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
      if (ctx.atWar) return { locked: true, note: "handel niedost\u0119pny w wojnie" };
      if (ctx.hasHandel) return { locked: false, active: true, note: ALREADY_NOTE["5"] };
      const gate = relacjaGate(ctx.progHandelRelacja, ctx.relTotal);
      if (gate) return gate;
      return { locked: false, note: "szlaki handlowe, +1 Zaufanie/tur\u0119" };
    }
    case "14": {
      if (ctx.atWar) return { locked: true, note: "handel niedost\u0119pny w wojnie" };
      if (ctx.hasWymiana) return { locked: false, active: true, note: ALREADY_NOTE["14"] };
      const gate = relacjaGate(ctx.progHandelRelacja, ctx.relTotal);
      if (gate) return gate;
      return { locked: false, note: "koszyk towar\xF3w jednorazowo / co tur\u0119" };
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
    case "15": {
      if (ctx.atWar) return { locked: true, note: "zablokowana \u2014 trwa wojna" };
      if (!ctx.isCityStatePartner) {
        return { locked: true, note: "zablokowana \u2014 tylko miasta-pa\u0144stwa" };
      }
      if (!ctx.hasWasal) {
        return { locked: true, note: "zablokowana \u2014 brak aktywnej wasalizacji" };
      }
      const minAge = ctx.graczWchlonieciePoWasaluTur ?? 10;
      const age = ctx.wasalAgeTurns ?? 0;
      if (age < minAge) {
        const remain = minAge - age;
        return {
          locked: true,
          note: `zablokowana \u2014 wasal musi trwa\u0107 \u2265 ${minAge} tur (pozosta\u0142o ${remain})`
        };
      }
      const wchRespekt = ctx.progWchloniecieRespekt ?? 90;
      const gate = respektGate(wchRespekt, ctx.respekt);
      if (gate) return gate;
      return { locked: false, note: "jednorazowa op\u0142ata \xA4 + zgoda wasala" };
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
  zerwanie_traktatu: "Zerwanie traktatu (decyzja w\u0142asna)",
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
