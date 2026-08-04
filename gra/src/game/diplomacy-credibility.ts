/**
 * diplomacy-credibility.ts — Wiarygodność cywilizacji (Etap 1: rdzeń).
 *
 * Źródło prawdy: `dyspozycje/WIARYGODNOSC-SPECYFIKACJA.md` (845 linii) — sekcje
 * cytowane w komentarzach niżej (§1/§2/§3/§4/§5/§7) odnoszą się do tego pliku.
 *
 * Pure moduł: ZERO DOM/THREE, ZERO efektów ubocznych — wzorowany na
 * `game/diplomacy-factors.ts` (ten sam styl: typy + funkcje czyste, silnik w
 * main.ts dopisuje wpisy do rejestru i trzyma mapy per ownerId).
 *
 * Czym jest Wiarygodność (§1): metryka GLOBALNA per cywilizacja (nie per para,
 * w przeciwieństwie do Zaufania/Respektu) — historia dotrzymywania słowa,
 * publiczna, widoczna dla wszystkich od razu. Skala −100…+100.
 *
 * Zakres Etapu 1 (ETAP 1 z kilku): WYŁĄCZNIE ten czysty moduł + stałe w
 * `DIPLOMACY_PARAMS` (diplomacy.ts) + testy. Haki zdarzeń (main.ts), save/load
 * i UI to osobne zlecenia — patrz `WIARYGODNOSC-SPECYFIKACJA.md` §7/§8.
 *
 * Parytet AI (zasada nadrzędna, §6 pkt 2): żadna funkcja w tym pliku nie zna
 * `ownerId` — biorą listę zdarzeń + numer tury + poziom trudności, nic więcej.
 * `ownerId` służy WYŁĄCZNIE do wyboru właściwej mapy u wywołującego (main.ts).
 */

import { DIPLOMACY_PARAMS } from './diplomacy';
import type { GameDifficulty } from './difficulty-cost';

// ---------------------------------------------------------------------------
// §1 — Skala i etykiety
// ---------------------------------------------------------------------------

/** Cztery pasma Wiarygodności (§1), na skali −100…+100. */
export type WiarygodnoscBand = 'wiarolomny' | 'chwiejny' | 'uczciwy' | 'wzor_cnoty';

const WIARYGODNOSC_LABELE_PL: Record<WiarygodnoscBand, string> = {
  wiarolomny: 'Wiarołomny',
  chwiejny: 'Chwiejny',
  uczciwy: 'Uczciwy',
  wzor_cnoty: 'Wzór cnoty',
};

/**
 * Pasmo Wiarygodności wg tabeli §1:
 *   +40…+100 → Wzór cnoty | 0…+39 → Uczciwy | −39…−1 → Chwiejny | −100…−40 → Wiarołomny.
 *
 * Uwaga (niejednoznaczność zgłoszona, nie z §9 — patrz raport końcowy): §1 mówi,
 * że "0 samo w sobie" to "brak historii", nie etykietowane jako Chwiejny/Uczciwy —
 * ale `WiarygodnoscBand` ma dokładnie cztery warianty (bez piątego "nieznany"),
 * więc ta funkcja zwraca dla w===0 dosłownie pasmo z tabeli ('uczciwy', bo 0
 * należy do przedziału 0…+39). Rozróżnienie "brak historii" jest kwestią
 * prezentacji UI (poza zakresem Etapu 1), nie klasyfikacji pasma.
 */
export function wiarygodnoscBand(w: number): WiarygodnoscBand {
  if (w >= DIPLOMACY_PARAMS.wiarygodnoscProgWzorCnoty) return 'wzor_cnoty';
  if (w >= 0) return 'uczciwy';
  if (w > DIPLOMACY_PARAMS.wiarygodnoscProgWiarolomny) return 'chwiejny';
  return 'wiarolomny';
}

/** Etykieta PL pasma Wiarygodności (§1) dla danej wartości W. */
export function wiarygodnoscLabelPl(w: number): string {
  return WIARYGODNOSC_LABELE_PL[wiarygodnoscBand(w)];
}

/**
 * Wartość startowa Wiarygodności wg poziomu trudności (§1):
 * Łatwy +40 / Normalny +20 / Trudny 0 — jednakowa dla gracza i każdego AI
 * (parytet — WIAR-Q6 zmienione: bez różnicowania per cywilizacja).
 */
