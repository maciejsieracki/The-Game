/**
 * shot.cjs — zrzuty podglądu tabliczki jednostki (R-ZETON-PASKI).
 * Uruchamiać z katalogu gra/:
 *   node tools/.zeton-tabliczka/shot.cjs <katalog-wyjsciowy>
 * Wymaga wcześniejszego zbudowania podglądu (vite build --config .../vite.config.ts).
 */
const path = require('path');
const fs = require('fs');
const { chromium } = require(path.join(__dirname, '..', '..', 'node_modules', 'playwright'));

const DIST = path.resolve(__dirname, '..', '.zeton-tabliczka-dist', 'index.html');
const OUT = process.argv[2];
if (!OUT) { console.error('Uzycie: node tools/.zeton-tabliczka/shot.cjs <out-dir>'); process.exit(1); }
fs.mkdirSync(OUT, { recursive: true });

const CELE = [
  ['#box-blisko', 'tabliczka-blisko.png'],
  ['#box-stany', 'tabliczka-stany.png'],
  ['#box-daleko', 'tabliczka-daleko.png'],
  ['#box-stos', 'tabliczka-stos.png'],
  ['#box-zoom', 'tabliczka-zoom-drabinka.png'],
];

(async () => {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    headless: true,
    args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.error('PAGEERROR', e.message));
  page.on('console', (m) => { if (m.type() === 'error') console.error('CONSOLE', m.text()); });
  await page.goto('file://' + DIST, { waitUntil: 'load' });
  await page.waitForSelector('body[data-gotowe="1"]', { timeout: 60000 });
  for (const [sel, name] of CELE) {
    await page.locator(sel).screenshot({ path: path.join(OUT, name), type: 'png' });
    console.log('OK', name);
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
