/**
 * Wspólny, czysty mechanizm wojen wymuszonych.
 *
 * Epoka Kamienia i Brązu mają osobne rejestry stanu w main.ts, ale identyczne
 * reguły wyboru celu, progu automatycznego pokoju, odpoczynku oraz serializacji.
 * Ten moduł utrzymuje te reguły w jednym miejscu bez zależności od silnika/DOM.
 */

export interface ForcedWarPairState {
  attackerId: number;
  targetId: number;
  capturedByAttacker: number;
  capturedByDefender: number;
  /**
   * R-WOJNA-WYMUSZONA-REGULY-Q1 (Część C, Kamień + Brąz WYŁĄCZNIE): tura rozpoczęcia
   * TEJ KONKRETNEJ pary — podstawa limitu czasu trwania 25 tur, niezależnego od progu
   * miast. OPCJONALNE i CELOWO NIEwypełniane przez Żelazo (`forced-war-iron.ts`, poza
   * zakresem tego dispatchu — Żelazo ma świadomie odrębny mechanizm wyzwalania,
   * `R-EPOKA-ZELAZO-WYMUSZONA-WOJNA-Q1`, i NIE dostaje limitu czasu trwania w tej
   * naprawie) — gdyby to pole było wymagane, literały `{ attackerId, targetId,
   * capturedByAttacker: 0, capturedByDefender: 0 }` budowane w gałęzi Żelaza w main.ts
   * (poza allowlistą tego dispatchu, NIETKNIĘTE) przestałyby się kompilować. Brak pola
   * (stary zapis sprzed tej naprawy, LUB para Żelaza) czytany jako `st.startTurn ??
   * <bieżąca tura>` przez Kamień/Brąz — main.ts backfilluje wartość PRZY WCZYTANIU
   * zapisu tak, by limit czasu liczył od realnego (lub, dla starych zapisów, od
   * momentu wczytania) startu, nie zerował się co turę.
   */
  startTurn?: number;
}

export interface ForcedWarNeighborCandidate {
  ownerId: number;
  q: number;
  r: number;
}

export interface ForcedWarSaveState {
  pendingOwners: number[];
  cycleOwners: number[];
  restUntilByOwner: Array<[number, number]>;
  activeByPairKey: Array<[string, ForcedWarPairState]>;
}

export function pickForcedWarTargetId(
  candidates: ReadonlyArray<ForcedWarNeighborCandidate>,
  referenceHex: { q: number; r: number } | undefined,
  hexDistanceFn: (aq: number, ar: number, bq: number, br: number) => number,
  blockedOwnerIds: ReadonlySet<number> = new Set<number>(),
): number | null {
  const eligible = candidates.filter(c => !blockedOwnerIds.has(c.ownerId));
  if (eligible.length === 0) return null;
  if (!referenceHex) {
    return eligible.reduce((a, b) => (b.ownerId < a.ownerId ? b : a)).ownerId;
  }

  let best = eligible[0]!;
  let bestDist = hexDistanceFn(best.q, best.r, referenceHex.q, referenceHex.r);
  for (let i = 1; i < eligible.length; i++) {
    const candidate = eligible[i]!;
    const distance = hexDistanceFn(candidate.q, candidate.r, referenceHex.q, referenceHex.r);
    if (distance < bestDist || (distance === bestDist && candidate.ownerId < best.ownerId)) {
      best = candidate;
      bestDist = distance;
    }
  }
  return best.ownerId;
}

export function shouldEndForcedWarByCityCount(
  citiesCapturedByAttacker: number,
  citiesCapturedByDefender: number,
  threshold: number,
): boolean {
  return citiesCapturedByAttacker >= threshold || citiesCapturedByDefender >= threshold;
}

