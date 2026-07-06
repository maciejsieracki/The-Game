/**
 * Baseline screenshoty — Grupa B (lane UI).
 * Uruchom: node tools/baseline-screenshots-grupa-b.mjs
 * Wymaga: python -m http.server 9876 w katalogu root projektu
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const OUT = path.join(ROOT, 'docs/ux/baseline/B');
const BASE_URL = process.env.BASELINE_URL ?? 'http://127.0.0.1:9876';

async function shot(page, name) {
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, type: 'png' });
  console.log('OK', name);
}

async function waitCityPanel(page) {
  await page.goto(`${BASE_URL}/Gra-podglad-PLAYTEST-MIASTO.html`, {
    waitUntil: 'load',
    timeout: 180_000,
  });
  await page.waitForSelector('.civ-ux-frame', { timeout: 120_000 });
  await page.waitForTimeout(2000);
}

async function clickRailIndex(page, index) {
  const btn = page.locator('#cs-icon-rail .civ-v-icon-btn').nth(index);
  await btn.click();
  await page.waitForTimeout(700);
}

async function main() {
  await mkdir(OUT, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--enable-webgl', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage({
    viewport: { width: 1600, height: 900 },
    deviceScaleFactor: 1,
  });

  try {
    await waitCityPanel(page);

    await shot(page, 'B-01_panel-miasta-pelny.png');

    const topBar = page.locator('.civ-v-resource-bar');
    if (await topBar.count()) {
      await topBar.first().screenshot({
        path: path.join(OUT, 'B-02_pasek-zasobow.png'),
        type: 'png',
      });
      console.log('OK B-02_pasek-zasobow.png');
    }

    await clickRailIndex(page, 0);
    await shot(page, 'B-15_budowa-lista.png');

    await clickRailIndex(page, 1);
    await shot(page, 'B-17_rekrut-lista.png');

    await clickRailIndex(page, 0);
    const buildThumb = page.locator('#cs-build .item-row .mini-thumb, #cs-build .item-row .picon').first();
    if (await buildThumb.count()) {
      await buildThumb.hover();
      await page.waitForTimeout(550);
      await page
        .waitForSelector('.civ-ux-detail-dock-left.is-open, .civ-hover-detail-float', { timeout: 8000 })
        .catch(() => {});
      await page.waitForTimeout(350);
      await shot(page, 'B-29_dock-budynek-hover.png');
    } else {
      console.warn('SKIP B-29 — brak miniatur budynków');
    }

    await clickRailIndex(page, 1);
    const unitThumb = page.locator('#cs-units .item-row .mini-thumb, #cs-units .item-row .picon').first();
    if (await unitThumb.count()) {
      await unitThumb.hover();
      await page.waitForTimeout(650);
      await page
        .waitForSelector('.civ-ux-detail-dock-left.is-open, .civ-hover-detail-float', { timeout: 8000 })
        .catch(() => {});
      await page.waitForTimeout(450);
      await shot(page, 'B-30_dock-jednostka-3d.png');
    } else {
      console.warn('SKIP B-30 — brak miniatur jednostek');
    }

    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);

    // Nauka — osobny playtest mapy (toolbar widoczny)
    await page.goto(`${BASE_URL}/Gra-podglad-PLAYTEST-MAPA.html`, {
      waitUntil: 'load',
      timeout: 180_000,
    });
    await page.waitForSelector('.civ-map-toolbar', { timeout: 120_000 });
    await page.waitForTimeout(2000);

    await page.locator('.civ-map-toolbar [data-act="science"]').click();
    await page.waitForSelector('.civ-science-hub-hud.open', { timeout: 15_000 });
    await page.waitForTimeout(600);
    await shot(page, 'B-33_hub-nauki.png');

    await page.locator('.sh-tree-btn').click();
    await page.waitForSelector('.civ-sci.dock, .civ-sci-overlay.dock', { timeout: 15_000 });
    await page.waitForTimeout(1000);
    await shot(page, 'B-34_drzewko-tech.png');

    console.log('\nGrupa B baseline — zakończono.');
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
