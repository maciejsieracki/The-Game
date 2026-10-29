/**
 * k07b-deps.ts (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K07B-Q1, runda 2): delegaty zależności pinu dla jednostek K07B (DOM).
 *
 * K07B-Z2: funkcje pinu spoza bieżącej partii (kawałki K01–K06, DOM sąsiednich jednostek K07B jeszcze nieprzeniesione,
 * funkcje sterujące kontrolera) są wołane przez `dep(nazwa)`; wartości wstrzykuje kontroler przez `setK07bDeps`.
 * K07B-Z4: wartości danych/stanu (`cfg`, `gameData`, `activeMap`, …) to leniwe proxy do obiektu z `setK07bDeps`.
 * Wiring kontrolera (`setK07bDeps`): NIE_ZMIERZONO — brak delegatu = wyjątek jawny (nie cicha wartość domyślna).
 */

/** Delegaty K07B: funkcje pinu albo wartości (obiekty danych, stałe). */
export type K07bDeps = Record<string, unknown>;

let deps: K07bDeps | null = null;

/** Ustawia zależności (merge z poprzednimi). */
export function setK07bDeps(next: K07bDeps): void {
  deps = { ...(deps ?? {}), ...next };
}

/** Delegat funkcji; brak delegatu = błąd jawny. */
export function dep(name: string): (...args: any[]) => any {
  const f = deps?.[name];
  if (typeof f !== 'function') throw new Error(`K07B: brak delegatu ${name} (setK07bDeps)`);
  return f as (...args: any[]) => any;
}

/** Leniwy odczyt wartości (obiekt danych/stanu); metody wiązane do obiektu źródłowego. */
export function valueProxy(name: string): any {
  const target = (): any => {
    const v = deps?.[name];
    if (v === undefined || v === null) throw new Error(`K07B: brak wartości ${name} (setK07bDeps)`);
    return v;
  };
  return new Proxy(
    {},
    {
      get: (_t, k) => {
        const t = target();
        const v = (t as any)[k];
        return typeof v === 'function' ? v.bind(t) : v;
      },
    },
  );
}
