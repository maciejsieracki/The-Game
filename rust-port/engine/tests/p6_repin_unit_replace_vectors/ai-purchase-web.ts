type GameData = any;
function getAiParam(data: GameData, key: string, fallback: number): number {
  const entry = data.aiParams[key];
  const _v = entry !== undefined ? (entry['wartość'] ?? entry['wartosc']) : undefined; if (_v !== null && _v !== undefined) return _v as number;
  return fallback;
}

export function shouldAIPurchaseUnit(inp: {
  treasury: number;
  goldCost: number;
  hasManpower: boolean;
  /**
   * R-WEB-AI-PURCHASE-MAINTENANCE-RESERVE-Q1: reguła rezerwy utrzymania.
   * Wszystkie trzy pola poniżej muszą być podane, żeby reguła zadziałała;
   * brak któregokolwiek = zachowanie dawne (tylko cena + Manpower).
   */
  reserve?: AiPurchaseReserveParams;
  /** Dochód netto złota/turę PRZED zakupem (przychód − utrzymanie wojska i budynków). */
  netIncomePerTurn?: number;
  /** Łączne utrzymanie złota/turę PRZED zakupem (wojsko + budynki), >= 0. */
  upkeepPerTurn?: number;
  /** Utrzymanie złota/turę dokupywanej jednostki, >= 0. */
  unitUpkeepPerTurn?: number;
}): boolean {
  if (!inp.hasManpower || inp.treasury < inp.goldCost) return false;
  const r = inp.reserve;
  if (r === undefined || inp.netIncomePerTurn === undefined
    || inp.upkeepPerTurn === undefined || inp.unitUpkeepPerTurn === undefined) {
    return true;
  }
  const unitUpkeep = Math.max(0, inp.unitUpkeepPerTurn);
  const netAfter = inp.netIncomePerTurn - unitUpkeep;
  if (netAfter < r.minDochodNetto) return false;
  const upkeepAfter = Math.max(0, inp.upkeepPerTurn) + unitUpkeep;
  return inp.treasury - inp.goldCost >= r.rezerwaTur * upkeepAfter;
}

/**
 * R-WEB-AI-PURCHASE-MAINTENANCE-RESERVE-Q1: progi rezerwy utrzymania zakupu
 * jednostki przez AI (ai-params.json, per poziom trudności).
 * - rezerwaTur: po zapłaceniu ceny skarbiec musi pokryć jeszcze tyle tur
 *   PEŁNEGO utrzymania (wojsko + budynki, wraz z nową jednostką);
 * - minDochodNetto: dochód netto złota/turę po zakupie nie może spaść poniżej.
 */
export interface AiPurchaseReserveParams {
  /** Tury utrzymania, które skarbiec musi pokryć PO zakupie (>= 0). */
  rezerwaTur: number;
  /** Minimalny dochód netto Złota/turę PO zakupie (może być ujemny = tolerowany deficyt). */
  minDochodNetto: number;
}

/** Ładuje progi rezerwy utrzymania dla poziomu 1/2/3 (Easy/Normal/Hard) z ai-params.json. */
export function loadAiPurchaseReserveParams(
  data: GameData,
  poziom: 1 | 2 | 3 = 2,
): AiPurchaseReserveParams {
  const n = poziom;
  return {
    rezerwaTur: Math.max(0, getAiParam(data, `kupno_jednostki_rezerwa_tur_poziom${n}`, n === 1 ? 10 : n === 2 ? 3 : 0)),
    minDochodNetto: getAiParam(data, `kupno_jednostki_min_dochod_netto_poziom${n}`, n === 1 ? 0 : n === 2 ? 0 : -2),
  };
}
