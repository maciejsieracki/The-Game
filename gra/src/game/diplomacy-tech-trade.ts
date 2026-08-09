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

/**
 * P-HANDEL-TECH-BLOKADA-AKCJA6-ASYMETRIA-Q1 (runda 2, 2026-08-09) — decyzja właściciela
 * R-HANDEL-TECH-AKCJA6-DWUKIERUNKOWY-Q1=A: akcja '6' obsługuje handel technologią
 * dwukierunkowo (Sprzedaż/Kupno), zapłata gotówką LUB inną technologią (tech-za-tech,
 * diplomacy.json „Wymiana bezpłatna" — rozszerzenie zakresu z 2026-08-09, pierwotna
 * TWARDA GRANICA C-025 zawężająca do wyłącznie gotówki zniesiona decyzją właściciela).
 *
 * Czysta funkcja rozstrzygająca role stron dla jednej transakcji, w zależności od
 * kierunku wybranego w formularzu:
 *   - 'sell' (domyślne, zgodne z zachowaniem sprzed tej decyzji): proponent ODDAJE
 *     technologię, respondent PŁACI.
 *   - 'buy': respondent ODDAJE technologię, proponent PŁACI.
 *
 * `payerId`/`payeeId` mają to samo znaczenie niezależnie od SPOSOBU zapłaty (gotówka czy
 * technologia) — payer to zawsze odbiorca głównej technologii (`granteeId`), payee to
 * zawsze jej dawca (`granterId`); przy zapłacie technologią płynie ona więc DOKŁADNIE w
 * przeciwną stronę co `techId` (prawdziwa wymiana dwustronna).
 *
 * `proposerId`/`responderId` to zwykłe liczby ownerId — funkcja nie zakłada, kto jest
 * graczem (dziś main.ts::buildProposalFromPayload zawsze stawia gracza jako proponenta
 * dla akcji '6', ale ta funkcja pozostaje ogólna, bez tego założenia zaszytego na sztywno).
 */
export type TechTradeDirection = 'sell' | 'buy';

/** 'gold' (domyślne, brak pola = stary zapis) — zapłata gotówką. 'tech' — zapłata inną technologią. */
export type TechTradePaymentMode = 'gold' | 'tech';

export interface TechTradeParties {
  /** Kto ODDAJE technologię (traci nic materialnego — tech pozostaje też u niego). */
  granterId: number;
  /** Kto DOSTAJE technologię. */
  granteeId: number;
  /** Kto PŁACI (gotówką LUB technologią, patrz `techPaymentMode` — zawsze === granteeId). */
  payerId: number;
  /** Kto DOSTAJE zapłatę (gotówkę LUB technologię — zawsze === granterId). */
  payeeId: number;
  techId: string;
  gold: number;
}

export function resolveTechTradeParties(
  proposerId: number,
  responderId: number,
  techId: string,
  gold: number,
  direction: TechTradeDirection,
): TechTradeParties {
  if (direction === 'buy') {
    return {
      granterId: responderId,
      granteeId: proposerId,
      payerId: proposerId,
      payeeId: responderId,
      techId,
      gold,
    };
  }
  return {
    granterId: proposerId,
    granteeId: responderId,
    payerId: responderId,
    payeeId: proposerId,
    techId,
    gold,
  };
}

/** Zależności wstrzykiwane do executeTechTradeDealCore — main.ts podpina prawdziwy skarbiec/
 * grantTechToOwner/showHintMessage, testy podpinają realne moduły z lekkim in-memory skarbcem
 * (patrz diplomacy-tech-trade-execute-test.cjs) — bez uruchamiania całego silnika main.ts. */
export interface TechTradeExecutionDeps {
  getGold(ownerId: number): number;
  transferGold(fromOwnerId: number, toOwnerId: number, amount: number): void;
  /** Czy `ownerId` faktycznie ZNA `techId` — B1 (rozszerzony zakres): oddający technologię
   * jako zapłatę musi ją realnie posiadać, tak samo jak płatnik gotówką musi mieć środki. */
  ownerHasTech(ownerId: number, techId: string): boolean;
  /** Podgląd BEZ mutacji — czy `grantTech(techId, toOwnerId)` powiodłoby się teraz (tech już
   * zbadana / prereq / epoka / tier). Używane do sprawdzenia OBU grantów wymiany tech-za-tech
   * PRZED zatwierdzeniem któregokolwiek — bez tego drugi grant mógłby się nie udać PO tym, jak
   * pierwszy już się zatwierdził (stan częściowy: jedna strona traci technologię za darmo). */
  canGrantTech(techId: string, toOwnerId: number): { granted: boolean; reason?: string };
  grantTech(techId: string, toOwnerId: number): { granted: boolean; reason?: string };
  onCancelled(reason: string): void;
}

