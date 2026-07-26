/**
 * Podgląd UI panelu miasta (bieżący gra/src via Vite dev).
 * Wymaga: node ./node_modules/vite/bin/vite.js --port 5173 (w gra/)
 * Uruchom: node tools/preview-city-ui-screenshots.cjs
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '../..');
const OUT = path.join(ROOT, 'docs/ux/preview-city-panel');
const BASE = process.env.PREVIEW_URL || 'http://127.0.0.1:5173/?playtest=miasto';

async function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function shot(page, name, opts = {}) {
  const file = path.join(OUT, name);
  if (opts.locator) {
    await opts.locator.screenshot({ path: file, type: 'png' });
  } else {
    await page.screenshot({ path: file, type: 'png', fullPage: false, ...opts });
  }
  console.log('OK', name);
}

async function clickRailTab(page, labelPart) {
  const btn = page.locator(`button.civ-v-icon-btn[aria-label*="${labelPart}"]`).first();
  await btn.waitFor({ state: 'visible', timeout: 20000 });
  const pressed = await btn.getAttribute('aria-pressed');
  if (pressed === 'true') {
    await wait(300);
    return;
  }
  await btn.evaluate((el) => el.click());
  await wait(900);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--enable-webgl', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
  });

  try {
    console.log('Otwieram', BASE);
    await page.goto(BASE, { waitUntil: 'load', timeout: 180000 });
    await page.waitForSelector('.civ-ux-frame, .civ-cs', { timeout: 120000 });
    await wait(4500);

    await shot(page, '01_panel-miasta-pelny.png');

    const topStack = page.locator('.civ-v-top-stack, .civ-v-city-header').first();
    if (await topStack.count()) {
      await shot(page, '02_naglowek-miasta-nawigacja.png', { locator: topStack });
    }

    const resourceBar = page.locator('.civ-v-resource-bar').first();
    if (await resourceBar.count()) {
      await shot(page, '03_pasek-zasobow-gora.png', { locator: resourceBar });
    }

    await clickRailTab(page, 'Budowa');
    await page.waitForSelector('#cs-build, .bld-catalog-meta', { timeout: 20000 });
    await wait(500);
    await shot(page, '04_zakladka-budowa-pelna.png');

    const resStrip = page.locator('.cs-res-strip, .civ-cs-res-strip').first();
    if (await resStrip.count()) {
      await shot(page, '05_pasek-surowcow-budowa-32px.png', { locator: resStrip });
    } else {
      const buildArea = page.locator('#cs-build').first();
      if (await buildArea.count()) {
        await shot(page, '05_pasek-surowcow-budowa-32px.png', { locator: buildArea });
      }
    }

    const ownedBar = page.locator('.civ-v-build-owned-bar, .bld-owned-compact-mount').first();
    if (await ownedBar.count()) {
      await ownedBar.scrollIntoViewIfNeeded();
      await wait(300);
      await shot(page, '06_budynki-w-miescie-kompakt.png', { locator: ownedBar });
    }

    const groupToggle = page.locator('.bld-owned-compact-mount details.bld-group summary.bld-group-h').first();
    if (await groupToggle.count()) {
      await groupToggle.click({ force: true });
      await wait(400);
      await shot(page, '07_budynki-grupa-rozwinieta.png');
    }

    await clickRailTab(page, 'rekrutacji');
    await page
      .waitForSelector('#cs-units, .unit-recruit-scroll, .recruit-scroll, .unit-recruit-card', {
        timeout: 25000,
      })
      .catch(() => {});
    await wait(700);
    await shot(page, '09_zakladka-rekrutacja.png');

    const recruitStrip = page
      .locator('#cs-units .cs-res-strip, #cs-units .civ-cs-res-strip, .civ-v-split-col .cs-res-strip')
      .first();
    if (await recruitStrip.count()) {
      await shot(page, '10_pasek-surowcow-rekrutacja-32px.png', { locator: recruitStrip });
    }

    await clickRailTab(page, 'Budowa');
    await wait(500);

    const ownedRow = page.locator('.bld-owned-row--tight, .bld-owned-row').first();
    if (await ownedRow.count()) {
      await ownedRow.click({ force: true });
      await wait(600);
      await page
        .waitForSelector('.civ-ux-detail-dock-left.is-open, .civ-hover-detail-dock.is-open', {
          timeout: 8000,
        })
        .catch(() => {});
      await wait(350);
      await shot(page, '08_budynek-w-miescie-panel-boczny.png');
    }

    const civTop = page.locator('.civ-ux-top').first();
    if (await civTop.count()) {
      await shot(page, '11_gorny-pasek-civpedia-menu.png', { locator: civTop });
    }

    console.log('\nZapisano w:', OUT);
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
