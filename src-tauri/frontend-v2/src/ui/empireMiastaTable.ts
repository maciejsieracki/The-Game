/**
 * empireMiastaTable.ts — P-SUROWCE-BRAK-SZCZEGOLOW-ZUZYCIA punkt 2 (Maciej 2026-08-12,
 * `dyspozycje/PYTANIA-OTWARTE.md`).
 *
 * Czysta logika (bez DOM) tabeli „Miasta (osiedla imperium)" w panelu imperium
 * (`empireDetailPanel.ts`, `cityMiastaMiniDetail`):
 *   (a) definicje kolumn + filtrowanie widoczności (checkboxy nad tabelą, kolejność kolumn
 *       się nie zmienia — tylko widoczność);
 *   (b) [kolumna SUROWCE renderowana w empireDetailPanel.ts z gotowego pola
 *       `EmpireCityEconRow.utrzymanieSurowcowBudynkow` — tu tylko `sumResourceRecords` do
 *       zsumowania jej w wierszu podsumowania (c)];
 *   (c) wiersz podsumowania — SUMA dla każdej kolumny, poza WZROST gdzie to ŚREDNIA.
 *
 * ⛔ Wszystkie funkcje tu to WYŁĄCZNIE agregacja (suma/średnia) liczb, które main.ts już
 * policzył i wystawił per miasto (cityEcon/cityPobor/food.perCityRows) — żadna z nich NIE
 * przelicza ekonomii gry od nowa (żadnej stawki, kosztu, mnożnika). To ten sam rodzaj
 * operacji co `resourceUsageTotal()` w `resource-usage-breakdown.ts` (suma już gotowych pól),
 * tylko po stronie tabeli miast zamiast karty surowca.
 *
 * Pure — bez DOM, bez mutacji wejść.
 *
 * / EN: pure (DOM-free) logic for the "Miasta" table's column visibility filter and summary
 * row. Every function here only sums/averages numbers main.ts already computed per city — none
 * of them recompute any game-economy rate, cost, or multiplier. Same class of operation as
 * `resourceUsageTotal()` in resource-usage-breakdown.ts (summing already-final fields).
 */

/** Definicja jednej kolumny tabeli „Miasta". Kolejność w `MIASTA_TABLE_COLUMNS` = kolejność
 *  wyświetlania, NIEZALEŻNA od widoczności (filtr checkboxów tylko ukrywa/pokazuje). */
export interface MiastaColDef {
  id: string;
  /** Tekst nagłówka (bez ikony). */
  label: string;
  /** Opcjonalna ikona nagłówka (iconId z `brandIconSvg`, jak w istniejącym `MiniColHeader`). */
  iconId?: string;
  /** Szerokość względna kolumny w gridzie CSS (`fr`). */
  width: string;
  /** Czy kolumnę można ukryć checkboxem. MIASTO (identyfikator wiersza) zawsze widoczne. */
  toggle: boolean;
}

/** Kanon kolumn dzisiejszej tabeli (Obyw./Ludność/Wzrost/Praca/Pieniądz/Żywność) + nowa
 *  kolumna SUROWCE (punkt b) po prawej stronie — układ pionowych linii jak dziś, bez zmiany
 *  kolejności (Maciej 2026-08-12, zadanie punkt (a)). */
export const MIASTA_TABLE_COLUMNS: readonly MiastaColDef[] = [
  { id: 'miasto', label: 'MIASTO', width: '1.05fr', toggle: false },
  { id: 'obyw', label: 'OBYW.', iconId: 'res-population', width: '0.45fr', toggle: true },
  { id: 'ludnosc', label: 'LUDNOŚĆ', width: '0.75fr', toggle: true },
  { id: 'wzrost', label: 'WZROST', width: '0.55fr', toggle: true },
  { id: 'praca', label: 'PRACA', iconId: 'res-work', width: '0.55fr', toggle: true },
  { id: 'pieniadz', label: 'PIENIĄDZ', iconId: 'res-treasury', width: '0.6fr', toggle: true },
  { id: 'zywnosc', label: 'ŻYWNOŚĆ', iconId: 'res-food', width: '0.6fr', toggle: true },
  { id: 'surowce', label: 'SUROWCE', width: '0.95fr', toggle: true },
];

