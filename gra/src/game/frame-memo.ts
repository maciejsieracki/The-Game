/**
 * R-WEB-PERF-LATE-GAME-LAG-HUD-Q2: małe, czyste (bez DOM/three) pomocniki pamięci podręcznej
 * o ZAKRESIE jednego synchronicznego wywołania. Wyniesione z main.ts/hud.ts, żeby dało się je
 * uruchomić w teście (tools/perf-hud-frame-memo-test.cjs), a nie tylko czytać regexami.
 */

/**
 * Pamięć podręczna aktywna wyłącznie wewnątrz `run(fn)`. Poza zakresem `cached` zawsze liczy od
 * nowa (zachowanie sprzed zmiany). `run` zagnieżdżone współdzieli zakres zewnętrzny.
 * Każdy NOWY zakres najwyższego poziomu zaczyna z pustym magazynem (brak starych wpisów między
 * wywołaniami, więc mutacja świata między wywołaniami nie może dać nieaktualnego wyniku).
 * `copy` chroni wpis przed zanieczyszczeniem przez wołającego.
 */
export interface ScopeMemo {
  run<T>(fn: () => T): T;
  cached<T>(key: string, compute: () => T, copy: (v: T) => T): T;
  readonly active: boolean;
}

export function createScopeMemo(): ScopeMemo {
  let store: Map<string, unknown> | null = null;
  return {
    run<T>(fn: () => T): T {
      if (store !== null) return fn();
      store = new Map();
      try { return fn(); } finally { store = null; }
    },
    cached<T>(key: string, compute: () => T, copy: (v: T) => T): T {
      if (store === null) return compute();
      if (!store.has(key)) store.set(key, compute());
      return copy(store.get(key) as T);
    },
    get active(): boolean { return store !== null; },
  };
}

/**
 * Migawka stanu na czas jednego synchronicznego `run(fn)` (np. `updateHud()`): pierwszy odczyt w
 * zakresie woła `getState()`, kolejne zwracają tę samą migawkę. Poza zakresem każdy odczyt jest
 * świeży. Zagnieżdżone `run` UNIEWAŻNIA migawkę przy wejściu (nowe odświeżenie = nowy odczyt),
 * więc stan zmutowany przed zagnieżdżonym odświeżeniem nigdy nie jest renderowany ze starej migawki.
 */
export interface StateFrame<S> {
  snapshot(): S;
  run(fn: () => void): void;
  /** Ręczne unieważnienie (np. po zmutowaniu stanu w trakcie zakresu). */
  invalidate(): void;
}

export function createStateFrame<S>(getState: () => S): StateFrame<S> {
  let active = false;
  let has = false;
  let frame: S | undefined;
  return {
    snapshot(): S {
      if (!active) return getState();
      if (!has) { frame = getState(); has = true; }
      return frame as S;
    },
    run(fn: () => void): void {
      const outer = active;
      active = true; has = false; frame = undefined; // także zagnieżdżone: świeży odczyt
      try { fn(); } finally { if (!outer) { active = false; has = false; frame = undefined; } }
    },
    invalidate(): void { has = false; frame = undefined; },
  };
}

/**
 * Zakres "czystego odczytu" dla HUD: aktywny wyłącznie wewnątrz `buildHudState()` (main.ts), czyli podczas jednego synchronicznego,
 * NIEMUTUJĄCEGO stanu gry przebiegu (podgląd ekonomii miast gracza + wiersze zasobów). Wewnątrz zakresu wyniki funkcji czystych
 * względem (miasto, mapa, węzły terytorium, epoka) są liczone raz (np. `cityWorkedTilesForEconomy`, wołane kilka razy na miasto
 * z `previewCityEconomy` / `computeWorkedMagazynYieldsByCity` / wierszy zasobów). Poza zakresem zawsze liczy od nowa.
 */
export const hudPureScope: ScopeMemo = createScopeMemo();

const objectIds = new WeakMap<object, number>();
let objectIdSeq = 0;
/** Stabilny numer tożsamości obiektu (do kluczy pamięci zakresowej). */
export function scopeObjectId(o: object | null | undefined): number {
  if (!o) return 0;
  let id = objectIds.get(o);
  if (id === undefined) { id = ++objectIdSeq; objectIds.set(o, id); }
  return id;
}
