'use strict';
/**
 * tech-discovery-card-click-test.cjs
 *
 * TEMAT: R-CIVPEDIA-KARTA-AKCJE-NIE-DZIALAJA-Q1.
 *
 * Zamyka P-TECH-CARD-TEST-NIE-TESTUJE-AKTYWNEJ-SCIEZKI-Q1: dotychczasowy
 * `technology-discovery-card-visual-test.cjs` sprawdza WYŁĄCZNIE tekst źródła
 * (regex/string-match), nigdy nie renderuje karty i nigdy nie klika przycisku —
 * nie wykryłby regresu, w którym przyciski stopki karty nie reagują na klik.
 *
 * Ten test bunduje PRAWDZIWY `techDiscoveryNotice.ts` przez esbuild (node/cjs) + jsdom,
 * wola `showTechDiscoveryNotice({ kind:'preview', onStartResearch: spy, onOpenTree: spy })`
 * (dokładnie ścieżka `showTechDiscoveryNoticeViaEntityCard` -> `renderEntityCard` ->
 * `entity-card-actions` -> `<button>`), znajduje realne węzły `<button>` w
 * zrenderowanym DOM i wywołuje na nich `button.click()` (prawdziwy event DOM,
 * nie string-match zrodla) -- weryfikuje ze spy FAKTYCZNIE sie wywolal.
 *
 * Usage (z gra/): node tools/tech-discovery-card-click-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let JSDOM;
try { ({ JSDOM } = require('jsdom')); }
catch (e) {
  console.error('[tech-discovery-card-click-test] jsdom missing — npm i -D jsdom');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const STUB_DIR = path.resolve(__dirname, '.stubs');
const BRAND_ASSETS_STUB = path.resolve(STUB_DIR, 'tech-discovery-click-brandAssets-stub.ts');
const SCIENCE_OWL_STUB = path.resolve(STUB_DIR, 'tech-discovery-click-scienceOwlIcon-stub.ts');
const ENTRY = path.resolve(__dirname, '.tech-discovery-click-entry.ts');
const BUNDLE = path.resolve(__dirname, '.tech-discovery-click-bundle.cjs');

// Ten sam wzorzec stubowania co `entity-card-contract-test.cjs` -- `techDiscoveryNotice.ts`
// importuje `icons/brandAssets` bezposrednio, a `entityCards/registry.ts` (przez
// `sciencePicker.ts` -> `scienceHubHud.ts`) importuje go posrednio. Oba lancuchy koncza
// sie w `import.meta.glob`/`.svg?raw`, ktorych esbuild/node nie rozumie bez pluginu Vite.
const stubIconsPlugin = {
  name: 'stub-icons',
  setup(build) {
    build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_ASSETS_STUB }));
    build.onResolve({ filter: /icons\/scienceOwlIcon$/ }, () => ({ path: SCIENCE_OWL_STUB }));
  },
};

fs.writeFileSync(
  ENTRY,
  [
    "export { showTechDiscoveryNotice, hideTechDiscoveryNotice, isTechDiscoveryNoticeOpen } from '../src/ui/techDiscoveryNotice.ts';",
    '',
  ].join('\n'),
  'utf8',
);

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail ? ' — ' + detail : '')); }
}

async function main() {
  await esbuild.build({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE,
    absWorkingDir: GRA,
    loader: { '.ts': 'ts' },
    plugins: [stubIconsPlugin],
    logLevel: 'silent',
  });

  const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>');
  global.window = dom.window;
  global.document = dom.window.document;
  global.HTMLElement = dom.window.HTMLElement;
  global.Node = dom.window.Node;
  global.MouseEvent = dom.window.MouseEvent;
  // Uwaga: NIE nadpisujemy global.navigator -- Node ma wlasny getter-only `navigator`;
  // `escapeOverlayStack.ts` obsluguje brak `navigator.keyboard` (Keyboard Lock API)
  // jako no-op, wiec test dziala bez podmiany (ten sam wzorzec co entity-card-contract-test).

  const { showTechDiscoveryNotice, hideTechDiscoveryNotice, isTechDiscoveryNoticeOpen } = require(BUNDLE);

  // Realna technologia z tech.json, odblokowana ("MOŻESZ WYBRAĆ" w hubie badań) -- ten sam
  // wzorzec wywołania co `scienceHubHud.ts:631` (kind:'preview', onStartResearch przekazany
  // gdy !lockedRow, onOpenTree zawsze).
  const techData = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'tech.json'), 'utf8'));
  const techName = techData.technologie[0].Technologia;
  check('fixture: tech.json ma co najmniej 1 technologię do testu', typeof techName === 'string' && techName.length > 0, techName);

  // --- Scenariusz 1: karta podglądu z OBOMA akcjami (odblokowana technologia) --------------
  console.log(`\n[1] showTechDiscoveryNotice({ kind:'preview', onStartResearch, onOpenTree }) dla "${techName}"`);
  let startResearchCalls = 0;
  let openTreeCalls = 0;
  showTechDiscoveryNotice({
    techName,
    eraIndex: 1,
    kind: 'preview',
    onStartResearch: () => { startResearchCalls++; },
    onOpenTree: () => { openTreeCalls++; },
  });

  check('karta jest otwarta po wywołaniu (isTechDiscoveryNoticeOpen)', isTechDiscoveryNoticeOpen());
  const host = document.getElementById('civ-tech-discovery-notice-host');
  check('host karty istnieje w DOM', host !== null);

  const actionButtons = host ? Array.from(host.querySelectorAll('.entity-card-actions button')) : [];
  check('stopka karty (entity-card-actions) renderuje dokładnie 2 przyciski akcji', actionButtons.length === 2,
    `got=${actionButtons.length}`);

  const researchBtn = actionButtons.find(b => b.textContent === 'Rozpocznij badanie') ?? null;
  const treeBtn = actionButtons.find(b => b.textContent === 'Otwórz drzewo') ?? null;
  check('przycisk "Rozpocznij badanie" istnieje w DOM', researchBtn !== null);
  check('przycisk "Otwórz drzewo" istnieje w DOM', treeBtn !== null);

  if (researchBtn) {
    check('przycisk "Rozpocznij badanie" NIE jest disabled', researchBtn.disabled !== true);
    // Prawdziwy klik DOM (button.click()), nie wywołanie handlera wprost -- weryfikuje
    // faktycznie podpięty addEventListener('click', ...), zgodnie z dyspozycją.
    researchBtn.click();
    check('kliknięcie "Rozpocznij badanie" wywołuje spy onStartResearch DOKŁADNIE raz',
      startResearchCalls === 1, `got=${startResearchCalls}`);
    check('kliknięcie "Rozpocznij badanie" zamyka kartę (close())', !isTechDiscoveryNoticeOpen());
  }

  // --- Scenariusz 2: świeże otwarcie karty, klik na "Otwórz drzewo" -----------------------
  console.log(`\n[2] nowe otwarcie karty -- klik "Otwórz drzewo"`);
  let openTreeCalls2 = 0;
  showTechDiscoveryNotice({
    techName,
    eraIndex: 1,
    kind: 'preview',
    onStartResearch: () => {},
    onOpenTree: () => { openTreeCalls2++; },
  });
  const host2 = document.getElementById('civ-tech-discovery-notice-host');
  const treeBtn2 = host2
    ? Array.from(host2.querySelectorAll('.entity-card-actions button')).find(b => b.textContent === 'Otwórz drzewo')
    : null;
  check('drugie otwarcie: przycisk "Otwórz drzewo" istnieje', treeBtn2 != null);
  if (treeBtn2) {
    treeBtn2.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
    check('dispatchEvent(MouseEvent "click") na "Otwórz drzewo" wywołuje spy onOpenTree DOKŁADNIE raz',
      openTreeCalls2 === 1, `got=${openTreeCalls2}`);
  }
  hideTechDiscoveryNotice();

  // --- Scenariusz 3: technologia ZABLOKOWANA (lockedRow) -- tylko "Otwórz drzewo", -------
  // onStartResearch=undefined (dokładnie wzorzec `scienceHubHud.ts:635`,
  // `lockedRow ? undefined : () => config.onSelectTech(e.id)`) -- upewnia się, że karta nie
  // rysuje martwego/rozłączonego przycisku "Rozpocznij badanie" gdy akcja nie jest dostępna.
  console.log(`\n[3] kind:'preview' bez onStartResearch (technologia zablokowana) -- tylko "Otwórz drzewo"`);
  let openTreeCalls3 = 0;
  showTechDiscoveryNotice({
    techName,
    eraIndex: 1,
    kind: 'preview',
    onStartResearch: undefined,
    onOpenTree: () => { openTreeCalls3++; },
  });
  const host3 = document.getElementById('civ-tech-discovery-notice-host');
  const buttons3 = host3 ? Array.from(host3.querySelectorAll('.entity-card-actions button')) : [];
  check('bez onStartResearch: stopka renderuje dokładnie 1 przycisk ("Otwórz drzewo")',
    buttons3.length === 1 && buttons3[0]?.textContent === 'Otwórz drzewo', `got=${buttons3.map(b => b.textContent)}`);
  if (buttons3[0]) {
    buttons3[0].click();
    check('klik jedynego przycisku ("Otwórz drzewo") wywołuje spy', openTreeCalls3 === 1, `got=${openTreeCalls3}`);
  }
  hideTechDiscoveryNotice();

  console.log(`\n${pass} PASS, ${fail} FAIL`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('[tech-discovery-card-click-test] błąd:', err);
  process.exit(1);
});
