/**
 * sidePanelEventFilter.ts
 * R-WEB-UI-NOTIFICATIONS-3-TABS-PRUNE-Q1 — czysty filtr wpisów informacyjnych panelu
 * WYDARZENIA wg aktywnej zakładki (Dyplomacja / Ważne / Inne). Zastępuje dawny filtr chipa
 * „🌍 Inne cyw.”. Wydzielony z sidePanelHud.ts, bo ten plik ma zero importów niebundlowalnych
 * w czystym esbuild (testy UI bundlują samą logikę, bez stubowania ikon).
 */
import type { SidePanelEvent } from './sidePanelHud';
import { eventTabOf, type SidePanelTab } from './sidePanelEventTabs';
// Uwaga: ten plik NIE importuje sidePanelHud (tylko typ) — bundlowalny w czystym esbuild.

/**
 * Wpis handlu AI↔AI (`origin:'other-civs'`) jest „ukryty”, gdy aktywna zakładka to nie Dyplomacja —
 * odpowiednik dawnego chipa 🌍 „Inne cyw.” w stanie OFF (P-KONIEC-TURY-DYPLOMACJA-MYLACY-NAGLOWEK).
 * Komunikaty gracz↔AI nie mają `origin`, więc nigdy nie są ukryte.
 */
export function isHiddenAiAiEvent(ev: Pick<SidePanelEvent, 'origin'>, activeTab: SidePanelTab): boolean {
  return ev.origin === 'other-civs' && activeTab !== 'dyplomacja';
}

/**
 * Wpisy informacyjne „w grze” dla nagłówka i hurtowego „Zamknij wszystkie informacyjne”:
 * wszystko poza ukrytymi wpisami AI↔AI (zakres sprzed zakładek: tylko to, co gracz mógł zobaczyć).
 */
export function relevantInfoEvents(
  infoEvents: readonly SidePanelEvent[],
  activeTab: SidePanelTab,
): SidePanelEvent[] {
  return infoEvents.filter(ev => !isHiddenAiAiEvent(ev, activeTab));
}

/** Liczniki zakładek. `includeAiAi:false` pomija handel AI↔AI (do wyboru zakładki domyślnej). */
export function tabCountsOf(
  infoEvents: readonly SidePanelEvent[],
  includeAiAi: boolean,
): Record<SidePanelTab, number> {
  const counts: Record<SidePanelTab, number> = { dyplomacja: 0, wazne: 0, inne: 0 };
  for (const ev of infoEvents) {
    if (!includeAiAi && ev.origin === 'other-civs') continue;
    counts[eventTabOf(ev)] += 1;
  }
  return counts;
}

/** Zwraca wpisy należące do zakładki `tab`, w niezmienionej kolejności. */
export function filterSidePanelEventsByTab(
  events: readonly SidePanelEvent[],
  tab: SidePanelTab,
): SidePanelEvent[] {
  return events.filter(ev => eventTabOf(ev) === tab);
}
