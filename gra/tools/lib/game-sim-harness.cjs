'use strict';
/**
 * game-sim-harness.cjs -- R-WEB-TEST-HOOK-HEADLESS-GAME-Q1.
 *
 * Harness Playwright do uruchamiania PRAWDZIWEJ gry w headless Chromium z hakiem
 * `window.__test` (gra/src/game/test-hook.ts, aktywny WYŁĄCZNIE przy `?testhook=1`).
 *
 * - Bundle Vite budowany WYŁĄCZNIE poza repo (os.tmpdir(), unikalny sufiks per proces),
 *   otwierany przez file://. Po zakończeniu katalog jest kasowany (sprzątanie po sobie).
 * - Zero `npm run build|dev` w repo: wywołanie `vite.js build --outDir <tmp>` jak w
 *   perf-long-session-live-test.cjs.
 * - Zero zmian w repo: harness nie zapisuje niczego w gra/.
 *
 * API:
 *   withSimBundle(fn)            -> buduje bundle, wywołuje fn({ bundleDir }), sprząta.
 *   openSimPage(browser, {bundleDir, testhook})  -> Page z załadowaną grą (opcjonalnie bez hooka).
 *   runSim(page, opts)           -> startGame + runTurns + snapshoty; zwraca metryki.
 *   launchBrowser()              -> Chromium (domyślny, fallback na /opt/pw-browsers).
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..', '..');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const RUN_ID = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

/** Buduje bundle Vite do katalogu tymczasowego poza repo. */
function buildBundle() {
  const outDir = path.join(os.tmpdir(), `civ-dist-simharness-${RUN_ID}`);
  execSync(
    `node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(outDir)} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe', maxBuffer: 64 * 1024 * 1024 },
  );
  if (!fs.existsSync(path.join(outDir, 'index.html'))) {
    throw new Error('Build nie wyprodukował index.html w ' + outDir);
  }
  return outDir;
}

function removeBundle(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* best-effort */ }
}

/** Buduje bundle, wywołuje fn, zawsze sprząta katalog. */
async function withSimBundle(fn) {
  const bundleDir = buildBundle();
  const onExit = () => removeBundle(bundleDir);
  process.on('exit', onExit);
  try {
    return await fn({ bundleDir });
  } finally {
    removeBundle(bundleDir);
    process.removeListener('exit', onExit);
  }
}

async function launchBrowser() {
  const { chromium } = require('playwright');
  try {
    return await chromium.launch({ headless: true });
  } catch (e) {
    return await chromium.launch({
      headless: true,
      executablePath: FALLBACK_CHROME,
      args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
    });
  }
}

/**
 * Otwiera grę. Z `testhook=true` dodaje `?testhook=1`. Zwraca { page, pageErrors }.
 * Gra startuje w menu; start partii idzie przez hak (startGame) albo bez hooka wcale.
 */
async function openSimPage(browser, { bundleDir, testhook = true }) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (err) => pageErrors.push(String(err && err.message || err).slice(0, 300)));
  const url = 'file://' + path.join(bundleDir, 'index.html') + (testhook ? '?testhook=1' : '');
  await page.goto(url, { waitUntil: 'load', timeout: 120000 });
  return { page, context, pageErrors };
}

/** Czeka aż hak będzie dostępny (tylko z ?testhook=1). */
async function waitForHook(page, timeout = 120000) {
  await page.waitForFunction(() => !!window.__test, undefined, { timeout });
}

/**
 * Startuje grę przez hak i czeka na świat (tura 1, miasta > 0).
 * opts: { seed, aiCount, cityStates, difficulty, era, playerPassive }.
 */
async function startSimGame(page, opts) {
  const t0 = Date.now();
  await page.evaluate((o) => window.__test.startGame(o), opts);
  await page.waitForFunction(
    () => !!window.__eraTestDebug && window.__eraTestDebug.getWorldState().citiesLen > 0
      && window.__eraTestDebug.getWorldState().turn === 1,
    undefined,
    { timeout: 300000, polling: 250 },
  );
  await wait(200);
  return Date.now() - t0;
}

/**
 * Pełna symulacja: start, N tur, snapshoty. Zwraca metryki.
 * opts: { seed, turns, aiCount, cityStates, difficulty, era, policy, flags, autoResolveBattles }
 */
async function runSim(page, opts) {
  const {
    seed, turns = 60, aiCount = 5, cityStates = 2, difficulty = 'normal', era = 'kamien',
    policy = 'pass', flags = {}, autoResolveBattles = true, playerPassive = true,
  } = opts;
  for (const [name, value] of Object.entries(flags)) {
    await page.evaluate(([n, v]) => window.__test.setFlag(n, v), [name, value]);
  }
  const startMs = await startSimGame(page, { seed, aiCount, cityStates, difficulty, era, playerPassive });
  const snap0 = await page.evaluate(() => window.__test.snapshot());
  const metrics = await page.evaluate(
    ([n, o]) => window.__test.runTurns(n, o),
    [turns, { autoResolveBattles, playerPolicy: policy }],
  );
  const snapEnd = await page.evaluate(() => window.__test.snapshot());
  return { startMs, snap0, snapEnd, metrics };
}

module.exports = {
  GRA_DIR,
  buildBundle,
  removeBundle,
  withSimBundle,
  launchBrowser,
  openSimPage,
  waitForHook,
  startSimGame,
  runSim,
  wait,
};
