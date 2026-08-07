/**
 * diplomacy.ts
 * Pure diplomacy model for The Game.
 * (events extended 2026-06-22: casus-belli war, ultimatum, tribute, free tech)
 * (Respekt refactored 2026-06-25: CYWILIZACJE lane — potegaNacji + ratio-share)
 *
 * Model: Relacja (ogolna) = Zaufanie + Respekt  (range 0-200)
 *   Zaufanie (0-100, start 20): soft power / goodwill -- driven by actions & treaties
 *   Respekt  (0-100, start 30): hard power -- driven by military strength & battles
 *
 * Sources:
 *   data/diplomacy.json  -- params, thresholds, panel A-E
 *   Dyplomacja-szablon.md -- events, action availability, AI rules
 *   src/types/diplomacy.ts -- RelacjaDyplomatyczna, StanWojny, TypCywilizacji
 *
 * NO DOM, NO THREE, NO side effects. All functions are pure / deterministic.
 */

import type { RelacjaDyplomatyczna } from '../types/diplomacy';
import { StanWojny }                 from '../types/diplomacy';
import { TypCywilizacji }            from '../types/player';
import type { Player }               from '../types/player';
import diplomacyData from '../../data/diplomacy.json';
import type { GameDifficulty } from './difficulty-cost';
import {
  nastawienieBazoweZaufanieDelta,
  resolveArchetypeAggression,
  resolveArchetypeTrade,
} from './civ-ai-data';
import { isBarbarian } from './barbarians';
import { applyWiarygodnoscTempoDoDelty, zaufanieDryfOdWiarygodnosci } from './diplomacy-credibility';

// ---------------------------------------------------------------------------
// Re-exported Relation interface (spec-aligned alias over RelacjaDyplomatyczna)
// ---------------------------------------------------------------------------

/**
 * Slim relation value object used by the pure functions in this module.
 * Matches the field names from diplomacy.json / Dyplomacja-szablon.md:
 *   zaufanie   = Zaufanie (0-100)
 *   respekt    = Respekt / Strach (0-100)
 *   status     = current war/peace state
 *
 * Can be projected from / into RelacjaDyplomatyczna at the call site.
 */
export interface Relation {
  zaufanie: number;
  respekt:  number;
  /**
   * Diplomatic status labels in Polish (from the spec):
   *   'wojna'    = war (StanWojny.Wojna)
   *   'pokoj'    = peace (StanWojny.Pokoj)
   *   'sojusz'   = active SojuszWojskowy treaty
   *   'neutralni'= no significant relationship yet (no contact / early game)
   */
  status: 'wojna' | 'pokoj' | 'sojusz' | 'neutralni';
}

/**
 * R-WOJNA-KARA-PARYTET (Maciej 2026-07-26, PARYTET AI): czy `ownerId` (gracz
 * LUB dowolne AI/miasto-państwo) jest aktualnie w stanie wojny z kimkolwiek.
 * `relations` to dokładnie main.ts `diplomacyRelations` (klucz "a_b", wartości
 * z polem `status`) -- ta sama mapa co reszta silnika dyplomacji, żadnej
 * osobnej ścieżki danych. Wcześniej (do 2026-07-26) main.ts miał lokalny
 * `isPlayerAtWar()`, który sprawdzał TYLKO ownerId 0 -- kara za wojnę w
 * `evaluateOrderFromBreakdown` (game/society-breakdown.ts, pole `atWar`) była
 * więc naliczana WYŁĄCZNIE graczowi; miasta AI/miast-państw nigdy jej nie
 * odczuwały. Ta funkcja jest ownerId-agnostyczna (parametr, nie stała) i
 * zastępuje dawną wersję dla dowolnego ownera.
 *
 * Barbarzyńcy są pominięci (C-BARB-Q1, Maciej 2026-07-26): mają ZAWSZE
 * status='wojna' w tej mapie (patrz `barbarianWarRelation`), ale to nie jest
 * wojna cywilizacyjna licząca się do zadowolenia/war-weariness.
 *
 * Czysta funkcja -- brak DOM/silnika, testowalna wprost
 * (tools/war-happiness-parity-test.cjs).
 */
