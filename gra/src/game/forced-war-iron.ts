import {
  isRestingFromForcedWar,
  pickForcedWarTargetId,
  restoreForcedWarState,
  serializeForcedWarState,
  shouldEndForcedWarByCityCount,
  type ForcedWarPairState,
  type ForcedWarSaveState,
} from './forced-war-common';

/**
 * forced-war-iron.ts — R-EPOKA-ZELAZO-WYMUSZONA-WOJNA-Q1 (ECHO właściciela 2026-08-27:
 * „wymuszone wojny w każdej epoce powinny być wyłączone całkowicie z ogólnych reguł
 * prowadzenia wojny. Inaczej nigdy nie nastąpiłaby wojna pomiędzy cywilizacjami",
 * rejestr `R-DYPLO-WYMUSZONA-WOJNA-POZA-OGOLNYMI-REGULAMI-Q1`).
 *
 * Kamień (`forced-war-stone.ts`) i Brąz (`forced-war-bronze.ts`) mają własny mechanizm
 * wojny wymuszonej; Żelazo — trzecia i ostatnia epoka gry (`KOLEJNOSC_EPOK =
 * ['Kamien','Braz','Zelazo']`) — nie miało żadnego. Ten plik domyka trzecią epokę.
 *
 * WYZWALACZ = AWANS EPOKI (dispatch §PARAMETR). Żelazo, tak jak Brąz, jest epoką osiąganą
 * przez awans (a nie epoką startową jak Kamień), więc mechanizm naśladuje Brąz, a nie
 * Kamień: gdy główna cywilizacja AI (NIE miasto-państwo, NIE gracz, NIE barbarzyńca)
 * wchodzi do epoki Żelaza i nie jest w ŻADNEJ aktywnej wojnie (ani jako napastnik, ani jako
 * obrońca), wypowiada wojnę jednemu sąsiadowi terytorialnemu.
 *
 * R-WOJNA-WYMUSZONA-ZELAZO-PROG-TURY-Q1 (2026-09-03, ODWRACA poniższe zdanie z pierwszego
 * tematu): próg tury JEDNAK istnieje, analogicznie do Brązu —
 * `WOJNA_ZELAZO_WYMUSZONA_START_TURY_OD_EPOKI` (25 tur od WEJŚCIA TEGO OWNERA w Żelazo, nie
 * od startu gry) blokuje wybuch wojny zbyt szybko po awansie, tak samo jak w Brązie. Zdanie
 * poniżej („sztywny próg tury byłby tu bez sensu") było ŚWIADOMĄ decyzją poprzedniego tematu
 * (`R-EPOKA-ZELAZO-WYMUSZONA-WOJNA-Q1`) — zostaje jako ślad historii decyzji, NIE jako
 * aktualny opis zachowania: „Sztywny próg tury byłby tu bez sensu — do Żelaza cywilizacje
 * docierają w bardzo różnych turach" [NIEAKTUALNE od 2026-09-03 — próg per-owner, liczony
 * od `eraEnterTurn`, rozwiązuje dokładnie ten problem, tak jak już rozwiązywał go w Brązie].
 *

 * POZOSTAŁE TRZY PARAMETRY SĄ IDENTYCZNE Z BRĄZEM I KAMIENIEM (2 miasta = koniec wojny,
 * 20 tur odpoczynku, 20 tur cooldownu na tego samego rywala) — dziś nie ma żadnej
 * przesłanki, żeby epoka Żelaza miała inny rytm konfliktu niż Brąz. Gdyby właściciel
 * podał inne liczby dla Żelaza, zmienia się WYŁĄCZNIE trzy stałe niżej.
 *
 * Wojna kończy się automatycznym pokojem, gdy jedna strona zdobędzie LUB straci
 * `WOJNA_ZELAZO_WYMUSZONA_MAX_MIASTA_ZDOBYTE_LUB_STRACONE` miast na rzecz drugiej. Po
 * pokoju cywilizacja odpoczywa `WOJNA_ZELAZO_WYMUSZONA_ODPOCZYNEK_TUR` tur, po czym szuka
 * NOWEGO celu (niekoniecznie tego samego) — do tej samej cywilizacji wraca dopiero po
 * `WOJNA_ZELAZO_WYMUSZONA_COOLDOWN_TA_SAMA_CYWILIZACJA_TUR` turach (silnik main.ts
 * realizuje to niestandardowym czasem blokady DOW przekazanym do `startPeaceTreatyLock`,
 * czyli tym samym mechanizmem co zwykły `PEACE_TREATY_LOCK_TURNS`, tylko z inną liczbą
 * tur dla tej konkretnej pary).
 *
 * Miasta-państwa NIGDY nie są celem ani napastnikiem: napastnik przechodzi przez
 * `isOwnerClusterCityState(ownerId, …)` + `ownerId > 0` w main.ts, a pula kandydatów jest
 * filtrowana tym samym `isOwnerClusterCityState(oid, …)`. NAPASTNIK jest zawsze AI
 * (`ownerId > 0`) — to się nie zmieniło. CEL natomiast, od P-WOJNA-WYMUSZONA-TRZY-NAPRAWY-Q1
 * (2026-08-30, NOWA DECYZJA właściciela, zastępuje wcześniejsze „gracz to ownerId 0, więc
 * nie trafia do puli celów"), MOŻE być graczem — pula kandydatów w main.ts dokłada `0` do
 * źródła jawnie (`[0, ...aiOwnerList]`) i filtruje `oid >= 0` zamiast `oid > 0`, więc gracz
 * konkuruje o bycie celem na równi z resztą AI (najbliższy geograficznie wygrywa, tak jak
 * każdy inny kandydat).
 *
 * Sojusze/pakty z INNYMI cywilizacjami niż cel tej wojny NIE są zrywane — silnik używa
 * tego samego kanału wypowiadania wojny co reaktywna dyplomacja AI (`decideAIDiplomacy` →
 * main.ts komenda `wypowiedz_wojne` → `breakTreatiesOnWar`), a `treatiesBrokenByWar`
 * zrywa WYŁĄCZNIE traktaty MIĘDZY stronami tej jednej wojny. Sojusz z SAMYM CELEM blokuje
 * wybór tego celu (main.ts `ironBlockedOwnerIds` + guard `hasAllianceTreaty` w `ai.ts`) —
 * tak samo jak poprawka B3 rundy 2 w Brązie.
 *
 * EN: Iron-era forced war — the third and last era of the game, previously the only one
 * without a forced-war mechanism. Trigger is the ERA ADVANCE into Iron (like Bronze), not
 * a turn threshold (like Stone), because Iron is reached at wildly different turns per civ.
 * All other parameters match Bronze 1:1. City-states are never attacker nor target; the
 * attacker is always AI. The PLAYER, however, is now (2026-08-30 decision) an eligible
 * target on equal footing with AI — superseding the earlier "player never a target" rule.
 * Alliances/pacts with uninvolved third civs survive; an alliance with the target itself
 * excludes that target from the candidate pool.
 *
 * Wszystkie funkcje w tym pliku są CZYSTE (bez DOM/mutacji) — stanowe wiązanie (mapy per
 * owner/para, hak przy przejęciu miasta, hak przy awansie epoki) żyje w main.ts.
 */