/**
 * P-WOJNA-WYMUSZONA-TRZY-NAPRAWY-Q1 (a): licznik aktywnych wojen danego ownera, z
 * dowolnym wykluczeniem (np. barbarzyńców) i dowolnym predykatem "czy w wojnie" —
 * czysty, testowalny odpowiednik `countActiveWarsForOwner` w main.ts. Barbarzyńcy
 * (C-BARB-Q1) są STRUKTURALNIE zawsze 'wojna' dla każdego ownera — bez tego
 * wykluczenia praktycznie każda cywilizacja wygląda jak "już w wojnie", co blokowało
 * bramkę wymuszonej wojny (Kamień/Brąz/Żelazo) niezależnie od realnych wojen.
 * WYŁĄCZNIE do bramki wymuszonej wojny — main.ts `countActiveWarsForOwner` (użyty też
 * w `buildAllianceWarObligationCtx`, gdzie wojna z barbarzyńcami MA się liczyć) zostaje
 * osobną, niezmienioną funkcją.
 */
export function countActiveWarsExcluding(
  ownerId: number,
  allOwnerIds: ReadonlyArray<number>,
  isAtWar: (a: number, b: number) => boolean,
  excludeOwnerId: (oid: number) => boolean,
): number {
  let n = 0;
  for (const oid of allOwnerIds) {
    if (oid === ownerId) continue;
    if (excludeOwnerId(oid)) continue;
    if (isAtWar(ownerId, oid)) n++;
  }
  return n;
}

export function isRestingFromForcedWar(
  currentTurn: number,
  restUntilTurn: number | undefined,
): boolean {
  return restUntilTurn != null && currentTurn < restUntilTurn;
}

export function serializeForcedWarState(
  pendingOwners: ReadonlySet<number>,
  cycleOwners: ReadonlySet<number>,
  restUntilByOwner: ReadonlyMap<number, number>,
  activeByPairKey: ReadonlyMap<string, ForcedWarPairState>,
): ForcedWarSaveState {
  return {
    pendingOwners: Array.from(pendingOwners),
    cycleOwners: Array.from(cycleOwners),
    restUntilByOwner: Array.from(restUntilByOwner.entries()),
    activeByPairKey: Array.from(activeByPairKey.entries()),
  };
}

/**
 * R-WOJNA-WYMUSZONA-PAROWANIE-ZAMIAST-DOMINA-Q1: liczy CAŁKOWITĄ liczbę aktywnych wojen
 * wymuszonych danego ownera na podstawie płaskiej listy par ze WSZYSTKICH epok naraz
 * (main.ts spłaszcza bronze/stone/iron ActiveByPairKey przed wywołaniem) — świadomie
 * NIE filtruje `targetId !== 0`: gracz jako cel TEŻ liczy się jako "aktywna wojna
 * wymuszona" tej pary (dla ownera-celu ORAZ dla gracza), inaczej krok 2 ECHO ("warless"
 * = zero aktywnych wojen wymuszonych) błędnie uznałby stronę już atakującą gracza za
 * bezwojenną. Kontrast z `countActiveWarsExcluding` wyżej: TAMTA liczy WSZYSTKIE wojny
 * (także niewymuszone) z wykluczeniem dowolnego predykatu (np. barbarzyńców) — używana
 * do bramkowania KIEDY dana era w ogóle zaczyna szukać celu (`alreadyAtWarAnyRole`,
 * main.ts, poza zakresem tej naprawy). TA funkcja liczy WYŁĄCZNIE wojny WYMUSZONE — jedyny
 * licznik, którego krok 2 ECHO ("po przydziale nie może istnieć podmiot z zerem wojen,
 * dopóki inny ma ≥2") dotyczy dosłownie.
 */
export function countActiveForcedWarsForOwner(
  ownerId: number,
  allActiveForcedWarPairs: ReadonlyArray<{ attackerId: number; targetId: number }>,
): number {
  let n = 0;
  for (const pair of allActiveForcedWarPairs) {
    if (pair.attackerId === ownerId || pair.targetId === ownerId) n++;
  }
  return n;
}

export type ForcedWarEraTag = 'bronze' | 'stone' | 'iron';

