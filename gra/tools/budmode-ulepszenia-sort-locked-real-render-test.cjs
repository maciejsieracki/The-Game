'use strict';
/**
 * budmode-ulepszenia-sort-locked-real-render-test.cjs
 *
 * TEMAT: P-BUDMODE-DOSTEPNE-NA-GORZE-Q1.
 *
 * ZGŁOSZENIE WŁAŚCICIELA (2026-09-10, na żywo, ze zrzutem ekranu listy ulepszeń terenu):
 * lista „Ulepszenia terenu" w trybie budowy mieszała dostępne i zablokowane pozycje w
 * kolejności z danych. Wzorzec już istniejący w kodzie: `diplomacyAudience.ts:1840`
 * (`.sort((x, y) => Number(x.isLocked) - Number(y.isLocked))`) — dostępne (false→0) przed
 * zablokowanymi (true→1).
 *
 * CO TEN TEST MIERZY — i dlaczego wymaga żywego Chromium, nie samego czytania kodu.
 * Kolejność renderu (`el.innerHTML = html`, konkatenacja stringów) nie jest widoczna z
 * samego kodu źródłowego bez uruchomienia — dopiero DOM po `update()` pokazuje faktyczną
 * kolejność `.civ-build-item[data-key]`. Scena montuje PRAWDZIWY `createBuildModeHud`
 * (bundlowany esbuildem z realnego `buildModeHud.ts`, nie atrapa) w realnym Chromium.
 *
 * SCENARIUSZ (mieszanka jak na zrzucie właściciela — świeża gra w Epoce Kamienia):
 *  - kilka pozycji w pełni dostępnych (techUnlocked=true, kosztPraca <= pracaPool),
 *  - kilka zablokowanych technologicznie (techUnlocked=false),
 *  - co najmniej jedna pozycja TECHNOLOGICZNIE dostępna, ale z NIEWYSTARCZAJĄCĄ Pracą
 *    (techUnlocked=true, kosztPraca > pracaPool) — dowód, że sort używa DOKŁADNIE tej
 *    samej definicji `locked` co pętla renderująca (techLocked || insufficientPraca),
 *    nie tylko `techUnlocked`.
 *  Kolejność wejściowa (z `listTypes()`) jest CELOWO przemieszana (locked/dostępne na
 *  przemian), żeby sort był jedynym możliwym wyjaśnieniem obserwowanego porządku w DOM.
 *
 * ASERCJE:
 *  (S1) DOM zawiera dokładnie tyle samo `.civ-build-item[data-key]` ile wejściowych typów.
 *  (S2) Wszystkie NIE-`.locked` pozycje poprzedzają w DOM wszystkie `.locked` pozycje
 *       (żaden `.locked` przed żadnym nie-`.locked` — sprawdzone parą sąsiednich indeksów
 *       i globalnie: max-indeks nie-locked < min-indeks locked).
 *  (S3) pozycja z niewystarczającą Pracą (techUnlocked=true, kosztPraca>pracaPool) ma klasę
 *       `.locked` i leży w grupie zablokowanych (dowód dodatkowy ze zgłoszenia).
 *  (S4) sort jest STABILNY: względna kolejność WEWNĄTRZ grupy dostępnych i WEWNĄTRZ grupy
 *       zablokowanych odpowiada kolejności z `listTypes()` (po odfiltrowaniu drugiej grupy).
 *  (S5) sekcje „Cuda świata" i „Załóż miasto" NIE zostały dotknięte — kolejność cudów w DOM
 *       odpowiada dokładnie kolejności z `listWonders()` (dowód nie-regresji zakresu).
 *  (S6) `data-key` z DOM to dokładnie ten sam zbiór co klucze wejściowe (żadna pozycja nie
 *       zniknęła/zdublowała się przy sortowaniu).
 *
 * Usage (z gra/): node tools/budmode-ulepszenia-sort-locked-real-render-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[budmode-ulepszenia-sort-locked-real-render-test] playwright missing — npm i -D playwright');
  process.exit(1);
}

const GRA = path.resolve(__dirname, '..');
const STUB_DIR = path.resolve(__dirname, '.stubs');
const BRAND_STUB = path.resolve(STUB_DIR, 'build-panel-scroll-brandAssets-stub.ts');
const OWL_STUB = path.resolve(STUB_DIR, 'build-panel-scroll-scienceOwlIcon-stub.ts');
const ENTRY = path.resolve(__dirname, '.budmode-sort-entry.ts');
const OUTFILE = path.resolve(__dirname, '.budmode-sort-bundle.cjs');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

async function launchBrowser() {
  try {
    return await chromium.launch({ headless: true });
  } catch (e) {
    console.log('[budmode-ulepszenia-sort-locked-real-render-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

async function bundle() {
  fs.writeFileSync(
    ENTRY,
    [
      "import { createBuildModeHud } from '../src/ui/buildModeHud.ts';",
      'window.__createBuildModeHud = createBuildModeHud;',
      '',
    ].join('\n'),
    'utf8',
  );
  await esbuild.build({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'browser',
    format: 'iife',
    target: 'es2020',
    outfile: OUTFILE,
    absWorkingDir: GRA,
    loader: { '.ts': 'ts' },
    plugins: [{
      name: 'stub-icons',
      setup(build) {
        build.onResolve({ filter: /(^|\/)brandAssets$/ }, () => ({ path: BRAND_STUB }));
        build.onResolve({ filter: /(^|\/)scienceOwlIcon$/ }, () => ({ path: OWL_STUB }));
      },
    }],
    logLevel: 'silent',
  });
  return fs.readFileSync(OUTFILE, 'utf8');
}

/** Mieszanka celowo przeplatana: dostępne / tech-locked / insufficient-praca na przemian,
 *  żeby żaden przypadkowy porządek wejściowy nie mógł udawać efektu sortu. `pracaPool` = 30. */