export function wiarygodnoscStartowa(poziomTrudnosci: GameDifficulty): number {
  switch (poziomTrudnosci) {
    case 'easy':
      return DIPLOMACY_PARAMS.wiarygodnoscStartLatwy;
    case 'hard':
      return DIPLOMACY_PARAMS.wiarygodnoscStartTrudny;
    case 'normal':
    default:
      return DIPLOMACY_PARAMS.wiarygodnoscStartNormalny;
  }
}

// ---------------------------------------------------------------------------
// §2/§3/§7 — Zdarzenia jednorazowe (kary N1–N7, nagrody FINISZ + CZYNY)
// ---------------------------------------------------------------------------

/**
 * Typ zdarzeń jednorazowych — wynika z tabel §2 (kary N1–N7) i §3 (tabele
 * B FINISZ / C CZYNY). Nazwy wprost z §7 "Struktury danych" (tam oznaczone
 * jako "do doprecyzowania przy implementacji" — użyte dosłownie).
 */
export type CredibilityEvent =
  // -- kary N1–N7 (§2) --
  | 'wypowiedzenie_wojny_bez_ostrzezenia' // N1
  | 'zlamanie_paktu_nap' // N2 (NAP)
  | 'zlamanie_paktu_sojusz' // N2 (Sojusz)
  | 'atak_w_oknie_karencji' // N3
  | 'odmowa_obowiazku_sojuszu' // N4
  | 'zerwanie_dobrowolne_traktat' // N5 (traktat czasowy)
  | 'zerwanie_dobrowolne_handel' // N5 (umowa handlowa czasowa)
  | 'niedotrzymanie_handlu_cyklicznego' // N6
  | 'nieautoryzowany_przemarsz' // N7
  // -- nagrody FINISZ (§3 tabela B) --
  | 'dotrwanie_sojuszu' // P1
  | 'dotrwanie_nap' // P2 (NAP)
  | 'dotrwanie_handlu' // P2 (umowa handlowa)
  | 'splata_handlu_cyklicznego' // P3
  // -- nagrody CZYNY (§3 tabela C) --
  | 'wieloletni_pokoj' // P4 (30 tur bez wojny)
  | 'pomoc_sojusznikowi_realna'; // P5

/** Znak zdarzenia jednorazowego — decyduje, z której kolumny §4 brać czas zapomnienia. */
export type CredibilityEventSign = 'kara' | 'nagroda';

/** Znak (kara/nagroda) każdego CredibilityEvent — jednoznaczny, wg tabel §2/§3. */
const CREDIBILITY_EVENT_SIGN: Record<CredibilityEvent, CredibilityEventSign> = {
  wypowiedzenie_wojny_bez_ostrzezenia: 'kara',
  zlamanie_paktu_nap: 'kara',
  zlamanie_paktu_sojusz: 'kara',
  atak_w_oknie_karencji: 'kara',
  odmowa_obowiazku_sojuszu: 'kara',
  zerwanie_dobrowolne_traktat: 'kara',
  zerwanie_dobrowolne_handel: 'kara',
  niedotrzymanie_handlu_cyklicznego: 'kara',
  nieautoryzowany_przemarsz: 'kara',
  dotrwanie_sojuszu: 'nagroda',
  dotrwanie_nap: 'nagroda',
  dotrwanie_handlu: 'nagroda',
  splata_handlu_cyklicznego: 'nagroda',
  wieloletni_pokoj: 'nagroda',
  pomoc_sojusznikowi_realna: 'nagroda',
};

/** Znak (kara/nagroda) danego typu zdarzenia — wg tabeli stałej wyżej. */
export function credibilityEventSign(typ: CredibilityEvent): CredibilityEventSign {
  return CREDIBILITY_EVENT_SIGN[typ];
}

/**
 * Zapis pojedynczego zdarzenia JEDNORAZOWEGO (N1–N7, FINISZ, CZYNY) — §4
 * "Wymagania implementacyjne" pkt 1. Zdarzenia STRUMIENIA (S1–S4) mają
 * osobną, prostszą strukturę — patrz `CredibilityStreamEntry` niżej.
 */
