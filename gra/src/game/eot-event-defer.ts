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
 * wołane z `enqueueDiplomacyPendingFromCmd` / `resolveNegotiationEntryAt` / negocjacji AI→gracz w
 * main.ts, gdy trafia w `endTurnInProgress` (np. „Dyplomacja: Korynt · Grecy · miasto-państwo —
 * Propozycja handlu surowcem”). Bez tego dostawały mylący nagłówek „Koniec tury”, jakby to było
 * ogólne podsumowanie tury, a nie osobna nota dyplomatyczna (P-KONIEC-TURY-DYPLOMACJA-MYLACY-NAGLOWEK).
 * EN: prefix of player↔AI diplomacy messages deferred via this queue — without this check they got
 * the misleading "Koniec tury" (End of turn) header instead of a diplomacy-specific one. */
export const DIPLOMACY_MSG_PREFIX = 'Dyplomacja:';

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
 * hints keep the existing "Koniec tury" label and `kind:'info'`. */
export function deferredHintsToSidePanelEvents(
  hints: readonly DeferredEotHint[],
  turn: number,
): SidePanelEvent[] {
  return hints.map((h, i) => {
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
      id: `eot-hint-${turn}-${i}`,
      icon: '\u2139\ufe0f',
      title: isDiplomacy ? 'Dyplomacja' : 'Koniec tury',
      subtitle: h.msg.replace(/<[^>]+>/g, ''),
      kind: isDiplomacy ? ('diplo' as const) : ('info' as const),
      ...(isAiAiTrade ? { origin: 'other-civs' as const } : {}),
    };
  });
}