/** Kolumny widoczne wg zbioru ukrytych id — kolejność z `MIASTA_TABLE_COLUMNS` zachowana.
 *  Kolumna z `toggle: false` (MIASTO) jest widoczna zawsze, niezależnie od `hidden`. */
export function visibleMiastaColumns(hidden: ReadonlySet<string>): MiastaColDef[] {
  return MIASTA_TABLE_COLUMNS.filter(c => !c.toggle || !hidden.has(c.id));
}

/** Grid CSS (`grid-template-columns`) dla zbioru kolumn, w kolejności podanej. */
export function miastaColumnGridTemplate(cols: readonly MiastaColDef[]): string {
  return cols.map(c => c.width).join(' ');
}

/**
 * Suma kilku rekordów zużycia surowców (`klucz surowca → ilość`) w jeden — używana do
 * zsumowania kolumny SUROWCE w wierszu podsumowania (suma po wszystkich miastach imperium).
 * Wejścia to już gotowe, policzone przez main.ts liczby per miasto — to WYŁĄCZNIE dodawanie,
 * nie ponowne liczenie kosztu utrzymania. `undefined`/brak wpisu = pomijane (miasto bez
 * budynków wymagających utrzymania surowcowego).
 */
export function sumResourceRecords(
  records: ReadonlyArray<Readonly<Record<string, number>> | null | undefined>,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const rec of records) {
    if (!rec) continue;
    for (const [k, v] of Object.entries(rec)) {
      if (typeof v === 'number' && Number.isFinite(v) && v > 0) {
        out[k] = (out[k] ?? 0) + v;
      }
    }
  }
  return out;
}

/** Dane jednego miasta potrzebne do wiersza podsumowania (podzbiór tego, co tabela już
 *  wyświetla per wiersz — żadnych nowych pól). */
export interface MiastaSummaryInput {
  obyw: number;
  ludnoscAbsolutna: number;
  /** `null` = brak danych tego miasta (np. przed 1. turą) — NIE liczy się do średniej. */
  wzrostProcent: number | null;
  praca: number;
  pieniadz: number;
  zywnosc: number;
  surowce: Readonly<Record<string, number>> | undefined;
}

export interface MiastaSummaryRow {
  obywTotal: number;
  ludnoscAbsolutnaTotal: number;
  /**
   * ŚREDNIA (nie suma) — zadanie punkt (c), Maciej 2026-08-12: „ŚREDNI wzrost (nie suma)".
   * `null` gdy żadne miasto nie ma danych wzrostu (np. przed 1. turą — `food.perCityRows`
   * puste).
   */
  wzrostProcentAvg: number | null;
  pracaTotal: number;
  pieniadzTotal: number;
  zywnoscTotal: number;
  surowceTotal: Record<string, number>;
}

/** Wiersz podsumowania — suma każdej kolumny liczbowej, poza WZROST gdzie to średnia
 *  (zaokrąglona do pełnego %, jak pojedyncze komórki `Math.round(fd.wzrostProcent)`). */
export function computeMiastaSummaryRow(rows: readonly MiastaSummaryInput[]): MiastaSummaryRow {
  let obywTotal = 0;
  let ludnoscAbsolutnaTotal = 0;
  let pracaTotal = 0;
  let pieniadzTotal = 0;
  let zywnoscTotal = 0;
  let wzrostSum = 0;
  let wzrostCount = 0;
  for (const r of rows) {
    obywTotal += r.obyw;
    ludnoscAbsolutnaTotal += r.ludnoscAbsolutna;
    pracaTotal += r.praca;
    pieniadzTotal += r.pieniadz;
    zywnoscTotal += r.zywnosc;
    if (r.wzrostProcent != null) {
      wzrostSum += r.wzrostProcent;
      wzrostCount += 1;
    }
  }
  const wzrostProcentAvg = wzrostCount > 0 ? Math.round(wzrostSum / wzrostCount) : null;
  const surowceTotal = sumResourceRecords(rows.map(r => r.surowce));
  return {
    obywTotal, ludnoscAbsolutnaTotal, wzrostProcentAvg, pracaTotal, pieniadzTotal, zywnoscTotal,
    surowceTotal,
  };
}
