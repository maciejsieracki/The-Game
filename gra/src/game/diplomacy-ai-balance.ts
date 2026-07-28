/**
 * diplomacy-ai-balance.ts — R-HANDEL-AI-FALA: AI trade proposals vs real resources.
 * Pure, testable helpers (no DOM / main.ts state).
 */
import type { AIDiplomacyCommand } from './ai';
import type { BasketItem } from './diplomacy-pn-engine';
import { diplomacyPnPraca, diplomacyPnZloto } from './diplomacy-value-catalog';

export interface AiResourceTradeClampCtx {
  aiOwnerId: number;
  partnerOwnerId: number;
  aiGold: number;
  partnerGold: number;
  aiPraca: number;
  partnerPraca: number;
  aiStock: Record<string, number>;
  partnerStock: Record<string, number>;
  pakietWielkosc: number;
  defaultTurns: number;
}

export interface OwnerBasketAffordCtx {
  gold: number;
  praca: number;
  foodReserve: number;
  stock: Record<string, number>;
  pakietWielkosc: number;
}

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
 * Skaluje propozycję handlu surowcem AI do realnych zapasów sprzedawcy i środków kupującego
 * na pełny cykl (turns × zapłata/turę).
 */
export function clampAiResourceTradeCommand(
  cmd: ResourceTradeCmd,
  ctx: AiResourceTradeClampCtx,
): ResourceTradeCmd | null {
  const pakiet = ctx.pakietWielkosc > 0 ? ctx.pakietWielkosc : 1;
  const isBuy = cmd.kierunek === 'zakup';

  const sellerStock = isBuy ? ctx.partnerStock : ctx.aiStock;
  const buyerGold = isBuy ? ctx.aiGold : ctx.partnerGold;
  const buyerPraca = isBuy ? ctx.aiPraca : ctx.partnerPraca;

  const stockKey = cmd.surowiecKey.trim().toLowerCase();
  const sellerHave = sellerStock[stockKey] ?? 0;
  const maxPakietyPerTura = Math.floor(sellerHave / pakiet);
  let pakietyPerTura = Math.min(cmd.pakietyPerTura, maxPakietyPerTura);

  let turns = cmd.turns > 0 ? cmd.turns : ctx.defaultTurns;
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

/**
 * Czy owner może pokryć pozycje koszyka — złoto, praca, żywność, surowiec_ilosc, surowiec_boolean.
 * `turnsMultiplier` — pełny cykl płatności (np. handel per_turn × turns tur).
 */
export function basketItemsAffordableExtended(
  items: readonly BasketItem[] | undefined,
  ownerCtx: OwnerBasketAffordCtx,
  turnsMultiplier = 1,
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
        const key = item.id.trim().toLowerCase();
        const unitsNeeded = qty * pakiet * mult;
        const have = ownerCtx.stock[key] ?? 0;
        if (unitsNeeded > 0 && have < unitsNeeded) return false;
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
