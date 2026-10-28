'use strict';
/**
 * R-ARMY-RECRUITMENT-UI-20261028: real commander-card + production purchase contract.
 * Run from gra/: node tools/general-capital-recruitment-order-test.cjs
 *
 * The browser mounts cityPanel's production commander card. Its real button handler
 * crosses Playwright into the exact purchaseRecruitmentUnit body from main.ts; the
 * engine's persistence/economy functions are explicit test doubles. The general
 * preflight helper is also extracted from game/generals.ts (not reimplemented).
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const { chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'));

const GRA = path.resolve(__dirname, '..');
const MAIN = path.resolve(GRA, 'src/main.ts');
const CITY = path.resolve(GRA, 'src/ui/cityPanel.ts');
const GENERALS = path.resolve(GRA, 'src/game/generals.ts');
const PRODUCTION = path.resolve(GRA, 'src/game/production.ts');
const mainSource = fs.readFileSync(MAIN, 'utf8');
const citySource = fs.readFileSync(CITY, 'utf8');
const generalsSource = fs.readFileSync(GENERALS, 'utf8');
const productionSource = fs.readFileSync(PRODUCTION, 'utf8');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'general-recruitment-ui-'));

function check(name, condition, detail) {
  console.log(`${condition ? 'PASS' : 'FAIL'}: ${name}${condition || detail === undefined ? '' : ` — ${JSON.stringify(detail)}`}`);
  if (!condition) failures++;
}
let failures = 0;

function sourceChecks() {
  const offerStart = mainSource.indexOf('function generalRecruitmentOfferForCity(');
  const offerEnd = mainSource.indexOf('\n    /** Existing Generals keep', offerStart);
  const bestStart = mainSource.indexOf('function bestGeneralUnitForOwner(');
  const bestEnd = mainSource.indexOf('\n    function generalRecruitmentOfferForCity(', bestStart);
  const offer = mainSource.slice(offerStart, offerEnd);
  const best = mainSource.slice(bestStart, bestEnd);
  const uiStart = citySource.indexOf('export function mountGeneralRecruitmentCardForArmy(');
  const uiEnd = citySource.indexOf('\n/** Mount the exact city recruitment UI', uiStart);
  const cityRender = citySource.slice(uiEnd, citySource.indexOf('\nfunction recruitUnit(', uiEnd));
  check('production offer is capital-only', /city\.id !== capitalCityIdForOwner\(city\.ownerId\)/.test(offer));
  check('production commander candidate goes through purchasableUnits and city availability gates',
    /purchasableUnits\(/.test(best) && /productionAvailabilityCtxForCity\(capital\)/.test(best)
      && /unlockedTechsForOwner\(ownerId\)/.test(best));
  const availabilityStart = productionSource.indexOf('export function availableProduction(');
  const availabilityEnd = productionSource.indexOf('\nexport function ', availabilityStart + 1);
  const availability = productionSource.slice(availabilityStart, availabilityEnd);
  check('candidate availability still enforces current era, technology, and Barracks/Academy gates',
    /unitEpoch > epoch \|\| unitEpoch < epoch - 1/.test(availability)
      && /techs\.has\(tech\)/.test(availability)
      && /epochNumber\(u\.Epoka\) >= 2 && !built\.has\('koszary'\)/.test(availability));
  check('Stone commander offer follows Wheel-aware unit choice',
    /stoneGeneralUnitId\(hasWheel\)/.test(best) && /techs\.includes\('Koło'\)/.test(best));
  check('Stone Warrior commander remains available when a future national replacement hides the generic production card',
    /if \(!hasWheel && stoneLeaderId === 'Wojownik'\)/.test(best)
      && /unitProductionItem\(/.test(best));
  check('era commander offer is title/limit aware and respects queued plus living count',
    /generalLimitForEra\(empireEpochForOwner/.test(offer) && /canRecruitGeneral\(/.test(offer));
  const armyCityRendererStart = citySource.indexOf('export function mountCityRecruitmentCardsForArmy(');
  const armyCityRendererEnd = citySource.indexOf('\nfunction recruitUnit(', armyCityRendererStart);
  const armyCityRenderer = citySource.slice(armyCityRendererStart, armyCityRendererEnd);
  check('Army city renderer omits the separately mounted commander card',
    armyCityRendererStart >= 0 && !/mountGeneralRecruitmentCardForArmy\(/.test(armyCityRenderer)
      && /renderPurchasableUnits\(host, city, data,/.test(armyCityRenderer));
  check('production card forwards the selected commander offer to onPurchaseGeneral',
    /onRecruit:\s*\(\)\s*=>\s*cfg\.onPurchaseGeneral\?\.\(cityId, offer\.item!\.id, offer\.item!\.koszt\)/.test(citySource));
  check('production purchase invokes real commander preflight before ordinary payment',
    /opts\.isGeneral === true && opts\.generalGateChecked !== true/.test(mainSource)
      && /return attemptGeneralPurchase\(/.test(mainSource));
}

function extractBackend() {
  const purchaseStart = mainSource.indexOf('function purchaseRecruitmentUnit(');
  const purchaseEnd = mainSource.indexOf('\n    /** Anulowanie opłaconej rekrutacji', purchaseStart);
  const helperStart = generalsSource.indexOf('export function attemptGeneralPurchase(');
  const helperEnd = generalsSource.indexOf('\n/** A newborn non-General unit', helperStart);
  const limitsStart = generalsSource.indexOf('export function generalLimitForEra(');
  const requestInterface = generalsSource.indexOf('export interface GeneralPurchaseRequest', limitsStart);
  if ([purchaseStart, purchaseEnd, helperStart, helperEnd, limitsStart, requestInterface].some(index => index < 0)) {
    throw new Error('Nie udało się wyciąć produkcyjnego preflightu/zakupu');
  }
  const transformed = esbuild.transformSync(
    `${generalsSource.slice(limitsStart, requestInterface).replace(/^export\s+/gm, '')}\n`
      + `${generalsSource.slice(helperStart, helperEnd).replace(/^export\s+/gm, '')}\n`
      + `${mainSource.slice(purchaseStart, purchaseEnd)}`,
    { loader: 'ts', target: 'es2020' },
  ).code;
  const names = [
    'ownerTreasury', 'cities', 'cityHasCoastOrRiverAccess',
    'showHintMessage', 'empireEpochForOwner', 'civManpowerMultsForOwner',
    'canAffordUnitManpowerEmpire', 'unitProductionItem', 'data', 'civBonusyForOwnerId',
    'player', '_menuDifficulty', 'unitStockCost', 'ownerResourceStockAll', 'pickUnitRecruitHint',
    'missingStockFor', 'stockResourceLabel', 'tryDeductUnitSpawnCostsEmpire',
    'unitManpowerCostForType', 'empireManpowerCurrent', 'deductManpowerFromEmpire',
    'UNIT_POPULATION_COST', 'setOwnerTreasury', 'deductBuildingStockCostAcrossCities',
    'markCityStateDirty', 'cityProd', 'enqueueRecruitment', 'updateHud',
    'refreshCityPanelIfOpen', 'refundManpowerToEmpire', 'creditOwnerResourceStock',
    'bestGeneralUnitForOwner', 'units', 'capitalCityIdForOwner', 'armyLeaderTitle',
    'empireBuiltIdsForOwner',
  ];
  // eslint-disable-next-line no-new-func
  return new Function(...names, `${transformed}\nreturn purchaseRecruitmentUnit;`);
}

function makeHarness() {
  const city = { id: 'capital', ownerId: 0, name: 'Ateny', q: 0, r: 0, population: 10, manpower: 1_000_000, surowce: { drewno: 40 } };
  const cities = [city];
  const units = [];
  const cityProd = new Map();
  const data = { units: [{ Jednostka: 'Wojownik', Typ: 'Swordsman', 'Rola (linia)': 'Wręcz', 'Surowiec': 'Drewno', 'Surowiec (ilość)': 13 }] };
  const offer = { id: 'Wojownik', kind: 'jednostka', nazwa: 'Wojownik', koszt: 5, isGeneral: true };
  let treasury = 100;
  let transactions = 0;
  let dirty = 0;
  let manpowerCost = 1000;
  let era = 1;
  const empireManpowerCurrent = () => cities.reduce((sum, item) => sum + item.manpower, 0);
  const ownerResourceStockAll = (_cities, ownerId) => _cities.filter(c => c.ownerId === ownerId).reduce((pool, c) => {
    for (const [key, value] of Object.entries(c.surowce ?? {})) pool[key] = (pool[key] ?? 0) + value;
    return pool;
  }, {});
  const deductManpowerFromEmpire = (_cities, ownerId, _ep, amount) => {
    const home = cities.find(c => c.ownerId === ownerId);
    if (!home || home.manpower < amount) return false;
    home.manpower -= amount;
    return true;
  };
  const pool = () => ownerResourceStockAll(cities, 0);
  const unitProductionItem = () => ({ ...offer });
  const enqueueRecruitment = (prod, entry) => ({ ...prod, kolejka: [...prod.kolejka], rekrutacja: [...(prod.rekrutacja ?? []), entry] });
  const productionPurchase = extractBackend()(
    () => treasury,
    cities,
    () => true,
    () => {},
    () => era,
    () => ({ maxMult: 1, costMult: 1 }),
    () => true,
    unitProductionItem,
    data,
    () => [],
    { kosztJednostekPace: 'niski' },
    'normal',
    unitDef => unitDef?.Jednostka === 'Wojownik' ? { drewno: 13 } : {},
    ownerResourceStockAll,
    stock => stock.drewno >= 13 ? null : 'Brakuje drewna',
    (stock, cost) => Object.fromEntries(Object.entries(cost).filter(([key, need]) => (stock[key] ?? 0) < need)),
    key => key,
    (_cities, cityId, ownerId, _era, _pop, _max, _unitId) => {
      const home = cities.find(c => c.id === cityId && c.ownerId === ownerId);
      if (!home || home.manpower < manpowerCost) return { ok: false, manpower: home?.manpower ?? 0 };
      home.manpower -= manpowerCost;
      return { ok: true, manpower: home.manpower };
    },
    () => manpowerCost,
    empireManpowerCurrent,
    deductManpowerFromEmpire,
    0,
    (_ownerId, value) => { treasury = value; },
    (_cities, ownerId, costs) => {
      const home = cities.find(c => c.ownerId === ownerId);
      for (const [key, value] of Object.entries(costs)) home.surowce[key] -= value;
    },
    () => { dirty++; },
    cityProd,
    (prod, entry) => { transactions++; return enqueueRecruitment(prod, entry); },
    () => {},
    () => {},
    () => {},
    () => {},
    () => offer,
    units,
    ownerId => ownerId === 0 ? 'capital' : undefined,
    () => 'Wódz',
    () => [],
  );
  return {
    city, cities, data, offer, cityProd,
    purchase: (...args) => productionPurchase(...args),
    setManpowerCost: value => { manpowerCost = value; },
    setEra: value => { era = value; },
    addLivingGeneral: () => { units.push({ ownerId: 0, isGeneral: true }); },
    snapshot: () => ({
      treasury,
      manpower: city.manpower,
      wood: city.surowce.drewno,
      queue: cityProd.get('capital')?.rekrutacja ?? [],
      transactions,
      dirty,
    }),
  };
}

const BRAND_STUB = {
  name: 'general-recruitment-brand-stub',
  setup(build) {
    build.onResolve({ filter: /\.svg\?raw$/ }, args => ({ path: args.path, namespace: 'general-svg-raw' }));
    build.onLoad({ filter: /.*/, namespace: 'general-svg-raw' }, () => ({ contents: '', loader: 'text' }));
    build.onLoad({ filter: /\.ts$/ }, args => {
      let contents = fs.readFileSync(args.path, 'utf8');
      if (contents.includes('import.meta.glob')) contents = contents.replace(/import\.meta\.glob/g, '(() => ({}))');
      return { contents, loader: 'ts', resolveDir: path.dirname(args.path) };
    });
  },
};

