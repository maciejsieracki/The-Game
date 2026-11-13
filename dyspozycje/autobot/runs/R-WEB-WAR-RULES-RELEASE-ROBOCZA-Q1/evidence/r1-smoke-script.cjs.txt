'use strict';
// Smoke Chromium ?memdebug=1: N tur (domyslnie 12), tryb peace|war, czas endTurn per tura.
// war = wymuszona wojna zwykla miedzy KAZDA para AI (hak __aiWojnyZwykleCapTestDebug.declareRegularWarBetween).
// Uzycie (z gra/): node <ten plik> --html <plik.html> --mode peace|war --turns 12 --out <katalog> [--seed 778899]
const path = require('path');
const fs = require('fs');
const GRA = process.env.SMOKE_PLAYWRIGHT_FROM || path.resolve(process.cwd());
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
function arg(n, d) { const i = process.argv.indexOf('--' + n); return i >= 0 ? process.argv[i + 1] : d; }
const HTML = path.resolve(arg('html')), MODE = arg('mode', 'peace'), TURNS = Number(arg('turns', '12')), OUT = arg('out'), SEED = Number(arg('seed', '778899'));
fs.mkdirSync(OUT, { recursive: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
async function pollUntil(page, fn, timeoutMs, what) {
  const dl = Date.now() + timeoutMs; let last = null;
  while (Date.now() < dl) { last = await page.evaluate(fn); if (last && last.ready) return last; await wait(500); }
  throw new Error('pollUntil(' + what + ') timeout ' + JSON.stringify(last));
}
(async () => {
  const { chromium } = require(path.join(GRA, 'node_modules', 'playwright'));
  const browser = await chromium.launch({ headless: true, executablePath: fs.existsSync(CHROME) ? CHROME : undefined, args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--js-flags=--expose-gc'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [], mem = [], bad = [];
  page.on('pageerror', (e) => errors.push('[pageerror] ' + String(e)));
  page.on('console', (m) => { const t = m.text(); if (m.type() === 'error') errors.push(t.slice(0, 300)); if (t.includes('[memdebug]')) mem.push(t); });
  page.on('response', (r) => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url()); });
  await page.addInitScript((seed) => { let s = seed | 0; Math.random = function () { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }, 0x9e3779b9 | 0);
  await page.goto('file://' + HTML + '?memdebug=1&skipMenuRedirect=1', { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(() => !!window.__cityStateStartUnitsTestDebug && !!window.__eraTestDebug && !!window.__aiBuildingsTestDebug && !!window.__rebelProtectionTestDebug && !!window.__aiWojnyZwykleCapTestDebug, undefined, { timeout: 180000 });
  await page.waitForSelector('.civ-menu', { timeout: 180000 });
  const tGen = Date.now();
  await page.evaluate((seed) => window.__aiBuildingsTestDebug.startNewGame({ seed }), SEED);
  await pollUntil(page, () => {
    const dbg = window.__cityStateStartUnitsTestDebug;
    const overlay = Array.from(document.querySelectorAll('*')).some((el) => el.textContent && el.textContent.includes('Tworzenie świata') && el.offsetParent !== null);
    const st = dbg.dumpState();
    return { ready: !overlay && st.awaitingFirstPlayerCity === true && st.playerStartHex !== null };
  }, 900000, 'awaitingFirstPlayerCity');
  log('worldgen ms', Date.now() - tGen);
  if (!(await page.evaluate(() => window.__cityStateStartUnitsTestDebug.foundPlayerStartCity()))) throw new Error('found fail');
  await pollUntil(page, () => { const st = window.__cityStateStartUnitsTestDebug.dumpState(); return { ready: st.awaitingFirstPlayerCity === false && st.cities.some((c) => c.ownerId === 0) }; }, 60000, 'playerCity');
  await page.evaluate(() => window.__rebelProtectionTestDebug.disableVictoryCheckForTest());
  await wait(1000);
  let warPairs = [];
  if (MODE === 'war') {
    warPairs = await page.evaluate(() => {
      const st = window.__cityStateStartUnitsTestDebug.dumpState();
      const owners = [...new Set(st.cities.map((c) => c.ownerId))].filter((o) => o > 0 && o < 50).sort((a, b) => a - b);
      const out = [];
      for (let i = 0; i < owners.length; i++) for (let j = i + 1; j < owners.length; j++) { window.__aiWojnyZwykleCapTestDebug.declareRegularWarBetween(owners[i], owners[j]); out.push([owners[i], owners[j]]); }
      return { owners, out };
    });
    log('war declared', JSON.stringify(warPairs));
  }
  const endTurn = () => page.evaluate(() => new Promise((resolve) => {
    const dbg = window.__eraTestDebug; const turn0 = dbg.getWorldState().turn; const t0 = performance.now(); dbg.endTurn(); let saw = dbg.isEndTurnInProgress();
    const tick = () => { const ip = dbg.isEndTurnInProgress(); if (ip) saw = true;
      if (!ip && (saw || performance.now() - t0 > 2000)) { requestAnimationFrame(() => requestAnimationFrame(() => resolve({ ms: performance.now() - t0, turn0, turn1: dbg.getWorldState().turn }))); return; }
      if (performance.now() - t0 > 600000) { resolve({ ms: -1, turn0, turn1: dbg.getWorldState().turn }); return; }
      setTimeout(tick, 4); };
    setTimeout(tick, 0);
  }));
  const dismiss = async () => { await page.keyboard.press('Escape').catch(() => {}); await page.evaluate(() => { const re = /^(OK|Zamknij|Wróć|Rozumiem|Kontynuuj|Pomiń|Zamknij kartę|Wróć na mapę)$/i; for (const b of [...document.querySelectorAll('button')].filter((x) => x.offsetParent !== null && re.test(x.innerText.trim())).slice(0, 3)) b.click(); }).catch(() => {}); };
  const rows = [];
  for (let t = 0; t < TURNS; t++) {
    await dismiss();
    let r = await endTurn(); let retries = 0;
    while (r.turn1 <= r.turn0 && retries < 3) { await dismiss(); await wait(500); r = await endTurn(); retries++; }
    const st = await page.evaluate(() => window.__cityStateStartUnitsTestDebug.dumpState());
    const heap = await page.evaluate(() => (performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null));
    rows.push({ n: t + 1, turn0: r.turn0, turn1: r.turn1, endTurnMs: Math.round(r.ms), retries, cities: st.cities.length, heapMB: heap });
    log('end-turn', JSON.stringify(rows[rows.length - 1]));
  }
  const ts = rows.map((x) => x.endTurnMs).sort((a, b) => a - b);
  const med = ts[Math.floor(ts.length / 2)], mean = Math.round(ts.reduce((a, b) => a + b, 0) / ts.length);
  console.log('SUMMARY', JSON.stringify({ mode: MODE, turns: TURNS, finalTurn: rows[rows.length - 1].turn1, medianMs: med, meanMs: mean, maxMs: ts[ts.length - 1], stalls: rows.filter((x) => x.turn1 <= x.turn0).length }));
  console.log('MEMDEBUG_LOGS_BEGIN'); mem.forEach((l) => console.log(l)); console.log('MEMDEBUG_LOGS_END');
  console.log('BAD_RESPONSES', JSON.stringify(bad));
  console.log('ERRORS', JSON.stringify(errors));
  await page.screenshot({ path: path.join(OUT, MODE + '-final.png') });
  await browser.close();
})().catch((e) => { console.log('FATAL', e && e.stack || e); process.exit(1); });
