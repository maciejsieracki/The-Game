'use strict';
/**
 * R-WEB-UI-ARMY-PANEL-GENERAL-LABEL-MULTISELECT-Q1 — test ZYWY w prawdziwej grze (Chromium):
 * stos 12 jednostek (generał w środku) na heksie gracza; sprawdza generała pierwszego z etykietą,
 * zaznaczenie 3 kart prawdziwymi kliknięciami, „ROZWIĄŻ ZAZNACZONE (3)” z potwierdzeniem i
 * rozwiązanie dokładnie tych 3, „Zaznacz wszystko” bez generała, ostrzeżenie przy generale.
 * Build: tools/army-panel-general-label-multiselect-live.vite.config.ts (outDir poza repo).
 * Użycie: node tools/army-panel-general-label-multiselect-live-test.cjs   (ARMY_LIVE_SHOT=<katalog> opcjonalnie)
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawn } = require('node:child_process');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const DIST = process.env.ARMY_LIVE_DIST || fs.mkdtempSync(path.join(os.tmpdir(), 'army-panel-live-dist-'));
const SHOT_DIR = process.env.ARMY_LIVE_SHOT || '';
const PORT = 18761;
const CHROME_CANDIDATES = [
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  '/usr/bin/chromium',
  '/opt/pw-browsers/chromium',
].filter(p => p && fs.existsSync(p));

let passed = 0;
function pass(msg) { passed += 1; console.log('PASS: ' + msg); }
function fail(msg) { throw new Error('FAIL: ' + msg); }

async function launchChromium() {
  const args = ['--no-sandbox', '--headless=new', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'];
  try {
    return await chromium.launch({ headless: true, args });
  } catch (firstError) {
    for (const executablePath of CHROME_CANDIDATES) {
      try { return await chromium.launch({ headless: true, executablePath, args }); } catch (_e) { /* next */ }
    }
    throw firstError;
  }
}

