import {
  isRestingFromForcedWar,
  pickForcedWarTargetId,
  restoreForcedWarState,
  serializeForcedWarState,
  shouldEndForcedWarByCityCount,
  type ForcedWarNeighborCandidate,
  type ForcedWarPairState,
  type ForcedWarSaveState,
} from './forced-war-common';

/**
 * R-WOJNA-WYMUSZONA-REGULY-Q1 (Część A): ochrona startowa mierzona turą gry —
 * podniesiona z 20 na 25 na jawne życzenie właściciela ("zmieńmy czas wybuchu wojny
 * na 25 tur od początku epoki, zarówno dla kamienia, jak i dla brązu"). Dla Kamienia
 * "tura gry" i "tura od początku epoki" są tożsame, bo każda cywilizacja zaczyna grę
 * w Kamieniu w turze 0 — zero zmiany mechanizmu, wyłącznie wartość stałej.
 */
export const WOJNA_KAMIEN_WYMUSZONA_START_TURY = 25;
export const WOJNA_KAMIEN_WYMUSZONA_MAX_MIASTA_ZDOBYTE_LUB_STRACONE = 2;
export const WOJNA_KAMIEN_WYMUSZONA_ODPOCZYNEK_TUR = 20;
export const WOJNA_KAMIEN_WYMUSZONA_COOLDOWN_TA_SAMA_CYWILIZACJA_TUR = 20;
/**
 * R-WOJNA-WYMUSZONA-REGULY-Q1 (Część C): limit czasu trwania TEJ KONKRETNEJ pary wojny
 * wymuszonej Kamienia — niezależnie od progu miast (`WOJNA_KAMIEN_WYMUSZONA_MAX_MIASTA_
 * ZDOBYTE_LUB_STRACONE`, który zostaje jako DODATKOWY, zwykle wcześniejszy warunek
 * zakończenia — który z dwóch warunków spełni się pierwszy, kończy wojnę).
 */
export const WOJNA_KAMIEN_WYMUSZONA_MAX_CZAS_TRWANIA_TUR = 25;

export interface StoneForcedWarEligibilityInput {
  /** Wyłącznie główna cywilizacja AI; nie gracz, miasto-państwo ani barbarzyńca. */
  isMainAiCiv: boolean;
  /** Wojna w dowolnej roli blokuje wymuszoną wojnę. */
  isAlreadyAtWarAnyRole: boolean;
  /** Bieżąca tura gry. */
  currentTurn: number;
  /** Wojna Kamienia dotyczy wyłącznie ownera pozostającego w Kamieniu. */
  isStoneEra: boolean;
}

export function isEligibleForStoneForcedWar(inp: StoneForcedWarEligibilityInput): boolean {
  return (
    inp.isMainAiCiv
    && inp.isStoneEra
    && inp.currentTurn >= WOJNA_KAMIEN_WYMUSZONA_START_TURY
    && !inp.isAlreadyAtWarAnyRole
  );
}

export interface PickStoneForcedWarTargetOpts {
  blockedOwnerIds?: ReadonlySet<number>;
}

export type StoneForcedWarNeighborCandidate = ForcedWarNeighborCandidate;
export type StoneForcedWarPairState = ForcedWarPairState;
export type StoneForcedWarSaveState = ForcedWarSaveState;

export function pickStoneForcedWarTargetId(
  candidates: ReadonlyArray<StoneForcedWarNeighborCandidate>,
  referenceHex: { q: number; r: number } | undefined,
  hexDistanceFn: (aq: number, ar: number, bq: number, br: number) => number,
  opts?: PickStoneForcedWarTargetOpts,
): number | null {
  return pickForcedWarTargetId(
    candidates,
    referenceHex,
    hexDistanceFn,
    opts?.blockedOwnerIds ?? new Set<number>(),
  );
}

export function shouldEndStoneForcedWarByCityCount(
  citiesCapturedByAttacker: number,
  citiesCapturedByDefender: number,
  threshold: number = WOJNA_KAMIEN_WYMUSZONA_MAX_MIASTA_ZDOBYTE_LUB_STRACONE,
): boolean {
  return shouldEndForcedWarByCityCount(
    citiesCapturedByAttacker,
    citiesCapturedByDefender,
    threshold,
  );
}

