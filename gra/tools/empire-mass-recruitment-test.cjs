'use strict';
/**
 * Real-DOM/real-Chromium gate for the empire mass-recruitment table.
 *
 * The production backend is intentionally tested through the existing source seam as well:
 * the UI test must not replace the atomic game mutation with a fake per-unit loop. The browser
 * part executes the actual exported panel renderer and control wiring, with a many-city fixture,
 * cost blockers, the water gate, and a one-unit click regression.
 *
 * Usage (from gra/): node tools/empire-mass-recruitment-test.cjs
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const { chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'));

const GRA = path.resolve(__dirname, '..');
const PANEL = path.resolve(GRA, 'src', 'ui', 'empireDetailPanel.ts');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'civ-mass-recruitment-'));
const ENTRY = path.join(tmp, 'entry.ts');
const BUNDLE = path.join(tmp, 'bundle.js');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let passed = 0;
let failed = 0;
function check(name, condition, detail) {
  if (condition) {
    passed++;
    console.log(`PASS: ${name}`);
  } else {
    failed++;
    console.log(`FAIL: ${name}${detail === undefined ? '' : ` — ${JSON.stringify(detail)}`}`);
  }
}
function eq(actual, expected, name) {
  check(name, actual === expected, { actual, expected });
}

function sourceGate() {
  const src = fs.readFileSync(PANEL, 'utf8');
  const main = fs.readFileSync(path.resolve(GRA, 'src', 'main.ts'), 'utf8');
  check('backend function remains present', /function purchaseRecruitmentUnits\(/.test(main));
  check('single-unit path remains present', /purchaseRecruitmentUnit\(/.test(main));
  check('UI action is configured from main', /configureEmpireMassRecruitment\(\{/.test(main));
  check('UI is rendered in the Armia block', /renderMassRecruitmentSection\(cp, snap\.massRecruitment\)/.test(src));
  check('queue and completed counters have stable DOM markers',
    /data-mass-recruitment-queued/.test(src) && /data-mass-recruitment-completed/.test(src));

  const fnStart = main.indexOf('function purchaseRecruitmentUnits(');
  const fnEnd = main.indexOf('\n    /** Anulowanie opłaconej rekrutacji', fnStart);
  const fn = main.slice(fnStart, fnEnd);
  const preflightEnd = fn.indexOf('// Atomic commit:');
  const preflight = fn.slice(0, preflightEnd);
  const commit = fn.slice(preflightEnd);
  const mutationNames = [
    'deductManpowerFromEmpire',
    'setOwnerTreasury',
    'deductBuildingStockCostAcrossCities',
    'cityProd.set',
  ];
  check('atomic backend has an explicit preflight/commit boundary', preflightEnd > 0);
  for (const name of mutationNames) {
    check(`${name} is after all-or-nothing preflight`,
      preflight.indexOf(name) === -1 && commit.indexOf(name) >= 0);
  }
  check('backend preflights gold, stock, manpower, and water',
    /ownerTreasury\(ownerId\) < totalGold/.test(preflight)
      && /canAffordBuildingStock\(ownerPool, totalStockCost\)/.test(preflight)
      && /empireManpowerCurrent\(cities, ownerId/.test(preflight)
      && /cityHasCoastOrRiverAccess\(city\)/.test(preflight));
}

function writeEntry() {
  fs.writeFileSync(ENTRY, `
import {
  renderMassRecruitmentSection,
  mountMassRecruitmentControls,
} from ${JSON.stringify(PANEL)};
(window).__massRecruitment = { renderMassRecruitmentSection, mountMassRecruitmentControls };
`, 'utf8');
}

const brandStubPlugin = {
  name: 'mass-recruitment-brand-stub',
  setup(build) {
    build.onResolve({ filter: /icons[\\/]brandAssets$/ }, (args) => ({
      path: args.path,
      namespace: 'mass-recruitment-brand-stub',
    }));
    build.onLoad({ filter: /.*/, namespace: 'mass-recruitment-brand-stub' }, () => ({
      contents: 'export function brandIconSvg() { return ""; }\nexport function mapResourceIconSvg() { return ""; }\n',
      loader: 'js',
    }));
  },
};

const exposeMountPlugin = {
  name: 'mass-recruitment-panel-loader',
  setup(build) {
    build.onLoad({ filter: /empireDetailPanel\\.ts$/ }, (args) => {
      if (path.resolve(args.path) !== PANEL) return null;
      return { contents: fs.readFileSync(args.path, 'utf8'), loader: 'ts', resolveDir: path.dirname(args.path) };
    });
  },
};

