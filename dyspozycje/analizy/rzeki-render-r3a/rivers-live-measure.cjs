'use strict';
/**
 * RIVERS3A-VISUAL (R-WEB-MAP-RIVER-RENDER-VISUAL-Q1): zrzuty z zywego Chromium + pomiar czasu klatki.
 * Uzycie: node rivers-live-measure.cjs <katalog-buildu> <etykieta> <katalog-wyjsciowy>
 * Start: __nnsMeasureDebug.startGame (seed 1, Standardowy, kontynenty), ?civTest=1&dev=1,
 * klawisz M (odkrycie lądu w trybie dev), zrzut calej mapy + zblizenie (DPR 2) + FPS (rAF, 10 s, 3 powtorzenia).
 */
const path = require('path');
const fs = require('fs');
const { chromium } = require('/home/user/The-Game/.claude/worktrees/wf_3eaa9e82-e1d-1/gra/node_modules/playwright');

const [buildDir, label, outDir] = process.argv.slice(2);
if (!buildDir || !label || !outDir) { console.error('usage: <buildDir> <label> <outDir>'); process.exit(2); }
fs.mkdirSync(outDir, { recursive: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function launch() {
  try { return await chromium.launch({ headless: true, args: ['--no-sandbox'] }); } catch (e) {
    return await chromium.launch({ headless: true, executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  }
}

(async () => {
  const browser = await launch();
  const result = { label, errors: [], fps: [] };
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => result.errors.push(String(e).slice(0, 200)));
    await page.goto('file://' + path.join(buildDir, 'index.html') + '?civTest=1&dev=1', { waitUntil: 'load', timeout: 120000 });
    await page.waitForFunction(() => !!window.__nnsMeasureDebug, undefined, { timeout: 120000 });
    await page.evaluate(() => window.__nnsMeasureDebug.startGame({ seed: 1, mapSize: 'Standardowy', typSwiata: 'kontynenty' }));
    const t0 = Date.now();
    for (;;) {
      const ready = await page.evaluate(() => window.__nnsMeasureDebug.worldReady());
      if (ready) break;
      if (Date.now() - t0 > 400000) throw new Error('timeout generowania swiata');
      await wait(500);
    }
    const awaiting = await page.evaluate(() => window.__nnsMeasureDebug.awaitingFirstCity());
    if (awaiting) await page.evaluate(() => window.__nnsMeasureDebug.foundFirstCity());
    await wait(1500);
    await page.waitForSelector('.civ-map-toolbar', { timeout: 60000 }).catch(() => {});
    await page.waitForFunction(() => { const o = document.querySelector('.civ-map-load-overlay'); return !o || getComputedStyle(o).display === 'none' || o.getBoundingClientRect().width < 2; }, undefined, { timeout: 240000 }).catch(() => {});
    await wait(1000);
    await page.keyboard.press('Escape');
    await wait(500);
    await page.keyboard.press('KeyM');
    await wait(2500);
    const zoomPct = () => page.evaluate(() => {
      const el = document.querySelector('.civ-hud-util-dock .civ-hud-zoom-pct');
      return el ? el.textContent.trim() : null;
    });
    const clickZoom = (sign) => page.evaluate((s) => {
      const btns = Array.from(document.querySelectorAll('.civ-hud-util-dock button'));
      const b = btns.find((x) => (x.textContent || '').trim() === s);
      if (b) b.click();
      return !!b;
    }, sign);
    // Widok calej mapy: zoom w dol (minimum), potem zrzut.
    for (let i = 0; i < 6; i += 1) { await clickZoom('−'); await wait(300); }
    await wait(1500);
    result.zoomOutPct = await zoomPct();
    await page.screenshot({ path: path.join(outDir, `${label}-cala-mapa.png`) });
    // Zblizenie 2x: zoom w gore (dwa kroki od minimum), zrzut srodka.
    for (let i = 0; i < 2; i += 1) { await clickZoom('+'); await wait(300); }
    await wait(1500);
    result.zoomInPct = await zoomPct();
    await page.screenshot({ path: path.join(outDir, `${label}-zblizenie-2x.png`) });
    for (let i = 0; i < 2; i += 1) { await clickZoom('−'); await wait(300); }
    await wait(1500);
    for (let rep = 1; rep <= 3; rep += 1) {
      await wait(2000);
      const m = await page.evaluate(() => new Promise((resolve) => {
        const frames = []; let last = null; const end = performance.now() + 10000;
        const step = (ts) => {
          if (last !== null) frames.push(ts - last);
          last = ts;
          if (performance.now() < end) requestAnimationFrame(step);
          else {
            const avg = frames.reduce((a, b) => a + b, 0) / Math.max(1, frames.length);
            resolve({ n: frames.length, avgFrameMs: +avg.toFixed(2), fps: +(1000 / avg).toFixed(2) });
          }
        };
        requestAnimationFrame(step);
      }));
      result.fps.push(m);
      console.log(`[${label}] FPS rep${rep}: ${JSON.stringify(m)}`);
    }
    await page.screenshot({ path: path.join(outDir, `${label}-po-pomiarze.png`) });
  } catch (e) {
    result.fatal = String(e).slice(0, 300);
  } finally {
    await browser.close().catch(() => {});
  }
  fs.writeFileSync(path.join(outDir, `${label}-wynik.json`), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
})();
