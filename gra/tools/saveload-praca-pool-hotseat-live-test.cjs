'use strict';
/**
 * saveload-praca-pool-hotseat-live-test.cjs — R-WEB-SAVELOAD-HOTSEAT-PRACA-Q1 (realny Chromium).
 * Decyzja wlasciciela A: zapis zawiera pule Pracy KAZDEGO fotela hot-seat (meta.pracaPoolByHuman =
 * [[ownerId, pula], ...]); stary zapis bez pola wczytuje sie bez bledu; ten sam sanitizer co fotel 0.
 * REALNE buildSaveGameSnapshot / saveToLocal (IndexedDB) / loadGameFromSlot po PELNYM przeladowaniu strony.
 *  H1 fresh-page: fotel 0 = 405, fotel 1 = 77 -> zapis -> page.reload -> wczytanie slotu -> 405 / 77
 *  H2 round-trip w sesji: pule 0 i 1500 fotela 1, izolacja foteli
 *  H3 stary zapis (bez pola) po przeladowaniu: brak bledu, fotel 0 zachowany, fotel 1 = 0
 *  H4 wartosci graniczne fotela 1: 5e9->1e6, 1e6, 999999, -5->0, 'abc'->0, null->0; smieciowe wpisy ignorowane
 *  H5 pole `meta.pracaPoolByHuman` obecne w snapshocie z obiema parami
 * Usage (z gra/): node tools/saveload-praca-pool-hotseat-live-test.cjs [evidenceJsonAbs]
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');
const GRA_DIR = path.resolve(__dirname, '..');
const OUT_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'civ-saveload-praca-hs-'));
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
  console.log('[saveload-praca-pool-hotseat] vite build ->', OUT_DIR);
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
  const meas = { h1: {}, h2: [], h3: {}, h4: [], h5: null };
  const seat1 = () => D(() => { try { return window.__pracaPoolSaveLoadTestDebug.getOwnerPool(1); } catch (e) { return 'THROW:' + e.message; } });
  const loadSlotAndWait = async (slot) => {
    await D((s) => { window.__loadDone = false; window.__truceSaveLoadTestDebug.loadSlot(s).then(() => { window.__loadDone = true; }); }, slot);
    await pollUntil(page, 'load ' + slot, () => {
      const overlay = Array.from(document.querySelectorAll('*')).some(el => el.textContent && el.textContent.includes('Tworzenie świata') && el.offsetParent !== null);
      return { ready: window.__loadDone === true && !overlay };
    }, 240000);
    await wait(400);
  };

  // H5 + H1 przygotowanie
  await D(() => { window.__pracaPoolSaveLoadTestDebug.setPool(405); window.__hotSeatTestDebug.setOwnerPracaPoolForTest(1, 77); });
  meas.h5 = await D(() => window.__pracaPoolSaveLoadTestDebug.savedSeatPools());
  assert('H5 snapshot niesie meta.pracaPoolByHuman z parami [0,405] i [1,77]',
    Array.isArray(meas.h5) && JSON.stringify(meas.h5.slice().sort((a, b) => a[0] - b[0])) === JSON.stringify([[0, 405], [1, 77]]), meas.h5);

  // H1 fresh page
  const okSave = await D(() => window.__truceSaveLoadTestDebug.quickSave('hs-praca-new'));
  assert('H1.0 zapis do slotu IndexedDB OK', okSave === true);
  await D(() => window.__pracaPoolSaveLoadTestDebug.writeLegacySlot('hs-praca-new', 'hs-praca-old'));
  await page.reload({ waitUntil: 'load', timeout: 120000 });
  await waitHooks(page);
  await loadSlotAndWait('hs-praca-new');
  const h1 = {
    seat0: await D(() => window.__pracaPoolSaveLoadTestDebug.getPool()),
    seat1: await seat1(),
    seat1Raw: await D(() => window.__pracaPoolSaveLoadTestDebug.seatPoolRaw(1)),
    seat1LastPraca: await D(() => window.__pracaPoolSaveLoadTestDebug.seatLastPraca(1)),
  };
  meas.h1 = h1;
  assert('H1.1 fresh page: pula fotela 0 = 405 (po=' + h1.seat0 + ')', h1.seat0 === 405);
  assert('H1.2 fresh page: pula fotela 1 = 77 (po=' + JSON.stringify(h1.seat1) + ')', h1.seat1 === 77);
  assert('H1.3 fresh page: cache HUD fotela 1 (_lastPraca) = 77 (po=' + h1.seat1LastPraca + ')', h1.seat1LastPraca === 77);

  // H2 round-trip w sesji
  for (const v of [0, 1500]) {
    await D((n) => window.__hotSeatTestDebug.setOwnerPracaPoolForTest(1, n), v);
    await D(() => window.__pracaPoolSaveLoadTestDebug.setPool(405));
    await D(() => window.__pracaPoolSaveLoadTestDebug.roundTrip());
    const r = { v, seat0: await D(() => window.__pracaPoolSaveLoadTestDebug.getPool()), seat1: await seat1() };
    meas.h2.push(r);
    assert('H2 round-trip fotel 1 = ' + v + ' i fotel 0 = 405 (po=' + JSON.stringify(r) + ')', r.seat1 === v && r.seat0 === 405);
  }
  await D(() => { window.__pracaPoolSaveLoadTestDebug.setPool(11); window.__hotSeatTestDebug.setOwnerPracaPoolForTest(1, 22); });
  await D(() => window.__pracaPoolSaveLoadTestDebug.roundTrip());
  const iso = { s0: await D(() => window.__pracaPoolSaveLoadTestDebug.getPool()), s1: await seat1() };
  assert('H2.3 izolacja foteli po round-tripie 11/22 (po=' + JSON.stringify(iso) + ')', iso.s0 === 11 && iso.s1 === 22);

  // H4 wartosci graniczne fotela 1
  const cases = [
    ['5e9 -> 1_000_000', 5e9, 1_000_000], ['1_000_000 zostaje', 1_000_000, 1_000_000], ['999_999 zostaje', 999_999, 999_999],
    ['-5 -> 0', -5, 0], ['"abc" -> 0', 'abc', 0], ['null -> 0', null, 0], ['0 -> 0', 0, 0],
  ];
  for (const [label, input, want] of cases) {
    await D(() => { window.__pracaPoolSaveLoadTestDebug.setPool(405); window.__hotSeatTestDebug.setOwnerPracaPoolForTest(1, 55); });
    await D((v) => window.__pracaPoolSaveLoadTestDebug.roundTripMeta({ pracaPoolByHuman: [[0, 999], [1, v]] }), input);
    const r = { input, seat0: await D(() => window.__pracaPoolSaveLoadTestDebug.getPool()), seat1: await seat1() };
    meas.h4.push(r);
    assert('H4 fotel 1 ' + label + ' (po=' + JSON.stringify(r.seat1) + ')', r.seat1 === want && r.seat0 === 405);
  }
  await D(() => window.__hotSeatTestDebug.setOwnerPracaPoolForTest(1, 55));
  await D(() => window.__pracaPoolSaveLoadTestDebug.roundTripMeta({ pracaPoolByHuman: 'zly' }));
  let g = await seat1();
  assert('H4.8 pole nie-tablica -> brak bledu, fotel 1 = 0 (po=' + JSON.stringify(g) + ')', g === 0);
  await D(() => window.__pracaPoolSaveLoadTestDebug.roundTripMeta({ pracaPoolByHuman: [null, 5, ['x', 9], [1], [42, 9], [1, 31]] }));
  g = await seat1();
  assert('H4.9 smieciowe wpisy ignorowane, poprawny [1,31] wczytany (po=' + JSON.stringify(g) + ')', g === 31);
  await D(() => window.__pracaPoolSaveLoadTestDebug.roundTripMeta({}, ['pracaPoolByHuman']));
  g = await seat1();
  assert('H4.10 brak pola w meta -> fotel 1 = 0, bez bledu (po=' + JSON.stringify(g) + ')', g === 0);

  // H3 stary zapis po pelnym przeladowaniu strony
  await page.reload({ waitUntil: 'load', timeout: 120000 });
  await waitHooks(page);
  const errBefore = errors.length;
  await loadSlotAndWait('hs-praca-old');
  const h3 = { seat0: await D(() => window.__pracaPoolSaveLoadTestDebug.getPool()), seat1: await seat1(), newErrors: errors.slice(errBefore) };
  meas.h3 = h3;
  assert('H3.1 stary zapis: fotel 0 = 405 (po=' + h3.seat0 + ')', h3.seat0 === 405);
  assert('H3.2 stary zapis: fotel 1 = 0, bez wyjatku (po=' + JSON.stringify(h3.seat1) + ')', h3.seat1 === 0);
  assert('H3.3 stary zapis: zero pageerror/console.error przy wczytaniu', h3.newErrors.length === 0, h3.newErrors.slice(0, 3));

  assert('C zero pageerror/console.error w calym tescie (n=' + errors.length + ')', errors.length === 0, errors.slice(0, 5));
  if (EVIDENCE) { fs.mkdirSync(path.dirname(EVIDENCE), { recursive: true }); fs.writeFileSync(EVIDENCE, JSON.stringify(meas, null, 2)); }
  await browser.close();
  try { fs.rmSync(OUT_DIR, { recursive: true, force: true }); } catch (_) {}
  console.log('\nsaveload-praca-pool-hotseat-live-test: ' + pass + ' pass / ' + fail + ' fail');
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.error('[saveload-praca-pool-hotseat] BLAD:', e && e.stack || e); process.exit(2); });
