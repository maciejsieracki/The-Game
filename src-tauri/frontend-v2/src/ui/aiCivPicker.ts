/**
 * aiCivPicker.ts — logika multi-select cywilizacji przeciwnika w kreatorze (krok 4),
 * R-KONFIGURATOR-WYBOR-CYWILIZACJI-PRZECIWNIKA.
 *
 * Czyste funkcje bez zależności DOM/assets — WYDZIELONE z newGameFlow.ts właśnie po to,
 * żeby dało się je testować bezpośrednio bez ciężkiego harnessu jsdom (wzorzec
 * extract-to-pure-function, playbook.md 2026-08-12: logika inline w dużym module UI +
 * test odtwarzający własną kopię formuły = mutacja psująca produkcję przechodzi bramkę
 * niezauważona). `newGameFlow.ts` jest cienkim wrapperem nad tymi funkcjami — WPINA je
 * do stanu modułu (selEpoch/selCiv/SETT), nie duplikuje formuł.
 * / EN: pure functions with zero DOM/asset dependencies — split out of newGameFlow.ts
 * so they're directly testable without a jsdom harness. `newGameFlow.ts` is a thin
 * wrapper wiring these into module state, not a duplicate of the formulas.
 */

/**
 * Ile cywilizacji przeciwnika da się dziś wybrać = `civ_types_count` (suwak) − 1
 * (jeden slot zawsze zajmuje nacja gracza). Nigdy poniżej 0. Nieskończone/NaN → 0.
 * / EN: how many opponent civs can be picked = `civ_types_count` (slider) minus 1
 * (one slot always belongs to the player's own nation). Never below 0. Non-finite → 0.
 */
export function aiCivSelectionCap(civTypesCount: number): number {
  if (!Number.isFinite(civTypesCount)) return 0;
  return Math.max(0, Math.floor(civTypesCount) - 1);
}

/**
 * Kandydaci na cywilizację przeciwnika = pula epoki bez nacji gracza.
 * / EN: opponent civ candidates = the epoch pool minus the player's own nation.
 */
export function aiCivCandidateIds(
  epochPoolIds: readonly string[],
  playerCivId: string | null,
): string[] {
  return epochPoolIds.filter((id) => id !== playerCivId);
}

/**
 * Domyka listę wyboru gracza do: (a) tylko id obecne w bieżącej puli kandydatów,
 * (b) bez duplikatów, (c) limitu `cap` — zachowując PIERWSZE N w kolejności
 * zaznaczenia (Maciej, ECHO doprecyzowania 2026-08-10 + rekomendacja zlecenia pkt.4:
 * przy zmniejszeniu `civ_types_count` po ręcznym zaznaczeniu, zachowaj pierwsze N w
 * kolejności zaznaczenia, odrzuć resztę po cichu).
 * / EN: closes the player's selection to: (a) only ids present in the current
 * candidate pool, (b) no duplicates, (c) the `cap` — keeping the FIRST N in
 * selection order (decision: shrinking `civ_types_count` after manual picks keeps
 * the first N in pick order, silently drops the rest).
 */
export function sanitizeAiCivSelection(
  selected: readonly string[],
  candidateIds: readonly string[],
  cap: number,
): string[] {
  const idSet = new Set(candidateIds);
  const limit = Math.max(0, Math.floor(Number.isFinite(cap) ? cap : 0));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of selected) {
    if (!id || !idSet.has(id) || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
    if (out.length >= limit) break;
  }
  return out;
}

/**
 * Czy karta kandydata (niezaznaczona) ma być zablokowana, bo limit `cap` jest
 * już osiągnięty (rekomendacja zlecenia pkt.3: blokada zaznaczenia kolejnej
 * cywilizacji po osiągnięciu `civ_types_count`, nie milcząca podmiana wyboru).
 * / EN: whether an unselected candidate card should be disabled because the
 * `cap` is already reached — block further picks rather than silently swapping.
 */
export function isAiCivCardDisabled(isSelected: boolean, selectedCount: number, cap: number): boolean {
  return !isSelected && selectedCount >= cap;
}
