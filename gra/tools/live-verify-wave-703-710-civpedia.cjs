'use strict';
/**
 * live-verify-wave-703-710-civpedia.cjs — R-WEB-LIVE-VERIFY-WAVE-703-710-Q1, punkt (d) FALA 709.
 * Otwiera Civpedię w prawdziwej grze (Chromium, bundle z vite build poza repo), przechodzi do Encyklopedii,
 * szuka hasła „wypowiedzenie wojny” i odczytuje TEKST DOM otwartego hasła (nie plik źródłowy).
 * Usage: DIST=<katalog z index.html> EVID_DIR=<katalog> node tools/live-verify-wave-703-710-civpedia.cjs [seed=11]
 */
const fs = require('fs');
const path = require('path');
const DIST = process.env.DIST;
const EVID = process.env.EVID_DIR;
if (!DIST || !EVID) throw new Error('Ustaw DIST i EVID_DIR');
const SEED = parseInt(process.argv[2] || '11', 10);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
fs.mkdirSync(EVID, { recursive: true });

(async () => {
  const { chromium } = require('playwright');
  const args = ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--headless=new'];
  let browser;
  try { browser = await chromium.launch({ headless: true, args }); } catch (e) {
    browser = await chromium.launch({ headless: true, executablePath: '/opt/pw-browsers/chromium', args });
  }
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 })).newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e && e.message || e).slice(0, 300)));
  page.on('dialog', (d) => d.dismiss().catch(() => {}));
  const res = { seed: SEED, checks: [] };
  const check = (ok, name, extra) => { res.checks.push({ ok: !!ok, name, extra: extra === undefined ? null : extra }); console.log((ok ? 'PASS: ' : 'FAIL: ') + name + (extra !== undefined ? ' — ' + JSON.stringify(extra).slice(0, 500) : '')); };
  try {
    await page.goto('file://' + path.join(path.resolve(DIST), 'index.html') + '?civTest=1&civSeed=' + SEED, { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(() => !!window.__nnsMeasureDebug, undefined, { timeout: 180000 });
    await page.waitForSelector('.civ-menu', { timeout: 180000 });
    await page.evaluate((o) => window.__nnsMeasureDebug.startGame(o), { seed: SEED, mapSize: 'Maly', civTypes: 15, cityStates: 2 });
    await page.waitForFunction(() => !window.__nnsMeasureDebug.awaitingFirstCity(), undefined, { timeout: 120000 }).catch(async () => {
      await page.evaluate(() => window.__nnsMeasureDebug.foundFirstCity());
    });
    if (await page.evaluate(() => window.__nnsMeasureDebug.awaitingFirstCity())) await page.evaluate(() => window.__nnsMeasureDebug.refoundPlayerAnywhere());
    await wait(1500);
    await page.evaluate(() => { const b = document.querySelector('button[data-act="wiki"]'); if (b) b.click(); });
    await wait(800);
    await page.locator('.wh-tab', { hasText: 'Encyklopedia' }).first().click({ timeout: 15000 });
    await wait(500);
    res.encyList = await page.evaluate(() => [...document.querySelectorAll('.wh-body *, .wh-list *, [class*="wh-"] button, [class*="wh-"] li, [class*="wh-"] a')].filter((el) => el.children.length === 0 && el.offsetParent !== null).map((el) => (el.textContent || '').trim()).filter((t) => t.length > 2).slice(0, 60));
    await page.locator('input.wh-search').first().fill('wojny');
    await wait(1200);
    res.encyListAfterSearch = await page.evaluate(() => [...document.querySelectorAll('[class*="wh-"] button, [class*="wh-"] li, [class*="wh-"] a, [class*="wh-"] div')].filter((el) => el.children.length === 0 && el.offsetParent !== null).map((el) => (el.textContent || '').trim()).filter((t) => t.length > 2).slice(0, 60));
    const hits = await page.evaluate(() => [...document.querySelectorAll('[class*="wh-"] button, [class*="wh-"] li, [class*="wh-"] a, [class*="wh-"] div')].filter((el) => el.children.length === 0 && el.offsetParent !== null && /^Wypowiadanie wojny$/i.test((el.textContent || '').trim())).map((el) => (el.textContent || '').trim()).slice(0, 8));
    check(hits.length > 0, 'd: wpis „Wypowiadanie wojny” (pojecia/wypowiedzenie-wojny) w wynikach wyszukiwania „wojny”', hits);
    await page.locator('[class*="wh-"] >> text=/^Wypowiadanie wojny$/').first().click({ timeout: 15000 }).catch(() => {});
    await wait(800);
    const text = await page.evaluate(() => document.body.innerText || '');
    res.openedText = text.slice(0, 6000);
    res.hasStaleBlock = /jeszcze niewdrożone|NIE opisuje obecnego stanu/i.test(text);
    res.hasZaufanie0Rule = /Przy Zaufaniu 0[^\n]{0,160}/i.exec(text);
    res.hasN = (text.match(/od 3 do 7 tur|N\s*=\s*6|\b6 tur/gi) || []).slice(0, 5);
    check(!res.hasStaleBlock, 'd: w otwartym haśle NIE ma tekstu „jeszcze niewdrożone / NIE opisuje obecnego stanu”', { stale: res.hasStaleBlock });
    check(res.hasN.length > 0, 'd: w otwartym haśle jest liczba tur N (3–7 / 6)', res.hasN);
    await page.screenshot({ path: path.join(EVID, 'civpedia-wypowiedzenie-wojny.png') });
    check(pageErrors.length === 0, 'd: brak pageerror', pageErrors);
  } catch (e) {
    check(false, 'EXC: ' + String(e && e.message || e).slice(0, 300));
  } finally {
    await browser.close();
    res.pageErrors = pageErrors;
    res.pass = res.checks.length > 0 && res.checks.every((c) => c.ok);
    fs.writeFileSync(path.join(EVID, 'result-civpedia-seed' + SEED + '.json'), JSON.stringify(res, null, 2));
    console.log('RESULT', res.pass ? 'PASS' : 'FAIL');
  }
  process.exit(res.pass ? 0 : 1);
})();