/**
 * R-WOJNA-WYMUSZONA-REGULY-Q1 (Część C): czy TA KONKRETNA para wojny wymuszonej Kamienia
 * kończy się TERAZ automatycznym pokojem, bo minęło `maxDurationTurns` tur od jej
 * rozpoczęcia — NIEZALEŻNIE od liczby zdobytych/straconych miast (próg miastowy zostaje
 * jako dodatkowy, zwykle wcześniejszy warunek — `shouldEndStoneForcedWarByCityCount`
 * wyżej, niezmieniona). `startTurn === undefined` (stary zapis sprzed tego pola,
 * `ForcedWarPairState.startTurn` jest opcjonalne) → `currentTurn - currentTurn === 0`,
 * więc NIGDY nie kończy wojny samym tym wywołaniem — main.ts backfilluje brakujące
 * `startTurn` PRZY WCZYTANIU zapisu (`restoreGameFromSave`), więc ten fallback w
 * praktyce nie jest długotrwały (patrz raport Operatora).
 */
export function shouldEndStoneForcedWarByDuration(
  currentTurn: number,
  startTurn: number | undefined,
  maxDurationTurns: number = WOJNA_KAMIEN_WYMUSZONA_MAX_CZAS_TRWANIA_TUR,
): boolean {
  return currentTurn - (startTurn ?? currentTurn) >= maxDurationTurns;
}

export function isRestingFromStoneForcedWar(
  currentTurn: number,
  restUntilTurn: number | undefined,
): boolean {
  return isRestingFromForcedWar(currentTurn, restUntilTurn);
}

export function serializeStoneForcedWarState(
  pendingOwners: ReadonlySet<number>,
  cycleOwners: ReadonlySet<number>,
  restUntilByOwner: ReadonlyMap<number, number>,
  activeByPairKey: ReadonlyMap<string, StoneForcedWarPairState>,
): StoneForcedWarSaveState {
  return serializeForcedWarState(
    pendingOwners,
    cycleOwners,
    restUntilByOwner,
    activeByPairKey,
  );
}

export function restoreStoneForcedWarState(
  saved: Partial<StoneForcedWarSaveState> | undefined,
): {
  pendingOwners: Set<number>;
  cycleOwners: Set<number>;
  restUntilByOwner: Map<number, number>;
  activeByPairKey: Map<string, StoneForcedWarPairState>;
} {
  return restoreForcedWarState(saved);
}

/**
 * R-WOJNA-WYMUSZONA-REGULY-Q1 (Część B, WYZWALACZ właściciela: "jedna cywilizacja
 * wypowiada wojnę Jednej cywilizacji"): wybór celu wojny wymuszonej Kamienia, z
 * KOORDYNACJĄ między niezależnymi napastnikami (żaden kandydat już w innej wojnie —
 * `candidatesAlreadyAtWarIds`, main.ts liczy przez `countActiveWarsForOwnerExcludingBarbarians`,
 * TA SAMA funkcja, która dziś chroni już samego napastnika) i FALLBACKIEM na gracza
 * ostatniej szansy, gdy pula (po odjęciu NAP/peaceLocked/sojuszu ORAZ "już w wojnie")
 * jest pusta — ograniczonym `poziomTrudnosci`:
 *   - Łatwy (1): wołający (main.ts) w ogóle NIE wywołuje tej funkcji — cały mechanizm
 *     wyłączony wcześniej, przy obliczaniu `shouldSearch` (patrz main.ts).
 *   - Normalny (2, i `undefined` traktowane jak 2 — ta sama konwencja co
 *     `opts.poziomTrudnosci ?? 2` w `ai.ts:2438`): fallback na gracza NIE aktywuje się,
 *     jeśli gracz ma już `playerActiveForcedWarCount >= 1` aktywną wojnę wymuszoną
 *     (Kamień+Brąz łącznie, main.ts liczy).
 *   - Trudny (3): fallback zawsze dozwolony, bez limitu.
 * Fallback wymaga, by gracz w ogóle BYŁ w oryginalnej puli kandydatów i nie był
 * zablokowany NAP/peaceLocked/sojuszem (`blockedOwnerIds`) — ignorowane jest WYŁĄCZNIE
 * to, czy gracz akurat prowadzi inną wojnę (WYZWALACZ: "próbuje wypowiedzieć wojnę
 * graczowi [...] NIEZALEŻNIE od tego, czy gracz akurat prowadzi inną wojnę").
 */
export interface StoneForcedWarCoordinatedPickOpts {
  /** NAP / peaceLocked (w tym cooldown tej samej pary) / aktywny sojusz — jak dziś. */
  blockedOwnerIds: ReadonlySet<number>;
  /** Kandydaci (dowolna rola) już w JAKIEJKOLWIEK aktywnej wojnie (poza barbarzyńcami). */
  candidatesAlreadyAtWarIds: ReadonlySet<number>;
  poziomTrudnosci: 1 | 2 | 3;
  /** Aktywne wojny wymuszone gracza jako CEL, Kamień+Brąz łącznie (main.ts liczy). */
  playerActiveForcedWarCount: number;
}

