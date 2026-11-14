'use strict';
/**
 * notif-diplo-tab-count-blocking-test.cjs
 * R-WEB-UI-NOTIF-DIPLO-TAB-COUNT-BLOCKING-Q1 — licznik zakładki „Dyplomacja” wlicza blokujące
 * propozycje dyplomacji (kind:'diplo', blocking:true), a lista zakładki pokazuje te same karty.
 *
 * POKRYCIE:
 *  (1) blokująca propozycja diplo (np. „Dyplomacja: X Rozpatrz”) zwiększa licznik „Dyplomacja” o 1
 *  (2) ta sama karta występuje na liście zakładki „Dyplomacja” (licznik = to, co gracz zobaczy)
 *  (3) blokujące wpisy nie-diplo (kind enemy) nie zmieniają liczników ani listy zakładek
 *  (4) wpisy informacyjne: liczniki i kolejność bez zmian
 *  (5) oryginalny obiekt blokującej karty nie jest mutowany (nad zakładkami dalej blokuje)
 *  (6) zakładka domyślna nie przełącza się na Dyplomację z powodu blokującej karty diplo
 *      (liczniki domyślnej zakładki liczone na allInfoEvents, jak dotąd)
 *
 * Czerwony na bazie: na 501f78c08 eksport tabSourceEventsOf nie istnieje (błąd ładowania / FAIL).
 *
 * Usage (z gra/): node tools/notif-diplo-tab-count-blocking-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.notif-diplo-tab-count-blocking-entry.ts');
const BUNDLE = path.join(__dirname, '.notif-diplo-tab-count-blocking-bundle.cjs');

let pass = 0;
let fail = 0;
function check(cond, msg, extra) {
  if (cond) { pass++; console.log('  [OK]', msg); }
  else { fail++; console.error('  [FAIL]', msg, extra !== undefined ? JSON.stringify(extra) : ''); }
}

fs.writeFileSync(
  ENTRY,
  "export { eventTabOf, defaultSidePanelTab } from '../src/ui/sidePanelEventTabs';\n"
    + "export { filterSidePanelEventsByTab, tabCountsOf, tabSourceEventsOf, sidePanelTabModelOf } from '../src/ui/sidePanelEventFilter';\n",
);

try {
  esbuild.buildSync({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE,
    absWorkingDir: GRA,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[notif-diplo-tab-count-blocking-test] esbuild failed:', e.message || e);
  process.exit(1);
}

const mod = require(BUNDLE);
const { defaultSidePanelTab, filterSidePanelEventsByTab, tabCountsOf, tabSourceEventsOf, sidePanelTabModelOf } = mod;

console.log('notif-diplo-tab-count-blocking-test (R-WEB-UI-NOTIF-DIPLO-TAB-COUNT-BLOCKING-Q1)\n');

if (typeof tabSourceEventsOf !== 'function' || typeof sidePanelTabModelOf !== 'function') {
  console.error('  [FAIL] tabSourceEventsOf nie jest wyeksportowane z sidePanelEventFilter (baza bez zmiany)');
  console.log(`\nWynik: ${pass} OK, ${fail} FAIL`);
  process.exit(1);
}

const diploBlocking = {
  id: 'diplo-peace-ai-1', title: 'Dyplomacja: Rzym Rozpatrz', subtitle: 'Propozycja pokoju',
  kind: 'diplo', blocking: true, origin: undefined, icon: '🕊',
};
const enemyBlocking = {
  id: 'enemy-1', title: 'Wróg pod miastem', subtitle: undefined,
  kind: 'enemy', blocking: true, origin: undefined, icon: '⚔',
};
const infoDiplo = {
  id: 'info-diplo-1', title: 'Dyplomacja: Egipt wysłał poselstwo', subtitle: undefined,
  kind: 'diplo', blocking: false, origin: undefined, icon: '✉',
};
const infoImportant = {
  id: 'info-imp-1', title: 'Magazyn centralny pusty', subtitle: undefined,
  kind: 'info', blocking: false, origin: undefined, icon: '!',
};
const aiAi = {
  id: 'aiai-1', title: 'Handel', subtitle: 'Inne cywilizacje', kind: 'info', blocking: false,
  origin: 'other-civs', icon: '🌍',
};

// (1)(2) blokująca propozycja diplo — licznik i lista ----------------------
{
  const events = [diploBlocking];
  const source = tabSourceEventsOf(events);
  const counts = tabCountsOf(source, true);
  check(counts.dyplomacja === 1, '(1) blokująca propozycja diplo liczy się do „Dyplomacja” (1)', counts);
  const list = filterSidePanelEventsByTab(source, 'dyplomacja');
  check(list.length === 1 && list[0].id === diploBlocking.id,
    '(2) ta sama karta jest na liście zakładki „Dyplomacja”', list.map(e => e.id));
  check(list.length === counts.dyplomacja, '(2) licznik = liczba kart na liście zakładki', { list: list.length, counts });
  check(list[0].blocking === false, '(2) karta na liście zakładki ma blocking:false (zwykła karta zakładki)');
  const baseCounts = tabCountsOf(events.filter(ev => ev.blocking !== true), true);
  check(baseCounts.dyplomacja === 0, 'baza (bez zmiany): licznik Dyplomacja bez blokującej karty = 0', baseCounts);
}

// (3) blokujące nie-diplo bez zmian -------------------------------------
{
  const events = [enemyBlocking, infoImportant];
  const source = tabSourceEventsOf(events);
  check(source.length === 1 && source[0].id === infoImportant.id,
    '(3) blokujący wpis nie-diplo (enemy) pominięty w źródle zakładek', source.map(e => e.id));
  const counts = tabCountsOf(source, true);
  check(counts.wazne === 1 && counts.dyplomacja === 0 && counts.inne === 0,
    '(3) liczniki bez blokującego nie-diplo (Ważne = 1)', counts);
}

// (4) informacyjne: liczniki i kolejność bez zmian ----------------------
{
  const events = [infoDiplo, enemyBlocking, infoImportant, aiAi, diploBlocking];
  const source = tabSourceEventsOf(events);
  check(source.map(e => e.id).join(',') === 'info-diplo-1,info-imp-1,aiai-1,diplo-peace-ai-1',
    '(4) kolejność źródła zachowana (informacyjne + blokująca diplo na swojej pozycji)', source.map(e => e.id));
  const counts = tabCountsOf(source, true);
  check(counts.dyplomacja === 3 && counts.wazne === 1 && counts.inne === 0,
    '(4) liczniki: Dyplomacja 3 (info diplo + AI↔AI + blokująca), Ważne 1', counts);
  const dipList = filterSidePanelEventsByTab(source, 'dyplomacja').map(e => e.id);
  check(dipList.join(',') === 'info-diplo-1,aiai-1,diplo-peace-ai-1',
    '(4) lista Dyplomacji w oryginalnej kolejności', dipList);
}

// (5) brak mutacji oryginału --------------------------------------------
{
  const before = JSON.stringify(diploBlocking);
  tabSourceEventsOf([diploBlocking]);
  check(JSON.stringify(diploBlocking) === before && diploBlocking.blocking === true,
    '(5) oryginalna blokująca karta nie jest mutowana (nad zakładkami nadal blokuje)');
}

// (6) zakładka domyślna --------------------------------------------------
{
  const allInfo = [diploBlocking].filter(ev => ev.blocking !== true);
  check(defaultSidePanelTab(tabCountsOf(allInfo, false)) === 'inne',
    '(6) sama blokująca propozycja diplo nie przełącza zakładki domyślnej na Dyplomację (-> Inne)');
  const withImportant = [diploBlocking, infoImportant].filter(ev => ev.blocking !== true);
  check(defaultSidePanelTab(tabCountsOf(withImportant, false)) === 'wazne',
    '(6) przy wpisach Ważne zakładka domyślna nadal Ważne');
}

// (7) okablowanie HUD: model zakładek użyty przez render() (sidePanelTabModelOf) ---
{
  const events = [diploBlocking, enemyBlocking, infoDiplo, infoImportant, aiAi];
  const m = sidePanelTabModelOf(events, { activeTab: 'dyplomacja', activeTabPicked: true });
  check(m.tabCounts.dyplomacja === 3 && m.tabCounts.wazne === 1 && m.tabCounts.inne === 0,
    '(7) HUD model: licznik Dyplomacja = info diplo + AI↔AI + blokująca diplo (3), Ważne 1', m.tabCounts);
  check(m.infoEvents.map(e => e.id).join(',') === 'diplo-peace-ai-1,info-diplo-1,aiai-1',
    '(7) HUD model: lista zakładki Dyplomacja zawiera blokującą kartę diplo (kopia)', m.infoEvents.map(e => e.id));
  check(m.infoEvents.length === m.tabCounts.dyplomacja,
    '(7) HUD model: liczba kart na liście = licznik zakładki', { list: m.infoEvents.length, counts: m.tabCounts });
  check(m.blockingEvents.length === 2 && m.blockingEvents[0].id === diploBlocking.id && m.blockingEvents[0].blocking === true,
    '(7) HUD model: oryginał blokującej karty diplo zostaje w blockingEvents (nad zakładkami)', m.blockingEvents.map(e => e.id));
  check(m.relevantInfo.every(e => e.id !== diploBlocking.id),
    '(7) HUD model: nagłówek „informacyjne” i „Zamknij wszystkie” nie zawierają kopii blokującej decyzji', m.relevantInfo.map(e => e.id));
  check(m.orderedEvents.map(e => e.id)[0] === diploBlocking.id && m.orderedEvents[1].id === enemyBlocking.id,
    '(7) HUD model: kolejka renderu = blokujące najpierw (kolejność zachowana)', m.orderedEvents.map(e => e.id));
  // Wyłącznie blokująca propozycja diplo, zakładka niewybrana przez gracza -> domyślna Inne (nie Dyplomacja)
  const onlyDiplo = sidePanelTabModelOf([diploBlocking], { activeTab: 'wazne', activeTabPicked: false });
  check(onlyDiplo.activeTab === 'inne',
    '(7) HUD model: sama blokująca diplo nie przełącza domyślnej zakładki na Dyplomację', onlyDiplo.activeTab);
  check(onlyDiplo.tabCounts.dyplomacja === 1 && onlyDiplo.infoEvents.length === 0,
    '(7) HUD model: przy zakładce Inne lista pusta, licznik Dyplomacja nadal 1', { c: onlyDiplo.tabCounts, n: onlyDiplo.infoEvents.length });
  // Zakładka wybrana przez gracza nie jest nadpisywana
  const picked = sidePanelTabModelOf([infoImportant], { activeTab: 'inne', activeTabPicked: true });
  check(picked.activeTab === 'inne', '(7) HUD model: wybrana przez gracza zakładka zostaje');
}

// (8) kopia blokującej diplo oznaczona tabMirror (bez ✕ / Escape w renderze) ---
{
  const src = tabSourceEventsOf([diploBlocking, enemyBlocking, infoDiplo]);
  const mirror = src.find(e => e.id === diploBlocking.id);
  check(mirror && mirror.tabMirror === true && mirror.blocking === false,
    '(8) kopia blokującej diplo ma tabMirror:true i blocking:false', mirror);
  check(src.filter(e => e.id !== diploBlocking.id).every(e => e.tabMirror === undefined),
    '(8) zwykłe wpisy informacyjne nie dostają tabMirror', src.map(e => [e.id, e.tabMirror]));
  check(diploBlocking.tabMirror === undefined && diploBlocking.blocking === true,
    '(8) oryginał blokującej karty nie dostaje tabMirror (zostaje z ✕ i Escape-wykluczeniem)');
}

console.log(`\nWynik: ${pass} OK, ${fail} FAIL`);
process.exit(fail === 0 ? 0 : 1);
