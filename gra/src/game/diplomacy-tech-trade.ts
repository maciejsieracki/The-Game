/**
 * diplomacy-tech-trade.ts — R-HANDEL-TECHNOLOGIA-FILTR-WSPOLNE (2026-08-08, playtest Macieja).
 *
 * Jego słowa: „kiedy wymieniamy surowce i na przykład chcemy się wymienić technologiami
 * powinny być pokazywane tylko technologie te które są niedostępne dla innej cywilizacji
 * zarówno po jednej jak i po drugiej stronie. Jeżeli jedna i druga cywilizacja ma tą
 * technologię to nie ma sensu jej pokazywać, bo przecież nie dojdzie do wymiany."
 *
 * Czysta funkcja filtrująca — używana symetrycznie przez OBIE strony koszyka handlu
 * technologiami (main.ts::getSellableTechForPlayer „daję" i getBuyableTechFromOwner
 * „dostaję", patrz PARITY w .cursor/rules/autobot-evaluator-operator.mdc). Technologia
 * zbadana przez obie strony nigdy nie trafia do żadnej z list — wymiana nic by nie zmieniła.
 */
export function tradeableTechIdsForSide(
  ownKnown: ReadonlySet<string>,
  otherKnown: ReadonlySet<string>,
): string[] {
  return Array.from(ownKnown).filter(id => !otherKnown.has(id));
}