/**
 * Podmiot "triggered" tej tury (shouldSearch===true per epoka main.ts, PLUS gracz gdy
 * warless) — wejście do kroku 1-3 ECHO. `era` brakuje WYŁĄCZNIE dla gracza (ownerId 0):
 * gracz nie ma własnego mechanizmu wypowiadania wojny wymuszonej (main.ts nie ma pola
 * `playerForceWarTargetId`), więc nigdy nie jest STRONĄ AKCJI w wyniku — patrz
 * `assignForcedWarPairings` niżej.
 */
export interface ForcedWarPairingSubject {
  ownerId: number;
  q: number;
  r: number;
  era?: ForcedWarEraTag;
}

/** Para już aktywna (dowolna epoka, zawsze AI↔AI — main.ts filtruje `targetId !== 0` przed budową tej listy), kandydat do kroku 4 ("dołączenie jako trzeci"). */
export interface ForcedWarPairingExistingPair {
  attackerId: number;
  targetId: number;
  era: ForcedWarEraTag;
}

export interface ForcedWarPairingOpts {
  /** Symetryczny predykat: NAP / peaceLocked (w tym cooldown tej samej pary) / aktywny sojusz MIĘDZY a i b — main.ts ta sama trójka warunków co dawne blockedOwnerIds, teraz jeden predykat zamiast osobnego zbioru per owner. */
  isPairBlocked: (a: number, b: number) => boolean;
  hexDistanceFn: (aq: number, ar: number, bq: number, br: number) => number;
  /** Krok 2 ECHO: CAŁKOWITA liczba aktywnych wojen wymuszonych (wszystkie epoki) tego ownera PRZED przydziałem tej tury. */
  totalActiveForcedWarsByOwner: (ownerId: number) => number;
}

export interface ForcedWarPairingAssignment {
  /** Owner, który TEJ TURY wypowiada wojnę wymuszoną (strona akcji — nigdy gracz, patrz komentarz przy `ForcedWarPairingSubject.era`). */
  ownerId: number;
  /** Era WŁASNEGO mechanizmu tego ownera — main.ts używa tego do wyboru, które z trzech pól (`bronze/stone/ironForceWarTargetId`) ustawić. */
  era: ForcedWarEraTag;
  targetId: number;
}

export interface ForcedWarPairingResult {
  assignments: ForcedWarPairingAssignment[];
  /**
   * ECHO, brzegowy przypadek: "wszystkie istniejące pary zablokowane sojuszem dla
   * leftover" (lub brak jakiejkolwiek pary do dołączenia) — Operator ma się ZATRZYMAĆ i
   * zgłosić DECISION_REQUIRED, NIE zgadywać. Owner w tej liście dostaje zero przydziału
   * tej tury (main.ts loguje i zostawia go do ponownej próby następnej tury — `wasPending`/
   * `cycleOwners` nie są tu konsumowane).
   */
  unresolvedOwnerIds: number[];
}