/** Numer epoki Żelaza w `ERA_ID_TO_NUM` (`kamien:1, braz:2, zelazo:3`) — próg awansu wyzwalającego mechanizm. / EN: Iron era number; crossing into it arms the mechanism. */
export const EPOKA_ZELAZO_NUMER = 3;

/** Próg zdobytych/utraconych miast kończący wojnę wymuszoną Żelaza automatycznym pokojem. / EN: city-count threshold (either side) that auto-ends an Iron forced war. */
export const WOJNA_ZELAZO_WYMUSZONA_MAX_MIASTA_ZDOBYTE_LUB_STRACONE = 2;

/**
 * Tur odpoczynku po zawarciu pokoju wojny wymuszonej Żelaza, zanim cywilizacja zacznie
 * szukać NOWEGO celu (może być inna cywilizacja niż poprzednia).
 * EN: rest turns after an Iron forced-war peace before the civ looks for a new target.
 */
export const WOJNA_ZELAZO_WYMUSZONA_ODPOCZYNEK_TUR = 20;

/**
 * Cooldown przed ponownym wybraniem TEJ SAMEJ cywilizacji jako celu wojny wymuszonej
 * Żelaza po zakończeniu poprzedniej wojny wymuszonej między tą samą parą. Wartość jak
 * w Brązie/Kamieniu (dispatch §PARAMETR — brak przesłanki na inny rytm dla Żelaza).
 * EN: cooldown before re-targeting the SAME rival after an Iron forced war between that
 * specific pair has ended. Same value as Bronze/Stone.
 */
