'use strict';
/**
 * capture-palisada-wdrozenie.cjs — PNG WDROZONEJ palisady (model gry
 * miasto-kamien.ts, wal w stylu Biskupin). Weryfikacja po wdrozeniu 2026-07-30.
 *
 * Uruchamiac z katalogu gra/:
 *   node tools/build-palisada-preview.cjs ../docs/ux/preview-palisada/_tmp/preview-wdrozenie.html
 *   node tools/capture-palisada-wdrozenie.cjs
 *
 * Wynik: docs/ux/preview-palisada/wdrozenie-biskupin-kamien.png (zblizenie)
 *        docs/ux/preview-palisada/wdrozenie-biskupin-oba.png     (kamien + braz)
 */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const GRA = path.resolve(__dirname, '..');
const ROOT = path.resolve(GRA, '..');
const OUT = path.join(ROOT, 'docs', 'ux', 'preview-palisada');
const HTML = path.join(OUT, '_tmp', 'preview-wdrozenie.html');

const SHOTS = [
  { file: 'wdrozenie-biskupin-kamien.png', kind: 'kamien', focus: 'kamien' },
  { file: 'wdrozenie-biskupin-oba.png', kind: 'both', overview: true },
];

async function main() {
  if (!fs.existsSync(HTML)) {
    console.error('Brak ' + HTML + ' — uruchom najpierw: node tools/build-palisada-preview.cjs ' +
      '../docs/ux/preview-palisada/_tmp/preview-wdrozenie.html');
    process.exit(1);
  }

  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--enable-webgl', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  try {
    await page.goto('file://' + HTML.replace(/\\/g, '/'), { waitUntil: 'load', timeout: 60000 });
    await page.waitForFunction(() => document.body.dataset.ready === '1', { timeout: 30000 });
    await page.waitForFunction(() => !!window.__demo, { timeout: 15000 });

    for (const shot of SHOTS) {
      await page.evaluate((kind) => window.__demo.setKind(kind), shot.kind);
      await page.waitForTimeout(400);
      if (shot.focus) await page.evaluate((id) => window.__demo.setFocus(id), shot.focus);
      else await page.evaluate(() => window.__demo.setOverview());
      await page.waitForTimeout(500);
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
      await page.screenshot({ path: path.join(OUT, shot.file), fullPage: false });
      console.log('OK: ' + shot.file);
    }
    console.log('\nZapisano w: ' + OUT);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('FAIL:', err.message || err);
  process.exit(1);
});
