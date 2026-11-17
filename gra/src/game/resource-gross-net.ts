/**
 * R-WEB-UI-RESOURCE-CARDS-GROSS-AND-NET-Q1 — jedno źródło brutto/netto per surowiec na turę.
 *
 * BRUTTO = cała produkcja surowca (teren + konwertery) + przychód z umów dyplomatycznych
 *          (`rateDiploInPerTurn`), nieujemne. Brutto NIE odejmuje wydatków.
 * NETTO  = `ratePerTurn` (produkcja − umowy wychodzące + przychodzące) MINUS zużycie
 *          (obywatele + budynki + wojsko, `usage`) — ta sama wartość co suma na nagłówku
 *          „Brutto … → netto …” (main.ts → `surowceBilans`).
 *
 * Moduł czysty (bez DOM, bez stanu): używany przez nagłówek surowców (main.ts) i przez karty
 * surowców (empireDetailPanel.ts), żeby suma kart była dokładnie równa nagłówkowi.
 * / EN: single source of gross/net per resource per turn; used by the header and the cards.
 */

/** Minimalny kształt wiersza surowca potrzebny do liczenia brutto/netto (podzbiór EmpireResourceRow). */
export interface ResourceGrossNetInput {
  ratePerTurn: number;
  rateProductionPerTurn?: number;
  rateDiploInPerTurn?: number;
  usage?: { buildings: number; citizens: number; units: number };
}

export interface ResourceGrossNet {
  /** Produkcja łącznie (nieujemna), zaokrąglona. */
  brutto: number;
  /** Zużycie łącznie (obywatele + budynki + wojsko), nieujemne, zaokrąglone. */
  zuzycie: number;
  /** Netto po zużyciu (może być ujemne), zaokrąglone. */
  netto: number;
}

/** Brutto per surowiec: produkcja własna + przychód z umów, nie mniej niż 0. */
export function resourceGrossPerTurn(r: ResourceGrossNetInput): number {
  return Math.max(0, (r.rateProductionPerTurn ?? r.ratePerTurn) + (r.rateDiploInPerTurn ?? 0));
}

/** Zużycie per surowiec: obywatele + budynki + wojsko (z `usage`), nie mniej niż 0. */
export function resourceUsageSum(r: ResourceGrossNetInput): number {
  const u = r.usage;
  return u ? u.buildings + u.citizens + u.units : 0;
}

/** Brutto/zużycie/netto per surowiec na turę, zaokrąglone tak samo jak nagłówek. */
export function resourceGrossNetPerTurn(r: ResourceGrossNetInput): ResourceGrossNet {
  return {
    brutto: Math.round(resourceGrossPerTurn(r)),
    zuzycie: Math.round(resourceUsageSum(r)),
    netto: Math.round(r.ratePerTurn - resourceUsageSum(r)),
  };
}
