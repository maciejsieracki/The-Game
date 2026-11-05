/**
 * sidePanelEventFilter.ts
 * R-WEB-UI-NOTIFICATIONS-3-TABS-PRUNE-Q1 — czysty filtr wpisów informacyjnych panelu
 * WYDARZENIA wg aktywnej zakładki (Dyplomacja / Ważne / Inne). Zastępuje dawny filtr chipa
 * „🌍 Inne cyw.”. Wydzielony z sidePanelHud.ts, bo ten plik ma zero importów niebundlowalnych
 * w czystym esbuild (testy UI bundlują samą logikę, bez stubowania ikon).
 */
import type { SidePanelEvent } from './sidePanelHud';
import { eventTabOf, type SidePanelTab } from './sidePanelEventTabs';

/** Zwraca wpisy należące do zakładki `tab`, w niezmienionej kolejności. */
export function filterSidePanelEventsByTab(
  events: readonly SidePanelEvent[],
  tab: SidePanelTab,
): SidePanelEvent[] {
  return events.filter(ev => eventTabOf(ev) === tab);
}