async function browserCardTransaction(harness) {
  const entry = path.join(tmp, 'entry.ts');
  const bundle = path.join(tmp, 'bundle.js');
  fs.writeFileSync(entry, `
    import { configureCityPanel, mountGeneralRecruitmentCardForArmy } from ${JSON.stringify(CITY)};
    (window as any).__api = { configureCityPanel, mountGeneralRecruitmentCardForArmy };
  `);
  await esbuild.build({ entryPoints: [entry], bundle: true, platform: 'browser', format: 'iife', target: 'es2020',
    outfile: bundle, absWorkingDir: GRA, loader: { '.ts': 'ts', '.json': 'json' }, plugins: [BRAND_STUB], logLevel: 'silent' });
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || '/usr/bin/chromium', args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage({ viewport: { width: 600, height: 500 } });
    const errors = [];
    page.on('pageerror', error => errors.push(String(error)));
    await page.exposeFunction('purchaseGeneral', (cityId, itemId, cost) => harness.purchase(cityId, itemId, cost, 0, 1, { isGeneral: true }));
    await page.setContent('<!doctype html><html><body><div id="capital"></div></body></html>');
    await page.addScriptTag({ path: bundle });
    const result = await page.evaluate(({ city, data, offer }) => {
      const host = document.getElementById('capital');
      window.__api.configureCityPanel({
        data,
        getCities: () => [city],
        getEpoch: () => 1,
        getManpowerMultipliers: () => ({ maxMult: 1, costMult: 1 }),
        getEmpireRekruciTotal: () => city.manpower,
        getTreasury: () => 100,
        getGeneralRecruitmentOffer: id => id === 'capital' ? { item: offer, alive: 0, queued: 0, limit: 1, title: 'Wódz' } : null,
        onPurchaseGeneral: (...args) => { window.__purchaseDone = window.purchaseGeneral(...args); return window.__purchaseDone; },
      });
      const mounted = window.__api.mountGeneralRecruitmentCardForArmy('capital', host);
      const card = host.querySelector('[data-general-recruit="true"]');
      const button = card?.querySelector('.unit-recruit-submit');
      const beforeClick = { cards: host.querySelectorAll('[data-general-recruit="true"]').length, buttonDisabled: button?.disabled, label: card?.textContent };
      return { mounted, beforeClick, manpowerRequired: card?.querySelector('.unit-recruit-manpower')?.dataset.required };
    }, { city: harness.city, data: harness.data, offer: harness.offer });
    check('Chromium mounted the production commander card with an enabled recruit button',
      result.mounted && result.beforeClick.cards === 1 && result.beforeClick.buttonDisabled === false, result);
    check('production card label identifies the commander role', result.beforeClick.label.includes('Wódz'), result.beforeClick.label);
    harness.setManpowerCost(Number(result.manpowerRequired));
    const accepted = await page.evaluate(async () => {
      const button = document.querySelector('#capital [data-general-recruit="true"] .unit-recruit-submit');
      button?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      return await window.__purchaseDone;
    });
    check('production card click callback returned accepted', accepted === true, accepted);
    check('real card click invoked production handler without browser errors', errors.length === 0, errors);
    return Number(result.manpowerRequired);
  } finally {
    await browser.close();
  }
}

