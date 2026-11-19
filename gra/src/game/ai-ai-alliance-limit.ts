/**
 * R-WEB-AI-AI-ALLIANCE-LIMIT-2-VIOLATED-Q1 -- WSPÓLNE sprawdzenie limitu sojuszy na cywilizację.
 *
 * CZYSTA logika (bez DOM, bez Math.random, bez Date). Jedno źródło prawdy dla WSZYSTKICH ścieżek
 * zawierania sojuszu AI↔AI: tor tickAiAiAllianceRequests (ai-ai-alliance-tick.ts) oraz gałąź sióstr
 * (main.ts, sojusz_siostry_*). Liczenie idzie z PEŁNEGO stanu aktywnych traktatów (activeDeals),
 * a nie z osobnego licznika ani z samego wyniku planera.
 *
 * Założenia (zapisane, bo dispatch ich nie rozstrzygał):
 *  - limit dotyczy sojuszy cywilizacji AI z DOWOLNĄ stroną liczoną do limitu: inną główną AI albo graczem
 *    (wołający podaje `liczoneStrony` = główne AI ∪ {gracz});
 *  - państwa-miasta (city-state) NIE liczą się do limitu i nie są w `liczoneStrony`;
 *  - para (a,b) liczy się do limitu obu stron raz (sojusz to jeden traktat z dwiema stronami);
 *  - sojusze bez AI po obu stronach (np. gracz↔państwo-miasto) nie wchodzą do liczenia.
 *
 * Flaga torSojuszyAktywny (ai-ai-treaty-params.json, domyślnie false) decyduje o WYWOŁANIU sprawdzenia
 * po stronie main.ts; sam moduł nie czyta flagi (jest czysty i testowalny).
 */

/** Minimalny kształt traktatu potrzebny do liczenia (zgodny z ActiveDeal w main.ts). */
export interface LimitDealLike {
  readonly rodzaj: unknown;
  readonly strony: readonly number[];
}

export interface AiAiAllianceLimitInput {
  /** Pełny stan aktywnych traktatów. */
  readonly deals: readonly LimitDealLike[];
  /** Czy rodzaj traktatu jest sojuszem (sojusz_pelny / sojusz_defensywny / sojusz wojskowy). */
  readonly isAlliance: (rodzaj: unknown) => boolean;
  /** Główne cywilizacje AI, których limit dotyczy. */
  readonly aiCivs: ReadonlySet<number>;
  /** Strony liczone do limitu jako partner (główne AI ∪ gracz). Państwa-miasta poza zbiorem. */
  readonly liczoneStrony: ReadonlySet<number>;
  /** Limit twardy sojuszy na cywilizację. */
  readonly maxSojuszy: number;
}

/**
 * Liczba aktywnych sojuszy na każdą główną cywilizację AI (ownerId -> n). Każdy sojusz liczony raz
 * na każdą stronę będącą cywilizacją AI, o ile druga strona jest w `liczoneStrony`.
 */
export function liczbaSojuszyCywilizacji(input: AiAiAllianceLimitInput): Map<number, number> {
  const licznik = new Map<number, number>();
  for (const oid of input.aiCivs) licznik.set(oid, 0);
  for (const d of input.deals) {
    if (!input.isAlliance(d.rodzaj)) continue;
    const [x, y] = d.strony;
    if (x === undefined || y === undefined || x === y) continue;
    if (input.aiCivs.has(x) && input.liczoneStrony.has(y)) licznik.set(x, (licznik.get(x) ?? 0) + 1);
    if (input.aiCivs.has(y) && input.liczoneStrony.has(x)) licznik.set(y, (licznik.get(y) ?? 0) + 1);
  }
  return licznik;
}

/**
 * Czy nowy sojusz między a i b jest dopuszczalny ze względu na limit: obie strony poniżej `maxSojuszy`.
 * Strona nie będąca cywilizacją AI (np. gracz) nie jest ograniczana tym limitem.
 */
export function sojuszLimitPozwala(input: AiAiAllianceLimitInput, a: number, b: number): boolean {
  const licznik = liczbaSojuszyCywilizacji(input);
  const ok = (oid: number): boolean => !input.aiCivs.has(oid) || (licznik.get(oid) ?? 0) < input.maxSojuszy;
  return ok(a) && ok(b);
}
