/**
 * diplomacy-resource-trade-pick.ts — wybór kierunku handlu surowcem między dwoma ownerami.
 *
 * Priorytet (Maciej 2026-07-26, P-AI-011):
 *   1. deficyt — kupujący ma zapas < 1 pakietu, sprzedawca może dostarczyć
 *   2. nadwyżka — klasyczna sprzedaż surowca, którego kupujący nie ma w magazynie
 *
 * Pure: zero DOM/map — dane z main.ts (tradableGoodsIndexForOwner, quantityTradableGoodOptions).
 */

import type { TradeGoodEntry } from './diplomacy-goods';

export interface QuantityTradableOption {
  id: string;
  label: string;
  maxPakiety: number;
}

export type ResourceTradePickReason = 'deficyt' | 'nadwyzka';

export interface ResourceTradePickResult {
  surowiecKey: string;
  label: string;
  pakietyPerTura: number;
  zaplataPerTura: number;
  sellerOwnerId: number;
  buyerOwnerId: number;
  powod: ResourceTradePickReason;
}

/** Klucze surowców ilościowych z zapasem poniżej jednego pakietu handlowego. */
export function detectPricedResourceDeficits(
  goods: readonly TradeGoodEntry[],
  pricedKeys: readonly string[],
  pakietWielkosc: number,
): string[] {
  const deficits: { key: string; gap: number }[] = [];
  for (const key of pricedKeys) {
    const entry = goods.find(g => g.key === key);
    const stock = entry?.ilosc ?? 0;
    if (stock < pakietWielkosc) {
      deficits.push({ key, gap: pakietWielkosc - stock });
    }
  }
  deficits.sort((a, b) => b.gap - a.gap);
  return deficits.map(d => d.key);
}

function buildOffer(
  surowiecKey: string,
  sellerOpt: QuantityTradableOption,
  maxPakietyPerTura: number,
  pricePerPakiet: (key: string, pakiety: number) => number | null,
): Omit<ResourceTradePickResult, 'sellerOwnerId' | 'buyerOwnerId' | 'powod'> | null {
  const pakiety = Math.max(1, Math.min(maxPakietyPerTura, sellerOpt.maxPakiety));
  const zaplata = pricePerPakiet(surowiecKey, pakiety) ?? 0;
  if (zaplata <= 0) return null;
  const label = sellerOpt.label.split(' ×')[0] ?? surowiecKey;
  return { surowiecKey, label, pakietyPerTura: pakiety, zaplataPerTura: zaplata };
}

export type ResourceTradePickInput = {
  pricedKeys: readonly string[];
  pakietWielkosc: number;
  maxPakietyPerTura: number;
  pricePerPakiet: (surowiecKey: string, pakiety: number) => number | null;
};

/**
 * P-AI-011: kupujący ma deficyt (< 1 pakietu), sprzedawca może dostarczyć.
 * „Kupię od ciebie X za Y" — perspektywa buyerOwnerId.
 */
export function pickResourceDeficitForOwnerPair(input: {
  buyerOwnerId: number;
  sellerOwnerId: number;
  goodsBuyer: readonly TradeGoodEntry[];
  goodsSeller: readonly TradeGoodEntry[];
  sellerOptions: readonly QuantityTradableOption[];
} & ResourceTradePickInput): ResourceTradePickResult | null {
  const {
    buyerOwnerId, sellerOwnerId, goodsBuyer, sellerOptions,
    pricedKeys, pakietWielkosc, maxPakietyPerTura, pricePerPakiet,
  } = input;
  const deficits = detectPricedResourceDeficits(goodsBuyer, pricedKeys, pakietWielkosc);
  for (const key of deficits) {
    const sellerOpt = sellerOptions.find(o => o.id === key);
    if (!sellerOpt || sellerOpt.maxPakiety <= 0) continue;
    const offer = buildOffer(key, sellerOpt, maxPakietyPerTura, pricePerPakiet);
    if (offer) {
      return {
        ...offer,
        sellerOwnerId,
        buyerOwnerId,
        powod: 'deficyt',
      };
    }
  }
  return null;
}

/**
 * Klasyczna sprzedaż nadwyżki — sellerOwnerId oferuje surowiec buyerOwnerId.
 */
