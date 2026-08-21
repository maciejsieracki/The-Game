/**
 * R-EOT-EVENT-DEFER-Q1=A — skutki końca tury nie migają w overlay; czekają na start tury gracza.
 */
import type { SidePanelEvent } from '../ui/sidePanelHud';

export interface DeferredEotHint {
  msg: string;
  durationMs: number;
}

/** Czy UI ma odkładać toasty / chipy wydarzeń (faza przejścia tury). */
export function shouldDeferEotEvents(endTurnInProgress: boolean): boolean {
  return endTurnInProgress;
}

/**
 * N1 (Evaluator PASS-WITH-NOTES, R-WYDARZENIA-FILTR-KATEGORII): wpisy `eot-hint-*`
 * (deferredHintsToSidePanelEvents powyżej) i `era-*` (notifyPlayerEraChangeIfAdvanced,
 * main.ts) trafiają do `warEventLog`, który NIE czyści się co turę (tylko przycina do
 * ostatnich 8 pozycji). Dismiss tych wpisów MUSI usuwać je TRWALE z `warEventLog` —
 * miękkie ukrycie (main.ts `dismissedSidePanelEventIds`) nie wystarcza, bo ten zbiór
 * jest czyszczony na końcu KAŻDEJ tury i skasowany wpis by wracał w kolejnej turze.
 *
 * Zwraca `true`, gdy id pasowało do jednego z tych dwóch prefiksów i zostało znalezione
 * i usunięte z `warEventLog` (dismiss zakończony — wołający NIE powinien spadać do
 * miękkiego fallbacku). Zwraca `false`, gdy id ma inny prefiks (poza zakresem tej
 * funkcji) LUB pasujący prefiks, ale wpisu nie znaleziono w logu — w obu przypadkach
 * wołający powinien spaść do własnego fallbacku miękkiego ukrycia.
 */
export function dismissEotOrEraWarLogEntry(
  warEventLog: SidePanelEvent[],
  id: string,
): boolean {
  if (!id.startsWith('eot-hint-') && !id.startsWith('era-')) return false;
  const idx = warEventLog.findIndex(e => e.id === id);
  if (idx < 0) return false;
  warEventLog.splice(idx, 1);
  return true;
}

/** Scal kolejkę odłożonych chipów z logami widocznymi po powrocie tury gracza. */
export function mergeDeferredEotSideEvents(
  targetLog: SidePanelEvent[],
  deferred: readonly SidePanelEvent[],
  maxLen = 8,
): void {
  if (deferred.length === 0) return;
  for (let i = deferred.length - 1; i >= 0; i--) {
    targetLog.unshift(deferred[i]!);
  }
  if (targetLog.length > maxLen) targetLog.length = maxLen;
}

/** Wzorzec komunikatu handlu AI↔AI (applyAiAiHandelSurowiecCmd, main.ts) — jedyny realny
 * typ wpisu „nie-nasz” przechodzący przez tę kolejkę (R-WYDARZENIA-FILTR-KATEGORII). */
const AI_AI_TRADE_MARKER = ' handluje z ';

/** Prefiks komunikatów dyplomacji gracz↔AI odłożonych tą kolejką — `showHintMessage('Dyplomacja: ' + …)`
 * wołane z `pruneInvalidNegotiations` / `resolveNegotiationEntryAt` w main.ts (oba warianty
 * „propozycja wygasła”), gdy trafia w `endTurnInProgress` (np. „Dyplomacja: propozycja wygasła —
 * …”). Bez tego dostawały mylący nagłówek „Koniec tury”, jakby to było ogólne podsumowanie tury,
 * a nie osobna nota dyplomatyczna (P-KONIEC-TURY-DYPLOMACJA-MYLACY-NAGLOWEK).
 * KOREKTA (P-DYPLO-KARTA-DUPLIKAT-KOMUNIKAT, 2026-08-16): `enqueueDiplomacyPendingFromCmd` /
 * `enqueueNegotiationFromAiCmd` (nowa propozycja AI→gracz) NIE wołają już tego toastu — dla tego
 * zdarzenia trwała reprezentacja to WYŁĄCZNIE karta stołu negocjacji (`negotiationTable`), toast
 * był zbędnym duplikatem, usunięty.
 * EN: prefix of player↔AI diplomacy messages deferred via this queue — without this check they got
 * the misleading "Koniec tury" (End of turn) header instead of a diplomacy-specific one.
 * CORRECTED: new AI→player proposals no longer emit this toast — the persistent negotiation-table
 * card is the sole representation for that event now; the toast was a redundant duplicate. */
export const DIPLOMACY_MSG_PREFIX = 'Dyplomacja:';

