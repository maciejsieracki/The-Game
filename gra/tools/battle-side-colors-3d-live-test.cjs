'use strict';
/**
 * R-WEB-UI-BATTLE-3D-SIDE-COLORS-BLUE-RED-Q1 — test NA ZYWO kolorow STRON w widoku 3D bitwy.
 *
 * Uruchomienie (z katalogu gra/):
 *   SHOT_DIR=/abs/katalog node tools/battle-side-colors-3d-live-test.cjs
 *
 * Co robi (prawdziwa BattleScene w Chromium, xvfb/headless, preset bitwa_duza_pole):
 *  - dla roli gracza atk (gracz atakujacy) i def (gracz broniacy) na 2 rozdzielczosciach
 *    robi zrzut ekranu (SHOT_DIR) i liczy materialy THREE w kolorach stron;
 *  - oczekuje: gracz = BATTLE_PLAYER #3a6ad0 (niebieski), przeciwnik = BATTLE_ENEMY #c84040 (czerwony)
 *    w obu rolach; zloto 0xffd54a (dawny znacznik atakujacego) NIE moze tintowac 3D.
 * Wynik: liczby z surowego odczytu; kod wyjscia 1 przy FAIL.
 */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { createServer } = require('vite');

const root = path.resolve(__dirname, '..');
const SHOT_DIR = process.env.SHOT_DIR || path.join(process.cwd(), 'shots');
fs.mkdirSync(SHOT_DIR, { recursive: true });
const exe = [(require('./_chrome-path.cjs').resolveChromePath() || '/usr/bin/chromium'), process.env.CHROMIUM_PATH].find(p => p && fs.existsSync(p));

const BLUE = 0x3a6ad0;
const RED = 0xc84040;
const GOLD = 0xffd54a;
const VIEWPORTS = [{ w: 1024, h: 640 }, { w: 1280, h: 720 }];
const ROLES = ['atk', 'def'];

const fails = [];
const log = [];

async function runCase(browser, server, role, vp, legacy = false) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const tag = legacy ? '-LEGACY-kontrola' : '';
  const url = `http://127.0.0.1:${server.httpServer.address().port}/tools/battle-side-colors-3d-entry.html?role=${role}${legacy ? '&legacy=1' : ''}`;
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  await page.waitForFunction(() => window.__sc?.ready === true, undefined, { timeout: 60000 });
  await page.waitForTimeout(2500);
  const counts = await page.evaluate(() => {
    const out = {};
    const root3d = window.__sc.scene.scene;
    root3d.traverse(o => {
      const m = o.material;
      const mats = Array.isArray(m) ? m : (m ? [m] : []);
      for (const mm of mats) {
        if (mm && mm.color) {
          const h = mm.color.getHex();
          out[h] = (out[h] || 0) + 1;
        }
      }
    });
    return out;
  });
  const shot = path.join(SHOT_DIR, `side3d-${role}${tag}-${vp.w}x${vp.h}.png`);
  await page.screenshot({ path: shot });
  await ctx.close();
  // powiekszenie linii walki (DPR 3, wycinek wokol srodka widoku) do obejrzenia kolorow jednostek
  const zctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 3 });
  const zpage = await zctx.newPage();
  await zpage.goto(url, { waitUntil: 'load', timeout: 60000 });
  await zpage.waitForFunction(() => window.__sc?.ready === true, undefined, { timeout: 60000 });
  await zpage.waitForTimeout(2500);
  const zoom = path.join(SHOT_DIR, `side3d-${role}${tag}-${vp.w}x${vp.h}-zoom.png`);
  await zpage.screenshot({ path: zoom, clip: { x: vp.w / 2 - 110, y: vp.h / 2 - 90, width: 220, height: 180 } });
  await zctx.close();
  const c = { blue: counts[BLUE] || 0, red: counts[RED] || 0, gold: counts[GOLD] || 0 };
  const row = { role, legacy, viewport: `${vp.w}x${vp.h}`, counts: c, shot, zoom, pageErrors: errors };
  log.push(row);
  console.log(JSON.stringify(row));
  if (legacy) return; // kontrola negatywna: tylko zrzut, bez wyniku PASS/FAIL
  if (errors.length) fails.push(`${role} ${vp.w}x${vp.h}: pageerror ${errors.join(' | ')}`);
  if (c.blue === 0) fails.push(`${role} ${vp.w}x${vp.h}: brak materialow niebieskich (gracz)`);
  if (c.red === 0) fails.push(`${role} ${vp.w}x${vp.h}: brak materialow czerwonych (przeciwnik)`);
  if (c.gold !== 0) fails.push(`${role} ${vp.w}x${vp.h}: zloto 0xffd54a tintuje 3D (${c.gold} materialow)`);
}

(async () => {
  const server = await createServer({ root, configFile: path.join(root, 'vite.config.ts'), logLevel: 'error',
    server: { host: '127.0.0.1', port: 0, strictPort: false } });
  await server.listen();
  const browser = await chromium.launch({ headless: true, executablePath: exe,
    args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    for (const role of ROLES) for (const vp of VIEWPORTS) await runCase(browser, server, role, vp);
    // kontrola negatywna zarzutu 1: gracz broni, ale scena dostaje stare wywolanie bez deployPlayerSide
    await runCase(browser, server, 'def', VIEWPORTS[1], true);
  } finally {
    await browser.close();
    await server.close();
  }
  console.log(`SUMMARY cases=${log.length} fails=${fails.length}`);
  for (const f of fails) console.log('FAIL ' + f);
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR', e); process.exit(2); });
