/**
 * diplomacy-war-limit.ts — R-WEB-DIPLO-WAR-LIMIT-1-ERA-1-NATURAL-Q1 (ABC, reguła C, 2026-11-18).
 *
 * Reguła właściciela: maks. 1 wojna epoki + 1 wojna naturalna naraz per cywilizacja.
 * Gracz jako DEKLARUJĄCY nie jest ograniczany (egzekwuje wywołujący w main.ts).
 * Barbarzyńcy nie liczą się (wywołujący podaje tylko wojny cywilizacji i państw-miast).
 *
 * Moduł czysty: bez DOM i bez silnika gry. Flaga `limitWojenAktywny` domyślnie true (dane)
 * = zachowanie identyczne jak przed zmianą (parytet).
 * EN: pure module; at most 1 era war + 1 natural war per civilization, behind a flag (default off).
 */
import warLimitParamsJson from '../../data/diplomacy-war-limit-params.json';
import type { DiploPairMeta } from './diplomacy-pn-engine';

/** Typ wojny. Brak pola w starym zapisie = 'naturalna' (kompatybilność wsteczna). */
export type TypWojny = 'epoki' | 'naturalna';

export interface WarLimitParams {
  /** Egzekwowanie limitu. false = zachowanie jak dotąd (parytet). */
  limitWojenAktywny: boolean;
  /** Maks. równoczesnych wojen epoki per cywilizacja. */
  maxWojenEpoki: number;
  /** Maks. równoczesnych wojen naturalnych per cywilizacja. */
  maxWojenNaturalnych: number;
}

/** Normalizacja: wartość inna niż dokładnie 'epoki' (np. brak pola, null, stary zapis) = 'naturalna'. */
export function parseTypWojny(value: unknown): TypWojny {
  return value === 'epoki' ? 'epoki' : 'naturalna';
}

/** Parametry z JSON; niepoprawne pola wracają do wartości bezpiecznych (limit 1, flaga off). */
export function loadWarLimitParams(raw: unknown): WarLimitParams {
  const r = (raw ?? {}) as Record<string, unknown>;
  const pick = (key: string, fallback: number): number => {
    const entry = r[key] as { wartosc?: unknown } | number | undefined;
    const v = typeof entry === 'object' && entry !== null ? entry.wartosc : entry;
    return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : fallback;
  };
  const flagEntry = r.limitWojenAktywny as { wartosc?: unknown } | boolean | undefined;
  const flagVal = typeof flagEntry === 'object' && flagEntry !== null ? flagEntry.wartosc : flagEntry;
  return {
    limitWojenAktywny: flagVal === true,
    maxWojenEpoki: pick('maxWojenEpoki', 1),
    maxWojenNaturalnych: pick('maxWojenNaturalnych', 1),
  };
}

export const WAR_LIMIT_PARAMS: WarLimitParams = loadWarLimitParams(warLimitParamsJson);

let flagOverride: boolean | null = null;

/** Hak testowy (NIE z UI): wymusza flagę; null = wartość z JSON. */
export function setWarLimitEnabledForTest(value: boolean | null): void {
  flagOverride = value;
}

export function isWarLimitEnabled(params: WarLimitParams = WAR_LIMIT_PARAMS): boolean {
  if (flagOverride !== null) return flagOverride;
  return params.limitWojenAktywny === true;
}

/** Typ wojny z meta pary (brak meta / brak pola = 'naturalna'). Meta: DiploPairMeta (bez zmiany typu w silniku). */
export function getWarTypFromMeta(meta: DiploPairMeta | undefined): TypWojny {
  return parseTypWojny((meta as { typWojny?: unknown } | undefined)?.typWojny);
}

/** Kopia meta pary z ustawionym typem wojny (pole dopisane poza typem DiploPairMeta; przeżywa zapis, bo serializacja kopiuje cały obiekt). */
export function withWarTyp(meta: DiploPairMeta, typ: TypWojny): DiploPairMeta {
  const out: DiploPairMeta & { typWojny: TypWojny } = { ...meta, typWojny: typ };
  return out;
}

/** Wpis relacji cywilizacji `ownerId` z jedną inną stroną (wejście dla collectWarTypes). */
export interface WarPairRow {
  /** Strona druga pary. */
  otherId: number;
  /** Czy para jest w stanie 'wojna'. */
  atWar: boolean;
  /** Barbarzyńca — nie liczy się do limitu. */
  isBarbarian: boolean;
  /** Pomijany (np. wojna z celem, którego limit dotyczy osobno). */
  excluded: boolean;
  /** Meta pary (może być undefined). */
  meta: DiploPairMeta | undefined;
}

/**
 * Typy aktywnych wojen cywilizacji z wierszy relacji. Pomija: nie-wojnę, barbarzyńców, pomijanych.
 * Państwa-miasta (nie barbarzyńcy) liczą się jak cywilizacje.
 */
export function collectWarTypes(rows: ReadonlyArray<WarPairRow>): TypWojny[] {
  const out: TypWojny[] = [];
  for (const r of rows) {
    if (!r.atWar || r.isBarbarian || r.excluded) continue;
    out.push(getWarTypFromMeta(r.meta));
  }
  return out;
}

/** Liczba wojen danego typu na liście aktywnych wojen cywilizacji. */
export function countWarsOfType(wars: ReadonlyArray<TypWojny>, typ: TypWojny): number {
  let n = 0;
  for (const w of wars) if (w === typ) n++;
  return n;
}

/**
 * Czy wolno otworzyć nową wojnę typu `typ` między cywilizacjami o podanych aktywnych wojnach.
 * Zabroniona, gdy ATAKUJĄCY lub OBROŃCA ma już tyle wojen tego typu, ile wynosi maksimum.
 * Flaga OFF -> zawsze true (parytet).
 */
export function warLimitAllows(
  typ: TypWojny,
  attackerWars: ReadonlyArray<TypWojny>,
  defenderWars: ReadonlyArray<TypWojny>,
  params: WarLimitParams = WAR_LIMIT_PARAMS,
): boolean {
  if (!isWarLimitEnabled(params)) return true;
  const max = typ === 'epoki' ? params.maxWojenEpoki : params.maxWojenNaturalnych;
  if (countWarsOfType(attackerWars, typ) >= max) return false;
  if (countWarsOfType(defenderWars, typ) >= max) return false;
  return true;
}
