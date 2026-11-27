'use strict';
// Probe 2 (scratchpad, nie repo): mutacja ekranu powitalnego i bramki na żywym buildzie.
// MODE=noclose: klik „Zakończ turę” bez zamknięcia ekranu, potem prepareEndTurnGate + endTurn.
// MODE=close: closeCivWelcome (helper z repo), potem klik + prepareEndTurnGate + endTurn.
const fs = require('fs');
const path = require('path');
const GRA = process.env.GRA;
const { chromium } = require(path.join(GRA, 'node_modules', 'playwright'));
const { closeCivWelcome, prepareEndTurnGate } = require(path.join(GRA, 'tools', '_live-ready.cjs'));
const DIST = process.env.DIST;
const SEED = parseInt(process.env.SEED || '4242', 10);
const TURNS = parseInt(process.env.TURNS || '3', 10);
const OUT = process.env.OUT;
const MODE = process.env.MODE || 'noclose';
const wait = ms => new Promise(r => setTimeout(r, ms));
const log = (o) => console.log(JSON.stringify(o));
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
  const state = (label) => page.evaluate(() => {
    const gi = window.__nnsMeasureDebug.gateInfo();
    return { welcomeOpen: !!document.querySelector('#civ-welcome-screen-root'), canEnd: !!gi.canEnd, gate: gi.gate && gi.gate.blokada, turn: window.__nnsMeasureDebug.snapshot().turn };
  }).then(v => ({ label, ...v }));
  log({ mode: MODE, ...(await state('start')) });
  if (MODE === 'close' || MODE === 'full') {
    const n = await closeCivWelcome(page).catch(e => 'ERR ' + String(e.message).slice(0, 120));
    log({ mode: MODE, step: 'closeCivWelcome', closed: n, ...(await state('after-close')) });
  }
  // Klik przyciskiem (jak test użytkownika), z krótkim limitem: pokazuje, czy ekran zasłania przycisk.
  const clickRes = await page.click('.civ-bottom-bar .end-turn', { timeout: 4000 }).then(() => 'CLICK-OK', e => 'CLICK-FAIL ' + String(e.message).replace(/\s+/g, ' ').slice(0, 260));
  log({ mode: MODE, step: 'click-end-turn', result: String(clickRes).slice(0, 200), ...(await state('after-click')) });
  if (MODE === 'bare') {
    for (let i = 0; i < TURNS; i++) {
      await page.evaluate(() => window.__nnsMeasureDebug.endTurn());
      await page.waitForFunction(() => !window.__nnsMeasureDebug.isEndTurnInProgress(), undefined, { timeout: 120000, polling: 200 }).catch(() => {});
      await wait(150);
      log({ mode: MODE, step: 'endTurn-bare-' + (i + 1), ...(await state('after'))});
    }
    fs.writeFileSync(path.join(OUT, 'probe-gate-' + MODE + '-' + SEED + '.json'), JSON.stringify({ errors: errors.slice(0, 5) }, null, 2));
    log({ mode: MODE, done: true, pageerrors: errors.length });
    await browser.close();
    return;
  }
  const prep = await page.evaluate(() => window.__nnsMeasureDebug.gateInfo().canEnd).catch(() => null);
  log({ mode: MODE, step: 'prepareEndTurnGate', canEndBefore: prep, prepared: await prepareEndTurnGate(page).catch(e => 'ERR ' + String(e.message).slice(0, 120)) });
  const click2 = await page.click('.civ-bottom-bar .end-turn', { timeout: 4000 }).then(() => 'CLICK-OK', e => 'CLICK-FAIL ' + String(e.message).replace(/\s+/g, ' ').slice(0, 200));
  await page.waitForFunction(() => !window.__nnsMeasureDebug.isEndTurnInProgress(), undefined, { timeout: 180000, polling: 200 }).catch(() => {});
  await wait(150);
  log({ mode: MODE, step: 'click-after-prepare', result: String(click2).slice(0, 200), ...(await state('after-click2')) });
  for (let i = 0; i < TURNS; i++) {
    await page.evaluate(() => window.__nnsMeasureDebug.endTurn());
    await page.waitForFunction(() => !window.__nnsMeasureDebug.isEndTurnInProgress(), undefined, { timeout: 180000, polling: 200 }).catch(() => {});
    await wait(150);
    log({ mode: MODE, step: 'endTurn-' + (i + 1), ...(await state('after'))});
  }
  fs.writeFileSync(path.join(OUT, 'probe-gate-' + MODE + '-' + SEED + '.json'), JSON.stringify({ errors: errors.slice(0, 5) }, null, 2));
  log({ mode: MODE, done: true, pageerrors: errors.length });
  await browser.close();
})().catch(e => { console.error('PROBE-ERR', String(e && e.message || e).slice(0, 400)); process.exit(2); });
