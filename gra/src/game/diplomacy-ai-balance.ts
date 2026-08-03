/**

 * diplomacy-ai-balance.ts — R-HANDEL-AI-FALA: AI trade proposals vs real resources.

 * Pure, testable helpers (no DOM / main.ts state).

 */

import type { AIDiplomacyCommand } from './ai';

import type { BasketItem, QuickDealResult } from './diplomacy-pn-engine';

import { diplomacyPnPraca, diplomacyPnZloto } from './diplomacy-value-catalog';

import {
  AI_TRADE_AGREEMENT_SWEETENER_MAX,
  AI_TRADE_GOLD_MAX,
  capAiGoldOffer,
} from './diplomacy-economy';



export interface AiResourceTradeClampCtx {

  aiOwnerId: number;

  partnerOwnerId: number;

  aiGold: number;

  partnerGold: number;

  aiPraca: number;

  partnerPraca: number;

  aiStock: Record<string, number>;

  partnerStock: Record<string, number>;

  /** Jednostki surowca / turę (terytorium + konwertery) — opcjonalne, domyślnie 0. */

  aiResourceRates?: Partial<Record<string, number>>;

  partnerResourceRates?: Partial<Record<string, number>>;

  pakietWielkosc: number;

  defaultTurns: number;

}



export interface OwnerBasketAffordCtx {

  gold: number;

  praca: number;

  foodReserve: number;

  stock: Record<string, number>;

  pakietWielkosc: number;

  /** Jednostki surowca / turę — do cap handlu cyklicznego per_turn. */

  resourceRates?: Partial<Record<string, number>>;

}



/** Tryb capu surowca w koszyku: jednorazowy (magazyn) vs co turę (produkcja). */

export type ResourceTradeCapMode = 'once' | 'per_turn';



type ResourceTradeCmd = Extract<AIDiplomacyCommand, { type: 'zaproponuj_handel_surowiec' }>;



function buyerFunds(

  zaplataTyp: 'zloto' | 'praca',

  buyerGold: number,

  buyerPraca: number,

): number {

  return zaplataTyp === 'zloto' ? buyerGold : buyerPraca;

}



function maxZaplataPerTuraForTurns(

  zaplataTyp: 'zloto' | 'praca',

  buyerGold: number,

  buyerPraca: number,

  turns: number,

): number {

  if (turns <= 0) return 0;

  const funds = buyerFunds(zaplataTyp, buyerGold, buyerPraca);

  return Math.floor(funds / turns);

}



/**

 * Max pakietów surowca, które owner może zaoferować:

 * - `once` — tylko zapas magazynowy (jednorazowa dostawa),

 * - `per_turn` — tylko nadwyżka produkcji / turę (cykliczny handel, bez depletowania magazynu).

 */

export function maxResourcePakiety(

  mode: ResourceTradeCapMode,

  stockUnits: number,

  productionPerTurn: number,

  pakietWielkosc: number,

): number {

  const pakiet = pakietWielkosc > 0 ? pakietWielkosc : 1;

  if (mode === 'once') {

    return Math.floor(Math.max(0, stockUnits) / pakiet);

  }

  return Math.floor(Math.max(0, productionPerTurn) / pakiet);

}



/**

 * @deprecated Użyj maxResourcePakiety('per_turn', …) lub maxResourcePakiety('once', …).

 * Zachowane dla starszych testów — łączy zapas + produkcja×turns rozłożone na cykl.

 */

export function maxSustainablePakietyPerTura(

  stockUnits: number,

  productionPerTurn: number,

  pakietWielkosc: number,

  turns: number,

): number {

  const pakiet = pakietWielkosc > 0 ? pakietWielkosc : 1;

  const t = Math.max(1, turns);

  const totalUnits = Math.max(0, stockUnits) + Math.max(0, productionPerTurn) * t;

  return Math.floor(totalUnits / (pakiet * t));

}



/**

 * Skaluje propozycję handlu surowcem AI do realnych zapasów sprzedawcy i środków kupującego

 * na pełny cykl (turns × zapłata/turę). Handel surowcem AI jest zawsze per_turn.

 */

