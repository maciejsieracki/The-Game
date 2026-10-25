/**
 * diplomacy-sensible-deals.ts — R-WEB-DIPLO-DEALS-SENSIBLE-Q1 (Operator R1).
 *
 * Dwa filtry dla propozycji handlowych AI do gracza:
 *  (1) bilans PW dla gracza nie moze byc < 0 (`aiProposalPlayerBenefitSurplus`, ta sama
 *      konwencja co trimProposalForZeroBalance w diplomacy-ai-offer-balance.ts);
 *  (2) sprzedaz nadwyzki tylko gdy zapas sprzedawcy > surplusMultiple x zuzycie,
 *      zakup tylko gdy zapas kupujacego < deficitTurns x zuzycie.
 *
 * Pure: zero DOM/state. Progi w `diplomacy-sensible-deals.config.json`.
 * ZALOZENIE: zuzycie na ture nie jest modelowane w sciezce handlu - przyjmujemy
 * `usePerTurn = pakietWielkosc x usePerTurnFallbackPakiety` (1 pakiet/ture).
 */
import config from './diplomacy-sensible-deals.config.json';

/** Flaga funkcjonalnosci. OFF = sciezki filtrow nie sa wykonywane (zachowanie jak baza). */
export const DIPLO_SENSIBLE_DEALS_ENABLED = true;

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

export type TradeNeed = 'deficit' | 'surplus' | 'neutral';

/** Klasyfikacja zapasu surowca wzgledem zuzycia na ture (progi z JSON). */
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

/** Zuzycie na ture (ZALOZENIE: wielokrotnosc pakietu handlowego). */
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

/** Czy sprzedaz surowca (AI jest sprzedawca, `powod='nadwyzka'`) jest uzasadniona. */
export function isSellerSurplusJustified(
  sellerStock: number,
  pakietWielkosc: number,
  enabled: boolean = DIPLO_SENSIBLE_DEALS_ENABLED,
): boolean {
  if (!enabled) return true;
  return classifyTradeNeed(sellerStock, fallbackUsePerTurn(pakietWielkosc)) === 'surplus';
}

/** Czy zakup surowca (AI jest kupujacym, `powod='deficyt'`) jest uzasadniony. */
export function isBuyerDeficitJustified(
  buyerStock: number,
  pakietWielkosc: number,
  enabled: boolean = DIPLO_SENSIBLE_DEALS_ENABLED,
): boolean {
  if (!enabled) return true;
  return classifyTradeNeed(buyerStock, fallbackUsePerTurn(pakietWielkosc)) === 'deficit';
}

/** Uzasadnienie oferty (pole `reason`, widoczne w tescie). */
export function tradeOfferReason(powod: 'deficyt' | 'nadwyzka', need: TradeNeed): string {
  if (powod === 'deficyt') return `niedobor: zapas ponizej ${config.deficitTurns} tur zuzycia (${need})`;
  return `nadwyzka: zapas powyzej ${config.surplusMultiple}x zuzycia (${need})`;
}
