'use strict';
/**
 * R-ARMY-RECRUITMENT-UI-20261028: real commander-card + production purchase contract.
 * Run from gra/: node tools/general-capital-recruitment-order-test.cjs
 *
 * The browser mounts cityPanel's production commander card. Its real button handler
 * crosses Playwright into the exact purchaseRecruitmentUnit body from main.ts; the
 * engine's persistence/economy functions are explicit test doubles. The general
 * preflight helper is also extracted from game/generals.ts (not reimplemented).
 *
 * R-WEB-TEST-DEBT-GENERAL-CAPITAL-RECRUIT-LOADER-Q1: the cut purchase body now gets its
 * helpers from the REAL sources, not from stubs:
 *   - pure modules (army-stack-limit, production, recruit-general, resource-ledger,
 *     army-leadership, human-owners, effective-difficulty-for-owner) are bundled by esbuild
 *     from src/ and their exports are injected by name;
 *   - helpers defined only inside main.ts (isMe, armyStackLimit, reservedUnitTypeNamesForOwner,
 *     effectiveGameDifficultyForOwner, unlockedTechsForOwner, productionAvailabilityCtxForCity)
 *     are copied VERBATIM from main.ts by signature (sliceMainFunction), not re-typed;
 *   - constants that exist only as literals in main.ts / battle/battleScene.ts are read from
 *     those literals (constFromSource), so a changed source value changes the test input.
 * Remaining test doubles are only the persistence/economy functions listed in makeHarness().
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
const BATTLE_SCENE = path.resolve(GRA, 'src/battle/battleScene.ts');
const mainSource = fs.readFileSync(MAIN, 'utf8');
const citySource = fs.readFileSync(CITY, 'utf8');
const generalsSource = fs.readFileSync(GENERALS, 'utf8');
const productionSource = fs.readFileSync(PRODUCTION, 'utf8');
const battleSceneSource = fs.readFileSync(BATTLE_SCENE, 'utf8');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'general-recruitment-ui-'));
const RAW_PLUGIN = require(path.resolve(__dirname, 'lib', 'esbuild-raw-plugin.cjs'));

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
    /onRecruit:\s*\(\)\s*=>\s*cfg\.onPurchaseGeneral\?\.\(cityId, offer\.item!\.id, offer\.item!\.koszt, 'army'\)/.test(citySource));
  check('production purchase invokes real commander preflight before ordinary payment',
    /opts\.isGeneral === true && opts\.generalGateChecked !== true/.test(mainSource)
      && /return attemptGeneralPurchase\(/.test(mainSource));
}

// R-WEB-SIEGE-BLOCKADE-NO-RECRUIT-REINFORCE-Q1: purchaseRecruitmentUnit wola produkcyjny predykat
// oblężenia. Ładujemy PRAWDZIWĄ funkcję z game/city-siege-state.ts (czysty moduł), nie kopię.
function loadCitySiegeModule() {
  const siegeSource = fs.readFileSync(path.resolve(GRA, 'src/game/city-siege-state.ts'), 'utf8');
  const code = esbuild.transformSync(siegeSource.replace(/^export\s+/gm, ''), { loader: 'ts', target: 'es2020' }).code;
  return new Function(`${code}\nreturn { isCityUnderSiege, CITY_SIEGE_RECRUIT_BLOCK_PL };`)();
}

/**
 * Bundles a REAL module from src/ with esbuild (same plugin as the other gra/tools harnesses)
 * and returns its exports. Nothing is re-typed; the module's own imports are bundled too.
 */
async function loadRealModule(relPath) {
  const built = await esbuild.build({
    entryPoints: [path.resolve(GRA, relPath)],
    bundle: true,
    format: 'cjs',
    platform: 'neutral',
    target: 'es2020',
    write: false,
    absWorkingDir: GRA,
    loader: { '.ts': 'ts', '.json': 'json' },
    plugins: [RAW_PLUGIN],
    logLevel: 'silent',
  });
  const mod = { exports: {} };
  // eslint-disable-next-line no-new-func
  new Function('module', 'exports', 'require', built.outputFiles[0].text)(mod, mod.exports, require);
  return mod.exports;
}

