/**
 * resource-usage-breakdown.ts — P-SUROWCE-BRAK-SZCZEGOLOW-ZUZYCIA (Maciej 2026-08-12,
 * `dyspozycje/PYTANIA-OTWARTE.md` punkt 9).
 *
 * Rozbicie zużycia KAŻDEGO surowca magazynu państwa na trzy kategorie tej tury —
 * budynki (utrzymanie surowcowe), obywatele (drenaż realny, stawka
 * CITIZEN_UPKEEP_RATE_PER_CITIZEN szt./obywatela/turę — kanon: citizen-resource-upkeep.ts)
 * i wojsko (utrzymanie surowcowe jednostek) — dla przycisku „Zobacz szczegóły" na
 * karcie surowca w panelu imperium (`ui/empireDetailPanel.ts`).
 *
 * ⛔ ZASADA (naprawiana 4× z rzędu tej samej nocy w R-ZUZYCIE-SUROWCOW N1 — panel MUSI
 * czytać werdykt silnika, nie przeliczać osobno): ten moduł NIE LICZY zużycia od nowa.
 * Przyjmuje WYŁĄCZNIE gotowe rekordy, które silnik tury już policzył i zastosował:
 *   • `citizenDeductions` — `CitizenResourceDrainResult.deductions` z
 *     `computeCitizenResourceDrain()` (`citizen-resource-upkeep.ts`), DOKŁADNIE ta mapa,
 *     którą `main.ts` `citizenUpkeepDrainForOwner()` przekazuje do
 *     `deductBuildingStockCostAcrossCities()` (realne odjęcie z magazynu).
 *   • `buildingUpkeep` / `unitUpkeep` — `EconomyTickResult.resourceUpkeepBuildingsByOwner` /
 *     `resourceUpkeepUnitsByOwner` (`turn-economy.ts`), dwa źródła, z których SUMUJE SIĘ
 *     (przez `addResourceCosts`) `resourceUpkeepByOwner` — DOKŁADNIE ta mapa, którą `main.ts`
 *     przekazuje do `deductBuildingStockCostAcrossCities()` w bloku „Bank treasury”.
 * Suma trzech pól zwróconych stąd dla danego surowca = dokładnie to, co silnik REALNIE
 * odjął z magazynu państwa tej tury dla tego surowca (nie przybliżenie, nie osobne liczenie).
 *
 * Pure — bez DOM, bez mutacji wejść.
 *
 * / EN: splits each warehouse resource's this-turn consumption into buildings / citizens /
 * units. Reads ONLY records the turn engine already computed and actually applied — never
 * recomputes independently (the exact bug class fixed 4× in a row the same night in
 * R-ZUZYCIE-SUROWCOW N1). The three returned fields sum to exactly what the engine deducted
 * from the state warehouse this turn for that resource.
 */

/** Rozbicie zużycia jednego surowca tej tury (jednostki surowca, nie %). */
export interface ResourceUsageBreakdown {
  /** Utrzymanie surowcowe budynków (koszt_surowce, 1 szt./typ obecny w budynku/turę). */
  buildings: number;
  /** Drenaż realny obywateli (stawka CITIZEN_UPKEEP_RATE_PER_CITIZEN szt./obywatela/turę — citizen-resource-upkeep.ts, magazyn centralny imperium). */
  citizens: number;
  /** Utrzymanie surowcowe jednostek (units.json „Utrzymanie surowiec (ilość)”). */
  units: number;
}

const EMPTY_BREAKDOWN: ResourceUsageBreakdown = { buildings: 0, citizens: 0, units: 0 };

/** Suma wszystkich trzech kategorii — ile REALNIE odjęto z magazynu tej tury, ten surowiec. */
export function resourceUsageTotal(b: ResourceUsageBreakdown): number {
  return b.buildings + b.citizens + b.units;
}

/** Czy warto pokazać „Zobacz szczegóły" (jest jakiekolwiek zużycie w którejkolwiek kategorii). */
export function resourceUsageHasAny(b: ResourceUsageBreakdown): boolean {
  return b.buildings > 0 || b.citizens > 0 || b.units > 0;
}

/**
 * Rozbicie DLA JEDNEGO surowca (`resourceKey`, np. `'drewno'`) z trzech gotowych rekordów
 * silnika. Brak wpisu w danym rekordzie = 0 (typowe — `deductBuildingStockCostAcrossCities`/
 * `deductions`/`addResourceCosts` pomijają klucze o wartości 0, nie zapisują jawnego zera).
 * `null`/`undefined` rekord (np. przed pierwszą turą, silnik jeszcze nic nie policzył) = 0
 * we wszystkich jego polach, zero regresji/crashu.
 */
export function resourceUsageBreakdownFor(
  resourceKey: string,
  citizenDeductions: Readonly<Record<string, number>> | null | undefined,
  buildingUpkeep: Readonly<Record<string, number>> | null | undefined,
  unitUpkeep: Readonly<Record<string, number>> | null | undefined,
): ResourceUsageBreakdown {
  const buildings = buildingUpkeep?.[resourceKey];
  const citizens = citizenDeductions?.[resourceKey];
  const units = unitUpkeep?.[resourceKey];
  return {
    buildings: typeof buildings === 'number' && Number.isFinite(buildings) ? buildings : 0,
    citizens: typeof citizens === 'number' && Number.isFinite(citizens) ? citizens : 0,
    units: typeof units === 'number' && Number.isFinite(units) ? units : 0,
  };
}

/** Rekord bez żadnego zużycia (fallback wygodny dla wywołujących/testów). */
export function emptyResourceUsageBreakdown(): ResourceUsageBreakdown {
  return { ...EMPTY_BREAKDOWN };
}
