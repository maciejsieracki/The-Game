'use strict';
/**
 * recruitment-panel-compact-row-test.cjs — R-WEB-REKRUTACJA-PANEL-UX-IMPL-Q1
 *
 * Real Chromium gate for the one-line recruitment row (variant A, owner choice
 * 2026-10-23). Mounts the REAL city frame (cityPanel.showCityPanel + cityUxFrame),
 * switches to REKRUTACJA and measures the rendered DOM at the three left-panel
 * widths produced by `cityUxFrame.ts` (`min(24vw,340px)`, `min-width:280px`):
 *   viewport 1440 px -> panel 340 px, 1280 px -> 307 px, 1100 px -> 280 px.
 *
 * Criteria (dispatch 00-dispatch.md):
 *   K1 row height <= 36 px (every row, every width);
 *   K2 at 340 px at least 12 of the first 13 rows fully visible in the list
 *      without scrolling, with the Production block above the panel;
 *   K3 at 340 px at most 2 of the first 13 names truncated (ellipsis), measured
 *      sub-pixel exact, both with a full pool and with a short pool ("brak N" shown);
 *   K4 no horizontal scrolling at 280 px (and 307/340): list/body/panel
 *      scrollWidth <= clientWidth, row content (cost/actions) inside the row;
 *   K5 recruit info kept (R-REKRUTACJA-KARTY-BRAK-REKRUTOW-Q1): exactly one
 *      empire pool line above the list, every row has a VISIBLE "needed"
 *      indicator with data-available/required/missing and a full tooltip;
 *      with a short pool every row shows a VISIBLE red "brak N" state.
 *
 * Baseline / negative control: `--baseline <git-ref>` bundles unitRecruitCard.ts
 * and cityPanel.ts from that ref (e.g. origin/main before this change). The old
 * two-row grid must FAIL K1/K2/K3 — the script then exits 0 only if it failed.
 *
 * Run from gra/:
 *   node tools/recruitment-panel-compact-row-test.cjs [--shots-dir DIR] [--no-shots]
 *   node tools/recruitment-panel-compact-row-test.cjs --baseline origin/main --shots-dir DIR
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const GRA = path.resolve(__dirname, '..');
const CITY_TS = path.resolve(GRA, 'src/ui/cityPanel.ts');
const CARD_TS = path.resolve(GRA, 'src/ui/unitRecruitCard.ts');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'civ-recruitment-compact-row-'));
const FALLBACK_CHROMIUM_CANDIDATES = [
  process.env.CHROME_PATH,
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);

const esbuild = require(path.resolve(GRA, 'node_modules', 'esbuild'));
let chromium;
try {
  ({ chromium } = require(path.resolve(GRA, 'node_modules', 'playwright')));
} catch {
  console.error('[recruitment-compact-row] playwright missing — npm i (gra/)');
  process.exit(1);
}

const ARGV = process.argv.slice(2);
const NO_SHOTS = ARGV.includes('--no-shots');
const argVal = (flag) => {
  const i = ARGV.indexOf(flag);
  return i >= 0 && ARGV[i + 1] ? ARGV[i + 1] : null;
};
const BASELINE = argVal('--baseline');
const SHOTS_DIR = argVal('--shots-dir')
  ? path.resolve(argVal('--shots-dir'))
  : path.join(TMP, 'shots');
const TAG = BASELINE ? 'przed' : 'po';

process.on('exit', () => {
  try { fs.rmSync(path.join(TMP, 'build'), { recursive: true, force: true }); } catch { /* best effort */ }
  // Keep TMP only when it holds this run's screenshots (default shots dir).
  if (argVal('--shots-dir') || NO_SHOTS) {
    try { fs.rmSync(TMP, { recursive: true, force: true }); } catch { /* best effort */ }
  }
});

let pass = 0;
let fail = 0;
const failed = [];
function check(name, condition, detail) {
  if (condition) {
    pass++;
    console.log(`PASS: ${name}`);
  } else {
    fail++;
    failed.push(name);
    console.log(`FAIL: ${name}${detail === undefined ? '' : ` — ${JSON.stringify(detail)}`}`);
  }
}

