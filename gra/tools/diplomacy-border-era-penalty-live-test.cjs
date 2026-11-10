'use strict';
/** Runtime gate for R-WEB-BORDER-RELATIONS-ERA-PENALTY-Q1.
 * Calls the closed-over main.ts pair context, preview, breakdown, tick and real
 * IndexedDB save/load path in Chromium. Test setup is confined to the named hook.
 */
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const URL = process.env.GAME_URL || 'http://127.0.0.1:612/?playtest=mapa';
const SLOT = 'border-era-runtime-defense';
const wait = ms => new Promise(r => setTimeout(r, ms));
const close = (actual, expected, label) => assert.ok(Math.abs(actual - expected) < 1e-9, `${label}: got ${actual}, expected ${expected}`);

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || '/usr/bin/chromium',
    args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'] });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.log(`[browser:${m.type()}] ${m.text().slice(0, 260)}`); });
  try {
    await page.goto(URL, { waitUntil: 'load', timeout: 60000 });
    await page.waitForFunction(() => window.__borderEraPenaltyRuntimeTestDebug
      && window.__eraTestDebug && window.__eraTestDebug.getWorldState().citiesLen > 0, null, { timeout: 120000 });
    let ownerIds = await page.evaluate(() => window.__borderEraPenaltyRuntimeTestDebug.ownerIds());
    if (ownerIds.length < 2) {
      await page.waitForFunction(() => window.__aiBuildingsTestDebug, null, { timeout: 30000 });
      console.log('playtest exposes <2 AI owners; starting small real game via doStartGame fixture');
      await page.evaluate(() => window.__aiBuildingsTestDebug.startNewGame({ rivals: '2', cityStates: 0, civTypes: 4, seed: 778899 }));
      await page.waitForFunction(() => window.__cityStateStartUnitsTestDebug
        && window.__cityStateStartUnitsTestDebug.dumpState().awaitingFirstPlayerCity === true
        && window.__cityStateStartUnitsTestDebug.dumpState().playerStartHex !== null
        && !document.querySelector('.civ-map-load-overlay'), null, { timeout: 180000 });
      assert.equal(await page.evaluate(() => window.__cityStateStartUnitsTestDebug.foundPlayerStartCity()), true, 'found player start city');
      await page.waitForFunction(() => {
        const state = window.__cityStateStartUnitsTestDebug?.dumpState();
        return state?.awaitingFirstPlayerCity === false && state.cities.some(c => c.ownerId === 0);
      }, null, { timeout: 120000 });
      await page.waitForFunction(() => window.__eraTestDebug.getWorldState().citiesLen > 0
        && window.__borderEraPenaltyRuntimeTestDebug.ownerIds().length >= 2, null, { timeout: 180000 });
    }
    const ids = await page.evaluate(() => window.__borderEraPenaltyRuntimeTestDebug.ownerIds());
    assert.ok(ids.length >= 2, `expected 2+ live owners with cities, got ${ids}`);
    let pair = null;
    let setupError = '';
    for (let i = 0; i < ids.length && !pair; i++) for (let j = i + 1; j < ids.length && !pair; j++) {
      try {
        const setup = await page.evaluate(([a, b]) => window.__borderEraPenaltyRuntimeTestDebug.setupFixture(a, b), [ids[i], ids[j]]);
        if (setup.sharedLandBorder && setup.fixtureCityCountA > 2 && setup.fixtureCityCountB > 2) pair = { a: ids[i], b: ids[j], setup };
      } catch (e) { setupError = e.message; }
    }
    assert.ok(pair, `could not form production-verified border fixture: ${setupError}`);
    const { a, b } = pair;
    console.log('fixture', JSON.stringify(pair));
    const eraSetup = await page.evaluate(([a, b]) => {
      const h = window.__borderEraPenaltyRuntimeTestDebug;
      h.setOwnerEraForTest(a, 2); h.setOwnerEraForTest(b, 3);
      return {
        startA: h.ownerEraStartForTest(a), startB: h.ownerEraStartForTest(b),
        syncA: h.syncOwnerEraForTest(a), syncB: h.syncOwnerEraForTest(b),
        stateA: h.ownerEraFixtureStateForTest(a), stateB: h.ownerEraFixtureStateForTest(b),
      };
    }, [a, b]);
    console.log('fixture era state', JSON.stringify(eraSetup));
    assert.equal(eraSetup.syncA, 2, 'fixture research state recomputes Bronze owner');
    assert.equal(eraSetup.syncB, 3, 'fixture research and wonder state recompute Iron owner');
    let evidence = await page.evaluate(([a, b]) => window.__borderEraPenaltyRuntimeTestDebug.pairEvidence(a, b), [a, b]);
    assert.equal(evidence.sharedLandBorder, true);
    assert.equal(evidence.rate, -4);
    assert.equal(evidence.breakdownValue, -4);
    const tick = await page.evaluate(([a, b]) => window.__borderEraPenaltyRuntimeTestDebug.applyProductionTick(a, b), [a, b]);
    close(tick.delta, evidence.previewDelta, 'production tick delta equals live preview');
    console.log('mixed-era pre-save', JSON.stringify({ evidence, tick }));

    assert.equal(await page.evaluate(s => window.__borderEraPenaltyRuntimeTestDebug.quickSave(s), SLOT), true, 'real saveToLocal/IndexedDB save');
    const persisted = await page.evaluate(([slot, ids]) =>
      window.__borderEraPenaltyRuntimeTestDebug.readSavedFixtureState(slot, ids), [SLOT, [a, b]]);
    assert.equal(persisted.found, true, 'read back persisted fixture from IndexedDB');
    assert.deepEqual(persisted.eras, [[a, 2], [b, 3]], 'owner eras persisted');
    assert.ok(persisted.research.some(([id, techs]) => id === b && techs.length > 0), 'Iron owner research persisted');
    console.log('persisted fixture state', JSON.stringify(persisted));
    await page.evaluate(([a, b]) => {
      const h = window.__borderEraPenaltyRuntimeTestDebug;
      h.setOwnerEraForTest(a, 2); h.setOwnerEraForTest(b, 2);
    }, [a, b]);
    await page.evaluate(s => window.__borderEraPenaltyRuntimeTestDebug.loadSlot(s), SLOT);
    await wait(1200);
    const restored = await page.evaluate(([a, b]) => ({
      eraA: window.__borderEraPenaltyRuntimeTestDebug.ownerEra(a),
      eraB: window.__borderEraPenaltyRuntimeTestDebug.ownerEra(b),
      evidence: window.__borderEraPenaltyRuntimeTestDebug.pairEvidence(a, b),
      stateA: window.__borderEraPenaltyRuntimeTestDebug.ownerEraFixtureStateForTest(a),
      stateB: window.__borderEraPenaltyRuntimeTestDebug.ownerEraFixtureStateForTest(b),
    }), [a, b]);
    assert.equal(restored.eraA, 2, 'AI owner A era restored from save');
    assert.equal(restored.eraB, 3, 'AI owner B era restored from save');
    assert.equal(restored.evidence.rate, -4);
    assert.equal(restored.evidence.breakdownValue, -4);
    const restoredTick = await page.evaluate(([a, b]) => window.__borderEraPenaltyRuntimeTestDebug.applyProductionTick(a, b), [a, b]);
    close(restoredTick.delta, restored.evidence.previewDelta, 'post-load production tick equals post-load live preview');
    console.log('roundtrip', JSON.stringify({ restored, tick: restoredTick }));

    // Recalculate from changed live owner state and reverse pair order using same production path.
    await page.evaluate(([a, b]) => window.__borderEraPenaltyRuntimeTestDebug.setOwnerEraForTest(b, 2), [a, b]);
    const changed = await page.evaluate(([a, b]) => window.__borderEraPenaltyRuntimeTestDebug.pairEvidence(a, b), [a, b]);
    const reversed = await page.evaluate(([a, b]) => window.__borderEraPenaltyRuntimeTestDebug.pairEvidence(b, a), [a, b]);
    assert.equal(changed.rate, -3, 'Stone/Bronze follows higher current owner era');
    assert.equal(reversed.rate, -3, 'owner order does not change rate');
    assert.equal(changed.breakdownValue, -3);
    assert.equal(reversed.breakdownValue, -3);

    assert.equal(await page.evaluate(([a, b]) => window.__borderEraPenaltyRuntimeTestDebug.moveFixtureAwayForTest(a, b), [a, b]), true,
      'fixture can remove shared border while retaining >2 cities per owner');
    const noBorder = await page.evaluate(([a, b]) => window.__borderEraPenaltyRuntimeTestDebug.pairEvidence(a, b), [a, b]);
    assert.equal(noBorder.sharedLandBorder, false);
    assert.equal(noBorder.breakdownValue, null, 'UI breakdown omits factor when border guard is false');
    console.log('changed/reversed/no-border', JSON.stringify({ changed, reversed, noBorder }));
    assert.deepEqual(pageErrors, [], 'no browser page errors');
    console.log('RESULT PASS: production pair context, preview, breakdown, tick and IndexedDB save/load');
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e); process.exit(1); });