/** Verbatim copy of a top-level `    function NAME(...) {...}` from main.ts (located by signature). */
function sliceMainFunction(name) {
  const start = mainSource.indexOf(`\n    function ${name}(`);
  if (start < 0) throw new Error(`main.ts: brak definicji funkcji ${name}`);
  const end = mainSource.indexOf('\n    }\n', start);
  if (end < 0) throw new Error(`main.ts: nie znaleziono końca funkcji ${name}`);
  return mainSource.slice(start + 1, end + '\n    }'.length);
}

/** Literal value read from source text (throws when the declaration is missing). */
function constFromSource(source, pattern, label) {
  const match = pattern.exec(source);
  if (!match) throw new Error(`Nie znaleziono deklaracji: ${label}`);
  return match[1];
}

// Helpers that exist ONLY in main.ts and are called from the cut purchase body (or its dependencies).
const MAIN_ONLY_HELPERS = [
  'isMe',
  'armyStackLimit',
  'reservedUnitTypeNamesForOwner',
  'effectiveGameDifficultyForOwner',
  'unlockedTechsForOwner',
  'productionAvailabilityCtxForCity',
];

function extractBackend(deps) {
  const purchaseStart = mainSource.indexOf('function purchaseRecruitmentUnit(');
  const purchaseEnd = mainSource.indexOf('\n    /** Anulowanie opłaconej rekrutacji', purchaseStart);
  const helperStart = generalsSource.indexOf('export function attemptGeneralPurchase(');
  const helperEnd = generalsSource.indexOf('\n/** A newborn non-General unit', helperStart);
  const limitsStart = generalsSource.indexOf('export function generalLimitForEra(');
  const requestInterface = generalsSource.indexOf('export interface GeneralPurchaseRequest', limitsStart);
  if ([purchaseStart, purchaseEnd, helperStart, helperEnd, limitsStart, requestInterface].some(index => index < 0)) {
    throw new Error('Nie udało się wyciąć produkcyjnego preflightu/zakupu');
  }
  const mainHelpers = MAIN_ONLY_HELPERS.map(sliceMainFunction).join('\n');
  const transformed = esbuild.transformSync(
    `${generalsSource.slice(limitsStart, requestInterface).replace(/^export\s+/gm, '')}\n`
      + `${generalsSource.slice(helperStart, helperEnd).replace(/^export\s+/gm, '')}\n`
      + `${mainHelpers}\n`
      + `${mainSource.slice(purchaseStart, purchaseEnd)}`,
    { loader: 'ts', target: 'es2020' },
  ).code;
  const names = Object.keys(deps);
  // eslint-disable-next-line no-new-func
  return new Function(...names, `${transformed}\nreturn purchaseRecruitmentUnit;`)(...names.map(name => deps[name]));
}

// Real modules (bundled from src/) and literals read from source text. Filled by loadRealSources():
// esbuild.build is async, so the harness is built only after this has finished.
const REAL = {};
async function loadRealSources() {
  REAL.armyStackMod = await loadRealModule('src/game/army-stack-limit.ts');
  REAL.productionMod = await loadRealModule('src/game/production.ts');
  REAL.recruitGeneralMod = await loadRealModule('src/game/recruit-general.ts');
  REAL.resourceLedgerMod = await loadRealModule('src/game/resource-ledger.ts');
  REAL.armyLeadershipMod = await loadRealModule('src/game/army-leadership.ts');
  REAL.humanOwnersMod = await loadRealModule('src/game/human-owners.ts');
  REAL.effectiveDifficultyMod = await loadRealModule('src/game/effective-difficulty-for-owner.ts');
  REAL.MAX_PER_SIDE = Number(constFromSource(battleSceneSource, /\nconst MAX_PER_SIDE = (\d+);/, 'MAX_PER_SIDE (battleScene.ts)'));
  REAL.MENU_DIFFICULTY = constFromSource(mainSource, /let _menuDifficulty: [^=]+= '(\w+)';/, '_menuDifficulty (main.ts)');
  REAL.MENU_CITY_STATE_DIFFICULTY = constFromSource(mainSource, /let _menuCityStateDifficulty: [^=]+= '(\w+)';/, '_menuCityStateDifficulty (main.ts)');
  REAL.RECRUIT_FOLLOW_GENERAL_DEFAULT = constFromSource(mainSource, /let recruitFollowGeneralDefault = (true|false);/, 'recruitFollowGeneralDefault (main.ts)') === 'true';
  if (!mainSource.includes('const typCityCopyOwners = new Set<number>();')) {
    throw new Error('main.ts: zmieniono początkową wartość typCityCopyOwners (pusty zbiór)');
  }
}