const PRACA_POOL = 30;
const TYPES = [
  { key: 'droga', label: 'Droga', kosztPraca: 10, techUnlocked: true },                 // dostępne
  { key: 'kopalnia', label: 'Kopalnia', kosztPraca: 20, techUnlocked: false, techLabel: 'Górnictwo' }, // tech-locked
  { key: 'farma', label: 'Farma', kosztPraca: 15, techUnlocked: true },                 // dostępne
  { key: 'fort', label: 'Fort', kosztPraca: 50, techUnlocked: true },                   // insufficientPraca (50 > 30)
  { key: 'kamienolom', label: 'Kamieniołom', kosztPraca: 12, techUnlocked: false, techLabel: 'Obróbka kamienia' }, // tech-locked
  { key: 'pastwisko', label: 'Pastwisko', kosztPraca: 8, techUnlocked: true },          // dostępne
  { key: 'plantacja', label: 'Plantacja', kosztPraca: 40, techUnlocked: true },         // insufficientPraca (40 > 30)
  { key: 'las_zagajnik', label: 'Zagajnik', kosztPraca: 18, techUnlocked: false, techLabel: 'Leśnictwo' }, // tech-locked
];
// Definicja `locked` OSOBNO obliczona tutaj w teście (referencja niezależna od implementacji
// pod testem) — DOKŁADNIE ta sama formuła co w dispatchu/kodzie: techLocked || insufficientPraca.
const EXPECTED = TYPES.map((t) => {
  const techLocked = t.techUnlocked === false;
  const insufficientPraca = !techLocked && t.kosztPraca > PRACA_POOL;
  return { key: t.key, locked: techLocked || insufficientPraca, insufficientPraca };
});

const WONDERS = [
  { id: 'piramidy', label: 'Piramidy', kosztPraca: 200, epokaWejscia: 1, dostep: 'R', building: false },
  { id: 'stonehenge', label: 'Stonehenge', kosztPraca: 150, epokaWejscia: 1, dostep: 'R', building: true },
];

async function mountScene(page) {
  await page.evaluate(({ types, wonders, pracaPool }) => {
    document.body.innerHTML = '';
    window.__selected = [];
    window.__hud = window.__createBuildModeHud({
      listTypes: () => types,
      getActiveKey: () => null,
      onSelectType: (k) => { window.__selected.push(k); },
      onExit: () => {},
      isOpen: () => true,
      getPracaPool: () => pracaPool,
      canFoundCity: () => true,
      isFoundCityActive: () => false,
      isFoundCityOnly: () => false,
      getFoundCityCostLabel: () => '60 P',
      listWonders: () => wonders,
      getActiveWonderId: () => null,
      getWonderTargetLabel: () => 'Cel: stolica',
      listPlayerCities: () => [],
      getUlepszeniaCityId: () => null,
      getUlepszeniaEmpireState: () => null,
      getUlepszeniaEffectiveState: () => null,
      getUlepszeniaCityOverride: () => false,
    });
    window.__hud.update();
  }, { types: TYPES, wonders: WONDERS, pracaPool: PRACA_POOL });
}

async function measure(page) {
  return page.evaluate(() => {
    const panel = document.querySelector('.civ-build-panel');
    const items = Array.from(panel.querySelectorAll('.civ-build-item[data-key]'));
    const order = items.map((el) => ({
      key: el.getAttribute('data-key'),
      locked: el.classList.contains('locked'),
    }));
    const wonderEls = Array.from(panel.querySelectorAll('.civ-build-item.wonder[data-wonder-id]'));
    const wonderOrder = wonderEls.map((el) => el.getAttribute('data-wonder-id'));
    const foundCity = !!panel.querySelector('[data-found-city]');
    return { order, wonderOrder, foundCity };
  });
}

