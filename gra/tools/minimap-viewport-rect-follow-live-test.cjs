'use strict';
/**
 * minimap-viewport-rect-follow-live-test.cjs
 * TEMAT: R-WEB-MINIMAP-VIEWPORT-RECT-FOLLOW-Q1 — żywy dowód w Chromium, że biała ramka widoku na minimapie
 * PODĄŻA za kamerą (klik w minimapę = skok kamery; scroll = zoom), a nie stoi w jednym miejscu.
 *
 * Użycie (bundle budowany wcześniej przez `vite build` POZA repo, np. do katalogu tymczasowego):
 *   CIV_MM_BUNDLE=/abs/dir/z/index.html node tools/minimap-viewport-rect-follow-live-test.cjs
 *
 * Odczyt: ramka = piksele prawie białe (R,G,B >= 235) na canvasie minimapy (`.civ-minimap-hud canvas`);
 * raportowany jest bounding box tych pikseli PRZED i PO ruchu kamery. Test przechodzi tylko gdy ramka się
 * przesunęła w stronę kliknięcia oraz (osobno) zmieniła rozmiar przy zoomie.
 */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const GRA = path.resolve(__dirname, '..');
const BUNDLE = process.env.CIV_MM_BUNDLE;
if (!BUNDLE || !fs.existsSync(path.join(BUNDLE, 'index.html'))) {
  console.error('Brak CIV_MM_BUNDLE (katalog z index.html po vite build).');
  process.exit(2);
}
const SHOTS = process.env.CIV_MM_SHOTS || null;

let chromium;
try { ({ chromium } = require(path.join(GRA, 'node_modules', 'playwright'))); }
catch (e) { console.error('Brak playwright w gra/node_modules:', e.message); process.exit(2); }
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const wait = ms => new Promise(r => setTimeout(r, ms));

async function launch() {
  try { return await chromium.launch({ headless: true }); }
  catch (_e) {
    return chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] });
  }
}

/** Bounding box pikseli prawie białych (ramka widoku) na canvasie minimapy. */
async function viewportBox(page) {
  return page.evaluate(() => {
    const c = document.querySelector('.civ-minimap-hud canvas');
    if (!c) return null;
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let minX = Infinity, minY = Infinity, maxX = -1, maxY = -1, n = 0;
    for (let y = 0; y < c.height; y++) {
      for (let x = 0; x < c.width; x++) {
        const i = (y * c.width + x) * 4;
        if (d[i] >= 195 && d[i + 1] >= 195 && d[i + 2] >= 195) {
          n++;
          if (x < minX) minX = x; if (x > maxX) maxX = x;
          if (y < minY) minY = y; if (y > maxY) maxY = y;
        }
      }
    }
    return n === 0 ? null : { minX, minY, maxX, maxY, w: maxX - minX + 1, h: maxY - minY + 1, n };
  });
}

async function shot(page, label, clip) {
  if (!SHOTS) return;
  fs.mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: path.join(SHOTS, label + '.png'), clip });
}

async function main() {
  const browser = await launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e && e.message || e)));
  try {
    await page.goto('file://' + path.join(BUNDLE, 'index.html') + '?playtest=mapa', { waitUntil: 'load', timeout: 120000 });
    await page.waitForSelector('.civ-hud', { timeout: 120000 });
    for (let i = 0; i < 90; i++) {
      if ((await page.locator('text=Tworzenie świata').count()) === 0) break;
      await wait(1000);
    }
    await page.waitForFunction(
      () => !!window.__eraTestDebug && window.__eraTestDebug.getWorldState().citiesLen > 0
        && window.__eraTestDebug.getWorldState().turn === 1,
      undefined, { timeout: 120000 },
    );
    await page.waitForSelector('.civ-minimap-hud canvas', { timeout: 30000 });
    await wait(600);

    const canvas = page.locator('.civ-minimap-hud canvas');
    const cbox = await canvas.boundingBox();
    const clip = { x: cbox.x - 10, y: cbox.y - 10, width: cbox.width + 20, height: cbox.height + 20 };

    const r0 = await viewportBox(page);
    assert.ok(r0, 'ramka widoku widoczna na starcie');
    await shot(page, '1-start', clip);
    console.log('START ramka:', JSON.stringify(r0));

    // (1) klik w minimapę w lewy-górny róg → kamera skacze tam → ramka musi przesunąć się w tę stronę
    const target = { x: 30, y: 25 };
    await canvas.click({ position: target });
    await wait(2000);
    const r1 = await viewportBox(page);
    await shot(page, '2-after-minimap-click', clip);
    console.log('PO KLIKU w minimapę ramka:', JSON.stringify(r1));
    assert.ok(r1, 'ramka widoczna po przesunięciu');
    const cx1 = (r1.minX + r1.maxX) / 2, cy1 = (r1.minY + r1.maxY) / 2;
    const moved = Math.abs(r1.minX - r0.minX) + Math.abs(r1.minY - r0.minY);
    assert.ok(moved >= 8, `ramka musi się przesunąć po kliku (przesunięcie=${moved}px)`);
    assert.ok(Math.abs(cx1 - target.x) < 40 && Math.abs(cy1 - target.y) < 30,
      `środek ramki (${cx1},${cy1}) blisko kliknięcia (${target.x},${target.y})`);

    // (2) zoom kółkiem nad mapą 3D → rozmiar ramki musi się zmienić
    await page.mouse.move(960, 540);
    await page.mouse.wheel(0, 600);
    await wait(1500);
    const r2 = await viewportBox(page);
    await shot(page, '3-after-zoom', clip);
    console.log('PO ZOOMIE ramka:', JSON.stringify(r2));
    assert.ok(r2, 'ramka widoczna po zoomie');
    const sizeChanged = r2.w !== r1.w || r2.h !== r1.h;
    assert.ok(sizeChanged, `rozmiar ramki musi się zmienić po zoomie (${r1.w}x${r1.h} -> ${r2.w}x${r2.h})`);

    assert.deepEqual(errors, [], 'brak błędów JS na stronie');
    console.log('\nOK: ramka widoku na minimapie podąża za kamerą (klik + zoom)');
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error('FAIL:', err && err.message ? err.message : err);
  process.exit(1);
});