export function pickResourceSurplusForOwnerPair(input: {
  sellerOwnerId: number;
  buyerOwnerId: number;
  goodsSeller: readonly TradeGoodEntry[];
  goodsBuyer: readonly TradeGoodEntry[];
  sellerOptions: readonly QuantityTradableOption[];
} & ResourceTradePickInput): ResourceTradePickResult | null {
  const {
    sellerOwnerId, buyerOwnerId, goodsSeller, goodsBuyer, sellerOptions,
    pricedKeys, pakietWielkosc, maxPakietyPerTura, pricePerPakiet,
  } = input;
  void pricedKeys;
  void pakietWielkosc;
  const buyerHave = new Set(goodsBuyer.filter(g => (g.ilosc ?? 0) > 0).map(g => g.key));
  const sorted = [...sellerOptions].sort((a, b) => b.maxPakiety - a.maxPakiety);
  const pick = sorted.find(o => !buyerHave.has(o.id)) ?? sorted[0];
  if (!pick || pick.maxPakiety <= 0) return null;
  const offer = buildOffer(pick.id, pick, maxPakietyPerTura, pricePerPakiet);
  if (!offer) return null;
  return {
    ...offer,
    sellerOwnerId,
    buyerOwnerId,
    powod: 'nadwyzka',
  };
}

/**
 * Wybiera najlepszą ofertę handlu surowcem A↔B (ownerId-agnostyczne).
 * Deficyt ma pierwszeństwo przed nadwyżką.
 */
export function pickResourceTradeBetweenOwners(input: {
  ownerA: number;
  ownerB: number;
  goodsA: readonly TradeGoodEntry[];
  goodsB: readonly TradeGoodEntry[];
  sellerOptionsA: readonly QuantityTradableOption[];
  sellerOptionsB: readonly QuantityTradableOption[];
  pricedKeys: readonly string[];
  pakietWielkosc: number;
  maxPakietyPerTura: number;
  pricePerPakiet: (surowiecKey: string, pakiety: number) => number | null;
}): ResourceTradePickResult | null {
  const {
    ownerA, ownerB, goodsA, goodsB, sellerOptionsA, sellerOptionsB,
    pricedKeys, pakietWielkosc, maxPakietyPerTura, pricePerPakiet,
  } = input;
  const base: ResourceTradePickInput = {
    pricedKeys, pakietWielkosc, maxPakietyPerTura, pricePerPakiet,
  };

  const deficitA = pickResourceDeficitForOwnerPair({
    ...base,
    buyerOwnerId: ownerA,
    sellerOwnerId: ownerB,
    goodsBuyer: goodsA,
    goodsSeller: goodsB,
    sellerOptions: sellerOptionsB,
  });
  if (deficitA) return deficitA;

  const deficitB = pickResourceDeficitForOwnerPair({
    ...base,
    buyerOwnerId: ownerB,
    sellerOwnerId: ownerA,
    goodsBuyer: goodsB,
    goodsSeller: goodsA,
    sellerOptions: sellerOptionsA,
  });
  if (deficitB) return deficitB;

  const surplusA = pickResourceSurplusForOwnerPair({
    ...base,
    sellerOwnerId: ownerA,
    buyerOwnerId: ownerB,
    goodsSeller: goodsA,
    goodsBuyer: goodsB,
    sellerOptions: sellerOptionsA,
  });
  if (surplusA) return surplusA;

  return pickResourceSurplusForOwnerPair({
    ...base,
    sellerOwnerId: ownerB,
    buyerOwnerId: ownerA,
    goodsSeller: goodsB,
    goodsBuyer: goodsA,
    sellerOptions: sellerOptionsB,
  });
}

/** Kierunek propozycji z perspektywy proponenta (AI ownerId). */
export function resourceTradeKierunekForProposer(
  proposerOwnerId: number,
  pick: Pick<ResourceTradePickResult, 'sellerOwnerId' | 'buyerOwnerId'>,
): 'sprzedaz' | 'zakup' {
  return pick.sellerOwnerId === proposerOwnerId ? 'sprzedaz' : 'zakup';
}

/**
 * Korekta ceny PN wg archetypu handlowego (handlowosc 0..1).
 * Pokojowi handlowcy (Grecy) — łatwiej zawierają deal przy zakupie (płacą więcej).
 * Agresywni (Zulusi) — twardszy targ przy sprzedaży.
 */
export function applyTradeArchetypePriceMargin(
  zaplataPerTura: number,
  handlowosc: number,
  kierunek: 'sprzedaz' | 'zakup',
): number {
  if (zaplataPerTura <= 0) return zaplataPerTura;
  const t = Math.max(0, Math.min(1, handlowosc));
  const margin = (t - 0.5) * 0.2;
  if (kierunek === 'zakup') {
    return Math.max(1, Math.round(zaplataPerTura * (1 + margin)));
  }
  return Math.max(1, Math.round(zaplataPerTura * (1 + margin * 0.35)));
}
