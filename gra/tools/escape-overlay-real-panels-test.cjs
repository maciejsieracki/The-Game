'use strict';
/**
 * escape-overlay-real-panels-test.cjs — P-MENU-ESCAPE-NIEPELNOEKRANOWE, FAIL #1 z werdyktu
 * Evaluatora dla 4fc770ee (Maciej 2026-08-14, `dyspozycje/PYTANIA-OTWARTE.md`).
 *
 * Problem naprawiany tu: `escape-overlay-stack-test.cjs` (rozszerzony w 4fc770ee) testuje
 * WYŁĄCZNIE `escapeOverlayStack.ts` samo w sobie — dopisane „+4 nowe ID" to stringi w tablicy,
 * po której pętla woła `pushOverlay(id, ...)` WŁASNYM callbackiem, nie kodem żadnego panelu.
 * Evaluator dowiódł, że cofnięcie WSZYSTKICH 4 poprawek panelu nadal daje 100% zielone testy —
 * podręcznikowa tautologia testowa (test odtwarza formułę zamiast importować prawdziwy kod).
 *
 * Ten test IMPORTUJE (esbuild, bez pełnego DOM przeglądarki — jsdom) prawdziwe moduły paneli
 * i woła ich prawdziwe funkcje `show*()`/`hide*()` — nie duplikat listy stringów. Sprawdza, że
 * KAŻDY z 8 paneli dziś wpiętych w escapeOverlayStack (4 z 4fc770ee + 4 z tej naprawy: FAIL #3
 * `improvementBuildConfirm.ts` i FAIL #4 trzy toasty) faktycznie woła `pushOverlay`/`popOverlay`
 * z właściwym id, że Escape (`_dispatchEscapeForTest`) go zamyka, i — jako rozstrzygający dowód,
 * nie tylko twierdzenie — że cofnięcie `pushOverlay(...)` w źródle RZECZYWIŚCIE psuje ten test
 * na czerwono (sekcja D, mutacja przez podmianę treści pliku w pamięci esbuild — bez dotykania
 * dysku).
 *
 * / EN: this test IMPORTS (esbuild, no full browser DOM — jsdom) the real panel modules and
 * calls their real `show*()`/`hide*()` functions — not a duplicated string list. Verifies that
 * each of the 8 panels now wired into escapeOverlayStack actually calls `pushOverlay`/
 * `popOverlay` with the right id, that Escape closes it, and — as a decisive proof, not just a
 * claim — that reverting `pushOverlay(...)` in the source actually turns this test red (section
 * D, via an in-memory esbuild content swap — the real file on disk is never touched).
 *
 * Run from gra/:  node tools/escape-overlay-real-panels-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const { JSDOM } = require(path.resolve(__dirname, '..', 'node_modules', 'jsdom'));

const GRA_ROOT = path.resolve(__dirname, '..');
const BRAND_STUB = path.resolve(__dirname, '.stubs', 'brandAssets-escape-real-panels-stub.ts');

const brandAssetsStubPlugin = {
  name: 'stub-brand-assets',
  setup(build) {
    build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_STUB }));
  },
};

let pass = 0;
let fail = 0;
function assert(cond, msg) {
  if (cond) { pass++; return; }
  fail++;
  console.error('FAIL:', msg);
}

// jsdom raz dla całego procesu — wszystkie panele piszą do document.body, nic nie trzyma stanu
// między sekcjami poza samym escapeOverlayStack (resetowanym jawnie przed każdym scenariuszem).
// Uwaga: NIE nadpisujemy global.navigator -- Node 22+ ma wbudowany globalny `navigator`
// (tylko-do-odczytu, bez .keyboard), więc `escapeOverlayStack.ts` (który czyta
// `navigator.keyboard` leniwie) po prostu nie znajdzie Keyboard Lock API i pominie blokadę --
// bez znaczenia dla tego testu, który sprawdza wyłącznie push/pop stosu, nie fullscreen (to
// pokrywa escape-fullscreen-priority-test.cjs z własnym mockiem `navigator.keyboard`).
// / EN: we do NOT override global.navigator -- Node 22+ has a built-in global `navigator`
// (read-only, no .keyboard), so escapeOverlayStack.ts (which reads `navigator.keyboard`
// lazily) simply won't find the Keyboard Lock API and skips the lock -- irrelevant to this
// test, which only checks stack push/pop, not fullscreen (covered by
// escape-fullscreen-priority-test.cjs with its own `navigator.keyboard` mock).
const dom = new JSDOM('<!doctype html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;

async function buildBundle(entryContents, outfile, extraPlugins) {
  const entryFile = outfile.replace(/\.cjs$/, '-entry.ts');
  fs.writeFileSync(entryFile, entryContents, 'utf8');
  await esbuild.build({
    entryPoints: [entryFile],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    loader: { '.json': 'json' },
    outfile,
    absWorkingDir: GRA_ROOT,
    logLevel: 'silent',
    plugins: [brandAssetsStubPlugin, ...(extraPlugins || [])],
  });
  delete require.cache[require.resolve(outfile)];
  return require(outfile);
}

async function main() {
  // ==========================================================================================
  // A. Bundle "prawdziwy" — wszystkie 8 paneli + prawdziwy escapeOverlayStack, bez żadnej
  //    mutacji. Jeden bundle, żeby wszystkie moduły dzieliły TĘ SAMĄ instancję stosu (moduł-
  //    singleton escapeOverlayStack.ts).
  // ==========================================================================================
  const REAL_BUNDLE = path.resolve(__dirname, '.escape-real-panels-bundle.cjs');
  const M = await buildBundle(
    `export { showGamePauseMenu, hideGamePauseMenu, configureGamePauseMenu } from '../src/ui/gamePauseMenu';
export { showEmpireDetailPanel, hideEmpireDetailPanel } from '../src/ui/empireDetailPanel';
export { showCultureOverlay, showReligionOverlay, hideEmpireOverlay } from '../src/ui/empireOverlayHud';
export { showPowerOverlay, hidePowerOverlay } from '../src/ui/powerOverlayHud';
export { showImprovementBuildConfirmModal } from '../src/ui/improvementBuildConfirm';
export { showCivElimNotice, hideCivElimNotice } from '../src/ui/civElimNotice';
export { showTriumphCityStateNotice, hideTriumphCityStateNotice } from '../src/ui/triumphCityStateNotice';
export { showWonderCompletedNotice, hideWonderCompletedNotice } from '../src/ui/wonderCompletedNotice';
export {
  pushOverlay, popOverlay, top,
  _resetEscapeOverlayStackForTest, _getEscapeOverlayStackDepthForTest, _dispatchEscapeForTest,
} from '../src/ui/escapeOverlayStack';
`,
    REAL_BUNDLE,
  );

  // ==========================================================================================
  // B. Każdy z 8 paneli: prawdziwy show*() musi wołać pushOverlay z właściwym id; Escape
  //    (_dispatchEscapeForTest, czyli dokładnie ten kod, który document.keydown wywołuje w
  //    grze) musi go zamknąć i zdjąć ze stosu. Dane wejściowe — minimalny poprawny kształt wg
  //    interfejsów modułów (empireDetailPanel testowany BEZ mount — render()/renderHeader()
  //    mają jawny strażnik `getSnap === null` i wtedy wracają natychmiast, więc pushOverlay
  //    wykonuje się bez potrzeby fałszowania całego silnika ekonomii).
  // ==========================================================================================
  console.log('\n-- B. 8 prawdziwych paneli: show*() -> pushOverlay -> Escape -> popOverlay --');

  function testPanel(label, expectedId, openFn, { onCloseSpy } = {}) {
    M._resetEscapeOverlayStackForTest();
    openFn();
    assert(M.top()?.id === expectedId, `${label}: show*() woła pushOverlay('${expectedId}', ...) -- top().id`);
    assert(M._getEscapeOverlayStackDepthForTest() === 1, `${label}: stos ma dokładnie 1 wpis po otwarciu`);
    M._dispatchEscapeForTest();
    assert(M._getEscapeOverlayStackDepthForTest() === 0, `${label}: Escape zdejmuje wpis (popOverlay wywołane)`);
    if (onCloseSpy) assert(onCloseSpy.called, `${label}: Escape faktycznie zamknął panel (onClose/hide-side-effect wykonany)`);
  }

  {
    let resumed = false;
    M._resetEscapeOverlayStackForTest();
    M.configureGamePauseMenu({
      onResume: () => { resumed = true; }, onSave: () => {}, onLoad: () => {}, onNewGame: () => {}, onMainMenu: () => {},
    });
    testPanel('gamePauseMenu', 'game-pause-menu', () => M.showGamePauseMenu(), { onCloseSpy: { get called() { return resumed; } } });
  }

  testPanel('empireDetailPanel', 'empire-detail-panel', () => M.showEmpireDetailPanel());

  {
    const spy = { called: false };
    testPanel('empireOverlayHud (Kultura)', 'empire-overlay',
      () => M.showCultureOverlay({ kulturaTotal: 0, kulturaRate: 0, cityCount: 0, cities: [] }, () => { spy.called = true; }),
      { onCloseSpy: spy });
  }

  {
    const spy = { called: false };
    testPanel('empireOverlayHud (Religia)', 'empire-overlay',
      () => M.showReligionOverlay({ stateReligion: 'x', cityCount: 0, cities: [] }, () => { spy.called = true; }),
      { onCloseSpy: spy });
  }

  {
    const spy = { called: false };
    testPanel('powerOverlayHud (Moc)', 'power-overlay',
      () => M.showPowerOverlay({ power: 0, components: [], ranking: [] }, () => { spy.called = true; }),
      { onCloseSpy: spy });
  }

  {
    const spy = { called: false };
    testPanel('improvementBuildConfirm', 'improvement-build-confirm',
      () => M.showImprovementBuildConfirmModal('road', { removedImprovements: [], removesForest: false }, () => { spy.called = true; }));
    // onConfirm celowo NIE jest wołane przez Escape (Escape = Anuluj, nie Zastąp) -- dowód
    // negatywny: onConfirm pozostaje niewywołane po Escape.
    assert(spy.called === false, 'improvementBuildConfirm: Escape to Anuluj, NIE Zastąp -- onConfirm nie wywołane');
  }

  {
    const spy = { called: false };
    testPanel('civElimNotice', 'civ-elim-notice',
      () => M.showCivElimNotice({ civLabel: 'Rzym', details: 'x', onClose: () => { spy.called = true; } }),
      { onCloseSpy: spy });
  }

  {
    const spy = { called: false };
    testPanel('triumphCityStateNotice', 'triumph-city-state-notice',
      () => M.showTriumphCityStateNotice({ civLabel: 'Grecja', cityName: 'Ateny', onClose: () => { spy.called = true; } }),
      { onCloseSpy: spy });
  }

  {
    const spy = { called: false };
    testPanel('wonderCompletedNotice', 'wonder-completed-notice',
      () => M.showWonderCompletedNotice({ variant: 'mine', nazwa: 'Piramidy', locationLabel: 'x', bodyHtml: 'y', onClose: () => { spy.called = true; } }),
      { onCloseSpy: spy });
  }

  // ==========================================================================================
  // C. LIFO -- scenariusz B ze znaleziska Evaluatora FAIL #3: improvementBuildConfirm otwarty
  //    NAD trybem budowy ('build-mode' już na stosie). Escape ma zamknąć TYLKO modal, zostawić
  //    'build-mode' na stosie -- naruszenie LIFO (modal osierocony) było dokładnie zgłoszonym
  //    bugiem "gorszym niż pierwotny".
  // ==========================================================================================
  console.log('\n-- C. LIFO: improvementBuildConfirm NAD build-mode (Evaluator FAIL #3, scenariusz B) --');
  {
    M._resetEscapeOverlayStackForTest();
    let buildModeClosed = false;
    M.pushOverlay('build-mode', () => { buildModeClosed = true; M.popOverlay('build-mode'); });
    M.showImprovementBuildConfirmModal('road', { removedImprovements: ['Pole'], removesForest: false }, () => {});
    assert(M.top()?.id === 'improvement-build-confirm', 'modal na wierzchu build-mode');
    M._dispatchEscapeForTest();
    assert(!buildModeClosed, 'Escape NIE zamyka build-mode pod spodem (LIFO zachowane)');
    assert(M.top()?.id === 'build-mode', 'build-mode zostaje na stosie po zamknięciu modala');
    assert(M._getEscapeOverlayStackDepthForTest() === 1, 'stos: tylko build-mode zostaje');
    M._resetEscapeOverlayStackForTest();
  }

  // ==========================================================================================
  // D. Dowód rozstrzygający (kryterium odbioru z werdyktu Evaluatora): mutacja cofająca
  //    pushOverlay w źródle MUSI zepsuć ten test na czerwono. Podmiana treści pliku WYŁĄCZNIE
  //    w pamięci esbuild (onLoad) -- prawdziwy plik na dysku nigdy nie jest dotykany. Dwa
  //    reprezentatywne moduły: jeden z oryginalnej czwórki (gamePauseMenu, 4fc770ee) i jeden
  //    z tej naprawy (improvementBuildConfirm, FAIL #3) -- dowodzi, że harness łapie regresję
  //    w OBU grupach, nie tylko w jednej.
  // ==========================================================================================
  console.log('\n-- D. Mutacja kontrolna: cofnięcie pushOverlay musi dać czerwony wynik --');

  async function mutationCatches(label, fileRelPath, pushOverlayRegex, buildFnName, expectedId) {
    const absPath = path.resolve(GRA_ROOT, 'src', 'ui', fileRelPath);
    const original = fs.readFileSync(absPath, 'utf8');
    const mutated = original.replace(pushOverlayRegex, '');
    assert(mutated !== original, `${label}: mutacja faktycznie zmieniła źródło (kotwica regexu istnieje)`);
    assert(!mutated.includes(`pushOverlay('${expectedId}'`), `${label}: zmutowany kod nie zawiera już pushOverlay('${expectedId}', ...)`);

    const mutantPlugin = {
      name: `mutant-${label}`,
      setup(build) {
        build.onLoad({ filter: new RegExp(fileRelPath.replace('.', '\\.') + '$') }, () => (
          { contents: mutated, loader: 'ts', resolveDir: path.dirname(absPath) }
        ));
      },
    };

    const BUNDLE = path.resolve(__dirname, `.escape-real-panels-mutant-${label}-bundle.cjs`);
    const entryExports = {
      gamePauseMenu: `export { showGamePauseMenu, configureGamePauseMenu } from '../src/ui/gamePauseMenu';`,
      improvementBuildConfirm: `export { showImprovementBuildConfirmModal } from '../src/ui/improvementBuildConfirm';`,
    }[label];
    const Mm = await buildBundle(
      `${entryExports}
export {
  top, _resetEscapeOverlayStackForTest, _getEscapeOverlayStackDepthForTest,
} from '../src/ui/escapeOverlayStack';
`,
      BUNDLE,
      [mutantPlugin],
    );

    Mm._resetEscapeOverlayStackForTest();
    if (label === 'gamePauseMenu') {
      Mm.configureGamePauseMenu({ onResume: () => {}, onSave: () => {}, onLoad: () => {}, onNewGame: () => {}, onMainMenu: () => {} });
      Mm.showGamePauseMenu();
    } else {
      Mm.showImprovementBuildConfirmModal('road', { removedImprovements: [], removesForest: false }, () => {});
    }
    assert(Mm.top() === null, `${label}: MUTACJA (pushOverlay usunięty) łapana czerwono -- top() pozostaje null zamiast '${expectedId}'`);
    assert(Mm._getEscapeOverlayStackDepthForTest() === 0, `${label}: MUTACJA -- stos pozostaje pusty (regres zgłoszonego buga odtworzony)`);

    assert(fs.readFileSync(absPath, 'utf8') === original, `${label}: prawdziwy plik źródłowy na dysku NIE został zmieniony (mutacja tylko w pamięci esbuild)`);
  }

  await mutationCatches('gamePauseMenu', 'gamePauseMenu.ts', / {2}pushOverlay\('game-pause-menu',[\s\S]*?\}\);\n/, 'showGamePauseMenu', 'game-pause-menu');
  await mutationCatches('improvementBuildConfirm', 'improvementBuildConfirm.ts', / {2}pushOverlay\('improvement-build-confirm', close\);\n/, 'showImprovementBuildConfirmModal', 'improvement-build-confirm');

  M._resetEscapeOverlayStackForTest();

  console.log(`\nescape-overlay-real-panels-test: ${pass} pass, ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('BUILD/RUNTIME ERROR:', e);
  process.exit(1);
});
