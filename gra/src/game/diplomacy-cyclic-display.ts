/**
 * R-WEB-DIPLO-ACTIVE-TREATIES-RESOURCE-DEALS-Q1 — wiersze „co dostarczamy" dla cyklicznych
 * umów wymiany surowców w kolumnie „Aktywne traktaty" panelu audiencji. Czyste funkcje
 * (bez zależności od main.ts) → testowalne w Node. Tylko wyświetlanie; zasady i liczby
 * silnika (main.ts tickCyclicResourceTradeDeals) bez zmian.
 */
import type { ActiveDeal, HandelSurowiecCyklicznyItem } from './diplomacy-treaties';
import { resourceDisplayLabel } from './diplomacy-display';

export interface CyclicExchangeLine {
  /** np. „Dostarczasz: 3 Żelazo na turę → Chińczycy za 12 ¤ na turę" */
  text: string;
  /** ok = ostatnia dostawa doszła; fail = nie doszła; pending = jeszcze nie rozliczano. */
  status: 'ok' | 'fail' | 'pending';
  /** np. „✓ dostarczono w t.12" / „✗ nie dostarczono w t.12 — brak surowca u partnera" */
  statusText: string;
}

/**
 * Wynik rozliczenia pozycji w turze `turn` → `HandelSurowiecCyklicznyItem.ostatniaDostawa`.
 * Wołane przez main.ts (applyCyclicDeliveryOutcome) — jedno źródło prawdy dla silnika i testu.
 */
export function cyclicDeliveryRecord(
  turn: number,
  delivered: boolean,
  sellerAtFault: boolean,
  buyerAtFault: boolean,
): NonNullable<HandelSurowiecCyklicznyItem['ostatniaDostawa']> {
  if (delivered) return { tura: turn, ok: true };
  return { tura: turn, ok: false, powod: sellerAtFault ? 'sprzedawca' : (buyerAtFault ? 'kupujacy' : 'partner') };
}

/** Jedna pozycja cyklicznej wymiany z perspektywy `viewerOwnerId`. */
export function describeCyclicExchangeItem(
  item: HandelSurowiecCyklicznyItem,
  viewerOwnerId: number,
  partnerName: string,
): CyclicExchangeLine {
  const label = resourceDisplayLabel(item.surowiecKey);
  const viewerSells = item.sellerOwnerId === viewerOwnerId;
  const goods = `${item.pakietyPerTura} ${label} na turę`;
  const z = item.zaplataPerTura ?? 0;
  let pay = '';
  if (z > 0 && item.zaplataTyp === 'zloto') pay = ` za ${z} ¤ na turę`;
  else if (z > 0 && item.zaplataTyp === 'praca') pay = ` za ${z} Pracy na turę`;
  else if (!item.zaplataTyp) pay = ' (barter)';
  const text = viewerSells
    ? `Dostarczasz: ${goods} → ${partnerName}${pay}`
    : `Otrzymujesz: ${goods} od ${partnerName}${pay}`;
  const last = item.ostatniaDostawa;
  if (!last) {
    return { text, status: 'pending', statusText: 'jeszcze nie rozliczano — pierwsza dostawa na koniec tury' };
  }
  if (last.ok) {
    return { text, status: 'ok', statusText: `✓ dostarczono w t.${last.tura}` };
  }
  const why = last.powod === 'sprzedawca'
    ? (viewerSells ? 'brak surowca u Ciebie' : 'brak surowca u partnera')
    : last.powod === 'kupujacy'
      ? (viewerSells ? 'partner nie miał środków na zapłatę' : 'brak środków na zapłatę u Ciebie')
      : 'druga część wymiany nie została dostarczona';
  return { text, status: 'fail', statusText: `✗ nie dostarczono w t.${last.tura} — ${why}` };
}

/** Termin umowy: „co turę, pozostało N tur" / „co turę, bezterminowo". */
export function cyclicExchangeFrequencyLabel(wygasaTura: number | null, turn: number): string {
  if (wygasaTura === null) return 'co turę, bezterminowo';
  const left = Math.max(0, wygasaTura - turn);
  const noun = left === 1 ? 'tura' : (left >= 2 && left <= 4 ? 'tury' : 'tur');
  return `co turę, pozostało ${left} ${noun}`;
}

/** Wszystkie wiersze wymiany cyklicznej danej umowy (pusta tablica, gdy umowa jej nie ma). */
export function cyclicExchangeLinesForDeal(
  deal: ActiveDeal,
  viewerOwnerId: number,
  partnerName: string,
): CyclicExchangeLine[] {
  return (deal.handelSurowiecCykliczny ?? []).map(it => describeCyclicExchangeItem(it, viewerOwnerId, partnerName));
}
