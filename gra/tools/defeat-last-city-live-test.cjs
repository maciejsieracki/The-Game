'use strict';
/**
 * defeat-last-city-live-test.cjs — R-WEB-DEFEAT-LAST-CITY-BARBARIANS-Q1 (kryterium 2).
 *
 * Realny headless Chromium na prawdziwym bundle Vite (?playtest=mapa), zbudowanym do katalogu
 * tymczasowego poza repo (bez `npm run build`). Przejęcie miasta: REALNA `captureCityWithoutBattle`
 * (hak `__defeatTestDebug.captureCityByBarbarians`). Przegrana: REALNY końcowy check tury
 * (`__eraTestDebug.endTurn()` -> runWorldEndTurn -> checkDefeat).
 *
 *  S1. Gracz z JEDNYM miastem i OSADNIKIEM; barbarzyńcy zdobywają miasto -> po endTurn
 *      ekran przegranej (`.vsc-overlay.lose`), gameOver=true; kolejny endTurn nie rusza tury.
 *  S2. Gracz z JEDNYM miastem, bez osadnika; barbarzyńcy zdobywają miasto -> j.w.
 *  S3. Kontrola: gracz z DWOMA miastami; barbarzyńcy zdobywają jedno -> BEZ ekranu przegranej,
 *      gameOver=false, endTurn przesuwa turę.
 *  C.  Zero pageerror / console.error w scenariuszach.
 *
 * Zrzuty: <evidenceDir>/defeat-S*.png
 * Usage (z gra/): node tools/defeat-last-city-live-test.cjs [scratchDirAbs] [evidenceDirAbs]
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const SCRATCH = process.argv[2] || path.join(os.tmpdir(), 'civ-defeat-last-city-live-' + process.pid);
const EVIDENCE = process.argv[3] || path.join(GRA_DIR, '..', 'dyspozycje', 'autobot', 'runs', 'R-WEB-DEFEAT-LAST-CITY-BARBARIANS-Q1', 'evidence');
const OUT_HTML = 'file://' + path.join(SCRATCH, 'index.html') + '?playtest=mapa';
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const PLAYER = 0;
const OVERLAY_SEL = '#__victory_screen__.vsc-overlay.lose';

let pass = 0;
let fail = 0;
function assert(label, cond, detail) {
  if (cond) { pass++; console.log(`  OK  ${label}`); }
  else {
    fail++;
    console.error(` FAIL ${label}` + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : ''));
  }
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function buildBundle() {
  console.log('[defeat-last-city-live] vite build do katalogu tymczasowego:', SCRATCH);
  execSync(
    `node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(SCRATCH)} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe' },
  );
  if (!fs.existsSync(path.join(SCRATCH, 'index.html'))) throw new Error('Build bez index.html');
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
  for (let i = 0; i < 900; i++) {
    if ((await page.locator('text=Tworzenie świata').count()) === 0) break;
    await wait(1000);
  }
  await page.waitForFunction(
    () => !!window.__eraTestDebug && !!window.__defeatTestDebug && !!window.__cityCessionTestDebug
      && window.__eraTestDebug.getWorldState().citiesLen > 0
      && window.__eraTestDebug.getWorldState().turn === 1,
    undefined,
    { timeout: 900000 },
  );
  // Playtest startuje w ostatniej epoce -> dominacja w 1. turze wyprzedza przegraną; izolujemy regułę przegranej.
  await page.evaluate(() => window.__defeatTestDebug.setPlayerEraForTest(1));
  await wait(300);
}

/** Realny endTurn; czeka aż tura się przesunie albo ekran przegranej się pojawi. */
async function endTurnAndSettle(page, timeoutMs = 45000) {
  const before = await page.evaluate(() => window.__eraTestDebug.getWorldState().turn);
  await page.evaluate(() => window.__eraTestDebug.endTurn());
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const overlay = await page.locator(OVERLAY_SEL).count();
    const inProg = await page.evaluate(() => window.__eraTestDebug.isEndTurnInProgress());
    const turnNow = await page.evaluate(() => window.__eraTestDebug.getWorldState().turn);
    if (overlay > 0) break;
    if (!inProg && turnNow > before) break;
    await wait(150);
  }
  await wait(400);
  return {
    turnBefore: before,
    turnAfter: await page.evaluate(() => window.__eraTestDebug.getWorldState().turn),
    overlay: (await page.locator(OVERLAY_SEL).count()) > 0,
    gameOver: await page.evaluate(() => window.__defeatTestDebug.isGameOver()),
  };
}

async function openFresh(browser, errors) {
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push('console.error: ' + m.text());
  });
  await gotoPlaytestMapa(page);
  return page;
}

/** Zakłada dodatkowe miasto gracza (realny wzorzec z __cityCessionTestDebug) i zwraca jego id. */
async function setupTwoCities(page) {
  const first = await page.evaluate((o) => window.__defeatTestDebug.ownerCityIds(o)[0] ?? null, PLAYER);
  if (!first) throw new Error('setupTwoCities: gracz nie ma miasta');
  await page.evaluate(([o, cid]) => window.__cityCessionTestDebug.setCapitalForTest(o, cid), [PLAYER, first]);
  const extra = await page.evaluate((o) => window.__cityCessionTestDebug.foundExtraCityForTest(o), PLAYER);
  if (!extra) throw new Error('setupTwoCities: nie udało się założyć drugiego miasta');
  return extra;
}

