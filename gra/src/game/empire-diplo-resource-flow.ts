/**
 * empire-diplo-resource-flow.ts — przepływy surowców z umów dyplomatycznych (per turę).
 * PURE — do panelu magazynu imperium (produkcja vs dyplomacja vs netto).
 * R-DYP-PAKIET-USUN (2026-08-08): `pakietyPerTura` na ActiveDeal to dziś SZTUKI/turę
 * wprost (nazwa pola zostaje niezmieniona — zbyt wiele miejsc odwołania — ale nie mnoży
 * się już przez wielkość pakietu, patrz diplomacy-value-catalog.ts).
 */
import type { ActiveDeal } from './diplomacy-treaties';

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
): Readonly<Record<string, DiploResourceFlow>> {
  const flows: Record<string, DiploResourceFlow> = {};

  for (const deal of activeDeals) {
    const items = deal.handelSurowiecCykliczny;
    if (!items?.length) continue;
    for (const item of items) {
      const key = item.surowiecKey.trim().toLowerCase();
      const units = Math.max(0, Math.floor(item.pakietyPerTura));
      if (units <= 0) continue;
      if (!flows[key]) flows[key] = { inPerTurn: 0, outPerTurn: 0 };
      if (item.sellerOwnerId === ownerId) flows[key].outPerTurn += units;
      if (item.buyerOwnerId === ownerId) flows[key].inPerTurn += units;
    }
  }
  return flows;
}