export interface CredibilityEventRecord {
  typ: CredibilityEvent;
  /** Waga pierwotna z §2/§3 (ujemna dla kar, dodatnia dla nagród) — pkt Wiarygodności. */
  wartoscPierwotna: number;
  /** Numer tury, w której zdarzenie zaszło. */
  turaWystapienia: number;
  znak: CredibilityEventSign;
}

/**
 * Dopisuje zdarzenie jednorazowe do rejestru i zwraca NOWĄ tablicę (immutable
 * — nie mutuje `events`), wzorem `appendDiploFactor` w diplomacy-factors.ts.
 * Pomija zdarzenia o wartoscPierwotna===0 / niefinite (nic nie wnoszą do sumy).
 */
export function appendCredibilityEvent(
  events: readonly CredibilityEventRecord[],
  typ: CredibilityEvent,
  wartoscPierwotna: number,
  turaWystapienia: number,
): readonly CredibilityEventRecord[] {
  if (wartoscPierwotna === 0 || !Number.isFinite(wartoscPierwotna)) return events;
  return [...events, { typ, wartoscPierwotna, turaWystapienia, znak: credibilityEventSign(typ) }];
}

/**
 * Czas zapomnienia (tury) dla danego znaku zdarzenia i poziomu trudności —
 * tabela §4: kary 40/80/120 (łatwy/normalny/trudny), nagrody 120/80/40
 * (odwrócone — poziom trudności to charakter świata, nie tylko liczba).
 */
