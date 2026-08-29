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
 * forced-war-bronze.ts — R-EPOKA-BRAZU-WYMUSZONA-WOJNA (Maciej 2026-08-09, decyzja ECHO A
 * + doprecyzowanie, `dyspozycje/PYTANIA-OTWARTE.md`). RUNDA 2 (Evaluator FAIL runda 1,
 * 6 poprawek blokujących — patrz `dyspozycje/PYTANIA-OTWARTE.md` „Evaluator RUNDA 1: FAIL").
 *
 * Gdy główna cywilizacja AI (NIE miasto-państwo, NIE gracz) awansuje do epoki Brąz i nie
 * jest w ŻADNEJ aktywnej wojnie (ani jako napastnik, ani jako obrońca), wypowiada wojnę
 * jednemu sąsiadowi terytorialnemu. Wojna kończy się automatycznym pokojem, gdy jedna
 * strona zdobędzie LUB straci `WOJNA_WYMUSZONA_MAX_MIASTA_ZDOBYTE_LUB_STRACONE` miast na
 * rzecz drugiej. Po pokoju cywilizacja odpoczywa `WOJNA_WYMUSZONA_ODPOCZYNEK_TUR` tur, po
 * czym szuka NOWEGO celu (może być inna cywilizacja, niekoniecznie ta sama) — do tej samej
 * cywilizacji wraca dopiero po `WOJNA_WYMUSZONA_COOLDOWN_TA_SAMA_CYWILIZACJA_TUR` turach
 * (silnik main.ts realizuje to niestandardowym czasem trwania blokady DOW przekazanym do
 * `startPeaceTreatyLock`, czyli tym samym mechanizmem co zwykły `PEACE_TREATY_LOCK_TURNS`,
 * tylko z inną liczbą tur dla tej konkretnej pary).
 *
 * Sojusze/pakty z INNYMI cywilizacjami niż cel tej wojny NIE są zrywane — silnik używa
 * tego samego kanału wypowiadania wojny co reaktywna dyplomacja AI (`decideAIDiplomacy` →
 * main.ts komenda `wypowiedz_wojne` → `breakTreatiesOnWar`), a `treatiesBrokenByWar` z
 * `diplomacy-treaties.ts` zrywa WYŁĄCZNIE traktaty MIĘDZY stronami tej jednej wojny, nigdy
 * traktaty z trzecią cywilizacją (patrz test T4 w `forced-war-bronze-test.cjs`).
 *
 * RUNDA 2 — sojusz z SAMYM CELEM (nie z trzecią stroną) TERAZ blokuje wybór tego celu
 * (B3): silnik (main.ts `bronzeBlockedOwnerIds` + `ai.ts` guard `hasAllianceTreaty`)
 * wyklucza z puli kandydatów każdego, z kim ownerId ma dziś aktywny sojusz
 * (`allianceFormalKindBetween` z `diplomacy-treaties.ts` != null) — zgodnie z życzeniem
 * Macieja „cywilizacje nie powinny przy wypowiadaniu wojen zrywać sojuszy czy paktowania".
 *
 * EN: When a major AI civilization (not a city-state, not the player) advances into the
 * Bronze era and is not currently at war in ANY role (attacker or defender), it force-
 * declares war on one territorial neighbor. The war auto-resolves into peace once either
 * side captures/loses N cities to the other; afterwards the civ rests before it starts
 * looking for a new (possibly different) target, and a longer cooldown blocks re-targeting
 * the SAME rival specifically. Alliances/pacts with uninvolved third civs survive, because
 * this reuses the existing war-declaration pipeline whose treaty-breaking is pair-scoped.
 * ROUND 2 — an active alliance WITH THE TARGET ITSELF now excludes that target from the
 * candidate pool (B3), enforced both when main.ts picks the target and as a redundant
 * guard in ai.ts's decideAIDiplomacy.
 *
 * Wszystkie funkcje w tym pliku są CZYSTE (bez DOM/mutacji) — stanowe wiązanie (mapy per
 * owner/para, hak przy przejęciu miasta, hak przy awansie epoki) żyje w main.ts.
 */

/** Próg zdobytych/utraconych miast kończący wojnę wymuszoną automatycznym pokojem. / EN: city-count threshold (either side) that auto-ends a forced war into peace. */
export const WOJNA_WYMUSZONA_MAX_MIASTA_ZDOBYTE_LUB_STRACONE = 2;

/**
 * Tur odpoczynku po zawarciu pokoju wojny wymuszonej, zanim cywilizacja zacznie szukać
 * NOWEGO celu (może być inna cywilizacja niż poprzednia, niekoniecznie ta sama).
 * EN: rest turns after a forced-war peace before the civ looks for a new (possibly
 * different) target.
 */
export const WOJNA_WYMUSZONA_ODPOCZYNEK_TUR = 20;

/**
 * ROBOCZE ZAŁOŻENIE (Maciej NIE podał liczby — zdanie urwane „nie będzie atakować tej
 * samej cywilizacji przez okres [???] tur", patrz `dyspozycje/PYTANIA-OTWARTE.md`
 * R-EPOKA-BRAZU-WYMUSZONA-WOJNA pkt 6, ⚠️ do potwierdzenia). Cooldown przed ponownym
 * wybraniem TEJ SAMEJ cywilizacji jako celu wojny wymuszonej po zakończeniu poprzedniej
 * wojny wymuszonej między tą samą parą. Zmień TĘ JEDNĄ liczbę, gdy Maciej poda właściwą.
 * EN: WORKING ASSUMPTION — Maciej's sentence was cut off before he named a number; change
 * this ONE constant once he confirms the real value. Cooldown before re-targeting the SAME
 * rival after a forced war between that specific pair has ended.
 */
export const WOJNA_WYMUSZONA_COOLDOWN_TA_SAMA_CYWILIZACJA_TUR = 20;

export interface BronzeForcedWarEligibilityInput {
  /** Czy owner to główna cywilizacja AI (NIE miasto-państwo, NIE gracz, NIE barbarzyńca). */
  isMainAiCiv: boolean;
  /**
   * Czy owner jest już w JAKIEJKOLWIEK wojnie w chwili awansu — jako napastnik LUB jako
   * obrońca (Maciej, dopisek 2026-08-09: „jeżeli jakiejś cywilizacji została już
   * wypowiedziana wojna [przez kogoś innego], to ta cywilizacja nie ma już obowiązku
   * wypowiadać komuś innemu wojny").
   */
  isAlreadyAtWarAnyRole: boolean;
}

/**
 * Czy w ogóle wolno rozważać wymuszoną wojnę Brązu dla tego ownera w tej chwili (jednorazowy
 * check przy awansie). EN: whether this owner may even be considered for a Bronze forced war
 * right now (one-shot check on era advance).
 */
export function isEligibleForBronzeForcedWar(inp: BronzeForcedWarEligibilityInput): boolean {
  return inp.isMainAiCiv && !inp.isAlreadyAtWarAnyRole;
}

export interface BronzeForcedWarNeighborCandidate {
  ownerId: number;
  /** Reprezentatywny hex terytorium tej cywilizacji (np. najbliższe do niej miasto). */
  q: number;
  r: number;
}

export interface PickBronzeForcedWarTargetOpts {
  /** OwnerIds wykluczone z wyboru — NAP, peaceLocked (w tym cooldown tej samej pary), aktywny sojusz (B3), już wyeliminowani itd. */
  blockedOwnerIds?: ReadonlySet<number>;
}

/**
 * Wybiera NAJBLIŻSZEGO terytorialnie kandydata do wymuszonej wojny Brązu — wzorem
 * `pickClusterCityStateWarTargetId` (`city-state-difficulty.ts`), ale kandydaci to
 * WSZYSTKIE główne cywilizacje AI (nie tylko krąg startowy) — filtr sąsiedztwa realizuje
 * się przez wybór minimalnego dystansu, nie przez sztywny promień. Remisy rozstrzyga
 * niższy ownerId (deterministyczne, zgodne z konwencją `clusterTargetsSorted` w main.ts).
 * Zwraca `null`, gdy brak kandydatów po odfiltrowaniu `blockedOwnerIds`.
 * EN: picks the territorially NEAREST candidate for a Bronze forced war — same pattern as
 * `pickClusterCityStateWarTargetId`, but candidates are ALL major AI civs, not just the
 * starting cluster; ties break on lower ownerId for determinism. `null` when nothing is left
 * after `blockedOwnerIds` filtering.
 */
export function pickBronzeForcedWarTargetId(
  candidates: ReadonlyArray<BronzeForcedWarNeighborCandidate>,
  referenceHex: { q: number; r: number } | undefined,
  hexDistanceFn: (aq: number, ar: number, bq: number, br: number) => number,
  opts?: PickBronzeForcedWarTargetOpts,
): number | null {
  return pickForcedWarTargetId(
    candidates,
    referenceHex,
    hexDistanceFn,
    opts?.blockedOwnerIds ?? new Set<number>(),
  );
}

/**
 * Czy wojna wymuszona kończy się TERAZ automatycznym pokojem — jedna ze stron zdobyła LUB
 * straciła `threshold` miast na rzecz drugiej (co pierwsze nastąpi).
 * EN: whether the forced war auto-resolves into peace RIGHT NOW — either side hit the city
 * threshold (whichever comes first).
 */
export function shouldEndBronzeForcedWarByCityCount(
  citiesCapturedByAttacker: number,
  citiesCapturedByDefender: number,
  threshold: number = WOJNA_WYMUSZONA_MAX_MIASTA_ZDOBYTE_LUB_STRACONE,
): boolean {
  return shouldEndForcedWarByCityCount(
    citiesCapturedByAttacker,
    citiesCapturedByDefender,
    threshold,
  );
}

/**
 * Czy cywilizacja jest jeszcze w okresie odpoczynku po zawartym pokoju wojny wymuszonej (nie
 * szuka nowego celu). EN: whether the civ is still resting after a forced-war peace (not
 * searching for a new target yet).
 */
export function isRestingFromBronzeForcedWar(
  currentTurn: number,
  restUntilTurn: number | undefined,
): boolean {
  return isRestingFromForcedWar(currentTurn, restUntilTurn);
}

// ---------------------------------------------------------------------------
// B5 (Evaluator runda 1, FAIL blokujący): save/load. Serializacja/deserializacja
// CZYSTA tu, żeby dało się jej dowieść roundtripem BEZ bundlowania całego main.ts
// (main.ts tylko woła te dwie funkcje przy buildSaveGameSnapshot/restoreGameFromSave
// i wstawia/czyta wynik z pól `meta.bronzeForceWar*` — patrz forced-war-bronze-test.cjs
// sekcja T10/T11 dla dowodu roundtrip, w tym wojny z niezerowym licznikiem miast).
// EN: save/load. Serialization/deserialization pure here so a roundtrip can be proven
// WITHOUT bundling the whole main.ts (main.ts only calls these two functions and
// stores/reads the result under `meta.bronzeForceWar*` fields).
// ---------------------------------------------------------------------------

export type BronzeForcedWarPairState = ForcedWarPairState;

/** Kształt 4 pól stanu wojny wymuszonej Brązu tak, jak trafiają do `SaveGame.meta`. */
export type BronzeForcedWarSaveState = ForcedWarSaveState;

/**
 * Zrzuca 4 struktury stanu (Set/Set/Map/Map) do zwykłych tablic gotowych pod JSON —
 * ten sam kształt co reszta `meta` w `buildSaveGameSnapshot` (`Array.from(...)`).
 */
export function serializeBronzeForcedWarState(
  pendingOwners: ReadonlySet<number>,
  cycleOwners: ReadonlySet<number>,
  restUntilByOwner: ReadonlyMap<number, number>,
  activeByPairKey: ReadonlyMap<string, BronzeForcedWarPairState>,
): BronzeForcedWarSaveState {
  return serializeForcedWarState(
    pendingOwners,
    cycleOwners,
    restUntilByOwner,
    activeByPairKey,
  );
}

/**
 * Odtwarza 4 struktury stanu z zapisu. Brak `saved` (stary zapis sprzed tej funkcji) LUB
 * brak pojedynczego pola → bezpieczny pusty stan dla TEGO pola (mechanizm w ogóle wyłączony
 * dla tej gry, zero błędu) — nigdy `undefined`/wyjątek. EN: restores the 4 state structures
 * from a save. Missing `saved` (pre-existing save) or a missing individual field → a safe
 * empty state for THAT field (mechanism simply inactive for that game, never an exception).
 */
export function restoreBronzeForcedWarState(
  saved: Partial<BronzeForcedWarSaveState> | undefined,
): {
  pendingOwners: Set<number>;
  cycleOwners: Set<number>;
  restUntilByOwner: Map<number, number>;
  activeByPairKey: Map<string, BronzeForcedWarPairState>;
} {
  return restoreForcedWarState(saved);
}