async function main() {
  execFileSync('node', ['./node_modules/vite/bin/vite.js', 'build', '--config', 'tools/army-panel-general-label-multiselect-live.vite.config.ts'], {
    cwd: ROOT, stdio: 'inherit', timeout: 180000, env: { ...process.env, ARMY_LIVE_DIST: DIST },
  });
  const server = spawn('python3', ['-m', 'http.server', String(PORT), '--directory', DIST, '--bind', '127.0.0.1'], { stdio: 'ignore' });
  const browser = await launchChromium();
  const dialogs = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1365, height: 900 } });
    page.on('dialog', d => { dialogs.push(d.message()); d.accept(); });
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(String(e)));
    await new Promise(resolve => setTimeout(resolve, 300));
    await page.goto('http://127.0.0.1:' + PORT + '/', { waitUntil: 'load', timeout: 60000 });
    await page.waitForFunction(() => window.__armyLive?.ready, undefined, { timeout: 30000 });
    await page.evaluate(() => window.__armyLive.start(981042));
    await page.waitForFunction(() => document.querySelector('canvas'), undefined, { timeout: 180000 });
    pass('production game starts (real main.ts, seed 981042)');
    const founded = await page.evaluate(() => window.__armyLive.foundCity());
    if (founded !== 'ok' && founded !== 'already') fail('founding the first city: ' + founded);

    const fixture = await page.evaluate(() => window.__armyLive.setupStack());
    if (fixture.error) fail('fixture: ' + fixture.error);
    const { q, r, ids } = fixture;
    await page.evaluate(() => window.__armyLive.selectUnit('live-w0'));
    await page.waitForSelector('.sp-unit-stack-card', { timeout: 10000 });
    const cardCount = await page.locator('.sp-unit-stack-card').count();
    if (cardCount !== 12) fail('expected 12 stack cards in the real panel, got ' + cardCount);

    // (1) Generał pierwszy na liście z rolą i typem.
    const firstId = await page.locator('.sp-unit-stack-card').first().getAttribute('data-unit');
    if (firstId !== 'live-general') fail('general is not first in the real stack panel: ' + firstId);
    const firstText = await page.locator('.sp-unit-stack-card').first().innerText();
    if (!firstText.includes('★ Generał') && !firstText.includes('Wódz')) fail('general card has no role label: ' + firstText);
    pass('real stack panel: general card first with role label');

    // (2) Zaznacz 3 prawdziwymi kliknięciami w pola wyboru.
    for (const id of ['live-w0', 'live-w1', 'live-w2']) {
      await page.locator('.sp-unit-pick[data-pick="' + id + '"]').click();
    }
    const counter = await page.locator('[data-pick-count]').innerText();
    if (counter !== 'Zaznaczono 3 z 12') fail('picked counter after 3 clicks: ' + counter);
    if (await page.locator('.sp-unit-stack-card.picked').count() !== 3) fail('expected 3 highlighted picked cards');
    const label = await page.locator('.uc-act-disband').innerText();
    if (label !== 'ROZWIĄŻ ZAZNACZONE (3)') fail('disband label: ' + label);
    pass('3 real pick clicks: counter "Zaznaczono 3 z 12", 3 highlighted cards, "ROZWIĄŻ ZAZNACZONE (3)"');
    if (SHOT_DIR) await page.screenshot({ path: path.join(SHOT_DIR, 'live-panel-stosu-3-zaznaczone.png'), fullPage: false });

    // (3) ROZWIĄŻ na zaznaczonym zbiorze: potwierdzenie i rozwiązanie dokładnie tych 3.
    const beforeIds = await page.evaluate(([qq, rr]) => window.__armyLive.stackIds(qq, rr), [q, r]);
    await page.locator('.uc-act-disband').click();
    await page.waitForTimeout(400);
    const afterIds = await page.evaluate(([qq, rr]) => window.__armyLive.stackIds(qq, rr), [q, r]);
    const removed = beforeIds.filter(id => !afterIds.includes(id)).sort();
    if (JSON.stringify(removed) !== JSON.stringify(['live-w0', 'live-w1', 'live-w2'])) fail('ROZWIĄŻ removed ' + JSON.stringify(removed));
    if (afterIds.length !== beforeIds.length - 3) fail('stack size after disband: ' + afterIds.length + ' from ' + beforeIds.length);
    if (!dialogs.some(m => m.startsWith('Rozwiązać') && m.includes('3'))) fail('no confirmation for 3 units: ' + JSON.stringify(dialogs));
    pass('ROZWIĄŻ with 3 picked: confirm "' + dialogs[dialogs.length - 1] + '", removed exactly live-w0..w2');

    // (4) „Zaznacz wszystko” bez generała; „Odznacz” czyści zbiór.
    // Wybrana jednostka (w0) została rozwiązana: wybierz ocalałą, żeby panel stosu pozostał otwarty.
    await page.evaluate(() => window.__armyLive.selectUnit('live-w3'));
    await page.waitForSelector('.sp-unit-stack-card', { timeout: 10000 });
    await page.locator('[data-act="pick-all"]').click();
    const pickedAll = await page.locator('.sp-unit-stack-card.picked').count();
    const generalPicked = await page.locator('.sp-unit-stack-card[data-unit="live-general"].picked').count();
    if (generalPicked !== 0) fail('"Zaznacz wszystko" picked the general');
    if (pickedAll !== 8) fail('"Zaznacz wszystko" picked ' + pickedAll + ', expected 8 (9 cards minus general)');
    pass('"Zaznacz wszystko" picks 8 of 9 cards, general stays unpicked');
    await page.locator('[data-act="pick-none"]').click();
    if (await page.locator('.sp-unit-stack-card.picked').count() !== 0) fail('"Odznacz" did not clear picks');
    pass('"Odznacz" clears the picked set');

    // (5) Generał w zaznaczeniu: potwierdzenie z ostrzeżeniem, rozwiązanie generała i jednego Wojownika.
    await page.locator('.sp-unit-pick[data-pick="live-general"]').click();
    await page.locator('.sp-unit-pick[data-pick="live-w4"]').click();
    const beforeGen = await page.evaluate(([qq, rr]) => window.__armyLive.stackIds(qq, rr), [q, r]);
    const dialogsBefore = dialogs.length;
    await page.locator('.uc-act-disband').click();
    await page.waitForTimeout(400);
    const afterGen = await page.evaluate(([qq, rr]) => window.__armyLive.stackIds(qq, rr), [q, r]);
    const newDialogs = dialogs.slice(dialogsBefore);
    if (!newDialogs.some(m => m.includes('generał') || m.includes('Generał') || m.includes('wódz'))) fail('no general warning in confirm: ' + JSON.stringify(newDialogs));
    const removedGen = beforeGen.filter(id => !afterGen.includes(id)).sort();
    if (JSON.stringify(removedGen) !== JSON.stringify(['live-general', 'live-w4'])) fail('general case removed ' + JSON.stringify(removedGen));
    pass('general in the picked set: warning in confirm, removed exactly live-general and live-w4');

    if (pageErrors.length) fail('page errors: ' + JSON.stringify(pageErrors.slice(0, 3)));
    console.log(`${passed}/${passed} PASS (live)`);
  } finally {
    await browser.close();
    server.kill();
    if (!process.env.ARMY_LIVE_DIST) fs.rmSync(DIST, { recursive: true, force: true });
  }
}

main().catch(error => { console.error(error.message || error); process.exitCode = 1; });