async function main() {
  let chromium;
  try { ({ chromium } = require('playwright')); }
  catch (e) { console.error('[defeat-last-city-live] playwright nie znaleziony'); process.exit(1); }

  fs.mkdirSync(EVIDENCE, { recursive: true });
  buildBundle();

  const browser = await launchBrowser(chromium);
  const errors = [];
  try {
    // ---- S1: jedno miasto + osadnik; barbarzyńcy zdobywają miasto ----
    {
      console.log('\n-- S1: jedno miasto + osadnik, barbarzyńcy zdobywają miasto --');
      const page = await openFresh(browser, errors);
      const cities0 = await page.evaluate((o) => window.__defeatTestDebug.ownerCityIds(o), PLAYER);
      assert('S1 gracz ma dokładnie 1 miasto na starcie', cities0.length === 1, cities0);
      const settlerId = await page.evaluate((o) => window.__defeatTestDebug.addSettlerForOwner(o), PLAYER);
      assert('S1 osadnik gracza dodany', !!settlerId, settlerId);
      const sett = await page.evaluate((o) => window.__defeatTestDebug.countSettlersForOwner(o), PLAYER);
      assert('S1 gracz ma osadnika przed utratą miasta', sett >= 1, sett);
      const cap = await page.evaluate((cid) => window.__defeatTestDebug.captureCityByBarbarians(cid), cities0[0]);
      assert('S1 miasto przejęte przez barbarzyńców (ownerId=-1)', cap.ownerIdAfter === -1, cap);
      const r = await endTurnAndSettle(page);
      console.log('      S1 po endTurn:', JSON.stringify(r));
      assert('S1 ekran przegranej po realnym endTurn', r.overlay, r);
      assert('S1 gameOver=true', r.gameOver === true, r);
      const r2 = await endTurnAndSettle(page, 20000);
      assert('S1 kolejny endTurn nie przesuwa tury po przegranej', r2.turnAfter === r.turnAfter, { r, r2 });
      await page.screenshot({ path: path.join(EVIDENCE, 'defeat-S1-osadnik-utrata-miasta.png') });
      await page.close();
    }

    // ---- S2: jedno miasto, bez osadnika; barbarzyńcy zdobywają miasto ----
    {
      console.log('\n-- S2: jedno miasto, bez osadnika, barbarzyńcy zdobywają miasto --');
      const page = await openFresh(browser, errors);
      const cities0 = await page.evaluate((o) => window.__defeatTestDebug.ownerCityIds(o), PLAYER);
      assert('S2 gracz ma dokładnie 1 miasto na starcie', cities0.length === 1, cities0);
      const cap = await page.evaluate((cid) => window.__defeatTestDebug.captureCityByBarbarians(cid), cities0[0]);
      assert('S2 miasto przejęte przez barbarzyńców (ownerId=-1)', cap.ownerIdAfter === -1, cap);
      const r = await endTurnAndSettle(page);
      console.log('      S2 po endTurn:', JSON.stringify(r));
      assert('S2 ekran przegranej po realnym endTurn', r.overlay, r);
      assert('S2 gameOver=true', r.gameOver === true, r);
      const r2 = await endTurnAndSettle(page, 20000);
      assert('S2 kolejny endTurn nie przesuwa tury po przegranej', r2.turnAfter === r.turnAfter, { r, r2 });
      await page.close();
    }

    // ---- S3: kontrola — dwa miasta, barbarzyńcy zdobywają jedno ----
    {
      console.log('\n-- S3 (kontrola): dwa miasta, barbarzyńcy zdobywają jedno --');
      const page = await openFresh(browser, errors);
      const extra = await setupTwoCities(page);
      const owned = await page.evaluate((o) => window.__defeatTestDebug.ownerCityIds(o), PLAYER);
      assert('S3 gracz ma 2 miasta przed utratą', owned.length === 2, owned);
      const cap = await page.evaluate((cid) => window.__defeatTestDebug.captureCityByBarbarians(cid), extra);
      assert('S3 jedno miasto przejęte przez barbarzyńców', cap.ownerIdAfter === -1, cap);
      const r = await endTurnAndSettle(page);
      console.log('      S3 po endTurn:', JSON.stringify(r));
      assert('S3 BRAK ekranu przegranej (gracz ma jeszcze miasto)', !r.overlay, r);
      assert('S3 gameOver=false', r.gameOver === false, r);
      assert('S3 endTurn przesunął turę', r.turnAfter > r.turnBefore, r);
      await page.close();
    }

    assert('C. zero pageerror / console.error w scenariuszach', errors.length === 0, errors.slice(0, 5));
  } finally {
    await browser.close();
  }

  console.log(`\n[defeat-last-city-live] ${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('[defeat-last-city-live] wyjątek:', e && e.stack ? e.stack : e);
  process.exit(1);
});
