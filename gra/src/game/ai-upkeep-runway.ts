/**
 * ai-upkeep-runway.ts — bramka rekrutacji AI oparta na ZAPASIE (skarbiec złota,
 * spichlerz żywności), a nie na bieżącym bilansie.
 *
 * Decyzja właściciela (dispatch R-WEB-AI-ARMY-UPKEEP-Q1, DOPRECYZOWANIE 2026-10-25,
 * NADRZĘDNE): liczy się ZAPAS. Ujemny bilans bieżący sam w sobie nie blokuje
 * rekrutacji, jeśli zapas daje wymagany runway. AI może utrzymywać armię z zapasów,
 * ale musi za nią PŁACIĆ — tzn. zapas po zakupie i z uwzględnieniem utrzymania
 * (istniejącej armii + nowej jednostki) musi wystarczyć na co najmniej `runwayTurns`
 * tur BEZ zejścia zapasu do zera.
 *
 * Czysta funkcja: bez stanu gry, bez I/O. Podpinana w main.ts za flagą
 * (AI_UPKEEP_RUNWAY_GATE w data/ai-upkeep-params.json). Flaga OFF = brak wpływu.
 */

export interface UpkeepRunwayParams {
  /** Minimalna liczba tur utrzymania, które zapas musi pokryć po zakupie (>= 0). */
  runwayTurns: number;
  /** Margines bezpieczeństwa: zapas traktowany jako (1 - margin) × stan (0..0,99). */
  margin: number;
}

export interface UpkeepRunwayInput {
  /** Złoto w skarbcu AI przed zakupem. */
  goldStock: number;
  /** Koszt złota jednostki (jednorazowy). */
  goldCost: number;
  /** Netto złota/turę PRZED zakupem (przychód − utrzymanie), ze znakiem. */
  goldNetPerTurn: number;
  /** Dodatkowe utrzymanie złota/turę nowej jednostki (>= 0). */
  unitGoldUpkeep: number;
  /** Zapas żywności w spichlerzu AI przed zakupem. */
  foodStock: number;
  /** Netto żywności/turę PRZED zakupem (produkcja − zużycie), ze znakiem. */
  foodNetPerTurn: number;
  /** Dodatkowe zużycie żywności/turę nowej jednostki (>= 0). */
  unitFoodUpkeep: number;
}

function finiteOr0(x: number): number {
  return Number.isFinite(x) ? x : 0;
}

/**
 * Liczba tur, przez które `stock` wystarcza przy saldzie `net` (ze znakiem).
 * net >= 0 → nieskończenie (brak deficytu). stock <= 0 przy deficycie → 0.
 */
export function upkeepRunwayTurns(stock: number, net: number): number {
  const s = finiteOr0(stock);
  const n = finiteOr0(net);
  if (n >= 0) return Number.POSITIVE_INFINITY;
  if (s <= 0) return 0;
  return s / -n;
}

/**
 * true = rekrutacja dozwolona pod kątem zapasu.
 * Warunki (wszystkie muszą być spełnione):
 *   1) złoto po zapłaceniu ceny nie jest ujemne;
 *   2) runway złota (zapas po zakupie × (1 − margin) przy netto po zakupie) >= runwayTurns;
 *   3) runway żywności (spichlerz × (1 − margin) przy netto po zakupie) >= runwayTurns.
 * Przy dodatnim bilansie runway jest nieskończony (zapas nie maleje).
 */
export function aiUpkeepRunwayAllowsRecruit(
  inp: UpkeepRunwayInput,
  p: UpkeepRunwayParams,
): boolean {
  const goldAfter = finiteOr0(inp.goldStock) - finiteOr0(inp.goldCost);
  if (goldAfter < 0) return false;
  const keep = 1 - Math.min(0.99, Math.max(0, finiteOr0(p.margin)));
  const need = Math.max(0, finiteOr0(p.runwayTurns));
  const goldNet = finiteOr0(inp.goldNetPerTurn) - Math.max(0, finiteOr0(inp.unitGoldUpkeep));
  const foodNet = finiteOr0(inp.foodNetPerTurn) - Math.max(0, finiteOr0(inp.unitFoodUpkeep));
  if (upkeepRunwayTurns(goldAfter * keep, goldNet) < need) return false;
  if (upkeepRunwayTurns(finiteOr0(inp.foodStock) * keep, foodNet) < need) return false;
  return true;
}