/** Polska odmiana rzeczownika po liczbie (1 / 2-4 / 5+, z wyjątkiem 12-14).
 * P-WYDARZENIA-DEDUP-KONIEC-TURY-Q1: duplikat lokalny wzorca `pluralPl` z
 * `sidePanelHud.ts` / `techDiscoveryNotice.ts` (Operator, decyzja świadoma) — import
 * z `techDiscoveryNotice.ts` (moduł UI popupu odkryć technologii) sprzęgałby ten czysto
 * transformacyjny moduł danych z niezwiązanym modułem UI dla 6 linii logiki bez stanu;
 * `sidePanelHud.ts` z kolei ma tylko wariant 2-formowy (one/many), niewystarczający dla
 * poprawnej odmiany „wystąpienie/wystąpienia/wystąpień". Duplikacja krótkiej, czystej
 * funkcji jest tańsza niż nowa zależność międzymodułowa.
 * EN: local duplicate of the `pluralPl` pattern from `sidePanelHud.ts` /
 * `techDiscoveryNotice.ts` — importing from the tech-discovery UI popup module would
 * couple this pure data-transform module to an unrelated UI module for 6 lines of
 * stateless logic; `sidePanelHud.ts`'s own variant is only 2-form (one/many), not
 * enough for a correct "wystąpienie/wystąpienia/wystąpień" declension. Duplicating a
 * short pure function is cheaper than a new cross-module dependency. */
function pluralPl(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one;
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) return few;
  return many;
}

interface EotEventDraft {
  icon: string;
  title: string;
  subtitle: string;
  kind: 'info' | 'diplo';
  origin?: 'other-civs';
}

/** Zamień odłożone hinty na wpisy panelu Wydarzenia.
 * Wpisy dyplomatyczne — handel AI↔AI (marker „ handluje z ”) ORAZ komunikaty dyplomacji gracz↔AI
 * (treść zaczyna się od „Dyplomacja:”, patrz `DIPLOMACY_MSG_PREFIX`) — dostają etykietę „Dyplomacja”
 * + `kind:'diplo'` (spójnie z innymi kartami dyplomacji z main.ts). Tylko handel AI↔AI (jedyny
 * „nie-nasz” typ hintu odłożonego tą ścieżką) dostaje dodatkowo `origin:'other-civs'`, żeby chip
 * 🌍 „Inne cyw.” mógł go filtrować — komunikaty gracz↔AI dotyczą gracza wprost, więc origin nie jest
 * im nadawany. Wszystkie pozostałe hinty EOT zachowują dotychczasową etykietę „Koniec tury” i
 * `kind:'info'`.
 * EN: diplomacy entries — AI↔AI trade (" handluje z " marker) AND player↔AI diplomacy messages
 * (text starting with "Dyplomacja:") — get the "Dyplomacja" label + `kind:'diplo'` (consistent with
 * other diplomacy cards from main.ts). Only AI↔AI trade (the sole "not-ours" hint type deferred via
 * this path) additionally gets `origin:'other-civs'`, so the 🌍 "Other civs" chip can filter it —
 * player↔AI messages concern the player directly, so no origin is set for them. All remaining EOT
 * hints keep the existing "Koniec tury" label and `kind:'info'`.
 *
 * P-WYDARZENIA-DEDUP-KONIEC-TURY-Q1: wpisy `kind:'info'` o identycznej treści (title + subtitle
 * PO stripie HTML) w obrębie tej samej listy (czyli tej samej tury) scalają się w JEDNĄ kartę
 * z widocznym licznikiem wystąpień dopisanym do `subtitle` — dziś kilka niezależnych wyrębów
 * lasu w tej samej turze generowało kilka identycznych kart „Koniec tury” w rzędzie (zgłoszenie
 * właściciela). Kolejność wynikowej listy = pozycja PIERWSZEGO wystąpienia w grupie (scalona
 * karta nie „skacze” na koniec). Wpisy `kind:'diplo'` NIGDY nie są scalane, nawet identyczne
 * tekstowo z innymi wpisami dyplomatycznymi — świadomie poza zakresem (patrz 00-dispatch.md):
 * zlanie dwóch osobnych negocjacji w jedną kartę byłoby mylące, a duplikaty w praktyce
 * zaobserwowano tylko dla `kind:'info'`. `id` finalnych kart używa indeksu PO scaleniu (nie
 * oryginalnego indeksu przed scaleniem), żeby uniknąć kolizji/dziur w numeracji.
 * EN: `kind:'info'` entries with identical content (title + subtitle after HTML strip) within
 * the same list (i.e. the same turn) are merged into a SINGLE card with a visible occurrence
 * count appended to `subtitle` — several independent forest-clearing hints in the same turn
 * used to produce several identical "Koniec tury" cards in a row (owner report). The resulting
 * list order = position of the FIRST occurrence in the group (a merged card does not "jump" to
 * the end). `kind:'diplo'` entries are NEVER merged, even if textually identical to other
 * diplomacy entries — deliberately out of scope (see 00-dispatch.md): collapsing two separate
 * negotiations into one card would be misleading, and duplicates were only observed in practice
 * for `kind:'info'`. Final card `id`s use the post-merge index (not the pre-merge original
 * index), to avoid collisions/gaps in numbering. */
