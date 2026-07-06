/**
 * Baseline screenshoty UX — Grupa B (miasto, ekonomia, nauka).
 * Uruchom: node tools/baseline-screenshots-B.cjs
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '../..');
const OUT = path.join(ROOT, 'docs/ux/baseline/B');
const PLAYTEST_MIASTO = path.join(ROOT, 'Gra-podglad-PLAYTEST-MIASTO.html');
const PLAYTEST_MAPA = path.join(ROOT, 'Gra-podglad-PLAYTEST-MAPA.html');

async function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function fileUrl(absPath) {
  return 'file:///' + absPath.replace(/\\/g, '/').replace(/ /g, '%20');
}

async function waitCityPanel(page) {
  await page.waitForSelector('.civ-v-resource-bar, .civ-cs, #cs-build', { timeout: 120000 });
  await wait(3500);
}

async function clickRailTab(page, labelPart) {
  const btn = page.locator(`button.civ-v-icon-btn[aria-label*="${labelPart}"]`).first();
  await btn.waitFor({ state: 'visible', timeout: 15000 });
  await btn.click();
  await wait(600);
}

async function captureCityScreenshots(page) {
  await page.screenshot({ path: path.join(OUT, 'B-01_panel-miasta-pelny.png'), fullPage: false });
  console.log('OK B-01');

  const topBar = page.locator('.civ-v-resource-bar').first();
  if (await topBar.count()) {
    await topBar.screenshot({ path: path.join(OUT, 'B-02_pasek-zasobow.png') });
  } else {
    await page.screenshot({ path: path.join(OUT, 'B-02_pasek-zasobow.png'), clip: { x: 0, y: 0, width: 1920, height: 80 } });
  }
  console.log('OK B-02');

  await clickRailTab(page, 'Budowa');
  await page.waitForSelector('#cs-build, .bld-catalog-meta, .ptitle', { timeout: 15000 });
  await wait(400);
  await page.screenshot({ path: path.join(OUT, 'B-15_budowa-lista.png'), fullPage: false });
  console.log('OK B-15');

  const buildThumb = page.locator('.mini-thumb, .item-thumb').first();
  if (await buildThumb.count()) {
    await buildThumb.scrollIntoViewIfNeeded();
    await buildThumb.hover();
    await wait(450);
    await page.waitForSelector('.civ-hover-detail-dock.is-open, .civ-hover-detail-float[style*="block"]', { timeout: 4000 }).catch(() => {});
    await wait(200);
    await page.screenshot({ path: path.join(OUT, 'B-29_dock-budynek-hover.png'), fullPage: false });
    console.log('OK B-29');
  } else {
    console.warn('WARN B-29: brak miniatury budynku — fallback pełny ekran');
    await page.screenshot({ path: path.join(OUT, 'B-29_dock-budynek-hover.png'), fullPage: false });
  }

  await clickRailTab(page, 'Jednostki');
  await page.waitForSelector('.recruit-scroll, #cs-units, .unit-row-thumb', { timeout: 15000 });
  await wait(600);
  await page.screenshot({ path: path.join(OUT, 'B-17_rekrut-lista.png'), fullPage: false });
  console.log('OK B-17');

  const unitThumb = page.locator('.recruit-scroll .mini-thumb, .recruit-scroll .item-row.hover-detail-anchor').first();
  if (await unitThumb.count()) {
    await unitThumb.scrollIntoViewIfNeeded();
    await unitThumb.hover();
    await wait(450);
    await page.waitForSelector('.civ-hover-detail-dock.is-open, .civ-hover-detail-float[style*="block"]', { timeout: 4000 }).catch(() => {});
    await wait(200);
    await page.screenshot({ path: path.join(OUT, 'B-30_dock-jednostka-3d.png'), fullPage: false });
    console.log('OK B-30');
  } else {
    console.warn('WARN B-30: brak miniatury jednostki — fallback pełny ekran');
    await page.screenshot({ path: path.join(OUT, 'B-30_dock-jednostka-3d.png'), fullPage: false });
  }

  await captureScienceScreenshots(page);
}

async function captureScienceScreenshots(page) {
  if (!fs.existsSync(PLAYTEST_MAPA)) {
    console.error('Brak Gra-podglad-PLAYTEST-MAPA.html:', PLAYTEST_MAPA);
    return;
  }
  console.log('Otwieram playtest mapa (hub nauki)…');
  await page.goto(fileUrl(PLAYTEST_MAPA), { waitUntil: 'load', timeout: 120000 });
  await page.waitForSelector('.civ-map-toolbar', { timeout: 120000 });
  await wait(4000);

  const scienceBtn = page.locator('.civ-map-toolbar button[data-act="science"]').first();
  await scienceBtn.waitFor({ state: 'visible', timeout: 30000 });
  await scienceBtn.click();
  await page.waitForSelector('.civ-science-hub-hud.open', { timeout: 15000 });
  await wait(500);
  await page.screenshot({ path: path.join(OUT, 'B-33_hub-nauki.png'), fullPage: false });
  console.log('OK B-33');

  const treeBtn = page.locator('.sh-tree-btn').first();
  await treeBtn.waitFor({ state: 'visible', timeout: 10000 });
  await treeBtn.click();
  await page.waitForSelector('.civ-sci.dock, .civ-sci-overlay.dock', { timeout: 15000 });
  await wait(800);
  await page.screenshot({ path: path.join(OUT, 'B-34_drzewko-tech.png'), fullPage: false });
  console.log('OK B-34');
}

async function main() {
  if (!fs.existsSync(PLAYTEST_MIASTO)) {
    console.error('Brak Gra-podglad-PLAYTEST-MIASTO.html:', PLAYTEST_MIASTO);
    process.exit(1);
  }
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  console.log('Otwieram playtest miasto…');
  await page.goto(fileUrl(PLAYTEST_MIASTO), { waitUntil: 'load', timeout: 120000 });
  await waitCityPanel(page);
  await captureCityScreenshots(page);

  await browser.close();
  const count = fs.readdirSync(OUT).filter(f => f.endsWith('.png')).length;
  console.log('Grupa B baseline:', count, 'plików w', OUT);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
