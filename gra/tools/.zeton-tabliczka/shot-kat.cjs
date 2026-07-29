/**
 * shot-kat.cjs — zrzut + ODCZYT POMIARU z testu obrotu kamery.
 * Uruchamiać z katalogu gra/:
 *   node tools/.zeton-tabliczka/shot-kat.cjs <katalog-wyjsciowy>
 */
const path = require('path');
const fs = require('fs');
const { chromium } = require(path.join(__dirname, '..', '..', 'node_modules', 'playwright'));

const DIST = path.resolve(__dirname, '..', '.zeton-tabliczka-kat-dist', 'kat.html');
const OUT = process.argv[2];
if (!OUT) { console.error('Uzycie: node tools/.zeton-tabliczka/shot-kat.cjs <out-dir>'); process.exit(1); }
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    headless: true,
    args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.error('PAGEERROR', e.message));
  await page.goto('file://' + DIST, { waitUntil: 'load' });
  await page.waitForSelector('body[data-gotowe="1"]', { timeout: 60000 });
  const pomiar = await page.evaluate(() => document.body.dataset.pomiar);
  console.log('POMIAR ' + pomiar);
  await page.locator('#box-kat').screenshot({ path: path.join(OUT, 'tabliczka-kat.png'), type: 'png' });
  console.log('OK tabliczka-kat.png');
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