export const WOJNA_ZELAZO_WYMUSZONA_COOLDOWN_TA_SAMA_CYWILIZACJA_TUR = 20;

/**
 * R-WOJNA-WYMUSZONA-ZELAZO-PROG-TURY-Q1 (ECHO właściciela 2026-09-03, po doprecyzowaniu
 * ABC): próg startu Żelaza, analogiczny do `WOJNA_WYMUSZONA_START_TURY_OD_EPOKI` w
 * `forced-war-bronze.ts` — ALE mierzony od tury WEJŚCIA TEGO OWNERA w epokę Żelaza
 * (`ironEraEnterTurnByOwner` w main.ts, ustawiane w `syncOwnerEraFromResearch` w chwili
 * `isIronEraEntry`), NIE od startu gry ani od wejścia w Brąz — cywilizacje wchodzą w
 * Żelazo w bardzo różnych turach, więc "25 tur od początku epoki" musi być per-owner,
 * tak jak w Brązie.
 *
 * ŚWIADOMIE ZDEFINIOWANA LOKALNIE, nie zaimportowana z `forced-war-bronze.ts`: Brąz jest
 * poza allowlistą tego tematu do EDYCJI, a import samej stałej (bez edycji pliku źródłowego)
 * byłby formalnie dozwolony, ale tworzyłby zależność modułową Żelazo→Brąz, której dziś nie
 * ma (oba pliki importują wyłącznie ze wspólnego `forced-war-common.ts`, nigdy jeden z
 * drugiego) — sprzeczną z jawną izolacją epok udokumentowaną w komentarzu nagłówkowym tego
 * pliku („osobny rejestr stanu w main.ts, żadne pole nie jest współdzielone"). Duplikacja
 * jednej liczby (25) jest tańsza niż nowa zależność między dwoma plikami epok, które mają
 * pozostać niezależne (gdyby właściciel podał w przyszłości inny próg dla Żelaza, zmienia
 * się WYŁĄCZNIE ta jedna stała, bez ryzyka zmiany Brązu przy okazji).
 */
export const WOJNA_ZELAZO_WYMUSZONA_START_TURY_OD_EPOKI = 25;

export interface IronForcedWarEligibilityInput {
  /** Czy owner to główna cywilizacja AI (NIE miasto-państwo, NIE gracz, NIE barbarzyńca). */
  isMainAiCiv: boolean;
  /**
   * Czy owner jest już w JAKIEJKOLWIEK wojnie w chwili awansu — jako napastnik LUB jako
   * obrońca (ta sama zasada co w Brązie: „jeżeli jakiejś cywilizacji została już
   * wypowiedziana wojna, to nie ma już obowiązku wypowiadać komuś innemu wojny").
   */
  isAlreadyAtWarAnyRole: boolean;
  /**
   * R-WOJNA-WYMUSZONA-ZELAZO-PROG-TURY-Q1: bieżąca tura gry i tura wejścia TEGO ownera w
   * Żelazo — OPCJONALNE (nie wymagane), analogicznie do `BronzeForcedWarEligibilityInput`:
   * brak jednego z dwóch pól POMIJA próg CAŁKOWICIE (traktowany jak spełniony), żeby
   * wywołania sprzed tej naprawy (istniejące testy `forced-war-iron*-test.cjs` bez tych
   * pól) NIE straciły eligibility milcząco. main.ts (jedyny produkcyjny wołający) ZAWSZE
   * przekazuje oba pola.
   */
  currentTurn?: number;
  eraEnterTurn?: number;
}

