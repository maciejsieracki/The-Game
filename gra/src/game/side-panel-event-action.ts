/**
 * side-panel-event-action.ts — R-WEB-UI-FARM-ASSIGN-HINT-CAMERA-IMPORTANT-Q1.
 *
 * Ogólna obsługa akcji wpisu panelu Wydarzenia (`SidePanelEvent.action`). Czysta logika bez DOM:
 * renderer dostaje etykietę skrótu („Pokaż"), a klik rozstrzyga tu, jaką akcję wykonać.
 * Nie jest specyficzna dla farmy — każde powiadomienie z polem `action` działa tak samo.
 * EN: generic handling of a panel card's action; pure, no DOM.
 */
import type { SidePanelEvent, SidePanelEventAction } from '../ui/sidePanelHud';

/** Etykieta skrótu karty niosącej akcję (renderowana jako „Pokaż →"). */
export const SIDE_PANEL_ACTION_LABEL = 'Pokaż';

/** Akcja karty o podanym id albo `null` (brak wpisu / brak akcji). */
export function sidePanelEventActionOf(
  events: readonly Pick<SidePanelEvent, 'id' | 'action'>[],
  id: string,
): SidePanelEventAction | null {
  const ev = events.find(e => e.id === id);
  return ev?.action ?? null;
}
