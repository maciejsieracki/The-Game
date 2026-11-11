'use strict';
/** Real HTTP/Chromium + IndexedDB + document reload check for alliance call persistence. */
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const url = process.env.ALLIANCE_TEST_URL || 'http://127.0.0.1:5173/?test=alliance-war-call';
const slot = `alliance-war-call-live-${Date.now()}`;

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForFunction(() => !!window.__allianceWarCallSaveLoadTestDebug, { timeout: 15000 });
    const saved = await page.evaluate(slotName => window.__allianceWarCallSaveLoadTestDebug.seedAndSave(slotName), slot);
    assert.equal(saved, true, 'real IndexedDB save succeeds');
    const before = await page.evaluate(() => window.__allianceWarCallSaveLoadTestDebug.pending());
    assert.equal(before.length, 1, 'one pending alliance call before document reload');
    assert.deepEqual(await page.evaluate(() => window.__allianceWarCallSaveLoadTestDebug.history()), [], 'pending call has no premature outcome');
    const beforeCall = before[0];
    assert.equal(beforeCall.cmdType, 'alliance_war_call');
    assert.equal(beforeCall.allianceWar.warId, 'alliance-war-1-2-3');

    await page.reload({ waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForFunction(() => !!window.__allianceWarCallSaveLoadTestDebug, { timeout: 15000 });
    await page.evaluate(slotName => window.__allianceWarCallSaveLoadTestDebug.loadSlot(slotName), slot);
    const after = await page.evaluate(() => window.__allianceWarCallSaveLoadTestDebug.pending());
    assert.deepEqual(after, [beforeCall], 'call survives actual HTTP document reload and IndexedDB load');
    assert.deepEqual(await page.evaluate(() => window.__allianceWarCallSaveLoadTestDebug.history()), [], 'pending call stays unresolved after load');

    await page.evaluate(({ id }) => window.__allianceWarCallSaveLoadTestDebug.resolve(id, false), { id: beforeCall.id });
    assert.equal(await page.evaluate(() => window.__allianceWarCallSaveLoadTestDebug.n4Count()), 1, 'one real N4 event on refusal');
    await page.evaluate(() => window.__allianceWarCallSaveLoadTestDebug.requeueSameWar());
    assert.deepEqual(await page.evaluate(() => window.__allianceWarCallSaveLoadTestDebug.pending()), [], 'same hook cannot requeue a refused stable call');
    assert.equal(await page.evaluate(() => window.__allianceWarCallSaveLoadTestDebug.n4Count()), 1, 'replayed hook adds no second N4 event');
    const refusalHistory = await page.evaluate(() => window.__allianceWarCallSaveLoadTestDebug.history());
    assert.equal(refusalHistory.length, 1);
    assert.equal(refusalHistory[0].outcome, 'refused');
    const refusalSlot = `${slot}-refused`;
    assert.equal(await page.evaluate(slotName => window.__allianceWarCallSaveLoadTestDebug.seedAndSave(slotName), refusalSlot), true);
    await page.reload({ waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForFunction(() => !!window.__allianceWarCallSaveLoadTestDebug, { timeout: 15000 });
    await page.evaluate(slotName => window.__allianceWarCallSaveLoadTestDebug.loadSlot(slotName), refusalSlot);
    assert.deepEqual(await page.evaluate(() => window.__allianceWarCallSaveLoadTestDebug.pending()), [], 'resolved call stays absent after reload');
    assert.deepEqual(await page.evaluate(() => window.__allianceWarCallSaveLoadTestDebug.history()), refusalHistory, 'resolved history survives IndexedDB reload');
    await page.evaluate(() => window.__allianceWarCallSaveLoadTestDebug.requeueSameWar());
    assert.deepEqual(await page.evaluate(() => window.__allianceWarCallSaveLoadTestDebug.pending()), [], 'persisted refusal suppresses the same hook after reload');
    assert.equal(await page.evaluate(() => window.__allianceWarCallSaveLoadTestDebug.n4Count()), 1, 'persisted refusal cannot apply N4 twice');

    const acceptedPage = await context.newPage();
    acceptedPage.on('pageerror', error => pageErrors.push(error.message));
    await acceptedPage.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await acceptedPage.waitForFunction(() => !!window.__allianceWarCallSaveLoadTestDebug, { timeout: 15000 });
    assert.equal(await acceptedPage.evaluate(slotName => window.__allianceWarCallSaveLoadTestDebug.seedAndSave(slotName), `${slot}-joined`), true);
    const acceptedCall = (await acceptedPage.evaluate(() => window.__allianceWarCallSaveLoadTestDebug.pending()))[0];
    await acceptedPage.evaluate(() => {
      window.__hotSeatTestDebug.seedSecondSeat(7, {});
      window.__hotSeatTestDebug.switchActiveHuman(7);
    });
    await acceptedPage.evaluate(id => window.__allianceWarCallSaveLoadTestDebug.resolve(id, false), acceptedCall.id);
    assert.equal((await acceptedPage.evaluate(() => window.__allianceWarCallSaveLoadTestDebug.pending())).length, 1, 'wrong active hot-seat recipient leaves call pending');
    assert.deepEqual(await acceptedPage.evaluate(() => window.__allianceWarCallSaveLoadTestDebug.history()), [], 'wrong seat cannot record an outcome');
    await acceptedPage.evaluate(() => window.__hotSeatTestDebug.switchActiveHuman(0));
    await acceptedPage.evaluate(id => window.__allianceWarCallSaveLoadTestDebug.resolve(id, true), acceptedCall.id);
    const joinedHistory = await acceptedPage.evaluate(() => window.__allianceWarCallSaveLoadTestDebug.history());
    assert.equal(joinedHistory.length, 1);
    assert.equal(joinedHistory[0].outcome, 'joined');
    await acceptedPage.evaluate(() => window.__allianceWarCallSaveLoadTestDebug.requeueSameWar());
    assert.deepEqual(await acceptedPage.evaluate(() => window.__allianceWarCallSaveLoadTestDebug.pending()), [], 'same hook cannot requeue an accepted stable call');
    assert.equal(await acceptedPage.evaluate(() => window.__allianceWarCallSaveLoadTestDebug.n4Count()), 0, 'acceptance and replay add no N4 event');
    assert.deepEqual(pageErrors, [], 'no browser page errors');
    console.log('PASS: alliance calls survive HTTP Chromium reload + IndexedDB; accept/refuse replays are idempotent');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
