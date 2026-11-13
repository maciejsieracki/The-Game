'use strict';
/**
 * saveload-hud-cache-hotseat-live-test.cjs — R-WEB-HOTSEAT-HUD-CACHE-Q1 (realny Chromium).
 * Decyzja wlasciciela A: restoreGameFromSave ZERUJE cache HUD (pracaRate, pracaUpkeep,
 * pracaAutoUlepszeniaKoszt, pracaCudaKoszt, kultura, kulturaRate) KAZDEGO fotela hot-seat.
 * REALNE buildSaveGameSnapshot -> restoreGameFromSave (hak __pracaPoolSaveLoadTestDebug.roundTrip) w trakcie sesji.
 *  W0 precondition: PRZED wczytaniem fotel 1 ma niezerowe utrzymanie/rate (tartak na hexie miasta fotela 1)
 *  W1 PO wczytaniu: 6 pol HUD fotela 1 = 0
 *  W2 PO wczytaniu: 6 pol HUD fotela 0 = 0 (bez regresu)
 *  W3 pula Pracy fotela 0/1 zachowana (405/77) -- zerowanie nie rusza `_lastPraca`
 * Usage (z gra/): node tools/saveload-hud-cache-hotseat-live-test.cjs [evidenceJsonAbs]
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');
const GRA_DIR = path.resolve(__dirname, '..');
const OUT_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'civ-saveload-hudcache-hs-'));
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
async function waitHooks(page) {
  await page.waitForFunction(() => !!window.__cityStateStartUnitsTestDebug && !!window.__pracaPoolSaveLoadTestDebug
    && !!window.__hotSeatTestDebug && !!window.__truceSaveLoadTestDebug, undefined, { timeout: 120000 });
  await page.waitForSelector('.civ-menu', { timeout: 120000 });
  await wait(200);
}
async function main() {
  const { chromium } = require('playwright');
  console.log('[saveload-hud-cache-hotseat] vite build ->', OUT_DIR);
  execSync(`node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(OUT_DIR)} --emptyOutDir`, { cwd: GRA_DIR, stdio: 'pipe' });
  const browser = await launchBrowser(chromium);
  const errors = [];
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console.error: ' + m.text()); });
  await page.goto(OUT_HTML, { waitUntil: 'load', timeout: 120000 });
  await waitHooks(page);
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
  const csId = await D(() => {
    const c = window.__cityStateStartUnitsTestDebug.dumpState().cities.find(x => x.ownerId !== 0);
    return c ? c.id : null;
  });
  await D((id) => window.__hotSeatTestDebug.seedSecondSeat(1, { reassignCityId: id || undefined }), csId);
  const F = ['pracaRate', 'pracaUpkeep', 'pracaAutoUlepszeniaKoszt', 'pracaCudaKoszt', 'kultura', 'kulturaRate'];
  const hud = (oid) => D((o) => window.__hotSeatTestDebug.hudPracaSnapshotForTest(o), oid);
  const pick = (h) => Object.fromEntries(F.map((k) => [k, h[k]]));
  const cityHex = (oid) => D((o) => {
    const c = window.__cityStateStartUnitsTestDebug.dumpState().cities.find((x) => x.ownerId === o);
    return c ? { q: c.q, r: c.r } : null;
  }, oid);
  const meas = {};
  await D(() => { window.__pracaPoolSaveLoadTestDebug.setPool(405); window.__hotSeatTestDebug.setOwnerPracaPoolForTest(1, 77); });
  for (const oid of [0, 1]) {
    await D((o) => window.__hotSeatTestDebug.switchActiveHuman(o), oid);
    const hx = await cityHex(oid);
    assert('W0.' + oid + ' fotel ' + oid + ' ma miasto (hex=' + JSON.stringify(hx) + ')', !!hx);
    await D((h) => window.__hotSeatTestDebug.setHexImprovementForTest(h.q, h.r, 'tartak'), hx);
    await D(() => window.__hotSeatTestDebug.refreshHudForTest());
    await wait(200);
  }
  const before = { s0: pick(await hud(0)), s1: pick(await hud(1)) };
  meas.before = before;
  console.log('  PRZED wczytaniem:', JSON.stringify(before));
  const dirty = (h) => F.filter((k) => h[k] !== 0);
  assert('W0.2 PRZED: fotel 1 ma niezerowe pola HUD (' + dirty(before.s1).join(',') + ')', dirty(before.s1).length > 0, before.s1);
  assert('W0.3 PRZED: fotel 0 ma niezerowe pola HUD (' + dirty(before.s0).join(',') + ')', dirty(before.s0).length > 0, before.s0);

  await D(() => window.__pracaPoolSaveLoadTestDebug.roundTrip());
  await wait(200);
  const after = { s0: pick(await hud(0)), s1: pick(await hud(1)) };
  meas.after = after;
  console.log('  PO wczytaniu:    ', JSON.stringify(after));
  for (const k of F) {
    assert('W1 PO: fotel 1 ' + k + ' = 0 (po=' + after.s1[k] + ')', after.s1[k] === 0);
    assert('W2 PO: fotel 0 ' + k + ' = 0 (po=' + after.s0[k] + ')', after.s0[k] === 0);
  }
  const pools = { s0: await D(() => window.__pracaPoolSaveLoadTestDebug.getPool()), s1: await D(() => window.__pracaPoolSaveLoadTestDebug.getOwnerPool(1)) };
  meas.pools = pools;
  assert('W3 pule Pracy zachowane 405/77 (po=' + JSON.stringify(pools) + ')', pools.s0 === 405 && pools.s1 === 77);
  assert('C zero pageerror/console.error (n=' + errors.length + ')', errors.length === 0, errors.slice(0, 5));
  if (EVIDENCE) { fs.mkdirSync(path.dirname(EVIDENCE), { recursive: true }); fs.writeFileSync(EVIDENCE, JSON.stringify(meas, null, 2)); }
  await browser.close();
  try { fs.rmSync(OUT_DIR, { recursive: true, force: true }); } catch (_) {}
  console.log('\nsaveload-hud-cache-hotseat-live-test: ' + pass + ' pass / ' + fail + ' fail');
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.error('[saveload-hud-cache-hotseat] BLAD:', e && e.stack || e); process.exit(2); });
