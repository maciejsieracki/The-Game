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
  | 'teren'                 // plony z mapy / ulepszeń terenu do magazynu państwa
  | 'stolarnia'             // bonus Stolarni (drewno z mapy)
  | 'konwersja'             // wyjście receptury (Garncarnia, Cegielnia, odlewnie)
  | 'wejscie'               // wejście receptury zużyte przez konwerter
  | 'spichlerz'             // drain Spichlerza (ceramika / sól)
  | 'utrzymanie_budynkow'   // utrzymanie budynków (surowce, po tiku)
  | 'utrzymanie_jednostek'  // utrzymanie jednostek (surowce, po tiku)
  | 'obywatele';            // zużycie przez obywateli (citizen-resource-upkeep)

/**
 * Miejsce zapisu w dzienniku dla wywołania, które odejmuje surowce z puli państwa.
 * `parts` rozbija pobrany koszt na źródła (kolejność = priorytet przy alokacji).
 */
export interface LedgerCostPart {
  kind:      LedgerSourceKind;
  sourceKey: string;
  label:     string;
  /** Koszt tego źródła (surowiec -> ilość), do alokacji faktycznie pobranej ilości. */
  cost:      Readonly<Record<string, number>>;
}

export interface LedgerCostSink {
  turn:  ResourceLedgerTurn;
  parts: ReadonlyArray<LedgerCostPart>;
}

/**
 * Rozdziela FAKTYCZNIE pobraną ilość (`taken`, surowiec -> ilość) na części `parts` w ich
 * kolejności: każda część dostaje min(pozostało, jej koszt); reszta (ponad koszty części)
 * trafia do OSTATNIEJ części. Suma wyniku po częściach = `taken` dla każdego surowca.
 * Zwraca listę wpisów { resourceKey, sourceKey, kind, label, amount } (amount > 0).
 */
export function allocateTakenToLedgerParts(
  taken: Readonly<Record<string, number>>,
  parts: ReadonlyArray<LedgerCostPart>,
): Array<{ resourceKey: string; sourceKey: string; kind: LedgerSourceKind; label: string; amount: number }> {
  const out: Array<{ resourceKey: string; sourceKey: string; kind: LedgerSourceKind; label: string; amount: number }> = [];
  if (parts.length === 0) return out;
  for (const [resourceKey, total] of Object.entries(taken)) {
    if (!(total > 0)) continue;
    let remaining = total;
    parts.forEach((part, idx) => {
      const isLast = idx === parts.length - 1;
      const want = Math.max(0, part.cost[resourceKey] ?? 0);
      const amount = isLast ? remaining : Math.min(remaining, want);
      remaining -= amount;
      if (amount > 0) {
        out.push({ resourceKey, sourceKey: part.sourceKey, kind: part.kind, label: part.label, amount });
      }
    });
  }
  return out;
}

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

/** Części księgi dla utrzymania właściciela: najpierw budynki, potem jednostki. */
export function upkeepLedgerParts(
  ownerId: number,
  buildingsCost: Readonly<Record<string, number>> | undefined,
  unitsCost: Readonly<Record<string, number>> | undefined,
): LedgerCostPart[] {
  return [
    {
      kind: 'utrzymanie_budynkow',
      sourceKey: `utrzymanie-budynkow|${ownerId}`,
      label: 'Utrzymanie budynków',
      cost: buildingsCost ?? {},
    },
    {
      kind: 'utrzymanie_jednostek',
      sourceKey: `utrzymanie-jednostek|${ownerId}`,
      label: 'Utrzymanie jednostek',
      cost: unitsCost ?? {},
    },
  ];
}

/** Części księgi dla zużycia przez obywateli (jedna część). */
export function citizenLedgerParts(
  ownerId: number,
  cost: Readonly<Record<string, number>>,
): LedgerCostPart[] {
  return [{ kind: 'obywatele', sourceKey: `obywatele|${ownerId}`, label: 'Obywatele', cost }];
}

/**
 * Zapisuje do dziennika ilości FAKTYCZNIE pobrane przez `deductBuildingStockCostAcrossCities`
 * (zwrócone `taken`), rozdzielone na części. Brak rekordu tury = no-op (bez księgi).
 * Nie zmienia stanu gry.
 */
export function recordTakenToLedger(
  turn: ResourceLedgerTurn | undefined,
  taken: Readonly<Record<string, number>>,
  parts: ReadonlyArray<LedgerCostPart>,
): void {
  if (!turn) return;
  for (const entry of allocateTakenToLedgerParts(taken, parts)) {
    recordLedgerFlow(
      turn,
      entry.resourceKey,
      entry.sourceKey,
      { kind: entry.kind, label: entry.label },
      -entry.amount,
    );
  }
}
