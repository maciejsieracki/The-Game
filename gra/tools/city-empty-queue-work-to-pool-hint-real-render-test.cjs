'use strict';
/**
 * city-empty-queue-work-to-pool-hint-real-render-test.cjs -- R-WEB-UI-CITY-EMPTY-QUEUE-WORK-TO-POOL-HINT-Q1 (realny Chromium).
 * Scenariusz ze zrzutu wlasciciela: 1 miasto, suwak Budynki 100% / Ulepszenia (pula) 0%, N tur.
 * Mierzy tura -> (pula imperium, przyrost, kolejka, doBudynkow, doPuli) dla wariantow:
 *   kolejka PUSTA vs kolejka NIEPUSTA x podzial 100/90/50.
 * Usage (z gra/): node tools/praca-pula-100-budynki-live-test.cjs [--measure]
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');
const GRA_DIR = path.resolve(__dirname, '..');
const OUT_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'civ-emptyq-hint-'));
const URL = 'file://' + path.join(OUT_DIR, 'index.html') + '?civTest=1';
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
let pass = 0, fail = 0;
const assert = (label, cond, detail) => {
  if (cond) { pass++; console.log('  OK  ' + label); }
  else { fail++; console.error(' FAIL ' + label + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function launch(chromium) {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME,
      args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  }
}
async function poll(page, label, fn, timeoutMs, arg) {
  const end = Date.now() + timeoutMs; let last = null;
  while (Date.now() < end) { last = await page.evaluate(fn, arg); if (last && last.ready) return last; await wait(400); }
  throw new Error('poll(' + label + '): timeout ' + JSON.stringify(last));
}
async function main() {
  const { chromium } = require('playwright');
  console.log('[empty-queue-hint] vite build ->', OUT_DIR);
  execSync(`node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(OUT_DIR)} --emptyOutDir`, { cwd: GRA_DIR, stdio: 'pipe' });
  const browser = await launch(chromium);
  const errors = [];
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  await page.goto(URL, { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => !!window.__cityStateStartUnitsTestDebug && !!window.__workPoolTestDebug && !!window.__civTest, undefined, { timeout: 120000 });
  await page.waitForSelector('.civ-menu', { timeout: 120000 });
  await wait(200);
  await page.evaluate(() => window.__cityStateStartUnitsTestDebug.startNewGame('normal', 0, 'normal'));
  await poll(page, 'world', () => {
    const st = window.__cityStateStartUnitsTestDebug.dumpState();
    return { ready: st.awaitingFirstPlayerCity === true && st.playerStartHex !== null };
  }, 240000);
  await page.evaluate(() => window.__cityStateStartUnitsTestDebug.foundPlayerStartCity());
  await poll(page, 'capital', () => {
    const st = window.__cityStateStartUnitsTestDebug.dumpState();
    return { ready: st.awaitingFirstPlayerCity === false && st.cities.some(c => c.ownerId === 0) };
  }, 60000);
  await wait(400);
  const D = (fn, arg) => page.evaluate(fn, arg);
  const cityId = await D(() => window.__workPoolTestDebug.state().cities[0].id);
  const bIds = await D(() => window.__workPoolTestDebug.buildingIds());
  const HINT = 'Kolejka pusta \u2014 Praca idzie do puli imperium';
  const probe = () => D(() => {
    const els = [...document.querySelectorAll('[data-testid="praca-empty-queue-hint"]')];
    const vis = els.filter((e) => e.offsetParent !== null || e.getClientRects().length > 0);
    return { n: els.length, visible: vis.length, text: els[0] ? els[0].textContent : null,
      panelOpen: !!document.querySelector('.praca-split-chips') };
  });
  const reopen = async () => {
    await D(() => window.__hotSeatTestDebug.closeCityPanelForTest());
    await wait(200);
    const ok = await D((id) => window.__hotSeatTestDebug.openCityPanelForTest(id), cityId);
    assert('panel miasta otwarty (realna sciezka)', ok === true, ok);
    await wait(600);
    await D(() => { const b = [...document.querySelectorAll('button.civ-v-icon-btn')].find((x) => (x.title || '').startsWith('Podzia\u0142 pracy')); if (b) b.click(); });
    await wait(500);
  };
  for (const pct of [100, 70]) {
    await D((p) => window.__workPoolTestDebug.setSplit(p), pct);
    await D((id) => window.__workPoolTestDebug.clearQueue(id), cityId);
    await reopen();
    let r = await probe();
    assert(`pusta kolejka ${pct}%: panel renderuje sekcje podzialu pracy`, r.panelOpen, r);
    assert(`pusta kolejka ${pct}%: komunikat widoczny z dokladnym tekstem`, r.visible === 1 && r.text === HINT, r);
    await D((a) => window.__workPoolTestDebug.enqueueBuildings(a.id, a.ids), { id: cityId, ids: bIds.slice(0, 5) });
    await reopen();
    r = await probe();
    assert(`kolejka niepusta ${pct}%: komunikat nieobecny`, r.n === 0 && r.panelOpen, r);
    await D((id) => window.__workPoolTestDebug.clearQueue(id), cityId);
    await reopen();
    r = await probe();
    assert(`ponownie pusta ${pct}%: komunikat wraca`, r.visible === 1, r);
  }
  assert('brak pageerror', errors.length === 0, errors.slice(0, 3));
  await browser.close();
  try { fs.rmSync(OUT_DIR, { recursive: true, force: true }); } catch (e) { /* ignore */ }
  console.log(`\n[empty-queue-hint] pass=${pass} fail=${fail}`);
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(2); });