export function clampAiResourceTradeCommand(

  cmd: ResourceTradeCmd,

  ctx: AiResourceTradeClampCtx,

): ResourceTradeCmd | null {

  const pakiet = ctx.pakietWielkosc > 0 ? ctx.pakietWielkosc : 1;

  const isBuy = cmd.kierunek === 'zakup';



  const sellerStock = isBuy ? ctx.partnerStock : ctx.aiStock;

  const sellerRates = isBuy ? ctx.partnerResourceRates : ctx.aiResourceRates;

  const buyerGold = isBuy ? ctx.aiGold : ctx.partnerGold;

  const buyerPraca = isBuy ? ctx.aiPraca : ctx.partnerPraca;



  const stockKey = cmd.surowiecKey.trim().toLowerCase();

  const sellerHave = sellerStock[stockKey] ?? 0;

  const sellerRate = sellerRates?.[stockKey] ?? 0;



  let turns = cmd.turns > 0 ? cmd.turns : ctx.defaultTurns;

  const maxPakietyPerTura = maxResourcePakiety('per_turn', sellerHave, sellerRate, pakiet);

  let pakietyPerTura = Math.min(cmd.pakietyPerTura, maxPakietyPerTura);



  let zaplataPerTura = cmd.zaplataPerTura;



  if (zaplataPerTura > 0) {

    zaplataPerTura = Math.min(

      zaplataPerTura,

      maxZaplataPerTuraForTurns(cmd.zaplataTyp, buyerGold, buyerPraca, turns),

    );



    while (turns > 1) {

      const totalCost = zaplataPerTura * turns;

      const funds = buyerFunds(cmd.zaplataTyp, buyerGold, buyerPraca);

      if (totalCost <= funds) break;

      turns -= 1;

      zaplataPerTura = Math.min(

        zaplataPerTura,

        maxZaplataPerTuraForTurns(cmd.zaplataTyp, buyerGold, buyerPraca, turns),

      );

    }



    zaplataPerTura = Math.min(

      zaplataPerTura,

      maxZaplataPerTuraForTurns(cmd.zaplataTyp, buyerGold, buyerPraca, turns),

    );

  }



  if (pakietyPerTura <= 0) return null;

  if (cmd.zaplataPerTura > 0 && zaplataPerTura <= 0) return null;



  return {

    ...cmd,

    pakietyPerTura,

    zaplataPerTura,

    turns,

  };

}



function maxAffordableResourcePakiety(

  mode: ResourceTradeCapMode,

  item: BasketItem,

  ownerCtx: OwnerBasketAffordCtx,

): number {

  const pakiet = ownerCtx.pakietWielkosc > 0 ? ownerCtx.pakietWielkosc : 1;

  const key = item.id.trim().toLowerCase();

  const have = ownerCtx.stock[key] ?? 0;

  const rate = ownerCtx.resourceRates?.[key] ?? 0;

  return maxResourcePakiety(mode, have, rate, pakiet);

}



/**

 * Czy owner może pokryć pozycje koszyka — złoto, praca, żywność, surowiec_ilosc, surowiec_boolean.

 * `turnsMultiplier` — pełny cykl płatności (np. handel per_turn × turns tur).

 */

export function basketItemsAffordableExtended(

  items: readonly BasketItem[] | undefined,

  ownerCtx: OwnerBasketAffordCtx,

  turnsMultiplier = 1,

  resourceTradeMode: ResourceTradeCapMode = 'once',

): boolean {

  if (!items?.length) return true;

  const mult = Math.max(1, turnsMultiplier);

  const pakiet = ownerCtx.pakietWielkosc > 0 ? ownerCtx.pakietWielkosc : 1;



  for (const item of items) {

    const qty = item.ilosc ?? 1;

    switch (item.typ) {

      case 'zloto': {

        const gold = diplomacyPnZloto(qty) * mult;

        if (gold > 0 && ownerCtx.gold < gold) return false;

        break;

      }

      case 'praca': {

        const praca = diplomacyPnPraca(qty) * mult;

        if (praca > 0 && ownerCtx.praca < praca) return false;

        break;

      }

      case 'zywnosc': {

        const need = qty * mult;

        if (need > 0 && ownerCtx.foodReserve < need) return false;

        break;

      }

      case 'surowiec_ilosc': {

        const maxPakiety = maxAffordableResourcePakiety(resourceTradeMode, item, ownerCtx);

        if (qty > maxPakiety) return false;

        break;

      }

      case 'surowiec_boolean': {

        const key = item.id.trim().toLowerCase();

        if (Object.prototype.hasOwnProperty.call(ownerCtx.stock, key)) {

          const have = ownerCtx.stock[key] ?? 0;

          if (have <= 0) return false;

        }

        break;

      }

      default:

        break;

    }

  }

  return true;

}



