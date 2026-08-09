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
import { epochGateMet, epochTierGateMet, findTech, prerequisitesOf, type ResearchTechDef } from './research';

export function tradeableTechIdsForSide(
  ownKnown: ReadonlySet<string>,
  otherKnown: ReadonlySet<string>,
): string[] {
  return Array.from(ownKnown).filter(id => !otherKnown.has(id));
}

/**
 * P-HANDEL-TECH-BRAK-PREREQ-PO-FILTRZE (2026-08-09, nota Evaluatora
 * R-HANDEL-TECHNOLOGIA-FILTR-WSPOLNE): filtr listy „które technologie odbiorca może
 * DOSTAĆ" do tych, dla których odbiorca ma zbadane prerekwizyty drzewka i spełnioną
 * bramkę epoki/tieru (ta sama logika co research.ts::canResearch, bez bramki
 * budynku/ulepszenia — dar dyplomatyczny nie wymaga posiadania konkretnego budynku).
 * Używana symetrycznie przez OBIE strony koszyka (main.ts::getSellableTechForPlayer —
 * odbiorcą jest responder — i getBuyableTechFromOwner — odbiorcą jest gracz), tak samo
 * jak `tradeableTechIdsForSide` wyżej. Tech spoza `techCatalog` (id nierozpoznane)
 * przechodzi bez zmian — walidacja istnienia technologii żyje gdzie indziej
 * (grantTechToOwner w diplomacy-basket-transfer.ts).
 */
export function techIdsWithPrereqsMetForRecipient(
  techIds: readonly string[],
  recipientKnown: ReadonlySet<string>,
  techCatalog: readonly ResearchTechDef[],
): string[] {
  return techIds.filter(id => {
    const def = findTech(techCatalog, id);
    if (!def) return true;
    return prerequisitesOf(def).every((p) => recipientKnown.has(p))
      && epochGateMet(def, techCatalog, recipientKnown)
      && epochTierGateMet(def, techCatalog, recipientKnown);
  });
}
