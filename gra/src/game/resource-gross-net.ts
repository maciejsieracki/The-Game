/**
 * R-WEB-UI-RESOURCE-CARDS-GROSS-AND-NET-Q1 — jedno źródło brutto/netto per surowiec na turę.
 *
 * BRUTTO = cała produkcja surowca (teren + konwertery) + przychód z umów dyplomatycznych
 *          (`rateDiploInPerTurn`), nieujemne. Brutto NIE odejmuje wydatków.
 * NETTO  = `ratePerTurn` (produkcja − umowy wychodzące + przychodzące) MINUS zużycie
 *          (obywatele + budynki + wojsko, `usage`) MINUS wejścia konwerterów
 *          (`rateConverterInputPerTurn`: np. glina zjadana przez Garncarnię, drewno przez Cegielnię)
 *          — ta sama wartość co suma na nagłówku „Brutto … → netto …” (main.ts → `surowceBilans`).
 *          R-WEB-UI-HUD-NET-CONVERTER-INPUTS-Q1: wcześniej netto nie odejmowało wejść konwerterów,
 *          przez co HUD pokazywał nominalny przyrost surowców przetwórstwa (np. Glina +326/t przy
 *          realnym Δstanu +175/t). Brutto NADAL = wyłącznie produkcja surowca (bez zmiany).
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
  /** Nominalne wejścia konwerterów tego surowca na turę (przepustowość × zużycie na cykl), ≥ 0. */
  rateConverterInputPerTurn?: number;
  /**
   * R-WEB-UI-HUD-NET-SPICHLERZ-DRAIN-Q1: drenaż ze magazynu państwa przez budynki poza konwerterami,
   * utrzymaniem jednostek i ulepszeń (Spichlerz: Ceramika I/II, Sól II — `paySpichlerzDrainForCity`),
   * nominalnie na turę, ≥ 0. Brak pola = 0 (dotychczasowa formuła).
   */
  rateBuildingDrainPerTurn?: number;
}

export interface ResourceGrossNet {
  /** Produkcja łącznie (nieujemna), zaokrąglona. */
  brutto: number;
  /** Zużycie łącznie (obywatele + budynki + wojsko), nieujemne, zaokrąglone. */
  zuzycie: number;
  /** Wejścia konwerterów (nominalne) łącznie, nieujemne, zaokrąglone. */
  wejscia: number;
  /** Drenaż budynków (Spichlerz) na turę, nieujemny, zaokrąglony (R-WEB-UI-HUD-NET-SPICHLERZ-DRAIN-Q1). */
  drenaz: number;
  /** Netto po zużyciu, wejściach konwerterów i drenażu budynków (może być ujemne), zaokrąglone. */
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

/** Wejścia konwerterów per surowiec na turę (nominalne), nie mniej niż 0. */
export function resourceConverterInputSum(r: ResourceGrossNetInput): number {
  const v = r.rateConverterInputPerTurn;
  return typeof v === 'number' && Number.isFinite(v) ? Math.max(0, v) : 0;
}

/** Drenaż budynków (Spichlerz) per surowiec na turę (nominalny), nie mniej niż 0. */
export function resourceBuildingDrainSum(r: ResourceGrossNetInput): number {
  const v = r.rateBuildingDrainPerTurn;
  return typeof v === 'number' && Number.isFinite(v) ? Math.max(0, v) : 0;
}

/** Brutto/zużycie/wejścia/drenaż/netto per surowiec na turę, zaokrąglone tak samo jak nagłówek. */
export function resourceGrossNetPerTurn(r: ResourceGrossNetInput): ResourceGrossNet {
  return {
    brutto: Math.round(resourceGrossPerTurn(r)),
    zuzycie: Math.round(resourceUsageSum(r)),
    wejscia: Math.round(resourceConverterInputSum(r)),
    drenaz: Math.round(resourceBuildingDrainSum(r)),
    netto: Math.round(
      r.ratePerTurn - resourceUsageSum(r) - resourceConverterInputSum(r) - resourceBuildingDrainSum(r),
    ),
  };
}

/**
 * R-WEB-UI-HUD-SHORTAGE-ALERT-TOOLTIP-Q1: niedobór surowca = netto HUD (ta sama wartość co
 * wiersz „Surowce” i nagłówek) poniżej zera. Jedno źródło dla alertu, etykiet niedoboru i chipa
 * „Surowce” — zamiast surowego `ratePerTurn < 0`, które pomijało zużycie i wejścia konwerterów.
 */
export function resourceIsShortage(r: ResourceGrossNetInput): boolean {
  return resourceGrossNetPerTurn(r).netto < 0;
}

/**
 * R-WEB-UI-HUD-SHORTAGE-ALERT-TOOLTIP-Q1: wiersz „Wejścia przetwórstwa” w tooltipie
 * „Brutto · netto”. Zwraca null, gdy wejść nie ma (N ≤ 0 lub brak), żeby tooltip bez
 * konwerterów pozostał bez zmian.
 */
export function resourceWejsciaTooltipText(wejscia: number | undefined): string | null {
  const n = Math.round(wejscia ?? 0);
  if (!(n > 0)) return null;
  return `Wejścia przetwórstwa: −${n} sztuk/turę (już odjęte od netto)`;
}

/**
 * R-WEB-UI-HUD-NET-SPICHLERZ-DRAIN-Q1: wiersz „Drenaż budynków (Spichlerz)” w tooltipie
 * „Brutto · netto”. Zwraca null, gdy drenażu nie ma (N ≤ 0 lub brak), żeby tooltip bez
 * Spichlerza pozostał bez zmian.
 */
export function resourceDrenazTooltipText(drenaz: number | undefined): string | null {
  const n = Math.round(drenaz ?? 0);
  if (!(n > 0)) return null;
  return `Drenaż budynków (Spichlerz): −${n} sztuk/turę (już odjęte od netto)`;
}
