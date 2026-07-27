/**
 * empire-diplo-resource-flow.ts — przepływy surowców z umów dyplomatycznych (per turę).
 * PURE — do panelu magazynu imperium (produkcja vs dyplomacja vs netto).
 */
import type { ActiveDeal } from './diplomacy-treaties';
import { diplomacyHandelSurowcePakietWielkosc } from './diplomacy-value-catalog';

export interface DiploResourceFlow {
  /** Sztuki surowca przychodzące co turę (kupujemy). */
  inPerTurn: number;
  /** Sztuki surowca wychodzące co turę (sprzedajemy / oddajemy). */
  outPerTurn: number;
}

/** Suma przepływów cyklicznych handlu surowcem per klucz ASCII (drewno, kamien, …). */
export function empireDiploResourceFlowPerTurn(
  activeDeals: readonly ActiveDeal[],
  ownerId: number,
  pakietWielkosc: number = diplomacyHandelSurowcePakietWielkosc(),
): Readonly<Record<string, DiploResourceFlow>> {
  const flows: Record<string, DiploResourceFlow> = {};
  const pakiet = pakietWielkosc > 0 ? pakietWielkosc : diplomacyHandelSurowcePakietWielkosc();

  for (const deal of activeDeals) {
    const items = deal.handelSurowiecCykliczny;
    if (!items?.length) continue;
    for (const item of items) {
      const key = item.surowiecKey.trim().toLowerCase();
      const units = Math.max(0, Math.floor(item.pakietyPerTura)) * pakiet;
      if (units <= 0) continue;
      if (!flows[key]) flows[key] = { inPerTurn: 0, outPerTurn: 0 };
      if (item.sellerOwnerId === ownerId) flows[key].outPerTurn += units;
      if (item.buyerOwnerId === ownerId) flows[key].inPerTurn += units;
    }
  }
  return flows;
}
