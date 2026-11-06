/**
 * R-WEB-PERF-LATE-GAME-LAG-HUD-Q2 (runda 2): zakres pamieci podrecznej skladnikow zalezacych
 * WYLACZNIE od ownera. Otwierany tylko wokol petli, w ktorej stan gry nie jest mutowany.
 * Poza zakresem `scoped` zawsze liczy od nowa (zachowanie jak przed zmiana).
 */
export interface OwnerScope {
  withScope<T>(fn: () => T): T;
  scoped<T>(tag: string, ownerId: number, compute: () => T): T;
  isOpen(): boolean;
}

export function createOwnerScope(): OwnerScope {
  let cache: Map<string, unknown> | null = null;
  return {
    withScope<T>(fn: () => T): T {
      if (cache) return fn();
      cache = new Map();
      try { return fn(); } finally { cache = null; }
    },
    scoped<T>(tag: string, ownerId: number, compute: () => T): T {
      const sc = cache;
      if (!sc) return compute();
      const k = tag + ':' + ownerId;
      if (sc.has(k)) return sc.get(k) as T;
      const v = compute();
      sc.set(k, v);
      return v;
    },
    isOpen: () => cache !== null,
  };
}
