'use strict';
/**
 * saveload-praca-pool-live-test.cjs — R-WEB-SAVELOAD-PRACA-POOL-Q1 (realny Chromium).
 * Decyzja wlasciciela A: wczytanie zapisu ZACHOWUJE pule Pracy gracza; tylko wartosc nierealna
 * (> 1_000_000) jest przycinana. Realny vite build do katalogu tymczasowego POZA repo,
 * REALNE buildSaveGameSnapshot -> JSON -> restoreGameFromSave (hak __pracaPoolSaveLoadTestDebug).
 *  P1 pula 405 / 1500 / 5000 przy JEDNYM miescie -> round-trip bez zmiany (bylo: 0);
 *  P2 stary zapis z absurdalna wartoscia: 5e9 -> 1_000_000; 1_000_000 zostaje; -5/'abc'/null -> 0;
 *  P3 hot-seat: pula fotela 0 zachowana przy dwoch fotelach; pula fotela 1 (POMIAR; pole
 *     pracaPoolByHuman nie jest w snapshocie — info, nie asercja).
 * Usage (z gra/): node tools/saveload-praca-pool-live-test.cjs [evidenceJsonAbs]
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');
const GRA_DIR = path.resolve(__dirname, '..');
const OUT_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'civ-saveload-praca-'));
const OUT_HTML = 'file://' + path.join(OUT_DIR, 'index.html');
const EVIDENCE = process.argv[2] || null;
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
let pass = 0, fail = 0;
const assert = (label, cond, detail) => {
  if (cond) { pass++; console.log('  OK  ' + label); }
  else { fail++; console.error(' FAIL ' + label + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function launchBrowser(chromium) {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME,
      args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  }
}
async function pollUntil(page, label, fn, timeoutMs) {
  const end = Date.now() + timeoutMs; let last = null;
  while (Date.now() < end) { last = await page.evaluate(fn); if (last && last.ready) return last; await wait(500); }
  throw new Error('pollUntil(' + label + '): timeout ' + JSON.stringify(last));
}
async function main() {
  const { chromium } = require('playwright');
  console.log('[saveload-praca-pool-live] vite build ->', OUT_DIR);
  execSync(`node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(OUT_DIR)} --emptyOutDir`, { cwd: GRA_DIR, stdio: 'pipe' });
  const browser = await launchBrowser(chromium);
  const errors = [];
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console.error: ' + m.text()); });
  await page.goto(OUT_HTML, { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => !!window.__cityStateStartUnitsTestDebug && !!window.__pracaPoolSaveLoadTestDebug && !!window.__hotSeatTestDebug, undefined, { timeout: 120000 });
  await page.waitForSelector('.civ-menu', { timeout: 120000 });
  await wait(200);
  await page.evaluate(() => window.__cityStateStartUnitsTestDebug.startNewGame('normal', 4, 'normal'));
  await pollUntil(page, 'world', () => {
    const st = window.__cityStateStartUnitsTestDebug.dumpState();
    const overlay = Array.from(document.querySelectorAll('*')).some(el => el.textContent && el.textContent.includes('Tworzenie świata') && el.offsetParent !== null);
    return { ready: !overlay && st.awaitingFirstPlayerCity === true && st.playerStartHex !== null };
  }, 240000);
  await page.evaluate(() => window.__cityStateStartUnitsTestDebug.foundPlayerStartCity());
  await pollUntil(page, 'capital', () => {
    const st = window.__cityStateStartUnitsTestDebug.dumpState();
    return { ready: st.awaitingFirstPlayerCity === false && st.cities.some(c => c.ownerId === 0) };
  }, 60000);
  await wait(400);
  const D = (fn, arg) => page.evaluate(fn, arg);
  const cityCount = await D(() => window.__pracaPoolSaveLoadTestDebug.cityCount());
  assert('P0 fixture: dokladnie 1 miasto gracza (n=' + cityCount + ')', cityCount === 1);
  const meas = { cityCount, p1: [], p2: [], p3: {} };

  for (const v of [405, 1500, 5000]) {
    await D((n) => window.__pracaPoolSaveLoadTestDebug.setPool(n), v);
    const after = await D(() => window.__pracaPoolSaveLoadTestDebug.roundTrip());
    meas.p1.push({ before: v, after });
    assert('P1 pula ' + v + ' przy 1 miescie zachowana po round-trip (po=' + after + ')', after === v);
  }
  const cases = [
    ['5e9 (absurd, dawny map-total) -> przyciete do progu 1_000_000', 5e9, 1_000_000],
    ['1_000_000 (granica, hak testowy) zostaje', 1_000_000, 1_000_000],
    ['999_999 zostaje', 999_999, 999_999],
    ['-5 -> 0', -5, 0],
    ['"abc" -> 0', 'abc', 0],
    ['null -> 0', null, 0],
    ['0 -> 0', 0, 0],
  ];
  for (const [label, input, want] of cases) {
    await D((n) => window.__pracaPoolSaveLoadTestDebug.setPool(n), 77);
    const after = await D((m) => window.__pracaPoolSaveLoadTestDebug.roundTrip(m), input);
    meas.p2.push({ input, after });
    assert('P2 stary zapis ' + label + ' (po=' + after + ')', after === want);
  }

  // P3 hot-seat: fotel 1 wstrzykniety
  const csId = await D(() => {
    const c = window.__cityStateStartUnitsTestDebug.dumpState().cities.find(x => x.ownerId !== 0);
    return c ? c.id : null;
  });
  await D((id) => window.__hotSeatTestDebug.seedSecondSeat(1, { reassignCityId: id || undefined }), csId);
  await D(() => { window.__pracaPoolSaveLoadTestDebug.setPool(405); window.__hotSeatTestDebug.setOwnerPracaPoolForTest(1, 77); });
  const seat1Before = await D(() => window.__pracaPoolSaveLoadTestDebug.getOwnerPool(1));
  const seat0 = await D(() => window.__pracaPoolSaveLoadTestDebug.roundTrip());
  const seat1After = await D(() => window.__pracaPoolSaveLoadTestDebug.getOwnerPool(1));
  meas.p3 = { seat0Before: 405, seat0After: seat0, seat1Before, seat1After };
  assert('P3.1 hot-seat: pula fotela 0 (405) zachowana przy dwoch fotelach (po=' + seat0 + ')', seat0 === 405);
  console.log('  [info P3.2] pula fotela 1: przed=' + seat1Before + ' po=' + seat1After + ' (pracaPoolByHuman poza snapshotem — poza zakresem tematu)');

  assert('C zero pageerror/console.error (n=' + errors.length + ')', errors.length === 0, errors.slice(0, 5));
  if (EVIDENCE) { fs.mkdirSync(path.dirname(EVIDENCE), { recursive: true }); fs.writeFileSync(EVIDENCE, JSON.stringify(meas, null, 2)); }
  await browser.close();
  try { fs.rmSync(OUT_DIR, { recursive: true, force: true }); } catch (_) {}
  console.log('\nsaveload-praca-pool-live-test: ' + pass + ' pass / ' + fail + ' fail');
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.error('[saveload-praca-pool-live] BLAD:', e && e.stack || e); process.exit(2); });
