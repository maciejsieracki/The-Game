'use strict';
/**
 * R-REKRUTACJA-PANEL-WYSOKOSC-5-KART-Q1 — real Chromium gate.
 *
 * The fixture opens the production city frame, switches to REKRUTACJA, and measures
 * the real DOM at two viewport heights.  The source mutant restores the old capped
 * layout; it must fail the positive layout assertions while the clean source passes.
 * Bundles and screenshots stay outside the repository.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const CITY_TS = path.resolve(GRA, 'src/ui/cityPanel.ts');
const TMP_RUN_ID = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
const TMP = path.join(os.tmpdir(), `civ-recruitment-panel-height-${TMP_RUN_ID}`);
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
fs.mkdirSync(TMP, { recursive: true });

const esbuild = require(path.resolve(GRA, 'node_modules', 'esbuild'));
let chromium;
try {
  ({ chromium } = require(path.resolve(GRA, 'node_modules', 'playwright')));
} catch {
  console.error('[recruitment-panel-height] playwright missing — npm i -D playwright');
  process.exit(1);
}

const ARGV = process.argv.slice(2);
const NO_SHOTS = ARGV.includes('--no-shots');
const shotsArg = ARGV.indexOf('--shots-dir');
const SHOTS_DIR = shotsArg >= 0 && ARGV[shotsArg + 1]
  ? path.resolve(ARGV[shotsArg + 1])
  : path.join(os.tmpdir(), `civ-shots-recruitment-panel-height-${TMP_RUN_ID}`);

process.on('exit', () => {
  try { fs.rmSync(TMP, { recursive: true, force: true }); } catch { /* best effort */ }
});

let pass = 0;
let fail = 0;
function check(name, condition, detail) {
  if (condition) {
    pass++;
    console.log(`PASS: ${name}`);
  } else {
    fail++;
    console.log(`FAIL: ${name}${detail === undefined ? '' : ` — ${JSON.stringify(detail)}`}`);
  }
}

const J = JSON.stringify;
const LOADER_TS = path.resolve(GRA, 'src/data/loader.ts');
const CITIES_TS = path.resolve(GRA, 'src/game/cities.ts');
const HEX_TS = path.resolve(GRA, 'src/types/hex.ts');
const BROWSER_ENTRY_SRC = [
  `import { configureCityPanel, showCityPanel, hideCityPanel } from ${J(CITY_TS)};`,
  `import { loadGameData } from ${J(LOADER_TS)};`,
  `import { foundCityAt } from ${J(CITIES_TS)};`,
  `import { TerenBazowy, Nakladka } from ${J(HEX_TS)};`,
  'window.__configureCityPanel = configureCityPanel;',
  'window.__showCityPanel = showCityPanel;',
  'window.__hideCityPanel = hideCityPanel;',
  'window.__loadGameData = loadGameData;',
  'window.__foundCityAt = foundCityAt;',
  'window.__TerenBazowy = TerenBazowy;',
  'window.__Nakladka = Nakladka;',
].join('\n');

/** esbuild cannot evaluate Vite's import.meta.glob or *.svg?raw imports. */
function browserPlugin(mutations) {
  return {
    name: 'recruitment-panel-height-browser-compat',
    setup(build) {
      build.onResolve({ filter: /\.svg\?raw$/ }, (args) => ({
        path: args.path,
        namespace: 'recruitment-svg-raw',
      }));
      build.onLoad({ filter: /.*/, namespace: 'recruitment-svg-raw' }, () => ({
        contents: '',
        loader: 'text',
      }));
      build.onLoad({ filter: /\.ts$/ }, (args) => {
        const abs = path.resolve(args.path);
        let source = Object.prototype.hasOwnProperty.call(mutations, abs)
          ? mutations[abs]
          : fs.readFileSync(abs, 'utf8');
        if (source.includes('import.meta.glob')) {
          source = 'const __viteGlobStub = () => ({});\n'
            + source.replace(/import\.meta\.glob/g, '__viteGlobStub');
        }
        return { contents: source, loader: 'ts', resolveDir: path.dirname(abs) };
      });
    },
  };
}

