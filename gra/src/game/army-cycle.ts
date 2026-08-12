/**
 * army-cycle.ts — R-SCOUT-ZWIEDZAJ-PODSWIETLENIE-Q2 (Evaluator, runda PASS-WITH-NOTES, N1,
 * 2026-08-10): logika cyklowania armii gracza (Spacja / auto-cykl „bęben" / strzałki HUD ◀▶ /
 * odznaczenie po włączeniu Zwiedzaj) wyniesiona z domknięcia `boot()` w main.ts do CZYSTEGO,
 * importowalnego modułu — operuje wyłącznie na tablicy jednostek podanej jako argument, bez
 * żadnego stanu globalnego gry. Dzięki temu da się napisać PRAWDZIWY test behawioralny na
 * sztucznych `RuntimeUnit`-ach (assercje na WYNIKU wywołania), zamiast wyłącznie regexów nad
 * tekstem main.ts, które są ślepe na mutacje logiki (np. usunięcie `selectPlayerUnit(next.id)`
 * w main.ts albo `if (true) return;` na wejściu do funkcji cyklującej — żadna z tych mutacji nie
 * zmienia ŻADNEGO regexu dopasowanego do main.ts, ale obie łamią wynik tej funkcji).
 *
 * EN: army-cycle.ts — pulled the player-army cycling logic (Space / post-move "drum" auto-cycle /
 * HUD ◀▶ arrows / deselect-after-enabling-Explore) out of main.ts's `boot()` closure into a PURE,
 * importable module — it only operates on a units array passed in as an argument, no global game
 * state. That makes a REAL behavioral test possible (assertions on the call's RESULT) instead of
 * only regexes over main.ts's source text, which are blind to logic mutations (e.g. removing
 * `selectPlayerUnit(next.id)` in main.ts, or `if (true) return;` at the top of the cycling
 * function — neither mutation changes any regex matched against main.ts, but both break this
 * function's actual output).
 *
 * `stackCanMove` (main.ts) zależy od stanu ruchu stosu (planningStackRuchLeft + activeUnitStack)
 * i zostaje w main.ts — tu przyjmowana jako iniekcyjna funkcja `canMove`, żeby ten moduł nie
 * musiał znać reszty stanu gry (units poza samą tablicą, plannedMarches, itd.).
 * / EN: `stackCanMove` (main.ts) depends on stack move-left state (planningStackRuchLeft +
 * activeUnitStack) and stays in main.ts — accepted here as an injected `canMove` function so this
 * module doesn't need to know the rest of the game state.
 */
import type { RuntimeUnit } from '../units/setup';
import { stackRenderKey } from './armyMerge';

/** Jednostka aktywna do cyklu Spacja/HUD — nie uśpiona, nie w garnizonie, nie ufortyfikowana w
 * polu, nie zwiedzająca (autoExplore). / EN: unit eligible for Space/HUD cycling — not sentried,
 * not garrisoned, not field-fortified, not auto-exploring. */
export function isUnitActiveForCycle(u: RuntimeUnit): boolean {
  return u.sentry !== true
    && u.autoExplore !== true
    && u.inGarnizon !== true
    && u.ufortyfikowanyWPolu !== true;
}

/**
 * Wspólna implementacja list cyklowania armii gracza (1 wiodąca/heks; kolejność przestrzenna).
 * `requireMoves=true` → tylko stosy z dostępnym ruchem w tej turze (Spacja, auto-cykl „bęben").
 * `requireMoves=false` → wszystkie aktywne stosy, niezależnie od ruchu (strzałki HUD ◀▶).
 * / EN: shared implementation of the player-army cycling list (1 lead per hex; spatial order).
 * `requireMoves=true` → only stacks with moves left this turn (Space, post-move "drum" auto-cycle).
 * `requireMoves=false` → all active stacks regardless of moves (HUD ◀▶ arrows).
 */
export function cyclablePlayerArmyLeadsBase(
  units: ReadonlyArray<RuntimeUnit>,
  requireMoves: boolean,
  canMove: (u: RuntimeUnit) => boolean,
): RuntimeUnit[] {
  const playerUnits = units.filter(
    u => u.ownerId === 0 && isUnitActiveForCycle(u) && (!requireMoves || canMove(u)),
  );
  // Grupowanie MUSI iść po stackRenderKey (tożsamość STOSU + POZYCJA + garnizon) — patrz
  // komentarz BB2 przy stackRenderKey w armyMerge.ts. / EN: grouping MUST use stackRenderKey
  // (stack IDENTITY + POSITION + garrison) — see the BB2 comment on stackRenderKey in armyMerge.ts.
  const stacks = new Map<string, RuntimeUnit[]>();
  for (const u of playerUnits) {
    const key = stackRenderKey(u);
    const arr = stacks.get(key);
    if (arr) arr.push(u);
    else stacks.set(key, [u]);
  }
  const out: RuntimeUnit[] = [];
  for (const group of stacks.values()) {
    out.push(group[0]!);
  }
  out.sort((a, b) => {
    const sa = a.q + a.r;
    const sb = b.q + b.r;
    if (sa !== sb) return sa - sb;
    if (a.q !== b.q) return a.q - b.q;
    return a.r - b.r;
  });
  return out;
}

/**
 * Rozwiązuje, które id ma zostać zaznaczone po cyklu (Spacja / „bęben" / strzałki HUD / odznaczenie
 * po włączeniu Zwiedzaj) — czysta funkcja, BEZ efektów ubocznych (main.ts woła
 * `selectPlayerUnit`/`focusCameraOnUnit`/`clearPlayerUnitSelection` na podstawie wyniku).
 * Zwraca `null`, gdy `list` jest pusta — main.ts interpretuje to jako pełne odznaczenie.
 * / EN: resolves which id should become selected after a cycle (Space / "drum" / HUD arrows /
 * deselect-after-enabling-Explore) — a pure function, NO side effects (main.ts calls
 * `selectPlayerUnit`/`focusCameraOnUnit`/`clearPlayerUnitSelection` based on the result).
 * Returns `null` when `list` is empty — main.ts treats that as a full deselect.
 */
export function resolveAdjacentPlayerUnitCycle(
  units: ReadonlyArray<RuntimeUnit>,
  list: ReadonlyArray<RuntimeUnit>,
  afterId: string | null,
  delta: 1 | -1,
): string | null {
  if (list.length === 0) return null;
  // Domyślnie (brak zaznaczenia LUB zaznaczona jednostka nie występuje już w `list` — np. bęben
  // po ruchu, kiedy jednostka właśnie wyczerpała ruch i wypadła z listy „z ruchem"): start tuż
  // PRZED pierwszym/PO ostatnim elemencie, żeby +delta wylądował na list[0] (w przód) albo
  // list[list.length-1] (wstecz) — bez pomijania najbliższej możliwej jednostki w kierunku ruchu.
  let cur = delta > 0 ? -1 : 0;
  if (afterId !== null) {
    const idxById = list.findIndex(u => u.id === afterId);
    if (idxById >= 0) {
      cur = idxById;
    } else {
      const selected = units.find(x => x.id === afterId);
      if (selected) {
        const key = stackRenderKey(selected);
        const idxByHex = list.findIndex(u => stackRenderKey(u) === key);
        if (idxByHex >= 0) cur = idxByHex;
      }
    }
  }
  const idx = (cur + delta + list.length) % list.length;
  return list[idx]!.id;
}
