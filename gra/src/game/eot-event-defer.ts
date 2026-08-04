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

/** Zamień odłożone hinty na wpisy panelu Wydarzenia (info). */
export function deferredHintsToSidePanelEvents(
  hints: readonly DeferredEotHint[],
  turn: number,
): SidePanelEvent[] {
  return hints.map((h, i) => ({
    id: `eot-hint-${turn}-${i}`,
    icon: '\u2139\ufe0f',
    title: 'Koniec tury',
    subtitle: h.msg.replace(/<[^>]+>/g, ''),
    kind: 'info' as const,
  }));
}
