'use strict';
/**
 * defeat-last-city-barbarians-live-test.cjs — R-WEB-DEFEAT-LAST-CITY-BARBARIANS-Q1.
 *
 * Cel: w ZYWEJ grze (headless Chromium, realny bundle) gracz, ktory traci OSTATNIE miasto
 * na rzecz barbarzyncow, ma przegrac na koncu tury: ekran przegranej (`.vsc-overlay.lose`),
 * `gameOver=true`, kolejny `endTurn()` nie rusza gry. Wariant kontrolny: gracz z osadnikiem,
 * ktorego miasto NIE zostaje zdobyte, gra dalej (zero falszywej przegranej).
 *
 * Stan wejsciowy (hak `__defeatLastCityTestDebug` w main.ts): gracz ma jedno miasto (?playtest=mapa)
 * oraz osadnika (dokladany hakiem). Przejecie miasta idzie przez realny lejek
 * `__rebelProtectionTestDebug.captureViaBattle` (ta sama `captureCityWithoutBattle`, ktora
 * sciezka barbarzyncow konczy zdobycie), a EOT/checkVictory przez realne `endTurn()`.
 *
 * Usage (z gra/): node tools/defeat-last-city-barbarians-live-test.cjs
 * Build idzie do katalogu z DEFEAT_TEST_OUT_DIR (domyslnie os.tmpdir()), poza repo.
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const OUT_DIR = process.env.DEFEAT_TEST_OUT_DIR
  || fs.mkdtempSync(path.join(os.tmpdir(), 'defeat-last-city-'));
const OUT_HTML = 'file://' + path.join(OUT_DIR, 'index.html') + '?playtest=mapa';
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const BARBARIAN_OWNER_ID = -1;

let pass = 0;
let fail = 0;
function assert(label, cond, detail) {
  if (cond) { pass++; console.log(`  OK  ${label}`); }
  else {
    fail++;
    console.error(` FAIL ${label}` + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : ''));
  }
}
function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

function buildBundle() {
  execSync(
    `node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(OUT_DIR)} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe' },
  );
  if (!fs.existsSync(path.join(OUT_DIR, 'index.html'))) throw new Error('build bez index.html');
}

async function launchBrowser(chromium) {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    return await chromium.launch({
      headless: true,
      executablePath: FALLBACK_CHROME,
      args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
    });
  }
}

async function gotoPlaytestMapa(page) {
  await page.goto(OUT_HTML, { waitUntil: 'load', timeout: 120000 });
  await page.waitForSelector('.civ-hud, .civ-ux-frame, .civ-cs', { timeout: 120000 });
  for (let i = 0; i < 90; i++) {
    if ((await page.locator('text=Tworzenie świata').count()) === 0) break;
    await wait(1000);
  }
  await page.waitForFunction(
    () => !!window.__eraTestDebug && window.__eraTestDebug.getWorldState().citiesLen > 0
      && window.__eraTestDebug.getWorldState().turn === 1,
    undefined,
    { timeout: 120000 },
  );
  await wait(300);
}

/** Realne endTurn() + czekanie az tura sie domknie (wzorzec ai-wojny-zwykle-cap-dwa-miasta-test). */
async function runEndTurnAndSettle(page, timeoutMs = 90000) {
  const turnBefore = await page.evaluate(() => window.__eraTestDebug.getWorldState().turn);
  await page.evaluate(() => window.__eraTestDebug.endTurn());
  const t0 = Date.now();
  let settled = false;
  while (Date.now() - t0 < timeoutMs) {
    const st = await page.evaluate(() => ({
      inProg: window.__eraTestDebug.isEndTurnInProgress(),
      turn: window.__eraTestDebug.getWorldState().turn,
    }));
    if (st.turn > turnBefore && !st.inProg) { settled = true; break; }
    await page.evaluate(() => {
      const btn = document.querySelector('.pb-overlay [data-act="auto"]');
      if (btn) btn.click();
    });
    await wait(200);
  }
  await wait(150);
  return settled;
}

