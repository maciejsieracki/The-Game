'use strict';
/**
 * build-mode-hud-affordability-test.cjs
 *
 * R-STAWKI-KOSZT-ULEPSZEN-X2-PRZYSTEPNOSC (Maciej, ECHO A — zostaw balans ×2, popraw WYŁĄCZNIE
 * UX przystępności panelu budowy). Regresja: panel `buildModeHud.ts` musi wyszarzać/blokować
 * pozycje ulepszeń, na które gracza NIE STAĆ (kosztPraca > aktualna pula Pracy z
 * `config.getPracaPool()`) — tym samym wzorcem wizualnym co istniejący tech-lock (klasa
 * `.civ-build-item.locked`, atrybut `data-lock-hint`, klik NIE wywołuje `onSelectType`) —
 * zamiast dowiadywać się o braku Pracy dopiero po kliknięciu w hex (stary toast 3s).
 *
 * Bunduje PRAWDZIWY `src/ui/buildModeHud.ts` przez esbuild (node/cjs) + jsdom jako document,
 * wzorzec z `army-merge-dismiss-bounce-test.cjs` / `diplomacy-proposal-test.cjs`. Jedyna
 * zależność wymagająca stubowania to `./icons/brandAssets` (Vite `import.meta.glob` gdzie
 * indziej w tym module) — własny stub, patrz nota P-BRAMKA-STUB-KOLIZJA-WSPOLDZIELONY.
 *
 * Usage (z gra/): node tools/build-mode-hud-affordability-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let JSDOM;
try { ({ JSDOM } = require('jsdom')); }
catch (e) {
  console.error('[build-mode-hud-affordability-test] jsdom missing — npm i -D jsdom');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const STUB_DIR = path.resolve(__dirname, '.stubs');
const BRAND_ASSETS_STUB = path.resolve(STUB_DIR, 'buildmodehud-brandassets-stub.ts');
// T7b (KARTA-ULEPSZENIA-TERENU): `buildModeHud.ts` teraz importuje `openEntityCard` z
// `entityCards/renderer.ts`, który przez `registry.ts` -> `sciencePicker.ts` ->
// `scienceHubHud.ts` ciągnie też `icons/scienceOwlIcon` (`.svg?raw`, Vite-only) — ten sam
// łańcuch co `tech-discovery-click-scienceOwlIcon-stub.ts`, więc potrzebny osobny stub tu.
const SCIENCE_OWL_STUB = path.resolve(STUB_DIR, 'buildmodehud-scienceOwlIcon-stub.ts');
const ENTRY = path.resolve(__dirname, '.build-mode-hud-affordability-entry.ts');
const BUNDLE = path.resolve(__dirname, '.build-mode-hud-affordability-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `export { createBuildModeHud } from '../src/ui/buildModeHud.ts';\n`,
  'utf8',
);

const stubBrandAssetsPlugin = {
  name: 'stub-brand-assets',
  setup(build) {
    build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_ASSETS_STUB }));
    build.onResolve({ filter: /icons\/scienceOwlIcon$/ }, () => ({ path: SCIENCE_OWL_STUB }));
  },
};

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
    plugins: [stubBrandAssetsPlugin],
    logLevel: 'silent',
  });

  const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>');
  global.window = dom.window;
  global.document = dom.window.document;
  global.HTMLElement = dom.window.HTMLElement;
  global.Node = dom.window.Node;
  global.MouseEvent = dom.window.MouseEvent;

  const { createBuildModeHud } = require(BUNDLE);

  const selected = [];
  const PRACA_POOL = 20;
  const config = {
    listTypes: () => [
      { key: 'droga', label: 'Droga', kosztPraca: 10, epoka: 1 }, // stać (10 <= 20)
      { key: 'fort', label: 'Fort', kosztPraca: 50, epoka: 1 },   // nie stać (50 > 20)
    ],
    getActiveKey: () => null,
    onSelectType: (key) => { selected.push(key); },
    onExit: () => {},
    isOpen: () => true,
    getPracaPool: () => PRACA_POOL,
  };

  const hud = createBuildModeHud(config);

  const affordableItem = hud.el.querySelector('[data-key="droga"]');
  const unaffordableItem = hud.el.querySelector('[data-key="fort"]');

  check('pozycja Droga (10 P, stać) renderuje się', !!affordableItem);
  check('pozycja Fort (50 P, NIE stać) renderuje się', !!unaffordableItem);

  check(
    'Droga (stać) NIE ma klasy locked',
    !!affordableItem && !affordableItem.classList.contains('locked'),
  );
  check(
    'Fort (nie stać) MA klasę locked (ten sam wzorzec co tech-lock)',
    !!unaffordableItem && unaffordableItem.classList.contains('locked'),
  );
  check(
    'Fort ma data-lock-hint z tekstem "Za mało Pracy" i liczbami kosztu/puli',
    !!unaffordableItem
      && (unaffordableItem.getAttribute('data-lock-hint') || '').includes('Za mało Pracy')
      && (unaffordableItem.getAttribute('data-lock-hint') || '').includes('50')
      && (unaffordableItem.getAttribute('data-lock-hint') || '').includes('20'),
    unaffordableItem ? unaffordableItem.getAttribute('data-lock-hint') : '(brak elementu)',
  );

  // Klik w zablokowaną pozycję (Fort) NIE wywołuje onSelectType — gracz nie wchodzi w tryb
  // wyboru czegoś, na co go nie stać (zamiast dowiadywać się dopiero po kliknięciu w hex).
  if (unaffordableItem) unaffordableItem.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  check('klik w Fort (zablokowany) NIE wywołuje onSelectType', selected.length === 0, JSON.stringify(selected));

  // Klik w dostępną pozycję (Droga) NADAL działa normalnie.
  if (affordableItem) affordableItem.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  check('klik w Droga (dostępna) wywołuje onSelectType("droga")', selected.length === 1 && selected[0] === 'droga', JSON.stringify(selected));

  hud.destroy();

  console.log('');
  console.log(`[build-mode-hud-affordability-test] ${pass} pass, ${fail} fail`);
  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