function unit(id, name, goldCost, manpowerCost, stockCost, requiresWater = false) {
  return { id, name, goldCost, manpowerCost, stockCost, requiresWater };
}
function row(cityId, options, waterAccess = true) {
  return {
    cityId,
    name: cityId,
    massRecruitment: { options, queueCount: 0, waterAccess },
  };
}
function state(overrides = {}) {
  return {
    ownerId: 0,
    treasury: 100,
    manpower: 100,
    stock: { Drewno: 100 },
    queuedCount: 4,
    completedCount: 9,
    ...overrides,
  };
}
function snap(rows, mass) {
  return { cityPobor: rows, massRecruitment: mass };
}

async function launch() {
  try {
    return await chromium.launch({ headless: true });
  } catch (first) {
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

async function browserGate() {
  writeEntry();
  await esbuild.build({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'browser',
    format: 'iife',
    target: 'es2020',
    outfile: BUNDLE,
    absWorkingDir: GRA,
    loader: { '.ts': 'ts', '.json': 'json' },
    plugins: [brandStubPlugin, exposeMountPlugin],
    logLevel: 'silent',
  });

  const browser = await launch();
  const page = await browser.newPage({ viewport: { width: 520, height: 900 } });
  await page.setContent(`<!doctype html><html><head></head><body>
    <div id="host" style="width:404px;position:relative;transform:none;pointer-events:auto;display:block;">
      <div id="body" class="civ-emp-body"></div>
    </div>
  </body></html>`);
  await page.addScriptTag({ path: BUNDLE });

  const manyCity = await page.evaluate(() => {
    const normal = {
      id: 'warrior', name: 'Wojownik', goldCost: 10, manpowerCost: 5,
      stockCost: { Drewno: 2 }, requiresWater: false,
    };
    const rows = Array.from({ length: 24 }, (_, i) => ({
      cityId: `city-${i + 1}`,
      name: `Miasto ${i + 1}`,
      massRecruitment: {
        options: [normal], queueCount: i % 3, waterAccess: true,
      },
    }));
    const mass = {
      ownerId: 0, treasury: 1000, manpower: 1000,
      stock: { Drewno: 1000 }, queuedCount: 27, completedCount: 12,
    };
    const body = document.getElementById('body');
    body.innerHTML = window.__massRecruitment.renderMassRecruitmentSection(rows, mass);
    const host = document.getElementById('host');
    window.__massRecruitment.mountMassRecruitmentControls(host, { cityPobor: rows, massRecruitment: mass }, () => true);
    const hostRect = host.getBoundingClientRect();
    const cityEls = Array.from(host.querySelectorAll('[data-mass-recruitment-city]'));
    const rects = cityEls.map(el => el.getBoundingClientRect());
    const bodyRect = body.getBoundingClientRect();
    return {
      cityCount: cityEls.length,
      hasCounters: body.querySelector('[data-mass-recruitment-queued]')?.textContent === '27'
        && body.querySelector('[data-mass-recruitment-completed]')?.textContent === '12',
      formCount: body.querySelectorAll('[data-mass-recruitment-submit]').length,
      maxCityWidth: Math.max(...rects.map(r => r.width)),
      hostWidth: hostRect.width,
      bodyScrollWidth: body.scrollWidth,
      bodyClientWidth: body.clientWidth,
      visibleForm: (() => {
        const rect = body.querySelector('[data-mass-recruitment-submit]').getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      })(),
    };
  });
  eq(manyCity.cityCount, 24, 'real Chromium renders one mass-recruitment row per city');
  check('real Chromium shows both empire counters', manyCity.hasCounters);
  eq(manyCity.formCount, 24, 'real Chromium renders selector/count/action for every city');
  check('many-city rows fit the 404px panel', manyCity.maxCityWidth <= manyCity.hostWidth + 0.5, manyCity);
  check('many-city panel has no horizontal overflow', manyCity.bodyScrollWidth <= manyCity.bodyClientWidth + 1, manyCity);
  check('mass-recruitment action has non-zero layout in Chromium', manyCity.visibleForm);

  const gateResults = await page.evaluate(() => {
    const host = document.getElementById('host');
    const body = document.getElementById('body');
    const opt = {
      id: 'warrior', name: 'Wojownik', goldCost: 10, manpowerCost: 5,
      stockCost: { Drewno: 2 }, requiresWater: false,
    };
    const renderCase = (rows, mass) => {
      body.innerHTML = window.__massRecruitment.renderMassRecruitmentSection(rows, mass);
      const calls = [];
      window.__massRecruitment.mountMassRecruitmentControls(
        host, { cityPobor: rows, massRecruitment: mass }, (cityId, itemId, count) => {
          calls.push({ cityId, itemId, count });
          return true;
        },
      );
      const city = body.querySelector('[data-mass-recruitment-city]');
      const button = city.querySelector('[data-mass-recruitment-submit]');
      const status = city.querySelector('[data-mass-recruitment-status]');
      return { disabled: button.disabled, status: status.textContent, button, calls };
    };
    const normalRow = (water = true, option = opt) => [{
      cityId: 'test-city', name: 'Test',
      massRecruitment: { options: [option], queueCount: 0, waterAccess: water },
    }];
    const gold = renderCase(normalRow(), {
      ownerId: 0, treasury: 5, manpower: 100, stock: { Drewno: 100 }, queuedCount: 0, completedCount: 0,
    });
    const stock = renderCase(normalRow(), {
      ownerId: 0, treasury: 100, manpower: 100, stock: { Drewno: 0 }, queuedCount: 0, completedCount: 0,
    });
    const manpower = renderCase(normalRow(), {
      ownerId: 0, treasury: 100, manpower: 0, stock: { Drewno: 100 }, queuedCount: 0, completedCount: 0,
    });
    const naval = renderCase(normalRow(false, {
      id: 'galley', name: 'Galera', goldCost: 10, manpowerCost: 5,
      stockCost: { Drewno: 2 }, requiresWater: true,
    }), {
      ownerId: 0, treasury: 100, manpower: 100, stock: { Drewno: 100 }, queuedCount: 0, completedCount: 0,
    });
    const ready = renderCase(normalRow(), {
      ownerId: 0, treasury: 100, manpower: 100, stock: { Drewno: 100 }, queuedCount: 0, completedCount: 0,
    });
    ready.button.click();
    const batch = renderCase(normalRow(), {
      ownerId: 0, treasury: 100, manpower: 100, stock: { Drewno: 100 }, queuedCount: 0, completedCount: 0,
    });
    const batchInput = batch.button.closest('[data-mass-recruitment-city]').querySelector('[data-mass-recruitment-count]');
    batchInput.value = '3';
    batchInput.dispatchEvent(new Event('input', { bubbles: true }));
    batch.button.click();
    return {
      gold: { disabled: gold.disabled, status: gold.status },
      stock: { disabled: stock.disabled, status: stock.status },
      manpower: { disabled: manpower.disabled, status: manpower.status },
      naval: { disabled: naval.disabled, status: naval.status },
      ready: { disabled: ready.disabled, calls: ready.calls },
      batch: { disabled: batch.disabled, calls: batch.calls },
    };
  });
  check('insufficient gold disables the action with a reason',
    gateResults.gold.disabled && /Za mało złota/.test(gateResults.gold.status), gateResults.gold);
  check('insufficient stock disables the action with a reason',
    gateResults.stock.disabled && /Za mało/.test(gateResults.stock.status), gateResults.stock);
  check('insufficient Manpower disables the action with a reason',
    gateResults.manpower.disabled && /Za mało Manpower/.test(gateResults.manpower.status), gateResults.manpower);
  check('missing water disables a naval action with a reason',
    gateResults.naval.disabled && /wody/.test(gateResults.naval.status), gateResults.naval);
  check('one-unit regression calls the backend once with count=1',
    !gateResults.ready.disabled && gateResults.ready.calls.length === 1
      && gateResults.ready.calls[0].count === 1, gateResults.ready);
  check('batch action calls the backend once with the requested count',
    !gateResults.batch.disabled && gateResults.batch.calls.length === 1
      && gateResults.batch.calls[0].count === 3, gateResults.batch);

  await browser.close();
}

(async () => {
  try {
    sourceGate();
    await browserGate();
    console.log(`\nempire-mass-recruitment-test: ${passed} passed, ${failed} failed`);
    process.exitCode = failed ? 1 : 0;
  } catch (error) {
    console.error('[empire-mass-recruitment-test] unexpected error:', error && error.stack || error);
    process.exitCode = 1;
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
})();