function maxAffordableQty(

  item: BasketItem,

  ownerCtx: OwnerBasketAffordCtx,

  turnsMultiplier: number,

  resourceTradeMode: ResourceTradeCapMode,

): number {

  const mult = Math.max(1, turnsMultiplier);

  const qty = item.ilosc ?? 1;



  switch (item.typ) {

    case 'zloto': {

      const perUnit = diplomacyPnZloto(1);

      if (perUnit <= 0) return qty;

      const maxUnits = Math.floor(ownerCtx.gold / (perUnit * mult));

      return Math.min(qty, maxUnits);

    }

    case 'praca': {

      const perUnit = diplomacyPnPraca(1);

      if (perUnit <= 0) return qty;

      const maxUnits = Math.floor(ownerCtx.praca / (perUnit * mult));

      return Math.min(qty, maxUnits);

    }

    case 'zywnosc': {

      const maxUnits = Math.floor(ownerCtx.foodReserve / mult);

      return Math.min(qty, maxUnits);

    }

    case 'surowiec_ilosc': {

      const maxPerTurn = maxAffordableResourcePakiety(resourceTradeMode, item, ownerCtx);

      return Math.min(qty, maxPerTurn);

    }

    case 'surowiec_boolean': {

      const key = item.id.trim().toLowerCase();

      if (!Object.prototype.hasOwnProperty.call(ownerCtx.stock, key)) return qty;

      return (ownerCtx.stock[key] ?? 0) > 0 ? qty : 0;

    }

    default:

      return qty;

  }

}



/** Skaluje pozycje koszyka w dół, aż mieszczą się w realnych zasobach ownera. */

export function clampBasketItemsToAffordable(

  items: readonly BasketItem[] | undefined,

  ownerCtx: OwnerBasketAffordCtx,

  turnsMultiplier = 1,

  resourceTradeMode: ResourceTradeCapMode = 'once',

): BasketItem[] {

  if (!items?.length) return [];

  const out: BasketItem[] = [];

  for (const item of items) {

    const maxQty = maxAffordableQty(item, ownerCtx, turnsMultiplier, resourceTradeMode);

    if (maxQty <= 0) continue;

    if (maxQty !== (item.ilosc ?? 1)) {

      out.push({ ...item, ilosc: maxQty });

    } else {

      out.push(item);

    }

  }

  return out;

}

export interface AiTradeAgreementBasketPayload {
  giveItems?: BasketItem[];
  receiveItems?: BasketItem[];
}

/**
 * R-HANDEL-AI-FALA-Q1=B: koszyk Umowy Handlowej AI — realne zapasy obu stron,
 * słodzik w giveItems (cap skarbca), pusty koszyk → null (nie trafia na stół).
 */
export function buildClampedAiTradeAgreementPayload(
  quick: QuickDealResult,
  sweetenerGold: number | undefined,
  proposerCtx: OwnerBasketAffordCtx,
  responderCtx: OwnerBasketAffordCtx,
): AiTradeAgreementBasketPayload | null {
  let giveItems: BasketItem[] = [...quick.giveItems];
  const receiveItems: BasketItem[] = [...quick.receiveItems];

  const sweetenerCap = capAiGoldOffer(
    proposerCtx.gold,
    Math.min(sweetenerGold ?? 0, AI_TRADE_AGREEMENT_SWEETENER_MAX),
  );
  if (sweetenerCap > 0) {
    const goldIdx = giveItems.findIndex(i => i.typ === 'zloto');
    if (goldIdx >= 0) {
      giveItems[goldIdx] = {
        ...giveItems[goldIdx]!,
        ilosc: (giveItems[goldIdx]!.ilosc ?? 0) + sweetenerCap,
      };
    } else {
      giveItems.push({ typ: 'zloto', id: 'zloto', ilosc: sweetenerCap });
    }
  }

  giveItems = clampBasketItemsToAffordable(giveItems, proposerCtx, 1, 'once');
  const clampedReceive = clampBasketItemsToAffordable(receiveItems, responderCtx, 1, 'once');

  const goldItemIdx = giveItems.findIndex(i => i.typ === 'zloto');
  if (goldItemIdx >= 0) {
    const maxGoldQty = capAiGoldOffer(proposerCtx.gold, AI_TRADE_GOLD_MAX);
    if (maxGoldQty <= 0) {
      giveItems = giveItems.filter((_, i) => i !== goldItemIdx);
    } else {
      const capped = clampBasketItemsToAffordable(
        [giveItems[goldItemIdx]!],
        proposerCtx,
        1,
        'once',
      );
      if (capped.length === 0) {
        giveItems = giveItems.filter((_, i) => i !== goldItemIdx);
      } else {
        giveItems[goldItemIdx] = capped[0]!;
      }
    }
  }

  if (giveItems.length === 0 && clampedReceive.length === 0) return null;

  return {
    ...(giveItems.length ? { giveItems } : {}),
    ...(clampedReceive.length ? { receiveItems: clampedReceive } : {}),
  };
}


