'use strict';
/**
 * measure-close-modals.cjs -- R-WEB-MEASURE-STALL-T72-T80-Q1: pomocnicze narzedzia POMIARU (nie zmiana gry).
 *
 * 1) attachEndTurnBlockLog(page, log): zapisuje do dziennika biegu powody, dla ktorych gra blokuje „Zakoncz ture”
 *    (console.warn `[EndTurn] blocked: ...` z canPlayerInitiateEndTurn w main.ts). Runner dotad lapal tylko console.error,
 *    wiec przy cannot-end bez widocznego okna powod byl niewidoczny. Duplikaty z rzedu sa pomijane (HUD woła canEnd często).
 *
 * 2) Selektory zamkniecia karty technologii (#civ-tech-discovery-notice-host): aktualna karta (techDiscoveryNotice.ts,
 *    showTechDiscoveryNoticeViaEntityCard) ma przycisk ✕ z klasa `.tdn-entity-close` i NIE ma `data-act="close"`
 *    (ten atrybut ma tylko przestarzala sciezka _legacyShowTechDiscoveryNotice). Dla satelitarnej karty bocznej
 *    (`.tdn-side-card`) zamykana jest najpierw ona, jak gracz. Uzywane w closeModalsInPage (ai-economy-measure-run.cjs).
 */

/** Zamkniecie karty bocznej (satelity) -- najpierw, zeby glowna karta technologii zostala ta sama co u gracza. */
const TECH_SIDE_CLOSE_SEL = '.tdn-side-card .tdn-entity-close';
/** Zamkniecie glownej karty technologii: wariant aktualny (`.tdn-entity-close`) i legacy (`data-act="close"`). */
const TECH_MAIN_CLOSE_SEL = '[data-act="close"], .tdn-entity-close';

/**
 * Podpina nasluch console.warn `[EndTurn] blocked` na stronie. `log(kind, msg)` = zapis do dziennika biegu.
 * Zwraca funkcje odlaczajaca nic nie robi (console listenery w Playwright zyja do zamkniecia strony).
 */
function attachEndTurnBlockLog(page, log) {
  let last = null;
  page.on('console', m => {
    if (m.type() !== 'warning') return;
    const text = m.text();
    if (!/^\[EndTurn\] blocked/.test(text)) return;
    if (text === last) return;
    last = text;
    log('endturn-blocked', text);
  });
}

module.exports = { attachEndTurnBlockLog, TECH_SIDE_CLOSE_SEL, TECH_MAIN_CLOSE_SEL };
