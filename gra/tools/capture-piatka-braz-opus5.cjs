'use strict';
/**
 * capture-piatka-braz-opus5.cjs — zrzuty ekranu (ogolny + 7x zblizenie) z
 * dyspozycje/PODGLAD-PIATKA-BRAZ-OPUS5.html (plik statyczny, zaden serwer
 * nie jest potrzebny — otwierany bezposrednio przez file://).
 *
 * Uruchamiac z katalogu gra/:  node tools/capture-piatka-braz-opus5.cjs
 *
 * Wymaga zbudowanego wczesniej: node tools/build-piatka-braz-opus5-preview.cjs
 */
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const HTML = path.join(__dirname, '..', '..', 'dyspozycje', 'PODGLAD-PIATKA-BRAZ-OPUS5.html');
const OUT_DIR = process.argv[2] || path.join(__dirname, '..', '..', '..', 'scratchpad-screens');
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({
    executablePath: CHROME,
    args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const page = await browser.newPage({ viewport: { width: 2000, height: 760 } });
  await page.goto('file://' + HTML, { waitUntil: 'load' });
  await page.waitForFunction(() => !!(window).__demo, { timeout: 15000 });

  // ---- ogolny: wszystkie 7 hexow w rzedzie, kat 52° ----
  await page.evaluate(() => (window).__demo.setOverview());
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(OUT_DIR, '00-ogolny-7-modeli.png') });
  console.log('OK: 00-ogolny-7-modeli.png');

  // pomiary numeryczne (bbox, mesh/tri) prosto z three.js — dokladniejsze niz
  // cokolwiek dalbyby sie wyczytac z obrazka
  const stats = await page.evaluate(() => (window).__demo.measureAll());
  fs.writeFileSync(path.join(OUT_DIR, 'pomiary.json'), JSON.stringify(stats, null, 2));
  console.log('OK: pomiary.json');
  for (const s of stats) {
    console.log(
      `${s.id.padEnd(18)} h=${s.heightRatio.toFixed(3)}xHEX_R  maxR=${s.maxRadiusRatio.toFixed(3)}xHEX_R  ` +
      `minY=${s.minY.toFixed(4)}  mesh=${s.mesh}  tri=${s.tri}`
    );
  }

  // ---- zblizenia: jeden per model, viewport bardziej kwadratowy ----
  await page.setViewportSize({ width: 1100, height: 1000 });
  const ids = await page.evaluate(() => (window).__demo.ids);
  for (let i = 0; i < ids.length; i++) {
    await page.evaluate((idx) => (window).__demo.setFocus(idx), i);
    await page.waitForTimeout(200);
    const file = `0${i + 1}-zblizenie-${ids[i]}.png`;
    await page.screenshot({ path: path.join(OUT_DIR, file) });
    console.log('OK: ' + file);
  }

  await browser.close();
  console.log('\nZapisano zrzuty w: ' + OUT_DIR);
}

main().catch((err) => {
  console.error('FAIL:', err && err.stack || err);
  process.exit(1);
});
