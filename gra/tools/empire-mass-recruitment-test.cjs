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
const http = require('http');
const os = require('os');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const { chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'));

const GRA = path.resolve(__dirname, '..');
const PANEL = path.resolve(GRA, 'src', 'ui', 'empireDetailPanel.ts');
const CITY_PANEL = path.resolve(GRA, 'src', 'ui', 'cityPanel.ts');
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
  check('Army has a dedicated capital commander card above the city list',
    /data-general-recruitment-card/.test(src) && /mountGeneralRecruitment/.test(src)
      && /Wódz \/ Generał — rekrutacja w stolicy/.test(src));
  check('production main.ts wires the active owner capital into the Army commander renderer',
    /mountGeneralRecruitment:\s*\(host\)\s*=>\s*\{\s*const capitalId = capitalCityIdForOwner\(ME\(\)\);\s*return !!capitalId && mountGeneralRecruitmentCardForArmy\(capitalId, host\);\s*\}/s.test(main));

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
  configureEmpireMassRecruitment,
} from ${JSON.stringify(PANEL)};
import { configureCityPanel, mountGeneralRecruitmentCardForArmy, mountCityRecruitmentCardsForArmy, getArmyRecruitDraftTotal, getRecruitQuantityDraft, submitArmyRecruitmentDrafts, resetArmyRecruitDraftsSession } from ${JSON.stringify(CITY_PANEL)};
(window).__massRecruitment = { renderMassRecruitmentSection, mountMassRecruitmentControls, configureEmpireMassRecruitment };
(window).__cityPanel = { configureCityPanel, mountGeneralRecruitmentCardForArmy, mountCityRecruitmentCardsForArmy, getArmyRecruitDraftTotal, getRecruitQuantityDraft, submitArmyRecruitmentDrafts, resetArmyRecruitDraftsSession };
`, 'utf8');
}

const brandStubPlugin = {
  name: 'mass-recruitment-brand-stub',
  setup(build) {
    build.onResolve({ filter: /icons[\\/]brandAssets$/ }, (args) => ({
      path: args.path,
      namespace: 'mass-recruitment-brand-stub',
    }));
    build.onLoad({ filter: /.*/, namespace: 'mass-recruitment-brand-stub' }, () => {
      const brandSource = fs.readFileSync(path.resolve(GRA, 'src/ui/icons/brandAssets.ts'), 'utf8');
      const exports = [...brandSource.matchAll(/^export function (\w+)\s*\(/gm)].map(match => match[1]);
      return { contents: exports.map(name => `export function ${name}() { return ''; }`).join('\n'), loader: 'js' };
    });
  },
};

const exposeMountPlugin = {
  name: 'mass-recruitment-panel-loader',
  setup(build) {
    build.onResolve({ filter: /\.svg\?raw$/ }, args => ({ path: args.path, namespace: 'mass-recruitment-svg-raw' }));
    build.onLoad({ filter: /.*/, namespace: 'mass-recruitment-svg-raw' }, () => ({ contents: '', loader: 'text' }));
    build.onLoad({ filter: /\.ts$/ }, (args) => {
      let contents = fs.readFileSync(args.path, 'utf8');
      if (contents.includes('import.meta.glob')) contents = contents.replace(/import\.meta\.glob/g, '(() => ({}))');
      return { contents, loader: 'ts', resolveDir: path.dirname(args.path) };
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

  const server = http.createServer((_request, response) => {
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    response.end('<!doctype html><html><head></head><body></body></html>');
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  const browser = await launch();
  const page = await browser.newPage({ viewport: { width: 520, height: 900 } });
  await page.goto(`http://127.0.0.1:${address.port}/`);
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
    let leaderMounted = 0;
    const cities = rows.map((row, i) => ({
      id: row.cityId, ownerId: 0, name: row.name, q: i, r: 0, population: 10,
      manpower: 100000, surowce: { drewno: 100 },
    }));
    const capital = cities[0];
    const commanderOffer = { id: 'Wojownik', kind: 'jednostka', nazwa: 'Wojownik', koszt: 10, isGeneral: true };
    window.__cityPanel.configureCityPanel({
      data: { units: [{ Jednostka: 'Wojownik', Typ: 'Swordsman', 'Rola (linia)': 'Wręcz', 'Surowiec': 'Drewno', 'Surowiec (ilość)': 13 }], buildings: [], civs: [], tech: [] },
      getCities: () => cities,
      getEpoch: () => 1,
      getEmpireRekruciTotal: () => capital.manpower,
      getTreasury: () => 100,
      getGeneralRecruitmentOffer: cityId => cityId === 'city-1'
        ? { item: commanderOffer, alive: 0, queued: 0, limit: 1, title: 'Wódz' } : null,
      onPurchaseGeneral: () => { window.__purchaseCount++; return true; },
    });
    window.__purchaseCount = 0;
    window.__massRecruitment.configureEmpireMassRecruitment({ mountGeneralRecruitment: target => {
      leaderMounted++;
      return window.__cityPanel.mountGeneralRecruitmentCardForArmy('city-1', target);
    } });
    window.__massRecruitment.mountMassRecruitmentControls(host, { cityPobor: rows, massRecruitment: mass }, (cityId, target) => {
      mounted.push(cityId);
      return window.__cityPanel.mountCityRecruitmentCardsForArmy(cityId, target);
    });
    const hostRect = host.getBoundingClientRect();
    const cityEls = Array.from(host.querySelectorAll('[data-mass-recruitment-city]'));
    const rects = cityEls.map(el => el.getBoundingClientRect());
    const bodyRect = body.getBoundingClientRect();
    return {
      cityCount: cityEls.length,
      hasCounters: body.querySelector('[data-mass-recruitment-queued]')?.textContent === '27'
        && body.querySelector('[data-mass-recruitment-completed]')?.textContent === '12',
      cardCount: body.querySelectorAll('[data-mass-recruitment-cards] .unit-recruit-compact-row').length,
      commanderCount: body.querySelectorAll('[data-general-recruit]').length,
      capitalCityCommanderCount: body.querySelectorAll('[data-mass-recruitment-cards="city-1"] [data-general-recruit]').length,
      leaderMounted,
      realGeneralCard: (() => {
        const card = body.querySelector('[data-general-recruit="true"]');
        return !!card && !!card.querySelector('.unit-recruit-submit')
          && !!card.querySelector('.unit-recruit-compact-row, .unit-compact-head');
      })(),
      purchaseButtonCount: body.querySelectorAll('[data-general-recruit="true"] .unit-recruit-submit').length,
      leaderBeforeCity: (() => {
        const leader = body.querySelector('[data-general-recruitment-card] [data-general-recruit]');
        const firstCity = body.querySelector('[data-mass-recruitment-city]');
        return !!leader && !!firstCity && !!(leader.compareDocumentPosition(firstCity) & Node.DOCUMENT_POSITION_FOLLOWING);
      })(),
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
  check('production CityPanel renderer mounts ordinary city recruitment cards', manyCity.cardCount >= 24, manyCity.cardCount);
  eq(manyCity.commanderCount, 1, 'Army panel shows exactly one commander card');
  eq(manyCity.capitalCityCommanderCount, 0, 'capital city rows do not duplicate the Army-level commander');
  eq(manyCity.mountedCities.length, 24, 'each city id is passed to its shared CityPanel renderer');
  eq(manyCity.leaderMounted, 1, 'Army panel mounts the capital commander card once');
  check('Army commander section is the production commander card (not stand-in markup)', manyCity.realGeneralCard);
  eq(manyCity.purchaseButtonCount, 1, 'production commander card exposes one purchase button');
  await page.evaluate(() => document.querySelector('[data-general-recruit="true"] .unit-recruit-submit').click());
  eq(await page.evaluate(() => window.__purchaseCount), 1, 'one commander-card click invokes one purchase callback');
  check('Army panel shows the commander card before city recruitment lists', manyCity.leaderBeforeCity);
  check('Army does not show a unit dropdown', manyCity.hasDropdown === false);
  check('many-city rows fit the 404px panel', manyCity.maxCityWidth <= manyCity.hostWidth + 0.5, manyCity);
  check('many-city panel has no horizontal overflow', manyCity.bodyScrollWidth <= manyCity.bodyClientWidth + 1, manyCity);
  check('real Chromium gives the mounted card a visible layout', manyCity.visibleCard);

  // Two-city batch contract: per-city/type zero drafts, refresh-safe state, exact callback routing,
  // partial acceptance under a shared budget, and the lower Army button.
  const mountArmyFixture = () => page.evaluate(() => {
    if (!document.getElementById('body')) {
      document.body.innerHTML = '<div id="host" style="width:404px;position:relative;transform:none;pointer-events:auto;display:block;">'
        + '<div id="body" class="civ-emp-body"></div></div>';
    }
    window.__armyState = { gold: 1000, purchases: [] };
    const rows = [
      { cityId: 'athens', name: 'Ateny', massRecruitment: { options: [], queueCount: 0, waterAccess: true } },
      { cityId: 'sparta', name: 'Sparta', massRecruitment: { options: [], queueCount: 0, waterAccess: true } },
    ];
    const cities = rows.map((r, i) => ({ id: r.cityId, ownerId: 0, name: r.name, q: i, r: 0, population: 10,
      manpower: 100000, surowce: { drewno: 100, kamien: 100 } }));
    const data = { units: [
      { Jednostka: 'Wojownik', Typ: 'Swordsman', 'Rola (linia)': 'Wręcz', 'Surowiec': 'Drewno', 'Surowiec (ilość)': 1 },
      { Jednostka: 'Łucznik', Typ: 'Archer', 'Rola (linia)': 'Dystans', 'Surowiec': 'Kamień', 'Surowiec (ilość)': 1 },
    ], buildings: [], civs: [], tech: [] };
    window.__cityPanel.configureCityPanel({
      data, getCities: () => cities, getEpoch: () => 1,
      getEmpireRekruciTotal: () => 100000,
      getTreasury: () => window.__armyState.gold,
      onPurchaseUnit: (cityId, unitId, cost, quantity) => {
        window.__armyState.purchases.push([cityId, unitId, cost, quantity]);
        window.__armyState.gold -= cost * quantity;
        return true;
      },
    });
    window.__ordinaryRecruitDraft = window.__cityPanel.getRecruitQuantityDraft('athens', 'Wojownik');
    const body = document.getElementById('body');
    body.style.zoom = '150%';
    body.innerHTML = window.__massRecruitment.renderMassRecruitmentSection(rows, {
      ownerId: 0, treasury: 1000, manpower: 100000, stock: { Drewno: 100, Kamień: 100 }, queuedCount: 0, completedCount: 0,
    });
    const host = document.getElementById('host');
    window.__massRecruitment.mountMassRecruitmentControls(host, { cityPobor: rows, massRecruitment: {} },
      (cityId, target) => window.__cityPanel.mountCityRecruitmentCardsForArmy(cityId, target));
  });
  await mountArmyFixture();
  const armyRows = page.locator('#body [data-mass-recruitment-city]');
  const armyCard = (city, unit) => page.locator(`#body [data-mass-recruitment-city="${city}"] [data-army-recruit-unit="${unit}"]`);
  const armyDraft = async (city, unit) => Number(await armyCard(city, unit).locator('.unit-recruit-quantity-input').inputValue());
  const armyButtons = page.locator('#body [data-army-recruit-all]');
  eq(await armyRows.count(), 2, 'batch fixture has exactly two cities');
  check('Army per-city/per-type quantity drafts start at zero',
    await armyDraft('athens', 'Wojownik') === 0 && await armyDraft('sparta', 'Łucznik') === 0);
  check('both Army global buttons are present and disabled at zero', await armyButtons.count() === 2
    && await armyButtons.evaluateAll(buttons => buttons.every(button => button.disabled)));
  await armyCard('athens', 'Wojownik').locator('.unit-recruit-quantity-input').fill('2');
  await armyCard('sparta', 'Łucznik').locator('.unit-recruit-quantity-input').fill('1');
  check('city/type drafts do not overwrite each other', await armyDraft('athens', 'Wojownik') === 2
    && await armyDraft('sparta', 'Łucznik') === 1 && await armyDraft('athens', 'Łucznik') === 0);
  check('Army drafts are persisted outside the current renderer instance',
    await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('civ-army-recruit-drafts-v1') || '{}')).length === 2));
  eq(await page.evaluate(() => window.__ordinaryRecruitDraft), 1, 'ordinary City-panel recruitment still defaults to one');
  await page.reload();
  await page.addScriptTag({ path: BUNDLE });
  await mountArmyFixture();
  check('hard page refresh restores the two saved city/type quantities',
    await armyDraft('athens', 'Wojownik') === 2 && await armyDraft('sparta', 'Łucznik') === 1);
  await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('[data-mass-recruitment-city]'));
    rows.forEach(city => window.__cityPanel.mountCityRecruitmentCardsForArmy(city.dataset.massRecruitmentCity,
      city.querySelector('[data-mass-recruitment-cards]')));
  });
  check('re-mount preserves draft quantities', await armyDraft('athens', 'Wojownik') === 2 && await armyDraft('sparta', 'Łucznik') === 1);
  await armyButtons.last().scrollIntoViewIfNeeded();
  check('bottom Army button is visible and enabled after selections', await armyButtons.last().isVisible()
    && await armyButtons.last().isEnabled());
  await armyButtons.last().click();
  let armyState = await page.evaluate(() => JSON.parse(JSON.stringify(window.__armyState)));
  check('batch submits exact city, type, cost and quantity through existing callback',
    JSON.stringify(armyState.purchases) === JSON.stringify([['athens', 'Wojownik', 10, 2], ['sparta', 'Łucznik', 8, 1]]), armyState.purchases);
  check('fully accepted Army drafts clear and global buttons disable', await armyDraft('athens', 'Wojownik') === 0
    && await armyDraft('sparta', 'Łucznik') === 0 && await armyButtons.evaluateAll(buttons => buttons.every(button => button.disabled)));

  await page.evaluate(() => { window.__armyState.gold = 25; window.__armyState.purchases.length = 0; });
  await armyCard('athens', 'Wojownik').locator('.unit-recruit-quantity-input').fill('3');
  await armyButtons.first().click();
  armyState = await page.evaluate(() => JSON.parse(JSON.stringify(window.__armyState)));
  check('budget partial accepts two of three in the selected city/type',
    JSON.stringify(armyState.purchases) === JSON.stringify([['athens', 'Wojownik', 10, 2]]) && armyState.gold === 5, armyState);
  check('partial acceptance leaves exactly one draft and a clear message', await armyDraft('athens', 'Wojownik') === 1
    && /przyjęto 2 z 3/.test(await page.locator('[data-army-recruit-message]').innerText())
    && /nie przyjęto 1/.test(await page.locator('[data-army-recruit-message]').innerText()));
  await page.evaluate(() => { window.__armyState.gold = 100; window.__armyState.purchases.length = 0; });
  await armyCard('sparta', 'Łucznik').locator('.unit-recruit-quantity-input').fill('1');
  await page.setViewportSize({ width: 520, height: 1800 });
  await armyCard('sparta', 'Łucznik').locator('.unit-recruit-submit').scrollIntoViewIfNeeded();
  await armyCard('sparta', 'Łucznik').locator('.unit-recruit-submit').evaluate(button => button.click());
  armyState = await page.evaluate(() => JSON.parse(JSON.stringify(window.__armyState)));
  check('per-card Army purchase still uses the selected city/type and quantity',
    JSON.stringify(armyState.purchases) === JSON.stringify([['sparta', 'Łucznik', 8, 1]]), armyState.purchases);
  await page.evaluate(() => window.__cityPanel.resetArmyRecruitDraftsSession());
  check('new/load-game reset clears persisted Army drafts',
    await page.evaluate(() => localStorage.getItem('civ-army-recruit-drafts-v1') === null));

  await browser.close();
  await new Promise(resolve => server.close(resolve));
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
