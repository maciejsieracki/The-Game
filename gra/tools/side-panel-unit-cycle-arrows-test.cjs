'use strict';
/**
 * side-panel-unit-cycle-arrows-test.cjs
 *
 * R-KARTA-JEDNOSTKI-STRZALKI-CYKL (Maciej, playtest 2026-08-09): karta jednostki w
 * panelu bocznym traci nagłówek tekstowy „Jednostka" (obie karty — własna i cudza).
 * W jego miejsce, TYLKO dla własnej jednostki gracza, pojawia się wiersz strzałek
 * cyklowania ◀▶ (te same, reużyte funkcje co dolny pasek armii — patrz main.ts
 * cycleToAdjacentPlayerUnit/cyclablePlayerArmyLeadsAll, R-SPACJA-KOLEJNA-JEDNOSTKA-PETLA
 * 2026-08-08). Karta heksu (kind==='hex') NIE jest dotknięta tą zmianą — nagłówek
 * "Pole mapy — kliknięty heks" zostaje.
 *
 * Bundluje NAPRAWDĘ src/ui/sidePanelHud.ts (nie odtworzenie logiki) — wzorem
 * army-merge-dismiss-bounce-test.cjs. Stub tylko dla icons/brandAssets (Vite
 * `?raw` + `import.meta.glob`, esbuild/node tego nie obsłuży) i dla
 * ./brandTokenVars (importuje `tokens.css?raw`, ten sam problem) — reszta drzewa
 * importów (hexContextTooltip, hudLayout, minimapLayout, sidePanelLayout,
 * unitCtxDockDiploGate) to zwykłe moduły TS bez zależności Vite-specific.
 *
 * Usage (z gra/): node tools/side-panel-unit-cycle-arrows-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let JSDOM;
try { ({ JSDOM } = require('jsdom')); }
catch (e) {
  console.error('[side-panel-unit-cycle-arrows-test] jsdom missing — npm i -D jsdom');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const STUB_DIR = path.resolve(__dirname, '.stubs');
// Nazwy własne (nie 'brandAssets-stub.ts') — ten plik jest współdzielony między
// bramkami i różna zawartość między nimi brudzi `git status` (patrz nota N4 przy
// unit-context-card-test.cjs, BUG-TOOLTIP-MOC-NIEPELNA). Ten test dopisuje własne
// stuby, gitignorowane osobno.
const STUB_BRAND_ASSETS = path.resolve(STUB_DIR, 'side-panel-unit-cycle-brandAssets-stub.ts');
const STUB_BRAND_TOKENS = path.resolve(STUB_DIR, 'side-panel-unit-cycle-brandTokenVars-stub.ts');
const ENTRY_FILE = path.resolve(__dirname, '.side-panel-unit-cycle-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.side-panel-unit-cycle-bundle.cjs');

fs.mkdirSync(STUB_DIR, { recursive: true });
fs.writeFileSync(STUB_BRAND_ASSETS, [
  "export function brandIconSvg(_key, _size) { return ''; }",
  "export function mapResourceIconSvg(_key, _size) { return ''; }",
  "export function terrainIconSvg(_key, _size) { return ''; }",
  "export function unitIconSvg(_key) { return ''; }",
  '',
].join('\n'), 'utf8');
fs.writeFileSync(STUB_BRAND_TOKENS, [
  'export function ensureBrandRootTokens() {}',
  "export const CIV_BRAND_SCOPE_VARS = '';",
  '',
].join('\n'), 'utf8');

fs.writeFileSync(
  ENTRY_FILE,
  "export { createSidePanelHud } from '../src/ui/sidePanelHud.ts';\n",
  'utf8',
);

const stubPlugin = {
  name: 'stub-side-panel-unit-cycle',
  setup(build) {
    build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: STUB_BRAND_ASSETS }));
    build.onResolve({ filter: /brandTokenVars$/ }, () => ({ path: STUB_BRAND_TOKENS }));
  },
};

async function main() {
  try {
    await esbuild.build({
      entryPoints: [ENTRY_FILE],
      bundle: true,
      platform: 'node',
      format: 'cjs',
      target: 'node18',
      outfile: BUNDLE_FILE,
      absWorkingDir: GRA,
      plugins: [stubPlugin],
      logLevel: 'silent',
    });
  } catch (e) {
    console.error('[side-panel-unit-cycle-arrows-test] esbuild failed:', e.message || e);
    process.exit(1);
  }

  const { createSidePanelHud } = require(BUNDLE_FILE);

  const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>');
  global.document = dom.window.document;
  global.window = dom.window;
  global.HTMLElement = dom.window.HTMLElement;
  global.HTMLButtonElement = dom.window.HTMLButtonElement;
  global.MouseEvent = dom.window.MouseEvent;

  let pass = 0;
  let fail = 0;
  function ok(cond, msg) {
    if (cond) { pass++; console.log('  PASS:', msg); }
    else { fail++; console.error('  FAIL:', msg); }
  }

  function click(el) {
    el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
  }

  console.log('side-panel-unit-cycle-arrows-test (R-KARTA-JEDNOSTKI-STRZALKI-CYKL)\n');

  // -------------------------------------------------------------------------
  // Harness: montuje panel z kontrolowanym stanem (ctxData / canCycle mutowalne
  // z zewnątrz), rejestruje spy na onContextCycleUnit.
  // -------------------------------------------------------------------------
  let ctxData = null;
  let canCycle = false;
  const cycleCalls = [];

  const api = createSidePanelHud({
    getEvents: () => [],
    getContextPanel: () => ctxData,
    onContextCycleUnit: (delta) => cycleCalls.push(delta),
    canContextCycleUnit: () => canCycle,
  });
  document.body.appendChild(api.el);
  document.body.appendChild(api.ctxEl);

  // -------------------------------------------------------------------------
  // SCENARIUSZ 1 (regresja): karta heksu (kind='hex') NIE dotknięta — nagłówek
  // "Pole mapy — kliknięty heks" zostaje, brak strzałek cyklowania.
  // -------------------------------------------------------------------------
  {
    ctxData = { kind: 'hex', html: '<div>test-hex-content</div>' };
    canCycle = true;
    api.update();

    const head = api.el.querySelector('.sp-ctx-head');
    ok(head !== null, '1) karta heksu: naglowek .sp-ctx-head OBECNY (regresja — nie ruszamy hex)');
    ok(head !== null && head.textContent === 'Pole mapy — kliknięty heks',
      '1b) naglowek karty heksu ma niezmieniony tekst');
    ok(api.el.querySelector('.sp-ctx-nav') === null,
      '1c) karta heksu: BRAK strzalek cyklowania (nawet gdy canCycle=true)');
    ok(api.el.innerHTML.includes('test-hex-content'), '1d) tresc karty heksu wyrenderowana');
  }

  // -------------------------------------------------------------------------
  // SCENARIUSZ 2: karta CUDZEJ jednostki (kind='unit', ownUnit=false/undefined)
  // — nagłówek "Jednostka" USUNIĘTY, strzałki FIZYCZNIE NIEOBECNE w DOM (nie
  // ukryte CSS-em -- querySelector musi zwrocic null, nie sprawdzac display).
  // -------------------------------------------------------------------------
  {
    ctxData = { kind: 'unit', html: '<div>test-foreign-unit</div>', ownUnit: false };
    canCycle = true;
    api.update();

    ok(api.ctxEl.querySelector('.sp-ctx-head') === null,
      '2) karta cudzej jednostki: naglowek .sp-ctx-head USUNIETY (dawne "Jednostka")');
    ok(!api.ctxEl.innerHTML.includes('Jednostka'),
      '2b) tekst "Jednostka" nigdzie w markupie karty cudzej jednostki');
    const nav = api.ctxEl.querySelector('.sp-ctx-nav');
    ok(nav === null,
      '2c) karta cudzej jednostki: .sp-ctx-nav FIZYCZNIE NIEOBECNY w DOM (nie tylko CSS display:none)');
    ok(api.ctxEl.querySelectorAll('.sp-ctx-nav-arr').length === 0,
      '2d) zero przyciskow .sp-ctx-nav-arr w DOM dla cudzej jednostki');
    ok(api.ctxEl.innerHTML.includes('test-foreign-unit'), '2e) tresc karty cudzej jednostki wyrenderowana');
  }

  {
    // ownUnit calkiem pominiete (undefined) — ten sam efekt co false.
    ctxData = { kind: 'unit', html: '<div>test-foreign-unit-2</div>' };
    canCycle = true;
    api.update();
    ok(api.ctxEl.querySelector('.sp-ctx-nav') === null,
      '2f) ownUnit undefined (nie tylko false) — strzalki nadal nieobecne');
  }

  // -------------------------------------------------------------------------
  // SCENARIUSZ 3: karta WLASNEJ jednostki (ownUnit=true) — naglowek USUNIETY,
  // strzalki OBECNE i AKTYWNE (canCycle=true -> brak atrybutu disabled).
  // -------------------------------------------------------------------------
  {
    ctxData = { kind: 'unit', html: '<div>test-own-unit</div>', ownUnit: true };
    canCycle = true;
    api.update();

    ok(api.ctxEl.querySelector('.sp-ctx-head') === null,
      '3) karta wlasnej jednostki: naglowek .sp-ctx-head USUNIETY');
    const nav = api.ctxEl.querySelector('.sp-ctx-nav');
    ok(nav !== null, '3b) karta wlasnej jednostki: .sp-ctx-nav OBECNY w DOM');
    const arrows = api.ctxEl.querySelectorAll('.sp-ctx-nav-arr');
    ok(arrows.length === 2, '3c) dokladnie 2 przyciski strzalek (<- i ->)');
    ok([...arrows].every(b => !b.disabled), '3d) strzalki NIE disabled, gdy canContextCycleUnit()=true');
  }

  // -------------------------------------------------------------------------
  // SCENARIUSZ 4: klik strzalki -> woła onContextCycleUnit z poprawnym delta.
  // -------------------------------------------------------------------------
  {
    ctxData = { kind: 'unit', html: '<div>test-own-unit-click</div>', ownUnit: true };
    canCycle = true;
    api.update();

    cycleCalls.length = 0;
    const arrows = [...api.ctxEl.querySelectorAll('.sp-ctx-nav-arr')];
    const prevBtn = arrows.find(b => b.getAttribute('data-sp-cycle') === '-1');
    const nextBtn = arrows.find(b => b.getAttribute('data-sp-cycle') === '1');
    ok(prevBtn !== undefined && nextBtn !== undefined, '4) znaleziono obie strzalki po data-sp-cycle');

    click(prevBtn);
    ok(cycleCalls.length === 1 && cycleCalls[0] === -1, '4b) klik <- woła onContextCycleUnit(-1)');

    click(nextBtn);
    ok(cycleCalls.length === 2 && cycleCalls[1] === 1, '4c) klik -> woła onContextCycleUnit(1)');
  }

  // -------------------------------------------------------------------------
  // SCENARIUSZ 5: canContextCycleUnit()=false -> strzalki disabled (atrybut
  // HTML) I gwardia JS w kliku fizycznie blokuje wywolanie callbacku (realny
  // dispatchEvent, NIE tylko sprawdzenie atrybutu disabled -- jsdom w
  // przeciwienstwie do przegladarki NIE tlumi klikniecia w disabled <button>
  // samo z siebie, wiec ten test realnie sprawdza gwardie `if (btn.disabled)
  // return;` w bindContextInteractions, a nie tautologicznie sam atrybut).
  // -------------------------------------------------------------------------
  {
    ctxData = { kind: 'unit', html: '<div>test-own-unit-disabled</div>', ownUnit: true };
    canCycle = false;
    api.update();

    const arrows = [...api.ctxEl.querySelectorAll('.sp-ctx-nav-arr')];
    ok(arrows.length === 2, '5) strzalki nadal OBECNE w DOM, gdy canCycle=false (tylko disabled, nie usuniete)');
    ok(arrows.every(b => b.disabled === true), '5b) obie strzalki maja atrybut disabled=true');

    cycleCalls.length = 0;
    for (const btn of arrows) click(btn);
    ok(cycleCalls.length === 0,
      '5c) klik (dispatchEvent) na disabled strzalce NIE wola onContextCycleUnit (gwardia JS dziala naprawde)');
  }

  console.log(`\nside-panel-unit-cycle-arrows-test: ${pass} pass, ${fail} fail`);

  api.destroy();
  try { fs.unlinkSync(ENTRY_FILE); } catch (_) { /* noop */ }

  process.exit(fail > 0 ? 1 : 0);
}

main();
