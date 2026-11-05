/**
 * sidePanelEventTabs.ts
 * R-WEB-UI-NOTIFICATIONS-3-TABS-PRUNE-Q1 — jedno miejsce klasyfikacji wpisów informacyjnych
 * panelu WYDARZENIA do trzech zakładek: Dyplomacja · Ważne · Inne.
 * Zastępuje dawny chip „🌍 Inne cyw.” (filtr origin === 'other-civs').
 *
 * Kolejność reguł ma znaczenie (pierwsza pasująca wygrywa):
 *  1. dyplomacja — kind 'diplo', origin 'other-civs' (handel AI↔AI) albo tytuł „Dyplomacja”;
 *  2. ważne      — karta blokująca / kind 'enemy' (armia, wróg) / treść o brakach, magazynie,
 *                  oblężeniu, kapitulacji, głodzie, buncie, stratach;
 *  3. inne       — reszta.
 * Komunikaty zbędne (nowy szlak, wycinka, auto-ulepszenia, „Dotarło do celu”) NIE trafiają tu
 * wcale — są usunięte u źródła w main.ts.
 * EN: single classification point for informational panel entries; first matching rule wins.
 */
import type { SidePanelEvent } from './sidePanelHud';

export type SidePanelTab = 'dyplomacja' | 'wazne' | 'inne';

export const SIDE_PANEL_TABS: readonly SidePanelTab[] = ['dyplomacja', 'wazne', 'inne'];

export const SIDE_PANEL_TAB_LABELS: Readonly<Record<SidePanelTab, string>> = {
  dyplomacja: 'Dyplomacja',
  wazne: 'Ważne',
  inne: 'Inne',
};

/** Słowa-klucze „coś złego / wymaga reakcji” (brak surowca, magazyn, oblężenie, armia, strata). */
const IMPORTANT_TEXT_RE = new RegExp(
  [
    'magazyn', 'kapitulac', 'oblęż', 'oblez', 'głod', 'glod', 'brakuj', 'brak zasob', 'brak wystarcz',
    'brak surow', 'brak żywn', 'brak zywn', 'brak drewn', 'brak zło', 'brak zlo', 'brak kamien',
    'brak żelaz', 'brak zboż', 'deficyt', 'niedob',
    'zagroż', 'zagroz', 'atak', 'straty', 'strat ', 'armi', 'armia', 'bunt', 'utrat', 'wyczerp',
    'zniszcz', 'wojn', 'dezert', 'eliminac', 'zdobyt', 'zdobywa',
  ].join('|'),
  'i',
);

/** Przypisuje wpis informacyjny do zakładki. Czysta funkcja (bez DOM, bez stanu). */
export function eventTabOf(
  ev: Pick<SidePanelEvent, 'title' | 'subtitle' | 'kind' | 'blocking' | 'origin'>,
): SidePanelTab {
  if (ev.kind === 'diplo' || ev.origin === 'other-civs' || ev.title.startsWith('Dyplomacja')) {
    return 'dyplomacja';
  }
  if (ev.blocking === true || ev.kind === 'enemy') return 'wazne';
  if (IMPORTANT_TEXT_RE.test(ev.title + ' ' + (ev.subtitle ?? ''))) return 'wazne';
  return 'inne';
}

/** Zakładka domyślna: „Ważne” gdy są wpisy, inaczej „Dyplomacja”, inaczej „Inne”. */
export function defaultSidePanelTab(counts: Readonly<Record<SidePanelTab, number>>): SidePanelTab {
  if (counts.wazne > 0) return 'wazne';
  if (counts.dyplomacja > 0) return 'dyplomacja';
  return 'inne';
}