/** Definicja pierwszej Super-jednostki z REALNYCH danych (data/units.json), nie wpisana na sztywno. */
function firstSuperUnitDef() {
  const list = JSON.parse(fs.readFileSync(path.resolve(GRA, 'data', 'units.json'), 'utf8'));
  const def = (Array.isArray(list) ? list : []).find(u => u['Super-jednostka'] === 'TAK');
  if (!def) throw new Error('data/units.json: brak definicji Super-jednostki');
  return def;
}

function makeHarness(stubOverrides = {}) {
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
  const unitProductionItem = () => ({ ...offer });
  const enqueueRecruitment = (prod, entry) => ({ ...prod, kolejka: [...prod.kolejka], rekrutacja: [...(prod.rekrutacja ?? []), entry] });
  const deps = {
    // Test doubles: persistence / economy / UI side effects (their values are not part of the recruitment ORDER).
    ownerTreasury: () => treasury,
    cities,
    cityHasCoastOrRiverAccess: () => true,
    showHintMessage: () => {},
    empireEpochForOwner: () => era,
    civManpowerMultsForOwner: () => ({ maxMult: 1, costMult: 1 }),
    canAffordUnitManpowerEmpire: () => true,
    unitProductionItem,
    data,
    civBonusyForOwnerId: () => [],
    player: { kosztJednostekPace: 'niski' },
    unitStockCost: unitDef => unitDef?.Jednostka === 'Wojownik' ? { drewno: 13 } : {},
    ownerResourceStockAll,
    pickUnitRecruitHint: stock => stock.drewno >= 13 ? null : 'Brakuje drewna',
    missingStockFor: (stock, cost) => Object.fromEntries(Object.entries(cost).filter(([key, need]) => (stock[key] ?? 0) < need)),
    stockResourceLabel: key => key,
    tryDeductUnitSpawnCostsEmpire: (_cities, cityId, ownerId, _era, _pop, _max, _unitId) => {
      const home = cities.find(c => c.id === cityId && c.ownerId === ownerId);
      if (!home || home.manpower < manpowerCost) return { ok: false, manpower: home?.manpower ?? 0 };
      home.manpower -= manpowerCost;
      return { ok: true, manpower: home.manpower };
    },
    unitManpowerCostForType: () => manpowerCost,
    empireManpowerCurrent,
    deductManpowerFromEmpire,
    UNIT_POPULATION_COST: 0,
    setOwnerTreasury: (_ownerId, value) => { treasury = value; },
    deductBuildingStockCostAcrossCities: (_cities, ownerId, costs) => {
      const home = cities.find(c => c.ownerId === ownerId);
      for (const [key, value] of Object.entries(costs)) home.surowce[key] -= value;
    },
    markCityStateDirty: () => { dirty++; },
    cityProd,
    enqueueRecruitment: (prod, entry) => { transactions++; return enqueueRecruitment(prod, entry); },
    updateHud: () => {},
    refreshCityPanelIfOpen: () => {},
    refundManpowerToEmpire: () => {},
    creditOwnerResourceStock: () => {},
    bestGeneralUnitForOwner: () => offer,
    units,
    // Capital = the only city of owner 0 (the harness city); no buildings are built in it, so the built-id set is empty.
    capitalCityIdForOwner: ownerId => ownerId === 0 ? 'capital' : undefined,
    empireBuiltIdsForOwner: () => new Set(),
    isCityUnderSiege: loadCitySiegeModule().isCityUnderSiege,
    CITY_SIEGE_RECRUIT_BLOCK_PL: loadCitySiegeModule().CITY_SIEGE_RECRUIT_BLOCK_PL,
    // Real values: literals from main.ts / battleScene.ts, real modules from src/.
    BATTLE_MAX_PER_SIDE: REAL.MAX_PER_SIDE,
    ME: () => REAL.humanOwnersMod.HUMAN_OWNER_PRIMARY,
    _menuDifficulty: REAL.MENU_DIFFICULTY,
    _menuCityStateDifficulty: REAL.MENU_CITY_STATE_DIFFICULTY,
    typCityCopyOwners: new Set(),
    recruitFollowGeneralDefault: REAL.RECRUIT_FOLLOW_GENERAL_DEFAULT,
    armyLeaderTitle: REAL.armyLeadershipMod.armyLeaderTitle,
    effectiveGameDifficultyForOwnerPure: REAL.effectiveDifficultyMod.effectiveGameDifficultyForOwnerPure,
    hexHasRoomFor: REAL.armyStackMod.hexHasRoomFor,
    stackLimitBlockMessage: REAL.armyStackMod.stackLimitBlockMessage,
    superUnitLimitViolation: REAL.productionMod.superUnitLimitViolation,
    SUPER_UNIT_LIMIT_BLOCK_PL: REAL.productionMod.SUPER_UNIT_LIMIT_BLOCK_PL,
    reservedUnitTypeNamesOfOwner: REAL.productionMod.reservedUnitTypeNamesOfOwner,
    recruitFollowGeneralForOrder: REAL.productionMod.recruitFollowGeneralForOrder,
    recruitRallyStamp: REAL.recruitGeneralMod.recruitRallyStamp,
    pendingLedgerSink: REAL.resourceLedgerMod.pendingLedgerSink,
  };
  const productionPurchase = extractBackend({ ...deps, ...stubOverrides });
  return {
    city, cities, data, offer, cityProd, units,
    purchase: (...args) => productionPurchase(...args),
    setManpowerCost: value => { manpowerCost = value; },
    setEra: value => { era = value; },
    // A living commander standing on the capital hex (real position/type, so it counts for the stack limit).
    addLivingGeneral: () => { units.push({ id: `general-${units.length + 1}`, typeId: 'Wojownik', ownerId: 0, isGeneral: true, q: city.q, r: city.r }); },
    // Own non-General unit standing on the capital hex (counts for the stack limit; not a General).
    addUnit: typeId => { units.push({ id: `unit-${units.length + 1}`, typeId, ownerId: 0, isGeneral: false, q: city.q, r: city.r }); },
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

/**
 * Mechanical proof for the remaining stubs (criterion b): the backend scenarios below are re-run with each
 * stub replaced by a different value. If the recorded outcomes differ from the baseline, the stub influences
 * the recruitment order and the check fails; identical outcomes show the value does not reach the verdict.
 */
const SENSITIVITY_VARIANTS = [
  ['cityHasCoastOrRiverAccess=false', { cityHasCoastOrRiverAccess: () => false }],
  ['civBonusyForOwnerId=[probe]', { civBonusyForOwnerId: () => ['__stub_probe__'] }],
  ['empireBuiltIdsForOwner=barracks+academy', { empireBuiltIdsForOwner: () => new Set(['koszary', 'akademia']) }],
  ['capitalCityIdForOwner=capital for every owner', { capitalCityIdForOwner: () => 'capital' }],
];

function backendOutcomes(harnessFactory) {
  const outcomes = [];
  const run = (label, build) => {
    const h = harnessFactory();
    const returned = build(h);
    outcomes.push({ label, returned, state: h.snapshot() });
  };
  run('plain purchase', h => h.purchase('capital', 'Wojownik', 5, 0, 1, { isGeneral: true }));
  run('non-capital', h => h.purchase('other-city', 'Wojownik', 5, 0, 1, { isGeneral: true }));
  run('era limit', h => { h.addLivingGeneral(); return h.purchase('capital', 'Wojownik', 5, 0, 1, { isGeneral: true }); });
  run('next era', h => { h.addLivingGeneral(); h.setEra(2); return h.purchase('capital', 'Wojownik', 5, 0, 1, { isGeneral: true }); });
  run('siege', h => { h.city.oblegane = true; return h.purchase('capital', 'Wojownik', 5, 0, 1, { isGeneral: true }); });
  return JSON.stringify(outcomes);
}

async function runStubSensitivity() {
  const baseline = backendOutcomes(() => makeHarness());
  for (const [name, overrides] of SENSITIVITY_VARIANTS) {
    let variant;
    try {
      variant = backendOutcomes(() => makeHarness(overrides));
    } catch (error) {
      variant = `threw: ${error && error.message}`;
    }
    check(`stub sensitivity: ${name} leaves all backend recruitment outcomes unchanged`, variant === baseline, variant === baseline ? undefined : { baseline, variant });
  }
}

async function browserCardTransaction(harness) {
  const entry = path.join(tmp, 'entry.ts');
  const bundle = path.join(tmp, 'bundle.js');
  fs.writeFileSync(entry, `
    import { configureCityPanel, mountGeneralRecruitmentCardForArmy } from ${JSON.stringify(CITY)};
    (window as any).__api = { configureCityPanel, mountGeneralRecruitmentCardForArmy };
  `);
  await esbuild.build({ entryPoints: [entry], bundle: true, platform: 'browser', format: 'iife', target: 'es2020',
    outfile: bundle, absWorkingDir: GRA, loader: { '.ts': 'ts', '.json': 'json' }, plugins: [BRAND_STUB], logLevel: 'silent' });
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || (require('./_chrome-path.cjs').resolveChromePath() || '/usr/bin/chromium'), args: ['--no-sandbox'] });
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
    await loadRealSources();
    await runStubSensitivity();
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
    const besieged = makeHarness();
    besieged.city.oblegane = true;
    const siegeRejected = besieged.purchase('capital', 'Wojownik', 5, 0, 1, { isGeneral: true });
    const afterSiege = besieged.snapshot();
    check('besieged capital rejects a General purchase without any resource or queue change',
      siegeRejected === false && afterSiege.queue.length === 0 && afterSiege.transactions === 0
        && afterSiege.treasury === 100, afterSiege);
    // GENCAP-LIMITS: limit stosu i limit Super-jednostki. Liczby czytane z kodu: REAL.MAX_PER_SIDE (battleScene.ts),
    // definicja Super-jednostki z data/units.json. Nie są wpisane na sztywno.
    check('stack limit constant read from battleScene.ts is a usable integer', Number.isInteger(REAL.MAX_PER_SIDE) && REAL.MAX_PER_SIDE > 1, REAL.MAX_PER_SIDE);
    const stackLimit = REAL.MAX_PER_SIDE;
    const belowLimit = makeHarness();
    for (let i = 0; i < stackLimit - 1; i++) belowLimit.addUnit('Wojownik');
    const belowAccepted = belowLimit.purchase('capital', 'Wojownik', 5, 0, 1);
    check('stack limit: a purchase is accepted while the capital hex holds limit-1 own units',
      belowAccepted === true && belowLimit.snapshot().queue.length === 1, belowLimit.snapshot());
    const fullStack = makeHarness();
    for (let i = 0; i < stackLimit; i++) fullStack.addUnit('Wojownik');
    const fullRejected = fullStack.purchase('capital', 'Wojownik', 5, 0, 1);
    const afterFullStack = fullStack.snapshot();
    check('stack limit: a purchase is rejected when the capital hex is at the limit, without resource or queue change',
      fullRejected === false && afterFullStack.treasury === 100 && afterFullStack.manpower === 1_000_000
        && afterFullStack.wood === 40 && afterFullStack.queue.length === 0 && afterFullStack.transactions === 0, afterFullStack);
    const superDef = firstSuperUnitDef();
    const superFree = makeHarness({ data: { units: [superDef] } });
    const superFreeAccepted = superFree.purchase('capital', superDef['Jednostka'], 5, 0, 1);
    check('super-unit: the first copy of a Super-jednostka is accepted when none is alive or queued',
      superFreeAccepted === true && superFree.snapshot().queue.length === 1, superFree.snapshot());
    const superAlive = makeHarness({ data: { units: [superDef] } });
    superAlive.addUnit(superDef['Jednostka']);
    const aliveRejected = superAlive.purchase('capital', superDef['Jednostka'], 5, 0, 1);
    const afterAlive = superAlive.snapshot();
    check('super-unit: a second copy is rejected while one is alive, without resource or queue change',
      aliveRejected === false && afterAlive.treasury === 100 && afterAlive.manpower === 1_000_000
        && afterAlive.wood === 40 && afterAlive.queue.length === 0 && afterAlive.transactions === 0, afterAlive);
    const superBatch = makeHarness({ data: { units: [superDef] } });
    const batchRejected = superBatch.purchase('capital', superDef['Jednostka'], 5, 0, 2);
    const afterBatch = superBatch.snapshot();
    check('super-unit: a batch of two copies is rejected by the one-per-civilization limit',
      batchRejected === false && afterBatch.treasury === 100 && afterBatch.queue.length === 0 && afterBatch.transactions === 0, afterBatch);
    console.log(`\ngeneral-capital-recruitment-order-test: ${failures === 0 ? 'PASS' : 'FAIL'} (${failures} failures)`);
    process.exitCode = failures ? 1 : 0;
  } catch (error) {
    console.error('[general-capital-recruitment-order-test] unexpected error:', error && error.stack || error);
    process.exitCode = 1;
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
})();