const J = JSON.stringify;
const LOADER_TS = path.resolve(GRA, 'src/data/loader.ts');
const CITIES_TS = path.resolve(GRA, 'src/game/cities.ts');
const HEX_TS = path.resolve(GRA, 'src/types/hex.ts');
const BROWSER_ENTRY_SRC = [
  `import { configureCityPanel, showCityPanel } from ${J(CITY_TS)};`,
  `import { loadGameData } from ${J(LOADER_TS)};`,
  `import { foundCityAt } from ${J(CITIES_TS)};`,
  `import { TerenBazowy, Nakladka } from ${J(HEX_TS)};`,
  'window.__configureCityPanel = configureCityPanel;',
  'window.__showCityPanel = showCityPanel;',
  'window.__loadGameData = loadGameData;',
  'window.__foundCityAt = foundCityAt;',
  'window.__TerenBazowy = TerenBazowy;',
  'window.__Nakladka = Nakladka;',
].join('\n');

/** esbuild cannot evaluate Vite's import.meta.glob or *.svg?raw imports. */
function browserPlugin(overrides) {
  return {
    name: 'recruitment-compact-row-browser-compat',
    setup(build) {
      build.onResolve({ filter: /\.svg\?raw$/ }, (args) => ({ path: args.path, namespace: 'svg-raw' }));
      build.onLoad({ filter: /.*/, namespace: 'svg-raw' }, () => ({ contents: '', loader: 'text' }));
      build.onLoad({ filter: /\.ts$/ }, (args) => {
        const abs = path.resolve(args.path);
        let source = Object.prototype.hasOwnProperty.call(overrides, abs)
          ? overrides[abs]
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

async function buildBundle(overrides) {
  const dir = path.join(TMP, 'build');
  fs.mkdirSync(dir, { recursive: true });
  const entry = path.join(dir, 'entry.ts');
  const out = path.join(dir, 'bundle.js');
  fs.writeFileSync(entry, BROWSER_ENTRY_SRC, 'utf8');
  await esbuild.build({
    entryPoints: [entry], bundle: true, platform: 'browser', format: 'iife', target: 'es2020',
    outfile: out, absWorkingDir: GRA, loader: { '.ts': 'ts', '.json': 'json' },
    plugins: [browserPlugin(overrides)], logLevel: 'silent',
  });
  return fs.readFileSync(out, 'utf8');
}

function baselineOverrides(ref) {
  const repoRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: GRA, encoding: 'utf8' }).trim();
  const out = {};
  for (const abs of [CITY_TS, CARD_TS]) {
    const rel = path.relative(repoRoot, abs).split(path.sep).join('/');
    out[abs] = execFileSync('git', ['show', `${ref}:${rel}`], { cwd: repoRoot, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  }
  return out;
}

async function launchBrowser() {
  try {
    return await chromium.launch({ headless: true });
  } catch {
    const fallback = FALLBACK_CHROMIUM_CANDIDATES.find(candidate => fs.existsSync(candidate));
    if (!fallback) throw new Error('No installed Chromium executable found');
    console.log(`[recruitment-panel-compact-row] fallback ${fallback}`);
    return chromium.launch({ headless: true, executablePath: fallback, args: ['--no-sandbox'] });
  }
}

/** Same real-data fixture as recruitment-panel-height-real-render-test.cjs; pool is a parameter. */
const FIXTURE_SRC = `
window.__mountRecruitmentFixture = function (poolSize) {
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
  const keys = new Set(['drewno', 'kamien', 'glina', 'ruda', 'ruda_zelaza', 'ruda_cyny',
    'cegla', 'braz', 'zelazo', 'stal', 'konie', 'zywnosc']);
  for (const row of data.resources || []) {
    for (const value of [row.id, row.nazwa, row.name, row.Zasob]) {
      if (value) { keys.add(String(value)); keys.add(normalize(value)); }
    }
  }
  for (const row of data.units || []) {
    if (row.Surowiec) { keys.add(String(row.Surowiec)); keys.add(normalize(row.Surowiec)); }
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
  // Production block above the panel: three queued recruitments (owner's screenshot shows a filled block).
  const production = { kolejka: [], postep: 0, rekrutacja: [queued, { ...queued }, { ...queued }] };
  window.__configureCityPanel({
    data: data, difficulty: 'normal',
    getCities: () => cities, getEpoch: () => 3,
    getUnlockedTechs: () => allTechs,
    getBuiltBuildingIds: () => allBuildings, getEmpireBuiltIds: () => allBuildings,
    getResourceAccess: () => allResources, getEmpireResourceAccess: () => allResources,
    getEmpireStock: () => stock, getProduction: () => production,
    getTreasury: () => 1000000,
    getEmpireRekruciTotal: () => poolSize,
    getManpowerSnapshot: () => ({ manpowerBiezacy: poolSize, manpowerMax: 1000000, kosztJednostki: 1, epoka: 3 }),
    getEmpireHud: () => ({
      pracaPool: 1000, pracaRate: 100, zloto: 1000000, zlotoRate: 100,
      nauka: 1000, naukaRate: 100, zywnoscReserve: 1000, zywnoscRate: 100,
      kultura: 100, kulturaRate: 10, religionStock: 100, religionRate: 10,
    }),
    getCivKey: () => 'grecy', getCivBonusy: () => [],
    getOwnerHasZlotoAccess: () => true, getCityHasCoastOrRiver: () => true,
    getCapitalCityId: () => city.id, getHasKopalniaNaZlozuZelaza: () => true,
    getPlacedImprovements: () => new Map(), getAliveUnitTypeNames: () => new Set(),
    getCityWorkedRange: () => 5, getWorkedTiles: () => [],
    getOwnerColor: () => 0x4f8cc9, getDifficulty: () => 'normal',
    getBuildingCostPace: () => 'niski', getKosztJednostekPace: () => 'niski',
    onPurchaseUnit: () => {}, onCancelRecruitment: () => {}, onChange: () => {},
  });
  window.__showCityPanel(city, flatMap, () => {});
  const recruitButton = [...document.querySelectorAll('.civ-v-icon-btn')]
    .find((button) => /Jednostki do rekrutacji/i.test(button.getAttribute('aria-label') || ''));
  if (!recruitButton) throw new Error('recruitment rail button missing');
  recruitButton.click();
  return { cityId: city.id };
};
`;

const MEASURE_SRC = `(() => {
  const panel = document.querySelector('#cs-units');
  const frameLeft = document.querySelector('.civ-ux-left');
  const body = panel && panel.querySelector('.civ-w4-tab-body');
  const list = panel && panel.querySelector('.list-scroll');
  const rows = panel ? [...panel.querySelectorAll('.unit-recruit-compact-row')] : [];
  const R = (n) => { if (!n) return null; const r = n.getBoundingClientRect();
    return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height }; };
  // Visible = rendered with a size AND not clipped by any overflow-hiding ancestor
  // (a "brak N" cut to "b" by the row's overflow:hidden is NOT visible).
  const visible = (n) => {
    if (!n) return false;
    const r = n.getBoundingClientRect();
    const s = getComputedStyle(n);
    if (!(r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none')) return false;
    for (let a = n.parentElement; a && a !== document.body; a = a.parentElement) {
      const as = getComputedStyle(a);
      if (as.overflowX !== 'visible' || as.overflowY !== 'visible') {
        const ar = a.getBoundingClientRect();
        if (r.left < ar.left - 1 || r.right > ar.right + 1) return false;
      }
      if (a.classList.contains('civ-ux-left')) break;
    }
    return true;
  };
  // Unconstrained text width: clone the name off-flow with white-space:nowrap and no width limit.
  const textWidth = (n) => {
    const probe = n.cloneNode(true);
    probe.style.cssText = 'position:absolute;visibility:hidden;left:-99999px;top:0;width:auto;max-width:none;'
      + 'min-width:0;overflow:visible;text-overflow:clip;white-space:nowrap;display:inline-block;padding:0;border:0;';
    n.parentElement.appendChild(probe);
    const w = probe.getBoundingClientRect().width;
    probe.remove();
    return w;
  };
  const contentWidth = (n) => {
    const st = getComputedStyle(n);
    return n.getBoundingClientRect().width - parseFloat(st.paddingLeft) - parseFloat(st.paddingRight)
      - parseFloat(st.borderLeftWidth) - parseFloat(st.borderRightWidth);
  };
  const listRect = R(list);
  const first = rows.slice(0, 13);
  const rowData = rows.map((row, i) => {
    const rr = R(row);
    const name = row.querySelector('.bld-compact-name');
    const cost = row.querySelector('.unit-compact-cost');
    const actions = row.querySelector('.bld-compact-actions');
    const status = row.querySelector('.unit-recruit-manpower');
    const summary = status && status.querySelector('.unit-recruit-manpower-summary');
    const missing = row.querySelector('.unit-recruit-manpower-missing');
    const submit = row.querySelector('.unit-recruit-submit');
    const cr = R(cost); const ar = R(actions);
    return {
      i, name: name ? name.textContent.trim() : '',
      height: rr.height,
      fullyVisible: !!listRect && rr.top >= listRect.top - 1 && rr.bottom <= listRect.bottom + 1,
      // Sub-pixel exact (Evaluator r1 zarzut 3): integer scrollWidth with a 1 px tolerance
      // missed names cut by < 2 px. Compare the laid-out text width (Range over the full
      // text, ignoring ellipsis rendering) with the name box content width.
      nameTruncated: !!name && (textWidth(name) > contentWidth(name) + 0.25
        || name.scrollWidth > name.clientWidth || name.clientWidth < 8),
      nameTextWidth: name ? Math.round(textWidth(name) * 10) / 10 : null,
      nameBoxWidth: name ? Math.round(contentWidth(name) * 10) / 10 : null,
      contentInsideRow: !!cr && !!ar && cr.left >= rr.left - 1 && ar.right <= rr.right + 1
        && cr.right <= ar.left + 1 && ar.top >= rr.top - 1 && ar.bottom <= rr.bottom + 1,
      widths: {
        row: Math.round(rr.width),
        text: Math.round(R(row.querySelector('.unit-compact-text')).width),
        cost: cr ? Math.round(cr.width) : null,
        stock: row.querySelector('.unit-recruit-stock') ? Math.round(R(row.querySelector('.unit-recruit-stock')).width) : 0,
        mp: status ? Math.round(R(status).width) : null,
        actions: ar ? Math.round(ar.width) : null,
      },
      submitVisible: visible(submit),
      costVisible: visible(cost)
        && [...row.querySelectorAll('.unit-recruit-stock .bld-infocard-chip')].every((c) => visible(c)),
      statusVisible: visible(status),
      statusSummaryText: summary ? summary.textContent.trim() : null,
      statusTitle: status ? status.title : null,
      statusData: status ? { a: status.dataset.available, r: status.dataset.required, m: status.dataset.missing } : null,
      statusIsMissing: !!status && status.classList.contains('is-missing'),
      missingVisible: visible(missing),
      missingText: missing ? missing.textContent.trim() : null,
      missingColor: missing ? getComputedStyle(missing).color : null,
    };
  });
  // Horizontal scrolling = a horizontally scrollable box (overflow-x auto/scroll, or the
  // document itself) whose content is wider than its viewport. Boxes with overflow-x
  // hidden/clip cannot be scrolled; for them K4 checks that rows stay inside the list.
  const scrollables = [document.scrollingElement, frameLeft, ...(frameLeft ? frameLeft.querySelectorAll('*') : [])]
    .filter(Boolean)
    .filter((n) => n === document.scrollingElement
      || ['auto', 'scroll'].includes(getComputedStyle(n).overflowX));
  const hScroll = scrollables
    .map((n) => ({ cls: String(n.className || n.tagName).slice(0, 60), sw: n.scrollWidth, cw: n.clientWidth }))
    .filter((x) => x.sw > x.cw + 1);
  const rowsInsideList = !!listRect && rows.every((row) => {
    const r = row.getBoundingClientRect();
    return r.left >= listRect.left - 1 && r.right <= listRect.right + 1;
  });
  const listInsidePanel = !!listRect && !!frameLeft && listRect.left >= frameLeft.getBoundingClientRect().left - 1
    && listRect.right <= frameLeft.getBoundingClientRect().right + 1;
  // Diagnostics: elements sticking out to the right of the tab body.
  const bodyRight = body ? body.getBoundingClientRect().right : Infinity;
  const overflowers = body ? [...body.querySelectorAll('*')].filter((n) => {
    const r = n.getBoundingClientRect();
    return r.width > 0 && r.right > bodyRight + 1 && !n.closest('.unit-recruit-compact-row');
  }).slice(0, 5).map((n) => String(n.className || n.tagName).slice(0, 50)) : [];
  const pools = panel ? [...panel.querySelectorAll('.unit-recruit-pool')] : [];
  const text = panel ? panel.innerText : '';
  return {
    viewport: { w: innerWidth, h: innerHeight },
    panelWidth: R(frameLeft) ? Math.round(R(frameLeft).width) : null,
    cardWidth: R(panel) ? Math.round(R(panel).width) : null,
    list: listRect,
    rowCount: rows.length,
    rows: rowData,
    maxRowHeight: Math.max(0, ...rowData.map((r) => r.height)),
    first13Visible: rowData.slice(0, 13).filter((r) => r.fullyVisible).length,
    first13Truncated: rowData.slice(0, 13).filter((r) => r.nameTruncated).map((r) => r.name),
    allTruncated: rowData.filter((r) => r.nameTruncated).length,
    allContentInside: rowData.every((r) => r.contentInsideRow && r.costVisible),
    allSubmitVisible: rowData.every((r) => r.submitVisible),
    hScroll,
    rowsInsideList,
    listInsidePanel,
    overflowers,
    rowWidth: rows[0] ? Math.round(rows[0].getBoundingClientRect().width) : null,
    poolCount: pools.length,
    poolVisible: pools.length === 1 && visible(pools[0]),
    poolText: pools[0] ? pools[0].textContent.trim() : null,
    poolAboveList: pools.length === 1 && !!listRect && pools[0].getBoundingClientRect().bottom <= listRect.top + 1,
    poolTextOccurrences: (text.match(/Rekruci: dostępne/g) || []).length,
  };
})()`;

const WIDTHS = [
  { label: '340', vw: 1440, expect: 340 },
  { label: '307', vw: 1280, expect: 307 },
  { label: '280', vw: 1100, expect: 280 },
];
const VH = 1080;

async function shot(page, name) {
  if (NO_SHOTS) return;
  fs.mkdirSync(SHOTS_DIR, { recursive: true });
  const box = await page.evaluate(() => {
    const n = document.querySelector('.civ-ux-left');
    if (!n) return null;
    const r = n.getBoundingClientRect();
    return { x: 0, y: 0, width: Math.ceil(r.right + 12), height: Math.ceil(innerHeight) };
  });
  const file = path.join(SHOTS_DIR, name);
  await page.screenshot({ path: file, clip: box || undefined, type: 'png' });
  console.log(`[shot] ${file} ${(fs.statSync(file).size / 1024).toFixed(0)} KB`);
}

async function measureAt(browser, bundle, width, poolSize, shotName) {
  const page = await browser.newPage({ viewport: { width: width.vw, height: VH }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  try {
    await page.setContent('<!doctype html><html><head><style>*{margin:0;padding:0;box-sizing:border-box;}body{background:#0b0f16;color:#eee;font-family:system-ui,sans-serif;}</style></head><body></body></html>');
    await page.addScriptTag({ content: bundle });
    await page.addScriptTag({ content: FIXTURE_SRC });
    await page.evaluate((p) => window.__mountRecruitmentFixture(p), poolSize);
    await page.waitForTimeout(30);
    const m = await page.evaluate(MEASURE_SRC);
    if (shotName) await shot(page, shotName);
    return { m, errors };
  } finally {
    await page.close();
  }
}

async function main() {
  const overrides = BASELINE ? baselineOverrides(BASELINE) : {};
  console.log(`[mode] ${BASELINE ? `BASELINE ${BASELINE} (oczekiwany FAIL K1-K3)` : 'clean (working tree)'}`);
  const bundle = await buildBundle(overrides);
  const browser = await launchBrowser();
  const summary = {};
  try {
    for (const w of WIDTHS) {
      const full = await measureAt(browser, bundle, w, 1000000, `${TAG}-rekrutacja-${w.label}px.png`);
      const m = full.m;
      summary[w.label] = {
        panelWidth: m.panelWidth, rowCount: m.rowCount, maxRowHeight: Math.round(m.maxRowHeight * 10) / 10,
        first13Visible: m.first13Visible, first13Truncated: m.first13Truncated.length,
        truncatedNames: m.first13Truncated, hScroll: m.hScroll.length,
        rowWidth: m.rowWidth, overflowers: m.overflowers,
      };
      console.log(`\n[${w.label}] ${JSON.stringify(summary[w.label])}`);
      check(`(${w.label}) panel ma oczekiwaną szerokość z cityUxFrame (±2 px)`,
        Math.abs(m.panelWidth - w.expect) <= 2, { panelWidth: m.panelWidth, expect: w.expect });
      // Current Iron-era Mycenae fixture exposes twelve legal production cards.
      // The former thirteen-card threshold was a stale roster assumption and
      // rejected the valid live catalog after the unit availability changes.
      check(`(${w.label}) lista ma wszystkie 12 oczekiwanych wierszy`, m.rowCount >= 12, m.rowCount);
      check(`(${w.label}) K1: wysokość każdego wiersza <= 36 px`, m.maxRowHeight <= 36,
        m.rows.map((r) => Math.round(r.height)));
      check(`(${w.label}) K4: brak poziomego przewijania; wiersze w liście, lista w panelu`,
        m.hScroll.length === 0 && m.rowsInsideList && m.listInsidePanel,
        { hScroll: m.hScroll, rowsInsideList: m.rowsInsideList, listInsidePanel: m.listInsidePanel });
      check(`(${w.label}) K4: koszt i akcje mieszczą się w wierszu, Rekrutuj widoczny`,
        m.allContentInside && m.allSubmitVisible,
        m.rows.filter((r) => !r.contentInsideRow || !r.submitVisible || !r.costVisible).map((r) => ({ n: r.name, w: r.widths })));
      check(`(${w.label}) K5: jedna linia puli rekrutów nad listą, tekst nie powtarza się na kartach`,
        m.poolCount === 1 && m.poolVisible && m.poolAboveList && m.poolTextOccurrences === 1
          && /^Rekruci: dostępne 1 mln$/.test(m.poolText || ''),
        { poolCount: m.poolCount, poolVisible: m.poolVisible, poolAboveList: m.poolAboveList,
          occurrences: m.poolTextOccurrences, poolText: m.poolText });
      check(`(${w.label}) K5: każdy wiersz ma widoczny wskaźnik potrzebnych rekrutów z pełnym tooltipem`,
        m.rows.every((r) => r.statusVisible && r.statusData && r.statusData.a === '1000000'
          && r.statusData.m === '0' && /^Rekruci: dostępne 1 mln \/ potrzebne \S+/.test(r.statusTitle || '')
          && r.statusSummaryText && !r.statusIsMissing && r.missingText === null),
        m.rows.filter((r) => !r.statusVisible).map((r) => r.name));
      if (w.label === '340') {
        check('(340) K2: >= 12 z 13 pierwszych wierszy widocznych w całości pod blokiem Produkcji',
          m.first13Visible >= 12, { first13Visible: m.first13Visible, list: m.list });
        check('(340) K3: ucięte nazwy <= 2 z 13', m.first13Truncated.length <= 2, m.first13Truncated);
      }
      check(`(${w.label}) zero pageerror/console.error`, full.errors.length === 0, full.errors);

      // Short pool: every row must show a visible, red "brak N" state.
      const short = await measureAt(browser, bundle, w, 1000, w.label === '280' ? `${TAG}-rekrutacja-280px-brak-rekrutow.png` : null);
      const s = short.m;
      summary[w.label].shortFirst13Truncated = s.first13Truncated.length;
      summary[w.label].shortTruncatedNames = s.first13Truncated;
      console.log(`[${w.label}/brak] ucięte nazwy: ${s.first13Truncated.length}/13 ${JSON.stringify(s.first13Truncated)}`);
      if (w.label === '340') {
        // Evaluator r1 zarzut 4: "brak N" takes room from the name — K3 must hold in this state too.
        check('(340) K3 przy braku rekrutów: ucięte nazwy <= 2 z 13', s.first13Truncated.length <= 2, s.first13Truncated);
      }
      // Rows needing more than the pool (1000) must show "brak N"; rows needing <= 1000
      // (e.g. Zwiadowca, koszt 0) must NOT show a false shortfall.
      const shortRows = s.rows.filter((r) => r.statusData && Number(r.statusData.r) > 1000);
      const okRows = s.rows.filter((r) => r.statusData && Number(r.statusData.r) <= 1000);
      check(`(${w.label}) K5: przy puli 1 tys. każdy wiersz z niedoborem pokazuje widoczny, czerwony „brak N”`,
        s.rowCount >= 12 && shortRows.length >= s.rowCount - 1 && shortRows.every((r) => r.statusVisible && r.statusIsMissing
          && r.missingVisible && /^brak \S+/.test(r.missingText || '') && r.missingColor === 'rgb(232, 138, 122)'
          && /^Rekruci: dostępne 1 tys\. \/ potrzebne \S+.* — brakuje \S+/.test(r.statusTitle || '')
          && Number(r.statusData.m) === Number(r.statusData.r) - 1000),
        { shortRows: shortRows.length,
          bad: shortRows.filter((r) => !(r.statusVisible && r.missingVisible)).map((r) => ({ n: r.name, t: r.missingText })) });
      check(`(${w.label}) K5: wiersze bez niedoboru nie pokazują fałszywego braku`,
        okRows.every((r) => r.statusVisible && !r.statusIsMissing && r.missingText === null && r.statusData.m === '0'),
        okRows.map((r) => ({ n: r.name, d: r.statusData, t: r.missingText })));
      check(`(${w.label}) przy braku rekrutów: K1 <= 36 px i brak poziomego przewijania`,
        s.maxRowHeight <= 36 && s.hScroll.length === 0 && s.allContentInside && s.rowsInsideList,
        { maxRowHeight: s.maxRowHeight, hScroll: s.hScroll,
          clipped: s.rows.filter((r) => !r.contentInsideRow || !r.costVisible).map((r) => ({ n: r.name, w: r.widths })) });
      check(`(${w.label}) zero pageerror/console.error (brak rekrutów)`, short.errors.length === 0, short.errors);
    }
  } finally {
    await browser.close();
  }
  console.log(`\n[summary] ${JSON.stringify(summary)}`);
  console.log(`\nSUMMARY${BASELINE ? ' [BASELINE]' : ''}: ${pass} pass, ${fail} fail`);
  if (!NO_SHOTS) console.log(`[shots] ${SHOTS_DIR}`);
  if (BASELINE) {
    // Negative control: the old layout must fail the core layout criteria.
    const coreFailed = failed.some((n) => /K1|K2|K3/.test(n));
    console.log(`[baseline] K1/K2/K3 czerwone na ${BASELINE}: ${coreFailed ? 'TAK (oczekiwane)' : 'NIE (test nie rozróżnia!)'}`);
    process.exitCode = coreFailed ? 0 : 1;
  } else {
    process.exitCode = fail === 0 ? 0 : 1;
  }
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exitCode = 1;
});
