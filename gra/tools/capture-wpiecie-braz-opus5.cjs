'use strict';
/**
 * capture-wpiecie-braz-opus5.cjs — zrzuty z podglądu wpięcia (plik statyczny,
 * otwierany przez file://, żaden serwer nie jest potrzebny).
 *
 * Uruchamiać z katalogu gra/:
 *   node tools/build-wpiecie-braz-opus5-preview.cjs
 *   node tools/capture-wpiecie-braz-opus5.cjs <katalog-na-zrzuty>
 */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const HTML = path.join(__dirname, '.wpiecie-braz-opus5-preview.html');
const OUT_DIR = process.argv[2];
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

if (!OUT_DIR) { console.error('Podaj katalog na zrzuty.'); process.exit(1); }

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({
    executablePath: CHROME,
    args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const page = await browser.newPage({ viewport: { width: 2400, height: 900 } });
  await page.goto('file://' + HTML, { waitUntil: 'load' });
  await page.waitForFunction(() => !!window.__demo, { timeout: 20000 });

  await page.evaluate(() => window.__demo.setOverview());
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT_DIR, '00-rzad-7-modeli-52deg.png') });

  const stats = await page.evaluate(() => window.__demo.measureAll());
  fs.writeFileSync(path.join(OUT_DIR, 'pomiary.json'), JSON.stringify(stats, null, 2));
  for (const s of stats) {
    console.log(
      `${s.id.padEnd(18)} h=${s.heightRatio.toFixed(3)}  maxR=${s.maxRadiusRatio.toFixed(3)}  ` +
      `minY=${s.minY.toFixed(4)}  mesh=${s.mesh}  tri=${s.tri}`,
    );
  }

  await page.setViewportSize({ width: 1100, height: 1000 });
  const ids = await page.evaluate(() => window.__demo.ids);
  for (let i = 0; i < ids.length; i++) {
    await page.evaluate((k) => window.__demo.setFocus(k), i);
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(OUT_DIR, `0${i + 1}-blisko-${ids[i]}.png`) });
  }
  // dodatkowo: Włócznik prawie z boku (elewacja 12°) — dowód na wysokość tarczy
  await page.evaluate(() => window.__demo.setSide(0));
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(OUT_DIR, '08-wlocznik-z-boku.png') });
  await page.evaluate(() => window.__demo.setSide(1));
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(OUT_DIR, '09-miecznik-z-boku.png') });

  await browser.close();
  console.log('\nZrzuty w: ' + OUT_DIR);
}

main().catch((e) => { console.error('FAIL:', (e && e.stack) || e); process.exit(1); });
