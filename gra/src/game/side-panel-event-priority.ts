import type { SidePanelEvent } from '../ui/sidePanelHud';

/**
 * R-EVENTY-WAZNE-KARTY-Q1: only cards that require a player decision block EOT.
 * Producers must opt in with `blocking: true`; informational cards stay dismissible.
 */
export function isBlockingSidePanelEvent(event: Pick<SidePanelEvent, 'blocking'>): boolean {
  return event.blocking === true;
}
