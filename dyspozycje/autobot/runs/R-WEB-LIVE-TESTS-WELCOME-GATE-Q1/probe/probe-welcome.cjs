'use strict';
// Probe (scratchpad, nie repo): czy ekran powitalny zasłania przycisk „Zakończ turę” i kiedy się pojawia.
const fs = require('fs');
const path = require('path');
const GRA = process.env.GRA;
const { chromium } = require(path.join(GRA, 'node_modules', 'playwright'));
const DIST = process.env.DIST;
const SEED = parseInt(process.env.SEED || '4242', 10);
const TURNS = parseInt(process.env.TURNS || '10', 10);
const OUT = process.env.OUT;
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const args = ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--headless=new'];
  const browser = await chromium.launch({ headless: true, args, executablePath: process.env.EXE || undefined });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e && e.message || e).slice(0, 200)));
  page.on('dialog', d => d.dismiss().catch(() => {}));
  await page.goto('file://' + path.join(DIST, 'index.html') + '?civTest=1&civSeed=' + SEED, { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(() => !!window.__nnsMeasureDebug, undefined, { timeout: 180000 });
  await page.waitForSelector('.civ-menu', { timeout: 180000 });
  await page.evaluate(o => window.__nnsMeasureDebug.startGame(o), { seed: SEED, mapSize: 'Maly', civTypes: 15, cityStates: 2 });
  await page.waitForFunction(() => !window.__nnsMeasureDebug.awaitingFirstCity(), undefined, { timeout: 120000 }).catch(async () => {
    await page.evaluate(() => window.__nnsMeasureDebug.foundFirstCity());
  });
  if (await page.evaluate(() => window.__nnsMeasureDebug.awaitingFirstCity())) {
    await page.evaluate(() => window.__nnsMeasureDebug.refoundPlayerAnywhere());
  }
  await wait(800);
  await page.evaluate(() => window.__nnsMeasureDebug.setFast(true));
  const sample = async (label) => page.evaluate(() => {
    const root = document.querySelector('#civ-welcome-screen-root');
    const btn = document.querySelector('.civ-bottom-bar .end-turn');
    let hit = null, covered = null;
    if (btn) {
      const r = btn.getBoundingClientRect();
      const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      hit = !!el && (el === btn || btn.contains(el));
      covered = el ? (el.closest('#civ-welcome-screen-root') ? 'welcome' : (el.className ? String(el.className).slice(0, 60) : el.tagName)) : null;
    }
    const gi = window.__nnsMeasureDebug.gateInfo();
    const snap = window.__nnsMeasureDebug.snapshot();
    return { welcomeOpen: !!root, btnFound: !!btn, btnHit: hit, covered, canEnd: !!gi.canEnd, turn: snap.turn, endInProgress: window.__nnsMeasureDebug.isEndTurnInProgress() };
  }).then(v => ({ label, ...v }));
  const rows = [];
  rows.push(await sample('after-start'));
  console.log(JSON.stringify(rows[0]));
  for (let i = 0; i < TURNS; i++) {
    await page.evaluate(() => window.__nnsMeasureDebug.endTurn());
    await page.waitForFunction(() => !window.__nnsMeasureDebug.isEndTurnInProgress(), undefined, { timeout: 180000, polling: 200 }).catch(() => {});
    await wait(150);
    rows.push(await sample('after-end-' + (i + 1)));
    console.log(JSON.stringify(rows[rows.length - 1]));
  }
  fs.writeFileSync(path.join(OUT, 'probe-welcome-' + SEED + '.json'), JSON.stringify({ rows, errors: errors.slice(0, 5) }, null, 2));
  console.log('DONE pageerrors=' + errors.length);
  await browser.close();
})().catch(e => { console.error('PROBE-ERR', String(e && e.message || e).slice(0, 400)); process.exit(2); });