/**
 * R-WOJNA-WYMUSZONA-PAROWANIE-ZAMIAST-DOMINA-Q1 — rdzeń zastępujący FUNKCJONALNIE dawne
 * `pickXForcedWarTargetIdCoordinated` (per owner, w pętli) ORAZ `pickXForcedWarDominoOwnerIds`
 * (blok przed `ownerLoop`) JEDNĄ procedurą, wołaną RAZ na turę PRZED `ownerLoop`.
 *
 * ECHO właściciela (wiążące, dosłowne): "Najpierw wszyscy mają wojnę, potem trójkąty."
 *   Krok 1-2: z `triggeredSubjects` wybierz "warless" (CAŁKOWITA liczba aktywnych wojen
 *     wymuszonych === 0) i paruj 1v1, NAJBLIŻSZY NIEZABLOKOWANY kandydat, deterministycznie
 *     (kolejność po ownerId, remis dystansu → niższy ownerId — ten sam `pickForcedWarTargetId`
 *     co dotychczas). Gracz jest w tej puli DOKŁADNIE jak każde AI (bez specjalnego
 *     wykluczania) — jedyna asymetria: gracz nie ma własnego pola docelowego, więc gdy
 *     para to {gracz, AI}, STRONĄ AKCJI (wpisem do wyniku) jest wyłącznie AI (cel=gracz) —
 *     dokładnie jak dawny fallback na gracza w coordinated-pick. Gdy obie strony to AI,
 *     OBIE niezależnie kierują wojnę na siebie nawzajem (symetryczne, tak jak dwóch
 *     niezależnie szukających trafiających na siebie jako najbliższego kandydata).
 *   Krok 3-4: nieparzysta reszta (podmioty, które NIE znalazły niezablokowanego partnera w
 *     puli warless) DOŁĄCZA jako TRZECI do istniejącej aktywnej pary (`existingActivePairs`,
 *     dowolna epoka) zamiast zostać bez wojny — wybrana para nie może mieć ŻADNEJ strony
 *     zablokowanej z leftover. Leftover=AI → własne pole = wybrana strona pary (jak dzisiejsze
 *     domino, tylko jeden wpis zamiast dwóch). Leftover=gracz → gracz sam nie działa, więc
 *     WYBRANA STRONA istniejącej pary dostaje cel=gracz (odwrotny kierunek niż dla AI-leftover,
 *     jedyny sposób by gracz "dołączył" bez własnego mechanizmu — dokładnie odtwarza dzisiejsze
 *     domino, gdzie AI atakowało gracza, nigdy odwrotnie).
 *   Brzegowy przypadek (ECHO, dosłownie): gdy WSZYSTKIE istniejące pary są zablokowane
 *     sojuszem z leftover (lub `existingActivePairs` jest puste) — funkcja NIE zgaduje:
 *     ownerId trafia do `unresolvedOwnerIds`, main.ts zgłasza DECISION_REQUIRED i zostawia
 *     go bez przydziału tej tury (spróbuje ponownie następnej).
 */
