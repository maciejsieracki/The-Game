'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync, spawn } = require('node:child_process');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const DIST = '/tmp/civ-general-purchase-runtime';
const CHROME = process.env.CHROMIUM_PATH
  || (fs.existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : '/opt/pw-browsers/chromium-1194/chrome-linux/chrome');
let pass = 0, fail = 0;
function check(label, ok, detail) {
  if (ok) { pass++; console.log('PASS: ' + label); }
  else { fail++; console.error('FAIL: ' + label + (detail ? ' — ' + JSON.stringify(detail) : '')); }
}

async function main() {
  execFileSync('node', ['./node_modules/vite/bin/vite.js', 'build', '--config', 'tools/generals-purchase-runtime.vite.config.ts'], {
    cwd: ROOT, stdio: 'inherit',
  });
  const browser = await chromium.launch({
    headless: true,
    executablePath: fs.existsSync(CHROME) ? CHROME : undefined,
    args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage({ viewport: { width: 1365, height: 900 } });
  const errors = [];
  const server = spawn('python3', ['-m', 'http.server', '18741', '--directory', DIST, '--bind', '127.0.0.1'], { stdio: 'ignore' });
  page.on('pageerror', e => errors.push(String(e)));
  try {
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.goto('http://127.0.0.1:18741/', { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(() => window.__generalRuntime?.ready, undefined, { timeout: 30000 });
    await page.evaluate(() => window.__generalRuntime.start(981041));
    await page.waitForFunction(() => window.__generalRuntime && document.querySelector('canvas'), undefined, { timeout: 180000 });
    const founded = await page.evaluate(() => window.__generalRuntime.foundCity());
    check('real game initialized and capital city founded', founded === 'ok', founded);
    const setup = await page.evaluate(() => window.__generalRuntime.prepare());
    if (setup.error) throw new Error(JSON.stringify(setup));
    const { capitalId, offer } = setup;
    check('runtime exposes an actual best-unit General offer', !!offer?.item?.id && Number.isFinite(offer.item.koszt), offer);

    const beforeNonCapital = await page.evaluate(id => window.__generalRuntime.snapshot(id, ''), capitalId);
    const colonyId = await page.evaluate(id => window.__generalRuntime.addNonCapital(id), capitalId);
    const acceptedNonCapital = await page.evaluate(args => window.__generalRuntime.purchase(args.city, args.item, args.cost), {
      city: colonyId, item: offer.item.id, cost: offer.item.koszt,
    });
    const afterNonCapital = await page.evaluate(id => window.__generalRuntime.snapshot(id, ''), capitalId);
    check('real purchase transaction rejects non-capital with no resource or queue mutation',
      acceptedNonCapital === false && JSON.stringify(beforeNonCapital) === JSON.stringify(afterNonCapital),
      { acceptedNonCapital, beforeNonCapital, afterNonCapital });

    const before = await page.evaluate(id => window.__generalRuntime.snapshot(id, ''), capitalId);
    const accepted = await page.evaluate(args => window.__generalRuntime.purchase(args.city, args.item, args.cost), {
      city: capitalId, item: offer.item.id, cost: offer.item.koszt,
    });
    const after = await page.evaluate(id => window.__generalRuntime.snapshot(id, ''), capitalId);
    check('real capital purchase succeeds and queues exactly one General',
      accepted === true && after.queue.length === before.queue.length + 1
        && after.queue.filter(x => x.isGeneral).length === 1
        && after.generalCount === before.generalCount,
      { accepted, before, after });
    check('real purchase deducts the quoted treasury amount and required stock/Manpower',
      before.treasury - after.treasury === offer.item.koszt
        && after.manpower < before.manpower
        && Object.entries(before.stock).some(([key, value]) => (after.stock[key] ?? 0) < value),
      { before: { treasury: before.treasury, manpower: before.manpower, stock: before.stock },
        after: { treasury: after.treasury, manpower: after.manpower, stock: after.stock } });

    const capRetry = await page.evaluate(args => window.__generalRuntime.purchase(args.city, args.item, args.cost), {
      city: capitalId, item: offer.item.id, cost: offer.item.koszt,
    });
    const afterCapRetry = await page.evaluate(id => window.__generalRuntime.snapshot(id, ''), capitalId);
    check('real purchase transaction rejects a second General at the era cap',
      capRetry === false && afterCapRetry.queue.length === after.queue.length,
      { capRetry, queue: afterCapRetry.queue });

    await page.evaluate(() => window.__generalRuntime.finishRecruitmentByTurn());
    await page.waitForFunction(id => window.__generalRuntime.snapshot(id, '').generalCount === 1,
      capitalId, { timeout: 180000, polling: 250 });
    const generalSpawn = await page.evaluate(id => window.__generalRuntime.snapshot(id, ''), capitalId);
    check('queued General spawns through the live end-turn recruitment pipeline',
      generalSpawn.generalCount === 1 && generalSpawn.general?.isGeneral === true
        && !generalSpawn.queue.some(x => x.isGeneral), generalSpawn);

    const cityHex = await page.evaluate(id => {
      const state = window.__generalRuntime.snapshot(id, '');
      return { q: state.general.q, r: state.general.r };
    }, capitalId);
    const recruitFollow = await page.evaluate(({ id, cityHex }) => {
      const chosen = window.__generalRuntime.spawnRecruitThroughRuntime(id, cityHex.q + 2, cityHex.r);
      return chosen;
    }, { id: capitalId, cityHex });
    check('runtime post-spawn hook assigns a new recruit to the General live position',
      !!recruitFollow?.dest?.generalTargetId
        && recruitFollow.dest.generalTargetId === recruitFollow.general.id
        && recruitFollow.dest.destQ === recruitFollow.general.q
        && recruitFollow.dest.destR === recruitFollow.general.r,
      { recruitFollow, errors });

    const batchSetup = await page.evaluate(id => window.__generalRuntime.prepareRoutableRecruitmentCities(id, 'Taran', 3), capitalId);
    check('real map has three separated recruitment cities with routable multi-turn paths to the General',
      batchSetup.cityIds?.length === 3 && batchSetup.routes?.length === 3
        && batchSetup.routes.every(route => route.length > 0), batchSetup);
    const batchPurchases = await page.evaluate(args => window.__generalRuntime.queueArmyPanelBatchAcrossCities(
      args.cityIds, args.unit,
    ), { cityIds: batchSetup.cityIds ?? [], unit: 'Taran' });
    check('Army-panel purchase callback queues one paid unit at each of three cities',
      batchPurchases.length === 3 && batchPurchases.every(x => x.accepted && x.queued === 1), batchPurchases);
    await page.evaluate(() => window.__generalRuntime.completeProductionTurn());
    await page.waitForFunction(cityIds => {
      const state = window.__generalRuntime.spawnedBatchSnapshot(cityIds);
      return state.spawned.length === 3 && !state.endTurnInProgress
        && state.spawned.every(unit => unit.march?.generalTargetId === state.spawned[0]?.march?.generalTargetId);
    }, batchSetup.cityIds, { timeout: 180000, polling: 250 });
    const batchAfterTurn = await page.evaluate(ids => window.__generalRuntime.spawnedBatchSnapshot(ids), batchSetup.cityIds);
    check('real end-turn recruitment completed all three queues and deferred flush assigned every march',
      batchAfterTurn.spawned.length === 3
        && batchAfterTurn.spawned.every(unit => unit.march?.generalTargetId === batchSetup.general.id),
      { batchSetup, batchPurchases, batchAfterTurn });
    await page.waitForFunction(({ cityIds, initial }) => {
      const state = window.__generalRuntime.spawnedBatchSnapshot(cityIds);
      const initialById = new Map(initial.map(city => [city.id, city]));
      return state.spawned.length === 3 && state.spawned.every(unit => {
        const cityId = cityIds.find(id => unit.id.includes('_' + id + '_'));
        const city = initialById.get(cityId);
        return city && (unit.q !== city.q || unit.r !== city.r);
      });
    }, { cityIds: batchSetup.cityIds, initial: batchAfterTurn.cities }, { timeout: 60000, polling: 250 });
    const afterMovement = await page.evaluate(ids => window.__generalRuntime.spawnedBatchSnapshot(ids), batchSetup.cityIds);
    check('all three recruits actually begin moving from their cities without teleporting',
      afterMovement.spawned.length === 3 && afterMovement.spawned.every(unit => {
        const cityId = batchSetup.cityIds.find(id => unit.id.includes('_' + id + '_'));
        const origin = afterMovement.cities.find(city => city.id === cityId);
        return origin && (unit.q !== origin.q || unit.r !== origin.r)
          && unit.march?.generalTargetId === batchSetup.general.id;
      }), { afterMovement, cities: afterMovement.cities });

    check('browser completed the real purchase/spawn scenario without page errors', errors.length === 0, errors);
  } finally {
    server.kill('SIGTERM');
    await browser.close();
  }
  console.log(`\ngenerals-purchase-runtime-test: ${pass} pass, ${fail} fail`);
  process.exitCode = fail ? 1 : 0;
}

main().catch(err => { console.error(err); process.exitCode = 1; });
