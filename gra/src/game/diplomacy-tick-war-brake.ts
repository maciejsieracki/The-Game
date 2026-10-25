// R-WEB-DIPLO-TICK-WAR-BRAKE-Q1 — czyste funkcje hamulca wojny (P6), bonusu Zaufania
// za wymianę „na plusie" (P7, schodki) i flagi calego pakietu. Bez zaleznosci od stanu
// gry — silnik (main.ts) podaje wejscia, dostaje wynik. Parametry z
// gra/data/diplomacy-tick-params.json (sekcje p6 / p7).

/** Domyslnie OFF: bez flagi zachowanie i hash stanu identyczne z baza. */
export const DIPLO_TICK_WAR_BRAKE_ENABLED_DEFAULT = false;

let flagOverride: boolean | null = null;

/** Tylko testy/diagnostyka: wymusza ON/OFF; null = wroc do stalej. */
export function setDiploTickWarBrakeOverride(value: boolean | null): void {
  flagOverride = value;
}

export function isDiploTickWarBrakeEnabled(): boolean {
  return flagOverride !== null ? flagOverride : DIPLO_TICK_WAR_BRAKE_ENABLED_DEFAULT;
}

export interface WarBrakeP6Params {
  /** Prog krytyczny Zaufania (wlacznie): Zaufanie <= prog liczy sie jako kryzys. */
  kryzysProgZaufania: number;
  /** Liczba kolejnych tur kryzysu, po ktorych strona silniejsza wypowiada wojne. */
  kryzysTurDoWojny: number;
  /** Ile tur przed wojna gracz dostaje ostrzezenie (gdy para dotyczy gracza). */
  kryzysOstrzezenieTurPrzed: number;
}

export interface TradeBonusP7Params {
  /** Krok nadwyzki (PN) per numer epoki platacego (dostawcy). */
  wymianaKrokPktPerEpoka: Record<string, number>;
  /** Mnoznik kroku na kazda epoke ponad najwieksza epoke w tabeli (x2). */
  wymianaMnoznikNaEpoke: number;
  /** Zaufanie za kazdy PELNY krok nadwyzki w turze (brak interpolacji). */
  wymianaZaufanieNaKrok: number;
  /** Limit bonusu z wymiany na pare na ture (+5,0 = 10 pelnych krokow kamienia). */
  wymianaMaxPerTura: number;
  /** Sufit Zaufania: bonus z wymiany nie podnosi Zaufania powyzej tej wartosci. */
  wymianaSufitZaufania: number;
  /** Minimalna liczba kolejnych tur dostaw, zanim bonus zacznie dzialac (1. tura = 0). */
  wymianaMinTurDostaw: number;
}

export interface TradeBonusInput {
  /** Wartosc netto na plusie (PN) dostarczona przez strone X stronie Y w tej turze. */
  nadwyzkaPn: number;
  /** Numer epoki platacego (dostawcy X). */
  epoka: number;
  /** Aktualne Zaufanie odbiorcy (Y) wobec dostawcy (X). */
  zaufanie: number;
  /** Liczba kolejnych tur dostaw (1 = pierwsza tura cyklu). */
  kolejneTuryDostaw: number;
}

/** Krok nadwyzki (PN) dla epoki: tabela; powyzej jej najwiekszego klucza — mnoznik na epoke. */
export function krokPktWymiany(epoka: number, p: TradeBonusP7Params): number {
  const keys = Object.keys(p.wymianaKrokPktPerEpoka)
    .map(Number)
    .filter(n => Number.isFinite(n))
    .sort((x, y) => x - y);
  if (keys.length === 0) return Number.POSITIVE_INFINITY;
  const e = Math.max(keys[0]!, Math.floor(epoka));
  const top = keys[keys.length - 1]!;
  if (e <= top) {
    const v = p.wymianaKrokPktPerEpoka[String(e)];
    if (typeof v === 'number' && v > 0) return v;
    // luka w tabeli (epoka posrednia) — najblizszy nizszy klucz
    const lower = keys.filter(k => k <= e).pop() ?? keys[0]!;
    return p.wymianaKrokPktPerEpoka[String(lower)]!;
  }
  const base = p.wymianaKrokPktPerEpoka[String(top)]!;
  return base * Math.pow(p.wymianaMnoznikNaEpoke, e - top);
}

/**
 * P7: bonus Zaufania (>= 0) za wymiane „na plusie" w jednej turze.
 * Schodkowo, bez interpolacji: floor(nadwyzka / krok) x wymianaZaufanieNaKrok,
 * limit wymianaMaxPerTura; zero gdy dostawa trwa krocej niz wymianaMinTurDostaw,
 * nadwyzka < krok albo Zaufanie >= sufit. Przyciete do wolnego miejsca pod sufitem.
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
  /** Nowa wartosc licznika kryzysu (kolejne tury Zaufania <= progu). */
  counter: number;
  /** true, gdy licznik jest na poziomie ostrzezenia lub wyzej (N - ostrzezenieTurPrzed .. N). */
  warningActive: boolean;
  /** true, gdy licznik osiagnal N — strona silniejsza moze wypowiedziec wojne (po sprawdzeniu R1/R2). */
  warTriggerReady: boolean;
}

/**
 * P6: jeden krok histerezy dla pary. Licznik rosnie, gdy Zaufanie <= prog,
 * zeruje sie natychmiast, gdy Zaufanie > prog (takze po umowie wspolpracy).
 * Ostrzezenie trwa od progu N - ostrzezenieTurPrzed takze po load w trakcie kryzysu.
 */
export function advanceCrisisCounter(prevCounter: number, zaufanie: number, p: WarBrakeP6Params): CrisisStep {
  const prev = Number.isFinite(prevCounter) && prevCounter > 0 ? Math.floor(prevCounter) : 0;
  if (!(zaufanie <= p.kryzysProgZaufania)) {
    return { counter: 0, warningActive: false, warTriggerReady: false };
  }
  const counter = prev + 1;
  const warnAt = p.kryzysTurDoWojny - p.kryzysOstrzezenieTurPrzed;
  return {
    counter,
    warningActive: counter >= warnAt,
    warTriggerReady: counter >= p.kryzysTurDoWojny,
  };
}

/** Klucz pary niezalezny od kolejnosci ownerow. */
export function crisisPairKey(a: number, b: number): string {
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  return `${lo}-${hi}`;
}

/**
 * Odczyt mapy licznikow z save: nieliczbowe / ujemne / brakujace wartosci → pomijane.
 * Stare zapisy bez pola daja pusta mape (kazda para = 0).
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
 * Kolejka wojen z progu: najdluzej na progu pierwsze, przy remisie nizsze
 * min(ownerId) pary, potem nizsze max(ownerId). Nie modyfikuje wejscia.
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
 * Strona wypowiadajaca wojne po upływie N tur: silniejsza (wieksza potega),
 * przy remisie nizsze ownerId. ZALOZENIE (dispatch nie precyzuje remisu).
 */
export function pickWarDeclarer(
  a: { ownerId: number; power: number },
  b: { ownerId: number; power: number },
): number {
  if (a.power !== b.power) return a.power > b.power ? a.ownerId : b.ownerId;
  return Math.min(a.ownerId, b.ownerId);
}