export function deferredHintsToSidePanelEvents(
  hints: readonly DeferredEotHint[],
  turn: number,
): SidePanelEvent[] {
  const drafts: EotEventDraft[] = hints.map(h => {
    // N3 (Evaluator PASS-WITH-NOTES 7b02eb2d): kolejność sprawdzania tych dwóch flag ma
    // znaczenie dla `origin`. Gdyby jakiś komunikat pasował do OBU wzorców naraz (zaczynał się
    // od „Dyplomacja:” I zawierał marker AI↔AI „ handluje z ”), `isAiAiTrade` „wygrywa” niżej
    // przy nadawaniu `origin:'other-civs'` — wpis dotyczący gracza wprost zostałby ukryty przy
    // filtrze 🌍 „Inne cyw.” OFF, wbrew intencji naprawy P-KONIEC-TURY-DYPLOMACJA-MYLACY-NAGLOWEK.
    // Dziś nieosiągalne: żadna z 8 wartości `diploPendingTitle()` (main.ts) ani 4 reasonów
    // `negotiationStillValid()` (diplomacy-proposals.ts) nie zawiera markera „ handluje z ” —
    // zweryfikowane przeglądem obu list. Jeśli w przyszłości ktoś doda taki tekst do jednej
    // z nich, ta kolizja stanie się realna i będzie wymagała jawnego rozstrzygnięcia priorytetu
    // (np. `isPlayerAiDiplomacy` przed `isAiAiTrade` przy nadawaniu origin).
    // EN: the check order of these two flags matters for `origin`. If a message ever matched
    // BOTH patterns at once (started with "Dyplomacja:" AND contained the AI↔AI " handluje z "
    // marker), `isAiAiTrade` "wins" below when assigning `origin:'other-civs'` — an entry that
    // concerns the player directly would get hidden by the 🌍 "Other civs" filter when OFF,
    // against the intent of the P-KONIEC-TURY-DYPLOMACJA-MYLACY-NAGLOWEK fix. Unreachable today:
    // none of the 8 `diploPendingTitle()` values (main.ts) nor the 4 `negotiationStillValid()`
    // reasons (diplomacy-proposals.ts) contain the " handluje z " marker — checked by review of
    // both lists. If either ever gains such text, this collision becomes real and needs an
    // explicit priority resolution (e.g. check `isPlayerAiDiplomacy` before `isAiAiTrade` for origin).
    const isAiAiTrade = h.msg.includes(AI_AI_TRADE_MARKER);
    const isPlayerAiDiplomacy = h.msg.startsWith(DIPLOMACY_MSG_PREFIX);
    const isDiplomacy = isAiAiTrade || isPlayerAiDiplomacy;
    return {
      icon: '\u2139\ufe0f',
      title: isDiplomacy ? 'Dyplomacja' : 'Koniec tury',
      subtitle: h.msg.replace(/<[^>]+>/g, ''),
      kind: isDiplomacy ? ('diplo' as const) : ('info' as const),
      ...(isAiAiTrade ? { origin: 'other-civs' as const } : {}),
    };
  });

  // P-WYDARZENIA-DEDUP-KONIEC-TURY-Q1 — scalanie: tylko `kind:'info'`, klucz = title +
  // subtitle (już po stripie HTML powyżej). `infoGroupIndexByKey` pamięta pozycję w `merged`,
  // w której wylądowała grupa PIERWSZEGO wystąpienia — kolejne duplikaty tylko inkrementują
  // `count` tej pozycji, nie tworzą nowego wpisu i nie przesuwają grupy (kolejność = pozycja
  // pierwszego wystąpienia). Wpisy `diplo` zawsze trafiają jako nowa, osobna pozycja (count
  // zawsze 1) — 1:1 jak przed tą zmianą, nawet jeśli tekstowo identyczne z innym wpisem diplo.
  const merged: Array<EotEventDraft & { count: number }> = [];
  const infoGroupIndexByKey = new Map<string, number>();
  for (const d of drafts) {
    if (d.kind === 'info') {
      const key = d.title + ' ' + d.subtitle;
      const existingIdx = infoGroupIndexByKey.get(key);
      if (existingIdx !== undefined) {
        merged[existingIdx]!.count++;
        continue;
      }
      infoGroupIndexByKey.set(key, merged.length);
    }
    merged.push({ ...d, count: 1 });
  }

  // `id` używa indeksu PO scaleniu (`i` tutaj), nie oryginalnego indeksu przed scaleniem —
  // inaczej możliwe kolizje/dziury w numeracji po usunięciu duplikatów z listy.
  return merged.map((d, i) => ({
    id: `eot-hint-${turn}-${i}`,
    icon: d.icon,
    title: d.title,
    subtitle: d.count > 1
      ? `${d.subtitle} (${d.count} ${pluralPl(d.count, 'wystąpienie', 'wystąpienia', 'wystąpień')})`
      : d.subtitle,
    kind: d.kind,
    ...(d.origin ? { origin: d.origin } : {}),
  }));
}
