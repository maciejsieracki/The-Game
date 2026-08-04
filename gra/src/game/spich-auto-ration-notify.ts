/**
 * spich-auto-ration-notify.ts — komunikaty SPICH-AUTO-Q1 (auto-obniżenie racji).
 */
import type { AutoRationAdjustResult } from './empire-food';
import { formatWyzwienieLabel } from './population-growth-v85';
import type { SidePanelEvent } from '../ui/sidePanelHud';

export const AUTO_RATION_EVENT_COPY = {
  title: 'Automatycznie obniżono racje żywnościowe',
  body: 'Bilans żywności imperium wyrównany do zera — Spichlerz nie pokrywa deficytu miast.',
} as const;

export function autoRationEventSubtitle(result: AutoRationAdjustResult): string {
  if (result.changes.length === 0) return AUTO_RATION_EVENT_COPY.body;
  const parts = result.changes.map(
    c => `${c.name}: ${formatWyzwienieLabel(c.oldLevel)} → ${formatWyzwienieLabel(c.newLevel)}`,
  );
  return parts.join(' · ');
}

/** Wpis panelu Wydarzenia — negatywny (czerwony akcent). */
export function buildAutoRationSidePanelEvent(result: AutoRationAdjustResult, turn: number): SidePanelEvent {
  return {
    id: `auto-ration-t${turn}`,
    icon: '\u{1F34E}',
    title: AUTO_RATION_EVENT_COPY.title,
    subtitle: autoRationEventSubtitle(result),
    kind: 'enemy',
    negative: true,
  };
}
