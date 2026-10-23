/**
 * controller/diplomacyQueries.ts — zapytania reguł koszyka PW (P5.6, `R-RUSTPORT-P5-6-PORT-CYKLE-C1235-Q1`).
 *
 * Zastępuje w `diplomacyTradeBasket.ts` importy `game/diplomacy-{value-catalog,pn-engine,trade-validation,
 * ai-offer-balance,proposals,war-gates,acceptance-points}` (pin `:7-52`). Każda funkcja = jedno zapytanie do
 * silnika (P5-0 §6.6: `diplomacy_preview_basket`, `diplomacy_quick_deal`, `diplomacy_balance_to_fair` + zapytania
 * pomocnicze wyceny i walidacji). Panel nie liczy reguł (P5.13): dostaje wynik i go formatuje.
 *
 * ZAŁOŻENIE P5.6-Z5 (forma): zapytania są SYNCHRONICZNE, jak `buildingCardRules` (P5.4) — koszyk przelicza podgląd
 * przy każdym `refresh()` (pin: wycena w tym samym takcie co render). Transport do Rust (asynchroniczny `invoke`
 * Tauri + pamięć podręczna wyniku per stan koszyka) = `NIE_ZMIERZONO`. Dostawca jest wstrzykiwany
 * (`installDiplomacyQueries`); odczyt bez instalacji rzuca jawny błąd (jak `staticCatalog()`).
 */
import type {
  BalanceToFairQueryDto,
  BasketItemDto,
  BasketPnQueryDto,
  BasketSummaryQueryDto,
  CurrencyPayloadDto,
  DiplomacyBasketPreviewDto,
  QuickDealQueryDto,
  TreatyBasketSummaryDto,
  TreatyBasketSummaryQueryDto,
} from '../viewmodel/types';

export interface DiplomacyQueriesProvider {
  /** Wycena jednej strony koszyka w PW (web `diplomacySumPn` z opcjami `basketPnOpts`); `null` = nie da się wycenić. */
  basketSumPn(q: BasketPnQueryDto): number | null;
  /** Podsumowanie koszyka handlu/daru (`diplomacy_preview_basket`). */
  basketSummary(q: BasketSummaryQueryDto): DiplomacyBasketPreviewDto;
  /** Podsumowanie koszyka traktatu (PW stron i panel traktatu). */
  treatyBasketSummary(q: TreatyBasketSummaryQueryDto): TreatyBasketSummaryDto;
  /** Web `validateTradeBasketSides(mode, give, receive)` (`game/diplomacy-trade-validation.ts:15-36`). */
  validateTradeBasketSides(
    mode: 'trade' | 'gift' | 'treaty',
    give: readonly BasketItemDto[],
    receive: readonly BasketItemDto[],
  ): { valid: boolean; reason?: string };
  /** Web `isCurrencyProposalForbiddenDuringWar(actionId, payload, atWar)` (`game/diplomacy-war-gates.ts:46-54`). */
  currencyForbiddenDuringWar(proposalActionId: string, payload: CurrencyPayloadDto, atWar: boolean): boolean;
  /** „SZYBKA UMOWA” (`diplomacy_quick_deal`; web `computeQuickDealBasket`). */
  quickDealBasket(q: QuickDealQueryDto): { giveItems: BasketItemDto[]; receiveItems: BasketItemDto[] };
  /** „Wyrównaj (fair @ Rel)” (`diplomacy_balance_to_fair`; web `balanceGiveItemsToFairMin`). */
  balanceGiveItemsToFairMin(q: BalanceToFairQueryDto): BasketItemDto[];
  /** Krok handlu surowcem w sztukach (web `diplomacyHandelSurowiecKrok`, `game/diplomacy-value-catalog.ts:320-322`). */
  handelSurowiecKrok(resourceId: string): number;
  /** Normalizacja ilości do kroku i zapasu (web `diplomacyNormalizeSurowiecIlosc`, `:343-354`). */
  normalizeSurowiecIlosc(resourceId: string, rawQty: number, max?: number): number;
  /** Usunięcie wycofanych pozycji dostępu (web `stripWithdrawnResourceAccessItems`, `game/diplomacy-proposals.ts:418-420`). */
  stripWithdrawnResourceAccessItems(items: readonly BasketItemDto[]): BasketItemDto[];
  /** Czy propozycja ma trwały dostęp do surowców/złóż (web `proposalHasResourceAccess`, `:409-415`). */
  proposalHasResourceAccess(payload: { giveItems?: readonly BasketItemDto[]; receiveItems?: readonly BasketItemDto[] }): boolean;
}

let current: DiplomacyQueriesProvider | null = null;

export function installDiplomacyQueries(provider: DiplomacyQueriesProvider | null): void {
  current = provider;
}

export function hasDiplomacyQueries(): boolean {
  return current !== null;
}

export function diplomacyQueries(): DiplomacyQueriesProvider {
  if (current === null) {
    throw new Error('frontend-v2: DiplomacyQueriesProvider nie zainstalowany (installDiplomacyQueries przed otwarciem koszyka PW, ZAŁOŻENIE P5.6-Z5)');
  }
  return current;
}

/**
 * Atrapa MOCK: stałe wartości oznaczone „MOCK” — niczego nie liczy (P5.13). Wycena = `null` (koszyk pokazuje
 * „Nieznana wartość PW”), walidacja przepuszcza, krok 1, normalizacja = `Math.floor` bez reguł kroku.
 */
export function createMockDiplomacyQueries(): DiplomacyQueriesProvider {
  const relation = { total: 100, signed: 0, modPct: 0, modLabel: 'MOCK', tradeFairMult: 1, tradeParity: true };
  return {
    basketSumPn: () => null,
    basketSummary: () => ({
      givePn: null,
      receivePn: null,
      fairMinPn: 0,
      balancePn: 0,
      accepted: false,
      relation,
      treatyPw: { my: 0, their: 0, bilateral: 0, base: 0 },
      trust: { surplusPn: 0, delta: 0, deltaRaw: 0, cap: 0, gained: 0 },
      dobraWola: null,
      giftTrust: null,
      validation: { valid: true, reason: null },
      currencyForbiddenWar: false,
      turnsMultiplier: 1,
      brief: { give: 'MOCK', receive: 'MOCK' },
      treatyGate: null,
      summaryFairMinPn: 0,
    }),
    treatyBasketSummary: () => ({ bilateralPw: null, myPw: 0, theirPw: 0, treatyPreview: null, basketPreview: null }),
    validateTradeBasketSides: () => ({ valid: true }),
    currencyForbiddenDuringWar: () => false,
    quickDealBasket: () => ({ giveItems: [], receiveItems: [] }),
    balanceGiveItemsToFairMin: (q) => [...q.giveItems],
    handelSurowiecKrok: () => 1,
    normalizeSurowiecIlosc: (_id, rawQty, max) => Math.floor(max != null ? Math.min(rawQty, max) : rawQty),
    stripWithdrawnResourceAccessItems: (items) => [...items],
    proposalHasResourceAccess: () => false,
  };
}
