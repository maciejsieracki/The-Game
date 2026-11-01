'use strict';
/**
 * live-verify-robocza-common.cjs — R-WEB-LIVE-VERIFY-ROBOCZA-Q1.
 * Wspólny sterownik PRAWDZIWEJ gry (gotowy bundle gra-robocza/Gra-ROBOCZA.html, Chromium + Playwright).
 * Zero zmian w gra/src; zero buildu. Kreator "Nowa gra" jest sterowany realnym DOM-em (jak gracz),
 * ziarno wymuszane jednorazowym podstawieniem Math.random (newGameFlow.ts:2134 losuje seed = floor(random*1e6)).
 */
const path = require('path');
const fs = require('fs');

const REPO = path.resolve(__dirname, '..', '..');
const BUNDLE = process.env.ROBOCZA_HTML || path.join(REPO, 'gra-robocza', 'Gra-ROBOCZA.html');
const URL = 'file://' + BUNDLE + '?skipMenuRedirect=1';
const EVID = path.join(REPO, 'dyspozycje', 'autobot', 'runs', 'R-WEB-LIVE-VERIFY-ROBOCZA-Q1', 'evidence');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function launch() {
  const { chromium } = require('playwright');
  const args = ['--no-sandbox', '--headless=new', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'];
  try {
    return await chromium.launch({ headless: true, executablePath: '/opt/pw-browsers/chromium', args });
  } catch (e) {
    return chromium.launch({ headless: true, args });
  }
}

async function openMenu(browser, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  const page = await ctx.newPage();
  const logs = [];
  const errors = [];
  page.on('console', (m) => { const t = m.text(); logs.push(t); if (m.type() === 'error') errors.push(t); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  await page.goto(URL + (opts.query || ''), { waitUntil: 'load', timeout: 180000 });
  await page.waitForSelector('.civ-menu', { timeout: 180000 });
  await wait(300);
  return { ctx, page, logs, errors };
}

async function clickText(page, re) {
  const ok = await page.evaluate((src) => {
    const rx = new RegExp(src);
    const b = Array.from(document.querySelectorAll('button')).find((x) => rx.test(x.textContent || '') && x.offsetParent !== null);
    if (!b) return false; b.click(); return true;
  }, re.source);
  return ok;
}

async function activeStepLabel(page) {
  return ((await page.locator('.civ-newgame .stepbar .si.active .si-l').first().textContent().catch(() => '')) || '').trim();
}

async function gotoStep(page, label) {
  for (let i = 0; i < 10; i++) {
    const cur = await activeStepLabel(page);
    if (cur === label) return;
    if (cur === 'Intro') await page.locator('.civ-newgame .cta-hero').click();
    else await page.locator('.civ-newgame .nav .nb.next').click();
    await wait(200);
  }
  throw new Error('gotoStep ' + label + ' nieudane, aktywny: ' + (await activeStepLabel(page)));
}

async function gridRows(page) {
  return page.evaluate(() => Array.from(document.querySelectorAll('.civ-newgame .sett-grid .srow')).map((row) => ({
    lbl: (row.querySelector('.sl')?.textContent || '').trim(),
    val: (row.querySelector('.sv')?.textContent || '').trim(),
  })));
}

async function clickGridArrow(page, lbl, dir) {
  const ok = await page.evaluate(({ lbl, dir }) => {
    const row = Array.from(document.querySelectorAll('.civ-newgame .sett-grid .srow'))
      .find((r) => (r.querySelector('.sl')?.textContent || '').trim() === lbl);
    if (!row) return false;
    const arrows = row.querySelectorAll('.sctl .arr');
    const btn = dir < 0 ? arrows[0] : arrows[arrows.length - 1];
    if (!btn) return false;
    btn.click();
    return true;
  }, { lbl, dir });
  await wait(150);
  return ok;
}

const valueOf = (rows, lbl) => { const r = rows.find((x) => x.lbl === lbl); return r ? r.val : undefined; };

/** Ustawia "Typ świata" na zadany napis przez strzałki (kolejność Kontynenty -> Pangea -> Wyspy -> Ziemia). */
async function setWorldType(page, wanted) {
  for (let i = 0; i < 6; i++) {
    const rows = await gridRows(page);
    if (valueOf(rows, 'Typ świata') === wanted) return true;
    await clickGridArrow(page, 'Typ świata', 1);
  }
  return false;
}

/**
 * Start gry z kreatora z ziarnem `seed` (podstawienie Math.random na czas kroku Start do logu "[NewGame] Mapa").
 * Zwraca { seedSeen, mapLog }.
 */
async function startFromWizard(sess, seed) {
  const { page, logs } = sess;
  const before = logs.length;
  await page.evaluate((s) => {
    window.__origRandom = Math.random;
    window.__seedRand = (s + 0.5) / 1000000;
    Math.random = () => window.__seedRand;
  }, seed);
  await gotoStep(page, 'Start');
  const t0 = Date.now();
  let mapLog = null;
  while (Date.now() - t0 < 480000) {
    mapLog = logs.slice(before).find((l) => /\[NewGame\] Mapa:/.test(l));
    if (mapLog) break;
    await wait(1000);
  }
  await page.evaluate(() => { if (window.__origRandom) Math.random = window.__origRandom; });
  const m = mapLog && mapLog.match(/seed=(\d+)/);
  return { seedSeen: m ? Number(m[1]) : null, mapLog, genMs: Date.now() - t0 };
}

async function waitAwaitingCity(page, timeoutMs = 300000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const st = await page.evaluate(() => window.__cityStateStartUnitsTestDebug && window.__cityStateStartUnitsTestDebug.dumpState());
    const overlay = await page.evaluate(() => Array.from(document.querySelectorAll('*')).some((el) => el.textContent && el.textContent.includes('Tworzenie świata') && el.children.length === 0 && el.offsetParent !== null));
    if (st && st.awaitingFirstPlayerCity === true && st.playerStartHex && !overlay) return st;
    await wait(1000);
  }
  throw new Error('waitAwaitingCity timeout');
}

async function foundCapital(page) {
  await page.evaluate(() => window.__cityStateStartUnitsTestDebug.foundPlayerStartCity());
  const t0 = Date.now();
  while (Date.now() - t0 < 120000) {
    const st = await page.evaluate(() => window.__cityStateStartUnitsTestDebug.dumpState());
    if (st.awaitingFirstPlayerCity === false && st.cities.some((c) => c.ownerId === 0)) return st;
    await wait(500);
  }
  throw new Error('foundCapital timeout');
}

function save(name, obj) {
  fs.mkdirSync(EVID, { recursive: true });
  fs.writeFileSync(path.join(EVID, name), JSON.stringify(obj, null, 2));
}

module.exports = {
  REPO, BUNDLE, URL, EVID, wait, launch, openMenu, clickText, gotoStep, gridRows, clickGridArrow, valueOf,
  setWorldType, startFromWizard, waitAwaitingCity, foundCapital, save,
};