export function assignForcedWarPairings(
  triggeredSubjects: ReadonlyArray<ForcedWarPairingSubject>,
  existingActivePairs: ReadonlyArray<ForcedWarPairingExistingPair>,
  opts: ForcedWarPairingOpts,
): ForcedWarPairingResult {
  const assignments: ForcedWarPairingAssignment[] = [];
  const unresolvedOwnerIds: number[] = [];

  // Krok 1-2: pula "warless", posortowana deterministycznie po ownerId.
  const warless = triggeredSubjects
    .filter(s => opts.totalActiveForcedWarsByOwner(s.ownerId) === 0)
    .slice()
    .sort((a, b) => a.ownerId - b.ownerId);
  const byId = new Map(warless.map(s => [s.ownerId, s] as const));
  const remaining = warless.map(s => s.ownerId);
  const leftovers: number[] = [];

  const addAssignment = (actorId: number, targetId: number): void => {
    const actor = byId.get(actorId);
    const era = actor?.era;
    // Gracz (era undefined) nigdy nie jest stroną akcji -- brak własnego mechanizmu
    // wypowiadania wojny wymuszonej (patrz komentarz nagłówkowy).
    if (era == null) return;
    assignments.push({ ownerId: actorId, era, targetId });
  };

  // Krok 3: nowe pary 1v1 wśród warless -- DOPASOWANIE MAKSYMALNE, nie zachłanne.
  //
  // Runda 1, zarzut Evaluatora #2 (przyjęty): zachłanny "najbliższy nieblokowany kandydat,
  // w kolejności ownerId" mógł zostawić bez pary podmioty, dla których pełne dopasowanie
  // ISTNIAŁO, gdy blokady (sojusz/NAP/cooldown) tworzą zapętloną strukturę. Przykład
  // kontrolny Evaluatora: {1,2,3,4}, zablokowane {1-4,2-3,3-4} -- istnieje pełne dopasowanie
  // {1-3,2-4}, ale zachłanny algorytm paruje 1-2 jako pierwsze (najniższe ownerId, remis
  // dystansu) i zostawia 3 oraz 4 bez pary, mimo że rozwiązanie było osiągalne.
  //
  // Poprawka: dokładny max-matching (DP na bitmasce) na zbiorze `remaining` zamiast
  // zachłannego przejścia. n = |warless| tej tury <= liczba cywilizacji w grze + gracz
  // (15 cywilizacji w `gra/data/civs.json` + gracz = 16 w praktyce) -- 2^16 stanów DP jest
  // trywialne obliczeniowo (raz na turę). Rekonstrukcja zachowuje ten sam deterministyczny
  // tie-break co dawny zachłanny krok ("najbliższy kandydat, remis niższy ownerId"), ale
  // WYBIERANY SPOŚRÓD WSZYSTKICH dopasowań o maksymalnej liczności, nie zatrzymuje się na
  // pierwszym zachłannie znalezionym -- gwarantuje, że jeśli pełne dopasowanie istnieje,
  // zostanie znalezione, niezależnie od kolejności przetwarzania ownerId.
  //
  // Próg `MAX_EXACT_MATCHING_N`: powyżej niego (praktycznie nieosiągalne w tej grze) DP na
  // bitmasce stałby się kosztowny (2^n) -- świadomy fallback na dawny zachłanny algorytm
  // jako zabezpieczenie przed regresją wydajności, nie przed regresją poprawności (przy
  // obecnej liczbie cywilizacji ta gałąź nigdy się nie uruchamia).
  const MAX_EXACT_MATCHING_N = 24;
  if (remaining.length <= MAX_EXACT_MATCHING_N) {
    const ids = remaining.slice();
    const n = ids.length;
    const blockedIdx: boolean[][] = ids.map(a => ids.map(b => a !== b && opts.isPairBlocked(a, b)));
    const memo = new Map<number, number>();
    const lowestBitIndex = (mask: number): number => {
      let i = 0;
      while ((mask & (1 << i)) === 0) i++;
      return i;
    };
    const dp = (mask: number): number => {
      if (mask === 0) return 0;
      const cached = memo.get(mask);
      if (cached !== undefined) return cached;
      const i = lowestBitIndex(mask);
      let best = dp(mask & ~(1 << i));
      for (let j = 0; j < n; j++) {
        if (j === i || (mask & (1 << j)) === 0 || blockedIdx[i]![j]) continue;
        const val = 1 + dp(mask & ~(1 << i) & ~(1 << j));
        if (val > best) best = val;
      }
      memo.set(mask, best);
      return best;
    };
    const fullMask = n === 0 ? 0 : (1 << n) - 1;
    dp(fullMask);
    let mask = fullMask;
    while (mask !== 0) {
      const i = lowestBitIndex(mask);
      const seekerId = ids[i]!;
      const seeker = byId.get(seekerId)!;
      const maskWithoutSeeker = mask & ~(1 << i);
      const targetBest = dp(mask);
      const candIdxs: number[] = [];
      for (let j = 0; j < n; j++) {
        if (j === i || (mask & (1 << j)) === 0 || blockedIdx[i]![j]) continue;
        candIdxs.push(j);
      }
      candIdxs.sort((a, b) => {
        const ca = byId.get(ids[a]!)!;
        const cb = byId.get(ids[b]!)!;
        const da = opts.hexDistanceFn(seeker.q, seeker.r, ca.q, ca.r);
        const db = opts.hexDistanceFn(seeker.q, seeker.r, cb.q, cb.r);
        if (da !== db) return da - db;
        return ids[a]! - ids[b]!;
      });
      let matched = -1;
      for (const j of candIdxs) {
        const val = 1 + dp(maskWithoutSeeker & ~(1 << j));
        if (val === targetBest) { matched = j; break; }
      }
      if (matched === -1) {
        leftovers.push(seekerId);
        mask = maskWithoutSeeker;
      } else {
        const partnerId = ids[matched]!;
        addAssignment(seekerId, partnerId);
        addAssignment(partnerId, seekerId);
        mask = maskWithoutSeeker & ~(1 << matched);
      }
    }
    remaining.length = 0;
  } else {
    // Fallback zachłanny -- zabezpieczenie wydajnościowe dla N poza realistycznym zakresem
    // tej gry (patrz komentarz wyżej). Nieużywany w praktyce.
    while (remaining.length > 0) {
      const seekerId = remaining.shift()!;
      if (remaining.length === 0) { leftovers.push(seekerId); break; }
      const seeker = byId.get(seekerId)!;
      const candidates: ForcedWarNeighborCandidate[] = remaining.map(id => byId.get(id)!);
      const blocked = new Set(remaining.filter(id => opts.isPairBlocked(seekerId, id)));
      const partnerId = pickForcedWarTargetId(
        candidates,
        { q: seeker.q, r: seeker.r },
        opts.hexDistanceFn,
        blocked,
      );
      if (partnerId == null) { leftovers.push(seekerId); continue; }
      addAssignment(seekerId, partnerId);
      addAssignment(partnerId, seekerId);
      const idx = remaining.indexOf(partnerId);
      if (idx >= 0) remaining.splice(idx, 1);
    }
  }

  // Krok 4: leftover dołącza jako trzeci do istniejącej pary (dowolnej epoki).
  const pairsSorted = existingActivePairs
    .filter(p => p.attackerId !== p.targetId)
    .slice()
    .sort((a, b) => (a.attackerId - b.attackerId) || (a.targetId - b.targetId));

  for (const leftoverId of leftovers) {
    let joined = false;
    for (const pair of pairsSorted) {
      if (pair.attackerId === leftoverId || pair.targetId === leftoverId) continue;
      // ECHO, dosłownie: "wybierz parę, gdzie ŻADNA strona nie ma sojuszu z leftover" --
      // sojusz/blokada KTÓREJKOLWIEK strony wyklucza CAŁĄ parę (ta sama zasada co dawne
      // domino: "sojusz KTÓREJKOLWIEK ze stron blokuje CAŁĄ parę"), nie tylko tę jedną
      // zablokowaną stronę. Obie strony muszą być niezablokowane, żeby para w ogóle
      // kwalifikowała się do dołączenia.
      const attackerBlocked = opts.isPairBlocked(leftoverId, pair.attackerId);
      const targetBlocked = opts.isPairBlocked(leftoverId, pair.targetId);
      if (attackerBlocked || targetBlocked) continue;
      // Obie strony niezablokowane -- deterministyczny wybór (niższy ownerId), zgodny z
      // konwencją tie-breaku reszty modułu.
      const chosenSide = Math.min(pair.attackerId, pair.targetId);
      if (leftoverId === 0) {
        // Gracz-leftover: gracz sam nie działa -- wybrana strona PARY dostaje cel=gracz
        // (jak dzisiejsze domino), jeden wpis zamiast dwóch.
        assignments.push({ ownerId: chosenSide, era: pair.era, targetId: 0 });
      } else {
        addAssignment(leftoverId, chosenSide);
      }
      joined = true;
      break;
    }
    if (!joined) unresolvedOwnerIds.push(leftoverId);
  }

  return { assignments, unresolvedOwnerIds };
}

export function restoreForcedWarState(
  saved: Partial<ForcedWarSaveState> | undefined,
): {
  pendingOwners: Set<number>;
  cycleOwners: Set<number>;
  restUntilByOwner: Map<number, number>;
  activeByPairKey: Map<string, ForcedWarPairState>;
} {
  return {
    pendingOwners: new Set(saved?.pendingOwners ?? []),
    cycleOwners: new Set(saved?.cycleOwners ?? []),
    restUntilByOwner: new Map(saved?.restUntilByOwner ?? []),
    activeByPairKey: new Map(saved?.activeByPairKey ?? []),
  };
}
