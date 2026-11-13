'use strict';
/**
 * hotseat-ustawienia-kopiowane-test.cjs — R-HOTSEAT-USTAWIENIA-KOPIOWANE-Q1.
 *
 * Realny test Chromium/Playwright: uruchamia kreator hot-seat, tworzy dwa fotele,
 * zapisuje niedomyślne ustawienia i skarbiec fotela 1 przez testowy seam nad tymi
 * samymi mapami/state'ami co produkcyjny kod, przełącza REALNĄ funkcją
 * switchActiveHuman() i sprawdza świeży fotel 2. Fotel 2 musi dostać DEFAULT_*,
 * a nie wartości fotela 1.
 *
 * Run from gra/: node tools/hotseat-ustawienia-kopiowane-test.cjs
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(GRA_DIR, '..');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const RUN_ID = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
const OUT_DIR = path.join(os.tmpdir(), `civ-hotseat-settings-${RUN_ID}`);
const OUT_HTML = 'file://' + path.join(OUT_DIR, 'index.html');
const EVIDENCE_DIR = path.join(REPO_ROOT, 'dowody');

process.on('exit', () => {
  try { fs.rmSync(OUT_DIR, { recursive: true, force: true }); } catch { /* best-effort */ }
});

function log(msg) { console.log('[hotseat-ustawienia-kopiowane-test] ' + msg); }
function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function buildBundle() {
  execSync(
    `node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(OUT_DIR)} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe' },
  );
  if (!fs.existsSync(path.join(OUT_DIR, 'index.html'))) throw new Error('brak index.html po buildzie');
}

async function launchBrowser(chromium) {
  try { return await chromium.launch({ headless: true }); }
  catch {
    return chromium.launch({
      headless: true,
      executablePath: FALLBACK_CHROME,
      args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
    });
  }
}

async function gotoMainMenu(page) {
  await page.goto(OUT_HTML, { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(
    () => !!window.__cityStateStartUnitsTestDebug && !!window.__hotSeatTestDebug,
    undefined,
    { timeout: 120000 },
  );
  await page.waitForSelector('.civ-menu', { timeout: 120000 });
}

async function openWizardToSettingsStep(page) {
  await page.locator('.civ-menu button', { hasText: 'Rozpocznij gr' }).first().click();
  await page.waitForSelector('.civ-newgame', { timeout: 30000 });
  await page.locator('.civ-newgame .cta-hero').click();
  await page.locator('.civ-newgame .nb.next').click();
  await page.locator('.civ-newgame .nb.next').click();
  await page.waitForSelector('.civ-newgame .seat2-toggle-row', { timeout: 15000 });
}

async function waitForWorld(page) {
  const deadline = Date.now() + 360000;
  while (Date.now() < deadline) {
    const state = await page.evaluate(() => window.__cityStateStartUnitsTestDebug.dumpState());
    const overlay = await page.locator('text=Tworzenie świata').count();
    if (!overlay && state.playerStartHex) return;
    await wait(400);
  }
  throw new Error('timeout: generacja świata');
}

async function main() {
  let chromium;
  try { ({ chromium } = require('playwright')); }
  catch { throw new Error('BLOCK: playwright nie znaleziony w node_modules'); }

  buildBundle();
  const browser = await launchBrowser(chromium);
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const failures = [];
  const check = (condition, label) => { if (!condition) failures.push(label); };
  try {
    await gotoMainMenu(page);
    await openWizardToSettingsStep(page);

    await page.locator('.civ-newgame .seat2-toggle-btn').click();
    await page.locator('.civ-newgame .start').click();
    await page.waitForSelector('.civ-newgame .seat2-dist-row', { timeout: 15000 });
    await page.locator('.civ-newgame .seat2-dist-opt', { hasText: 'Blisko' }).click();
    await page.locator('.civ-newgame .start').click();
    await waitForWorld(page);

    const seats = await page.evaluate(() => window.__hotSeatTestDebug.snapshotHumanSeatsForTest());
    const seat1 = 0;
    const seat2 = seats.humanOwnerIds.find(id => id !== seat1);
    check(seat2 !== undefined, `istnieje drugi fotel (got ${JSON.stringify(seats.humanOwnerIds)})`);
    if (seat2 === undefined) throw new Error('brak drugiego fotela');

    // Czerwony przed: fotel 1 dostaje wartości celowo różne od DEFAULT_*.
    await page.evaluate((ownerId) => {
      window.__hotSeatTestDebug.setOwnerSettingsForTest(ownerId, {
        procentBudynki: 50,
        procentPieniadz: 10,
        procentNauka: 60,
        procentLuksus: 30,
        poziomRacji: 1,
        skarbiec: 9876,
        nauka: 321,
      });
    }, seat1);
    const before = await page.evaluate((ownerId) => window.__hotSeatTestDebug.snapshotOwnerSettingsForTest(ownerId), seat1);
    fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'hotseat-ustawienia-kopiowane-przed-czerwony.png'), fullPage: true });

    check(before.work && before.work.procentBudynki === 50, `fotel 1 work=50 (got ${JSON.stringify(before.work)})`);
    check(before.trade && before.trade.procentPieniadz === 10 && before.trade.procentNauka === 60,
      `fotel 1 trade=10/60 (got ${JSON.stringify(before.trade)})`);
    check(before.ration === 1, `fotel 1 ration=1 (got ${before.ration})`);
    check(before.treasury === 9876, `fotel 1 treasury=9876 (got ${before.treasury})`);
    check(before.hud.zloto === 9876 && before.hud.nauka === 321,
      `HUD fotela 1 czyta własny state (got zloto=${before.hud.zloto}, nauka=${before.hud.nauka})`);

    // Zielony po: REALNY handoff do fotela 2, bez wcześniejszych zmian.
    await page.evaluate((ownerId) => window.__hotSeatTestDebug.switchActiveHuman(ownerId), seat2);
    const after = await page.evaluate((ownerId) => window.__hotSeatTestDebug.snapshotOwnerSettingsForTest(ownerId), seat2);
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'hotseat-ustawienia-kopiowane-po-zielony.png'), fullPage: true });

    check(after.work && after.work.procentBudynki === 70,
      `fotel 2 ma DEFAULT_PODZIAL_PRACY=70, nie 50 (got ${JSON.stringify(after.work)})`);
    check(after.trade && after.trade.procentPieniadz === 60 && after.trade.procentNauka === 20 && after.trade.procentLuksus === 20,
      `fotel 2 ma DEFAULT_PODZIAL_HANDLU=60/20/20, nie fotela 1 (got ${JSON.stringify(after.trade)})`);
    check(after.ration === 4, `fotel 2 ma DEFAULT_POZIOM_RACJI=4, nie 1 (got ${after.ration})`);
    check(after.treasury !== 9876, `fotel 2 nie dziedziczy skarbca fotela 1 (got ${after.treasury})`);
    check(after.hud.zloto !== 9876 && after.hud.nauka !== 321,
      `HUD fotela 2 nie czyta state'u fotela 1 (got zloto=${after.hud.zloto}, nauka=${after.hud.nauka})`);

    await page.evaluate((ownerId) => window.__hotSeatTestDebug.setOwnerSettingsForTest(ownerId, {
      procentBudynki: 81, procentPieniadz: 25, procentNauka: 25, procentLuksus: 50, poziomRacji: 2,
      skarbiec: 2468,
    }), seat2);
    const seat2Changed = await page.evaluate((ownerId) => window.__hotSeatTestDebug.snapshotOwnerSettingsForTest(ownerId), seat2);
    const seat1Still = await page.evaluate((ownerId) => window.__hotSeatTestDebug.snapshotOwnerSettingsForTest(ownerId), seat1);
    check(seat2Changed.work.procentBudynki === 81 && seat1Still.work.procentBudynki === 50,
      'zapis fotela 2 nie nadpisuje podziału pracy fotela 1');
    check(seat2Changed.treasury === 2468 && seat1Still.treasury === 9876,
      'zapis fotela 2 nie nadpisuje skarbca fotela 1');

    if (failures.length > 0) {
      console.error('RED: ' + failures.join(' | '));
      process.exitCode = 1;
    } else {
      console.log('GREEN: hotseat-ustawienia-kopiowane-test: 16 PASS, 0 FAIL');
    }
  } finally {
    await browser.close().catch(() => {});
  }
}

main().catch((error) => {
  console.error('BLOCK/FAIL:', error && error.stack ? error.stack : error);
  process.exitCode = 1;
});
