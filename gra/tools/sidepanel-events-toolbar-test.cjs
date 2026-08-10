'use strict';
/**
 * sidepanel-events-toolbar-test.cjs
 *
 * R-WYDARZENIA-FILTR-KATEGORII — Evaluator PASS-WITH-NOTES, nota blokująca N2: brak testu
 * warstwy UI (przełącznik 🌍 „Inne cyw." + przycisk „Usuń wszystkie"). Wzorzec bramki:
 * tools/army-merge-dismiss-bounce-test.cjs (esbuild -> cjs bundle w node18 + jsdom,
 * stub icons/brandAssets bo ten moduł robi Vite-owe `*.svg?raw` + `import.meta.glob(...)`,
 * których goły esbuild bez dodatkowego loadera nie obsługuje).
 *
 * POKRYCIE:
 *  (a) domyślnie przełącznik wyłączony -> wpisy origin:'other-civs' ukryte w DOM
 *  (b) klik przełącznika -> pokazuje wpisy origin:'other-civs'
 *  (c) klik "Usuń wszystkie" -> faktycznie usuwa wszystkie karty z DOM
 *  (d) N1 (dismiss eot-hint- / era- musi przetrwać reset końca tury) -- na poziomie
 *      czystej funkcji dismissEotOrEraWarLogEntry (game/eot-event-defer.ts), bo pełny
 *      cykl end-of-turn main.ts (17+ tys. linii, monolityczny bootstrap) nie da się
 *      zbundlować do tego harnessu (ten sam ograniczenie uczciwie przyznane co w
 *      tools/army-merge-dismiss-bounce-test.cjs i tools/danina-podatek-tooltip-ui-test.cjs).
 *      Test SYMULUJE dokładnie main.ts: dismiss -> reset dismissedSidePanelEventIds na
 *      końcu tury (main.ts `dismissedSidePanelEventIds.clear()` w sekwencji EOT) ->
 *      rekonstrukcja widocznej listy z warEventLog (main.ts `collectTurnEvents`, wzór
 *      `.filter(e => !dismissedSidePanelEventIds.has(e.id))`) -- używając NAPRAWDĘ
 *      zbundlowanej `dismissEotOrEraWarLogEntry`, więc regresja N1 (cofnięcie fixu w
 *      eot-event-defer.ts) łapie się czerwono, nie tylko kosmetycznie.
 *
 * DOWÓD MUTACYJNY (na końcu pliku, komentarz): trzy regresje ręcznie wprowadzone i
 * potwierdzone czerwono, potem cofnięte -- patrz raport Operatora.
 *
 * Usage (z gra/): node tools/sidepanel-events-toolbar-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let JSDOM;
try { ({ JSDOM } = require('jsdom')); }
catch (e) {
  console.error('[sidepanel-events-toolbar-test] jsdom missing — npm i -D jsdom');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const STUB_DIR = path.resolve(__dirname, '.stubs');
// P-BRAMKA-STUB-KOLIZJA-WSPOLDZIELONY: nazwa własna dla tej bramki (wzorem
// army-merge-brandAssets-stub.ts / danina-podatek-brandAssets-stub.ts), nie
// współdzielony tools/.stubs/brandAssets-stub.ts.
const STUB_FILE = path.resolve(STUB_DIR, 'sidepanel-events-toolbar-brandAssets-stub.ts');
const ENTRY = path.join(__dirname, '.sidepanel-events-toolbar-entry.ts');
const BUNDLE = path.join(__dirname, '.sidepanel-events-toolbar-bundle.cjs');

fs.mkdirSync(STUB_DIR, { recursive: true });
// sidePanelHud.ts -> icons/brandAssets.ts robi Vite-owy `import X from '*.svg?raw'` +
// `import.meta.glob(...)` -- esbuild w trybie node/cjs tego nie obsługuje, a wygląd
// ikon jest tu bez znaczenia (test asercjonuje DOM/logikę toolbaru, nie SVG), więc
// podmieniamy moduł na lekki stub z pełnym zestawem eksportów (zweryfikowane esbuildem,
// że to jedyny niebundlowalny import na ścieżce createSidePanelHud).
fs.writeFileSync(
  STUB_FILE,
  [
    "export function brandIconSvg(_id, _size) { return ''; }",
    "export function improvementIconSvg(_key, _size) { return ''; }",
    "export function mapResourceIconSvg(_key, _size) { return ''; }",
    "export function terrainIconSvg(_key, _size) { return ''; }",
    "export function buildingIconSvg(_def, _id) { return ''; }",
    "export function unitIconSvg(_u, _id) { return ''; }",
    "export function civIconSvg(_id, _size) { return ''; }",
    "export function epochIconSvg(_id, _size) { return ''; }",
    "export function settingIconSvg(_key, _size) { return ''; }",
    "export function brandMenuComponentsCss() { return ''; }",
    "export function menuIconSvg(_id, _size) { return ''; }",
    "export function brandMenuEmblemSvg() { return ''; }",
    "export function newGameIntroEmblemSvg(_size) { return ''; }",
    "export function brandMotionCss() { return ''; }",
    "export function brandMenuBackgroundCss() { return ''; }",
    "export function svgThumbHtml(_svg) { return ''; }",
    '',
  ].join('\n'),
  'utf8',
);

fs.writeFileSync(
  ENTRY,
  [
    "export { createSidePanelHud } from '../src/ui/sidePanelHud.ts';",
    "export { filterSidePanelEvents } from '../src/ui/sidePanelEventFilter.ts';",
    "export { dismissEotOrEraWarLogEntry, deferredHintsToSidePanelEvents } from '../src/game/eot-event-defer.ts';",
  ].join('\n'),
  'utf8',
);

const stubBrandAssetsPlugin = {
  name: 'stub-brand-assets',
  setup(build) {
    build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: STUB_FILE }));
  },
};

async function main() {
  try {
    await esbuild.build({
      entryPoints: [ENTRY],
      bundle: true,
      platform: 'node',
      format: 'cjs',
      target: 'node18',
      outfile: BUNDLE,
      absWorkingDir: GRA,
      plugins: [stubBrandAssetsPlugin],
      logLevel: 'silent',
    });
  } catch (e) {
    console.error('[sidepanel-events-toolbar-test] esbuild failed:', e.message || e);
    process.exit(1);
  }

  const {
    createSidePanelHud,
    filterSidePanelEvents,
    dismissEotOrEraWarLogEntry,
    deferredHintsToSidePanelEvents,
  } = require(BUNDLE);

  const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>');
  global.document = dom.window.document;
  global.window = dom.window;
  global.HTMLElement = dom.window.HTMLElement;
  global.MouseEvent = dom.window.MouseEvent;
  global.KeyboardEvent = dom.window.KeyboardEvent;

  let pass = 0;
  let fail = 0;
  function assert(cond, msg) {
    if (cond) { pass++; console.log('  [OK]', msg); }
    else { fail++; console.error('  [FAIL]', msg); }
  }

  console.log('sidepanel-events-toolbar-test (R-WYDARZENIA-FILTR-KATEGORII, N1+N2)\n');

  // -------------------------------------------------------------------------
  // Wspolne dane: 2 wydarzenia "nasze" + 1 wydarzenie handlu AI-AI (origin:'other-civs',
  // dokladnie tak jak je produkuje deferredHintsToSidePanelEvents dla komunikatu
  // zawierajacego wzorzec " handluje z ").
  // -------------------------------------------------------------------------
  function buildEvents() {
    const aiTrade = deferredHintsToSidePanelEvents(
      [{ msg: 'Rzym handluje z Egiptem (Zelazo)', durationMs: 4000 }],
      7,
    )[0];
    return [
      { id: 'war-7-1-0', icon: '⚔', title: 'Wypowiedzielismy wojne: Egipt', kind: 'enemy' },
      { id: 'prod-empty-city0', icon: '⚙', title: 'Produkcja: Rzym', kind: 'city' },
      aiTrade,
    ];
  }

  assert(
    buildEvents()[2].origin === 'other-civs' && buildEvents()[2].title === 'Dyplomacja',
    'deferredHintsToSidePanelEvents oznacza handel AI-AI jako origin:other-civs + tytul "Dyplomacja"',
  );

  // -------------------------------------------------------------------------
  // SCENARIUSZ (a)+(b): domyslnie przelacznik WYLACZONY -> wpis other-civs ukryty w DOM;
  // klik chipa -> pokazuje go.
  // -------------------------------------------------------------------------
  {
    let events = buildEvents();
    let dismissAllCalls = 0;

    const api = createSidePanelHud({
      getEvents: () => events,
      onEventDismiss: (id) => { events = events.filter(e => e.id !== id); },
      onDismissAll: () => { dismissAllCalls++; events = []; },
    });
    document.body.appendChild(api.el);

    const cardsInitial = api.el.querySelectorAll('.sp-event[data-id]');
    assert(cardsInitial.length === 2, '(a) domyslnie widoczne 2/3 karty (war-, prod-empty-), got ' + cardsInitial.length);
    assert(
      api.el.querySelector('.sp-event[data-id="war-7-1-0"]') != null
        && api.el.querySelector('.sp-event[data-id="prod-empty-city0"]') != null,
      '(a) widoczne sa dokladnie te dwie "nasze" karty',
    );
    assert(
      [...cardsInitial].every(c => c.getAttribute('data-id').indexOf('eot-hint-') !== 0),
      '(a) karta handlu AI-AI (eot-hint-*, origin:other-civs) NIE jest w DOM domyslnie',
    );

    const toggleChip = api.el.querySelector('[data-sp-toggle-other-civs]');
    assert(toggleChip != null, '(a) chip przelacznika "Inne cyw." istnieje w DOM');
    assert(
      !toggleChip.classList.contains('sp-toolbar-chip-active'),
      '(a) chip domyslnie NIE ma klasy active (wizualnie wylaczony)',
    );

    toggleChip.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));

    const cardsAfterToggle = api.el.querySelectorAll('.sp-event[data-id]');
    assert(cardsAfterToggle.length === 3, '(b) po kliku przelacznika widoczne WSZYSTKIE 3 karty, got ' + cardsAfterToggle.length);
    assert(
      [...cardsAfterToggle].some(c => c.getAttribute('data-id').indexOf('eot-hint-') === 0),
      '(b) karta handlu AI-AI jest teraz w DOM',
    );
    const toggleChipAfter = api.el.querySelector('[data-sp-toggle-other-civs]');
    assert(
      toggleChipAfter.classList.contains('sp-toolbar-chip-active'),
      '(b) chip ma teraz klase active',
    );

    api.destroy();
  }

  // -------------------------------------------------------------------------
  // SCENARIUSZ (c): "Usun wszystkie" faktycznie usuwa wszystkie karty z DOM (rowniez
  // te ukryte chipem -- main.ts clearAllSidePanelEvents dziala na NIEfiltrowanej liscie,
  // co jest zamierzone; test odzwierciedla to samo onDismissAll => events=[]).
  // -------------------------------------------------------------------------
  {
    let events = buildEvents();
    const api = createSidePanelHud({
      getEvents: () => events,
      onEventDismiss: (id) => { events = events.filter(e => e.id !== id); },
      onDismissAll: () => { events = []; },
    });
    document.body.appendChild(api.el);

    assert(
      api.el.querySelectorAll('.sp-event[data-id]').length === 2,
      '(c) przed "Usun wszystkie": 2 widoczne karty',
    );

    const dismissAllBtn = api.el.querySelector('[data-sp-dismiss-all]');
    assert(dismissAllBtn != null, '(c) przycisk "Usun wszystkie" istnieje w DOM (onDismissAll podany w configu)');

    if (dismissAllBtn != null) {
      dismissAllBtn.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
    }

    assert(
      dismissAllBtn != null && api.el.querySelectorAll('.sp-event[data-id]').length === 0,
      '(c) po "Usun wszystkie": 0 kart w DOM',
    );
    assert(
      dismissAllBtn != null && api.el.querySelector('.sp-placeholder') != null,
      '(c) placeholder "Brak wydarzen w tej turze" widoczny po wyczyszczeniu',
    );

    api.destroy();
  }

  // -------------------------------------------------------------------------
  // SCENARIUSZ: brak onDismissAll w configu -> przycisk NIE renderuje sie (nie psuje
  // istniejacych wywolan createSidePanelHud, ktore configu jeszcze nie podaja).
  // -------------------------------------------------------------------------
  {
    let events = buildEvents();
    const api = createSidePanelHud({ getEvents: () => events });
    document.body.appendChild(api.el);
    assert(
      api.el.querySelector('[data-sp-dismiss-all]') == null,
      'brak onDismissAll w configu -> przycisk "Usun wszystkie" nie istnieje w DOM (wsteczna zgodnosc)',
    );
    assert(
      api.el.querySelector('[data-sp-toggle-other-civs]') != null,
      'chip przelacznika istnieje niezaleznie od onDismissAll',
    );
    api.destroy();
  }

  // -------------------------------------------------------------------------
  // SCENARIUSZ (d) -- N1: dismiss wpisu eot-hint-*/era-* MUSI przetrwac reset konca tury.
  // Odtwarza DOSLOWNIE main.ts:
  //   handleSidePanelEventDismiss(id):
  //     dismissEotOrEraWarLogEntry(warEventLog, id) -> true => usuniete TRWALE
  //     w przeciwnym razie: dismissedSidePanelEventIds.add(id) (miekkie, do konca tury)
  //   koniec tury: dismissedSidePanelEventIds.clear()  (main.ts, sekwencja EOT)
  //   collectTurnEvents(): [...warEventLog, ...].filter(e => !dismissedSidePanelEventIds.has(e.id))
  // -------------------------------------------------------------------------
  {
    const warEventLog = deferredHintsToSidePanelEvents(
      [{ msg: 'Rzym handluje z Egiptem (Zelazo)', durationMs: 4000 }],
      12,
    );
    const eraEntry = { id: 'era-13-2', icon: '🏛', title: 'Nowa epoka', kind: 'science' };
    warEventLog.unshift(eraEntry);
    const dismissedSidePanelEventIds = new Set();

    function collectVisible() {
      return warEventLog.filter(e => !dismissedSidePanelEventIds.has(e.id));
    }

    function handleDismiss(id) {
      if (dismissEotOrEraWarLogEntry(warEventLog, id)) return;
      dismissedSidePanelEventIds.add(id);
    }

    function endOfTurnReset() {
      dismissedSidePanelEventIds.clear();
    }

    assert(collectVisible().length === 2, '(d) przed dismissem: 2 wpisy widoczne (era- + eot-hint-)');

    const eotHintId = warEventLog.find(e => e.id.indexOf('eot-hint-') === 0).id;
    handleDismiss(eotHintId);
    handleDismiss(eraEntry.id);

    assert(collectVisible().length === 0, '(d) zaraz po dismissie: 0 widocznych (oba usuniete)');
    assert(warEventLog.length === 0, '(d) oba wpisy USUNIETE TRWALE z warEventLog (nie tylko miekko ukryte)');

    // Kilka kolejnych "koncow tury" -- regresja N1 wracala wpis dokladnie w tym momencie.
    endOfTurnReset();
    endOfTurnReset();

    assert(
      collectVisible().length === 0,
      '(d) N1: PO resecie konca tury (wielokrotnym) wpisy NIE wracaja -- 0 widocznych, got ' + collectVisible().length,
    );
  }

  console.log('\nsidepanel-events-toolbar-test: ' + pass + ' pass, ' + fail + ' fail');

  try { fs.unlinkSync(ENTRY); } catch (_) { /* noop */ }

  process.exit(fail > 0 ? 1 : 0);
}

main();

/**
 * DOWOD MUTACYJNY (uruchomiony recznie przez Operatora, patrz raport koncowy):
 *  1. showOtherCivsEvents na sztywno `false` (usunieta mozliwosc togglea w sidePanelHud.ts)
 *     -> scenariusz (b) czerwony (asercja "po kliku przelacznika widoczne WSZYSTKIE 3").
 *  2. onDismissAll usuniete z configu w tescie (c) (podmiana na undefined)
 *     -> scenariusz "brak onDismissAll -> przycisk nie istnieje" I scenariusz (c) oba
 *     lapia regresje (przycisk nie renderuje sie / nie da sie kliknac).
 *  3. cofnieta naprawa N1 w game/eot-event-defer.ts (dismissEotOrEraWarLogEntry zwraca
 *     zawsze false) -> scenariusz (d) czerwony (wpisy wracaja po endOfTurnReset()).
 * Wszystkie trzy potwierdzone czerwono, potem przywrocone -- patrz raport.
 */
