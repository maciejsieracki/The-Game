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

/** Zamień odłożone hinty na wpisy panelu Wydarzenia (info).
 * Handel AI↔AI (jedyny „nie-nasz” typ hintu odłożonego tą ścieżką) dostaje etykietę
 * „Dyplomacja” + `origin:'other-civs'`, żeby chip 🌍 „Inne cyw.” mógł go filtrować;
 * wszystkie pozostałe hinty EOT zachowują dotychczasową etykietę „Koniec tury”. */
export function deferredHintsToSidePanelEvents(
  hints: readonly DeferredEotHint[],
  turn: number,
): SidePanelEvent[] {
  return hints.map((h, i) => {
    const isAiAiTrade = h.msg.includes(AI_AI_TRADE_MARKER);
    return {
      id: `eot-hint-${turn}-${i}`,
      icon: '\u2139\ufe0f',
      title: isAiAiTrade ? 'Dyplomacja' : 'Koniec tury',
      subtitle: h.msg.replace(/<[^>]+>/g, ''),
      kind: 'info' as const,
      ...(isAiAiTrade ? { origin: 'other-civs' as const } : {}),
    };
  });
}
