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
 * Przyjmuje WYŁĄCZNIE gotowe rekordy, które silnik tury już policzył:
 *   • `citizenDeductions` — `CitizenResourceDrainResult.deductions` z
 *     `computeCitizenResourceDrain()` (`citizen-resource-upkeep.ts`), DOKŁADNIE ta mapa,
 *     którą `main.ts` `citizenUpkeepDrainForOwner()` przekazuje do
 *     `deductBuildingStockCostAcrossCities()` (realne odjęcie z magazynu). Ta kategoria JEST
 *     już klamrowana do faktycznie dostępnego zapasu (`min(required, stock)` wewnątrz
 *     `computeCitizenResourceDrain()`) — `citizens` = to, co silnik REALNIE odjął.
 *   • `buildingUpkeep` / `unitUpkeep` — `EconomyTickResult.resourceUpkeepBuildingsByOwner` /
 *     `resourceUpkeepUnitsByOwner` (`turn-economy.ts`). ⚠️ To jest PEŁNE ZAPOTRZEBOWANIE
 *     (utrzymanie budynków/jednostek, przed jakimkolwiek klamrowaniem do zapasu), NIE
 *     faktycznie odjęta ilość. `deductBuildingStockCostAcrossCities()` (wywoływane w `main.ts`
 *     na ZSUMOWANYM `resourceUpkeepByOwner = buildings+units` po `addResourceCosts`) klamruje
 *     PO STRONIE zapisu do `City.surowce`, ale zwraca `void` — nie zgłasza z powrotem, ile
 *     faktycznie zdjęła, ani jak ewentualny niedobór rozkłada się między budynki a wojsko (te
 *     dwie kategorie są już scalone w jedną liczbę PRZED odjęciem — atrybucja niedoboru do
 *     jednej z nich nie istnieje w danych silnika). Gdy magazyn nie starcza na pełne
 *     `buildings + units`, pola `buildings`/`units` zwrócone stąd są zawyżone względem tego, co
 *     realnie zniknęło z magazynu tej tury — DOKŁADNIE tak samo jak `citizens` byłoby zawyżone,
 *     gdyby nie miało klamrowania.
 *   Świadomie NIE naprawione tu (P-ZUZYCIE-ROZBICIE-NIEDOBOR, Evaluator FAIL, warianty ABC w
 *   zgłoszeniu): klamrowanie budynków/wojska analogiczne do obywateli wymagałoby ROZDZIELENIA
 *   dziś jednej scalonej deducji `deductBuildingStockCostAcrossCities(cities, oid, resUpkeep)`
 *   na dwa osobne wywołania (budynki, potem wojsko) PLUS zmiany kontraktu tej funkcji (dziś
 *   `void`) na zwracającą faktycznie zdjętą ilość — zmiana silnika tury (main.ts, 2 miejsca
 *   wywołania: gracz + AI), nie tego modułu. Do czasu takiej zmiany etykiety UI (patrz
 *   `resUsageDetailsHtml` w `empireDetailPanel.ts`) nazywają `buildings`/`units`
 *   „zapotrzebowaniem", NIE „zużyciem" — nie twierdzimy o realnym odjęciu tam, gdzie liczymy
 *   tylko popyt.
 *
 * Suma trzech pól zwróconych stąd dla danego surowca = REALNY drenaż obywateli + PEŁNE
 * zapotrzebowanie budynków/wojska (nie zawsze równe temu, co silnik faktycznie odjął z
 * magazynu tej tury przy niedoborze — patrz wyżej).
 *
 * Pure — bez DOM, bez mutacji wejść.
 *
 * / EN: splits each warehouse resource's this-turn consumption into buildings / citizens /
 * units. Reads ONLY records the turn engine already computed — never recomputes
 * independently (the exact bug class fixed 4× in a row the same night in
 * R-ZUZYCIE-SUROWCOW N1). `citizens` IS clamped to what was actually available in the stock
 * (`min(required, stock)` inside `computeCitizenResourceDrain()`) — it is the real deducted
 * amount. `buildings`/`units`, however, are the FULL DEMAND (upkeep requirement) computed
 * BEFORE the single combined deduction call in `main.ts` (`deductBuildingStockCostAcrossCities`
 * on `buildings+units` merged) — that call returns `void` and clamps internally per city
 * without reporting back how much was actually taken, or how a shortfall splits between the
 * two already-merged categories (that attribution does not exist in the engine's data).
 * When the warehouse can't cover the full `buildings + units` demand, these two fields are
 * OVERSTATED relative to what actually left the warehouse this turn — deliberately not fixed
 * here (would require splitting the merged deduction call in the turn engine, `main.ts`, into
 * two ordered calls plus changing `deductBuildingStockCostAcrossCities`'s `void` contract);
 * the UI labels these two rows "demand", not "usage", instead of asserting real consumption.
 */

/** Rozbicie zużycia jednego surowca tej tury (jednostki surowca, nie %). */
export interface ResourceUsageBreakdown {
  /**
   * ZAPOTRZEBOWANIE budynków (koszt_surowce, 1 szt./typ obecny w budynku/turę) — PEŁNE, nie
   * klamrowane do zapasu magazynu. Przy niedoborze magazynu może przewyższać to, co silnik
   * realnie zdjął (patrz JSDoc modułu — klamrowanie budynków/wojska nie jest dziś dostępne z
   * istniejących danych silnika, ta liczba to popyt, nie potwierdzone zużycie).
   * / EN: buildings' DEMAND (upkeep requirement), full, NOT clamped to warehouse stock — can
   * exceed what the engine actually took when the warehouse runs short (see module JSDoc).
   */
  buildings: number;
  /**
   * Drenaż REALNY obywateli (stawka CITIZEN_UPKEEP_RATE_PER_CITIZEN szt./obywatela/turę —
   * citizen-resource-upkeep.ts, magazyn centralny imperium) — JUŻ klamrowany do faktycznie
   * dostępnego zapasu (`min(required, stock)`), więc to jest realnie odjęta ilość, nie popyt.
   */
  citizens: number;
  /**
   * ZAPOTRZEBOWANIE jednostek (units.json „Utrzymanie surowiec (ilość)") — PEŁNE, nie
   * klamrowane, tak samo jak `buildings` wyżej (ten sam powód: patrz JSDoc modułu).
   * / EN: units' DEMAND, full, NOT clamped — same caveat as `buildings` above.
   */
  units: number;
}

const EMPTY_BREAKDOWN: ResourceUsageBreakdown = { buildings: 0, citizens: 0, units: 0 };

/**
 * Suma wszystkich trzech kategorii tego surowca. ⚠️ NIE jest to zawsze „ile REALNIE odjęto z
 * magazynu tej tury" — `citizens` jest klamrowane do zapasu (realne), ale `buildings`/`units`
 * są pełnym zapotrzebowaniem (może przewyższać realne odjęcie przy niedoborze magazynu, patrz
 * JSDoc modułu i pól wyżej). Traktuj jako „zapotrzebowanie budynków+wojska plus realny drenaż
 * obywateli", nie jako gwarantowaną sumę realnego ubytku magazynu.
 * / EN: sum of all three categories. NOT always "what the engine actually deducted this turn"
 * — `citizens` is clamped to stock (real), but `buildings`/`units` are full demand (can exceed
 * the real deduction under a shortage, see module/field JSDoc).
 */
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