function czasZapomnienia(znak: CredibilityEventSign, poziomTrudnosci: GameDifficulty): number {
  if (znak === 'kara') {
    switch (poziomTrudnosci) {
      case 'easy':
        return DIPLOMACY_PARAMS.wiarygodnoscCzasZapomnieniaKaraLatwy;
      case 'hard':
        return DIPLOMACY_PARAMS.wiarygodnoscCzasZapomnieniaKaraTrudny;
      case 'normal':
      default:
        return DIPLOMACY_PARAMS.wiarygodnoscCzasZapomnieniaKaraNormalny;
    }
  }
  switch (poziomTrudnosci) {
    case 'easy':
      return DIPLOMACY_PARAMS.wiarygodnoscCzasZapomnieniaNagrodaLatwy;
    case 'hard':
      return DIPLOMACY_PARAMS.wiarygodnoscCzasZapomnieniaNagrodaTrudny;
    case 'normal':
    default:
      return DIPLOMACY_PARAMS.wiarygodnoscCzasZapomnieniaNagrodaNormalny;
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/**
 * Krzywa zapominania (§4, wzór):
 *
 *   wartośćBieżąca = wartośćPierwotna × max(podłoga ; 1 − (tura − turaWystąpienia) / czasZapomnienia)
 *
 * Liniowa, NIE do zera — zatrzymuje się na trwałej podłodze (domyślnie 10%
 * wartości pierwotnej, `DIPLOMACY_PARAMS.wiarygodnoscTrwalaPodlogaProcent`),
 * która zostaje NA ZAWSZE po osiągnięciu (`tura − turaWystąpienia >= czasZapomnienia`).
 * Dotyczy WYŁĄCZNIE zdarzeń jednorazowych (kary N1–N7, nagrody FINISZ/CZYNY) —
 * STRUMIEŃ (S1–S4) gaśnie do zera, bez trwałego śladu (C-WIAR-SLAD=A, §3/§4).
 */
export function wartoscBiezaca(
  zdarzenie: CredibilityEventRecord,
  tura: number,
  poziomTrudnosci: GameDifficulty,
): number {
  const czas = czasZapomnienia(zdarzenie.znak, poziomTrudnosci);
  if (!Number.isFinite(czas) || czas <= 0) return zdarzenie.wartoscPierwotna;
  const elapsed = tura - zdarzenie.turaWystapienia;
  const frac = elapsed / czas;
  const mnoznik = clamp(1 - frac, DIPLOMACY_PARAMS.wiarygodnoscTrwalaPodlogaProcent, 1);
  return zdarzenie.wartoscPierwotna * mnoznik;
}

/**
 * Wiarygodność(właściciel, tura) = wartośćStartowa(trudność)
 *   + Σ wartośćBieżąca(zdarzenie, tura) dla WSZYSTKICH zdarzeń jednorazowych
 *     tego właściciela (nawet dawno wygasłych do podłogi) — §4.
 *
 * Twarde klamrowanie do −100…+100 jest OBOWIĄZKOWE (§4 pkt 10) — trwałe ślady
 * kumulują się bez naturalnej górnej/dolnej granicy.
 */
export function sumaWiarygodnosci(
  zdarzenia: readonly CredibilityEventRecord[],
  startowa: number,
  tura: number,
  poziomTrudnosci: GameDifficulty,
): number {
  let suma = startowa;
  for (const zdarzenie of zdarzenia) {
    suma += wartoscBiezaca(zdarzenie, tura, poziomTrudnosci);
  }
  return clamp(suma, DIPLOMACY_PARAMS.wiarygodnoscSkalaMin, DIPLOMACY_PARAMS.wiarygodnoscSkalaMax);
}

// ---------------------------------------------------------------------------
// §3 tabela A — STRUMIEŃ (S1–S4): osobna, prostsza struktura (§7)
// ---------------------------------------------------------------------------

/**
 * Zobowiązania STRUMIENIA — tabela A §3, naliczane NA TURĘ dopóki zobowiązanie
 * trwa. Nazwy nie są dosłownie wymienione w §7 (który enumeruje tylko
 * CredibilityEvent dla zdarzeń jednorazowych) — dodane tu do skompletowania
 * "osobnej, prostszej struktury dla wpisów STRUMIENIA", jawnie wymaganej przez
 * §7/§3 dla tego etapu.
 */
export type CredibilityStreamEvent =
  | 'strumien_sojusz' // S1 +1,0/turę
  | 'strumien_nap' // S2 +0,5/turę
  | 'strumien_handel' // S3 +0,3/turę
  | 'strumien_przemarsz'; // S4 +0,2/turę

/**
 * Wpis STRUMIENIA — CELOWO prostszy niż `CredibilityEventRecord`: BEZ trwałej
 * podłogi, konsolidowalny/usuwalny po zakończeniu zobowiązania (C-WIAR-SLAD=A,
 * §3: "Zdarzenia ze STRUMIENIA gasną do ZERA, BEZ trwałego śladu").
 *
 * Decyzja implementacyjna Etapu 1 (kształt jawnie pozostawiony wykonawcy przez
 * §3: "Dokładny kształt… pozostaje do ustalenia przy implementacji Etapu 0"):
 * ponieważ strumień nie ma trwałego śladu, przyjęty tu model to POJEDYNCZY
 * narastający licznik per zobowiązanie (`sumaAktywna`) — silnik (poza
 * zakresem tego etapu — hak to osobne zlecenie) dodaje `wartoscNaTure` co
 * turę, dopóki zobowiązanie trwa, i USUWA wpis z listy natychmiast, gdy
 * zobowiązanie się kończy (zero okresu wygasania, w przeciwieństwie do
 * zdarzeń jednorazowych). To właśnie czyni tę strukturę "prostszą" — nie
 * potrzebuje własnej krzywej zapominania.
 */
export interface CredibilityStreamEntry {
  typ: CredibilityStreamEvent;
  /** Waga naliczana na turę, dopóki zobowiązanie trwa (pkt Wiarygodności/turę, z §3 tabela A). */
  wartoscNaTure: number;
  /** Suma dotychczas naliczona przez ten ciąg — aktywny wkład do Wiarygodności. */
  sumaAktywna: number;
}

/** Waga per turę (§3 tabela A) danego zobowiązania strumienia. */
export function credibilityStreamWeight(typ: CredibilityStreamEvent): number {
  switch (typ) {
    case 'strumien_sojusz':
      return DIPLOMACY_PARAMS.wiarygodnoscS1SojuszPerTure;
    case 'strumien_nap':
      return DIPLOMACY_PARAMS.wiarygodnoscS2NapPerTure;
    case 'strumien_handel':
      return DIPLOMACY_PARAMS.wiarygodnoscS3HandelPerTure;
    case 'strumien_przemarsz':
      return DIPLOMACY_PARAMS.wiarygodnoscS4PrzemarszPerTure;
  }
}

/** Suma wkładu wszystkich aktywnych wpisów STRUMIENIA do Wiarygodności (§3). */
export function sumaStrumienia(wpisy: readonly CredibilityStreamEntry[]): number {
  let suma = 0;
  for (const wpis of wpisy) suma += wpis.sumaAktywna;
  return suma;
}

/** Świeży wpis STRUMIENIA (sumaAktywna=0) dla danego typu zobowiązania — waga z DIPLOMACY_PARAMS. */
export function freshCredibilityStreamEntry(typ: CredibilityStreamEvent): CredibilityStreamEntry {
  return { typ, wartoscNaTure: credibilityStreamWeight(typ), sumaAktywna: 0 };
}

/**
 * Dolicza jedną turę wartoscNaTure do wpisu STRUMIENIA (immutable — nowy obiekt).
 * Silnik (main.ts) woła to co turę dla każdego aktualnie AKTYWNEGO zobowiązania —
 * wpis, którego zobowiązanie się skończyło, jest po prostu USUWANY z listy (nie
 * tikowany dalej), zgodnie z C-WIAR-SLAD=A ("gasną do zera, bez trwałego śladu").
 */
export function tickCredibilityStreamEntry(entry: CredibilityStreamEntry): CredibilityStreamEntry {
  return { ...entry, sumaAktywna: entry.sumaAktywna + entry.wartoscNaTure };
}

// ---------------------------------------------------------------------------
// §4 (rozszerzone etapem 2-4) — Wiarygodność CAŁKOWITA = startowa + zdarzenia
// jednorazowe (z krzywą zapominania) + STRUMIEŃ (bez krzywej, patrz §3/§4).
// ---------------------------------------------------------------------------

/**
 * Wiarygodność(właściciel, tura) PEŁNA — startowa (wg trudności) + suma
 * wartości bieżących wszystkich zdarzeń jednorazowych (kary N1–N7, FINISZ,
 * CZYNY — z krzywą zapominania §4) + suma aktywnych wpisów STRUMIENIA (S1–S4,
 * bez krzywej — C-WIAR-SLAD=A). Twarde klamrowanie do −100…+100 (§4 pkt 10).
 * Czysta funkcja — `ownerId` NIE wchodzi tu w żadnej postaci (parytet, §6 pkt 2);
 * wywołujący (main.ts) dobiera właściwe listy dla danego ownera.
 */
export function sumaWiarygodnosciCalkowita(
  zdarzenia: readonly CredibilityEventRecord[],
  wpisyStrumienia: readonly CredibilityStreamEntry[],
  startowa: number,
  tura: number,
  poziomTrudnosci: GameDifficulty,
): number {
  let suma = startowa;
  for (const zdarzenie of zdarzenia) {
    suma += wartoscBiezaca(zdarzenie, tura, poziomTrudnosci);
  }
  suma += sumaStrumienia(wpisyStrumienia);
  return clamp(suma, DIPLOMACY_PARAMS.wiarygodnoscSkalaMin, DIPLOMACY_PARAMS.wiarygodnoscSkalaMax);
}

// ---------------------------------------------------------------------------
// §5 — Dźwignia 1: mnożnik tempa Wiarygodność → Zaufanie (WIAR-Q3=C)
// ---------------------------------------------------------------------------

/**
 * Mnożnik tempa wzrostu Zaufania od Wiarygodności (§5, WIAR-Q3=C):
 *   wzrostMult(W) = 1 + (W/100) × 0,5
 * W=+100 → ×1,5 · W=0 → ×1,0 · W=−100 → ×0,5
 */
export function wiarygodnoscWzrostMult(w: number): number {
  const wKlamrowane = clamp(w, DIPLOMACY_PARAMS.wiarygodnoscSkalaMin, DIPLOMACY_PARAMS.wiarygodnoscSkalaMax);
  return 1 + (wKlamrowane / 100) * 0.5;
}

/**
 * Mnożnik tempa spadku Zaufania od Wiarygodności (§5, WIAR-Q3=C):
 *   spadekMult(W) = 1 − (W/100) × 0,5
 * W=+100 → ×0,5 · W=0 → ×1,0 · W=−100 → ×1,5
 */
export function wiarygodnoscSpadekMult(w: number): number {
  const wKlamrowane = clamp(w, DIPLOMACY_PARAMS.wiarygodnoscSkalaMin, DIPLOMACY_PARAMS.wiarygodnoscSkalaMax);
  return 1 - (wKlamrowane / 100) * 0.5;
}

/**
 * Stosuje mnożnik tempa Dźwigni 1 do zsumowanego ΔZ (tickDiplomacy).
 * dZ>0 → × wzrostMult · dZ<0 → × spadekMult · dZ=0 → 0 · w undefined → dZ bez zmian.
 */
export function applyWiarygodnoscTempoDoDelty(dZ: number, w: number | undefined): number {
  if (w === undefined || dZ === 0) return dZ;
  if (dZ > 0) return dZ * wiarygodnoscWzrostMult(w);
  return dZ * wiarygodnoscSpadekMult(w);
}

/** REL-WIARYG-DRIFT-Q1 — pasywny ΔZaufanie/turę od globalnej Wiarygodności (niezależny od umów). */
export const WIARYGODNOSC_ZAUFANIE_DRYF_NA_100 = 0.03;

/**
 * Pasywny dryf Zaufania co turę z Wiarygodności (REL-WIARYG-DRIFT-Q1):
 *   W=+100 → +3/turę · W=−100 → −3/turę · liniowo · W=0 → 0.
 * Wzór: `clamp(W, −100, 100) × 0,03`.
 */
export function zaufanieDryfOdWiarygodnosci(w: number): number {
  const wKlamrowane = clamp(
    w,
    DIPLOMACY_PARAMS.wiarygodnoscSkalaMin,
    DIPLOMACY_PARAMS.wiarygodnoscSkalaMax,
  );
  return wKlamrowane * WIARYGODNOSC_ZAUFANIE_DRYF_NA_100;
}

/**
 * @deprecated ANULOWANY (2026-08-03, WIAR-Q3=C) — zastąpiony mnożnikiem tempa
 * (`wiarygodnoscWzrostMult` / `wiarygodnoscSpadekMult` / `applyWiarygodnoscTempoDoDelty`).
 * Usunięty z tickDiplomacy; zachowany dla kompatybilności testów legacy.
 * D4 nadal używa `modyfikatorZaufaniaD4OdWiarygodnosci` (round(W/20)) — NIE ruszać.
 */
export function strumienWiarygodnoscDoZaufania(w: number): number {
  const wKlamrowane = clamp(w, DIPLOMACY_PARAMS.wiarygodnoscSkalaMin, DIPLOMACY_PARAMS.wiarygodnoscSkalaMax);
  return wKlamrowane / DIPLOMACY_PARAMS.wiarygodnoscZaufanieDzielnikPerTura;
}

// ---------------------------------------------------------------------------
// §5 — Dźwignia 4: pierwszy kontakt — startowe Zaufanie od Wiarygodności (C-WIAR-D4=A)
// ---------------------------------------------------------------------------

/**
 * Modyfikator startowego Zaufania (pkt) od globalnej Wiarygodności jednej strony przy
 * pierwszym ustaleniu relacji: `round(W / dzielnik)` (dzielnik = 20, ten sam co Dźwignia 1).
 */
export function modyfikatorZaufaniaD4OdWiarygodnosci(w: number): number {
  const wKlamrowane = clamp(w, DIPLOMACY_PARAMS.wiarygodnoscSkalaMin, DIPLOMACY_PARAMS.wiarygodnoscSkalaMax);
  return Math.round(wKlamrowane / DIPLOMACY_PARAMS.wiarygodnoscZaufanieDzielnikPerTura);
}

/**
 * Startowe Zaufanie pary po D4 — suma modyfikatorów obu stron (parytet gracz/AI).
 * `baseZaufanie` = wynik startRelationForPair / defaultNeutralRelation itd.
 */
export function zaufaniePierwszyKontaktZD4(
  baseZaufanie: number,
  wiarygodnoscOwnerA: number,
  wiarygodnoscOwnerB: number,
): number {
  const delta =
    modyfikatorZaufaniaD4OdWiarygodnosci(wiarygodnoscOwnerA)
    + modyfikatorZaufaniaD4OdWiarygodnosci(wiarygodnoscOwnerB);
  return clamp(baseZaufanie + delta, 0, 100);
}
