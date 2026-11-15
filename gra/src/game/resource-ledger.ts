/**
 * R-WEB-UI-RESOURCE-SOURCE-LEDGER-SKAD-ZAPASY-Q1 (partia 1: struktura + pipeline magazynu państwa).
 *
 * Dziennik źródeł przyrostu i zużycia surowców per właściciel, per tura ekonomii.
 * Czysta struktura danych: NIE zmienia stanu gry, NIE czyta RNG, NIE mutuje miast.
 * Zapisy wykonują istniejące miejsca modyfikacji City.surowce (ekonomia), a ten moduł
 * tylko je grupuje i sumuje.
 *
 * Kontrakt:
 *  - rekord tury = { byResource: surowiec -> klucz źródła -> { kind, label, amount } }
 *  - amount > 0 = przyrost magazynu państwa, amount < 0 = ubytek
 *  - suma amount po źródłach danego surowca = zmiana stanu magazynu państwa w tej turze
 *  - etykiety są po polsku (bez surowych ID), wpisywane przy zapisie
 *  - pamięć ostatnich N tur: N z econ-params.json (ekonomia_miasta.ksiega_zasobow_tury);
 *    brak parametru = domyślnie 10
 */

export type LedgerSourceKind =
  | 'teren'      // plony z mapy / ulepszeń terenu do magazynu państwa
  | 'stolarnia'  // bonus Stolarni (drewno z mapy)
  | 'konwersja'  // wyjście receptury (Garncarnia, Cegielnia, odlewnie)
  | 'wejscie'    // wejście receptury zużyte przez konwerter
  | 'spichlerz'; // drain Spichlerza (ceramika / sól)

export interface LedgerFlow {
  kind:   LedgerSourceKind;
  /** Czytelna etykieta po polsku, np. „Cegielnia (Lublin)”. */
  label:  string;
  /** Suma ze znakiem: > 0 przyrost, < 0 ubytek. */
  amount: number;
}

export interface ResourceLedgerTurn {
  /** surowiec -> klucz źródła -> przepływ */
  byResource: Record<string, Record<string, LedgerFlow>>;
}

export interface ResourceLedgerNet {
  gain: number;
  loss: number;
  net:  number;
}

export const LEDGER_DEFAULT_HISTORY_TURNS = 10;

export function createLedgerTurn(): ResourceLedgerTurn {
  return { byResource: {} };
}

/**
 * Dodaje przepływ do rekordu tury. Pomija wartości niefinityjne i zerowe.
 * `sourceKey` musi być deterministyczny (np. `konwersja|<cityId>|<recipeId>`),
 * żeby ten sam źródłowy przepływ sumował się w jeden wpis.
 */
export function recordLedgerFlow(
  turn: ResourceLedgerTurn,
  resourceKey: string,
  sourceKey: string,
  flow: { kind: LedgerSourceKind; label: string },
  amount: number,
): void {
  if (!Number.isFinite(amount) || amount === 0) return;
  const bySource = turn.byResource[resourceKey] ?? {};
  const prev = bySource[sourceKey];
  bySource[sourceKey] = {
    kind:   flow.kind,
    label:  flow.label,
    amount: (prev?.amount ?? 0) + amount,
  };
  turn.byResource[resourceKey] = bySource;
}

/** Sumy przyrostu / ubytku / netto dla jednego surowca w rekordzie tury. */
export function ledgerResourceNet(turn: ResourceLedgerTurn, resourceKey: string): ResourceLedgerNet {
  let gain = 0;
  let loss = 0;
  for (const flow of Object.values(turn.byResource[resourceKey] ?? {})) {
    if (flow.amount > 0) gain += flow.amount;
    else loss += flow.amount;
  }
  return { gain, loss, net: gain + loss };
}

/**
 * Dokleja rekord tury do historii i przycina do ostatnich `maxTurns` (najnowsze na końcu).
 * Zwraca nową tablicę; nie mutuje `history`.
 */
export function appendLedgerTurn(
  history: ReadonlyArray<ResourceLedgerTurn>,
  turn: ResourceLedgerTurn,
  maxTurns: number,
): ResourceLedgerTurn[] {
  const keep = Math.max(0, Math.floor(maxTurns));
  if (keep === 0) return [];
  const next = [...history, turn];
  return next.slice(Math.max(0, next.length - keep));
}

/**
 * Odczyt parametru N z surowego econ-params.json (wiersz -> kolumna trudności, jak num()
 * w turn-economy). Brak / zły wpis -> LEDGER_DEFAULT_HISTORY_TURNS.
 */
export function readLedgerHistoryTurns(
  rawEconParams: unknown,
  difficulty: 'easy' | 'normal' | 'hard',
): number {
  const raw = rawEconParams as { ekonomia_miasta?: Record<string, Record<string, number>> } | null | undefined;
  const row = raw?.ekonomia_miasta?.['ksiega_zasobow_tury'];
  const v = row ? row[difficulty] : undefined;
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : LEDGER_DEFAULT_HISTORY_TURNS;
}