/**
 * B1/B2 (Evaluator runda 1 FAIL — exploit „darmowa technologia" + zero pokrycia mutacyjnego
 * okablowania), rozszerzone o tech-za-tech (runda 2, decyzja właściciela — pełny zakres
 * R-HANDEL-TECH-AKCJA6-DWUKIERUNKOWY-Q1): orkiestracja wykonania handlu tech (akcja '6')
 * WYDZIELONA z main.ts, żeby dało się ją realnie przetestować bez odtwarzania całego stanu
 * gry — main.ts::executeTechTradeDeal jest CIENKIM wrapperem podpinającym prawdziwy
 * skarbiec/grantTechToOwnerWithSideEffects/showHintMessage pod te same callbacki, więc test
 * wołający tę funkcję woła DOKŁADNIE tę samą logikę, jaką woła main.ts w grze — nie kopię.
 *
 * Kolejność ma znaczenie (B1+B2, OBA tryby zapłaty): warunki sprawdzone PRZED przyznaniem
 * GŁÓWNEJ technologii.
 *   - Dawca głównej technologii (`granterId`) musi ją faktycznie ZNAĆ (`ownerHasTech`) —
 *     druga połowa exploita rundy 1 (Evaluator runda 3): bez tego deal z nieznaną `techId`
 *     tworzył technologię znikąd u odbiorcy. Uniwersalne, OBA tryby zapłaty.
 *   - Tryb 'gold': płatnik musi mieć środki (jak dawniej) — inaczej płatnik bez środków
 *     dostawał technologię za darmo (Runda 1: `applyOneShotGoldTransfer` jest strict, brak
 *     środków = `{ok:false}`/zero transferu, ale nic tego nie sprawdzało PRZED grantem).
 *   - Tryb 'tech' (NOWY zakres): oddający musi faktycznie POSIADAĆ oferowaną technologię
 *     (`ownerHasTech`) — analogiczny błąd byłby równie poważny (oddanie technologii, której
 *     się nie posiada). Oba granty (główny + zapłata) są NAJPIERW podglądnięte bez mutacji
 *     (`canGrantTech`) i dopiero PO potwierdzeniu, że OBA się powiodą, zatwierdzone —
 *     zapobiega stanowi częściowemu (jeden grant przeszedł, drugi odrzucony przez silnik).
 * Gdy którykolwiek warunek zawiedzie — CAŁY deal anulowany: zero mutacji w obie strony.
 * Zwraca `true` tylko gdy deal faktycznie się wykonał (main.ts warunkuje tym `updateHud()`).
 */
export function executeTechTradeDealCore(
  proposerId: number,
  responderId: number,
  techId: string | undefined,
  gold: number,
  direction: TechTradeDirection,
  paymentMode: TechTradePaymentMode,
  techOfferId: string | undefined,
  deps: TechTradeExecutionDeps,
): boolean {
  if (!techId) return false;
  const parties = resolveTechTradeParties(proposerId, responderId, techId, gold, direction);

  // B2 (Evaluator runda 3 — druga połowa exploita rundy 1): dawca GŁÓWNEJ technologii
  // (`granterId`) musi ją faktycznie znać — `canGrantTech`/`grantTech` walidują WYŁĄCZNIE
  // odbiorcę (prereq/epoka/tier/już-zbadana), dawca nie był weryfikowany w ŻADNYM trybie
  // zapłaty. Bez tego dowolny deal z nieznaną `techId` tworzył technologię ZNIKĄD u
  // odbiorcy (Sprzedaż: gracz „sprzedaje" coś, czego nie zna, AI dostaje ją za darmo + wciąż
  // płaci; Kupno analogicznie w drugą stronę). Sprawdzone PRZED jakimkolwiek
  // grantem/podglądem, w OBU trybach — dokładnie ten sam wzorzec co ownerHasTech dla
  // `techOfferId` niżej (tryb 'tech'), tylko po stronie GŁÓWNEJ technologii.
  if (!deps.ownerHasTech(parties.granterId, parties.techId)) {
    deps.onCancelled('Handel technologią anulowany — dawca nie posiada oferowanej technologii');
    return false;
  }

  if (paymentMode === 'tech') {
    if (!techOfferId || techOfferId === techId) {
      deps.onCancelled('Handel technologią anulowany — brak prawidłowej technologii oferowanej w zamian');
      return false;
    }
    if (!deps.ownerHasTech(parties.payerId, techOfferId)) {
      deps.onCancelled('Handel technologią anulowany — oddający nie posiada oferowanej technologii');
      return false;
    }
    const mainPreview = deps.canGrantTech(parties.techId, parties.granteeId);
    if (!mainPreview.granted) {
      deps.onCancelled('Handel technologią anulowany — ' + (mainPreview.reason ?? 'technologia niedostępna'));
      return false;
    }
    const counterPreview = deps.canGrantTech(techOfferId, parties.payeeId);
    if (!counterPreview.granted) {
      deps.onCancelled(
        'Handel technologią anulowany — oferowana technologia niedostępna dla drugiej strony'
        + (counterPreview.reason ? ` (${counterPreview.reason})` : ''),
      );
      return false;
    }
    // Oba granty zweryfikowane (podgląd bez mutacji) wobec tego samego stanu bazowego —
    // różni odbiorcy, wzajemnie niezależne prereqy -> bezpieczne zatwierdzenie obu z rzędu.
    deps.grantTech(parties.techId, parties.granteeId);
    deps.grantTech(techOfferId, parties.payeeId);
    return true;
  }

  if (parties.gold > 0 && deps.getGold(parties.payerId) < parties.gold) {
    deps.onCancelled('Handel technologią anulowany — płatnik nie ma wystarczających środków');
    return false;
  }
  const grant = deps.grantTech(parties.techId, parties.granteeId);
  if (!grant.granted) {
    deps.onCancelled('Handel technologią anulowany — ' + (grant.reason ?? 'technologia niedostępna'));
    return false;
  }
  if (parties.gold > 0) {
    deps.transferGold(parties.payerId, parties.payeeId, parties.gold);
  }
  return true;
}