async function main() {
  const bundleJs = await bundle();
  const browser = await launchBrowser();
  const consoleErrors = [];
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => consoleErrors.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
    await page.setContent('<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:monospace}</style><div id="root"></div>');
    await page.addScriptTag({ content: bundleJs });
    await mountScene(page);
    await page.waitForTimeout(20);
    const m = await measure(page);

    check('brak błędów konsoli/strony przy renderze panelu', consoleErrors.length === 0, consoleErrors);

    // (S1)
    check('S1 liczba wyrenderowanych pozycji ulepszeń = liczba wejściowych typów',
      m.order.length === TYPES.length, { got: m.order.length, expected: TYPES.length });

    // (S6) sam zbiór kluczy bez zmian (żadna pozycja nie zniknęła/zdublowała się)
    const gotKeysSorted = m.order.map((o) => o.key).slice().sort();
    const expKeysSorted = TYPES.map((t) => t.key).slice().sort();
    check('S6 zbiór data-key po sorcie identyczny ze zbiorem wejściowym (bez ubytków/duplikatów)',
      JSON.stringify(gotKeysSorted) === JSON.stringify(expKeysSorted),
      { got: gotKeysSorted, expected: expKeysSorted });

    // (S3) klasa .locked per wiersz zgodna z definicją techLocked || insufficientPraca
    const byKey = Object.fromEntries(m.order.map((o) => [o.key, o.locked]));
    const lockMismatch = EXPECTED.filter((e) => byKey[e.key] !== e.locked);
    check('S3 klasa .locked każdej pozycji zgodna z definicją techLocked||insufficientPraca (w tym „za mało Pracy")',
      lockMismatch.length === 0, lockMismatch);
    check('S3b pozycje z niewystarczającą Pracą (fort, plantacja) mają .locked=true',
      byKey.fort === true && byKey.plantacja === true,
      { fort: byKey.fort, plantacja: byKey.plantacja });

    // (S2) wszystkie dostępne (locked=false) NAD wszystkimi zablokowanymi (locked=true)
    const lockedFlags = m.order.map((o) => o.locked);
    const firstLockedIdx = lockedFlags.indexOf(true);
    const lastUnlockedIdx = lockedFlags.lastIndexOf(false);
    check('S2 wszystkie dostępne pozycje renderują się NAD wszystkimi zablokowanymi (żaden .locked przed nie-.locked)',
      firstLockedIdx === -1 || lastUnlockedIdx === -1 || lastUnlockedIdx < firstLockedIdx,
      { order: m.order, firstLockedIdx, lastUnlockedIdx });

    // (S4) stabilność sortu wewnątrz każdej grupy
    const expUnlockedOrder = TYPES.filter((_, i) => !EXPECTED[i].locked).map((t) => t.key);
    const expLockedOrder = TYPES.filter((_, i) => EXPECTED[i].locked).map((t) => t.key);
    const gotUnlockedOrder = m.order.filter((o) => !o.locked).map((o) => o.key);
    const gotLockedOrder = m.order.filter((o) => o.locked).map((o) => o.key);
    check('S4a sort stabilny — kolejność WEWNĄTRZ grupy dostępnych zachowana z listTypes()',
      JSON.stringify(gotUnlockedOrder) === JSON.stringify(expUnlockedOrder),
      { got: gotUnlockedOrder, expected: expUnlockedOrder });
    check('S4b sort stabilny — kolejność WEWNĄTRZ grupy zablokowanych zachowana z listTypes()',
      JSON.stringify(gotLockedOrder) === JSON.stringify(expLockedOrder),
      { got: gotLockedOrder, expected: expLockedOrder });

    // (S5) sekcje Cuda świata / Załóż miasto nietknięte — kolejność cudów = kolejność wejściowa
    check('S5a kolejność „Cuda świata" w DOM NIETKNIĘTA (odpowiada dokładnie listWonders(), nie posortowana wg locked)',
      JSON.stringify(m.wonderOrder) === JSON.stringify(WONDERS.map((w) => w.id)),
      { got: m.wonderOrder, expected: WONDERS.map((w) => w.id) });
    check('S5b sekcja „Załóż miasto" obecna bez zmian (canFoundCity=true → data-found-city renderowany)',
      m.foundCity === true);

    await ctx.close();
  } finally {
    await browser.close();
    try { fs.unlinkSync(ENTRY); } catch (_e) { /* noop */ }
    try { fs.unlinkSync(OUTFILE); } catch (_e) { /* noop */ }
  }

  console.log('');
  console.log(`[budmode-ulepszenia-sort-locked-real-render-test] ${pass} pass, ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
