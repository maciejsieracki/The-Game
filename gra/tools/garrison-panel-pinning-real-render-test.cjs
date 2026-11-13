'use strict';
/**
 * garrison-panel-pinning-real-render-test.cjs
 *
 * R-GARNIZON-PANEL-DOCELNY-Q1.
 *
 * Prawdziwy browser/state test dla wejścia „Garnizon N” w panelu miasta:
 * - kliknięcie istniejącego sygnetu otwiera kartę w istniejącym leftDetailDock;
 * - karta pozostaje po opuszczeniu sygnetu i nadal obsługuje realne akcje silnika;
 * - zmiana zakładki/miasta oraz zamknięcie panelu czyszczą wybór;
 * - zwykły hover pozostaje nietrwały;
 * - mutant usuwający wiring pinowania musi oblać asercję trwałości.
 *
 * Użycie (z katalogu gra/):
 *   node tools/garrison-panel-pinning-real-render-test.cjs
 *   node tools/garrison-panel-pinning-real-render-test.cjs --no-shots
 */

const fs = require('fs');
const os = require('os');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const CITY_TS = path.resolve(GRA, 'src/ui/cityPanel.ts');
const HOVER_TS = path.resolve(GRA, 'src/ui/hoverDetailDock.ts');
const TMP_RUN_ID = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
const TMP = path.join(os.tmpdir(), `civ-garrison-panel-${TMP_RUN_ID}`);
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const NO_SHOTS = process.argv.includes('--no-shots');
const SHOTS_DIR = path.join(os.tmpdir(), `civ-shots-garrison-panel-${TMP_RUN_ID}`);

let esbuild;
let chromium;
try {
  esbuild = require(path.resolve(GRA, 'node_modules/esbuild'));
  ({ chromium } = require(path.resolve(GRA, 'node_modules/playwright')));
} catch (e) {
  console.error('[garrison-panel-pinning] dependencies missing — run npm ci in gra/');
  process.exit(1);
}

let pass = 0;
let fail = 0;
function check(name, condition, detail) {
  if (condition) {
    pass++;
    console.log('PASS: ' + name);
  } else {
    fail++;
    console.log('FAIL: ' + name + (detail === undefined ? '' : ' — ' + JSON.stringify(detail)));
  }
}

function sourcePlugin(mutations) {
  return {
    name: 'garrison-source-mutator',
    setup(build) {
      build.onResolve({ filter: /\?raw$/ }, (args) => {
        const clean = args.path.slice(0, -4);
        const abs = path.isAbsolute(clean)
          ? clean
          : path.resolve(path.dirname(args.importer), clean);
        return { path: abs, namespace: 'garrison-raw' };
      });
      build.onLoad({ filter: /.*/, namespace: 'garrison-raw' }, (args) => ({
        contents: fs.readFileSync(args.path, 'utf8'),
        loader: 'text',
      }));
      build.onLoad({ filter: /\.ts$/ }, (args) => {
        const abs = path.resolve(args.path);
        let src = mutations[abs] ?? null;
        let changed = src !== null;
        if (src === null) {
          const original = fs.readFileSync(abs, 'utf8');
          if (abs === CITY_TS || original.includes('import.meta.glob')) {
            src = original;
            changed = true;
          }
        }
        if (src === null || src === undefined) return null;
        if (src.includes('import.meta.glob')) {
          src = 'const __viteGlobStub = () => ({});\n' + src.replace(/import\.meta\.glob/g, '__viteGlobStub');
          changed = true;
        }
        if (abs === CITY_TS) {
          src += '\nexport { showCityPanel as __showCityPanel, hideCityPanel as __hideCityPanel, '
            + 'refreshCityPanelIfOpen as __refreshCityPanelIfOpen, clearCityPanelUxMode as __clearCityPanelUxMode };\n';
          changed = true;
        }
        return changed
          ? { contents: src, loader: 'ts', resolveDir: path.dirname(abs) }
          : null;
      });
    },
  };
}

