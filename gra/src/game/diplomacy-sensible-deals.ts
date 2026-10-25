/**
 * diplomacy-sensible-deals.ts — R-WEB-DIPLO-DEALS-SENSIBLE-Q1 (Operator R2).
 *
 * Filtry dla propozycji handlowych AI do gracza:
 *  (1) bilans PW dla gracza nie moze byc < 0 (`aiProposalPlayerBenefitSurplus`, ta sama
 *      konwencja co trimProposalForZeroBalance w diplomacy-ai-offer-balance.ts);
 *  (2) AI KUPUJE surowiec tylko przy niedoborze: przyrost netto < 0 oraz zapas <
 *      deficitTurns x |przyrost netto| (zuzycie przewyzsza produkcje);
 *  (3) AI SPRZEDAJE surowiec tylko przy nadwyzce: przyrost netto >= 0 oraz zapas >
 *      surplusMultiple x pakiet, a PARTNER (gracz) ma niedobor TEGO surowca;
 *  (4) kazda oferta niesie pole `reason` (uzasadnienie logiczne).
 *
 * Pure: zero DOM/state. Progi w `diplomacy-sensible-deals.config.json`.
 * Flaga funkcjonalnosci przelaczalna (`setDiploSensibleDealsEnabled`, test B3);
 * OFF = zadna ze sciezek filtrow nie zmienia wyniku (zachowanie jak baza).
 *
 * ZALOZENIA (R2, do potwierdzenia przez Evaluatora):
 *  - Z1: brak modelu zuzycia brutto; "zuzycie" = ujemny przyrost netto (mergedResourceRatesForOwner).
 *  - Z7: nadwyzka nie ma zuzycia do porownania -> prog = surplusMultiple x pakiet.
 *  - Z3: wymiana w naturze (nadwyzka X <-> niedobor Y) NIE jest zaimplementowana; sprzedaz
 *    nadwyzki wymaga niedoboru tego samego surowca po stronie gracza.
 */
import config from './diplomacy-sensible-deals.config.json';

let sensibleDealsEnabled = true;

/** Odczyt flagi funkcjonalnosci. */
export function isDiploSensibleDealsEnabled(): boolean {
  return sensibleDealsEnabled;
}

/** Przelaczenie flagi (uzywane przez testy; produkcja zostaje przy domyslnym ON). */
export function setDiploSensibleDealsEnabled(enabled: boolean): void {
  sensibleDealsEnabled = enabled === true;
}

export interface SensibleDealsThresholds {
  deficitTurns: number;
  surplusMultiple: number;
  usePerTurnFallbackPakiety: number;
}

export const SENSIBLE_DEALS_THRESHOLDS: SensibleDealsThresholds = {
  deficitTurns: config.deficitTurns,
  surplusMultiple: config.surplusMultiple,
  usePerTurnFallbackPakiety: config.usePerTurnFallbackPakiety,
};

/** Typy komend AI, na ktore dziala filtr bilansu (handel - NIE pokoj/trybut/sojusz). */
export const SENSIBLE_FILTER_CMD_TYPES: ReadonlySet<string> = new Set([
  'zaproponuj_handel',
  'zaproponuj_umowe_handlowa',
  'zaproponuj_handel_surowiec',
]);

/**
 * Akcje stolu negocjacyjnego bedace OFERTAMI HANDLOWYMI (blokuja koniec tury gracza,
 * gdy wisza jako oferta AI->gracz). Pokoj/sojusz/trybut NIE wchodza.
 */
export const SENSIBLE_TRADE_ACTION_IDS: ReadonlySet<string> = new Set([
  'handel',
  'umowa_handlowa',
  'umowa_szlakow',
]);

export type TradeNeed = 'deficit' | 'surplus' | 'neutral';

/** Klasyfikacja zapasu surowca wzgledem zuzycia na ture (stary wariant, pakiet x N). */
export function classifyTradeNeed(
  stock: number,
  usePerTurn: number,
  t: SensibleDealsThresholds = SENSIBLE_DEALS_THRESHOLDS,
): TradeNeed {
  if (!(usePerTurn > 0) || !Number.isFinite(stock)) return 'neutral';
  if (stock < t.deficitTurns * usePerTurn) return 'deficit';
  if (stock > t.surplusMultiple * usePerTurn) return 'surplus';
  return 'neutral';
}

