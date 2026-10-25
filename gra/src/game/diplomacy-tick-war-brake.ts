// R-WEB-DIPLO-TICK-WAR-BRAKE-Q1 — czyste funkcje hamulca wojny (P6) i bonusu
// Zaufania za wymianę „na plusie" (P7). Bez zależności od stanu gry — silnik
// (main.ts / diplomacy.ts) podaje wejścia, dostaje wynik. Parametry z
// gra/data/diplomacy-tick-params.json (sekcje p6 / p7).

export interface WarBrakeP6Params {
  /** Próg krytyczny Zaufania (włącznie): Zaufanie ≤ próg liczy się jako kryzys. */
  kryzysProgZaufania: number;
  /** Liczba kolejnych tur kryzysu, po których strona silniejsza wypowiada wojnę. */
  kryzysTurDoWojny: number;
  /** Ile tur przed wojną gracz dostaje ostrzeżenie (gdy para dotyczy gracza). */
  kryzysOstrzezenieTurPrzed: number;
}

export interface TradeBonusP7Params {
  /** Krok nadwyżki (PN) per epoka płacącego: kamien/braz/zelazo. */
  wymianaKrokPktPerEpoka: Record<string, number>;
  /** Krok dla epok nieznanych w tabeli (ZAŁOŻENIE: ostatnia znana wartość). */
  wymianaKrokPktDomyslny: number;
  /** Zaufanie za każdy PEŁNY krok nadwyżki w turze (brak interpolacji). */
  wymianaZaufanieNaKrok: number;
  /** Limit bonusu z wymiany na parę na turę. */
  wymianaMaxPerTura: number;
  /** Sufit Zaufania: bonus z wymiany nie podnosi Zaufania powyżej tej wartości. */
  wymianaSufitZaufania: number;
  /** Minimalna liczba kolejnych tur dostaw, zanim bonus zacznie działać. */
  wymianaMinTurDostaw: number;
}

export interface TradeBonusInput {
  /** Wartość netto na plusie (PN) dostarczona przez stronę X stronie Y w tej turze. */
  nadwyzkaPn: number;
  /** Epoka płacącego (dostawcy) — klucz z wymianaKrokPktPerEpoka. */
  epoka: string;
  /** Aktualne Zaufanie odbiorcy (Y) wobec dostawcy (X). */
  zaufanie: number;
  /** Liczba kolejnych tur dostaw (1 = pierwsza tura cyklu). */
  kolejneTuryDostaw: number;
}

export function krokPktWymiany(epoka: string, p: TradeBonusP7Params): number {
  const v = p.wymianaKrokPktPerEpoka[epoka];
  return typeof v === 'number' && v > 0 ? v : p.wymianaKrokPktDomyslny;
}

/**
 * P7: bonus Zaufania (≥ 0) za wymianę „na plusie" w jednej turze.
 * Schodkowo: floor(nadwyżka / krok) × 0,5, limit wymianaMaxPerTura,
 * zero gdy za krótko trwa dostawa, Zaufanie ≥ sufitu, lub nadwyżka < krok.
 * Bonus jest przycięty tak, by nie przekroczyć sufitu.
 */
export function tradeTrustBonusPerTura(input: TradeBonusInput, p: TradeBonusP7Params): number {
  if (!(input.nadwyzkaPn > 0)) return 0;
  if (input.kolejneTuryDostaw < p.wymianaMinTurDostaw) return 0;
  const headroom = p.wymianaSufitZaufania - input.zaufanie;
  if (!(headroom > 0)) return 0;
  const krok = krokPktWymiany(input.epoka, p);
  const pelneKroki = Math.floor(input.nadwyzkaPn / krok);
  const surowy = pelneKroki * p.wymianaZaufanieNaKrok;
  return Math.min(surowy, p.wymianaMaxPerTura, headroom);
}

export interface CrisisStep {
  /** Nowa wartość licznika kryzysu (kolejne tury Zaufania ≤ progu). */
  counter: number;
  /** true, gdy w tej turze licznik osiągnął próg ostrzeżenia (N − ostrzeżenieTurPrzed). */
  warnNow: boolean;
  /** true, gdy licznik osiągnął N — strona silniejsza może wypowiedzieć wojnę (po sprawdzeniu R1–R3). */
  warTriggerReady: boolean;
}

/**
 * P6: jeden krok histerezy dla pary. Licznik rośnie, gdy Zaufanie ≤ próg,
 * zeruje się natychmiast, gdy Zaufanie > próg (w tym po umowie współpracy).
 */
export function advanceCrisisCounter(prevCounter: number, zaufanie: number, p: WarBrakeP6Params): CrisisStep {
  const prev = Number.isFinite(prevCounter) && prevCounter > 0 ? Math.floor(prevCounter) : 0;
  if (!(zaufanie <= p.kryzysProgZaufania)) {
    return { counter: 0, warnNow: false, warTriggerReady: false };
  }
  const counter = prev + 1;
  const warnAt = p.kryzysTurDoWojny - p.kryzysOstrzezenieTurPrzed;
  return {
    counter,
    warnNow: counter === warnAt,
    warTriggerReady: counter >= p.kryzysTurDoWojny,
  };
}

/** Klucz pary niezależny od kolejności ownerów. */
export function crisisPairKey(a: number, b: number): string {
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  return `${lo}-${hi}`;
}

/**
 * Odczyt licznika z save: nieliczbowe / ujemne / brakujące wartości → 0.
 * Stare zapisy bez pola `kryzysLicznik` dają pustą mapę (każda para = 0).
 */
export function parseCrisisCounters(raw: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === 'number' && Number.isFinite(v) && v > 0) out[k] = Math.floor(v);
  }
  return out;
}

export interface CrisisQueueEntry {
  ownerA: number;
  ownerB: number;
  counter: number;
}

/**
 * Kolejka wojen z progu: najdłużej na progu pierwsze, przy remisie niższe
 * ownerId (min z pary) pierwsze. Nie modyfikuje wejścia.
 */
export function sortCrisisQueue(entries: readonly CrisisQueueEntry[]): CrisisQueueEntry[] {
  return entries.slice().sort((x, y) => {
    if (y.counter !== x.counter) return y.counter - x.counter;
    const xl = Math.min(x.ownerA, x.ownerB);
    const yl = Math.min(y.ownerA, y.ownerB);
    if (xl !== yl) return xl - yl;
    return Math.max(x.ownerA, x.ownerB) - Math.max(y.ownerA, y.ownerB);
  });
}

/**
 * Strona wypowiadająca wojnę po upływie N tur: silniejsza (większa potęga),
 * przy remisie niższe ownerId. ZAŁOŻENIE (dispatch nie precyzuje remisu).
 */
export function pickWarDeclarer(
  a: { ownerId: number; power: number },
  b: { ownerId: number; power: number },
): number {
  if (a.power !== b.power) return a.power > b.power ? a.ownerId : b.ownerId;
  return Math.min(a.ownerId, b.ownerId);
}
