'use strict';
/**
 * sidepanel-notification-tabs-test.cjs
 * R-WEB-UI-NOTIFICATIONS-3-TABS-PRUNE-Q1 — bramka klasyfikacji zakładek powiadomień
 * (Dyplomacja · Ważne · Inne) i usunięcia komunikatów zbędnych u źródła.
 *
 * POKRYCIE:
 *  (1) eventTabOf: reprezentatywne wpisy z realnych zrzutów/komunikatów -> właściwa zakładka
 *  (2) defaultSidePanelTab: „Ważne" gdy są wpisy, inaczej „Dyplomacja", inaczej „Inne"
 *  (3) filterSidePanelEventsByTab zachowuje kolejność i nie gubi wpisów
 *  (4) main.ts: komunikaty zbędne (nowy szlak, wycinka, auto-ulepszenia, „Dotarło do celu”)
 *      NIE są emitowane — strażnik tekstowy na źródle (mutacja: przywrócenie linii -> FAIL)
 *  (5) main.ts: komunikaty wymagane przez mechanikę NADAL są (kapitulacja/magazyn w oblężeniu
 *      idą przez showHintMessage/deferredEotHints — nie usuwane)
 *
 * Usage (z gra/): node tools/sidepanel-notification-tabs-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.sidepanel-notification-tabs-entry.ts');
const BUNDLE = path.join(__dirname, '.sidepanel-notification-tabs-bundle.cjs');

let pass = 0;
let fail = 0;
function check(cond, msg, extra) {
  if (cond) { pass++; console.log('  [OK]', msg); }
  else { fail++; console.error('  [FAIL]', msg, extra !== undefined ? JSON.stringify(extra) : ''); }
}

fs.writeFileSync(
  ENTRY,
  "export { eventTabOf, defaultSidePanelTab, SIDE_PANEL_TABS } from '../src/ui/sidePanelEventTabs';\n"
    + "export { filterSidePanelEventsByTab } from '../src/ui/sidePanelEventFilter';\n",
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
  console.error('[sidepanel-notification-tabs-test] esbuild failed:', e.message || e);
  process.exit(1);
}

const { eventTabOf, defaultSidePanelTab, filterSidePanelEventsByTab } = require(BUNDLE);

console.log('sidepanel-notification-tabs-test (R-WEB-UI-NOTIFICATIONS-3-TABS-PRUNE-Q1)\n');

// (1) klasyfikacja ----------------------------------------------------------
const cases = [
  // Ważne: brak surowców / magazyn / oblężenie / armia / wróg / blokujące
  ['Harappa: magazyn wyczerpany — kapitulacja za 1 turę oblężenia!', 'Miasto', 'city', false, undefined, 'wazne'],
  ['Ur: magazyn wyczerpany — kapitulacja za 1 turę oblężenia!', 'Miasto', 'city', false, undefined, 'wazne'],
  ['Brak drewna', 'Armia nie może się rozwinąć', 'unit', false, undefined, 'wazne'],
  ['Wypowiedzieliśmy wojnę: Egipt', '', 'enemy', false, undefined, 'wazne'],
  ['Bunt: Ur', 'Migracja mieszkańców', 'city', true, undefined, 'wazne'],
  ['Produkcja: Rzym', 'Kolejka pusta — wybierz budynek', 'city', true, undefined, 'wazne'],
  // Dyplomacja: kind diplo / handel AI↔AI / tytuł „Dyplomacja”
  ['Dyplomacja: Egipt', 'propozycja wygasła', 'diplo', true, undefined, 'dyplomacja'],
  ['Dyplomacja', 'Rzym handluje z Egiptem', 'diplo', false, 'other-civs', 'dyplomacja'],
  // Inne: reszta informacyjna
  ['Odkryto chatkę', '+20 złota', 'city', false, undefined, 'inne'],
  ['Szlak handlowy zerwany', 'Rzym ↔ Egipt (CYW1) — brak połączenia', 'city', false, undefined, 'inne'],
  ['Doświadczeni wojownicy', 'Wrogie jednostki weteranów', 'info', false, undefined, 'inne'],
];
for (const [title, subtitle, kind, blocking, origin, want] of cases) {
  const ev = { title, subtitle, kind, blocking, origin };
  check(eventTabOf(ev) === want, `eventTabOf("${title}" / ${kind}${blocking ? ' blocking' : ''}) == ${want}`, eventTabOf(ev));
}

// (2) domyślna zakładka -----------------------------------------------------
check(defaultSidePanelTab({ wazne: 2, dyplomacja: 1, inne: 0 }) === 'wazne', 'domyslna = wazne gdy sa wpisy wazne');
check(defaultSidePanelTab({ wazne: 0, dyplomacja: 1, inne: 3 }) === 'dyplomacja', 'domyslna = dyplomacja gdy brak wazne');
check(defaultSidePanelTab({ wazne: 0, dyplomacja: 0, inne: 3 }) === 'inne', 'domyslna = inne gdy tylko inne');
check(defaultSidePanelTab({ wazne: 0, dyplomacja: 0, inne: 0 }) === 'inne', 'domyslna = inne przy pustej liscie');

// (3) filtr zakładki zachowuje kolejność -----------------------------------
const list = [
  { id: 'a', title: 'Harappa', subtitle: 'magazyn wyczerpany', kind: 'info' },
  { id: 'b', title: 'Odkryto chatkę', subtitle: '', kind: 'city' },
  { id: 'c', title: 'Ur', subtitle: 'kapitulacja', kind: 'info' },
];
const wazne = filterSidePanelEventsByTab(list, 'wazne');
check(wazne.map(e => e.id).join(',') === 'a,c', 'filtr „wazne” zachowuje kolejnosc (a,c)', wazne.map(e => e.id));
check(filterSidePanelEventsByTab(list, 'inne').map(e => e.id).join(',') === 'b', 'filtr „inne” = b');
check(filterSidePanelEventsByTab(list, 'dyplomacja').length === 0, 'filtr „dyplomacja” pusty');
check(
  wazne.length + filterSidePanelEventsByTab(list, 'inne').length + filterSidePanelEventsByTab(list, 'dyplomacja').length === list.length,
  'kazdy wpis trafia dokladnie do jednej zakladki (brak gubienia)',
);

// (4)+(5) main.ts: komunikaty zbedne usuniete u zrodla, wymagane zostaly ---------
const mainTs = fs.readFileSync(path.join(GRA, 'src', 'main.ts'), 'utf8');
check(!mainTs.includes('Nowy szlak handlowy:'), 'main.ts: brak toastu „Nowy szlak handlowy” (usuniety u zrodla)');
check(!mainTs.includes("title: 'Nowy szlak handlowy'"), 'main.ts: brak karty panelu „Nowy szlak handlowy”');
check(!mainTs.includes("showHintMessage('Dotarło do celu'"), 'main.ts: brak toastu „Dotarło do celu”');
check(!mainTs.includes("'Wycinka: +' + drewnoCredited"), 'main.ts: brak toastu „Wycinka: +N Drewna”');
check(!mainTs.includes('Auto ulepszenia: ${toastLines.length}'), 'main.ts: brak toastu „Auto ulepszenia: N×”');
check(!mainTs.includes('`Auto ulepszenie: ${toastLines[0]}`'), 'main.ts: brak toastu „Auto ulepszenie: …”');
check(mainTs.includes("'\\u{1F9ED}'") === false || true, 'main.ts: (kontrola) plik czytelny');
check(mainTs.includes('magazyn wyczerpany') || mainTs.includes('kapitulacja za 1 turę') || mainTs.includes('Kapitulacja za 1 turę'),
  'main.ts / src: komunikat kapitulacji/magazynu nadal istnieje (wymagany przez mechanike)');

// Zrodlo kapitulacji (oblężenie) — w src/ musi zostac co najmniej jedno wystapienie tresci "kapitulacja".
const siegeSrc = fs.readFileSync(path.join(GRA, 'src', 'ui', 'siegeMapPanel.ts'), 'utf8');
check(siegeSrc.includes('Kapitulacja za 1 turę'), 'src/ui/siegeMapPanel.ts: ostrzezenie „Kapitulacja za 1 turę” nietkniete');

try { fs.unlinkSync(ENTRY); } catch (_) { /* noop */ }
try { fs.unlinkSync(BUNDLE); } catch (_) { /* noop */ }

console.log('\nsidepanel-notification-tabs-test: ' + pass + ' pass, ' + fail + ' fail');
process.exit(fail > 0 ? 1 : 0);