function rawAssetPlugin() {
  return {
    name: 'garrison-raw-assets',
    setup(build) {
      build.onResolve({ filter: /\?raw$/ }, (args) => {
        const clean = args.path.slice(0, -4);
        const abs = path.isAbsolute(clean)
          ? clean
          : path.resolve(path.dirname(args.importer), clean);
        return { path: abs, namespace: 'garrison-raw-assets' };
      });
      build.onLoad({ filter: /.*/, namespace: 'garrison-raw-assets' }, (args) => ({
        contents: fs.readFileSync(args.path, 'utf8'),
        loader: 'text',
      }));
    },
  };
}

const ENTRY = path.join(TMP, 'entry.ts');
const OUT = path.join(TMP, 'bundle.js');
const entrySource = [
  `import { configureCityPanel, paintCityPanelSections, refreshCityPanelIfOpen, clearCityPanelUxMode, showCityPanel, hideCityPanel } from ${JSON.stringify(CITY_TS)};`,
  `import { attachHoverDetail, attachInteractiveDetail, setHoverDetailDocks } from ${JSON.stringify(HOVER_TS)};`,
  'window.__configureCityPanel = configureCityPanel;',
  'window.__paintCityPanelSections = paintCityPanelSections;',
  'window.__refreshCityPanelIfOpen = refreshCityPanelIfOpen;',
  'window.__clearCityPanelUxMode = clearCityPanelUxMode;',
  'window.__showCityPanel = showCityPanel;',
  'window.__hideCityPanel = hideCityPanel;',
  'window.__attachHoverDetail = attachHoverDetail;',
  'window.__attachInteractiveDetail = attachInteractiveDetail;',
  'window.__setHoverDetailDocks = setHoverDetailDocks;',
  '',
].join('\n');

async function buildBundle(mutations, tag) {
  fs.mkdirSync(TMP, { recursive: true });
  fs.writeFileSync(ENTRY, entrySource, 'utf8');
  const outfile = path.join(TMP, `bundle-${tag}.js`);
  await esbuild.build({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'browser',
    format: 'iife',
    target: 'es2020',
    outfile,
    absWorkingDir: GRA,
    loader: { '.ts': 'ts' },
    plugins: [sourcePlugin(mutations || {}), rawAssetPlugin()],
    logLevel: 'silent',
  });
  return fs.readFileSync(outfile, 'utf8');
}