/**
 * Klasyfikacja na podstawie PRZYROSTU NETTO (R2, B6). Niedobor = przyrost netto ujemny
 * i zapas pokrywa mniej niz `deficitTurns` tur tego zuzycia. Nadwyzka = przyrost netto
 * nieujemny i zapas > `surplusMultiple` x pakiet. Brak ujemnego przyrostu = brak niedoboru
 * (przy zerowym zapasie tez: nic nie zuzywa surowca, wiec nie ma czego kupowac).
 */
export function classifyTradeNeedNet(
  stock: number,
  netRatePerTurn: number,
  pakietWielkosc: number,
  t: SensibleDealsThresholds = SENSIBLE_DEALS_THRESHOLDS,
): TradeNeed {
  if (!Number.isFinite(stock) || !Number.isFinite(netRatePerTurn)) return 'neutral';
  if (netRatePerTurn < 0) {
    const consumptionPerTurn = -netRatePerTurn;
    return stock < t.deficitTurns * consumptionPerTurn ? 'deficit' : 'neutral';
  }
  if (pakietWielkosc > 0 && stock > t.surplusMultiple * pakietWielkosc) return 'surplus';
  return 'neutral';
}

/** Zuzycie na ture (ZALOZENIE: wielokrotnosc pakietu handlowego) - wariant pomocniczy. */
export function fallbackUsePerTurn(
  pakietWielkosc: number,
  t: SensibleDealsThresholds = SENSIBLE_DEALS_THRESHOLDS,
): number {
  return pakietWielkosc > 0 ? pakietWielkosc * t.usePerTurnFallbackPakiety : 0;
}

/** Bilans PW gracza (z `aiProposalPlayerBenefitSurplus`) akceptowalny: nie moze byc ujemny. */
export function isPlayerBalanceAcceptable(benefitPn: number): boolean {
  return Number.isFinite(benefitPn) && benefitPn >= 0;
}

/** Czy filtr bilansu dotyczy danego typu komendy przy danej fladze. */
export function sensibleBalanceFilterApplies(enabled: boolean, cmdType: string): boolean {
  return enabled && SENSIBLE_FILTER_CMD_TYPES.has(cmdType);
}

/** Czy akcja stolu jest ofertą handlową (blokuje koniec tury gdy AI->gracz). */
export function isSensibleTradeActionId(actionId: string): boolean {
  return SENSIBLE_TRADE_ACTION_IDS.has(actionId);
}

/**
 * Czy sprzedaz surowca przez AI (AI = sprzedawca, powod='nadwyzka') jest uzasadniona.
 * `partnerNeed` = klasyfikacja zapasu GRACZA (kupujacego) TEGO SAMEGO surowca.
 */
export function isSellerSurplusJustified(
  sellerStock: number,
  sellerNetRate: number,
  pakietWielkosc: number,
  partnerNeed: TradeNeed | null,
  enabled: boolean = isDiploSensibleDealsEnabled(),
): boolean {
  if (!enabled) return true;
  return classifyTradeNeedNet(sellerStock, sellerNetRate, pakietWielkosc) === 'surplus'
    && partnerNeed === 'deficit';
}

/** Czy zakup surowca przez AI (AI = kupujacy, powod='deficyt') jest uzasadniony. */
export function isBuyerDeficitJustified(
  buyerStock: number,
  buyerNetRate: number,
  pakietWielkosc: number,
  enabled: boolean = isDiploSensibleDealsEnabled(),
): boolean {
  if (!enabled) return true;
  return classifyTradeNeedNet(buyerStock, buyerNetRate, pakietWielkosc) === 'deficit';
}

/** Uzasadnienie oferty (pole `reason`: log, UI i test). Pusty tekst gdy flaga OFF. */
export function tradeOfferReason(
  powod: 'deficyt' | 'nadwyzka',
  stock: number,
  netRatePerTurn: number,
  enabled: boolean = isDiploSensibleDealsEnabled(),
): string {
  if (!enabled) return '';
  const z = Math.round(stock);
  if (powod === 'deficyt') {
    const burn = Math.round(-netRatePerTurn);
    return `Brakuje nam surowca: zapas ${z} szt., zuzycie netto ${burn} szt./turę (ponizej ${config.deficitTurns} tur).`;
  }
  return `Mamy nadwyżkę: zapas ${z} szt. (powyżej ${config.surplusMultiple}x pakietu), a Ty masz niedobór tego surowca.`;
}