(async () => {
  try {
    sourceChecks();
    const h = makeHarness();
    const uiManpowerCost = await browserCardTransaction(h);
    const state = h.snapshot();
    check('one real purchase appends exactly one General queue entry', state.queue.length === 1 && state.transactions === 1, state);
    check('one purchase deducts exactly the offered gold, manpower, and stock once',
      state.treasury === 95 && state.manpower === 1_000_000 - uiManpowerCost && state.wood === 27, state);
    check('queued entry is marked as commander and has the visible title',
      state.queue[0]?.isGeneral === true && state.queue[0]?.nazwa === 'Wódz', state.queue[0]);
    check('purchase marks game state dirty once', state.dirty === 1, state.dirty);
    const blocked = makeHarness();
    const rejected = blocked.purchase('other-city', 'Wojownik', 5, 0, 1, { isGeneral: true });
    const afterRejected = blocked.snapshot();
    check('real general preflight rejects a non-capital city without changing resources or queue',
      rejected === false && afterRejected.treasury === 100 && afterRejected.manpower === 1_000_000
        && afterRejected.wood === 40 && afterRejected.queue.length === 0, afterRejected);
    const capped = makeHarness();
    capped.addLivingGeneral();
    const capRejected = capped.purchase('capital', 'Wojownik', 5, 0, 1, { isGeneral: true });
    const afterCap = capped.snapshot();
    check('real general preflight rejects a purchase after the current-era commander limit',
      capRejected === false && afterCap.treasury === 100 && afterCap.manpower === 1_000_000
        && afterCap.wood === 40 && afterCap.queue.length === 0, afterCap);
    const nextEra = makeHarness();
    nextEra.addLivingGeneral();
    nextEra.setEra(2);
    const secondEraPurchase = nextEra.purchase('capital', 'Wojownik', 5, 0, 1, { isGeneral: true });
    const afterNextEra = nextEra.snapshot();
    check('actual preflight expands the commander limit by one in the next era',
      secondEraPurchase === true && afterNextEra.queue.length === 1
        && afterNextEra.transactions === 1 && afterNextEra.treasury === 95, afterNextEra);
    console.log(`\ngeneral-capital-recruitment-order-test: ${failures === 0 ? 'PASS' : 'FAIL'} (${failures} failures)`);
    process.exitCode = failures ? 1 : 0;
  } catch (error) {
    console.error('[general-capital-recruitment-order-test] unexpected error:', error && error.stack || error);
    process.exitCode = 1;
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
})();
