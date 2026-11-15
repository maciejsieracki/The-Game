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
  | 'warzelnia'             // sól z Warzelni soli (plon ulepszenia terenu, per miasto)
  | 'wycinka'               // drewno z wycinki lasu (plon wyrębu, poza pipeline'em — gracz w ticku, AI w turze AI)
  | 'konwersja'             // wyjście receptury (Garncarnia, Cegielnia, odlewnie)
  | 'wejscie'               // wejście receptury zużyte przez konwerter
  | 'spichlerz'             // drain Spichlerza (ceramika / sól)
  | 'utrzymanie_budynkow'   // utrzymanie budynków (surowce, po tiku)
  | 'utrzymanie_jednostek'  // utrzymanie jednostek (surowce, po tiku)
  | 'obywatele'            // zużycie przez obywateli (citizen-resource-upkeep)
  | 'budowa'                // start budowy budynku (pobór z puli państwa poza tickiem)
  | 'rekrutacja'            // rekrutacja jednostek (pobór z puli państwa poza tickiem)
  | 'umowa_wymiany'         // przeniesienie surowca w umowie wymiany (cykliczna / jednorazowa)
  | 'mennica'               // drain Złota przez Mennicę (po plonach, w tiku)
  | 'limit_magazynu';       // ścięcie nadwyżki ponad limit magazynu państwa (w tiku)

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

/**
 * Przełącznik zapisu do księgi (TYLKO dla testu „stan gry identyczny z księgą i bez księgi”, hak ?civTest=1).
 * Domyślnie włączony; wyłączony = recordLedgerFlow nic nie zapisuje (rekordy puste), stan gry bez zmian.
 */
let ledgerRecordingEnabled = true;
export function setLedgerRecordingEnabled(on: boolean): void { ledgerRecordingEnabled = on; }
export function isLedgerRecordingEnabled(): boolean { return ledgerRecordingEnabled; }

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
  if (!ledgerRecordingEnabled || !Number.isFinite(amount) || amount === 0) return;
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

/**
 * R-WEB-UI-RESOURCE-SOURCE-LEDGER-SKAD-ZAPASY-Q1 (partia 2b, mechanizm „pending”):
 * pobory z puli państwa wykonywane POZA tickiem (start budowy, rekrutacja) trafiają do
 * jednego okna per właściciel. Okno jest opróżniane przez `drainPendingLedgerInto` w chwili,
 * gdy tick ekonomii zapisuje rekord swojej tury, więc pobór z okna trafia do tej samej tury
 * co zmiana magazynu, którą wywołał. Stan gry NIE zależy od okna (tylko zapis do księgi).
 * Stan modułu: przeżywa między turami, NIE jest zapisywany w zapisie gry (zob. raport, luka).
 */
const pendingLedgerByOwner = new Map<number, ResourceLedgerTurn>();

/** Sink dla deductBuildingStockCostAcrossCities: pobór poza tickiem dla ownera, kind + etykieta. */
export function pendingLedgerSink(ownerId: number, kind: LedgerSourceKind, label: string): LedgerCostSink {
  let turn = pendingLedgerByOwner.get(ownerId);
  if (!turn) {
    turn = createLedgerTurn();
    pendingLedgerByOwner.set(ownerId, turn);
  }
  return { turn, parts: [{ kind, sourceKey: `${kind}|${ownerId}`, label, cost: {} }] };
}

/** Przenosi okno poza tickiem do rekordów tury (`target`, get-or-create) i czyści okno. */
export function drainPendingLedgerInto(target: Map<number, ResourceLedgerTurn> | undefined): void {
  if (!target) return;
  for (const [ownerId, pending] of pendingLedgerByOwner) {
    let turn = target.get(ownerId);
    if (!turn) {
      turn = createLedgerTurn();
      target.set(ownerId, turn);
    }
    for (const [resourceKey, bySource] of Object.entries(pending.byResource)) {
      for (const [sourceKey, flow] of Object.entries(bySource)) {
        recordLedgerFlow(turn, resourceKey, sourceKey, { kind: flow.kind, label: flow.label }, flow.amount);
      }
    }
  }
  pendingLedgerByOwner.clear();
}

/**
 * Czyści okno poza tickiem (R-WEB-UI-...-Q1, poprawka zarzutu FC r3 nr 6): okno jest stanem
 * modułu i nie jest zapisywane w zapisie gry, więc przy wczytaniu / nowej grze musi być puste,
 * żeby wpisy z poprzedniej gry nie trafiły do pierwszej tury nowej.
 */
export function resetPendingLedger(): void {
  pendingLedgerByOwner.clear();
}

/** Test/diagnostyka: podgląd okna bez czyszczenia (kopia). */
export function peekPendingLedger(): Map<number, ResourceLedgerTurn> {
  return new Map(pendingLedgerByOwner);
}

/**
 * R-WEB-UI-RESOURCE-SOURCE-LEDGER-SKAD-ZAPASY-Q1 (partia 3a): zapis różnicy magazynu państwa
 * (po − przed) dla jednego właściciela do rekordu tury. Używane wokół mutacji, których nie da
 * się rozbić na pojedyncze części (Mennica, ścięcie capu, transfer umowy). Zero zmian stanu.
 * Każdy surowiec dostaje jeden wpis `sourceKey` z tym samym `flow`.
 */