export function pickStoneForcedWarTargetIdCoordinated(
  candidates: ReadonlyArray<StoneForcedWarNeighborCandidate>,
  referenceHex: { q: number; r: number } | undefined,
  hexDistanceFn: (aq: number, ar: number, bq: number, br: number) => number,
  opts: StoneForcedWarCoordinatedPickOpts,
): number | null {
  const combinedBlocked = new Set<number>([
    ...opts.blockedOwnerIds,
    ...opts.candidatesAlreadyAtWarIds,
  ]);
  const picked = pickForcedWarTargetId(candidates, referenceHex, hexDistanceFn, combinedBlocked);
  if (picked != null) return picked;
  const playerInPoolIgnoringWar = candidates.some(c => c.ownerId === 0)
    && !opts.blockedOwnerIds.has(0);
  if (!playerInPoolIgnoringWar) return null;
  if (opts.poziomTrudnosci === 2 && opts.playerActiveForcedWarCount >= 1) return null;
  return 0;
}

/**
 * R-DYPLO-AI-WOJNA-TROJSTRONNA-Q1 (rozszerzenie R-DYPLO-AI-WOJNA-Z-GRACZEM-PARZYSTOSC-Q1),
 * WYZWALACZ dosłowny właściciela: "Jeżeli jakaś cywilizacja ma już parę i z kimś walczy, a
 * gracz nie ma swojej pary do walki — obie cywilizacje, które ze sobą walczą, wypowiadają
 * jednocześnie wojnę graczowi [...] chyba że jedną z nich łączy sojusz".
 *
 * Różni się od `pickStoneForcedWarTargetIdCoordinated` wyżej: TAMTA funkcja wybiera JEDEN
 * cel dla ownera, który dopiero SZUKA (jeszcze nie jest w żadnej wojnie). TA funkcja działa
 * na PARACH JUŻ AKTYWNYCH (`activeByPairKey`, obie strony AI, `targetId !== 0`) — obie strony
 * takiej pary są z definicji `alreadyAtWarAnyRole=true`, więc normalna ścieżka szukania
 * (`shouldSearch`) je pomija; main.ts musi ustawić `stoneForceWarTargetId = 0` dla OBU stron
 * NIEZALEŻNIE od `shouldSearch`, gdy ta funkcja je zwróci.
 *
 * GOAL 4 (ECHO 3, "zamierzone zaostrzenie BEZ dodatkowego łagodzenia"): świadomie BEZ
 * parametru `poziomTrudnosci` — w odróżnieniu od `pickStoneForcedWarTargetIdCoordinated`,
 * ten mechanizm NIE jest ograniczony limitem "Normalny: gracz najwyżej w jednej wojnie
 * wymuszonej naraz" (`playerActiveForcedWarCount>=1` wyżej) — to jest INNY, węższy limit
 * dla INNEGO mechanizmu (fallback pojedynczej AI z wyczerpanej puli), nie dotyczy tej,
 * skoordynowanej, JEDNEJ decyzji obu stron istniejącej pary.
 *
 * `opts.playerAlreadyHasActiveForcedWar` MUSI być jednym, stabilnym odczytem na CAŁĄ turę
 * (main.ts liczy go RAZ, przed pętlą po ownerach) — odczyt PONOWNIE per-owner złamałby
 * "jednocześnie": pierwszy przetworzony owner pary zdążyłby dopisać graczowi wojnę i drugi
 * widziałby już aktywną parę z graczem, więc by się nie uruchomił.
 */
export interface StoneForcedWarActiveAiPair {
  attackerId: number;
  targetId: number;
}

export interface StoneForcedWarDominoOpts {
  /** Gracz ma już JAKĄKOLWIEK aktywną wojnę wymuszoną (Kamień+Brąz+Żelazo łącznie) — jeden, stabilny odczyt na całą turę. */
  playerAlreadyHasActiveForcedWar: boolean;
  /** Czy dany ownerId ma DZIŚ aktywny sojusz z graczem (ECHO 2: KTÓRAKOLWIEK strona blokuje całą parę). */
  hasAllianceWithPlayer: (ownerId: number) => boolean;
}

export function pickStoneForcedWarDominoOwnerIds(
  activeAiPairs: ReadonlyArray<StoneForcedWarActiveAiPair>,
  opts: StoneForcedWarDominoOpts,
): ReadonlySet<number> {
  const result = new Set<number>();
  if (opts.playerAlreadyHasActiveForcedWar) return result;
  for (const pair of activeAiPairs) {
    if (pair.attackerId === 0 || pair.targetId === 0 || pair.attackerId === pair.targetId) continue;
    if (opts.hasAllianceWithPlayer(pair.attackerId) || opts.hasAllianceWithPlayer(pair.targetId)) continue;
    result.add(pair.attackerId);
    result.add(pair.targetId);
  }
  return result;
}
