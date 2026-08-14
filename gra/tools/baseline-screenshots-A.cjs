'use strict';
/**
 * baseline-screenshots-a.cjs — Grupa A UX baseline (PRZED redesignem).
 * Run from gra/: node tools/baseline-screenshots-a.cjs
 *
 * Wymaga: playwright (devDependency), build kanonu w root (Gra-podglad-PLAYTEST-MAPA.html).
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(ROOT, 'docs', 'ux', 'baseline', 'A');
const PORT = 9876;
const URL = `http://127.0.0.1:${PORT}/Gra-podglad-PLAYTEST-MAPA.html`;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.json': 'application/json',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};

function startServer() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      try {
        const rel = decodeURIComponent((req.url || '/').split('?')[0].replace(/^\//, '')) || 'Gra-podglad.html';
        let filePath = path.join(ROOT, rel);
        if (!filePath.startsWith(ROOT)) {
          res.writeHead(403); res.end(); return;
        }
        if (!fs.existsSync(filePath)) {
          res.writeHead(404); res.end('Not found'); return;
        }
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) filePath = path.join(filePath, 'index.html');
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        fs.createReadStream(filePath).pipe(res);
      } catch (e) {
        res.writeHead(500); res.end(String(e));
      }
    });
    srv.listen(PORT, '127.0.0.1', () => resolve(srv));
  });
}

async function shotEl(page, selector, filename, pad = 4) {
  const loc = page.locator(selector).first();
  await loc.waitFor({ state: 'visible', timeout: 45000 });
  const box = await loc.boundingBox();
  if (!box) throw new Error('No bbox: ' + selector);
  await page.screenshot({
    path: path.join(OUT, filename),
    clip: {
      x: Math.max(0, box.x - pad),
      y: Math.max(0, box.y - pad),
      width: box.width + pad * 2,
      height: box.height + pad * 2,
    },
  });
  console.log('  OK', filename);
}

async function shotViewport(page, filename) {
  await page.screenshot({ path: path.join(OUT, filename), fullPage: false });
  console.log('  OK', filename);
}

async function waitMapReady(page) {
  await page.waitForSelector('.civ-hud', { timeout: 60000 });
  await page.waitForSelector('canvas', { timeout: 60000 });
  await page.waitForTimeout(2500);
}

async function clickToolbar(page, act) {
  await page.locator(`.civ-map-toolbar .tb[data-act="${act}"]`).click();
  await page.waitForTimeout(400);
}

async function tryOpenPreBattle(page) {
  await clickToolbar(page, 'army');
  await page.waitForSelector('.civ-army-list-hud.open', { timeout: 10000 });
  await page.locator('.civ-army-list-hud .sl-item').first().click();
  await page.waitForTimeout(600);
  const canvas = page.locator('canvas').first();
  const box = await canvas.boundingBox();
  if (!box) return false;
  const taps = [
    [0.52, 0.48], [0.58, 0.45], [0.55, 0.52], [0.62, 0.50],
    [0.48, 0.42], [0.65, 0.48], [0.50, 0.55],
  ];
  for (const [fx, fy] of taps) {
    await page.mouse.click(box.x + box.width * fx, box.y + box.height * fy);
    await page.waitForTimeout(450);
    if (await page.getByText('Uwarunkowania bitwy').count() > 0) return true;
    if (await page.getByText('Oblężaj').count() > 0) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }
  }
  return false;
}

async function main() {
  if (!fs.existsSync(path.join(ROOT, 'Gra-podglad-PLAYTEST-MAPA.html'))) {
    console.error('Brak Gra-podglad-PLAYTEST-MAPA.html — zbuduj kanon najpierw.');
    process.exit(1);
  }
  fs.mkdirSync(OUT, { recursive: true });

  const srv = await startServer();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1600, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  try {
    console.log('Ładowanie', URL);
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await waitMapReady(page);

    console.log('Zrzuty obowiązkowe:');
    await shotEl(page, '.civ-hud', 'A-01_hud-gora.png', 0);
    await shotEl(page, '.civ-map-toolbar', 'A-02_toolbar.png');
    await shotEl(page, '.civ-bottom-bar', 'A-03_dolny-pasek.png');
    await shotEl(page, '.civ-side-panel', 'A-04_panel-wydarzen.png');

    await clickToolbar(page, 'army');
    await page.waitForSelector('.civ-army-list-hud.open', { timeout: 10000 });
    await page.locator('.civ-army-list-hud .sl-item').first().click();
    await page.waitForTimeout(800);
    const stackPanel = page.locator('.civ-army-stack.open');
    const unitPanel = page.locator('.civ-unit-panel.open');
    if (await stackPanel.count() > 0) {
      await shotViewport(page, 'A-06_panel-jednostki.png');
    } else if (await unitPanel.count() > 0) {
      await shotViewport(page, 'A-06_panel-jednostki.png');
    } else {
      console.warn('  WARN: brak panelu jednostki w silniku — fallback mockup');
      await page.goto(`http://127.0.0.1:${PORT}/UI/Makieta-panel-jednostki.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(800);
      await shotViewport(page, 'A-06_panel-jednostki.png');
    }
    await page.goto(URL, { waitUntil: 'domcontentloaded' });
    await waitMapReady(page);

    await clickToolbar(page, 'diplo');
    await page.waitForSelector('.civ-diplo-list-hud.open');
    await shotEl(page, '.civ-diplo-list-hud.open', 'A-11_lista-dyplomacji.png');

    await clickToolbar(page, 'diplo');
    await page.waitForTimeout(300);

    await clickToolbar(page, 'build');
    await page.waitForSelector('.civ-build-panel', { timeout: 10000 });
    await shotViewport(page, 'A-08_tryb-budowy.png');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);

    console.log('Pre-bitwa (próba interakcji mapy):');
    const gotPb = await tryOpenPreBattle(page);
    if (gotPb) {
      await shotViewport(page, 'A-16_pre-bitwa.png');
      await page.keyboard.press('Escape');
    } else {
      console.warn('  WARN: nie udało się otworzyć pre-bitwy — fallback mockup HTML');
      await page.goto(`http://127.0.0.1:${PORT}/UI/Makieta-preBattle.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(800);
      await shotViewport(page, 'A-16_pre-bitwa.png');
      console.log('  OK A-16_pre-bitwa.png (z mockupu HTML — dopisz w README)');
    }

    const count = fs.readdirSync(OUT).filter(f => f.endsWith('.png')).length;
    console.log('\nBaseline Grupa A:', count, 'plików →', OUT);
  } finally {
    await browser.close();
    srv.close();
  }
}

main().catch((e) => {
  console.error('[baseline-A]', e);
  process.exit(1);
});