async function scenarioDefeat(page) {
  console.log('\n-- A. Gracz z osadnikiem traci JEDYNE miasto na rzecz barbarzyncow --');
  await gotoPlaytestMapa(page);
  const cityIds = await page.evaluate(() => window.__defeatLastCityTestDebug.getPlayerCityIds());
  assert('A1: gracz ma dokladnie jedno miasto na starcie', cityIds.length === 1, cityIds);
  const settlerOk = await page.evaluate(() => window.__defeatLastCityTestDebug.addSettlerForPlayer());
  assert('A2: dolozono osadnika gracza', settlerOk === true);
  const settlers = await page.evaluate(() => window.__defeatLastCityTestDebug.countPlayerSettlers());
  assert('A3: gracz ma osadnika przed utrata miasta', settlers === 1, settlers);
  await page.evaluate((id) => window.__rebelProtectionTestDebug.captureViaBattle(id, -1), cityIds[0]);
  const owner = await page.evaluate((id) => window.__defeatLastCityTestDebug.getOwnerOfCity(id), cityIds[0]);
  assert('A4: miasto przeszlo na barbarzyncow (ownerId -1)', owner === BARBARIAN_OWNER_ID, owner);
  const turnBefore = await page.evaluate(() => window.__eraTestDebug.getWorldState().turn);
  const settled = await runEndTurnAndSettle(page);
  assert('A5: endTurn domkniety', settled);
  const loseOverlay = await page.locator('.vsc-overlay.lose').count();
  const gameOver = await page.evaluate(() => window.__defeatLastCityTestDebug.isGameOver());
  assert('A6: ekran przegranej (.vsc-overlay.lose) po EOT', loseOverlay === 1, loseOverlay);
  assert('A7: gameOver=true', gameOver === true, gameOver);
  const turnAfter = await page.evaluate(() => window.__eraTestDebug.getWorldState().turn);
  await page.evaluate(() => window.__eraTestDebug.endTurn());
  await wait(1500);
  const turnAfter2 = await page.evaluate(() => window.__eraTestDebug.getWorldState().turn);
  assert('A8: kolejny endTurn nie rusza gry po przegranej', turnAfter2 === turnAfter, { turnBefore, turnAfter, turnAfter2 });
  await page.screenshot({ path: path.join(OUT_DIR, 'defeat-screen.png') });
}

async function scenarioControl(page) {
  console.log('\n-- B. Kontrola: gracz z osadnikiem, miasto NIE zdobyte -> gra trwa --');
  await gotoPlaytestMapa(page);
  const added = await page.evaluate(() => window.__defeatLastCityTestDebug.addSettlerForPlayer());
  assert('B1: dolozono osadnika', added === true);
  const settled = await runEndTurnAndSettle(page);
  assert('B2: endTurn domkniety', settled);
  const overlays = await page.locator('.vsc-overlay').count();
  const gameOver = await page.evaluate(() => window.__defeatLastCityTestDebug.isGameOver());
  assert('B3: brak ekranu konca gry', overlays === 0 && gameOver === false, { overlays, gameOver });
}

async function main() {
  let chromium;
  try { ({ chromium } = require('playwright')); }
  catch (e) { console.error('playwright niedostepny (uruchom z gra/).'); process.exit(1); }
  console.log('[defeat-last-city] build do ' + OUT_DIR);
  buildBundle();
  const browser = await launchBrowser(chromium);
  const pageErrors = [];
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => pageErrors.push('pageerror: ' + e.message));
    await scenarioDefeat(page);
    await page.close();
    const page2 = await ctx.newPage();
    page2.on('pageerror', (e) => pageErrors.push('pageerror: ' + e.message));
    await scenarioControl(page2);
    await page2.close();
  } finally {
    await browser.close();
  }
  assert('C1: brak pageerror w scenariuszach', pageErrors.length === 0, pageErrors.slice(0, 5));
  console.log(`\nWYNIK: PASS=${pass} FAIL=${fail}`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error('[defeat-last-city] wyjatek:', e); process.exit(1); });