/**
 * Czy w ogóle wolno rozważać wymuszoną wojnę Żelaza dla tego ownera w tej chwili
 * (jednorazowy check przy awansie do Żelaza). EN: whether this owner may even be
 * considered for an Iron forced war right now (one-shot check on the era advance).
 */
export function isEligibleForIronForcedWar(inp: IronForcedWarEligibilityInput): boolean {
  const turnThresholdMet = inp.currentTurn === undefined || inp.eraEnterTurn === undefined
    ? true
    : inp.currentTurn - inp.eraEnterTurn >= WOJNA_ZELAZO_WYMUSZONA_START_TURY_OD_EPOKI;
  return inp.isMainAiCiv && !inp.isAlreadyAtWarAnyRole && turnThresholdMet;
}

/**
 * Czy TA zmiana epoki jest wejściem do Żelaza (wyzwalacz mechanizmu). Świadomie
 * `prev < 3 && next >= 3`, a nie `prev === 2 && next === 3`: `computeMainCivEraFromResearch`
 * awansuje pętlą `while`, więc jedna synchronizacja może przenieść cywilizację o więcej niż
 * jedną epokę (np. 1→3, gdy komplet technologii i cudów wpada w tej samej turze) — sztywna
 * równość zgubiłaby wtedy wyzwalacz. Warunek jest ścisłym nadzbiorem `2→3` i nie może
 * odpalić fałszywie (epoka nigdy nie maleje).
 * EN: whether this era change is an ENTRY into Iron. Deliberately `prev < 3 && next >= 3`
 * rather than a strict `2 → 3`, because the era computation advances in a `while` loop and
 * can cross more than one era at once; the condition is a strict superset of `2 → 3` and
 * cannot fire spuriously (eras never decrease).
 */
export function isIronEraEntry(prevEra: number, nextEra: number): boolean {
  return prevEra < EPOKA_ZELAZO_NUMER && nextEra >= EPOKA_ZELAZO_NUMER;
}

export interface IronForcedWarNeighborCandidate {
  ownerId: number;
  /** Reprezentatywny hex terytorium tej cywilizacji (np. najbliższe do niej miasto). */
  q: number;
  r: number;
}

export interface PickIronForcedWarTargetOpts {
  /** OwnerIds wykluczone z wyboru — NAP, peaceLocked (w tym cooldown tej samej pary), aktywny sojusz, już wyeliminowani itd. */
  blockedOwnerIds?: ReadonlySet<number>;
}

/**
 * Wybiera NAJBLIŻSZEGO terytorialnie kandydata do wymuszonej wojny Żelaza — ten sam
 * wspólny rdzeń (`pickForcedWarTargetId`) co Kamień i Brąz. Kandydaci to WYŁĄCZNIE główne
 * cywilizacje AI (filtr puli robi main.ts) — filtr sąsiedztwa realizuje się przez wybór
 * minimalnego dystansu, nie przez sztywny promień. Remisy rozstrzyga niższy ownerId
 * (deterministycznie). Zwraca `null`, gdy po odfiltrowaniu `blockedOwnerIds` nic nie zostaje.
 * EN: picks the territorially NEAREST candidate for an Iron forced war; ties break on lower
 * ownerId for determinism; `null` when nothing is left after `blockedOwnerIds` filtering.
 */
