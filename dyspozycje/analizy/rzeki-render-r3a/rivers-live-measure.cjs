'use strict';
/**
 * RIVERS3A-VISUAL (R-WEB-MAP-RIVER-RENDER-VISUAL-Q1), wersja 2 (obrona Operatora r2).
 * Uzycie: node rivers-live-measure.cjs <katalog-buildu> <etykieta> <katalog-wyjsciowy> [query-extra]
 *   query-extra np. "&riverStage=2" (izolacja poziomow rzek; pusty = domyslny etap).
 * Start: __nnsMeasureDebug.startGame (seed 1, Standardowy, kontynenty), ?civTest=1&dev=1,
 * klawisz M (odkrycie lądu w trybie dev).
 * Zoom MAPY: kolko myszy na <canvas> (kamera camera.ts: krok = x1,12 / x0,88; clamp minDist..maxDist).
 *   - widok calej mapy: 40 krokow w dol (clamp do maxDist),
 *   - zblizenie 2x: od widoku calej mapy 6 krokow w gore (0,88^6 = 0,46 odleglosci => ok. 2,2x).
 * Zoom HUD (.civ-hud-zoom-pct) to skala CALEJ gry (85–150%), NIE kamera mapy; zapisywany osobno jako uiZoomPct.
 * FPS: rAF, 5 powtorzen x 20 s w tym samym widoku; zapisujemy liczbe klatek i srednia.
 */
const path = require('path');
const fs = require('fs');
const { chromium } = require(path.resolve(__dirname, '../../../gra/node_modules/playwright'));

const [buildDir, label, outDir, queryExtra = ''] = process.argv.slice(2);
if (!buildDir || !label || !outDir) { console.error('usage: <buildDir> <label> <outDir> [query-extra]'); process.exit(2); }
fs.mkdirSync(outDir, { recursive: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const FPS_REPS = Number(process.env.FPS_REPS || 5);
const FPS_WINDOW_MS = Number(process.env.FPS_WINDOW_MS || 20000);

async function launch() {
  try { return await chromium.launch({ headless: true, args: ['--no-sandbox'] }); } catch (e) {
    return await chromium.launch({ headless: true, executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  }
}

(async () => {
  const browser = await launch();
  const result = { label, query: queryExtra, errors: [], fps: [], steps: {} };
  const t00 = Date.now();
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => result.errors.push(String(e).slice(0, 200)));
    await page.goto('file://' + path.join(buildDir, 'index.html') + '?civTest=1&dev=1' + queryExtra, { waitUntil: 'load', timeout: 120000 });
    await page.waitForFunction(() => !!window.__nnsMeasureDebug, undefined, { timeout: 120000 });
    await page.evaluate(() => window.__nnsMeasureDebug.startGame({ seed: 1, mapSize: 'Standardowy', typSwiata: 'kontynenty' }));
    const t0 = Date.now();
    for (;;) {
      const ready = await page.evaluate(() => window.__nnsMeasureDebug.worldReady());
      if (ready) break;
      if (Date.now() - t0 > 400000) throw new Error('timeout generowania swiata');
      await wait(500);
    }
    result.worldGenMs = Date.now() - t0;
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
    // Wyjscie z trybu "ZAŁÓŻ MIASTO" (przycisk banera "Wyjdź"), zeby overlay nie zaslanial gornej czesci zrzutow.
    result.exitedFoundingBanner = await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll('button')).find((x) => /Wyjdź/.test(x.textContent || ''));
      if (b) b.click();
      return !!b;
    });
    await wait(1000);
    result.overlayZalozMiasto = await page.evaluate(() => /ZAŁÓŻ MIASTO/i.test(document.body.innerText || ''));
    result.uiZoomPct = await page.evaluate(() => {
      const el = document.querySelector('.civ-hud-util-dock .civ-hud-zoom-pct');
      return el ? el.textContent.trim() : null;
    });

    const box = await page.locator('canvas').first().boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    const wheel = async (dir, n) => { for (let i = 0; i < n; i += 1) { await page.mouse.wheel(0, dir * 120); await wait(120); } await wait(1200); };
    // Widok calej mapy: maksymalne oddalenie kamery (clamp do maxDist).
    await wheel(+1, 40);
    result.steps.outSteps = 40;
    await page.screenshot({ path: path.join(outDir, `${label}-cala-mapa.png`) });
    // Zblizenie: 6 krokow w gore od maksymalnego oddalenia (0,88^6 = 0,46 odleglosci).
    await wheel(-1, 6);
    result.steps.inStepsFromOut = 6;
    await page.screenshot({ path: path.join(outDir, `${label}-zblizenie-2x.png`) });
    // Dalsze zblizenia (kolejne 6 krokow w gore = x0,46 odleglosci): 4x i 8x wzgledem widoku calej mapy (przyblizenie).
    await wheel(-1, 6);
    result.steps.inStepsTotal4x = 12;
    await page.screenshot({ path: path.join(outDir, `${label}-zblizenie-4x.png`) });
    await wheel(-1, 6);
    result.steps.inStepsTotal8x = 18;
    await page.screenshot({ path: path.join(outDir, `${label}-zblizenie-8x.png`) });
    // FPS w tym samym widoku (zblizenie 8x; przy FPS_REPS=0 pomijany).
    for (let rep = 1; rep <= FPS_REPS; rep += 1) {
      await wait(1500);
      const m = await page.evaluate((windowMs) => new Promise((resolve) => {
        const frames = []; let last = null; const end = performance.now() + windowMs;
        const step = (ts) => {
          if (last !== null) frames.push(ts - last);
          last = ts;
          if (performance.now() < end) requestAnimationFrame(step);
          else {
            const avg = frames.reduce((a, b) => a + b, 0) / Math.max(1, frames.length);
            resolve({ n: frames.length, avgFrameMs: +avg.toFixed(2), fps: +(1000 / avg).toFixed(3) });
          }
        };
        requestAnimationFrame(step);
      }), FPS_WINDOW_MS);
      result.fps.push(m);
      console.log(`[${label}] FPS rep${rep}: ${JSON.stringify(m)}`);
    }
  } catch (e) {
    result.fatal = String(e).slice(0, 300);
  } finally {
    await browser.close().catch(() => {});
  }
  result.totalMs = Date.now() - t00;
  fs.writeFileSync(path.join(outDir, `${label}-wynik.json`), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
})();
