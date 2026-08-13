/**
 * civ-roster.ts — przypisanie typów cywilizacji AI przy starcie gry (E1-D-Q1=A).
 * Pure functions — wpina SILNIK w main.ts (aiOwnerCivMap).
 * Pula typów filtrowana po epoce startu gry — patrz civ-entry-epoch.ts (D-CYW-EPOKA-WEJSCIA).
 */

export { civIdsAvailableAtGameEpoch } from './civ-entry-epoch';

/** Deterministic [0,1) — mulberry32 (jak culture-religion.ts). */
export function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** ikonaId z civs.json (kolejność pliku). */
export function civIdsFromRoster(cywilizacje: readonly { ikonaId?: string }[]): string[] {
  return cywilizacje
    .map((c) => c.ikonaId ?? '')
    .filter((id) => id !== '');
}

export interface AssignAiCivInput {
  allCivIds: string[];
  playerCivId: string;
  aiOwnerIds: number[];
  /** Cap unikalnych typów na mapie (3/5/7/9) — newGameMapDefaults. */
  aktywneTypy: number;
  seed: number;
  /**
   * R-KONFIGURATOR-WYBOR-CYWILIZACJI-PRZECIWNIKA: konkretne typy AI wybrane przez
   * gracza w kreatorze (multi-select), w kolejności zaznaczenia. Puste/undefined =
   * dotychczasowe zachowanie losowe (backward-compatible).
   * / EN: specific AI civ types chosen by the player in the wizard, in selection
   * order. Empty/undefined = today's random behaviour (backward-compatible).
   */
  preferredCivIds?: string[];
}

/**
 * E1-D-Q1=A: losowy zestaw unikalnych typów (seed) + przypisanie AI.
 * - Zawsze zawiera nację gracza w puli aktywnych typów.
 * - Każdy owner AI dostaje inny typ niż gracz i inne AI.
 * - Liczba typów na mapie = min(aktywneTypy, 1 + liczba AI).
 *
 * R-KONFIGURATOR-WYBOR-CYWILIZACJI-PRZECIWNIKA: `preferredCivIds`, jeśli podane,
 * mają PIERWSZEŃSTWO nad losowym doborem — brane w kolejności zaznaczenia w
 * kreatorze, do limitu `typesNeeded-1`. Reszta slotów (gdy preferowanych jest za
 * mało) dobierana jak dziś — deterministyczny seedowany shuffle puli pozostałych
 * typów. Bez `preferredCivIds` zachowanie 1:1 jak przed tą zmianą.
 * / EN: `preferredCivIds`, when given, take priority over random selection — in
 * selection order, up to `typesNeeded-1`. Remaining slots (when too few preferred)
 * fall back to today's deterministic seeded shuffle. Without `preferredCivIds`
 * behaviour is unchanged.
 */
export function pickActiveCivPool(
  allCivIds: string[],
  playerCivId: string,
  aktywneTypy: number,
  numAi: number,
  seed: number,
  preferredCivIds?: string[],
): string[] {
  const pool = [...new Set(allCivIds.filter(Boolean))];
  if (pool.length === 0) return playerCivId ? [playerCivId] : [];

  const typesNeeded = Math.max(1, Math.min(aktywneTypy, 1 + numAi));
  const others = pool.filter((id) => id !== playerCivId);
  const rng = makeRng(seed >>> 0);

  // Fisher–Yates shuffle others
  const shuffled = [...others];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const a = shuffled[i]!;
    const b = shuffled[j]!;
    shuffled[i] = b;
    shuffled[j] = a;
  }

  const needOthers = Math.min(typesNeeded - 1, shuffled.length);

  let picked: string[];
  const othersSet = new Set(others);
  const preferredValid = preferredCivIds
    ? [...new Set(preferredCivIds.filter((id) => !!id && id !== playerCivId && othersSet.has(id)))]
    : [];
  if (preferredValid.length > 0) {
    // Preferowane w kolejności zaznaczenia, do limitu — deterministyczne, bez rng.
    // / EN: preferred in selection order, up to the cap — deterministic, no rng.
    const chosen = preferredValid.slice(0, needOthers);
    if (chosen.length < needOthers) {
      const chosenSet = new Set(chosen);
      const fillIn = shuffled.filter((id) => !chosenSet.has(id));
      chosen.push(...fillIn.slice(0, needOthers - chosen.length));
    }
    picked = chosen;
  } else {
    picked = shuffled.slice(0, needOthers);
  }

  const active = playerCivId && pool.includes(playerCivId)
    ? [playerCivId, ...picked]
    : picked.length > 0
      ? picked.slice(0, typesNeeded)
      : [pool[0]];

  return [...new Set(active.filter((id): id is string => !!id))].slice(0, typesNeeded);
}

/** Mapa ownerId → ikonaId dla AI (E1-D-Q1=A). */
export function assignAiCivTypes(input: AssignAiCivInput): Map<number, string> {
  const { allCivIds, playerCivId, aiOwnerIds, aktywneTypy, seed, preferredCivIds } = input;
  const sorted = [...aiOwnerIds].sort((a, b) => a - b);
  const activePool = pickActiveCivPool(
    allCivIds,
    playerCivId,
    aktywneTypy,
    sorted.length,
    seed,
    preferredCivIds,
  );
  const aiTypes = activePool.filter((id) => id !== playerCivId);

  const rng = makeRng((seed + 7919) >>> 0);
  const shuffledAi = [...aiTypes];
  for (let i = shuffledAi.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const a = shuffledAi[i]!;
    const b = shuffledAi[j]!;
    shuffledAi[i] = b;
    shuffledAi[j] = a;
  }

  const out = new Map<number, string>();
  const fallback = allCivIds.find((id) => id && id !== playerCivId) ?? 'grecy';
  sorted.forEach((ownerId, idx) => {
    // Audyt #71: round-robin z puli aktywnych
    out.set(ownerId, shuffledAi.length > 0 ? shuffledAi[idx % shuffledAi.length]! : fallback);
  });
  return out;
}
