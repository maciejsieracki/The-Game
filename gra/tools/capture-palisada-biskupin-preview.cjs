'use strict';
/**
 * capture-palisada-biskupin-preview.cjs — PNG propozycji palisady Biskupin.
 * Uruchamiać z katalogu gra/:
 *   node tools/build-palisada-biskupin-preview.cjs
 *   node tools/capture-palisada-biskupin-preview.cjs
 */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const GRA = path.resolve(__dirname, '..');
const ROOT = path.resolve(GRA, '..');
const OUT = path.join(ROOT, 'docs', 'ux', 'preview-palisada');
const TMP = path.join(OUT, '_tmp');
const HTML = path.join(TMP, 'preview-biskupin.html');

const SHOTS = [
  { file: 'ref-styl-biskupin-kamien.png', kind: 'kamien', focus: 'kamien' },
  { file: 'ref-styl-biskupin-braz.png', kind: 'braz', focus: 'braz' },
];

async function main() {
  if (!fs.existsSync(HTML)) {
    console.error('Brak ' + HTML + ' — uruchom najpierw: node tools/build-palisada-biskupin-preview.cjs');
    process.exit(1);
  }

  fs.mkdirSync(OUT, { recursive: true });

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
      await page.evaluate((id) => window.__demo.setFocus(id), shot.focus);
      await page.waitForTimeout(500);
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
      const outPath = path.join(OUT, shot.file);
      await page.screenshot({ path: outPath, fullPage: false });
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