export function isOwnerAtWarInRelations(
  ownerId: number,
  relations: ReadonlyMap<string, Pick<Relation, 'status'>>,
): boolean {
  for (const [key, rel] of relations.entries()) {
    if (rel.status !== 'wojna') continue;
    const parts = key.split('_').map(Number);
    if (parts.length !== 2) continue;
    const [a, b] = parts;
    if (isBarbarian(a!) || isBarbarian(b!)) continue;
    if (a === ownerId || b === ownerId) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Param names mirror diplomacy.json exactly (camelCase of JSON keys)
// ---------------------------------------------------------------------------

/**
 * One-shot delta values for applyDiplomaticEvent.
 * Named after "Zdarzenie / Dzialanie" entries in diplomacy.json.zmiany_parametrow.
 */
export const DIPLOMACY_PARAMS = {
  // ---- one-shot Zaufanie deltas (jednorazowo) ----
  /** "Zawarcie umowy handlowej" (+2 Zaufanie, jednorazowo) */
  handelZawarcie_zaufanie:          2,
  /** "Pomoc w wojnie sojusznikowi" (+10 Zaufanie, jednorazowo) */
  pomocSojusznikowi_zaufanie:       10,
  /** "Wspolny wrog -- nawiazanie kooperacji" (+5 Zaufanie, jednorazowo) */
  wspolnyWrogNawiazanie_zaufanie:   5,
  /** "Podarunek surowca / Pieniadza (gratis)" (+6 Zaufanie, jednorazowo) */
  dar_zaufanie:                     6,
  /** "Zlamany pakt przez gracza" (-40 Zaufanie, jednorazowo) */
  zlamanaPaktGracz_zaufanie:       -40,
  /** "Zlamany pakt przez AI" (-20 Zaufanie, jednorazowo) */
  zlamanaPaktAI_zaufanie:          -20,
  /** "Zdrada / atak z zaskoczenia (na gracza)" (-50 Zaufanie, jednorazowo) */
  zdrada_zaufanie:                 -50,
  /** "Szpiegostwo wykryte przez przeciwnika" (-15 Zaufanie, jednorazowo) */
  szpiegWykryty_zaufanie:          -15,
  /** "Rywalizacja tego samego typu (start gry)" (-20 Zaufanie, jednorazowo) */
  rywalizacjaTenSamTyp_zaufanie:   -20,
  /** REL-MP-SAME-Q1: gracz ↔ miasto-państwo kopii typu gracza (+20 Zaufanie, start) */
  miastoPanstwoSameCiv_zaufanie:   20,
  /** "Duza roznica kulturowa (rozny typ)" (-5 Zaufanie, jednorazowo) */
  roznicaKulturowa_zaufanie:       -5,

  // ---- one-shot Respekt deltas (jednorazowo) ----
  /** "Znaczaca przewaga militarna gracza" (+15 Respekt, jednorazowo; 2x or 5x threshold) */
  przewagaMilitarna_respekt:        15,
  /** "Gracz slabszy militarnie od partnera" (-10 Respekt, jednorazowo) */
  slabszyMilitarnie_respekt:       -10,
  /** "Wygrana bitwa (historia bojowa)" (+5 Respekt, jednorazowo) */
  wygraBitwa_respekt:               5,
  /** "Akceptacja zadania trybutu" (+10 Respekt, jednorazowo) */
  trybut_respekt:                   10,
  /** "Wspolny wrog zaakceptowany" (+10 Respekt, jednorazowo) */
  wspolnyWrogAkceptacja_respekt:    10,

  // ---- per-turn Zaufanie deltas (co ture) ----
  /** "Aktywny handel (trwa umowa handlowa)" (+1/ture) — stackuje z tierem pokoju */
  handel_zaufanie_perTura:          1,
  /** "Aktywny sojusz wojskowy" (+3/ture, Maciej 2026-07-21) */
  sojusz_zaufanie_perTura:          3,
  /** "Aktywny pakt nieagresji" (+2/ture, Maciej 2026-07-21) */
  nap_zaufanie_perTura:             2,
  /** "Pokojowy kontakt bez wojny/NAP/sojuszu" (+1/ture, Maciej 2026-07-21) */
  pokoj_zaufanie_perTura:           1,
  /** @deprecated — zastąpione przez nap/sojusz/pokoj (2026-07-21); zostaje w JSON roundtrip */
  aktywnyPakt_zaufanie_perTura:     1,
  /** "Efekt dobrej woli (podarunek)" (+1/ture przez kilka tur) */
  dobraWola_zaufanie_perTura:       1,
  /** "Wspolny wrog (kooperacja trwa)" (+1/ture) */
  wspolnyWrog_zaufanie_perTura:     1,
  /** "Wspolna religia" (+0.5/ture, max +15) */
  wspolnaReligia_zaufanie_perTura:  0.5,
  /** "Odmienna religia" (-0.5/ture, max -10) */
  odmiennaReligia_zaufanie_perTura: -0.5,
  /** "Ekspansja przy granicy" (-2/ture) */
  ekspansjaGranica_zaufanie_perTura: -2,
  /** "Urazy historyczne (zanikajace)" (-2/ture; fades every 20 turns) */
  urazyHistoryczne_zaufanie_perTura: -2,

  // ---- thresholds (progi akcji; sekcja C) ----
  /** Zaufanie >= 91 required for SojuszWojskowy (przy równowadze sił >90%) */
  progSojuszZaufanie:        91,
  /** Zaufanie >= 70 required for WymianaTechnologii */
  progWymianaTechZaufanie:   70,
  /** Respekt >= 70 required to demand Wasalizacja */
  progWasalizacjaRespekt:    70,
  /** Respekt >= 90 required to demand Wchloniecie */
  progWchloniecieRespekt:    90,
  /** Relacja < 30 = diplomacy nearly impossible */
  progMinimalnyRelacja:      30,
  /** Relacja >= 151 = sojusz (Maciej 2026-06-30: powyżej 150) */
  progSojuszRelacja:         151,
  /** Twarda podłoga Relacji na dobrowolne umowy pozytywne (>150); premia siły nie obniża */
  progUmowaMinRelacja:       151,

  // ---- starting values (wartosci startowe) ----
  startZaufanie: 20,
  startRespekt:  30,

  // ---- global multipliers (sekcja E) ----
  mnoznikZaufania:     1,
  mnoznikRespektu:     1,
  mnoznikPodarunku:    1,
  turyEfektuPodarunku: 5,

  // ---- simplified minor-civ threshold (paragraph 5.2) ----
  /** Minor civ accepts tribute / NAP / annexation when player Respekt > this */
  progPoboczneAkceptacja: 60,
  /** Minor civ at peace when Relacja > this */
  progPoboczneHandel:     30,
  /**
   * Minor civ may go to war when Relacja drops BELOW this (0-200 scale).
   * Remaps Dyplomacja-szablon.md 5.2 "Relacja < -40" onto the 3.1 range 0-200:
   * Relacja = Zaufanie + Respekt is clamped >= 0, so a negative floor is
   * unreachable -- "very hostile" is modelled as a low positive threshold.
   * (The "player attacks" war trigger from 5.2 is handled by the engine.)
   */
  progPoboczneWojna:     15,

  // ---- propozycje v1.1 (Panel-D → evaluateProposal) ----
  /** Relacja >= wartość wymagana do NAP (Maciej 2026-07-21: 50 @ normal; tylko Rel, bez Zauf) */
  progNapRelacja:                  50,
  /** Relacja >= wartość wymagana do handlu ¤/Praca/złoża/surowce (Maciej 2026-07-26: 0 = od neutralnej) */
  progHandelRelacja:               0,
  /** @deprecated v1.2 — usunięte „tylko równi”; zostaje w JSON dla roundtrip */
  progSojuszPartnerRwMin:          0.4,
  progSojuszPartnerRwMax:          0.7,
  /** Max obniżka progu willingnessAlly gdy proponent silniejszy (Moc/Respekt) */
  progSojuszPremiaSilniejszyMax:   0.25,
  /** Wkład przewagi Mocy (milRatio−1) × skok w premii progu */
  progSojuszPremiaMilSkok:         0.08,
  /** Wkład przewagi Respektu proponenta × skok w premii progu */
  progSojuszPremiaRespektSkok:     0.15,
  /** Poniżej tego stosunku M proponent/respondent — wymagana pełna relacja (score≥120) */
  progSojuszSlabyProponentMilRatio: 0.5,
  /** Bonus willingnessAlly gdy rozmówca silniejszy (AI słabsze — sojusz z hegemonem) */
  progSojuszPremiaSilniejszyInny:  0.20,
  /** aiDiplomacyStance.willingnessAlly min dla sojuszu */
  progSojuszWillingnessMin:        0.68,
  /** v1.3 — max podwyżka progów gdy respondent (AI) silniejszy od proponenta */
  progSojuszKaraSilniejszyMax:     0.40,
  /** v1.3 — wkład przewagi respondenta (1/milProponent − 1) × skok */
  progSojuszKaraMilSkok:           0.15,
  /** v1.3 — kara willingnessAlly na jednostkę przewagi respondenta */
  progSojuszKaraAllySkok:          0.18,
  /** v1.3 — poniżej tego stosunku M proponent/respondent → hegemon odmawia sojuszu (słaby proponent) */
  progSojuszHegemonMilRatio:       0.42,
  /** v1.3 — powyżej tego stosunku M proponent/respondent → hegemon nie szuka sojuszu równoprawnego */
  progSojuszHegemonProposerMaxMil: 2.38,
  /** v1.3c — progresywne podłogi Zauf. gdy gracz silniejszy (2×≈85, 3×≈83 — oba „w okolicy 85") */
  progSojuszPremiaGracz2xMilRatio:   2.0,
  progSojuszPremiaGracz2xMinZaufanie: 85,
  progSojuszPremiaGracz2xBonus:        0.06,
  progSojuszPremiaGracz3xMilRatio:     2.8,
  progSojuszPremiaGracz3xMinZaufanie:  83,
  progSojuszPremiaGracz3xBonus:        0.10,
  /** Minimalny trybut żądany (¤/turę) */
  progTrybutMinGoldPerTurn:        10,
  /** Respekt proponenta musi być > tej wartości, by żądać trybutu (spokój) */
  progTrybutZadanieMinRespekt:     70,
  /** Limit górny żądania trybutu (¤/turę) przy Respekt tuż powyżej progu (audyt #21) */
  progTrybutZadanieMaxGoldBase:        50,
  /** Limit górny: dodatek ¤/turę za każdy punkt Respektu ponad próg żądania (audyt #21) */
  progTrybutZadanieMaxGoldPerRespekt:   5,
  /** militaryRatio > wartość → „blisko wojny” (oferta trybutu) */
  progTrybutOfertaNearWarRatio:    1.2,
  /** Zaufanie < wartość → „blisko wojny” (oferta trybutu) */
  progTrybutOfertaNearWarZaufanie: 30,
  /** Minimalna oferta trybutu (¤) */
  progTrybutOfertaMinGold:         5,
  /** Bazowa oferta trybutu poza „blisko wojny”: base + epoka × epokaGold */
  progTrybutOfertaBaseGold:        10,
  progTrybutOfertaEpokaGold:       5,
  /** willingnessTrade min dla handlu */
  progHandelWillingnessMin:        0.5,
  /** Zaufanie min dla namówienia do wojny */
  progNamowWojneZaufanie:          50,
  /** Łapówka min = base × (epoka + 1) */
  progNamowWojneBribeBase:         30,
  /** Zaufanie min dla otwartych granic */
  progGraniceZaufanie:             45,
  /** Relacja min dla otwartych granic / przemarszu (G1-A) */
  progGraniceRelacja:              100,
  /** Respekt min dla prawa wojskowego przemarszu */
  progGraniceWojskoweRespekt:      55,
  /** militaryRatio min dla ultimatum */
  progUltimatumMilitaryRatio:      1.3,
  /** Jednorazowe złoto min przy ultimatum */
  progUltimatumMinGold:            20,
  /** Domyślny trybut wasala (¤/turę) */
  progWasalDefaultGoldPerTurn:     10,

  /** R-GRACZ-WCHLONIECIE: min tur wasalu przed wchłonięciem MP przez gracza */
  graczWchlonieciePoWasaluTur:    10,
  /** R-GRACZ-WCHLONIECIE: baza kosztu wchłonięcia (¤) */
  graczWchloniecieKosztBaza:       150,
  /** R-GRACZ-WCHLONIECIE: koszt per ludność MP (¤) */
  graczWchloniecieKosztPerLudnosc: 25,
  /** R-GRACZ-WCHLONIECIE: minimalny koszt wchłonięcia (¤) */
  graczWchloniecieKosztMin:        200,

  // ---- Wiarygodność cywilizacji (WIARYGODNOSC-SPECYFIKACJA.md, Etap 1) ----
  // Uwaga: wartości tymczasowo hardkodowane tutaj; docelowo mają trafić do
  // gra/data/diplomacy.json przez Panel-D Excela (poza zakresem Etapu 1) —
  // wzorem loadDiplomacyParams() dla reszty DIPLOMACY_PARAMS.

  // -- §1: skala i wartość startowa (pkt Wiarygodności, skala −100…+100) --
  /** Dolna granica skali Wiarygodności (pkt Wiarygodności), §1. */
  wiarygodnoscSkalaMin:  -100,
  /** Górna granica skali Wiarygodności (pkt Wiarygodności), §1. */
  wiarygodnoscSkalaMax:   100,
  /** Próg pasma „Wzór cnoty" — W >= wartość (pkt Wiarygodności), §1. */
  wiarygodnoscProgWzorCnoty: 40,
  /** Próg pasma „Wiarołomny" — W <= wartość (pkt Wiarygodności), §1. */
  wiarygodnoscProgWiarolomny: -40,
  /** Wartość startowa Wiarygodności, poziom Łatwy (pkt Wiarygodności), §1. */
  wiarygodnoscStartLatwy:     40,
  /** Wartość startowa Wiarygodności, poziom Normalny (pkt Wiarygodności), §1. */
  wiarygodnoscStartNormalny:  20,
  /** Wartość startowa Wiarygodności, poziom Trudny (pkt Wiarygodności), §1. */
  wiarygodnoscStartTrudny:     0,

  // -- §2: KARY N1–N7 (pkt Wiarygodności, jednorazowo, wszystkie poziomy trudności) --
  /** N1 — wypowiedzenie wojny bez ostrzeżenia / atak w tej samej turze co deklaracja (pkt Wiarygodności, jednorazowo). */
  wiarygodnoscN1BezOstrzezenia:            -10,
  /** N1 — okno karencji: liczba tur po wypowiedzeniu wojny, w której atak jeszcze liczy się jako "bez ostrzeżenia" (tury). */
  wiarygodnoscN1KarencjaTur:                 1,
  /** N2 — wypowiedzenie wojny mimo aktywnego Paktu o Nieagresji (pkt Wiarygodności, jednorazowo). */
  wiarygodnoscN2ZlamaniePaktuNap:           -18,
  /** N2 — wypowiedzenie wojny mimo aktywnego Sojuszu (pełny/defensywny), także atak na sojusznika (pkt Wiarygodności, jednorazowo). */
  wiarygodnoscN2ZlamaniePaktuSojusz:        -25,
  /** N3 — atak w oknie karencji po zakończeniu porozumienia (pkt Wiarygodności, jednorazowo, na wierzchu N1/N2). */
  wiarygodnoscN3AtakWOknieKarencji:         -12,
  /** N3 — okno karencji (tury) po jednostronnym anulowaniu porozumienia BEZTERMINOWEGO lub po zawarciu pokoju, przed którym atak = kara N3. */
  wiarygodnoscN3KarencjaBezterminoweTur:     10,
  /** N4 — odmowa pomocy sojusznikowi na wezwanie obowiązku sojuszniczego, kara WYŁĄCZNIE dla odmawiającego (pkt Wiarygodności, jednorazowo). */
  wiarygodnoscN4OdmowaObowiazkuSojuszu:     -15,
  /** N5 — dobrowolne zerwanie traktatu CZASOWEGO (nie handlowego) (pkt Wiarygodności, jednorazowo). Bezterminowe = brak kary (patrz N3). */
  wiarygodnoscN5ZerwanieTraktatCzasowy:      -6,
  /** N5 — dobrowolne zerwanie umowy handlowej CZASOWEJ (pkt Wiarygodności, jednorazowo). */
  wiarygodnoscN5ZerwanieHandelCzasowy:       -4,
  /** N6 — niedotrzymanie handlu cyklicznego (3 tury z rzędu z winy strony), kara wyłącznie dla winnego (pkt Wiarygodności, jednorazowo). */
  wiarygodnoscN6NiedotrzymanieHandluCyklicznego: -2,
  /** N6 — próg kolejnych tur z rzędu z winy TEJ SAMEJ strony (dawca bez zapasu / biorca bez środków), po którym nalicza się kara (tury). */
  wiarygodnoscN6ProgTurZRzedu: 3,
  /** N7 — nieautoryzowany przemarsz, jednorazowo przy pierwszym wykryciu w danej "wizycie" (pkt Wiarygodności). Zwiadowcy wykluczeni (C-WIAR-SKAUT=A). */
  wiarygodnoscN7NieautoryzowanyPrzemarsz:    -2,
  /** Odwet (C-WIAR-ODWET=A) — okno (tury) od cudzego N1/N2/N4 wobec nas, w którym nasza odwetowa wojna NIE nalicza N1/N2. */
  wiarygodnoscOdwetOknoTur:                  10,

  // -- §3: NAGRODY — tabela A STRUMIEŃ (pkt Wiarygodności NA TURĘ, za każde aktualnie dotrzymywane zobowiązanie) --
  /** S1 — Sojusz (pełny lub defensywny) aktywny (pkt Wiarygodności / turę). */
  wiarygodnoscS1SojuszPerTure:      1.0,
  /** S2 — Pakt o nieagresji aktywny (pkt Wiarygodności / turę). */
  wiarygodnoscS2NapPerTure:         0.5,
  /** S3 — Umowa handlowa / handel cykliczny ze 100% zrealizowanych dostaw tej tury (pkt Wiarygodności / turę). */
  wiarygodnoscS3HandelPerTure:      0.3,
  /** S4 — Prawo przemarszu / otwarte granice aktywne (pkt Wiarygodności / turę). */
  wiarygodnoscS4PrzemarszPerTure:   0.2,

  // -- §3: NAGRODY — tabela B FINISZ (pkt Wiarygodności, jednorazowo, za dotrwanie do zapisanego terminu) --
  /** P1 — Sojusz dotrwany do końca (pkt Wiarygodności, jednorazowo). */
  wiarygodnoscP1FiniszSojusz:          10,
  /** P2 — Pakt o nieagresji dotrwany do końca (pkt Wiarygodności, jednorazowo). */
  wiarygodnoscP2FiniszNap:              5,
  /** P2 — Umowa handlowa dotrwana do końca (pkt Wiarygodności, jednorazowo). */
  wiarygodnoscP2FiniszHandel:           5,
  /** P3 — Handel cykliczny ze 100% dostaw aż do końca umowy (pkt Wiarygodności, jednorazowo). */
  wiarygodnoscP3FiniszHandelCykliczny:  1,

  // -- §3: NAGRODY — tabela C CZYNY (pkt Wiarygodności, jednorazowo, niepowiązane z trwającym zobowiązaniem) --
  /** P4 — kamień milowy "bez wojny" (pkt Wiarygodności, jednorazowo, powtarzalny co wiarygodnoscP4OknoBezWojnyTur tur). */
  wiarygodnoscP4BezWojny30Tur:          3,
  /** P4 — długość okna "bez wojny" wymaganego do naliczenia kamienia milowego (tury). */
  wiarygodnoscP4OknoBezWojnyTur:       30,
  /** P5 — pomoc sojusznikowi w wojnie, dołączenie z własnej woli LUB na wezwanie (pkt Wiarygodności, jednorazowo). */
  wiarygodnoscP5PomocSojusznikowi:     20,

  // -- §4: model zapominania — krzywa liniowa z trwałą podłogą (tury do osiągnięcia podłogi, wg trudności i znaku zdarzenia) --
  /** Czas zapomnienia KAR, poziom Łatwy (tury; 2,5%/turę). */
  wiarygodnoscCzasZapomnieniaKaraLatwy:      40,
  /** Czas zapomnienia KAR, poziom Normalny (tury; 1,25%/turę). */
  wiarygodnoscCzasZapomnieniaKaraNormalny:   80,
  /** Czas zapomnienia KAR, poziom Trudny (tury; 0,833%/turę). */
  wiarygodnoscCzasZapomnieniaKaraTrudny:    120,
  /** Czas zapomnienia NAGRÓD (FINISZ/CZYNY), poziom Łatwy (tury; 0,833%/turę). */
  wiarygodnoscCzasZapomnieniaNagrodaLatwy: 120,
  /** Czas zapomnienia NAGRÓD (FINISZ/CZYNY), poziom Normalny (tury; 1,25%/turę). */
  wiarygodnoscCzasZapomnieniaNagrodaNormalny: 80,
  /** Czas zapomnienia NAGRÓD (FINISZ/CZYNY), poziom Trudny (tury; 2,5%/turę). */
  wiarygodnoscCzasZapomnieniaNagrodaTrudny:  40,
  /** Trwała podłoga krzywej zapominania — ułamek [0,1] wartości pierwotnej, który zostaje NA ZAWSZE po pełnym wygaśnięciu (dotyczy WYŁĄCZNIE zdarzeń jednorazowych, nie STRUMIENIA — C-WIAR-SLAD=A). */
  wiarygodnoscTrwalaPodlogaProcent: 0.10,

  // -- §5: wpływ Wiarygodności na Zaufanie --
  /** Dzielnik strumienia Wiarygodność→Zaufanie: ΔZaufanie/turę = Wiarygodność / wartość (C-WIAR-SKALA=20). */
  wiarygodnoscZaufanieDzielnikPerTura: 20,
  /** Dźwignia 3 — twardy próg: Sojusz wymaga W >= wartość (pkt Wiarygodności), niezależnie od Zaufania/Respektu. */
  wiarygodnoscProgSojuszMin:  0,
  /** Dźwignia 3 — twardy próg: Pakt o Nieagresji wymaga W >= wartość (pkt Wiarygodności), niezależnie od Zaufania/Respektu. */
  wiarygodnoscProgNapMin:   -40,
} as const;

/**
 * Mutable, number-valued view of the DIPLOMACY_PARAMS keys. Used for overrides
 * (applyDiplomaticEvent) and the data loader, where values come from JSON / the
 * Dyplomacja.xlsx panel as plain numbers (not the `as const` literal types).
 */
export type DiplomacyParams = { -readonly [K in keyof typeof DIPLOMACY_PARAMS]: number };

/**
 * loadDiplomacyParams -- bridge data/diplomacy.json -> model parameter overrides.
 *
 * The human panel `panel_sterowania` (A-F, Polish) in Dyplomacja.xlsx stays the
 * source of truth for Naster; the targeted export writes a flat, machine-readable
 * `params` object (keys = DIPLOMACY_PARAMS keys) into diplomacy.json. This reader
 * turns that block into a Partial override.
 *
 * Defensive & pure: ignores missing / non-numeric / unknown keys; returns {} when
 * no usable `params` block is present (model then keeps DIPLOMACY_PARAMS defaults).
 *
 * SILNIK usage, once at init:
 *   const params = { ...DIPLOMACY_PARAMS, ...loadDiplomacyParams(diplomacyJson) };
 */
export function loadDiplomacyParams(json: unknown): Partial<DiplomacyParams> {
  const out: Partial<DiplomacyParams> = {};
  if (!json || typeof json !== 'object') return out;
  const params = (json as { params?: unknown }).params;
  if (!params || typeof params !== 'object') return out;
  const src = params as Record<string, unknown>;
  for (const key of Object.keys(DIPLOMACY_PARAMS) as (keyof typeof DIPLOMACY_PARAMS)[]) {
    const v = src[key];
    if (typeof v === 'number' && Number.isFinite(v)) {
      out[key] = v;
    }
  }
  return out;
}

/** Kanon + override z diplomacy.json (Panel-D export). Bez main.ts — czyta JSON przy bundlu. */
let _baseDiplomacyParams: DiplomacyParams | null = null;

/** Maciej 2026-07-21: ±10 na progi relacji/zaufania/respektu wg trudności (normal = baza JSON). */
export const DIPLOMACY_DIFFICULTY_DELTA: Record<GameDifficulty, number> = {
  easy:   -10,
  normal: 0,
  hard:   10,
};

/** Progi Relacji (0–200) — bramki traktatów/umów. Handel (progHandelRelacja) celowo poza listą — stały próg z JSON, bez ±trudność. */
const DIPLO_RELATION_THRESHOLD_KEYS: readonly (keyof DiplomacyParams)[] = [
  'progMinimalnyRelacja',
  'progSojuszRelacja',
  'progUmowaMinRelacja',
  'progNapRelacja',
  'progGraniceRelacja',
  'progPoboczneHandel',
  'progPoboczneWojna',
];

/** Progi Zaufania (0–100) — bramki akcji dyplomatycznych. */
const DIPLO_ZAUFANIE_THRESHOLD_KEYS: readonly (keyof DiplomacyParams)[] = [
  'progSojuszZaufanie',
  'progWymianaTechZaufanie',
  'progNamowWojneZaufanie',
  'progGraniceZaufanie',
  'progTrybutOfertaNearWarZaufanie',
  'progSojuszPremiaGracz2xMinZaufanie',
  'progSojuszPremiaGracz3xMinZaufanie',
];

/** Progi Respektu (0–100) — bramki trybutu/wasalizacji/granic wojskowych. */
const DIPLO_RESPEKT_THRESHOLD_KEYS: readonly (keyof DiplomacyParams)[] = [
  'progWasalizacjaRespekt',
  'progWchloniecieRespekt',
  'progGraniceWojskoweRespekt',
  'progTrybutZadanieMinRespekt',
  'progPoboczneAkceptacja',
];

/**
 * R-DYPLO-JSON-ZRODLO-PRAWDY-Q1=B — akcesor bazowych parametrów dyplomacji
 * (kanon + override z data/diplomacy.json), BEZ skalowania po trudności
 * (skalowanie żyje osobno w scaleDiplomacyParamsForDifficulty /
 * getEffectiveDiplomacyParams). Eksportowany, żeby moduły czytające
 * pojedyncze klucze (diplomacy-credibility.ts, diplomacy-layers.ts,
 * diplomacy-value-catalog.ts) przestały czytać surową stałą DIPLOMACY_PARAMS
 * z pominięciem JSON-a (nota N3, commit 2e67219). Memoizowany — patrz
 * `resetEffectiveDiplomacyParamsCache()` dla testów/hot-reload.
 */
export function getBaseDiplomacyParams(): DiplomacyParams {
  if (!_baseDiplomacyParams) {
    _baseDiplomacyParams = {
      ...DIPLOMACY_PARAMS,
      ...loadDiplomacyParams(diplomacyData),
    };
  }
  return _baseDiplomacyParams;
}

/** Skaluje wyłącznie progi bramek traktatów (nie bonusy, mnożniki ani willingness). */
export function scaleDiplomacyParamsForDifficulty(
  base: DiplomacyParams,
  difficulty: GameDifficulty = 'normal',
): DiplomacyParams {
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

/** Skala progu Relacji (np. prog_dar_relacja z pn_relacja). */
export function scaleRelationThreshold(
  base: number,
  difficulty: GameDifficulty = 'normal',
): number {
  return Math.max(0, Math.min(200, base + DIPLOMACY_DIFFICULTY_DELTA[difficulty]));
}

export function getEffectiveDiplomacyParams(
  difficulty: GameDifficulty = 'normal',
): DiplomacyParams {
  return scaleDiplomacyParamsForDifficulty(getBaseDiplomacyParams(), difficulty);
}

/** Testy / hot-reload — opcjonalnie reset cache. */
export function resetEffectiveDiplomacyParamsCache(): void {
  _baseDiplomacyParams = null;
}

/** Minimalna Relacja na dobrowolną umowę — nie poniżej progUmowaMinRelacja (Maciej: >150). */
export function diplomacyTreatyMinRelacja(
  adjustedThreshold: number,
  params: DiplomacyParams = getEffectiveDiplomacyParams(),
): number {
  return Math.max(params.progUmowaMinRelacja, adjustedThreshold);
}

/** Obniżka progów sojuszu gdy proponent ma przewagę Mocy / Respektu (Maciej v1.2). */
export interface DiplomacyStrengthEase {
  allyThresholdDelta: number;
  zaufanieThresholdDelta: number;
  scoreThresholdDelta: number;
}

export function diplomacyProposerStrengthEase(
  proposerMilRatio: number,
  proposerRespekt: number,
  responderRespekt: number,
  params: DiplomacyParams = getEffectiveDiplomacyParams(),
): DiplomacyStrengthEase {
  const milAdv = Math.max(0, proposerMilRatio - 1);
  const resAdv = Math.max(0, proposerRespekt - responderRespekt) / 100;
  let raw =
    milAdv * params.progSojuszPremiaMilSkok +
    resAdv * params.progSojuszPremiaRespektSkok;
  if (proposerMilRatio >= params.progSojuszPremiaGracz3xMilRatio) {
    raw += params.progSojuszPremiaGracz3xBonus;
  } else if (proposerMilRatio >= params.progSojuszPremiaGracz2xMilRatio) {
    raw += params.progSojuszPremiaGracz2xBonus;
  }
  const capped = Math.min(params.progSojuszPremiaSilniejszyMax, raw);
  return {
    allyThresholdDelta: capped,
    zaufanieThresholdDelta: Math.round(capped * 80),
    scoreThresholdDelta: Math.round(capped * 100),
  };
}

/** Minimalne Zaufanie na sojusz po premii/karze siły (progresywne podłogi 2×/3×). */
export function diplomacyAllianceMinZaufanie(
  adj: DiplomacyAllianceStrengthAdjust,
  proposerMilRatio: number,
  params: DiplomacyParams = getEffectiveDiplomacyParams(),
): number {
  let minZ = Math.max(
    0,
    params.progSojuszZaufanie - adj.ease.zaufanieThresholdDelta + adj.penaltyZ,
  );
  if (proposerMilRatio >= params.progSojuszPremiaGracz3xMilRatio) {
    minZ = Math.max(params.progSojuszPremiaGracz3xMinZaufanie, minZ);
  } else if (proposerMilRatio >= params.progSojuszPremiaGracz2xMilRatio) {
    minZ = Math.max(params.progSojuszPremiaGracz2xMinZaufanie, minZ);
  }
  return minZ;
}

/** v1.3 — premia proponenta + kara respondenta + strefa hegmona (Maciej 2026-06-30). */
export interface DiplomacyAllianceStrengthAdjust {
  ease: DiplomacyStrengthEase;
  penaltyZ: number;
  penaltyScore: number;
  penaltyAlly: number;
  allyWPenalty: number;
  /** Słaby proponent u hegmona — respondent odmawia sojuszu równoprawnego */
  hegemonBlocksAlliance: boolean;
  /** Silny proponent-hegemon — nie szuka sojuszu równoprawnego (AI→słabszy) */
  hegemonProposerNoAlliance: boolean;
}

export function diplomacyAllianceStrengthAdjust(
  proposerMilRatio: number,
  proposerRespekt: number,
  responderRespekt: number,
  params: DiplomacyParams = getEffectiveDiplomacyParams(),
): DiplomacyAllianceStrengthAdjust {
  const ease = diplomacyProposerStrengthEase(
    proposerMilRatio,
    proposerRespekt,
    responderRespekt,
    params,
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
    hegemonProposerNoAlliance: safeMil >= params.progSojuszHegemonProposerMaxMil,
  };
}

// ---------------------------------------------------------------------------
// sisterAllianceDiplomacyParams / sisterAllianceEligible
// (D-START posiłki v2 ZMIANA 1/2/4, Maciej 2026-07-21 przeróbka: posiłki między
//  siostrami TEGO SAMEGO klastra bramkowane sojuszem; próg sojuszu obniżony PER
//  POZIOM TRUDNOŚCI gry (nie osobna opcja setupu — usunięta, patrz newGameFlow.ts/
//  main.ts _menuDifficulty -> _menuCitySupport). SELEKTYWNY override — NIGDY nie
//  dotyka getEffectiveDiplomacyParams()/DIPLOMACY_PARAMS globalnie; main.ts woła to
//  wyłącznie dla par miasto-państwo↔miasto-państwo tego samego klastra, patrz
//  main.ts formSisterAlliancesIfThreatened().)
// ---------------------------------------------------------------------------

/**
 * Skala obniżenia progów sojuszu dla par sióstr tego samego klastra, PER POZIOM
 * trudności gry (Maciej 2026-07-21 przeróbka ZMIANA 2 — wyższa trudność = twardsze
 * miasta-państwa = łatwiejszy sojusz/mocniejsze posiłki):
 *   low    (Łatwy)   ×0,6  — sojusz trudniejszy niż na normal (mniej obniżony próg)
 *   normal (Normalny)×0,3  — dotychczasowa stała (zero regresji domyślnej)
 *   strong (Trudny)  ×0,15 — sojusz najłatwiejszy (próg najniżej obniżony)
 */
export const SISTER_ALLIANCE_THRESHOLD_SCALE: Record<'low' | 'normal' | 'strong', number> = {
  low:    0.6,
  normal: 0.3,
  strong: 0.15,
};

/**
 * Kopia DiplomacyParams z przeskalowanymi progami sojuszu (per `level`) — WYŁĄCZNIE
 * do użytku przy ocenie sojuszu między siostrami tego samego klastra. Twarda podłoga:
 * progSojuszRelacja nie schodzi poniżej progMinimalnyRelacja (jak w
 * diplomacyTreatyMinRelacja — Relacja < progMinimalnyRelacja = "dyplomacja prawie
 * niemożliwa", więc nawet zdyskontowany próg sojuszu nie może zejść poniżej tego dna).
 *
 * WAŻNE: `progUmowaMinRelacja` (globalnie 151 — "twarda podłoga na dobrowolne umowy,
 * premia siły NIE obniża") jest tu przeskalowany RAZEM z `progSojuszRelacja`
 * (do tej samej wartości). aiDiplomacyStance liczy próg sojuszu przez
 * diplomacyTreatyMinRelacja(adjustedThreshold, params) = max(params.progUmowaMinRelacja,
 * adjustedThreshold) — gdyby progUmowaMinRelacja został globalny (151), próg sojuszu
 * sióstr byłby ZAWSZE 151 niezależnie od skali (bug — obniżka nie miałaby efektu).
 * Dla par sióstr "twarda podłoga" to WŁAŚNIE ich własny, obniżony próg sojuszu.
 *
 * Nie zmienia `base` (immutable) ani globalnego getEffectiveDiplomacyParams().
 */
export function sisterAllianceDiplomacyParams(
  level: 'low' | 'normal' | 'strong' = 'normal',
  base: DiplomacyParams = getEffectiveDiplomacyParams(),
): DiplomacyParams {
  const scale = SISTER_ALLIANCE_THRESHOLD_SCALE[level];
  const scaledRelacja = Math.max(
    base.progMinimalnyRelacja,
    Math.round(base.progSojuszRelacja * scale),
  );
  return {
    ...base,
    progSojuszZaufanie: Math.round(base.progSojuszZaufanie * scale),
    progSojuszRelacja: scaledRelacja,
    progUmowaMinRelacja: scaledRelacja,
    progSojuszWillingnessMin: Math.round(
      base.progSojuszWillingnessMin * scale * 1000,
    ) / 1000,
  };
}

/**
 * Czy relacja (playerA,playerB) siostrzanych miast-państw tego samego klastra
 * kwalifikuje się do sojuszu, wg PEŁNEJ maszynerii dyplomacji (Maciej 2026-07-21
 * przeróbka ZMIANA 4 = Q2 odpowiedź B): realna ocena aiDiplomacyStance(...)
 * .willingnessAlly (relacja + przewaga militarna via diplomacyAllianceStrengthAdjust,
 * dokładnie jak gracz↔AI w evaluateProposal), tylko z OBNIŻONYM progiem tierowym
 * (`params` = sisterAllianceDiplomacyParams(poziom)) zamiast uproszczonego proxy
 * zaufanie/100 użytego poprzednio.
 *
 * Czysta funkcja, bez zależności od main.ts/aktywnych traktatów — caller (main.ts)
 * sam sprawdza, czy sojusz już istnieje, przed wywołaniem tej funkcji (patrz raport
 * pkt c). `playerA`/`playerB` — siostry mają typCywilizacji = TYP KLASTRA (nie
 * DrobnaCywilizacja) i `context.isMinorCiv` MUSI być false — inaczej aiDiplomacyStance
 * wejdzie na ścieżkę "minor civ" i willingnessAlly wyjdzie zawsze 0 (paragraph 5.2:
 * miasta-państwa nie zawierają sojuszy wojskowych z GRACZEM/AI głównym — to inna
 * ścieżka niż siostry tego samego klastra między sobą).
 */
export function sisterAllianceEligible(
  playerA: Player,
  playerB: Player,
  rel:     Relation,
  context: AIDiplomacyContext,
  params:  DiplomacyParams = sisterAllianceDiplomacyParams(),
): boolean {
  if (rel.status === 'wojna') return false;
  const stance = aiDiplomacyStance(playerA, playerB, rel, context, params);
  return stance.willingnessAlly >= params.progSojuszWillingnessMin;
}

// ---------------------------------------------------------------------------
// Clamp helper
// ---------------------------------------------------------------------------

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ---------------------------------------------------------------------------
// relationScore
// ---------------------------------------------------------------------------

/**
 * Returns the combined relation value: Zaufanie + Respekt (0-200).
 * This is "Relacja ogolna" from diplomacy.json panel_sterowania.B.
 * Formula: Relacja = Zaufanie * wagaZaufania + Respekt * wagaRespektu
 * (both weights = 1 per the spec's defaults).
 */
export function relationScore(rel: Relation): number {
  return clamp(
    rel.zaufanie * DIPLOMACY_PARAMS.mnoznikZaufania +
    rel.respekt  * DIPLOMACY_PARAMS.mnoznikRespektu,
    0,
    200
  );
}

// ---------------------------------------------------------------------------
// DiplomaticEvent type
// ---------------------------------------------------------------------------

/**
 * Events that can be passed to applyDiplomaticEvent.
 * Names come from diplomacy.json "Zdarzenie / Dzialanie" column and
 * Dyplomacja-szablon.md section 1 action names.
 */
export type DiplomaticEvent =
  // war / peace
  | 'wojna_wypowiedziana'       // declare war (no casus belli)
  | 'pokoj'                     // peace treaty accepted
  // commerce & treaties
  | 'handel'                    // trade deal concluded (one-shot bonus)
  | 'wspolny_wrog'              // mutual-enemy cooperation established
  // trust penalties
  | 'zlamana_obietnica'         // player broke a pact (-40 Zaufanie)
  | 'zlamana_obietnica_ai'      // AI broke a pact (-20 Zaufanie)
  | 'zdrada'                    // surprise attack (-50 Zaufanie)
  | 'tarcia_graniczne'          // border friction / expansion near border (one-shot -2)
  // trust bonuses
  | 'dar'                       // gift (free resource / Pieniadz)
  | 'wspolna_religia'           // same religion established (one-shot +1 seed)
  | 'pomoc_sojusznikowi'        // helped ally in war (+10 Zaufanie)
  // respect events
  | 'wygrana_bitwa'             // won a battle (+5 Respekt)
  | 'przewaga_militarna'        // crossed 2x or 5x military threshold (+15 Respekt)
  | 'slabszy_militarnie'        // player weaker than partner (-10 Respekt)
  | 'trybut_zaakceptowany'      // tribute demand accepted (+10 Respekt)
  // --- additional spec-faithful events (Dyplomacja-szablon.md section 1) ---
  // These deltas come from the section-1 action tables (NOT the section-3.3 /
  // diplomacy.json modifier table), so their values are inline literals below
  // rather than DIPLOMACY_PARAMS keys (which mirror diplomacy.json exactly).
  | 'wojna_casus_belli'         // 1.11 war WITH casus belli (-10 Relacja => -10 Zaufanie)
  | 'ultimatum_spelnione'       // 1.9 ultimatum met: addressee loses face (-5 Zaufanie)
  | 'ultimatum_bezpodstawne'    // 1.9 baseless ultimatum, low Respekt (-10 Zaufanie, -10 Respekt)
  | 'trybut_odmowa'             // 1.8 tribute demand refused (-10 Zaufanie; casus belli)
  | 'trybut_oferta_przyjeta'    // 1.8 tribute OFFER accepted: payer avoids attack (+5 Zaufanie)
  | 'wymiana_tech_gratis'       // 1.6 free technology exchange (+5 Zaufanie)
  | 'zerwanie_handlu'          // 1.5 zerwanie umowy handlowej (−10 Zaufanie; szablon §1.5: −15 Relacja/−10 Zaufanie)
  // --- Makieta DYPLOMACJA v1.1 domknięcie zaległości (2026-07-23) ---
  | 'zerwanie_traktatu';       // dobrowolne zerwanie traktatu (NAP/sojusz/granice/wasal) przez
                               // stronę — NIE wymuszone wojną (to 'zlamana_obietnica', -40,
                               // main.ts breakTreatiesOnWar). Kara mniejsza: -15 Zaufanie.

// ---------------------------------------------------------------------------
// applyDiplomaticEvent
// ---------------------------------------------------------------------------

/**
 * Applies a one-shot diplomatic event to a Relation and returns a NEW Relation
 * (immutable -- does NOT mutate the input).
 *
 * `params` is optional; defaults to DIPLOMACY_PARAMS. Pass a partial override
 * for testing different calibrations without changing the module constants.
 *
 * All values are clamped to [0, 100] per component after application.
 *
 * `wiarygodnosc` (WIAR-Q3=C): opcjonalny mnożnik tempa na dZ (nie dotyka dR).
 * Gdy pominięty — dZ bez mnożnika (np. para AI↔AI lub wojna).
 */
export function applyDiplomaticEvent(
  rel:    Relation,
  event:  DiplomaticEvent,
  params: Partial<DiplomacyParams> = {},
  wiarygodnosc?: number,
): Relation {
  const p = { ...DIPLOMACY_PARAMS, ...params };

  let dZ = 0;              // delta Zaufanie
  let dR = 0;              // delta Respekt
  let newStatus = rel.status;

  switch (event) {

    // ---- war / peace ----

    case 'wojna_wypowiedziana':
      // C-WIAR-N1-UX: deklaracja z karencją N1 (bez ataku w tej turze) nie obniża Zaufania.
      // Kara za złamanie traktatu → breakTreatiesOnWar ('zlamana_obietnica').
      // Kara za atak w tej samej turze → chargeCombatCredibilityPenalties (N1, Wiarygodność).
      newStatus = 'wojna';
      break;

    case 'pokoj':
      // paragraph 1.10: +5 Relacja after time -- soft approximation as +5 Zaufanie.
      dZ = 5;
      newStatus = 'pokoj';
      break;

    // ---- commerce & treaties ----

    case 'handel':
      // D3-W1-A: brak stałego bonusu zawarcia — Zaufanie tylko z nadmiaru PN (silnik).
      dZ = 0;
      break;

    case 'wspolny_wrog':
      // "Wspolny wrog -- nawiazanie kooperacji" +5 Zaufanie + +10 Respekt jednorazowo
      dZ = p.wspolnyWrogNawiazanie_zaufanie;
      dR = p.wspolnyWrogAkceptacja_respekt;
      break;

    // ---- trust penalties ----

    case 'zlamana_obietnica':
      // "Zlamany pakt przez gracza" -40 Zaufanie jednorazowo
      dZ = p.zlamanaPaktGracz_zaufanie;
      break;

    case 'zlamana_obietnica_ai':
      // "Zlamany pakt przez AI" -20 Zaufanie jednorazowo
      dZ = p.zlamanaPaktAI_zaufanie;
      break;

    case 'zdrada':
      // "Zdrada / atak z zaskoczenia" -50 Zaufanie jednorazowo
      dZ = p.zdrada_zaufanie;
      newStatus = 'wojna';
      break;

    case 'tarcia_graniczne':
      // "Ekspansja przy granicy" -- modelled as one-shot -2 Zaufanie
      dZ = p.ekspansjaGranica_zaufanie_perTura;
      break;

    // ---- trust bonuses ----

    case 'dar':
      // D4-WYMIANA-PN: Zaufanie z wartości PN (diplomacyGiftTrustFromPn w silniku), nie flat +6.
      dZ = 0;
      break;

    case 'wspolna_religia':
      // Approximated as one-shot seed: +1 Zaufanie (per-turn handled by engine)
      dZ = 1;
      break;

    case 'pomoc_sojusznikowi':
      // "Pomoc w wojnie sojusznikowi" +10 Zaufanie jednorazowo
      dZ = p.pomocSojusznikowi_zaufanie;
      break;

    // ---- respect events ----

    case 'wygrana_bitwa':
      // "Wygrana bitwa (historia bojowa)" +5 Respekt jednorazowo
      dR = p.wygraBitwa_respekt;
      break;

    case 'przewaga_militarna':
      // "Znaczaca przewaga militarna gracza" +15 Respekt jednorazowo
      dR = p.przewagaMilitarna_respekt;
      break;

    case 'slabszy_militarnie':
      // "Gracz slabszy militarnie od partnera" -10 Respekt jednorazowo
      dR = p.slabszyMilitarnie_respekt;
      break;

    case 'trybut_zaakceptowany':
      // "Akceptacja zadania trybutu" +10 Respekt jednorazowo
      dR = p.trybut_respekt;
      break;

    // ---- additional spec-faithful events (Dyplomacja-szablon.md section 1) ----

    case 'wojna_casus_belli':
      // 1.11 war WITH casus belli: -10 Relacja u wszystkich.
      // (Czysta deklaracja z karencją N1 — 'wojna_wypowiedziana' — nie obniża Zaufania.)
      dZ = -10;
      newStatus = 'wojna';
      break;

    case 'ultimatum_spelnione':
      // 1.9 ultimatum met: -5 Relacja (addressee loses face) -> -5 Zaufanie.
      dZ = -5;
      break;

    case 'ultimatum_bezpodstawne':
      // 1.9 baseless ultimatum (Respekt too low): -20 Relacja, -10 Zaufanie.
      // Split -10 Zaufanie + -10 Respekt ("smiech AI" = loss of respect) = -20 Relacja.
      dZ = -10;
      dR = -10;
      break;

    case 'trybut_odmowa':
      // 1.8 tribute demand refused: -10 Relacja (possible casus belli; status left to engine).
      dZ = -10;
      break;

    case 'trybut_oferta_przyjeta':
      // 1.8 tribute OFFER accepted -- payer avoids attack: +5 Relacja -> +5 Zaufanie.
      dZ = 5;
      break;

    case 'wymiana_tech_gratis':
      // 1.6 free technology exchange (no payment): +5 Zaufanie.
      dZ = 5;
      break;

    case 'zerwanie_handlu':
      // Dyplomacja-szablon.md §1.5: zerwanie umowy handlowej.
      // Szablon podaje: −15 Relacja / −10 Zaufanie; modelujemy −10 Zaufanie
      // (Relacja = Zaufanie + Respekt, więc −10 Z = −10 Relacja bez dotykania R).
      dZ = -10;
      break;

    case 'zerwanie_traktatu':
      // Dobrowolne zerwanie traktatu (przycisk „Zerwij" — Makieta DYPLOMACJA v1.1):
      // -15 Zaufanie jednorazowo. Mniejsze niż 'zlamana_obietnica' (-40), bo to
      // świadoma decyzja BEZ złamania w trakcie wojny/ataku.
      dZ = -15;
      break;
  }

  dZ = applyWiarygodnoscTempoDoDelty(dZ, wiarygodnosc);

  const newZ = clamp(rel.zaufanie + dZ, 0, 100);
  const newR = clamp(rel.respekt  + dR, 0, 100);

  return clampRelationForWar({
    zaufanie: newZ,
    respekt:  newR,
    status:   newStatus,
  });
}

/**
 * Maks. score (Zaufanie + Respekt) w stanie wojny — nastawienie co najmniej „Wrogi"
 * (relationTier / nastawienieLabelFromScore: score < progMinimalnyRelacja = 30).
 */
export const WAR_RELATION_SCORE_CAP = DIPLOMACY_PARAMS.progMinimalnyRelacja - 1;

/** Czy para jest w stanie wojny (slim Relation.status lub pełne RelacjaDyplomatyczna.stanWojny). */
export function isRelationAtWar(
  rdip: Pick<Relation, 'status'> | Pick<RelacjaDyplomatyczna, 'stanWojny'>,
): boolean {
  const slim = rdip as Relation;
  if (slim.status === 'wojna') return true;
  const stan = (rdip as RelacjaDyplomatyczna).stanWojny;
  return stan === StanWojny.Wojna || stan === StanWojny.CasusBelli;
}

/**
 * W stanie wojny score relacji nie może utrzymywać nastawienia „Przyjazny"/„Życzliwy".
 * Obniża Zaufanie, potem Respekt, do WAR_RELATION_SCORE_CAP (29).
 */
export function clampRelationForWar(rel: Relation): Relation {
  if (rel.status !== 'wojna') return rel;
  const score = relationScore(rel);
  if (score <= WAR_RELATION_SCORE_CAP) return rel;
  let excess = score - WAR_RELATION_SCORE_CAP;
  let z = rel.zaufanie;
  let r = rel.respekt;
  const takeZ = Math.min(excess, z);
  z -= takeZ;
  excess -= takeZ;
  r = Math.max(0, r - excess);
  return { ...rel, zaufanie: z, respekt: r };
}

// ---------------------------------------------------------------------------
// AIDiplomacyContext
// ---------------------------------------------------------------------------

/**
 * Context snapshot fed to aiDiplomacyStance.
 * All values are plain numbers -- no DOM / game-loop references.
 */
export interface AIDiplomacyContext {
  /** Is the AI player a minor/peripheral civilization (DrobnaCywilizacja)? */
  isMinorCiv: boolean;
  /**
   * Ratio of AI military power to other player's military power.
   * > 1 means AI is stronger; < 1 means AI is weaker.
   * Corresponds to "Stosunek wojska gracza do wojska partnera" (sekcja A, waga 25%).
   */
  militaryRatio: number;
  /** Current game turn. */
  currentTurn: number;
  /**
   * Number of turns the current war (if any) has been going on.
   * 0 when at peace.
   */
  turnsAtWar: number;
}

// ---------------------------------------------------------------------------
// AIDiplomacyStance result
// ---------------------------------------------------------------------------

/**
 * Willingness scores returned by aiDiplomacyStance.
 * All values in [0, 1]: 0 = will never, 1 = will always.
 * The game engine maps these to actual probability / decision thresholds.
 */
export interface AIDiplomacyStance {
  /**
   * Willingness to declare war on the other player.
   * Driven by Respekt (hard power), archetype aggression, and low relation.
   */
  willingnessWar: number;
  /**
   * Willingness to accept or propose a peace treaty.
   * High when losing (low militaryRatio), long war, or moderate Zaufanie.
   */
  willingnessPeace: number;
  /**
   * Willingness to engage in trade (UmowaHandlowa).
   * High when relationScore is above progMinimalnyRelacja (30).
   */
  willingnessTrade: number;
  /**
   * Willingness to form or accept a SojuszWojskowy.
   * Requires Zaufanie >= progSojuszZaufanie (91) AND Relacja >= progSojuszRelacja (151).
   */
  willingnessAlly: number;
}

// ---------------------------------------------------------------------------
// Archetype aggression table (from Dyplomacja-szablon.md paragraph 4)
// ---------------------------------------------------------------------------

/**
 * Base aggression coefficient per civilization type (0 = pacifist, 1 = maximally aggressive).
 * Derived from "Tendencja do wojny" column in Dyplomacja-szablon.md paragraph 4.
 */
export const ARCHETYPE_AGGRESSION: Record<TypCywilizacji, number> = {
  [TypCywilizacji.Grecy]:             0.40,
  [TypCywilizacji.Rzymianie]:         0.75,
  [TypCywilizacji.Chinczycy]:         0.20,
  [TypCywilizacji.Inkowie]:           0.45,
  [TypCywilizacji.Zulusi]:            0.90,
  [TypCywilizacji.Egipt]:             0.35,
  [TypCywilizacji.Babilon]:           0.30,
  [TypCywilizacji.Sumer]:             0.30,
  [TypCywilizacji.Celtowie]:          0.60,
  [TypCywilizacji.Germanie]:          0.65,
  [TypCywilizacji.Harappa]:           0.20,
  [TypCywilizacji.Hetyci]:            0.50,
  [TypCywilizacji.Slowianie]:         0.60,
  [TypCywilizacji.Babilonia]:         0.40,
  [TypCywilizacji.Asyria]:            0.80,
  [TypCywilizacji.Fenicjanie]:        0.30,
  [TypCywilizacji.DrobnaCywilizacja]: 0.15,
};

export const ARCHETYPE_TRADE: Record<TypCywilizacji, number> = {
  [TypCywilizacji.Grecy]:             0.75,
  [TypCywilizacji.Rzymianie]:         0.50,
  [TypCywilizacji.Chinczycy]:         0.85,
  [TypCywilizacji.Inkowie]:           0.25,
  [TypCywilizacji.Zulusi]:            0.20,
  [TypCywilizacji.Egipt]:             0.60,
  [TypCywilizacji.Babilon]:           0.65,
  [TypCywilizacji.Sumer]:             0.65,
  [TypCywilizacji.Celtowie]:          0.35,
  [TypCywilizacji.Germanie]:          0.30,
  [TypCywilizacji.Harappa]:           0.80,
  [TypCywilizacji.Hetyci]:            0.50,
  [TypCywilizacji.Slowianie]:         0.40,
  [TypCywilizacji.Babilonia]:         0.60,
  [TypCywilizacji.Asyria]:            0.30,
  [TypCywilizacji.Fenicjanie]:        0.90,
  [TypCywilizacji.DrobnaCywilizacja]: 0.60,
};

// ---------------------------------------------------------------------------
// aiDiplomacyStance
// ---------------------------------------------------------------------------

/**
 * Returns the AI player's stance toward another player based on:
 *   - Current Relation (Zaufanie + Respekt)
 *   - DIPLOMACY_PARAMS thresholds (sekcja C)
 *   - Civilization archetype tendencies (Dyplomacja-szablon.md paragraph 4)
 *   - Context (military ratio, war duration)
 *
 * Minor civs (DrobnaCywilizacja) use the simplified rule from paragraph 5.2:
 *   - Mostly neutral; rarely initiate war (willingnessWar capped ~0.15)
 *   - Easy to trade when Relacja > 30
 *   - Accept almost everything when player Respekt > 60
 *   - Cannot form military alliances (willingnessAlly = 0)
 *
 * `params` optional override (Maciej 2026-07-21 — D-START posiłki v2 ZMIANA 4):
 * domyślnie globalne getEffectiveDiplomacyParams() (gracz↔AI, zero regresji).
 * Caller może podać przeskalowane progi sojuszu (np. sisterAllianceDiplomacyParams())
 * do oceny par sióstr tego samego klastra — WYŁĄCZNIE ally-related computation
 * (minAllyZ/minAllyScore/adj) korzysta z `params`; reszta funkcji (war/peace/trade)
 * używa tych samych pól `p`, więc override wpływa też na nie -- zamierzone dla
 * pełnej maszynerii sióstr (main.ts formSisterAlliancesIfThreatened), NIE dotyka
 * globalnego stanu (getEffectiveDiplomacyParams() cache nietknięty).
 *
 * All logic is pure / deterministic.
 */
export function aiDiplomacyStance(
  aiPlayer:    Player,
  otherPlayer: Player,
  rel:         Relation,
  context:     AIDiplomacyContext,
  params:      DiplomacyParams = getEffectiveDiplomacyParams(),
): AIDiplomacyStance {
  // Suppress unused-variable warning for otherPlayer (available for future use).
  void otherPlayer;

  const score = relationScore(rel);
  const { zaufanie, respekt } = rel;
  const p = params;

  if (!aiPlayer?.typCywilizacji || !otherPlayer?.typCywilizacji) {
    return {
      willingnessWar: 0,
      willingnessPeace: 0.5,
      willingnessTrade: 0.3,
      willingnessAlly: 0,
    };
  }

  // ---- Minor civ simplified path (paragraph 5.2) ----
  if (context.isMinorCiv || aiPlayer.typCywilizacji === TypCywilizacji.DrobnaCywilizacja) {
    // When player Respekt is high, minor civs accept almost anything.
    const fearFactor = respekt > p.progPoboczneAkceptacja
      ? 0.9
      : respekt / p.progPoboczneAkceptacja;

    // Minor civs trade easily when Relacja > 30.
    const tradeOpen = score > p.progPoboczneHandel ? 0.6 : 0.2;

    // Minor civs only fight if pushed very hard (Relacja very low).
    const warWilling = score < p.progPoboczneWojna ? 0.2 : 0.05;

    return {
      willingnessWar:   warWilling,
      willingnessPeace: fearFactor,
      willingnessTrade: tradeOpen,
      willingnessAlly:  0,  // minor civs cannot form military alliances (paragraph 2 table)
    };
  }

  // ---- Full AI path (main civilizations) ----

  const archAggression = resolveArchetypeAggression(
    aiPlayer.typCywilizacji,
    ARCHETYPE_AGGRESSION[aiPlayer.typCywilizacji] ?? 0.40,
  );
  const archTrade = resolveArchetypeTrade(
    aiPlayer.typCywilizacji,
    ARCHETYPE_TRADE[aiPlayer.typCywilizacji] ?? 0.50,
  );

  // -- War willingness --
  // Higher Respekt (military superiority) + archetype aggression + low Relacja -> war.
  // Not applicable when already at war.
  let warW = 0;
  if (rel.status !== 'wojna') {
    const respektNorm = respekt / 100;
    const relPenalty  = 1 - clamp(score / 200, 0, 1);
    warW = clamp(
      archAggression * 0.50 +
      respektNorm    * 0.30 +
      relPenalty     * 0.20,
      0, 1
    );
  }

  // -- Peace willingness --
  // High when: weaker militarily, war drags on, or moderate goodwill.
  let peaceW: number;
  if (rel.status === 'wojna') {
    const warWeariness     = clamp(context.turnsAtWar / 20, 0, 0.50);
    const militaryPressure = context.militaryRatio < 1
      ? (1 - context.militaryRatio) * 0.40
      : 0;
    const goodwill = (zaufanie / 100) * 0.20;
    peaceW = clamp(warWeariness + militaryPressure + goodwill, 0, 1);
  } else {
    // Not at war: willing to maintain peace by default.
    peaceW = 0.80;
  }

  // -- Trade willingness --
  // Only above the minimum relation threshold (Relacja >= 30).
  let tradeW = 0;
  if (score >= p.progMinimalnyRelacja) {
    const relFactor = clamp(score / 200, 0, 1) * 0.40;
    tradeW = clamp(archTrade * 0.60 + relFactor, 0, 1);
  }

  // -- Alliance willingness --
  // context.militaryRatio = M_AI / M_rozmówcy (>1 = AI silniejsze).
  const aiMilOverOther = Math.max(0.01, context.militaryRatio);
  const otherMilOverAi = aiMilOverOther > 0 ? 1 / aiMilOverOther : 99;
  const aiRespektShare = respekt;
  const otherRespektShare = Math.max(0, 100 - respekt);
  const adj = diplomacyAllianceStrengthAdjust(
    otherMilOverAi,
    otherRespektShare,
    aiRespektShare,
    p,
  );
  let minAllyZ = diplomacyAllianceMinZaufanie(adj, otherMilOverAi, p);
  let minAllyScore = diplomacyTreatyMinRelacja(
    p.progSojuszRelacja - adj.ease.scoreThresholdDelta + adj.penaltyScore,
    p,
  );

  let allyW = 0;
  if (!adj.hegemonBlocksAlliance && zaufanie >= minAllyZ && score >= minAllyScore) {
    const loyaltyBonus: number =
      aiPlayer.typCywilizacji === TypCywilizacji.Chinczycy ? 0.20
      : aiPlayer.typCywilizacji === TypCywilizacji.Inkowie ? 0.15
      : aiPlayer.typCywilizacji === TypCywilizacji.Grecy   ? 0.10
      : aiPlayer.typCywilizacji === TypCywilizacji.Zulusi  ? -0.20
      : 0;
    const trustFactor  = (zaufanie / 100) * 0.60;
    const scoreFactor  = clamp((score - p.progSojuszRelacja) / 80, 0, 0.30);
    allyW = clamp(trustFactor + loyaltyBonus + scoreFactor, 0, 1);
    // Słabsze AI + silniejszy rozmówca → pragmatyczny sojusz pod protekcją.
    if (aiMilOverOther < 1) {
      allyW = clamp(
        allyW + (1 - aiMilOverOther) * p.progSojuszPremiaSilniejszyInny,
        0,
        1,
      );
    } else if (aiMilOverOther > 1) {
      // Hegemon / silniejsze AI — mniejsza motywacja sojuszu równoprawnego.
      allyW = clamp(allyW - adj.allyWPenalty, 0, 1);
    }
  }

  return {
    willingnessWar:   parseFloat(warW.toFixed(4)),
    willingnessPeace: parseFloat(peaceW.toFixed(4)),
    willingnessTrade: parseFloat(tradeW.toFixed(4)),
    willingnessAlly:  parseFloat(allyW.toFixed(4)),
  };
}

// ---------------------------------------------------------------------------
// Utility: build a default starting Relation for a pair of players
// ---------------------------------------------------------------------------

/**
 * Creates the initial Relation for two players at game start.
 * Applies:
 *   - startZaufanie (20) + startRespekt (30) as base
 *   - "Rywalizacja tego samego typu (start gry)" -20 Zaufanie when same TypCywilizacji
 *   - "Duza roznica kulturowa (rozny typ)" -5 Zaufanie when types differ and neither minor
 */
export function initialRelation(
  playerA: Player,
  playerB: Player
): Relation {
  const p = getEffectiveDiplomacyParams();
  const baseTotal = p.startZaufanie + p.startRespekt;
  let zaufanie = p.startZaufanie
    + nastawienieBazoweZaufanieDelta(playerA.typCywilizacji, baseTotal)
    + nastawienieBazoweZaufanieDelta(playerB.typCywilizacji, baseTotal);

  if (playerA.typCywilizacji === playerB.typCywilizacji) {
    // "Rywalizacja tego samego typu (start gry)" -20 Zaufanie
    zaufanie += p.rywalizacjaTenSamTyp_zaufanie;
  } else if (
    playerA.typCywilizacji !== TypCywilizacji.DrobnaCywilizacja &&
    playerB.typCywilizacji !== TypCywilizacji.DrobnaCywilizacja
  ) {
    // "Duza roznica kulturowa (rozny typ)" -5 Zaufanie
    zaufanie += p.roznicaKulturowa_zaufanie;
  }

  return {
    zaufanie: clamp(zaufanie, 0, 100),
    respekt:  p.startRespekt,
    status:   'neutralni',
  };
}

// ---------------------------------------------------------------------------
// Utility: project RelacjaDyplomatyczna -> Relation
// ---------------------------------------------------------------------------

/**
 * Projects a RelacjaDyplomatyczna (full game-state object) into the slim
 * Relation value object used by this module's pure functions.
 *
 * Status mapping:
 *   StanWojny.Wojna | CasusBelli -> 'wojna'
 *   StanWojny.Rozejm | Pokoj     -> 'pokoj' (or 'sojusz' if treaty present)
 *   default (no war)             -> 'sojusz' if treaty present, else 'neutralni'
 */
export function toRelation(rdip: RelacjaDyplomatyczna): Relation {
  const hasSojusz = rdip.traktaty.some(t => t.rodzaj === 'sojusz_wojskowy');

  let status: Relation['status'];
  switch (rdip.stanWojny) {
    case StanWojny.Wojna:
    case StanWojny.CasusBelli:
      status = 'wojna';
      break;
    case StanWojny.Rozejm:
    case StanWojny.Pokoj:
      status = hasSojusz ? 'sojusz' : 'pokoj';
      break;
    default:
      status = hasSojusz ? 'sojusz' : 'neutralni';
  }

  return {
    zaufanie: rdip.zaufanie,
    respekt:  rdip.respekt,
    status,
  };
}

// ---------------------------------------------------------------------------
// relationTier -- 5-stopniowa skala UI (0=Wojna .. 4=Sojusz)
// ---------------------------------------------------------------------------

/**
 * Human-readable names for each tier (indexed by tier number 0-4).
 * Used by the UI to label the diplomatic status of a relation.
 */
export const TIER_NAMES = ['Wojna', 'Wrogi', 'Neutralny', 'Przyjazny', 'Sojusz'] as const;

/**
 * Maps a Relation to one of five UI tiers:
 *   0 = Wojna      (status === 'wojna', overrides score)
 *   1 = Wrogi      (score <  30  = DIPLOMACY_PARAMS.progMinimalnyRelacja)
 *   2 = Neutralny  (score <  60  -- fixed midpoint between progMinimalny/progSojusz)
 *   3 = Przyjazny  (score < 151  = DIPLOMACY_PARAMS.progSojuszRelacja)
 *   4 = Sojusz     (status === 'sojusz' overrides score; OR score >= 151)
 *
 * Status is SOVEREIGN over score:
 *   - 'wojna'  -> always 0, regardless of score
 *   - 'sojusz' -> always 4, regardless of score
 */
export function relationTier(rel: Relation): 0 | 1 | 2 | 3 | 4 {
  if (rel.status === 'wojna')  return 0;
  if (rel.status === 'sojusz') return 4;

  const s = relationScore(rel);
  if (s < DIPLOMACY_PARAMS.progMinimalnyRelacja) return 1; // Wrogi  (< 30)
  if (s < 60)                                    return 2; // Neutralny (< 60)
  if (s < DIPLOMACY_PARAMS.progSojuszRelacja)    return 3; // Przyjazny (< 151)
  return 4;                                                // Sojusz (>= 151)
}

// ---------------------------------------------------------------------------
// PotegaKomponenty + PotegaWagi + computePotegaNacji
// (CYWILIZACJE lane — warstwa 1 modelu Respektu)
// ---------------------------------------------------------------------------

/**
 * Znormalizowane komponenty potęgi nacji dostarczane przez SILNIK.
 * Kazdy komponent ∈ [0, 1]:
 *   0 = absolutna słabość w danym aspekcie
 *   1 = pełna dominacja
 *
 * Zrodla:
 *   UNITS     → wielkoscArmii, wygraneBitwy
 *   MIASTO     → ludnosc, rekruci, miasta
 *   EKONOMIA  → gospodarka
 *   SILNIK    → epoka (indeks epoki znorm., np. Kamien=0, Braz=0.5, Zelazo=1.0)
 */
export interface PotegaKomponenty {
  /** Absolutna wielkość armii (liczba jednostek bojowych), znorm. [0,1]. */
  wielkoscArmii: number;
  /** Skumulowana historia wygranych bitew, znorm. [0,1]. */
  wygraneBitwy:  number;
  /** Sumaryczna ludność absolutna (mieszkańcy), znorm. [0,1]. */
  ludnosc:       number;
  /** Pula rekrutów (Manpower bieżący), znorm. [0,1]. */
  rekruci:       number;
  /** Liczba miast / kontrolowane terytorium, znorm. [0,1]. */
  miasta:        number;
  /** Poziom ekonomiczny (skarbiec/dochod), znorm. [0,1]. */
  gospodarka:    number;
  /** Postep technologiczny (indeks epoki), znorm. [0,1]. */
  epoka:         number;
}

/**
 * Wagi skladnikow Potegi — suma powinna wynosic ~100 (procenty).
 * Domyslne wartosci = panel_sterowania A z data/diplomacy.json ("respekt_-_czynniki").
 * Maciej stroi wagi w panelu; CYWILIZACJE stosuje tu wynik.
 */
export interface PotegaWagi {
  wielkoscArmii: number; // 24
  wygraneBitwy:  number; // 17
  ludnosc:       number; // 15
  rekruci:       number; // 15
  miasta:        number; // 12
  gospodarka:    number; // 10
  epoka:         number; // 7
}

/**
 * Domyslne wagi Potegi (Maciej 2026-06-26: ludnosc 15% + rekruci 15%, reszta skalowana).
 * Suma = 100. Militaria (armia+bitwy) = 41%.
 */
export const DEFAULT_POTEGA_WAGI: PotegaWagi = {
  wielkoscArmii: 24,
  wygraneBitwy:  17,
  ludnosc:       15,
  rekruci:       15,
  miasta:        12,
  gospodarka:    10,
  epoka:          7,
};

/**
 * Oblicza wewnetrzna Potege nacji (0..100) jako wazona sume znormalizowanych komponentow.
 *
 * Wzor: clamp(round(Σ komponenty[k] * wagi[k]), 0, 100)
 *   (wagi[k] w procentach, suma ≈ 100; komponenty[k] ∈ [0,1])
 *
 * Wynik:
 *   100 = nacja dominuje we wszystkich aspektach
 *   ~50 = srednia potega
 *   0   = nacja minimalna we wszystkich aspektach
 *
 * SILNIK wywoluje raz na ture per nacja, wynik przekazuje do computeRespekt.
 * Funkcja jest czysta (pure fn) — nie czyta zadnych zewnetrznych modulow.
 *
 * @param k  znormalizowane komponenty [0,1] dostarczone przez SILNIK
 * @param w  wagi skladnikow w % (domyslnie DEFAULT_POTEGA_WAGI)
 * @returns  Potega ∈ [0, 100]
 */
export function computePotegaNacji(
  k: PotegaKomponenty,
  w: PotegaWagi = DEFAULT_POTEGA_WAGI,
): number {
  const raw =
    k.wielkoscArmii * w.wielkoscArmii +
    k.wygraneBitwy  * w.wygraneBitwy  +
    k.ludnosc       * w.ludnosc       +
    k.rekruci       * w.rekruci       +
    k.miasta        * w.miasta        +
    k.gospodarka    * w.gospodarka    +
    k.epoka         * w.epoka;
  return clamp(Math.round(raw), 0, 100);
}

// ---------------------------------------------------------------------------
// computeRespekt — relatywna potega (ratio-share, warstwa 2)
// ---------------------------------------------------------------------------

/**
 * Oblicza Respekt (0..100) jako relatywna moc nacji self wobec partnera.
 * Formula: ratio-share (V1 — zwyciezca turnieju formul w SPEC-Respekt.md).
 *
 * Wzor: round(100 * potega_self / (potega_self + potega_partner))
 *   Guard: potega_self + potega_partner == 0  →  50 (parytet, brak danych)
 *   Clamp: wynik ∈ [0, 100]
 *
 * Wlasnosci:
 *   50  = parytet sil (obie nacje rowno silne)
 *   >50 = self silniejszy niz partner (partner sie boi/powaza)
 *   <50 = self slabszy niz partner (self powinien ulec)
 *
 * Odporne na skale: podwojenie sil obu stron nie zmienia Respektu.
 * Asymetria: computeRespekt(A,B) + computeRespekt(B,A) = 100.
 *
 * SILNIK wywoluje computePotegaNacji(k_self) + computePotegaNacji(k_partner),
 * nastepnie computeRespekt(potega_self, potega_partner) raz/ture per para.
 * Wynik zapisuje do RelacjaDyplomatyczna.respekt.
 *
 * @param potegaSelf     potega nacji obliczajace Respekt (wynik computePotegaNacji) 0..100
 * @param potegaPartner  potega nacji partnera (wynik computePotegaNacji) 0..100
 * @returns Respekt ∈ [0, 100]
 */
export function computeRespekt(
  potegaSelf:    number,
  potegaPartner: number,
): number {
  const sum = potegaSelf + potegaPartner;
  if (sum === 0) return 50; // guard: brak danych -> parytet
  return clamp(Math.round(100 * potegaSelf / sum), 0, 100);
}

/**
 * Stosunek siły wojskowej self / partner (M armii na polu, nie headcount).
 * >1 = self silniejszy; <1 = self słabszy.
 * Integrator: podmiana w main.ts (buildProposalEvalContext + pętla AI dyplo).
 */
export function computeMilitaryRatioFromArmyM(
  armyMSelf: number,
  armyMPartner: number,
): number {
  const self = Math.max(0, armyMSelf);
  const partner = Math.max(0, armyMPartner);
  if (partner > 0) return self / partner;
  return self > 0 ? 2 : 1;
}

// ---------------------------------------------------------------------------
// tickDiplomacy -- per-turowe przesunięcie RelacjaDyplomatycznej (immutable)
// ---------------------------------------------------------------------------

/**
 * Kontekst per-turowy przekazywany do tickDiplomacy.
 * Flagi odzwierciedlają aktywne stany relacji w danej turze.
 * SILNIK ustawia flagi na podstawie traktatów, ustawień mapy i AI.
 */
/** Wzajemnie wykluczające tiery naturalnego budowania Zaufania (Maciej 2026-07-21). */
export type PokojTrustTier = 'sojusz' | 'nap' | 'pokoj';

export interface TickCtx {
  /** Numer bieżącej tury (używany do wygasania traktatów i zaniku urazów). */
  turn: number;
  /** Czy aktywna UmowaHandlowa? (+1 Zaufanie/turę, stackuje z tierem pokoju). */
  aktywnyHandel?:       boolean;
  /**
   * Tier pokoju: sojusz (+3) > NAP (+2) > kontakt pokojowy (+1).
   * Wymaga braku wojny; tier pokoju wymaga nawiązanego kontaktu dyplomatycznego.
   */
  pokojTrustTier?:      PokojTrustTier;
  /** @deprecated — użyj pokojTrustTier (2026-07-21) */
  aktywnyPakt?:         boolean;
  /** Czy aktywny efekt dobrej woli (podarunek)? (+1 Zaufanie/turę). */
  dobraWolaAktywna?:   boolean;
  /** Czy trwa kooperacja "wspólny wróg"? (+1 Zaufanie/turę). */
  wspolnyWrog?:         boolean;
  /** Czy gracze wyznają tę samą religię? (+0.5 Zaufanie/turę). */
  wspolnaReligia?:      boolean;
  /** Czy gracze wyznają odmienne religie? (-0.5 Zaufanie/turę). */
  odmiennaReligia?:     boolean;
  /** Czy gracz rozbudowuje się przy granicy partnera? (-2 Zaufanie/turę). */
  ekspansjaPrzyGranicy?: boolean;
  /**
   * REL-WIARYG-DRIFT-Q1 — globalna Wiarygodność strony (nie per para), źródło
   * pasywnego dryfu Zaufania `zaufanieDryfOdWiarygodnosci(W)` (niezależnego od umów).
   * `undefined` = brak dryfu (SILNIK: para w wojnie — C-WIAR-WROG=A).
   */
  wiarygodnoscSelf?: number;
}

/**
 * Przesuwa RelacjaDyplomatyczną o jedną turę do przodu i zwraca NOWY obiekt
 * (immutable — nie mutuje wejścia).
 *
 * Efekty per-turowe (DIPLOMACY_PARAMS):
 *   handel (UmowaHandlowa) +1 Zaufanie (stackuje)
 *   pokojTrustTier: sojusz +3 | nap +2 (wzajemnie wykluczające; tier „pokoj" bez umowy
 *     zastąpiony dryfem z Wiarygodności — REL-WIARYG-DRIFT-Q1)
 *   wiarygodnoscSelf: pasywny ΔZ/turę = clamp(W,±100)×0,03 (niezależny od umów);
 *     po zsumowaniu dZ — mnożnik tempa WIAR-Q3=C (`applyWiarygodnoscTempoDoDelty`)
 *   dobraWola      +1 Zaufanie
 *   wspolnyWrog    +1 Zaufanie
 *   wspolnaReligia +0.5 Zaufanie  (TODO: cap akumulacyjny +15/−10 per religia)
 *   odmiennaReligia −0.5 Zaufanie (TODO: cap −10 dla odmiennej religii)
 *   ekspansja      −2 Zaufanie
 *
 * Zanik urazów: co 20 tur (turn % 20 === 0) urazyHistoryczne zmniejszają się
 * o krok urazyHistoryczne_zaufanie_perTura (2) ku 0 (nie przekraczają 0).
 * Urazy historyczne są przechowywane jako osobne pole i nie są podwajane
 * w deltach Zaufania (silnik może odczytać to pole osobno gdy potrzebne).
 *
 * Wygasające traktaty: usuwane gdy wygasaTura !== null && wygasaTura <= turn.
 * relacjaOgolna = zaufanie + respekt (pole pochodne, aktualizowane po każdym tick).
 *
 * TODO: Akumulatory per-religia (+15/−10 cap) — uproszczenie na przyszłość.
 */
export function computeTickZaufanieDelta(ctx: TickCtx, atWar: boolean): number {
  const p = getEffectiveDiplomacyParams();
  let dZ = 0;

  if (!atWar && ctx.wiarygodnoscSelf !== undefined) {
    dZ += zaufanieDryfOdWiarygodnosci(ctx.wiarygodnoscSelf);
  }

  if (ctx.aktywnyHandel) dZ += p.handel_zaufanie_perTura;
  const peaceTier = ctx.pokojTrustTier
    ?? (ctx.aktywnyPakt ? 'nap' as PokojTrustTier : undefined);
  switch (peaceTier) {
    case 'sojusz': dZ += p.sojusz_zaufanie_perTura; break;
    case 'nap':    dZ += p.nap_zaufanie_perTura; break;
    // tier „pokoj" (+1) zastąpiony dryfem z W (REL-WIARYG-DRIFT-Q1)
  }
  if (ctx.dobraWolaAktywna)     dZ += p.dobraWola_zaufanie_perTura;
  if (ctx.wspolnyWrog)          dZ += p.wspolnyWrog_zaufanie_perTura;
  if (ctx.wspolnaReligia)       dZ += p.wspolnaReligia_zaufanie_perTura;
  if (ctx.odmiennaReligia)      dZ += p.odmiennaReligia_zaufanie_perTura;
  if (ctx.ekspansjaPrzyGranicy) dZ += p.ekspansjaGranica_zaufanie_perTura;

  dZ = applyWiarygodnoscTempoDoDelty(dZ, ctx.wiarygodnoscSelf);

  if (atWar && dZ > 0) dZ = 0;

  return dZ;
}

export function tickDiplomacy(rdip: RelacjaDyplomatyczna, ctx: TickCtx): RelacjaDyplomatyczna {
  const p = getEffectiveDiplomacyParams();

  const atWar = isRelationAtWar(rdip);

  const dZ = computeTickZaufanieDelta(ctx, atWar);

  // --- zanik urazów historycznych co 20 tur ---
  // main.ts trzyma slim Relation (bez traktaty/urazy) — guard dla bezpiecznego ticku.
  let noweUrazy = rdip.urazyHistoryczne ?? 0;
  if (ctx.turn % 20 === 0 && noweUrazy !== 0) {
    // urazyHistoryczne_zaufanie_perTura jest ujemne (-2); bierzemy wartość bezwzględną jako krok zaniku.
    const krok = Math.abs(p.urazyHistoryczne_zaufanie_perTura); // 2
    if (noweUrazy > 0) {
      noweUrazy = Math.max(0, noweUrazy - krok);
    } else {
      noweUrazy = Math.min(0, noweUrazy + krok);
    }
  }

  // --- wygasanie traktatów ---
  const traktatyList = Array.isArray(rdip.traktaty) ? rdip.traktaty : [];
  const aktywne = traktatyList.filter(
    t => t.wygasaTura === null || t.wygasaTura > ctx.turn,
  );

  // Wojna: brak narastania Zaufania (umowy pokojowe wyłączone w main.ts).

  // --- clamp Zaufania i przelicz relacjaOgolna ---
  const slimStatus = (rdip as unknown as Relation).status;
  const tickedRel = clampRelationForWar({
    zaufanie: clamp(rdip.zaufanie + dZ, 0, 100),
    respekt:  rdip.respekt,
    status:   atWar ? 'wojna' : (slimStatus ?? 'pokoj'),
  });
  const noweZaufanie = tickedRel.zaufanie;
  const nowyRespekt  = tickedRel.respekt;
  const nowaRelacja  = noweZaufanie + nowyRespekt;

  return {
    ...rdip,
    zaufanie:         noweZaufanie,
    respekt:          nowyRespekt,
    relacjaOgolna:    nowaRelacja,
    traktaty:         aktywne,
    urazyHistoryczne: noweUrazy,
  };
}
