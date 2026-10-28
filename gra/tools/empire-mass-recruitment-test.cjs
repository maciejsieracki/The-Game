'use strict';
/**
 * Real-DOM/real-Chromium gate for city-grouped recruitment cards in Army.
 *
 * Army must expose one city section per city and mount that city's shared CityPanel recruitment
 * card list instead of a unit dropdown. Card behavior/gates are covered by cityPanel's own
 * real-DOM recruitment tests.
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
const FALLBACK_CHROME = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || '/usr/bin/chromium';

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
  check('Army mounts the shared CityPanel recruitment renderer',
    /mountCityRecruitmentCardsForArmy\(cityId, host\)/.test(main)
      && /mountCityRecruitmentCardsForArmy/.test(fs.readFileSync(path.resolve(GRA, 'src', 'ui', 'cityPanel.ts'), 'utf8')));
  check('UI is rendered in the Armia block', /renderMassRecruitmentSection\(cp, snap\.massRecruitment\)/.test(src));
  check('queue and completed counters have stable DOM markers',
    /data-mass-recruitment-queued/.test(src) && /data-mass-recruitment-completed/.test(src));
  check('Army no longer renders a unit dropdown', !/data-mass-recruitment-unit/.test(src));
  check('Army exposes per-city card mount points', /data-mass-recruitment-cards/.test(src));

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
    const rows = Array.from({ length: 24 }, (_, i) => ({
      cityId: `city-${i + 1}`,
      name: `Miasto ${i + 1}`,
      massRecruitment: { options: [], queueCount: i % 3, waterAccess: true },
    }));
    const mass = {
      ownerId: 0, treasury: 1000, manpower: 1000,
      stock: { Drewno: 1000 }, queuedCount: 27, completedCount: 12,
    };
    const body = document.getElementById('body');
    body.innerHTML = window.__massRecruitment.renderMassRecruitmentSection(rows, mass);
    const host = document.getElementById('host');
    const mounted = [];
    window.__massRecruitment.mountMassRecruitmentControls(host, { cityPobor: rows, massRecruitment: mass }, (cityId, target) => {
      mounted.push(cityId);
      const row = document.createElement('div');
      row.className = 'unit-recruit-compact-row';
      row.innerHTML = '<button class="unit-recruit-submit">Rekrutuj</button>';
      target.appendChild(row);
      return true;
    });
    const hostRect = host.getBoundingClientRect();
    const cityEls = Array.from(host.querySelectorAll('[data-mass-recruitment-city]'));
    const rects = cityEls.map(el => el.getBoundingClientRect());
    const bodyRect = body.getBoundingClientRect();
    return {
      cityCount: cityEls.length,
      hasCounters: body.querySelector('[data-mass-recruitment-queued]')?.textContent === '27'
        && body.querySelector('[data-mass-recruitment-completed]')?.textContent === '12',
      cardCount: body.querySelectorAll('.unit-recruit-compact-row').length,
      hasDropdown: body.querySelector('select') !== null,
      mountedCities: mounted,
      maxCityWidth: Math.max(...rects.map(r => r.width)),
      hostWidth: hostRect.width,
      bodyScrollWidth: body.scrollWidth,
      bodyClientWidth: body.clientWidth,
      visibleCard: (() => {
        const rect = body.querySelector('.unit-recruit-compact-row').getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      })(),
    };
  });
  eq(manyCity.cityCount, 24, 'real Chromium renders one mass-recruitment row per city');
  check('real Chromium shows both empire counters', manyCity.hasCounters);
  eq(manyCity.cardCount, 24, 'Army mounts a recruitment-card list under each city');
  eq(manyCity.mountedCities.length, 24, 'each city id is passed to its shared CityPanel renderer');
  check('Army does not show a unit dropdown', manyCity.hasDropdown === false);
  check('many-city rows fit the 404px panel', manyCity.maxCityWidth <= manyCity.hostWidth + 0.5, manyCity);
  check('many-city panel has no horizontal overflow', manyCity.bodyScrollWidth <= manyCity.bodyClientWidth + 1, manyCity);
  check('real Chromium gives the mounted card a visible layout', manyCity.visibleCard);

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