async function launchBrowser() {
  try {
    return await chromium.launch({ headless: true });
  } catch (first) {
    return chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

const FIXTURE = `
(() => {
  const cityA = { id: 'city-a', ownerId: 0, q: 0, r: 0, name: 'Ateny', population: 6 };
  const cityB = { id: 'city-b', ownerId: 0, q: 3, r: 0, name: 'Sparta', population: 4 };
  const cities = [cityA, cityB];
  const map = {
    szerokoscQ: 8,
    wysokoscR: 8,
    seed: 42,
    riverPaths: [],
    hexes: {
      '0,0': { coords: { q: 0, r: 0 }, terenBazowy: 'rownina', nakladka: 'brak' },
      '3,0': { coords: { q: 3, r: 0 }, terenBazowy: 'rownina', nakladka: 'brak' },
    },
  };
  let units = [];
  window.__actions = [];
  window.__closeEvents = 0;
  window.__resetGarrison = () => {
    units = [
      { id: 'u1', nazwa: 'Wojownik', category: 'piechota', health: 100, maxHealth: 100, inGarnizon: true },
      { id: 'u2', nazwa: 'Wojownik', category: 'piechota', health: 100, maxHealth: 100, inGarnizon: true },
    ];
  };
  window.__unitCount = () => units.length;
  window.__resetGarrison();
  window.__fixtureError = null;
  try { window.__configureCityPanel({
    getCities: () => cities,
    getUnitsAt: (q, r) => cities.find((c) => c.q === q && c.r === r) === cityA ? units : [],
    getBuiltBuildingIds: () => [],
    getWorkedTiles: () => [],
    getProduction: () => ({ kolejka: [], postep: 0 }),
    getEpoch: () => 1,
    getTurn: () => 1,
    onSwitchCity: (id) => window.__actions.push({ kind: 'switch-city', id }),
    onLeaveGarrison: (id) => {
      const idx = units.findIndex((u) => u.id === id);
      if (idx >= 0) units.splice(idx, 1);
      window.__actions.push({ kind: 'leave-one', id });
      window.__refreshCityPanelIfOpen();
    },
    onLeaveAllGarrison: (q, r) => {
      const city = cities.find((c) => c.q === q && c.r === r);
      if (city === cityA) units = [];
      window.__actions.push({ kind: 'leave-all', q, r });
      window.__refreshCityPanelIfOpen();
    },
  }); } catch (e) { window.__fixtureError = String(e && e.stack || e); }
  window.__openCity = (which) => {
    window.__showCityPanel(which === 'b' ? cityB : cityA, map, () => { window.__closeEvents++; });
  };
  window.__cityA = cityA;
  window.__cityB = cityB;
})();
`;

async function preparePage(page, bundle) {
  await page.setContent('<!doctype html><html><head><style>html,body{margin:0;min-height:100%;background:#080c12;color:#eee}</style></head><body></body></html>');
  await page.addScriptTag({ content: bundle });
  await page.addScriptTag({ content: FIXTURE });
  if (await page.evaluate(() => typeof window.__openCity) !== 'function') {
    throw new Error('fixture did not install __openCity (configure=' + await page.evaluate(() => typeof window.__configureCityPanel) + ')');
  }
  await page.evaluate(() => window.__openCity('a'));
  await page.waitForTimeout(50);
}

async function snapshot(page) {
  return page.evaluate(() => {
    const dock = document.querySelector('.civ-ux-detail-dock-left');
    const card = dock?.querySelector('.detail-card');
    const label = document.querySelector('.civ-v-garrison-label');
    return {
      label: !!label,
      labelAria: label?.getAttribute('aria-label') ?? null,
      labelPressed: label?.getAttribute('aria-pressed') ?? null,
      labelPinnedClass: label?.classList.contains('is-pinned') ?? false,
      dockOpen: dock?.classList.contains('is-open') ?? false,
      card: !!card,
      cardText: card?.textContent ?? '',
      allButton: !!card?.querySelector('.civ-v-garrison-leave-all-btn'),
      oneButtons: card ? card.querySelectorAll('.civ-v-garrison-leave-btn:not(:disabled)').length : 0,
      engineUnitCount: typeof window.__unitCount === 'function' ? window.__unitCount() : null,
      leftRailButtons: document.querySelectorAll('.civ-ux-left-icon-rail .civ-v-icon-btn').length,
      visibleCity: document.querySelector('.civ-v-w3-city-name')?.textContent?.trim() ?? null,
    };
  });
}

async function exerciseScenario(page, options = {}) {
  const result = { before: null, afterClick: null, afterLeave: null, afterOne: null, afterAll: null, afterEnter: null, afterSpace: null, afterTab: null, afterCity: null, afterClose: null, actions: null };
  await page.evaluate(() => { window.__resetGarrison(); window.__openCity('a'); });
  await page.waitForTimeout(30);
  result.before = await snapshot(page);
  const label = page.locator('.civ-v-garrison-label');
  if (await label.count()) {
    await label.click();
    await page.waitForTimeout(40);
  }
  if (!NO_SHOTS && !options.mutant) {
    fs.mkdirSync(SHOTS_DIR, { recursive: true });
    await page.screenshot({ path: path.join(SHOTS_DIR, 'garrison-after-click.png') });
  }
  result.afterClick = await snapshot(page);
  await page.mouse.move(1150, 850);
  await page.waitForTimeout(1100);
  result.afterLeave = await snapshot(page);

  if (result.afterLeave.oneButtons > 0) {
    await page.locator('.civ-ux-detail-dock-left .civ-v-garrison-leave-btn:not(:disabled)').first().click();
    await page.waitForTimeout(50);
    result.afterOne = await snapshot(page);
  }
  const all = page.locator('.civ-ux-detail-dock-left .civ-v-garrison-leave-all-btn');
  if (await all.count()) {
    await all.click();
    await page.waitForTimeout(50);
    result.afterAll = await snapshot(page);
  }
  result.actions = await page.evaluate(() => window.__actions.slice());

  if (!options.mutant) {
    // Zmiana zakładki z lewego raila jest jawnym zamknięciem wspólnego docka.
    const close = page.locator('.civ-ux-detail-dock-left .civ-v-garrison-detail-close');
    if (await close.count()) await close.click();
    await page.waitForTimeout(20);

    // Enter i Space pozostają równoważnymi ścieżkami aktywacji istniejącego anchoru.
    for (const key of ['Enter', 'Space']) {
      await page.evaluate(() => window.__resetGarrison());
      const keyboardLabel = page.locator('.civ-v-garrison-label');
      await keyboardLabel.focus();
      await page.keyboard.press(key);
      await page.waitForTimeout(30);
      result[key === 'Enter' ? 'afterEnter' : 'afterSpace'] = await snapshot(page);
      const keyboardClose = page.locator('.civ-ux-detail-dock-left .civ-v-garrison-detail-close');
      if (await keyboardClose.count()) await keyboardClose.click();
      await page.waitForTimeout(20);
    }

    await page.evaluate(() => window.__resetGarrison());
    await page.locator('.civ-v-garrison-label').click();
    await page.waitForTimeout(30);
    const rail = page.locator('.civ-ux-left-icon-rail .civ-v-icon-btn');
    if (await rail.count() > 1) await rail.nth(1).click();
    await page.waitForTimeout(40);
    result.afterTab = await snapshot(page);

    // Nawigacja do drugiego miasta również nie może przenieść starego pinu.
    await page.evaluate(() => window.__resetGarrison());
    await page.locator('.civ-v-garrison-label').click();
    await page.waitForTimeout(30);
    const next = page.locator('#civ-v-city-next');
    if (await next.count()) await next.click({ force: true });
    await page.waitForTimeout(50);
    result.afterCity = await snapshot(page);

    await page.evaluate(() => window.__hideCityPanel());
    await page.waitForTimeout(30);
    result.afterClose = await snapshot(page);
  }
  return result;
}

function mutateRemoveGarrisonPinWiring() {
  const src = fs.readFileSync(CITY_TS, 'utf8');
  const needle = [
    '    pinOnActivate: () => {',
    '      pinGarrisonPanel(city.id, label);',
    '    },',
  ].join('\n');
  const mutated = src.replace(needle, '');
  return { src: mutated, matched: mutated !== src };
}

async function runGenericHoverNegative(page) {
  await page.evaluate(() => {
    document.body.innerHTML = '<div id="generic-anchor">generic</div><div id="generic-dock"></div>';
    const dock = document.getElementById('generic-dock');
    window.__setHoverDetailDocks({ left: dock });
    const anchor = document.getElementById('generic-anchor');
    window.__attachHoverDetail(anchor, () => {
      const card = document.createElement('div');
      card.className = 'detail-card';
      card.textContent = 'generic detail';
      return card;
    }, 10, 'left');
  });
  await page.hover('#generic-anchor');
  await page.waitForTimeout(80);
  const shown = await page.locator('#generic-dock .detail-card').count();
  await page.mouse.move(1150, 850);
  await page.waitForTimeout(500);
  const hidden = await page.locator('#generic-dock .detail-card').count();
  return { shown, hidden };
}

async function main() {
  const cleanBundle = await buildBundle({}, 'clean');
  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const consoleErrors = [];
  page.on('pageerror', (e) => { consoleErrors.push(String(e)); console.error('[pageerror]', String(e)); });
  page.on('console', (msg) => { if (msg.type() === 'error') { consoleErrors.push(msg.text()); console.error('[console.error]', msg.text()); } });

  try {
    await preparePage(page, cleanBundle);
    const clean = await exerciseScenario(page);
    check('(A1) realny DOM ma istniejący przycisk „Garnizon N”', clean.before.label, clean.before);
    check('(A2) kliknięcie sygnetu otwiera kartę w istniejącym leftDetailDock',
      clean.afterClick.card && clean.afterClick.dockOpen && clean.afterClick.labelPressed === 'true', clean.afterClick);
    check('(A3) po opuszczeniu sygnetu (>1 s) karta i lista nadal istnieją',
      clean.afterLeave.card && clean.afterLeave.allButton && clean.afterLeave.labelPinnedClass, clean.afterLeave);
    check('(A4) po opuszczeniu sygnetu akcja „Odfortyfikuj” nadal jest klikalna',
      clean.afterLeave.oneButtons > 0, clean.afterLeave);
    check('(A5) realne kliknięcie „Odfortyfikuj” wywołuje callback silnika i odświeża kartę',
      clean.afterOne?.card && clean.afterOne?.engineUnitCount === 1 && clean.actions?.some((a) => a.kind === 'leave-one'),
      { afterOne: clean.afterOne, actions: clean.actions });
    check('(A6) realne kliknięcie „Odfortyfikuj wszystkie” wywołuje callback silnika i usuwa listę',
      clean.afterAll?.card && clean.afterAll?.engineUnitCount === 0 && !clean.afterAll.allButton && clean.actions?.some((a) => a.kind === 'leave-all'),
      { afterAll: clean.afterAll, actions: clean.actions });
    check('(A7) Enter otwiera pinned kartę z aria-pressed=true',
      clean.afterEnter?.card && clean.afterEnter?.labelPressed === 'true', clean.afterEnter);
    check('(A8) Space otwiera pinned kartę z aria-pressed=true',
      clean.afterSpace?.card && clean.afterSpace?.labelPressed === 'true', clean.afterSpace);
    check('(B1) zmiana zakładki zamyka pinned garrison dock',
      clean.afterTab && !clean.afterTab.dockOpen && !clean.afterTab.card, clean.afterTab);
    check('(B2) zmiana miasta zamyka pinned garrison dock',
      clean.afterCity && clean.afterCity.visibleCity === 'Sparta' && !clean.afterCity.dockOpen && !clean.afterCity.card,
      clean.afterCity);
    check('(B3) zamknięcie panelu czyści pinned garrison state',
      clean.afterClose && !clean.afterClose.dockOpen && !clean.afterClose.card && clean.afterClose.label === false,
      clean.afterClose);
    const generic = await runGenericHoverNegative(page);
    check('(C) zwykły hover pozostaje nietrwały po opuszczeniu anchoru', generic.shown === 1 && generic.hidden === 0, generic);
    check('(E) brak pageerror/console.error w czystym scenariuszu', consoleErrors.length === 0, consoleErrors.slice(0, 8));

    const mutation = mutateRemoveGarrisonPinWiring();
    check('(D1) mutant usuwający wiring pinowania został przygotowany', mutation.matched, {
      expected: 'pinOnActivate + pinGarrisonPanel',
    });
    if (mutation.matched) {
      const mutantBundle = await buildBundle({ [CITY_TS]: mutation.src }, 'mutant-no-pin');
      const mutantPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      const mutantErrors = [];
      mutantPage.on('pageerror', (e) => mutantErrors.push(String(e)));
      mutantPage.on('console', (msg) => { if (msg.type() === 'error') mutantErrors.push(msg.text()); });
      await preparePage(mutantPage, mutantBundle);
      const mutant = await exerciseScenario(mutantPage, { mutant: true });
      check('(D2) po usunięciu wiring pinowania asercja trwałości faktycznie pada',
        !(mutant.afterLeave?.card && mutant.afterLeave?.allButton), mutant.afterLeave);
      check('(D3) mutant nie przechodzi tylko dzięki błędom JS', mutantErrors.length === 0, mutantErrors);
      await mutantPage.close();
    }
  } finally {
    await browser.close();
  }
  console.log(`\n[garrison-panel-pinning-real-render-test] ${pass} pass, ${fail} fail`);
  if (!NO_SHOTS) console.log('[shots] ' + SHOTS_DIR);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
