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
    assert.deepEqual(pageErrors, [], 'no browser page errors');
    console.log('PASS: alliance call survives HTTP Chromium reload + IndexedDB load');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
