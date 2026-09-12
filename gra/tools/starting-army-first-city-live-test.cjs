'use strict';
/**
 * starting-army-first-city-live-test.cjs — H-MIASTA-PANSTWA-WOJSKO-ODNOWA-Q1.
 *
 * Live Chromium regression for the first-city-only starting army rule. The game is
 * started through the real doStartGame() hook, founding calls the real
 * tryFoundPlayerCityAt() path, and state is read back from the live engine.
 *
 * Run from gra/:
 *   STARTING_ARMY_CHROME_PATH=/path/to/chrome node tools/starting-army-first-city-live-test.cjs
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');

const GRA_DIR = path.resolve(__dirname, '..');
const RUN_ID = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
const OUT_DIR = path.join(os.tmpdir(), `civ-starting-army-first-city-${RUN_ID}`);
const OUT_HTML = `file://${path.join(OUT_DIR, 'index.html')}`;
const FALLBACK_CHROME = process.env.STARTING_ARMY_CHROME_PATH
  || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let pass = 0;
let fail = 0;
function check(label, condition, detail) {
  if (condition) {
    pass++;
    console.log(`  OK ${label}`);
  } else {
    fail++;
    console.error(` FAIL ${label}` + (detail === undefined ? '' : ` -- ${JSON.stringify(detail)}`));
  }
}

function buildBundle() {
  execFileSync(process.execPath, [
    './node_modules/vite/bin/vite.js', 'build', '--outDir', OUT_DIR, '--emptyOutDir',
  ], { cwd: GRA_DIR, stdio: 'pipe' });
  if (!fs.existsSync(path.join(OUT_DIR, 'index.html'))) {
    throw new Error('vite build nie wyprodukował index.html');
  }
}

async function launchBrowser() {
  try {
    return await chromium.launch({ headless: true });
  } catch {
    return chromium.launch({
      headless: true,
      executablePath: FALLBACK_CHROME,
      args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
    });
  }
}

async function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function waitForWorld(page) {
  const deadline = Date.now() + 180000;
  while (Date.now() < deadline) {
    const state = await page.evaluate(() => window.__cityStateStartUnitsTestDebug.dumpState());
    if (state.awaitingFirstPlayerCity === true && state.playerStartHex !== null) return state;
    await wait(500);
  }
  throw new Error('timeout generowania świata');
}

async function main() {
  buildBundle();
  const browser = await launchBrowser();
  const pageErrors = [];
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  page.on('pageerror', error => pageErrors.push(String(error)));
  try {
    await page.goto(OUT_HTML, { waitUntil: 'load', timeout: 120000 });
    await page.waitForFunction(
      () => !!window.__cityStateStartUnitsTestDebug && !!window.__hotSeatTestDebug,
      undefined,
      { timeout: 120000 },
    );

    await page.evaluate(() => window.__cityStateStartUnitsTestDebug.startNewGame('normal', 0, 'normal'));
    await waitForWorld(page);

    // Realny generator planu hot-seat rejestruje drugi owner/seat i jego własny heks.
    const seats = await page.evaluate(
      () => window.__hotSeatTestDebug.generateSecondHumanSeatForTest('chinczycy', 'daleko'),
    );
    const seat1 = 0;
    const seat2 = seats.secondOwnerId;
    const hex1 = seats.primaryHex;
    const hex2 = seats.secondHex;
    check('dwa fotele ludzkie są zarejestrowane',
      JSON.stringify(seats.humanOwnerIds) === JSON.stringify([seat1, seat2]));
    check('fotele mają różne heksy startowe',
      !!hex1 && !!hex2 && (hex1.q !== hex2.q || hex1.r !== hex2.r), { hex1, hex2 });

    const founded1 = await page.evaluate(
      () => window.__hotSeatTestDebug.foundPlayerCityForActiveSeat(),
    );
    check('fotel 1 zakłada pierwsze miasto przez realną ścieżkę', founded1 === true);
    let state = await page.evaluate(() => window.__cityStateStartUnitsTestDebug.dumpState());
    const seat1CitiesAfterFirst = state.cities.filter(city => city.ownerId === seat1);
    const seat1UnitsAfterFirst = state.units.filter(unit => unit.ownerId === seat1);
    check('fotel 1 ma jedno miasto po pierwszym founding', seat1CitiesAfterFirst.length === 1);
    check('fotel 1 dostaje dokładnie 2 jednostki startowe', seat1UnitsAfterFirst.length === 2,
      seat1UnitsAfterFirst);

    // The helper only prepares population/Praca so the second founding is legal;
    // the founding itself still executes the production path above.
    const foundedSecond = await page.evaluate(
      () => window.__hotSeatTestDebug.foundAdditionalPlayerCityForActiveSeat(true),
    );
    check('fotel 1 zakłada drugie miasto przez realną ścieżkę', foundedSecond === true);
    state = await page.evaluate(() => window.__cityStateStartUnitsTestDebug.dumpState());
    check('fotel 1 ma dwa miasta po drugim founding',
      state.cities.filter(city => city.ownerId === seat1).length === 2);
    check('drugie miasto fotela 1 nie przyznaje ponownie armii startowej',
      state.units.filter(unit => unit.ownerId === seat1).length === 2,
      state.units.filter(unit => unit.ownerId === seat1));

    await page.evaluate(ownerId => window.__hotSeatTestDebug.switchActiveHuman(ownerId), seat2);
    check('fotel 2 nadal oczekuje na własne pierwsze miasto',
      await page.evaluate(() => window.__hotSeatTestDebug.isAwaitingFirstPlayerCity()));
    const founded2 = await page.evaluate(
      () => window.__hotSeatTestDebug.foundPlayerCityForActiveSeat(),
    );
    check('fotel 2 zakłada pierwsze miasto przez realną ścieżkę', founded2 === true);
    state = await page.evaluate(() => window.__cityStateStartUnitsTestDebug.dumpState());
    check('fotel 2 ma własne miasto', state.cities.filter(city => city.ownerId === seat2).length === 1);
    check('fotel 2 dostaje własną, jednorazową armię startową',
      state.units.filter(unit => unit.ownerId === seat2).length === 2,
      state.units.filter(unit => unit.ownerId === seat2));

    check('zero błędów JS w Chromium', pageErrors.length === 0, pageErrors);
  } finally {
    await browser.close().catch(() => {});
    fs.rmSync(OUT_DIR, { recursive: true, force: true });
  }

  console.log(`starting-army-first-city-live-test: ${pass} pass, ${fail} fail`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch(error => {
  console.error('BLOCK:', error.stack || error);
  try { fs.rmSync(OUT_DIR, { recursive: true, force: true }); } catch { /* best effort */ }
  process.exit(2);
});