async function buildBrowserBundle(mutations, tag) {
  const entry = path.join(TMP, `entry-${tag}.ts`);
  const out = path.join(TMP, `bundle-${tag}.js`);
  fs.writeFileSync(entry, BROWSER_ENTRY_SRC, 'utf8');
  await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    platform: 'browser',
    format: 'iife',
    target: 'es2020',
    outfile: out,
    absWorkingDir: GRA,
    loader: { '.ts': 'ts', '.json': 'json' },
    plugins: [browserPlugin(mutations)],
    logLevel: 'silent',
  });
  return fs.readFileSync(out, 'utf8');
}

async function launchBrowser() {
  try {
    return await chromium.launch({ headless: true });
  } catch (error) {
    console.log(`[recruitment-panel-height] default Chromium unavailable; fallback ${FALLBACK_CHROME}`);
    return chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

/** The fixture is evaluated in Chromium so callbacks remain real functions. */
const FIXTURE_SRC = `
window.__mountRecruitmentFixture = function () {
  document.body.innerHTML = '';
  const data = window.__loadGameData();
  const flatMap = { szerokoscQ: 20, wysokoscR: 20, hexes: {}, seed: 42, riverPaths: [] };
  for (let q = 0; q < 20; q++) for (let r = 0; r < 20; r++) {
    flatMap.hexes[q + ',' + r] = {
      coords: { q: q, r: r }, terenBazowy: window.__TerenBazowy.Rownina,
      nakladka: window.__Nakladka.Brak, ulepszenie: 'brak', wlasciciel: null,
      wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {},
      rzeka: { obecna: false, krawedzie: [] },
    };
  }
  const cities = [];
  const city = window.__foundCityAt(8, 8, 0, cities, flatMap, 'Testowo');
  if (!city) throw new Error('fixture city could not be founded');
  city.population = 10;
  const normalize = (value) => String(value || '')
    .normalize('NFD').replace(/[\\u0300-\\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  const keys = new Set([
    'drewno', 'kamien', 'glina', 'ruda', 'ruda_zelaza', 'ruda_cyny',
    'cegla', 'braz', 'zelazo', 'stal', 'konie', 'zywnosc',
  ]);
  for (const row of data.resources || []) {
    for (const value of [row.id, row.nazwa, row.name, row.Zasob]) {
      if (value) { keys.add(String(value)); keys.add(normalize(value)); }
    }
  }
  for (const row of data.units || []) {
    for (const value of [row.Surowiec, row['Surowiec (ilość)'] ? row.Surowiec : null]) {
      if (value) { keys.add(String(value)); keys.add(normalize(value)); }
    }
  }
  const stock = {};
  for (const key of keys) stock[key] = 1000000;
  city.surowce = { ...stock };
  cities.push(city);
  const allBuildings = [];
  for (const row of data.buildings || []) {
    for (const value of [row.id, row.nazwa, row.Budynek]) if (value) allBuildings.push(String(value));
  }
  const allTechs = (data.tech || []).map((row) => row.Technologia).filter(Boolean);
  const allResources = [...keys];
  const unit = (data.units || []).find((row) => row.Jednostka === 'Wojownik') || data.units[0];
  const queued = { kind: 'jednostka', id: unit.Jednostka, nazwa: unit.Jednostka, koszt: 10 };
  const production = { kolejka: [], postep: 0, rekrutacja: [queued] };
  window.__configureCityPanel({
    data: data,
    difficulty: 'normal',
    getCities: () => cities,
    getEpoch: () => 3,
    getUnlockedTechs: () => allTechs,
    getBuiltBuildingIds: () => allBuildings,
    getEmpireBuiltIds: () => allBuildings,
    getResourceAccess: () => allResources,
    getEmpireResourceAccess: () => allResources,
    getEmpireStock: () => stock,
    getProduction: () => production,
    getTreasury: () => 1000000,
    getEmpireRekruciTotal: () => 1000000,
    getManpowerSnapshot: () => ({ manpowerBiezacy: 1000000, manpowerMax: 1000000, kosztJednostki: 1, epoka: 3 }),
    getEmpireHud: () => ({
      pracaPool: 1000, pracaRate: 100, zloto: 1000000, zlotoRate: 100,
      nauka: 1000, naukaRate: 100, zywnoscReserve: 1000, zywnoscRate: 100,
      kultura: 100, kulturaRate: 10, religionStock: 100, religionRate: 10,
    }),
    getCivKey: () => 'grecy',
    getCivBonusy: () => [],
    getOwnerHasZlotoAccess: () => true,
    getCityHasCoastOrRiver: () => true,
    getCapitalCityId: () => city.id,
    getHasKopalniaNaZlozuZelaza: () => true,
    getPlacedImprovements: () => new Map(),
    getAliveUnitTypeNames: () => new Set(),
    getCityWorkedRange: () => 5,
    getWorkedTiles: () => [],
    getOwnerColor: () => 0x4f8cc9,
    getDifficulty: () => 'normal',
    getBuildingCostPace: () => 'niski',
    getKosztJednostekPace: () => 'niski',
    onPurchaseUnit: () => {},
    onCancelRecruitment: () => {},
    onChange: () => {},
  });
  window.__showCityPanel(city, flatMap, () => {});
  const recruitButton = [...document.querySelectorAll('.civ-v-icon-btn')]
    .find((button) => /Jednostki do rekrutacji/i.test(button.getAttribute('aria-label') || ''));
  if (!recruitButton) throw new Error('recruitment rail button missing');
  recruitButton.click();
  return { cityId: city.id };
};
`;

function rectOf(element) {
  if (!element) return null;
  const r = element.getBoundingClientRect();
  return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
}

function measureScript() {
  return `(() => {
    const panel = document.querySelector('#cs-units');
    const leftMain = document.querySelector('#cs-left-main');
    const body = panel && panel.querySelector('.civ-w4-tab-body');
    const list = panel && panel.querySelector('.list-scroll');
    const rows = panel ? [...panel.querySelectorAll('.unit-recruit-compact-row')] : [];
    const rect = (node) => {
      if (!node) return null;
      const r = node.getBoundingClientRect();
      return { left:r.left, top:r.top, right:r.right, bottom:r.bottom, width:r.width, height:r.height };
    };
    const style = (node) => node ? getComputedStyle(node) : null;
    const activeScrollbars = panel ? [...panel.querySelectorAll('*')].filter((node) => {
      const s = getComputedStyle(node);
      return (s.overflowY === 'auto' || s.overflowY === 'scroll')
        && node.scrollHeight > node.clientHeight + 1;
    }).map((node) => ({
      tag: node.tagName, id: node.id, className: node.className,
      clientHeight: node.clientHeight, scrollHeight: node.scrollHeight,
      overflowY: getComputedStyle(node).overflowY,
    })) : [];
    const rowRects = rows.map(rect);
    const listRect = rect(list);
    const bodyRect = rect(body);
    const panelRect = rect(panel);
    const visibleRows = listRect ? rowRects.filter((r) => r && r.top >= listRect.top - 1 && r.bottom <= listRect.bottom + 1) : [];
    const clippedRows = bodyRect ? rowRects.filter((r) => r && r.bottom > bodyRect.top && r.top < bodyRect.bottom) : [];
    const rowNames = rows.map((row) => row.querySelector('.bld-compact-name')?.textContent.trim() || '');
    const rowCostTexts = rows.map((row) => row.querySelector('.unit-compact-cost')?.textContent.trim() || '');
    const actionRects = rows.map((row) => rect(row.querySelector('.bld-compact-actions')));
    const visibleRowIndices = rowRects.map((r, i) => r && listRect
      && r.top >= listRect.top - 1 && r.bottom <= listRect.bottom + 1 ? i : -1)
      .filter((i) => i >= 0);
    const actionsStayInPanel = !!(panelRect && visibleRowIndices.every((i) => {
      const action = actionRects[i];
      return action && action.left >= panelRect.left - 1 && action.right <= panelRect.right + 1
        && action.top >= panelRect.top - 1 && action.bottom <= panelRect.bottom + 1;
    }));
    const manpowerStatusCount = rows.filter((row) => row.querySelector('.unit-recruit-manpower-summary')).length;
    const recruitButtonCount = rows.reduce((count, row) => count + row.querySelectorAll('button').length, 0);
    const fullHeight = !!(panelRect && rect(leftMain)
      && panelRect.top <= rect(leftMain).top + 3
      && panelRect.bottom >= rect(leftMain).bottom - 3);
    const listAtPanelEnd = !!(panelRect && listRect && panelRect.bottom - listRect.bottom <= 40);
    const cardsStayInPanel = !!(panelRect && listRect && listRect.left >= panelRect.left - 1
      && listRect.right <= panelRect.right + 1 && listRect.top >= panelRect.top - 1
      && listRect.bottom <= panelRect.bottom + 1
      && visibleRows.every((r) => r.left >= panelRect.left - 1
        && r.right <= panelRect.right + 1 && r.top >= panelRect.top - 1
        && r.bottom <= panelRect.bottom + 1));
    const noOverlap = rowRects.every((r, i) => !i || !rowRects[i - 1] || r.top >= rowRects[i - 1].bottom - 1);
    const exactlyOneActiveScrollbar = activeScrollbars.length === 1;
    const fiveFullCards = visibleRows.filter((r) => r.height > 20).length >= 5;
    return {
      panel: panelRect,
      leftMain: rect(leftMain),
      body: bodyRect,
      list: listRect,
      rows: rowRects,
      rowNames,
      rowCostTexts,
      rowCount: rows.length,
      visibleFullCardCount: visibleRows.filter((r) => r.height > 20).length,
      visibleClippedCardCount: clippedRows.length,
      actionsStayInPanel,
      manpowerStatusCount,
      recruitButtonCount,
      bodyScrollHeight: body ? body.scrollHeight : null,
      bodyClientHeight: body ? body.clientHeight : null,
      listScrollHeight: list ? list.scrollHeight : null,
      listClientHeight: list ? list.clientHeight : null,
      bodyOverflowY: style(body)?.overflowY || null,
      listOverflowY: style(list)?.overflowY || null,
      activeScrollbars,
      text: panel ? panel.textContent : '',
      fullHeight,
      listAtPanelEnd,
      cardsStayInPanel,
      noOverlap,
      exactlyOneActiveScrollbar,
      fiveFullCards,
      layoutPass: fullHeight && listAtPanelEnd && cardsStayInPanel && noOverlap
        && exactlyOneActiveScrollbar && fiveFullCards,
    };
  })()`;
}

async function renderAndMeasure(browser, bundle, tag, shotName) {
  const page = await browser.newPage({ viewport: { width: 900, height: 900 } });
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(String(error)));
  try {
    await page.setContent('<!doctype html><html><head><style>*{margin:0;padding:0;box-sizing:border-box;}body{background:#0b0f16;color:#eee;font-family:system-ui,sans-serif;}</style></head><body></body></html>');
    await page.addScriptTag({ content: bundle });
    await page.addScriptTag({ content: FIXTURE_SRC });
    const fixture = await page.evaluate(() => window.__mountRecruitmentFixture());
    await page.waitForTimeout(20);
    const large = await page.evaluate(measureScript());
    if (!NO_SHOTS) {
      fs.mkdirSync(SHOTS_DIR, { recursive: true });
      await page.screenshot({ path: path.join(SHOTS_DIR, `${tag}-${shotName}-large.png`), fullPage: false });
    }
    await page.setViewportSize({ width: 900, height: 620 });
    await page.waitForTimeout(20);
    const small = await page.evaluate(measureScript());
    if (!NO_SHOTS) {
      await page.screenshot({ path: path.join(SHOTS_DIR, `${tag}-${shotName}-small.png`), fullPage: false });
    }
    return { fixture, large, small, errors };
  } finally {
    await page.close();
  }
}

function makeOldLayoutMutant(source) {
  const currentCondition = "mount.classList.toggle('civ-v-left-main-split', tab === 'budowa' || tab === 'rekrutacja');";
  const oldCondition = "mount.classList.toggle('civ-v-left-main-split', tab === 'budowa');";
  if (source.includes(currentCondition)) return source.replace(currentCondition, oldCondition);
  const oldSplitCss = '.civ-v-left-main.civ-v-left-main-split{overflow:hidden;display:flex;flex-direction:column;padding-top:0;}';
  const mutatedSplitCss = '.civ-v-left-main.civ-v-left-main-split{overflow:hidden;display:block;flex-direction:column;padding-top:0;}';
  if (source.includes(oldSplitCss)) return source.replace(oldSplitCss, mutatedSplitCss);
  return source;
}

async function main() {
  const cleanSource = fs.readFileSync(CITY_TS, 'utf8');
  const mutantSource = makeOldLayoutMutant(cleanSource);
  check('(mutant) stary layout ma celowaną mutację', mutantSource !== cleanSource,
    'nie trafiono w warunek rekrutacji ani regułę split');

  const browser = await launchBrowser();
  try {
    const cleanBundle = await buildBrowserBundle({}, 'clean');
    const clean = await renderAndMeasure(browser, cleanBundle, 'clean', 'recruitment');
    console.log(`\n[clean-large] ${JSON.stringify(clean.large)}`);
    console.log(`[clean-small] ${JSON.stringify(clean.small)}`);
    check('(clean/large) co najmniej pięć pełnych kart bez nachodzenia',
      clean.large.fiveFullCards && clean.large.noOverlap && clean.large.actionsStayInPanel,
      { rowCount: clean.large.rowCount, visibleFullCardCount: clean.large.visibleFullCardCount,
        noOverlap: clean.large.noOverlap, actionsStayInPanel: clean.large.actionsStayInPanel });
    check('(clean/large) panel rekrutacji wypełnia wysokość kolumny', clean.large.fullHeight,
      { panel: clean.large.panel, leftMain: clean.large.leftMain });
    check('(clean/large) lista dochodzi do dolnej krawędzi panelu', clean.large.listAtPanelEnd,
      { panel: clean.large.panel, list: clean.large.list });
    check('(clean/large) dokładnie jeden aktywny scrollbar', clean.large.exactlyOneActiveScrollbar,
      clean.large.activeScrollbars);
    check('(clean/large) nagłówek, zasoby, filtry/stan, kolejka i przyciski zachowane',
      /Rekrutacja/.test(clean.large.text)
        && /Skarb/.test(clean.large.text)
        && /Dostępne/.test(clean.large.text)
        && /Kolejka/.test(clean.large.text)
        && /Rekrutuj/.test(clean.large.text)
        && /Rekruci: dostępne/.test(clean.large.text)
        && clean.large.manpowerStatusCount === clean.large.rowCount
        && clean.large.recruitButtonCount === clean.large.rowCount,
      clean.large.text.slice(0, 900));
    check('(clean/large) kolejność nazw jest stabilna po zmianie viewportu',
      clean.large.rowNames.join('|') === clean.small.rowNames.join('|'),
      { large: clean.large.rowNames, small: clean.small.rowNames });
    check('(clean) koszty kart są stabilne po zmianie viewportu',
      clean.large.rowCostTexts.join('|') === clean.small.rowCostTexts.join('|'),
      { large: clean.large.rowCostTexts, small: clean.small.rowCostTexts });
    check('(clean/small) lista przewija się i karty nie wychodzą poza panel',
      clean.small.listScrollHeight > clean.small.listClientHeight
        && clean.small.cardsStayInPanel
        && clean.small.actionsStayInPanel
        && clean.small.exactlyOneActiveScrollbar,
      { listScrollHeight: clean.small.listScrollHeight, listClientHeight: clean.small.listClientHeight,
        cardsStayInPanel: clean.small.cardsStayInPanel, actionsStayInPanel: clean.small.actionsStayInPanel,
        activeScrollbars: clean.small.activeScrollbars });
    check('(clean) zero pageerror/console.error', clean.errors.length === 0, clean.errors);

    if (mutantSource !== cleanSource) {
      const mutantBundle = await buildBrowserBundle({ [CITY_TS]: mutantSource }, 'mutant-old-layout');
      const mutant = await renderAndMeasure(browser, mutantBundle, 'mutant', 'old-layout');
      console.log(`\n[mutant-large] ${JSON.stringify(mutant.large)}`);
      check('(mutant) stary capped layout zapala czerwone asercje fill/scroll',
        mutant.large.layoutPass === false,
        { layoutPass: mutant.large.layoutPass, panel: mutant.large.panel, leftMain: mutant.large.leftMain,
          list: mutant.large.list, activeScrollbars: mutant.large.activeScrollbars });
      check('(mutant) zero pageerror/console.error', mutant.errors.length === 0, mutant.errors);
    }
  } finally {
    await browser.close();
  }
  console.log(`\nSUMMARY: ${pass} pass, ${fail} fail`);
  if (!NO_SHOTS) console.log(`[shots] ${SHOTS_DIR}`);
  process.exitCode = fail === 0 ? 0 : 1;
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exitCode = 1;
});