export function pickIronForcedWarTargetId(
  candidates: ReadonlyArray<IronForcedWarNeighborCandidate>,
  referenceHex: { q: number; r: number } | undefined,
  hexDistanceFn: (aq: number, ar: number, bq: number, br: number) => number,
  opts?: PickIronForcedWarTargetOpts,
): number | null {
  return pickForcedWarTargetId(
    candidates,
    referenceHex,
    hexDistanceFn,
    opts?.blockedOwnerIds ?? new Set<number>(),
  );
}

/**
 * Czy wojna wymuszona Żelaza kończy się TERAZ automatycznym pokojem — jedna ze stron
 * zdobyła LUB straciła `threshold` miast na rzecz drugiej (co pierwsze nastąpi).
 * EN: whether the Iron forced war auto-resolves into peace RIGHT NOW.
 */
export function shouldEndIronForcedWarByCityCount(
  citiesCapturedByAttacker: number,
  citiesCapturedByDefender: number,
  threshold: number = WOJNA_ZELAZO_WYMUSZONA_MAX_MIASTA_ZDOBYTE_LUB_STRACONE,
): boolean {
  return shouldEndForcedWarByCityCount(
    citiesCapturedByAttacker,
    citiesCapturedByDefender,
    threshold,
  );
}

/**
 * Czy cywilizacja jest jeszcze w okresie odpoczynku po pokoju wojny wymuszonej Żelaza
 * (nie szuka nowego celu). EN: whether the civ is still resting after an Iron forced-war
 * peace (not searching for a new target yet).
 */
export function isRestingFromIronForcedWar(
  currentTurn: number,
  restUntilTurn: number | undefined,
): boolean {
  return isRestingFromForcedWar(currentTurn, restUntilTurn);
}

// ---------------------------------------------------------------------------
// Save/load. Serializacja/deserializacja CZYSTA tu, żeby dało się jej dowieść roundtripem
// BEZ bundlowania całego main.ts (main.ts tylko woła te dwie funkcje przy
// buildSaveGameSnapshot/restoreGameFromSave i wstawia/czyta wynik z pól
// `meta.ironForceWar*`) — dokładnie jak B5 w Brązie.
// EN: save/load kept pure here so a roundtrip can be proven without bundling main.ts.
// ---------------------------------------------------------------------------

export type IronForcedWarPairState = ForcedWarPairState;

/** Kształt 4 pól stanu wojny wymuszonej Żelaza tak, jak trafiają do `SaveGame.meta`. */
export type IronForcedWarSaveState = ForcedWarSaveState;

/**
 * Zrzuca 4 struktury stanu (Set/Set/Map/Map) do zwykłych tablic gotowych pod JSON —
 * ten sam kształt co reszta `meta` w `buildSaveGameSnapshot` (`Array.from(...)`).
 */
export function serializeIronForcedWarState(
  pendingOwners: ReadonlySet<number>,
  cycleOwners: ReadonlySet<number>,
  restUntilByOwner: ReadonlyMap<number, number>,
  activeByPairKey: ReadonlyMap<string, IronForcedWarPairState>,
): IronForcedWarSaveState {
  return serializeForcedWarState(
    pendingOwners,
    cycleOwners,
    restUntilByOwner,
    activeByPairKey,
  );
}

/**
 * Odtwarza 4 struktury stanu z zapisu. Brak `saved` (zapis sprzed tego mechanizmu) LUB
 * brak pojedynczego pola → bezpieczny pusty stan dla TEGO pola (mechanizm po prostu
 * nieaktywny dla tej gry, zero błędu) — nigdy `undefined`/wyjątek.
 * EN: restores the 4 state structures from a save; a missing field yields a safe empty
 * state for that field, never an exception.
 */
export function restoreIronForcedWarState(
  saved: Partial<IronForcedWarSaveState> | undefined,
): {
  pendingOwners: Set<number>;
  cycleOwners: Set<number>;
  restUntilByOwner: Map<number, number>;
  activeByPairKey: Map<string, IronForcedWarPairState>;
} {
  return restoreForcedWarState(saved);
}