export function recordStockDeltaToTurn(
  turn: ResourceLedgerTurn | null | undefined,
  before: Readonly<Record<string, number>>,
  after: Readonly<Record<string, number>>,
  sourceKey: string,
  flow: { kind: LedgerSourceKind; label: string },
): void {
  if (!turn) return;
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const resourceKey of keys) {
    const delta = (after[resourceKey] ?? 0) - (before[resourceKey] ?? 0);
    recordLedgerFlow(turn, resourceKey, sourceKey, flow, delta);
  }
}

/**
 * Jak recordStockDeltaToTurn, ale do okna poza tickiem dla właściciela (drenowane przy
 * najbliższym ticku ekonomii). Używane przy przelewach w turze dyplomacji (przed tickiem).
 */
export function recordStockDeltaToPending(
  ownerId: number,
  before: Readonly<Record<string, number>>,
  after: Readonly<Record<string, number>>,
  sourceKey: string,
  flow: { kind: LedgerSourceKind; label: string },
): void {
  const sink = pendingLedgerSink(ownerId, flow.kind, flow.label);
  recordStockDeltaToTurn(sink.turn, before, after, sourceKey, flow);
}

/** Rekord tury księgi dla właściciela w mapie rekordów ticku (get-or-create). */
export function ledgerTurnForOwner(map: Map<number, ResourceLedgerTurn>, ownerId: number): ResourceLedgerTurn {
  let t = map.get(ownerId);
  if (!t) { t = createLedgerTurn(); map.set(ownerId, t); }
  return t;
}

/**
 * R-WEB-UI-RESOURCE-SOURCE-LEDGER-UI-AND-REST-Q1 (partia 4, UI „Skąd zapasy”): pamięć ostatnich N tur.
 * Zamiast kopiować rekordy, trzymamy REFERENCJE do map `resourceLedgerByOwner` z kolejnych ticków
 * (każdy tick tworzy nową mapę). Późne zapisy tej samej tury (utrzymanie, obywatele, okno pending)
 * są widoczne bez dodatkowej synchronizacji. Stan NIE jest zapisywany w zapisie gry (po wczytaniu
 * dziennik pusty — patrz resetLedgerHistory). Zero wpływu na stan gry.
 */
const ledgerTickHistory: Array<Map<number, ResourceLedgerTurn>> = [];

/** Dopisuje mapę rekordów bieżącego ticku i przycina do ostatnich `maxTurns` tur. */
export function commitLedgerHistoryTick(records: Map<number, ResourceLedgerTurn>, maxTurns: number): void {
  const keep = Math.max(0, Math.floor(maxTurns));
  ledgerTickHistory.push(records);
  while (ledgerTickHistory.length > keep) ledgerTickHistory.shift();
}

/** Czyści pamięć ostatnich tur (nowa gra / wczytanie). */
export function resetLedgerHistory(): void {
  ledgerTickHistory.length = 0;
}

/** Ile tur jest aktualnie w pamięci (diagnostyka i testy). */
export function ledgerHistoryLength(): number {
  return ledgerTickHistory.length;
}

/** Rekordy właściciela z ostatnich tur, od najstarszej do najnowszej (brak rekordu = tura pusta). */
export function ledgerHistoryForOwner(ownerId: number): ResourceLedgerTurn[] {
  return ledgerTickHistory.map(m => m.get(ownerId) ?? createLedgerTurn());
}

export interface LedgerSourceLine {
  /** true = przyrost (suma > 0), false = ubytek (suma < 0). */
  gain:   boolean;
  /** Etykieta po polsku, np. „Warzelnia (Rzym)”. */
  label:  string;
  kind:   LedgerSourceKind;
  /** Suma z okna tur ze znakiem (> 0 przyrost, < 0 ubytek). */
  amount: number;
}

/**
 * Agregacja źródeł jednego surowca z okna tur: jedna linia na (kierunek + etykieta), suma w oknie.
 * Etykiety z różnymi kluczami źródła, ale tą samą nazwą (np. dwie Warzelnie tego samego miasta)
 * są scalane. Przyrosty malejąco, potem ubytki malejąco po |suma|. Zera pomijane.
 */
export function ledgerSourceLinesForResource(
  turns: ReadonlyArray<ResourceLedgerTurn>,
  resourceKey: string,
): LedgerSourceLine[] {
  const acc = new Map<string, LedgerSourceLine>();
  for (const turn of turns) {
    for (const flow of Object.values(turn.byResource[resourceKey] ?? {})) {
      if (!Number.isFinite(flow.amount) || flow.amount === 0) continue;
      const gain = flow.amount > 0;
      const id = `${gain ? '+' : '-'}|${flow.label}`;
      const prev = acc.get(id);
      if (prev) prev.amount += flow.amount;
      else acc.set(id, { gain, label: flow.label, kind: flow.kind, amount: flow.amount });
    }
  }
  const lines = [...acc.values()].filter(l => l.amount !== 0);
  lines.sort((a, b) => {
    if (a.gain !== b.gain) return a.gain ? -1 : 1;
    return Math.abs(b.amount) - Math.abs(a.amount) || a.label.localeCompare(b.label, 'pl');
  });
  return lines;
}
