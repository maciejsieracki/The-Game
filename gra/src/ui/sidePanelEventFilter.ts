/**
 * sidePanelEventFilter.ts
 * R-WEB-UI-NOTIFICATIONS-3-TABS-PRUNE-Q1 — czysty filtr wpisów informacyjnych panelu
 * WYDARZENIA wg aktywnej zakładki (Dyplomacja / Ważne / Inne). Zastępuje dawny filtr chipa
 * „🌍 Inne cyw.”. Wydzielony z sidePanelHud.ts, bo ten plik ma zero importów niebundlowalnych
 * w czystym esbuild (testy UI bundlują samą logikę, bez stubowania ikon).
 */
import type { SidePanelEvent } from './sidePanelHud';
import { defaultSidePanelTab, eventTabOf, type SidePanelTab } from './sidePanelEventTabs';
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

/**
 * Zdarzenia zasilające LICZNIKI i LISTĘ zakładek (R-WEB-UI-NOTIF-DIPLO-TAB-COUNT-BLOCKING-Q1):
 * wszystkie wpisy informacyjne oraz blokujące propozycje dyplomacji (`kind:'diplo'`, np. propozycja
 * pokoju od AI). Blokująca karta dyplomacji jest KOPIĄ oznaczoną `blocking:false`, więc zakładka
 * „Dyplomacja” pokazuje ją jako zwykłą kartę, a licznik zgadza się z listą po kliknięciu. Oryginał
 * nadal renderuje się nad zakładkami jako „wymaga decyzji” (decyzja gracza nie jest ukrywana).
 * Pozostałe blokujące wpisy (np. kind enemy) pomijane — zostają wyłącznie w „wymaga decyzji”.
 * Kopia nosi `tabMirror:true`: nie ma „✕” ani Escape (zamknięcie zostaje wyłącznie na karcie blokującej).
 * Kolejność wejściowa zachowana.
 */
export function tabSourceEventsOf(events: readonly SidePanelEvent[]): SidePanelEvent[] {
  const out: SidePanelEvent[] = [];
  for (const ev of events) {
    if (ev.blocking !== true) out.push(ev);
    else if (ev.kind === 'diplo') out.push({ ...ev, blocking: false, tabMirror: true });
  }
  return out;
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

/**
 * Model zakładek panelu WYDARZENIA (czysty, bez DOM) — ten sam rachunek, którego używa render()
 * w sidePanelHud.ts, wydzielony żeby test mógł sprawdzić okablowanie, a nie tylko helpery.
 * R-WEB-UI-NOTIF-DIPLO-TAB-COUNT-BLOCKING-Q1.
 *  - blockingEvents: karty blokujące (zawsze nad zakładkami, bez zmian);
 *  - tabSourceEvents: źródło zakładek = informacyjne + kopie blokujących propozycji diplo;
 *  - activeTab: gdy gracz nie wybrał zakładki (`activeTabPicked:false`) → zakładka domyślna
 *    liczona BEZ handlu AI↔AI i BEZ blokujących kart;
 *  - infoEvents: lista aktywnej zakładki; relevantInfo: zakres nagłówka „N informacyjnych”
 *    i „Zamknij wszystkie informacyjne” (sprzed zakładek, bez kopii blokujących).
 */
export function sidePanelTabModelOf(
  events: readonly SidePanelEvent[],
  state: { readonly activeTab: SidePanelTab; readonly activeTabPicked: boolean },
): {
  blockingEvents: SidePanelEvent[];
  allInfoEvents: SidePanelEvent[];
  tabSourceEvents: SidePanelEvent[];
  tabCounts: Record<SidePanelTab, number>;
  activeTab: SidePanelTab;
  infoEvents: SidePanelEvent[];
  relevantInfo: SidePanelEvent[];
  orderedEvents: SidePanelEvent[];
} {
  const blockingEvents = events.filter(ev => ev.blocking === true);
  const allInfoEvents = events.filter(ev => ev.blocking !== true);
  const tabSourceEvents = tabSourceEventsOf(events);
  const tabCounts = tabCountsOf(tabSourceEvents, true);
  const activeTab = state.activeTabPicked
    ? state.activeTab
    : defaultSidePanelTab(tabCountsOf(allInfoEvents, false));
  const infoEvents = filterSidePanelEventsByTab(tabSourceEvents, activeTab);
  const relevantInfo = relevantInfoEvents(allInfoEvents, activeTab);
  return {
    blockingEvents,
    allInfoEvents,
    tabSourceEvents,
    tabCounts,
    activeTab,
    infoEvents,
    relevantInfo,
    orderedEvents: [...blockingEvents, ...infoEvents],
  };
}
